// THE OUTSIDE STREAMS (?lab=ost), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labComb, labLadder, makeRng, osQ, osScreen, pick, sampProfile. It
// declares nothing the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['outside-streams'] = function () {
        function osFine(vals) {
            // the finer screen: the central quantile function, location- and
            // scale-normalised, against the Cauchy's — quoted relative to the
            // Cauchy curve's own size over the same window
            const v = vals.filter(Number.isFinite).sort((a, b) => a - b);
            const loc = osQ(v, 0.5),
                sc = (osQ(v, 0.75) - osQ(v, 0.25)) / 2;
            let ss = 0,
                ww = 0,
                c = 0;
            for (let p = 0.10; p <= 0.9005; p += 0.02) {
                const got = (osQ(v, p) - loc) / sc,
                    want = Math.tan(Math.PI * (p - 0.5));
                ss += (got - want) * (got - want);
                ww += want * want;
                c++;
            }
            return Math.sqrt(ss / c) / Math.sqrt(ww / c);
        }

        function runOutsideStreams() {
            const M = 1024,
                DRAWS = 20000;
            const rnd = makeRng(20260827);
            const figs = [];
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
                const prof = sampProfile(raw, cx, cy, M);
                if (!prof)
                    continue;
                const arc = [];
                for (let k = 0; k < M; k++) {
                    const kp = Math.min(M - 1, k + 1),
                        km = Math.max(0, k - 1);
                    const dr = (prof[kp].r - prof[km].r) / (prof[kp].a - prof[km].a);
                    arc.push(Math.hypot(prof[k].r, dr));
                }
                let rmin = Infinity,
                    rmax = -Infinity;
                for (const p of prof) {
                    rmin = Math.min(rmin, p.r);
                    rmax = Math.max(rmax, p.r);
                }
                figs.push({
                    spec,
                    raw,
                    prof,
                    arc,
                    swing: rmax / rmin
                });
            }
            // the finer screen's own floor, measured on honest Cauchy draws at this n
            const floors = [];
            for (let t = 0; t < 12; t++) {
                const c = [];
                for (let i = 0; i < DRAWS; i++)
                    c.push(Math.tan(Math.PI * (rnd() - 0.5)));
                floors.push(osFine(c));
            }
            floors.sort((a, b) => a - b);
            const floor = floors[floors.length - 1];
            const res = [];
            for (const f of figs) {
                const {prof, arc} = f;
                const even = [];
                for (let i = 0; i < DRAWS; i++)
                    even.push(Math.tan(prof[Math.floor(rnd() * M)].a));
                const cum = [];
                let s = 0;
                for (let k = 0; k < M; k++) {
                    s += arc[k];
                    cum.push(s);
                }
                for (let k = 0; k < M; k++)
                    cum[k] /= s;
                const pick = () => {
                    const u = rnd();
                    let lo = 0,
                        hi = M - 1;
                    while (lo < hi) {
                        const mid = (lo + hi) >> 1;
                        if (cum[mid] < u)
                            lo = mid + 1;
                        else
                            hi = mid;
                    }
                    return lo;
                };
                const walked = [];
                for (let i = 0; i < DRAWS; i++)
                    walked.push(Math.tan(prof[pick()].a));
                const ramp = [];
                for (let i = 0; i < DRAWS; i++) {
                    const u = Math.sqrt(rnd());
                    ramp.push(Math.tan(prof[Math.min(M - 1, Math.floor(u * M))].a));
                }
                res.push({
                    f,
                    even: osScreen(even),
                    evenF: osFine(even),
                    walk: osScreen(walked),
                    walkF: osFine(walked),
                    ramp: osScreen(ramp),
                    rampF: osFine(ramp)
                });
            }
            return {
                res,
                floor
            };
        }

        function showOutsideStreams(out) {
            const {res, floor} = out;
            const total = res.length;
            const evenFails = res.filter(r => !r.even.pass);
            const varied = res.filter(r => r.f.swing >= 1.05);
            const round = res.filter(r => r.f.swing < 1.05);
            const walkCaught = varied.filter(r => !r.walk.pass);
            const walkSlipped = varied.filter(r => r.walk.pass);
            const roundPassed = round.filter(r => r.walk.pass);
            const slippedBelowFloor = walkSlipped.filter(r => r.walkF < floor).length;
            const rampCheapPass = res.filter(r => r.ramp.cheap < 0.12);
            const rampFullPass = res.filter(r => r.ramp.pass);
            const rampFineCaught = res.filter(r => r.rampF > 3 * floor);
            const medMoved = res.map(r => Math.abs(r.ramp.med)).sort((a, b) => a - b);
            const rampMed = medMoved[Math.floor(medMoved.length / 2)];
            const rows = [];
            // the edge cases, drawn: any even failure; then walked-yet-passed with real swing
            for (const r of evenFails.slice(0, 3))
                rows.push({
                    key: r.f.spec.key || r.f.spec.name || 'shape',
                    pts: r.f.raw,
                    kind: 'edge',
                    ok: 0,
                    cap: 'MET EVENLY AND FAILED — an even meeting has no business failing\n'
                    + 'worst ratio ' + (100 * r.even.worstOff).toFixed(1) + '% · exchange '
                    + r.even.exch.toFixed(2) + ' · mean swing ' + r.even.swing.toFixed(2)
                });
            for (const r of walkSlipped.slice(0, 4))
                rows.push({
                    key: r.f.spec.key || r.f.spec.name || 'shape',
                    pts: r.f.raw,
                    kind: 'edge',
                    ok: 0,
                    cap: 'WALKED AT ITS OWN PACE AND PASSED — a figure whose pace mimics evenness\n'
                    + 'radius swings ' + r.f.swing.toFixed(2) + '× yet the battery reads clean:\n'
                    + 'worst ratio ' + (100 * r.walk.worstOff).toFixed(1) + '% · finer screen '
                    + (r.walkF / floor).toFixed(1) + '× its floor'
                });
            if (!evenFails.length && !walkSlipped.length) {
                const b = varied.slice().sort((a, c) => a.walk.worstOff - c.walk.worstOff)[0];
                if (b)
                    rows.push({
                        key: b.f.spec.key || b.f.spec.name || 'shape',
                        pts: b.f.raw,
                        kind: 'edge',
                        ok: 2,
                        cap: 'the nearest miss — the varied figure the walk moved least\n'
                        + 'swing ' + b.f.swing.toFixed(2) + '× · worst ratio '
                        + (100 * b.walk.worstOff).toFixed(1) + '% · still caught'
                    });
            }
            // the ramp, on the two figures where the cheap statistic sits closest to Cauchy
            const rampSorted = res.slice().sort((a, b) => a.ramp.cheap - b.ramp.cheap);
            for (const r of rampSorted.slice(0, 2))
                rows.push({
                    key: r.f.spec.key || r.f.spec.name || 'shape',
                    pts: r.f.raw,
                    kind: 'ramp',
                    ok: r.ramp.pass ? 0 : 1,
                    cap: 'THE RAMP — severely uneven, and the cheap statistic reads '
                    + (100 * r.ramp.cheap).toFixed(1) + '% off\n'
                    + 'the full battery ' + (r.ramp.pass ? 'PASSES it' : 'still catches it ('
                    + (r.ramp.shapeOk ? '' : 'a wider ratio') + (r.ramp.shapeOk && !r.ramp.exOk ? 'the exchange' : '')
                    + (r.ramp.shapeOk && r.ramp.exOk && !r.ramp.meanOk ? 'the mean' : '') + ')') + '\n'
                    + 'finer screen ' + (r.rampF / floor).toFixed(0) + '× its floor · the quiet walks to '
                    + r.ramp.med.toFixed(2)
                });
            // three combs of the cheap statistic's departure, log10
            const lg = x => Math.max(-4, Math.log10(Math.max(1e-4, x)));
            rows.push({
                key: 'the library',
                kind: 'comb',
                ok: 1,
                pts: labComb(res.map(r => lg(r.even.cheap)), -4, 0.5),
                cap: 'met evenly · log10 of the shape statistic\u2019s departure\n'
                + 'every figure — the readings never carried the figure'
            });
            rows.push({
                key: 'the library',
                kind: 'comb',
                ok: 1,
                pts: labComb(varied.map(r => lg(r.walk.cheap)), -4, 0.5),
                cap: 'walked · the departure IS the figure showing through\n'
                + 'the round figures sit with the even teeth, honestly'
            });
            rows.push({
                key: 'the library',
                kind: 'comb',
                ok: 1,
                pts: labComb(res.map(r => lg(r.ramp.cheap)), -4, 0.5),
                cap: 'the ramp · severely uneven, teeth back among the even ones\n'
                + 'the recorded pass band, on real figures'
            });
            const out2 = labLadder({
                rows,
                name: 'the outside streams',
                suffix: 'the library through the screen',
                verdict: r => r.ok,
                caption: r => r.key + '\n' + r.cap,
            });
            if (!out2)
                return;
            flashStatus('the outside streams · ' + total + ' figures, three meetings each, full battery'
            + ' — MET EVENLY the screen passed ' + (total - evenFails.length) + '/' + total
            + (evenFails.length ? ' (the ' + evenFails.length + ' failures are drawn)' : '')
            + ' · WALKED it caught ' + walkCaught.length + '/' + varied.length
            + ' of the figures whose radius varies'
            + (walkSlipped.length ? ', and MISSED ' + walkSlipped.length + ' (drawn — the edge cases this run'
            + ' exists for): the smooth ovals sit just under the band, and ' + slippedBelowFloor
            + ' of the misses — the HINGE family — sit below even the finer screen\u2019s floor,'
            + ' because a figure whose arc element is nearly uniform walks nearly evenly; the'
            + ' screen honestly reports the meeting, never the figure' : '')
            + ', while ' + roundPassed.length + '/' + round.length
            + ' near-round figures passed honestly, a walk on a circle being even'
            + ' · THE RAMP: the cheap statistic read inside its 12% band on ' + rampCheapPass.length + '/' + total
            + ', the FULL battery passed ' + rampFullPass.length + '/' + total
            + ', the finer quantile screen caught ' + rampFineCaught.length + '/' + total
            + ' at 3× its measured floor (' + floor.toFixed(4) + ')'
            + ', and the quiet walked to a median ' + rampMed.toFixed(2) + ' against an even meeting\u2019s 0'
            + ' — the recorded pass band is real on real figures exactly as far as the battery is the one statistic');
        }

        {
            const bOS = $('bOutsideStreams');
            if (bOS)
                bOS.addEventListener('click', () => {
                    bOS.disabled = true;
                    bOS.textContent = 'screening the library…';
                    setTimeout(() => {
                        try {
                            const r = runOutsideStreams();
                            if (!r.res.length)
                                flashStatus('the outside streams: no usable primitives');
                            else
                                showOutsideStreams(r);
                        }
                        catch (e) {
                            flashStatus('the outside streams failed: ' + e.message);
                        }
                        finally {
                            bOS.disabled = false;
                            bOS.textContent = 'run the streams';
                        }
                    }, 0);
                });
        }
};
