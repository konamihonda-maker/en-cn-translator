// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  startTimer(label) {
    this.metrics[label] = performance.now();
  }

  endTimer(label) {
    if (this.metrics[label]) {
      const duration = performance.now() - this.metrics[label];
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      
      // Warn if slow
      if (duration > 3000) {
        console.warn(`⚠️ ${label} is slow (${duration.toFixed(2)}ms)`);
      }
      
      delete this.metrics[label];
      return duration;
    }
  }

  // Check if OCR will be slow
  checkDeviceCapabilities() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    if (memory < 4 || cores < 4) {
      return {
        slow: true,
        message: 'Your device may be slow for image processing. Consider using text input.',
        estimatedTime: '3-8 seconds'
      };
    }
    
    return {
      slow: false,
      message: '',
      estimatedTime: '1-3 seconds'
    };
  }
}

export const perfMonitor = new PerformanceMonitor();

// Lazy load optimization
export function preloadOCR() {
  // Preload after page is idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('../services/ocrService').then(() => {
        console.log('OCR preloaded');
      });
    });
  }
}