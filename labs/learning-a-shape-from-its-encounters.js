// LEARNING A SHAPE FROM ITS ENCOUNTERS (?lab=sit), moved out of draw.html line for line (28 Oct 2026, Tom: "all the
// labs can ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, _firstMeet, _shapePrep, flashStatus, labLadder, labMed, ladderLayout, pathoShape,
// state, subpathFromLoop, tbLeaves. It declares nothing the editor reads. Loaded the first time one of its buttons
// is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['learning-a-shape-from-its-encounters'] = function () {
        // The nesting (wander/depth/nest.py, walls given their own address): octave k holds
        // [2^(k−1), 2^k); a reading on a wall is the next octave's home and its address ends.
        function nestSplit(r) {
            let k = 0;
            while (r >= Math.pow(2, k))
                k++;
            while (r < Math.pow(2, k - 1))
                k--;
            const lo = Math.pow(2, k - 1),
                hi = Math.pow(2, k);
            const f = k <= 0 ? (r - lo) / (hi - lo) : (1 / lo - 1 / r) / (1 / lo - 1 / hi);
            return [k, f <= 0.5 ? 2 * f : 1 / (2 * (1 - f))];
        }

        function nestJoin(k, rho) {
            const f = rho <= 1 ? rho / 2 : 1 - 1 / (2 * rho),
                lo = Math.pow(2, k - 1),
                hi = Math.pow(2, k);
            return k <= 0 ? lo + f * (hi - lo) : 1 / (1 / lo - f * (1 / lo - 1 / hi));
        }

        function _nearestLog(sortedVals, logs, x) {
            // nearest value by ratio, binary search
            const lx = Math.log(x);
            let lo = 0,
                hi = logs.length - 1;
            while (hi - lo > 1) {
                const m = (lo + hi) >> 1;
                if (logs[m] < lx)
                    lo = m;
                else
                    hi = m;
            }
            return (lx - logs[lo] <= logs[hi] - lx) ? sortedVals[lo] : sortedVals[hi];
        }

        // ── SIT: LEARNING A SHAPE FROM ITS ENCOUNTERS (wander/patho/SIT.md) ──────────────
        // The reader has its own h = 1, nothing about the shape. The shape sits D h's ahead.
        // For each of its directions that meets the outline, the reader learns only WHERE along
        // that direction the meeting falls, held as a count of its own h's in one of 1,024 depth
        // addresses: one sweep (1,024 leaves), or nested (16 octaves × 64 leaves, walls exact).
        // The known outline is the answer key.
        const SIT_SHAPES = [['elongated', 2], ['lobed', 3], ['ripple3', 3], ['pinched', 4], ['noisy', 3]],
            SIT_DS = [4, 8, 16, 32, 64, 128];

        function runShapeEncounters(DS) {
            DS = DS || SIT_DS;
            const LA = tbLeaves(2048),
                LAl = LA.map(Math.log),
                LB = tbLeaves(128),
                LBl = LB.map(Math.log);
            const DL = tbLeaves(8192),
                DIRS = DL.slice().reverse().map(s => -s).concat(DL);
            const qA = c => _nearestLog(LA, LAl, c);
            const qB = c => {
                const k = Math.floor(Math.log2(c));
                if (c === Math.pow(2, k))
                    return c;
                const [kk, rho] = nestSplit(c);
                if (kk < -7 || kk > 8)
                    return NaN;
                return nestJoin(kk, _nearestLog(LB, LBl, rho));
            };
            const rows = [];
            for (const [fam, lvl] of SIT_SHAPES) {
                const Q0 = _shapePrep(pathoShape(fam, lvl, 1024));
                for (const D of DS) {
                    const P = Q0.map(p => ({
                        x: p.x,
                        y: p.y + D
                    }));
                    let lo = Infinity,
                        hi = -Infinity;
                    for (const p of P) {
                        const s = p.x / p.y;
                        if (s < lo)
                            lo = s;
                        if (s > hi)
                            hi = s;
                    }
                    let eA = 0,
                        eB = 0;
                    const ptsA = [],
                        ptsB = [];
                    for (const s of DIRS) {
                        if (s < lo || s > hi)
                            continue;
                        const L = Math.hypot(s, 1),
                            dx = s / L,
                            dy = 1 / L,
                            d = _firstMeet(0, 0, dx, dy, P);
                        if (!isFinite(d))
                            continue;
                        const a = qA(d),
                            b = qB(d);
                        eA = Math.max(eA, Math.abs(a - d) / d);
                        if (isFinite(b))
                            eB = Math.max(eB, Math.abs(b - d) / d);
                        ptsA.push({
                            x: dx * a,
                            y: dy * a - D
                        });
                        ptsB.push({
                            x: dx * b,
                            y: dy * b - D
                        });
                    }
                    rows.push({
                        key: fam + lvl,
                        D,
                        pts: Q0,
                        ptsA,
                        ptsB: ptsB.filter(p => isFinite(p.x)),
                        eA,
                        eB
                    });
                }
            }
            return {
                rows
            };
        }

        window.runShapeEncounters = runShapeEncounters;

        function showShapeEncounters(res) {
            const pc = x => (100 * x).toFixed(x < 0.01 ? 2 : 1) + '%';
            const rows = res.rows;
            const out = labLadder({
                rows,
                name: 'learning a shape from its encounters',
                suffix: 'D = ' + SIT_DS.join(', ') + ' h',
                verdict: r => r.eB > 0.01 ? 0 : (r.eB < r.eA ? 2 : 1),
                caption: r => r.key + ' · ' + r.D + ' h ahead\n' + 'one sweep ' + pc(r.eA) + ' · nested ' + pc(r.eB),
                after: drawn => {
                    // The two learned outlines, laid over the answer key in the same cell: the cell's
                    // own fit, recomputed exactly as labLadder computes it.
                    const G = ladderLayout(rows.length),
                        hR = state.hRun || 1,
                        half = (G.cell * 0.56) / 2;
                    drawn.forEach((r, i) => {
                        let mnx = Infinity,
                            mny = Infinity,
                            mxx = -Infinity,
                            mxy = -Infinity;
                        for (const p of r.pts) {
                            if (p.x < mnx)
                                mnx = p.x;
                            if (p.x > mxx)
                                mxx = p.x;
                            if (p.y < mny)
                                mny = p.y;
                            if (p.y > mxy)
                                mxy = p.y;
                        }
                        const s = (2 * half) / Math.max(mxx - mnx, mxy - mny, 1e-6),
                            bx = (mnx + mxx) / 2,
                            by = (mny + mxy) / 2,
                            at = G.at(rows.indexOf(r));
                        for (const [pts, col] of [[r.ptsB, '#6fa8ff'], [r.ptsA, '#ff7ad9']]) {
                            if (pts.length < 3)
                                continue;
                            // Out along the learned front and back again, so it draws as the open line it is
                            // (a closed loop would cut a chord across the shape).
                            const line = pts.concat(pts.slice(1, -1).reverse());
                            const sp = subpathFromLoop(line.map(q => ({
                                x: (at.x + (q.x - bx) * s) * hR,
                                y: (at.y + (q.y - by) * s) * hR
                            })), Math.max(128, state.N || 128));
                            if (!sp)
                                continue;
                            sp.stroke = col;
                            sp.lineWidth = 1.1;
                            state.subpaths.push(sp);
                        }
                    });
                },
            });
            if (!out)
                return;
            const far = rows.filter(r => r.D === SIT_DS[SIT_DS.length - 1]),
                near = rows.filter(r => r.D === SIT_DS[0]);
            flashStatus('learning a shape from its encounters · ' + rows.length + ' cells'
            + ' · nested, every distance: ' + pc(labMed(rows.map(r => r.eB))) + ' median'
            + ' · one sweep at ' + SIT_DS[0] + ' h: ' + pc(labMed(near.map(r => r.eA))) + ', at ' + SIT_DS[SIT_DS.length - 1] + ' h: ' + pc(labMed(far.map(r => r.eA)))
            + ' · blue = nested reader, pink = one sweep, over the true outline' + (out.ms ? ' · ' + out.ms + ' ms' : ''));
        }

        {
            const bSit = $('bShapeEncounters');
            if (bSit)
                bSit.addEventListener('click', () => {
                    bSit.disabled = true;
                    bSit.textContent = 'learning…';
                    setTimeout(() => {
                        try {
                            showShapeEncounters(runShapeEncounters());
                        }
                        catch (e) {
                            flashStatus('learning a shape from its encounters failed: ' + e.message);
                        }
                        finally {
                            bSit.disabled = false;
                            bSit.textContent = 'learn the shapes';
                        }
                    }, 0);
                });
        }
};
