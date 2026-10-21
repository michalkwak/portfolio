// The face-recognition plate: a cyclic Jacobi eigendecomposition, the solver
// the project implements from scratch, run on a small symmetric matrix. Each
// rotation zeroes one off-diagonal pair; after a few sweeps only the diagonal
// is left, and it holds the eigenvalues. The frames are pure maths, so the
// page can render the first one at build time.

export const N = 6;
const EIGENVALUES = [9, 5, 3, 1.6, 0.8, 0.3];
const SWEEPS = 3;
const STEP_MS = 90;

export interface Frame {
  a: number[][];
  sweep: number;
  /** The pair this rotation zeroed. */
  pair?: [number, number];
  /** Frobenius norm of the off-diagonal part. */
  off: number;
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A = Qᵀ Λ Q for a fixed random orthonormal Q, so the eigenvalues are known. */
function symmetricMatrix() {
  const rand = mulberry32(6);
  const q: number[][] = [];
  while (q.length < N) {
    let v = Array.from({ length: N }, () => rand() * 2 - 1);
    for (const u of q) {
      const d = u.reduce((sum, x, i) => sum + x * v[i], 0);
      v = v.map((x, i) => x - d * u[i]);
    }
    const norm = Math.hypot(...v);
    if (norm > 1e-6) q.push(v.map((x) => x / norm));
  }
  return Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => EIGENVALUES.reduce((sum, l, k) => sum + q[k][i] * l * q[k][j], 0)),
  );
}

const offNorm = (a: number[][]) => Math.sqrt(a.reduce((s, row, i) => s + row.reduce((t, x, j) => t + (i === j ? 0 : x * x), 0), 0));

function jacobiFrames(): Frame[] {
  const a = symmetricMatrix();
  const frames: Frame[] = [{ a: a.map((row) => [...row]), sweep: 0, off: offNorm(a) }];
  for (let sweep = 1; sweep <= SWEEPS; sweep++) {
    for (let p = 0; p < N - 1; p++) {
      for (let q = p + 1; q < N; q++) {
        if (Math.abs(a[p][q]) > 1e-12) {
          // Rotate in the (p, q) plane by the angle that makes a[p][q] zero.
          const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
          const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          const c = 1 / Math.sqrt(t * t + 1);
          const s = t * c;
          for (let k = 0; k < N; k++) {
            const [kp, kq] = [a[k][p], a[k][q]];
            a[k][p] = c * kp - s * kq;
            a[k][q] = s * kp + c * kq;
          }
          for (let k = 0; k < N; k++) {
            const [pk, qk] = [a[p][k], a[q][k]];
            a[p][k] = c * pk - s * qk;
            a[q][k] = s * pk + c * qk;
          }
        }
        frames.push({ a: a.map((row) => [...row]), sweep, pair: [p, q], off: offNorm(a) });
      }
    }
  }
  return frames;
}

export const FRAMES = jacobiFrames();

const maxOff = Math.max(...FRAMES[0].a.flatMap((row, i) => row.filter((_, j) => j !== i).map(Math.abs)));
const maxDiagonal = Math.max(...EIGENVALUES);

/** How lit a cell is, 0–1: off-diagonals by size, the diagonal always visible. */
export function opacity(frame: Frame, row: number, col: number) {
  const x = Math.abs(frame.a[row][col]);
  return row === col ? 0.2 + 0.8 * Math.min(1, x / maxDiagonal) : 0.85 * Math.min(1, x / maxOff);
}

export function caption(frame: Frame, last: boolean) {
  if (last) return 'DIAGONAL = EIGENVALUES';
  if (!frame.pair) return `SYMMETRIC ${N} × ${N}`;
  return `SWEEP ${frame.sweep} · OFF-DIAGONAL ${frame.off.toFixed(3)}`;
}

/** Runs the sweeps on hover or focus of `trigger` and resets when it leaves.
 * Without hover it plays once on coming into view. */
export function startJacobi(svg: SVGSVGElement, trigger: HTMLElement) {
  const cells = [...svg.querySelectorAll<SVGRectElement>('.cell')];
  const label = svg.querySelector<SVGTextElement>('.jacobi-label');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lastIndex = FRAMES.length - 1;
  let raf = 0;

  const show = (index: number) => {
    const frame = FRAMES[index];
    // The finished matrix has no rotation in progress to outline.
    const [p, q] = index < lastIndex && frame.pair ? frame.pair : [-1, -1];
    cells.forEach((cell, k) => {
      const row = Math.floor(k / N);
      const col = k % N;
      cell.style.fillOpacity = opacity(frame, row, col).toFixed(3);
      cell.classList.toggle('active', (row === p && col === q) || (row === q && col === p));
    });
    if (label) label.textContent = caption(frame, index === lastIndex);
  };

  const play = () => {
    cancelAnimationFrame(raf);
    if (reduce) return show(lastIndex);
    const start = performance.now();
    const tick = (now: number) => {
      // A frame's timestamp can precede `start` slightly, so clamp at 0.
      const index = Math.min(lastIndex, Math.max(0, Math.floor((now - start) / STEP_MS)));
      show(index);
      if (index < lastIndex) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const reset = () => {
    cancelAnimationFrame(raf);
    show(0);
  };

  if (matchMedia('(hover: hover)').matches) {
    trigger.addEventListener('pointerenter', play);
    trigger.addEventListener('pointerleave', reset);
    trigger.addEventListener('focusin', play);
    trigger.addEventListener('focusout', reset);
  } else {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      play();
    }, { threshold: 0.6 });
    observer.observe(trigger);
  }
}
