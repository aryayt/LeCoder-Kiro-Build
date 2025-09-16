// Core AI types for research paper analysis

export interface ResearchConcepts {
	mainObjective: string;
	keyMethods: string[];
	algorithms: string[];
	datasets: string[];
	evaluationMetrics: string[];
	technicalRequirements: string[];
	dependencies: string[];
}

export interface AlgorithmSpecs {
	algorithms: Algorithm[];
	systemRequirements: SystemRequirements;
	implementationComplexity: 'low' | 'medium' | 'high';
	estimatedDevelopmentTime: string;
}

export interface Algorithm {
	name: string;
	description: string;
	type: 'machine_learning' | 'optimization' | 'data_processing' | 'statistical' | 'other';
	complexity: 'low' | 'medium' | 'high';
	inputs: AlgorithmInput[];
	outputs: AlgorithmOutput[];
	parameters: AlgorithmParameter[];
	dependencies: string[];
	pseudocode?: string;
	mathematicalFormulation?: string;
}

export interface AlgorithmInput {
	name: string;
	type: string;
	description: string;
	required: boolean;
	format?: string;
}

export interface AlgorithmOutput {
	name: string;
	type: string;
	description: string;
	format?: string;
}

export interface AlgorithmParameter {
	name: string;
	type: string;
	description: string;
	defaultValue?: string | number | boolean | null;
	range?: {
		min?: number;
		max?: number;
	};
}

export interface SystemRequirements {
	programmingLanguage: string;
	frameworks: string[];
	libraries: string[];
	minimumHardware: {
		cpu: string;
		memory: string;
		storage: string;
		gpu?: string;
	};
	operatingSystem: string[];
	pythonVersion?: string;
	nodeVersion?: string;
}

// Pipeline stage types
export interface PipelineStage {
	id: number;
	name: string;
	status: 'pending' | 'processing' | 'completed' | 'error';
	result?: unknown;
	error?: string;
	startTime?: Date;
	endTime?: Date;
}

export interface PipelineContext {
	projectId: string;
	paperContent: string;
	stages: PipelineStage[];
	metadata: PaperMetadata;
}

export interface PaperMetadata {
	fileName: string;
	fileSize: number;
	pageCount?: number;
	authors?: string[];
	title?: string;
	abstract?: string;
	keywords?: string[];
	publicationYear?: number;
	venue?: string;
}

// Agent-specific response types
export interface ConceptExtractionResult {
	concepts: ResearchConcepts;
	confidence: number;
	extractedSections: {
		abstract?: string;
		introduction?: string;
		methodology?: string;
		results?: string;
		conclusion?: string;
	};
}

export interface AlgorithmAnalysisResult {
	specs: AlgorithmSpecs;
	confidence: number;
	implementationNotes: string[];
	potentialChallenges: string[];
	recommendedApproach: string;
}

// Architecture Planning types
export interface SystemArchitecture {
	projectStructure: ProjectStructure;
	modules: ModuleSpec[];
	dataFlow: DataFlowSpec[];
	apiEndpoints: APIEndpoint[];
	databaseSchema: DatabaseSchema[];
	deploymentStrategy: DeploymentStrategy;
}

export interface ProjectStructure {
	rootDirectory: string;
	directories: DirectorySpec[];
	files: FileSpec[];
	configFiles: ConfigFile[];
}

export interface DirectorySpec {
	path: string;
	purpose: string;
	subdirectories?: DirectorySpec[];
}

export interface FileSpec {
	path: string;
	type: 'source' | 'config' | 'documentation' | 'test' | 'data';
	purpose: string;
	dependencies?: string[];
}

export interface ModuleSpec {
	name: string;
	path: string;
	purpose: string;
	exports: string[];
	imports: string[];
	functions: FunctionSpec[];
	classes?: ClassSpec[];
}

export interface FunctionSpec {
	name: string;
	purpose: string;
	parameters: ParameterSpec[];
	returnType: string;
	complexity: 'low' | 'medium' | 'high';
}

export interface ClassSpec {
	name: string;
	purpose: string;
	methods: FunctionSpec[];
	properties: PropertySpec[];
}

export interface ParameterSpec {
	name: string;
	type: string;
	required: boolean;
	description: string;
}

export interface PropertySpec {
	name: string;
	type: string;
	visibility: 'public' | 'private' | 'protected';
	description: string;
}

export interface DataFlowSpec {
	from: string;
	to: string;
	dataType: string;
	description: string;
}

export interface APIEndpoint {
	path: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	purpose: string;
	parameters: ParameterSpec[];
	responseType: string;
}

export interface DatabaseSchema {
	tableName: string;
	columns: ColumnSpec[];
	relationships: RelationshipSpec[];
	indexes: IndexSpec[];
}

export interface ColumnSpec {
	name: string;
	type: string;
	nullable: boolean;
	primaryKey?: boolean;
	foreignKey?: string;
	description: string;
}

export interface RelationshipSpec {
	type: 'one-to-one' | 'one-to-many' | 'many-to-many';
	targetTable: string;
	foreignKey: string;
	description: string;
}

export interface IndexSpec {
	name: string;
	columns: string[];
	unique: boolean;
}

export interface DeploymentStrategy {
	platform: string;
	environment: 'development' | 'staging' | 'production';
	requirements: string[];
	steps: DeploymentStep[];
}

export interface DeploymentStep {
	order: number;
	description: string;
	command?: string;
	notes?: string;
}

export interface ConfigFile {
	path: string;
	type: string;
	purpose: string;
	content?: Record<string, unknown>;
}

// Code Generation types
export interface GeneratedCodebase {
	files: GeneratedFile[];
	structure: ProjectStructure;
	documentation: Documentation;
	tests: TestFile[];
	buildInstructions: BuildInstructions;
}

export interface GeneratedFile {
	path: string;
	content: string;
	type: 'source' | 'config' | 'documentation' | 'test';
	language: string;
	dependencies: string[];
	exports?: string[];
}

export interface TestFile {
	path: string;
	content: string;
	testType: 'unit' | 'integration' | 'e2e';
	targetFile: string;
	coverage: string[];
}

export interface BuildInstructions {
	installCommands: string[];
	buildCommands: string[];
	testCommands: string[];
	runCommands: string[];
	environmentSetup: EnvironmentSetup[];
}

export interface EnvironmentSetup {
	variable: string;
	description: string;
	required: boolean;
	defaultValue?: string;
}

// Documentation Generation types
export interface Documentation {
	readme: ReadmeContent;
	apiDocs: APIDocumentation[];
	setupGuide: SetupGuide;
	userGuide: UserGuide;
	developerGuide: DeveloperGuide;
	changelog: ChangelogEntry[];
}

export interface ReadmeContent {
	title: string;
	description: string;
	features: string[];
	installation: string[];
	usage: UsageExample[];
	contributing: string[];
	license: string;
	badges?: BadgeSpec[];
}

export interface BadgeSpec {
	name: string;
	url: string;
	imageUrl: string;
}

export interface UsageExample {
	title: string;
	description: string;
	code: string;
	language: string;
}

export interface APIDocumentation {
	endpoint: string;
	method: string;
	description: string;
	parameters: ParameterDoc[];
	responses: ResponseDoc[];
	examples: APIExample[];
}

export interface ParameterDoc {
	name: string;
	type: string;
	required: boolean;
	description: string;
	example?: string | number | boolean | Record<string, unknown> | null;
}

export interface ResponseDoc {
	statusCode: number;
	description: string;
	schema?: Record<string, unknown> | null;
	example?: Record<string, unknown> | null;
}

export interface APIExample {
	title: string;
	request: Record<string, unknown> | null;
	response: Record<string, unknown> | null;
}

export interface SetupGuide {
	prerequisites: Prerequisite[];
	installationSteps: InstallationStep[];
	configuration: ConfigurationStep[];
	verification: VerificationStep[];
}

export interface Prerequisite {
	name: string;
	version?: string;
	description: string;
	installationUrl?: string;
}

export interface InstallationStep {
	order: number;
	title: string;
	description: string;
	commands?: string[];
	notes?: string[];
}

export interface ConfigurationStep {
	order: number;
	title: string;
	description: string;
	files: string[];
	variables?: EnvironmentSetup[];
}

export interface VerificationStep {
	order: number;
	title: string;
	description: string;
	commands: string[];
	expectedOutput?: string;
}

export interface UserGuide {
	sections: GuideSection[];
	troubleshooting: TroubleshootingSection[];
	faq: FAQItem[];
}

export interface DeveloperGuide {
	architecture: ArchitectureOverview;
	codeStructure: CodeStructureGuide;
	contributionGuidelines: ContributionGuidelines;
	testingGuide: TestingGuide;
}

export interface GuideSection {
	title: string;
	content: string;
	subsections?: GuideSection[];
	codeExamples?: UsageExample[];
}

export interface TroubleshootingSection {
	problem: string;
	symptoms: string[];
	solutions: string[];
}

export interface FAQItem {
	question: string;
	answer: string;
	category?: string;
}

export interface ArchitectureOverview {
	description: string;
	components: ComponentDescription[];
	dataFlow: string;
	designPatterns: string[];
}

export interface ComponentDescription {
	name: string;
	purpose: string;
	responsibilities: string[];
	interfaces: string[];
}

export interface CodeStructureGuide {
	overview: string;
	directories: DirectoryGuide[];
	namingConventions: NamingConvention[];
	codingStandards: CodingStandard[];
}

export interface DirectoryGuide {
	path: string;
	purpose: string;
	contents: string[];
}

export interface NamingConvention {
	type: string;
	pattern: string;
	examples: string[];
}

export interface CodingStandard {
	category: string;
	rules: string[];
	examples: string[];
}

export interface ContributionGuidelines {
	gettingStarted: string[];
	developmentProcess: string[];
	codeReview: string[];
	issueReporting: string[];
}

export interface TestingGuide {
	overview: string;
	testTypes: TestTypeGuide[];
	runningTests: string[];
	writingTests: string[];
}

export interface TestTypeGuide {
	type: string;
	purpose: string;
	location: string;
	examples: string[];
}

export interface ChangelogEntry {
	version: string;
	date: string;
	changes: ChangeItem[];
}

export interface ChangeItem {
	type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
	description: string;
}

// Agent response types for new agents
export interface ArchitecturePlanningResult {
	architecture: SystemArchitecture;
	confidence: number;
	designDecisions: DesignDecision[];
	implementationStrategy: string;
	riskAssessment: RiskAssessment[];
}

export interface DesignDecision {
	decision: string;
	rationale: string;
	alternatives: string[];
	tradeoffs: string[];
}

export interface RiskAssessment {
	risk: string;
	impact: 'low' | 'medium' | 'high';
	probability: 'low' | 'medium' | 'high';
	mitigation: string[];
}

export interface CodeGenerationResult {
	codebase: GeneratedCodebase;
	confidence: number;
	generationNotes: string[];
	qualityMetrics: QualityMetrics;
	completeness: CompletenessReport;
}

export interface QualityMetrics {
	codeComplexity: 'low' | 'medium' | 'high';
	testCoverage: number;
	documentationCoverage: number;
	codeQualityScore: number;
}

export interface CompletenessReport {
	implementedFeatures: string[];
	missingFeatures: string[];
	todoItems: number;
	placeholderCount: number;
}

export interface DocumentationGenerationResult {
	documentation: Documentation;
	confidence: number;
	documentationMetrics: DocumentationMetrics;
	generationNotes: string[];
}

export interface DocumentationMetrics {
	completeness: number;
	readability: number;
	technicalAccuracy: number;
	exampleCoverage: number;
}
