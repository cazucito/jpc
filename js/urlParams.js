/**
 * urlParams.js — URL parameter serialization for shareable presets.
 *
 * Supported params:
 *   - p: palette/colorSet (BWR, BWR2, RGB, CUSTOM)
 *   - l: lines (0-18000)
 *   - s: stroke width (1-4)
 *   - e: engine (brush, pen, pencil)
 *   - c1, c2, c3: custom colors (hex, when palette=CUSTOM)
 */

import { UserPreferences } from './preferences.js';
import { ColorRegistry } from './color.js';

const VALID_ENGINES = ['brush', 'pen', 'pencil', 'marker', 'charcoal'];
const VALID_PALETTES = ['BWR', 'BWR2', 'RGB', 'CUSTOM'];

/**
 * Serialize current preferences to URL query string.
 * @returns {string} Query string (e.g., "?p=BWR&l=9000&s=2&e=brush")
 */
export function serializeToUrl() {
  const params = new URLSearchParams();
  
  params.set('p', UserPreferences.colorSet);
  params.set('l', String(UserPreferences.lines));
  params.set('s', String(UserPreferences.stroke));
  params.set('e', UserPreferences.engine);
  
  if (UserPreferences.colorSet === 'CUSTOM') {
    params.set('c1', UserPreferences.customColors[0]);
    params.set('c2', UserPreferences.customColors[1]);
    params.set('c3', UserPreferences.customColors[2]);
  }
  
  return '?' + params.toString();
}

/**
 * Deserialize URL query string and apply to UserPreferences.
 * @returns {boolean} True if valid params were found and applied.
 */
export function deserializeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.size === 0) return false;
  
  let hasChanges = false;
  
  // Palette
  const palette = params.get('p')?.toUpperCase();
  if (palette && VALID_PALETTES.includes(palette)) {
    UserPreferences.colorSet = palette;
    hasChanges = true;
  }
  
  // Lines (0-18000)
  const lines = parseInt(params.get('l'), 10);
  if (Number.isFinite(lines) && lines >= 0 && lines <= 18000) {
    UserPreferences.lines = lines;
    hasChanges = true;
  }
  
  // Stroke width (1-4)
  const stroke = parseInt(params.get('s'), 10);
  if (Number.isFinite(stroke) && stroke >= 1 && stroke <= 4) {
    UserPreferences.stroke = stroke;
    hasChanges = true;
  }
  
  // Engine
  const engine = params.get('e')?.toLowerCase();
  if (engine && VALID_ENGINES.includes(engine)) {
    UserPreferences.engine = engine;
    hasChanges = true;
  }
  
  // Custom colors (only if palette is CUSTOM)
  if (UserPreferences.colorSet === 'CUSTOM' || palette === 'CUSTOM') {
    const c1 = params.get('c1');
    const c2 = params.get('c2');
    const c3 = params.get('c3');
    
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (c1 && hexRegex.test(c1)) {
      UserPreferences.customColors[0] = c1;
      hasChanges = true;
    }
    if (c2 && hexRegex.test(c2)) {
      UserPreferences.customColors[1] = c2;
      hasChanges = true;
    }
    if (c3 && hexRegex.test(c3)) {
      UserPreferences.customColors[2] = c3;
      hasChanges = true;
    }
    
    if (hasChanges) {
      ColorRegistry.register('CUSTOM', UserPreferences.customColors);
    }
  }
  
  return hasChanges;
}

/**
 * Copy shareable URL to clipboard.
 * @returns {Promise<boolean>} True if copied successfully.
 */
export async function copyShareUrl() {
  const url = new URL(window.location.href);
  url.search = serializeToUrl();
  
  try {
    await navigator.clipboard.writeText(url.toString());
    return true;
  } catch {
    // Fallback for browsers without clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = url.toString();
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Update browser URL without reloading (optional, for cleaner UX).
 */
export function updateBrowserUrl() {
  const url = new URL(window.location.href);
  url.search = serializeToUrl();
  window.history.replaceState({}, '', url.toString());
}
