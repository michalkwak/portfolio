// Placeholder cover art, one field per project. These stand in until the
// Python generator renders covers from each project's real output.
import { mulberry32, type Field } from './halftone';
import type { Pattern } from '../data/projects';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const gauss = (d: number, s: number) => Math.exp(-(d * d) / (s * s));

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

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

// --- 002: a course-prerequisite graph ---
const nodes: [number, number][] = [
  [0.25, 0.12], [0.55, 0.12], [0.8, 0.12],
  [0.18, 0.28], [0.42, 0.28], [0.7, 0.28],
  [0.3, 0.44], [0.6, 0.44], [0.85, 0.44],
  [0.22, 0.6], [0.5, 0.6], [0.75, 0.6],
];
const edges: [number, number][] = [
  [0, 3], [0, 4], [1, 4], [1, 5], [2, 5], [3, 6], [4, 6], [4, 7],
  [5, 8], [6, 9], [7, 10], [7, 9], [8, 10], [8, 11],
];

const graph: Field = (x, y, aspect) => {
  const px = x * aspect;
  let v = 0;
  for (const [a, b] of edges) {
    const [ax, ay] = nodes[a];
    const [bx, by] = nodes[b];
    v = Math.max(v, 0.75 * gauss(segmentDistance(px, y, ax * aspect, ay, bx * aspect, by), 0.01));
  }
  for (const [nx, ny] of nodes) v = Math.max(v, gauss(Math.hypot(px - nx * aspect, y - ny), 0.034));
  return v;
};

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

// --- 006: two koi in rippling water ---
const fish = [
  { x0: 0.62, y0: 0.12, len: 0.5, amp: 0.1, phase: 0, width: 0.075 },
  { x0: 0.36, y0: 0.42, len: 0.4, amp: 0.08, phase: 2.4, width: 0.065 },
];

const koi: Field = (x, y, aspect) => {
  const water = Math.sin(Math.hypot((x - 0.3) * aspect, y - 0.2) * 70) * Math.sin(Math.hypot((x - 0.8) * aspect, y - 0.7) * 55);
  let v = 0.18 + 0.12 * water;
  for (const f of fish) {
    let best = Infinity;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const cx = f.x0 + f.amp * Math.sin(t * Math.PI * 1.6 + f.phase);
      const cy = f.y0 + t * f.len;
      const width = f.width * (1 - t) ** 0.8 * Math.min(1, t * 6 + 0.4);
      if (width <= 0) continue;
      best = Math.min(best, Math.hypot((x - cx) * aspect, y - cy) / width);
    }
    v = Math.max(v, 1.25 - best ** 3);
  }
  return v;
};

export const patterns: Record<Pattern, Field> = {
  glucose,
  graph,
  eigen,
  squeeze,
  finland: finlandField,
  koi,
};
