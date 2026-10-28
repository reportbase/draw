// THE FIGURE THE RATIO NEVER CARRIED (?lab=fbl), moved out of draw.html line for line (28 Oct 2026, Tom: "all the
// labs can ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, asmFit, flashStatus, labLadder. It declares nothing the editor reads. Loaded the first
// time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['figure-the-ratio-never-carried'] = function () {
        // ── the figure the ratio never carried ──────────────────────────────
        // A reading is a RATIO of the arrangement's two extents. Met at turn a with reach r, those
        // extents are r·cos a and r·sin a — so the ratio is tan a AND THE REACH CANCELS. The ratio
        // stream is a fact about the sweep, not about the figure: every figure met evenly sends the
        // circle's own distribution, and the shape is in the reach, which nobody was issued.
        function fbStat(x) {
            const v = x.filter(Number.isFinite).slice().sort((a, b) => a - b);
            const q = p => v[Math.min(v.length - 1, Math.floor(p * v.length))];
            return (q(0.90) - q(0.10)) / (q(0.75) - q(0.25));
        }

        function fbFigures(N) {
            const A = k => 2 * Math.PI * k / N + Math.PI / (2 * N);
            const mk = (name, f) => {
                const r = [],
                    ratio = [];
                for (let k = 0; k < N; k++) {
                    const a = A(k),
                        rr = f(a);
                    r.push(rr);
                    ratio.push((rr * Math.sin(a)) / (rr * Math.cos(a)));
                }
                return {
                    name,
                    r,
                    ratio
                };
            };
            return [
            mk('the unit circle', () => 1),
            mk('an egg', a => 1 + 0.18 * Math.cos(a)),
            mk('a clover', a => 1 + 0.35 * Math.cos(5 * a)),
            mk('a violent clover', a => Math.exp(1.2 * Math.cos(5 * a))),
            mk('a hinged figure', a => Math.abs(Math.sin(3 * a)) + 0.2),
            mk('one that nearly touches the reader', a => 0.02 + Math.abs(Math.cos(2 * a))),
            ];
        }

        function runFigureBlind() {
            const N = 60000,
                CAUCHY = 3.077684;
            const rows = [];
            for (const f of fbFigures(N)) {
                const s = fbStat(f.ratio);
                let lo = Infinity,
                    hi = 0;
                for (const v of f.r) {
                    lo = Math.min(lo, v);
                    hi = Math.max(hi, v);
                }
                // draw the figure itself, at a readable number of points
                const pts = [];
                for (let k = 0; k < 720; k++) {
                    const a = 2 * Math.PI * k / 720,
                        rr = f.r[Math.floor(k * N / 720)];
                    pts.push({
                        x: Math.cos(a) * rr,
                        y: Math.sin(a) * rr
                    });
                }
                rows.push({
                    kind: f.name,
                    pts: asmFit(pts),
                    stat: s,
                    lo,
                    hi,
                    off: Math.abs(s - CAUCHY) / CAUCHY,
                    note: 'its reach runs ' + lo.toFixed(2) + ' to ' + hi.toFixed(2)
                });
            }
            return rows;
        }

        function showFigureBlind(rows) {
            const out = labLadder({
                rows,
                name: 'the figure the ratio never carried',
                suffix: 'every figure met evenly sends the circle\u2019s own stream',
                verdict: r => r.off < 0.01 ? 2 : 0,
                caption: r => r.kind + '\n' + r.note
                + '\n its ratio readings: ' + r.stat.toFixed(4)
                + '\n the circle\u2019s own: 3.0776 \u2014 off by ' + (100 * r.off).toFixed(2) + '%',
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const worst = Math.max(...drawn.map(r => r.off));
            flashStatus('the figure the ratio never carried \u00b7 a reading is a RATIO of the'
            + ' arrangement\u2019s two extents, and an arrangement met at turn a with reach r has'
            + ' extents r\u00b7cos a and r\u00b7sin a \u2014 SO THE RATIO IS tan a AND THE REACH CANCELS'
            + ' \u00b7 these six figures could hardly differ more, one of them swinging elevenfold and'
            + ' one almost touching the reader, and every one of them sends ratio readings with the'
            + ' circle\u2019s own shape statistic, agreeing to ' + (100 * worst).toFixed(2) + '% \u00b7'
            + ' SO THE RATIO STREAM IS A FACT ABOUT THE SWEEP AND NOT ABOUT THE FIGURE \u00b7 that is'
            + ' why a heart comes back as a unit circle: not because the recovery is poor, but because'
            + ' THE RATIO COORDINATE NEVER CARRIED THE SHAPE \u00b7 the shape is in the reach, and the'
            + ' reach is the coordinate the reader was never issued \u2014 nobody can say one radius,'
            + ' anybody can say one turn \u00b7 everything built on the ratio stream, the corner and the'
            + ' servo and this very statistic, is FIGURE-BLIND BY CONSTRUCTION and cannot be otherwise'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bFB = $('bFigureBlind');
            if (bFB)
                bFB.addEventListener('click', () => {
                    bFB.disabled = true;
                    bFB.textContent = 'sweeping\u2026';
                    setTimeout(() => {
                        try {
                            const r = runFigureBlind();
                            if (!r.length)
                                flashStatus('nothing to run');
                            else
                                showFigureBlind(r);
                        }
                        catch (e) {
                            flashStatus('run failed: ' + e.message);
                        }
                        finally {
                            bFB.disabled = false;
                            bFB.textContent = 'sweep them';
                        }
                    }, 0);
                });
        }
};
