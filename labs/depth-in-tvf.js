// DEPTH IN TVF (?lab=dtv, ?lab=dwn, ?lab=wls, ?lab=dts, ?lab=dtl), moved out of draw.html line for line (28 Oct
// 2026, Tom: "all the labs can ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, DEPTH, DEPTH_HI, DEPTH_L, DEPTH_LO, DTS_TAU, DTV_W, WLS_K, depthCurve,
// depthEnterFlatWalls, depthFrameOf, depthFrom, depthFromTVF, depthReadFrom, depthReadShape, depthSaveSurface,
// depthToTVF, downloadTextFile, drawAll, flashStatus, labLadder, pushHistory, rebuildSignalSelect, safeFileName,
// scheduleSave, selectedIndices, state, subpathFromLoop. It declares nothing the editor reads. Loaded the first time
// one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['depth-in-tvf'] = function () {
        // DPT's standpoint rule, on any curve (depthReadShape does it for a primitive).
        function depthStandpoint(C) {
            const {M, x, y, curv, at} = C,
                SIN10 = Math.sin(10 * Math.PI / 180);
            let i0 = -1,
                best = Infinity;
            for (let i = 0; i < M; i++) {
                const a = at(i - 1),
                    b = at(i + 1),
                    tx = x[b] - x[a],
                    ty = y[b] - y[a],
                    tl = Math.hypot(tx, ty),
                    r = Math.hypot(x[i], y[i]);
                if (!(tl > 0) || r === 0)
                    continue;
                if (Math.abs((tx * x[i] + ty * y[i]) / (tl * r)) > SIN10)
                    continue;
                if (!(curv[i] >= 0.2))
                    continue;
                const d = Math.abs(r - 1);
                if (d < best) {
                    best = d;
                    i0 = i;
                }
            }
            return i0;
        }

        function runDepthTVF() {
            const D = DEPTH,
                NP = 600,
                rows = [];
            const grid = [];
            for (let i = 0; i < NP; i++)
                grid.push(DEPTH_LO * Math.pow(DEPTH_HI / DEPTH_LO, i / (NP - 1)));
            for (const spec of PRIMITIVES) {
                if (typeof spec.pts !== 'function')
                    continue;
                let pts;
                try {
                    pts = spec.pts();
                } catch (e) {
                    continue;
                }
                if (!pts || pts.length < 3 || !isFinite(pts[0].x))
                    continue;
                const rd = depthReadShape(spec);
                const row = {
                    key: spec.key,
                    pts
                };
                if (rd.why) {
                    row.why = rd.why;
                    rows.push(row);
                    continue;
                }
                const dp = depthFrom(rd.C, rd.standpoint, NP);
                if (dp.why) {
                    row.why = dp.why;
                    rows.push(row);
                    continue;
                }
                // rebuild the same surface to write it (depthFrom keeps its own internal)
                const surf = D.Surface(rd.p, DTV_W);
                D.enterRange(surf, DEPTH_LO, DEPTH_HI, DEPTH_L);
                const text = depthToTVF(surf, depthFrameOf(rd.C, rd.standpoint), spec.key),
                    back = depthFromTVF(text).surf;
                const pv = dp.pv,
                    size = dp.size || 1;
                const safeMiss = (sf, L) => {
                    const o = [];
                    for (let m = 0; m <= L; m++) {
                        let w = 0; // DPT's scoring: level m only where it was entered
                        for (let i = 0; i < grid.length; i++) {
                            if (m > 0) {
                                const [ks] = D.addr(grid[i], m);
                                if (ks.length !== m || !sf.has(ks))
                                    continue;
                            }
                            const e = Math.abs(sf.value(grid[i], m) - pv[i]);
                            w = Math.max(w, isFinite(e) ? e : Infinity);
                        }
                        o.push(w / size);
                    }
                    return o;
                };
                const before = safeMiss(surf, DEPTH_L),
                    after = safeMiss(back, DEPTH_L);
                let fileChange = 0;
                for (const s of grid) {
                    const e = Math.abs(back.value(s) - surf.value(s));
                    fileChange = Math.max(fileChange, isFinite(e) ? e : Infinity);
                }
                const nvals = surf.docs.size * DTV_W;
                // Breadth alone: one sweep of nvals leaves. Its leaves run from near home to near the
                // mathematical horizon, far past the stretch of readings the reader can define (p is
                // undefined there); those leaves are given no departure (p = 1, the unit circle).
                const pB = s => {
                    const v = rd.p(s);
                    return isFinite(v) ? v : 1;
                };
                const Wb = 2 ** Math.floor(Math.log2(nvals)); // the leaf generator needs a power of two
                const flat = D.Surface(pB, Wb);
                flat.enter([]);
                let bw = 0;
                for (let i = 0; i < grid.length; i++) {
                    const e = Math.abs(flat.value(grid[i], 0) - pv[i]);
                    bw = Math.max(bw, isFinite(e) ? e : Infinity);
                }
                const breadth = bw / size;
                Object.assign(row, {
                    Wb,
                    docs: surf.docs.size,
                    nvals,
                    bytes: text.length,
                    fileChange: fileChange / size,
                    before,
                    after,
                    breadth,
                    depth: after[DEPTH_L]
                });
                rows.push(row);
            }
            return {
                rows
            };
        }

        function showDepthTVF(res) {
            const R = res.rows,
                sc = R.filter(r => !r.why),
                f = v => v === 0 ? '0' : v.toExponential(1);
            const out = labLadder({
                rows: R,
                name: 'depth in TVF',
                suffix: 'W=16 · levels 0–' + DEPTH_L + ' · against breadth alone at the same count',
                verdict: r => r.why ? 1 : (r.fileChange > 1e-6 ? 0 : (r.depth < r.breadth ? 2 : 1)),
                caption: r => r.key + '\n' + (r.why ? r.why
                : r.docs + ' sweeps · ' + r.nvals + ' values · ' + (r.bytes / 1024).toFixed(1) + ' kB\n'
                + 'file ' + f(r.fileChange) + ' · depth ' + f(r.depth) + '\n' + 'breadth alone (' + r.Wb + ') ' + f(r.breadth)),
                after: drawn => {
                    for (const r of drawn)
                        if (r.why && state.subpaths[r._idx])
                            state.subpaths[r._idx].stroke = '#5b6470';
                },
            });
            if (!out)
                return;
            const wins = sc.filter(r => r.depth < r.breadth).length,
                worstFile = Math.max(...sc.map(r => r.fileChange));
            const docs = sc.map(r => r.docs);
            flashStatus('depth in TVF · ' + sc.length + ' shapes read · the file changes the reading by at most ' + f(worstFile) + ' of the departure'
            + ' · depth holds better than breadth alone at the same count on ' + wins + ' of ' + sc.length
            + ' · sweeps per file ' + Math.min(...docs) + '–' + Math.max(...docs) + (out.ms ? ' · ' + out.ms + ' ms' : ''));
            window.__dtv = res;
        }

        // The lab: every library shape written three ways (every octave; DWN at τ = 1e-6; flat
        // walls at τ = 1e-6), scored over the WHOLE range off the walls (a fine geometric grid of
        // cell midpoints, the reading to level 3 wherever it reaches), at the walls 2^k
        // themselves, and as the share of the range the reading reaches level 3 on.
        function runDepthWalls(K, withBreadth) {
            const t0 = performance.now(),
                D = DEPTH,
                NP = 2000,
                rows = [];
            const grid = [];
            for (let i = 0; i < NP; i++)
                grid.push(DEPTH_LO * Math.pow(DEPTH_HI / DEPTH_LO, (i + 0.5) / NP));
            const walls = [];
            for (let k = D.split(DEPTH_LO)[0]; k < D.split(DEPTH_HI)[0]; k++)
                walls.push(2 ** k);
            for (const spec of PRIMITIVES) {
                if (typeof spec.pts !== 'function')
                    continue;
                const rd = depthReadShape(spec);
                if (rd.why || !(rd.sMax > DEPTH_HI * 2))
                    continue;
                const pv = grid.map(rd.p);
                if (pv.some(v => !isFinite(v)))
                    continue;
                const size = Math.max(...pv.map(v => Math.abs(v - 1))) || 1;
                const measure = surf => {
                    let all = 0, reach = 0, wall = 0;
                    for (let i = 0; i < NP; i++) {
                        all = Math.max(all, Math.abs(surf.value(grid[i], DEPTH_L) - pv[i]));
                        const [ks] = D.addr(grid[i], DEPTH_L);
                        if (ks.length === DEPTH_L && surf.has(ks))
                            reach++;
                    }
                    const byWall = walls.map(w => Math.abs(surf.value(w, DEPTH_L) - rd.p(w)) / size);
                    for (const v of byWall)
                        wall = Math.max(wall, v * size);
                    const lv = [0, 0, 0, 0];
                    for (const k of surf.docs.keys())
                        lv[k === '' ? 0 : k.split('.').length]++;
                    const oct = {}, bad = [0, 0];
                    for (let i = 0; i < NP; i++) {
                        const e = Math.abs(surf.value(grid[i], DEPTH_L) - pv[i]) / size, k = D.split(grid[i])[0];
                        oct[k] = Math.max(oct[k] || 0, e);
                        if (e > 1e-5) bad[0]++;
                        if (e > 1e-3) bad[1]++;
                    }
                    return { docs: surf.docs.size, all: all / size, wall: wall / size, reach: reach / NP, byWall, lv, oct, bad: bad.map(b => b / NP) };
                };
                const full = D.Surface(rd.p, DTV_W);
                D.enterRange(full, DEPTH_LO, DEPTH_HI, DEPTH_L);
                const dwn = D.Surface(rd.p, DTV_W);
                depthEnterWhereNeeded(dwn, rd.p, DEPTH_LO, DEPTH_HI, DEPTH_L, DTS_TAU * size);
                const flat = D.Surface(rd.p, DTV_W);
                depthEnterFlatWalls(flat, rd.p, DEPTH_LO, DEPTH_HI, DEPTH_L, DTS_TAU * size, K || WLS_K);
                const row = { key: spec.key, full: measure(full), dwn: measure(dwn), flat: measure(flat) };
                // Breadth alone at the flat file's count (the nearest lower power of two, which the leaf
                // generator needs), as DTV spends it: one sweep, p = 1 where the reader cannot read. Scored
                // on every fifth point, with the flat file scored on the same points; `at` is where breadth
                // misses most. Optional (runDepthWalls(0, true)), as it doubles the run: over the library
                // depth still wins 24 of 24 scored this way, 4× to 4,900×, and breadth's worst is at an end
                // of the range every time, mostly beside the reader, where the outline's finest detail
                // fills whole octaves of the reading and one sweep's even turn cannot zoom.
                if (withBreadth) {
                    const pB = s => { const v = rd.p(s); return isFinite(v) ? v : 1; },
                        Wb = 2 ** Math.floor(Math.log2(flat.docs.size * DTV_W)),
                        one = D.Surface(pB, Wb);
                    one.enter([]);
                    let bw = 0, dw = 0, at = 0;
                    for (let i = 0; i < NP; i += 5) {
                        const e = Math.abs(one.value(grid[i], 0) - pv[i]);
                        if (e > bw) { bw = e; at = grid[i]; }
                        dw = Math.max(dw, Math.abs(flat.value(grid[i], DEPTH_L) - pv[i]));
                    }
                    row.breadth = { W: Wb, miss: bw / size, depth: dw / size, at };
                }
                rows.push(row);
            }
            return { rows, ms: Math.round(performance.now() - t0) };
        }

        window.runDepthWalls = runDepthWalls;

        function showDepthWalls(res) {
            const R = res.rows,
                f = v => v.toExponential(1),
                pc = v => (100 * v).toFixed(1) + '%',
                med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
            if (!R.length)
                return flashStatus('walls: no shape could be read');
            const part = (w, name) => {
                const X = R.map(r => r[w]),
                    inner = X.map(x => Math.max(...x.byWall.slice(3)));
                return name + ': ' + Math.min(...X.map(x => x.docs)) + '–' + Math.max(...X.map(x => x.docs)) + ' sweeps (median ' + med(X.map(x => x.docs)) + ')'
                + ', reaches level 3 on ' + pc(med(X.map(x => x.reach))) + ' of the range'
                + ', misses by more than 1e-5 on ' + pc(med(X.map(x => x.bad[0])))
                + ', worst ' + f(Math.max(...X.map(x => x.all)))
                + ', at the inner walls ' + f(med(inner)) + ' (median)';
            };
            flashStatus('walls · ' + R.length + ' shapes, scored over the whole range off the walls · ' + part('full', 'every octave') + ' · '
            + part('dwn', 'where needed, τ 1e-6') + ' · ' + part('flat', 'flat walls, τ 1e-6, children ±' + WLS_K)
            + ' · the walls themselves still stop at level 1 (no deeper address reaches them) · ' + res.ms + ' ms');
        }

        // Every library shape written both ways and scored the same way: the reading at level 3
        // against the shape, on cell midpoints so no sample sits exactly on a wall between octaves
        // (the walls are still open, §2.8), at every address where the FULL writer reaches level 3.
        // That is the region the full file claims to hold; the economical one must hold it too, so
        // its own entering decides nothing about where it is scored. (Scoring each writer only where
        // it reached level 3 itself would flatter the one that enters less.)
        const DWN_TAUS = [1e-3, 1e-4, 1e-5, 1e-6];

        function runDepthWhereNeeded() {
            const t0 = performance.now(),
                D = DEPTH,
                NP = 600,
                rows = [];
            const grid = [];
            for (let i = 0; i < NP; i++)
                grid.push(DEPTH_LO * Math.pow(DEPTH_HI / DEPTH_LO, (i + 0.5) / NP));
            for (const spec of PRIMITIVES) {
                if (typeof spec.pts !== 'function')
                    continue;
                const rd = depthReadShape(spec);
                if (rd.why || !(rd.sMax > DEPTH_HI * 2))
                    continue;
                const pv = grid.map(rd.p);
                if (pv.some(v => !isFinite(v)))
                    continue;
                const size = Math.max(...pv.map(v => Math.abs(v - 1))) || 1,
                    frame = depthFrameOf(rd.C, rd.standpoint);
                let held = null; // the grid indices the full file reaches level 3 at
                const score = surf => {
                    let w = 0;
                    for (const i of held)
                        w = Math.max(w, Math.abs(surf.value(grid[i], DEPTH_L) - pv[i]));
                    return w / size;
                };
                const measure = surf => ({
                    docs: surf.docs.size,
                    bytes: depthToTVF(surf, frame, spec.key).length,
                    miss: score(surf)
                });
                const full = D.Surface(rd.p, DTV_W);
                D.enterRange(full, DEPTH_LO, DEPTH_HI, DEPTH_L);
                held = [];
                for (let i = 0; i < NP; i++) {
                    const [ks] = D.addr(grid[i], DEPTH_L);
                    if (ks.length === DEPTH_L && full.has(ks))
                        held.push(i);
                }
                const row = {
                    key: spec.key,
                    held: held.length / NP,
                    full: measure(full),
                    at: []
                };
                for (const tau of DWN_TAUS) {
                    const s = D.Surface(rd.p, DTV_W);
                    depthEnterWhereNeeded(s, rd.p, DEPTH_LO, DEPTH_HI, DEPTH_L, tau * size);
                    row.at.push(Object.assign({
                        tau
                    }, measure(s)));
                }
                rows.push(row);
            }
            return {
                rows,
                ms: Math.round(performance.now() - t0)
            };
        }

        window.runDepthWhereNeeded = runDepthWhereNeeded;

        function showDepthWhereNeeded(res) {
            const R = res.rows,
                f = v => v.toExponential(1),
                med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
            if (!R.length)
                return flashStatus('depth where needed: no shape could be read');
            const full = R.map(r => r.full);
            const parts = DWN_TAUS.map((tau, j) => {
                const at = R.map(r => r.at[j]);
                return 'τ ' + f(tau) + ': ' + Math.min(...at.map(a => a.docs)) + '–' + Math.max(...at.map(a => a.docs)) + ' sweeps (median ' + med(at.map(a => a.docs))
                + ', ' + (med(at.map(a => a.bytes)) / 1024).toFixed(0) + ' kB), worst miss ' + f(Math.max(...at.map(a => a.miss)));
            });
            flashStatus('depth where needed · ' + R.length + ' shapes · the full file: ' + full[0].docs + ' sweeps, ' + (med(full.map(a => a.bytes)) / 1024).toFixed(0)
            + ' kB, miss ' + f(Math.min(...full.map(a => a.miss))) + '–' + f(Math.max(...full.map(a => a.miss)))
            + ' · entering an octave only where its residual exceeds τ of the departure: ' + parts.join(' · ')
            + ' · scored where the full file reaches level 3 · ' + res.ms + ' ms');
        }

        // Save: the selected shape (or the first on the page), read from DPT's standpoint.
        function saveDepthTVF() {
            const idx = (typeof selectedIndices === 'function' ? selectedIndices() : []);
            let sp = null,
                i = -1;
            for (const j of idx)
                if (state.subpaths[j] && state.subpaths[j].leafX) {
                    sp = state.subpaths[j];
                    i = j;
                    break;
                }
            if (!sp)
                for (let j = 0; j < state.subpaths.length; j++)
                    if (state.subpaths[j] && state.subpaths[j].leafX) {
                        sp = state.subpaths[j];
                        i = j;
                        break;
                    }
            if (!sp) {
                flashStatus('save depth .tvf: nothing on the page');
                return;
            }
            const C = depthCurve(sp.leafX, sp.leafY),
                i0 = depthStandpoint(C);
            if (i0 < 0) {
                flashStatus('save depth .tvf: no standpoint on this shape (DPT\'s rule: on its unit circle, square to the radius, bending inward)');
                return;
            }
            const rd = depthReadFrom(C, i0);
            if (rd.why) {
                flashStatus('save depth .tvf: ' + rd.why);
                return;
            }
            const {surf, tau} = depthSaveSurface(rd);
            const name = sp.gname || state.svgName || ('shape ' + (i + 1));
            const text = depthToTVF(surf, depthFrameOf(C, i0), name);
            downloadTextFile(text, safeFileName(name, 'depth.tvf'));
            flashStatus('saved depth .tvf · ' + surf.docs.size + ' sweeps of ' + DTV_W + ' values · ' + (text.length / 1024).toFixed(1) + ' kB'
            + (tau ? ' · octaves entered only where the residual exceeds ' + tau.toExponential(0) + ' of the departure, flat at every wall' : ' · every octave entered (the departure\'s size could not be read)'));
            return text;
        }

        // Load: draw what the reader holds as a line over the page (the learned facing), at every level.
        function loadDepthTVFText(text) {
            const {surf, frame, name} = depthFromTVF(text);
            if (!frame)
                throw new Error('no #meta reader: frame, cannot place the reading');
            const cols = ['#6f8cff', '#4fd0d0', '#9ad65f', '#e8b04f'],
                hR = 1;
            for (let L = 0; L <= DEPTH_L; L++) {
                const pts = depthLearnedFacing(surf, frame, L).filter(p => isFinite(p.x) && isFinite(p.y));
                if (pts.length < 3)
                    continue;
                const line = pts.concat(pts.slice(1, -1).reverse());
                const sp = subpathFromLoop(line, 512);
                if (!sp)
                    continue;
                sp.stroke = cols[L];
                sp.lineWidth = L === DEPTH_L ? 1.6 : 1;
                sp.gname = 'depth ' + (name || '') + ' · level ' + L;
                state.subpaths.push(sp);
            }
            rebuildSignalSelect();
            drawAll();
            pushHistory();
            scheduleSave();
            flashStatus('loaded depth .tvf · ' + surf.docs.size + ' sweeps · the reader\'s facing drawn at levels 0–' + DEPTH_L + ' (blue 0 … gold ' + DEPTH_L + ')');
        }

        {
            const bDtv = $('bDepthTVF');
            if (bDtv)
                bDtv.addEventListener('click', () => {
                    bDtv.disabled = true;
                    bDtv.textContent = 'writing and reading…';
                    setTimeout(() => {
                        try {
                            showDepthTVF(runDepthTVF());
                        }
                        catch (e) {
                            flashStatus('depth in TVF failed: ' + e.message);
                        }
                        finally {
                            bDtv.disabled = false;
                            bDtv.textContent = 'depth in TVF';
                        }
                    }, 0);
                });
        }

        {
            const bDwn = $('bDepthWhereNeeded');
            if (bDwn)
                bDwn.addEventListener('click', () => {
                    bDwn.disabled = true;
                    bDwn.textContent = 'writing…';
                    setTimeout(() => {
                        try {
                            const res = runDepthWhereNeeded();
                            window.__dwn = res;
                            showDepthWhereNeeded(res);
                        }
                        catch (e) {
                            flashStatus('depth where needed failed: ' + e.message);
                        }
                        finally {
                            bDwn.disabled = false;
                            bDwn.textContent = 'where needed';
                        }
                    }, 0);
                });
        }

        {
            const bWls = $('bDepthWalls');
            if (bWls)
                bWls.addEventListener('click', () => {
                    bWls.disabled = true;
                    bWls.textContent = 'writing…';
                    setTimeout(() => {
                        try {
                            const res = runDepthWalls();
                            window.__wls = res;
                            showDepthWalls(res);
                        }
                        catch (e) {
                            flashStatus('walls failed: ' + e.message);
                        }
                        finally {
                            bWls.disabled = false;
                            bWls.textContent = 'walls';
                        }
                    }, 0);
                });
        }

        {
            const bSdt = $('bSaveDepthTVF');
            if (bSdt)
                bSdt.addEventListener('click', () => {
                    try {
                        saveDepthTVF();
                    } catch (e) {
                        flashStatus('save depth .tvf failed: ' + e.message);
                    }
                });
        }

        {
            const bLdt = $('bLoadDepthTVF'),
                fLdt = $('fLoadDepthTVF');
            if (bLdt && fLdt) {
                bLdt.addEventListener('click', () => fLdt.click());
                fLdt.addEventListener('change', () => {
                    const f = fLdt.files && fLdt.files[0];
                    if (!f)
                        return;
                    f.text().then(t => {
                        try {
                            loadDepthTVFText(t);
                        } catch (e) {
                            flashStatus('load depth .tvf failed: ' + e.message);
                        }
                    });
                    fLdt.value = '';
                });
            }
        }
};
