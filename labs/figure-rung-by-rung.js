// THE FIGURE, RUNG BY RUNG (?lab=rbr), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, asmResample, flashStatus, labLadder, lodDraw, lodProfile. It declares nothing the
// editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['figure-rung-by-rung'] = function () {
        function lodSnap(prof, sig) {
            return prof.map(v => Math.exp(Math.round(Math.log(v) / sig) * sig));
        }

        function runRungByRung() {
            const KEY = 'clover',
                N = 720,
                SIGMA = Math.log(100) / 128;
            const spec = PRIMITIVES.find(q => q.key === KEY);
            if (!spec || typeof spec.pts !== 'function')
                return [];
            const prof = lodProfile(asmResample(spec.pts(), 1200), N);
            let hi = 0,
                lo = Infinity;
            for (const v of prof) {
                hi = Math.max(hi, Math.log(v));
                lo = Math.min(lo, Math.log(v));
            }
            const span = hi - lo; // the figure's whole swing, in log
            const rows = [];
            let far = 0;
            for (const v of prof)
                far = Math.max(far, Math.abs(Math.log(v)));
            // the first step is deliberately coarser than the figure's whole swing, so that every
            // reading rounds to rung zero — which is the ratio one, which is the unit curve
            for (const sig of [2.5 * far, span / 2, span / 4, span / 8, span / 16]) {
                const sn = lodSnap(prof, sig);
                const levels = new Set(sn.map(v => Math.round(Math.log(v) / sig))).size;
                let dev = 0;
                for (let k = 0; k < N; k++)
                    dev = Math.max(dev, Math.abs(sn[k] - prof[k]));
                rows.push({
                    kind: levels === 1 ? 'one rung \u2014 the unit curve' : levels + ' rungs',
                    pts: lodDraw(sn),
                    sig,
                    levels,
                    note: levels === 1
                    ? 'a step coarser than the figure\u2019s whole\n swing: every reading is rung zero,\n and rung zero is the ratio one'
                    : 'step ' + (100 * (Math.exp(sig) - 1)).toFixed(1) + '% per rung',
                    dev
                });
            }
            const sn = lodSnap(prof, SIGMA);
            const lv = new Set(sn.map(v => Math.round(Math.log(v) / SIGMA))).size;
            let dev = 0;
            for (let k = 0; k < N; k++)
                dev = Math.max(dev, Math.abs(sn[k] - prof[k]));
            rows.push({
                kind: 'the register\u2019s own step',
                pts: lodDraw(sn),
                sig: SIGMA,
                levels: lv,
                note: lv + ' rungs across the figure\n at 2.9% a rung',
                dev
            });
            rows.push({
                kind: 'the figure',
                pts: lodDraw(prof),
                note: 'every reach, unrounded',
                dev: 0
            });
            return rows;
        }

        function showRungByRung(rows) {
            const out = labLadder({
                rows,
                name: 'the figure, rung by rung',
                suffix: 'a level of detail is the register\u2019s step, and the first rung is a circle',
                verdict: r => r.dev === 0 ? 1 : (r.levels === 1 ? 0 : 2),
                caption: r => r.kind + '\n' + r.note
                + (r.dev ? '\n departs ' + (100 * r.dev).toFixed(1) + '% of the unit' : ''),
            });
            if (!out)
                return;
            const {ms} = out;
            flashStatus('the figure, rung by rung \u00b7 A LEVEL OF DETAIL IS NOT A SETTING, IT IS THE'
            + ' REGISTER\u2019S STEP \u00b7 every reading is a ratio held to the nearest rung, so at a'
            + ' coarse enough step every reading is rung zero \u2014 and rung zero is the ratio one,'
            + ' which is a circle \u00b7 that is the first cell, and it is not a failure of the reader'
            + ' but the most it can say at that step: THE UNIT CURVE IS WHAT A COARSE ENOUGH REGISTER'
            + ' SAYS ABOUT EVERYTHING \u00b7 refine the step and the figure separates from the circle one'
            + ' rung at a time, and the reader\u2019s own step is the last cell but one'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bRR = $('bRungByRung');
            if (bRR)
                bRR.addEventListener('click', () => {
                    bRR.disabled = true;
                    bRR.textContent = 'refining\u2026';
                    setTimeout(() => {
                        try {
                            const r = runRungByRung();
                            if (!r.length)
                                flashStatus('rung by rung: no usable primitive');
                            else
                                showRungByRung(r);
                        }
                        catch (e) {
                            flashStatus('rung-by-rung run failed: ' + e.message);
                        }
                        finally {
                            bRR.disabled = false;
                            bRR.textContent = 'refine it';
                        }
                    }, 0);
                });
        }
};
