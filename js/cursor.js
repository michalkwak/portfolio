/* Custom cursor: a dot that tracks the pointer exactly and a heptagram that
 * trails it, slowly turning. Over anything clickable the star opens up and
 * spins faster; over the centrepiece's eye it becomes an eye itself. It
 * tightens while pressed. Only for mice and trackpads.
 */
(() => {
  "use strict";

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!fine.matches) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const TAU = Math.PI * 2;
  const INTERACTIVE = "a, button, summary, [data-section], [data-close], [data-copy]";

  // {7/2} heptagram, radius 30 in a 100 × 100 box.
  const star = Array.from({ length: 7 }, (_, k) => {
    const a = -Math.PI / 2 + (((k * 2) % 7) / 7) * TAU;
    return `${(30 * Math.cos(a)).toFixed(2)} ${(30 * Math.sin(a)).toFixed(2)}`;
  });

  const root = document.createElement("div");
  root.className = "cursor is-hidden";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <svg class="cursor__ring" viewBox="-50 -50 100 100">
      <circle class="cursor__circle" r="44"></circle>
      <path class="cursor__star" d="M${star.join(" L")} Z"></path>
      <g class="cursor__eye">
        <path d="M-34 0 C-16 -19 16 -19 34 0 C16 19 -16 19 -34 0 Z"></path>
        <circle class="cursor__pupil" r="7"></circle>
      </g>
    </svg>
    <span class="cursor__dot"></span>`;
  document.body.append(root);

  const ring = root.querySelector(".cursor__ring");
  const starEl = root.querySelector(".cursor__star");
  const dot = root.querySelector(".cursor__dot");

  const pos = { x: -100, y: -100 };
  const lag = { x: -100, y: -100 };
  let angle = 0;
  let speed = 0.4;
  let scale = 1;
  let target = null;
  let down = false;
  let active = false;
  let last = performance.now();

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    pos.x = e.clientX;
    pos.y = e.clientY;
    target = e.target;
    if (!active) {
      active = true;
      lag.x = pos.x;
      lag.y = pos.y;
      document.documentElement.classList.add("has-cursor");
    }
    root.classList.remove("is-hidden");
  }, { passive: true });

  window.addEventListener("pointerdown", () => (down = true));
  window.addEventListener("pointerup", () => (down = false));
  window.addEventListener("blur", () => (down = false));
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) root.classList.add("is-hidden");
  });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!active) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    const overEye = target && target.id === "vision" && window.Vision && window.Vision.isOverEye();
    const overLink = !overEye && target instanceof Element && target.closest(INTERACTIVE);
    root.classList.toggle("is-link", !!overLink);
    root.classList.toggle("is-eye", !!overEye);

    const still = reduced.matches;
    const follow = still ? 1 : 1 - Math.exp(-dt * 20);
    lag.x += (pos.x - lag.x) * follow;
    lag.y += (pos.y - lag.y) * follow;

    const goalScale = (overEye ? 1.7 : overLink ? 1.55 : 1) * (down ? 0.78 : 1);
    scale += (goalScale - scale) * (still ? 1 : 1 - Math.exp(-dt * 14));
    speed += ((overLink ? 1.8 : 0.4) - speed) * (1 - Math.exp(-dt * 6));
    if (!still) angle += speed * dt;

    ring.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0) translate(-50%, -50%) scale(${scale})`;
    starEl.style.transform = `rotate(${angle}rad)`;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
  }
  requestAnimationFrame(frame);
})();
