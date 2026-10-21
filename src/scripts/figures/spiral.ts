// 1597 points placed at the golden angle (phyllotaxis), with a slow wave
// running through the dot sizes. Every 21st point traces one spiral arm.
import { animate, fitCanvas, palette, type Fitted } from '../canvas';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // 137.508°
const N = 1597;
const ARM = 21;

export function startSpiral(figure: HTMLElement) {
  const canvas = figure.querySelector<HTMLCanvasElement>('canvas')!;
  const { paper, accent } = palette();
  let c: Fitted;

  animate(figure, () => (c = fitCanvas(canvas)), (t) => {
    const { ctx, w, h } = c;
    const R = Math.min(w, h) * 0.48;
    const base = R * Math.sqrt(Math.PI / N) * 0.46;
    ctx.clearRect(0, 0, w, h);
    for (const [colour, arm] of [[paper, false], [accent, true]] as const) {
      ctx.fillStyle = colour;
      ctx.beginPath();
      for (let i = 1; i <= N; i++) {
        if ((i % ARM === 0) !== arm) continue;
        const f = i / N;
        const r = R * Math.sqrt(f);
        const a = i * GOLDEN_ANGLE + t * 0.03;
        const wave = 0.5 + 0.5 * Math.sin((r / R) * 14 - t * 0.8);
        const s = base * (0.25 + 0.75 * wave) * (1 - 0.35 * f) * (arm ? 1.25 : 1);
        const x = w / 2 + r * Math.cos(a);
        const y = h / 2 + r * Math.sin(a);
        ctx.moveTo(x + s, y);
        ctx.arc(x, y, s, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  });
}
