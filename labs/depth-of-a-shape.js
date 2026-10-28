// DEPTH OF A SHAPE (?lab=dpt), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately
// be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, DEPTH, depthFrom, depthReadShape, flashStatus, labLadder, state. It puts depthLadder,
// depthPortCheck back on the console hook window.__lab once loaded. Loaded the first time one of its buttons is
// pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['depth-of-a-shape'] = function () {
        // E0, part 1: the port against run 1 (the closed-form circle with two bumps), Python's
        // recorded misses at levels 0…4, in units of each bump's size.
        function depthPortCheck() {
            const D = DEPTH,
                DEG = Math.PI / 180,
                B = [[0.05, 100 * DEG, 20 * DEG], [0.01, 40 * DEG, 3 * DEG]];
            const R = th => 1 + B.reduce((a, q) => a + q[0] * Math.exp(-(((th - q[1]) / q[2]) ** 2)), 0);
            const sOf = th => {
                const r = R(th);
                return (1 - r * Math.cos(th)) / (r * Math.sin(th));
            };
            const thAt = s => {
                let lo = 1e-12,
                    hi = Math.PI - 1e-12;
                for (let i = 0; i < 200; i++) {
                    const m = 0.5 * (lo + hi);
                    if (sOf(m) < s)
                        lo = m;
                    else
                        hi = m;
                }
                return 0.5 * (lo + hi);
            };
            const p = s => {
                const th = thAt(s);
                return R(th) * Math.sin(th) / (2 * s / (1 + s * s));
            };
            const surf = D.Surface(p, 16);
            surf.enter([]);
            const reg = B.map(q => {
                const a = [];
                for (let i = 0; i < 801; i++)
                    a.push(sOf(q[1] - q[2] + 2 * q[2] * i / 800));
                return a;
            });
            const lohi = reg.map(a => [Math.min(...a), Math.max(...a)]);
            const size = reg.map(a => Math.max(...a.filter((_, i) => i % 8 === 0).map(s => Math.abs(p(s) - 1))));
            let frontier = [[]];
            for (let m = 1; m <= 4; m++) {
                const nw = [],
                    seen = new Set();
                for (const P of frontier)
                    for (const [lo, hi] of lohi) {
                        const cand = [];
                        if (m === 1) {
                            for (let k = D.split(lo)[0]; k <= D.split(hi)[0]; k++)
                                cand.push(k);
                        }
                        else {
                            const [a, b] = D.range(P);
                            if (b < lo || a > hi)
                                continue;
                            const rd = (x, fb) => {
                                const q = D.addr(x, m - 1);
                                return q[0].join('.') === P.join('.') ? q[1] : fb;
                            };
                            const rl = lo <= a ? 0 : rd(lo, 0),
                                rh = hi >= b ? Infinity : rd(hi, Infinity);
                            const kl = rl === 0 ? -2 : Math.max(-2, D.split(rl)[0]),
                                kh = !isFinite(rh) ? 3 : Math.min(3, D.split(rh)[0]);
                            for (let k = kl; k <= kh; k++)
                                cand.push(k);
                        }
                        for (const k of cand) {
                            const Q = P.concat([k]),
                                key = Q.join('.');
                            if (surf.has(Q) || seen.has(key))
                                continue;
                            const [a, b] = D.range(Q);
                            if (b < lo || a > hi)
                                continue;
                            seen.add(key);
                            nw.push(Q);
                        }
                    }
                for (const Q of nw)
                    surf.enter(Q);
                frontier = nw;
            }
            const rec = [[5.658e-2, 4.940e-4, 4.429e-5, 1.787e-7, 9.189e-10], [4.450e-1, 4.581e-2, 9.838e-4, 6.657e-5, 2.622e-7]];
            let worst = 0;
            const got = [];
            reg.forEach((pts, j) => {
                const ms = D.misses(surf, pts, pts.map(p), 4).map(x => x / size[j]);
                got.push(ms);
                ms.forEach((x, m) => {
                    worst = Math.max(worst, Math.abs(x / rec[j][m] - 1));
                });
            });
            return {
                worst,
                got
            };
        }

        function depthLadder(o) {
            o = o || {};
            const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
            const D = DEPTH,
                LO = 2 ** -6,
                HI = 2 ** 6,
                L = 3,
                NPTS = 1200;
            const port = depthPortCheck();
            const grid = [];
            for (let i = 0; i < NPTS; i++)
                grid.push(LO * Math.pow(HI / LO, i / (NPTS - 1)));
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
                if (!pts || pts.length < 3 || !isFinite(pts[0].x))
                    continue;
                const rd = depthReadShape(spec);
                const row = {
                    key: spec.key,
                    pts,
                    round: !!spec.round
                };
                if (rd.why) {
                    row.why = rd.why;
                    rows.push(row);
                    continue;
                }
                const dp = depthFrom(rd.C, rd.standpoint, NPTS);
                if (dp.why) {
                    row.why = dp.why;
                    rows.push(row);
                    continue;
                }
                const size = dp.size,
                    abs = dp.abs;
                row.docs = dp.docs;
                row.size = size;
                row.abs = abs;
                row.maxTurn = rd.maxTurn;
                row.miss = size > 0 ? abs.map(v => v / size) : abs.map(() => 0);
                const k = row.miss.findIndex(v => v <= 0.05);
                row.need = k < 0 ? L + 1 : k;
                row.circleL0 = abs[0];
                rows.push(row);
            }
            const scored = rows.filter(r => !r.why);
            const fmt = v => v === 0 ? '0' : v.toExponential(1);
            const out = labLadder({
                rows,
                name: 'depth of a shape',
                suffix: 'W=16 · levels 0–' + L,
                verdict: r => r.why ? 1 : (r.need <= 1 ? 2 : (r.need <= L ? 1 : 0)),
                caption: r => r.key + '\n' + (r.why ? r.why
                : 'size ' + r.size.toFixed(3) + ' · need L' + (r.need > L ? '>' + L : r.need) + '\n'
                + r.miss.map((v, m) => 'L' + m + ' ' + fmt(v)).slice(0, 2).join(' ') + '\n'
                + r.miss.map((v, m) => 'L' + m + ' ' + fmt(v)).slice(2).join(' ')),
                after: drawn => {
                    for (const r of drawn)
                        if (r.why && state.subpaths[r._idx])
                            state.subpaths[r._idx].stroke = '#5b6470';
                },
            });
            // E1: from the first level at ≤ 0.05, each further level cuts ≥ 5× while above 1e-6.
            const e1 = [];
            for (const r of scored)
                for (let m = r.need + 1; m <= L; m++) {
                    if (r.miss[m - 1] > 1e-6 && r.miss[m - 1] / Math.max(r.miss[m], 1e-300) < 5)
                        e1.push(r.key + ' L' + m);
                }
            const fam = scored.filter(r => ['circle', 'ellipse', 'oval'].includes(r.key));
            const e2 = fam.filter(r => r.miss[0] > 0.05).map(r => r.key);
            const rank = a => {
                const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
                const rk = new Array(a.length);
                let i = 0;
                while (i < idx.length) {
                    let j = i;
                    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0])
                        j++;
                    for (let k = i; k <= j; k++)
                        rk[idx[k][1]] = (i + j) / 2;
                    i = j + 1;
                }
                return rk;
            };
            const corr = (a, b) => {
                const n = a.length,
                    ma = a.reduce((p, q) => p + q, 0) / n,
                    mb = b.reduce((p, q) => p + q, 0) / n;
                let sab = 0,
                    saa = 0,
                    sbb = 0;
                for (let i = 0; i < n; i++) {
                    sab += (a[i] - ma) * (b[i] - mb);
                    saa += (a[i] - ma) ** 2;
                    sbb += (b[i] - mb) ** 2;
                }
                return sab / Math.sqrt(saa * sbb);
            };
            const e3 = scored.length > 2 ? corr(rank(scored.map(r => r.need)), rank(scored.map(r => r.maxTurn))) : NaN;
            const circ = rows.find(r => r.key === 'circle');
            const res = {
                port,
                rows,
                scored: scored.length,
                total: rows.length,
                e1,
                e2,
                e3,
                circleL0: circ && !circ.why ? circ.circleL0 : null,
                why: rows.filter(r => r.why).map(r => r.key + ': ' + r.why)
            };
            window.__depthResult = res;
            if (!out)
                return null;
            const by = k => scored.filter(r => r.need === k).length;
            flashStatus('depth of a shape (DPT) · ' + scored.length + ' of ' + rows.length + ' outlines read from a standpoint on their unit circle'
            + ' · held to 5% by level 0: ' + by(0) + ', 1: ' + by(1) + ', 2: ' + by(2) + ', 3: ' + by(3) + ', not by 3: ' + by(L + 1)
            + ' · the port against plan run 1: ' + port.worst.toExponential(1)
            + ' · past the level that holds, every level cuts ≥ 5× ' + (e1.length ? 'except ' + e1.join(', ') : 'everywhere')
            + ' · circle, ellipse, oval at level 0: ' + fam.map(r => r.miss[0].toFixed(2)).join(', ')
            + ' · level needed against sharpest turning in the window, rank ' + (isFinite(e3) ? e3.toFixed(2) : 'n/a')
            + ' · grey: ' + (rows.length - scored.length) + ' not scored (no standpoint or folds)'
            + (t0 ? ' · ' + Math.round(performance.now() - t0) + ' ms' : ''));
            return rows.length;
        }

        {
            const bDS = $('bDepthShape');
            if (bDS)
                bDS.addEventListener('click', () => {
                    bDS.disabled = true;
                    bDS.textContent = 'reading…';
                    setTimeout(() => {
                        try {
                            if (!depthLadder())
                                flashStatus('depth of a shape: nothing to draw');
                        }
                        catch (e) {
                            flashStatus('depth of a shape failed: ' + e.message);
                        }
                        finally {
                            bDS.disabled = false;
                            bDS.textContent = 'depth of a shape';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { depthLadder, depthPortCheck });
};
