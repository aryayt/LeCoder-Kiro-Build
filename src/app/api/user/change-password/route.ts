import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/lib/auth";
import { db } from "~/server/db";

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			"Password must contain at least one uppercase letter, one lowercase letter, and one number",
		),
});

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = changePasswordSchema.parse(body);

		// Get user with current password
		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { id: true, password: true },
		});

		if (!user || !user.password) {
			return NextResponse.json(
				{ error: "User not found or no password set" },
				{ status: 404 },
			);
		}

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(
			validatedData.currentPassword,
			user.password,
		);

		if (!isCurrentPasswordValid) {
			return NextResponse.json(
				{ error: "Current password is incorrect" },
				{ status: 400 },
			);
		}

		// Hash new password
		const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);

		// Update password in database
		await db.user.update({
			where: { id: session.user.id },
			data: {
				password: hashedNewPassword,
				updatedAt: new Date(),
			},
		});

		return NextResponse.json({
			message: "Password changed successfully",
		});
	} catch (error) {
		console.error("Password change error:", error);

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
