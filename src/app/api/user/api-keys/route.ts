import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { AIProvider } from "~/lib/ai/base-agent";
import { auth } from "~/lib/auth";
import { ApiKeyService } from "~/lib/services/api-key-service";

const CreateApiKeySchema = z.object({
	provider: z.enum(["GOOGLE", "OPENAI", "ANTHROPIC"]),
	apiKey: z.string().min(20).max(200),
	keyName: z.string().optional(),
});

const UpdateApiKeySchema = z.object({
	keyId: z.string(),
	apiKey: z.string().min(20).max(200).optional(),
	keyName: z.string().optional(),
	isActive: z.boolean().optional(),
});

/**
 * GET /api/user/api-keys - Get all API keys for the current user
 */
export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const apiKeys = await ApiKeyService.getUserApiKeys(session.user.id);

		return NextResponse.json({
			success: true,
			data: apiKeys,
		});
	} catch (error) {
		console.error("Error fetching API keys:", error);

		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to fetch API keys",
			},
			{ status: 500 },
		);
	}
}

/**
 * POST /api/user/api-keys - Create or update an API key
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const validation = CreateApiKeySchema.safeParse(body);

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

		const { provider, apiKey, keyName } = validation.data;

		// Test the API key before storing
		const isValid = await ApiKeyService.testApiKey(
			provider as AIProvider,
			apiKey,
		);

		if (!isValid) {
			return NextResponse.json(
				{
					success: false,
					error: `Invalid or non-functional API key for ${provider}`,
				},
				{ status: 400 },
			);
		}

		const result = await ApiKeyService.createApiKey({
			userId: session.user.id,
			provider: provider as AIProvider,
			apiKey,
			keyName,
		});

		return NextResponse.json({
			success: true,
			message: "API key saved successfully",
			data: result,
		});
	} catch (error) {
		console.error("Error creating API key:", error);

		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to save API key",
			},
			{ status: 500 },
		);
	}
}

/**
 * PUT /api/user/api-keys - Update an existing API key
 */
export async function PUT(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const validation = UpdateApiKeySchema.safeParse(body);

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

		const { keyId, apiKey, keyName, isActive } = validation.data;

		const result = await ApiKeyService.updateApiKey({
			keyId,
			userId: session.user.id,
			apiKey,
			keyName,
			isActive,
		});

		return NextResponse.json({
			success: true,
			message: "API key updated successfully",
			data: result,
		});
	} catch (error) {
		console.error("Error updating API key:", error);

		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to update API key",
			},
			{ status: 500 },
		);
	}
}
