// Opens a poster across the page: the poster element itself moves into a
// dialog (morphing there with a view transition where supported), next to its
// details. A split slider compares the surface with the x-ray, so nothing
// needs hovering. A placeholder holds its spot in the grid until it returns.

interface ProjectInfo {
  id: string;
  index: string;
  kind: string;
  year: string;
  title: string;
  blurb: string;
  finding?: string;
  structure: string[];
  tags: string[];
  href: string;
}

const NAME = 'poster-open';

export function initProjectView() {
  const dialog = document.getElementById('project-view');
  const data = document.getElementById('project-data');
  if (!(dialog instanceof HTMLDialogElement) || !data) return;

  const projects: ProjectInfo[] = JSON.parse(data.textContent ?? '[]');
  const posters = [...document.querySelectorAll<HTMLElement>('.poster[data-id]')];
  const slot = dialog.querySelector<HTMLElement>('.pv-slot')!;
  const split = dialog.querySelector<HTMLInputElement>('.pv-split')!;
  const field = (id: string) => dialog.querySelector<HTMLElement>(`#${id}`)!;
  const link = field('pv-link') as HTMLAnchorElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current: HTMLElement | null = null;
  let placeholder: HTMLElement | null = null;

  const transition = (update: () => void) => {
    if (reduce || !document.startViewTransition) {
      update();
      return Promise.resolve();
    }
    return document.startViewTransition(update).finished.catch(() => {});
  };

  const fill = (id: string) => {
    const i = projects.findIndex((p) => p.id === id);
    const p = projects[i];
    field('pv-meta').textContent = `${p.index} / ${p.kind} · ${p.year}`;
    field('pv-title').textContent = p.title;
    field('pv-finding').textContent = p.finding ?? '';
    field('pv-finding').hidden = !p.finding;
    field('pv-blurb').textContent = p.blurb;
    field('pv-steps').replaceChildren(
      ...p.structure.map((step) => Object.assign(document.createElement('li'), { textContent: step })),
    );
    field('pv-tags').replaceChildren(...p.tags.map((tag) => Object.assign(document.createElement('li'), { textContent: tag })));
    const external = p.href.startsWith('http');
    link.hidden = !external;
    if (external) link.href = p.href;
    field('pv-soon').hidden = external;
    field('pv-count').textContent = `${String(i + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
  };

  const setSplit = (value: number) => {
    split.value = String(value);
    current?.style.setProperty('--split', `${value}%`);
  };

  const place = (poster: HTMLElement) => {
    placeholder = document.createElement('div');
    placeholder.className = `${poster.className} poster-ghost`;
    placeholder.setAttribute('aria-hidden', 'true');
    poster.before(placeholder);
    slot.append(poster);
    poster.classList.add('is-open');
    current = poster;
    setSplit(50);
    fill(poster.dataset.id!);
    dialog.scrollTop = 0;
  };

  const restore = () => {
    if (!current || !placeholder) return;
    current.classList.remove('is-open');
    current.style.removeProperty('--split');
    placeholder.replaceWith(current);
    current = placeholder = null;
  };

  const open = (poster: HTMLElement) => {
    poster.style.viewTransitionName = NAME;
    transition(() => {
      place(poster);
      dialog.showModal();
    }).then(() => (poster.style.viewTransitionName = ''));
  };

  const close = () => {
    const poster = current;
    if (!poster) return;
    poster.style.viewTransitionName = NAME;
    transition(() => {
      dialog.close();
      restore();
    }).then(() => {
      poster.style.viewTransitionName = '';
      poster.querySelector<HTMLElement>('.poster-hit')?.focus({ preventScroll: true });
    });
  };

  const step = (delta: number) => {
    if (!current) return;
    const next = posters[(posters.indexOf(current) + delta + posters.length) % posters.length];
    transition(() => {
      restore();
      place(next);
    });
  };

  posters.forEach((poster) => poster.querySelector('.poster-hit')?.addEventListener('click', () => open(poster)));
  dialog.querySelector('.pv-close')?.addEventListener('click', close);
  dialog.querySelectorAll<HTMLElement>('[data-step]').forEach((button) => {
    button.addEventListener('click', () => step(Number(button.dataset.step)));
  });
  split.addEventListener('input', () => setSplit(Number(split.value)));

  // Esc and clicks on the empty area close; arrow keys page between projects.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.target === split) return;
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });
}
