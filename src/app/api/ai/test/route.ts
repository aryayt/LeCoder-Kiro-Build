import { type NextRequest, NextResponse } from "next/server";
import { createConceptExtractor } from "~/lib/ai";

/**
 * Test endpoint for AI functionality
 * GET /api/ai/test - Test concept extraction with sample data
 */
export async function GET() {
	try {
		const sampleText = `
    Title: Machine Learning for Image Classification
    
    Abstract: This paper presents a convolutional neural network approach for image classification tasks.
    We use ResNet architecture with transfer learning to achieve high accuracy on the CIFAR-10 dataset.
    
    Methodology: We implemented a CNN using PyTorch framework with Adam optimizer and cross-entropy loss.
    The model was trained for 100 epochs with a learning rate of 0.001.
    
    Results: Our approach achieved 95.2% accuracy on the test set.
    `;

		// Test with Google Gemini (free tier)
		const extractor = createConceptExtractor("google");

		const result = await extractor.extractConcepts(sampleText);

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: "AI concept extraction successful",
				data: result.data,
				metadata: result.metadata,
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: result.error,
					metadata: result.metadata,
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("AI test endpoint error:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

/**
 * POST /api/ai/test - Test concept extraction with custom text
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { text, provider = "google" } = body;

		if (!text || typeof text !== "string") {
			return NextResponse.json(
				{
					success: false,
					error: "Text content is required",
				},
				{ status: 400 },
			);
		}

		if (text.length > 10000) {
			return NextResponse.json(
				{
					success: false,
					error: "Text content too long (max 10,000 characters)",
				},
				{ status: 400 },
			);
		}

		const validProviders = ["google", "openai", "anthropic"];
		if (!validProviders.includes(provider)) {
			return NextResponse.json(
				{
					success: false,
					error: `Invalid provider. Must be one of: ${validProviders.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		const extractor = createConceptExtractor(
			provider as "google" | "openai" | "anthropic",
		);
		const result = await extractor.extractConcepts(text);

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: "AI concept extraction successful",
				data: result.data,
				metadata: result.metadata,
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: result.error,
					metadata: result.metadata,
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("AI test POST endpoint error:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
