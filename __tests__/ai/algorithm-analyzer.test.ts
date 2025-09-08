import { beforeEach, describe, it } from "@jest/globals";
import { AlgorithmAnalyzerAgent } from "~/lib/ai/agents/algorithm-analyzer";
import {
	createMockAIResponse,
	mockGenerateText,
	mockOpenAI,
	sampleAlgorithmAnalysisResponse,
	sampleConceptExtractionResponse,
} from "./test-utils";

describe("AlgorithmAnalyzerAgent", () => {
	let agent: AlgorithmAnalyzerAgent;

	beforeEach(() => {
		jest.clearAllMocks();
		mockOpenAI.mockReturnValue("openai-model");

		agent = new AlgorithmAnalyzerAgent({
			provider: "openai",
			model: "gpt-4",
			retryAttempts: 1, // Reduce for faster tests
		});
	});

	describe("analyzeAlgorithms", () => {
		it("should successfully analyze algorithms from research concepts", async () => {
			const mockResponse = createMockAIResponse(
				JSON.stringify(sampleAlgorithmAnalysisResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(sampleAlgorithmAnalysisResponse);
			expect(result.metadata?.provider).toBe("openai");
			expect(result.metadata?.tokensUsed).toBe(1000);
		});

		it("should include paper content when provided", async () => {
			const mockResponse = createMockAIResponse(
				JSON.stringify(sampleAlgorithmAnalysisResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const paperContent = "Sample paper content for context";
			await agent.analyzeAlgorithms(sampleResearchConcepts, paperContent);

			expect(mockGenerateText).toHaveBeenCalledWith({
				model: "openai-model",
				messages: [
					{
						role: "user",
						content: expect.stringContaining(
							"Sample paper content for context",
						),
					},
				],
				temperature: 0.7,
				maxTokens: 4000,
			});
		});

		it("should call generateText with correct system prompt", async () => {
			const mockResponse = createMockAIResponse(
				JSON.stringify(sampleAlgorithmAnalysisResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			await agent.analyzeAlgorithms(sampleResearchConcepts);

			const call = mockGenerateText.mock.calls[0][0];
			expect(call.messages[0].role).toBe("system");
			expect(call.messages[0].content).toContain(
				"software architect and algorithm analyst",
			);
			expect(call.messages[0].content).toContain("JSON response");
		});

		it("should return error for invalid JSON response", async () => {
			const mockResponse = createMockAIResponse("Invalid JSON response");
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to parse JSON response");
		});

		it("should return error for missing specs object", async () => {
			const invalidResponse = {
				confidence: 0.9,
				implementationNotes: [],
				// specs is missing
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing specs object");
		});

		it("should return error for non-array algorithms", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				specs: {
					...sampleAlgorithmAnalysisResponse.specs,
					algorithms: "not an array",
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("algorithms must be an array");
		});

		it("should validate individual algorithm structure", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				specs: {
					...sampleAlgorithmAnalysisResponse.specs,
					algorithms: [
						{
							name: "Test Algorithm",
							// Missing required fields
						},
					],
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Algorithm 0: missing required field");
		});

		it("should validate algorithm type", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				specs: {
					...sampleAlgorithmAnalysisResponse.specs,
					algorithms: [
						{
							...sampleAlgorithmAnalysisResponse.specs.algorithms[0],
							type: "invalid_type",
						},
					],
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("invalid type");
		});

		it("should validate algorithm complexity", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				specs: {
					...sampleAlgorithmAnalysisResponse.specs,
					algorithms: [
						{
							...sampleAlgorithmAnalysisResponse.specs.algorithms[0],
							complexity: "invalid_complexity",
						},
					],
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("invalid complexity");
		});

		it("should validate system requirements structure", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				specs: {
					...sampleAlgorithmAnalysisResponse.specs,
					systemRequirements: {
						programmingLanguage: "Python",
						// Missing other required fields
					},
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"SystemRequirements: missing required field",
			);
		});

		it("should validate minimum hardware structure", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				specs: {
					...sampleAlgorithmAnalysisResponse.specs,
					systemRequirements: {
						...sampleAlgorithmAnalysisResponse.specs.systemRequirements,
						minimumHardware: {
							cpu: "4 cores",
							// Missing memory and storage
						},
					},
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("minimumHardware missing required field");
		});

		it("should validate implementation complexity", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				specs: {
					...sampleAlgorithmAnalysisResponse.specs,
					implementationComplexity: "invalid_complexity",
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"implementationComplexity must be low, medium, or high",
			);
		});

		it("should validate confidence score", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				confidence: 1.5, // Invalid confidence > 1
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"Confidence score must be a number between 0 and 1",
			);
		});

		it("should validate array fields", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				implementationNotes: "not an array",
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("implementationNotes must be an array");
		});
	});

	describe("analyzeAlgorithmsWithFallback", () => {
		it("should return detailed result when successful", async () => {
			const mockResponse = createMockAIResponse(
				JSON.stringify(sampleAlgorithmAnalysisResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithmsWithFallback(
				sampleResearchConcepts,
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(sampleAlgorithmAnalysisResponse);
			expect(result.metadata?.fallbackUsed).toBeUndefined();
		});

		it("should use fallback when detailed analysis fails", async () => {
			// First call fails
			mockGenerateText.mockRejectedValueOnce(
				new Error("Detailed analysis failed"),
			);

			// Second call (fallback) succeeds
			const fallbackResponse = {
				specs: {
					algorithms: [
						{
							name: "Basic Algorithm",
							description: "Basic description",
							type: "other",
							complexity: "low",
							inputs: [],
							outputs: [],
							parameters: [],
							dependencies: [],
						},
					],
					systemRequirements: {
						programmingLanguage: "Python",
						frameworks: [],
						libraries: [],
						minimumHardware: {
							cpu: "2 cores",
							memory: "4GB",
							storage: "1GB",
						},
						operatingSystem: ["Linux"],
					},
					implementationComplexity: "low",
					estimatedDevelopmentTime: "1 week",
				},
				confidence: 0.7,
				implementationNotes: [],
				potentialChallenges: [],
				recommendedApproach: "Basic approach",
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(fallbackResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithmsWithFallback(
				sampleResearchConcepts,
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(fallbackResponse);
			expect(result.metadata?.fallbackUsed).toBe(true);
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
		});

		it("should return original error when both detailed and fallback fail", async () => {
			const originalError = new Error("Detailed analysis failed");
			const fallbackError = new Error("Fallback also failed");

			mockGenerateText
				.mockRejectedValueOnce(originalError)
				.mockRejectedValueOnce(fallbackError);

			const result = await agent.analyzeAlgorithmsWithFallback(
				sampleResearchConcepts,
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Detailed analysis failed");
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
		});
	});

	describe("algorithm array validation", () => {
		it("should validate algorithm inputs array", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				specs: {
					...sampleAlgorithmAnalysisResponse.specs,
					algorithms: [
						{
							...sampleAlgorithmAnalysisResponse.specs.algorithms[0],
							inputs: "not an array",
						},
					],
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("inputs must be an array");
		});

		it("should validate system requirements arrays", async () => {
			const invalidResponse = {
				...sampleAlgorithmAnalysisResponse,
				specs: {
					...sampleAlgorithmAnalysisResponse.specs,
					systemRequirements: {
						...sampleAlgorithmAnalysisResponse.specs.systemRequirements,
						frameworks: "not an array",
					},
				},
			};

			const mockResponse = createMockAIResponse(
				JSON.stringify(invalidResponse),
			);
			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const result = await agent.analyzeAlgorithms(sampleResearchConcepts);

			expect(result.success).toBe(false);
			expect(result.error).toContain("frameworks must be an array");
		});
	});
});
