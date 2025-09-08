import type {
	AlgorithmSpecs,
	BuildInstructions,
	CodeGenerationResult,
	CompletenessReport,
	GeneratedCodebase,
	GeneratedFile,
	QualityMetrics,
	SystemArchitecture,
	TestFile,
} from "~/types/ai";
import { type AIConfig, type AgentResponse, BaseAIAgent } from "../base-agent";

export class CodeGeneratorAgent extends BaseAIAgent {
	constructor(config: AIConfig) {
		super(config);
	}

	/**
	 * Generate complete executable code based on architecture and algorithm specifications
	 */
	async generateCode(
		architecture: SystemArchitecture,
		algorithmSpecs: AlgorithmSpecs,
		paperContent?: string,
	): Promise<AgentResponse<CodeGenerationResult>> {
		const systemPrompt = `You are an expert software developer specializing in implementing research algorithms. Your task is to generate complete, executable, production-ready code based on the system architecture and algorithm specifications.

CRITICAL REQUIREMENTS:
- Generate COMPLETE, EXECUTABLE code with NO TODOs, placeholders, or incomplete implementations
- All functions must be fully implemented with proper logic
- Include comprehensive error handling and input validation
- Generate working unit tests for all major components
- Ensure all imports and dependencies are correctly specified
- Code must be ready to run immediately after setup

Return a JSON response with this exact structure:
{
  "codebase": {
    "files": [
      {
        "path": "main.py",
        "content": "# Complete Python code here\\nimport numpy as np\\n\\ndef main():\\n    # Full implementation\\n    pass\\n\\nif __name__ == '__main__':\\n    main()",
        "type": "source",
        "language": "python",
        "dependencies": ["numpy", "pandas"],
        "exports": ["main", "AlgorithmClass"]
      }
    ],
    "structure": {
      "rootDirectory": "research_implementation",
      "directories": [
        {
          "path": "src/",
          "purpose": "Source code directory"
        }
      ],
      "files": [
        {
          "path": "main.py",
          "type": "source",
          "purpose": "Main entry point"
        }
      ],
      "configFiles": [
        {
          "path": "requirements.txt",
          "type": "dependencies",
          "purpose": "Python dependencies",
          "content": {
            "dependencies": ["numpy>=1.21.0", "pandas>=1.3.0"]
          }
        }
      ]
    },
    "documentation": {
      "readme": {
        "title": "Research Implementation",
        "description": "Implementation of research paper algorithms",
        "features": ["Algorithm implementation", "Data processing"],
        "installation": ["pip install -r requirements.txt"],
        "usage": [
          {
            "title": "Basic Usage",
            "description": "How to run the algorithm",
            "code": "python main.py",
            "language": "bash"
          }
        ],
        "contributing": ["Fork the repository", "Create feature branch"],
        "license": "MIT"
      },
      "apiDocs": [],
      "setupGuide": {
        "prerequisites": [
          {
            "name": "Python",
            "version": "3.8+",
            "description": "Python programming language"
          }
        ],
        "installationSteps": [
          {
            "order": 1,
            "title": "Install dependencies",
            "description": "Install required Python packages",
            "commands": ["pip install -r requirements.txt"]
          }
        ],
        "configuration": [],
        "verification": [
          {
            "order": 1,
            "title": "Test installation",
            "description": "Verify the installation works",
            "commands": ["python -c 'import numpy; print(\"Success\")'"],
            "expectedOutput": "Success"
          }
        ]
      },
      "userGuide": {
        "sections": [
          {
            "title": "Getting Started",
            "content": "This guide helps you get started with the implementation"
          }
        ],
        "troubleshooting": [],
        "faq": []
      },
      "developerGuide": {
        "architecture": {
          "description": "System architecture overview",
          "components": [
            {
              "name": "Algorithm Module",
              "purpose": "Core algorithm implementation",
              "responsibilities": ["Data processing", "Algorithm execution"],
              "interfaces": ["AlgorithmInterface"]
            }
          ],
          "dataFlow": "Input -> Processing -> Output",
          "designPatterns": ["Strategy Pattern", "Factory Pattern"]
        },
        "codeStructure": {
          "overview": "Code is organized in modular structure",
          "directories": [
            {
              "path": "src/",
              "purpose": "Main source code",
              "contents": ["algorithms", "utilities", "tests"]
            }
          ],
          "namingConventions": [
            {
              "type": "functions",
              "pattern": "snake_case",
              "examples": ["process_data", "calculate_metrics"]
            }
          ],
          "codingStandards": [
            {
              "category": "Documentation",
              "rules": ["All functions must have docstrings"],
              "examples": ["def func():\\n    \\\"\\\"\\\"Function description\\\"\\\"\\\""]
            }
          ]
        },
        "contributionGuidelines": {
          "gettingStarted": ["Clone repository", "Install dependencies"],
          "developmentProcess": ["Create branch", "Write tests", "Submit PR"],
          "codeReview": ["All code must be reviewed", "Tests must pass"],
          "issueReporting": ["Use issue templates", "Provide reproduction steps"]
        },
        "testingGuide": {
          "overview": "Comprehensive testing strategy",
          "testTypes": [
            {
              "type": "unit",
              "purpose": "Test individual functions",
              "location": "tests/unit/",
              "examples": ["test_algorithm.py"]
            }
          ],
          "runningTests": ["python -m pytest"],
          "writingTests": ["Use pytest framework", "Follow naming conventions"]
        }
      },
      "changelog": []
    },
    "tests": [
      {
        "path": "tests/test_main.py",
        "content": "import pytest\\nimport numpy as np\\nfrom src.main import main\\n\\ndef test_main():\\n    # Complete test implementation\\n    result = main()\\n    assert result is not None",
        "testType": "unit",
        "targetFile": "main.py",
        "coverage": ["main function", "algorithm class"]
      }
    ],
    "buildInstructions": {
      "installCommands": ["pip install -r requirements.txt"],
      "buildCommands": ["python setup.py build"],
      "testCommands": ["python -m pytest"],
      "runCommands": ["python main.py"],
      "environmentSetup": [
        {
          "variable": "PYTHONPATH",
          "description": "Python path for imports",
          "required": false,
          "defaultValue": "."
        }
      ]
    }
  },
  "confidence": 0.95,
  "generationNotes": [
    "Implemented all core algorithms",
    "Added comprehensive error handling",
    "Generated complete test suite"
  ],
  "qualityMetrics": {
    "codeComplexity": "medium",
    "testCoverage": 85,
    "documentationCoverage": 90,
    "codeQualityScore": 8.5
  },
  "completeness": {
    "implementedFeatures": ["Algorithm implementation", "Data processing"],
    "missingFeatures": [],
    "todoItems": 0,
    "placeholderCount": 0
  }
}

Guidelines:
- Generate COMPLETE implementations - no TODOs, no placeholders, no "pass" statements
- All algorithms must be fully implemented with proper mathematical logic
- Include comprehensive error handling and input validation
- Generate working unit tests that actually test the functionality
- Ensure all imports are available and correctly specified
- Code must be executable immediately after dependency installation
- Follow the programming language's best practices and conventions
- Include proper documentation and comments
- Generate realistic build and deployment instructions
- Ensure high code quality with proper structure and organization`;

		const architectureText = JSON.stringify(architecture, null, 2);
		const specsText = JSON.stringify(algorithmSpecs, null, 2);
		const content = paperContent
			? `System Architecture:\n${architectureText}\n\nAlgorithm Specifications:\n${specsText}\n\nOriginal Paper Content (for reference):\n${paperContent.substring(0, 1500)}...`
			: `System Architecture:\n${architectureText}\n\nAlgorithm Specifications:\n${specsText}`;

		const messages = [
			{
				role: "user" as const,
				content: `Please generate complete, executable code for this research implementation:\n\n${content}`,
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
		const parseResult = this.parseJsonResponse<CodeGenerationResult>(
			response.data!,
		);
		if (!parseResult.success) {
			return parseResult;
		}

		// Validate the response structure
		const validationResult = this.validateCodeGenerationResult(
			parseResult.data!,
		);
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
	 * Validate the code generation result
	 */
	private validateCodeGenerationResult(
		data: CodeGenerationResult,
	): AgentResponse<CodeGenerationResult> {
		// Check if codebase object exists
		if (!data.codebase) {
			return {
				success: false,
				error: "Missing codebase object in response",
			};
		}

		// Validate files array
		if (!Array.isArray(data.codebase.files)) {
			return {
				success: false,
				error: "codebase.files must be an array",
			};
		}

		if (data.codebase.files.length === 0) {
			return {
				success: false,
				error: "codebase.files cannot be empty",
			};
		}

		// Validate each file
		for (let i = 0; i < data.codebase.files.length; i++) {
			const file = data.codebase.files[i];
			if (!file) {
				return {
					success: false,
					error: `File ${i} is undefined`,
				};
			}
			const fileValidation = this.validateGeneratedFile(file, i);
			if (!fileValidation.success) {
				return {
					success: false,
					error: fileValidation.error || `File ${i} validation failed`,
				};
			}
		}

		// Validate structure
		if (!data.codebase.structure) {
			return {
				success: false,
				error: "Missing structure in codebase",
			};
		}

		// Validate tests array
		if (!Array.isArray(data.codebase.tests)) {
			return {
				success: false,
				error: "codebase.tests must be an array",
			};
		}

		// Validate build instructions
		if (!data.codebase.buildInstructions) {
			return {
				success: false,
				error: "Missing buildInstructions in codebase",
			};
		}

		const buildInstructions = data.codebase.buildInstructions;
		const requiredBuildFields = [
			"installCommands",
			"buildCommands",
			"testCommands",
			"runCommands",
		];

		for (const field of requiredBuildFields) {
			if (!Array.isArray(buildInstructions[field as keyof BuildInstructions])) {
				return {
					success: false,
					error: `buildInstructions.${field} must be an array`,
				};
			}
		}

		// Validate confidence score
		if (
			typeof data.confidence !== "number" ||
			data.confidence < 0 ||
			data.confidence > 1
		) {
			return {
				success: false,
				error: "Confidence score must be a number between 0 and 1",
			};
		}

		// Validate quality metrics
		const qualityMetrics = data.qualityMetrics;
		if (!qualityMetrics) {
			return {
				success: false,
				error: "Missing qualityMetrics in response",
			};
		}

		const validComplexity = ["low", "medium", "high"];
		if (!validComplexity.includes(qualityMetrics.codeComplexity)) {
			return {
				success: false,
				error: "Invalid codeComplexity in qualityMetrics",
			};
		}

		// Validate completeness report
		const completeness = data.completeness;
		if (!completeness) {
			return {
				success: false,
				error: "Missing completeness report in response",
			};
		}

		const requiredCompletenessFields: (keyof CompletenessReport)[] = [
			"implementedFeatures",
			"missingFeatures",
			"todoItems",
			"placeholderCount",
		];

		for (const field of requiredCompletenessFields) {
			if (completeness[field] === undefined || completeness[field] === null) {
				return {
					success: false,
					error: `Missing required field '${field}' in completeness report`,
				};
			}
		}

		// Validate that there are no TODOs or placeholders
		if (completeness.todoItems > 0) {
			return {
				success: false,
				error: `Code contains ${completeness.todoItems} TODO items - all code must be complete`,
			};
		}

		if (completeness.placeholderCount > 0) {
			return {
				success: false,
				error: `Code contains ${completeness.placeholderCount} placeholders - all code must be complete`,
			};
		}

		return { success: true, data };
	}

	/**
	 * Validate individual generated file
	 */
	private validateGeneratedFile(
		file: GeneratedFile,
		index: number,
	): AgentResponse<GeneratedFile> {
		const requiredFields: (keyof GeneratedFile)[] = [
			"path",
			"content",
			"type",
			"language",
			"dependencies",
		];

		for (const field of requiredFields) {
			if (file[field] === undefined || file[field] === null) {
				return {
					success: false,
					error: `File ${index}: missing required field '${field}'`,
				};
			}
		}

		// Validate file type
		const validTypes = ["source", "config", "documentation", "test"];
		if (!validTypes.includes(file.type)) {
			return {
				success: false,
				error: `File ${index}: invalid type '${file.type}'`,
			};
		}

		// Validate content is not empty
		if (typeof file.content !== "string" || file.content.trim() === "") {
			return {
				success: false,
				error: `File ${index}: content cannot be empty`,
			};
		}

		// Check for TODOs and placeholders in content
		const content = file.content.toLowerCase();
		if (content.includes("todo") || content.includes("fixme")) {
			return {
				success: false,
				error: `File ${index}: contains TODO or FIXME - all code must be complete`,
			};
		}

		if (
			content.includes("placeholder") ||
			content.includes("not implemented")
		) {
			return {
				success: false,
				error: `File ${index}: contains placeholders - all code must be complete`,
			};
		}

		// Validate dependencies array
		if (!Array.isArray(file.dependencies)) {
			return {
				success: false,
				error: `File ${index}: dependencies must be an array`,
			};
		}

		return { success: true, data: file };
	}

	/**
	 * Generate code with fallback to simpler implementation
	 */
	async generateCodeWithFallback(
		architecture: SystemArchitecture,
		algorithmSpecs: AlgorithmSpecs,
		paperContent?: string,
	): Promise<AgentResponse<CodeGenerationResult>> {
		// Try detailed code generation first
		const detailedResult = await this.generateCode(
			architecture,
			algorithmSpecs,
			paperContent,
		);

		if (detailedResult.success) {
			return detailedResult;
		}

		// Fallback to simpler code generation
		const fallbackResult = await this.generateBasicCode(
			architecture,
			algorithmSpecs,
		);

		if (fallbackResult.success) {
			return {
				...fallbackResult,
				// Note: Used fallback analysis
			};
		}

		return detailedResult; // Return original error if fallback also fails
	}

	/**
	 * Simplified code generation as fallback
	 */
	private async generateBasicCode(
		architecture: SystemArchitecture,
		algorithmSpecs: AlgorithmSpecs,
	): Promise<AgentResponse<CodeGenerationResult>> {
		const systemPrompt = `Generate basic but complete code implementation. Ensure no TODOs or placeholders. Return minimal but functional JSON structure.`;

		const messages = [
			{
				role: "user" as const,
				content: `Generate basic complete code for: ${JSON.stringify({ architecture: architecture.projectStructure, algorithms: algorithmSpecs.algorithms })}`,
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

		const parseResult = this.parseJsonResponse<CodeGenerationResult>(
			response.data!,
		);
		return parseResult;
	}
}
