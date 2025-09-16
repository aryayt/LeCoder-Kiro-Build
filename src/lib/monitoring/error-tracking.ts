/**
 * Error Tracking and Logging System
 */

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  environment: string;
  version: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'api' | 'database' | 'ai' | 'network' | 'validation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  fingerprint: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

class ErrorTracker {
  private errors: Map<string, ErrorReport> = new Map();
  private alertThresholds = {
    critical: 1,    // Alert immediately
    high: 5,        // Alert after 5 occurrences
    medium: 20,     // Alert after 20 occurrences
    low: 100,       // Alert after 100 occurrences
  };
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientSideTracking();
    }
  }
  
  private initializeClientSideTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'javascript',
        severity: 'medium',
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        type: 'javascript',
        severity: 'high',
        extra: {
          reason: event.reason,
        },
      });
    });
    
    // Network errors
    this.interceptFetch();
  }
  
  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.captureError(new Error(`HTTP ${response.status}: ${response.statusText}`), {
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            extra: {
              url: args[0],
              status: response.status,
              statusText: response.statusText,
            },
          });
        }
        
        return response;
      } catch (error) {
        this.captureError(error as Error, {
          type: 'network',
          severity: 'high',
          extra: {
            url: args[0],
          },
        });
        throw error;
      }
    };
  }
  
  public captureError(error: Error, options: {
    type: ErrorReport['type'];
    severity: ErrorReport['severity'];
    userId?: string;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }) {
    const context = this.buildContext(options);
    const fingerprint = this.generateFingerprint(error, context);
    
    const existingError = this.errors.get(fingerprint);
    
    if (existingError) {
      // Update existing error
      existingError.count++;
      existingError.lastSeen = Date.now();
    } else {
      // Create new error report
      const errorReport: ErrorReport = {
        id: this.generateId(),
        message: error.message,
        stack: error.stack,
        type: options.type,
        severity: options.severity,
        context,
        fingerprint,
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      };
      
      this.errors.set(fingerprint, errorReport);
    }
    
    // Send to logging service
    this.sendToLoggingService(this.errors.get(fingerprint)!);
    
    // Check if we need to send an alert
    this.checkAlertThreshold(this.errors.get(fingerprint)!);
  }
  
  private buildContext(options: any): ErrorContext {
    const context: ErrorContext = {
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
    };
    
    if (options.userId) context.userId = options.userId;
    if (options.tags) context.tags = options.tags;
    if (options.extra) context.extra = options.extra;
    
    return context;
  }
  
  private generateFingerprint(error: Error, context: ErrorContext): string {
    // Create a unique fingerprint for grouping similar errors
    const key = `${error.message}-${context.url}-${error.stack?.split('\n')[1] || ''}`;
    return this.hash(key);
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  private async sendToLoggingService(errorReport: ErrorReport) {
    try {
      // Send to your logging service (e.g., Vercel Analytics, Sentry, etc.)
      if (typeof window !== 'undefined') {
        // Client-side logging
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport),
        });
      } else {
        // Server-side logging
        console.error('Error Report:', JSON.stringify(errorReport, null, 2));
      }
    } catch (loggingError) {
      console.error('Failed to send error report:', loggingError);
    }
  }
  
  private checkAlertThreshold(errorReport: ErrorReport) {
    const threshold = this.alertThresholds[errorReport.severity];
    
    if (errorReport.count >= threshold) {
      this.sendAlert(errorReport);
    }
  }
  
  private async sendAlert(errorReport: ErrorReport) {
    try {
      // Send alert (email, Slack, etc.)
      await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'error_threshold',
          severity: errorReport.severity,
          message: `Error threshold reached: ${errorReport.message}`,
          count: errorReport.count,
          errorId: errorReport.id,
          fingerprint: errorReport.fingerprint,
        }),
      });
    } catch (alertError) {
      console.error('Failed to send alert:', alertError);
    }
  }
  
  // Public methods
  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: any) {
    const error = new Error(message);
    this.captureError(error, {
      type: 'javascript',
      severity: level === 'error' ? 'medium' : 'low',
      extra,
    });
  }
  
  public setUser(userId: string, email?: string, username?: string) {
    // Store user context for future error reports
    if (typeof window !== 'undefined') {
      (window as any).__errorTrackerUser = { userId, email, username };
    }
  }
  
  public addBreadcrumb(message: string, category?: string, data?: any) {
    // Add breadcrumb for debugging context
    const breadcrumb = {
      message,
      category: category || 'default',
      data,
      timestamp: Date.now(),
    };
    
    if (typeof window !== 'undefined') {
      (window as any).__errorTrackerBreadcrumbs = (window as any).__errorTrackerBreadcrumbs || [];
      (window as any).__errorTrackerBreadcrumbs.push(breadcrumb);
      
      // Keep only last 50 breadcrumbs
      if ((window as any).__errorTrackerBreadcrumbs.length > 50) {
        (window as any).__errorTrackerBreadcrumbs.shift();
      }
    }
  }
  
  public getErrorStats() {
    const stats = {
      total: this.errors.size,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      byType: {
        javascript: 0,
        api: 0,
        database: 0,
        ai: 0,
        network: 0,
        validation: 0,
      },
    };
    
    for (const error of this.errors.values()) {
      stats.bySeverity[error.severity]++;
      stats.byType[error.type]++;
    }
    
    return stats;
  }
}

// Singleton instance
let errorTracker: ErrorTracker | null = null;

export function getErrorTracker(): ErrorTracker {
  if (!errorTracker) {
    errorTracker = new ErrorTracker();
  }
  return errorTracker;
}

// Convenience functions
export function captureError(error: Error, options?: {
  type?: ErrorReport['type'];
  severity?: ErrorReport['severity'];
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}) {
  const tracker = getErrorTracker();
  tracker.captureError(error, {
    type: 'javascript',
    severity: 'medium',
    ...options,
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: any) {
  const tracker = getErrorTracker();
  tracker.captureMessage(message, level, extra);
}

export function setUser(userId: string, email?: string, username?: string) {
  const tracker = getErrorTracker();
  tracker.setUser(userId, email, username);
}

export function addBreadcrumb(message: string, category?: string, data?: any) {
  const tracker = getErrorTracker();
  tracker.addBreadcrumb(message, category, data);
}