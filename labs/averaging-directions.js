// AVERAGING DIRECTIONS (?lab=avd), written 29 Oct 2026 from the essays (Tom: "is there any labs we should do from our
// essays?", then "1,2,3"): essay 3's "to average, average the angle, which is bounded" put to the library.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's. From the editor it uses: $, PRIMITIVES, flashStatus, hrtSampleRadial, labLadder, makeRng. It declares
// nothing the editor reads. Loaded the first time its button is pressed, or ?lab= asks for it.
(window.TVF_LABS = window.TVF_LABS || {})['averaging-directions'] = function () {
        // ── averaging directions ─────────────────────────────────────────────
        // A reading taken from a standpoint off the line, at height γ, is a slope m + γ·tan(u),
        // u uniform on the half turn: the Cauchy at m + iγ. The essay's three summaries are the
        // median of the slopes, the mean of the angles and (the circular mean used for axial
        // data) half the mean of the doubled angle. What each returns is known in closed form,
        // and the predictions in the drawer were written from it before this ran:
        //
        //   median        m                                     (the address)
        //   mean angle    atan(m / (1 + γ))                      E[log(1 + is)] = log(1 + γ + im): log(1 + is) is
        //                                                        analytic in the lower half-plane, so its Cauchy
        //                                                        expectation is its value at m − iγ, and atan s is
        //                                                        its imaginary part
        //   doubled       ½·[atan2(m, 1 − γ) + atan2(m, 1 + γ)]  E[(1 + is)/(1 − is)] = (1 + iz)/(1 − iz), z = m + iγ,
        //                                                        the ratio being analytic in the upper half-plane
        //
        // So the mean angle is pulled toward home (toward 0) and the doubled one toward the
        // horizon, and only the median reads the direction. A cell fails when any summary sits
        // more than four standard errors off its formula.
        const AVD_N = 20000,
            AVD_GAMMAS = [0.05, 0.2, 0.5, 1],
            AVD_SE = 4;

        function avdOne(m, gamma, seed) {
            const rnd = makeRng(seed);
            const s = new Float64Array(AVD_N),
                a = new Float64Array(AVD_N);
            let sa = 0,
                sc = 0,
                ss = 0;
            for (let i = 0; i < AVD_N; i++) {
                // u strictly inside the half turn: makeRng can return 0 and 1 exactly
                const u = (rnd() * (AVD_N - 1) + 0.5) / AVD_N;
                s[i] = m + gamma * Math.tan(Math.PI * (u - 0.5));
                a[i] = Math.atan(s[i]);
                sa += a[i];
                sc += Math.cos(2 * a[i]);
                ss += Math.sin(2 * a[i]);
            }
            const sorted = Array.from(s).sort((x, y) => x - y);
            const med = 0.5 * (sorted[(AVD_N >> 1) - 1] + sorted[AVD_N >> 1]);
            const meanA = sa / AVD_N;
            let va = 0;
            for (let i = 0; i < AVD_N; i++)
                va += (a[i] - meanA) ** 2;
            const seA = Math.sqrt(va / (AVD_N - 1) / AVD_N);
            const C = sc / AVD_N,
                S = ss / AVD_N,
                R = Math.hypot(C, S);
            const dbl = 0.5 * Math.atan2(S, C);
            // the doubled angle's standard error by the delta method on the mean resultant
            let vd = 0;
            for (let i = 0; i < AVD_N; i++)
                vd += Math.sin(2 * (a[i] - dbl)) ** 2;
            const seD = Math.sqrt(vd / AVD_N / AVD_N) / Math.max(R, 1e-9) / 2;
            // the median's standard error for a Cauchy of scale γ: πγ / (2√N)
            const seM = Math.PI * gamma / (2 * Math.sqrt(AVD_N));
            return {
                med,
                meanA,
                seA,
                dbl,
                seD,
                seM
            };
        }

        // the difference of two axial angles, folded into (−π/2, π/2]
        const avdDiff = (x, y) => {
            let d = x - y;
            while (d > Math.PI / 2)
                d -= Math.PI;
            while (d <= -Math.PI / 2)
                d += Math.PI;
            return d;
        };

        function runAvgDirections() {
            const rows = [];
            let i = 0;
            for (const spec of PRIMITIVES) {
                if (typeof spec.pts !== 'function')
                    continue;
                let pts;
                try {
                    pts = spec.pts();
                } catch (e) {
                    continue;
                }
                if (!pts || pts.length < 3)
                    continue;
                const rs = hrtSampleRadial(pts, 256);
                if (!rs)
                    continue;
                // the direction to the farthest point, an axial direction: its slope is m
                let kMax = 0;
                for (let k = 1; k < rs.length; k++)
                    if (rs[k] > rs[kMax])
                        kMax = k;
                const phi = avdDiff((kMax + 0.5) * 2 * Math.PI / rs.length + 1e-4, 0);
                if (Math.abs(Math.abs(phi) - Math.PI / 2) < 0.02)
                    continue; // straight up: no finite slope to name
                const m = Math.tan(phi),
                    gamma = AVD_GAMMAS[i % AVD_GAMMAS.length];
                const r = avdOne(m, gamma, 20261029 + 7919 * i);
                const pMean = Math.atan(m / (1 + gamma));
                const pDbl = 0.5 * (Math.atan2(m, 1 - gamma) + Math.atan2(m, 1 + gamma));
                const zMed = Math.abs(r.med - m) / r.seM,
                    zMean = Math.abs(avdDiff(r.meanA, pMean)) / r.seA,
                    zDbl = Math.abs(avdDiff(r.dbl, pDbl)) / r.seD,
                    zBias = Math.abs(avdDiff(r.meanA, phi)) / r.seA;
                rows.push({
                    key: spec.key,
                    pts,
                    m,
                    phi,
                    gamma,
                    ...r,
                    pMean,
                    pDbl,
                    zMed,
                    zMean,
                    zDbl,
                    zBias,
                    ok: zMed <= AVD_SE && zMean <= AVD_SE && zDbl <= AVD_SE
                });
                i++;
                if (rows.length >= 48)
                    break;
            }
            return rows;
        }

        function showAvgDirections(rows) {
            const deg = x => (x * 180 / Math.PI).toFixed(1) + '°';
            const out = labLadder({
                rows,
                name: 'averaging directions',
                suffix: 'median, mean angle and doubled angle against their formulas',
                verdict: r => r.ok ? 2 : 0,
                caption: r => r.key + ' · γ ' + r.gamma + '\n'
                + 'true ' + deg(r.phi) + ' · median ' + deg(Math.atan(r.med)) + '\n'
                + 'mean angle ' + deg(r.meanA) + ' (pred ' + deg(r.pMean) + ')\n'
                + 'doubled ' + deg(r.dbl) + ' (pred ' + deg(r.pDbl) + ')'
            });
            if (!out)
                return;
            const n = rows.length,
                c = f => rows.filter(f).length;
            const biased = c(r => r.zBias > 2 * AVD_SE);
            const worstBias = rows.reduce((w, r) => Math.max(w, Math.abs(avdDiff(r.meanA, r.phi))), 0);
            flashStatus('averaging directions · ' + n + ' figures, each direction read ' + AVD_N.toLocaleString()
            + ' times from a height γ · the median of the slopes returned the direction on ' + c(r => r.zMed <= AVD_SE)
            + '/' + n + ' · the mean of the angles returned atan(m/(1+γ)) on ' + c(r => r.zMean <= AVD_SE) + '/' + n
            + ' and missed the direction itself on ' + biased + '/' + n + ', by up to ' + deg(worstBias)
            + ' · half the mean of the doubled angle returned its own formula on ' + c(r => r.zDbl <= AVD_SE) + '/' + n
            + ' · ' + (c(r => r.ok) === n ? 'NO PREDICTION KILLED: the angle’s mean is the mean of the angle chart,'
            + ' pulled toward home by the height, and not the direction; only the median reads the address'
            : (n - c(r => r.ok)) + ' CELLS KILLED A PREDICTION')
            + (out.ms ? ' · ' + out.ms + ' ms' : ''));
        }

        {
            const b = $('bAvgDirections');
            if (b)
                b.addEventListener('click', () => {
                    b.disabled = true;
                    b.textContent = 'reading…';
                    setTimeout(() => {
                        try {
                            const rows = runAvgDirections();
                            if (!rows.length)
                                flashStatus('averaging directions: no representable figure');
                            else
                                showAvgDirections(rows);
                        } catch (e) {
                            flashStatus('averaging directions failed: ' + e.message);
                        } finally {
                            b.disabled = false;
                            b.textContent = 'average the readings';
                        }
                    }, 0);
                });
        }
};
