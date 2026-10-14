/* The Eye: the generative centrepiece of the page.
 *
 * Visionary-art motifs in the spirit of Alex Grey, drawn on one 2D canvas:
 *   - an eye whose iris is a golden-angle (Fibonacci) spiral
 *   - two {7/2} heptagrams whose inner edges just touch the eye's circle
 *   - a flame corona drawn like layered contour lines
 *   - a field of points on the same golden spiral, swept by an outward wave
 * Fibonacci numbers set most counts: 21 flames, 144 iris fibres, 233 iris
 * seeds, 13 collarette lobes. Spiral out.
 *
 * window.Vision.setInset(px) moves the piece left when a panel covers the
 * right side of the screen; window.Vision.pulse() fires the click effect.
 */
(() => {
  "use strict";

  const canvas = document.getElementById("vision");
  const ctx = canvas && canvas.getContext("2d");
  if (!ctx) return;

  const TAU = Math.PI * 2;
  const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°
  const BG = "#060509";
  const GOLD = "227, 191, 122";
  const IVORY = "236, 230, 218";
  const SPECTRUM = ["#7b5cff", "#c94fd0", "#ff7a6b", "#f2c46d", "#4fd1c5", "#5b7cff", "#7b5cff"];
  const RING_TEXT = ((window.PORTFOLIO && window.PORTFOLIO.ringText) || "Spiral out · Keep going · ").toUpperCase();

  // Sizes are fractions of R, the heptagram's radius.
  const EXTENT = 1.78; // outermost element (the text ring) sits inside EXTENT * R
  const EYE_W = 0.56; // half width of the almond
  const LID_UP = 0.25; // upper lid height
  const LID_LOW = 0.2; // lower lid depth
  const IRIS = 0.2;
  const INNER = Math.cos(TAU / 7); // inner heptagon's inradius ≈ 0.623
  const TEXT_R = 1.62;
  const PULSE_LIFE = 3;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
  const smooth = (a, b, v) => {
    const x = clamp((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  };
  const stage = (a, b, v) => 1 - Math.pow(1 - clamp((v - a) / (b - a)), 3);

  // Small seeded PRNG so the iris looks the same on every visit.
  const rng = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const S = {
    w: 0, h: 0, dpr: 1,
    cx: 0, cy: 0, R: 0, baseR: 0,
    inset: 0,
    t: 0, start: null, intro: 0,
    look: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 }, nextSaccade: 0,
    par: { x: 0, y: 0 },
    blink: null, nextBlink: 4,
    dilate: 0, hover: false,
    spin: 0, spinVel: 0,
    pulses: [], sparks: [],
    slowFrames: 0, lowPower: false,
    dirty: true,
  };
  const pointer = { x: 0, y: 0, seen: false, moved: -1e9 };

  let field = new Float32Array(0); // x, y, r, angle per point
  let fieldMax = 0;
  let iris = null;
  let ring = null;

  function conic(g, start) {
    if (!g.createConicGradient) return `rgba(${GOLD}, 1)`;
    const c = g.createConicGradient(start, 0, 0);
    SPECTRUM.forEach((col, i) => c.addColorStop(i / (SPECTRUM.length - 1), col));
    return c;
  }

  /* ---------- layout and cached layers ---------- */

  // With a panel open the piece shrinks a little so it clears the left corners.
  function targetGeometry() {
    const avail = S.w - S.inset;
    const fit = S.inset > 0 ? Math.min(avail * 0.92, S.h * 0.8) : Math.min(avail, S.h);
    return {
      cx: avail / 2,
      cy: S.h / 2,
      R: fit / 2 / EXTENT,
    };
  }

  function layout() {
    S.w = window.innerWidth;
    S.h = window.innerHeight;
    S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(S.w * S.dpr);
    canvas.height = Math.round(S.h * S.dpr);

    S.baseR = Math.min(S.w, S.h) / 2 / EXTENT;
    if (S.R === 0) Object.assign(S, targetGeometry());

    buildField();
    buildIris();
    buildRing();
    S.dirty = true;
  }

  function buildField() {
    fieldMax = Math.hypot(S.w, S.h) * 0.62;
    const spacing = clamp(S.baseR * 0.075, 11, 19);
    const n = Math.min(4200, Math.ceil((fieldMax / spacing) ** 2));
    field = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const a = i * GOLDEN;
      const r = spacing * Math.sqrt(i);
      field[i * 4] = Math.cos(a) * r;
      field[i * 4 + 1] = Math.sin(a) * r;
      field[i * 4 + 2] = r;
      field[i * 4 + 3] = a;
    }
  }

  function buildIris() {
    const ri = S.baseR * IRIS;
    const d = S.dpr;
    const size = Math.ceil(ri * 2 * d) + 4;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const rand = rng(144);
    g.translate(size / 2, size / 2);
    g.scale(d, d);

    g.save();
    g.beginPath();
    g.arc(0, 0, ri, 0, TAU);
    g.clip();

    let rg = g.createRadialGradient(0, 0, 0, 0, 0, ri);
    rg.addColorStop(0, "#1b1026");
    rg.addColorStop(0.55, "#2b1a40");
    rg.addColorStop(1, "#0b0711");
    g.fillStyle = rg;
    g.fillRect(-ri, -ri, ri * 2, ri * 2);

    // Spectrum sheen.
    g.globalCompositeOperation = "screen";
    g.globalAlpha = 0.42;
    g.fillStyle = conic(g, -Math.PI / 2);
    g.fillRect(-ri, -ri, ri * 2, ri * 2);

    // Fibres, gently curved like a real iris.
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = 0.5;
    g.lineWidth = 0.6;
    g.strokeStyle = conic(g, 0.6);
    g.beginPath();
    for (let i = 0; i < 144; i++) {
      const a = (i / 144) * TAU + rand() * 0.02;
      const r1 = ri * (0.3 + rand() * 0.06);
      const r2 = ri * (0.8 + rand() * 0.17);
      const bend = 0.14 + rand() * 0.1;
      const rm = (r1 + r2) / 2;
      g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      g.quadraticCurveTo(
        Math.cos(a + bend * 0.6) * rm, Math.sin(a + bend * 0.6) * rm,
        Math.cos(a + bend) * r2, Math.sin(a + bend) * r2,
      );
    }
    g.stroke();

    // Seeds on the golden spiral: the Lateralus spiral inside the eye.
    g.fillStyle = `rgb(${GOLD})`;
    for (let i = 1; i <= 233; i++) {
      const r = ri * 0.94 * Math.sqrt(i / 233);
      if (r < ri * 0.36) continue;
      const a = i * GOLDEN;
      const s = 0.5 + 0.9 * (r / ri);
      g.globalAlpha = 0.3 + 0.55 * (r / ri);
      g.fillRect(Math.cos(a) * r - s / 2, Math.sin(a) * r - s / 2, s, s);
    }

    // Collarette with 13 lobes.
    g.globalAlpha = 0.55;
    g.lineWidth = 0.7;
    g.strokeStyle = `rgb(${GOLD})`;
    g.beginPath();
    for (let i = 0; i <= 260; i++) {
      const a = (i / 260) * TAU;
      const r = ri * (0.5 + 0.035 * Math.sin(a * 13));
      if (i === 0) g.moveTo(r, 0);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.stroke();

    // Limbal ring: darken towards the edge.
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    rg = g.createRadialGradient(0, 0, ri * 0.74, 0, 0, ri);
    rg.addColorStop(0, "rgba(5, 3, 8, 0)");
    rg.addColorStop(1, "rgba(5, 3, 8, 0.8)");
    g.fillStyle = rg;
    g.fillRect(-ri, -ri, ri * 2, ri * 2);
    g.restore();

    g.beginPath();
    g.arc(0, 0, ri - 0.6, 0, TAU);
    g.strokeStyle = `rgba(${GOLD}, 0.6)`;
    g.lineWidth = 1;
    g.stroke();

    iris = { canvas: c, size: size / d, R: S.baseR };
  }

  function buildRing() {
    const R = S.baseR;
    const rr = R * TEXT_R;
    const d = S.dpr;
    const font = clamp(R * 0.042, 9, 12);
    const size = Math.ceil((rr + font * 2) * 2 * d);
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    g.translate(size / 2, size / 2);
    g.scale(d, d);
    g.font = `500 ${font}px "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    g.fillStyle = `rgba(${IVORY}, 0.55)`;
    g.textAlign = "center";
    g.textBaseline = "middle";

    const advance = font * 0.98; // mono glyph plus tracking
    const reps = Math.max(1, Math.round((TAU * rr) / (RING_TEXT.length * advance)));
    const text = RING_TEXT.repeat(reps);
    const step = TAU / text.length;
    for (let i = 0; i < text.length; i++) {
      g.save();
      g.rotate(i * step);
      g.translate(0, -rr);
      g.fillText(text[i], 0, 0);
      g.restore();
    }
    ring = { canvas: c, size: size / d, R };
  }

  /* ---------- interaction ---------- */

  function onEye(x, y) {
    const dx = (x - S.cx) / (S.R * EYE_W);
    const dy = (y - S.cy) / (S.R * 0.3);
    return dx * dx + dy * dy < 1;
  }

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.seen = true;
    pointer.moved = performance.now() / 1000;
    S.dirty = true;
  }, { passive: true });

  window.addEventListener("pointerdown", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.seen = true;
    pointer.moved = performance.now() / 1000;
  }, { passive: true });

  window.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) pointer.seen = false;
  });

  canvas.addEventListener("click", (e) => {
    if (onEye(e.clientX, e.clientY)) pulse();
  });

  function pulse() {
    S.blink = { t0: performance.now() / 1000 };
    S.dirty = true;
    if (reduced.matches) return;
    S.pulses.push(S.t);
    S.spinVel += 1.4;
    S.dilate = Math.min(1.6, S.dilate + 0.8);
  }

  let resizeQueued = false;
  window.addEventListener("resize", () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      layout();
    });
  });

  if (document.fonts && document.fonts.load) {
    document.fonts.load('500 11px "Geist Mono"').then(() => {
      buildRing();
      S.dirty = true;
    }, () => {});
  }

  reduced.addEventListener("change", () => (S.dirty = true));

  /* ---------- update ---------- */

  function update(dt, now) {
    const still = reduced.matches;
    if (!still) S.t += dt;
    if (S.start === null) S.start = now;
    S.intro = still ? 1 : clamp((now - S.start) / 2.8);

    // Centre and size follow the panel inset.
    const g = targetGeometry();
    const k = damp(5, dt);
    const moving = Math.abs(S.cx - g.cx) + Math.abs(S.R - g.R) > 0.3;
    S.cx = lerp(S.cx, g.cx, still ? 1 : k);
    S.cy = lerp(S.cy, g.cy, still ? 1 : k);
    S.R = lerp(S.R, g.R, still ? 1 : k);

    // Where the eye looks.
    const lt = S.lookTarget;
    if (S.inset > 0) {
      lt.x = 0.85; // glance at the open panel
      lt.y = 0.05;
    } else if (pointer.seen && now - pointer.moved < 4) {
      lt.x = clamp((pointer.x - S.cx) / (S.R * 2.2), -1, 1);
      lt.y = clamp((pointer.y - S.cy) / (S.R * 1.6), -1, 1);
    } else if (still) {
      lt.x = lt.y = 0;
    } else if (now > S.nextSaccade) {
      lt.x = (Math.random() * 2 - 1) * 0.7;
      lt.y = (Math.random() * 2 - 1) * 0.5;
      S.nextSaccade = now + 1.4 + Math.random() * 2.8;
    }
    const lk = damp(still ? 30 : 11, dt);
    S.look.x = lerp(S.look.x, lt.x, lk);
    S.look.y = lerp(S.look.y, lt.y, lk);
    const looking = Math.abs(S.look.x - lt.x) + Math.abs(S.look.y - lt.y) > 0.002;

    // Parallax.
    const px = pointer.seen && !still ? (pointer.x - S.w / 2) / (S.w / 2) : 0;
    const py = pointer.seen && !still ? (pointer.y - S.h / 2) / (S.h / 2) : 0;
    S.par.x = lerp(S.par.x, px, damp(2.5, dt));
    S.par.y = lerp(S.par.y, py, damp(2.5, dt));

    // Hover over the eye.
    //const hover = pointer.seen && S.inset === 0 && onEye(pointer.x, pointer.y);
    const hover = pointer.seen && S.inset === 0 && onEye(pointer.x, pointer.y);
    if (hover !== S.hover) {
      S.hover = hover;
      canvas.style.cursor = hover ? "pointer" : "";
    }
    const dilateTarget = hover ? 1 : S.inset > 0 ? 0.45 : 0;
    S.dilate = lerp(S.dilate, dilateTarget, damp(still ? 30 : 4, dt));

    // Blinking: fast close, slower open, now and then a double blink.
    if (!S.blink && !still && S.intro >= 1 && now > S.nextBlink) S.blink = { t0: now };
    if (S.blink && now - S.blink.t0 > 0.32) {
      S.blink = null;
      S.nextBlink = now + (Math.random() < 0.18 ? 0.25 : 2.5 + Math.random() * 6);
    }

    S.spin += S.spinVel * dt;
    S.spinVel *= Math.exp(-dt * 1.3);
    S.pulses = S.pulses.filter((p) => S.t - p < PULSE_LIFE);

    updateSparks(dt);

    // Drop the glow pass and half the field if frames are slow.
    if (!still && dt > 1 / 40 && dt < 0.2) S.slowFrames++;
    else S.slowFrames = Math.max(0, S.slowFrames - 1);
    if (S.slowFrames > 90) S.lowPower = true;

    if (moving || looking || S.blink) S.dirty = true;
  }

  function updateSparks(dt) {
    const R = S.R;
    if (!reduced.matches && S.intro > 0.6 && S.sparks.length < (S.lowPower ? 30 : 70)) {
      if (Math.random() < dt * 14) {
        const a = Math.random() * TAU;
        S.sparks.push({
          a,
          r: R * (1.18 + Math.random() * 0.25),
          vr: R * (0.08 + Math.random() * 0.18),
          va: (Math.random() < 0.5 ? -1 : 1) * (0.03 + Math.random() * 0.08),
          age: 0,
          life: 2 + Math.random() * 2.5,
          size: 0.8 + Math.random() * 1.1,
          color: SPECTRUM[Math.floor(((a / TAU) % 1) * (SPECTRUM.length - 1))],
        });
      }
    }
    for (const p of S.sparks) {
      p.age += dt;
      p.r += p.vr * dt;
      p.a += p.va * dt;
    }
    S.sparks = S.sparks.filter((p) => p.age < p.life);
  }

  /* ---------- drawing ---------- */

  function draw(now) {
    const { cx, cy, R } = S;
    const intro = S.intro;
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, S.w, S.h);

    drawAura(cx + S.par.x * 6, cy + S.par.y * 6, R, intro);
    drawField(cx - S.par.x * 16, cy - S.par.y * 16, R, intro);

    ctx.save();
    ctx.translate(cx - S.par.x * 9, cy - S.par.y * 9);
    drawPulses(R);
    drawRing(R, stage(0.6, 1, intro));
    ctx.restore();

    ctx.save();
    ctx.translate(cx - S.par.x * 6, cy - S.par.y * 6);
    drawFlames(R, intro);
    drawSparks();
    ctx.restore();

    ctx.save();
    ctx.translate(cx - S.par.x * 3, cy - S.par.y * 3);
    drawGeometry(R, intro);
    ctx.restore();

    ctx.save();
    ctx.translate(cx - S.par.x * 1.5, cy - S.par.y * 1.5);
    drawEye(R, intro, now);
    ctx.restore();
  }

  function drawAura(x, y, R, intro) {
    const a = stage(0, 0.6, intro);
    let g = ctx.createRadialGradient(x, y, 0, x, y, R * 2.6);
    g.addColorStop(0, `rgba(112, 70, 176, ${0.17 * a})`);
    g.addColorStop(0.4, `rgba(74, 38, 120, ${0.07 * a})`);
    g.addColorStop(1, "rgba(6, 5, 9, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S.w, S.h);

    g = ctx.createRadialGradient(x, y, 0, x, y, R * 0.9);
    g.addColorStop(0, `rgba(227, 168, 96, ${0.08 * a})`);
    g.addColorStop(1, "rgba(227, 168, 96, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - R, y - R, R * 2, R * 2);
  }

  function drawField(x, y, R, intro) {
    const fade = stage(0.45, 1, intro);
    if (fade <= 0) return;
    const inner = R * 1.74;
    const full = R * 2.6;
    const k = TAU / (R * 1.25); // wavelength of the sweeping spiral
    const t = S.t;
    const pulses = S.pulses.map((p) => ({ r: (t - p) * R * 1.8, k: 1 - (t - p) / PULSE_LIFE }));
    const step = S.lowPower ? 2 : 1;
    const n = field.length / 4;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.01);
    ctx.fillStyle = `rgb(${IVORY})`;
    for (let i = 0; i < n; i += step) {
      const r = field[i * 4 + 2];
      if (r < inner) continue;
      const w = 0.5 + 0.5 * Math.sin(r * k - t * 0.9 + 2 * field[i * 4 + 3]);
      let v = 0.06 + 0.38 * w * w * w;
      for (const p of pulses) {
        const q = (r - p.r) / (R * 0.22);
        v += 0.7 * p.k * Math.exp(-q * q);
      }
      const a = v * fade * smooth(inner, full, r) * (1 - smooth(fieldMax * 0.6, fieldMax, r));
      if (a < 0.008) continue;
      ctx.globalAlpha = Math.min(1, a);
      const s = 1 + w * 0.8;
      ctx.fillRect(field[i * 4] - s / 2, field[i * 4 + 1] - s / 2, s, s);
    }
    ctx.restore();
  }

  function drawPulses(R) {
    ctx.lineWidth = 1;
    for (const p of S.pulses) {
      const age = (S.t - p) / PULSE_LIFE;
      ctx.globalAlpha = 0.4 * (1 - age);
      ctx.strokeStyle = `rgb(${GOLD})`;
      ctx.beginPath();
      ctx.arc(0, 0, (S.t - p) * R * 1.8, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawRing(R, a) {
    if (!ring || a <= 0) return;
    const s = ring.size * (R / ring.R);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.rotate(-S.t * 0.018 - S.spin * 0.2);
    ctx.drawImage(ring.canvas, -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  // One contour of the corona: 21 tongues that all lean the same way, so the
  // fire seems to turn. Layers share their bases and nest like contour lines.
  function flamePath(L, R, amp) {
    const n = 21;
    const seg = S.lowPower ? 14 : 24;
    const t = S.t;
    const r0 = R * 1.1;
    const A = R * (0.11 + L * 0.07) * amp;
    ctx.beginPath();
    for (let f = 0; f < n; f++) {
      const h = 0.62 + 0.22 * Math.sin(t * 0.8 + f * 2.39) + 0.1 * Math.sin(t * 1.9 + f * 1.37 + L * 1.7);
      const lean = 0.075 + 0.045 * Math.sin(t * 0.6 + f * 1.1 + L * 0.35);
      for (let j = 0; j < seg; j++) {
        const u = j / seg - 0.5;
        const g = Math.pow(1 - Math.abs(2 * u), 1.45);
        const ripple = 0.018 * Math.sin(g * 5.5 - t * 2.6 + f * 0.7 + L * 0.9) * g;
        const a = ((f + 0.5 + u) / n) * TAU + S.spin * 0.3 + lean * g * g + ripple;
        const r = r0 + A * h * g;
        if (f === 0 && j === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
    }
    ctx.closePath();
  }

  function drawFlames(R, intro) {
    const grow = stage(0.35, 0.85, intro);
    if (grow <= 0) return;
    let amp = grow;
    for (const p of S.pulses) {
      const q = ((S.t - p) * 1.8 - 1.25) / 0.35;
      amp *= 1 + 0.35 * Math.exp(-q * q);
    }
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = conic(ctx, S.t * 0.12);
    for (let L = 0; L < 4; L++) {
      flamePath(L, R, amp);
      if (!S.lowPower) {
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.05 * grow;
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.globalAlpha = (0.6 - L * 0.11) * grow;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  function drawSparks() {
    ctx.globalCompositeOperation = "lighter";
    for (const p of S.sparks) {
      ctx.globalAlpha = Math.sin(Math.PI * (p.age / p.life)) * 0.85;
      ctx.fillStyle = p.color;
      const x = Math.cos(p.a) * p.r;
      const y = Math.sin(p.a) * p.r;
      ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  function circle(r, p, start = -Math.PI / 2) {
    ctx.beginPath();
    ctx.arc(0, 0, r, start, start + TAU * p);
  }

  function star(r, rot, step) {
    ctx.beginPath();
    for (let k = 0; k <= 7; k++) {
      const a = rot + (((k * step) % 7) / 7) * TAU;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawGeometry(R, intro) {
    const t = S.t;
    const pRing = stage(0, 0.4, intro);
    const pStar = stage(0.1, 0.6, intro);
    const pTicks = stage(0.25, 0.6, intro);
    const rotA = -Math.PI / 2 + t * 0.02 + S.spin;
    const rotB = -Math.PI / 2 + Math.PI / 7 - t * 0.013 - S.spin * 0.5;
    const rotT = t * 0.02 + S.spin;

    ctx.lineWidth = 1;

    // Circles: heptagram's circumcircle, tick ring, and the eye's circle.
    ctx.strokeStyle = `rgba(${GOLD}, 0.42)`;
    circle(R, pRing);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${GOLD}, 0.16)`;
    circle(R * 1.04, pRing, Math.PI / 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${IVORY}, 0.14)`;
    circle(R * INNER, pRing, Math.PI);
    ctx.stroke();

    // Ticks: 168 = 7 × 24, a long one at every heptagram point.
    const ticks = 168;
    const shown = Math.floor(ticks * pTicks);
    const r1 = R * 1.04;
    ctx.strokeStyle = `rgba(${GOLD}, 0.3)`;
    ctx.beginPath();
    for (let i = 0; i < shown; i++) {
      if (i % 24 === 0) continue;
      const a = (i / ticks) * TAU + rotT;
      const len = R * (i % 6 === 0 ? 0.028 : 0.013);
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * (r1 + len), Math.sin(a) * (r1 + len));
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(${GOLD}, 0.75)`;
    ctx.beginPath();
    for (let i = 0; i < shown; i += 24) {
      const a = (i / ticks) * TAU + rotT;
      ctx.moveTo(Math.cos(a) * (r1 - R * 0.015), Math.sin(a) * (r1 - R * 0.015));
      ctx.lineTo(Math.cos(a) * (r1 + R * 0.06), Math.sin(a) * (r1 + R * 0.06));
    }
    ctx.stroke();

    if (pStar <= 0) return;
    const perimeter = 14 * R * Math.sin(TAU / 7);

    // Faint outer heptagon and the counter-rotating second star.
    ctx.setLineDash([perimeter * pStar, perimeter]);
    ctx.strokeStyle = `rgba(${GOLD}, 0.14)`;
    star(R, rotA, 1);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${IVORY}, 0.2)`;
    star(R, rotB, 2);
    ctx.stroke();

    // Main {7/2} star with a soft glow.
    star(R, rotA, 2);
    if (!S.lowPower) {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = `rgba(${GOLD}, 0.07)`;
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${GOLD}, 0.78)`;
    ctx.stroke();
    ctx.setLineDash([]);

    // Nodes at the seven points.
    const nr = R * 0.03;
    for (let k = 0; k < 7; k++) {
      const a = rotA + (k / 7) * TAU;
      const x = Math.cos(a) * R;
      const y = Math.sin(a) * R;
      ctx.globalAlpha = pStar;
      ctx.fillStyle = BG;
      ctx.beginPath();
      ctx.arc(x, y, nr, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(${GOLD}, 0.8)`;
      ctx.stroke();
      ctx.fillStyle = `rgb(${GOLD})`;
      ctx.beginPath();
      ctx.arc(x, y, nr * 0.32, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function almond(a, up, low) {
    ctx.beginPath();
    ctx.moveTo(-a, 0);
    ctx.bezierCurveTo(-a * 0.45, up / 0.75, a * 0.45, up / 0.75, a, 0);
    ctx.bezierCurveTo(a * 0.45, low / 0.75, -a * 0.45, low / 0.75, -a, 0);
    ctx.closePath();
  }

  function drawEye(R, intro, now) {
    let closure = 0;
    if (S.blink) {
      const b = clamp((now - S.blink.t0) / 0.32);
      closure = b < 0.35 ? b / 0.35 : 1 - (b - 0.35) / 0.65;
    }
    const open = stage(0.55, 0.85, intro) * (1 - closure);
    const show = stage(0.4, 0.6, intro);
    if (show <= 0) return;

    const a = R * EYE_W;
    const low = R * LID_LOW;
    const up = lerp(low * 0.92, -R * LID_UP, open); // the upper lid falls onto the lower one
    const ri = R * IRIS;

    ctx.globalAlpha = show;

    // Horizon lines from the corners to the eye's circle.
    ctx.strokeStyle = `rgba(${GOLD}, 0.32)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-R * INNER, 0);
    ctx.lineTo(-a - R * 0.025, 0);
    ctx.moveTo(a + R * 0.025, 0);
    ctx.lineTo(R * INNER, 0);
    ctx.stroke();

    // Crease above and contour below.
    ctx.strokeStyle = `rgba(${GOLD}, 0.26)`;
    ctx.beginPath();
    const creaseY = lerp(low * 0.4, -R * 0.33, open);
    ctx.moveTo(-a * 0.86, -R * 0.03);
    ctx.bezierCurveTo(-a * 0.4, creaseY / 0.75, a * 0.4, creaseY / 0.75, a * 0.86, -R * 0.03);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${GOLD}, 0.14)`;
    ctx.beginPath();
    ctx.moveTo(-a * 0.8, R * 0.03);
    ctx.bezierCurveTo(-a * 0.4, (R * 0.27) / 0.75, a * 0.4, (R * 0.27) / 0.75, a * 0.8, R * 0.03);
    ctx.stroke();

    // Sclera: dark, so it hides whatever is behind it.
    almond(a, up, low);
    ctx.fillStyle = "#08060c";
    ctx.fill();

    if (open > 0.02 && iris) {
      ctx.save();
      almond(a, up, low);
      ctx.clip();

      const ix = S.look.x * (a - ri) * 0.72;
      const iy = S.look.y * R * 0.07;

      ctx.save();
      ctx.translate(ix, iy);
      ctx.rotate(S.t * 0.04);
      const s = iris.size * (R / iris.R);
      ctx.drawImage(iris.canvas, -s / 2, -s / 2, s, s);
      ctx.restore();

      const rp = R * (0.066 + 0.03 * S.dilate);
      ctx.fillStyle = "#030206";
      ctx.beginPath();
      ctx.arc(ix, iy, rp, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(${GOLD}, 0.5)`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(ix, iy, rp + 0.8, 0, TAU);
      ctx.stroke();

      // The heptagram again, reflected in the pupil.
      ctx.save();
      ctx.translate(ix, iy);
      ctx.strokeStyle = `rgba(${GOLD}, 0.22)`;
      ctx.lineWidth = 0.6;
      star(rp * 0.62, -Math.PI / 2 + S.t * 0.02 + S.spin, 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "rgba(255, 249, 238, 0.88)";
      ctx.beginPath();
      ctx.arc(ix - rp * 0.4, iy - rp * 0.45, Math.max(1.2, rp * 0.18), 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 249, 238, 0.4)";
      ctx.beginPath();
      ctx.arc(ix + rp * 0.36, iy + rp * 0.4, Math.max(0.6, rp * 0.07), 0, TAU);
      ctx.fill();

      // Lid shadow so the iris sits under the lid.
      const sh = ctx.createLinearGradient(0, up, 0, up + R * 0.12);
      sh.addColorStop(0, "rgba(4, 3, 7, 0.75)");
      sh.addColorStop(1, "rgba(4, 3, 7, 0)");
      ctx.fillStyle = sh;
      ctx.fillRect(-a, up - 2, a * 2, R * 0.14);
      ctx.restore();
    }

    // Lids.
    almond(a, up, low);
    if (!S.lowPower) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = `rgba(${GOLD}, 0.09)`;
      ctx.stroke();
    }
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = `rgba(${GOLD}, 0.92)`;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* ---------- loop ---------- */

  let last = performance.now() / 1000;
  function frame(ms) {
    requestAnimationFrame(frame);
    const now = ms / 1000;
    const dt = clamp(now - last, 0, 0.1);
    last = now;
    update(dt, now);
    if (reduced.matches && !S.dirty) return;
    S.dirty = false;
    draw(now);
  }

  window.Vision = {
    setInset(px) {
      S.inset = Math.max(0, px || 0);
      S.dirty = true;
    },
    pulse,
    isOverEye: () => S.hover,
  };

  layout();
  requestAnimationFrame(frame);
})();
