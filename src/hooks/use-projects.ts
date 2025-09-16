'use client';

import { useCallback, useState } from 'react';
import { api } from '~/trpc/react';

export function useProjects(filters?: {
	status?: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'ERROR' | 'CANCELLED';
	search?: string;
	page?: number;
	limit?: number;
}) {
	const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

	// Fetch projects
	const {
		data: projects = [],
		isLoading,
		error,
		refetch,
	} = api.project.getAll.useQuery(
		{
			page: filters?.page ?? 1,
			limit: filters?.limit ?? 10,
			status: filters?.status,
			search: filters?.search,
		},
		{
			refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
		}
	);

	// Delete project mutation
	const deleteProjectMutation = api.project.delete.useMutation({
		onSuccess: () => {
			refetch();
			setDeletingProjectId(null);
		},
		onError: (error) => {
			console.error('Failed to delete project:', error);
			setDeletingProjectId(null);
		},
	});

	// Get download URL query (we'll use it manually)
	const _getDownloadUrl = api.project.getDownloadUrl;

	const handleDeleteProject = useCallback(
		async (projectId: string) => {
			setDeletingProjectId(projectId);
			try {
				await deleteProjectMutation.mutateAsync({ id: projectId });
			} catch (error) {
				console.error('Delete failed:', error);
				setDeletingProjectId(null);
			}
		},
		[deleteProjectMutation]
	);

	const handleDownloadProject = useCallback(async (projectId: string) => {
		try {
			// For now, just open the download URL directly
			const downloadUrl = `/api/projects/${projectId}/download`;
			window.open(downloadUrl, '_blank');
		} catch (error) {
			console.error('Download failed:', error);
		}
	}, []);

	const getProjectStats = useCallback(() => {
		return {
			total: projects.length,
			uploaded: projects.filter((p) => p.status === 'UPLOADED').length,
			processing: projects.filter((p) => p.status === 'PROCESSING').length,
			completed: projects.filter((p) => p.status === 'COMPLETED').length,
			error: projects.filter((p) => p.status === 'ERROR').length,
		};
	}, [projects]);

	return {
		projects,
		isLoading,
		error,
		refetch,
		handleDeleteProject,
		handleDownloadProject,
		deletingProjectId,
		isDeleting: deleteProjectMutation.isPending,
		isDownloading: false,
		stats: getProjectStats(),
	};
}
