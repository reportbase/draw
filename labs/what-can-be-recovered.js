// WHAT CAN BE RECOVERED (?lab=whr), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labLadder, makeRng, pick, sampProfile, sampShapeStat. It declares nothing
// the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['what-can-be-recovered'] = function () {
        // ── WHAT CAN BE RECOVERED ────────────────────────────────────────────────────
        // The screen and the recovery, put to each figure together. Met evenly, the
        // arrivals pass the screen and give back a frame and nothing of the figure. Met
        // at the figure's own pace they fail it, and the failure carries the figure's
        // arc element — exactly, and not the figure.
        function recPolar(vals) {
            // a closed curve from a radius sampled through the turn, drawn over the whole
            // round so it reads as a figure rather than a half
            const n = vals.length,
                pts = [];
            for (let k = 0; k < n; k++) {
                const a = -Math.PI / 2 + Math.PI * (k + 0.5) / n;
                pts.push({
                    x: vals[k] * Math.cos(a),
                    y: vals[k] * Math.sin(a)
                });
            }
            for (let k = 0; k < n; k++) {
                const a = -Math.PI / 2 + Math.PI * (k + 0.5) / n;
                pts.push({
                    x: -vals[k] * Math.cos(a),
                    y: -vals[k] * Math.sin(a)
                });
            }
            return pts;
        }

        function runWhatRecovered() {
            const M = 1024,
                DRAWS = 240000,
                BINS = 48,
                WANT = 4,
                rows = [];
            const rnd = makeRng(606060);
            const found = [];
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
                found.push({
                    spec,
                    raw,
                    prof,
                    arc,
                    swing: rmax / rmin
                });
            }
            found.sort((a, b) => b.swing - a.swing);
            for (const f of found.slice(0, WANT)) {
                const {spec, raw, prof, arc} = f;
                const key = spec.key || spec.name || 'shape';
                // met evenly: the arrivals are Cauchy, and a frame is what they give back
                const even = [];
                for (let i = 0; i < 40000; i++)
                    even.push(Math.tan(prof[Math.floor(rnd() * M)].a));
                const evenStat = sampShapeStat(even);
                const ev = even.filter(Number.isFinite).sort((x, y) => x - y);
                const qq = p => ev[Math.floor(p * ev.length)];
                const nearSt = qq(0.5),
                    cornerSt = (qq(0.75) - qq(0.25)) / 2;
                // walked at the figure's pace: the arrivals leave the family, and the
                // departure carries the arc element
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
                for (let i = 0; i < 40000; i++)
                    walked.push(Math.tan(prof[pick()].a));
                const walkStat = sampShapeStat(walked);
                const hist = new Float64Array(BINS);
                for (let i = 0; i < DRAWS; i++)
                    hist[Math.min(BINS - 1, Math.floor(BINS * pick() / M))]++;
                // the arc element, as the arrivals give it and as the contour gives it
                const truth = [],
                    got = [];
                for (let b = 0; b < BINS; b++) {
                    let ts = 0,
                        n = 0;
                    for (let k = Math.floor(b * M / BINS); k < Math.floor((b + 1) * M / BINS); k++) {
                        ts += arc[k];
                        n++;
                    }
                    truth.push(ts / n);
                    got.push(hist[b]);
                }
                let num = 0,
                    den = 0;
                for (let b = 0; b < BINS; b++) {
                    num += truth[b] * got[b];
                    den += got[b] * got[b];
                }
                const kfit = den ? num / den : 0;
                const rec = got.map(g => kfit * g);
                let worst = 0;
                const big = Math.max.apply(null, truth);
                for (let b = 0; b < BINS; b++)
                    worst = Math.max(worst, Math.abs(truth[b] - rec[b]) / big);
                // the circle the census draws from the evenly-met arrivals
                const circ = [];
                for (let k = 0; k < 240; k++) {
                    const a = 2 * Math.PI * k / 240;
                    circ.push({
                        x: Math.cos(a),
                        y: Math.sin(a)
                    });
                }
                rows.push({
                    key,
                    kind: 'as held',
                    pts: raw,
                    swing: f.swing,
                    note: 'the figure that was met',
                    stat: NaN,
                    worst
                });
                rows.push({
                    key,
                    kind: 'met evenly — recovered',
                    pts: circ,
                    swing: f.swing,
                    stat: evenStat,
                    note: 'screen passes: near ' + nearSt.toFixed(2) + ', corner ' + cornerSt.toFixed(2)
                    + '\n a circle, from any figure',
                    worst
                });
                rows.push({
                    key,
                    kind: 'walked — recovered',
                    pts: recPolar(rec),
                    swing: f.swing,
                    stat: walkStat,
                    note: 'screen fails, and the failure carries\n the arc element',
                    worst
                });
                rows.push({
                    key,
                    kind: 'the arc element itself',
                    pts: recPolar(truth),
                    swing: f.swing,
                    stat: NaN,
                    note: 'computed from the contour,\n for comparison',
                    worst
                });
            }
            return rows;
        }

        function showWhatRecovered(rows) {
            const CAUCHY = 3.0777;
            const out = labLadder({
                rows,
                name: 'what can be recovered',
                suffix: 'held · evenly · walked · the truth',
                verdict: r => r.kind === 'as held' ? 1
                : r.kind === 'met evenly — recovered' ? (Math.abs(r.stat - CAUCHY) < 0.08 ? 2 : 0)
                : r.kind === 'walked — recovered' ? (r.worst < 0.12 ? 2 : 0) : 1,
                caption: r => r.key + ' · ' + r.kind + '\n'
                + (Number.isFinite(r.stat) ? 'the arrivals read ' + r.stat.toFixed(3)
                + ' (a Cauchy reads 3.078)\n' : 'its radius swings by ' + r.swing.toFixed(2) + '×\n')
                + r.note
                + (r.kind === 'walked — recovered' ? '\n back to ' + (100 * r.worst).toFixed(1) + '% of its size' : ''),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const evens = drawn.filter(r => r.kind === 'met evenly — recovered');
            const walks = drawn.filter(r => r.kind === 'walked — recovered');
            const passed = evens.filter(r => Math.abs(r.stat - CAUCHY) < 0.08).length;
            const departed = walks.filter(r => Math.abs(r.stat - CAUCHY) >= 0.08).length;
            const best = walks.length ? Math.max.apply(null, walks.map(r => r.worst)) : 1;
            flashStatus('what can be recovered · ' + evens.length + ' figures, each met two ways'
            + ' — MET EVENLY the arrivals passed the screen on ' + passed + '/' + evens.length
            + ' and gave back a frame, and what the census draws from that frame is a circle of'
            + ' radius one: the same circle from every figure, because the division cancelled the'
            + ' figure before the arrivals were made'
            + ' · WALKED AT THE FIGURE\u2019S OWN PACE the arrivals failed the screen on '
            + departed + '/' + walks.length + ', and the failure carried the figure: its arc element'
            + ' came back to within ' + (100 * best).toFixed(1) + '% of its size, drawn beside the'
            + ' same quantity taken from the contour'
            + ' — what is recovered is \u221a(r\u00b2+r\u2032\u00b2) and not r, so the figure itself is fixed only'
            + ' up to one constant, and that constant is where the reader was standing'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bWR = $('bWhatRecovered');
            if (bWR)
                bWR.addEventListener('click', () => {
                    bWR.disabled = true;
                    bWR.textContent = 'recovering…';
                    setTimeout(() => {
                        try {
                            const r = runWhatRecovered();
                            if (!r.length)
                                flashStatus('what can be recovered: no usable primitives');
                            else
                                showWhatRecovered(r);
                        }
                        catch (e) {
                            flashStatus('what can be recovered failed: ' + e.message);
                        }
                        finally {
                            bWR.disabled = false;
                            bWR.textContent = 'lay it out';
                        }
                    }, 0);
                });
        }
};
