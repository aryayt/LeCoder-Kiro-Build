'use client';

import { useMemo, useState } from 'react';
import type { Project } from '~/types/project';
import { ProjectCard } from './project-card';

export interface ProjectListProps {
	projects: Project[];
	onView?: (projectId: string) => void;
	onDownload?: (projectId: string) => void;
	onDelete?: (projectId: string) => void;
	isLoading?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'title' | 'status' | 'size' | 'pages';
type FilterOption = 'all' | 'uploaded' | 'processing' | 'completed' | 'error';

export function ProjectList({
	projects,
	onView,
	onDelete,
	isLoading = false,
}: ProjectListProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState<SortOption>('newest');
	const [filterBy, setFilterBy] = useState<FilterOption>('all');

	const filteredAndSortedProjects = useMemo(() => {
		let filtered = projects;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(project) =>
					project.title.toLowerCase().includes(query) ||
					project.metadata?.fileName?.toLowerCase().includes(query) ||
					project.metadata?.authors?.some((author) => author.toLowerCase().includes(query)) ||
					project.metadata?.abstract?.toLowerCase().includes(query) ||
					project.metadata?.keywords?.some((keyword) => keyword.toLowerCase().includes(query))
			);
		}

		// Apply status filter
		if (filterBy !== 'all') {
			filtered = filtered.filter((project) => project.status.toLowerCase().includes(filterBy));
		}

		// Apply sorting
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'newest':
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				case 'oldest':
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case 'title':
					return a.title.localeCompare(b.title);
				case 'status':
					return a.status.localeCompare(b.status);
				case 'size':
					return (b.metadata?.fileSize || 0) - (a.metadata?.fileSize || 0);
				case 'pages':
					return (b.metadata?.pageCount || 0) - (a.metadata?.pageCount || 0);
				default:
					return 0;
			}
		});

		return filtered;
	}, [projects, searchQuery, sortBy, filterBy]);

	const getStatusCounts = () => {
		return {
			all: projects.length,
			uploaded: projects.filter((p) => p.status === 'UPLOADED').length,
			processing: projects.filter((p) => p.status === 'PROCESSING').length,
			completed: projects.filter((p) => p.status === 'COMPLETED').length,
			error: projects.filter((p) => p.status === 'ERROR').length,
		};
	};

	const statusCounts = getStatusCounts();

	if (isLoading) {
		return (
			<div className="space-y-6">
				{/* Loading skeleton for filters */}
				<div className="animate-pulse">
					<div className="mb-4 h-10 w-full rounded-md bg-gray-200" />
					<div className="flex space-x-4">
						<div className="h-10 w-32 rounded-md bg-gray-200" />
						<div className="h-10 w-32 rounded-md bg-gray-200" />
					</div>
				</div>

				{/* Loading skeleton for project cards */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }, (_, i) => `project-skeleton-${i}`).map((key) => (
						<div key={key} className="animate-pulse">
							<div className="h-64 w-full rounded-lg bg-gray-200" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Search and Filters */}
			<div className="rounded-lg bg-white p-6 shadow">
				<div className="mb-4">
					<label htmlFor="search" className="sr-only">
						Search projects
					</label>
					<div className="relative">
						<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<svg
								className="h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-label="Search"
							>
								<title>Search</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
						<input
							id="search"
							type="text"
							placeholder="Search by title, filename, author, abstract, or keywords..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="block w-full rounded-md border-gray-300 py-2 pr-3 pl-10 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
						/>
					</div>
				</div>

				<div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
					{/* Status Filter */}
					<div className="flex flex-wrap gap-2">
						{(['all', 'uploaded', 'processing', 'completed', 'error'] as FilterOption[]).map(
							(status) => (
								<button
									key={status}
									onClick={() => setFilterBy(status)}
									className={`inline-flex items-center rounded-full px-3 py-1 font-medium text-sm ${
										filterBy === status
											? 'bg-indigo-100 text-indigo-800'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									{status.charAt(0).toUpperCase() + status.slice(1)}
									<span className="ml-1 text-xs">({statusCounts[status]})</span>
								</button>
							)
						)}
					</div>

					{/* Sort Options */}
					<div className="flex items-center space-x-2">
						<label htmlFor="sort" className="font-medium text-gray-700 text-sm">
							Sort by:
						</label>
						<select
							id="sort"
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as SortOption)}
							className="rounded-md border-gray-300 py-1 pr-8 pl-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
						>
							<option value="newest">Newest First</option>
							<option value="oldest">Oldest First</option>
							<option value="title">Title A-Z</option>
							<option value="status">Status</option>
							<option value="size">File Size</option>
							<option value="pages">Page Count</option>
						</select>
					</div>
				</div>
			</div>

			{/* Results Summary */}
			<div className="flex items-center justify-between">
				<p className="text-gray-600 text-sm">
					Showing {filteredAndSortedProjects.length} of {projects.length} projects
				</p>
			</div>

			{/* Project Grid */}
			{filteredAndSortedProjects.length === 0 ? (
				<div className="rounded-lg bg-white p-12 text-center shadow">
					{searchQuery || filterBy !== 'all' ? (
						<>
							<svg
								className="mx-auto h-12 w-12 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
							<h3 className="mt-2 font-medium text-gray-900 text-sm">No projects found</h3>
							<p className="mt-1 text-gray-500 text-sm">
								Try adjusting your search or filter criteria.
							</p>
							<button
								onClick={() => {
									setSearchQuery('');
									setFilterBy('all');
								}}
								className="mt-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
							>
								Clear filters
							</button>
						</>
					) : (
						<>
							<svg
								className="mx-auto h-12 w-12 text-gray-400"
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
							<h3 className="mt-2 font-medium text-gray-900 text-sm">No projects yet</h3>
							<p className="mt-1 text-gray-500 text-sm">
								Get started by uploading your first research paper.
							</p>
							<a
								href="/upload"
								className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700"
							>
								Upload Paper
							</a>
						</>
					)}
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredAndSortedProjects.map((project) => (
						<ProjectCard
							key={project.id}
							project={project}
							onView={onView}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
		</div>
	);
}
