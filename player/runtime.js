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
    PLAYER_SCENE_VERSION = 2; // the newest .tvfs version it reads (papers/tvf.md §2.10); version 2 adds a morph's xform
const num = (v, d) => Number.isFinite(+v) ? +v : d;
const arrOf = v => typeof v === 'string' ? Float64Array.from(_b64f32(v) || []) : Float64Array.from(v || []);

function loadScene(d) {
    if (!d || d.format !== 'tvf-scene')
        throw new Error('not a tvf scene');
    // THE VERSION (papers/tvf.md §2.10): a version this player does not know is refused, not guessed at;
    // fields it does not know within version 1 are ignored
    if (d.v != null && !(+d.v >= 1 && +d.v <= PLAYER_SCENE_VERSION && +d.v === Math.round(+d.v)))
        throw new Error('a version ' + d.v + ' scene: this player reads versions 1 to ' + PLAYER_SCENE_VERSION);
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
        frame: null,
        states: statesOf(d.states), // INTERACTIVE SCENES
        start: 0,
        interact: []
    };
    S.start = stateT(S, d.start, 0);
    S.interact = rulesOf(d.interact, S);
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
            sp: { fill: m.fill || null, stroke: m.stroke || null, lineWidth: num(m.width, 0), strokeOpacity: num(m.strokeOpacity, 1), page: m.widthUnit === 'page' },
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
        run.touch = touchOf(m.touch, run); // PHYSICS YOU CAN TOUCH
        run.xform = keys.length === 1 ? xformOf(m.xform) : null; // ONE SHAPE, MOVED
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
        const st = { fill: it.fill || null, stroke: it.stroke || null, width: num(it.width, 0), strokeOpacity: num(it.strokeOpacity, 1), open: !!it.open, page: it.widthUnit === 'page' };
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
    for (const run of S.runs)
        if (run.touch)
            run.touch.floor = floorOf(S, run);
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
function poseOf(run, t, bare) {
    const T = run.touch,
        u = T && T.hold != null ? T.hold : t; // held: its pose where it was taken (PHYSICS YOU CAN TOUCH)
    morphLive.t = u;
    let P;
    if (run.exact)
        P = morphPoseExact(run, u);
    else {
        const N = run.keys[0].x.length,
            X = new Float64Array(N),
            Y = new Float64Array(N);
        morphPoseInto(run, u, X, Y);
        P = { x: X, y: Y };
    }
    morphLive.t = t;
    if (run.xform)
        P = xformPose(run, P, u);
    return bare ? P : touchMapped(run, P);
}
// ── ONE SHAPE, MOVED (29 Oct 2026, Tom: "Yes", to making Lottie's scenes smaller) ───────────────────────────
// A morph of one key may carry `xform` (papers/tvf.md §2.10, version 2): its key moved, turned, sized and
// sheared over time, the outline stored once. Each key of the transform is [tx, ty, θ, sx, sh, sy]: the map
// x' = R(θ)·[[sx, sh], [0, sy]]·x + (tx, ty), the 2×2 part split as a turn times an upper triangle (QR), so a
// shape that turns keeps its size between keys, where blending two matrices straight would shrink it through
// the middle. The parts are blended straight between keys, each stretch with its own ease (a name or a cubic
// Bézier, as a morph's own eases) on the morph's own clock (morphRunT: its clip, rate and phase), held before
// the first key and after the last. Optional `c` gives each key's fill in linear light, blended the same way,
// for a shape that fades or changes colour as it moves. Radii and a page-unit line scale with the map's size.
function xformOf(v) {
    if (!v || !Array.isArray(v.t) || !Array.isArray(v.v) || !v.t.length || v.t.length !== v.v.length)
        return null;
    const t = v.t.map(Number),
        k = v.v.map(q => Array.isArray(q) && q.length === 6 ? q.map(Number) : null);
    if (k.some(q => !q || q.some(x => !Number.isFinite(x))) || t.some((x, i) => !Number.isFinite(x) || (i && x < t[i - 1])))
        return null;
    const n = t.length;
    return {
        t,
        v: k,
        e: Array.isArray(v.e) && v.e.length === n - 1 ? v.e.map(e => e == null || e === 'linear' ? '' : e) : new Array(Math.max(0, n - 1)).fill(''),
        c: Array.isArray(v.c) && v.c.length === n && v.c.every(q => Array.isArray(q) && q.length === 4) ? v.c.map(q => q.map(Number)) : null
    };
}
// the transform's parts, and its fill, at the morph's own time
function xformAt(X, u) {
    const n = X.t.length;
    let k = 0, s = 0;
    if (u <= X.t[0] || n === 1)
        k = 0;
    else if (u >= X.t[n - 1]) {
        k = n - 2;
        s = 1;
    } else {
        while (k < n - 2 && X.t[k + 1] <= u)
            k++;
        s = (u - X.t[k]) / ((X.t[k + 1] - X.t[k]) || 1);
        s = morphEase(s, X.e[k]);
    }
    const A = X.v[k],
        B = X.v[Math.min(n - 1, k + 1)],
        q = A.map((a, i) => a + (B[i] - a) * s);
    let col = null;
    if (X.c) {
        const CA = X.c[k], CB = X.c[Math.min(n - 1, k + 1)];
        col = CA.map((a, i) => a + (CB[i] - a) * s);
    }
    return { q, col };
}
function xformPose(run, P, t) {
    const { q } = xformAt(run.xform, morphRunT(run, t)),
        [tx, ty, th, sx, sh, sy] = q,
        cs = Math.cos(th),
        sn = Math.sin(th),
        a = cs * sx, b = sn * sx, c = cs * sh - sn * sy, d = sn * sh + cs * sy,
        k = Math.sqrt(Math.abs(a * d - b * c)),
        n = P.x.length,
        X = new Float64Array(n),
        Y = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        X[i] = a * P.x[i] + c * P.y[i] + tx;
        Y[i] = b * P.x[i] + d * P.y[i] + ty;
    }
    const out = { x: X, y: Y, wk: k };
    if (P.r)
        out.r = Float64Array.from(P.r, v => v * k);
    if (P.c)
        out.c = P.c.map(e => e ? [a * e[0] + c * e[1] + tx, b * e[0] + d * e[1] + ty, a * e[2] + c * e[3] + tx, b * e[2] + d * e[3] + ty] : e);
    for (const key of Object.keys(P))
        if (!(key in out))
            out[key] = P[key];
    return out;
}
// a morph's fill at t: its keys' colours, its transform's, or the one it was given
function fillOf(run, t) {
    if (run.xform && run.xform.c) {
        const L = xformAt(run.xform, morphRunT(run, t)).col,
            cl = v => Math.max(0, Math.min(1, v)),
            hx = v => { v = cl(v); return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)).toString(16).padStart(2, '0'); };
        return { color: '#' + hx(L[0]) + hx(L[1]) + hx(L[2]), opacity: cl(L[3]) };
    }
    return run.cols ? morphColourAt(run, t) : run.sp.fill;
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
        lw = hasLine ? sp.lineWidth * (sp.page ? V.k * (P.wk || 1) : 1) : 2,
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
                    const C = run.cols || (run.xform && run.xform.c) ? fillOf(run, u) : null;
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
        ctx.lineWidth = st.page ? st.width : st.width / V.k; // a width in the page's units scales with the drawing
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
            fill = fillOf(run, t),
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
        paint(ctx, fill, run.sp.stroke, run.sp.lineWidth * (run.sp.page ? V.k * (P.wk || 1) : 1), run.sp.strokeOpacity, fade, run.open);
    }
}
// ── INTERACTIVE SCENES (29 Oct 2026, Tom: "1,2,4", the first "interactive scenes") ──────────────────────────
// A scene may name moments of its loop (states: { open: 0.5 }) and say what the viewer's hand does with them
// (interact: rules). The clock is then the scene's to move toward a state and stop there, forward or back, at
// the scene's own pace, so an icon opens on a click and closes on the next, a button sinks while pressed and
// comes back on release, a card lifts while the pointer is over it, a picture follows the page's scroll. A rule:
//   { on: 'click' | 'hover' | 'press' | 'scroll' | 'load', target: a morph's index or a list of them (none: the
//     whole canvas), to: a state or a time, back: where hover's leaving or press's release goes (the start),
//     toggle: [a, b] (a click goes to whichever it is not at), play: 'once' (the loop from its start, once) |
//     'loop' (playing round, or stopping), speed: how many times the scene's pace (1), from/to for scroll }
// Nothing here is posed differently: a state is only a time, and the keys, motions and clips are as they were.
function statesOf(v) {
    const o = {};
    if (v && typeof v === 'object' && !Array.isArray(v))
        for (const k of Object.keys(v))
            if (Number.isFinite(+v[k]))
                o[k] = Math.max(0, Math.min(1, +v[k]));
    return o;
}
function stateT(S, v, d) {
    if (typeof v === 'string' && v in S.states)
        return S.states[v];
    return Number.isFinite(+v) && v !== null && v !== '' ? Math.max(0, Math.min(1, +v)) : d;
}
const RULE_ON = ['click', 'hover', 'press', 'scroll', 'load'];
function rulesOf(v, S) {
    if (!Array.isArray(v))
        return [];
    const nMorph = (S.d.morphs || []).length;
    return v.filter(r => r && RULE_ON.includes(r.on)).map(r => {
        const tg = r.target == null ? null : (Array.isArray(r.target) ? r.target : [r.target]).map(Number).filter(i => i >= 0 && i < nMorph);
        return {
            on: r.on,
            target: tg && tg.length ? tg : null,
            to: stateT(S, r.to, null),
            back: stateT(S, r.back, S.start),
            toggle: Array.isArray(r.toggle) && r.toggle.length === 2 ? r.toggle.map(q => stateT(S, q, 0)) : null,
            play: r.play === 'once' || r.play === 'loop' ? r.play : null,
            speed: Math.max(0.05, Math.min(20, num(r.speed, 1))),
            from: stateT(S, r.from, 0),
            upto: stateT(S, r.to, 1)
        };
    });
}
// the canvas's pixel under the morph's drawn pose: its fill, or within a finger's width of its line
function hitRun(ctx, V, run, P, x, y, slack) {
    const path = new Path2D();
    if (run.exact) {
        traceExactPose(path, V, P, run.open);
        for (const h of morphHolesAt(run, P) || [])
            traceRing(path, V, { x: h.x, y: h.y, r: null, smooth: h.smooth, ctrl: h.ctrl }, false);
    } else
        traceLeaves(path, V, P.x, P.y);
    if (!run.open && ctx.isPointInPath(path, x, y, 'evenodd'))
        return true;
    ctx.save();
    ctx.lineWidth = Math.max(slack, run.sp.lineWidth || 0);
    const on = ctx.isPointInStroke(path, x, y);
    ctx.restore();
    return on;
}
// the morph (its index) drawn on top at a canvas pixel, of those `among` allows, or -1
function hitAt(ctx, S, t, w, h, x, y, among, slack) {
    const V = viewOf(S, w, h, t);
    use(S);
    for (let i = S.items.length - 1; i >= 0; i--) {
        const run = S.items[i].run;
        if (!run)
            continue;
        const k = S.runs.indexOf(run);
        if (among && !among(k, run))
            continue;
        const sf = morphShowFactor(run, t);
        if (sf != null && !(sf > 0))
            continue;
        if (hitRun(ctx, V, run, poseOf(run, t), x, y, slack))
            return k;
    }
    return -1;
}

// ── PHYSICS YOU CAN TOUCH (29 Oct 2026, Tom: "1,2,4", the second) ─────────────────────────────────────────────
// A morph with touch can be taken in the hand and let go. While held it is posed where it was taken (its
// own clock stopped there) and carried with the hand; let go, it moves as its kind says, from the hand's own
// speed as it let go, and then gives itself back to its motion:
//   throw  (a bounce, fall, throw, roll or drift has it): flies under the scene's gravity, bouncing off its
//          floor (the lowest its pose reaches over the loop) and the frame's sides, rolls to rest, and glides
//          home; then its clock goes on from where it stopped
//   swing  (a swing has it): turns about its pivot toward the hand, and let go swings as a pendulum of its own
//          length, damped, back into its motion
//   spring (anything else): pulled from where its motion has it and let go springs back, overshooting
// The touch is an offset on the pose (a move and a turn about a point), the motion underneath unchanged, so a
// scene that is touched plays on exactly as it was written once the touch has gone. A morph riding another
// (parent) is carried by its parent's touch too.
const TOUCH_KINDS = ['throw', 'swing', 'spring'];
function touchOf(v, run) {
    if (!v)
        return null;
    const M = run.motion,
        mk = M && M.kind === 'chain' ? (M.steps[0] || {}).kind : M && M.kind,
        dflt = ['bounce', 'fall', 'throw', 'roll', 'drift'].includes(mk) ? 'throw' : mk === 'swing' ? 'swing' : 'spring';
    const o = typeof v === 'object' ? v : {};
    return {
        kind: TOUCH_KINDS.includes(o.kind) ? o.kind : dflt,
        bounce: Math.max(0, Math.min(0.95, num(o.bounce, 0.55))), // a throw: the speed kept off the floor
        stiff: Math.max(1, Math.min(400, num(o.stiff, 60))), // a spring: how hard it pulls back (per second²)
        damp: Math.max(0, Math.min(40, num(o.damp, 5))), // a spring's or a swing's damping (per second)
        pivot: o.pivot || (M && M.kind === 'swing' ? M.pivot : 'top'),
        hold: null, // the clock where it was taken
        ox: 0, oy: 0, th: 0, cx: 0, cy: 0, // its offset now: a move, and a turn of th about (cx, cy)
        vx: 0, vy: 0, w: 0,
        phase: 'idle', // idle, held, fly, rest, home, swing, spring
        rest: 0, home: null, floor: null
    };
}
// the lowest its own pose reaches over the loop: a thrown ball lands where it bounces
function floorOf(S, run) {
    let lo = Infinity;
    for (let q = 0; q < 48; q++) {
        const P = poseOf(run, q / 48, true),
            X = run.exact ? exactDenseOf(P) : P;
        for (let i = 0; i < X.y.length; i++)
            if (X.y[i] < lo)
                lo = X.y[i];
    }
    return Number.isFinite(lo) ? lo : S.frame.y0;
}
function touchActive(T) {
    return !!T && T.phase !== 'idle';
}
// the touch's map on a pose: turned th about (cx, cy), then moved (ox, oy); the riders carried by their parents'
function touchMapped(run, P) {
    const maps = [];
    for (let r = run, n = 0; r && n < 16; r = r.parent, n++)
        if (touchActive(r.touch))
            maps.push(r.touch);
    if (!maps.length)
        return P;
    const X = Float64Array.from(P.x),
        Y = Float64Array.from(P.y),
        C = P.c ? P.c.map(e => e ? e.slice() : e) : null;
    const go = (T, x, y) => {
        const c = Math.cos(T.th),
            s = Math.sin(T.th),
            dx = x - T.cx,
            dy = y - T.cy;
        return [T.cx + c * dx - s * dy + T.ox, T.cy + s * dx + c * dy + T.oy];
    };
    for (const T of maps) {
        for (let i = 0; i < X.length; i++)
            [X[i], Y[i]] = go(T, X[i], Y[i]);
        if (C)
            for (const e of C)
                if (e) {
                    [e[0], e[1]] = go(T, e[0], e[1]);
                    [e[2], e[3]] = go(T, e[2], e[3]);
                }
    }
    return P.c ? { x: X, y: Y, r: P.r, c: C } : { x: X, y: Y };
}
// a pose's box (dense for an exact one, so a curve's bulge counts)
function boxOf(run, P) {
    const D = run.exact ? exactDenseOf(P) : P;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, sx = 0, sy = 0;
    for (let i = 0; i < D.x.length; i++) {
        const x = D.x[i], y = D.y[i];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        sx += x;
        sy += y;
    }
    return { x0, x1, y0, y1, cx: sx / D.x.length, cy: sy / D.x.length };
}
function pivotOf(B, pv) {
    const mx = (B.x0 + B.x1) / 2, my = (B.y0 + B.y1) / 2;
    return pv === 'bottom' ? [mx, B.y0] : pv === 'left' ? [B.x0, my] : pv === 'right' ? [B.x1, my] : pv === 'centre' ? [mx, my] : [mx, B.y1];
}
// one step of every touched morph's physics, dt seconds; true while any still moves
function touchStep(S, t, dt) {
    let busy = false;
    const H = Math.max(1e-9, S.frame.y1 - S.frame.y0),
        g = 6 * H * S.gravity; // a drop the frame's height takes about 0.6 s
    for (const run of S.runs) {
        const T = run.touch;
        if (!touchActive(T) || T.phase === 'held')
            continue;
        busy = true;
        if (T.phase === 'fly' || T.phase === 'rest') {
            const B = boxOf(run, poseOf(run, t)),
                fl = T.floor,
                F = S.frame;
            T.vy -= g * dt;
            T.ox += T.vx * dt;
            T.oy += T.vy * dt;
            const by = B.y0 + T.vy * dt; // where its foot is now, the offset just applied
            let ground = false;
            if (by < fl) {
                T.oy += fl - by;
                if (T.vy < 0)
                    T.vy = Math.abs(T.vy) < 0.05 * H ? 0 : -T.vy * T.bounce;
                T.vx *= Math.pow(0.12, dt); // rolling on the floor slows it
                ground = true;
            }
            if (B.x0 < F.x0 && T.vx < 0) {
                T.ox += F.x0 - B.x0;
                T.vx = -T.vx * T.bounce;
            } else if (B.x1 > F.x1 && T.vx > 0) {
                T.ox -= B.x1 - F.x1;
                T.vx = -T.vx * T.bounce;
            }
            if (ground && Math.hypot(T.vx, T.vy) < 0.08 * H) {
                T.phase = 'rest';
                T.rest += dt;
                if (T.rest > 0.5) {
                    T.phase = 'home';
                    T.home = { t: 0, ox: T.ox, oy: T.oy };
                }
            } else {
                T.phase = 'fly';
                T.rest = 0;
            }
        } else if (T.phase === 'home') { // gliding back to where its motion has it, eased in and out
            T.home.t += dt / 0.8;
            const f = Math.min(1, T.home.t),
                e = f * f * (3 - 2 * f);
            T.ox = T.home.ox * (1 - e);
            T.oy = T.home.oy * (1 - e);
            if (f >= 1)
                touchRelease(S, run, t);
        } else if (T.phase === 'swing') { // a pendulum of its own length about the pivot
            const B = boxOf(run, poseOf(run, t, true)),
                L = Math.max(1e-6, Math.hypot(B.cx - T.cx, B.cy - T.cy)),
                hang = Math.atan2(B.cx - T.cx, T.cy - B.cy); // its motion's own angle from straight down
            T.w += (-(g / L) * Math.sin(T.th + hang) + (g / L) * Math.sin(hang) - T.damp * T.w) * dt;
            T.th += T.w * dt;
            T.th = ((T.th + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; // swung over the top, it is one turn
            if (Math.abs(T.th) < 2e-3 && Math.abs(T.w) < 2e-2)
                touchRelease(S, run, t);
        } else if (T.phase === 'spring') {
            T.vx += (-T.stiff * T.ox - T.damp * T.vx) * dt;
            T.vy += (-T.stiff * T.oy - T.damp * T.vy) * dt;
            T.w += (-T.stiff * T.th - T.damp * T.w) * dt;
            T.ox += T.vx * dt;
            T.oy += T.vy * dt;
            T.th += T.w * dt;
            if (Math.hypot(T.ox, T.oy) < 1e-4 * H && Math.hypot(T.vx, T.vy) < 1e-3 * H && Math.abs(T.th) < 1e-3)
                touchRelease(S, run, t);
        }
    }
    return busy;
}
// the touch gone: its clock goes on from where it was taken, so it picks up its motion where it left it
function touchRelease(S, run, t) {
    const T = run.touch;
    if (T.hold != null && !run.clip)
        run.phase = (((run.phase || 0) + (T.hold - t) * (run.rate || 1)) % 1 + 1) % 1;
    Object.assign(T, { hold: null, ox: 0, oy: 0, th: 0, vx: 0, vy: 0, w: 0, phase: 'idle', rest: 0, home: null });
}

function playOn(canvas, src, opts) {
    opts = opts || {};
    const ctl = { scene: null, t: 0, playing: opts.autoplay !== false, raf: 0, last: 0, goal: null, once: false };
    const ctx = canvas.getContext('2d');
    const size = () => {
        const r = canvas.getBoundingClientRect(),
            dpr = (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
        return { w: Math.max(1, Math.round((r.width || canvas.width) * dpr)), h: Math.max(1, Math.round((r.height || canvas.height) * dpr)), r };
    };
    const frame = now => {
        ctl.raf = 0;
        const S = ctl.scene;
        if (!S)
            return;
        const dt = ctl.last ? Math.min(0.05, Math.max(0, (now - ctl.last) / 1000)) : 0;
        ctl.last = now;
        if (ctl.goal) { // INTERACTIVE SCENES: toward a state, at the scene's pace, and stop there
            const G = ctl.goal,
                step = dt * G.speed / S.loop,
                d = G.t - ctl.t;
            if (Math.abs(d) <= step) {
                ctl.t = G.t;
                ctl.goal = null;
                if (typeof opts.onstate === 'function')
                    opts.onstate(ctl);
            } else
                ctl.t += Math.sign(d) * step;
        } else if (ctl.playing && dt > 0) {
            const t1 = ctl.t + dt / S.loop,
                s = morphStopCrossed(S.stops, ctl.t, t1); // STOPS: wait here
            if (ctl.once && t1 >= 1) {
                ctl.t = 1 - 1e-9;
                ctl.playing = ctl.once = false;
            } else if (s != null) {
                ctl.t = s >= 1 ? 1 - 1e-9 : s;
                ctl.playing = false;
                ctl.stop = s >= 1 ? S.stops.length : S.stops.indexOf(s);
                if (typeof opts.onstop === 'function')
                    opts.onstop(ctl);
            } else
                ctl.t = t1 % 1;
        }
        const busy = dt > 0 ? touchStep(S, ctl.t, dt) : S.runs.some(r => touchActive(r.touch));
        const { w, h } = size();
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
        drawScene(ctx, S, ctl.t, w, h);
        if (ctl.playing || ctl.goal || busy || held)
            ctl.raf = requestAnimationFrame(frame);
        else
            ctl.last = 0;
    };
    const kick = () => {
        if (!ctl.raf)
            ctl.raf = requestAnimationFrame(frame);
    };
    ctl.play = () => { ctl.playing = true; ctl.goal = null; ctl.stop = -1; kick(); };
    ctl.pause = () => { ctl.playing = false; ctl.goal = null; };
    ctl.seek = t => { ctl.t = ((num(t, 0) % 1) + 1) % 1; ctl.goal = null; kick(); };
    // INTERACTIVE SCENES: play toward a state (its name, or a time) and stop there, forward or back
    ctl.goTo = (to, speed) => {
        const S = ctl.scene;
        if (!S)
            return;
        const t = stateT(S, to, null);
        if (t == null)
            return;
        ctl.playing = ctl.once = false;
        ctl.goal = { t, speed: speed || 1 };
        kick();
    };
    // where morph k is drawn now, in the page's (CSS) pixels: its box's middle and size, for a page or a test to aim at
    ctl.whereIs = k => {
        const S = ctl.scene,
            run = S && S.runs[k];
        if (!run)
            return null;
        const { w, h, r } = size(),
            V = viewOf(S, w, h, ctl.t),
            B = boxOf(run, poseOf(run, ctl.t)),
            sx = r.width / w,
            sy = r.height / h;
        return { x: r.left + V.px((B.x0 + B.x1) / 2) * sx, y: r.top + V.py((B.y0 + B.y1) / 2) * sy, w: (B.x1 - B.x0) * V.k * sx, h: (B.y1 - B.y0) * V.k * sy };
    };
    ctl.playOnce = () => { ctl.t = 0; ctl.goal = null; ctl.once = true; ctl.playing = true; kick(); };
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

    // ── the hand: the scene's rules, and the morphs that can be taken ──
    let held = null, // { run, T, p0, o0, th0, piv, a0, samples }
        dragged = false;
    const inside = new Map(); // a hover rule's: whether the pointer is over its target now
    const px = e => {
        const { w, h, r } = size();
        return { x: (e.clientX - r.left) * w / Math.max(1, r.width), y: (e.clientY - r.top) * h / Math.max(1, r.height), w, h };
    };
    const pageOf = (q) => { // a canvas pixel in the page's units
        const V = viewOf(ctl.scene, q.w, q.h, ctl.t),
            o = V.px(0),
            oy = V.py(0);
        return { x: (q.x - o) / V.k, y: (oy - q.y) / V.k };
    };
    const slack = () => 10 * (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
    const over = (rule, q) => !rule.target || hitAt(ctx, ctl.scene, ctl.t, q.w, q.h, q.x, q.y, k => rule.target.includes(k), slack()) >= 0;
    const touchAt = q => hitAt(ctx, ctl.scene, ctl.t, q.w, q.h, q.x, q.y, (k, run) => !!run.touch, slack());
    const rules = on => ctl.scene ? ctl.scene.interact.filter(r => r.on === on) : [];
    const goBy = (rule, to) => ctl.goTo(to, rule.speed);
    canvas.addEventListener('pointermove', e => {
        const S = ctl.scene;
        if (!S)
            return;
        const q = px(e);
        if (held) {
            const p = pageOf(q),
                T = held.T,
                now = performance.now();
            if (Math.hypot(p.x - held.p0.x, p.y - held.p0.y) * viewOf(S, q.w, q.h, ctl.t).k > 4 * (devicePixelRatio || 1))
                dragged = true;
            if (T.kind === 'swing') {
                let th = held.th0 + Math.atan2(p.y - T.cy, p.x - T.cx) - held.a0;
                while (th - T.th > Math.PI) // kept continuous: atan2's seam is not a turn of the hand
                    th -= 2 * Math.PI;
                while (th - T.th < -Math.PI)
                    th += 2 * Math.PI;
                T.th = th;
            } else {
                T.ox = held.o0.x + p.x - held.p0.x;
                T.oy = held.o0.y + p.y - held.p0.y;
            }
            held.samples.push({ t: now, x: p.x, y: p.y, th: T.th });
            while (held.samples.length > 2 && now - held.samples[0].t > 100)
                held.samples.shift();
            kick();
            return;
        }
        for (const rule of rules('hover')) {
            const now = over(rule, q);
            if (now !== !!inside.get(rule)) {
                inside.set(rule, now);
                goBy(rule, now ? rule.to : rule.back);
            }
        }
        // the pointer says what a press here would do
        let cur = '';
        if (S.runs.some(r => r.touch) && touchAt(q) >= 0)
            cur = 'grab';
        else if (rules('click').concat(rules('press')).some(rule => over(rule, q)))
            cur = 'pointer';
        canvas.style.cursor = cur;
    });
    canvas.addEventListener('pointerleave', () => {
        if (held)
            return;
        for (const rule of rules('hover'))
            if (inside.get(rule)) {
                inside.set(rule, false);
                goBy(rule, rule.back);
            }
    });
    canvas.addEventListener('pointerdown', e => {
        const S = ctl.scene;
        if (!S)
            return;
        const q = px(e);
        dragged = false;
        const k = S.runs.some(r => r.touch) ? touchAt(q) : -1;
        if (k >= 0) { // PHYSICS YOU CAN TOUCH: taken in the hand
            const run = S.runs[k],
                T = run.touch,
                p = pageOf(q);
            if (T.hold == null && T.kind !== 'spring')
                T.hold = ctl.t;
            if (T.kind === 'swing') {
                if (T.phase !== 'swing') {
                    const [cx, cy] = pivotOf(boxOf(run, poseOf(run, ctl.t, true)), T.pivot);
                    T.cx = cx;
                    T.cy = cy;
                }
            }
            T.phase = 'held';
            T.vx = T.vy = T.w = 0;
            held = { run, T, p0: p, o0: { x: T.ox, y: T.oy }, th0: T.th, a0: Math.atan2(p.y - T.cy, p.x - T.cx), samples: [{ t: performance.now(), x: p.x, y: p.y, th: T.th }] };
            try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
            e.preventDefault();
            canvas.style.cursor = 'grabbing';
            kick();
            return;
        }
        for (const rule of rules('press'))
            if (over(rule, q)) {
                inside.set(rule, true);
                goBy(rule, rule.to);
            }
    });
    const up = e => {
        if (held) { // let go: away at the hand's own speed
            const { run, T, samples } = held,
                a = samples[0],
                b = samples[samples.length - 1],
                dt = Math.max(0.016, (b.t - a.t) / 1000);
            held = null;
            canvas.style.cursor = 'grab';
            if (T.kind === 'swing') {
                T.w = (b.th - a.th) / dt;
                if (T.hold != null && !run.clip) // it swings on from where it was taken, its own swing going on under it
                    run.phase = (((run.phase || 0) + (T.hold - ctl.t) * (run.rate || 1)) % 1 + 1) % 1;
                T.hold = null;
                T.phase = 'swing';
            } else {
                T.vx = (b.x - a.x) / dt;
                T.vy = (b.y - a.y) / dt;
                T.phase = T.kind === 'throw' ? 'fly' : 'spring';
            }
            kick();
            return;
        }
        for (const rule of rules('press'))
            if (inside.get(rule)) {
                inside.set(rule, false);
                goBy(rule, rule.back);
            }
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('click', e => {
        const S = ctl.scene;
        if (!S || dragged) {
            dragged = false;
            return;
        }
        const q = px(e),
            cl = rules('click').filter(rule => over(rule, q));
        for (const rule of cl) {
            if (rule.toggle) {
                const [a, b] = rule.toggle,
                    at = ctl.goal ? ctl.goal.t : ctl.t;
                goBy(rule, Math.abs(at - a) <= Math.abs(at - b) ? b : a);
            } else if (rule.play === 'once')
                ctl.playOnce();
            else if (rule.play === 'loop')
                ctl.playing ? ctl.pause() : ctl.play();
            else if (rule.to != null)
                goBy(rule, rule.to);
        }
        if (!cl.length && opts.click !== false && S.stops.length && !ctl.playing && !rules('click').length)
            ctl.next();
    });
    const scrolled = () => { // the clock follows the canvas through the window
        const S = ctl.scene,
            rule = rules('scroll')[0];
        if (!S || !rule || typeof innerHeight !== 'number')
            return;
        const r = canvas.getBoundingClientRect(),
            p = Math.max(0, Math.min(1, (innerHeight - r.top) / Math.max(1, innerHeight + r.height)));
        ctl.playing = false;
        ctl.goal = null;
        ctl.t = rule.from + p * (rule.upto - rule.from);
        kick();
    };
    const ready = d => {
        const S = ctl.scene = loadScene(d);
        if (S.interact.length || Object.keys(S.states).length) { // a scene with states starts at its start and waits for the hand
            ctl.t = S.start;
            ctl.playing = d.autoplay != null ? !!d.autoplay : (opts.autoplay === true);
        }
        if (S.runs.some(r => r.touch))
            canvas.style.touchAction = 'none'; // a finger on it takes the shape, not the page
        if (rules('scroll').length && typeof addEventListener === 'function') {
            addEventListener('scroll', scrolled, { passive: true });
            scrolled();
        }
        for (const rule of rules('load'))
            if (rule.to != null)
                goBy(rule, rule.to);
        kick();
        return ctl;
    };
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
