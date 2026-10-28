// THE FIGURE, RECOVERED (?lab=fig), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, figApply, figBasis, figFit, figLoop, figSolve, flashStatus, labLadder, makeRng. It
// declares nothing the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['figure-recovered'] = function () {
        function runFigureRecovered() {
            const N = 256,
                K = 8,
                WANT = 4,
                rows = [];
            const basis = figBasis(N, K);
            const rnd = makeRng(4242);
            const cand = [];
            for (const spec of PRIMITIVES) {
                if (typeof spec.pts !== 'function')
                    continue;
                const raw = spec.pts();
                if (!raw || raw.length < 24)
                    continue;
                let cx = 0,
                    cy = 0;
                for (const q of raw) {
                    cx += q.x;
                    cy += q.y;
                }
                cx /= raw.length;
                cy /= raw.length;
                // the figure's extent through the whole turn, and its arc element
                const prof = new Float64Array(N);
                let ok = true;
                for (let i = 0; i < N && ok; i++) {
                    const a = 2 * Math.PI * i / N,
                        dx = Math.cos(a),
                        dy = Math.sin(a);
                    let R = null;
                    for (let e = 0; e < raw.length; e++) {
                        const p = raw[e],
                            q = raw[(e + 1) % raw.length];
                        const px = p.x - cx,
                            py = p.y - cy,
                            qx = q.x - cx,
                            qy = q.y - cy;
                        const d = (qx - px) * dy - (qy - py) * dx;
                        if (Math.abs(d) < 1e-12)
                            continue;
                        const s = (px * dy - py * dx) / -d;
                        if (s < 0 || s > 1)
                            continue;
                        const hx = px + s * (qx - px),
                            hy = py + s * (qy - py);
                        const tt = hx * dx + hy * dy;
                        if (tt > 0 && (R === null || tt < R))
                            R = tt;
                    }
                    if (R === null || !(R > 0))
                        ok = false;
                    else
                        prof[i] = R;
                }
                if (!ok)
                    continue;
                let mn = Infinity,
                    mx = -Infinity;
                for (let i = 0; i < N; i++) {
                    mn = Math.min(mn, prof[i]);
                    mx = Math.max(mx, prof[i]);
                }
                const swing = mx / mn;
                if (!(swing < 40))
                    continue; // the centroid lies on or near the contour
                cand.push({
                    spec,
                    prof,
                    swing
                });
            }
            cand.sort((a, b) => b.swing - a.swing);
            for (const cd of cand.slice(0, WANT)) {
                const {spec, prof} = cd;
                // the true figure in the basis, and the arc element taken from it exactly
                const AtA = [],
                    Atb = new Float64Array(basis.M);
                for (let j = 0; j < basis.M; j++)
                    AtA.push(new Float64Array(basis.M));
                for (let i = 0; i < N; i++)
                    for (let j = 0; j < basis.M; j++) {
                        Atb[j] += basis.B[i][j] * prof[i];
                        for (let k = j; k < basis.M; k++)
                            AtA[j][k] += basis.B[i][j] * basis.B[i][k];
                    }
                for (let j = 0; j < basis.M; j++)
                    for (let k = 0; k < j; k++)
                        AtA[j][k] = AtA[k][j];
                const cTrue = figSolve(AtA.map(r => Array.from(r)), Array.from(Atb));
                const rTrue = figApply(basis.B, cTrue),
                    rpTrue = figApply(basis.Bp, cTrue);
                const f = new Float64Array(N);
                for (let i = 0; i < N; i++)
                    f[i] = Math.hypot(rTrue[i], rpTrue[i]);
                // recover, from the arc element alone, from a seed knowing nothing of it
                let mean = 0;
                for (let i = 0; i < N; i++)
                    mean += f[i];
                mean /= N;
                let bestFit = null;
                for (let attempt = 0; attempt < 24 && (!bestFit || bestFit.rms > 1e-10); attempt++) {
                    const c0 = new Float64Array(basis.M);
                    c0[0] = mean * (0.5 + rnd());
                    for (let j = 1; j < basis.M; j++)
                        c0[j] = (rnd() - 0.5) * mean * 0.6 / (1 + (j >> 1));
                    const fit = figFit(f, basis, c0, 90);
                    const rr = figApply(basis.B, fit.c);
                    let lo = Infinity;
                    for (let i = 0; i < N; i++)
                        lo = Math.min(lo, rr[i]);
                    if (fit.rms < 1e-10 && lo > 1e-6 && (!bestFit || fit.rms < bestFit.rms))
                        bestFit = {
                            c: fit.c,
                            rms: fit.rms,
                            r: rr
                        };
                }
                const key = spec.key || spec.name || 'shape';
                if (!bestFit) {
                    rows.push({
                        key,
                        kind: 'as walked',
                        pts: figLoop(rTrue),
                        swing: cd.swing,
                        err: NaN,
                        note: 'the recovery did not converge here'
                    });
                    continue;
                }
                let err = 0,
                    big = 0;
                for (let i = 0; i < N; i++) {
                    err = Math.max(err, Math.abs(bestFit.r[i] - rTrue[i]));
                    big = Math.max(big, rTrue[i]);
                }
                err /= big;
                const behind = new Float64Array(N);
                for (let i = 0; i < N; i++)
                    behind[i] = -bestFit.r[i];
                rows.push({
                    key,
                    kind: 'as walked',
                    pts: figLoop(rTrue),
                    swing: cd.swing,
                    err,
                    note: 'the figure that was walked'
                });
                rows.push({
                    key,
                    kind: 'recovered from its arc element',
                    pts: figLoop(bestFit.r),
                    swing: cd.swing,
                    err,
                    note: 'fitted from the arc element alone,\n knowing nothing of the figure'
                });
                rows.push({
                    key,
                    kind: 'the solution behind the reader',
                    pts: figLoop(behind),
                    swing: cd.swing,
                    err,
                    note: 'the same equation, the other sign —\n nothing a reader could have read'
                });
            }
            return rows;
        }

        function showFigureRecovered(rows) {
            const out = labLadder({
                rows,
                name: 'the figure, recovered',
                suffix: 'walked · recovered · excluded',
                verdict: r => r.kind === 'as walked' ? 1
                : r.kind === 'recovered from its arc element' ? (r.err < 0.02 ? 2 : 0) : 0,
                caption: r => r.key + ' · ' + r.kind + '\n'
                + (r.kind === 'as walked' ? 'its radius swings by ' + r.swing.toFixed(2) + '×'
                : r.kind === 'recovered from its arc element'
                ? 'back to ' + (100 * r.err).toFixed(2) + '% of its size'
                : 'r < 0 everywhere') + '\n' + r.note,
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const recs = drawn.filter(r => r.kind === 'recovered from its arc element');
            const good = recs.filter(r => r.err < 0.02).length;
            const worst = recs.length ? Math.max.apply(null, recs.map(r => r.err)) : 1;
            flashStatus('the figure, recovered · ' + recs.length + ' figures solved back from their arc'
            + ' element alone, in a Fourier basis fitted by Gauss-Newton, from seeds knowing nothing'
            + ' of the figure — recovered on ' + good + '/' + recs.length + ', worst departure '
            + (100 * worst).toFixed(2) + '% of the figure\u2019s size'
            + ' · beside each, the solution the same equation admits with r negative throughout:'
            + ' a figure entirely behind the reader, which is not a rival answer but one no reading'
            + ' could have been of. A FIGURE BEING READ IS A FIGURE IN FRONT OF THE READER, and'
            + ' that is what fixes the constant the arc element leaves free \u2014 and fixes it'
            + ' uniquely: two figures in front of the reader sharing one arc element would have'
            + ' to hold equal and opposite extents at the turn where they differ most, so there'
            + ' is exactly one SMOOTH figure, up to its overall size \u2014 a figure reversing at\u00a0hinges can share an arc element and the arrivals cannot tell'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bFR = $('bFigureRecovered');
            if (bFR)
                bFR.addEventListener('click', () => {
                    bFR.disabled = true;
                    bFR.textContent = 'solving…';
                    setTimeout(() => {
                        try {
                            const r = runFigureRecovered();
                            if (!r.length)
                                flashStatus('the figure, recovered: no usable primitives');
                            else
                                showFigureRecovered(r);
                        }
                        catch (e) {
                            flashStatus('the figure, recovered failed: ' + e.message);
                        }
                        finally {
                            bFR.disabled = false;
                            bFR.textContent = 'lay it out';
                        }
                    }, 0);
                });
        }
};
