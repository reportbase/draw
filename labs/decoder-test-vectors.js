// DECODER TEST VECTORS (?lab=vec, ?lab=exa), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs
// can ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, TAU, flashStatus. It declares nothing the editor reads. Loaded the first time one of
// its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['decoder-test-vectors'] = function () {
        // ── DECODER TEST VECTORS (TVF §8) ─────────────────────────────────────────────
        // The format paper names three vectors that any decoder must reproduce, each an
        // identity with a proof behind it rather than a tolerance someone picked. They are
        // run here against the editor's own decoder — tvf.leafPositions, tvf.kernel,
        // tvf.evalAt, tvf.leafSlopes — so a bug in any of them shows up as a named
        // identity failing, which localises it faster than an error ratio drifting.
        //
        //   (i)   THE INVISIBLE MODE. cos(Nθ/2) is the even top character, and on the
        //         odd-node leaves it reads exactly zero at every leaf: cos((k+½)π) = 0.
        //         A decoder whose leaves sit half a leaf off (at 2πk/N) reads it as ±1
        //         instead, which is the quiet bug this vector exists to catch. Read twice:
        //         by cosine, and trig-free as Re[(1+is)^N]/(1+s²)^(N/2) at the leaf slopes.
        //   (ii)  THE BAND GRAM. The band basis {1, cos mθ, sin mθ (m < N/2), sin(Nθ/2)}
        //         evaluated at the leaves is orthogonal with Gram diag(N, N/2, …, N/2, N):
        //         discrete Parseval, with the doubled weight on the two extreme modes. And
        //         the decoder must present every one of those modes exactly between the
        //         leaves, the top mode included (its half-weight cos is invisible; its sin
        //         is not).
        //   (iii) THE HOME SUM. The Lebesgue function at home, Σ_k |K(0 − θ_k)|, equals
        //         (2/N)·Σ 1/τ_k over the positive leaves (τ_k their slopes), and that is the
        //         decoder's amplification peak: no point of the cell reads higher.
        //
        // In float64 "exactly" means to rounding; the tolerances below are ~10³ ulps of the
        // quantities involved, far under anything a bug would produce (the vectors fail by
        // O(1) when they fail at all). An exact-rational reference decoder, which would make
        // them identities to the last bit, is still open (§9).
        function runDecoderVectors(opts) {
            const t0 = performance.now();
            const ds = (opts && opts.ds) || [2, 3, 4, 5, 6, 7, 8, 9];
            const gramMax = 512;                     // the Gram is O(N³); 512 is 1.3e8 steps
            const rows = [];
            for (const d of ds) {
                const N = 2 << d;                    // N = 2^(d+1)
                const th = tvf.leafPositions(N), sl = tvf.leafSlopes(N);
                // (i) the invisible mode, by cosine and trig-free
                let invTrig = 0, invFree = 0, shifted = Infinity;
                for (let k = 0; k < N; k++) {
                    invTrig = Math.max(invTrig, Math.abs(Math.cos(N * th[k] / 2)));
                    const s = sl[k], q = 1 / Math.sqrt(1 + s * s);
                    let zr = q, zi = s * q, wr = 1, wi = 0, n = N;
                    while (n > 0) {
                        if (n & 1) { const t = wr * zr - wi * zi; wi = wr * zi + wi * zr; wr = t; }
                        const t2 = zr * zr - zi * zi; zi = 2 * zr * zi; zr = t2; n >>= 1;
                    }
                    invFree = Math.max(invFree, Math.abs(wr));
                    shifted = Math.min(shifted, Math.abs(Math.cos(N * (TAU * k / N) / 2)));
                }
                // (ii) the band Gram, and the decoder presenting each band mode
                const basis = [p => 1];
                for (let m = 1; m < N / 2; m++) { basis.push(p => Math.cos(m * p)); basis.push(p => Math.sin(m * p)); }
                basis.push(p => Math.sin(N * p / 2));
                let gram = null;
                if (N <= gramMax) {
                    const B = basis.map(f => Float64Array.from(th, f));
                    gram = 0;
                    for (let i = 0; i < N; i++) for (let j = i; j < N; j++) {
                        let g = 0;
                        const bi = B[i], bj = B[j];
                        for (let k = 0; k < N; k++) g += bi[k] * bj[k];
                        const want = i !== j ? 0 : (i === 0 || i === N - 1 ? N : N / 2);
                        gram = Math.max(gram, Math.abs(g - want) / N);
                    }
                }
                let present = 0;
                const probes = 9, step = Math.max(1, Math.floor(N / 64));
                for (let j = 0; j < N; j += step) {
                    const f = basis[j], v = Float64Array.from(th, f);
                    for (let q = 0; q < probes; q++) {
                        const p = TAU * (q + 0.3183) / probes;
                        present = Math.max(present, Math.abs(tvf.evalAt(v, p) - f(p)));
                    }
                }
                {   // and always the top mode itself, which is the one a wrong Nyquist weight breaks
                    const f = basis[N - 1], v = Float64Array.from(th, f);
                    for (let q = 0; q < probes; q++) { const p = TAU * (q + 0.3183) / probes; present = Math.max(present, Math.abs(tvf.evalAt(v, p) - f(p))); }
                }
                // (iii) the home sum against the Lebesgue function over one whole cell
                let home = 0;
                for (let k = 0; k < N / 2; k++) home += 1 / sl[k];
                home *= 2 / N;
                const leb = p => { let s = 0; for (let k = 0; k < N; k++) s += Math.abs(tvf.kernel(p - th[k], N)); return s; };
                const atHome = leb(0);
                let peak = 0, peakAt = 0;
                const G = 200;
                for (let g = -G; g <= G; g++) { const p = (g / G) * (Math.PI / N), L = leb(p); if (L > peak) { peak = L; peakAt = p; } }
                rows.push({ d, N, invTrig, invFree, shifted, gram, present, home, atHome, peak, peakAt: peakAt * N / Math.PI,
                            floor: (Math.SQRT2 - 1) * d / 2 });
            }
            const ok = r => r.invTrig < 1e-12 && r.invFree < 1e-12 && r.shifted > 0.999
                         && (r.gram == null || r.gram < 1e-12) && r.present < 1e-11
                         && Math.abs(r.atHome - r.home) < 1e-12 * r.home && Math.abs(r.peak - r.home) < 1e-12 * r.home
                         && r.home >= r.floor;
            for (const r of rows) r.ok = ok(r);
            return { rows, pass: rows.every(r => r.ok), ms: Math.round(performance.now() - t0) };
        }

        // On window so the smoke test can run the vectors against a deliberately broken
        // decoder and see them fail: a check that cannot fail checks nothing.
        window.runDecoderVectors = runDecoderVectors;

        function showDecoderVectors(res) {
            const e = x => x === 0 ? '0' : x.toExponential(0);
            const worst = k => Math.max(...res.rows.map(r => r[k] == null ? 0 : r[k]));
            const lam = res.rows.filter(r => [8, 32, 128, 512].includes(r.N)).map(r => 'Λ' + r.N + ' = ' + r.home.toFixed(3)).join(', ');
            flashStatus('decoder test vectors (TVF §8) · ' + res.rows.filter(r => r.ok).length + '/' + res.rows.length
            + ' depths pass, N = ' + res.rows[0].N + ' … ' + res.rows[res.rows.length - 1].N
            + ' · (i) the invisible mode cos(Nθ/2) reads 0 at every leaf, to ' + e(Math.max(worst('invTrig'), worst('invFree')))
            + ' by cosine and trig-free — and ±1 on a grid half a leaf off, which is the bug it catches'
            + ' · (ii) the band Gram is diag(N, N/2, …, N/2, N) to ' + e(worst('gram')) + ' of N, and the decoder presents every band mode, the top sin included, to ' + e(worst('present'))
            + ' · (iii) the Lebesgue function at home equals (2/N)·Σ 1/τ_k to ' + e(Math.max(...res.rows.map(r => Math.abs(r.atHome - r.home) / r.home)))
            + ' and no point of the cell reads higher: ' + lam
            + (res.pass ? '' : ' · FAILED at N = ' + res.rows.filter(r => !r.ok).map(r => r.N).join(', '))
            + ' · ' + res.ms + ' ms');
        }

        {
            const bDV = $('bDecoderVectors');
            if (bDV)
                bDV.addEventListener('click', () => {
                    bDV.disabled = true;
                    bDV.textContent = 'checking…';
                    setTimeout(() => {
                        try {
                            const res = runDecoderVectors();
                            window.__decoderVectors = res;       // the smoke test reads the numbers, not the prose
                            showDecoderVectors(res);
                        }
                        catch (e) {
                            flashStatus('decoder test vectors failed: ' + e.message);
                        }
                        finally {
                            bDV.disabled = false;
                            bDV.textContent = 'run the vectors';
                        }
                    }, 0);
                });
        }

        // ── THE EXACT REFERENCE DECODER (TVF §8) ──────────────────────────────────────
        // The vectors above hold to 10⁻¹³ in float64. The paper asks for more: a reference
        // decoder in which they are identities, so that a decoder can be checked against
        // something with no rounding in it at all. Because N is a power of two, there is
        // one that needs nothing but integers.
        //
        // Put ζ = e^{iπ/2N}. Then ζ^{2N} = −1, and x^{2N} + 1 is the cyclotomic polynomial
        // of order 4N, irreducible over ℚ: so 1, ζ, …, ζ^{2N−1} are linearly independent
        // and a number in ℤ[ζ] is zero exactly when its 2N integer coefficients are. Every
        // angle the format uses lies on this lattice: the leaves θ_k = (2k+1)π/N are ζ^{2(2k+1)},
        // their half-angles ζ^{2k+1}, home and the other midpoints ζ^{4j}. And the kernel is
        // a trigonometric polynomial,
        //
        //     2N·K_N(φ) = 2 + Σ_{m=1}^{N/2−1} 2·2cos(mφ) + 2cos(Nφ/2),      2cos(eπ/2N) = ζ^e + ζ^{−e},
        //
        // so at a lattice angle it is an element of ℤ[ζ] with small integer coefficients.
        // No division, no square root, no transcendental: the identities of the theorem
        // become equalities of integer vectors, and the test is ===.
        //
        // What it checks, at N = 8 … 1024 (the Gram to 256, where it costs N³):
        //   R2      2N·K(θ_j − θ_k) = 2N·δ_jk, every pair.
        //   PoU     Σ_k K(φ − θ_k) = 1 at every lattice angle of every class (on a leaf,
        //           at home, at the quarter points); translation by a leaf covers the rest.
        //   (i)     the invisible mode: 2cos(Nθ_k/2) = 0 at every leaf.
        //   (ii)    the band Gram: Σ_k b_i(θ_k) b_j(θ_k) = diag(N, N/2, …, N/2, N) exactly.
        //   (iii)   the home sum, leaf by leaf: N·K(−θ_k)·sin(θ_k/2) = (−1)^k cos(θ_k/2), so
        //           |K(−θ_k)| = 1/(N τ_k) exactly and Σ_k |K(−θ_k)| = (2/N)·Σ 1/τ_k.
        //   oracle  integer leaf data decoded exactly at lattice angles: real (the element
        //           equals its own conjugate), equal to the data at the leaves, and the
        //           float decoder (tvf.evalAt) measured against it.
        function runExactDecoder(opts) {
            const t0 = performance.now();
            const ds = (opts && opts.ds) || [2, 3, 4, 5, 6, 7, 8, 9];
            const nyq = (opts && opts.nyq) || 1;           // the top mode's weight; 1 is the theorem's
            const gramMax = (opts && opts.gramMax) || 256;
            const rows = [];
            let safe = true;
            for (const d of ds) {
                const N = 2 << d, M = 2 * N, P = 4 * N;    // ℤ[ζ]: M coefficients, exponents mod P
                const add = (a, e, c) => { e = ((e % P) + P) % P; if (e >= M) a[e - M] -= c; else a[e] += c; };
                const zero = a => a.every(v => v === 0);
                const isConst = (a, c) => a[0] === c && a.every((v, i) => i === 0 || v === 0);
                // 2N·K at the lattice angle eπ/2N, cached by e mod P (it depends on nothing else)
                const cache = new Map();
                const A = e => {
                    e = ((e % P) + P) % P;
                    let a = cache.get(e);
                    if (a) return a;
                    a = new Array(M).fill(0);
                    add(a, 0, 2);
                    for (let m = 1; m < N / 2; m++) { add(a, m * e, 2); add(a, -m * e, 2); }
                    add(a, (N / 2) * e, nyq); add(a, -(N / 2) * e, nyq);
                    cache.set(e, a);
                    return a;
                };
                const leafE = k => 2 * (2 * k + 1);
                // R2: by translation, the pairs are the differences θ_j − θ_k = 4(j−k) in ζ
                let r2 = true;
                for (let j = 0; j < N && r2; j++) r2 = isConst(A(4 * j), j === 0 ? 2 * N : 0);
                // partition of unity at one angle of each class: home (0), quarter (1), leaf (2), quarter (3)
                let pou = true;
                for (let p = 0; p < 4 && pou; p++) {
                    const s = new Array(M).fill(0);
                    for (let k = 0; k < N; k++) { const a = A(p - leafE(k)); for (let i = 0; i < M; i++) s[i] += a[i]; }
                    pou = isConst(s, 2 * N);
                }
                // (i) the invisible mode, and the same mode on the shifted (even-node) grid
                let inv = true, shiftedZero = 0;
                for (let k = 0; k < N; k++) {
                    const a = new Array(M).fill(0); add(a, (N / 2) * leafE(k), 1); add(a, -(N / 2) * leafE(k), 1);
                    if (!zero(a)) inv = false;
                    const b = new Array(M).fill(0); add(b, (N / 2) * 4 * k, 1); add(b, -(N / 2) * 4 * k, 1);
                    if (zero(b)) shiftedZero++;
                }
                // (ii) the band Gram, each basis value as at most two monomials scaled to ℤ[ζ]:
                // 2·1, 2cos = ζ^a + ζ^−a, 2i·sin = ζ^a − ζ^−a. Expected: (scale_i scale_j)·G_ij,
                // where 2·2 = 4 and (2i)(2i) = −4.
                let gram = null;
                if (N <= gramMax) {
                    const basis = [{ m: 0, s: 0 }];
                    for (let m = 1; m < N / 2; m++) basis.push({ m, s: 0 }, { m, s: 1 });
                    basis.push({ m: N / 2, s: 1 });
                    const terms = (b, k) => { const e = b.m * leafE(k);
                        return b.m === 0 ? [[0, 2]] : b.s ? [[e, 1], [-e, -1]] : [[e, 1], [-e, 1]]; };
                    gram = true;
                    const acc = new Array(M);
                    for (let i = 0; i < N && gram; i++) for (let j = i; j < N && gram; j++) {
                        acc.fill(0);
                        for (let k = 0; k < N; k++) for (const [e1, c1] of terms(basis[i], k)) for (const [e2, c2] of terms(basis[j], k)) add(acc, e1 + e2, c1 * c2);
                        const want = i !== j ? 0 : (basis[i].s ? -4 : 4) * (i === 0 || i === N - 1 ? N : N / 2);
                        gram = isConst(acc, want);
                    }
                }
                // (iii) the home sum, leaf by leaf: A(−θ_k)·(ζ^a − ζ^−a) = 2(−1)^k·ζ^N·(ζ^a + ζ^−a), a = 2k+1
                let home = true;
                for (let k = 0; k < N && home; k++) {
                    const a = A(-leafE(k)), h = 2 * k + 1, lhs = new Array(M).fill(0), rhs = new Array(M).fill(0);
                    for (let i = 0; i < M; i++) if (a[i]) { add(lhs, i + h, a[i]); add(lhs, i - h, -a[i]); }
                    const sg = k & 1 ? -2 : 2;
                    add(rhs, N + h, sg); add(rhs, N - h, sg);
                    home = lhs.every((v, i) => v === rhs[i]);
                }
                // the oracle: seeded integer leaf data, decoded exactly at sixteen lattice angles
                let seed = 0x9e3779b9 ^ N;
                const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 2001) - 1000; };
                const c = Array.from({ length: N }, rnd);
                let real = true, atLeaves = true, floatDev = 0;
                const ps = [];
                for (let q = 0; q < 16; q++) ps.push((q * 37 + 1) % P);
                ps.push(leafE(0), leafE(N - 1), 0);
                for (const p of ps) {
                    const v = new Array(M).fill(0);
                    for (let k = 0; k < N; k++) { const a = A(p - leafE(k)); for (let i = 0; i < M; i++) if (a[i]) v[i] += c[k] * a[i]; }
                    for (let i = 0; i < M; i++) if (!Number.isSafeInteger(v[i])) safe = false;
                    // real: conj(ζ^e) = ζ^−e = −ζ^(2N−e), so the element is real when v[e] = −v[2N−e]
                    for (let i = 1; i < M; i++) if (v[i] !== -v[M - i]) { real = false; break; }
                    if (p % 4 === 2 && !isConst(v, 2 * N * c[((p / 2 - 1) / 2 + N) % N])) atLeaves = false;
                    // its value, read once in float for the comparison: Σ v_e cos(eπ/2N) / 2N
                    let x = 0;
                    for (let i = 0; i < M; i++) if (v[i]) x += v[i] * Math.cos(i * Math.PI / M);
                    x /= 2 * N;
                    floatDev = Math.max(floatDev, Math.abs(tvf.evalAt(Float64Array.from(c), p * Math.PI / M) - x) / 1000);
                }
                rows.push({ d, N, r2, pou, inv, shiftedZero, gram, home, real, atLeaves, floatDev });
            }
            for (const r of rows) r.ok = r.r2 && r.pou && r.inv && r.shiftedZero === 0 && r.gram !== false && r.home && r.real && r.atLeaves && r.floatDev < 1e-12;
            return { rows, safe, pass: safe && rows.every(r => r.ok), ms: Math.round(performance.now() - t0) };
        }

        window.runExactDecoder = runExactDecoder;

        function showExactDecoder(res) {
            const y = b => b ? 'exact' : 'FAILS';
            const all = k => res.rows.every(r => r[k] == null || r[k] === true);
            const lastGram = res.rows.filter(r => r.gram != null).pop();
            flashStatus('exact reference decoder (TVF §8) · ' + res.rows.filter(r => r.ok).length + '/' + res.rows.length
            + ' depths, N = ' + res.rows[0].N + ' … ' + res.rows[res.rows.length - 1].N + ', in ℤ[ζ], ζ = e^{iπ/2N}, ζ^{2N} = −1: integers only, every check an equality'
            + ' · R2 δ_jk ' + y(all('r2')) + ' · partition of unity at every lattice class ' + y(all('pou'))
            + ' · (i) invisible mode 0 at every leaf ' + y(all('inv')) + ' (and nonzero at every even node)'
            + ' · (ii) band Gram diag(N, N/2, …, N/2, N) ' + y(all('gram')) + (lastGram ? ' to N = ' + lastGram.N : '')
            + ' · (iii) N·K(−θ_k)·sin(θ_k/2) = ±cos(θ_k/2) at every leaf ' + y(all('home'))
            + ' · integer data decoded exactly: real ' + y(all('real')) + ', equal to the data at the leaves ' + y(all('atLeaves'))
            + ' · the float decoder against it: ' + Math.max(...res.rows.map(r => r.floatDev)).toExponential(1) + ' of the data scale'
            + (res.safe ? '' : ' · an integer outgrew 2^53, so this run proves nothing')
            + ' · ' + res.ms + ' ms');
        }

        {
            const bXD = $('bExactDecoder');
            if (bXD)
                bXD.addEventListener('click', () => {
                    bXD.disabled = true;
                    bXD.textContent = 'computing…';
                    setTimeout(() => {
                        try {
                            const res = runExactDecoder();
                            window.__exactDecoder = res;
                            showExactDecoder(res);
                        }
                        catch (e) {
                            flashStatus('exact decoder failed: ' + e.message);
                        }
                        finally {
                            bXD.disabled = false;
                            bXD.textContent = 'the exact decoder';
                        }
                    }, 0);
                });
        }
};
