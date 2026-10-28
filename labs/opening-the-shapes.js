// OPENING THE SHAPES (?lab=unc), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, TAU, _uncCentre, _uncResample, flashStatus, labLadder, ring. It puts runUncloseTests
// back on the console hook window.__lab once loaded. Loaded the first time one of its buttons is pressed, or ?lab=
// asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['opening-the-shapes'] = function () {
        // ── OPENING THE SHAPES (R144) ───────────────────────────────────────────────
        // The fisheye opens a closed shape, with the situated reader at the middle of the
        // opening. Every single-outline primitive is laid evenly along its outline (equal arc
        // length per sample) and read from its area centre: h = |x − cx|, v = |y − cy|, the
        // reading s = v/h. Four numbers say how the shape opens:
        //   corner  the share of the outline read before v/h = 1
        //   middle  the median v/h
        //   tail    40 × the share beyond v/h = 40
        //   head    40 × the share below v/h = 1/40
        // The circle gives ½, 1, 2/π, 2/π. Each shape is set beside an ellipse of the same
        // breadth ratio b = max v / max h, laid the same way. Laid evenly by DIRECTION from the
        // centre instead, every shape opens exactly as the circle does — that is the control.
        const UNC_M = 200000;

        function _uncStats(s) {
            const M = s.length;
            let lo = 0,
                hi = 0,
                head = 0;
            for (let k = 0; k < M; k++) {
                const r = s[k];
                if (r < 1)
                    lo++;
                if (r > 40)
                    hi++;
                if (r < 0.025)
                    head++;
            }
            const srt = Float64Array.from(s).sort();
            return {
                corner: lo / M,
                middle: (srt[(M - 1) >> 1] + srt[M >> 1]) / 2,
                tail: 40 * hi / M,
                head: head / M / 0.025
            };
        }

        function _uncOpen(P, M) {
            const c = _uncCentre(P),
                R = _uncResample(P, M),
                s = new Float64Array(M);
            let mh = 0,
                mv = 0;
            for (let k = 0; k < M; k++) {
                const h = Math.abs(R.X[k] - c.x),
                    v = Math.abs(R.Y[k] - c.y);
                if (h > mh)
                    mh = h;
                if (v > mv)
                    mv = v;
                s[k] = v / Math.max(h, 1e-15);
            }
            return {
                b: mv / mh,
                st: _uncStats(s)
            };
        }

        function runUncloseTests(M) {
            M = M || UNC_M;
            const rows = [];
            let total = 0;
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
                const sh = _uncOpen(pts, M);
                const el = _uncOpen(ring(4000, 1, sh.b), M).st;
                const d = Math.abs(sh.st.corner - el.corner) + Math.abs(Math.log(sh.st.middle / el.middle));
                rows.push({
                    key: spec.key,
                    pts,
                    loopN: spec.loopN,
                    b: sh.b,
                    sh: sh.st,
                    el,
                    d
                });
            }
            // the control: laid evenly by direction, independent of the outline
            const s = new Float64Array(M);
            for (let k = 0; k < M; k++) {
                const t = (k + 0.5) / M * TAU;
                s[k] = Math.abs(Math.sin(t)) / Math.max(Math.abs(Math.cos(t)), 1e-15);
            }
            return {
                rows,
                total,
                M,
                dir: _uncStats(s)
            };
        }

        function showUncloseReport(res) {
            const {rows, total, dir} = res;
            const f3 = x => isFinite(x) ? x.toFixed(3) : '—';
            const out = labLadder({
                rows,
                name: 'opening the shapes',
                suffix: 'laid along the outline',
                verdict: r => r.d < 0.02 ? 2 : (r.d < 0.1 ? 1 : 0),
                caption: r => r.key + '  b ' + f3(r.b) + '\n'
                + 'corner ' + f3(r.sh.corner) + '  middle ' + f3(r.sh.middle) + '\n'
                + 'tail ' + f3(r.sh.tail) + '  head ' + f3(r.sh.head) + '\n'
                + 'ellipse ' + f3(r.el.corner) + ' · ' + f3(r.el.middle) + ' · ' + f3(r.el.tail) + ' · ' + f3(r.el.head),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const n2 = drawn.filter(r => r.d < 0.02).length,
                n1 = drawn.filter(r => r.d >= 0.02 && r.d < 0.1).length;
            const circ = drawn.find(r => r.key === 'circle');
            flashStatus('opening the shapes · ' + drawn.length + ' of ' + total + ' primitives, laid along the outline, read from the centre'
            + (circ ? ' · circle: corner ' + f3(circ.sh.corner) + ', middle ' + f3(circ.sh.middle) + ', tail ' + f3(circ.sh.tail) + ', head ' + f3(circ.sh.head) : '')
            + ' (2/π = ' + f3(2 / Math.PI) + ')'
            + ' · corner and middle as the same-b ellipse: within 0.02 on ' + n2 + ', within 0.1 on ' + n1 + ', beyond on ' + (drawn.length - n2 - n1)
            + ' · laid by direction instead, every shape: corner ' + f3(dir.corner) + ', middle ' + f3(dir.middle) + ', tail ' + f3(dir.tail) + ', head ' + f3(dir.head)
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bU = $('bOpenShapes');
            if (bU)
                bU.addEventListener('click', () => {
                    bU.disabled = true;
                    bU.textContent = 'running…';
                    setTimeout(() => {
                        try {
                            const res = runUncloseTests();
                            if (!res.rows.length)
                                flashStatus('opening the shapes: no single-outline primitives');
                            else
                                showUncloseReport(res);
                        } catch (e) {
                            flashStatus('opening the shapes failed: ' + e.message);
                        }
                        finally {
                            bU.disabled = false;
                            bU.textContent = 'open the shapes';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { runUncloseTests });
};
