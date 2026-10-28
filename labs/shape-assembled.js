// THE SHAPE, ASSEMBLED (?lab=asm), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, asmApply, asmFit, asmInv3, asmMul, asmNull, asmResample, asmSeam, flashStatus,
// labLadder, makeRngCentered. It declares nothing the editor reads. Loaded the first time one of its buttons is
// pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['shape-assembled'] = function () {
        function asmBracket(P, a, b, c) {
            return (P[b].x - P[a].x) * (P[c].y - P[a].y) - (P[b].y - P[a].y) * (P[c].x - P[a].x);
        }

        function asmInvariant(P, i) {
            const [a, b, c, d, e] = i;
            return asmBracket(P, a, b, c) * asmBracket(P, a, d, e) / (asmBracket(P, a, b, d) * asmBracket(P, a, c, e));
        }

        function runAssembled() {
            const KEY = 'clover',
                NP = 4,
                M = 400;
            const spec = PRIMITIVES.find(q => q.key === KEY);
            if (!spec || typeof spec.pts !== 'function')
                return [];
            const FIG = asmResample(spec.pts(), M);
            const rnd = makeRngCentered(20260826);
            const mat = (r, c) => Array.from({
                length: r
            }, () => Array.from({
                length: c
            }, () => rnd() * 2));
            const R = Array.from({
                length: NP
            }, () => mat(2, 3)); // NP readers, in a ring
            const step = Math.floor(M / NP),
                parts = [],
                maps = [];
            for (let p = 0; p < NP; p++) {
                const seg = FIG.slice(p * step, (p + 1) * step);
                const H = mat(3, 3);
                parts.push(asmApply(asmInv3(H), seg)); // this triple's own account
                maps.push([0, 1, 2].map(q => asmMul(R[(p + q) % NP], H)));
            }
            let cur = maps[0],
                joined = [parts[0]];
            for (let p = 1; p < NP; p++) {
                const H = asmSeam([maps[p][0], maps[p][1]], [cur[1], cur[2]]);
                joined.push(asmApply(H, parts[p]));
                const Hi = asmInv3(H);
                cur = maps[p].map(m => asmMul(m, Hi));
            }
            const all = [].concat(...joined);
            // a quantity every account agrees on, on five well-spread arrangements
            const ids = [0, Math.floor(M * 0.19), Math.floor(M * 0.37), Math.floor(M * 0.61), Math.floor(M * 0.83)];
            const tv = asmInvariant(FIG, ids),
                gv = asmInvariant(all, ids);
            const rel = Math.abs(gv - tv) / Math.max(Math.abs(tv), 1e-12);
            // bring the assembly into the figure's own account, using four arrangements and no more:
            // a projectivity of a plane is fixed by four, so this spends nothing that was in doubt
            const q = [0, Math.floor(M * 0.27), Math.floor(M * 0.51), Math.floor(M * 0.76)],
                A = [];
            for (const i of q) {
                const x = all[i],
                    y = FIG[i];
                A.push([x.x, x.y, 1, 0, 0, 0, -y.x * x.x, -y.x * x.y, -y.x]);
                A.push([0, 0, 0, x.x, x.y, 1, -y.y * x.x, -y.y * x.y, -y.y]);
            }
            const hv = asmNull(A, 9);
            const Hw = [[hv[0], hv[1], hv[2]], [hv[3], hv[4], hv[5]], [hv[6], hv[7], hv[8]]];
            const inAccount = asmApply(Hw, all);
            let worst = 0,
                big = 0;
            for (const f of FIG)
                big = Math.max(big, Math.hypot(f.x, f.y));
            for (let i = 0; i < M; i++)
                worst = Math.max(worst, Math.hypot(inAccount[i].x - FIG[i].x, inAccount[i].y - FIG[i].y));
            const fit = worst / (big || 1);

            const rows = [{
                key: KEY,
                kind: 'the figure, as held',
                pts: asmFit(FIG),
                note: 'what is cut up. No reader ever sees this'
            }];
            for (let p = 0; p < NP; p++)
                rows.push({
                    key: KEY,
                    kind: 'stretch ' + (p + 1) + ', in its own account',
                    pts: asmFit(parts[p]),
                    note: 'readers ' + ((p % NP) + 1) + ', ' + (((p + 1) % NP) + 1) + ', ' + (((p + 2) % NP) + 1)
                    + '\n a quarter of the figure, warped by\n an account nobody else uses'
                });
            rows.push({
                key: KEY,
                kind: 'the parts, joined',
                pts: asmFit(all),
                rel,
                note: 'seamed on two shared readers, with no\n shared arrangement anywhere. THIS IS THE\n SAME ARRANGEMENT AS THE FIRST CELL,\n and it does not look like it'
            });
            rows.push({
                key: KEY,
                kind: 'the same, put in the figure\u2019s account',
                pts: asmFit(inAccount),
                fit,
                note: 'four arrangements spent to choose the\n drawing \u2014 nothing that was in doubt.\n Now compare it with the first cell'
            });
            return rows;
        }

        function showAssembled(rows) {
            const out = labLadder({
                rows,
                name: 'the shape, assembled',
                suffix: 'stretches nobody saw together, joined on readers alone',
                verdict: r => (r.rel !== undefined) ? (r.rel < 1e-6 ? 2 : 0)
                : (r.fit !== undefined) ? (r.fit < 1e-6 ? 2 : 0) : 1,
                caption: r => r.kind + '\n'
                + (r.rel !== undefined ? 'a quantity every account agrees on\n departs ' + r.rel.toExponential(1) + '\n' + r.note
                : r.fit !== undefined ? 'every point lands on the figure to\n ' + r.fit.toExponential(1) + ' of its size\n' + r.note
                : r.note),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const asm = drawn.find(r => r.rel !== undefined);
            const fin = drawn.find(r => r.fit !== undefined);
            // the test, stated as two conditions and answered before anything is explained
            const c1 = asm && asm.rel < 1e-6,
                c2 = fin && fin.fit < 1e-6;
            const verdict = (c1 && c2) ? 'TEST PASSED' : 'TEST FAILED';
            flashStatus(verdict + ' \u00b7 the two conditions were fixed before the run: the joined'
            + ' parts must agree with the figure on a quantity no account can move (needed under'
            + ' 1e-6, got ' + (asm ? asm.rel.toExponential(1) : 'nothing') + ' \u2014 '
            + (c1 ? 'met' : 'NOT MET') + '), and once four arrangements are spent to choose the'
            + ' drawing, every point must land on the figure (needed under 1e-6, got '
            + (fin ? fin.fit.toExponential(1) : 'nothing') + ' \u2014 ' + (c2 ? 'met' : 'NOT MET')
            + ') \u00b7 THE QUESTION THIS ASKS: can a figure be put back together by parties none of'
            + ' whom saw more than a quarter of it, and none of whom shared any of it with each'
            + ' other? \u00b7 the figure is cut into four stretches, each read by its own triple of'
            + ' readers and rebuilt in that triple\u2019s own account \u2014 the four middle cells,'
            + ' which is what a quarter of a clover looks like to somebody with no unit and no'
            + ' frame \u00b7 adjacent triples share TWO READERS AND NO ARRANGEMENT AT ALL \u00b7 the'
            + ' fifth cell is what the four come to when seamed on those shared readers, and it IS'
            + ' the first cell\u2019s arrangement \u2014 the quantity every account agrees on departs'
            + ' by ' + (asm ? asm.rel.toExponential(1) : '?') + ' \u2014 although it plainly does not'
            + ' look like it, because a shape recovered this way is fixed only up to a projectivity'
            + ' \u00b7 the sixth cell spends four arrangements to choose the drawing, and then every'
            + ' point lands on the figure to ' + (fin ? fin.fit.toExponential(1) : '?') + ' of its'
            + ' size \u00b7 NOBODY EVER HELD THE WHOLE, AND WHAT WAS SHARED WAS NOT A PIECE OF THE'
            + ' SHAPE BUT A PAIR OF READERS'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bAS = $('bAssembled');
            if (bAS)
                bAS.addEventListener('click', () => {
                    bAS.disabled = true;
                    bAS.textContent = 'assembling\u2026';
                    setTimeout(() => {
                        try {
                            const r = runAssembled();
                            if (!r.length)
                                flashStatus('the shape, assembled: no usable primitive');
                            else
                                showAssembled(r);
                        }
                        catch (e) {
                            flashStatus('assembly failed: ' + e.message);
                        }
                        finally {
                            bAS.disabled = false;
                            bAS.textContent = 'assemble it';
                        }
                    }, 0);
                });
        }
};
