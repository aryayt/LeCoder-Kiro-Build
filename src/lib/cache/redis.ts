import Redis, { type RedisOptions } from 'ioredis';
import { env } from '~/env';

// Redis client singleton
let redis: Redis | null = null;

export function getRedisClient(): Redis {
	if (!redis) {
		const redisUrl = env.REDIS_URL ?? 'redis://localhost:6379';
		const options: RedisOptions = {
			enableReadyCheck: false,
			maxRetriesPerRequest: 3,
			lazyConnect: true,
		};

		redis = new Redis(redisUrl, options);

		redis.on('error', (error) => {
			console.error('Redis connection error:', error);
		});

		redis.on('connect', () => {});
	}

	return redis;
}

// Cache key generators
export const CacheKeys = {
	project: (id: string) => `project:${id}`,
	projectFiles: (id: string) => `project:${id}:files`,
	aiResponse: (hash: string) => `ai:response:${hash}`,
	userProjects: (userId: string) => `user:${userId}:projects`,
	pipelineStage: (projectId: string, stage: number) => `pipeline:${projectId}:${stage}`,
	pdfContent: (hash: string) => `pdf:content:${hash}`,
	systemStats: () => 'system:stats',
} as const;

// Cache TTL constants (in seconds)
export const CacheTTL = {
	SHORT: 300, // 5 minutes
	MEDIUM: 1800, // 30 minutes
	LONG: 3600, // 1 hour
	VERY_LONG: 86400, // 24 hours
	AI_RESPONSE: 7200, // 2 hours
	PDF_CONTENT: 86400, // 24 hours
} as const;

// Generic cache operations
export class CacheManager {
	private redis: Redis;

	constructor() {
		this.redis = getRedisClient();
	}

	async get<T>(key: string): Promise<T | null> {
		try {
			const value = await this.redis.get(key);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error('Cache get error:', error);
			return null;
		}
	}

	async set<T>(key: string, value: T, ttl: number = CacheTTL.MEDIUM): Promise<boolean> {
		try {
			await this.redis.setex(key, ttl, JSON.stringify(value));
			return true;
		} catch (error) {
			console.error('Cache set error:', error);
			return false;
		}
	}

	async del(key: string): Promise<boolean> {
		try {
			await this.redis.del(key);
			return true;
		} catch (error) {
			console.error('Cache delete error:', error);
			return false;
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			const result = await this.redis.exists(key);
			return result === 1;
		} catch (error) {
			console.error('Cache exists error:', error);
			return false;
		}
	}

	async invalidatePattern(pattern: string): Promise<void> {
		try {
			const keys = await this.redis.keys(pattern);
			if (keys.length > 0) {
				await this.redis.del(...keys);
			}
		} catch (error) {
			console.error('Cache invalidate pattern error:', error);
		}
	}

	async increment(key: string, ttl: number = CacheTTL.MEDIUM): Promise<number> {
		try {
			const result = await this.redis.incr(key);
			if (result === 1) {
				await this.redis.expire(key, ttl);
			}
			return result;
		} catch (error) {
			console.error('Cache increment error:', error);
			return 0;
		}
	}

	async getOrSet<T>(
		key: string,
		fetcher: () => Promise<T>,
		ttl: number = CacheTTL.MEDIUM
	): Promise<T> {
		try {
			const cached = await this.get<T>(key);
			if (cached !== null) {
				return cached;
			}

			const fresh = await fetcher();
			await this.set(key, fresh, ttl);
			return fresh;
		} catch (error) {
			console.error('Cache getOrSet error:', error);
			return await fetcher();
		}
	}
}

// Singleton cache manager
export const cache = new CacheManager();
