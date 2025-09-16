import type { GeneratedFile } from '@prisma/client';
import JSZip from 'jszip';

export interface ZipGenerationOptions {
	projectName: string;
	files: GeneratedFile[];
	includeMetadata?: boolean;
}

export interface ZipGenerationResult {
	success: boolean;
	buffer?: Buffer;
	error?: string;
	fileCount: number;
	totalSize: number;
}

export class ZipGenerator {
	private zip: JSZip;

	constructor() {
		this.zip = new JSZip();
	}

	/**
	 * Generate a ZIP file from project files
	 */
	async generateProjectZip(options: ZipGenerationOptions): Promise<ZipGenerationResult> {
		try {
			const { projectName, files, includeMetadata = true } = options;

			if (!files || files.length === 0) {
				return {
					success: false,
					error: 'No files to archive',
					fileCount: 0,
					totalSize: 0,
				};
			}

			// Create project folder structure
			const projectFolder = this.zip.folder(projectName);
			if (!projectFolder) {
				throw new Error('Failed to create project folder');
			}

			let totalSize = 0;

			// Add all generated files
			for (const file of files) {
				const content = file.fileContent;
				const filePath = file.filePath;

				// Ensure proper path structure
				const normalizedPath = this.normalizePath(filePath);

				// Add file to ZIP
				projectFolder.file(normalizedPath, content);
				totalSize += content.length;
			}

			// Add metadata file if requested
			if (includeMetadata) {
				const metadata = {
					projectName,
					generatedAt: new Date().toISOString(),
					fileCount: files.length,
					files: files.map((f) => ({
						path: f.filePath,
						type: f.fileType,
						size: f.fileContent.length,
						createdAt: f.createdAt,
					})),
				};

				projectFolder.file('project-metadata.json', JSON.stringify(metadata, null, 2));
				totalSize += JSON.stringify(metadata).length;
			}

			// Generate ZIP buffer
			const buffer = await this.zip.generateAsync({
				type: 'nodebuffer',
				compression: 'DEFLATE',
				compressionOptions: {
					level: 6, // Good balance between size and speed
				},
			});

			return {
				success: true,
				buffer,
				fileCount: files.length,
				totalSize,
			};
		} catch (error) {
			console.error('ZIP generation failed:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				fileCount: 0,
				totalSize: 0,
			};
		}
	}

	/**
	 * Normalize file path for ZIP structure
	 */
	private normalizePath(path: string): string {
		// Remove leading slashes and normalize separators
		return path.replace(/^\/+/, '').replace(/\\/g, '/');
	}

	/**
	 * Validate file structure before ZIP generation
	 */
	static validateFiles(files: GeneratedFile[]): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!files || files.length === 0) {
			errors.push('No files provided');
			return { valid: false, errors };
		}

		const paths = new Set<string>();

		for (const file of files) {
			// Check for required fields
			if (!file.filePath) {
				errors.push(`File missing path: ${file.id}`);
				continue;
			}

			if (!file.fileContent) {
				errors.push(`File missing content: ${file.filePath}`);
				continue;
			}

			// Check for duplicate paths
			if (paths.has(file.filePath)) {
				errors.push(`Duplicate file path: ${file.filePath}`);
			}
			paths.add(file.filePath);

			// Check file size (prevent extremely large files)
			if (file.fileContent.length > 10 * 1024 * 1024) {
				// 10MB limit per file
				errors.push(`File too large: ${file.filePath} (${file.fileContent.length} bytes)`);
			}
		}

		return { valid: errors.length === 0, errors };
	}
}
