import { cache, CacheKeys, CacheTTL } from '~/lib/cache/redis';
import type { Metric } from 'web-vitals';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface WebVital {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
  url: string;
  userId?: string;
}

/**
 * Performance monitoring and metrics collection
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVital[] = [];

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);
    
    // Store in cache for aggregation
    this.storeMetricInCache(fullMetric);
  }

  /**
   * Record web vital
   */
  recordWebVital(vital: Omit<WebVital, 'timestamp'>): void {
    const fullVital: WebVital = {
      ...vital,
      timestamp: new Date(),
    };

    this.webVitals.push(fullVital);
    this.storeWebVitalInCache(fullVital);
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `${name}.duration`,
        value: duration,
        unit: 'ms',
        tags: { ...tags, status: 'success' },
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `${name}.duration`,
        value: duration,
        unit: 'ms',
        tags: { ...tags, status: 'error' },
      });
      
      this.recordMetric({
        name: `${name}.error`,
        value: 1,
        unit: 'count',
        tags,
      });
      
      throw error;
    }
  }

  /**
   * Measure synchronous function execution time
   */
  measure<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `${name}.duration`,
        value: duration,
        unit: 'ms',
        tags: { ...tags, status: 'success' },
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `${name}.duration`,
        value: duration,
        unit: 'ms',
        tags: { ...tags, status: 'error' },
      });
      
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<{
    metrics: {
      avgResponseTime: number;
      errorRate: number;
      throughput: number;
      cacheHitRate: number;
    };
    webVitals: {
      cls: { avg: number; p95: number };
      fid: { avg: number; p95: number };
      lcp: { avg: number; p95: number };
      fcp: { avg: number; p95: number };
      ttfb: { avg: number; p95: number };
    };
    resources: {
      memoryUsage: number;
      cpuUsage: number;
      activeConnections: number;
    };
  }> {
    const cacheKey = 'performance:summary';
    
    return cache.getOrSet(
      cacheKey,
      async () => {
        // Calculate metrics from stored data
        const metrics = await this.calculateMetricsSummary();
        const webVitals = await this.calculateWebVitalsSummary();
        const resources = await this.getResourceUsage();
        
        return { metrics, webVitals, resources };
      },
      CacheTTL.SHORT
    );
  }

  /**
   * Store metric in cache for aggregation
   */
  private async storeMetricInCache(metric: PerformanceMetric): Promise<void> {
    const key = `metrics:${metric.name}:${Date.now()}`;
    await cache.set(key, metric, CacheTTL.LONG);
  }

  /**
   * Store web vital in cache
   */
  private async storeWebVitalInCache(vital: WebVital): Promise<void> {
    const key = `webvitals:${vital.name}:${Date.now()}`;
    await cache.set(key, vital, CacheTTL.LONG);
  }

  /**
   * Calculate metrics summary from cached data
   */
  private async calculateMetricsSummary(): Promise<{
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    cacheHitRate: number;
  }> {
    // This would aggregate from cached metrics
    // For now, return mock data
    return {
      avgResponseTime: 150,
      errorRate: 0.02,
      throughput: 100,
      cacheHitRate: 0.85,
    };
  }

  /**
   * Calculate web vitals summary
   */
  private async calculateWebVitalsSummary(): Promise<{
    cls: { avg: number; p95: number };
    fid: { avg: number; p95: number };
    lcp: { avg: number; p95: number };
    fcp: { avg: number; p95: number };
    ttfb: { avg: number; p95: number };
  }> {
    // This would aggregate from cached web vitals
    return {
      cls: { avg: 0.05, p95: 0.1 },
      fid: { avg: 50, p95: 100 },
      lcp: { avg: 1200, p95: 2500 },
      fcp: { avg: 800, p95: 1800 },
      ttfb: { avg: 200, p95: 500 },
    };
  }

  /**
   * Get current resource usage
   */
  private async getResourceUsage(): Promise<{
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  }> {
    const memoryUsage = process.memoryUsage();
    
    return {
      memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      activeConnections: 0, // Would need to track this separately
    };
  }

  /**
   * Create performance report
   */
  async createPerformanceReport(): Promise<{
    summary: any;
    recommendations: string[];
    alerts: Array<{ level: 'warning' | 'error'; message: string }>;
  }> {
    const summary = await this.getPerformanceSummary();
    const recommendations: string[] = [];
    const alerts: Array<{ level: 'warning' | 'error'; message: string }> = [];

    // Analyze and generate recommendations
    if (summary.metrics.avgResponseTime > 500) {
      alerts.push({
        level: 'warning',
        message: 'Average response time is above 500ms',
      });
      recommendations.push('Consider optimizing database queries and adding more caching');
    }

    if (summary.metrics.errorRate > 0.05) {
      alerts.push({
        level: 'error',
        message: 'Error rate is above 5%',
      });
      recommendations.push('Investigate and fix recurring errors');
    }

    if (summary.webVitals.lcp.avg > 2500) {
      alerts.push({
        level: 'warning',
        message: 'Largest Contentful Paint is above 2.5s',
      });
      recommendations.push('Optimize images and reduce bundle size');
    }

    if (summary.metrics.cacheHitRate < 0.7) {
      recommendations.push('Improve cache strategy to increase hit rate');
    }

    return { summary, recommendations, alerts };
  }
}

/**
 * Client-side performance monitoring
 */
export const clientPerformanceMonitor = {
  /**
   * Initialize web vitals monitoring
   */
  initWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS((metric) => this.sendWebVital('CLS', metric));
      onFCP((metric) => this.sendWebVital('FCP', metric));
      onLCP((metric) => this.sendWebVital('LCP', metric));
      onTTFB((metric) => this.sendWebVital('TTFB', metric));
      onINP((metric) => this.sendWebVital('INP', metric));
    }).catch(console.error);
  },

  /**
   * Send web vital to server
   */
  sendWebVital(name: string, metric: Metric): void {
    const rating = this.getVitalRating(name, metric.value);
    
    fetch('/api/performance/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value: metric.value,
        rating,
        url: window.location.pathname,
      }),
    }).catch(console.error);
  },

  /**
   * Get web vital rating
   */
  getVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      CLS: [0.1, 0.25],
      FID: [100, 300],
      INP: [200, 500],
      FCP: [1800, 3000],
      LCP: [2500, 4000],
      TTFB: [800, 1800],
    };

    const [good, poor] = thresholds[name] || [0, 0];
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  },
};

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();