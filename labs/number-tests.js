// THE NUMBER TESTS (?lab=num), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "agreed, proceed").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates
// that function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code
// uses (labLadder, flashStatus, $, …) is the editor's, as it was when the code sat there. Edit it as you would the
// editor: the same voice, the same indent. Uses the editor's labLadder, flashStatus and $; declares nothing the
// editor reads. Loaded the first time its button is pressed, or ?lab=num asks.
(window.TVF_LABS = window.TVF_LABS || {})['number-tests'] = function () {
        // ── NUMBER TESTS ─────────────────────────────────────────────────────────────
        // Numbers as outputs of the construction rather than inputs to it. Only two
        // operations are used below — the line through two points, and the point where
        // two lines cross — and the disagreement decides both for free. From three
        // marked stations and the complete quadrangle, the arithmetic of the line comes
        // out: the integers by stepping, negation and the reciprocal by conjugating
        // against different pairs.
        function nMeet(p1, p2, p3, p4) {
            const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
            if (Math.abs(d) < 1e-12)
                return null;
            const a = p1.x * p2.y - p1.y * p2.x,
                b = p3.x * p4.y - p3.y * p4.x;
            return {
                x: (a * (p3.x - p4.x) - (p1.x - p2.x) * b) / d,
                y: (a * (p3.y - p4.y) - (p1.y - p2.y) * b) / d
            };
        }
        // the fourth harmonic of A, B, C by the complete quadrangle: two auxiliary
        // points off the line, four joins, three meets, and no measurement anywhere
        function nHarm(A, B, C, P, aux1, aux2) {
            const Q = nMeet(P, C, aux1, aux2);
            if (!Q)
                return null;
            const R = nMeet(A, Q, P, B);
            if (!R)
                return null;
            const S = nMeet(B, Q, P, A);
            if (!S)
                return null;
            return nMeet(R, S, A, B);
        }
        // the projective coordinate the constructed points are CHECKED against — the
        // account's reading of them, never used to build anything
        function nParam(Z, U, W, X) {
            const useX = Math.abs(U.x - Z.x) > Math.abs(U.y - Z.y);
            const s = P => useX ? P.x : P.y;
            const sz = s(Z),
                su = s(U),
                sw = s(W),
                sx = s(X);
            if (Math.abs(sx - sw) < 1e-12)
                return Infinity;
            return ((sx - sz) / (sx - sw)) / ((su - sz) / (su - sw));
        }
        function runNumberTests() {
            const proj = (pts, q1, q2) => {
                const out = [];
                for (const p of pts) {
                    const w = q1 * p.x + q2 * p.y + 1;
                    if (w < 0.2)
                        return null;
                    out.push({
                        x: p.x / w,
                        y: p.y / w
                    });
                }
                return out;
            };
            const build = (Z, U, W, P, a1, a2) => {
                const H = (A, B, C) => nHarm(A, B, C, P, a1, a2);
                const rungs = [Z, U];
                for (let n = 2; n <= 12; n++) {
                    const nx = H(rungs[n - 1], W, rungs[n - 2]);
                    if (!nx)
                        return null;
                    rungs.push(nx);
                }
                const neg = [];
                for (const k of [2, 3, 5, 8]) {
                    const d = H(Z, W, rungs[k]);
                    if (!d)
                        return null;
                    neg.push([k, d]);
                }
                const mOne = H(Z, W, U);
                if (!mOne)
                    return null;
                const rec = [];
                for (const k of [2, 3, 4, 7]) {
                    const d = H(U, mOne, rungs[k]);
                    if (!d)
                        return null;
                    rec.push([k, d]);
                }
                // the sum: the fourth station of the far station against A and B is the
                // midpoint, and the fourth station of the near station against that and the
                // far station doubles it. Two quadrangles, nothing measured.
                const sums = [];
                for (const [i, j] of [[2, 3], [4, 5], [7, 2], [3, 9]]) {
                    const M = H(rungs[i], rungs[j], W);
                    if (!M)
                        return null;
                    const S = H(M, W, Z);
                    if (!S)
                        return null;
                    sums.push([i + j, S]);
                }
                // the product: a chain of two perspectivities through an auxiliary line. The
                // second centre is placed so the chain fixes both stations and carries the
                // unit to B — and one such map exists, so what it sends A to is A × B.
                const prods = [];
                const m1 = {
                        x: Z.x + 0.6,
                        y: Z.y + 1.0
                    },
                    m2 = {
                        x: Z.x + 1.2,
                        y: Z.y + 2.0
                    };
                const C1 = {
                    x: -1.2,
                    y: 0.8
                };
                for (const [i, j] of [[2, 3], [4, 2], [5, 3], [7, 2]]) {
                    const A = rungs[i],
                        B = rungs[j];
                    const mW = nMeet(m1, m2, W, C1),
                        mU = nMeet(m1, m2, U, C1);
                    if (!mW || !mU)
                        return null;
                    const C2 = nMeet(mW, W, mU, B);
                    if (!C2)
                        return null;
                    const mA = nMeet(m1, m2, A, C1);
                    if (!mA)
                        return null;
                    const R = nMeet(Z, U, mA, C2);
                    if (!R)
                        return null;
                    prods.push([i * j, R]);
                }
                return {
                    rungs,
                    neg,
                    rec,
                    mOne,
                    sums,
                    prods
                };
            };
            const Z = {
                    x: 0,
                    y: 0
                },
                U = {
                    x: 1,
                    y: 0
                },
                W = {
                    x: 7.3,
                    y: 0
                };
            const P = {
                    x: 0.4,
                    y: 1.1
                },
                a1 = {
                    x: 0.9,
                    y: 2.2
                },
                a2 = {
                    x: 2.4,
                    y: 0.3
                };
            const base = build(Z, U, W, P, a1, a2);
            const res = {
                ladder: 0,
                ladderN: 0,
                negs: 0,
                negN: 0,
                recs: 0,
                recN: 0,
                sums: 0,
                sumN: 0,
                prods: 0,
                prodN: 0,
                worst: 0,
                projRuns: 0,
                projOK: 0,
                projWorst: 0,
                built: {
                    ints: [],
                    negs: [],
                    recs: [],
                    sums: [],
                    prods: []
                }
            };
            if (base) {
                for (let n = 1; n <= 12; n++) {
                    const v = nParam(Z, U, W, base.rungs[n]);
                    res.built.ints.push(v);
                    if (n < 2)
                        continue;
                    res.ladderN++;
                    const e = Math.abs(v - n);
                    res.worst = Math.max(res.worst, e);
                    if (e < 1e-6)
                        res.ladder++;
                }
                for (const [k, d] of base.neg) {
                    const v = nParam(Z, U, W, d);
                    res.negN++;
                    res.built.negs.push(v);
                    const e = Math.abs(v + k);
                    res.worst = Math.max(res.worst, e);
                    if (e < 1e-6)
                        res.negs++;
                }
                for (const [k, d] of base.rec) {
                    const v = nParam(Z, U, W, d);
                    res.recN++;
                    res.built.recs.push(v);
                    const e = Math.abs(v - 1 / k);
                    res.worst = Math.max(res.worst, e);
                    if (e < 1e-6)
                        res.recs++;
                }
                for (const [k, d] of base.sums) {
                    const v = nParam(Z, U, W, d);
                    res.sumN++;
                    res.built.sums.push(v);
                    const e = Math.abs(v - k);
                    res.worst = Math.max(res.worst, e);
                    if (e < 1e-6)
                        res.sums++;
                }
                for (const [k, d] of base.prods) {
                    const v = nParam(Z, U, W, d);
                    res.prodN++;
                    res.built.prods.push(v);
                    const e = Math.abs(v - k);
                    res.worst = Math.max(res.worst, e);
                    if (e < 1e-6)
                        res.prods++;
                }
            }
            // the account is changed underneath the construction, and the construction is
            // run again in the new account. Its results must be the images of its results.
            const rnd = makeRng(991);
            for (let trial = 0; trial < 24 && base; trial++) {
                const q1 = 0.16 * (rnd() - 0.5),
                    q2 = 0.16 * (rnd() - 0.5);
                const all = proj([Z, U, W, P, a1, a2].concat(base.rungs), q1, q2);
                if (!all)
                    continue;
                res.projRuns++;
                const b2 = build(all[0], all[1], all[2], all[3], all[4], all[5]);
                if (!b2)
                    continue;
                let worst = 0;
                for (let n = 2; n <= 12; n++) {
                    const img = all[6 + n]; // the image of what was built
                    const built = b2.rungs[n]; // what the new account builds
                    worst = Math.max(worst, Math.hypot(img.x - built.x, img.y - built.y));
                }
                res.projWorst = Math.max(res.projWorst, worst);
                if (worst < 1e-6)
                    res.projOK++;
            }
            return res;
        }
        // The page for the number run: the constructed values themselves, standing as
        // teeth on a line. Nothing here was measured — every tooth is where a join and a
        // meet put it, and the ruler underneath is only the account's reading of them.
        function showNumberPage(r) {
            const rows = [];
            if (r.built) {
                rows.push({
                    key: 'the ladder',
                    kind: 'integers 1…12',
                    pts: labComb(r.built.ints, 0, 13),
                    note: 'each rung is the fourth harmonic of the one before it',
                    worst: r.worst
                });
                rows.push({
                    key: 'negation',
                    kind: 'conjugate against near and far',
                    pts: labComb(r.built.negs.map(v => v + 9), 0, 13),
                    note: 'the same construction, other pair of stations',
                    worst: r.worst
                });
                rows.push({
                    key: 'the reciprocals',
                    kind: 'conjugate against 1 and −1',
                    pts: labComb(r.built.recs.map(v => v * 12), 0, 13),
                    note: 'halves, thirds, quarters and sevenths, drawn where they landed',
                    worst: r.worst
                });
                rows.push({
                    key: 'the sums',
                    kind: 'midpoint, then doubled',
                    pts: labComb(r.built.sums.map(v => v / 2), 0, 13),
                    note: 'two quadrangles each — no measurement anywhere',
                    worst: r.worst
                });
                rows.push({
                    key: 'the products',
                    kind: 'two perspectivities',
                    pts: labComb(r.built.prods.map(v => v / 3), 0, 13),
                    note: 'a chain of joins fixing both stations and carrying the unit to b',
                    worst: r.worst
                });
            }
            if (!rows.length)
                return;
            labLadder({
                rows,
                name: 'number tests',
                suffix: 'joins and meets only',
                verdict: () => (r.worst < 1e-6 ? 2 : 0),
                caption: row => row.key + '\n' + row.kind + '\n' + row.note + '\n'
                + 'worst departure ' + r.worst.toExponential(1),
            });
        }
        function showNumberReport(r) {
            flashStatus('number tests · built with joins and meets only, no length measured and no unit supplied'
            + ' — the ladder came out as the integers on ' + r.ladder + '/' + r.ladderN
            + ' · conjugating against the near and far stations gave negation on ' + r.negs + '/' + r.negN
            + ' · conjugating against the unit and its negative gave the reciprocal on ' + r.recs + '/' + r.recN
            + ' · the midpoint-and-double pair of quadrangles gave the SUM on ' + r.sums + '/' + r.sumN
            + ' · a chain of two perspectivities gave the PRODUCT on ' + r.prods + '/' + r.prodN
            + ' · worst departure from the whole number ' + r.worst.toExponential(1)
            + ' — successor, negation and inverse are the whole of rational arithmetic, so the field of the line'
            + ' is GENERATED by incidence rather than assumed and then coordinatised'
            + ' · the construction commuted with a projective account on ' + r.projOK + '/' + r.projRuns
            + ' restatements, worst disagreement ' + r.projWorst.toExponential(1)
            + ' — what a pair builds this way it does not owe to any page');
        }
        {
            const bNT = $('bNumberTests');
            if (bNT)
                bNT.addEventListener('click', () => {
                    bNT.disabled = true;
                    bNT.textContent = 'constructing…';
                    setTimeout(() => {
                        try {
                            const r = runNumberTests();
                            showNumberPage(r);
                            showNumberReport(r);
                        }
                        catch (e) {
                            flashStatus('number tests failed: ' + e.message);
                        }
                        finally {
                            bNT.disabled = false;
                            bNT.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }
};
