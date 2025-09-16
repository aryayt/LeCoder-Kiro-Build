import { type ZipGenerationResult, ZipGenerator } from '~/lib/utils/zip-generator';
import { ProjectStatus } from '@prisma/client';
import { db } from '~/server/db';

export interface FilePreview {
	filePath: string;
	fileType: string;
	content: string;
	size: number;
	language?: string;
}

export interface ProjectDownloadInfo {
	projectId: string;
	projectName: string;
	fileCount: number;
	totalSize: number;
	lastModified: Date;
	status: 'ready' | 'generating' | 'error';
}

export class FileService {
	private static instance: FileService;
	private downloadCache = new Map<string, { buffer: Buffer; timestamp: number }>();
	private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

	static getInstance(): FileService {
		if (!FileService.instance) {
			FileService.instance = new FileService();
		}
		return FileService.instance;
	}

	/**
	 * Get project files for preview
	 */
	async getProjectFiles(projectId: string): Promise<FilePreview[]> {
		const files = await db.generatedFile.findMany({
			where: { projectId },
			orderBy: { filePath: 'asc' },
		});

		return files.map((file) => ({
			filePath: file.filePath,
			fileType: file.fileType,
			content: file.fileContent,
			size: file.fileContent.length,
			language: this.detectLanguage(file.filePath, file.fileType),
		}));
	}

	/**
	 * Generate ZIP file for project download
	 */
	async generateProjectZip(projectId: string): Promise<ZipGenerationResult> {
		try {
			// Check cache first
			const cached = this.downloadCache.get(projectId);
			if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
				return {
					success: true,
					buffer: cached.buffer,
					fileCount: 0, // We don't store this in cache
					totalSize: cached.buffer.length,
				};
			}

			// Get project and files
			const project = await db.project.findUnique({
				where: { id: projectId },
				include: {
					generatedFiles: {
						orderBy: { filePath: 'asc' },
					},
				},
			});

			if (!project) {
				return {
					success: false,
					error: 'Project not found',
					fileCount: 0,
					totalSize: 0,
				};
			}

			if (project.status !== ProjectStatus.COMPLETED) {
				return {
					success: false,
					error: 'Project not ready for download',
					fileCount: 0,
					totalSize: 0,
				};
			}

			// Validate files
			const validation = ZipGenerator.validateFiles(project.generatedFiles);
			if (!validation.valid) {
				return {
					success: false,
					error: `File validation failed: ${validation.errors.join(', ')}`,
					fileCount: 0,
					totalSize: 0,
				};
			}

			// Generate ZIP
			const zipGenerator = new ZipGenerator();
			const result = await zipGenerator.generateProjectZip({
				projectName: this.sanitizeProjectName(project.title),
				files: project.generatedFiles,
				includeMetadata: true,
			});

			// Cache successful result
			if (result.success && result.buffer) {
				this.downloadCache.set(projectId, {
					buffer: result.buffer,
					timestamp: Date.now(),
				});
			}

			return result;
		} catch (error) {
			console.error('ZIP generation failed:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				fileCount: 0,
				totalSize: 0,
			};
		}
	}

	/**
	 * Get download information for a project
	 */
	async getDownloadInfo(projectId: string): Promise<ProjectDownloadInfo | null> {
		const project = await db.project.findUnique({
			where: { id: projectId },
			include: {
				generatedFiles: true,
			},
		});

		if (!project) {
			return null;
		}

		const totalSize = project.generatedFiles.reduce(
			(sum, file) => sum + file.fileContent.length,
			0
		);

		return {
			projectId: project.id,
			projectName: project.title,
			fileCount: project.generatedFiles.length,
			totalSize,
			lastModified: project.updatedAt,
			status:
				project.status === ProjectStatus.COMPLETED
					? 'ready'
					: project.status === ProjectStatus.PROCESSING
						? 'generating'
						: 'error',
		};
	}

	/**
	 * Clean up old cached downloads
	 */
	cleanupCache(): void {
		const now = Date.now();
		for (const [projectId, cached] of this.downloadCache.entries()) {
			if (now - cached.timestamp > this.CACHE_TTL) {
				this.downloadCache.delete(projectId);
			}
		}
	}

	/**
	 * Clear cache for specific project
	 */
	clearProjectCache(projectId: string): void {
		this.downloadCache.delete(projectId);
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; projects: string[] } {
		return {
			size: this.downloadCache.size,
			projects: Array.from(this.downloadCache.keys()),
		};
	}

	/**
	 * Detect programming language from file path and type
	 */
	private detectLanguage(filePath: string, fileType: string): string {
		const extension = filePath.split('.').pop()?.toLowerCase();

		const languageMap: Record<string, string> = {
			py: 'python',
			js: 'javascript',
			ts: 'typescript',
			jsx: 'javascript',
			tsx: 'typescript',
			java: 'java',
			cpp: 'cpp',
			c: 'c',
			cs: 'csharp',
			php: 'php',
			rb: 'ruby',
			go: 'go',
			rs: 'rust',
			swift: 'swift',
			kt: 'kotlin',
			scala: 'scala',
			r: 'r',
			matlab: 'matlab',
			m: 'matlab',
			sh: 'bash',
			bash: 'bash',
			zsh: 'bash',
			fish: 'bash',
			ps1: 'powershell',
			sql: 'sql',
			html: 'html',
			css: 'css',
			scss: 'scss',
			sass: 'sass',
			less: 'less',
			xml: 'xml',
			json: 'json',
			yaml: 'yaml',
			yml: 'yaml',
			toml: 'toml',
			ini: 'ini',
			cfg: 'ini',
			conf: 'ini',
			md: 'markdown',
			markdown: 'markdown',
			txt: 'text',
			log: 'text',
			dockerfile: 'dockerfile',
			makefile: 'makefile',
		};

		return languageMap[extension || ''] || languageMap[fileType] || 'text';
	}

	/**
	 * Sanitize project name for file system
	 */
	private sanitizeProjectName(name: string): string {
		return name
			.replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.toLowerCase()
			.substring(0, 50); // Limit length
	}
}
