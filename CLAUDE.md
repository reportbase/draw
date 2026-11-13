# draw: notes for Claude

A 2D vector shape editor ("tangent · leaf editor") in one page, served by GitHub
Pages at https://reportbase.github.io/draw/. The owner works through Claude Code:
changes go on a branch, as a PR, and the owner merges. Merging to `main`
publishes.

This file holds the rules: what each file is, what is generated or copied and the
command that writes it, what other repos depend on. The dated notes of what was built
and why (the names to search for, the numbers measured, the owner's words) are in
`docs/`, by part; **read the one for the part you are about to change**:

| Working on | Read |
| --- | --- |
| the labs (`labs/`, `labs.html`, the lab tools) | `docs/labs.md` |
| the player, `.tvfs` scenes, states, touch, Lottie | `docs/player.md` |
| the live morph, the scene link, motions, the AI's animation, the animated SVG | `docs/animation.md` |
| a gallery page (which carries what, chart pages, `embedded`, `played`) | `docs/gallery.md` |
| `gallery/explained.html`, an explainer, the video tool | `docs/explainers.md` |

When a change adds something a later session would need to know, put the rule here in a
line and the account of it in the `docs/` file, dated, in the voice those have.

## Files
- `draw.html`: **the editor and the file to edit.** About 63,400 lines, one page with no
  build step. It loads three library files beside it and thirteen of its own blocks from `parts/`,
  and the labs' files in `labs/` only when one is asked for. All are classic scripts loaded by
  `<script src>`, so the page still works opened from disk.
- `tvf-core.js`: **the curve library**, the editor's numerics: the kernel, the leaf layout,
  `Shape`, reconstruction and the spectral routines (§21 transform, §22 Fejér). It declares
  the globals `tvf`, `TVF_SPECTRAL` and `TVF_CORE` and exports `TVF_CORE` under Node. It is
  the source. `npm test` runs it on its own and fails if `draw.html` grows its own copy again.
- `svg-import.js`: **the SVG importer** (12 Nov 2026), from `NON_RENDERING_CONTAINERS` through
  `smoothDrawPts`, with `parseSvgToPolyline`: an SVG's text in, its subpaths as dense polylines
  with their paint out. Its lines are the editor's, cut out unchanged and at the editor's indent;
  it declares its names (and `REF_SAMPLES`, which the editor reads too) as globals, and reads
  `tvf` from the library when called. The exact importer (`parseSvgExact`, `loadSvgExact`) is
  the editor's own and stays in the page. `npm test` fails if `draw.html` grows its own copy.
- `tvf-reader.js`: **the `.tvf` reader** (12 Nov 2026): `parseTvfText`, a curve file's text in, its
  curves' leaves out, cut from the editor unchanged and at its indent. It reads only its text, so it
  runs under Node too (it exports `parseTvfText`). What the editor does with the curves
  (`tvfFitToWorld`, the exact corners a file carries) stays in the page. `npm test` fails if
  `draw.html` grows its own copy.
- `parts/`: **blocks of the editor's own script** (12 Nov 2026), each cut out line for line: `ai-panel.js`
  (the AI popover, `apiCall`, the prompts and `ANIM_MORPH_FIELDS`, `animApply`), `shapes-panel.js`,
  `bucket-picker.js`, `scene-link.js` (`openScene`, `applySceneMorphs`, `sceneOfEditor`), `timeline.js` (the
  morph bar's timeline), `morph-strip.js` (a morph's own settings), `appearance-panel.js`, `text-panel.js`,
  `bucket-panel.js`, `checksum-panel.js`, `instruments.js` (the edit view's strips), `shape-link.js`
  (`#tvf=`) and `morph-engine.js` (the morph engine, below). A file hands
  its code over as `(window.TVF_PARTS = …)[name] = function () { … }`; the page names it in a
  `<script src>` above its own script and runs it where the block stood (`partRun(name)`, PARTS OF THE
  EDITOR IN parts/), by a direct `eval` inside the editor's closure, so the code reads every editor name
  and runs at the same point of the start as it did. Edit them as the editor. A block can move there
  when it is one function run once at the start whose names nothing else in the page uses.
  **The morph engine** (`parts/morph-engine.js`, 4,300 lines from MORPH: THE ONE OPERATION THE FORMAT IS BUILT FOR to
  THE MORPH'S OWN SETTINGS, IN THE EDITOR) is the one the page calls into: its function ends by returning every
  name it declares at its top, and the page takes them where it stood, `var { … } = partRun('morph-engine');`
  (a `var`: the first frames ask `_morphReady` before that line runs). A name added at the engine's top goes in
  both lists; `npm test` (labs) fails when the three differ. `npm run player` reads the engine's lines from the
  file, put back where the page takes them. `partRun` returns what a part's function returns; the other twelve
  return nothing. `shapes-panel.js` is the builder alone since the Shapes popover went (13 Nov 2026). The AI panel must run at the
  start: it takes the sign-in redirect's token from the address (`captureRedirect`) and sets the hooks the scene
  link reads (`__animOutline`, `__sceneBoxOf`); it costs 2 to 4 ms there, so it is not worth deferring.
- `index.html`: forwards `/draw/` to `draw.html`, keeping `?lab=` and `?bucket=`.
- `labs/` and `labs.html`: every lab group in the drawer is a file in `labs/`, loaded on the
  first press of its button (`LAB_FILES` in the editor maps a lab's data-code to its file) and
  evaluated inside the editor's closure, so its code reads every editor name. `labs.html` lists
  them and is **generated**. Code several labs share (`makeRng`, `labComb`) and code copied
  elsewhere stays in the editor. Moving or adding a lab: `docs/labs.md`.
- `player/`: **the TVF player**. `tvf-player.js` plays a `.tvfs` scene on a canvas and is
  **generated**: its engine is the editor's own morph code taken by name, between a shim and
  `player/runtime.js` (the part to edit, with `player/lottie.js`). `player/examples/` and
  `player/interactive/` hold scenes, also **generated**. The format is `papers/tvf.md` §2.10.
- `gallery/`: thirty-one teaching pages, `playground.html`, `inspect.html`, the front page
  `index.html`, `style.css` (every page's styles, and `labs.html`'s: change the look there,
  once) and `tvf.js` (the library as an ES module, **generated**). Each page bundles its
  JavaScript so it opens from disk as one file, so the pages carry **copies** of what they
  share: see below.
- `papers/` and `papers.html`: the owner's papers and their reader (below).
- `docs/`: the notes above. `tests/`: the smoke test, in eight parts (Testing, below). `tools/`: the
  generators and measures.

## Generated and copied: what to run
Nothing here is edited by hand in its generated form; `npm test` fails when one is stale.

| After changing | Run | It writes |
| --- | --- | --- |
| a lab's button, heading or description in `draw.html` | `npm run labs` | `labs.html` |
| the morph engine (`parts/morph-engine.js`, and what it takes from `draw.html`), or `player/runtime.js` | `npm run player` | `player/tvf-player.js` |
| an example in `gallery/animated.html`, the scene link, the `.tvfs` writer | `npm run examples` (`-- id …` for some) | `player/examples/*.tvfs`, `index.json` |
| `player/lottie.js` or an interactive example | `node tools/write-interactive.mjs` | `player/interactive/` |
| anything the gallery pages share (next list), or the order of the pages | `npm run sync` | every copy, from its source |
| not sure which | `npm run build` (`-- --all` for the two that need a browser) | all of the above, in order |

**The copies** (`tools/sync.mjs`; `npm run sync -- --check` writes nothing and names what differs):
- the library (`const TVF = (function` … `})();`): edit it in `gallery/gallery.html`; it goes to
  every gallery page and the playground, and to `gallery/tvf.js` as a module.
- the rest of the bundle (through the FORMAT module) and the tile code (from `// The loop a
  tile's strip` to `async function copyText`): edit in `gallery/gallery.html`; they go to the
  other eight shape pages (snowflakes, radiolaria, width, landscape, growth, assemblies,
  letters, tiles).
- the animated examples (from `// ── THE EXAMPLES` up to `// the settings as one line`): edit in
  `gallery/animated.html`; they go to `gallery/embedded.html` between its markers.
- the depth code (`DEPTH`, `fmtSig`, `rungOfRow`, `depthToTVF`, `depthFromTVF`,
  `depthLearnedFacing`, `depthEnterWhereNeeded`, `wlsSlopeRow`, `wlsSolve`, `depthEnterFlat`,
  `depthEnterFlatWalls`): edit in `draw.html`; it goes to `gallery/inspect.html`, `depth.html`
  and `standpoint.html` between their `// >>> copied from draw.html` markers, with `WLS_K`, the
  constant beside them.
- the order of the pages: the order of the cards in `gallery/index.html`. From it come the cards'
  numbers, each page's "N of 31" crumb and the address its next link points at (a next link's
  words are the page's own: when its address is changed the run says so, to look at them).

**Written by hand, and checked:**
- `gallery/index.html`'s cards and thumbnails: adding or renaming a page means writing its card,
  and reordering means moving the card (then `npm run sync`).
- `papers.html`'s `PAPERS` list: a new paper needs an entry.
- A gallery note's link into a paper, `<a class="paper" href="../papers.html#paper:heading-id">`:
  the test opens each, so retitling a section in a paper means updating the links.
- `SVG_VERSION` in `animated.html` (and its copy): raise it when the animated SVG export changes
  what it writes, or visitors keep old pictures from their browser's cache.

**One vocabulary, several places.** A field added to the scene link belongs in
`applySceneMorphs` (reading) and `sceneOfEditor` (writing), both in `parts/scene-link.js`,
`ANIM_MORPH_FIELDS` (the AI's prompts, in `parts/ai-panel.js`) and, where a scene file should carry it, the `.tvfs` writer and `player/runtime.js`.

**Making a scene or an explainer** (the rules found making them; the rest is in
`docs/explainers.md`): a new example is an entry in `EXAMPLES` or `SHOWPIECES` and an id in
`SECTIONS`; an explainer is also an entry in `explained.html`'s `EXPLAINERS`. A clip plays its
keys from the first key's time to the last's across its window, so give the last key again at
the window's end where a pose is to hold. A morph that must hold between keys needs
`straight`. A clip holds its first pose before its window: a thing not to be seen until it
starts needs an `in`. Past 150 shapes (`LAZY_MIN_SHAPES`) a scene opens as leaves and its file
grows fivefold. A scene draws its morphs in the order their first keys stand in its svg. A
beat's `#lit:` indices are the morph list's order: add morphs through a helper that names
them. The editor says a scene's quiet fallbacks aloud (`window.__sceneWarnings`).

## The papers
- `papers/`: the owner's papers as Markdown, the source of the theory: `tvf.md` (the format
  specification), `tb_classical.md` and `tb_algebra.md` (the Tangent Bridge theorem, classical
  and algebraic presentations), `tb_spectral.md` (the spectral companion, §§17–22) and
  `tb_spectral_notes.md` (§23, preliminary), and `labs.md` (28 Oct 2026: every lab run again and read back, what
  it found, its classical names, what looks new, the faults the run found; regenerate its numbers with
  `tools/run-labs.mjs` when a lab changes). Replace a file when the owner sends a new revision.
  Claude may edit them too, in their voice: when a change here builds or measures something a
  paper lists as open, say so in the paper (its status section and a dated revision line).
  Their vocabulary is the current one (28 Oct 2026, Tom: "it uses terms like atom that have been long abandoned"):
  **leaves** for the places read (never atoms), the **sweep** for the interval of ratios, the **reader** and the
  **writer** (not the bounded observer, the spectator or the surveyor), **levels** (not rungs or octaves), the
  **corner** (π/4) and the **horizon** (π/2), the reader's **unit circle** (not the virtual circle), the
  **reconstruction** (not the presentation), the reader's and the writer's (not inside and outside). Other papers
  are cited by their own titles (*The Observation Atom* keeps its name).
  Since 29 Oct 2026 (Tom: "update the tb paper with new wander framing") both Tangent Bridge presentations follow
  wander's *Observation from Somewhere* where they touch it: the Cauchy is the one **rotation-invariant** law, the
  Möbius maps carrying its family into itself (never "the unique Möbius-invariant distribution": no probability law
  is); the leaf positions are **addresses** and $F$'s values there the **payload**; and §15.2's pan × tilt torus is a
  parametrization whose even grid is not the uniform measure on directions (on an octant $v \le h$ 0.34258 against
  ½, the near field 0.23263 against ⅓), with turns of space not commuting and the plane's one law parting on $S^2$.
  The editor's and the gallery's words follow (28 Oct 2026, Tom: "yes"): what draw.html called an atom is a **leaf**
  where it meant a place read, a **reader** where it meant one of the labs' instruments (the radial, angular and area
  readers; the two- and three-reader tests), a **quarter** where it meant a quarter-turn of the line of sight (the
  four quarters overlay) and **the triangle** for the rise/run glyph. Identifiers (`fourAtoms`, `ATOM_RGB`, …) and
  saved values (`headGlyph: 'atom'`, `bucketRule: 'atoms'`) keep the old word, so old files and links still open;
  so does the plot parser's grammar term, and `tvf-core.js`'s one comment (3d and games copy it unchanged).
- `papers.html`: the index of `papers/` and a reader for them (`#tvf` opens one, `#tvf:heading-id`
  at a section). Its `PAPERS` list is written by hand: a new paper needs an entry, or `npm test`
  fails. The renderer is its own small one, written for these files: TeX is lifted out before
  anything else, typeset by KaTeX from cdnjs when that loads and shown as source when it does not.

## Links between the pages
- `draw.html#tvf=<payload>` opens curves in the editor; the format is documented at "THE
  SHAPE DEEP LINK" in `draw.html` (its code is `parts/shape-link.js`). The gallery edit buttons write it, and so does the
  inspector; the editor's "inspect the selection" writes the same payload to
  `gallery/inspect.html#tvf=…`. New fields go after the curves, so older readers ignore them.
- `gallery/<page>.html#tile=<slug>&<dial>=<value>` opens a tile at given settings.

## Shared with 3d and games: change with care
The 3d repo copies three blocks **verbatim**:
1. the curve library, from `tvf-core.js` (from its first line to the end of the
   `const tvf = (function(){ … })();` IIFE)
2. the SVG importer, from `svg-import.js` (from `NON_RENDERING_CONTAINERS` through `smoothDrawPts`,
   including `parseSvgToPolyline`; in `draw.html` until 12 Nov 2026, and moved with every line
   and its indent unchanged, so 3d's copy is still this text)
3. the `.tvf` reader, from `tvf-reader.js` (from its `TVF LOAD` heading through the end of
   `parseTvfText`; in `draw.html` until 12 Nov 2026, moved the same way)

Nothing is copied out of `draw.html` itself any more: each block is a file, and its lines kept
their indent, so a copy is still that file's text. 3d runs a weekly "Draw sync" check that fails
once a block drifts from draw's `main`; it reads `draw.html`, `tvf-core.js`, `svg-import.js` and
`tvf-reader.js`. After changing any of the blocks here, copy the new version into 3d.html between
its `// >>> copied from draw.html` markers (a PR in the 3d repo), or tell the owner it needs doing.

The games repo copies two of them **verbatim** into `games.html` (since Oct 10, for mini golf's
moving paths, which are closed `.tvf` curves): the curve library (block 1, as `tvf-core`) and
the `.tvf` reader (block 3, as `tvf-reader`), between its `// >>> copied from draw.html, unchanged:
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
- The top bar's buttons are 52px on touch and narrow windows (the other bars' 42). They and the edit view's bar show
  a short name under them on hover or while held, and on touch a shape's tile shows its title when pressed (13 Nov
  2026, THE BUTTONS SAY THEIR NAMES, `NAMES` in `draw.html`): a new button on either bar needs an entry there, or
  `npm test` (editor) fails; its `title` stays the longer account.
- The strip at the foot says one of several things (13 Nov 2026, THE STRIP ADDS SHAPES TOO and THE STRIP SAYS ONE OF
  SEVERAL THINGS in `draw.html`, `MODES`): the + on the top bar (`#bAddStrip`, where the Shapes button and its popover
  were) turns it to the library of shapes, and Fill, Outline, Align, Order and Build to theirs, each on a ring of its
  own (`makeRing`), the button lit as the grid's is when on (`.active`, and `aria-pressed`) while it shows. A tile of Fill, Outline, Align or Order clicks the
  popover button it mirrors, so those panels stay the code that acts; the colour rings' first tile opens the panel's
  sliders. The drawing's strip only steps aside (`body.adding`, `body.dataset.strip`); the strip hides in the edit view
  and while a morph is live. `__strip.open(mode)` and `__strip.mode` for tests. Those six buttons lead the top ring
  (`STRIP_FIRST`, moved to the front before the ring is built) and it opens turned to Fill, so a phone shows +, Fill and
  Outline at once; a phone test that needs another top-bar button in view has to turn the ring to it.
- Comments explain *why*, at length. Keep the voice.

## Testing
- `npm test` runs the smoke test: `tests/smoke.mjs` runs its eight parts one after another, each a
  file in `tests/` that also runs alone (`node tests/gallery.mjs`, or `npm test -- gallery player`):

  | Part | What it checks |
  | --- | --- |
  | `unit` | `tvf-core.js` and `tvf-reader.js` in Node, no browser, under a second (`npm run test:unit`): the kernel, reconstruction, Fejér, resampling, the shapes, what a `.tvf` is |
  | `editor` | the editor's walk (load, drags, a stroke and a line, every enabled toolbar button), a crowded import, the panel |
  | `exact` | exact shapes: SVG kept exact, smooth corners saved, exact shapes edited and combined |
  | `morph` | the live morph: timeline, recording, paths, trails, corners, the examples, a morph's settings, undo, animate with AI |
  | `motion` | physical motions, eases, chains, contact, emitters, the scene link written out, explainers in the editor, plots, labels |
  | `gallery` | every gallery page walked, the single-page checks, the copies, the front page, the papers and links into them |
  | `player` | the embedded gallery, the player, the played gallery, interactive scenes, Lottie, the scrolling explainer |
  | `labs` | the labs, `labs.html`, and the files that stand alone or must be up to date (`tvf-core.js`, `svg-import.js`, `tvf-reader.js`, `parts/`, `npm run sync`) |

  A part fails on any uncaught error in a page or a failed check. `tests/harness.mjs` is what they
  share (the server, the browser, `step`, how a run ends). `JOBS=3 npm test` runs three parts at a
  time. CI runs each part as its own job, side by side (`.github/workflows/smoke.yml` lists the
  parts too: add a new part to both). Run the parts you touched before every PR, and add checks
  for new behaviour to the part they belong to.
- `npm run test:quick` (`QUICK=1`) is the everyday run: the same parts, but only two gallery pages
  walked and no labs.html regeneration. `ONLY='a|b'` runs only the steps whose names hold a or b.
- The page has fallbacks if the CDNs (Google Fonts, the path-data polyfill) are
  blocked, so it runs in a sandbox as is.

## Related repos
- **3d:** copies the blocks above.
- **flare:** storage.
- **games:** the games page; copies the curve library and `parseTvfText` (see above) for mini
  golf's paths, and opens and saves `.tvf` curves.
