"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "~/components/auth/user-menu";

export function Navigation() {
	const pathname = usePathname();

	// Don't show navigation on auth pages
	if (pathname.startsWith("/auth/")) {
		return null;
	}

	return (
		<nav className="border-gray-200 border-b bg-white shadow-sm">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 justify-between">
					<div className="flex items-center">
						<Link href="/" className="flex-shrink-0">
							<h1 className="font-bold text-2xl text-indigo-600">LeCodeR</h1>
						</Link>

						<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
							<Link
								href="/"
								className={`inline-flex items-center border-b-2 px-1 pt-1 font-medium text-sm ${
									pathname === "/"
										? "border-indigo-500 text-gray-900"
										: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
								}`}
							>
								Home
							</Link>
							<Link
								href="/dashboard"
								className={`inline-flex items-center border-b-2 px-1 pt-1 font-medium text-sm ${
									pathname === "/dashboard"
										? "border-indigo-500 text-gray-900"
										: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
								}`}
							>
								Dashboard
							</Link>
						</div>
					</div>

					<div className="flex items-center">
						<UserMenu />
					</div>
				</div>
			</div>
		</nav>
	);
}
