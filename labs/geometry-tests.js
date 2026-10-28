// GEOMETRY TESTS (?lab=geo), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, cross, flashStatus, labLadder. It declares nothing the editor reads. Loaded the first
// time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['geometry-tests'] = function () {
        // ── GEOMETRY TESTS ───────────────────────────────────────────────────────────
        // The question is not what the pair can draw but what survives when the account
        // is changed underneath it. The relation owns the sign of D for free and the
        // cross ratio is four D's; both are put through a similarity, an affine map and
        // a projective map, with distance ratios carried alongside as a control.
        function runGeometryTests() {
            // The question: what geometry is available from the disagreement alone?
            // D(a,b) is a sign and a magnitude; the relation owns the sign for free.
            // Under which changes of account does that data survive?
            const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (b.x - o.x) * (a.y - o.y);
            const sgn = x => x > 1e-12 ? 1 : (x < -1e-12 ? -1 : 0);
            // the chirotope: the sign of D on every ordered triple
            const chiro = P => {
                const s = [];
                for (let i = 0; i < P.length; i++)
                    for (let j = i + 1; j < P.length; j++)
                        for (let k = j + 1; k < P.length; k++)
                            s.push(sgn(cross(P[i], P[j], P[k])));
                return s;
            };
            const same = (a, b) => {
                let n = 0;
                for (let i = 0; i < a.length; i++)
                    if (a[i] === b[i])
                        n++;
                return n / a.length;
            };
            // the cross ratio of four rays from a standpoint — built from four disagreements
            // and nothing else: no length, no angle, no unit
            const xr = (o, a, b, c, d) => {
                const n = cross(o, a, c) * cross(o, b, d),
                    m = cross(o, a, d) * cross(o, b, c);
                return m ? n / m : NaN;
            };
            // accounts: a similarity, a general affine, and a projective map
            const sim = (P, th, s, tx, ty) => P.map(p => ({
                x: s * (p.x * Math.cos(th) - p.y * Math.sin(th)) + tx,
                y: s * (p.x * Math.sin(th) + p.y * Math.cos(th)) + ty
            }));
            const aff = (P, m) => P.map(p => ({
                x: m[0] * p.x + m[1] * p.y + m[4],
                y: m[2] * p.x + m[3] * p.y + m[5]
            }));
            const proj = (P, q1, q2) => {
                const out = [];
                for (const p of P) {
                    const w = q1 * p.x + q2 * p.y + 1;
                    if (w < 0.15)
                        return null;
                    out.push({
                        x: p.x / w,
                        y: p.y / w
                    });
                }
                return out;
            };
            const dists = P => {
                const d = [];
                for (let i = 0; i < P.length; i++)
                    for (let j = i + 1; j < P.length; j++)
                        d.push(Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y));
                const m = d[0];
                return d.map(v => v / m);
            };
            const relerr = (a, b) => {
                let s = 0;
                for (let i = 0; i < a.length; i++)
                    s += Math.abs(a[i] - b[i]) / Math.abs(b[i] || 1);
                return s / a.length;
            };

            const rows = [];
            const K = 14,
                res = {
                    n: 0,
                    chiSim: 0,
                    chiAff: 0,
                    chiProj: 0,
                    chiMirror: 0,
                    xrSim: 0,
                    xrAff: 0,
                    xrProj: 0,
                    distAff: 0,
                    distProj: 0,
                    harmonic: 0,
                    harmN: 0,
                    harmProj: 0,
                    harmProjN: 0,
                    projTried: 0,
                    projOK: 0
                };
            let rng = 7;
            const rnd = () => {
                rng = (Math.imul(rng, 1103515245) + 12345) & 0x7fffffff; // exactly, in 32-bit integers (see makeRng)
                return rng / 0x7fffffff;
            };
            for (const spec of PRIMITIVES) {
                if (typeof spec.pts !== 'function')
                    continue;
                const pts = spec.pts();
                if (!pts || pts.length < K)
                    continue;
                // K points spread around the contour, normalised to unit scale about the centroid
                let cx = 0,
                    cy = 0;
                for (const q of pts) {
                    cx += q.x;
                    cy += q.y;
                }
                cx /= pts.length;
                cy /= pts.length;
                let R = 0;
                for (const q of pts)
                    R = Math.max(R, Math.hypot(q.x - cx, q.y - cy));
                const P = [];
                for (let i = 0; i < K; i++) {
                    const q = pts[Math.floor(i * pts.length / K)];
                    P.push({
                        x: (q.x - cx) / R,
                        y: (q.y - cy) / R
                    });
                }
                const o = {
                    x: 0.03,
                    y: -0.02
                }; // a standpoint, off centre
                const c0 = chiro(P),
                    d0 = dists(P);
                const x0 = xr(o, P[0], P[3], P[7], P[11]);
                res.n++;
                // similarity
                const S = sim(P, rnd() * 6.283, 0.4 + rnd() * 3, rnd() * 4 - 2, rnd() * 4 - 2);
                const oS = sim([o], 0, 1, 0, 0)[0];
                res.chiSim += same(chiro(S), c0);
                // a similarity moves the standpoint too — transform it the same way
                const simAll = sim(P.concat([o]), 0.7, 1.9, 0.5, -0.3);
                res.xrSim += Math.abs(xr(simAll[K], simAll[0], simAll[3], simAll[7], simAll[11]) - x0) < 1e-9 ? 1 : 0;
                // general affine (orientation preserving)
                const m = [1 + rnd(), rnd() - 0.5, rnd() - 0.5, 1 + rnd(), 0, 0];
                if (m[0] * m[3] - m[1] * m[2] > 0.1) {
                    const A = aff(P.concat([o]), m);
                    res.chiAff += same(chiro(A.slice(0, K)), c0);
                    res.distAff += relerr(dists(A.slice(0, K)), d0);
                    res.xrAff += Math.abs(xr(A[K], A[0], A[3], A[7], A[11]) - x0) < 1e-9 ? 1 : 0;
                }
                // projective
                res.projTried++;
                const Q = proj(P.concat([o]), 0.25 * (rnd() - 0.5), 0.25 * (rnd() - 0.5));
                if (Q) {
                    res.projOK++;
                    res.chiProj += same(chiro(Q.slice(0, K)), c0);
                    res.distProj += relerr(dists(Q.slice(0, K)), d0);
                    res.xrProj += Math.abs(xr(Q[K], Q[0], Q[3], Q[7], Q[11]) - x0) < 1e-6 ? 1 : 0;
                }
                // a mirror flips every sign
                const M = P.map(p => ({
                    x: -p.x,
                    y: p.y
                }));
                res.chiMirror += same(chiro(M), c0.map(s => -s));

                // three cells for the page: the figure as held, affinely restated, and
                // projectively restated, each carrying what survived it
                if (rows.length < 27) {
                    const key = spec.key || spec.name || 'shape';
                    const mk = (kind, arr, chi, xrok, dist) => ({
                        key: key,
                        kind: kind,
                        pts: arr,
                        chi: chi,
                        chiOK: chi > 0.999,
                        xrOK: xrok,
                        dist: dist
                    });
                    rows.push(mk('held', P, 1, true, 0));
                    const Am = aff(P.concat([o]), m);
                    if (m[0] * m[3] - m[1] * m[2] > 0.1)
                        rows.push(mk('affine', Am.slice(0, K), same(chiro(Am.slice(0, K)), c0),
                        Math.abs(xr(Am[K], Am[0], Am[3], Am[7], Am[11]) - x0) < 1e-9, relerr(dists(Am.slice(0, K)), d0)));
                    if (Q)
                        rows.push(mk('projective', Q.slice(0, K), same(chiro(Q.slice(0, K)), c0),
                        Math.abs(xr(Q[K], Q[0], Q[3], Q[7], Q[11]) - x0) < 1e-6, relerr(dists(Q.slice(0, K)), d0)));
                }
                // the harmonic set. A and B are contour points; C is placed ON the line AB
                // (three points off a line are not a harmonic anything), and D is the fourth
                // station. The test that matters is not that it reads -1 here — that is
                // algebra — but that it STILL reads -1 after an account that moves every
                // distance in the figure.
                const A1 = P[0],
                    B1 = P[4];
                for (const tt of [0.2, 0.35, 0.7, 1.4]) {
                    const u = tt / (2 * tt - 1);
                    const C1 = {
                        x: A1.x + tt * (B1.x - A1.x),
                        y: A1.y + tt * (B1.y - A1.y)
                    };
                    const D1 = {
                        x: A1.x + u * (B1.x - A1.x),
                        y: A1.y + u * (B1.y - A1.y)
                    };
                    const v = xr(o, A1, B1, C1, D1);
                    res.harmN++;
                    if (isFinite(v) && Math.abs(v + 1) < 1e-9)
                        res.harmonic++;
                    // the same four stations, seen through the projective account
                    const QQ = proj([A1, B1, C1, D1, o], 0.18 * (rnd() - 0.5), 0.18 * (rnd() - 0.5));
                    if (QQ) {
                        const v2 = xr(QQ[4], QQ[0], QQ[1], QQ[2], QQ[3]);
                        res.harmProjN++;
                        if (isFinite(v2) && Math.abs(v2 + 1) < 1e-6)
                            res.harmProj++;
                    }
                }
            }
            const N = res.n || 1,
                PJ = res.projOK || 1;
            return {
                shapes: N,
                projectiveApplied: res.projOK + '/' + res.projTried,
                chirotopeUnderSimilarity: res.chiSim / N,
                chirotopeUnderAffine: res.chiAff / N,
                chirotopeUnderProjective: res.chiProj / PJ,
                chirotopeUnderMirror: res.chiMirror / N,
                crossRatioUnderSimilarity: res.xrSim / N,
                crossRatioUnderAffine: res.xrAff / N,
                crossRatioUnderProjective: res.xrProj / PJ,
                rows: rows,
                distanceRatioDriftAffine: res.distAff / N,
                distanceRatioDriftProjective: res.distProj / PJ,
                harmonicIsMinusOne: res.harmonic + '/' + res.harmN,
                harmonicSurvivesProjective: res.harmProj + '/' + res.harmProjN
            };
        }

        function showGeometryReport(res) {
            const pct = x => (100 * x).toFixed(1) + '%';
            flashStatus('geometry tests · ' + res.shapes + ' primitives restated by three accounts'
            + ' — the sign of D on every triple came through unchanged: '
            + pct(res.chirotopeUnderSimilarity) + ' under a similarity, '
            + pct(res.chirotopeUnderAffine) + ' under a general affine map, '
            + pct(res.chirotopeUnderProjective) + ' under a projective one'
            + ' · the cross ratio, built from four disagreements and nothing else, was exact through all three ('
            + pct(res.crossRatioUnderSimilarity) + ' / ' + pct(res.crossRatioUnderAffine) + ' / '
            + pct(res.crossRatioUnderProjective) + ')'
            + ' · the harmonic set read \u22121 on ' + res.harmonicIsMinusOne
            + ' and still read \u22121 after the projective account on ' + res.harmonicSurvivesProjective
            + ' · meanwhile DISTANCE RATIOS moved by ' + pct(res.distanceRatioDriftAffine)
            + ' affine and ' + pct(res.distanceRatioDriftProjective) + ' projective'
            + ' — so the geometry the pair owns is PROJECTIVE: incidence, order and the cross ratio'
            + ' are the relation\u2019s, and length and angle are the ground\u2019s'
            + ' · a mirror flipped every sign at once (' + pct(res.chirotopeUnderMirror)
            + '), which is the facing carrying what no magnitude carries');
        }

        // The page for the geometry run. Each primitive is drawn under three accounts,
        // so what the numbers say can also be seen: the figure changes and the signs and
        // the cross ratio do not.
        function showGeometryPage(res) {
            const rows = res.rows || [];
            if (!rows.length)
                return;
            labLadder({
                rows,
                name: 'geometry tests',
                suffix: 'held · affine · projective',
                verdict: r => (r.chiOK && r.xrOK) ? 2 : (r.chiOK || r.xrOK ? 1 : 0),
                caption: r => r.key + ' · ' + r.kind + '\n'
                + 'signs of D kept ' + (100 * r.chi).toFixed(1) + '%' + (r.chiOK ? ' ✓' : ' ✗') + '\n'
                + 'cross ratio ' + (r.xrOK ? 'exact ✓' : 'moved ✗') + '\n'
                + 'distance ratios moved ' + (100 * r.dist).toFixed(1) + '%',
            });
        }

        {
            const bGT = $('bGeometryTests');
            if (bGT)
                bGT.addEventListener('click', () => {
                    bGT.disabled = true;
                    bGT.textContent = 'restating…';
                    setTimeout(() => {
                        try {
                            const r = runGeometryTests();
                            showGeometryPage(r);
                            showGeometryReport(r);
                        }
                        catch (e) {
                            flashStatus('geometry tests failed: ' + e.message);
                        }
                        finally {
                            bGT.disabled = false;
                            bGT.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }
};
