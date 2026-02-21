import { AppState }         from './state.js';
import { PerformanceConfig } from './config.js';
import { UserPreferences }   from './preferences.js';
import { JPPainter }         from './painter.js';
import { UI }                from './ui.js';
import { ColorRegistry }     from './color.js';

function setupCanvas() {
  const container = document.getElementById('containerCanvas');
  const canvas    = document.getElementById('jpcanvas');
  if (!container || !canvas) return;

  // CSS flex + padding controls the container; canvas fills the content area (inside padding)
  canvas.width  = Math.max(320, canvas.clientWidth);
  canvas.height = Math.max(PerformanceConfig.MIN_CANVAS_HEIGHT, canvas.clientHeight);

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
  const container = document.getElementById('containerCanvas');
  if (!container) return;

  let skipFirst = true;
  new ResizeObserver(() => {
    // Skip the initial observation fired on attach
    if (skipFirst) { skipFirst = false; return; }
    clearTimeout(AppState.resizeTimer);
    AppState.resizeTimer = setTimeout(() => {
      setupCanvas();
      render(UserPreferences.colorSet);
    }, PerformanceConfig.RESIZE_DEBOUNCE_MS);
  }).observe(container);
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

function attachColorPickerHandlers() {
  ['custom-color-1', 'custom-color-2', 'custom-color-3'].forEach((id, i) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      UserPreferences.customColors[i] = e.target.value;
      UserPreferences.save();
      ColorRegistry.register('CUSTOM', UserPreferences.customColors);
      render('CUSTOM');
    });
  });
}

export function init() {
  UserPreferences.load();
  ColorRegistry.register('CUSTOM', UserPreferences.customColors);
  setupCanvas();
  UI.buildPresetChips(
    document.querySelector('nav.controls'),
    ColorRegistry.names(),
    UserPreferences.colorSet
  );
  UI.syncControls(UserPreferences);
  UI.syncColorPickers(UserPreferences);
  render(UserPreferences.colorSet);
  attachResizeHandler();
  attachNavigationHandlers();
  attachControlHandlers();
  attachColorPickerHandlers();
}

document.addEventListener('DOMContentLoaded', init);
