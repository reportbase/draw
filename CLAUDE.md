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
- `draw.html`: **the editor and the file to edit.** About 74,000 lines, one page with no
  build step. It loads two files beside it, and the labs' files in `labs/` only when one is
  asked for. All three are classic scripts loaded by `<script src>`, so the page still works
  opened from disk.
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
- `docs/`: the notes above. `tests/smoke.mjs`: the test. `tools/`: the generators and measures.

## Generated and copied: what to run
Nothing here is edited by hand in its generated form; `npm test` fails when one is stale.

| After changing | Run | It writes |
| --- | --- | --- |
| a lab's button, heading or description in `draw.html` | `npm run labs` | `labs.html` |
| the morph engine in `draw.html`, or `player/runtime.js` | `npm run player` | `player/tvf-player.js` |
| an example in `gallery/animated.html`, the scene link, the `.tvfs` writer | `npm run examples` (`-- id …` for some) | `player/examples/*.tvfs`, `index.json` |
| `player/lottie.js` or an interactive example | `node tools/write-interactive.mjs` | `player/interactive/` |
| anything the gallery pages share (next list) | `npm run sync` | every copy, from its source |

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
  and `standpoint.html` between their `// >>> copied from draw.html` markers. (`WLS_K`, a
  constant beside them, is copied by hand.)

**Written by hand, and checked:**
- `gallery/index.html`'s cards and thumbnails, and each page's "N of 31" crumb and "next" link:
  adding, renaming or reordering a page means updating them.
- `papers.html`'s `PAPERS` list: a new paper needs an entry.
- A gallery note's link into a paper, `<a class="paper" href="../papers.html#paper:heading-id">`:
  the test opens each, so retitling a section in a paper means updating the links.
- `SVG_VERSION` in `animated.html` (and its copy): raise it when the animated SVG export changes
  what it writes, or visitors keep old pictures from their browser's cache.

**One vocabulary, several places.** A field added to the scene link belongs in
`applySceneMorphs` (reading), `sceneOfEditor` (writing), `ANIM_MORPH_FIELDS` (the AI's
prompts) and, where a scene file should carry it, the `.tvfs` writer and `player/runtime.js`.

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
  SHAPE DEEP LINK" in `draw.html`. The gallery edit buttons write it, and so does the
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
3. from `draw.html`, `parseTvfText`, the `.tvf` reader

3d runs a weekly "Draw sync" check that fails once these drift from draw's
`main`. It was written to read `draw.html` and `tvf-core.js`: since the importer moved it must
read `svg-import.js` for block 2 (a change to 3d's check, not to its copy). After changing any
of the blocks here, copy the new version into 3d.html between its `// >>> copied from draw.html`
markers (a PR in the 3d repo), or tell the owner it needs doing.

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
