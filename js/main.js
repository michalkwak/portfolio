/* Page UI: corner content, the Helsinki clock and the section panel.
 * Sections are routed by hash (#about, #experience, #projects), so the back
 * button closes the panel and every section has a shareable link.
 */
(() => {
  "use strict";

  const D = window.PORTFOLIO;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pad = (n) => String(n).padStart(2, "0");

  const body = document.body;
  const stage = $("#stage");
  const panel = $("#panel");
  const scroller = $("#panel-scroll");
  const panelTitle = $("#panel-title");
  const panelIndex = $("#panel-index");
  const panelBody = $("#panel-body");
  const wide = window.matchMedia("(min-width: 900px)");

  const SECTIONS = [
    { id: "about", title: "About", render: renderAbout },
    { id: "experience", title: "Experience", render: () => renderEntries(D.experience) },
    { id: "projects", title: "Projects", render: () => renderEntries(D.projects) },
  ];

  /* ---------- corners ---------- */

  const tab = (s, i) => `
    <li>
      <button class="tab" type="button" data-section="${s.id}" aria-controls="panel" aria-current="false">
        <span class="tab__n">${pad(i + 1)}</span><span class="tab__label">${esc(s.title)}</span>
      </button>
    </li>`;
  $("#tabs").innerHTML = SECTIONS.map(tab).join("");
  $("#panel-tabs").innerHTML = SECTIONS.map(tab).join("");

  const link = (l) => {
    const external = /^https?:/.test(l.url);
    return `<a href="${esc(l.url)}"${external ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)} <span class="arrow" aria-hidden="true">↗</span></a>`;
  };
  $("#links").innerHTML = D.links.map((l) => `<li>${link(l)}</li>`).join("");

  if (D.now) {
    $("#now").innerHTML = `
      <button class="now" type="button" data-section="projects" data-expand="${esc(D.now.project)}">
        <span class="label">Currently</span>
        <span class="now__text">${esc(D.now.text)}</span>
      </button>`;
  }

  $("#city").textContent = D.location.city;
  $("#coords").textContent = D.location.coords;

  // Live Helsinki time.
  const clock = $("#clock");
  const tz = $("#tz");
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: D.location.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "shortOffset",
    });
  } catch {
    fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: D.location.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
  }
  function tick() {
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
    clock.textContent = `${parts.hour}:${parts.minute}:${parts.second}`;
    clock.dateTime = clock.textContent;
    tz.textContent = parts.timeZoneName || "";
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  /* ---------- panel content ---------- */

  function renderAbout() {
    const a = D.about;
    const email = D.links.find((l) => l.url.startsWith("mailto:"));
    let d = 0;
    return `
      <p class="lead reveal" style="--d:${d++}">${esc(a.lead)}</p>
      <div class="prose reveal" style="--d:${d++}">${a.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      <dl class="facts reveal" style="--d:${d++}">
        ${a.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}
      </dl>
      <section class="block reveal" style="--d:${d++}">
        <h3 class="label">Skills</h3>
        <div class="skills">
          ${a.skills
            .map(
              (g) => `
            <div>
              <p class="skills__name">${esc(g.group)}</p>
              <ul class="chips">${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
            </div>`,
            )
            .join("")}
        </div>
      </section>
      <section class="block reveal" style="--d:${d++}">
        <h3 class="label">Coursework</h3>
        <ul class="courses">${a.courses.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      </section>
      ${
        email
          ? `<section class="block reveal" style="--d:${d++}">
              <h3 class="label">Reach out</h3>
              <a class="big-link" href="${esc(email.url)}">${esc(email.url.replace("mailto:", ""))} <span class="arrow" aria-hidden="true">↗</span></a>
            </section>`
          : ""
      }`;
  }

  function renderEntries(list) {
    return `<ol class="entries">${list
      .map(
        (e, i) => `
      <li class="entry reveal" id="${esc(e.id)}" style="--d:${i}">
        <details>
          <summary>
            <span class="entry__n">${pad(i + 1)}</span>
            <span class="entry__head">
              <span class="entry__meta">${esc(e.period)}${e.featured ? '<em class="badge">Current focus</em>' : ""}</span>
              <span class="entry__title">${esc(e.title)}</span>
              <span class="entry__role">${esc(e.role)}</span>
              <span class="entry__summary">${esc(e.summary)}</span>
            </span>
            <span class="entry__toggle" aria-hidden="true"></span>
          </summary>
          <div class="entry__body">
            <ul class="entry__bullets">${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
            ${e.tags && e.tags.length ? `<ul class="chips">${e.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
            ${e.links && e.links.length ? `<p class="entry__links">${e.links.map(link).join("")}</p>` : ""}
          </div>
        </details>
      </li>`,
      )
      .join("")}</ol>`;
  }

  /* ---------- open, switch, close ---------- */

  let current = null;
  let opener = null;
  let swapTimer = 0;

  function fill(section, expand) {
    const i = SECTIONS.indexOf(section);
    panelIndex.textContent = `${pad(i + 1)} / ${pad(SECTIONS.length)}`;
    panelTitle.textContent = section.title;
    panelBody.innerHTML = section.render();
    scroller.scrollTop = 0;
    if (expand) {
      const details = $(`#${CSS.escape(expand)} details`, panelBody);
      if (details) {
        details.open = true;
        setTimeout(() => details.scrollIntoView({ block: "start", behavior: "smooth" }), 450);
      }
    }
  }

  function syncInset() {
    if (!window.Vision) return;
    window.Vision.setInset(current && wide.matches ? panel.getBoundingClientRect().width : 0);
  }

  function show(id, expand) {
    const section = SECTIONS.find((s) => s.id === id);
    if (!section) return;
    const wasOpen = current !== null;
    const switching = wasOpen && current !== id;
    current = id;

    $$("[data-section]").forEach((b) => {
      if (!b.classList.contains("tab")) return;
      b.setAttribute("aria-current", String(b.dataset.section === id));
    });

    clearTimeout(swapTimer);
    if (switching) {
      panel.classList.add("is-swapping");
      swapTimer = setTimeout(() => {
        fill(section, expand);
        panel.classList.remove("is-swapping");
      }, 220);
    } else if (!wasOpen || expand) {
      fill(section, expand);
    }

    if (!wasOpen) {
      opener = document.activeElement;
      body.classList.add("panel-open");
      panel.inert = false;
      panel.setAttribute("aria-hidden", "false");
      stage.inert = true;
      syncInset();
      requestAnimationFrame(() => panelTitle.focus({ preventScroll: true }));
    }
  }

  function hide() {
    if (current === null) return;
    current = null;
    clearTimeout(swapTimer);
    body.classList.remove("panel-open");
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
    stage.inert = false;
    $$(".tab").forEach((b) => b.setAttribute("aria-current", "false"));
    syncInset();
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    opener = null;
  }

  function go(id, expand) {
    const url = `#${id}`;
    if (current) history.replaceState(null, "", url);
    else history.pushState(null, "", url);
    show(id, expand);
  }

  function close() {
    history.replaceState(null, "", location.pathname + location.search);
    hide();
  }

  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (SECTIONS.some((s) => s.id === id)) show(id);
    else hide();
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-section]");
    if (trigger) {
      go(trigger.dataset.section, trigger.dataset.expand);
      return;
    }
    if (e.target.closest("[data-close]")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && current) {
      close();
      return;
    }
    // 1, 2, 3 jump to a section; ignored while typing or with modifiers.
    if (e.metaKey || e.ctrlKey || e.altKey || !(e.target instanceof Element) || e.target.closest("input, textarea, [contenteditable]")) return;
    const n = Number(e.key);
    if (n >= 1 && n <= SECTIONS.length) go(SECTIONS[n - 1].id);
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);
  window.addEventListener("resize", syncInset);
  wide.addEventListener("change", syncInset);

  route();

  console.log("%cSpiral out. Keep going.", "font: italic 20px Georgia, serif; color: #e3bf7a; padding: 6px 0;");
  console.log("1 1 2 3 5 8 13 21 34 55 89 144 233: the counts behind the eye.");
})();
