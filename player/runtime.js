// ── THE PLAYER'S OWN RUNTIME (player/runtime.js, built into tvf-player.js by tools/build-player.mjs) ──
// A .tvfs scene is what the leaf editor has on its page, written out by its "tvfs" button: the shapes in
// their drawing order, each still one as its leaves or its exact corners, and each live morph as its keys
// (leaves, or corners with their roundings and curve handles) and the editor's own record of its settings
// (morphSaveOwn: clock, path, motion, colours, clip, parent, facing), with the bar's ease, hold, gravity
// and wind and the loop's length. Nothing is sampled into frames. The player poses each morph at the
// clock's time with the editor's engine above and draws the curve itself at the screen's resolution: a
// leaf shape reconstructed from its leaves with the kernel, as many points as its size on the canvas
// asks for, so it is as smooth at any size; an exact shape drawn as the cubics of its corners, its arcs
// and its curve edges, so its corners are sharp at any size; a detail effect worked on the harmonics as
// it plays; colours blended in linear light; a clip faded as it comes and goes; trails (echoes of earlier
// poses, or a ribbon along the way the centre came) drawn under the shapes, as the editor draws them.
//
//   TVFPlayer.play(canvas, scene or url, { background, autoplay, click })
//                                      → { play(), pause(), seek(t), next(), prev(), scene, t, playing, stop }
//   A scene with stops (an explainer) waits at each: next() goes on (a click on the canvas does too, unless
//   click: false), prev() goes back a stop. Its camera, when it has one, is what the canvas frames.
//   TVFPlayer.load(scene)              the scene made ready to pose and draw
//   TVFPlayer.poses(scene, t)          each morph's pose at t: leaves { x, y } or corners { x, y, r, c }
//   TVFPlayer.draw(ctx, scene, t, w, h)
//   <canvas data-tvfs="scene.tvfs">    played when the page loads (TVFPlayer.attach() does it again)

const PLAYER_VERSION = 1,
    PLAYER_SCENE_VERSION = 1; // the .tvfs version it reads (papers/tvf.md §2.10)
const num = (v, d) => Number.isFinite(+v) ? +v : d;
const arrOf = v => typeof v === 'string' ? Float64Array.from(_b64f32(v) || []) : Float64Array.from(v || []);

function loadScene(d) {
    if (!d || d.format !== 'tvf-scene')
        throw new Error('not a tvf scene');
    // THE VERSION (papers/tvf.md §2.10): a version this player does not know is refused, not guessed at;
    // fields it does not know within version 1 are ignored
    if (d.v != null && +d.v !== PLAYER_SCENE_VERSION)
        throw new Error('a version ' + d.v + ' scene: this player reads version ' + PLAYER_SCENE_VERSION);
    const S = {
        d,
        loop: Math.max(0.1, num(d.loop, 4)),
        ease: MORPH_EASES.includes(d.ease) ? d.ease : '',
        hold: Math.max(0, Math.min(0.9, num(d.hold, 0))),
        gravity: Math.max(1, Math.min(4, num(d.gravity, 1))),
        wind: Math.max(-1, Math.min(1, num(d.wind, 0))),
        trail: d.trail && MORPH_TRAILS.includes(d.trail.kind) ? { kind: d.trail.kind, len: Math.max(0, Math.min(1, num(d.trail.len, 0.5))) } : { kind: '', len: 0.5 },
        camera: morphCameraOk(d.camera), // A CAMERA, AND STOPS
        stops: morphStopsOk(d.stops),
        beats: Array.isArray(d.beats) ? d.beats.map(b => ({ title: String((b && b.title) || ''), text: String((b && b.text) || '') })) : null, // the words beside each stretch between stops, for a page to show
        path: null,
        runs: [],
        items: [],
        frame: null
    };
    if (d.path) {
        const px = arrOf(d.path.x),
            py = arrOf(d.path.y);
        const P = px.length === py.length && px.length > 1 ? morphPathBuild(px, py, !!d.path.closed) : null;
        if (P) {
            P.turn = d.path.turn !== false;
            P.mode = d.path.mode === 'back' ? 'back' : 'along';
            P.at = num(d.path.at, 0);
            S.path = P;
        }
    }
    use(S);
    for (const m of d.morphs || []) {
        const exact = !!m.exact;
        const keys = (m.keys || []).map(k => exact ? {
            x: arrOf(k.x),
            y: arrOf(k.y),
            r: arrOf(k.r),
            c: (k.c || []).map(e => Array.isArray(e) && e.length === 4 ? e.map(Number) : null)
        } : { x: arrOf(k.x), y: arrOf(k.y) });
        const run = {
            keys,
            exact,
            open: exact && !!m.open, // DRAWING A LINE ON: a line
            holes: exact && keys.length === 1 ? morphHolesLoad(m.holes) : null, // a label's counters, carried by its pose
            curved: exact ? morphExactCurved(keys) : undefined,
            sp: { fill: m.fill || null, stroke: m.stroke || null, lineWidth: num(m.width, 0), strokeOpacity: num(m.strokeOpacity, 1) },
            inPlace: m.inPlace !== false,
            lag: exact ? 0 : Math.max(0, Math.min(MORPH_LAG_MAX, num(m.lag, 0))),
            spec: null,
            freq: null,
            fx: !exact && m.fx && MORPH_FX.includes(m.fx.kind) ? { kind: m.fx.kind, amount: Math.max(0, Math.min(1, num(m.fx.amount, 0.5))) } : null,
            members: []
        };
        if (!keys.length || keys.some(k => k.x.length !== keys[0].x.length || k.y.length !== keys[0].x.length))
            throw new Error('a morph whose keys do not agree');
        morphRestoreOwn(run, Object.assign({}, m.own || {}, { onto: null }));
        S.runs.push(run);
        morphRuns.push(run);
    }
    (d.morphs || []).forEach((m, i) => { // parents and facings, once every morph is there
        const o = m.own || {},
            run = S.runs[i];
        if (o.parent >= 0 && S.runs[o.parent])
            morphSetParent(run, S.runs[o.parent], o.parentAt);
        if (o.look >= 0 && S.runs[o.look] && S.runs[o.look] !== run) {
            run.look = S.runs[o.look];
            run.lookRef = num(o.lookRef, 0);
        }
    });
    for (const it of d.items || []) {
        if (it.morph != null) {
            if (S.runs[it.morph])
                S.items.push({ run: S.runs[it.morph] });
            continue;
        }
        const st = { fill: it.fill || null, stroke: it.stroke || null, width: num(it.width, 0), strokeOpacity: num(it.strokeOpacity, 1), open: !!it.open };
        if (it.exact) {
            const ring = q => ({ x: arrOf(q.x), y: arrOf(q.y), r: q.r ? arrOf(q.r) : null, smooth: q.smooth || null, ctrl: q.ctrl ? q.ctrl.map(e => Array.isArray(e) && e.length === 4 ? e.map(Number) : null) : null });
            st.exact = ring(it.exact);
            st.holes = (it.exact.holes || []).map(ring);
        } else if (it.leaves) {
            st.leaves = { x: arrOf(it.leaves.x), y: arrOf(it.leaves.y) };
        } else
            continue;
        S.items.push({ still: st });
    }
    S.frame = frameOf(S);
    return S;
}
// the engine reads the bar's settings and the list of live morphs from the editor's names: one scene
// at a time has them
function use(S) {
    state.morphEase = S.ease;
    state.morphHold = S.hold;
    state.morphGravity = S.gravity;
    state.morphWind = S.wind;
    state.morphTrail = S.trail.kind;
    state.morphTrailLen = S.trail.len;
    morphLive.path = S.path;
    morphRuns.length = 0;
    for (const r of S.runs)
        morphRuns.push(r);
}
function poseOf(run, t) {
    morphLive.t = t;
    if (run.exact)
        return morphPoseExact(run, t);
    const N = run.keys[0].x.length,
        X = new Float64Array(N),
        Y = new Float64Array(N);
    morphPoseInto(run, t, X, Y);
    return { x: X, y: Y };
}
function posesAt(S, t) {
    use(S);
    return S.runs.map(r => poseOf(r, t));
}
// the box everything is drawn in over a whole loop, sampled, so a throw's landing or a drift's fall is in it
function frameOf(S) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const take = (X, Y) => {
        for (let i = 0; i < X.length; i++) {
            if (X[i] < x0) x0 = X[i];
            if (X[i] > x1) x1 = X[i];
            if (Y[i] < y0) y0 = Y[i];
            if (Y[i] > y1) y1 = Y[i];
        }
    };
    for (const it of S.items)
        if (it.still)
            take(...(it.still.exact ? [it.still.exact.x, it.still.exact.y] : [it.still.leaves.x, it.still.leaves.y]));
    for (let q = 0; q < 48; q++)
        for (const P of posesAt(S, q / 48))
            take(P.x, P.y);
    if (!isFinite(x0))
        return { x0: -1, x1: 1, y0: -1, y1: 1 };
    const pad = 0.04 * Math.max(x1 - x0, y1 - y0, 1e-9);
    return { x0: x0 - pad, x1: x1 + pad, y0: y0 - pad, y1: y1 + pad };
}
// the page's units to the canvas's (y up becomes y down), the frame fitted and centred: the camera's box at
// t when the scene has a camera, else everything the loop draws
function viewOf(S, w, h, t) {
    const B = S.camera.length ? morphCameraAt(S.camera, t || 0) : null,
        F = B ? { x0: B[0], y0: B[1], x1: B[2], y1: B[3] } : S.frame,
        k = Math.min(w / Math.max(1e-12, F.x1 - F.x0), h / Math.max(1e-12, F.y1 - F.y0));
    const ox = w / 2 - k * (F.x0 + F.x1) / 2,
        oy = h / 2 + k * (F.y0 + F.y1) / 2;
    return { k, px: x => ox + k * x, py: y => oy - k * y };
}
function rgba(fill, fade) {
    if (!fill || !fill.color)
        return null;
    const m = /^#([0-9a-f]{6})$/i.exec(fill.color);
    const a = (fill.opacity != null ? +fill.opacity : 1) * fade;
    if (!m)
        return fill.color;
    const v = parseInt(m[1], 16);
    return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a.toFixed(4) + ')';
}
// the curve through leaves X, Y sampled at about M points: by the FFT (§21.1 of the format's companion) when
// the leaf count is a power of two, which every drawing tool shape's is, with M rounded up to one too; else by the
// kernel sum. The FFT gives the same samples, and on a phone it is what keeps a 2,048-leaf shape under a frame:
// the sum is N·M multiplications a channel (measured, tools/measure-player.mjs: 170 ms a frame against 1.6)
function curveOf(X, Y, M) {
    const N = X.length;
    if (TVF_CORE.reconstructFFT && TVF_CORE.isPow2 && TVF_CORE.isPow2(N)) {
        let m = 32;
        while (m < M)
            m *= 2;
        return { x: TVF_CORE.reconstructFFT(X, m), y: TVF_CORE.reconstructFFT(Y, m) };
    }
    return { x: tvf.reconstruct(X, M), y: tvf.reconstruct(Y, M) };
}
// a leaf outline traced at the canvas's resolution: the kernel's curve through the leaves, sampled about
// every two pixels along it (the leaves are the shape; the samples are only how finely it is drawn)
function traceLeaves(ctx, V, X, Y) {
    const N = X.length;
    let per = 0;
    for (let i = 0; i < N; i++)
        per += Math.hypot(X[(i + 1) % N] - X[i], Y[(i + 1) % N] - Y[i]);
    const C = curveOf(X, Y, Math.max(32, Math.min(4096, Math.ceil(per * V.k / 2)))),
        M = C.x.length,
        cx = C.x,
        cy = C.y;
    ctx.moveTo(V.px(cx[0]), V.py(cy[0]));
    for (let i = 1; i < M; i++)
        ctx.lineTo(V.px(cx[i]), V.py(cy[i]));
    ctx.closePath();
}
function traceExactPose(ctx, V, P, open) {
    const pts = morphExactCubics(P, open);
    ctx.moveTo(V.px(pts[0].x), V.py(pts[0].y));
    for (let i = 1; i + 2 < pts.length; i += 3)
        ctx.bezierCurveTo(V.px(pts[i].x), V.py(pts[i].y), V.px(pts[i + 1].x), V.py(pts[i + 1].y), V.px(pts[i + 2].x), V.py(pts[i + 2].y));
    if (!open)
        ctx.closePath();
}
// DRAWING A LINE ON, as the editor's drawShapeDrawingOn: the outline stroked from its start for share f of
// its length, in its own line or its fill's colour, the fill coming in over the window's last part and a
// line it has not got of its own going as the fill comes
function drawOn(ctx, V, run, P, f, fade, fill) {
    const open = !!run.open,
        sp = run.sp;
    let X, Y;
    if (run.exact) {
        const D = exactDense(P.x, P.y, hasRound(P.r) ? P.r : null, open, null, hasCtrl(P.c) ? P.c : null);
        X = D.x;
        Y = D.y;
    } else {
        const N = P.x.length;
        let per = 0;
        for (let i = 0; i < N; i++)
            per += Math.hypot(P.x[(i + 1) % N] - P.x[i], P.y[(i + 1) % N] - P.y[i]);
        const C = curveOf(P.x, P.y, Math.max(32, Math.min(4096, Math.ceil(per * V.k / 2))));
        X = C.x;
        Y = C.y;
    }
    const n = X.length,
        pts = [];
    for (let i = 0; i < n; i++)
        pts.push({ x: V.px(X[i]), y: V.py(Y[i]) });
    if (!open)
        pts.push(pts[0]);
    let L = 0;
    for (let i = 1; i < pts.length; i++)
        L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    const fillCol = !open && fill && fill.color ? fill : null,
        ff = morphDrawFill(f),
        hasLine = sp.lineWidth > 0 && (!!sp.stroke || !fillCol),
        lw = hasLine ? sp.lineWidth : 2,
        col = (hasLine && sp.stroke) || (fillCol && fillCol.color) || sp.stroke || 'rgba(212,160,82,1)';
    ctx.save();
    if (fillCol && ff > 0) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < n; i++)
            ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        if (run.exact)
            for (const h of morphHolesAt(run, P) || [])
                traceRing(ctx, V, { x: h.x, y: h.y, r: null, smooth: h.smooth, ctrl: h.ctrl }, false);
        ctx.fillStyle = rgba(fillCol, fade * ff);
        ctx.fill('evenodd');
    }
    const a = fade * (sp.strokeOpacity != null ? sp.strokeOpacity : 1) * (hasLine ? 1 : 1 - ff);
    if (a > 0 && L > 0) {
        ctx.strokeStyle = rgba({ color: col, opacity: 1 }, a) || col;
        ctx.lineWidth = lw;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        let left = f * L;
        for (let i = 1; i < pts.length && left > 0; i++) {
            const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
            if (d <= left) {
                ctx.lineTo(pts[i].x, pts[i].y);
                left -= d;
            } else {
                const u = left / d;
                ctx.lineTo(pts[i - 1].x + u * (pts[i].x - pts[i - 1].x), pts[i - 1].y + u * (pts[i].y - pts[i - 1].y));
                left = 0;
            }
        }
        ctx.stroke();
    }
    ctx.restore();
}
function traceRing(ctx, V, q, open) {
    const D = exactDense(q.x, q.y, q.r, open, q.smooth, q.ctrl);
    ctx.moveTo(V.px(D.x[0]), V.py(D.y[0]));
    for (let i = 1; i < D.x.length; i++)
        ctx.lineTo(V.px(D.x[i]), V.py(D.y[i]));
    if (!open)
        ctx.closePath();
}
function paint(ctx, fill, stroke, width, strokeOpacity, fade, open) {
    const f = !open && rgba(fill, fade);
    if (f) {
        ctx.fillStyle = f;
        ctx.fill('evenodd');
    }
    if (stroke && width > 0) {
        ctx.strokeStyle = rgba({ color: stroke, opacity: strokeOpacity }, fade) || stroke;
        ctx.lineWidth = width;
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
}
// TRAILS, as the editor's drawMorphTrails: under every shape, echoes the pose at seven earlier moments
// (fainter the older, in the colour it had then), a ribbon the centre's way back tapering from the
// shape's width; reaching back round the loop only where the motion is a loop
function drawTrails(ctx, S, V, t) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const run of S.runs) {
        const kind = morphTrailOf(run).kind;
        if (!MORPH_TRAILS.includes(kind))
            continue;
        const span = morphTrailSpan(run),
            sp = run.sp,
            fillCol = sp.fill && sp.fill.color ? sp.fill.color : null,
            fillA = sp.fill && sp.fill.opacity != null ? +sp.fill.opacity : 1,
            lineCol = sp.stroke || (fillCol ? null : 'rgba(212,160,82,1)'),
            lw = sp.lineWidth;
        if (kind === 'echoes') {
            for (let k = MORPH_ECHOES; k >= 1; k--) {
                const u = morphTrailTime(run, t, span * k / MORPH_ECHOES);
                if (u == null)
                    continue;
                const fu = morphShowFactor(run, u),
                    a = 0.6 * (1 - k / (MORPH_ECHOES + 1)) * (fu == null ? 1 : fu);
                if (!(a > 0))
                    continue;
                const P = poseOf(run, u);
                ctx.beginPath();
                if (run.exact)
                    traceExactPose(ctx, V, P, run.open);
                else
                    traceLeaves(ctx, V, P.x, P.y);
                if (fillCol) {
                    const C = run.cols ? morphColourAt(run, u) : null;
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
            const P = poseOf(run, t),
                O = run.exact ? exactDenseOf(P) : P,
                N = O.x.length;
            let cx = 0, cy = 0, r = 0;
            for (let i = 0; i < N; i++) {
                cx += O.x[i];
                cy += O.y[i];
            }
            cx /= N;
            cy /= N;
            for (let i = 0; i < N; i++)
                r += Math.hypot(O.x[i] - cx, O.y[i] - cy);
            const head = 2 * V.k * r / N,
                S2 = 48;
            ctx.strokeStyle = fillCol || lineCol || 'rgba(212,160,82,1)';
            let prev = null;
            for (let k = S2; k >= 0; k--) {
                const u = morphTrailTime(run, t, span * k / S2);
                if (u == null) {
                    prev = null;
                    continue;
                }
                morphLive.t = u;
                const c = morphCentreAt(run, u),
                    q = { x: V.px(c.x), y: V.py(c.y) };
                if (prev) {
                    const f = 1 - k / S2,
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
    morphLive.t = t;
}
// A STILL never changes, so its outline is made once as a Path2D in page units (a leaf shape's again only when
// the zoom asks for twice or half the samples) and drawn under the view's transform, its line set in pixels.
// Measured on the orrery, 24 stills: 5.7 ms a frame to 2.6 at 3× pixels (tools/measure-player.mjs).
function drawStill(ctx, V, st) {
    let P = st._p2;
    if (st.exact) {
        if (!P) {
            P = new Path2D();
            const ring = (q, open) => {
                const D = exactDense(q.x, q.y, q.r, open, q.smooth, q.ctrl);
                P.moveTo(D.x[0], D.y[0]);
                for (let i = 1; i < D.x.length; i++)
                    P.lineTo(D.x[i], D.y[i]);
                if (!open)
                    P.closePath();
            };
            ring(st.exact, st.open);
            for (const hole of st.holes)
                ring(hole, false);
            st._p2 = P;
        }
    } else {
        const X = st.leaves.x,
            Y = st.leaves.y,
            N = X.length;
        if (st._per == null) {
            let per = 0;
            for (let i = 0; i < N; i++)
                per += Math.hypot(X[(i + 1) % N] - X[i], Y[(i + 1) % N] - Y[i]);
            st._per = per;
        }
        let want = 32;
        while (want < Math.min(4096, st._per * V.k / 2))
            want *= 2;
        if (!P || st._p2M !== want) {
            const C = curveOf(X, Y, want);
            P = new Path2D();
            P.moveTo(C.x[0], C.y[0]);
            for (let i = 1; i < C.x.length; i++)
                P.lineTo(C.x[i], C.y[i]);
            P.closePath();
            st._p2 = P;
            st._p2M = want;
        }
    }
    ctx.save();
    ctx.transform(V.k, 0, 0, -V.k, V.px(0), V.py(0));
    const f = !st.open && rgba(st.fill, 1);
    if (f) {
        ctx.fillStyle = f;
        ctx.fill(P, 'evenodd');
    }
    if (st.stroke && st.width > 0) {
        ctx.strokeStyle = rgba({ color: st.stroke, opacity: st.strokeOpacity }, 1) || st.stroke;
        ctx.lineWidth = st.width / V.k;
        ctx.lineJoin = 'round';
        ctx.stroke(P);
    }
    ctx.restore();
}
function drawScene(ctx, S, t, w, h) {
    const V = viewOf(S, w, h, t);
    use(S);
    morphLive.t = t;
    drawTrails(ctx, S, V, t);
    for (const it of S.items) {
        ctx.beginPath();
        if (it.still) {
            drawStill(ctx, V, it.still);
            continue;
        }
        const run = it.run,
            sf = morphShowFactor(run, t), // undefined: always seen
            fade = sf == null ? 1 : sf;
        if (!(fade > 0))
            continue;
        const P = poseOf(run, t),
            fill = run.cols ? morphColourAt(run, t) : run.sp.fill,
            f = morphDrawFactor(run, t);
        if (f != null && f < 1) { // DRAWING A LINE ON
            drawOn(ctx, V, run, P, f, fade, fill);
            continue;
        }
        if (run.exact) {
            traceExactPose(ctx, V, P, run.open);
            for (const h of morphHolesAt(run, P) || []) // HOLES THAT RIDE A STILL
                traceRing(ctx, V, { x: h.x, y: h.y, r: null, smooth: h.smooth, ctrl: h.ctrl }, false);
        } else
            traceLeaves(ctx, V, P.x, P.y);
        paint(ctx, fill, run.sp.stroke, run.sp.lineWidth, run.sp.strokeOpacity, fade, run.open);
    }
}
function playOn(canvas, src, opts) {
    opts = opts || {};
    const ctl = { scene: null, t: 0, playing: opts.autoplay !== false, raf: 0, last: 0 };
    const ctx = canvas.getContext('2d');
    const frame = now => {
        ctl.raf = 0;
        if (!ctl.scene)
            return;
        if (ctl.playing) {
            if (ctl.last) {
                const t1 = ctl.t + (now - ctl.last) / 1000 / ctl.scene.loop,
                    s = morphStopCrossed(ctl.scene.stops, ctl.t, t1); // STOPS: wait here
                if (s != null) {
                    ctl.t = s >= 1 ? 1 - 1e-9 : s;
                    ctl.playing = false;
                    ctl.stop = s >= 1 ? ctl.scene.stops.length : ctl.scene.stops.indexOf(s);
                    if (typeof opts.onstop === 'function')
                        opts.onstop(ctl);
                } else
                    ctl.t = t1 % 1;
            }
            ctl.last = now;
        }
        const r = canvas.getBoundingClientRect(),
            dpr = (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1),
            w = Math.max(1, Math.round((r.width || canvas.width) * dpr)),
            h = Math.max(1, Math.round((r.height || canvas.height) * dpr));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (opts.background) {
            ctx.fillStyle = opts.background;
            ctx.fillRect(0, 0, w, h);
        }
        drawScene(ctx, ctl.scene, ctl.t, w, h);
        if (ctl.playing)
            ctl.raf = requestAnimationFrame(frame);
    };
    const kick = () => {
        if (!ctl.raf)
            ctl.raf = requestAnimationFrame(frame);
    };
    ctl.play = () => { ctl.playing = true; ctl.last = 0; ctl.stop = -1; kick(); };
    ctl.pause = () => { ctl.playing = false; };
    ctl.seek = t => { ctl.t = ((num(t, 0) % 1) + 1) % 1; kick(); };
    // STOPS: go on from one (from the end, start again), or back to the one before and wait there
    ctl.next = () => {
        if (ctl.t >= 1 - 1e-6)
            ctl.t = 0;
        ctl.play();
    };
    ctl.prev = () => {
        ctl.pause();
        ctl.seek(ctl.scene ? morphStopBefore(ctl.scene.stops, ctl.t) : 0);
    };
    ctl.stop = -1;
    if (opts.click !== false)
        canvas.addEventListener('click', () => {
            if (ctl.scene && ctl.scene.stops.length && !ctl.playing)
                ctl.next();
        });
    const ready = d => { ctl.scene = loadScene(d); kick(); return ctl; };
    ctl.ready = typeof src === 'string' ? fetch(src).then(r => r.json()).then(ready) : Promise.resolve(ready(src));
    return ctl;
}
function attach(rootEl) {
    const el = rootEl || (typeof document !== 'undefined' ? document : null);
    if (!el)
        return [];
    return [...el.querySelectorAll('canvas[data-tvfs]')].filter(c => !c._tvfs).map(c => (c._tvfs = playOn(c, c.dataset.tvfs, { background: c.dataset.background || null })));
}
const TVFPlayer = { version: PLAYER_VERSION, load: loadScene, poses: posesAt, draw: drawScene, play: playOn, attach };
root.TVFPlayer = TVFPlayer;
if (typeof module !== 'undefined' && module.exports)
    module.exports = TVFPlayer;
if (typeof document !== 'undefined')
    (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', () => attach()) : attach());
