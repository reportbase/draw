# The Tangent Bridge in the Spectral Court

### *Companion sections to* The Tangent Bridge Theorem *(§§17–22), reproving R1–R3 in the frequency domain, adding the energy face, settling which run trig-free, showing the FFT is the cascade, and curing the R4 divergence*

These three sections re-run the main theorem in Fourier language. The paper's own proof of R3 is the $L^\infty$ route — the Lebesgue constant times Jackson (§6.3) — and §13–§14 open the spectral door (Pontryagin duality; the periodic Shannon MRA) without walking the theorem through it. The sections below do exactly that. None of the classical results is new; what is worth watching is *how the framework's own objects surface* when the proof is re-posed — the tangent as a normalized rotation lifted to $\mathbb{C}$ (§17), the reconstruction error as folded tail energy (§18), and the half-weight top mode appearing a third time, now as an exact frame bound (§19). Section 20 records which run trig-free in the observer's chart (§17, §19, and §21) and which is the surveyor's completed-circle court by nature (§18); section 21 shows the radix-2 FFT is the dyadic cascade of §5.3 read on the dual lattice, running trig-free with the leaf lattice as its twiddle table; section 22 cures the §6.4 divergence with the positive Fejér kernel, unconditional convergence bought by surrendering atom-exactness. Numerics are `numpy`/`sympy`/float64 (Jul 2026), in the paper's machine-precision convention, and the harnesses of record are held to the §15.3 zero-trig-call bar; the same $1/2$ recurs throughout — the kernel's top-mode coefficient, the aliasing split, an exact rational frame eigenvalue, the Nyquist twiddle, and the mode the Fejér window removes.

**On names — the slope chart and the angle chart.** Two coordinate charts run through these sections, and both are named the same way — by their coordinate — so the chart change is the function that already links them: **the slope chart and the angle chart are the two sides of the tangent**, $s=\tan t$. The *slope chart* is the observer's — the held ratio $s$, algebraic, its total the chord's $2$ (foundational §5); the *angle chart* is the surveyor's — the same closed line in the arc coordinate $t$, its total the arc's $\pi$. **The half-angle is load-bearing and is the one thing to carry out of this note.** Sections 17–22 display the kernel in the main paper's outside arc $\varphi=2t$, of total $2\pi$ — the coordinate in which $K_N(\varphi)=\sin(N\varphi/2)/(N\tan(\varphi/2))$ and the leaves sit at $\theta_k=k\pi/N$ — and in *that* coordinate the chart change reads $s=\tan(\varphi/2)$, never $s=\tan\varphi$. The two are not a matter of taste: substituted into §17.1's rational kernel, $s=\tan\varphi$ misses $K_N$ by $O(0.6)$ at every $N$, because the roots-of-unity argument of §17.2 needs an argument advancing by $\pi/N$ per leaf step and $\tan\varphi$ advances at twice that. See the main paper's Convention (§1) and Proposition 10.1. (An earlier draft of this companion named the second chart for its total, the π chart; the main corpus has since settled the coordinate-symmetric names, and this companion follows.) The tangent relates the charts pointwise as a nonlinear homeomorphism, its Jacobian the Cauchy — $1$ at home, $0$ at the horizon — so there is no scalar rate point-by-point. But *converted whole*, one completed circle at a time, they trade at a fixed rate: $2/\pi=\psi_1$ slope-to-angle, and its reciprocal $\pi/2=1/\psi_1$ back (§7.4, §7.5, the interpolation/integration floor ratio). The rate is denominated one total per chart — a $2$ from the slope side over a $\pi$ from the angle side (§7.5, where the $2$ is the algebraic numerator the observer computes and the $\pi$ the arc-total normalization it declines). The exchange stays legible: **the $2$ is the slope chart's total, the $\pi$ the angle chart's — the constant is the chart's total, not its name.**

---

## 17. The complex-analytic reproof: the kernel is a normalized rotation raised to the depth

### 17.1 Statement

The slope form of §11 already writes the kernel as the imaginary part of a complex power,
$$K_N(\varphi) \;=\; \frac{\operatorname{Im}\!\big[(1+is)^N\big]}{N\,s\,(1+s^2)^{\lfloor N/2\rfloor}}, \qquad s=\tan(\varphi/2).$$
**On the exponent.** Earlier drafts of this companion displayed $(1+s^2)^{N/2}$, following §11 as it then read. §11 has since been corrected: the exponent is a **floor**, and $N/2$ was the even case only. Nothing downstream in §§17–22 moves, because this companion works throughout at $N=2^{d+1}$, where $\lfloor N/2\rfloor = N/2$ and the two agree identically. The correction is stated here anyway, for two reasons. It keeps the citation honest — §11 no longer says what this section was attributing to it. And, more usefully, **the floor is what makes §17 a proof for every $N$ rather than for the even ones**: the roots-of-unity argument of §17.2 never uses the parity of $N$, so with the corrected exponent the section proves strictly more than it was claiming. See §17.1a.
The observation that turns this into a proof of (R1)–(R2) is that the complex number $1+is$ is not an ingredient carried alongside the tangent — it *is* the tangent, lifted. For $s=\tan t$,
$$1+is \;=\; 1 + i\tan t \;=\; \frac{\cos t + i\sin t}{\cos t} \;=\; \frac{e^{it}}{\cos t}. \tag{17.1}$$
The slope $s$ the observer holds and the direction $e^{it}$ the surveyor names are one complex number in two readings — modulus $\sec t$, argument $t$. Raising to the depth is then de Moivre, and the kernel's whole node structure is roots of unity.

**Proposition 17.1 (Kernel as normalized rotation).** With $s=\tan(\varphi/2)$ and $t=\varphi/2$,
$$(1+is)^N \;=\; \frac{e^{iNt}}{\cos^N t}, \qquad (1+s^2)^{\lfloor N/2\rfloor} \;=\; \frac{1}{\cos^{2\lfloor N/2\rfloor} t}\ (\cos t>0),$$
so, writing $2\lfloor N/2\rfloor = N-\epsilon$ with $\epsilon=0$ for even $N$ and $\epsilon=1$ for odd,
$$K_N(\varphi) \;=\; \frac{\operatorname{Im}\big[e^{iNt}/\cos^N t\big]}{N\tan t\cdot \cos^{-(N-\epsilon)} t} \;=\; \frac{\sin(Nt)}{N\tan t}\cdot\frac{1}{\cos^{\epsilon} t} \;=\; \begin{cases} \dfrac{\sin(N\varphi/2)}{N\tan(\varphi/2)}, & N \text{ even},\\[2ex] \dfrac{\sin(N\varphi/2)}{N\sin(\varphi/2)}, & N \text{ odd}. \end{cases} \tag{17.2}$$

The $\cos^N t$ that would overflow any register cancels identically between numerator and normalization — the two are the *same* power of the same rotation, and the kernel is what survives the cancellation. This is the analytic content of "the $\pi$/​trig is a removable presentation" (§4.1, §11): the transcendental lives only in $\arg(1+is)=t$, the angle the observer never evaluates; the modulus is algebraic in $s$, and it cancels.

### 17.1a What the floor is doing

The two right-hand sides of (17.2) are the standard even and odd Dirichlet-type kernels, and the single slope expression produces both — the floor absorbs the parity, and the $\cos^{\epsilon}t$ it leaves behind is exactly the factor that converts $\tan$ into $\sin$ in the denominator. That is the whole content of the correction: **one rational form in $s$, valid at every $N$**, where the $N/2$ exponent was one rational form valid at the even ones and silently wrong at the rest.

Silently is the operative word, and the size of the failure is worth recording because it is neither small nor where one would look for it. With the even exponent at odd $N$, the discrepancy against the true kernel is
$$\sup_\varphi\Big|K_N(\varphi)-\tfrac{\operatorname{Im}[(1+is)^N]}{N s(1+s^2)^{N/2}}\Big| \;=\; \frac1N,$$
attained **at the antipode** $\varphi=\pi$ — measured $0.33328$ at $N=3$, $0.19997$ at $N=5$, $0.058814$ at $N=17$ and $0.0153814$ at $N=65$, against $1/N$ of $0.3\overline{3}$, $0.2$, $0.0588235$, $0.0153846$. The mechanism is immediate from (17.2): at $\varphi=\pi$ the even form carries $\tan(\varphi/2)=\infty$ in its denominator and returns $0$, while the odd kernel has $\sin(\varphi/2)=1$ there and takes the value $\pm 1/N$.

An odd $N$ has no leaf at the antipode — the leaves are odd multiples of $\pi/N$ and $N$ is odd, so $\varphi=\pi$ is a *non-node* — which is precisely why the error hides: it sits at the one place the node tests of §17.2 do not look. **The nodes stay exact to $10^{-16}$ while the interpolant is wrong by $1/N$ between them**, and no amount of checking (R2) finds it. This is the same failure the main paper's §11 correction reports and its Appendix B measures at $2.7\times10^{-2}$; it is recorded here in the coordinate where the cause is visible rather than the symptom.

### 17.2 Proof of (R1)–(R2)

Everything reduces to the zeros of $\operatorname{Im}[(1+is)^N]=\sin(Nt)/\cos^N t$, i.e. to $\sin(N\varphi/2)=0$.

*Off-diagonal vanishing.* For leaves $\theta_j,\theta_k$ ($j,k$ odd), $\varphi=\theta_j-\theta_k=(j-k)\pi/N$ with $j-k$ even and nonzero, so $t=\varphi/2=(j-k)\pi/(2N)=m\pi/N$, $m=(j-k)/2$ a nonzero integer. Then $\sin(Nt)=\sin(m\pi)=0$ while $\tan t\neq 0$ (unless $|m|=N/2$, which requires $N$ even — see below), giving $K_N(\theta_j-\theta_k)=0$. The zeros of the kernel *are* the $N$-th roots of unity read through (17.1): $e^{iNt}=e^{im\pi}=(-1)^m$ has vanishing imaginary part exactly when $m\in\mathbb{Z}$, which is exactly the leaf spacing. (R2)'s $\delta_{jk}$ is the statement that a normalized rotation raised to $N$ lands on the real axis precisely at the nodes.

*The antipodal / half-weight case (even $N$ only).* This case exists because an even $N$ has leaf pairs exactly $\pi$ apart; an odd $N$ has none, and correspondingly no half-weight top mode — the parity appearing as structure rather than as bookkeeping, and the reason the $\tfrac12$ of §§18–19 is an even-$N$ statement throughout. When $|m|=N/2$ (the pair $j-k=\pm N$), $t=\pm\pi/2$, $\tan t$ diverges and $\cos^N t\to 0$; (17.1) degenerates because $1+is\to\infty$. The product form $K_N=\sin(N\varphi/2)\cos(\varphi/2)/(N\sin(\varphi/2))$ carries the removable point, giving $K_N(\pm\pi)=0$ through the vanishing $\cos(\varphi/2)$. This is the same top-mode subtlety that §18 reads as the Nyquist self-overlap and §19 as the lower frame bound.

*Diagonal.* At $j=k$, $t\to 0$, $e^{iNt}/\cos^N t\to 1$ and $\sin(Nt)/(N\tan t)\to 1$, so $K_N(0)=1$. Hence $K_N(\theta_j-\theta_k)=\delta_{jk}$, which is (R2); (R1) follows as in §6.1 ($\Phi_d\Psi_d(c)_j=\sum_k c_k\delta_{jk}=c_j$). $\square$

### 17.3 Numerical verification

The identity (17.2) — the *rational-in-$s$* right side against the trigonometric kernel — verified on $\varphi\in[-\pi/2,\pi/2]$ (so $|s|\le 1$, no float64 overflow; the identity holds for all $\varphi$, the range only keeps the naive power in register):

| $N$ | parity | $\max_\varphi\,\big|K_N-\operatorname{Im}[(1+is)^N]/(Ns(1+s^2)^{\lfloor N/2\rfloor})\big|$ |
|---|---|---|
| 8 | even | $6.7\times10^{-16}$ |
| 9 | odd | $5.6\times10^{-16}$ |
| 32 | even | $1.9\times10^{-15}$ |
| 33 | odd | $2.1\times10^{-15}$ |
| 128 | even | $6.2\times10^{-15}$ |
| 129 | odd | $6.2\times10^{-15}$ |
| 1024 | even | $4.2\times10^{-14}$ |
| 1025 | odd | $4.1\times10^{-14}$ |

The odd rows are the reason to run them: the floor form is not merely *defensible* at odd $N$, it is accurate there to the same $10^{-15}$ and with the same growth as at even $N$ — the parity has been absorbed, not patched around. (Compare §17.1a: with the $N/2$ exponent those rows would read $1/N$, twelve to thirteen orders worse.)

The growth is ordinary float64 accumulation in $(1+s^2)^{\lfloor N/2\rfloor}$, not drift in the identity: evaluated through the de Moivre form (17.1) the cancellation of $\cos^N t$ is exact by construction, which is the proposition's point — the overflow-prone modulus is never actually formed.

**Trig-free verification of record (`tb_trigfree.py`, zero trig calls).** The exponent $\lfloor N/2\rfloor$ is an integer at every $N$, so the kernel is a rational function of the held slope at every $N$ — a fact the floor form makes plain and the $N/2$ form obscured, since at odd $N$ a half-integer power of $1+s^2$ is not rational in $s$ at all and so cannot be what an observer confined to ratios evaluates. At this companion's $N=2^{d+1}$ the distinction is invisible: $N$ is even, $(1+s^2)^{N/2}$ is already an integer power, and $K_N$ is a *pure rational function of the held slope* — not even the single $\sqrt{1+s^2}$ of §11 survives in the kernel itself. Symbolic evaluation (sympy, no trig) gives the exact forms, matching §11:
$$K_2(s)=\frac{1}{1+s^2},\qquad K_4(s)=\frac{1-s^2}{(1+s^2)^2},\qquad K_8(s)=\frac{-s^6+7s^4-7s^2+1}{(1+s^2)^4},$$
$K_2$ being the Cauchy measure itself (§11). The interpolation identity (R1)–(R2) was re-verified with the kernel evaluated *only* as this rational function of constructible leaf slopes — the leaves built by bisection (one $\sqrt{\,}$, the half-angle $s\mapsto s/(1+\sqrt{1+s^2})$) and tangent-addition (Möbius, rational), the kernel by integer-power arithmetic — with **the trigonometric-call count held at zero** in the §15.3 sense:

| $N$ | $d$ | $\max_{j,k}\,|K_N(\theta_j-\theta_k)-\delta_{jk}|$ | trig calls |
|---|---|---|---|
| 8 | 2 | $1.1\times10^{-16}$ | 0 |
| 16 | 3 | $2.0\times10^{-16}$ | 0 |
| 32 | 4 | $1.6\times10^{-16}$ | 0 |
| 64 | 5 | $1.8\times10^{-16}$ | 0 |

(Beyond $N=64$ the naive $(1+s^2)^{\lfloor N/2\rfloor}$ overflows float64 for near-antipodal slopes — the §17.1 range artifact, removed by evaluating the reduced rational form or the de Moivre cancellation; the identity is exact at every $N$.) This is the section's operational claim discharged: §17 is proved in the angle chart (de Moivre) but *runs* in the slope chart with no transcendental evaluated — the observer's court.

### 17.4 Reading

This is the shortest road to (R1)–(R2), and it is the one the framework should prefer because it is built from the observer's own bricks. The four-in-one of §11 — tangent as map, Cauchy as its Jacobian, Möbius as its group law, dyadic depth as its iteration — is here joined by a fifth face that was implicit all along: **the complex number $1+is$ is the atom's slope lifted to $\mathbb{C}$, its modulus the algebraic tier the observer keeps and its argument the angle the observer declines.** Raising to $N$ is the depth; the kernel is the imaginary part; the nodes are where the rotation returns to the real axis. The proof needs no interpolation theory, no Lebesgue constant, no Jackson estimate — only that a unit direction raised to $N$ has $N$ real-axis crossings, which is the roots-of-unity fact underneath every equispaced construction, here wearing the tangent's normalization.

---

## 18. The aliasing proof: reconstruction is folding, error is out-of-band mass

### 18.1 Statement

The $L^\infty$ proof of §6.3 bounds the error by the function's *local* variation ($\omega_F$). The Fourier proof bounds it by the function's *global spectral tail*, and gets (R1)–(R3) from a single identity: on the leaf grid the interpolation operator $P_d=\Psi_d\Phi_d$ acts on Fourier modes by folding.

**Proposition 18.1 (Aliasing law).** Let the leaves be $\theta_k=k\pi/N$, $k$ odd, $N=2^{d+1}$. Sampling the pure mode $e^{im\theta}$ at the leaves gives $e^{imk\pi/N}$, and

- **(mod $2N$ identity)** $e^{i(m+2N)\theta_k}=e^{im\theta_k}$ — modes congruent mod $2N$ have identical leaf samples;
- **(sign twist per $N$)** $e^{i(m+N)\theta_k}=e^{im\theta_k}\,e^{ik\pi}=-\,e^{im\theta_k}$ since $k$ is odd — a shift by $N$ *negates* the samples.

Consequently the interpolant of $F=\sum_m c_m e^{im\theta}$ has, at each principal band mode $\mu\in(-N/2,\,N/2]$, the folded coefficient
$$\widehat{P_dF}(\mu) \;=\; \sum_{a\in\mathbb{Z}} (-1)^{a}\,c_{\mu+aN}, \tag{18.1}$$
the Nyquist mode $\mu=N/2$ realized as the half-weight visible top mode $\sin(N\theta/2)$ (the pair $\pm N/2$ each entering at weight $\tfrac12$).

### 18.2 Proof

*(R2), diagonal survival.* For $|\mu|<N/2$ the mode $e^{i\mu\theta}$ lies in $V_N$ and is fixed: the $a=0$ term of (18.1) is $c_\mu$ and no other $a$ contributes at the nodes to a band mode, so $P_d e^{i\mu\theta}=e^{i\mu\theta}$. At a leaf, $P_dF(\theta_k)=\sum_\mu\widehat{P_dF}(\mu)e^{i\mu\theta_k}=\sum_m c_m e^{im\theta_k}=F(\theta_k)$ because the fold (18.1) is exactly the regrouping of the sampled series by residue class — the samples are untouched. This is (R2).

*(R1), idempotence.* Applying $P_d$ again folds an already-folded coefficient: the inner sum in (18.1) over a sequence already supported on one band mode returns it unchanged, so $P_d^2=P_d$; restricted to leaf data $\Phi_d\Psi_d=\mathrm{id}$. Aliasing is a projection, which is (R1).

*(R3), error as tail mass.* Subtracting,
$$P_dF-F \;=\; \sum_{\mu\in(-N/2,N/2]}\Big(\underbrace{\sum_{a\neq 0}(-1)^a c_{\mu+aN}}_{\text{aliased in}}\Big)e^{i\mu\theta} \;-\; \sum_{|m|\ge N/2}c_m e^{im\theta},$$
so both the error introduced in-band and the truncated tail are controlled by the out-of-band coefficients $\{c_m:|m|\ge N/2\}$. Bounding $\|P_dF-F\|_\infty\le 2\sum_{|m|\ge N/2}|c_m|$ and inserting the classical decay of $c_m$ against the modulus of continuity recovers (R3); the Poisson-summation identity (18.1) *is* the exact form of "bounded between," now read as folded spectral mass rather than local wiggle. $\square$

### 18.3 Numerical verification

The modal action of $P_d$ at $N=8$ (band $(-4,4]$, Nyquist $\mu=4$), read off the reconstructed interpolant of each $e^{im\theta}$ to $\sim10^{-14}$ (`aliasing_table`):

| input mode $m$ | interpolant | rule |
|---|---|---|
| $-3,\dots,3$ | $e^{im\theta}$ (coeff $+1$) | in band, fixed (R2) |
| $4$ | $+\tfrac12 e^{i4\theta}-\tfrac12 e^{-i4\theta}=i\sin(4\theta)$ | Nyquist, **half weight** |
| $-4$ | $-i\sin(4\theta)$ | Nyquist, half weight |
| $5$ | $-e^{-i3\theta}$ | $5=-3+N$, **sign flip** |
| $6,7,8$ | $-e^{-i2\theta},-e^{-i\theta},-e^{0}$ | $m=\mu+N$, sign flip |
| $-8$ | $-e^{0}=-1$ | $-8=0-N$, sign flip |

Every entry matches (18.1) exactly, including the sign twist (the odd-node signature) and the $\pm\tfrac12$ Nyquist split. The visible top mode is $\sin(N\theta/2)$, not $\cos(N\theta/2)$: at odd leaves $\cos(N\theta_k/2)=\cos(k\pi/2)=0$, so the cosine top mode is the *invisible* direction (the $\sin(N\varphi)$ null direction of §15.3), and the imaginary $\sin$ combination is what the fold delivers.

### 18.4 Reading

The aliasing law is the theorem's spectral spine. It makes "the observer holds atoms and shows them continuous" precise in the dual: **what the leaf grid keeps is the spectrum mod $2N$ with a sign; what it loses is folded, not dropped, and the error is exactly the folded mass.** The half-weight Nyquist mode is not a convention but the unique self-consistent handling of the one frequency the grid sees ambiguously — $+N/2$ and $-N/2$ are the same sampled direction up to sign, and splitting them evenly is what keeps the fold a projection (R1). This is the same $\tfrac12$ that §4.1 puts on the top mode of the kernel expansion and that §19 reads as the lower frame bound. The (R4) divergence of §6.4 is, in this court, the statement that folded mass need not vanish for merely continuous $F$ — the Fejér cure (set aside below) replaces the projecting fold with an averaging one that does.

---

## 19. The energy face: exact Parseval, and the log is a sup-norm artifact

### 19.1 Statement

Everything in the paper is measured in $\|\cdot\|_\infty$, which is why $\Lambda_N\sim\psi_1\ln N$ is everywhere. The theorem has an $L^2$ face with a sharply different constant, and stating it isolates *where the logarithm comes from* — the norm, not the recovery.

**Proposition 19.1 (Discrete Parseval).** The map from leaf values $c\in\mathbb{R}^N$ to modal coordinates in the orthonormal basis of $V_N$
$$\Big\{\,\tfrac1{\sqrt N},\ \sqrt{\tfrac2N}\cos(m\theta),\ \sqrt{\tfrac2N}\sin(m\theta)\ (1\le m<\tfrac N2),\ \tfrac1{\sqrt N}\sin(\tfrac N2\theta)\,\Big\}$$
sampled at the leaves is orthogonal: leaf-value energy equals modal energy, $\|c\|^2=\sum|\text{coord}|^2$, exactly.

**Proposition 19.2 (Tight frame bounds, no log).** In the density-normalized $L^2$ inner product the reverse map is a frame with bounds independent of $N$,
$$\tfrac12\,\|c\|_{\ell^2}^2 \;\le\; \frac{N}{2\pi}\,\|\Psi_d(c)\|_{L^2(S^1)}^2 \;\le\; 1\cdot\|c\|_{\ell^2}^2,$$
the upper bound $1$ and the lower bound $\tfrac12$ both attained; the lower bound $\tfrac12$ is carried by the visible top mode $\sin(N\theta/2)$ (§18's half weight). Hence $\|\Psi_d\|$ is bounded uniformly in $N$, while the interpolation operator's $L^\infty$ norm is $\Lambda_N=\psi_1\ln N+O(1)$.

### 19.2 Proof

Proposition 19.1 is the unitarity of the sampled orthonormal basis: the Gram matrix $B^\top B=I$ to machine precision (below), so $B$ is orthogonal and $\|c\|^2=\|B^\top c\|^2$ — a discrete Parseval, exact because the DFT on the $N$ shifted nodes is unitary and the half-weight top mode is precisely the normalization that keeps the visible modes count at $N$. Proposition 19.2 is the spectrum of the $L^2$ Gram of the kernel translates $M_{jk}=\langle K_N(\cdot-\theta_j),K_N(\cdot-\theta_k)\rangle_{L^2}$: its density-normalized eigenvalues are exactly $\{1\ (\text{mult }N-1),\ \tfrac12\ (\text{mult }1)\}$, the single $\tfrac12$ eigenvector being the top mode. The frame inequality is that spectrum; the upper bound $1$ says the presentation never amplifies energy, and the lower bound $\tfrac12$ says it attenuates only the one Nyquist direction, and only by half. $\square$

### 19.3 Numerical verification

`tb_verify2.py` / `tb_verify3.py`:

| $N$ | $\|B^\top B-I\|$ | $\big|\,\|c\|^2-\|\text{coords}\|^2\,\big|$ | upper frame | lower frame | $\Lambda_N$ | $\Lambda_N/(\psi_1\ln N)$ |
|---|---|---|---|---|---|---|
| 8 | $2.3\times10^{-16}$ | $8.9\times10^{-16}$ | $1.00000$ | $0.50000$ | $1.848$ | $1.396$ |
| 32 | $2.0\times10^{-15}$ | $7.1\times10^{-15}$ | $1.00000$ | $0.50000$ | $2.728$ | $1.236$ |
| 128 | $3.4\times10^{-15}$ | $5.7\times10^{-14}$ | $1.00000$ | $0.50000$ | $3.610$ | $1.169$ |
| 512 | $1.6\times10^{-14}$ | $4.6\times10^{-13}$ | $1.00000$ | $0.50000$ | $4.493$ | $1.131$ |

The frame bounds are flat at $[\tfrac12,1]$ for every $N$; the Lebesgue constant climbs, its ratio to $\psi_1\ln N$ descending toward $1$ as the $O(1)$ term washes out (consistent with the §7.4 value $\Lambda_N=\psi_1\ln N+O(1)$, $\psi_1=2/\pi$).

**The $\tfrac12$ is an exact algebraic eigenvalue, and its $\pi$ is the surveyor's normalization (`tb_gram2.py`, zero trig).** Pushed into the slope chart under $x=\tan(\theta/2)$, $d\theta=2\,dx/(1+x^2)$, each translate $K_N(\theta-\theta_j)$ becomes $R_N$ of the Möbius-shifted slope $(x-x_j)/(1+xx_j)$ — rational in $x$ — so every Gram entry is the integral of a rational function against the Cauchy measure. For $N=2$ this is exact (sympy, no trig; leaf slopes $x_{\pm1}=\pm1$). The *raw* integral carries the arc-length $\pi$,
$$\big[\langle K_2(\cdot-\theta_j),K_2(\cdot-\theta_k)\rangle\big]_{jk}=\begin{pmatrix}3\pi/4 & \pi/4\\[2pt] \pi/4 & 3\pi/4\end{pmatrix},$$
and the density normalization $N/2\pi=1/\pi$ divides it out exactly, leaving the **rational** Gram
$$\tilde M=\begin{pmatrix}3/4 & 1/4\\[2pt] 1/4 & 3/4\end{pmatrix},\qquad \operatorname{eig}(\tilde M)=\{\,1,\ \tfrac12\,\},$$
both eigenvalues exact rationals. The $\tfrac12$ is not a fitted figure but the smaller eigenvalue of a $2\times2$ rational matrix; the $\pi$ that would carry it was the surveyor's count of the arc, cancelled the way §7.5 cancels the $\pi$ in the Lebesgue coefficient — the integral of a rational function over $\mathbb{R}$ is $\pi\times$(algebraic), and the normalization eats the $\pi$. A zero-trig numeric Gram (leaf slopes by bisection, kernel rational, a *rational* change-of-variables quadrature $x=t/(1-t^2)$ so no trig places a node) confirms the spectrum at every depth:

| $N$ | min eigenvalue | max eigenvalue | multiplicity at $\tfrac12$ | at $1$ |
|---|---|---|---|---|
| 4 | $0.500000$ | $1.000000$ | 1 | 3 |
| 8 | $0.500000$ | $1.000000$ | 1 | 7 |
| 16 | $0.500000$ | $1.000000$ | 1 | 15 |
| 32 | $0.500000$ | $1.000000$ | 1 | 31 |

So the frame bounds $[\tfrac12,1]$ are algebraic, computed with no transcendental evaluated, and the single attenuated direction — the top mode — carries the eigenvalue $\tfrac12$ exactly.

### 19.4 Reading

The two constants are the whole point. **In energy the bounded observer is a tight frame with bounds $[\tfrac12,1]$, uniformly in depth; the logarithm that governs the $L^\infty$ story is absent.** So the $\psi_1\ln N$ amplification of §7.4 is not a property of the recovery but of the *court it is scored in*: sup-norm interpolation pays it, energy recovery does not. This does not cheapen §7.4 — the pointwise bound is the honest one for a presentation queried at single points (the held-open-circle read of §5.2), and the universal floor of §7.4 binds it — but it locates the logarithm exactly, the way §7.5 located the $\pi$: a coordinate/court placement, not an intrinsic cost. And the lower frame bound $\tfrac12$ is the third sighting of one object. The half-weight top mode is the coefficient $1$-not-$2$ on $\cos(N\varphi/2)$ in the kernel expansion (§4.1, §6.3), the $\pm\tfrac12$ Nyquist split in the aliasing table (§18.3), and the one attenuated frame direction here (§19.3) — the same $\tfrac12$ read in three courts, and in each it is the price of the single frequency a bounded observer sees only up to sign.

---

## 20. Trig-free status, by court

The three sections do not stand in the same relation to the observer's chart, and the distinction is the framework's own proved-in-angle / operates-in-slope seam (§4.1, §11), read at three levels: the *object* (can the result be posed with the held slope alone?), the *proof* (is the derivation angular?), and the *verification* (were transcendentals evaluated in the check?).

**§17 operates in the slope chart — trig-free, demonstrated.** The kernel is a pure rational function of the held slope (§17.3), and (R1)–(R2) verify with the trig-call count held at zero, matching the §15.3 harness. The proof is written with de Moivre, an angular convenience, but the operation evaluates no transcendental; the angle is removable exactly as in §6.3. This is the section that belongs in the observer's court.

**§19's frame bounds are algebraic — the $\tfrac12$ exact, the $\pi$ cancelled.** The energy content is basis-free (Parseval) and the frame bounds are eigenvalues of a Cauchy-weighted rational Gram, computed with no trig; the $\pi$ appears only as the surveyor's arc normalization and divides out (§19.3), leaving rational eigenvalues. Displayed above in the $\cos/\sin$ basis for familiarity, but that display is removable — the result is the observer's.

**§18 is the surveyor's court by nature, and rightly so.** The Fourier modes *can* be algebraized — the Cayley transform $e^{i\theta}=(1+is)/(1-is)$ makes mode $m$ the Blaschke/Möbius power $\big[(1+is)/(1-is)\big]^m$, rational in the slope, so aliasing becomes those rational functions coinciding at the leaf slopes and the sign twist becomes $\big[(1+is_k)/(1-is_k)\big]^N=-1$. But the frequency picture is the completed-circle object (§1, §13): folding-mod-$2N$ is a statement about all modes present at once, the surveyor's arc laid out whole. Algebraizing it buys the observer nothing, because the observer never holds the completed circle the fold quantifies over. §18 is trig-free-*able* and angle-chart-*native* (the completed-circle court) — and that is exactly the classical-bound-lives-in-its-native-court principle of the abstract, applied to the aliasing law.

**§21 (the FFT) runs trig-free — the twiddle table is the leaf lattice.** The Cooley–Tukey twiddles are Cayley images $(1-is_p)/(1+is_p)$ of the constructible leaf slopes (21.2), so a full radix-2 FFT runs with zero trig calls (§21.4, verified to $N=1024$). It joins §17 and §19 in the observer's court: the spectral transform is the cascade the observer already runs to hold its rungs, carried on slopes composed by Möbius.

One honest correction carried forward: the first-pass verifications (`tb_verify*.py`) were run in the angle chart and *did* call `sin`/`cos`/`tan`. The trig-free harnesses of record are `tb_trigfree.py` (§17, zero trig calls), `tb_gram2.py` (§19, exact + zero-trig numeric), and `tb_fft2.py` (§21, zero-trig FFT); §18 was verified only in the angle chart, appropriately.

---

## 21. The FFT is the cascade

### 21.1 Statement

The paper forces the radix in §2.4 — the halving is *by two* because $g=2$ is the unique dilation under which the cascade tiles — and until now that forcing pays only a spatial dividend (the nested leaves of §5.3, the MRA of §14). It pays a spectral one too, and it is the classical one: because $N=2^{d+1}$, the leaf-values-to-modes transform is a radix-2 DFT, its Cooley–Tukey factorization is $O(N\log N)$, and the butterfly recursion *is* the dyadic cascade — the same doubling map $G:\theta\mapsto2\theta$ of §5.3, read on the dual lattice. The observer computes its own spectrum in $O(K\log K)$ by running the cascade that already synthesizes its rungs (§16); the transform is not a separate act laid on top of the holding, it is the holding's own recursion read in the dual. And it runs trig-free: the twiddle table is the leaf lattice itself.

Three facts carry it, each verified to machine precision (`tb_fft.py`, `tb_fft2.py`).

### 21.2 The half-shift factorization, and the §18 sign twist as its twiddle

The leaves sit at odd multiples of $\pi/N$ — the standard $N$-point grid shifted by a half step $\pi/N$ (the odd-node signature of §2.2). Sampling $e^{im\theta}$ there,
$$c_m=\frac1N\sum_{j=0}^{N-1}F(\theta_j)\,e^{-im\theta_j}=\underbrace{e^{-im\pi/N}}_{\text{half-shift twiddle}}\cdot\frac1N\underbrace{\sum_j F(\theta_j)\,e^{-2\pi i mj/N}}_{\text{standard radix-2 DFT}}, \tag{21.1}$$
**with the indexing $\theta_j=(2j+1)\pi/N$, $j=0,\dots,N-1$** — the leaves enumerated from $\pi/N$ once around, which is the convention (21.1) assumes and the one an implementation must adopt. This is worth stating because the main paper's §1 defines the same set differently, as the symmetric list $\theta_k=k\pi/N$ with $k$ odd and $|k|\le N-1$, and the two enumerations are a cyclic shift of $N/2$ apart. That shift is not free: it is worth $e^{-im\pi}=(-1)^m$ in the transform, so on the symmetric list, sorted, (21.1) reads
$$c_m=(-1)^m\,e^{-im\pi/N}\cdot\frac1N\sum_j F(\theta_j)\,e^{-2\pi i mj/N}. \tag{21.1$'$}$$
Sorting §1's list and handing it to a standard FFT under (21.1) therefore negates every odd mode — an $O(1)$ error, and a quiet one, because it survives an (R1) round-trip intact: the forward and reverse maps make the same sign choice and it cancels. It shows up only when a spectrum is read, compared, or filtered. The $(-1)^m$ is not an accident of bookkeeping either; it is the same sign the section meets twice more below, and §18.1 a third time. Verified against the direct transform, in the (21.1) indexing:

| $N$ | $\max_m\big|c_m^{\text{direct}}-c_m^{\text{FFT}\times\text{twiddle}}\big|$ |
|---|---|
| 8 | $7.3\times10^{-16}$ |
| 64 | $4.5\times10^{-15}$ |
| 512 | $1.2\times10^{-14}$ |

The half-shift twiddle is not new structure — it *is* the sign twist of §18.1. Under the FFT's $N$-periodicity, $e^{-i(m-N)\pi/N}=e^{-im\pi/N}e^{i\pi}=-\,e^{-im\pi/N}$: the mode $m$ and its alias $m-N$ carry opposite twiddles, exactly the $(-1)^k$-from-odd-$k$ negation that §18 read as the odd-node fold. Measured at $N=8$, the ratio $e^{-i(m-N)\pi/N}/e^{-im\pi/N}=-1$ for every $m$, with the Nyquist $m=N/2$ giving twiddle $-i$ against $+i$ — the half-weight top mode (§18, §19) once more, here as the Nyquist twiddle.

### 21.3 The butterfly pairing is the doubling-map fiber

The conceptual identity is cleanest in decimation-in-frequency. One radix-2 DIF stage pairs input $j$ with $j+N/2$ and forms sum and difference (the difference twiddled). Those pairs are exactly the fibers of the doubling map: since $\theta_j=(2j+1)\pi/N$,
$$2\theta_j=(2j+1)\frac{2\pi}{N}=(2j+1)\frac{\pi}{N/2},$$
which is an odd multiple of $\pi/(N/2)$ — a *depth-$(d-1)$ leaf node* — and $2\theta_{j+N/2}=2\theta_j+2\pi\equiv2\theta_j$, so $j$ and $j+N/2$ share one image under $G:\theta\mapsto2\theta$. The two-to-one doubling map of §5.3 and the DIF butterfly pairing are the same two-to-one. Verified:

| $N$ | $\big|G(\theta_j)-G(\theta_{j+N/2})\big|$ | $2\theta_j$ on depth-$(d-1)$ grid |
|---|---|---|
| 8 | $1.1\times10^{-15}$ | $0$ (exact) |
| 64 | $1.1\times10^{-15}$ | $0$ (exact) |

And the two branches are the MRA split of §14: the sum-branch feeds the even output modes — the coarse depth-$(d-1)$ lattice — and the difference-branch the odd modes — the octave detail space $W_N$. Measured at $N=16$, the sum-branch reproduces the even modes to $0.0$ and the difference-branch the odd modes to $4.4\times10^{-16}$. So one butterfly stage = one application of the doubling map = one octave of the periodic Shannon MRA (§14): the $d+1$ stages of the FFT are the $d+1$ rungs of the cascade, peeled one octave at a time. The cascade fold $G$ (the home-anchored conjugate of the foundational §8 fold, §5.3) is the butterfly.

### 21.4 Trig-free: the twiddle table is the leaf lattice

The twiddles $W_N^{\,p}=e^{-2\pi i p/N}$ look transcendental, but under the Cayley transform they are the leaf slopes. With $s_p=\tan(p\pi/N)$ — the constructible leaf lattice, built by bisection ($\sqrt{\,}$) and Möbius addition exactly as in §17 —
$$W_N^{\,p}=e^{-2\pi i p/N}=\frac{1-i\,s_p}{1+i\,s_p}, \tag{21.2}$$
a rational function of the held slope (the Cayley/Blaschke map of §18.4, §20). So the FFT's twiddle table *is* the leaf lattice in the dual reading, and the butterfly's complex multiplications are Möbius compositions of rung-slopes — precisely the "dyadic halving and Möbius composition of tabulated rung-slopes" that §9.6 identifies as what a CORDIC-type transcendental evaluation is underneath. A full radix-2 FFT run with twiddles built only from (21.2), **zero trig calls**, against `numpy.fft`:

| $N$ | $\max\big|\text{FFT}_{\text{trig-free}}-\text{FFT}_{\text{numpy}}\big|$ | stages |
|---|---|---|
| 8 | $1.8\times10^{-15}$ | 3 |
| 64 | $5.6\times10^{-15}$ | 6 |
| 512 | $2.3\times10^{-13}$ | 9 |
| 1024 | $1.6\times10^{-12}$ | 10 |

(The drift is the ordinary $O(\log N)$ accumulation over the stages, from the constructible-slope twiddles rather than trig.) The twiddle at $p=N/2$ is $s_{N/2}=\tan(\pi/2)=\infty$, whose Cayley image is $-1$ — the Nyquist sign again — and the upper half of the table is $W_N^{\,p}=-\,W_N^{\,p-N/2}$, the same $\pm$ the section keeps meeting.

### 21.5 Reading

This is the strongest sense in which the framework's forced structure is not a cost but a gift. The radix-2 cascade is forced on the observer by §2.4 — it has no choice about how it holds — and that same forced recursion is, read in the dual, the fastest known algorithm for its own spectrum. The observer does not *decide* to compute an FFT; the on-demand rung synthesis of §16, the doubling map of §5.3, and the Cooley–Tukey butterfly are one recursion, and the spectrum falls out of the holding for free. In the four-faces reading of §11 — tangent as map, Cauchy as Jacobian, Möbius as group law, dyadic depth as iteration — the FFT is the *iteration* face made algorithmic: the butterfly is tangent-doubling, iterated $d+1$ times, and (21.2) shows its twiddles are the map's own group law (Möbius) applied to the leaf slopes. The completed-circle spectrum of §13 (Pontryagin duality) is the surveyor's object; the algorithm that reaches it is the observer's cascade, and the two meet at the butterfly. The forced radix pays a spatial dividend (nesting, MRA) and a spectral one (the FFT), and they are the same dividend counted twice, because the recursion that nests the leaves is the recursion that transforms them.

---

## 22. The Fejér cure: unconditional convergence, R2 surrendered

### 22.1 Statement

(R4) is the one place the theorem concedes: because $\Lambda_N\to\infty$, the uniform boundedness principle produces continuous $F$ whose interpolations diverge (§6.4, Faber). The concession is a property of the *interpolation* operator — the Dirichlet-type kernel $K_N$, exact at the atoms (R1, R2) but signed and log-amplified. Replacing it with its positive summability sibling removes the divergence for *every* continuous $F$, no Dini–Lipschitz restriction, and the trade is exact: the Fejér operator gives up (R1)–(R2) — it no longer reproduces the samples — in exchange for an operator norm of exactly $1$ and unconditional convergence. This is §6.4 answered in §6.4's own language: the pathology cannot survive because the operator that would have to diverge is a contraction.

### 22.2 Construction

The interpolation operator, in the mode domain (§18), applies multiplier $1$ across the band and $\tfrac12$ at Nyquist. The Fejér operator $\sigma_d$ applies the triangular Cesàro weights to the same discrete leaf transform:
$$\sigma_d(F)(\theta)=\sum_{|m|<N/2}\tau_m\,c_m\,e^{im\theta},\qquad \tau_m=\max\!\Big(0,\,1-\frac{|m|}{N/2}\Big),\qquad c_m=\frac1N\sum_k F(\theta_k)e^{-im\theta_k}, \tag{22.1}$$
using only the $N$ leaf readings — inside-bounded (R5) exactly as the bridge is. In space this is $\sigma_d(F)(\theta)=\sum_k F(\theta_k)\,\Phi_N(\theta-\theta_k)$ with the discrete Fejér kernel $\Phi_N(\varphi)=\tfrac1N\sum_m\tau_m e^{im\varphi}$, the nonnegative $\tfrac1N\cdot\tfrac1{M}\big(\sin(M\varphi/2)/\sin(\varphi/2)\big)^2$, $M=N/2$. Two structural notes: the top mode is weighted $\tau_{N/2}=0$ — the Fejér window *removes* the Nyquist mode outright, so the half-weight $\tfrac12$ that every other section negotiates simply does not arise here; and $\Phi_N$ is a positive combination of the Blaschke powers of §18.4, so like §18 the construction is spectral by nature (a Fourier summability method) though inside-bounded in its data.

### 22.3 The cure: operator norm exactly one

The positive kernel and the partition of unity together pin the norm. Since $\sum_k\Phi_N(\theta-\theta_k)=\tau_0=1$ (DC reproduced) and $\Phi_N\ge0$, the Lebesgue function is $\sum_k|\Phi_N(\theta-\theta_k)|=\sum_k\Phi_N(\theta-\theta_k)=1$ identically, so $\|\sigma_d\|_\infty=1$ for every $N$. Verified against the diverging interpolation constant:

| $N$ | $\Lambda_N$ (interpolation) | $\|\sigma_d\|$ (Fejér) | $\min\Phi_N$ | $|\text{PoU}-1|$ |
|---|---|---|---|---|
| 8 | $1.848$ | $1.00000$ | $-3\times10^{-17}$ | $7\times10^{-16}$ |
| 32 | $2.728$ | $1.00000$ | $\ge-8\times10^{-8}$ | $2\times10^{-15}$ |
| 128 | $3.610$ | $1.00000$ | $\ge-5\times10^{-9}$ | $8\times10^{-15}$ |
| 512 | $4.493$ | $1.00000$ | $\ge-3\times10^{-10}$ | $6\times10^{-14}$ |

(The kernel is nonnegative in closed form; the $-10^{-8}$ residues are roundoff in the truncated cosine sum, negligible against the $O(1/N)$ kernel scale.) With $\|\sigma_d\|=1$ uniformly and $\sigma_d e^{im\theta}=\tau_m e^{im\theta}\to e^{im\theta}$ for each fixed mode (trigonometric polynomials are dense), the uniform boundedness principle runs the *other* way: a uniformly bounded family converging on a dense set converges on all of $C(S^1)$. So $\sigma_d(F)\to F$ uniformly for **every** continuous $F$ — the §6.4 restriction is lifted. The same $\Lambda_N\to\infty$ that manufactured the divergent $F$ for interpolation is powerless here, because the Fejér norm does not grow.

### 22.4 The cost: R1, R2, and saturation

Nothing is free. The Fejér operator is not interpolatory — $\sigma_d(F)(\theta_k)\ne F(\theta_k)$ — and the triangular window damps every mode, so convergence saturates at first order even on content the bridge reconstructs exactly. Measured (`tb_fejer.py`):

| test $F$ | $N$ | interpolation sup-err | Fejér sup-err | Fejér node-err (R2 loss) |
|---|---|---|---|---|
| $\cos3\theta$ (band-limited) | 16 | $5\times10^{-15}$ | $3.75\times10^{-1}$ | $3.7\times10^{-1}$ |
| | 256 | $3\times10^{-14}$ | $2.34\times10^{-2}$ | $2.3\times10^{-2}$ |
| Lipschitz tent | 64 | $2.0\times10^{-2}$ | $7.6\times10^{-2}$ | $5.1\times10^{-2}$ |
| Weierstrass ($C^0$, Hölder) | 256 | $7.8\times10^{-3}$ | $6.3\times10^{-2}$ | $5.2\times10^{-2}$ |

The $\cos3\theta$ row is the saturation in the clear: the bridge reproduces a band mode exactly (R2), while Fejér damps it by $\tau_3=1-3/M$ and converges only as $3/M=O(1/N)$. The node error tracks the sup error and vanishes at the same $O(1/N)$ — R2 relaxed to near-interpolation, not abandoned. So the two operators are the two horns of §6.4: interpolation is exact at the atoms and amplifies by $\psi_1\ln N$, capable of divergence; Fejér is inexact at the atoms and amplifies by $1$, incapable of it. One keeps R1–R2 and risks R4; the other surrenders R1–R2 and secures R4 unconditionally.

### 22.5 Reading

This closes §6.4 without softening it. The divergence there is real, and §7.4 prices it as universal to finite-rank *interpolatory* recovery; the Fejér operator escapes precisely by not being interpolatory — it steps outside the class the lower bound governs, paying the exit fee in exactness and rate. In the paper's inside/outside language, (R4) was flagged as "the one clause stated in the outside's voice" (§6.4), quantifying over an infinite refinement the observer never completes; the Fejér reading hands the observer an inside-bounded operator that settles unconditionally, at the cost of the atom-exactness that made the holding *the* holding. The choice between them is the observer's version of the Dirichlet/Fejér decision, made on the same leaf data: a bridge that meets its atoms exactly and may ring, or a bridge that never rings and only approaches its atoms. It belongs, like §18, to the spectral court — a summability method for the completed-circle Fourier series — and like §18 it is inside-bounded in what it consumes: only the atoms, only the $K$ in view.

---

## Note

All spectral re-derivations scoped in this companion are now developed: §17 (complex-analytic reproof), §18 (aliasing), §19 (the energy face), §20 (trig-free status by court), §21 (the FFT as the cascade), §22 (the Fejér cure). Nothing remains set aside.

*Verification scripts (numpy/sympy/float64, Jul 2026). Angle-chart checks: `tb_verify.py`, `tb_verify2.py`, `tb_verify3.py`, `tb_fft.py` (§21 factorization, sign twist, doubling-map fiber), `tb_fejer.py` (§22 operator norm, positivity, convergence, node error). Trig-free harnesses of record: `tb_trigfree.py` (§17 kernel rational in the held slope; R1–R2 delta at zero trig calls), `tb_gram2.py` (§19 frame bounds — exact rational Gram for $N=2$ with the $\pi$ cancelling, zero-trig numeric spectrum $\{1^{(N-1)},\tfrac12^{(1)}\}$ through $N=32$), and `tb_fft2.py` (§21 zero-trig radix-2 FFT, twiddles as Cayley images of bisection slopes, matched to `numpy.fft` through $N=1024$). Sections 17–18 reprove R1–R3; section 19 is a new companion (the energy face); section 21 identifies the FFT with the cascade; section 22 cures the R4 divergence. No classical result is claimed as new; the framework-specific content is the tangent-as-lifted-rotation reading (17), the folded-mass error (18), the uniform tight-frame bound with its $\tfrac12$ top mode (19), the finding (§20) that §17, §19, §21 run trig-free in the observer's chart while §18 is the surveyor's completed-circle court by nature, the butterfly-is-the-doubling-map identity (21), and the Fejér operator as the norm-1 sibling that trades R1–R2 for unconditional convergence (22).*
