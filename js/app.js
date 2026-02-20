import { AppState }         from './state.js';
import { PerformanceConfig } from './config.js';
import { UserPreferences }   from './preferences.js';
import { JPPainter }         from './painter.js';
import { UI }                from './ui.js';

function setupCanvas() {
  const container = document.getElementById('containerCanvas');
  const canvas    = document.getElementById('jpcanvas');
  if (!container || !canvas) return;

  const width   = Math.max(320, container.clientWidth || window.innerWidth || 320);
  const vHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
  const height  = Math.max(
    PerformanceConfig.MIN_CANVAS_HEIGHT,
    Math.min(PerformanceConfig.MAX_CANVAS_HEIGHT, vHeight - PerformanceConfig.CANVAS_VERTICAL_PADDING)
  );

  container.style.width  = `${width}px`;
  container.style.height = `${height}px`;
  canvas.width           = width;
  canvas.height          = height;

  AppState.canvas = canvas;
  AppState.ctx    = canvas.getContext('2d');
}

function render(colorSet) {
  const palette = colorSet ?? UserPreferences.colorSet;

  AppState.renderController?.abort();
  AppState.renderController = new AbortController();

  UserPreferences.colorSet = palette;
  UserPreferences.save();

  UI.setRenderStatus(true);
  UI.setTitle(palette);
  UI.setActivePreset(palette);

  JPPainter.render({
    ctx:         AppState.ctx,
    canvas:      AppState.canvas,
    totalLines:  UserPreferences.lines,
    strokeWidth: UserPreferences.stroke,
    colorSet:    palette,
    signal:      AppState.renderController.signal,
    onComplete:  () => UI.setRenderStatus(false),
  });
}

function attachResizeHandler() {
  window.addEventListener('resize', () => {
    clearTimeout(AppState.resizeTimer);
    AppState.resizeTimer = setTimeout(() => {
      setupCanvas();
      render(UserPreferences.colorSet);
    }, PerformanceConfig.RESIZE_DEBOUNCE_MS);
  });
}

function attachNavigationHandlers() {
  document.querySelectorAll('[data-action="render"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      render(btn.getAttribute('data-colorset') ?? UserPreferences.colorSet);
    });
  });

  document.querySelector('[data-action="regenerate"]')?.addEventListener('click', () => {
    render(UserPreferences.colorSet);
  });
}

function attachControlHandlers() {
  const lineInput   = document.getElementById('line-count');
  const lineValue   = document.getElementById('line-count-value');
  const strokeInput = document.getElementById('stroke-width');
  const strokeValue = document.getElementById('stroke-width-value');
  const resetBtn    = document.getElementById('reset-defaults');

  let debounceTimer = null;
  const scheduleRender = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => render(), 120);
  };

  lineInput?.addEventListener('input', () => {
    UserPreferences.lines = Number(lineInput.value);
    if (lineValue) lineValue.textContent = String(UserPreferences.lines);
    scheduleRender();
  });

  strokeInput?.addEventListener('input', () => {
    UserPreferences.stroke = Number(strokeInput.value);
    if (strokeValue) strokeValue.textContent = String(UserPreferences.stroke);
    scheduleRender();
  });

  resetBtn?.addEventListener('click', () => {
    UserPreferences.reset();
    UI.syncControls(UserPreferences);
    render(UserPreferences.colorSet);
  });
}

export function init() {
  UserPreferences.load();
  setupCanvas();
  UI.syncControls(UserPreferences);
  render(UserPreferences.colorSet);
  attachResizeHandler();
  attachNavigationHandlers();
  attachControlHandlers();
}

document.addEventListener('DOMContentLoaded', init);
