"use client";

import { useState } from "react";
import { z } from "zod";
import { signIn } from "~/lib/auth-client";
import { type LoginFormData, loginSchema } from "~/lib/auth/validation";

export function LoginForm() {
	const [formData, setFormData] = useState<LoginFormData>({
		email: "",
		password: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Partial<LoginFormData>>({});
	const [generalError, setGeneralError] = useState("");

	const handleInputChange = (field: keyof LoginFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear field-specific error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const validateForm = (): boolean => {
		try {
			loginSchema.parse(formData);
			setErrors({});
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors: Partial<LoginFormData> = {};
				for (const issue of error.issues) {
					const field = issue.path[0] as keyof LoginFormData;
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
			const result = await signIn.email({
				email: formData.email,
				password: formData.password,
			});

			if (result.error) {
				setGeneralError(result.error.message || "Login failed");
			} else {
				// Redirect will be handled by Better Auth
				window.location.href = "/dashboard";
			}
		} catch (err) {
			setGeneralError("An unexpected error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			await signIn.social({
				provider: "google",
				callbackURL: "/",
			});
		} catch (err) {
			setGeneralError("Google sign-in failed");
			setIsLoading(false);
		}
	};

	const handleGitHubSignIn = async () => {
		setIsLoading(true);
		try {
			await signIn.social({
				provider: "github",
				callbackURL: "/",
			});
		} catch (err) {
			setGeneralError("GitHub sign-in failed");
			setIsLoading(false);
		}
	};

	return (
		<div className="mx-auto w-full max-w-md">
			<form onSubmit={handleSubmit} className="space-y-4">
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
						autoComplete="current-password"
					/>
					{errors.password && (
						<p className="mt-1 text-red-600 text-sm">{errors.password}</p>
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
					{isLoading ? "Signing in..." : "Sign In"}
				</button>

				<div className="text-center">
					<a
						href="/auth/forgot-password"
						className="font-medium text-indigo-600 text-sm hover:text-indigo-500"
					>
						Forgot your password?
					</a>
				</div>
			</form>

			<div className="mt-6">
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-gray-300 border-t" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="bg-white px-2 text-gray-500">
							Or continue with
						</span>
					</div>
				</div>

				<div className="mt-6 grid grid-cols-2 gap-3">
					<button
						onClick={handleGoogleSignIn}
						disabled={isLoading}
						className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-500 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-50"
					>
						<svg className="h-5 w-5" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						<span className="ml-2">Google</span>
					</button>

					<button
						onClick={handleGitHubSignIn}
						disabled={isLoading}
						className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-500 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-50"
					>
						<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
						</svg>
						<span className="ml-2">GitHub</span>
					</button>
				</div>
			</div>
		</div>
	);
}
