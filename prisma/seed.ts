import { PrismaClient, ProjectStatus, StageStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Starting database seeding...");

	// Create sample users
	const user1 = await prisma.user.upsert({
		where: { email: "researcher@example.com" },
		update: {},
		create: {
			email: "researcher@example.com",
			name: "Dr. Jane Smith",
			image:
				"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
		},
	});

	const user2 = await prisma.user.upsert({
		where: { email: "student@example.com" },
		update: {},
		create: {
			email: "student@example.com",
			name: "John Doe",
			image:
				"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
		},
	});

	// Create test user account
	const testUser = await prisma.user.upsert({
		where: { email: "aryateja2106@gmail.com" },
		update: {},
		create: {
			email: "aryateja2106@gmail.com",
			name: "aryateja",
			image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
		},
	});

	console.log("✅ Created sample users");

	// Create sample projects
	const project1 = await prisma.project.create({
		data: {
			userId: user1.id,
			title: "Deep Learning for Image Classification",
			paperContent: `
        Abstract: This paper presents a novel approach to image classification using deep convolutional neural networks.
        We propose a new architecture that combines residual connections with attention mechanisms to achieve
        state-of-the-art performance on ImageNet dataset.
        
        Introduction: Image classification has been a fundamental problem in computer vision...
        
        Methodology: Our approach consists of three main components:
        1. Feature extraction using ResNet-50 backbone
        2. Attention mechanism for feature refinement
        3. Multi-scale feature fusion for final classification
        
        Results: We achieved 95.2% accuracy on ImageNet validation set, surpassing previous methods...
      `,
			status: ProjectStatus.COMPLETED,
			currentStage: 6,
			metadata: {
				fileName: "deep_learning_image_classification.pdf",
				fileSize: 2048576,
				pageCount: 12,
				authors: ["Dr. Jane Smith", "Prof. Alan Turing"],
				abstract:
					"This paper presents a novel approach to image classification using deep convolutional neural networks.",
				keywords: [
					"deep learning",
					"image classification",
					"attention mechanism",
					"ResNet",
				],
			},
		},
	});

	const project2 = await prisma.project.create({
		data: {
			userId: user2.id,
			title: "Natural Language Processing with Transformers",
			paperContent: `
        Abstract: We explore the application of transformer architectures for various NLP tasks including
        sentiment analysis, named entity recognition, and text summarization.
        
        Introduction: Transformer models have revolutionized natural language processing...
        
        Architecture: Our model is based on the BERT architecture with the following modifications:
        1. Custom tokenization for domain-specific vocabulary
        2. Additional attention heads for better context understanding
        3. Fine-tuning strategy for downstream tasks
        
        Experiments: We evaluated our model on multiple benchmarks...
      `,
			status: ProjectStatus.PROCESSING,
			currentStage: 3,
			metadata: {
				fileName: "nlp_transformers.pdf",
				fileSize: 1536000,
				pageCount: 8,
				authors: ["John Doe", "Dr. Emily Chen"],
				abstract:
					"We explore the application of transformer architectures for various NLP tasks.",
				keywords: ["NLP", "transformers", "BERT", "sentiment analysis"],
			},
		},
	});

	const project3 = await prisma.project.create({
		data: {
			title: "Reinforcement Learning for Game AI",
			paperContent: `
        Abstract: This work presents a reinforcement learning approach for training AI agents
        to play complex strategy games using deep Q-networks and policy gradient methods.
        
        Background: Game AI has been a challenging domain for artificial intelligence...
        
        Method: We implement a hybrid approach combining:
        1. Deep Q-Network (DQN) for value estimation
        2. Policy gradient methods for action selection
        3. Monte Carlo Tree Search for planning
        
        Results: Our agent achieved superhuman performance on multiple game environments...
      `,
			status: ProjectStatus.UPLOADED,
			currentStage: 0,
			metadata: {
				fileName: "rl_game_ai.pdf",
				fileSize: 3072000,
				pageCount: 15,
				authors: ["Anonymous Researcher"],
				abstract:
					"This work presents a reinforcement learning approach for training AI agents to play complex strategy games.",
				keywords: [
					"reinforcement learning",
					"game AI",
					"DQN",
					"policy gradient",
				],
			},
		},
	});

	// Create test project for aryateja
	const testProject = await prisma.project.create({
		data: {
			userId: testUser.id,
			title: "Machine Learning for Predictive Analytics",
			paperContent: `
        Abstract: This paper explores the application of machine learning algorithms for predictive analytics
        in business intelligence. We compare various algorithms including Random Forest, SVM, and Neural Networks.
        
        Introduction: Predictive analytics has become crucial for modern businesses...
        
        Methodology: We implemented and compared the following approaches:
        1. Random Forest for ensemble learning
        2. Support Vector Machines for classification
        3. Neural Networks for complex pattern recognition
        
        Results: Our experiments show that ensemble methods achieve the best performance...
      `,
			status: ProjectStatus.PROCESSING,
			currentStage: 2,
			metadata: {
				fileName: "ml_predictive_analytics.pdf",
				fileSize: 1800000,
				pageCount: 10,
				authors: ["aryateja"],
				abstract:
					"This paper explores the application of machine learning algorithms for predictive analytics in business intelligence.",
				keywords: ["machine learning", "predictive analytics", "random forest", "SVM"],
			},
		},
	});

	console.log("✅ Created sample projects");

	// Create pipeline stages for completed project
	const stages = [
		{ name: "Concept Extraction", number: 1 },
		{ name: "Algorithm Analysis", number: 2 },
		{ name: "Architecture Planning", number: 3 },
		{ name: "Implementation Planning", number: 4 },
		{ name: "Code Generation", number: 5 },
		{ name: "Documentation Generation", number: 6 },
	];

	for (const stage of stages) {
		await prisma.pipelineStage.create({
			data: {
				projectId: project1.id,
				stageNumber: stage.number,
				stageName: stage.name,
				status: StageStatus.COMPLETED,
				inputData: {
					stage: stage.number,
					description: `Input data for ${stage.name}`,
				},
				outputData: {
					stage: stage.number,
					result: `Completed ${stage.name} successfully`,
					concepts:
						stage.number === 1 ? ["CNN", "ResNet", "Attention"] : undefined,
					algorithms:
						stage.number === 2
							? ["Convolutional Neural Network", "Residual Connections"]
							: undefined,
				},
				startedAt: new Date(Date.now() - (6 - stage.number) * 60000),
				completedAt: new Date(Date.now() - (6 - stage.number) * 60000 + 30000),
			},
		});
	}

	// Create pipeline stages for processing project (partial completion)
	for (let i = 1; i <= 3; i++) {
		const stage = stages[i - 1];
		if (!stage) continue;
		await prisma.pipelineStage.create({
			data: {
				projectId: project2.id,
				stageNumber: stage.number,
				stageName: stage.name,
				status: i === 3 ? StageStatus.PROCESSING : StageStatus.COMPLETED,
				inputData: {
					stage: stage.number,
					description: `Input data for ${stage.name}`,
				},
				outputData:
					i < 3
						? {
								stage: stage.number,
								result: `Completed ${stage.name} successfully`,
							}
						: undefined,
				startedAt: new Date(Date.now() - (4 - i) * 60000),
				completedAt:
					i < 3 ? new Date(Date.now() - (4 - i) * 60000 + 30000) : undefined,
			},
		});
	}

	// Create remaining pending stages for processing project
	for (let i = 4; i <= 6; i++) {
		const stage = stages[i - 1];
		if (!stage) continue;
		await prisma.pipelineStage.create({
			data: {
				projectId: project2.id,
				stageNumber: stage.number,
				stageName: stage.name,
				status: StageStatus.PENDING,
			},
		});
	}

	// Create pipeline stages for uploaded project (all pending)
	for (const stage of stages) {
		await prisma.pipelineStage.create({
			data: {
				projectId: project3.id,
				stageNumber: stage.number,
				stageName: stage.name,
				status: StageStatus.PENDING,
			},
		});
	}

	// Create pipeline stages for test user project (partial completion)
	for (let i = 1; i <= 2; i++) {
		const stage = stages[i - 1];
		if (!stage) continue;
		await prisma.pipelineStage.create({
			data: {
				projectId: testProject.id,
				stageNumber: stage.number,
				stageName: stage.name,
				status: i === 2 ? StageStatus.PROCESSING : StageStatus.COMPLETED,
				inputData: {
					stage: stage.number,
					description: `Input data for ${stage.name}`,
				},
				outputData:
					i < 2
						? {
								stage: stage.number,
								result: `Completed ${stage.name} successfully`,
							}
						: undefined,
				startedAt: new Date(Date.now() - (3 - i) * 60000),
				completedAt:
					i < 2 ? new Date(Date.now() - (3 - i) * 60000 + 30000) : undefined,
			},
		});
	}

	// Create remaining pending stages for test user project
	for (let i = 3; i <= 6; i++) {
		const stage = stages[i - 1];
		if (!stage) continue;
		await prisma.pipelineStage.create({
			data: {
				projectId: testProject.id,
				stageNumber: stage.number,
				stageName: stage.name,
				status: StageStatus.PENDING,
			},
		});
	}

	console.log("✅ Created pipeline stages");

	// Create sample generated files for completed project
	const generatedFiles = [
		{
			filePath: "src/models/resnet.py",
			fileContent: `import torch
import torch.nn as nn
import torch.nn.functional as F

class ResNetBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1):
        super(ResNetBlock, self).__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1)
        self.bn2 = nn.BatchNorm2d(out_channels)
        
        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride),
                nn.BatchNorm2d(out_channels)
            )
    
    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)
        out = F.relu(out)
        return out

class ResNet(nn.Module):
    def __init__(self, num_classes=1000):
        super(ResNet, self).__init__()
        self.in_channels = 64
        
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3)
        self.bn1 = nn.BatchNorm2d(64)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        
        self.layer1 = self._make_layer(64, 2, stride=1)
        self.layer2 = self._make_layer(128, 2, stride=2)
        self.layer3 = self._make_layer(256, 2, stride=2)
        self.layer4 = self._make_layer(512, 2, stride=2)
        
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512, num_classes)
    
    def _make_layer(self, out_channels, num_blocks, stride):
        layers = []
        layers.append(ResNetBlock(self.in_channels, out_channels, stride))
        self.in_channels = out_channels
        for _ in range(1, num_blocks):
            layers.append(ResNetBlock(out_channels, out_channels))
        return nn.Sequential(*layers)
    
    def forward(self, x):
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.maxpool(x)
        
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        
        return x`,
			fileType: "python",
		},
		{
			filePath: "src/models/attention.py",
			fileContent: `import torch
import torch.nn as nn
import torch.nn.functional as F

class AttentionModule(nn.Module):
    def __init__(self, in_channels, reduction=16):
        super(AttentionModule, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        
        self.fc = nn.Sequential(
            nn.Conv2d(in_channels, in_channels // reduction, 1, bias=False),
            nn.ReLU(),
            nn.Conv2d(in_channels // reduction, in_channels, 1, bias=False)
        )
        
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        avg_out = self.fc(self.avg_pool(x))
        max_out = self.fc(self.max_pool(x))
        out = avg_out + max_out
        return x * self.sigmoid(out)

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super(SpatialAttention, self).__init__()
        self.conv1 = nn.Conv2d(2, 1, kernel_size, padding=kernel_size//2, bias=False)
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        x_cat = torch.cat([avg_out, max_out], dim=1)
        x_cat = self.conv1(x_cat)
        return x * self.sigmoid(x_cat)`,
			fileType: "python",
		},
		{
			filePath: "requirements.txt",
			fileContent: `torch>=2.0.0
torchvision>=0.15.0
numpy>=1.21.0
pillow>=8.3.0
matplotlib>=3.5.0
scikit-learn>=1.0.0
tqdm>=4.62.0
tensorboard>=2.8.0`,
			fileType: "text",
		},
		{
			filePath: "README.md",
			fileContent: `# Deep Learning for Image Classification

This repository contains the implementation of a novel deep learning approach for image classification using ResNet with attention mechanisms.

## Features

- ResNet-50 backbone with residual connections
- Channel and spatial attention mechanisms
- Multi-scale feature fusion
- State-of-the-art performance on ImageNet

## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd image-classification
\`\`\`

2. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

### Training

\`\`\`python
python train.py --data_path /path/to/imagenet --epochs 100 --batch_size 32
\`\`\`

### Evaluation

\`\`\`python
python evaluate.py --model_path checkpoints/best_model.pth --data_path /path/to/test_data
\`\`\`

## Model Architecture

The model combines:
1. ResNet-50 backbone for feature extraction
2. Channel attention for feature refinement
3. Spatial attention for spatial feature enhancement
4. Multi-scale feature fusion for final classification

## Results

- ImageNet Top-1 Accuracy: 95.2%
- ImageNet Top-5 Accuracy: 97.8%
- Model Parameters: 25.6M
- FLOPs: 4.1G

## Citation

If you use this code in your research, please cite:

\`\`\`bibtex
@article{smith2024deep,
  title={Deep Learning for Image Classification},
  author={Smith, Jane and Turing, Alan},
  journal={Journal of AI Research},
  year={2024}
}
\`\`\``,
			fileType: "markdown",
		},
	];

	for (const file of generatedFiles) {
		await prisma.generatedFile.create({
			data: {
				projectId: project1.id,
				filePath: file.filePath,
				fileContent: file.fileContent,
				fileType: file.fileType,
			},
		});
	}

	console.log("✅ Created sample generated files");

	console.log("🎉 Database seeding completed successfully!");
	console.log(`
  Created:
  - 3 users (including test user: aryateja2106@gmail.com)
  - 4 projects (1 completed, 2 processing, 1 uploaded)
  - 24 pipeline stages
  - 4 generated files
  `);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error("❌ Seeding failed:", e);
		await prisma.$disconnect();
		process.exit(1);
	});
