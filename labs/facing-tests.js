// FACING TESTS (?lab=fac), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labLadder, makeRng. It declares nothing the editor reads. Loaded the
// first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['facing-tests'] = function () {
        // ── FACING TESTS ─────────────────────────────────────────────────────────────
        // An attempt to refute the facing's independence, not to illustrate it. If the
        // reading stream determines the facing, §4's constituent collapses into the
        // sweep and the count is five. Two attacks: an exact one (mirror), and a
        // statistical one (predict the facing from reading features alone).
        function facingRead(pts, ox, oy) {
            const n = pts.length,
                r = [],
                lr = [];
            let turn = 0;
            for (let k = 0; k < n; k++) {
                const d = Math.hypot(pts[k].x - ox, pts[k].y - oy);
                if (d < 1e-9)
                    return null;
                r.push(d);
            }
            for (let k = 0; k < n; k++) {
                const a = pts[k],
                    b = pts[(k + 1) % n];
                const ax = a.x - ox,
                    ay = a.y - oy,
                    bx = b.x - ox,
                    by = b.y - oy;
                turn += Math.atan2(ax * by - bx * ay, ax * bx + ay * by);
                lr.push(Math.log(Math.hypot(bx, by) / Math.hypot(ax, ay)));
            }
            return {
                r,
                lr,
                w: turn / (2 * Math.PI)
            };
        }

        // Scale-free features of the READING STREAM ONLY. Nothing angular is admitted:
        // no cross product, no sign, no turn — if the facing can be predicted from
        // these, it was never independent.
        function facingFeatures(c) {
            const lr = c.lr,
                n = lr.length;
            let m = 0;
            for (const v of lr)
                m += v;
            m /= n;
            let sd = 0;
            for (const v of lr)
                sd += (v - m) * (v - m);
            sd = Math.sqrt(sd / n);
            let sc = 0;
            for (let k = 1; k < n; k++)
                if (Math.sign(lr[k]) !== Math.sign(lr[k - 1]))
                    sc++;
            let mx = -Infinity,
                mn = Infinity;
            for (const v of lr) {
                if (v > mx)
                    mx = v;
                if (v < mn)
                    mn = v;
            }
            const la = c.r.map(Math.log);
            let lm = 0;
            for (const v of la)
                lm += v;
            lm /= n;
            let spread = 0;
            for (const v of la)
                spread += (v - lm) * (v - lm);
            spread = Math.sqrt(spread / n);
            let hi = -Infinity,
                lo = Infinity;
            for (const v of la) {
                if (v > hi)
                    hi = v;
                if (v < lo)
                    lo = v;
            }
            const D = [];
            for (let h = 1; h <= 6; h++) {
                let re = 0,
                    im = 0;
                for (let k = 0; k < n; k++) {
                    const th = 2 * Math.PI * h * k / n;
                    re += (la[k] - lm) * Math.cos(th);
                    im += (la[k] - lm) * Math.sin(th);
                }
                D.push(Math.hypot(re, im) / n);
            }
            return [sd, sc / n, mx, mn, spread, hi - lo].concat(D);
        }

        function runFacingTests() {
            const mirror = p => p.map(q => ({
                x: -q.x,
                y: q.y
            }));
            const centroid = p => {
                let x = 0,
                    y = 0;
                for (const q of p) {
                    x += q.x;
                    y += q.y;
                }
                return [x / p.length, y / p.length];
            };
            const rows = [],
                cases = [];
            let total = 0;
            const rand = makeRng(12345);
            for (const spec of PRIMITIVES) {
                total++;
                if (typeof spec.pts !== 'function')
                    continue;
                const base = spec.pts();
                if (!base || base.length < 8)
                    continue;
                const key = spec.key || spec.name || 'shape';
                // ── the exact attack: the mirror ─────────────────────────────────────
                const cA = centroid(base),
                    M = mirror(base),
                    cB = centroid(M);
                const a = facingRead(base, cA[0], cA[1]),
                    b = facingRead(M, cB[0], cB[1]);
                if (!a || !b)
                    continue;
                let maxDiff = 0;
                for (let k = 0; k < a.r.length; k++)
                    maxDiff = Math.max(maxDiff, Math.abs(a.r[k] - b.r[k]));
                rows.push({
                    key,
                    pts: base,
                    maxDiff,
                    wA: a.w,
                    wB: b.w,
                    identical: maxDiff < 1e-12,
                    negated: Math.abs(a.w + b.w) < 1e-9,
                    collision: maxDiff < 1e-12 && Math.abs(a.w - b.w) > 1e-9
                });
                // ── the statistical attack: many standpoints, both handednesses ──────
                for (const P of [base, M]) {
                    const c = centroid(P);
                    let R = 0;
                    for (const q of P)
                        R = Math.max(R, Math.hypot(q.x - c[0], q.y - c[1]));
                    for (let s = 0; s < 12; s++) {
                        const ang = rand() * 2 * Math.PI;
                        const rad = (s < 6 ? rand() * 0.9 : 1.2 + rand() * 2.5) * R;
                        const rd = facingRead(P, c[0] + rad * Math.cos(ang), c[1] + rad * Math.sin(ang));
                        if (rd)
                            cases.push({
                                key,
                                r: rd.r,
                                lr: rd.lr,
                                w: Math.round(rd.w)
                            });
                    }
                }
            }
            // nearest neighbour with the shape itself held out, so a prediction cannot be
            // made by recognising the shape and remembering its answer
            const F = cases.map(facingFeatures),
                W = cases.map(c => c.w);
            let encHit = 0,
                encN = 0,
                signHit = 0,
                signN = 0;
            for (let i = 0; i < F.length; i++) {
                let best = -1,
                    bd = Infinity;
                for (let j = 0; j < F.length; j++) {
                    if (cases[j].key === cases[i].key)
                        continue;
                    let d = 0;
                    for (let k = 0; k < F[i].length; k++) {
                        const e = F[i][k] - F[j][k];
                        d += e * e;
                    }
                    if (d < bd) {
                        bd = d;
                        best = j;
                    }
                }
                if (best < 0)
                    continue;
                encN++;
                if ((W[best] !== 0) === (W[i] !== 0))
                    encHit++;
                if (W[i] !== 0 && W[best] !== 0) {
                    signN++;
                    if (Math.sign(W[best]) === Math.sign(W[i]))
                        signHit++;
                }
            }
            const enc = W.filter(w => w !== 0).length / W.length;
            return {
                rows,
                total,
                stats: {
                    n: cases.length,
                    enclosureAcc: encHit / encN,
                    enclosureBaseline: Math.max(enc, 1 - enc),
                    signAcc: signN ? signHit / signN : 0,
                    signN
                }
            };
        }

        function showFacingReport(res) {
            const {rows, total, stats} = res;
            const pct = x => (100 * x).toFixed(1) + '%';
            const out = labLadder({
                rows,
                name: 'facing tests',
                suffix: 'mirror + recovery',
                // teal: the reading stream came back bit-identical and the facing flipped —
                // a collision, which is what independence looks like. gold: identical but the
                // facing did not differ (nothing enclosed either way). red: the mirror changed
                // the reading, so this shape cannot witness anything.
                verdict: r => !r.identical ? 0 : (r.collision ? 2 : 1),
                caption: r => r.key + '\n'
                + 'reading ' + (r.identical ? 'bit-identical ✓' : 'differs by ' + r.maxDiff.toExponential(1) + ' ✗') + '\n'
                + 'facing ' + r.wA + ' → ' + r.wB + (r.negated ? '  negated ✓' : '') + '\n'
                + (r.collision ? 'a collision: same reading, other facing' : 'no collision here'),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const ident = drawn.filter(r => r.identical).length;
            const coll = drawn.filter(r => r.collision).length;
            const s = stats;
            flashStatus('facing tests · ' + drawn.length + ' of ' + total + ' primitives mirrored'
            + ' — the reading stream came back bit-identical on ' + ident + '/' + drawn.length
            + ' and the facing negated, giving ' + coll + ' exact collisions:'
            + ' same reading, other facing, one per shape rather than one constructed'
            + ' · recovery from reading features alone, the shape held out (' + s.n + ' standpoints):'
            + ' direction ' + pct(s.signAcc) + ' against 50% chance — the facing\u2019s sign is not in the reading;'
            + ' enclosure ' + pct(s.enclosureAcc) + ' against a ' + pct(s.enclosureBaseline) + ' baseline,'
            + ' so a reading stream carries a little of WHETHER the sweep went round and none of WHICH WAY'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bFT = $('bFacingTests');
            if (bFT)
                bFT.addEventListener('click', () => {
                    bFT.disabled = true;
                    bFT.textContent = 'attacking…';
                    setTimeout(() => {
                        try {
                            const res = runFacingTests();
                            if (!res.rows.length)
                                flashStatus('facing tests: no representable primitives');
                            else
                                showFacingReport(res);
                        } catch (e) {
                            flashStatus('facing tests failed: ' + e.message);
                        }
                        finally {
                            bFT.disabled = false;
                            bFT.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }
};
