/**
 * Logging and monitoring system
 * In production, integrate with services like Datadog, New Relic, or Sentry
 */

import { ENV } from './env';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: number;
  requestId?: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  /**
   * Format log entry for console output
   */
  private formatLogEntry(entry: LogEntry): string {
    const emoji = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.CRITICAL]: '🚨',
    };

    const parts = [
      emoji[entry.level],
      `[${entry.level.toUpperCase()}]`,
      entry.timestamp,
      entry.message,
    ];

    if (entry.context) {
      parts.push(JSON.stringify(entry.context, null, 2));
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`);
      if (entry.error.stack && !ENV.isProduction) {
        parts.push(entry.error.stack);
      }
    }

    return parts.join(' ');
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: (error as { code?: string }).code,
      } : undefined,
    };

    // Store in memory (limited size)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const formatted = this.formatLogEntry(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formatted);
        break;
    }

    // In production, send to external service
    if (ENV.isProduction) {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Send logs to external monitoring service
   */
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Integrate with Sentry, Datadog, etc.
    // Example for Sentry:
    // if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
    //   Sentry.captureException(entry.error, {
    //     level: entry.level === LogLevel.CRITICAL ? 'fatal' : 'error',
    //     extra: entry.context,
    //   });
    // }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  critical(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Track a metric value
   */
  track(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    const values = this.metrics.get(metricName)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Time an operation
   */
  async time<T>(metricName: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      this.track(metricName, duration);
      
      if (duration > 1000) {
        logger.warn(`Slow operation: ${metricName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.track(metricName, duration);
      logger.error(`Operation failed: ${metricName} after ${duration}ms`, error as Error);
      throw error;
    }
  }

  /**
   * Get statistics for a metric
   */
  getStats(metricName: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, _] of this.metrics) {
      const stats = this.getStats(name);
      if (stats) {
        result[name] = stats;
      }
    }
    
    return result;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Request tracking middleware helper
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Audit logging for sensitive operations
 */
export interface AuditLogEntry {
  timestamp: string;
  userId: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

class AuditLogger {
  private auditLogs: AuditLogEntry[] = [];
  private maxLogs = 10000;

  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const fullEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.auditLogs.push(fullEntry);
    
    if (this.auditLogs.length > this.maxLogs) {
      this.auditLogs.shift();
    }

    // Log to console in development
    if (!ENV.isProduction) {
      console.log('[AUDIT]', JSON.stringify(fullEntry, null, 2));
    }

    // In production, send to secure audit log storage
    if (ENV.isProduction) {
      this.sendToAuditStorage(fullEntry);
    }
  }

  private sendToAuditStorage(entry: AuditLogEntry): void {
    // TODO: Send to secure audit storage (database, S3, etc.)
  }

  getRecentAudits(count = 100): AuditLogEntry[] {
    return this.auditLogs.slice(-count);
  }

  getAuditsByUser(userId: number): AuditLogEntry[] {
    return this.auditLogs.filter(log => log.userId === userId);
  }

  getAuditsByResource(resourceType: string, resourceId?: number): AuditLogEntry[] {
    return this.auditLogs.filter(
      log => log.resourceType === resourceType && 
      (resourceId === undefined || log.resourceId === resourceId)
    );
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
