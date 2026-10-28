// RECOVERY TESTS (?lab=rcv), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, DEPTH, flashStatus, hrtSampleRadial, labLadder, labMed. It puts runRecoveryTests,
// taWindingAt back on the console hook window.__lab once loaded. Loaded the first time one of its buttons is
// pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['recovery-tests'] = function () {
        // ── RECOVERY TESTS — how many observers does a shape cost? ───────────────────
        // Every other run here asks what ONE observer reads. This one asks how many of them
        // it takes to get the shape back, and finds that the answer is a measurement of the
        // shape — which is worth stating, because no single ray ring can make that measurement.
        // Three-Atom §3: the ray ring has NO SHAPE TERM. Square, triangle, star, 12-gon all
        // bill the same 0.544 bits per look. The geometry is not in any reading; it is in the
        // CENSUS of readings.
        //
        // THE FIELD. A ring pointed at a standpoint p reads one integer, the winding of the
        // sweep about p. As p moves the integer is locally constant — and it jumps by exactly
        // ±1 across the contour. So the curve is the DISCONTINUITY SET of an integer field
        // that every observer in it is individually blind to. Nothing here computes a distance
        // to the curve, or a crossing, or a normal; the only thing ever asked is "what does a
        // ring at p say", and the shape falls out of where the answers stop agreeing.
        //
        // THE PLACEMENT IS THE OBSERVER'S, NOT THE DESCRIBER'S. Marks are not laid on a grid.
        // Four corners are read, and a cell is subdivided ONLY when its corners disagree — the
        // disagreement is the curve, and it is a test the observer can run on its own readings
        // with no access to the geometry. That is [3] §10's acquisition problem in miniature:
        // an instrument finding what to point at rather than being wired for it, terminating on
        // a criterion it can check itself.
        //
        // WHAT THE COUNT MEASURES. The straddling cells at scale ε are a covering of the curve,
        // so N(ε) is box-counting content: N(ε)·ε → the LENGTH for a rectifiable contour, and
        // the log–log slope is the Minkowski dimension. Both are reported, and the length is
        // checked against the polyline's own — a number the observers never see.
        //
        // AND THE FLOOR IS THE INSTRUMENT'S. §2.1's near-miss radius δ* = (s/2)·tan(π/2C) is
        // how close a mark may stand and still be believed: inside it one look can carry the
        // bearing past τ* and the ring misreads a whole turn — a confident lie. Refinement is
        // stopped at the level where the cell size reaches δ*, so the finest recoverable
        // feature is set by C rather than by patience. That is the interesting half of the
        // result: the recovery has a horizon, and the instrument names it in advance.
        function taWindingAt(xs, ys, px, py, C) {
            const L = xs.length,
                TAU2 = Math.PI * 2,
                cs = TAU2 / C;
            const wrap = v => {
                while (v > Math.PI)
                    v -= TAU2;
                while (v <= -Math.PI)
                    v += TAU2;
                return v;
            };
            let d = Math.atan2(ys[0] - py, xs[0] - px),
                sum = 0,
                worst = 0;
            for (let k = 0; k < L; k++) {
                const j = (k + 1) % L;
                const b = Math.atan2(ys[j] - py, xs[j] - px);
                const t = wrap(b - d);
                const a = Math.abs(t);
                if (a > worst)
                    worst = a;
                const c = Math.round(t / cs);
                d += c * cs;
                sum += c;
            }
            return {
                w: Math.round(sum / C),
                worst
            }; // the reading, and its aliasing margin
        }

        function recoverOnce(xs, ys, C, DEPTH, SEED, dStar, TAU_STAR) {
            const L = xs.length;
            let minx = Infinity,
                maxx = -Infinity,
                miny = Infinity,
                maxy = -Infinity;
            for (let k = 0; k < L; k++) {
                if (xs[k] < minx)
                    minx = xs[k];
                if (xs[k] > maxx)
                    maxx = xs[k];
                if (ys[k] < miny)
                    miny = ys[k];
                if (ys[k] > maxy)
                    maxy = ys[k];
            }
            const cx = (minx + maxx) / 2,
                cy = (miny + maxy) / 2;
            const half = Math.max(maxx - minx, maxy - miny) * 0.62 + 1e-6;
            const x0 = cx - half,
                y0 = cy - half,
                side = half * 2;
            const seen = new Map();
            let evals = 0,
                alias = 0;
            const read = (i, j, n) => {
                const key = n + ':' + i + ':' + j;
                let v = seen.get(key);
                if (v === undefined) {
                    const r = taWindingAt(xs, ys, x0 + side * i / n, y0 + side * j / n, C);
                    evals++;
                    if (r.worst >= TAU_STAR)
                        alias++;
                    v = r.w;
                    seen.set(key, v);
                }
                return v;
            };
            const levels = [];
            let cells = [[0, 0]],
                n = 1;
            for (let d = 0; d < SEED; d++) {
                const next = [];
                for (const [i, j] of cells)
                    next.push([2 * i, 2 * j], [2 * i + 1, 2 * j], [2 * i, 2 * j + 1], [2 * i + 1, 2 * j + 1]);
                cells = next;
                n *= 2;
            }
            for (let d = SEED; d < DEPTH; d++) {
                const eps = side / n;
                const straddle = [];
                for (const [i, j] of cells) {
                    const a = read(i, j, n),
                        b = read(i + 1, j, n),
                        c = read(i, j + 1, n),
                        e = read(i + 1, j + 1, n);
                    if (!(a === b && b === c && c === e))
                        straddle.push([i, j]);
                }
                levels.push({
                    eps,
                    n: straddle.length,
                    lenL1: straddle.length * eps,
                    safe: eps > dStar
                });
                if (!straddle.length)
                    break;
                const next = [];
                for (const [i, j] of straddle)
                    next.push([2 * i, 2 * j], [2 * i + 1, 2 * j], [2 * i, 2 * j + 1], [2 * i + 1, 2 * j + 1]);
                cells = next;
                n *= 2;
            }
            const use = levels.filter(l => l.safe && l.n > 0).slice(1);
            let slope = NaN,
                lenL1 = NaN,
                finest = NaN,
                cellsFinest = 0;
            if (use.length >= 2) {
                let sx = 0,
                    sy = 0,
                    sxx = 0,
                    sxy = 0;
                for (const l of use) {
                    const X = Math.log(1 / l.eps),
                        Y = Math.log(l.n);
                    sx += X;
                    sy += Y;
                    sxx += X * X;
                    sxy += X * Y;
                }
                const m = use.length;
                slope = (m * sxy - sx * sy) / (m * sxx - sx * sx);
                // THE ℓ¹ READING IS AVERAGED OVER THE LAST TWO SAFE LEVELS, not taken from the
                // finest alone. A single level's count carries its own quantization — a cell either
                // straddles or does not — and the swing is a RATIO of two such counts, so the noise
                // enters twice. Two levels halve it, at no cost: both were already paid for.
                const tail = use.slice(-2);
                lenL1 = tail.reduce((a, l) => a + l.lenL1, 0) / tail.length;
                const last = use[use.length - 1];
                finest = last.eps;
                cellsFinest = last.n;
            }
            return {
                slope,
                lenL1,
                finest,
                cellsFinest,
                evals,
                alias
            };
        }

        function runRecoveryTests() {
            const L = 256,
                C = 64,
                DEPTH = 9,
                SEED = 3;
            const TAU_STAR = Math.PI * (1 - 1 / C);
            // ── THE LATTICE IS TURNED, BECAUSE ITS ANGLE IS GAUGE ─────────────────────
            // A census on ONE lattice does not measure length. It measures ∫|dx| + ∫|dy| — the
            // ℓ¹ length in the lattice's own frame — and the ratio ℓ¹/ℓ² is not a property of the
            // shape: for a square it runs from 1 to √2 as the lattice turns through 45°, so a
            // single-lattice reading is one sample from a gauge orbit of width √2. The first
            // version of this run reported that sample as though it named something about the
            // shape ("which shapes were aligned with the grid"), which is precisely the error
            // P4 exists to forbid — a number read off a privileged frame. Rotate the frame first.
            //
            // Cauchy–Crofton says what the rotation buys, and it is a THEOREM, not an improvement:
            // crossings averaged over a direction-uniform family of lines ARE length, for every
            // rectifiable curve. Checked here at 720 angles before it was coded: circle, triangle,
            // square, hexagon and a five-pointed star all average to 1.273239 = 4/π to six
            // decimals. So the rotation-averaged reading is unbiased for all of them, and nothing
            // shape-dependent survives it — the earlier guess that a residual spread would be
            // "the shape's own anisotropy" is wrong, and any spread left is discretization.
            // SIX ANGLES AT 15°, not four at 22.5°. The estimator is π/2-periodic, so any even
            // spread is unbiased for the MEAN — but the swing is a max/min over the sampled orbit,
            // and a coarse sample understates it. The triangle and the hexagon are the test case,
            // since they must read identically: their ℓ¹ extremes sit at 0° and 15°, which a
            // 22.5° spacing steps straight over (measured: 1.061 against 1.029, an identity that
            // should have been exact). At 15° the extremes are sampled and the pair agrees.
            const ANGLES = [0, 1, 2, 3, 4, 5].map(k => k * Math.PI / 12);
            const XING = 4 / Math.PI;
            const rows = [];
            let total = 0;
            for (const spec of PRIMITIVES) {
                total++;
                if (typeof spec.pts !== 'function')
                    continue;
                let pts;
                try {
                    pts = spec.pts();
                } catch (e) {
                    continue;
                }
                const rs = hrtSampleRadial(pts, L);
                if (!rs)
                    continue;
                const bx = new Float64Array(L),
                    by = new Float64Array(L);
                let len = 0;
                for (let k = 0; k < L; k++) {
                    const a = (k + 0.5) * 2 * Math.PI / L + 1e-4;
                    bx[k] = rs[k] * Math.cos(a);
                    by[k] = rs[k] * Math.sin(a);
                }
                for (let k = 0; k < L; k++) {
                    const j = (k + 1) % L;
                    len += Math.hypot(bx[j] - bx[k], by[j] - by[k]);
                }
                let sMed = 0;
                {
                    const d = [];
                    for (let k = 0; k < L; k++) {
                        const j = (k + 1) % L;
                        d.push(Math.hypot(bx[j] - bx[k], by[j] - by[k]));
                    }
                    d.sort((p, q) => p - q);
                    sMed = d[d.length >> 1];
                }
                const dStar = (sMed / 2) * Math.tan(Math.PI / (2 * C));

                const per = [];
                let obs = 0,
                    alias = 0;
                for (const phi of ANGLES) {
                    // Turning the lattice is turning the curve the other way: the standpoints stay on
                    // their grid and the pairing between shape and frame is what changes.
                    const c = Math.cos(-phi),
                        sn = Math.sin(-phi);
                    const xs = new Float64Array(L),
                        ys = new Float64Array(L);
                    for (let k = 0; k < L; k++) {
                        xs[k] = bx[k] * c - by[k] * sn;
                        ys[k] = bx[k] * sn + by[k] * c;
                    }
                    const r = recoverOnce(xs, ys, C, DEPTH, SEED, dStar, TAU_STAR);
                    obs += r.evals;
                    alias += r.alias;
                    per.push(r);
                }
                const good = per.filter(r => isFinite(r.lenL1));
                const l1s = good.map(r => r.lenL1);
                const meanL1 = l1s.length ? l1s.reduce((a, b) => a + b, 0) / l1s.length : NaN;
                // THE SHAPE STATISTIC IS THE SWING, not the mean. max/min of the ℓ¹ reading across
                // lattice angles is rotation-invariant — the orbit's width rather than a point on it
                // — and it is bounded in [1, √2] because |cos θ| + |sin θ| is. It reads the
                // CONCENTRATION of the tangent-direction distribution: a circle 1.000 (uniform), a
                // triangle and a hexagon 1.035 and IDENTICAL (a hexagon's edge directions are the
                // triangle's mod 180°, and the ℓ¹ functional sees directions mod 180° only — a free
                // consistency check that the statistic reads directions and nothing else), a square
                // √2 (two directions). It is NOT a corner count: a five-pointed star has ten corners
                // and is nearly as isotropic as the circle.
                const swing = l1s.length >= 2 ? Math.max(...l1s) / Math.min(...l1s) : NaN;
                const slopes = good.map(r => r.slope).filter(isFinite).sort((a, b) => a - b);
                const slope = slopes.length ? slopes[slopes.length >> 1] : NaN;
                const lenEst = meanL1 / XING;
                // `pts` and `loopN` ride along so the sheet can DRAW the specimen it just measured —
                // labLadder asks for exactly those two, the same way the base-rule rows carry them.
                rows.push({
                    key: spec.key,
                    pts,
                    loopN: spec.loopN,
                    len,
                    lenEst,
                    meanL1,
                    swing,
                    slope,
                    dStar,
                    ratio: lenEst / len,
                    obs,
                    alias,
                    finest: good.length ? good[0].finest : NaN,
                    cellsFinest: good.length ? good[0].cellsFinest : 0,
                    angles: ANGLES.length
                });
            }
            return {
                rows,
                total,
                L,
                C,
                DEPTH,
                angles: ANGLES.length
            };
        }

        // A SHEET, NOT A TABLE — the same move the base-rule tests made, for the same reason.
        // The claim this run makes is per-shape ("the census measures arc length, and the swing
        // measures the tangent-direction spread"), and a twelve-column table asks you to find
        // that claim by scanning integers. Drawn as a ladder it arrives at a glance: every
        // representable primitive gets a cell at the size of the cell, its key results under it,
        // and the verdict in the CONTOUR'S COLOUR —
        //
        //   teal   the recovered length is within 5% of the contour's own
        //   gold   within the gauge band — inside 11%, which is the width [π/4, π√2/4] that a
        //          single-lattice reading could not have escaped even in the continuum
        //   red    outside it; this is a shape the census under-counts, and the mechanism is in
        //          the note above runRecoveryTests — a feature that fits inside one cell is not
        //          small to this instrument, it is absent
        //
        // Four lines per shape, matching the ladder's other fixtures: what it cost, what it
        // measured, what that says about the shape, and where the horizon sat. The aggregates
        // that were the table's header go to the status line, which is where this file puts
        // one-number summaries everywhere else.
        //
        // It REPLACES the page, in one history frame, exactly as the other ladders do — so one
        // undo brings your work back.
        function showRecoveryReport(res) {
            const {rows, total, L, C, angles} = res;
            const f3 = x => isFinite(x) ? x.toFixed(3) : '—';
            const out = labLadder({
                rows,
                name: 'recovery tests',
                suffix: 'C=' + C + ' · ' + angles + ' lattice angles',
                // The band is the gauge band, not a tolerance picked to make the run pass: a
                // single-lattice census cannot land outside [0.785, 1.111] whatever the shape, so
                // "inside 11%" is the claim that the rotation average removed the frame, and
                // "inside 5%" is the stronger one that it also read the length.
                verdict: r => !isFinite(r.ratio) ? 0
                : Math.abs(r.ratio - 1) < 0.05 ? 2
                : Math.abs(r.ratio - 1) < 0.111 ? 1 : 0,
                caption: r => r.key + '\n'
                + 'obs ' + r.obs + '  alias ' + r.alias + '\n'
                + 'len ' + f3(r.lenEst) + '/' + f3(r.len) + ' = ' + f3(r.ratio)
                + (isFinite(r.ratio) && Math.abs(r.ratio - 1) < 0.111 ? ' ✓' : ' ✗') + '\n'
                + 'swing ' + f3(r.swing) + '  dim ' + f3(r.slope),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const med = k => labMed(drawn.map(r => r[k]));
            const near5 = drawn.filter(r => isFinite(r.ratio) && Math.abs(r.ratio - 1) < 0.05).length;
            const band = drawn.filter(r => isFinite(r.ratio) && Math.abs(r.ratio - 1) < 0.111).length;
            const clean = drawn.filter(r => r.alias === 0).length;
            const iso = drawn.filter(r => isFinite(r.swing) && r.swing < 1.02).length;
            flashStatus('recovery tests · ' + drawn.length + ' of ' + total + ' primitives recovered from ray rings alone'
            + ' · C=' + C + ' L=' + L + ' over ' + angles + ' lattice angles'
            + ' — median observers ' + med('obs')
            + ' · length ratio ' + med('ratio').toFixed(3)
            + ' (' + near5 + ' within 5%, ' + band + ' inside the gauge band [0.785, 1.111])'
            + ' · median dimension ' + med('slope').toFixed(3)
            + ' · swing < 1.02 on ' + iso + ' (isotropic)'
            + ' · ' + clean + ' with no observer inside δ*'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bR = $('bRecoveryTests');
            if (bR) {
                bR.addEventListener('click', () => {
                    flashStatus('recovering the library from ray rings…');
                    // A frame first: the run is a few hundred thousand bearings and the click should
                    // be seen to land before the page goes quiet for it.
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                        try {
                            const res = runRecoveryTests();
                            if (!res.rows.length)
                                flashStatus('recovery tests: no representable primitives');
                            else
                                showRecoveryReport(res);
                        } catch (e) {
                            flashStatus('recovery tests failed: ' + e.message);
                        }
                    }));
                });
            }
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { runRecoveryTests, taWindingAt });
};
