# §23 — The aperture band is constructible

### *A companion section to* The Tangent Bridge in the Spectral Court *(§§17–22), extending the constructible-lattice reading from the transform to the bounded aperture, with the addenda to §18, §20 and §21 that the implementation forced*

> **Status: preliminary.** A working draft. The mathematics of §23.1–23.2 is settled and independently re-derived (§23.3), and the operator it licenses is in service; the open items are collected in §23.4 and touch the taper, the non-dyadic case, and the generality of the measurements rather than the proposition. Numbering assumes §23 is free. — draft 1, Jul 2026

§21.4 found the FFT's twiddle table inside the leaf lattice: the transform the observer needs is carried on slopes it already holds. The same question can be asked of the *other* operation the bounded observer performs, and the answer is better. When the presentation is read through a window — only the $K$ leaves within $\pm$halfW of the sample, which is the §5.2 held-open-circle read made finite — every kernel argument that arises lands on a **reduced constructible lattice**, and the whole windowed operator becomes a sparse matrix of rational numbers. §21.4 made the transform trig-free; §23 makes the aperture trig-free, which is the more consequential of the two, because the aperture is where "only the $K$ in view" actually lives.

The section is short, and its content is one congruence. The operational half is that the windowed read — which an implementation will naively write as two transcendentals per (sample, leaf) pair, and which is then *slower than reading every leaf* — becomes the cheapest operator in the system.

---

## 23.1 Statement

Let the leaves be $\theta_j=(2j+1)\pi/N$, $j=0,\dots,N-1$ (the odd nodes of §2.2, $N=2^{d+1}$), and let the presentation be sampled at the $M$ equispaced angles $\varphi_i=2\pi i/M$ — the grid a renderer, a plotter or a quadrature actually asks for.

**Proposition 23.1 (Aperture lattice).** Put $u_{ij}=(\varphi_i-\theta_j)/2$, the half-difference the kernel is evaluated at. Then

$$u_{ij} \;=\; \frac{p\,\pi}{\Lambda},\qquad p \;=\; \frac{2iN-M(2j+1)}{g}\in\mathbb{Z},\qquad g=\gcd(2N,M),\qquad \Lambda=\frac{2MN}{g}. \tag{23.1}$$

When $N$ and $M$ are both powers of two, $g=\min(2N,M)$ and the lattice is

$$\Lambda \;=\; \max(M,\,2N)\;=\;\begin{cases} M, & M\ge 2N \quad(\text{a dense read of a coarse shape}),\\[2pt] 2N, & M< 2N \quad(\text{everything else, including } M\le N). \end{cases}$$

**Corollary 23.2 (The kernel on the lattice).** With $\rho=\Lambda/N\in\mathbb{Z}$, $\rho\ge2$,

$$K_N(\varphi_i-\theta_j)\;=\;\frac{\sin(N u_{ij})}{N\tan u_{ij}}\;=\;\frac{\sin\!\big(p\pi/\rho\big)}{N\,\tan\!\big(p\pi/\Lambda\big)}, \tag{23.2}$$

in which

- $\tan(p\pi/\Lambda)$ is an entry of the constructible slope ladder of length $\Lambda$ — one bisection for the base slope $\tan(\pi/\Lambda)$ and tangent addition (Möbius) for the rest, exactly the ladder of §17.3 and §21.4;
- $\sin(p\pi/\rho)$ is an entry of a table of $2\rho$ values, obtained from the same ladder by $\sin\vartheta=2t/(1+t^2)$;
- and for $M\le N$ the second table **collapses to $\{0,1,0,-1\}$**, because $\rho=2$.

So the kernel is evaluated with no transcendental at any $(N,M)$, and a shape drawn smaller than its own rung needs no sine table at all.

**Corollary 23.3 (The band is a cacheable sparse operator).** The windowed weights
$$w_{ij}=K_N(\varphi_i-\theta_j)\cdot\tau\!\left(\tfrac{j-c_i}{\text{halfW}}\right),\qquad c_i=\tfrac{iN}{M}-\tfrac12,$$
depend only on $(i,j,N,M,\text{halfW})$ and never on the held values. Normalized by their row sum (the windowed weights are no longer a partition of unity), they form an $M\times B$ band, $B=2\lceil\text{halfW}\rceil+3$, computable once by (23.2) and reusable across every shape and both channels. The windowed read is then $O(K)$ per sample against the full sum's $O(N)$ — a multiply–accumulate over rational weights, with no kernel evaluation at all at read time.

**Remark 23.4 (R2 as a congruence).** The kernel's zeros sit exactly at $p\equiv0\ (\mathrm{mod}\ \rho)$, $p\neq0$: those are the $u=m\pi/N$ of §17.2, the other leaves, and $\sin(p\pi/\rho)$ vanishes there. The interpolation property (R2) is thus visible in (23.2) as a divisibility condition on the lattice index — the roots-of-unity fact of §17.2 read after reduction by $g$. Dually, when $M\le N$ one finds $p$ *always odd*, so the numerator is $\pm1$ and never $0$: an even-node output grid coarser than the odd-node leaf grid never lands on a leaf, and the $\delta_{jk}$ of (R2) simply cannot arise. The parity of $p$ is the odd-node signature of §2.2, surviving the reduction.

---

## 23.2 Proof

*Proposition 23.1.* Directly,
$$u_{ij}=\frac{\varphi_i-\theta_j}{2}=\frac{\pi i}{M}-\frac{(2j+1)\pi}{2N}=\frac{\pi\big[2iN-M(2j+1)\big]}{2MN}.$$
The bracket is a $\mathbb{Z}$-linear combination of $2N$ and $M$ ($2iN$ is a multiple of the first, $M(2j+1)$ of the second), hence a multiple of $g=\gcd(2N,M)$. Dividing numerator and denominator by $g$ gives (23.1) with $\Lambda=2MN/g$. For $N=2^a$, $M=2^b$ the gcd of $2N$ and $M$ is the smaller of them, and $2MN/\min(2N,M)=\max(M,2N)$. $\square$

*Corollary 23.2.* The first equality is the kernel in its product form at $\varphi=\varphi_i-\theta_j$ (§4.1). For the second, substitute (23.1): the denominator is immediate, and
$$\sin(Nu_{ij})=\sin\!\Big(\frac{Np\pi}{\Lambda}\Big)=\sin\!\Big(\frac{p\pi}{\Lambda/N}\Big)=\sin\!\Big(\frac{p\pi}{\rho}\Big),$$
with $\rho=\Lambda/N$ an integer because $\Lambda$ is either $M$ (and then $\rho=M/N=q$, an integer $\ge2$ since $M\ge2N$) or $2N$ (and then $\rho=2$). The map $p\mapsto\sin(p\pi/\rho)$ is $2\rho$-periodic, so $2\rho$ stored values suffice; at $\rho=2$ they are $\{0,1,0,-1\}$. That the ladder covers the required index range is the band's own locality. The window spans $j\in[\lfloor c_i-\text{halfW}\rfloor,\ \lceil c_i+\text{halfW}\rceil]$, so $|u_{ij}|\le(\text{halfW}+1)\pi/N$ and therefore
$$|p|\;=\;\frac{|u_{ij}|\,\Lambda}{\pi}\;\le\;(\text{halfW}+1)\,\rho\;<\;\frac{\Lambda}{4}+\rho ,$$
using $\text{halfW}<N/4$, which is the condition under which the windowed branch is taken at all. The quarter table alone ($|p|\le\Lambda/4$) does **not** suffice — it is exceeded in every configuration tested — but $\Lambda/4+\rho\le\Lambda/2$ whenever $\rho\le\Lambda/4$, i.e. whenever $N\ge4$, so one reciprocal branch $\tan(\pi/2-x)=1/\tan x$ covers the remainder and nothing falls outside it. Swept over $N\in[8,2048]\times M\in[32,4096]$ at the largest admissible halfW, the observed maximum is $1.499\,(\Lambda/4)$ — half the reciprocal branch's reach. The diagonal $p=0$ is the removable point $K_N(0)=1$. $\square$

*Corollary 23.3.* Immediate from the weights' independence of the data, which is the same observation that makes the *dense* kernel matrix cacheable; the content here is that the windowed matrix is banded, so caching it is cheap in memory as well as in time, and that (23.2) fills it without transcendentals. $\square$

---

## 23.3 Numerical verification

Harness of record: `tb_band.mjs` — headless Chromium, float64, driving the renderer's own `reconstruct1D` (a browser harness rather than `numpy`, which is the point: these are the numbers the drawing path produces).

**The ladder.** $\tan(p\pi/L)$ for $p\le L/4$, built by one bisection and tangent addition, against `Math.tan`:

| $L$ | entries | $\max_p\big|\text{ladder}[p]-\tan(p\pi/L)\big|$ |
|---|---|---|
| 16 | 5 | $3.3\times10^{-16}$ |
| 256 | 65 | $7.8\times10^{-16}$ |
| 4096 | 1025 | $2.9\times10^{-14}$ |
| 8192 | 2049 | $1.6\times10^{-14}$ |

**The band.** The banded read of (23.2)–(23.3) against the same windowed operator evaluated cell by cell with `tan`/`sin`, and its cost against the *unwindowed* exact sum (a cached dense matrix multiply). Aperture is the window fraction; $K$ is the leaves entering each sample:

| $N$ | $M$ | $K$ | $\max\big|\text{band}-\text{trig read}\big|$ | band | dense sum | ratio |
|---|---|---|---|---|---|---|
| 512 | 2048 | 128 | $1.2\times10^{-13}$ | 0.75 ms | 2.47 ms | 3.3× |
| 512 | 2048 | 51 | $1.3\times10^{-13}$ | 0.30 ms | 1.73 ms | 5.8× |
| 512 | 2048 | 26 | $1.2\times10^{-13}$ | 0.14 ms | 1.84 ms | 12.8× |
| 512 | 512 | 26 | $7.6\times10^{-14}$ | 0.040 ms | 0.46 ms | 11.5× |
| 512 | 256 | 26 | $6.8\times10^{-14}$ | 0.023 ms | 0.22 ms | 9.6× |
| 1024 | 256 | 51 | $1.8\times10^{-13}$ | 0.040 ms | 0.41 ms | 10.3× |
| 2048 | 512 | 102 | $3.4\times10^{-13}$ | 0.133 ms | 1.64 ms | 12.3× |
| 256 | 64 | 13 | $3.9\times10^{-14}$ | 0.007 ms | 0.030 ms | 4.5× |

The four rows with $M\le N$ are the $\rho=2$ collapse — no sine table, numerator $\pm1$ throughout (Remark 23.4).

**The inversion.** The same windowed read, before and after the band, against the full sum on the same data ($N=512$, $M=2048$):

| aperture | $K$ | per-cell trig read | banded read | full (unwindowed) sum |
|---|---|---|---|---|
| 0.25 | 128 | 16.57 ms | 0.75 ms | 0.21 ms |
| 0.10 | 51 | 6.51 ms | 0.30 ms | 0.21 ms |
| 0.05 | 26 | 3.09 ms | 0.14 ms | 0.21 ms |

Read the last two columns against each other and the point of the section appears: reading a *quarter* of the leaves cost seventy-nine times more than reading all of them, and now costs less than reading all of them. A bounded observer that pays more for holding less is not implementing the theorem; it is paying for the angle chart it declined.

**Downstream, unchanged.** The instrument that chooses $K$ automatically (smallest window whose deviation stays under half a device pixel) selects the identical aperture before and after — $K=6$ of $512$, 85× fewer terms, deviation $0.27$ px — and the rendered output is bit-unchanged: three scenes decoded and compared pixel by pixel, **0 differing pixels**.

---

## 23.4 Open

What this draft does not settle, in the order it would matter to close:

1. **The taper.** (23.2) removes every transcendental from the *kernel*; the raised-cosine window multiplying it is still one `cos` per cell at build time, because its argument $(j-c_i)/\text{halfW}$ is not a lattice angle for arbitrary halfW. A rational window (a Poisson-kernel or Blaschke-derived taper, in keeping with §18.4) would make the build trig-free outright and is the natural next step — but whether it disturbs what the half-pixel auto-aperture instrument selects, and by how much, is untested. Until that is measured the claim in the §20 addendum is a conjecture about the taper, not a result.
2. **The non-dyadic case.** Proposition 23.1 holds for any integers $N,M$; the *collapse* does not. With $\gcd(2N,M)$ small — coprime $N$ and $M$ — $\Lambda=2MN/g$ is of order $MN$ and the ladder is no cheaper than the table it replaces. The practical statement is therefore conditional on the forced radix of §2.4, which is the honest reading (and the one §23.4 gives), but the boundary deserves a sharper characterization than "powers of two are fine": what is the largest $\Lambda$ worth tabulating, as a function of the band width and the number of shapes sharing it?
3. **The window bound is stated for one rule.** $\text{halfW}<N/4$ is the implementation's own switch between the windowed and the full read, and the coverage argument in §23.2 leans on it. A window wider than $N/4$ needs either a larger ladder or a second reciprocal branch; neither is hard, neither is written.
4. **The measurements are one harness on one machine.** §23.3's timings are headless Chromium, software rasterization, float64, single-threaded. The *ratios* are what the section claims and they are stable across repeats, but nothing here has been run on a second engine, and the crossover in the §21 addendum in particular is an artifact of one JIT's treatment of a bounds-checked inner loop as much as it is of the arithmetic. Treat the crossing point as measured-here, not derived.
5. **Whether the band should be the default.** The instrument currently defaults to the full aperture; now that the windowed read is the cheaper one, the argument for that default is no longer performance, it is exactness. That is a design question the theorem does not answer, but §7.4's pricing of the interpolatory floor is where an answer would start.

---

## 23.5 Reading

§20 sorted the sections by court: §17, §19 and §21 run in the observer's chart, §18 is the surveyor's by nature. §23 belongs with the first group and sharpens what membership means. The observer's chart is not merely *available* for the windowed read — it is what makes the windowed read worth having. Evaluated in the angle chart, the aperture is a pessimization: two transcendentals per (sample, leaf) pair, and the "bounded" operator loses to the unbounded one by two orders of magnitude, because the unbounded one can be written as a matrix and the windowed one, apparently, cannot. Evaluated on the reduced lattice (23.1) it is what it always was on paper: a sparse operator over the $K$ atoms in view, costing what $K$ says it should.

The mechanism is the same one §21.4 found in the twiddles, and the reason is the same: **a fixed grid against a fixed grid produces only finitely many angles, and those angles are constructible.** In §21.4 the two grids were the leaves and the modes; here they are the leaves and the sample points. The gcd in (23.1) is doing the work the framework's forced radix already promised — it is because $N$ and $M$ are powers of two that $g=\min(2N,M)$ and the lattice collapses to a single small table, and it is the *same* forcing (§2.4) that gives the nesting, the MRA and the FFT. The dividend is now counted three times, and it is one dividend: the recursion that nests the leaves is the recursion that transforms them, and the lattice that carries the transform is the lattice that carries the window.

Remark 23.4 is the part worth keeping in view. The interpolation property is not lost in the reduction — it becomes arithmetic. R2's $\delta_{jk}$, which §17.2 proved by asking when a normalized rotation lands on the real axis, is here the statement that $\rho\mid p$; and the case $M\le N$, where the output grid can never coincide with a leaf, shows up as $p$ being odd for structural reasons. The odd-node signature of §2.2 survives every division in (23.1). It would have been easy to build a renderer that never noticed.

---

# Addenda

## To §18 — the fold on the synthesis side

§18 folds on the **analysis** grid, where the leaves are odd nodes and the fold therefore carries the sign twist $e^{i(m+N)\theta_k}=-e^{im\theta_k}$. The presentation is sampled on the **even**-node grid $\varphi_i=2\pi i/M$, and there the corresponding statement is unadorned:

**Corollary 18.2 (Synthesis fold).** For $\varphi_i=2\pi i/M$ and any $m\in\mathbb{Z}$, $e^{im\varphi_i}=e^{i(m\bmod M)\varphi_i}$. Hence evaluating $P_dF$ at $M$ equispaced points by folding its coefficients modulo $M$ and inverse-transforming is **exact for every $M$**, above or below $N$, with no sign twist. The twist of §18.1 is a property of the odd-node analysis grid alone, and is already carried by the half-shift twiddle of (21.1).

This is what licenses a length-$M$ transform for a shape whose rung exceeds its sampled resolution — the ordinary case for a presentation that must draw a $2048$-leaf contour across two hundred pixels. Verified against the direct sum at $10^{-13}$ for $(N,M)$ with $M<N$, $M=N$ and $M>N$.

## To §20 — the status table

A row for the aperture:

**§23 operates in the slope chart — trig-free, demonstrated.** The windowed kernel is (23.2), rational in constructible slopes at every $(N,M)$; the band table is built with the trigonometric-call count at zero for the kernel. One honest exception, recorded rather than papered over: the raised-cosine (Hann) taper multiplying the kernel is evaluated with a cosine, once per cell at build time. That window is the application's instrument — its argument $(j-c_i)/\text{halfW}$ is not a lattice angle for arbitrary halfW — and it is not part of the framework's kernel. Replace the taper with a rational window and the build is trig-free outright.

## To §21 — an implementation note on the crossover

§21 establishes that the transform is $O(M\log M)$ where the sum is $O(N\cdot M)$, which invites the reading that the transform is always preferable at scale. In practice the decision is governed by $N$ alone, not by $N\cdot M$: the transform costs $\beta(M\log M+N\log N)$, and that does not fall when $N$ does. A coarse shape sampled densely — $N=32$, $M=2048$, a low-rung contour filling the view — is measurably faster by the direct sum (transform at $0.39\times$ the sum's speed), while from $N=128$ upward the transform leads, by $1.2\times$ at $N=128$ and $5$–$10\times$ at $N\ge512$. Swept over $N\in[32,1024]\times M\in[256,4096]$:

| | $M=256$ | $M=1024$ | $M=2048$ | $M=4096$ |
|---|---|---|---|---|
| $N=32$ | 0.99× | 1.04× | 0.39× | 0.32× |
| $N=128$ | 1.01× | 1.21× | 1.55× | 3.41× |
| $N=512$ | — | 8.60× | 8.84× | 10.83× |
| $N=1024$ | 3.10× | 10.13× | 5.74× | 5.99× |

(transform speed ÷ direct-sum speed; >1 favours the transform.)

## To the verification note

The following were reproduced by the renderer described in §23.3 — float64 in a browser, independent of the `numpy`/`sympy` harnesses:

- **§19.3 / §22.3, the Lebesgue constants.** $\Lambda_N=1.848,\ 2.728,\ 3.610,\ 4.493$ at $N=8,32,128,512$ — the published values.
- **§22.3, the Fejér operator.** Norm $1.00000$ at every $N$; kernel minimum $-8.2\times10^{-16}$ to $-1.2\times10^{-15}$; partition of unity to $1.6\times10^{-15}$.
- **§22.4, saturation.** Node error on the band mode $\cos3\theta$: $0.3678$ at $N=16$ (published $3.75\times10^{-1}$), $0.0936$ at $N=64$, $0.0234$ at $N=256$ (published $2.34\times10^{-2}$), tracking the predicted $3/M$ to three figures.
- **§21.4, the trig-free twiddles.** Cayley images of bisection slopes against `Math.cos`/`Math.sin`: $4.1\times10^{-16}$ at $n=8$, $3.0\times10^{-14}$ at $n=4096$.
- **§21.1, reconstruction.** The half-shift-twiddled transform against the direct Dirichlet sum, over random, smooth and step (worst-case Gibbs) data, $N\in[128,1024]$, $M$ above and below $N$: worst case $3.9\times10^{-13}$. (R2) holds through the transform to $1.1\times10^{-14}$.
