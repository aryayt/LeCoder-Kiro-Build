"use client";

import { useState } from "react";
import { signOut } from "~/lib/auth-client";
import { useAuth } from "./auth-provider";

export function UserMenu() {
	const { session, isLoading } = useAuth();
	const [isOpen, setIsOpen] = useState(false);

	if (isLoading) {
		return (
			<div className="animate-pulse">
				<div className="h-8 w-8 rounded-full bg-gray-300" />
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex items-center space-x-4">
				<a
					href="/auth/login"
					className="rounded-md px-3 py-2 font-medium text-gray-700 text-sm hover:text-gray-900"
				>
					Sign In
				</a>
				<a
					href="/auth/register"
					className="rounded-md bg-indigo-600 px-3 py-2 font-medium text-sm text-white hover:bg-indigo-700"
				>
					Sign Up
				</a>
			</div>
		);
	}

	const handleSignOut = async () => {
		try {
			await signOut();
			window.location.href = "/";
		} catch (error) {
			console.error("Sign out error:", error);
		}
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center space-x-2 rounded-md p-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
			>
				{session.user.image ? (
					<img
						src={session.user.image}
						alt={session.user.name || "User"}
						className="h-8 w-8 rounded-full"
					/>
				) : (
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
						<span className="font-medium text-sm text-white">
							{session.user.name?.charAt(0).toUpperCase() ||
								session.user.email?.charAt(0).toUpperCase()}
						</span>
					</div>
				)}
				<span className="font-medium text-sm">
					{session.user.name || session.user.email}
				</span>
				<svg
					className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<title>User menu</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
					<a
						href="/dashboard"
						className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
						onClick={() => setIsOpen(false)}
					>
						Dashboard
					</a>
					<a
						href="/profile"
						className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-100"
						onClick={() => setIsOpen(false)}
					>
						Profile Settings
					</a>
					<hr className="my-1" />
					<button
						type="button"
						onClick={handleSignOut}
						className="block w-full px-4 py-2 text-left text-gray-700 text-sm hover:bg-gray-100"
					>
						Sign Out
					</button>
				</div>
			)}
		</div>
	);
}
