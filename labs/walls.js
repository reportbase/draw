// WALLS (?lab=wal), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be pulled
// from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, DEPTH, flashStatus, labLadder. It puts wallsLadder back on the console hook
// window.__lab once loaded. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['walls'] = function () {
        // ── WALLS (WAL) ──────────────────────────────────────────────────────────────
        // In place of HRT "base-rule tests" (the floor rule against Jayant's quantiser: an
        // approximation-era check).
        // An entered octave presents what it holds inside its own octave and nothing outside, so
        // where its detail is not zero at a wall the presented surface steps there: one side has
        // been entered, the other has not. Two things, each the same shape at every level at
        // halving amplitude, held through the back chain (top octave 3, then child 1), W = 16:
        //   ψ  detail ON every wall — +1 at home and at the mathematical horizon, −1 at the corner;
        //   χ  a STEP at every wall — +1 at home, −1 at the mathematical horizon (the thing itself
        //      jumps by 2 level units at every wall, since each child's horizon meets the next
        //      child's home).
        // At level 2, at both walls of the level-2 octave — the FAR wall (reading 2 in its parent,
        // shared with child 2) and the NEAR wall (the parent's own corner, shared with child 0) —
        // with one side entered, then both. Each cell is the presented surface across a narrow
        // stretch either side of the wall; a seam is a jump in the line. Entering the octave across
        // the wall closes it: at the parent's corner the two children are each other's flip, so
        // detail the flip leaves unchanged (ψ) cancels there and detail it negates (χ) adds.
        // Plan and predictions: wander/plans/labs-plan.md; the results it reproduces: WNZ, WN2,
        // JMP (wander/plans/wnz-plan.md, wn2-plan.md, jmp-plan.md).
        function wallsLadder() {
            const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
            const D = DEPTH,
                A = 0.1,
                a = 0.5,
                m = 2,
                U = A * a ** (m - 1),
                EPS = 1e-10,
                DEL = 0.02;
            const psi = r => (r === 0 || !isFinite(r)) ? 1 : 1 - 8 * r * r / (1 + r * r) ** 2;
            const chi = r => r === 0 ? 1 : (!isFinite(r) ? -1 : (1 - r * r) / (1 + r * r));
            const thing = f => s => {
                let tot = 1,
                    r = s;
                for (let j = 1; j <= 10; j++) {
                    if (r === 0 || !isFinite(r))
                        break;
                    r = D.split(r)[1];
                    tot += A * a ** (j - 1) * f(r);
                }
                return tot;
            };
            const chain = [[], [3], [3, 1], [3, 1, 1], [3, 1, 1, 1], [3, 1, 1, 1, 1]];
            const REC = {
                'ψ far': [0.118, 0.034],
                'ψ near': [1.320, 0.002],
                'χ far': [1.116, 0.012],
                'χ near': [0.952, 0.097]
            };
            const rows = [],
                figs = {};
            for (const [tn, f, thingStep] of [['ψ', psi, 0], ['χ', chi, 2]]) {
                const p = thing(f);
                for (const [wn, rw, sib] of [['far', Infinity, 2], ['near', 0, 0]]) {
                    const P = chain[m],
                        Q = P.slice(0, -1).concat([sib]),
                        sw = D.S(P, rw);
                    const lone = D.Surface(p, 16);
                    for (const c of chain)
                        lone.enter(c);
                    const pair = D.Surface(p, 16);
                    for (const c of chain.slice(0, m + 1))
                        pair.enter(c);
                    pair.enter(Q);
                    const res = {};
                    for (const [side, surf] of [['one side', lone], ['both sides', pair]]) {
                        const step = (surf.value(sw * (1 + EPS)) - surf.value(sw * (1 - EPS))) / U; // going up in s
                        const fig = Math.abs(step - thingStep);
                        const pts = [];
                        for (let i = 0; i <= 240; i++) {
                            const s = sw * (1 - DEL + 2 * DEL * i / 240);
                            if (Math.abs(s - sw) < sw * 1e-6)
                                continue;
                            pts.push({
                                x: (s / sw - 1) / DEL,
                                y: (surf.value(s) - surf.value(sw * (1 - EPS))) / U * 0.5
                            });
                        }
                        pts.push({
                            x: 1,
                            y: -2
                        }, {
                            x: -1,
                            y: -2
                        });
                        res[side] = {
                            fig,
                            pts
                        };
                    }
                    const rec = REC[tn + ' ' + wn];
                    const v1 = Math.abs(res['one side'].fig - rec[0]) <= 1e-3 && Math.abs(res['both sides'].fig - rec[1]) <= 1e-3;
                    const v2 = res['both sides'].fig <= 0.5 * res['one side'].fig;
                    figs[tn + ' ' + wn] = {
                        lone: res['one side'].fig,
                        pair: res['both sides'].fig,
                        v1,
                        v2
                    };
                    for (const side of ['one side', 'both sides']) {
                        const r = res[side],
                            recv = side === 'one side' ? rec[0] : rec[1];
                        rows.push({
                            key: tn + ' ' + wn + ' wall · ' + side,
                            pts: r.pts,
                            side,
                            fig: r.fig,
                            recv,
                            v1,
                            v2,
                            what: thingStep ? 'step error' : 'step'
                        });
                    }
                }
            }
            const out = labLadder({
                rows,
                name: 'walls',
                suffix: 'level 2, back chain, W=16',
                verdict: r => !r.v1 ? 0 : (r.side === 'one side' ? 1 : (r.v2 ? 2 : 0)),
                caption: r => r.key + '\n' + r.what + ' ' + r.fig.toFixed(3) + ' (recorded ' + r.recv.toFixed(3) + ')' + (r.v1 ? ' ✓' : ' ✗'),
            });
            window.__walResult = figs;
            if (!out)
                return null;
            const f = k => figs[k].lone.toFixed(3) + ' → ' + figs[k].pair.toFixed(3);
            flashStatus('walls (WAL) · level 2, one side entered → both sides, in level units · detail on the wall (ψ): far ' + f('ψ far') + ', near ' + f('ψ near')
            + ' · a step at the wall (χ, error in the step of 2): far ' + f('χ far') + ', near ' + f('χ near')
            + ' · ' + Object.values(figs).filter(x => x.v1).length + ' of 4 as recorded (WNZ, WN2, JMP)'
            + ' · entering the octave across a wall closes the seam; at the parent\'s corner flip-even detail cancels and flip-odd adds'
            + (t0 ? ' · ' + Math.round(performance.now() - t0) + ' ms' : ''));
            return rows.length;
        }

        {
            const bWL = $('bWalls');
            if (bWL)
                bWL.addEventListener('click', () => {
                    bWL.disabled = true;
                    bWL.textContent = 'reading…';
                    setTimeout(() => {
                        try {
                            if (!wallsLadder())
                                flashStatus('walls: nothing to draw');
                        }
                        catch (e) {
                            flashStatus('walls failed: ' + e.message);
                        }
                        finally {
                            bWL.disabled = false;
                            bWL.textContent = 'walls';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { wallsLadder });
};
