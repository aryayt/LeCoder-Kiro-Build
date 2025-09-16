'use client';

import { useState } from 'react';
import { type DownloadProgress, useDownload } from '~/hooks/use-download';
import { Button } from './button';

interface DownloadButtonProps {
	projectId: string;
	projectName: string;
	disabled?: boolean;
	variant?: 'default' | 'outline' | 'ghost';
	size?: 'sm' | 'default' | 'lg';
	className?: string;
}

export function DownloadButton({
	projectId,
	projectName,
	disabled = false,
	variant = 'default',
	size = 'default',
	className,
}: DownloadButtonProps) {
	const [showProgress, setShowProgress] = useState(false);

	const { progress, startDownload, cancelDownload, retryDownload, isDownloading } = useDownload({
		onProgress: (progress: DownloadProgress) => {
			setShowProgress(progress.status !== 'idle');
		},
		onComplete: () => {
			setTimeout(() => setShowProgress(false), 2000);
		},
		onError: () => {
			// Keep progress visible on error for retry option
		},
	});

	const handleDownload = () => {
		if (isDownloading) {
			cancelDownload();
		} else {
			startDownload(projectId);
		}
	};

	const handleRetry = () => {
		retryDownload(projectId);
	};

	const getButtonText = () => {
		switch (progress.status) {
			case 'preparing':
				return 'Preparing...';
			case 'downloading':
				return 'Downloading...';
			case 'completed':
				return '✅ Downloaded';
			case 'error':
				return '❌ Failed';
			default:
				return '📥 Download';
		}
	};

	const getButtonIcon = () => {
		switch (progress.status) {
			case 'preparing':
			case 'downloading':
				return '⏳';
			case 'completed':
				return '✅';
			case 'error':
				return '❌';
			default:
				return '📥';
		}
	};

	return (
		<div className={className}>
			<div className="flex items-center space-x-2">
				<Button
					onClick={handleDownload}
					disabled={disabled}
					variant={variant}
					size={size}
					className={`${isDownloading ? 'animate-pulse' : ''}`}
				>
					<span className="mr-2">{getButtonIcon()}</span>
					{getButtonText()}
				</Button>

				{progress.status === 'error' && (
					<Button onClick={handleRetry} variant="outline" size="sm">
						🔄 Retry
					</Button>
				)}
			</div>

			{showProgress && (
				<div className="mt-2 space-y-2">
					{/* Progress Bar */}
					<div
						className="h-2 w-full rounded-full bg-gray-200"
						role="progressbar"
						aria-valuenow={progress.progress}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<div
							className={`h-2 rounded-full transition-all duration-300 ${
								progress.status === 'error'
									? 'bg-red-500'
									: progress.status === 'completed'
										? 'bg-green-500'
										: 'bg-blue-500'
							}`}
							style={{ width: `${progress.progress}%` }}
						/>
					</div>

					{/* Progress Details */}
					<div className="space-y-1 text-gray-600 text-xs">
						{progress.status === 'error' && progress.error && (
							<div className="text-red-600">Error: {progress.error}</div>
						)}

						{progress.fileCount && <div>Files: {progress.fileCount}</div>}

						{progress.totalSize && <div>Size: {formatBytes(progress.totalSize)}</div>}

						<div className="flex justify-between">
							<span>Progress: {progress.progress}%</span>
							<span className="capitalize">{progress.status}</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return '0 B';
	}
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
