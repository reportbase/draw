// WHERE THE DETAIL TURNS (?lab=crs, ?lab=hom, ?lab=rip), moved out of draw.html line for line (28 Oct 2026, Tom: "all
// the labs can ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, PRIMITIVES, asmResample, flashStatus, labLadder, lodDraw, lodProfile. It declares
// nothing the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['where-the-detail-turns'] = function () {
        // ── where the detail turns ──────────────────────────────────────────
        // The level-of-detail axis read as a relation (Sep 11 2026, lod_corner.py). The reader's
        // term is the register's STEP; the thing read is the figure's SWING, the log of its
        // largest reach over its smallest. The reading is the RUNG SPAN, R = swing ÷ step. At
        // R = 0 the figure fits inside one step and the reader holds its own laid unit all the
        // way round — the unit curve, a statement about the READER. As R grows the step dwindles
        // and the held figure settles toward the figure, never arriving. Tom: before the corner
        // the record is in terms of the observer, after it in terms of the shape.
        //
        // WHERE THE CORNER IS, measured: the record says its first word about the shape when the
        // figure's LARGEST DEPARTURE FROM HOME exceeds HALF A STEP. Home is wherever the first
        // look laid the unit, so the corner is not a fixed rung span — R* = 1/(1+|u|), u being
        // where the unit sits in the swing (0 the middle, ±1 an extreme): 1 when home is laid
        // mid-swing, 0.5 at an extreme. The first guess, "the step equals the swing", is the
        // mid-swing case. This is a corner of a DERIVED relation (step against swing), never the
        // corner of V:H — keep the two apart.
        //
        // THE REGISTER IS THE UNIT RULE, and it needs no loop here. A hold that starts at the
        // first look and moves by whole steps always lands on the lattice anchored at that look,
        // and rounding the arrival against it lands on the nearest lattice point — so the held
        // value at every look IS the nearest rung of the lattice laid at home. No path
        // dependence, as the corpus already measured; wdtHold is that projection, one line.
        //
        // Three runs, one group, each a ladder in the house style: the contour's colour is the
        // verdict on the REGISTERED prediction for that cell — teal it held exactly, gold the
        // band where the prediction itself says it may go either way (or the figure, unread),
        // red it failed. Each replaces the page in one history frame.
        function wdtHold(lr, anchor, sig) {
            return lr.map(v => anchor + Math.round((v - anchor) / sig) * sig);
        }
        function wdtCarried(lr, held) {
            // share of the shape carried: 1 − error variance ÷ figure variance, each held figure's
            // own offset removed — the reader's radius is its own, not the figure's. Negative is
            // possible and meaningful: a record worse than the circle it replaced.
            const n = lr.length;
            let ma = 0,
                mb = 0;
            for (let k = 0; k < n; k++) {
                ma += lr[k];
                mb += held[k];
            }
            ma /= n;
            mb /= n;
            let ve = 0,
                vf = 0;
            for (let k = 0; k < n; k++) {
                const f = lr[k] - ma,
                    e = f - (held[k] - mb);
                ve += e * e;
                vf += f * f;
            }
            return vf > 0 ? 1 - ve / vf : 0;
        }
        function wdtFigure(key, N) {
            const spec = PRIMITIVES.find(q => q.key === key);
            if (!spec || typeof spec.pts !== 'function')
                return null;
            const prof = lodProfile(asmResample(spec.pts(), 1200), N);
            const lr = prof.map(v => Math.log(v));
            let lo = Infinity,
                hi = -Infinity;
            for (const v of lr) {
                lo = Math.min(lo, v);
                hi = Math.max(hi, v);
            }
            const S = hi - lo,
                mid = (hi + lo) / 2;
            return {
                lr,
                S,
                mid,
                u: k => (lr[k] - mid) / (S / 2)
            };
        }
        function wdtCell(F, home, R) {
            const sig = F.S / R,
                a = F.lr[home];
            const held = wdtHold(F.lr, a, sig);
            let silent = true;
            for (const v of held)
                if (v !== a) {
                    silent = false;
                    break;
                }
            const rungs = new Set(held.map(v => Math.round((v - a) / sig))).size;
            return {
                held,
                silent,
                rungs,
                carried: wdtCarried(F.lr, held),
                pts: lodDraw(held.map(v => Math.exp(v)))
            };
        }
        const wdtPct = x => {
            const t = Math.round(100 * x);
            return (t < 0 ? '\u2212' : '') + Math.abs(t) + '%';
        };
        const wdtSigned = (x, d) => {
            const t = x.toFixed(d);
            return (+t === 0 ? '\u00b1' : x > 0 ? '+' : '\u2212') + Math.abs(+t).toFixed(d);
        };
        const wdtR = R => R < 10 ? R.toFixed(2) : R.toFixed(0);

        // ── run 1: cross it — one register, home laid at its first look, R from home outward ──
        function runCornerCross() {
            const N = 720,
                F = wdtFigure('clover', N);
            if (!F)
                return null;
            const home = 0,
                u0 = F.u(home),
                Rs0 = 1 / (1 + Math.abs(u0));
            // the fixed spread, less anything within 15% of the predicted first word — a cell ON the
            // boundary is a rounding tie, not a reading — plus one cell either side of it
            let Rs = [0.25, 0.4, 0.6, 0.75, 1.0, 1.5, 2.5, 5, 12, 32]
            .filter(R => Math.abs(R / Rs0 - 1) > 0.15);
            Rs.push(Rs0 * 0.94, Rs0 * 1.06);
            Rs.sort((x, y) => x - y);
            const rows = Rs.map(R => {
                const c = wdtCell(F, home, R);
                const due = R < Rs0; // registered: silent below R*
                return Object.assign(c, {
                    R,
                    due,
                    ok: c.silent === due
                });
            });
            rows.push({
                R: Infinity,
                figure: true,
                pts: lodDraw(F.lr.map(v => Math.exp(v)))
            });
            return {
                rows,
                u0,
                Rs0,
                S: F.S
            };
        }
        function showCornerCross(res) {
            const {rows, u0, Rs0} = res;
            const out = labLadder({
                rows,
                name: 'where the detail turns',
                suffix: 'crossed \u2014 before the corner the reader, after it the shape',
                verdict: r => r.figure ? 1 : (r.ok ? 2 : 0),
                caption: r => r.figure
                ? 'the figure\n every reach, unrounded\n the horizon: approached,\n never reached'
                : 'R = ' + wdtR(r.R) + (r.silent ? ' \u00b7 silent' : ' \u00b7 speaking')
                + (r.silent ? '\n the laid unit, all the way round\n every symbol zero'
                : '\n ' + r.rungs + ' rungs held'
                + '\n carries ' + wdtPct(r.carried) + ' of the shape'
                + (r.carried < 0 ? '\n worse than the circle it replaced' : ''))
                + (r.ok ? '' : '\n AGAINST THE PREDICTION'),
            });
            if (!out)
                return;
            const bad = out.drawn.filter(r => !r.figure && !r.ok).length;
            const worst = out.drawn.filter(r => !r.figure && !r.silent)
            .reduce((m, r) => Math.min(m, r.carried), Infinity);
            flashStatus('where the detail turns \u00b7 crossed \u00b7 one register, its unit laid at its first'
            + ' look, u = ' + wdtSigned(u0, 2) + ' in the swing \u00b7 THE FIRST WORD IS DUE AT R = 1/(1+|u|) = '
            + Rs0.toFixed(3) + (bad ? ' \u00b7 ' + bad + ' CELL' + (bad > 1 ? 'S' : '') + ' AGAINST IT'
            : ' and every cell agrees') + ' \u00b7 below it the held figure is the reader\u2019s own unit,'
            + ' exactly \u2014 IN TERMS OF THE OBSERVER \u00b7 past it the record carries departures, and'
            + ' departures are the shape\u2019s \u2014 IN TERMS OF THE SHAPE, counted in the observer\u2019s steps'
            + ' \u00b7 THE CORNER OF THIS AXIS IS WHERE THE FIGURE\u2019S LARGEST DEPARTURE FROM HOME EQUALS'
            + ' HALF A STEP \u00b7 just past it the first symbols overshoot, reporting a small departure in a'
            + ' step larger than it' + (isFinite(worst) && worst < 0 ? ' (worst here ' + wdtPct(worst) + ')' : '')
            + ', so the record is briefly worse than silence \u00b7 loss toward home completes at a finite'
            + ' step; arrival toward the horizon never does'
            + (out.ms ? ' \u00b7 ' + out.ms + ' ms' : ''));
        }

        // ── run 2: move home — one rung span inside the band, the unit laid in eleven places ──
        function runCornerHome() {
            const N = 720,
                R = 0.75,
                F = wdtFigure('clover', N);
            if (!F)
                return null;
            // eleven first looks spread over |u| from the middle of the swing to an extreme — the
            // looks nearest each target, never the same look twice
            const used = new Set(),
                rows = [];
            for (let i = 0; i <= 10; i++) {
                const t = i / 10;
                let best = -1,
                    bd = Infinity;
                for (let k = 0; k < N; k++) {
                    if (used.has(k))
                        continue;
                    const d = Math.abs(Math.abs(F.u(k)) - t);
                    if (d < bd) {
                        bd = d;
                        best = k;
                    }
                }
                used.add(best);
                const u = F.u(best),
                    Rs = 1 / (1 + Math.abs(u));
                const c = wdtCell(F, best, R);
                const due = R < Rs;
                rows.push(Object.assign(c, {
                    u,
                    Rs,
                    due,
                    ok: c.silent === due
                }));
            }
            rows.push({
                figure: true,
                pts: lodDraw(F.lr.map(v => Math.exp(v)))
            });
            return {
                rows,
                R
            };
        }
        function showCornerHome(res) {
            const {rows, R} = res;
            const out = labLadder({
                rows,
                name: 'where the detail turns',
                suffix: 'home moved \u2014 the corner goes where the unit was laid',
                verdict: r => r.figure ? 1 : (r.ok ? 2 : 0),
                caption: r => r.figure
                ? 'the figure\n every reach, unrounded'
                : 'home at u = ' + wdtSigned(r.u, 2)
                + '\n first word due at R = ' + r.Rs.toFixed(2)
                + '\n at R = ' + R.toFixed(2) + ': ' + (r.silent ? 'silent, a circle' : 'speaking, ' + r.rungs + ' rungs')
                + (r.ok ? '' : '\n AGAINST THE PREDICTION'),
            });
            if (!out)
                return;
            const reg = out.drawn.filter(r => !r.figure);
            const quiet = reg.filter(r => r.silent).length,
                bad = reg.filter(r => !r.ok).length;
            flashStatus('where the detail turns \u00b7 home moved \u00b7 ONE STEP, ONE FIGURE, ELEVEN HOMES \u00b7'
            + ' every register reads the clover at rung span ' + R.toFixed(2) + ', inside the band where the'
            + ' corner can fall \u00b7 ' + quiet + ' of ' + reg.length + ' are silent: the ones whose unit was'
            + ' laid near the middle of the swing, where the farthest departure is still under half a step'
            + ' \u00b7 the rest speak: laid toward an extreme, the far side of the swing is a whole swing away'
            + ' \u00b7 prediction R* = 1/(1+|u|) ' + (bad ? 'FAILED IN ' + bad + ' CELL' + (bad > 1 ? 'S' : '')
            : 'held in every cell') + ' \u00b7 SO THE CORNER IS NOT A FACT ABOUT THE FIGURE ALONE \u2014 it is'
            + ' where the figure\u2019s largest departure from HOME equals half a step, and home is wherever the'
            + ' first look laid the unit \u00b7 at u = 0 it is the step equal to the swing; at an extreme, half'
            + ' that' + (out.ms ? ' \u00b7 ' + out.ms + ' ms' : ''));
        }

        // ── run 3: ride a lobe — the registration that failed ────────────────────────
        // A ripple twenty-three to the lap on a lobe of two, the lobe five times the larger. The
        // registration was ONE CORNER PER FEATURE: the ripple absent until the step falls under
        // its own swing. It is not. Riding on the lobe it arrives WITH the lobe, carried whole in
        // the median, because the lobe sweeps it across rung boundaries (the dither fork). What
        // it lacks below its own corner is RELIABILITY — any one reader sees it with a wide
        // spread. Alone, it behaves as registered. Synthetic profile, not a primitive: the
        // ripple must be a clean harmonic for its amplitude to be read off at all.
        function runCornerRipple() {
            const N = 720,
                HOMES = 72,
                A1 = 0.30,
                A2 = 0.06,
                K1 = 2,
                K2 = 23;
            const th = k => 2 * Math.PI * k / N;
            const mk = withLobe => {
                const lr = [];
                for (let k = 0; k < N; k++)
                    lr.push((withLobe ? A1 * Math.cos(K1 * th(k)) : 0) + A2 * Math.cos(K2 * th(k)));
                return lr;
            };
            const amp = held => {
                let m = 0;
                for (const v of held)
                    m += v;
                m /= N;
                let s = 0;
                for (let k = 0; k < N; k++)
                    s += (held[k] - m) * Math.cos(K2 * th(k));
                return (2 / N) * s / A2;
            };
            const q = (a, p) => {
                const s = [...a].sort((x, y) => x - y);
                return s[Math.min(s.length - 1, Math.floor(p * s.length))];
            };
            const S2 = 2 * A2,
                rows = [];
            for (const withLobe of [false, true]) {
                const lr = mk(withLobe);
                for (const Rr of [0.2, 0.35, 0.5, 0.75, 1.0, 2.0]) {
                    const sig = S2 / Rr;
                    const all = [];
                    for (let j = 0; j < HOMES; j++) {
                        const h = Math.floor(j * N / HOMES);
                        all.push(amp(wdtHold(lr, lr[h], sig)));
                    }
                    const held = wdtHold(lr, lr[0], sig);
                    const med = q(all, 0.5),
                        spread = q(all, 0.9) - q(all, 0.1);
                    // registered: absent (median under the 25% kill line) below R = 0.5, present
                    // (median within 25% of whole) from R = 1; the band between is gold by definition
                    const verdict = Rr < 0.5 ? (Math.abs(med) < 0.25 ? 2 : 0)
                    : Rr >= 1 ? (Math.abs(med - 1) < 0.25 ? 2 : 0) : 1;
                    rows.push({
                        withLobe,
                        Rr,
                        med,
                        spread,
                        mine: amp(held),
                        verdict,
                        pts: lodDraw(held.map(v => Math.exp(v)))
                    });
                }
            }
            return {
                rows
            };
        }
        function showCornerRipple(res) {
            const out = labLadder({
                rows: res.rows,
                name: 'where the detail turns',
                suffix: 'a ripple on a lobe \u2014 the registration that failed',
                verdict: r => r.verdict,
                caption: r => (r.withLobe ? 'the ripple on a lobe' : 'the ripple alone')
                + ' \u00b7 R = ' + r.Rr.toFixed(2)
                + '\n this reader carries it at ' + wdtPct(r.mine)
                + '\n 72 homes: median ' + wdtPct(r.med) + ', spread ' + wdtPct(r.spread)
                + (r.verdict === 0 ? '\n present below its own corner' : ''),
            });
            if (!out)
                return;
            const red = out.drawn.filter(r => r.verdict === 0).length;
            flashStatus('where the detail turns \u00b7 a ripple on a lobe \u00b7 REGISTERED: ONE CORNER PER FEATURE,'
            + ' the ripple absent until the step falls under its own swing \u00b7 the first six cells are the'
            + ' ripple ALONE and do exactly that: silent below R = 0.5, arriving in the band, whole past it \u00b7 the'
            + ' last six are the SAME ripple riding a lobe five times its size, and ' + red + ' cell'
            + (red === 1 ? '' : 's') + ' go red: it is carried nearly whole in the median FROM THE MOMENT THE'
            + ' LOBE SPEAKS \u00b7 the lobe sweeps the ripple back and forth across rung boundaries, so the'
            + ' ripple moves WHEN the lobe\u2019s rungs are crossed, and across many readers that timing carries'
            + ' it without bias \u00b7 what it lacks below its own corner is RELIABILITY: read the spread (10th to'
            + ' 90th percentile over the 72 homes), which shrinks roughly as one over its rung span \u00b7 A FEATURE UNDER A LARGER ONE IS NOT LOST BELOW'
            + ' ITS CORNER \u2014 IT IS SPOKEN IN THE LARGER FEATURE\u2019S TERMS \u00b7 loss is complete only for the'
            + ' whole figure, at the whole figure\u2019s corner'
            + (out.ms ? ' \u00b7 ' + out.ms + ' ms' : ''));
        }
        {
            const wire = (id, label, busy, run, show, name) => {
                const b = $(id);
                if (!b)
                    return;
                // Three labs share this heading, so the code chip sits on each BUTTON — and writing
                // textContent would wipe it on the first press. Swap the label, keep the chip.
                const say = t => {
                    const chip = b.querySelector('.lab-code');
                    b.textContent = t;
                    if (chip)
                        b.appendChild(chip);
                };
                b.addEventListener('click', () => {
                    b.disabled = true;
                    say(busy);
                    setTimeout(() => {
                        try {
                            const r = run();
                            if (!r)
                                flashStatus(name + ': no usable figure');
                            else
                                show(r);
                        }
                        catch (e) {
                            flashStatus(name + ' run failed: ' + e.message);
                        }
                        finally {
                            b.disabled = false;
                            say(label);
                        }
                    }, 0);
                });
            };
            wire('bCornerCross', 'cross it', 'crossing\u2026', runCornerCross, showCornerCross, 'where the detail turns');
            wire('bCornerHome', 'move home', 'moving\u2026', runCornerHome, showCornerHome, 'where the detail turns');
            wire('bCornerRipple', 'ride a lobe', 'riding\u2026', runCornerRipple, showCornerRipple, 'where the detail turns');
        }
};
