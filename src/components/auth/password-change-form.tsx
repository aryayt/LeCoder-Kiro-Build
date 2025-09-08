"use client";

import { useState } from "react";
import { z } from "zod";
import {
	type PasswordChangeData,
	passwordChangeSchema,
} from "~/lib/auth/validation";

export function PasswordChangeForm() {
	const [formData, setFormData] = useState<PasswordChangeData>({
		currentPassword: "",
		newPassword: "",
		confirmNewPassword: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Partial<PasswordChangeData>>({});
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState<"success" | "error" | "">("");

	const handleInputChange = (
		field: keyof PasswordChangeData,
		value: string,
	) => {
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
			passwordChangeSchema.parse(formData);
			setErrors({});
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors: Partial<PasswordChangeData> = {};
				for (const issue of error.issues) {
					const field = issue.path[0] as keyof PasswordChangeData;
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
			const response = await fetch("/api/user/change-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					currentPassword: formData.currentPassword,
					newPassword: formData.newPassword,
				}),
			});

			if (response.ok) {
				setMessage("Password changed successfully!");
				setMessageType("success");
				// Reset form
				setFormData({
					currentPassword: "",
					newPassword: "",
					confirmNewPassword: "",
				});
			} else {
				const error = await response.json();
				setMessage(error.message || "Failed to change password");
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
					htmlFor="currentPassword"
					className="block font-medium text-gray-700 text-sm"
				>
					Current Password
				</label>
				<input
					id="currentPassword"
					type="password"
					value={formData.currentPassword}
					onChange={(e) => handleInputChange("currentPassword", e.target.value)}
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
						errors.currentPassword
							? "border-red-300 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
					}`}
					disabled={isLoading}
					autoComplete="current-password"
				/>
				{errors.currentPassword && (
					<p className="mt-1 text-red-600 text-sm">{errors.currentPassword}</p>
				)}
			</div>

			<div>
				<label
					htmlFor="newPassword"
					className="block font-medium text-gray-700 text-sm"
				>
					New Password
				</label>
				<input
					id="newPassword"
					type="password"
					value={formData.newPassword}
					onChange={(e) => handleInputChange("newPassword", e.target.value)}
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
						errors.newPassword
							? "border-red-300 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
					}`}
					disabled={isLoading}
					autoComplete="new-password"
				/>
				{errors.newPassword ? (
					<p className="mt-1 text-red-600 text-sm">{errors.newPassword}</p>
				) : (
					<p className="mt-1 text-gray-500 text-sm">
						Must contain uppercase, lowercase, and number. At least 8
						characters.
					</p>
				)}
			</div>

			<div>
				<label
					htmlFor="confirmNewPassword"
					className="block font-medium text-gray-700 text-sm"
				>
					Confirm New Password
				</label>
				<input
					id="confirmNewPassword"
					type="password"
					value={formData.confirmNewPassword}
					onChange={(e) =>
						handleInputChange("confirmNewPassword", e.target.value)
					}
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
						errors.confirmNewPassword
							? "border-red-300 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
					}`}
					disabled={isLoading}
					autoComplete="new-password"
				/>
				{errors.confirmNewPassword && (
					<p className="mt-1 text-red-600 text-sm">
						{errors.confirmNewPassword}
					</p>
				)}
			</div>

			{message && (
				<div
					className={`rounded-md p-4 ${
						messageType === "success"
							? "border border-green-200 bg-green-50"
							: "border border-red-200 bg-red-50"
					}`}
				>
					<div className="flex">
						<div className="flex-shrink-0">
							{messageType === "success" ? (
								<svg
									className="h-5 w-5 text-green-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
							) : (
								<svg
									className="h-5 w-5 text-red-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clipRule="evenodd"
									/>
								</svg>
							)}
						</div>
						<div className="ml-3">
							<p
								className={`text-sm ${
									messageType === "success" ? "text-green-800" : "text-red-800"
								}`}
							>
								{message}
							</p>
						</div>
					</div>
				</div>
			)}

			<div className="flex justify-end">
				<button
					type="submit"
					disabled={isLoading}
					className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
				>
					{isLoading ? "Changing Password..." : "Change Password"}
				</button>
			</div>
		</form>
	);
}
