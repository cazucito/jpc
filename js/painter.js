import { PerformanceConfig } from './config.js';
import { Util }              from './util.js';
import { ColorRegistry }     from './color.js';
import { StrokeTracer }      from './stroke.js';

export class JPPainter {
  static drawLine(ctx, { strokeWidth, color, from, to }) {
    if (!color) return;
    StrokeTracer.draw(ctx, { strokeWidth, color, from, to });
  }

  static render({ ctx, canvas, totalLines, strokeWidth, colorSet, onComplete, signal }) {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let rendered = 0;
    const total  = Math.max(0, Number(totalLines) || 0);

    const drawChunk = () => {
      if (signal?.aborted) return;

      const start = performance.now();

      while (rendered < total) {
        JPPainter.drawLine(ctx, {
          strokeWidth,
          color: ColorRegistry.random(colorSet),
          from:  { x: Util.getRandomInt(0, canvas.width),  y: Util.getRandomInt(0, canvas.height) },
          to:    { x: Util.getRandomInt(0, canvas.width),  y: Util.getRandomInt(0, canvas.height) },
        });

        rendered++;

        const hitBatch  = rendered % PerformanceConfig.BATCH_SIZE === 0;
        const hitBudget = performance.now() - start > PerformanceConfig.FRAME_BUDGET_MS;
        if (hitBatch || hitBudget) break;
      }

      if (rendered >= total) {
        onComplete?.();
      } else if (!signal?.aborted) {
        requestAnimationFrame(drawChunk);
      }
    };

    requestAnimationFrame(drawChunk);
  }
}
