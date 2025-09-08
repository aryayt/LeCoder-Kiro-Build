/**
 * Example usage of AI agents
 * This file demonstrates how to use the ConceptExtractorAgent and AlgorithmAnalyzerAgent
 */

import { createAlgorithmAnalyzer, createConceptExtractor } from "./index";

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
		const extractor = createConceptExtractor("google");

		console.log("Extracting concepts from research paper...");

		// Extract concepts from the sample paper
		const result = await extractor.extractConcepts(samplePaperContent);

		if (result.success) {
			console.log("✅ Concept extraction successful!");
			console.log("Main Objective:", result.data?.concepts.mainObjective);
			console.log("Key Methods:", result.data?.concepts.keyMethods);
			console.log("Algorithms:", result.data?.concepts.algorithms);
			console.log("Confidence:", result.data?.confidence);

			return result.data;
		} else {
			console.error("❌ Concept extraction failed:", result.error);
			return null;
		}
	} catch (error) {
		console.error("❌ Error in concept extraction:", error);
		return null;
	}
}

/**
 * Example function to analyze algorithms from extracted concepts
 */
export async function analyzeAlgorithmsExample() {
	try {
		// First extract concepts
		const conceptExtractor = createConceptExtractor("google");
		const conceptResult =
			await conceptExtractor.extractConcepts(samplePaperContent);

		if (!conceptResult.success) {
			console.error("❌ Failed to extract concepts first");
			return null;
		}

		// Create an algorithm analyzer
		const analyzer = createAlgorithmAnalyzer("google");

		console.log("Analyzing algorithms from extracted concepts...");

		// Analyze algorithms
		const result = await analyzer.analyzeAlgorithms(
			conceptResult.data!.concepts,
			samplePaperContent,
		);

		if (result.success) {
			console.log("✅ Algorithm analysis successful!");
			console.log(
				"Number of algorithms:",
				result.data?.specs.algorithms.length,
			);
			console.log(
				"Programming language:",
				result.data?.specs.systemRequirements.programmingLanguage,
			);
			console.log(
				"Implementation complexity:",
				result.data?.specs.implementationComplexity,
			);
			console.log("Confidence:", result.data?.confidence);

			return result.data;
		} else {
			console.error("❌ Algorithm analysis failed:", result.error);
			return null;
		}
	} catch (error) {
		console.error("❌ Error in algorithm analysis:", error);
		return null;
	}
}

/**
 * Complete pipeline example
 */
export async function runCompletePipeline() {
	console.log("🚀 Starting complete AI analysis pipeline...\n");

	// Step 1: Extract concepts
	console.log("📝 Step 1: Extracting concepts...");
	const concepts = await extractConceptsExample();

	if (!concepts) {
		console.log("❌ Pipeline failed at concept extraction");
		return;
	}

	console.log("\n");

	// Step 2: Analyze algorithms
	console.log("🔍 Step 2: Analyzing algorithms...");
	const algorithms = await analyzeAlgorithmsExample();

	if (!algorithms) {
		console.log("❌ Pipeline failed at algorithm analysis");
		return;
	}

	console.log("\n✅ Complete pipeline finished successfully!");
	console.log("📊 Summary:");
	console.log(`- Extracted ${concepts.concepts.algorithms.length} algorithms`);
	console.log(
		`- Identified ${algorithms.specs.algorithms.length} detailed algorithm specs`,
	);
	console.log(
		`- Target language: ${algorithms.specs.systemRequirements.programmingLanguage}`,
	);
	console.log(`- Complexity: ${algorithms.specs.implementationComplexity}`);

	return {
		concepts,
		algorithms,
	};
}

// Export for testing
export { samplePaperContent };
