# JPCanvas — Feature Reference

Complete description of every user-facing and developer-facing feature in JPCanvas.

---

## 1. Generative painting

JPCanvas generates abstract art by drawing thousands of random line strokes on an HTML5 Canvas element. Each render produces a unique composition because start and end points are chosen at random for every stroke.

| Parameter | Default | Range |
|---|---|---|
| Number of lines | 9 000 | 0 – 18 000 |
| Stroke width | 2 px | 1 – 4 px |

---

## 2. Color palettes

Three built-in palettes and one fully customizable palette are available.

| Key | Colors | Description |
|---|---|---|
| `BWR` | Black · White · Red | High-contrast warm set |
| `BWR2` | Blue · White · Red | Patriotic / cool set |
| `RGB` | Red · Green · Blue | Primary color set |
| `CUSTOM` | User-defined | Three colors chosen via color pickers |

### Dynamic title

The "JPCanvas" header letters are always colored to match the active palette:

- **J** → first palette color
- **P** → second palette color
- **Canvas** → third palette color

This works for every palette including `CUSTOM`.

### Palette chips

The navigation bar shows one chip button per palette. Each chip renders the palette name with its own colors so users can preview the palette at a glance before selecting it. The active chip is highlighted.

---

## 3. Custom palette

When `CUSTOM` is selected, three color pickers appear:

| Picker | Maps to |
|---|---|
| Color 1 | Letter J in title / first line color |
| Color 2 | Letter P in title / second line color |
| Color 3 | "Canvas" in title / third line color |

Color picker values are updated in real time: changing a color and clicking **Regenerate** (or any palette chip) applies the new colors immediately.

---

## 4. Controls

### Lines slider

Adjusts the total number of strokes drawn per render.

- Range: 0 – 18 000
- Default: 9 000
- Changes are debounced (120 ms) to avoid flooding renders while dragging.

### Stroke width slider

Adjusts the base thickness of each drawn line.

- Range: 1 – 4 px
- Default: 2 px
- Changes are debounced (120 ms).

### Regenerate button

Re-draws a brand-new random composition using all current settings (palette, line count, stroke width, custom colors). The previous render is cancelled immediately.

### Reset button

Restores all settings to their factory defaults:

| Setting | Default |
|---|---|
| Lines | 9 000 |
| Stroke width | 2 px |
| Color palette | BWR |
| Custom colors | #000000 · #ffffff · #ff0000 |

After reset, a new render starts automatically.

---

## 5. Preferences persistence

All user settings are saved to `localStorage` after every change. On the next page load, the saved preferences are restored automatically, so the user's last configuration is always remembered.

Stored keys:

- `lines` — line count
- `stroke` — stroke width
- `colorSet` — active palette name
- `customColors` — array of three hex color strings

---

## 6. Responsive canvas

The canvas dimensions are computed dynamically based on the container width and the viewport height, clamped between `MIN_CANVAS_HEIGHT` (240 px) and `MAX_CANVAS_HEIGHT` (1 400 px). When the browser window is resized, the canvas is re-sized and a new render starts automatically (debounced at 200 ms).

---

## 7. Performance: chunked rendering

Rendering does not block the UI. Lines are drawn in batches of 250; after each batch the elapsed time is checked against a 10 ms frame budget. If the budget is exceeded, execution yields to the browser via `requestAnimationFrame` before continuing. This keeps the page interactive during long renders.

---

## 8. Render cancellation

Selecting a new palette, clicking Regenerate, or resizing the window cancels any in-progress render immediately using the Web API `AbortController`. Each batch iteration checks `signal.aborted` before continuing, so stale renders are discarded without side effects.

---

## 9. Stroke styles

The stroke engine in `js/stroke.js` is pluggable. Three styles are implemented:

### BrushTracer *(default)*

A soft, tapered brush stroke:

- Path traced as a filled polygon following a quadratic Bézier curve.
- Width varies along the stroke using a sine envelope (pointed tips, thick center).
- Random control-point bow (~15% of stroke length).
- Random alpha between 50 % and 95 % for layering depth.

### PenTracer

A calligraphic fountain-pen effect:

- Nib angle fixed at 45°.
- Stroke width varies based on the angle of each stroke relative to the nib (thick for perpendicular strokes, thin for parallel ones).
- Drawn with `quadraticCurveTo` and a slight curvature.

### PencilTracer

A rough graphite pencil effect:

- Two overlapping semi-transparent Bézier curves per stroke, each with independent random jitter and curvature.
- Approximately 2× the render cost of BrushTracer.

Switching styles at runtime:

```js
import { StrokeTracer, PenTracer } from './js/stroke.js';
StrokeTracer.use(PenTracer);
```

---

## 10. Signature watermark

Every completed painting displays a small "cazucito" signature in the bottom-right corner of the canvas, rendered at 50 % opacity.

---

## 11. Museum frame presentation

The canvas is displayed inside a decorative walnut-wood frame with a gold fillet, styled entirely in CSS. The frame scales with the canvas and is defined in `css/jpc.css`.

---

## 12. Extensible palette registry

Palettes are stored in `ColorRegistry` (`js/color.js`). New palettes can be registered from any module without modifying the core:

```js
import { ColorRegistry } from './js/color.js';
ColorRegistry.register('CMY', ['cyan', 'magenta', 'yellow']);
```

Registered palettes are immediately available to:

- `ColorRegistry.get(name)` — retrieve color array
- `ColorRegistry.random(name)` — pick a random color from the palette
- `ColorRegistry.names()` — list all registered palette names

---

## 13. Keyboard / accessibility

Controls are standard HTML elements (`<input type="range">`, `<input type="color">`, `<button>`), fully keyboard-navigable and compatible with screen readers.

---

## 14. Browser requirements

| Feature | Reason |
|---|---|
| ES Modules | All JS files use `import`/`export` |
| `AbortController` | Render cancellation |
| `Map` | `ColorRegistry` internal store |
| Optional chaining (`?.`) | Defensive DOM queries |
| `requestAnimationFrame` | Chunked rendering |
| `localStorage` | Preference persistence |

All modern browsers (Chrome 80+, Firefox 75+, Safari 13.1+, Edge 80+) are supported.
