# The TVF player, .tvfs scenes and Lottie

Moved here from `CLAUDE.md` (12 Nov 2026), unchanged: the dated notes of what was built, with the names to search for in the code. `CLAUDE.md` keeps the rules; read this before working on this part.

## The player

- `player/`: **the TVF player** (27 Oct 2026, Tom: "build the tvf-native player"). `tvf-player.js` plays a `.tvfs`
scene on a canvas (`TVFPlayer.play(canvas, scene or url)`, or `<canvas data-tvfs="…">`; `load`, `poses`, `draw`), next
to `tvf-core.js`. **Generated** by `npm run player` (`tools/build-player.mjs`): its engine is the editor's own code,
the functions and constants the player's entry points need taken from draw.html's main script by name with all
they use (the closure skips locals, object keys, regex literals and property names), unchanged and in the
editor's order, between a small shim (`state`'s ease, hold, gravity and wind, `morphLive`, `morphRuns`) and
`player/runtime.js` (loading, the clock, drawing: leaves reconstructed with the kernel at about one point every
two pixels, exact poses as their cubics, stills through `exactDense`). Names the engine mentions that belong to
the editor's page are in its `STUBS`; an unknown one fails the build. After changing the morph engine,
run it, or `npm test` fails. Since 12 Nov 2026 the engine's lines are `parts/morph-engine.js`: `editorSource()` in the build reads
`draw.html` with its `var { … } = partRun('morph-engine');` replaced by those lines (`engineLines`, between the file's opening
`= function () {` and the foot where it hands its names back), which is the page as it was, so the player came out byte for byte
the same. A `.tvfs` (`{format: 'tvf-scene', v: 1, name, loop, ease, hold,
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

## Scenes that answer the hand, and Lottie

**Scenes that answer the hand, and Lottie** (29 Oct 2026, Tom: "Let's continue to explore what it can do", then
"1,2,4"; `papers/tvf.md` §2.10, "States and the hand", "Touch", "From Lottie"). In `player/runtime.js`, so a reader
that ignores them draws the scene as before:
- **States and rules**: a scene's `states` (named times), `start`, `autoplay` and `interact` rules (`statesOf`,
  `rulesOf`): `click` (toggle between two states, play once or loop, or go to one), `hover`, `press` (there and
  back), `scroll` (the clock follows the canvas through the window), `load`; a target is a morph's drawn pose
  (`hitAt`: its fill, or a finger's width of its line). A state is only a time, the clock turned toward it at the
  scene's pace (`ctl.goTo`). With two keys a pose ramps from the first at 0 to the second at 1, so two states are 0
  and 1.
- **Touch**: a morph's `touch` (`touchOf`, `touchStep`) can be taken by the hand and let go: `throw` (gravity,
  bouncing off its floor, the lowest its pose reaches, and the frame's sides, then home), `swing` (a pendulum
  about its pivot) or `spring`, from the hand's speed over its last 100 ms; an offset on the pose
  (`touchMapped`), riders carried by their parent's, the morph's clock going on from where it was taken.
  `ctl.whereIs(k)` gives a morph's box in page pixels for tests.
- **`widthUnit: "page"`** on a morph or a still: its line's width in page units, scaled with the view.
- **Lottie**: `player/lottie.js` (`TVFLottie.isLottie`, `toScene`) reads Bodymovin's JSON (shape layers with
  paths, rectangles, ellipses, stars, fills, strokes, groups, rounded corners; solids, nulls, parenting,
  precompositions) by drawing each frame as exact paths, following each path from frame to frame and keeping the
  frames a straight blend cannot stand in for (Douglas–Peucker in time, 0.2 px), coordinates to a hundredth.
  What it cannot read (masks, mattes, effects, text, images, gradients, trim paths, repeaters, merged paths,
  expressions, 3D, time remapping, a vertex count that changes) it leaves out and names in `report.unsupported`.
  Colours from Bodymovin before 4.1.9 are 0–255. `player.html` and the played gallery's panel take a Lottie file;
  `node tools/lottie-to-tvfs.mjs in.json … [--out dir] [--tol px]` writes `.tvfs` files. Measured against
  lottie-web's canvas renderer (its repo's demos, MIT, not committed): within 0.1–1.5 of 255 on the files it reads
  whole; adrock's mask and happy2016's gradients are where it parts. For size: lottie-web's light player is 46 KB
  gzipped, ours with `tvf-core.js` about 48.
  **The lottie page** (`gallery/lottie.html`, 29 Oct 2026, Tom: "Create a help gallery page the show the vtf viewer
  processing a lottie file and animating it. One of the demos should let the user import a lottie file."; page 30 of
  31, before `explained`, on `played`'s styles): two benches of one kind (`makeBench`), each a Lottie's frame as exact
  paths (the importer's own `TVFLottie.drawingAt`, put through the player as a scene of stills: `frameScene`), the scene
  played by the player, a strip of which frames were kept as keys for each path (gold: an outline key, teal: a
  transform key), the tolerance and transform knobs, the numbers (sizes, gzipped through `CompressionStream`, keys,
  time, what was left out), a frame slider and the `.tvfs` to take away. **Process it** replays the work in order
  (every frame read, the conversion, the strip filling in as the scene plays). The first bench has three Lotties of
  our own (`player/interactive/lottie-sample|spinner|blob.json`); the second opens or takes a dropped `.json`
  (`.lottie` zips are not read). Hook `window.__lottie` (`benches.watch`, `benches.yours`: `info`, `set`, `process`,
  `pick`, `readFile`, `load`). A chart page with no curve to edit, like `played`.
  **Smaller scenes** (29 Oct 2026, Tom: "Any options to reduce the size of the lottie to tvf convert.", then "Yes" to
  two of them): ONE SHAPE, MOVED: a path whose outline never changes in its own coordinates (`sig` in `emit`), only
  its map, is one key and a morph's `xform` ({o, t, v: [tx, ty, θ, sx, sh, sy] per key, e, c}, the map split as a
  turn times an upper triangle so a turn keeps its size between keys, taken about the outline's middle `o` so a
  shape that only turns has no translation to key), the parts read from Lottie's matrices
  (`relOf`, `partsOf`), which needs the scene's version 2 (the player reads 1 and 2; `xformPose`, `fillOf`, the
  line width by √|det|). A CURVE OF ITS OWN: every stretch between kept frames (`keyframes`) is straight, or a
  cubic Bézier ease fitted to the frames between (`fitBezier`: x1, x2 on a grid, y1, y2 by least squares, on two
  dozen frames, every frame then checked), or split; the engine's `morphEase` takes `[x1, y1, x2, y2]` arrays
  (`morphBezierEase`, `morphBezierOk`), for shape keys too. Gzipped against the Lottie file: gatin 36 → 7.1 KB
  (Lottie 4.5), adrock 249 → 28 (12), bacon 210 → 106 (52), happy2016 94 → 80 (53), bodymovin 259 → 211 (135),
  the same pixels against lottie-web as before; conversion 0.4–2.4 s. A stretch has one ease for all its parts, so a
  shape whose position and scale Lottie keyed apart takes more keys (the sample's ball, 17 of 60 frames).
- **Examples**: `player/interactive/` (a menu, play/pause, a switch, a button, a card, a line drawn by the scroll;
  the gallery's ball, lantern and jelly with touch on; `lottie-sample.json`, a Lottie of our own, and its scene),
  written with `index.json` by `node tools/write-interactive.mjs`: after changing it or `player/lottie.js`, run it,
  or `npm test` fails. `gallery/played.html` shows them as "you can click", "you can touch" and "from Lottie"; a
  tile whose scene has states is not paused and played by the view. The smoke test drives them with real input.
