# JPCanvas

Generative art experiment in HTML5 Canvas by **cazucito**.

JPCanvas renders abstract paintings by drawing thousands of random lines with configurable color palettes, presented in a museum-style walnut frame.

## Live demo

<https://cazucito.github.io/jpc/>

## Features

- Canvas-based generative drawing inside a walnut museum frame with gold fillet
- **Color palettes:**
  - `BWR` — black / white / red
  - `BWR2` — blue / white / red
  - `RGB` — red / green / blue
  - `CUSTOM` — three freely chosen colors via built-in color pickers
- Navbar palette switcher with dynamic color chips (letters colored with the palette)
- Dynamic header title — "JPCanvas" letters colored to match the active palette
- **Line count control** — slider from 0 to 18 000 lines (default 9 000)
- **Stroke width control** — slider from 1 to 4 px (default 2 px)
- **Custom color pickers** — three color inputs mapped to J / P / Canvas colors
- **Regenerate** — re-draws a fresh composition with the same settings
- **Reset** — restores all controls to their factory defaults
- Preferences persisted in `localStorage` (palette, line count, stroke width, custom colors)
- Responsive canvas: fills the frame and reacts to container resize (debounced)
- Chunked rendering via `requestAnimationFrame` to keep the UI responsive
- Render cancellation via `AbortController` when a new draw starts
- Extensible stroke-tracer engine: `BrushTracer` (default), `PenTracer`, `PencilTracer`
- "cazucito" signature watermark rendered in the bottom-right corner of every painting

See [`FEATURES.md`](FEATURES.md) for the full feature reference.

## Tech stack

- HTML5 Canvas
- CSS3
- Vanilla JavaScript (ES6 modules)
- Bootstrap (layout / navigation)

## Project structure

```
index.html           — app shell and navigation
js/
  config.js          — immutable runtime / performance constants
  preferences.js     — user-adjustable settings with localStorage persistence
  state.js           — minimal mutable runtime state (canvas, abort controller)
  util.js            — generic helpers
  color.js           — extensible palette registry
  stroke.js          — pluggable stroke-tracer engine (Brush / Pen / Pencil)
  painter.js         — pure canvas rendering engine (no DOM, no global state)
  ui.js              — DOM updates: title, render status badge, preset chips, controls
  app.js             — ES module entrypoint and orchestration
css/
  jpc.css            — project-specific styles
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full architecture notes.

## Run locally

This project uses ES modules, so it must be served over HTTP (not opened as a plain file).

**Python:**
```bash
python3 -m http.server 8080
# Open: http://localhost:8080
```

**Node:**
```bash
npx serve .
```

## How to use

1. Open the page — the painting renders automatically.
2. Click a palette chip in the navbar to switch color set.
3. Use the **Lines** and **Stroke** sliders to change drawing density and line thickness.
4. Pick custom colors with the three color inputs (active when `CUSTOM` palette is selected).
5. Click **Regenerate** to draw a new random composition with the current settings.
6. Click **Reset** to restore all controls to their defaults.
7. Each palette switch or regenerate cancels the running render and starts a fresh one.

## GitHub Pages

- URL: <https://cazucito.github.io/jpc/>
- Branch: `master` → folder `/ (root)`
- Static serving enabled via `.nojekyll`
- `404.html` redirects to `index.html`

**Setup:** Settings → Pages → Deploy from branch `master` / `/ (root)`.

## Author

<https://github.com/cazucito>

---

**Version: v3.2.0**
