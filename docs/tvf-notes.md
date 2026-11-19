# Notes on TVF as a format

What was learned about the format by using it, as against what its specification says (`papers/tvf.md`). Each note
is dated and says what it rests on. They are about the scene layer (`.tvfs`, §2.10: a drawing and its morphs) unless
they say otherwise. Add to it when work on the format turns something up; correct a note when it stops being true,
and say when.

## From writing scenes in code (18 Nov 2026)

Tom, after `tvf-flow.js`, three flows and the playground: "What different you learn about tvf, that is our format.",
then "Create a tvf note to store your observstions about tvf." These rest on writing the library, porting `breath`
through it, and the sorting flow (`docs/explainers.md`, "A scene composed in code").

**What makes it good to write with a program**

1. **A scene is a function of the time alone.** A morph is keys, their times and a window of one loop; nothing
   accumulates from frame to frame. Any moment is worked out by itself, which is why a scroll can drive a scene
   (`seek(t)`), and why two scenes can be read back as what happens and compared: the gallery's `breath` and its
   port agree move for move (40 morphs, 79 moves), and a test holds them to it.
2. **There is one operation.** A thing moves, turns, grows or changes by its outline becoming another outline.
   There are no tracks of translate, rotate and scale to keep in step. A bubble sort, a proof by rearrangement and a
   book turning in space are all "this outline becomes that one, from then to then".
3. **It is data, in a small vocabulary.** A drawing and a list of short records. A program can make it, change it
   and check it; `tvf-flow.js` is about 300 lines because there was little to cover.

**What it does not do for the writer**

4. **A place is a pose.** With no transform, standing somewhere else is being another shape. Ten bars that may
   each stand in ten places are a hundred shapes written, though only the poses taken are kept (note 14).
5. **Holding still is not said, it is arranged.** A morph plays from its first key to its last across its window.
   To wait, the key is given again and the morph marked `straight`; to hold to the end, the last key is given again
   at the window's end.
6. **Not being seen is not the default.** A clip holds its first pose before its window, so a thing is on the
   picture from the loop's start unless its clip has an `in`.
7. **What is in no morph is drawn the whole time.** A shape that is no morph's key is a still. The sorting flow's
   bars each had poses they never took, and every one of those stood on the picture until `build()` left them out.
   The format has no "defined, not shown".
8. **Everything is named by its number.** A morph's keys are shapes' numbers, a parent is a morph's number, a
   beat's `#lit:` list is morphs' numbers, the camera fits shapes' numbers. One thing added early moves every number
   after it. This, more than anything, is what made scenes written against the fields break when changed.
9. **It falls back quietly.** A value that cannot be used becomes a default and the scene plays. That suits
   playing a file and not writing one; the editor says its fallbacks aloud (`window.__sceneWarnings`) and the
   library refuses instead.

**Limits met**

10. **A thing comes once.** A shape is a key of one morph, and a morph has one window. What leaves and comes back
    is two things.
11. **A thing goes from pose to pose, or is carried by a motion, not both.** The editor's motions (bounce, fall,
    throw, roll, pop) are a morph's `motion` and take its window; a chain puts several in a row.
12. **The camera is boxes at times.** It does not follow a thing; a `fit` is worked out once, from where the shapes
    stand in the drawing.

**Measured the same day** (a flow compiled through the editor, `tools/compile-flow.mjs`)

13. **Colour is carried by the morph.** A red square (`#ff0000`) going to a blue one (`#0000ff`) over a linear
    stretch reads `252, 8, 54` near the start and `89, 0, 243` nine tenths of the way: between the two, not
    switched. So a pose can be a colour as well as an outline. (Not looked at: how the blend is spaced, opacity,
    a stroke's colour.)
14. **Only keys count toward the 150.** The sorting flow at 10 bars writes 112 shapes and keeps 72 (the poses
    taken); at 14 bars 130 kept, 85 KB, exact; at 16 bars 165 kept, and the editor says "165 shapes ... is past 150:
    the drawing opens as leaves, not exact" and the file is 1,622 KB. That is 19 times the 14-bar file, not the
    fivefold `CLAUDE.md` gives for a scene past the limit, since each of these shapes is four corners exact and
    hundreds of leaves otherwise. Compiling took about 3 s at every size.

15. **A label's letters are shapes.** The Fourier flow with a line of words under its harmonic at each of six
    steps was 164 shapes, opened as leaves, 911 KB; without those six labels it is exact and 216 KB. Words that
    change are dear: each version is all its letters again. (Its twelve curves of 241 points each are twelve.)

**What follows from these**

The format is a good thing to compile to and a poor thing to write by hand. What makes it awkward to author
(numbers, keys given again, quiet fallbacks) is what a library removes, and what is left is small enough for a
program to reason about. The limit that matters for larger scenes is note 14: a scene of many simple things that
move among many places reaches 150 keys quickly, and past it the cost is not gradual.

Open: whether a place could be said without a pose (a morph that carries its one key along a line it is given, as
`path` does for a shape to ride) so that a bar in ten places is one shape; whether a thing could have more than one
window.

## K, not N (18 Nov 2026)

Tom: "TVF does something important.  It shows that N is not needed.    K is all you need.  And all the natural world
gets." The letters are wander's, *Reads and Writes* §5 "K and N" (`papers/readers-and-writers.md` there): **N** is how
many items there are, a count, the whole, the dual hemispherical vantage's question; **K** is how many are held, the
read's fineness, laid out as K addresses at the heat's quantiles. "A read never knows N; it knows K." (Claude first
took N for the master's leaves and K for a level of detail, which put both letters on the writer's side; the paper's
meanings are the ones meant.) This note is about the curve format (`.tvf`), not the scene layer above.

Then (19 Nov, Tom): "Cauchy is the great kull, leaves K, compresses N at the horizon". The paper's own sentence,
the same section: "So the Cauchy is a cull: an implementation holding K samples does O(K) work, whatever N." How it
does both halves: the K addresses stand at the quantiles of the even turn, half of them inside one thumb, in
proportion, the other half over everything beyond, in ratios (one in 2, one in 4, one in 8); each address farther out
covers twice the distance of the one before, so the far gathers in rows just under the horizon, and everything past
the last address lands on the one at the horizon. However large N is, unbounded too, it has somewhere to go, in no
more than K places. What the cull gives up, the paper says beside it: sameness. A count that holds N holds every item
as 1/N of the whole, no standpoint favoured; the read's K is spent finest at the corner and coarser each stretch away,
"and that unevenness is the vantage". A TVF curve's leaves are those K places on the turn.

A reading, with what it rests on:

1. **A TVF curve is K and nothing else.** The file is a count of leaves and their values (`TVF N 1 2`, then a row of x
   and a row of y; the header's letter is the file's own and is the paper's K). The leaves stand at even steps of the
   turn, which is the paper's "K places at the heat's quantiles": the uniform turn is the Cauchy in the slope. The
   leaves' positions are the addresses and the values the payload, as `CLAUDE.md` already says of the papers.
2. **N is left behind on the way in and not asked for again.** A drawing arrives as a polyline of however many points;
   it is read at K leaves and those are kept. Drawing at any size, the morph, the ladder of detail (fewer of the same
   K, "nothing precomputed per level", `papers/tvf.md`), and the scenes of the notes above all work from K. Nothing
   downstream asks how many points the drawing had.
3. **The work is by K whatever N.** The paper says it of the Cauchy as a cull (`star-field.html`: the view at N and 2N
   apart by less than 10⁻⁷ at N = 2⁴⁰). TVF is the same for a shape.
4. **It is exact where it says it is.** The reconstruction is exact at the leaves and a partition of unity at every
   count tested (`papers/tvf.md`'s table, N = 8 … 1024; `npm run test:unit`). K rebuilds what K can tell apart, with no
   limit over N appealed to.

So: the paper argues that a read holds K and says nothing of N; TVF is a format made that way and in use, in which N
does not enter.

Two cautions, in the paper's terms:

- **"All the natural world gets" is Tom's expectation, not a result.** Wander's R1062 records the same for non-human
  processes as expected and untested. TVF shows K is enough for a format. That supports the claim; it does not
  establish it for nature.
- **The proof is still the dual vantage's.** *Reads and Writes* §9: the Tangent Bridge is "proved from no standpoint,
  run from one". TVF runs on K with no trigonometric call, and the theorem that says it works was proved in the angle
  chart. What is shown is that the reader does not need N, not that nobody did.

And one thing from the notes above that belongs here: the scene layer's two costs, a pose for every place (note 4)
and the 150 shapes (note 14), are both N coming back, shapes counted and a place stored for each. They are limits of
the scene layer as built, not of K.

