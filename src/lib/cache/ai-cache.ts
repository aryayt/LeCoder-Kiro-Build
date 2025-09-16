import { createHash } from 'node:crypto';
import type {
	AlgorithmSpecs,
	Documentation,
	GeneratedCodebase,
	ResearchConcepts,
	SystemArchitecture,
} from '~/types/ai';
import { CacheKeys, CacheTTL, cache, getRedisClient } from './redis';

/**
 * Generate cache key for AI requests based on content hash
 */
function generateAIHash(content: string, model: string, prompt: string): string {
	return createHash('sha256')
		.update(`${content}:${model}:${prompt}`)
		.digest('hex')
		.substring(0, 16);
}

/**
 * Cached AI operations
 */
export class AICacheManager {
	/**
	 * Cache concept extraction results
	 */
	async getCachedConcepts(
		paperContent: string,
		model: string,
		fetcher: () => Promise<ResearchConcepts>
	): Promise<ResearchConcepts> {
		const hash = generateAIHash(paperContent, model, 'concept-extraction');
		const key = CacheKeys.aiResponse(hash);

		return cache.getOrSet(key, fetcher, CacheTTL.AI_RESPONSE);
	}

	/**
	 * Cache algorithm analysis results
	 */
	async getCachedAlgorithmAnalysis(
		concepts: ResearchConcepts,
		model: string,
		fetcher: () => Promise<AlgorithmSpecs>
	): Promise<AlgorithmSpecs> {
		const hash = generateAIHash(JSON.stringify(concepts), model, 'algorithm-analysis');
		const key = CacheKeys.aiResponse(hash);

		return cache.getOrSet(key, fetcher, CacheTTL.AI_RESPONSE);
	}

	/**
	 * Cache architecture planning results
	 */
	async getCachedArchitecture(
		algorithms: AlgorithmSpecs,
		model: string,
		fetcher: () => Promise<SystemArchitecture>
	): Promise<SystemArchitecture> {
		const hash = generateAIHash(JSON.stringify(algorithms), model, 'architecture-planning');
		const key = CacheKeys.aiResponse(hash);

		return cache.getOrSet(key, fetcher, CacheTTL.AI_RESPONSE);
	}

	/**
	 * Cache code generation results
	 */
	async getCachedCodeGeneration(
		architecture: SystemArchitecture,
		model: string,
		fetcher: () => Promise<GeneratedCodebase>
	): Promise<GeneratedCodebase> {
		const hash = generateAIHash(JSON.stringify(architecture), model, 'code-generation');
		const key = CacheKeys.aiResponse(hash);

		return cache.getOrSet(key, fetcher, CacheTTL.AI_RESPONSE);
	}

	/**
	 * Cache documentation generation results
	 */
	async getCachedDocumentation(
		codebase: GeneratedCodebase,
		model: string,
		fetcher: () => Promise<Documentation>
	): Promise<Documentation> {
		const hash = generateAIHash(JSON.stringify(codebase), model, 'documentation-generation');
		const key = CacheKeys.aiResponse(hash);

		return cache.getOrSet(key, fetcher, CacheTTL.AI_RESPONSE);
	}

	/**
	 * Cache PDF content extraction
	 */
	async getCachedPDFContent(fileBuffer: Buffer, fetcher: () => Promise<string>): Promise<string> {
		const hash = createHash('sha256').update(fileBuffer).digest('hex').substring(0, 16);
		const key = CacheKeys.pdfContent(hash);

		return cache.getOrSet(key, fetcher, CacheTTL.PDF_CONTENT);
	}

	/**
	 * Invalidate all AI cache for a project
	 */
	async invalidateProjectAICache(projectId: string): Promise<void> {
		await cache.invalidatePattern(`ai:response:*${projectId}*`);
	}

	/**
	 * Get cache statistics
	 */
	async getCacheStats(): Promise<{
		aiResponses: number;
		pdfContent: number;
		projects: number;
	}> {
		try {
			const redis = getRedisClient();
			const aiKeys = await redis.keys('ai:response:*');
			const pdfKeys = await redis.keys('pdf:content:*');
			const projectKeys = await redis.keys('project:*');

			return {
				aiResponses: aiKeys.length,
				pdfContent: pdfKeys.length,
				projects: projectKeys.length,
			};
		} catch (error) {
			console.error('Error getting cache stats:', error);
			return { aiResponses: 0, pdfContent: 0, projects: 0 };
		}
	}
}

export const aiCache = new AICacheManager();
