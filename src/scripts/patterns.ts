// Placeholder cover art, one field per project. These stand in until the
// Python generator renders covers from each project's real output.
import { mulberry32, type Field } from './halftone';
import type { Pattern } from '../data/projects';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const gauss = (d: number, s: number) => Math.exp(-(d * d) / (s * s));

// --- 001: CGM traces dipping below the 70 mg/dL line (at 70 % height) ---
const LOW_Y = 0.7;
const traces = (() => {
  const rand = mulberry32(70);
  return Array.from({ length: 5 }, (_, k) => ({
    base: 0.3 + 0.075 * k,
    terms: [
      [0.09 + 0.05 * rand(), 3 + 3 * rand(), Math.PI * 2 * rand()],
      [0.04 + 0.02 * rand(), 9 + 6 * rand(), Math.PI * 2 * rand()],
      [0.012, 24 + 10 * rand(), Math.PI * 2 * rand()],
    ],
  }));
})();

const glucose: Field = (x, y, aspect) => {
  let v = y > LOW_Y && y < 0.84 ? 0.13 : 0;
  for (const { base, terms } of traces) {
    let ty = base;
    let slope = 0;
    for (const [a, f, p] of terms) {
      ty += a * Math.sin(f * x + p);
      slope += a * f * Math.cos(f * x + p);
    }
    const d = Math.abs(y - ty) / Math.sqrt(1 + (slope / aspect) ** 2);
    v = Math.max(v, gauss(d, 0.014));
  }
  return v;
};

// --- 002: ruled notebook paper behind the book, with a margin line ---
const ruled: Field = (x, y, aspect) => {
  const pitch = 1 / 24;
  const rule = gauss(((y + pitch / 2) % pitch) - pitch / 2, 0.0035);
  const margin = gauss((x - 0.12) * aspect, 0.004);
  return Math.max(0.45 * rule, 0.7 * margin);
};

// --- 002, printed over the paper: the book from the Syllabuss logo ---
// Placement in poster widths: right of the vertical word, its right page
// running to the edge. Its pages are shaded darker toward the spine.
const BOOK = { src: '/syllabuss-book.png', ratio: 237 / 296, left: 0.2, top: 0.15, width: 0.78 };
let bookImage: HTMLImageElement | undefined;

/** Loads the images fields sample from; posters redraw once it resolves. */
export function loadPatternImages() {
  const image = new Image();
  image.src = BOOK.src;
  return image
    .decode()
    .then(() => void (bookImage = image))
    .catch(() => {});
}

/** Separable box blur, run twice for a softer, almost Gaussian falloff. */
function blur(src: Float32Array, w: number, h: number, r: number) {
  let a = src;
  for (let pass = 0; pass < 2; pass++) {
    const b = new Float32Array(a.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) sum += a[y * w + Math.min(w - 1, Math.max(0, x + k))];
        b[y * w + x] = sum / (2 * r + 1);
      }
    }
    const c = new Float32Array(a.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) sum += b[Math.min(h - 1, Math.max(0, y + k)) * w + x];
        c[y * w + x] = sum / (2 * r + 1);
      }
    }
    a = c;
  }
  return a;
}

const book: Field = (() => {
  let cache: { aspect: number; w: number; h: number; ink: Float32Array; halo: Float32Array } | undefined;
  return (x, y, aspect) => {
    if (!bookImage) return 0;
    if (!cache || cache.aspect !== aspect) {
      const w = 480;
      const h = Math.round(w / aspect);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bookImage, BOOK.left * w, BOOK.top * w, BOOK.width * w, BOOK.width * BOOK.ratio * w);
      const data = ctx.getImageData(0, 0, w, h).data;
      const ink = new Float32Array(w * h);
      for (let i = 0; i < ink.length; i++) ink[i] = data[i * 4 + 3] / 255;
      cache = { aspect, w, h, ink, halo: blur(ink, w, h, 6) };
    }
    const i = Math.floor(x * cache.w);
    const j = Math.floor(y * cache.h);
    if (i < 0 || j < 0 || i >= cache.w || j >= cache.h) return 0;
    const k = j * cache.w + i;

    // Book-local coordinates, for the page shading.
    const u = (x - BOOK.left) / BOOK.width;
    const v = (y / aspect - BOOK.top) / (BOOK.width * BOOK.ratio);
    const onLeftPage = u > 0.12 && u < 0.53 && v > 0.04 && v < 0.92;
    const onRightPage = u >= 0.53 && u < 0.96 && v > 0.04 && v < 0.8;
    const shade = onLeftPage || onRightPage ? 0.08 + 0.32 * Math.exp(-Math.abs(u - 0.53) / 0.09) : 0;

    return Math.max(cache.ink[k], Math.min(0.3, cache.halo[k]), shade);
  };
})();

// --- 003: a ghostly eigenface ---
const eigen: Field = (x, y, aspect) => {
  const X = (x - 0.5) * aspect;
  const Y = y - 0.46;
  const e = (X / 0.25) ** 2 + (Y / 0.33) ** 2;
  const oval = Math.exp(-0.7 * e * e);
  const eyes = gauss(Math.hypot(Math.abs(X) - 0.085, Y + 0.05), 0.05);
  const nose = gauss(X, 0.02) * gauss(Y - 0.02, 0.08);
  const mouth = gauss(X, 0.09) * gauss(Y - 0.13, 0.025);
  return clamp01(oval * (0.55 + 0.25 * Math.cos(X * 14) + 0.3 * nose) - 0.45 * eyes - 0.35 * mouth);
};

// --- 004: Wigner-style contours of a two-mode squeezed state ---
const squeeze: Field = (x, y, aspect) => {
  const X = (x - 0.5) * aspect;
  const Y = y - 0.45;
  const u = (X + Y) / Math.SQRT2;
  const w = (X - Y) / Math.SQRT2;
  const q = (u / 0.34) ** 2 + (w / 0.075) ** 2;
  const q2 = (u / 0.075) ** 2 + (w / 0.34) ** 2;
  return Math.exp(-0.9 * q) * (0.6 + 0.4 * Math.cos(Math.sqrt(q) * 9)) + 0.25 * Math.exp(-1.2 * q2);
};

// --- 005: Finland as dots, sized by a stand-in index ---
// Rough outline in (lon, lat), clockwise from the south-west coast.
const finland: [number, number][] = [
  [22.3, 60.1], [22.9, 59.85], [23.5, 59.95], [25.0, 60.2], [26.5, 60.4], [27.8, 60.55],
  [28.6, 60.8], [29.7, 61.3], [30.9, 62.0], [31.5, 62.9], [30.6, 63.5], [30.0, 63.9],
  [30.5, 64.3], [29.6, 64.9], [29.9, 65.6], [29.5, 66.1], [29.9, 66.8], [29.1, 67.6],
  [29.7, 67.9], [28.6, 68.3], [28.5, 68.9], [28.9, 69.05], [29.3, 69.3], [28.9, 69.7],
  [28.4, 70.0], [27.9, 70.08], [27.0, 69.9], [26.0, 69.65], [25.8, 69.35], [25.2, 69.0],
  [24.9, 68.6], [24.0, 68.75], [23.2, 68.65], [22.4, 68.7], [21.6, 69.2], [21.27, 69.31],
  [20.55, 69.06], [21.3, 68.75], [22.5, 68.44], [23.7, 67.95], [23.6, 67.3], [23.97, 66.78],
  [23.7, 66.2], [24.15, 65.85], [25.0, 65.6], [25.45, 65.0], [24.6, 64.6], [23.8, 64.1],
  [22.5, 63.5], [21.5, 63.2], [21.2, 62.6], [21.4, 62.0], [21.5, 61.5], [21.4, 60.9],
  [21.9, 60.5],
];

function insidePolygon(px: number, py: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const KM_PER_DEG = 111;
const LON_SCALE = 0.44; // cos(64°)
const MAP_TOP = 0.03;
const MAP_HEIGHT = 0.71;
const POSTER_KM = (10.3 * KM_PER_DEG) / MAP_HEIGHT;

const finlandField: Field = (x, y, aspect) => {
  const lat = 70.4 - ((y - MAP_TOP) * POSTER_KM) / KM_PER_DEG;
  const lon = 26 + ((x - 0.5) * POSTER_KM * aspect) / (KM_PER_DEG * LON_SCALE);
  if (!insidePolygon(lon, lat, finland)) return 0;
  const wave = 0.5 + 0.5 * Math.sin(lon * 2.1 + lat * 1.3) * Math.cos(lat * 3.1 - lon * 0.7);
  return 0.3 + 0.4 * wave + 0.25 * ((70 - lat) / 10);
};

// --- 006: the quiz question, one huge kana fading down the poster ---
/** Shared with Gojuon.astro, which highlights it in the grid. */
export const KANA_QUESTION = 'ね';

/** Rasterises one glyph once per aspect ratio and samples its coverage. */
function glyph(char: string, cx: number, cy: number, size: number): Field {
  let cache: { aspect: number; w: number; h: number; alpha: Uint8ClampedArray } | undefined;
  return (x, y, aspect) => {
    if (!cache || cache.aspect !== aspect) {
      const w = 360;
      const h = Math.round(w / aspect);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.font = `400 ${size * h}px 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, cx * w, cy * h);
      cache = { aspect, w, h, alpha: ctx.getImageData(0, 0, w, h).data };
    }
    const i = Math.floor(x * cache.w);
    const j = Math.floor(y * cache.h);
    if (i < 0 || j < 0 || i >= cache.w || j >= cache.h) return 0;
    return cache.alpha[(j * cache.w + i) * 4 + 3] / 255;
  };
}

const question = glyph(KANA_QUESTION, 0.6, 0.38, 0.7);
const kana: Field = (x, y, aspect) => question(x, y, aspect) * (0.6 - 0.35 * y);

export const patterns: Record<Pattern, Field> = {
  glucose,
  ruled,
  book,
  eigen,
  squeeze,
  finland: finlandField,
  kana,
};
