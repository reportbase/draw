# The Labs, Read Back

### *What each lab in the editor's drawer measured, what it found, what the result is called elsewhere, and what in it looks new*

*Written 28 October 2026, from a run of every lab on that day. Revised the same day: the labs moved to `labs/`, the seeded generator mended and every lab run again (§§ "What the run found wrong", "The run again, after the generator"), six faults dealt with, and the seven items that look new searched for in print. Revised 29 October: three labs added from the essays (§§55–57).*

> **Status: a record.** Every number below was read off the editor by `tools/run-labs.mjs`, which opens `draw.html?lab=CODE` for each lab in headless Chromium and keeps what the lab reports: its status line, and the caption and verdict of each cell it lays on the page. Nothing here was copied from a lab's own notes without being run again, except where a section says so (the interactive labs, which report nothing to read back). Where a classical source is named from memory rather than checked, the section says *to check*.

---

## Why this paper

The labs were written over many sessions, each to try one idea about readers, curves and the Cauchy law. Each was named in the words we had at the time, and much of what they found had older names we did not use. This paper puts every lab beside its standard name, so that a reader who knows the classical subject can see at once what was checked, and so that the few things that may be new are not lost among the many that are not.

It was also written so the labs could leave `draw.html`, and they have. The editor's main script was about 83,000 lines, about 10,000 of them reached only from the labs (18,000 counting the blocks that wire a lab and something else); `tools/measure-labs.mjs` measured it. Every lab group in the drawer (56 of its 57 headings; the other is the editor's own paint modes) now lives in a file in `labs/`, 54 files and about 16,300 lines, loaded only when one of its buttons is pressed or `?lab=` asks for it; each section's **In the editor** line names its file. The findings were written down here first, where they can be read without running anything.

## How to read a section

Each of the 57 sections is one heading of the drawer, in the drawer's order. Its title is the plain name of what it does; the drawer's own name follows in italics. Then:

- what the lab does, in standard terms;
- **Found.** what it reported on 28 October 2026;
- **Classical.** the known results it checks or rests on;
- **Ours.** what, if anything, we did not find stated elsewhere, said as narrowly as the evidence allows;
- **In the editor.** the deep links that run it.

The drawer's names keep some words of their day (octave, rung). This paper uses the current ones: **leaves** for the places read, **levels** for the dyadic intervals, the **reader** and the **writer**, the **corner** (the ratio 1, π/4) and the **horizon** (π/2), **home** (the ratio 0) and the **unit circle**. A *standpoint* is the point a reader reads from.

## What the labs found, in brief

**Most of it is classical.** Read plainly, the labs check textbook results, usually exactly and on the whole library of shapes at once:

- tan of a uniform angle is a standard Cauchy variable, so a reading of direction alone carries no trace of the figure (§§29, 31, 41, 46, 47);
- the cross ratio is the invariant of projective maps of the line; ratios of determinants are invariant exactly when they are of degree zero and every point is balanced (the bracket transformation law; §§21, 25, 50, 51);
- coordinates on a line can be built from joins and meets alone (von Staudt; §26);
- reconstruction from uncalibrated views is fixed only up to a projectivity, and one known length fixes the scale (§§30, 35, 36, 48);
- the winding number, the argument principle, the shoelace formula and the discrete Hodge decomposition (§§6, 20, 22, 23);
- delta modulation, mid-tread quantisers, logarithmic quantisers and dither (§§5, 24, 32, 33, 34);
- the Lebesgue constant of trigonometric interpolation, and exact arithmetic in the cyclotomic integers (§54);
- the condition of the orientation determinant (§28) and Robbins–Monro on ordered data (§§32, 43).

Thirty-three of the sections say, in their own words, *Nothing beyond the classical result*; that is the honest reading of them, and their value is as checks of the editor's code.

**A few things look new.** None is a theorem yet. Each is stated where it was found, and each needs a search of the literature before it is claimed:

1. **A curve found from winding numbers alone** (§7): an adaptive quadtree that subdivides only where integer winding readings at a cell's corners disagree, with no distances or normals, and a refinement limit fixed beforehand by the ring's resolution, δ* = (s/2)·tan(π/2C). Every part is known; we did not find the combination.
2. **A one-bit ring that stays silent outside** (§6): read at one bit, the bearing ring of a point outside the curve recorded no change at all over the whole sweep, on all 58 shapes, not changes that cancelled. *Since the search, not new:* a one-bit ring splits the plane by one line through the point, and it is silent exactly when some such line misses the curve, which is the separating line of a point outside a convex hull. The lab's outside point was outside every hull; in a bay of a C-shaped figure the ring would change and cancel.
3. **The near field's own size** (§10): the light from an evenly glowing flat outline, seen on its axis, is set far off by ⟨R²⟩ (its area) and close in by ⟨R⁻²⟩; the exact symmetry between near and far, f(D²/d) = 1 − f(d), holds only for the circle, and its failure is of second order in Q − 1 for near-round shapes.
4. **A straight edge for an instrument** (§37): a geometric ladder of stimuli has a cross ratio fixed at every scale, so a sensor's response can be tested for being linear-fractional without any calibrated reference; it caught an exponent of 1.02.
5. **Corners that hide in the arc element** (§39): curves with hinges (where r′ changes sign abruptly) that share their arc element √(r² + r′²) exactly with a different smooth curve. And the converse, **positive smooth recovery** (§§40, 46): from the arc element alone, damped Gauss–Newton recovered all four smooth figures from blind seeds, the other solution −r excluded by r > 0. Uniqueness is a conjecture with evidence, not a proof.
6. **An address error that does not depend on the landmarks' spread** (§49): sending a place as a cross ratio against three landmarks, the number's own error falls as 1/separation and solving it back grows as separation; the two cancel, so the recovered place is off by about 0.12 elements a pixel whatever the spread, until the spread is under a pixel.
7. **A coordinate for a shape read from its own outline** (§13): the inscribed-angle reading tan(θ/2) from a point on the outline, held in levels, each dyadic interval remapped onto a whole quarter turn. A construction, not a result; its approximation behaviour is classical.

**What a search found.** The seven were searched for on 28 October 2026 (fourteen web searches; the sources below were seen as search results only, not read in full, so a "not found" is weaker than a library search would be). None was found as stated; each is set out in "The seven, searched for", at the end. Item 2 reduces to a classical fact. Items 4 and 6 have close prior work that must be read before anything is claimed (Sanders 1972 and Chuang et al. 2007). Item 5's uniqueness conjecture needs a hypothesis it does not yet state.

**From the essays** (§§55–57, added 29 October, each with its prediction written before it ran). Three claims the essays argue in prose were put to the library. The mean of the angles is not a summary of a direction: read from a height γ it returns atan(m/(1+γ)), pulled toward home, by up to 19.7° on the library, while the median returns the direction (§55). Four quarter-turn arrays under unknown factors can be joined by continuity, a model of the payload, to 0.01% on the median figure, with the leftover fourth seam catching every wrong join (§56). And a reader spanning n places does gain one level of detail per doubling of n on the median figure, but its coarse levels carry fine detail folded down from above, and a figure resolves no more levels than it has (§57).

Smaller and descriptive: the radial and angular codes charge in opposite directions, corners cheap for one and roundness for the other (§5); about a third of the library reads, from its centre, as the ellipse of the same breadth (§9); for about half of it the difference from the circle lies in the levels away from the corner (§11); one stored sample serves a one-pass reader as well as the median does (§27).

## What the run found wrong

Running every lab, and reading each against its claim, turned up the following. Each item now says what was done.

1. **Twenty labs could not run.** *Fixed.* When the curve library moved to `tvf-core.js` (9 October 2026), its seeded generator `makeRng` went inside the library's closure, while twenty labs still called it by name: fac, num, dis, lib, bhm, whg, swm, asm, ste, frn, hng, fig, whr, ost, swt, sdz, sig, sbk, smp and owt, each stopping with *makeRng is not defined*. The editor now defines `makeRng` and `makeRngCentered` itself; the library's copy stays as it is, since 3d and games copy that block unchanged.
2. **The seeded generator was not the generator it meant to be.** *Fixed.* `makeRng` steps s ← (1103515245·s + 12345) mod 2³¹, but it wrote the product in floating point, which passes 2⁵³ and loses its low bits before the mod is taken. The stream it made was not the linear congruential one: from the labs' seed 8191 it fell into a cycle after about 10,500 values, so a lab drawing 60,000 numbers drew the same few thousand again and again. It now multiplies in 32-bit integers (`Math.imul`), which is the intended stream exactly; three labs that carried their own copy (geometry, ownership rule, straight edge) were mended the same way. Every lab was run again; what moved is in "The run again, after the generator", below. The same pattern was in the library's own copy in `tvf-core.js` and in two gallery pages (growth, levels); they were mended too, and 3d and games take the library's copy with it.
3. **A check that cannot fail** (§24, `rec`). *Fixed.* Claim 5 computed a drift of exactly 1 and set the drift after the mark to 0 whatever the data. It now drops one tick from the string, decodes it, and compares the addresses: the drift reaches every later address on 50 of 58 records, and the next mark ends it on 58 of 58.
4. **A tolerance the lab failed** (§29, `lib`). *Fixed by item 2.* The quantile statistic read 3.029 to 3.044 against 3.0777, outside the lab's own 1%; with the generator mended it reads 3.052 to 3.094, inside it on all six figures. The lab's text said eight figures and runs six; it now says six.
5. **No drift by construction** (§30, `bhm`). *Restated.* The chain's seams are solved from exact camera matrices, so the absence of drift over 94 seams says nothing about estimated poses. The lab now says so in its status line and beside the seam.
6. **A power law let through** (§38, `frn`). *Fixed.* A response x^1.7 passed a fixed 15% band on both figures. The band is now each figure's own floor (what the quantity departs by with the instrument as held): within 1.5 floors held, past 3 broke, between them undecided. The power law now breaks on graze200 (6.3 floors) and is undecided on wedge (2.2). The two ratios were chosen after seeing these numbers, and the lab says so.
7. **A band missed** (§41, `whr`). *Fixed by item 2.* The arc element came back within 15.2%, 14.8% and 16.3% on three of four figures, outside the lab's 12%; it now comes back within 5.1%, 4.4%, 7.1% and 6.1%.
8. **The circle departs** (§13, `dpt`). *Explained; no change.* The library's circle is a polygon of 160 points, and its 256-leaf reconstruction does not have constant curvature (it runs from 0.24 to 1.74 of the circle's). Read from a point on that outline, the ratio p(s) is 1.547 at s = 2⁻⁶ and 1.0001 at s = 64: the departure is the polygon's, near the standpoint, where the inscribed reading magnifies it. A closed-form circle (the port check) departs by nothing.

## The run again, after the generator

Every lab was run again with the mended generator and compared, cell by cell, with the run above. Labs that draw no random numbers, or draw them from `Math.random`, reported the same; so did most that use the seeded stream, within their own sampling. These moved by more than that:

| Lab | Before | After |
|---|---|---|
| `lib` (§29) | statistic 3.029–3.044, fails 1% on 6/6 | 3.052–3.094, passes on 6/6 |
| `whr` (§41) | arc element within 15.2, 14.8, 7.6, 16.3% | within 5.1, 4.4, 7.1, 6.1% |
| `sig` (§21) | the account moved the figure on 7/7, median 3.9% | on 6/7, median 4.9% |
| `ost` (§42) | 35 of 44 caught | 33 of 44 caught |
| `owt` (§51) | class counts as listed | 54, 50, 62, every one as the rule says |
| `smp` (§46) | arc element as listed | to 4·10⁻² |
| `sbk` (§45) | as listed | cheap statistic within 0.1%, exchange 1.55 |
| `swm` (§35) | scores as listed | 0.015, 0.018, 0.432, 0.018, 0.016 (the liar still named) |
| `asm` (§36) | 3.6·10⁻¹³ | 3.6·10⁻¹⁵ and 1.2·10⁻¹⁴ |
| `geo` (§25) | distance ratios as listed | moved 16.1% and 6.4% |
| `fac` (§23) | as listed | 49.4% and 69.1% |
| `dis` (§28) | as listed | 38% |
| `bhm` (§30) | every m from 6 to 96 under 5% at the median point | the same but m = 46, at 5.5% |

No pass became a failure. Four cells went from pass to undecided: sprout in `sig`, where the account moved the figure by only 0.8% (its three cells), and m = 46 in `bhm`, at 5.5% against the 5% line. Where a section below quotes a number from the first run that has since moved, the table is the one to read; the sections for the six faults are rewritten.

---

## 1. Scatter

A load generator, not an experiment. It drops a batch of library primitives onto the page with random position, size, rotation and colour, each held at the default 256 leaves, and then zooms the view out by 15%. **Found.** In this run, +100 shapes gave 101 shapes and 25,856 leaves. The batch was built in 57 ms and drew at under 1 ms a frame headless. The drawer's own note records about 16 ms a frame at 100 shapes and 55 ms at 250 in a browser. **In the editor.** `?lab=sca`

## 2. A contact-only maze walker (*the contact walker*)

The scene's shapes become solid obstacles, and an agent moves through them. At each step it proposes a move, and the world answers with one bit: granted or refused. The agent records only that bit and its own odometry (dead reckoning). On contact it follows the wall with the wall on its left. It counts a closed lap round an obstacle as certified only when four conditions hold: its heading has turned through a full turn; the odometry closes; there was contact during the loop; and the bearings of its touches fit in no half-plane. Certified laps become tags. Tags that fall within a guard distance of each other are merged, and the merged count is an estimate of the number of connected obstacles, b₀. Each tag also carries the sign of its lap's turning, ±1. The other buttons do the following:
- *survey*: walks closed loops with a fixed turn per step and reads the winding number about each tag from a one-bit bearing quantiser.
- *walk the course*, *the maze*, *the round maze*, *the spiral*: generated test worlds.
- *import the journey*: turns the latest certified lap into a shape in the editor.

The option η adds odometry noise, whose drift grows as η·s·√(2m) after m steps. The option ε flips the contact bit at that rate.

**Found.** In this headless run nothing was certified, so *survey* and *import the journey* only reported that they needed a certified lap first. *The spiral* reported that the corridor forces 3 full turns of winding on anyone who reaches the centre, whose straight-line distance from the start is 4.4 units. The code's comments record that the round maze's free laps varied by world: 7 on one, 244 on another, and 36 or 244 cancelled laps on two seeds.

**Classical.**
- Wall following solves mazes whose walls are all connected and fails on free-standing islands. Counting the total turn to escape such islands is the Pledge algorithm (Abelson and diSessa, *Turtle Geometry*, 1980).
- Contact-sensor navigation of this kind is the family of "bug" algorithms (Lumelsky and Stepanov, 1987).
- The turning number of a simple closed curve is ±1 (Hopf's Umlaufsatz, 1935).
- Dead-reckoning error grows as the square root of the number of steps (a random walk).

**Ours.** The work is in the engineering: one bit of contact, odometry, and a lap certificate whose four conditions use no map. Counting holes this way is a direct reading of b₀ and b₁ by contact. The forced winding of the spiral is a property of the corridor's topology, set by construction. No new theorem is claimed.

**In the editor.** `?lab=wlk`, `?lab=wrs`, `?lab=wsv`, `?lab=wco`, `?lab=wmz`, `?lab=wrd`, `?lab=wsp`, `?lab=wjr`. Its code: `labs/contact-walker.js`.

## 3. Shape sheet

A fixture: every primitive in the library is drawn once on a grid, giving one reproducible scene that contains smooth, cornered and holed outlines. **Found.** 100 shapes, 27 of them with holes, on a 12×9 grid: 576 contours and 152,576 leaves, built in 98 ms. **In the editor.** `?lab=sht`

## 4. Per-leaf colourings across the library (*leaf-colour tests*)

Five ways of colouring the leaves are each applied to the 73 primitives that have a single outline, at N = 64 leaves per shape. Laid side by side, a colouring becomes a comparison across shapes.
- *slope*: the dyadic band (level) of the tangent slope |dy/dx| at each leaf.
- *position*: the quadrant the leaf lies in, about the shape's centroid. This depends on the frame.
- *bearing*: the quadrant the tangent points into. This is unchanged by translation; it changes under rotation only through which quadrant boundaries the turning crosses.
- *symbol*: the output of the radial log-ratio quantiser at each leaf (see §5).
- *running*: the partial sum of those symbols around the loop.

**Found.**
- *slope*: the circle visits 5 bands (entropy 1.91 bits, half the leaves in the commonest band); the ellipse 4 bands (1.19 bits, 75%); the oval 6 bands (2.45 bits, 25%).
- *position* and *bearing*: the circle, the ellipse and the oval are each 25% per quadrant with 4 quadrant entries.
- *symbol*: the circle is 100% "unchanged" (the corner symbol). The ellipse and the oval are 17% unchanged, 41% up and 41% down.
- *running*: the circle's partial sum peaks at 0. The ellipse and the oval peak at 14 and return to 0.

All 73 cells are descriptive, so there is no pass or fail.

**Classical.** A closed curve whose tangent angle turns monotonically enters each quadrant of directions exactly once, and for a simple closed curve monotone turning is equivalent to convexity. So 4 entries is necessary for convexity but not sufficient: a reversal of the turning that stays inside one quadrant is not counted. The partial sums return to zero because log-ratios telescope around a closed loop.

**Ours.** Nothing beyond the classical results. These are visual instruments.

**In the editor.** `?lab=psl`, `?lab=ppo`, `?lab=pbe`, `?lab=psy`, `?lab=prt`. These are the editor's own paint modes, so their code stays in `draw.html`.

## 5. Two readers: radial log-ratio quantiser and tangent-angle ring (*two-reader tests*)

Each primitive that is star-shaped about its centroid is sampled as a radius r(θ) at L = 512 equal angles, and two quantisers read the samples in turn. Both feed back what they have reconstructed, so they behave as first-order delta (sigma-delta-type) modulators.

The radial quantiser is called "the floor rule" in the code. Its register has 31 states, an odd number so that one state means "no change". Each step quantises ln(rₖ/h), where h is the reconstructed radius held so far, in steps of σ = ln(100)/128 ≈ 0.036, and then updates h to the quantised value. Because log-ratios telescope around a closed loop, the symbols must sum to zero.

The angular quantiser holds the direction of each chord between neighbouring samples on a ring of C = 64 cells. Its cell counts must add up to exactly one full turn.

**Found.** 58 of the 100 primitives qualified. All 58 gave a radial checksum of 0 (±2), and all 58 had a ring that summed to exactly one turn (64/64). Median cost was 0.808 bits per step for the radial quantiser and 0.544 for the angular one. The cheapest radial code was the square's (0.116 bits); the dearest was the snowflake's (2.010). The largest single cell count was 26, and the ring never reached the end of its range. A convex curve's angular cost sits at the binary entropy H(C/L) = H(1/8) = 0.544 bits; concave features cost more than that because their turning reverses.

**Classical.**
- Delta modulation (de Jager, 1952) and sigma-delta modulation (Inose, Yasuda and Murakami, 1962).
- Mid-tread quantisers, which have an odd number of levels, versus mid-riser ones; only a mid-tread quantiser has a zero-change level.
- A sum of differences around a closed loop is zero.
- The tangent of a simple closed curve turns through exactly one full turn (Hopf, 1935).
- With feedback, an exact integer count of turns is guaranteed provided no single step exceeds half a cell's range.

**Ours.** Nothing beyond the classical results; the lab is a check. Two observations are the lab's own:
- The radial code is cheap for corners and the angular code is cheap for roundness, so the two charge in opposite directions.
- On convex shapes the angular cost is the same, H(C/L), for every shape.

**In the editor.** `?lab=two`. Its code: `labs/two-reader-tests.js`.

## 6. Winding numbers about points, at 64 cells and at one bit (*three-reader tests*)

The radial quantiser runs as in §5. Alongside it, two rings track the bearing from a fixed point to the curve: one point is the centroid, inside the curve; the other is 2.5 shape units away, outside it. Each ring runs at C = 64 cells and again at C = 2, where the ring is a single bit and one cell is half a turn. What is measured is the winding number of the curve about each point.

**Found.** 58 of 58 primitives qualified, and on all 58:
- the radial checksum was 0;
- the windings were exactly (1, 0) at C = 64 and again at C = 2;
- the ring for the outside point registered no movement at all at C = 2. It recorded zero cell changes over the whole sweep, not changes that cancelled to zero.

Median cost was 0.544 bits per step for the inside ring, the same on every shape. The outside ring cost 0.232 bits on the circle and 0.184 on the ellipse, growing with the angle the shape subtends from the outside point.

**Classical.**
- The winding number about a point is 1 inside a simple closed curve and 0 outside: the argument principle and the Jordan curve theorem.
- Point-in-polygon tests by angle summation.
- Unwrapping the phase is exact when every step changes it by less than π (Itoh, 1982).

**Ours.** The silence at one bit is a modest observation, which we did not find stated elsewhere. Near enough, it holds because the curve's bearing from the outside point never strays more than a quarter turn from the bearing the one-bit ring started with, so the ring never changes state. Everything else is a check.

**In the editor.** `?lab=tri`. Its code: `labs/three-reader-tests.js`.

## 7. Recovering a curve from winding numbers alone (*recovery tests*)

The winding number about a point p is constant except across the curve, where it jumps by ±1. So the curve is the set where this integer-valued field is discontinuous. The lab reads the winding number at the four corners of a square cell (ring C = 64, 256 samples per curve) and subdivides the cell only where the corners disagree. This is adaptive quadtree contouring. It stops at the scale δ* = (s/2)·tan(π/2C), below which one step of the bearing can exceed the ring's capture range and the winding number is misread: the condition for correct phase unwrapping, at the ring's resolution. The cells that straddle the curve at scale ε give a box count N(ε). N(ε)·ε estimates the curve's length, and the log–log slope of N(ε) is its box-counting dimension.

On a single grid, N(ε)·ε measures the ℓ¹ length in that grid's frame, not the true (Euclidean) length. So the count is repeated with the grid turned to six angles 15° apart and averaged. A second statistic, the *swing*, is the largest over the smallest ℓ¹ reading across those angles. It lies in [1, √2] and measures how concentrated the curve's tangent directions are.

**Found.** 58 shapes were recovered. The median was 28,534 standpoints per shape. The median ratio of recovered to true length was 0.981; 43 shapes were within 5% and 55 within the band [π/4, π√2/4] = [0.785, 1.111]. 3 shapes fell outside that band, because features smaller than one cell are missed. The median box-counting dimension was 1.004. 10 shapes had a swing below 1.02, meaning their tangent directions are spread evenly. The circle came out at 6.283 against 6.282 with a swing of 1.000. The code records that the triangle and the hexagon give the same swing (1.035), since ℓ¹ length sees directions only modulo 180°, and that the square gives √2.

**Classical.**
- The Cauchy–Crofton formula (Crofton, 1868): averaged over rotations, crossings measure length. The code checked that circle, triangle, square, hexagon and star all average to 4/π at 720 angles.
- Grid-based digital length estimators carry a bias that depends on orientation.
- Box-counting (Minkowski) dimension.
- Point-in-polygon tests and quadtree contouring.

**Ours.** The method is assembled from known parts:
- Finding a curve only from where integer winding readings disagree, with no distances, crossings or normals computed.
- A refinement limit fixed in advance by the ring's resolution, δ* = (s/2)·tan(π/2C).

We did not find this particular combination stated elsewhere (to check). Using the swing as a rotation-invariant measure of the spread of tangent directions is a small practical addition.

**In the editor.** `?lab=rcv`. Its code: `labs/recovery-tests.js`.

## 8. Arctangent compression of radius and the log-step quantiser (*cauchy tests*)

For each star-shaped primitive, the true radius and the quantised radius are mapped through v ↦ 2h₀·(2/π)·arctan(v/h₀). Here h₀ is the shape's median radius, so half the samples lie beyond it (beyond the corner) by construction. The code calls this map "the Cauchy lens". Measured against log-radius, the map has slope (4h₀/π)·ρ/(1+ρ²), with ρ = v/h₀; the slope is at most 2h₀/π, reached at the corner ρ = 1. The quantiser keeps |ln(held/true)| ≤ σ/2, where σ = 0.036. By the mean value theorem, the error after the map is then at most h₀σ/π, largest near the corner and vanishing towards home (ρ → 0) and the horizon (ρ → ∞).

**Found.** 58 of 58 shapes respected the bound h₀σ/π on the samples whose log error stayed within σ/2, and all 58 respected the global Lipschitz bound 2h₀/π. On every shape the largest error fell within the level about the corner (½ < ρ < 2). For the circle, the ratio of error to bound was 0.005, since the reconstruction hardly moves. For the ellipse the ratio was 0.966 and for the oval 0.995, so the bound is nearly reached. Median share of the outline beyond the corner: 49.8%, as the median makes inevitable. Median mean of 1/(1+ρ²) over that share: 0.442.

**Classical.** The bound follows directly from the mean value theorem. Under tan, a uniformly distributed angle becomes a Cauchy-distributed ratio, so (2/π)·arctan is that distribution's cumulative distribution function (CDF). Pushing a log-uniform quantiser through a compressing curve resembles companding (μ-law, A-law).

**Ours.** Nothing beyond the classical result; the lab is a check. The one point of interest is that a quantiser with uniform log steps and the arctangent map spend their resolution at the same place, the corner ρ = 1, which explains why the largest error sits there.

**In the editor.** `?lab=cau`. Its code: `labs/cauchy-tests.js`.

## 9. Ratios read from the centre, sampled along the outline (*opening the shapes*)

For each single-outline primitive, points are placed at equal arc length along the outline, and each is read from the area centre as s = v/h = |y − c_y| / |x − c_x|. Four numbers summarise the distribution of s:
- *corner*: the share with s < 1;
- *middle*: the median of s;
- *tail*: 40 × the share with s > 40;
- *head*: 40 × the share with s < 1/40.

Each shape is set beside an ellipse with the same breadth ratio b = max v / max h. As a control, the points are also placed at equal angles from the centre instead of equal arc length.

**Found.** 73 of 100 primitives qualified.
- The circle gives exactly ½, 1, 2/π and 2/π (0.500, 1.000, 0.637, 0.637).
- The ellipse with b = 0.6 gives 0.589, 0.760, 0.470 and 0.783. The oval (b = 1.667) gives the reverse of the ellipse: 0.411, 1.316, 0.783, 0.470.
- The corner and middle matched the ellipse of the same b within 0.02 on 26 shapes, within 0.1 on 21, and were further off on 26.
- Placed at equal angles, every shape gives the circle's four numbers exactly.

**Classical.** If the angle is uniform, tan of it is Cauchy-distributed, so the circle sampled at equal arc length, which is equal angle, gives the half-Cauchy law of |tan θ|: median 1, P(s < 1) = ½, and tails (2/π)/s. The control is trivial, because s depends only on direction. Swapping v and h turns b into 1/b and the corner share c into 1 − c, as the ellipse and oval show.

**Ours.** A catalogue rather than a theorem. It measures how far equal-arc-length sampling moves a shape away from the Cauchy law, and finds that about a third of the library is described by the ellipse of the same breadth ratio to within 0.02. We did not find this comparison made elsewhere. It is descriptive.

**In the editor.** `?lab=unc`. Its code: `labs/opening-the-shapes.js`.

## 10. On-axis irradiance from a uniformly glowing flat outline (*near and far*)

A flat outline that glows uniformly, as a Lambertian emitter, is viewed from distance d on the axis through its area centroid. The received share is f(d) = (1/2π)∮ R(θ)²/(R(θ)² + d²) dθ, where R(θ) is the outline's radius in direction θ. This is the formula for a disc, s²/(1+s²) with s = R/d, averaged over direction.
- Far away, f ≈ ⟨R²⟩/d². This is the inverse-square law, set by the area.
- Close in, 1 − f ≈ d²⟨R⁻²⟩, set by the mean of 1/R², which the drawer calls the *harmonic reach*.

The lab reports four quantities:
- Q = ⟨R²⟩⟨R⁻²⟩.
- The half-light distance d½, where half the light has arrived. The code calls it the *middle*.
- D = (⟨R²⟩/⟨R⁻²⟩)^¼, the distance at which the near and far approximations meet; the code calls this a *corner*.
- How far f fails the symmetry f(D²/d) = 1 − f(d), measured about d½. The code calls this test *the flip*.

**Found.** 69 shapes qualified; 4 were left out because the centroid lay outside them or the outline crossed itself.
- The circle has Q = 1, d½ = D = 1, and the symmetry holds exactly.
- 38 shapes kept the symmetry within 10⁻³ with d½ within 2% of D. 22 more kept it within 0.02. 9 had two distinct crossovers, typically long, thin or grazing outlines.
- Medians over the non-circular shapes: Q 1.133 and d½/D 1.000. The worst symmetry failure in the median shape lay 1.30 levels from d½.
- The ellipse with b = 0.6 gave Q = 1.1333 and D = 0.751 against d½ = 0.750. These match the closed forms Q = (a² + b²)/(2ab) and D = (2a³b³/(a² + b²))^¼.

**Classical.**
- The on-axis view factor of a disc is R²/(R² + d²), and the contour integral for a parallel planar region is the standard configuration-factor result (Lambert's contour method; to check for the exact citation).
- Q ≥ 1 by the Cauchy–Schwarz inequality, with equality only for constant R.
- That the far field depends only on area is classical.

**Ours.** Several points we did not find stated in this form:
- The near-field coefficient is ⟨R⁻²⟩, so the two limits measure two different "sizes".
- The exact near–far symmetry holds only for the circle.
- For near-round shapes the symmetry error is of second order in Q − 1, as the code's prototype records.

These are modest results; the near and far limits themselves are classical.

**In the editor.** `?lab=nfr`. Its code: `labs/near-and-far.js`.

## 11. Where a shape differs from the circle, level by level (*the shape, octave by octave*)

Each primitive is again sampled at equal arc length and read from its centroid as s = v/h. Each reading is assigned:
- its side of the corner;
- a dyadic level, counted outward from the corner (s in [2^−(k+1), 2^−k] before the corner, and 1/s in the same intervals after it), with levels past the twelfth lumped together;
- a place within that level, one of 16 steps.

The lab compares this histogram with the circle's and adds up the absolute differences level by level. It reports the cumulative share of the total difference seen by levels 0, 2 and 4. It also reports the difference carried by level 0 per unit of the circle's share there. The circle puts 0.41 of its readings in level 0, which is 2·(2/π)·(π/4 − arctan ½).

**Found.** 72 of 100 shapes qualified. The median cumulative share of the difference seen by levels 0–5 was 0.30, 0.56, 0.73, 0.84, 0.91 and 0.94. Level 0 holds 0.41 of the readings and carries a median 0.73 of the difference per reading. 37 shapes show their difference mostly away from the corner (under 0.8 per reading), 17 mostly near it (over 1), and 14 lie between. Four hinge shapes read exactly as the circle at this resolution: hinge3, hinge4, hinge5 and hinge7. Of the first cells: the ellipse and the oval saw 0.22, 0.75 and 0.91 by levels 0, 2 and 4, with 0.53 per reading in level 0; the egg saw 0.11, 0.29 and 0.47, with 0.26 per reading. The code records an earlier prototype that gave 0.26, 0.54, 0.75, 0.86 and 0.93 with different binning.

**Classical.** Under the Cauchy law, dyadic levels of the ratio carry geometrically shrinking mass in the tails. Comparing histograms on logarithmic bins is standard.

**Ours.** The finding is descriptive and holds for this library only: for about half the shapes, most of the difference from the circle lies in the outer levels, not the corner level, and roughly 90% is seen within five levels. This is not a theorem, and 17 shapes go the other way.

**In the editor.** `?lab=oct`. Its code: `labs/shape-octave-by-octave.js`.

## 12. Reading a stretch from the share of ratios below 1 (*the corner reads the breadth*)

The lab samples each single-outline primitive evenly by arc length, reads every sample as the ratio |y − c_y| / |x − c_x| about the area centroid, and stretches the outline in y by b = 1.5, 2, 3, 5 and 10. It then reads b back from the share p of ratios below 1 (the corner). It does this three ways. The **even share** inverts the circle's law, b = 1/tan(πp/2). The **shape known** reading inverts the shape's own empirical quantile function. The **along the stretched outline** reading lays the samples evenly along the outline after it has been stretched (`runCornerReads`, `_octReadings`).

**Found.** 73 of 100 primitives were read. For the circle the even share is off by 0.02% and the shape-known reading by 0.07%. Over the library the median error in b is 13% for the even share, 0.03% for the shape known, and 28% along the stretched outline. The even share is within 5% on 20 shapes, within 20% on 28, and worse on 25. The ellipse (21%) and the oval (35%) come out red by construction, because they are already anisotropic before the stretch. Laid evenly by direction instead of by arc length, the share is exactly ½ for every shape and every b, so it carries no information.

**Classical.** On a circle, uniform arc length is a uniform angle, and tan of a uniform angle is Cauchy-distributed. Recovering a scale from a sample quantile is inverting the Cauchy distribution function. The same quantile against the shape's own empirical distribution is exact for any shape. That is the probability-integral transform.

**Ours.** Nothing beyond the classical result. The lab is a check, and it measures how much the circle's rule misreads other shapes: a 13% median error.

**In the editor.** `?lab=crb`. Its code: `labs/corner-reads-the-breadth.js`.

## 13. Multilevel interpolation of a shape's departure from its osculating-scale circle (*depth of a shape*)

A reader stands on the outline. The standpoint is the point nearest the shape's mean-radius circle about its centroid, where the tangent is within 10° of square to the radius and the curvature is at least 0.2. The reader reads one side, s = v/h from 0 (along the tangent) to ∞ (straight across). On a circle read from a point on it, the inscribed angle gives v/h = tan(θ/2) (Cauchy spacing). The lab stores the ratio p(s) of the shape's h to the circle's h, 2s/(1 + s²), at each s.

p is held in levels:
- Level 0 is one even-reflected trigonometric interpolant in θ = arctan s, at 16 nodes.
- Each dyadic interval [2^(k−1), 2^k] (an octave in the code) is then remapped onto the whole of [0, ∞]. The remap is linear in s, or in 1/s, on each half.
- Each remapped interval holds the residual left by the levels above it, to level 3, over s ∈ [2⁻⁶, 2⁶].

**Found.** 24 of 73 outlines were scored. The other 49 have no admissible standpoint, or their outline folds behind itself as seen from the standpoint. Held to 5% of the departure:
- by level 0: none;
- by level 1: 23;
- by level 2: 1.

Past the level that holds, each further level cuts the error at least fivefold, except reuleaux at level 2. The port reproduces the earlier Python run to 1.6·10⁻⁴. The rank correlation between the level needed and the sharpest turning is −0.26, so it is not the predicted positive link. Even the library circle shows a departure of 0.547 and a level-0 error of 0.65. The cause is the library's circle itself: a polygon of 160 points, whose 256-leaf reconstruction has curvature from 0.24 to 1.74 of the circle's. Read from a point on it, p(s) is 1.547 at s = 2⁻⁶ and 1.0001 at s = 64, so the departure sits beside the standpoint, where the inscribed reading magnifies the polygon's facets. The closed-form circle of the port check departs by nothing.

**Classical.** This is hierarchical (multilevel) interpolation on a dyadic partition, in the spirit of multiresolution analysis (Mallat 1989). The fast fall per level for smooth residuals is Jackson-type convergence of trigonometric interpolation.

**Ours.** The coordinate system is our construction: the inscribed-angle reading from a point on the outline, with dyadic intervals in s each remapped to a full quarter turn. We did not find it stated elsewhere. The approximation behaviour is classical.

**In the editor.** `?lab=dpt`. Its code: `labs/depth-of-a-shape.js`.

## 14. How a child interval's nodes lie in its parent (*the nested fisheye*)

Each dyadic child interval holds W = 256 nodes at the Cauchy quantiles of its own quarter turn. The lab counts those nodes in eighths of the parent's coordinate f. f is linear in s below the corner and linear in 1/s above it.

**Found.** Every child from −4 to 5, and a child of a child, gives the same counts: 40 36 29 23 23 29 36 40 (11 of 11). The counts are symmetric about the child's midpoint. Each half maps exactly proportionally (ρ = 2f, 1/ρ = 2(1 − f)), with a worst error of 1.1·10⁻¹⁶. Across children 0 and 1, the parent's own node density varies by 1.60×; far out it is flat (1.00×).

**Classical.** The counts are 256·(2/π)·[arctan((j+1)/4) − arctan(j/4)], which is the Cauchy distribution function on quarter steps. The symmetry is the invariance of the Cauchy law under s ↦ 1/s. The 1.60 is the ratio (1 + 1)/(1 + ¼) of the Cauchy density between the ends of [1, 2].

**Ours.** Nothing beyond the classical result. The lab is a check that the remap does what it was built to do.

**In the editor.** `?lab=nfe`. Its code: `labs/nested-fisheye.js`.

## 15. Discontinuities at the boundaries of interval-supported corrections (*walls*)

Each level's correction is supported only inside its own dyadic interval. Where the residual is not zero at an interval's end (a wall), the reconstruction jumps there. The lab tests two synthetic functions at level 2, at both ends of one interval: ψ has nonzero detail at every wall, and χ itself steps at every wall. It does this first with one side entered, then with both.

**Found.** All 8 cells match the earlier recorded runs (WNZ, WN2, JMP). The jump, in level units, goes from one side entered to both:

| Function, wall | One side | Both sides |
|---|---|---|
| ψ, far wall | 0.118 | 0.034 |
| ψ, near wall | 1.320 | 0.002 |
| χ, far wall | 1.116 | 0.012 |
| χ, near wall | 0.952 | 0.097 |

At the parent's corner the two children are images of each other under s ↦ 1/s. So detail that is even under the reciprocal cancels in the jump, and detail that is odd adds.

**Classical.** These are boundary discontinuities of block-local approximation: the blocking artefact of block transforms, and the jumps of a Haar-type basis. The parity argument is elementary symmetry.

**Ours.** Nothing beyond the classical result. The lab is a check on this particular decomposition.

**In the editor.** `?lab=wal`. Its code: `labs/walls.js`.

## 16. Fixed-count range quantisation: Cauchy-spaced against logarithmic (*learning a shape from its encounters*)

Five pathological shapes are placed D = 4 to 128 units (h) ahead. For each ray that meets a shape, the reader keeps only the distance to the first hit. That distance is quantised to one of 1,024 values, in one of two ways:
- **One sweep:** one interpolation sweep of 1,024 nodes, tan-spaced and therefore densest around ratio 1.
- **Nested:** 16 dyadic intervals of 64 nodes each, which is in effect a floating-point quantiser with a 64-step mantissa.

The true outline is the reference.

**Found.** Over 30 cells, the nested quantiser's worst relative error is flat with distance, with a median of 0.74%. The single sweep has 0.31% at 4 h and 7.4% at 128 h, a growth of ×23.4, and it is the finer of the two only up to about 8 h. The verdicts are 21 holds and 9 marginal (the single sweep better, close to home).

**Classical.** A logarithmic or floating-point quantiser has relative error independent of magnitude (Goldberg 1991; μ-law companding, ITU-T G.711). A quantiser uniform in arctan has relative step proportional to (1 + s²)/s, which is least at s = 1.

**Ours.** Nothing beyond the classical result. The lab is a check.

**In the editor.** `?lab=sit`. Its code: `labs/learning-a-shape-from-its-encounters.js`.

## 17. Ray visibility of curled and spiral outlines (*what a reader cannot see*)

A point of the outline counts as seen if the ray from the standpoint meets the outline there first. The lab looks from outside, 32 h away, over 16 orientations pooled together. It also looks from inside, from the area centroid when that lies in the hollow. Eleven shapes are tested, from an ellipse and a lobed control to curls and spirals.

**Found.** From outside:
- elongated2 is 49% seen from one view;
- lobed3 is 28% from one view;
- both reach 100% once the 16 orientations are pooled.

Of the 11 shapes:
- 5 are seen whole from outside;
- 3 need the inside view as well;
- 3 spirals stay partly hidden from both: spiral3 92% seen, spiral4 73%, spiral5 66%.

This agrees with the earlier Python run: curls of 290° and 310° reach 82% and 63% from outside alone, and 100% with the inside view.

**Classical.** Point visibility in polygons, and its covering version the art gallery problem (Chvátal 1975). Deep pockets need guards inside them. This is also why silhouette-based reconstruction cannot recover concavities (Laurentini 1994, the visual hull).

**Ours.** Nothing beyond the classical result. The lab is a check on the library's pathological shapes.

**In the editor.** `?lab=occ`. Its code: `labs/what-a-reader-cannot-see.js`.

## 18. Nested standpoints and the reader's coordinate lay (*readers within readers*)

These four labs are interactive overlays with no scored run:
- **Readers within readers (`nsr`):** places child viewpoints where the parent saw farthest, up to three children each, and colours the outline by the generation that first sees it.
- **The strange tier (`stg`):** applies the same rule to eight outlines with many hidden sides, such as a Hilbert curve, fjords and a double spiral.
- **The octave browser (`ocb`):** draws a shape in the reader's coordinates. Ratio and distance are each kept proportional up to 1 and folded by the reciprocal past it, one dyadic interval at a time.
- **Signals as landscapes (`sgl`):** applies the rule to a 1D signal seen from height h, where crests hide what lies behind them.

**Found.** No headless numbers. From the notes, the generation needed is spiral5 level 6 and Hilbert level 7. It counts how many times the way in turns out of sight, not how intricate the outline is. Placing the same number of viewpoints without nesting does not get further.

**Classical.** Visibility-based exploration and next-best-view placement. The generation count resembles link distance in polygons (to check). Terrain viewsheds are the signal case.

**Ours.** Nothing claimed. These are tools for seeing the rule.

**In the editor.** `?lab=nsr`, `?lab=stg`, `?lab=ocb`, `?lab=sgl`. Its code: `labs/sheets.js`.

## 19. Storing the multilevel representation in TVF, adaptively (*depth in TVF*)

DTV writes each scored shape's level 0–3 representation as concatenated TVF documents, one per interval, addressed by `#meta address`. It reads the file back and compares it with a single interpolant using the same number of values (breadth alone). DWN enters an interval only where the residual at its nodes exceeds τ times the departure. WLS explains and fixes errors near interval ends. DTS saves one shape and DTL loads a file.

**Found.**

*DTV.*
- A full file holds 518 sweeps, 8,288 values and about 138 kB, whatever the shape.
- The round trip changes the reading by at most 2.3·10⁻⁷ of the departure.
- The levels beat a single interpolant at the same count on 24 of 24 shapes. For the circle the errors are 1.7·10⁻⁷ against 1.0·10⁻⁵.

*DWN.*

| τ | Sweeps (median) | Size (median) | Worst miss |
|---|---|---|---|
| 10⁻³ | 9–30 (14) | 4 kB | 9.4·10⁻⁴ |
| 10⁻⁴ | 24–58 (31) | 8 kB | 9.9·10⁻⁵ |
| 10⁻⁵ | 43–111 (59) | 16 kB | 1.0·10⁻⁵ |
| 10⁻⁶ | 79–244 (127) | 33 kB | 6.2·10⁻⁶ |

At τ = 10⁻⁶ the miss is at the full file's own floor.

*WLS.* Scored over the whole range, the full file misses by more than 10⁻⁵ on 9.1% of it, with a worst miss of 0.15. The cause is that each level's even-reflected interpolant has zero slope at its ends, while the residual it is handed does not. A writer that adds the least correction making each residual flat at its children's ends (children ±12) misses by more than 10⁻⁵ on 0.0% of the range. Its worst miss is 9.9·10⁻⁶, at 317–1,398 sweeps (median 787). The ends themselves still stop at level 1. With that writer, the levels still beat a single interpolant on 24 of 24 shapes, by 4× to 4,900×.

*DTS.* On the headless page DTS reported "folds: hidden behind itself". The shape on the page had no admissible standpoint, so nothing was saved.

**Classical.** Adaptive and nonlinear approximation beats a fixed uniform one for detail spread across scales (DeVore 1998). Tolerance-driven refinement is standard practice. Even extension forcing zero end slope is the Neumann behaviour of cosine series and DCT-II.

**Ours.** The file layout, and the slope-matching writer as an engineering fix within that format. No new mathematics.

**In the editor.** `?lab=dtv`, `?lab=dwn`, `?lab=wls`, `?lab=dts`, `?lab=dtl`. Its code: `labs/depth-in-tvf.js`.

## 20. The closure and cycle sheets (*the sheets*)

These are two interactive overlays:
- **The closure sheet (`cls`):** reads a closed polygon from a standpoint you drag, and splits each edge's complex ratio into a radial part (the product of length ratios) and an angular part (the turning).
- **The cycle sheet (`cyc`):** takes a graph of pairwise log-ratios and splits it, by least squares on the graph Laplacian, into a gradient part (one common ground explains it) and a cycle remainder that no ground can explain.

**Classical.** The first sheet shows the argument principle and winding number, and the shoelace formula. The second is the discrete Hodge decomposition (as used in HodgeRank, Jiang, Lim, Yao and Ye 2011).

**In the editor.** `?lab=cls`, `?lab=cyc`. Its code: `labs/sheets.js`.

## 21. Cross-ratio shape signature (*the signature*)

This lab takes the cross-ratio of the four rays from a fixed point to three fixed outline points and a moving one, along the contour. It compares the signature before and after a random projective map.

**Found.** Seven primitives (circle, Reuleaux, two grazing figures, teardrop, astroid, shield, sprout), each held, restated by a projective map and described. The map moved every figure, by 3.9% at the median (2.6% to 8.1%). The signature moved by 2.2·10⁻¹⁵ at the median, at most 3.0·10⁻¹¹ (the astroid, whose cusps put the moving ray near a fixed one). Built from four points and four cross products, it tells a figure from another without measuring either.

**Classical.** The cross-ratio of a pencil of four lines is invariant under projective maps, and it is the basis of projective-invariant shape signatures (Mundy and Zisserman 1992).

**Ours.** Nothing beyond the classical result.

**In the editor.** `?lab=sig`. Its code: `labs/signature.js`.

## 22. Telescoping products, winding numbers and the shoelace formula (*closure tests*)

Every representable primitive is read as a closed polygon from two standpoints: the vertex centroid, and a point well outside. Around the loop the lab accumulates:
- Π |z_{k+1}| / |z_k|;
- the turning Σ arg(z_{k+1} / z_k);
- the cross-product sum Σ D.

It also checks graphs of pairwise log-ratios: networks built from a ground, the same plus a uniform twist, and an intransitive ring.

**Found.** 71 of 100 primitives were read:
- the product equals 1 to 10⁻⁹ on 71 of 71 at both standpoints;
- the winding is an exact integer on 71 of 71;
- the winding falls to 0 outside on 67 of 71;
- Σ D does not move with the standpoint on 71 of 71. For the circle Σ D = 6.2816, twice its area.

The 4 marginal cells are probably shapes whose vertex centroid does not lie inside the curve, so their winding was already 0 there (to check). In the cycle checks:
- networks built from a ground close: 4 of 4;
- a uniform twist of 0.12 leaves exactly 0.12 on each triangle: 4 of 4;
- an intransitive ring is explained by no ground: 4 of 4.

**Classical.**
- The product telescopes, because log |z| is single-valued.
- The turning is 2π times the winding number (the argument principle).
- Σ D is the shoelace formula, which does not depend on the origin.
- An edge flow is a gradient if and only if it sums to zero round every cycle. The least-squares split is the discrete Hodge decomposition.

**Ours.** Nothing beyond the classical result. The lab is a check.

**In the editor.** `?lab=clt`. Its code: `labs/closure-tests.js`.

## 23. Orientation is not in the radial distances (*facing tests*)

The lab compares each closed primitive with its mirror image, both read from their centroids. Two things are read: the stream of distances from the standpoint to the outline, and the winding number of the outline about that point. The editor calls the sign of the winding number "the facing". A second test tries to predict the winding number from scale-free features of the distance stream alone, at 1,320 random standpoints, using a nearest-neighbour classifier with the test shape held out.

**Found.**
- **Mirror test:** on 55 of 100 primitives the distance stream came back bit-identical and the winding number negated. That is 54 exact collisions: the same readings with the opposite orientation.
- **Predicting the sign:** the direction of winding was predicted on 48.0% of standpoints, against 50% chance.
- **Predicting enclosure:** whether the outline winds round the standpoint at all was predicted on 68.3%, against a 60.3% base rate.

**Classical.** A reflection is an isometry, so every distance is unchanged while orientation reverses. Distances determine a configuration only up to the full Euclidean group, reflections included; this is the basis of distance geometry and classical multidimensional scaling (Schoenberg 1935; Torgerson 1952). The winding number is the standard index of a closed curve about a point.

**Ours.** Nothing beyond the classical result; the lab is a check. The small amount of information about enclosure in the distance features is an empirical note about this library, not a theorem.

**In the editor.** `?lab=fac`. Its code: `labs/facing-tests.js`.

## 24. Encoding the log-radius as ticks and threshold crossings (*record tests*)

The lab encodes the radial function of each star-shaped primitive (256 equal angles about the centroid) as a symbol string, in the manner of logarithmic delta modulation:
- a signed tick each time log r moves one quantisation step ln β (β = 1.2);
- a mark each time r crosses the median radius.

It then checks five claims:
1. the string is unchanged when the radii are multiplied by 0.37 to 100;
2. the marks fall at the same samples for β = 1.05, 1.2 and 1.6;
3. the accumulated ticks rebuild log r to within half a step;
4. two readers can recover the ratio of their step sizes from their tick counts alone;
5. a lost tick spoils every later address until the next mark.

**Found.** 58 of 100 primitives qualify.
- Claims 1–3 held on 58 of 58.
- Claim 4: the median error was 2.7% with fine steps (1.02 against 1.04), within 10% on 47 of 58. It was 37% with coarse steps (1.15 against 1.45).
- Regular polygons with small radial swing produce no ticks at β = 1.2, so they cannot transfer anything.

- Claim 5 (since the re-run): one tick is dropped from the string, which is then decoded. The drift reaches every later address on 50 of 58 records (on the other 8 the dropped tick is the last before a mark), and the next mark ends it on 58 of 58.

Two of the claims hold by construction, so they are checks of the code rather than findings:
- Claim 1: the reference scales with the radii.
- Claim 2: the marks never depend on β.

Claim 5 also held by construction when this paper was first written: it computed a drift of exactly 1 and set the drift after the mark to 0 whatever the data. It now decodes the damaged string.

**Classical.**
- Delta modulation (de Jager 1952, to check) and level-crossing sampling.
- Any test of the form x > c is invariant when x and c are scaled together.
- Counting crossings of a lattice of levels with spacing s estimates total variation divided by s. This is the Banach indicatrix (Banach 1925), and it is why the estimate in claim 4 is asymptotic in s.

**Ours.** Nothing beyond the classical result. The lab's own correction is useful: the transfer of step sizes is a fine-step limit, not an exact identity.

**In the editor.** `?lab=rec`. Its code: `labs/record-tests.js`.

## 25. What survives similarity, affine and projective maps (*geometry tests*)

The lab takes 47 primitives, places 14 points on each, and keeps three things:
- the sign of the 2×2 determinant D on every triple of points (the chirotope, in oriented-matroid terms);
- the cross-ratio of four lines through a standpoint, computed as a ratio of products of four such determinants;
- a harmonic set of four points on one line.

These are compared before and after a random similarity, an orientation-preserving affine map, and a mild projective map. Ratios of distances are tracked as a control.

**Found.**
- The determinant signs were kept 100.0% under all three maps.
- The cross-ratio was exact under all three maps.
- The harmonic cross-ratio read −1 on 188 of 188, and still on 188 of 188 after the projective map.
- Distance ratios moved 18.3% on average under the affine maps and 6.7% under the projective ones.
- A mirror flipped every determinant sign (100.0%).

The projective maps were drawn so that no point crosses the line sent to infinity (w ≥ 0.15). Without that restriction, signs would flip for points on the far side of that line.

**Classical.**
- Orientation predicates (signs of determinants) are invariant under affine maps of positive determinant. Oriented matroids formalise the full sign pattern (Björner, Las Vergnas, Sturmfels, White & Ziegler 1993).
- The cross-ratio is the fundamental projective invariant. Its expression through determinants (bracket algebra) is standard (Richter-Gebert 2011, *Perspectives on Projective Geometry*).
- Harmonic sets have cross-ratio −1.
- Lengths and angles are not projective invariants.

**Ours.** Nothing beyond the classical result; the lab is a check, and the editor's "disagreement" D is the orientation determinant.

**In the editor.** `?lab=geo`. Its code: `labs/geometry-tests.js`.

## 26. Arithmetic on a line from joins and meets alone (*number tests*)

The lab builds a projective scale by ruler alone. It fixes three points Z, U and W on a line, which play the roles of 0, 1 and ∞. Using only lines through two points and intersections of two lines, it constructs:
- the integers, each as the fourth harmonic point of the previous two against ∞, by the complete-quadrangle construction;
- negatives, as harmonic conjugates against 0 and ∞;
- reciprocals, as harmonic conjugates against 1 and −1;
- sums, by a midpoint followed by a doubling;
- products, by a chain of two perspectivities.

Every point is then checked against its projective coordinate, the cross-ratio (Z, U; W, X). The whole construction is repeated after a random projective map, to confirm that it commutes with that map.

**Found.**
- Integers 2–12 came out on 11 of 11.
- Negation, reciprocals, sums and products each came out on 4 of 4.
- The worst departure from the exact value was 3.2·10⁻¹⁴.
- The construction commuted with 24 of 24 projective restatements, with a worst positional disagreement of 2.3·10⁻¹⁴.

**Classical.** This is von Staudt's construction of coordinates on a projective line from incidence alone: *Geometrie der Lage* (1847) and the "algebra of throws" in the *Beiträge* (1856–60). Hilbert's segment arithmetic (*Grundlagen der Geometrie*, 1899) is the affine analogue. The fourth harmonic point by the complete quadrangle is textbook material. Commuting with projective maps is immediate, because those maps preserve incidence.

**Ours.** Nothing beyond the classical result; the lab is a careful numerical check of von Staudt's construction.

**In the editor.** `?lab=num`. Its code: `labs/number-tests.js`.

## 27. Which threshold a one-pass reader can use (*reference tests*)

This lab extends the record tests. It asks which reference a reader that sees the samples one at a time (a "serial" reader) can mark crossings against. There are three candidates:
- the median of all samples, which needs the whole stream;
- the first sample, which needs one stored value;
- the current quantised level, which needs nothing extra.

Each is tested for invariance under rescaling the radii (by 0.37, 2.5 and 100) and under changing the step (β = 1.05, 1.2 and 1.6), and the number of marks it produces is counted.

**Found.** 58 primitives qualify.

| Reference | Same marks after rescaling | Same marks at every step size | Mean marks |
|---|---|---|---|
| Median | 100% | 100% | 12.0 |
| First sample | 88% | 100% | 10.9 |
| Current quantised level | 76% | 3% | 38.4 |

Fifteen primitives touch their reference without crossing it. The first-sample failures are of that kind: samples exactly equal to the reference, whose comparison flips under floating-point rescaling. Examples are the square, the hexagon and the gear.

**Classical.** A threshold that is a fixed sample of the signal scales with the signal, so comparisons against it are invariant. A threshold tied to the quantiser depends on the step size by construction. Hard-limiting against a reference, and the fragility of ties and tangencies, are standard in level-crossing and zero-crossing analysis.

**Ours.** Nothing beyond the classical result. The practical point is plain: one stored sample, never updated, gives step-independent marks as well as the median does, without holding the whole stream.

**In the editor.** `?lab=ref`. Its code: `labs/reference-tests.js`.

## 28. Error in the orientation determinant as two points close in angle (*the disagreement, drawn*)

The editor's basic quantity, V_A·H_B − V_B·H_A, is the 2×2 orientation determinant: twice the signed area of the triangle formed by the standpoint and two points.

The lab rotates the second point towards the first, from 69° apart down to 0.7° apart (labelled "1°" in the editor). At each separation it rounds both points' coordinates to a logarithmic grid with step ln 100/128, a relative step of about 3.7%. It reports the median relative error of the determinant over 200 random pairs.

**Found.** The relative error grows roughly as the inverse of the angle once the angle is small.

| Separation | 69° | 34° | 17° | 7° | 2° | 0.7° |
|---|---|---|---|---|---|---|
| Twice the area | 1.0718 | 0.6493 | 0.3398 | 0.1377 | 0.0460 | 0.0138 |
| Median relative error | 0.9% | 1.1% | 1.7% | 3.0% | 11.5% | 31.7% |

A comment in the code records why the median is used: single pairs gave a non-monotone series of 1.7, 2.6, 0.5, 6.1, 17.7 and 3.8%.

**Classical.** The determinant is twice the signed area. Its relative error under perturbed inputs is governed by its condition number, about 1/sin(angle), which is catastrophic cancellation. This is why robust geometric predicates use adaptive or exact arithmetic (Shewchuk 1997; Higham 2002, *Accuracy and Stability of Numerical Algorithms*). The lab's own reading ties this one law to the need for well-spread points in triangulation, which is classical good conditioning.

**Ours.** Nothing beyond the classical result; the lab is a check.

**In the editor.** `?lab=dis`. Its code: `labs/disagreement-drawn.js`.

## 29. Direction ratios from a uniform turn are standard Cauchy for every figure (*the library, as it comes home*)

Six library figures are read from their centroids at 60,000 uniformly random angles: circle, clover, wedge, spoon, graze200 and hinge5. (The editor's description said eight; it now says six.) Each figure is met at its own random angles.

Each reading is the ratio of the two Cartesian components of the radius vector, (r sin a)/(r cos a) = tan a. The radius r cancels, so normalising (1, tan a) back to unit length returns the unit circle whatever the figure. The lab plots a histogram of the readings and a quantile statistic, (q₉₀ − q₁₀)/(q₇₅ − q₂₅). For the standard Cauchy this statistic is tan(0.4π) = 3.0777.

**Found.**
- Every figure's normalised readings returned to radius 1 to 2·10⁻¹⁶. The radii sent ranged from 0.00 to 1.16.
- About 98% of readings fell within ±30.
- The quantile statistics are 3.052 to 3.094, within the lab's own 1% of 3.0777 on all six figures. The statistics equal those of tan a on the same angles alone, as they must.
- On the first run they were 3.029 to 3.044, all low and all failing 1%. The cause was the seeded generator, which cycled after about 10,500 values (see "What the run found wrong", item 2); `Math.random` gave 3.056 to 3.111, and so does the mended generator.

**Classical.** If the angle a is uniform, tan a is standard Cauchy. The ratio of the two coordinates of a point depends only on its direction, so the figure cannot enter. Möbius invariance of the Cauchy family is McCullagh (1992).

**Ours.** Nothing beyond the classical result. The lab illustrates that a direction-only reading carries no radial information, so reconstructing from it alone must return a circle.

**In the editor.** `?lab=lib`. Its code: `labs/library-as-it-comes-home.js`.

## 30. Chained projective reconstruction with many 1D cameras (*the figure, by how many read it*)

A clover of 1,200 points is observed by a chain of m one-dimensional projective cameras (2×3 matrices), with m running from 1 to 96. Each reading is the camera's image coordinate, quantised to a logarithmic grid with step ln 100/128.

Each window of three consecutive cameras triangulates its own stretch of 1200/(m − 2) points, by the null vector of a 3×3 system, in its own unknown projective frame. Consecutive frames are registered through the two cameras they share. The whole chain is finally brought to the truth by a homography fitted to four points.

**Found.**
- Below three cameras there is nothing to reconstruct.
- For m = 6 to 96 every reconstruction passed. The median departure was 0.7–4.7% of the figure's size, with no trend in m, although the points per stretch fell from 300 to 12 and the seams rose to 94.
- The code estimates that a window would run short of points (seven needed) only beyond about 170 cameras.

The absence of drift holds by construction. The seams are solved from the exact camera matrices, not estimated from noisy data, so registration adds no error. In real incremental reconstruction the camera poses are estimated, and errors accumulate along the chain; bundle adjustment exists to correct that.

**Classical.**
- Reconstruction from uncalibrated views is determined only up to a projective transformation (Hartley & Zisserman 2003).
- One-dimensional cameras and three-view (trifocal) reconstruction: Faugeras, Quan & Sturm (2000).
- Chaining partial reconstructions through shared cameras is incremental structure from motion.

**Ours.** Nothing beyond the classical result. The "swarm scales" conclusion holds only for exactly known registrations, and the lab now says so: its status line and the comment at the seam say that the chain does not drift because of how it is built, not because the run found it.

**In the editor.** `?lab=bhm`. Its code: `labs/figure-by-how-many-read-it.js`.

## 31. Direction ratios carry no radial information (*the figure the ratio never carried*)

Six radial functions r(a) are each sampled at 60,000 equally spaced angles:
- the unit circle;
- an egg;
- a clover;
- a "violent" clover with radius 0.30 to 3.32;
- a hinged figure;
- a figure reaching to 0.02 of the standpoint.

The lab compares the quantile statistic (q₉₀ − q₁₀)/(q₇₅ − q₂₅) of the readings (r sin a)/(r cos a) with the standard Cauchy value 3.0777.

**Found.** All six gave 3.0777, matching to 0.00%. This holds by construction, not empirically: r cancels from each reading to rounding, so the six streams are the same numbers tan a. The 3.0776 printed as "the circle's own" is a truncation of the constant 3.077684, and the 3.0777 is the quantile of the equally spaced sample.

**Classical.** The ratio y/x of a point is tan of its polar angle and does not depend on its distance. Equally spaced angles give the quantiles of tan of a uniform angle, which are the standard Cauchy quantiles.

**Ours.** Nothing beyond the classical result; the lab is an identity shown on a page. Its stated moral is sound and elementary: any statistic of direction ratios is independent of the figure, and the shape must come from the radial coordinate.

**In the editor.** `?lab=fbl`. Its code: `labs/figure-the-ratio-never-carried.js`.

## 32. Coarse logarithmic quantisation and a streaming quantile estimate (*where the geometry goes*)

A five-lobed radial profile exp(c·cos 5a) is quantised logarithmically at 128, 64, 16, 8, 4 and 2 steps per decade. At each step size the lab reports:
- how many levels the figure occupies;
- the share of samples at level zero (ratio 1);
- the median difference between two samples, as a share of the swing;
- a "corner" estimated by a three-register stochastic quantile tracker run on quantised standard-Cauchy draws, whose upper quartile should be 1;
- the error of a cross-ratio-like four-point form evaluated with that estimated corner.

**Found.**

| Steps per decade | Levels occupied | Share at level zero | Median difference | Estimated corner (target 1) | Error of the form |
|---|---|---|---|---|---|
| 128 | 49 | 1% | 35% | 1.09 | 17% |
| 64 | 26 | 1% | 34% | 1.00 | 2% |
| 16 | 7 | 10% | 36% | 0.50 | 91% |
| 8 | 5 | 21% | 36% | 0.13 | 100% |
| 4 | 3 | 43% | 47% | 1.14 | 35% |
| 2 | 1 | 100% | 0% | −0.63 | 96% |

The median difference stays at about a third of the swing until a single level remains, then drops to zero. The quantile tracker becomes unreliable well before that. The lab notes that the finest setting is under-iterated.

**Classical.**
- Logarithmic quantisation, and its bounded relative error of about half a step.
- When the step exceeds the signal's range, every sample rounds to one value.
- The tracker is a Robbins–Monro stochastic-approximation quantile estimator (Robbins & Monro 1951). Its bias and slow convergence at coarse or fine step sizes are expected.

**Ours.** Nothing beyond the classical result. The non-monotone corner estimates (1.09, 1.00, 0.50, 0.13, 1.14, −0.63) are a property of this estimator and its iteration budget, not a law.

**In the editor.** `?lab=whg`. Its code: `labs/where-the-geometry-goes.js`.

## 33. Logarithmic quantisation of a radial profile, coarse to fine (*the figure, rung by rung*)

The clover's radial profile, taken from its centroid at 720 angles and normalised by its median radius, is quantised logarithmically. The step starts at 2.5 times the profile's largest |log r|, so every sample rounds to 1 (the unit circle). It then halves repeatedly, down to the editor's standard step ln 100/128 (2.9% a step). The lab draws each quantised figure and reports the largest absolute departure from the true profile.

**Found.**

| Steps across the figure | 1 | 3 | 5 | 9 | 17 | 25 (editor's step) |
|---|---|---|---|---|---|---|
| Step size per level | coarser than the whole swing | 54.8% | 24.4% | 11.5% | 5.6% | 2.9% |
| Largest departure (share of the unit) | 46.4% | 30.1% | 12.6% | 6.3% | 3.5% | 2.3% |

The error tracks roughly half a step times the local radius, as a uniform quantiser must.

**Classical.** Uniform quantisation of log r, a logarithmic quantiser of the μ-law/A-law family in spirit, bounds the relative error by about half a step. Its error falls in proportion to the step. With a step larger than the range, the output is constant, here the unit circle.

**Ours.** Nothing beyond the classical result. The lab's framing, that a level of detail is the quantisation step and that the coarsest level of detail of any figure is its median circle, is a description of logarithmic quantisation about the median radius, not a new result.

**In the editor.** `?lab=rbr`. Its code: `labs/figure-rung-by-rung.js`.

## 34. Quantisation of the log-radius and its dead zone (*where the detail turns*)

These three labs hold a figure's log-radius (a clover sampled at 720 directions) with a uniform quantiser of step σ, anchored at the first sample. In other words, it is a mid-tread quantiser whose zero sits at "home". The quantity varied is the ratio R = swing/σ, where the swing is the log of largest over smallest radius.

**Found.** Let u ∈ [−1, 1] be where the anchor sits in the swing. The record is silent (every sample rounds to the anchor, so the figure is drawn as a circle) exactly when R < R* = 1/(1+|u|). That is the point where the largest departure from the anchor reaches σ/2. In `crs`, u = +0.54, R* = 0.649, and all 11 cells agree; the twelfth is the reference figure. Just past R*, the record carries a negative share of the shape (worst −7%): the quantisation error is briefly larger than the signal. In `hom`, eleven anchors are used at R = 0.75: 4 are silent and 7 speak, and R* held in every cell. In `rip`, a ripple (23 cycles a lap) alone behaves as predicted: absent below R = 0.5 and whole above 1. The same ripple riding a lobe five times larger is carried nearly whole in the median over 72 anchors below its own threshold, so 2 cells fail the registered prediction (verdicts 2/4/6). Its spread, from the 10th to the 90th percentile, shrinks roughly as 1/R.

**Classical.** The dead zone of a mid-tread quantiser is elementary. A large signal acting as dither, which makes a small component unbiased on average but noisy, is the dither result (Roberts 1962; Schuchman 1964).

**Ours.** Nothing beyond the classical result. The labs make the point that the threshold depends on the anchor, which here means where the first look laid the unit.

**In the editor.** `?lab=crs`; `?lab=hom`; `?lab=rip`. Its code: `labs/where-the-detail-turns.js`.

## 35. Detecting an outlier party by projective invariants (*the swarm, and the one that lied*)

Five parties each reconstruct one stretch of a figure, plus 20 shared landmarks. Each reconstruction comes from three 1D projective cameras (2×3 matrices; the "readers") and is known only up to its own plane projectivity. The parties are chained into one figure through cameras they share. One party (number 2) was given a different figure (a five-pointed star).

**Found.** The chain through shared cameras fuses all five parts without any residual, the false one included: it is exactly determined, so it checks nothing. The landmarks are the check. Each party computes the five-point projective invariant [012][034]/[013][024] on the landmarks in its own frame. It then takes the median of its relative disagreement with each other party. Scores were 0.012, 0.009, **0.440**, 0.010 and 0.012, and party 2 was named.

**Classical.** Projective reconstruction from three 1D views: Quan and Kanade (1997); Faugeras, Quan and Sturm (2000). Five coplanar points have two independent projective invariants, ratios of 3×3 determinants: classical invariant theory, used in vision by Mundy and Zisserman (1992). Median-based outlier rejection: Hampel (1971), with the median's 50% breakdown point; consensus checking: Fischler and Bolles (1981).

**Ours.** Nothing beyond the classical result. The lab separates "exactly determined joins certify nothing" from "redundant shared observations can audit".

**In the editor.** `?lab=swm`. Its code: `labs/swarm-and-the-one-that-lied.js`.

## 36. Merging projective reconstructions through shared cameras (*the shape, assembled*)

A clover is cut into four stretches that do not overlap. Each stretch is reconstructed by its own triple of 1D projective cameras, in that triple's own projective frame. Neighbouring triples share two cameras and no scene points. The parts are joined by solving, for each pair, the homography that makes the shared cameras agree.

**Found.** The joined figure matches the original on a five-point projective invariant to 3.6×10⁻¹³ (threshold 10⁻⁶). It is still visibly a projective image of the clover, not the clover. After fixing the frame with four point correspondences (a homography has 8 degrees of freedom), every point lands on the original to 4.3×10⁻¹² of its size.

**Classical.** Reconstruction from uncalibrated views is defined only up to a projectivity, and a homography is fixed by four points in general position (Hartley and Zisserman 2003). Merging partial reconstructions through common cameras is standard in structure from motion. The 1D-camera case is Quan and Kanade (1997).

**Ours.** Nothing beyond the classical result; the lab is a check, done exactly.

**In the editor.** `?lab=asm`. Its code: `labs/shape-assembled.js`.

## 37. Testing an instrument for a Möbius response with a constructed cross ratio (*the straight edge*)

Four values s, sr, sr², sr³ have cross ratio (1+r)²/(1+r+r²) at any scale s. The lab passes such geometric ladders (r ≈ 10, jittered) through a candidate instrument response f. The readings are quantised logarithmically (step ln100/128). The lab takes the median of the signed departures of the measured cross ratio over 240 scales spanning 0.01 to 2. A departure above 0.2% flags f as not linear-fractional.

**Found.** Identity −0.01%, gain 0.00%, a bilinear "bridge" +0.11%: all three pass. The power laws x^1.02, x^1.05, x^1.10 and x^1.30 give −0.34%, −0.81%, −1.55% and −3.89%; a tanh limiter gives −7.22%. All five are caught, and the score grows with the nonlinearity. The comments note that the jitter in r is needed: four marks a whole number of quantiser steps apart round in phase and give a false zero.

**Classical.** The cross ratio is invariant exactly under linear-fractional (Möbius) maps of the line (Möbius 1827; von Staudt). Using it to detect nonlinearity or distortion is known in camera calibration ("straight lines must be straight", Devernay and Faugeras 2001, to check for the cross-ratio form specifically). Taking a median over dithered quantisation is the dither result.

**Ours.** We did not find stated elsewhere a self-referencing linearity certificate for a sensor's transfer function, built from a geometric ladder of stimuli and needing no calibrated reference. It may well exist in metrology. The lab gives a working sensitivity: an exponent of 1.02 at this grain.

**In the editor.** `?lab=ste`. Its code: `labs/straight-edge.js`.

## 38. Cross ratio through an uncalibrated sensor (*the uncharacterised front end*)

One figure's radial profile is read through six sensor responses: identity, a gain, two linear-fractional maps (labelled "bridge" and "pinhole"), a power 1.7 and a saturating tanh. Readings are log-quantised. The lab takes the median relative change in the cross ratio of random quadruples whose readings are at least 4 quantiser steps apart. It refuses when no such quadruple exists.

**Found.** On graze200: identity 2.4%, gain 2.2%, bridge 4.0%, pinhole 4.8%, power 1.7 14.8%, tanh 22.6% (fails the 15% band). On wedge: 3.3%, 4.7% and 6.8%. On egg, no four readings are far enough apart, so the lab refuses in all three cases. Caveat: at this grain the power law, which is not linear-fractional, passed both times (14.8% and 6.8%).

*Since the re-run* the lab judges each response against the figure's own floor, what the quantity departs by with the instrument as held (2.3% on graze200, 3.5% on wedge): within 1.5 floors held, past 3 broke, between them undecided. On graze200 the gain held (0.9 floors), bridge and pinhole fell between (1.7, 2.1), and the power law and tanh broke (6.3, 10.6); on wedge the bridge held (1.4) and the power law fell between (2.2). So the power law no longer passes, but on wedge it is not caught either, and the bridge and pinhole are not cleanly held. The ratios 1.5 and 3 were chosen after seeing these numbers. This lab separates saturation from linear-fractional maps and, at best, flags a moderate power law; the straight-edge lab above catches it.

**Classical.** The cross ratio is invariant under linear-fractional maps (Möbius 1827), and quantisation error grows as readings bunch together.

**Ours.** Nothing beyond the classical result. The refusal rule (readings must be separated in the quantiser's own steps) is a sensible guard, not a result.

**In the editor.** `?lab=frn`. Its code: `labs/uncharacterised-front-end.js`.

## 39. The arc element does not determine a figure with corners (*what a hinge hides*)

For a star-shaped curve r(θ), the arc element ds/dθ = √(r² + r′²) fixes |r′| but not its sign. A curve may switch branch at a point where r′ changes sign abruptly (a "hinge", a corner in r) without changing ds/dθ. The lab measures ds/dθ from the contour, then fits, by damped Gauss–Newton in a 14-harmonic Fourier basis from 20 random starts, the smooth positive r with the same arc element.

**Found.** Egg: the same figure comes back (0.1% departure, residual 1.3×10⁻²). Square and clover: no smooth fit (residuals 0.15 and 0.055). The two figures built by reversing at hinges, hinge3 and hinge5, are fitted to residual 7.6×10⁻¹⁴ and 7.1×10⁻¹⁴ by a different smooth curve, which departs 50% and 19% from the original.

**Classical.** Non-uniqueness of solutions of r′² = f² − r² (sign choice; branch switching where r′ = 0, at singular solutions) is standard ODE theory.

**Ours.** Constructing curves with corners that share their arc element with a smooth curve is a neat counterexample. We did not find it stated in this form.

**In the editor.** `?lab=hng`. Its code: `labs/what-a-hinge-hides.js`.

## 40. Recovering a smooth figure from its arc element (*the figure, recovered*)

The lab takes the four library figures with the largest radius swing (up to 25.7×). It projects each onto an 8-harmonic Fourier basis and computes f = √(r² + r′²) exactly. It then solves back for r from f alone, by damped Gauss–Newton from up to 24 seeds that know nothing of the figure.

**Found.** All four (sprout, graze21, spoon, graze8) are recovered to 0.00% of their size. The equation's other solution, −r (the figure entirely "behind the reader"), is drawn beside each and excluded because it is negative. The lab's closing argument is a uniqueness claim: two positive smooth solutions sharing f would need equal and opposite extents where they differ most. That is a sketch, not a proof.

**Classical.** A Fourier basis for periodic boundary-value problems avoids the odd–even decoupling of central differences (spectral methods; Trefethen 2000). Gauss–Newton is classical.

**Ours.** The numerical evidence that the positive smooth solution is unique (4/4 recovered from blind seeds) is not a proof, and we did not find this uniqueness stated elsewhere. It should be marked a conjecture with evidence until proved.

**In the editor.** `?lab=fig`. Its code: `labs/figure-recovered.js`.

## 41. Uniform angle gives the Cauchy; arc-length sampling gives the arc element (*what can be recovered*)

Each figure is sampled two ways and each sample is reported as tan of its angle. Sampled uniformly in angle ("met evenly"), the results are Cauchy whatever the figure. Sampled in proportion to arc length ("walked"), they are not, and the histogram of angles returns ds/dθ. The screen used is the quantile ratio (q₀.₉ − q₀.₁)/(q₀.₇₅ − q₀.₂₅), which is tan(0.4π) = 3.078 for a Cauchy.

**Found.** Even sampling read 3.107, 3.098, 3.097 and 3.091 on four figures (median −0.04, half-IQR 1.02): passed 4/4, and the figure is not recoverable. Walked sampling read 2.23, 2.22, 1.65 and 2.23: failed 4/4, as it should. The arc element came back within 5.1%, 4.4%, 7.1% and 6.1% of its size, inside the 12% band on all four. (On the first run it was 15.2%, 14.8%, 7.6% and 16.3%, three outside the band; the seeded generator was the cause, see "What the run found wrong", item 2.)

**Classical.** If θ is uniform on (−π/2, π/2), tan θ is standard Cauchy. Sampling a curve uniformly by arc length has density ∝ ds/dθ in angle. Both are textbook. The figure is then fixed only up to the ODE's freedom (see the arc-element group).

**Ours.** Nothing beyond the classical result; the lab is a check, and it now meets its own 12% tolerance at 48 bins and 240,000 draws.

**In the editor.** `?lab=whr`. Its code: `labs/what-can-be-recovered.js`.

## 42. A goodness-of-fit battery for the Cauchy, run on every library figure (*the outside streams*)

This lab is a Cauchy goodness-of-fit battery. It checks four quantile-spread ratios against their Cauchy values. It checks invariance under x ↦ 1/x after location–scale normalisation, which holds for the standard Cauchy. It checks that the running mean does not settle. A finer screen measures the RMS distance of the normalised quantile function from tan(π(p−½)) over p ∈ [0.1, 0.9]; its noise floor is measured first on true Cauchy draws (0.0167 at n = 20,000). The battery runs on 45 figures, sampled evenly, by arc length, and on a "ramp" (angle density rising linearly).

**Found.** Even: 45/45 pass. Walked: 35 of the 44 non-circular figures are caught and 9 are missed. The misses are near-round ovals and the hinge family, whose arc element is nearly uniform; 4 of them sit below even the finer screen's floor. Ramp: the single quantile ratio stays inside its 12% band on 45/45. The full battery passes none (the reciprocal check catches it), the finer screen catches 45/45, and the median moves to 0.72.

**Classical.** That 1/X is Cauchy when X is standard Cauchy, and that the sample mean does not converge, are classical. Quantile-based tests have known blind spots against alternatives that are close in the tested quantiles.

**Ours.** Nothing beyond the classical result. The lab records the battery's power and blind spots honestly: a sample that is nearly uniform in angle is indistinguishable from uniform, whatever the figure.

**In the editor.** `?lab=ost`. Its code: `labs/outside-streams.js`.

## 43. Estimating the median from an ordered stream (*the sweep, read three ways*)

Values tan θ arrive in order as θ sweeps evenly (1,500 a lap, as a sawtooth). Three rules estimate the median of |value|, whose population value is 1 (the corner):

- a per-sample stochastic-approximation tracker;
- the same tracker updated once per lap from above/below counts, with steps halving on each reversal;
- a count rule: count arrivals between the two sign changes at 0 and ∞ (home and horizon), then on the next lap hold the arrival at half that count.

**Found.**
- Per sample: converges stably to a wrong value (reference 18.2, scale 8.1); over 12 trials the median end is the 40-step clip, never the corner.
- Per lap: the 12-trial median lands at 0.0 steps (the corner), after 30 laps.
- Count rule: C = 749, held at step 0, in two laps; the 12-trial median is 0.

**Classical.** Robbins–Monro (1951) stochastic approximation needs independent or ergodic samples, and a deterministic ordered sweep breaks it. Bisection on counts and the median as the middle order statistic are classical. The median of |Cauchy| is 1.

**Ours.** Nothing beyond the classical result. The lab illustrates that ordering defeats per-sample updates but not whole-lap or order-statistic rules.

**In the editor.** `?lab=swt`. Its code: `labs/sweep-read-three-ways.js`.

## 44. Redundancy, consistency and least-squares residuals (*the seed at zero*)

These checks cover whether a system of difference or correspondence equations can be satisfied exactly. On a 6-node graph, edge values are fitted as potential differences by least squares (node 0 fixed) on a tree, a cycle and the complete graph. Homographies are fitted from 4 and 5 point correspondences. The RMS residual of a small perturbation is compared with √(redundancy/equations).

**Found.**
- Graph: on the tree (5 equations, 5 unknowns), random data fit to 2×10⁻¹⁶. With one cycle, random data leave 3×10⁻¹ against 1×10⁻¹⁶ for consistent data. On the complete graph (redundancy 10), 8×10⁻¹ against 2×10⁻¹⁶.
- Homography: 4 correspondences fit any random pairing exactly; with 5, random gives 4×10⁻² against 0 for consistent pairings.
- Perturbation: the residual share measured 0.40 and 0.79 against √(1/6) = 0.41 and √(10/15) = 0.82.

**Classical.** Cycle rank m − n + 1 (Kirchhoff 1847). A homography has 8 degrees of freedom, fixed by 4 points (Hartley and Zisserman 2003). For least squares, E[RSS] = σ²(m − p), the projection theorem (Gauss). The geodetic redundancy numbers are Baarda's (1968, to check).

**Ours.** Nothing beyond the classical result; the lab is a check, and its √(excess/statements) is the standard projection result.

**In the editor.** `?lab=sdz`. Its code: `labs/seed-at-zero.js`.

## 45. A goodness-of-fit regression suite for the Cauchy screen (*the stream bank*)

The lab feeds thirteen synthetic sensor-style signals of 5,000 samples each through the editor's Cauchy screen (`osScreen`), and asserts a verdict for each that was registered before the run. The screen runs three tests:
- **Quantile ratios.** Four ratios of interquantile ranges, (q.90−q.10)/(q.75−q.25) and three others, are compared with their Cauchy values within 12%. The widest ratio gets a looser band at short lengths.
- **Reciprocal symmetry (the "exchange").** The data are standardised by the median and the semi-interquartile range, and the quantiles of z are compared with those of 1/z.
- **No settling mean.** The running mean must keep moving.

The streams:
- **Should pass:** tan of a uniform angle, and a Möbius image of it.
- **Should fail:** Gaussian rest noise, the same with a transient, ADC-quantised noise, a lognormal, a random walk, a two-lobed figure sampled by arc length, and samples on a √u "ramp".
- **Should be declined:** a 24-sample burst.
- **Recorded only, no assertion:** a 5% contaminated Cauchy and Student's t₂.

Two rows record known limits. A smooth oval sampled uniformly by arc length passes (the "blind class"). On the ramp, the cheap statistic must stay within 12% while the reciprocal test catches the bias.

**Found.** All 11 asserted verdicts held. The two that should pass did (worst quantile ratio 19% and 9% off, exchange 0.06). The seven that should fail did, by 69–89% on the quantile ratios, except the ramp, which reads only 8% off (1.4% on the cheap statistic, inside its band) and is caught by the reciprocal test alone (1.69). The burst was declined. The walked oval passes (4% off, exchange 0.07): the blind class, kept as a row. Recorded only: the 5% contaminated Cauchy passes (6%, 0.10); Student's t₂ is refused (73%, 0.34).

**Classical.**
- tan of a uniform angle is standard Cauchy.
- If X ~ C(0,1) then 1/X ~ C(0,1).
- The Cauchy family is closed under real Möbius maps (Knight 1976; McCullagh 1992).
- Testing a fit by quantile ratios is standard in robust statistics.

**Ours.** Nothing new mathematically. The lab is a regression suite. Its useful content is that it records two blind spots of this screen: a near-circular figure sampled by arc length, and the ramp, which only the reciprocal test catches. These are kept as rows so that any change in the screen's power shows up.

**In the editor.** `?lab=sbk`. Its code: `labs/stream-bank.js`.

## 46. Uniform-angle versus arc-length sampling of a closed curve (*sampling tests*)

The lab samples each primitive in two ways and reads tan of the angle of each sample. The first is uniform in the polar angle φ from the centroid (2,048 directions, 40,000 draws). The second is uniform in arc length. Each is summarised by the shape statistic (q.90−q.10)/(q.75−q.25), which equals tan(0.4π) = 3.0777 for every Cauchy, whatever its location or scale. Uniform-angle sampling must sit at 3.078. Arc-length sampling must depart from it, judged against the same figure's uniform-angle value, with a round figure as the control. Finally, a 300,000-draw histogram of the arc-length samples is fitted against ds/dφ = √(r² + r′²).

**Found.** Six figures, the radius swinging from 1.00× (the circle) to 200×. Stepped evenly in the turn the statistic read 3.085–3.099 on all six: Cauchy, and the figures indistinguishable. Walked by arc length it left 3.078 on all five figures whose radius varies (2.21, 2.22, 1.66, 2.22 and 3.85 for the rose, which departs upward), each judged against its own even reading; the round control moved 0.012. The arrival histogram returned each figure's arc element to between 2·10⁻² and 2·10⁻¹ of its size.

The lab's own text adds that the arc element fixes the figure only up to one constant, the reader's position. The companion lab ("the figure, recovered") argues that the constant is pinned down by requiring r > 0.

**Classical.**
- Uniform angle under tan gives the Cauchy.
- Uniform arc length has angular density ∝ ds/dφ, by the polar arc-length formula.
- A quantile-ratio statistic is invariant to location and scale.

**Ours.** The framing is ours: the Cauchy belongs to how the turn is sampled, not to the figure. The mathematics is not new, and we did not find the reverse step (recovering r from √(r² + r′²) with the sign fixed by r > 0) stated elsewhere (to check). Otherwise the lab is a check.

**In the editor.** `?lab=smp`. Its code: `labs/sampling-tests.js`.

## 47. Ratios lose the radius (*the recovered circle*)

The lab casts 512 rays, evenly spaced in angle across a half-turn, from each primitive's centroid. Each hit is recorded as the ratio v/h = R sin a / (R cos a) = tan a. It then maps each ratio back to a point (cos(atan q), sin(atan q)), which is normalising to the unit circle (the "census", v² + h² = 1).

**Found.**
- The 4 primitives reported have radii varying by up to 5.7× between them, yet their readings are identical.
- The quartiles are −0.994 and 1.006 for every figure, with a spread of 0.000 across figures. The offset from ±1 comes from the midpoint grid, not from noise.
- All 4 come back as the unit circle to 1e−16.
- Sheet: 8 cells, 4 rated "holds" (the recoveries) and 4 marginal (the figures as held, shown as reference).

**Classical.** All of it. The quotient v/h = tan a is independent of R by construction. Evenly spaced angles under tan give Cauchy quantiles (median 0, quartiles ±1). Normalising a direction gives a point on the unit circle.

**Ours.** Nothing beyond the classical result; the lab is a check. It shows that a ratio carries direction only, so normalising returns the same circle whatever the shape.

**In the editor.** `?lab=rcc`. Its code: `labs/recovered-circle.js`.

## 48. Recovering a shape from bearings: intersection and one baseline (*undoing the division*)

Each figure (7 named primitives; 6 were usable this run) is read from three standpoints inside it, set at 0.3 of its mean radius around the centroid. Each standpoint records only the ratio v/h towards each outline point, which is a bearing line with no range and no sign. Three reconstructions are compared:
- **One standpoint, normalised to the unit circle.**
- **Three standpoints with a known triangle shape but no scale.** The two bearing lines that cross most nearly at right angles are intersected, in units of the standpoints' spacing.
- **The same, plus one known length**, the distance between two standpoints.

Which reading belongs to which point is given, not discovered.

**Found.**
- One standpoint misses the figures by up to 140% of their radius.
- Three standpoints recover the shape exactly on 6/6 (off by 2e−15 once the scale is restored), in units of their own spacing.
- One length gives the figure itself on 6/6, off by 2e−15.
- The worst crossing angle used was 13°.
- Sheet: 24 cells, with 12 holding, 6 marginal (as held) and 6 failing (the one-standpoint rows, failing by design).

**Classical.**
- This is triangulation (intersection) from known stations.
- Bearings alone fix a configuration up to similarity, so one baseline length sets the scale. This is standard in surveying and in multi-view geometry (Hartley & Zisserman 2003).
- Two stations cannot intersect points on the line through them, hence the third.

**Ours.** Nothing beyond the classical result. The cost accounting is a clear way to put it: no extra number per reading, one agreed length per figure.

**In the editor.** `?lab=udv`. Its code: `labs/undoing-the-division.js`.

## 49. Two stereographic views of one cyclic array (*two fisheyes on one array*)

This is an interactive page with no report. N elements sit at angles iπ/N on a half-circle. Each view is a focus φ and a scale s, and draws element i at s·tan(θᵢ − φ). Each view is therefore a Möbius chart of the projective line, and the two views are related by a Möbius map. The page lets the user:
- send an element as a cross ratio against three landmarks and solve it back in the other view;
- predict every shared element's position from three landmarks;
- warp view B with a non-Möbius (quadratic) map and watch a fourth element's cross ratio detect it;
- summarise everything outside each window as one bar per dyadic level;
- run a sweep of addressing error at pixel quantisation.

**Found.** The code's comments record the registered predictions:
- **P1** (the cross ratio of four elements is identical in both views) and **P2** (an element sent as one number lands on the same element) hold exactly with quantisation off.
- **P3** (the recovered element's error ∝ 1/landmark separation) was refuted. The relative error of the cross-ratio number does follow 1/sep: 22.2, 11.1, 6.1, 3.0, 1.6 and 0.85%, against predicted 21.4, 12.9, 6.7, 3.2, 1.7 and 0.87%. But solving the number back has sensitivity ∝ sep, and the two cancel. The recovered element's error is therefore flat in separation, about 0.12 elements per pixel at about 2.75 px spacing and linear in the grain. It fails only when the landmark spread drops below one pixel.
- Two artefacts were designed out of the sweep. Encoding and decoding in the same view cancels algebraically. Evenly spaced elements on an integer pixel grid quantise in common mode, which a cross ratio cannot see.

**Classical.** The cross ratio is invariant under Möbius (projective) maps of the line. Three points fix a projective frame, and a fourth point's cross ratio is its projective coordinate. tan(θ − φ) is a Möbius chart of the circle.

**Ours.** The measured cancellation in P3 is an error-propagation result for this encoding. It is not stated as such in sources we know (to check). The rest demonstrates classical projective geometry.

**In the editor.** `?lab=tfe`. Its code: `labs/sheets.js`.

## 50. Projective and affine invariants as ratios of area determinants, demonstrated (*the ownership rule, shown*)

The lab takes one six-point configuration, its affine image and its projective image. It evaluates three ratios of products of signed triangle areas (3×3 determinants, the "disagreements"):
- balanced and of degree zero (each point appears equally often above and below the fraction bar, and there are as many determinants above as below);
- degree zero but unbalanced;
- degree one.

**Found.**
- The balanced degree-zero ratio reads 0.385286 in the original and both images. It survives affine and projective maps.
- The unbalanced degree-zero ratio survives the affine map and breaks under the projective one.
- The degree-one ratio breaks under both.
- Sheet: 9 cells, 4 holding, 4 breaking and 1 reference.

The explanation in the code: a projective map sends a determinant [abc] to det(M)·[abc]/(w_a w_b w_c). Degree zero cancels det(M). Balance cancels each point's weight w. An affine map has all w = 1, so degree zero alone suffices for it.

**Classical.** These are the bracket transformation law and the first fundamental theorem of invariant theory for points in the projective plane. The invariants are ratios of bracket monomials in which every point appears equally often in numerator and denominator (Grosshans, Rota & Stein 1987, to check; standard in invariant theory). Ratios of areas are affine invariants.

**Ours.** Nothing beyond the classical result; the lab is a demonstration.

**In the editor.** `?lab=own`. Its code: `labs/ownership-rule-shown.js`.

## 51. Projective and affine invariants as ratios of area determinants, tested at random (*ownership tests*)

This is the randomised version of the previous lab. Eight random points are subjected to a similarity, an affine map and a projective map. Then 220 trials are run in each of three classes: balanced degree-zero ratios of determinant products, unbalanced degree-zero ratios, and nonzero-degree ratios. The test asserts that every quantity is either unmoved to 1e−9 or moved, with none in between, and that degree and balance predict which.

**Found.** The rule predicted every case, with nothing in between:

| | similarity | affine | projective |
|---|---|---|---|
| balanced, degree 0 | 71/71 unmoved | 71/71 | 71/71 |
| degree 0, unbalanced | 41/41 | 41/41 | 0/41 |
| nonzero degree | 0/67 | 0/67 | 0/67 |

**Classical.** The same as the previous section: the bracket transformation law and the classical description of projective and affine invariants of point configurations.

**Ours.** Nothing beyond the classical result; the lab is a check.

**In the editor.** `?lab=owt`. Its code: `labs/ownership-tests.js`.

## 52. Emoji sheet

The lab renders the system emoji font's glyphs to a raster and traces each outline into a closed curve on 256 leaves. It drops code points the font lacks by matching each glyph against a reference missing-glyph ("tofu") box, then lays the results on a grid. This run: 398 glyphs, 398 contours, 101,888 leaves; 2 were not in the font (11.1 s). It is a corpus generator for test shapes, not an experiment.

**In the editor.** `?lab=emj`. Its code: `labs/emoji-sheet.js`.

## 53. Keyboard sheet

The lab traces the 94 printable ASCII characters in a chosen font into closed curves of 256 leaves each and lays them on a grid. This run (system-ui): 94 glyphs, 134 contours, 34,304 leaves (1.8 s). It is a corpus generator, not an experiment.

**In the editor.** `?lab=kbd`. Its code: `labs/keyboard-sheet.js`.

## 54. Conformance tests for the interpolation decoder (*decoder test vectors*)

Two labs check the editor's decoder against TVF §8. The decoder is even-N trigonometric interpolation on the shifted nodes θ_k = (2k+1)π/N with kernel sin(Nφ/2)/(N tan(φ/2)). Three vectors are checked:
- **(i)** cos(Nθ/2) vanishes at every node.
- **(ii)** The Gram matrix of the band basis {1, cos mθ, sin mθ, sin(Nθ/2)} at the nodes is diag(N, N/2, …, N/2, N), and every band mode is reproduced between nodes.
- **(iii)** The Lebesgue function at θ = 0 (home) equals (2/N)Σ 1/τ_k with τ_k = tan(θ_k/2), and is its maximum.

The second lab (`exa`) repeats all of this exactly. Every lattice angle is represented in ℤ[ζ] with ζ = e^{iπ/2N}, so ζ^{2N} = −1 and, N being a power of two, x^{2N}+1 is cyclotomic. Each identity then becomes an equality of integer vectors. The float decoder is measured against this exact reference.

**Found.**
- **vec:** all 8 sizes pass, N = 8 … 1024.
  - (i) holds to 4e−13. The same mode reads ±1 on a grid offset by half a node spacing, which is the bug it is there to catch.
  - (ii) holds to 1e−14 of N, and band modes are reproduced to 3e−13.
  - (iii) holds to 1e−14: Λ₈ = 1.848, Λ₃₂ = 2.728, Λ₁₂₈ = 3.610, Λ₅₁₂ = 4.493. Each factor of 4 in N adds 0.88 ≈ (2/π)ln 4.
- **exa:** all 8 sizes pass, with every check an exact equality: the Kronecker property R2, partition of unity, (i), (ii) up to N = 256, and N·K(−θ_k)·sin(θ_k/2) = ±cos(θ_k/2). Integer data are decoded exactly. The float decoder agrees to 7.4e−14 of the data scale.

**Classical.**
- Discrete orthogonality (Parseval) of the trigonometric basis, with the halved Nyquist term.
- The Lebesgue constant of equispaced trigonometric interpolation grows as (2/π)ln N (Zygmund; Rivlin).
- Exact arithmetic in cyclotomic integers.

**Ours.** The closed form (2/N)Σcot(θ_k/2), with its maximum at the midpoint, is probably classical (to check). The exact cyclotomic reference decoder is an engineering contribution, not a mathematical one. The labs are conformance checks.

**In the editor.** `?lab=vec` · `?lab=exa`. Its code: `labs/decoder-test-vectors.js`.

## 55. The mean of angles read from a height (*averaging directions*)

Essay 3 §8 and OFS §7.2 advise: to summarize directions take the median; *to average, average the angle, which is bounded*. Here each star-shaped library figure gives a true direction m, the slope from its centroid to its farthest point (48 figures). Its direction is read 20,000 times from a height γ, cycling 0.05, 0.2, 0.5 and 1: the slopes are m + γ·tan u with u uniform on the half turn, the Cauchy at m + iγ. Three summaries are formed.

**Predictions, written before the run.**
1. The median of the slopes returns m.
2. The mean of the angles returns atan(m/(1+γ)), not atan m. The reason: log(1 + is) is analytic in the lower half-plane, so its Cauchy expectation is its value at m − iγ, which is log(1 + γ + im). The angle atan s is its imaginary part.
3. Half the mean of the doubled angle returns ½·[atan2(m, 1−γ) + atan2(m, 1+γ)], pulled the other way, toward the horizon.

Kill: any cell off any of the three by more than four standard errors.

**Found** (29 October, run 1). Nothing was killed.
- The median returned the direction on 48/48.
- The mean of the angles returned its formula on 48/48. It missed the direction itself by more than eight standard errors on 38/48, by up to 19.7°.
- The doubled angle returned its formula on 48/48.

**Classical.** Cauchy expectations of functions analytic in a half-plane are evaluated at the parameter (the Poisson integral; McCullagh 1992 for the Möbius family). Circular means of axial data double the angle (Mardia and Jupp 2000).

**Ours.** The essay's sentence needs its scope. The mean of the angle chart exists, but it is not an estimate of the direction once the readings come from a height: it is pulled toward home by atan m − atan(m/(1+γ)). Only the median reads the address. The bias in closed form is easy and probably known; we did not search for it.

**In the editor.** `?lab=avd`. Its code: `labs/averaging-directions.js`.

## 56. Joining four quarter-turn arrays without their sizes (*joining the four facings*)

Essay 10 §2: a closed curve is four quarter-turn arrays, and *the reader holds each only up to its own factor, so it cannot tell whether two ends meet*. Here each star-shaped figure's radius from its centroid is laid as four arrays of 64 leaves (58 figures). Each array is multiplied by an unknown seeded factor between ¼ and 4, and the order of the four is given. The reader assumes that the payload is continuous. At each seam it carries each side's log-radius to the seam by the quadratic through its three nearest leaves, and sets the two equal. Three seams fix the three ratios. The fourth seam, back to the first array, is left over as a check.

**Predictions, written before the run.**
1. On the round figures the ratios come back within 10⁻⁴.
2. Over the library the median worst ratio error is under 1%.
3. Every figure whose worst ratio is off by more than 1% is flagged by the fourth seam (left over by more than 0.5%).

**Found** (29 October, run 1).
- (1) killed. The library's `round` marker covers far more than circles. Its curved figures came back between 10⁻⁴ and 10⁻³, and flame to 1.1%. A quadratic from 64 leaves cannot do better than about 10⁻⁴ on a curved figure, so the bound was set wrong (my set-up). The circle, ellipse and oval came back to 2·10⁻⁵ and better.
- (2) held. The median worst ratio was 0.01%, and the join held within 1% on 55/58.
- (3) held. The three wrong joins (ell 7.2%, flame 1.1%, knife 1.2%: corners or tips at a seam) were all flagged by the fourth seam, and no figure joined right was flagged.

**Classical.** Joining pieces by continuity at their ends is extrapolation; a loop's leftover is a closure check, as surveyors use it (draw §44; OFS's tower).

**Ours.** The essay's sentence holds only for a reader that assumes nothing about the payload. Assume continuity, which is a model of the payload, and the facings join up to one overall size, which no seam gives back. Where the payload has a corner at a seam, the join goes wrong and the loop says so. The essay should say what the join needs: the sizes, or a model of the payload.

**In the editor.** `?lab=jnf`. Its code: `labs/joining-the-facings.js`.

## 57. Levels of detail held against the number of places (*size sets the level*)

Essay 4 §10 and OFS §8: *a thing that spans n of the reader's places is resolved to about log₂ n levels of detail*, and the level is a continuous number. Here each star-shaped figure's log-radius from its centroid (2,048 leaves as the truth, 58 figures) is read at n equal-angle places, n = 16 to 512. Its spectrum is split into levels, harmonics 2ʲ to 2ʲ⁺¹ − 1. The editor's reconstruction is the trigonometric interpolant of the places (§54), so its spectrum is the DFT of the n readings, with the finer harmonics folded in. A level holds when its error is within 10% of the level's own size (or of a millionth of the figure's whole detail, when the level has almost none). A second reader reads from the Cauchy's height, γ = π/n, which keeps harmonic k by e^(−kγ). Its level is the sum of the shares it keeps of every level that has detail.

**Predictions, written before the run.**
1. Every level wholly below n/4 holds, on every figure at every n.
2. The median figure gains exactly one held level per doubling of n.
3. The height reader's level rises by 1 ± 0.15 per doubling from 16 to 256, on every figure.

**Found** (29 October, run 1). Two of the three were killed.
- (1) killed on 39/58. Most of the failures are folds into levels with almost nothing of their own:
  - harmonics a symmetric polygon lacks (a pentagon has only multiples of 5, and k = n ± 5j folds into the empty levels);
  - the first harmonic, which reading from the centroid nearly removes;
  - the facets of the library's 160-gons, folding into an ellipse's nearly empty fine levels.
  Read after the run against a hundredth of each figure's whole detail instead, the levels below n/4 held on 27/58. So real detail folded down still swamps real detail on about half the library at the 10% line.
- (2) held: the median figure gained 1, 1, 1, 1, 1 held levels at each doubling from 16 to 512.
- (3) killed on 58/58. The height reader's level rose by 0.00 to 0.96 a doubling (median 0.76). The median step climbed 0.61, 0.75, 0.81, 0.90 from 16→32 to 128→256. The figures have 3 to 10 levels with any detail (median 7), and a figure's step falls once it runs out (the ellipse 0.63 down to 0.28).

**Classical.** Aliasing in trigonometric interpolation (Zygmund), and the Poisson kernel as a smoothing that keeps harmonic k by e^(−kγ).

**Ours.** The essay's count is a ceiling, not a measure. Doubling the places opens one more level (prediction 2 held). How many of those levels hold depends on the figure: its coarse levels carry finer detail folded down unless the reader reads from a height, and it resolves no more levels than it has. The essay and OFS §8 should say so.

**In the editor.** `?lab=ssl`. Its code: `labs/size-sets-the-level.js`.

---

## The seven, searched for

On 28 October 2026 each of the seven items above was searched for in print. Every source here was seen as a search result or a snippet, not read in full, unless it says otherwise; a paywalled text could not be seen at all. None of the seven was found as stated.

1. **A curve from winding numbers alone** (§7). *Parts in print, the combination not found.* The winding number as an inside–outside field, evaluated hierarchically: Jacobson, Kavan and Sorkine-Hornung 2013, "Robust inside-outside segmentation using generalized winding numbers", ACM TOG 32(4) (it segments a mesh by graph cut, not a quadtree on integer corners). Octrees refined where the signs at cell corners change: dual contouring (Ju, Losasso, Schaefer and Warren 2002), which needs normals. Quadtrees with a topology guarantee: Plantinga and Vegter 2004, driven by interval arithmetic on a smooth function. The step limit behind δ* is phase unwrapping's |Δφ| < π (Itoh 1982, from the lab's own text). The formula δ* = (s/2)·tan(π/2C), fixing the stopping scale in advance from the ring's count, was not found.
2. **A one-bit ring silent outside** (§6). *Classical.* Silent exactly when a line through the point misses the curve, the separating line; winding numbers from quadrant changes are Hormann and Agathos 2001, "The point in polygon problem for arbitrary polygons", Computational Geometry 20(3). To be restated in those terms rather than claimed.
3. **The near field's own size** (§10). *The base formula classical, the corollaries not found.* f(d) = (1/2π)∮R²/(R² + d²)dθ is the configuration factor from a parallel element to a planar region (Hamilton and Morgan 1952, NACA TN 2836; Howell's catalogue of configuration factors; Sparrow 1963's contour integrals); the far limit, area over d², is textbook. The near coefficient ⟨R⁻²⟩, the size D = (⟨R²⟩/⟨R⁻²⟩)^¼ and the symmetry f(D²/d) = 1 − f(d) holding only for the circle were not found. They are easy corollaries, so Howell and Sparrow and Cess should be checked in print.
4. **A straight edge for an instrument** (§37). *Close prior work.* Reference-free linearity testing is classical in radiometry: flux addition (Sanders 1972, "Accurate measurements of and corrections for nonlinearities in radiometers", J. Res. NBS 76A(5)) and the double aperture (Mielenz and Eckerle 1972). They test additivity, plain linearity, not the linear-fractional class, and use no cross ratio. Cross ratios of pixel values to fit a camera's response (Figueroa and Li 2019) are of another kind. The ladder's (1 + r)²/(1 + r + r²) as a certificate of a Möbius response was not found; flux addition should be cited beside it.
5. **Corners in the arc element; smooth recovery** (§§39, 40). *The branch switching classical, the inverse problem not found.* Where r′ = ±√(f² − r²) a solution may change branch on the envelope r = f, where the right side is not Lipschitz: the singular solutions of implicit first-order equations (Ince, *Ordinary Differential Equations*, ch. 7, not searched). No paper on recovering a closed polar curve from its arc element was found. A caution: a smooth solution can also change branch smoothly where it touches r = f to high enough order, so the uniqueness conjecture probably needs a hypothesis such as r < f except at isolated points. Since √(r² + r′²) = |d(re^{iθ})/dθ|, the problem is recovering a curve from the modulus of its derivative, its argument known: a constrained phase retrieval, a term to search under.
6. **An address error flat in the landmarks' spread** (§49). *Close prior work to read.* The cross ratio's distribution and error: Åström and Morin 1992, "Random cross ratios"; Maybank 1995, IJCV 16; Liu and Chuang 2002, "A geometry-based error estimation for cross-ratios", Pattern Recognition. Closest: Chuang et al. 2007, "Practical error analysis of cross-ratio-based planar localization", which uses the linearised error to choose reference points and may contain the separation dependence; it could not be fetched and must be read before the cancellation is claimed.
7. **A coordinate read from a shape's own outline** (§13). *A construction; nothing contrary found.* tan(θ/2) from a point on a circle is the stereographic chart; dilations tan(θ_a/2) = a·tan(θ/2) on that chart give spherical wavelets (Antoine and Vandergheynst; Wiaux et al. 2005, "Correspondence principle between spherical and Euclidean wavelets"), the nearest analogue to levels on it; multilevel interpolation on dyadic partitions is classical (Mallat 1989). The reading from a point on the shape's own outline, with each dyadic interval remapped to a whole quarter turn, was not found.
