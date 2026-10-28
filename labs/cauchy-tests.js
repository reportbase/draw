// CAUCHY TESTS (?lab=cau), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, H_STEP, flashStatus, hrtLens, hrtSampleRadial, labLadder, labMed. It puts
// runCauchyTests back on the console hook window.__lab once loaded. Loaded the first time one of its buttons is
// pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['cauchy-tests'] = function () {
        function runCauchyTests() {
            const L = 512,
                HALF = 15;
            const rows = [];
            let total = 0;
            for (const spec of PRIMITIVES) {
                total++;
                if (typeof spec.pts !== 'function')
                    continue; // compound: excluded
                const rs = hrtSampleRadial(spec.pts(), L);
                if (!rs)
                    continue; // not star-shaped
                const sorted = Array.from(rs).sort((a, b) => a - b);
                const h0 = sorted[sorted.length >> 1]; // the median: order-native
                // the floor sweep, [1]'s rule exactly as the base-rule tests run it
                let h = rs[0];
                let inBand = 0,
                    maxViewIB = 0,
                    rhoAt = 0,
                    maxLn = 0,
                    maxViewAll = 0;
                let tail = 0,
                    disc = 0;
                for (let k = 0; k < L; k++) {
                    let l = Math.round(Math.log(rs[k] / h) / H_STEP);
                    if (l > HALF)
                        l = HALF;
                    else if (l < -HALF)
                        l = -HALF;
                    h *= Math.exp(l * H_STEP);
                    const lnE = Math.abs(Math.log(h / rs[k]));
                    const vE = Math.abs(hrtLens(h, h0) - hrtLens(rs[k], h0));
                    if (lnE > maxLn)
                        maxLn = lnE;
                    if (vE > maxViewAll)
                        maxViewAll = vE;
                    if (lnE <= H_STEP / 2 + 1e-12) {
                        inBand++;
                        if (vE > maxViewIB) {
                            maxViewIB = vE;
                            rhoAt = rs[k] / h0;
                        }
                    }
                    const rho = rs[k] / h0;
                    if (rho > 1) {
                        tail++;
                        disc += 1 / (1 + rho * rho);
                    }
                }
                const bound = h0 * H_STEP / Math.PI; // (2h0/pi)·(sigma/2)
                // `pts` and `loopN` ride along so the sheet can DRAW the specimen it just measured —
                // labLadder asks for exactly those two, as the base-rule and recovery rows do.
                rows.push({
                    key: spec.key,
                    pts: spec.pts(),
                    loopN: spec.loopN,
                    h0,
                    inBand: inBand / L,
                    maxViewIB,
                    bound,
                    ratio: maxViewIB / bound,
                    rhoAt,
                    lipsOK: maxViewAll <= (2 * h0 / Math.PI) * maxLn + 1e-12,
                    tailFrac: tail / L,
                    disc: tail ? disc / tail : 0
                });
            }
            return {
                rows,
                total,
                L,
                step: H_STEP
            };
        }

        // A SHEET, NOT A TABLE — the last report to make the move, and the same argument as the
        // base-rule and recovery tests before it. The claim is per-shape (does the register's
        // uniform log cell come out as a BOUNDED view-space error under this shape's own lens?)
        // and nine columns of five-decimal numbers ask you to find that claim by scanning. Drawn
        // as a ladder the verdict arrives in the CONTOUR'S COLOUR before you read a number:
        //
        //   teal   both claims hold — the conjugacy bound h₀σ/π respected on the in-band
        //          samples, AND the global Lipschitz 2h₀/π respected on all of them
        //   gold   the bound holds but the slew broke Lipschitz somewhere off-band
        //   red    the bound itself failed: this shape's lens does not absorb the register
        //
        // Four lines: the shape's own unit, how much of it is in band and where the peak sat,
        // the error against the bound it must come under, and the far tail with the discount the
        // lens grants it. The aggregates go to the status line.
        //
        // It replaces the page in one history frame — one undo brings your work back — and with
        // it the report scrim has no callers left at all.
        function showCauchyReport(res) {
            const {rows, total, step} = res;
            const f3 = x => isFinite(x) ? x.toFixed(3) : '—';
            const out = labLadder({
                rows,
                name: 'cauchy tests',
                suffix: 'σ=' + step.toFixed(4),
                verdict: r => !(r.ratio <= 1 + 1e-9) ? 0 : (r.lipsOK ? 2 : 1),
                caption: r => r.key + '\n'
                + 'h₀ ' + f3(r.h0) + '  in band ' + (100 * r.inBand).toFixed(0) + '%  ρ ' + f3(r.rhoAt) + '\n'
                + 'err ' + r.maxViewIB.toFixed(5) + '/' + r.bound.toFixed(5) + ' = ' + f3(r.ratio)
                + (r.ratio <= 1 + 1e-9 ? ' ✓' : ' ✗') + '\n'
                + 'far ' + (100 * r.tailFrac).toFixed(0) + '%  discount ' + f3(r.disc),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const okB = drawn.filter(r => r.ratio <= 1 + 1e-9).length;
            const okL = drawn.filter(r => r.lipsOK).length;
            const nearCorner = drawn.filter(r => r.rhoAt > 0.5 && r.rhoAt < 2).length;
            flashStatus('cauchy tests · ' + drawn.length + ' of ' + total + ' primitives read radially by the floor rule'
            + ' · lens v → 2h₀(2/π)atan(v/h₀), σ=' + step.toFixed(4)
            + ' — conjugacy bound h₀σ/π held on ' + okB + '/' + drawn.length
            + ' · global Lipschitz 2h₀/π on ' + okL + '/' + drawn.length
            + ' · in-band peak inside the corner\u2019s octave (½ < ρ < 2) on ' + nearCorner + '/' + drawn.length
            + ' — the register spends its view resolution at its own balance'
            + ' · median far tail ' + (100 * labMed(drawn.map(r => r.tailFrac))).toFixed(1) + '%'
            + ', discount ' + labMed(drawn.map(r => r.disc)).toFixed(3)
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bC = $('bCauchyTests');
            if (bC)
                bC.addEventListener('click', () => {
                    bC.disabled = true;
                    bC.textContent = 'running…';
                    setTimeout(() => {
                        try {
                            const res = runCauchyTests();
                            if (!res.rows.length)
                                flashStatus('cauchy tests: no representable primitives');
                            else
                                showCauchyReport(res);
                        } catch (e) {
                            flashStatus('cauchy tests failed: ' + e.message);
                        }
                        finally {
                            bC.disabled = false;
                            bC.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { runCauchyTests });
};
