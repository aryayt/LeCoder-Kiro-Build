import { env } from "~/env.js";
import type { PipelineContext } from "~/types/ai";
import type { AIProvider } from "./base-agent";
import { PipelineContextFactory } from "./pipeline-context";
import { PipelineErrorHandler, PipelineErrorType } from "./pipeline-errors";
import {
	type PipelineConfig,
	PipelineManager,
	type PipelineResult,
} from "./pipeline-manager";

/**
 * Service class for managing pipeline operations
 */
export class PipelineService {
	private static instance: PipelineService;
	private pipelineManager: PipelineManager;

	private constructor() {
		// Initialize pipeline manager with default configuration
		const config = this.createDefaultConfig();
		this.pipelineManager = new PipelineManager(config);
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(): PipelineService {
		if (!PipelineService.instance) {
			PipelineService.instance = new PipelineService();
		}
		return PipelineService.instance;
	}

	/**
	 * Create default pipeline configuration
	 */
	private createDefaultConfig(): PipelineConfig {
		// Determine available providers based on environment variables
		const availableProviders: AIProvider[] = [];

		if (env.OPENAI_API_KEY) availableProviders.push("openai");
		if (env.GOOGLE_GENERATIVE_AI_API_KEY) availableProviders.push("google");
		if (env.ANTHROPIC_API_KEY) availableProviders.push("anthropic");

		if (availableProviders.length === 0) {
			throw new Error(
				"No AI providers configured. Please set at least one API key.",
			);
		}

		// Use the first available provider as default
		const defaultProvider = availableProviders[0];

		// Get model names based on provider
		const getModelName = (provider: AIProvider): string => {
			switch (provider) {
				case "openai":
					return "gpt-4o-mini";
				case "google":
					return "gemini-1.5-flash";
				case "anthropic":
					return "claude-3-haiku-20240307";
				default:
					return "gpt-4o-mini";
			}
		};

		const baseConfig = {
			provider: defaultProvider,
			model: getModelName(defaultProvider),
			temperature: 0.7,
			maxTokens: 4000,
			retryAttempts: 3,
			retryDelay: 1000,
		};

		return {
			conceptExtractor: { ...baseConfig },
			algorithmAnalyzer: { ...baseConfig },
			architecturePlanner: { ...baseConfig },
			implementationPlanner: { ...baseConfig },
			codeGenerator: {
				...baseConfig,
				temperature: 0.3, // Lower temperature for code generation
				maxTokens: 8000, // More tokens for code generation
			},
			documentationGenerator: { ...baseConfig },
			maxRetries: 3,
			retryDelay: 1000,
			enableParallelProcessing: false,
		};
	}

	/**
	 * Start pipeline execution for a project
	 */
	async startPipeline(projectId: string): Promise<{
		success: boolean;
		message: string;
		error?: string;
	}> {
		try {
			// Create pipeline context from project
			const context = await PipelineContextFactory.fromProjectId(projectId);

			if (!context) {
				const error = PipelineErrorHandler.createError(
					PipelineErrorType.CONTEXT_ERROR,
					"Project not found or invalid",
					{ projectId },
				);

				PipelineErrorHandler.logError(error);

				return {
					success: false,
					message: "Failed to start pipeline",
					error: PipelineErrorHandler.formatErrorForUser(error),
				};
			}

			// Validate context
			const validation = PipelineContextFactory.validate(context);
			if (!validation.valid) {
				const error = PipelineErrorHandler.createError(
					PipelineErrorType.VALIDATION_ERROR,
					`Context validation failed: ${validation.errors.join(", ")}`,
					{ projectId },
				);

				PipelineErrorHandler.logError(error);

				return {
					success: false,
					message: "Failed to start pipeline",
					error: PipelineErrorHandler.formatErrorForUser(error),
				};
			}

			// Start pipeline execution asynchronously
			this.executePipelineAsync(context);

			return {
				success: true,
				message: "Pipeline started successfully",
			};
		} catch (error) {
			const pipelineError = PipelineErrorHandler.parseError(error, {
				projectId,
			});
			PipelineErrorHandler.logError(pipelineError);

			return {
				success: false,
				message: "Failed to start pipeline",
				error: PipelineErrorHandler.formatErrorForUser(pipelineError),
			};
		}
	}

	/**
	 * Execute pipeline asynchronously
	 */
	private async executePipelineAsync(context: PipelineContext): Promise<void> {
		try {
			const result = await this.pipelineManager.executePipeline(context);

			if (result.success) {
				console.log(
					`Pipeline completed successfully for project ${context.projectId}`,
				);
			} else {
				console.error(
					`Pipeline failed for project ${context.projectId}:`,
					result.error,
				);
			}
		} catch (error) {
			const pipelineError = PipelineErrorHandler.parseError(error, {
				projectId: context.projectId,
			});

			PipelineErrorHandler.logError(pipelineError);
		}
	}

	/**
	 * Get pipeline progress for a project
	 */
	async getPipelineProgress(projectId: string): Promise<{
		success: boolean;
		data?: {
			currentStage: number;
			totalStages: number;
			stages: Array<{
				id: number;
				name: string;
				status: string;
				startTime?: Date;
				endTime?: Date;
				error?: string;
			}>;
			status: string;
			progressPercentage: number;
		};
		error?: string;
	}> {
		try {
			const progress =
				await this.pipelineManager.getPipelineProgress(projectId);

			const progressPercentage = Math.round(
				(progress.currentStage / progress.totalStages) * 100,
			);

			return {
				success: true,
				data: {
					...progress,
					progressPercentage,
				},
			};
		} catch (error) {
			const pipelineError = PipelineErrorHandler.parseError(error, {
				projectId,
			});
			PipelineErrorHandler.logError(pipelineError);

			return {
				success: false,
				error: PipelineErrorHandler.formatErrorForUser(pipelineError),
			};
		}
	}

	/**
	 * Cancel pipeline execution
	 */
	async cancelPipeline(projectId: string): Promise<{
		success: boolean;
		message: string;
		error?: string;
	}> {
		try {
			await this.pipelineManager.cancelPipeline(projectId);

			return {
				success: true,
				message: "Pipeline cancelled successfully",
			};
		} catch (error) {
			const pipelineError = PipelineErrorHandler.parseError(error, {
				projectId,
			});
			PipelineErrorHandler.logError(pipelineError);

			return {
				success: false,
				message: "Failed to cancel pipeline",
				error: PipelineErrorHandler.formatErrorForUser(pipelineError),
			};
		}
	}

	/**
	 * Retry failed pipeline
	 */
	async retryPipeline(projectId: string): Promise<{
		success: boolean;
		message: string;
		error?: string;
	}> {
		try {
			// Create context for retry
			const context = await PipelineContextFactory.fromProjectId(projectId);

			if (!context) {
				const error = PipelineErrorHandler.createError(
					PipelineErrorType.CONTEXT_ERROR,
					"Project not found for retry",
					{ projectId },
				);

				return {
					success: false,
					message: "Failed to retry pipeline",
					error: PipelineErrorHandler.formatErrorForUser(error),
				};
			}

			// Start retry asynchronously
			this.retryPipelineAsync(context);

			return {
				success: true,
				message: "Pipeline retry started successfully",
			};
		} catch (error) {
			const pipelineError = PipelineErrorHandler.parseError(error, {
				projectId,
			});
			PipelineErrorHandler.logError(pipelineError);

			return {
				success: false,
				message: "Failed to retry pipeline",
				error: PipelineErrorHandler.formatErrorForUser(pipelineError),
			};
		}
	}

	/**
	 * Retry pipeline asynchronously
	 */
	private async retryPipelineAsync(context: PipelineContext): Promise<void> {
		try {
			const result = await this.pipelineManager.retryPipeline(context);

			if (result.success) {
				console.log(
					`Pipeline retry completed successfully for project ${context.projectId}`,
				);
			} else {
				console.error(
					`Pipeline retry failed for project ${context.projectId}:`,
					result.error,
				);
			}
		} catch (error) {
			const pipelineError = PipelineErrorHandler.parseError(error, {
				projectId: context.projectId,
			});

			PipelineErrorHandler.logError(pipelineError);
		}
	}

	/**
	 * Get pipeline configuration
	 */
	getPipelineConfiguration(): {
		availableProviders: AIProvider[];
		currentConfig: PipelineConfig;
	} {
		const availableProviders: AIProvider[] = [];

		if (env.OPENAI_API_KEY) availableProviders.push("openai");
		if (env.GOOGLE_GENERATIVE_AI_API_KEY) availableProviders.push("google");
		if (env.ANTHROPIC_API_KEY) availableProviders.push("anthropic");

		return {
			availableProviders,
			currentConfig: this.createDefaultConfig(),
		};
	}

	/**
	 * Update pipeline configuration
	 */
	updatePipelineConfiguration(config: Partial<PipelineConfig>): void {
		const currentConfig = this.createDefaultConfig();
		const newConfig = { ...currentConfig, ...config };

		this.pipelineManager = new PipelineManager(newConfig);
	}

	/**
	 * Health check for pipeline service
	 */
	async healthCheck(): Promise<{
		status: "healthy" | "unhealthy";
		details: {
			configurationValid: boolean;
			availableProviders: AIProvider[];
			databaseConnected: boolean;
		};
		timestamp: Date;
	}> {
		const details = {
			configurationValid: false,
			availableProviders: [] as AIProvider[],
			databaseConnected: false,
		};

		try {
			// Check configuration
			const config = this.getPipelineConfiguration();
			details.availableProviders = config.availableProviders;
			details.configurationValid = config.availableProviders.length > 0;

			// Check database connection (simplified check)
			try {
				await PipelineContextFactory.fromProjectId("health-check");
				details.databaseConnected = true;
			} catch {
				details.databaseConnected = false;
			}

			const isHealthy = details.configurationValid && details.databaseConnected;

			return {
				status: isHealthy ? "healthy" : "unhealthy",
				details,
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				status: "unhealthy",
				details,
				timestamp: new Date(),
			};
		}
	}
}
