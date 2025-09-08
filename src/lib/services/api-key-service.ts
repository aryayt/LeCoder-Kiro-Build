import type { AIProvider } from "~/lib/ai/base-agent";
import {
	decryptApiKey,
	encryptApiKey,
	maskApiKey,
	validateApiKeyFormat,
} from "~/lib/crypto/api-key-encryption";
import { db } from "~/server/db";

export interface UserApiKeyData {
	id: string;
	provider: AIProvider;
	keyName?: string;
	maskedKey: string;
	isActive: boolean;
	lastUsed?: Date;
	createdAt: Date;
}

export interface CreateApiKeyRequest {
	userId: string;
	provider: AIProvider;
	apiKey: string;
	keyName?: string;
}

export interface UpdateApiKeyRequest {
	keyId: string;
	userId: string;
	apiKey?: string;
	keyName?: string;
	isActive?: boolean;
}

export class ApiKeyService {
	/**
	 * Store a new API key for a user
	 */
	static async createApiKey(
		request: CreateApiKeyRequest,
	): Promise<UserApiKeyData> {
		const { userId, provider, apiKey, keyName } = request;

		// Validate API key format
		if (!validateApiKeyFormat(provider.toLowerCase(), apiKey)) {
			throw new Error(`Invalid API key format for ${provider}`);
		}

		// Encrypt the API key
		const encryptedKey = await encryptApiKey(apiKey);

		// Store in database (upsert to handle provider uniqueness)
		const userApiKey = await db.userApiKey.upsert({
			where: {
				userId_provider: {
					userId,
					provider,
				},
			},
			update: {
				encryptedKey,
				keyName,
				isActive: true,
				updatedAt: new Date(),
			},
			create: {
				userId,
				provider,
				encryptedKey,
				keyName,
				isActive: true,
			},
		});

		return {
			id: userApiKey.id,
			provider: userApiKey.provider,
			keyName: userApiKey.keyName || undefined,
			maskedKey: maskApiKey(apiKey),
			isActive: userApiKey.isActive,
			lastUsed: userApiKey.lastUsed || undefined,
			createdAt: userApiKey.createdAt,
		};
	}

	/**
	 * Get all API keys for a user (without decrypting)
	 */
	static async getUserApiKeys(userId: string): Promise<UserApiKeyData[]> {
		const apiKeys = await db.userApiKey.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});

		return apiKeys.map((key) => ({
			id: key.id,
			provider: key.provider,
			keyName: key.keyName || undefined,
			maskedKey: "****", // We can't unmask without decrypting
			isActive: key.isActive,
			lastUsed: key.lastUsed || undefined,
			createdAt: key.createdAt,
		}));
	}

	/**
	 * Get a decrypted API key for use in AI operations
	 */
	static async getDecryptedApiKey(
		userId: string,
		provider: AIProvider,
	): Promise<string | null> {
		const userApiKey = await db.userApiKey.findUnique({
			where: {
				userId_provider: {
					userId,
					provider,
				},
			},
		});

		if (!userApiKey || !userApiKey.isActive) {
			return null;
		}

		try {
			const decryptedKey = await decryptApiKey(userApiKey.encryptedKey);

			// Update last used timestamp
			await db.userApiKey.update({
				where: { id: userApiKey.id },
				data: { lastUsed: new Date() },
			});

			return decryptedKey;
		} catch (error) {
			console.error("Failed to decrypt API key:", error);
			return null;
		}
	}

	/**
	 * Update an existing API key
	 */
	static async updateApiKey(
		request: UpdateApiKeyRequest,
	): Promise<UserApiKeyData> {
		const { keyId, userId, apiKey, keyName, isActive } = request;

		// Verify ownership
		const existingKey = await db.userApiKey.findFirst({
			where: {
				id: keyId,
				userId,
			},
		});

		if (!existingKey) {
			throw new Error("API key not found or access denied");
		}

		const updateData: any = {};

		if (apiKey !== undefined) {
			if (!validateApiKeyFormat(existingKey.provider.toLowerCase(), apiKey)) {
				throw new Error(`Invalid API key format for ${existingKey.provider}`);
			}
			updateData.encryptedKey = await encryptApiKey(apiKey);
		}

		if (keyName !== undefined) {
			updateData.keyName = keyName;
		}

		if (isActive !== undefined) {
			updateData.isActive = isActive;
		}

		updateData.updatedAt = new Date();

		const updatedKey = await db.userApiKey.update({
			where: { id: keyId },
			data: updateData,
		});

		return {
			id: updatedKey.id,
			provider: updatedKey.provider,
			keyName: updatedKey.keyName || undefined,
			maskedKey: apiKey ? maskApiKey(apiKey) : "****",
			isActive: updatedKey.isActive,
			lastUsed: updatedKey.lastUsed || undefined,
			createdAt: updatedKey.createdAt,
		};
	}

	/**
	 * Delete an API key
	 */
	static async deleteApiKey(keyId: string, userId: string): Promise<void> {
		const result = await db.userApiKey.deleteMany({
			where: {
				id: keyId,
				userId,
			},
		});

		if (result.count === 0) {
			throw new Error("API key not found or access denied");
		}
	}

	/**
	 * Test an API key by making a simple request
	 */
	static async testApiKey(
		provider: AIProvider,
		apiKey: string,
	): Promise<boolean> {
		try {
			// Import AI SDK dynamically to avoid circular dependencies
			const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
			const { generateText } = await import("ai");

			switch (provider) {
				case "GOOGLE": {
					const google = createGoogleGenerativeAI({ apiKey });
					const model = google("gemini-2.0-flash-exp");

					await generateText({
						model,
						prompt: 'Say "test" if you can read this.',
						maxTokens: 10,
					});

					return true;
				}

				case "OPENAI": {
					const { openai } = await import("@ai-sdk/openai");
					const { createOpenAI } = await import("@ai-sdk/openai");

					const openaiClient = createOpenAI({ apiKey });
					const model = openaiClient("gpt-3.5-turbo");

					await generateText({
						model,
						prompt: 'Say "test" if you can read this.',
						maxTokens: 10,
					});

					return true;
				}

				case "ANTHROPIC": {
					const { createAnthropic } = await import("@ai-sdk/anthropic");

					const anthropicClient = createAnthropic({ apiKey });
					const model = anthropicClient("claude-3-haiku-20240307");

					await generateText({
						model,
						prompt: 'Say "test" if you can read this.',
						maxTokens: 10,
					});

					return true;
				}

				default:
					return false;
			}
		} catch (error) {
			console.error("API key test failed:", error);
			return false;
		}
	}

	/**
	 * Check if user has a valid API key for a provider
	 */
	static async hasValidApiKey(
		userId: string,
		provider: AIProvider,
	): Promise<boolean> {
		const apiKey = await this.getDecryptedApiKey(userId, provider);
		return apiKey !== null;
	}

	/**
	 * Get available providers for a user
	 */
	static async getAvailableProviders(userId: string): Promise<AIProvider[]> {
		const apiKeys = await db.userApiKey.findMany({
			where: {
				userId,
				isActive: true,
			},
			select: {
				provider: true,
			},
		});

		return apiKeys.map((key) => key.provider);
	}
}
