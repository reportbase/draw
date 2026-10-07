# Draw

A vector shape editor ("tangent · leaf editor") in one page: draw freehand or
with straight lines, then align, group, order, arrange, morph, style and play
shapes. Shapes save and load as `.tvf`, and export as SVG or PNG. An AI button
has Claude draw vector art from a description (sign-in required).

**Use it:** https://reportbase.github.io/draw/
**Help:** https://reportbase.github.io/draw/gallery/index.html

## Link options

| Add to the link | What it does |
| --- | --- |
| `?lab=1` | Shows the lab surfaces. `?lab=list` lists the lab codes. |
| `?bucket=NAME` | Opens the bucket picker on that bucket. |
| `?bucket=NAME&file=a.svg,b.svg` | Loads those files from the bucket. |

## Files

| File | What it is |
| --- | --- |
| `draw.html` | The whole editor: one self-contained page. This is the file to edit. |
| `index.html` | Forwards `/draw/` to `draw.html`. |
| `tests/smoke.mjs` | The smoke test (see below). |

Fonts (Google Fonts) and an SVG path polyfill load from CDNs at runtime. The
editor still works without them, with fallback fonts and a simpler SVG parser.

## Running it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000/draw.html
```

## Smoke test

Every pull request runs `tests/smoke.mjs` in GitHub Actions. It opens the page
in headless Chromium, drags on the canvas, draws a freehand stroke and a line,
selects everything, then presses every enabled toolbar button in turn. It fails
if anything throws an uncaught error. To run it yourself:

```sh
npm install
npx playwright install chromium
npm test
```

## Publishing

Turn on GitHub Pages once: **Settings → Pages → Deploy from a branch → `main`,
`/ (root)` → Save**. After that, merging to `main` updates the live site within
a minute or two.
