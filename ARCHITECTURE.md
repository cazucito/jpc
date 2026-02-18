# JPCanvas Architecture (v2 incremental refactor)

This document describes the architecture refactor introduced for Issue #10 (Phases A and B).

## Goals

- Improve readability and maintainability
- Separate concerns by responsibility
- Keep backward compatibility with existing UI actions
- Preserve current visual behavior

## JavaScript layout (ES Modules)

- `js/config.js` → performance/runtime constants
- `js/state.js` → mutable app runtime state
- `js/util.js` → generic helpers
- `js/color.js` → palettes + color selection
- `js/painter.js` → canvas drawing engine
- `js/app.js` → app bootstrap, canvas sizing, resize orchestration, navbar bindings

`index.html` now loads only:

- `<script type="module" src="js/app.js"></script>`

## Runtime flow

1. `DOMContentLoaded` triggers `init()` (from `app.js`)
2. `setupCanvas()` computes bounded canvas dimensions
3. `JPPainter.createPaintingA(...)` draws in chunked frames
4. Resize events are debounced and trigger controlled redraw
5. New renders cancel in-flight render tokens to avoid overlap

## Event architecture

The previous inline `javascript:` navbar handlers were removed.

Navigation items now use declarative data attributes:

- `data-action="render"`
- `data-colorset="BWR|BWR2|RGB"`

`app.js` binds click handlers at startup and routes rendering through one orchestration flow.

## Compatibility note

This phase intentionally modernizes runtime loading to ESM and removes the legacy global-driven execution path.
