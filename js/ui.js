const TITLE_TEMPLATES = {
  BWR:  "<strong><span class='black'>J</span><span class='white'>P</span><span class='red'>Canvas</span></strong>",
  BWR2: "<strong><span class='blue'>J</span><span class='white'>P</span><span class='red'>Canvas</span></strong>",
  RGB:  "<strong><span class='red'>J</span><span class='green'>P</span><span class='blue'>Canvas</span></strong>",
};

export const UI = {
  setTitle(colorSet) {
    const el = document.getElementById('mainTitle');
    if (el) el.innerHTML = TITLE_TEMPLATES[colorSet] ?? '<strong>JPCanvas</strong>';
  },

  setRenderStatus(isRendering) {
    const badge = document.getElementById('render-status');
    if (!badge) return;
    badge.textContent = isRendering ? 'Rendering...' : 'Ready';
    badge.classList.toggle('is-rendering', isRendering);
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
