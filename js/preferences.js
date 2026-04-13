const STORAGE_KEY = 'jpc_render_preferences_v1';

export const DEFAULTS = Object.freeze({
  lines:           6000,
  stroke:          3,
  colorSet:        'BWR',
  customColors:    ['#000000', '#ffffff', '#ff0000'],
  engine:          'brush',
  animation:       false,
  animationSpeed:  5,
});

export const UserPreferences = {
  lines:           DEFAULTS.lines,
  stroke:          DEFAULTS.stroke,
  colorSet:        DEFAULTS.colorSet,
  customColors:    [...DEFAULTS.customColors],
  engine:          DEFAULTS.engine,
  animation:       DEFAULTS.animation,
  animationSpeed:  DEFAULTS.animationSpeed,

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (Number.isFinite(data.lines))                                      this.lines           = data.lines;
      if (Number.isFinite(data.stroke))                                     this.stroke          = data.stroke;
      if (typeof data.colorSet === 'string')                                this.colorSet        = data.colorSet;
      if (Array.isArray(data.customColors) && data.customColors.length === 3) this.customColors   = data.customColors;
      if (typeof data.engine === 'string')                                  this.engine          = data.engine;
      if (typeof data.animation === 'boolean')                              this.animation       = data.animation;
      if (Number.isFinite(data.animationSpeed))                             this.animationSpeed  = data.animationSpeed;
    } catch { /* noop */ }
  },"},{"oldText":"  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lines:        this.lines,
      stroke:       this.stroke,
      colorSet:     this.colorSet,
      customColors: this.customColors,
      engine:       this.engine,
    }));
  },","newText":"  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lines:           this.lines,
      stroke:          this.stroke,
      colorSet:        this.colorSet,
      customColors:    this.customColors,
      engine:          this.engine,
      animation:       this.animation,
      animationSpeed:  this.animationSpeed,
    }));
  },"},{"oldText":"  reset() {
    this.lines        = DEFAULTS.lines;
    this.stroke       = DEFAULTS.stroke;
    this.colorSet     = DEFAULTS.colorSet;
    this.customColors = [...DEFAULTS.customColors];
    this.engine       = DEFAULTS.engine;
    this.save();
  },","newText":"  reset() {
    this.lines           = DEFAULTS.lines;
    this.stroke          = DEFAULTS.stroke;
    this.colorSet        = DEFAULTS.colorSet;
    this.customColors    = [...DEFAULTS.customColors];
    this.engine          = DEFAULTS.engine;
    this.animation       = DEFAULTS.animation;
    this.animationSpeed  = DEFAULTS.animationSpeed;
    this.save();
  },"}]};\n</function>\n<function=edit>\n<parameter=path>~/workspace/jpc/js/painter.js</parameter>\n<parameter=edits>[{"oldText":"  static render({ ctx, canvas, totalLines, strokeWidth, colorSet, onComplete, signal }) {
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
        JPPainter.drawSignature(ctx, canvas);
        onComplete?.();
      } else if (!signal?.aborted) {
        requestAnimationFrame(drawChunk);
      }
    };

    requestAnimationFrame(drawChunk);
  }","newText":"  static render({ ctx, canvas, totalLines, strokeWidth, colorSet, onComplete, signal, animation = false, animationSpeed = 5 }) {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let rendered = 0;
    const total  = Math.max(0, Number(totalLines) || 0);

    // Animation mode: draw lines one by one with delay
    if (animation) {
      const minDelay = 0;    // speed 10
      const maxDelay = 100;  // speed 1
      const delay = maxDelay - ((animationSpeed - 1) / 9) * (maxDelay - minDelay);

      let lastDrawTime = 0;

      const drawAnimated = (timestamp) => {
        if (signal?.aborted) return;

        if (timestamp - lastDrawTime >= delay) {
          if (rendered < total) {
            JPPainter.drawLine(ctx, {
              strokeWidth,
              color: ColorRegistry.random(colorSet),
              from:  { x: Util.getRandomInt(0, canvas.width),  y: Util.getRandomInt(0, canvas.height) },
              to:    { x: Util.getRandomInt(0, canvas.width),  y: Util.getRandomInt(0, canvas.height) },
            });
            rendered++;
            lastDrawTime = timestamp;
          }
        }

        if (rendered >= total) {
          JPPainter.drawSignature(ctx, canvas);
          onComplete?.();
        } else if (!signal?.aborted) {
          requestAnimationFrame(drawAnimated);
        }
      };

      requestAnimationFrame(drawAnimated);
      return;
    }

    // Instant mode: draw in chunks (original behavior)
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
        JPPainter.drawSignature(ctx, canvas);
        onComplete?.();
      } else if (!signal?.aborted) {
        requestAnimationFrame(drawChunk);
      }
    };

    requestAnimationFrame(drawChunk);
  }"}]};\n</function>\n<function=read>\n<parameter=path>~/workspace/jpc/index.html</parameter>\n<parameter=offset>60</parameter>\n<parameter=lines>40</parameter>\n</function>\n<function=edit>\n<parameter=path>~/workspace/jpc/index.html</parameter>\n<parameter=edits>[{"oldText":"            <label class="

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lines:        this.lines,
      stroke:       this.stroke,
      colorSet:     this.colorSet,
      customColors: this.customColors,
      engine:       this.engine,
    }));
  },

  reset() {
    this.lines        = DEFAULTS.lines;
    this.stroke       = DEFAULTS.stroke;
    this.colorSet     = DEFAULTS.colorSet;
    this.customColors = [...DEFAULTS.customColors];
    this.engine       = DEFAULTS.engine;
    this.save();
  },

  randomize(availablePalettes, availableEngines) {
    // Random lines: 1000 to 12000, step 250
    this.lines = Math.floor((1000 + Math.random() * 11000) / 250) * 250;
    
    // Random stroke: 1 to 6
    this.stroke = Math.floor(1 + Math.random() * 6);
    
    // Random palette (exclude CUSTOM for simplicity)
    const palettes = availablePalettes.filter(p => p !== 'CUSTOM');
    this.colorSet = palettes[Math.floor(Math.random() * palettes.length)];
    
    // Random engine
    this.engine = availableEngines[Math.floor(Math.random() * availableEngines.length)];
    
    // Random custom colors (just in case)
    this.customColors = [
      '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    ];
    
    this.save();
  },
};
