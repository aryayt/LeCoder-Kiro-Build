import { beforeEach } from "node:test";
import { describe } from "node:test";
import { ConceptExtractorAgent } from "~/lib/ai/agents/concept-extractor";
import {
	createMockAIResponse,
	mockGenerateText,
	mockOpenAI,
	sampleConceptExtractionResponse,
	samplePaperContent,
} from "./test-utils";

describe("ConceptExtractorAgent", () => {
	let agent: ConceptExtractorAgent;

	beforeEach(() => {
		jest.clearAllMocks();
		mockOpenAI.mockReturnValue("openai-model");

		agent = new ConceptExtractorAgent({
			provider: "openai",
			model: "gpt-4",
			retryAttempts: 1, // Reduce for faster tests
		});
	});

	describe("extractConcepts", () => {
		it("should successfully extract concepts from paper content", async () => {
			const mockResponse = createMockAIResponse(
				JSON.stringify(sampleConceptExtractionResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(sampleConceptExtractionResponse);
			expect(result.metadata?.provider).toBe("openai");
			expect(result.metadata?.tokensUsed).toBe(1000);
		});

		it("should call generateText with correct parameters", async () => {
			const mockResponse = createMockAIResponse(
				JSON.stringify(sampleConceptExtractionResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			await agent.extractConcepts(samplePaperContent);

			expect(mockGenerateText).toHaveBeenCalledWith({
				model: "openai-model",
				messages: [
					{
						role: "user",
						content: expect.stringContaining(
							"Please analyze this research paper",
						),
					},
				],
				temperature: 0.7,
				maxTokens: 4000,
			});

			// Check that system prompt is included
			const call = mockGenerateText.mock.calls[0][0];
			expect(call.messages[0].role).toBe("system");
			expect(call.messages[0].content).toContain("research analyst");
		});

		it("should return error for invalid JSON response", async () => {
			const mockResponse = createMockAIResponse("Invalid JSON response");
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to parse JSON response");
		});

		it("should return error for missing concepts object", async () => {
			const invalidResponse = {
				confidence: 0.9,
				extractedSections: {},
				// concepts is missing
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing concepts object");
		});

		it("should return error for invalid confidence score", async () => {
			const invalidResponse = {
				...sampleConceptExtractionResponse,
				confidence: 1.5, // Invalid confidence > 1
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"Confidence score must be a number between 0 and 1",
			);
		});

		it("should return error for non-array fields in concepts", async () => {
			const invalidResponse = {
				...sampleConceptExtractionResponse,
				concepts: {
					...sampleConceptExtractionResponse.concepts,
					keyMethods: "not an array", // Should be array
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Field keyMethods must be an array");
		});

		it("should return error for empty mainObjective", async () => {
			const invalidResponse = {
				...sampleConceptExtractionResponse,
				concepts: {
					...sampleConceptExtractionResponse.concepts,
					mainObjective: "", // Empty string
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"mainObjective must be a non-empty string",
			);
		});

		it("should handle AI generation errors", async () => {
			const error = new Error("AI service unavailable");
			mockGenerateText.mockRejectedValueOnce(error);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toBe("AI service unavailable");
		});
	});

	describe("extractConceptsWithFallback", () => {
		it("should return detailed result when successful", async () => {
			const mockResponse = createMockAIResponse(
				JSON.stringify(sampleConceptExtractionResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result =
				await agent.extractConceptsWithFallback(samplePaperContent);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(sampleConceptExtractionResponse);
			expect(result.metadata?.fallbackUsed).toBeUndefined();
		});

		it("should use fallback when detailed extraction fails", async () => {
			// First call fails
			mockGenerateText.mockRejectedValueOnce(
				new Error("Detailed extraction failed"),
			);

			// Second call (fallback) succeeds
			const fallbackResponse = {
				concepts: {
					mainObjective: "Basic objective",
					keyMethods: ["method1"],
					algorithms: ["algorithm1"],
					datasets: ["dataset1"],
					evaluationMetrics: ["metric1"],
					technicalRequirements: ["requirement1"],
					dependencies: ["dependency1"],
				},
				confidence: 0.8,
				extractedSections: {},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(fallbackResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result =
				await agent.extractConceptsWithFallback(samplePaperContent);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(fallbackResponse);
			expect(result.metadata?.fallbackUsed).toBe(true);
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
		});

		it("should return original error when both detailed and fallback fail", async () => {
			const originalError = new Error("Detailed extraction failed");
			const fallbackError = new Error("Fallback also failed");

			mockGenerateText
				.mockRejectedValueOnce(originalError)
				.mockRejectedValueOnce(fallbackError);

			const result =
				await agent.extractConceptsWithFallback(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Detailed extraction failed");
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
		});
	});

	describe("validation edge cases", () => {
		it("should validate all required concept fields", async () => {
			const incompleteResponse = {
				concepts: {
					mainObjective: "Test objective",
					keyMethods: ["method1"],
					// Missing other required fields
				},
				confidence: 0.9,
				extractedSections: {},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(incompleteResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid concepts structure");
		});

		it("should handle negative confidence scores", async () => {
			const invalidResponse = {
				...sampleConceptExtractionResponse,
				confidence: -0.1,
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"Confidence score must be a number between 0 and 1",
			);
		});

		it("should handle null values in required fields", async () => {
			const invalidResponse = {
				...sampleConceptExtractionResponse,
				concepts: {
					...sampleConceptExtractionResponse.concepts,
					mainObjective: null,
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.extractConcepts(samplePaperContent);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"mainObjective must be a non-empty string",
			);
		});
	});
});
