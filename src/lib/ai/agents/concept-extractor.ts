import type { ConceptExtractionResult, ResearchConcepts } from "~/types/ai";
import { type AIConfig, type AgentResponse, BaseAIAgent } from "../base-agent";

export class ConceptExtractorAgent extends BaseAIAgent {
	constructor(config: AIConfig) {
		super(config);
	}

	/**
	 * Extract research concepts from academic paper content
	 */
	async extractConcepts(
		paperContent: string,
	): Promise<AgentResponse<ConceptExtractionResult>> {
		const systemPrompt = `You are an expert research analyst specializing in extracting key concepts from academic papers. 
Your task is to analyze the provided research paper and extract structured information about its core concepts, methods, and technical requirements.

Please analyze the paper and return a JSON response with the following structure:
{
  "concepts": {
    "mainObjective": "The primary research objective or goal",
    "keyMethods": ["List of key methodologies used"],
    "algorithms": ["List of algorithms mentioned or used"],
    "datasets": ["List of datasets used or referenced"],
    "evaluationMetrics": ["List of evaluation metrics used"],
    "technicalRequirements": ["List of technical requirements for implementation"],
    "dependencies": ["List of software/library dependencies mentioned"]
  },
  "confidence": 0.95,
  "extractedSections": {
    "abstract": "Extracted abstract text if available",
    "introduction": "Key points from introduction",
    "methodology": "Key methodological points",
    "results": "Key results summary",
    "conclusion": "Key conclusions"
  }
}

Guidelines:
- Be thorough but concise in your extraction
- Focus on technical and implementable aspects
- Include specific algorithm names, not just general categories
- Extract actual dataset names when mentioned
- Identify concrete technical requirements (programming languages, frameworks, etc.)
- Provide a confidence score between 0 and 1 based on the clarity and completeness of the paper
- If a section is not clearly identifiable, omit it from extractedSections`;

		const messages = [
			{
				role: "user" as const,
				content: `Please analyze this research paper and extract the key concepts:\n\n${paperContent}`,
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
		const parseResult = this.parseJsonResponse<ConceptExtractionResult>(
			response.data!,
		);
		if (!parseResult.success) {
			return parseResult;
		}

		// Validate the response structure
		const validationResult = this.validateConceptExtractionResult(
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
	 * Validate the concept extraction result
	 */
	private validateConceptExtractionResult(
		data: ConceptExtractionResult,
	): AgentResponse<ConceptExtractionResult> {
		// Check if concepts object exists
		if (!data.concepts) {
			return {
				success: false,
				error: "Missing concepts object in response",
			};
		}

		// Validate required fields in concepts
		const requiredConceptFields: (keyof ResearchConcepts)[] = [
			"mainObjective",
			"keyMethods",
			"algorithms",
			"datasets",
			"evaluationMetrics",
			"technicalRequirements",
			"dependencies",
		];

		const conceptValidation = this.validateResponse(
			data.concepts,
			requiredConceptFields,
		);
		if (!conceptValidation.success) {
			return {
				success: false,
				error: `Invalid concepts structure: ${conceptValidation.error}`,
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

		// Validate that arrays are actually arrays
		const arrayFields: (keyof ResearchConcepts)[] = [
			"keyMethods",
			"algorithms",
			"datasets",
			"evaluationMetrics",
			"technicalRequirements",
			"dependencies",
		];

		for (const field of arrayFields) {
			if (!Array.isArray(data.concepts[field])) {
				return {
					success: false,
					error: `Field ${field} must be an array`,
				};
			}
		}

		// Validate mainObjective is a non-empty string
		if (
			typeof data.concepts.mainObjective !== "string" ||
			data.concepts.mainObjective.trim() === ""
		) {
			return {
				success: false,
				error: "mainObjective must be a non-empty string",
			};
		}

		return { success: true, data };
	}

	/**
	 * Extract concepts with fallback to simpler analysis if detailed extraction fails
	 */
	async extractConceptsWithFallback(
		paperContent: string,
	): Promise<AgentResponse<ConceptExtractionResult>> {
		// Try detailed extraction first
		const detailedResult = await this.extractConcepts(paperContent);

		if (detailedResult.success) {
			return detailedResult;
		}

		// Fallback to simpler extraction
		const fallbackResult = await this.extractBasicConcepts(paperContent);

		if (fallbackResult.success) {
			return {
				...fallbackResult,
				// Note: Used fallback analysis
			};
		}

		return detailedResult; // Return original error if fallback also fails
	}

	/**
	 * Simplified concept extraction as fallback
	 */
	private async extractBasicConcepts(
		paperContent: string,
	): Promise<AgentResponse<ConceptExtractionResult>> {
		const systemPrompt = `Extract basic research concepts from this paper. Return only a JSON object with:
{
  "concepts": {
    "mainObjective": "Main research goal",
    "keyMethods": ["method1", "method2"],
    "algorithms": ["algorithm1"],
    "datasets": ["dataset1"],
    "evaluationMetrics": ["metric1"],
    "technicalRequirements": ["requirement1"],
    "dependencies": ["dependency1"]
  },
  "confidence": 0.8,
  "extractedSections": {}
}`;

		const messages = [
			{
				role: "user" as const,
				content: `Extract basic concepts from: ${paperContent.substring(0, 2000)}...`,
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

		const parseResult = this.parseJsonResponse<ConceptExtractionResult>(
			response.data!,
		);
		return parseResult;
	}
}
