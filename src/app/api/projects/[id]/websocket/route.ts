import type { NextRequest } from 'next/server';
import { db } from '~/server/db';

export const runtime = 'nodejs';

// WebSocket fallback using long polling
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: projectId } = await params;
	const url = new URL(request.url);
	const lastUpdate = url.searchParams.get('lastUpdate');

	if (!projectId) {
		return Response.json({ error: 'Project ID is required' }, { status: 400 });
	}

	try {
		// Verify project exists
		const project = await db.project.findUnique({
			where: { id: projectId },
			include: {
				stages: {
					orderBy: { stageNumber: 'asc' },
				},
			},
		});

		if (!project) {
			return Response.json({ error: 'Project not found' }, { status: 404 });
		}

		// If lastUpdate is provided, wait for changes
		if (lastUpdate) {
			const lastUpdateDate = new Date(lastUpdate);

			// Poll for changes with timeout
			const maxWaitTime = 30000; // 30 seconds
			const pollInterval = 1000; // 1 second
			const startTime = Date.now();

			while (Date.now() - startTime < maxWaitTime) {
				const currentProject = await db.project.findUnique({
					where: { id: projectId },
					include: {
						stages: {
							orderBy: { stageNumber: 'asc' },
						},
					},
				});

				if (!currentProject) {
					break;
				}

				// Check if there are any updates since lastUpdate
				const hasUpdates =
					currentProject.updatedAt > lastUpdateDate ||
					currentProject.stages.some(
						(stage) =>
							(stage.startedAt && stage.startedAt > lastUpdateDate) ||
							(stage.completedAt && stage.completedAt > lastUpdateDate)
					);

				if (hasUpdates) {
					return Response.json({
						type: 'update',
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
				}

				// Stop polling if project is in final state
				if (['COMPLETED', 'ERROR', 'CANCELLED'].includes(currentProject.status)) {
					return Response.json({
						type: 'final',
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
				}

				// Wait before next poll
				await new Promise((resolve) => setTimeout(resolve, pollInterval));
			}

			// Timeout reached, return current state
			return Response.json({
				type: 'timeout',
				projectId,
				status: project.status,
				currentStage: project.currentStage,
				stages: project.stages.map((stage) => ({
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
		}

		// Return current state immediately
		return Response.json({
			type: 'current',
			projectId,
			status: project.status,
			currentStage: project.currentStage,
			stages: project.stages.map((stage) => ({
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
	} catch (error) {
		console.error('WebSocket fallback error:', error);
		return Response.json(
			{
				error: 'Failed to fetch project progress',
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
