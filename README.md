# JPCanvas

Generative art experiment in HTML5 Canvas by **cazucito**.

JPCanvas renders abstract paintings by drawing thousands of random lines with configurable color palettes, presented in a museum-style walnut frame.

## Live demo

<https://cazucito.github.io/jpc/>

## Features

- Canvas-based generative drawing inside a walnut museum frame with gold fillet
- Multiple color palettes:
  - `BWR` — black / white / red
  - `BWR2` — blue / white / red
  - `RGB` — red / green / blue
- Navbar palette switcher with dynamic color chips
- Responsive canvas: fills frame and reacts to container resize
- Chunked rendering via `requestAnimationFrame` to keep the UI responsive
- Render cancellation when a new draw starts
- Resize debounce

## Tech stack

- HTML5 Canvas
- CSS3
- Vanilla JavaScript (ES6 modules)
- Bootstrap (layout / navigation)

## Project structure

```
index.html        — app shell and navigation
js/
  config.js       — runtime / performance config
  state.js        — shared app state
  util.js         — helper utilities
  color.js        — palette definitions and color selection
  painter.js      — canvas rendering engine
  app.js          — ES module entrypoint and orchestration
  ui.js           — UI helpers (palette chips, frame logic)
css/
  jpc.css         — project-specific styles
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full refactor notes.

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
2. Use the **Iterations** menu in the navbar to switch palette.
3. Each selection cancels the current render and starts a fresh one.

## GitHub Pages

- URL: <https://cazucito.github.io/jpc/>
- Branch: `master` → folder `/ (root)`
- Static serving enabled via `.nojekyll`
- `404.html` redirects to `index.html`

**Setup:** Settings → Pages → Deploy from branch `master` / `/ (root)`.

## Author

<https://github.com/cazucito>

---

**Version: v3.1**
