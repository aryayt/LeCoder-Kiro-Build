import sharp from 'sharp';

export interface ImageOptimizationOptions {
	width?: number;
	height?: number;
	quality?: number;
	format?: 'webp' | 'avif' | 'jpeg' | 'png';
	progressive?: boolean;
}

/**
 * Optimize images using Sharp
 */
export class ImageOptimizer {
	/**
	 * Optimize a single image buffer
	 */
	static async optimizeImage(
		buffer: Buffer,
		options: ImageOptimizationOptions = {}
	): Promise<Buffer> {
		const { width, height, quality = 80, format = 'webp', progressive = true } = options;

		let pipeline = sharp(buffer);

		// Resize if dimensions provided
		if (width || height) {
			pipeline = pipeline.resize(width, height, {
				fit: 'inside',
				withoutEnlargement: true,
			});
		}

		// Apply format-specific optimizations
		switch (format) {
			case 'webp':
				pipeline = pipeline.webp({
					quality,
					effort: 6, // Higher effort for better compression
				});
				break;
			case 'avif':
				pipeline = pipeline.avif({
					quality,
					effort: 9, // Maximum effort for AVIF
				});
				break;
			case 'jpeg':
				pipeline = pipeline.jpeg({
					quality,
					progressive,
					mozjpeg: true, // Use mozjpeg encoder for better compression
				});
				break;
			case 'png':
				pipeline = pipeline.png({
					progressive,
					compressionLevel: 9,
					adaptiveFiltering: true,
				});
				break;
		}

		return pipeline.toBuffer();
	}

	/**
	 * Generate multiple sizes for responsive images
	 */
	static async generateResponsiveSizes(
		buffer: Buffer,
		sizes: number[] = [320, 640, 768, 1024, 1280, 1920],
		format: 'webp' | 'avif' | 'jpeg' = 'webp'
	): Promise<Array<{ size: number; buffer: Buffer; width: number; height: number }>> {
		const results = [];

		for (const size of sizes) {
			const optimized = await ImageOptimizer.optimizeImage(buffer, {
				width: size,
				format,
				quality: 80,
			});

			const metadata = await sharp(optimized).metadata();

			results.push({
				size,
				buffer: optimized,
				width: metadata.width || 0,
				height: metadata.height || 0,
			});
		}

		return results;
	}

	/**
	 * Create placeholder image (blur/low quality)
	 */
	static async createPlaceholder(buffer: Buffer, width = 20, quality = 20): Promise<string> {
		const placeholder = await sharp(buffer)
			.resize(width, null, { fit: 'inside' })
			.blur(1)
			.jpeg({ quality })
			.toBuffer();

		return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
	}

	/**
	 * Get image metadata
	 */
	static async getImageMetadata(buffer: Buffer): Promise<{
		width: number;
		height: number;
		format: string;
		size: number;
		hasAlpha: boolean;
	}> {
		const metadata = await sharp(buffer).metadata();

		return {
			width: metadata.width || 0,
			height: metadata.height || 0,
			format: metadata.format || 'unknown',
			size: buffer.length,
			hasAlpha: metadata.hasAlpha,
		};
	}
}

/**
 * Asset compression utilities
 */
export class AssetCompressor {
	/**
	 * Compress CSS content
	 */
	static compressCSS(css: string): string {
		return css
			.replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
			.replace(/\s+/g, ' ') // Collapse whitespace
			.replace(/;\s*}/g, '}') // Remove unnecessary semicolons
			.replace(/\s*{\s*/g, '{') // Clean braces
			.replace(/;\s*/g, ';') // Clean semicolons
			.trim();
	}

	/**
	 * Compress JavaScript content (basic minification)
	 */
	static compressJS(js: string): string {
		return js
			.replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
			.replace(/\/\/.*$/gm, '') // Remove line comments
			.replace(/\s+/g, ' ') // Collapse whitespace
			.replace(/;\s*}/g, '}') // Clean up
			.trim();
	}

	/**
	 * Compress JSON content
	 */
	static compressJSON(json: string): string {
		try {
			return JSON.stringify(JSON.parse(json));
		} catch {
			return json;
		}
	}
}

/**
 * File size utilities
 */
export class FileSizeUtils {
	/**
	 * Format file size in human readable format
	 */
	static formatFileSize(bytes: number): string {
		if (bytes === 0) {
			return '0 B';
		}

		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	}

	/**
	 * Calculate compression ratio
	 */
	static calculateCompressionRatio(originalSize: number, compressedSize: number): number {
		if (originalSize === 0) {
			return 0;
		}
		return ((originalSize - compressedSize) / originalSize) * 100;
	}

	/**
	 * Get file extension
	 */
	static getFileExtension(filename: string): string {
		return filename.split('.').pop()?.toLowerCase() || '';
	}

	/**
	 * Check if file is compressible
	 */
	static isCompressible(filename: string): boolean {
		const compressibleExtensions = [
			'html',
			'css',
			'js',
			'json',
			'xml',
			'svg',
			'txt',
			'md',
			'csv',
			'tsv',
			'yaml',
			'yml',
			'ini',
			'conf',
		];

		const extension = FileSizeUtils.getFileExtension(filename);
		return compressibleExtensions.includes(extension);
	}
}
