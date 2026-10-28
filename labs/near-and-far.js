// NEAR AND FAR (?lab=nfr), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, _uncCentre, _uncResample, flashStatus, labLadder, labMed. It puts nearFarRead,
// runNearFar back on the console hook window.__lab once loaded. Loaded the first time one of its buttons is pressed,
// or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['near-and-far'] = function () {
        // ── NEAR AND FAR: A GLOWING OUTLINE READ ON ITS AXIS ─────────────────────────
        // SPN §3.2's glowing disc, s²/(1 + s²), is one case of a law every flat outline has.
        // Read from a point on the axis at distance d through the area centre, the light from an
        // evenly glowing outline, as a share of its most, is
        //
        //     f(d) = (1/2π) ∮ R(θ)² / (R(θ)² + d²) dθ,
        //
        // the disc law averaged round the outline: one reading per direction, s = R(θ)/d, as
        // opening the shapes reads them. dθ is taken signed along the outline, so an outline
        // that turns back on itself as seen from the centre is still summed rightly, provided
        // it winds once round the centre. Far off f ≈ ⟨R²⟩/d², the inverse square with the
        // area; close in 1 − f ≈ d²⟨R⁻²⟩, the harmonic reach. Flipped about the middle d½, the
        // two ends agree only if d½ = D = (⟨R²⟩/⟨R⁻²⟩)^¼, and the flip form holds everywhere only
        // for the circle, Q = ⟨R²⟩⟨R⁻²⟩ = 1. Run headless first (vh/nearfar/glow.py, 3 Oct): the
        // circle exact to 4e−14; near-round shapes to second order in Q − 1; long, thin and
        // grazing outlines set two corners. arctan appears only to measure the turn between
        // neighbouring points of the outline, the shortcut (R148).
        const NFR_M = 8000;

        function nearFarRead(P, M) {
            M = M || NFR_M;
            // area first: an outline with no area, or with its centre outside, has no axis to read on
            let A = 0;
            for (let i = 0; i < P.length; i++) {
                const p = P[i],
                    q = P[(i + 1) % P.length];
                A += p.x * q.y - q.x * p.y;
            }
            if (!(Math.abs(A) > 2e-3))
                return null;
            const c = _uncCentre(P),
                R = _uncResample(P, M);
            const r2 = new Float64Array(M),
                dth = new Float64Array(M);
            const sg = A > 0 ? 1 : -1;
            for (let k = 0; k < M; k++) {
                const j = (k + 1) % M;
                const ax = R.X[k] - c.x,
                    ay = R.Y[k] - c.y,
                    bx = R.X[j] - c.x,
                    by = R.Y[j] - c.y;
                r2[k] = 0.5 * (ax * ax + ay * ay + bx * bx + by * by);
                dth[k] = sg * Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
            }
            let wind = 0;
            for (let k = 0; k < M; k++)
                wind += dth[k];
            wind /= 2 * Math.PI;
            if (Math.abs(wind - 1) > 1e-6)
                return null;
            const f = d => {
                const d2 = d * d;
                let s = 0;
                for (let k = 0; k < M; k++)
                    s += r2[k] / (r2[k] + d2) * dth[k];
                return s / (2 * Math.PI);
            };
            // the middle, by halving in log d
            let lo = -12,
                hi = 12;
            for (let i = 0; i < 60; i++) {
                const m = (lo + hi) / 2;
                if (f(2 ** m) > 0.5)
                    lo = m;
                else
                    hi = m;
            }
            const dh = 2 ** ((lo + hi) / 2);
            // the flip about the middle, over eight octaves each way, every twentieth of an octave
            let flip = 0,
                at = 0;
            for (let i = 1; i <= 160; i++) {
                const s = 2 ** (i / 20),
                    e = Math.abs(f(dh * s) + f(dh / s) - 1);
                if (e > flip) {
                    flip = e;
                    at = i / 20;
                }
            }
            let mA = 0,
                mB = 0;
            for (let k = 0; k < M; k++) {
                const w = dth[k] / (2 * Math.PI);
                mA += w * r2[k];
                mB += w / r2[k];
            }
            const D = Math.pow(mA / mB, 0.25);
            return {
                Q: mA * mB,
                dh,
                D,
                flip,
                at,
                area: Math.sqrt(mA),
                harm: 1 / Math.sqrt(mB)
            };
        }

        function runNearFar() {
            const rows = [];
            let total = 0;
            const skipped = [];
            for (const spec of PRIMITIVES) {
                total++;
                if (typeof spec.pts !== 'function')
                    continue; // compound: excluded
                let pts;
                try {
                    pts = spec.pts();
                } catch (e) {
                    continue;
                }
                if (!pts || pts.length < 3)
                    continue;
                const r = nearFarRead(pts);
                if (!r) {
                    skipped.push(spec.key);
                    continue;
                }
                rows.push(Object.assign({
                    key: spec.key,
                    pts,
                    loopN: spec.loopN
                }, r));
            }
            return {
                rows,
                total,
                skipped
            };
        }

        function showNearFarReport(res) {
            const {rows, total, skipped} = res;
            const f3 = x => isFinite(x) ? x.toFixed(3) : '—';
            const e1 = x => x < 1e-12 ? '0' : x.toExponential(1);
            const one = r => r.flip < 1e-3 && Math.abs(Math.log(r.dh / r.D)) < Math.log(1.02);
            const out = labLadder({
                rows,
                name: 'near and far',
                suffix: 'a glowing outline, on its axis',
                verdict: r => one(r) ? 2 : (r.flip < 0.02 ? 1 : 0),
                caption: r => r.key + '  Q ' + (r.Q < 10 ? r.Q.toFixed(4) : r.Q.toFixed(1)) + '\n'
                + 'middle ' + f3(r.dh) + '  D ' + f3(r.D) + '\n'
                + 'far size ' + f3(r.area) + '  near ' + f3(r.harm) + '\n'
                + 'flip ' + e1(r.flip) + (r.flip > 1e-9 ? ' at ' + r.at.toFixed(1) + ' oct' : ''),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const n2 = drawn.filter(one).length,
                n1 = drawn.filter(r => !one(r) && r.flip < 0.02).length;
            const circ = drawn.find(r => r.key === 'circle');
            const others = drawn.filter(r => r.key !== 'circle');
            flashStatus('near and far · ' + drawn.length + ' of ' + total + ' primitives, each an evenly glowing flat outline read on its axis'
            + (circ ? ' · circle: flip ' + e1(circ.flip) + ', middle ' + f3(circ.dh) + ' = D ' + f3(circ.D) : '')
            + ' · one corner (flip under 10⁻³, middle at D within 2%) on ' + n2 + ', flip under 0.02 on ' + n1
            + ', two corners on ' + (drawn.length - n2 - n1)
            + ' · median over the other shapes: Q ' + f3(labMed(others.map(r => r.Q)))
            + ', middle over D ' + f3(labMed(others.map(r => r.dh / r.D)))
            + ', the flip worst ' + f3(labMed(others.map(r => r.at))) + ' octaves from the middle'
            + (skipped.length ? ' · left out (centre outside, or the outline crosses itself): ' + skipped.join(', ') : '')
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bNF = $('bNearFar');
            if (bNF)
                bNF.addEventListener('click', () => {
                    bNF.disabled = true;
                    bNF.textContent = 'reading…';
                    setTimeout(() => {
                        try {
                            const res = runNearFar();
                            if (!res.rows.length)
                                flashStatus('near and far: no single-outline primitives with an axis to read on');
                            else
                                showNearFarReport(res);
                        } catch (e) {
                            flashStatus('near and far failed: ' + e.message);
                        }
                        finally {
                            bNF.disabled = false;
                            bNF.textContent = 'read near and far';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { nearFarRead, runNearFar });
};
