import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { env } from "~/env.js";

const scryptAsync = promisify(scrypt);

// Use a consistent algorithm
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derive encryption key from the app secret
 */
async function deriveKey(salt: Buffer): Promise<Buffer> {
	const secret = env.BETTER_AUTH_SECRET;
	return (await scryptAsync(secret, salt, KEY_LENGTH)) as Buffer;
}

/**
 * Encrypt an API key for secure storage
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
	try {
		const salt = randomBytes(16);
		const iv = randomBytes(IV_LENGTH);
		const key = await deriveKey(salt);

		const cipher = createCipheriv(ALGORITHM, key, iv);

		let encrypted = cipher.update(apiKey, "utf8", "hex");
		encrypted += cipher.final("hex");

		const tag = cipher.getAuthTag();

		// Combine salt, iv, tag, and encrypted data
		const combined = Buffer.concat([
			salt,
			iv,
			tag,
			Buffer.from(encrypted, "hex"),
		]);

		return combined.toString("base64");
	} catch (error) {
		throw new Error(
			`Failed to encrypt API key: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Decrypt an API key from secure storage
 */
export async function decryptApiKey(encryptedData: string): Promise<string> {
	try {
		const combined = Buffer.from(encryptedData, "base64");

		// Extract components
		const salt = combined.subarray(0, 16);
		const iv = combined.subarray(16, 16 + IV_LENGTH);
		const tag = combined.subarray(16 + IV_LENGTH, 16 + IV_LENGTH + TAG_LENGTH);
		const encrypted = combined.subarray(16 + IV_LENGTH + TAG_LENGTH);

		const key = await deriveKey(salt);

		const decipher = createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(tag);

		let decrypted = decipher.update(encrypted, undefined, "utf8");
		decrypted += decipher.final("utf8");

		return decrypted;
	} catch (error) {
		throw new Error(
			`Failed to decrypt API key: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Validate API key format for different providers
 */
export function validateApiKeyFormat(
	provider: string,
	apiKey: string,
): boolean {
	const trimmedKey = apiKey.trim();

	switch (provider.toLowerCase()) {
		case "google":
			// Google API keys typically start with "AIza" and are 39 characters long
			return /^AIza[0-9A-Za-z_-]{35}$/.test(trimmedKey);

		case "openai":
			// OpenAI API keys start with "sk-" and are typically 51 characters
			return /^sk-[a-zA-Z0-9]{48}$/.test(trimmedKey);

		case "anthropic":
			// Anthropic API keys start with "sk-ant-"
			return /^sk-ant-[a-zA-Z0-9_-]+$/.test(trimmedKey);

		default:
			// Basic validation for unknown providers
			return trimmedKey.length >= 20 && trimmedKey.length <= 200;
	}
}

/**
 * Mask API key for display purposes
 */
export function maskApiKey(apiKey: string): string {
	if (apiKey.length <= 8) {
		return "*".repeat(apiKey.length);
	}

	const start = apiKey.substring(0, 4);
	const end = apiKey.substring(apiKey.length - 4);
	const middle = "*".repeat(Math.max(4, apiKey.length - 8));

	return `${start}${middle}${end}`;
}

/**
 * Generate a test API key for development/testing
 */
export function generateTestApiKey(provider: string): string {
	switch (provider.toLowerCase()) {
		case "google":
			return `AIza${"x".repeat(35)}`;
		case "openai":
			return `sk-${"x".repeat(48)}`;
		case "anthropic":
			return `sk-ant-${"x".repeat(20)}`;
		default:
			return `test-${provider}-${"x".repeat(20)}`;
	}
}
