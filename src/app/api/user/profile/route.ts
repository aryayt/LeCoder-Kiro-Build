import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth";
import { db } from "~/server/db";

const updateProfileSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.string().email().optional(),
});

export async function PATCH(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = updateProfileSchema.parse(body);

		// Update user in database
		const updatedUser = await db.user.update({
			where: { id: session.user.id },
			data: {
				...(validatedData.name && { name: validatedData.name }),
				...(validatedData.email && { email: validatedData.email }),
				updatedAt: new Date(),
			},
		});

		return NextResponse.json({
			message: "Profile updated successfully",
			user: {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
			},
		});
	} catch (error) {
		console.error("Profile update error:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input data", details: error.errors },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
