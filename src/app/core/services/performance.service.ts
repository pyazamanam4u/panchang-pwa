import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private readonly logger = inject(LoggerService);
  private metrics: Map<string, number> = new Map();

  startTiming(label: string): void {
    this.metrics.set(`${label}_start`, performance.now());
    this.logger.debug(`Started timing: ${label}`);
  }

  endTiming(label: string): number {
    const startTime = this.metrics.get(`${label}_start`);
    if (!startTime) {
      this.logger.warn(`No start time found for: ${label}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.logger.info(`Timing completed: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    this.metrics.delete(`${label}_start`);

    return duration;
  }

  measureFunction<T>(label: string, fn: () => T): T {
    this.startTiming(label);
    try {
      const result = fn();
      this.endTiming(label);
      return result;
    } catch (error) {
      this.endTiming(label);
      throw error;
    }
  }

  async measureAsyncFunction<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(label);
    try {
      const result = await fn();
      this.endTiming(label);
      return result;
    } catch (error) {
      this.endTiming(label);
      throw error;
    }
  }

  // Memory usage monitoring
  getMemoryUsage(): { used: number; total: number; limit: number } | null {
    // @ts-ignore - performance.memory is not in types but available in Chrome
    const memory = performance.memory;
    if (!memory) {
      return null;
    }

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }

  logMemoryUsage(): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      this.logger.info('Memory Usage', {
        used: `${(memory.used / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.total / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.limit / 1024 / 1024).toFixed(2)} MB`,
        usagePercent: `${((memory.used / memory.limit) * 100).toFixed(2)}%`
      });
    }
  }

  // Core Web Vitals simulation
  measureLCP(): void {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.logger.info('LCP measured', { value: `${lastEntry.startTime.toFixed(2)}ms` });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }

  measureFID(): void {
    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.logger.info('FID measured', { value: `${entry.processingStart - entry.startTime}ms` });
      });
    }).observe({ entryTypes: ['first-input'] });
  }

  measureCLS(): void {
    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.logger.info('CLS measured', { value: clsValue.toFixed(4) });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Initialize performance monitoring
  initialize(): void {
    this.logger.info('Performance monitoring initialized');

    // Measure Core Web Vitals
    if ('PerformanceObserver' in window) {
      this.measureLCP();
      this.measureFID();
      this.measureCLS();
    }

    // Log memory usage periodically (every 30 seconds)
    setInterval(() => {
      this.logMemoryUsage();
    }, 30000);
  }
}