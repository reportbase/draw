// WHERE THE GEOMETRY GOES (?lab=whg), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, asmFit, flashStatus, labLadder, lodDraw, makeRng. It declares nothing the editor
// reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['where-the-geometry-goes'] = function () {
        // ── where the geometry goes ─────────────────────────────────────────
        // The companion to "rung by rung". That page shows the shapes; this one shows what is
        // happening underneath them. As the step coarsens, held readings pile up on rung zero;
        // rung zero is the ratio one; and readings that are all one disagree about nothing. The
        // corner does not go fuzzy — it goes EVERYWHERE, which is the same as nowhere.
        function wgSnap(v, sig) {
            return Math.exp(Math.round(Math.log(v) / sig) * sig);
        }

        function wgServoCorner(sig, n, seed) {
            // the three-slot servo on a signed Cauchy stream, whose quartiles are exactly -1 and +1
            const rnd = makeRng(seed || 424242);
            let near = 0,
                U = 1,
                L = -1;
            for (let i = 0; i < n; i++) {
                const raw = Math.tan(Math.PI * (rnd() - 0.5));
                if (!isFinite(raw) || raw === 0)
                    continue;
                const x = Math.sign(raw) * Math.exp(Math.round(Math.log(Math.abs(raw)) / sig) * sig);
                const st = sig * Math.max((U - L) / 2, 1e-12);
                near += st * (x > near ? 1 : -1);
                if (x > near)
                    U += st * (x > U ? 1 : -1);
                else
                    L += st * (x > L ? 1 : -1);
            }
            return U;
        }

        function wgInvariantError(sig, corner) {
            const rnd = makeRng(909090);
            const form = (x, c) => {
                const r = (i, j) => x[i] / x[j];
                const den = (r(1, 2) - c) * (r(0, 3) - c);
                return Math.abs(den) > 1e-12 ? (r(0, 2) - c) * (r(1, 3) - c) / den : NaN;
            };
            const d = [];
            for (let t = 0; t < 1500; t++) {
                const q = [0, 1, 2, 3].map(() => Math.exp((rnd() - 0.5) * 6));
                const A = form(q, 1),
                    B = form(q.map(v => wgSnap(v, sig)), corner);
                if (isFinite(A) && isFinite(B) && Math.abs(A) > 1e-9)
                    d.push(Math.abs(B - A) / Math.abs(A));
            }
            d.sort((a, b) => a - b);
            return d.length ? d[Math.floor(d.length / 2)] : NaN;
        }

        function runWhereGeometryGoes() {
            const SIGMA = Math.log(100) / 128,
                N = 720,
                SPAN = 25;
            const prof = [];
            for (let k = 0; k < N; k++)
                prof.push(Math.exp((SPAN * SIGMA / 2) * Math.cos(5 * 2 * Math.PI * k / N)));
            let lo = Infinity,
                hi = 0;
            for (const v of prof) {
                lo = Math.min(lo, v);
                hi = Math.max(hi, v);
            }
            const swing = hi - lo;
            const rows = [];
            for (const rpd of [128, 64, 16, 8, 4, 2]) {
                const sig = Math.log(10) / rpd;
                const held = prof.map(v => wgSnap(v, sig));
                const ks = held.map((v, i) => Math.round(Math.log(prof[i]) / sig));
                const levels = new Set(ks).size;
                const atZero = ks.filter(k => k === 0).length / N;
                const rnd = makeRng(31337);
                const gaps = [];
                for (let t = 0; t < 2000; t++) {
                    const i = Math.floor(rnd() * N),
                        j = Math.floor(rnd() * N);
                    gaps.push(Math.abs(held[i] - held[j]) / swing);
                }
                gaps.sort((a, b) => a - b);
                const dis = gaps[Math.floor(gaps.length / 2)];
                // a finer register needs proportionally more looks to settle into it — the servo's
                // own floor is a step size, so a smaller step takes longer to walk down to. And a
                // single servo run is one draw of a heavy-tailed quantity, so take the median of
                // several: the corpus's own rule, applied to its own instrument.
                const looks = Math.min(200000, Math.round(12000 * rpd / 8));
                const cs = [];
                for (let t = 0; t < 5; t++)
                    cs.push(wgServoCorner(sig, looks, 1013904223 + t * 7919));
                cs.sort((a, b) => a - b);
                const corner = cs[2];
                const inv = wgInvariantError(sig, corner);
                rows.push({
                    kind: rpd + ' rungs a decade',
                    pts: asmFit(lodDraw(held)),
                    levels,
                    atZero,
                    dis,
                    corner,
                    inv,
                    note: levels + (levels === 1 ? ' rung across the figure' : ' rungs across the figure')
                });
            }
            return rows;
        }

        function showWhereGeometryGoes(rows) {
            const out = labLadder({
                rows,
                name: 'where the geometry goes',
                suffix: 'the corner does not go fuzzy at a coarse step \u2014 it goes everywhere',
                verdict: r => r.dis < 0.05 ? 0 : (r.inv < 0.10 ? 2 : 1),
                caption: r => r.kind + '\n' + r.note
                + '\n ' + (100 * r.atZero).toFixed(0) + '% of readings at rung zero'
                + '\n two readings differ by ' + (100 * r.dis).toFixed(0) + '% of the swing'
                + '\n its corner lands at ' + r.corner.toFixed(2) + ' (it should be 1.00)'
                + '\n the invariant, on that corner: '
                + (isFinite(r.inv) ? (100 * r.inv).toFixed(0) + '%' : 'nothing left to compute'),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const last = drawn[drawn.length - 1];
            flashStatus('where the geometry goes \u00b7 read the DISAGREEMENT line down the cells: it does'
            + ' NOT fade as the step coarsens \u2014 it holds near a third of the swing and then falls off'
            + ' a cliff to nothing \u00b7 at the last cell every reading is at rung zero, and RUNG ZERO IS'
            + ' THE RATIO ONE, so readings that are all one disagree about nothing at all \u00b7 that is'
            + ' why the invariant, computed on the corner the reader itself found, is worthless long'
            + ' before the figure looks bad: THE CORNER DOES NOT GO FUZZY AT A COARSE STEP, IT GOES'
            + ' EVERYWHERE, and every arrangement sitting at the corner is the same as no arrangement'
            + ' sitting anywhere in particular \u00b7 the unit curve is not a crude answer, it is the'
            + ' ABSENCE of one, wearing the one shape the reader can still name \u00b7 two honest'
            + ' notes on the numbers: the corner line WANDERS at the coarse end and that wandering'
            + ' is the result rather than noise in it, while at the fine end this page spends fewer'
            + ' looks than a fine register needs to settle into, so the topmost cell flatters itself'
            + ' less than it should'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bWG = $('bWhereGeometry');
            if (bWG)
                bWG.addEventListener('click', () => {
                    bWG.disabled = true;
                    bWG.textContent = 'coarsening\u2026';
                    setTimeout(() => {
                        try {
                            const r = runWhereGeometryGoes();
                            if (!r.length)
                                flashStatus('where the geometry goes: nothing to run');
                            else
                                showWhereGeometryGoes(r);
                        }
                        catch (e) {
                            flashStatus('run failed: ' + e.message);
                        }
                        finally {
                            bWG.disabled = false;
                            bWG.textContent = 'coarsen it';
                        }
                    }, 0);
                });
        }
};
