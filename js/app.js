import { AppState }         from './state.js';
import { PerformanceConfig } from './config.js';
import { UserPreferences }   from './preferences.js';
import { JPPainter }         from './painter.js';
import { UI }                from './ui.js';
import { ColorRegistry }     from './color.js';
import { Util }              from './util.js';
import { workerManager }     from './worker-manager.js';
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

  AppState.cancelRender();
  AppState.renderController = new AbortController();

  UserPreferences.colorSet = palette;
  UserPreferences.save();

  UI.setRenderStatus(true);
  UI.setTitle(palette);
  UI.setActivePreset(palette);

  // Web Worker temporarily disabled - use main thread
  renderOnMainThread(palette);
}

function tryWorkerRender(palette) {
  // Don't use worker for seed-based renders (simpler on main thread)
  if (UserPreferences.seed !== null) return false;
  
  // Don't use worker for animation mode (needs main thread control)
  if (UserPreferences.animation) return false;

  const success = workerManager.render({
    canvas: AppState.canvas,
    totalLines: UserPreferences.lines,
    strokeWidth: UserPreferences.stroke,
    colorSet: palette,
    engine: UserPreferences.engine,
    seed: null,
    animation: false,
    animationSpeed: 5,
    onProgress: (rendered, total) => {
      // Optional: update progress indicator
      // console.log(`Progress: ${rendered}/${total}`);
    },
    onComplete: (count) => {
      UI.setRenderStatus(false);
    },
    onError: (error) => {
      console.error('[App] Worker render failed, falling back:', error);
      renderOnMainThread(palette);
    }
  });

  return success;
}

function renderOnMainThread(palette) {
  // Use seed if defined for deterministic rendering
  if (UserPreferences.seed !== null) {
    renderWithSeed(AppState.ctx, AppState.canvas, UserPreferences.seed, palette);
    UI.setRenderStatus(false);
    UserPreferences.seed = null;
    return;
  }

  JPPainter.render({
    ctx:             AppState.ctx,
    canvas:          AppState.canvas,
    totalLines:      UserPreferences.lines,
    strokeWidth:     UserPreferences.stroke,
    colorSet:        palette,
    signal:          AppState.renderController.signal,
    onComplete:      () => UI.setRenderStatus(false),
    animation:       UserPreferences.animation,
    animationSpeed:  UserPreferences.animationSpeed,
  });
}

function renderWithSeed(ctx, canvas, seed, colorSet) {
  // Use a deterministic random based on seed for this render
  const originalGetRandomInt = Util.getRandomInt;
  let seedState = seed;
  
  Util.getRandomInt = function(min, max) {
    seedState = (seedState * 16807) % 2147483647;
    return min + (seedState % (max - min));
  };
  
  // Use instant mode for seed-based renders
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const total = UserPreferences.lines;
  const strokeWidth = UserPreferences.stroke;
  
  for (let i = 0; i < total; i++) {
    JPPainter.drawLine(ctx, {
      strokeWidth,
      color: ColorRegistry.random(colorSet),
      from: { 
        x: Util.getRandomInt(0, canvas.width),  
        y: Util.getRandomInt(0, canvas.height) 
      },
      to: { 
        x: Util.getRandomInt(0, canvas.width),  
        y: Util.getRandomInt(0, canvas.height) 
      },
    });
  }
  
  JPPainter.drawSignature(ctx, canvas);
  
  // Restore original random function
  Util.getRandomInt = originalGetRandomInt;
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

// Shared debounce timer for range controls
let rangeDebounceTimer = null;
const scheduleRender = () => {
  clearTimeout(rangeDebounceTimer);
  rangeDebounceTimer = setTimeout(() => render(), 120);
};

// Helper to bind a range input to a preference and sync with another input
function bindRangeControl(input, valueDisplay, prefKey, syncInputId, syncValueId) {
  if (!input) return;
  
  input.addEventListener('input', () => {
    const value = Number(input.value);
    UserPreferences[prefKey] = value;
    if (valueDisplay) valueDisplay.textContent = String(value);
    
    // Sync with other input if provided
    const syncInput = document.getElementById(syncInputId);
    const syncValue = document.getElementById(syncValueId);
    if (syncInput) syncInput.value = value;
    if (syncValue) syncValue.textContent = String(value);
    
    scheduleRender();
  });
}

// Helper to bind engine select
function bindEngineSelect(select, syncSelectId) {
  if (!select) return;
  
  select.addEventListener('change', () => {
    UserPreferences.engine = select.value;
    UserPreferences.save();
    
    // Sync with other select if provided
    const syncSelect = document.getElementById(syncSelectId);
    if (syncSelect) syncSelect.value = UserPreferences.engine;
    
    applyStrokeEngine();
    render(UserPreferences.colorSet);
  });
}

// Helper to bind animation toggle
function bindAnimationToggle(toggleBtn, speedInput, speedValue, speedContainer, syncToggleId, syncSpeedId, syncSpeedValueId, syncSpeedContainer) {
  if (!toggleBtn) return;
  
  const updateToggleUI = (isAnimated) => {
    toggleBtn.setAttribute('aria-pressed', String(isAnimated));
    toggleBtn.textContent = isAnimated ? 'Animate' : 'Instant';
    if (speedContainer) {
      speedContainer.classList.toggle('is-visible', isAnimated);
    }
  };
  
  const updateSpeedUI = (speed) => {
    if (speedInput) speedInput.value = speed;
    if (speedValue) speedValue.textContent = String(speed);
  };
  
  // Initialize UI
  updateToggleUI(UserPreferences.animation);
  updateSpeedUI(UserPreferences.animationSpeed);
  
  toggleBtn.addEventListener('click', () => {
    const newValue = !UserPreferences.animation;
    UserPreferences.animation = newValue;
    UserPreferences.save();
    
    updateToggleUI(newValue);
    
    // Sync with mobile
    const syncToggle = document.getElementById(syncToggleId);
    const syncSpeedCont = document.getElementById(syncSpeedContainer);
    if (syncToggle) {
      syncToggle.setAttribute('aria-pressed', String(newValue));
      syncToggle.textContent = newValue ? 'Animate' : 'Instant';
    }
    if (syncSpeedCont) {
      syncSpeedCont.classList.toggle('is-visible', newValue);
    }
    
    render(UserPreferences.colorSet);
  });
  
  // Speed slider
  if (speedInput) {
    speedInput.addEventListener('input', () => {
      const speed = Number(speedInput.value);
      UserPreferences.animationSpeed = speed;
      UserPreferences.save();
      
      if (speedValue) speedValue.textContent = String(speed);
      
      // Sync
      const syncSpeed = document.getElementById(syncSpeedId);
      const syncSpeedVal = document.getElementById(syncSpeedValueId);
      if (syncSpeed) syncSpeed.value = speed;
      if (syncSpeedVal) syncSpeedVal.textContent = String(speed);
    });
  }
}

function attachControlHandlers() {
  bindRangeControl(
    document.getElementById('line-count'),
    document.getElementById('line-count-value'),
    'lines',
    'mobile-line-count',
    'mobile-line-count-value'
  );

  bindRangeControl(
    document.getElementById('stroke-width'),
    document.getElementById('stroke-width-value'),
    'stroke',
    'mobile-stroke-width',
    'mobile-stroke-width-value'
  );

  bindEngineSelect(document.getElementById('stroke-engine'), 'mobile-stroke-engine');

  bindAnimationToggle(
    document.getElementById('animation-toggle'),
    document.getElementById('animation-speed'),
    document.getElementById('animation-speed-value'),
    document.querySelector('.control-item.animation-speed'),
    'mobile-animation-toggle',
    'mobile-animation-speed',
    'mobile-animation-speed-value',
    'mobile-animation-speed-container'
  );

  const resetBtn = document.getElementById('reset-defaults');
  resetBtn?.addEventListener('click', () => {
    UserPreferences.reset();
    UI.syncControls(UserPreferences);
    syncMobileControls();
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
  console.log('[Mobile] Initializing bottom sheet...');
  
  const toggleBtn = document.getElementById('mobile-controls-toggle');
  const closeBtn = document.getElementById('close-bottom-sheet');
  const sheet = document.getElementById('mobile-bottom-sheet');
  const backdrop = sheet?.querySelector('.bottom-sheet-backdrop');
  const handle = sheet?.querySelector('.bottom-sheet-handle');
  let previousActiveElement = null;
  let previousOverflow = '';
  
  console.log('[Mobile] Elements:', { toggleBtn: !!toggleBtn, sheet: !!sheet, closeBtn: !!closeBtn });
  
  if (!toggleBtn || !sheet) {
    console.error('[Mobile] Missing required elements for bottom sheet');
    return;
  }
  
  console.log('[Mobile] Bottom sheet initialized successfully');

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

  // Close sheet (idempotent)
  const closeSheet = () => {
    // Early return if already closed
    if (!sheet.classList.contains('is-open') || sheet.getAttribute('aria-hidden') === 'true') {
      return;
    }
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
  console.log('[Mobile] Attaching mobile control handlers...');
  
  console.log('[Mobile] Control elements loaded');
  
  bindRangeControl(
    document.getElementById('mobile-line-count'),
    document.getElementById('mobile-line-count-value'),
    'lines',
    'line-count',
    'line-count-value'
  );

  bindRangeControl(
    document.getElementById('mobile-stroke-width'),
    document.getElementById('mobile-stroke-width-value'),
    'stroke',
    'stroke-width',
    'stroke-width-value'
  );

  bindEngineSelect(document.getElementById('mobile-stroke-engine'), 'stroke-engine');

  bindAnimationToggle(
    document.getElementById('mobile-animation-toggle'),
    document.getElementById('mobile-animation-speed'),
    document.getElementById('mobile-animation-speed-value'),
    document.querySelector('.mobile-control-item.mobile-animation-speed'),
    'animation-toggle',
    'animation-speed',
    'animation-speed-value',
    'animation-speed'
  );

  const randomBtn = document.getElementById('mobile-randomize');
  const resetBtn = document.getElementById('mobile-reset');
  const downloadBtn = document.getElementById('mobile-download');
  const shareBtn = document.getElementById('mobile-share');
  const galleryBtn = document.getElementById('mobile-gallery');

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
      () => UI.showToast('URL copied to clipboard'),
      () => UI.showToast('Error copying URL')
    );
  });
  
  // Gallery button handler (already declared above, just add listener)
  galleryBtn?.addEventListener('click', () => {
    const galleryToggle = document.getElementById('gallery-toggle');
    const closeSheetBtn = document.getElementById('close-bottom-sheet');
    // Trigger the desktop gallery toggle
    galleryToggle?.click();
    // Close the mobile bottom sheet by clicking the close button
    closeSheetBtn?.click();
  });
}

// ── Mobile Palettes Bottom Sheet ──
function initMobilePalettesSheet() {
  console.log('[Mobile] Initializing palettes sheet...');
  
  const toggleBtn = document.getElementById('mobile-palettes-toggle');
  const closeBtn = document.getElementById('close-palettes-sheet');
  const sheet = document.getElementById('mobile-palettes-sheet');
  const grid = document.getElementById('mobile-palettes-grid');
  
  console.log('[Mobile] Palette elements:', { 
    toggleBtn: !!toggleBtn, 
    sheet: !!sheet, 
    grid: !!grid 
  });
  
  if (!toggleBtn || !sheet || !grid) {
    console.error('[Mobile] Missing required elements for palettes sheet');
    return;
  }
  
  console.log('[Mobile] Palettes sheet initialized successfully');

  function buildPalettesGrid() {
    grid.innerHTML = '';
    const palettes = ColorRegistry.names();
    
    palettes.forEach(name => {
      const colors = ColorRegistry.get(name);
      const item = document.createElement('button');
      item.className = 'mobile-palette-item';
      item.type = 'button';
      item.dataset.palette = name;
      item.setAttribute('aria-label', `Select ${name} palette`);
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'mobile-palette-name';
      nameSpan.textContent = name;
      
      const preview = document.createElement('div');
      preview.className = 'mobile-palette-preview';
      
      colors.forEach(color => {
        const dot = document.createElement('span');
        dot.className = 'mobile-palette-dot';
        dot.style.backgroundColor = color;
        preview.appendChild(dot);
      });
      
      item.appendChild(nameSpan);
      item.appendChild(preview);
      
      item.addEventListener('click', () => {
        grid.querySelectorAll('.mobile-palette-item').forEach(el => {
          el.classList.remove('is-active');
        });
        item.classList.add('is-active');
        render(name);
        closeSheet();
      });
      
      grid.appendChild(item);
    });
    
    updateActivePalette(UserPreferences.colorSet);
  }

  function updateActivePalette(activeName) {
    grid.querySelectorAll('.mobile-palette-item').forEach(item => {
      item.classList.toggle('is-active', item.dataset.palette === activeName);
    });
  }

  const backdrop = sheet.querySelector('.bottom-sheet-backdrop');
  const handle = sheet.querySelector('.bottom-sheet-handle');
  let previousActiveElement = null;
  let previousOverflow = '';
  
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

  function openSheet() {
    previousActiveElement = document.activeElement;
    previousOverflow = document.body.style.overflow;
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    buildPalettesGrid();
    
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    
    sheet.addEventListener('keydown', trapFocus);
  }

  function closeSheet() {
    if (!sheet.classList.contains('is-open') || sheet.getAttribute('aria-hidden') === 'true') {
      return;
    }
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
    sheet.removeEventListener('keydown', trapFocus);
    
    if (previousActiveElement) {
      previousActiveElement.focus();
    }
  }

  toggleBtn.addEventListener('click', openSheet);
  closeBtn?.addEventListener('click', closeSheet);
  backdrop?.addEventListener('click', closeSheet);
  
  handle?.addEventListener('click', closeSheet);
  handle?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeSheet();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) {
      closeSheet();
    }
  });

  let touchStartY = 0;
  handle?.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  handle?.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    if (touchY - touchStartY > 50) {
      closeSheet();
    }
  }, { passive: true });

  buildPalettesGrid();
  
  return updateActivePalette;
}

// ── Gallery Mode ──
function initGalleryMode() {
  const galleryToggle = document.getElementById('gallery-toggle');
  const gallerySection = document.getElementById('gallery-section');
  const regenerateBtn = document.getElementById('regenerate-gallery');
  const galleryGrid = document.getElementById('gallery-grid');
  
  if (!galleryToggle || !gallerySection || !galleryGrid) return;

  let gallerySeeds = [];
  const GALLERY_SIZE = 4; // 2x2 grid

  function generateSeeds() {
    gallerySeeds = [];
    for (let i = 0; i < GALLERY_SIZE; i++) {
      gallerySeeds.push(Util.generateSeed());
    }
  }

  function renderGalleryItem(seed, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Variation ${index + 1}`);
    
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    item.appendChild(canvas);
    
    const label = document.createElement('span');
    label.className = 'gallery-item-label';
    label.textContent = `#${index + 1}`;
    item.appendChild(label);
    
    // Render mini version with seed
    const ctx = canvas.getContext('2d');
    renderWithSeed(ctx, canvas, seed);
    
    // Click to apply seed
    item.addEventListener('click', () => {
      UserPreferences.seed = seed;
      render(UserPreferences.colorSet);
      UI.showToast('Variation applied');
    });
    
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        UserPreferences.seed = seed;
        render(UserPreferences.colorSet);
        UI.showToast('Variation applied');
      }
    });
    
    return item;
  }

  function renderWithSeed(ctx, canvas, seed) {
    // Use a deterministic random based on seed for this render
    const originalGetRandomInt = Util.getRandomInt;
    let seedState = seed;
    
    Util.getRandomInt = function(min, max) {
      seedState = (seedState * 16807) % 2147483647;
      return min + (seedState % (max - min));
    };
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const totalLines = Math.floor(UserPreferences.lines / 4); // Fewer lines for preview
    const strokeWidth = UserPreferences.stroke;
    const colorSet = UserPreferences.colorSet;
    
    for (let i = 0; i < totalLines; i++) {
      JPPainter.drawLine(ctx, {
        strokeWidth,
        color: ColorRegistry.random(colorSet),
        from: { 
          x: Util.getRandomInt(0, canvas.width),  
          y: Util.getRandomInt(0, canvas.height) 
        },
        to: { 
          x: Util.getRandomInt(0, canvas.width),  
          y: Util.getRandomInt(0, canvas.height) 
        },
      });
    }
    
    JPPainter.drawSignature(ctx, canvas);
    
    // Restore original random function
    Util.getRandomInt = originalGetRandomInt;
  }

  function buildGallery() {
    galleryGrid.innerHTML = '';
    generateSeeds();
    
    gallerySeeds.forEach((seed, index) => {
      const item = renderGalleryItem(seed, index);
      galleryGrid.appendChild(item);
    });
  }

  function toggleGallery() {
    const isVisible = gallerySection.style.display !== 'none';
    
    if (isVisible) {
      gallerySection.style.display = 'none';
      galleryToggle.setAttribute('aria-pressed', 'false');
    } else {
      gallerySection.style.display = 'block';
      galleryToggle.setAttribute('aria-pressed', 'true');
      if (galleryGrid.children.length === 0) {
        buildGallery();
      }
    }
  }

  galleryToggle.addEventListener('click', toggleGallery);
  regenerateBtn?.addEventListener('click', buildGallery);
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
  
  // Web Worker temporarily disabled - requires canvas restructuring
  // const workerReady = workerManager.init();
  // if (workerReady) {
  //   console.log('[App] Web Worker initialized for background rendering');
  // }
  
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
  initMobilePalettesSheet();
  initGalleryMode();
  
  // Update URL when preferences change
  const originalSave = UserPreferences.save.bind(UserPreferences);
  UserPreferences.save = function() {
    originalSave();
    updateBrowserUrl();
  };
}

document.addEventListener('DOMContentLoaded', init);
