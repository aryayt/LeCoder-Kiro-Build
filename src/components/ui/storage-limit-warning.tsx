"use client";

import { useState } from "react";
import type { Project } from "~/types/project";

interface StorageLimitWarningProps {
	projects: Project[];
	maxProjects?: number;
	maxStorageBytes?: number;
}

export function StorageLimitWarning({
	projects,
	maxProjects = 50, // Default limit of 50 projects
	maxStorageBytes = 1024 * 1024 * 1024, // Default limit of 1GB
}: StorageLimitWarningProps) {
	const [isDismissed, setIsDismissed] = useState(false);

	// Calculate current usage
	const currentProjects = projects.length;
	const currentStorageBytes = projects.reduce(
		(total, project) => total + (project.metadata?.fileSize || 0),
		0,
	);

	// Calculate percentages
	const projectUsagePercent = (currentProjects / maxProjects) * 100;
	const storageUsagePercent = (currentStorageBytes / maxStorageBytes) * 100;

	// Determine if we should show warning (80% threshold)
	const shouldShowWarning =
		projectUsagePercent >= 80 || storageUsagePercent >= 80;

	// Determine if we've reached limits (100% threshold)
	const projectLimitReached = currentProjects >= maxProjects;
	const storageLimitReached = currentStorageBytes >= maxStorageBytes;

	if (!shouldShowWarning || isDismissed) {
		return null;
	}

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return (
			Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
		);
	};

	const getWarningType = () => {
		if (projectLimitReached || storageLimitReached) {
			return "error";
		}
		if (projectUsagePercent >= 90 || storageUsagePercent >= 90) {
			return "warning";
		}
		return "info";
	};

	const warningType = getWarningType();

	const getWarningStyles = () => {
		switch (warningType) {
			case "error":
				return {
					container: "border-red-200 bg-red-50",
					icon: "text-red-400",
					title: "text-red-800",
					text: "text-red-700",
					button: "text-red-800 hover:bg-red-100",
				};
			case "warning":
				return {
					container: "border-yellow-200 bg-yellow-50",
					icon: "text-yellow-400",
					title: "text-yellow-800",
					text: "text-yellow-700",
					button: "text-yellow-800 hover:bg-yellow-100",
				};
			default:
				return {
					container: "border-blue-200 bg-blue-50",
					icon: "text-blue-400",
					title: "text-blue-800",
					text: "text-blue-700",
					button: "text-blue-800 hover:bg-blue-100",
				};
		}
	};

	const styles = getWarningStyles();

	const getWarningTitle = () => {
		if (projectLimitReached || storageLimitReached) {
			return "Storage Limit Reached";
		}
		if (projectUsagePercent >= 90 || storageUsagePercent >= 90) {
			return "Storage Almost Full";
		}
		return "Storage Usage Warning";
	};

	const getWarningMessage = () => {
		const messages = [];

		if (projectLimitReached) {
			messages.push(`You've reached the maximum of ${maxProjects} projects.`);
		} else if (projectUsagePercent >= 80) {
			messages.push(
				`You're using ${currentProjects} of ${maxProjects} projects (${Math.round(projectUsagePercent)}%).`,
			);
		}

		if (storageLimitReached) {
			messages.push(
				`You've reached the storage limit of ${formatBytes(maxStorageBytes)}.`,
			);
		} else if (storageUsagePercent >= 80) {
			messages.push(
				`You're using ${formatBytes(currentStorageBytes)} of ${formatBytes(maxStorageBytes)} storage (${Math.round(storageUsagePercent)}%).`,
			);
		}

		if (projectLimitReached || storageLimitReached) {
			messages.push(
				"Please delete some projects to free up space before uploading new papers.",
			);
		} else {
			messages.push(
				"Consider deleting old or unnecessary projects to free up space.",
			);
		}

		return messages.join(" ");
	};

	const getIcon = () => {
		switch (warningType) {
			case "error":
				return (
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				);
			case "warning":
				return (
					<svg
						className="h-5 w-5"
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
				);
			default:
				return (
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				);
		}
	};

	return (
		<div className={`rounded-md border p-4 ${styles.container}`}>
			<div className="flex">
				<div className="flex-shrink-0">
					<div className={styles.icon}>{getIcon()}</div>
				</div>
				<div className="ml-3 flex-1">
					<h3 className={`font-medium text-sm ${styles.title}`}>
						{getWarningTitle()}
					</h3>
					<div className={`mt-2 text-sm ${styles.text}`}>
						<p>{getWarningMessage()}</p>
					</div>
					<div className="mt-4">
						<div className="-mx-2 -my-1.5 flex">
							<button
								onClick={() => setIsDismissed(true)}
								className={`rounded-md px-2 py-1.5 font-medium text-sm ${styles.button}`}
							>
								Dismiss
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
