import { defineConfig } from 'astro/config';

// Served by GitHub Pages from the `portfolio` repository, so under /portfolio/.
// With a custom domain later, drop `base` and set `site` to that domain.
export default defineConfig({
  site: 'https://michalkwak.github.io',
  base: '/portfolio',
});
