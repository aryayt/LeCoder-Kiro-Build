import { beforeEach, describe, it } from "@jest/globals";

// Mock AI SDK modules before importing the base agent
jest.mock("ai", () => ({
	generateText: jest.fn(),
}));

jest.mock("@ai-sdk/openai", () => ({
	openai: jest.fn(),
}));

jest.mock("@ai-sdk/google", () => ({
	google: jest.fn(),
}));

jest.mock("@ai-sdk/anthropic", () => ({
	anthropic: jest.fn(),
}));

import type { Message } from "ai";
import { type AIConfig, BaseAIAgent } from "~/lib/ai/base-agent";
import {
	createMockAIResponse,
	mockAnthropic,
	mockGenerateText,
	mockGoogle,
	mockOpenAI,
} from "./test-utils";

// Create a concrete implementation for testing
class TestAgent extends BaseAIAgent {
	async testGenerateWithRetry(messages: Message[], systemPrompt?: string) {
		return this.generateWithRetry(messages, systemPrompt);
	}

	async testParseJsonResponse<T>(text: string) {
		return this.parseJsonResponse<T>(text);
	}

	async testValidateResponse<T extends Record<string, unknown>>(
		data: T,
		requiredFields: (keyof T)[],
	) {
		return this.validateResponse(data, requiredFields);
	}
}

describe("BaseAIAgent", () => {
	beforeEach(() => {
		jest.clearAllMMocks();

		// Setup default mocks
		mockOpenAI.mockReturnValue("openai-model");
		mockGoogle.mockReturnValue("google-model");
		mockAnthropic.mockReturnValue("anthropic-model");

		// Setup default generateText mock
		mockGenerateText.mockResolvedValue({
			text: "Generated text response",
			usage: { totalTokens: 1000 },
		});
	});

	describe("constructor", () => {
		it("should initialize with default configuration", () => {
			const config: AIConfig = {
				provider: "openai",
				model: "gpt-4",
			};

			const agent = new TestAgent(config);
			expect(agent).toBeInstanceOf(BaseAIAgent);
		});

		it("should merge custom configuration with defaults", () => {
			const config: AIConfig = {
				provider: "openai",
				model: "gpt-4",
				temperature: 0.5,
				maxTokens: 2000,
			};

			const agent = new TestAgent(config);
			expect(agent).toBeInstanceOf(BaseAIAgent);
		});
	});

	describe("getModel", () => {
		it("should return OpenAI model when provider is openai", async () => {
			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
			});

			mockGenerateText.mockResolvedValue({
				text: "test response",
				usage: { totalTokens: 100 },
			});

			// Access protected method through test method
			await agent.testGenerateWithRetry([]);
			expect(mockOpenAI).toHaveBeenCalledWith("gpt-4");
		});

		it("should return Google model when provider is google", async () => {
			const agent = new TestAgent({
				provider: "google",
				model: "gemini-pro",
			});

			mockGenerateText.mockResolvedValue({
				text: "test response",
				usage: { totalTokens: 100 },
			});

			await agent.testGenerateWithRetry([]);
			expect(mockGoogle).toHaveBeenCalledWith("gemini-pro");
		});

		it("should return Anthropic model when provider is anthropic", async () => {
			const agent = new TestAgent({
				provider: "anthropic",
				model: "claude-3-sonnet",
			});

			mockGenerateText.mockResolvedValue({
				text: "test response",
				usage: { totalTokens: 100 },
			});

			await agent.testGenerateWithRetry([]);
			expect(mockAnthropic).toHaveBeenCalledWith("claude-3-sonnet");
		});

		it("should return error for unsupported provider", async () => {
			const agent = new TestAgent({
				provider: "unsupported" as AIConfig["provider"],
				model: "test-model",
			});

			const result = await agent.testGenerateWithRetry([]);
			expect(result.success).toBe(false);
			expect(result.error).toContain("Unsupported AI provider: unsupported");
		});
	});

	describe("generateWithRetry", () => {
		it("should successfully generate text on first attempt", async () => {
			const mockResponse = createMockAIResponse("Generated text response");
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
			});

			const messages = [{ role: "user" as const, content: "Test message" }];
			const result = await agent.testGenerateWithRetry(messages);

			expect(result.success).toBe(true);
			expect(result.data).toBe("Generated text response");
			expect(result.metadata?.provider).toBe("openai");
			expect(result.metadata?.model).toBe("gpt-4");
			expect(result.metadata?.tokensUsed).toBe(1000);
		});

		it("should include system prompt when provided", async () => {
			const mockResponse = createMockAIResponse("Response with system prompt");
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
			});

			const messages = [{ role: "user" as const, content: "Test message" }];
			const systemPrompt = "You are a helpful assistant";

			await agent.testGenerateWithRetry(messages, systemPrompt);

			expect(mockGenerateText).toHaveBeenCalledWith({
				model: "openai-model",
				messages: [{ role: "system", content: systemPrompt }, ...messages],
				temperature: 0.7,
				maxTokens: 4000,
			});
		});

		it("should retry on transient errors", async () => {
			const error = new Error("Network timeout");
			const mockResponse = createMockAIResponse("Success after retry");

			mockGenerateText
				.mockRejectedValueOnce(error)
				.mockRejectedValueOnce(error)
				.mockResolvedValueOnce(mockResponse);

			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
				retryAttempts: 3,
				retryDelay: 10, // Short delay for testing
			});

			const messages = [{ role: "user" as const, content: "Test message" }];
			const result = await agent.testGenerateWithRetry(messages);

			expect(result.success).toBe(true);
			expect(result.data).toBe("Success after retry");
			expect(mockGenerateText).toHaveBeenCalledTimes(3);
		});

		it("should not retry on authentication errors", async () => {
			const authError = new Error("API key not configured");
			mockGenerateText.mockRejectedValueOnce(authError);

			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
				retryAttempts: 3,
			});

			const messages = [{ role: "user" as const, content: "Test message" }];
			const result = await agent.testGenerateWithRetry(messages);

			expect(result.success).toBe(false);
			expect(result.error).toBe("API key not configured");
			expect(mockGenerateText).toHaveBeenCalledTimes(1); // No retries
		});

		it("should return error after max retry attempts", async () => {
			const error = new Error("Persistent error");
			mockGenerateText.mockRejectedValue(error);

			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
				retryAttempts: 2,
				retryDelay: 10,
			});

			const messages = [{ role: "user" as const, content: "Test message" }];
			const result = await agent.testGenerateWithRetry(messages);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Persistent error");
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
		});
	});

	describe("parseJsonResponse", () => {
		it("should successfully parse valid JSON", async () => {
			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
			});

			const validJson = '{"key": "value", "number": 42}';
			const result = await agent.testParseJsonResponse(validJson);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ key: "value", number: 42 });
		});

		it("should return error for invalid JSON", async () => {
			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
			});

			const invalidJson = '{"key": "value", "invalid": }';
			const result = await agent.testParseJsonResponse(invalidJson);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to parse JSON response");
		});
	});

	describe("validateResponse", () => {
		it("should validate response with all required fields", async () => {
			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
			});

			const data = {
				name: "Test",
				age: 25,
				email: "test@example.com",
			};

			const result = await agent.testValidateResponse(data, ["name", "age"]);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(data);
		});

		it("should return error for missing required fields", async () => {
			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
			});

			const data = {
				name: "Test",
				// age is missing
				email: "test@example.com",
			};

			const result = await agent.testValidateResponse(data, ["name", "age"]);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing required fields: age");
		});

		it("should return error for null or empty required fields", async () => {
			const agent = new TestAgent({
				provider: "openai",
				model: "gpt-4",
			});

			const data = {
				name: "",
				age: null,
				email: "test@example.com",
			};

			const result = await agent.testValidateResponse(data, ["name", "age"]);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing required fields: name, age");
		});
	});
});
