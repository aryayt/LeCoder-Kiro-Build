"use client";

interface DashboardLayoutProps {
	children: React.ReactNode;
	title?: string;
	description?: string;
}

export function DashboardLayout({
	children,
	title = "Dashboard",
	description = "Manage your research paper projects and track their progress.",
}: DashboardLayoutProps) {
	return (
		<div className="min-h-screen bg-gray-50">
			<main className="px-4 py-8 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					{/* Header */}
					<div className="mb-8">
						<h1 className="font-bold text-3xl text-gray-900">{title}</h1>
						{description && <p className="mt-2 text-gray-600">{description}</p>}
					</div>

					{/* Content */}
					{children}
				</div>
			</main>
		</div>
	);
}
