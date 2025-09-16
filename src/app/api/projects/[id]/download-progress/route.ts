interface ProgressData {
	type: 'status' | 'progress' | 'complete' | 'error';
	status?: string;
	fileCount?: number;
	totalSize?: number;
	timestamp?: number;
	downloadUrl?: string;
	error?: string;
}

import { type NextRequest, NextResponse } from 'next/server';
import { FileService } from '~/lib/services/file-service';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id: projectId } = await context.params;

		if (!projectId) {
			return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
		}

		const fileService = FileService.getInstance();

		// Get download information
		const downloadInfo = await fileService.getDownloadInfo(projectId);

		if (!downloadInfo) {
			return NextResponse.json({ error: 'Project not found' }, { status: 404 });
		}

		// Return download progress information
		return NextResponse.json({
			success: true,
			projectId: downloadInfo.projectId,
			projectName: downloadInfo.projectName,
			status: downloadInfo.status,
			fileCount: downloadInfo.fileCount,
			totalSize: downloadInfo.totalSize,
			lastModified: downloadInfo.lastModified,
			downloadReady: downloadInfo.status === 'ready',
			estimatedDownloadSize: Math.round(downloadInfo.totalSize * 0.7), // Estimate ZIP compression
		});
	} catch (error) {
		console.error('Download progress API error:', error);
		return NextResponse.json({ error: 'Failed to get download progress' }, { status: 500 });
	}
}

// Server-Sent Events for real-time download progress
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id: projectId } = await context.params;

		if (!projectId) {
			return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
		}

		// Create SSE stream for download progress
		const encoder = new TextEncoder();

		const stream = new ReadableStream({
			start(controller) {
				const sendProgress = (data: ProgressData) => {
					const message = `data: ${JSON.stringify(data)}

`;
					controller.enqueue(encoder.encode(message));
				};

				// Send initial status
				FileService.getInstance()
					.getDownloadInfo(projectId)
					.then((info) => {
						if (info) {
							sendProgress({
								type: 'status',
								status: info.status,
								fileCount: info.fileCount,
								totalSize: info.totalSize,
							});
						}
					})
					.catch((error) => {
						sendProgress({
							type: 'error',
							error: error.message,
						});
						controller.close();
					});

				// Set up periodic updates (every 2 seconds)
				const interval = setInterval(async () => {
					try {
						const info = await FileService.getInstance().getDownloadInfo(projectId);
						if (info) {
							sendProgress({
								type: 'progress',
								status: info.status,
								fileCount: info.fileCount,
								totalSize: info.totalSize,
								timestamp: Date.now(),
							});

							// Close stream when ready
							if (info.status === 'ready') {
								sendProgress({
									type: 'complete',
									downloadUrl: `/api/projects/${projectId}/download`,
								});
								clearInterval(interval);
								controller.close();
							}
						}
					} catch (error) {
						sendProgress({
							type: 'error',
							error: error instanceof Error ? error.message : 'Unknown error',
						});
						clearInterval(interval);
						controller.close();
					}
				}, 2000);

				// Clean up on close
				return () => {
					clearInterval(interval);
				};
			},
		});

		return new NextResponse(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		});
	} catch (error) {
		console.error('Download progress SSE error:', error);
		return NextResponse.json({ error: 'Failed to create progress stream' }, { status: 500 });
	}
}
