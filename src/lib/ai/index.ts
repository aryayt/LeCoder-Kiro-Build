// AI SDK and Agent exports
export {
	BaseAIAgent,
	type AIConfig,
	type AIProvider,
	type AgentResponse,
} from './base-agent';
export { ConceptExtractorAgent } from './agents/concept-extractor';
export { AlgorithmAnalyzerAgent } from './agents/algorithm-analyzer';
export { ArchitecturePlannerAgent } from './agents/architecture-planner';
export { CodeGeneratorAgent } from './agents/code-generator';
export { DocumentationGeneratorAgent } from './agents/documentation-generator';

// Pipeline Management exports
export { PipelineManager } from './pipeline-manager';
export type { PipelineConfig, PipelineResult } from './pipeline-manager';

export { PipelineService } from './pipeline-service';

export { PipelineContextFactory } from './pipeline-context';

export { PipelineErrorHandler, PipelineErrorType } from './pipeline-errors';
export type { PipelineError } from './pipeline-errors';

export {
	PipelineStageUtils,
	PipelineStatusUtils,
	PipelineTimingUtils,
	PipelineValidationUtils,
	PipelineDataUtils,
	PIPELINE_STAGES,
} from './pipeline-utils';

// Rate limiting
export { rateLimiter } from './rate-limiter';

import { AlgorithmAnalyzerAgent } from './agents/algorithm-analyzer';
import { ArchitecturePlannerAgent } from './agents/architecture-planner';
import { CodeGeneratorAgent } from './agents/code-generator';
// Import the classes for factory functions
import { ConceptExtractorAgent } from './agents/concept-extractor';
import { DocumentationGeneratorAgent } from './agents/documentation-generator';

// Default AI configurations for different providers
export const DEFAULT_AI_CONFIGS = {
	openai: {
		provider: 'openai' as const,
		model: 'gpt-4o',
		temperature: 0.7,
		maxTokens: 4000,
	},
	google: {
		provider: 'google' as const,
		model: 'models/gemini-2.0-flash-exp',
		temperature: 0.7,
		maxTokens: 4000,
	},
	'google-pro': {
		provider: 'google' as const,
		model: 'models/gemini-2.0-flash-thinking-exp',
		temperature: 0.7,
		maxTokens: 4000,
	},
	anthropic: {
		provider: 'anthropic' as const,
		model: 'claude-3-5-sonnet-20241022',
		temperature: 0.7,
		maxTokens: 4000,
	},
} as const;

// Factory function to create AI agents with default configurations
export function createConceptExtractor(
	provider: 'openai' | 'google' | 'google-pro' | 'anthropic' = 'google',
	userId?: string,
	customApiKey?: string
) {
	const config = {
		...DEFAULT_AI_CONFIGS[provider],
		userId,
		customApiKey,
	};
	return new ConceptExtractorAgent(config);
}

export function createAlgorithmAnalyzer(
	provider: 'openai' | 'google' | 'google-pro' | 'anthropic' = 'google',
	userId?: string,
	customApiKey?: string
) {
	const config = {
		...DEFAULT_AI_CONFIGS[provider],
		userId,
		customApiKey,
	};
	return new AlgorithmAnalyzerAgent(config);
}

export function createArchitecturePlanner(
	provider: 'openai' | 'google' | 'google-pro' | 'anthropic' = 'google',
	userId?: string,
	customApiKey?: string
) {
	const config = {
		...DEFAULT_AI_CONFIGS[provider],
		userId,
		customApiKey,
	};
	return new ArchitecturePlannerAgent(config);
}

export function createCodeGenerator(
	provider: 'openai' | 'google' | 'google-pro' | 'anthropic' = 'google',
	userId?: string,
	customApiKey?: string
) {
	const config = {
		...DEFAULT_AI_CONFIGS[provider],
		userId,
		customApiKey,
	};
	return new CodeGeneratorAgent(config);
}

export function createDocumentationGenerator(
	provider: 'openai' | 'google' | 'google-pro' | 'anthropic' = 'google',
	userId?: string,
	customApiKey?: string
) {
	const config = {
		...DEFAULT_AI_CONFIGS[provider],
		userId,
		customApiKey,
	};
	return new DocumentationGeneratorAgent(config);
}

// Utility function to get available providers based on API keys
export function getAvailableProviders(): ('openai' | 'google' | 'anthropic')[] {
	const providers: ('openai' | 'google' | 'anthropic')[] = [];

	// Note: This would need to be called server-side where env is available
	// For client-side usage, you'd need to check via an API endpoint
	try {
		const { env } = require('~/env.js');

		if (env.OPENAI_API_KEY) {
			providers.push('openai');
		}
		if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
			providers.push('google');
		}
		if (env.ANTHROPIC_API_KEY) {
			providers.push('anthropic');
		}
	} catch {
		// Fallback if env is not available (client-side)
		return ['openai']; // Default fallback
	}

	return providers.length > 0 ? providers : ['openai'];
}
