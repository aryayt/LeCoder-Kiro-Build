'use client';

import { clsx } from 'clsx';
import { type DragEvent, useCallback, useState } from 'react';
import { useErrorHandler } from '~/hooks/use-error-handler';
import { useNetworkStatus } from '~/hooks/use-network-status';
import { offlineQueue } from '~/lib/utils/offline-queue';
import { UploadErrorRecovery } from './error-recovery';
import { useToast } from './toast';

export interface UploadZoneProps {
	/** Callback function called when a file is uploaded */
	onFileUpload: (file: File) => Promise<void>;
	/** Whether an upload is currently in progress */
	isUploading: boolean;
	/** Array of accepted file types (default: [".pdf"]) */
	acceptedTypes?: string[];
	/** Maximum file size in MB (default: 50) */
	maxSize?: number;
	/** Additional CSS classes to apply */
	className?: string;
}

/**
 * A drag-and-drop file upload zone component with validation and error handling.
 *
 * Supports offline queuing, progress tracking, and comprehensive file validation.
 * Provides visual feedback for drag states and upload progress.
 *
 * @param props - The upload zone configuration
 * @returns JSX element for the upload zone
 *
 * @example
 * ```tsx
 * function UploadPage() {
 *   const [isUploading, setIsUploading] = useState(false);
 *
 *   const handleFileUpload = async (file: File) => {
 *     setIsUploading(true);
 *     try {
 *       await uploadFile(file);
 *     } finally {
 *       setIsUploading(false);
 *     }
 *   };
 *
 *   return (
 *     <UploadZone
 *       onFileUpload={handleFileUpload}
 *       isUploading={isUploading}
 *       maxSize={25}
 *     />
 *   );
 * }
 * ```
 */
export function UploadZone({
	onFileUpload,
	isUploading,
	acceptedTypes = ['.pdf'],
	maxSize = 50,
	className,
}: UploadZoneProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const { isOnline, isClient } = useNetworkStatus();
	const { addToast } = useToast();
	const { error, handleError, clearError, withErrorHandling } = useErrorHandler({
		showToast: true,
		logError: true,
	});

	/**
	 * Validates an uploaded file against type, size, and content requirements.
	 *
	 * @param file - The file to validate
	 * @returns Error message if validation fails, null if valid
	 */
	const validateFile = useCallback(
		(file: File): string | null => {
			// Check file type
			if (!file.type.includes('pdf')) {
				return 'Only PDF files are accepted';
			}

			// Check file size (convert MB to bytes)
			const maxSizeBytes = maxSize * 1024 * 1024;
			if (file.size > maxSizeBytes) {
				return `File size must be less than ${maxSize}MB`;
			}

			// Check if file is empty
			if (file.size === 0) {
				return 'The selected file appears to be empty';
			}

			return null;
		},
		[maxSize]
	);

	const handleFile = withErrorHandling(async (file: File) => {
		const validationError = validateFile(file);
		if (validationError) {
			throw new Error(validationError);
		}

		clearError();
		setUploadProgress(0);

		if (isClient && !isOnline) {
			// Queue for offline processing
			const formData = new FormData();
			formData.append('file', file);

			offlineQueue.addOperation('upload', { formData });
			addToast({
				type: 'info',
				title: 'Queued for Upload',
				description: 'File will be uploaded when connection is restored.',
			});
			return;
		}

		try {
			await onFileUpload(file);
			addToast({
				type: 'success',
				title: 'Upload Successful',
				description: 'Your paper is being processed.',
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Upload failed';
			throw new Error(errorMessage);
		}
	}, 'file upload');

	const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragOver(false);

			const files = Array.from(e.dataTransfer.files);
			if (files.length > 0 && files[0]) {
				handleFile(files[0]);
			}
		},
		[handleFile]
	);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0 && files[0]) {
				handleFile(files[0]);
			}
		},
		[handleFile]
	);

	const handleRetry = useCallback(() => {
		clearError();
		// Reset file input to allow re-selection
		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}, [clearError]);

	if (error) {
		return (
			<div className={clsx('w-full', className)}>
				<UploadErrorRecovery error={error.message} onRetry={handleRetry} />
			</div>
		);
	}

	return (
		<div className={clsx('w-full', className)}>
			<div
				className={clsx(
					'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
					{
						'border-blue-400 bg-blue-50': isDragOver && !isUploading,
						'border-gray-300 hover:border-gray-400': !(isDragOver || isUploading),
						'border-gray-200 bg-gray-50': isUploading,
						'border-yellow-300 bg-yellow-50': isClient && !isOnline,
					}
				)}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<input
					type="file"
					accept={acceptedTypes.join(',')}
					onChange={handleFileInput}
					disabled={isUploading}
					className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
				/>

				<div className="space-y-4">
					<div className="mx-auto h-12 w-12 text-gray-400">
						{isUploading ? (
							<div className="h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
						) : (
							<svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
						)}
					</div>

					<div>
						<p className="font-medium text-gray-900 text-lg">
							{isUploading ? 'Processing...' : 'Upload your research paper'}
						</p>
						<p className="mt-1 text-gray-500 text-sm">
							{isUploading
								? 'Please wait while we process your PDF'
								: `Drag and drop a PDF file here, or click to select (max ${maxSize}MB)`}
						</p>
						{isClient && !isOnline && (
							<p className="mt-2 text-sm text-yellow-700">
								⚠️ Offline mode: Files will be queued for upload
							</p>
						)}
					</div>

					{isUploading && uploadProgress > 0 && (
						<div className="space-y-2">
							<div className="h-2 w-full rounded-full bg-gray-200">
								<div
									className="h-2 rounded-full bg-blue-600 transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
							<p className="text-gray-600 text-sm">{Math.round(uploadProgress)}% complete</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
