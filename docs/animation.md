# Animation: the live morph, the scene link and what a scene can hold

Moved here from `CLAUDE.md` (12 Nov 2026), unchanged: the dated notes of what was built, with the names to search for in the code. `CLAUDE.md` keeps the rules; read this before working on this part.

Since 12 Nov 2026 two of the blocks these notes place "in `draw.html`" are files beside it, cut out line for line: THE SCENE
LINK (`openScene`, `applySceneMorphs`, `sceneOfEditor`) is `parts/scene-link.js`, and the AI panel (ANIMATE IT WITH AI, MAKE A
SCENE, `ANIM_MORPH_FIELDS`, `SYS_ANIM`, `SYS_SCENE`, `apiCall`, `animApply`) is `parts/ai-panel.js`. The morph engine followed
the same day (Tom: "1 2 3", the third "move the morph engine into its own file"): everything from MORPH: THE ONE OPERATION THE
FORMAT IS BUILT FOR up to THE MORPH'S OWN SETTINGS, IN THE EDITOR, 4,304 lines and 188 names (the blend, the live morph and its
clock, the eases, corners, holes, paths, physical motions, contact, emitters, clips, the camera and stops, colour, riders,
following and facing, the trails), is `parts/morph-engine.js`. Unlike the other parts the rest of the page calls into it, so
its function ends with `return { …188 names… }` and the page takes them back where the lines stood, `var { … } =
partRun('morph-engine');`. A var and not a const because drawAll runs in the page's first frames, before that line, and asks
`_morphReady` (a var in the engine for that reason: undefined until it has run) whether the morphs are there; a const would
throw where the var reads undefined, as it did inline. The labs step "parts/ are handed over and run in place" fails when the
names the engine declares at its top, its return list and the page's var differ (it reads the declarations with the player
build's own scanner, `declarations` in `tools/build-player.mjs`). `draw.html` went from 67,700 lines to 63,400.

The AI panel was measured for loading on first use the same day (Tom: "1,2", the second "lazy-load draw's AI panel") and
left as it is: `partRun('ai-panel')` took 2 to 4 ms of the page's start in the sandbox, against 37 to 67 for the shapes panel,
and it must run at the start anyway. `captureRedirect` takes `claude_gateway_token` from the address when the sign-in sends
the visitor back, and the scene link reads `window.__animOutline` and `window.__sceneBoxOf`, which the panel sets, when a
scene opens. The shapes panel's cost was its grid of a hundred tile svgs, which is now drawn on its first opening
(`fillShapeGrid` in `parts/shapes-panel.js`); the editor was ready 50 ms sooner for it (265 to 318 ms against 322 to 370,
six loads each from disk).

## The animated gallery, the scene link and the morph engine

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

## Physical motions, chains, contact and emitters

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

## Explainers in the editor: drawing on, a camera, stops

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

## The scene link written by the editor, the animated SVG, tiles that play

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

## Vector text

  - **Vector text** (29 Oct 2026, Tom: "Tvf would be good for vector text effects and morphs", then "Proceed"): the
animated gallery's `text` section (`word-morph`, `word-draw`, `word-pop`, copied to `embedded.html` with the rest).
SUNSET into ZENITH is six exact morphs of three keys (word, word, back) turning a beat apart (`phase`); letters
without counters, since a hole rides one key and does not morph, so a letter with one would fade where the other
word has none. Their outlines are baked as plain paths (`GLYPH_WORDS`; `node tools/glyph-rings.mjs SUNSET ZENITH`
traces them with the editor's own `__sceneTextRings`, a hook added for it, and the repo served on :8792), so
the examples need no font. `word-draw` is ordinary SVG `<text>` traced when the scene opens, drawn on letter by
letter; `word-pop` six letters each with a `pop`; their `.tvfs` are in `player/examples/` (`npm run examples`). Not done: a morph of letters with different numbers of counters.

## An explainer's beats, a shape from a formula, ins and outs, labels and text

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
