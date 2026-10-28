// RECORD TESTS (?lab=rec), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, hrtSampleRadial, labLadder. It declares nothing the editor reads. Loaded
// the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['record-tests'] = function () {
        // ── RECORD TESTS ─────────────────────────────────────────────────────────────
        // The record paper's claims, checked against this library. A minimal reader
        // holds one value and one grain, receives the sweep serially, and writes three
        // symbols: silence, a signed tick per rung, and the mark at equality. The
        // string is the whole of what it keeps — no magnitudes, no coordinates, order
        // only.
        //
        // The corner needs a relator's extent to be equality WITH. Here that is the
        // shape's median radius from the standpoint — order-native, the same reference
        // the cauchy tests use — fixed once per reading and never recomputed. What
        // matters for every claim below is that it is scale-free: rescale the sweep and
        // the reference scales with it, so the crossings do not move.
        function recordEmit(readings, ref, beta) {
            const lnB = Math.log(beta);
            let h = readings[0],
                sym = '',
                ticks = 0,
                marks = [],
                addr = [],
                acc = 0;
            let prevSide = Math.sign(readings[0] - ref);
            for (let k = 0; k < readings.length; k++) {
                const v = readings[k];
                const l = Math.round(Math.log(v / h) / lnB);
                if (l === 0)
                    sym += '.';
                else {
                    sym += (l > 0 ? '+' : '-').repeat(Math.abs(l));
                    h *= Math.exp(l * lnB);
                    ticks += Math.abs(l);
                }
                acc += l;
                addr.push(acc);
                const side = Math.sign(v - ref);
                if (side !== 0 && prevSide !== 0 && side !== prevSide) {
                    sym += 'O';
                    marks.push(k);
                }
                if (side !== 0)
                    prevSide = side;
            }
            return {
                sym,
                ticks,
                marks,
                addr,
                held: h
            };
        }

        function runRecordTests() {
            const L = 256,
                LAMBDAS = [0.37, 1, 2.5, 100],
                GRAINS = [1.05, 1.2, 1.6];
            const rows = [];
            let total = 0;
            for (const spec of PRIMITIVES) {
                total++;
                if (typeof spec.pts !== 'function')
                    continue;
                const rs = hrtSampleRadial(spec.pts(), L); // the corpus's own radial sweep
                if (!rs)
                    continue; // not star-shaped: excluded
                const readings = Array.from(rs);
                const sorted = readings.slice().sort((a, b) => a - b);
                const ref = sorted[sorted.length >> 1]; // the median: order-native
                const base = recordEmit(readings, ref, 1.2);
                if (base.marks.length < 2)
                    continue; // nothing crosses: no record to test

                // ── 1. the string does not move when the account rescales it ──────────
                let scaleOK = true;
                for (const lam of LAMBDAS) {
                    const s = recordEmit(readings.map(v => v * lam), ref * lam, 1.2);
                    if (s.sym !== base.sym) {
                        scaleOK = false;
                        break;
                    }
                }
                // ── 2. the mark is every reader's mark ────────────────────────────────
                let markOK = true;
                const marksAt = GRAINS.map(g => recordEmit(readings, ref, g).marks);
                for (const m of marksAt)
                    if (m.join(',') !== marksAt[0].join(',')) {
                        markOK = false;
                        break;
                    }
                // ── 3. sufficiency: the address reconstructs within half a rung ───────
                let worst = 0;
                const lnB = Math.log(1.2);
                for (let k = 0; k < readings.length; k++) {
                    const rebuilt = readings[0] * Math.exp(base.addr[k] * lnB);
                    worst = Math.max(worst, Math.abs(Math.log(readings[k] / rebuilt)) / lnB);
                }
                const suffOK = worst <= 0.5 + 1e-9;
                // ── 4. transfer: two grains recover their ratio by counting ───────────
                // Gross ticks over a span estimate that span's log-variation divided by the
                // grain, so the ratio of two readers' counts estimates the inverse ratio of
                // their grains. The estimate is asymptotic, not exact: a reader coarser than
                // the sweep's own structure does not merely count fewer rungs, it loses the
                // variation below its grain outright. Both regimes are therefore measured.
                const m0 = base.marks[0],
                    m1 = base.marks[base.marks.length - 1];
                const gross = (beta, from, to) => {
                    let n = 0,
                        h = readings[from];
                    for (let k = from; k <= to; k++) {
                        const l = Math.round(Math.log(readings[k] / h) / Math.log(beta));
                        n += Math.abs(l);
                        h *= Math.pow(beta, l);
                    }
                    return n;
                };
                const est = (bA, bB) => {
                    const a = gross(bA, m0, m1),
                        b = gross(bB, m0, m1);
                    const truth = Math.log(bB) / Math.log(bA);
                    return b ? Math.abs(a / b - truth) / truth : 1;
                };
                const fineErr = est(1.02, 1.04),
                    coarseErr = est(1.15, 1.45);
                // ── 5. the string's own drift, and the mark that ends it ─────────────
                // The claim is about a reader of the STRING, not the writer of it: the writer
                // re-reads the arrival each time and cannot drift. Corrupt one tick and every
                // address after it is wrong, until a mark, which does not lean on the count:
                // the reader decodes the string as it is written, counting ticks, and at every
                // mark after the first sets its count back to what it held at the first (the
                // mark is equality with the reference, whatever the count says). One tick is
                // then dropped from the string and the same reader decodes it again.
                // (28 Oct 2026: this check used to add one to every address and set the drift
                // after the mark to zero by hand, so it could not fail; papers/labs.md, §24.)
                const decode = sym => {
                    const out = [];
                    let acc = 0, anchor = null, i = 0;
                    while (i < sym.length) {
                        const c = sym[i];
                        if (c === '.') i++;
                        else if (c === '+' || c === '-') {
                            while (sym[i] === c) {
                                acc += c === '+' ? 1 : -1;
                                i++;
                            }
                        } else {
                            i++;
                            continue;
                        }
                        out.push(acc);
                        if (sym[i] === 'O') {
                            i++;
                            if (anchor === null) anchor = acc;
                            else out[out.length - 1] = acc = anchor;
                        }
                    }
                    return out;
                };
                const clean = decode(base.sym);
                // the first tick written after the first mark, and the sample it belongs to
                let cut = -1, bad = 0;
                for (let k = 0, i = 0; i < base.sym.length; k++) {
                    const c = base.sym[i];
                    if (c === '+' || c === '-') {
                        if (k > m0 && cut < 0) {
                            cut = i;
                            bad = k;
                        }
                        while (base.sym[i] === c) i++;
                    } else i++;
                    if (base.sym[i] === 'O') i++;
                }
                let driftBefore = 0,
                    driftAfter = 0;
                if (cut >= 0) {
                    // a lost tick, not a lost sample: a sample whose only tick goes reads as silence
                    const single = base.sym[cut + 1] !== base.sym[cut];
                    const lost = decode(base.sym.slice(0, cut) + (single ? '.' : '') + base.sym.slice(cut + 1));
                    const nextMark = base.marks.find(m => m >= bad);
                    for (let k = bad; k < clean.length; k++) {
                        const wrong = Math.abs(lost[k] - clean[k]);
                        if (nextMark === undefined || k < nextMark)
                            driftBefore = Math.max(driftBefore, wrong);
                        else
                            driftAfter = Math.max(driftAfter, wrong);
                    }
                }
                const driftOK = driftBefore > 0; // the count does lean on its history
                const marksHold = driftAfter === 0; // and the mark ends the drift

                rows.push({
                    key: spec.key || spec.name || 'shape',
                    pts: spec.pts(),
                    len: base.sym.length,
                    ticks: base.ticks,
                    marks: base.marks.length,
                    scaleOK,
                    markOK,
                    suffOK,
                    worst,
                    fineErr,
                    coarseErr,
                    transferOK: fineErr < 0.10,
                    driftOK,
                    marksHold,
                    allOK: scaleOK && markOK && suffOK && fineErr < 0.10
                });
            }
            return {
                rows,
                total
            };
        }

        function showRecordReport(res) {
            const {rows, total} = res;
            const out = labLadder({
                rows,
                name: 'record tests',
                suffix: 'β 1.2 · λ 0.37–100',
                verdict: r => !(r.scaleOK && r.markOK && r.suffOK) ? 0 : (r.transferOK ? 2 : 1),
                caption: r => r.key + '\n'
                + r.len + ' symbols · ' + r.ticks + ' ticks · ' + r.marks + ' marks\n'
                + 'rescaled ' + (r.scaleOK ? 'identical ✓' : 'CHANGED ✗')
                + ' · grains ' + (r.markOK ? 'same marks ✓' : 'DIFFER ✗') + '\n'
                + 'address ≤' + r.worst.toFixed(2) + ' rung' + (r.suffOK ? ' ✓' : ' ✗') + '\n'
                + 'transfer ' + (100 * r.fineErr).toFixed(1) + '% fine · '
                + (100 * r.coarseErr).toFixed(0) + '% coarse' + (r.transferOK ? ' ✓' : ''),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const n = drawn.length;
            const c = f => drawn.filter(f).length;
            const medOf = f => {
                const a = drawn.map(f).sort((x, y) => x - y);
                return a.length ? a[a.length >> 1] : 1;
            };
            const medFine = medOf(r => r.fineErr),
                medCoarse = medOf(r => r.coarseErr);
            flashStatus('record tests · ' + n + ' of ' + total + ' primitives written as records'
            + ' — the string survived rescaling by 0.37 to 100 unchanged on ' + c(r => r.scaleOK) + '/' + n
            + ' · the marks landed at the same arrivals at every grain on ' + c(r => r.markOK) + '/' + n
            + ' · the address reconstructed inside half a rung on ' + c(r => r.suffOK) + '/' + n
            + ' · two grains recovered their ratio from tick counts alone, no unit or rung size'
            + ' communicated: median error ' + (100 * medFine).toFixed(1) + '% at fine grain (within 10% on '
            + c(r => r.transferOK) + '/' + n + ') but ' + (100 * medCoarse).toFixed(0) + '% at coarse grain'
            + ' — THE RECOVERY IS ASYMPTOTIC, NOT EXACT: a reader coarser than the sweep\u2019s own'
            + ' structure loses the variation below its grain, so the paper\u2019s transfer claim'
            + ' holds in the fine-grain limit and wants that scope stated'
            + ' · a lost tick drifted every later address on ' + c(r => r.driftOK) + '/' + n
            + ' and the next mark ended the drift on ' + c(r => r.marksHold) + '/' + n
            + ' — the count leans on its history and the mark does not'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bRT = $('bRecordTests');
            if (bRT)
                bRT.addEventListener('click', () => {
                    bRT.disabled = true;
                    bRT.textContent = 'writing…';
                    setTimeout(() => {
                        try {
                            const res = runRecordTests();
                            if (!res.rows.length)
                                flashStatus('record tests: no representable primitives');
                            else
                                showRecordReport(res);
                        } catch (e) {
                            flashStatus('record tests failed: ' + e.message);
                        }
                        finally {
                            bRT.disabled = false;
                            bRT.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }
};
