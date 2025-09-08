// Test setup and mocks for AI module testing
// This file provides shared mocks and test data

// Mock AI SDK modules for testing
jest.mock("ai", () => ({
	generateText: jest.fn(),
}));

jest.mock("@ai-sdk/openai", () => ({
	openai: jest.fn(),
}));

jest.mock("@ai-sdk/google", () => ({
	google: jest.fn(),
}));

jest.mock("@ai-sdk/anthropic", () => ({
	anthropic: jest.fn(),
}));

// Mock environment variables
jest.mock("~/env.js", () => ({
	env: {
		OPENAI_API_KEY: "test-openai-key",
		GOOGLE_GENERATIVE_AI_API_KEY: "test-google-key",
		ANTHROPIC_API_KEY: "test-anthropic-key",
	},
}));

export const mockGenerateText = require("ai")
	.generateText as jest.MockedFunction<typeof import("ai").generateText>;
export const mockOpenAI = require("@ai-sdk/openai")
	.openai as jest.MockedFunction<typeof import("@ai-sdk/openai").openai>;
export const mockGoogle = require("@ai-sdk/google")
	.google as jest.MockedFunction<typeof import("@ai-sdk/google").google>;
export const mockAnthropic = require("@ai-sdk/anthropic")
	.anthropic as jest.MockedFunction<
	typeof import("@ai-sdk/anthropic").anthropic
>;

// Sample test data
export const samplePaperContent = `
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

export const sampleResearchConcepts = {
	mainObjective:
		"Develop a hybrid transformer-CNN model for improved text classification",
	keyMethods: [
		"Deep Learning",
		"Transformer Architecture",
		"Convolutional Neural Networks",
	],
	algorithms: ["BERT", "CNN", "Adam Optimizer", "Attention Mechanism"],
	datasets: ["IMDB Movie Review Dataset"],
	evaluationMetrics: ["Accuracy", "F1-Score"],
	technicalRequirements: ["Python", "PyTorch", "Transformers Library"],
	dependencies: ["torch", "transformers", "numpy", "scikit-learn"],
};

export const sampleConceptExtractionResponse = {
	concepts: sampleResearchConcepts,
	confidence: 0.95,
	extractedSections: {
		abstract:
			"This paper presents a comprehensive study of deep learning techniques applied to natural language processing tasks.",
		methodology:
			"We implemented a hybrid model combining BERT embeddings with CNN layers.",
		results: "Our approach achieved 94.2% accuracy on the test set.",
	},
};

export const sampleAlgorithmAnalysisResponse = {
	specs: {
		algorithms: [
			{
				name: "Hybrid BERT-CNN",
				description:
					"A hybrid model combining BERT embeddings with CNN layers for text classification",
				type: "machine_learning" as const,
				complexity: "high" as const,
				inputs: [
					{
						name: "text_input",
						type: "string",
						description: "Input text for classification",
						required: true,
						format: "plain text",
					},
				],
				outputs: [
					{
						name: "classification_result",
						type: "object",
						description: "Classification result with probabilities",
						format: "JSON",
					},
				],
				parameters: [
					{
						name: "learning_rate",
						type: "float",
						description: "Learning rate for training",
						defaultValue: 0.001,
						range: { min: 0.0001, max: 0.01 },
					},
				],
				dependencies: ["torch", "transformers"],
				pseudocode: "1. Load BERT embeddings 2. Apply CNN layers 3. Classify",
				mathematicalFormulation: "y = softmax(CNN(BERT(x)))",
			},
		],
		systemRequirements: {
			programmingLanguage: "Python",
			frameworks: ["PyTorch", "Transformers"],
			libraries: ["torch", "transformers", "numpy"],
			minimumHardware: {
				cpu: "4 cores",
				memory: "8GB RAM",
				storage: "10GB",
				gpu: "NVIDIA GPU with 4GB VRAM",
			},
			operatingSystem: ["Linux", "Windows", "macOS"],
			pythonVersion: "3.8+",
		},
		implementationComplexity: "high" as const,
		estimatedDevelopmentTime: "2-3 weeks",
	},
	confidence: 0.92,
	implementationNotes: [
		"Requires GPU for training",
		"Pre-trained BERT model needed",
	],
	potentialChallenges: ["Memory requirements", "Training time"],
	recommendedApproach: "Use transfer learning with pre-trained BERT",
};

// Helper function to create mock AI response
export function createMockAIResponse(text: string, tokensUsed = 1000) {
	return {
		text,
		usage: {
			totalTokens: tokensUsed,
			promptTokens: tokensUsed * 0.7,
			completionTokens: tokensUsed * 0.3,
		},
	};
}
