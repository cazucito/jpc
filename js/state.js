import { workerManager } from './worker-manager.js';

export const AppState = {
  canvas:           null,
  ctx:              null,
  renderController: null,  // AbortController for the active render
  resizeTimer:      null,
  
  // Cancel any active render (main thread or worker)
  cancelRender() {
    // Cancel worker render if active
    workerManager.cancel();
    
    // Cancel main thread render
    if (this.renderController) {
      this.renderController.abort();
      this.renderController = null;
    }
  }
};
