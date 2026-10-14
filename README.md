# Michał Kwak · Portfolio

A minimal portfolio built around a single piece of generative visionary art, inspired by Alex Grey and Tool.

- **The Eye:** a canvas drawing in the middle of the page. An eye whose iris is a golden-angle (Fibonacci) spiral, two counter-rotating {7/2} heptagrams, a turning flame corona and a field of points on the same spiral, swept by an outward wave. The eye follows the cursor, blinks, and glances at whatever panel you open. Click it to send a pulse through the field.
- **Corners:** name (top left), sections (top right), what I'm working on now plus live Helsinki time (bottom left), links (bottom right).
- **Panels:** About, Experience and Projects slide in from the right. Each has its own URL (`#about`, `#experience`, `#projects`). Keys `1` `2` `3` open them and `Esc` closes.
- Respects `prefers-reduced-motion`: the art renders as a still frame and the eye only moves when you do.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run locally

Open `index.html` directly, or serve the folder:

```
python -m http.server
```

## Edit content

Everything lives in [`js/data.js`](js/data.js): the about text, skills, experience, projects, links, the "Currently" line and the text around the ring.

To add a CV link, put the PDF at `cv/Michal_Kwak_CV.pdf` and uncomment the CV entry in `links`.

## Files

```
index.html        page shell and corners
css/style.css     layout, type and panel styles
js/data.js        all content
js/vision.js      the generative centrepiece (2D canvas)
js/main.js        corners, clock, panels and routing
assets/           favicon
```

## Deploy

GitHub Pages → Settings → Pages → *Deploy from a branch* → `main` / root.
