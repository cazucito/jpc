// Render Worker - Runs in background thread
// Handles heavy canvas rendering without blocking UI

// Simple PRNG for seeded renders
function createSeededRandom(seed) {
  return function() {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647);
  };
}

function getRandomInt(rng, min, max) {
  return Math.floor(rng() * (max - min)) + min;
}

// Stroke drawing functions
const strokeEngines = {
  brush(ctx, x1, y1, x2, y2, width, color) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (0.8 + Math.random() * 0.4);
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.85;
    ctx.stroke();
  },

  pen(ctx, x1, y1, x2, y2, width, color) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const perpX = -Math.sin(angle) * width * 0.5;
    const perpY = Math.cos(angle) * width * 0.5;
    
    ctx.beginPath();
    ctx.moveTo(x1 + perpX, y1 + perpY);
    ctx.lineTo(x2 + perpX, y2 + perpY);
    ctx.lineTo(x2 - perpX, y2 - perpY);
    ctx.lineTo(x1 - perpX, y1 - perpY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fill();
  },

  pencil(ctx, x1, y1, x2, y2, width, color) {
    const jitter = width * 0.3;
    ctx.beginPath();
    ctx.moveTo(x1 + (Math.random() - 0.5) * jitter, y1 + (Math.random() - 0.5) * jitter);
    ctx.lineTo(x2 + (Math.random() - 0.5) * jitter, y2 + (Math.random() - 0.5) * jitter);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (0.6 + Math.random() * 0.4);
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7;
    ctx.stroke();
  },

  marker(ctx, x1, y1, x2, y2, width, color) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 1.2;
    ctx.lineCap = 'butt';
    ctx.globalAlpha = 0.95;
    ctx.stroke();
    
    // Bleed effect
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 0.5;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
  },

  charcoal(ctx, x1, y1, x2, y2, width, color) {
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const offset = (Math.random() - 0.5) * width * 0.8;
      ctx.beginPath();
      ctx.moveTo(x1 + offset, y1 + offset);
      ctx.lineTo(x2 + offset, y2 + offset);
      ctx.strokeStyle = color;
      ctx.lineWidth = width * (0.5 + Math.random() * 0.8);
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.4;
      ctx.stroke();
    }
  }
};

// Color palettes
const palettes = {
  BWR: ['#1a1a1a', '#ffffff', '#c42525'],
  POLLOCK: ['#1a1a1a', '#8b4513', '#d4a574', '#f5f5dc'],
  SUNSET: ['#ff6b6b', '#f9ca24', '#f0932b', '#6c5ce7'],
  OCEAN: ['#0984e3', '#00cec9', '#74b9ff', '#a29bfe'],
  FOREST: ['#00b894', '#55efc4', '#2d3436', '#636e72'],
  NEON: ['#ff00ff', '#00ffff', '#ffff00', '#ff0099'],
  GOLDEN: ['#c4984a', '#f9ca24', '#f0932b', '#2d1f0e'],
  PASTEL: ['#fab1a0', '#ff7675', '#fd79a8', '#fdcb6e'],
  WINE: ['#722f37', '#c0392b', '#f5f5dc', '#2d1f0e']
};

function getRandomColor(rng, paletteName) {
  const colors = palettes[paletteName] || palettes.BWR;
  return colors[Math.floor(rng() * colors.length)];
}

function drawSignature(ctx, canvas) {
  const size = Math.max(10, Math.round(canvas.width * 0.022));
  const margin = Math.round(size * 1.2);
  const x = canvas.width - margin;
  const y = canvas.height - margin;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.font = `italic ${size}px Georgia, serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#000000';
  ctx.fillText('cazucito', x, y);
  ctx.restore();
}

// Main render function
async function render(params) {
  const { canvas, totalLines, strokeWidth, colorSet, engine, seed, animation, animationSpeed } = params;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Create RNG
  const rng = seed !== null ? createSeededRandom(seed) : Math.random;
  
  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  const strokeFunc = strokeEngines[engine] || strokeEngines.brush;
  let rendered = 0;
  
  if (animation) {
    // Animation mode - draw with delays
    const minDelay = 0;
    const maxDelay = 100;
    const delay = maxDelay - ((animationSpeed - 1) / 9) * (maxDelay - minDelay);
    
    for (let i = 0; i < totalLines; i++) {
      // Check for cancellation
      if (self.isCancelled) break;
      
      strokeFunc(
        ctx,
        getRandomInt(rng, 0, width),
        getRandomInt(rng, 0, height),
        getRandomInt(rng, 0, width),
        getRandomInt(rng, 0, height),
        strokeWidth,
        getRandomColor(rng, colorSet)
      );
      
      rendered++;
      
      // Report progress every 10 lines
      if (rendered % 10 === 0) {
        self.postMessage({ type: 'progress', rendered, total: totalLines });
      }
      
      // Delay for animation
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } else {
    // Instant mode - draw in batches
    const BATCH_SIZE = 100;
    const FRAME_BUDGET = 16; // 60fps
    
    while (rendered < totalLines) {
      if (self.isCancelled) break;
      
      const startTime = performance.now();
      
      while (rendered < totalLines) {
        strokeFunc(
          ctx,
          getRandomInt(rng, 0, width),
          getRandomInt(rng, 0, height),
          getRandomInt(rng, 0, width),
          getRandomInt(rng, 0, height),
          strokeWidth,
          getRandomColor(rng, colorSet)
        );
        
        rendered++;
        
        const hitBatch = rendered % BATCH_SIZE === 0;
        const hitBudget = performance.now() - startTime > FRAME_BUDGET;
        
        if (hitBatch || hitBudget) break;
      }
      
      // Report progress
      self.postMessage({ type: 'progress', rendered, total: totalLines });
      
      // Yield to allow cancellation
      if (rendered < totalLines) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }
  
  if (!self.isCancelled) {
    drawSignature(ctx, canvas);
  }
  
  return rendered;
}

// Message handler
self.onmessage = async function(e) {
  const { type, params } = e.data;
  
  if (type === 'render') {
    self.isCancelled = false;
    
    try {
      const count = await render(params);
      
      if (!self.isCancelled) {
        self.postMessage({ 
          type: 'complete', 
          count,
          canvas: params.canvas // Transfer back
        }, [params.canvas]);
      } else {
        self.postMessage({ type: 'cancelled' });
      }
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message });
    }
  } else if (type === 'cancel') {
    self.isCancelled = true;
  }
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });
