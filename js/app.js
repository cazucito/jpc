import { AppState }         from './state.js';
import { PerformanceConfig } from './config.js';
import { UserPreferences }   from './preferences.js';
import { JPPainter }         from './painter.js';
import { UI }                from './ui.js';
import { ColorRegistry }     from './color.js';
import { StrokeTracer, BrushTracer, PenTracer, PencilTracer, MarkerTracer, CharcoalTracer } from './stroke.js';
import { deserializeFromUrl, updateBrowserUrl } from './urlParams.js';

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
    ColorRegistry.register('CUSTOM', UserPreferences.customColors);
    UI.setActivePreset(UserPreferences.colorSet);
    applyStrokeEngine();
    render(UserPreferences.colorSet);
  });
}

function attachRandomizeHandler() {
  const randomBtn = document.getElementById('randomize-config');
  randomBtn?.addEventListener('click', () => {
    const palettes = ColorRegistry.names();
    const engines = ['brush', 'pen', 'pencil', 'marker', 'charcoal'];
    
    UserPreferences.randomize(palettes, engines);
    
    // Update UI
    UI.syncControls(UserPreferences);
    ColorRegistry.register('CUSTOM', UserPreferences.customColors);
    UI.setActivePreset(UserPreferences.colorSet);
    applyStrokeEngine();
    
    // Show toast
    UI.showToast(`Random: ${UserPreferences.colorSet} · ${UserPreferences.lines} lines · ${UserPreferences.engine}`);
    
    render(UserPreferences.colorSet);
  });
}

function attachDownloadHandler() {
  const downloadBtn = document.getElementById('download-art');
  downloadBtn?.addEventListener('click', () => {
    UI.downloadCanvas(AppState.canvas);
  });
}

function attachShareHandler() {
  const shareBtn = document.getElementById('share-config');
  shareBtn?.addEventListener('click', async () => {
    const success = await UI.shareConfig(
      () => {
        UI.showToast('URL copiada al clipboard');
        shareBtn.classList.add('is-copied');
        setTimeout(() => shareBtn.classList.remove('is-copied'), 2000);
      },
      () => UI.showToast('Error al copiar URL')
    );
  });
}

function applyStrokeEngine() {
  const engineMap = {
    brush: BrushTracer,
    pen: PenTracer,
    pencil: PencilTracer,
    marker: MarkerTracer,
    charcoal: CharcoalTracer,
  };
  const Engine = engineMap[UserPreferences.engine];
  if (Engine) {
    StrokeTracer.use(Engine);
  }
}

function attachEngineHandler() {
  const engineSelect = document.getElementById('stroke-engine');
  engineSelect?.addEventListener('change', () => {
    UserPreferences.engine = engineSelect.value;
    UserPreferences.save();
    applyStrokeEngine();
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

// ── Mobile Bottom Sheet ──
function initMobileBottomSheet() {
  const toggleBtn = document.getElementById('mobile-controls-toggle');
  const closeBtn = document.getElementById('close-bottom-sheet');
  const sheet = document.getElementById('mobile-bottom-sheet');
  const backdrop = sheet?.querySelector('.bottom-sheet-backdrop');
  const handle = sheet?.querySelector('.bottom-sheet-handle');
  let previousActiveElement = null;
  let previousOverflow = '';
  
  if (!toggleBtn || !sheet) return;

  // Focus trap elements
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  function getFocusableElements() {
    return Array.from(sheet.querySelectorAll(focusableSelectors)).filter(el => 
      !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }

  function trapFocus(e) {
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  // Open sheet
  toggleBtn.addEventListener('click', () => {
    previousActiveElement = document.activeElement;
    previousOverflow = document.body.style.overflow;
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    syncMobileControls();
    
    // Focus first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    
    // Add focus trap
    sheet.addEventListener('keydown', trapFocus);
  });

  // Close sheet
  const closeSheet = () => {
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
    sheet.removeEventListener('keydown', trapFocus);
    
    // Return focus to toggle button
    if (previousActiveElement) {
      previousActiveElement.focus();
    }
  };

  closeBtn?.addEventListener('click', closeSheet);
  backdrop?.addEventListener('click', closeSheet);
  
  // Handle click/keyboard on handle bar
  handle?.addEventListener('click', closeSheet);
  handle?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeSheet();
    }
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) {
      closeSheet();
    }
  });

  // Swipe down to close
  let touchStartY = 0;
  
  handle?.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  handle?.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY;
    if (diff > 50) {
      closeSheet();
    }
  }, { passive: true });
}

// Sync mobile controls with preferences
function syncMobileControls() {
  const lineInput = document.getElementById('mobile-line-count');
  const lineValue = document.getElementById('mobile-line-count-value');
  const strokeInput = document.getElementById('mobile-stroke-width');
  const strokeValue = document.getElementById('mobile-stroke-width-value');
  const engineSelect = document.getElementById('mobile-stroke-engine');

  if (lineInput) {
    lineInput.value = UserPreferences.lines;
    if (lineValue) lineValue.textContent = String(UserPreferences.lines);
  }
  if (strokeInput) {
    strokeInput.value = UserPreferences.stroke;
    if (strokeValue) strokeValue.textContent = String(UserPreferences.stroke);
  }
  if (engineSelect) {
    engineSelect.value = UserPreferences.engine;
  }
}

// Attach mobile control handlers
function attachMobileControlHandlers() {
  const lineInput = document.getElementById('mobile-line-count');
  const lineValue = document.getElementById('mobile-line-count-value');
  const strokeInput = document.getElementById('mobile-stroke-width');
  const strokeValue = document.getElementById('mobile-stroke-width-value');
  const engineSelect = document.getElementById('mobile-stroke-engine');
  const randomBtn = document.getElementById('mobile-randomize');
  const resetBtn = document.getElementById('mobile-reset');
  const downloadBtn = document.getElementById('mobile-download');
  const shareBtn = document.getElementById('mobile-share');

  let debounceTimer = null;
  const scheduleRender = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => render(), 120);
  };

  // Lines slider
  lineInput?.addEventListener('input', () => {
    UserPreferences.lines = Number(lineInput.value);
    if (lineValue) lineValue.textContent = String(UserPreferences.lines);
    // Sync desktop control
    const desktopLineInput = document.getElementById('line-count');
    const desktopLineValue = document.getElementById('line-count-value');
    if (desktopLineInput) desktopLineInput.value = UserPreferences.lines;
    if (desktopLineValue) desktopLineValue.textContent = String(UserPreferences.lines);
    scheduleRender();
  });

  // Stroke slider
  strokeInput?.addEventListener('input', () => {
    UserPreferences.stroke = Number(strokeInput.value);
    if (strokeValue) strokeValue.textContent = String(UserPreferences.stroke);
    // Sync desktop control
    const desktopStrokeInput = document.getElementById('stroke-width');
    const desktopStrokeValue = document.getElementById('stroke-width-value');
    if (desktopStrokeInput) desktopStrokeInput.value = UserPreferences.stroke;
    if (desktopStrokeValue) desktopStrokeValue.textContent = String(UserPreferences.stroke);
    scheduleRender();
  });

  // Engine select
  engineSelect?.addEventListener('change', () => {
    UserPreferences.engine = engineSelect.value;
    UserPreferences.save();
    // Sync desktop control
    const desktopEngineSelect = document.getElementById('stroke-engine');
    if (desktopEngineSelect) desktopEngineSelect.value = UserPreferences.engine;
    applyStrokeEngine();
    render(UserPreferences.colorSet);
  });

  // Random button
  randomBtn?.addEventListener('click', () => {
    const palettes = ColorRegistry.names();
    const engines = ['brush', 'pen', 'pencil', 'marker', 'charcoal'];
    
    UserPreferences.randomize(palettes, engines);
    
    // Update all UI
    UI.syncControls(UserPreferences);
    syncMobileControls();
    ColorRegistry.register('CUSTOM', UserPreferences.customColors);
    UI.setActivePreset(UserPreferences.colorSet);
    applyStrokeEngine();
    
    UI.showToast(`Random: ${UserPreferences.colorSet} · ${UserPreferences.lines} lines · ${UserPreferences.engine}`);
    render(UserPreferences.colorSet);
  });

  // Reset button
  resetBtn?.addEventListener('click', () => {
    UserPreferences.reset();
    UI.syncControls(UserPreferences);
    syncMobileControls();
    ColorRegistry.register('CUSTOM', UserPreferences.customColors);
    UI.setActivePreset(UserPreferences.colorSet);
    applyStrokeEngine();
    render(UserPreferences.colorSet);
  });

  // Download button
  downloadBtn?.addEventListener('click', () => {
    UI.downloadCanvas(AppState.canvas);
  });

  // Share button
  shareBtn?.addEventListener('click', async () => {
    await UI.shareConfig(
      () => UI.showToast('URL copiada al clipboard'),
      () => UI.showToast('Error al copiar URL')
    );
  });
}

export function init() {
  UserPreferences.load();
  
  // URL params override localStorage
  const hasUrlParams = deserializeFromUrl();
  if (hasUrlParams) {
    UserPreferences.save();
    // Clean URL after reading (optional - keeps URLs clean)
    // window.history.replaceState({}, '', window.location.pathname);
  }
  
  ColorRegistry.register('CUSTOM', UserPreferences.customColors);
  applyStrokeEngine();
  setupCanvas();
  UI.buildPresetChips(
    document.querySelector('nav.controls'),
    ColorRegistry.names(),
    UserPreferences.colorSet
  );
  UI.syncControls(UserPreferences);
  UI.syncColorPickers(UserPreferences);
  UI.setActivePreset(UserPreferences.colorSet);
  render(UserPreferences.colorSet);
  attachResizeHandler();
  attachNavigationHandlers();
  attachControlHandlers();
  attachEngineHandler();
  attachRandomizeHandler();
  attachDownloadHandler();
  attachShareHandler();
  attachColorPickerHandlers();
  initMobileBottomSheet();
  attachMobileControlHandlers();
  
  // Update URL when preferences change
  const originalSave = UserPreferences.save.bind(UserPreferences);
  UserPreferences.save = function() {
    originalSave();
    updateBrowserUrl();
  };
}

document.addEventListener('DOMContentLoaded', init);
