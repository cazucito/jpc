(function (global) {
  'use strict';

  const JPC = global.JPC = global.JPC || {};
  const AppState = JPC.AppState;
  const PerformanceConfig = JPC.PerformanceConfig;
  const JPPainter = JPC.JPPainter;

  class Default {
    static howManyLines() {
      return PerformanceConfig.DEFAULT_LINES;
    }

    static colorSet() {
      return 'BWR';
    }
  }

  function setupCanvas() {
    const containerCanvas = document.getElementById('containerCanvas');
    const canvas = document.getElementById('jpcanvas');

    if (!containerCanvas || !canvas) return;

    const viewportWidth = Math.max(320, containerCanvas.clientWidth || window.innerWidth || 320);
    const viewportHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);

    const targetHeight = Math.max(
      PerformanceConfig.MIN_CANVAS_HEIGHT,
      Math.min(
        PerformanceConfig.MAX_CANVAS_HEIGHT,
        viewportHeight - PerformanceConfig.CANVAS_VERTICAL_PADDING
      )
    );

    containerCanvas.style.width = `${viewportWidth}px`;
    containerCanvas.style.height = `${targetHeight}px`;

    canvas.width = viewportWidth;
    canvas.height = targetHeight;

    AppState.canvas = canvas;
    AppState.ctx = canvas.getContext('2d');
  }

  function renderWithDefaults(colorSet) {
    JPPainter.createPaintingA(
      AppState.canvas,
      Default.howManyLines(),
      colorSet || Default.colorSet()
    );
  }

  function attachResizeHandler() {
    window.addEventListener('resize', () => {
      clearTimeout(AppState.resizeTimer);
      AppState.resizeTimer = setTimeout(() => {
        setupCanvas();
        renderWithDefaults(AppState.lastColorSet);
      }, PerformanceConfig.RESIZE_DEBOUNCE_MS);
    });
  }

  function init() {
    setupCanvas();
    renderWithDefaults(Default.colorSet());
    attachResizeHandler();
  }

  // Backward compatibility for existing inline navbar actions
  global.Default = Default;
  global.JPPainter = JPPainter;
  global.init = init;

  JPC.Default = Default;
  JPC.init = init;

  document.addEventListener('DOMContentLoaded', init);
})(window);
