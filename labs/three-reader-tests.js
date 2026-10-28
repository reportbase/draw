// THREE-READER TESTS (?lab=tri), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, hrtSampleRadial, hrtSweep, labLadder, labMed, taBearingSweep, taEntropy.
// It puts runThreeAtomTests back on the console hook window.__lab once loaded. Loaded the first time one of its
// buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['three-reader-tests'] = function () {
        function runThreeAtomTests() {
            const L = 512,
                SIG = 0.036,
                C = 64,
                D2 = 2.5; // the corpus separation
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
                const rs = hrtSampleRadial(pts, L);
                if (!rs)
                    continue;
                const rsC = new Float64Array(L + 1);
                rsC.set(rs);
                rsC[L] = rs[0]; // the closing arrival is real
                const rad = hrtSweep(rsC, SIG, null);
                const sum = a => {
                    let s = 0;
                    for (const v of a)
                        s += v;
                    return s;
                };
                const cnt = a => {
                    let s = 0;
                    for (const v of a)
                        s += Math.abs(v);
                    return s;
                };
                const r1 = taBearingSweep(rs, C, 0, 0),
                    r2 = taBearingSweep(rs, C, D2, 0);
                const b1 = taBearingSweep(rs, 2, 0, 0),
                    b2 = taBearingSweep(rs, 2, D2, 0);
                rows.push({
                    key: spec.key,
                    pts,
                    loopN: spec.loopN,
                    D: rad.D,
                    w1: sum(r1) / C,
                    w2: sum(r2) / C,
                    bits1: taEntropy(Array.from(r1)),
                    bits2: taEntropy(Array.from(r2)),
                    ob1: sum(b1) / 2,
                    ob2: sum(b2) / 2,
                    obCells2: cnt(b2)
                });
            }
            return {
                rows,
                total,
                L,
                SIG,
                C,
                D2
            };
        }

        function showThreeAtomReport(res) {
            const {rows, total, C, D2} = res;
            // The pair is the point, so both windings sit on one line and are read across rather
            // than down: (1, 0) is the homology class, and a caption that splits it over two
            // lines makes you assemble the thing being claimed. The one-bit ring gets the
            // verdict line — it is the strictest condition here (exact windings AND silence).
            const triple = r => r.D === 0 && r.w1 === 1 && r.w2 === 0;
            const onebit = r => r.ob1 === 1 && r.ob2 === 0 && r.obCells2 === 0;
            const out = labLadder({
                rows,
                name: 'three-reader tests',
                suffix: 'C=' + C + ' d=' + D2,
                verdict: r => (triple(r) && onebit(r)) ? 2 : (triple(r) ? 1 : 0),
                caption: r => r.key + '\n'
                + 'D' + r.D + ' w ' + r.w1.toFixed(3) + '/' + r.w2.toFixed(3) + '\n'
                + 'bits ' + r.bits1.toFixed(3) + '/' + r.bits2.toFixed(3) + '\n'
                + '1bit ' + r.ob1.toFixed(1) + '/' + r.ob2.toFixed(1) + ' c' + r.obCells2
                + (onebit(r) ? ' ✓' : ' ✗'),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const exact = drawn.filter(triple).length;
            const obExact = drawn.filter(r => r.ob1 === 1 && r.ob2 === 0).length;
            const silent = drawn.filter(r => r.obCells2 === 0).length;
            flashStatus('three-reader tests · ' + drawn.length + ' of ' + total + ' primitives representable'
            + ' · second mark at ' + D2 + ' shape units, rings on bearings C=' + C + ' and C=2'
            + ' — triple exact (radial 0, windings 1/0 to the cell) in ' + exact + '/' + drawn.length
            + ' · one-bit windings exact in ' + obExact + '/' + drawn.length
            + ' · unenclosed mark dead silent (0 cells, not net 0) in ' + silent + '/' + drawn.length
            + ' · median bits/look ring1 ' + labMed(drawn.map(r => r.bits1)).toFixed(3)
            + ' (H(C/512), every shape alike — the ray ring has no shape term)'
            + ', ring2 ' + labMed(drawn.map(r => r.bits2)).toFixed(3) + " (the spectator's subtense)"
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const b3 = $('bThreeAtomTests');
            if (b3)
                b3.addEventListener('click', () => {
                    b3.disabled = true;
                    b3.textContent = 'running…';
                    setTimeout(() => {
                        try {
                            const res = runThreeAtomTests();
                            if (!res.rows.length)
                                flashStatus('three-reader tests: no representable primitives');
                            else
                                showThreeAtomReport(res);
                        } catch (e) {
                            flashStatus('three-reader tests failed: ' + e.message);
                        }
                        finally {
                            b3.disabled = false;
                            b3.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { runThreeAtomTests });
};
