export interface ResearchConcepts {
	mainObjective: string;
	keyMethods: string[];
	algorithms: string[];
	datasets: string[];
	evaluationMetrics: string[];
}

export interface AlgorithmSpecs {
	algorithms: Algorithm[];
	dependencies: string[];
	systemRequirements: SystemRequirements;
}

export interface Algorithm {
	name: string;
	description: string;
	complexity: string;
	inputs: string[];
	outputs: string[];
	implementation: string;
}

export interface SystemRequirements {
	language: string;
	frameworks: string[];
	libraries: string[];
	minimumSpecs: {
		memory: string;
		cpu: string;
		storage: string;
	};
}

export interface GeneratedCodebase {
	files: GeneratedFile[];
	structure: ProjectStructure;
	documentation: Documentation;
}

export interface GeneratedFile {
	path: string;
	content: string;
	type: string;
}

export interface ProjectStructure {
	rootFiles: string[];
	directories: Directory[];
}

export interface Directory {
	name: string;
	files: string[];
	subdirectories?: Directory[];
}

export interface Documentation {
	readme: string;
	setup: string;
	usage: string;
	api?: string;
}
