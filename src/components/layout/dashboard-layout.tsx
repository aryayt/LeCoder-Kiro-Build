'use client';

import Link from 'next/link';
import { useAuth } from '~/components/auth/auth-provider';

interface DashboardLayoutProps {
	children: React.ReactNode;
	title?: string;
	description?: string;
	actions?: React.ReactNode;
	breadcrumbs?: Array<{
		label: string;
		href?: string;
	}>;
}

export function DashboardLayout({
	children,
	title = 'Dashboard',
	description = 'Manage your research paper projects and track their progress.',
	actions,
	breadcrumbs,
}: DashboardLayoutProps) {
	const { session } = useAuth();

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="px-4 py-8 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					{/* Breadcrumbs */}
					{breadcrumbs && breadcrumbs.length > 0 && (
						<nav className="mb-6 flex" aria-label="Breadcrumb">
							<ol className="flex items-center space-x-4">
								{breadcrumbs.map((crumb, index) => (
									<li key={crumb.label + (crumb.href || '')}>
										{index === 0 ? (
											crumb.href ? (
												<Link href={crumb.href} className="text-gray-400 hover:text-gray-500">
													{crumb.label}
												</Link>
											) : (
												<span className="text-gray-400">{crumb.label}</span>
											)
										) : (
											<div className="flex items-center">
												<svg
													className="h-5 w-5 flex-shrink-0 text-gray-300"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<title>Separator</title>
													<path
														fillRule="evenodd"
														d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
														clipRule="evenodd"
													/>
												</svg>
												{crumb.href ? (
													<Link
														href={crumb.href}
														className="ml-4 font-medium text-gray-500 text-sm hover:text-gray-700"
													>
														{crumb.label}
													</Link>
												) : (
													<span className="ml-4 font-medium text-gray-500 text-sm">
														{crumb.label}
													</span>
												)}
											</div>
										)}
									</li>
								))}
							</ol>
						</nav>
					)}

					{/* Header */}
					<div className="mb-8">
						<div className="flex items-start justify-between">
							<div className="min-w-0 flex-1">
								<h1 className="font-bold text-3xl text-gray-900">{title}</h1>
								{description && <p className="mt-2 text-gray-600">{description}</p>}

								{/* User context info */}
								{session?.user && (
									<div className="mt-4 flex items-center space-x-4 text-gray-500 text-sm">
										<div className="flex items-center">
											<svg
												className="mr-1 h-4 w-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<title>User</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
												/>
											</svg>
											{session.user.name || session.user.email}
										</div>
										<div className="flex items-center">
											<svg
												className="mr-1 h-4 w-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<title>Clock</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											Last accessed: {new Date().toLocaleDateString()}
										</div>
									</div>
								)}
							</div>

							{/* Actions */}
							{actions && <div className="ml-4 flex-shrink-0">{actions}</div>}
						</div>
					</div>

					{/* Content */}
					{children}
				</div>
			</main>
		</div>
	);
}
