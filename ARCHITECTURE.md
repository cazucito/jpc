# JPCanvas Architecture (v2 incremental refactor)

This document describes the incremental architecture refactor introduced for Issue #10.

## Goals

- Improve readability and maintainability
- Separate concerns by responsibility
- Keep backward compatibility with existing UI actions
- Preserve current visual behavior

## JavaScript layout

- `js/config.js` → performance/runtime constants
- `js/state.js` → mutable app runtime state
- `js/util.js` → generic helpers
- `js/color.js` → palettes + color selection
- `js/painter.js` → canvas drawing engine
- `js/app.js` → app bootstrap, canvas sizing, resize orchestration
- `js/jpc.js` → compatibility shim/documentation placeholder

## Runtime flow

1. `DOMContentLoaded` triggers `init()` (from `app.js`)
2. `setupCanvas()` computes bounded canvas dimensions
3. `JPPainter.createPaintingA(...)` draws in chunked frames
4. Resize events are debounced and trigger controlled redraw
5. New renders cancel in-flight render tokens to avoid overlap

## Backward compatibility

To avoid breaking existing navbar links (`javascript:JPPainter...`), these globals are still exported:

- `window.Default`
- `window.JPPainter`
- `window.init`

Internally, the app now uses the `window.JPC` namespace to avoid mixing unrelated responsibilities.

## Next step (planned)

A future refactor (Option B) can migrate this structure to ES Modules (`type="module"`) and remove inline `javascript:` actions from HTML.
