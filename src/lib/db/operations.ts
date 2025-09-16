import { ProjectStatus, StageStatus } from '@prisma/client';
import { db } from '~/server/db';

/**
 * Database operations for LeCodeR application
 */

// Project Operations
export async function createProject(data: {
	userId?: string;
	title: string;
	paperContent: string;
	metadata?: any;
}) {
	try {
		const project = await db.project.create({
			data: {
				...data,
				status: ProjectStatus.UPLOADED,
				currentStage: 0,
			},
			include: {
				user: true,
				stages: {
					orderBy: { stageNumber: 'asc' },
				},
			},
		});

		return project;
	} catch (error) {
		console.error('Error creating project:', error);
		throw new Error('Failed to create project');
	}
}

export async function getProjectById(id: string) {
	try {
		const project = await db.project.findUnique({
			where: { id },
			include: {
				user: true,
				stages: {
					orderBy: { stageNumber: 'asc' },
				},
				generatedFiles: {
					select: {
						id: true,
						filePath: true,
						fileType: true,
						createdAt: true,
					},
				},
			},
		});

		return project;
	} catch (error) {
		console.error('Error fetching project:', error);
		throw new Error('Failed to fetch project');
	}
}

export async function getProjectsByUserId(userId: string, limit = 10, offset = 0) {
	try {
		const projects = await db.project.findMany({
			where: { userId },
			include: {
				stages: {
					select: {
						stageNumber: true,
						stageName: true,
						status: true,
					},
					orderBy: { stageNumber: 'asc' },
				},
				_count: {
					select: {
						generatedFiles: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
			skip: offset,
		});

		return projects;
	} catch (error) {
		console.error('Error fetching user projects:', error);
		throw new Error('Failed to fetch user projects');
	}
}

export async function updateProjectStatus(
	id: string,
	status: ProjectStatus,
	currentStage?: number
) {
	try {
		const project = await db.project.update({
			where: { id },
			data: {
				status,
				...(currentStage !== undefined && { currentStage }),
				updatedAt: new Date(),
			},
		});

		return project;
	} catch (error) {
		console.error('Error updating project status:', error);
		throw new Error('Failed to update project status');
	}
}

export async function deleteProject(id: string) {
	try {
		// Delete related records first (cascade should handle this, but being explicit)
		await db.generatedFile.deleteMany({
			where: { projectId: id },
		});

		await db.pipelineStage.deleteMany({
			where: { projectId: id },
		});

		const project = await db.project.delete({
			where: { id },
		});

		return project;
	} catch (error) {
		console.error('Error deleting project:', error);
		throw new Error('Failed to delete project');
	}
}

// Pipeline Stage Operations
export async function createPipelineStages(projectId: string) {
	const stages = [
		{ name: 'Concept Extraction', number: 1 },
		{ name: 'Algorithm Analysis', number: 2 },
		{ name: 'Architecture Planning', number: 3 },
		{ name: 'Implementation Planning', number: 4 },
		{ name: 'Code Generation', number: 5 },
		{ name: 'Documentation Generation', number: 6 },
	];

	try {
		const createdStages = await Promise.all(
			stages.map((stage) =>
				db.pipelineStage.create({
					data: {
						projectId,
						stageNumber: stage.number,
						stageName: stage.name,
						status: StageStatus.PENDING,
					},
				})
			)
		);

		return createdStages;
	} catch (error) {
		console.error('Error creating pipeline stages:', error);
		throw new Error('Failed to create pipeline stages');
	}
}

export async function updateStageStatus(
	stageId: string,
	status: StageStatus,
	data?: {
		inputData?: any;
		outputData?: any;
		errorMessage?: string;
	}
) {
	try {
		const updateData: any = {
			status,
		};

		if (status === StageStatus.PROCESSING) {
			updateData.startedAt = new Date();
		} else if (status === StageStatus.COMPLETED || status === StageStatus.ERROR) {
			updateData.completedAt = new Date();
		}

		if (data?.inputData) {
			updateData.inputData = data.inputData;
		}
		if (data?.outputData) {
			updateData.outputData = data.outputData;
		}
		if (data?.errorMessage) {
			updateData.errorMessage = data.errorMessage;
		}

		const stage = await db.pipelineStage.update({
			where: { id: stageId },
			data: updateData,
		});

		return stage;
	} catch (error) {
		console.error('Error updating stage status:', error);
		throw new Error('Failed to update stage status');
	}
}

export async function getStagesByProjectId(projectId: string) {
	try {
		const stages = await db.pipelineStage.findMany({
			where: { projectId },
			orderBy: { stageNumber: 'asc' },
		});

		return stages;
	} catch (error) {
		console.error('Error fetching stages:', error);
		throw new Error('Failed to fetch stages');
	}
}

// Generated File Operations
export async function createGeneratedFile(data: {
	projectId: string;
	filePath: string;
	fileContent: string;
	fileType: string;
}) {
	try {
		const file = await db.generatedFile.create({
			data,
		});

		return file;
	} catch (error) {
		console.error('Error creating generated file:', error);
		throw new Error('Failed to create generated file');
	}
}

export async function createGeneratedFiles(
	files: Array<{
		projectId: string;
		filePath: string;
		fileContent: string;
		fileType: string;
	}>
) {
	try {
		const createdFiles = await db.generatedFile.createMany({
			data: files,
		});

		return createdFiles;
	} catch (error) {
		console.error('Error creating generated files:', error);
		throw new Error('Failed to create generated files');
	}
}

export async function getGeneratedFilesByProjectId(projectId: string) {
	try {
		const files = await db.generatedFile.findMany({
			where: { projectId },
			orderBy: { filePath: 'asc' },
		});

		return files;
	} catch (error) {
		console.error('Error fetching generated files:', error);
		throw new Error('Failed to fetch generated files');
	}
}

// User Operations
export async function getUserById(id: string) {
	try {
		const user = await db.user.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						projects: true,
					},
				},
			},
		});

		return user;
	} catch (error) {
		console.error('Error fetching user:', error);
		throw new Error('Failed to fetch user');
	}
}

export async function getUserByEmail(email: string) {
	try {
		const user = await db.user.findUnique({
			where: { email },
		});

		return user;
	} catch (error) {
		console.error('Error fetching user by email:', error);
		throw new Error('Failed to fetch user by email');
	}
}

// Analytics and Statistics
export async function getProjectStats(userId?: string) {
	try {
		const whereClause = userId ? { userId } : {};

		const [total, uploaded, processing, completed, error] = await Promise.all([
			db.project.count({ where: whereClause }),
			db.project.count({
				where: { ...whereClause, status: ProjectStatus.UPLOADED },
			}),
			db.project.count({
				where: { ...whereClause, status: ProjectStatus.PROCESSING },
			}),
			db.project.count({
				where: { ...whereClause, status: ProjectStatus.COMPLETED },
			}),
			db.project.count({
				where: { ...whereClause, status: ProjectStatus.ERROR },
			}),
		]);

		return {
			total,
			uploaded,
			processing,
			completed,
			error,
		};
	} catch (error) {
		console.error('Error fetching project stats:', error);
		throw new Error('Failed to fetch project stats');
	}
}

export async function getRecentProjects(limit = 5) {
	try {
		const projects = await db.project.findMany({
			include: {
				user: {
					select: {
						name: true,
						email: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		return projects;
	} catch (error) {
		console.error('Error fetching recent projects:', error);
		throw new Error('Failed to fetch recent projects');
	}
}

// Database Health Check
export async function checkDatabaseConnection() {
	try {
		await db.$queryRaw`SELECT 1`;
		return { status: 'healthy', timestamp: new Date() };
	} catch (error) {
		console.error('Database health check failed:', error);
		return {
			status: 'unhealthy',
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date(),
		};
	}
}
