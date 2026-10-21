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

/** Keeps the featured poster's vertical word fitted as the poster resizes. */
export function initPosters() {
  const posters = [...document.querySelectorAll<HTMLElement>('.poster')].filter((p) => p.querySelector('.poster-word'));
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) fitWord(entry.target as HTMLElement);
  });
  posters.forEach((poster) => observer.observe(poster));
  // Word widths depend on the web font, so refit once it has loaded.
  document.fonts.ready.then(() => posters.forEach(fitWord));
}
