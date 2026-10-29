// SIZE SETS THE LEVEL (?lab=ssl), written 29 Oct 2026 from the essays (Tom: "is there any labs we should do from our
// essays?", then "1,2,3"): essay 4 §10's "a thing that spans n of the reader's places is resolved to about log₂ n
// levels of detail … The level is a continuous number" put to the library.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's. From the editor it uses: $, PRIMITIVES, flashStatus, hrtSampleRadial, labLadder. It declares nothing
// the editor reads. Loaded the first time its button is pressed, or ?lab= asks for it.
(window.TVF_LABS = window.TVF_LABS || {})['size-sets-the-level'] = function () {
        // ── size sets the level ──────────────────────────────────────────────
        // The figure's log-radius from its centroid at M = 2048 leaves is the truth, its spectrum
        // F_k by the FFT. A reader with n places reads every (M/n)th of those leaves; the
        // editor's reconstruction from them is their trigonometric interpolant (draw §54: every
        // band mode presented exactly), so its spectrum is the DFT of the n readings, harmonic κ
        // taking every k ≡ κ (mod n) folded into it. Levels are harmonics 2ʲ … 2ʲ⁺¹ − 1. A level
        // holds when the error in it, folding included, is within 10% of its own size (its energy,
        // or a millionth of the figure's when it has almost none, so a level empty by symmetry is
        // held when nothing folds into it). The height reader keeps harmonic k by e^(−kγ), its
        // energy by e^(−2kγ), at γ = π/n; its level is the sum of the shares it keeps of every
        // level that has energy. Predictions in the drawer, written before the run.
        const SSL_M = 2048,
            SSL_NS = [16, 32, 64, 128, 256, 512],
            SSL_TOL = 0.1;

        function sslFFT(re, im) {
            const n = re.length;
            for (let i = 1, j = 0; i < n; i++) {
                let bit = n >> 1;
                for (; j & bit; bit >>= 1)
                    j ^= bit;
                j ^= bit;
                if (i < j) {
                    [re[i], re[j]] = [re[j], re[i]];
                    [im[i], im[j]] = [im[j], im[i]];
                }
            }
            for (let len = 2; len <= n; len <<= 1) {
                const a = -2 * Math.PI / len,
                    wr = Math.cos(a),
                    wi = Math.sin(a);
                for (let i = 0; i < n; i += len) {
                    let cr = 1,
                        ci = 0;
                    for (let k = 0; k < len / 2; k++) {
                        const ur = re[i + k],
                            ui = im[i + k];
                        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci,
                            vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
                        re[i + k] = ur + vr;
                        im[i + k] = ui + vi;
                        re[i + k + len / 2] = ur - vr;
                        im[i + k + len / 2] = ui - vi;
                        const t = cr * wr - ci * wi;
                        ci = cr * wi + ci * wr;
                        cr = t;
                    }
                }
            }
        }

        // the spectrum of samples g, scaled by 1/len, and phase-shifted so harmonic k is referred to the truth's grid
        // when the samples start j0 leaves along it
        function sslSpectrum(g, j0) {
            const n = g.length,
                re = Float64Array.from(g),
                im = new Float64Array(n);
            sslFFT(re, im);
            const out = [];
            for (let k = 0; k < n; k++) {
                const kk = k <= n / 2 ? k : k - n; // signed harmonic
                const a = -2 * Math.PI * kk * j0 / SSL_M; // undo the start's phase: F̂_κ = Ĝ_κ·e^(−2πiκ·j0/M)
                const c = Math.cos(a),
                    s = Math.sin(a);
                const r = re[k] / n,
                    i = im[k] / n;
                out.push({
                    k: kk,
                    re: r * c - i * s,
                    im: r * s + i * c
                });
            }
            return out;
        }

        const sslBand = k => Math.floor(Math.log2(Math.abs(k)));

        function sslOne(rs) {
            const f = Array.from(rs, Math.log);
            const F = sslSpectrum(f, 0);
            const bands = [];
            let total = 0;
            for (const c of F) {
                if (c.k === 0 || Math.abs(c.k) >= SSL_M / 2)
                    continue;
                const b = sslBand(c.k),
                    e = c.re * c.re + c.im * c.im;
                bands[b] = (bands[b] || 0) + e;
                total += e;
            }
            const nB = bands.length;
            for (let b = 0; b < nB; b++)
                bands[b] = bands[b] || 0;
            const floor = 1e-6 * total;
            // the sampled reader at each n
            const held = {},
                worstLow = {},
                worstShareLow = {};
            for (const n of SSL_NS) {
                const step = SSL_M / n,
                    j0 = step / 2;
                const g = [];
                for (let i = 0; i < n; i++)
                    g.push(f[j0 + i * step]);
                const G = sslSpectrum(g, j0);
                const err = new Array(nB).fill(0);
                const byK = new Map(F.map(c => [c.k, c]));
                for (const c of G) {
                    if (c.k === 0 || Math.abs(c.k) >= n / 2)
                        continue;
                    const t = byK.get(c.k);
                    const dr = c.re - t.re,
                        di = c.im - t.im;
                    err[sslBand(c.k)] += dr * dr + di * di;
                }
                let L = 0,
                    worst = 0,
                    worstShare = 0;
                for (let b = 0; b < nB; b++) {
                    if (2 ** (b + 1) > n / 2)
                        break; // the level reaches the reader's last harmonic
                    const rel = Math.sqrt(err[b] / Math.max(bands[b], floor));
                    if (2 ** (b + 1) <= n / 4) {
                        worst = Math.max(worst, rel);
                        // AFTER THE RUN (29 Oct 2026), a reading and not a prediction: the same error judged against a
                        // hundredth of the figure's whole detail instead of the level's own, to tell a level swamped
                        // by detail folded down from finer ones apart from a level that has almost none to swamp
                        worstShare = Math.max(worstShare, Math.sqrt(err[b] / Math.max(bands[b], 0.01 * total)));
                    }
                    if (rel <= SSL_TOL && L === b)
                        L++;
                }
                held[n] = L;
                worstLow[n] = worst;
                worstShareLow[n] = worstShare;
            }
            // the height reader's continuous level
            const level = {};
            for (const n of [16, 32, 64, 128, 256]) {
                const gamma = Math.PI / n,
                    kept = new Array(nB).fill(0);
                for (const c of F) {
                    if (c.k === 0 || Math.abs(c.k) >= SSL_M / 2)
                        continue;
                    kept[sslBand(c.k)] += (c.re * c.re + c.im * c.im) * Math.exp(-2 * Math.abs(c.k) * gamma);
                }
                let l = 0;
                for (let b = 0; b < nB; b++)
                    if (bands[b] > floor)
                        l += kept[b] / bands[b];
                level[n] = l;
            }
            const steps = [16, 32, 64, 128].map(n => level[2 * n] - level[n]);
            return {
                held,
                worstLow,
                worstShareLow,
                steps,
                level,
                // AFTER THE RUN: how many levels have any detail of their own (above a millionth of the figure's)
                levels: bands.filter(e => e > floor).length
            };
        }

        function runSizeLevel() {
            const rows = [];
            for (const spec of PRIMITIVES) {
                if (typeof spec.pts !== 'function')
                    continue;
                let pts;
                try {
                    pts = spec.pts();
                } catch (e) {
                    continue;
                }
                if (!pts || pts.length < 3)
                    continue;
                const rs = hrtSampleRadial(pts, SSL_M);
                if (!rs || rs.some(r => !(r > 0)))
                    continue;
                const r = sslOne(rs);
                const p1 = SSL_NS.every(n => r.worstLow[n] <= SSL_TOL);
                const p3 = Math.max(...r.steps.map(d => Math.abs(d - 1)));
                rows.push({
                    key: spec.key,
                    pts,
                    ...r,
                    p1,
                    p3
                });
            }
            return rows;
        }

        function showSizeLevel(rows) {
            const out = labLadder({
                rows,
                name: 'size sets the level',
                suffix: 'levels held at 16 … 512 places, and the height reader’s level',
                // teal both held; gold the levels below n/4 held but the height reader's step was off by over 0.15;
                // red a level below n/4 off by more than 10%
                verdict: r => !r.p1 ? 0 : r.p3 <= 0.15 ? 2 : 1,
                caption: r => r.key + '\n' + 'held ' + SSL_NS.map(n => r.held[n]).join(' ') + ' at n 16…512\n'
                + 'below n/4 worst ' + (100 * Math.max(...SSL_NS.map(n => r.worstLow[n]))).toFixed(1) + '%\n'
                + 'height steps ' + r.steps.map(d => d.toFixed(2)).join(' ')
            });
            if (!out)
                return;
            const n = rows.length,
                c = f => rows.filter(f).length;
            const gains = [16, 32, 64, 128, 256].map(m => {
                const d = rows.map(r => r.held[2 * m] - r.held[m]).sort((a, b) => a - b);
                return d[d.length >> 1];
            });
            const p1 = c(r => r.p1),
                p3 = c(r => r.p3 <= 0.15);
            const allSteps = rows.flatMap(r => r.steps).sort((a, b) => a - b);
            // AFTER THE RUN (29 Oct 2026), readings and not predictions
            const share = c(r => SSL_NS.every(m => r.worstShareLow[m] <= SSL_TOL));
            const medAt = [0, 1, 2, 3].map(i => {
                const d = rows.map(r => r.steps[i]).sort((a, b) => a - b);
                return d[d.length >> 1];
            });
            const lv = rows.map(r => r.levels).sort((a, b) => a - b);
            const killed = [p1 < n && '(1) on ' + (n - p1) + ' figures', gains.some(g => g !== 1) && '(2)',
                p3 < n && '(3) on ' + (n - p3) + ' figures'
            ].filter(Boolean);
            flashStatus('size sets the level · ' + n + ' star-shaped figures read at 16 to 512 places'
            + ' · every level below a quarter of the places held to 10% on ' + p1 + '/' + n
            + (p1 < n ? ' (not on ' + rows.filter(r => !r.p1).map(r => r.key).slice(0, 8).join(', ')
            + (n - p1 > 8 ? ', …' : '') + ')' : '')
            + ' · the median figure gained ' + gains.join(', ') + ' held levels at each doubling'
            + ' · the height reader’s level rose ' + allSteps[0].toFixed(2) + ' to '
            + allSteps[allSteps.length - 1].toFixed(2) + ' a doubling (median ' + allSteps[allSteps.length >> 1].toFixed(2)
            + '), within 0.15 of one on ' + p3 + '/' + n
            + ' · ' + (killed.length ? 'KILLED: ' + killed.join('; ') : 'NO PREDICTION KILLED')
            + ' · READ AFTER THE RUN: judged against a hundredth of each figure\u2019s whole detail instead of each'
            + ' level\u2019s own, the levels below n/4 held on ' + share + '/' + n + ', so most failures are folds into levels'
            + ' with almost nothing of their own; the height reader\u2019s median step was ' + medAt.map(d => d.toFixed(2))
            .join(', ') + ' at 16→32 … 128→256, and the figures have ' + lv[0] + ' to ' + lv[lv.length - 1]
            + ' levels with any detail (median ' + lv[lv.length >> 1] + '): a figure resolves no more levels than it has'
            + (out.ms ? ' · ' + out.ms + ' ms' : ''));
        }

        {
            const b = $('bSizeLevel');
            if (b)
                b.addEventListener('click', () => {
                    b.disabled = true;
                    b.textContent = 'counting…';
                    setTimeout(() => {
                        try {
                            const rows = runSizeLevel();
                            if (!rows.length)
                                flashStatus('size sets the level: no star-shaped figure');
                            else
                                showSizeLevel(rows);
                        } catch (e) {
                            flashStatus('size sets the level failed: ' + e.message);
                        } finally {
                            b.disabled = false;
                            b.textContent = 'count the levels';
                        }
                    }, 0);
                });
        }
};
