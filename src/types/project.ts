export interface ProjectMetadata {
	fileName: string;
	fileSize: number;
	pageCount: number;
	authors?: string[];
	abstract?: string;
	keywords?: string[];
	publicationYear?: number;
	venue?: string;
	// AI processing metadata
	aiProvider?: string;
	vectorProcessing?: {
		chunksCount: number;
		embeddingsGenerated: number;
		estimatedTokens: number;
	} | null;
	extractedTextLength?: number;
}

export interface PipelineStage {
	id: string;
	stageNumber: number;
	stageName: string;
	status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR' | 'RETRYING';
	errorMessage?: string | null;
	startedAt?: Date | null;
	completedAt?: Date | null;
}

export interface Project {
	id: string;
	userId?: string | null;
	title: string;
	status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'ERROR' | 'CANCELLED';
	currentStage: number;
	metadata: ProjectMetadata | null;
	createdAt: string;
	updatedAt: string;
	stages?: PipelineStage[];
}
