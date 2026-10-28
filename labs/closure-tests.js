// CLOSURE TESTS (?lab=clt), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labLadder. It declares nothing the editor reads. Loaded the first time
// one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['closure-tests'] = function () {
        // ── CLOSURE TESTS ────────────────────────────────────────────────────────────
        // The two sheets' claims, checked against the library instead of a drawing.
        // Each primitive is read as a closed sweep from two standpoints; between
        // successive leaves sits one disagreement, and its two halves are accumulated
        // apart. The radial half is forced home; the angular half is not, and the
        // difference between them is the whole of what a second account buys.
        function closureRead(pts, ox, oy) {
            const n = pts.length;
            let sumD = 0,
                logProd = 0,
                turn = 0,
                minR = Infinity;
            for (let k = 0; k < n; k++) {
                const a = pts[k],
                    b = pts[(k + 1) % n];
                const ax = a.x - ox,
                    ay = a.y - oy,
                    bx = b.x - ox,
                    by = b.y - oy;
                const d = ax * by - bx * ay,
                    dot = ax * bx + ay * by;
                const ra = Math.hypot(ax, ay),
                    rb = Math.hypot(bx, by);
                if (ra < minR)
                    minR = ra;
                if (ra < 1e-12 || rb < 1e-12)
                    return null; // standpoint on a leaf
                sumD += d;
                logProd += Math.log(rb / ra);
                turn += Math.atan2(d, dot);
            }
            return {
                sumD,
                prod: Math.exp(logProd),
                turn,
                wind: turn / (2 * Math.PI),
                minR
            };
        }

        // The cycle arithmetic, on synthetic networks: the ground's existence condition
        // is that every cycle closes, and the split into explained and obstruction is
        // least squares on the graph Laplacian.
        function closureCycleChecks() {
            const fit = (n, edges, u) => {
                const L = [],
                    b = new Float64Array(n);
                for (let i = 0; i < n; i++)
                    L.push(new Float64Array(n));
                edges.forEach((e, k) => {
                    const i = e[0],
                        j = e[1];
                    L[i][i]++;
                    L[j][j]++;
                    L[i][j]--;
                    L[j][i]--;
                    b[i] -= u[k];
                    b[j] += u[k];
                });
                const m = n - 1,
                    A = [];
                for (let r = 0; r < m; r++) {
                    const row = new Float64Array(m + 1);
                    for (let c = 0; c < m; c++)
                        row[c] = L[r + 1][c + 1];
                    row[m] = b[r + 1];
                    A.push(row);
                }
                for (let c = 0; c < m; c++) {
                    let p = c;
                    for (let r = c + 1; r < m; r++)
                        if (Math.abs(A[r][c]) > Math.abs(A[p][c]))
                            p = r;
                    const tmp = A[c];
                    A[c] = A[p];
                    A[p] = tmp;
                    if (Math.abs(A[c][c]) < 1e-12)
                        continue;
                    for (let r = 0; r < m; r++) {
                        if (r === c)
                            continue;
                        const f = A[r][c] / A[c][c];
                        for (let x = c; x <= m; x++)
                            A[r][x] -= f * A[c][x];
                    }
                }
                const phi = new Float64Array(n);
                for (let r = 0; r < m; r++)
                    phi[r + 1] = Math.abs(A[r][r]) < 1e-12 ? 0 : A[r][m] / A[r][r];
                const resid = u.map((v, k) => v - (phi[edges[k][1]] - phi[edges[k][0]]));
                const nu = Math.hypot.apply(null, u),
                    nr = Math.hypot.apply(null, resid);
                return {
                    resid,
                    explained: nu < 1e-12 ? 1 : 1 - (nr * nr) / (nu * nu),
                    obstruction: nr
                };
            };
            const out = {
                grounded: 0,
                groundedN: 0,
                twist: 0,
                twistN: 0,
                cyclic: 0,
                cyclicN: 0
            };
            for (let n = 3; n <= 6; n++) {
                const edges = [];
                for (let i = 0; i < n; i++)
                    for (let j = i + 1; j < n; j++)
                        edges.push([i, j]);
                const idx = (a, b) => edges.findIndex(e => e[0] === Math.min(a, b) && e[1] === Math.max(a, b));
                const cyc = (u, i, j, k) => (i < j ? 1 : -1) * u[idx(i, j)] + (j < k ? 1 : -1) * u[idx(j, k)] + (k < i ? 1 : -1) * u[idx(k, i)];
                // built from a ground: every cycle must close
                const g = [];
                for (let i = 0; i < n; i++)
                    g.push(0.6 + 1.4 * Math.random());
                let u = edges.map(e => Math.log(g[e[1]] / g[e[0]]));
                out.groundedN++;
                if (Math.abs(cyc(u, 0, 1, 2)) < 1e-9 && fit(n, edges, u).obstruction < 1e-9)
                    out.grounded++;
                // a ground plus a uniform twist: the triangle must keep exactly the twist
                u = edges.map(e => Math.log(g[e[1]] / g[e[0]]) + 0.12);
                out.twistN++;
                if (Math.abs(cyc(u, 0, 1, 2) - 0.12) < 1e-9)
                    out.twist++;
                // an intransitive ring: no ground explains any of it
                u = edges.map(e => e[1] === e[0] + 1 ? Math.log(1.25) : (e[0] === 0 && e[1] === n - 1 ? -Math.log(1.25) : 0));
                out.cyclicN++;
                if (fit(n, edges, u).explained < 1e-6)
                    out.cyclic++;
            }
            return out;
        }

        function runClosureTests() {
            const rows = [];
            let total = 0;
            for (const spec of PRIMITIVES) {
                total++;
                if (typeof spec.pts !== 'function')
                    continue; // compound: excluded
                const pts = spec.pts();
                if (!pts || pts.length < 3)
                    continue;
                let cx = 0,
                    cy = 0,
                    rx = -Infinity;
                for (const p of pts) {
                    cx += p.x;
                    cy += p.y;
                }
                cx /= pts.length;
                cy /= pts.length;
                for (const p of pts)
                    rx = Math.max(rx, Math.hypot(p.x - cx, p.y - cy));
                const inside = closureRead(pts, cx, cy);
                const outside = closureRead(pts, cx + 3 * rx, cy + 3 * rx); // well clear of the contour
                if (!inside || !outside)
                    continue;
                const wIn = Math.round(inside.wind),
                    wOut = Math.round(outside.wind);
                rows.push({
                    key: spec.key || spec.name || 'shape',
                    pts,
                    prodIn: inside.prod,
                    prodOut: outside.prod,
                    windIn: inside.wind,
                    windOut: outside.wind,
                    wIn,
                    wOut,
                    areaIn: inside.sumD,
                    areaOut: outside.sumD,
                    closes: Math.abs(inside.prod - 1) < 1e-9 && Math.abs(outside.prod - 1) < 1e-9,
                    integer: Math.abs(inside.wind - wIn) < 1e-9 && Math.abs(outside.wind - wOut) < 1e-9,
                    dropped: wOut === 0 && wIn !== 0,
                    invariant: Math.abs(inside.sumD - outside.sumD) < 1e-9,
                });
            }
            return {
                rows,
                total,
                cycles: closureCycleChecks()
            };
        }

        function showClosureReport(res) {
            const {rows, total, cycles} = res;
            const e2 = x => (Math.abs(x) < 1e-12 ? '0' : Math.abs(x).toExponential(0));
            const out = labLadder({
                rows,
                name: 'closure tests',
                suffix: 'two standpoints',
                // teal: the reading closed at both standpoints, both windings integer-exact,
                // the winding fell away outside, and the area did not move. gold: closed and
                // integer, but the standpoint outside did not change the enclosure. red: the
                // reading failed to close, which nothing here should do.
                verdict: r => !r.closes ? 0 : ((r.integer && r.dropped && r.invariant) ? 2 : 1),
                caption: r => r.key + '\n'
                + 'Π ρ  1±' + e2(r.prodIn - 1) + ' in · 1±' + e2(r.prodOut - 1) + ' out'
                + (r.closes ? ' ✓' : ' ✗') + '\n'
                + 'winding ' + r.wIn + ' in · ' + r.wOut + ' out' + (r.dropped ? ' ✓' : '') + '\n'
                + 'Σ D ' + r.areaIn.toFixed(4) + (r.invariant ? '  unmoved ✓' : '  MOVED ✗'),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const nClose = drawn.filter(r => r.closes).length;
            const nInt = drawn.filter(r => r.integer).length;
            const nDrop = drawn.filter(r => r.dropped).length;
            const nInv = drawn.filter(r => r.invariant).length;
            const c = cycles;
            flashStatus('closure tests · ' + drawn.length + ' of ' + total + ' primitives read as closed sweeps from two standpoints'
            + ' — the reading closed (Π ρ = 1 to 1e−9) on ' + nClose + '/' + drawn.length + ' at both'
            + ' · winding integer-exact on ' + nInt + '/' + drawn.length
            + ' and falling to 0 outside on ' + nDrop + '/' + drawn.length
            + ' · Σ D standpoint-invariant on ' + nInv + '/' + drawn.length
            + ' — same D, two accumulations, and only one of them obliged to come home'
            + ' · cycles: grounded networks closed ' + c.grounded + '/' + c.groundedN
            + ', a uniform twist left exactly itself ' + c.twist + '/' + c.twistN
            + ', an intransitive ring explained by no ground ' + c.cyclic + '/' + c.cyclicN
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bCT = $('bClosureTests');
            if (bCT)
                bCT.addEventListener('click', () => {
                    bCT.disabled = true;
                    bCT.textContent = 'reading…';
                    setTimeout(() => {
                        try {
                            const res = runClosureTests();
                            if (!res.rows.length)
                                flashStatus('closure tests: no representable primitives');
                            else
                                showClosureReport(res);
                        } catch (e) {
                            flashStatus('closure tests failed: ' + e.message);
                        }
                        finally {
                            bCT.disabled = false;
                            bCT.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }
};
