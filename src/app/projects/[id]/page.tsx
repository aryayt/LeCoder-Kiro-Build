'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { DashboardLayout } from '~/components/layout/dashboard-layout';
import { ConfirmationDialog } from '~/components/ui/confirmation-dialog';
import { ProgressTracker } from '~/components/ui/progress-tracker';
import { api } from '~/trpc/react';

export default function ProjectDetailPage() {
	const params = useParams();
	const router = useRouter();
	const projectId = params.id as string;
	const [deleteConfirmation, setDeleteConfirmation] = useState(false);

	const {
		data: project,
		isLoading,
		error,
		refetch,
	} = api.project.getById.useQuery(
		{ id: projectId },
		{
			enabled: !!projectId,
			refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
		}
	);

	const { data: aiConfig } = api.project.getAIConfig.useQuery();

	const startPipelineMutation = api.project.startPipeline.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const cancelPipelineMutation = api.project.cancelPipeline.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const retryPipelineMutation = api.project.retryPipeline.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const deleteProjectMutation = api.project.delete.useMutation({
		onSuccess: () => {
			router.push('/dashboard');
		},
	});

	const handleDelete = async () => {
		await deleteProjectMutation.mutateAsync({ id: projectId });
		setDeleteConfirmation(false);
	};

	const handleDownload = async () => {
		try {
			// For now, just create a simple download URL
			// In a full implementation, this would call the download API
			const downloadUrl = `/api/projects/${projectId}/download`;
			window.open(downloadUrl, '_blank');
		} catch (error) {
			console.error('Download failed:', error);
		}
	};

	const handleStartPipeline = async () => {
		try {
			await startPipelineMutation.mutateAsync({ id: projectId });
		} catch (error) {
			console.error('Failed to start pipeline:', error);
		}
	};

	const handleCancelPipeline = async () => {
		try {
			await cancelPipelineMutation.mutateAsync({ id: projectId });
		} catch (error) {
			console.error('Failed to cancel pipeline:', error);
		}
	};

	const handleRetryPipeline = async () => {
		try {
			await retryPipelineMutation.mutateAsync({ id: projectId });
		} catch (error) {
			console.error('Failed to retry pipeline:', error);
		}
	};

	if (isLoading) {
		return (
			<DashboardLayout title="Loading..." description="Loading project details...">
				<div className="animate-pulse space-y-6">
					<div className="h-8 w-64 rounded bg-gray-200" />
					<div className="h-64 w-full rounded-lg bg-gray-200" />
					<div className="h-48 w-full rounded-lg bg-gray-200" />
				</div>
			</DashboardLayout>
		);
	}

	if (error || !project) {
		return (
			<DashboardLayout
				title="Project Not Found"
				description="The requested project could not be found."
			>
				<div className="rounded-lg bg-white p-12 text-center shadow">
					<svg
						className="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Project Not Found</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<h3 className="mt-2 font-medium text-gray-900 text-sm">Project not found</h3>
					<p className="mt-1 text-gray-500 text-sm">
						The project you're looking for doesn't exist or has been deleted.
					</p>
					<div className="mt-6">
						<Link
							href="/dashboard"
							className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700"
						>
							Back to Dashboard
						</Link>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) {
			return '0 Bytes';
		}
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

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

	const projectActions = (
		<div className="flex items-center space-x-3">
			{project.status === 'UPLOADED' && (
				<button
					type="button"
					onClick={handleStartPipeline}
					disabled={startPipelineMutation.isPending}
					className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
				>
					{startPipelineMutation.isPending ? (
						<>
							<svg
								className="mr-2 h-4 w-4 animate-spin"
								fill="none"
								viewBox="0 0 24 24"
								aria-label="Loading"
							>
								<title>Loading</title>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							Starting...
						</>
					) : (
						<>
							<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<title>Start AI Analysis</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Start AI Analysis
						</>
					)}
				</button>
			)}

			{project.status === 'PROCESSING' && (
				<button
					type="button"
					onClick={handleCancelPipeline}
					disabled={cancelPipelineMutation.isPending}
					className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 font-medium text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
				>
					{cancelPipelineMutation.isPending ? (
						<>
							<svg
								className="mr-2 h-4 w-4 animate-spin"
								fill="none"
								viewBox="0 0 24 24"
								aria-label="Loading"
							>
								<title>Loading</title>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							Cancelling...
						</>
					) : (
						<>
							<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<title>Cancel</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
							Cancel
						</>
					)}
				</button>
			)}

			{project.status === 'ERROR' && (
				<button
					type="button"
					onClick={handleRetryPipeline}
					disabled={retryPipelineMutation.isPending}
					className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 font-medium text-sm text-white hover:bg-yellow-700 disabled:opacity-50"
				>
					{retryPipelineMutation.isPending ? (
						<>
							<svg
								className="mr-2 h-4 w-4 animate-spin"
								fill="none"
								viewBox="0 0 24 24"
								aria-label="Loading"
							>
								<title>Loading</title>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							Retrying...
						</>
					) : (
						<>
							<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<title>Retry Pipeline</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							Retry Pipeline
						</>
					)}
				</button>
			)}

			{project.status === 'COMPLETED' && (
				<button
					type="button"
					onClick={handleDownload}
					className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
				>
					<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<title>Download</title>
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
				type="button"
				onClick={() => setDeleteConfirmation(true)}
				className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 font-medium text-red-700 text-sm hover:bg-red-50"
			>
				<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<title>Delete</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
				Delete
			</button>
		</div>
	);

	return (
		<>
			<DashboardLayout
				title={project.title}
				description={`Project created on ${new Date(project.createdAt).toLocaleDateString()}`}
				actions={projectActions}
				breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: project.title }]}
			>
				{/* Project Header */}
				<div className="mb-8 rounded-lg bg-white p-6 shadow">
					<div className="flex items-start justify-between">
						<div className="min-w-0 flex-1">
							<div className="flex items-center space-x-3">
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${getStatusColor(project.status)}`}
								>
									{project.status}
								</span>
							</div>
							<p className="mt-2 text-gray-600">{project.metadata?.fileName || 'Unknown file'}</p>
						</div>
					</div>

					{/* Project Metadata */}
					<div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
						<div>
							<dt className="font-medium text-gray-500 text-sm">File Size</dt>
							<dd className="mt-1 text-gray-900 text-sm">
								{formatFileSize(project.metadata?.fileSize || 0)}
							</dd>
						</div>
						<div>
							<dt className="font-medium text-gray-500 text-sm">Pages</dt>
							<dd className="mt-1 text-gray-900 text-sm">{project.metadata?.pageCount || 0}</dd>
						</div>
						<div>
							<dt className="font-medium text-gray-500 text-sm">Created</dt>
							<dd className="mt-1 text-gray-900 text-sm">
								{new Date(project.createdAt).toLocaleDateString()}
							</dd>
						</div>
						{project.metadata?.authors &&
							Array.isArray(project.metadata.authors) &&
							project.metadata.authors.length > 0 && (
								<div className="sm:col-span-3">
									<dt className="font-medium text-gray-500 text-sm">Authors</dt>
									<dd className="mt-1 text-gray-900 text-sm">
										{project.metadata.authors.join(', ')}
									</dd>
								</div>
							)}
					</div>

					{/* AI Configuration Info */}
					{aiConfig && (
						<div className="mt-6 rounded-lg bg-blue-50 p-4">
							<h3 className="font-medium text-blue-900 text-sm">AI Processing Configuration</h3>
							<div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
								<div>
									<dt className="font-medium text-blue-700 text-xs">AI Provider</dt>
									<dd className="mt-1 text-blue-900 text-sm capitalize">
										{aiConfig.currentProvider}
									</dd>
								</div>
								<div>
									<dt className="font-medium text-blue-700 text-xs">Model</dt>
									<dd className="mt-1 text-blue-900 text-sm">{aiConfig.currentModel}</dd>
								</div>
								<div>
									<dt className="font-medium text-blue-700 text-xs">Temperature</dt>
									<dd className="mt-1 text-blue-900 text-sm">{aiConfig.temperature}</dd>
								</div>
							</div>
							{project.metadata?.vectorProcessing && (
								<div className="mt-3 text-blue-800 text-xs">
									Vector embeddings: {project.metadata.vectorProcessing.chunksCount} chunks, ~
									{project.metadata.vectorProcessing.estimatedTokens} tokens processed
								</div>
							)}
						</div>
					)}
				</div>

				{/* Progress Tracker */}
				<div className="mb-8 rounded-lg bg-white p-6 shadow">
					<h2 className="mb-6 font-semibold text-gray-900 text-lg">Processing Progress</h2>
					<ProgressTracker
						projectId={projectId}
						stages={
							project.stages?.map((stage) => ({
								id: stage.id,
								stageNumber: stage.stageNumber,
								stageName: stage.stageName,
								status: stage.status.toLowerCase() as
									| 'pending'
									| 'processing'
									| 'completed'
									| 'error'
									| 'retrying',
								errorMessage: stage.errorMessage,
								startedAt: stage.startedAt,
								completedAt: stage.completedAt,
							})) || []
						}
						currentStage={project.currentStage}
					/>
				</div>

				{/* Generated Files (if completed) */}
				{project.status === 'COMPLETED' &&
					project.generatedFiles &&
					project.generatedFiles.length > 0 && (
						<div className="rounded-lg bg-white p-6 shadow">
							<h2 className="mb-4 font-semibold text-gray-900 text-lg">Generated Files</h2>
							<div className="space-y-2">
								{project.generatedFiles.map((file) => (
									<div
										key={file.id}
										className="flex items-center justify-between rounded-md border border-gray-200 p-3"
									>
										<div className="flex items-center space-x-3">
											<svg
												className="h-5 w-5 text-gray-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<title>File</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											<div>
												<p className="font-medium text-gray-900 text-sm">{file.filePath}</p>
												<p className="text-gray-500 text-xs">{file.fileType}</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
			</DashboardLayout>

			{/* Delete Confirmation Dialog */}
			<ConfirmationDialog
				isOpen={deleteConfirmation}
				onClose={() => setDeleteConfirmation(false)}
				onConfirm={handleDelete}
				title="Delete Project"
				message={`Are you sure you want to delete "${project.title}"? This action cannot be undone and will permanently remove all associated files and data.`}
				confirmText="Delete Project"
				cancelText="Cancel"
				type="danger"
				isLoading={deleteProjectMutation.isPending}
			/>
		</>
	);
}
