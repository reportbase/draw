# The gallery

Moved here from `CLAUDE.md` (12 Nov 2026), unchanged: the dated notes of what was built, with the names to search for in the code. `CLAUDE.md` keeps the rules; read this before working on this part.

One thing has changed since these were written: where they say to change every copy by hand ("change one copy, change
them all", "copy it to all three", "copy them across"), `npm run sync` now writes the copies from their sources
(`tools/sync.mjs`; the sources are listed in `CLAUDE.md`).

## The pages

- `gallery/`: thirty-one teaching pages, in reading order: `gallery.html` (the catalogue),
`bench`, `epicycles`, `snowflakes`, `radiolaria`, `width`, `space` (shape space), `curves` (the
menagerie), `landscape`, `spiral`, `growth`, `assemblies`, `letters`, `tiles`, `sound` (heard), `motion`
(the loop), `compose` (composed), `situated` (where you stand), `corner`, `levels`, `depth`, `standpoint` (where to stand), `recovered`, `readers` (between readers), `compile` (compile time), `fail` (where it breaks), `animated`, `embedded`, `played`, `lottie`, `explained`. Also `playground.html` (sculpt
a shape by hand; the transcript writes each gesture as a tvf.js call), `tvf.js` (the
library as an ES module, *generated* from the copy the pages inline: regenerate it from
a page's `const TVF = (function () {` block rather than editing it, or the tests fail),
the front page `index.html` that lists them, and `inspect.html`, which reads a shape's
spectrum, symmetry, width and leaf count back off its leaves, and reads depth files
(TVF §2.8). Its depth code (`DEPTH`, `fmtSig`, `rungOfRow`, `depthToTVF`, `depthFromTVF`,
`depthLearnedFacing`, and the writers `depthEnterWhereNeeded` and `depthEnterFlatWalls` with
their helpers) is copied unchanged from `draw.html` between `// >>> copied from draw.html`
markers, and `depth.html` and `standpoint.html` carry the same copy; `npm test` fails if any drifts,
so change it in the editor and copy it to all three.
- **Links into the papers:** where a page states a result a paper proves or measures, its
  note carries `<a class="paper" href="../papers.html#paper:heading-id">…</a>` (a small pill,
  styled in `style.css`). `npm test` opens every such link and fails on one that names no
  heading, so retitling a section in a paper means updating the links.
- **Styles live in `gallery/style.css`**, shared by every page in `gallery/` (and by
  `labs.html`); a page keeps only its fonts link. Change the look there, once. Pages with
  a layout of their own have a section there scoped to their body class (`page-index`,
  `page-inspect`, `page-chart`, `page-bench`, `page-sound`, `page-playground`, `page-labs`, `page-animated`, `page-embedded`, `page-played`, `page-explained`).
- Each page bundles its JavaScript so it runs from one file. All thirty-one, and the playground, carry the **same**
  `tvf.js` (`const TVF = (function` … `})();`). The nine *shape* pages (gallery,
  snowflakes, radiolaria, width, landscape, growth, assemblies, letters, tiles) also carry the same rest of the bundle (through the FORMAT module) and the same tile code
  (from `// The loop a tile's strip` to `async function copyText`: spectrum strip, predict
  mode, tile links, editor link). Change one copy, change them all: `npm test` fails and
  names the page that differs.
- The other twenty-two have their own tile code and extra modules (MOTION, SOUND, COMPOSE,
  STRESS, SPACE, CURVEMOD, SPIRAL, EPICYCLES, SITUATED, DEPTHPAGE, RECOVER, CORNER, LEVELS, STAND, BETWEEN, COMPILE), and no spectrum strip or predict mode. `spiral`,
  `curves`, `space`, `fail`, `situated`, `corner`, `levels`, `depth`, `standpoint`, `recovered`, `readers`, `compile`, `animated`, `embedded`, `played`, `lottie` are *chart* pages (`body.page-chart`: a measurement and a
  verdict line per tile); `motion`, `compose` and `epicycles` animate (`page-chart page-motion`; epicycles
  carries only tvf.js, FORMAT and EPICYCLES, and its dials may be selects);
  `sound` plays its tiles (`page-sound`); `bench` is numbered steps (`page-bench`).
  `situated` (where you stand) is the situated reader, its arithmetic ported from the editor's labs
  (`unc`, `crb`, `nfr`, `occ`, `nsr`) so the two agree; its standpoints are dragged on the canvas.
  `depth` writes depth files three ways (every octave, where needed, flat walls) on closed-form
  shapes, with the editor's depth code copied (carries tvf.js and that copy, no FORMAT); its .tvf
  buttons copy a tile's depth file. `recovered` recovers a figure from readers' quotients v/h
  (the editor's `udv` lab): one reader and the census, two and three readers crossing their lines,
  one length for the size, rounded readings and what readers cannot see; its readers are dragged
  (carries tvf.js and RECOVER only). `levels` (10 Oct 2026, from wander's levels.html; Tom: "should we add
  this to that project", "both") lays the corner's circle and each doubling past it in half the room of the
  last, the rings a grain can see, and a shape read from its centroid or from a place on its outline (the
  nearest wall in each direction), with a level-of-detail circle and its depth in levels once its size is
  divided out (LEVELS; `levelsCheck`). It loads a .tvf from its bar and reads `#tvf=`: the editor's "read
  the selection in the levels" sends the selection there. Three pages follow Serial, Parallel and Nowhere (wander's
  `papers/`, linked on GitHub): `corner` (the flip, the in-place sweep, detail by distance, the cost of
  a sure reading; CORNER), `standpoint` (a reader on a rippled circle, why the editor's circle costs
  810 sweeps; STAND, with the depth copy) and `readers` (the cross ratio, readers finding each other,
  matching readings to places by a third reader, the ladder; BETWEEN). `compile` (compile time) is a
  small partial evaluator (COMPILE) run on a reader's own programs: what folds before anything arrives,
  recursion against level of detail, the level from a float's exponent bits, and two ways to create one
  universe (by logic, by a literal) read alike from inside. Each
  has a section in `style.css`. Edit buttons (the shared editor link) are on `spiral`,
  `curves`, `space`, `motion`, `compose` and `epicycles`; the rest hold no curve to hand on.

## embedded

  - `embedded` (26 Oct 2026, Tom: "could you do a gallery for embedded examples?", then "proceed with your
recommendations": a light player) is a chart page: the same examples, each tile its **animated
SVG**, made by one hidden editor (THE EMBED AS A CONVERTER in `draw.html`: an embed of the same origin answers
`{type: 'tvf-scene-svg', id, code}` with `{type, id, svg}`) and then playing on its own (SMIL, no script, the editor
gone once all are made; out of view, paused; the same `sceneSvg` and cache as animated.html, copied with the
examples); **copy svg** gives that file. **live** plays one tile in the editor
itself (an `<iframe>` of `draw.html?embed=1#scene=…`, THE EMBED) and **copy embed code** gives that `<iframe>`. In
an embed the editor frames the scene to fill its frame (`embedFit`, again on a resize). Its
examples are animated.html's, **copied unchanged** between `// >>> copied from animated.html, unchanged: EXAMPLES`
and `// <<< end of EXAMPLES` (from `// ── THE EXAMPLES` up to `// the settings as one line`): change them in
animated.html and copy them across, or `npm test` fails. Hook `window.__embedded`.

## played

  - `played` (27 Oct 2026, Tom: "lets put it to work with its own gallery help page.") is a chart page:
the TVF player at work and its help. Four cards on top say how to make a scene (the morph bar's tvfs), put it on
a page (two scripts and `<canvas data-tvfs>`, with that code running beside it), drive it (`TVFPlayer.play`'s
controller; `load`, `draw`, `poses`) and what a `.tvfs` holds; then a wide panel to open or drop your own and
scrub it; then every file in `player/examples/`, built from its `index.json`, each tile a canvas and a
controller of the player's, started when first in view and paused out of view (a click pauses one).
**copy embed code** gives the two scripts and a canvas at `https://reportbase.github.io/draw/`. It is the one
gallery page that loads scripts beside it (`../tvf-core.js`, `../player/tvf-player.js`), since that is what
it shows; it still carries `tvf.js` like the rest. Hook `window.__played`.

## The front page

  - `index.html`'s cards and thumbnails are written by hand. Adding, renaming or reordering
a page means updating it, and the "N of 31" crumbs and "next" links in each page.
