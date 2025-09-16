'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import type { Project } from '~/types/project';
import { Button } from './button';
import { DownloadButton } from './download-button';
import { FilePreview } from './file-preview';

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
	const [showPreview, setShowPreview] = useState(false);
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'COMPLETED':
				return 'bg-green-100 text-green-800';
			case 'PROCESSING':
				return 'bg-blue-100 text-blue-800';
			case 'ERROR':
				return 'bg-red-100 text-red-800';
			case 'CANCELLED':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-yellow-100 text-yellow-800';
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'COMPLETED':
				return 'Completed';
			case 'PROCESSING':
				return 'Processing';
			case 'ERROR':
				return 'Error';
			case 'CANCELLED':
				return 'Cancelled';
			default:
				return 'Uploaded';
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) {
			return '0 Bytes';
		}
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const completedStages =
		project.stages?.filter((stage) => stage.status === 'COMPLETED').length || 0;
	const totalStages = project.stages?.length || 6;
	const progressPercentage = (completedStages / totalStages) * 100;

	return (
		<div
			className={clsx(
				'rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md',
				className
			)}
		>
			<div className="mb-4 flex items-start justify-between">
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-semibold text-gray-900 text-lg">{project.title}</h3>
					<p className="mt-1 text-gray-500 text-sm">{project.metadata?.fileName}</p>
				</div>

				<span
					className={clsx(
						'inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs',
						getStatusColor(project.status)
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
					<span className="font-medium">Size:</span>{' '}
					{formatFileSize(project.metadata?.fileSize || 0)}
				</div>
				<div>
					<span className="font-medium">Pages:</span> {project.metadata?.pageCount || 0}
				</div>
				<div className="col-span-2">
					<span className="font-medium">Created:</span>{' '}
					{new Date(project.createdAt).toLocaleDateString()}
				</div>
				{project.metadata?.authors && project.metadata.authors.length > 0 && (
					<div className="col-span-2">
						<span className="font-medium">Authors:</span> {project.metadata.authors.join(', ')}
					</div>
				)}
			</div>

			<div className="space-y-3 border-gray-200 border-t pt-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Button onClick={() => onView?.(project.id)} variant="ghost" size="sm">
							👁️ View Details
						</Button>

						{project.status === 'COMPLETED' && (
							<Button onClick={() => setShowPreview(!showPreview)} variant="outline" size="sm">
								📄 {showPreview ? 'Hide' : 'Preview'} Files
							</Button>
						)}
					</div>

					<div className="flex items-center space-x-2">
						{project.status === 'COMPLETED' && (
							<DownloadButton
								projectId={project.id}
								projectName={project.title}
								size="sm"
								variant="outline"
							/>
						)}

						<Button
							onClick={() => onDelete?.(project.id)}
							variant="ghost"
							size="sm"
							className="text-red-600 hover:text-red-800"
						>
							🗑️ Delete
						</Button>
					</div>
				</div>

				{showPreview && project.status === 'COMPLETED' && (
					<div className="mt-4">
						<FilePreview projectId={project.id} onClose={() => setShowPreview(false)} />
					</div>
				)}
			</div>
		</div>
	);
}
