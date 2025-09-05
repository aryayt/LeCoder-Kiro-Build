export interface Project {
	id: string;
	userId?: string;
	title: string;
	paperContent: string;
	status: ProjectStatus;
	currentStage: number;
	metadata: PaperMetadata | null;
	stages: PipelineStage[];
	createdAt: string;
	updatedAt: string;
}

export interface PaperMetadata {
	fileName: string;
	fileSize: number;
	pageCount: number;
	authors?: string[];
	abstract?: string;
	keywords?: string[];
}

export interface PipelineStage {
	id: string;
	projectId: string;
	stageNumber: number;
	stageName: string;
	status: StageStatus;
	inputData?: any;
	outputData?: any;
	errorMessage?: string;
	startedAt?: string;
	completedAt?: string;
	createdAt: string;
}

export enum ProjectStatus {
	UPLOADED = "UPLOADED",
	PROCESSING = "PROCESSING",
	COMPLETED = "COMPLETED",
	ERROR = "ERROR",
	CANCELLED = "CANCELLED",
}

export enum StageStatus {
	PENDING = "PENDING",
	PROCESSING = "PROCESSING",
	COMPLETED = "COMPLETED",
	ERROR = "ERROR",
	RETRYING = "RETRYING",
}
