import { ColorRegistry } from './color.js';

const TITLE_TEMPLATES = {
  BWR:  "<strong><span class='black'>J</span><span class='white'>P</span><span class='red'>Canvas</span></strong>",
  BWR2: "<strong><span class='blue'>J</span><span class='white'>P</span><span class='red'>Canvas</span></strong>",
  RGB:  "<strong><span class='red'>J</span><span class='green'>P</span><span class='blue'>Canvas</span></strong>",
};

export const UI = {
  setTitle(colorSet) {
    const el = document.getElementById('mainTitle');
    if (!el) return;

    if (TITLE_TEMPLATES[colorSet]) {
      el.innerHTML = TITLE_TEMPLATES[colorSet];
      return;
    }

    // Dynamic title for palettes without a fixed template (e.g. CUSTOM):
    // color "J" with colors[0], "P" with colors[1], "Canvas" with colors[2].
    const colors = ColorRegistry.get(colorSet);
    const toSpan = (text, c) => {
      if (!c) return text;
      const style = c.startsWith('#') ? `style="color:${c}"` : `class="${c}"`;
      return `<span ${style}>${text}</span>`;
    };
    el.innerHTML = `<strong>${toSpan('J', colors[0])}${toSpan('P', colors[1])}${toSpan('Canvas', colors[2])}</strong>`;
  },

  setRenderStatus(isRendering) {
    document.getElementById('render-status')
      ?.classList.toggle('is-hidden', !isRendering);
    document.getElementById('containerCanvas')
      ?.classList.toggle('is-rendering', isRendering);
  },

  buildPresetChips(nav, names, activeColorSet) {
    const regenerateBtn = nav.querySelector('[data-action="regenerate"]');
    names.forEach((name) => {
      const btn = document.createElement('button');
      btn.className = name === activeColorSet ? 'chip is-active' : 'chip';
      btn.type = 'button';
      btn.dataset.action   = 'render';
      btn.dataset.colorset = name;
      const colors = ColorRegistry.get(name);
      btn.innerHTML = [...name]
        .map((char, i) => {
          if (!colors[i]) return char;
          const isHex = colors[i].startsWith('#');
          return isHex
            ? `<span style="color:${colors[i]}">${char}</span>`
            : `<span class="${colors[i]}">${char}</span>`;
        })
        .join('');
      nav.insertBefore(btn, regenerateBtn);
    });
  },

  syncColorPickers({ customColors }) {
    ['custom-color-1', 'custom-color-2', 'custom-color-3'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.value = customColors[i] ?? '#000000';
    });
  },

  setActivePreset(colorSet) {
    document.querySelectorAll('[data-action="render"]').forEach((chip) => {
      chip.classList.toggle('is-active', chip.getAttribute('data-colorset') === colorSet);
    });
  },

  syncControls({ lines, stroke }) {
    const lineInput   = document.getElementById('line-count');
    const lineValue   = document.getElementById('line-count-value');
    const strokeInput = document.getElementById('stroke-width');
    const strokeValue = document.getElementById('stroke-width-value');

    if (lineInput)   lineInput.value            = String(lines);
    if (lineValue)   lineValue.textContent       = String(lines);
    if (strokeInput) strokeInput.value           = String(stroke);
    if (strokeValue) strokeValue.textContent     = String(stroke);
  },
};
