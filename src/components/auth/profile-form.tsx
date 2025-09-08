"use client";

import { useState } from "react";
import { z } from "zod";
import type { User } from "~/lib/auth";
import {
	type ProfileUpdateData,
	profileUpdateSchema,
} from "~/lib/auth/validation";

interface ProfileFormProps {
	user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
	const [formData, setFormData] = useState<ProfileUpdateData>({
		name: user.name || "",
		email: user.email,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Partial<ProfileUpdateData>>({});
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState<"success" | "error" | "">("");

	const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear field-specific error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
		// Clear general message when user makes changes
		if (message) {
			setMessage("");
			setMessageType("");
		}
	};

	const validateForm = (): boolean => {
		try {
			profileUpdateSchema.parse(formData);
			setErrors({});
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors: Partial<ProfileUpdateData> = {};
				for (const issue of error.issues) {
					const field = issue.path[0] as keyof ProfileUpdateData;
					fieldErrors[field] = issue.message;
				}
				setErrors(fieldErrors);
			}
			return false;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage("");

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/user/profile", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				setMessage("Profile updated successfully!");
				setMessageType("success");
			} else {
				const error = await response.json();
				setMessage(error.message || "Failed to update profile");
				setMessageType("error");
			}
		} catch (error) {
			setMessage("An unexpected error occurred. Please try again.");
			setMessageType("error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<label
					htmlFor="name"
					className="block font-medium text-gray-700 text-sm"
				>
					Full Name
				</label>
				<input
					id="name"
					type="text"
					value={formData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
						errors.name
							? "border-red-300 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
					}`}
					disabled={isLoading}
					autoComplete="name"
				/>
				{errors.name && (
					<p className="mt-1 text-red-600 text-sm">{errors.name}</p>
				)}
			</div>

			<div>
				<label
					htmlFor="email"
					className="block font-medium text-gray-700 text-sm"
				>
					Email Address
				</label>
				<input
					id="email"
					type="email"
					value={formData.email}
					onChange={(e) => handleInputChange("email", e.target.value)}
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
						errors.email
							? "border-red-300 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
					}`}
					disabled={isLoading}
					autoComplete="email"
				/>
				{errors.email ? (
					<p className="mt-1 text-red-600 text-sm">{errors.email}</p>
				) : (
					<p className="mt-1 text-gray-500 text-sm">
						Changing your email will require verification
					</p>
				)}
			</div>

			{message && (
				<div
					className={`rounded-md p-4 ${
						messageType === "success"
							? "border border-green-200 bg-green-50 text-green-800"
							: "border border-red-200 bg-red-50 text-red-800"
					}`}
				>
					{message}
				</div>
			)}

			<div className="flex justify-end">
				<button
					type="submit"
					disabled={isLoading}
					className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
				>
					{isLoading ? "Saving..." : "Save Changes"}
				</button>
			</div>
		</form>
	);
}
