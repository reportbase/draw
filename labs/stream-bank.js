// THE STREAM BANK (?lab=sbk), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately
// be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, OS_SAT, OS_SIGMA, flashStatus, labLadder, makeRng, osRibbon, osScreen, pick. It
// declares nothing the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['stream-bank'] = function () {
        // ── THE STREAM BANK ──────────────────────────────────────────────────────────
        // The second stimulus family, on the page. Sensor-idiom streams — baselines,
        // transients, drift, quantization, walks of figures, non-Cauchy noise — each
        // with a PRE-REGISTERED expected verdict from the screen, asserted as a
        // regression suite. The blind class is pinned as a row of its own, and the
        // ramp row asserts the exchange catch with the cheap statistic still in band.
        function sbGauss(rnd) {
            let u = 0,
                v = 0;
            while (!u)
                u = rnd();
            while (!v)
                v = rnd();
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        }

        function sbWalkStream(rfun, drfun, N, rnd) {
            const M = 2048,
                prof = [],
                arc = [];
            for (let k = 0; k < M; k++) {
                const a = -Math.PI / 2 + Math.PI * (k + 0.5) / M;
                prof.push(a);
                arc.push(Math.hypot(rfun(a), drfun(a)));
            }
            const cum = [];
            let s = 0;
            for (let k = 0; k < M; k++) {
                s += arc[k];
                cum.push(s);
            }
            for (let k = 0; k < M; k++)
                cum[k] /= s;
            const pick = () => {
                const u = rnd();
                let lo = 0,
                    hi = M - 1;
                while (lo < hi) {
                    const mid = (lo + hi) >> 1;
                    if (cum[mid] < u)
                        lo = mid + 1;
                    else
                        hi = mid;
                }
                return lo;
            };
            const out = [];
            for (let i = 0; i < N; i++)
                out.push(Math.tan(prof[pick()]));
            return out;
        }

        function runStreamBank() {
            const N = 5000;
            const rnd = makeRng(20260827);
            const g = () => sbGauss(rnd);
            const rows = [];
            const add = (name, expect, vals, note) => rows.push({
                name,
                expect,
                vals,
                note
            });

            const even = [];
            for (let i = 0; i < N; i++)
                even.push(Math.tan(Math.PI * (rnd() - 0.5)));
            add('even_turn', 'applies', even, 'the home case: tan of a uniform turn');
            add('mobius_chart', 'applies', even.map(y => (2 * y + 1) / (0.3 * y + 4)),
            'a M\u00f6bius account of the same arrivals\nthe family is closed under accounts');
            const rest = [];
            for (let i = 0; i < N; i++)
                rest.push(1 + 0.01 * g());
            add('gaussian_rest', 'refuses', rest, 'a channel at rest has a mean');
            const tr = [];
            for (let i = 0; i < N; i++) {
                const t2 = i / 100;
                tr.push(1 + 0.01 * g() + 0.4 * Math.exp(-Math.pow(t2 - 20, 2) / 0.125) * Math.cos(10 * Math.PI * t2));
            }
            add('transient', 'refuses', tr, 'a rest channel with an event\nis still a rest channel');
            const adc = [];
            for (let i = 0; i < N; i++)
                adc.push(Math.round(2048 + 3 * g()) * 3.3 / 4096);
            add('adc_rest', 'refuses', adc, 'the quantized version');
            const ln = [];
            for (let i = 0; i < N; i++)
                ln.push(Math.exp(0.6 * g()));
            add('lognormal_channel', 'refuses', ln, 'settles too');
            const wk = [];
            let w = 0;
            for (let i = 0; i < N; i++) {
                w += g();
                wk.push(w);
            }
            add('random_walk', 'refuses', wk, 'a drifting baseline: the mean check\npasses (a walk wanders) but the shape is not the family\u2019s');
            add('walked_oval', 'applies',
            sbWalkStream(a => 1 + 0.25 * Math.cos(a) + 0.10 * Math.cos(2 * a),
            a => -0.25 * Math.sin(a) - 0.20 * Math.sin(2 * a), N, rnd),
            'THE BLIND CLASS, PINNED: a smooth oval walked\nat its own pace passes the battery');
            add('walked_twolobe', 'refuses',
            sbWalkStream(a => 1 + 0.7 * Math.cos(2 * a), a => -1.4 * Math.sin(2 * a), N, rnd),
            'a walked figure the battery catches, with margin');
            const ramp = [];
            for (let i = 0; i < N; i++)
                ramp.push(Math.tan(-Math.PI / 2 + Math.PI * Math.sqrt(rnd())));
            add('ramp_schedule', 'refuses', ramp,
            'the recorded pass band, asserted: the cheap statistic\nreads in band while the exchange catches the dwell');
            const sb = [];
            for (let i = 0; i < 24; i++)
                sb.push(1.65 + 0.002 * g());
            add('short_burst', 'declines', sb, 'too few arrivals to judge; the screen\ndeclines rather than guesses');
            const cont = [];
            for (let i = 0; i < N; i++)
                cont.push(rnd() > 0.05 ? Math.tan(Math.PI * (rnd() - 0.5)) : g());
            add('contaminated_5pct', 'characterize', cont, '95% Cauchy + 5% Gaussian \u2014 recorded, not asserted');
            const t2v = [];
            while (t2v.length < N) {
                const a2 = g(),
                    b2 = g();
                t2v.push(g() / Math.sqrt((a2 * a2 + b2 * b2) / 2));
            }
            add('student_t2', 'characterize', t2v, 'heavy-tailed but not the family \u2014 recorded, not asserted');

            for (const r of rows) {
                if (r.vals.length < 500) {
                    r.got = 'declines';
                    r.scr = null;
                }
                else {
                    r.scr = osScreen(r.vals);
                    r.got = r.scr.pass ? 'applies' : 'refuses';
                }
                r.ok = r.expect === 'characterize' ? 1 : (r.got === r.expect ? 2 : 0);
                if (r.name === 'ramp_schedule' && r.ok === 2 && !(r.scr.cheap < 0.12))
                    r.ok = 0;
            }
            return rows;
        }

        function sbRibbon(vals) {
            const n = Math.min(vals.length, 400),
                step = Math.max(1, Math.floor(vals.length / n));
            const ys = [];
            for (let i = 0; i < vals.length; i += step) {
                const x = vals[i],
                    sg = x >= 0 ? 1 : -1;
                const rr = x ? Math.max(-OS_SAT, Math.min(OS_SAT, Math.log(Math.abs(x)) / OS_SIGMA)) : -OS_SAT;
                ys.push(sg * (rr + OS_SAT) / (2 * OS_SAT));
            }
            return osRibbon(ys, -1, 1);
        }

        function showStreamBank(rows) {
            const cells = rows.map(r => ({
                key: r.name,
                ok: r.ok,
                pts: sbRibbon(r.vals),
                cap: (r.expect === 'characterize' ? 'recorded: ' + r.got
                : 'expected ' + r.expect + ' \u00b7 got ' + r.got + (r.ok ? '' : ' \u2014 REGRESSION'))
                + (r.scr ? ' \u00b7 worst ratio ' + (100 * r.scr.worstOff).toFixed(0) + '%'
                + ' \u00b7 exchange ' + r.scr.exch.toFixed(2) : '')
                + '\n' + r.note,
            }));
            const out = labLadder({
                rows: cells,
                name: 'the stream bank',
                suffix: 'the second stimulus family',
                verdict: r => r.ok,
                caption: r => r.key + '\n' + r.cap,
            });
            if (!out)
                return;
            const asserted = rows.filter(r => r.expect !== 'characterize');
            const held = asserted.filter(r => r.ok === 2).length;
            const ramp = rows.find(r => r.name === 'ramp_schedule');
            flashStatus('the stream bank \u00b7 the sensor idiom as the second stimulus family, each'
            + ' stream drawn as signed rungs with its verdict asserted'
            + ' \u2014 ' + held + '/' + asserted.length + ' pre-registered verdicts held'
            + (held === asserted.length ? ', no regressions' : ' \u2014 REGRESSIONS ON THE PAGE, in red')
            + ' \u00b7 the walked OVAL passes and is pinned as a row: the blind class is part of the'
            + ' record now, and if that cell ever turns red the screen got sharper'
            + ' \u00b7 THE RAMP row asserts the day\u2019s finding in permanence: cheap statistic '
            + (ramp && ramp.scr ? (100 * ramp.scr.cheap).toFixed(1) : '?') + '% off \u2014 inside its band'
            + ' \u2014 while the exchange (' + (ramp && ramp.scr ? ramp.scr.exch.toFixed(2) : '?')
            + ') catches the dwell toward one horizon'
            + ' \u00b7 and the widest ratio\u2019s band is now FLOOR-AWARE here as in the harness,'
            + ' since a fixed 12% sits below that ratio\u2019s own noise at short lengths'
            + ' \u00b7 synthetic throughout: the second family grows the evidence base and leaves'
            + ' the real-instrument gate exactly where it was');
        }

        {
            const bSB = $('bStreamBank');
            if (bSB)
                bSB.addEventListener('click', () => {
                    bSB.disabled = true;
                    bSB.textContent = 'running the bank\u2026';
                    setTimeout(() => {
                        try {
                            showStreamBank(runStreamBank());
                        }
                        catch (e) {
                            flashStatus('the stream bank failed: ' + e.message);
                        }
                        finally {
                            bSB.disabled = false;
                            bSB.textContent = 'run the bank';
                        }
                    }, 0);
                });
        }
};
