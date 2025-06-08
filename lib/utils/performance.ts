// Performance monitoring and optimization utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private timers: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.metrics.set(label, duration);
    this.timers.delete(label);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  getMetric(label: string): number | undefined {
    return this.metrics.get(label);
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }
}

// Hook for performance monitoring in React components
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startTimer: (label: string) => monitor.startTimer(label),
    endTimer: (label: string) => monitor.endTimer(label),
    getMetric: (label: string) => monitor.getMetric(label),
    getAllMetrics: () => monitor.getAllMetrics()
  };
}

// Debounce utility for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for rate limiting
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoization utility for expensive calculations
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Batch processing utility for API calls
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private timeoutId: NodeJS.Timeout | null = null;
  
  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private batchSize: number = 10,
    private delay: number = 100
  ) {}
  
  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item);
      
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      this.timeoutId = setTimeout(() => {
        this.processBatch().catch(reject);
      }, this.delay);
      
      if (this.batch.length >= this.batchSize) {
        clearTimeout(this.timeoutId);
        this.processBatch().then(results => {
          const index = this.batch.length - 1;
          resolve(results[index]);
        }).catch(reject);
      }
    });
  }
  
  private async processBatch(): Promise<R[]> {
    if (this.batch.length === 0) return [];
    
    const items = [...this.batch];
    this.batch = [];
    
    try {
      return await this.processor(items);
    } catch (error) {
      console.error('Batch processing error:', error);
      throw error;
    }
  }
} 