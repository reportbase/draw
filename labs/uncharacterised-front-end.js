// THE UNCHARACTERISED FRONT END (?lab=frn), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs
// can ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, cfCross, cfSnap, flashStatus, hingeProfile, labLadder, makeRng. It declares nothing
// the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['uncharacterised-front-end'] = function () {
        function cfLoop(prof) {
            const n = prof.length,
                out = [];
            let big = 0;
            for (let i = 0; i < n; i++)
                big = Math.max(big, Math.abs(prof[i]));
            for (let i = 0; i < n; i++) {
                const a = 2 * Math.PI * i / n,
                    r = prof[i] / (big || 1);
                out.push({
                    x: Math.cos(a) * r,
                    y: Math.sin(a) * r
                });
            }
            return out;
        }

        function runFrontEnd() {
            const N = 720,
                SIG = Math.log(100) / 128,
                SEP = 4,
                rows = [];
            const rnd = makeRng(20260826);
            for (const key of ['graze200', 'wedge', 'egg']) {
                const spec = PRIMITIVES.find(q => q.key === key);
                if (!spec || typeof spec.pts !== 'function')
                    continue;
                const prof = hingeProfile(spec.pts(), N);
                if (!prof)
                    continue;
                for (const F of CF_FRONTS) {
                    if (key !== 'graze200' && F.name !== 'as held' && F.name !== 'bridge' && F.name !== 'gamma 1.7')
                        continue;
                    const y = new Float64Array(N);
                    let ok = true;
                    for (let i = 0; i < N; i++) {
                        y[i] = F.f(prof[i]);
                        if (!(y[i] > 0) || !isFinite(y[i]))
                            ok = false;
                    }
                    if (!ok)
                        continue;
                    const devs = [];
                    let tried = 0;
                    for (let t = 0; t < 40000; t++) {
                        const idx = [0, 0, 0, 0].map(() => Math.floor(rnd() * N));
                        if (new Set(idx).size < 4)
                            continue;
                        const rg = idx.map(i => Math.log(y[i]) / SIG);
                        let sep = Infinity;
                        for (let p = 0; p < 4; p++)
                            for (let q = p + 1; q < 4; q++)
                                sep = Math.min(sep, Math.abs(rg[p] - rg[q]));
                        if (sep < SEP)
                            continue;
                        tried++;
                        const A = cfCross(...idx.map(i => prof[i]));
                        const B = cfCross(...idx.map(i => cfSnap(y[i], SIG)));
                        if (!isFinite(A) || !isFinite(B) || Math.abs(A) < 1e-9)
                            continue;
                        devs.push(Math.abs(B - A) / Math.abs(A));
                    }
                    devs.sort((a, b) => a - b);
                    rows.push({
                        key,
                        front: F.name,
                        lf: F.lf,
                        usable: tried,
                        dev: devs.length ? devs[Math.floor(devs.length / 2)] : NaN,
                        pts: cfLoop(y),
                    });
                }
            }
            return rows;
        }

        // JUDGED AGAINST THE FIGURE'S OWN FLOOR (28 Oct 2026). The verdict was a fixed 15% band,
        // and a power law of 1.7, which is not linear-fractional, passed it on both figures
        // (14.8%, 6.8%). The departure that quantisation alone gives is the figure's own, the
        // instrument as held: a front is held under 1.5 times that floor, broken over 3 times it,
        // and between the two this statistic cannot tell a Möbius front from a mild power law
        // (graze200's pinhole reads 2.1 floors, wedge's power law 2.2), so it says so. The two
        // ratios were set after seeing these numbers; papers/labs.md, §38, records both runs.
        const CF_HELD = 1.5,
            CF_BROKE = 3;
        function cfFloors(rows) {
            const floor = {};
            for (const r of rows)
                if (r.front === 'as held' && r.usable)
                    floor[r.key] = r.dev;
            return floor;
        }
        const cfJudge = (r, floor) => !r.usable || !(floor[r.key] > 0) ? 1
        : r.dev < CF_HELD * floor[r.key] ? 2 : r.dev > CF_BROKE * floor[r.key] ? 0 : 1;
        function showFrontEnd(rows) {
            const floor = cfFloors(rows);
            const out = labLadder({
                rows,
                name: 'the uncharacterised front end',
                suffix: 'one quantity, read through instruments nobody measured',
                verdict: r => cfJudge(r, floor),
                caption: r => r.key + ' \u00b7 ' + r.front + '\n'
                + (r.lf ? 'linear-fractional' : 'NOT linear-fractional') + '\n'
                + (!r.usable ? 'no four readings far enough apart:\n the reader refuses'
                : 'departs ' + (100 * r.dev).toFixed(1) + '% \u00b7 '
                + (floor[r.key] > 0 ? (r.dev / floor[r.key]).toFixed(1) + ' floors \u00b7 ' : '')
                + r.usable + ' usable quadruples'),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const refused = drawn.filter(r => !r.usable).length;
            const judged = drawn.filter(r => r.usable && r.front !== 'as held');
            const held = judged.filter(r => cfJudge(r, floor) === 2).length;
            const broke = judged.filter(r => cfJudge(r, floor) === 0).length;
            const unsure = judged.filter(r => cfJudge(r, floor) === 1).length;
            flashStatus('the uncharacterised front end \u00b7 one figure is read through instruments'
            + ' nobody calibrated \u2014 an unknown gain, a ratiometric bridge, a pinhole\u2019s view,'
            + ' an amplifier out of headroom \u2014 and the same four-reading quantity is formed from'
            + ' each, judged against what the instrument as held departs by \u00b7 ' + held + ' came through'
            + ' within 1.5 floors, ' + broke + ' broke past 3, ' + unsure + ' fell between, where this'
            + ' quantity cannot tell a linear-fractional front from a mild power law, and '
            + refused + ' were REFUSED by the reader itself. THE QUANTITY SURVIVES ANY'
            + ' LINEAR-FRACTIONAL FRONT END, which is what a bridge, a feedback amplifier and a'
            + ' pinhole all are, and it does not survive one that saturates. AND IT NEEDS THE FOUR'
            + ' READINGS FAR APART IN THE REGISTER: four readings within a rung of each other'
            + ' cannot carry it through any front end \u2014 which the reader tells from its own'
            + ' symbols, so where it cannot answer it declines rather than guesses. Nothing here'
            + ' was calibrated, no reference was supplied, and no unit was issued'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bFE = $('bFrontEnd');
            if (bFE)
                bFE.addEventListener('click', () => {
                    bFE.disabled = true;
                    bFE.textContent = 'reading\u2026';
                    setTimeout(() => {
                        try {
                            const r = runFrontEnd();
                            if (!r.length)
                                flashStatus('the uncharacterised front end: no usable primitives');
                            else
                                showFrontEnd(r);
                        }
                        catch (e) {
                            flashStatus('front end run failed: ' + e.message);
                        }
                        finally {
                            bFE.disabled = false;
                            bFE.textContent = 'read it';
                        }
                    }, 0);
                });
        }
};
