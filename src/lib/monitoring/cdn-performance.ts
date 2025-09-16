/**
 * CDN and Edge Performance Monitoring
 */

interface PerformanceMetrics {
  region: string;
  timestamp: number;
  metrics: {
    ttfb: number; // Time to First Byte
    fcp: number;  // First Contentful Paint
    lcp: number;  // Largest Contentful Paint
    cls: number;  // Cumulative Layout Shift
    fid: number;  // First Input Delay
  };
  connection: {
    effectiveType: string;
    rtt: number;
    downlink: number;
  };
  cache: {
    hit: boolean;
    age?: number;
  };
}

class CDNPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }
  
  private initializeMonitoring() {
    // Monitor Web Vitals
    this.observeWebVitals();
    
    // Monitor resource loading
    this.observeResourceTiming();
    
    // Monitor navigation timing
    this.observeNavigationTiming();
  }
  
  private observeWebVitals() {
    // Use the web-vitals library for accurate measurements
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('fcp', entry.startTime);
          }
        }
      }).observe({ entryTypes: ['paint'] });
      
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as LargestContentfulPaint[];
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordMetric('lcp', lastEntry.startTime);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries() as LayoutShift[];
        for (const entry of entries) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('cls', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
      
      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        for (const entry of entries) {
          if (typeof entry.processingStart === 'number') {
            this.recordMetric('fid', entry.processingStart - entry.startTime);
          }
        }
      }).observe({ entryTypes: ['first-input'] });
    }
  }
  
  private observeResourceTiming() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.analyzeResourceTiming(entry as PerformanceResourceTiming);
        }
      }).observe({ entryTypes: ['resource'] });
    }
  }
  
  private observeNavigationTiming() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.requestStart;
          this.recordMetric('ttfb', ttfb);
        }
      });
    }
  }
  
  private analyzeResourceTiming(entry: PerformanceResourceTiming) {
    // Check if resource was served from cache
    const fromCache = entry.transferSize === 0 && entry.decodedBodySize > 0;
    
    // Calculate cache age from headers (if available)
    const cacheAge = this.getCacheAge(entry);
    
    // Record cache performance
    this.recordCacheMetric(entry.name, {
      hit: fromCache,
      age: cacheAge,
      size: entry.transferSize,
      duration: entry.duration,
    });
  }
  
  private getCacheAge(entry: PerformanceResourceTiming): number | undefined {
    // This would require access to response headers
    // In a real implementation, you might use the Resource Timing API Level 2
    return undefined;
  }
  
  private recordMetric(type: string, value: number) {
    // Send metrics to monitoring service
    this.sendToAnalytics({
      type,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
    });
  }
  
  private recordCacheMetric(resource: string, cache: any) {
    this.sendToAnalytics({
      type: 'cache',
      resource,
      cache,
      timestamp: Date.now(),
    });
  }
  
  private getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      return {
        effectiveType: conn.effectiveType,
        rtt: conn.rtt,
        downlink: conn.downlink,
      };
    }
    return null;
  }
  
  private sendToAnalytics(data: any) {
    // Send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/performance/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).catch(console.error);
    }
  }
  
  // Public methods for manual tracking
  public trackCustomMetric(name: string, value: number, tags?: Record<string, string>) {
    this.sendToAnalytics({
      type: 'custom',
      name,
      value,
      tags,
      timestamp: Date.now(),
    });
  }
  
  public trackUserInteraction(action: string, target: string, duration?: number) {
    this.sendToAnalytics({
      type: 'interaction',
      action,
      target,
      duration,
      timestamp: Date.now(),
    });
  }
}

// Singleton instance
let performanceMonitor: CDNPerformanceMonitor | null = null;

export function getPerformanceMonitor(): CDNPerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new CDNPerformanceMonitor();
  }
  return performanceMonitor;
}

// Utility functions for edge caching
export function getCacheHeaders(maxAge: number, sMaxAge?: number, staleWhileRevalidate?: number) {
  const parts = [`max-age=${maxAge}`];
  
  if (sMaxAge !== undefined) {
    parts.push(`s-maxage=${sMaxAge}`);
  }
  
  if (staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }
  
  return `public, ${parts.join(', ')}`;
}

export function getEdgeConfig() {
  return {
    // Vercel Edge Config for dynamic configuration
    regions: ['iad1', 'sfo1', 'lhr1', 'hnd1', 'syd1'],
    
    // Cache strategies by route type
    cacheStrategies: {
      static: getCacheHeaders(31536000), // 1 year
      api: getCacheHeaders(300, 300, 86400), // 5 min, stale 1 day
      pages: getCacheHeaders(0, 86400, 604800), // ISR with 1 day, stale 1 week
      images: getCacheHeaders(31536000), // 1 year
    },
    
    // Performance budgets
    budgets: {
      maxBundleSize: 244000, // 244KB
      maxImageSize: 500000,  // 500KB
      maxTTFB: 800,         // 800ms
      maxFCP: 1800,         // 1.8s
      maxLCP: 2500,         // 2.5s
      maxCLS: 0.1,          // 0.1
      maxFID: 100,          // 100ms
    },
  };
}