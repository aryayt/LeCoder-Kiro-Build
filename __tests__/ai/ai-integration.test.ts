/**
 * Integration test for AI agents
 * This test verifies that the AI agents can be instantiated and basic functionality works
 */

// Mock the environment before importing anything else
jest.mock("~/env.js", () => ({
	env: {
		OPENAI_API_KEY: "test-openai-key",
		GOOGLE_GENERATIVE_AI_API_KEY: "test-google-key",
		ANTHROPIC_API_KEY: "test-anthropic-key",
	},
}));

// Mock AI SDK modules
jest.mock("ai", () => ({
	generateText: jest.fn(),
}));

jest.mock("@ai-sdk/openai", () => ({
	openai: jest.fn(() => "mocked-openai-model"),
}));

jest.mock("@ai-sdk/google", () => ({
	google: jest.fn(() => "mocked-google-model"),
}));

jest.mock("@ai-sdk/anthropic", () => ({
	anthropic: jest.fn(() => "mocked-anthropic-model"),
}));

import { generateText } from "ai";
import { createAlgorithmAnalyzer, createConceptExtractor } from "~/lib/ai";

const mockGenerateText = generateText as jest.MockedFunction<
	typeof generateText
>;

describe("AI Integration Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("ConceptExtractor", () => {
		it("should create ConceptExtractor with default Google provider", () => {
			const extractor = createConceptExtractor();
			expect(extractor).toBeDefined();
		});

		it("should create ConceptExtractor with OpenAI provider", () => {
			const extractor = createConceptExtractor("openai");
			expect(extractor).toBeDefined();
		});

		it("should handle successful concept extraction", async () => {
			const mockResponse = {
				text: JSON.stringify({
					concepts: {
						mainObjective: "Test objective",
						keyMethods: ["method1"],
						algorithms: ["algorithm1"],
						datasets: ["dataset1"],
						evaluationMetrics: ["metric1"],
						technicalRequirements: ["requirement1"],
						dependencies: ["dependency1"],
					},
					confidence: 0.9,
					extractedSections: {},
				}),
				usage: { totalTokens: 1000 },
			};

			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const extractor = createConceptExtractor("openai");
			const result = await extractor.extractConcepts("Sample paper content");

			expect(result.success).toBe(true);
			expect(result.data?.concepts.mainObjective).toBe("Test objective");
		});
	});

	describe("AlgorithmAnalyzer", () => {
		it("should create AlgorithmAnalyzer with default Google provider", () => {
			const analyzer = createAlgorithmAnalyzer();
			expect(analyzer).toBeDefined();
		});

		it("should create AlgorithmAnalyzer with OpenAI provider", () => {
			const analyzer = createAlgorithmAnalyzer("openai");
			expect(analyzer).toBeDefined();
		});

		it("should handle successful algorithm analysis", async () => {
			const mockResponse = {
				text: JSON.stringify({
					specs: {
						algorithms: [
							{
								name: "Test Algorithm",
								description: "Test description",
								type: "machine_learning",
								complexity: "medium",
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
								cpu: "4 cores",
								memory: "8GB",
								storage: "10GB",
							},
							operatingSystem: ["Linux"],
						},
						implementationComplexity: "medium",
						estimatedDevelopmentTime: "2 weeks",
					},
					confidence: 0.85,
					implementationNotes: [],
					potentialChallenges: [],
					recommendedApproach: "Test approach",
				}),
				usage: { totalTokens: 1500 },
			};

			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const analyzer = createAlgorithmAnalyzer("openai");
			const concepts = {
				mainObjective: "Test objective",
				keyMethods: ["method1"],
				algorithms: ["algorithm1"],
				datasets: ["dataset1"],
				evaluationMetrics: ["metric1"],
				technicalRequirements: ["requirement1"],
				dependencies: ["dependency1"],
			};

			const result = await analyzer.analyzeAlgorithms(concepts);

			expect(result.success).toBe(true);
			expect(result.data?.specs.algorithms).toHaveLength(1);
			expect(result.data?.specs.algorithms[0].name).toBe("Test Algorithm");
		});
	});

	describe("Error Handling", () => {
		it("should handle AI service errors gracefully", async () => {
			mockGenerateText.mockRejectedValueOnce(
				new Error("AI service unavailable"),
			);

			const extractor = createConceptExtractor("openai");
			const result = await extractor.extractConcepts("Sample paper content");

			expect(result.success).toBe(false);
			expect(result.error).toBe("AI service unavailable");
		});

		it("should handle invalid JSON responses", async () => {
			const mockResponse = {
				text: "Invalid JSON response",
				usage: { totalTokens: 100 },
			};

			mockGenerateText.mockResolvedValueOnce(mockResponse);

			const extractor = createConceptExtractor("openai");
			const result = await extractor.extractConcepts("Sample paper content");

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to parse JSON response");
		});
	});
});
