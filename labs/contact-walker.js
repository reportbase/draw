// THE CONTACT WALKER (?lab=wlk, ?lab=wrs, ?lab=wsv, ?lab=wco, ?lab=wmz, ?lab=wrd, ?lab=wsp, ?lab=wjr), moved out of
// draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be pulled from draw.html. its already to
// big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, H_STEP, _crsCircle, _crsWall, _walk, applyShapeSelection, baseRuleRead, drawAll,
// enterEditMode, flashStatus, pick, pushHistory, rebuildScroller, rebuildSignalSelect, shapeContour, state,
// subpathFromLoop. It puts walkerCourse, walkerCourseCheck, walkerImportJourney, walkerMaze, walkerMazeCheck,
// walkerRecall, walkerRelease, walkerReset, walkerRound, walkerSpiral, walkerStep, walkerSurvey back on the console
// hook window.__lab once loaded. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['contact-walker'] = function () {
        function _mulberry32(a) {
            return function() {
                a |= 0;
                a = (a + 0x6D2B79F5) | 0;
                let t = Math.imul(a ^ (a >>> 15), 1 | a);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }

        function _walkRefused(nx, ny) {
            const P = _walk.polys;
            for (let i = 0; i < P.length; i++) {
                const p = P[i];
                if (nx < p.minx || nx > p.maxx || ny < p.miny || ny > p.maxy)
                    continue;
                // even-odd ray cast against the frozen contour polygon
                const xs = p.xs,
                    ys = p.ys,
                    n = xs.length;
                let inside = false;
                for (let a = 0, b = n - 1; a < n; b = a++) {
                    if ((ys[a] > ny) !== (ys[b] > ny) &&
                    nx < (xs[b] - xs[a]) * (ny - ys[a]) / (ys[b] - ys[a]) + xs[a])
                        inside = !inside;
                }
                if (inside)
                    return true;
            }
            return false;
        }

        function _walkWrapPi(d) {
            while (d > Math.PI)
                d -= 2 * Math.PI;
            while (d < -Math.PI)
                d += 2 * Math.PI;
            return d;
        }

        function _walkGauss() {
            let u = _walk.rng();
            if (u < 1e-12)
                u = 1e-12;
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * _walk.rng());
        }

        // The world's answer, then the report: the bit lies at rate ε, both ways.
        // Returns {t: the truth, r: the report} — the walker acts on r, the world on t.
        function _walkAnswer(nx, ny) {
            const t = _walkRefused(nx, ny);
            const r = (_walk.eps > 0 && _walk.rng() < _walk.eps) ? !t : t;
            return {
                t,
                r
            };
        }

        // One granted (as reported) chord: the believed frame always advances, with
        // the odometer's η jitter; the true position advances only if the world
        // actually granted — a false grant is a step believed and not taken.
        function _walkAdvance(cdx, cdy, trulyGranted) {
            if (trulyGranted) {
                _walk.x += cdx;
                _walk.y += cdy;
            }
            const e = _walk.eta * _walk.s;
            _walk.bx += cdx + (e ? e * _walkGauss() : 0);
            _walk.by += cdy + (e ? e * _walkGauss() : 0);
            // PROOF, NOT POETRY: during the unwind the swept bearing about the
            // certified core is METERED, not assumed. The arrival check alone would
            // make "π closes the exit" circular; the meter makes it a measurement —
            // the walker may loop the core on its way out, so the swept angle is any
            // odd multiple of π, and which one is a fact about this journey.
            const mz = _walk.maze;
            if (mz && mz.ret && !mz.done) {
                const r = mz.ret;
                const b = Math.atan2(_walk.by - r.tag.y, _walk.bx - r.tag.x);
                if (r.lastB !== undefined)
                    r.psi += _walkWrapPi(b - r.lastB);
                else
                    r.psi = 0;
                r.lastB = b;
            }
            // THE MASON'S METER (the spiral): the TRUE sweep about the goal, kept by
            // the describer, not the walker — because in a spiral the sweep is not
            // luck but construction: the corridor's homotopy class forces 2πN of
            // winding on anyone who reaches the centre, however they wander. The
            // walker never sees this number; the world enforces it.
            if (mz && mz.spiral && !mz.done) {
                const bT = Math.atan2(_walk.y - mz.ty, _walk.x - mz.tx);
                if (mz.lastTB !== undefined)
                    mz.trueSweep += _walkWrapPi(bT - mz.lastTB);
                mz.lastTB = bT;
            }
            _walk.trail.push(_walk.bx, _walk.by);
            if (_walk.trail.length > 2600)
                _walk.trail.splice(0, 200);
            // THE GROUND METER: the futility audit, run before any pruner is built.
            // Believed ground is gridded at ~a corridor-third; a granted move onto a
            // cell first walked more than a thousand looks ago is OLD GROUND — a look
            // spent re-walking a sentence that already telescoped. The meter changes
            // nothing; it prices what a null-tag pruner could at best recover. The
            // Ledger's rule, learned from the compass: meter first, instrument after.
            if (_walk.ground) {
                _walk.moves++;
                const gk = Math.round(_walk.bx / 0.35) * 65536 + Math.round(_walk.by / 0.35);
                const fv = _walk.ground.get(gk);
                if (fv === undefined) {
                    _walk.ground.set(gk, _walk.looks);
                    _walk.onOld = false;
                }
                else if (_walk.looks - fv > 1000) {
                    _walk.oldLooks++;
                    _walk.onOld = true;
                }
                else
                    _walk.onOld = false;
            }
        }

        // Clause 4, the surround form: the touch bearings fit in no half-plane —
        // order-free, so no wrap can break it, and the one-spot forgery still fails.
        function _walkSurround(bearings) {
            if (bearings.length < 4)
                return false;
            const a = bearings.map(t => ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((p, q) => p - q);
            let gap = a[0] + 2 * Math.PI - a[a.length - 1];
            for (let i = 1; i < a.length; i++)
                gap = Math.max(gap, a[i] - a[i - 1]);
            return gap < Math.PI;
        }

        function walkerRelease(seed) {
            const shapes = state.subpaths.filter(sp => sp.leafX && sp.leafX.length >= 3);
            if (!shapes.length) {
                flashStatus('the walker needs a world — add a shape first');
                return false;
            }
            _walk.seed = (seed != null) ? seed : ((Math.random() * 1e9) | 0);
            _walk.rng = _mulberry32(_walk.seed);
            // Freeze the world: one polygon per shape, sampled once from the bridge.
            let mnx = Infinity,
                mny = Infinity,
                mxx = -Infinity,
                mxy = -Infinity;
            _walk.polys = shapes.map(sp => {
                const N = sp.leafX.length;
                const M = 1 << Math.ceil(Math.log2(Math.max(256, 2 * N)));
                const cc = shapeContour(sp, M);
                const xs = Float64Array.from(cc.curveX),
                    ys = Float64Array.from(cc.curveY);
                let a = Infinity,
                    b = Infinity,
                    c = -Infinity,
                    d = -Infinity;
                for (let i = 0; i < xs.length; i++) {
                    if (xs[i] < a)
                        a = xs[i];
                    if (xs[i] > c)
                        c = xs[i];
                    if (ys[i] < b)
                        b = ys[i];
                    if (ys[i] > d)
                        d = ys[i];
                }
                mnx = Math.min(mnx, a);
                mny = Math.min(mny, b);
                mxx = Math.max(mxx, c);
                mxy = Math.max(mxy, d);
                return {
                    xs,
                    ys,
                    minx: a,
                    miny: b,
                    maxx: c,
                    maxy: d,
                    cx: (a + c) / 2,
                    cy: (b + d) / 2,
                    r: Math.max(c - a, d - b) / 2
                };
            });
            const diag = Math.hypot(mxx - mnx, mxy - mny) || 2;
            const mar = 0.35 * diag; // room enough that a survey circle around ALL tags fits the box
            _walk.box = {
                minx: mnx - mar,
                miny: mny - mar,
                maxx: mxx + mar,
                maxy: mxy + mar
            };
            _walk.s0 = _walk.s = Math.max(0.004, Math.min(0.08, diag / 300));
            _walk.rung = 0;
            _walk.probe = 2 * Math.PI / 48;
            _walk.closTol = 5 * _walk.s;
            _walk.maxHug = 4000;
            // The guard band: half the minimum obstacle spacing, [6] R6's confusion bound.
            let minSp = Infinity;
            for (let i = 0; i < _walk.polys.length; i++)
                for (let j = i + 1; j < _walk.polys.length; j++) {
                    const pi = _walk.polys[i],
                        pj = _walk.polys[j];
                    minSp = Math.min(minSp, Math.hypot(pi.cx - pj.cx, pi.cy - pj.cy));
                }
            _walk.guard = Math.max(6 * _walk.s, (minSp === Infinity ? 0.3 * diag : minSp / 2) * 0.9);
            // Drop the walker on free ground near a box corner.
            let px = _walk.box.minx + 0.05 * diag,
                py = _walk.box.miny + 0.05 * diag,
                tries = 0;
            while (_walkRefused(px, py) && tries++ < 500) {
                px = _walk.box.minx + _walk.rng() * (_walk.box.maxx - _walk.box.minx);
                py = _walk.box.miny + _walk.rng() * (_walk.box.maxy - _walk.box.miny);
            }
            _walk.x = _walk.startX = px;
            _walk.y = _walk.startY = py;
            _walk.bx = px;
            _walk.by = py;
            // A release re-anchors the odometer's frame at the new start, so every
            // held record from an earlier walk is in a stale frame: forget them.
            _walk.trail.length = 0;
            _walk.touchPts.length = 0;
            _walk.tags.length = 0;
            _walk.survey = null;
            _walk.surveyQueue.length = 0;
            _walk.surveyResults.length = 0;
            _walk.maze = null;
            _walk.looks = 0;
            _walk.touches = 0;
            _walk.laps = 0;
            _walk.fails = 0;
            _walk.consecFails = 0;
            _walk.ground = new Map();
            _walk.oldLooks = 0;
            _walk.moves = 0;
            _walk.scent = new Map();
            if (_walk.scentW === undefined)
                _walk.scentW = 0;
            const _se = $('selWalkerEta'),
                _sf = $('selWalkerEps');
            _walk.eta = _se ? (parseFloat(_se.value) || 0) : 0;
            _walk.eps = _sf ? (parseFloat(_sf.value) || 0) : 0;
            _walk.th = _walk.rng() * 2 * Math.PI;
            _walk.mode = 'fly';
            _walk.hug = null;
            _walk.cooldown = 0;
            _walk.active = true;
            const b = $('bWalker');
            if (b)
                b.textContent = 'recall the walker';
            if (!_walk.raf)
                _walk.raf = requestAnimationFrame(_walkTick);
            return true;
        }

        function walkerRecall() {
            _walk.active = false;
            if (_walk.raf) {
                cancelAnimationFrame(_walk.raf);
                _walk.raf = 0;
            }
            const b = $('bWalker');
            if (b)
                b.textContent = 'release the walker';
            drawAll();
        }

        function walkerReset() {
            _walk.trail.length = 0;
            _walk.touchPts.length = 0;
            _walk.tags.length = 0;
            _walk.looks = 0;
            _walk.touches = 0;
            _walk.laps = 0;
            _walk.fails = 0;
            _walk.consecFails = 0;
            _walk.rung = 0;
            _walk.s = _walk.s0;
            _walk.closTol = 5 * _walk.s;
            _walk.mode = 'fly';
            _walk.hug = null;
            _walk.survey = null;
            _walk.surveyQueue.length = 0;
            _walk.surveyResults.length = 0;
            _walk.course = null;
            _walk.maze = null;
            drawAll();
        }

        function _walkFailHug(reason) {
            _walk.fails++;
            // The rung climbs itself: fail twice, refine — smaller step, tighter curl.
            // But only failures that SMELL of fine features count: trapped in a notch,
            // a surround that never rounded, a turn that would not close. A hug that
            // merely ran too LONG failed because the body is big, not because it is
            // fine — a maze's border tree can never be lapped at any curl, and letting
            // it climb the ladder would shrink the stride for nothing.
            if (reason === 'trapped' || reason === 'surround' || reason === 'noclose')
                _walk.consecFails++;
            if (_walk.consecFails >= 2 && _walk.rung < 3) {
                _walk.rung++;
                _walk.s *= 0.6;
                _walk.closTol = 5 * _walk.s;
                _walk.maxHug = Math.round(4000 * (_walk.s0 / _walk.s));
                _walk.consecFails = 0;
            }
            _walk.th += Math.PI * (0.75 + _walk.rng() * 0.5);
            _walk.cooldown = Math.ceil(0.8 * _walk.guard / _walk.s);
            _walk.mode = 'fly';
            _walk.hug = null;
        }

        function _walkCertify(clos) {
            const hg = _walk.hug;
            const tx = hg.sumx / hg.ntp,
                ty = hg.sumy / hg.ntp;
            const wsign = hg.turn > 0 ? 1 : -1;
            // The lap's SPREAD — mean touch distance from the lap-mean — is the obstacle's
            // apparent radius in the odometer's frame; the course uses it to tell the
            // target's lap from a wall's, since a C-wall's lap-mean also sits near centre.
            let spread = 0;
            for (let i = 0; i < hg.tpx.length; i++)
                spread += Math.hypot(hg.tpx[i] - tx, hg.tpy[i] - ty);
            spread /= Math.max(1, hg.tpx.length);
            // Identity is the pair (lap-mean, spread) WITH the winding's sign: a room
            // walked from inside (w −1) and the island standing in it (w +1) share a
            // centre, and only the apparent radius and the orientation tell them apart.
            // Merging on position alone fused them into one nonsense tag in the maze.
            let tag = null;
            for (const t of _walk.tags) {
                if (Math.hypot(t.x - tx, t.y - ty) >= _walk.guard)
                    continue;
                if (t.w !== wsign)
                    continue;
                const ts = (t.cert && t.cert.spread) || spread;
                if (Math.abs(ts - spread) > 0.5 * Math.max(ts, spread, 0.2))
                    continue;
                tag = t;
                break;
            }
            if (!tag) {
                tag = {
                    x: tx,
                    y: ty,
                    n: 0,
                    w: wsign
                };
                _walk.tags.push(tag);
            }
            else {
                tag.x = (tag.x * tag.n + tx) / (tag.n + 1);
                tag.y = (tag.y * tag.n + ty) / (tag.n + 1);
            }
            tag.n++;
            tag.w = wsign;
            tag.cert = {
                turn: wsign,
                closure: clos,
                touches: hg.touches,
                surround: true,
                rung: _walk.rung,
                spread,
                road: hg.road && hg.road.n > 8 ? hg.road.q / hg.road.n : null
            };
            if (hg.roadSeries)
                tag.roadSeries = hg.roadSeries;
            // Keep the lap itself — the certified circuit, decimated — so a journey can
            // be imported into the editor as a CONTOUR and read by every instrument.
            // Single circuits only: 2π closes a shape — a doubly-wound lap certifies
            // the same body but is not the canonical journey.
            if (hg.pathX.length >= 16 && Math.round(Math.abs(hg.turn) / (2 * Math.PI)) === 1) {
                const stride = Math.max(1, Math.ceil(hg.pathX.length / 512));
                const jx = [],
                    jy = [];
                for (let i = 0; i < hg.pathX.length; i += stride) {
                    jx.push(hg.pathX[i]);
                    jy.push(hg.pathY[i]);
                }
                tag.lapPath = {
                    x: jx,
                    y: jy
                };
            }
            _walk.laps++;
            _walk.consecFails = 0;
            _walk.th = Math.atan2(_walk.by - ty, _walk.bx - tx) + (_walk.rng() - 0.5) * 0.6;
            // Leave-time grows as the patch depletes ([7]'s foraging reference, run in
            // reverse): the first lap of a body earns a short backoff, the six-hundredth
            // earns a long one. Without this the walker is [7] §3's greedy visitor —
            // in a maze's plaza it certified one island 647 times while the far cell
            // went unvisited. The repulsion belongs to the PATCH, not to contact: while
            // the cooldown runs, only refusals near the just-certified body bounce;
            // any other body met on the way is hugged as ever.
            // …denominated in the PATCH'S OWN SIZE: leaving a body means travelling
            // its radius, and in wall-dense worlds the guard band collapses to its
            // floor while a room's spread stays honest about how far away "away" is.
            _walk.cooldown = Math.ceil((1.5 + 0.6 * Math.min(tag.n, 24)) * Math.max(_walk.guard, spread) / _walk.s);
            _walk.mode = 'fly';
            _walk.hug = null;
        }

        // ── The homology handoff ([6] §6, R5) ───────────────────────────────────────
        // The surveyor manufactures bearings from held values — arg(tag − odometer) —
        // which composes two carried scalars into a third: the corpus's one
        // DELIBERATE P2 break, performed here at the exact operation and nowhere
        // else in this instrument. The manufactured bearing streams feed one-bit
        // rings ([5]'s bottom rung) along an egocentric closed journey: a fixed turn
        // per step, the walker's own frame, and the ring totals at the journey's end
        // are the windings — the homology class, from refusals to residues end to
        // end. A journey a refusal interrupts is aborted honestly and retried from
        // elsewhere; three aborts retire it with a dash.
        function walkerSurvey() {
            if (!_walk.tags.length) {
                flashStatus('the surveyor needs tags — let the walker certify a lap first');
                return false;
            }
            _walk.surveyResults = [];
            _walk.surveyQueue = _walk.tags.map((t, i) => ({
                kind: 'tag',
                i,
                attempts: 0
            }));
            if (_walk.tags.length > 1)
                _walk.surveyQueue.push({
                    kind: 'all',
                    attempts: 0
                });
            return true;
        }

        function _walkTrySurvey() {
            const wk = _walk;
            const job = wk.surveyQueue[0];
            let cx,
                cy,
                rMin;
            if (job.kind === 'tag') {
                const t = wk.tags[job.i];
                if (!t) {
                    wk.surveyQueue.shift();
                    return false;
                }
                cx = t.x;
                cy = t.y;
                rMin = 0.6 * wk.guard;
                let dOther = Infinity;
                for (const o of wk.tags)
                    if (o !== t)
                        dOther = Math.min(dOther, Math.hypot(o.x - t.x, o.y - t.y));
                job.rMax = Math.min(dOther - 0.4 * wk.guard,
                cx - wk.box.minx, wk.box.maxx - cx, cy - wk.box.miny, wk.box.maxy - cy) - 2 * wk.s;
            } else {
                cx = 0;
                cy = 0;
                for (const t of wk.tags) {
                    cx += t.x;
                    cy += t.y;
                }
                cx /= wk.tags.length;
                cy /= wk.tags.length;
                let spread = 0;
                for (const t of wk.tags)
                    spread = Math.max(spread, Math.hypot(t.x - cx, t.y - cy));
                rMin = spread + 0.5 * wk.guard;
                job.rMax = Math.min(cx - wk.box.minx, wk.box.maxx - cx, cy - wk.box.miny, wk.box.maxy - cy) - 2 * wk.s;
            }
            if (job.rMax <= rMin) {
                // no admissible orbit exists in this box: retire the journey
                wk.surveyResults.push({
                    kind: job.kind,
                    i: job.i,
                    w: null
                });
                wk.surveyQueue.shift();
                return false;
            }
            const r = Math.hypot(wk.bx - cx, wk.by - cy);
            if (r < rMin || r > job.rMax)
                return false; // keep flying; the geometry will come round
            const K = Math.max(64, Math.round(2 * Math.PI * r / wk.s));
            wk.survey = {
                job,
                cx,
                cy,
                K,
                i: 0,
                r,
                startBx: wk.bx,
                startBy: wk.by,
                // one held bearing register per tag, seeded where the journey starts
                hA: wk.tags.map(t => Math.atan2(t.y - wk.by, t.x - wk.bx)),
                cells: wk.tags.map(() => 0),
                path: [wk.bx, wk.by],
            };
            wk.th = Math.atan2(wk.by - cy, wk.bx - cx) + Math.PI / 2; // tangent, counter-clockwise
            wk.mode = 'survey';
            return true;
        }

        function _walkAbortSurvey() {
            const wk = _walk,
                job = wk.survey.job;
            job.attempts++;
            wk.surveyQueue.shift();
            if (job.attempts >= 3)
                wk.surveyResults.push({
                    kind: job.kind,
                    i: job.i,
                    w: null
                });
            else
                wk.surveyQueue.push(job);
            wk.survey = null;
            wk.th += Math.PI * (0.7 + wk.rng() * 0.6);
            wk.cooldown = Math.ceil(0.5 * wk.guard / wk.s);
            wk.mode = 'fly';
        }

        // One look: propose, receive the bit, act. The proposal is answered from the
        // TRUE position (the world's); every record — touches, closure, tags, the
        // trail — is kept in the BELIEVED frame (the odometer's). At η = ε = 0 the
        // two frames coincide and this is the noise-free walker unchanged.
        function _walkLook() {
            const wk = _walk;
            wk.looks++;
            if (wk.mode === 'survey') {
                const sv = wk.survey;
                const cdx = wk.s * Math.cos(wk.th),
                    cdy = wk.s * Math.sin(wk.th);
                const nx = wk.x + cdx,
                    ny = wk.y + cdy;
                if (nx < wk.box.minx || nx > wk.box.maxx || ny < wk.box.miny || ny > wk.box.maxy) {
                    _walkAbortSurvey();
                    return;
                }
                const ans = _walkAnswer(nx, ny);
                if (ans.r) {
                    _walkAbortSurvey();
                    return;
                } // a refusal en route: the journey is off
                _walkAdvance(cdx, cdy, !ans.t);
                if ((sv.i & 3) === 0)
                    sv.path.push(wk.bx, wk.by);
                // the surveyor's read, one ring per tag: incoming bearing against the held
                for (let j = 0; j < wk.tags.length; j++) {
                    const b = Math.atan2(wk.tags[j].y - wk.by, wk.tags[j].x - wk.bx); // arg(tag − odometer): the break
                    const step = Math.round(_walkWrapPi(b - sv.hA[j]) / Math.PI); // C = 2: the cell is a half-turn
                    sv.cells[j] += step;
                    sv.hA[j] += step * Math.PI;
                }
                sv.i++;
                wk.th += 2 * Math.PI / sv.K; // the egocentric turn: fixed increment, own frame
                if (sv.i >= sv.K) {
                    const clos = Math.hypot(wk.bx - sv.startBx, wk.by - sv.startBy);
                    wk.surveyResults.push({
                        kind: sv.job.kind,
                        i: sv.job.i,
                        r: sv.r,
                        closure: clos,
                        w: sv.cells.map(c => c / 2),
                        // one-bit ring: two cells per circumference
                        path: sv.path,
                    });
                    wk.surveyQueue.shift();
                    wk.survey = null;
                    wk.mode = 'fly';
                }
                return;
            }
            if (wk.mode === 'fly') {
                if (wk.surveyQueue.length && wk.cooldown <= 0 && _walkTrySurvey())
                    return;
                // Straighter legs in a maze (corridors reward ballistic persistence);
                // the open-field wobble everywhere else — it is what finds gaps in walls.
                // (THE FRONTIER SCHEDULE was tried here — wobble spent only on fresh
                // ground, ballistic commitment on old — and MEASURED: spiral ×3.8 worse,
                // round-33 ×5.3 worse, square-5 worse. The diagnosis: the wobble is not
                // waste, it is the MIXING — near-zero noise on old ground locks the
                // flight into quasi-periodic bounces between the same walls, and the
                // ergodicity that guarantees eventual coverage dies. Second struck
                // instrument at this site, after the corner compass. The ground meter's
                // prize is real, but it will not be collected by a noise schedule; it
                // wants genuine state. The measurement is the reason this is a comment.)
                wk.th += (wk.rng() - 0.5) * (wk.maze ? 0.015 : 0.03);
                // (A steered "corner compass" was tried here — tangential bias about the
                // touch centroid, global ledger, breathing epochs, committed handedness —
                // and MEASURED against the suite: a wash overall, 2× worse on two seeds.
                // The walker's own law already contains the corner; see the hug's road
                // meter below. The measurement is the reason this block is a comment.)
                // The UNWIND is different: once 2π has closed the shape, the exit is a
                // NAMED believed point — the antipode of home about the certified core —
                // and steering toward a destination is not the same act as sweeping
                // corridors blind. A gentle pull toward the named exit; walls still
                // interrupt it, hugs still ride them, the wobble still finds the gaps.
                if (wk.maze && wk.maze.ret && !wk.maze.done && wk.cooldown <= 0) {
                    const tgt = Math.atan2(wk.maze.ret.ey - wk.by, wk.maze.ret.ex - wk.bx);
                    const dTh = _walkWrapPi(tgt - wk.th);
                    wk.th += Math.max(-0.012, Math.min(0.012, 0.08 * dTh));
                }
                const cdx = wk.s * Math.cos(wk.th),
                    cdy = wk.s * Math.sin(wk.th);
                const nx = wk.x + cdx,
                    ny = wk.y + cdy;
                if (nx < wk.box.minx || nx > wk.box.maxx) {
                    wk.th = Math.PI - wk.th + (wk.rng() - 0.5) * 0.3;
                    return;
                }
                if (ny < wk.box.miny || ny > wk.box.maxy) {
                    wk.th = -wk.th + (wk.rng() - 0.5) * 0.3;
                    return;
                }
                const ans = _walkAnswer(nx, ny);
                // THE WORLD AS MEMORY — the bee's tarsal footprint, which is Trémaux's
                // chalk with a decay: if the world can be MARKED, a recently-trodden cell
                // answers a second bit and the walker turns away. Note what this changes:
                // not the observer (no register, no policy, no held state) but the WORLD
                // MODEL, which since [6] has been write-only-by-refusal. The mark is held
                // in the world's frame, so unlike a believed map it does not drift.
                // Fly mode only — the hug must stay free to re-walk a wall, or no lap can
                // close. Off unless scentW > 0.
                if ((wk.scentW > 0 || wk.scentN > 0) && !ans.r) {
                    const sk = Math.round(nx / 0.35) * 65536 + Math.round(ny / 0.35);
                    const here = Math.round(wk.x / 0.35) * 65536 + Math.round(wk.y / 0.35);
                    if (sk !== here) {
                        // a cell cannot repel its own occupant
                        const seen = wk.scent.get(sk);
                        // TRÉMAUX'S COUNT (scentN) permits the backtrack the repellent forbids:
                        // a cell is walled only on its Nth entry, so a dead end can be left once.
                        const blocked = wk.scentN > 0
                        ? (seen || 0) >= wk.scentN
                        : (seen !== undefined && wk.looks - seen < wk.scentW);
                        if (blocked) {
                            wk.th += Math.PI / 2 + (wk.rng() - 0.5) * 1.2;
                            return;
                        }
                        wk.scent.set(sk, wk.scentN > 0 ? (seen || 0) + 1 : wk.looks);
                    }
                }
                if (ans.r) {
                    // reported refused: a touch, believed where believed stands
                    wk.touches++;
                    wk.touchPts.push(wk.bx + cdx / 2, wk.by + cdy / 2);
                    if (wk.touchPts.length > 1000)
                        wk.touchPts.splice(0, 100);
                    if (wk.cooldown > 0) {
                        wk.th += Math.PI + (wk.rng() - 0.5) * 1.0;
                        return;
                    } // backing off: bounce, don't hug
                    wk.mode = 'hug';
                    wk.hug = {
                        turn: 0,
                        lastGrantTh: null,
                        touches: 0,
                        bearings: [],
                        sumx: 0,
                        sumy: 0,
                        ntp: 0,
                        tpx: [],
                        tpy: [],
                        pathX: [],
                        pathY: [],
                        road: {
                            h: 0,
                            on: false,
                            q: 0,
                            n: 0
                        },
                        roadSeries: wk.roadTrace ? [] : null,
                        firstX: wk.bx,
                        firstY: wk.by,
                        steps: 0
                    };
                    return;
                }
                if (wk.cooldown > 0)
                    wk.cooldown--;
                _walkAdvance(cdx, cdy, !ans.t);
                return;
            }
            // hug: lean into the wall (left), rotate away (right) while refused — every
            // refused heading is a touch, and its bearing joins the surround evidence.
            const hg = wk.hug;
            wk.th += wk.probe;
            let tries = 0;
            let cdx = wk.s * Math.cos(wk.th),
                cdy = wk.s * Math.sin(wk.th);
            let ans = _walkAnswer(wk.x + cdx, wk.y + cdy);
            while (ans.r && tries < 64) {
                wk.looks++;
                wk.touches++;
                hg.touches++;
                hg.bearings.push(wk.th);
                const tx = wk.bx + cdx / 2,
                    ty = wk.by + cdy / 2;
                hg.sumx += tx;
                hg.sumy += ty;
                hg.ntp++;
                hg.tpx.push(tx);
                hg.tpy.push(ty);
                wk.touchPts.push(tx, ty);
                if (wk.touchPts.length > 1000)
                    wk.touchPts.splice(0, 100);
                wk.th -= wk.probe;
                tries++;
                cdx = wk.s * Math.cos(wk.th);
                cdy = wk.s * Math.sin(wk.th);
                ans = _walkAnswer(wk.x + cdx, wk.y + cdy);
            }
            if (tries >= 64) {
                _walkFailHug('trapped');
                return;
            }
            const nx = wk.x + cdx,
                ny = wk.y + cdy;
            if (nx < wk.box.minx || nx > wk.box.maxx || ny < wk.box.miny || ny > wk.box.maxy) {
                _walkFailHug('box');
                return;
            }
            if (hg.lastGrantTh != null)
                hg.turn += _walkWrapPi(wk.th - hg.lastGrantTh);
            hg.lastGrantTh = wk.th;
            _walkAdvance(cdx, cdy, !ans.t);
            if (hg.pathX.length < 8192) {
                hg.pathX.push(wk.bx);
                hg.pathY.push(wk.by);
            }
            // THE ROAD METER: the corner is how you find your way — it connects home
            // and exit — and the walker's own law already says so. Hugging IS the
            // corner held: each granted step, the believed distance to the lap's
            // touch-mass is metered through an h-register with the editor's own step,
            // and the wall-follower's whole gait is the free symbol, look after look.
            // (A steered compass was tried and measured worse; see the fly mode. The
            // corner does not need to be imposed on the walk — it is the walk.) The
            // fraction is recorded on the certificate: the road, priced on-line, by
            // the walker, while walking — against the door's re-reading at the end.
            // Deeper or shallower is read off THIS register — the recursion's test,
            // not the walker's choice: loud means still descending, silent means the
            // base case is underfoot and the only move left is to return.
            if (hg.ntp) {
                const rr = Math.hypot(wk.bx - hg.sumx / hg.ntp, wk.by - hg.sumy / hg.ntp);
                if (hg.roadSeries && hg.roadSeries.length < 20000)
                    hg.roadSeries.push(rr);
                if (rr > 1e-9) {
                    const rd = hg.road;
                    if (!rd.on) {
                        rd.h = Math.log(rr);
                        rd.on = true;
                    }
                    else {
                        const mm = Math.round((Math.log(rr) - rd.h) / H_STEP);
                        if (mm === 0)
                            rd.q++;
                        else
                            rd.h += mm * H_STEP;
                        rd.n++;
                    }
                }
            }
            hg.steps++;
            if (hg.steps > wk.maxHug) {
                _walkFailHug('long');
                return;
            }
            // MUTATION HARNESS (wk.mut): the clauses can be individually disabled, so
            // that each one's necessity is measured rather than argued. [6] §3 forged
            // the JOURNEY against a fixed instrument; this breaks the INSTRUMENT against
            // a fixed world. A clause whose removal changes no outcome is doing no
            // independent work — which is a fact about the certificate, not the world.
            const M = wk.mut || {};
            if ((M.noContact || hg.touches >= 4) &&
            (M.noTurn || Math.abs(hg.turn) >= 2 * Math.PI - wk.probe / 2)) {
                const clos = Math.hypot(wk.bx - hg.firstX, wk.by - hg.firstY); // closure is the ODOMETER's
                if (M.noClosure || clos <= wk.closTol) {
                    if (M.noSurround || _walkSurround(hg.bearings))
                        _walkCertify(clos);
                    else
                        _walkFailHug('surround'); // the one-spot forgery dies here
                } else if (Math.abs(hg.turn) > 4.5 * Math.PI) {
                    _walkFailHug('noclose'); // period-two orbits land here, honestly
                }
            }
        }

        function walkerStep(n) {
            for (let i = 0; i < n; i++)
                _walkLook();
        }

        function _walkTick() {
            _walk.raf = 0;
            if (!_walk.active)
                return;
            const sel = $('selWalkerPace');
            const pace = sel ? sel.value : 'brisk';
            if (pace === 'watch') {
                for (let n = 0; n < 60; n++)
                    _walkLook();
            } else if (pace === 'brisk') {
                for (let n = 0; n < 700; n++)
                    _walkLook();
            } else {
                const t0 = performance.now();
                let n = 0;
                while (performance.now() - t0 < 8 && n < 4000) {
                    _walkLook();
                    n++;
                }
            }
            walkerCourseCheck(); // may recall the walker (course done) or re-release (next level)
            walkerMazeCheck(); // may recall the walker (maze solved or budget spent)
            drawAll();
            if (_walk.active && !_walk.raf)
                _walk.raf = requestAnimationFrame(_walkTick);
        }

        function _courseBuild(lv) {
            state.subpaths = lv.build().map(L => {
                const sp = subpathFromLoop(L.pts, L.N || 256);
                if (sp)
                    sp.fill = {
                        color: '#15151b',
                        opacity: 1
                    };
                return sp;
            }).filter(Boolean);
            state.activeSet = null;
            state.selected.clear();
            if (typeof rebuildSignalSelect === 'function')
                rebuildSignalSelect();
            if (typeof rebuildScroller === 'function')
                rebuildScroller();
            state.view.zoom = 1.15 / lv.ext;
            state.view.panX = 0;
            state.view.panY = 0;
            pushHistory();
        }

        function walkerCourse() {
            _walk.course = {
                idx: -1,
                results: [],
                done: null
            };
            _courseAdvance();
            return true;
        }

        function _courseAdvance() {
            const c = _walk.course;
            c.idx++;
            if (c.idx >= COURSE.length) {
                const walked = c.results.filter(r => r.ok).length;
                const refused = c.results.filter(r => !r.ok).map(r => r.name);
                c.done = walked + ' of ' + COURSE.length + ' walked' + (refused.length ? ' · refused: ' + refused.join(', ') : '');
                walkerRecall();
                flashStatus('the course is done — ' + c.done);
                return;
            }
            _courseBuild(COURSE[c.idx]);
            walkerRelease(1000 + c.idx); // deterministic seed per level
            _walk.course = c; // release cleared nothing of the course itself
        }

        // Called once per frame batch (and by tests after driving looks by hand):
        // certify-the-target or budget-out both end the level.
        function walkerCourseCheck() {
            const c = _walk.course;
            if (!c || c.idx < 0 || c.idx >= COURSE.length || c.done)
                return false;
            const lv = COURSE[c.idx];
            const cap = lv.spreadMax || 1.1;
            const hit = _walk.tags.find(t => Math.hypot(t.x, t.y) < 0.45 && t.cert && t.cert.spread < cap);
            if (hit) {
                c.results.push({
                    name: lv.name,
                    ok: true,
                    looks: _walk.looks,
                    rung: _walk.rung,
                    fails: _walk.fails
                });
                _courseAdvance();
                return true;
            }
            if (_walk.looks >= lv.budget) {
                c.results.push({
                    name: lv.name,
                    ok: false,
                    looks: _walk.looks,
                    rung: _walk.rung,
                    fails: _walk.fails
                });
                _courseAdvance();
                return true;
            }
            return false;
        }

        // ── The maze ────────────────────────────────────────────────────────────────
        // Corridors are the framework's assumptions at their hardest: walls TOUCH
        // (the hug follows the union boundary, [6]'s open frontier), the route is
        // the cost (no Buffon shortcut through a wall), and a wall tree that
        // includes the border can never be lapped at any curl — only the maze's
        // ISLANDS certify. So the walker's tag list, at the end, is the maze's
        // homology: b₁ read by contact, one lap per island, while the border tree
        // contributes touches and never a certificate. The target is a disk in the
        // far cell; solving is certifying it, and the price is printed in looks.
        let _mazeSeed = 1;

        function _mazeGen(n, seed) {
            const rng = _mulberry32(seed);
            const c = 1.0,
                t = 0.12;
            const X = i => (i - n / 2) * c,
                Y = j => (j - n / 2) * c;
            // carve a perfect maze — recursive backtracker
            const vis = Array.from({
                length: n
            }, () => new Array(n).fill(false));
            const wH = Array.from({
                length: n + 1
            }, () => new Array(n).fill(true)); // wH[j][i]: wall between (i,j-1) and (i,j)
            const wV = Array.from({
                length: n
            }, () => new Array(n + 1).fill(true)); // wV[j][i]: wall between (i-1,j) and (i,j)
            const stack = [[0, 0]];
            vis[0][0] = true;
            while (stack.length) {
                const [ci, cj] = stack[stack.length - 1];
                const opts = [];
                if (ci + 1 < n && !vis[cj][ci + 1])
                    opts.push([ci + 1, cj, 'V', ci + 1, cj]);
                if (ci - 1 >= 0 && !vis[cj][ci - 1])
                    opts.push([ci - 1, cj, 'V', ci, cj]);
                if (cj + 1 < n && !vis[cj + 1][ci])
                    opts.push([ci, cj + 1, 'H', ci, cj + 1]);
                if (cj - 1 >= 0 && !vis[cj - 1][ci])
                    opts.push([ci, cj - 1, 'H', ci, cj]);
                if (!opts.length) {
                    stack.pop();
                    continue;
                }
                const [ni, nj, kind, wi, wj] = opts[(rng() * opts.length) | 0];
                if (kind === 'V')
                    wV[wj][wi] = false;
                else
                    wH[wj][wi] = false;
                vis[nj][ni] = true;
                stack.push([ni, nj]);
            }
            // open extra passages — loops, so the corridor graph is no longer a tree
            for (let k = 0; k < Math.max(2, n >> 1); k++) {
                if (rng() < 0.5) {
                    const i = 1 + ((rng() * (n - 1)) | 0),
                        j = (rng() * n) | 0;
                    wV[j][i] = false;
                }
                else {
                    const j = 1 + ((rng() * (n - 1)) | 0),
                        i = (rng() * n) | 0;
                    wH[j][i] = false;
                }
            }
            // the plaza: a 2×2 open chamber at the centre, with a solid island block
            const p0 = (n >> 1) - 1;
            for (const pj of [p0, p0 + 1])
                wV[pj][p0 + 1] = false;
            for (const pi of [p0, p0 + 1])
                wH[p0 + 1][pi] = false;
            // prune every wall component not connected to the border: a stray thin
            // stub would be an unlappable "island" and would muddy the b₁ read —
            // the maze's one honest island is the block, which a hug can round.
            const VID = (i, j) => i + (n + 1) * j;
            const par = new Array((n + 1) * (n + 1)).fill(0).map((_, i) => i);
            const find = a => {
                while (par[a] !== a) {
                    par[a] = par[par[a]];
                    a = par[a];
                }
                return a;
            };
            const uni = (a, b) => {
                par[find(a)] = find(b);
            };
            for (let i = 0; i <= n; i++) {
                uni(VID(i, 0), VID(0, 0));
                uni(VID(i, n), VID(0, 0));
                uni(VID(0, i), VID(0, 0));
                uni(VID(n, i), VID(0, 0));
            }
            for (let j = 0; j <= n; j++)
                for (let i = 0; i < n; i++)
                    if (wH[j][i])
                        uni(VID(i, j), VID(i + 1, j));
            for (let j = 0; j < n; j++)
                for (let i = 0; i <= n; i++)
                    if (wV[j][i])
                        uni(VID(i, j), VID(i, j + 1));
            const broot = find(VID(0, 0));
            for (let j = 1; j < n; j++)
                for (let i = 0; i < n; i++)
                    if (wH[j][i] && find(VID(i, j)) !== broot)
                        wH[j][i] = false;
            for (let j = 0; j < n; j++)
                for (let i = 1; i < n; i++)
                    if (wV[j][i] && find(VID(i, j)) !== broot)
                        wV[j][i] = false;
            // build the shapes: border slabs, wall segments (overlapped at joints so
            // the union is solid), the island block, and the target disk
            const rect = (x0, y0, x1, y1) => [{
                x: x0,
                y: y0
            }, {
                x: x1,
                y: y0
            }, {
                x: x1,
                y: y1
            }, {
                x: x0,
                y: y1
            }];
            const H = n / 2,
                out = [];
            out.push({
                pts: rect(-H - t, H, H + t, H + t),
                N: 128
            });
            out.push({
                pts: rect(-H - t, -H - t, H + t, -H),
                N: 128
            });
            out.push({
                pts: rect(-H - t, -H, -H - t + t, H),
                N: 128
            });
            out.push({
                pts: rect(H, -H, H + t, H),
                N: 128
            });
            for (let j = 1; j < n; j++)
                for (let i = 0; i < n; i++)
                    if (wH[j][i])
                        out.push({
                            pts: rect(X(i) - t / 2, Y(j) - t / 2, X(i + 1) + t / 2, Y(j) + t / 2),
                            N: 96
                        });
            for (let j = 0; j < n; j++)
                for (let i = 1; i < n; i++)
                    if (wV[j][i])
                        out.push({
                            pts: rect(X(i) - t / 2, Y(j) - t / 2, X(i) + t / 2, Y(j + 1) + t / 2),
                            N: 96
                        });
            const bx = X(p0 + 1),
                by = Y(p0 + 1); // plaza centre (grid vertex)
            out.push({
                pts: rect(bx - 0.28, by - 0.28, bx + 0.28, by + 0.28),
                N: 96
            }); // the island
            const tx = X(n - 1) + c / 2,
                ty = Y(n - 1) + c / 2; // far cell centre
            const tgt = [];
            for (let i = 0; i < 48; i++) {
                const a = 2 * Math.PI * i / 48;
                tgt.push({
                    x: tx + 0.24 * Math.cos(a),
                    y: ty + 0.24 * Math.sin(a)
                });
            }
            out.push({
                pts: tgt,
                N: 128
            });
            return {
                shapes: out,
                tx,
                ty,
                sx: X(0) + c / 2,
                sy: Y(0) + c / 2,
                island: {
                    x: bx,
                    y: by
                }
            };
        }

        function walkerMaze(n, seed) {
            const N = n || 6;
            const sd = (seed != null) ? seed : _mazeSeed++;
            const mz = _mazeGen(N, sd);
            state.subpaths = mz.shapes.map(L => {
                const sp = subpathFromLoop(L.pts, L.N || 96);
                if (sp)
                    sp.fill = {
                        color: '#15151b',
                        opacity: 1
                    };
                return sp;
            }).filter(Boolean);
            state.activeSet = null;
            state.selected.clear();
            if (typeof rebuildSignalSelect === 'function')
                rebuildSignalSelect();
            if (typeof rebuildScroller === 'function')
                rebuildScroller();
            state.view.zoom = 1.15 / (N / 2 + 0.6);
            state.view.panX = 0;
            state.view.panY = 0;
            pushHistory();
            walkerRelease(sd);
            // the walker starts in the first cell — placed by the describer, as every
            // course fixture is; the odometer's anchor moves with it
            _walk.x = _walk.startX = _walk.bx = mz.sx;
            _walk.y = _walk.startY = _walk.by = mz.sy;
            _walk.maze = {
                n: N,
                tx: mz.tx,
                ty: mz.ty,
                island: mz.island,
                budget: 3000000,
                done: null
            };
            return true;
        }

        // ── THE EXIT IS THE CORNER ──────────────────────────────────────────────────
        // The last identification. The round maze removed the exit as a PLACE (start
        // and finish identified — the goal became a class); this removes it as an
        // EVENT. The certified lap is handed to the reader of The Observation Atom — the same
        // base rule that prices every contour in the editor — and the DOOR is a cell of
        // that reader's alphabet: the free symbol, the corner of the ladder, where the
        // register is silent and the circle lives. The walker leaves the labyrinth
        // when its journey's sentence sits at the corner: closure holds (defect ~ 0)
        // and the radial stream is mostly the unchanged symbol. Not "you are at the
        // exit" — "your journey now reads as the cheapest closed sentence". The way
        // out of the maze is to have walked a circle, as priced by the meter.
        // This door is also the PIVOT of the journey's recursion: the same silence
        // that opens it is the base case that flips descent into return.
        function _walkLapAtCorner(tag) {
            if (!tag || !tag.lapPath || tag.lapPath.x.length < 16)
                return null;
            const pts = tag.lapPath.x.map((x, i) => ({
                x,
                y: tag.lapPath.y[i]
            }));
            const sp = subpathFromLoop(pts, 256);
            if (!sp)
                return null;
            state.subpaths.push(sp);
            let out = null;
            try {
                const hr = baseRuleRead(state.subpaths.length - 1);
                if (hr)
                    out = {
                        quiet: hr.quiet / hr.n,
                        defect: hr.defect,
                        closed: Math.abs(hr.defect) <= 2
                    };
            } finally {
                state.subpaths.pop();
            }
            if (out)
                out.atCorner = out.closed && out.quiet >= 0.6;
            return out;
        }

        function _walkDoorText(door) {
            return 'exit: the corner — ' + Math.round(100 * door.quiet) + '% free symbol, defect '
            + (Number.isInteger(door.defect) ? door.defect : door.defect.toFixed(1));
        }

        function walkerMazeCheck() {
            const m = _walk.maze;
            if (!m || m.done)
                return false;
            if (m.round) {
                // The observer's own verdict: the world was built so its one certifiable
                // body is the core, so the first w = +1 certificate IS the solution —
                // winding 1 around the annulus's generator, no describer check anywhere.
                // ── 2π CLOSES A SHAPE, π CLOSES THE EXIT ───────────────────────────────
                // The journey has two closures and they are different numbers. The
                // complexity between home and exit is unknown — a straight corridor or
                // an endless baffle — but the corner is the single place to go DEEP into
                // it: the lap of the core, 2π, the shape closed at the bottom of the
                // maze. And only that closure creates the exit as a place at all: the
                // exit is the ANTIPODE of home about the certified body — reflect home
                // through the tag, a point the walker can name from its own ledger and
                // could not have named one look earlier. Then UNWIND: climb back out of
                // the same unknown complexity to the rim, and the exit closes at π —
                // half a turn about the core from where the journey began. Wind in,
                // certify at 2π, unwind out, close at π. The only place certified to be
                // the exit is the one the certificate itself points to.
                const hit = _walk.tags.find(t => t.w > 0 && t.cert && t.cert.spread < 1.2);
                if (hit && !m.ret) {
                    const door = _walkLapAtCorner(hit);
                    if (door && !door.atCorner) {
                        // the certificate stands, but the sentence has not reached the corner
                        // — the door is a reading, and this lap does not read as a circle yet
                        if (!m.doorNoted) {
                            m.doorNoted = true;
                            flashStatus('the lap certifies but reads ' + Math.round(100 * door.quiet)
                            + '% at the corner — the exit is the corner; walk a rounder lap');
                        }
                    } else {
                        m.ret = {
                            ex: 2 * hit.x - m.hx,
                            ey: 2 * hit.y - m.hy,
                            atLooks: _walk.looks,
                            door,
                            cert: hit.cert,
                            tag: hit,
                            psi: 0
                        };
                        m.budget += 3000000; // the unwind allowance
                        flashStatus('2π closed the shape (w +1'
                        + (hit.cert.road != null ? ', road ' + Math.round(100 * hit.cert.road) + '% at the corner' : '')
                        + ') — the exit is now a place: the antipode of home about the core; unwind');
                    }
                }
                if (m.ret) {
                    const dEx = Math.hypot(_walk.bx - m.ret.ex, _walk.by - m.ret.ey);
                    if (dEx < 0.45) {
                        const r = m.ret;
                        m.done = 'wound in ' + r.atLooks.toLocaleString() + ' looks (2π — the shape, w +1, spread '
                        + r.cert.spread.toFixed(2) + ')'
                        + ' · unwound in ' + (_walk.looks - r.atLooks).toLocaleString() + ' (π — the exit, the antipode of home)'
                        + ' · swept ' + (r.psi / Math.PI).toFixed(2) + 'π about the core on the way out — '
                        + Math.round(Math.abs(r.psi) / (2 * Math.PI)) + ' full laps cancel at the close; the class that remains is π'
                        + ' · the chord home→exit bisects the core — blocked by construction'
                        + (r.cert.road != null ? ' · road: ' + Math.round(100 * r.cert.road) + '% walked at the corner' : '')
                        + (r.door ? ' · ' + _walkDoorText(r.door) : '')
                        + ' · old ground: ' + Math.round(100 * _walk.oldLooks / Math.max(1, _walk.moves)) + '% of moves';
                        walkerRecall();
                        flashStatus('the round maze is closed — ' + m.done);
                        return true;
                    }
                }
                if (_walk.looks >= m.budget) {
                    m.done = 'unwound — the budget spent (' + _walk.looks.toLocaleString() + ' looks)';
                    walkerRecall();
                    flashStatus('the round maze went ' + m.done);
                    return true;
                }
                return false;
            }
            const hit = _walk.tags.find(t => Math.hypot(t.x - m.tx, t.y - m.ty) < 0.4 && t.cert && t.cert.spread < 0.8);
            if (hit) {
                const door = _walkLapAtCorner(hit);
                if (door && !door.atCorner) {
                    if (!m.doorNoted) {
                        m.doorNoted = true;
                        flashStatus('the target lap certifies but reads only ' + Math.round(100 * door.quiet)
                        + '% at the corner — the exit is the corner; keep hugging');
                    }
                    return false;
                }
                // The winding's sign sorts the certificates: a body orbited from OUTSIDE
                // reads +1 (an island — the maze's b₁, by contact); a boundary walked
                // from INSIDE reads −1 (a room — the walker discovering it is enclosed,
                // all four clauses honestly held). Both are true; only one is a hole.
                const isl = _walk.tags.filter(t => t !== hit && t.w > 0).length;
                const rooms = _walk.tags.filter(t => t !== hit && t.w < 0).length;
                m.done = 'solved in ' + _walk.looks.toLocaleString() + ' looks · b₁ read: '
                + isl + ' island' + (isl === 1 ? '' : 's')
                + (rooms ? ' · ' + rooms + ' room' + (rooms === 1 ? '' : 's') + ' (w −1, read from inside)' : '')
                + (hit.cert.road != null ? ' · road: ' + Math.round(100 * hit.cert.road) + '% walked at the corner' : '')
                + (door ? ' · ' + _walkDoorText(door) : '')
                + (m.spiral ? ' · the mason’s meter: ' + Math.abs(m.trueSweep / Math.PI).toFixed(2)
                + 'π swept (' + (2 * m.turns) + 'π set by the coils) · the crow’s distance: ' + m.chord.toFixed(1) : '')
                + ' · old ground: ' + Math.round(100 * _walk.oldLooks / Math.max(1, _walk.moves)) + '% of moves';
                walkerRecall();
                flashStatus('the maze is ' + m.done);
                return true;
            }
            if (_walk.looks >= m.budget) {
                m.done = 'unsolved — the budget spent (' + _walk.looks.toLocaleString() + ' looks)';
                walkerRecall();
                flashStatus('the maze went ' + m.done);
                return true;
            }
            return false;
        }

        // ── The round maze ──────────────────────────────────────────────────────────
        // Start and exit taken as opposite sides of a circle — and then IDENTIFIED:
        // the maze closes into an annulus, and the solution stops being a place and
        // becomes a class. A solid core sits at the centre with a free corridor
        // around it (the prize); three sectored ring-corridors of baffles stand
        // between the walker and that corridor; every wall component hangs from the
        // border (pruned otherwise), so the world's one certifiable body is the
        // core. Solving is therefore the walker's OWN verdict, for the first time:
        // no describer coordinates anywhere in the goal — the first w = +1
        // certificate IS the solution, a lap of the core, winding 1, the maze's
        // generator walked and certified by the four clauses. Cost stays metric
        // (looks through the baffles); proof is topological (one lap, one sign).
        function _roundGen(seed) {
            const rng = _mulberry32(seed);
            const t = 0.12,
                S = 12,
                RD = [0.55, 1.3, 2.05, 2.8, 3.55];
            const arcPoly = (R, a0, a1) => {
                const pts = [],
                    KA = 48;
                for (let i = 0; i <= KA; i++) {
                    const a = a0 + (a1 - a0) * i / KA;
                    pts.push({
                        x: (R + t / 2) * Math.cos(a),
                        y: (R + t / 2) * Math.sin(a)
                    });
                }
                for (let i = KA; i >= 0; i--) {
                    const a = a0 + (a1 - a0) * i / KA;
                    pts.push({
                        x: (R - t / 2) * Math.cos(a),
                        y: (R - t / 2) * Math.sin(a)
                    });
                }
                return pts;
            };
            const radPoly = (k, s) => {
                const a = 2 * Math.PI * s / S,
                    ca = Math.cos(a),
                    sa = Math.sin(a);
                const r0 = RD[k] - t / 2,
                    r1 = RD[k + 1] + t / 2,
                    hx = -sa * t / 2,
                    hy = ca * t / 2;
                return [{
                    x: r0 * ca - hx,
                    y: r0 * sa - hy
                }, {
                    x: r1 * ca - hx,
                    y: r1 * sa - hy
                },
                {
                    x: r1 * ca + hx,
                    y: r1 * sa + hy
                }, {
                    x: r0 * ca + hx,
                    y: r0 * sa + hy
                }];
            };
            // walls up, then the backtracker carves the corridor tree
            const arc = [null, new Array(S).fill(true), new Array(S).fill(true), new Array(S).fill(true)];
            const rad = [null, new Array(S).fill(true), new Array(S).fill(true), new Array(S).fill(true)];
            const NID = (k, s) => 1 + (k - 1) * S + s; // cell ids; 0 = the prize corridor
            const vis = new Array(1 + 3 * S).fill(false);
            const stack = [NID(3, 0)];
            vis[NID(3, 0)] = true;
            while (stack.length) {
                const c = stack[stack.length - 1];
                const opts = [];
                if (c === 0) {
                    for (let s = 0; s < S; s++)
                        if (!vis[NID(1, s)] && arc[1][s])
                            opts.push([NID(1, s), () => arc[1][s] = false]);
                }
                else {
                    const k = ((c - 1) / S) | 0,
                        s = (c - 1) % S;
                    const kk = k + 1,
                        ss = s;
                    if (kk === 1) {
                        if (!vis[0])
                            opts.push([0, () => arc[1][ss] = false]);
                    }
                    if (kk > 1 && !vis[NID(kk - 1, ss)])
                        opts.push([NID(kk - 1, ss), () => arc[kk][ss] = false]);
                    if (kk < 3 && !vis[NID(kk + 1, ss)])
                        opts.push([NID(kk + 1, ss), () => arc[kk + 1][ss] = false]);
                    const sl = (ss + S - 1) % S,
                        sr = (ss + 1) % S;
                    if (!vis[NID(kk, sl)])
                        opts.push([NID(kk, sl), () => rad[kk][ss] = false]);
                    if (!vis[NID(kk, sr)])
                        opts.push([NID(kk, sr), () => rad[kk][sr] = false]);
                }
                if (!opts.length) {
                    stack.pop();
                    continue;
                }
                const [nc, open] = opts[(rng() * opts.length) | 0];
                open();
                vis[nc] = true;
                stack.push(nc);
            }
            // a couple of extra doors, so the corridor graph loops
            for (let i = 0; i < 2; i++) {
                const k = 1 + ((rng() * 3) | 0),
                    s = (rng() * S) | 0;
                if (rng() < 0.5) {
                    if (arc[k])
                        arc[k][s] = false;
                } else
                    rad[k][s] = false;
            }
            // prune wall components not hanging from the border: vertices v(j,s) at
            // radius RD[j]; the border ring is the root — anything floating would be a
            // thin unlappable island and would muddy the world's one-body guarantee
            const VID = (j, s) => (j - 1) * S + (s % S);
            const par = new Array(4 * S).fill(0).map((_, i) => i);
            const find = a => {
                while (par[a] !== a) {
                    par[a] = par[par[a]];
                    a = par[a];
                }
                return a;
            };
            const uni = (a, b) => {
                par[find(a)] = find(b);
            };
            for (let s = 0; s < S; s++)
                uni(VID(4, s), VID(4, 0));
            for (let k = 1; k <= 3; k++)
                for (let s = 0; s < S; s++) {
                    if (arc[k][s])
                        uni(VID(k, s), VID(k, s + 1));
                    if (rad[k][s])
                        uni(VID(k, s), VID(k + 1, s));
                }
            const broot = find(VID(4, 0));
            for (let k = 1; k <= 3; k++)
                for (let s = 0; s < S; s++) {
                    if (arc[k][s] && find(VID(k, s)) !== broot)
                        arc[k][s] = false;
                    if (rad[k][s] && find(VID(k, s)) !== broot)
                        rad[k][s] = false;
                }
            // shapes: the core, the sealed border ring, and the surviving walls
            const out = [];
            out.push({
                pts: _crsCircle(0, 0, RD[0], 64),
                N: 192
            }); // the core — the world's one body
            out.push({
                pts: _crsWall(RD[4], t / 2, 0, 0.001),
                N: 720
            }); // the border, sealed
            const dExt = (t / 2) / 1.3; // overlap arcs into their radial joints
            for (let k = 1; k <= 3; k++)
                for (let s = 0; s < S; s++) {
                    if (arc[k][s])
                        out.push({
                            pts: arcPoly(RD[k], 2 * Math.PI * s / S - dExt, 2 * Math.PI * (s + 1) / S + dExt),
                            N: 128
                        });
                    if (rad[k][s])
                        out.push({
                            pts: radPoly(k, s),
                            N: 96
                        });
                }
            // start mid-sector (a sector boundary may carry a radial wall), mid-corridor
            const sa0 = Math.PI + Math.PI / S,
                sr0 = (RD[3] + RD[4]) / 2;
            return {
                shapes: out,
                sx: sr0 * Math.cos(sa0),
                sy: sr0 * Math.sin(sa0)
            };
        }

        // ── The spiral ──────────────────────────────────────────────────────────────
        // The world where the entrance and the exit are a pebble-toss apart and the
        // distance between them is set by the mason, not the map. One Archimedean
        // band coils N times from a central chamber to the rim; the target disk sits
        // in the chamber; the walker starts just outside the mouth. Every point of
        // the corridor is one pitch — about half a unit — from a point a full turn
        // of walking away, and the goal is a few units from home as the crow flies,
        // with every crow's path through solid coil. The round maze showed the sweep
        // as LUCK (7 laps on one world, 244 on another); the spiral is the counter-
        // pole: the sweep is the world's CONSTANT, 2πN by construction, and the
        // mason's meter (true frame, describer-kept) verifies that whoever reaches
        // the centre paid it exactly, plus whatever they wasted in cancelling pairs.
        function _spiralGen(N) {
            const r0 = 0.9,
                rim = 3.9,
                t = 0.16;
            const b = (rim - r0) / (2 * Math.PI * N);
            const M = 96 * N,
                pts = [];
            for (let i = 0; i <= M; i++) {
                const th = 2 * Math.PI * N * i / M,
                    r = r0 + b * th + t / 2;
                pts.push({
                    x: r * Math.cos(th),
                    y: r * Math.sin(th)
                });
            }
            for (let i = M; i >= 0; i--) {
                const th = 2 * Math.PI * N * i / M,
                    r = r0 + b * th - t / 2;
                pts.push({
                    x: r * Math.cos(th),
                    y: r * Math.sin(th)
                });
            }
            return {
                band: pts,
                rim,
                pitch: 2 * Math.PI * b
            };
        }

        function walkerSpiral(turns) {
            const N = Math.max(2, Math.min(6, turns || 3));
            const g = _spiralGen(N);
            const disk = subpathFromLoop(_crsCircle(0, 0, 0.35, 48), 128);
            const band = subpathFromLoop(g.band, 1024);
            state.subpaths = [disk, band].filter(Boolean);
            for (const sp of state.subpaths)
                sp.fill = {
                    color: '#15151b',
                    opacity: 1
                };
            state.activeSet = null;
            state.selected.clear();
            if (typeof rebuildSignalSelect === 'function')
                rebuildSignalSelect();
            if (typeof rebuildScroller === 'function')
                rebuildScroller();
            state.view.zoom = 1.15 / 4.6;
            state.view.panX = 0;
            state.view.panY = 0;
            pushHistory();
            walkerRelease(9000 + N);
            const sx = (g.rim + 0.45) * Math.cos(-0.35),
                sy = (g.rim + 0.45) * Math.sin(-0.35);
            _walk.x = _walk.startX = _walk.bx = sx;
            _walk.y = _walk.startY = _walk.by = sy;
            _walk.maze = {
                spiral: true,
                label: 'spiral',
                budget: 3000000,
                done: null,
                tx: 0,
                ty: 0,
                turns: N,
                chord: Math.hypot(sx, sy),
                trueSweep: 0
            };
            flashStatus('the spiral — the mason set the distance: ' + N + ' turns of forced winding; the crow reads ' + Math.hypot(sx, sy).toFixed(1));
            drawAll();
        }

        function walkerRound(seed) {
            const sd = (seed != null) ? seed : _mazeSeed++;
            const mz = _roundGen(sd);
            state.subpaths = mz.shapes.map(L => {
                const sp = subpathFromLoop(L.pts, L.N || 96);
                if (sp)
                    sp.fill = {
                        color: '#15151b',
                        opacity: 1
                    };
                return sp;
            }).filter(Boolean);
            state.activeSet = null;
            state.selected.clear();
            if (typeof rebuildSignalSelect === 'function')
                rebuildSignalSelect();
            if (typeof rebuildScroller === 'function')
                rebuildScroller();
            state.view.zoom = 1.15 / 3.9;
            state.view.panX = 0;
            state.view.panY = 0;
            pushHistory();
            walkerRelease(sd);
            // place at the start, scanning along the outer corridor if the exact spot
            // is walled (a generated radial can sit anywhere)
            let sa = Math.atan2(mz.sy, mz.sx),
                sr = Math.hypot(mz.sx, mz.sy),
                tries = 0;
            let px = mz.sx,
                py = mz.sy;
            while (_walkRefused(px, py) && tries++ < 48) {
                sa += 2 * Math.PI / 96;
                px = sr * Math.cos(sa);
                py = sr * Math.sin(sa);
            }
            _walk.x = _walk.startX = _walk.bx = px;
            _walk.y = _walk.startY = _walk.by = py;
            _walk.maze = {
                round: true,
                label: 'round',
                budget: 3000000,
                done: null,
                hx: px,
                hy: py
            };
            return true;
        }

        // ── The journey as a shape ──────────────────────────────────────────────────
        // The corpus's last identification: a certified lap is a CLOSED CONTOUR in
        // the odometer's frame, and the editor is a reader of closed contours — so
        // import the journey as leaves, place a mark on every tag the walk earned,
        // and the whole tower reads the route: the base rule prices its radial
        // sentence, the tangent ring counts its turning, the ray rings read its
        // class about the marks (the wound core at +1, the rooms as spectators),
        // the area reader its order. The walk becomes a shape; the shape was always
        // a walk.
        function walkerImportJourney() {
            const cand = _walk.tags.filter(t => t.lapPath);
            if (!cand.length) {
                flashStatus('no certified lap held — certify something first; the journey is the certificate’s own path');
                return false;
            }
            const pick = cand.find(t => t.w > 0) || cand[cand.length - 1];
            const pts = pick.lapPath.x.map((x, i) => ({
                x,
                y: pick.lapPath.y[i]
            }));
            const sp = subpathFromLoop(pts, 256);
            if (!sp) {
                flashStatus('the lap was too short to become a contour');
                return false;
            }
            const marks = _walk.tags.map(t => ({
                x: t.x,
                y: t.y
            }));
            walkerRecall();
            state.subpaths = [sp];
            state.marks = marks;
            state.markMode = false;
            state.activeSet = null;
            state.selected.clear();
            if (typeof rebuildSignalSelect === 'function')
                rebuildSignalSelect();
            if (typeof rebuildScroller === 'function')
                rebuildScroller();
            pushHistory();
            applyShapeSelection(new Set([0]));
            enterEditMode();
            flashStatus('the journey is a shape — ' + marks.length + ' mark' + (marks.length === 1 ? '' : 's')
            + ' placed on its tags; the head reads the route’s class');
            return true;
        }

        {
            const b = $('bWalker'),
                br = $('bWalkerReset'),
                bs = $('bWalkerSurvey');
            if (b)
                b.addEventListener('click', () => {
                    _walk.active ? walkerRecall() : walkerRelease();
                });
            if (br)
                br.addEventListener('click', walkerReset);
            if (bs)
                bs.addEventListener('click', () => {
                    if (walkerSurvey() && !_walk.active) {
                        _walk.active = true;
                        if (!_walk.raf)
                            _walk.raf = requestAnimationFrame(_walkTick);
                        const bb = $('bWalker');
                        if (bb)
                            bb.textContent = 'recall the walker';
                    }
                });
            const bc = $('bWalkerCourse');
            if (bc)
                bc.addEventListener('click', walkerCourse);
            const bm = $('bWalkerMaze');
            if (bm)
                bm.addEventListener('click', () => walkerMaze());
            const brd = $('bWalkerRound');
            if (brd)
                brd.addEventListener('click', () => walkerRound());
            const bj = $('bWalkerJourney');
            if (bj)
                bj.addEventListener('click', walkerImportJourney);
            const bsp = $('bWalkerSpiral');
            if (bsp)
                bsp.addEventListener('click', () => walkerSpiral());
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { walkerCourse, walkerCourseCheck, walkerImportJourney, walkerMaze, walkerMazeCheck, walkerRecall, walkerRelease, walkerReset, walkerRound, walkerSpiral, walkerStep, walkerSurvey });
};
