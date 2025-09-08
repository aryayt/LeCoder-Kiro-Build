import type {
	AlgorithmSpecs,
	ArchitecturePlanningResult,
	DesignDecision,
	ResearchConcepts,
	RiskAssessment,
	SystemArchitecture,
} from "~/types/ai";
import { type AIConfig, type AgentResponse, BaseAIAgent } from "../base-agent";

export class ArchitecturePlannerAgent extends BaseAIAgent {
	constructor(config: AIConfig) {
		super(config);
	}

	/**
	 * Plan system architecture based on research concepts and algorithm specifications
	 */
	async planArchitecture(
		concepts: ResearchConcepts,
		algorithmSpecs: AlgorithmSpecs,
		paperContent?: string,
	): Promise<AgentResponse<ArchitecturePlanningResult>> {
		const systemPrompt = `You are an expert software architect specializing in research-to-code implementations. Your task is to design a comprehensive system architecture based on research concepts and algorithm specifications.

Design a complete, production-ready architecture that can implement the research paper's algorithms and requirements.

Return a JSON response with this exact structure:
{
  "architecture": {
    "projectStructure": {
      "rootDirectory": "project_name",
      "directories": [
        {
          "path": "src/",
          "purpose": "Main source code",
          "subdirectories": [
            {
              "path": "src/algorithms/",
              "purpose": "Algorithm implementations"
            }
          ]
        }
      ],
      "files": [
        {
          "path": "main.py",
          "type": "source",
          "purpose": "Main entry point",
          "dependencies": ["algorithm_module"]
        }
      ],
      "configFiles": [
        {
          "path": "requirements.txt",
          "type": "dependencies",
          "purpose": "Python dependencies"
        }
      ]
    },
    "modules": [
      {
        "name": "AlgorithmModule",
        "path": "src/algorithms/",
        "purpose": "Core algorithm implementations",
        "exports": ["AlgorithmClass", "utility_function"],
        "imports": ["numpy", "pandas"],
        "functions": [
          {
            "name": "process_data",
            "purpose": "Process input data",
            "parameters": [
              {
                "name": "data",
                "type": "numpy.ndarray",
                "required": true,
                "description": "Input data array"
              }
            ],
            "returnType": "numpy.ndarray",
            "complexity": "medium"
          }
        ],
        "classes": [
          {
            "name": "AlgorithmImplementation",
            "purpose": "Main algorithm class",
            "methods": [
              {
                "name": "fit",
                "purpose": "Train the algorithm",
                "parameters": [
                  {
                    "name": "X",
                    "type": "numpy.ndarray",
                    "required": true,
                    "description": "Training data"
                  }
                ],
                "returnType": "self",
                "complexity": "high"
              }
            ],
            "properties": [
              {
                "name": "model_params",
                "type": "dict",
                "visibility": "private",
                "description": "Model parameters"
              }
            ]
          }
        ]
      }
    ],
    "dataFlow": [
      {
        "from": "input_module",
        "to": "preprocessing_module",
        "dataType": "raw_data",
        "description": "Raw data flow to preprocessing"
      }
    ],
    "apiEndpoints": [
      {
        "path": "/api/process",
        "method": "POST",
        "purpose": "Process data through algorithm",
        "parameters": [
          {
            "name": "data",
            "type": "array",
            "required": true,
            "description": "Input data to process"
          }
        ],
        "responseType": "ProcessingResult"
      }
    ],
    "databaseSchema": [
      {
        "tableName": "experiments",
        "columns": [
          {
            "name": "id",
            "type": "INTEGER",
            "nullable": false,
            "primaryKey": true,
            "description": "Unique experiment ID"
          }
        ],
        "relationships": [],
        "indexes": [
          {
            "name": "idx_experiment_date",
            "columns": ["created_at"],
            "unique": false
          }
        ]
      }
    ],
    "deploymentStrategy": {
      "platform": "Docker + Cloud",
      "environment": "production",
      "requirements": ["Docker", "Python 3.8+"],
      "steps": [
        {
          "order": 1,
          "description": "Build Docker image",
          "command": "docker build -t research-app .",
          "notes": "Ensure all dependencies are included"
        }
      ]
    }
  },
  "confidence": 0.95,
  "designDecisions": [
    {
      "decision": "Use modular architecture",
      "rationale": "Enables easy testing and maintenance",
      "alternatives": ["Monolithic design", "Microservices"],
      "tradeoffs": ["Complexity vs maintainability"]
    }
  ],
  "implementationStrategy": "Start with core algorithms, then build API layer, finally add UI components",
  "riskAssessment": [
    {
      "risk": "Algorithm complexity",
      "impact": "high",
      "probability": "medium",
      "mitigation": ["Incremental implementation", "Extensive testing"]
    }
  ]
}

Guidelines:
- Design for the specific programming language identified in algorithm specs
- Create a modular, maintainable architecture
- Include proper separation of concerns
- Plan for testing, deployment, and scalability
- Consider the complexity of algorithms when designing modules
- Include database schema if data persistence is needed
- Design API endpoints if the system needs external interfaces
- Provide realistic deployment strategies
- Identify potential risks and mitigation strategies
- Make design decisions based on research requirements and algorithm complexity`;

		const conceptsText = JSON.stringify(concepts, null, 2);
		const specsText = JSON.stringify(algorithmSpecs, null, 2);
		const content = paperContent
			? `Research Concepts:\n${conceptsText}\n\nAlgorithm Specifications:\n${specsText}\n\nOriginal Paper Content (for reference):\n${paperContent.substring(0, 2000)}...`
			: `Research Concepts:\n${conceptsText}\n\nAlgorithm Specifications:\n${specsText}`;

		const messages = [
			{
				role: "user" as const,
				content: `Please design a comprehensive system architecture for implementing this research:\n\n${content}`,
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
		const parseResult = this.parseJsonResponse<ArchitecturePlanningResult>(
			response.data!,
		);
		if (!parseResult.success) {
			return parseResult;
		}

		// Validate the response structure
		const validationResult = this.validateArchitecturePlanningResult(
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
	 * Validate the architecture planning result
	 */
	private validateArchitecturePlanningResult(
		data: ArchitecturePlanningResult,
	): AgentResponse<ArchitecturePlanningResult> {
		// Check if architecture object exists
		if (!data.architecture) {
			return {
				success: false,
				error: "Missing architecture object in response",
			};
		}

		// Validate project structure
		const projectStructure = data.architecture.projectStructure;
		if (!projectStructure) {
			return {
				success: false,
				error: "Missing projectStructure in architecture",
			};
		}

		// Validate required fields in project structure
		const requiredStructureFields = ["rootDirectory", "directories", "files"];
		for (const field of requiredStructureFields) {
			if (!projectStructure[field as keyof typeof projectStructure]) {
				return {
					success: false,
					error: `Missing required field '${field}' in projectStructure`,
				};
			}
		}

		// Validate arrays
		const arrayFields = ["directories", "files", "configFiles"];
		for (const field of arrayFields) {
			const value = projectStructure[field as keyof typeof projectStructure];
			if (value && !Array.isArray(value)) {
				return {
					success: false,
					error: `Field '${field}' in projectStructure must be an array`,
				};
			}
		}

		// Validate modules array
		if (!Array.isArray(data.architecture.modules)) {
			return {
				success: false,
				error: "modules must be an array",
			};
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

		// Validate design decisions array
		if (!Array.isArray(data.designDecisions)) {
			return {
				success: false,
				error: "designDecisions must be an array",
			};
		}

		// Validate each design decision
		for (let i = 0; i < data.designDecisions.length; i++) {
			const decision = data.designDecisions[i];
			if (!decision) {
				return {
					success: false,
					error: `Design decision ${i} is undefined`,
				};
			}

			const requiredDecisionFields: (keyof DesignDecision)[] = [
				"decision",
				"rationale",
				"alternatives",
				"tradeoffs",
			];

			for (const field of requiredDecisionFields) {
				if (!decision[field]) {
					return {
						success: false,
						error: `Design decision ${i}: missing required field '${field}'`,
					};
				}
			}

			// Validate arrays in design decision
			if (!Array.isArray(decision.alternatives)) {
				return {
					success: false,
					error: `Design decision ${i}: alternatives must be an array`,
				};
			}

			if (!Array.isArray(decision.tradeoffs)) {
				return {
					success: false,
					error: `Design decision ${i}: tradeoffs must be an array`,
				};
			}
		}

		// Validate risk assessment array
		if (!Array.isArray(data.riskAssessment)) {
			return {
				success: false,
				error: "riskAssessment must be an array",
			};
		}

		// Validate each risk assessment
		for (let i = 0; i < data.riskAssessment.length; i++) {
			const risk = data.riskAssessment[i];
			if (!risk) {
				return {
					success: false,
					error: `Risk assessment ${i} is undefined`,
				};
			}

			const requiredRiskFields: (keyof RiskAssessment)[] = [
				"risk",
				"impact",
				"probability",
				"mitigation",
			];

			for (const field of requiredRiskFields) {
				if (!risk[field]) {
					return {
						success: false,
						error: `Risk assessment ${i}: missing required field '${field}'`,
					};
				}
			}

			// Validate impact and probability levels
			const validLevels = ["low", "medium", "high"];
			if (!validLevels.includes(risk.impact)) {
				return {
					success: false,
					error: `Risk assessment ${i}: invalid impact level '${risk.impact}'`,
				};
			}

			if (!validLevels.includes(risk.probability)) {
				return {
					success: false,
					error: `Risk assessment ${i}: invalid probability level '${risk.probability}'`,
				};
			}

			if (!Array.isArray(risk.mitigation)) {
				return {
					success: false,
					error: `Risk assessment ${i}: mitigation must be an array`,
				};
			}
		}

		// Validate implementation strategy
		if (
			typeof data.implementationStrategy !== "string" ||
			data.implementationStrategy.trim() === ""
		) {
			return {
				success: false,
				error: "implementationStrategy must be a non-empty string",
			};
		}

		return { success: true, data };
	}

	/**
	 * Plan architecture with fallback to simpler planning
	 */
	async planArchitectureWithFallback(
		concepts: ResearchConcepts,
		algorithmSpecs: AlgorithmSpecs,
		paperContent?: string,
	): Promise<AgentResponse<ArchitecturePlanningResult>> {
		// Try detailed planning first
		const detailedResult = await this.planArchitecture(
			concepts,
			algorithmSpecs,
			paperContent,
		);

		if (detailedResult.success) {
			return detailedResult;
		}

		// Fallback to simpler planning
		const fallbackResult = await this.planBasicArchitecture(
			concepts,
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
	 * Simplified architecture planning as fallback
	 */
	private async planBasicArchitecture(
		concepts: ResearchConcepts,
		algorithmSpecs: AlgorithmSpecs,
	): Promise<AgentResponse<ArchitecturePlanningResult>> {
		const systemPrompt = `Create a basic system architecture. Return minimal JSON structure with essential components only.`;

		const messages = [
			{
				role: "user" as const,
				content: `Create basic architecture for: ${JSON.stringify({ concepts, algorithmSpecs })}`,
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

		const parseResult = this.parseJsonResponse<ArchitecturePlanningResult>(
			response.data!,
		);
		return parseResult;
	}
}
