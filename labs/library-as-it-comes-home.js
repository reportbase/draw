// THE LIBRARY, AS IT COMES HOME (?lab=lib), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs
// can ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, asmFit, asmResample, flashStatus, labLadder, makeRng. It declares nothing the editor
// reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['library-as-it-comes-home'] = function () {
        // ── the library, as it comes home ───────────────────────────────────
        // Every figure in the library, sent and gathered back. The reader forms a RATIO of the
        // arrangement's two extents; the reach cancels; the census then squares the two extents to
        // one. What returns is the same circle from every figure — not because the recovery is poor
        // but because the ratio coordinate never carried the shape.
        function lhProfile(P, N) {
            const c = {
                x: 0,
                y: 0
            };
            for (const q of P) {
                c.x += q.x;
                c.y += q.y;
            }
            c.x /= P.length;
            c.y /= P.length;
            const th = [],
                rr = [];
            for (const q of P) {
                th.push(Math.atan2(q.y - c.y, q.x - c.x));
                rr.push(Math.hypot(q.x - c.x, q.y - c.y));
            }
            const ord = th.map((v, i) => i).sort((a, b) => th[a] - th[b]);
            const T = ord.map(i => th[i]),
                R = ord.map(i => rr[i]);
            const out = [];
            for (let k = 0; k < N; k++) {
                const a = -Math.PI + 2 * Math.PI * k / N;
                let j = 0;
                while (j < T.length - 1 && T[j + 1] < a)
                    j++;
                const t0 = T[j],
                    t1 = T[(j + 1) % T.length];
                let f = (t1 - t0) !== 0 ? (a - t0) / (t1 - t0) : 0;
                f = Math.max(0, Math.min(1, f));
                out.push({
                    a,
                    r: R[j] + (R[(j + 1) % R.length] - R[j]) * f
                });
            }
            return out;
        }

        function lhHome(prof) {
            // what the reader has: the ratio of the two extents at each turn — the reach cancels.
            // the census then squares them to one, and that is what comes home.
            return prof.map(({a, r}) => {
                const V = r * Math.sin(a),
                    H = r * Math.cos(a);
                const ratio = V / H;
                const h = 1 / Math.sqrt(1 + ratio * ratio) * Math.sign(H || 1);
                return {
                    x: h,
                    y: ratio * h
                };
            });
        }

        function lhMarkCorners(loop) {
            // the four places on the recovered figure where the two extents stand level: the corner
            // where the reading is +1, twice, and the anti-corner where it is −1, twice. Marked with
            // a spike outward, inserted in path order so the single closed loop can carry them.
            const out = [];
            for (let i = 0; i < loop.length; i++) {
                const p = loop[i];
                out.push(p);
                const d = Math.abs(Math.abs(p.x) - Math.abs(p.y)); // level when |H| = |V|
                const q = loop[(i + 1) % loop.length];
                const dn = Math.abs(Math.abs(q.x) - Math.abs(q.y));
                if (d < dn && d < 0.02) {
                    // the nearest sample to level
                    const s = (p.x * p.y >= 0) ? 1.30 : 1.18; // corner longer, anti-corner shorter
                    out.push({
                        x: p.x * s,
                        y: p.y * s
                    }, {
                        x: p.x,
                        y: p.y
                    });
                }
            }
            return out;
        }

        function lhHistogram(ratios, BINS, LIM) {
            // the readings counted into bins and drawn as BARS — each one up from the baseline,
            // across, and back down, with the baseline run between them.
            // ⚠ already in a unit box: it must NOT be passed through asmFit, which recentres and
            // rescales by distance from the centroid and would turn a histogram into a blob.
            const c = new Array(BINS).fill(0);
            let inside = 0;
            for (const v of ratios) {
                if (!isFinite(v))
                    continue;
                if (Math.abs(v) > LIM)
                    continue;
                const b = Math.min(BINS - 1, Math.max(0, Math.floor((v + LIM) / (2 * LIM) * BINS)));
                c[b]++;
                inside++;
            }
            const top = Math.max(...c, 1);
            // where the corner falls among the bins: the reading +1, and the anti-corner at −1
            const binOf = v => Math.min(BINS - 1, Math.max(0, Math.floor((v + LIM) / (2 * LIM) * BINS)));
            const cb = binOf(1),
                ab = binOf(-1);
            // ⚠ HEIGHTS BY SQUARE ROOT, and the caption says so. On a linear scale a Cauchy's tail
            // at twenty is four hundred times under its peak and simply does not draw; the tail is
            // the whole point of the shape and it has to be visible to be looked at.
            const BASE = -0.62,
                TOPY = 0.62,
                w = 2 / BINS;
            const pts = [{
                x: -1,
                y: BASE
            }];
            for (let b = 0; b < BINS; b++) {
                const x0 = -1 + b * w,
                    x1 = x0 + w * 0.72,
                    xg = -1 + (b + 1) * w;
                const h = BASE + (TOPY - BASE) * Math.sqrt(c[b] / top);
                pts.push({
                    x: x0,
                    y: BASE
                }, {
                    x: x0,
                    y: h
                }, {
                    x: x1,
                    y: h
                },
                {
                    x: x1,
                    y: BASE
                }, {
                    x: xg,
                    y: BASE
                });
                // a tick DOWN from the baseline under the corner and the anti-corner. Below the
                // baseline on purpose: a mark that changed a bar's height would be falsifying the
                // count to point at it.
                if (b === cb || b === ab) {
                    const xm = x0 + (x1 - x0) / 2,
                        dep = (b === cb) ? 0.22 : 0.13;
                    pts.push({
                        x: xm,
                        y: BASE
                    }, {
                        x: xm,
                        y: BASE - dep
                    }, {
                        x: xm,
                        y: BASE
                    },
                    {
                        x: xg,
                        y: BASE
                    });
                }
            }
            return {
                pts,
                share: inside / ratios.length,
                top,
                corner: (-1 + (cb + 0.5) * (2 / BINS)),
                anti: (-1 + (ab + 0.5) * (2 / BINS))
            };
        }

        function lhSampleTurns(N, seed) {
            // ⚠ EVERY FIGURE MUST BE MET AT ITS OWN TURNS. Sampling them all at the same turns makes
            // the readings identical arrays rather than identical distributions, and a demonstration
            // that cannot fail is not a demonstration.
            const rnd = makeRng(seed >>> 0);
            const out = [];
            for (let i = 0; i < N; i++)
                out.push(-Math.PI + 2 * Math.PI * rnd());
            return out;
        }

        function runLibraryHome() {
            const N = 60000,
                BINS = 91,
                LIM = 30;
            const KEYS = ['circle', 'clover', 'wedge', 'spoon', 'graze200', 'hinge5'];
            const rows = [];
            let which = 0;
            for (const k of KEYS) {
                const spec = PRIMITIVES.find(q => q.key === k);
                if (!spec || typeof spec.pts !== 'function')
                    continue;
                const dense = lhProfile(asmResample(spec.pts(), 720), 4096);
                const turns = lhSampleTurns(N, 8191 + 7919 * (which++));
                const prof = turns.map(a => {
                    const j = Math.min(4095, Math.max(0, Math.floor((a + Math.PI) / (2 * Math.PI) * 4096)));
                    return {
                        a,
                        r: dense[j].r
                    };
                });
                let lo = Infinity,
                    hi = 0;
                for (const p of prof) {
                    lo = Math.min(lo, p.r);
                    hi = Math.max(hi, p.r);
                }
                const sent = dense.filter((_, i) => i % 8 === 0)
                .map(({a, r}) => ({
                    x: Math.cos(a) * r,
                    y: Math.sin(a) * r
                }));
                const ratios = prof.map(({a, r}) => (r * Math.sin(a)) / (r * Math.cos(a)));
                const hist = lhHistogram(ratios, BINS, LIM);
                // ⚠ MEASURE FIRST, THEN ANNOTATE. Marking the corners adds spikes at radius 1.30, and
                // reading the reach off the marked loop reported the recovery as "1.0000 to 1.3000" —
                // the annotation had corrupted the number it was annotating.
                const homeRaw = lhHome(dense).filter((_, i) => i % 8 === 0);
                let hlo = Infinity,
                    hhi = 0;
                for (const p of homeRaw) {
                    const d = Math.hypot(p.x, p.y);
                    hlo = Math.min(hlo, d);
                    hhi = Math.max(hhi, d);
                }
                const home = lhMarkCorners(homeRaw);
                // the shape statistic of the readings, which the circle's own is 3.0777
                const srt = ratios.filter(Number.isFinite).slice().sort((a, b) => a - b);
                const qq = f => srt[Math.min(srt.length - 1, Math.floor(f * srt.length))];
                const stat = (qq(0.90) - qq(0.10)) / (qq(0.75) - qq(0.25));
                rows.push({
                    kind: k + ', as sent',
                    pts: asmFit(sent),
                    sent: true,
                    note: 'its reach runs ' + lo.toFixed(2) + ' to ' + hi.toFixed(2)
                });
                rows.push({
                    kind: 'its readings',
                    pts: hist.pts,
                    hist: true,
                    stat,
                    note: 'bars to \u00b1' + LIM + ', heights by square root so the tails\n show'
                    + ' \u00b7 ' + (100 * hist.share).toFixed(1) + '% fall inside, and the rest'
                    + ' run out\n past the edge of the cell\n the two ticks below the baseline'
                    + ' are the corner\n (+1, the longer) and the anti-corner (\u22121)'
                    + '\n shape statistic ' + stat.toFixed(4)
                    + ' (the circle\u2019s: 3.0777)'
                });
                rows.push({
                    kind: 'as it comes home',
                    pts: asmFit(home),
                    home: true,
                    hlo,
                    hhi,
                    note: 'reach ' + hlo.toFixed(4) + ' to ' + hhi.toFixed(4)
                    + '\n the four spikes are where the two extents\n stand level: the'
                    + ' corner twice, the\n anti-corner twice'
                });
            }
            return rows;
        }

        function showLibraryHome(rows) {
            const out = labLadder({
                // ⚠ every cell goes through subpathFromLoop -> arcLengthResample, which spends its
                // points by ARC LENGTH: on a bar comb that puts nearly all of them on the long
                // baseline runs and almost none on the short vertical strokes, and the bars come out
                // soft. A high leaf count is not the right fix — real rectangles are — but it is the
                // fix available without changing how the tool draws.
                N: 2048,
                rows,
                name: 'the library, as it comes home',
                suffix: 'every figure sent at a reach of its own, every one home at reach one',
                verdict: r => r.home ? (Math.abs(r.hhi - 1) < 1e-6 && Math.abs(r.hlo - 1) < 1e-6 ? 2 : 0)
                : r.hist ? (Math.abs(r.stat - 3.0777) / 3.0777 < 0.01 ? 2 : 0) : 1,
                caption: r => r.kind + '\n' + r.note,
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const homes = drawn.filter(r => r.home);
            const worst = Math.max(...homes.map(r => Math.max(Math.abs(r.hhi - 1), Math.abs(r.hlo - 1))));
            flashStatus('the library, as it comes home \u00b7 read the pairs: on the left what was sent,'
            + ' on the right what a reader gathers back \u00b7 the reaches sent run from 0.00 to 1.16'
            + ' and every recovery comes home at reach one, to '
            + worst.toExponential(0) + ' \u00b7 THE READER FORMS A RATIO OF THE TWO EXTENTS AND THE'
            + ' REACH CANCELS, so the shape is gone before the census ever sees it \u2014 what the'
            + ' census then returns is not a poor reconstruction, it is THE ONLY FIGURE THE READINGS'
            + ' STILL PERMIT \u00b7 the unit circle is what the census costs nothing to say, and it says'
            + ' it about a clover, a wedge, a spoon and a figure that grazes the reader alike \u00b7 the'
            + ' shape was in the REACH, and the reach is the coordinate nobody is issued \u00b7 the'
            + ' middle cell of each triple is what the reader actually holds \u2014 the readings'
            + ' counted into bins \u2014 and it is the same heap every time, with the same shape'
            + ' statistic as the circle\u2019s to a few decimals, which is where the recovery on the'
            + ' right comes from and why it could not have come out otherwise \u00b7 each figure is'
            + ' met at ITS OWN turns, not at a shared set, so the heaps differ by sampling and by'
            + ' nothing else \u2014 which is the honest form of the claim: not that the numbers match'
            + ' but that they differ only as two draws of one distribution differ'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bLH = $('bLibraryHome');
            if (bLH)
                bLH.addEventListener('click', () => {
                    bLH.disabled = true;
                    bLH.textContent = 'gathering\u2026';
                    setTimeout(() => {
                        try {
                            const r = runLibraryHome();
                            if (!r.length)
                                flashStatus('nothing to run');
                            else
                                showLibraryHome(r);
                        }
                        catch (e) {
                            flashStatus('run failed: ' + e.message);
                        }
                        finally {
                            bLH.disabled = false;
                            bLH.textContent = 'send them all';
                        }
                    }, 0);
                });
        }
};
