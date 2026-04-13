// Worker Manager - Handles Web Worker communication
// Provides a clean API for offloading render work

export class WorkerManager {
  constructor() {
    this.worker = null;
    this.isSupported = this.checkSupport();
    this.currentRender = null;
  }

  checkSupport() {
    return (
      typeof Worker !== 'undefined' &&
      typeof OffscreenCanvas !== 'undefined'
    );
  }

  init() {
    if (!this.isSupported) {
      console.log('[WorkerManager] Web Workers not supported, using fallback');
      return false;
    }

    try {
      this.worker = new Worker('./js/render-worker.js', { type: 'module' });
      
      this.worker.onmessage = (e) => {
        this.handleMessage(e.data);
      };

      this.worker.onerror = (error) => {
        console.error('[WorkerManager] Worker error:', error);
        if (this.currentRender?.onError) {
          this.currentRender.onError(error);
        }
      };

      return true;
    } catch (error) {
      console.error('[WorkerManager] Failed to initialize worker:', error);
      this.isSupported = false;
      return false;
    }
  }

  handleMessage(data) {
    const { type } = data;

    switch (type) {
      case 'ready':
        console.log('[WorkerManager] Worker ready');
        break;
      
      case 'progress':
        if (this.currentRender?.onProgress) {
          this.currentRender.onProgress(data.rendered, data.total);
        }
        break;
      
      case 'complete':
        if (this.currentRender?.onComplete) {
          this.currentRender.onComplete(data.count);
        }
        this.currentRender = null;
        break;
      
      case 'cancelled':
        console.log('[WorkerManager] Render cancelled');
        this.currentRender = null;
        break;
      
      case 'error':
        console.error('[WorkerManager] Render error:', data.error);
        if (this.currentRender?.onError) {
          this.currentRender.onError(new Error(data.error));
        }
        this.currentRender = null;
        break;
    }
  }

  render(params) {
    if (!this.isSupported || !this.worker) {
      return false;
    }

    const {
      canvas,
      totalLines,
      strokeWidth,
      colorSet,
      engine,
      seed,
      animation,
      animationSpeed,
      onProgress,
      onComplete,
      onError
    } = params;

    // Store callbacks
    this.currentRender = { onProgress, onComplete, onError };

    // Transfer canvas to worker
    const offscreen = canvas.transferControlToOffscreen();

    this.worker.postMessage({
      type: 'render',
      params: {
        canvas: offscreen,
        totalLines,
        strokeWidth,
        colorSet,
        engine,
        seed,
        animation,
        animationSpeed
      }
    }, [offscreen]);

    return true;
  }

  cancel() {
    if (this.worker && this.currentRender) {
      this.worker.postMessage({ type: 'cancel' });
      this.currentRender = null;
    }
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const workerManager = new WorkerManager();
