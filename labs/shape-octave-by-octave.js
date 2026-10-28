// THE SHAPE, OCTAVE BY OCTAVE (?lab=oct), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, _octReadings, flashStatus, labLadder, labMed, ring. It puts runOctaves back on the
// console hook window.__lab once loaded. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['shape-octave-by-octave'] = function () {
        // ── THE SHAPE, OCTAVE BY OCTAVE (SPN §3.3) ────────────────────────────────────
        // Each reading kept as (side, octave k, place t), k counted outward from the corner by
        // the share (v/h before it, h/v past it), t in OCT_B steps, readings past OCT_K lumped.
        // The shape's spread over those cells, less the circle's, is where it differs from the
        // circle; summed by octave it says where the shape shows itself. Prototyped headless on
        // 3 Oct (rap/oct_proto.py): cumulative difference seen by octave 0–4, median over the
        // library, 0.30 / 0.55 / 0.73 / 0.84 / 0.91, against SPN's octaves2.py 0.26 / 0.54 / 0.75
        // / 0.86 / 0.93 (binning differs a little).
        const OCT_K = 12,
            OCT_B = 16,
            OCT_M = 20000;

        function _octHist(s) {
            const H = new Float64Array(2 * (OCT_K + 1) * OCT_B),
                M = s.length;
            for (let i = 0; i < M; i++) {
                const r = s[i],
                    side = r > 1 ? 1 : 0,
                    q = r > 1 ? 1 / r : Math.max(r, 1e-300);
                let k = Math.floor(-Math.log2(q)),
                    b = 0;
                if (k >= OCT_K)
                    k = OCT_K;
                else
                    b = Math.min(OCT_B - 1, Math.max(0, Math.floor((Math.pow(2, k + 1) * q - 1) * OCT_B)));
                H[(side * (OCT_K + 1) + k) * OCT_B + b] += 1 / M;
            }
            return H;
        }

        function _octPerOctave(H, C) {
            // |H − C| summed over sides and places, by octave
            const per = new Float64Array(OCT_K + 1);
            for (let side = 0; side < 2; side++)
                for (let k = 0; k <= OCT_K; k++)
                    for (let b = 0; b < OCT_B; b++) {
                        const i = (side * (OCT_K + 1) + k) * OCT_B + b;
                        per[k] += C ? Math.abs(H[i] - C[i]) : H[i];
                    }
            return per;
        }

        function runOctaves() {
            const C = _octHist(_octReadings(ring(4000, 1, 1), OCT_M));
            const share = _octPerOctave(C, null); // the circle's readings by octave
            const rows = [];
            let total = 0;
            for (const spec of PRIMITIVES) {
                total++;
                if (typeof spec.pts !== 'function')
                    continue; // compound: excluded
                let pts;
                try {
                    pts = spec.pts();
                } catch (e) {
                    continue;
                }
                if (!pts || pts.length < 3 || spec.key === 'circle')
                    continue;
                const per = _octPerOctave(_octHist(_octReadings(pts, OCT_M)), C);
                let tot = 0;
                for (const x of per)
                    tot += x;
                const row = {
                    key: spec.key,
                    pts,
                    loopN: spec.loopN,
                    tot
                };
                if (tot < 0.01) {
                    row.same = true;
                    rows.push(row);
                    continue;
                }
                const sh = Array.from(per, x => x / tot),
                    cum = [];
                let acc = 0;
                for (const x of sh) {
                    acc += x;
                    cum.push(acc);
                }
                Object.assign(row, {
                    sh,
                    cum,
                    w0: sh[0] / share[0]
                });
                rows.push(row);
            }
            return {
                rows,
                total,
                share
            };
        }

        function showOctaves(res) {
            const {rows, total, share} = res;
            const f2 = x => x.toFixed(2);
            const out = labLadder({
                rows,
                name: 'the shape, octave by octave',
                suffix: 'against the circle',
                verdict: r => r.same ? 1 : (r.w0 < 0.8 ? 2 : (r.w0 < 1 ? 1 : 0)),
                caption: r => r.same ? r.key + '\nas the circle'
                : r.key + '\n'
                + 'seen ' + f2(r.cum[0]) + ' · ' + f2(r.cum[2]) + ' · ' + f2(r.cum[4]) + '\n'
                + 'octave 0: ' + f2(r.w0) + ' a reading',
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const rd = drawn.filter(r => !r.same);
            const med = k => labMed(rd.map(r => r.cum[k]));
            const n2 = rd.filter(r => r.w0 < 0.8).length,
                n0 = rd.filter(r => r.w0 >= 1).length;
            flashStatus('the shape, octave by octave · ' + drawn.length + ' of ' + total + ' primitives against the circle, laid along the outline'
            + ' · median difference seen by octave 0–5: ' + [0, 1, 2, 3, 4, 5].map(k => f2(med(k))).join(' / ')
            + ' · octave 0 holds ' + f2(share[0]) + ' of the readings and carries ' + f2(labMed(rd.map(r => r.w0))) + ' per reading (median)'
            + ' · away from the corner on ' + n2 + ', near it on ' + n0 + ', between on ' + (rd.length - n2 - n0)
            + ' · reads as the circle: ' + (drawn.filter(r => r.same).map(r => r.key).join(', ') || 'none')
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bOct = $('bOctaves');
            if (bOct)
                bOct.addEventListener('click', () => {
                    bOct.disabled = true;
                    bOct.textContent = 'reading…';
                    setTimeout(() => {
                        try {
                            const res = runOctaves();
                            if (!res.rows.length)
                                flashStatus('the shape, octave by octave: no single-outline primitives');
                            else
                                showOctaves(res);
                        } catch (e) {
                            flashStatus('the shape, octave by octave failed: ' + e.message);
                        }
                        finally {
                            bOct.disabled = false;
                            bOct.textContent = 'read by octaves';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { runOctaves });
};
