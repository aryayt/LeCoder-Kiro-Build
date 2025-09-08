import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { AIProvider } from "~/lib/ai/base-agent";
import { ApiKeyService } from "~/lib/services/api-key-service";

const TestApiKeySchema = z.object({
	provider: z.enum(["GOOGLE", "OPENAI", "ANTHROPIC"]),
	apiKey: z.string().min(20).max(200),
});

/**
 * POST /api/user/api-keys/test - Test an API key without storing it
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = TestApiKeySchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid request data",
					details: validation.error.errors,
				},
				{ status: 400 },
			);
		}

		const { provider, apiKey } = validation.data;

		// Test the API key
		const isValid = await ApiKeyService.testApiKey(
			provider as AIProvider,
			apiKey,
		);

		if (isValid) {
			return NextResponse.json({
				success: true,
				message: `${provider} API key is working correctly`,
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: `${provider} API key test failed. Please check your key and try again.`,
				},
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error("Error testing API key:", error);

		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to test API key",
			},
			{ status: 500 },
		);
	}
}
