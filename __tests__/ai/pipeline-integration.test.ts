import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import {
	type Project,
	ProjectStatus,
	type Stage,
	StageStatus,
} from "@prisma/client";
import { PipelineContextFactory } from "~/lib/ai/pipeline-context";
import {
	PipelineErrorHandler,
	PipelineErrorType,
} from "~/lib/ai/pipeline-errors";
import {
	type PipelineConfig,
	PipelineManager,
} from "~/lib/ai/pipeline-manager";
import { PipelineService } from "~/lib/ai/pipeline-service";
import {
	createPipelineStages,
	createProject,
	getProjectById,
	getStagesByProjectId,
	updateProjectStatus,
	updateStageStatus,
} from "~/lib/db/operations";
import type {
	AlgorithmAnalysisResult,
	ConceptExtractionResult,
	PipelineContext,
} from "~/types/ai";

// Mock the database operations
jest.mock("~/lib/db/operations");

// Mock environment variables
jest.mock("~/env.js", () => ({
	env: {
		OPENAI_API_KEY: "test-openai-key",
		GOOGLE_GENERATIVE_AI_API_KEY: "test-google-key",
		ANTHROPIC_API_KEY: "test-anthropic-key",
		DATABASE_URL: "postgresql://test:test@localhost:5432/test",
		NODE_ENV: "test",
	},
}));

// Mock AI SDK
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

const mockCreateProject = createProject as jest.MockedFunction<
	typeof createProject
>;
const mockCreatePipelineStages = createPipelineStages as jest.MockedFunction<
	typeof createPipelineStages
>;
const mockUpdateProjectStatus = updateProjectStatus as jest.MockedFunction<
	typeof updateProjectStatus
>;
const mockUpdateStageStatus = updateStageStatus as jest.MockedFunction<
	typeof updateStageStatus
>;
const mockGetProjectById = getProjectById as jest.MockedFunction<
	typeof getProjectById
>;
const mockGetStagesByProjectId = getStagesByProjectId as jest.MockedFunction<
	typeof getStagesByProjectId
>;

describe("Pipeline Integration Tests", () => {
	let pipelineManager: PipelineManager;
	let pipelineService: PipelineService;
	let testConfig: PipelineConfig;
	let testContext: PipelineContext;

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Create test configuration
		testConfig = {
			conceptExtractor: {
				provider: "openai",
				model: "gpt-4o-mini",
				temperature: 0.7,
				maxTokens: 4000,
				retryAttempts: 2,
				retryDelay: 100,
			},
			algorithmAnalyzer: {
				provider: "openai",
				model: "gpt-4o-mini",
				temperature: 0.7,
				maxTokens: 4000,
				retryAttempts: 2,
				retryDelay: 100,
			},
			architecturePlanner: {
				provider: "openai",
				model: "gpt-4o-mini",
				temperature: 0.7,
				maxTokens: 4000,
				retryAttempts: 2,
				retryDelay: 100,
			},
			implementationPlanner: {
				provider: "openai",
				model: "gpt-4o-mini",
				temperature: 0.7,
				maxTokens: 4000,
				retryAttempts: 2,
				retryDelay: 100,
			},
			codeGenerator: {
				provider: "openai",
				model: "gpt-4o-mini",
				temperature: 0.3,
				maxTokens: 8000,
				retryAttempts: 2,
				retryDelay: 100,
			},
			documentationGenerator: {
				provider: "openai",
				model: "gpt-4o-mini",
				temperature: 0.7,
				maxTokens: 4000,
				retryAttempts: 2,
				retryDelay: 100,
			},
			maxRetries: 2,
			retryDelay: 100,
			enableParallelProcessing: false,
		};

		// Create test context
		testContext = PipelineContextFactory.createMinimal(
			"test-project-id",
			"This is a test research paper about machine learning algorithms. It describes a novel approach to neural network training using reinforcement learning techniques.",
			"test-paper.pdf",
			1024000,
		);

		// Initialize pipeline manager
		pipelineManager = new PipelineManager(testConfig);
		pipelineService = PipelineService.getInstance();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("PipelineManager Integration", () => {
		it("should execute complete pipeline successfully", async () => {
			// Mock database responses
			const mockStages: Stage[] = [
				{
					id: "stage-1",
					projectId: "test-project-id",
					stageNumber: 1,
					stageName: "Concept Extraction",
					status: StageStatus.PENDING,
					inputData: null,
					outputData: null,
					errorMessage: null,
					startedAt: null,
					completedAt: null,
					createdAt: new Date(),
				},
				{
					id: "stage-2",
					projectId: "test-project-id",
					stageNumber: 2,
					stageName: "Algorithm Analysis",
					status: StageStatus.PENDING,
					inputData: null,
					outputData: null,
					errorMessage: null,
					startedAt: null,
					completedAt: null,
					createdAt: new Date(),
				},
				// Add remaining stages...
			];

			mockGetStagesByProjectId.mockResolvedValue(mockStages);
			mockUpdateProjectStatus.mockResolvedValue({} as Project);
			mockUpdateStageStatus.mockResolvedValue({} as Stage);
			mockCreatePipelineStages.mockResolvedValue(mockStages);

			// Mock AI responses
			const { generateText } = await import("ai");
			const mockGenerateText = generateText as jest.MockedFunction<
				typeof generateText
			>;

			// Mock concept extraction response
			const mockConceptsResult: ConceptExtractionResult = {
				concepts: {
					mainObjective: "Develop a novel neural network training approach",
					keyMethods: ["reinforcement learning", "neural networks"],
					algorithms: ["policy gradient", "actor-critic"],
					datasets: ["synthetic data"],
					evaluationMetrics: ["accuracy", "convergence rate"],
					technicalRequirements: ["Python", "PyTorch"],
					dependencies: ["torch", "numpy"],
				},
				confidence: 0.9,
				extractedSections: {
					abstract: "This paper presents a novel approach...",
				},
			};

			// Mock algorithm analysis response
			const mockAlgorithmResult: AlgorithmAnalysisResult = {
				specs: {
					algorithms: [
						{
							name: "Policy Gradient Algorithm",
							description: "A reinforcement learning algorithm",
							type: "machine_learning",
							complexity: "medium",
							inputs: [
								{
									name: "state",
									type: "tensor",
									description: "Current state",
									required: true,
									format: "torch.Tensor",
								},
							],
							outputs: [
								{
									name: "action",
									type: "tensor",
									description: "Selected action",
									format: "torch.Tensor",
								},
							],
							parameters: [
								{
									name: "learning_rate",
									type: "float",
									description: "Learning rate",
									defaultValue: 0.001,
								},
							],
							dependencies: ["torch", "numpy"],
							pseudocode: "Initialize policy network...",
						},
					],
					systemRequirements: {
						programmingLanguage: "Python",
						frameworks: ["PyTorch"],
						libraries: ["torch", "numpy"],
						minimumHardware: {
							cpu: "4 cores",
							memory: "8GB",
							storage: "10GB",
						},
						operatingSystem: ["Linux", "macOS", "Windows"],
						pythonVersion: "3.8+",
					},
					implementationComplexity: "medium",
					estimatedDevelopmentTime: "2-3 weeks",
				},
				confidence: 0.85,
				implementationNotes: ["Use stable baselines for reference"],
				potentialChallenges: ["Hyperparameter tuning"],
				recommendedApproach: "Start with simple policy gradient",
			};

			mockGenerateText
				.mockResolvedValueOnce({
					text: JSON.stringify(mockConceptsResult),
					usage: { totalTokens: 1000 },
				})
				.mockResolvedValueOnce({
					text: JSON.stringify(mockAlgorithmResult),
					usage: { totalTokens: 1500 },
				})
				.mockResolvedValue({
					text: JSON.stringify({ message: "Stage completed successfully" }),
					usage: { totalTokens: 500 },
				});

			// Execute pipeline
			const result = await pipelineManager.executePipeline(testContext);

			// Verify results
			expect(result.success).toBe(true);
			expect(result.projectId).toBe("test-project-id");
			expect(result.completedStages).toBe(6);
			expect(result.results.concepts).toEqual(mockConceptsResult);
			expect(result.results.algorithms).toEqual(mockAlgorithmResult);

			// Verify database calls
			expect(mockUpdateProjectStatus).toHaveBeenCalledWith(
				"test-project-id",
				ProjectStatus.PROCESSING,
				0,
			);
			expect(mockUpdateProjectStatus).toHaveBeenLastCalledWith(
				"test-project-id",
				ProjectStatus.COMPLETED,
				6,
			);
		});

		it("should handle stage failures with retry logic", async () => {
			// Mock database responses
			const mockStages: Stage[] = [
				{
					id: "stage-1",
					projectId: "test-project-id",
					stageNumber: 1,
					stageName: "Concept Extraction",
					status: StageStatus.PENDING,
					inputData: null,
					outputData: null,
					errorMessage: null,
					startedAt: null,
					completedAt: null,
					createdAt: new Date(),
				},
			];

			mockGetStagesByProjectId.mockResolvedValue(mockStages);
			mockUpdateProjectStatus.mockResolvedValue({} as Project);
			mockUpdateStageStatus.mockResolvedValue({} as Stage);

			// Mock AI failure then success
			const { generateText } = await import("ai");
			const mockGenerateText = generateText as jest.MockedFunction<
				typeof generateText
			>;

			mockGenerateText
				.mockRejectedValueOnce(new Error("AI service temporarily unavailable"))
				.mockResolvedValueOnce({
					text: JSON.stringify({
						concepts: {
							mainObjective: "Test objective",
							keyMethods: ["test method"],
							algorithms: ["test algorithm"],
							datasets: ["test dataset"],
							evaluationMetrics: ["test metric"],
							technicalRequirements: ["Python"],
							dependencies: ["numpy"],
						},
						confidence: 0.8,
						extractedSections: {},
					}),
					usage: { totalTokens: 1000 },
				});

			// Execute pipeline
			const result = await pipelineManager.executePipeline(testContext);

			// Verify retry behavior
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
			expect(mockUpdateStageStatus).toHaveBeenCalledWith(
				"stage-1",
				StageStatus.RETRYING,
				expect.objectContaining({
					errorMessage: expect.stringContaining("Attempt 1 failed"),
				}),
			);
		});

		it("should handle pipeline cancellation", async () => {
			// Mock database responses
			mockGetStagesByProjectId.mockResolvedValue([]);
			mockUpdateProjectStatus.mockResolvedValue({} as Project);
			mockUpdateStageStatus.mockResolvedValue({} as Stage);

			// Cancel pipeline
			await pipelineManager.cancelPipeline("test-project-id");

			// Verify cancellation
			expect(mockUpdateProjectStatus).toHaveBeenCalledWith(
				"test-project-id",
				ProjectStatus.CANCELLED,
			);
		});

		it("should get pipeline progress correctly", async () => {
			// Mock stages with mixed status
			const mockStages: Stage[] = [
				{
					id: "stage-1",
					projectId: "test-project-id",
					stageNumber: 1,
					stageName: "Concept Extraction",
					status: StageStatus.COMPLETED,
					inputData: null,
					outputData: { result: "concepts extracted" },
					errorMessage: null,
					startedAt: new Date(),
					completedAt: new Date(),
					createdAt: new Date(),
				},
				{
					id: "stage-2",
					projectId: "test-project-id",
					stageNumber: 2,
					stageName: "Algorithm Analysis",
					status: StageStatus.PROCESSING,
					inputData: null,
					outputData: null,
					errorMessage: null,
					startedAt: new Date(),
					completedAt: null,
					createdAt: new Date(),
				},
				{
					id: "stage-3",
					projectId: "test-project-id",
					stageNumber: 3,
					stageName: "Architecture Planning",
					status: StageStatus.PENDING,
					inputData: null,
					outputData: null,
					errorMessage: null,
					startedAt: null,
					completedAt: null,
					createdAt: new Date(),
				},
			];

			mockGetStagesByProjectId.mockResolvedValue(mockStages);

			// Get progress
			const progress =
				await pipelineManager.getPipelineProgress("test-project-id");

			// Verify progress
			expect(progress.currentStage).toBe(1);
			expect(progress.totalStages).toBe(6);
			expect(progress.status).toBe(ProjectStatus.PROCESSING);
			expect(progress.stages).toHaveLength(3);
			expect(progress.stages[0].status).toBe("completed");
			expect(progress.stages[1].status).toBe("processing");
			expect(progress.stages[2].status).toBe("pending");
		});
	});

	describe("PipelineService Integration", () => {
		it("should start pipeline through service", async () => {
			// Mock project data
			const mockProject: Project = {
				id: "test-project-id",
				userId: "test-user-id",
				title: "Test Paper",
				status: ProjectStatus.UPLOADED,
				currentStage: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
				paperContent: "Test paper content about machine learning",
				metadata: {
					fileName: "test-paper.pdf",
					fileSize: 1024000,
				},
			};

			mockGetProjectById.mockResolvedValue(mockProject);
			mockGetStagesByProjectId.mockResolvedValue([]);
			mockUpdateProjectStatus.mockResolvedValue({} as Project);

			// Start pipeline
			const result = await pipelineService.startPipeline("test-project-id");

			// Verify result
			expect(result.success).toBe(true);
			expect(result.message).toBe("Pipeline started successfully");
			expect(mockGetProjectById).toHaveBeenCalledWith("test-project-id");
		});

		it("should handle invalid project ID", async () => {
			mockGetProjectById.mockResolvedValue(null);

			// Start pipeline with invalid ID
			const result = await pipelineService.startPipeline("invalid-project-id");

			// Verify error handling
			expect(result.success).toBe(false);
			expect(result.error).toContain("Project not found");
		});

		it("should get pipeline progress through service", async () => {
			// Mock stages
			const mockStages: Stage[] = [
				{
					id: "stage-1",
					projectId: "test-project-id",
					stageNumber: 1,
					stageName: "Concept Extraction",
					status: StageStatus.COMPLETED,
					inputData: null,
					outputData: null,
					errorMessage: null,
					startedAt: new Date(),
					completedAt: new Date(),
					createdAt: new Date(),
				},
			];

			mockGetStagesByProjectId.mockResolvedValue(mockStages);

			// Get progress
			const result =
				await pipelineService.getPipelineProgress("test-project-id");

			// Verify result
			expect(result.success).toBe(true);
			expect(result.data?.currentStage).toBe(1);
			expect(result.data?.progressPercentage).toBe(17); // 1/6 * 100 rounded
		});

		it("should perform health check", async () => {
			// Perform health check
			const health = await pipelineService.healthCheck();

			// Verify health check
			expect(health.status).toBeDefined();
			expect(health.details.configurationValid).toBe(true);
			expect(health.details.availableProviders).toContain("openai");
			expect(health.timestamp).toBeInstanceOf(Date);
		});
	});

	describe("PipelineContextFactory Integration", () => {
		it("should create context from project ID", async () => {
			// Mock project data
			const mockProject: Project & { stages: Stage[] } = {
				id: "test-project-id",
				userId: "test-user-id",
				title: "Test Paper",
				status: ProjectStatus.UPLOADED,
				currentStage: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
				paperContent: "Test paper content",
				metadata: {
					fileName: "test-paper.pdf",
					fileSize: 1024000,
					pageCount: 10,
				},
				stages: [],
			};

			const mockStages: Stage[] = [
				{
					id: "stage-1",
					projectId: "test-project-id",
					stageNumber: 1,
					stageName: "Concept Extraction",
					status: StageStatus.PENDING,
					inputData: null,
					outputData: null,
					errorMessage: null,
					startedAt: null,
					completedAt: null,
					createdAt: new Date(),
				},
			];

			mockGetProjectById.mockResolvedValue(mockProject);
			mockGetStagesByProjectId.mockResolvedValue(mockStages);

			// Create context
			const context =
				await PipelineContextFactory.fromProjectId("test-project-id");

			// Verify context
			expect(context).not.toBeNull();
			if (context) {
				expect(context.projectId).toBe("test-project-id");
				expect(context.paperContent).toBe("Test paper content");
				expect(context.metadata.fileName).toBe("test-paper.pdf");
				expect(context.stages).toHaveLength(1);
			}
		});

		it("should validate context correctly", () => {
			// Test valid context
			const validContext = PipelineContextFactory.createMinimal(
				"test-id",
				"Valid paper content with sufficient length to pass validation checks",
				"test.pdf",
				1000,
			);

			const validResult = PipelineContextFactory.validate(validContext);
			expect(validResult.valid).toBe(true);
			expect(validResult.errors).toHaveLength(0);

			// Test invalid context
			const invalidContext: Partial<PipelineContext> = {
				projectId: "",
				paperContent: "short",
				stages: [],
				metadata: {
					fileName: "",
					fileSize: -1,
				},
			};

			const invalidResult = PipelineContextFactory.validate(
				invalidContext as PipelineContext,
			);
			expect(invalidResult.valid).toBe(false);
			expect(invalidResult.errors.length).toBeGreaterThan(0);
		});

		it("should update stage in context", () => {
			const context = PipelineContextFactory.createMinimal(
				"test-id",
				"Test content",
				"test.pdf",
				1000,
			);

			// Update stage
			const updatedContext = PipelineContextFactory.updateStageInContext(
				context,
				1,
				{ status: "completed", result: { data: "test result" } },
			);

			// Verify update
			const stage = PipelineContextFactory.getStageFromContext(
				updatedContext,
				1,
			);
			expect(stage?.status).toBe("completed");
			expect(stage?.result).toEqual({ data: "test result" });
		});

		it("should calculate pipeline progress", () => {
			const context = PipelineContextFactory.createMinimal(
				"test-id",
				"Test content",
				"test.pdf",
				1000,
			);

			// Update some stages to completed
			let updatedContext = PipelineContextFactory.updateStageInContext(
				context,
				1,
				{ status: "completed" },
			);
			updatedContext = PipelineContextFactory.updateStageInContext(
				updatedContext,
				2,
				{ status: "completed" },
			);

			// Check progress
			const progress =
				PipelineContextFactory.getPipelineProgress(updatedContext);
			expect(progress).toBe(33); // 2/6 * 100 rounded

			// Check completion status
			const isComplete =
				PipelineContextFactory.isPipelineComplete(updatedContext);
			expect(isComplete).toBe(false);

			const hasErrors =
				PipelineContextFactory.hasPipelineErrors(updatedContext);
			expect(hasErrors).toBe(false);
		});
	});

	describe("PipelineErrorHandler Integration", () => {
		it("should create and format errors correctly", () => {
			// Create error
			const error = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"AI service is temporarily unavailable",
				{
					stage: 1,
					stageName: "Concept Extraction",
					projectId: "test-project-id",
					retryable: true,
				},
			);

			// Verify error structure
			expect(error.type).toBe(PipelineErrorType.AI_SERVICE_ERROR);
			expect(error.message).toBe("AI service is temporarily unavailable");
			expect(error.stage).toBe(1);
			expect(error.stageName).toBe("Concept Extraction");
			expect(error.retryable).toBe(true);
			expect(error.projectId).toBe("test-project-id");

			// Test user formatting
			const userMessage = PipelineErrorHandler.formatErrorForUser(error);
			expect(userMessage).toContain("Stage 1");
			expect(userMessage).toContain("Concept Extraction");

			// Test logging formatting
			const logMessage = PipelineErrorHandler.formatErrorForLogging(error);
			expect(logMessage).toContain("[AI_SERVICE_ERROR]");
			expect(logMessage).toContain("Project: test-project-id");
		});

		it("should parse different error types", () => {
			// Test rate limit error
			const rateLimitError = new Error("Rate limit exceeded for requests");
			const parsedRateLimit = PipelineErrorHandler.parseError(rateLimitError);
			expect(parsedRateLimit.type).toBe(PipelineErrorType.RATE_LIMIT_ERROR);
			expect(parsedRateLimit.retryable).toBe(false);

			// Test timeout error
			const timeoutError = new Error("Request timed out after 30 seconds");
			const parsedTimeout = PipelineErrorHandler.parseError(timeoutError);
			expect(parsedTimeout.type).toBe(PipelineErrorType.TIMEOUT_ERROR);
			expect(parsedTimeout.retryable).toBe(true);

			// Test configuration error
			const configError = new Error("API key not configured");
			const parsedConfig = PipelineErrorHandler.parseError(configError);
			expect(parsedConfig.type).toBe(PipelineErrorType.CONFIGURATION_ERROR);
			expect(parsedConfig.retryable).toBe(false);
		});

		it("should provide recovery suggestions", () => {
			const rateLimitError = PipelineErrorHandler.createError(
				PipelineErrorType.RATE_LIMIT_ERROR,
				"Rate limit exceeded",
			);

			const suggestions =
				PipelineErrorHandler.getRecoverySuggestions(rateLimitError);
			expect(suggestions).toContain("Wait for the rate limit to reset");
			expect(suggestions).toContain(
				"Consider upgrading your API plan for higher limits",
			);

			const configError = PipelineErrorHandler.createError(
				PipelineErrorType.CONFIGURATION_ERROR,
				"API key missing",
			);

			const configSuggestions =
				PipelineErrorHandler.getRecoverySuggestions(configError);
			expect(configSuggestions).toContain(
				"Check your API keys in the environment configuration",
			);
		});

		it("should calculate retry delays correctly", () => {
			const aiError = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"Service error",
			);

			// Test exponential backoff
			const delay1 = PipelineErrorHandler.getSuggestedRetryDelay(aiError, 1);
			const delay2 = PipelineErrorHandler.getSuggestedRetryDelay(aiError, 2);
			expect(delay2).toBeGreaterThan(delay1);

			const rateLimitError = PipelineErrorHandler.createError(
				PipelineErrorType.RATE_LIMIT_ERROR,
				"Rate limit",
			);

			// Test rate limit delay
			const rateLimitDelay = PipelineErrorHandler.getSuggestedRetryDelay(
				rateLimitError,
				1,
			);
			expect(rateLimitDelay).toBe(60000); // 1 minute
		});
	});

	describe("End-to-End Pipeline Flow", () => {
		it("should execute complete pipeline flow with real-like data", async () => {
			// Setup comprehensive test scenario
			const mockProject: Project & {
				stages: Stage[];
				user: null;
				generatedFiles: [];
			} = {
				id: "e2e-test-project",
				userId: "test-user",
				title: "Deep Reinforcement Learning for Autonomous Navigation",
				paperContent: `
          Abstract: This paper presents a novel approach to autonomous navigation using deep reinforcement learning.
          We propose a new algorithm called NavRL that combines policy gradient methods with attention mechanisms.
          
          1. Introduction
          Autonomous navigation is a challenging problem in robotics and AI. Traditional approaches rely on 
          hand-crafted features and rule-based systems. Our approach uses deep reinforcement learning to learn
          navigation policies directly from raw sensor data.
          
          2. Method
          Our NavRL algorithm consists of three main components:
          - State encoder: Processes raw sensor data into feature representations
          - Policy network: Outputs action probabilities given current state
          - Value network: Estimates state values for training stability
          
          The training procedure follows these steps:
          1. Collect trajectories using current policy
          2. Compute advantages using GAE
          3. Update policy and value networks using PPO
          
          3. Experiments
          We evaluate NavRL on three environments: GridWorld, MazeNav, and RealRobot.
          Results show 25% improvement over baseline methods.
        `,
				status: ProjectStatus.UPLOADED,
				currentStage: 0,
				metadata: {
					fileName: "navrl_paper.pdf",
					fileSize: 2048000,
					pageCount: 12,
					authors: ["John Doe", "Jane Smith"],
				},
				createdAt: new Date(),
				updatedAt: new Date(),
				user: null,
				stages: [],
				generatedFiles: [],
			};

			// Mock all database operations
			mockGetProjectById.mockResolvedValue(mockProject);
			mockGetStagesByProjectId.mockResolvedValue([]);
			mockCreatePipelineStages.mockResolvedValue([]);
			mockUpdateProjectStatus.mockResolvedValue({} as Project);
			mockUpdateStageStatus.mockResolvedValue({} as Stage);

			// Mock AI responses for each stage
			const { generateText } = await import("ai");
			const mockGenerateText = generateText as jest.MockedFunction<
				typeof generateText
			>;

			const conceptsResponse: ConceptExtractionResult = {
				concepts: {
					mainObjective:
						"Develop autonomous navigation using deep reinforcement learning",
					keyMethods: [
						"deep reinforcement learning",
						"policy gradient",
						"attention mechanisms",
					],
					algorithms: ["NavRL", "PPO", "GAE"],
					datasets: ["GridWorld", "MazeNav", "RealRobot"],
					evaluationMetrics: [
						"success rate",
						"path efficiency",
						"collision rate",
					],
					technicalRequirements: ["Python", "PyTorch", "OpenAI Gym"],
					dependencies: ["torch", "gym", "numpy", "matplotlib"],
				},
				confidence: 0.92,
				extractedSections: {
					abstract:
						"This paper presents a novel approach to autonomous navigation...",
					methodology:
						"Our NavRL algorithm consists of three main components...",
				},
			};

			const algorithmResponse: AlgorithmAnalysisResult = {
				specs: {
					algorithms: [
						{
							name: "NavRL Algorithm",
							description:
								"Deep reinforcement learning algorithm for navigation",
							type: "machine_learning",
							complexity: "high",
							inputs: [
								{
									name: "sensor_data",
									type: "tensor",
									description: "Raw sensor observations",
									required: true,
									format: "torch.Tensor[batch_size, channels, height, width]",
								},
							],
							outputs: [
								{
									name: "action_probs",
									type: "tensor",
									description: "Action probability distribution",
									format: "torch.Tensor[batch_size, num_actions]",
								},
							],
							parameters: [
								{
									name: "learning_rate",
									type: "float",
									description: "Learning rate for policy updates",
									defaultValue: 3e-4,
									range: { min: 1e-5, max: 1e-2 },
								},
								{
									name: "gamma",
									type: "float",
									description: "Discount factor",
									defaultValue: 0.99,
									range: { min: 0.9, max: 0.999 },
								},
							],
							dependencies: ["torch", "gym", "numpy"],
							pseudocode: `
                1. Initialize policy network π and value network V
                2. For each episode:
                   a. Collect trajectory using π
                   b. Compute advantages using GAE
                   c. Update π and V using PPO loss
              `,
							mathematicalFormulation:
								"L_policy = E[min(r_t * A_t, clip(r_t, 1-ε, 1+ε) * A_t)]",
						},
					],
					systemRequirements: {
						programmingLanguage: "Python",
						frameworks: ["PyTorch", "OpenAI Gym"],
						libraries: ["torch", "gym", "numpy", "matplotlib"],
						minimumHardware: {
							cpu: "8 cores",
							memory: "16GB",
							storage: "50GB",
							gpu: "NVIDIA GTX 1080 or better",
						},
						operatingSystem: ["Linux", "macOS"],
						pythonVersion: "3.8+",
					},
					implementationComplexity: "high",
					estimatedDevelopmentTime: "4-6 weeks",
				},
				confidence: 0.88,
				implementationNotes: [
					"Use stable-baselines3 as reference implementation",
					"Implement custom attention mechanism for state encoder",
					"Use tensorboard for training monitoring",
				],
				potentialChallenges: [
					"Hyperparameter tuning for stable training",
					"Handling sparse rewards in navigation tasks",
					"Scaling to high-dimensional observation spaces",
				],
				recommendedApproach:
					"Start with simple GridWorld environment, then scale to complex scenarios",
			};

			// Mock responses for all stages
			mockGenerateText
				.mockResolvedValueOnce({
					text: JSON.stringify(conceptsResponse),
					usage: { totalTokens: 2500 },
				})
				.mockResolvedValueOnce({
					text: JSON.stringify(algorithmResponse),
					usage: { totalTokens: 3500 },
				})
				.mockResolvedValue({
					text: JSON.stringify({
						status: "completed",
						message: "Stage completed successfully",
						data: { placeholder: "implementation pending" },
					}),
					usage: { totalTokens: 1000 },
				});

			// Execute end-to-end pipeline
			const startResult =
				await pipelineService.startPipeline("e2e-test-project");
			expect(startResult.success).toBe(true);

			// Simulate pipeline execution (since it runs async)
			const context =
				await PipelineContextFactory.fromProjectId("e2e-test-project");
			expect(context).not.toBeNull();

			if (context) {
				const pipelineResult = await pipelineManager.executePipeline(context);

				// Verify comprehensive results
				expect(pipelineResult.success).toBe(true);
				expect(pipelineResult.completedStages).toBe(6);
				expect(pipelineResult.results.concepts).toEqual(conceptsResponse);
				expect(pipelineResult.results.algorithms).toEqual(algorithmResponse);
				expect(pipelineResult.metadata?.totalProcessingTime).toBeGreaterThan(0);

				// Verify all stages were processed
				expect(mockUpdateStageStatus).toHaveBeenCalledTimes(12); // 6 stages * 2 calls each (processing + completed)
				expect(mockUpdateProjectStatus).toHaveBeenCalledWith(
					"e2e-test-project",
					ProjectStatus.COMPLETED,
					6,
				);
			}
		});
	});
});
