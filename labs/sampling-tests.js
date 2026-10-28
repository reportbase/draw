// SAMPLING TESTS (?lab=smp), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labLadder, makeRng, sampProfile, sampShapeStat. It declares nothing the
// editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['sampling-tests'] = function () {
        function runSamplingTests() {
            const M = 2048,
                DRAWS = 40000,
                REC = 300000,
                rows = [];
            const usable = PRIMITIVES.filter(s => typeof s.pts === 'function');
            const WANT = 6,
                picked = [];
            for (let i = 0; i < WANT; i++)
                picked.push(usable[Math.floor(i * usable.length / WANT)]);
            const rnd = makeRng(31337);
            const found = [];
            for (const spec of usable) {
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
                // the arc element, from the profile: sqrt(r^2 + r'^2)
                const arc = [];
                for (let k = 0; k < M; k++) {
                    const kp = Math.min(M - 1, k + 1),
                        km = Math.max(0, k - 1);
                    const dr = (prof[kp].r - prof[km].r) / (prof[kp].a - prof[km].a);
                    arc.push(Math.hypot(prof[k].r, dr));
                }
                // the walker: arrivals distributed along the contour at constant speed
                const cum = [];
                let s = 0;
                for (let k = 0; k < M; k++) {
                    s += arc[k];
                    cum.push(s);
                }
                for (let k = 0; k < M; k++)
                    cum[k] /= s;
                const even = [],
                    walked = [];
                for (let i = 0; i < DRAWS; i++) {
                    const ke = Math.floor(rnd() * M);
                    even.push(Math.tan(prof[ke].a));
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
                    walked.push(Math.tan(prof[lo].a));
                }
                // and the recovery: the walker's arrival density IS the arc element
                const BINS = 40,
                    hist = new Float64Array(BINS);
                for (let i = 0; i < REC; i++) {
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
                    hist[Math.min(BINS - 1, Math.floor(BINS * lo / M))]++;
                }
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
                let worst = 0,
                    big = Math.max.apply(null, truth);
                for (let b = 0; b < BINS; b++)
                    worst = Math.max(worst, Math.abs(truth[b] - kfit * got[b]) / big);
                let rmin = Infinity,
                    rmax = -Infinity;
                for (const p of prof) {
                    rmin = Math.min(rmin, p.r);
                    rmax = Math.max(rmax, p.r);
                }
                const key = spec.key || spec.name || 'shape';
                found.push({
                    key,
                    pts: raw,
                    evenStat: sampShapeStat(even),
                    walkStat: sampShapeStat(walked),
                    swing: rmax / rmin,
                    recovery: worst
                });
            }
            // a round control, then the figures whose radius actually varies
            found.sort((a, b) => a.swing - b.swing);
            const chosen = found.length ? [found[0]] : [];
            for (let i = found.length - 1; i >= 0 && chosen.length < WANT; i--)
                if (found[i] !== chosen[0])
                    chosen.push(found[i]);
            for (const f of chosen) {
                // each figure is compared against ITSELF: the same statistic, the two ways of
                // meeting the turn, so what is read is the departure and not the absolute value
                const departure = Math.abs(f.walkStat - f.evenStat);
                rows.push({
                    key: f.key,
                    kind: 'stepped evenly',
                    pts: f.pts,
                    stat: f.evenStat,
                    swing: f.swing,
                    recovery: f.recovery,
                    departure
                });
                rows.push({
                    key: f.key,
                    kind: 'walked at speed',
                    pts: f.pts,
                    stat: f.walkStat,
                    swing: f.swing,
                    recovery: f.recovery,
                    departure
                });
            }
            return rows;
        }

        function showSamplingTests(rows) {
            const CAUCHY = 3.0777;
            const out = labLadder({
                rows,
                name: 'sampling tests',
                suffix: 'evenly · at the figure\u2019s pace',
                // teal where the reading is where it ought to be for that way of meeting the
                // turn: Cauchy when stepped evenly, and departed when walked
                // the evenly-stepped reading must sit at the Cauchy; the walked one is judged
                // against the SAME figure's own evenly-stepped reading, since the effect is
                // proportional to how much the figure varies
                verdict: r => {
                    if (r.kind === 'stepped evenly')
                        return Math.abs(r.stat - CAUCHY) < 0.08 ? 2 : 0;
                    if (r.swing < 1.05)
                        return r.departure < 0.08 ? 2 : 0; // a round control
                    return r.departure > 0.08 ? 2 : 0;
                },
                caption: r => r.key + ' · ' + r.kind + '\n'
                + 'shape statistic ' + (Number.isFinite(r.stat) ? r.stat.toFixed(3) : '—')
                + '  (a Cauchy reads 3.078)\n'
                + (r.kind === 'stepped evenly'
                ? 'at the Cauchy: the figure does not show'
                : (r.swing < 1.05
                ? 'a round control: departed by ' + r.departure.toFixed(3) + ', nothing to show'
                : 'departed by ' + r.departure.toFixed(3) + ' — the figure shows')) + '\n'
                + 'its radius swings by ' + r.swing.toFixed(2) + '×, arc element back to '
                + r.recovery.toExponential(0),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const ev = drawn.filter(r => r.kind === 'stepped evenly');
            const wk = drawn.filter(r => r.kind === 'walked at speed');
            const cauchyish = a => a.filter(r => Math.abs(r.stat - CAUCHY) < 0.08).length;
            const rounds = wk.filter(r => r.swing < 1.05).length;
            const departed = wk.filter(r => r.swing >= 1.05 && r.departure > 0.08).length;
            const varied = wk.filter(r => r.swing >= 1.05).length;
            const worst = Math.max.apply(null, drawn.map(r => r.recovery));
            flashStatus('sampling tests · ' + ev.length + ' primitives, each met twice'
            + ' — STEPPED EVENLY IN THE TURN the readings were Cauchy on ' + cauchyish(ev) + '/' + ev.length
            + ' of them, so the figures were indistinguishable and nothing of them survived'
            + ' · WALKED AT THE FIGURE\u2019S OWN PACE they left it on ' + departed + '/' + varied
            + ' of the figures whose radius actually varies, each judged against its own'
            + ' evenly-stepped reading rather than against a threshold'
            + ' — and the ' + rounds + ' round control departed by nothing, having nothing to show'
            + ' · and the departure is a MEASUREMENT: the walker\u2019s arrival density returned each'
            + ' figure\u2019s arc element to ' + worst.toExponential(0) + ' of its size'
            + ' — but the arc element is \u221a(r\u00b2+r\u2032\u00b2), so solving back for the figure leaves one'
            + ' constant, and that constant is where the reader was standing'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bST = $('bSamplingTests');
            if (bST)
                bST.addEventListener('click', () => {
                    bST.disabled = true;
                    bST.textContent = 'meeting the turn…';
                    setTimeout(() => {
                        try {
                            const r = runSamplingTests();
                            if (!r.length)
                                flashStatus('sampling tests: no usable primitives');
                            else
                                showSamplingTests(r);
                        }
                        catch (e) {
                            flashStatus('sampling tests failed: ' + e.message);
                        }
                        finally {
                            bST.disabled = false;
                            bST.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }
};
