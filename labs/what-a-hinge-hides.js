// WHAT A HINGE HIDES (?lab=hng), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, figApply, figBasis, figFit, figLoop, flashStatus, hingeProfile, labLadder, makeRng. It
// declares nothing the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['what-a-hinge-hides'] = function () {
        // ── what a hinge hides ──────────────────────────────────────────────
        // The arc element records how fast an extent is changing and not which way, so a
        // figure may reverse at a hinge and the element will not notice. Two consequences,
        // and the page is here to show that they look different from the inside.
        // The element is MEASURED off the contour as ds/da rather than differenced off the
        // radial profile: a hinge is exactly where differencing a sampled profile smears,
        // and smearing it is the one thing this run must not do.
        function hingeArcElement(raw, N, scale) {
            let cx = 0,
                cy = 0;
            for (const q of raw) {
                cx += q.x;
                cy += q.y;
            }
            cx /= raw.length;
            cy /= raw.length;
            const bin = new Float64Array(N),
                step = 2 * Math.PI / N,
                SUB = 256;
            for (let e = 0; e < raw.length; e++) {
                const p = raw[e],
                    q = raw[(e + 1) % raw.length];
                for (let k = 0; k < SUB; k++) {
                    const u0 = k / SUB,
                        u1 = (k + 1) / SUB;
                    const x0 = p.x + (q.x - p.x) * u0,
                        y0 = p.y + (q.y - p.y) * u0;
                    const x1 = p.x + (q.x - p.x) * u1,
                        y1 = p.y + (q.y - p.y) * u1;
                    let a = Math.atan2((y0 + y1) / 2 - cy, (x0 + x1) / 2 - cx);
                    if (a < 0)
                        a += 2 * Math.PI;
                    bin[Math.min(N - 1, Math.floor(a / step))] += Math.hypot(x1 - x0, y1 - y0);
                }
            }
            const f = new Float64Array(N);
            for (let i = 0; i < N; i++)
                f[i] = bin[i] / step / scale;
            return f;
        }

        function runHingeHides() {
            const N = 720,
                K = 14,
                rows = [];
            const basis = figBasis(N, K);
            const rnd = makeRng(90210);
            for (const key of ['egg', 'hinge3', 'hinge5', 'square', 'clover']) {
                const spec = PRIMITIVES.find(q => q.key === key);
                if (!spec || typeof spec.pts !== 'function')
                    continue;
                const raw = spec.pts(),
                    prof = hingeProfile(raw, N);
                if (!prof)
                    continue;
                let big = 0;
                for (let i = 0; i < N; i++)
                    big = Math.max(big, prof[i]);
                for (let i = 0; i < N; i++)
                    prof[i] /= big;
                const f = hingeArcElement(raw, N, big);
                let mean = 0;
                for (let i = 0; i < N; i++)
                    mean += f[i];
                mean /= N;
                let best = null;
                for (let t = 0; t < 20; t++) {
                    const c0 = new Float64Array(basis.M);
                    c0[0] = mean * (0.4 + rnd());
                    for (let j = 1; j < basis.M; j++)
                        c0[j] = (rnd() - 0.5) * mean * 0.5 / (1 + (j >> 1));
                    const fit = figFit(f, basis, c0, 120);
                    const rr = figApply(basis.B, fit.c);
                    let lo = Infinity;
                    for (let i = 0; i < N; i++)
                        lo = Math.min(lo, rr[i]);
                    if (lo > 1e-6 && (!best || fit.rms < best.rms))
                        best = {
                            rms: fit.rms,
                            r: rr
                        };
                }
                rows.push({
                    key,
                    kind: 'as walked',
                    pts: figLoop(prof),
                    err: 0,
                    rms: 0,
                    note: 'the figure that was walked'
                });
                if (!best) {
                    rows.push({
                        key,
                        kind: 'the smooth figure with the same arc element',
                        pts: figLoop(prof),
                        err: NaN,
                        rms: NaN,
                        mode: 'none',
                        note: 'no smooth figure in front of the reader\n fits this arc element at all'
                    });
                    continue;
                }
                let err = 0;
                for (let i = 0; i < N; i++)
                    err = Math.max(err, Math.abs(best.r[i] - prof[i]));
                const mode = err < 0.02 ? 'same' : (best.rms < 1e-8 ? 'silent' : 'loud');
                rows.push({
                    key,
                    kind: 'the smooth figure with the same arc element',
                    pts: figLoop(best.r),
                    err,
                    rms: best.rms,
                    mode,
                    note: mode === 'same' ? 'the same figure came back'
                    : mode === 'silent' ? 'a perfect fit \u2014 on a different figure'
                    : 'the fit never reaches the equation:\n no smooth figure has this arc element'
                });
            }
            return rows;
        }

        function showHingeHides(rows) {
            const out = labLadder({
                rows,
                name: 'what a hinge hides',
                suffix: 'walked \u00b7 the smooth figure with the same arc element',
                verdict: r => r.kind === 'as walked' ? 1 : (r.mode === 'same' ? 2 : 0),
                caption: r => r.key + ' \u00b7 ' + r.kind + '\n'
                + (r.kind === 'as walked' ? 'met at its own pace'
                : (r.mode === 'none' ? 'no fit stayed in front of the reader'
                : 'departs ' + (100 * r.err).toFixed(1) + '% \u00b7 residual '
                + r.rms.toExponential(1)))
                + '\n' + r.note,
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const fits = drawn.filter(r => r.kind !== 'as walked');
            const silent = fits.filter(r => r.mode === 'silent').length;
            const loud = fits.filter(r => r.mode === 'loud' || r.mode === 'none').length;
            const same = fits.filter(r => r.mode === 'same').length;
            flashStatus('what a hinge hides \u00b7 each figure is met at its own pace, its arc element is'
            + ' measured off the contour as length per unit turn, and the smooth figure with that same'
            + ' arc element is solved for and drawn beside it \u00b7 ' + same + ' came back as themselves,'
            + ' ' + loud + ' could not be fitted at all \u2014 no smooth figure has their arc element, and'
            + ' the residual says so \u2014 and ' + silent + ' were fitted PERFECTLY, to fourteen decimal'
            + ' places, BY A DIFFERENT FIGURE. THE ARC ELEMENT RECORDS HOW FAST AN EXTENT IS CHANGING'
            + ' AND NOT WHICH WAY, so a figure may reverse at a hinge without the element noticing.'
            + ' Most hinged figures are caught anyway, because no smooth figure shares their arc'
            + ' element; the ones drawn here were built so that one does. The reader is not blind to'
            + ' hinges. It is blind to hinges arranged to be invisible'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bHH = $('bHingeHides');
            if (bHH)
                bHH.addEventListener('click', () => {
                    bHH.disabled = true;
                    bHH.textContent = 'solving\u2026';
                    setTimeout(() => {
                        try {
                            const r = runHingeHides();
                            if (!r.length)
                                flashStatus('what a hinge hides: no usable primitives');
                            else
                                showHingeHides(r);
                        }
                        catch (e) {
                            flashStatus('what a hinge hides failed: ' + e.message);
                        }
                        finally {
                            bHH.disabled = false;
                            bHH.textContent = 'lay it out';
                        }
                    }, 0);
                });
        }
};
