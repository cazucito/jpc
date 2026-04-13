# JPCanvas

Generative art experiment in HTML5 Canvas by **cazucito**.

JPCanvas renders abstract paintings by drawing thousands of random lines with configurable color palettes, stroke engines, and animation modes — presented in a museum-style walnut frame.

## Live Demo

🔗 **<https://cazucito.github.io/jpc/>**

---

## ✨ Features

### 🎨 Color Palettes
- **BWR** — black / white / red
- **POLLOCK** — earthy drips
- **SUNSET** — warm oranges and purples
- **OCEAN** — blues and teals
- **FOREST** — greens and browns
- **NEON** — electric bright colors
- **GOLDEN** — amber and gold tones
- **PASTEL** — soft muted colors
- **WINE** — burgundy and cream
- **CUSTOM** — three freely chosen colors

### 🖌️ Stroke Engines
- **Brush** — soft brush with width variation
- **Pen** — calligraphy nib with angle
- **Pencil** — graphite grain with jitter
- **Marker** — permanent marker with bleed
- **Charcoal** — rough chalk texture

### 🎬 Animation Mode
Watch your artwork draw line by line:
- Toggle between **Instant** and **Animate**
- Speed control (1-10)
- Smooth progressive rendering

### 🖼️ Gallery Mode
Explore variations of your artwork:
- **2×2 grid** of unique variations
- **Click to apply** any variation to main canvas
- **New Variations** button generates fresh seeds
- Each variation uses a unique seed for exact reproduction

### 📱 Mobile Experience
- **Bottom sheet controls** for touch interfaces
- **Floating buttons** for palettes and controls
- **Responsive design** — works on all screen sizes
- **Touch-optimized** — 44px+ touch targets

### 🎲 Quick Actions
- **Randomize** — generate random configuration
- **Reset** — restore factory defaults
- **Download PNG** — save artwork with timestamp
- **Share** — copy URL with embedded parameters

### 💾 Persistence
- Preferences saved in `localStorage`
- Shareable URLs with all parameters
- Seed-based reproducibility

See [`FEATURES.md`](FEATURES.md) for the full feature reference.

## Tech stack

- HTML5 Canvas
- CSS3
- Vanilla JavaScript (ES6 modules)
- Bootstrap (layout / navigation)

## Project Structure

```
index.html           — app shell and UI
js/
  app.js             — entry point, event handlers, gallery mode
  config.js          — runtime and performance constants
  preferences.js     — user settings with localStorage persistence
  state.js           — mutable runtime state (canvas, abort controller)
  util.js            — helpers including seeded random generator
  color.js           — palette registry
  stroke.js          — stroke engines (Brush, Pen, Pencil, Marker, Charcoal)
  painter.js         — canvas rendering engine
  ui.js              — DOM updates, chips, controls, toast notifications
  urlParams.js       — URL serialization/deserialization
css/
  jpc.css            — all styles (desktop + mobile)
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

## How to Use

### Desktop
1. Open the page — the painting renders automatically
2. Click a **palette chip** to switch color set
3. Use **Lines** (1000-12000) and **Stroke** (1-6) sliders
4. Select an **Engine** (Brush, Pen, Pencil, Marker, Charcoal)
5. Toggle **Animation** mode to watch it draw
6. Click **🎲 Randomize** for a surprise configuration
7. Click **🖼 Gallery** to explore variations
8. Click **⬇ Download** to save as PNG
9. Click **⬆ Share** to copy a shareable URL

### Mobile
1. Use **🎨 Palettes** button to open palette selector
2. Use **⚙️ Controls** button to open settings
3. Same features as desktop, optimized for touch

### Gallery Mode
1. Click **🖼 Gallery** to show the variation grid
2. Click any **thumbnail** to apply that seed
3. Click **↻ New Variations** to generate fresh options
4. Click **🖼 Gallery** again to hide

## GitHub Pages

- URL: <https://cazucito.github.io/jpc/>
- Branch: `master` → folder `/ (root)`
- Static serving enabled via `.nojekyll`
- `404.html` redirects to `index.html`

**Setup:** Settings → Pages → Deploy from branch `master` / `/ (root)`.

## Author

<https://github.com/cazucito>

---

**Version: v3.6.0**

---

## Changelog

### v3.6.0 — PWA
- 📱 Progressive Web App support
- 🌐 Offline functionality
- 📲 Installable on iOS, Android, desktop
- 🎨 App icons and splash screen

### v3.5.0 — Gallery Mode
- ✨ Gallery Mode with 4 variations
- 📱 Mobile Palettes bottom sheet
- 🎬 Animation mode with speed control
- 🎲 Randomize button

### v3.3.0 — Custom Colors & Sharing
- 🎨 Custom color palette
- 📤 Shareable URLs
- ⬇️ Download PNG feature

### v3.2.0 — Multi-Engine
- 🖌️ 5 stroke engines (Brush, Pen, Pencil, Marker, Charcoal)
