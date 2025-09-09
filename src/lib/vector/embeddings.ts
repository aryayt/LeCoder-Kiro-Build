/**
 * Vector embeddings and storage utilities for PDF content
 */

import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI, openai } from "@ai-sdk/openai";
import type { AIProvider } from "@prisma/client";
import { embed, embedMany } from "ai";
import { env } from "~/env.js";
import { ApiKeyService } from "~/lib/services/api-key-service";

export interface TextChunk {
	id: string;
	content: string;
	metadata: {
		projectId: string;
		fileName: string;
		pageNumber?: number;
		chunkIndex: number;
		totalChunks: number;
	};
}

export interface EmbeddedChunk extends TextChunk {
	embedding: number[];
}

/**
 * Split text into manageable chunks for embedding
 */
export function splitTextIntoChunks(
	text: string,
	projectId: string,
	fileName: string,
	chunkSize = 1000,
	overlap = 200,
): TextChunk[] {
	const chunks: TextChunk[] = [];
	const words = text.split(/\s+/);

	let currentChunk = "";
	let chunkIndex = 0;

	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		const testChunk = currentChunk + (currentChunk ? " " : "") + word;

		if (testChunk.length > chunkSize && currentChunk.length > 0) {
			// Create chunk
			chunks.push({
				id: `${projectId}-chunk-${chunkIndex}`,
				content: currentChunk.trim(),
				metadata: {
					projectId,
					fileName,
					chunkIndex,
					totalChunks: 0, // Will be updated later
				},
			});

			// Start new chunk with overlap
			const overlapWords = currentChunk
				.split(/\s+/)
				.slice(-Math.floor(overlap / 10));
			currentChunk = `${overlapWords.join(" ")} ${word}`;
			chunkIndex++;
		} else {
			currentChunk = testChunk;
		}
	}

	// Add final chunk
	if (currentChunk.trim().length > 0) {
		chunks.push({
			id: `${projectId}-chunk-${chunkIndex}`,
			content: currentChunk.trim(),
			metadata: {
				projectId,
				fileName,
				chunkIndex,
				totalChunks: 0,
			},
		});
	}

	// Update total chunks count
	for (const chunk of chunks) {
		chunk.metadata.totalChunks = chunks.length;
	}

	return chunks;
}

/**
 * Generate embeddings for text chunks with user API key support
 */
export async function generateEmbeddings(
	chunks: TextChunk[],
	provider: "openai" | "google" = "google",
	userId?: string,
	customApiKey?: string,
): Promise<EmbeddedChunk[]> {
	try {
		console.log(
			`Generating embeddings for ${chunks.length} chunks using ${provider}`,
		);

		const texts = chunks.map((chunk) => chunk.content);
		let embeddings: number[][];

		// Get API key in order of preference: custom > user > env
		let apiKey: string | null = null;
		if (customApiKey) {
			apiKey = customApiKey;
		} else if (userId) {
			const prismaProvider = provider === "openai" ? "OPENAI" : "GOOGLE";
			apiKey = await ApiKeyService.getDecryptedApiKey(
				userId,
				prismaProvider as AIProvider,
			);
		}

		if (provider === "openai") {
			const key = apiKey || env.OPENAI_API_KEY;
			if (!key) {
				throw new Error(
					"OpenAI API key not configured. Please add your API key in settings.",
				);
			}

			const client = apiKey ? createOpenAI({ apiKey: key }) : openai;
			const { embeddings: result } = await embedMany({
				model: client.embedding("text-embedding-3-small"),
				values: texts,
			});
			embeddings = result;
		} else if (provider === "google") {
			const key = apiKey || env.GOOGLE_GENERATIVE_AI_API_KEY;
			if (!key) {
				throw new Error(
					"Google AI API key not configured. Please add your API key in settings.",
				);
			}

			const client = apiKey
				? createGoogleGenerativeAI({ apiKey: key })
				: google;

			// For Google, we need to generate embeddings one by one
			embeddings = [];
			for (const text of texts) {
				const { embedding } = await embed({
					model: client.textEmbeddingModel("text-embedding-004"),
					value: text,
				});
				embeddings.push(embedding);

				// Add small delay to respect rate limits
				if (apiKey) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}
		} else {
			throw new Error(`Unsupported provider: ${provider}`);
		}

		const embeddedChunks: EmbeddedChunk[] = chunks.map((chunk, index) => ({
			...chunk,
			embedding: embeddings[index],
		}));

		console.log(`Successfully generated ${embeddedChunks.length} embeddings`);
		return embeddedChunks;
	} catch (error) {
		console.error("Error generating embeddings:", error);
		throw new Error(
			`Failed to generate embeddings: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) {
		throw new Error("Vectors must have the same length");
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar chunks to a query with user API key support
 */
export async function findSimilarChunks(
	queryText: string,
	chunks: EmbeddedChunk[],
	topK = 5,
	provider: "openai" | "google" = "google",
	userId?: string,
	customApiKey?: string,
): Promise<Array<EmbeddedChunk & { similarity: number }>> {
	try {
		// Get API key in order of preference: custom > user > env
		let apiKey: string | null = null;
		if (customApiKey) {
			apiKey = customApiKey;
		} else if (userId) {
			const prismaProvider = provider === "openai" ? "OPENAI" : "GOOGLE";
			apiKey = await ApiKeyService.getDecryptedApiKey(
				userId,
				prismaProvider as AIProvider,
			);
		}

		// Generate embedding for query
		let queryEmbedding: number[];

		if (provider === "openai") {
			const key = apiKey || env.OPENAI_API_KEY;
			if (!key) {
				throw new Error(
					"OpenAI API key not configured. Please add your API key in settings.",
				);
			}

			const client = apiKey ? createOpenAI({ apiKey: key }) : openai;
			const { embedding } = await embed({
				model: client.embedding("text-embedding-3-small"),
				value: queryText,
			});
			queryEmbedding = embedding;
		} else if (provider === "google") {
			const key = apiKey || env.GOOGLE_GENERATIVE_AI_API_KEY;
			if (!key) {
				throw new Error(
					"Google AI API key not configured. Please add your API key in settings.",
				);
			}

			const client = apiKey
				? createGoogleGenerativeAI({ apiKey: key })
				: google;
			const { embedding } = await embed({
				model: client.textEmbeddingModel("text-embedding-004"),
				value: queryText,
			});
			queryEmbedding = embedding;
		} else {
			throw new Error(`Unsupported provider: ${provider}`);
		}

		// Calculate similarities
		const similarities = chunks.map((chunk) => ({
			...chunk,
			similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
		}));

		// Sort by similarity and return top K
		return similarities
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, topK);
	} catch (error) {
		console.error("Error finding similar chunks:", error);
		throw new Error(
			`Failed to find similar chunks: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Store embeddings in database (simplified in-memory storage for now)
 * In production, you would use a proper vector database like Pinecone, Weaviate, or Chroma
 */
class SimpleVectorStore {
	private store: Map<string, EmbeddedChunk[]> = new Map();

	async set(projectId: string, chunks: EmbeddedChunk[]): Promise<void> {
		this.store.set(projectId, chunks);
		console.log(
			`Stored ${chunks.length} embedded chunks for project ${projectId}`,
		);
	}

	async retrieve(projectId: string): Promise<EmbeddedChunk[]> {
		return this.store.get(projectId) || [];
	}

	async delete(projectId: string): Promise<void> {
		this.store.delete(projectId);
		console.log(`Deleted embeddings for project ${projectId}`);
	}

	async search(
		projectId: string,
		queryText: string,
		topK = 5,
		provider: "openai" | "google" = "google",
		userId?: string,
		customApiKey?: string,
	): Promise<Array<EmbeddedChunk & { similarity: number }>> {
		const chunks = await this.retrieve(projectId);
		if (chunks.length === 0) {
			return [];
		}

		return findSimilarChunks(
			queryText,
			chunks,
			topK,
			provider,
			userId,
			customApiKey,
		);
	}
}

// Singleton instance
export const vectorStore = new SimpleVectorStore();

/**
 * Process PDF content and store embeddings with user API key support
 */
export async function processPdfForVectorStorage(
	text: string,
	projectId: string,
	fileName: string,
	provider: "openai" | "google" = "google",
	userId?: string,
	customApiKey?: string,
): Promise<{
	chunksCount: number;
	embeddingsGenerated: number;
	totalTokensEstimate: number;
}> {
	try {
		console.log(`Processing PDF for vector storage: ${fileName}`);

		// Split text into chunks
		const chunks = splitTextIntoChunks(text, projectId, fileName);
		console.log(`Split text into ${chunks.length} chunks`);

		// Generate embeddings
		const embeddedChunks = await generateEmbeddings(
			chunks,
			provider,
			userId,
			customApiKey,
		);

		// Store embeddings
		await vectorStore.store(projectId, embeddedChunks);

		// Estimate tokens used (rough approximation)
		const totalTokensEstimate = chunks.reduce((total, chunk) => {
			return total + Math.ceil(chunk.content.length / 4); // Rough token estimation
		}, 0);

		return {
			chunksCount: chunks.length,
			embeddingsGenerated: embeddedChunks.length,
			totalTokensEstimate,
		};
	} catch (error) {
		console.error("Error processing PDF for vector storage:", error);
		throw error;
	}
}
