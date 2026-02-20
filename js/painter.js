import { PerformanceConfig } from './config.js';
import { Util }              from './util.js';
import { ColorRegistry }     from './color.js';

export class JPPainter {
  static drawLine(ctx, { strokeWidth, color, from, to }) {
    if (!color) return;
    ctx.beginPath();
    ctx.lineWidth     = strokeWidth;
    ctx.strokeStyle   = color;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur    = 1;
    ctx.shadowColor   = 'gray';
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  static render({ ctx, canvas, totalLines, strokeWidth, colorSet, onComplete, signal }) {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
