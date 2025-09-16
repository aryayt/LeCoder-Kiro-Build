// Dynamic import for server-side only
let pdfParse: any;

export interface PdfProcessingResult {
	text: string;
	metadata: {
		title?: string;
		author?: string;
		pages: number;
		fileSize: number;
		fileName: string;
	};
}

export interface PdfProcessingError {
	message: string;
	code: string;
	details?: any;
}

/**
 * Server-side PDF text extraction using pdf-parse
 */
export async function extractTextFromPdf(
	buffer: Buffer,
	fileName: string
): Promise<PdfProcessingResult> {
	try {
		// Dynamic import for server-side only
		if (!pdfParse) {
			const pdfParseModule = await import('pdf-parse');
			pdfParse = pdfParseModule.default || pdfParseModule; // Handle potential different export structures
		}

		// Add timeout and options for better reliability
		const data = await pdfParse(buffer, {
			// Disable worker to avoid potential issues
			useWorker: false,
			// Set a reasonable timeout
			max: 0, // Parse all pages
			// Add more options for better extraction
			normalizeWhitespace: true,
			disableCombineTextItems: false,
		});

		// Ensure we have valid data
		let extractedText = data.text || '';
		const pageCount = data.numpages || 1;

		// Clean up the extracted text
		extractedText = cleanExtractedText(extractedText);

		// Validate that we actually extracted meaningful content
		if (extractedText.trim().length < 100) {
			console.warn(
				`PDF extraction resulted in very short text (${extractedText.length} chars) for ${fileName}`
			);
		}

		return {
			text: extractedText,
			metadata: {
				title: data.info?.Title || fileName.replace('.pdf', ''),
				author: data.info?.Author,
				pages: pageCount,
				fileSize: buffer.length,
				fileName,
			},
		};
	} catch (error) {
		console.error('PDF parsing error details:', {
			fileName,
			bufferSize: buffer.length,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		throw {
			message: 'Failed to extract text from PDF',
			code: 'PDF_EXTRACTION_ERROR',
			details: error,
		} as PdfProcessingError;
	}
}

/**
 * Clean and normalize extracted PDF text
 */
function cleanExtractedText(text: string): string {
	return (
		text
			// Remove excessive whitespace
			.replace(/\s+/g, ' ')
			// Remove page breaks and form feeds
			.replace(/[\f\r]/g, '')
			// Normalize line breaks
			.replace(/\n\s*\n/g, '\n\n')
			// Remove leading/trailing whitespace
			.trim()
	);
}

/**
 * Client-side PDF text extraction fallback
 * This is a simplified version that can be enhanced with libraries like PDF.js
 */
export async function extractTextFromPdfClient(file: File): Promise<PdfProcessingResult> {
	try {
		// For now, we'll return basic metadata and indicate client-side processing
		// In a full implementation, you would use PDF.js or similar library
		return {
			text: '', // Would be extracted using PDF.js
			metadata: {
				title: file.name.replace('.pdf', ''),
				pages: 0, // Would be determined by PDF.js
				fileSize: file.size,
				fileName: file.name,
			},
		};
	} catch (error) {
		throw {
			message: 'Client-side PDF processing failed',
			code: 'CLIENT_PDF_ERROR',
			details: error,
		} as PdfProcessingError;
	}
}

/**
 * Validate PDF file before processing
 */
export function validatePdfFile(file: File): PdfProcessingError | null {
	// Check file type
	if (!(file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf'))) {
		return {
			message: 'Invalid file type. Only PDF files are accepted.',
			code: 'INVALID_FILE_TYPE',
		};
	}

	// Check file size (50MB limit)
	const maxSize = 50 * 1024 * 1024; // 50MB in bytes
	if (file.size > maxSize) {
		return {
			message: 'File size exceeds 50MB limit.',
			code: 'FILE_TOO_LARGE',
		};
	}

	// Check if file is empty
	if (file.size === 0) {
		return {
			message: 'File is empty.',
			code: 'EMPTY_FILE',
		};
	}

	return null;
}

/**
 * Convert File to Buffer for server-side processing
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
	const arrayBuffer = await file.arrayBuffer();
	return Buffer.from(arrayBuffer);
}
