import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate PDF file type
 */
export function isPDFFile(file: File): boolean {
	return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Generate a random project title from paper content
 */
export function generateProjectTitle(paperContent: string): string {
	// Extract first meaningful sentence or use fallback
	const sentences = paperContent.split('.').filter((s) => s.trim().length > 10);
	if (sentences.length > 0 && sentences[0]) {
		const firstSentence = sentences[0].trim();
		// Limit to 50 characters
		return firstSentence.length > 50 ? `${firstSentence.substring(0, 47)}...` : firstSentence;
	}

	return `Research Project ${new Date().toISOString().split('T')[0]}`;
}
