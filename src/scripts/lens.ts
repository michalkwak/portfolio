// The x-ray lens: any [data-lens] element reveals its .xray layer inside a
// circle that follows the pointer. CSS does the masking from --x, --y and --r.

export function initLenses() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll<HTMLElement>('[data-lens]').forEach((el) => {
    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--y', `${e.clientY - rect.top}px`);
    };
    el.addEventListener('pointerenter', (e) => {
      move(e);
      el.classList.add('lens-on');
    });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', () => el.classList.remove('lens-on'));
  });
}
