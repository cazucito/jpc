/**
 * stroke.js — Extensible organic stroke engine for JPCanvas.
 *
 * Public API (same signature as the original JPPainter.drawLine):
 *   StrokeTracer.draw(ctx, { strokeWidth, color, from, to })
 *
 * Built-in implementations:
 *   BrushTracer   — default; soft brush with pressure + fade (minimal overhead)
 *   PenTracer     — thin fountain-pen line with slight flex
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
 * Soft brush stroke.
 *
 * Effects applied per stroke (single canvas path → ~same overhead as original):
 *   • Width varies randomly around strokeWidth (simulates pen pressure)
 *   • Opacity fades in/out via globalAlpha
 *   • Path bows slightly via a quadratic Bézier control point
 *   • Endpoint jitter adds subtle edge texture
 */
export class BrushTracer extends StrokeTracer {
  static draw(ctx, { strokeWidth, color, from, to }) {
    const w     = strokeWidth * (0.55 + 0.45 * rand());  // pressure variation
    const alpha = 0.55 + 0.40 * rand();                  // fade-in / fade-out

    // Slight quadratic bow for organic curvature
    const noise = strokeWidth * 1.5;
    const cpx   = (from.x + to.x) / 2 + (rand() - 0.5) * noise;
    const cpy   = (from.y + to.y) / 2 + (rand() - 0.5) * noise;

    // Endpoint jitter for edge texture
    const j  = strokeWidth * 0.15;
    const fx = from.x + (rand() - 0.5) * j;
    const fy = from.y + (rand() - 0.5) * j;
    const tx = to.x   + (rand() - 0.5) * j;
    const ty = to.y   + (rand() - 0.5) * j;

    ctx.beginPath();
    ctx.lineWidth     = w;
    ctx.strokeStyle   = color;
    ctx.globalAlpha   = alpha;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur    = 1;
    ctx.shadowColor   = 'gray';
    ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo(cpx, cpy, tx, ty);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ── PenTracer ────────────────────────────────────────────────────────────────

/**
 * Fountain-pen stroke.
 *
 * Effects (single path → same overhead as original):
 *   • Thin, precise lines with calligraphy-style flex (narrow width range)
 *   • Minimal shadow for crisp edges
 *   • Very subtle curvature for natural hand feel
 */
export class PenTracer extends StrokeTracer {
  static draw(ctx, { strokeWidth, color, from, to }) {
    const w     = strokeWidth * (0.4 + 0.35 * rand());
    const alpha = 0.75 + 0.20 * rand();

    const cpx = (from.x + to.x) / 2 + (rand() - 0.5) * strokeWidth * 0.5;
    const cpy = (from.y + to.y) / 2 + (rand() - 0.5) * strokeWidth * 0.5;

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
 * Effects (2 overlapping sub-paths → ~2× overhead vs original):
 *   • Two slightly offset Bézier curves create grainy texture
 *   • Low alpha per sub-path for translucent, layered pencil look
 *   • Endpoint jitter on each sub-path for rough edges
 *
 * Note: ~2× render cost. If performance is critical, reduce BATCH_SIZE by half.
 */
export class PencilTracer extends StrokeTracer {
  static draw(ctx, { strokeWidth, color, from, to }) {
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur    = 0;

    for (let i = 0; i < 2; i++) {
      const envelope = 0.7 + 0.3 * rand();
      const w        = strokeWidth * (0.25 + 0.45 * envelope);
      const alpha    = 0.30 + 0.35 * rand();
      const j        = strokeWidth * 0.25;
      const cpx      = (from.x + to.x) / 2 + (rand() - 0.5) * strokeWidth;
      const cpy      = (from.y + to.y) / 2 + (rand() - 0.5) * strokeWidth;

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
