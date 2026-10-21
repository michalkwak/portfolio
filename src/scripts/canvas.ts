export interface Fitted {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}

/** Matches the canvas buffer to its CSS size and device pixel ratio. */
export function fitCanvas(canvas: HTMLCanvasElement): Fitted {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/** The page colours, read from the CSS tokens. */
export function palette() {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    night: token('--night', '#0e0d0c'),
    paper: token('--paper', '#e9e2d3'),
    muted: token('--muted', '#8d867b'),
    accent: token('--accent', '#a597dd'),
  };
}

/**
 * Calls `frame(seconds)` every animation frame while `el` is on screen. With
 * reduced motion it only draws once per resize. `resize` runs before redraws
 * caused by a size change.
 */
export function animate(el: HTMLElement, resize: () => void, frame: (t: number) => void) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let running = false;

  const loop = (ms: number) => {
    if (!running) return;
    frame(ms / 1000);
    requestAnimationFrame(loop);
  };

  new ResizeObserver(() => {
    resize();
    frame(performance.now() / 1000);
  }).observe(el);

  if (still) return;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) requestAnimationFrame(loop);
    running = entry.isIntersecting;
  }).observe(el);
}
