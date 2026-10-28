// THE CORNER READS THE BREADTH (?lab=crb), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, _octReadings, flashStatus, labLadder, labMed. It puts runCornerReads back on the
// console hook window.__lab once loaded. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['corner-reads-the-breadth'] = function () {
        // ── THE CORNER READS THE BREADTH (SPN §2.2, RaP §8 / T8) ─────────────────────
        // Stretch an outline in v by b. Laid as the circle is (along the UNSTRETCHED outline,
        // then stretched), every reading is b times its unstretched reading, so the share before
        // the corner is the share of unstretched readings below 1/b. The evenly spread world's
        // rule reads b back as 1/tan(π·share/2) (arctan's inverse, the shortcut, R148): exact
        // for the circle, a median 13% off over the library (T8). Against the shape's own
        // unstretched readings it is exact. Laid along the STRETCHED outline the share still
        // falls with b, but the rule misreads it (T8: median 27%).
        const CRB_BS = [1.5, 2, 3, 5, 10],
            CRB_M = 20000;

        function _crbRule(p) {
            return 1 / Math.tan(Math.PI * p / 2);
        }

        function runCornerReads() {
            const rows = [];
            let total = 0;
            for (const spec of PRIMITIVES) {
                total++;
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
                const s = _octReadings(pts, CRB_M),
                    sorted = Float64Array.from(s).sort();
                const eEven = [],
                    eKnown = [],
                    eAlong = [];
                for (const b of CRB_BS) {
                    let n = 0;
                    for (let i = 0; i < CRB_M; i++)
                        if (s[i] * b < 1)
                            n++;
                    const p = n / CRB_M;
                    eEven.push(Math.abs(_crbRule(p) / b - 1));
                    const q = n > 0 ? sorted[n - 1] : sorted[0]; // 1/b is the shape's own reading at that share
                    eKnown.push(Math.abs((1 / Math.max(q, 1e-15)) / b - 1));
                    const s2 = _octReadings(pts.map(v => ({
                        x: v.x,
                        y: v.y * b
                    })), CRB_M);
                    let n2 = 0;
                    for (let i = 0; i < CRB_M; i++)
                        if (s2[i] < 1)
                            n2++;
                    eAlong.push(Math.abs(_crbRule(n2 / CRB_M) / b - 1));
                }
                rows.push({
                    key: spec.key,
                    pts,
                    loopN: spec.loopN,
                    even: labMed(eEven),
                    known: labMed(eKnown),
                    along: labMed(eAlong)
                });
            }
            return {
                rows,
                total
            };
        }

        function showCornerReads(res) {
            const {rows, total} = res;
            const pc = x => !isFinite(x) ? '—' : (x < 0.001 ? (100 * x).toFixed(2) : x < 0.1 ? (100 * x).toFixed(1) : (100 * x).toFixed(0)) + '%';
            const out = labLadder({
                rows,
                name: 'the corner reads the breadth',
                suffix: 'b = 1.5 to 10',
                verdict: r => r.even < 0.05 ? 2 : (r.even < 0.2 ? 1 : 0),
                caption: r => r.key + '\n'
                + 'even ' + pc(r.even) + ' · known ' + pc(r.known) + '\n'
                + 'stretched ' + pc(r.along),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const n2 = drawn.filter(r => r.even < 0.05).length,
                n1 = drawn.filter(r => r.even >= 0.05 && r.even < 0.2).length;
            const circ = drawn.find(r => r.key === 'circle');
            flashStatus('the corner reads the breadth · ' + drawn.length + ' of ' + total + ' primitives, each stretched in v by 1.5, 2, 3, 5 and 10'
            + (circ ? ' · circle: even share ' + pc(circ.even) + ', shape known ' + pc(circ.known) : '')
            + ' · median error in b over the library: even share ' + pc(labMed(drawn.map(r => r.even)))
            + ', shape known ' + pc(labMed(drawn.map(r => r.known)))
            + ', along the stretched outline ' + pc(labMed(drawn.map(r => r.along)))
            + ' · even share within 5% on ' + n2 + ', within 20% on ' + n1 + ', beyond on ' + (drawn.length - n2 - n1)
            + ' · laid by direction, the share is ½ for every shape and every b'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bCor = $('bCornerReads');
            if (bCor)
                bCor.addEventListener('click', () => {
                    bCor.disabled = true;
                    bCor.textContent = 'stretching…';
                    setTimeout(() => {
                        try {
                            const res = runCornerReads();
                            if (!res.rows.length)
                                flashStatus('the corner reads the breadth: no single-outline primitives');
                            else
                                showCornerReads(res);
                        } catch (e) {
                            flashStatus('the corner reads the breadth failed: ' + e.message);
                        }
                        finally {
                            bCor.disabled = false;
                            bCor.textContent = 'stretch and read';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { runCornerReads });
};
