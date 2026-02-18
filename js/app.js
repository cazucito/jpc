import { AppState } from './state.js';
import { PerformanceConfig } from './config.js';
import { JPPainter } from './painter.js';

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

function updateStatus(isRendering) {
  const badge = document.getElementById('render-status');
  if (!badge) return;

  if (isRendering) {
    badge.textContent = 'Rendering...';
    badge.classList.add('is-rendering');
    return;
  }

  badge.textContent = 'Ready';
  badge.classList.remove('is-rendering');
}

function setActivePreset(colorSet) {
  const chips = document.querySelectorAll('[data-action="render"]');
  chips.forEach((chip) => {
    chip.classList.toggle('is-active', chip.getAttribute('data-colorset') === colorSet);
  });
}

function renderWithDefaults(colorSet) {
  const palette = colorSet || AppState.lastColorSet || Default.colorSet();
  updateStatus(true);

  JPPainter.createPaintingA(
    AppState.canvas,
    Default.howManyLines(),
    palette
  );

  AppState.lastColorSet = palette;
  setActivePreset(palette);

  window.setTimeout(() => updateStatus(false), 260);
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

function attachNavigationHandlers() {
  const renderButtons = document.querySelectorAll('[data-action="render"]');
  renderButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const colorSet = button.getAttribute('data-colorset') || Default.colorSet();
      renderWithDefaults(colorSet);
    });
  });

  const regenerateButton = document.querySelector('[data-action="regenerate"]');
  if (regenerateButton) {
    regenerateButton.addEventListener('click', () => {
      renderWithDefaults(AppState.lastColorSet || Default.colorSet());
    });
  }
}

export function init() {
  setupCanvas();
  renderWithDefaults(Default.colorSet());
  attachResizeHandler();
  attachNavigationHandlers();
}

document.addEventListener('DOMContentLoaded', init);
