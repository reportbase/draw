// THE SWEEP, READ THREE WAYS (?lab=swt), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, OS_SAT, OS_SIGMA, flashStatus, labComb, labLadder, makeRng, osRibbon. It declares
// nothing the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['sweep-read-three-ways'] = function () {
        function swLap(N, jit, rnd) {
            const out = [];
            for (let k = 0; k < N; k++) {
                let s = (k + 0.5) / N + (jit ? (rnd() - 0.5) * jit / N : 0);
                s = Math.min(Math.max(s, 1e-9), 1 - 1e-9);
                out.push(Math.tan(-Math.PI / 2 + Math.PI * s));
            }
            return out;
        }

        function swRung(v) {
            if (!v)
                return -OS_SAT;
            return Math.max(-OS_SAT, Math.min(OS_SAT, Math.round(Math.log(Math.abs(v)) / OS_SIGMA)));
        }

        function runSweepThree() {
            const N = 1500;
            const rnd = makeRng(424242);
            // per-arrival servo, three laps, traced
            let near = 0,
                U = 30,
                L = -30;
            const traceA = [];
            const flat3 = swLap(N, 0, rnd).concat(swLap(N, 0, rnd), swLap(N, 0, rnd));
            flat3.forEach((v, i) => {
                const st = OS_SIGMA * (U - L) / 2;
                near += st * (v > near ? 1 : (v < near ? -1 : 0));
                if (v > near)
                    U += st * (v > U ? 1 : -1);
                if (v < near)
                    L += st * (v > L ? 1 : -1);
                if (i % 8 === 0)
                    traceA.push(Math.max(-40, Math.min(40, near)));
            });
            const finalA = {
                near,
                unit: (U - L) / 2
            };
            // per-lap servo, thirty laps, traced (reference rung of |reading|)
            let r = Math.log(30) / OS_SIGMA,
                step = 16,
                last = 0;
            const traceL = [];
            for (let lap = 0; lap < 30; lap++) {
                const lp = swLap(N, 1, rnd);
                let above = 0,
                    below = 0;
                for (const v of lp) {
                    const rr = swRung(v);
                    if (rr > r)
                        above++;
                    else if (rr < r)
                        below++;
                }
                const d = above > below ? 1 : (below > above ? -1 : 0);
                if (d && last && d !== last)
                    step = Math.max(0.5, step / 2);
                last = d || last;
                r += step * d;
                for (let t = 0; t < 8; t++)
                    traceL.push(r);
            }
            // the lap rule on the continuous stream: count home->horizon, hold at half
            const stream = swLap(N, 0, rnd).concat(swLap(N, 0, rnd));
            let C = null,
                counting = false,
                c = 0,
                k = null,
                held = null,
                homeAt = -1,
                horAt = -1,
                heldAt = -1;
            let prev = null;
            const rungCurve = [];
            stream.forEach((v, i) => {
                const sg = v > 0 ? 1 : -1,
                    rr = swRung(v);
                if (i < N)
                    rungCurve.push(sg * (rr + OS_SAT) / (2 * OS_SAT));
                if (prev) {
                    const home = prev.sg < 0 && sg > 0 && prev.rr < 0 && rr < 0;
                    const horizon = prev.sg > 0 && sg < 0 && prev.rr > 30 && rr > 30;
                    if (C === null) {
                        if (home) {
                            counting = true;
                            c = 0;
                            if (homeAt < 0)
                                homeAt = i;
                        }
                        else if (horizon && counting) {
                            C = c;
                            horAt = i;
                        }
                        else if (counting)
                            c++;
                    } else if (held === null) {
                        if (home && k === null)
                            k = 0;
                        else if (k !== null) {
                            k++;
                            if (k === Math.max(1, C >> 1)) {
                                held = rr;
                                heldAt = i;
                            }
                        }
                    }
                }
                prev = {
                    sg,
                    rr
                };
            });
            // twelve trials of each rule's final placement, in rungs of |value|
            const endsA = [],
                endsL = [],
                endsC = [];
            for (let t = 0; t < 12; t++) {
                let nr = 0,
                    Uu = 30,
                    Ll = -30;
                const fl = swLap(N, 1, rnd).concat(swLap(N, 1, rnd), swLap(N, 1, rnd));
                for (const v of fl) {
                    const st = OS_SIGMA * (Uu - Ll) / 2;
                    nr += st * (v > nr ? 1 : (v < nr ? -1 : 0));
                    if (v > nr)
                        Uu += st * (v > Uu ? 1 : -1);
                    if (v < nr)
                        Ll += st * (v > Ll ? 1 : -1);
                }
                endsA.push(Math.max(-40, Math.min(40, swRung((Uu - Ll) / 2))));
                let r2 = Math.log(30) / OS_SIGMA,
                    sp = 16,
                    la = 0;
                for (let lap = 0; lap < 30; lap++) {
                    const lp = swLap(N, 1, rnd);
                    let ab = 0,
                        be = 0;
                    for (const v of lp) {
                        const rr = swRung(v);
                        if (rr > r2)
                            ab++;
                        else if (rr < r2)
                            be++;
                    }
                    const d = ab > be ? 1 : (be > ab ? -1 : 0);
                    if (d && la && d !== la)
                        sp = Math.max(0.5, sp / 2);
                    la = d || la;
                    r2 += sp * d;
                }
                endsL.push(Math.max(-40, Math.min(40, r2)));
                // lap rule
                const st2 = swLap(N, 1, rnd).concat(swLap(N, 1, rnd));
                let C2 = null,
                    cn = false,
                    cc = 0,
                    kk = null,
                    hd = null,
                    pv = null;
                for (const v of st2) {
                    const sg = v > 0 ? 1 : -1,
                        rr = swRung(v);
                    if (pv) {
                        const hm = pv.sg < 0 && sg > 0 && pv.rr < 0 && rr < 0;
                        const hz = pv.sg > 0 && sg < 0 && pv.rr > 30 && rr > 30;
                        if (C2 === null) {
                            if (hm) {
                                cn = true;
                                cc = 0;
                            } else if (hz && cn)
                                C2 = cc;
                            else if (cn)
                                cc++;
                        }
                        else if (hd === null) {
                            if (hm && kk === null)
                                kk = 0;
                            else if (kk !== null) {
                                kk++;
                                if (kk === Math.max(1, C2 >> 1))
                                    hd = rr;
                            }
                        }
                    }
                    pv = {
                        sg,
                        rr
                    };
                }
                endsC.push(hd === null ? -40 : hd);
            }
            return {
                traceA,
                finalA,
                traceL,
                rungCurve,
                homeAt,
                horAt,
                heldAt,
                C,
                held,
                endsA,
                endsL,
                endsC
            };
        }

        function showSweepThree(res) {
            const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
            const rows = [
            {
                key: 'per arrival',
                pts: osRibbon(res.traceA, -40, 40),
                ok: 0,
                cap: 'the corpus servo on the ORDERED stream, three laps\n'
                + 'the reference is order\u2019s hostage — it ends at ' + res.finalA.near.toFixed(1)
                + '\nwith its manufactured unit at ' + res.finalA.unit.toFixed(1)
                + ' — converged, wrongly, stably'
            },
            {
                key: 'per lap',
                pts: osRibbon(res.traceL, -40, 260),
                ok: 2,
                cap: 'the same servo, updated once per LAP, thirty laps\n'
                + 'a whole lap is a fair sample however it is ordered\n'
                + 'the staircase lands at ' + res.traceL[res.traceL.length - 1].toFixed(1) + ' rungs (corner = 0)'
            },
            {
                key: 'the lap rule',
                pts: osRibbon(res.rungCurve, -1, 1),
                ok: 2,
                cap: 'one lap of the stream itself, as signed rungs\n'
                + 'home and the horizon announce themselves; count between,\n'
                + 'hold at half: C = ' + res.C + ', held at rung ' + res.held + ' — placed'
            },
            {
                key: 'per arrival · 12 trials',
                pts: labComb(res.endsA, -40, 40),
                ok: 0,
                cap: 'where the per-arrival rule\u2019s corner estimate ends (rungs)\n'
                + 'median ' + med(res.endsA).toFixed(0) + ' — never the corner'
            },
            {
                key: 'per lap · 12 trials',
                pts: labComb(res.endsL, -40, 40),
                ok: 2,
                cap: 'where the per-lap servo ends (rungs) — median '
                + med(res.endsL).toFixed(1) + '\nplaced, at the price of thirty laps'
            },
            {
                key: 'the lap rule · 12 trials',
                pts: labComb(res.endsC, -40, 40),
                ok: 2,
                cap: 'where the lap rule\u2019s held mark lands (rungs) — median '
                + med(res.endsC).toFixed(0) + '\nplaced, in two laps, nothing shuffled anywhere'
            },
            ];
            const out = labLadder({
                rows,
                name: 'the sweep, read three ways',
                suffix: 'tracks · aggregates · counts',
                verdict: r => r.ok,
                caption: r => r.key + '\n' + r.cap,
            });
            if (!out)
                return;
            flashStatus('the sweep, read three ways · one ordered even stream, three rules'
            + ' — PER ARRIVAL the servo converges to a stable wrong equilibrium (reference '
            + res.finalA.near.toFixed(1) + ', unit ' + res.finalA.unit.toFixed(1)
            + '): placement is a whole-lap possession and a rule that forgets cannot hold one'
            + ' · PER LAP the same servo places (median ' + (res.endsL.reduce((a, b) => a + b, 0) / res.endsL.length).toFixed(1)
            + ' rungs) because a lap consumed whole is order-blind'
            + ' · THE LAP RULE places in TWO laps: home and the horizon are free, register-native'
            + ' events, the count between them is the record\u2019s own operation, and the arrival at'
            + ' half the count is the corner (held at rung ' + res.held + ')'
            + ' — disorder was never the price; the price is one lap of counting between two marks'
            + ' the reader already owns');
        }

        {
            const bS3 = $('bSweepThree');
            if (bS3)
                bS3.addEventListener('click', () => {
                    bS3.disabled = true;
                    bS3.textContent = 'sweeping…';
                    setTimeout(() => {
                        try {
                            showSweepThree(runSweepThree());
                        }
                        catch (e) {
                            flashStatus('the sweep, read three ways failed: ' + e.message);
                        }
                        finally {
                            bS3.disabled = false;
                            bS3.textContent = 'lay it out';
                        }
                    }, 0);
                });
        }
};
