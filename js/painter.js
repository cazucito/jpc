import { AppState } from './state.js';
import { PerformanceConfig } from './config.js';
import { Util } from './util.js';
import { ColorHandler } from './color.js';

export class JPPainter {
  static drawLine(ctx, widthLine, colorLine, origCoord, targetCoord) {
    if (!colorLine) return;
    ctx.beginPath();
    ctx.lineWidth = widthLine;
    ctx.strokeStyle = colorLine;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 1;
    ctx.shadowColor = 'gray';
    ctx.moveTo(origCoord.x, origCoord.y);
    ctx.lineTo(targetCoord.x, targetCoord.y);
    ctx.stroke();
  }

  static createPaintingA(canvas, howManyLines, colorSet) {
    if (!canvas) return;

    const ctx = AppState.ctx || canvas.getContext('2d');
    AppState.lastColorSet = colorSet || 'BWR';

    if (AppState.activeRenderToken) {
      AppState.activeRenderToken.cancelled = true;
    }

    const renderToken = { cancelled: false };
    AppState.activeRenderToken = renderToken;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    JPPainter.paintMainTitle(AppState.lastColorSet);

    let renderedLines = 0;
    const totalLines = Math.max(0, Number(howManyLines) || 0);

    const drawChunk = () => {
      if (renderToken.cancelled) return;

      const start = performance.now();

      while (renderedLines < totalLines) {
        const orig = {
          x: Util.getRandomInt(0, canvas.width),
          y: Util.getRandomInt(0, canvas.height)
        };

        const target = {
          x: Util.getRandomInt(0, canvas.width),
          y: Util.getRandomInt(0, canvas.height)
        };

        JPPainter.drawLine(
          ctx,
          PerformanceConfig.STROKE_WIDTH,
          ColorHandler.getRandomColor(AppState.lastColorSet),
          orig,
          target
        );

        renderedLines += 1;

        const hitBatchLimit = renderedLines % PerformanceConfig.BATCH_SIZE === 0;
        const hitFrameBudget = performance.now() - start > PerformanceConfig.FRAME_BUDGET_MS;
        if (hitBatchLimit || hitFrameBudget) break;
      }

      if (renderedLines < totalLines && !renderToken.cancelled) {
        requestAnimationFrame(drawChunk);
      }
    };

    requestAnimationFrame(drawChunk);
  }

  static paintMainTitle(colorSet) {
    const mainTitle = document.getElementById('mainTitle');
    if (!mainTitle) return;

    if (Array.isArray(colorSet)) {
      mainTitle.innerHTML = '<strong>JPCanvas <span class="white">(Custom)</span></strong>';
      return;
    }

    let newMainTitle = '';
    switch (colorSet) {
      case 'BWR':
        newMainTitle = "<strong><span class='black'>J</span><span class='white'>P</span><span class='red'>Canvas</span></strong>";
        break;
      case 'BWR2':
        newMainTitle = "<strong><span class='blue'>J</span><span class='white'>P</span><span class='red'>Canvas</span></strong>";
        break;
      case 'RGB':
        newMainTitle = "<strong><span class='red'>J</span><span class='green'>P</span><span class='blue'>Canvas</span></strong>";
        break;
      default:
        newMainTitle = '<strong>JPCanvas</strong>';
    }

    mainTitle.innerHTML = newMainTitle;
  }
}
