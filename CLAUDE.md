# draw: notes for Claude

A 2D vector shape editor ("tangent · leaf editor") in one page, served by GitHub
Pages at https://reportbase.github.io/draw/. The owner works through Claude Code:
changes go on a branch, as a PR, and the owner merges. Merging to `main`
publishes.

## Files
- `draw.html`: **the editor and the file to edit.** About 71,000 lines, one page with no
  build step, loading one file beside it:
- `tvf-core.js`: **the curve library**, the editor's numerics: the kernel, the leaf layout,
  `Shape`, reconstruction and the spectral routines (§21 transform, §22 Fejér). A classic
  script `draw.html` loads with `<script src>` (so it still works opened from disk); it
  declares the globals `tvf`, `TVF_SPECTRAL` and `TVF_CORE` and exports `TVF_CORE` under
  Node. It is the source (it was once generated, then inlined; it is neither now). `npm test`
  runs it on its own and fails if `draw.html` grows its own copy again.
- `index.html`: forwards `/draw/` to `draw.html`, keeping `?lab=` and `?bucket=`.
- `labs.html`: every lab in the drawer, by heading, with what it does and a
  `draw.html?lab=CODE` link that runs it. **Generated** by `npm run labs`
  (`tools/build-labs.mjs` reads the lab buttons off the live editor); after adding, renaming
  or re-describing a lab in `draw.html`, run it, or `npm test` fails.
- `papers/`: the owner's papers as Markdown, the source of the theory: `tvf.md` (the format
  specification), `tb_classical.md` and `tb_algebra.md` (the Tangent Bridge theorem, classical
  and algebraic presentations), `tb_spectral.md` (the spectral companion, §§17–22) and
  `tb_spectral_notes.md` (§23, preliminary). Replace a file when the owner sends a new revision.
  Claude may edit them too, in their voice: when a change here builds or measures something a
  paper lists as open, say so in the paper (its status section and a dated revision line).
- `papers.html`: the index of `papers/` and a reader for them (`#tvf` opens one, `#tvf:heading-id`
  at a section). Its `PAPERS` list is written by hand: a new paper needs an entry, or `npm test`
  fails. The renderer is its own small one, written for these files: TeX is lifted out before
  anything else, typeset by KaTeX from cdnjs when that loads and shown as source when it does not.
- `gallery/`: twenty-eight teaching pages, in reading order: `gallery.html` (the catalogue),
  `bench`, `epicycles`, `snowflakes`, `radiolaria`, `width`, `space` (shape space), `curves` (the
  menagerie), `landscape`, `spiral`, `growth`, `assemblies`, `letters`, `tiles`, `sound` (heard), `motion`
  (the loop), `compose` (composed), `situated` (where you stand), `corner`, `levels`, `depth`, `standpoint` (where to stand), `recovered`, `readers` (between readers), `compile` (compile time), `fail` (where it breaks), `animated`, `embedded`. Also `playground.html` (sculpt
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
    `page-inspect`, `page-chart`, `page-bench`, `page-sound`, `page-playground`, `page-labs`, `page-animated`).
  - Each page bundles its JavaScript so it runs from one file. All twenty-eight, and the playground, carry the **same**
    `tvf.js` (`const TVF = (function` … `})();`). The nine *shape* pages (gallery,
    snowflakes, radiolaria, width, landscape, growth, assemblies, letters, tiles) also carry the same rest of the bundle (through the FORMAT module) and the same tile code
    (from `// The loop a tile's strip` to `async function copyText`: spectrum strip, predict
    mode, tile links, editor link). Change one copy, change them all: `npm test` fails and
    names the page that differs.
  - The other nineteen have their own tile code and extra modules (MOTION, SOUND, COMPOSE,
    STRESS, SPACE, CURVEMOD, SPIRAL, EPICYCLES, SITUATED, DEPTHPAGE, RECOVER, CORNER, LEVELS, STAND, BETWEEN, COMPILE), and no spectrum strip or predict mode. `spiral`,
    `curves`, `space`, `fail`, `situated`, `corner`, `levels`, `depth`, `standpoint`, `recovered`, `readers`, `compile`, `animated`, `embedded` are *chart* pages (`body.page-chart`: a measurement and a
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
  - `animated` (25 Oct 2026, Tom: "could you creae a gallery page that has examples that can be loaded into
    draw.html", then "make this a gallary page like with the same formatting as the others") is the last page and a
    chart page with no curve to edit: tiles of animations for the editor's live morph, each the example's drawing and an
    **open in draw** button where the others have edit. Each example is an SVG drawing (made in the page from a few
    lines) and the live morph's settings, written into `draw.html#scene=<payload>` (THE SCENE LINK in `draw.html`: 'z' +
    base64url of the JSON deflated, or 'r' plain; `{v:1, name, svg, exact, morphs: [[shape indices]…], path, turn,
    mode, fx, trail, ease, hold, loop, onion, corners, lag, t, play}`, shapes named by their order in the SVG). A
    `morphs` entry is a list of shapes or an object `{keys, path, laps, at, turn, mode, rate, phase, spin, fx, trail,
    lag, inPlace, parent, follow, look, times, eases}` (`parent`: the index of another entry, whose every move and turn carries this one, measured
    from where the parent was drawn: ONE MORPH RIDING ANOTHER; `follow: {kind: 'lag' | 'spring', amount}` how loosely, and
    `look` an entry it keeps turning to face, from the way it faces at the link's `t`: FOLLOWING LOOSELY, AND FACING; `times` a time per key on the morph's clock, `eases` an
    ease per stretch between keys, 'linear', 'inout', 'in', 'out' or null for the bar's: KEYS AT CHOSEN TIMES): what a morph has of its own (EACH MORPH ITS OWN TIME, PATH, COLOUR, TRAIL in `draw.html`, 25 Oct
    2026, Tom: "can you do some top quality animation examples, to really push the framework?"): its clock at a whole
    `rate` and a `phase`, its own path ridden `laps` times from `at`, `spin` turns a loop, its trail and effect; a
    shape may be a key more than once; the keys' fills blend in linear light (`run.cols`). All of it saves with the
    morph; the bar's controls still act on every morph, and the editor's strip (THE MORPH'S OWN SETTINGS, IN THE
    EDITOR, `#morphRunTool`, 25 Oct 2026, Tom: "1,3") sets them by hand for the live shapes selected: rate, phase and
    stagger, spin, ride a line (own path), laps, start and spread, trail, effect and follows (a parent picked there
    carries the shape from where both stand, `run.parentAt`; tight, lag or spring and how loose, `run.follow`; faces,
    `run.look` with `run.lookRef`), with the live shapes numbered on the canvas while it is
    up, and a track of the morph's keys on its clock (drag a key to its own time, click a stretch for its ease, "even" puts
    them back; `run.times`, `run.eases`, carried onto the even kernel by `morphWarp`). The bar's **timeline** button opens
    THE SCENE'S TIMELINE (`#morphTimeline`): every live morph a row, its keys where they land on the shared clock (a rate
    shows them that many times), drag one to retime it, drag the ruler or a row to scrub, a row's number selects it.
    A live shape edited on the canvas while paused (EDITING A KEY ON THE CANVAS) lands in its keys when the edit lands
    in the undo history: at a key's time (within a thousandth) that key, between keys a new key there, the others
    keeping their times, carried back through path, spin, parent and facing (`morphTakeEdit`; not with an effect, nor
    an exact edit that changes the corner count). The strip's **draw path** (DRAWING A PATH WHILE IT PLAYS) plays the
    morph while a stroke on the canvas becomes the selected morphs' own path, taken before the editor sees it.
    **corners ◀ ▶** (CORNERS PAIRED BY HAND) turns the corners of the key you stand on (or the next) a place, faint
    lines showing the pairing; scene link `pair: [places per key]`. A morph can play once (A MORPH THAT PLAYS ONCE,
    `run.clip = {start, len}`, scene link `clip`): first key to last over its window, holding either side; the
    timeline shows it as a bar to move and stretch, a row's ↻/1× toggles it, **in turn** makes a sequence. Its `show`
    (A CLIP SEEN ONLY WHEN IT PLAYS; the timeline's **shows** select) is '' (always), 'during', 'fade', 'in' or 'out':
    a factor on the drawing (`sp._fade`, never saved; the shape loop multiplies every alpha by it), its trails and the
    SVG export (an opacity animation) following. Undo snapshots carry the live morphs (UNDO STEPS THROUGH THE MORPHS:
    `snapshotState().morph` is `morphStateSave`, the autosave's own record, restored from a copy at the end of
    `applySnapshot`, the clock left where it is); a setting from a slider or a field is one step once it rests
    (`morphHistorySoon`). The AI panel's **animate it** and **change it** (ANIMATE IT WITH AI, 26 Oct 2026, Tom:
    "the human could gently tweak the generated AI result", then "1,2") ask Claude for the scene link's vocabulary,
    not frames: the drawing goes out as a picture and as its shapes numbered in a 1000 box (`animSketch`, read without
    turning held shapes into leaves), with the live morphs' settings (`animMorphsNow`); the reply's `copies` (a shape
    moved, turned, sized, kept exact: `animCopy`), `svg` (new outlines and motion paths, landed exact where the box
    puts them) and `morphs` go through the scene link's own `applySceneMorphs` (partial: what it leaves out stays),
    its `change` items through `sceneChangeRuns` (by morph: only what is named changes; `end` gives the keys back),
    and the whole reply is one undo step. `SYS_ANIM` is the prompt: a field added to the scene link belongs in it.
    The animated SVG export (EXPORTING A MORPH) takes as many frames as each morph's motion needs (doubling from the
    panel's count to 240 until a straight blend between frames is within 0.2% of the scene), each morph its own count,
    writes a morph that moves and turns as its outline plus a translate and rotate (a still: one outline), and writes
    echoes and ribbons as the same animations begun earlier, in a frame of the drawing's own proportions (1000 on its
    longer side); `__box.morphSvg(o)` returns the text. Opening one replaces the drawing, asking first when the tab
    holds the user's; shapes the SVG gave no stroke get no editor outline. The editor's menu links it ("animations ↗").
    A tile's **play** button (or its picture) plays it in place as its animated SVG (26 Oct 2026, Tom: "1,3"),
    made by a hidden editor (`sceneSvg`, THE EMBED AS A CONVERTER, below) and kept in the browser's IndexedDB
    (`tvf-scene-svg`, keyed by `SVG_VERSION` and the scene code), so only the first visit waits; raise `SVG_VERSION`
    when the SVG export changes what it writes, or visitors keep old pictures. **live** plays it in the editor
    itself: `draw.html?embed=1#scene=…` (THE EMBED in `draw.html`) shows the canvas alone, draws none of the editor's
    own marks, and never reads or writes the saved scene (it shares it with every editor tab: a tile must never
    replace someone's drawing). One tile plays at a time. Exact morphs between keys whose corners differ (MORPHS THAT KEEP THEIR CORNERS) bake roundings into arc edges
    when any key has curve edges, try twice the corners when that matches much better (a square to a circle drawn from
    0°), and keep a corner smooth in every pose where any key has it smooth (SMOOTH WHERE ANY KEY IS SMOOTH).
    The page's **showpieces** (clockwork, orrery, murmuration, garden, kite, lava lamp, ripple, metamorphosis, pendulum wave)
    come first, then the **sequences** (a house builds itself, a seed: morphs that play once, in turn, seen from when they
    play), the first steps after. A new example is an entry in `EXAMPLES` (or `SHOWPIECES`, drawn with the
    page's helpers: `around`, `smooth`, `circ4`, `gear`, `hsl`) and an id in a section of `SECTIONS`. It carries
    tvf.js (every gallery does) and reads no leaves itself.
  - `embedded` (26 Oct 2026, Tom: "could you do a gallery for embedded examples?", then "proceed with your
    recommendations": a light player) is the last page, a chart page: the same examples, each tile its **animated
    SVG**, made by one hidden editor (THE EMBED AS A CONVERTER in `draw.html`: an embed of the same origin answers
    `{type: 'tvf-scene-svg', id, code}` with `{type, id, svg}`) and then playing on its own (SMIL, no script, the editor
    gone once all are made; out of view, paused; the same `sceneSvg` and cache as animated.html, copied with the
    examples); **copy svg** gives that file. **live** plays one tile in the editor
    itself (an `<iframe>` of `draw.html?embed=1#scene=…`, THE EMBED) and **copy embed code** gives that `<iframe>`. In
    an embed the editor frames the scene to fill its frame (`embedFit`, again on a resize). Its
    examples are animated.html's, **copied unchanged** between `// >>> copied from animated.html, unchanged: EXAMPLES`
    and `// <<< end of EXAMPLES` (from `// ── THE EXAMPLES` up to `// the settings as one line`): change them in
    animated.html and copy them across, or `npm test` fails. Hook `window.__embedded`.
  - `index.html`'s cards and thumbnails are written by hand. Adding, renaming or reordering
    a page means updating it, and the "N of 28" crumbs and "next" links in each page.

## Links between the pages
- `draw.html#tvf=<payload>` opens curves in the editor; the format is documented at "THE
  SHAPE DEEP LINK" in `draw.html`. The gallery edit buttons write it, and so does the
  inspector; the editor's "inspect the selection" writes the same payload to
  `gallery/inspect.html#tvf=…`. New fields go after the curves, so older readers ignore them.
- `gallery/<page>.html#tile=<slug>&<dial>=<value>` opens a tile at given settings.

## Shared with 3d and games: change with care
The 3d repo copies three blocks **verbatim**:
1. the curve library, from `tvf-core.js` (from its first line to the end of the
   `const tvf = (function(){ … })();` IIFE)
2. from `draw.html`, the SVG importer (from `NON_RENDERING_CONTAINERS` through `smoothDrawPts`,
   including `parseSvgToPolyline`)
3. from `draw.html`, `parseTvfText`, the `.tvf` reader

3d runs a weekly "Draw sync" check that fails once these drift from draw's
`main` (it reads both `draw.html` and `tvf-core.js`). After changing any of them here, copy the new version into 3d.html
between its `// >>> copied from draw.html` markers (a PR in the 3d repo), or tell
the owner it needs doing.

The games repo copies two of them **verbatim** into `games.html` (since Oct 10, for mini golf's
moving paths, which are closed `.tvf` curves): the curve library (block 1, as `tvf-core`) and
`parseTvfText` (block 3, as `tvf-reader`), between its `// >>> copied from draw.html, unchanged:
NAME` and `// <<< end of NAME` markers, inside its `TVF_CURVE` wrapper. Games has its own weekly
"Draw sync" check (`tests/draw-sync.mjs`, also run on every games PR) that fails once these drift
from draw's `main`. After changing either here, copy it into games.html as well (a PR in the games
repo), or tell the owner both copies need doing.

The `.tvf` curve format (`TVF N 1 2`, `#meta` lines, then one row of x and one
row of y leaf values) is read by 3d and games too, and games writes it (a path saved from mini
golf, with `#meta source:minigolf`, which draw should keep ignoring or carrying through). Change it
compatibly.

## Other details
- The AI button talks to the `login.tangent.workers.dev` gateway (the page holds
  no API key).
- The bucket picker reads from `flare.tangent.workers.dev`; draw only reads from
  flare, never writes.
- Comments explain *why*, at length. Keep the voice.

## Testing
- `npm test` runs `tests/smoke.mjs`: it loads the page in headless Chromium, drags
  on the canvas, draws, selects everything, presses every enabled toolbar button,
  and fails on any uncaught error; then it walks every gallery page and runs the
  gallery, inspector, playground and labs checks. About three minutes. Run it before
  every PR (CI runs it too), and add checks for new behaviour.
- `npm run test:quick` is the everyday run, about half the time: the same editor walk and
  single-page checks, but only two gallery pages walked and no labs.html regeneration.
- The page has fallbacks if the CDNs (Google Fonts, the path-data polyfill) are
  blocked, so it runs in a sandbox as is.

## Related repos
- **3d:** copies the blocks above.
- **flare:** storage.
- **games:** the games page; copies the curve library and `parseTvfText` (see above) for mini
  golf's paths, and opens and saves `.tvf` curves.
