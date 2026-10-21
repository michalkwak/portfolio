import { drawHalftone } from './halftone';
import { patterns } from './patterns';
import type { Pattern } from '../data/projects';

/** Sizes the vertical word to run from below the header to the caption band. */
function fitWord(poster: HTMLElement) {
  const word = poster.querySelector<HTMLElement>('.poster-word');
  const bottom = poster.querySelector<HTMLElement>('.poster-bottom');
  if (!word || !bottom) return;
  const maxSize = poster.clientWidth * 0.3;
  word.style.fontSize = `${maxSize}px`;
  // The top of the caption band is a transparent fade, so the word may reach into it.
  const room = bottom.offsetTop + bottom.offsetHeight * 0.15 - word.offsetTop;
  word.style.fontSize = `${Math.min(maxSize, (maxSize * room) / word.offsetHeight)}px`;
}

/** Draws every static poster cover and redraws it when its size changes. Live
 * posters draw themselves (src/scripts/figures/); only their word is fitted here. */
export function initPosters() {
  const posters = document.querySelectorAll<HTMLElement>('.poster');
  const lastWidth = new WeakMap<HTMLElement, number>();

  const render = (poster: HTMLElement) => {
    const width = poster.clientWidth;
    if (lastWidth.get(poster) === width) return;
    lastWidth.set(poster, width);
    fitWord(poster);
    const canvas = poster.querySelector<HTMLCanvasElement>('canvas[data-pattern]');
    if (!canvas) return;
    drawHalftone(canvas, patterns[canvas.dataset.pattern as Pattern], {
      ink: canvas.dataset.ink ?? '#000',
      cell: Math.min(10, Math.max(5, width / 64)),
      seed: canvas.dataset.pattern!.length,
    });
  };

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) render(entry.target as HTMLElement);
  });
  posters.forEach((poster) => observer.observe(poster));
  // Word widths depend on the web font, so refit once it has loaded.
  document.fonts.ready.then(() => posters.forEach(fitWord));
}
