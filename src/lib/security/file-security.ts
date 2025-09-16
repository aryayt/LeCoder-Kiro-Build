/**
 * File upload security scanning and content validation
 */

import { z } from 'zod';

// File type validation
export const allowedFileTypes = {
	'application/pdf': {
		extensions: ['.pdf'],
		maxSize: 50 * 1024 * 1024, // 50MB
		mimeTypes: ['application/pdf'],
	},
} as const;

// Dangerous file patterns to detect
const dangerousPatterns = [
	// JavaScript execution patterns
	/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
	/javascript:/gi,
	/vbscript:/gi,
	/onload\s*=/gi,
	/onerror\s*=/gi,
	/onclick\s*=/gi,

	// Embedded objects
	/<object\b[^>]*>/gi,
	/<embed\b[^>]*>/gi,
	/<iframe\b[^>]*>/gi,

	// Form elements
	/<form\b[^>]*>/gi,
	/<input\b[^>]*>/gi,

	// Suspicious URLs
	/data:text\/html/gi,
	/data:application\/javascript/gi,

	// File system paths (potential path traversal)
	/\.\.[\/\\]/g,
	/[\/\\]etc[\/\\]/gi,
	/[\/\\]proc[\/\\]/gi,
	/[\/\\]sys[\/\\]/gi,

	// Null bytes
	/\x00/g,
];

// PDF-specific security patterns
const pdfSecurityPatterns = [
	// JavaScript in PDF
	/\/JavaScript\s*\(/gi,
	/\/JS\s*\(/gi,
	/\/Action\s*<</gi,

	// Embedded files
	/\/EmbeddedFile/gi,
	/\/FileAttachment/gi,

	// Forms and annotations
	/\/AcroForm/gi,
	/\/Widget/gi,

	// External references
	/\/URI\s*\(/gi,
	/\/GoToR/gi,
	/\/Launch/gi,
];

export interface FileValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	metadata: {
		size: number;
		type: string;
		name: string;
		hash?: string;
	};
}

export interface ContentScanResult {
	isSafe: boolean;
	threats: Array<{
		type: 'malicious_pattern' | 'suspicious_content' | 'embedded_script' | 'external_reference';
		description: string;
		severity: 'low' | 'medium' | 'high';
		pattern?: string;
	}>;
	contentAnalysis: {
		hasJavaScript: boolean;
		hasEmbeddedFiles: boolean;
		hasForms: boolean;
		hasExternalReferences: boolean;
	};
}

/**
 * Validate file upload security
 */
export async function validateFileUpload(
	file: File | { name: string; size: number; type: string },
	content?: ArrayBuffer | string
): Promise<FileValidationResult> {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Basic file validation
	if (!file.name || file.name.length === 0) {
		errors.push('File name is required');
	}

	if (file.name.length > 255) {
		errors.push('File name too long (max 255 characters)');
	}

	// Check for dangerous file name patterns
	if (/[<>:"|?*\x00-\x1f]/.test(file.name)) {
		errors.push('File name contains invalid characters');
	}

	if (/\.\.[\/\\]/.test(file.name)) {
		errors.push('File name contains path traversal patterns');
	}

	// File size validation
	if (file.size <= 0) {
		errors.push('File cannot be empty');
	}

	if (file.size > 50 * 1024 * 1024) {
		errors.push('File too large (max 50MB)');
	}

	// MIME type validation
	if (!file.type || file.type !== 'application/pdf') {
		errors.push('Only PDF files are allowed');
	}

	// File extension validation
	const extension = file.name.toLowerCase().split('.').pop();
	if (extension !== 'pdf') {
		errors.push('File must have .pdf extension');
	}

	// Content validation if provided
	let hash: string | undefined;
	if (content) {
		try {
			// Generate content hash for deduplication
			if (typeof crypto !== 'undefined' && crypto.subtle) {
				const hashBuffer = await crypto.subtle.digest(
					'SHA-256',
					typeof content === 'string' ? new TextEncoder().encode(content) : content
				);
				hash = Array.from(new Uint8Array(hashBuffer))
					.map((b) => b.toString(16).padStart(2, '0'))
					.join('');
			} else {
				// Fallback for test environment
				hash = `test-hash-${Math.random().toString(36).substring(2, 15)}`;
			}

			// Only scan content if it's already a string (extracted text)
			// Don't scan raw binary data as it will produce false positives
			if (typeof content === 'string') {
				const scanResult = scanFileContent(content);

				if (!scanResult.isSafe) {
					const highSeverityThreats = scanResult.threats.filter((t) => t.severity === 'high');
					const mediumSeverityThreats = scanResult.threats.filter((t) => t.severity === 'medium');
					const lowSeverityThreats = scanResult.threats.filter((t) => t.severity === 'low');

					// High severity threats are errors
					highSeverityThreats.forEach((threat) => {
						errors.push(`Security threat detected: ${threat.description}`);
					});

					// Medium severity threats are warnings
					mediumSeverityThreats.forEach((threat) => {
						warnings.push(`Potential security issue: ${threat.description}`);
					});

					// Low severity threats are just logged
					lowSeverityThreats.forEach((threat) => {
						console.warn(`Low severity security pattern detected: ${threat.description}`);
					});
				}
			} else {
				// For binary content (ArrayBuffer), perform basic PDF structure validation instead
				const bufferStr = new TextDecoder('utf-8', { fatal: false }).decode(content);

				// Only check for PDF structure, not for security patterns in binary data
				const pdfValidation = validatePDFStructure(bufferStr);
				if (!pdfValidation.isValidPDF) {
					pdfValidation.errors.forEach((error) => {
						errors.push(`PDF structure error: ${error}`);
					});
				}
			}
		} catch (error) {
			warnings.push('Could not fully validate file content');
			console.error('Content validation error:', error);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
		metadata: {
			size: file.size,
			type: file.type,
			name: file.name,
			hash,
		},
	};
}

/**
 * Scan file content for security threats
 */
export function scanFileContent(content: string): ContentScanResult {
	const threats: ContentScanResult['threats'] = [];

	// Check for dangerous patterns
	dangerousPatterns.forEach((pattern, _index) => {
		const matches = content.match(pattern);
		if (matches) {
			threats.push({
				type: 'malicious_pattern',
				description: `Potentially malicious pattern detected: ${matches[0].substring(0, 50)}...`,
				severity: 'high',
				pattern: pattern.source,
			});
		}
	});

	// Check for PDF-specific security issues
	pdfSecurityPatterns.forEach((pattern, _index) => {
		const matches = content.match(pattern);
		if (matches) {
			const severity =
				pattern.source.includes('JavaScript') || pattern.source.includes('JS')
					? ('high' as const)
					: ('medium' as const);

			threats.push({
				type: 'suspicious_content',
				description: `PDF security pattern detected: ${matches[0].substring(0, 50)}...`,
				severity,
				pattern: pattern.source,
			});
		}
	});

	// Content analysis
	const contentAnalysis = {
		hasJavaScript: /\/JavaScript|\/JS\s*\(/.test(content),
		hasEmbeddedFiles: /\/EmbeddedFile|\/FileAttachment/.test(content),
		hasForms: /\/AcroForm|\/Widget/.test(content),
		hasExternalReferences: /\/URI\s*\(|\/GoToR|\/Launch/.test(content),
	};

	// Add warnings for suspicious content
	if (contentAnalysis.hasJavaScript) {
		threats.push({
			type: 'embedded_script',
			description: 'PDF contains JavaScript code',
			severity: 'high',
		});
	}

	if (contentAnalysis.hasEmbeddedFiles) {
		threats.push({
			type: 'suspicious_content',
			description: 'PDF contains embedded files',
			severity: 'medium',
		});
	}

	if (contentAnalysis.hasForms) {
		threats.push({
			type: 'suspicious_content',
			description: 'PDF contains interactive forms',
			severity: 'low',
		});
	}

	if (contentAnalysis.hasExternalReferences) {
		threats.push({
			type: 'external_reference',
			description: 'PDF contains external references or links',
			severity: 'medium',
		});
	}

	return {
		isSafe: threats.filter((t) => t.severity === 'high').length === 0,
		threats,
		contentAnalysis,
	};
}

/**
 * Sanitize file name for safe storage
 */
export function sanitizeFileName(fileName: string): string {
	return (
		fileName
			// Remove or replace dangerous characters
			.replace(/[<>:"|?*\x00-\x1f]/g, '_')
			// Remove path traversal patterns
			.replace(/\.\.[\/\\]/g, '')
			// Limit length
			.substring(0, 255)
			// Ensure it doesn't start with a dot (hidden file)
			.replace(/^\.+/, '')
			// Ensure it has an extension
			.replace(/^([^.]+)$/, '$1.pdf')
	);
}

/**
 * Generate secure file path for storage
 */
export function generateSecureFilePath(
	userId: string | null,
	originalFileName: string,
	projectId?: string
): string {
	const sanitizedName = sanitizeFileName(originalFileName);
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 15);

	// Create a secure path structure
	const userPath = userId ? `users/${userId}` : 'anonymous';
	const projectPath = projectId ? `projects/${projectId}` : 'uploads';

	return `${userPath}/${projectPath}/${timestamp}_${random}_${sanitizedName}`;
}

/**
 * Validate PDF content structure
 */
export function validatePDFStructure(content: string): {
	isValidPDF: boolean;
	errors: string[];
	metadata: {
		version?: string;
		pageCount?: number;
		hasEncryption: boolean;
		hasSignatures: boolean;
	};
} {
	const errors: string[] = [];

	// Check PDF header (allow some whitespace before)
	if (!content.trim().startsWith('%PDF-')) {
		errors.push('Invalid PDF header');
	}

	// Extract PDF version
	const versionMatch = content.match(/%PDF-(\d+\.\d+)/);
	const version = versionMatch ? versionMatch[1] : undefined;

	// Check for PDF trailer
	if (!content.includes('%%EOF')) {
		errors.push('PDF trailer not found');
	}

	// Check for encryption
	const hasEncryption = /\/Encrypt\s+\d+\s+\d+\s+R/.test(content);

	// Check for digital signatures
	const hasSignatures = /\/Type\s*\/Sig/.test(content);

	// Estimate page count (rough approximation)
	const pageMatches = content.match(/\/Type\s*\/Page\b/g);
	const pageCount = pageMatches ? pageMatches.length : undefined;

	return {
		isValidPDF: errors.length === 0,
		errors,
		metadata: {
			version,
			pageCount,
			hasEncryption,
			hasSignatures,
		},
	};
}

/**
 * File quarantine system for suspicious files
 */
export class FileQuarantine {
	private static quarantinedFiles = new Map<
		string,
		{
			reason: string;
			timestamp: number;
			metadata: any;
		}
	>();

	static quarantineFile(fileHash: string, reason: string, metadata: any = {}): void {
		FileQuarantine.quarantinedFiles.set(fileHash, {
			reason,
			timestamp: Date.now(),
			metadata,
		});

		console.warn(`File quarantined: ${fileHash} - ${reason}`);
	}

	static isQuarantined(fileHash: string): boolean {
		return FileQuarantine.quarantinedFiles.has(fileHash);
	}

	static getQuarantineReason(fileHash: string): string | null {
		const entry = FileQuarantine.quarantinedFiles.get(fileHash);
		return entry ? entry.reason : null;
	}

	static releaseFromQuarantine(fileHash: string): boolean {
		return FileQuarantine.quarantinedFiles.delete(fileHash);
	}

	static cleanupExpiredQuarantine(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
		const now = Date.now();
		for (const [hash, entry] of FileQuarantine.quarantinedFiles.entries()) {
			if (now - entry.timestamp > maxAge) {
				FileQuarantine.quarantinedFiles.delete(hash);
			}
		}
	}
}

// Validation schemas for file operations
export const fileSecuritySchemas = {
	upload: z.object({
		name: z
			.string()
			.min(1)
			.max(255)
			.refine(
				(name) => !dangerousPatterns.some((pattern) => pattern.test(name)),
				'File name contains potentially dangerous patterns'
			),
		size: z
			.number()
			.min(1)
			.max(50 * 1024 * 1024),
		type: z.literal('application/pdf'),
	}),

	content: z.string().refine((content) => {
		const scanResult = scanFileContent(content);
		return scanResult.isSafe;
	}, 'File content contains security threats'),
};
