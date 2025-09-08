import { beforeEach, describe, it } from "@jest/globals";
import { ArchitecturePlannerAgent } from "~/lib/ai/agents/architecture-planner";
import type {
	AlgorithmSpecs,
	ArchitecturePlanningResult,
	ResearchConcepts,
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

describe("ArchitecturePlannerAgent", () => {
	let agent: ArchitecturePlannerAgent;
	const mockGenerateText = require("ai").generateText as jest.MockedFunction<
		typeof import("ai").generateText
	>;

	const mockConcepts: ResearchConcepts = {
		mainObjective: "Implement neural network for image classification",
		keyMethods: ["Convolutional Neural Networks", "Backpropagation"],
		algorithms: ["CNN", "SGD Optimizer"],
		datasets: ["CIFAR-10", "ImageNet"],
		evaluationMetrics: ["Accuracy", "F1-Score"],
		technicalRequirements: ["Python", "TensorFlow", "GPU"],
		dependencies: ["tensorflow", "numpy", "matplotlib"],
	};

	const mockAlgorithmSpecs: AlgorithmSpecs = {
		algorithms: [
			{
				name: "CNN Classifier",
				description: "Convolutional neural network for image classification",
				type: "machine_learning",
				complexity: "high",
				inputs: [
					{
						name: "images",
						type: "numpy.ndarray",
						description: "Input images",
						required: true,
						format: "(batch_size, height, width, channels)",
					},
				],
				outputs: [
					{
						name: "predictions",
						type: "numpy.ndarray",
						description: "Class predictions",
						format: "(batch_size, num_classes)",
					},
				],
				parameters: [
					{
						name: "learning_rate",
						type: "float",
						description: "Learning rate for training",
						defaultValue: 0.001,
						range: { min: 0.0001, max: 0.1 },
					},
				],
				dependencies: ["tensorflow", "numpy"],
				pseudocode:
					"1. Initialize CNN layers\n2. Forward pass\n3. Compute loss\n4. Backpropagation",
			},
		],
		systemRequirements: {
			programmingLanguage: "Python",
			frameworks: ["TensorFlow", "Keras"],
			libraries: ["numpy", "matplotlib", "scikit-learn"],
			minimumHardware: {
				cpu: "4 cores",
				memory: "8GB RAM",
				storage: "10GB",
				gpu: "NVIDIA GTX 1060 or better",
			},
			operatingSystem: ["Linux", "Windows", "macOS"],
			pythonVersion: "3.8+",
		},
		implementationComplexity: "high",
		estimatedDevelopmentTime: "2-3 weeks",
	};

	const mockValidArchitectureResult: ArchitecturePlanningResult = {
		architecture: {
			projectStructure: {
				rootDirectory: "cnn_classifier",
				directories: [
					{
						path: "src/",
						purpose: "Main source code",
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
					name: "CNNModel",
					path: "src/models/",
					purpose: "CNN implementation",
					exports: ["CNNClassifier"],
					imports: ["tensorflow", "numpy"],
					functions: [
						{
							name: "build_model",
							purpose: "Build CNN architecture",
							parameters: [
								{
									name: "input_shape",
									type: "tuple",
									required: true,
									description: "Input image shape",
								},
							],
							returnType: "tf.keras.Model",
							complexity: "high",
						},
					],
					classes: [
						{
							name: "CNNClassifier",
							purpose: "Main CNN classifier class",
							methods: [
								{
									name: "fit",
									purpose: "Train the model",
									parameters: [
										{
											name: "X",
											type: "numpy.ndarray",
											required: true,
											description: "Training images",
										},
									],
									returnType: "None",
									complexity: "high",
								},
							],
							properties: [
								{
									name: "model",
									type: "tf.keras.Model",
									visibility: "private",
									description: "Keras model instance",
								},
							],
						},
					],
				},
			],
			dataFlow: [
				{
					from: "input_layer",
					to: "conv_layers",
					dataType: "image_tensor",
					description: "Raw images to convolutional layers",
				},
			],
			apiEndpoints: [
				{
					path: "/predict",
					method: "POST",
					purpose: "Make predictions on images",
					parameters: [
						{
							name: "image",
							type: "file",
							required: true,
							description: "Image file to classify",
						},
					],
					responseType: "PredictionResult",
				},
			],
			databaseSchema: [
				{
					tableName: "experiments",
					columns: [
						{
							name: "id",
							type: "INTEGER",
							nullable: false,
							primaryKey: true,
							description: "Experiment ID",
						},
					],
					relationships: [],
					indexes: [
						{
							name: "idx_experiment_date",
							columns: ["created_at"],
							unique: false,
						},
					],
				},
			],
			deploymentStrategy: {
				platform: "Docker",
				environment: "production",
				requirements: ["Docker", "NVIDIA Docker"],
				steps: [
					{
						order: 1,
						description: "Build Docker image",
						command: "docker build -t cnn-classifier .",
					},
				],
			},
		},
		confidence: 0.95,
		designDecisions: [
			{
				decision: "Use TensorFlow/Keras",
				rationale: "Well-established framework with good GPU support",
				alternatives: ["PyTorch", "JAX"],
				tradeoffs: ["Learning curve vs performance"],
			},
		],
		implementationStrategy:
			"Start with model architecture, then training pipeline",
		riskAssessment: [
			{
				risk: "GPU memory limitations",
				impact: "high",
				probability: "medium",
				mitigation: ["Batch size optimization", "Model pruning"],
			},
		],
	};

	beforeEach(() => {
		agent = new ArchitecturePlannerAgent({
			provider: "google",
			model: "models/gemini-2.0-flash-exp",
		});
		jest.clearAllMocks();
	});

	describe("planArchitecture", () => {
		it("should successfully plan architecture from concepts and specs", async () => {
			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidArchitectureResult),
				usage: { totalTokens: 1500 },
			});

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockValidArchitectureResult);
			expect(result.metadata?.tokensUsed).toBe(1500);
		});

		it("should include paper content in the prompt when provided", async () => {
			const paperContent = "This paper presents a novel CNN architecture...";
			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidArchitectureResult),
				usage: { totalTokens: 1500 },
			});

			await agent.planArchitecture(
				mockConcepts,
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
			mockGenerateText.mockRejectedValue(new Error("API rate limit exceeded"));

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("API rate limit exceeded");
		});

		it("should handle invalid JSON responses", async () => {
			mockGenerateText.mockResolvedValue({
				text: "Invalid JSON response",
				usage: { totalTokens: 100 },
			});

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to parse JSON response");
		});

		it("should validate architecture structure", async () => {
			const invalidResult = {
				...mockValidArchitectureResult,
				architecture: {
					...mockValidArchitectureResult.architecture,
					projectStructure: null, // Invalid structure
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing projectStructure");
		});

		it("should validate confidence score", async () => {
			const invalidResult = {
				...mockValidArchitectureResult,
				confidence: 1.5, // Invalid confidence > 1
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"Confidence score must be a number between 0 and 1",
			);
		});

		it("should validate design decisions structure", async () => {
			const invalidResult = {
				...mockValidArchitectureResult,
				designDecisions: [
					{
						decision: "Use TensorFlow",
						// Missing required fields
					},
				],
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("missing required field");
		});

		it("should validate risk assessment structure", async () => {
			const invalidResult = {
				...mockValidArchitectureResult,
				riskAssessment: [
					{
						risk: "Memory issues",
						impact: "invalid_level", // Invalid impact level
						probability: "medium",
						mitigation: ["optimization"],
					},
				],
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("invalid impact level");
		});
	});

	describe("planArchitectureWithFallback", () => {
		it("should use fallback when detailed planning fails", async () => {
			// Create agent with no retries for this test
			const noRetryAgent = new ArchitecturePlannerAgent({
				provider: "google",
				model: "models/gemini-2.0-flash-exp",
				retryAttempts: 1, // Only 1 attempt, so it fails quickly
			});

			// First call fails
			mockGenerateText
				.mockRejectedValueOnce(new Error("Detailed planning failed"))
				// Second call (fallback) succeeds
				.mockResolvedValueOnce({
					text: JSON.stringify(mockValidArchitectureResult),
					usage: { totalTokens: 800 },
				});

			const result = await noRetryAgent.planArchitectureWithFallback(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(true);
			expect(result.metadata).toBeDefined();
			expect(result.metadata?.fallbackUsed).toBe(true);
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
		});

		it("should return original error if both detailed and fallback fail", async () => {
			// Create agent with no retries for this test
			const noRetryAgent = new ArchitecturePlannerAgent({
				provider: "google",
				model: "models/gemini-2.0-flash-exp",
				retryAttempts: 1, // Only 1 attempt, so it fails quickly
			});

			mockGenerateText
				.mockRejectedValueOnce(new Error("Detailed planning failed"))
				.mockRejectedValueOnce(new Error("Fallback also failed"));

			const result = await noRetryAgent.planArchitectureWithFallback(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Detailed planning failed");
		});
	});

	describe("validation edge cases", () => {
		it("should handle missing architecture object", async () => {
			const invalidResult = {
				confidence: 0.9,
				designDecisions: [],
				implementationStrategy: "test",
				riskAssessment: [],
				// Missing architecture object
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing architecture object");
		});

		it("should validate project structure arrays", async () => {
			const invalidResult = {
				...mockValidArchitectureResult,
				architecture: {
					...mockValidArchitectureResult.architecture,
					projectStructure: {
						...mockValidArchitectureResult.architecture.projectStructure,
						directories: "not an array", // Should be array
					},
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("must be an array");
		});

		it("should validate implementation strategy is non-empty string", async () => {
			const invalidResult = {
				...mockValidArchitectureResult,
				implementationStrategy: "", // Empty string
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"implementationStrategy must be a non-empty string",
			);
		});
	});

	describe("provider configuration", () => {
		it("should work with different AI providers", async () => {
			const openaiAgent = new ArchitecturePlannerAgent({
				provider: "openai",
				model: "gpt-4o",
			});

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidArchitectureResult),
				usage: { totalTokens: 1200 },
			});

			const result = await openaiAgent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(true);
			expect(result.metadata?.provider).toBe("openai");
		});

		it("should handle custom configuration parameters", async () => {
			const customAgent = new ArchitecturePlannerAgent({
				provider: "anthropic",
				model: "claude-3-5-sonnet-20241022",
				temperature: 0.5,
				maxTokens: 6000,
			});

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidArchitectureResult),
				usage: { totalTokens: 2000 },
			});

			const result = await customAgent.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(result.success).toBe(true);
			expect(mockGenerateText).toHaveBeenCalledWith(
				expect.objectContaining({
					temperature: 0.5,
					maxTokens: 6000,
				}),
			);
		});
	});
});
