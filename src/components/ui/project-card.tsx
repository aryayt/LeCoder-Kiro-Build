"use client";

import { clsx } from "clsx";
import type { PipelineStage } from "./progress-tracker";

import type { Project } from "~/types/project";

interface ProjectCardProps {
	project: Project;
	onView?: (projectId: string) => void;
	onDownload?: (projectId: string) => void;
	onDelete?: (projectId: string) => void;
	className?: string;
}

export function ProjectCard({
	project,
	onView,
	onDownload,
	onDelete,
	className,
}: ProjectCardProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "COMPLETED":
				return "bg-green-100 text-green-800";
			case "PROCESSING":
				return "bg-blue-100 text-blue-800";
			case "ERROR":
				return "bg-red-100 text-red-800";
			case "CANCELLED":
				return "bg-gray-100 text-gray-800";
			case "UPLOADED":
			default:
				return "bg-yellow-100 text-yellow-800";
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "COMPLETED":
				return "Completed";
			case "PROCESSING":
				return "Processing";
			case "ERROR":
				return "Error";
			case "CANCELLED":
				return "Cancelled";
			case "UPLOADED":
			default:
				return "Uploaded";
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return (
			Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
		);
	};

	const completedStages =
		project.stages?.filter((stage) => stage.status === "COMPLETED").length || 0;
	const totalStages = project.stages?.length || 6;
	const progressPercentage = (completedStages / totalStages) * 100;

	return (
		<div
			className={clsx(
				"rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md",
				className,
			)}
		>
			<div className="mb-4 flex items-start justify-between">
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-semibold text-gray-900 text-lg">
						{project.title}
					</h3>
					<p className="mt-1 text-gray-500 text-sm">
						{project.metadata?.fileName}
					</p>
				</div>

				<span
					className={clsx(
						"inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs",
						getStatusColor(project.status),
					)}
				>
					{getStatusText(project.status)}
				</span>
			</div>

			<div className="mb-4 space-y-3">
				<div className="flex items-center justify-between text-gray-600 text-sm">
					<span>Progress</span>
					<span>
						{completedStages}/{totalStages} stages
					</span>
				</div>

				<div className="h-2 w-full rounded-full bg-gray-200">
					<div
						className="h-2 rounded-full bg-blue-600 transition-all duration-300"
						style={{ width: `${progressPercentage}%` }}
					/>
				</div>
			</div>

			<div className="mb-4 grid grid-cols-2 gap-4 text-gray-600 text-sm">
				<div>
					<span className="font-medium">Size:</span>{" "}
					{formatFileSize(project.metadata?.fileSize || 0)}
				</div>
				<div>
					<span className="font-medium">Pages:</span>{" "}
					{project.metadata?.pageCount || 0}
				</div>
				<div className="col-span-2">
					<span className="font-medium">Created:</span>{" "}
					{new Date(project.createdAt).toLocaleDateString()}
				</div>
				{project.metadata?.authors && project.metadata.authors.length > 0 && (
					<div className="col-span-2">
						<span className="font-medium">Authors:</span>{" "}
						{project.metadata.authors.join(", ")}
					</div>
				)}
			</div>

			<div className="flex items-center justify-between border-gray-200 border-t pt-4">
				<button
					onClick={() => onView?.(project.id)}
					className="font-medium text-blue-600 text-sm hover:text-blue-800"
				>
					View Details
				</button>

				<div className="flex items-center space-x-3">
					{project.status === "COMPLETED" && (
						<button
							onClick={() => onDownload?.(project.id)}
							className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 text-sm hover:bg-gray-50"
						>
							<svg
								className="mr-1.5 h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							Download
						</button>
					)}

					<button
						onClick={() => onDelete?.(project.id)}
						className="font-medium text-red-600 text-sm hover:text-red-800"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}
