import { z } from 'zod';
import { PipelineService } from '~/lib/ai/pipeline-service';
import { auditLogger } from '~/lib/security/audit-logger';
import { projectSchemas } from '~/lib/security/validation';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { db } from '~/server/db';
import type { ProjectMetadata } from '~/types/project';

export const projectRouter = createTRPCRouter({
	// Get all projects for a user (or anonymous projects)
	getAll: publicProcedure.input(projectSchemas.list).query(async ({ input, ctx }) => {
		// Build where clause with pagination and filtering
		const where: any = {};

		// Since we're in public mode, show all projects
		// In a full auth implementation, you'd filter by user ownership here

		// Apply status filter if provided
		if (input.status) {
			where.status = input.status;
		}

		// Apply search filter if provided
		if (input.search) {
			where.OR = [
				{ title: { contains: input.search, mode: 'insensitive' } },
				{ paperContent: { contains: input.search, mode: 'insensitive' } },
			];
		}

		const projects = await db.project.findMany({
			where,
			include: {
				stages: {
					orderBy: { stageNumber: 'asc' },
				},
			},
			orderBy: { createdAt: 'desc' },
			take: input.limit,
			skip: (input.page - 1) * input.limit,
		});

		// Transform the projects to match our type expectations
		return projects.map((project) => ({
			...project,
			metadata: project.metadata as unknown as ProjectMetadata, // Cast JsonValue to our metadata type
			createdAt: project.createdAt.toISOString(),
			updatedAt: project.updatedAt.toISOString(),
		}));
	}),

	// Get a specific project by ID
	getById: publicProcedure.input(projectSchemas.getById).query(async ({ input, ctx }) => {
		// Build where clause to ensure user can only access their own projects
		const where: any = { id: input.id };

		// Since we're in public mode, allow access to any project
		// In a full auth implementation, you'd check user ownership here

		const project = await db.project.findUnique({
			where,
			include: {
				stages: {
					orderBy: { stageNumber: 'asc' },
				},
				generatedFiles: true,
			},
		});

		if (!project) {
			throw new Error('Project not found or access denied');
		}

		// Transform the project to match our type expectations
		return {
			...project,
			metadata: project.metadata as unknown as ProjectMetadata, // Cast JsonValue to our metadata type
			createdAt: project.createdAt.toISOString(),
			updatedAt: project.updatedAt.toISOString(),
		};
	}),

	// Create a new project (called after PDF upload)
	create: publicProcedure.input(projectSchemas.create).mutation(async ({ input, ctx }) => {
		// Use authenticated user ID if available, otherwise allow anonymous
		const userId = null; // Anonymous usage

		// Create the project
		const project = await db.project.create({
			data: {
				title: input.title,
				paperContent: input.paperContent,
				metadata: input.metadata,
				userId: userId || undefined,
				status: 'UPLOADED',
				currentStage: 0,
			},
		});

		// Log project creation
		await auditLogger.logAudit({
			userId: userId || undefined,
			action: 'PROJECT_CREATE',
			resource: 'project',
			resourceId: project.id,
			details: {
				title: project.title,
				fileSize: input.metadata.fileSize,
				pageCount: input.metadata.pageCount,
			},
			success: true,
		});

		// Create the initial pipeline stages
		const stages = [
			{
				name: 'Concept Extraction',
				description: 'Extracting core concepts and research objectives',
			},
			{
				name: 'Algorithm Analysis',
				description: 'Identifying algorithms and methodologies',
			},
			{
				name: 'Architecture Planning',
				description: 'Determining system structure and requirements',
			},
			{
				name: 'Implementation Planning',
				description: 'Creating detailed implementation plan',
			},
			{
				name: 'Code Generation',
				description: 'Generating complete, executable code',
			},
			{
				name: 'Documentation Generation',
				description: 'Creating setup instructions and documentation',
			},
		];

		await db.pipelineStage.createMany({
			data: stages.map((stage, index) => ({
				projectId: project.id,
				stageNumber: index + 1,
				stageName: stage.name,
				status: 'PENDING',
				inputData: {},
				outputData: {},
			})),
		});

		return project;
	}),

	// Update project status
	updateStatus: protectedProcedure.input(projectSchemas.update).mutation(async ({ input, ctx }) => {
		// Ensure user can only update their own projects
		const existingProject = await db.project.findUnique({
			where: { id: input.id },
		});

		if (!existingProject) {
			throw new Error('Project not found');
		}

		// TODO: Add auth context for user validation
		// For now, allow all operations in anonymous mode

		const updateData: any = { updatedAt: new Date() };
		if (input.title) updateData.title = input.title;
		if (input.status) updateData.status = input.status;

		const project = await db.project.update({
			where: { id: input.id },
			data: updateData,
		});

		// Log project update
		await auditLogger.logAudit({
			userId: undefined, // TODO: Add auth context
			action: 'PROJECT_UPDATE',
			resource: 'project',
			resourceId: project.id,
			details: {
				changes: updateData,
			},
			success: true,
		});

		return project;
	}),

	// Update pipeline stage
	updateStage: publicProcedure
		.input(
			z.object({
				projectId: z.string(),
				stageNumber: z.number(),
				status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'ERROR', 'RETRYING']),
				inputData: z.record(z.any()).optional(),
				outputData: z.record(z.any()).optional(),
				errorMessage: z.string().optional(),
			})
		)
		.mutation(async ({ input }) => {
			const stage = await db.pipelineStage.updateMany({
				where: {
					projectId: input.projectId,
					stageNumber: input.stageNumber,
				},
				data: {
					status: input.status,
					inputData: input.inputData,
					outputData: input.outputData,
					errorMessage: input.errorMessage,
					startedAt: input.status === 'PROCESSING' ? new Date() : undefined,
					completedAt: input.status === 'COMPLETED' ? new Date() : undefined,
				},
			});

			return stage;
		}),

	// Delete a project
	delete: protectedProcedure.input(projectSchemas.delete).mutation(async ({ input, ctx }) => {
		// Ensure user can only delete their own projects
		const existingProject = await db.project.findUnique({
			where: { id: input.id },
		});

		if (!existingProject) {
			throw new Error('Project not found');
		}

		// TODO: Add auth context for user validation
		// For now, allow all operations in anonymous mode

		// Delete project (cascade will handle related records)
		await db.project.delete({
			where: { id: input.id },
		});

		// Log project deletion
		await auditLogger.logAudit({
			userId: undefined, // TODO: Add auth context
			action: 'PROJECT_DELETE',
			resource: 'project',
			resourceId: input.id,
			details: {
				title: existingProject.title,
			},
			success: true,
		});

		return { success: true };
	}),

	// Start the AI pipeline for a project
	startPipeline: publicProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async ({ input }) => {
			const pipelineService = PipelineService.getInstance();
			const result = await pipelineService.startPipeline(input.id);

			if (!result.success) {
				throw new Error(result.error || 'Failed to start pipeline');
			}

			return result;
		}),

	// Get pipeline progress
	getPipelineProgress: publicProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ input }) => {
			const pipelineService = PipelineService.getInstance();
			const result = await pipelineService.getPipelineProgress(input.id);

			if (!result.success) {
				throw new Error(result.error || 'Failed to get pipeline progress');
			}

			return result.data;
		}),

	// Cancel pipeline
	cancelPipeline: publicProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async ({ input }) => {
			const pipelineService = PipelineService.getInstance();
			const result = await pipelineService.cancelPipeline(input.id);

			if (!result.success) {
				throw new Error(result.error || 'Failed to cancel pipeline');
			}

			return result;
		}),

	// Retry pipeline
	retryPipeline: publicProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async ({ input }) => {
			const pipelineService = PipelineService.getInstance();
			const result = await pipelineService.retryPipeline(input.id);

			if (!result.success) {
				throw new Error(result.error || 'Failed to retry pipeline');
			}

			return result;
		}),

	// Get AI configuration info
	getAIConfig: publicProcedure.query(async () => {
		const pipelineService = PipelineService.getInstance();
		const config = pipelineService.getPipelineConfiguration();

		return {
			availableProviders: config.availableProviders,
			currentProvider: config.currentConfig.conceptExtractor.provider,
			currentModel: config.currentConfig.conceptExtractor.model,
			temperature: config.currentConfig.conceptExtractor.temperature,
		};
	}),

	// Get project download URL (for generated files)
	getDownloadUrl: publicProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ input }) => {
			const project = await db.project.findUnique({
				where: { id: input.id },
				include: {
					generatedFiles: true,
				},
			});

			if (!project || project.status !== 'COMPLETED') {
				throw new Error('Project not ready for download');
			}

			// Return a URL that will trigger ZIP generation
			return {
				downloadUrl: `/api/projects/${input.id}/download`,
				fileCount: project.generatedFiles.length,
			};
		}),

	// Get project files for preview
	getFiles: publicProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ input }) => {
			const project = await db.project.findUnique({
				where: { id: input.id },
				include: {
					generatedFiles: {
						orderBy: { filePath: 'asc' },
					},
				},
			});

			if (!project) {
				throw new Error('Project not found');
			}

			return {
				files: project.generatedFiles.map((file) => ({
					filePath: file.filePath,
					fileType: file.fileType,
					content: file.fileContent,
					size: file.fileContent.length,
					createdAt: file.createdAt.toISOString(),
				})),
				totalSize: project.generatedFiles.reduce((sum, file) => sum + file.fileContent.length, 0),
			};
		}),

	// Get download progress information
	getDownloadProgress: publicProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ input }) => {
			const project = await db.project.findUnique({
				where: { id: input.id },
				include: {
					generatedFiles: true,
				},
			});

			if (!project) {
				throw new Error('Project not found');
			}

			const totalSize = project.generatedFiles.reduce(
				(sum, file) => sum + file.fileContent.length,
				0
			);

			return {
				projectId: project.id,
				projectName: project.title,
				status: project.status,
				fileCount: project.generatedFiles.length,
				totalSize,
				lastModified: project.updatedAt.toISOString(),
				downloadReady: project.status === 'COMPLETED',
				estimatedDownloadSize: Math.round(totalSize * 0.7), // Estimate ZIP compression
			};
		}),

	// Clean up project files (for completed projects)
	cleanupFiles: publicProcedure
		.input(
			z.object({
				id: z.string(),
				olderThanDays: z.number().optional().default(30),
			})
		)
		.mutation(async ({ input }) => {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - input.olderThanDays);

			const project = await db.project.findUnique({
				where: { id: input.id },
				include: {
					generatedFiles: true,
				},
			});

			if (!project) {
				throw new Error('Project not found');
			}

			// Only cleanup completed projects older than cutoff
			if (project.status === 'COMPLETED' && project.updatedAt < cutoffDate) {
				await db.generatedFile.deleteMany({
					where: { projectId: input.id },
				});

				return { success: true, filesDeleted: project.generatedFiles.length };
			}

			return { success: false, reason: 'Project not eligible for cleanup' };
		}),
});
