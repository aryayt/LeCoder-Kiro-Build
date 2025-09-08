import { beforeEach, describe, it } from "@jest/globals";
import {
	ArchitecturePlannerAgent,
	CodeGeneratorAgent,
	DocumentationGeneratorAgent,
} from "~/lib/ai";
import type { AlgorithmSpecs, ResearchConcepts } from "~/types/ai";

// Mock the AI SDK
jest.mock("ai", () => ({
	generateText: jest.fn(),
}));

// Mock the environment
jest.mock("~/env.js", () => ({
	env: {
		GOOGLE_GENERATIVE_AI_API_KEY: "test-key",
		OPENAI_API_KEY: "test-key",
		ANTHROPIC_API_KEY: "test-key",
	},
}));

// Mock the rate limiter
jest.mock("~/lib/ai/rate-limiter", () => ({
	rateLimiter: {
		canMakeRequest: jest.fn(() => true),
		recordRequest: jest.fn(),
		getTimeUntilNextRequest: jest.fn(() => 0),
	},
}));

describe("Code Generation Integration", () => {
	const mockGenerateText = require("ai").generateText as jest.MockedFunction<
		typeof import("ai").generateText
	>;

	let architecturePlanner: ArchitecturePlannerAgent;
	let codeGenerator: CodeGeneratorAgent;
	let documentationGenerator: DocumentationGeneratorAgent;

	const mockConcepts: ResearchConcepts = {
		mainObjective: "Implement a machine learning classifier for text analysis",
		keyMethods: ["Natural Language Processing", "Support Vector Machines"],
		algorithms: ["SVM", "TF-IDF", "Text Preprocessing"],
		datasets: ["Reuters-21578", "20 Newsgroups"],
		evaluationMetrics: ["Accuracy", "Precision", "Recall", "F1-Score"],
		technicalRequirements: ["Python", "scikit-learn", "NLTK"],
		dependencies: ["scikit-learn", "nltk", "numpy", "pandas"],
	};

	const mockAlgorithmSpecs: AlgorithmSpecs = {
		algorithms: [
			{
				name: "Text Classifier",
				description: "SVM-based text classification system",
				type: "machine_learning",
				complexity: "medium",
				inputs: [
					{
						name: "text_documents",
						type: "List[str]",
						description: "List of text documents to classify",
						required: true,
						format: "UTF-8 encoded strings",
					},
				],
				outputs: [
					{
						name: "predictions",
						type: "numpy.ndarray",
						description: "Predicted class labels",
						format: "(n_samples,)",
					},
					{
						name: "probabilities",
						type: "numpy.ndarray",
						description: "Prediction probabilities",
						format: "(n_samples, n_classes)",
					},
				],
				parameters: [
					{
						name: "C",
						type: "float",
						description: "Regularization parameter",
						defaultValue: 1.0,
						range: { min: 0.001, max: 1000 },
					},
				],
				dependencies: ["scikit-learn", "nltk", "numpy"],
				pseudocode:
					"1. Preprocess text\n2. Extract TF-IDF features\n3. Train SVM\n4. Make predictions",
			},
		],
		systemRequirements: {
			programmingLanguage: "Python",
			frameworks: ["scikit-learn", "NLTK"],
			libraries: ["numpy", "pandas", "matplotlib"],
			minimumHardware: {
				cpu: "2 cores",
				memory: "4GB RAM",
				storage: "2GB",
			},
			operatingSystem: ["Linux", "Windows", "macOS"],
			pythonVersion: "3.8+",
		},
		implementationComplexity: "medium",
		estimatedDevelopmentTime: "1-2 weeks",
	};

	beforeEach(() => {
		architecturePlanner = new ArchitecturePlannerAgent({
			provider: "google",
			model: "models/gemini-2.0-flash-exp",
		});
		codeGenerator = new CodeGeneratorAgent({
			provider: "google",
			model: "models/gemini-2.0-flash-exp",
		});
		documentationGenerator = new DocumentationGeneratorAgent({
			provider: "google",
			model: "models/gemini-2.0-flash-exp",
		});
		jest.clearAllMocks();
	});

	describe("Full Code Generation Pipeline", () => {
		it("should complete the full pipeline from concepts to documentation", async () => {
			// Mock architecture planning response
			const mockArchitectureResult = {
				architecture: {
					projectStructure: {
						rootDirectory: "text_classifier",
						directories: [
							{
								path: "src/",
								purpose: "Source code",
								subdirectories: [
									{
										path: "src/models/",
										purpose: "ML models",
									},
									{
										path: "src/preprocessing/",
										purpose: "Text preprocessing",
									},
								],
							},
							{
								path: "tests/",
								purpose: "Test files",
							},
						],
						files: [
							{
								path: "main.py",
								type: "source",
								purpose: "Main entry point",
								dependencies: ["src.models", "src.preprocessing"],
							},
						],
						configFiles: [
							{
								path: "requirements.txt",
								type: "dependencies",
								purpose: "Python dependencies",
							},
						],
					},
					modules: [
						{
							name: "TextClassifier",
							path: "src/models/",
							purpose: "Text classification model",
							exports: ["TextClassifier"],
							imports: ["sklearn", "nltk"],
							functions: [
								{
									name: "train",
									purpose: "Train the classifier",
									parameters: [
										{
											name: "texts",
											type: "List[str]",
											required: true,
											description: "Training texts",
										},
									],
									returnType: "None",
									complexity: "medium",
								},
							],
							classes: [
								{
									name: "TextClassifier",
									purpose: "Main classifier class",
									methods: [
										{
											name: "fit",
											purpose: "Train model",
											parameters: [
												{
													name: "X",
													type: "List[str]",
													required: true,
													description: "Training data",
												},
											],
											returnType: "self",
											complexity: "medium",
										},
									],
									properties: [
										{
											name: "vectorizer",
											type: "TfidfVectorizer",
											visibility: "private",
											description: "TF-IDF vectorizer",
										},
									],
								},
							],
						},
					],
					dataFlow: [
						{
							from: "raw_text",
							to: "preprocessor",
							dataType: "string",
							description: "Raw text to preprocessing",
						},
					],
					apiEndpoints: [
						{
							path: "/classify",
							method: "POST",
							purpose: "Classify text",
							parameters: [
								{
									name: "text",
									type: "string",
									required: true,
									description: "Text to classify",
								},
							],
							responseType: "ClassificationResult",
						},
					],
					databaseSchema: [],
					deploymentStrategy: {
						platform: "Docker",
						environment: "production",
						requirements: ["Docker", "Python 3.8+"],
						steps: [
							{
								order: 1,
								description: "Build Docker image",
								command: "docker build -t text-classifier .",
							},
						],
					},
				},
				confidence: 0.9,
				designDecisions: [
					{
						decision: "Use SVM for classification",
						rationale: "Good performance on text data",
						alternatives: ["Naive Bayes", "Neural Networks"],
						tradeoffs: ["Interpretability vs complexity"],
					},
				],
				implementationStrategy: "Start with preprocessing, then model training",
				riskAssessment: [
					{
						risk: "Large vocabulary size",
						impact: "medium",
						probability: "high",
						mitigation: ["Feature selection", "Dimensionality reduction"],
					},
				],
			};

			// Mock code generation response
			const mockCodeResult = {
				codebase: {
					files: [
						{
							path: "main.py",
							content:
								"#!/usr/bin/env python3\n\"\"\"\nText Classification System\n\"\"\"\n\nimport sys\nimport argparse\nfrom src.models.text_classifier import TextClassifier\nfrom src.preprocessing.text_processor import TextProcessor\n\ndef main():\n    parser = argparse.ArgumentParser(description='Text Classification System')\n    parser.add_argument('--train', help='Training data file')\n    parser.add_argument('--test', help='Test data file')\n    parser.add_argument('--model', help='Model file path')\n    \n    args = parser.parse_args()\n    \n    classifier = TextClassifier()\n    processor = TextProcessor()\n    \n    if args.train:\n        # Training mode\n        texts, labels = processor.load_data(args.train)\n        classifier.fit(texts, labels)\n        classifier.save(args.model or 'model.pkl')\n        print('Training completed successfully')\n    \n    elif args.test:\n        # Testing mode\n        classifier.load(args.model or 'model.pkl')\n        texts, true_labels = processor.load_data(args.test)\n        predictions = classifier.predict(texts)\n        accuracy = classifier.evaluate(true_labels, predictions)\n        print(f'Accuracy: {accuracy:.3f}')\n    \n    else:\n        print('Please specify --train or --test mode')\n        sys.exit(1)\n\nif __name__ == '__main__':\n    main()",
							type: "source",
							language: "python",
							dependencies: [
								"argparse",
								"sys",
								"src.models.text_classifier",
								"src.preprocessing.text_processor",
							],
							exports: ["main"],
						},
						{
							path: "src/models/text_classifier.py",
							content:
								'import pickle\nimport numpy as np\nfrom sklearn.svm import SVC\nfrom sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.metrics import accuracy_score, classification_report\n\nclass TextClassifier:\n    """\n    SVM-based text classifier with TF-IDF features\n    """\n    \n    def __init__(self, C=1.0, kernel=\'linear\'):\n        self.C = C\n        self.kernel = kernel\n        self.pipeline = None\n        self.classes_ = None\n    \n    def fit(self, texts, labels):\n        """\n        Train the text classifier\n        \n        Args:\n            texts (List[str]): Training text documents\n            labels (List[str]): Training labels\n        \n        Returns:\n            self: Fitted classifier\n        """\n        self.pipeline = Pipeline([\n            (\'tfidf\', TfidfVectorizer(max_features=10000, stop_words=\'english\')),\n            (\'svm\', SVC(C=self.C, kernel=self.kernel, probability=True))\n        ])\n        \n        self.pipeline.fit(texts, labels)\n        self.classes_ = self.pipeline.named_steps[\'svm\'].classes_\n        return self\n    \n    def predict(self, texts):\n        """\n        Predict class labels for texts\n        \n        Args:\n            texts (List[str]): Text documents to classify\n        \n        Returns:\n            numpy.ndarray: Predicted class labels\n        """\n        if self.pipeline is None:\n            raise ValueError(\'Model not trained. Call fit() first.\')\n        \n        return self.pipeline.predict(texts)\n    \n    def predict_proba(self, texts):\n        """\n        Predict class probabilities for texts\n        \n        Args:\n            texts (List[str]): Text documents to classify\n        \n        Returns:\n            numpy.ndarray: Prediction probabilities\n        """\n        if self.pipeline is None:\n            raise ValueError(\'Model not trained. Call fit() first.\')\n        \n        return self.pipeline.predict_proba(texts)\n    \n    def evaluate(self, true_labels, predictions):\n        """\n        Evaluate classifier performance\n        \n        Args:\n            true_labels (List[str]): True class labels\n            predictions (List[str]): Predicted class labels\n        \n        Returns:\n            float: Accuracy score\n        """\n        accuracy = accuracy_score(true_labels, predictions)\n        print(classification_report(true_labels, predictions))\n        return accuracy\n    \n    def save(self, filepath):\n        """\n        Save trained model to file\n        \n        Args:\n            filepath (str): Path to save model\n        """\n        if self.pipeline is None:\n            raise ValueError(\'No trained model to save\')\n        \n        with open(filepath, \'wb\') as f:\n            pickle.dump(self.pipeline, f)\n    \n    def load(self, filepath):\n        """\n        Load trained model from file\n        \n        Args:\n            filepath (str): Path to model file\n        """\n        with open(filepath, \'rb\') as f:\n            self.pipeline = pickle.load(f)\n        \n        if hasattr(self.pipeline.named_steps[\'svm\'], \'classes_\'):\n            self.classes_ = self.pipeline.named_steps[\'svm\'].classes_',
							type: "source",
							language: "python",
							dependencies: ["pickle", "numpy", "sklearn"],
							exports: ["TextClassifier"],
						},
					],
					structure: {
						rootDirectory: "text_classifier",
						directories: [
							{
								path: "src/",
								purpose: "Source code",
							},
						],
						files: [
							{
								path: "main.py",
								type: "source",
								purpose: "Main entry point",
							},
						],
						configFiles: [
							{
								path: "requirements.txt",
								type: "dependencies",
								purpose: "Python dependencies",
								content: {
									dependencies: [
										"scikit-learn>=1.0.0",
										"nltk>=3.7",
										"numpy>=1.21.0",
									],
								},
							},
						],
					},
					documentation: {
						readme: {
							title: "Text Classification System",
							description: "SVM-based text classifier with TF-IDF features",
							features: [
								"Text preprocessing",
								"SVM classification",
								"Model persistence",
							],
							installation: ["pip install -r requirements.txt"],
							usage: [
								{
									title: "Training",
									description: "Train the classifier",
									code: "python main.py --train data/train.csv --model classifier.pkl",
									language: "bash",
								},
							],
							contributing: ["Fork repository"],
							license: "MIT",
						},
						apiDocs: [],
						setupGuide: {
							prerequisites: [
								{
									name: "Python",
									version: "3.8+",
									description: "Python runtime",
								},
							],
							installationSteps: [
								{
									order: 1,
									title: "Install dependencies",
									description: "Install required packages",
									commands: ["pip install -r requirements.txt"],
								},
							],
							configuration: [],
							verification: [
								{
									order: 1,
									title: "Test installation",
									description: "Verify installation",
									commands: ["python -c 'import sklearn; print(\"Success\")'"],
									expectedOutput: "Success",
								},
							],
						},
						userGuide: {
							sections: [
								{
									title: "Getting Started",
									content: "Guide to text classification",
								},
							],
							troubleshooting: [],
							faq: [],
						},
						developerGuide: {
							architecture: {
								description: "Text classification architecture",
								components: [
									{
										name: "TextClassifier",
										purpose: "Main classifier",
										responsibilities: ["Training", "Prediction"],
										interfaces: ["ClassifierInterface"],
									},
								],
								dataFlow: "Text -> TF-IDF -> SVM -> Prediction",
								designPatterns: ["Pipeline Pattern"],
							},
							codeStructure: {
								overview: "Modular text classification system",
								directories: [
									{
										path: "src/",
										purpose: "Source code",
										contents: ["models/", "preprocessing/"],
									},
								],
								namingConventions: [
									{
										type: "classes",
										pattern: "PascalCase",
										examples: ["TextClassifier"],
									},
								],
								codingStandards: [
									{
										category: "Documentation",
										rules: ["All classes documented"],
										examples: [
											'class TextClassifier:\n    """SVM classifier"""',
										],
									},
								],
							},
							contributionGuidelines: {
								gettingStarted: ["Clone repository"],
								developmentProcess: ["Write tests"],
								codeReview: ["Review required"],
								issueReporting: ["Use templates"],
							},
							testingGuide: {
								overview: "Testing approach",
								testTypes: [
									{
										type: "unit",
										purpose: "Test components",
										location: "tests/",
										examples: ["test_classifier.py"],
									},
								],
								runningTests: ["pytest"],
								writingTests: ["Use pytest"],
							},
						},
						changelog: [],
					},
					tests: [
						{
							path: "tests/test_text_classifier.py",
							content:
								"import pytest\nimport numpy as np\nfrom src.models.text_classifier import TextClassifier\n\nclass TestTextClassifier:\n    \n    def test_init(self):\n        classifier = TextClassifier()\n        assert classifier.C == 1.0\n        assert classifier.kernel == 'linear'\n        assert classifier.pipeline is None\n    \n    def test_fit(self):\n        classifier = TextClassifier()\n        texts = ['This is positive', 'This is negative']\n        labels = ['positive', 'negative']\n        \n        result = classifier.fit(texts, labels)\n        assert result is classifier\n        assert classifier.pipeline is not None\n        assert classifier.classes_ is not None\n    \n    def test_predict(self):\n        classifier = TextClassifier()\n        texts = ['Good movie', 'Bad movie', 'Great film', 'Terrible show']\n        labels = ['positive', 'negative', 'positive', 'negative']\n        \n        classifier.fit(texts, labels)\n        predictions = classifier.predict(['Amazing movie'])\n        \n        assert len(predictions) == 1\n        assert predictions[0] in ['positive', 'negative']\n    \n    def test_predict_proba(self):\n        classifier = TextClassifier()\n        texts = ['Good movie', 'Bad movie']\n        labels = ['positive', 'negative']\n        \n        classifier.fit(texts, labels)\n        probabilities = classifier.predict_proba(['Great film'])\n        \n        assert probabilities.shape == (1, 2)\n        assert np.allclose(probabilities.sum(axis=1), 1.0)\n    \n    def test_predict_without_training(self):\n        classifier = TextClassifier()\n        \n        with pytest.raises(ValueError, match='Model not trained'):\n            classifier.predict(['Some text'])\n    \n    def test_evaluate(self):\n        classifier = TextClassifier()\n        true_labels = ['positive', 'negative']\n        predictions = ['positive', 'negative']\n        \n        accuracy = classifier.evaluate(true_labels, predictions)\n        assert accuracy == 1.0",
							testType: "unit",
							targetFile: "src/models/text_classifier.py",
							coverage: [
								"TextClassifier class",
								"fit method",
								"predict method",
							],
						},
					],
					buildInstructions: {
						installCommands: ["pip install -r requirements.txt"],
						buildCommands: [
							"python -m py_compile src/models/text_classifier.py",
						],
						testCommands: ["python -m pytest tests/ -v"],
						runCommands: ["python main.py --help"],
						environmentSetup: [
							{
								variable: "PYTHONPATH",
								description: "Python module path",
								required: false,
								defaultValue: ".",
							},
						],
					},
				},
				confidence: 0.92,
				generationNotes: [
					"Implemented complete SVM-based text classifier",
					"Added comprehensive error handling and validation",
					"Generated working unit tests with good coverage",
				],
				qualityMetrics: {
					codeComplexity: "medium",
					testCoverage: 85,
					documentationCoverage: 90,
					codeQualityScore: 8.7,
				},
				completeness: {
					implementedFeatures: [
						"Text classification",
						"Model persistence",
						"Evaluation metrics",
					],
					missingFeatures: [],
					todoItems: 0,
					placeholderCount: 0,
				},
			};

			// Mock documentation generation response
			const mockDocumentationResult = {
				documentation: {
					readme: {
						title: "Text Classification System - Research Implementation",
						description:
							"A comprehensive SVM-based text classification system implementing state-of-the-art natural language processing techniques",
						features: [
							"Advanced SVM classification with TF-IDF features",
							"Comprehensive text preprocessing pipeline",
							"Model persistence and evaluation metrics",
							"Command-line interface for training and testing",
						],
						installation: [
							"git clone https://github.com/user/text-classifier.git",
							"cd text-classifier",
							"pip install -r requirements.txt",
						],
						usage: [
							{
								title: "Training the Classifier",
								description: "Train the SVM classifier on your text data",
								code: "python main.py --train data/training_data.csv --model my_classifier.pkl",
								language: "bash",
							},
							{
								title: "Making Predictions",
								description: "Use the trained model to classify new text",
								code: "python main.py --test data/test_data.csv --model my_classifier.pkl",
								language: "bash",
							},
						],
						contributing: [
							"Fork the repository on GitHub",
							"Create a feature branch for your changes",
							"Add comprehensive tests for new functionality",
							"Submit a pull request with detailed description",
						],
						license: "MIT",
						badges: [
							{
								name: "Python Version",
								url: "https://img.shields.io/badge/python-3.8+-blue.svg",
								imageUrl: "https://img.shields.io/badge/python-3.8+-blue.svg",
							},
						],
					},
					apiDocs: [],
					setupGuide: {
						prerequisites: [
							{
								name: "Python",
								version: "3.8+",
								description:
									"Python programming language with pip package manager",
								installationUrl: "https://python.org/downloads",
							},
						],
						installationSteps: [
							{
								order: 1,
								title: "Clone Repository",
								description: "Download the source code from GitHub",
								commands: [
									"git clone https://github.com/user/text-classifier.git",
								],
							},
							{
								order: 2,
								title: "Install Dependencies",
								description: "Install required Python packages",
								commands: ["pip install -r requirements.txt"],
							},
						],
						configuration: [],
						verification: [
							{
								order: 1,
								title: "Verify Installation",
								description:
									"Test that all dependencies are correctly installed",
								commands: [
									"python -c 'import sklearn, nltk; print(\"Installation successful\")'",
								],
								expectedOutput: "Installation successful",
							},
						],
					},
					userGuide: {
						sections: [
							{
								title: "Getting Started with Text Classification",
								content:
									"This guide will help you get started with the text classification system",
							},
						],
						troubleshooting: [],
						faq: [],
					},
					developerGuide: {
						architecture: {
							description:
								"The system follows a modular architecture with clear separation of concerns",
							components: [
								{
									name: "TextClassifier",
									purpose: "Core classification engine using SVM",
									responsibilities: [
										"Model training",
										"Prediction",
										"Evaluation",
									],
									interfaces: ["ClassifierInterface"],
								},
							],
							dataFlow:
								"Raw Text -> Preprocessing -> TF-IDF Vectorization -> SVM Classification -> Results",
							designPatterns: ["Pipeline Pattern", "Strategy Pattern"],
						},
						codeStructure: {
							overview:
								"The codebase is organized in a modular structure for maintainability",
							directories: [
								{
									path: "src/",
									purpose: "Main source code directory",
									contents: ["models/", "preprocessing/"],
								},
							],
							namingConventions: [
								{
									type: "classes",
									pattern: "PascalCase",
									examples: ["TextClassifier", "TextProcessor"],
								},
							],
							codingStandards: [
								{
									category: "Documentation",
									rules: ["All public methods must have docstrings"],
									examples: [
										'def fit(self, texts, labels):\n    """Train the classifier"""',
									],
								},
							],
						},
						contributionGuidelines: {
							gettingStarted: [
								"Fork repository",
								"Set up development environment",
							],
							developmentProcess: ["Write tests", "Follow coding standards"],
							codeReview: ["All code must be reviewed"],
							issueReporting: ["Use issue templates"],
						},
						testingGuide: {
							overview: "Comprehensive testing ensures code quality",
							testTypes: [
								{
									type: "unit",
									purpose: "Test individual components",
									location: "tests/",
									examples: ["test_text_classifier.py"],
								},
							],
							runningTests: ["python -m pytest tests/ -v"],
							writingTests: ["Use pytest framework"],
						},
					},
					changelog: [],
				},
				confidence: 0.94,
				documentationMetrics: {
					completeness: 92,
					readability: 88,
					technicalAccuracy: 94,
					exampleCoverage: 87,
				},
				generationNotes: [
					"Generated comprehensive documentation covering all aspects",
					"Included practical examples and troubleshooting guides",
					"Created detailed developer documentation for contributors",
				],
			};

			// Set up mock responses in sequence
			mockGenerateText
				.mockResolvedValueOnce({
					text: JSON.stringify(mockArchitectureResult),
					usage: { totalTokens: 2000 },
				})
				.mockResolvedValueOnce({
					text: JSON.stringify(mockCodeResult),
					usage: { totalTokens: 4000 },
				})
				.mockResolvedValueOnce({
					text: JSON.stringify(mockDocumentationResult),
					usage: { totalTokens: 3000 },
				});

			// Execute the full pipeline
			const architectureResult = await architecturePlanner.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(architectureResult.success).toBe(true);
			expect(architectureResult.data?.architecture).toBeDefined();

			const codeResult = await codeGenerator.generateCode(
				architectureResult.data!.architecture,
				mockAlgorithmSpecs,
			);

			expect(codeResult.success).toBe(true);
			expect(codeResult.data?.codebase).toBeDefined();
			expect(codeResult.data?.completeness.todoItems).toBe(0);
			expect(codeResult.data?.completeness.placeholderCount).toBe(0);

			const documentationResult =
				await documentationGenerator.generateDocumentation(
					codeResult.data!.codebase,
					architectureResult.data!.architecture,
				);

			expect(documentationResult.success).toBe(true);
			expect(documentationResult.data?.documentation).toBeDefined();

			// Verify the pipeline produced complete, integrated results
			expect(mockGenerateText).toHaveBeenCalledTimes(3);

			// Verify architecture contains necessary components
			const architecture = architectureResult.data!.architecture;
			expect(architecture.projectStructure.rootDirectory).toBe(
				"text_classifier",
			);
			expect(architecture.modules).toHaveLength(1);
			expect(architecture.modules[0].name).toBe("TextClassifier");

			// Verify code is complete and functional
			const codebase = codeResult.data!.codebase;
			expect(codebase.files.length).toBeGreaterThan(0);
			expect(codebase.tests.length).toBeGreaterThan(0);

			// Check that main.py contains actual implementation
			const mainFile = codebase.files.find((f) => f.path === "main.py");
			expect(mainFile).toBeDefined();
			expect(mainFile!.content).toContain("def main()");
			expect(mainFile!.content).not.toContain("TODO");
			expect(mainFile!.content).not.toContain("placeholder");

			// Check that classifier implementation is complete
			const classifierFile = codebase.files.find((f) =>
				f.path.includes("text_classifier.py"),
			);
			expect(classifierFile).toBeDefined();
			expect(classifierFile!.content).toContain("class TextClassifier");
			expect(classifierFile!.content).toContain("def fit(");
			expect(classifierFile!.content).toContain("def predict(");

			// Verify documentation is comprehensive
			const documentation = documentationResult.data!.documentation;
			expect(documentation.readme.title).toContain("Text Classification");
			expect(documentation.readme.usage.length).toBeGreaterThan(0);
			expect(documentation.setupGuide.installationSteps.length).toBeGreaterThan(
				0,
			);
		});

		it("should handle errors gracefully in the pipeline", async () => {
			// Create agents with fewer retries for this test
			const quickFailCodeGenerator = new CodeGeneratorAgent({
				provider: "google",
				model: "models/gemini-2.0-flash-exp",
				retryAttempts: 1,
			});

			// Architecture planning succeeds
			mockGenerateText.mockResolvedValueOnce({
				text: JSON.stringify({
					architecture: {
						projectStructure: {
							rootDirectory: "test_project",
							directories: [],
							files: [],
							configFiles: [],
						},
						modules: [],
						dataFlow: [],
						apiEndpoints: [],
						databaseSchema: [],
						deploymentStrategy: {
							platform: "Local",
							environment: "development",
							requirements: [],
							steps: [],
						},
					},
					confidence: 0.8,
					designDecisions: [],
					implementationStrategy: "Basic implementation",
					riskAssessment: [],
				}),
				usage: { totalTokens: 1000 },
			});

			// Code generation fails
			mockGenerateText.mockRejectedValueOnce(
				new Error("Code generation failed"),
			);

			const architectureResult = await architecturePlanner.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(architectureResult.success).toBe(true);

			const codeResult = await quickFailCodeGenerator.generateCode(
				architectureResult.data!.architecture,
				mockAlgorithmSpecs,
			);

			expect(codeResult.success).toBe(false);
			expect(codeResult.error).toContain("Code generation failed");

			// Pipeline should stop here, documentation generation shouldn't be called
			expect(mockGenerateText).toHaveBeenCalledTimes(2);
		});

		it("should validate that generated code has no TODOs or placeholders", async () => {
			// Mock architecture planning
			mockGenerateText.mockResolvedValueOnce({
				text: JSON.stringify({
					architecture: {
						projectStructure: {
							rootDirectory: "test_project",
							directories: [],
							files: [],
							configFiles: [],
						},
						modules: [],
						dataFlow: [],
						apiEndpoints: [],
						databaseSchema: [],
						deploymentStrategy: {
							platform: "Local",
							environment: "development",
							requirements: [],
							steps: [],
						},
					},
					confidence: 0.8,
					designDecisions: [],
					implementationStrategy: "Basic implementation",
					riskAssessment: [],
				}),
				usage: { totalTokens: 1000 },
			});

			// Mock code generation with TODOs (should fail validation)
			mockGenerateText.mockResolvedValueOnce({
				text: JSON.stringify({
					codebase: {
						files: [
							{
								path: "main.py",
								content:
									"# TODO: Implement this function\ndef main():\n    pass",
								type: "source",
								language: "python",
								dependencies: [],
								exports: ["main"],
							},
						],
						structure: {
							rootDirectory: "test",
							directories: [],
							files: [],
							configFiles: [],
						},
						documentation: {
							readme: {
								title: "Test",
								description: "Test project",
								features: [],
								installation: [],
								usage: [],
								contributing: [],
								license: "MIT",
							},
							apiDocs: [],
							setupGuide: {
								prerequisites: [],
								installationSteps: [],
								configuration: [],
								verification: [],
							},
							userGuide: {
								sections: [],
								troubleshooting: [],
								faq: [],
							},
							developerGuide: {
								architecture: {
									description: "Test architecture",
									components: [],
									dataFlow: "Test flow",
									designPatterns: [],
								},
								codeStructure: {
									overview: "Test structure",
									directories: [],
									namingConventions: [],
									codingStandards: [],
								},
								contributionGuidelines: {
									gettingStarted: [],
									developmentProcess: [],
									codeReview: [],
									issueReporting: [],
								},
								testingGuide: {
									overview: "Test guide",
									testTypes: [],
									runningTests: [],
									writingTests: [],
								},
							},
							changelog: [],
						},
						tests: [],
						buildInstructions: {
							installCommands: [],
							buildCommands: [],
							testCommands: [],
							runCommands: [],
							environmentSetup: [],
						},
					},
					confidence: 0.8,
					generationNotes: [],
					qualityMetrics: {
						codeComplexity: "low",
						testCoverage: 0,
						documentationCoverage: 0,
						codeQualityScore: 5.0,
					},
					completeness: {
						implementedFeatures: [],
						missingFeatures: [],
						todoItems: 1, // This should cause validation to fail
						placeholderCount: 0,
					},
				}),
				usage: { totalTokens: 2000 },
			});

			const architectureResult = await architecturePlanner.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			expect(architectureResult.success).toBe(true);

			const codeResult = await codeGenerator.generateCode(
				architectureResult.data!.architecture,
				mockAlgorithmSpecs,
			);

			expect(codeResult.success).toBe(false);
			expect(codeResult.error).toContain("contains TODO or FIXME");
		});
	});

	describe("Agent Configuration and Flexibility", () => {
		it("should work with different AI providers for each agent", async () => {
			const openaiArchitect = new ArchitecturePlannerAgent({
				provider: "openai",
				model: "gpt-4o",
			});
			const anthropicCoder = new CodeGeneratorAgent({
				provider: "anthropic",
				model: "claude-3-5-sonnet-20241022",
			});
			const googleDocumenter = new DocumentationGeneratorAgent({
				provider: "google",
				model: "models/gemini-2.0-flash-exp",
			});

			// Mock successful responses for all agents
			mockGenerateText
				.mockResolvedValueOnce({
					text: JSON.stringify({
						architecture: {
							projectStructure: {
								rootDirectory: "mixed_provider_project",
								directories: [],
								files: [],
								configFiles: [],
							},
							modules: [],
							dataFlow: [],
							apiEndpoints: [],
							databaseSchema: [],
							deploymentStrategy: {
								platform: "Cloud",
								environment: "production",
								requirements: [],
								steps: [],
							},
						},
						confidence: 0.9,
						designDecisions: [],
						implementationStrategy: "Multi-provider approach",
						riskAssessment: [],
					}),
					usage: { totalTokens: 1500 },
				})
				.mockResolvedValueOnce({
					text: JSON.stringify({
						codebase: {
							files: [
								{
									path: "app.py",
									content:
										"def main():\n    print('Multi-provider generated code')\n\nif __name__ == '__main__':\n    main()",
									type: "source",
									language: "python",
									dependencies: [],
									exports: ["main"],
								},
							],
							structure: {
								rootDirectory: "mixed_provider_project",
								directories: [],
								files: [],
								configFiles: [],
							},
							documentation: {
								readme: {
									title: "Mixed Provider Project",
									description: "Generated by multiple AI providers",
									features: [],
									installation: [],
									usage: [],
									contributing: [],
									license: "MIT",
								},
								apiDocs: [],
								setupGuide: {
									prerequisites: [],
									installationSteps: [],
									configuration: [],
									verification: [],
								},
								userGuide: {
									sections: [],
									troubleshooting: [],
									faq: [],
								},
								developerGuide: {
									architecture: {
										description: "Multi-provider architecture",
										components: [],
										dataFlow: "Provider-agnostic flow",
										designPatterns: [],
									},
									codeStructure: {
										overview: "Clean structure",
										directories: [],
										namingConventions: [],
										codingStandards: [],
									},
									contributionGuidelines: {
										gettingStarted: [],
										developmentProcess: [],
										codeReview: [],
										issueReporting: [],
									},
									testingGuide: {
										overview: "Testing approach",
										testTypes: [],
										runningTests: [],
										writingTests: [],
									},
								},
								changelog: [],
							},
							tests: [],
							buildInstructions: {
								installCommands: [],
								buildCommands: [],
								testCommands: [],
								runCommands: [],
								environmentSetup: [],
							},
						},
						confidence: 0.88,
						generationNotes: [],
						qualityMetrics: {
							codeComplexity: "low",
							testCoverage: 80,
							documentationCoverage: 85,
							codeQualityScore: 8.0,
						},
						completeness: {
							implementedFeatures: ["Basic functionality"],
							missingFeatures: [],
							todoItems: 0,
							placeholderCount: 0,
						},
					}),
					usage: { totalTokens: 2500 },
				})
				.mockResolvedValueOnce({
					text: JSON.stringify({
						documentation: {
							readme: {
								title: "Multi-Provider Generated Documentation",
								description:
									"Documentation created using Google's Gemini model",
								features: ["Cross-provider compatibility"],
								installation: ["pip install requirements"],
								usage: [
									{
										title: "Basic Usage",
										description: "Run the application",
										code: "python app.py",
										language: "bash",
									},
								],
								contributing: ["Follow guidelines"],
								license: "MIT",
							},
							apiDocs: [],
							setupGuide: {
								prerequisites: [],
								installationSteps: [],
								configuration: [],
								verification: [],
							},
							userGuide: {
								sections: [],
								troubleshooting: [],
								faq: [],
							},
							developerGuide: {
								architecture: {
									description: "Multi-provider system",
									components: [],
									dataFlow: "Seamless integration",
									designPatterns: [],
								},
								codeStructure: {
									overview: "Provider-agnostic structure",
									directories: [],
									namingConventions: [],
									codingStandards: [],
								},
								contributionGuidelines: {
									gettingStarted: [],
									developmentProcess: [],
									codeReview: [],
									issueReporting: [],
								},
								testingGuide: {
									overview: "Comprehensive testing",
									testTypes: [],
									runningTests: [],
									writingTests: [],
								},
							},
							changelog: [],
						},
						confidence: 0.91,
						documentationMetrics: {
							completeness: 88,
							readability: 92,
							technicalAccuracy: 89,
							exampleCoverage: 85,
						},
						generationNotes: ["Generated with Google Gemini"],
					}),
					usage: { totalTokens: 2000 },
				});

			// Test the mixed-provider pipeline
			const architectureResult = await openaiArchitect.planArchitecture(
				mockConcepts,
				mockAlgorithmSpecs,
			);

			const codeResult = await anthropicCoder.generateCode(
				architectureResult.data!.architecture,
				mockAlgorithmSpecs,
			);

			const documentationResult = await googleDocumenter.generateDocumentation(
				codeResult.data!.codebase,
				architectureResult.data!.architecture,
			);

			expect(architectureResult.success).toBe(true);
			expect(codeResult.success).toBe(true);
			expect(documentationResult.success).toBe(true);

			// Verify each agent used its configured provider
			expect(architectureResult.metadata?.provider).toBe("openai");
			expect(codeResult.metadata?.provider).toBe("anthropic");
			expect(documentationResult.metadata?.provider).toBe("google");
		});
	});
});
