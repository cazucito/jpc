import { AppState } from './state.js';
import { PerformanceConfig } from './config.js';
import { JPPainter } from './painter.js';

const STORAGE_KEY = 'jpc_render_preferences_v1';

class Default {
  static howManyLines() {
    return 9000;
  }

  static strokeWidth() {
    return 2;
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

function persistPreferences() {
  const data = {
    lines: PerformanceConfig.DEFAULT_LINES,
    stroke: PerformanceConfig.STROKE_WIDTH
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadPreferences() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (Number.isFinite(data.lines)) {
      PerformanceConfig.DEFAULT_LINES = data.lines;
    }
    if (Number.isFinite(data.stroke)) {
      PerformanceConfig.STROKE_WIDTH = data.stroke;
    }
  } catch {
    // noop
  }
}

function renderWithDefaults(colorSet) {
  const palette = colorSet || AppState.lastColorSet || Default.colorSet();
  updateStatus(true);

  JPPainter.createPaintingA(
    AppState.canvas,
    PerformanceConfig.DEFAULT_LINES,
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

function syncControlValues() {
  const lineInput = document.getElementById('line-count');
  const lineValue = document.getElementById('line-count-value');
  const strokeInput = document.getElementById('stroke-width');
  const strokeValue = document.getElementById('stroke-width-value');

  if (lineInput && lineValue) {
    lineInput.value = String(PerformanceConfig.DEFAULT_LINES);
    lineValue.textContent = String(PerformanceConfig.DEFAULT_LINES);
  }

  if (strokeInput && strokeValue) {
    strokeInput.value = String(PerformanceConfig.STROKE_WIDTH);
    strokeValue.textContent = String(PerformanceConfig.STROKE_WIDTH);
  }
}

function attachControlHandlers() {
  const lineInput = document.getElementById('line-count');
  const lineValue = document.getElementById('line-count-value');
  const strokeInput = document.getElementById('stroke-width');
  const strokeValue = document.getElementById('stroke-width-value');
  const resetBtn = document.getElementById('reset-defaults');

  if (lineInput && lineValue) {
    lineInput.addEventListener('input', () => {
      const value = Number(lineInput.value);
      lineValue.textContent = String(value);
    });

    lineInput.addEventListener('change', () => {
      PerformanceConfig.DEFAULT_LINES = Number(lineInput.value);
      persistPreferences();
      renderWithDefaults(AppState.lastColorSet);
    });
  }

  if (strokeInput && strokeValue) {
    strokeInput.addEventListener('input', () => {
      const value = Number(strokeInput.value);
      strokeValue.textContent = String(value);
    });

    strokeInput.addEventListener('change', () => {
      PerformanceConfig.STROKE_WIDTH = Number(strokeInput.value);
      persistPreferences();
      renderWithDefaults(AppState.lastColorSet);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      PerformanceConfig.DEFAULT_LINES = Default.howManyLines();
      PerformanceConfig.STROKE_WIDTH = Default.strokeWidth();
      persistPreferences();
      syncControlValues();
      renderWithDefaults(Default.colorSet());
    });
  }
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
  loadPreferences();
  setupCanvas();
  syncControlValues();
  renderWithDefaults(Default.colorSet());
  attachResizeHandler();
  attachNavigationHandlers();
  attachControlHandlers();
}

document.addEventListener('DOMContentLoaded', init);
