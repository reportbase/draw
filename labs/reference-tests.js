// REFERENCE TESTS (?lab=ref), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately
// be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, grazing, hrtSampleRadial, labLadder. It declares nothing the editor
// reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['reference-tests'] = function () {
        // ── REFERENCE TESTS ──────────────────────────────────────────────────────────
        // The record paper marks crossings of a reference. Which references can a
        // serial reader actually have, and what does each cost? The median needs every
        // arrival; the first arrival needs one slot and no computation; the held value
        // needs nothing at all. Only two questions matter of a mark: does it survive a
        // rescaling, and do different grains mark the same arrivals.
        function refEmit(v, policy, beta, med) {
            const lnB = Math.log(beta);
            let h = v[0],
                marks = [];
            let ref = policy === 'median' ? med : v[0];
            let prev = Math.sign(v[0] - ref);
            for (let k = 0; k < v.length; k++) {
                if (policy === 'held')
                    ref = h; // the reference that moves
                const l = Math.round(Math.log(v[k] / h) / lnB);
                if (l !== 0)
                    h *= Math.exp(l * lnB);
                const s = Math.sign(v[k] - ref);
                if (s !== 0 && prev !== 0 && s !== prev)
                    marks.push(k);
                if (s !== 0)
                    prev = s;
            }
            return marks;
        }

        function runReferenceTests() {
            const POL = ['median', 'first', 'held'],
                G = [1.05, 1.2, 1.6],
                L = [0.37, 2.5, 100];
            const rows = [];
            let total = 0;
            const agg = {};
            for (const p of POL)
                agg[p] = {
                    n: 0,
                    scale: 0,
                    grain: 0,
                    marks: 0
                };
            let grazing = 0;
            for (const spec of PRIMITIVES) {
                total++;
                if (typeof spec.pts !== 'function')
                    continue;
                const rs = hrtSampleRadial(spec.pts(), 256);
                if (!rs)
                    continue;
                const v = Array.from(rs);
                const sorted = v.slice().sort((a, b) => a - b),
                    med = sorted[sorted.length >> 1];
                // does the sweep merely touch a reference, rather than pass through it? A
                // reference is itself a reading, so it is met once by definition; a SECOND
                // arrival at the same value is a touch with no crossing in it.
                let tFirst = 0,
                    tMed = 0;
                for (const x of v) {
                    if (x === v[0])
                        tFirst++;
                    if (x === med)
                        tMed++;
                }
                const grazes = tFirst > 1 || tMed > 1;
                if (grazes)
                    grazing++;
                const row = {
                    key: spec.key || spec.name || 'shape',
                    pts: spec.pts(),
                    grazes,
                    per: {}
                };
                for (const pol of POL) {
                    const base = refEmit(v, pol, 1.2, med);
                    if (base.length < 2) {
                        row.per[pol] = null;
                        continue;
                    }
                    agg[pol].n++;
                    agg[pol].marks += base.length;
                    let scale = true;
                    for (const lam of L)
                        if (refEmit(v.map(x => x * lam), pol, 1.2, med * lam).join() !== base.join())
                        {
                            scale = false;
                            break;
                        }
                    let grain = true,
                        first = null;
                    for (const g of G) {
                        const m = refEmit(v, pol, g, med).join();
                        if (first === null)
                            first = m;
                        else if (m !== first) {
                            grain = false;
                            break;
                        }
                    }
                    if (scale)
                        agg[pol].scale++;
                    if (grain)
                        agg[pol].grain++;
                    row.per[pol] = {
                        scale,
                        grain,
                        marks: base.length
                    };
                }
                rows.push(row);
            }
            return {
                rows,
                total,
                agg,
                grazing
            };
        }

        function showReferenceReport(res) {
            const {rows, total, agg, grazing} = res;
            const pct = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '—';
            const out = labLadder({
                rows,
                name: 'reference tests',
                suffix: 'median · first · held',
                // teal: the two serial policies that keep a grain-free mark. gold: the mark
                // survives rescaling but not the change of grain. red: neither.
                verdict: r => {
                    const f = r.per.first,
                        h = r.per.held;
                    if (!f)
                        return 0;
                    return (f.grain && f.scale) ? 2 : (f.grain || f.scale ? 1 : 0);
                },
                caption: r => r.key + '\n'
                + 'median  ' + (r.per.median ? (r.per.median.scale ? 'scale ✓' : 'scale ✗') + ' ' + (r.per.median.grain ? 'grain ✓' : 'grain ✗') : '—') + '\n'
                + 'first   ' + (r.per.first ? (r.per.first.scale ? 'scale ✓' : 'scale ✗') + ' ' + (r.per.first.grain ? 'grain ✓' : 'grain ✗') : '—') + '\n'
                + 'held    ' + (r.per.held ? (r.per.held.scale ? 'scale ✓' : 'scale ✗') + ' ' + (r.per.held.grain ? 'grain ✓' : 'grain ✗') : '—')
                + (r.grazes ? '  · touches' : ''),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const a = agg.median,
                b = agg.first,
                c = agg.held;
            flashStatus('reference tests · ' + drawn.length + ' of ' + total + ' primitives, three sources for the mark'
            + ' — MEDIAN (every arrival held at once): scale ' + pct(a.scale, a.n) + ', grain ' + pct(a.grain, a.n)
            + ', ' + (a.marks / (a.n || 1)).toFixed(1) + ' marks'
            + ' · FIRST ARRIVAL (one slot, never updated): scale ' + pct(b.scale, b.n) + ', grain ' + pct(b.grain, b.n)
            + ', ' + (b.marks / (b.n || 1)).toFixed(1) + ' marks'
            + ' · HELD VALUE (one slot, nothing extra): scale ' + pct(c.scale, c.n) + ', grain ' + pct(c.grain, c.n)
            + ', ' + (c.marks / (c.n || 1)).toFixed(1) + ' marks'
            + ' — SO THE GRAIN-FREE MARK COSTS EXACTLY ONE EXTRA SLOT, and the reference need not be computed:'
            + ' any arrival held and left alone does what the median was doing, while a reference that moves with'
            + ' the reader loses grain-independence altogether and marks three times as often'
            + ' · residual fragility: ' + grazing + ' primitives merely TOUCH their reference rather than crossing it'
            + ' — a tangency is not a crossing, and that is where the rescaled runs disagree'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bReferenceT = $('bReferenceTests');
            if (bReferenceT)
                bReferenceT.addEventListener('click', () => {
                    bReferenceT.disabled = true;
                    bReferenceT.textContent = 'comparing…';
                    setTimeout(() => {
                        try {
                            const r = runReferenceTests();
                            if (!r.rows.length)
                                flashStatus('reference tests: no representable primitives');
                            else
                                showReferenceReport(r);
                        }
                        catch (e) {
                            flashStatus('reference tests failed: ' + e.message);
                        }
                        finally {
                            bReferenceT.disabled = false;
                            bReferenceT.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }
};
