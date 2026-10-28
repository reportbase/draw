// THE FIGURE, BY HOW MANY READ IT (?lab=bhm), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs
// can ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, asmApply, asmFit, asmInv3, asmMul, asmNull, asmResample, asmSeam, flashStatus,
// labLadder, makeRngCentered. It declares nothing the editor reads. Loaded the first time one of its buttons is
// pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['figure-by-how-many-read-it'] = function () {
        // ── the figure, by how many read it ─────────────────────────────────
        // A chain of m readers makes m-2 triples, each taking one stretch of the figure and
        // rebuilding it in its own account; adjacent triples share two readers and no arrangement.
        // So a larger swarm does not see MORE — it sees the same figure cut into more pieces, and
        // each reader's share of it shrinks. This page walks the count from one to ninety-six.
        function bhAssemble(FIG, m, sig) {
            const M = FIG.length,
                NP = m - 2;
            if (NP < 1)
                return null;
            const step = Math.floor(M / NP);
            if (step < 7)
                return {
                    thin: true,
                    step
                }; // a triple needs seven arrangements
            const rnd = makeRngCentered(20260828);
            const mat = (r, c) => Array.from({
                length: r
            }, () => Array.from({
                length: c
            }, () => rnd() * 2));
            const R = Array.from({
                length: m
            }, () => mat(2, 3));
            const parts = [],
                maps = [];
            for (let p = 0; p < NP; p++) {
                const seg = FIG.slice(p * step, (p + 1) * step);
                const H = mat(3, 3),
                    Hi = asmInv3(H);
                const Ms = [0, 1, 2].map(q => asmMul(R[p + q], H));
                const Q = [];
                for (const pt of seg) {
                    const w = [0, 1, 2].map(r => Hi[r][0] * pt.x + Hi[r][1] * pt.y + Hi[r][2]);
                    const v = [w[0] / w[2], w[1] / w[2], 1];
                    const rd = Ms.map(mm => {
                        const x = (mm[0][0] * v[0] + mm[0][1] * v[1] + mm[0][2]) /
                        (mm[1][0] * v[0] + mm[1][1] * v[1] + mm[1][2]);
                        return Math.sign(x) * Math.exp(Math.round(Math.log(Math.abs(x)) / sig) * sig);
                    });
                    const S = [0, 1, 2].map(k => [0, 1, 2].map(c => Ms[k][0][c] - rd[k] * Ms[k][1][c]));
                    const z = asmNull(S, 3);
                    Q.push(Math.abs(z[2]) > 1e-12 ? {
                        x: z[0] / z[2],
                        y: z[1] / z[2]
                    } : {
                        x: NaN,
                        y: NaN
                    });
                }
                parts.push(Q);
                maps.push(Ms);
            }
            let cur = maps[0],
                joined = [parts[0]];
            for (let p = 1; p < NP; p++) {
                // The seam from the two shared readers' own matrices, exactly: nothing read enters
                // it, so no seam's error reaches the next (28 Oct 2026, papers/labs.md, §30).
                const H = asmSeam([maps[p][0], maps[p][1]], [cur[1], cur[2]]);
                joined.push(asmApply(H, parts[p]));
                const Hi = asmInv3(H);
                cur = maps[p].map(mm => asmMul(mm, Hi));
            }
            return {
                pts: [].concat(...joined),
                step,
                NP
            };
        }

        function bhFit4(P, T) {
            // four spread arrangements to choose the drawing, and no more
            const n = Math.min(P.length, T.length),
                q = [0, 0.27, 0.51, 0.76].map(f => Math.floor(f * n));
            const A = [];
            for (const i of q) {
                const x = P[i],
                    y = T[i];
                if (!isFinite(x.x) || !isFinite(x.y))
                    return null;
                A.push([x.x, x.y, 1, 0, 0, 0, -y.x * x.x, -y.x * x.y, -y.x]);
                A.push([0, 0, 0, x.x, x.y, 1, -y.y * x.x, -y.y * x.y, -y.y]);
            }
            const v = asmNull(A, 9);
            return [[v[0], v[1], v[2]], [v[3], v[4], v[5]], [v[6], v[7], v[8]]];
        }

        function runByHowMany() {
            const SIGMA = Math.log(100) / 128,
                M = 1200;
            const spec = PRIMITIVES.find(q => q.key === 'clover');
            if (!spec)
                return [];
            const FIG = asmResample(spec.pts(), M);
            let big = 0;
            for (const p of FIG)
                big = Math.max(big, Math.hypot(p.x, p.y));
            const rows = [];
            for (let m = 1; m <= 96; m += 5) {
                if (m < 3) {
                    rows.push({
                        kind: m + (m === 1 ? ' reader' : ' readers'),
                        pts: [],
                        none: true,
                        note: 'fewer than three: no triple, and\n nothing to assemble at all'
                    });
                    continue;
                }
                const a = bhAssemble(FIG, m, SIGMA);
                if (!a)
                    continue;
                if (a.thin) {
                    rows.push({
                        kind: m + ' readers',
                        pts: [],
                        none: true,
                        note: 'only ' + a.step + ' arrangements a stretch;\n a triple needs seven'
                    });
                    continue;
                }
                const H = bhFit4(a.pts, FIG);
                if (!H) {
                    rows.push({
                        kind: m + ' readers',
                        pts: [],
                        none: true,
                        note: 'the assembly went non-finite'
                    });
                    continue;
                }
                const W = asmApply(H, a.pts);
                const d = [];
                for (let i = 0; i < W.length; i++) {
                    const e = Math.max(Math.abs(W[i].x - FIG[i].x), Math.abs(W[i].y - FIG[i].y)) / big;
                    if (isFinite(e))
                        d.push(e);
                }
                d.sort((x, y) => x - y);
                rows.push({
                    kind: m + ' readers',
                    pts: asmFit(W),
                    stretches: a.NP,
                    each: a.step,
                    med: d.length ? d[Math.floor(d.length / 2)] : NaN,
                    note: a.NP + ' stretches, ' + a.step + ' arrangements each'
                });
            }
            return rows;
        }

        function showByHowMany(rows) {
            const out = labLadder({
                rows,
                name: 'the figure, by how many read it',
                suffix: 'a larger swarm does not see more \u2014 it sees the same figure cut smaller',
                verdict: r => r.none ? 0 : (r.med < 0.05 ? 2 : 1),
                caption: r => r.kind + '\n' + r.note
                + (r.none ? '' : '\n departs ' + (100 * r.med).toFixed(1) + '% at the median point'),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const good = drawn.filter(r => !r.none && r.med < 0.05);
            const best = good.length ? good.reduce((a, b) => a.med < b.med ? a : b) : null;
            flashStatus('the figure, by how many read it \u00b7 a chain of m readers makes m\u22122'
            + ' triples, each taking one stretch and rebuilding it in its own account, adjacent'
            + ' triples sharing two readers and no arrangement \u00b7 SO A LARGER SWARM DOES NOT SEE'
            + ' MORE, IT SEES THE SAME FIGURE CUT INTO MORE PIECES \u00b7 below three readers there is'
            + ' no triple and nothing to assemble; above that the figure comes back'
            + (best ? ', best at ' + best.kind + ' with ' + (100 * best.med).toFixed(1) + '% at the'
            + ' median point' : '')
            + ' \u00b7 and the share each reader gets falls from three hundred arrangements to twelve'
            + ' across this page WITHOUT THE ASSEMBLY MINDING: ninety-four seams, no stretch'
            + ' overlapping any other, and the figure still comes back \u00b7 BUT THE SEAMS ARE SOLVED'
            + ' FROM THE READERS THEMSELVES, EXACTLY, not estimated from what they read, so no error can'
            + ' pass from one seam to the next: that the chain does not drift is how it is built, not'
            + ' something this run found; readers whose places are estimated would drift down the'
            + ' chain \u00b7 starvation is further out than this page reaches:'
            + ' a triple needs seven arrangements to fix its own account, so on a figure of twelve'
            + ' hundred it would begin somewhere above a hundred and seventy readers \u00b7 what a'
            + ' larger swarm buys is not more sight but a thinner share each, AND THE THINNER SHARE'
            + ' COSTS NOTHING UNTIL IT RUNS OUT'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bBH = $('bByHowMany');
            if (bBH)
                bBH.addEventListener('click', () => {
                    bBH.disabled = true;
                    bBH.textContent = 'assembling\u2026';
                    setTimeout(() => {
                        try {
                            const r = runByHowMany();
                            if (!r.length)
                                flashStatus('nothing to run');
                            else
                                showByHowMany(r);
                        }
                        catch (e) {
                            flashStatus('run failed: ' + e.message);
                        }
                        finally {
                            bBH.disabled = false;
                            bBH.textContent = 'vary the swarm';
                        }
                    }, 0);
                });
        }
};
