(function () {
  'use strict';

  const PerformanceConfig = {
    DEFAULT_LINES: 12000,
    BATCH_SIZE: 250,
    STROKE_WIDTH: 2,
    FRAME_BUDGET_MS: 10
  };

  const AppState = {
    canvas: null,
    ctx: null,
    activeRenderToken: null,
    resizeTimer: null,
    lastColorSet: 'BWR'
  };

  function init() {
    setupCanvas();
    JPPainter.createPaintingA(AppState.canvas, Default.howManyLines(), Default.colorSet());
    attachResizeHandler();
  }

  function setupCanvas() {
    const containerCanvas = document.getElementById('containerCanvas');
    const canvas = document.getElementById('jpcanvas');

    if (!containerCanvas || !canvas) return;

    const divWidth = containerCanvas.clientWidth;
    const body = document.body;
    const html = document.documentElement;
    const pageHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    containerCanvas.style.height = `${pageHeight}px`;
    containerCanvas.style.width = `${divWidth}px`;

    const footerAndMargins = 130;
    canvas.width = Math.max(320, divWidth);
    canvas.height = Math.max(240, pageHeight - footerAndMargins);

    AppState.canvas = canvas;
    AppState.ctx = canvas.getContext('2d');
  }

  function attachResizeHandler() {
    window.addEventListener('resize', () => {
      clearTimeout(AppState.resizeTimer);
      AppState.resizeTimer = setTimeout(() => {
        setupCanvas();
        JPPainter.createPaintingA(AppState.canvas, Default.howManyLines(), AppState.lastColorSet);
      }, 200);
    });
  }

  class Default {
    static howManyLines() {
      return PerformanceConfig.DEFAULT_LINES;
    }

    static colorSet() {
      return 'BWR';
    }
  }

  class JPPainter {
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
      AppState.lastColorSet = colorSet || Default.colorSet();

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

  class Util {
    static getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }
  }

  class ColorSet {
    static getColorSet(name) {
      const colorSets = {
        BWR: ['black', 'white', 'red'],
        RGB: ['red', 'green', 'blue'],
        BWR2: ['blue', 'white', 'red']
      };
      return colorSets[name] || colorSets.BWR;
    }
  }

  class ColorHandler {
    static getRandomColor(colorSet) {
      const set = ColorSet.getColorSet(colorSet);
      return set[Math.floor(Math.random() * set.length)];
    }
  }

  window.Default = Default;
  window.JPPainter = JPPainter;
  window.init = init;

  document.addEventListener('DOMContentLoaded', init);
})();
