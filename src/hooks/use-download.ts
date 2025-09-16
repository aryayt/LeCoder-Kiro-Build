import { useCallback, useEffect, useRef, useState } from 'react';

export interface DownloadProgress {
	status: 'idle' | 'preparing' | 'downloading' | 'completed' | 'error';
	progress: number; // 0-100
	fileCount?: number;
	totalSize?: number;
	downloadedSize?: number;
	error?: string;
	downloadUrl?: string;
}

export interface UseDownloadOptions {
	onProgress?: (progress: DownloadProgress) => void;
	onComplete?: (downloadUrl: string) => void;
	onError?: (error: string) => void;
}

export function useDownload(options: UseDownloadOptions = {}) {
	const [progress, setProgress] = useState<DownloadProgress>({
		status: 'idle',
		progress: 0,
	});

	const abortControllerRef = useRef<AbortController | null>(null);
	const eventSourceRef = useRef<EventSource | null>(null);

	const updateProgress = useCallback(
		(newProgress: Partial<DownloadProgress>) => {
			setProgress((prev) => {
				const updated = { ...prev, ...newProgress };
				options.onProgress?.(updated);
				return updated;
			});
		},
		[options]
	);

	const startDownload = useCallback(
		async (projectId: string) => {
			try {
				// Reset state
				updateProgress({
					status: 'preparing',
					progress: 0,
					error: undefined,
				});

				// Check if project is ready for download
				const response = await fetch(`/api/projects/${projectId}/download-progress`);
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || 'Failed to check download status');
				}

				if (!data.downloadReady) {
					// Set up SSE for progress tracking
					const eventSource = new EventSource(`/api/projects/${projectId}/download-progress`);

					eventSourceRef.current = eventSource;

					eventSource.onmessage = (event) => {
						try {
							const progressData = JSON.parse(event.data);

							switch (progressData.type) {
								case 'status':
								case 'progress':
									updateProgress({
										status: progressData.status === 'ready' ? 'downloading' : 'preparing',
										fileCount: progressData.fileCount,
										totalSize: progressData.totalSize,
										progress: progressData.status === 'ready' ? 50 : 25,
									});
									break;

								case 'complete':
									updateProgress({
										status: 'completed',
										progress: 100,
										downloadUrl: progressData.downloadUrl,
									});
									options.onComplete?.(progressData.downloadUrl);
									eventSource.close();
									break;

								case 'error':
									updateProgress({
										status: 'error',
										error: progressData.error,
									});
									options.onError?.(progressData.error);
									eventSource.close();
									break;
							}
						} catch (error) {
							console.error('Failed to parse SSE data:', error);
						}
					};

					eventSource.onerror = () => {
						updateProgress({
							status: 'error',
							error: 'Connection lost during download preparation',
						});
						options.onError?.('Connection lost during download preparation');
						eventSource.close();
					};
				} else {
					// Project is ready, start download immediately
					await performDownload(projectId);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Download failed';
				updateProgress({
					status: 'error',
					error: errorMessage,
				});
				options.onError?.(errorMessage);
			}
		},
		[updateProgress, options]
	);

	const performDownload = useCallback(
		async (projectId: string) => {
			try {
				updateProgress({
					status: 'downloading',
					progress: 50,
				});

				// Create abort controller for this download
				const abortController = new AbortController();
				abortControllerRef.current = abortController;

				const response = await fetch(`/api/projects/${projectId}/download`, {
					signal: abortController.signal,
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.error || `Download failed: ${response.status}`);
				}

				// Get file info from headers
				const fileCount = response.headers.get('X-File-Count');
				const totalSize = response.headers.get('X-Total-Size');
				const _contentLength = response.headers.get('Content-Length');

				updateProgress({
					fileCount: fileCount ? Number.parseInt(fileCount) : undefined,
					totalSize: totalSize ? Number.parseInt(totalSize) : undefined,
					progress: 75,
				});

				// Get the blob and create download URL
				const blob = await response.blob();
				const downloadUrl = URL.createObjectURL(blob);

				// Get filename from Content-Disposition header
				const contentDisposition = response.headers.get('Content-Disposition');
				const filename = contentDisposition
					? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
					: `project-${projectId}.zip`;

				// Trigger download
				const link = document.createElement('a');
				link.href = downloadUrl;
				link.download = filename || `project-${projectId}.zip`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				// Clean up
				setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

				updateProgress({
					status: 'completed',
					progress: 100,
					downloadUrl,
				});

				options.onComplete?.(downloadUrl);
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') {
					updateProgress({
						status: 'idle',
						progress: 0,
					});
				} else {
					const errorMessage = error instanceof Error ? error.message : 'Download failed';
					updateProgress({
						status: 'error',
						error: errorMessage,
					});
					options.onError?.(errorMessage);
				}
			}
		},
		[updateProgress, options]
	);

	const cancelDownload = useCallback(() => {
		// Cancel fetch request
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}

		// Close SSE connection
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		updateProgress({
			status: 'idle',
			progress: 0,
			error: undefined,
		});
	}, [updateProgress]);

	const retryDownload = useCallback(
		(projectId: string) => {
			cancelDownload();
			setTimeout(() => startDownload(projectId), 100);
		},
		[cancelDownload, startDownload]
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			cancelDownload();
		};
	}, [cancelDownload]);

	return {
		progress,
		startDownload,
		cancelDownload,
		retryDownload,
		isDownloading: progress.status === 'preparing' || progress.status === 'downloading',
		isCompleted: progress.status === 'completed',
		hasError: progress.status === 'error',
	};
}
