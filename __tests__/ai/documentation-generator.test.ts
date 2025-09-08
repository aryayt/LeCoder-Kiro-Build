import { beforeEach, describe, it } from "@jest/globals";
import { DocumentationGeneratorAgent } from "~/lib/ai/agents/documentation-generator";
import type {
	DocumentationGenerationResult,
	GeneratedCodebase,
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

describe("DocumentationGeneratorAgent", () => {
	let agent: DocumentationGeneratorAgent;
	const mockGenerateText = require("ai").generateText as jest.MockedFunction<
		typeof import("ai").generateText
	>;

	const mockCodebase: GeneratedCodebase = {
		files: [
			{
				path: "main.py",
				content:
					"import numpy as np\n\ndef main():\n    print('Hello World')\n\nif __name__ == '__main__':\n    main()",
				type: "source",
				language: "python",
				dependencies: ["numpy"],
				exports: ["main"],
			},
			{
				path: "src/utils.py",
				content: "def helper_function():\n    return 'helper'",
				type: "source",
				language: "python",
				dependencies: [],
				exports: ["helper_function"],
			},
		],
		structure: {
			rootDirectory: "research_project",
			directories: [
				{
					path: "src/",
					purpose: "Source code directory",
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
						dependencies: ["numpy>=1.21.0"],
					},
				},
			],
		},
		documentation: {
			readme: {
				title: "Research Project",
				description: "Implementation of research algorithms",
				features: ["Algorithm implementation"],
				installation: ["pip install -r requirements.txt"],
				usage: [
					{
						title: "Basic Usage",
						description: "Run the main script",
						code: "python main.py",
						language: "bash",
					},
				],
				contributing: ["Fork repository"],
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
						description: "Verify installation works",
						commands: ["python -c 'import numpy'"],
						expectedOutput: "No output (success)",
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
					description: "System architecture overview",
					components: [
						{
							name: "Main Module",
							purpose: "Entry point",
							responsibilities: ["Initialization"],
							interfaces: ["MainInterface"],
						},
					],
					dataFlow: "Input -> Processing -> Output",
					designPatterns: ["Strategy Pattern"],
				},
				codeStructure: {
					overview: "Modular structure",
					directories: [
						{
							path: "src/",
							purpose: "Source code",
							contents: ["utilities"],
						},
					],
					namingConventions: [
						{
							type: "functions",
							pattern: "snake_case",
							examples: ["helper_function"],
						},
					],
					codingStandards: [
						{
							category: "Documentation",
							rules: ["All functions documented"],
							examples: ['def func():\n    """Description"""'],
						},
					],
				},
				contributionGuidelines: {
					gettingStarted: ["Clone repository"],
					developmentProcess: ["Write tests"],
					codeReview: ["Review required"],
					issueReporting: ["Use templates"],
				},
				testingGuide: {
					overview: "Testing approach",
					testTypes: [
						{
							type: "unit",
							purpose: "Test functions",
							location: "tests/",
							examples: ["test_main.py"],
						},
					],
					runningTests: ["pytest"],
					writingTests: ["Use pytest framework"],
				},
			},
			changelog: [],
		},
		tests: [
			{
				path: "tests/test_main.py",
				content:
					"import pytest\nfrom main import main\n\ndef test_main():\n    assert main() is None",
				testType: "unit",
				targetFile: "main.py",
				coverage: ["main function"],
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
					description: "Python path configuration",
					required: false,
					defaultValue: ".",
				},
			],
		},
	};

	const mockArchitecture: SystemArchitecture = {
		projectStructure: {
			rootDirectory: "research_project",
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
					purpose: "Dependencies",
				},
			],
		},
		modules: [
			{
				name: "MainModule",
				path: "src/",
				purpose: "Main functionality",
				exports: ["main"],
				imports: ["numpy"],
				functions: [
					{
						name: "main",
						purpose: "Entry point function",
						parameters: [],
						returnType: "None",
						complexity: "low",
					},
				],
			},
		],
		dataFlow: [
			{
				from: "input",
				to: "output",
				dataType: "data",
				description: "Data flow",
			},
		],
		apiEndpoints: [],
		databaseSchema: [],
		deploymentStrategy: {
			platform: "Local",
			environment: "development",
			requirements: ["Python 3.8+"],
			steps: [
				{
					order: 1,
					description: "Install dependencies",
					command: "pip install -r requirements.txt",
				},
			],
		},
	};

	const mockValidDocumentationResult: DocumentationGenerationResult = {
		documentation: {
			readme: {
				title: "Research Implementation: Advanced Algorithm Study",
				description:
					"Complete implementation of research algorithms with comprehensive documentation and examples",
				features: [
					"Advanced algorithm implementation",
					"Comprehensive data processing pipeline",
					"Evaluation metrics and benchmarking",
					"Extensible architecture for research",
				],
				installation: [
					"git clone https://github.com/user/research-implementation.git",
					"cd research-implementation",
					"pip install -r requirements.txt",
				],
				usage: [
					{
						title: "Basic Usage",
						description: "Run the main algorithm with default parameters",
						code: "python main.py --input data.csv --output results.json",
						language: "bash",
					},
					{
						title: "Python API Usage",
						description: "Use the algorithm programmatically in Python",
						code: "from src.algorithm import ResearchAlgorithm\nalg = ResearchAlgorithm()\nresult = alg.process(data)",
						language: "python",
					},
				],
				contributing: [
					"Fork the repository on GitHub",
					"Create a feature branch from main",
					"Make your changes with proper tests",
					"Submit a pull request with detailed description",
				],
				license: "MIT",
				badges: [
					{
						name: "Python Version",
						url: "https://img.shields.io/badge/python-3.8+-blue.svg",
						imageUrl: "https://img.shields.io/badge/python-3.8+-blue.svg",
					},
				],
			},
			apiDocs: [
				{
					endpoint: "/api/process",
					method: "POST",
					description: "Process data through the research algorithm",
					parameters: [
						{
							name: "data",
							type: "array",
							required: true,
							description: "Input data array for processing",
							example: [
								[1, 2, 3],
								[4, 5, 6],
							],
						},
					],
					responses: [
						{
							statusCode: 200,
							description: "Successful processing with results",
							schema: { result: "array", metadata: "object" },
							example: {
								result: [0.1, 0.2],
								metadata: { processing_time: 1.5 },
							},
						},
					],
					examples: [
						{
							title: "Basic Processing Request",
							request: {
								data: [
									[1, 2],
									[3, 4],
								],
							},
							response: { result: [0.5, 0.7], metadata: { time: 0.1 } },
						},
					],
				},
			],
			setupGuide: {
				prerequisites: [
					{
						name: "Python",
						version: "3.8+",
						description: "Python programming language runtime",
						installationUrl: "https://python.org/downloads",
					},
					{
						name: "pip",
						description: "Python package installer",
						installationUrl: "https://pip.pypa.io/en/stable/installation/",
					},
				],
				installationSteps: [
					{
						order: 1,
						title: "Clone Repository",
						description: "Download the source code from GitHub",
						commands: [
							"git clone https://github.com/user/research-implementation.git",
							"cd research-implementation",
						],
						notes: ["Ensure you have git installed on your system"],
					},
					{
						order: 2,
						title: "Install Dependencies",
						description: "Install all required Python packages",
						commands: ["pip install -r requirements.txt"],
						notes: ["Consider using a virtual environment for isolation"],
					},
				],
				configuration: [
					{
						order: 1,
						title: "Environment Variables",
						description: "Configure required environment variables",
						files: [".env", "config.yaml"],
						variables: [
							{
								variable: "DATA_PATH",
								description: "Path to input data directory",
								required: false,
								defaultValue: "./data",
							},
						],
					},
				],
				verification: [
					{
						order: 1,
						title: "Test Installation",
						description: "Verify that all dependencies are correctly installed",
						commands: [
							"python -c 'import src; print(\"Installation successful\")'",
						],
						expectedOutput: "Installation successful",
					},
					{
						order: 2,
						title: "Run Test Suite",
						description:
							"Execute the complete test suite to verify functionality",
						commands: ["python -m pytest tests/ -v"],
						expectedOutput: "All tests passed successfully",
					},
				],
			},
			userGuide: {
				sections: [
					{
						title: "Getting Started",
						content:
							"This section provides a comprehensive guide to get you started with the research implementation",
						subsections: [
							{
								title: "Quick Start Guide",
								content:
									"Follow these steps for a quick start with the basic functionality",
								codeExamples: [
									{
										title: "Basic Example",
										description: "Simple usage example to get started",
										code: "python main.py --help",
										language: "bash",
									},
								],
							},
						],
					},
					{
						title: "Input Data Format",
						content:
							"Detailed description of expected input data formats, validation requirements, and preprocessing steps",
					},
				],
				troubleshooting: [
					{
						problem: "Import Error when running the application",
						symptoms: ["ModuleNotFoundError", "Cannot import module"],
						solutions: [
							"Ensure all dependencies are installed via pip install -r requirements.txt",
							"Check that PYTHONPATH is correctly configured",
							"Verify that virtual environment is activated if using one",
						],
					},
				],
				faq: [
					{
						question: "What input data formats are supported by the algorithm?",
						answer:
							"The algorithm supports CSV, JSON, and NumPy array formats with automatic format detection",
						category: "Input/Output",
					},
				],
			},
			developerGuide: {
				architecture: {
					description:
						"Comprehensive overview of the system architecture and key design decisions",
					components: [
						{
							name: "Algorithm Module",
							purpose: "Core algorithm implementation and processing logic",
							responsibilities: [
								"Data preprocessing and validation",
								"Algorithm execution and optimization",
								"Result generation and formatting",
							],
							interfaces: ["AlgorithmInterface", "DataProcessor"],
						},
					],
					dataFlow:
						"Input validation -> Preprocessing -> Algorithm execution -> Post-processing -> Output generation",
					designPatterns: [
						"Strategy Pattern for algorithm selection",
						"Factory Pattern for data processors",
					],
				},
				codeStructure: {
					overview:
						"The codebase follows a modular architecture designed for maintainability and extensibility",
					directories: [
						{
							path: "src/",
							purpose:
								"Main source code directory containing all implementation files",
							contents: ["algorithms/", "utils/", "data/", "tests/"],
						},
					],
					namingConventions: [
						{
							type: "functions",
							pattern: "snake_case",
							examples: ["process_data", "calculate_metrics", "validate_input"],
						},
					],
					codingStandards: [
						{
							category: "Documentation",
							rules: [
								"All public functions must have comprehensive docstrings",
							],
							examples: [
								'def process(data: np.ndarray) -> Dict[str, Any]:\n    """Process input data and return results."""',
							],
						},
					],
				},
				contributionGuidelines: {
					gettingStarted: [
						"Fork the repository on GitHub",
						"Clone your fork locally",
						"Install development dependencies",
					],
					developmentProcess: [
						"Write comprehensive tests for new functionality",
						"Ensure all existing tests continue to pass",
						"Follow established coding standards and conventions",
					],
					codeReview: [
						"All code must be reviewed before merging to main branch",
						"Tests must pass the CI/CD pipeline",
						"Documentation must be updated for new features",
					],
					issueReporting: [
						"Use the provided issue template for bug reports",
						"Provide clear reproduction steps and system information",
						"Include relevant error messages and logs",
					],
				},
				testingGuide: {
					overview:
						"Comprehensive testing strategy ensures code quality and reliability across all components",
					testTypes: [
						{
							type: "unit",
							purpose: "Test individual functions and classes in isolation",
							location: "tests/unit/",
							examples: ["test_algorithm.py", "test_data_processor.py"],
						},
					],
					runningTests: [
						"python -m pytest tests/ # Run all tests",
						"python -m pytest tests/unit/ # Run unit tests only",
						"python -m pytest --coverage # Run with coverage report",
					],
					writingTests: [
						"Use pytest framework for all test implementations",
						"Follow naming convention test_*.py for test files",
						"Include both positive and negative test cases",
					],
				},
			},
			changelog: [
				{
					version: "1.0.0",
					date: "2024-01-01",
					changes: [
						{
							type: "added",
							description: "Initial implementation of core research algorithm",
						},
						{
							type: "added",
							description: "Comprehensive test suite with high coverage",
						},
					],
				},
			],
		},
		confidence: 0.95,
		documentationMetrics: {
			completeness: 95,
			readability: 90,
			technicalAccuracy: 95,
			exampleCoverage: 85,
		},
		generationNotes: [
			"Generated comprehensive README with detailed usage examples",
			"Created thorough setup guide with troubleshooting section",
			"Included complete developer documentation for contributors",
			"Added API documentation for all available endpoints",
		],
	};

	beforeEach(() => {
		agent = new DocumentationGeneratorAgent({
			provider: "google",
			model: "models/gemini-2.0-flash-exp",
		});
		jest.clearAllMocks();
	});

	describe("generateDocumentation", () => {
		it("should successfully generate comprehensive documentation", async () => {
			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidDocumentationResult),
				usage: { totalTokens: 3000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockValidDocumentationResult);
			expect(result.metadata?.tokensUsed).toBe(3000);
		});

		it("should include paper content in the prompt when provided", async () => {
			const paperContent =
				"This research paper introduces a novel approach to machine learning...";
			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidDocumentationResult),
				usage: { totalTokens: 3000 },
			});

			await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
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
			mockGenerateText.mockRejectedValue(
				new Error("Documentation generation failed"),
			);

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Documentation generation failed");
		});

		it("should handle invalid JSON responses", async () => {
			mockGenerateText.mockResolvedValue({
				text: "Invalid JSON content",
				usage: { totalTokens: 100 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Failed to parse JSON response");
		});

		it("should validate documentation structure", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				documentation: {
					...mockValidDocumentationResult.documentation,
					readme: null, // Missing required readme
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing readme in documentation");
		});

		it("should validate README content structure", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				documentation: {
					...mockValidDocumentationResult.documentation,
					readme: {
						title: "Test",
						// Missing required fields
					},
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing required field");
		});

		it("should validate setup guide structure", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				documentation: {
					...mockValidDocumentationResult.documentation,
					setupGuide: {
						prerequisites: "not an array", // Should be array
						installationSteps: [],
						configuration: [],
						verification: [],
					},
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("must be an array");
		});

		it("should validate confidence score", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				confidence: 1.2, // Invalid confidence > 1
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"Confidence score must be a number between 0 and 1",
			);
		});

		it("should validate documentation metrics", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				documentationMetrics: {
					...mockValidDocumentationResult.documentationMetrics,
					completeness: 150, // Invalid value > 100
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("must be a number between 0 and 100");
		});

		it("should validate usage examples in README", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				documentation: {
					...mockValidDocumentationResult.documentation,
					readme: {
						...mockValidDocumentationResult.documentation.readme,
						usage: [
							{
								title: "Example",
								// Missing required fields
							},
						],
					},
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("missing required fields");
		});

		it("should validate prerequisites in setup guide", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				documentation: {
					...mockValidDocumentationResult.documentation,
					setupGuide: {
						...mockValidDocumentationResult.documentation.setupGuide,
						prerequisites: [
							{
								name: "Python",
								// Missing description
							},
						],
					},
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("missing required fields");
		});

		it("should validate installation steps in setup guide", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				documentation: {
					...mockValidDocumentationResult.documentation,
					setupGuide: {
						...mockValidDocumentationResult.documentation.setupGuide,
						installationSteps: [
							{
								title: "Install",
								description: "Install packages",
								// Missing order field
							},
						],
					},
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("missing required fields");
		});
	});

	describe("generateDocumentationWithFallback", () => {
		it("should use fallback when detailed generation fails", async () => {
			// Create agent with no retries for this test
			const noRetryAgent = new DocumentationGeneratorAgent({
				provider: "google",
				model: "models/gemini-2.0-flash-exp",
				retryAttempts: 1, // Only 1 attempt, so it fails quickly
			});

			// First call fails
			mockGenerateText
				.mockRejectedValueOnce(new Error("Detailed documentation failed"))
				// Second call (fallback) succeeds
				.mockResolvedValueOnce({
					text: JSON.stringify(mockValidDocumentationResult),
					usage: { totalTokens: 2000 },
				});

			const result = await noRetryAgent.generateDocumentationWithFallback(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(true);
			expect(result.metadata?.fallbackUsed).toBe(true);
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
		});

		it("should return original error if both detailed and fallback fail", async () => {
			// Create agent with no retries for this test
			const noRetryAgent = new DocumentationGeneratorAgent({
				provider: "google",
				model: "models/gemini-2.0-flash-exp",
				retryAttempts: 1, // Only 1 attempt, so it fails quickly
			});

			mockGenerateText
				.mockRejectedValueOnce(new Error("Detailed documentation failed"))
				.mockRejectedValueOnce(new Error("Fallback also failed"));

			const result = await noRetryAgent.generateDocumentationWithFallback(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Detailed documentation failed");
		});
	});

	describe("validation edge cases", () => {
		it("should handle missing documentation object", async () => {
			const invalidResult = {
				confidence: 0.9,
				documentationMetrics: mockValidDocumentationResult.documentationMetrics,
				generationNotes: [],
				// Missing documentation object
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Missing documentation object");
		});

		it("should validate array fields in documentation", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				documentation: {
					...mockValidDocumentationResult.documentation,
					apiDocs: "not an array", // Should be array
				},
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("apiDocs must be an array");
		});

		it("should validate generation notes array", async () => {
			const invalidResult = {
				...mockValidDocumentationResult,
				generationNotes: "not an array", // Should be array
			};

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(invalidResult),
				usage: { totalTokens: 1000 },
			});

			const result = await agent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("generationNotes must be an array");
		});
	});

	describe("provider configuration", () => {
		it("should work with different AI providers", async () => {
			const openaiAgent = new DocumentationGeneratorAgent({
				provider: "openai",
				model: "gpt-4o",
			});

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidDocumentationResult),
				usage: { totalTokens: 3500 },
			});

			const result = await openaiAgent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(true);
			expect(result.metadata?.provider).toBe("openai");
		});

		it("should handle custom configuration parameters", async () => {
			const customAgent = new DocumentationGeneratorAgent({
				provider: "anthropic",
				model: "claude-3-5-sonnet-20241022",
				temperature: 0.4,
				maxTokens: 6000,
			});

			mockGenerateText.mockResolvedValue({
				text: JSON.stringify(mockValidDocumentationResult),
				usage: { totalTokens: 4000 },
			});

			const result = await customAgent.generateDocumentation(
				mockCodebase,
				mockArchitecture,
			);

			expect(result.success).toBe(true);
			expect(mockGenerateText).toHaveBeenCalledWith(
				expect.objectContaining({
					temperature: 0.4,
					maxTokens: 6000,
				}),
			);
		});
	});
});
