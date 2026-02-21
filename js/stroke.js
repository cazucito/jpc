/**
 * stroke.js — Extensible organic stroke engine for JPCanvas.
 *
 * Public API (same signature as the original JPPainter.drawLine):
 *   StrokeTracer.draw(ctx, { strokeWidth, color, from, to })
 *
 * Built-in implementations:
 *   BrushTracer   — default; tapered filled polygon — width varies ALONG the stroke
 *   PenTracer     — calligraphic nib: thick/thin based on stroke direction
 *   PencilTracer  — rough pencil stroke with edge grain (~2× overhead)
 *
 * Extending:
 *   class MyTracer extends StrokeTracer {
 *     static draw(ctx, opts) { … }
 *   }
 *   StrokeTracer.use(MyTracer);
 */

// ── internal helpers ─────────────────────────────────────────────────────────

const rand = Math.random.bind(Math);

/** Quadratic Bézier point at parameter t. */
function qbx(t, x0, cx, x1) { return (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1; }
function qby(t, y0, cy, y1) { return (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1; }

/** Quadratic Bézier tangent (first derivative) at t. */
function qtx(t, x0, cx, x1) { return 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx); }
function qty(t, y0, cy, y1) { return 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy); }

// ── Base class ───────────────────────────────────────────────────────────────

export class StrokeTracer {
  /** Active implementation — replaced by StrokeTracer.use(). */
  static #impl = null;

  /**
   * Draw an organic stroke.
   * Delegates to the active implementation (default: BrushTracer).
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ strokeWidth: number, color: string, from: {x,y}, to: {x,y} }} opts
   */
  static draw(ctx, opts) {
    (StrokeTracer.#impl ?? BrushTracer).draw(ctx, opts);
  }

  /**
   * Swap the active tracer at runtime.
   * @param {typeof StrokeTracer} TracerClass
   */
  static use(TracerClass) {
    StrokeTracer.#impl = TracerClass;
  }
}

// ── BrushTracer ──────────────────────────────────────────────────────────────

/**
 * Soft brush stroke — tapered filled polygon.
 *
 * Instead of a fixed-width stroked path, the stroke is built as a filled
 * shape whose width varies along its length (thin at tips, thick at center).
 * This produces the characteristic "pressure" look of a real brush or marker.
 *
 * Algorithm (single fill() call → same overhead as original stroke()):
 *   1. Choose a random Bézier control point (15% bow off centre).
 *   2. Sample the curve at N+1 positions.
 *   3. At each sample compute the perpendicular unit vector.
 *   4. Scale the perpendicular by  peakW × sin(t·π)  → pointed at both ends.
 *   5. Accumulate left-edge and right-edge arrays, then fill as one polygon.
 */
export class BrushTracer extends StrokeTracer {
  static draw(ctx, { strokeWidth, color, from, to }) {
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    if (dist < 1) return;

    const alpha = 0.50 + 0.45 * rand();
    // Peak half-width: 60 %–160 % of strokeWidth, random per stroke
    const peakW = strokeWidth * (0.6 + 1.0 * rand());

    // Curved centreline — bow up to 15 % of line length
    const cpx = (from.x + to.x) / 2 + (rand() - 0.5) * dist * 0.15;
    const cpy = (from.y + to.y) / 2 + (rand() - 0.5) * dist * 0.15;

    // Build tapered polygon edges
    const N    = 8;                 // segments (lower = faster, 8 is imperceptible vs 16)
    const left  = new Array(N + 1);
    const right = new Array(N + 1);

    for (let i = 0; i <= N; i++) {
      const t = i / N;
      // sin envelope: 0 at t=0 and t=1 (pointed tips), 1 at t=0.5 (widest)
      const w  = peakW * Math.sin(t * Math.PI);

      const px = qbx(t, from.x, cpx, to.x);
      const py = qby(t, from.y, cpy, to.y);

      // Unit perpendicular to the tangent
      const tx2 = qtx(t, from.x, cpx, to.x);
      const ty2 = qty(t, from.y, cpy, to.y);
      const len  = Math.hypot(tx2, ty2) || 1;
      const nx   = -ty2 / len;
      const ny   =  tx2 / len;

      left[i]  = { x: px + nx * w, y: py + ny * w };
      right[i] = { x: px - nx * w, y: py - ny * w };
    }

    // Draw as a single filled polygon (one fill() call per stroke)
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(left[i].x,  left[i].y);
    for (let i = N; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();

    ctx.fillStyle     = color;
    ctx.globalAlpha   = alpha;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur    = 0;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ── PenTracer ────────────────────────────────────────────────────────────────

/**
 * Calligraphic fountain-pen stroke.
 *
 * A real nib has a fixed angle (here 45°). Strokes perpendicular to the nib
 * are thick; strokes parallel to it are thin. This produces the classic
 * thick-thin variation of copperplate / italic calligraphy.
 *
 * Still a single stroked path → same overhead as original.
 */
export class PenTracer extends StrokeTracer {
  static draw(ctx, { strokeWidth, color, from, to }) {
    // Nib angle: 45° (classic broad-edge pen)
    const NIB   = Math.PI / 4;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    // |sin(angle - NIB)| → 0 when parallel to nib, 1 when perpendicular
    const flex  = Math.abs(Math.sin(angle - NIB));
    const w     = strokeWidth * (0.15 + 0.85 * flex) * (0.85 + 0.15 * rand());
    const alpha = 0.80 + 0.18 * rand();

    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const cpx  = (from.x + to.x) / 2 + (rand() - 0.5) * dist * 0.05;
    const cpy  = (from.y + to.y) / 2 + (rand() - 0.5) * dist * 0.05;

    ctx.beginPath();
    ctx.lineWidth     = w;
    ctx.strokeStyle   = color;
    ctx.globalAlpha   = alpha;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur    = 0;
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ── PencilTracer ─────────────────────────────────────────────────────────────

/**
 * Rough pencil stroke.
 *
 * Two overlapping semi-transparent Bézier curves, each with independent
 * jitter and curvature, create the grainy layered look of a graphite pencil.
 *
 * Note: ~2× render cost. If performance is critical, reduce BATCH_SIZE by half.
 */
export class PencilTracer extends StrokeTracer {
  static draw(ctx, { strokeWidth, color, from, to }) {
    const dist = Math.hypot(to.x - from.x, to.y - from.y);

    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur    = 0;

    for (let i = 0; i < 2; i++) {
      const w     = strokeWidth * (0.25 + 0.55 * rand());
      const alpha = 0.30 + 0.35 * rand();
      const j     = Math.max(strokeWidth * 0.5, dist * 0.004);
      const cpx   = (from.x + to.x) / 2 + (rand() - 0.5) * dist * 0.08;
      const cpy   = (from.y + to.y) / 2 + (rand() - 0.5) * dist * 0.08;

      ctx.beginPath();
      ctx.lineWidth   = w;
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.moveTo(from.x + (rand() - 0.5) * j, from.y + (rand() - 0.5) * j);
      ctx.quadraticCurveTo(cpx, cpy,
        to.x + (rand() - 0.5) * j, to.y + (rand() - 0.5) * j);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }
}
