import type { NextRequest } from 'next/server';
import { db } from '~/server/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: projectId } = await params;

	if (!projectId) {
		return new Response('Project ID is required', { status: 400 });
	}

	// Verify project exists
	try {
		const project = await db.project.findUnique({
			where: { id: projectId },
		});

		if (!project) {
			return new Response('Project not found', { status: 404 });
		}
	} catch (error) {
		console.error('Database error in SSE route:', error);
		return new Response('Database error', { status: 500 });
	}

	// Create SSE response
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		start(controller) {
			// Send initial connection message
			const initialData = JSON.stringify({
				type: 'connected',
				projectId,
				timestamp: new Date().toISOString(),
			});

			controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

			// Set up polling interval to check for updates
			const intervalId = setInterval(async () => {
				try {
					// Get current project status and stages
					const currentProject = await db.project.findUnique({
						where: { id: projectId },
						include: {
							stages: {
								orderBy: { stageNumber: 'asc' },
							},
						},
					});

					if (!currentProject) {
						controller.close();
						return;
					}

					// Send progress update
					const progressData = JSON.stringify({
						type: 'progress',
						projectId,
						status: currentProject.status,
						currentStage: currentProject.currentStage,
						stages: currentProject.stages.map((stage) => ({
							id: stage.id,
							stageNumber: stage.stageNumber,
							stageName: stage.stageName,
							status: stage.status,
							errorMessage: stage.errorMessage,
							startedAt: stage.startedAt,
							completedAt: stage.completedAt,
						})),
						timestamp: new Date().toISOString(),
					});

					controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));

					// Stop polling if project is completed, error, or cancelled
					if (['COMPLETED', 'ERROR', 'CANCELLED'].includes(currentProject.status)) {
						clearInterval(intervalId);

						// Send final status
						const finalData = JSON.stringify({
							type: 'final',
							projectId,
							status: currentProject.status,
							timestamp: new Date().toISOString(),
						});

						controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

						controller.close();
					}
				} catch (error) {
					console.error('SSE polling error:', error);

					const errorData = JSON.stringify({
						type: 'error',
						projectId,
						error: 'Failed to fetch progress',
						timestamp: new Date().toISOString(),
					});

					controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
				}
			}, 1000); // Poll every second

			// Clean up on close
			request.signal.addEventListener('abort', () => {
				clearInterval(intervalId);
				controller.close();
			});
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Cache-Control',
		},
	});
}
