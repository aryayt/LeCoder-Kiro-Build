"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { useRealTimeProgress } from "~/hooks/use-real-time-progress";

export interface PipelineStage {
	id: string;
	stageNumber: number;
	stageName: string;
	status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR" | "RETRYING";
	errorMessage?: string | null;
	startedAt?: Date | null;
	completedAt?: Date | null;
}

interface ProgressTrackerProps {
	projectId: string;
	stages: PipelineStage[];
	currentStage: number;
	className?: string;
	enableRealTime?: boolean;
}

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
		if (progress && progress.stages) {
			const updatedStages = progress.stages.map((stage) => ({
				id: stage.id,
				stageNumber: stage.stageNumber,
				stageName: stage.stageName,
				status: stage.status as PipelineStage["status"],
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
	const getStageIcon = (stage: PipelineStage, index: number) => {
		const isActive = index + 1 === currentStage;
		const isCompleted = stage.status === "COMPLETED";
		const isError = stage.status === "ERROR";
		const isProcessing =
			stage.status === "PROCESSING" || stage.status === "RETRYING";

		if (isError) {
			return (
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
					<svg
						className="h-5 w-5 text-red-600"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
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
					<svg
						className="h-5 w-5 text-green-600"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
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
					"flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm",
					{
						"bg-blue-100 text-blue-600": isActive,
						"bg-gray-100 text-gray-400": !isActive && !isCompleted,
					},
				)}
			>
				{index + 1}
			</div>
		);
	};

	const getStageStatus = (stage: PipelineStage) => {
		switch (stage.status) {
			case "COMPLETED":
				return "Completed";
			case "PROCESSING":
				return "Processing...";
			case "RETRYING":
				return "Retrying...";
			case "ERROR":
				return "Error";
			case "PENDING":
			default:
				return "Pending";
		}
	};

	return (
		<div className={clsx("space-y-4", className)}>
			<div className="mb-6">
				<div className="mb-2 flex items-center justify-between">
					<h3 className="font-semibold text-gray-900 text-lg">
						Processing Pipeline
					</h3>

					{enableRealTime && (
						<div className="flex items-center space-x-2">
							<div
								className={clsx("h-2 w-2 rounded-full", {
									"animate-pulse bg-green-400": isConnected,
									"bg-red-400": !isConnected && connectionError,
									"bg-yellow-400": !isConnected && !connectionError,
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
									"Connecting..."
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
					const isCompleted = stage.status === "COMPLETED";
					const isError = stage.status === "ERROR";

					return (
						<div key={stage.id} className="flex items-start space-x-4">
							{getStageIcon(stage, index)}

							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between">
									<h4
										className={clsx("font-medium text-sm", {
											"text-gray-900": isActive || isCompleted,
											"text-gray-500": !isActive && !isCompleted && !isError,
											"text-red-600": isError,
										})}
									>
										{stage.stageName}
									</h4>
									<span
										className={clsx("text-xs", {
											"text-blue-600": isActive,
											"text-green-600": isCompleted,
											"text-red-600": isError,
											"text-gray-400": !isActive && !isCompleted && !isError,
										})}
									>
										{getStageStatus(stage)}
									</span>
								</div>

								{isError && stage.errorMessage && (
									<p className="mt-1 text-red-600 text-xs">
										{stage.errorMessage}
									</p>
								)}

								{stage.completedAt && (
									<p className="mt-1 text-gray-500 text-xs">
										Completed at{" "}
										{new Date(stage.completedAt).toLocaleTimeString()}
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
