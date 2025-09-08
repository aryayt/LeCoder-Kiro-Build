import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";
import {
	extractTextFromPdf,
	fileToBuffer,
	validatePdfFile,
} from "~/lib/pdf/processor";
import { processPdfForVectorStorage } from "~/lib/vector/embeddings";
import { db } from "~/server/db";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const userId = formData.get("userId") as string | null;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Validate the file
		const validationError = validatePdfFile(file);
		if (validationError) {
			return NextResponse.json(
				{ error: validationError.message, code: validationError.code },
				{ status: 400 },
			);
		}

		// Convert file to buffer for processing
		const buffer = await fileToBuffer(file);

		// Extract text from PDF
		let processingResult;
		let vectorProcessingResult = null;
		let aiProvider: "openai" | "google" = "openai";

		// Determine which AI provider to use based on available API keys
		if (env.OPENAI_API_KEY) {
			aiProvider = "openai";
		} else if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
			aiProvider = "google";
		}

		try {
			processingResult = await extractTextFromPdf(buffer, file.name);
			console.log("PDF processing successful for:", file.name);

			// Process for vector storage if we have meaningful content
			if (processingResult.text.trim().length > 100) {
				try {
					console.log("Processing PDF for vector storage...");
					vectorProcessingResult = await processPdfForVectorStorage(
						processingResult.text,
						"temp-id", // Will be updated after project creation
						file.name,
						aiProvider,
					);
					console.log("Vector processing successful:", vectorProcessingResult);
				} catch (vectorError) {
					console.error("Vector processing failed:", vectorError);
					// Continue without vector storage - not critical for basic functionality
				}
			}
		} catch (error) {
			console.error("Server-side PDF processing failed:", error);

			// Fallback: Create a project with basic metadata and placeholder content
			// This allows the upload to succeed even if PDF parsing fails
			processingResult = {
				text: `This is a placeholder for the research paper content from ${file.name}. 

The PDF text extraction failed, but you can still proceed with the AI analysis pipeline. 
Please ensure your PDF contains extractable text (not just images) for better results.

You can try uploading a different PDF file or contact support if this issue persists.

Error details: ${error instanceof Error ? error.message : "Unknown error"}`,
				metadata: {
					title: file.name.replace(".pdf", ""),
					author: undefined,
					pages: 1,
					fileSize: file.size,
					fileName: file.name,
				},
			};

			console.log("Using fallback processing result for:", file.name);
		}

		// Create project in database
		const project = await db.project.create({
			data: {
				title: processingResult.metadata.title || file.name.replace(".pdf", ""),
				paperContent: processingResult.text,
				metadata: {
					fileName: processingResult.metadata.fileName,
					fileSize: processingResult.metadata.fileSize,
					pageCount: processingResult.metadata.pages,
					authors: processingResult.metadata.author
						? [processingResult.metadata.author]
						: [],
					// Add AI processing metadata
					aiProvider,
					vectorProcessing: vectorProcessingResult
						? {
								chunksCount: vectorProcessingResult.chunksCount,
								embeddingsGenerated: vectorProcessingResult.embeddingsGenerated,
								estimatedTokens: vectorProcessingResult.totalTokensEstimate,
							}
						: null,
					extractedTextLength: processingResult.text.length,
				},
				userId: userId || null,
				status: "UPLOADED",
				currentStage: 0,
			},
		});

		// Update vector storage with actual project ID
		if (vectorProcessingResult) {
			try {
				await processPdfForVectorStorage(
					processingResult.text,
					project.id,
					file.name,
					aiProvider,
				);
				console.log(`Updated vector storage with project ID: ${project.id}`);
			} catch (error) {
				console.error(
					"Failed to update vector storage with project ID:",
					error,
				);
			}
		}

		// Create the initial pipeline stages
		const stages = [
			{
				name: "Concept Extraction",
				description: "Extracting core concepts and research objectives",
			},
			{
				name: "Algorithm Analysis",
				description: "Identifying algorithms and methodologies",
			},
			{
				name: "Architecture Planning",
				description: "Determining system structure and requirements",
			},
			{
				name: "Implementation Planning",
				description: "Creating detailed implementation plan",
			},
			{
				name: "Code Generation",
				description: "Generating complete, executable code",
			},
			{
				name: "Documentation Generation",
				description: "Creating setup instructions and documentation",
			},
		];

		await db.pipelineStage.createMany({
			data: stages.map((stage, index) => ({
				projectId: project.id,
				stageNumber: index + 1,
				stageName: stage.name,
				status: "PENDING",
				inputData: {},
				outputData: {},
			})),
		});

		return NextResponse.json({
			success: true,
			project: {
				id: project.id,
				title: project.title,
				status: project.status,
				metadata: project.metadata,
				createdAt: project.createdAt,
			},
			processing: {
				aiProvider,
				textExtracted: processingResult.text.length > 100,
				vectorProcessing: vectorProcessingResult !== null,
				...vectorProcessingResult,
			},
			message: "PDF uploaded and processed successfully",
		});
	} catch (error) {
		console.error("Upload error:", error);

		return NextResponse.json(
			{
				error: "Internal server error during upload",
				code: "UPLOAD_ERROR",
			},
			{ status: 500 },
		);
	}
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
