// THE STRAIGHT EDGE (?lab=ste), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately
// be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, cfCross, cfSnap, flashStatus, labLadder, makeRng. It declares nothing the editor
// reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['straight-edge'] = function () {
        const SE_THRESH = 0.002; // caught above 0.2% — 3x the worst linear-fractional row

        function runStraightEdge() {
            const SIG = Math.log(100) / 128,
                M = 240,
                LO = 0.01,
                HI = 2.0,
                R0 = 10;
            const rnd = makeRng(20260827);
            const rows = [];
            for (const F of SE_FRONTS) {
                const deps = [];
                let rr = 20260827;
                const rn2 = () => {
                    rr = (rr * 1103515245 + 12345) & 0x7fffffff;
                    return rr / 0x7fffffff;
                };
                for (let i = 0; i < M; i++) {
                    const s = LO * Math.pow(HI / LO, i / (M - 1));
                    const r = R0 * Math.exp((rn2() - 0.5) * SIG * 7);
                    const K = (1 + r) * (1 + r) / (1 + r + r * r);
                    const q = [s, s * r, s * r * r, s * r * r * r].map(F.f);
                    let ok = true;
                    for (const y of q)
                        if (!(y > 0) || !isFinite(y))
                            ok = false;
                    if (!ok) {
                        deps.push(NaN);
                        continue;
                    }
                    const v = cfCross(...q.map(y => cfSnap(y, SIG)));
                    deps.push(isFinite(v) ? (v - K) / K : NaN);
                }
                const fin = deps.filter(isFinite);
                if (!fin.length)
                    continue;
                const srt = fin.slice().sort((a, b) => a - b);
                const score = srt[Math.floor(srt.length / 2)];
                rows.push({
                    name: F.name,
                    lf: F.lf,
                    deps,
                    score,
                    caught: Math.abs(score) > SE_THRESH
                });
            }
            return rows;
        }

        function showStraightEdge(rows) {
            const out = labLadder({
                rows,
                name: 'the straight edge',
                suffix: 'a constructed ruler, laid across instruments nobody measured',
                verdict: r => r.caught ? 0 : 2,
                caption: r => r.name + '\n'
                + (r.lf ? 'linear-fractional' : 'NOT linear-fractional') + '\n'
                + 'signed median ' + (100 * r.score).toFixed(2) + '%\n'
                + (r.caught ? 'CAUGHT' : 'certified straight to the threshold'),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const caught = drawn.filter(r => r.caught).length;
            const passed = drawn.length - caught;
            flashStatus('the straight edge \u00b7 the reference is a construction, not a unit: an'
            + ' arrangement stepped by the same ratio three times carries a cross ratio known BY'
            + ' CONSTRUCTION, at any scale and any position \u00b7 each instrument reads that ruler'
            + ' across its working range, and the MEDIAN OF THE SIGNED departures cancels the grain'
            + ' and keeps the bend \u00b7 ' + passed + ' certified straight, ' + caught + ' caught,'
            + ' threshold ' + (100 * SE_THRESH).toFixed(1) + '% \u00b7 STRAIGHT MEANS'
            + ' LINEAR-FRACTIONAL, NOT UNCHANGED \u2014 the bridge deforms every reading and'
            + ' certifies straight \u00b7 a bend is caught from an exponent of 1.02 and the score'
            + ' grades with it \u00b7 and the certificate speaks only for the range that was probed'
            + ' \u00b7 each cell draws its own signed departure profile, scaled to its largest \u2014'
            + ' fuzz is the grain, a coherent displacement is a bend'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bSE = $('bStraightEdge');
            if (bSE)
                bSE.addEventListener('click', () => {
                    bSE.disabled = true;
                    bSE.textContent = 'certifying\u2026';
                    setTimeout(() => {
                        try {
                            const rows = runStraightEdge();
                            if (!rows.length) {
                                flashStatus('the straight edge: nothing to certify');
                            }
                            else {
                                for (const r of rows) {
                                    const fin = r.deps.map(d => isFinite(d) ? d : 0);
                                    let big = 0;
                                    for (const d of fin)
                                        big = Math.max(big, Math.abs(d));
                                    const pts = [];
                                    for (let i = 0; i < fin.length; i++) {
                                        const a = 2 * Math.PI * i / fin.length;
                                        const rad = 1 + 0.45 * (big > 0 ? fin[i] / big : 0);
                                        pts.push({
                                            x: Math.cos(a) * rad,
                                            y: Math.sin(a) * rad
                                        });
                                    }
                                    r.pts = pts;
                                }
                                showStraightEdge(rows);
                            }
                        }
                        catch (e) {
                            flashStatus('straight edge failed: ' + e.message);
                        }
                        finally {
                            bSE.disabled = false;
                            bSE.textContent = 'certify it';
                        }
                    }, 0);
                });
        }
};
