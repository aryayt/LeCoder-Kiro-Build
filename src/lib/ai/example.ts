/**
 * Example usage of AI agents
 * This file demonstrates how to use the ConceptExtractorAgent and AlgorithmAnalyzerAgent
 */

import { createAlgorithmAnalyzer, createConceptExtractor } from './index';

// Example paper content for testing
const samplePaperContent = `
Title: Deep Learning Approaches for Natural Language Processing

Abstract:
This paper presents a comprehensive study of deep learning techniques applied to natural language processing tasks. We propose a novel transformer-based architecture that combines attention mechanisms with convolutional layers to improve text classification accuracy.

Introduction:
Natural language processing (NLP) has seen significant advances with the introduction of transformer models. Our research focuses on enhancing these models through architectural innovations.

Methodology:
We implemented a hybrid model combining BERT embeddings with CNN layers. The model was trained on the IMDB movie review dataset using Adam optimizer with a learning rate of 0.001.

Results:
Our approach achieved 94.2% accuracy on the test set, outperforming baseline models by 3.5%.

Conclusion:
The proposed hybrid architecture demonstrates superior performance for text classification tasks.
`;

/**
 * Example function to extract concepts from a research paper
 */
export async function extractConceptsExample() {
	try {
		// Create a concept extractor using Google's Gemini model (default)
		const extractor = createConceptExtractor('google');

		// Extract concepts from the sample paper
		const result = await extractor.extractConcepts(samplePaperContent);

		if (result.success) {
			return result.data;
		}
		console.error('❌ Concept extraction failed:', result.error);
		return null;
	} catch (error) {
		console.error('❌ Error in concept extraction:', error);
		return null;
	}
}

/**
 * Example function to analyze algorithms from extracted concepts
 */
export async function analyzeAlgorithmsExample() {
	try {
		// First extract concepts
		const conceptExtractor = createConceptExtractor('google');
		const conceptResult = await conceptExtractor.extractConcepts(samplePaperContent);

		if (!conceptResult.success) {
			console.error('❌ Failed to extract concepts first');
			return null;
		}

		// Create an algorithm analyzer
		const analyzer = createAlgorithmAnalyzer('google');

		// Analyze algorithms
		const result = await analyzer.analyzeAlgorithms(
			conceptResult.data?.concepts,
			samplePaperContent
		);

		if (result.success) {
			return result.data;
		}
		console.error('❌ Algorithm analysis failed:', result.error);
		return null;
	} catch (error) {
		console.error('❌ Error in algorithm analysis:', error);
		return null;
	}
}

/**
 * Complete pipeline example
 */
export async function runCompletePipeline() {
	const concepts = await extractConceptsExample();

	if (!concepts) {
		return;
	}
	const algorithms = await analyzeAlgorithmsExample();

	if (!algorithms) {
		return;
	}

	return {
		concepts,
		algorithms,
	};
}

// Export for testing
export { samplePaperContent };
