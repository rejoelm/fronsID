/**
 * Performance Monitoring Hook
 * Tracks API performance, cache hit rates, and user experience metrics
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { performanceCache } from '@/lib/cache';

interface PerformanceMetrics {
  apiLatency: {
    average: number;
    p95: number;
    requests: number;
  };
  cacheStats: {
    hitRate: number;
    totalItems: number;
    memoryUsage: number;
  };
  renderTimes: {
    average: number;
    slowRenders: number;
  };
  errors: {
    count: number;
    lastError?: string;
  };
}

interface RequestTiming {
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private requestTimings: RequestTiming[] = [];
  private renderTimes: number[] = [];
  private errorCount = 0;
  private lastError?: string;
  private maxHistorySize = 100;

  recordApiRequest(
    url: string,
    method: string,
    startTime: number,
    endTime: number,
    success: boolean,
    error?: string
  ): void {
    const timing: RequestTiming = {
      url,
      method,
      startTime,
      endTime,
      duration: endTime - startTime,
      success,
      error,
    };

    this.requestTimings.push(timing);
    
    // Keep only recent requests
    if (this.requestTimings.length > this.maxHistorySize) {
      this.requestTimings = this.requestTimings.slice(-this.maxHistorySize);
    }

    if (!success) {
      this.errorCount++;
      this.lastError = error;
    }
  }

  recordRenderTime(duration: number): void {
    this.renderTimes.push(duration);
    
    // Keep only recent render times
    if (this.renderTimes.length > this.maxHistorySize) {
      this.renderTimes = this.renderTimes.slice(-this.maxHistorySize);
    }
  }

  getMetrics(): PerformanceMetrics {
    const cacheStats = performanceCache.getCacheStats();
    
    // Calculate API latency metrics
    const successfulRequests = this.requestTimings.filter(r => r.success);
    const durations = successfulRequests.map(r => r.duration);
    const averageLatency = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
    
    const sortedDurations = durations.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p95Latency = sortedDurations[p95Index] || 0;

    // Calculate render metrics
    const averageRenderTime = this.renderTimes.length > 0
      ? this.renderTimes.reduce((sum, t) => sum + t, 0) / this.renderTimes.length
      : 0;
    const slowRenders = this.renderTimes.filter(t => t > 16).length; // > 16ms is slow

    return {
      apiLatency: {
        average: Math.round(averageLatency),
        p95: Math.round(p95Latency),
        requests: this.requestTimings.length,
      },
      cacheStats: {
        hitRate: cacheStats.hitRate,
        totalItems: cacheStats.totalItems,
        memoryUsage: cacheStats.memoryUsage,
      },
      renderTimes: {
        average: Math.round(averageRenderTime * 100) / 100,
        slowRenders,
      },
      errors: {
        count: this.errorCount,
        lastError: this.lastError,
      },
    };
  }

  getRecentRequests(limit: number = 10): RequestTiming[] {
    return this.requestTimings.slice(-limit);
  }

  getSlowestRequests(limit: number = 5): RequestTiming[] {
    return [...this.requestTimings]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  clearMetrics(): void {
    this.requestTimings = [];
    this.renderTimes = [];
    this.errorCount = 0;
    this.lastError = undefined;
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  
  // Performance observer for render times
  const renderStartTime = useRef<number | null>(null);

  const startRenderMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderMeasurement = useCallback(() => {
    if (renderStartTime.current) {
      const duration = performance.now() - renderStartTime.current;
      performanceMonitor.recordRenderTime(duration);
      renderStartTime.current = null;
    }
  }, []);

  // API request interceptor
  const interceptApiRequest = useCallback((
    url: string,
    method: string = 'GET'
  ) => {
    const startTime = performance.now();
    
    return {
      onSuccess: () => {
        const endTime = performance.now();
        performanceMonitor.recordApiRequest(url, method, startTime, endTime, true);
      },
      onError: (error: string) => {
        const endTime = performance.now();
        performanceMonitor.recordApiRequest(url, method, startTime, endTime, false, error);
      },
    };
  }, []);

  // Update metrics periodically
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isEnabled]);

  const enableMonitoring = useCallback(() => {
    setIsEnabled(true);
    setMetrics(performanceMonitor.getMetrics());
  }, []);

  const disableMonitoring = useCallback(() => {
    setIsEnabled(false);
    setMetrics(null);
  }, []);

  const clearMetrics = useCallback(() => {
    performanceMonitor.clearMetrics();
    if (isEnabled) {
      setMetrics(performanceMonitor.getMetrics());
    }
  }, [isEnabled]);

  const getDetailedMetrics = useCallback(() => ({
    recentRequests: performanceMonitor.getRecentRequests(),
    slowestRequests: performanceMonitor.getSlowestRequests(),
    cacheStats: performanceCache.getCacheStats(),
  }), []);

  return {
    metrics,
    isEnabled,
    enableMonitoring,
    disableMonitoring,
    clearMetrics,
    getDetailedMetrics,
    startRenderMeasurement,
    endRenderMeasurement,
    interceptApiRequest,
  };
}

// Higher-order component for automatic render time tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function PerformanceTrackedComponent(props: P) {
    const { startRenderMeasurement, endRenderMeasurement } = usePerformanceMonitor();

    useEffect(() => {
      startRenderMeasurement();
      return endRenderMeasurement;
    });

    return React.createElement(Component, props);
  };
}

// Hook for API request performance tracking
export function useApiPerformance() {
  const { interceptApiRequest } = usePerformanceMonitor();

  const trackApiRequest = useCallback(async <T>(
    apiCall: () => Promise<T>,
    url: string,
    method: string = 'GET'
  ): Promise<T> => {
    const interceptor = interceptApiRequest(url, method);
    
    try {
      const result = await apiCall();
      interceptor.onSuccess();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      interceptor.onError(errorMessage);
      throw error;
    }
  }, [interceptApiRequest]);

  return { trackApiRequest };
}

// Performance budget checker
export function usePerformanceBudget() {
  const [budgetStatus, setBudgetStatus] = useState<{
    withinBudget: boolean;
    violations: string[];
  }>({ withinBudget: true, violations: [] });

  const checkBudget = useCallback((metrics: PerformanceMetrics) => {
    const violations: string[] = [];

    // API latency budget: 500ms average, 1000ms p95
    if (metrics.apiLatency.average > 500) {
      violations.push(`API latency average (${metrics.apiLatency.average}ms) exceeds budget (500ms)`);
    }
    if (metrics.apiLatency.p95 > 1000) {
      violations.push(`API latency p95 (${metrics.apiLatency.p95}ms) exceeds budget (1000ms)`);
    }

    // Render time budget: 16ms average (60 FPS)
    if (metrics.renderTimes.average > 16) {
      violations.push(`Render time average (${metrics.renderTimes.average}ms) exceeds budget (16ms)`);
    }

    // Cache memory budget: 10MB
    if (metrics.cacheStats.memoryUsage > 10 * 1024) {
      violations.push(`Cache memory usage (${metrics.cacheStats.memoryUsage}KB) exceeds budget (10MB)`);
    }

    // Error rate budget: < 5%
    const errorRate = metrics.errors.count / Math.max(metrics.apiLatency.requests, 1);
    if (errorRate > 0.05) {
      violations.push(`Error rate (${(errorRate * 100).toFixed(1)}%) exceeds budget (5%)`);
    }

    setBudgetStatus({
      withinBudget: violations.length === 0,
      violations,
    });
  }, []);

  return { budgetStatus, checkBudget };
}

export default performanceMonitor;