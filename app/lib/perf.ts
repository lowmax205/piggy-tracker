/**
 * Performance instrumentation utilities
 * 
 * Success Criteria:
 * - SC-002: Cold start to Dashboard ≤ 2s
 * - SC-006: Transaction modal open ≤ 200ms
 * - SC-007: Dashboard updates ≤ 200ms
 * - SC-008: History list scrolls at 60fps with 500+ items
 */

type PerformanceMark = {
  name: string;
  timestamp: number;
};

type PerformanceMeasure = {
  name: string;
  duration: number;
  start: number;
  end: number;
};

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private measures: PerformanceMeasure[] = [];
  private enabled: boolean = __DEV__;

  /**
   * Mark a performance point in time
   */
  mark(name: string): void {
    if (!this.enabled) return;
    
    this.marks.set(name, {
      name,
      timestamp: Date.now(),
    });
  }

  /**
   * Measure duration between two marks
   */
  measure(name: string, startMark: string, endMark: string): PerformanceMeasure | null {
    if (!this.enabled) return null;

    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (!start || !end) {
      console.warn(`[Perf] Missing marks for measure "${name}". Start: ${startMark}, End: ${endMark}`);
      return null;
    }

    const measure: PerformanceMeasure = {
      name,
      duration: end.timestamp - start.timestamp,
      start: start.timestamp,
      end: end.timestamp,
    };

    this.measures.push(measure);

    // Log to console in dev mode
    if (__DEV__) {
      console.log(`[Perf] ${name}: ${measure.duration}ms`);
    }

    return measure;
  }

  /**
   * Get a specific measure by name
   */
  getMeasure(name: string): PerformanceMeasure | undefined {
    return this.measures.find(m => m.name === name);
  }

  /**
   * Get all measures
   */
  getAllMeasures(): PerformanceMeasure[] {
    return [...this.measures];
  }

  /**
   * Clear all marks and measures
   */
  clear(): void {
    this.marks.clear();
    this.measures = [];
  }

  /**
   * Check if a measure meets the target threshold
   */
  checkThreshold(measureName: string, thresholdMs: number): boolean {
    const measure = this.getMeasure(measureName);
    if (!measure) return false;

    const passed = measure.duration <= thresholdMs;
    
    if (__DEV__) {
      const status = passed ? '✓ PASS' : '✗ FAIL';
      console.log(`[Perf] ${status} ${measureName}: ${measure.duration}ms (target: ≤${thresholdMs}ms)`);
    }

    return passed;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const lines: string[] = ['=== Performance Report ==='];
    
    this.measures.forEach(measure => {
      lines.push(`${measure.name}: ${measure.duration}ms`);
    });

    return lines.join('\n');
  }
}

// Singleton instance
export const perf = new PerformanceMonitor();

/**
 * Performance benchmarks per Success Criteria
 */
export const PERF_TARGETS = {
  COLD_START: 2000,        // SC-002: ≤ 2s
  MODAL_OPEN: 200,         // SC-006: ≤ 200ms
  DASHBOARD_UPDATE: 200,   // SC-007: ≤ 200ms
  HISTORY_FPS: 60,         // SC-008: 60fps
} as const;

/**
 * Measure names for common operations
 */
export const PERF_MARKS = {
  APP_START: 'app-start',
  DASHBOARD_READY: 'dashboard-ready',
  MODAL_OPEN_START: 'modal-open-start',
  MODAL_OPEN_END: 'modal-open-end',
  TRANSACTION_SAVE_START: 'transaction-save-start',
  TRANSACTION_SAVE_END: 'transaction-save-end',
  DASHBOARD_UPDATE_START: 'dashboard-update-start',
  DASHBOARD_UPDATE_END: 'dashboard-update-end',
} as const;

/**
 * Helper to measure cold start time
 */
export function measureColdStart(): void {
  perf.mark(PERF_MARKS.APP_START);
}

/**
 * Helper to measure dashboard ready time
 */
export function measureDashboardReady(): void {
  perf.mark(PERF_MARKS.DASHBOARD_READY);
  const measure = perf.measure('cold-start', PERF_MARKS.APP_START, PERF_MARKS.DASHBOARD_READY);
  
  if (measure) {
    perf.checkThreshold('cold-start', PERF_TARGETS.COLD_START);
  }
}

/**
 * Helper to measure modal open time
 */
export function measureModalOpen(start: boolean): void {
  if (start) {
    perf.mark(PERF_MARKS.MODAL_OPEN_START);
  } else {
    perf.mark(PERF_MARKS.MODAL_OPEN_END);
    const measure = perf.measure('modal-open', PERF_MARKS.MODAL_OPEN_START, PERF_MARKS.MODAL_OPEN_END);
    
    if (measure) {
      perf.checkThreshold('modal-open', PERF_TARGETS.MODAL_OPEN);
    }
  }
}

/**
 * Helper to measure transaction save time
 */
export function measureTransactionSave(start: boolean): void {
  if (start) {
    perf.mark(PERF_MARKS.TRANSACTION_SAVE_START);
  } else {
    perf.mark(PERF_MARKS.TRANSACTION_SAVE_END);
    perf.measure('transaction-save', PERF_MARKS.TRANSACTION_SAVE_START, PERF_MARKS.TRANSACTION_SAVE_END);
  }
}

/**
 * Helper to measure dashboard update time
 */
export function measureDashboardUpdate(start: boolean): void {
  if (start) {
    perf.mark(PERF_MARKS.DASHBOARD_UPDATE_START);
  } else {
    perf.mark(PERF_MARKS.DASHBOARD_UPDATE_END);
    const measure = perf.measure('dashboard-update', PERF_MARKS.DASHBOARD_UPDATE_START, PERF_MARKS.DASHBOARD_UPDATE_END);
    
    if (measure) {
      perf.checkThreshold('dashboard-update', PERF_TARGETS.DASHBOARD_UPDATE);
    }
  }
}
