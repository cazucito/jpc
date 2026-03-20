const STORAGE_KEY = 'jpc_render_preferences_v1';

export const DEFAULTS = Object.freeze({
  lines:        9000,
  stroke:       2,
  colorSet:     'BWR',
  customColors: ['#000000', '#ffffff', '#ff0000'],
  engine:       'brush',
});

export const UserPreferences = {
  lines:        DEFAULTS.lines,
  stroke:       DEFAULTS.stroke,
  colorSet:     DEFAULTS.colorSet,
  customColors: [...DEFAULTS.customColors],
  engine:       DEFAULTS.engine,

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (Number.isFinite(data.lines))                                      this.lines        = data.lines;
      if (Number.isFinite(data.stroke))                                     this.stroke       = data.stroke;
      if (typeof data.colorSet === 'string')                                this.colorSet     = data.colorSet;
      if (Array.isArray(data.customColors) && data.customColors.length === 3) this.customColors = data.customColors;
      if (typeof data.engine === 'string')                                  this.engine       = data.engine;
    } catch { /* noop */ }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lines:        this.lines,
      stroke:       this.stroke,
      colorSet:     this.colorSet,
      customColors: this.customColors,
      engine:       this.engine,
    }));
  },

  reset() {
    this.lines        = DEFAULTS.lines;
    this.stroke       = DEFAULTS.stroke;
    this.colorSet     = DEFAULTS.colorSet;
    this.customColors = [...DEFAULTS.customColors];
    this.engine       = DEFAULTS.engine;
    this.save();
  },

  randomize(availablePalettes, availableEngines) {
    // Random lines: 1000 to 15000, step 500
    this.lines = Math.floor((1000 + Math.random() * 14000) / 500) * 500;
    
    // Random stroke: 1 to 4
    this.stroke = Math.floor(1 + Math.random() * 4);
    
    // Random palette (exclude CUSTOM for simplicity)
    const palettes = availablePalettes.filter(p => p !== 'CUSTOM');
    this.colorSet = palettes[Math.floor(Math.random() * palettes.length)];
    
    // Random engine
    this.engine = availableEngines[Math.floor(Math.random() * availableEngines.length)];
    
    // Random custom colors (just in case)
    this.customColors = [
      '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    ];
    
    this.save();
  },
};
