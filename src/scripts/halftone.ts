import { fitCanvas } from './canvas';

/** Ink coverage in [0, 1] at (x, y), both in [0, 1]; aspect = width / height. */
export type Field = (x: number, y: number, aspect: number) => number;

export function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface HalftoneOptions {
  ink: string;
  /** Distance between dot centres, in CSS px. */
  cell: number;
  seed?: number;
  /** Random jitter added to coverage, for a printed look. */
  grit?: number;
}

/** Paints a field as a hexagonal halftone screen, one path for all dots. */
export function paintHalftone(ctx: CanvasRenderingContext2D, w: number, h: number, field: Field, opts: HalftoneOptions) {
  const rand = mulberry32(opts.seed ?? 1);
  const grit = opts.grit ?? 0.08;
  const cell = opts.cell;
  const rowH = (cell * Math.sqrt(3)) / 2;
  const aspect = w / h;

  ctx.fillStyle = opts.ink;
  ctx.beginPath();
  for (let row = 0, y = rowH / 2; y < h + rowH; row++, y += rowH) {
    for (let x = row % 2 ? cell / 2 : 0; x < w + cell; x += cell) {
      const v = field(x / w, y / h, aspect) + (rand() - 0.5) * grit;
      if (v <= 0.02) continue;
      const r = Math.sqrt(Math.min(1, v)) * cell * 0.56;
      if (r < 0.4) continue;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

/** Sizes the canvas to its box, then paints the field once. Returns the
 * context so further layers can be printed on top. */
export function drawHalftone(canvas: HTMLCanvasElement, field: Field, opts: HalftoneOptions) {
  const fitted = fitCanvas(canvas);
  if (!fitted.w || !fitted.h) return;
  paintHalftone(fitted.ctx, fitted.w, fitted.h, field, opts);
  return fitted;
}
