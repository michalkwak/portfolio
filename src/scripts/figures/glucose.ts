// The thesis poster's art: one synthetic CGM trace scrolling through a 6-hour
// window, with the stretch below 70 mg/dL drawn heavier. The x-ray shows the
// slope-extrapolation baseline from the thesis: each reading projected 30
// minutes ahead.
import { animate, fitCanvas, type Fitted } from '../canvas';

const MG_MIN = 40;
const MG_MAX = 260;
const LOW = 70;
// Plot area, as fractions of the poster: clear of its header and caption.
const PLOT_TOP = 0.15;
const PLOT_BOTTOM = 0.63;
const NOW_X = 0.78;
const WINDOW = 72; // 6 h of 5-min readings
const AHEAD = 6; // 30 min
const SECONDS_PER_READING = 0.8;

/** Vertical position of a glucose value, as a fraction of the height. */
const yOf = (mg: number) => PLOT_TOP + (PLOT_BOTTOM - PLOT_TOP) * (1 - (mg - MG_MIN) / (MG_MAX - MG_MIN));

/** Where the 70 mg/dL line sits, in % of the poster height. */
export const LOW_LINE_PERCENT = yOf(LOW) * 100;

export interface GlucoseColors {
  line: string;
  muted: string;
  xrayGround: string;
  xrayLine: string;
  xrayMuted: string;
  xrayPaper: string;
}

/** Synthetic glucose in mg/dL; t counts 5-min readings. */
function glucose(t: number) {
  const g = 140 + 55 * Math.sin(t / 37) + 28 * Math.sin(t / 11.3 + 1.3) + 9 * Math.sin(t / 4.1 + 2.1);
  return Math.min(MG_MAX - 5, Math.max(MG_MIN + 2, g));
}

/** Start where a low has just happened, so the first view shows one. */
function findStart() {
  for (let t0 = 30; t0 < 5000; t0++) {
    let min = Infinity;
    for (let k = t0 - 30; k <= t0 - 15; k++) min = Math.min(min, glucose(k));
    if (min < 62 && glucose(t0) > 100) return t0;
  }
  return 0;
}

/** Dexcom-style trend arrow from the rate of change in mg/dL per minute. */
function trendArrow(rate: number) {
  if (rate > 2) return '↑';
  if (rate > 1) return '↗';
  if (rate < -2) return '↓';
  if (rate < -1) return '↘';
  return '→';
}

export function startGlucose(root: HTMLElement, base: HTMLCanvasElement, xray: HTMLCanvasElement, colors: GlucoseColors) {
  const t0 = findStart();
  let b: Fitted;
  let x: Fitted;

  animate(
    root,
    () => {
      b = fitCanvas(base);
      x = fitCanvas(xray);
    },
    (t) => {
      const { ctx, w, h } = b;
      const now = t0 + t / SECONDS_PER_READING;
      const dx = (w * NOW_X) / WINDOW;
      const X = (k: number) => w * NOW_X - (now - k) * dx;
      const Y = (mg: number) => yOf(mg) * h;
      const y70 = Y(LOW);
      const readings: number[] = [];
      for (let k = Math.ceil(now - WINDOW); k <= now; k++) readings.push(k);

      const tracePath = () => {
        ctx.beginPath();
        ctx.moveTo(X(now - WINDOW), Y(glucose(now - WINDOW)));
        for (const k of readings) ctx.lineTo(X(k), Y(glucose(k)));
        ctx.lineTo(X(now), Y(glucose(now)));
      };

      ctx.clearRect(0, 0, w, h);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = colors.line;
      ctx.fillStyle = colors.line;

      tracePath();
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Below 70: a heavier line over a tinted fill.
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y70, w, h - y70);
      ctx.clip();
      tracePath();
      ctx.lineTo(X(now), y70);
      ctx.lineTo(X(now - WINDOW), y70);
      ctx.closePath();
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
      tracePath();
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();

      for (const k of readings) {
        ctx.beginPath();
        ctx.arc(X(k), Y(glucose(k)), 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // "Now": hairline, head dot and a sensor-style readout.
      const gNow = glucose(now);
      const xNow = X(now);
      const yNow = Y(gNow);
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = colors.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xNow, PLOT_TOP * h);
      ctx.lineTo(xNow, PLOT_BOTTOM * h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(xNow, yNow, 4.5, 0, Math.PI * 2);
      ctx.fill();

      const rate = (gNow - glucose(now - 3)) / 15;
      ctx.font = `400 ${Math.max(22, w * 0.05)}px 'Instrument Serif', serif`;
      ctx.fillText(`${Math.round(gNow)} ${trendArrow(rate)}`, xNow + 14, yNow - 8);
      ctx.font = `500 10px 'IBM Plex Mono', monospace`;
      ctx.fillStyle = colors.muted;
      ctx.fillText('MG/DL', xNow + 15, yNow + 8);

      // Time axis, relative to now.
      ctx.textAlign = 'center';
      for (let hrs = 0; hrs <= 5; hrs++) {
        ctx.fillText(hrs === 0 ? 'NOW' : `−${hrs} H`, xNow - hrs * 12 * dx, (PLOT_BOTTOM + 0.045) * h);
      }
      ctx.textAlign = 'left';

      drawXray(now, X, Y, dx);
    },
  );

  function drawXray(now: number, X: (k: number) => number, Y: (mg: number) => number, dx: number) {
    const { ctx, w, h } = x;
    ctx.fillStyle = colors.xrayGround;
    ctx.fillRect(0, 0, w, h);

    // Faint grid: hours and 50 mg/dL steps.
    ctx.strokeStyle = colors.xrayMuted;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = Math.ceil((now - WINDOW) / 12) * 12; k <= now + AHEAD * 2; k += 12) {
      ctx.moveTo(X(k), PLOT_TOP * h);
      ctx.lineTo(X(k), PLOT_BOTTOM * h);
    }
    for (let mg = 50; mg <= 250; mg += 50) {
      ctx.moveTo(0, Y(mg));
      ctx.lineTo(w, Y(mg));
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = colors.xrayMuted;
    ctx.beginPath();
    ctx.moveTo(X(now - WINDOW), Y(glucose(now - WINDOW)));
    for (let k = Math.ceil(now - WINDOW); k <= now; k++) ctx.lineTo(X(k), Y(glucose(k)));
    ctx.lineTo(X(now), Y(glucose(now)));
    ctx.stroke();

    // Every reading projected 30 min ahead along its 15-min slope; brighter = riskier.
    const stripTop = (PLOT_BOTTOM + 0.07) * h;
    const stripH = 0.035 * h;
    ctx.strokeStyle = colors.xrayLine;
    ctx.fillStyle = colors.xrayLine;
    for (let k = Math.ceil(now - WINDOW); k <= now; k++) {
      const g = glucose(k);
      const projected = g + ((g - glucose(k - 3)) / 3) * AHEAD;
      const risk = 1 / (1 + Math.exp((projected - LOW) / 7));
      ctx.globalAlpha = 0.1 + 0.9 * risk;
      ctx.beginPath();
      ctx.moveTo(X(k), Y(g));
      ctx.lineTo(X(k + AHEAD), Y(projected));
      ctx.stroke();
      ctx.fillRect(X(k) - dx * 0.35, stripTop + stripH * (1 - risk), dx * 0.7, stripH * risk);
    }
    ctx.globalAlpha = 1;

    // The live projection from now.
    const gNow = glucose(now);
    const projected = gNow + ((gNow - glucose(now - 3)) / 3) * AHEAD;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = colors.xrayPaper;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(now), Y(gNow));
    ctx.lineTo(X(now + AHEAD), Y(projected));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `500 10px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = colors.xrayPaper;
    ctx.fillText(`+30 MIN ≈ ${Math.round(projected)}`, X(now + AHEAD) + 8, Y(projected) + 4);
    ctx.fillStyle = colors.xrayLine;
    ctx.fillText('SLOPE EXTRAPOLATION, 30 MIN AHEAD', 16, PLOT_TOP * h - 14);
    ctx.fillText('THE BASELINE THE MODELS HAD TO BEAT', 16, PLOT_TOP * h + 2);
    ctx.fillText('P(LOW)', X(now) + 8, stripTop + stripH - 2);
  }
}
