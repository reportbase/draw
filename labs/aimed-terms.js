// AIMED TERMS AGAINST EVEN LEAVES (?lab=aim), written 3 Nov 2026 (Tom, of wander's EPI test of epicycles against aimed
// Cauchy terms: "yes, lets test on tvf draw labs."). wander's plans/epi-plan.md found, on four closed-form outlines,
// that aimed terms (Takenaka–Malmquist, Qian's adaptive Fourier decomposition: Szegő kernels at standpoints a inside
// the disc, a = 0 first on each part) drew a dent in 11 terms where the best Fourier circles took 85, and lost on a
// broad shape (19 against 10). Here the same greedy is put against this editor's own reader, the even leaves
// reconstructed by the library's kernel (tvf.reconstruct), on the library's figures, counted in reals.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's. From the editor it uses: $, PRIMITIVES, flashStatus, labLadder, tvf. It declares nothing the editor
// reads. Loaded the first time its button is pressed, or ?lab= asks for it.
(window.TVF_LABS = window.TVF_LABS || {})['aimed-terms'] = function () {
        // ── aimed terms against even leaves ──────────────────────────────────
        // Every figure is walked by arc length into AIM_M samples z(s), s = j/AIM_M, the truth.
        // The even reader: N leaves at s = (k + ½)/N (an even N), each channel reconstructed by
        // the library's kernel at the AIM_M samples; 2N reals. The aimed reader: the mean c₀,
        // then the forward part z₊ (k ≥ 1) and conj of the backward part (k ≤ −1), both in H²,
        // each taking a = 0 first and then, term by term, the standpoint a in the disc that
        // takes most energy, (1 − |a|²)|g(a)|², its coefficient ⟨g, e_a⟩, the remainder divided
        // by the Möbius factor (z − a)/(1 − āz); 4 reals a term (a and the coefficient), 2 for c₀.
        // Errors are relative L2 against ‖z − c₀‖ on the samples. The predictions in the drawer
        // were written before this ran.
        const AIM_M = 512,
            AIM_K = AIM_M / 2,
            AIM_RHO = 1 - 0.012,
            AIM_NMAX = 60,
            AIM_LEAVES = 256,
            AIM_FIGS = 40,
            AIM_TOLS = [1e-2, 1e-3];

        function aimFft(re, im, inv) {
            const n = re.length;
            for (let i = 1, j = 0; i < n; i++) {
                let bit = n >> 1;
                for (; j & bit; bit >>= 1)
                    j ^= bit;
                j ^= bit;
                if (i < j) {
                    let t = re[i];
                    re[i] = re[j];
                    re[j] = t;
                    t = im[i];
                    im[i] = im[j];
                    im[j] = t;
                }
            }
            for (let len = 2; len <= n; len <<= 1) {
                const ang = (inv ? 2 : -2) * Math.PI / len,
                    wr = Math.cos(ang),
                    wi = Math.sin(ang);
                for (let i = 0; i < n; i += len) {
                    let cr = 1,
                        ci = 0;
                    for (let k = 0; k < len / 2; k++) {
                        const a = i + k,
                            b = a + len / 2;
                        const xr = re[b] * cr - im[b] * ci,
                            xi = re[b] * ci + im[b] * cr;
                        re[b] = re[a] - xr;
                        im[b] = im[a] - xi;
                        re[a] += xr;
                        im[a] += xi;
                        const t = cr * wr - ci * wi;
                        ci = cr * wi + ci * wr;
                        cr = t;
                    }
                }
            }
        }

        // the figure walked by arc length, from its first vertex, at fractions s of the way round
        function aimWalk(pts, ss) {
            const n = pts.length,
                cum = new Float64Array(n + 1);
            for (let i = 1; i <= n; i++) {
                const p = pts[i - 1],
                    q = pts[i % n];
                cum[i] = cum[i - 1] + Math.hypot(q.x - p.x, q.y - p.y);
            }
            const L = cum[n],
                x = new Float64Array(ss.length),
                y = new Float64Array(ss.length);
            let i = 0;
            ss.forEach((s, j) => {
                const d = s * L;
                while (i < n - 1 && cum[i + 1] < d)
                    i++;
                while (i > 0 && cum[i] > d)
                    i--;
                const p = pts[i],
                    q = pts[(i + 1) % n],
                    g = cum[i + 1] - cum[i],
                    t = g > 0 ? (d - cum[i]) / g : 0;
                x[j] = p.x + t * (q.x - p.x);
                y[j] = p.y + t * (q.y - p.y);
            });
            return [x, y];
        }

        // ── the even leaves, the library's own reconstruction ──
        function aimEven(pts, z, c0, norm) {
            const errs = new Map();
            let at32 = null;
            for (let N = 4; N <= AIM_LEAVES; N += 2) {
                const ss = Array.from({
                    length: N
                }, (_, k) => (k + 0.5) / N);
                const [lx, ly] = aimWalk(pts, ss);
                const rx = tvf.reconstruct(lx, AIM_M),
                    ry = tvf.reconstruct(ly, AIM_M);
                let e = 0;
                const prof = N === 32 ? new Float64Array(AIM_M) : null;
                for (let j = 0; j < AIM_M; j++) {
                    const d = (z[0][j] - rx[j]) ** 2 + (z[1][j] - ry[j]) ** 2;
                    e += d;
                    if (prof)
                        prof[j] = d;
                }
                errs.set(N, Math.sqrt(e / AIM_M) / norm);
                if (prof)
                    at32 = prof;
            }
            return {
                errs,
                at32
            };
        }

        // ── the aimed terms ──
        function aimPart(re, im) {
            return {
                g: [Float64Array.from(re), Float64Array.from(im)],
                B: [new Float64Array(AIM_M).fill(1), new Float64Array(AIM_M)],
                ap: [new Float64Array(AIM_M), new Float64Array(AIM_M)],
                best: null
            };
        }
        const TH = Float64Array.from({
            length: AIM_M
        }, (_, j) => 2 * Math.PI * j / AIM_M);

        function aimBest(P) {
            if (P.best)
                return P.best;
            const cr = Float64Array.from(P.g[0]),
                ci = Float64Array.from(P.g[1]);
            aimFft(cr, ci, false);
            for (let k = 0; k < AIM_M; k++) {
                cr[k] /= AIM_M;
                ci[k] /= AIM_M;
            }
            const gain = (ar, ai) => { // (1 − |a|²)|g(a)|², g's positive coefficients by Horner
                let vr = 0,
                    vi = 0;
                for (let k = AIM_K - 1; k >= 0; k--) {
                    const t = vr * ar - vi * ai + cr[k];
                    vi = vr * ai + vi * ar + ci[k];
                    vr = t;
                }
                return (1 - ar * ar - ai * ai) * (vr * vr + vi * vi);
            };
            let best = {
                v: -1,
                ar: 0,
                ai: 0
            };
            const fr = new Float64Array(AIM_M),
                fi = new Float64Array(AIM_M);
            for (let ring = 0; ring < 32; ring++) {
                const x = ring * Math.log10(1 / (1 - AIM_RHO)) / 31,
                    rho = ring ? 1 - 10 ** (-x) : 0;
                fr.fill(0);
                fi.fill(0);
                let pw = 1;
                for (let k = 0; k < AIM_K; k++) {
                    fr[k] = cr[k] * pw;
                    fi[k] = ci[k] * pw;
                    pw *= rho;
                }
                aimFft(fr, fi, true); // g(ρ e^{iθ_j}) at every θ_j
                for (let j = 0; j < AIM_M; j++) {
                    const v = (1 - rho * rho) * (fr[j] * fr[j] + fi[j] * fi[j]);
                    if (v > best.v)
                        best = {
                            v,
                            ar: rho * Math.cos(TH[j]),
                            ai: rho * Math.sin(TH[j])
                        };
                }
            }
            // refine by Nelder–Mead in (logit of ρ, angle)
            const toA = p => {
                const r = AIM_RHO / (1 + Math.exp(-p[0]));
                return [r * Math.cos(p[1]), r * Math.sin(p[1])];
            };
            const f = p => -gain(...toA(p));
            const r0 = Math.min(Math.max(Math.hypot(best.ar, best.ai), 1e-4), AIM_RHO * 0.999);
            let S = [
                [Math.log(r0 / (AIM_RHO - r0)), Math.atan2(best.ai, best.ar)]
            ];
            S.push([S[0][0] + 0.3, S[0][1]], [S[0][0], S[0][1] + 0.05]);
            let F = S.map(f);
            for (let it = 0; it < 200; it++) {
                const o = [0, 1, 2].sort((a, b) => F[a] - F[b]);
                S = o.map(i => S[i]);
                F = o.map(i => F[i]);
                const c = [(S[0][0] + S[1][0]) / 2, (S[0][1] + S[1][1]) / 2];
                const at = t => [c[0] + t * (S[2][0] - c[0]), c[1] + t * (S[2][1] - c[1])];
                const xr = at(-1),
                    fr2 = f(xr);
                if (fr2 < F[0]) {
                    const xe = at(-2),
                        fe = f(xe);
                    if (fe < fr2) {
                        S[2] = xe;
                        F[2] = fe;
                    } else {
                        S[2] = xr;
                        F[2] = fr2;
                    }
                } else if (fr2 < F[1]) {
                    S[2] = xr;
                    F[2] = fr2;
                } else {
                    const xc = at(0.5),
                        fc = f(xc);
                    if (fc < F[2]) {
                        S[2] = xc;
                        F[2] = fc;
                    } else {
                        for (const i of [1, 2]) {
                            S[i] = [(S[0][0] + S[i][0]) / 2, (S[0][1] + S[i][1]) / 2];
                            F[i] = f(S[i]);
                        }
                    }
                }
                if (Math.abs(F[2] - F[0]) <= 1e-14 * Math.abs(F[0]) + 1e-300)
                    break;
            }
            const iMin = F.indexOf(Math.min(...F));
            if (-F[iMin] > best.v) {
                const [ar, ai] = toA(S[iMin]);
                best = {
                    v: -F[iMin],
                    ar,
                    ai
                };
            }
            P.best = best;
            return best;
        }

        function aimTake(P, ar, ai) {
            const s = Math.sqrt(1 - ar * ar - ai * ai);
            const ea = [new Float64Array(AIM_M), new Float64Array(AIM_M)];
            for (let j = 0; j < AIM_M; j++) { // e_a = √(1 − |a|²) / (1 − ā z)
                const dr = 1 - (ar * Math.cos(TH[j]) + ai * Math.sin(TH[j])),
                    di = -(ar * Math.sin(TH[j]) - ai * Math.cos(TH[j]));
                const q = dr * dr + di * di;
                ea[0][j] = s * dr / q;
                ea[1][j] = -s * di / q;
            }
            let kr = 0,
                ki = 0; // ⟨g, e_a⟩
            for (let j = 0; j < AIM_M; j++) {
                kr += P.g[0][j] * ea[0][j] + P.g[1][j] * ea[1][j];
                ki += P.g[1][j] * ea[0][j] - P.g[0][j] * ea[1][j];
            }
            kr /= AIM_M;
            ki /= AIM_M;
            for (let j = 0; j < AIM_M; j++) {
                const tr = kr * ea[0][j] - ki * ea[1][j],
                    ti = kr * ea[1][j] + ki * ea[0][j];
                P.ap[0][j] += tr * P.B[0][j] - ti * P.B[1][j];
                P.ap[1][j] += tr * P.B[1][j] + ti * P.B[0][j];
                // the remainder (g − coef·e_a)·(1 − āz)/(z − a), and B times (z − a)/(1 − āz)
                const gr = P.g[0][j] - tr,
                    gi = P.g[1][j] - ti;
                const c = Math.cos(TH[j]),
                    sn = Math.sin(TH[j]);
                const nr = 1 - (ar * c + ai * sn),
                    ni = -(ar * sn - ai * c); // 1 − āz
                const dr = c - ar,
                    di = sn - ai; // z − a
                const dq = dr * dr + di * di;
                const mr = (nr * dr + ni * di) / dq,
                    mi = (ni * dr - nr * di) / dq; // (1 − āz)/(z − a)
                P.g[0][j] = gr * mr - gi * mi;
                P.g[1][j] = gr * mi + gi * mr;
                const ir = mr / (mr * mr + mi * mi),
                    ii = -mi / (mr * mr + mi * mi); // its inverse, (z − a)/(1 − āz)
                const b0 = P.B[0][j];
                P.B[0][j] = b0 * ir - P.B[1][j] * ii;
                P.B[1][j] = b0 * ii + P.B[1][j] * ir;
            }
            // keep the remainder in H²: drop what the division leaked to negative frequencies
            const cr = Float64Array.from(P.g[0]),
                ci = Float64Array.from(P.g[1]);
            aimFft(cr, ci, false);
            for (let k = AIM_K; k < AIM_M; k++) {
                cr[k] = 0;
                ci[k] = 0;
            }
            aimFft(cr, ci, true);
            for (let j = 0; j < AIM_M; j++) {
                P.g[0][j] = cr[j] / AIM_M;
                P.g[1][j] = ci[j] / AIM_M;
            }
            P.best = null;
        }

        function aimAimed(z, c, c0, norm) {
            const plus = [new Float64Array(AIM_M), new Float64Array(AIM_M)],
                minus = [new Float64Array(AIM_M), new Float64Array(AIM_M)];
            for (let k = 1; k < AIM_K; k++) {
                plus[0][k] = c[0][k];
                plus[1][k] = c[1][k];
                minus[0][k] = c[0][AIM_M - k]; // conj(c_{−k})
                minus[1][k] = -c[1][AIM_M - k];
            }
            aimFft(plus[0], plus[1], true);
            aimFft(minus[0], minus[1], true);
            const P = aimPart(plus[0], plus[1]),
                Q = aimPart(minus[0], minus[1]);
            const errs = [],
                picks = [];
            const record = () => {
                let e = 0;
                for (let j = 0; j < AIM_M; j++) {
                    const xr = c0[0] + P.ap[0][j] + Q.ap[0][j],
                        xi = c0[1] + P.ap[1][j] - Q.ap[1][j];
                    e += (z[0][j] - xr) ** 2 + (z[1][j] - xi) ** 2;
                }
                errs.push(Math.sqrt(e / AIM_M) / norm);
            };
            aimTake(P, 0, 0);
            picks.push([0, 0]);
            record();
            aimTake(Q, 0, 0);
            picks.push([0, 0]);
            record();
            while (picks.length < AIM_NMAX && errs[errs.length - 1] >= AIM_TOLS[AIM_TOLS.length - 1]) {
                const bp = aimBest(P),
                    bq = aimBest(Q);
                const [W, b] = bp.v >= bq.v ? [P, bp] : [Q, bq];
                aimTake(W, b.ar, b.ai);
                picks.push([b.ar, b.ai]);
                record();
            }
            return {
                errs,
                picks
            };
        }

        const aimFirst = (errs, t) => {
            const i = errs.findIndex(e => e < t);
            return i < 0 ? null : i + 1;
        };

        function aimOne(spec) {
            const pts = spec.pts();
            if (!pts || pts.length < 3)
                return null;
            const ss = Array.from({
                length: AIM_M
            }, (_, j) => j / AIM_M);
            const z = aimWalk(pts, ss);
            const c = [Float64Array.from(z[0]), Float64Array.from(z[1])];
            aimFft(c[0], c[1], false);
            for (let k = 0; k < AIM_M; k++) {
                c[0][k] /= AIM_M;
                c[1][k] /= AIM_M;
            }
            const c0 = [c[0][0], c[1][0]];
            let norm = 0;
            for (let j = 0; j < AIM_M; j++)
                norm += (z[0][j] - c0[0]) ** 2 + (z[1][j] - c0[1]) ** 2;
            norm = Math.sqrt(norm / AIM_M);
            if (!(norm > 1e-9))
                return null;
            const even = aimEven(pts, z, c0, norm);
            const aimed = aimAimed(z, c, c0, norm);
            const r = {
                key: spec.key,
                pts,
                round: !!spec.round,
                cells: []
            };
            for (const t of AIM_TOLS) {
                let N = null;
                for (const [n, e] of even.errs)
                    if (e < t) {
                        N = n;
                        break;
                    }
                const n = aimFirst(aimed.errs, t);
                r.cells.push({
                    t,
                    N,
                    evenReals: N == null ? Infinity : 2 * N,
                    n,
                    aimReals: n == null ? Infinity : 4 * n + 2
                });
            }
            // where the deep standpoints sit: the percentile, among all AIM_M samples, of the
            // even reader's error at 32 leaves at each standpoint's place on the outline
            const prof = even.at32,
                sorted = Array.from(prof).sort((a, b) => a - b);
            const pct = v => {
                let lo = 0,
                    hi = sorted.length;
                while (lo < hi) {
                    const mid = (lo + hi) >> 1;
                    if (sorted[mid] < v)
                        lo = mid + 1;
                    else
                        hi = mid;
                }
                return 100 * lo / sorted.length;
            };
            const deep = aimed.picks.filter(p => Math.hypot(p[0], p[1]) > 0.5).slice(0, 10);
            const ps = deep.map(p => {
                const j = Math.round(((Math.atan2(p[1], p[0]) / (2 * Math.PI)) % 1 + 1) % 1 * AIM_M) % AIM_M;
                return pct(prof[j]);
            }).sort((a, b) => a - b);
            r.deep = deep.length;
            r.pct = ps.length ? ps[ps.length >> 1] : null;
            r.at = AIM_TOLS.map(t => aimFirst(aimed.errs, t));
            return r;
        }

        function aimShow(rows) {
            const fmt = c => (c.N == null ? '> ' + AIM_LEAVES : c.N) + ' leaves (' + (c.N == null ? '> ' + 2 * AIM_LEAVES
            : c.evenReals) + ') · ' + (c.n == null ? '> ' + AIM_NMAX : c.n) + ' aimed (' + (c.n == null ? '> '
            + (4 * AIM_NMAX + 2) : c.aimReals) + ')';
            const out = labLadder({
                rows,
                name: 'aimed terms against even leaves',
                suffix: 'reals to 10⁻² and 10⁻³, the even leaves against the aimed terms',
                verdict: r => r.cells[1].aimReals < r.cells[1].evenReals ? 2 : r.cells[0].aimReals < r.cells[0]
                .evenReals ? 1 : 0,
                caption: r => r.key + (r.round ? ' · round' : '') + '\n10⁻²: ' + fmt(r.cells[0]) + '\n10⁻³: ' + fmt(r
                .cells[1]) + '\nstandpoints ' + r.deep + (r.pct == null ? '' : ', at percentile ' + r.pct.toFixed(0)
                + ' of the leaves’ error')
            });
            if (!out)
                return;
            const sharp = rows.filter(r => !r.round),
                round = rows.filter(r => r.round);
            const wins = (set, i) => set.filter(r => r.cells[i].aimReals < r.cells[i].evenReals).length;
            const med = a => {
                const s = a.filter(v => v != null).sort((x, y) => x - y);
                return s.length ? s[s.length >> 1] : null;
            };
            const p1 = sharp.length > 0 && wins(sharp, 1) >= (2 / 3) * sharp.length;
            const p2 = round.length > 0 && wins(round, 1) <= round.length / 3;
            const mp = med(rows.map(r => r.pct));
            const p3 = mp != null && mp >= 75;
            const k = (ok, s) => s + (ok ? ' not killed' : ' KILLED');
            flashStatus('aimed terms against even leaves · ' + rows.length + ' figures walked by arc length at ' + AIM_M
            + ' samples · to 10⁻³ the aimed terms took fewer reals on ' + wins(sharp, 1) + '/' + sharp.length
            + ' figures with corners or detail (' + k(p1, 'P1') + ') and on ' + wins(round, 1) + '/' + round.length
            + ' round ones (' + k(p2, 'P2') + ') · to 10⁻² on ' + wins(sharp, 0) + '/' + sharp.length + ' and '
            + wins(round, 0) + '/' + round.length + ' · the deep standpoints sat at median percentile ' + (mp == null ? '—'
            : mp.toFixed(0)) + ' of the 32 leaves’ error (' + k(p3, 'P3') + ')'
            + (out.ms ? ' · ' + out.ms + ' ms' : ''));
        }

        function aimFigures() {
            const all = PRIMITIVES.filter(s => typeof s.pts === 'function');
            const step = Math.max(1, all.length / AIM_FIGS);
            const pick = [];
            for (let i = 0; i < AIM_FIGS && Math.floor(i * step) < all.length; i++)
                pick.push(all[Math.floor(i * step)]);
            return pick;
        }

        function runAimedTerms(done) {
            const figs = aimFigures(),
                rows = [];
            let i = 0;
            const next = () => {
                if (i >= figs.length) {
                    done(rows);
                    return;
                }
                try {
                    const r = aimOne(figs[i]);
                    if (r)
                        rows.push(r);
                } catch (e) {
                    /* a figure the walk cannot take is left out */ }
                i++;
                flashStatus('aimed terms: figure ' + i + ' of ' + figs.length + '…');
                setTimeout(next, 0);
            };
            next();
        }
        window.__aimedTerms = {
            one: aimOne,
            run: runAimedTerms
        };

        {
            const b = $('bAimedTerms');
            if (b)
                b.addEventListener('click', () => {
                    b.disabled = true;
                    b.textContent = 'aiming…';
                    runAimedTerms(rows => {
                        try {
                            if (!rows.length)
                                flashStatus('aimed terms: no representable figure');
                            else
                                aimShow(rows);
                        } catch (e) {
                            flashStatus('aimed terms failed: ' + e.message);
                        } finally {
                            b.disabled = false;
                            b.textContent = 'aim the terms';
                        }
                    });
                });
        }
};
