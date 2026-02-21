#!/usr/bin/env python3
"""
gen-favicon.py — pure-Python favicon generator for JPCanvas.
Requires only stdlib (struct, zlib, math, os).

Produces:
  favicon.ico  — 16 + 32 px PNG-in-ICO layers
  favicon.svg  — vector version for modern browsers
"""

import math, os, struct, zlib

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

# ── PNG encoder ───────────────────────────────────────────────────────────────

def png_encode(pixels, w, h):
    """Encode a list of (R,G,B,A) tuples as a PNG byte string."""
    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    raw = bytearray()
    for y in range(h):
        raw.append(0)                          # filter-type None
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            raw += bytes([r, g, b, a])

    sig  = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    iend = chunk(b"IEND", b"")
    return sig + ihdr + idat + iend

# ── Pixel helpers ─────────────────────────────────────────────────────────────

def blend(pixels, w, h, x, y, color, alpha):
    """Alpha-composite `color` with `alpha` (0-255) onto the pixel at (x,y)."""
    xi, yi = int(x), int(y)
    if not (0 <= xi < w and 0 <= yi < h):
        return
    cr, cg, cb, _ = pixels[yi * w + xi]
    sr, sg, sb    = color
    a = alpha
    pixels[yi * w + xi] = (
        (sr * a + cr * (255 - a)) >> 8,
        (sg * a + cg * (255 - a)) >> 8,
        (sb * a + cb * (255 - a)) >> 8,
        255,
    )

# ── Wu anti-aliased line (single-pixel-wide) ──────────────────────────────────

def _wu(pixels, w, h, x0, y0, x1, y1, color):
    steep = abs(y1 - y0) > abs(x1 - x0)
    if steep:   x0,y0,x1,y1 = y0,x0,y1,x1
    if x0 > x1: x0,y0,x1,y1 = x1,y1,x0,y0

    dx = x1 - x0
    dy = y1 - y0
    grad = dy / dx if dx else 1.0

    def plot(px, py, bright):
        b = int(bright * 255)
        if steep: blend(pixels, w, h, py, px, color, b)
        else:     blend(pixels, w, h, px, py, color, b)

    # first endpoint
    xe    = round(x0)
    ye    = y0 + grad * (xe - x0)
    xgap  = 1 - math.modf(x0 + 0.5)[0]
    xp1   = xe
    yp1   = int(ye)
    frac  = math.modf(ye)[0]
    plot(xp1, yp1,     (1 - frac) * xgap)
    plot(xp1, yp1 + 1, frac       * xgap)

    intery = ye + grad

    # last endpoint
    xe  = round(x1)
    ye  = y1 + grad * (xe - x1)
    xgap = math.modf(x1 + 0.5)[0]
    xp2  = xe
    yp2  = int(ye)
    frac = math.modf(ye)[0]
    plot(xp2, yp2,     (1 - frac) * xgap)
    plot(xp2, yp2 + 1, frac       * xgap)

    for x in range(xp1 + 1, xp2):
        frac = math.modf(intery)[0]
        plot(x, int(intery),     1 - frac)
        plot(x, int(intery) + 1, frac)
        intery += grad

def thick_line(pixels, w, h, x0, y0, x1, y1, color, thickness):
    """Draw a thick anti-aliased line as several offset single-pixel lines."""
    dx = x1 - x0; dy = y1 - y0
    length = math.hypot(dx, dy)
    if length == 0: return
    px = -dy / length   # perpendicular unit vector
    py =  dx / length

    t = max(1.0, float(thickness))
    offsets = [i * 0.85 for i in range(-int(t//2), int(math.ceil(t/2)))]
    for o in offsets:
        _wu(pixels, w, h,
            x0 + px*o, y0 + py*o,
            x1 + px*o, y1 + py*o,
            color)

# ── Design ────────────────────────────────────────────────────────────────────

def draw_icon(size):
    """Return a list of (R,G,B,A) pixels representing the favicon at `size`."""
    pix = [(255, 255, 255, 255)] * (size * size)   # white canvas
    s   = size / 32.0

    # stroke 1 — bold black diagonal  (5,27)→(27,5)
    thick_line(pix, size, size,
               5*s, 27*s, 27*s, 5*s,
               (17, 17, 17), thickness=4.5*s)

    # stroke 2 — red crossing         (4,13)→(22,29)
    thick_line(pix, size, size,
               4*s, 13*s, 22*s, 29*s,
               (204, 17, 17), thickness=3.5*s)

    # stroke 3 — thin black           (11,3)→(29,19)
    thick_line(pix, size, size,
               11*s, 3*s, 29*s, 19*s,
               (17, 17, 17), thickness=2.0*s)

    return pix

# ── Box-filter downscale ──────────────────────────────────────────────────────

def downscale(src, sw, sh, dw, dh):
    sx = sw / dw; sy = sh / dh
    out = []
    for y in range(dh):
        for x in range(dw):
            x0,x1 = int(x*sx), max(int(x*sx)+1, int((x+1)*sx))
            y0,y1 = int(y*sy), max(int(y*sy)+1, int((y+1)*sy))
            rs=gs=bs=as_=n=0
            for py in range(y0, min(y1,sh)):
                for px in range(x0, min(x1,sw)):
                    r,g,b,a = src[py*sw+px]
                    rs+=r;gs+=g;bs+=b;as_+=a;n+=1
            out.append((rs//n,gs//n,bs//n,as_//n) if n else (255,255,255,255))
    return out

# ── ICO builder ───────────────────────────────────────────────────────────────

def build_ico(png_bufs, sizes):
    n = len(png_bufs)
    hdr = 6; dire = 16
    off = hdr + dire * n
    offsets = []
    for b in png_bufs:
        offsets.append(off); off += len(b)

    buf = bytearray(off)
    struct.pack_into("<HHH", buf, 0, 0, 1, n)    # header

    for i, (sz, data, o) in enumerate(zip(sizes, png_bufs, offsets)):
        base = hdr + i * dire
        ico_sz = 0 if sz >= 256 else sz
        struct.pack_into("<BBBBHHII", buf, base,
                         ico_sz, ico_sz, 0, 0, 1, 32, len(data), o)

    for data, o in zip(png_bufs, offsets):
        buf[o:o+len(data)] = data

    return bytes(buf)

# ── Main ──────────────────────────────────────────────────────────────────────

SRC = 128
src = draw_icon(SRC)

pix32 = downscale(src, SRC, SRC, 32, 32)
pix16 = downscale(src, SRC, SRC, 16, 16)
png32 = png_encode(pix32, 32, 32)
png16 = png_encode(pix16, 16, 16)

ico_path = os.path.join(ROOT, "favicon.ico")
with open(ico_path, "wb") as f:
    f.write(build_ico([png16, png32], [16, 32]))
print(f"favicon.ico  written ({os.path.getsize(ico_path)} bytes)  — 16+32 px PNG layers")

svg = """\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="5" fill="#ffffff"/>
  <line x1="5"  y1="27" x2="27" y2="5"  stroke="#111111" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="4"  y1="13" x2="22" y2="29" stroke="#cc1111" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="11" y1="3"  x2="29" y2="19" stroke="#111111" stroke-width="2"   stroke-linecap="round"/>
</svg>"""

svg_path = os.path.join(ROOT, "favicon.svg")
with open(svg_path, "w") as f:
    f.write(svg)
print(f"favicon.svg  written ({len(svg)} bytes)  — vector for modern browsers")
