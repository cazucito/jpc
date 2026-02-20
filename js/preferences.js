const STORAGE_KEY = 'jpc_render_preferences_v1';

export const DEFAULTS = Object.freeze({
  lines: 9000,
  stroke: 2,
  colorSet: 'BWR',
});

export const UserPreferences = {
  lines: DEFAULTS.lines,
  stroke: DEFAULTS.stroke,
  colorSet: DEFAULTS.colorSet,

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (Number.isFinite(data.lines))          this.lines    = data.lines;
      if (Number.isFinite(data.stroke))         this.stroke   = data.stroke;
      if (typeof data.colorSet === 'string')    this.colorSet = data.colorSet;
    } catch { /* noop */ }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lines:    this.lines,
      stroke:   this.stroke,
      colorSet: this.colorSet,
    }));
  },

  reset() {
    this.lines    = DEFAULTS.lines;
    this.stroke   = DEFAULTS.stroke;
    this.colorSet = DEFAULTS.colorSet;
    this.save();
  },
};
