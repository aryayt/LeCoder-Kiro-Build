/**
 * Pipeline-specific error types and handling utilities
 */

export enum PipelineErrorType {
	VALIDATION_ERROR = "VALIDATION_ERROR",
	STAGE_EXECUTION_ERROR = "STAGE_EXECUTION_ERROR",
	AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
	DATABASE_ERROR = "DATABASE_ERROR",
	TIMEOUT_ERROR = "TIMEOUT_ERROR",
	RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
	CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
	CONTEXT_ERROR = "CONTEXT_ERROR",
	RETRY_EXHAUSTED_ERROR = "RETRY_EXHAUSTED_ERROR",
}

export interface PipelineError {
	type: PipelineErrorType;
	message: string;
	code: string;
	stage?: number;
	stageName?: string;
	retryable: boolean;
	details?: any;
	timestamp: Date;
	projectId?: string;
}

export class PipelineErrorHandler {
	/**
	 * Create a pipeline error
	 */
	static createError(
		type: PipelineErrorType,
		message: string,
		options: {
			code?: string;
			stage?: number;
			stageName?: string;
			retryable?: boolean;
			details?: any;
			projectId?: string;
		} = {},
	): PipelineError {
		return {
			type,
			message,
			code: options.code || this.generateErrorCode(type),
			stage: options.stage,
			stageName: options.stageName,
			retryable: options.retryable ?? this.isRetryableByDefault(type),
			details: options.details,
			timestamp: new Date(),
			projectId: options.projectId,
		};
	}

	/**
	 * Generate error code based on type
	 */
	private static generateErrorCode(type: PipelineErrorType): string {
		const timestamp = Date.now().toString(36);
		const typeCode = type.split("_")[0].toLowerCase();
		return `${typeCode}_${timestamp}`;
	}

	/**
	 * Determine if error type is retryable by default
	 */
	private static isRetryableByDefault(type: PipelineErrorType): boolean {
		const retryableTypes = [
			PipelineErrorType.AI_SERVICE_ERROR,
			PipelineErrorType.DATABASE_ERROR,
			PipelineErrorType.TIMEOUT_ERROR,
		];
		return retryableTypes.includes(type);
	}

	/**
	 * Parse error from various sources
	 */
	static parseError(
		error: unknown,
		context: {
			stage?: number;
			stageName?: string;
			projectId?: string;
		} = {},
	): PipelineError {
		if (error instanceof Error) {
			// Check for specific error patterns
			const message = error.message.toLowerCase();

			if (message.includes("rate limit") || message.includes("quota")) {
				return this.createError(
					PipelineErrorType.RATE_LIMIT_ERROR,
					error.message,
					{ ...context, retryable: false },
				);
			}

			if (message.includes("timeout") || message.includes("timed out")) {
				return this.createError(
					PipelineErrorType.TIMEOUT_ERROR,
					error.message,
					{ ...context, retryable: true },
				);
			}

			if (message.includes("api key") || message.includes("authentication")) {
				return this.createError(
					PipelineErrorType.CONFIGURATION_ERROR,
					error.message,
					{ ...context, retryable: false },
				);
			}

			if (message.includes("database") || message.includes("prisma")) {
				return this.createError(
					PipelineErrorType.DATABASE_ERROR,
					error.message,
					{ ...context, retryable: true },
				);
			}

			// Default to stage execution error
			return this.createError(
				PipelineErrorType.STAGE_EXECUTION_ERROR,
				error.message,
				context,
			);
		}

		// Handle string errors
		if (typeof error === "string") {
			return this.createError(
				PipelineErrorType.STAGE_EXECUTION_ERROR,
				error,
				context,
			);
		}

		// Handle unknown errors
		return this.createError(
			PipelineErrorType.STAGE_EXECUTION_ERROR,
			"Unknown error occurred",
			{ ...context, details: error },
		);
	}

	/**
	 * Format error for user display
	 */
	static formatErrorForUser(error: PipelineError): string {
		const stageInfo = error.stage
			? ` (Stage ${error.stage}${error.stageName ? `: ${error.stageName}` : ""})`
			: "";

		switch (error.type) {
			case PipelineErrorType.RATE_LIMIT_ERROR:
				return `Rate limit exceeded${stageInfo}. Please wait before retrying.`;

			case PipelineErrorType.TIMEOUT_ERROR:
				return `Operation timed out${stageInfo}. This may be due to high server load.`;

			case PipelineErrorType.CONFIGURATION_ERROR:
				return `Configuration error${stageInfo}. Please check your API keys and settings.`;

			case PipelineErrorType.AI_SERVICE_ERROR:
				return `AI service error${stageInfo}. The AI provider may be experiencing issues.`;

			case PipelineErrorType.DATABASE_ERROR:
				return `Database error${stageInfo}. Please try again in a moment.`;

			case PipelineErrorType.VALIDATION_ERROR:
				return `Validation error${stageInfo}: ${error.message}`;

			case PipelineErrorType.CONTEXT_ERROR:
				return `Context error${stageInfo}: ${error.message}`;

			case PipelineErrorType.RETRY_EXHAUSTED_ERROR:
				return `Maximum retries exceeded${stageInfo}. Please try again later.`;

			default:
				return `Pipeline error${stageInfo}: ${error.message}`;
		}
	}

	/**
	 * Format error for logging
	 */
	static formatErrorForLogging(error: PipelineError): string {
		const parts = [
			`[${error.type}]`,
			`Code: ${error.code}`,
			`Message: ${error.message}`,
		];

		if (error.projectId) {
			parts.push(`Project: ${error.projectId}`);
		}

		if (error.stage) {
			parts.push(
				`Stage: ${error.stage}${error.stageName ? ` (${error.stageName})` : ""}`,
			);
		}

		if (error.details) {
			parts.push(`Details: ${JSON.stringify(error.details)}`);
		}

		parts.push(`Timestamp: ${error.timestamp.toISOString()}`);
		parts.push(`Retryable: ${error.retryable}`);

		return parts.join(" | ");
	}

	/**
	 * Check if error should trigger immediate failure (non-retryable)
	 */
	static shouldFailImmediately(error: PipelineError): boolean {
		const immediateFailureTypes = [
			PipelineErrorType.CONFIGURATION_ERROR,
			PipelineErrorType.VALIDATION_ERROR,
			PipelineErrorType.RATE_LIMIT_ERROR,
			PipelineErrorType.RETRY_EXHAUSTED_ERROR,
		];

		return immediateFailureTypes.includes(error.type) || !error.retryable;
	}

	/**
	 * Get suggested retry delay based on error type
	 */
	static getSuggestedRetryDelay(error: PipelineError, attempt: number): number {
		const baseDelay = 1000; // 1 second

		switch (error.type) {
			case PipelineErrorType.RATE_LIMIT_ERROR:
				return 60000; // 1 minute for rate limits

			case PipelineErrorType.AI_SERVICE_ERROR:
				return baseDelay * Math.pow(2, attempt); // Exponential backoff

			case PipelineErrorType.DATABASE_ERROR:
				return baseDelay * (attempt + 1); // Linear backoff

			case PipelineErrorType.TIMEOUT_ERROR:
				return baseDelay * Math.pow(1.5, attempt); // Moderate exponential backoff

			default:
				return baseDelay * Math.pow(2, attempt); // Default exponential backoff
		}
	}

	/**
	 * Create recovery suggestions for errors
	 */
	static getRecoverySuggestions(error: PipelineError): string[] {
		const suggestions: string[] = [];

		switch (error.type) {
			case PipelineErrorType.RATE_LIMIT_ERROR:
				suggestions.push("Wait for the rate limit to reset");
				suggestions.push("Consider upgrading your API plan for higher limits");
				break;

			case PipelineErrorType.CONFIGURATION_ERROR:
				suggestions.push(
					"Check your API keys in the environment configuration",
				);
				suggestions.push(
					"Verify that all required services are properly configured",
				);
				break;

			case PipelineErrorType.AI_SERVICE_ERROR:
				suggestions.push("Check the status of the AI service provider");
				suggestions.push(
					"Try switching to a different AI provider if available",
				);
				break;

			case PipelineErrorType.DATABASE_ERROR:
				suggestions.push("Check database connectivity");
				suggestions.push("Verify database credentials and permissions");
				break;

			case PipelineErrorType.TIMEOUT_ERROR:
				suggestions.push("Try again during off-peak hours");
				suggestions.push(
					"Consider breaking down large documents into smaller sections",
				);
				break;

			case PipelineErrorType.VALIDATION_ERROR:
				suggestions.push("Check the input data format and requirements");
				suggestions.push("Ensure all required fields are provided");
				break;

			default:
				suggestions.push("Try the operation again");
				suggestions.push("Contact support if the problem persists");
				break;
		}

		if (error.retryable) {
			suggestions.unshift(
				"This error is retryable - the system will automatically retry",
			);
		}

		return suggestions;
	}

	/**
	 * Log error with appropriate level
	 */
	static logError(error: PipelineError, logger: Console = console): void {
		const logMessage = this.formatErrorForLogging(error);

		if (this.shouldFailImmediately(error)) {
			logger.error(logMessage);
		} else {
			logger.warn(logMessage);
		}
	}
}
