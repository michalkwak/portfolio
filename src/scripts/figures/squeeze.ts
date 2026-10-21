// The tomography plate: the joint (x1, x2) quadrature distribution of a
// two-mode squeezed state, the toy model of Hawking/Unruh radiation, drawn as
// its 1σ and 2σ contours around the vacuum. As the phase θ sweeps, the
// correlation between the modes flips sign, yet each mode on its own always
// looks thermal. Vacuum variance is 1/2.
import { animate, fitCanvas, type Fitted } from '../canvas';

const SQUEEZING = 0.9; // r
const RANGE = 4.4; // half-width of the plotted phase space
const VAR = Math.cosh(2 * SQUEEZING) / 2; // Var(x1) = Var(x2), always
const COV_MAX = Math.sinh(2 * SQUEEZING) / 2;
// Centre and size of the phase-space box, as fractions of the plate.
const CENTRE_X = 0.5;
const CENTRE_Y = 0.42;
const SIZE = 1.05;

export interface SqueezeColors {
  line: string;
  muted: string;
  xrayGround: string;
  xrayLine: string;
  xrayMuted: string;
}

export function startSqueeze(root: HTMLElement, base: HTMLCanvasElement, xray: HTMLCanvasElement, colors: SqueezeColors) {
  let b: Fitted;
  let x: Fitted;

  const ellipse = (ctx: CanvasRenderingContext2D, cx: number, cy: number, k: number, cov: number, scale: number) => {
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      k * Math.sqrt(VAR + Math.abs(cov)) * scale,
      k * Math.sqrt(VAR - Math.abs(cov)) * scale,
      cov >= 0 ? -Math.PI / 4 : Math.PI / 4,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  };

  const vacuum = (ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) => {
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.sqrt(0.5) * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  animate(
    root,
    () => {
      b = fitCanvas(base);
      x = fitCanvas(xray);
    },
    (t) => {
      const theta = t * 0.25;
      const cov = COV_MAX * Math.cos(2 * theta);
      const { ctx, w, h } = b;
      const scale = (SIZE * Math.min(w, h)) / (2 * RANGE);
      const cx = CENTRE_X * w;
      const cy = CENTRE_Y * h;

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.muted;
      vacuum(ctx, cx, cy, scale);
      ctx.strokeStyle = colors.line;
      ellipse(ctx, cx, cy, 1, cov, scale);
      ctx.globalAlpha = 0.45;
      ellipse(ctx, cx, cy, 2, cov, scale);
      ctx.globalAlpha = 1;

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

    // Quadrature axes, the vacuum, and the state's 1σ contour.
    ctx.strokeStyle = colors.xrayMuted;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();
    vacuum(ctx, cx, cy, scale);
    ctx.strokeStyle = colors.xrayLine;
    ctx.lineWidth = 1.5;
    ellipse(ctx, cx, cy, 1, cov, scale);

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
  }
}
