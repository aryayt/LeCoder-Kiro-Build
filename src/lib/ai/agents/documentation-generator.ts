import type {
	DocumentationGenerationResult,
	DocumentationMetrics,
	GeneratedCodebase,
	ReadmeContent,
	SetupGuide,
	SystemArchitecture,
} from '~/types/ai';
import { type AIConfig, type AgentResponse, BaseAIAgent } from '../base-agent';

export class DocumentationGeneratorAgent extends BaseAIAgent {
	constructor(config: AIConfig) {
		super(config);
	}

	/**
	 * Generate comprehensive documentation for the generated codebase
	 */
	async generateDocumentation(
		codebase: GeneratedCodebase,
		architecture: SystemArchitecture,
		paperContent?: string
	): Promise<AgentResponse<DocumentationGenerationResult>> {
		const systemPrompt = `You are an expert technical writer specializing in software documentation. Your task is to generate comprehensive, clear, and actionable documentation for a research implementation codebase.

Create documentation that enables users to understand, install, configure, and use the research implementation effectively.

Return a JSON response with this exact structure:
{
  "documentation": {
    "readme": {
      "title": "Research Implementation: [Paper Title]",
      "description": "Clear description of what this implementation does and its purpose",
      "features": [
        "Algorithm implementation of [specific algorithm]",
        "Data processing pipeline",
        "Evaluation metrics calculation"
      ],
      "installation": [
        "git clone [repository]",
        "cd [directory]",
        "pip install -r requirements.txt"
      ],
      "usage": [
        {
          "title": "Basic Usage",
          "description": "How to run the main algorithm",
          "code": "python main.py --input data.csv --output results.json",
          "language": "bash"
        },
        {
          "title": "Python API Usage",
          "description": "How to use the algorithm in Python code",
          "code": "from src.algorithm import AlgorithmClass\\nalg = AlgorithmClass()\\nresult = alg.process(data)",
          "language": "python"
        }
      ],
      "contributing": [
        "Fork the repository",
        "Create a feature branch",
        "Make your changes",
        "Add tests for new functionality",
        "Submit a pull request"
      ],
      "license": "MIT",
      "badges": [
        {
          "name": "Python Version",
          "url": "https://img.shields.io/badge/python-3.8+-blue.svg",
          "imageUrl": "https://img.shields.io/badge/python-3.8+-blue.svg"
        }
      ]
    },
    "apiDocs": [
      {
        "endpoint": "/api/process",
        "method": "POST",
        "description": "Process data through the algorithm",
        "parameters": [
          {
            "name": "data",
            "type": "array",
            "required": true,
            "description": "Input data array",
            "example": [[1, 2, 3], [4, 5, 6]]
          }
        ],
        "responses": [
          {
            "statusCode": 200,
            "description": "Successful processing",
            "schema": {"result": "array", "metadata": "object"},
            "example": {"result": [0.1, 0.2], "metadata": {"processing_time": 1.5}}
          }
        ],
        "examples": [
          {
            "title": "Basic Processing",
            "request": {"data": [[1, 2], [3, 4]]},
            "response": {"result": [0.5, 0.7], "metadata": {"time": 0.1}}
          }
        ]
      }
    ],
    "setupGuide": {
      "prerequisites": [
        {
          "name": "Python",
          "version": "3.8+",
          "description": "Python programming language",
          "installationUrl": "https://python.org/downloads"
        },
        {
          "name": "pip",
          "description": "Python package installer",
          "installationUrl": "https://pip.pypa.io/en/stable/installation/"
        }
      ],
      "installationSteps": [
        {
          "order": 1,
          "title": "Clone Repository",
          "description": "Download the source code",
          "commands": ["git clone <repository-url>", "cd research-implementation"],
          "notes": ["Ensure you have git installed"]
        },
        {
          "order": 2,
          "title": "Install Dependencies",
          "description": "Install required Python packages",
          "commands": ["pip install -r requirements.txt"],
          "notes": ["Consider using a virtual environment"]
        }
      ],
      "configuration": [
        {
          "order": 1,
          "title": "Environment Variables",
          "description": "Set up required environment variables",
          "files": [".env"],
          "variables": [
            {
              "variable": "DATA_PATH",
              "description": "Path to input data directory",
              "required": false,
              "defaultValue": "./data"
            }
          ]
        }
      ],
      "verification": [
        {
          "order": 1,
          "title": "Test Installation",
          "description": "Verify the installation works correctly",
          "commands": ["python -c 'import src; print(\"Installation successful\")'"],
          "expectedOutput": "Installation successful"
        },
        {
          "order": 2,
          "title": "Run Tests",
          "description": "Execute the test suite",
          "commands": ["python -m pytest tests/"],
          "expectedOutput": "All tests passed"
        }
      ]
    },
    "userGuide": {
      "sections": [
        {
          "title": "Getting Started",
          "content": "This section helps you get started with using the research implementation",
          "subsections": [
            {
              "title": "Quick Start",
              "content": "Follow these steps for a quick start",
              "codeExamples": [
                {
                  "title": "Basic Example",
                  "description": "Simple usage example",
                  "code": "python main.py --help",
                  "language": "bash"
                }
              ]
            }
          ]
        },
        {
          "title": "Input Data Format",
          "content": "Description of expected input data formats and requirements"
        },
        {
          "title": "Output Interpretation",
          "content": "How to interpret and use the algorithm outputs"
        }
      ],
      "troubleshooting": [
        {
          "problem": "Import Error",
          "symptoms": ["ModuleNotFoundError", "Cannot import module"],
          "solutions": [
            "Ensure all dependencies are installed",
            "Check Python path configuration",
            "Verify virtual environment is activated"
          ]
        }
      ],
      "faq": [
        {
          "question": "What input formats are supported?",
          "answer": "The algorithm supports CSV, JSON, and NumPy array formats",
          "category": "Input/Output"
        }
      ]
    },
    "developerGuide": {
      "architecture": {
        "description": "Overview of the system architecture and design decisions",
        "components": [
          {
            "name": "Algorithm Module",
            "purpose": "Core algorithm implementation",
            "responsibilities": ["Data processing", "Algorithm execution", "Result generation"],
            "interfaces": ["AlgorithmInterface", "DataProcessor"]
          }
        ],
        "dataFlow": "Input validation -> Preprocessing -> Algorithm execution -> Post-processing -> Output generation",
        "designPatterns": ["Strategy Pattern for algorithms", "Factory Pattern for data processors"]
      },
      "codeStructure": {
        "overview": "The codebase is organized in a modular structure for maintainability",
        "directories": [
          {
            "path": "src/",
            "purpose": "Main source code directory",
            "contents": ["algorithms/", "utils/", "data/", "tests/"]
          },
          {
            "path": "tests/",
            "purpose": "Test files",
            "contents": ["unit tests", "integration tests", "test data"]
          }
        ],
        "namingConventions": [
          {
            "type": "functions",
            "pattern": "snake_case",
            "examples": ["process_data", "calculate_metrics", "validate_input"]
          },
          {
            "type": "classes",
            "pattern": "PascalCase",
            "examples": ["AlgorithmProcessor", "DataValidator", "ResultGenerator"]
          }
        ],
        "codingStandards": [
          {
            "category": "Documentation",
            "rules": ["All public functions must have docstrings", "Use type hints for all parameters"],
            "examples": ["def process(data: np.ndarray) -> Dict[str, Any]:\\n    \\\"\\\"\\\"Process input data.\\\"\\\"\\\""]
          }
        ]
      },
      "contributionGuidelines": {
        "gettingStarted": [
          "Fork the repository on GitHub",
          "Clone your fork locally",
          "Install development dependencies",
          "Create a new branch for your feature"
        ],
        "developmentProcess": [
          "Write tests for new functionality",
          "Ensure all tests pass",
          "Follow coding standards",
          "Update documentation as needed",
          "Submit a pull request"
        ],
        "codeReview": [
          "All code must be reviewed before merging",
          "Tests must pass CI/CD pipeline",
          "Documentation must be updated",
          "Performance impact should be considered"
        ],
        "issueReporting": [
          "Use the issue template",
          "Provide clear reproduction steps",
          "Include system information",
          "Add relevant labels"
        ]
      },
      "testingGuide": {
        "overview": "Comprehensive testing strategy ensures code quality and reliability",
        "testTypes": [
          {
            "type": "unit",
            "purpose": "Test individual functions and classes",
            "location": "tests/unit/",
            "examples": ["test_algorithm.py", "test_data_processor.py"]
          },
          {
            "type": "integration",
            "purpose": "Test component interactions",
            "location": "tests/integration/",
            "examples": ["test_pipeline.py", "test_end_to_end.py"]
          }
        ],
        "runningTests": [
          "python -m pytest tests/",
          "python -m pytest tests/unit/",
          "python -m pytest --coverage"
        ],
        "writingTests": [
          "Use pytest framework",
          "Follow naming convention test_*.py",
          "Include both positive and negative test cases",
          "Mock external dependencies"
        ]
      }
    },
    "changelog": [
      {
        "version": "1.0.0",
        "date": "2024-01-01",
        "changes": [
          {
            "type": "added",
            "description": "Initial implementation of research algorithm"
          },
          {
            "type": "added",
            "description": "Comprehensive test suite"
          },
          {
            "type": "added",
            "description": "Documentation and user guides"
          }
        ]
      }
    ]
  },
  "confidence": 0.95,
  "documentationMetrics": {
    "completeness": 95,
    "readability": 90,
    "technicalAccuracy": 95,
    "exampleCoverage": 85
  },
  "generationNotes": [
    "Generated comprehensive README with usage examples",
    "Created detailed setup guide with troubleshooting",
    "Included developer documentation for contributors",
    "Added API documentation for all endpoints"
  ]
}

Guidelines:
- Write clear, concise, and actionable documentation
- Include practical examples and code snippets
- Provide troubleshooting information for common issues
- Ensure documentation matches the actual codebase structure
- Include proper installation and setup instructions
- Add developer guidelines for contributors
- Create comprehensive API documentation if applicable
- Use consistent formatting and structure throughout
- Include badges and visual elements where appropriate
- Ensure all examples are working and tested`;

		const codebaseText = JSON.stringify(
			{
				structure: codebase.structure,
				files: codebase.files.map((f) => ({
					path: f.path,
					type: f.type,
					language: f.language,
				})),
				buildInstructions: codebase.buildInstructions,
			},
			null,
			2
		);

		const architectureText = JSON.stringify(
			{
				projectStructure: architecture.projectStructure,
				modules: architecture.modules,
			},
			null,
			2
		);

		const content = paperContent
			? `Generated Codebase:\n${codebaseText}\n\nSystem Architecture:\n${architectureText}\n\nOriginal Paper Content (for context):\n${paperContent.substring(0, 1000)}...`
			: `Generated Codebase:\n${codebaseText}\n\nSystem Architecture:\n${architectureText}`;

		const messages = [
			{
				role: 'user' as const,
				content: `Please generate comprehensive documentation for this research implementation:\n\n${content}`,
			},
		];

		const response = await this.generateWithRetry(messages, systemPrompt);

		if (!response.success) {
			return {
				success: false,
				error: response.error,
				metadata: response.metadata,
			};
		}

		// Parse the JSON response
		const parseResult = this.parseJsonResponse<DocumentationGenerationResult>(response.data!);
		if (!parseResult.success) {
			return parseResult;
		}

		// Validate the response structure
		const validationResult = this.validateDocumentationGenerationResult(parseResult.data!);
		if (!validationResult.success) {
			return validationResult;
		}

		return {
			success: true,
			data: parseResult.data,
			metadata: response.metadata,
		};
	}

	/**
	 * Validate the documentation generation result
	 */
	private validateDocumentationGenerationResult(
		data: DocumentationGenerationResult
	): AgentResponse<DocumentationGenerationResult> {
		// Check if documentation object exists
		if (!data.documentation) {
			return {
				success: false,
				error: 'Missing documentation object in response',
			};
		}

		const doc = data.documentation;

		// Validate README
		if (!doc.readme) {
			return {
				success: false,
				error: 'Missing readme in documentation',
			};
		}

		const readmeValidation = this.validateReadmeContent(doc.readme);
		if (!readmeValidation.success) {
			return {
				success: false,
				error: `README validation failed: ${readmeValidation.error}`,
			};
		}

		// Validate setup guide
		if (!doc.setupGuide) {
			return {
				success: false,
				error: 'Missing setupGuide in documentation',
			};
		}

		const setupValidation = this.validateSetupGuide(doc.setupGuide);
		if (!setupValidation.success) {
			return {
				success: false,
				error: `Setup guide validation failed: ${setupValidation.error}`,
			};
		}

		// Validate user guide
		if (!doc.userGuide) {
			return {
				success: false,
				error: 'Missing userGuide in documentation',
			};
		}

		// Validate developer guide
		if (!doc.developerGuide) {
			return {
				success: false,
				error: 'Missing developerGuide in documentation',
			};
		}

		// Validate arrays
		if (!Array.isArray(doc.apiDocs)) {
			return {
				success: false,
				error: 'apiDocs must be an array',
			};
		}

		if (!Array.isArray(doc.changelog)) {
			return {
				success: false,
				error: 'changelog must be an array',
			};
		}

		// Validate confidence score
		if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
			return {
				success: false,
				error: 'Confidence score must be a number between 0 and 1',
			};
		}

		// Validate documentation metrics
		const metrics = data.documentationMetrics;
		if (!metrics) {
			return {
				success: false,
				error: 'Missing documentationMetrics in response',
			};
		}

		const requiredMetrics: (keyof DocumentationMetrics)[] = [
			'completeness',
			'readability',
			'technicalAccuracy',
			'exampleCoverage',
		];

		for (const metric of requiredMetrics) {
			const value = metrics[metric];
			if (typeof value !== 'number' || value < 0 || value > 100) {
				return {
					success: false,
					error: `Invalid ${metric} in documentationMetrics - must be a number between 0 and 100`,
				};
			}
		}

		// Validate generation notes
		if (!Array.isArray(data.generationNotes)) {
			return {
				success: false,
				error: 'generationNotes must be an array',
			};
		}

		return { success: true, data };
	}

	/**
	 * Validate README content structure
	 */
	private validateReadmeContent(readme: ReadmeContent): AgentResponse<ReadmeContent> {
		const requiredFields: (keyof ReadmeContent)[] = [
			'title',
			'description',
			'features',
			'installation',
			'usage',
			'contributing',
			'license',
		];

		for (const field of requiredFields) {
			if (!readme[field]) {
				return {
					success: false,
					error: `Missing required field '${field}' in readme`,
				};
			}
		}

		// Validate arrays
		const arrayFields: (keyof ReadmeContent)[] = [
			'features',
			'installation',
			'usage',
			'contributing',
		];

		for (const field of arrayFields) {
			if (!Array.isArray(readme[field])) {
				return {
					success: false,
					error: `Field '${field}' in readme must be an array`,
				};
			}
		}

		// Validate usage examples
		for (let i = 0; i < readme.usage.length; i++) {
			const usage = readme.usage[i];
			if (!usage || !usage.title || !usage.description || !usage.code || !usage.language) {
				return {
					success: false,
					error: `Usage example ${i}: missing required fields (title, description, code, language)`,
				};
			}
		}

		return { success: true, data: readme };
	}

	/**
	 * Validate setup guide structure
	 */
	private validateSetupGuide(setupGuide: SetupGuide): AgentResponse<SetupGuide> {
		const requiredFields: (keyof SetupGuide)[] = [
			'prerequisites',
			'installationSteps',
			'configuration',
			'verification',
		];

		for (const field of requiredFields) {
			if (!Array.isArray(setupGuide[field])) {
				return {
					success: false,
					error: `Field '${field}' in setupGuide must be an array`,
				};
			}
		}

		// Validate prerequisites
		for (let i = 0; i < setupGuide.prerequisites.length; i++) {
			const prereq = setupGuide.prerequisites[i];
			if (!prereq || !prereq.name || !prereq.description) {
				return {
					success: false,
					error: `Prerequisite ${i}: missing required fields (name, description)`,
				};
			}
		}

		// Validate installation steps
		for (let i = 0; i < setupGuide.installationSteps.length; i++) {
			const step = setupGuide.installationSteps[i];
			if (!step || !step.title || !step.description || typeof step.order !== 'number') {
				return {
					success: false,
					error: `Installation step ${i}: missing required fields (order, title, description)`,
				};
			}
		}

		return { success: true, data: setupGuide };
	}

	/**
	 * Generate documentation with fallback to simpler documentation
	 */
	async generateDocumentationWithFallback(
		codebase: GeneratedCodebase,
		architecture: SystemArchitecture,
		paperContent?: string
	): Promise<AgentResponse<DocumentationGenerationResult>> {
		// Try detailed documentation generation first
		const detailedResult = await this.generateDocumentation(codebase, architecture, paperContent);

		if (detailedResult.success) {
			return detailedResult;
		}

		// Fallback to simpler documentation generation
		const fallbackResult = await this.generateBasicDocumentation(codebase, architecture);

		if (fallbackResult.success) {
			return {
				...fallbackResult,
				// Note: Used fallback analysis
			};
		}

		return detailedResult; // Return original error if fallback also fails
	}

	/**
	 * Simplified documentation generation as fallback
	 */
	private async generateBasicDocumentation(
		codebase: GeneratedCodebase,
		architecture: SystemArchitecture
	): Promise<AgentResponse<DocumentationGenerationResult>> {
		const systemPrompt = `Generate basic but complete documentation. Return minimal but functional JSON structure with all required fields.`;

		const messages = [
			{
				role: 'user' as const,
				content: `Generate basic documentation for: ${JSON.stringify({ structure: codebase.structure, modules: architecture.modules })}`,
			},
		];

		const response = await this.generateWithRetry(messages, systemPrompt);

		if (!response.success) {
			return {
				success: false,
				error: response.error,
				metadata: response.metadata,
			};
		}

		const parseResult = this.parseJsonResponse<DocumentationGenerationResult>(response.data!);
		return parseResult;
	}
}
