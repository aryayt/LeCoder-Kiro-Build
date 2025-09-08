import { ProjectStatus, StageStatus } from "@prisma/client";
import {
	createPipelineStages,
	getStagesByProjectId,
	updateProjectStatus,
	updateStageStatus,
} from "~/lib/db/operations";
import type {
	AlgorithmAnalysisResult,
	AlgorithmSpecs,
	ConceptExtractionResult,
	PipelineContext,
	PipelineStage,
	ResearchConcepts,
} from "~/types/ai";
import { AlgorithmAnalyzerAgent } from "./agents/algorithm-analyzer";
import { ConceptExtractorAgent } from "./agents/concept-extractor";
import type { AIConfig, AgentResponse } from "./base-agent";

export interface PipelineConfig {
	conceptExtractor: AIConfig;
	algorithmAnalyzer: AIConfig;
	architecturePlanner: AIConfig;
	implementationPlanner: AIConfig;
	codeGenerator: AIConfig;
	documentationGenerator: AIConfig;
	maxRetries?: number;
	retryDelay?: number;
	enableParallelProcessing?: boolean;
}

export interface PipelineResult {
	success: boolean;
	projectId: string;
	completedStages: number;
	results: {
		concepts?: ConceptExtractionResult;
		algorithms?: AlgorithmAnalysisResult;
		architecture?: any;
		implementation?: any;
		code?: any;
		documentation?: any;
	};
	error?: string;
	metadata?: {
		totalProcessingTime: number;
		stageTimings: Record<number, number>;
		retryCount: number;
	};
}

export class PipelineManager {
	private config: PipelineConfig;
	private conceptExtractor: ConceptExtractorAgent;
	private algorithmAnalyzer: AlgorithmAnalyzerAgent;

	constructor(config: PipelineConfig) {
		this.config = {
			maxRetries: 3,
			retryDelay: 1000,
			enableParallelProcessing: false,
			...config,
		};

		// Initialize AI agents
		this.conceptExtractor = new ConceptExtractorAgent(
			this.config.conceptExtractor,
		);
		this.algorithmAnalyzer = new AlgorithmAnalyzerAgent(
			this.config.algorithmAnalyzer,
		);
	}

	/**
	 * Execute the complete 6-stage pipeline for a project
	 */
	async executePipeline(context: PipelineContext): Promise<PipelineResult> {
		const startTime = Date.now();
		const stageTimings: Record<number, number> = {};
		const retryCount = 0;

		try {
			// Update project status to processing
			await updateProjectStatus(context.projectId, ProjectStatus.PROCESSING, 0);

			// Ensure pipeline stages exist
			await this.ensurePipelineStages(context.projectId);

			// Get current stages from database
			const stages = await getStagesByProjectId(context.projectId);
			context.stages = stages.map((stage) => ({
				id: stage.stageNumber,
				name: stage.stageName,
				status: stage.status as
					| "pending"
					| "processing"
					| "completed"
					| "error",
				result: stage.outputData,
				error: stage.errorMessage || undefined,
				startTime: stage.startedAt || undefined,
				endTime: stage.completedAt || undefined,
			}));

			const results: PipelineResult["results"] = {};

			// Execute stages sequentially
			for (let stageNumber = 1; stageNumber <= 6; stageNumber++) {
				const stageStartTime = Date.now();

				try {
					const stageResult = await this.executeStageWithRetry(
						context,
						stageNumber,
						results,
					);

					if (!stageResult.success) {
						throw new Error(stageResult.error || `Stage ${stageNumber} failed`);
					}

					// Store stage result
					switch (stageNumber) {
						case 1:
							results.concepts = stageResult.data as ConceptExtractionResult;
							break;
						case 2:
							results.algorithms = stageResult.data as AlgorithmAnalysisResult;
							break;
						case 3:
							results.architecture = stageResult.data;
							break;
						case 4:
							results.implementation = stageResult.data;
							break;
						case 5:
							results.code = stageResult.data;
							break;
						case 6:
							results.documentation = stageResult.data;
							break;
					}

					stageTimings[stageNumber] = Date.now() - stageStartTime;

					// Update project current stage
					await updateProjectStatus(
						context.projectId,
						ProjectStatus.PROCESSING,
						stageNumber,
					);
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";

					// Update stage status to error
					const stage = stages.find((s) => s.stageNumber === stageNumber);
					if (stage) {
						await updateStageStatus(stage.id, StageStatus.ERROR, {
							errorMessage,
						});
					}

					// Update project status to error
					await updateProjectStatus(
						context.projectId,
						ProjectStatus.ERROR,
						stageNumber - 1,
					);

					return {
						success: false,
						projectId: context.projectId,
						completedStages: stageNumber - 1,
						results,
						error: `Pipeline failed at stage ${stageNumber}: ${errorMessage}`,
						metadata: {
							totalProcessingTime: Date.now() - startTime,
							stageTimings,
							retryCount,
						},
					};
				}
			}

			// Mark project as completed
			await updateProjectStatus(context.projectId, ProjectStatus.COMPLETED, 6);

			return {
				success: true,
				projectId: context.projectId,
				completedStages: 6,
				results,
				metadata: {
					totalProcessingTime: Date.now() - startTime,
					stageTimings,
					retryCount,
				},
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown pipeline error";

			// Update project status to error
			await updateProjectStatus(context.projectId, ProjectStatus.ERROR);

			return {
				success: false,
				projectId: context.projectId,
				completedStages: 0,
				results: {},
				error: errorMessage,
				metadata: {
					totalProcessingTime: Date.now() - startTime,
					stageTimings,
					retryCount,
				},
			};
		}
	}

	/**
	 * Execute a single stage with retry logic
	 */
	private async executeStageWithRetry(
		context: PipelineContext,
		stageNumber: number,
		previousResults: PipelineResult["results"],
	): Promise<AgentResponse> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
			try {
				// Get stage from database
				const stages = await getStagesByProjectId(context.projectId);
				const stage = stages.find((s) => s.stageNumber === stageNumber);

				if (!stage) {
					throw new Error(`Stage ${stageNumber} not found`);
				}

				// Update stage status to processing
				await updateStageStatus(stage.id, StageStatus.PROCESSING);

				// Execute the specific stage
				const result = await this.executeStage(
					context,
					stageNumber,
					previousResults,
				);

				if (result.success) {
					// Update stage status to completed with output data
					await updateStageStatus(stage.id, StageStatus.COMPLETED, {
						outputData: result.data,
					});

					return result;
				} else {
					throw new Error(result.error || "Stage execution failed");
				}
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				// Update stage status to retrying (except on last attempt)
				if (attempt < this.config.maxRetries!) {
					const stages = await getStagesByProjectId(context.projectId);
					const stage = stages.find((s) => s.stageNumber === stageNumber);

					if (stage) {
						await updateStageStatus(stage.id, StageStatus.RETRYING, {
							errorMessage: `Attempt ${attempt} failed: ${lastError.message}`,
						});
					}

					// Wait before retrying with exponential backoff
					await this.delay(this.config.retryDelay! * Math.pow(2, attempt - 1));
				}
			}
		}

		return {
			success: false,
			error: lastError?.message || "Stage execution failed after all retries",
		};
	}

	/**
	 * Execute a specific pipeline stage
	 */
	private async executeStage(
		context: PipelineContext,
		stageNumber: number,
		previousResults: PipelineResult["results"],
	): Promise<AgentResponse> {
		switch (stageNumber) {
			case 1:
				return this.executeConceptExtraction(context);

			case 2:
				return this.executeAlgorithmAnalysis(context, previousResults.concepts);

			case 3:
				return this.executeArchitecturePlanning(context, previousResults);

			case 4:
				return this.executeImplementationPlanning(context, previousResults);

			case 5:
				return this.executeCodeGeneration(context, previousResults);

			case 6:
				return this.executeDocumentationGeneration(context, previousResults);

			default:
				return {
					success: false,
					error: `Invalid stage number: ${stageNumber}`,
				};
		}
	}

	/**
	 * Stage 1: Concept Extraction
	 */
	private async executeConceptExtraction(
		context: PipelineContext,
	): Promise<AgentResponse> {
		return this.conceptExtractor.extractConceptsWithFallback(
			context.paperContent,
		);
	}

	/**
	 * Stage 2: Algorithm Analysis
	 */
	private async executeAlgorithmAnalysis(
		context: PipelineContext,
		conceptsResult?: ConceptExtractionResult,
	): Promise<AgentResponse> {
		if (!conceptsResult) {
			return {
				success: false,
				error: "Concepts extraction result is required for algorithm analysis",
			};
		}

		return this.algorithmAnalyzer.analyzeAlgorithmsWithFallback(
			conceptsResult.concepts,
			context.paperContent,
		);
	}

	/**
	 * Stage 3: Architecture Planning (placeholder - to be implemented)
	 */
	private async executeArchitecturePlanning(
		context: PipelineContext,
		previousResults: PipelineResult["results"],
	): Promise<AgentResponse> {
		// TODO: Implement architecture planning agent
		return {
			success: true,
			data: {
				architecture: "placeholder",
				message: "Architecture planning not yet implemented",
			},
		};
	}

	/**
	 * Stage 4: Implementation Planning (placeholder - to be implemented)
	 */
	private async executeImplementationPlanning(
		context: PipelineContext,
		previousResults: PipelineResult["results"],
	): Promise<AgentResponse> {
		// TODO: Implement implementation planning agent
		return {
			success: true,
			data: {
				implementation: "placeholder",
				message: "Implementation planning not yet implemented",
			},
		};
	}

	/**
	 * Stage 5: Code Generation (placeholder - to be implemented)
	 */
	private async executeCodeGeneration(
		context: PipelineContext,
		previousResults: PipelineResult["results"],
	): Promise<AgentResponse> {
		// TODO: Implement code generation agent
		return {
			success: true,
			data: {
				code: "placeholder",
				message: "Code generation not yet implemented",
			},
		};
	}

	/**
	 * Stage 6: Documentation Generation (placeholder - to be implemented)
	 */
	private async executeDocumentationGeneration(
		context: PipelineContext,
		previousResults: PipelineResult["results"],
	): Promise<AgentResponse> {
		// TODO: Implement documentation generation agent
		return {
			success: true,
			data: {
				documentation: "placeholder",
				message: "Documentation generation not yet implemented",
			},
		};
	}

	/**
	 * Ensure pipeline stages exist for a project
	 */
	private async ensurePipelineStages(projectId: string): Promise<void> {
		const existingStages = await getStagesByProjectId(projectId);

		if (existingStages.length === 0) {
			await createPipelineStages(projectId);
		}
	}

	/**
	 * Get pipeline progress for a project
	 */
	async getPipelineProgress(projectId: string): Promise<{
		currentStage: number;
		totalStages: number;
		stages: PipelineStage[];
		status: ProjectStatus;
	}> {
		const stages = await getStagesByProjectId(projectId);

		const pipelineStages: PipelineStage[] = stages.map((stage) => ({
			id: stage.stageNumber,
			name: stage.stageName,
			status: stage.status as "pending" | "processing" | "completed" | "error",
			result: stage.outputData,
			error: stage.errorMessage || undefined,
			startTime: stage.startedAt || undefined,
			endTime: stage.completedAt || undefined,
		}));

		const completedStages = pipelineStages.filter(
			(s) => s.status === "completed",
		).length;
		const hasError = pipelineStages.some((s) => s.status === "error");
		const isProcessing = pipelineStages.some(
			(s) => s.status === "processing" || s.status === "retrying",
		);

		let status: ProjectStatus;
		if (hasError) {
			status = ProjectStatus.ERROR;
		} else if (completedStages === 6) {
			status = ProjectStatus.COMPLETED;
		} else if (isProcessing || completedStages > 0) {
			status = ProjectStatus.PROCESSING;
		} else {
			status = ProjectStatus.UPLOADED;
		}

		return {
			currentStage: completedStages,
			totalStages: 6,
			stages: pipelineStages,
			status,
		};
	}

	/**
	 * Cancel pipeline execution
	 */
	async cancelPipeline(projectId: string): Promise<void> {
		await updateProjectStatus(projectId, ProjectStatus.CANCELLED);

		// Update any processing stages to cancelled
		const stages = await getStagesByProjectId(projectId);
		const processingStages = stages.filter(
			(s) =>
				s.status === StageStatus.PROCESSING ||
				s.status === StageStatus.RETRYING,
		);

		for (const stage of processingStages) {
			await updateStageStatus(stage.id, StageStatus.ERROR, {
				errorMessage: "Pipeline cancelled by user",
			});
		}
	}

	/**
	 * Retry failed pipeline from the last successful stage
	 */
	async retryPipeline(context: PipelineContext): Promise<PipelineResult> {
		const stages = await getStagesByProjectId(context.projectId);

		// Reset error stages to pending
		const errorStages = stages.filter((s) => s.status === StageStatus.ERROR);
		for (const stage of errorStages) {
			await updateStageStatus(stage.id, StageStatus.PENDING, {
				errorMessage: null,
			});
		}

		// Reset project status
		const lastCompletedStage = stages
			.filter((s) => s.status === StageStatus.COMPLETED)
			.reduce((max, stage) => Math.max(max, stage.stageNumber), 0);

		await updateProjectStatus(
			context.projectId,
			ProjectStatus.PROCESSING,
			lastCompletedStage,
		);

		// Execute pipeline from where it left off
		return this.executePipeline(context);
	}

	/**
	 * Utility method for delays
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
