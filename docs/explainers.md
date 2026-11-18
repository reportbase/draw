# The explainer page and its explainers

Moved here from `CLAUDE.md` (12 Nov 2026), unchanged: the dated notes of what was built, with the names to search for in the code. `CLAUDE.md` keeps the rules; read this before working on this part.

## explained.html and its first explainers

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
a step with new leaves between, since the leaves of 2N are not those of N), the sum equal to F at thirty-two. `?x=addresses` (29 Oct 2026, Tom: "lets tryout our new explainer in draw
repository for a topic in the essay folder") is ADDRESSES GIVEN, PAYLOADS MET, wander's third essay
(`papers/essays/03-addresses-given-payloads-met.md`) in six beats, the animated gallery's `addresses` tile: twelve
fingers laid evenly by a turn, painted by a stained-glass window, the same window twice as far and twice as large
painting them the same and another painting them otherwise, the fingers carried on to a line one length H away and
landing as the Cauchy (the half-Cauchy plotted from its formula beside it, half the landings below the corner), the
camera out to the last landing fifteen lengths up (median 1, mean 2.55 and climbing 0.44 a doubling), and payloads
arriving at the landings as bars and changing while no landing moves; its paper pill links the essay on GitHub. A
scene opens exact only under 150 shapes, its labels' glyphs counted (`LAZY_MIN_SHAPES` in `loadSvgExact`): past
it every outline comes in as leaves and the `.tvfs` grows fivefold. `?x=turned` is ONE LENGTH TURNED (essay 2, five
beats: an arm raised through a quarter turn, its tip riding the arc with echoes; lowered with its shares h and v and
v/h from ∞ through 1 to 0, the corner; the camera across to a chord, rays from both ends meeting on its circle and the
radius at twice the angle; back, the arc unrolled beside the arm, π/2 × 2/π = 1) and `?x=reading` READING AND
WRITING (essay 1, five beats: a room read from one corner, a half-size room on the same rays; the world scaled by
1.5, no ray moving; one step, the second rays crossing, the room 3.57 steps wide; six strides of 0.7 m writing 15.0 m;
scaled again, the steps unmoved and only the metres moving), both after Tom's "these explainers have a dual purpose,
to exercise the features of the tvf viewer and also to explain the essays": between them paths ridden with echoes,
draw-on and undraw, cut, pop, keys at chosen times, cubic Bézier eases, labels into labels, plotted curves morphing,
and the camera panning and zooming. TWO RULES FOUND MAKING THEM: a clip plays its keys from the first key's time to
the last's across its window, so a last key earlier than the window's end is stretched to it (give the last key again
at the window's end where the pose is to hold); a morph that must hold between keys needs `straight`, since the even
kernel over all its keys overshoots past a repeated key. A clip also holds its first pose before its window: a thing
that should not be seen until it starts needs an `in`. A SCENE'S QUIET FALLBACKS, SAID ALOUD (29 Oct 2026, Tom:
"proceed per your suggestions"): the editor now says these in the console and keeps them in `window.__sceneWarnings`
(`sceneWarn`, beside `loadSvgExact`): a drawing past `LAZY_MIN_SHAPES` opening as leaves, a clip whose last key's time
is under 0.98, and times or eases dropped as not well formed; the AI's scene vocabulary (`ANIM_MORPH_FIELDS`, the clip
line) says to give the last key again; the smoke test checks all three and that a well-made scene says nothing. The
Bridge's keyed clips end on a key at 0.99 since (they ended at 0.93 and 0.98, so its leaves arrived late).
`?x=nearfar` is NEAR AND FAR (essay 4: sixty-four fence posts on the number line, then the reader's lay at H = 8, in
proportion to the corner and a doubling to the same room past it, the in-place lay squeezing the far field between H
and 2H, H made 16 sliding every post along the same lay; each row of posts one open comb line, so 64 posts are one
shape a layout) and `?x=standpoints` MANY STANDPOINTS (essay 6: one eye's ray and its twins on it, a second eye and
the crossing, the target walked through the circle on the baseline with its error patch, the four crossings of the
rays turned ±ε, round at the corner and stretched elsewhere, opening into a ray past about 10 half-baselines at
ε = 0.1, then one counted baseline writing the distance in cm or AU). The new warning caught a fault in the second
while it was made: a walk whose first time equalled its second, its times dropped.
`?x=pictures` is WHERE IT SHOWS UP (1 Nov 2026, Tom: "lets do a top quality explainer with the best features, to test
high end explainiers."; essay 7 and wander's *Readers and Writers* §3), six beats across three panels laid side by side:
a lamp's two-sided beam spun half a turn in a clip with echoes, its twelve flashes popping onto the shore as it passes
(at α + β·tan θ), half within one lamp-distance, the Cauchy plotted under the shore; the shore drawn at c = 2 (marks,
corner rays and law as keys, the corner at arctan 2) and back; a globe's grid, two countries and a rhumb line opened
point for point into Mercator's chart (open lines morphing, a ship riding each path turned along it); twelve stars
crowding forward under aberration at η = 0.8 and 1.6, drawn larger by √D; then all three. Cubic Bézier eases, labels
into labels with a superscript, a camera of 12 keys. Found making it: labels into labels cannot repeat a key (each key
is its own clip, so A, B, A needs a second A); a clip's key times are relative to its own window; a clip holding its
first pose before its window needs an `in` (a path rider given `cut`). Beat
words take a blank line between paragraphs, `**bold**`, `*italic*` and `[a link](address)`, a link into
`papers.html` drawn as the paper pill.

## Watch it through, a dial, a video, highlights

WATCH IT THROUGH, A DIAL, AND A VIDEO (2 Nov 2026, Tom: "whats your take on these explainers. can be a web page or a
video.", then "proceed with your recomendations": the page stays the source, a video is an output of the scene).
**▶ watch it through** (`#watch`, or `?watch=1`) plays every beat in turn, holds `WATCH_HOLD` (1.8 s) at each stop,
then goes on (`ctl.next()`), scrolling the beat played into view; its own scrolling is guarded (`guard`), and a
wheel, a touch or a key stops it. An explainer may carry a `dial` (`{beat, name, min, max, step, t0, t1, read}`):
a range in that beat that pauses the clock and sets it within [t0, t1], its readout `read(value)`; the scroll leaves
it be until the reader scrolls 120 px on (`dialAt`), and it follows the clock through its stretch otherwise.
`?x=pictures` has one for c on the shore (its marks, corner rays and law given linear eases, so c moves evenly; the
count within β 6 of 12 at c = 1, 4 at c = 2). The pictures' beats were cut to one idea and two or three sentences
each. `npm run video -- <id | scene.tvfs> [--out f.mp4] [--size 1280x720] [--fps 30] [--hold 1.5] [--speed 1]`
(`tools/explainer-video.mjs`) writes any scene with stops as an MP4: the player draws each frame in headless
Chromium, the clock through each beat at the loop's pace and held at each stop, ffmpeg encodes it, each beat a
chapter titled by the scene's beats and its words a soft subtitle track (no narration). `pictures`: 57 s, 6
chapters, 1.3 MB, about 90 s to make. Hooks `__explained.watching()`, `startWatch`, `stopWatch`.
HIGHLIGHTS TIED TO THE WORDS (2 Nov 2026, Tom: "proceed"): a beat's `[words](#lit:6-17,19)` names morphs of the
scene by index (a-b a range); on the page it is a dotted phrase (`.lit`) that, pointed at, touched or focused,
takes the clock to the end of its beat (unless in the beat's last part already; the scroll leaves it there as the
dial's does) and calls the player's `ctl.highlight(indices)`: every other morph and the trails dimmed to `LIT_DIM`
(stills, the ground, left as they are), the lit poses ringed in gold (`drawScene`'s `lit`). The scene file is
unchanged by it; the video's subtitles keep the words. `?x=pictures` has thirteen (the flashes, the corner, the
law, the rhumb line, Greenland, the stars …): the indices are the morph list's order, so a morph added before them
in `animated.html` moves them. Hook `__explained.litOf`.

## The later explainers, one by one

`?x=rates` is RATES, NOT ANGLES (2 Nov 2026, Tom: "what explainer do you want to do next", then "yes, build 14"; essay
14), six beats over three panels: a roof's pitch rising flat to twenty-four in twelve and settling at six (a `pitch`
dial on that linear stretch, its readout v/h beside the writer's angle), a point run over the circle on a chord with the
ray from one end and the radius from the middle while θ/sin θ and sin θ/θ are plotted, drawn on in step, toward π/2
and 2/π with keyed dots riding them; the corner at twelve in twelve; a ray swept by equal steps of 7.5° from the eave
popping marks on the post at 12·tan(kπ/24), the Cauchy as a speed; ½ ⊕ ⅓ = 1. Its morphs are added through a helper
that names them, so the beats' `#lit:` indices are worked from the names; a label's later glyphs are appended after
every other morph, so labels are never lit.
`?x=cauchymap` is THE CAUCHY MAP (5 Nov 2026; wander's essay 17, "heat given, paint met"), six beats over six panels:
cos⁴α and cos³α plotted (0.25 and 0.35 at 45°) beside a flat screen one thumb out; a fan at equal angles drawn on ray
by ray as one open line, its marks at s = tan θ crowding at the middle, the half-Cauchy along the screen; evenly spaced
tiles on the same screen and the rays to them, sec²θ against cos²θ = dθ/ds; five seeded random walkers drawn on to a
wall and twenty thousand walk-on-spheres landings (seeded, the exact law) binned under (1/π)·d/(d² + y²); a wall
pattern of three waves seen from d and 2d (each wave × e^(−d|k|), plotted curves as keys, the pattern kept faint
behind), the kernel widening, the amplitudes as bars; (1/π)·sech(ln(d/H)) with dots at one in two, four, eight and
two, four, eight thumbs, and the two maps multiplied over a field of directions and distance ratios. Its shapes and
morphs are put down through helpers that name them (`put`, `add`), so the camera's fits and the `#lit:` indices are
worked from names; it has its own seeded stream, so it takes nothing from the shared `rnd`.
`?x=plane` is ONE PLANE (7 Nov 2026, Tom: "proceed"; wander's essay 18, "Read and write on one plane"), six beats over
four panels: a map spread ×1.6 and twisted 30° under two fingers, the line between them before and after, k·e^(iα) and
ln k + iα; a writer's grid in the quadrant carried point by point onto Euler's plane, ln(z/H) = ln(d/H) + iθ (circles
about the eye upright lines, the 45° ray a level one); a thing turned then scaled and scaled then turned, landing in one
place; a point and its mirrors in the line at 45° and the line at one thumb, crossing at the hot spot; the same grid
laid by the thumb (g = ½ + gd(x)/π, plotted beside it, dots at one, two, four and eight thumbs); and a grid on Lambert's
equal-area map and on the stereographic map about the look, the look turned 60° (wander's FLC): area kept and bent,
angles kept and grown. To stay under LAZY_MIN_SHAPES each family of grid lines is one open line run back and forth
with its turns along the frame, so one morph carries the family; 93 morphs, one `steps` helper for every hold, move,
hold (its eases one per stretch, the stretch back round included, or the editor drops them).
`?x=special` is WHY THE PLANE IS SPECIAL (7 Nov 2026, Tom: "proceed"; wander's essay 13), six beats over six panels:
a standpoint z above a line, eleven directions 15° apart landing as the Cauchy, four walkers (walk-on-spheres, seeded)
and twenty thousand landings binned under it, then a new zero and thumb (x ↦ 0.6x + 1) carrying z, the fan and the law;
a reader at half the radius inside a circle, 24 equal turns landing unevenly, L against the uniform, 2L − U carried
onto the circle's harmonic measure, its mean the standpoint and the landings' centroid half way; the same three rules
at r = ½ on the sphere, one curve in the plane (peak 3) carried to three (harmonic measure 6, 2L − U 7, the Möbius law
9 times the uniform); two wireframe books given quarter turns about the upright and toward you in the two orders,
seven poses each, ending 120° apart; an arrow carried round the octant's loop as straight as the sphere allows,
thirteen poses, home turned 90°; a flat wall where the turn and the walker are one curve, a ball where they part
(0.482 against 0.359 within 45°), and the wedge's corners and near-field third. A scene keeps no stroke widths (every
morph's line is 2), so a curve that another lies on is drawn as a pale filled area under it, not a wider line.
`?x=parties` is THREE PARTIES (7 Nov 2026, Tom: "proceed"; wander's essay 5), six beats over six panels: home's three
edges h, v, v₂ seen from outside and the octant of the sphere a direction crosses, carried point by point (each over
its sum) into the flat triangle h + v + v₂ = 1; the triangle face on, the triple corner at its centre and a true point
(2/9, 2/3, 1/9) off it; its six chambers, the pairs' corners as medians, the near field (h largest) a third; the octant
on Lambert's equal-area map, height lines even in altitude (crowding upward, v ≤ h 0.343) carried to even in height
(½), the three corner curves drawn; rings holding a sixth of the hemisphere each on a flat screen (stretching out of
frame) carried to the equal-area screen (packed under the rim at √2), cos³α beside it with half at 37.5°; the near
field 1/(n + 1) as bars, and a circle in a square grown from 0.7 to 1.3, its sixteen landings keeping their
directions. 47 morphs. A scene draws its morphs in the order their first keys stand in its svg (not the order the
morphs are added), so what must lie under (the chambers) is put down first, whatever its time.
`?x=array` is WHAT AN ARRAY IS (7 Nov 2026, Tom: "1,2"; wander's essay 12), six beats over five panels: `int a[10]`'s
ten slots, the writer's, each a share i/10 of the way and moving when the array grows; a reader two slots out from
its foot, equal steps of turn landing thick near it and thin far along, half the quarter turn within two slots; where
the slots end the paint stops at 0.874 of the turn (0.937 at twenty), the horizon where no length could be found; ten
slots laid on the quarter turn at 9° steps by a writer, their boundaries crossing a post one length away at the
half-Cauchy's quantiles (0.158 … 6.314, the middle at the corner); the reader in code, K = 32 slots of its own painted
by the first element met, a world of 100 stopping its paint at slot 29; and `a[i]` read twice, the ray from home at θ
and the radius from the centre at 2θ meeting on the circle (III.20). 85 morphs.
`?x=kn` is K, NOT N (7 Nov 2026, Tom: "1,2"; wander's essay 16), six beats over six panels: memory's cells with an
address pointing at one, a write raising its value and moving no address, then a reallocation moving every cell and
leaving the pointer on nothing; a reader turning in eight equal steps over a line, its places' boundaries at its thumb
times tan(kπ/16), the world's things doubled from 16 to 32 and every new one landing in the last place; a direction
kept as a pair crossing a post (v/h) and a lintel (h/v), the horizon landing on neither chart's far end; the corner as
a register switch, x below a and 1/x above, bounded by 1 only at a = 1; a running median of v/h settling at 1 while
the mean wanders (a seeded mulberry32 stream, its checkpoints held in the scene); and the cull, sixteen places at
H·tan(kπ/32) sliding a decade as the thumb grows tenfold, half inside it at every H. 53 morphs.
`?x=writer` is WHAT ONLY A WRITER HOLDS (7 Nov 2026, Tom: "1,2,3,4"; wander's essay 15), six beats over six panels:
Bernoulli's bank, (1 + 1/n)ⁿ against log₁₀ n climbing toward e (2, 2.25, monthly 2.6130, daily 2.7146, every minute
2.718279), every stage a fraction; Machin's rays on a post, 1/5 composed four times by tangent addition (5/12, 37/55,
120/119) less 1/239 landing exactly on the corner, Madhava's partial sums zigzagging about π/4; a radius turned once
round coming home against a square growing 20 → 320 and never coming back; (1 + iπ/n)ⁿ for n = 1 … 64 morphing toward
−1; ratios met (1, 3/2, 8/5, 2) with tan 1 and one in e among them, made by none; and the doubles near π, Math.PI
= 884279719003555/2⁴⁸ with π 0.276 of the gap past it. 64 morphs.
`?x=free` is WHAT THE GEOMETRY GIVES FREE (7 Nov 2026, Tom: "1,2,3,4"; wander's essay 8), six beats: a scrollbar's thumb
shrinking with its list beside a quarter-turn dial pushed evenly in ζ and drawn at arctan(sinh ζ) (a thousand records in
7.6/r, 2⁵³ in 37.4/r); sixteen stored depth steps three ways on d/n from 1 to 10⁴ (the standard buffer half within 2n,
log depth even in ratio, the turn about a focus at 100n finest there); a cube face's equal pixels morphing to the grid
laid by turn, each cell's share 1/(1 + u²)^{3/2} (1/5.2 at a corner) against 1/√(1 + u²) (√2); Math.floor's cell for
0.8125 = 0.1101₂ and the binary tiling above it, the soft cut (half kept 3.09 depths coarser, 90% to 10% over 5.5)
against the floor's wall (DYH run 2); 24 seeded keys restacked by hash % 4 → % 5 (21 move) against a hash's circle
(a fifth machine takes 4); and the Kalman variances μ, 1/μ about √(qr) (1.618, 1.133, 4.236). 87 morphs. A key's colour
does not change between two exact keys, so the moved keys are shapes of their own faded in.
`?x=order` is HOLDING IN ORDER (7 Nov 2026, Tom: "1,2,3,4"; wander's essay 11), six beats: sixteen arrivals through an
unknown gain, the gain doubled and each arrival over the last unmoved; one slot, [hold : arrival] a ray crossing a post
one hold out, resting at the corner, the register's steps odd then even; a seeded walk of 80 looks read by the unit
rule, 13 moves and 67 holds; 2,000 arrivals of 10·tan((π/2)U), the hold settling near 10 while the running mean wanders
past 40; a tide of two sines made for the picture (not NOAA's record), the unit rule's turns at its highs and lows and
a trend rule's corners at its inflections; the tide in feet from another datum and cubed, the turns unmoved, read every
look and every third. The essay's own figures (1,622/378, 9.25/16.09, 3.01%/60.58%) are quoted in the words only. 43
morphs.
`?x=paradox` is PARADOXES AS VANTAGES (7 Nov 2026, Tom: "1,2,3,4"; wander's essay 9), six beats: two people a field
apart each reading the other against a hand at arm's length (1/8 and 1/2, both under 1 on one line); the exchange,
√(ratio) ½ and √(product) ¼; Simpson's paradox on Charig et al. 1986's stones (A ahead in each size, behind pooled,
ahead again once both take one mix); the in-place lay's stretches at H·(2 − 2⁻ᵏ), all inside 2H, spread to equal room
and running on; leading digits even (11.1%) against log₁₀(1 + 1/d) (30.1% … 4.6%) and a ruler going logarithmic; the
field scaled by 1.8, the readings unmoved and the metres moving. 102 morphs. The essay's "more points, less seen" entry
was left out: its formula counts N/2 for small N where the essay says every point is seen apart.
`?x=breath` is THREE LOOPS (9 Nov 2026; wander's plan BRL, *Reads and Writes* §1 "A loop of a read and a write" and
essay 18 §9), five beats: on Euler's plane a point up by a turn α, across by a scaling of the thumb λ = ln 4, down,
back, home, and another across first meeting it at the far corner at the same moment; in space two books turned 40°
about the upright and scaled by 1.5, one with both undone (home), one with the scaling left undone (home in direction,
larger); two reads about x and y, 40° each, a book coming home turned Ω = 26.87° (quaternion commutator, checked against
cos(Ω/2) = 1 − 2·sin²(α/2)·sin²(β/2)·sin²φ) and four more loops each the same Ω further, its arrow's tip on one ring;
a ring carried through M = S⁻¹R⁻¹SR at c = 2, α = 40° (the four steps, then M², M³, M⁴, every ellipse from its 2 × 2
matrix, 1.59 × 0.63 after one, 6.26 × 0.16 after four, ζ = 0.4507); and M⁴ at c = 1.7, 1.4, 1.2, 1, the dot on
ζ against ln c reaching nothing and the ring home whole. 40 morphs; book poses by Rodrigues, a third view from higher up.

## An explainer from files

AN EXPLAINER FROM FILES (16 Nov 2026, Tom, of the explainers: "What if an explainer just toured the shape groups.", then
"Or each file is a beat and user just imports them to a compiler as a set of files with natural sort order.", and of what
should happen between two beats, offered a morph, a cut or a camera across them laid side by side, "go with 1"). The
folder is the storyboard: a beat is put in, taken out or moved by naming a file. `explainerCompile(files, opts)` in
`parts/scene-link.js` takes `{name, text}` for each file and returns a scene link's object: the `.svg` files sorted by
`localeCompare` with `numeric` (2-intro before 10-end), each one's drawing wrapped in a `<g>` and laid in the first
file's frame (as it is when the viewBoxes agree, else scaled to fit and centred), `stops` at k/N, `beats` titled by the
file's name without its leading number and its extension (`explainerTitle`; the svg's own root `<title>` first) and
worded by a `.md` or `.txt` of the same name, or the root `<desc>`, and a loop of 4 s a beat (`EXPLAIN_BEAT_SECS`).
Its morphs cannot be written until the editor has made shapes of the svg (one element can be several shapes, a label
several more), so the scene carries a `plan(S, L)` that `openScene` calls once the shapes are in, before the labels'
morphs are made: every shape element was given an id `tvfb|file|element|name` on the way in, which says after the load
which file a shape came from and what it was called, and is put back to the name there.
The pairing, between each file and the next: the shape of the same name first (the id, or the element's `<title>`; a
second shape of one element by its place in it), then those with no name by their order, each with the first left
that is like it (closed with closed, a line with a line of as many corners, exact with exact). A chain of partners is
one morph, a key a file: on the clip's own clock the first key at 0 and again at its beat's stop, each later key at
its file's stop, the last again at 0.99 where the clip runs on past it (a clip lays its first key at its start and
its last at its end, the rule found making the essays' explainers), `straight`, linear where it waits and `inout`
where it turns. A clip begins 0.3 of a beat into the beat its first file is read in and fades in over 0.6 of one (the
first file's are drawn on from 0, over 0.8 of a beat), and ends half a beat after its last file's stop, fading over
that half, so what leaves goes before what arrives has come. A label (`<text>`) is a clip of its own, never a key of
another's: the same words in the next file take its place with a cut at the half beat, anything else fades.
`explainerOpen` opens the scene (`openScene`, asking first if a drawing would be replaced) and says what it made; the
menu's **compile an explainer…** hands it the files chosen, and **preview the explainer** presses the beats panel's
preview. `tools/compile-explainer.mjs` does the same in headless Chromium for a folder and writes the `.tvfs` the
tvfs button would. Not done: `.tvf` files as beats, `<use>` and `<image>` (refused, with the file named), `<style>`
sheets that name the same class differently in two files, and gradients (the editor reads flat paint). The smoke test
(motion) compiles three files given out of order and reads the result in the page.
GATHERED A CHOICE AT A TIME (the same day, Tom, having tried it on the published page: "It only loads a single svg
file"). The chooser was `multiple` and gave several on a desktop; a phone's gives one file to a tap, several only to a
long press. The files chosen are now kept by name (`explainTray`, `window.__explainer.tray` and `add`) and every choice
compiles all of them, so an explainer grows a beat at a time; the menu's line reads **add files to an explainer…** and
**new explainer** empties the tray. The smoke test picks three files one at a time through the menu's own chooser.

## A scene composed in code: tvf-flow.js

  - (18 Nov 2026, Tom: "The draw explainer are interesting. Tvf is better at composing a flow of animations with code.",
then "Let's keep pushing TVF into larger situations. Seems like it is unusually good for code based animations.") The
explainers above were written in code from the first, in `gallery/animated.html`, but each against the scene's own
fields. `breath` gives twenty-two times to one ring as shares of a 0-to-1 loop (0.62, 0.635, 0.64 …), and every block
declares `put`, `add`, `shows`, `track`, `span`, `rel`, `fadeIn`, `drawIn`, `pop`, `one`, `many` and `lit` again. A
beat lengthened early moved every number after it, by hand.
    `tvf-flow.js` is those helpers once, with time turned round: the writer says what happens and for how long, in
seconds, and a cursor carries the time on. `show(thing, { in, dur })`, `go(thing, pose, { dur, ease })`,
`hide(thing, { out, dur })`, `wait(s)`, `look([things], { pad, dur })`; `together(fn)` starts everything inside at
one moment and leaves the cursor at the latest end; `stagger(items, gap, fn)` says the same of each, each `gap`
later; `at(t)` and `now()` for lining one thing up with another. A beat is `beat(title, text, fn, { tail })`, the
scene stopping at its end, 0.8 s after the last thing said unless `tail` says otherwise. `build()` divides by the
total and writes one morph for each thing shown: its clip from when it was shown to when it was hidden (or the end),
with its `in` and `out`; where it moved, its keys laid across that window with the pose given again where each move
starts and at the window's end, `straight`, with `times` and `eases`. `[words](a, b)` in a beat's text becomes
`#lit:` with the morph numbers of `a` and `b`. What could not be played is refused as it is written, naming the
thing: a name twice, a pose that is not there, shown or hidden twice, two moves at once, words naming a thing never
shown.
    `draw` has the few shapes the explainers draw (`line`, `poly`, `rect`, `ring` as n points so one ring can become
another, `text`), and `code(piece)` is the scene link's uncompressed form, so `tools/compile-flow.mjs`
(`npm run flow`) opens a flow in the editor without the gallery page and writes the `.tvfs`.
    The first flow is `flows/pythagoras.mjs`: four right triangles (legs 3 and 4) in a square of side 7, the tilted
c² between them; three slide, none turns (by (0, a), (−b, 0) and (a, −b)), one stays, and the room left is a² and b².
Twelve things, three beats, 11.15 s, 38 KB; the editor took it with no fallback. Its paper is the view's own size:
with no camera a scene is fitted to all its shapes, and a paper three views across (the first try) left the picture
a fifth of the frame. It plays at `gallery/explained.html?src=../flows/pythagoras.tvfs`.
    **The gallery's own explainer, said again** (the same day, Tom: "Proceed with your recommendations": rewrite a real
explainer, add what it needs, then a larger piece). `flows/breath.mjs` is THREE LOOPS with the gallery's geometry
lines unchanged and its times said through the library. A step of the motion part reads both scenes back as what
happens (the shapes; when each thing comes and how; each move, from when to when, to which pose, by which ease; the
camera; the stops; the words and what they light) and they agree: 40 morphs, 79 moves, 11 camera keys, five beats,
to a thousandth of the loop. A hold is not a move, so the gallery's key given again and the library's are the same
thing there. The port needed two things the library lacked: a thing **popped in** (`in: 'pop'`, the editor's pop
motion in a short clip, `show: 'in'`; such a thing is a still) and a **group** (`group(name, things)`: six dots that
a beat's words light as one). It also showed where the library is still awkward: a thing whose moves run through
two beats (the ring) has to have them said in both, in order, and the port keeps the gallery's times as shares of
the loop, so it tests what the library can say, not how it reads. The gallery's block is still the one published;
a gallery page bundles its script, so it cannot load `tvf-flow.js` until `npm run sync` carries it.
    **More of the format** (the second step). `act(thing, motion, { dur, in })` is a motion the editor computes
(bounce, fall, throw, roll …) played once over `dur`, the thing coming as it begins (`in: 'always'` and it is there
from the start); acts said one after another with no gap are a `chain`, each step's share its seconds; `onto` may
be a thing. A thing that acts does not also go from pose to pose. What a thing is given when it is made is checked
against the fields of a morph (`path`, `laps`, `at`, `turn`, `mode`, `rate`, `phase`, `spin`, `emit`, `trail`, `fx`,
`lag`, `follow`, `parent`, `look`) and a thing may be named where the scene wants a number: a path is a shape's,
a parent and a thing looked at a morph's.
    **Only the poses a thing takes are in the drawing.** A shape that is no morph's key is a still, drawn the whole
scene. The sorting flow gave each bar a pose for each of ten places; a bar stood in four, and its other six were on
the picture, every bar looking like the tallest. `build()` now writes the shapes that are keys, the one pose of a
thing never shown, a path ridden and the paper, and counts the scene's numbers again.
    **A scene nobody keys** (the third step). `flows/sort.mjs` shuffles ten bars from a seed, runs a bubble sort
and says each comparison as the sort makes it: the bracket to the pair, the two bars changing places if the left is
the taller. 45 pairs in 9 passes, 30 swaps, 27.9 s, 112 shapes made and 34 KB written; the first pass at reading
pace, the rest faster; the last beat's words are the run's own counts. Change the seed or the count and the scene
follows.
    Not done: a camera that follows a thing (the scene's camera is boxes at times), an emitter or a trail given a
word of its own (they pass through as fields), reusable named moves, and the gallery adopting the library.
