const STORAGE_KEY = 'jpc_render_preferences_v1';

export const DEFAULTS = Object.freeze({
  lines:        9000,
  stroke:       2,
  colorSet:     'BWR',
  customColors: ['#000000', '#ffffff', '#ff0000'],
});

export const UserPreferences = {
  lines:        DEFAULTS.lines,
  stroke:       DEFAULTS.stroke,
  colorSet:     DEFAULTS.colorSet,
  customColors: [...DEFAULTS.customColors],

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (Number.isFinite(data.lines))                                      this.lines        = data.lines;
      if (Number.isFinite(data.stroke))                                     this.stroke       = data.stroke;
      if (typeof data.colorSet === 'string')                                this.colorSet     = data.colorSet;
      if (Array.isArray(data.customColors) && data.customColors.length === 3) this.customColors = data.customColors;
    } catch { /* noop */ }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lines:        this.lines,
      stroke:       this.stroke,
      colorSet:     this.colorSet,
      customColors: this.customColors,
    }));
  },

  reset() {
    this.lines        = DEFAULTS.lines;
    this.stroke       = DEFAULTS.stroke;
    this.colorSet     = DEFAULTS.colorSet;
    this.customColors = [...DEFAULTS.customColors];
    this.save();
  },
};
