/**
 * Utility functions for pipeline operations
 */

import { ProjectStatus, StageStatus } from "@prisma/client";
import type { PipelineContext, PipelineStage } from "~/types/ai";

/**
 * Pipeline stage definitions
 */
export const PIPELINE_STAGES = [
	{
		id: 1,
		name: "Concept Extraction",
		description: "Extract research concepts and objectives",
	},
	{
		id: 2,
		name: "Algorithm Analysis",
		description: "Analyze algorithms and technical requirements",
	},
	{
		id: 3,
		name: "Architecture Planning",
		description: "Design system architecture and components",
	},
	{
		id: 4,
		name: "Implementation Planning",
		description: "Create detailed implementation plan",
	},
	{
		id: 5,
		name: "Code Generation",
		description: "Generate complete executable code",
	},
	{
		id: 6,
		name: "Documentation Generation",
		description: "Create documentation and setup instructions",
	},
] as const;

/**
 * Pipeline stage utilities
 */
export class PipelineStageUtils {
	/**
	 * Get stage definition by ID
	 */
	static getStageDefinition(stageId: number) {
		return PIPELINE_STAGES.find((stage) => stage.id === stageId);
	}

	/**
	 * Get all stage definitions
	 */
	static getAllStageDefinitions() {
		return PIPELINE_STAGES;
	}

	/**
	 * Validate stage ID
	 */
	static isValidStageId(stageId: number): boolean {
		return stageId >= 1 && stageId <= PIPELINE_STAGES.length;
	}

	/**
	 * Get next stage ID
	 */
	static getNextStageId(currentStageId: number): number | null {
		if (currentStageId >= PIPELINE_STAGES.length) {
			return null;
		}
		return currentStageId + 1;
	}

	/**
	 * Get previous stage ID
	 */
	static getPreviousStageId(currentStageId: number): number | null {
		if (currentStageId <= 1) {
			return null;
		}
		return currentStageId - 1;
	}

	/**
	 * Check if stage is final stage
	 */
	static isFinalStage(stageId: number): boolean {
		return stageId === PIPELINE_STAGES.length;
	}

	/**
	 * Check if stage is first stage
	 */
	static isFirstStage(stageId: number): boolean {
		return stageId === 1;
	}
}

/**
 * Pipeline status utilities
 */
export class PipelineStatusUtils {
	/**
	 * Convert StageStatus to pipeline stage status
	 */
	static convertStageStatus(status: StageStatus): PipelineStage["status"] {
		switch (status) {
			case StageStatus.PENDING:
				return "pending";
			case StageStatus.PROCESSING:
				return "processing";
			case StageStatus.COMPLETED:
				return "completed";
			case StageStatus.ERROR:
				return "error";
			case StageStatus.RETRYING:
				return "processing"; // Treat retrying as processing for UI
			default:
				return "pending";
		}
	}

	/**
	 * Convert pipeline stage status to StageStatus
	 */
	static convertToPrismaStatus(status: PipelineStage["status"]): StageStatus {
		switch (status) {
			case "pending":
				return StageStatus.PENDING;
			case "processing":
				return StageStatus.PROCESSING;
			case "completed":
				return StageStatus.COMPLETED;
			case "error":
				return StageStatus.ERROR;
			default:
				return StageStatus.PENDING;
		}
	}

	/**
	 * Determine project status from stage statuses
	 */
	static determineProjectStatus(stages: PipelineStage[]): ProjectStatus {
		if (stages.length === 0) {
			return ProjectStatus.UPLOADED;
		}

		const hasError = stages.some((stage) => stage.status === "error");
		if (hasError) {
			return ProjectStatus.ERROR;
		}

		const completedStages = stages.filter(
			(stage) => stage.status === "completed",
		).length;
		if (completedStages === stages.length) {
			return ProjectStatus.COMPLETED;
		}

		const isProcessing = stages.some(
			(stage) => stage.status === "processing" || stage.status === "error",
		);
		if (isProcessing || completedStages > 0) {
			return ProjectStatus.PROCESSING;
		}

		return ProjectStatus.UPLOADED;
	}

	/**
	 * Calculate pipeline progress percentage
	 */
	static calculateProgress(stages: PipelineStage[]): number {
		if (stages.length === 0) return 0;

		const completedStages = stages.filter(
			(stage) => stage.status === "completed",
		).length;
		return Math.round((completedStages / stages.length) * 100);
	}

	/**
	 * Get current active stage
	 */
	static getCurrentStage(stages: PipelineStage[]): PipelineStage | null {
		// First check for processing stages
		const processingStage = stages.find(
			(stage) => stage.status === "processing",
		);
		if (processingStage) {
			return processingStage;
		}

		// Then check for error stages
		const errorStage = stages.find((stage) => stage.status === "error");
		if (errorStage) {
			return errorStage;
		}

		// Finally, get the first pending stage
		const pendingStage = stages.find((stage) => stage.status === "pending");
		return pendingStage || null;
	}

	/**
	 * Get pipeline summary
	 */
	static getPipelineSummary(stages: PipelineStage[]): {
		total: number;
		completed: number;
		processing: number;
		pending: number;
		error: number;
		progress: number;
		status: ProjectStatus;
	} {
		const total = stages.length;
		const completed = stages.filter((s) => s.status === "completed").length;
		const processing = stages.filter((s) => s.status === "processing").length;
		const pending = stages.filter((s) => s.status === "pending").length;
		const error = stages.filter((s) => s.status === "error").length;
		const progress = this.calculateProgress(stages);
		const status = this.determineProjectStatus(stages);

		return {
			total,
			completed,
			processing,
			pending,
			error,
			progress,
			status,
		};
	}
}

/**
 * Pipeline timing utilities
 */
export class PipelineTimingUtils {
	/**
	 * Calculate stage duration
	 */
	static calculateStageDuration(stage: PipelineStage): number | null {
		if (!stage.startTime || !stage.endTime) {
			return null;
		}
		return stage.endTime.getTime() - stage.startTime.getTime();
	}

	/**
	 * Calculate total pipeline duration
	 */
	static calculateTotalDuration(stages: PipelineStage[]): number | null {
		const completedStages = stages.filter(
			(stage) =>
				stage.status === "completed" && stage.startTime && stage.endTime,
		);

		if (completedStages.length === 0) {
			return null;
		}

		const startTimes = completedStages
			.map((stage) => stage.startTime!)
			.filter((time) => time !== undefined);

		const endTimes = completedStages
			.map((stage) => stage.endTime!)
			.filter((time) => time !== undefined);

		if (startTimes.length === 0 || endTimes.length === 0) {
			return null;
		}

		const earliestStart = Math.min(...startTimes.map((time) => time.getTime()));
		const latestEnd = Math.max(...endTimes.map((time) => time.getTime()));

		return latestEnd - earliestStart;
	}

	/**
	 * Estimate remaining time
	 */
	static estimateRemainingTime(stages: PipelineStage[]): number | null {
		const completedStages = stages.filter(
			(stage) => stage.status === "completed",
		);
		const remainingStages = stages.filter(
			(stage) => stage.status === "pending" || stage.status === "processing",
		);

		if (completedStages.length === 0 || remainingStages.length === 0) {
			return null;
		}

		// Calculate average duration of completed stages
		const durations = completedStages
			.map((stage) => this.calculateStageDuration(stage))
			.filter((duration) => duration !== null) as number[];

		if (durations.length === 0) {
			return null;
		}

		const averageDuration =
			durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
		return averageDuration * remainingStages.length;
	}

	/**
	 * Format duration for display
	 */
	static formatDuration(milliseconds: number): string {
		const seconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		} else {
			return `${seconds}s`;
		}
	}
}

/**
 * Pipeline validation utilities
 */
export class PipelineValidationUtils {
	/**
	 * Validate pipeline context
	 */
	static validateContext(context: PipelineContext): {
		valid: boolean;
		errors: string[];
		warnings: string[];
	} {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Validate required fields
		if (!context.projectId) {
			errors.push("Project ID is required");
		}

		if (!context.paperContent) {
			errors.push("Paper content is required");
		} else if (context.paperContent.length < 100) {
			warnings.push("Paper content seems very short");
		}

		if (!context.metadata) {
			errors.push("Metadata is required");
		} else {
			if (!context.metadata.fileName) {
				errors.push("File name is required");
			}

			if (!context.metadata.fileSize || context.metadata.fileSize <= 0) {
				errors.push("Valid file size is required");
			}
		}

		// Validate stages
		if (!Array.isArray(context.stages)) {
			errors.push("Stages must be an array");
		} else {
			// Check for duplicate stage IDs
			const stageIds = context.stages.map((stage) => stage.id);
			const uniqueIds = new Set(stageIds);
			if (stageIds.length !== uniqueIds.size) {
				errors.push("Duplicate stage IDs found");
			}

			// Validate stage sequence
			const sortedStages = [...context.stages].sort((a, b) => a.id - b.id);
			for (let i = 0; i < sortedStages.length; i++) {
				if (sortedStages[i].id !== i + 1) {
					warnings.push(
						`Stage sequence may be incorrect: expected ${i + 1}, got ${sortedStages[i].id}`,
					);
				}
			}
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Validate stage transition
	 */
	static validateStageTransition(
		fromStatus: PipelineStage["status"],
		toStatus: PipelineStage["status"],
	): { valid: boolean; reason?: string } {
		const validTransitions: Record<
			PipelineStage["status"],
			PipelineStage["status"][]
		> = {
			pending: ["processing"],
			processing: ["completed", "error"],
			completed: [], // Completed stages cannot transition
			error: ["processing"], // Can retry from error
		};

		const allowedTransitions = validTransitions[fromStatus] || [];

		if (!allowedTransitions.includes(toStatus)) {
			return {
				valid: false,
				reason: `Invalid transition from ${fromStatus} to ${toStatus}`,
			};
		}

		return { valid: true };
	}

	/**
	 * Check if pipeline can be started
	 */
	static canStartPipeline(stages: PipelineStage[]): {
		canStart: boolean;
		reason?: string;
	} {
		if (stages.length === 0) {
			return { canStart: false, reason: "No stages defined" };
		}

		const hasProcessing = stages.some((stage) => stage.status === "processing");
		if (hasProcessing) {
			return { canStart: false, reason: "Pipeline is already running" };
		}

		const allCompleted = stages.every((stage) => stage.status === "completed");
		if (allCompleted) {
			return { canStart: false, reason: "Pipeline is already completed" };
		}

		return { canStart: true };
	}

	/**
	 * Check if pipeline can be retried
	 */
	static canRetryPipeline(stages: PipelineStage[]): {
		canRetry: boolean;
		reason?: string;
	} {
		if (stages.length === 0) {
			return { canRetry: false, reason: "No stages defined" };
		}

		const hasError = stages.some((stage) => stage.status === "error");
		if (!hasError) {
			return { canRetry: false, reason: "No failed stages to retry" };
		}

		const hasProcessing = stages.some((stage) => stage.status === "processing");
		if (hasProcessing) {
			return { canRetry: false, reason: "Pipeline is currently running" };
		}

		return { canRetry: true };
	}
}

/**
 * Pipeline data utilities
 */
export class PipelineDataUtils {
	/**
	 * Serialize pipeline context for storage
	 */
	static serializeContext(context: PipelineContext): string {
		return JSON.stringify({
			...context,
			stages: context.stages.map((stage) => ({
				...stage,
				startTime: stage.startTime?.toISOString(),
				endTime: stage.endTime?.toISOString(),
			})),
		});
	}

	/**
	 * Deserialize pipeline context from storage
	 */
	static deserializeContext(data: string): PipelineContext {
		const parsed = JSON.parse(data);
		return {
			...parsed,
			stages: parsed.stages.map((stage: any) => ({
				...stage,
				startTime: stage.startTime ? new Date(stage.startTime) : undefined,
				endTime: stage.endTime ? new Date(stage.endTime) : undefined,
			})),
		};
	}

	/**
	 * Extract stage results by type
	 */
	static extractStageResults<T = any>(
		stages: PipelineStage[],
		stageId: number,
	): T | null {
		const stage = stages.find((s) => s.id === stageId);
		return stage?.result || null;
	}

	/**
	 * Get all completed stage results
	 */
	static getAllResults(stages: PipelineStage[]): Record<number, any> {
		const results: Record<number, any> = {};

		stages
			.filter((stage) => stage.status === "completed" && stage.result)
			.forEach((stage) => {
				results[stage.id] = stage.result;
			});

		return results;
	}

	/**
	 * Create stage summary for logging
	 */
	static createStageSummary(stage: PipelineStage): {
		id: number;
		name: string;
		status: string;
		duration?: string;
		hasResult: boolean;
		hasError: boolean;
	} {
		const duration =
			stage.startTime && stage.endTime
				? PipelineTimingUtils.formatDuration(
						stage.endTime.getTime() - stage.startTime.getTime(),
					)
				: undefined;

		return {
			id: stage.id,
			name: stage.name,
			status: stage.status,
			duration,
			hasResult: !!stage.result,
			hasError: !!stage.error,
		};
	}

	/**
	 * Create pipeline summary for logging
	 */
	static createPipelineSummary(context: PipelineContext): {
		projectId: string;
		totalStages: number;
		completedStages: number;
		progress: number;
		status: ProjectStatus;
		totalDuration?: string;
		stages: ReturnType<typeof PipelineDataUtils.createStageSummary>[];
	} {
		const summary = PipelineStatusUtils.getPipelineSummary(context.stages);
		const totalDuration = PipelineTimingUtils.calculateTotalDuration(
			context.stages,
		);

		return {
			projectId: context.projectId,
			totalStages: summary.total,
			completedStages: summary.completed,
			progress: summary.progress,
			status: summary.status,
			totalDuration: totalDuration
				? PipelineTimingUtils.formatDuration(totalDuration)
				: undefined,
			stages: context.stages.map((stage) => this.createStageSummary(stage)),
		};
	}
}
