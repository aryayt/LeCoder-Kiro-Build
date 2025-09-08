import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI, openai } from "@ai-sdk/openai";
import type { AIProvider as PrismaAIProvider } from "@prisma/client";
import { type CoreMessage, generateText } from "ai";
import { env } from "~/env.js";
import { ApiKeyService } from "~/lib/services/api-key-service";
import { rateLimiter } from "./rate-limiter";

export type AIProvider = "openai" | "google" | "anthropic";

export interface AIConfig {
	provider: AIProvider;
	model: string;
	temperature?: number;
	maxTokens?: number;
	retryAttempts?: number;
	retryDelay?: number;
	userId?: string; // For user-specific API keys
	customApiKey?: string; // Direct API key override
}

export interface AgentResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	metadata?: {
		provider: AIProvider;
		model: string;
		tokensUsed?: number;
		processingTime?: number;
	};
}

export abstract class BaseAIAgent {
	protected config: AIConfig;

	constructor(config: AIConfig) {
		this.config = {
			temperature: 0.7,
			maxTokens: 4000,
			retryAttempts: 3,
			retryDelay: 1000,
			...config,
		};
	}

	/**
	 * Get the AI model instance based on provider configuration
	 */
	protected async getModel() {
		const { provider, model, userId, customApiKey } = this.config;

		// Try to get API key in order of preference:
		// 1. Custom API key (direct override)
		// 2. User-specific API key from database
		// 3. Environment variable (fallback)
		let apiKey: string | null = null;

		if (customApiKey) {
			apiKey = customApiKey;
		} else if (userId) {
			const prismaProvider = this.mapToPrismaProvider(provider);
			apiKey = await ApiKeyService.getDecryptedApiKey(userId, prismaProvider);
		}

		switch (provider) {
			case "openai": {
				const key = apiKey || env.OPENAI_API_KEY;
				if (!key) {
					throw new Error(
						"OpenAI API key not configured. Please add your API key in settings.",
					);
				}

				if (apiKey) {
					// Use custom client with user's API key
					const client = createOpenAI({ apiKey: key });
					return client(model);
				} else {
					// Use default client with env API key
					return openai(model);
				}
			}

			case "google": {
				const key = apiKey || env.GOOGLE_GENERATIVE_AI_API_KEY;
				if (!key) {
					throw new Error(
						"Google AI API key not configured. Please add your API key in settings.",
					);
				}

				if (apiKey) {
					// Use custom client with user's API key
					const client = createGoogleGenerativeAI({ apiKey: key });
					return client(model);
				} else {
					// Use default client with env API key
					return google(model);
				}
			}

			case "anthropic": {
				const key = apiKey || env.ANTHROPIC_API_KEY;
				if (!key) {
					throw new Error(
						"Anthropic API key not configured. Please add your API key in settings.",
					);
				}

				if (apiKey) {
					// Use custom client with user's API key
					const client = createAnthropic({ apiKey: key });
					return client(model);
				} else {
					// Use default client with env API key
					return anthropic(model);
				}
			}

			default:
				throw new Error(`Unsupported AI provider: ${provider}`);
		}
	}

	/**
	 * Map AI provider string to Prisma enum
	 */
	private mapToPrismaProvider(provider: AIProvider): PrismaAIProvider {
		switch (provider) {
			case "openai":
				return "OPENAI";
			case "google":
				return "GOOGLE";
			case "anthropic":
				return "ANTHROPIC";
			default:
				throw new Error(`Unknown provider: ${provider}`);
		}
	}

	/**
	 * Generate text with retry logic and error handling
	 */
	protected async generateWithRetry(
		messages: CoreMessage[],
		systemPrompt?: string,
	): Promise<AgentResponse<string>> {
		const startTime = Date.now();
		let lastError: Error | null = null;

		// Check rate limits before attempting
		if (!rateLimiter.canMakeRequest(this.config.provider)) {
			const waitTime = rateLimiter.getTimeUntilNextRequest(
				this.config.provider,
			);
			const waitSeconds = Math.ceil(waitTime / 1000);

			return {
				success: false,
				error: `Rate limit exceeded for ${this.config.provider}. Please wait ${waitSeconds} seconds.`,
				metadata: {
					provider: this.config.provider,
					model: this.config.model,
					processingTime: Date.now() - startTime,
				},
			};
		}

		for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
			try {
				const model = await this.getModel();

				const result = await generateText({
					model,
					messages: systemPrompt
						? [{ role: "system", content: systemPrompt }, ...messages]
						: messages,
					temperature: this.config.temperature,
					maxTokens: this.config.maxTokens,
				});

				const processingTime = Date.now() - startTime;

				// Record successful request for rate limiting
				rateLimiter.recordRequest(this.config.provider);

				// Log token usage for monitoring
				if (result.usage?.totalTokens) {
					console.log(
						`AI Request completed: ${this.config.provider}/${this.config.model} - ${result.usage.totalTokens} tokens in ${processingTime}ms`,
					);
				}

				return {
					success: true,
					data: result.text,
					metadata: {
						provider: this.config.provider,
						model: this.config.model,
						tokensUsed: result.usage?.totalTokens,
						promptTokens: result.usage?.promptTokens,
						completionTokens: result.usage?.completionTokens,
						processingTime,
					},
				};
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				// Don't retry on authentication or configuration errors
				if (this.isNonRetryableError(lastError)) {
					break;
				}

				// Don't retry on rate limit errors
				if (this.isRateLimitError(lastError)) {
					break;
				}

				// Wait before retrying (exponential backoff)
				if (attempt < this.config.retryAttempts!) {
					await this.delay(this.config.retryDelay! * Math.pow(2, attempt - 1));
				}
			}
		}

		return {
			success: false,
			error: lastError?.message || "Unknown error occurred",
			metadata: {
				provider: this.config.provider,
				model: this.config.model,
				processingTime: Date.now() - startTime,
			},
		};
	}

	/**
	 * Check if an error should not be retried
	 */
	private isNonRetryableError(error: Error): boolean {
		const message = error.message.toLowerCase();
		return (
			message.includes("api key") ||
			message.includes("authentication") ||
			message.includes("unauthorized") ||
			message.includes("not configured")
		);
	}

	/**
	 * Check if an error is related to rate limiting
	 */
	private isRateLimitError(error: Error): boolean {
		const message = error.message.toLowerCase();
		return (
			message.includes("rate limit") ||
			message.includes("quota") ||
			message.includes("too many requests") ||
			message.includes("429")
		);
	}

	/**
	 * Delay utility for retry logic
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Parse JSON response with error handling
	 */
	protected parseJsonResponse<T>(text: string): AgentResponse<T> {
		try {
			const data = JSON.parse(text) as T;
			return { success: true, data };
		} catch (error) {
			return {
				success: false,
				error: `Failed to parse JSON response: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	/**
	 * Validate required fields in response data
	 */
	protected validateResponse<T extends Record<string, any>>(
		data: T,
		requiredFields: (keyof T)[],
	): AgentResponse<T> {
		const missingFields = requiredFields.filter(
			(field) =>
				data[field] === undefined || data[field] === null || data[field] === "",
		);

		if (missingFields.length > 0) {
			return {
				success: false,
				error: `Missing required fields: ${missingFields.join(", ")}`,
			};
		}

		return { success: true, data };
	}
}
