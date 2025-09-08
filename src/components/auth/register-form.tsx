"use client";

import { useState } from "react";
import { z } from "zod";
import { signUp } from "~/lib/auth-client";
import { type RegisterFormData, registerSchema } from "~/lib/auth/validation";

export function RegisterForm() {
	const [formData, setFormData] = useState<RegisterFormData>({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
	const [generalError, setGeneralError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleInputChange = (field: keyof RegisterFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear field-specific error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const validateForm = (): boolean => {
		try {
			registerSchema.parse(formData);
			setErrors({});
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors: Partial<RegisterFormData> = {};
				for (const issue of error.issues) {
					const field = issue.path[0] as keyof RegisterFormData;
					fieldErrors[field] = issue.message;
				}
				setErrors(fieldErrors);
			}
			return false;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setGeneralError("");

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			const result = await signUp.email({
				email: formData.email,
				password: formData.password,
				name: formData.name,
			});

			if (result.error) {
				setGeneralError(result.error.message || "Registration failed");
			} else {
				setSuccess(true);
				// Redirect will be handled by Better Auth
				setTimeout(() => {
					window.location.href = "/dashboard";
				}, 1500);
			}
		} catch (err) {
			setGeneralError("An unexpected error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	if (success) {
		return (
			<div className="mx-auto w-full max-w-md text-center">
				<div className="rounded-md border border-green-200 bg-green-50 p-4">
					<div className="flex">
						<div className="flex-shrink-0">
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
						</div>
						<div className="ml-3">
							<h3 className="font-medium text-green-800 text-sm">
								Registration successful!
							</h3>
							<div className="mt-2 text-green-700 text-sm">
								<p>You have been registered and logged in. Redirecting...</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-md">
			<form onSubmit={handleSubmit} className="space-y-4">
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
						Email
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
					{errors.email && (
						<p className="mt-1 text-red-600 text-sm">{errors.email}</p>
					)}
				</div>

				<div>
					<label
						htmlFor="password"
						className="block font-medium text-gray-700 text-sm"
					>
						Password
					</label>
					<input
						id="password"
						type="password"
						value={formData.password}
						onChange={(e) => handleInputChange("password", e.target.value)}
						className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
							errors.password
								? "border-red-300 focus:border-red-500 focus:ring-red-500"
								: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
						}`}
						disabled={isLoading}
						autoComplete="new-password"
					/>
					{errors.password ? (
						<p className="mt-1 text-red-600 text-sm">{errors.password}</p>
					) : (
						<p className="mt-1 text-gray-500 text-sm">
							Must contain uppercase, lowercase, and number. At least 8
							characters.
						</p>
					)}
				</div>

				<div>
					<label
						htmlFor="confirmPassword"
						className="block font-medium text-gray-700 text-sm"
					>
						Confirm Password
					</label>
					<input
						id="confirmPassword"
						type="password"
						value={formData.confirmPassword}
						onChange={(e) =>
							handleInputChange("confirmPassword", e.target.value)
						}
						className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
							errors.confirmPassword
								? "border-red-300 focus:border-red-500 focus:ring-red-500"
								: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
						}`}
						disabled={isLoading}
						autoComplete="new-password"
					/>
					{errors.confirmPassword && (
						<p className="mt-1 text-red-600 text-sm">
							{errors.confirmPassword}
						</p>
					)}
				</div>

				{generalError && (
					<div className="rounded-md border border-red-200 bg-red-50 p-3">
						<div className="flex">
							<div className="flex-shrink-0">
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
							</div>
							<div className="ml-3">
								<p className="text-red-800 text-sm">{generalError}</p>
							</div>
						</div>
					</div>
				)}

				<button
					type="submit"
					disabled={isLoading}
					className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
				>
					{isLoading ? "Creating account..." : "Create Account"}
				</button>
			</form>
		</div>
	);
}
