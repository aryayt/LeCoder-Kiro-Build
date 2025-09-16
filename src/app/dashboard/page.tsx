'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '~/components/auth/auth-provider';
import { DashboardLayout } from '~/components/layout/dashboard-layout';
import { ConfirmationDialog } from '~/components/ui/confirmation-dialog';
import { DashboardStats } from '~/components/ui/dashboard-stats';
import { ProjectList } from '~/components/ui/project-list';
import { StorageLimitWarning } from '~/components/ui/storage-limit-warning';
import { useProjects } from '~/hooks/use-projects';

export default function DashboardPage() {
	const router = useRouter();
	const { session } = useAuth();
	const [deleteConfirmation, setDeleteConfirmation] = useState<{
		isOpen: boolean;
		projectId: string | null;
		projectTitle: string;
	}>({
		isOpen: false,
		projectId: null,
		projectTitle: '',
	});

	const {
		projects,
		isLoading,
		handleDeleteProject,
		handleDownloadProject,
		deletingProjectId,
		isDeleting,
	} = useProjects();

	const handleViewProject = (projectId: string) => {
		router.push(`/projects/${projectId}`);
	};

	const handleDeleteClick = (projectId: string) => {
		const project = projects.find((p) => p.id === projectId);
		setDeleteConfirmation({
			isOpen: true,
			projectId,
			projectTitle: project?.title || 'Unknown Project',
		});
	};

	const handleConfirmDelete = async () => {
		if (deleteConfirmation.projectId) {
			await handleDeleteProject(deleteConfirmation.projectId);
			setDeleteConfirmation({
				isOpen: false,
				projectId: null,
				projectTitle: '',
			});
		}
	};

	const handleCancelDelete = () => {
		setDeleteConfirmation({
			isOpen: false,
			projectId: null,
			projectTitle: '',
		});
	};

	const title = session?.user?.name ? `Welcome back, ${session.user.name}!` : 'Dashboard';

	const dashboardActions = (
		<div className="flex items-center space-x-3">
			<Link
				href="/upload"
				className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
			>
				<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<title>Upload Paper</title>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
				</svg>
				Upload Paper
			</Link>
			<Link
				href="/settings"
				className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
			>
				<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<title>Settings</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				Settings
			</Link>
		</div>
	);

	return (
		<>
			<DashboardLayout
				title={title}
				description="Manage your research paper projects and track their progress."
				actions={dashboardActions}
			>
				{/* Storage Limit Warning */}
				<StorageLimitWarning projects={projects} />

				{/* Stats */}
				<DashboardStats projects={projects} isLoading={isLoading} />

				{/* Projects List */}
				<div className="rounded-lg bg-white shadow">
					<div className="border-gray-200 border-b px-6 py-4">
						<div className="flex items-center justify-between">
							<h2 className="font-semibold text-gray-900 text-xl">Your Projects</h2>
							<a
								href="/upload"
								className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
							>
								<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<title>Upload Paper</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4v16m8-8H4"
									/>
								</svg>
								Upload Paper
							</a>
						</div>
					</div>
					<div className="p-6">
						<ProjectList
							projects={projects}
							onView={handleViewProject}
							onDownload={handleDownloadProject}
							onDelete={handleDeleteClick}
							isLoading={isLoading}
						/>
					</div>
				</div>
			</DashboardLayout>

			{/* Delete Confirmation Dialog */}
			<ConfirmationDialog
				isOpen={deleteConfirmation.isOpen}
				onClose={handleCancelDelete}
				onConfirm={handleConfirmDelete}
				title="Delete Project"
				message={`Are you sure you want to delete "${deleteConfirmation.projectTitle}"? This action cannot be undone and will permanently remove all associated files and data.`}
				confirmText="Delete Project"
				cancelText="Cancel"
				type="danger"
				isLoading={isDeleting && deletingProjectId === deleteConfirmation.projectId}
			/>
		</>
	);
}
