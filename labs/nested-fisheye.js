// THE NESTED FISHEYE (?lab=nfe), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, DEPTH, flashStatus, labLadder. It puts nestedFisheyeLadder back on the console hook
// window.__lab once loaded. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['nested-fisheye'] = function () {
        // ── THE NESTED FISHEYE (NFE) ─────────────────────────────────────────────────
        // In place of FLD "frequency ladder" (the smallest sufficient rung against Nyquist: a
        // question about the leaf format).
        // Every octave is the 0 to π/2 sweep (Tom, 5 Oct 04:18), and the fisheye is the sweep
        // (04:25: "perfect clarity at home, gently compression until the corner and aggressive
        // accelerationg compression after the corner"). This shows how a child's sweep lies
        // inside its PARENT's reading: the child's leaves, evenly spaced in its own turn and
        // generated from its corner, counted in eight equal stretches of the parent's doubling
        // (f, the share across it, in the reading that side is read in: v/h below the reader's
        // corner, h/v above it). Seen from the parent, the child's v/h is exactly proportional
        // on its front half (ρ = 2f) and its h/v on its back half (1/ρ = 2(1−f)) — R183's front
        // [0,1] and back [0,1] once more — so its clarity is full at its home, ½ at its corner,
        // and full again at its mathematical horizon wall. Every child lies the same way, at
        // every level. Plan and predictions: wander/plans/labs-plan.md; the result it
        // reproduces: wander/plans/nested-same-plan.md §5 (NST run 2).
        function nestedFisheyeLadder() {
            const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
            const D = DEPTH,
                W = 256,
                SK = D.leaves(2 * W),
                REC = [40, 36, 29, 23, 23, 29, 36, 40];
            const fOf = (k, s) => {
                const lo = 2 ** (k - 1),
                    hi = 2 ** k;
                return k <= 0 ? (s - lo) / (hi - lo) : (1 / lo - 1 / s) / (1 / lo - 1 / hi);
            };
            const cases = [];
            for (let k = -4; k <= 5; k++)
                cases.push({
                    label: 'child ' + k,
                    k,
                    fs: SK.map(r => fOf(k, D.join(k, r)))
                });
            // A level-2 child: child 1 of top octave 3, placed in the reader's reading, read back in octave 3's.
            cases.push({
                label: 'child 1 of 3',
                k: 1,
                fs: SK.map(r => {
                    const s = D.join(3, D.join(1, r));
                    return fOf(1, D.split(s)[1]);
                })
            });
            let q3 = 0;
            for (let k = -4; k <= 5; k++) {
                const lo = 2 ** (k - 1),
                    hi = 2 ** k;
                for (let i = 1; i < 2000; i++) {
                    const s = lo + (hi - lo) * i / 2000,
                        q = D.split(s),
                        f = fOf(k, s);
                    if (q[0] !== k)
                        continue;
                    q3 = Math.max(q3, f <= 0.5 ? Math.abs(q[1] - 2 * f) : Math.abs(1 / q[1] - 2 * (1 - f)));
                }
            }
            const rows = cases.map(c => {
                const n = new Array(8).fill(0);
                for (const f of c.fs)
                    n[Math.min(7, Math.max(0, Math.floor(f * 8)))]++;
                const ok1 = n.every((v, j) => v === REC[j]),
                    ok2 = n.every((v, j) => v === n[7 - j]);
                const pts = [{
                    x: 0,
                    y: 0
                }];
                n.forEach((v, j) => {
                    const y = v / (W / 8);
                    pts.push({
                        x: j * 0.25,
                        y
                    }, {
                        x: (j + 1) * 0.25,
                        y
                    });
                });
                pts.push({
                    x: 2,
                    y: 0
                });
                const lo = 2 ** (c.k - 1),
                    hi = 2 ** c.k,
                    par = c.k <= 0 ? (1 + hi * hi) / (1 + lo * lo) : (1 + 1 / (lo * lo)) / (1 + 1 / (hi * hi));
                return {
                    key: c.label,
                    pts,
                    n,
                    ok: ok1 && ok2 && q3 < 1e-12,
                    par
                };
            });
            const out = labLadder({
                rows,
                name: 'the nested fisheye',
                suffix: 'W=' + W + ' leaves per child',
                verdict: r => r.ok ? 2 : 0,
                caption: r => r.key + '\n' + r.n.join(' ') + (r.ok ? ' ✓' : ' ✗') + '\nparent bends ' + r.par.toFixed(2) + '× across it',
            });
            window.__nfeResult = {
                rows: rows.map(r => ({
                    key: r.key,
                    n: r.n,
                    ok: r.ok,
                    par: r.par
                })),
                q3
            };
            if (!out)
                return null;
            flashStatus('the nested fisheye (NFE) · each child\'s leaves, evenly spaced in its own turn, counted in eighths of its parent\'s doubling: '
            + rows[0].n.join(' ') + ' for every child −4…5 and for a child of a child (' + rows.filter(r => r.ok).length + ' of ' + rows.length + ' as NST run 2 recorded)'
            + ' · symmetric about its corner: full clarity at home, ½ at the corner, full again at its mathematical horizon wall'
            + ' · each half exactly proportional, worst ' + q3.toExponential(1)
            + ' · the parent\'s own fisheye bends 1.60× across children 0 and 1, 1.00× far out'
            + (t0 ? ' · ' + Math.round(performance.now() - t0) + ' ms' : ''));
            return rows.length;
        }

        {
            const bNFE = $('bNestedFisheye');
            if (bNFE)
                bNFE.addEventListener('click', () => {
                    bNFE.disabled = true;
                    bNFE.textContent = 'reading…';
                    setTimeout(() => {
                        try {
                            if (!nestedFisheyeLadder())
                                flashStatus('the nested fisheye: nothing to draw');
                        }
                        catch (e) {
                            flashStatus('the nested fisheye failed: ' + e.message);
                        }
                        finally {
                            bNFE.disabled = false;
                            bNFE.textContent = 'the nested fisheye';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { nestedFisheyeLadder });
};
