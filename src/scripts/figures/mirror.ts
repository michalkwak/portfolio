// A study after Alex Grey's Sacred Mirrors: a standing figure in halftone
// inside a slowly radiating aura. The lens peels it in three depths, from
// the outer ring inwards: nerves, a neural network, then circuitry.
import { animate, fitCanvas, palette, type Fitted } from '../canvas';
import { mulberry32, paintHalftone } from '../halftone';

const NERVE = '#e8603c';

// The figure as capsules [ax, ay, bx, by, radius] in a unit square.
const centre: number[][] = [
  [0.5, 0.115, 0.5, 0.125, 0.052], // head
  [0.5, 0.16, 0.5, 0.205, 0.024], // neck
  [0.5, 0.235, 0.5, 0.4, 0.08], // chest
  [0.5, 0.4, 0.5, 0.47, 0.068], // abdomen
  [0.5, 0.48, 0.5, 0.52, 0.078], // hips
];
const leftSide: number[][] = [
  [0.5, 0.235, 0.415, 0.245, 0.04], // shoulder
  [0.405, 0.255, 0.35, 0.4, 0.028], // upper arm
  [0.35, 0.4, 0.33, 0.53, 0.023], // forearm
  [0.328, 0.535, 0.322, 0.585, 0.02], // hand
  [0.46, 0.52, 0.448, 0.72, 0.04], // thigh
  [0.448, 0.72, 0.444, 0.9, 0.03], // shin
  [0.444, 0.905, 0.425, 0.94, 0.02], // foot
];
const capsules = [...centre, ...leftSide, ...leftSide.map(([ax, ay, bx, by, r]) => [1 - ax, ay, 1 - bx, by, r])];

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/** Signed distance to the figure: negative inside. Capsules blend smoothly. */
function body(u: number, v: number) {
  const k = 0.015;
  let d = Infinity;
  for (const [ax, ay, bx, by, r] of capsules) {
    const dc = segmentDistance(u, v, ax, ay, bx, by) - r;
    const h = Math.max(k - Math.abs(d - dc), 0) / k;
    d = Math.min(d, dc) - h * h * k * 0.25;
  }
  return d;
}

/** A white, anti-aliased silhouette at half resolution, used to clip layers. */
function bodyMask(w: number, h: number) {
  const mw = Math.max(1, Math.round(w / 2));
  const mh = Math.max(1, Math.round(h / 2));
  const mask = document.createElement('canvas');
  mask.width = mw;
  mask.height = mh;
  const ctx = mask.getContext('2d')!;
  const img = ctx.createImageData(mw, mh);
  for (let j = 0; j < mh; j++) {
    for (let i = 0; i < mw; i++) {
      const d = body((i + 0.5) / mw, (j + 0.5) / mh);
      const alpha = Math.max(0, Math.min(1, 0.5 - (d * mw) / 1.2));
      const p = (j * mw + i) * 4;
      img.data[p] = img.data[p + 1] = img.data[p + 2] = 255;
      img.data[p + 3] = alpha * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return mask;
}

type Draw = (ctx: CanvasRenderingContext2D, s: number) => void;

/** Draws one depth layer: content clipped to the body, on an opaque ground. */
function paintLayer(canvas: HTMLCanvasElement, mask: HTMLCanvasElement, night: string, draw: Draw) {
  const { ctx, w, h } = fitCanvas(canvas);
  draw(ctx, w);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-over';
  ctx.globalAlpha = 0.07;
  ctx.drawImage(mask, 0, 0, w, h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

/** Branching nerves along the spine and limbs, mirrored left to right. */
const nerves: Draw = (ctx, s) => {
  const rand = mulberry32(7);
  const segments: [number, number, number, number, number][] = [];
  const branch = (x: number, y: number, angle: number, len: number, depth: number) => {
    const ex = x + len * Math.cos(angle);
    const ey = y + len * Math.sin(angle);
    segments.push([x, y, ex, ey, 0.8]);
    if (depth === 0) return;
    branch(ex, ey, angle + 0.45 + rand() * 0.3, len * 0.65, depth - 1);
    branch(ex, ey, angle - 0.45 - rand() * 0.3, len * 0.65, depth - 1);
  };
  const chains = [
    [[0.5, 0.13], [0.5, 0.52]],
    [[0.5, 0.21], [0.41, 0.25], [0.35, 0.4], [0.33, 0.53], [0.325, 0.58]],
    [[0.5, 0.5], [0.458, 0.53], [0.447, 0.72], [0.444, 0.9], [0.43, 0.94]],
  ];
  for (const chain of chains) {
    for (let i = 1; i < chain.length; i++) {
      const [ax, ay] = chain[i - 1];
      const [bx, by] = chain[i];
      segments.push([ax, ay, bx, by, 1.6]);
      const angle = Math.atan2(by - ay, bx - ax);
      const len = Math.hypot(bx - ax, by - ay);
      for (let d = 0.01; d < len; d += 0.018) {
        const side = rand() < 0.5 ? -1 : 1;
        branch(ax + (d / len) * (bx - ax), ay + (d / len) * (by - ay), angle + side * (0.6 + rand() * 0.6), 0.02 + rand() * 0.02, 2);
      }
    }
  }
  for (let i = 0; i < 14; i++) branch(0.5, 0.12, (i / 14) * Math.PI * 2, 0.022, 3);

  ctx.strokeStyle = NERVE;
  ctx.lineCap = 'round';
  for (const [ax, ay, bx, by, width] of segments) {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(ax * s, ay * s);
    ctx.lineTo(bx * s, by * s);
    ctx.moveTo((1 - ax) * s, ay * s);
    ctx.lineTo((1 - bx) * s, by * s);
    ctx.stroke();
  }
};

/** Nodes scattered through the body, each wired to its nearest neighbours. */
const network = (accent: string): Draw => (ctx, s) => {
  const rand = mulberry32(21);
  const nodes: [number, number][] = [];
  while (nodes.length < 110) {
    const u = 0.3 + rand() * 0.4;
    const v = 0.06 + rand() * 0.9;
    if (body(u, v) < -0.008) nodes.push([u, v]);
  }
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  for (const [u, v] of nodes) {
    const nearest = nodes
      .map(([nu, nv]) => [Math.hypot(nu - u, nv - v), nu, nv])
      .sort((a, b) => a[0] - b[0])
      .slice(1, 4);
    for (const [d, nu, nv] of nearest) {
      if (d > 0.09) continue;
      ctx.moveTo(u * s, v * s);
      ctx.lineTo(nu * s, nv * s);
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  nodes.forEach(([u, v], i) => {
    ctx.beginPath();
    ctx.arc(u * s, v * s, i % 9 === 0 ? 3.5 : 2, 0, Math.PI * 2);
    ctx.fill();
  });
};

/** Pads routed along lanes beside the spine to three horizontal rails. */
const circuit = (paper: string): Draw => (ctx, s) => {
  const rand = mulberry32(42);
  const rails = [0.25, 0.5, 0.75];
  ctx.strokeStyle = paper;
  ctx.fillStyle = paper;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const y of rails) {
    ctx.moveTo(0, y * s);
    ctx.lineTo(s, y * s);
  }
  ctx.stroke();

  ctx.lineWidth = 1;
  for (let n = 0; n < 70; ) {
    const u = 0.3 + rand() * 0.4;
    const v = 0.06 + rand() * 0.9;
    if (body(u, v) > -0.006) continue;
    const lane = 0.5 + (u < 0.5 ? -1 : 1) * (0.006 + (n % 6) * 0.007);
    const rail = rails.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
    ctx.beginPath();
    ctx.moveTo(u * s, v * s);
    ctx.lineTo(lane * s, v * s);
    ctx.lineTo(lane * s, rail * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(u * s, v * s, 2.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(lane * s, v * s, 1.6, 0, Math.PI * 2);
    ctx.fill();
    n++;
  }
};

export function startMirror(figure: HTMLElement) {
  const base = figure.querySelector<HTMLCanvasElement>('canvas.base')!;
  const [outer, middle, inner] = figure.querySelectorAll<HTMLCanvasElement>('canvas.xray');
  const { night, paper, accent } = palette();
  let b: Fitted;

  animate(
    figure,
    () => {
      b = fitCanvas(base);
      const mask = bodyMask(b.w, b.h);
      paintLayer(outer, mask, night, nerves);
      paintLayer(middle, mask, night, network(accent));
      paintLayer(inner, mask, night, circuit(paper));
    },
    (t) => {
      const { ctx, w, h } = b;
      ctx.clearRect(0, 0, w, h);
      paintHalftone(
        ctx,
        w,
        h,
        (u, v) => {
          const d = body(u, v);
          if (d < 0) return 0.5 + 0.4 * Math.min(1, -d / 0.035);
          // A thin gap keeps the silhouette crisp against the aura.
          const gap = Math.min(1, Math.max(0, (d - 0.008) / 0.014));
          const aura = gap * Math.exp(-d / 0.07) * (0.1 + 0.16 * (1 + Math.cos(d * 110 - t * 1.4)));
          // A rayed halo around the head.
          const hx = u - 0.5;
          const hy = v - 0.12;
          const rays = 0.5 + 0.5 * Math.cos(Math.atan2(hy, hx) * 24);
          const halo = Math.exp(-((Math.hypot(hx, hy) - 0.085) ** 2) / 0.0012) * rays * 0.7;
          return Math.max(aura, halo);
        },
        { ink: paper, cell: Math.max(6, w / 80), grit: 0.05 },
      );
    },
  );
}
