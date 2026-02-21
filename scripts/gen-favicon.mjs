/**
 * gen-favicon.mjs
 * Generates favicon.svg and favicon.ico (16+32 px PNG layers) for JPCanvas.
 *
 * Design: three crossing brush strokes in BWR palette on a white canvas,
 * representative of the app's generative line-art output.
 *
 * Usage: node scripts/gen-favicon.mjs
 */

import { createCanvas } from 'canvas';
import sharp            from 'sharp';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath }    from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── Draw the icon on a canvas at the given pixel size ─────────────────────

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx    = canvas.getContext('2d');
  const s      = size / 32;   // normalise to a 32×32 design grid
  const r      = 5 * s;       // corner radius

  // ── background ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  ctx.lineCap = 'round';

  // ── stroke 1: bold black diagonal (bottom-left → top-right) ──────────────
  ctx.strokeStyle = '#111111';
  ctx.lineWidth   = 4.5 * s;
  ctx.beginPath();
  ctx.moveTo(5 * s, 27 * s);
  ctx.lineTo(27 * s, 5 * s);
  ctx.stroke();

  // ── stroke 2: red crossing line (top-left area → bottom-right area) ───────
  ctx.strokeStyle = '#cc1111';
  ctx.lineWidth   = 3.5 * s;
  ctx.beginPath();
  ctx.moveTo(4 * s, 13 * s);
  ctx.lineTo(22 * s, 29 * s);
  ctx.stroke();

  // ── stroke 3: thin black (top area → right area) ──────────────────────────
  ctx.strokeStyle = '#111111';
  ctx.lineWidth   = 2 * s;
  ctx.beginPath();
  ctx.moveTo(11 * s, 3 * s);
  ctx.lineTo(29 * s, 19 * s);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

// ── Build a multi-size ICO file (PNG-inside-ICO, supported since Vista) ────

function buildIco(pngBuffers, sizes) {
  const count        = pngBuffers.length;
  const HEADER_SZ    = 6;
  const DIR_ENTRY_SZ = 16;

  let dataOffset = HEADER_SZ + DIR_ENTRY_SZ * count;
  const offsets  = pngBuffers.map(buf => { const o = dataOffset; dataOffset += buf.length; return o; });

  const result = Buffer.alloc(dataOffset);

  // ICO file header
  result.writeUInt16LE(0,     0);  // reserved
  result.writeUInt16LE(1,     2);  // type = 1 (icon)
  result.writeUInt16LE(count, 4);  // number of images

  // Directory entries
  for (let i = 0; i < count; i++) {
    const base = HEADER_SZ + i * DIR_ENTRY_SZ;
    const sz   = sizes[i] >= 256 ? 0 : sizes[i];   // 0 means 256 in the spec
    result.writeUInt8(sz,  base);      // width
    result.writeUInt8(sz,  base + 1);  // height
    result.writeUInt8(0,   base + 2);  // color count (0 = truecolor)
    result.writeUInt8(0,   base + 3);  // reserved
    result.writeUInt16LE(1,  base + 4);  // color planes
    result.writeUInt16LE(32, base + 6);  // bits per pixel
    result.writeUInt32LE(pngBuffers[i].length, base + 8);   // data size
    result.writeUInt32LE(offsets[i],           base + 12);  // data offset
  }

  // Image data blocks
  for (let i = 0; i < count; i++) pngBuffers[i].copy(result, offsets[i]);

  return result;
}

// ── Main ───────────────────────────────────────────────────────────────────

const SRC_SIZE = 128;   // render at high-res, then downscale with sharp

const srcPng = drawIcon(SRC_SIZE);

const [png16, png32] = await Promise.all([
  sharp(srcPng).resize(16, 16, { kernel: 'lanczos3' }).png().toBuffer(),
  sharp(srcPng).resize(32, 32, { kernel: 'lanczos3' }).png().toBuffer(),
]);

// ICO (16 + 32 px layers)
writeFileSync(resolve(ROOT, 'favicon.ico'), buildIco([png16, png32], [16, 32]));
console.log('✓ favicon.ico  (16 + 32 px PNG layers)');

// SVG — same design as a pure vector for modern browsers
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="5" fill="#ffffff"/>
  <!-- bold black diagonal -->
  <line x1="5"  y1="27" x2="27" y2="5"  stroke="#111111" stroke-width="4.5" stroke-linecap="round"/>
  <!-- red crossing stroke -->
  <line x1="4"  y1="13" x2="22" y2="29" stroke="#cc1111" stroke-width="3.5" stroke-linecap="round"/>
  <!-- thin black stroke -->
  <line x1="11" y1="3"  x2="29" y2="19" stroke="#111111" stroke-width="2"   stroke-linecap="round"/>
</svg>`;

writeFileSync(resolve(ROOT, 'favicon.svg'), svg);
console.log('✓ favicon.svg  (vector, for modern browsers)');
