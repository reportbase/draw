// THE MORPH ENGINE, moved out of draw.html line for line (12 Nov 2026, Tom: "1 2 3", the third "move the morph
// engine into its own file"). Everything from "MORPH: THE ONE OPERATION THE FORMAT IS BUILT FOR" up to "THE MORPH'S
// OWN SETTINGS, IN THE EDITOR": the blend and its alignment, the detail lag, the live morph and its clock, many morphs
// on one clock, editing a key on the canvas, keep, the eases and holds, the corners and the exact poses, holes, a line
// drawn on, motion along a path, the physical motions, contact, emitters, gravity and wind, clips, the camera and its
// stops, colour, riders, following and facing, the trails.
//
// It is the one block of parts/ that the rest of the editor calls into, so it is not run and forgotten as the
// others are: its function ends by handing back every name it declares at its top (the return { … } at the foot,
// one name for each), and the page takes them as its own where the block stood:
//     var { morphRuns, morphLive, … } = partRun('morph-engine');
// A var, because the page's first frames run before that line and ask _morphReady (undefined until then) whether
// the morphs are there yet, as they did when the block was inline. A name added at the top of this file goes in
// the return list and in that line too, or the page cannot see it; the smoke test (labs) checks all three agree.
//
// npm run player still takes the engine by name: tools/build-player.mjs puts these lines back where the page runs
// them before it looks, so player/tvf-player.js is what it was. Edit this file as the editor; the lines keep the
// editor's indent, and the comment that opened the block in draw.html opens it here.
(window.TVF_PARTS = window.TVF_PARTS || {})['morph-engine'] = function () {
        // ── MORPH: THE ONE OPERATION THE FORMAT IS BUILT FOR ─────────────────────────
        // Everything else in this lab measures a shape. This one measures the SPACE BETWEEN
        // two, and on this format that space is not a construction — it is a lerp. Both shapes
        // are N samples of the same parameter circle, so blending them is `a + (b−a)·t` on two
        // arrays, with no correspondence problem to solve and nothing to keep matched. There
        // are no control handles to interpolate, no tangents to reconcile, no risk of a kink:
        // the reconstruction is band-limited by construction, so every intermediate is a real
        // closed curve whether or not the two ends have anything to do with each other.
        //
        // Which raises a question worth a fixture, and a first answer that turned out to be the
        // wrong question — worth keeping, because the correction is the interesting part.
        //
        // A blend is a CONVEX COMBINATION of its ends, so harmonic by harmonic
        //     |c_h(blend)| = |Σ w_i c_h(end_i)| ≤ Σ w_i |c_h(end_i)| ≤ max_i |c_h(end_i)|
        // with w ≥ 0 summing to 1 — which every weight here is, the bilinear ones included. The
        // spectrum of an intermediate is bounded by the spectra of its ends. Exactly.
        //
        // The first version of this tested that with bandwidthRung, and a 4-corner grid promptly
        // produced a cell needing 512 against a 256 ceiling. Not a violation: that cell had the
        // SMALLEST bounding box in the grid, because a blend can be smaller than both of its
        // ends where they cancel, and a rung is a RELATIVE criterion — tolerance as a percentage
        // of the box diagonal. Shrink the shape and the same absolute detail has to be resolved
        // to a tighter absolute tolerance, so the rung goes up while the spectrum does not.
        //
        // So the fixture tests the theorem itself, by DFT, where there is no tolerance to argue
        // about; and it still prints the rung, because the rung is the practical number and
        // watching it move against a spectrum that cannot is the whole lesson. THE RUNG CAN GO
        // UP THROUGH A MORPH. THE SPECTRUM CANNOT. Those cells are the gold ones.
        //
        // THE CORRESPONDENCE IS THE WHOLE CRAFT. Leaf k of one shape blends to leaf k of the
        // other, and if the two were authored independently their k = 0 is in different places —
        // so the morph travels around the contour as well as across it, and what you see is a
        // twist rather than a transformation. alignTo rolls the second shape's leaf order to
        // the offset that minimises total travel, once, before any cell is built: once, because
        // a per-cell alignment could pick different offsets along the strip and the morph would
        // shear. The switch to defeat it is there because an authored correspondence is
        // sometimes exactly the one you meant.
        //
        // Centred, not normalised. Each end is moved onto its own centroid so the blend does
        // not slide across the cell, and then both are drawn at ONE shared scale — the relative
        // size of the two shapes is a fact about them and the strip should show it.
        // ── ALIGNMENT SEARCHES ORIENTATION TOO ───────────────────────────────────────
        // tvf.alignTo rolls the second shape's leaf order to the offset that minimises total
        // travel, over all N offsets. That is the right search over one group and the wrong
        // search over the group that actually matters: the correspondence between two closed
        // curves is a rotation AND a choice of direction, and a roll cannot reach the reversal.
        //
        // It bites constantly rather than rarely, because winding direction is not something an
        // author controls — an SVG's fill rule, a traced contour's handedness and a generator's
        // parameter sense all decide it independently. Measured on star5 against clover at
        // N=256: best cost 5.09 with the two wound the same way, and 85.96 — seventeen times
        // worse, no offset improving it — with the second one wound the other way. What you see
        // at that cost is the morph turning itself inside out on the way across.
        //
        // So the search runs over offset × orientation, which is the same loop twice and cannot
        // be worse than the roll alone. tvf.alignTo is left as it is: it is library code with
        // its own contract, and Shape.blend and symmetrize call it expecting exactly what it
        // documents. This is the morph's own alignment, which needs the bigger group.
        //
        // The search and the APPLICATION are separate calls, which matters as soon as the morph
        // runs in place. A correspondence is an index permutation — a roll and possibly a
        // reversal — and a permutation says nothing about where the shape sits. So the cost is
        // measured on CENTRED copies, where distance means shape difference and not the gap
        // between two things standing apart on the page, and the permutation it finds is then
        // applied to whichever copy the caller actually wants to blend. Searching on the
        // uncentred pair would rank every offset by the translation they share, which is the
        // same for all of them and swamps the term that carries the answer.
        function morphAlignPlan(a, b) {
            const N = a.N;
            const flip = b.clone().reverse();
            const scan = (cand) => {
                let bestOff = 0,
                    bestCost = Infinity;
                for (let off = 0; off < N; off++) {
                    let cost = 0;
                    for (let i = 0; i < N; i++) {
                        const j = (i + off) % N;
                        const dx = a.x[i] - cand.x[j],
                            dy = a.y[i] - cand.y[j];
                        cost += dx * dx + dy * dy;
                        if (cost >= bestCost)
                            break; // the same early-out tvf.alignTo uses
                    }
                    if (cost < bestCost) {
                        bestCost = cost;
                        bestOff = off;
                    }
                }
                return {
                    bestOff,
                    bestCost
                };
            };
            const f = scan(b),
                r = scan(flip);
            return (r.bestCost < f.bestCost) ? {
                flip: true,
                off: r.bestOff,
                cost: r.bestCost
            }
            : {
                flip: false,
                off: f.bestOff,
                cost: f.bestCost
            };
        }
        function morphApplyPlan(S, plan) {
            if (!plan)
                return S.clone();
            return (plan.flip ? S.clone().reverse() : S.clone()).roll(plan.off);
        }
        function morphAlign(a, b) {
            return morphApplyPlan(b, morphAlignPlan(a, b));
        }

        // ── COARSE TO FINE: THE MORPH GETS A DETAIL LAG ──────────────────────────────
        // A blend gives every part of the shape the same clock. Leaf k moves from a to b along
        // a straight line, all N of them together, and what you watch is the whole contour
        // sliding across at once — the star's points do not become the clover's lobes so much as
        // they are dragged into their positions while everything else is dragged into its own.
        //
        // The interesting alternative is to give the clock a SPECTRUM. Blending is linear, so
        // the DFT of a blend is the blend of the DFTs, harmonic by harmonic:
        //     C_blend[h] = Σ_k w_k(t) · C_k[h]
        // and nothing says every h has to read the same t. Give harmonic h its own arrival
        // time t_h, with the low ones arriving first, and the silhouette becomes the target's
        // silhouette while the detail is still the source's — then the detail catches up. A
        // star turns into a clover by first becoming a five-lobed BLOB and then growing the
        // lobes, which is how a person would draw the transition and is not something a path
        // interpolator can express: it has no frequency decomposition to schedule against.
        //
        // THE ORDERING IS DYADIC, not linear. Harmonic amplitude falls off fast and the shape
        // you read lives in the first handful, so a linear ramp over h spends nine tenths of the
        // lag on harmonics nobody can see. f_h = log2(m)/log2(N/2) on m = min(h, N−h) spreads
        // the schedule over OCTAVES — the same rung ladder the rest of the file measures in.
        //
        // m = 0 and m = 1 are pinned to f = 0, deliberately. m = 0 is the centroid, so lagging
        // it would make the shape arrive somewhere its parts had already left; m = 1 is the
        // base circle — size, aspect and the gross placement of the whole outline. Those two
        // are the "silhouette first" in "silhouette first", and they are never late.
        //
        // Two keys ramp, three or more WRAP. With K = 2 there is a start and an end, so a
        // lagged harmonic is clamped at both and the whole thing is done by t = 1: the schedule
        // is (t − L·f)/(1 − L), squeezed so the last harmonic still lands exactly on the end.
        // With K ≥ 3 the keys sit on a time circle and there is no end to clamp against, so the
        // lag is a phase shift instead and the detail runs around the cycle a little behind the
        // silhouette — a travelling wave rather than a stagger, and the loop still closes.
        //
        // THE SPECTRAL BOUND SURVIVES THIS, and more easily than it survives the plain blend.
        // |c_h| ≤ max_i |c_h(end_i)| is proved harmonic by harmonic from Σ w = 1, w ≥ 0 — it
        // never needed all the harmonics to share a t. Reading different weights at different h
        // is still, at each h, a convex combination of that h across the ends. The ladder's
        // verdict column is unchanged and the fixture checks it at every lag.
        const MORPH_LAG_MAX = 0.9;
        // Forward and inverse as a matched pair, on fftInPlace's convention: the forward is
        // unnormalised and the inverse divides by n. A blend is a convex combination of
        // coefficients, so the convention cancels either way — what matters is only that the two
        // halves agree, which is why the fallback below has to be written to the same rule.
        //
        // THE FALLBACK IS NOT DECORATION. Leaf counts here are rungs and rungs are powers of two,
        // so the FFT takes almost every case — but "almost" is doing real work: an imported
        // contour, a hand-set N, a shape that arrived at 300 leaves from somewhere else. The
        // first version of this reached for the file's own dft/idft, which are PRIVATE TO THE tvf
        // CLOSURE and simply not in scope out here; the branch is rare enough that every test
        // ran at 256 and 1024 and none of them touched it. A ReferenceError that only fires on
        // odd leaf counts is exactly the bug a test suite full of tidy numbers will not find, so
        // this is spelled out locally and there is now a fixture at N = 300.
        //
        // O(N²) with a shared trig table, and it only has to be fast enough to scrub at: one
        // transform per frame at N=300 is 90k multiply-adds, which is well inside a frame.
        const _morphTrig = new Map();
        function morphTrigTable(n) {
            let t = _morphTrig.get(n);
            if (t)
                return t;
            const cos = new Float64Array(n),
                sin = new Float64Array(n);
            for (let p = 0; p < n; p++) {
                const a = TAU * p / n;
                cos[p] = Math.cos(a);
                sin[p] = Math.sin(a);
            }
            t = {
                cos,
                sin
            };
            if (_morphTrig.size > 8)
                _morphTrig.delete(_morphTrig.keys().next().value);
            _morphTrig.set(n, t);
            return t;
        }
        function morphSlowFT(re, im, inverse) {
            const n = re.length,
                tab = morphTrigTable(n);
            const oR = new Float64Array(n),
                oI = new Float64Array(n);
            const sgn = inverse ? 1 : -1;
            for (let m = 0; m < n; m++) {
                let sr = 0,
                    si = 0;
                for (let k = 0; k < n; k++) {
                    const p = (m * k) % n;
                    const c = tab.cos[p],
                        s = sgn * tab.sin[p];
                    sr += re[k] * c - im[k] * s;
                    si += re[k] * s + im[k] * c;
                }
                if (inverse) {
                    oR[m] = sr / n;
                    oI[m] = si / n;
                } else {
                    oR[m] = sr;
                    oI[m] = si;
                }
            }
            return {
                re: oR,
                im: oI
            };
        }
        function morphFwd(re, im) {
            if (isPow2(re.length)) {
                fftInPlace(re, im, false);
                return {
                    re,
                    im
                };
            }
            return morphSlowFT(re, im, false);
        }
        function morphInv(re, im) {
            if (isPow2(re.length)) {
                fftInPlace(re, im, true);
                return {
                    re,
                    im
                };
            }
            return morphSlowFT(re, im, true);
        }
        // One complex transform per key, taken once. z = x + iy, so a single N-point transform
        // carries both channels and the harmonics are SIGNED — h and N−h are the two directions
        // of rotation, which is exactly the pair that has to share a schedule for the blend to
        // stay real in the sense that matters (a closed plane curve, not a real-valued signal).
        function morphSpectra(keys) {
            return keys.map(k => morphFwd(Float64Array.from(k.x), Float64Array.from(k.y)));
        }
        function morphFreqScale(N) {
            const f = new Float64Array(N),
                half = N >> 1;
            const dl = Math.log2(Math.max(2, half));
            for (let h = 0; h < N; h++) {
                const m = h <= half ? h : N - h;
                f[h] = m <= 1 ? 0 : Math.log2(m) / dl; // centroid and base circle are never late
            }
            return f;
        }
        function morphLagTime(t, f, lag, wrap) {
            if (!(lag > 0) || f <= 0)
                return t;
            const L = Math.min(MORPH_LAG_MAX, lag);
            if (wrap) {
                const u = (t - L * f) % 1;
                return u < 0 ? u + 1 : u;
            }
            return Math.max(0, Math.min(1, (t - L * f) / (1 - L)));
        }
        // weightsAt is handed the harmonic's own lag map rather than a time, so a caller with
        // more than one parameter to schedule — the four-corner grid has u AND v — can put both
        // through it. The weights are cached per |harmonic|: h and N−h share m, so a strip at
        // N=256 evaluates the kernel 129 times a frame instead of 256.
        function morphBlendSpectral(spec, freq, weightsAt, lag, wrap, outX, outY) {
            const K = spec.length,
                N = outX.length,
                half = N >> 1;
            const re = new Float64Array(N),
                im = new Float64Array(N);
            const wc = new Array(half + 1);
            for (let h = 0; h < N; h++) {
                const m = h <= half ? h : N - h;
                let w = wc[m];
                if (!w) {
                    const fh = freq[h];
                    w = wc[m] = weightsAt(tt => morphLagTime(tt, fh, lag, wrap));
                }
                let ar = 0,
                    ai = 0;
                for (let k = 0; k < K; k++) {
                    const a = w[k];
                    if (a === 0)
                        continue;
                    ar += a * spec[k].re[h];
                    ai += a * spec[k].im[h];
                }
                re[h] = ar;
                im[h] = ai;
            }
            const out = morphInv(re, im);
            outX.set(out.re);
            outY.set(out.im);
        }
        const MORPH_STEPS = 9;
        function morphLadder(o) {
            o = o || {};
            const sel = selectedIndices();
            if (sel.length < 2) {
                flashStatus('morph: select two shapes (or four, for a grid)');
                return null;
            }
            const grid = sel.length >= 4;
            const src = sel.slice(0, grid ? 4 : 2).map(i => state.subpaths[i]);
            if (src.some(sp => !sp || !sp.leafX || sp.leafX.length < 3)) {
                flashStatus('morph: those shapes have no leaves');
                return null;
            }
            const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
            const hR = state.hRun || 1;
            const align = o.align !== false;
            const lag = Math.max(0, Math.min(MORPH_LAG_MAX, +o.lag || 0));

            // Into the library's own type, on one leaf count, centred, in register units.
            const N = Math.max(...src.map(sp => sp.leafX.length));
            const ends = src.map(sp => {
                let cx = 0,
                    cy = 0;
                const n = sp.leafX.length;
                for (let k = 0; k < n; k++) {
                    cx += sp.leafX[k];
                    cy += sp.leafY[k];
                }
                cx /= n;
                cy /= n;
                const S = new tvf.Shape(Float64Array.from(sp.leafX, v => (v - cx) / hR),
                Float64Array.from(sp.leafY, v => (v - cy) / hR));
                return S.N === N ? S : S.resample(N);
            });
            // Rolled to the FIRST end, all of them, once.
            const keys = ends.map((S, i) => (i === 0 || !align) ? S : morphAlign(ends[0], S));

            // What each end needs, so the rung has a ceiling to be read against. Measured on the
            // real subpaths rather than the centred copies — a translation cannot change a
            // bandwidth, and this way the number is the one the labels elsewhere would report.
            const endRung = src.map(sp => {
                const r = bandwidthRung(sp);
                return r ? r.N : 0;
            });
            const ceiling = Math.max(...endRung);
            // The spectral envelope of the ends: max_i |c_h| at every harmonic. Direct DFT rather
            // than the file's FFT because it runs once per cell on a few hundred leaves and being
            // obviously the definition matters more here than being fast — this is the line the
            // claim is made of.
            const specOf = S => {
                const n = S.N,
                    half = n >> 1,
                    m = new Float64Array(half + 1);
                for (let h = 0; h <= half; h++) {
                    let ar = 0,
                        ai = 0;
                    for (let k = 0; k < n; k++) {
                        const th = TAU * h * k / n,
                            c = Math.cos(th),
                            s2 = Math.sin(th);
                        ar += S.x[k] * c + S.y[k] * s2;
                        ai += S.y[k] * c - S.x[k] * s2;
                    }
                    m[h] = Math.hypot(ar, ai) / n;
                }
                return m;
            };
            const envelope = (() => {
                const es = keys.map(specOf),
                    out = es[0].slice();
                for (let i = 1; i < es.length; i++)
                    for (let h = 0; h < out.length; h++)
                        if (es[i][h] > out[h])
                            out[h] = es[i][h];
                return out;
            })();

            // With no lag the cells are built the way they always were, through tvf.mix — the
            // library's own two-array lerp, on the library's own type. The spectral path is a
            // strictly bigger computation and there is no reason to pay for it to reproduce a
            // result the simpler one already gives exactly.
            const spec = lag > 0 ? morphSpectra(keys) : null;
            const freq = lag > 0 ? morphFreqScale(N) : null;
            const lagged = (weightsAt) => {
                const X = new Float64Array(N),
                    Y = new Float64Array(N);
                morphBlendSpectral(spec, freq, weightsAt, lag, false, X, Y);
                return new tvf.Shape(X, Y);
            };

            const cells = [];
            if (grid) {
                const R = 4; // 4×4 corners-to-corners
                for (let r = 0; r < R; r++)
                    for (let c = 0; c < R; c++) {
                        const u = c / (R - 1),
                            v = r / (R - 1);
                        // Bilinear: the top pair blended by u, the bottom pair by u, then those by v.
                        // Under a lag BOTH parameters go through the harmonic's schedule — a cell at
                        // (u,v) is a corner blend that the fine harmonics have not finished making.
                        const S = lag > 0
                        ? lagged(g => {
                            const a = g(u),
                                b = g(v);
                            return [(1 - a) * (1 - b), a * (1 - b), (1 - a) * b, a * b];
                        })
                        : tvf.mix(tvf.mix(keys[0], keys[1], u), tvf.mix(keys[2], keys[3], u), v);
                        cells.push({
                            S,
                            label: u.toFixed(2) + '/' + v.toFixed(2)
                        });
                    }
            } else {
                const K = Math.max(3, Math.min(24, o.steps || MORPH_STEPS));
                for (let i = 0; i < K; i++) {
                    const t = i / (K - 1);
                    const S = lag > 0 ? lagged(g => {
                        const a = g(t);
                        return [1 - a, a];
                    })
                    : tvf.mix(keys[0], keys[1], t);
                    cells.push({
                        S,
                        label: 't ' + t.toFixed(2)
                    });
                }
            }

            // One scale for every cell, from the widest end — see the note above.
            let span = 1e-9;
            for (const c of cells) {
                let a = Infinity,
                    b = -Infinity,
                    cc = Infinity,
                    d = -Infinity;
                for (let k = 0; k < c.S.N; k++) {
                    const X = c.S.x[k],
                        Y = c.S.y[k];
                    if (X < a)
                        a = X;
                    if (X > b)
                        b = X;
                    if (Y < cc)
                        cc = Y;
                    if (Y > d)
                        d = Y;
                }
                span = Math.max(span, b - a, d - cc);
            }

            const G = ladderLayout(cells.length);
            const scale = (G.cell * 0.56) / span;
            if (state.editMode)
                exitEditMode();
            state.selected.clear();
            state.activeSet = new Set();
            state.activeSp = -1;
            state.subpaths = [];
            let over = 0;
            cells.forEach((c, i) => {
                const at = G.at(i);
                // Built from the BLENDED LEAVES directly — not through subpathFromLoop, which
                // arc-length-resamples and would throw away the very correspondence this fixture
                // exists to preserve. Leaf k of the cell is leaf k of both ends, blended.
                const lx = new Float64Array(c.S.N),
                    ly = new Float64Array(c.S.N);
                for (let k = 0; k < c.S.N; k++) {
                    lx[k] = (at.x + c.S.x[k] * scale) * hR;
                    ly[k] = (at.y + c.S.y[k] * scale) * hR;
                }
                const sp = {
                    refX: Float64Array.from(lx),
                    refY: Float64Array.from(ly),
                    leafX: lx,
                    leafY: ly,
                    srcCoV: 0,
                    refLength: 0,
                    source: 'draw',
                    dirty: false
                };
                const need = bandwidthRung(sp);
                const got = need ? need.N : 0;
                // THE CLAIM, harmonic by harmonic. A relative slack of 1e-9 because these are sums
                // of a few hundred floats and an exact ≤ would fail on rounding alone.
                const cs = specOf(c.S);
                let worst = 0;
                for (let h = 1; h < cs.length; h++) {
                    const e = envelope[h];
                    if (cs[h] > e) {
                        const r = (cs[h] - e) / Math.max(e, 1e-12);
                        if (r > worst)
                            worst = r;
                    }
                }
                const held = worst <= 1e-9;
                if (!held)
                    over++;
                // Teal: the spectrum held AND the rung came down. Gold: the spectrum held but the
                // rung did not — the cancellation cells, and the point of the fixture. Red would be
                // a violation of the theorem.
                sp.stroke = !held ? '#e85648' : (got && ceiling && got < ceiling ? '#8ce6cd' : '#d4a052');
                sp.lineWidth = 1.6;
                sp.tag = c.label + '\nneeds ' + (got || '—')
                + '\n|c| ≤ ends ' + (held ? '✓' : '✗');
                sp.tagW = G.cell * hR;
                state.subpaths.push(sp);
            });

            state.svgName = 'morph · ' + (grid ? '4-corner grid' : cells.length + ' steps')
            + (align ? '' : ' · unaligned') + (lag > 0 ? ' · lag ' + lag.toFixed(2) : '');
            state.lastLoadInfo = {
                totalElements: state.subpaths.length,
                multiSubpath: true,
                subpathCount: state.subpaths.length
            };
            rebuildSignalSelect();
            closeMenu();
            applyShapeSelection(new Set());
            ladderCamera(G);
            state.view.zoom *= 0.86;
            state.view.panY = -G.cell * 0.18;
            drawAll();
            pushHistory();
            scheduleSave();
            const rose = state.subpaths.filter(sp => sp.stroke === '#d4a052').length;
            flashStatus('morph · ' + (grid ? 'bilinear over 4 corners' : cells.length + ' steps')
            + ' at N=' + N + (align ? ' · leaf order aligned to the first shape' : ' · raw leaf correspondence')
            + (lag > 0 ? ' · detail lag ' + lag.toFixed(2)
            + ' — harmonic h arrives at (t − ' + lag.toFixed(2) + '·log₂m/log₂' + (N >> 1)
            + ')/(1 − ' + lag.toFixed(2) + '), so the silhouette crosses first and the'
            + ' detail follows it by an octave-spaced stagger; the bound below is proved'
            + ' PER HARMONIC and never needed them to share a clock' : '')
            + ' — the spectral bound |c_h| ≤ max over the ends held in '
            + (cells.length - over) + '/' + cells.length + (over ? ' ⚠ (a miss here would be a finding)' : '')
            + ' · endpoints need ' + endRung.join('/') + ' leaves; ' + rose + ' cell' + (rose === 1 ? '' : 's')
            + ' still asked for ' + (rose === 1 ? 'more' : 'as much or more')
            + ' — a rung is a RELATIVE criterion and a blend can be smaller than both its ends,'
            + ' so the rung can rise where the spectrum provably cannot'
            + (t0 ? ' · ' + Math.round(performance.now() - t0) + ' ms' : ''));
            return cells.length;
        }

        // ── THE MORPH, LIVE ──────────────────────────────────────────────────────────
        // The strip above is the morph as a specimen: every intermediate at once, measurable,
        // still. This is the same arithmetic with a hand on it — one shape in the scene whose
        // leaves are recomputed from the keys every time t moves.
        //
        // Nothing is baked. There is no cached sequence and no interpolation cache: the blend
        // is `Σ w_k · key_k` over two Float64Arrays, which is cheap enough to do per frame at
        // any leaf count this editor works at, so the shape under the cursor at t = 0.413 is a
        // real shape with real leaves that you can stop on and keep. That is the property worth
        // protecting, and it is why `keep` is a button rather than an export.
        //
        // TWO KEYS ARE A LERP. THREE OR MORE ARE A CIRCLE. With K ≥ 3 the keys are placed at
        // the K leaf positions of a TIME circle and weighted by the same cardinal kernel that
        // reconstructs a contour — so the loop closes, t = 1 arrives back at t = 0 with no
        // seam, and the interpolation between keys is the same operator the whole file is about
        // rather than a second, unrelated easing curve bolted on. A morph of a shape sequence
        // is a bridge whose leaves are shapes.
        //
        // IN PLACE, and that is the default. The first version of this took the whole page: it
        // stashed state.subpaths, put one shape on an empty canvas and gave it the slider. That
        // is the right presentation for a SPECIMEN and the wrong one for a tool — a morph you
        // cannot see against the rest of the drawing is a morph you cannot aim, and the thing
        // you are usually trying to decide is whether the pose at t sits right next to
        // everything else. So the keys are lifted out of the scene where they stand, one live
        // shape takes their slot, and nothing else moves — not the other shapes and not the
        // camera. `restore` still holds the ORIGINAL array, so exit puts the keys back exactly
        // where they were and keep simply leaves the substitution standing.
        //
        // And in place means UNCENTRED. The specimen centres each key on its own centroid so the
        // blend does not slide across an otherwise empty cell; in the scene that slide is the
        // whole point — the shape should travel from where the first key stands to where the
        // second one does, because that is what the drawing says happens. Blending the raw leaves
        // gives it for free: the centroid is the leaf average, so a lerp of the leaves is already
        // a lerp of the centroids. The alignment search still runs on centred copies, where the
        // cost means shape difference; only the arrays it permutes are different.
        //
        // The live shape is held by REFERENCE, not by index. An index goes stale the moment
        // anything is added, deleted or reordered underneath the morph, and it goes stale
        // silently — the writes would land on some other shape. A reference either finds itself
        // in state.subpaths or it does not, and the not case is a clean stop.
        //
        // ── MANY MORPHS, ONE CLOCK ───────────────────────────────────────────────────
        // A morph used to be a singleton: one set of keys, one live shape, one t. That is the
        // right shape for a lab bench and the wrong one for a drawing, where the interesting
        // question is what SEVERAL things do at the same moment — a scene where the door swings
        // while the sign flips while the tree bends is a scene, and three sequential experiments
        // are not. So the state splits in two:
        //
        //   morphRuns   — a list. Each entry owns its own keys, its own live shape, its own lag
        //                 and its own spectra, and knows which subpaths it lifted out of the
        //                 scene so it can put them back.
        //   morphLive   — the CLOCK. One t, one play flag, one requestAnimationFrame. Every run
        //                 reads the same t, so `run` is global and the poses stay in register
        //                 with each other, which is the only reading of "at the same time" that
        //                 a still frame can be judged on.
        //
        // One rAF for all of them rather than one each: N animation callbacks all calling drawAll
        // would redraw the canvas N times a frame to show one frame's worth of change.
        //
        // The clock is shared but the LAG is per run, held on the run and only pushed to all of
        // them together by the bar slider. That costs nothing today and is what a per-run panel
        // would need tomorrow.
        //
        // morphLive keeps read-through accessors for the first run because a great deal of
        // surrounding code, and every fixture, asks "is a morph live and what is it" — and the
        // answer for one run should not have to be spelled differently from the answer for one
        // of many.
        const morphRuns = [];
        // drawAll can run before this line has (the page's first frames), and morphRuns is not
        // there to read until it has; a var is, as undefined, so the trails and the guide ask it first.
        var _morphReady = true;
        const morphLive = {
            t: 0,
            play: false,
            raf: 0,
            speed: 0.25,
            last: 0,
            path: null, // MOTION ALONG A PATH: the path every live shape rides, or null
            get runs() {
                return morphRuns;
            },
            get count() {
                return morphRuns.length;
            },
            get keys() {
                return morphRuns.length ? morphRuns[0].keys : null;
            },
            get sp() {
                return morphRuns.length ? morphRuns[0].sp : null;
            },
            get inPlace() {
                return morphRuns.length ? morphRuns[0].inPlace : (state.morphInPlace !== false);
            },
            get lag() {
                return morphRuns.length ? morphRuns[0].lag : (+state.morphLag || 0);
            },
            set lag(v) {
                const L = Math.max(0, Math.min(MORPH_LAG_MAX, +v || 0));
                for (const r of morphRuns) {
                    r.lag = L;
                    r.spec = null;
                    r.freq = null;
                }
            },
        };
        function morphRunning() {
            return morphRuns.length > 0;
        }
        function morphWeights(t, K) {
            const w = new Float64Array(K);
            if (K === 1) { // a still: one key, held (DETAIL EFFECTS animate it)
                w[0] = 1;
                return w;
            }
            if (K === 2) {
                w[0] = 1 - t;
                w[1] = t;
                return w;
            }
            const phi = t * TAU;
            for (let k = 0; k < K; k++)
                w[k] = tvf.kernel(phi - (k + 0.5) * TAU / K, K);
            return w;
        }
        function morphBarSync() {
            const on = morphRunning();
            morphTimelineSync(); // THE TIMELINE
            const bar = $('morphBar');
            if (bar)
                bar.style.display = on ? 'flex' : 'none';
            // The bar itself is hidden by default — see #shapeBar. This is the one thing that
            // brings it back, and it takes it away again on exit.
            document.body.classList.toggle('morphing', on);
            const b = $('bMorphPlay');
            if (b) {
                b.textContent = morphLive.play ? 'pause' : 'run';
                b.classList.toggle('active', morphLive.play);
            }
            const v = $('morphTVal');
            if (v)
                v.textContent = morphLive.t.toFixed(3);
            const r = $('morphT');
            if (r && +r.value !== Math.round(morphLive.t * 1000))
                r.value = String(Math.round(morphLive.t * 1000));
            const k = $('morphKeys');
            if (k) {
                if (!on)
                    k.textContent = '';
                else {
                    let keys = 0,
                        N = 0;
                    for (const run of morphRuns) {
                        keys += run.keys.length;
                        N = Math.max(N, run.keys[0].x.length);
                    }
                    k.textContent = (morphRuns.length > 1 ? morphRuns.length + ' morphs · ' : '')
                    + keys + ' keys · ' + (morphRuns.every(r => r.exact) ? N + ' corners' : 'N=' + N) + (morphLive.inPlace ? ' · in place' : ' · solo');
                }
            }
            // Only while a morph is live. The run's lag outlives the run as a stale field, and
            // state.morphLag is the SETTING. Syncing the bar from the stale one would quietly drag
            // the panel's value back to whatever the last morph happened to use.
            if (on) {
                const lg = $('morphLagLive');
                if (lg && +lg.value !== Math.round(morphLive.lag * 100))
                    lg.value = String(Math.round(morphLive.lag * 100));
                const lv = $('morphLagVal');
                if (lv)
                    lv.textContent = morphLive.lag > 0 ? morphLive.lag.toFixed(2) : 'off';
            }
        }
        // A run's live shape, or null if it is no longer in the scene. Everything that writes
        // goes through here so there is exactly one place that can be wrong about which shape is
        // live — and with several runs going, exactly one place that can be wrong about which run.
        function morphTargetOf(run) {
            const sp = run && run.sp;
            // an exact morph's shape is never asked for its leaves: asking would turn it into leaves
            if (sp && run.exact)
                return state.subpaths.indexOf(sp) < 0 ? null : sp;
            if (!sp || !sp.leafX)
                return null;
            return state.subpaths.indexOf(sp) < 0 ? null : sp;
        }
        function morphTarget() {
            return morphRuns.length ? morphTargetOf(morphRuns[0]) : null;
        }
        // The pose a run shows at time t, written into X and Y: the keys blended, the effect on the
        // detail, then the path (MOTION ALONG A PATH). morphWriteRun writes it into the live shape at
        // the clock's t; a trail asks for it at earlier times without touching the shape.
        function morphPoseInto(run, t, X, Y, bare) { // bare: the keys' blend alone, no effect or path
            const K = run.keys.length,
                N = X.length,
                tt = morphRunT(run, t); // EACH MORPH ITS OWN TIME: the keys and the effect on the morph's clock
            if (run.lag > 0) {
                // Built on first use and thrown away when the lag goes back to zero, so a run nobody
                // lags never pays for a transform. wrap = K > 2: two keys ramp between a start and an
                // end, three or more run around a circle that has neither.
                if (!run.spec) {
                    run.spec = morphSpectra(run.keys);
                    run.freq = morphFreqScale(N);
                }
                morphBlendSpectral(run.spec, run.freq,
                g => morphWeightsOf(g(tt), K, run), run.lag, K > 2, X, Y); // EASING AND HOLDS
            } else {
                const w = morphWeightsOf(tt, K, run); // EASING AND HOLDS
                X.fill(0);
                Y.fill(0);
                for (let k = 0; k < K; k++) {
                    const a = w[k];
                    if (a === 0)
                        continue;
                    const kx = run.keys[k].x,
                        ky = run.keys[k].y;
                    for (let i = 0; i < N; i++) {
                        X[i] += a * kx[i];
                        Y[i] += a * ky[i];
                    }
                }
            }
            if (bare)
                return;
            if (run.fx && run.fx.kind)
                morphApplyFx(run, X, Y, tt); // DETAIL EFFECTS
            if (morphPathOf(run) || run.spin)
                morphApplyPath(run, X, Y, t); // MOTION ALONG A PATH, and the morph's spin
            const MX = morphMotionXform(run, t); // PHYSICAL MOTIONS
            if (MX)
                for (let i = 0; i < N; i++)
                    [X[i], Y[i]] = MX.at(X[i], Y[i]);
            const PX = morphParentXform(run, t); // ONE MORPH RIDING ANOTHER
            if (PX)
                for (let i = 0; i < N; i++)
                    [X[i], Y[i]] = PX.at(X[i], Y[i]);
            const lk = morphLookTurn(run, t); // FACING another
            if (lk) {
                const c = morphCentreAt(run, t),
                    cs = Math.cos(lk),
                    sn = Math.sin(lk);
                for (let i = 0; i < N; i++) {
                    const dx = X[i] - c.x,
                        dy = Y[i] - c.y;
                    X[i] = c.x + cs * dx - sn * dy;
                    Y[i] = c.y + sn * dx + cs * dy;
                }
            }
        }
        function morphWriteRun(run) {
            const sp = morphTargetOf(run);
            if (!sp)
                return;
            if (run.exact) { // MORPHS THAT KEEP THEIR CORNERS
                morphWriteExact(run, sp, morphPoseExact(run, morphLive.t));
                if (run.cols)
                    sp.fill = morphColourAt(run, morphLive.t); // COLOUR THAT MORPHS
                sp._fade = morphShowFactor(run, morphLive.t); // A MORPH THAT PLAYS ONCE: out of sight, or fading
                sp._draw = morphDrawFactor(run, morphLive.t); // DRAWING A LINE ON
                sp._drawRun = run;
                morphNoteWritten(run, sp);
                return;
            }
            const X = sp.leafX,
                Y = sp.leafY;
            morphPoseInto(run, morphLive.t, X, Y);
            morphNoteWritten(run, sp);
            if (run.cols)
                sp.fill = morphColourAt(run, morphLive.t); // COLOUR THAT MORPHS
            sp._fade = morphShowFactor(run, morphLive.t); // A MORPH THAT PLAYS ONCE: out of sight, or fading
            sp._draw = morphDrawFactor(run, morphLive.t); // DRAWING A LINE ON
            sp._drawRun = run;
            // The reference follows the leaves. A morph is not a resample of some earlier curve —
            // each pose IS the shape, so a pose dropped by `keep` has to be its own origin or every
            // downstream reading would be taken against a curve that is not there.
            sp.refX.set(X);
            sp.refY.set(Y);
            sp._contourCache = null;
            sp.dirty = false;
        }
        // ── EDITING A KEY ON THE CANVAS (26 Oct 2026, Tom: "proceed with your recommendations": direct
        // manipulation) ──────────────────────────────────────────────────────────────────────────
        // The live shape is rewritten from the keys at every frame, so an edit made to it (a move, a
        // turn, a corner or a leaf dragged) used to be thrown away by the next write. Now, with the morph
        // paused, an edit is taken into the morph when it ends (when it lands in the undo history):
        //   on a key's own time, it becomes that key;
        //   between keys, it becomes a new key at that time, the others keeping theirs;
        //   a still's one key simply takes it.
        // What is edited is the pose as drawn, which is the keys' blend carried by the morph's path or
        // spin, its parent and its facing; each of those is a turn and a move, so the edit is carried
        // back through them, and a key is always the shape as drawn before any of them. On a path a
        // shape's place is the path's, so a move there is undone by the ride, while a turn or a
        // reshaping stays. An effect on the detail cannot be carried back, so a morph with one is left
        // as it is (and says so), and so is an edit that changes an exact shape's corner count.
        function morphNoteWritten(run, sp) {
            const X = run.exact ? sp._lazy && sp._lazy.x : sp.leafX,
                Y = run.exact ? sp._lazy && sp._lazy.y : sp.leafY;
            if (!X)
                return;
            if (!run._wx || run._wx.length !== X.length) {
                run._wx = new Float64Array(X.length);
                run._wy = new Float64Array(X.length);
            }
            run._wx.set(X);
            run._wy.set(Y);
        }
        let _morphAbsorbing = false;
        function morphAbsorbEdits() {
            if (_morphAbsorbing || !morphRuns.length || morphLive.play)
                return 0;
            _morphAbsorbing = true;
            let n = 0;
            try {
                for (const run of morphRuns) {
                    const sp = morphTargetOf(run);
                    if (!sp || !run._wx)
                        continue;
                    const X = run.exact ? sp._lazy && sp._lazy.x : sp.leafX,
                        Y = run.exact ? sp._lazy && sp._lazy.y : sp.leafY;
                    if (!X)
                        continue;
                    let moved = X.length !== run._wx.length;
                    for (let i = 0; !moved && i < X.length; i++)
                        if (Math.abs(X[i] - run._wx[i]) > 1e-9 || Math.abs(Y[i] - run._wy[i]) > 1e-9)
                            moved = true;
                    if (!moved)
                        continue;
                    const msg = morphTakeEdit(run, sp);
                    if (msg) {
                        n++;
                        flashStatus(msg);
                    }
                }
                if (n) {
                    morphWrite();
                    morphBarSync();
                    _mrSig = '';
                    _tlSig = '';
                    drawAll();
                    scheduleSave();
                }
            } finally {
                _morphAbsorbing = false;
            }
            return n;
        }
        // the rigid motion a pose is carried by at t, undone: a function from the drawing back to the keys'
        function morphUndoCarry(run, t) {
            const steps = [];
            const lk = morphLookTurn(run, t);
            if (lk) {
                const c = morphCentreAt(run, t),
                    cs = Math.cos(-lk),
                    sn = Math.sin(-lk);
                steps.push((x, y) => [c.x + cs * (x - c.x) - sn * (y - c.y), c.y + sn * (x - c.x) + cs * (y - c.y)]);
            }
            const PX = morphParentXform(run, t);
            if (PX) {
                const [ax, ay] = PX.at(0, 0),
                    [bx, by] = PX.at(1, 0),
                    th = Math.atan2(by - ay, bx - ax),
                    cs = Math.cos(-th),
                    sn = Math.sin(-th);
                steps.push((x, y) => [cs * (x - ax) - sn * (y - ay), sn * (x - ax) + cs * (y - ay)]);
            }
            const MX = morphMotionXform(run, t); // PHYSICAL MOTIONS, undone before the path is
            if (MX)
                steps.push((x, y) => MX.inv(x, y));
            if (morphPathOf(run) || run.spin) {
                let ctr;
                if (run.exact)
                    ctr = exactCentre(morphPoseExact(run, t, true));
                else {
                    const N = run.keys[0].x.length,
                        bx = new Float64Array(N),
                        by = new Float64Array(N);
                    morphPoseInto(run, t, bx, by, true);
                    let cx = 0,
                        cy = 0;
                    for (let i = 0; i < N; i++) {
                        cx += bx[i];
                        cy += by[i];
                    }
                    ctr = { x: cx / N, y: cy / N };
                }
                const q = morphPlace(run, t, ctr),
                    cs = Math.cos(-q.turn),
                    sn = Math.sin(-q.turn);
                steps.push((x, y) => [ctr.x + cs * (x - q.x) - sn * (y - q.y), ctr.y + sn * (x - q.x) + cs * (y - q.y)]);
            }
            return (x, y) => {
                let p = [x, y];
                for (const f of steps)
                    p = f(p[0], p[1]);
                return p;
            };
        }
        // the edited live shape taken in as a key; a line for the status bar, or '' when it was not
        function morphTakeEdit(run, sp) {
            if (run.fx && run.fx.kind)
                return 'your edit to morph ' + (morphRuns.indexOf(run) + 1) + ' was not kept: an effect on its detail cannot be carried back to its keys';
            const t = morphLive.t,
                back = morphUndoCarry(run, t),
                K = run.keys.length;
            let key;
            if (run.exact) {
                if (!sp._lazy || sp._lazy.x.length !== run.keys[0].x.length || sp._lazy.open || sp._lazy.holes)
                    return 'your edit to morph ' + (morphRuns.indexOf(run) + 1) + ' was not kept: it changed the shape\'s corners, and every key needs as many';
                key = exactKeyOf(sp);
                for (let j = 0; j < key.x.length; j++) {
                    [key.x[j], key.y[j]] = back(key.x[j], key.y[j]);
                    const e = key.c[j];
                    if (e) {
                        [e[0], e[1]] = back(e[0], e[1]);
                        [e[2], e[3]] = back(e[2], e[3]);
                    }
                }
            } else {
                if (!sp.leafX || sp.leafX.length !== run.keys[0].x.length)
                    return '';
                key = { x: new Float64Array(sp.leafX.length), y: new Float64Array(sp.leafX.length) };
                for (let i = 0; i < sp.leafX.length; i++)
                    [key.x[i], key.y[i]] = back(sp.leafX[i], sp.leafY[i]);
            }
            const u = morphRunT(run, t);
            // on a key: within a step of the bar's track (a thousandth of a loop) of its time, round the loop
            let at = K === 1 ? 0 : -1,
                made = false;
            if (K > 1) {
                const T = morphKeyTimes(run);
                let best = 0.0015;
                T.forEach((v, k) => {
                    const d = K === 2 ? Math.abs(v - u) : Math.min(Math.abs(v - u), 1 - Math.abs(v - u));
                    if (d <= best) {
                        best = d;
                        at = k;
                    }
                });
            }
            if (at >= 0) {
                // On a key: the edit's change, carried back, added to that key, so the key keeps exactly
                // what it was plus what was done to it (the track's step can leave the pose a hair off the
                // key's own time, and a pose a hair into the blend is not quite the key).
                const old = run.keys[at];
                if (run.exact) {
                    const W = run.pose; // what was written: corners and handles
                    if (W && W.x.length === old.x.length) {
                        const nk = exactKeyCopy(old);
                        for (let j = 0; j < nk.x.length; j++) {
                            const [wx, wy] = back(W.x[j], W.y[j]);
                            nk.x[j] += key.x[j] - wx;
                            nk.y[j] += key.y[j] - wy;
                            nk.r[j] = key.r[j];
                            const e = key.c[j],
                                we = W.c[j];
                            if (e && we && nk.c[j]) {
                                const [a0, a1] = back(we[0], we[1]),
                                    [b0, b1] = back(we[2], we[3]);
                                nk.c[j] = [nk.c[j][0] + e[0] - a0, nk.c[j][1] + e[1] - a1, nk.c[j][2] + e[2] - b0, nk.c[j][3] + e[3] - b1];
                            } else
                                nk.c[j] = e;
                        }
                        key = nk;
                    }
                } else if (run._wx && run._wx.length === old.x.length) {
                    const nk = { x: Float64Array.from(old.x), y: Float64Array.from(old.y) };
                    for (let i = 0; i < nk.x.length; i++) {
                        const [wx, wy] = back(run._wx[i], run._wy[i]);
                        nk.x[i] += key.x[i] - wx;
                        nk.y[i] += key.y[i] - wy;
                    }
                    key = nk;
                }
                run.keys[at] = key;
            } else {
                // a new key where you stand; every other key keeps its time
                const T = morphKeyTimes(run).slice();
                let pos = T.filter(v => v < u).length;
                const C = run.cols ? morphColOf(morphColourAt(run, t)) : null;
                if (K === 2) { // a ramp becomes a loop of three, its end just before the loop comes round
                    T[1] = Math.min(T[1], 0.999);
                    pos = 1;
                }
                T.splice(pos, 0, Math.max(0, Math.min(0.998, u)));
                run.keys.splice(pos, 0, key);
                if (run.cols)
                    run.cols.splice(pos, 0, C);
                if (run.eases)
                    run.eases = K === 2 ? new Array(3).fill(run.eases[0]) : (run.eases.splice(pos, 0, run.eases[(pos - 1 + K) % K]), run.eases);
                run.times = morphTimesOk(T, K + 1) ? T : null;
                at = pos;
                made = true;
            }
            if (run.exact)
                run.curved = morphExactCurved(run.keys);
            run._centres = null;
            run.spec = null;
            run.freq = null;
            run._smooth = null;
            run._keyEpoch = (run._keyEpoch || 0) + 1;
            return made ? 'your edit is a new key ' + (at + 1) + ' of ' + run.keys.length + ', where you stand; the other keys keep their times'
                : (K === 1 ? 'your edit is the still\'s shape now' : 'your edit is key ' + (at + 1) + ' now');
        }
        // Every run at the same t. One pass, then ONE draw by the caller — N runs must not mean
        // N redraws of the same frame.
        function morphWrite() {
            for (const run of morphRuns)
                morphWriteRun(run);
        }
        function morphClockStop() {
            if (morphLive.raf) {
                cancelAnimationFrame(morphLive.raf);
                morphLive.raf = 0;
            }
            morphLive.play = false;
            morphLive.last = 0;
        }
        // Drop runs without touching the scene. This is what to do when something ELSE has already
        // replaced the page — a ladder, a fixture, a load — and the shapes the runs were writing
        // into are no longer there: restoring would put old keys back into a drawing that has
        // moved on, and keeping is a no-op because the poses are gone with everything else.
        function morphAbandon(runs) {
            const drop = runs || morphRuns.slice();
            for (const r of drop) {
                if (r.sp) {
                    delete r.sp._fade; // A MORPH THAT PLAYS ONCE: a shape left behind is drawn whole
                    delete r.sp._draw; // DRAWING A LINE ON: and whole
                    delete r.sp._drawRun;
                }
                const i = morphRuns.indexOf(r);
                if (i >= 0)
                    morphRuns.splice(i, 1);
            }
            for (const r of morphRuns) // ONE MORPH RIDING ANOTHER: a parent gone leaves its children where they are
                if (r.parent && morphRuns.indexOf(r.parent) < 0)
                    r.parent = null;
            if (!morphRuns.length) {
                morphClockStop();
                morphLive.path = null; // MOTION ALONG A PATH: the page has moved on without it
            }
            morphBarSync();
        }
        // Called wherever a page might have been swapped underneath a running morph. The check is
        // a reference lookup per run, so it is cheap enough to sit on the selection path, which is
        // the one thing every page-replacing operation in this file ends with.
        let _morphStaleGuard = false;
        function morphCheckStale() {
            if (!morphRuns.length || _morphStaleGuard)
                return;
            const gone = morphRuns.filter(r => !morphTargetOf(r));
            if (!gone.length)
                return;
            _morphStaleGuard = true;
            try {
                morphAbandon(gone);
            } finally {
                _morphStaleGuard = false;
            }
        }
        // A standalone copy of a run's shape as it stands right now. Deliberately minimal and
        // built the same way the live shape was: leaves are the origin, the reference follows.
        function morphPoseClone(sp, label, run) {
            if (run && run.exact) { // an exact morph's pose is kept as an exact shape, corners and all
                const P = exactKeyCopy(run.pose || morphPoseExact(run, morphLive.t)),
                    clone = {
                        refLength: 0,
                        source: 'draw',
                        dirty: false,
                        stroke: sp.stroke || null,
                        lineWidth: sp.lineWidth,
                        fill: sp.fill ? Object.assign({}, sp.fill) : null,
                        gname: label || null
                    };
                makeLazy(clone, P.x, P.y, 0, null, { exact: true, round: hasRound(P.r) ? P.r : null, ctrl: hasCtrl(P.c) ? P.c : null });
                return clone;
            }
            const lx = Float64Array.from(sp.leafX),
                ly = Float64Array.from(sp.leafY);
            return {
                refX: Float64Array.from(lx),
                refY: Float64Array.from(ly),
                leafX: lx,
                leafY: ly,
                srcCoV: 0,
                refLength: 0,
                source: 'draw',
                dirty: false,
                stroke: sp.stroke || null,
                lineWidth: sp.lineWidth,
                fill: sp.fill ? Object.assign({}, sp.fill) : null,
                gname: label || null
            };
        }
        // ── KEEP IS ADDITIVE ─────────────────────────────────────────────────────────
        // The first version of keep was a one-way door: it stopped the morph, froze the pose and
        // consumed the keys, so the only way back to a running morph was two undos and a fresh
        // selection — and the pose you had found was gone with the generator that made it. That
        // contradicted the one claim the live morph is built on. If nothing is baked and every
        // pose is a real shape, then collecting a pose should COST nothing, and the button that
        // collects one should be pressable twice.
        //
        // So keep drops a copy of each run's current pose into the scene, immediately after the
        // live shape, and the morph keeps running. Scrub, keep, scrub, keep and you have built a
        // strip by hand — the same object morphLadder produces in one shot, except that you chose
        // every cell. `exit` is now the only way out, and it still puts the keys back.
        //
        // The old behaviour is still there under shift, because collapsing two shapes into one
        // chosen blend IS a real use — that is the reading where the keys were scaffolding.
        function morphKeep(consume) {
            if (!morphRuns.length)
                return 0;
            if (consume) {
                // Freeze: the live shapes stay exactly where they are and stop being live. Their
                // keys go with the runs, which is the whole point of this reading.
                const n = morphRuns.length;
                morphRunPathsRelease(morphRuns.slice()); // EACH MORPH ITS OWN PATH
                morphPathRelease(true); // MOTION ALONG A PATH: the path back where it was
                morphAbandon();
                rebuildScroller();
                applyShapeSelection(new Set());
                pushHistory();
                scheduleSave();
                drawAll();
                return n;
            }
            let made = 0;
            const label = 'pose t=' + morphLive.t.toFixed(3);
            for (const run of morphRuns) {
                const sp = morphTargetOf(run);
                if (!sp)
                    continue;
                // After the LAST pose this run dropped, not after the live shape — otherwise each keep
                // shoulders in front of the previous one and a hand-built strip reads backwards. If
                // that pose has since been deleted or moved away, fall back to the live shape.
                const anchor = (run.tail && state.subpaths.indexOf(run.tail) >= 0) ? run.tail : sp;
                const clone = morphPoseClone(sp, label, run);
                state.subpaths.splice(state.subpaths.indexOf(anchor) + 1, 0, clone);
                run.tail = clone;
                made++;
            }
            if (!made)
                return 0;
            rebuildSignalSelect();
            rebuildScroller();
            pushHistory();
            scheduleSave();
            drawAll();
            return made;
        }
        // Put every run's keys back where they came from. Each run remembers the subpaths it
        // lifted out, so the restore is a splice AT THE LIVE SHAPE rather than a wholesale swap
        // of state.subpaths — which is what lets several runs exit independently and in any order
        // without fighting over indices, and leaves everything drawn since then alone.
        function morphExit(runs) {
            const list = runs || morphRuns.slice();
            if (!list.length)
                return 0;
            let arr = state.subpaths;
            for (const run of list) {
                if (!run.inPlace) {
                    arr = run.members.slice();
                    continue;
                } // solo owned the whole page
                const out = [];
                let placed = false;
                for (const sp of arr) {
                    if (sp === run.sp) {
                        for (const m of run.members)
                            out.push(m);
                        placed = true;
                    }
                    else
                        out.push(sp);
                }
                // Its slot is gone — something deleted the live shape. The keys still deserve to come
                // back; they go on the end rather than nowhere.
                if (!placed)
                    for (const m of run.members)
                        out.push(m);
                arr = out;
            }
            state.subpaths = arr;
            morphRunPathsRelease(list); // EACH MORPH ITS OWN PATH: each back where it was
            if (morphRuns.every(r => list.indexOf(r) >= 0))
                morphPathRelease(true); // MOTION ALONG A PATH: the path back where it was
            morphAbandon(list);
            rebuildSignalSelect();
            rebuildScroller();
            applyShapeSelection(new Set());
            pushHistory();
            scheduleSave();
            drawAll();
            return list.length;
        }
        // The old two-way entry point, kept because it is what every fixture calls and because
        // "stop, and either keep what is on screen or put it back" is still the honest summary.
        function morphStop(keep) {
            return keep ? morphKeep(true) : morphExit(null);
        }
        function morphTick(now) {
            morphLive.raf = 0;
            if (!morphRuns.length || !morphLive.play)
                return;
            // Something took a live shape out from under us — an undo, a delete, a fixture that
            // rebuilt the page. Drop those runs and carry on with whatever is left.
            morphCheckStale();
            if (!morphRuns.length) {
                morphClockStop();
                morphBarSync();
                drawAll();
                return;
            }
            const dt = morphLive.last ? Math.min(0.1, (now - morphLive.last) / 1000) : 0;
            morphLive.last = now;
            const t1 = morphLive.t + dt * morphLive.speed,
                stop = morphStopsPlayed() ? morphStopCrossed(state.morphStops, morphLive.t, t1) : null;
            if (stop != null) { // STOPS: the clock waits here
                morphLive.t = stop >= 1 ? 1 - 1e-9 : stop;
                morphClockStop();
                morphWrite();
                morphCameraFollow();
                morphBarSync();
                drawAll();
                const i = state.morphStops.indexOf(stop);
                flashStatus(stop >= 1 ? 'the end' + (EMBED ? ' — click to start again' : ' — play starts it again')
                    : 'stop ' + (i + 1) + ' of ' + state.morphStops.length + (EMBED ? ' — click, or →, to go on' : ' — play goes on'));
                return;
            }
            morphLive.t = t1 % 1;
            morphWrite();
            morphCameraFollow(); // A CAMERA
            morphBarSync();
            drawAll();
            morphLive.raf = requestAnimationFrame(morphTick);
        }
        // A CAMERA, AND STOPS, in the editor. The camera moves the view only while the scene is played or
        // scrubbed, so a pan or a zoom of your own, paused, stays yours; the timeline's "camera" switch
        // turns following off altogether. Stops are played through in an embed always, and in the editor
        // when the timeline says so: while you build a scene its loop keeps coming round.
        function morphStopsPlayed() {
            return !!(state.morphStops && state.morphStops.length) && (EMBED || !!state.morphStopsOn);
        }
        function morphCameraFollow() {
            if (!morphRuns.length || !state.morphCamera || !state.morphCamera.length || state.morphCamFollow === false)
                return;
            const B = morphCameraAt(state.morphCamera, morphLive.t);
            if (B)
                morphViewOfBox(B);
        }
        // the view that shows box B whole, centred in the canvas
        function morphViewOfBox(B) {
            const w = cv.clientWidth,
                h = cv.clientHeight,
                hR = state.hRun || 1;
            if (!(w > 0 && h > 0))
                return;
            const bw = Math.max(1e-9, (B[2] - B[0]) / hR),
                bh = Math.max(1e-9, (B[3] - B[1]) / hR);
            state.view.panX = (B[0] + B[2]) / 2 / hR;
            state.view.panY = (B[1] + B[3]) / 2 / hR;
            state.view.zoom = Math.min(w / bw, h / bh) / (Math.min(w, h) * 0.40);
        }
        // what the canvas shows now, as a box in the page's units
        function morphViewBox() {
            const w = cv.clientWidth,
                h = cv.clientHeight,
                a = pxToWorld(0, h, w, h),
                b = pxToWorld(w, 0, w, h);
            return [a.x, a.y, b.x, b.y];
        }
        // go on from a stop (or from the end, start again); or back to the stop before
        function morphStopGo(dir) {
            if (!morphRuns.length)
                return;
            if (dir < 0) {
                morphSetT(morphStopBefore(state.morphStops, morphLive.t));
                return;
            }
            if (morphLive.t >= 1 - 1e-6)
                morphLive.t = 0;
            morphLive.play = true;
            morphLive.last = 0;
            morphBarSync();
            if (!morphLive.raf)
                morphLive.raf = requestAnimationFrame(morphTick);
        }
        function morphLiveStart(o) {
            o = o || {};
            // Solo owns the whole page by definition, so it cannot share it. Anything already
            // running is dropped before it takes over. In place ADDS a run and leaves the others
            // alone — that is the whole point of a list.
            const inPlaceWanted = o.inPlace !== undefined ? !!o.inPlace : (state.morphInPlace !== false);
            if (!inPlaceWanted && morphRuns.length)
                morphAbandon();
            const sel = selectedIndices();
            // ONE SHAPE GOES LIVE TOO (DETAIL EFFECTS): a single key is a still, which an effect animates.
            if (sel.length < 1) {
                flashStatus('morph: select one shape to animate, or two or more to blend between');
                return null;
            }
            // MORPHS THAT KEEP THEIR CORNERS: exact shapes (closed, no holes) morph as exact shapes, their
            // corners, radii and curve edges blended, unless the panel's switch says leaves. Asked
            // before anything reads their leaves, which would turn them into leaves.
            // DRAWING A LINE ON (28 Oct 2026, Tom: "1-3", for explainers): open lines go live too, as lines,
            // when every key is one with the same number of corners (an arrow drawn on is one key, a
            // line bending into another is two). Nothing pairs or rolls their corners: a line's ends are
            // its ends.
            const openMode = state.morphCorners !== false && sel.length >= 1 && sel.every(i => {
                const sp = state.subpaths[i];
                return sp && sp._lazy && sp._lazy.exact && sp._lazy.open && sp._lazy.x.length >= 2
                    && sp._lazy.x.length === state.subpaths[sel[0]]._lazy.x.length;
            });
            // HOLES THAT RIDE A STILL: one shape with holes goes live exact too, its holes carried by its pose
            const exactMode = openMode || (state.morphCorners !== false && sel.every(i => {
                const sp = state.subpaths[i];
                return sp && sp._lazy && sp._lazy.exact && !sp._lazy.open && (!sp._lazy.holes || sel.length === 1) && sp._lazy.x.length >= 3;
            }));
            const idx = exactMode ? sel.slice() : sel.filter(i => {
                const sp = state.subpaths[i];
                return sp && sp.leafX && sp.leafX.length >= 3;
            });
            if (idx.length < 1) {
                flashStatus('morph: those shapes have no leaves');
                return null;
            }
            const src = idx.map(i => state.subpaths[i]);
            const hR = state.hRun || 1,
                align = o.align !== false;
            const inPlace = inPlaceWanted;
            const lag = Math.max(0, Math.min(MORPH_LAG_MAX, o.lag !== undefined ? +o.lag : (+state.morphLag || 0)));
            // Selecting another run's live shape as a key CONSUMES that run: its shape is about to
            // leave the scene, so it cannot stay live. Its original keys are inherited by the new
            // run rather than dropped, so `exit` still unwinds all the way back to what you drew —
            // one press, however many morphs deep the selection went.
            const eaten = morphRuns.filter(r => src.indexOf(r.sp) >= 0);
            const members = [];
            for (const sp of src) {
                const owner = eaten.find(r => r.sp === sp);
                if (owner) {
                    for (const m of owner.members)
                        members.push(m);
                }
                else
                    members.push(sp);
            }
            let N, keys, holes = null;
            if (openMode) {
                keys = src.map(exactKeyOf);
                if (!inPlace)
                    for (const K of keys) {
                        const c = exactCentre(K);
                        exactMove(K, -c.x, -c.y);
                    }
                N = keys[0].x.length;
            } else if (exactMode) {
                keys = morphExactKeys(src, inPlace, align);
                N = keys[0].x.length;
                if (src.length === 1 && src[0]._lazy.holes) { // HOLES THAT RIDE A STILL: in the key's own frame
                    const lz = src[0]._lazy,
                        mean = A => A.reduce((q, v) => q + v, 0) / A.length,
                        dx = mean(keys[0].x) - mean(lz.x),
                        dy = mean(keys[0].y) - mean(lz.y);
                    holes = (lzHolesBaked(lz) || []).map(h => ({
                        x: Float64Array.from(h.x, v => v + dx),
                        y: Float64Array.from(h.y, v => v + dy),
                        smooth: h.smooth ? Uint8Array.from(h.smooth) : null,
                        ctrl: h.ctrl ? h.ctrl.map(q => q ? [q[0] + dx, q[1] + dy, q[2] + dx, q[3] + dy] : null) : null
                    }));
                }
            } else {
                N = Math.max(...src.map(sp => sp.leafX.length));
                // Two copies of every key: one centred, one where it stands. The centred set is what
                // the alignment is measured on and what a solo morph blends; the standing set is what
                // an in-place morph blends, so the pose travels between the two positions the drawing
                // already put them in. resample is a kernel interpolation whose weights sum to one, so
                // it commutes with the translation and the pair stays a pair.
                const cen = [],
                    raw = [];
                for (const sp of src) {
                    let cx = 0,
                        cy = 0;
                    const n = sp.leafX.length;
                    for (let k = 0; k < n; k++) {
                        cx += sp.leafX[k];
                        cy += sp.leafY[k];
                    }
                    cx /= n;
                    cy /= n;
                    let R = new tvf.Shape(Float64Array.from(sp.leafX, v => v / hR),
                    Float64Array.from(sp.leafY, v => v / hR));
                    let C = new tvf.Shape(Float64Array.from(sp.leafX, v => (v - cx) / hR),
                    Float64Array.from(sp.leafY, v => (v - cy) / hR));
                    if (R.N !== N) {
                        R = R.resample(N);
                        C = C.resample(N);
                    }
                    raw.push(R);
                    cen.push(C);
                }
                const plans = cen.map((S, i) => (i === 0 || !align) ? null : morphAlignPlan(cen[0], S));
                const base = inPlace ? raw : cen;
                keys = base.map((S, i) => morphApplyPlan(S, plans[i])).map(S => ({
                    x: Float64Array.from(S.x, v => v * hR),
                    y: Float64Array.from(S.y, v => v * hR)
                }));
            }

            if (state.editMode)
                exitEditMode();
            // an exact morph's live shape is an exact shape, made again every frame (morphWriteExact)
            const sp0 = exactMode ? {
                refLength: 0,
                source: 'draw',
                dirty: false,
                stroke: src[0].stroke || null,
                lineWidth: src[0].lineWidth,
                strokeOpacity: src[0].strokeOpacity,
                lineStyle: src[0].lineStyle || null, // an arrow keeps its heads
                fill: src[0].fill || null
            } : {
                refX: new Float64Array(N),
                refY: new Float64Array(N),
                leafX: new Float64Array(N),
                leafY: new Float64Array(N),
                srcCoV: 0,
                refLength: 0,
                source: 'draw',
                dirty: false,
                stroke: src[0].stroke || null,
                lineWidth: src[0].lineWidth,
                fill: src[0].fill || null
            };
            const run = {
                keys,
                exact: exactMode, // MORPHS THAT KEEP THEIR CORNERS
                open: openMode, // DRAWING A LINE ON: a line
                holes, // HOLES THAT RIDE A STILL
                curved: exactMode ? morphExactCurved(keys) : null,
                cols: morphColsOf(src.map(sp => sp.fill)), // COLOUR THAT MORPHS
                sp: sp0,
                inPlace,
                lag: exactMode ? 0 : lag,
                spec: null,
                freq: null,
                fx: exactMode ? null : state.morphFx ? { kind: state.morphFx, amount: state.morphFxAmount != null ? state.morphFxAmount : 0.5 } : null, // DETAIL EFFECTS
                // For solo the run owned the whole page, so what it has to put back IS the whole page.
                members: inPlace ? members : state.subpaths.slice(),
            };
            if (eaten.length)
                morphAbandon(eaten);
            morphRuns.push(run);
            // The clock is shared, so a NEW run does not reset it — the others are mid-flight and
            // yanking t back to 0 would jump every one of them. Only the first run sets the clock.
            if (morphRuns.length === 1) {
                morphLive.t = 0;
                morphClockStop();
                state.morphCamera = []; // A CAMERA, AND STOPS: a new scene's, not the last one's
                state.morphStops = [];
            }
            state.selected.clear();
            state.activeSet = new Set();
            state.activeSp = -1;
            if (inPlace) {
                // The live shape takes the FIRST key's slot, so it lands in the drawing order its
                // sources occupied rather than on top of everything.
                const drop = new Set(idx),
                    at = Math.min(...idx),
                    kept = [];
                for (let i = 0; i < state.subpaths.length; i++) {
                    if (i === at)
                        kept.push(sp0);
                    if (!drop.has(i))
                        kept.push(state.subpaths[i]);
                }
                state.subpaths = kept;
            } else {
                state.subpaths = [sp0];
                state.svgName = 'morph · live · ' + keys.length + ' keys' + (align ? '' : ' · unaligned');
                state.lastLoadInfo = {
                    totalElements: 1,
                    multiSubpath: false,
                    subpathCount: 1
                };
            }
            morphWrite();
            rebuildSignalSelect();
            rebuildScroller();
            closeMenu();
            applyShapeSelection(new Set());
            // No camera move in place. The scene is standing and the whole reason to morph in it is
            // to judge the pose against its neighbours — a refit would throw that comparison away.
            if (!inPlace)
                fitToView(null);
            morphBarSync();
            drawAll();
            pushHistory();
            scheduleSave();
            flashStatus('morph live · ' + keys.length + (exactMode ? ' keys of ' + N + ' corners, kept sharp (an exact morph: the lag and the effects act on leaves, so they wait)' : ' keys at N=' + N)
            + (inPlace ? ' · in place — the other ' + (state.subpaths.length - 1) + ' shape'
            + (state.subpaths.length === 2 ? '' : 's') + ' and the camera are untouched,'
            + ' and the pose travels between the positions you drew them at'
            : ' · solo — the page is the morph, each key on its own centroid')
            + (morphRuns.length > 1 ? ' · ' + morphRuns.length + ' morphs are now live and they share one clock,'
            + ' so `run` moves all of them together' : '')
            + (keys.length === 1 ? ' — one key, a still: pick an effect in the bar to animate it' : keys.length === 2 ? ' — t is a straight lerp between them'
            : ' — the keys sit on a time circle, weighted by the same cardinal kernel that reconstructs a contour, so the loop closes')
            + (lag > 0 ? ' · detail lag ' + lag.toFixed(2) + ': the silhouette arrives first and the fine harmonics follow it by an octave-spaced stagger' : '')
            + ' · nothing is baked: `keep` drops a copy of the pose you are looking at and leaves the morph running, `exit` puts the keys back');
            return keys.length;
        }

        // ── DETAIL EFFECTS (25 Oct 2026, Tom: "yes, proceed") ──────────────────────────
        // A shape's outline is its harmonics: the centroid, the base circle, then finer and finer
        // detail, an octave at a time (morphFreqScale lays them from 0, the base, to 1, the finest).
        // So an effect can move the detail and leave the silhouette alone, which a drawing tool that
        // holds points cannot. Each pose of a live morph (or a single shape gone live, a still) is
        // taken to its harmonics after the blend, each harmonic changed by where it sits on that
        // scale and by the clock, and brought back:
        //   shimmer  the fine harmonics turn a little to and fro, each at its own whole number of
        //            cycles a loop, so the edge ripples while the shape stays put;
        //   grow     the detail arrives octave by octave over the first half of the loop, from the
        //            base ellipse to the whole shape, and leaves again over the second;
        //   boil     the fine harmonics swell and turn by uneven amounts, a calm outline seething.
        // h and N - h (the two directions of one harmonic) always share a change, so every frame is
        // a closed curve; every rate is a whole number of cycles a loop, so the loop is seamless.
        // `amount` (0 to 1) scales the effect. A key is no longer exact where an effect moves it:
        // the effect is on top of the timeline, not in it.
        const MORPH_FX = ['shimmer', 'grow', 'boil'];
        function fxHash(m, salt) {
            const v = Math.sin(m * 127.1 + salt * 311.7) * 43758.5453;
            return v - Math.floor(v);
        }
        const fxSmooth = (a, b, x) => {
            const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
            return u * u * (3 - 2 * u);
        };
        function morphApplyFx(run, X, Y, t) {
            const N = X.length,
                half = N >> 1,
                fx = run.fx,
                amt = Math.max(0, Math.min(1, fx.amount != null ? +fx.amount : 0.5));
            if (!(amt > 0) || N < 4)
                return;
            if (!run.fxFreq || run.fxFreq.length !== N)
                run.fxFreq = morphFreqScale(N);
            const f = run.fxFreq,
                S = morphFwd(Float64Array.from(X), Float64Array.from(Y)),
                re = S.re,
                im = S.im,
                tri = 1 - Math.abs(2 * t - 1); // 0 at the loop's ends, 1 half way
            for (let h = 0; h < N; h++) {
                const m = h <= half ? h : N - h,
                    fh = f[h];
                if (fh <= 0)
                    continue; // the centroid and the base circle never move
                let g = 1,
                    phi = 0;
                if (fx.kind === 'shimmer') {
                    const s = fxSmooth(0.3, 0.65, fh),
                        c = 1 + Math.floor(fxHash(m, 1) * 3);
                    phi = amt * 0.9 * s * Math.sin(TAU * (c * t + fxHash(m, 2)));
                } else if (fx.kind === 'grow') {
                    const L = (1 - amt) + amt * tri; // how far up the scale the detail has come
                    g = Math.max(0, Math.min(1, (L - fh) / 0.12 + 0.5));
                } else if (fx.kind === 'boil') {
                    const s = fxSmooth(0.2, 0.55, fh),
                        c1 = 1 + Math.floor(fxHash(m, 3) * 5),
                        c2 = 1 + Math.floor(fxHash(m, 4) * 5);
                    g = 1 + amt * 0.5 * s * Math.sin(TAU * (c1 * t + fxHash(m, 5)));
                    phi = amt * 0.8 * s * Math.sin(TAU * (c2 * t + fxHash(m, 6)));
                }
                if (g === 1 && phi === 0)
                    continue;
                const c = Math.cos(phi) * g,
                    sn = Math.sin(phi) * g,
                    a = re[h],
                    b = im[h];
                re[h] = a * c - b * sn;
                im[h] = a * sn + b * c;
            }
            const out = morphInv(re, im);
            X.set(out.re);
            Y.set(out.im);
        }
        function morphSetFx(kind, amount) {
            for (const run of morphRuns) {
                run.fx = { kind: MORPH_FX.includes(kind) ? kind : '', amount: amount != null ? amount : (run.fx ? run.fx.amount : 0.5) };
            }
            state.morphFx = MORPH_FX.includes(kind) ? kind : '';
            state.morphFxAmount = amount != null ? amount : (state.morphFxAmount != null ? state.morphFxAmount : 0.5);
            morphWrite();
            morphBarSync();
            drawAll();
            scheduleSave();
            morphHistorySoon();
        }

        // ── EASING AND HOLDS (25 Oct 2026, Tom: "1,2") ───────────────────────────────────
        // Time on the loop is warped before the keys are weighed. Each stretch from one key to the
        // next is held still for `hold` of its length (half at each end) and eased across the rest:
        // in and out (slow from a key and into the next), in (slow away from a key), out (slow into
        // the next). A key's own time maps to itself, so a key is still exact at its place, and the
        // warp is the same on every stretch, so the loop stays seamless. An effect and a path keep
        // the clock's own time: the shimmer and the ride do not stop for a hold.
        // ANTICIPATION AND OVERSHOOT (27 Oct 2026, Tom: "1,3"): three more, the cartoon's own. They
        // leave [0, 1] on the way, so a pose goes past its keys: 'anticipate' draws back first, against
        // the way it is going, then goes; 'overshoot' goes past the next key and comes back to it;
        // 'elastic' goes past and rings, smaller each time, settling on the key. Each is 0 at 0 and
        // exactly 1 at 1, so a key is still exact at its time. Two keys extrapolate on their own
        // (the weights 1 − v and v); three or more do it in morphWeightsOf, along the stretch.
        const MORPH_EASES = ['inout', 'in', 'out', 'anticipate', 'overshoot', 'elastic'],
            MORPH_BACK = 1.70158; // the classic back ease's constant: about a tenth past (or behind)
        // A CURVE OF ITS OWN (29 Oct 2026, Tom: "Yes", to keeping Lottie's own eases when it is read into a scene): a
        // stretch's ease may also be a cubic Bézier [x1, y1, x2, y2] from (0, 0) to (1, 1), as CSS's cubic-bezier()
        // and After Effects' keyframe handles are: x the stretch's time, y how far along. x1 and x2 are kept in
        // [0, 1] so time only goes forward; y may leave it, overshooting as 'overshoot' does.
        function morphBezierEase(u, q) {
            if (u <= 0)
                return 0;
            if (u >= 1)
                return 1;
            const B = (s, a, b) => 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
            let lo = 0,
                hi = 1,
                s = u;
            for (let i = 0; i < 40; i++) { // x(s) is increasing in s, so halving finds the s with x(s) = u
                s = (lo + hi) / 2;
                if (B(s, q[0], q[2]) < u)
                    lo = s;
                else
                    hi = s;
            }
            return B(s, q[1], q[3]);
        }
        const morphBezierOk = q => Array.isArray(q) && q.length === 4 && q.every(v => Number.isFinite(+v)) && q[0] >= 0 && q[0] <= 1 && q[2] >= 0 && q[2] <= 1;
        function morphEase(u, e) {
            if (e === undefined)
                e = state.morphEase;
            if (Array.isArray(e))
                return morphBezierEase(u, e);
            if (e === 'inout')
                return u * u * (3 - 2 * u);
            if (e === 'in')
                return u * u;
            if (e === 'out')
                return 1 - (1 - u) * (1 - u);
            if (e === 'anticipate')
                return u * u * ((MORPH_BACK + 1) * u - MORPH_BACK);
            if (e === 'overshoot') {
                const q = u - 1;
                return 1 + q * q * ((MORPH_BACK + 1) * q + MORPH_BACK);
            }
            if (e === 'elastic') {
                if (u <= 0)
                    return 0;
                const ring = v => 1 - Math.pow(2, -10 * v) * Math.cos(3 * Math.PI * v);
                return ring(u) + u * (1 - ring(1)); // the last ring's leftover taken out, so 1 at 1
            }
            return u;
        }
        // KEYS AT CHOSEN TIMES, AND EACH STEP ITS OWN EASE (25 Oct 2026, Tom: "2,5,3,1"). The keys sat
        // evenly round the loop. Now a morph may put each key at a time of its own (run.times, on its
        // own clock: with two keys a start and an end in [0, 1], with three or more increasing in
        // [0, 1), the last stretch going round to the first), and give each stretch between keys an
        // ease of its own (run.eases[k], the stretch from key k to the next: 'linear', 'inout', 'in',
        // 'out', or null for the bar's). The kernel still weighs keys at even places; the warp below
        // carries each chosen stretch onto its even one, so a key is still exact at its own time and
        // the loop still closes. Two keys hold the first before its time and the last after.
        function morphKeyTimes(run) {
            const K = run.keys.length;
            return run.times && run.times.length === K ? run.times : morphKeyPhases(K);
        }
        // times a morph of K keys can take: increasing, in [0, 1] for two keys, in [0, 1) for more
        function morphTimesOk(T, K) {
            if (!Array.isArray(T) || T.length !== K || K < 2)
                return false;
            for (let k = 0; k < K; k++)
                if (!Number.isFinite(+T[k]) || T[k] < 0 || T[k] > (K === 2 ? 1 : 0.9999) || (k && !(T[k] > T[k - 1] + 1e-4)))
                    return false;
            return true;
        }
        function morphEasesOk(E, K) {
            return Array.isArray(E) && E.length === (K === 2 ? 1 : K) && E.every(e => e == null || e === 'linear' || MORPH_EASES.includes(e) || morphBezierOk(e));
        }
        // the stretch t is in (from key k), and how far along it, on the morph's own clock
        function morphStretchOf(run, t) {
            const K = run.keys.length,
                T = morphKeyTimes(run);
            if (K === 2)
                return { k: 0, u: Math.max(0, Math.min(1, (t - T[0]) / ((T[1] - T[0]) || 1))) };
            const tt = ((t % 1) + 1) % 1;
            let k = K - 1;
            for (let i = 0; i < K; i++)
                if (T[i] <= tt)
                    k = i;
            const lo = T[k],
                hi = k + 1 < K ? T[k + 1] : T[0] + 1,
                x = tt < lo ? tt + 1 : tt;
            return { k, u: (x - lo) / (hi - lo) };
        }
        function morphWarp(t, K, run) {
            return morphWarpOf(t, K, run).t;
        }
        // the keys' weights at t, warped; past a key (an ease that overshoots or draws back) the pose
        // goes on along the line from one key to the next, which meets the kernel exactly at the key
        // STRAIGHT FROM KEY TO KEY (28 Oct 2026, for explainers): three keys or more are blended through the
        // even kernel, which carries the pose smoothly through every key but lets each feel the others between
        // them, so two keys alike do not hold still. A run marked `straight` blends each stretch from its two keys
        // only, as an overshooting ease already does: a key repeated holds, and a move happens where it is put.
        function morphWeightsOf(t, K, run) {
            const W = morphWarpOf(t, K, run);
            if (K > 2 && W.f != null && ((run && run.straight) || W.f < 0 || W.f > 1)) {
                const w = new Float64Array(K);
                w[W.k] = 1 - W.f;
                w[(W.k + 1) % K] = W.f;
                return w;
            }
            return morphWeights(W.t, K);
        }
        function morphWarpOf(t, K, run) {
            const hold = Math.max(0, Math.min(0.9, +state.morphHold || 0)),
                own = run && (run.times || run.eases || run.straight);
            if (K < 2 || (!own && !(hold > 0) && !MORPH_EASES.includes(state.morphEase)))
                return { t, f: null };
            let k, u;
            if (run && run.keys.length === K)
                ({ k, u } = morphStretchOf(run, t));
            else if (K === 2) {
                k = 0;
                u = Math.max(0, Math.min(1, t));
            } else {
                const tt = ((t % 1) + 1) % 1;
                k = ((Math.floor(tt * K - 0.5) % K) + K) % K;
                u = ((tt - (k + 0.5) / K) % 1 + 1) % 1 * K;
            }
            const a = K === 2 ? 0 : (k + 0.5) / K,
                b = K === 2 ? 1 : a + 1 / K;
            let v = hold > 0 ? Math.max(0, Math.min(1, (u - hold / 2) / (1 - hold))) : u;
            const e = run && run.eases && run.eases[k] != null ? run.eases[k] : undefined;
            v = morphEase(v, e === 'linear' ? '' : e);
            const r = a + Math.max(0, Math.min(1, v)) * (b - a);
            return { t: K === 2 ? a + v * (b - a) : ((r % 1) + 1) % 1, k, f: v };
        }
        // a key moved to a time of its own, kept between its neighbours (the first two keys of a ramp
        // in [0, 1], a loop's in [0, 1)); every live morph selected with as many keys moves with it
        const MORPH_KEY_GAP = 0.01;
        function morphKeyTimeClamp(T, k, v) {
            const K = T.length,
                lo = k ? T[k - 1] + MORPH_KEY_GAP : 0,
                hi = k + 1 < K ? T[k + 1] - MORPH_KEY_GAP : (K === 2 ? 1 : 0.999);
            return Math.max(lo, Math.min(hi, v));
        }
        function morphSetKeyTime(runs, k, v) {
            if (!runs.length)
                return null;
            const T = morphKeyTimes(runs[0]).slice();
            if (k < 0 || k >= T.length)
                return null;
            T[k] = morphKeyTimeClamp(T, k, v);
            for (const r of runs)
                if (r.keys.length === T.length) {
                    r.times = T.slice();
                    r._centres = null;
                }
            return T[k];
        }
        function morphSetStepEase(runs, k, e) {
            for (const r of runs) {
                const n = r.keys.length === 2 ? 1 : r.keys.length;
                if (k < 0 || k >= n)
                    continue;
                const E = r.eases && r.eases.length === n ? r.eases.slice() : new Array(n).fill(null);
                E[k] = e === 'linear' || MORPH_EASES.includes(e) ? e : null;
                r.eases = E.every(x => x == null) ? null : E;
                r._centres = null;
            }
        }
        function morphEvenTimes(runs) {
            for (const r of runs) {
                r.times = null;
                r.eases = null;
                r._centres = null;
            }
        }
        function morphSetTiming(ease, hold) {
            if (ease != null)
                state.morphEase = MORPH_EASES.includes(ease) ? ease : '';
            if (hold != null)
                state.morphHold = Math.max(0, Math.min(0.9, +hold));
            for (const r of morphRuns)
                r._centres = null;
            morphWrite();
            morphBarSync();
            drawAll();
            scheduleSave();
            morphHistorySoon();
        }

        // ── MORPHS THAT KEEP THEIR CORNERS (25 Oct 2026, Tom: "1,2") ───────────────────────
        // Leaves are band-limited, so a square blended through leaves arrives with its corners
        // rounded off. Exact shapes need not go through leaves at all: their corners, their radii
        // and their curve edges are numbers, and numbers blend. So when every key is an exact
        // closed shape the morph is exact: the live shape is an exact shape at every frame, its
        // corners where the blend puts them, each radius blended, each curved edge's two handles
        // blended (an edge curved in any key is a cubic in all of them, a straight edge being the
        // cubic with its handles at the thirds, which draws the same line). Sharp corners stay sharp.
        //
        // Keys need as many corners each. A key with fewer is given more by splitting its edges:
        // a curved edge at its middle (de Casteljau, so it draws the same curve), a straight one
        // between its rounded ends (so no radius has less room than it had); the edge with most to
        // give first. Then every key is wound the way the first is, and turned (which corner is
        // first) to the one that moves the corners least, measured about each key's centre.
        //
        // The lag and the detail effects work on a shape's harmonics, which an exact morph does not
        // have, so they wait for a leaf morph; the path, the trails, the timeline and the
        // recordings all work. The panel's "keep corners" switch, off, morphs exact shapes as leaves.
        function exactKeyOf(sp) {
            const lz = sp._lazy,
                X = Float64Array.from(lz.x),
                Y = Float64Array.from(lz.y),
                n = X.length;
            const R0 = lzRoundBaked(lz),
                S = lz.smooth,
                C = lzCtrlBaked(lz);
            const r = new Float64Array(n),
                c = new Array(n).fill(null);
            for (let k = 0; k < n; k++) {
                r[k] = R0 && R0[k] > 0 && !(S && S[k]) ? R0[k] : 0;
                const cc = lz.open && k === n - 1 ? null : edgeCtrl(X, Y, S, !!lz.open, k, (k + 1) % n, C);
                c[k] = cc ? [cc.c1x, cc.c1y, cc.c2x, cc.c2y] : null;
            }
            return { x: X, y: Y, r, c };
        }
        function exactKeyCopy(P) {
            return { x: Float64Array.from(P.x), y: Float64Array.from(P.y), r: Float64Array.from(P.r), c: P.c.map(e => e ? e.slice() : null) };
        }
        // how far along each end of a straight edge its corner's rounding reaches (0 if none)
        function exactTangentLen(K, k) {
            const n = K.x.length;
            if (!(K.r[k] > 0) || K.c[k] || K.c[(k - 1 + n) % n])
                return 0;
            const g = cornerArc(K.x, K.y, k, false, K.r[k]);
            return g ? g.t : 0;
        }
        // one more corner: the edge with most room split, the drawn outline unchanged
        function exactSplitOne(K) {
            const n = K.x.length;
            let best = -1,
                bestScore = -Infinity,
                bestAt = 0.5;
            for (let e = 0; e < n; e++) {
                const f = (e + 1) % n,
                    L = Math.hypot(K.x[f] - K.x[e], K.y[f] - K.y[e]);
                let score,
                    at = 0.5;
                if (K.c[e])
                    score = L;
                else {
                    const te = exactTangentLen(K, e),
                        tf = exactTangentLen(K, f);
                    score = L - 2 * te - 2 * tf;
                    if (L > 0)
                        at = (L + 2 * te - 2 * tf) / (2 * L);
                }
                if (score > bestScore) {
                    bestScore = score;
                    best = e;
                    bestAt = at;
                }
            }
            const e = best,
                f = (e + 1) % n,
                x0 = K.x[e],
                y0 = K.y[e],
                x3 = K.x[f],
                y3 = K.y[f],
                c = K.c[e];
            let mx,
                my,
                cA = null,
                cB = null;
            if (c) {
                const [x1, y1, x2, y2] = c;
                const ax = (x0 + x1) / 2,
                    ay = (y0 + y1) / 2,
                    bx = (x1 + x2) / 2,
                    by = (y1 + y2) / 2,
                    dx = (x2 + x3) / 2,
                    dy = (y2 + y3) / 2;
                const ex = (ax + bx) / 2,
                    ey = (ay + by) / 2,
                    gx = (bx + dx) / 2,
                    gy = (by + dy) / 2;
                mx = (ex + gx) / 2;
                my = (ey + gy) / 2;
                cA = [ax, ay, ex, ey];
                cB = [gx, gy, dx, dy];
            } else {
                mx = x0 + bestAt * (x3 - x0);
                my = y0 + bestAt * (y3 - y0);
            }
            const ins = (arr, v) => {
                const a = Array.from(arr);
                a.splice(e + 1, 0, v);
                return Float64Array.from(a);
            };
            K.x = ins(K.x, mx);
            K.y = ins(K.y, my);
            K.r = ins(K.r, 0);
            const cs = K.c.slice();
            cs.splice(e, 1, cA, cB);
            K.c = cs;
        }
        // the drawn outline as points, and its centre (by length along it)
        function exactDenseOf(K) {
            return exactDense(K.x, K.y, hasRound(K.r) ? K.r : null, false, null, hasCtrl(K.c) ? K.c : null);
        }
        function exactCentre(K) {
            const D = exactDenseOf(K),
                n = D.x.length;
            let sx = 0,
                sy = 0,
                sl = 0;
            for (let i = 0; i < n; i++) {
                const j = (i + 1) % n,
                    l = Math.hypot(D.x[j] - D.x[i], D.y[j] - D.y[i]);
                sx += l * (D.x[i] + D.x[j]) / 2;
                sy += l * (D.y[i] + D.y[j]) / 2;
                sl += l;
            }
            return sl > 0 ? { x: sx / sl, y: sy / sl } : { x: D.x[0], y: D.y[0] };
        }
        function exactArea(K) {
            const D = exactDenseOf(K),
                n = D.x.length;
            let a = 0;
            for (let i = 0; i < n; i++) {
                const j = (i + 1) % n;
                a += D.x[i] * D.y[j] - D.x[j] * D.y[i];
            }
            return a / 2;
        }
        function exactReverse(K) {
            const n = K.x.length,
                o = exactKeyCopy(K);
            for (let j = 0; j < n; j++) {
                K.x[j] = o.x[n - 1 - j];
                K.y[j] = o.y[n - 1 - j];
                K.r[j] = o.r[n - 1 - j];
                const e = o.c[(n - 2 - j + n) % n];
                K.c[j] = e ? [e[2], e[3], e[0], e[1]] : null;
            }
        }
        function exactRoll(K, s) {
            const n = K.x.length,
                o = exactKeyCopy(K);
            for (let j = 0; j < n; j++) {
                const i = (j + s) % n;
                K.x[j] = o.x[i];
                K.y[j] = o.y[i];
                K.r[j] = o.r[i];
                K.c[j] = o.c[i];
            }
        }
        function exactMove(K, dx, dy) {
            for (let j = 0; j < K.x.length; j++) {
                K.x[j] += dx;
                K.y[j] += dy;
                const e = K.c[j];
                if (e) {
                    e[0] += dx;
                    e[1] += dy;
                    e[2] += dx;
                    e[3] += dy;
                }
            }
        }
        // A rounded corner's arc as an edge of its own: the corner becomes the two points where the
        // rounding meets its edges, and the edge between them the arc's cubic. Drawn the same. Done to
        // every key of a morph that has curve edges, because a rounding is drawn only between two
        // straight edges, and in a blended pose any edge curved in some key is a cubic: left as a
        // radius, a rounded square going to a circle would lose its rounding the moment it moved.
        function exactBakeRounds(K) {
            const n = K.x.length,
                X = [], Y = [], C = [];
            let changed = false;
            for (let k = 0; k < n; k++) {
                const p = (k - 1 + n) % n;
                const g = K.r[k] > 0 && !K.c[k] && !K.c[p] ? cornerArc(K.x, K.y, k, false, K.r[k]) : null;
                if (g) {
                    const h = (4 / 3) * Math.tan((Math.PI - g.phi) / 4) * g.r,
                        ux = (g.t1x - K.x[k]) / g.t,
                        uy = (g.t1y - K.y[k]) / g.t,
                        vx = (g.t2x - K.x[k]) / g.t,
                        vy = (g.t2y - K.y[k]) / g.t;
                    X.push(g.t1x, g.t2x);
                    Y.push(g.t1y, g.t2y);
                    C.push([g.t1x - ux * h, g.t1y - uy * h, g.t2x - vx * h, g.t2y - vy * h], K.c[k]);
                    changed = true;
                } else {
                    X.push(K.x[k]);
                    Y.push(K.y[k]);
                    C.push(K.c[k]);
                }
            }
            if (!changed)
                return;
            K.x = Float64Array.from(X);
            K.y = Float64Array.from(Y);
            K.r = new Float64Array(X.length);
            K.c = C;
        }
        // the keys of an exact morph: as many corners each, wound and turned alike; centred for a solo morph
        function morphExactKeys(src, inPlace, align) {
            const base = src.map(exactKeyOf);
            if (base.some(K => K.c.some(Boolean)) && base.some(K => hasRound(K.r)))
                base.forEach(exactBakeRounds);
            const n0 = Math.max(...base.map(K => K.x.length));
            // The keys at N corners each, wound and turned like the first; with the mean squared
            // distance the corners travel, relative to the first key's size.
            const at = N => {
                const keys = base.map(exactKeyCopy);
                for (const K of keys)
                    while (K.x.length < N)
                        exactSplitOne(K);
                const c0 = exactCentre(keys[0]),
                    wind = Math.sign(exactArea(keys[0]));
                let total = 0;
                for (let k = 1; k < keys.length; k++) {
                    const K = keys[k];
                    if (!align)
                        continue;
                    if (Math.sign(exactArea(K)) !== wind)
                        exactReverse(K);
                    const ck = exactCentre(K);
                    let best = 0,
                        bestCost = Infinity;
                    for (let s = 0; s < N; s++) {
                        let cost = 0;
                        for (let j = 0; j < N; j++) {
                            const i = (j + s) % N,
                                dx = (K.x[i] - ck.x) - (keys[0].x[j] - c0.x),
                                dy = (K.y[i] - ck.y) - (keys[0].y[j] - c0.y);
                            cost += dx * dx + dy * dy;
                        }
                        if (cost < bestCost) {
                            bestCost = cost;
                            best = s;
                        }
                    }
                    if (best)
                        exactRoll(K, best);
                    total += bestCost / N;
                }
                return { keys, cost: total / Math.max(1e-12, Math.abs(exactArea(keys[0]))) };
            };
            // WHICH CORNER GOES TO WHICH (25 Oct 2026). A square and a circle drawn from 0° have four
            // corners each, but the square's are at 45° and the circle's at 0°, 90°…: matched one to one
            // the square turns and leans on its way. With every edge split once more both have a corner
            // at 45° and the match is right. So twice the corners is tried too, and kept when the
            // corners travel much less (under half as far, squared): more corners are not free, every
            // pose carries them, so a morph that matches well already keeps the count it had.
            let pick = at(n0);
            if (align && base.length > 1 && pick.cost > 1e-6) {
                const twice = at(2 * n0);
                if (twice.cost < 0.5 * pick.cost)
                    pick = twice;
            }
            const keys = pick.keys;
            if (!inPlace)
                for (const K of keys) {
                    const c = exactCentre(K);
                    exactMove(K, -c.x, -c.y);
                }
            return keys;
        }
        // which edges are curved in some key (they are cubics in every pose)
        function morphExactCurved(keys) {
            const n = keys[0].x.length,
                out = new Uint8Array(n);
            for (const K of keys)
                for (let e = 0; e < n; e++)
                    if (K.c[e])
                        out[e] = 1;
            return out;
        }
        // SMOOTH WHERE ANY KEY IS SMOOTH (25 Oct 2026, Tom: "2,5,3,1"). A corner smooth in one key
        // (its two handles in line, as all of a circle's are) and sharp in another (a square's) used
        // to blend to a corner half-way bent: a kink at every corner, all the way from the square to
        // the circle. Such a corner is now smooth in every pose but the sharp key itself. In that
        // key its straight edges hold their handles at the corner (a cubic with a handle on its end
        // still draws the straight line), so the blended handles grow from nothing as the morph
        // leaves the square: the corner opens like a rounding getting bigger. Then the two blended
        // handles are put in line, each keeping its length, which only straightens what the blend
        // left a little bent. A corner sharp in some key with a curved edge at an angle is a real
        // corner, and blends as it did.
        function exactTangents(Q, j) {
            const n = Q.x.length,
                p = (j - 1 + n) % n,
                f = (j + 1) % n,
                ci = Q.c[p],
                co = Q.c[j];
            let ix = ci ? ci[2] - Q.x[j] : Q.x[p] - Q.x[j],
                iy = ci ? ci[3] - Q.y[j] : Q.y[p] - Q.y[j],
                ox = co ? co[0] - Q.x[j] : Q.x[f] - Q.x[j],
                oy = co ? co[1] - Q.y[j] : Q.y[f] - Q.y[j];
            if (ci && Math.hypot(ix, iy) < 1e-12) {
                ix = Q.x[p] - Q.x[j];
                iy = Q.y[p] - Q.y[j];
            }
            if (co && Math.hypot(ox, oy) < 1e-12) {
                ox = Q.x[f] - Q.x[j];
                oy = Q.y[f] - Q.y[j];
            }
            return { ix, iy, ox, oy, straight: !ci && !co };
        }
        function exactIsSmooth(T) {
            const li = Math.hypot(T.ix, T.iy),
                lo = Math.hypot(T.ox, T.oy);
            if (li < 1e-12 || lo < 1e-12)
                return false;
            const cr = (T.ix * T.oy - T.iy * T.ox) / (li * lo),
                dt = (T.ix * T.ox + T.iy * T.oy) / (li * lo);
            return dt < 0 && Math.abs(cr) < 0.02;
        }
        // per corner: 1 to be kept smooth (smooth in some key, smooth or between straight edges in all)
        function morphExactSmooth(keys, curved) {
            const n = keys[0].x.length,
                out = new Uint8Array(n);
            for (let j = 0; j < n; j++) {
                if (!curved[j] && !curved[(j - 1 + n) % n])
                    continue;
                let any = false,
                    ok = true;
                for (const Q of keys) {
                    const T = exactTangents(Q, j),
                        sm = exactIsSmooth(T);
                    if (sm && !T.straight)
                        any = true;
                    else if (!sm && !T.straight) {
                        ok = false;
                        break;
                    }
                }
                if (any && ok)
                    out[j] = 1;
            }
            return out;
        }
        // the pose at t: the keys' corners, radii and handles weighed, then the path
        function morphPoseExact(run, t, bare) {
            const K = run.keys.length,
                w = morphWeightsOf(morphRunT(run, t), K, run),
                n = run.keys[0].x.length;
            const x = new Float64Array(n),
                y = new Float64Array(n),
                r = new Float64Array(n),
                c = new Array(n).fill(null);
            for (let k = 0; k < K; k++) {
                const a = w[k];
                if (a === 0)
                    continue;
                const Q = run.keys[k];
                for (let j = 0; j < n; j++) {
                    x[j] += a * Q.x[j];
                    y[j] += a * Q.y[j];
                    r[j] += a * Q.r[j];
                }
            }
            for (let j = 0; j < n; j++) // an ease past a key can carry a rounding below none
                if (r[j] < 0)
                    r[j] = 0;
            if (!run._smooth || run._smoothKeys !== run.keys || run._smoothSig !== K * 1e4 + n) {
                run._smooth = morphExactSmooth(run.keys, run.curved);
                run._smoothKeys = run.keys;
                run._smoothSig = K * 1e4 + n;
            }
            const sm = run._smooth;
            for (let e = 0; e < n; e++) {
                if (!run.curved[e])
                    continue;
                const f = (e + 1) % n,
                    acc = [0, 0, 0, 0];
                for (let k = 0; k < K; k++) {
                    const a = w[k];
                    if (a === 0)
                        continue;
                    const Q = run.keys[k],
                        q = Q.c[e] || [sm[e] ? Q.x[e] : Q.x[e] + (Q.x[f] - Q.x[e]) / 3, sm[e] ? Q.y[e] : Q.y[e] + (Q.y[f] - Q.y[e]) / 3,
                        sm[f] ? Q.x[f] : Q.x[f] - (Q.x[f] - Q.x[e]) / 3, sm[f] ? Q.y[f] : Q.y[f] - (Q.y[f] - Q.y[e]) / 3];
                    for (let i = 0; i < 4; i++)
                        acc[i] += a * q[i];
                }
                c[e] = acc;
            }
            for (let j = 0; j < n; j++) { // the smooth corners' two handles put in line
                if (!sm[j])
                    continue;
                const ci = c[(j - 1 + n) % n],
                    co = c[j];
                if (!ci || !co)
                    continue;
                const ix = ci[2] - x[j],
                    iy = ci[3] - y[j],
                    ox = co[0] - x[j],
                    oy = co[1] - y[j],
                    li = Math.hypot(ix, iy),
                    lo = Math.hypot(ox, oy);
                if (li < 1e-12 || lo < 1e-12)
                    continue;
                let dx = ox / lo - ix / li,
                    dy = oy / lo - iy / li;
                const ld = Math.hypot(dx, dy);
                if (ld < 1e-12)
                    continue;
                dx /= ld;
                dy /= ld;
                ci[2] = x[j] - dx * li;
                ci[3] = y[j] - dy * li;
                co[0] = x[j] + dx * lo;
                co[1] = y[j] + dy * lo;
            }
            for (let j = 0; j < n; j++)
                if (!(r[j] > 0))
                    r[j] = 0;
            const P = { x, y, r, c };
            if ((morphPathOf(run) || run.spin) && !bare) { // MOTION ALONG A PATH and spin: the corners and handles carried
                const ctr = exactCentre(P),
                    q = morphPlace(run, t, ctr),
                    cs = Math.cos(q.turn),
                    sn = Math.sin(q.turn);
                const tf = (px, py) => [q.x + cs * (px - ctr.x) - sn * (py - ctr.y), q.y + sn * (px - ctr.x) + cs * (py - ctr.y)];
                for (let j = 0; j < n; j++) {
                    [x[j], y[j]] = tf(x[j], y[j]);
                    const e = c[j];
                    if (e) {
                        [e[0], e[1]] = tf(e[0], e[1]);
                        [e[2], e[3]] = tf(e[2], e[3]);
                    }
                }
            }
            const MX = !bare && morphMotionXform(run, t); // PHYSICAL MOTIONS: corners, handles and radii carried
            if (MX) {
                const rs = Math.sqrt(Math.abs(MX.det));
                for (let j = 0; j < n; j++) {
                    [x[j], y[j]] = MX.at(x[j], y[j]);
                    r[j] *= rs;
                    const e = c[j];
                    if (e) {
                        [e[0], e[1]] = MX.at(e[0], e[1]);
                        [e[2], e[3]] = MX.at(e[2], e[3]);
                    }
                }
            }
            const PX = !bare && morphParentXform(run, t); // ONE MORPH RIDING ANOTHER
            if (PX) {
                for (let j = 0; j < n; j++) {
                    [x[j], y[j]] = PX.at(x[j], y[j]);
                    const e = c[j];
                    if (e) {
                        [e[0], e[1]] = PX.at(e[0], e[1]);
                        [e[2], e[3]] = PX.at(e[2], e[3]);
                    }
                }
            }
            const lk = !bare && morphLookTurn(run, t); // FACING another
            if (lk) {
                const cc = morphCentreAt(run, t),
                    cs = Math.cos(lk),
                    sn = Math.sin(lk),
                    rot = (px, py) => [cc.x + cs * (px - cc.x) - sn * (py - cc.y), cc.y + sn * (px - cc.x) + cs * (py - cc.y)];
                for (let j = 0; j < n; j++) {
                    [x[j], y[j]] = rot(x[j], y[j]);
                    const e = c[j];
                    if (e) {
                        [e[0], e[1]] = rot(e[0], e[1]);
                        [e[2], e[3]] = rot(e[2], e[3]);
                    }
                }
            }
            return P;
        }
        // HOLES THAT RIDE A STILL (28 Oct 2026, Tom: "1,2,3,4", for labels in scenes: a letter's counters). A one-key
        // exact morph keeps its key's holes (run.holes, in the key's frame). Every pose of one key is an affine map
        // of it (its path, spin, motion and parent are all affine), so the map is found from the corners by least
        // squares and the holes are carried by it: a label that slides, turns, squashes or rides keeps its counters.
        // holes as JSON (numbers to 9 digits) and back, for the autosave and the .tvfs
        function morphHolesSave(H) {
            return H.map(h => ({
                x: Array.from(h.x, v => +(+v).toPrecision(9)),
                y: Array.from(h.y, v => +(+v).toPrecision(9)),
                smooth: h.smooth ? Array.from(h.smooth, Boolean) : null,
                ctrl: h.ctrl ? h.ctrl.map(q => q ? q.map(v => +(+v).toPrecision(9)) : null) : null
            }));
        }
        function morphHolesLoad(H) {
            if (!Array.isArray(H) || !H.length)
                return null;
            const out = H.filter(h => h && Array.isArray(h.x) && Array.isArray(h.y) && h.x.length >= 3 && h.x.length === h.y.length).map(h => ({
                x: Float64Array.from(h.x, Number),
                y: Float64Array.from(h.y, Number),
                smooth: Array.isArray(h.smooth) && h.smooth.length === h.x.length ? Uint8Array.from(h.smooth, Boolean) : null,
                ctrl: Array.isArray(h.ctrl) && h.ctrl.length === h.x.length ? h.ctrl.map(q => Array.isArray(q) && q.length === 4 ? q.map(Number) : null) : null
            }));
            return out.length ? out : null;
        }
        function morphAffineOf(K, P) {
            const n = Math.min(K.x.length, P.x.length);
            let sxx = 0, sxy = 0, syy = 0, sx = 0, sy = 0,
                ux = 0, uy = 0, u1 = 0, vx = 0, vy = 0, v1 = 0;
            for (let i = 0; i < n; i++) {
                const x = K.x[i], y = K.y[i], X = P.x[i], Y = P.y[i];
                sxx += x * x; sxy += x * y; syy += y * y; sx += x; sy += y;
                ux += X * x; uy += X * y; u1 += X;
                vx += Y * x; vy += Y * y; v1 += Y;
            }
            // [sxx sxy sx; sxy syy sy; sx sy n] · [a c e] = [ux uy u1], and the same for [b d f]
            const M = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]],
                det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
            if (!(Math.abs(det) > 1e-18))
                return [1, 0, 0, 1, (u1 - sx) / Math.max(1, n), (v1 - sy) / Math.max(1, n)];
            const solve = r => {
                const col = (j, q) => M.map((row, i) => row.map((v, k) => k === j ? q[i] : v)),
                    d3 = A => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
                return [d3(col(0, r)) / det, d3(col(1, r)) / det, d3(col(2, r)) / det];
            };
            const [a, c, e] = solve([ux, uy, u1]),
                [b, d, f] = solve([vx, vy, v1]);
            return [a, b, c, d, e, f];
        }
        function morphHolesAt(run, P) {
            if (!run.holes || !run.holes.length)
                return null;
            const [a, b, c, d, e, f] = morphAffineOf(run.keys[0], P),
                mx = (x, y) => a * x + c * y + e,
                my = (x, y) => b * x + d * y + f;
            return run.holes.map(h => ({
                x: Float64Array.from(h.x, (x, i) => mx(x, h.y[i])),
                y: Float64Array.from(h.x, (x, i) => my(x, h.y[i])),
                smooth: h.smooth || null,
                ctrl: h.ctrl ? h.ctrl.map(q => q ? [mx(q[0], q[1]), my(q[0], q[1]), mx(q[2], q[3]), my(q[2], q[3])] : null) : null
            }));
        }
        function morphWriteExact(run, sp, P) {
            // the shape gets copies: run.pose is what was written, and an edit made in place on the shape
            // must not change it too (EDITING A KEY ON THE CANVAS measures the edit against it)
            makeLazy(sp, Float64Array.from(P.x), Float64Array.from(P.y), 0, null, {
                exact: true,
                open: !!run.open, // DRAWING A LINE ON: a line goes live as a line
                holes: morphHolesAt(run, P), // HOLES THAT RIDE A STILL
                round: hasRound(P.r) ? P.r : null,
                ctrl: hasCtrl(P.c) ? P.c.map(e => e ? e.slice() : null) : null
            });
            run.pose = P;
        }
        // a pose as 2n cubics in a fixed order, for the animated svg: at each corner its rounding
        // (an arc's cubic, or none, all four points at the corner), then the edge to the next. An open
        // line (DRAWING A LINE ON) has n − 1 edges and no rounding at its two ends: 2(n − 1) cubics.
        function morphExactCubics(P, open) {
            const n = P.x.length,
                ends = [];
            for (let k = 0; k < n; k++) {
                const g = P.r[k] > 0 && !(open && (k === 0 || k === n - 1)) && !P.c[k] && !P.c[(k - 1 + n) % n] ? cornerArc(P.x, P.y, k, false, P.r[k]) : null;
                if (g) {
                    const h = (4 / 3) * Math.tan((Math.PI - g.phi) / 4) * g.r,
                        ux = (g.t1x - P.x[k]) / g.t,
                        uy = (g.t1y - P.y[k]) / g.t,
                        vx = (g.t2x - P.x[k]) / g.t,
                        vy = (g.t2y - P.y[k]) / g.t;
                    ends.push({ a: { x: g.t1x, y: g.t1y }, c1: { x: g.t1x - ux * h, y: g.t1y - uy * h }, c2: { x: g.t2x - vx * h, y: g.t2y - vy * h }, b: { x: g.t2x, y: g.t2y } });
                } else {
                    const p = { x: P.x[k], y: P.y[k] };
                    ends.push({ a: p, c1: p, c2: p, b: p });
                }
            }
            const pts = [ends[0].b];
            for (let k = 0; k < (open ? n - 1 : n); k++) {
                const A = ends[k].b,
                    B = ends[(k + 1) % n].a,
                    e = P.c[k];
                if (e)
                    pts.push({ x: e[0], y: e[1] }, { x: e[2], y: e[3] }, B);
                else
                    pts.push({ x: A.x + (B.x - A.x) / 3, y: A.y + (B.y - A.y) / 3 }, { x: B.x - (B.x - A.x) / 3, y: B.y - (B.y - A.y) / 3 }, B);
                const F = ends[(k + 1) % n];
                pts.push(F.c1, F.c2, F.b);
            }
            return pts;
        }
        // an exact shape's outline (and its holes) as svg path data, through mp (world to the file's
        // units): lines, its curve edges' cubics, and each rounded corner's arc as its cubic
        function exactPathD(lz, mp, dp) {
            const q = Math.pow(10, dp),
                f = v => Math.round(v * q) / q,
                P = (x, y) => {
                    const p = mp({ x, y });
                    return f(p.x) + ' ' + f(p.y);
                };
            const ring = (X, Y, R, open, S, C) => {
                if (X.length < (open ? 2 : 3))
                    return '';
                const E = exactSegs(X, Y, R, open, S, C);
                let d = 'M' + P(E.start.x, E.start.y);
                for (const g of E.segs) {
                    if (g.type === 'L')
                        d += 'L' + P(g.x, g.y);
                    else if (g.type === 'C')
                        d += 'C' + P(g.c1x, g.c1y) + ' ' + P(g.c2x, g.c2y) + ' ' + P(g.x, g.y);
                    else {
                        const a = g.g,
                            h = (4 / 3) * Math.tan((Math.PI - a.phi) / 4) * a.r,
                            ux = (a.t1x - g.px) / a.t,
                            uy = (a.t1y - g.py) / a.t,
                            vx = (a.t2x - g.px) / a.t,
                            vy = (a.t2y - g.py) / a.t;
                        d += 'L' + P(a.t1x, a.t1y) + 'C' + P(a.t1x - ux * h, a.t1y - uy * h) + ' ' + P(a.t2x - vx * h, a.t2y - vy * h) + ' ' + P(a.t2x, a.t2y);
                    }
                }
                return d + (open ? '' : 'Z');
            };
            let d = ring(lz.x, lz.y, lzRoundBaked(lz), lz.open, lz.smooth, lzCtrlBaked(lz));
            for (const hl of (lzHolesBaked(lz) || []))
                d += ring(hl.x, hl.y, null, false, hl.smooth, hl.ctrl);
            return d;
        }
        // HOLES THAT RIDE A STILL, in the animated svg: each hole joined to the outline by a straight bridge out and
        // back, so the pose stays one run of cubics of a fixed count (what SMIL needs to blend frame to frame); with
        // the even-odd rule the bridge, gone over twice, encloses nothing
        function morphKeyholeCubics(pts, holes) {
            if (!holes || !holes.length)
                return pts;
            const out = pts.slice(),
                line = (A, B) => out.push({ x: A.x + (B.x - A.x) / 3, y: A.y + (B.y - A.y) / 3 }, { x: B.x - (B.x - A.x) / 3, y: B.y - (B.y - A.y) / 3 }, { x: B.x, y: B.y });
            const home = pts[pts.length - 1];
            for (const h of holes) {
                const D = exactDense(h.x, h.y, null, false, h.smooth, h.ctrl),
                    R = Array.from(D.x, (x, i) => ({ x, y: D.y[i] }));
                line(home, R[0]);
                for (let i = 1; i <= R.length; i++)
                    line(R[i - 1], R[i % R.length]);
                line(R[0], home);
            }
            return out;
        }
        function cubicsToPathD(pts, dp, open) {
            const q = Math.pow(10, dp),
                f = v => Math.round(v * q) / q;
            let d = 'M' + f(pts[0].x) + ' ' + f(pts[0].y);
            for (let i = 1; i + 2 < pts.length; i += 3)
                d += 'C' + f(pts[i].x) + ' ' + f(pts[i].y) + ' ' + f(pts[i + 1].x) + ' ' + f(pts[i + 1].y) + ' ' + f(pts[i + 2].x) + ' ' + f(pts[i + 2].y);
            return d + (open ? '' : 'Z');
        }
        // a run's drawn outline at time u, as points (an exact pose's, or the leaves' curve)
        function morphOutlineAt(run, u) {
            if (run.exact && run.open) { // a line, not a ring
                const K = morphPoseExact(run, u);
                return exactDense(K.x, K.y, hasRound(K.r) ? K.r : null, true, null, hasCtrl(K.c) ? K.c : null);
            }
            if (run.exact)
                return exactDenseOf(morphPoseExact(run, u));
            const sp = morphTargetOf(run);
            if (!sp)
                return null;
            const B = morphTrailBuf(sp.leafX.length);
            morphPoseInto(run, u, B.x, B.y);
            return new tvf.Shape(B.x, B.y).sample(256);
        }

        // DRAWING A LINE ON: a live shape whose clip is shown 'draw', part way through its window. Its outline
        // (the pose's own, a line's open, a ring's closed) is stroked from its start for share f of its
        // length, in its own line, or in its fill's colour when it has none; its fill comes in over the
        // window's last part, and an outline it does not have of its own goes out as the fill comes in,
        // so the end of the window is the shape exactly as it is drawn whole. An arrow's heads come with
        // the last of its line.
        function drawShapeDrawingOn(sp, run, f, fd, w, h) {
            const h_ = h,
                O = morphOutlineAt(run, morphLive.t);
            if (!O || O.x.length < 2)
                return;
            const open = !!run.open,
                n = O.x.length,
                P = new Array(n);
            for (let i = 0; i < n; i++)
                P[i] = worldToPx(O.x[i], O.y[i], w, h);
            if (!open)
                P.push(P[0]);
            let L = 0;
            for (let i = 1; i < P.length; i++)
                L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
            const fillCol = state.showFills && !open && sp.fill && sp.fill.color ? sp.fill.color : null,
                fillA = sp.fill && sp.fill.opacity != null ? sp.fill.opacity : 1,
                ff = morphDrawFill(f),
                own = sp.lineWidth == null ? state.lineWidth : sp.lineWidth,
                hasLine = own > 0 && (!!sp.stroke || !fillCol),
                lw = hasLine ? own : Math.max(1.5, state.lineWidth || 2),
                col = (hasLine && sp.stroke) || fillCol || sp.stroke || 'rgba(212,160,82,1)',
                so = sp.strokeOpacity != null ? sp.strokeOpacity : 1;
            ctx.save();
            if (fillCol && ff > 0) {
                ctx.beginPath();
                ctx.moveTo(P[0].x, P[0].y);
                for (let i = 1; i < n; i++)
                    ctx.lineTo(P[i].x, P[i].y);
                ctx.closePath();
                const H = run.holes ? morphHolesAt(run, morphPoseExact(run, morphLive.t)) : null; // HOLES THAT RIDE A STILL
                for (const h of H || []) {
                    const D = exactDense(h.x, h.y, null, false, h.smooth, h.ctrl);
                    for (let i = 0; i < D.x.length; i++) {
                        const q = worldToPx(D.x[i], D.y[i], w, h_);
                        if (i)
                            ctx.lineTo(q.x, q.y);
                        else
                            ctx.moveTo(q.x, q.y);
                    }
                    ctx.closePath();
                }
                ctx.globalAlpha = fd * fillA * ff;
                ctx.fillStyle = fillCol;
                ctx.fill('evenodd');
            }
            const a = fd * so * (hasLine ? 1 : 1 - ff);
            if (a > 0 && L > 0) {
                ctx.globalAlpha = a;
                ctx.strokeStyle = col;
                ctx.lineWidth = lw;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(P[0].x, P[0].y);
                let left = f * L;
                for (let i = 1; i < P.length && left > 0; i++) {
                    const d = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
                    if (d <= left) {
                        ctx.lineTo(P[i].x, P[i].y);
                        left -= d;
                    } else {
                        const u = left / d;
                        ctx.lineTo(P[i - 1].x + u * (P[i].x - P[i - 1].x), P[i - 1].y + u * (P[i].y - P[i - 1].y));
                        left = 0;
                    }
                }
                ctx.stroke();
            }
            ctx.restore();
        }

        // ── MOTION ALONG A PATH (25 Oct 2026, Tom: "1,3") ───────────────────────────────
        // A line or a curve in the drawing becomes a path, and every live shape rides it on the
        // shared clock: the pose's centre (its leaves' mean, which is the curve's own centroid) is
        // put on the path, and with `turn` on the pose turns with the path's direction, as drawn at
        // the path's start. The path is sampled evenly by length, so the ride is at an even speed.
        // A closed path goes round once a loop; an open one goes from its start to its end and jumps
        // back, or with `there & back` goes out and comes back, slowing at the ends, so its loop is
        // seamless too. Several live shapes share one path, spread evenly along it, a procession.
        //
        // The path shape leaves the drawing while it is a path (it is the motion's, not the
        // picture's, so a recording does not show it) and is drawn as a dashed guide; taking the
        // path off, or exit, puts it back where it was.
        const MORPH_PATH_M = 512;
        // a shape's outline as a polyline in the world, and whether it closes
        function morphPathFrom(sp) {
            if (!sp)
                return null;
            if (sp._lazy) {
                const P = lzOutlinePts(sp._lazy),
                    open = !!sp._lazy.open;
                if (!P || P.x.length < (open ? 2 : 3))
                    return null;
                return { x: Float64Array.from(P.x), y: Float64Array.from(P.y), closed: !open };
            }
            if (!sp.leafX || sp.leafX.length < 3)
                return null;
            const g = new tvf.Shape(Float64Array.from(sp.leafX), Float64Array.from(sp.leafY)).sample(MORPH_PATH_M);
            return { x: Float64Array.from(g.x), y: Float64Array.from(g.y), closed: true };
        }
        // the polyline sampled at M + 1 evenly spaced lengths (the last is the first, closed), each
        // with the direction there, taken over a few samples so a polygon's corner turns over a
        // short stretch rather than in one frame
        function morphPathBuild(px, py, closed) {
            const n = px.length,
                xs = Array.from(px),
                ys = Array.from(py);
            if (closed) {
                xs.push(xs[0]);
                ys.push(ys[0]);
            }
            const L = [0];
            for (let i = 1; i < xs.length; i++)
                L.push(L[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]));
            const total = L[L.length - 1];
            if (!(total > 0) || n < 2)
                return null;
            const M = MORPH_PATH_M,
                x = new Float64Array(M + 1),
                y = new Float64Array(M + 1),
                ang = new Float64Array(M + 1);
            let j = 0;
            for (let i = 0; i <= M; i++) {
                const s = total * i / M;
                while (j < L.length - 2 && L[j + 1] < s)
                    j++;
                const seg = L[j + 1] - L[j],
                    u = seg > 0 ? (s - L[j]) / seg : 0;
                x[i] = xs[j] + u * (xs[j + 1] - xs[j]);
                y[i] = ys[j] + u * (ys[j + 1] - ys[j]);
            }
            const W = 3;
            for (let i = 0; i <= M; i++) {
                let a = i - W,
                    b = i + W;
                if (closed) {
                    a = ((a % M) + M) % M;
                    b = b % M;
                } else {
                    a = Math.max(0, a);
                    b = Math.min(M, b);
                }
                ang[i] = Math.atan2(y[b] - y[a], x[b] - x[a]);
            }
            if (closed)
                ang[M] = ang[0];
            return { x, y, ang, closed, len: total, src: { x: Float64Array.from(px), y: Float64Array.from(py) } };
        }
        // where along the path (0 to 1) the clock puts it, for the run at `phase` along a procession
        function morphPathS(P, t, phase) {
            if (P.mode === 'back') {
                const u = ((t + phase) % 1 + 1) % 1;
                return (1 - Math.cos(TAU * u)) / 2;
            }
            return ((t + phase) % 1 + 1) % 1;
        }
        function morphPathAt(P, s) {
            const M = P.x.length - 1,
                f = Math.max(0, Math.min(M, s * M)),
                i = Math.min(M - 1, Math.floor(f)),
                u = f - i;
            let da = P.ang[i + 1] - P.ang[i];
            da -= TAU * Math.round(da / TAU);
            return {
                x: P.x[i] + u * (P.x[i + 1] - P.x[i]),
                y: P.y[i] + u * (P.y[i + 1] - P.y[i]),
                a: P.ang[i] + u * da
            };
        }
        // which way the pose faces is the path's direction there, less the direction at the start,
        // so a shape that starts on the path looks as drawn. There and back it comes back facing the
        // same way, backing along the path: a half turn at the far end would happen in one frame.
        // ── EACH MORPH ITS OWN TIME, PATH, COLOUR, TRAIL (25 Oct 2026, Tom: "can you do some top quality
        // animation examples, to really push the framework?") ────────────────────────────────────────
        // One clock drives every live morph, which keeps them in register, and that stays. What a morph
        // may now have of its own, on that clock:
        //   rate, phase   its keys and its effect run `rate` times round a loop (a whole number, so the
        //                 loop closes), `phase` of a loop ahead: a field of shapes rippling, a flock whose
        //                 wings never beat together;
        //   spin          whole or fractional turns a loop about its own centre: gears in the ratio of
        //                 their teeth, a windmill (a fraction closes the loop only where the shape's own
        //                 symmetry does);
        //   path, laps, at   a path of its own, ridden `laps` times a loop from `at` along it: planets
        //                 lapping at their own speeds; without one it rides the shared path, spread;
        //   cols          the keys' fills, blended with the keys by the same weights, in linear light;
        //   trail, fx     its own trail and effect, where the bar's would not suit every morph.
        // The scene link sets them (THE SCENE LINK); the autosave keeps them (morphSaveOwn); the bar's
        // controls still act on every morph at once.
        // A morph rides its own path if it has one (EACH MORPH ITS OWN PATH), else the shared one.
        // On its own path it starts at `at` (0 to 1 along it) and goes round `laps` times a loop; on
        // the shared path the morphs riding it are spread evenly along it, unless one says where.
        function morphPathOf(run) {
            return (run && run.path) || morphLive.path;
        }
        function morphPathPlace(run, t) {
            const P = morphPathOf(run);
            let start = run.at;
            if (start == null) {
                const riders = run.path ? [run] : morphRuns.filter(r => !r.path),
                    k = Math.max(0, riders.indexOf(run));
                start = riders.length > 1 ? k / riders.length : 0;
            }
            const s = morphPathS(P, t * (run.laps || 1), start),
                q = morphPathAt(P, s);
            return { x: q.x, y: q.y, turn: P.turn ? q.a - P.ang[0] : 0 };
        }
        // where the pose's centre goes and which way it faces at t: on its path (if any) and turned
        // by its spin, `spin` whole turns a loop about its own centre (EACH MORPH ITS OWN TIME)
        function morphPlace(run, t, ctr) {
            if (run.clip)
                t = morphClipP(run, t); // A MORPH THAT PLAYS ONCE: its ride and spin over its window alone
            const q = morphPathOf(run) ? morphPathPlace(run, t) : { x: ctr.x, y: ctr.y, turn: 0 };
            if (run.spin)
                q.turn += TAU * run.spin * t;
            return q;
        }
        // ── PHYSICAL MOTIONS (27 Oct 2026, Tom: "some animations are rather simple, just morphing between two shapes.
        // or more physical, such as a bouncing ball", then "this application is better suited to 1 and 2") ──────────
        // A morph's keys say what it looks like; run.motion says how it moves, computed rather than keyed, so a ball
        // falls the way a ball falls without anyone (or any model) having to invent the timing:
        //   bounce  one hop a cycle along gravity's parabola, `amount` its height in the shape's own heights, squashed
        //           flat where it meets the ground and stretched along the way it is going (`squash`);
        //   fall    dropped from `amount` heights up, bouncing lower each time by `bounce` (the share of speed it keeps)
        //           until it rests, the time of each bounce gravity's own; one fall a cycle (with a clip, once);
        //   swing   a pendulum, `amount` degrees either side, hung from its top (or `pivot`);
        //   spring  a damped boing at the start of each cycle along `along` (y, x, scale or turn), `amount` its size;
        // and (27 Oct 2026, Tom: "1,2", after "roll, throw, sway, pop"):
        //   roll    turning as it goes so it never skids: along its own path if it rides one (the turn the path's
        //           length over its radius), else `amount` of its widths across and back each cycle;
        //   throw   a projectile from where it is drawn to `to` ([right, up], in its own heights), its arc's top
        //           `amount` heights above the higher end; one throw a cycle (with a clip, once);
        //   sway    bending from its base, the top moving most, `amount` degrees, as a tree or grass in wind;
        //   pop     growing from nothing to its size with an overshoot and a settle, `amount` how lively (with a
        //           clip, it pops in when its window opens).
        // It acts on the pose after its path and spin, in the page's own up and across (gravity is down the page),
        // measured from where the pose is placed and from the shape's own size (its first key), and before a parent
        // carries it. The ground is where the shape was drawn: a ball drawn on the floor bounces off it.
        const MORPH_MOTIONS = ['bounce', 'fall', 'swing', 'spring', 'roll', 'throw', 'sway', 'pop', 'drift', 'chain'],
            MORPH_MOTION_PIVOTS = ['top', 'bottom', 'left', 'right', 'centre'],
            MORPH_MOTION_ALONG = ['y', 'x', 'scale', 'turn'];
        // a motion as a record holds it: its kind and its numbers, each within reach, or null
        function morphMotionOk(m, inChain) {
            if (!m || !MORPH_MOTIONS.includes(m.kind) || (inChain && m.kind === 'chain'))
                return null;
            const num = (v, a, b, d) => Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : d;
            const o = { kind: m.kind };
            if (m.kind === 'chain') { // MOTIONS IN A ROW: up to eight steps, each its share of the cycle
                const steps = (Array.isArray(m.steps) ? m.steps : []).slice(0, 8).map(q => morphMotionOk(q, true)).filter(Boolean);
                if (!steps.length)
                    return null;
                o.steps = steps;
                return o;
            }
            if (inChain)
                o.share = num(m.share, 0.01, 100, 1);
            if (m.kind === 'bounce') {
                o.amount = num(m.amount, 0, 20, 1.5);
                o.squash = num(m.squash, 0, 0.6, 0.25);
                if (Number.isFinite(+m.ground) && +m.ground) // CONTACT: the floor below (or above) where it is drawn
                    o.ground = num(m.ground, -100, 100, 0);
            } else if (m.kind === 'fall') {
                o.amount = num(m.amount, 0, 40, 3);
                o.bounce = num(m.bounce, 0, 0.9, 0.5);
                o.squash = num(m.squash, 0, 0.6, 0.2);
                if (Number.isFinite(+m.ground) && +m.ground)
                    o.ground = num(m.ground, -100, 100, 0);
            } else if (m.kind === 'swing') {
                o.amount = num(m.amount, 0, 180, 30);
                o.pivot = MORPH_MOTION_PIVOTS.includes(m.pivot) ? m.pivot : 'top';
            } else if (m.kind === 'spring') {
                o.amount = num(m.amount, -2, 2, 0.3);
                o.along = MORPH_MOTION_ALONG.includes(m.along) ? m.along : 'y';
                o.bounces = num(m.bounces, 1, 12, 4);
            } else if (m.kind === 'roll') {
                o.amount = num(m.amount, -40, 40, 4);
            } else if (m.kind === 'throw') {
                o.amount = num(m.amount, 0, 40, 2);
                const to = Array.isArray(m.to) ? m.to : [];
                o.to = [num(to[0], -100, 100, 6), num(to[1], -100, 100, 0)];
            } else if (m.kind === 'sway') {
                o.amount = num(m.amount, 0, 60, 8);
            } else if (m.kind === 'drift') {
                const to = Array.isArray(m.to) ? m.to : [];
                o.to = [num(to[0], -200, 200, 0), num(to[1], -200, 200, -8)];
                o.amount = num(m.amount, 0, 20, 0.5);
            } else { // pop
                o.amount = num(m.amount, 0, 1, 0.5);
            }
            return o;
        }
        // the shape's own half-width and half-height, from its first key (kept: the keys change only by editing)
        function morphMotionSize(run) {
            const K = run.keys[0];
            if (run._msize && run._msizeOf === K)
                return run._msize;
            const D = run.exact ? exactDenseOf(K) : { x: K.x, y: K.y };
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            for (let i = 0; i < D.x.length; i++) {
                x0 = Math.min(x0, D.x[i]);
                x1 = Math.max(x1, D.x[i]);
                y0 = Math.min(y0, D.y[i]);
                y1 = Math.max(y1, D.y[i]);
            }
            run._msizeOf = K;
            return (run._msize = { w: Math.max(1e-9, (x1 - x0) / 2), h: Math.max(1e-9, (y1 - y0) / 2), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
        }
        // ── CONTACT WITH OTHER SHAPES (27 Oct 2026, Tom: "2,4,5") ──────────────────────────────────────
        // A motion measures from where its shape is drawn: a bounce off the floor it stands on, a throw to
        // a point so many of its heights away. To land on a table, stop on a shelf or roll up to a wall,
        // the motion can be set from another shape instead: `onto` (the scene link's and the AI's shape
        // number, or the strip's "onto" with one other shape selected) is worked into the motion's own
        // numbers once, when it is set, from the two shapes' boxes:
        //   fall     its floor (`ground`, in its heights below where it is drawn) the other's top, dropped
        //            from where it is drawn;
        //   bounce   its floor the other's top, so it hops on it;
        //   throw    landing on the other's top, at its middle;
        //   roll     up to the other's near side and back.
        // In a chain a step's `onto` is worked out from where the steps before it leave the shape. The
        // numbers are what the motion holds (the handles and the strip see them); the run keeps the shapes too,
        // and works the numbers out again when one moves (CONTACT THAT FOLLOWS, below).
        function morphShapeBox(sp) {
            const lz = sp && sp._lazy;
            let X, Y;
            if (lz) {
                if (lz.exact && (hasRound(lz.round) || lz.smooth || lz.ctrl)) {
                    const D = exactDense(lz.x, lz.y, lzRoundBaked(lz), lz.open, lz.smooth, lzCtrlBaked(lz));
                    X = D.x;
                    Y = D.y;
                } else {
                    X = lz.x;
                    Y = lz.y;
                }
            } else if (sp && sp.leafX && sp.leafX.length) {
                X = sp.leafX;
                Y = sp.leafY;
            } else
                return null;
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            for (let i = 0; i < X.length; i++) {
                x0 = Math.min(x0, X[i]);
                x1 = Math.max(x1, X[i]);
                y0 = Math.min(y0, Y[i]);
                y1 = Math.max(y1, Y[i]);
            }
            return isFinite(x0) ? { x0, x1, y0, y1, cx: (x0 + x1) / 2 } : null;
        }
        // EMITTERS: a copy of a shape under the map t ([a, b, c, d, e, f]: x' = ax + cy + e, y' = bx + dy + f),
        // not yet in the drawing. The AI's animCopy, written again here where the scene link can reach it:
        // a held exact shape stays exact, anything else is copied leaf by leaf.
        function spCopyXform(sp, t) {
            const lz = sp._lazy;
            if (!lz) {
                const at = cloneSubpathsWith([state.subpaths.indexOf(sp)], (x, y) => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]]);
                return at.length ? state.subpaths.splice(at[0], 1)[0] : null;
            }
            const c = {
                refLength: 0,
                source: sp.source,
                dirty: false,
                fill: sp.fill ? { color: sp.fill.color, opacity: sp.fill.opacity } : null,
                stroke: sp.stroke || null,
                strokeOpacity: sp.strokeOpacity != null ? sp.strokeOpacity : null,
                lineStyle: sp.lineStyle || null,
                lineWidth: sp.lineWidth != null ? sp.lineWidth : null,
                gname: sp.gname || null,
            };
            makeLazy(c, Float64Array.from(lz.rx), Float64Array.from(lz.ry), lz.scale, lz.m ? lz.m.slice() : null, {
                exact: lz.exact,
                open: lz.open,
                round: lz.round,
                smooth: lz.smooth,
                ctrl: lz.ctrl,
                holes: lz.holes
            });
            lazyXform(c, t);
            return c;
        }
        // ── EMITTERS (27 Oct 2026, Tom: "2,4,5") ─────────────────────────────────────────────────────────
        // Confetti, rain, snow, bubbles: one shape and a motion, many times over, each a little different.
        // A scene link's (or the AI's) entry may carry `emit: {count, spread: [across, up], vary, seed}`:
        // the entry is made as it is, and count − 1 copies of its keys are added to the drawing, scattered
        // over a box `spread` of the shape's own heights round where it is drawn, each sized and turned a
        // little (by `vary`, 0 to 1), with its own phase and its motion's numbers varied as much. They are
        // ordinary morphs from then on, written back out one by one; `seed` makes the same scatter every
        // time. A `drift` (carried `to` once a cycle, wobbling, growing in and shrinking out at the ends) is
        // the motion most of these want.
        // a seeded random (mulberry32), the same numbers for the same seed
        function morphRand(seed) {
            let x = (Number.isFinite(+seed) ? +seed : 1) >>> 0 || 1;
            return () => {
                x = (x + 0x6D2B79F5) >>> 0;
                let z = x;
                z = Math.imul(z ^ (z >>> 15), z | 1);
                z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
                return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
            };
        }
        // a motion as a copy has it: its numbers varied by up to `vary` either way, and its carried distances
        // (in its own heights) multiplied by f, the first's height over the copy's
        function morphVaryMotion(m, vary, rnd, f) {
            if (!m || typeof m !== 'object')
                return m;
            const q = Object.assign({}, m);
            if (Number.isFinite(+q.amount))
                q.amount = +q.amount * (1 + vary * (rnd() - 0.5));
            if (Array.isArray(q.to))
                q.to = q.to.map(v => Number.isFinite(+v) ? +v * (1 + vary * (rnd() - 0.5) * 0.5) * f : v);
            if (Array.isArray(q.steps))
                q.steps = q.steps.map(x => morphVaryMotion(x, vary, rnd, f));
            return q;
        }
        // the map for copy c of a shape centred (cx, cy) H tall: moved within spread [across, up] (in page units),
        // sized and turned a little
        function morphEmitMap(rnd, vary, cx, cy, ax, ay, ox, oy) {
            const ddx = (rnd() - 0.5) * ax,
                ddy = (rnd() - 0.5) * ay,
                k = 1 + vary * (rnd() - 0.5) * 0.6,
                a = vary * (rnd() - 0.5) * Math.PI / 3,
                co = k * Math.cos(a),
                si = k * Math.sin(a);
            return { k, t: [co, si, -si, co, ox + ddx - (co * cx - si * cy), oy + ddy - (si * cx + co * cy)] };
        }
        function morphEmitExpand(entries, S) {
            const out = entries.slice(),
                clampN = (v, a, b, d) => Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : d;
            for (let ei = 0; ei < entries.length; ei++) {
                const o = entries[ei];
                if (!o || typeof o !== 'object' || Array.isArray(o) || !o.emit)
                    continue;
                const E = o.emit,
                    n = Math.round(clampN(E.count, 1, 200, 12)),
                    spread = Array.isArray(E.spread) ? E.spread : [6, 0],
                    vary = clampN(E.vary, 0, 1, 0.5),
                    keys = (Array.isArray(o.keys) ? o.keys : [o.keys]).filter(i => S[i]),
                    uniq = [...new Set(keys)];
                out[ei] = Object.assign({}, o, { emit: undefined });
                const B0 = uniq.length ? morphShapeBox(S[uniq[0]]) : null;
                if (!B0)
                    continue;
                const H = Math.max(1e-9, B0.y1 - B0.y0),
                    cx = B0.cx,
                    cy = (B0.y0 + B0.y1) / 2;
                const rnd = morphRand(E.seed);
                for (let c = 1; c < n; c++) {
                    const { t } = morphEmitMap(rnd, vary, cx, cy, clampN(spread[0], 0, 400, 6) * H, clampN(spread[1], 0, 400, 0) * H, cx, cy),
                        map = new Map();
                    for (const i of uniq) {
                        const cp = spCopyXform(S[i], t);
                        if (!cp)
                            continue;
                        state.subpaths.splice(state.subpaths.indexOf(S[i]) + 1, 0, cp);
                        S.push(cp);
                        map.set(i, S.length - 1);
                    }
                    if (map.size !== uniq.length)
                        continue;
                    // a motion's distances are in its own heights, and a copy turned or sized is a different
                    // height: carried distances are put back in the first's, so every flake falls as far
                    const Bc = morphShapeBox(S[map.get(uniq[0])]),
                        f = Bc ? H / Math.max(1e-9, Bc.y1 - Bc.y0) : 1;
                    out.push(Object.assign({}, o, {
                        emit: undefined,
                        keys: keys.map(i => map.get(i)),
                        phase: rnd(),
                        motion: morphVaryMotion(o.motion, vary, rnd, f)
                    }));
                }
            }
            return out;
        }
        // COPIES FROM THE STRIP (27 Oct 2026, Tom: "1,2,3,4"): the same emitter for morphs already live. Each
        // selected morph is made count times over, the copies scattered across most of the view's width and a
        // little of its height round the shape's level, each sized and turned a little, with its own phase and its
        // motion varied; its path, timing, clip, trail, parent and facing kept, and a contact still on its targets.
        // The copies are ordinary morphs (their own shapes beside the first in the drawing), and the whole scatter
        // is one undo step.
        function morphEmitRuns(runs, count, seed, viewBox) {
            const rnd = morphRand(seed),
                vary = 0.5,
                made = [];
            for (const run of runs) {
                if (morphRuns.indexOf(run) < 0 || state.subpaths.indexOf(run.sp) < 0)
                    continue;
                const Z = morphMotionSize(run),
                    H = 2 * Z.h,
                    ax = viewBox ? 0.9 * (viewBox.x1 - viewBox.x0) : 12 * H,
                    ay = viewBox ? 0.25 * (viewBox.y1 - viewBox.y0) : 2 * H,
                    ox = viewBox ? (viewBox.x0 + viewBox.x1) / 2 : Z.cx,
                    own = morphSaveOwn(run, false, null);
                if (own.path)
                    own.path = Object.assign({}, own.path, { member: null }); // the line ridden stays the first's to give back
                for (let c = 1; c < count; c++) {
                    const { t, k } = morphEmitMap(rnd, vary, Z.cx, Z.cy, ax, ay, ox, Z.cy),
                        P = (x, y) => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]],
                        cp = spCopyXform(run.sp, t);
                    if (!cp)
                        continue;
                    const keys = run.keys.map(K => {
                        const X = new Float64Array(K.x.length),
                            Y = new Float64Array(K.x.length);
                        for (let i = 0; i < X.length; i++)
                            [X[i], Y[i]] = P(K.x[i], K.y[i]);
                        if (!run.exact)
                            return { x: X, y: Y };
                        return {
                            x: X,
                            y: Y,
                            r: Float64Array.from(K.r, v => v * k),
                            c: K.c.map(e => e ? [...P(e[0], e[1]), ...P(e[2], e[3])] : null)
                        };
                    });
                    state.subpaths.splice(state.subpaths.indexOf(run.sp) + 1, 0, cp);
                    const nr = {
                        keys,
                        exact: !!run.exact,
                        curved: run.exact ? morphExactCurved(keys) : undefined,
                        sp: cp,
                        inPlace: run.inPlace,
                        lag: run.lag || 0,
                        spec: null,
                        freq: null,
                        fx: run.fx ? Object.assign({}, run.fx) : null,
                        members: [],
                    };
                    const Bc = morphShapeBox(cp),
                        f = Bc ? H / Math.max(1e-9, Bc.y1 - Bc.y0) : 1;
                    morphRestoreOwn(nr, Object.assign({}, own, { phase: rnd(), motion: morphVaryMotion(run.motion, vary, rnd, f), onto: null }));
                    if (run.ontoLink) // a contact stays on its targets, each copy landing on them from where it is
                        morphOntoLink(nr, morphVaryMotion(run.ontoLink.raw, vary, rnd, f), run.ontoLink.targets);
                    if (run.parent)
                        morphSetParent(nr, run.parent, run.parentAt);
                    if (run.look) {
                        nr.look = run.look;
                        nr.lookRef = run.lookRef;
                    }
                    morphRuns.push(nr);
                    made.push(nr);
                }
            }
            return made;
        }
        // one motion (not a chain) set onto the box B, the shape (size Z) carried (ox, oy) from where it
        // is drawn; null when that kind has nothing to land on
        function morphMotionOntoBox(M, Z, B, ox, oy) {
            const H = 2 * Z.h,
                cx = Z.cx + ox,
                cy = Z.cy + oy,
                m = Object.assign({}, M);
            delete m.onto;
            if (M.kind === 'fall' || M.kind === 'bounce') {
                const gap = (cy - Z.h) - B.y1; // its bottom above the other's top
                m.ground = -gap / H;
                if (M.kind === 'fall' && gap > 0)
                    m.amount = gap / H;
            } else if (M.kind === 'throw')
                m.to = [(B.cx - cx) / H, (B.y1 + Z.h - cy) / H];
            else if (M.kind === 'roll')
                m.amount = B.cx >= cx ? (B.x0 - (cx + Z.w)) / (2 * Z.w) : (B.x1 - (cx - Z.w)) / (2 * Z.w);
            else
                return null;
            return morphMotionOk(m, !!M.share);
        }
        // a motion as given (with `onto` naming a shape by what `shapeOf` returns for it) worked onto the
        // run's shape; a chain's steps in turn, each from where the ones before leave it
        function morphMotionOnto(run, M, shapeOf) {
            const ok = morphMotionOk(M);
            if (!ok)
                return null;
            const Z = morphMotionSize(run),
                C = { x: Z.cx, y: Z.cy },
                boxOf = q => {
                    const sp = q && q.onto != null ? shapeOf(q.onto) : null;
                    return sp ? morphShapeBox(sp) : null;
                };
            if (ok.kind !== 'chain') {
                const B = boxOf(M);
                return B ? morphMotionOntoBox(ok, Z, B, 0, 0) || ok : ok;
            }
            let ox = 0,
                oy = 0;
            ok.steps = ok.steps.map((q, i) => {
                const B = boxOf(M.steps.slice(0, 8).filter(x => morphMotionOk(x, true))[i]),
                    r = B ? morphMotionOntoBox(q, Z, B, ox, oy) || q : q,
                    E = morphMotionMap(r, 1, C, Z, run, 0, true);
                ox += E.dx;
                oy += E.dy;
                return r;
            });
            return ok;
        }
        // CONTACT THAT FOLLOWS (27 Oct 2026, Tom: "1,2,3,4"): worked out once, a motion set onto a table kept
        // landing where the table had been. So the run keeps the motion as it was given (`raw`, each `onto` a slot
        // in `targets`, the shapes themselves) and works it out again whenever a target's box changes: move the
        // table, edit the shelf, and the ball lands on it. At most a few times a second, since a box can cost an
        // outline. Saved (and undone) by the targets' places among the saved shapes; written into a scene link as
        // their numbers there. A target that leaves the drawing leaves the motion as it last was.
        function morphOntoLink(run, raw, targets) {
            run.ontoLink = { raw: JSON.parse(JSON.stringify(raw)), targets: targets.slice(), sig: null, t: 0 };
            morphOntoRefresh(run, true);
        }
        function morphOntoRefresh(run, force) {
            const L = run.ontoLink;
            if (!L)
                return;
            const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
            if (!force && now - L.t < 150)
                return;
            L.t = now;
            if (!L.targets.every(sp => sp && (state.subpaths.indexOf(sp) >= 0 || morphRuns.some(r => r.sp === sp))))
                return;
            const boxes = L.targets.map(morphShapeBox);
            if (boxes.some(b => !b))
                return;
            const sig = boxes.map(b => [b.x0, b.x1, b.y0, b.y1].map(v => v.toPrecision(7)).join(',')).join(';');
            if (!force && sig === L.sig)
                return;
            L.sig = sig;
            const m = morphMotionOnto(run, L.raw, k => L.targets[k]);
            if (m)
                run.motion = m;
        }
        // a motion as given in a scene link (onto by shape number, S the link's shapes) set on the run: linked
        // when it names any shape, plain numbers otherwise
        function morphMotionSet(run, M, S) {
            const targets = [],
                slot = i => {
                    const sp = Number.isInteger(i) && S[i] ? S[i] : null;
                    if (!sp)
                        return undefined;
                    if (targets.indexOf(sp) < 0)
                        targets.push(sp);
                    return targets.indexOf(sp);
                };
            run.ontoLink = null;
            if (!M || typeof M !== 'object') {
                run.motion = null;
                return;
            }
            const raw = JSON.parse(JSON.stringify(M));
            if (raw.onto != null)
                raw.onto = slot(raw.onto);
            if (Array.isArray(raw.steps))
                for (const q of raw.steps)
                    if (q && q.onto != null)
                        q.onto = slot(q.onto);
            if (targets.length)
                morphOntoLink(run, raw, targets);
            else
                run.motion = morphMotionOk(M);
        }
        // where a fall is at time s (gravity 1) when dropped from D and keeping e of its speed at each bounce:
        // its height above the ground and its speed there
        function morphFallAt(s, D, e) {
            const t0 = Math.sqrt(2 * D);
            if (s < t0)
                return { y: D - s * s / 2, v: s };
            s -= t0;
            for (let i = 1, v0 = t0 * e; v0 > 1e-4 * t0 && i < 64; i++, v0 *= e) {
                const d = 2 * v0;
                if (s < d)
                    return { y: v0 * s - s * s / 2, v: Math.abs(v0 - s) };
                s -= d;
            }
            return { y: 0, v: 0 };
        }
        // the motion at t as a map of the page: { at(x, y), inv(x, y), det }, or null when the morph has none
        function morphMotionXform(run, t) {
            if (run.ontoLink)
                morphOntoRefresh(run); // CONTACT THAT FOLLOWS
            const M = run.motion;
            if (!M)
                return null;
            const u = run.clip ? morphClipP(run, t) : ((t * (run.rate || 1) + (run.phase || 0)) % 1 + 1) % 1;
            const B = morphBareCentre(run, t),
                C = (morphPathOf(run) || run.spin) ? morphPlace(run, t, B) : B,
                Z = morphMotionSize(run);
            if (M.kind !== 'chain')
                return morphMotionMap(M, u, C, Z, run, t, false);
            // MOTIONS IN A ROW (27 Oct 2026, Tom: "2,4,5"): a chain's steps one after another, each its
            // share of the cycle, each starting where the last ended. What a step leaves behind is where
            // it carried the shape and how far it turned it (a throw's landing, a roll's distance and its
            // turn, a fall's drop to a lower floor); the next step is worked out as if from rest and then
            // carried there, turned in place first, so a throw after a roll still goes the way it says.
            const S = M.steps,
                tot = S.reduce((a, q) => a + q.share, 0);
            let i = 0,
                lo = 0;
            while (i < S.length - 1 && u >= lo + S[i].share / tot) {
                lo += S[i].share / tot;
                i++;
            }
            const v = Math.max(0, Math.min(1, (u - lo) / (S[i].share / tot)));
            let ax = 0,
                ay = 0,
                ath = 0;
            for (let j = 0; j < i; j++) {
                const E = morphMotionMap(S[j], 1, C, Z, run, t, true);
                ax += E.dx;
                ay += E.dy;
                ath += E.th;
            }
            const F = morphMotionMap(S[i], v, C, Z, run, t, true),
                ca = Math.cos(ath),
                sa = Math.sin(ath);
            return {
                det: F.det,
                turn: F.turn + ath,
                dx: F.dx + ax,
                dy: F.dy + ay,
                th: F.th + ath,
                at(x, y) {
                    const ux = x - C.x,
                        uy = y - C.y,
                        q = F.at(C.x + ca * ux - sa * uy, C.y + sa * ux + ca * uy);
                    return [q[0] + ax, q[1] + ay];
                },
                inv(x, y) {
                    const q = F.inv(x - ax, y - ay),
                        ux = q[0] - C.x,
                        uy = q[1] - C.y;
                    return [C.x + ca * ux + sa * uy, C.y - sa * ux + ca * uy];
                }
            };
        }
        // one motion (not a chain) at u in its cycle, measured from the centre C and the size Z; in a
        // chain a roll goes one way and a drift does not fade, so the next step can start where it ends
        // SCENE-WIDE GRAVITY AND WIND (27 Oct 2026, Tom: "1,2,3"). One gravity and one wind for the whole scene,
        // so everything that falls agrees and everything the wind pushes leans the same way.
        //   gravity (state.morphGravity, 1 to 4): a cycle is the loop's to give, so the floatiest a hop, a fall or a
        //            throw can be is the whole cycle in the air (1, as before). More gravity and it is over sooner,
        //            in 1/√g of the cycle, as a heavier world would have it, and then it rests until the next; a
        //            swing swings round(√g) times a cycle, a pendulum's period going as 1/√g.
        //   wind     (state.morphWind, −1 left to 1 right): a sway leans its way and flutters less about it, a
        //            swing hangs pushed its way, a drift is carried along with it.
        // Lighter than the loop allows would need more than one loop to fall through, which a loop that closes
        // cannot give; so gravity starts at 1.
        function morphGravity() {
            return Math.max(1, Math.min(4, +state.morphGravity || 1));
        }
        function morphWind() {
            return Math.max(-1, Math.min(1, +state.morphWind || 0));
        }
        function morphMotionMap(M, u, C, Z, run, t, inChain) {
            const H = 2 * Z.h,
                g = (M.ground || 0) * H, // CONTACT: a floor other than where the shape is drawn
                G = morphGravity(),
                W = morphWind(),
                fG = 1 / Math.sqrt(G); // the share of a cycle a hop, a fall or a throw takes
            let sx = 1, sy = 1, px = C.x, py = C.y, th = 0, rx = C.x, ry = C.y, dx = 0, dy = 0, kx = 0;
            const ground = C.y - Z.h;
            if (M.kind === 'bounce') {
                const air = u < fG; // GRAVITY: the hop over its share of the cycle, then standing still
                u = air ? u / fG : 1;
                dy = 4 * M.amount * H * u * (1 - u) + g;
                const w = 0.08,
                    near = Math.min(u, 1 - u);
                if (!air) {
                    // resting on the ground between hops, neither squashed nor stretched
                } else if (near < w) { // squashed against the ground, flattest at the moment it lands
                    const f = M.squash * (1 - near / w);
                    sy = 1 - f;
                    sx = 1 + f;
                } else { // stretched the way it travels, most just after it leaves the ground and just before it lands
                    const st = 0.5 * M.squash * Math.abs(1 - 2 * u) * Math.min(1, (near - w) / w);
                    sy = 1 + st;
                    sx = 1 / (1 + st);
                }
                px = C.x;
                py = ground + (M.ground || 0) * H;
            } else if (M.kind === 'fall') {
                const D = M.amount * H,
                    t0 = Math.sqrt(2 * D),
                    e = M.bounce,
                    T = t0 * (1 + 2 * e / Math.max(1e-9, 1 - e)),
                    q = morphFallAt(Math.min(1, u / fG) * T * 0.98, D, e), // GRAVITY: sooner, then at rest
                    band = 0.06 * H;
                dy = q.y + g;
                if (q.y < band && q.v > 0) {
                    const f = M.squash * (q.v / t0) * (1 - q.y / band);
                    sy = 1 - f;
                    sx = 1 + f;
                }
                px = C.x;
                py = ground + g;
            } else if (M.kind === 'swing') {
                // GRAVITY: round(√g) swings a cycle; WIND: hanging pushed its way by up to half the swing
                th = M.amount * Math.PI / 180 * (Math.sin(TAU * Math.max(1, Math.round(Math.sqrt(G))) * u) + 0.5 * W);
                const pv = M.pivot;
                rx = C.x + (pv === 'left' ? -Z.w : pv === 'right' ? Z.w : 0);
                ry = C.y + (pv === 'top' ? Z.h : pv === 'bottom' ? -Z.h : 0);
            } else if (M.kind === 'roll') {
                // rolling without skidding: the turn is the distance gone over the radius (half its width)
                const P = morphPathOf(run);
                let dist;
                if (P) { // along its own path (or the shared one): the path's length times the share of it gone
                    if (P._len == null) {
                        P._len = 0;
                        for (let i = 1; i < P.x.length; i++)
                            P._len += Math.hypot(P.x[i] - P.x[i - 1], P.y[i] - P.y[i - 1]);
                    }
                    const tp = (run.clip ? morphClipP(run, t) : t) * (run.laps || 1);
                    if (P.mode === 'back')
                        dist = P._len * (1 - Math.cos(TAU * tp)) / 2;
                    else { // round a loop in whole turns, so the loop closes (within half a turn of rolling true)
                        const n = Math.max(1, Math.round(P._len / (TAU * Z.w)));
                        dist = TAU * Z.w * n * tp;
                    }
                } else { // across and back, easing at each end (in a chain, across once)
                    dist = M.amount * 2 * Z.w * (1 - Math.cos((inChain ? Math.PI : TAU) * u)) / 2;
                    dx = dist;
                }
                th = -dist / Z.w;
            } else if (M.kind === 'throw') {
                // a parabola through where it is drawn and the target, its top `amount` heights above the higher end,
                // going across at an even speed (gravity acts only up and down)
                const X = M.to[0] * H,
                    Y = M.to[1] * H,
                    A = Math.max(0, Y) + Math.max(1e-6, M.amount) * H,
                    b = 4 * A - 2 * Y,
                    c2 = (b + Math.sqrt(Math.max(0, b * b - 4 * Y * Y))) / 2,
                    c1 = c2 + Y;
                const v = Math.min(1, u / fG); // GRAVITY: lands sooner and waits there
                dx = X * v;
                dy = c1 * v - c2 * v * v;
            } else if (M.kind === 'sway') {
                // a shear from the base: the base still, the top moving most, a slow push and a quicker flutter
                // WIND: leaning its way, fluttering less about the lean
                const a = M.amount * Math.PI / 180 * (0.8 * W + (1 - 0.5 * Math.abs(W)) * (0.75 * Math.sin(TAU * u) + 0.25 * Math.sin(3 * TAU * u)));
                kx = Math.tan(a);
                py = ground;
            } else if (M.kind === 'drift') {
                // EMITTERS: carried `to` (in its heights) once a cycle at an even speed, wobbling across
                // its way by `amount` widths twice a cycle; grown in and shrunk out at the ends so the
                // jump back to the start is never seen (not in a chain, where the next step goes on)
                const X = M.to[0] * H,
                    Y = M.to[1] * H,
                    L = Math.hypot(X, Y) || 1,
                    wob = M.amount * 2 * Z.w * Math.sin(TAU * 2 * u);
                dx = X * u - Y / L * wob + W * 0.6 * L * u; // WIND: carried along with it
                dy = Y * u + X / L * wob;
                if (!inChain) {
                    const f = Math.max(0.001, Math.min(1, u / 0.08, (1 - u) / 0.08));
                    sx = sy = f;
                }
            } else if (M.kind === 'pop') {
                // from nothing to its size, overshooting and settling: a damped spring let go at the start
                const d = 3 + 9 * (1 - M.amount),
                    k = Math.max(0.001, 1 - Math.exp(-d * u) * Math.cos(12 * u) + u * Math.exp(-d) * Math.cos(12));
                sx = sy = k;
            } else { // spring
                const v = Math.exp(-5 * u) * Math.sin(TAU * M.bounces * u),
                    a = M.amount;
                if (M.along === 'y')
                    dy = a * H * v;
                else if (M.along === 'x')
                    dx = a * 2 * Z.w * v;
                else if (M.along === 'scale') {
                    sx = sy = Math.max(0.05, 1 + a * v);
                    px = C.x;
                    py = ground;
                } else {
                    th = a * Math.PI / 3 * v;
                    rx = C.x;
                    ry = ground;
                }
            }
            const cs = Math.cos(th),
                sn = Math.sin(th);
            return {
                det: sx * sy,
                turn: th,
                dx,
                dy,
                th, // where it has carried the shape and how far turned it: a chain's next step starts there
                at(x, y) {
                    let X = px + sx * (x - px),
                        Y = py + sy * (y - py);
                    X += kx * (Y - py);
                    const ux = X - rx,
                        uy = Y - ry;
                    return [rx + cs * ux - sn * uy + dx, ry + sn * ux + cs * uy + dy];
                },
                inv(x, y) {
                    const ux = x - dx - rx,
                        uy = y - dy - ry;
                    let X = rx + cs * ux + sn * uy;
                    const Y = ry - sn * ux + cs * uy;
                    X -= kx * (Y - py);
                    return [px + (X - px) / sx, py + (Y - py) / sy];
                }
            };
        }
        // ── A MORPH THAT PLAYS ONCE (26 Oct 2026, Tom: "proceed with your recommendations": sequencing) ──
        // Everything so far loops: a morph goes round its keys (and its path, and its spin) once or a
        // whole number of times a loop. A clip (run.clip = {start, len}, shares of the loop) plays once
        // instead, in its window: before it the morph holds its first key where its ride begins, through
        // it the morph goes from its first key to its last (its path ridden once, its spin turned), and
        // after it holds its last key where its ride ends. Clips placed one after another on the
        // timeline are a sequence, this, then that, then the other, and the loop plays the whole
        // sequence and comes round to its start. A clip takes the place of rate and phase.
        function morphClipP(run, t) {
            const c = run.clip;
            return Math.max(0, Math.min(1, (t - c.start) / Math.max(1e-6, c.len)));
        }
        function morphClipOk(c) {
            return !!c && Number.isFinite(+c.start) && Number.isFinite(+c.len) && c.start >= 0 && c.len > 0 && c.start + c.len <= 1 + 1e-9;
        }
        // A CLIP SEEN ONLY WHEN IT PLAYS (26 Oct 2026, Tom: "1,2,5"). Outside its window a clip holds its
        // first or last pose, which keeps it on screen the whole loop. clip.show says otherwise:
        //   'during'  seen only within its window;
        //   'fade'    fading in over the window's first sixth and out over its last, unseen outside;
        //   'in'      unseen before, fading in over the first sixth, and staying after;
        //   'out'     there from the start, fading out over the last sixth, and gone after.
        // So a sequence can bring things on and take them off: a title, then a shape, then the next. It is
        // a factor on the drawing (sp._fade), never on the shape's own colours, so nothing of it is saved
        // in the drawing.
        //   'draw'    DRAWING A LINE ON (28 Oct 2026, Tom: "1-3", for explainers): unseen before its window,
        //             its outline drawn from its start to its end over the window (sp._draw, the share
        //             drawn), its fill coming in over the window's last part; whole after. A line (an
        //             arrow, an underline) is drawn on the way a pen would; a filled shape is outlined and
        //             then filled.
        const MORPH_SHOWS = ['during', 'fade', 'in', 'out', 'draw'],
            MORPH_FADE = 1 / 6,
            MORPH_DRAW_FILL = 0.3; // the last share of a 'draw' window, over which the fill comes in
        // IN AND OUT, EACH ITS OWN (28 Oct 2026, Tom: "1,2,3": a line drawn on could never go again, and a fade took a
        // sixth of its window whatever the window). A clip may say how it comes and how it goes, apart:
        //   in:  {kind: 'fade' | 'draw' | 'cut', len}   unseen before its start; fading in, drawn on like a pen, or
        //                                               there at once, over len from the start
        //   out: {kind: 'fade' | 'undraw' | 'cut', len} gone after its end; fading out, the pen going back, or gone at
        //                                               once, over len up to the end
        // len a share of the loop, as start and len are. Without an in the shape is there from the loop's start;
        // without an out it stays after. A clip with either is read by them, not by show; the five shows are the
        // same thing named (morphClipIO), so every clip is read one way.
        const MORPH_IN = ['fade', 'draw', 'cut'],
            MORPH_OUT = ['fade', 'undraw', 'cut'];
        function morphClipEdge(e, kinds, len) {
            if (!e || !kinds.includes(e.kind))
                return null;
            const L = +e.len;
            return { kind: e.kind, len: Number.isFinite(L) ? Math.max(0, Math.min(len, L)) : (e.kind === 'cut' ? 0 : e.kind === 'fade' ? len * MORPH_FADE : len) };
        }
        // a clip as it is kept: start, len and show, and in and out when it has them
        function morphClipNorm(c) {
            if (!morphClipOk(c))
                return null;
            const o = { start: +c.start, len: +c.len, show: MORPH_SHOWS.includes(c.show) ? c.show : '' },
                a = morphClipEdge(c.in, MORPH_IN, o.len),
                b = morphClipEdge(c.out, MORPH_OUT, o.len);
            if (a)
                o.in = a;
            if (b)
                o.out = b;
            return o;
        }
        // how a clip comes and goes: { i, iL, o, oL } (kinds and lengths, '' where it has none), or null when it is
        // seen the whole loop
        function morphClipIO(c) {
            if (!c)
                return null;
            const L = +c.len;
            if (c.in || c.out)
                return { i: c.in ? c.in.kind : '', iL: c.in ? +c.in.len : 0, o: c.out ? c.out.kind : '', oL: c.out ? +c.out.len : 0 };
            switch (c.show) {
            case 'during': return { i: 'cut', iL: 0, o: 'cut', oL: 0 };
            case 'fade': return { i: 'fade', iL: L * MORPH_FADE, o: 'fade', oL: L * MORPH_FADE };
            case 'in': return { i: 'fade', iL: L * MORPH_FADE, o: '', oL: 0 };
            case 'out': return { i: '', iL: 0, o: 'fade', oL: L * MORPH_FADE };
            case 'draw': return { i: 'draw', iL: L, o: '', oL: 0 };
            }
            return null;
        }
        // the timeline's shows that are an in and an out: the kinds and their lengths as shares of the bar
        const MORPH_CLIP_PRESETS = {
            'draw-fade': { in: ['draw', 0.45], out: ['fade', 0.2] },
            'draw-undraw': { in: ['draw', 0.4], out: ['undraw', 0.3] },
            'fade-in-out': { in: ['fade', 0.06], out: ['fade', 0.06] }
        };
        // which of the shows select's entries a clip is
        function morphClipPresetOf(c) {
            if (!c)
                return '';
            if (!c.in && !c.out)
                return c.show || '';
            for (const [k, P] of Object.entries(MORPH_CLIP_PRESETS))
                if (c.in && c.out && c.in.kind === P.in[0] && c.out.kind === P.out[0] && Math.abs(c.in.len - P.in[1] * c.len) < 1e-6 && Math.abs(c.out.len - P.out[1] * c.len) < 1e-6)
                    return k;
            return 'custom';
        }
        // a clip written out (the autosave, a scene link): its numbers through f, its in and out when it has them
        function morphClipOut(c, f) {
            const o = { start: f(+c.start), len: f(+c.len), show: c.show || '' };
            if (c.in)
                o.in = { kind: c.in.kind, len: f(+c.in.len) };
            if (c.out)
                o.out = { kind: c.out.kind, len: f(+c.out.len) };
            return o;
        }
        function morphShowFactor(run, t) {
            const c = run.clip,
                io = morphClipIO(c);
            if (!io)
                return undefined;
            const s = +c.start,
                e = s + +c.len;
            if ((io.i && t < s) || (io.o && t > e))
                return 0;
            let f = 1;
            if (io.i === 'fade' && io.iL > 0)
                f = Math.min(f, Math.max(0, Math.min(1, (t - s) / io.iL)));
            if (io.o === 'fade' && io.oL > 0)
                f = Math.min(f, Math.max(0, Math.min(1, (e - t) / io.oL)));
            return f;
        }
        // DRAWING A LINE ON: how much of its outline a clip drawn on (or going back) has drawn at t (0 to 1), or
        // undefined when it is not drawn
        function morphDrawFactor(run, t) {
            const c = run.clip,
                io = morphClipIO(c);
            if (!io || (io.i !== 'draw' && io.o !== 'undraw'))
                return undefined;
            const s = +c.start,
                e = s + +c.len;
            let f = 1;
            if (io.i === 'draw')
                f = Math.min(f, Math.max(0, Math.min(1, (t - s) / Math.max(1e-6, io.iL))));
            if (io.o === 'undraw')
                f = Math.min(f, Math.max(0, Math.min(1, (e - t) / Math.max(1e-6, io.oL))));
            return f;
        }
        // …and how far its fill has come in, from that share: none until the window's last part
        function morphDrawFill(f) {
            const u = Math.max(0, Math.min(1, (f - (1 - MORPH_DRAW_FILL)) / MORPH_DRAW_FILL));
            return u * u * (3 - 2 * u);
        }
        // ── A CAMERA, AND STOPS (28 Oct 2026, Tom: "1-3", for explainers) ─────────────────────────────
        // THE CAMERA: what the scene shows, keyed on the shared clock like everything else. A key is
        // {t, box: [x0, y0, x1, y1]}, a box in the page's units that the view is fitted to (the whole box
        // seen, centred, whatever the window's shape). Between two keys the view goes from one box to
        // the next eased in and out, its centre straight across and its size by a constant ratio a moment,
        // so a zoom of a hundred times takes as long per doubling at both ends; before the first key and
        // after the last it holds. No keys, no camera: the view is the viewer's.
        function morphCameraOk(C) {
            if (!Array.isArray(C))
                return [];
            const out = [];
            for (const k of C) {
                const b = k && k.box;
                if (!k || !Number.isFinite(+k.t) || !Array.isArray(b) || b.length !== 4 || !b.every(v => Number.isFinite(+v)))
                    continue;
                const x0 = Math.min(+b[0], +b[2]),
                    x1 = Math.max(+b[0], +b[2]),
                    y0 = Math.min(+b[1], +b[3]),
                    y1 = Math.max(+b[1], +b[3]);
                if (!(x1 - x0 > 0 || y1 - y0 > 0))
                    continue;
                out.push({ t: Math.max(0, Math.min(1, +k.t)), box: [x0, y0, x1, y1] });
            }
            return out.sort((a, b) => a.t - b.t);
        }
        function morphCameraAt(C, t) {
            if (!C || !C.length)
                return null;
            if (t <= C[0].t || C.length === 1)
                return C[0].box.slice();
            const L = C[C.length - 1];
            if (t >= L.t)
                return L.box.slice();
            let i = 0;
            while (i < C.length - 2 && C[i + 1].t <= t)
                i++;
            const A = C[i].box,
                B = C[i + 1].box,
                u0 = (t - C[i].t) / Math.max(1e-9, C[i + 1].t - C[i].t),
                u = u0 * u0 * (3 - 2 * u0);
            const cx = (A[0] + A[2]) / 2 + u * ((B[0] + B[2]) / 2 - (A[0] + A[2]) / 2),
                cy = (A[1] + A[3]) / 2 + u * ((B[1] + B[3]) / 2 - (A[1] + A[3]) / 2),
                lg = (a, b) => Math.exp(Math.log(Math.max(1e-12, a)) * (1 - u) + Math.log(Math.max(1e-12, b)) * u),
                w = lg(A[2] - A[0], B[2] - B[0]),
                h = lg(A[3] - A[1], B[3] - B[1]);
            return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
        }
        // STOPS: places on the clock where playing waits, the beats of an explainer. Played through them
        // (a reader's page, the embed, the player; the editor when its timeline's "stops" is on), the clock
        // stops on each and goes on when told to, and at the end of the loop it waits too rather than
        // coming round, so the explainer ends where it ends; told to go on from there, it starts over.
        function morphStopsOk(S) {
            if (!Array.isArray(S))
                return [];
            const out = [];
            for (const v of S) {
                const t = +(v && typeof v === 'object' ? v.t : v);
                if (Number.isFinite(t) && t > 0 && t < 1 && !out.some(q => Math.abs(q - t) < 1e-4))
                    out.push(t);
            }
            return out.sort((a, b) => a - b);
        }
        // the first stop the clock passes going from a to b (b may run past 1): the stop, 1 for the end of
        // the loop, or null. Standing on a stop is not passing it, so going on from one leaves it.
        function morphStopCrossed(S, a, b) {
            if (!S || !S.length)
                return null;
            for (const s of S)
                if (a < s - 1e-9 && s <= b)
                    return s;
            return b >= 1 && a < 1 - 1e-6 ? 1 : null;
        }
        // AN EXPLAINER'S BEATS (28 Oct 2026, Tom: "1,2,3,4"): the stretches of the loop between the stops, the
        // first from 0 and the last to 1, each with a title and a few lines of text, one beat for each stretch, in
        // order. A reader of the scene can put the text beside the picture (the scrolling explainer page builds
        // itself from them); the scene plays the same with or without them.
        function morphBeatsOk(B, n) {
            const out = (Array.isArray(B) ? B : []).map(b => ({
                title: String(b && b.title != null ? b.title : '').slice(0, 200),
                text: String(b && b.text != null ? b.text : '').slice(0, 4000)
            }));
            if (n != null) {
                while (out.length < n)
                    out.push({ title: '', text: '' });
                out.length = n;
            }
            return out;
        }
        function morphBeatSpans(S) {
            const st = morphStopsOk(S),
                out = [];
            for (let i = 0; i <= st.length; i++)
                out.push({ from: i ? st[i - 1] : 0, to: i < st.length ? st[i] : 1 });
            return out;
        }
        // the stop before t (or the start), where going back lands
        function morphStopBefore(S, t) {
            let q = 0;
            for (const s of S || [])
                if (s < t - 1e-3)
                    q = s;
            return q;
        }
        // the morph's own clock: `rate` times round a loop, `phase` ahead (0 to 1); the shared clock
        // when it has neither. A whole rate keeps the loop seamless.
        function morphRunT(run, t) {
            if (run.clip) { // A MORPH THAT PLAYS ONCE: from its first key to its last over its window
                const p = morphClipP(run, t),
                    K = run.keys.length;
                if (K < 2)
                    return p;
                const T = morphKeyTimes(run);
                return T[0] + p * (T[K - 1] - T[0]);
            }
            const r = run.rate || 1,
                p = run.phase || 0;
            if (r === 1 && !p)
                return t;
            return ((t * r + p) % 1 + 1) % 1;
        }
        // COLOUR THAT MORPHS (25 Oct 2026): each key's fill, blended by the keys' own weights in
        // linear light (so red to green passes through yellow, not mud), as the fill of the pose.
        // run.cols holds each key's colour as linear {r, g, b} and an opacity, or is null when the
        // keys share one colour.
        const _lin = v => (v /= 255) <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
            _srgb = v => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
        function morphColOf(fill) {
            const m = fill && typeof fill.color === 'string' && fill.color.match(/^#([0-9a-f]{6})$/i);
            if (!m)
                return null;
            const v = parseInt(m[1], 16);
            return { r: _lin(v >> 16), g: _lin((v >> 8) & 255), b: _lin(v & 255), a: fill.opacity != null ? +fill.opacity : 1 };
        }
        function morphColsOf(fills) {
            const cols = fills.map(morphColOf);
            if (cols.length < 2 || cols.some(c => !c))
                return null;
            const same = cols.every(c => Math.abs(c.r - cols[0].r) + Math.abs(c.g - cols[0].g) + Math.abs(c.b - cols[0].b) + Math.abs(c.a - cols[0].a) < 1e-9);
            return same ? null : cols;
        }
        function morphColourAt(run, t) {
            const K = run.keys.length,
                w = morphWeightsOf(morphRunT(run, t), K, run);
            let r = 0,
                g = 0,
                b = 0,
                a = 0;
            for (let k = 0; k < K; k++) {
                const c = run.cols[k];
                r += w[k] * c.r;
                g += w[k] * c.g;
                b += w[k] * c.b;
                a += w[k] * c.a;
            }
            const cl = v => Math.max(0, Math.min(1, v)),
                hx = v => _srgb(cl(v)).toString(16).padStart(2, '0');
            return { color: '#' + hx(r) + hx(g) + hx(b), opacity: cl(a) };
        }
        function morphApplyPath(run, X, Y, t) {
            const N = X.length;
            let cx = 0,
                cy = 0;
            for (let i = 0; i < N; i++) {
                cx += X[i];
                cy += Y[i];
            }
            cx /= N;
            cy /= N;
            const q = morphPlace(run, t, { x: cx, y: cy }),
                c = Math.cos(q.turn),
                s = Math.sin(q.turn);
            for (let i = 0; i < N; i++) {
                const dx = X[i] - cx,
                    dy = Y[i] - cy;
                X[i] = q.x + c * dx - s * dy;
                Y[i] = q.y + s * dx + c * dy;
            }
        }
        // ── ONE MORPH RIDING ANOTHER (25 Oct 2026, Tom: "1,3") ───────────────────────────────
        // A morph may follow another (run.parent): it does all it does of its own (its keys, its
        // path, its spin), and then the parent's whole motion carries it, every move and turn the
        // parent makes from where it was drawn. A moon on its own little orbit drawn round the
        // planet goes round the sun with the planet; a bee's wings, drawn on its body, go where the
        // body goes and turn as it turns. A parent may follow another in its turn (a chain, eight
        // deep at most); a morph cannot follow itself or one that follows it.
        //
        // The parent's motion is measured from its keys' own blend (where it would be with no path,
        // spin or parent) to where it is: a turn about that centre and a move to its placed centre.
        // So a follower drawn beside the parent as drawn (a moon's orbit round the planet where the
        // planet was drawn) keeps that place. A parent picked by hand in the strip is different: the
        // two are wherever they are at that moment, so run.parentAt keeps that moment, and the
        // follower is carried by the parent's motion since then, starting from where it stands.
        function morphBareCentre(run, t) {
            if (!run._centres || run._centres.length !== run.keys.length)
                run._centres = run.keys.map(k => run.exact ? exactCentre(k) : (() => {
                    let cx = 0,
                        cy = 0;
                    for (let i = 0; i < k.x.length; i++) {
                        cx += k.x[i];
                        cy += k.y[i];
                    }
                    return { x: cx / k.x.length, y: cy / k.x.length };
                })());
            const w = morphWeightsOf(morphRunT(run, t), run.keys.length, run);
            let x = 0,
                y = 0;
            for (let k = 0; k < w.length; k++) {
                x += w[k] * run._centres[k].x;
                y += w[k] * run._centres[k].y;
            }
            return { x, y };
        }
        // ── FOLLOWING LOOSELY, AND FACING (25 Oct 2026, Tom: "proceed", to "morphs reacting to each
        // other") ──────────────────────────────────────────────────────────────────────────────
        // A follower can be carried three ways (run.follow = {kind, amount}):
        //   tight   the parent's motion as it is, the way it always was;
        //   lag     the parent's motion as it was a while ago: up to a quarter of a loop behind;
        //   spring  pulled toward where tight would put it by a damped spring, so it trails a moving
        //           parent, swings past when the parent stops or turns, and settles: the follow-through
        //           and overlap that make a tail, an antenna or a passenger feel loose. The spring's
        //           place and turn are worked out over the whole loop beforehand (the run of three
        //           loops, keeping the last, where the motion loops, so the swing it carries round the
        //           seam is its own and the loop still closes), then read like a table.
        // The amount loosens either: a longer lag, a softer spring (3 to 20 swings a loop).
        // A morph can also face another (run.look): turned about its own centre, after everything
        // else, so it keeps facing the other's centre, starting from the way it faces when set.
        const MORPH_FOLLOW = ['lag', 'spring'],
            MORPH_SPRING_N = 256;
        function morphParentXform(run, t, depth) {
            const f = run && run.parent && run.follow;
            if (f && f.kind === 'lag') {
                let u = t - 0.25 * Math.max(0, Math.min(1, +f.amount || 0));
                if (u < 0)
                    u = morphLoops(run.parent) ? u + 1 : 0;
                return morphParentXformTight(run, u, depth);
            }
            if (f && f.kind === 'spring')
                return morphSpringXform(run, t, depth);
            return morphParentXformTight(run, t, depth);
        }
        // what a spring's table depends on: everything that moves the chain of parents or the follower
        function morphMotionSig(run) {
            const bits = [];
            for (let r = run, n = 0; r && n < 10; r = r.parent, n++)
                bits.push([morphRuns.indexOf(r), r.keys.length, r.rate || 1, +r.phase || 0, +r.spin || 0, r.laps || 1, r.at, r.parentAt,
                    r.times && r.times.join(','), r.eases && r.eases.join(','), r.path ? r.path.x.length + ':' + r.path.x[0] : '',
                    r.follow && r.follow.kind + (r.follow.amount || 0), r._keyEpoch || 0, r.clip ? r.clip.start + ':' + r.clip.len : '',
                    r.motion ? JSON.stringify(r.motion) : ''].join(';')); // a parent's motion carries its followers too
            return bits.join('|') + '|' + (morphLive.path ? morphLive.path.x.length : 0) + state.morphEase + (+state.morphHold || 0) + '|' + morphGravity() + '|' + morphWind();
        }
        function morphSpringXform(run, t, depth) {
            const tight = u => morphParentXformTight(run, u, depth);
            const A = tight(t);
            if (!A)
                return null;
            const sig = morphMotionSig(run);
            if (!run._spring || run._spring.sig !== sig) {
                const N = MORPH_SPRING_N,
                    loops = morphLoops(run.parent) && morphLoops(run),
                    amt = Math.max(0, Math.min(1, +run.follow.amount || 0)),
                    w = TAU * (3 + 17 * (1 - amt)), // rad per loop
                    z = 0.3;
                const goal = new Float64Array(3 * (N + 1));
                for (let i = 0; i <= N; i++) {
                    const u = Math.min(i / N, loops ? 1 : 0.999999),
                        B = tight(u),
                        c = morphCentreOwn(run, u),
                        [px, py] = B.at(c.x, c.y);
                    goal[3 * i] = px;
                    goal[3 * i + 1] = py;
                    goal[3 * i + 2] = B.turn;
                }
                const out = new Float64Array(3 * (N + 1)),
                    sub = 4,
                    dt = 1 / (N * sub),
                    S = [goal[0], goal[1], goal[2]],
                    V = [0, 0, 0];
                const passes = loops ? 3 : 1;
                for (let pass = 0; pass < passes; pass++)
                    for (let i = 0; i < N; i++) {
                        if (pass === passes - 1)
                            for (let d = 0; d < 3; d++)
                                out[3 * i + d] = S[d];
                        for (let j = 0; j < sub; j++) {
                            const a = (j + 0.5) / sub;
                            for (let d = 0; d < 3; d++) {
                                // the turn is carried on: a loop's goal turn may end whole turns from where it began
                                const g0 = goal[3 * i + d] + (d === 2 ? pass * (goal[3 * N + 2] - goal[2]) : 0),
                                    g1 = goal[3 * (i + 1) + d] + (d === 2 ? pass * (goal[3 * N + 2] - goal[2]) : 0),
                                    g = g0 + a * (g1 - g0);
                                V[d] += (w * w * (g - S[d]) - 2 * z * w * V[d]) * dt;
                                S[d] += V[d] * dt;
                            }
                        }
                    }
                for (let d = 0; d < 3; d++)
                    out[3 * N + d] = S[d];
                if (loops) // the last pass's turn back by the whole turns the passes before it added
                    for (let i = 0; i <= N; i++)
                        out[3 * i + 2] -= (passes - 1) * (goal[3 * N + 2] - goal[2]);
                run._spring = { sig, out };
            }
            const O = run._spring.out,
                x = Math.max(0, Math.min(1, t)) * MORPH_SPRING_N,
                i = Math.min(MORPH_SPRING_N - 1, Math.floor(x)),
                a = x - i,
                at = d => O[3 * i + d] + a * (O[3 * (i + 1) + d] - O[3 * i + d]);
            const px = at(0),
                py = at(1),
                turn = at(2),
                c = morphCentreOwn(run, t),
                cs = Math.cos(turn),
                sn = Math.sin(turn);
            return { turn, at: (x, y) => [px + cs * (x - c.x) - sn * (y - c.y), py + sn * (x - c.x) + cs * (y - c.y)] };
        }
        // how far a morph is turned to keep facing the one it looks at, at t (0 when it looks at none)
        function morphLookTurn(run, t) {
            const L = run && run.look;
            if (!L || L === run || morphRuns.indexOf(L) < 0)
                return 0;
            const a = morphCentreAt(run, t),
                b = morphCentreAt(L, t);
            return Math.atan2(b.y - a.y, b.x - a.x) - (run.lookRef || 0);
        }
        function morphSetLook(run, target) {
            if (!run)
                return false;
            if (target && (target === run || morphRuns.indexOf(target) < 0))
                return false;
            run.look = target || null;
            run.lookRef = 0;
            if (target) { // facing the way it faces now: nothing turns at the moment it is set
                const a = morphCentreAt(run, morphLive.t),
                    b = morphCentreAt(target, morphLive.t);
                run.lookRef = Math.atan2(b.y - a.y, b.x - a.x);
            }
            return true;
        }
        // the parent's motion at t as a function on points, or null for a morph that follows none
        function morphParentXformTight(run, t, depth) {
            const A = morphParentRigid(run, t, depth);
            if (!A)
                return null;
            if (run.parentAt == null)
                return A;
            const A0 = morphParentRigid(run, run.parentAt, depth); // undo the parent's motion at the moment it was picked
            return {
                turn: A.turn - A0.turn,
                at: (x, y) => {
                    const [u, v] = A0.back(x, y);
                    return A.at(u, v);
                }
            };
        }
        function morphParentRigid(run, t, depth) {
            const P = run && run.parent;
            if (!P || morphRuns.indexOf(P) < 0 || (depth || 0) > 8)
                return null;
            const B = morphBareCentre(P, t);
            let px = B.x,
                py = B.y,
                turn = 0;
            if (morphPathOf(P) || P.spin) {
                const q = morphPlace(P, t, B);
                px = q.x;
                py = q.y;
                turn = q.turn;
            }
            const up = morphParentXform(P, t, (depth || 0) + 1);
            // PHYSICAL MOTIONS carried too (27 Oct 2026, Tom: "1,2"): what rides a bouncing ball bounces and squashes
            // with it. The parent's own placing (path and spin), then its motion, then its own parent, in that order,
            // as its pose is made; without a motion the three fold into one turn and move as before.
            const M = morphMotionXform(P, t);
            if (M) {
                const c1 = Math.cos(turn),
                    s1 = Math.sin(turn),
                    qx = px,
                    qy = py;
                const own = (x, y) => M.at(qx + c1 * (x - B.x) - s1 * (y - B.y), qy + s1 * (x - B.x) + c1 * (y - B.y));
                const [ox, oy] = up ? up.at(0, 0) : [0, 0],
                    ut = up ? up.turn : 0,
                    uc = Math.cos(ut),
                    us = Math.sin(ut);
                return {
                    turn: turn + M.turn + ut,
                    at: (x, y) => {
                        const p = own(x, y);
                        return up ? up.at(p[0], p[1]) : p;
                    },
                    back: (x, y) => {
                        let u = x, v = y;
                        if (up) { // a parent's parent is rigid here: its turn and where it takes the origin undo it
                            const dx = x - ox, dy = y - oy;
                            u = uc * dx + us * dy;
                            v = -us * dx + uc * dy;
                        }
                        const [a, b] = M.inv(u, v);
                        return [B.x + c1 * (a - qx) + s1 * (b - qy), B.y - s1 * (a - qx) + c1 * (b - qy)];
                    }
                };
            }
            if (up) {
                [px, py] = up.at(px, py);
                turn += up.turn;
            }
            const c = Math.cos(turn),
                s = Math.sin(turn);
            return {
                turn,
                at: (x, y) => [px + c * (x - B.x) - s * (y - B.y), py + s * (x - B.x) + c * (y - B.y)],
                back: (x, y) => [B.x + c * (x - px) + s * (y - py), B.y - s * (x - px) + c * (y - py)]
            };
        }
        // whether making `parent` the parent of `run` would close a loop
        function morphFollowsLoop(run, parent) {
            for (let p = parent, n = 0; p && n < 16; p = p.parent, n++)
                if (p === run)
                    return true;
            return false;
        }
        function morphSetParent(run, parent, at) {
            if (!run)
                return false;
            if (parent && (parent === run || morphRuns.indexOf(parent) < 0 || morphFollowsLoop(run, parent)))
                return false;
            run.parent = parent || null;
            run.parentAt = parent && at != null ? at : null;
            return true;
        }

        // the selected line or curve becomes the path; with a path on, the button takes it off
        function morphSetPath(o) {
            o = o || {};
            if (!morphRunning())
                return 0;
            if (morphLive.path && !o.replace) {
                morphPathRelease(true);
                pushHistory();
                morphBarSync();
                morphWrite();
                drawAll();
                scheduleSave();
                flashStatus('path taken off · the line is back in the drawing and the shapes stand where they morph');
                return 0;
            }
            const live = new Set(morphRuns.map(r => r.sp));
            const idx = (o.index != null ? [o.index] : selectedIndices()).filter(i => state.subpaths[i] && !live.has(state.subpaths[i]));
            const sp = idx.length ? state.subpaths[idx[0]] : null;
            const poly = morphPathFrom(sp);
            const P = poly && morphPathBuild(poly.x, poly.y, poly.closed);
            if (!P) {
                flashStatus('path: select a line or a curve in the drawing (not a live shape), then press path; the live shapes will ride it');
                return 0;
            }
            if (morphLive.path)
                morphPathRelease(true);
            P.turn = state.morphPathTurn !== false;
            P.mode = state.morphPathMode === 'back' ? 'back' : 'along';
            P.member = sp;
            P.at = state.subpaths.indexOf(sp);
            state.subpaths.splice(P.at, 1);
            morphLive.path = P;
            applyShapeSelection(new Set());
            rebuildSignalSelect();
            rebuildScroller();
            morphWrite();
            morphBarSync();
            drawAll();
            pushHistory();
            scheduleSave();
            flashStatus('path · ' + (P.closed ? 'a closed curve: round once a loop' : P.mode === 'back' ? 'a line: out and back once a loop' : 'a line: start to end once a loop')
            + (morphRuns.length > 1 ? ' · ' + morphRuns.length + ' shapes spread evenly along it' : '')
            + (P.turn ? ' · turning with it' : ''));
            return 1;
        }
        // the path's shape back into the drawing (restore), or dropped with a page that has moved on
        function morphPathRelease(restore) {
            const P = morphLive.path;
            if (!P)
                return;
            morphLive.path = null;
            if (restore && P.member && state.subpaths.indexOf(P.member) < 0)
                state.subpaths.splice(Math.max(0, Math.min(state.subpaths.length, P.at)), 0, P.member);
            if (restore) {
                rebuildSignalSelect();
                rebuildScroller();
            }
        }
        // each listed morph's own path back into the drawing, the last lifted first so the places hold
        function morphRunPathsRelease(list) {
            for (const run of list.slice().reverse()) {
                const P = run.path;
                if (!P)
                    continue;
                run.path = null;
                if (P.member && state.subpaths.indexOf(P.member) < 0)
                    state.subpaths.splice(Math.max(0, Math.min(state.subpaths.length, P.at)), 0, P.member);
            }
        }
        // a morph's own path, from a shape in the drawing, which leaves the drawing while it is one
        function morphRunPathSet(run, sp, turn, mode) {
            const poly = morphPathFrom(sp),
                P = poly && morphPathBuild(poly.x, poly.y, poly.closed);
            if (!P)
                return false;
            P.turn = turn !== false;
            P.mode = mode === 'back' ? 'back' : 'along';
            P.member = sp;
            P.at = state.subpaths.indexOf(sp);
            if (P.at >= 0)
                state.subpaths.splice(P.at, 1);
            run.path = P;
            return true;
        }
        function morphPathOptions(turn, mode) {
            if (turn != null)
                state.morphPathTurn = !!turn;
            if (mode != null)
                state.morphPathMode = mode === 'back' ? 'back' : 'along';
            const P = morphLive.path;
            if (P) {
                P.turn = state.morphPathTurn !== false;
                P.mode = state.morphPathMode === 'back' ? 'back' : 'along';
            }
            morphWrite();
            morphBarSync();
            drawAll();
            scheduleSave();
            morphHistorySoon();
        }
        // the path as a dashed guide, with a dot where each shape is on it (the editor's, never a recording's)
        function drawMorphPath(w, h) {
            // the shared path, and each morph's own (EACH MORPH ITS OWN PATH)
            // A follower's own path is carried by its parent like the follower is, so the guide is drawn
            // where it is now (a moon's orbit round its planet, wherever the planet has got to).
            for (const run of morphRuns)
                if (run.path)
                    drawMorphPathOne(run.path, w, h, run.parent ? morphParentXform(run, morphLive.t) : null);
            if (morphLive.path)
                drawMorphPathOne(morphLive.path, w, h);
        }
        function drawMorphPathOne(P, w, h, PX) {
            const toPx = PX ? (x, y, w, h) => {
                const [u, v] = PX.at(x, y);
                return worldToPx(u, v, w, h);
            } : worldToPx;
            ctx.save();
            ctx.lineWidth = 1.25;
            ctx.setLineDash([3, 5]);
            ctx.strokeStyle = 'rgba(200,200,215,0.45)';
            ctx.beginPath();
            for (let i = 0; i < P.x.length; i++) {
                const q = toPx(P.x[i], P.y[i], w, h);
                if (i)
                    ctx.lineTo(q.x, q.y);
                else
                    ctx.moveTo(q.x, q.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(200,200,215,0.7)';
            const s0 = toPx(P.x[0], P.y[0], w, h);
            ctx.beginPath();
            ctx.arc(s0.x, s0.y, 3, 0, TAU);
            ctx.fill();
            ctx.restore();
        }

        // ── TRAILS (25 Oct 2026, Tom: "1,3") ──────────────────────────────────────────────
        // What a moving shape leaves behind, drawn under the shapes and in a recording:
        //   echoes  the pose at a few earlier moments, fainter the older, each in the shape's own
        //           fill and line (the morph and the effect included, so a shimmering shape leaves
        //           shimmering echoes);
        //   ribbon  the way its centre came, a tapering band as wide as the shape at its head.
        // `length` is how far back the trail reaches, up to 40% of a loop. A trail reaches back round
        // the loop only where the motion is a loop; where it jumps back (a two-key ramp, a line ridden
        // start to end) it begins at t = 0, so it never streaks across the jump.
        const MORPH_TRAILS = ['echoes', 'ribbon'],
            MORPH_ECHOES = 7;
        // a morph's own trail (EACH MORPH ITS OWN TRAIL), else the bar's
        function morphTrailOf(run) {
            return run && run.trail ? run.trail : { kind: state.morphTrail, len: state.morphTrailLen };
        }
        function morphTrailSpan(run) {
            const tr = morphTrailOf(run),
                L = tr.len != null ? +tr.len : 0.5;
            return 0.04 + 0.36 * Math.max(0, Math.min(1, L));
        }
        function morphLoops(run) {
            if (run.clip) // A MORPH THAT PLAYS ONCE does not come round
                return false;
            const P = morphPathOf(run);
            if (P)
                return P.closed || P.mode === 'back';
            return run.keys.length !== 2;
        }
        // the time `back` before t, or null where the motion does not reach back that far
        function morphTrailTime(run, t, back) {
            let u = t - back;
            if (u < 0) {
                if (!morphLoops(run))
                    return null;
                u += 1;
            }
            return u;
        }
        let _trailBuf = null;
        function morphTrailBuf(N) {
            if (!_trailBuf || _trailBuf.x.length !== N)
                _trailBuf = { x: new Float64Array(N), y: new Float64Array(N) };
            return _trailBuf;
        }
        // a pose's centre at time u, without building the pose: the path's point, or the keys'
        // centres blended (the blend is linear, and neither the lag nor an effect moves a centre)
        function morphCentreAt(run, u) {
            const c = morphCentreOwn(run, u),
                PX = morphParentXform(run, u); // ONE MORPH RIDING ANOTHER: the centre carried too
            if (!PX)
                return c;
            const [x, y] = PX.at(c.x, c.y);
            return { x, y };
        }
        function morphCentreOwn(run, u) {
            if (morphPathOf(run))
                return morphPathPlace(run, u);
            if (!run._centres || run._centres.length !== run.keys.length)
                run._centres = run.keys.map(k => run.exact ? exactCentre(k) : (() => {
                    let cx = 0,
                        cy = 0;
                    for (let i = 0; i < k.x.length; i++) {
                        cx += k.x[i];
                        cy += k.y[i];
                    }
                    return { x: cx / k.x.length, y: cy / k.x.length };
                })());
            const w = morphWeightsOf(morphRunT(run, u), run.keys.length, run); // EASING AND HOLDS
            let x = 0,
                y = 0;
            for (let k = 0; k < w.length; k++) {
                x += w[k] * run._centres[k].x;
                y += w[k] * run._centres[k].y;
            }
            return { x, y };
        }
        function drawMorphTrails(w, h) {
            if (!morphRuns.length)
                return;
            const t = morphLive.t;
            ctx.save();
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            for (const run of morphRuns) {
                const kind = morphTrailOf(run).kind;
                if (!MORPH_TRAILS.includes(kind))
                    continue;
                const span = morphTrailSpan(run);
                const sp = morphTargetOf(run);
                if (!sp)
                    continue;
                const fillCol = state.showFills && sp.fill && sp.fill.color ? sp.fill.color : null,
                    fillA = sp.fill && sp.fill.opacity != null ? sp.fill.opacity : 1,
                    lineCol = sp.stroke || (fillCol ? null : 'rgba(212,160,82,1)'),
                    lw = sp.lineWidth != null ? sp.lineWidth : state.lineWidth;
                if (kind === 'echoes') {
                    for (let k = MORPH_ECHOES; k >= 1; k--) {
                        const u = morphTrailTime(run, t, span * k / MORPH_ECHOES);
                        if (u == null)
                            continue;
                        const fu = morphShowFactor(run, u), // A CLIP SEEN ONLY WHEN IT PLAYS: an echo as seen then
                            g = morphOutlineAt(run, u), // an exact morph's echoes keep their corners
                            a = 0.6 * (1 - k / (MORPH_ECHOES + 1)) * (fu == null ? 1 : fu);
                        if (!g)
                            continue;
                        ctx.beginPath();
                        for (let i = 0; i < g.x.length; i++) {
                            const q = worldToPx(g.x[i], g.y[i], w, h);
                            if (i)
                                ctx.lineTo(q.x, q.y);
                            else
                                ctx.moveTo(q.x, q.y);
                        }
                        ctx.closePath();
                        if (fillCol) {
                            const C = run.cols ? morphColourAt(run, u) : null; // the colour it had then
                            ctx.globalAlpha = a * (C ? C.opacity : fillA);
                            ctx.fillStyle = C ? C.color : fillCol;
                            ctx.fill('evenodd');
                        }
                        if (lineCol && lw > 0) {
                            ctx.globalAlpha = a;
                            ctx.strokeStyle = lineCol;
                            ctx.lineWidth = lw;
                            ctx.stroke();
                        }
                    }
                } else {
                    // the head's width: twice the pose's mean distance from its centre, on screen
                    const O = run.exact ? exactDenseOf(run.pose || morphPoseExact(run, t)) : { x: sp.leafX, y: sp.leafY },
                        X = O.x,
                        Y = O.y,
                        N = X.length;
                    let cx = 0,
                        cy = 0;
                    for (let i = 0; i < N; i++) {
                        cx += X[i];
                        cy += Y[i];
                    }
                    cx /= N;
                    cy /= N;
                    let r = 0;
                    for (let i = 0; i < N; i++)
                        r += Math.hypot(X[i] - cx, Y[i] - cy);
                    r /= N;
                    const c0 = worldToPx(cx, cy, w, h),
                        c1 = worldToPx(cx + r, cy, w, h),
                        head = 2 * Math.hypot(c1.x - c0.x, c1.y - c0.y),
                        S = 48;
                    ctx.strokeStyle = fillCol || lineCol || 'rgba(212,160,82,1)';
                    let prev = null;
                    for (let k = S; k >= 0; k--) {
                        const u = morphTrailTime(run, t, span * k / S);
                        if (u == null) {
                            prev = null;
                            continue;
                        }
                        const c = morphCentreAt(run, u),
                            q = worldToPx(c.x, c.y, w, h);
                        if (prev) {
                            const f = 1 - k / S, // 0 at the tail, 1 at the head
                                fu = morphShowFactor(run, u);
                            ctx.globalAlpha = 0.5 * f * (fillCol ? fillA : 1) * (fu == null ? 1 : fu);
                            ctx.lineWidth = Math.max(0.5, head * 0.8 * f);
                            ctx.beginPath();
                            ctx.moveTo(prev.x, prev.y);
                            ctx.lineTo(q.x, q.y);
                            ctx.stroke();
                        }
                        prev = q;
                    }
                }
            }
            ctx.restore();
        }
        function morphSetTrail(kind, len) {
            if (kind != null)
                state.morphTrail = MORPH_TRAILS.includes(kind) ? kind : '';
            if (len != null)
                state.morphTrailLen = Math.max(0, Math.min(1, +len));
            morphBarSync();
            drawAll();
            scheduleSave();
            morphHistorySoon();
        }

        // what the page takes back (see the head of this file)
        return {
            morphAlignPlan, morphApplyPlan, morphAlign, MORPH_LAG_MAX, _morphTrig, morphTrigTable, morphSlowFT,
            morphFwd, morphInv, morphSpectra, morphFreqScale, morphLagTime, morphBlendSpectral, MORPH_STEPS,
            morphLadder, morphRuns, _morphReady, morphLive, morphRunning, morphWeights, morphBarSync, morphTargetOf,
            morphTarget, morphPoseInto, morphWriteRun, morphNoteWritten, _morphAbsorbing, morphAbsorbEdits,
            morphUndoCarry, morphTakeEdit, morphWrite, morphClockStop, morphAbandon, _morphStaleGuard,
            morphCheckStale, morphPoseClone, morphKeep, morphExit, morphStop, morphTick, morphStopsPlayed,
            morphCameraFollow, morphViewOfBox, morphViewBox, morphStopGo, morphLiveStart, MORPH_FX, fxHash, fxSmooth,
            morphApplyFx, morphSetFx, MORPH_EASES, MORPH_BACK, morphBezierEase, morphBezierOk, morphEase,
            morphKeyTimes, morphTimesOk, morphEasesOk, morphStretchOf, morphWarp, morphWeightsOf, morphWarpOf,
            MORPH_KEY_GAP, morphKeyTimeClamp, morphSetKeyTime, morphSetStepEase, morphEvenTimes, morphSetTiming,
            exactKeyOf, exactKeyCopy, exactTangentLen, exactSplitOne, exactDenseOf, exactCentre, exactArea,
            exactReverse, exactRoll, exactMove, exactBakeRounds, morphExactKeys, morphExactCurved, exactTangents,
            exactIsSmooth, morphExactSmooth, morphPoseExact, morphHolesSave, morphHolesLoad, morphAffineOf,
            morphHolesAt, morphWriteExact, morphExactCubics, exactPathD, morphKeyholeCubics, cubicsToPathD,
            morphOutlineAt, drawShapeDrawingOn, MORPH_PATH_M, morphPathFrom, morphPathBuild, morphPathS, morphPathAt,
            morphPathOf, morphPathPlace, morphPlace, MORPH_MOTIONS, MORPH_MOTION_PIVOTS, MORPH_MOTION_ALONG,
            morphMotionOk, morphMotionSize, morphShapeBox, spCopyXform, morphRand, morphVaryMotion, morphEmitMap,
            morphEmitExpand, morphEmitRuns, morphMotionOntoBox, morphMotionOnto, morphOntoLink, morphOntoRefresh,
            morphMotionSet, morphFallAt, morphMotionXform, morphGravity, morphWind, morphMotionMap, morphClipP,
            morphClipOk, MORPH_SHOWS, MORPH_FADE, MORPH_DRAW_FILL, MORPH_IN, MORPH_OUT, morphClipEdge, morphClipNorm,
            morphClipIO, MORPH_CLIP_PRESETS, morphClipPresetOf, morphClipOut, morphShowFactor, morphDrawFactor,
            morphDrawFill, morphCameraOk, morphCameraAt, morphStopsOk, morphStopCrossed, morphBeatsOk,
            morphBeatSpans, morphStopBefore, morphRunT, _lin, _srgb, morphColOf, morphColsOf, morphColourAt,
            morphApplyPath, morphBareCentre, MORPH_FOLLOW, MORPH_SPRING_N, morphParentXform, morphMotionSig,
            morphSpringXform, morphLookTurn, morphSetLook, morphParentXformTight, morphParentRigid, morphFollowsLoop,
            morphSetParent, morphSetPath, morphPathRelease, morphRunPathsRelease, morphRunPathSet, morphPathOptions,
            drawMorphPath, drawMorphPathOne, MORPH_TRAILS, MORPH_ECHOES, morphTrailOf, morphTrailSpan, morphLoops,
            morphTrailTime, _trailBuf, morphTrailBuf, morphCentreAt, morphCentreOwn, drawMorphTrails, morphSetTrail
        };
};
