# JPCanvas

Generative art experiment in HTML5 Canvas by **cazucito**.

JPCanvas renders abstract paintings by drawing thousands of random lines with configurable color palettes.

## Live demo

- GitHub Pages: <https://cazucito.github.io/jpc/>

## Current status

- Version: **v2** (performance-focused baseline)
- Branch baseline: `master`
- Stable backup tag: `v2`

## Features

- Canvas-based generative drawing
- Multiple palette iterations:
  - `BWR` (black/white/red)
  - `BWR2` (blue/white/red)
  - `RGB` (red/green/blue)
- Navbar actions to re-render with different palettes
- Performance optimizations to reduce UI freezing:
  - chunked rendering via `requestAnimationFrame`
  - render cancellation when a new draw starts
  - resize debounce
  - bounded canvas sizing

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6 classes)
- Bootstrap (layout/navigation)

## Project structure

- `index.html` — app shell and navigation
- `js/jpc.js` — canvas engine and render orchestration
- `css/jpc.css` — project-specific styles
- `css/`, `js/`, `fonts/` — Bootstrap/static assets

## Run locally

Because this project uses browser JS and assets, run it with a local HTTP server (instead of opening `index.html` directly).

### Option A: Python

```bash
python3 -m http.server 8080
```

Open: <http://localhost:8080>

### Option B: Node

```bash
npx serve .
```

## How to use

1. Open the page.
2. The initial painting renders automatically.
3. Use **Iterations** in the navbar to switch palette mode.
4. Each selection triggers a fresh render.

## Performance notes

If the page still feels heavy on very low-end devices:

- reduce `DEFAULT_LINES` in `js/jpc.js`
- reduce `BATCH_SIZE` in `js/jpc.js`
- keep canvas dimensions bounded to viewport

## Roadmap (near-term)

- User-selectable custom colors
- Better GitHub Pages/deployment notes
- Extended README with screenshots and contribution guide

## Author

- GitHub: <https://github.com/cazucito>

---

If you are working from issues: this README update addresses **Issue #2**.
