import { z } from "zod";
import { PipelineService } from "~/lib/ai/pipeline-service";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const projectRouter = createTRPCRouter({
	// Get all projects for a user (or anonymous projects)
	getAll: publicProcedure
		.input(
			z.object({
				userId: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			const projects = await db.project.findMany({
				where: {
					userId: input.userId || null,
				},
				include: {
					stages: {
						orderBy: { stageNumber: "asc" },
					},
				},
				orderBy: { createdAt: "desc" },
			});

			// Transform the projects to match our type expectations
			return projects.map((project) => ({
				...project,
				metadata: project.metadata as any, // Cast JsonValue to our metadata type
				createdAt: project.createdAt.toISOString(),
				updatedAt: project.updatedAt.toISOString(),
			}));
		}),

	// Get a specific project by ID
	getById: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const project = await db.project.findUnique({
				where: { id: input.id },
				include: {
					stages: {
						orderBy: { stageNumber: "asc" },
					},
					generatedFiles: true,
				},
			});

			if (!project) {
				throw new Error("Project not found");
			}

			// Transform the project to match our type expectations
			return {
				...project,
				metadata: project.metadata as any, // Cast JsonValue to our metadata type
				createdAt: project.createdAt.toISOString(),
				updatedAt: project.updatedAt.toISOString(),
			};
		}),

	// Create a new project (called after PDF upload)
	create: publicProcedure
		.input(
			z.object({
				title: z.string(),
				paperContent: z.string(),
				metadata: z.object({
					fileName: z.string(),
					fileSize: z.number(),
					pageCount: z.number(),
					authors: z.array(z.string()).optional(),
					abstract: z.string().optional(),
					keywords: z.array(z.string()).optional(),
				}),
				userId: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			// Create the project
			const project = await db.project.create({
				data: {
					title: input.title,
					paperContent: input.paperContent,
					metadata: input.metadata,
					userId: input.userId,
					status: "UPLOADED",
					currentStage: 0,
				},
			});

			// Create the initial pipeline stages
			const stages = [
				{
					name: "Concept Extraction",
					description: "Extracting core concepts and research objectives",
				},
				{
					name: "Algorithm Analysis",
					description: "Identifying algorithms and methodologies",
				},
				{
					name: "Architecture Planning",
					description: "Determining system structure and requirements",
				},
				{
					name: "Implementation Planning",
					description: "Creating detailed implementation plan",
				},
				{
					name: "Code Generation",
					description: "Generating complete, executable code",
				},
				{
					name: "Documentation Generation",
					description: "Creating setup instructions and documentation",
				},
			];

			await db.pipelineStage.createMany({
				data: stages.map((stage, index) => ({
					projectId: project.id,
					stageNumber: index + 1,
					stageName: stage.name,
					status: "PENDING",
					inputData: {},
					outputData: {},
				})),
			});

			return project;
		}),

	// Update project status
	updateStatus: publicProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum([
					"UPLOADED",
					"PROCESSING",
					"COMPLETED",
					"ERROR",
					"CANCELLED",
				]),
				currentStage: z.number().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const project = await db.project.update({
				where: { id: input.id },
				data: {
					status: input.status,
					currentStage: input.currentStage,
					updatedAt: new Date(),
				},
			});

			return project;
		}),

	// Update pipeline stage
	updateStage: publicProcedure
		.input(
			z.object({
				projectId: z.string(),
				stageNumber: z.number(),
				status: z.enum([
					"PENDING",
					"PROCESSING",
					"COMPLETED",
					"ERROR",
					"RETRYING",
				]),
				inputData: z.record(z.any()).optional(),
				outputData: z.record(z.any()).optional(),
				errorMessage: z.string().optional(),
			}),
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
					startedAt: input.status === "PROCESSING" ? new Date() : undefined,
					completedAt: input.status === "COMPLETED" ? new Date() : undefined,
				},
			});

			return stage;
		}),

	// Delete a project
	delete: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			// Delete project (cascade will handle related records)
			await db.project.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// Start the AI pipeline for a project
	startPipeline: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const pipelineService = PipelineService.getInstance();
			const result = await pipelineService.startPipeline(input.id);

			if (!result.success) {
				throw new Error(result.error || "Failed to start pipeline");
			}

			return result;
		}),

	// Get pipeline progress
	getPipelineProgress: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const pipelineService = PipelineService.getInstance();
			const result = await pipelineService.getPipelineProgress(input.id);

			if (!result.success) {
				throw new Error(result.error || "Failed to get pipeline progress");
			}

			return result.data;
		}),

	// Cancel pipeline
	cancelPipeline: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const pipelineService = PipelineService.getInstance();
			const result = await pipelineService.cancelPipeline(input.id);

			if (!result.success) {
				throw new Error(result.error || "Failed to cancel pipeline");
			}

			return result;
		}),

	// Retry pipeline
	retryPipeline: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const pipelineService = PipelineService.getInstance();
			const result = await pipelineService.retryPipeline(input.id);

			if (!result.success) {
				throw new Error(result.error || "Failed to retry pipeline");
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
			}),
		)
		.query(async ({ input }) => {
			const project = await db.project.findUnique({
				where: { id: input.id },
				include: {
					generatedFiles: true,
				},
			});

			if (!project || project.status !== "COMPLETED") {
				throw new Error("Project not ready for download");
			}

			// Return a URL that will trigger ZIP generation
			return {
				downloadUrl: `/api/projects/${input.id}/download`,
				fileCount: project.generatedFiles.length,
			};
		}),
});
