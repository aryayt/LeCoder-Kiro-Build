import { beforeEach, describe, it } from "@jest/globals";
import { CodeGeneratorAgent } from "~/lib/ai/agents/code-generator";
import type {
	AlgorithmSpecs,
	CodeGenerationResult,
	SystemArchitecture,
} from "~/types/ai";

// Mock the AI SDK
jest.mock("ai", () => ({
	generateText: jest.fn(),
}));

// Mock the environment
jest.mock("~/env.js", () => ({
	env: {
		GOOGLE_GENERATIVE_AI_API_KEY: "test-key",
		OPENAI_API_KEY: "test-key",
		ANTHROPIC_API_KEY: "test-key",
	},
}));

// Mock the rate limiter
jest.mock("~/lib/ai/rate-limiter", () => ({
	rateLimiter: {
		canMakeRequest: jest.fn(() => true),
		recordRequest: jest.fn(),
		getTimeUntilNextRequest: jest.fn(() => 0),
	},
}));

describe("CodeGeneratorAgent", () => {
	let agent: CodeGeneratorAgent;
	const mockGenerateText = require("ai").generateText as jest.MockedFunction<
		typeof import("ai").generateText
	>;

	const mockArchitecture: SystemArchitecture = {
		projectStructure: {
			rootDirectory: "ml_classifier",
			directories: [
				{
					path: "src/",
					purpose: "Source code",
					subdirectories: [
						{
							path: "src/models/",
							purpose: "Model implementations",
						},
					],
				},
			],
			files: [
				{
					path: "main.py",
					type: "source",
					purpose: "Main entry point",
					dependencies: ["src.models"],
				},
			],
			configFiles: [
				{
					path: "requirements.txt",
					type: "dependencies",
					purpose: "Python dependencies",
				},
			],
		},
		modules: [
			{
				name: "ClassifierModule",
				path: "src/models/",
				purpose: "ML classifier implementation",
				exports: ["Classifier"],
				imports: ["numpy", "sklearn"],
				functions: [
					{
						name: "train_model",
						purpose: "Train the classifier",
						parameters: [
							{
								name: "X",
								type: "numpy.ndarray",
								required: true,
								description: "Training data",
							},
						],
						returnType: "sklearn.base.BaseEstimator",
						complexity: "medium",
					},
				],
				classes: [
					{
						name: "Classifier",
						purpose: "Main classifier class",
						methods: [
							{
								name: "fit",
								purpose: "Train the model",
								parameters: [
									{
										name: "X",
										type: "numpy.ndarray",
										required: true,
										description: "Training data",
									},
								],
								returnType: "self",
								complexity: "medium",
							},
						],
						properties: [
							{
								name: "model",
								type: "sklearn.base.BaseEstimator",
								visibility: "private",
								description: "Trained model",
							},
						],
					},
				],
			},
		],
		dataFlow: [
			{
				from: "input",
				to: "preprocessor",
				dataType: "raw_data",
				description: "Raw data to preprocessing",
			},
		],
		apiEndpoints: [
			{
				path: "/predict",
				method: "POST",
				purpose: "Make predictions",
				parameters: [
					{
						name: "data",
						type: "array",
						required: true,
						description: "Input data",
					},
				],
				responseType: "PredictionResult",
			},
		],
		databaseSchema: [],
		deploymentStrategy: {
			platform: "Docker",
			environment: "production",
			requirements: ["Docker", "Python 3.8+"],
			steps: [
				{
					order: 1,
					description: "Build image",
					command: "docker build -t classifier .",
				},
			],
		},
	};

	const mockAlgorithmSpecs: AlgorithmSpecs = {
		algorithms: [
			{
				name: "Random Forest Classifier",
				description: "Ensemble learning method for classification",
				type: "machine_learning",
				complexity: "medium",
				inputs: [
					{
						name: "X",
						type: "numpy.ndarray",
						description: "Feature matrix",
						required: true,
						format: "(n_samples, n_features)",
					},
				],
				outputs: [
					{
						name: "predictions",
						type: "numpy.ndarray",
						description: "Class predictions",
						format: "(n_samples,)",
					},
				],
				parameters: [
					{
						name: "n_estimators",
						type: "int",
						description: "Number of trees",
						defaultValue: 100,
						range: { min: 10, max: 1000 },
					},
				],
				dependencies: ["scikit-learn", "numpy"],
				pseudocode:
					"1. Build multiple decision trees\n2. Aggregate predictions",
			},
		],
		systemRequirements: {
			programmingLanguage: "Python",
			frameworks: ["scikit-learn"],
			libraries: ["numpy", "pandas"],
			minimumHardware: {
				cpu: "2 cores",
				memory: "4GB RAM",
				storage: "1GB",
			},
			operatingSystem: ["Linux", "Windows", "macOS"],
			pythonVersion: "3.8+",
		},
		implementationComplexity: "medium",
		estimatedDevelopmentTime: "1 week",
	};

	const mockValidCodeResult: CodeGenerationResult = {
		codebase: {
			files: [
				{
					path: "main.py",
					content:
						"import numpy as np\nfrom src.models.classifier import Classifier\n\ndef main():\n    classifier = Classifier()\n    return classifier\n\nif __name__ == '__main__':\n    main()",
					type: "source",
					language: "python",
					dependencies: ["numpy", "src.models.classifier"],
					exports: ["main"],
				},
				{
					path: "src/models/classifier.py",
					content:
						"import numpy as np\nfrom sklearn.ensemble import RandomForestClassifier\n\nclass Classifier:\n    def __init__(self, n_estimators=100):\n        self.model = RandomForestClassifier(n_estimators=n_estimators)\n    \n    def fit(self, X, y):\n        self.model.fit(X, y)\n        return self\n    \n    def predict(self, X):\n        return self.model.predict(X)",
					type: "source",
					language: "python",
					dependencies: ["numpy", "sklearn"],
					exports: ["Classifier"],
				},
			],
			structure: {
				rootDirectory: "ml_classifier",
				directories: [
					{
						path: "src/",
						purpose: "Source code",
					},
				],
				files: [
					{
						path: "main.py",
						type: "source",
						purpose: "Main entry point",
					},
				],
				configFiles: [
					{
						path: "requirements.txt",
						type: "dependencies",
						purpose: "Python dependencies",
						content: {
							dependencies: ["numpy>=1.21.0", "scikit-learn>=1.0.0"],
						},
					},
				],
			},
			documentation: {
				readme: {
					title: "ML Classifier Implementation",
					description: "Random Forest classifier implementation",
					features: ["Random Forest algorithm", "Scikit-learn integration"],
					installation: ["pip install -r requirements.txt"],
					usage: [
						{
							title: "Basic Usage",
							description: "How to use the classifier",
							code: "python main.py",
							language: "bash",
						},
					],
					contributing: ["Fork repository", "Create branch"],
					license: "MIT",
				},
				apiDocs: [],
				setupGuide: {
					prerequisites: [
						{
							name: "Python",
							version: "3.8+",
							description: "Python programming language",
						},
					],
					installationSteps: [
						{
							order: 1,
							title: "Install dependencies",
							description: "Install required packages",
							commands: ["pip install -r requirements.txt"],
						},
					],
					configuration: [],
					verification: [
						{
							order: 1,
							title: "Test installation",
							description: "Verify installation",
							commands: ["python -c 'import numpy; print(\"Success\")'"],
							expectedOutput: "Success",
						},
					],
				},
				userGuide: {
					sections: [
						{
							title: "Getting Started",
							content: "Guide to get started",
						},
					],
					troubleshooting: [],
					faq: [],
				},
				developerGuide: {
					architecture: {
						description: "System architecture",
						components: [
							{
								name: "Classifier",
								purpose: "Main classifier component",
								responsibilities: ["Training", "Prediction"],
								interfaces: ["ClassifierInterface"],
							},
						],
						dataFlow: "Input -> Processing -> Output",
						designPatterns: ["Strategy Pattern"],
					},
					codeStructure: {
						overview: "Modular code structure",
						directories: [
							{
								path: "src/",
								purpose: "Source code",
								contents: ["models/"],
							},
						],
						namingConventions: [
							{
								type: "functions",
								pattern: "snake_case",
								examples: ["train_model"],
							},
						],
						codingStandards: [
							{
								category: "Documentation",
								rules: ["All functions must have docstrings"],
								examples: ['def func():\n    """Function description"""'],
							},
						],
					},
					contributionGuidelines: {
						gettingStarted: ["Clone repository"],
						developmentProcess: ["Write tests"],
						codeReview: ["All code reviewed"],
						issueReporting: ["Use templates"],
					},
					testingGuide: {
						overview: "Testing strategy",
						testTypes: [
							{
								type: "unit",
								purpose: "Test functions",
								location: "tests/",
								examples: ["test_classifier.py"],
							},
						],
						runningTests: ["pytest"],
						writingTests: ["Use pytest"],
					},
				},
				changelog: [],
			},
			tests: [
				{
					path: "tests/test_classifier.py",
					content:
						"import pytest\nimport numpy as np\nfrom src.models.classifier import Classifier\n\ndef test_classifier_init():\n    classifier = Classifier()\n    assert classifier is not None\n\ndef test_classifier_fit():\n    classifier = Classifier()\n    X = np.array([[1, 2], [3, 4]])\n    y = np.array([0, 1])\n    result = classifier.fit(X, y)\n    assert result is classifier",
					testType: "unit",
					targetFile: "src/models/classifier.py",
					coverage: ["Classifier class", "fit method"],
				},
			],
			buildInstructions: {
				installCommands: ["pip install -r requirements.txt"],
				buildCommands: ["python setup.py build"],
				testCommands: ["pytest"],
				runCommands: ["python main.py"],
				environmentSetup: [
					{
						variable: "PYTHONPATH",
						description: "Python path",
						required: false,
						defaultValue: ".",
					},
				],
			},
		},
		confidence: 0.95,
		generationNotes: [
			"Implemented Random Forest classifier",
			"Added comprehensive tests",
			"Generated complete documentation",
		],
		qualityMetrics: {
			codeComplexity: "medium",
			testCoverage: 90,
			documentationCoverage: 95,
			codeQualityScore: 8.5,
		},
		completeness: {
			implementedFeatures: ["Random Forest classifier", "Training pipeline"],
			missingFeatures: [],
			todoItems: 0,
			placeholderCount: 0,
		},
	};

	beforeEach(() => {
		agent = new CodeGeneratorAgent({
			provider: "google",
			model: "models/gemini-2.0-flash-exp",
		});
		jest.clearAllMocks();
	});

	describe("generateCode", () => {
		it("should successfully generate complete code", async () => {
			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidCodeResult),
				usage: { totalTokens: 2500 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockValidCodeResult);
			expect(result.metadata?.tokensUsed).toBe(2500);
		});

		it("should include paper content in the prompt when provided", async () => {
			const paperContent =
				"This paper presents a novel machine learning approach...";
			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidCodeResult),
				usage: { totalTokens: 2500 },
			});

			await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
				paperContent,
			);

			expect(mockGenerateText).toHaveBeenCalledWith(
				expect.objectContaining({
					messages: expect.arrayContaining([
						expect.objectContaining({
							content: expect.stringContaining(paperContent.substring(0, 100)),
						}),
					]),
				}),
			);
		});

		it("should handle AI generation errors", async () => {
			mockGenerateText.mockRejectedValue(new Error("Model overloaded"));

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Model overloaded");
		});

		it("should handle invalid JSON responses", async () => {
			mockGenerateText.mockResolvedValue({
				text: "Not valid JSON",
				usage: { totalTokens: 100 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to parse JSON response");
		});

		it("should validate codebase structure", async () => {
			const invalidResult = {
				...mockValidCodeResult,
				codebase: {
					...mockValidCodeResult.codebase,
					files: [], // Empty files array
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("codebase.files cannot be empty");
		});

		it("should reject code with TODOs", async () => {
			const invalidResult = {
				...mockValidCodeResult,
				completeness: {
					...mockValidCodeResult.completeness,
					todoItems: 3, // Has TODOs
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Code contains 3 TODO items");
		});

		it("should reject code with placeholders", async () => {
			const invalidResult = {
				...mockValidCodeResult,
				completeness: {
					...mockValidCodeResult.completeness,
					placeholderCount: 2, // Has placeholders
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Code contains 2 placeholders");
		});

		it("should validate file content for TODOs and placeholders", async () => {
			const invalidResult = {
				...mockValidCodeResult,
				codebase: {
					...mockValidCodeResult.codebase,
					files: [
						{
							...mockValidCodeResult.codebase.files[0],
							content:
								"# TODO: Implement this function\ndef placeholder():\n    pass",
						},
					],
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("contains TODO or FIXME");
		});

		it("should validate file structure", async () => {
			const invalidResult = {
				...mockValidCodeResult,
				codebase: {
					...mockValidCodeResult.codebase,
					files: [
						{
							path: "main.py",
							// Missing required fields
							type: "source",
						},
					],
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("missing required field");
		});

		it("should validate build instructions", async () => {
			const invalidResult = {
				...mockValidCodeResult,
				codebase: {
					...mockValidCodeResult.codebase,
					buildInstructions: {
						...mockValidCodeResult.codebase.buildInstructions,
						installCommands: "not an array", // Should be array
					},
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("must be an array");
		});

		it("should validate quality metrics", async () => {
			const invalidResult = {
				...mockValidCodeResult,
				qualityMetrics: {
					...mockValidCodeResult.qualityMetrics,
					codeComplexity: "invalid", // Invalid complexity level
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid codeComplexity");
		});
	});

	describe("generateCodeWithFallback", () => {
		it("should use fallback when detailed generation fails", async () => {
			// Create agent with no retries for this test
			const noRetryAgent = new CodeGeneratorAgent({
				provider: "google",
				model: "models/gemini-2.0-flash-exp",
				retryAttempts: 1, // Only 1 attempt, so it fails quickly
			});

			// First call fails
			mockGenerateText
				.mockRejectedValueOnce(new Error("Detailed generation failed"))
				// Second call (fallback) succeeds
				.mockResolvedValueOnce({
					text: JSON.stringify(mockValidCodeResult),
					usage: { totalTokens: 1500 },
				});

			const result = await noRetryAgent.generateCodeWithFallback(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(true);
			expect(result.metadata?.fallbackUsed).toBe(true);
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
		});

		it("should return original error if both detailed and fallback fail", async () => {
			// Create agent with no retries for this test
			const noRetryAgent = new CodeGeneratorAgent({
				provider: "google",
				model: "models/gemini-2.0-flash-exp",
				retryAttempts: 1, // Only 1 attempt, so it fails quickly
			});

			mockGenerateText
				.mockRejectedValueOnce(new Error("Detailed generation failed"))
				.mockRejectedValueOnce(new Error("Fallback also failed"));

			const result = await noRetryAgent.generateCodeWithFallback(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Detailed generation failed");
		});
	});

	describe("validation edge cases", () => {
		it("should handle missing codebase object", async () => {
			const invalidResult = {
				confidence: 0.9,
				generationNotes: [],
				qualityMetrics: mockValidCodeResult.qualityMetrics,
				completeness: mockValidCodeResult.completeness,
				// Missing codebase object
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing codebase object");
		});

		it("should validate file types", async () => {
			const invalidResult = {
				...mockValidCodeResult,
				codebase: {
					...mockValidCodeResult.codebase,
					files: [
						{
							...mockValidCodeResult.codebase.files[0],
							type: "invalid_type", // Invalid file type
						},
					],
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("invalid type");
		});

		it("should validate empty file content", async () => {
			const invalidResult = {
				...mockValidCodeResult,
				codebase: {
					...mockValidCodeResult.codebase,
					files: [
						{
							...mockValidCodeResult.codebase.files[0],
							content: "", // Empty content
						},
					],
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("content cannot be empty");
		});
	});

	describe("provider configuration", () => {
		it("should work with different AI providers", async () => {
			const openaiAgent = new CodeGeneratorAgent({
				provider: "openai",
				model: "gpt-4o",
			});

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidCodeResult),
				usage: { totalTokens: 3000 },
			});

			const result = await openaiAgent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(true);
			expect(result.metadata?.provider).toBe("openai");
		});

		it("should handle custom configuration parameters", async () => {
			const customAgent = new CodeGeneratorAgent({
				provider: "anthropic",
				model: "claude-3-5-sonnet-20241022",
				temperature: 0.3,
				maxTokens: 8000,
			});

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidCodeResult),
				usage: { totalTokens: 4000 },
			});

			const result = await customAgent.generateCode(
				mockArchitecture,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(true);
			expect(mockGenerateText).toHaveBeenCalledWith(
				expect.objectContaining({
					temperature: 0.3,
					maxTokens: 8000,
				}),
			);
		});
	});
});
