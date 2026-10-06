# The Tangent Bridge Theorem

### *Discrete geometric atoms, presented continuously on the bounded observer's virtual circle*

## Abstract

*The Geometry of Bounded Observation* (the foundational paper) builds the bounded observer from a single set primitive — the geometric atom, the interval of ratios $[0,\infty]$ — and closes it into a virtual circle. This paper proves the theorem that says what that observer does with continuous content: it holds the content as a finite set of atoms and presents it as continuous on its circle, exactly at the atoms and with bounded error between. The Tangent Bridge is the formal statement of the foundational thesis — *bounded observation is discrete geometric atoms presented continuously on the virtual circle.*

**Two coordinate systems, one circle — and this is the part a first reading misses.** The reconstruction is *proved* in one coordinate system and *executed* in another. The proof lives in the angle chart (the arc coordinate $t$, whose total is the arc's $\pi$) — circle, Fourier modes, Lebesgue constant, Jackson estimate — the language classical approximation theory already speaks. The operation lives in the slope chart (the held ratio $s$, whose total is the chord's $2$) — ratios, the reciprocal, the Cauchy measure, Möbius composition, dyadic refinement — where the same kernel is algebraic and carries no trigonometry. These are not two objects but one: the closed projective line $\mathbb{R}\cup\{\infty\}\cong S^1$ in two coordinate systems, related by the tangent $s=\tan t$ — both charts named by their coordinate, so the chart change is the tangent itself. (The kernel of §4.1 is displayed in the surveyor's period-$2\pi$ arc $\varphi = 2t$, in which the same chart change reads $s=\tan(\varphi/2)$; see the Convention below and §10.1. Every formula in this paper is in one arc or the other, never both, and the half-angle is not optional.) The observer *holds* the circle in the slope chart, where its operations are algebraic; the surveyor *describes* it in the angle chart, where its theorems are already proved. So the bridge is not "trigonometric interpolation on a circle"; it is a reconstruction theorem proved in trigonometric coordinates and executed in non-trigonometric ones. Two honesties keep the operational claim exact: the slope frame is *algebraic* — rational in $s$ with the single square root $\sqrt{1+s^2}$ as its only non-rational step, the constructible tier of the foundational §10.1, not the rational field — and it is trig-free in the reconstruction *given a slope-posed query*; a lone tangent enters only to convert a query supplied as an angle, a boundary conversion outside the operation. Put most sharply, this is why the proof and the operation live in different charts: the angle chart is *engineering of the completed circle* — its periodic functions and closed identities are defined on a finished $2\pi$, all of it present at once — while the slope chart is the algebra a bounded observer runs on the circle it only ever holds open (foundational §9.5, §###). The proof needs the completed circle and is right to use it; the operation never completes the circle, so it cannot, and need not. The two charts then divide the labour by *which* result is at stake, and the division is clean. The totals make the charts' exchange rate explicit: converted whole — one completed circle at a time — they trade at $2/\pi=\psi_1$ slope-to-angle and its reciprocal $\pi/2=1/\psi_1$ back (§7.4, §7.5), a rate itself denominated one unit per chart, a $2$ from the slope side over a $\pi$ from the $\pi$ side. The **classical bound** — bounded-between (R3), the Lebesgue constant times Jackson — is the surveyor's completed-circle theorem, and it is proved in its native angle chart, where Erdős–Turán and Jackson already sit; re-posing that proof trig-free would restate a completed-circle result in coordinates that add nothing to it, so the angle chart is the bound's proper court, not scaffolding to discard. The **inside results** — the exact round-trip (R1), node-exactness (R2), inside-boundedness (R5), and the kernel evaluation the operation runs on — are the observer's, and *these* are genuinely trig-free on the slope: rational in $s$ over the single $\sqrt{1+s^2}$ tier, the count of $\sin/\tan/\arctan$ calls held at zero, verified to machine precision for $N$ up to $1024$ (partition of unity, node-exactness, and the numerically evaluated Lebesgue figure all reproduced without trigonometry). The Lebesgue constant's leading coefficient does surface, read in the observer's coordinate, as an algebraic integral over the surveyor's normalization — the $2/\pi$ decomposed in §7.5, its $2$ observer-side and its $\pi$ the arc-total the observer declines — but that *locates* the $\pi$; it does not re-derive the classical asymptotic trig-free, which remains the inherited, coordinate-agnostic Lebesgue computation — from which the paper takes the constant $2/\pi$ directly, as an established value. The division that remains is global-versus-local as much as surveyor-versus-observer: the classical bound maximizes over the whole loop — a completed-circle act, native to the angle chart — while the operation reads one point — a held-open-circle act, native to the slope. So $\pi$ is not optional but *placed*: it sits in the surveyor's normalization and in the classical bound's native coordinates, and is absent only from the observer's operation.

**Convention — two arcs, one letter each.** Two angular coordinates run through this paper and they differ by a factor of two, so each gets its own letter and no formula mixes them.

| symbol | total | whose | role |
|---|---|---|---|
| $t$ | $\pi$ | the observer's — the **inside** arc | the coordinate the chart change is stated in: $s=\tan t$ |
| $\varphi = 2t$ | $2\pi$ | the surveyor's — the **outside** arc | the coordinate the kernel is displayed in: $K_N(\varphi)=\sin(N\varphi/2)/(N\tan(\varphi/2))$ |

Consequently **the chart change to the slope is $s=\tan t=\tan(\varphi/2)$** — the half-angle whenever $\varphi$ is the argument, and this is a claim with numerical teeth, not a bookkeeping preference: substituting $s=\tan\varphi$ into the rational kernel of §11 misses $K_N$ by $O(0.6)$ at every $N$ tested, because it puts the nodes in the wrong place. The two forms are related by Proposition 10.1, $K_N(2t)=\tilde K_N(t)$; the leaves are stated in $\varphi$ ($\theta_k=k\pi/N$, $k$ odd) and the observer's operation in $t$. One further overload is inherited from the foundational paper and is left standing, because renaming it would fight the corpus — but it is named here so it cannot be read past. The letter $\theta$ carries two roles: the **leaf positions on the outside circle**, $\theta_k = k\pi/N$ with $k$ odd, which is where §1 and §4 place the atoms; and the **foundational line-representation arc** in $x=\tan\theta$ (§10.2, §11), which is inside, of total $\pi$, and related to the first by the same $\varphi=2\theta$. So $\theta_k$ read as a leaf position and $\theta_k$ read as a line coordinate differ by a factor of two, exactly as $\varphi$ and $t$ do. Every appearance below states which is meant.

The theorem rests on two properties of the observer, one per side of the round-trip, and the organizing claim of this paper is that the theorem *is* those two properties:

- **Boundedness makes a finite representation possible at all.** A continuous signal on an unbounded domain cannot be carried by finitely many readings — the tail escapes, no uniform error bound exists. The bounded observer's domain is compact (the finite hold of the foundational §3, closed into the circle of §8), and on a compact domain finitely many readings determine continuous content to bounded, vanishing error. Without boundedness there is no bridge.
- **Uniformity makes the representation exact.** A circle is uniform by definition: every point alike, equal arc carrying equal weight, one intrinsic measure and only one. The observer's readings sit at an even spacing of that uniformity — the leaves — and a uniform grid on a uniform domain reconstructs exactly at its nodes and partitions unity between them.

Formally, let $F : S^1 \to \mathbb{R}$ be continuous and $d \geq 0$. The **forward map** $\Phi_d$ reads $F$ at the $N = 2^{d+1}$ leaf positions $\theta_k = k\pi/N$ ($k$ odd, $|k| \leq N-1$) — the atoms the rung structure forces. The **reverse map** $\Psi_d$ presents them as continuous through the even-$N$ interpolation kernel $K_N(\varphi) = \sin(N\varphi/2)/(N\tan(\varphi/2))$ — the angle-chart form for the classical proof; in the slope chart $s = \tan(\varphi/2)$ the same kernel is the rational Cauchy form $K_N = \operatorname{Im}[(1+is)^N]/(N\,s\,(1+s^2)^{\lfloor N/2\rfloor})$ (§11 — the exponent is a floor, and the earlier $N/2$ was the even case only; §11's correction), which is what the observer evaluates (the two charts above). One reading of $N$ must be set straight before the statement, because it is the point of the construction: $N = 2^{d+1}$ counts the leaves of the *completed* grid at depth $d$, and the observer never draws them. It draws the leaves in view — call their number $K$, the rungs actually synthesized (§16), filling on demand and holding only those. $N$ is the surveyor's count of the grid filled to the horizon, the limit of $K$; the observer sits at some finite $K \le N$ and never has $N$. The maps below are written over $N$ because that is how the *surveyor* states a theorem about the completed grid; the *observer* realizes them at $K$ — the same proof-on-the-completed-circle / operation-on-the-held-one split, now in the leaf count. (This count $K$ is not the kernel $K_N$.) The **Tangent Bridge Theorem** states:

1. $\Phi_d \circ \Psi_d = \mathrm{id}$ on $\mathbb{R}^N$ — exact discrete round-trip.
2. $(\Psi_d \circ \Phi_d)(F)(\theta_k) = F(\theta_k)$ at every atom.
3. $\|(\Psi_d \circ \Phi_d)(F) - F\|_\infty \leq C\,\log N\,\omega_F(\pi/N)$, $C$ absolute — bounded between.
4. $(\Psi_d \circ \Phi_d)(F) \to F$ uniformly as $d \to \infty$ on the Dini–Lipschitz class (every Hölder class included). The restriction is necessary: $\Lambda_N \to \infty$ forces divergence on some merely continuous $F$ (§6.4), and §7.4 records that this cost is universal to finite-rank linear recovery, not particular to the leaf grid.
5. Neither map invokes any global functional of $F$ — only the atom readings, and only the $K$ in view. The observer never knows $N$ — $N$ is not its object but the limit of the $K$ it has drawn, the completed grid a bounded observer never fills.

Each property is one of the two roots, made precise. (R1) and (R2) are **uniformity** — the leaves lock to the circle. (R3) and (R4) are **boundedness** — compactness gives a modulus-of-continuity bound that vanishes with depth. (R5) is the **discrete holding** — every read is $O(1)$, the domain never enumerated, only projected; the observer draws its $K$ leaves and stops, $N$ being the surveyor's name for the limit it never reaches. The mathematical content of (R3) is the classical Lebesgue-constant–Jackson bound for trigonometric interpolation at equispaced nodes; that bound is the metric machinery the circle supplies. What is specific to the framework is the recognition that the rung structure's leaves are the atoms, that the circle's uniformity is why they lock, and that boundedness is why a bridge exists at all.

Three extensions sit downstream of the main theorem. The **Chord Projection Corollary** (§9) identifies the leaves' cosine projections as the Chebyshev nodes of the first kind, recovering Chebyshev interpolation; the kernel's $\tan(\varphi/2)$ is the projection Jacobian (§11; uniform angle reads as the interval's arcsine density under $\cos$ and the line's Cauchy under $\tan$). The **separable extension** (§12) carries the theorem to product tori $T^d = (S^1)^d$ by tensor product — audio, images, surfaces, animation under one kernel. The **LCA framing** (§13) places the bridge as the operational form of Pontryagin duality on connected locally compact abelian Lie groups $\mathbb{R}^n \times T^m$ — which is uniformity's payoff, *a homogeneous group has a Fourier transform* — verified at machine precision on every $n + m \leq 4$ case tested. The proof is once; the applications are downstream.

---

## 1. Introduction

### 1.1 The foundational result this paper formalizes

*The Geometry of Bounded Observation* establishes that a bounded mechanism — anything that points — has a geometric atom: the interval of ratios $s = v/h \in [0,\infty]$, one forward observation, of angular extent $\pi/2$. Two atoms compose into a semicircle of extent $\pi$; the atom's two natural readings are the **chord** between diametric pointings (length $2$ in mechanism units) and the **arc** along it (length $\pi$ for the semicircle), with chord-to-arc ratio $\psi_1 = 2/\pi$, a value three independent derivations agree on at the limit (foundational §5, §11) — and now *determined*, not merely discovered: with the measure forced (below), $2/\pi$ is the normalization of the unique invariant Cauchy, fixed by the same forcing, while its *evaluation* remains the global pass the observer declines — determined and declined, the observer/surveyor line on which $\pi$ already sits (foundational §4, §12.1). The bounded representation map $x = \tan\theta$ is forced by the geometric axioms (central projection, topological bijection, radius cancellation) and equivalently by the analytic axioms (boundedness, continuity, multiplicativity, no free parameters; foundational §6). The dyadic cascade is forced as the unique tiling dilation of the conserved angular measure (foundational §8); its orbit structure is the odd-dyadic leaf lattice of §2.2. The Cauchy density is forced as the unique Möbius-invariant distribution and is the atom's own measure (foundational §4, §9, §###). These results are taken as given.

The foundational paper closes on a thesis (foundational §11): *bounded observation is discrete geometric atoms presented continuously on the observer's virtual circle.* This paper is that thesis made into a theorem — the **Tangent Bridge Theorem**, which foundational §### names as the framework's structural foundation — with explicit modulus-of-continuity bounds via the Lebesgue-constant–Jackson route. The mathematics of the proof is classical; the contribution is identifying the rung structure's leaf positions as the atoms the bounded observer's geometry forces, recognizing that the discrete and the continuous are one object held and shown, and verifying that the proof goes through under the inside-bounded constraint.

### 1.2 The two roots

The cleanest reading of the theorem is as the two halves of the thesis.

**Boundedness: why there is a bridge.** A continuous signal on an unbounded domain cannot be carried by a finite address. Finitely many readings leave unbounded territory unaccounted for, and no uniform error bound exists — there is always a region the samples do not reach. On the open line the finite and the continuous do not round-trip; there is nothing to bridge. The bounded observer never holds the line. Its hold is finite (foundational §3): the unbounded interval of ratios is carried onto a finite register by the reciprocal, and the closure (foundational §8) seals it into a compact loop. On a compact domain a continuous signal is uniformly continuous — its variation across a small arc shrinks with the arc — so finitely many readings pin it: exact where they sit, controlled between. (R3) and (R4) exist only because the domain is compact. Boundedness is not a convenience the bridge enjoys; it is the condition the bridge requires.

**Uniformity: why the bridge is exact.** A circle is uniform by definition. Every point is alike, none privileged; equal arc carries equal weight; there is one rotation-invariant measure and only one. This is the property the bare ratio set lacks — the set has a home, a corner, an order, a reciprocity — and acquiring it is exactly what the closure into a circle accomplishes. The leaves are an even spacing of that uniformity: a single orbit of the rotation that carries one atom to the next, sampled regularly. On a uniform domain a uniform grid *locks* — the kernel is the identity at each leaf and zero at the others, and sums to one between (§4.2) — which is (R1) and (R2), falling out of uniformity with no theorem beneath them. The same uniformity pins the unique measure the observer carries (the Cauchy; foundational §4, §9) and is the reason the harmonic analysis of §13 works at all.

**The holding and the presentation.** Together the two roots are the thesis. The observer's *holding* is discrete: a finite hold, finitely many atoms, each read in fixed work without the observer ever knowing how many there are (R5). The observer's *presentation* is continuous: on the virtual circle the discrete atoms are shown as one continuous whole, agreeing with the discrete reading exactly at the atoms and filled in between by the circle's uniformity. The discrete is what boundedness leaves the observer holding; the continuity is what uniformity lets it present. They are one object — interconvertible, met exactly at the atoms. This reframes what the theorem is about: not a continuous signal approximated by lossy samples, but discrete atoms held and shown whole. The observer never reaches the continuous source; the continuity is the presentation it makes on its own circle.

**The held view closes, not the system.** The virtual circle is the closure of what the observer *holds* — its bounded view, the leaves at the resolved depth, what the foundational §7 counts as $K$ — and not the system it projects against, whose extent ($N$) it cannot know. The held view can be closed because it is bounded and the observer's own; the system's extent cannot be, and is never asked to be: the reciprocal carries the whole unbounded far field to the single horizon point where the loop seals (foundational §3, §8), so the system enters the circle at one point and is nowhere laid around it. The observer closes $K$ into the virtual circle — a $K$-circle, not an $N$-circle — and projects the unbounded other to that one point; it never lays the system around a loop, which would demand the count it lacks. Both maps respect this: $\Phi_d$ reads the held view at fixed leaves, $\Psi_d$ sums the kernel against those held values, and the system's extent enters neither — which is (R5) read through the closure. The discrete held view, closed into the virtual circle and thereby presentable as continuous, is the **completed geometric atom**: the foundational primitive made whole, discrete in the holding and continuous in the showing, met exactly at the atoms. The theorem is that completion run in both directions.

### 1.3 Scope and downstream

The bounded observer projects against an underlying system whose nature it cannot know; what it has is the projection — a closed continuous angular universe of period $\pi$ — populated with whatever content the projection delivers. The framework handles content of several topological types through the same rung structure (§2.1): discrete arrays at leaf positions, linear content on $\mathbb{R}$ via $\arctan$, periodic content placed directly, photograph rows as $W$-pixel projections, and floating-point representations through IEEE 754's native dyadic structure (the exponent field is the rung). What the observer cannot know is which of these the projection is *of*; the framework is about the projection-side representation, not the system being projected from.

Downstream of this paper: the **Tangent Number System** exercises the bridge's arithmetic side (how bounded reals get addresses through the rung structure); **Special Relativity from the Semicircle** the velocity side (the bounded observer as the relativistic observer, $c$ the terminal horizon); the **Tangent Vector Format** the sampling side (the file-format realization). The proof here is once; the applications are downstream.

**Convention on period.** Sections §3–§6 use the period-$2\pi$ presentation of $S^1$ for compatibility with the classical theorems cited in the proof (Erdős–Turán, Jackson). The bounded observer's natural parameterization has period $\pi$ — two atoms, a semicircle of distinct directions; the two are equivalent under $\varphi \to 2\varphi$, the factor of $2$ being $\psi_1$. §10 makes the equivalence formal. The period-$2\pi$ form is proof scaffolding, not the observer's frame.

---

## 2. Preliminaries

### 2.1 Notation and content types

The proof works with a function $F : S^1 \to \mathbb{R}$ on the unit circle, parameterized by $\theta \in [-\pi, \pi)$ with endpoints identified; $F$ is assumed continuous. This $S^1$ presentation is the proof's bridge to the classical trigonometric-interpolation literature, not the bounded observer's frame: what the observer experiences is a closed continuous angular universe of period $\pi$, populated by the projection of an unknown system. The two are related by $\varphi \to 2\varphi$ (§10) and the results transfer without modification. Angles are written in radians, the working horizon at $\pi/4$, the terminal horizon at $\pi/2$; translation to the foundational $\psi$-notation is direct ($\pi/4 = 1/(2\psi_1)$, $\pi/2 = 1/\psi_1$).

The same rung structure handles several content types; the observer cannot know which the projection is of, and the theorem operates on the projected content regardless:

- **Discrete arrays and sequences.** Values placed at the leaf positions $\theta_k$. The forward map is then the identity (the values are already in rung representation); the reverse map reconstructs continuous content from them.
- **Linear content on $\mathbb{R}$.** Functions $F : \mathbb{R} \to \mathbb{R}$ brought into the aperture via $x = \tan\theta$; the content is then on $(-\pi/2, +\pi/2)$, which embeds in $S^1$.
- **Floating-point representations.** The IEEE 754 exponent field is the rung, the mantissa the within-rung position; the theorem describes the correspondence between discrete floating-point representations and the continuous reals they encode.

### 2.2 The leaf positions are atoms

The depth-$d$ rung structure on $S^1$ has exactly $2^{d+1}$ leaves at positions

$$\theta_k = \frac{k\pi}{2^{d+1}}, \qquad k \text{ odd}, \quad |k| \leq 2^{d+1} - 1,$$

the **odd dyadic angles** at depth $d$, equally spaced around the circle. Each is not a featureless coordinate but a geometric atom — one complete forward observation, one ratio's worth of home–corner–horizon. The discrete representation is a *composition of atoms.* Examples:

- $d = 0$: 2 atoms at $\pm\pi/2$.
- $d = 1$: 4 atoms at $\pm\pi/4, \pm 3\pi/4$.
- $d = 2$: 8 atoms at $\pm\pi/8, \pm 3\pi/8, \pm 5\pi/8, \pm 7\pi/8$.
- General: $2^{d+1}$ atoms at odd multiples of $\pi/2^{d+1}$.

The positions are forced by the rung structure's binary path: each path from root to a depth-$d$ leaf corresponds to a specific odd integer $k$. On the chord side the leaf values are $x_k = \tan\theta_k$, also closed-form; this paper works with the angular positions directly.

**Terminology.** Two dyadic structures share the name "rung structure" and must be kept apart. The **leaf lattice** is the odd-dyadic angle set above — equispaced on the arc, dyadic in angular measure, the atoms the bridge operates on. The **rung ladder** is the slope-wall set $\arctan(2^k)$ — dyadic in value, read by the IEEE 754 exponent, used for addressing arithmetic. They coincide nowhere past the gate at $\pi/4$; they are the arc and chord renderings of one forced cascade, and the leaf lattice is that cascade's orbit structure (§5.3).

### 2.3 The sample space

The *discrete representation at depth $d$* of $F$ is the vector of its values at the atoms,

$$\big(F(\theta_k)\big)_{k \text{ odd},\,|k| \leq 2^{d+1}-1} \in \mathbb{R}^{2^{d+1}},$$

indexed by odd $k$ with $|k| \leq 2^{d+1} - 1$. This is the holding: a finite list of atom readings.

### 2.4 Foundation

The leaf positions, the halving, and the bounded aperture are forced by the foundational framework. The chain: the chord/arc ratio $\psi_1 = 2/\pi$ is single and well-defined, its value found by three independent derivations that agree at the limit (foundational §5, §11) — and determined by the measure forcing as the unique invariant Cauchy's normalization, its evaluation alone declined (foundational §4); the representation map $x = \tan\theta$ by the geometric (CPBR) and analytic (BCMN) axioms (§6); the working and terminal horizons at $\pi/4$ and $\pi/2$ are distinct loci in ratio exactly $2$ (§4, §8); the dyadic cascade is the unique tiling dilation of remaining angular measure anchored at the closure (§8), with the slope ladder $\arctan(2^k)$ its chord rendering and the leaf lattice its orbit structure (§9; §5.3 below); the leaf positions follow from the binary-path closed form; and Theorem U (foundational) establishes the rung structure as the unique system the axioms admit. This paper takes these as given.

**Why the halving is by two.** The radix is forced in the conserved coordinate. The cascade handoff must be a dilation of remaining angular measure anchored at the closure, and $g = 2$ is the unique dilation under which the cascade tiles — the gate maps exactly to home, no gap, no overlap, no loss; $g < 2$ strands a band while overlapping others, $g > 2$ pushes content past home out of the arc. The Jacobian identity $\sec^2(\pi/4) = 2$ at the working horizon (run and rise balanced, $\tan\theta = 1$, kept measure $\cos^2 = 1/2$) is the same fact read at the gate. One bookkeeping caution: the doubling lives in the chord $x = \tan\theta$ (which doubles, $x_k = 2^k$) and the run-length $\cos\theta$ (which halves asymptotically), while the *quadratic* kept measure $\cos^2\theta$ — the $K_N$ weight — carries the same ladder as base-*four* ($\propto 4^{-k}$). So leaf-count and chord statements are base-2 while kept-mass statements are base-4.

---

## 3. The forward map: the holding

### 3.1 Definition

**Definition 3.1.** The *forward map* $\Phi_d : C(S^1) \to \mathbb{R}^{2^{d+1}}$ reads $F$ at the atoms,

$$\Phi_d(F)_k = F(\theta_k), \qquad k \text{ odd}, \quad |k| \leq 2^{d+1} - 1.$$

It samples $F$ at the $2^{d+1}$ leaf positions and returns the vector of values. In foundational terms this is *taking the address*: each entry is one atom's reading.

### 3.2 Properties

**Proposition 3.2 (Well-definedness).** $\Phi_d$ is well-defined for any continuous $F$ on $S^1$. *Proof.* The leaf positions are specified explicitly; $F$ is continuous everywhere; evaluation at any point is well-defined. $\square$

**Proposition 3.3 (Locality).** $\Phi_d(F)$ depends on $F$ only through its values at the atoms: if $F$ and $G$ agree at every $\theta_k$, then $\Phi_d(F) = \Phi_d(G)$, regardless of $F$ and $G$ elsewhere. *Proof.* Direct from the definition. $\square$

**Proposition 3.4 (Inside-boundedness).** $\Phi_d$ requires no parameter beyond depth $d$. The evaluation at each $\theta_k$ depends on $F$ only at the point $\theta_k$ — not on any integral, norm, or global functional of $F$. *Proof.* The definition involves no integration over $S^1$, no global quantity of $F$, and no content-size parameter; the only parameter is $d$, which fixes the sampling positions. $\square$

This is the discrete holding: each atom is read on its own, in fixed work, with no reference to how many atoms exist elsewhere. The observer never forms a quantity that would require knowing $N$.

### 3.3 Computational cost

$\Phi_d$ requires $2^{d+1}$ evaluations of $F$, total cost $O(2^{d+1})$, independent of any property of $F$ beyond its evaluability at the specified positions. Each individual read is $O(1)$ — a position resolved to an address, not a search over the domain (foundational §7).

---

## 4. The reverse map: the presentation

### 4.1 The canonical reverse

The leaves are equally spaced on $S^1$, which gives the reverse map a canonical form: trigonometric interpolation at equispaced nodes.

**Definition 4.1.** The *reverse map* $\Psi_d : \mathbb{R}^{2^{d+1}} \to C(S^1)$ presents the atoms as continuous,

$$\Psi_d(c)(\theta) = \sum_{k \text{ odd},\,|k| \leq 2^{d+1}-1} c_k\, K_N(\theta - \theta_k), \qquad N = 2^{d+1},$$

through the even-$N$ interpolation kernel

$$K_N(\varphi) = \frac{\sin(N\varphi/2)}{N\,\tan(\varphi/2)}, \qquad K_N(0) = 1.$$

**Remark.** The $\tan(\varphi/2)$ denominator (not $\sin(\varphi/2)$) is correct for even $N$ at the shifted, odd-multiple grid: it gives both the interpolation property ($K_N(\theta_j - \theta_k) = \delta_{jk}$) and the partition-of-unity property ($\sum_k K_N(\theta - \theta_k) = 1$). The familiar Dirichlet form $\sin(N\varphi/2)/(N\sin(\varphi/2))$ is for odd $N$ at unshifted nodes and would be incorrect here. Equivalently $K_N(\varphi) = \sin(N\varphi/2)\cos(\varphi/2)/(N\sin(\varphi/2))$ — the product form, preferred for proofs because it extends continuously to $K_N(\pm\pi) = 0$. The antipodal argument $\varphi = \pm\pi$ does occur on this grid ($j - k = \pm N$ for odd $j, k$); there $\tan(\varphi/2)$ is undefined but the product form's $\cos(\varphi/2)$ vanishes, and we adopt $K_N(\pm\pi) = 0$. These two kernel identities are *uniformity written as a kernel*: identity at the atoms, unit total everywhere between.

**Frame.** This $\sin$/$\tan$ form is the angle coordinate — the surveyor's frame, adopted here because the proof (§6.3) and the classical theorems it cites are stated in it. It is not the observer's operation. In the slope coordinate $s = \tan(\varphi/2)$ — equivalently $s=\tan t$ in the inside arc (Convention) — the same kernel is rational — the Cauchy measure to the power $N/2$ — and the reconstruction evaluates no trigonometric function (§11). Throughout this paper the trigonometric forms — this kernel, the $\cos$-projection of §9, the Lebesgue–Jackson proof of §6.3 — are the language in which the bridge is *proved and displayed*; the discrete bounded observer that *operates* it holds slopes (the coordinate $s = \tan t = \tan(\varphi/2)$ is the held quantity, not a function it calls), composes them by Möbius, and refines them by halving, and at no point evaluates a trigonometric function.

### 4.2 Kernel properties

**Lemma 4.2 (Interpolation).** For odd $j, k$ with $|j|, |k| \leq N - 1$, $K_N(\theta_j - \theta_k) = \delta_{jk}$. *Proof.* For $j = k$, $K_N(0) = 1$. For $j \neq k$, $\theta_j - \theta_k = (j-k)\pi/N = 2m\pi/N$ with $m$ a nonzero integer ($j, k$ odd $\Rightarrow j - k$ even). If $|m| \neq N/2$: $K_N(2m\pi/N) = \sin(m\pi)/(N\tan(m\pi/N)) = 0$ (numerator zero, denominator finite and nonzero). If $|m| = N/2$ (the antipodal pair, $j - k = \pm N$): the product form gives $K_N(\pm\pi) = \sin(\pm N\pi/2)\cos(\pm\pi/2)/(N\sin(\pm\pi/2)) = 0$ since $\cos(\pm\pi/2) = 0$. $\square$

**Lemma 4.3 (Continuity).** $K_N$ is continuous on $S^1$. *Proof.* At $\varphi = 0$, $\lim \sin(N\varphi/2)/(N\tan(\varphi/2)) = \lim (N\varphi/2)/(N\varphi/2) = 1 = K_N(0)$. At $\varphi = \pm\pi$, the product form is manifestly continuous with value $0$ ($\cos(\varphi/2) \to 0$, $\sin(\varphi/2) \to \pm 1$). $\square$

**Lemma 4.3a (Partition of unity).** $\sum_k K_N(\theta - \theta_k) = 1$ for all $\theta$ — the constant, the grid's lowest mode, is reproduced everywhere. (This is the standard partition property of the even-$N$ equispaced interpolation kernel.)

### 4.3 Properties of $\Psi_d$

**Proposition 4.4 (Well-definedness).** $\Psi_d(c)$ is well-defined for any $c \in \mathbb{R}^{2^{d+1}}$ and produces a continuous function on $S^1$. *Proof.* A finite sum ($2^{d+1}$ terms) of continuous kernels (Lemma 4.3) is continuous. $\square$

**Proposition 4.5 (Locality).** $\Psi_d(c)(\theta)$ depends on $c$ only through the $2^{d+1}$ specified values $c_k$; no global operation on $c$ is performed. *Proof.* The formula is a finite linear combination of kernel values weighted by the $c_k$ — no integration, norm, or global operation. $\square$

**Proposition 4.6 (Inside-boundedness).** $\Psi_d$ requires no parameter beyond $d$ and the input $c$; the kernel depends only on $N = 2^{d+1}$, i.e. only on $d$. *Proof.* The kernel's form and the sum's structure are determined entirely by $N = 2^{d+1}$; no content-size parameter enters. $\square$

The reverse map is the presentation: the discrete atoms shown as one continuous whole, the kernel filling the gaps by being the circle's uniformity in functional form.

---

## 5. The Tangent Bridge Theorem

### 5.1 Statement

**Theorem 5.1 (Tangent Bridge).** Let $F : S^1 \to \mathbb{R}$ be continuous and $d \geq 0$, with $\Phi_d, \Psi_d$ as above. Then:

- **(R1) Exact discrete round-trip.** $\Phi_d \circ \Psi_d = \mathrm{id}$ on $\mathbb{R}^{2^{d+1}}$.
- **(R2) Exact at the atoms.** $(\Psi_d \circ \Phi_d)(F)(\theta_k) = F(\theta_k)$ for every leaf $\theta_k$.
- **(R3) Bounded error between.** For all $\theta$, $|(\Psi_d \circ \Phi_d)(F)(\theta) - F(\theta)| \leq C\,\log(2^{d+1})\,\omega_F(\pi/2^{d+1})$, with $\omega_F$ the modulus of continuity and $C$ absolute.
- **(R4) Uniform convergence on the Dini–Lipschitz class.** If $\omega_F(h)\log(1/h) \to 0$ as $h \to 0^+$ — in particular for every Hölder $F$ — then $(\Psi_d \circ \Phi_d)(F) \to F$ uniformly as $d \to \infty$. The restriction is necessary: since $\Lambda_N \to \infty$, the uniform boundedness principle produces continuous $F$ whose reconstructions fail to converge (§6.4); §7.4 places this as universal.
- **(R5) Inside-boundedness.** Both maps operate with no parameter beyond $d$ — no dependence on $N$, norm, integral, or any global property of $F$.

### 5.2 Reading, by root

The five properties are the two roots made precise.

**(R1) and (R2) are uniformity.** A uniform grid on a uniform circle reconstructs exactly at its nodes, because the kernel is built to be the identity there ($\delta_{jk}$, Lemma 4.2) and to partition unity between (Lemma 4.3a). (R1): $\Phi_d\Psi_d(c)_j = \sum_k c_k K_N(\theta_j - \theta_k) = c_j$. (R2): $\Psi_d\Phi_d(F)(\theta_j) = \sum_k F(\theta_k)\,\delta_{jk} = F(\theta_j)$. The leaves agree because they are an even spacing of the circle's one symmetry, and the kernel is that symmetry's interpolant. Nothing of $F$ beyond its atom values enters.

**(R3) and (R4) are boundedness.** The error between atoms is the interpolation error of the leaf grid, controlled by $F$'s local variation; that variation exists and shrinks only because $S^1$ is compact (uniform continuity). The $\log N$ factor is the Lebesgue constant of the equispaced grid; where the function's smoothness cannot beat it, convergence fails — a limit of finite-rank linear recovery, not of the observer (§7.4). The full bound is the classical Lebesgue-constant–Jackson result; what is framework-specific is that it applies at the forced atoms.

**(R5) is the discrete holding.** The maps carry no $N$-state: $\Phi_d$ evaluates at fixed positions, $\Psi_d$ sums the kernel against stored values, and neither forms a global functional. The classical bound's *ingredients* were already local ($\omega_F$, absolute constants), but (R5) is a statement about the *operation* — it is local, constitutively, so the result is one the observer at a single depth occupies, not one assembled from a vantage holding every $N$ at once. This is the foundational $O(1)$ read: the domain is never enumerated, only projected.

### 5.3 The Leaf Refinement Proposition

**Proposition 5.2 (Leaf refinement).** The doubling map $\theta \mapsto 2\theta$ on $S^1$ sends the depth-$d$ leaf lattice two-to-one onto the depth-$(d-1)$ lattice:

$$2 \cdot \frac{k\pi}{2^{d+1}} = \frac{k\pi}{2^d}, \qquad k \text{ odd}.$$

Under the cosine projection (§9) the same map is the Chebyshev relation $T_2(x) = 2x^2 - 1$, sending order-$n$ Chebyshev-I nodes two-to-one onto order-$n/2$ nodes. The doubling map is the home-anchored conjugate (under $\theta \leftrightarrow \pi/2 - \theta$) of the cascade fold $G(\theta) = 2\theta - \pi/2$ forced in the foundational §8.

*Proof.* The lattice statement is the displayed computation ($k$ odd is preserved; the map is two-to-one since $k$ and $k - 2^{d+1}$ share an image mod $2\pi$). The projected statement is $T_2(\cos\theta) = \cos 2\theta$. The conjugation: $\theta \mapsto \pi/2 - \theta \mapsto 2(\pi/2 - \theta) \mapsto \pi/2 - (\pi - 2\theta) = 2\theta - \pi/2 = G(\theta)$. $\square$

The atoms nest: refining from depth $d$ to $d+1$ adds atoms between the existing ones and leaves the depth-$d$ representation undisturbed. This is the resolution pyramid — each level of detail is atoms-within-atoms, closing because the atom is scale-free, a finer atom the same atom at a smaller index — and it is why structural updates extend the holding rather than rebuild it.

---

## 6. Proof of the theorem

The proof decomposes along the two roots: (R1)–(R2) are uniformity (the kernel identities), (R3)–(R4) are boundedness (the compactness-driven bound), (R5) the discrete holding.

### 6.1 (R1), exact discrete round-trip

For $c \in \mathbb{R}^{2^{d+1}}$, the $k$-th coordinate of $\Phi_d(\Psi_d(c))$ is $\Psi_d(c)(\theta_k) = \sum_j c_j K_N(\theta_k - \theta_j) = c_k$ by the interpolation identity (Lemma 4.2). Holding for every $k$, $\Phi_d \circ \Psi_d = \mathrm{id}$. $\square$

### 6.2 (R2), exact at the atoms

For continuous $F$, $(\Psi_d \circ \Phi_d)(F)(\theta_k) = \sum_j F(\theta_j) K_N(\theta_k - \theta_j) = F(\theta_k)$ by Lemma 4.2. Exact at every atom. $\square$

Both are uniformity in operation: the kernel is the identity at the atoms because the atoms are an even spacing of the circle's one symmetry and the kernel is that symmetry's interpolant.

### 6.3 (R3), bounded between

**Reduction.** $\Psi_d \circ \Phi_d$ produces, from $F$, the unique element of the $N$-dimensional interpolation space $V_N = \mathrm{span}\{K_N(\cdot - \theta_k)\}$ agreeing with $F$ at the $N$ atoms. (The kernel's half-weight top mode — coefficient $1$ rather than $2$ on the $\cos(N\varphi/2)$ term in $\sin(N\varphi/2)\cot(\varphi/2) = 1 + 2\sum_{j<N/2}\cos(j\varphi) + \cos(N\varphi/2)$ — selects the $N$-dimensional subspace matched to the $N$ nodes; interpolation at the nodes is a bijection onto it, and $V_N$ contains every trigonometric polynomial of degree $\leq N/2 - 1$.) Call this interpolant $P_d(F)$.

**Lebesgue constant.** Classical (Erdős–Turán): the Lebesgue constant for trigonometric interpolation at $N$ equispaced nodes is $\Lambda_N = O(\log N)$; here $\Lambda_{2^{d+1}} \leq C_1 (d+1)\log 2$, $C_1$ absolute.

**Lebesgue's lemma and Jackson.** For continuous $F$, $\|P_d(F) - F\|_\infty \leq (1 + \Lambda_{2^{d+1}}) E_d(F)$, where $E_d(F)$ is the best approximation by trigonometric polynomials of degree $\leq 2^d - 1$ (a subspace of $V_N$). Jackson's theorem: $E_d(F) \leq C_2\,\omega_F(\pi/2^{d+1})$, $C_2$ absolute. Combining,

$$\|P_d(F) - F\|_\infty \leq C\,\log(2^{d+1})\,\omega_F(\pi/2^{d+1}),$$

$C = 2 C_1 C_2$ absolute (the factor $2$ absorbs $(1+\Lambda) \leq 2\Lambda$ for $d \geq 1$ and the degree shift via $\omega_F(2h) \leq 2\omega_F(h)$). $\square$

The point of substance, in the framing: the bound *exists* — $\omega_F$ is defined and finite — only because $S^1$ is compact. The compactness is boundedness completed (foundational §3, §8). The analysis is classical; what is framework-specific is that it runs at the forced atoms — and that the operation it bounds is, in the slope form of §11, trig-free. The $\sin$ and $\tan$ here are the proof's language — the classical Erdős–Turán and Jackson theorems are stated in the trigonometric basis — not a transcendental the observer evaluates.

### 6.4 (R4), convergence and the necessity of the class

From (R3), with $h = \pi/2^{d+1}$, $\log(1/h) = (d+1)\log 2 - \log\pi$, so the bound is $\asymp \omega_F(h)\log(1/h)$ up to absolute constants. The Dini–Lipschitz hypothesis is exactly that this $\to 0$; hence uniform convergence on that class. For Hölder $F$ ($\omega_F(h) \leq C' h^\alpha$) the bound decays exponentially in $d$; every Hölder class is covered. $\square$

**The restriction is necessary.** The projections $P_d$ have operator norm $\|P_d\| = \Lambda_{2^{d+1}} \sim (2/\pi)\log N \to \infty$. By the uniform boundedness principle, $\sup_d \|P_d\| = \infty$ forces a (dense $G_\delta$ of) continuous $F$ with $\sup_d \|P_d F\|_\infty = \infty$ — reconstructions that cannot converge along the dyadic depth sequence. This is the trigonometric face of Faber's theorem. §7.4 reads the necessity as universal: the logarithmic floor binds every node system and every projection of this rank, so the restriction prices finite-rank linear recovery as such, not the observer's grid.

**The inside-voiced companion.** (R4) is the one clause stated in the outside's voice — it quantifies over an infinite refinement converging to $F$-as-totality, which the bounded observer never holds. The inside-native statement is different in kind and recorded as such: successive depths cohere (the atoms nest two-to-one, §5.3), and the observer can measure *settling* — the per-rung residual energies — from its own data, with no reference signal. Dini–Lipschitz content is content whose residuals settle; the pathological $F$ is content whose residuals never settle, detected at finite depth without invoking $F$. The outside theorem and the inside diagnostic describe one boundary from two courts.

### 6.5 (R5), inside-boundedness

$\Phi_d$ is inside-bounded by Proposition 3.4 (evaluation at fixed positions; no global functional; only parameter $d$); $\Psi_d$ by Proposition 4.6 (finite linear combination against a kernel determined by $d$ alone). Their composition $(\Psi_d \circ \Phi_d)(F) = \Psi_d(\Phi_d(F))$ is inside-bounded as a composition of inside-bounded maps; the output at any $\theta$ depends on $F$ only through its $2^{d+1}$ atom values. At no step does an $N$- or size-dependent parameter enter; the constants $C, C_1, C_2$ are absolute. $\square$

This is the discrete holding: the operation carries no $N$-state, so the result is one the observer at a single depth occupies — the foundational $O(1)$ read, the domain projected, never enumerated.

### 6.6 The theorem re-derived in the spectral court (companion)

The proof above takes the angle chart route for (R3) — the Lebesgue-constant–Jackson bound (§6.3) — and cites the spectral door (§13 Pontryagin duality, §14 the periodic Shannon MRA) without walking the theorem through it. The companion paper *The Tangent Bridge in the Spectral Court* (§§17–22, continuing this paper's numbering) does exactly that: it re-runs the theorem in Fourier language and records where the framework's own objects surface. None of the classical machinery is new; what the re-derivation exposes is how each result sorts into the angle chart or the slope chart, and that the same $\tfrac12$ recurs in every court. All six are verified to machine precision (`numpy`/`sympy`/float64), the slope-chart ones held to the §15.3 zero-trig-call bar.

- **§17 — the complex-analytic reproof (slope chart, trig-free).** Since $1+is=e^{it}/\cos t$ is a normalized rotation, the slope-form kernel is the imaginary part of that rotation raised to the depth, and (R1)–(R2) fall out of roots of unity — a rotation raised to $N$ returns to the real axis exactly at the nodes. Because $N$ is even the kernel is *purely rational* in the held slope ($K_2=1/(1+s^2)$, the Cauchy itself; §11), and R1–R2 re-verify with the trig-call count held at zero. The angle-chart proof (de Moivre) is a removable convenience; the operation runs in the slope chart.
- **§18 — the aliasing proof (angle chart).** In the frequency domain the interpolation operator folds Fourier modes mod $2N$ with a sign flip per $N$-shift and half-weight at the Nyquist mode, so the reconstruction error is exactly the out-of-band mass folded in — "bounded between" (R3) read as spectral tail rather than local modulus. This is the completed-circle statement, angle-chart-native; it algebraizes through the Cayley transform but gains nothing by it, since the fold quantifies over the whole circle the observer never holds.
- **§19 — the energy face (slope chart; a new companion result, not a reproof).** The bridge is an exact discrete isometry (Parseval) and a tight frame with bounds $[\tfrac12,1]$ *uniform in $N$*, so $L^2$ recovery carries no logarithm — the $\psi_1\ln N$ amplification of §7.4 is a sup-norm artifact, not a property of the recovery. The lower bound $\tfrac12$ is an exact rational eigenvalue of the Cauchy-weighted Gram, its $\pi$ cancelling as the surveyor's arc-normalization exactly as in §7.5.
- **§20 — trig-free status, by court.** The re-derivations sort cleanly: §17, §19, §21 run in the slope chart (trig-free, zero trig calls); §18 and §22 are angle-chart-native (the completed-circle court), and rightly stay there. This is the abstract's division of labour, confirmed section by section.
- **§21 — the FFT is the cascade (slope chart, trig-free).** Because $N=2^{d+1}$, the radix-2 Cooley–Tukey butterfly *is* the doubling map $G:\theta\mapsto2\theta$ of §5.3 read on the dual lattice: the butterfly pair $(j,\,j+N/2)$ is the doubling-map fiber, and its sum/difference branches are the coarse/detail split of the §14 MRA. The observer computes its own spectrum in $O(K\log K)$ by the very cascade that synthesizes its rungs (§16), and it runs trig-free with the leaf lattice as its twiddle table (the twiddles are Cayley images of the leaf slopes). The forced radix-2 (§2.4) pays a spectral dividend that is the spatial one counted twice.
- **§22 — the Fejér cure (angle chart).** The one place the theorem concedes — the (R4) divergence of §6.4 — is answered by the positive-kernel sibling: Cesàro (triangular) weighting of the leaf transform gives an operator of norm *exactly $1$*, converging uniformly for **every** continuous $F$ with the Dini–Lipschitz restriction lifted. The cost is exact: (R1)–(R2) relax to near-interpolation and the rate saturates at $O(1/N)$. It is inside-bounded in its data (only the atoms) but angle-chart-native in character, a summability method for the completed-circle Fourier series.

The recurring $\tfrac12$ is one object seen in five places: the kernel's top-mode coefficient (§4.1), the aliasing split (§18), the frame eigenvalue (§19), the Nyquist twiddle (§21), and the mode the Fejér window removes (§22) — each the price of the single frequency a bounded observer sees only up to sign. The companion also carries the naming used above: the **slope chart** (total $2$) and the **angle chart** (total $\pi$), trading at $2/\pi$ and $\pi/2$.

---

## 7. What the theorem establishes

### 7.1 The result

The rung structure provides a canonical finite representation of the continuous content the observer has access to — exact at the $2^{d+1}$ atoms, uniformly convergent elsewhere on the Dini–Lipschitz class. In the framing: the observer's discrete holding and its continuous presentation are one object, met exactly at the atoms; boundedness makes the holding finite and the presentation bounded, uniformity makes the presentation exact.

### 7.2 What it does not establish

**Granularity is delegated.** Every depth $d$ is exact against itself; the theorem prefers none. Which $d$ to use is a use-case question — consumer resolution, storage/bandwidth budget, the perceptual or computational target — not a first-principles one. Mathematics determines what is possible (exact at any granularity); engineering determines what is useful. Infinite depth exists mathematically and is unavailable in practice; finding the right finite $d$ for a content class is engineering, delegated to companion papers (the TVF specification treats audio operating points).

### 7.3 TNS-specific versus classical

The mathematics of §6.3 is classical (Lebesgue constant, Jackson). What the framework contributes: the **node positions** — the classical theorem applies to any equispaced grid and singles out none; the framework singles out the leaf atoms, forced by the binary path; the **inside-bounded framing** — the bound is local ($\omega_F$, absolute constants) and (R5) verifies the operation is local too; and the **shifted even-$N$ kernel** $K_N(\varphi) = \sin(N\varphi/2)/(N\tan(\varphi/2))$, correct for the odd-multiple grid, where the familiar Dirichlet form would fail (R1).

### 7.4 The forced grid against the universal lower bounds

This is the strongest external calibration the framework has, and in the framing it is the statement that *boundedness costs nothing asymptotically.* Two classical lower bounds:

**Erdős (chord side).** For polynomial interpolation at *any* $n$ nodes in $[-1,1]$ — chosen by any method, with any knowledge of the content — $\Lambda_n > (2/\pi)\log n - C$ (Erdős, 1961). Chebyshev-I achieves $(2/\pi)\log n + O(1)$. By the Chord Projection Corollary (§9), the leaf atoms project to exactly these nodes, so the forced grid is within an *additive constant* of the best possible over all node systems.

**Lozinski–Kharshiladze (arc side).** Every bounded linear projection of $C(S^1)$ onto trigonometric polynomials of degree $\leq n$ has norm at least that of the Fourier partial sum, $\|S_n\| = (4/\pi^2)\log n + O(1)$. Interpolation, least squares, any linear sampling-and-reconstruct scheme of this rank pays at least this logarithmic floor.

**Three consequences.** *First,* the inside observer's grid is forced — it had no access to optimization over node systems — and lands within $O(1)$ of the universal optimum anyway: the forced grid meets the floor that binds every scheme, forced or designed. *Second,* the (R4) restriction is everyone's: divergence on some merely continuous content is intrinsic to finite-rank linear recovery (the lower bounds give $\Lambda \to \infty$ universally), not a defect the observer introduced. *Third,* the universal coefficient is $\psi_1$: Erdős's floor and Chebyshev's achievement share the leading coefficient $2/\pi = \psi_1$, so the worst-case amplification of pointwise sampling grows as $\psi_1 \ln n$, universally, and the forced grid attains it. One step further sits at interpretive tier: the ratio of the interpolation floor to the integration (Fourier) floor is $(2/\pi)/(4/\pi^2) = \pi/2 = 1/\psi_1$ exactly in the limit — the worst-case price of point samples over integrals is the chord/arc constant. Both constants arise from the same $|\sin|$ averages that produce $\psi_1$ elsewhere; the interpolation coefficient's decomposition is derived in §7.5 — its $\pi$ the surveyor's normalization of an algebraic numerator — while the floor-ratio itself remains a consistency observation.

### 7.5 The coefficient is algebraic; its $\pi$ is the normalization

The shared leading coefficient $2/\pi$ admits a short derivation that locates its $\pi$ exactly. The Lebesgue constant's coefficient is the $L^1$-mean of the kernel's oscillating numerator, $\langle|\sin|\rangle = \tfrac1\pi\int_0^\pi|\sin t|\,dt$ — the classical equispaced estimate: the oscillating factor contributes its period-average, the node tangents the $\ln N$. This section is written in the inside arc $t$ (Convention), whose total *is* the $\pi$ being located, and where the chart change is the bare $s=\tan t$. Carried into that slope coordinate, with $|\sin t|=|s|/\sqrt{1+s^2}$ and $dt=ds/(1+s^2)$, the numerator integral is

$$\int_0^\pi|\sin t|\,dt \;=\; 2\int_0^\infty\frac{s\,ds}{(1+s^2)^{3/2}} \;=\; 2\Big[-\tfrac{1}{\sqrt{1+s^2}}\Big]_0^\infty \;=\; 2,$$

rational in $s$ with the single $\sqrt{1+s^2}$, primitive $-1/\sqrt{1+s^2}$ — elementary and algebraic, with no $\pi$ in the integrand, the antiderivative, or the value. Hence

$$\frac{2}{\pi} \;=\; \Big(\underbrace{2\textstyle\int_0^\infty s\,(1+s^2)^{-3/2}\,ds}_{=\,2,\ \text{algebraic, observer-side}}\Big)\Big/\underbrace{\pi\vphantom{\int}}_{\text{arc total, surveyor's normalization}}.$$

The coefficient that prices bounded reconstruction is, read in the observer's coordinate, an algebraic numerator over the surveyor's arc-length total: the $2$ is what the observer evaluates in its own arithmetic — the constructible tier of §11 — and the $\pi$ enters through the single channel of the normalization $1/\pi$, "what fraction of the whole turn," the whole turn being the completed object the observer declines (foundational §9.5). This locates the §7.4 coefficient's $\pi$ precisely: not in the worst-case amplification the observer computes, only in the surveyor's count of the turn — the same observer/surveyor line on which $\pi$ sits in the measure (foundational §4), named in the normalization, absent from the operation.

This derives the coefficient, not the full asymptotic. That the discrete worst-point sum is asymptotic to $\langle|\sin|\rangle\cdot\ln N$ with controlled remainder is the classical Lebesgue computation — coordinate-agnostic, inherited — and the paper takes the constant $2/\pi$ from it directly, as an established value — discovered by three agreeing derivations (foundational §5, §11) and verified numerically below. What is settled here is where that constant's $\pi$ lives. (Verified across conventions: odd-$N$ Dirichlet, even-$N$ outside, and even-$N$ inside parameterizations all give leading coefficient $2/\pi$ to fitted precision, the slope-form kernel matching the trig form to machine precision through §11.)

---

## 8. Consequences

The theorem licenses several structural capabilities of rung representations.

**Bidirectional extensibility.** A depth-$d$ representation extends either way: to depth $d+1$ by adding atoms at intermediate odd-dyadic angles (each with implied value from $\Psi_d$), or to a new continuous angle by evaluating $\Psi_d(c)(\theta)$. Both produce valid representations, interconvertible at the atoms, bounded-error elsewhere.

**Discrete–continuous duality.** The same representation is a finite vector for storage, transmission, or arithmetic, or a continuous function $\Psi_d(c)$ queryable at any angle. Round-trips are lossless at the atoms, bounded-error between; the two are exact expressions of one object, not approximations of each other — the holding and the showing.

**Vector-space composability.** $\Phi_d, \Psi_d$ are linear; depth-$d$ representations form a vector space; sums, differences, scalar multiples are valid representations; composition works in representation space without round-tripping through the continuous reconstruction.

**Granularity delegated.** Correctness at every depth carries the implication that the choice of depth for a concrete use is engineering, not theorem-proving (§7.2).

**Breaks are bandwidth horizons.** There are exactly two places the reconstruction cannot continuously cross, and they are one phenomenon. The *angular horizon* — the signal's range ends, with Chebyshev clustering at the chord edges (node distance $\propto 1/N^2$). The *bandwidth horizon* — a discontinuity the kernel cannot bridge within its bandwidth (Gibbs ringing, overshoot $\propto 1/N$; the bridge kernel's overshoot constant is $0.14114$, distinct from the classical Fourier $0.0895$ because it is a different interpolant). At both the representation density diverges while individual values stay bounded.

**Sub-leaf position is absent from one observation (verified).** A transition narrower than the leaf spacing produces *identical* leaf coefficients for every sub-leaf position — no atom lands on the transition, each reads its own plateau — so the reconstruction is bit-identical across sub-leaf edge positions (maximum difference $0.000000$ at $0.25, 0.50, 0.75$ of a leaf interval). What one observation retains is the host leaf-window, not the position inside it. This is (R5) at a discontinuity: sub-resolution localization cannot be decoded from one signal, and the bit-identity is the proof, not an analogy.

---

## 9. The Chord Projection Corollary

### 9.1 Statement

The theorem operates on the arc, $S^1$. Projected to the chord by $\cos : S^1 \to [-1,1]$, the leaf atoms become exactly the Chebyshev nodes of the first kind, and the bridge becomes Chebyshev interpolation.

**Corollary 9.1.** With $N = 2^{d+1}$, $n = N/2 = 2^d$, the atoms $\theta_k = k\pi/N$ (odd $k$, $1 \leq k \leq N-1$) project by cosine to

$$x_k = \cos(k\pi/N) = \cos\!\big((2j-1)\pi/2n\big), \quad j = 1,\dots,n,$$

the $n$ Chebyshev-I nodes. Consequently, for continuous $f : [-1,1] \to \mathbb{R}$, the theorem applied to $F(\theta) = f(\cos\theta)$ gives Chebyshev interpolation of $f$ with $\|p_n(f) - f\|_\infty \leq C\log n\,\omega_f(\pi/n)$, uniform convergence on the Dini–Lipschitz class.

### 9.2 Proof

The odd $k$ in $[1, N-1]$ are $k = 2j - 1$, $j = 1,\dots,n$, and $\cos(k\pi/N) = \cos((2j-1)\pi/2n)$ is the Chebyshev-I grid. For the error: $F(\theta) = f(\cos\theta)$ is continuous and even, so trigonometric interpolation at the atoms reduces under $x = \cos\theta$ to algebraic interpolation at the Chebyshev nodes; the Chebyshev Lebesgue constant is $O(\log n)$ and Jackson gives $E_n(f) \leq C_2\,\omega_f(\pi/n)$. $\square$

### 9.3 Reading

**Equispaced on the arc is Chebyshev on the chord.** The atoms — forced by the observer's binary geometry — project to the Chebyshev nodes, near-optimal for interpolation ($\Lambda_n = O(\log n)$ versus exponential blowup for nodes equispaced *on the interval*). The distinction matters, and is a frequent confusion: equispaced nodes are catastrophic for *polynomial* interpolation on an interval (Runge, exponential Lebesgue growth), but the bridge interpolates *periodically* on the arc — the regime in which equispaced nodes are the good case. The $O(\log n)$ Lebesgue order is the proven floor for *any* interpolation scheme (the Erdős–Lozinski lower bound, §7.4), so the grid is optimal in *order*: it meets that floor rather than beating it. Optimality in the finer sense — the minimal Lebesgue *constant*, not merely the order — is not needed here; the grid now carries a *local* variational characterization (a critical configuration whose null cone is the Möbius algebra, with explicit first-order cost in every other direction; §15.3), while *global* optimality over all schemes remains open (§15.3). The near-optimality is a consequence of the geometry, not an input: the observer does not choose the Chebyshev nodes for their optimality; they fall out of bounded observation, and the $\log n$ order is the accepted, proven-minimal cost of that forcing, not a defect of it. The kernel's $\tan(\varphi/2)$ is the matched correction — on the arc the trigonometric interpolation kernel, on the chord the barycentric Chebyshev formula; kernel and node set are one forced pair.

### 9.4 Setting H: velocity space (pointer)

The companion *Special Relativity from the Semicircle* applies this corollary to the velocity interval $(-c, c) \cong [-1,1]$ by $v/c$: the leaf velocities $v_k = c\cos(k\pi/N)$ are the Chebyshev nodes, dense near $v=0$ and sparse near $v = \pm c$ — resolution allocated where velocity varies fastest in rapidity. The one point that belongs here, because it is the boundedness root again: there is **no separate hyperbolic bridge.** The Wick-rotated kernel $\sinh(N\varphi/2)/(N\tanh(\varphi/2))$ does not interpolate on $\mathbb{R}$ — $\sinh$ has no real zeros, so it cannot vanish at the off-diagonal nodes, and the interpolation property is intrinsically tied to the compactness of $S^1$. Rapidity space is not compact, so it has no bridge of its own; the velocity and angle settings share the one bridge on the compact arc, differing only in which side of the cosine projection is physical. (Worked velocity tables in the companion.)

### 9.5 Numerical verification

Representative results for $F(\theta) = f(\cos\theta)$ on the leaf atoms:

- *Runge*, $f(v) = 1/(1+25v^2)$: max error $7.5\times10^{-1}$ ($n=4$), $6.0\times10^{-6}$ ($n=64$), $1.8\times10^{-11}$ ($n=128$) — exponential convergence, the Chebyshev nodes avoiding the Runge phenomenon that destroys equispaced-on-interval interpolation.
- *Hölder-$1/2$*, $f(v) = |v|^{1/2}$: error ratios between successive $n$ converge to $\sqrt{2} \approx 1.41$, confirming the predicted $O(n^{-1/2})$ algebraic rate.

### 9.6 The bridge identity on the semicircle

The single-atom case displays the structure analytically. For $\theta \in (-\pi/2, \pi/2)$, let $k$ be least with $|\theta/2^k| \leq \pi/4$, and set $c = \tan(\theta/2^k) \in [-1,1]$, $\operatorname{bridge}(c) = \arctan(c) - c$. Then

$$\theta = 2^k\big(c + \operatorname{bridge}(c)\big),$$

exact (verified to machine precision over $[0,\pi]$), with $\operatorname{bridge}(c) = -c^3/3 + c^5/5 - c^7/7 + \cdots$ for $|c| \leq 1$.

**Reading.** The angle splits into a bounded chord observable $c$ (first-order tangent), an analytic curvature correction $\operatorname{bridge}(c)$ (the higher-order remainder, cubic onward), and a dyadic scale $2^k$ (the cascade depth) — the theorem's decomposition (discrete leaves, continuous kernel, organizing scale) at the single-atom level. Geometrically: the forward projection is $\tan : \theta \mapsto c$, the inverse $\arctan : c \mapsto \theta$, and the inverse splits uniquely into its linear part ($c$) and nonlinear remainder ($\arctan c - c$); chord and bridge are those two parts.

**Consequences.** (i) The $\pi/4$ boundary is the arctan series' convergence boundary ($c = 1 \leftrightarrow \arctan 1 = \pi/4$); the primary range $[-\pi/4, \pi/4]$ is the analytic domain on which the series is uniformly valid, and the cascade keeps the observable inside $|c| \leq 1$. (ii) Gregory's series is the bridge at the boundary: $\operatorname{bridge}(1) = \pi/4 - 1$, and the framework's $\pi/4$ appearances trace to this one identity. (iii) The dyadic cascade is the angular analog of IEEE 754 normalization — both bound an unbounded quantity into a canonical cell with an external integer scale (mantissa $\in [1,2)$ with exponent; chord $\in [-1,1]$ with $2^k$). The bridge is a *function*, not a constant: it measures position-dependent curvature, vanishing to second order near $\theta = 0$ and reaching $\pi/4 - 1$ at the boundary; the framework's constants ($\pi/4$, $\pi - 2$, $\psi_1$) are boundary or scaled-boundary values of this single function. The normalization $\theta \mapsto \theta/2$ is the inverse of the cascade fold (§5.3). (Full development in the companion working note *The Bridge Identity on the Semicircle*.)

**The seam runs inside the function.** Read forward, the identity above is a fact about $\arctan$; read the other way it is a fact about the observer, and it places the observer/surveyor line *within* the transcendental rather than beside it. Bounding $\theta$ into the cell is the dyadic cascade — halving, the observer's own descent, the tangent *iterated* (§11) — and returning from the cell composes the reduced chord against the scale-fixed slopes by tangent-addition, the map's group law (foundational §8); both run on ratios the observer already holds, and neither evaluates a transcendental. This is what a CORDIC-type evaluation of $\arctan$ *is* underneath: dyadic halving and Möbius composition of tabulated rung-slopes — the observer's algebra, brick for brick. What is *not* the observer's is the residue. The cell-value $\operatorname{bridge}(c)$ does not terminate — it is closed only in the limit — and $\pi$ enters through exactly the two channels the framework isolates everywhere else (§7.4, foundational §4): the *scale-constants* the composition is tabulated against — each rung's angle $\arctan 2^{-k}$, a surveyor label pinned to an observer-composed slope — and the *completion* the series never finishes. Truncate that completion at depth $K$ and what remains is rational and constructible (foundational §10.1), exact at the reduced cell, bounded between: the Tangent Bridge applied to the inverse map itself — $\arctan$ reconstructed from its own atoms by the theorem it helps state. So the §9.6 split is not chord-plus-remainder as two analytic pieces but *algebra plus closure* as two courts: the algorithmic core is the observer's, and only the closing course — the finished arc, the $\pi$ it converges to — is the surveyor's. This puts a floor under *algebra kept, evaluation declined* (foundational §4, §12.1): the evaluation *is* the algebra, the observer's own, plus the single thing a bounded observer structurally cannot supply — the circle completed in the limit. The observer declines not the mechanism of the tangent but its *completion*; the surveyor's door to the angle chart is built out of the observer's bricks, and only the last course is the surveyor's — the course the bounded observer never lays.

*Bound (necessary, not sufficient).* This does not make the transcendental algebraic. $\pi$ is transcendental (Lindemann); no finite dyadic–Möbius composition of constructible slopes yields it, and that impossibility is exactly the necessity of the declined completion. The observer's algebra is necessary but not sufficient for the angle — the sufficiency is the closure, and the closure is what is declined — which is why the two courts are an *exact factorization* of the evaluation and not a reduction of either to the other.

---

## 10. The bounded observer's parameterization

The kernel and leaf positions of §4 are presented on period $2\pi$ — the classical-literature form (Erdős–Turán, Jackson) the proof cites, assuming a known global $S^1$ of circumference $2\pi$. The bounded observer has no such global access; what it has is its projection, a closed angular universe of period $\pi$.

**Proposition 10.1.** Define $\tilde K_N(t) = \sin(Nt)/(N\tan t)$ and $\tilde\theta_k = (k + \tfrac12)\pi/N$, $k = 0,\dots,N-1$ (period $\pi$, leaves on $(0,\pi)$, $\tilde K_N(0) = 1$). Then $K_N(2t) = \tilde K_N(t)$ for all $t, N$, and (R1)–(R5) hold identically in both parameterizations. *Proof.* $\sin(N(2t)/2) = \sin(Nt)$ and $\tan(2t/2) = \tan t$, so $K_N(2t) = \tilde K_N(t)$; the bridge properties are functional properties of the kernel at its leaves, preserved under $t \mapsto \varphi = 2t$. $\square$

This proposition is the whole content of the Convention: $\varphi=2t$ is the *only* relation between the two arcs, so a chart change stated as $s=\tan t$ becomes $s=\tan(\varphi/2)$ the moment the outside coordinate is the one on the page. Dropping the half is not a lighter notation for the same object; it names a different point of the circle.

The factor of $2$ between the parameterizations is $\psi_1 = 2/\pi$. The period-$2\pi$ form is the **outside view** (a global circle assumed); the period-$\pi$ form is the **inside view** (the observer's universe, period $\pi$ a property of the projection itself, with no claim about the system projected from). The framework is about the inside view; the $2\pi$ presentation is scaffolding. The inside view is also trig-free in operation: in the slope coordinate $s = \tan t$ the inside kernel $\tilde K_N$ is the rational Cauchy form of §11, so the observer's reconstruction calls no trigonometric function — the $\sin$ and $\tan$ written here are the outside view's notation, not the inside view's operation. Implementations adopt the inside form, with identical reconstructions verified to machine precision at $N = 16,\dots,256$.

The line representation makes this concrete. The bounded coordinate $x = \tan\theta$ is the inside view incarnate: $\tan$ has period $\pi$, so the observer's number line is already the period-$\pi$ universe, and its single point at infinity ($\theta \to \pm\pi/2$, $x \to \pm\infty$) is the closure point of the foundational §8 — the looping line is $\mathbb{RP}^1$, the projective closure, not a cut of $\mathbb{R}$. Driving a reconstruction on the period-$2\pi$ display circle from this line is exactly the substitution $\varphi = 2\theta$ of Proposition 10.1: one traversal of the line ($\theta$ over its period $\pi$) is one traversal of the display circle ($\varphi$ over $2\pi$), the line's point at infinity landing on the circle's antipode. A coupled line-and-circle rendering (§16) uses precisely this $\varphi = 2\theta$, and the factor of two is again $\psi_1$ — a forced relation between the two views, not a free choice of presentation.

---

## 10.2 Reparameterization invariance: the embedding coordinate is free, the intrinsic regularity is not

Proposition 10.1 showed the bridge properties survive the change between the outside ($2\pi$) and inside ($\pi$) parameterizations. That is one instance of a broader invariance worth isolating on its own, because it is the paper's strongest empirical answer to an obvious objection. The observer's coordinate is wildly non-uniform — the fisheye of foundational §12, arc-density $1/(1+s^2)$, dense at home and vanishing toward the horizon — yet classical interpolation theory is normally justified on a *metrically well-behaved* coordinate (uniform grids, Chebyshev nodes, splines on a parameter domain), on the intuition that preserving local distances is what makes interpolation work. Why does reconstruction on so distorted a coordinate reproduce the classical continuum at all?

The answer separates two things the single word "metric" conflates, and the separation is the result.

**Two coordinates, one of which is free.** The observer's leaves are regular in the *intrinsic* coordinate — the arc, the rotation-invariant measure: equal angular steps, a rotation-regular orbit (foundational §9). The same leaves are highly irregular in the *embedding* coordinate the observer reads in — the slope $s=\tan\theta$, where they crowd at home and splay toward the horizon (the fisheye). The tangent between the two is an order-preserving homeomorphism: invertible, continuous, monotone, closure point to closure point (§10, $\mathbb{RP}^1$). The demonstrated fact is that the reconstruction depends only on the intrinsic regularity and is invariant under the embedding coordinate.

**Reparameterization Invariance (demonstrated).** *For arc-regular sampling, the reconstructed continuum is invariant under order-preserving reparameterization of the observer's coordinate. The slope (fisheye) coordinate reproduces, to machine precision, the continuum of the uniform-arc coordinate. The invariant is intrinsic arc-regularity together with an order-preserving map — not uniformity of the embedding coordinate.* The control that pins it down is the amplification, the Lebesgue constant $\Lambda$. Arc-regular leaves give the clean logarithmic growth $\Lambda \sim (2/\pi)\ln N$; the fisheye — those same leaves read in slope — gives the *identical* $\Lambda$, because it is the same sampling relabeled, not a different sampling; but leaves placed uniform in the *embedding* coordinate (uniform in slope, therefore irregular in arc) detonate, $\Lambda \approx 4\times 10^{7}$ at $N=16$. The distorted coordinate costs nothing; distorting the intrinsic regularity costs everything.

The requirement and the freedom fall on opposite sides of foundational §12.3's classification of what the operations consume. **Reparameterization invariance is topological:** an order-preserving homeomorphism is precisely a relabeling that preserves order, adjacency, and closure, and the reconstruction is blind to it. **Sampling regularity is intrinsic-metric:** exact reconstruction requires the arc-regular (uniform-measure) orbit, and genuinely arc-irregular sampling is not exact — the global scheme is ill-posed (the detonating $\Lambda$ above), while the bounded local read (the cull, foundational §12.4) tolerates irregularity only approximately, trading exactness for boundedness. So metric uniformity is not dispensable. It is required *in the intrinsic coordinate* and irrelevant *in the embedding one*, and the fisheye is the embedding distortion — which is why it is free. Both halves of this division are about $\Lambda$, and there is a quantity it does not reach: §10.3 records that a coordinate change free in the sense above can still move the *content's* band, and with it the leaf count the content requires — priced in $N$ rather than in amplification.

This reframes the working assumption it answers. The embedding parameterization need not be uniform, need not preserve local distances at all, provided the observer's map to the intrinsic coordinate is invertible and order-preserving and the intrinsic sampling is regular. For this class of reconstructions the classical emphasis on a metrically well-behaved coordinate is stronger than necessary: what is necessary is intrinsic regularity and an order-preserving map, and the observer supplies both — the dyadic leaves are arc-regular (foundational §10.1), and the tangent is the homeomorphism (§11).

The claim is now resolved, and it split. *Demonstrated across a warp family* (rotations, Möbius boundary maps to $a=0.95$, sinusoidal, sigmoid, random piecewise-linear; harness record, §15.3): the general statement is **true as conjugation** — the full scheme conjugated by any order-preserving homeomorphism $h$ (nodes, queries, and composition law all carried through $h$) reproduces the native reconstruction to $10^{-13}$–$10^{-10}$, including numerically inverted $h$ — with one named boundary: conjugation invariance holds exactly up to *injectivity of $h$ on the node set at working precision*. A homeomorphism that compresses two node separations below machine epsilon (measured: sigmoid $p{=}8$ maps adjacent nodes $4.6\times10^{-17}$ apart) is injective in $\mathbb{R}$ but not in the register, and the failure is representational collision, not algebraic — a bounded-observation condition, not an analytic one, and degradation on approach is graceful (three digits lost at $p{=}3$). And the general statement is **false as substitution**: warped node positions under the *native* composition law detonate, which is what "arc-regular is required for exactness" quantifies — the excess $\Lambda - \Lambda_0$ for a warp of maximum angular displacement $\delta_{\max}$ collapses onto the single variable $\delta_{\max}N$ for smooth (mode-1) warps, entering quadratically and crossing to superexponential growth past $\delta_{\max}N \approx 1.5$; a fixed 7% gap-CoV warp drives $\Lambda$ from 2.7 to $7.5\times10^3$ between $N{=}16$ and $N{=}128$. The topological/metric division of foundational §12.3 is thus measured as stated: the relabeling is free to the limit of the register's injectivity; the intrinsic regularity is priced, and the price is exponential. The approximate cull's weakened requirement (foundational §12.4) remains a boundary of the claim, not a counterexample to it.

---

## 10.3 A third quantity the coordinate moves, and it is not $\Lambda$

`[clean, verified; warp_band.js W1]`

§10.2 divides what a change of coordinate can touch into two, and the division is by what it costs: the **topological** relabeling is free, the **intrinsic-metric** regularity is priced at exponential rates. Both halves are statements about the amplification $\Lambda$ — the free one leaves it identical, the priced one detonates it. That exhausts the question of whether the *scheme* survives. It does not exhaust the question of what the scheme *costs to run*, because it says nothing about the content.

A reparameterization that is free in §10.2's sense — order-preserving, arc-regularity preserved, $\Lambda$ untouched — can still change **how many leaves the content needs.** Bandwidth is not a conjugation invariant. A function band-limited at $k$ in one coordinate is not band-limited at $k$ in another, and the reconstruction being blind to the relabeling does not make the *spectrum* blind to it.

The cleanest instance is the one an implementation meets immediately. Take a contour given radially, $r(\theta) = 1 + a\sin(k\theta)$, which carries a single angular frequency and is therefore band-limited at $k$ in $\theta$: Nyquist says the leaf grid must satisfy $N > 2k$, and nothing under that can hold it. Now sample it **arc-uniformly in the plane**, which is what the leaf lattice is (foundational §9) and what §10.2 certifies as the regularity the scheme requires. Arc length is not proportional to $\theta$ on this curve — it depends on $r$ and $r'$ — so the map $\theta \mapsto s$ is a nonlinear order-preserving homeomorphism, and the sampled function acquires harmonics above $k$.

Measured, as the smallest rung reconstructing the contour to the harness's tolerance, expressed as a multiple of the Nyquist floor $2^{\lceil\log_2(2k+1)\rceil}$:

| $a$ | $k=4$ | $k=8$ | $k=16$ | $k=32$ |
|---|---|---|---|---|
| 0.30 | 4× | 4× | 4× | 8× |
| 0.22 | 2× | 4× | 4× | 4× |
| 0.12 | 1× | 2× | 2× | 4× |
| 0.06 | 1× | 1× | 2× | 2× |
| 0.03 | 1× | 1× | 1× | 1× |
| 0.015 | 1× | 1× | 1× | 1× |
| 0.008 | 1× | 1× | 1× | 1× |

The excess collapses to **exactly 1×** as the lobe amplitude vanishes, monotonically, at every $k$ — which is what reparameterization leakage looks like and what nothing else does. At $a \to 0$ the curve tends to a circle, where arc length *is* proportional to $\theta$, the map becomes affine, and the band is preserved exactly. The excess measures how far from affine the reparameterization is, not any defect in the scheme.

Nothing here is a failure of the reconstruction, and the distinction is the point. The leaves are arc-regular, so §10.2's requirement is met; $\Lambda$ is the clean $(2/\pi)\ln N$ throughout; exactness at the nodes (R2) holds at every row of that table. The reconstruction is doing precisely what the theorem says. It is the **content** that changed band, and the observer pays for it in leaves.

> Conjugation is free in the operator and not free in the spectrum. §10.2 prices the scheme; this prices the signal. A relabeling that costs the reconstruction nothing can still cost the content a factor of eight in $N$.

Three consequences worth carrying. **For the theorem, none:** (R1)–(R5) are statements about the map at its nodes and between them; none quantifies over the content's bandwidth, and $\omega_F$ in (R3) is already the modulus of continuity *in the sampled coordinate*. The bound was always stated in the right variable — what this adds is that $\omega_F$ is the term the coordinate moves, which the classical bound permits and §10.2's division does not mention. **For the practitioner, a warning with a number on it:** a source described analytically in one coordinate and sampled in another should not have its rung predicted from the analytic bandwidth. The prediction is a *floor*, not an estimate — it held as a floor in 12 of 12 bands at every amplitude tested, and the excess above it ran to 8×. **For the warp family, a companion axis:** that harness varies the warp and watches $\Lambda$; the same family varied against the content's required $N$ is a second, independent read on the same deformation, and the two answer differently, because a warp can leave $\Lambda$ untouched while multiplying the rung.

`[refutable by]` — a nonlinear order-preserving reparameterization of an arc-regular grid under which a single-frequency contour's required rung stays at the Nyquist floor; or any row of the table above in which the required rung falls *below* $2k$.

---

## 10.4 Two ladders, and they are not the same ladder

`[editorial; no new result]`

Two sequences of angular extents appear in this framework and a reader meeting
them in the same paper will merge them. They are orthogonal, and the merge costs
a constant and a dimension.

**The doubling ladder.** $\pi/2 \to \pi \to 2\pi$, and it is **one angle
throughout.** The atom is the forward observation, extent $\pi/2$. Two atoms
compose into the semicircle of extent $\pi$ — the observer's actual universe,
whose period is $\pi$ (§2.1). The $2\pi$ display circle is not a further region
of space but the same universe presented outward, reached by the substitution
$\varphi = 2\theta$ of Proposition 10.1: *one traversal of the line is one
traversal of the circle.* Nothing here acquires a dimension. The factor of two
between the rungs is $\psi_1$, forced rather than chosen, and it is the first
casualty of reading this ladder as a spatial one.

**The dimensional ladder.** Separately, and about a different quantity: a
pointing in $n$-space is $n-1$ **ratios**. Two-space is one ratio — that is the
atom. Three-space is two ratios, so its directional manifold has dimension two
(§15.2: *"a 3-space observer's pointing is two ratios — a point of the
directional manifold, dimension two, not three"*). **Adding a spatial axis adds
a ratio, not a manifold dimension**, and the count is off by one from the
dimension of the space throughout.

> The tempting reading is *semicircle = one axis, circle = two axes, sphere =
> three*. It is wrong at every rung. The semicircle and the circle are the same
> one-dimensional universe at two presentations; the ratio count, not the extent,
> is what tracks dimension; and the top of the dimensional ladder is not a sphere
> at all.

That last clause is §15.2's, and it is worth carrying forward from here so the
picture does not have to be unlearned later: the monolithic spherical read is
**rejected** — the budget's null-cone requirement selects the circle-of-circles,
pan × tilt, nested one-dimensional apertures — and $S^2$ turns out to be
$T^2/\sigma$ with the polar circles collapsed, *the surveyor's completion of the
observer's torus, not an identification the observer makes*. The observer going
up in dimension acquires another circle, not a sphere.

---

## 10.5 Two parities, and they are not the same parity

`[editorial + one measurement; `verify-slope.mjs`. Added because the companion *The
Observation Atom* forces an **odd** $N$ at its §10 and this paper forces an **even** one at
§4.1, and a reader meeting both in the same week will take that for a contradiction. It is
not one, and saying why turns out to locate something in this paper that was not noticed.]`

The two $N$s count different things. This paper's $N=2^{d+1}$ counts **atoms on the
circle** — how many places the holding reads. The atom paper's $N$ counts **states in the
register** — how many things one reading can say. One is a grid, the other an alphabet, and
nothing requires them to agree.

They do, however, concern the same point. The atom paper's forcing is about the swap's fixed
point: the ladder is symmetric under exchanging $V$ and $H$, the corner is that reflection's
fixed point, and an even register has no state there — so it cannot implement *$h$ becomes
the value just read*, and on a motionless world it speaks on every look forever, error pinned
at $\sigma/2$ with alternating sign. *An even register can be at the corner and cannot say
so. Silence is not in the alphabet.* That is a forcing rather than a preference, and it costs
nothing to obey.

**This paper's lattice has no atom at the corner either.** The leaves sit at
$t_k=(k+\tfrac12)\pi/N$, so $t=\pi/4$ requires $N\equiv2\pmod4$, and the only $N=2^{d+1}$
that satisfies it is $N=2$. At every depth past the first the gate is a place the
presentation passes through and the holding never names — the same structural gap, in the
node set rather than the alphabet, and it has been there unremarked since §2.2.

It is harmless here, and the reason it is harmless is the uniformity root. On a uniform grid
**no node is privileged**: (R1) and (R2) hold at every leaf alike, the kernel is the identity
at each and zero at the others, and the reconstruction has no use for a landmark. A register
is the opposite case — its whole content is what it can *utter*, so a landmark it cannot name
is a landmark it does not have. Naming needs a state; interpolating needs a grid. The two
parities are right for the two jobs, and the discrimination between them is exactly
*reporting* versus *passing through*:

> A fixed point matters to a holding that must report it, and does not matter to a
> presentation that must only pass through it.

Two consequences worth carrying. *First*, an implementation that reads symbols off these
leaves inherits the register question and not the lattice question — the alphabet is a
separate choice from the grid, and buying an atom at the corner by taking $N\equiv2\pmod4$
would cost the dyadic cascade and the even kernel and buy nothing, because the reconstruction
does not report. *Second*, the two papers can nonetheless be run on one implementation, and
the thing that makes that legal is the parity switch of §4.1 and §11 — $\tan\to\sin$ in the
angle chart, $N/2\to\lfloor N/2\rfloor$ in the slope chart. Without it an odd leaf count is a
silent error in both charts; with it the grid and the alphabet are independent choices, which
is what they should have been all along.

`[refutable by]` a leaf at $s=1$ for any $N=2^{d+1}$ with $d\ge1$; or a use of the leaf
lattice in which node-exactness or partition of unity distinguishes the corner from any other
node.

---

## 11. The projection Jacobian

The chord corollary's cosine projection carries a measure fact worth stating once, because it explains the kernel's $\tan(\varphi/2)$ factor. The observer's uniform angular measure pushes forward onto a flat target by whichever projection reads it: under $\cos$ (the orthographic shadow, the chord) it becomes the **arcsine** density $1/(\pi\sqrt{1-x^2})$ on $[-1,1]$ — which is why the leaves cluster toward the chord edges exactly as Chebyshev nodes; under $\tan$ (the central projection, the line) it becomes the **Cauchy** density $1/(\pi(1+x^2))$, the atom's own measure (foundational §4, §9). The kernel's $\tan(\varphi/2)$ is precisely this projection Jacobian, carrying uniform arc onto the chord. The fuller geometry — that each flat target receives its own canonical measure (the interval's equilibrium measure under $\cos$, the line's Möbius-natural measure under $\tan$): the two-densities square — is the foundational paper's; the bridge needs only the Jacobian.

**The kernel is the Cauchy measure to the resolution power.** The $\tan$ is not merely *a* Jacobian carried alongside the kernel; written in the observer's coordinate it *is* the kernel. Put $s = \tan t$ — the period-$\pi$ inside arc of §10.1, so $s=\tan(\varphi/2)$ if the outside arc is the one in hand. Then
$$\tilde K_N(t) \;=\; K_N(2t) \;=\; \frac{\operatorname{Im}\!\big[(1+is)^N\big]}{N\,s\,(1+s^2)^{\lfloor N/2\rfloor}},$$

verified to machine precision, at both parities.

`[correction, August 2026; `verify-slope.mjs`]` *The exponent displayed here was $N/2$, and
that is the even-$N$ kernel only.* Since $|1+is|^N=(1+s^2)^{N/2}$ and $\arg(1+is)=\arctan s=t$,
the numerator is $(1+s^2)^{N/2}\sin(Nt)$ and the published expression collapses to
$\sin(Nt)/(N s)$ — which is $\sin(N\varphi/2)/(N\tan(\varphi/2))$, §4.1's even form exactly.
It carries the same parity assumption as the trigonometric display, for the same reason:
$N=2^{d+1}$ is always even here, so the question never arises. Where it does arise the
correction is a floor. With $\sin t=s/\sqrt{1+s^2}$, the odd kernel $\sin(Nt)/(N\sin t)$ is
the same numerator over one lower power of the Cauchy denominator, and $\lfloor N/2\rfloor$
is both parities at once. Measured against the angle form at $N=33$: as published,
$2.7\times10^{-2}$; with the floor, $5.6\times10^{-16}$.

`[second correction, August 2026; `verify-round2.mjs`]` *A first draft of the paragraph above
closed "rational for even $N$, rational-times-$\sqrt{1+s^2}$ for odd, which is the
constructible tier either way." The concession was unnecessary and the claim is stronger than
it was stated: **the floor form is a pure rational function of $s$ at both parities**, and no
square root survives.* The two $\sqrt{1+s^2}$ factors one expects — the one converting $\sin t$
to $s$, and the one hiding in the half-integer power — are the same factor and they cancel.
Explicitly, $\operatorname{Im}[(1+is)^N]=\sum_{k\ \mathrm{odd}}\binom{N}{k}(-1)^{(k-1)/2}s^k$
is an integer polynomial at every $N$, and dividing it by $N\,s\,(1+s^2)^{\lfloor N/2\rfloor}$
— an integer power at every $N$, which is the whole point of the floor — gives the odd
kernels in the same shape as the even ones:
$$K_3=\frac{3-s^2}{3\,(1+s^2)},\qquad K_5=\frac{5-10s^2+s^4}{5\,(1+s^2)^2},\qquad
  K_9=\frac{9-84s^2+126s^4-36s^6+s^8}{9\,(1+s^2)^4}.$$
Verified by evaluating the numerator as an integer polynomial and the denominator as an
integer power, with `Math.sqrt` instrumented and the count held at **zero**: agreement with
$\sin(N\varphi/2)/(N\sin(\varphi/2))$ is $4\times10^{-14}$ to $2\times10^{-13}$ for
$N\in\{3,5,9,17,33\}$. This matters beyond tidiness. §11's standing claim is that the reverse
map's only non-rational operation is a single $\sqrt{1+s^2}$; had the odd case genuinely
needed one *inside the kernel*, the parity would have been a tier boundary rather than an
exponent. It is not: **odd $N$ is the same constructible tier as even $N$, not one step worse**,
and §17.3 of the spectral companion now records the same fact from the de Moivre side, where
the cancellation is visible as $\cos^{\epsilon}t$ rather than inferred.

**The parity that cost a $\tan$ in §4.1 costs a floor here.** That is worth stating as more
than an erratum, because it is the chart division running through a mistake. In the angle
chart the choice between $\tan$ and $\sin$ reads as notational preference, both forms
interpolate at every node, and the failure is silent — a 33-leaf circle built with the even
kernel misses partition of unity by $1.4\times10^{-3}$ in the sup — §4.1's own $0.15$ px
on a radius-100 circle, recovered — and looks correct at every leaf (Appendix B.1). In the
slope chart the same fact is dimensional: one factor of the Cauchy density, present or
absent. Each chart is legible about the structure it linearises and blind at the seam the
other one makes plain. The error above was inherited *from* the angle chart *into* the slope
form, which is the direction that ought to be least surprising and was not.

**Back to the even case, which is the one this paper runs.** (The companion's §17.1a and
§17.3 carry the general statement and its odd-parity verification table; what follows is the
even specialization this paper's $N=2^{d+1}$ always sits in.) The denominator is the Cauchy measure raised to $N/2$, and at $N=2$ the kernel is exactly the Cauchy itself, $\tilde K_2 = 1/(1+s^2) = \cos^2 t$ — the atom's own measure with no remainder. For higher even $N$ — and $N = 2^{d+1}$ is always even — the numerator is a polynomial in $s$ and $(1+s^2)^{N/2}$ an integer power, so $K_N$ is a *rational* function of the slope: $K_4 = (1-s^2)/(1+s^2)^2$, $K_8 = (-s^6+7s^4-7s^2+1)/(1+s^2)^4$, and so on — the Cauchy to the $N/2$, modulated by a polynomial. The rising Cauchy power is localization-with-depth: a higher $N$ is a sharper Cauchy peak, the density refinement of §14 in algebraic form.

This makes the reverse map the observer's operation, not a surveyor's. The kernel is evaluated at the difference of *inside* arcs $t - t_k$ (the line-representation reading of $\theta$, per the Convention; $t_k=\theta_k/2$ against the outside leaf positions), and $\tan(t - t_k) = (s - s_k)/(1 + s\,s_k)$ — the tangent-subtraction, the composition law (foundational §8). So the whole reverse map $\Psi$, in slope coordinates, is rational functions of Möbius-composed slopes over Cauchy denominators, with the single square root $\sqrt{1+s^2}$ the only non-rational operation — no $\sin$, no $\tan$, no $\arctan$, no $\pi$. The transcendental kernel of §4 is the angle-side dress of a slope-side algebraic object: the foundational paper's slope-versus-angle locating of the transcendental, applied to the kernel itself — the observer holds the slope and composes by Möbius, while $\tan$ lives on the angle side it never has to evaluate. A reference implementation reconstructs through this slope form with the trig held at zero in the per-leaf loop, reproducing the angle-form reconstruction to machine precision across every $N$ tested ($\sim\!10^{-13}$ to $N=256$), exact at the leaves. (The qualifier *in the per-leaf loop* was doing real work in that sentence, because the leaf slopes were still converted at setup. §11.1 removes that too, and the count is now zero over the whole path.) The reverse map is bounded ($O(K)$ over the held leaves), slope-side, and Cauchy-built; the $\tan$ in the published kernel is a removable presentation, not a transcendental the observer evaluates.

**One structure, four faces.** The slope form shows the kernel's ingredients are not four tools that happen to co-occur but one map used four ways. The **tangent** is the map, slope $\leftrightarrow$ angle. The **Cauchy** $(1+s^2)^{-1}$ is its Jacobian, $d\theta/ds$ — the measure is the derivative of the map, not an independent choice (foundational §4, §9). The **Möbius** law $(s-s_k)/(1+s\,s_k)$ is tangent-addition, the map's group structure (foundational §8) — the composition is the map's own law. The **dyadic depth** $N=2^{d+1}$ is repeated tangent-halving, the map iterated. So $K_N(s)=\operatorname{Im}[(1+is)^N]/(N\,s\,(1+s^2)^{\lfloor N/2\rfloor})$ exhibits all four at once — map, Jacobian, group law, iteration — because presenting bounded observation is using the tangent in each of the ways a map can be used. The tangent is the single generator; the Cauchy, the Möbius composition, and the dyadic descent are its derivative, its group, and its iteration; the bridge kernel is the object in which the four coincide. This is why the framework's recurring objects recur *together* — they are aspects of one map — and it is the reason "Tangent Bridge" names the map, not the measure: the Cauchy is what the tangent carries, not the bridge itself.

The claim is now held at full grade. That these four are one map's aspects is a set of identities, not analogies — the Cauchy *is* $d\theta/ds$, the Möbius law *is* tangent-addition, the descent *is* halving, each provable, and the kernel's slope form is verified. The stronger reading — that the tangent *generates* the framework — is discharged in the foundational paper: the Cauchy is *forced*, not merely natural, as the unique invariant measure of the combination law's rotation group (invariance under a continuum of rotations kills every non-constant Fourier mode on the loop, leaving the uniform density, which pushed to the slope is exactly $1/(1+s^2)$; Haar uniqueness, foundational §4, §9.5, verified in `measure_forcing.py`). The forcing is conditional in the ordinary mathematical sense, its two premises named: composition-covariance — which is no postulate but the combination law itself, i.e. tangent-addition — and the observer's holding no privileged frame to anchor a bias, which is what *simple* means, not an indifference prior. Since the combination law *is* the tangent's group structure, the measure is forced by the map together with boundedness, and the four-in-one reading stands as claimed: the tangent is the single generator; its derivative, its group, and its iteration are the framework's recurring objects; the bridge kernel is where they coincide. What remains open is not the measure but the *source* — whether the world draws atoms evenly in fact, an ontic question no observable can detect and the rate never used — relocated to the observer/surveyor line where the framework already places the unanswerable (foundational §4).

### 11.1 The lattice is generated, not converted

`[clean, verified; `verify-slope.mjs`, August 2026. This re-derives the constructible grid
already in §15.3's *Verified* record — "trig-free slope-form kernel with constructible
(bisection + Möbius-addition) grid, drift $\le1.8\times10^{-15}$, zero trig calls through
$N=1024$" — and independently in the spectral companion's §17.3, whose trig-free record
tabulates the same zero-call reconstruction against the node identity $|K_N(\theta_j-\theta_k)
-\delta_{jk}|$ through $N=64$. The two are worth citing together because they hold the count
at zero over *different* paths: §15.3 over the reconstruction, §17.3 over the kernel's own
rational form. This section adds three things neither record carries: the condition on $N$,
the reason that condition is not a coincidence, and the numerical form the bisection has to
take.]`

One tangent survived the slope form, and it did not have to. The reverse map is trig-free
given a slope-posed query, but the *leaf positions* were still stated angularly and converted
— $s_k=\tan\big((k+\tfrac12)\pi/N\big)$, once per leaf at setup, defended as the boundary
conversion this paper allows. It is not a boundary. §2.4 forces the leaf lattice as the
cascade's orbit structure, and an orbit is something you *generate*:

$$\text{halve:}\quad \tan(x/2)=\frac{t}{1+\sqrt{1+t^2}}, \qquad\qquad
  \text{step:}\quad \tan(a{+}b)=\frac{t_a+t_b}{1-t_a t_b}.$$

Seed at the gate — $s=1$, the working horizon of §2.4, which is not an angle but the
statement *the run equals the rise*, two lengths compared with no total in sight — halve
$d$ times, then walk the odd multiples by tangent addition. Measured against
$\tan\big((k+\tfrac12)\pi/N\big)$, agreement is $\le3\times10^{-15}$ in the arc through
$N=2048$, with the trigonometric call count **measured** rather than argued: every
trigonometric entry point is replaced by a counter before the run, and a reconstruction at
$N=128$ over $512$ queries with the lattice built from scratch executes $0$ of them. What
remains is $\log_2 N$ square roots for the descent and one per kernel evaluation — the
single non-rational step §10.1 (foundational) permits, and no other.

**Two footnotes that are not footnotes.**

*The reachable $N$ are Gauss's, and the radix is why.* $\tan(\pi/2N)$ is constructible
exactly when $2N$ is a power of two times distinct Fermat primes. The cascade therefore
generates the lattice for $N=2^m$ and, with the seeds $\tan(\pi/6)=1/\sqrt3$ and
$\tan(\pi/10)$, for $3\cdot2^m$ and $5\cdot2^m$; at $N=33$ or $N=72$ it declines and the
tangent returns. The paper's own $N=2^{d+1}$ is inside the reachable set at every depth, and
that is not luck. §2.4 forces $g=2$ as the unique dilation under which the cascade tiles —
an argument about angular measure with no arithmetic in it — and $2$ is also the one radix
under which every leaf position stays reachable by square roots. **The radix forced for
tiling is the radix that keeps the lattice constructible**, which is the §11 four-in-one
read once more: the iteration of the map and the tier its values live in are not two
choices.

*The rationalised bisection is load-bearing.* The textbook half-angle
$(\sqrt{1+t^2}-1)/t$ is the same number and subtracts near-equals: as $t$ shrinks,
$\sqrt{1+t^2}\to1$ and the numerator loses every bit it has. Built that way the lattice
drifts to $1.6\times10^{-9}$ by $N=2048$; built as $t/(1+\sqrt{1+t^2})$ it holds
$10^{-13}$. Four orders of magnitude between two expressions that are identical on paper.
The algebraic chart is not self-executing — it has its own craft and its own leak, and the
difference from the transcendental case is only that this leak is visible as arithmetic
rather than sealed inside a named function.

**And the gate is the generator, not a member.** The lattice has an atom at the corner
$s=1$ only when $N\equiv2 \pmod 4$, and the only $N=2^{d+1}$ that satisfies it is $N=2$.
At every depth past the first the swap's fixed point — the working horizon, the cascade's
own cell boundary of §9.6 — is a place the presentation passes through and the holding never
names. The cascade *starts* there and steps away by two base arcs, so the corner is the seed
of the orbit and not a point of it. §10.5 takes up what that costs, which is nothing here and
is not nothing everywhere.

`[refutable by]` a leaf at $s=1$ for any $N=2^{d+1}$ with $d\ge1$; or a lattice generated by
the cascade that disagrees with the tangent construction in the arc beyond
$3\times10^{-15}$ at any reachable $N\le2048$.

### 11.2 The horizon is an address, and it has to be given one

`[correction, August 2026; `verify-slope.mjs`]`

The Möbius composition $\tan(t-t_k)=(s-s_k)/(1+s\,s_k)$ is the whole of how a slope-posed
query reaches the kernel, and it is exactly correct across the seam — $\mathbb{RP}^1$ has no
edge to fold at, which is why the slope form needs no range reduction where the angle form
opens with two (§4.1's kernel folds $\varphi$ into $(-\pi,\pi]$ before it can evaluate). That
is the chart's advantage stated at its sharpest: *the angle is only meaningful modulo a
completed total, so the operation must know where the circle ends in order to put the query
back inside it; the slope never asks.*

The advantage is not free of arithmetic. At $s=\infty$ — the antipode $\varphi=\pm\pi$, which
§4.1 records as occurring on this grid whenever $j-k=\pm N$ for odd $j,k$ — the composition
evaluates $(\infty-s_k)/(1+\infty\cdot s_k)$, which is $\infty/\infty$: the excluded pair, a
NaN. It is the same residue the atom paper isolates at its §12, where the exception category
is shown to collapse to one state at one formation site: *the opposite-chart product
$0\otimes\infty$ computes to the excluded pair $(0,0)$, is absorbing, and is functionally a
NaN.* Here it is not a curiosity but a live path, and its failure mode is the bad one — it
falls into the kernel's own antipode branch and returns a number, silently wrong, rather than
propagating. Both ends need the address given explicitly:

$$s=\infty:\ \tan(t-t_k)=\cot t_k = 1/s_k, \qquad
  s_k=\infty:\ \tan(t-t_k)=-\cot t = -1/s.$$

With both guarded the antipode is exact to $10^{-15}$ at either parity; without them it
returns $0$ at even $N$. The reading is the atom paper's, transferred: **infinity is not held
here either — it is relocated**, folded into a chart bit, one address with two approaches. The
composition law is where that relocation has to be performed, and a law written only for the
generic case performs it by accident.

`[refutable by]` a slope-chart reconstruction that is exact at $\varphi=\pm\pi$ with the
generic quotient alone.

---

## 12. The separable extension to product tori

The theorem tensors. On the product torus $T^d = (S^1)^d$, sampling at the product leaf grid and reconstructing with the product kernel $\prod_i K_{N_i}(\theta_i - \theta_{k_i})$ inherits (R1)–(R5) axis by axis (T1–T5): exact at the product atoms, bounded between by the per-axis moduli, inside-bounded in each coordinate. The framework's worked content classes are instances at specific $d$: 1D audio ($d=1$), 2D images grayscale and color ($d=2$, color by channel), parametric surfaces $T^2 \to \mathbb{R}^3$ ($d=2$), 1D animation tracks ($d=1$, time on $S^1$), animated surfaces $T^3 \to \mathbb{R}^3$ ($d=3$). The same kernel reconstructs all of them; the leaf-coefficient arithmetic (addition, scaling, blending) is uniform across $d$ by (T5) linearity; the same compression knob (atoms per axis) trades fidelity for storage uniformly. Audio, images, surfaces, and animation are not distinct domains but distinct $d$ on one structure — the product reading being $d$ independent observer's-eye views composed at right angles. (Animated and layered content in this list is more precisely *composition* — one bridge driving another — than tensoring; §12.5.)

**The easy case, marked as such.** The product torus *factors* into circles, so the one-dimensional theorem tensors with no new mathematics (separable trigonometric interpolation is classical; Atkinson 1989, Lyche–Mørken 2008). This is *not* the hard higher-dimensional question — content on a non-product manifold, a sphere $S^{\geq 2}$ whose directions do not factor as $S^1 \times \cdots \times S^1$. That case rests on the directional measure of the foundational §9 and on the open question of what manifold a higher-dimensional observer's directions close into (the $S^d$-versus-$\mathbb{RP}^d$ orientation fork; see §15.2); it requires spherical harmonics and is out of scope here. The product torus covers anything whose parameter domain factors into circles — a large practical class, not an exhaustive one.

---

## 12.5 Composition: bridges driving bridges

The separable extension combines circles by tensor product — one joint field on $T^d$, reconstructed on the product grid of $\prod_i N_i$ atoms. There is a second, cheaper way to combine bounded observations, and it is the mode the animated and layered content of §12 properly belongs to: **a bridge's atom readings need not be constants — they can be the outputs of other bridges.** Feeding bridges into bridges composes bounded observations without leaving the primitive and without ever forming the product grid.

Concretely, planar content is two scalar bridges — $x(\theta), y(\theta)$ over a spatial circle of $N_S$ leaves. Let its leaf values vary along a second (temporal) circle, each driven by further bridges: a global driver $O$ of $N_O$ leaves displacing every spatial atom alike, and, at selected leaves $k$, a local driver $C_k$ of $N_C$ leaves displacing that atom's neighborhood. The reconstructed content at parameter $\theta$ and phase $t$ is

$$P(\theta, t) \;=\; \Psi\!\big[\,\ell + \delta_O(t) + {\textstyle\sum_k} w_k\,\delta_{C_k}(t)\,\big](\theta),$$

where $\ell$ are the rest atoms, $\delta(t) = \Psi(t) - a$ is a temporal bridge read as a displacement from its fixed anchor $a$, and $w_k$ is a local weight around leaf $k$. The temporal bridges do not reconstruct $P$ directly; they reconstruct the *atoms* the spatial bridge then reconstructs from. The content rides the global driver; the local drivers ride on top of it.

**This is not the tensor product, and it refines §12's filing of animation.** $P$ is a field on the product torus $S^1_\theta \times S^1_t$, but a structured one: a sum of rank-one (separable) terms — $\ell$ and $\delta_O$ each constant along one axis, each $w_k\,\delta_{C_k}$ an outer product of a spatial window and a temporal loop. Where §12's product kernel reconstructs a *general* joint field at cost $\prod_i N_i$, composition represents the low-rank, articulated subclass at cost $\sum(\text{driving atoms})$. Animation is therefore not "time as another tensor axis" but time as a separate bridge whose reconstruction drives a spatial bridge's readings; the two combine by nesting, not by a product grid — and the same holds for any layered content in which one bounded observation displaces another.

**The mean/oscillation split is what makes a bridge usable as a driver.** A reconstructed closed loop decomposes into a mean (its DC component) and an oscillation about it (its AC component), and both are content. Read against a fixed anchor $a$, the anchor is a position and $\Psi(t) - a$ the excursion from it: translating the whole loop relative to $a$ is a pure DC operation — it repositions where the driven atom sits — while resculpting the loop changes the AC without moving the anchor. So one bridged loop supplies both *where* a driven atom sits and *how* it travels; these are not two mechanisms but the two components of a single reconstruction, separated by the choice of a fixed reference. Without the anchor the loop is centroid-relative and carries no DC — a pure orbit that cannot reposition what it drives; the anchor is precisely the DC handle that a bounded observer, holding a loop it can close, already has.

**What survives, by slice.** Composition is linear in each reverse map — the same (T5) linearity that makes leaf-coefficient arithmetic uniform — so the theorem passes through slice-wise rather than as a new joint theorem. Freeze $t$: the driven atoms take definite values and $P(\cdot, t)$ is a pure spatial bridge — (R1), (R2), (R5) exact, (R3) its ordinary modulus bound. Freeze $\theta$ at a spatial atom: its trajectory is a fixed linear combination of temporal bridges, continuous and bounded, exact at each driver's own leaves. Inside-boundedness holds throughout — every read is $O(K)$ over held leaves, no global functional of any signal is formed, and no bridge knows its $N$ (R5). Composition inherits (R5) because it is assembled only from maps that have it.

**Amplification adds; it does not compound — and this is the composition's advantage over the product grid.** The composed operator's worst-case amplification — its Lebesgue constant, the $\ell^\infty\!\to\ell^\infty$ norm — decomposes *additively* across the layers rather than multiplicatively. At any output point $(\theta,t)$ the summed magnitude of the input coefficients splits into three independent terms: the spatial bridge's own $\Lambda_{N_S}(\theta)$; the global driver's, which is $\Lambda_{N_O}(t)$ *alone* — the spatial partition of unity ($\sum_k K_{N_S}=1$, Lemma 4.3a) collapses the driven bridge's factor to $1$, so *a global driver is not amplified by the bridge it drives*; and each local driver's $\Lambda_{N_C}(t)$ weighted by the reconstructed window mass $R_j(\theta)=\sum_k w_k\,K_{N_S}(\theta-\theta_k)$ at that point. Hence
$$\Lambda_{\mathrm{comp}} \;=\; \sup_{\theta,t}\Big[\,\Lambda_{N_S}(\theta) + \Lambda_{N_O}(t) + \Lambda_{N_C}(t)\!\textstyle\sum_j |R_j(\theta)|\,\Big] \;\le\; \Lambda_{N_S} + \Lambda_{N_O} + K_W\,\Lambda_{N_C},\qquad K_W=\sup_\theta\!\textstyle\sum_j|R_j(\theta)|,$$
verified to hold with equality at the worst point. Two consequences follow, both confirmed by direct measurement. Adding *non-overlapping* local drivers costs nothing: the amplification is set by the local *overlap* $K_W$ of the windows, not by their count, so a bounded observer can carry arbitrarily many well-separated drivers at fixed amplification. And even fully overlapping drivers *add* — one $\Lambda_{N_C}$ per overlapping layer, $K_W$ growing linearly with the stack depth — never multiply. The contrast with §12 is exact and is the reason composition is the right representation for low-rank spacetime content: the product torus's Lebesgue constant is $\prod_i \Lambda_{N_i}$ (it *compounds*), while composition's is $\sum_i \Lambda_{N_i}$ (it *adds*). Composition beats the product grid twice over on the same articulated content — $\sum$ versus $\prod$ in atom count, and $\sum$ versus $\prod$ in amplification — and the partition of unity is what buys the second.

**When $K_W$ is the overlap you designed — and when it is not.** The bound above is unconditional because $K_W$ is defined on the *reconstructed* window masses $R_j$, but that definition quietly contains a design rule, and it is worth naming because the bound's practical value rides on it (measured, `compose_tests.js`, Jul 2026). If each window $w_j$ is band-limited at the spatial rung, node-reconstruction is exact — $R_j(\theta) = w_j(\theta)$ by (R2) — and $K_W$ equals the *designed* overlap $\sup_\theta \sum_j |w_j(\theta)|$: separated smooth bumps measure $\sup S$ flat at $\sup|w|$ as their count grows, and stacked bumps measure exactly linear, six digits. If a window carries out-of-band energy — a hard indicator is the extreme — $K_W$ self-inflates: pointwise by the Gibbs overshoot ($\approx 1.13$ measured), and in the worst case over leaf-space inputs by the *support-restricted Lebesgue function*, which grows at $\psi_1 \ln 2$ per doubling of the support's leaf count (measured $2.03 \to 2.98$ over $N_S = 32 \to 256$ with proportional support, and flat where the support count is pinned) — reaching the full $\Lambda_{N_S}$ only when the window spans the loop. So the violation of the design rule is not failure but a priced degradation, and the price is the house law again: $\psi_1 \ln(\text{support})$. Smooth, band-limited windows are therefore not an aesthetic choice; they are the hypothesis under which the additive bound's $K_W$ is the number the designer controls.

**Two structural facts, now characterized.** First, *there is no divisibility condition — and the tempting one is false.* The composition is exact as evaluated at every phase: each driver is a deterministic bridge, exact at its own leaves by (R2) whatever the others do (per-driver leaf-exactness holds independent of the composition). What a shared grid *would* buy is joint keyframe control — pinning every active driver's contribution at one phase at once — and that needs the drivers to share a leaf there. The odd-dyadic placement (§2.2) settles it: leaf sets at different resolutions are *disjoint*, not nested. Refinement adds leaves *between* the existing ones (§14), so the function spaces nest ($V_{N_C}\subset V_{N_O}$) while the leaf sets do not — and divisibility buys nothing, $N_C \mid N_O$ producing zero shared leaves exactly as a non-divisor does. Joint keyframe control across resolutions is therefore available only at *identical* resolution $N_C = N_O$, where every leaf coincides; at any unequal pair, divisor or not, the drivers interleave. What holds instead is a band-limit fact, not a grid one: the composed motion lies in $V_{\max(N_O,N_C)}$, so it collapses losslessly onto the higher-resolution driver's grid — always, with no divisibility — should one ever want to bake a composition down into a single bridge. Second, the spatial window is a design choice with a characterized tradeoff, and the grade *resonant with, but not identified with,* the kernel's unit-summing property (§4.1) is exactly right. What makes the local-driver amplification overlap-flat ($K_W \to 1$ however deep the stack) is a *partition of unity* — the kernel's defining property — and identifying the window with one does flatten $K_W$. But it is the unit-summing that does this, not the kernel's shape: a window given the kernel's own lobe shape yet left un-normalized grows $K_W$ with overlap exactly as the raised-cosine bump does (its side-lobes and $\sim 1/s^2$ tail, §14, make it marginally worse). And a partition-of-unity window couples the drivers — normalization redistributes each driver's authored amplitude to its overlapping neighbors, the self-drive fidelity falling as roughly the inverse of the overlap depth — so it cannot carry independently authored drivers. The compact $C^1$ bump is thus the *independent-driver* choice (overlap amplification, no coupling); the kernel's partition is the *amplification-flat* choice (coupling, no overlap growth). They optimize opposite things, which is why the window is composition's blend and not a second bridge — and why "identified with the kernel" would be the wrong move for independently authored content, not merely an unmade one.

**Shared aperture.** Composition reconstructs every layer under the observer's single aperture (§10.2), with no per-driver window — a coupling, but a benign one. The kernel is cardinal at the leaves at every aperture (§4.1), so each driver's keyframes are aperture-invariant *exactly*; only the between-keyframe fill moves as the aperture narrows and each reconstruction localizes. For smooth drivers that motion shifts by under a tenth of a percent of its amplitude across the entire aperture range, and vanishes at moderate apertures — one observer with one window, not a hazard. It would surface only for a driver carrying content in the aperture-sensitive high band, where the Gibbs overshoot the aperture localizes but does not cancel (§4.1, itself near-flat across the aperture range) would ride into the motion itself.

**Held at grade.** *Established:* composition preserves (R1), (R2), (R5) exactly on every frozen-phase slice and at the driving atoms, by the reverse map's linearity and each factor's own bridge properties; the mean/oscillation decomposition against a fixed anchor is an identity; the shared-aperture coupling is characterized — keyframes aperture-invariant by cardinality, between-keyframe motion aperture-dependent but bounded (sub-tenth-of-a-percent for smooth drivers); and the composed amplification is *additive* across layers — $\Lambda_{\mathrm{comp}} = \Lambda_{N_S} + \Lambda_{N_O} + K_W\Lambda_{N_C}$ with global drivers un-amplified by the partition of unity and local drivers scaling with window overlap $K_W$ rather than count — a Lebesgue-constant statement derived from the coefficient decomposition above and confirmed to hold with equality at the worst point. This settles, for composition, the question the product grid leaves multiplicative: the amplification adds, it does not compound. *Established (closing the section):* the full combined modulus bound is additive with the ordinary single-bridge constant. The composed error separates across independent axes as $e_S(\theta) + e_O(t) + \sum_k w_k\,e_{C_k}(t)$ — a sum of per-layer reconstruction errors — so $\|E\|_\infty \le \Lambda_{N_S}\,\omega_S(\pi/N_S) + \Lambda_{N_O}\,\omega_O(\pi/N_O) + K_W\,\Lambda_{N_C}\,\omega_C(\pi/N_C)$: each layer's amplification (above) times its own Jackson modulus, with $C$ the single-bridge constant and no cross-term inflation. The bound is *tight*, reaching equality where the per-axis error extrema align — which independent axes permit — so there is no separate composed constant to optimize: amplification adds, approximation is per-layer, and their product is the additive per-axis Jackson–Lebesgue bound. This holds within composition's range, the low-rank (sum-of-separable) class; a target outside it carries an irreducible residual equal to its distance from that class, which is the product grid's business (§12), not a defect of the bound. *Structural fact (demonstrated):* joint keyframe control across drivers requires an identical leaf grid ($N_C = N_O$), since the odd-dyadic leaf sets at unequal resolutions are disjoint (§14) and divisibility does not help; the composition is otherwise exact as evaluated and band-limited to the finer driver's grid. The claim is that composition is a distinct combination mode — bridges driving bridges — the low-rank companion to §12's product grid, cheaper in atoms *and* gentler in amplification ($\sum$ against the grid's $\prod$ on both counts), covering articulated and layered content the product torus would represent far more expensively.

---

## 13. The bridge as harmonic analysis on connected LCA groups

The tensor extension to $T^d$, with $\arctan$-compactification of unbounded coordinates, reaches a precise class: the connected locally compact abelian Lie groups, which by Pontryagin's structure theorem are exactly $\mathbb{R}^n \times T^m$. The bridge identity is the operational form of Pontryagin duality on this class. Duality pairs $T \leftrightarrow \mathbb{Z}$, $\mathbb{R} \leftrightarrow \mathbb{R}$, $\mathbb{R}^n \times T^m \leftrightarrow \mathbb{R}^n \times \mathbb{Z}^m$; the bridge on $T$ is the operational duality between the bounded arc and the integer modes, truncated to finite resolution by rung depth, and the kernel $K_N$ is the spatial inverse Fourier transform restricted to the truncated dual lattice. The tensor step carries it to $T^d \leftrightarrow \mathbb{Z}^d$; the cosine projection and Setting H carry the $\mathbb{R}$ factors.

In the framing this is uniformity's payoff stated in standard language: *a homogeneous group has a Fourier transform.* The circle is the homogeneous object the closure produced, and harmonic analysis is what homogeneity buys. The identity is verified at machine precision on every case tested with $n + m \leq 4$ — pure tori $T^d$ ($d \leq 4$), pure $\mathbb{R}^n$ via arctan ($n \leq 4$), and mixed $\mathbb{R} \times T$, $\mathbb{R}^2 \times T$, $\mathbb{R} \times T^2$ — with bridge reconstruction equal to truncated Fourier reconstruction on bandlimited content and DFT-recovered coefficients matching the source to $\sim 10^{-15}$. Outside the class — spheres $S^{\geq 2}$, hyperbolic and projective spaces, non-abelian groups — the native bridge does not apply: a sphere is not a product of $\mathbb{R}$ and $T$ factors, so duality does not transfer, and a lat/long chart fails at the poles where chart and manifold topologies disagree (errors growing as $1/\theta$, persisting at any $N$).

---

## 14. Multiresolution refinement

Refining $N \to 2N$ (one finer rung) adds atoms between the existing ones and leaves the coarse representation undisturbed; the per-rung residuals are exact at every level and concentrate energy by scale. This verified multiresolution property is, for the resolution ladder, exactly the periodic Shannon multiresolution analysis: nesting $V_N \subset V_{2N}$, the periodic-sinc (ideal half-band) refinement filter, mutually orthogonal octave detail spaces, complete round-trip to machine zero. So the round-trip exactness *is* MRA completeness. (The companion note *Two Ladders, Two Transforms* separates this resolution ladder from the value-scale ladder $\lfloor\log_2|x|\rfloor$, which is Mellin-harmonic rather than an MRA; a value-scale Mellin-wavelet overlay remains open and distinct.)

The refinement *identity* is now in hand, and with it the upgrade to a multiresolution analysis in the precise sense. The two-scale relation is exact with closed-form coefficients: $K_N(\varphi) = \sum_j h_j\,K_{2N}(\varphi - \theta'_j)$ with $h_j = K_N(\theta'_j)$ — the coarse kernel sampled at the fine odd-dyadic nodes — verified to machine precision ($\sim\!10^{-15}$). The detail spaces are clean: $W_N$, the orthogonal complement of $V_N$ in $V_{2N}$, has dimension $N$, is orthogonal to $V_N$ and mutually orthogonal across scales ($W_N \perp W_{N'}$), both to machine precision, and occupies exactly the octave frequency band $N/2 < |m| \leq N$ — with the boundary frequencies $N/2$ and $N$ carried at *half weight*. That half-weight is the kernel's top-mode subtlety (§4.1); it is not an obstruction but the mechanism: splitting each boundary frequency evenly between the two spaces it borders is precisely what lets the octave bands tile orthogonally. So nesting, exact two-scale coefficients, and clean mutually-orthogonal octave detail spaces all hold — the periodic Shannon MRA in the strict sense, on the forced odd-dyadic grid.

One distinction remains, and it is the demo's editing limitation in exact form. The clean detail decomposition uses the *orthogonal* projection onto $V_N$: the refinement residual of the orthogonal projections lands entirely in $W_N$ ($\perp V_N$ to $\sim\!10^{-16}$). The bridge's *native* operator, though, is interpolation at the nodes — exact at the atoms, but an *oblique* projection onto $V_N$, not the orthogonal one — so the interpolation residual carries a $V_N$ component and does not lie in $W_N$. The MRA is therefore complete as a decomposition of the spaces; what the bridge supplies natively is the oblique, interpolatory projection rather than the orthogonal one. To carry an edit at one scale without disturbing the others — a per-rung detail layer — is to decompose by the orthogonal projection into these now-explicit detail spaces, not by raw interpolation.

In the slope form of §11 the refinement has an algebraic face: $N \to 2N$ raises the Cauchy power, $(1+s^2)^{\lfloor N/2\rfloor} \to (1+s^2)^{N}$, narrowing the kernel's peak (effective width $\sim 1/N$). The presentation *concentrates* with depth — each atom's influence draws in toward its own neighborhood — so the reverse map, global over the held leaves at any finite depth, localizes as the resolution climbs. It does not, however, acquire compact support: the kernel keeps a $\sim 1/s^2$ tail, so the global reach over the held leaves persists at every finite $N$ and full locality is reached only in the limit. What depth buys is concentration, not locality; the reconstruction is bounded ($O(K)$) and slope-side throughout, and the held-circle reach it requires is the held set itself — never the projected system's extent (R5).

The rendered demo (§16) exhibits this distinction concretely. Its level-of-detail keeps the painted signal at full resolution and band-limits a copy for display, so changing the viewing depth is non-destructive — the multiresolution *property*, realized: coarsen and refine and the signal returns intact. But editing while coarsened writes through to the one stored signal, overwriting finer detail in that region, because the demo reconstructs by interpolation (the oblique projection) and carries no separate orthogonal detail layer to hold an edit at its own scale. The detail spaces and two-scale coefficients are now supplied above; what the demo lacks is their use — the orthogonal decomposition rather than raw interpolation. The demo's single limitation and the theory's single residual are the same thing: oblique interpolation where the clean per-rung layering wants the orthogonal projection.

**One sharpening, because the prose above and in §5.3 and §8 invites a reading the geometry
does not support.** `[clean, verified, August 2026]` The *spaces* nest — $V_N\subset V_{2N}$,
stated correctly above and the whole basis of the MRA. The *node sets do not*. Depth $d$ sits
at odd multiples of $\pi/2^{d+1}$ and depth $d+1$ at odd multiples of $\pi/2^{d+2}$, so the
coarse lattice lands on the fine one's **even** multiples: the two are disjoint by
construction, with zero positions in common at every depth measured ($4\to8$, $8\to16$,
$16\to32$: $0$ shared, $0$ shared, $0$ shared). The half-shift that buys the even-$N$ kernel
and its clean partition of unity is exactly what costs the subset property an unshifted grid
would have had.

So §5.3's *refining adds atoms between the existing ones and leaves the depth-$d$
representation undisturbed* is true in both of its clauses and in neither of the senses a
reader will supply. The atoms do interleave; the coarse representation is undisturbed as
data and exactly representable at the fine level, which is $V_N\subset V_{2N}$. What does not
happen is the cheap thing: **the coarse readings cannot be kept and appended to.** Every
refinement re-reads the content at $2N$ new positions, or computes them from the coarse
coefficients through the two-scale relation given above — which is why that relation is
machinery rather than ornament. Proposition 5.2 is a statement about the doubling map
$\theta\mapsto2\theta$, which is a map and not an inclusion, and the proof is careful where
the prose around it is not.

The bill is a transform per octave, not an append per octave, and it lands on §16: *approaching
the circle synthesizes rungs octave by octave* describes a resample at each rung, not a
filling-in of gaps between readings already taken.

The MRA claims this section makes are tabulated in Appendix B.4, including the oblique/orthogonal
distinction of the preceding paragraph measured at $10^{-2}$ against $10^{-17}$.

`[refutable by]` any depth $d\ge0$ at which the depth-$d$ and depth-$(d{+}1)$ leaf lattices
share a position.

---

## 15. Extensions and open questions

### 15.1 Content-class extensions

Additional source types enter through the same rung structure, the observer being unable to know which the projection is of. The theorem operates on the projected content regardless; the photograph-row case (non-periodic content read by the periodic kernel) is verified — PSNR $\approx \infty$ at the atoms for $N = 16,\dots,256$, with the row's wrap point read between atoms as a bandwidth horizon, and the open-axis cosine kernel the topology-matched instrument.

**Discontinuous content: the jump is a primitive, not signal** (Jul 2026, `t3_silhouette.js`). Contested at equal floats, one bridge swallowing a jump pair never converges in sup — Gibbs pins it at $O(H)$, RMS $\sim 1/\sqrt N$ — while extracting the jump as a primitive (location pair + height, 3 floats) and bridging the smooth residual is machine-exact at every size (8e-15 at 15 floats against 0.75 at 16: fourteen orders). Policy: discontinuities are topology events carried explicitly; the bridge carries only what it is exact on — the same division that put the horizon in the chart rather than the signal. The localization tolerance has a closed form, measured exact: position error $\varepsilon$ costs $\mathrm{RMS} = H\sqrt{\varepsilon/\pi}$, while sup inside the mislocated sliver is irreducibly $H$ — jump accuracy is an area-court quantity. One instrument flag carried with the result: the ringing-detector envelope constant $0.1411\,H/(\pi x)$ under-predicts measured contamination by $\approx 2.5\times$ (the $1/x$ shape confirmed).

### 15.2 Higher-dimensional content (the open fork)

The separable extension (§12) covers product tori, the *easy* case. (§10.4 sets
this ladder apart from the $\pi/2 \to \pi \to 2\pi$ doubling of §10; they are
different axes, and the extents belong to the second while the ratio count
belongs to this one.) The hard case is content on a non-product manifold — a sphere $S^{\geq 2}$, whose directions do not factor into circles. This rests on the directional measure of the foundational §9 (the multivariate Cauchy as uniform measure on the sphere of directions) and on a genuinely open question: **what manifold a higher-dimensional observer's directions close into.** A 3-space observer's pointing is two ratios — a point of the directional manifold, dimension two, not three — and the fork is $S^2$ versus $\mathbb{RP}^2$: oriented rays or unoriented lines, whether the observer identifies a direction with its opposite. The 1D case is degenerate ($\mathbb{RP}^1 \cong S^1$) and cannot decide it; the forward-facing atom (angular extent $\pi/2$, one-directional) is the real tension. Spherical harmonics are the natural $L^2(S^2)$ basis but presuppose the global sphere, so they are not a bounded-observation instrument. Assuming a uniform sphere from the outset would commit the error the framework exists to avoid — the manifold must be forced by the observer's finite budget, not assumed.

**Resolution (Jul 2026, conditional; the forcing chain, each link at its grade).** The fork was put to the Lebesgue functional — the budget's own cost — through a chain of reformulations, each forced by a negative result (full record: §15.3 and `invariance_findings.md`):

1. *The signature is the $l{=}1$ band* (derived). The 2D analogues of the Möbius boosts are the gradients of the degree-1 spherical harmonics; $\mathbb{RP}^2$'s spectrum is even-degree only — it has no $l{=}1$ band, its would-be boost fields are antipode-even and do not descend, and $\mathrm{Conf}(\mathbb{RP}^2)=\mathrm{SO}(3)$ against $\mathrm{Conf}(S^2)=\mathfrak{so}(3,1)$.
2. *Nullity lives in the deficiency* (measured + two-ladder law, §15.3). Complete (fixed-space) schemes have no null rung at any mode; the invisible direction of the deficient scheme buys exactly one ladder rung, and the Möbius directions sit in the seat it vacates. Monolithic spherical schemes — including exact-cardinal zonal schemes constructed on polyhedral orbits — cannot reproduce the codimension-1 deficiency pattern ($\mathrm{SO}(3)$ has no scalable finite family; the circle's grid is $\mathbb{Z}_N \le \mathrm{SO}(2)$), and their boosts measure as cones. Every construction that *preserves* the gauge is the nested one: the product torus, per-axis deficiency 1, loop-algebra null cone. **Hypothesis link, named:** the budget's null-cone requirement selects the circle-of-circles (pan × tilt, nested 1D apertures) over any monolithic spherical read.
3. *The fork in native machinery* (theorem-grade topology). Neither $S^2$ nor $\mathbb{RP}^2$ is a quotient of $T^2$ at all ($\chi$ obstruction); $S^2$ is $T^2/\sigma$ with the two polar circles *collapsed* — the surveyor's completion of the observer's torus, not an identification the observer makes — where $\sigma$ is the lat-long deck involution, and the antipode lifts to a second involution $\tau$, so $\mathbb{RP}^2 = T^2/\langle\sigma,\tau\rangle$ plus the same collapse. The fork becomes: does the budget quotient by $\langle\sigma\rangle$ or $\langle\sigma,\tau\rangle$?
4. *The parity discriminator* (theorem-grade, two lines, checker-verified). For any tilt-first-harmonic field $w=\{\cos,\sin\}(2\beta)\cdot f(\alpha)$: $\sigma$-equivariance forces $f(\alpha+\pi/2)=-f(\alpha)$, $\tau$-equivariance forces $f(\alpha+\pi/2)=+f(\alpha)$. Jointly impossible: **no tilt-Möbius field of any modulation survives the $\mathbb{RP}^2$-type identification** — $\tau$ annihilates the entire tilt gauge, not merely the three global boosts. The $\sigma$-quotient retains the modulated family and the unmodulated global conformal boost.
5. *The measurement* (quotient bridges, factorized evaluator, $N=16\to24$). On the $\sigma$-quotient the global conformal boost is asymptotically null ($|A|: 0.205\to0.095$, excess straddling zero); cones grow; rotations exact.

**Verdict, in conditional-theorem shape:** if the observer's direction space is the quotient of its nested-aperture torus, and the budget requires Möbius gauge on each aperture, then the identification is $\sigma$ alone and the completion is $S^2$ — *forward-facing rays, not unoriented lines*, excluded not by taste but because $\tau$ is incompatible with any tilt-Möbius field. The named hypothesis links (nesting-selected; per-axis gauge required) remain the conditions. The dissolution is part of the result: the round direction sphere is the *unoccupied limit* of the observer's $T^2/\sigma$ — the poles, where pan content degenerates, are collapsed only in the surveyor's completion. The manifold was not assumed; the budget's deficiency pattern was derived, and $S^2$ is what it closes on.

### 15.3 Optimality: the local variational characterization, and the test record

The optimality question has moved from open to partially answered, and this subsection is also the **record of the stress tests already run** — their scripts, results, and kills — so they are not repeated.

**The result.** Beyond the §7.4 order-optimality, the forced grid now has a *local variational characterization*: it is a critical configuration of the Lebesgue functional whose structure recovers the framework's own objects. Perturbing the node set $\alpha_k + \tfrac{x}{N}d(\alpha_k)$ and decomposing the displacement field $d$ over Fourier modes $\sin/\cos(2m\alpha)$, the first variation of $\Lambda$ (per unit $x = \delta_{\max}N$, at midpoint $\varphi^*$) is, in the $N\to\infty$ limit:

$$G_m(\varphi^*) = \frac{4}{\pi}\,H_{\mathrm{odd}}(m{-}1)\cos(2m\varphi^*), \qquad H_{\mathrm{odd}}(n)=\!\!\sum_{\substack{l\ \mathrm{odd}\\ l\le n}}\!\frac1l,$$

with finite-$N$ law $\sup_{\varphi^*}|G_m(N)-G_m^\infty| = \tfrac{4}{\pi}\tfrac{m}{N}$. Three consequences. *(i) The null cone of the first variation is exactly $\mathfrak{sl}(2,\mathbb{R})$* — rotations ($m{=}0$) exactly null, the two Möbius boosts ($m{=}1$) asymptotically null at rate $A_1(N)=\tfrac{4}{\pi N}=\tfrac{2\psi_1}{N}$ (six digits at $N{=}1024$), every $m\ge2$ mode costing at first order. The Lebesgue functional — surveyor mathematics, carrying none of this framework's premises — has the tangent's own algebra as its degeneracy structure, the first check on the framework that runs *backward* from a classical functional rather than forward from the axioms. *(ii) The exact symmetry group of $\Lambda$ is the isometry group $O(2)$* — rotations and the reflection (the swap) fix $\Lambda$ to $10^{-13}$; every non-isometry moves it — the same group whose rotation part forces the Cauchy (foundational §4, §9.5): one group selects the measure and prices the reconstruction. *(iii) The cone spectrum is the square wave's odd-harmonic ladder in $\psi_1$ units*, $A_m \sim \tfrac{2}{\pi}\ln m$: the three appearances of $\psi_1$ in the cost landscape — leading $\Lambda_0$, the boost rate, the spectrum — trace to a single source, the odd-harmonic content of the Lebesgue extremum's sign pattern through one Dirichlet integral. Derivation and proof in the companion note (*The cone spectrum of the Lebesgue functional at the forced grid*): exact first variation at the uniform point (interpolation matrix $=I$ by node-exactness; moving-span correction from the one invisible direction $\sin(N\varphi)$ of the kernel-translate span), sensitivity kernel $f(t)=\operatorname{sgn}t-\tfrac2\pi\cot t\ln|\cot t|$, closed form via the modified-Dirichlet telescoping — the kernel's own shape reappearing inside the proof — and $\int_0^\pi\sin(ru)/\sin u\,du=\pi[r\ \mathrm{odd}]$. Grade: working-paper — two interchange steps (aliasing tail, near-field passage) verified numerically at $2\times10^{-6}$, not analytically bounded. *Global* optimality (the minimal Lebesgue constant over all schemes) remains unclaimed and open, as before.

**The test record (July 2026; scripts `invariance_harness.js`, `sweep2.js`, `modeSpectrum.js`, `refine.js`, `firstvar.js`, `a1limit.js`, `a2limit.js`, `verifyderiv.js`; log `invariance_findings.md`). Do not re-run; extend.**
*Verified:* trig-free slope-form kernel $K=\hat B\,U_{N-1}(\hat B)/N$ with constructible (bisection + Möbius-addition) grid, drift $\le1.8\times10^{-15}$, zero trig calls through $N{=}1024$; $\Lambda_0$ fit $0.63649$ vs $\psi_1=0.63662$ ($-0.02\%$); conjugation invariance across the warp family with the injectivity-at-precision boundary (§12 above); substitution detonation with Spearman(gap-CoV, $\Lambda$) $=0.95$; $O(2)$ symmetry of $\Lambda$; first-variation formula verified pointwise against finite differences at $10^{-8}$; cone spectrum and $\tfrac{4}{\pi}\tfrac{m}{N}$ law as above; modes add ($\Sigma$, not max; combo test 2.5%).
*Killed en route (do not resurrect):* the $\pi/2$ asymptotic-exponent candidate for the detonation (pre-asymptotic transient); the $2/3$ value for the boost's quadratic coefficient (finite-$N$, finite-$x$ artifact; the extrapolation gives $0.637\pm0.002$, i.e. $\psi_1$, still conjecture pending the second variation); the exact-at-finite-$N$ sl(2) identity (false — the residue is a bounded oscillation, $\sup=4/\pi$, now the derived rate law); and note the Möbius and sine warp families are *first-order identical* ($\Phi\mapsto\Phi-2a\sin\Phi+O(a^2)$), so any two-family "universality" claim needs genuinely distinct harmonic content.
*Open on this thread:* second variation $\Rightarrow$ $c_1=2/\pi$; analytic bounds for the two interchanges (working-paper $\to$ proof grade); closed form of the $O(m/N)$ correction profile (the signed finite-$N$ drift of the maxima is *not* $\pm\tfrac4\pi\tfrac mN$); a localized-displacement family (single node) to separate sup-norm from mean-square scaling; and the export: the null-cone probe as a candidate mechanism for *forcing* the higher-dimensional manifold (§15.2) — compute the 2D reconstruction cost's degeneracy algebra on $S^2$ versus $\mathbb{RP}^2$ and let the functional decide the fork.

**Composition addendum (Jul 2026; script `compose_tests.js`).** *New:* the $K_W$-evaluation result now in §12.5 — in-band windows give $K_W$ = designed overlap exactly; out-of-band windows self-inflate it (Gibbs $\approx1.13$ pointwise; worst case the support-restricted Lebesgue factor, $\psi_1\ln2$ per support doubling, $2.03\to2.98$ measured, flat when the support leaf count is pinned). *Replication, not new:* the same script's T1 (global PoU pass-through, $\sup|\Sigma K - 1| = 10^{-14}$–$7\times10^{-12}$, $N_S$-independent) and T2 (separated flat / stacked linear, six digits) re-measured what §12.5 already recorded as confirmed — a directive violation caused by not re-reading §12.5 before testing; the replication agreed with the prior record in full, and this entry exists so it is not run a third time. *Caught and killed in external drafting (do not resurrect):* a proposed "conditional Hinge Theorem" that would have replaced the unconditional $R_j$-based bound with a weaker conditional one; a $K_W\cdot\sup|w|$ double-count; fabricated test provenance (three nonexistent script names, an unrun $N_O{=}32$ oscillation, an unperformed slope fit, a mis-sweeps range). *Economics (the gate, now run; Jul 2026, script `lbs_test.js`):* composed bridges against an **oracle** linear-blend rig (true pivots and weights, budget only in vertices and keys) on dense smooth-skinned articulated truth, equal float budgets, scored off-grid. On pure articulation the rig wins the coarse regime 2–3× per float, as it must — the keys are the generative model — with **crossover ≈ 500 floats**, beyond which the bridge's spectral convergence beats the rig's quadratic polyline/lerp floors (3× lower RMS at 30% less cost by ~700 floats); the bridge's entry fee is rank (~4 modes per component for rotation-with-blend; under-ranked configs plateau independent of resolution). On articulation **plus a traveling ripple, the rig saturates permanently** (RMS pinned at 7.3e-3 from 294 to 1030 floats — deformations outside the bone class cannot be bought with vertices or keys) while the bridge converges past it from ~220 floats. So the economic claim holds in this form: *the heuristic wins coarse budgets on its own model class; the theorem wins by convergence rate at moderate budgets even there; and wherever content leaves the bone class, the heuristic has a ceiling and the bridge does not.* Caveats carried: linear (not spline) keys; the bridge ran the generic rank-R encoder, not the structural window-plus-phase composition native to traveling detail; one 2D content family; raw float counts. *The structural encoder, since run (`structural_encoder.js`):* encoding traveling detail in sheared coordinates u = θ−vt (licensed by the shear family's exact cardinality, §15.3 T² record; velocity one float, correctly self-estimated) reaches RMS 1.45e-3 at 738 floats — 1.8× below the generic encoder at 23% less cost, 5× below the rig's ceiling. C2 final standing: rig 7.3e-3 (ceiling) · generic 4.0e-3 · structural 1.45e-3. *Still open:* joint (non-greedy) static/traveling fitting; spline-keyed rigs; a 3D instance.

**T² and quotient record (Jul 2026, sessions 6–13; scripts `t2_nullcone.js`, `t2_loop.js`, `t2_stagger.js`, `t2_dividend2.js`, `fixedspace_pretest.js`, `ladder_shift.js`, `derivefixed.js`, `sphere_fork.js`, `sphere_v2.js`, `t2_quotient2.js`, `qcell.js`; full detail in `invariance_findings.md`).**

*The T² null cone is the loop algebra.* Displacement fields on the product grid that are Möbius in the displaced axis with **arbitrary modulation along the other** are first-order null — $L\mathfrak{sl}(2,\mathbb{R})\oplus L\mathfrak{sl}(2,\mathbb{R})$, the current algebra of the 1D result (every tested $(1,n)$ cell pure quadratic; every $(m{\ge}2,n)$ cell a cone). Everything reduces via the **row-factorization identity** (proved + verified 8e-15): axis-aligned fields keep $V$ block-diagonal by rows, so $\lambda_2(\theta^1,\theta^2)=\sum_l |K(\theta^2-\alpha_l)|\,\lambda_1^{(l)}(\theta^1)$ — the 2D theory of axis-aligned deformations is the 1D theory, $|K|$-weighted. Cone coefficients obey the product law $A(m,0)=\Lambda_1 A_m^{1D}$ (0.5%).

*Shears and the staggering dividend.* Row shears (rigid per-row shifts $c(\theta^2)$) keep $V=I$ **exactly** and PoU exactly — an infinite-dimensional family of exact-cardinal grids — and strictly lower $\Lambda$: the aligned product grid is a saddle, not the 2D minimizer. **Floor theorem:** $\Lambda(c)\ge\mu_1\Lambda_1$ for every shear (sup $\ge$ mean), capping the dividend at $\psi_1=2/\pi$ asymptotically; the floor doubled as a lie detector, catching an under-resolved evaluator that reported below it. Best-known staggering: the **7/16-class rational ramp** (the golden-ramp reading was a coarse-search artifact — killed), dividend 21.7% at $N=64$, gap over the floor shrinking ($0.031\to0.027$); attainment of exactly $2/\pi$ open. Utility: quincunx/7/16-ramp shears are free, exactness-preserving prescriptions for 2D sampling.

*The two-ladder law (deficiency creates nullity).* Complete (fixed-space, odd-Dirichlet) schemes at the uniform grid have **no null rung**: $A_m^{\mathrm{fixed}}\to\frac{4}{\pi}H_{\mathrm{odd}}(2m{-}1)=A_{2m}^{\mathrm{moving}}$ (exact first variation matches FD to 0.2%; integral law to 1–2%; $\cos(2m\varphi^*)$ profile exact; the one-rung "ladder-shift" guess killed by the $m\ge2$ data). Against the bridge's $A_m=\frac{4}{\pi}H_{\mathrm{odd}}(m{-}1)$: one ladder, two entry points — **the invisible direction buys exactly one rung, and the Möbius null cone sits in the seat it vacates.** The deficiency of bounded observation and its conformal gauge are one structure. This voided fork probe v1 (fixed-space spherical interpolation — blind to the signature by design) and dictated v2's construction: exact-cardinal **zonal schemes on polyhedral orbits** (association-scheme weight solve, $V-I\le3\mathrm{e}{-15}$; icosahedron weights $(\pi/3)[1,1,1,3/7]$; the 6-line $\mathbb{RP}^2$ scheme near-perfect at $\Lambda_0=1.0043$) — whose boosts are cones, closing the monolithic route and forcing the quotient formulation now recorded in §15.2.

**Companion paper pointer (Jul 2026).** The 3D program — 3-space content as the third ratio on the direction torus $T^2/\sigma$ — now lives in its own working paper (*The Third Ratio*, v1) with the session 17–19 record: the forced tilt structure (uniform-and-square; the cos-tilt information conjecture killed; polar redundancy is exact degeneracy recovered by quotient and compression), the silhouette policy (the 1D core of which is folded into §15.1 above), and the stereo weld's first instance (the weld residual as a mutual error certificate; relative pose recovered $\sim$50× more precisely than either reconstruction). Those results are *not* duplicated here; `invariance_findings.md` remains the full ledger.

*Kills this block (do not resurrect):* $\mathfrak{sl}(2)\oplus\mathfrak{sl}(2)$-only 2D null cone; golden-ramp optimality; the ladder-shift law $A_m^{\mathrm{fixed}}=(4/\pi)H_{\mathrm{odd}}(m)$; fixed-space fork probe v1 (instrument class, not tuning); two under-resolved evaluators (caught by the floor theorem and by rescoring). *Open:* $2/\pi$ staggering attainment; the 7/16 characterization (weighted discrepancy); $f_{\mathrm{fixed}}$ closed form; the mode-doubling derivation; nesting-selection nonexistence proof; the modulated tilt gauge on the $\sigma$-quotient (measured ambiguous).

**Slope-chart record (August 2026; scripts `verify-slope.mjs`, `recheck.mjs`, `cond.mjs`;
instrumentation replaces every trigonometric entry point on `Math` with a counter before the
run, so the zero-trig bar is measured and not asserted. Do not re-run; extend.**
*Verified:* the $\lfloor N/2\rfloor$ parity correction to §11's slope form ($2.7\times10^{-2}
\to5.6\times10^{-16}$ at $N=33$); the cascade-generated lattice at $N=2^m,\,3\cdot2^m,
\,5\cdot2^m$ agreeing with the tangent construction to $\le3\times10^{-15}$ in the arc through
$N=2048$ with $0$ trigonometric calls; end-to-end reconstruction ($N=128$, $512$ queries,
lattice from scratch) at $0$ trigonometric calls; angle/slope reconstruction agreement
$\sim10^{-14}$ at both parities through $N=1024$; the antipode exact to $10^{-15}$ once both
ends of the composition are given addresses (§11.2); leaf-lattice disjointness across depth
(§14); the renormalised $K$-window error floor (§16).
*Killed en route (do not resurrect):* **the conditioning claim.** The slope chart is not
better conditioned than the angle chart and the temptation to argue it there should be
dropped — partition of unity, $|\Sigma K-1|$, angle against slope: $1.0\times10^{-14}$ vs
$4.1\times10^{-14}$ at $N=1024$, $9.1\times10^{-14}$ vs $6.5\times10^{-13}$ at $N=4096$,
$1.3\times10^{-13}$ vs $1.3\times10^{-12}$ at $N=16384$. Binary powering accumulates through
$\log N$ complex multiplies and the Möbius composition has its own cancellation; the slope
form runs five to ten times looser and this is expected rather than a defect. The chart's case
is structural — what is manifest, what is generated, what needs no completed total — and it is
strong enough not to need a numerical claim that does not hold. Also killed: the textbook
half-angle $(\sqrt{1+t^2}-1)/t$ as the bisection step (§11.1).
*Open on this thread:* whether a slope-side weight-matrix cache closes the throughput gap as
the arithmetic says it must — the weights depend only on $(i,k,N)$ in either chart, so after
the matrix exists neither chart runs, and the standing "the slope form is slower" comparison
is between a cached implementation and an uncached one; seeds beyond $3\cdot2^m$ and
$5\cdot2^m$ (the remaining Fermat products) if any application wants them.

### 15.4 Connections

The apparatus admits two dual algebraic organizations (arc-side Fourier/bridge for periodic content, chord-side Chebyshev for non-periodic), and the bridge connects to the other framework results through the shared geometry (TNS arithmetic, SR velocity, TVF sampling). The cone spectrum gives TVF a derived error budget: slowly-varying (Möbius-shaped) drift of the leaf lattice is second-order harmless; mode-$\ge2$ jitter costs first-order at $\tfrac4\pi H_{\mathrm{odd}}(m{-}1)$ per unit $\delta_{\max}N$; node collision is the wall.

---

## 16. The bridge rendered

An interactive demo displays the theorem directly. The bounded observer's number line — the looping tangent coordinate $x = \tan\theta$ — sits above its virtual circle, the two coupled by $\varphi = 2\theta$ (§10): panning the line rotates the circle, and the line's point at infinity sits at the circle's antipode. On the circle the two maps are made tangible — an atom value is painted at a leaf and the kernel $K_N$ fills the presentation continuously, exact at the leaves and controlled between; loading a continuous $F$ (band-limited, Lipschitz, discontinuous) shows recovery, the modulus bound, and Gibbs at the bandwidth horizon; a kernel-superposition view shows the individual $c_k K_N$ summands, and the constant load confirms the partition of unity $\sum_k K_N = 1$ (§4.2) to $\sim 10^{-15}$.

Depth is driven on demand by viewing distance: approaching the circle synthesizes rungs octave by octave, retreating releases them, and a rung ladder shows which octaves are live. This renders §7 literally — cost tracks the depth viewed, not the detail that could exist; the observer holds only the rungs in view and never knows how many it could hold. The Lebesgue amplification the view pays is $\psi_1 \ln K$ — set by the leaves actually in view, not the completed $N$ — climbing by $\psi_1 \ln 2$ per rung as the ladder fills, and reaching the $\psi_1 \ln N$ of §7.4 only in the limit the observer never occupies. Zooming is non-destructive: edits are stored at full resolution and the view band-limits a copy, so retreating and returning restores detail exactly — the multiresolution nesting of §14, with the editing limitation noted there.

A worked $n = 2, m = 0$ case (a flat rectangle on $\mathbb{R}^2$ via the chord projection, leaves at Chebyshev-I nodes, reconstruction by tensor-product barycentric Chebyshev interpolation) is realized as a relief sculptor — a plane authored by displacing leaves into a 3D form — on the same kernel infrastructure as the framework's other demos. (Engineering detail belongs to the TVF specification.)

**What the $\psi_1\ln K$ of the preceding paragraph does and does not promise.**
`[clean, verified, August 2026; and it is the other half of a result the companion measures]`
*The Observation Atom* §27 windows this paper's own kernel to $K$ leaves, renormalises, and
measures the amplification: $\Lambda_K = 1.0000,\,1.4142,\,2.2219,\,3.0352,\,3.8860,\,4.4927$
at $K=1,3,9,33,129,513$, an increment of about $0.42$ per doubling against the published
$\psi_1\ln2 = 0.441$. Its reading — *the growth law is not $\log N$, it is $\log$ of the
support; the Lebesgue constant is a tax on reach* — is this paper's §16 sentence arrived at
from the other side, and it is right.

The half that table does not carry is what the window costs in *agreement*. Windowing an
$N=512$ grid on organic content and measuring against the full read, in units of a $200$-unit
figure:

| support $K$ | bare truncation | renormalised |
|---|---|---|
| 3 | 8.07 | **0.400** |
| 9 | 1.06 | 0.427 |
| 33 | 0.423 | 0.416 |
| 129 | 0.344 | 0.344 |
| 257 | 0.209 | 0.209 |

Renormalisation is doing real work at small $K$ — two orders at $K=3$ — and it restores
partition of unity, without which the truncation is not an operator of this kind at all. What
neither column does is *converge*. The disagreement floors near $0.4$ and is still at $0.2$
with half the grid in hand; the kernel's $\sim1/s^2$ tail (§14) carries content that no amount
of window recovers short of the whole. **Cutting the tails cuts the logarithm and does not cut
the error.**

That is not a defect, and reading it as one is the mistake this note exists to prevent. The
windowed read is a *different operator* — cheaper, better-amplified, exact at its own
nodes — and not an approximation of the full one converging on it from below. Which is (R5)
and §1.2's closure, stated as a measurement rather than as care about what an observer may
know: the observer closes $K$ into **its own** virtual circle, a $K$-circle and not a window
on an $N$-circle, and the $\psi_1\ln K$ it pays is the amplification of the object it
actually holds. The framework's insistence on that distinction has usually been read as
epistemic scruple. It is load-bearing: the windowed-on-the-$N$-circle reading has an error
floor that more $K$ does not remove, and the self-contained $K$-circle has none, because its
error was never an approximation residual.

Appendix A.6 supplies the mechanism the paragraph above assumes — the local humps are $O(1)$ and the
$\ln N$ lives in the tails — and Appendix B.6 executes the same split pointwise, so a window buys
amplification and not accuracy.

`[refutable by]` a renormalised $K$-window of the leaf kernel whose disagreement with the full
read falls below the floor above as $K$ grows, at fixed $N$ and non-bandlimited content.

---

## Conclusion

The Tangent Bridge is the foundational thesis made formal: *bounded observation is discrete geometric atoms presented continuously on the observer's virtual circle.* The observer's holding is discrete because it is bounded — a finite hold, finitely many atoms, each read in fixed work with no knowledge of how many there are (R5). Its presentation is continuous and exact because the circle is uniform — the atoms lock to it, agreeing with no error and bounded between (R1–R4). Discrete and continuous are not approximations of each other; they are one object, the holding and the showing, met exactly at the atoms.

Two roots carry the whole theorem. Boundedness makes a bridge possible: a continuous signal on an unbounded domain cannot be carried by a finite address, and only because the observer's domain is compact does finite recovery exist at all. Uniformity makes the bridge exact: a circle is uniform by definition, and a uniform grid on a uniform domain reconstructs exactly at its nodes. The classical interpolation machinery — the Lebesgue–Jackson bound, the Chebyshev correspondence, Pontryagin duality — is the metric the circle supplies, and the framework's contribution is the recognition beneath it: the leaves are the atoms, uniformity is why they lock, boundedness is why a bridge exists, and the forced grid meets the universal floor that binds every scheme of its rank, with leading coefficient $\psi_1 = 2/\pi$. The set defines the holding; the circle completes it into the presentation; the bridge is the exact account of the one object in its two expressions.

---

*The appendix below is the one the companions cite. It was recovered from `tb_classical.md`,
an earlier draft of this paper that carried it; that draft's body is superseded by this one
(it predates the Convention block of §1, §6.6, and §10.5), so the appendix is carried
forward and the body is not. `[recovered, August 2026]`*

## Appendix A. The inversion: classical approximation theory from the observer's constraints

The body of this paper proves the Tangent Bridge using classical approximation theory — the Lebesgue–Jackson bound, the Chebyshev correspondence, Bernstein's inequality — as established scaffolding. This appendix runs the arrow the other way. It asks which of those classical theorems can be *derived from the bounded observer's own constraints* — the forced operation set, the finite hold, the round-trip identity (R1), order-without-sum — and which are irreducibly the surveyor's. The result is a clean factorization: the **constructive** half of approximation theory falls out of the observer's constraints, while the **variational** half (completed infima, completed limits, quantifiers over all schemes) does not, and the seam between them is an object the framework already names — the bandwidth horizon of §6.3.

Every quantitative claim below was verified numerically before being stated; the grades are honest, and two results that a first pass advanced to full grade are recorded here as rejected, because the discipline of the inversion is the reason to trust its positive results. Grades: **[proved-O]** an observer-grade proof from the forced constraints; **[verified]** numerically confirmed, proof route named but not fully written; **[S-classified]** provably the surveyor's, with the observer's replacement identified; **[open]** attempted and not closed.

### A.1 Near-best approximation — Lebesgue's lemma `[proved-O]`

The classical lemma $\|f - Pf\| \le (1+\Lambda)\,\mathrm{dist}(f,V)$ for a projection $P$ fixing $V$ uses exactly three things the observer has: the round-trip identity (R1) — the presentation reproduces held content, $\Psi_d\Phi_d = \mathrm{id}$ on the held span, which is this paper's own theorem and not an import; the triangle inequality — composition and order on held magnitudes; and the supremum read as an order test — the largest held value, no integral. For any $g$ in the hold's span, $f - \Psi f = (f-g) - \Psi(f-g)$, whence $\|f-\Psi f\| \le (1+\Lambda)\|f-g\|$; the bound holds for *every* $g$ the observer can name, which is the observer-usable form and needs no best approximant. This is the observer's native error theory: exact on what it holds, at most $(1+\Lambda)$ times worse than a best it never computes.

### A.2 The logarithmic growth law $\Lambda_N \asymp \log_2 N$ `[proved-O]` (form; constant declined)

That the Lebesgue constant grows logarithmically is forced by the cascade's self-similarity, by an argument using only order tests at each depth. Writing $N = 2^d$, the single-rung increments $\Lambda(2N) - \Lambda(N)$ are bounded **above** by the base rung cost $\Lambda(2)$ (each refinement adds no more than the first) and bounded **below** by a fixed positive constant (they settle to $\psi_1\ln 2 > 0$, they do not collapse). Telescoping between the two bounds gives $\Lambda(2^d) \asymp d$, i.e. $\Lambda_N \asymp \log_2 N$ — two-sided, from order alone. *Why logarithm:* each rung is the same act at half scale, and same-act-per-rung accumulates linearly in depth, hence logarithmically in count. The most familiar asymptotic in interpolation theory has its functional form fixed by dilation symmetry; only its coefficient $\psi_1\ln 2$ requires the completed circle and is the surveyor's evaluation.

A stronger, *direct* form of the lower bound holds on the forced lattice. At the Lebesgue-function peak the contributions decompose over dyadic shells of leaf-distance, and each fully-populated shell carries a near-constant mass; the profile is stationary, doubling $N$ inserting exactly one interior shell and fixing the rest. Hence
$$\Lambda_N \;\ge\; c_0\,(\log_2 N - O(1)), \qquad c_0 \;=\; \psi_1\ln 2 \;=\; 0.44127\ldots,$$
the logarithm exhibited as log-many heavy shells, summed by the observer's native banding. This is stronger than the telescoping form, which infers growth from the increments' settling; the shell bound exhibits the growth directly. (It is a lower bound for the observer's *own* lattice; it does not quantify over other node systems — see A.6.)

**The two forms share one constant, and that is the content.** This paragraph and the one above it state a lower bound twice — once by telescoping increments that *settle to $\psi_1\ln 2$*, once by shells each carrying a fixed mass — and an earlier draft recorded the second constant as a measured $\approx 0.45$, which left the appendix asserting two bounds with two constants that happened to be close. They are not two constants. The shell mass converges on $\psi_1\ln 2 = 0.44127$ to five digits (measured; Appendix B.6, which also confirms it a second way: varying the window width shifts the hump term by $0.4365$ and $0.4400$, converging on the same value). So the increment-per-doubling and the mass-per-shell are the same quantity read in two decompositions, which is what one should expect the moment the profile is stationary — a shell *is* a doubling — and $c_0$ is $\psi_1\ln2$ rather than a numerical coincidence near it. That fixes A.2's constant at the same $\psi_1$ that §7.4 gives for the leading coefficient, §15.3 for the boost rate, and §16 for the per-rung cost of the ladder: one chord/arc constant, four appearances, and here it is the shell decomposition's.

### A.3 Aliasing and the sampling limit `[proved-O]`

That content above the hold's dimension folds down is pure dimension counting on the held lattice. Reads are rank-one functionals; the rank of the first $m$ reads is $m$; it saturates at $N$; the $(N{+}1)$-th read is in-band informationless. The alias identity itself is algebra on the lattice. No Fourier integral and no orthogonality over the completed circle enter — the observer proves the sampling limit by running out of independent reads. This is the counting content of (R5) read on the frequency side.

### A.4 The direct theorem — Jackson's estimate by squaring `[proved-O]`

The sharp direct estimate $E_N(f) \le C\,\omega(f,1/N)$ classically needs a *positive* approximation kernel; the interpolation kernel changes sign, and $\Lambda$ is the price of that. Positivity looks analytic but is the observer's cheapest property: a square is nonnegative, and squaring is a pair operation. The Fejér kernel is the squared magnitude of a geometric pair-sum, $F_n = |\sum_{k<n} z^k|^2/n$ — positive by construction, but its first moment scales as $\log n / n$ (yielding only $\omega\log$, not sharp). Squaring *again* gives the Jackson kernel $J = F^2$, whose first moment scales as $1/n$ — the property the sharp theorem requires. The moment bound is closed without an infinite sum: Jordan's inequality $\sin(\theta/2)\ge \theta/\pi$ (an order fact) majorizes the kernel by a rational tail, integrated over dyadic shells as a geometric series $\sum 2^{-3j} = 8/7$, summed by the observer's closed ratio. The sharp direct theorem is thus built from two squarings, one order inequality, and one geometric sum — all forced. Jackson's kernel is the pair algebra's favorite operation, doubling, performed twice: once for positivity, once for locality.

### A.5 Derivative control and the inverse theorems — Bernstein `[proved-O]`, sharp constant $1/2$

The interpolant's slope obeys $\|(\Psi v)'\|_\infty \le C\,N\,\|\Psi v\|_\infty$. In slope coordinates $\Psi v$ is rational, its derivative an explicit algebraic expression (field operations and the single square root); each leaf's derivative contribution falls off faster than $1/r^2$ with rung distance $r$; grouped by dyadic shells the contributions form a summable geometric series closed by the observer's ratio. The **sharp** constant is attained at the top-mode (near-horizon) input and equals exactly $1/2$ on the forced leaf lattice. Under the chart map $s=\tan\theta$ with degree $n = N/2$ (the lattice carries twice the degree in leaves), this maps to the classical Bernstein constant $1$ — the factor of two between the observer's leaf constant $1/2$ and the surveyor's degree constant $1$ being the same $2$ that appears in $\psi_1 = 2/\pi$. Bernstein's constant is one more place the factor of two between the hold and the angle surfaces.

Bernstein summed per rung inverts the direct theorem: the settling *rate* of the residual ladder recovers the smoothness *class*. This inverse map is **norm-dependent**, and its dependence recovers a structure this paper already owns. Measured settling exponents $\alpha$ in $E_d \sim 2^{-d\alpha}$: Lipschitz content gives $\alpha \approx 1$ in the supremum norm; a jump gives $\alpha = 1/2$ exactly in $L^2$ but $\alpha \approx 0$ in the supremum norm — the sup-norm error at a jump does not settle at all. That non-settling is Gibbs, the bandwidth horizon of §6.3: **the boundary of the sup-norm inverse theorem is the framework's own horizon.** The observer discovered the seam as the horizon where bounded-between (R3) stops improving; classical inverse-theorem theory encodes the same seam as the gap between $L^2$ and $L^\infty$. They are one fact, and the settling ladder is accordingly a two-norm instrument: $L^2$ reads the smoothness order, the supremum reads whether the content clears the horizon.

### A.6 What remains the surveyor's `[S-classified]`, and one open boundary

Several classical pillars are not observer-derivable, and the framework says why, which is itself a result. The **existence of the best approximation** is a completed infimum over $V$ — a global pass, a total the observer declines; its replacement is A.1, the interpolant within $(1+\Lambda)$ of a best never named. **Weierstrass density** is a completed limit, and here the observer's replacement rises to a proved statement in its own right `[proved-O]`. The residual ladder $r_d = \|f - \Psi_d\Phi_d f\|$, computed rung-by-rung from held atoms by (R1), is monotone nonincreasing in depth and settles to a floor; the completed existential "for every $\varepsilon$ there exists $N$" becomes the testable monotone process "refine until the residual reaches its floor." The floor carries the same norm dependence as the inverse theorem (A.5): it is $0$ in $L^2$ for all $L^2$ content — genuine density, witnessed rung by rung and never totaled — and $0$ in the supremum norm exactly for content that clears the bandwidth horizon of §6.3, settling to the Gibbs floor at a discontinuity. With that qualifier the replacement matches the classical theorem's scope precisely: uniform density is a statement about $C(S^1)$, the continuous functions, which are exactly the horizon-clearing content for which the sup-norm ladder reaches zero. The sup/$L^2$ split of the density witness is the same seam as the inverse theorem and the horizon — the observer's density is testable and constructive, and where it stalls it stalls on the framework's own boundary. **Equioscillation** characterizes the object the observer declines to construct. Each is the surveyor's by the same mark: a completed quantifier over unheld objects.

The **universal lower bound** — that *no* interpolation scheme, on any nodes, has bounded $\Lambda$ (the Faber–Bernstein envelope) — is on current evidence the surveyor's too, and this appendix leaves it **[open]** rather than claim it. The observer proves the lower bound for its *own* forced lattice (A.2, both the telescoping and the direct shell form). It does not quantify over other node systems, because it never constructs them; a universal statement over all schemes is a quantifier over objects outside the observer's operation set, structurally akin to the completed infima the surveyor owns. A proposed derivation from rank and gauge deficiency was tested and rejected: rank alone does not force supremum-norm growth (the $L^2$ projection has rank $N$ and Lebesgue constant exactly $1$ at every $N$), so a rank-and-deficiency argument, being $L^2$-flavored, cannot reach the $L^\infty$ envelope Faber asserts; and a proposed replacement via cardinal-function sign counts failed numerically (the cardinal function has two sign changes, not $N-1$). The universal envelope is therefore not claimed here. Whether it is observer-reachable or is genuinely the surveyor's is the sharpest question the inversion leaves open.

A third route, tested this pass, does not close the question but *localizes* it, and the localization is itself the progress. The universal bound admits a reduction into three steps, two of which are observer-side. First, $\Lambda_N = \max_x \lambda(x) \geq \tfrac12\int \lambda$, a value bounding its own average — the observer states this without constructing anything, since it is holding $\lambda$ and comparing it to its own mean (the $L^1$ read A.1 already uses). Second, $\tfrac12\int\lambda = \sum_k \tfrac12\int|\ell_k|$, linearity over the held basis functions, one per atom. Both are within the observer's court. The universal envelope therefore reduces to a *single* remaining step: the harmonic floor on the average, $\sum_k \tfrac12\int|\ell_k| \geq (2/\pi^2)\ln N + O(1)$ — a genuine theorem, and the whole of the residual difficulty. This is a sharper reduction than the two rejected routes reached: it is an $L^1$ (average) floor, not the $L^\infty$ envelope attacked directly, and it descends to a quantity — the average Lebesgue function — the observer can form from its held atoms, whereas rank-deficiency was $L^2$-flavored and the sign-count was numerically false.

What the reduction does *not* do is discharge that last step, and the reason is located precisely (`faber_step3.js`). The logarithm does not live in the local structure: the integral of $|\ell_k|$ over the gap adjacent to its own node is $O(1/N)$ and sums to $O(1)$ — the local humps, which *are* order-and-counting data (each $\ell_k$ vanishes at the other nodes and is $1$ at its own, forcing a hump of universally bounded area, measured $\geq 0.06$ even for random nodes), do not produce the growth. The $\ln N$ lives in the *tails* — $\ell_k$ far from node $k$, where the ratio products accumulate — and the tail's lower bound, in every proof this pass could construct, is extracted by a global $L^1$-duality (a conjugate-function argument), which is a completed dual object of exactly the kind the observer declines. So the honest status is unchanged in verdict but improved in resolution: the universal envelope remains **[open]**, still on current evidence the surveyor's, but the difficulty is now pinned to one question — *whether the harmonic floor on the average Lebesgue function is reachable by order and counting alone, or requires the conjugate function*. The local hump area is observer-side and insufficient; the tail floor is sufficient and, so far, only surveyor-reachable. That the entire gap reduces to the tail's $L^1$ floor is the progress; that the floor still calls a completed dual is why the claim is not made (`faber_route.js`, `faber_partition.js`, `faber_rigor.js`, `faber_step3.js`). A further pass sharpened *why* the dual is called, by trying to eliminate it. If the log-floor were concentrated at some order-identifiable location $x^\*$ — an edge, an outermost gap — the observer could bound $\lambda(x^\*)$ there by counting and take $\Lambda \geq \lambda(x^\*)$ directly, no integral, no dual. Three such single-point routes were tried and all refuted (`faber_gapmax.js`, `faber_finding.js`): evaluation just outside the interval is extrapolation blow-up, not the Lebesgue constant (a caught test error, not a bound); and the outer-gap midpoint and the outer-gap maximum are both driven below the $\ln N$ floor by an adversary positioning nodes so that *particular* point goes cheap (outer-gap max pushed to $\approx 1.0$ against a floor of $1.8$–$2.2$ at $N=16,32$). The pattern is uniform and it is the finding: *any single point the observer can name in advance can be made cheap*; the growth is not concentrated but **distributed** across the interval, which is exactly why the average $\int\lambda$ — which integrates the distributed growth and cannot be cheated — is the right object, and why $\max \geq \text{average}$ is the only available bridge. This locates the obstruction precisely: order and counting are pointwise, local operations, but the $\ln N$ floor is a global, distributed fact, so no local argument reaches it and the classical proof's global dual (the conjugate function) is doing essential work. The sharpened open question is therefore not whether the bound is observer-reachable in general but whether an *observer-native* global object can play the conjugate function's role — and there is one candidate the framework already owns: the combination-law rotation on the virtual circle (foundational §8), which is global rather than pointwise, is the observer's own operation, and is of the same rotational type as the conjugate operator on the circle. Whether the §8 rotation discharges the $L^1$ floor that the conjugate function classically discharges is untested, and is the single most promising remaining probe. The envelope stays **[open]**; the pass converted a diffuse question into a specific one with a named candidate mechanism.

### A.7 The factorization

Classical approximation theory factors cleanly over the observer/surveyor line. The observer's court holds the constructive half — near-best estimates (A.1), the logarithmic growth law in both directions (A.2), the sampling limit by counting (A.3), the sharp direct theorem by squaring (A.4), derivative control and the inverse theorems (A.5) — all from the round-trip identity, order, dyadic self-similarity, and squaring in the pair algebra. The surveyor's court holds the variational half — existence, characterization, completed density, all evaluated constants, and on current evidence the universal lower envelope — each requiring a completed total or a quantifier over unheld objects. That this paper proves the bridge *from* the classical results and this appendix recovers the classical constructive results *from* the observer is not circular: the two directions meet at the constructive core, which is common to both, while each court keeps what the other cannot reach. The dependency is mutual exactly where it should be, and the boundary between the courts is, once again, the bandwidth horizon.

*Full derivations, the numerical verification suite, and the session record including the rejected results are maintained in the working note `approx_from_observer.md`.*

---

# Appendix B — The executed checks

`[clean, verified, August 2026; script `appendixB.mjs`, raw output `B_output.txt`]`

Appendix A runs the arrow from the observer's constraints to the classical theorems. This
appendix does something smaller and more mechanical: it executes the body's *own*
verification claims — the ones that state a measured result, quote a precision figure, and
record no table — so that a reader can check them rather than take them.

Two of its items overlap Appendix A and are marked as confirmations rather than
contributions: **B.5 reproduces the settling exponents of A.5** and **B.6 reproduces the
humps/tails decomposition of A.6**, both independently and from a different construction.
One number in the body was stated loosely and is measured exactly here — Appendix A.2's
shell constant, now carried in A.2 as $c_0=\psi_1\ln2$ on the strength of B.6's table.

## B.1 Partition of unity and node exactness, at both parities

`[discharges §4.2 — Lemmas 4.2 and 4.3a, asserted in five places and tabulated in none]`

$\sup_\varphi|\sum_k K_N(\varphi-\theta_k)-1|$ over 200 non-node points, and
$\max_{j,k}|K_N(\theta_j-\theta_k)-\delta_{jk}|$ over the full table:

| $N$ | parity | $\sup|\text{PoU}-1|$ | node exactness |
|---|---|---|---|
| 8 | even | $1.8\times10^{-15}$ | $3.7\times10^{-17}$ |
| 32 | even | $5.1\times10^{-15}$ | $1.1\times10^{-15}$ |
| 33 | **odd** | $5.3\times10^{-15}$ | $9.6\times10^{-16}$ |
| 65 | **odd** | $1.6\times10^{-14}$ | $2.8\times10^{-15}$ |
| 129 | **odd** | $3.5\times10^{-14}$ | $4.8\times10^{-15}$ |
| 512 | even | $1.0\times10^{-13}$ | $3.3\times10^{-14}$ |
| 4096 | even | $5.8\times10^{-13}$ | $1.1\times10^{-13}$ |

**The control is why the section exists.** Running the *even* kernel at odd $N$ — §4.1's
parity trap, and §11's in the slope chart:

| $N$ | $\sup|\text{PoU}-1|$ | node exactness |
|---|---|---|
| 33 | $\mathbf{1.4\times10^{-3}}$ | $9.5\times10^{-16}$ |
| 65 | $3.7\times10^{-4}$ | $2.8\times10^{-15}$ |
| 129 | $9.4\times10^{-5}$ | $4.8\times10^{-15}$ |

Node exactness is untouched at machine zero while partition of unity fails in the third
decimal. **The interpolation property cannot detect the error and the unit total can** —
which is why a wrong-parity kernel looks correct at every leaf and is wrong everywhere
between them. At $N=33$ on a radius-100 circle the $1.4\times10^{-3}$ is $0.14$ px,
recovering §4.1's own quoted $\approx0.15$ px.

## B.2 The two parameterizations agree

`[discharges §10.1 — "identical reconstructions verified to machine precision at $N=16,\dots,256$"]`

Proposition 10.1 states $K_N(2t)=\tilde K_N(t)$. Checked as a *substitution* the test is
circular — both sides reduce to the same floating-point expression and return exactly $0$ —
so the outside form is taken in its **product** presentation
$\sin(N\varphi/2)\cos(\varphi/2)/(N\sin(\varphi/2))$ and compared against the inside form
$\sin(Nt)/(N\tan t)$. Different operations, same number:

| $N$ | $\max|K_N(2t)-\tilde K_N(t)|$ | $\max|\Psi^{\text{outside}}-\Psi^{\text{inside}}|$ |
|---|---|---|
| 16 | $2.2\times10^{-16}$ | $6.7\times10^{-16}$ |
| 64 | $2.8\times10^{-17}$ | $5.6\times10^{-16}$ |
| 256 | $1.1\times10^{-16}$ | $6.7\times10^{-16}$ |

## B.3 Reparameterization: conjugation is free, substitution detonates

`[discharges §10.2, whose warp-family record §15.3 summarises without tabulating]`

Order-preserving warps $h$, applied two ways. **Conjugated:** nodes *and* queries carried
through $h$, run in the pulled-back coordinate with a numerically inverted $h^{-1}$.
**Substituted:** warped nodes handed to the native composition. $\Lambda$ is the sup of
$\sum_k|\ell_k|$ over one fixed 4000-point grid, the same for both columns.

$N=16$, uniform $\Lambda_0=2.286992$:

| warp | $\Lambda$ conjugated | $|\Lambda-\Lambda_0|$ | $\Lambda$ substituted | $\delta_{\max}N$ |
|---|---|---|---|---|
| rotation $\varphi+0.7$ | 2.287014 | $2.2\times10^{-5}$ | $2.5$ | 11.20 |
| Möbius $a=0.60$ | 2.287016 | $2.3\times10^{-5}$ | $\mathbf{2.5\times10^{7}}$ | 20.56 |
| Möbius $a=0.95$ | 2.287016 | $2.4\times10^{-5}$ | $\mathbf{2.3\times10^{17}}$ | 38.97 |
| sinusoid $a=0.30$ | 2.287016 | $2.4\times10^{-5}$ | $1.0\times10^{1}$ | 4.71 |
| sinusoid $a=0.03$ | 2.287016 | $2.4\times10^{-5}$ | $2.4$ | 0.47 |

At $N=32$ the conjugated column is flat at $2.72778$ against $\Lambda_0=2.727648$
($\le1.3\times10^{-4}$, the bisection's accuracy rather than the scheme's), and the
substituted column reads $5.9$, $2.3\times10^{16}$, $8.9\times10^{17}$,
$5.0\times10^{2}$, $3.1$.

Two readings beyond §10.2's. *The substituted column tracks $\delta_{\max}N$ and not the
warp's name* — the two sinusoids differ only in amplitude and sit at $0.47$ and $4.71$,
mild and detonating, straddling the stated crossover near $1.5$. *And the rotation is not
free under substitution* ($2.5$ against $2.29$), which is worth its own line, because a
rotated uniform grid is still uniform and the cost is therefore not irregularity. The
half-shift's alignment with the invisible top mode $\cos(N\varphi/2)$ is part of the grid's
definition; rotating off the odd multiples changes which direction the node set cannot see.
§15.3's exactly-null rotation is a first-variation statement, and at $\delta_{\max}N=11$
there is nothing first-order left.

## B.4 The multiresolution record

`[discharges §14, whose four verification claims carry precision figures and no table]`

**(a) The two-scale relation.** $K_N(\varphi)=\sum_j h_j K_{2N}(\varphi-\theta'_j)$,
$h_j=K_N(\theta'_j)$, max residual over 400 non-node $\varphi$:

| $N$ | 8 | 16 | 32 | 64 | 128 |
|---|---|---|---|---|---|
| residual | $1.9\times10^{-15}$ | $3.9\times10^{-15}$ | $6.3\times10^{-15}$ | $4.5\times10^{-15}$ | $3.1\times10^{-14}$ |

**(b) Where the refinement residual lands.** A random element of $V_{2N}$ reduced to depth
$d$ two ways: the *orthogonal* projection by solving the Gram system in the kernel-translate
basis, and *interpolation* by reading the value at the coarse node.

| $N$ | orthogonal: $\perp V_N$ | octave $N/2<|m|\le N$ | $m=N/2$ (half weight) | $|m|>N$ | interpolated: $\perp V_N$ |
|---|---|---|---|---|---|
| 8 | $3.6\times10^{-17}$ | $1.3\times10^{-1}$ | $5.2\times10^{-2}$ | $1.4\times10^{-14}$ | $3.5\times10^{-2}$ |
| 16 | $7.6\times10^{-17}$ | $1.2\times10^{-1}$ | $2.1\times10^{-2}$ | $1.4\times10^{-14}$ | $2.1\times10^{-2}$ |
| 32 | $6.0\times10^{-17}$ | $1.3\times10^{-1}$ | $4.1\times10^{-2}$ | $1.4\times10^{-14}$ | $1.2\times10^{-2}$ |

Three things at once. The orthogonal residual is $\perp V_N$ at machine zero and carries
nothing above $|m|=N$ (also machine zero, confirming the test function is in $V_{2N}$).
The mode $m=N/2$ has its own column because it is the boundary frequency §14 carries at
*half weight*, shared between $V_N$ and $W_N$ — counting it as a leak would misreport the
mechanism that lets the octaves tile. And the interpolated residual is **not** $\perp V_N$:
the oblique projection's $V_N$ component, §14's single distinction, at $10^{-2}$ against the
orthogonal $10^{-17}$. That number is the demo's editing limitation in exact form.

## B.5 The seam, executed — confirming A.5

`[confirmation of Appendix A.5; independent construction]`

A.5 states the settling exponents from the residual ladder. Reached instead by direct
interpolation of a unit step (discontinuities at $\theta=1.0$ and $\theta=1.0+\pi$, never a
leaf for even $N$), measured against the true step at 20011 prime-spaced queries:

| $N$ | 16 | 64 | 256 | 1024 |
|---|---|---|---|---|
| sup error | 0.9657 | 0.7110 | 0.7851 | 0.5206 |
| $L^2$ error | 0.2043 | 0.0683 | 0.0381 | 0.0147 |

Fitted against $\text{error}\sim N^{-\alpha}$ over $N=16\dots1024$:

$$\alpha_{\sup}=0.041, \qquad \alpha_{L^2}=0.522$$

against A.5's $\alpha\approx0$ and $\alpha=1/2$. The non-monotone sup column is not noise to
be averaged: it is the overshoot peak moving relative to the leaf grid while its height stays
pinned at $O(H)$. Between the last atom reading $0$ and the first reading $H$ the interpolant
crosses the whole jump inside one leaf spacing, and no $N$ removes that — the spacing shrinks
and the crossing does not. A.5's *the sup-norm error at a jump does not settle at all*
reproduces from the interpolation side as well as from the ladder.

## B.6 The Lebesgue split, executed — confirming A.6, and measuring A.2's constant

`[confirmation of Appendix A.6; the measurement behind A.2's $c_0 = \psi_1\ln2$]`

A.6 locates the growth by an $L^1$ argument — the integral of $|\ell_k|$ over its own
adjacent gap is $O(1/N)$ and sums to $O(1)$, so *the local humps do not produce the growth
and the $\ln N$ lives in the tails.* The same split holds **pointwise**, which is a cheaper
statement to check and reaches the same place. The Lebesgue function at its maximiser
$\varphi=0$ (midway between the leaves at $\pm\pi/N$), split into the $2W$ nearest leaves and
the rest, with $N$ stepping by four:

*window = 8 nearest leaves*

| $N$ | humps | tails | $\Lambda_N$ | tail increment |
|---|---|---|---|---|
| 16 | 2.06739 | 0.21963 | 2.28702 | — |
| 64 | 2.13010 | 1.03883 | 3.16892 | $+0.81920$ |
| 256 | 2.13394 | 1.91749 | 4.05142 | $+0.87866$ |
| 1024 | 2.13418 | 2.79979 | 4.93396 | $+0.88230$ |
| 4096 | 2.13419 | 3.68232 | 5.81651 | $+0.88253$ |

The near column is flat to five decimals over three orders of magnitude in $N$; the far
column's increment converges on $\psi_1\ln4=0.88254$ to five digits. Totals reproduce the
spectral companion's published $\Lambda_N$ exactly — $1.848$, $2.728$, $3.610$, $4.493$ at
$N=8,32,128,512$ — so the operator is that one.

**Where A.2's constant comes from.** A.2 now states its direct shell bound with
$c_0=\psi_1\ln2$, and this table is the measurement behind that. An earlier draft of A.2
carried the shell mass as *near-constant $\approx0.45$* while separately noting that the
telescoping increments *settle to $\psi_1\ln2>0$* — two constants, close enough to be
suspicious, stated as though independent. Measured here they are one: the shell mass
converges on $\psi_1\ln2=0.44127$ to five digits, so the direct and telescoping forms of
A.2's lower bound share their constant. The reason is structural rather than numerical, and
worth saying once: the shell profile is *stationary* — doubling $N$ inserts one interior
shell and leaves the rest fixed — so a shell and a doubling are the same increment counted
two ways, and there was never room for two constants. A.2 carries the statement; this
appendix carries the number.

A second reading, same table. Repeating at other windows gives the same shape with a
different offset — humps $1.69765$ at $W=2$, $2.13419$ at $W=4$, $2.57423$ at $W=8$ — and
those differ by $0.4365$ and $0.4400$, converging on $\psi_1\ln2$ as well. **One constant
governs both the growth in the window and the growth in the tail**, which is why §16's
$\psi_1\ln K$ and §7.4's $\psi_1\ln N$ are one law read at two supports.

*Cut the tails and you cut the logarithm; it does not follow that you cut the error, and §16
records the floor that remains.*

---

*Executed by `appendixB.mjs` (node, float64, August 2026) against the reference kernel with
the §4.1 parity switch; raw output in `B_output.txt`. B.5 and B.6 confirm Appendix A.5 and
A.6 by independent construction; B.1–B.4 discharge body claims that Appendix A does not
cover.*
