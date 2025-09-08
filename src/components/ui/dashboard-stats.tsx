"use client";

import type { Project } from "~/types/project";

interface DashboardStatsProps {
	projects: Project[];
	isLoading?: boolean;
}

export function DashboardStats({
	projects,
	isLoading = false,
}: DashboardStatsProps) {
	const stats = {
		total: projects.length,
		processing: projects.filter((p) => p.status === "PROCESSING").length,
		completed: projects.filter((p) => p.status === "COMPLETED").length,
		error: projects.filter((p) => p.status === "ERROR").length,
	};

	const statCards = [
		{
			title: "Total Projects",
			value: stats.total,
			description: stats.total === 0 ? "No projects yet" : "All time",
			color: "text-indigo-600",
			bgColor: "bg-indigo-50",
			icon: (
				<svg
					className="h-6 w-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			),
		},
		{
			title: "In Progress",
			value: stats.processing,
			description:
				stats.processing === 0 ? "None processing" : "Currently processing",
			color: "text-yellow-600",
			bgColor: "bg-yellow-50",
			icon: (
				<svg
					className="h-6 w-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			),
		},
		{
			title: "Completed",
			value: stats.completed,
			description:
				stats.completed === 0 ? "None completed" : "Ready for download",
			color: "text-green-600",
			bgColor: "bg-green-50",
			icon: (
				<svg
					className="h-6 w-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			),
		},
		{
			title: "Errors",
			value: stats.error,
			description: stats.error === 0 ? "No errors" : "Need attention",
			color: "text-red-600",
			bgColor: "bg-red-50",
			icon: (
				<svg
					className="h-6 w-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			),
		},
	];

	if (isLoading) {
		return (
			<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="animate-pulse rounded-lg bg-white p-6 shadow">
						<div className="flex items-center">
							<div className="h-12 w-12 rounded-lg bg-gray-200" />
							<div className="ml-4 flex-1">
								<div className="mb-2 h-4 w-24 rounded bg-gray-200" />
								<div className="h-8 w-16 rounded bg-gray-200" />
								<div className="mt-2 h-3 w-20 rounded bg-gray-200" />
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			{statCards.map((stat) => (
				<div key={stat.title} className="rounded-lg bg-white p-6 shadow">
					<div className="flex items-center">
						<div className={`rounded-lg p-3 ${stat.bgColor}`}>
							<div className={stat.color}>{stat.icon}</div>
						</div>
						<div className="ml-4">
							<h3 className="font-medium text-gray-900 text-sm">
								{stat.title}
							</h3>
							<p className={`font-bold text-2xl ${stat.color}`}>{stat.value}</p>
							<p className="text-gray-500 text-xs">{stat.description}</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
