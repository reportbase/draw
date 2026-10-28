// TWO-READER TESTS (?lab=two), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately
// be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, TAU, flashStatus, hrtSampleRadial, hrtSweep, labLadder, labMed, taEntropy. It puts
// runTwoAtomTests, taAngularSweep back on the console hook window.__lab once loaded. Loaded the first time one of
// its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['two-reader-tests'] = function () {
        function taAngularSweep(rs, C) {
            const L = rs.length,
                TAU = Math.PI * 2,
                cs = TAU / C;
            const dirs = new Float64Array(L);
            let px = 0,
                py = 0,
                fx = 0,
                fy = 0;
            for (let k = 0; k < L; k++) {
                const a = (k + 0.5) * TAU / L + 1e-4; // the sampler's own angles
                const x = rs[k] * Math.cos(a),
                    y = rs[k] * Math.sin(a);
                if (k === 0) {
                    fx = x;
                    fy = y;
                } else
                    dirs[k - 1] = Math.atan2(y - py, x - px);
                px = x;
                py = y;
            }
            dirs[L - 1] = Math.atan2(fy - py, fx - px); // the closing chord — it arrives
            const wrap = v => {
                while (v > Math.PI)
                    v -= TAU;
                while (v <= -Math.PI)
                    v += TAU;
                return v;
            };
            let d = dirs[0];
            const cells = new Int32Array(L);
            for (let k = 0; k < L; k++) {
                const c = Math.round(wrap(dirs[(k + 1) % L] - d) / cs);
                d += c * cs;
                cells[k] = c;
            }
            return cells;
        }

        function runTwoAtomTests() {
            const L = 512,
                SIG = 0.036,
                C = 64;
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
                const rad = hrtSweep(rs, SIG, null);
                const cells = taAngularSweep(rs, C);
                let sum = 0,
                    mx = 0;
                for (const c of cells) {
                    sum += c;
                    if (Math.abs(c) > mx)
                        mx = Math.abs(c);
                }
                rows.push({
                    key: spec.key,
                    pts,
                    loopN: spec.loopN,
                    D: rad.D,
                    radBits: rad.bits,
                    sum,
                    angBits: taEntropy(Array.from(cells)),
                    mx
                });
            }
            return {
                rows,
                total,
                L,
                SIG,
                C
            };
        }

        function showTwoAtomReport(res) {
            const {rows, total, L, C} = res;
            // The two readers get a line each, and the winding gets the verdict — it is the claim
            // with an integer answer. "64/64" rather than the ratio, because the thing being
            // asserted is that the ring's cells SUM to one circumference, and a count against a
            // count says that; 1.0000 is the same fact rounded until it cannot be wrong.
            const out = labLadder({
                rows,
                name: 'two-reader tests',
                suffix: 'C=' + C,
                // Exact means both: the radial checksum on zero and the winding on the nose. Gold
                // is the tolerance the old table shaded — the radial within ±2, the ring within two
                // cells — and red is a genuine miss.
                verdict: r => (r.D === 0 && r.sum === C) ? 2
                : (Math.abs(r.D) <= 2 && Math.abs(r.sum - C) <= 2) ? 1 : 0,
                caption: r => r.key + '\n'
                + 'rad  D' + r.D + ' ' + r.radBits.toFixed(2) + 'b\n'
                + 'ang  ' + r.angBits.toFixed(3) + 'b max' + r.mx + '\n'
                + 'wind ' + r.sum + '/' + C + (r.sum === C ? ' ✓' : ' ✗'),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const radOk = drawn.filter(r => Math.abs(r.D) <= 2).length;
            const windExact = drawn.filter(r => r.sum === C).length;
            const windOk = drawn.filter(r => Math.abs(r.sum - C) <= 2).length;
            const sorted = [...drawn].sort((a, b) => a.angBits - b.angBits);
            const cheap = sorted[0],
                dear = sorted[sorted.length - 1];
            flashStatus('two-reader tests · ' + drawn.length + ' of ' + total + ' primitives representable'
            + ' · ring C=' + C + ' L=' + L
            + ' — radial checksum 0 (±2) in ' + radOk + '/' + drawn.length
            + ' · winding exactly one circumference in ' + windExact + '/' + drawn.length
            + ' (' + windOk + ' within 2 cells)'
            + ' · median bits/look radial ' + labMed(drawn.map(r => r.radBits)).toFixed(3)
            + ', angular ' + labMed(drawn.map(r => r.angBits)).toFixed(3)
            + ' · cheapest sentence ' + cheap.key + ' ' + cheap.angBits.toFixed(3)
            + ', dearest ' + dear.key + ' ' + dear.angBits.toFixed(3)
            + ' (convex ceiling H(C/L)=0.544 — concavity pays beyond it)'
            + ' · largest single cell ' + Math.max(...drawn.map(r => r.mx)) + ', the ring did not rail'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bA = $('bTwoAtomTests');
            if (bA)
                bA.addEventListener('click', () => {
                    bA.disabled = true;
                    bA.textContent = 'running…';
                    setTimeout(() => {
                        try {
                            const res = runTwoAtomTests();
                            if (!res.rows.length)
                                flashStatus('two-reader tests: no representable primitives');
                            else
                                showTwoAtomReport(res);
                        } catch (e) {
                            flashStatus('two-reader tests failed: ' + e.message);
                        }
                        finally {
                            bA.disabled = false;
                            bA.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { runTwoAtomTests, taAngularSweep });
};
