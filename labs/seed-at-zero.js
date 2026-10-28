// THE SEED AT ZERO (?lab=sdz), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately
// be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labComb, labLadder, makeRng, tree. It declares nothing the editor reads.
// Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['seed-at-zero'] = function () {
        // ── THE SEED AT ZERO ─────────────────────────────────────────────────────────
        // One question behind the ring, the seam, and the world: can this set of seeds
        // be driven to zero at once? Below balance any testimony fits; the wall stands
        // at the first surplus statement; and one meter serves every instance.
        function szRingRms(u, edges, n) {
            // least squares of u - A phi with phi_0 pinned: normal equations, Gaussian
            const m = n - 1;
            const AtA = [],
                Atu = new Array(m).fill(0);
            for (let i = 0; i < m; i++)
                AtA.push(new Array(m).fill(0));
            const row = new Array(m);
            u.forEach((uv, e) => {
                row.fill(0);
                const [i, j] = edges[e];
                if (j > 0)
                    row[j - 1] += 1;
                if (i > 0)
                    row[i - 1] -= 1;
                for (let a = 0; a < m; a++) {
                    if (!row[a])
                        continue;
                    Atu[a] += row[a] * uv;
                    for (let b = 0; b < m; b++)
                        if (row[b])
                            AtA[a][b] += row[a] * row[b];
                }
            });
            // solve AtA phi = Atu
            const A2 = AtA.map(r2 => r2.slice()),
                y = Atu.slice();
            for (let c = 0; c < m; c++) {
                let p = c;
                for (let r2 = c + 1; r2 < m; r2++)
                    if (Math.abs(A2[r2][c]) > Math.abs(A2[p][c]))
                        p = r2;
                [A2[c], A2[p]] = [A2[p], A2[c]];
                [y[c], y[p]] = [y[p], y[c]];
                const d = A2[c][c] || 1e-12;
                for (let r2 = c + 1; r2 < m; r2++) {
                    const f = A2[r2][c] / d;
                    for (let k2 = c; k2 < m; k2++)
                        A2[r2][k2] -= f * A2[c][k2];
                    y[r2] -= f * y[c];
                }
            }
            const phi = new Array(m).fill(0);
            for (let c = m - 1; c >= 0; c--) {
                let s2 = y[c];
                for (let k2 = c + 1; k2 < m; k2++)
                    s2 -= A2[c][k2] * phi[k2];
                phi[c] = s2 / (A2[c][c] || 1e-12);
            }
            let ss = 0;
            u.forEach((uv, e) => {
                const [i, j] = edges[e];
                const fit = (j > 0 ? phi[j - 1] : 0) - (i > 0 ? phi[i - 1] : 0);
                ss += (uv - fit) * (uv - fit);
            });
            return Math.sqrt(ss / u.length);
        }

        function szSeamRms(X, Y) {
            // rows of the join's seed statements; smallest singular value of the design
            // via Jacobi on the 9x9 normal matrix; below nine rows a join always exists
            const rows = [];
            for (let i = 0; i < X.length; i++) {
                const xh = [X[i][0], X[i][1], 1],
                    yh = [Y[i][0], Y[i][1], 1];
                const r1 = [0, 0, 0, -yh[2] * xh[0], -yh[2] * xh[1], -yh[2] * xh[2],
                yh[1] * xh[0], yh[1] * xh[1], yh[1] * xh[2]];
                const r2 = [yh[2] * xh[0], yh[2] * xh[1], yh[2] * xh[2], 0, 0, 0,
                -yh[0] * xh[0], -yh[0] * xh[1], -yh[0] * xh[2]];
                for (const r of [r1, r2]) {
                    const nn = Math.sqrt(r.reduce((a, b) => a + b * b, 0)) || 1;
                    rows.push(r.map(x => x / nn));
                }
            }
            if (rows.length < 9)
                return 0;
            const A = [];
            for (let i = 0; i < 9; i++) {
                A.push(new Array(9).fill(0));
            }
            for (const r of rows)
                for (let i = 0; i < 9; i++)
                    for (let j = 0; j < 9; j++)
                        A[i][j] += r[i] * r[j];
            // Jacobi eigenvalues of the symmetric 9x9
            for (let sweep = 0; sweep < 40; sweep++) {
                let off = 0;
                for (let p = 0; p < 8; p++)
                    for (let q = p + 1; q < 9; q++)
                        off += A[p][q] * A[p][q];
                if (off < 1e-30)
                    break;
                for (let p = 0; p < 8; p++)
                    for (let q = p + 1; q < 9; q++) {
                        if (Math.abs(A[p][q]) < 1e-18)
                            continue;
                        const th = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]);
                        const cs = Math.cos(th),
                            sn = Math.sin(th);
                        for (let k = 0; k < 9; k++) {
                            const ap = A[p][k],
                                aq = A[q][k];
                            A[p][k] = cs * ap - sn * aq;
                            A[q][k] = sn * ap + cs * aq;
                        }
                        for (let k = 0; k < 9; k++) {
                            const ap = A[k][p],
                                aq = A[k][q];
                            A[k][p] = cs * ap - sn * aq;
                            A[k][q] = sn * ap + cs * aq;
                        }
                    }
            }
            let lmin = Infinity;
            for (let i = 0; i < 9; i++)
                lmin = Math.min(lmin, A[i][i]);
            return Math.sqrt(Math.max(0, lmin) / rows.length);
        }

        function runSeedZero() {
            const rnd = makeRng(777777);
            const gauss = () => {
                let u = 0,
                    v = 0;
                while (!u)
                    u = rnd();
                while (!v)
                    v = rnd();
                return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
            };
            const tree = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]];
            const cyc = tree.concat([[5, 0]]);
            const comp = [];
            for (let i = 0; i < 6; i++)
                for (let j = i + 1; j < 6; j++)
                    comp.push([i, j]);
            const draw = (edges, consistent) => {
                if (!consistent)
                    return edges.map(() => gauss());
                const phi = [0];
                for (let i = 1; i < 6; i++)
                    phi.push(gauss());
                return edges.map(([i, j]) => phi[j] - phi[i]);
            };
            const many = (edges, consistent, k) => {
                const o = [];
                for (let t = 0; t < k; t++)
                    o.push(szRingRms(draw(edges, consistent), edges, 6));
                return o;
            };
            const seamMany = (N, consistent, k) => {
                const o = [];
                for (let t = 0; t < k; t++) {
                    const X = [];
                    for (let i = 0; i < N; i++)
                        X.push([gauss(), gauss()]);
                    let Y;
                    if (consistent) {
                        const H = [];
                        for (let i = 0; i < 9; i++)
                            H.push((i % 4 === 0 ? 1 : 0) + 0.3 * gauss());
                        Y = X.map(x => {
                            const w = [H[0] * x[0] + H[1] * x[1] + H[2],
                            H[3] * x[0] + H[4] * x[1] + H[5],
                            H[6] * x[0] + H[7] * x[1] + H[8]];
                            return [w[0] / w[2], w[1] / w[2]];
                        });
                    } else {
                        Y = [];
                        for (let i = 0; i < N; i++)
                            Y.push([gauss(), gauss()]);
                    }
                    o.push(szSeamRms(X, Y));
                }
                return o;
            };
            // the width law, in the ring's two forcing graphs (exact instance)
            const slope = (edges, k) => {
                const s2 = [];
                for (let t = 0; t < k; t++) {
                    const eps = 1e-3,
                        u = draw(edges, true).map(x => x + eps * gauss());
                    s2.push(szRingRms(u, edges, 6) / eps);
                }
                return Math.sqrt(s2.reduce((a, b) => a + b * b, 0) / s2.length);
            };
            return {
                treeR: many(tree, false, 12),
                cycR: many(cyc, false, 12),
                cycC: many(cyc, true, 12),
                compR: many(comp, false, 12),
                compC: many(comp, true, 12),
                seam4: seamMany(4, false, 12),
                seam5R: seamMany(5, false, 12),
                seam5C: seamMany(5, true, 12),
                slopeCyc: slope(cyc, 40),
                slopeComp: slope(comp, 40),
            };
        }

        function showSeedZero(res) {
            const lg = x => Math.max(-17, Math.log10(Math.max(1e-17, x)));
            const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
            const rows = [
            {
                key: 'the ring · a tree',
                ok: 2,
                pts: labComb(res.treeR.map(lg), -17, 1),
                cap: '5 statements against 5 moduli — excess 0\n'
                + 'twelve RANDOM readings, residual ' + med(res.treeR).toExponential(0)
                + '\na tree witnesses anything: it cannot audit'
            },
            {
                key: 'the ring · one cycle',
                ok: 2,
                pts: labComb(res.cycR.map(lg).concat(res.cycC.map(lg)), -17, 1),
                cap: 'the first surplus statement is the wall\n'
                + 'random ' + med(res.cycR).toExponential(0) + ' vs consistent '
                + med(res.cycC).toExponential(0) + '\ntwo clusters, nothing between'
            },
            {
                key: 'the ring · complete',
                ok: 2,
                pts: labComb(res.compR.map(lg).concat(res.compC.map(lg)), -17, 1),
                cap: 'excess 10 — the refusal grows with the surplus\n'
                + 'random ' + med(res.compR).toExponential(0) + ' vs consistent '
                + med(res.compC).toExponential(0)
            },
            {
                key: 'the seam · four shared',
                ok: 2,
                pts: labComb(res.seam4.map(lg), -17, 1),
                cap: '8 statements against 8 moduli — excess 0\n'
                + 'twelve RANDOM pairings all join exactly (residual 0)\n'
                + 'four pins the seam; four cannot check it'
            },
            {
                key: 'the seam · five shared',
                ok: 2,
                pts: labComb(res.seam5R.map(lg).concat(res.seam5C.map(lg)), -17, 1),
                cap: 'THE SEAM\u2019S FIFTH ARRANGEMENT catches the first lie\n'
                + 'random ' + med(res.seam5R).toExponential(0) + ' vs consistent '
                + med(res.seam5C).toExponential(0)
            },
            {
                key: 'the width law',
                ok: 2,
                pts: labComb([res.slopeCyc, Math.sqrt(1 / 6), res.slopeComp, Math.sqrt(10 / 15)], 0, 1),
                cap: 'a lie\u2019s visible share = \u221a(excess/statements)\n'
                + 'measured ' + res.slopeCyc.toFixed(2) + ' & ' + res.slopeComp.toFixed(2)
                + ' against \u221a\u2159 = 0.41 & \u221a\u2154 = 0.82\neach measured tooth beside its predicted one'
            },
            ];
            const out = labLadder({
                rows,
                name: 'the seed at zero',
                suffix: 'witnesses \u00b7 walls \u00b7 one meter',
                verdict: r => r.ok,
                caption: r => r.key + '\n' + r.cap,
            });
            if (!out)
                return;
            flashStatus('the seed at zero · one question in three costumes: can these seeds be driven'
            + ' to zero at once — THE RING: a tree (excess 0) fits twelve random reading-sets to '
            + med(res.treeR).toExponential(0) + ', one added cycle walls random at '
            + med(res.cycR).toExponential(0) + ' while consistent readings fit to '
            + med(res.cycC).toExponential(0)
            + ' · THE SEAM: four shared arrangements join ANY random pairing exactly, and the fifth'
            + ' is the first that can catch a lie (' + med(res.seam5R).toExponential(0) + ' vs '
            + med(res.seam5C).toExponential(0) + ')'
            + ' · testimony begins where seed statements outnumber the moduli they are statements'
            + ' about — the tree that cannot audit, the four that pin but cannot check, and the'
            + ' quintuple no crowd convicts are ONE FACT'
            + ' · and ONE METER serves every instance: the visible share of a small lie measured '
            + res.slopeCyc.toFixed(2) + ' and ' + res.slopeComp.toFixed(2)
            + ' against a predicted 0.41 and 0.82 \u2014 \u221a(excess/statements), the projection theorem');
        }

        {
            const bSZ = $('bSeedZero');
            if (bSZ)
                bSZ.addEventListener('click', () => {
                    bSZ.disabled = true;
                    bSZ.textContent = 'counting…';
                    setTimeout(() => {
                        try {
                            showSeedZero(runSeedZero());
                        }
                        catch (e) {
                            flashStatus('the seed at zero failed: ' + e.message);
                        }
                        finally {
                            bSZ.disabled = false;
                            bSZ.textContent = 'lay it out';
                        }
                    }, 0);
                });
        }
};
