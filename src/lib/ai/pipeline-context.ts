import { getProjectById, getStagesByProjectId } from '~/lib/db/operations';
import type { PaperMetadata, PipelineContext } from '~/types/ai';

/**
 * Factory for creating pipeline contexts
 */
export class PipelineContextFactory {
	/**
	 * Create a pipeline context from a project ID
	 */
	static async fromProjectId(projectId: string): Promise<PipelineContext | null> {
		try {
			const project = await getProjectById(projectId);

			if (!project) {
				return null;
			}

			const stages = await getStagesByProjectId(projectId);

			const pipelineStages = stages.map((stage) => ({
				id: stage.stageNumber,
				name: stage.stageName,
				status: stage.status.toLowerCase() as 'pending' | 'processing' | 'completed' | 'error',
				result: stage.outputData,
				error: stage.errorMessage || undefined,
				startTime: stage.startedAt || undefined,
				endTime: stage.completedAt || undefined,
			}));

			// Extract metadata from project
			const projectMetadata = project.metadata as any;
			const metadata: PaperMetadata = {
				fileName: projectMetadata?.fileName || 'unknown.pdf',
				fileSize: projectMetadata?.fileSize || 0,
				pageCount: projectMetadata?.pageCount,
				authors: projectMetadata?.authors,
				title: project.title,
				abstract: projectMetadata?.abstract,
				keywords: projectMetadata?.keywords,
				publicationYear: projectMetadata?.publicationYear,
				venue: projectMetadata?.venue,
			};

			return {
				projectId: project.id,
				paperContent: project.paperContent,
				stages: pipelineStages,
				metadata,
			};
		} catch (error) {
			console.error('Error creating pipeline context:', error);
			return null;
		}
	}

	/**
	 * Create a pipeline context from project data
	 */
	static fromProjectData(
		projectId: string,
		paperContent: string,
		metadata: PaperMetadata,
		stages: Array<{
			id: number;
			name: string;
			status: 'pending' | 'processing' | 'completed' | 'error';
			result?: any;
			error?: string;
			startTime?: Date;
			endTime?: Date;
		}> = []
	): PipelineContext {
		return {
			projectId,
			paperContent,
			stages,
			metadata,
		};
	}

	/**
	 * Create a minimal pipeline context for new projects
	 */
	static createMinimal(
		projectId: string,
		paperContent: string,
		fileName: string,
		fileSize: number
	): PipelineContext {
		const metadata: PaperMetadata = {
			fileName,
			fileSize,
		};

		// Create default stages
		const stages = [
			{ id: 1, name: 'Concept Extraction', status: 'pending' as const },
			{ id: 2, name: 'Algorithm Analysis', status: 'pending' as const },
			{ id: 3, name: 'Architecture Planning', status: 'pending' as const },
			{ id: 4, name: 'Implementation Planning', status: 'pending' as const },
			{ id: 5, name: 'Code Generation', status: 'pending' as const },
			{ id: 6, name: 'Documentation Generation', status: 'pending' as const },
		];

		return {
			projectId,
			paperContent,
			stages,
			metadata,
		};
	}

	/**
	 * Validate pipeline context
	 */
	static validate(context: PipelineContext): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!context.projectId || typeof context.projectId !== 'string') {
			errors.push('Project ID is required and must be a string');
		}

		if (!context.paperContent || typeof context.paperContent !== 'string') {
			errors.push('Paper content is required and must be a string');
		}

		if (context.paperContent && context.paperContent.length < 100) {
			errors.push('Paper content seems too short (less than 100 characters)');
		}

		if (!context.metadata) {
			errors.push('Metadata is required');
		} else {
			if (!context.metadata.fileName) {
				errors.push('File name is required in metadata');
			}

			if (typeof context.metadata.fileSize !== 'number' || context.metadata.fileSize <= 0) {
				errors.push('File size must be a positive number');
			}
		}

		if (!Array.isArray(context.stages)) {
			errors.push('Stages must be an array');
		} else if (context.stages.length > 0) {
			// Validate stage structure
			for (let i = 0; i < context.stages.length; i++) {
				const stage = context.stages[i];

				if (!stage) {
					errors.push(`Stage ${i}: Missing stage data`);
					continue;
				}

				if (typeof stage.id !== 'number') {
					errors.push(`Stage ${i}: ID must be a number`);
				}

				if (!stage.name || typeof stage.name !== 'string') {
					errors.push(`Stage ${i}: Name is required and must be a string`);
				}

				const validStatuses = ['pending', 'processing', 'completed', 'error'];
				if (!validStatuses.includes(stage.status)) {
					errors.push(`Stage ${i}: Status must be one of ${validStatuses.join(', ')}`);
				}
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Update context with new stage data
	 */
	static updateStageInContext(
		context: PipelineContext,
		stageId: number,
		updates: Partial<{
			status: 'pending' | 'processing' | 'completed' | 'error';
			result: any;
			error: string;
			startTime: Date;
			endTime: Date;
		}>
	): PipelineContext {
		const updatedStages = context.stages.map((stage) => {
			if (stage.id === stageId) {
				return { ...stage, ...updates };
			}
			return stage;
		});

		return {
			...context,
			stages: updatedStages,
		};
	}

	/**
	 * Get stage by ID from context
	 */
	static getStageFromContext(
		context: PipelineContext,
		stageId: number
	): PipelineContext['stages'][0] | null {
		return context.stages.find((stage) => stage.id === stageId) || null;
	}

	/**
	 * Get completed stages from context
	 */
	static getCompletedStages(context: PipelineContext): PipelineContext['stages'] {
		return context.stages.filter((stage) => stage.status === 'completed');
	}

	/**
	 * Get failed stages from context
	 */
	static getFailedStages(context: PipelineContext): PipelineContext['stages'] {
		return context.stages.filter((stage) => stage.status === 'error');
	}

	/**
	 * Get current processing stage from context
	 */
	static getCurrentStage(context: PipelineContext): PipelineContext['stages'][0] | null {
		return (
			context.stages.find((stage) => stage.status === 'processing' || stage.status === 'error') ||
			null
		);
	}

	/**
	 * Get next pending stage from context
	 */
	static getNextPendingStage(context: PipelineContext): PipelineContext['stages'][0] | null {
		return context.stages.find((stage) => stage.status === 'pending') || null;
	}

	/**
	 * Check if pipeline is complete
	 */
	static isPipelineComplete(context: PipelineContext): boolean {
		return (
			context.stages.length > 0 && context.stages.every((stage) => stage.status === 'completed')
		);
	}

	/**
	 * Check if pipeline has errors
	 */
	static hasPipelineErrors(context: PipelineContext): boolean {
		return context.stages.some((stage) => stage.status === 'error');
	}

	/**
	 * Get pipeline progress percentage
	 */
	static getPipelineProgress(context: PipelineContext): number {
		if (context.stages.length === 0) {
			return 0;
		}

		const completedStages = context.stages.filter((stage) => stage.status === 'completed').length;
		return Math.round((completedStages / context.stages.length) * 100);
	}
}
