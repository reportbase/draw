# TVF — The Tangent Vector Format

### *A text-native export format for cascade-reconstructed signals*

*Revised 5 October 2026: TVF holds depth as well as breadth, with no new syntax (§2.8). Measured in the drawing tool's editor; see `wander/tvf-depth-test.md`.*

*Revised 6 October 2026: the three canonical decoder test vectors of §8 are built and run against the drawing tool's decoder (§8, §9). Later the same day, the exact reference decoder too: in ℤ[ζ], ζ = e^{iπ/2N}, the vectors, R2 and the partition of unity are equalities of integers (§8). And a depth reader outside the drawing tool: the gallery's inspector reads depth files (§2.8). And entering octaves only where needed: at a tolerance of 10⁻⁶ of the departure, a quarter of the sweeps (§2.8). Revised 7 October 2026: the drawing tool's saved depth files now enter octaves only where needed, at τ = 10⁻⁶; and what the recursion found, stated (§2.8). Later the same day, the walls: scored over the whole range rather than only where level 3 is reached, every depth file so far missed by up to 15% in bands at the walls between octaves. The cause is that a sweep is flat at its walls. A writer whose rows leave flat residuals at their children's walls holds the whole range to 10⁻⁵, and the saved files now use it (§2.8).*

This is the tight specification. It supersedes the v22.x working document,
which accreted iteration logs, extrapolations later withdrawn, and
interpretive material across dozens of dated revisions. What remains here is
what is settled: the format, its identity as a Bridge instance, its honest
operating envelope, and its validated status. Retired claims are listed once
at the end so the record is clear.

---

## 1. What TVF is

**TVF is the export format for the TNS cascade pipeline.** A signal goes
through the cascade — forward transform to leaf coefficients, band extraction,
arctan quantization — and the result is a text file. The format does one job:
store the cascade's output as text, in a form that AI models, Unix tools, and
downstream consumers read directly.

A TVF file:

```
TVF 64 2 1
#meta cascade:N=64,L=2,arctan=8
#meta type:audio
#meta sample-rate:48000
-1 0.98882253 0.95928844 0.87847840 ... 0.98882253
-8 0.0063088104 -0.0022552745 ... 0.0063088104
```

Line 1 is the header. `#meta` lines are metadata. Each remaining line is one
signal row: a signed band byte (the IEEE 754 exponent of the row's
coefficients) followed by space-separated coefficient values. Because it is
text, AI models can read, generate, and grep it directly.

**Breadth and depth.** TVF was built for **breadth**: one sweep's leaves, held
discretely and presented back continuously by the kernel. Packing leaves
tighter is more breadth, not depth. TVF also holds **depth**, the recursion:
every octave of a reader's reading held by a whole sweep of its own, the same
sweep again with its own home, corner and far wall. It does so with no new
syntax: one ordinary document per sweep, addressed by a `#meta` tag and
concatenated (§2.8). Where this document says "depth d", "depth-nested" or
"multi-depth" of a leaf count (§1.1, §1.3, §2.4, §2.7, §9 and the appendix),
it means doublings of breadth, not depth. In §5.6, "depth" is the distance
from the viewer.

### 1.1 TVF is the file-format instance of the Tangent Bridge Theorem

This is the load-bearing fact and the reason the format has the properties it
has. The Bridge Theorem proves that the discrete and the continuous are two
expressions of one projection — a semicircle's chord and arc. A TVF file is
the **discrete** expression: the leaf coefficients, in text. The kernel
decoder is the **continuous** expression: the same projection re-read at any
target resolution. They are one projection written two ways, not two formats
joined by a transformation.

The forward map Φ_d (sample at 2^{d+1} leaf positions; d counts doublings of
breadth, §1) and reverse map Ψ_d
(kernel reconstruction via K_N) compose to the theorem's five properties, and
the format inherits them by construction:

- **R1 — round-trip exact at leaves.** Verified to machine precision across
  10 doublings of N.
- **R2 — exact on pathological content.** Holds across 10^{10} constants and
  oscillatory signals, machine precision.
- **R3 — bounded between leaves,** with C·log(N)·ω_F(π/N) decay. Holds as an
  upper bound; empirically loose by 50–150×, the true constant being
  class-dependent.
- **R4 — uniform convergence** at the rates the theorem predicts (exponential
  for analytic content, √2-per-doubling for Hölder-½).
- **R5 — inside-bounded,** no global parameter beyond depth. Leakage ratio
  10^{-14} for 10^6 off-leaf perturbation.

Any implementation that violates R1–R5 has a bug, not a tradeoff. The
properties are theorems, not engineering choices — and the grade has risen
since this section was written: **R1 and R2 are integer-polynomial
identities** (Tangent Bridge, algebraic form: the kernel's interpolation and
partition-of-unity lemmas hold in ℤ[τ], no trigonometry, no square root, no
epsilon). A decoder can therefore be checked against an *exact-rational*
reference, not just a 10⁻¹⁵ float assertion (§8). R3's statement also has an
algebraic form carrying no π and no logarithm — error ≤ C·(d+1)·ω_F(δ_d),
depth and the halved unit slope replacing log N and the angular mesh — with
the constant now bounded two-sidedly from the pair algebra alone
(Λ ≥ (√2−1)d/2, Λ ≤ C(d+1)); the loose empirical constant reported above is
consistent with, and now bracketed by, those bounds.

**Photographs prove the scope operationally.** The theorem's classical
presentation is on S¹, which superficially suggests circular content.
Photographs are not circular — the leftmost and rightmost pixels of a row have
no a-priori relationship. Yet TVF round-trips photograph rows exactly at the W
pixel positions (PSNR ≈ ∞ verified at N = 16…256 on real photographs). The
chord/arc identity is not a property of circles; it is a property of bounded
observation. Whatever the source — circle, photograph, signal, manifold — the
projection has the identity, and TVF stores its discrete expression. The
format's applicability to non-circular content is not a generalization beyond
the theorem; it is the theorem's scope made operational.

### 1.2 What TVF is for

**TVF is interchange, not delivery.** It does not compete with PNG, JPEG, MP3,
or FLAC for end-user consumption; those are delivery codecs with decades of
perceptual and hardware tuning. TVF sits one tier above:

```
Source → Cascade encode → TVF (text storage) → Delivery format (PNG/MP3/PCM…)
```

One architectural distinction is worth naming. Conventional formats decode to
a fixed sample grid, and presenting at any other resolution needs a separate
interpolation pass (bicubic, Lanczos, sample-rate conversion). TVF combines
the two: kernel evaluation at the target positions *is* the rendering, with no
intermediate grid. For consumers rendering at variable resolutions — HiDPI,
zoomable UIs, tiled streaming, multi-size thumbnails from one source — this
removes a pipeline phase. (Per-pixel kernel cost is higher than
blit-and-interpolate; the saving is structural, not arithmetic. See §5.)

Three uses TVF is genuinely good at:

1. **AI training data.** Coefficients appear in corpora as text; models learn
   the cascade representation directly, without the codec artifacts JPEG/MP3
   inject. One coefficient format spans audio, images, and sensor data.
2. **AI generation.** A model emits a TVF file token by token; the consumer
   reconstructs by applying the kernel. The one media format where AI
   generation is structurally first-class rather than a base64 bolt-on.
3. **Intermediate archival.** The cascade representation is the canonical
   source of truth; PNG/JPEG/PCM renders are derived on demand at the target
   resolution.
4. **Equation replacement over clamped ranges — the atlas.** Where a
   phenomenon would classically get one global equation, it gets an atlas of
   TVF strings instead: one document per clamped window (`#meta range` names
   the window), each exact at its atoms and paying only for the window it
   holds, composed by concatenation (§2.5 — `cat` is the atlas constructor),
   with overlap consistency checked at shared atoms (points-as-oracle). The
   piecewise move is classical (splines; Chebfun's splitting); what the
   string adds is being a *document* — self-contained, legible, diff-able,
   theorem-backed — rather than a component inside a numerical environment.
   The representation-equivalence paper (§11, §11.5) carries the measurement
   (the global tax) and the argument; this format is its artifact.

**Why text.** AI pipelines move in token space; a format that lives there
natively has access properties binary formats reach only through tool-mediated
decoding. Text is larger than binary — this is a structural claim about
access, not an efficiency claim. It also makes TVF inspectable with standard
tools (`head`, `awk '{print $1}'` for the band column, `grep` for a scale).

### 1.3 Honest limits

The operating envelope is content-dependent. This is scope, not apology.

- **Smooth content (analytic, C^∞, Lipschitz):** the native domain. +40 to
  +60 dB over Lanczos at equal coefficient budget; archival fidelity (90+ dB)
  reachable with the cascade.
- **Real photographs:** competitive, not decisive. 0–2 dB gap to Lanczos
  (kernel's global support vs Lanczos's hard cutoff); perceptual parity with
  JPEG q85–q90; ~1.3–1.5× PNG size gzipped (the cost of source-form over
  delivery-form storage).
- **Discontinuities (BV, hard edges, transients):** bounded error per R3, but
  ω_F does not decay and the bound is the Gibbs floor. Multi-depth reduces
  overshoot to ~1% but does not remove it. For pixel-exact text or sharp
  transients, use PNG or a codec.
- **Near-Nyquist / non-stationary (chirps, frequency sweeps):** catastrophic,
  −40 to −50 dB. Encoders must detect and fall back.
- **Noisy data:** robust to ~5% of peak *with* the recommended configuration
  (M = 2N samples, BOMA closure); without it the forward transform collapses
  at 0.1% noise. The fix is configuration, not regularization.

The right framing is "source-form representation of continuous-tone signals" —
upstream of any delivery codec, downstream of any raw measurement.

**Adjacent responsibilities TVF declines:** structured data with schemas →
JSON/YAML; bundling many files → ZIP/tar; lossy perceptual compression →
JPEG/MP3/AV1; multi-signal semantics beyond `cat` composition → application
convention, typically JSON describing relationships with signal data in
separate TVF files. TVF carries one signal per file as a flat coefficient list
with a few `#meta` tags; everything outside that is served by tools that
already work.

---

## 2. The format specification

### 2.1 Structure

Plain text, UTF-8. Three sections: header, zero or more `#meta` lines, signal
rows.

**Header** (exactly one line):

```
TVF [width] [height] [channels]
```

- `TVF` — the three-character identifier.
- `width` — coefficients per row (positive integer, equals N leaves per level).
- `height` — number of signal rows (meaning depends on role, below).
- `channels` — per-row channel count (1 mono/grayscale, 3 RGB).

`height` by role: for a single signal with L-level cascade, `height = L` (one
row per level); for a multi-row signal at single-level encoding (image rows,
frames), `height = R`; for multi-row with per-row cascade,
`height = R × L`, ordered (level 0 row 0, …, level L−1 row 0, level 0 row 1,
…). The `cascade` meta tag tells the decoder how to group rows into stacks.
For depth, `height = 1`: each sweep is its own document, and the documents are
concatenated (§2.8).

**Meta tags** (between header and first row):

```
#meta [key]:[value]
```

**Signal rows** (one line per row):

```
[signed_rung] [coefficient_0] [coefficient_1] ... [coefficient_N-1]
```

- `signed_rung` — integer in [−128, 127], the row's cascade band = the IEEE
  754 exponent of the dominant coefficient magnitude.
- `coefficient_i` — signed decimal, 8 significant digits, in canonical leaf
  order (§2.4).

Multi-channel: `channels` lines per row in canonical channel order (RGB: red
row 0, green row 0, blue row 0, red row 1, …).

### 2.2 The band byte

The band byte separates scale from structure. Every coefficient on a row sits
in one magnitude band; the band byte records it as a signed integer (the IEEE
754 exponent), and the remaining values are positions within the band, in
[−1, 1) after normalization. This makes scale one byte per row and structure
the coefficient sequence — the band column is queryable directly
(`awk '{print $1}'`), serves as a content fingerprint, and aligns the file's
bit structure with IEEE 754's exponent field exactly (the band byte is that
exponent at the row level instead of the value level).

### 2.3 Multi-level cascade rows

Under cascade extension (§4.3), the coefficient rows of one signal are its
cascade levels, and reconstruction is the sum of all levels' kernel decodes:

$$\text{value}(\theta) = \sum_{\ell=0}^{L-1} \text{decode}_\ell(\theta)$$

Same kernel and leaf positions each level, band bytes typically decreasing
(each residual is smaller than the last). Cascade levels are **precision**:
residuals of one breadth, over the same leaves. They are not depth. Depth's
levels (§2.8) are nested sweeps, each over its own octave. The `cascade:N=…,L=…,arctan=…` tag
signals that cascade reconstruction is required; a decoder ignoring it still
produces a valid level-0 reconstruction at the level-0 floor.

### 2.4 Canonical coefficient ordering

For breadth d (d doublings; §1) with 2^{d+1} leaf positions θ_k = kπ/2^{d+1}, k odd, coefficients
are stored by increasing k — left to right along the arc, the leaf positions
of Tangent Bridge §2.2. For 2D: row by row, top to bottom. For 3D: outer
dimension first (frames, then rows, then columns).

This is the only ordering — no progressive, importance-sorted, or plugin
orderings. Canonical order is depth-nested: the first 2^{d+1} coefficients are
the depth-d representation of the same signal at lower resolution, so
progressive rendering comes free from reconstructing prefix subsets.

### 2.5 Concatenability

A `.tvf` file MAY hold multiple TVF documents in sequence; each begins with its
own `TVF W H C` header, and boundaries are identified by the header line (no
delimiter). Parsers iterate documents to end-of-file. Files therefore compose
by shell concatenation — `cat a.tvf b.tvf > c.tvf` is valid and associative;
`awk '/^TVF /{n++; out="block-" n ".tvf"} {print > out}'` splits. This is a
syntactic packaging convenience only; it says nothing about whether signals
should travel together. A single-document parser reads the first document and
stops (forward-compatible); supporting concatenation is one outer loop around
the single-document parse.

### 2.6 Standard meta tags

`cascade:N=…,L=…,arctan=…` (reconstruction parameters), `range`, `type`,
`sample-rate`, `source`, `tags`. Validated by encoder/decoder roundtrip.
Application-specific conventions (medical, geospatial) are not yet
standardized.

### 2.7 What the format does not include

No binary mode (compression is a transport concern — gzip/zstd the text). No
progressive-ordering modes. No nested *syntax*, references, or schema: depth
is nested, but the nesting lives in `#meta address` tags on flat documents
(§2.8), not in the grammar. No native "resolution" field — the breadth d (the
leaf count's doublings) is the only resolution parameter.

### 2.8 Depth

TVF holds depth with no new syntax. A **depth file** is ordinary TVF documents,
one per sweep, concatenated (§2.5).

```
TVF 16 1 1
#meta type:depth
#meta address:@
#meta leaves:corner,halve,step
#meta reader:x0=…,y0=…,tx=…,ty=…,cx=…,cy=…,Rm=…
-3 c_0 c_1 … c_15
TVF 16 1 1
#meta type:depth
#meta address:@-1
-6 c_0 … c_15
TVF 16 1 1
#meta type:depth
#meta address:@-1.2
-9 c_0 … c_15
…
```

**Each document is one sweep:**
- W leaf values (16 in the reference), generated from the corner by halving and
  the tangent step, with no trigonometry;
- presented by the theorem's kernel mirrored about home.

**The address** places the sweep in the recursion:
- `@` is the reader's own sweep.
- `@k` is the sweep entered over octave k of the reading, the doublings
  2^(k−1) to 2^k.
- `@k.j` is octave j of that sweep's own reading, and so on.

Every octave holds the same sweep again, with its own home at its low wall,
its corner at its middle and its far wall at its high wall. Only the root
carries `#meta reader:`, the standpoint and frame, so that the reading can be
presented back in the coordinates of what was read.

**What a sweep holds** is what the levels above left, presented inside its own
octave only. The reading at an address is the root's presentation, plus the
presentation of each entered octave along the address's path. Which octaves
are entered is the writer's choice. The geometry does not depend on it; the
file's size does.

**Reading a depth file.**
1. Read each document's `#meta address`.
2. Present a reading by walking its address down through the entered octaves
   and summing their presentations.
3. Stop where an octave was not entered.

A reader of curves (two channels) skips these documents; a depth reader skips
anything not `type:depth`.

**What it holds in the reference.** In the reference (the drawing tool's depth
engine), a depth file holds a shape read from a standpoint on its outline:
- what is held is the shape's departure from the reader's unit circle, address
  by address, p(s) = h met ÷ 2s/(1+s²);
- octaves are entered over 2⁻⁶…2⁶ to level 3; since 7 October the file the
  drawing tool saves enters an octave only where it has something to hold, at
  τ = 10⁻⁶ of the departure, with each row flat at its children's walls
  (below, "The walls").

**Measured** (5 October 2026, `wander/tvf-depth-test.md`; 24 library shapes):
- **The round trip** through text changes the reading by at most 2.3×10⁻⁷ of
  the departure (8 significant digits).
- **Depth against breadth alone, at the same number of values:**
  - depth, 518 sweeps of 16 values (8,288 values in all), misses by 7×10⁻⁸
    to 6×10⁻⁶ of the departure at level 3;
  - breadth alone, one sweep of 8,192 leaves, misses by 3×10⁻⁶ to 5×10⁻³;
  - depth is better on 24 of 24 shapes, by 18× to about 5×10⁴.

  Packing leaves into one sweep spends them evenly over the reader's turn.
  Entering octaves puts a whole sweep wherever the reading is.
- **Size:** entering every octave whatever the shape gives 518 sweeps, about
  140 kB of text per shape.
- **Entering only where needed** (built 6 Oct, `draw.html?lab=dwn`):
  - **The rule:** an octave is entered only if the residual it would hold,
    read at its own leaves, exceeds τ of the departure. That residual is the
    very row the sweep would store, so a skipped octave is a row of
    near-zeros the file need not carry.
  - **Children** are considered only under an entered octave, since the
    reading cannot pass a missing sweep.
  - **Which octaves to enter** is the writer's choice (above), so a reader
    needs no change.
  - **Scoring:** over the same 24 shapes, at every address where the full
    file reaches level 3 (cell midpoints, off the walls).

  | τ | sweeps (median, range) | text (median) | worst miss |
  |---|---|---|---|
  | every octave | 518 | 137 kB | 7.9×10⁻⁸ … 6.2×10⁻⁶ |
  | 10⁻³ | 14 (9 … 30) | 4 kB | 9.4×10⁻⁴ |
  | 10⁻⁴ | 31 (24 … 58) | 8 kB | 9.9×10⁻⁵ |
  | 10⁻⁵ | 59 (43 … 111) | 16 kB | 1.0×10⁻⁵ |
  | 10⁻⁶ | 127 (79 … 244) | 33 kB | 6.2×10⁻⁶ |

  - **The miss tracks τ.** It is held to τ at the leaves the test reads,
    and overshoots between them by half a per cent at most (1.005 τ, the
    trapezoid at 10⁻⁵).
  - **At τ = 10⁻⁶:** where the full file itself misses by more than 10⁻⁶
    (egg, pill, Reuleaux, teardrop, knife), the economical file misses by
    the same amount, to the digit, from a quarter to a half of the sweeps.
  - **The cost of depth is set by the shape, not the range:** the circle
    needs 129 sweeps and the egg 244, where the full writer gives every
    shape 518.
  - **Corrected the same day:** these misses, like the 5 October ones, were
    scored only where the reading reaches level 3. Over the whole range,
    both files miss by up to 15% in bands at the walls (next).

**The walls** (7 Oct, `draw.html?lab=wls`). Scored over the whole range from
home to the far wall (2,000 points, none exactly on a wall), the full file
reaches level 3 on only 76% of it. Elsewhere it stops at level 1 or 2 and
misses by up to 15% of the departure (on the egg; 0.3% to 15% over the
library). There are two causes.

1. **A sweep is flat at its walls.** Its presentation is the theorem's kernel
   mirrored about home, with period π, so it is even about both of its walls:
   its slope there is zero (measured: 3×10⁻³ at the walls against about 7
   inside). What a level hands down generally slopes across a wall, so no sweep
   holds it near one. The miss there is the slope times the leaf spacing. Every
   child's walls are walls again one level down, so this happens at every wall
   at every level, and children entered toward a wall only halve the band, one
   per child: closing it that way took about 4,000 sweeps on the closed-form
   example.
2. **Children −2…3 reach ρ from ⅛ to 8 only.** Detail beyond that, such as a
   narrow bump near a wall, gets no level 2 at all.

**The fix is the writer's, and the format is unchanged.** A sweep is still a row
of W values that any reader presents the same way, but the writer chooses
them: the residual at the leaves, plus the least change that makes what the
sweep leaves behind flat at its children's walls (its slope matched, in log ρ).
A flat residual is what a mirrored sweep holds, so the next level holds it,
walls included. Only walls inside the sweep's leaf span are matched: beyond its
first and last leaf a sweep has no slope to give, and asking for it there blew
the rows up (8%). Children are then considered out to −12…13 and entered only
where needed (τ = 10⁻⁶).

Over the 24 library shapes, scored over the whole range:

| writer | sweeps (median, range) | reaches level 3 | misses > 10⁻⁵ | worst miss | inner walls (median) |
|---|---|---|---|---|---|
| every octave | 518 | 76% | 9.1% | 1.5×10⁻¹ | 1.0×10⁻³ |
| where needed, τ = 10⁻⁶ | 127 (79 … 244) | 2–35% | 9.1% | 1.5×10⁻¹ | 1.0×10⁻³ |
| flat walls, children ±4 | 218 (142 … 386) | 9–44% | 1.1% | 1.6×10⁻¹ | 1.4×10⁻⁴ |
| flat walls, children ±12 | 787 (317 … 1,398) | 10–45% | 0 | 9.9×10⁻⁶ | 1.4×10⁻⁴ |

- **Holding the whole range costs more than the full file:** a median of 787
  sweeps against 518, about 210 kB. It is the first writer that holds every
  point. Without flat walls the same children cost 4,037 sweeps on the
  example, so the flat rows are what make it affordable.
- **"Reaches level 3" stops meaning "held".** With flat walls a reading held
  at level 2 is already within τ there, so the writer stops, and the share
  reaching level 3 falls while the miss falls with it.
- **On the closed-form example:** 262 sweeps, 4.1×10⁻⁶ over the whole range,
  against the full writer's 518 sweeps and 1.5%. The inspector now writes its
  example this way.
- **The walls themselves still stop short.** At exactly s = 2^k the address
  runs to the end of its octave and goes no deeper, so a reading there is
  held only to level 1. Flat rows make that 7× closer (median 1.4×10⁻⁴
  against 1.0×10⁻³ at the inner walls), but they do not close it.

**What the recursion found.** The corner showed that one sweep can read a
shape's breadth: where the corner falls among the reader's arrivals gives back
how far the shape is stretched. Past the corner, when a reading needs more than
one sweep, the answer is recursion. That is a different thing from breadth.
Packing more leaves into one sweep is breadth. Depth is the same sweep again,
entered over one octave of the reading, with its own home, corner and far wall,
and so on down.

1. **Every level is the same sweep.** Seen from its parent, a child sweep lies
   in each half of its octave in the same proportions: fully clear at its home,
   half as clear at its corner, fully clear again at its wall. Every child lies
   the same way at every level (the drawing tool's nested-fisheye lab).
2. **A level holds only what the levels above left.** The root holds the
   shape's departure from the reader's unit circle. Each entered octave holds
   the residual inside that octave only. Nothing is stored twice, and the
   format needed no new syntax.
3. **Depth beats breadth.** At an equal count of values, depth was better on
   24 of 24 shapes (above). For a reader learning a shape at a distance, the
   nested reader's error stayed flat at 0.7% from 4 to 128 steps away, while a
   single sweep's grew 23-fold. That second result is recorded in the drawing
   tool's lab notes from an earlier run and has not been re-measured here.
4. **The cost follows the shape, not the range.** Entering an octave only
   where it has something to hold, with every row flat at its children's walls,
   keeps every library shape within 10⁻⁵ of its departure over the whole range,
   with 317 to 1,398 sweeps. The circle needs 810 and the egg 1,398. Recursion
   goes where the detail is, and to where the walls are.
5. **For complex shapes, recursion counts hiding, not intricacy.** A child
   reader can stand where its parent saw furthest. The levels then needed count
   how many times the way in turns out of sight, not how intricate the outline
   is. Measured in the drawing tool's labs and again in the gallery's
   *Where you stand* page: curls of 290° and 310° are seen 83% and 63% from
   outside, and whole once a reader stands inside; spirals past a full turn
   are seen at best 92%, 73% and 66% from one standpoint, outside or in; a
   chain of readers works its way out to the mouth and no further, and the
   deepest library spiral needs six levels.

In short: a bounded reader holds a complex shape not by looking harder but by
looking again, as the same sweep, wherever the last look left something
unexplained, and only there. Two things stay open: the walls between octaves
(below), and a derivation of why amplification adds across levels rather than
multiplying (next).

**Relation to composition.** A depth file is the depth case of the Bridge's
composition: bridges driving bridges (Tangent Bridge, algebraic form §12.5).
Composition's amplification adds across levels rather than multiplying. The
measured agreement above is consistent with that; it has not been derived
for the depth case.

**Open:**
- entering octaves only where needed. Built (above). The drawing tool's saved
  files use it at τ = 10⁻⁶ with flat walls (7 Oct): the circle saves in 810
  sweeps (219 kB), the egg in 1,398 (378 kB), read back through text to
  2.0×10⁻⁷. What is left is choosing τ for other uses, and whether a writer
  should also enter between an octave's leaves when the residual peaks there;
- a depth reader in the reference decoder. One now runs outside the drawing
  tool: the gallery's inspector (`gallery/inspect.html`) reads a depth file,
  pasted or built from its example, and puts it back on the shape level by
  level. Its engine is the drawing tool's, copied unchanged and kept matched
  by the smoke test. On the closed-form example, a unit circle with two
  bumps, it misses the shape by 4.8×10⁻⁶ of the departure at level 3, scored
  only where the reading reaches level 3. It reads its 518 sweeps back
  through text to 1.1×10⁻⁶;
- the walls themselves. The bands beside them are closed (above, "The
  walls"); the points s = 2^k are not. A reading there runs to the end of its
  octave (ρ = ∞) and goes no deeper, so it is held only to level 1: 1.4×10⁻⁴
  of the departure at the median inner wall with flat rows. Closing it is a
  reading rule, not a writer's choice. For example, a reading that lands on
  a wall could be read as the limit from inside its octave. That would change
  how every reader descends, so it is left open;
- depth rows for readers nested in readers (a chain of standpoints rather than
  octaves of one reading).

---

## 3. Kernel and reconstruction

Reconstruction evaluates the Bridge kernel K_N at the target positions:
exact at leaves (R1/R2), bounded between (R3). Rendering at an arbitrary
resolution is kernel evaluation at that resolution's sample positions — there
is no intermediate grid and no separate resample.

**The Gibbs cost.** At a discontinuity ω_F does not decay and R3's bound
becomes the Gibbs floor. Measured, stable across N = 16…1024:

- **Overshoot constant 0.1411 per unit jump** for the K_N kernel (not 0.0895,
  which is the Fourier partial-sum value). Closed form
  (Si(π) − π/2)/2 = Wilbraham/ψ₁ ≈ 0.1406, matching measurement to empirical
  precision.
- **Ringing envelope** |r_n| → ψ₁/(2x_n) = 1/(π x_n) far from the jump —
  classical 1/x decay with ψ₁ as the structural coefficient.
- Overshoot is stable, linear in jump size, width O(1/N).

Gibbs is not a defect to be engineered away; §5's evidence is that removing it
requires removing the rendering target's resolution preferences. It is the
bounded observer's cost of presenting a discontinuity, the same seam the
framework names as the bandwidth horizon.

**The kernel is rational, and the decoder can be trig-free.** In slope
coordinates K_N is a ratio of integer polynomials (the pair-power form), the
difference of positions is the Möbius composition of held slopes, and the
whole decode path evaluates no trigonometric function. Three arithmetic
regimes, characterized (Tangent Bridge algebraic form, OI-10): naive
double-precision pair powers **overflow at N ≥ 128** (the norm Q^{N/2}
exceeds double range near the horizon) — do not ship this; per-step
normalized pairs (one square root per step, drift to be measured); and
**log-magnitude + sign** — which is the IEEE-754 reading the format already
owns: the band byte *is* the exponent, so the format's own structure is the
kernel's stable arithmetic. The trig forms remain valid and are the current
reference implementation's path; the rational form is what makes an
exact-arithmetic oracle possible.

**Chord projection.** Under cosine projection the TVF coefficients are
Chebyshev coefficients; the arcsine node clustering is exactly the Chebyshev
distribution — algebraically, the chord is the first cosine character Re ζ,
and the Chebyshev nodes are the closure torsion's shadow. TVF and Chebyshev
interpolation are the same object read in two charts.

---

## 4. Encoding

### 4.1 Pipeline

Forward transform → leaf coefficients → band extraction → arctan quantization
→ text. The forward transform's robust regime uses M = 2N samples with BOMA
closure; outside it (high noise, near-Nyquist) it has no graceful degradation
and encoders must detect and route elsewhere.

### 4.2 Arctan quantization

8-bit arctan ≈ 14-bit linear, verified. The mechanism works on any
zero-centered distribution — not specifically Cauchy, a framing correction
from earlier versions.

### 4.3 The cascade as precision extension

Each cascade level encodes the residual of the previous, summed at decode.
Per-level residual reduction ~40–45 dB (8-bit arctan), verified across L = 1…7
until the kernel-reconstruction floor or machine epsilon. Archival fidelity
(90+ dB) reached on smooth peaked content at N = 128, L = 3. This corrects the
early "single-level caps at 45–80 dB" conclusion: with the cascade engaged,
TVF reaches 90–124 dB on smooth content.

---

## 5. Operations

Because a TVF file is a band byte and a coefficient array — the discrete coordinate of an element of the observer's held space — the operations available on it fall into three tiers distinguished by what guarantees them. The first tier is *exact by theorem*: it rides the linearity and nesting of the Bridge and holds to machine precision for in-band content. The second is *read from the array*: a quantity derived directly from the coefficients. The third is *inherited from text*: capabilities the file possesses simply by being whitespace-separated numbers, which no closed form or binary blob has. Each operation below has been run on real arrays and verified (`tvf_ops.js`); the precision figures quoted are from that record.

### 5.1 Exact by theorem — coordinate change, arithmetic, edit, resolution

**Reconstruct and sample.** Rendering is kernel evaluation at the target positions (Ψ_d); sampling reads the reconstruction at the leaves (Φ_d). The round-trip Φ_d ∘ Ψ_d is the identity (verified to 9×10⁻¹⁶). The kernel has effective locality, giving a constant-time-per-pixel property in the sampled regime and a full-domain fast path when the whole signal is rendered at once.

**Merge, blend, scale, rotate.** Any linear combination is coordinate-wise arithmetic on the arrays, exact by the linearity of Ψ_d: additive merge A+B, weighted crossfade wA+(1−w)B, scalar scaling (the band byte shifts to match), and the combination-law rotation, which commutes with the coordinate change. No equation is derived and no algebra performed; one adds the vectors.

**Edit.** A coefficient edit is local — it affects the reconstruction near its leaf and leaves the rest untouched — and decomposes exactly as baseline plus a sparse delta. This is the composite-model workflow: keep a baseline and carry anomalies the baseline misses as hand-placed perturbations on individual leaves, which the Bridge keeps continuous, exact at the edits, and local.

**Refine and coarsen.** Refinement N→2N re-reads the presentation at the 2N new leaf positions — which *interleave* with the old ones; no old leaf position survives (corrections log C-1, Tangent Bridge algebraic form §3.4: successive lattices are disjoint) — and the coarse content re-embeds **exactly** by the band nesting V_N = B_N ⊂ B_{2N}, now proved (character indices), previously verified (8×10⁻¹⁵). The corrected slogan is operational: **positions interleave, content nests** — refinement is a lossless re-read, not a retention of old atoms plus insertions, and implementations that copy old coefficients forward instead of re-evaluating are wrong by construction. Coarsening down-samples to fewer leaves. Refinement can be local — placed where the aliasing signature flags unresolved content — so resolution is a per-region dial.

### 5.2 Read from the array — analysis

**Energy** is Σc² times the leaf spacing — Parseval on V_N, now *proved* as finite character orthogonality (Tangent Bridge algebraic form, Theorem 4.7(4)) rather than inherited: the band basis has Gram diag(N, N/2, …, N/2, N) over the leaves. In the leaf basis the Σc² formula is unaffected; an implementation computing energy in the *character* basis must carry the doubled weight on the two extreme modes (constant and top sine) or it is wrong by exactly a factor of 2 there. **Differentiation** at the leaves is a fixed linear map on the coefficients — slope without leaving the discrete coordinate. **Any bounded functional**, including the value of the presentation at an arbitrary query point, is a fixed linear combination of the leaves. The **band byte** gives the signal's scale in O(1) as the IEEE-754 exponent (the rung). The **shape** is human-legible directly: equal values read as flat, alternating as oscillation, one-large as a spike. And the **aliasing signature** — content that samples to a lower mode than it carries — is a positive diagnostic for under-resolution, and simultaneously points to where density should be added. The signature now has a closed form: on the lattice ζ^N = −1, so mode N/2 + r folds to −(mode r − N/2) — fold-down with a sign — and the canonical invisible content is the even top character X_N/Q^{N/2}, which every atom reads as exactly zero. That mode doubles as a **decoder test vector**: encode it and every coefficient must be 0 (§8).

### 5.3 Diff — two meanings, both native

Diff deserves its own note because the word means two different useful things here, and TVF supports both. **Numeric diff** is the residual signal A−B, itself a TVF signal (exact, 4×10⁻¹⁶): the difference of two curves, ready to reconstruct, inspect, or version — the natural tool for comparing signals or measuring a correction. **Text diff** is the version-control kind: editing one leaf changes *exactly one token* in the file, so the format is line-diffable and a signal's edit history supports blame, merge, and per-leaf history the way source code does. The first is an operation in signal space; the second is an operation in text space; the same file affords both.

### 5.4 Validate — the points as oracle

The coefficients are ground truth against which any candidate closed form is checked by evaluation rather than trusted by derivation. When a merged or fitted equation is uncertain, sampling it at the leaves and comparing to the stored coefficients catches a wrong candidate immediately (a wrong merge guess was caught at error 0.14) and confirms a correct one to machine precision. The discrete coordinate is both the site of the operation and the test set for any equation later written to summarize it.

### 5.5 Inherited from text — tooling

Because the file is whitespace-separated numbers, it **parses** in any language with a split, **filters** through standard text utilities (grep for a band, awk for the band column, head/sort for slices), and **drops into version control** as ordinary text — the diff, blame, and merge of §5.3 with no format-specific tooling. This tier is not engineered; it is inherited, and it is precisely what a closed form (which cannot be blamed for a one-leaf change) and a compressed binary (which cannot be grepped) lack.

### 5.6 Level-of-detail from one master (validated)

A single TVF master rendered across a field of instances, with each instance's band set by viewing-geometry clarity (depth × tangent cull), generates the full band ladder (silhouette → full detail) from the one master with nothing precomputed per level. This inverts the mipmap model: **bands are produced by observation, not authored.** Demonstrated end-to-end on an imported 32-leaf contour (`chess_trillion_2d_pawn.html`). Content-kind band floors are required and verified: open signals K ≥ 1, closed contours K ≥ 4 (below which a closed contour collapses to a degenerate sliver).

### 5.7 Scope

The exact operations of §5.1 are exact for in-band content; above the bandwidth horizon, merge and refine approximate and aliasing intrudes, the same limit that governs the format throughout (§1.3). "Merge" is exact for *linear* combination — a product of two signals spreads modes and may exceed the working resolution, which is exactly the case the oracle of §5.4 exists to catch.

---

## 6. AI consumption

**What AI sees:** the coefficients as text — readable, reasonable-about,
emittable. **What AI can do:** read, edit, and generate TVF directly; a
multi-modal model sees one coefficient format across modalities. **What AI
cannot do without further training:** interpret the coefficients as perceptual
content (that requires learning the cascade representation). **Contamination
note:** training on codec-delivered media injects JPEG/MP3 artifacts; TVF's
value as a training format is that it carries the cascade representation
without them. Empirical training results are not yet measured — this is
structurally enabled, not demonstrated.

---

## 7. Operating envelope

Assumes the recommended cascade configuration per content class. Single-level
encoding caps 30–50 dB below these and is the wrong setting above mid-quality.

| Content type | TVF (cascade) | Recommended (N, L) | Use TVF? |
|---|---|---|---|
| Smooth peaked (Gaussian-like) | 89 dB @L=3 / 124 dB on tanh-step | 128, 3 | Yes — archival |
| Smooth oscillatory (instruments, voice) | 67–76 dB | 128–256, 2–3 | Yes — mid/high |
| Smooth scientific / sensor / curves | +40–60 dB over Lanczos | 64–128, 2 | Yes — native |
| Lipschitz / Hölder | 50–72 dB (kernel floor) | 256, 3 | Yes — mid |
| Photographs, natural scenes | 30–35 dB (segmented) | 128, 2 + segmentation | Yes, with segmentation |
| Audio with sharp transients | 19–25 dB plateau | segmented | Marginal |
| Images with text / UI | −2 to −6 dB vs PNG | — | No (use PNG) |
| Near-Nyquist / chirp | −40 to −50 dB | — | No (FFT-based) |
| Noisy (>5%) | degrades | regularize first | Conditional |

**Storage.** One signal at archival fidelity (N=128, L=3) is ~700–1300 bytes
gzipped. TVF gzipped is smaller than every raw representation of the same
samples at the same fidelity (PCM16, float32, raw text). On a real audio file:
at the transparent point (5 sig digits) TVF.gz ≈ 385 KB, a tie with FLAC
(~390 KB); at bit-exact (N=M, 8 digits) ≈ 790 KB, ~2× FLAC. TVF is a
representation, not a delivery codec — it lands in the standard formats'
ballpark at the transparent point and wins on architecture (editability,
resolution-independence, content-agnosticism, text access), not on bytes.
FLAC remains the byte-efficient choice for pure lossless storage.

---

## 8. Reference implementation

Encoder: forward transform, band extraction, arctan quantization, text
emission with `#meta` tags. Decoder: parse header/meta/rows, kernel decode
(summing cascade levels), render at target resolution. Reference
implementations are browser JavaScript; production GPU shaders are planned,
not built. Test surface: R1 round-trip at leaves, R2 on pathological content,
R5 off-leaf leakage, cascade fidelity per level, `#meta` roundtrip.

**Exact oracle and canonical test vectors (new).** Because the kernel
identities are integer-polynomial, the regression floor can be exact rather
than 10⁻¹⁵: an exact-rational reference decoder (pair powers over ℚ, or the
companion verification scripts' companion-trace arithmetic) gives
partition-of-unity and δ_jk as *identities to hold*, not tolerances to meet.
Three canonical vectors, all theorem-backed: (i) **the invisible mode** —
encode X_N/Q^{N/2}; every coefficient must be exactly 0 (aliasing theorem);
(ii) **the band Gram** — leaf-evaluate the band basis; the Gram must be
diag(N, N/2, …, N/2, N) (discrete Parseval); (iii) **the home sum** — the
decoder's Lebesgue function at home must equal (2/N)·Σ 1/τ_k over positive
leaves, which is also the measured amplification peak (verified at machine
precision to d = 9). Any drift in these three localizes a kernel bug faster
than SNR regression does, because each is an identity with a proof attached.

**Built (6 October 2026).** The three vectors run against the drawing tool's own
decoder, its leaf positions, kernel and evaluator, at N = 8 … 1024 (the lab
`draw.html?lab=vec`, and a step of the repository's smoke test). In float64,
"exactly" is to rounding:

| N | (i) invisible mode, worst leaf | (ii) band Gram, worst entry ÷ N | (ii) band modes presented between leaves | (iii) home sum (2/N)·Σ 1/τ_k |
|---|---|---|---|---|
| 8 | 2.8×10⁻¹⁵ | 5.4×10⁻¹⁶ | 2.3×10⁻¹⁵ | 1.847759 |
| 32 | 8.8×10⁻¹⁵ | 1.3×10⁻¹⁵ | 1.1×10⁻¹⁴ | 2.727778 |
| 128 | 4.3×10⁻¹⁴ | 4.2×10⁻¹⁵ | 5.1×10⁻¹⁴ | 3.610161 |
| 512 | 1.9×10⁻¹³ | 1.4×10⁻¹⁴ | 2.0×10⁻¹³ | 4.492693 |
| 1024 | 3.8×10⁻¹³ | (not run; O(N³)) | 3.1×10⁻¹³ | 4.933964 |

- **(i)** is read twice: by cosine, and trig-free as Re[(1+is)^N]/(1+s²)^{N/2}
  at the leaf slopes; the column is the worse of the two. On a grid half a leaf
  off (the even nodes 2πk/N), the same mode reads ±1 at every point.
- **(ii)** also checks the decoder. Every band mode, the visible top mode
  sin(Nθ/2) included, is sampled at the leaves and presented between them
  exactly.
- **(iii)** equals the Lebesgue function at home to 10⁻¹⁴ relative. No point of
  the cell reads higher, on a 401-point grid across it. The values are the
  Lebesgue constants the spectral companion publishes (§19.3: 1.848, 2.728,
  3.610, 4.493), and every one clears the proved floor (√2−1)d/2.

The vectors are worth what they catch. Two deliberate decoder bugs were
planted and both fail by O(1), not by a drift:
- **Leaves half a leaf off:** the invisible mode reads 1, and the Gram is off
  by N.
- **The odd-N kernel used at even N:** the home sum reads 2.287 at N = 8,
  against 1.848.

**The exact reference decoder (6 October 2026).** It needs no rational
arithmetic at all, only integers, because N is a power of two.

**The ring.** Put ζ = e^{iπ/2N}. Then:
- ζ^{2N} = −1, and x^{2N} + 1 is the cyclotomic polynomial of order 4N,
  irreducible over ℚ;
- so 1, ζ, …, ζ^{2N−1} are linearly independent, and an element of ℤ[ζ] is
  zero exactly when its 2N integer coefficients are.

**The lattice.** Every angle the format uses is a power of ζ:
- the leaves θ_k = (2k+1)π/N are ζ^{2(2k+1)};
- their half-angles are ζ^{2k+1};
- home and the other midpoints are ζ^{4j}.

**The kernel.** It is a trigonometric polynomial,
2N·K_N(φ) = 2 + Σ_{m<N/2} 2·2cos mφ + 2cos(Nφ/2), with 2cos(eπ/2N) = ζ^e + ζ^{−e}.
So at a lattice angle it is a vector of small integers: no division, no
square root, no transcendental. Each identity is then an equality of integer
vectors.

Run in the drawing tool (`draw.html?lab=exa`, and a smoke-test step) at
N = 8 … 1024. Every integer stays inside 2^53, so ordinary JavaScript numbers
hold them exactly:

| check | as an identity in ℤ[ζ] | result |
|---|---|---|
| R2 | 2N·K(θ_j − θ_k) = 2N·δ_jk, every pair | exact, N = 8 … 1024 |
| partition of unity | Σ_k 2N·K(φ − θ_k) = 2N at a leaf, at home and at both quarter points (a shift by one leaf covers every other lattice angle) | exact, N = 8 … 1024 |
| (i) invisible mode | ζ^{N(2k+1)} + ζ^{−N(2k+1)} = 0 at every leaf; nonzero at every even node | exact, N = 8 … 1024 |
| (ii) band Gram | Σ_k b_i b_j = diag(N, N/2, …, N/2, N), each basis value scaled into ℤ[ζ] (2, 2cos, 2i·sin) | exact, N = 8 … 256 |
| (iii) home sum | N·K(−θ_k)·sin(θ_k/2) = (−1)^k cos(θ_k/2) at every leaf, so Σ_k \|K(−θ_k)\| = (2/N)·Σ 1/τ_k term by term | exact, N = 8 … 1024 |

**The oracle.** Seeded integer leaf data in [−1000, 1000] is decoded exactly
at nineteen lattice angles per N:
- each result is real (the element equals its own conjugate, v_e = −v_{2N−e});
- at the leaves it is the data;
- read once in float and compared, the float decoder (`tvf.evalAt`) agrees
  with it to 7×10⁻¹⁴ of the data scale or better, at every N.

**What it caught, and what it could not see.** Two planted bugs:
- **The odd-N kernel in the float decoder:** off the exact one by 0.12.
- **The top mode at full weight** (cos(Nφ/2) counted twice): R2 fails.

The partition of unity and the home identity both pass that second bug, and
rightly. On an even number of odd nodes the top cosine sums to zero, and it
is zero at every leaf seen from home, so its weight is invisible to both.
Only R2, which looks at one kernel at a time, sees it. Of the four
interpolation identities, R2 is the one a decoder's Nyquist handling must be
tested against.

---

## 9. Status

**Proved (upgraded from validated) — Tangent Bridge algebraic form:**
R1/R2 and partition of unity as integer-polynomial identities; lossless
refinement (band nesting B_N ⊂ B_{2N}; the positional claim corrected — atoms
interleave, C-1); discrete Parseval with explicit Gram; the aliasing identity
and the invisible mode; R3's constant bounded two-sidedly from the pair
algebra ((√2−1)d/2 ≤ Λ ≤ C(d+1)); the amplification peak located at home
with Λ = (2/N)·Σ 1/τ_k (equality verified to d = 9; the closed form presumed
classical pending cite-check — the pair-algebra provenance is the claim;
observer-court midpoint-maximality step open).

**Operationally validated:** R1/R2/R5 to machine precision; R3 as a loose
upper bound (class-dependent constant, now bracketed by the proved bounds); cascade SNR decay 2^{−r(ν+1/2)} to
within 0.01 across ν ∈ [0.5, 5]; Gibbs constant 0.1411 and ringing envelope;
arctan ≈ 14-bit-linear; cascade precision extension (~40–45 dB/level to the
floor); TVF.gz smaller than all raw forms at equal fidelity; encoder/decoder
roundtrip with meta tags to 0.01 dB; master-and-reconstruct LOD from one
contour; closed-contour band floor (K ≥ 4).

**Decoder test vectors (§8), built 6 Oct 2026:**
- **What:** the invisible mode, the band Gram and the home sum, run against
  the drawing tool's decoder at N = 8 … 1024.
- **Result:** all three hold to rounding, and the home sums are the published
  Λ_N.
- **Do they catch bugs?** Yes: a half-leaf shift and a wrong-parity kernel
  each fail them by O(1).
- **Then exact:** the exact reference decoder holds them to the last bit,
  with R2 and the partition of unity, as equalities in ℤ[ζ] (N = 8 … 1024;
  the Gram to 256). The float decoder agrees with it to 7×10⁻¹⁴.

**Depth (§2.8), measured 5 Oct 2026:** depth held in concatenated TVF documents
with `#meta address`, no new syntax; round trip to 2.3×10⁻⁷ of the departure;
at equal value count, better than breadth alone on 24 of 24 library shapes
(18× to about 5×10⁴). A depth reader outside the drawing tool, in the
gallery's inspector (6 Oct): level 3 within 4.8×10⁻⁶ of the departure on the
closed-form example. Entering octaves only where needed (6 Oct): at τ = 10⁻⁶
of the departure, 79 to 244 sweeps (median 127, against 518) with the miss
held to about τ where level 3 is reached. The walls (7 Oct): over the whole
range every file so far missed by up to 15% in bands at the walls between
octaves, because a sweep is flat at its walls. Rows chosen to leave flat
residuals there, with children out to ±12 entered where needed, hold every
library shape to 10⁻⁵ over the whole range (317 to 1,398 sweeps, median 787).
The drawing tool's saved depth files use that writer. Open: the wall points
s = 2^k themselves, where a reading stops at level 1 (1.4×10⁻⁴ at the median
inner wall).

**Partially validated:** forward transform on *real* (non-synthetic) sensor
output; multi-depth segmented encoder (30–33 dB on landscapes, tuning open);
AI training on TVF (structurally enabled, not measured); domain-specific meta
conventions.

**Open:** real captured-data round-trip on photos and audio (synthetic only so
far); regularization above 5% noise; production GPU shaders; the full 16-bit
N×L cascade sweep; more tokenizer-efficient text encodings; benchmark of the log-magnitude/band-byte kernel arithmetic against
the trig path (OI-10's implementation gate — no speed claim until run).

---

## Appendix — retired from earlier versions

Recorded once so the history is unambiguous. The following were in v18–v22 and
are withdrawn:

- **Binary format** (v19's 64-byte header / "production binary mode"). TVF is
  text; compactness is gzip/zstd at transport.
- **Multiple progressive orderings** (v19's four modes). Only canonical
  positional order remains; progressive rendering comes from prefix subsets.
- **Consumer-marketing positioning** ("audiophile format for eyes," "infinite
  zoom on 2035 displays"). TVF is interchange, not consumer delivery.
- **"5–20× gzip" and "TVF.gz beats FLAC by 32%"** — extrapolations validated
  only by ear. Remeasured: TVF.gz *ties* FLAC at the transparent point, ~2×
  at bit-exact. Withdrawn.
- **Diagnostic triad as predictive** — stress testing showed jump ratio,
  kernel residual, and depth adequacy are correlative, not predictive.
- **0.0895 Gibbs constant** — the Fourier value; the K_N kernel's is 0.1411
  (measured).
- **"Single-level caps the format at 45–80 dB"** — false with the cascade
  engaged (90–124 dB on smooth content).
- **"No metadata tags"** — reversed; `#meta` is a format-level concern.
