# Draw

A vector shape editor ("tangent · leaf editor") in one page: draw freehand or
with straight lines, then align, group, order, arrange, morph, style and play
shapes. Shapes save and load as `.tvf`, and export as SVG or PNG. Shapes can be
animated (morphs, motion along paths, physical motions, a camera, stops) and the
animation written as an animated SVG or as a `.tvfs` scene for the player. An AI
button has Claude draw or animate from a description (sign-in required).

| | |
| --- | --- |
| **The editor** | https://reportbase.github.io/draw/ |
| **The gallery** (help, by example: 31 pages) | https://reportbase.github.io/draw/gallery/index.html |
| **The player** (plays a `.tvfs`, or a Lottie file) | https://reportbase.github.io/draw/player/player.html |
| **Explainers** (scrolling, from the essays) | https://reportbase.github.io/draw/gallery/explained.html |
| **The labs** (every experiment, with a link that runs it) | https://reportbase.github.io/draw/labs.html |
| **The papers** (the format and the theorem behind it) | https://reportbase.github.io/draw/papers.html |

## Link options

| Add to the link | What it does |
| --- | --- |
| `?lab=1` | Shows the lab surfaces. `?lab=list` lists the lab codes; `?lab=CODE` runs one. |
| `?bucket=NAME` | Opens the bucket picker on that bucket. |
| `?bucket=NAME&file=a.svg,b.svg` | Loads those files from the bucket. |
| `#tvf=…` | Opens curves (the gallery's edit buttons write this). |
| `#scene=…` | Opens a drawing with its animation (the morph bar's **link** writes this). |
| `?embed=1#scene=…` | Plays a scene with the canvas alone, for an `<iframe>`. |

## Putting a scene on a page

Make the animation in the editor, press **tvfs** on the morph bar, and:

```html
<script src="https://reportbase.github.io/draw/tvf-core.js"></script>
<script src="https://reportbase.github.io/draw/player/tvf-player.js"></script>
<canvas data-tvfs="my-scene.tvfs" width="640" height="360"></canvas>
```

The gallery's *played* page shows the rest (`TVFPlayer.play`, states, touch, Lottie).

## Files

| File | What it is |
| --- | --- |
| `draw.html` | The editor: one page, no build step. This is the file to edit. |
| `tvf-core.js` | The curve library (the kernel, leaves, reconstruction, spectral routines). The editor loads it; it also runs under Node. |
| `svg-import.js` | The SVG importer. The editor loads it. |
| `labs/` | The labs, one file a group, loaded when a lab is first run. `labs.html` lists them (generated). |
| `player/` | The player (`tvf-player.js`, generated from the editor's morph engine and `runtime.js`), the Lottie reader, example scenes. |
| `gallery/` | The teaching pages, the playground, the inspector, `tvf.js` (the library as an ES module) and their shared `style.css`. |
| `papers/`, `papers.html` | The papers as Markdown, and their reader. |
| `docs/` | Notes on how each part was built. `CLAUDE.md` holds the working rules. |
| `tools/` | The generators and measures behind the `npm run` scripts. |
| `tests/smoke.mjs` | The test. |
| `index.html` | Forwards `/draw/` to `draw.html`. |

Fonts (Google Fonts) and an SVG path polyfill load from CDNs at runtime. The
editor still works without them, with fallback fonts and a simpler SVG parser.

## Running it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000/draw.html
```

`draw.html` also opens straight from disk.

## Scripts

| | |
| --- | --- |
| `npm test` | The whole test: the editor, every gallery page, the player, the labs page, the papers. |
| `npm run test:quick` | The everyday run, about half the time. |
| `npm run sync` | Writes every copy the gallery pages carry from its source (`-- --check` only says what differs). |
| `npm run labs` | Writes `labs.html` from the editor's lab buttons. |
| `npm run player` | Writes `player/tvf-player.js` from the editor's morph engine. |
| `npm run examples` | Writes `player/examples/` from the animated gallery. |
| `npm run measure` | Times every example in the player on an emulated phone. |
| `npm run video -- <id>` | Writes an explainer as an MP4 (needs ffmpeg). |

## Testing

Every pull request runs `tests/smoke.mjs` in GitHub Actions. It opens the editor
in headless Chromium, drags on the canvas, draws, selects everything and presses
every enabled toolbar button, failing on any uncaught error; then it checks each
feature in turn, walks every gallery page, and checks that everything generated
or copied is up to date. To run it yourself:

```sh
npm install
npx playwright install chromium
npm test
```

## Publishing

Turn on GitHub Pages once: **Settings → Pages → Deploy from a branch → `main`,
`/ (root)` → Save**. After that, merging to `main` updates the live site within
a minute or two.
