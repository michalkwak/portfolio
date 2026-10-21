// The tomography poster's art: the joint (x1, x2) quadrature distribution of a
// two-mode squeezed state, the toy model of Hawking/Unruh radiation. As the
// phase θ sweeps, the correlation between the modes flips sign, yet each mode
// on its own always looks thermal. Vacuum variance is 1/2.
import { animate, fitCanvas, type Fitted } from '../canvas';
import { paintHalftone } from '../halftone';

const SQUEEZING = 0.9; // r
const RANGE = 4.4; // half-width of the plotted phase space
const VAR = Math.cosh(2 * SQUEEZING) / 2; // Var(x1) = Var(x2), always
const COV_MAX = Math.sinh(2 * SQUEEZING) / 2;
// Centre and size of the phase-space box, as fractions of the poster.
const CENTRE_X = 0.58;
const CENTRE_Y = 0.4;
const SIZE = 1.05;

export interface SqueezeColors {
  ink: string;
  xrayGround: string;
  xrayLine: string;
  xrayMuted: string;
  xrayPaper: string;
}

export function startSqueeze(root: HTMLElement, base: HTMLCanvasElement, xray: HTMLCanvasElement, colors: SqueezeColors) {
  let b: Fitted;
  let x: Fitted;

  animate(
    root,
    () => {
      b = fitCanvas(base);
      x = fitCanvas(xray);
    },
    (t) => {
      const theta = t * 0.25;
      const cov = COV_MAX * Math.cos(2 * theta);
      const det = VAR * VAR - cov * cov;
      const { ctx, w, h } = b;
      const scale = (SIZE * Math.min(w, h)) / (2 * RANGE);
      const cx = CENTRE_X * w;
      const cy = CENTRE_Y * h;

      ctx.clearRect(0, 0, w, h);
      paintHalftone(
        ctx,
        w,
        h,
        (u, v) => {
          const x1 = (u * w - cx) / scale;
          const x2 = (cy - v * h) / scale;
          return Math.exp(-(VAR * x1 * x1 - 2 * cov * x1 * x2 + VAR * x2 * x2) / det / 2);
        },
        { ink: colors.ink, cell: Math.min(10, Math.max(5, w / 64)), grit: 0.04 },
      );

      // 1σ and 2σ contours. The principal axes sit on the diagonals.
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1;
      for (const k of [1, 2]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, k * Math.sqrt(VAR + Math.abs(cov)) * scale, k * Math.sqrt(VAR - Math.abs(cov)) * scale, cov >= 0 ? -Math.PI / 4 : Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawXray(cov, scale, theta);
    },
  );

  function drawXray(cov: number, scale: number, theta: number) {
    const { ctx, w, h } = x;
    const cx = CENTRE_X * w;
    const cy = CENTRE_Y * h;
    ctx.fillStyle = colors.xrayGround;
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;

    // Quadrature axes and the diagonals the state squeezes along.
    ctx.strokeStyle = colors.xrayMuted;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = colors.xrayLine;
    const reach = Math.max(w, h);
    ctx.beginPath();
    ctx.moveTo(cx - reach, cy + reach);
    ctx.lineTo(cx + reach, cy - reach);
    ctx.moveTo(cx - reach, cy - reach);
    ctx.lineTo(cx + reach, cy + reach);
    ctx.stroke();

    // Vacuum for reference, then the state's 1σ ellipse.
    ctx.strokeStyle = colors.xrayMuted;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.sqrt(0.5) * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = colors.xrayPaper;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.sqrt(VAR + Math.abs(cov)) * scale, Math.sqrt(VAR - Math.abs(cov)) * scale, cov >= 0 ? -Math.PI / 4 : Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();

    const fmt = (v: number) => (v < 0 ? '−' : ' ') + Math.abs(v).toFixed(2);
    const degrees = Math.round(((theta * 180) / Math.PI) % 180);
    ctx.font = `500 11px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = colors.xrayLine;
    const lines = [
      'COVARIANCE V(θ)',
      `[${fmt(VAR)} ${fmt(cov)} ]`,
      `[${fmt(cov)} ${fmt(VAR)} ]`,
      '',
      `r = ${SQUEEZING.toFixed(2)}   θ = ${degrees}°`,
      `Var(x₁ − x₂) = ${(2 * (VAR - cov)).toFixed(2)}`,
      `Var(x₁ + x₂) = ${(2 * (VAR + cov)).toFixed(2)}`,
      'vacuum: 1.00',
      `each mode alone: thermal, Var = ${VAR.toFixed(2)}`,
    ];
    lines.forEach((line, i) => ctx.fillText(line, cx + 16, cy - 90 + i * 17));
    ctx.fillStyle = colors.xrayMuted;
    ctx.fillText('x₁', w - 22, cy - 8);
    ctx.fillText('x₂', cx + 8, 16);
  }
}
