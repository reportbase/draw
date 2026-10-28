# draw: notes for Claude

A 2D vector shape editor ("tangent · leaf editor") in one page, served by GitHub
Pages at https://reportbase.github.io/draw/. The owner works through Claude Code:
changes go on a branch, as a PR, and the owner merges. Merging to `main`
publishes.

## Files
- `draw.html`: **the editor and the file to edit.** About 76,000 lines, one page with no
  build step, loading one file beside it (and the labs' files in `labs/`, only when one is asked for):
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
  **The labs are leaving `draw.html`** (28 Oct 2026, Tom: "all the labs can ultimately be pulled from draw.html. its
  already too big", then "agreed, proceed"): first measured, then written down (`papers/labs.md`), then moved to
  `labs/*.js` loaded only when asked (Tom: "batch them"). **`labs/`** (28 Oct 2026): every lab group in the drawer (53
  of its 54 headings; the paint modes are the editor's own), in 51 files named for their headings (`number-tests.js`, `stream-bank.js`, `contact-walker.js`, …;
  `sheets.js` holds the sheets, two fisheyes on one array and readers within readers, one block): a moved lab's code, line for line and in the editor's indent, inside one
  function handed over as `(window.TVF_LABS = window.TVF_LABS || {})[name] = function () { … }`. The editor
  (THE LABS THAT LIVE IN labs/, beside `makeRng`) evaluates that function's text by a direct `eval` inside its own
  closure, so the code reads every editor name as it did in the page and wires its own buttons; a script tag, not a
  fetch, so the page still works from disk. `LAB_FILES` maps a lab's data-code to its file; the first press on its
  button (the drawer's, or `?lab=`'s, which presses it too) is held by a capturing listener while the file loads
  and runs, then given back. Moving a lab: a line in `LAB_FILES`, its lines cut to `labs/<name>.js` with the
  header the first one has, and a pointer comment where they were. Code several labs share (`makeRng`, `labComb`)
  stays in the editor. Hook `window.__labFiles` (`files`, `load(name)`, `state`). The ones moved are the groups
  whose code is their own, reached from their own button and named nowhere else (a group's closure from its
  button, less what the editor or another group reaches); each was run before and after (`tools/run-labs.mjs`) and
  reports the same cells, verdicts and status lines (the sheets, which report none, open with the same text). A
  moved lab's `window.runX = runX` console hook moves with it, and its names leave the editor's `window.__lab`
  object and go back on it when its file loads (`Object.assign(window.__lab, …)` at the file's end). Code that
  waited in the page for DOMContentLoaded waits in a file for the end of that file (`labAfterLoad(f)`, queued and
  run after the eval; the sheets'). The second batch split the morph bar's wiring block from the labs' (the labs'
  handlers each their own top-level block). The contact walker's state (`_walk`) and its overlay stay in the editor,
  which draws it every frame; the keyboard sheet's tracing (`keyboardSheet`, `glyphContoursEm`) stays because the
  emoji sheet traces with it, and its font list (`kbdFontList`) because the drawer shows it before any file loads.
  The walker runs on its own timers, so it is not deterministic run to run: it was checked by behaviour (thousands
  of looks, a lap certified, no errors) rather than by exact state. A cut takes a piece's comment block with it; one stops at the piece's last code line, so a
  free-standing comment after it (a section header, a pointer) stays. What stays in the editor even when only labs use
  it: code copied word for word elsewhere (the depth code's `depthLearnedFacing` and `depthEnterWhereNeeded`, which
  the gallery's inspector, depth and where-to-stand pages copy from here) and code two moved files share
  (`tbLeaves`, `pathoShape`, `_shapePrep`, `_firstMeet`, `_occSeen`, `_inside`: the sheets, occlusion and
  encounters). Before cutting a file, check that no name it declares is used by another file in labs/, and that
  no name only labs/ declares is used by the editor; the smoke test's steps that call a moved lab's runner
  (`runDecoderVectors()`, …) load its file first with `__labFiles.load(name)`.
  `tools/measure-labs.mjs` splits the main script into its top-level pieces and finds what only the labs reach
  (by name, as `build-player.mjs` does; `window.__lab`, the `window.runX` exports and the lab deep link count as
  the labs'): about 10,000 of 83,000 lines, 18,000 with the blocks that wire a lab and something else
  (`MIXED=lab`), and the names a moved lab would need from the editor; since the labs moved it also counts `labs/`. `tools/run-labs.mjs out.json [codes…]` runs
  every lab headless (`draw.html?lab=CODE`) and keeps what it reports: `window.__flashLog` (the last 40 status
  lines, kept by `flashStatus`) and `window.__lastLadder` (the last sheet's name and each cell's caption and
  verdict, kept by `labLadder`). The labs' seeded stream `makeRng`/`makeRngCentered` is defined in `draw.html`
  (beside `$`): the library's copy is inside `tvf-core.js`'s closure, which 3d and games copy unchanged, and twenty
  labs had stopped on it since 9 Oct. It multiplies in 32-bit integers (`Math.imul`, 28 Oct 2026): written as a
  float product it passed 2⁵³, lost its low bits and cycled after about 10,500 values from seed 8191, which made
  `lib` and `whr` fail their own tolerances; every lab was run again (`papers/labs.md`, "The run again, after the
  generator"). The library's copy in `tvf-core.js` was mended the same way (Tom: "both"), and with it the copies in 3d and
  games (their PRs follow draw's merge, since their Draw sync checks compare with draw's `main`); so were
  `gallery/growth.html`'s `rng` (its organisms are the same kinds, other instances: brain coral 572 nodes, was 558;
  the front page's thumbnail is the old one, drawn by hand) and the perturbed circle's harmonics in `levels.html`.
  The faults `papers/labs.md` found were dealt with the same day: `rec`'s claim 5 now drops a tick and decodes the
  string; `frn` judges each response in floors of the figure's own (1.5 held, 3 broke, set after seeing the data);
  `bhm` says its seams are exact by construction; `dpt`'s departing circle is the library's 160-point polygon.
- `player/`: **the TVF player** (27 Oct 2026, Tom: "build the tvf-native player"). `tvf-player.js` plays a `.tvfs`
  scene on a canvas (`TVFPlayer.play(canvas, scene or url)`, or `<canvas data-tvfs="…">`; `load`, `poses`, `draw`), next
  to `tvf-core.js`. **Generated** by `npm run player` (`tools/build-player.mjs`): its engine is the editor's own code,
  the functions and constants the player's entry points need taken from draw.html's main script by name with all
  they use (the closure skips locals, object keys, regex literals and property names), unchanged and in the
  editor's order, between a small shim (`state`'s ease, hold, gravity and wind, `morphLive`, `morphRuns`) and
  `player/runtime.js` (loading, the clock, drawing: leaves reconstructed with the kernel at about one point every
  two pixels, exact poses as their cubics, stills through `exactDense`). Names the engine mentions that belong to
  the editor's page are in its `STUBS`; an unknown one fails the build. After changing the morph engine in
  draw.html, run it, or `npm test` fails. A `.tvfs` (`{format: 'tvf-scene', v: 1, name, loop, ease, hold,
  gravity, wind, trail, camera, stops, path, items, morphs}`) is written by the morph bar's **tvfs** button (`morphTvfScene`, hook
  `__box.tvfScene()`): `items` the drawing order (`{morph: i}`, or a still's `leaves` as float32 base64 or its
  `exact` corners, roundings, smooth corners, handles and holes, with fill and stroke), `morphs` each as its keys
  (leaves, or exact corners with `r` and `c`) plus `own`, the autosave's `morphSaveOwn` record, restored by
  `morphRestoreOwn`, and `open` for a live line. Trails (echoes, ribbons) are drawn by the runtime as the editor's `drawMorphTrails` does,
  under the shapes, from the engine's `morphTrailSpan`, `morphTrailTime` and `morphCentreAt`. `player.html` opens one
  (button, drop, `?src=`). A scene's camera frames the canvas (`viewOf` at t), its lines draw on (`drawOn`), and its
  stops wait: the controller's `next()` (a click on the canvas, unless `click: false`) goes on and `prev()` goes back a
  stop, `ctl.stop` says which it waits at, `opts.onstop` is told. `examples/` holds every example on `gallery/animated.html` as a `.tvfs`, and `index.json`
  (its sections, each example's name, note and tags, each file's size), **generated** by `npm run examples`
  (`tools/write-examples.mjs`: each example's scene link opened in a headless editor and `__box.tvfScene()` written;
  `npm run examples -- id …` writes some): after changing an example, the scene link or the `.tvfs` writer, run it,
  or `npm test` fails. The smoke test checks the player poses gallery scenes as the editor does
  (`__box.morphPoses(t)`) to the keys' rounding, and that those files are what the editor writes now.
  The format is specified in `papers/tvf.md` §2.10 (version 1; the player refuses another `v` and ignores fields it
  does not know). The player reconstructs leaves by `TVF_CORE.reconstructFFT` when their count is a power of two
  and keeps each still's outline as a Path2D, rebuilt only when its sample count changes; `npm run measure`
  (`tools/measure-player.mjs`) times every example on an emulated phone (390 × 844 at DPR 3, CPU 1×, 4×, 6×),
  and `player/MEASURED.md` records the numbers before and after (grow 170 ms to 2.5 ms a frame at 1×; all under
  16.7 ms at 4×).
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
- `gallery/`: thirty teaching pages, in reading order: `gallery.html` (the catalogue),
  `bench`, `epicycles`, `snowflakes`, `radiolaria`, `width`, `space` (shape space), `curves` (the
  menagerie), `landscape`, `spiral`, `growth`, `assemblies`, `letters`, `tiles`, `sound` (heard), `motion`
  (the loop), `compose` (composed), `situated` (where you stand), `corner`, `levels`, `depth`, `standpoint` (where to stand), `recovered`, `readers` (between readers), `compile` (compile time), `fail` (where it breaks), `animated`, `embedded`, `played`, `explained`. Also `playground.html` (sculpt
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
  - Each page bundles its JavaScript so it runs from one file. All thirty, and the playground, carry the **same**
    `tvf.js` (`const TVF = (function` … `})();`). The nine *shape* pages (gallery,
    snowflakes, radiolaria, width, landscape, growth, assemblies, letters, tiles) also carry the same rest of the bundle (through the FORMAT module) and the same tile code
    (from `// The loop a tile's strip` to `async function copyText`: spectrum strip, predict
    mode, tile links, editor link). Change one copy, change them all: `npm test` fails and
    names the page that differs.
  - The other twenty-one have their own tile code and extra modules (MOTION, SOUND, COMPOSE,
    STRESS, SPACE, CURVEMOD, SPIRAL, EPICYCLES, SITUATED, DEPTHPAGE, RECOVER, CORNER, LEVELS, STAND, BETWEEN, COMPILE), and no spectrum strip or predict mode. `spiral`,
    `curves`, `space`, `fail`, `situated`, `corner`, `levels`, `depth`, `standpoint`, `recovered`, `readers`, `compile`, `animated`, `embedded`, `played` are *chart* pages (`body.page-chart`: a measurement and a
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
    ease per stretch between keys, 'linear', 'inout', 'in', 'out', 'anticipate', 'overshoot', 'elastic' or null for the bar's: KEYS AT CHOSEN TIMES): what a morph has of its own (EACH MORPH ITS OWN TIME, PATH, COLOUR, TRAIL in `draw.html`, 25 Oct
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
    and the whole reply is one undo step. "animate it" keeps to the drawing (`strict`: a shape it adds that becomes no
    key and no path is left out); **make a scene** (MAKE A SCENE, 27 Oct 2026, Tom: "should we have seperate ways to
    create full scenes from animations", "yes") asks for a whole scene from words in the same vocabulary, its svg opened
    by `openScene` and its copies and morphs landed by `animApply` in the box the svg was drawn in (`sceneBoxOf`). A
    reply's svg is read at its own box size (`animBoxSvg`: `parseSvgExact` reads through the CTM of a 10-pixel host,
    a hundredth of a 1000 box). Requests stream (`apiCall`), or a long answer is cut off at about 100 s (HTTP 524).
    `ANIM_MORPH_FIELDS` is the morph vocabulary both prompts share (`SYS_ANIM`, `SYS_SCENE`): a field added to the
    scene link belongs in it.
    PHYSICAL MOTIONS (27 Oct 2026, Tom: "some animations are rather simple … or more physical, such as a bouncing
    ball", then "this application is better suited to 1 and 2", intricate rigs like a bird being another
    application's): `run.motion = {kind, amount, …}` (`morphMotionOk`), computed, not keyed: `bounce` (gravity's
    parabola, `amount` heights, `squash`), `fall` (dropped `amount` heights, keeping `bounce` of its speed each
    bounce until it rests), `swing` (a pendulum, `amount` degrees, `pivot`), `spring` (a damped boing `along` y, x,
    scale or turn), and since Tom's "1,2": `roll` (across `amount` widths and back, or along its path, turned by the
    distance over its half-width; round a closed path in whole turns so the loop closes), `throw` (gravity's parabola
    to `to: [right, up]` in its heights, its top `amount` heights over the higher end), `sway` (a shear from its base,
    `amount` degrees, the foot still) and `pop` (from nothing to its size, overshooting, `amount` the liveliness 0–1,
    ending exactly at 1). `morphMotionXform` is applied after the path and spin and before a parent (leaves and exact
    corners, handles and radii alike), measured from the placed pose and the first key's size, the ground where the
    shape is drawn; undone in `morphUndoCarry`; saved, in the scene link both ways, in the AI vocabulary and the strip
    (`#mrMotion`). A parent's motion carries its followers too (`morphParentRigid` puts the parent's
    `morphMotionXform` after its rigid map: a hat on a bouncing ball bounces and squashes with it). The gallery's
    **physical motions** section shows one of each, and a hat riding a ball. HANDLES FOR A MOTION (27 Oct 2026, Tom:
    "1,3"): while the strip is up, each selected morph's motion is drawn from its first key with gold handles to drag
    (a throw's landing point and arc top, the arc dashed; a bounce's or fall's height; a swing's pivot, snapping to
    the five places, and its widest swing; a roll's travel when it has no path; a sway's lean), taken before the
    editor sees the pointer (a capturing listener, like draw path), written through `morphMotionOk`, one undo step a
    drag (`morphMotionHandles`, `morphMotionDragTo`; hook `__box.motionHandles()`). ANTICIPATION AND OVERSHOOT: the
    eases (the bar's and each stretch's) also take `anticipate`, `overshoot` and `elastic`, which leave [0, 1] and
    land exactly on 1; two keys extrapolate through their weights, three or more along the stretch's line
    (`morphWeightsOf`, which every pose, colour and centre now uses in place of `morphWeights(morphWarp(…))`); an
    exact pose's radii are kept at 0 or more; `embedFit` frames a sixth past the keys. The strip's stretch buttons
    cycle the eight (shift-click goes back). The gallery's **first steps: anticipation and overshoot** shows them.
    Then (Tom: "2,4,5") MOTIONS IN A ROW: `{kind: 'chain', steps: [motion…]}` (each step with `share`, its part of the
    cycle), each step from where the last left the shape (`morphMotionMap` gives one step and what it leaves, `dx`,
    `dy`, `th`; `morphMotionXform` composes; in a chain a roll goes one way and a drift does not fade). CONTACT WITH
    OTHER SHAPES: fall and bounce take `ground` (their floor in their heights from where they are drawn), and fall,
    bounce, throw and roll take `onto` (a shape's number in a scene link or AI reply, or the strip's **onto** with one
    other shape selected), worked into numbers once from the two boxes (`morphMotionOnto`, `morphShapeBox`; a
    chain's steps from where the ones before leave it), and followed since (CONTACT THAT FOLLOWS, below). EMITTERS: an
    entry's `emit: {count, spread: [across, up] in its heights, vary, seed}` makes count − 1 seeded copies of its keys
    (`spCopyXform`, beside the original in the drawing) as ordinary morphs with their own phase and varied numbers
    (`morphEmitExpand`, in `applySceneMorphs`; a copy's carried distances refitted to the first's height), and
    `drift` (`to` per cycle, a wobble, grown in and shrunk out at the ends) is the motion for rain, snow and confetti.
    `embedFit` samples each motion over its cycle. The gallery's **chains, contact and emitters** shows them.
    THE PHYSICS BY HAND (Tom: "1,2,3,4"): CONTACT THAT FOLLOWS: a run set onto shapes keeps `run.ontoLink = {raw,
    targets}` (the motion as given, each `onto` a slot in `targets`, the shapes themselves) and works it out again
    when a target's box changes (`morphOntoRefresh`, from `morphMotionXform`, at most every 150 ms; `morphMotionSet`
    for a scene link); saved as `own.onto = {raw, at}` by the targets' places among the saved shapes, written into a
    link as their numbers; a handle or amount set by hand on what the target decides unlinks it (a throw's arc does
    not). COPIES FROM THE STRIP: **copies** and **scatter** clone the selected runs (`morphEmitRuns`: keys and shape
    copied under the map, own settings through `morphSaveOwn`/`morphRestoreOwn`, phase and motion varied, parent,
    facing and contact kept) across the view, one undo step; the scene link's emitter shares `morphRand`,
    `morphVaryMotion`, `morphEmitMap`. CHAINS IN THE EDITOR: **then…** adds a step (a plain motion becomes a
    chain), `#mrSteps` shows the steps by share (click one: `run._step`, which the amount box and the handles work
    on, from where the steps before leave the shape, `morphMotionView`; drag a border for the shares), **× step**
    takes one out. Opening a scene is one undo history (`resetHistory` at the end of `openScene`).
    Then (Tom: "1,2,3") THE MOTION'S PATH: a selected morph with a motion shows its centre over a loop (path, spin,
    motion and parent all in, `morphMotionCentreAt`, `morphMotionTrack`; hook `__box.motionTrack(n)`), dotted, a tick each
    eighth. CHAINS ON THE TIMELINE: each row has its motion's steps as a band along its foot, on the shared clock
    (`morphStepEdges`, `morphCycleShared`), and a chain's borders drag there too (`morphSetStepBorder`, which the
    strip uses as well). SCENE-WIDE GRAVITY AND WIND (`state.morphGravity` 1–4, `state.morphWind` −1–1, the bar's
    sliders, saved, the scene link's `gravity` and `wind`, the AI vocabulary): gravity has hops, falls and throws
    over in 1/√g of their cycle and then rest, and swings round(√g) times (lighter than 1 would need more than a
    loop); wind leans sways and swings its way and carries drifts. The snow and tree tiles have some wind.
    EXPLAINERS (28 Oct 2026, Tom: "can you do explainers with this animation tool?", then "1-3"). DRAWING A LINE ON: a
    clip's `show: 'draw'` (`morphDrawFactor`, `morphDrawFill`) leaves it unseen before its window, draws its outline from
    its start over the window like a pen and brings its fill in over the last 30%, an outline it has not got of its own
    (a filled shape with no stroke) drawn in its fill's colour and going as the fill comes (`drawShapeDrawingOn`, called
    from the shape loop while `sp._draw` < 1); the SVG export writes it as `pathLength="1"` and a `stroke-dashoffset`
    animation. Open exact lines now go live as lines (`run.open`, all keys open with the same corner count, no corner
    pairing; `morphExactCubics(P, open)`, `cubicsToPathD(…, open)`), so an arrow drawn on is a one-key morph. A CAMERA:
    `state.morphCamera = [{t, box: [x0, y0, x1, y1]}]` in page units (`morphCameraOk`, `morphCameraAt`: eased between
    keys, centre straight, size by a constant ratio, held outside), followed while playing or scrubbing
    (`morphCameraFollow`, `morphViewOfBox`; the timeline's **camera** switch, `state.morphCamFollow`), keyed from the
    view as it is (**+ view**, `morphViewBox`), a row of keys on the timeline (drag, double-click to remove); the SVG
    export animates its `viewBox`. STOPS: `state.morphStops` (`morphStopsOk`), red flags on the timeline's ruler (**+
    stop**, drag, double-click); played through (an embed always, the editor when the timeline's **stops** is on,
    `state.morphStopsOn`) the clock waits at each and at the loop's end (`morphStopCrossed` in `morphTick`), and
    `morphStopGo(±1)` goes on or back; in an embed a click, space, → or Enter goes on and ← back. Both are saved
    (`morphStateSave`, so undo too), new each time a first morph starts, in the scene link as `camera: [{t, fit:
    [shape numbers] | 'all', pad} | {t, box: [x0, y0, x1, y1] in the svg's units, y down}]` (`sceneCameraIn`, through
    `window.__sceneBoxOf`; the editor writes boxes) and `stops: [t…]`, in the AI vocabulary and in the `.tvfs`. The
    gallery's **explainers** section has one (`explainer`). Hooks `__box.seek(t)`, `drawn()`, `viewBox()`, `explain()`.
    The morph bar's **link** and **embed** (THE SCENE LINK, WRITTEN BY THE EDITOR, 26 Oct 2026, Tom: "1,2") copy
    what is on the page as a scene link, or as an `<iframe>` of `?embed=1`: `sceneOfEditor` writes the drawing as SVG
    in its order, a live morph's place taken by its keys as they are now (exact keys by `exactSvgD`, leaf ones fitted
    with cubics, each key's own colour), then the paths ridden, and every run's own settings as its entry; all 22
    gallery examples round-trip with identical settings. Not carried: corners paired by hand, and `parentAt`. A field
    added to the scene link belongs in `sceneOfEditor` as well as in `applySceneMorphs` and `SYS_ANIM`.
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
    play), the **explainers** (a square drawn on, a camera to its corner, a stop after each beat; how leaves become a
    curve, the scene of `explained.html`; the Tangent Bridge, the scene of `explained.html?x=bridge`, whose curves are the paper's formulas; in how leaves become a curve the leaves hold and move by `straight`: STRAIGHT FROM KEY TO KEY, each
    stretch of a run's keys blended from its two keys only, so a key repeated holds; saved, in the scene link and the
    AI vocabulary, read by `morphWeightsOf`), the **physical motions** (a bouncing ball, rubber and clay, a hanging lantern, a jelly, a rolling wheel, a toss into a basket, a tree in the wind, bubbles popping in, a hat on a ball), **chains, contact and emitters** (one thing after another, onto the table, snow, confetti), the first steps after. A new example is an entry in `EXAMPLES` (or `SHOWPIECES`, drawn with the
    page's helpers: `around`, `smooth`, `circ4`, `gear`, `hsl`) and an id in a section of `SECTIONS`. It carries
    tvf.js (every gallery does) and reads no leaves itself.
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
  - `played` (27 Oct 2026, Tom: "lets put it to work with its own gallery help page.") is a chart page:
    the TVF player at work and its help. Four cards on top say how to make a scene (the morph bar's tvfs), put it on
    a page (two scripts and `<canvas data-tvfs>`, with that code running beside it), drive it (`TVFPlayer.play`'s
    controller; `load`, `draw`, `poses`) and what a `.tvfs` holds; then a wide panel to open or drop your own and
    scrub it; then every file in `player/examples/`, built from its `index.json`, each tile a canvas and a
    controller of the player's, started when first in view and paused out of view (a click pauses one).
    **copy embed code** gives the two scripts and a canvas at `https://reportbase.github.io/draw/`. It is the one
    gallery page that loads scripts beside it (`../tvf-core.js`, `../player/tvf-player.js`), since that is what
    it shows; it still carries `tvf.js` like the rest. Hook `window.__played`.
  - `explained` (28 Oct 2026, Tom: "build the scrolling explainer page") is the last page (`body.page-explained`, not a
    chart page): how leaves become a curve, as a scrolling explainer. Five beats of text down the left (`.beat`, each
    with `data-from` and `data-to`, a stretch of the loop between two of the scene's stops) and the scene pinned on the
    right (on a phone, on top): `player/examples/leaves.tvfs` (the animated gallery's `leaves`), played by the player
    with its clock set by the reading (`seek(t)` on every scroll: how far the reading line, a little above the middle
    of the window or just under the picture on a phone, is through the beat). A beat's **play this step** plays its
    stretch and waits at its stop; scrolling again takes the clock back. It loads the player beside it, like
    `played`, and carries `tvf.js`. Hook `window.__explained`. With `?src=<a .tvfs>` or `?preview=1` (the scene
    the editor's beats panel left in localStorage, `tvf-explainer-preview`) it is that scene's explainer instead,
    a beat for each stretch between its stops, titled and worded by the scene's `beats`.
    `?x=<id>` opens one of its `EXPLAINERS` (a scene in `player/examples/`, its beats the scene's own, with a lede, a
    title and its paper), and a switcher under the lede goes between them: `?x=bridge` is THE TANGENT BRIDGE (28 Oct
    2026, Tom: "lets create a polished explainer"), the theorem of `papers/tb_classical.md` in six beats, the animated
    gallery's `bridge` tile, every curve computed there from the paper's formulas (the readings at the odd multiples of
    π/N, the kernel in its product form, their sum): a curve F, eight leaves, one kernel turned to each, the sum through
    every leaf, the camera in on the widest gap, then sixteen and thirty-two leaves (each lattice the last one slid half
    a step with new leaves between, since the leaves of 2N are not those of N), the sum equal to F at thirty-two. Beat
    words take a blank line between paragraphs, `**bold**`, `*italic*` and `[a link](address)`, a link into
    `papers.html` drawn as the paper pill.
    AN EXPLAINER'S BEATS in `draw.html` (28 Oct 2026, Tom: "1,2,3,4"): the timeline's **beats…** opens
    `#morphBeats`, a row a stretch between stops, each with a title and words (`state.morphBeats`, kept one more
    than the stops by `morphBeatsOk`; saved, undone, in the scene link and the `.tvfs` as `beats`, in the AI
    vocabulary), ▶ to stand at its start, **frame** to key the camera to the view at its end, × to drop its stop;
    **+ beat here** splits the beat at the clock (`morphAddStop`), **preview** opens the explainer page on it.
    Hook `__box.beats()`.
    A SHAPE FROM A FORMULA (28 Oct 2026, Tom: "1,2,3"): the toolbar's **ƒ** (`#bPlot`, `#plotPop`) plots a program of
    a small language (`plotCompile`, read here, never eval): definitions a line, functions of your own (`F(t) = …`),
    `sum(j, a, b, …)`, juxtaposition as multiplication (`16cos(3t)`, `cos 2t`), π, τ, e and the usual functions; what is
    drawn is `r` (polar, y up, closed over a whole turn), `x` and `y` (a curve in t) or `y` (a graph in x), sampled
    (`plotSample`; a 0/0 hole filled by its limit) and laid as an exact shape with Catmull–Rom cubic edges
    (`plotCtrl`). The program, its range and the map from its units to the page ride on the shape (`sp.plot`: undo,
    autosave), so the panel opened on a plot updates it in place (`plotRelay`, finding the map again from where the
    shape is now). A scene's svg may carry one: any element with `data-plot` (and `data-t0`, `data-t1`, `data-n`,
    `data-cx`, `data-cy`, `data-scale`) is drawn by it (`scenePlotOut`, `scenePlotsIn`). The `.tvfs` still holds the
    geometry, not the formula. Hook `window.__plot` (`compile`, `sample`, `add`, `relay`, `of`).
    IN AND OUT, EACH ITS OWN (28 Oct 2026): a clip's `in: {kind: 'fade' | 'draw' | 'cut', len}` and `out: {kind:
    'fade' | 'undraw' | 'cut', len}`, lengths shares of the loop; with either, `show` is not read, and the five shows
    are the same thing named (`morphClipIO`, which `morphShowFactor` and `morphDrawFactor` read; `morphClipNorm`,
    `morphClipOut` keep and write it). The timeline's shows select adds drawn on then fades, drawn on then taken back,
    and quick fades (`MORPH_CLIP_PRESETS`). In the scene link, the `.tvfs`, the SVG export and the AI vocabulary.
    LABELS INTO LABELS AND SIMPLE MATHS (28 Oct 2026): a morph whose keys are different labels crossfades from one to
    the next at each key's time (its `times`, or evenly over its clip), each part of each label a clip of its own
    (`sceneLabelMorphs`); a label's `x_1`, `x^2`, `x_{max}`, `e^{iπ}` are set lower or higher at 0.7 of the size
    (`sceneTextRuns`, each run traced by `sceneTextRun`). The Tangent Bridge scene uses all three.
    TEXT IN A SCENE (28 Oct 2026): a scene link's (or a made scene's) `<text>` is traced into glyph rings
    (`sceneTextOut`, `sceneTextRings`) and comes in as exact shapes, one per outer ring with its holes, yet counts
    as one shape number (`sceneLabelsIn`: its other parts go after the last shape); a morph on it is made once a
    part, a draw-on clip staggered across them, a camera fit taking them all (`sceneLabelMorphs`). HOLES THAT
    RIDE A STILL: a one-key exact morph keeps its key's holes (`run.holes`), carried to each pose by the affine
    map that best takes the key's corners to the pose's (`morphAffineOf`, `morphHolesAt`); saved, in the `.tvfs`
    (`holes`), drawn by the player, and written in the SVG export as keyhole bridges under `fill-rule="evenodd"`.
  - `index.html`'s cards and thumbnails are written by hand. Adding, renaming or reordering
    a page means updating it, and the "N of 30" crumbs and "next" links in each page.

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
