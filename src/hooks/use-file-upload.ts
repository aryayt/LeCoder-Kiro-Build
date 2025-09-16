'use client';

import { useCallback, useState } from 'react';
// Client-side validation function
function validatePdfFile(file: File): { message: string; code: string } | null {
	// Check file type
	if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
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

interface UploadResult {
	success: boolean;
	project?: {
		id: string;
		title: string;
		status: string;
		metadata: any;
		createdAt: string;
	};
	error?: string;
	code?: string;
}

interface UseFileUploadOptions {
	onSuccess?: (result: UploadResult) => void;
	onError?: (error: string) => void;
	userId?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const uploadFile = useCallback(
		async (file: File): Promise<UploadResult> => {
			setIsUploading(true);
			setError(null);
			setProgress(0);

			try {
				// Client-side validation
				const validationError = validatePdfFile(file);
				if (validationError) {
					throw new Error(validationError.message);
				}

				// Create form data
				const formData = new FormData();
				formData.append('file', file);
				if (options.userId) {
					formData.append('userId', options.userId);
				}

				// Upload with progress tracking
				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData,
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || 'Upload failed');
				}

				setProgress(100);

				if (options.onSuccess) {
					options.onSuccess(result);
				}

				return result;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Upload failed';
				setError(errorMessage);

				if (options.onError) {
					options.onError(errorMessage);
				}

				return {
					success: false,
					error: errorMessage,
				};
			} finally {
				setIsUploading(false);
			}
		},
		[options]
	);

	const reset = useCallback(() => {
		setIsUploading(false);
		setProgress(0);
		setError(null);
	}, []);

	return {
		uploadFile,
		isUploading,
		progress,
		error,
		reset,
	};
}
