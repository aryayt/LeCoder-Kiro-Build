/**
 * Rate limiter for AI providers with different limits
 */

interface RateLimitConfig {
    requestsPerMinute: number;
    requestsPerDay: number;
    provider: string;
}

interface RateLimitState {
    minuteRequests: number[];
    dayRequests: number;
    lastDayReset: number;
}

class RateLimiter {
    private state: Map<string, RateLimitState> = new Map();
    private configs: Map<string, RateLimitConfig> = new Map();

    constructor() {
        // Configure rate limits for different providers
        this.configs.set('google', {
            requestsPerMinute: 5,
            requestsPerDay: 25, // Conservative limit for free tier
            provider: 'google',
        });

        this.configs.set('google-pro', {
            requestsPerMinute: 5,
            requestsPerDay: 25, // Shared with flash model
            provider: 'google',
        });

        this.configs.set('openai', {
            requestsPerMinute: 60, // Generous default for paid tiers
            requestsPerDay: 1000,
            provider: 'openai',
        });

        this.configs.set('anthropic', {
            requestsPerMinute: 60,
            requestsPerDay: 1000,
            provider: 'anthropic',
        });
    }

    /**
     * Check if a request can be made for the given provider
     */
    canMakeRequest(provider: string): boolean {
        const config = this.configs.get(provider);
        if (!config) {
            return true; // Allow unknown providers
        }

        const state = this.getOrCreateState(provider);
        const now = Date.now();

        // Check daily limit
        if (this.isDayReset(state, now)) {
            this.resetDayCounter(state, now);
        }

        if (state.dayRequests >= config.requestsPerDay) {
            return false;
        }

        // Check minute limit
        this.cleanupOldMinuteRequests(state, now);

        if (state.minuteRequests.length >= config.requestsPerMinute) {
            return false;
        }

        return true;
    }

    /**
     * Record a request for the given provider
     */
    recordRequest(provider: string): void {
        const config = this.configs.get(provider);
        if (!config) {
            return; // Don't track unknown providers
        }

        const state = this.getOrCreateState(provider);
        const now = Date.now();

        // Update counters
        state.minuteRequests.push(now);
        state.dayRequests++;
    }

    /**
     * Get time until next request is allowed
     */
    getTimeUntilNextRequest(provider: string): number {
        const config = this.configs.get(provider);
        if (!config) {
            return 0;
        }

        const state = this.getOrCreateState(provider);
        const now = Date.now();

        // Check if we're at daily limit
        if (state.dayRequests >= config.requestsPerDay) {
            const nextDay = this.getNextDayReset(state.lastDayReset);
            return Math.max(0, nextDay - now);
        }

        // Check if we're at minute limit
        this.cleanupOldMinuteRequests(state, now);

        if (state.minuteRequests.length >= config.requestsPerMinute) {
            const oldestRequest = Math.min(...state.minuteRequests);
            const nextMinute = oldestRequest + 60 * 1000; // 1 minute from oldest request
            return Math.max(0, nextMinute - now);
        }

        return 0;
    }

    /**
     * Get current usage stats for a provider
     */
    getUsageStats(provider: string): {
        minuteRequests: number;
        dayRequests: number;
        minuteLimit: number;
        dayLimit: number;
    } {
        const config = this.configs.get(provider);
        if (!config) {
            return {
                minuteRequests: 0,
                dayRequests: 0,
                minuteLimit: Infinity,
                dayLimit: Infinity,
            };
        }

        const state = this.getOrCreateState(provider);
        const now = Date.now();

        this.cleanupOldMinuteRequests(state, now);

        return {
            minuteRequests: state.minuteRequests.length,
            dayRequests: state.dayRequests,
            minuteLimit: config.requestsPerMinute,
            dayLimit: config.requestsPerDay,
        };
    }

    private getOrCreateState(provider: string): RateLimitState {
        if (!this.state.has(provider)) {
            this.state.set(provider, {
                minuteRequests: [],
                dayRequests: 0,
                lastDayReset: Date.now(),
            });
        }
        return this.state.get(provider)!;
    }

    private cleanupOldMinuteRequests(state: RateLimitState, now: number): void {
        const oneMinuteAgo = now - 60 * 1000;
        state.minuteRequests = state.minuteRequests.filter(time => time > oneMinuteAgo);
    }

    private isDayReset(state: RateLimitState, now: number): boolean {
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        return state.lastDayReset < oneDayAgo;
    }

    private resetDayCounter(state: RateLimitState, now: number): void {
        state.dayRequests = 0;
        state.lastDayReset = now;
    }

    private getNextDayReset(lastReset: number): number {
        return lastReset + 24 * 60 * 60 * 1000;
    }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Decorator to add rate limiting to AI agent methods
 */
export function withRateLimit<T extends any[], R>(
    provider: string,
    fn: (...args: T) => Promise<R>
) {
    return async (...args: T): Promise<R> => {
        if (!rateLimiter.canMakeRequest(provider)) {
            const waitTime = rateLimiter.getTimeUntilNextRequest(provider);
            const waitSeconds = Math.ceil(waitTime / 1000);

            throw new Error(
                `Rate limit exceeded for ${provider}. Please wait ${waitSeconds} seconds before making another request.`
            );
        }

        try {
            const result = await fn(...args);
            rateLimiter.recordRequest(provider);
            return result;
        } catch (error) {
            // Don't record failed requests
            throw error;
        }
    };
}