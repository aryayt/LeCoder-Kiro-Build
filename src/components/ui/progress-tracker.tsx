'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { useRealTimeProgress } from '~/hooks/use-real-time-progress';

/** Represents a single stage in the AI processing pipeline */
export interface PipelineStage {
	/** Unique identifier for the stage */
	id: string;
	/** Sequential number of the stage (1-6) */
	stageNumber: number;
	/** Human-readable name of the stage */
	stageName: string;
	/** Current status of the stage */
	status: 'pending' | 'processing' | 'completed' | 'error' | 'retrying';
	/** Error message if the stage failed */
	errorMessage?: string | null;
	/** Timestamp when the stage started */
	startedAt?: Date | null;
	/** Timestamp when the stage completed */
	completedAt?: Date | null;
}

export interface ProgressTrackerProps {
	/** ID of the project being tracked */
	projectId: string;
	/** Array of pipeline stages to display */
	stages: PipelineStage[];
	/** Current active stage number */
	currentStage: number;
	/** Additional CSS classes to apply */
	className?: string;
	/** Whether to enable real-time progress updates */
	enableRealTime?: boolean;
}

/**
 * A comprehensive progress tracker for the AI pipeline processing stages.
 *
 * Displays the 6-stage AI pipeline with real-time updates, error handling,
 * and retry functionality. Supports both WebSocket and Server-Sent Events
 * for live progress tracking with automatic fallback to polling.
 *
 * @param props - The progress tracker configuration
 * @returns JSX element for the progress tracker
 *
 * @example
 * ```tsx
 * function ProjectPage({ projectId }: { projectId: string }) {
 *   const { data: project } = api.project.getById.useQuery({ id: projectId });
 *
 *   if (!project) return <div>Loading...</div>;
 *
 *   return (
 *     <ProgressTracker
 *       projectId={projectId}
 *       stages={project.stages}
 *       currentStage={project.currentStage}
 *       enableRealTime={true}
 *     />
 *   );
 * }
 * ```
 */
export function ProgressTracker({
	projectId,
	stages: initialStages,
	currentStage: initialCurrentStage,
	className,
	enableRealTime = true,
}: ProgressTrackerProps) {
	const [stages, setStages] = useState(initialStages);
	const [currentStage, setCurrentStage] = useState(initialCurrentStage);

	const {
		progress,
		isConnected,
		connectionType,
		error: connectionError,
		reconnect,
	} = useRealTimeProgress({
		projectId,
		enabled: enableRealTime,
		fallbackToPolling: true,
	});

	// Update stages when real-time progress is received
	useEffect(() => {
		if (progress?.stages) {
			const updatedStages = progress.stages.map((stage) => ({
				id: stage.id,
				stageNumber: stage.stageNumber,
				stageName: stage.stageName,
				status: stage.status.toLowerCase() as PipelineStage['status'],
				errorMessage: stage.errorMessage,
				startedAt: stage.startedAt ? new Date(stage.startedAt) : null,
				completedAt: stage.completedAt ? new Date(stage.completedAt) : null,
			}));

			setStages(updatedStages);

			if (progress.currentStage !== undefined) {
				setCurrentStage(progress.currentStage);
			}
		}
	}, [progress]);

	// Fall back to initial props if real-time is disabled or not working
	useEffect(() => {
		if (!enableRealTime) {
			setStages(initialStages);
			setCurrentStage(initialCurrentStage);
		}
	}, [enableRealTime, initialStages, initialCurrentStage]);
	/**
	 * Renders the appropriate icon for a pipeline stage based on its status.
	 *
	 * @param stage - The pipeline stage to render an icon for
	 * @param index - The zero-based index of the stage
	 * @returns JSX element for the stage icon
	 */
	const getStageIcon = (stage: PipelineStage, index: number) => {
		const isActive = index + 1 === currentStage;
		const isCompleted = stage.status === 'completed';
		const isError = stage.status === 'error';
		const isProcessing = stage.status === 'processing' || stage.status === 'retrying';

		if (isError) {
			return (
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
					<svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clipRule="evenodd"
						/>
					</svg>
				</div>
			);
		}

		if (isCompleted) {
			return (
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
					<svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clipRule="evenodd"
						/>
					</svg>
				</div>
			);
		}

		if (isProcessing) {
			return (
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
				</div>
			);
		}

		return (
			<div
				className={clsx(
					'flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm',
					{
						'bg-blue-100 text-blue-600': isActive,
						'bg-gray-100 text-gray-400': !(isActive || isCompleted),
					}
				)}
			>
				{index + 1}
			</div>
		);
	};

	/**
	 * Gets a human-readable status string for a pipeline stage.
	 *
	 * @param stage - The pipeline stage to get status for
	 * @returns Human-readable status string
	 */
	const getStageStatus = (stage: PipelineStage) => {
		switch (stage.status) {
			case 'completed':
				return 'Completed';
			case 'processing':
				return 'Processing...';
			case 'retrying':
				return 'Retrying...';
			case 'error':
				return 'Error';
			default:
				return 'Pending';
		}
	};

	return (
		<div className={clsx('space-y-4', className)}>
			<div className="mb-6">
				<div className="mb-2 flex items-center justify-between">
					<h3 className="font-semibold text-gray-900 text-lg">Processing Pipeline</h3>

					{enableRealTime && (
						<div className="flex items-center space-x-2">
							<div
								className={clsx('h-2 w-2 rounded-full', {
									'animate-pulse bg-green-400': isConnected,
									'bg-red-400': !isConnected && connectionError,
									'bg-yellow-400': !(isConnected || connectionError),
								})}
							/>
							<span className="text-gray-500 text-xs">
								{isConnected ? (
									`Live (${connectionType?.toUpperCase()})`
								) : connectionError ? (
									<button
										onClick={reconnect}
										className="text-blue-600 underline hover:text-blue-700"
									>
										Reconnect
									</button>
								) : (
									'Connecting...'
								)}
							</span>
						</div>
					)}
				</div>

				<p className="text-gray-600 text-sm">
					Your research paper is being analyzed and converted to code
				</p>

				{connectionError && (
					<div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-2">
						<p className="text-xs text-yellow-800">
							Real-time updates unavailable. Using fallback polling.
						</p>
					</div>
				)}
			</div>

			<div className="space-y-4">
				{stages.map((stage, index) => {
					const isActive = index + 1 === currentStage;
					const isCompleted = stage.status === 'completed';
					const isError = stage.status === 'error';

					return (
						<div key={stage.id} className="flex items-start space-x-4">
							{getStageIcon(stage, index)}

							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between">
									<h4
										className={clsx('font-medium text-sm', {
											'text-gray-900': isActive || isCompleted,
											'text-gray-500': !(isActive || isCompleted || isError),
											'text-red-600': isError,
										})}
									>
										{stage.stageName}
									</h4>
									<span
										className={clsx('text-xs', {
											'text-blue-600': isActive,
											'text-green-600': isCompleted,
											'text-red-600': isError,
											'text-gray-400': !(isActive || isCompleted || isError),
										})}
									>
										{getStageStatus(stage)}
									</span>
								</div>

								{isError && stage.errorMessage && (
									<div className="mt-2">
										<p className="mb-2 text-red-600 text-xs">{stage.errorMessage}</p>
										<div className="flex space-x-2">
											<button
												onClick={() => window.location.reload()}
												className="rounded bg-red-100 px-2 py-1 text-red-700 text-xs transition-colors hover:bg-red-200"
											>
												Retry
											</button>
											<button
												onClick={() => {
													if (
														confirm(
															'Are you sure you want to start over? This will reset the entire pipeline.'
														)
													) {
														window.location.href = '/upload';
													}
												}}
												className="rounded bg-gray-100 px-2 py-1 text-gray-700 text-xs transition-colors hover:bg-gray-200"
											>
												Start Over
											</button>
										</div>
									</div>
								)}

								{stage.completedAt && (
									<p className="mt-1 text-gray-500 text-xs">
										Completed at {new Date(stage.completedAt).toLocaleTimeString()}
									</p>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
