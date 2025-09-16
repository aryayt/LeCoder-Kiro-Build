import type {
	Algorithm,
	AlgorithmAnalysisResult,
	ResearchConcepts,
	SystemRequirements,
} from '~/types/ai';
import { type AIConfig, type AgentResponse, BaseAIAgent } from '../base-agent';

export class AlgorithmAnalyzerAgent extends BaseAIAgent {
	constructor(config: AIConfig) {
		super(config);
	}

	/**
	 * Analyze algorithms and technical requirements from research concepts
	 */
	async analyzeAlgorithms(
		concepts: ResearchConcepts,
		paperContent?: string
	): Promise<AgentResponse<AlgorithmAnalysisResult>> {
		const systemPrompt = `You are an expert software architect and algorithm analyst. Your task is to analyze research concepts and determine detailed algorithm specifications and technical requirements for implementation.

Given the research concepts, analyze the algorithms and provide a comprehensive technical specification.

Return a JSON response with this exact structure:
{
  "specs": {
    "algorithms": [
      {
        "name": "Algorithm Name",
        "description": "Detailed description",
        "type": "machine_learning|optimization|data_processing|statistical|other",
        "complexity": "low|medium|high",
        "inputs": [
          {
            "name": "input_name",
            "type": "data_type",
            "description": "description",
            "required": true,
            "format": "format_specification"
          }
        ],
        "outputs": [
          {
            "name": "output_name",
            "type": "data_type", 
            "description": "description",
            "format": "format_specification"
          }
        ],
        "parameters": [
          {
            "name": "param_name",
            "type": "data_type",
            "description": "description",
            "defaultValue": "default",
            "range": {"min": 0, "max": 1}
          }
        ],
        "dependencies": ["library1", "library2"],
        "pseudocode": "Step-by-step algorithm description",
        "mathematicalFormulation": "Mathematical equations if applicable"
      }
    ],
    "systemRequirements": {
      "programmingLanguage": "Python|JavaScript|R|etc",
      "frameworks": ["framework1", "framework2"],
      "libraries": ["library1", "library2"],
      "minimumHardware": {
        "cpu": "CPU requirements",
        "memory": "RAM requirements",
        "storage": "Storage requirements",
        "gpu": "GPU requirements if needed"
      },
      "operatingSystem": ["Windows", "macOS", "Linux"],
      "pythonVersion": "3.8+",
      "nodeVersion": "18+"
    },
    "implementationComplexity": "low|medium|high",
    "estimatedDevelopmentTime": "time estimate"
  },
  "confidence": 0.95,
  "implementationNotes": ["note1", "note2"],
  "potentialChallenges": ["challenge1", "challenge2"],
  "recommendedApproach": "Recommended implementation strategy"
}

Guidelines:
- Analyze each algorithm mentioned in the concepts thoroughly
- Provide realistic system requirements based on the algorithms
- Consider scalability and performance requirements
- Include specific version requirements for languages/frameworks
- Estimate complexity based on algorithm sophistication and implementation requirements
- Provide actionable implementation notes and identify potential challenges`;

		const conceptsText = JSON.stringify(concepts, null, 2);
		const content = paperContent
			? `Research Concepts:\n${conceptsText}\n\nOriginal Paper Content (for reference):\n${paperContent.substring(0, 3000)}...`
			: `Research Concepts:\n${conceptsText}`;

		const messages = [
			{
				role: 'user' as const,
				content: `Please analyze these research concepts and provide detailed algorithm specifications:\n\n${content}`,
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
		const parseResult = this.parseJsonResponse<AlgorithmAnalysisResult>(response.data!);
		if (!parseResult.success) {
			return parseResult;
		}

		// Validate the response structure
		const validationResult = this.validateAlgorithmAnalysisResult(parseResult.data!);
		if (!validationResult.success) {
			return {
				success: false,
				error: validationResult.error,
			};
		}

		return {
			success: true,
			data: parseResult.data,
			metadata: response.metadata,
		};
	}

	/**
	 * Validate the algorithm analysis result
	 */
	private validateAlgorithmAnalysisResult(
		data: AlgorithmAnalysisResult
	): AgentResponse<AlgorithmAnalysisResult> {
		// Check if specs object exists
		if (!data.specs) {
			return {
				success: false,
				error: 'Missing specs object in response',
			};
		}

		// Validate algorithms array
		if (!Array.isArray(data.specs.algorithms)) {
			return {
				success: false,
				error: 'algorithms must be an array',
			};
		}

		// Validate each algorithm
		for (let i = 0; i < data.specs.algorithms.length; i++) {
			const algorithm = data.specs.algorithms[i];
			if (!algorithm) {
				return {
					success: false,
					error: `Algorithm ${i} is undefined`,
				};
			}
			const algorithmValidation = this.validateAlgorithm(algorithm, i);
			if (!algorithmValidation.success) {
				return {
					success: false,
					error: algorithmValidation.error || `Algorithm ${i} validation failed`,
				};
			}
		}

		// Validate system requirements
		const sysReqValidation = this.validateSystemRequirements(data.specs.systemRequirements);
		if (!sysReqValidation.success) {
			return {
				success: false,
				error: sysReqValidation.error,
			};
		}

		// Validate complexity level
		const validComplexity = ['low', 'medium', 'high'];
		if (!validComplexity.includes(data.specs.implementationComplexity)) {
			return {
				success: false,
				error: 'implementationComplexity must be low, medium, or high',
			};
		}

		// Validate confidence score
		if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
			return {
				success: false,
				error: 'Confidence score must be a number between 0 and 1',
			};
		}

		// Validate arrays
		if (!Array.isArray(data.implementationNotes)) {
			return {
				success: false,
				error: 'implementationNotes must be an array',
			};
		}

		if (!Array.isArray(data.potentialChallenges)) {
			return {
				success: false,
				error: 'potentialChallenges must be an array',
			};
		}

		return { success: true, data };
	}

	/**
	 * Validate individual algorithm structure
	 */
	private validateAlgorithm(algorithm: Algorithm, index: number): AgentResponse<Algorithm> {
		const requiredFields: (keyof Algorithm)[] = [
			'name',
			'description',
			'type',
			'complexity',
			'inputs',
			'outputs',
			'parameters',
			'dependencies',
		];

		for (const field of requiredFields) {
			if (algorithm[field] === undefined || algorithm[field] === null) {
				return {
					success: false,
					error: `Algorithm ${index}: missing required field '${field}'`,
				};
			}
		}

		// Validate algorithm type
		const validTypes = [
			'machine_learning',
			'optimization',
			'data_processing',
			'statistical',
			'other',
		];
		if (!validTypes.includes(algorithm.type)) {
			return {
				success: false,
				error: `Algorithm ${index}: invalid type '${algorithm.type}'`,
			};
		}

		// Validate complexity
		const validComplexity = ['low', 'medium', 'high'];
		if (!validComplexity.includes(algorithm.complexity)) {
			return {
				success: false,
				error: `Algorithm ${index}: invalid complexity '${algorithm.complexity}'`,
			};
		}

		// Validate arrays
		const arrayFields: (keyof Algorithm)[] = ['inputs', 'outputs', 'parameters', 'dependencies'];
		for (const field of arrayFields) {
			if (!Array.isArray(algorithm[field])) {
				return {
					success: false,
					error: `Algorithm ${index}: ${field} must be an array`,
				};
			}
		}

		return { success: true, data: algorithm };
	}

	/**
	 * Validate system requirements structure
	 */
	private validateSystemRequirements(
		sysReq: SystemRequirements
	): AgentResponse<SystemRequirements> {
		const requiredFields: (keyof SystemRequirements)[] = [
			'programmingLanguage',
			'frameworks',
			'libraries',
			'minimumHardware',
			'operatingSystem',
		];

		for (const field of requiredFields) {
			if (sysReq[field] === undefined || sysReq[field] === null) {
				return {
					success: false,
					error: `SystemRequirements: missing required field '${field}'`,
				};
			}
		}

		// Validate arrays
		const arrayFields: (keyof SystemRequirements)[] = [
			'frameworks',
			'libraries',
			'operatingSystem',
		];
		for (const field of arrayFields) {
			if (!Array.isArray(sysReq[field])) {
				return {
					success: false,
					error: `SystemRequirements: ${field} must be an array`,
				};
			}
		}

		// Validate minimumHardware structure
		if (!sysReq.minimumHardware || typeof sysReq.minimumHardware !== 'object') {
			return {
				success: false,
				error: 'SystemRequirements: minimumHardware must be an object',
			};
		}

		const requiredHardwareFields = ['cpu', 'memory', 'storage'];
		for (const field of requiredHardwareFields) {
			if (!sysReq.minimumHardware[field as keyof typeof sysReq.minimumHardware]) {
				return {
					success: false,
					error: `SystemRequirements: minimumHardware missing required field '${field}'`,
				};
			}
		}

		return { success: true, data: sysReq };
	}

	/**
	 * Analyze algorithms with fallback to simpler analysis
	 */
	async analyzeAlgorithmsWithFallback(
		concepts: ResearchConcepts,
		paperContent?: string
	): Promise<AgentResponse<AlgorithmAnalysisResult>> {
		// Try detailed analysis first
		const detailedResult = await this.analyzeAlgorithms(concepts, paperContent);

		if (detailedResult.success) {
			return detailedResult;
		}

		// Fallback to simpler analysis
		const fallbackResult = await this.analyzeBasicAlgorithms(concepts);

		if (fallbackResult.success) {
			return {
				...fallbackResult,
				// Note: Used fallback analysis
			};
		}

		return detailedResult; // Return original error if fallback also fails
	}

	/**
	 * Simplified algorithm analysis as fallback
	 */
	private async analyzeBasicAlgorithms(
		concepts: ResearchConcepts
	): Promise<AgentResponse<AlgorithmAnalysisResult>> {
		const systemPrompt = `Provide a basic algorithm analysis. Return JSON with minimal required structure for algorithms and system requirements.`;

		const messages = [
			{
				role: 'user' as const,
				content: `Analyze algorithms from: ${JSON.stringify(concepts)}`,
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

		const parseResult = this.parseJsonResponse<AlgorithmAnalysisResult>(response.data!);
		return parseResult;
	}
}
