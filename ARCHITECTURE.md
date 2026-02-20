# JPCanvas Architecture (v3 refactor)

## Goals

- Improve readability and maintainability
- Separate concerns by responsibility
- Make the renderer pure and free of global state
- Enable extensibility without modifying core modules
- Keep backward compatibility with existing UI

## JavaScript layout (ES Modules)

| Module | Responsibility |
|---|---|
| `js/config.js` | Immutable rendering constants (frozen object) |
| `js/preferences.js` | User-adjustable values, defaults, and localStorage persistence |
| `js/state.js` | Minimal mutable runtime state (canvas context, abort controller) |
| `js/util.js` | Generic helpers |
| `js/color.js` | Extensible palette registry (`ColorRegistry`) |
| `js/ui.js` | DOM update functions (title, status badge, controls) |
| `js/painter.js` | Pure canvas rendering engine — no DOM, no global state |
| `js/app.js` | Bootstrap, canvas sizing, event wiring (orchestrator) |

`index.html` loads only:

```html
<script type="module" src="js/app.js"></script>
```

## Unidirectional data flow

```
UserPreferences  (source of truth for user settings)
       │
   app.js        (orchestrator — owns render() lifecycle)
       │                    │
  JPPainter           UI object
  (canvas only)       (DOM only — ui.js)
```

## Runtime flow

1. `DOMContentLoaded` → `init()` in `app.js`
2. `UserPreferences.load()` restores persisted settings from `localStorage`
3. `setupCanvas()` computes bounded canvas dimensions
4. `render(colorSet)` drives the full cycle:
   - Aborts any in-flight render via `AbortController`
   - Updates `UserPreferences.colorSet` and persists all settings
   - Updates UI: title, status badge, active preset chip
   - Calls `JPPainter.render(...)` with explicit parameters
   - `onComplete` callback fires `UI.setRenderStatus(false)` on actual completion
5. Resize events are debounced and re-invoke `setupCanvas()` + `render()`

## Render cancellation

`AbortController` / `AbortSignal` replaces the previous ad-hoc token object.
`AppState.renderController.abort()` cancels the previous render before starting
a new one. Each `drawChunk` iteration checks `signal.aborted` before continuing.

## Extending palettes

Register new palettes from any module without touching `color.js`:

```js
import { ColorRegistry } from './js/color.js';
ColorRegistry.register('CMY', ['cyan', 'magenta', 'yellow']);
```

Registered palettes are immediately available to `ColorRegistry.random()`.

## Event architecture

Navigation and control elements use declarative `data-action` attributes:

- `data-action="render"` + `data-colorset="BWR|BWR2|RGB"`
- `data-action="regenerate"`

`app.js` binds all handlers at startup and routes every user action through
the single `render()` function.

## Compatibility

Requires browsers with support for ES modules, `AbortController`, `Map`,
optional chaining (`?.`), and `requestAnimationFrame`.
