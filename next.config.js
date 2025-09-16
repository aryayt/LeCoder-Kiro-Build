import './src/env.js';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	// Performance optimizations
	experimental: {
		optimizePackageImports: [
			'lucide-react',
			'@ai-sdk/openai',
			'@ai-sdk/google',
			'@ai-sdk/anthropic',
		],
	},
	serverExternalPackages: ['@prisma/client'],

	// Bundle analyzer
	webpack: (config, { dev, isServer }) => {
		// Optimize bundle size
		if (!(dev || isServer)) {
			config.optimization.splitChunks = {
				chunks: 'all',
				maxSize: 244000, // 244KB chunks
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendors',
						chunks: 'all',
						priority: 1,
					},
					ai: {
						test: /[\\/]node_modules[\\/](@ai-sdk|ai)[\\/]/,
						name: 'ai-sdk',
						chunks: 'all',
						priority: 10,
					},
					ui: {
						test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
						name: 'ui-components',
						chunks: 'all',
						priority: 5,
					},
					common: {
						name: 'common',
						minChunks: 2,
						chunks: 'all',
						priority: 2,
					},
				},
			};
		}

		return config;
	},

	// Image optimization with CDN support
	images: {
		formats: ['image/webp', 'image/avif'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 31536000, // 1 year
		dangerouslyAllowSVG: false,
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},

	// Compression
	compress: true,

	// Static optimization
	trailingSlash: false,
	generateEtags: true,

	// Headers for caching and security
	async headers() {
		return [
			// Security headers for all routes
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-XSS-Protection',
						value: '1; mode=block',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()',
					},
				],
			},
			// API caching
			{
				source: '/api/health',
				headers: [
					{
						key: 'Cache-Control',
						value: 'no-cache, no-store, must-revalidate',
					},
				],
			},
			{
				source: '/api/metrics',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
					},
				],
			},
			{
				source: '/api/projects/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'private, max-age=0, must-revalidate',
					},
				],
			},
			// Static assets caching
			{
				source: '/_next/static/(.*)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
			{
				source: '/favicon.ico',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=86400',
					},
				],
			},
			// Page caching
			{
				source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
					},
				],
			},
		];
	},

	// Redirects for SEO
	async redirects() {
		return [
			{
				source: '/home',
				destination: '/',
				permanent: true,
			},
		];
	},
};

export default withBundleAnalyzer(nextConfig);
