// ── LOTTIE TO TVFS (player/lottie.js; 29 Oct 2026, Tom: "1,2,4", the fourth "import from Lottie") ────────────────
// Reads a Lottie animation (the JSON After Effects' Bodymovin writes, which lottie-web and every Lottie player plays)
// and writes the same animation as a .tvfs scene (papers/tvf.md §2.10), so the TVF player plays it, and Lottie's
// files can be set against ours, size for size and frame for frame.
//
//   TVFLottie.isLottie(json)          true for a Lottie animation
//   TVFLottie.toScene(json, opts)     → { scene, report }   opts: { tol: 0.2 (px), name }
//
// HOW. Lottie keys properties (a path's vertices, a group's or layer's transform, a fill's colour) at frames, eased
// by cubic curves, and nests them: paths in groups in layers, layers parented to layers, layers in compositions
// in layers. A .tvfs scene has none of that structure: a morph is one outline in the page's units, its keys
// blended. So every frame is evaluated here, the whole chain of transforms applied, and each path Lottie draws
// becomes one exact morph (its vertices its corners, its Bézier tangents each edge's cubic) whose keys are those
// frames; then the keys a straight blend between their neighbours reproduces to within tol pixels are dropped
// (Douglas–Peucker in time), so a path that moves evenly keeps two keys and one that eases keeps a few. The
// morphs blend each stretch from its two keys (own.straight), at the keys' times (own.times), so what plays
// between two kept frames is the straight line the dropped frames lay on. Nothing moves that does not move in
// Lottie, and a path that never changes is a still.
//
// WHAT IT READS: shape layers (paths, rectangles with their roundness, ellipses, stars and polygons; fills, strokes;
// groups and their transforms; rounded corners), solids, nulls, parenting, precompositions with their start and
// stretch and time remapping, a layer's in and out, its transform (anchor, position, separate x and y, scale,
// rotation, opacity), every keyframe's easing, holds, and a position's curved path between keys.
// WHAT IT DOES NOT (counted in the report, and drawn as if absent): masks, mattes, effects, text, images,
// gradients (drawn in their middle colour), trim paths, repeaters, expressions, 3D layers, skew, blend modes; a
// stroke's colour or width keyed over time (its first is used); a shape filled with holes that moves (its rings
// drawn as separate shapes). Merge paths is read as its paths drawn apart.
(function (root) {
'use strict';
const r3 = v => Math.round(v * 1000) / 1000;
// coordinates to a hundredth of the composition's pixel: a twentieth of a device pixel on a 4K screen showing an 800 px
// composition, and a tenth less to send than thousandths
const r2 = v => Math.round(v * 100) / 100;
const r6 = v => Math.round(v * 1e6) / 1e6;

// ── a property at a frame ──
// A cubic ease: the y of the curve (0,0) (x1,y1) (x2,y2) (1,1) where its x is u.
function ease(x1, y1, x2, y2, u) {
    if (u <= 0)
        return 0;
    if (u >= 1)
        return 1;
    const bx = s => 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
    let lo = 0, hi = 1, s = u;
    for (let k = 0; k < 40; k++) { // bisection: x is increasing for 0 ≤ x1, x2 ≤ 1, and clamped to that
        s = (lo + hi) / 2;
        if (bx(s) < u)
            lo = s;
        else
            hi = s;
    }
    return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
}
const first = v => Array.isArray(v) ? v[0] : v;
const isKeyed = P => !!P && Array.isArray(P.k) && P.k.length > 0 && typeof P.k[0] === 'object' && P.k[0] !== null && 't' in P.k[0];
// numbers, arrays of them and shapes ({i, o, v, c}) blended by f
function mix(a, b, f) {
    if (typeof a === 'number')
        return a + ((typeof b === 'number' ? b : a) - a) * f;
    if (Array.isArray(a))
        return a.map((x, i) => mix(x, Array.isArray(b) ? b[i] : x, f));
    if (a && typeof a === 'object') {
        const o = {};
        for (const k of Object.keys(a))
            o[k] = k === 'c' ? a.c : mix(a[k], b && b[k] != null ? b[k] : a[k], f);
        return o;
    }
    return a;
}
// a point along the cubic from A to B with handles A + to and B + ti, at the share f of its length
function along(A, B, to, ti, f) {
    const P = s => [0, 1].map(d => {
        const a = A[d], b = B[d], c1 = a + (to[d] || 0), c2 = b + (ti[d] || 0);
        return (1 - s) ** 3 * a + 3 * (1 - s) ** 2 * s * c1 + 3 * (1 - s) * s * s * c2 + s ** 3 * b;
    });
    const M = 48, L = [0];
    let prev = P(0);
    for (let k = 1; k <= M; k++) {
        const q = P(k / M);
        L.push(L[k - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1]));
        prev = q;
    }
    const want = f * L[M];
    let k = 1;
    while (k < M && L[k] < want)
        k++;
    const s = (k - 1 + (want - L[k - 1]) / Math.max(1e-12, L[k] - L[k - 1])) / M;
    const q = P(Math.max(0, Math.min(1, s)));
    return A.length > 2 ? q.concat(A.slice(2).map((v, i) => v + ((B[i + 2] != null ? B[i + 2] : v) - v) * f)) : q;
}
function value(P, f, dflt) {
    if (!P)
        return dflt;
    if (!isKeyed(P))
        return P.k !== undefined ? P.k : dflt;
    const K = P.k;
    if (f <= K[0].t)
        return K[0].s !== undefined ? unwrap(K[0].s) : dflt;
    let j = 0;
    while (j + 1 < K.length && K[j + 1].t <= f)
        j++;
    const A = K[j];
    if (j === K.length - 1) // the last key: its start, or the end of the key before it (older files)
        return unwrap(A.s !== undefined ? A.s : (K[j - 1] && K[j - 1].e !== undefined ? K[j - 1].e : dflt));
    const B = K[j + 1],
        a = unwrap(A.s),
        b = unwrap(A.e !== undefined ? A.e : B.s);
    if (A.h === 1 || b === undefined)
        return a;
    const u = (f - A.t) / Math.max(1e-9, B.t - A.t),
        o = A.o || { x: 0, y: 0 },
        i = A.i || { x: 1, y: 1 };
    // an ease per dimension when Lottie gives one (x and y apart), else one for all
    const per = Array.isArray(o.x) && o.x.length > 1 && Array.isArray(a);
    if (per)
        return a.map((v, d) => {
            const e = ease(o.x[Math.min(d, o.x.length - 1)], o.y[Math.min(d, o.y.length - 1)], i.x[Math.min(d, i.x.length - 1)], i.y[Math.min(d, i.y.length - 1)], u);
            return v + (b[d] - v) * e;
        });
    const e = ease(first(o.x), first(o.y), first(i.x), first(i.y), u);
    if (A.to && A.ti && Array.isArray(a) && (A.to.some(v => v) || A.ti.some(v => v)))
        return along(a, b, A.to, A.ti, e); // a position's own curve between its keys, at an even speed along it
    return mix(a, b, e);
}
// a shape key's value is a list of one shape
const unwrap = v => Array.isArray(v) && v.length === 1 && v[0] && typeof v[0] === 'object' && 'v' in v[0] ? v[0] : v;

// ── affine maps [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f (Lottie's frame: y down) ──
const I = [1, 0, 0, 1, 0, 0];
const mul = (M, N) => [M[0] * N[0] + M[2] * N[1], M[1] * N[0] + M[3] * N[1], M[0] * N[2] + M[2] * N[3], M[1] * N[2] + M[3] * N[3], M[0] * N[4] + M[2] * N[5] + M[4], M[1] * N[4] + M[3] * N[5] + M[5]];
const app = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
// a transform at a frame: anchor, position (or x and y apart), scale in %, rotation in degrees (clockwise on the
// screen), skew (reported), and its opacity 0–1
function transformAt(T, f, note) {
    if (!T)
        return { M: I, o: 1 };
    const a = value(T.a, f, [0, 0]),
        s = value(T.s, f, [100, 100]),
        r = +(T.r ? value(T.r, f, 0) : (T.rz ? value(T.rz, f, 0) : 0)) || 0,
        o = T.o ? +value(T.o, f, 100) / 100 : 1;
    let p;
    if (T.p && T.p.s)
        p = [+value(T.p.x, f, 0), +value(T.p.y, f, 0)];
    else
        p = value(T.p, f, [0, 0]);
    if (T.sk && (isKeyed(T.sk) || +first(T.sk.k)))
        note('skew');
    const rad = r * Math.PI / 180,
        cs = Math.cos(rad),
        sn = Math.sin(rad),
        sx = (+s[0] || 0) / 100,
        sy = (+s[1] || 0) / 100;
    // translate(p) · rotate(r) · scale(s) · translate(−a)
    const M = [cs * sx, sn * sx, -sn * sy, cs * sy, 0, 0];
    const ax = +a[0] || 0, ay = +a[1] || 0;
    M[4] = (+p[0] || 0) - (M[0] * ax + M[2] * ay);
    M[5] = (+p[1] || 0) - (M[1] * ax + M[3] * ay);
    return { M, o: Math.max(0, Math.min(1, o)) };
}

// ── shapes at a frame: a list of paths { v: [[x, y]], i, o, c } in their layer's frame ──
const KAPPA = 0.5522847498;
function ellipsePath(S, f) {
    const p = value(S.p, f, [0, 0]), s = value(S.s, f, [0, 0]),
        w = s[0] / 2, h = s[1] / 2, kx = w * KAPPA, ky = h * KAPPA, cx = p[0], cy = p[1];
    const v = [[cx, cy - h], [cx + w, cy], [cx, cy + h], [cx - w, cy]];
    const i = [[-kx, 0], [0, -ky], [kx, 0], [0, ky]],
        o = [[kx, 0], [0, ky], [-kx, 0], [0, -ky]];
    return { v, i, o, c: true };
}
function rectPath(S, f) {
    const p = value(S.p, f, [0, 0]), s = value(S.s, f, [0, 0]),
        w = s[0] / 2, h = s[1] / 2, cx = p[0], cy = p[1],
        rr = Math.max(0, Math.min(+value(S.r, f, 0) || 0, w, h));
    const v = [[cx + w, cy - h], [cx + w, cy + h], [cx - w, cy + h], [cx - w, cy - h]],
        z = [[0, 0], [0, 0], [0, 0], [0, 0]];
    return { v, i: z, o: z.map(q => q.slice()), c: true, round: rr }; // its roundness: the morph's own corner radius
}
function starPath(S, f) {
    const p = value(S.p, f, [0, 0]),
        n = Math.max(3, Math.round(+value(S.pt, f, 5) || 5)),
        rot = (+value(S.r, f, 0) || 0) * Math.PI / 180,
        or = +value(S.or, f, 10) || 10,
        ir = S.sy === 1 ? +value(S.ir, f, 5) || 5 : null,
        v = [];
    const m = ir == null ? n : 2 * n;
    for (let k = 0; k < m; k++) {
        const R = ir == null || k % 2 === 0 ? or : ir,
            a = rot - Math.PI / 2 + k * 2 * Math.PI / m;
        v.push([p[0] + R * Math.cos(a), p[1] + R * Math.sin(a)]);
    }
    const z = v.map(() => [0, 0]);
    return { v, i: z, o: z.map(q => q.slice()), c: true };
}

// ── the whole drawing at a frame: what each layer draws, back to front ──
// An op is one path drawn with one style: { key, path (in the page: x right, y up), fill | stroke, alpha }.
// key names it the same way at every frame (the layer, the place in its groups, the path), so one op over all
// frames is one morph.
function drawingAt(L, f, note) {
    const ops = [];
    const byInd = layers => {
        const m = new Map();
        for (const l of layers)
            if (l.ind != null)
                m.set(l.ind, l);
        return m;
    };
    const assets = new Map((L.assets || []).map(a => [a.id, a]));
    // a layer's own map at frame f, its parents' before it (opacity is not passed down by parenting)
    const chain = (l, inds, f, depth) => {
        const t = transformAt(l.ks, f, note);
        if (l.parent != null && inds.has(l.parent) && depth < 32)
            return mul(chain(inds.get(l.parent), inds, f, depth + 1), t.M);
        return t.M;
    };
    function comp(layers, f, M0, a0, prefix, depth) {
        const inds = byInd(layers);
        for (let li = layers.length - 1; li >= 0; li--) { // the last layer is the one at the back
            const l = layers[li];
            if (l.hd || l.td) { // hidden, or a matte's source (mattes are not drawn)
                if (l.td)
                    note('matte');
                continue;
            }
            const ip = l.ip != null ? l.ip : -Infinity,
                op = l.op != null ? l.op : Infinity;
            if (!(f >= ip && f < op))
                continue;
            if (l.ddd)
                note('3D layer');
            if (l.hasMask || (l.masksProperties && l.masksProperties.length))
                note('mask');
            if (l.tt)
                note('matte');
            if (l.ef && l.ef.length)
                note('effect');
            if (l.bm)
                note('blend mode');
            const M = mul(M0, chain(l, inds, f, 0)),
                a = a0 * transformAt(l.ks, f, () => {}).o,
                key = prefix + '/' + li;
            if (l.ty === 4)
                shapes(l.shapes || [], M, a, f, key);
            else if (l.ty === 1) { // a solid: a rectangle of its colour
                const w = +l.sw || 0, h = +l.sh || 0;
                if (w > 0 && h > 0)
                    emit(key + '/s', { v: [[0, 0], [w, 0], [w, h], [0, h]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], c: true }, M, { fill: hexRgb(l.sc || '#000000'), a });
            } else if (l.ty === 0) { // a precomposition: its layers in its own time
                const A = assets.get(l.refId);
                if (!A || !A.layers || depth > 12)
                    continue;
                let fi = (f - (l.st || 0)) / (l.sr || 1);
                if (l.tm) {
                    fi = +value(l.tm, f, 0) * (L.fr || 30);
                    note('time remap');
                }
                comp(A.layers, fi, M, a, key, depth + 1);
            } else if (l.ty === 5)
                note('text');
            else if (l.ty === 2)
                note('image');
        }
    }
    // a group's items: the paths above each fill or stroke are drawn with it, from the bottom of the list up
    function shapes(items, M, a, f, key) {
        const T = items.find(s => s.ty === 'tr'),
            G = T ? transformAt(T, f, note) : { M: I, o: 1 },
            MG = mul(M, G.M),
            aG = a * G.o,
            round = items.filter(s => s.ty === 'rd' && !s.hd).reduce((r, s) => Math.max(r, +value(s.r, f, 0) || 0), 0);
        for (let k = items.length - 1; k >= 0; k--) {
            const s = items[k];
            if (s.hd)
                continue;
            if (s.ty === 'gr')
                shapes(s.it || [], MG, aG, f, key + '/' + k);
            else if (s.ty === 'fl' || s.ty === 'gf' || s.ty === 'st' || s.ty === 'gs') {
                const grad = s.ty === 'gf' || s.ty === 'gs';
                if (grad)
                    note('gradient');
                const col = grad ? gradMiddle(s, f) : colour(value(s.c, f, [0, 0, 0, 1])),
                    op = (+value(s.o, f, 100) || 0) / 100,
                    style = { a: aG * op * (col[3] != null ? +col[3] : 1), rgb: [col[0], col[1], col[2]] };
                if (s.ty === 'st' || s.ty === 'gs') {
                    style.stroke = style.rgb;
                    style.w = +value(s.w, f, 1) || 0;
                } else
                    style.fill = style.rgb;
                const paths = [];
                collect(items.slice(0, k), MG, f, key + '/' + k, paths, round);
                paths.forEach((P, n) => emit(key + '/' + k + '/' + n, P.p, P.M, style, P.round));
            } else if (s.ty === 'tm')
                note('trim paths');
            else if (s.ty === 'rp')
                note('repeater');
            else if (s.ty === 'mm')
                note('merge paths');
        }
    }
    // every path among items (and in the groups among them), each with the map it is drawn through
    function collect(items, M, f, key, out, round) {
        for (let k = 0; k < items.length; k++) {
            const s = items[k];
            if (s.hd)
                continue;
            let p = null;
            if (s.ty === 'sh') {
                p = value(s.ks, f, null);
                if (s.ks && s.ks.x)
                    note('expression');
            } else if (s.ty === 'el')
                p = ellipsePath(s, f);
            else if (s.ty === 'rc')
                p = rectPath(s, f);
            else if (s.ty === 'sr')
                p = starPath(s, f);
            else if (s.ty === 'gr') {
                const T = (s.it || []).find(q => q.ty === 'tr'),
                    G = T ? transformAt(T, f, note) : { M: I, o: 1 },
                    rd = (s.it || []).filter(q => q.ty === 'rd' && !q.hd).reduce((r, q) => Math.max(r, +value(q.r, f, 0) || 0), round);
                collect(s.it || [], mul(M, G.M), f, key + '/' + k, out, rd);
            }
            if (p && p.v && p.v.length >= 2)
                out.push({ p, M, round: p.round != null ? p.round : round });
        }
    }
    function emit(key, p, M, style, round) {
        const n = p.v.length,
            S = Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])), // the map's size, for a stroke's width and a rounding
            X = [], Y = [], C = [], R = [];
        const pt = (x, y) => {
            const q = app(M, x, y);
            return [q[0], -q[1]]; // the page's y is up
        };
        for (let k = 0; k < n; k++) {
            const q = pt(p.v[k][0], p.v[k][1]);
            X.push(q[0]);
            Y.push(q[1]);
        }
        const closed = p.c !== false;
        let flat = true;
        for (let k = 0; k < n; k++) {
            const j = (k + 1) % n;
            if (!closed && k === n - 1) {
                C.push(null);
                break;
            }
            const o = p.o && p.o[k] ? p.o[k] : [0, 0],
                i = p.i && p.i[j] ? p.i[j] : [0, 0];
            if (Math.abs(o[0]) + Math.abs(o[1]) + Math.abs(i[0]) + Math.abs(i[1]) < 1e-9)
                C.push(null);
            else {
                const a = pt(p.v[k][0] + o[0], p.v[k][1] + o[1]),
                    b = pt(p.v[j][0] + i[0], p.v[j][1] + i[1]);
                C.push([a[0], a[1], b[0], b[1]]);
                flat = false;
            }
        }
        for (let k = 0; k < n; k++)
            R.push(round > 0 ? round * S : 0);
        // the map and the outline in its own coordinates, so a path that only moves can be told apart (ONE SHAPE, MOVED)
        const sig = JSON.stringify([p.v, p.i, p.o, closed, round, style.w || 0].map(q => Array.isArray(q) ? q.map(e => Array.isArray(e) ? e.map(r6) : e) : q));
        ops.push({ key, x: X, y: Y, c: C, r: R, open: !closed, flat, fill: style.fill || null, stroke: style.stroke || null, w: (style.w || 0) * S, a: style.a, M: M.slice(), sig });
    }
    // colours in 0–1, as files from Bodymovin 4.1.9 on write them; older ones wrote 0–255 (lottie-web converts them too)
    const old = (() => {
        const v = String(L.v || '0').split('.').map(Number);
        return v[0] < 4 || (v[0] === 4 && (v[1] < 1 || (v[1] === 1 && (v[2] || 0) < 9)));
    })();
    const colour = c => old && Array.isArray(c) ? c.map(v => v / 255) : c;
    comp(L.layers || [], f, I, 1, '', 0);
    return ops;
}
const hexRgb = h => {
    const m = /^#?([0-9a-f]{6})/i.exec(h || '');
    const v = m ? parseInt(m[1], 16) : 0;
    return [(v >> 16) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255, 1];
};
// a gradient's colour at its middle stop, as a stand-in
function gradMiddle(s, f) {
    const g = s.g || {},
        n = +g.p || 0,
        k = value(g.k, f, []);
    if (!n || !Array.isArray(k) || k.length < 4 * n)
        return [0.5, 0.5, 0.5, 1];
    const m = Math.floor((n - 1) / 2) * 4;
    return [k[m + 1], k[m + 2], k[m + 3], 1];
}

// ── frames to keys: Douglas–Peucker in time, each stretch straight or eased ──
// (29 Oct 2026, Tom: "Yes", to keeping Lottie's own eases.) A stretch between two kept frames is first tried as a
// straight blend; failing that, as a blend along a cubic Bézier ease fitted to the frames between (Lottie's own
// keyframes are mostly such eases, so a stretch Lottie keyed once comes back as one stretch, not a frame every few);
// failing both, it is split at its worst frame. `vec(k)` is frame k's numbers, `err(k, v)` how far numbers v are
// from frame k in tolerances (1 is at the limit), `wt` how much each number moves the drawing, for fitting.
function keyframes(n, vec, err, wt) {
    if (n <= 2)
        return { keep: n === 1 ? [0] : [0, 1], eases: n === 2 ? [''] : [] };
    const V = [];
    for (let k = 0; k < n; k++)
        V.push(vec(k));
    const D = V[0].length,
        lerp = (A, B, s) => { const o = new Float64Array(D); for (let d = 0; d < D; d++) o[d] = A[d] + (B[d] - A[d]) * s; return o; };
    function worst(a, b, ease) {
        let w = 0, at = -1;
        for (let k = a + 1; k < b; k++) {
            const u = (k - a) / (b - a),
                e = err(k, lerp(V[a], V[b], ease ? bez(u, ease) : u));
            if (e > w) { w = e; at = k; }
        }
        return { w, at };
    }
    function fit(a, b) { // the ease through the frames between, as how far along each one is
        let dd = 0;
        for (let d = 0; d < D; d++) dd += wt[d] * wt[d] * (V[b][d] - V[a][d]) ** 2;
        if (!(dd > 1e-18))
            return null;
        const U = [], Sv = [],
            step = Math.max(1, Math.floor((b - a - 1) / 24)); // fitted on two dozen frames at most: every frame is checked after
        for (let k = a + 1; k < b; k += step) {
            let p = 0;
            for (let d = 0; d < D; d++) p += wt[d] * wt[d] * (V[k][d] - V[a][d]) * (V[b][d] - V[a][d]);
            U.push((k - a) / (b - a));
            Sv.push(p / dd);
        }
        return fitBezier(U, Sv);
    }
    const keep = new Uint8Array(n), easeAt = new Map();
    keep[0] = keep[n - 1] = 1;
    const stack = [[0, n - 1]];
    while (stack.length) {
        const [a, b] = stack.pop();
        if (b - a < 2) {
            easeAt.set(a, '');
            continue;
        }
        const lin = worst(a, b, null);
        if (lin.w <= 1) {
            easeAt.set(a, '');
            continue;
        }
        const q = b - a >= 3 ? fit(a, b) : null,
            bz = q ? worst(a, b, q) : null;
        if (bz && bz.w <= 1) {
            easeAt.set(a, q);
            continue;
        }
        const at = bz && bz.w < lin.w ? bz.at : lin.at;
        keep[at] = 1;
        stack.push([a, at], [at, b]);
    }
    const out = [];
    for (let i = 0; i < n; i++)
        if (keep[i])
            out.push(i);
    return { keep: out, eases: out.slice(0, -1).map(i => easeAt.get(i) || '') };
}
// a cubic Bézier ease from (0, 0) to (1, 1) with handles (x1, y1), (x2, y2), as CSS's cubic-bezier(): the morph
// engine's own (morphBezierEase), written again here so this file stands alone
function bez(u, q) {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    const B = (s, a, b) => 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
    let lo = 0, hi = 1, s = u;
    for (let i = 0; i < 40; i++) {
        s = (lo + hi) / 2;
        if (B(s, q[0], q[2]) < u) lo = s; else hi = s;
    }
    return B(s, q[1], q[3]);
}
// handles for points (u, s): x1 and x2 on a grid and then a finer one about the best, y1 and y2 by least squares
function fitBezier(U, Sv) {
    const solveTau = (u, x1, x2) => { // Newton's way from t = u, halving where the slope is too flat to trust
        let t = u;
        for (let i = 0; i < 6; i++) {
            const x = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t - u,
                dx = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
            if (Math.abs(x) < 1e-7)
                return t;
            if (Math.abs(dx) < 1e-6)
                break;
            t = Math.max(0, Math.min(1, t - x / dx));
        }
        let lo = 0, hi = 1;
        for (let i = 0; i < 30; i++) {
            t = (lo + hi) / 2;
            const x = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
            if (x < u) lo = t; else hi = t;
        }
        return t;
    };
    let best = null;
    const tryXs = (x1, x2) => {
        let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0;
        const T = U.map(u => solveTau(u, x1, x2));
        for (let i = 0; i < U.length; i++) {
            const t = T[i], p = 3 * (1 - t) * (1 - t) * t, q = 3 * (1 - t) * t * t, r = Sv[i] - t * t * t;
            a11 += p * p; a12 += p * q; a22 += q * q; b1 += p * r; b2 += q * r;
        }
        const det = a11 * a22 - a12 * a12;
        let y1, y2;
        if (Math.abs(det) > 1e-12) {
            y1 = (b1 * a22 - b2 * a12) / det;
            y2 = (a11 * b2 - a12 * b1) / det;
        } else
            y1 = y2 = 0.5;
        y1 = Math.max(-1, Math.min(2, y1));
        y2 = Math.max(-1, Math.min(2, y2));
        let e = 0;
        for (let i = 0; i < U.length; i++) {
            const t = T[i], v = 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
            e += (v - Sv[i]) ** 2;
        }
        if (!best || e < best.e)
            best = { e, q: [x1, y1, x2, y2] };
    };
    for (let i = 0; i <= 10; i++)
        for (let j = 0; j <= 10; j++)
            tryXs(i / 10, j / 10);
    const [c1, , c2] = best.q;
    for (let i = -2; i <= 2; i++)
        for (let j = -2; j <= 2; j++) {
            const x1 = c1 + i / 40, x2 = c2 + j / 40;
            if (x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)
                tryXs(x1, x2);
        }
    return best.q.map(v => Math.round(v * 1000) / 1000);
}
// a 2×2 map with a move, [a, b, c, d, e, f] as x' = a·x + c·y + e, y' = b·x + d·y + f, as [tx, ty, θ, sx, sh, sy]:
// a turn of θ times [[sx, sh], [0, sy]] (the QR split), θ kept near `near` so a turn unwinds rather than jumps
function partsOf(M, near) {
    const sx = Math.hypot(M[0], M[1]);
    let th = sx > 1e-12 ? Math.atan2(M[1], M[0]) : (near || 0);
    if (near != null)
        th += Math.round((near - th) / (2 * Math.PI)) * 2 * Math.PI;
    const cs = Math.cos(th), sn = Math.sin(th);
    return [M[4], M[5], th, sx, cs * M[2] + sn * M[3], -sn * M[2] + cs * M[3]];
}
function matOf(q) {
    const [tx, ty, th, sx, sh, sy] = q, cs = Math.cos(th), sn = Math.sin(th);
    return [cs * sx, sn * sx, cs * sh - sn * sy, sn * sh + cs * sy, tx, ty];
}
// A·B⁻¹ for maps given as Lottie's y-down affines, turned into the page's y-up frame (y → −y on both sides)
function relOf(A, B) {
    const flip = m => [m[0], -m[1], -m[2], m[3], m[4], -m[5]],
        a = flip(A), b = flip(B),
        det = b[0] * b[3] - b[1] * b[2];
    if (Math.abs(det) < 1e-12)
        return null;
    const bi = [b[3] / det, -b[1] / det, -b[2] / det, b[0] / det, (b[2] * b[5] - b[3] * b[4]) / det, (b[1] * b[4] - b[0] * b[5]) / det];
    return [a[0] * bi[0] + a[2] * bi[1], a[1] * bi[0] + a[3] * bi[1], a[0] * bi[2] + a[2] * bi[3], a[1] * bi[2] + a[3] * bi[3],
        a[0] * bi[4] + a[2] * bi[5] + a[4], a[1] * bi[4] + a[3] * bi[5] + a[5]];
}
const toLin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const hexOf = rgb => '#' + rgb.slice(0, 3).map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');

function isLottie(d) {
    return !!d && typeof d === 'object' && Array.isArray(d.layers) && d.op != null && d.ip != null && d.w != null && d.h != null;
}
function toScene(L, opts) {
    opts = opts || {};
    if (!isLottie(L))
        throw new Error('not a Lottie animation');
    const tol = opts.tol != null ? +opts.tol : 0.2,
        ctol = 0.004,
        ip = Math.round(+L.ip || 0),
        op = Math.max(ip + 1, Math.round(+L.op)),
        N = op - ip,
        fr = +L.fr || 30;
    const notes = {};
    const note = k => { notes[k] = (notes[k] || 0) + 1; };
    // every op's numbers at every frame it is drawn
    const tracks = new Map(), order = [];
    for (let f = ip; f < op; f++) {
        const ops = drawingAt(L, f, f === ip ? note : () => {});
        ops.forEach((o, z) => {
            let T = tracks.get(o.key);
            if (!T) {
                T = { key: o.key, frames: [], n: o.x.length, open: o.open, z: [] };
                tracks.set(o.key, T);
                order.push(o.key);
            }
            if (o.x.length !== T.n) { // a path whose vertex count changes cannot be one morph: its first count is kept
                note('vertex count change');
                return;
            }
            T.z.push(z);
            const g = [];
            for (let k = 0; k < o.x.length; k++)
                g.push(o.x[k], o.y[k], o.r[k]);
            for (let k = 0; k < o.c.length; k++) {
                const e = o.c[k] || [o.x[k], o.y[k], o.x[(k + 1) % o.x.length], o.y[(k + 1) % o.x.length]];
                g.push(e[0], e[1], e[2], e[3]);
            }
            T.frames.push({ f, o, g, col: [...(o.fill || o.stroke).map(toLin), o.a] });
        });
    }
    // drawing order: by where each op stands on average among the ops of its frames, back to front
    const pos = new Map(order.map(k => {
        const T = tracks.get(k);
        return [k, T.z.reduce((a, b) => a + b, 0) / Math.max(1, T.z.length)];
    }));
    order.sort((a, b) => pos.get(a) - pos.get(b));
    const items = [], morphs = [];
    let keysAll = 0, stills = 0, xforms = 0;
    for (const key of order) {
        const T = tracks.get(key);
        if (!T.frames.length)
            continue;
        // the frames it is drawn in, as runs (a layer that comes and goes is a morph a run)
        const runs = [];
        let cur = [];
        for (const fr0 of T.frames) {
            if (cur.length && fr0.f !== cur[cur.length - 1].f + 1) {
                runs.push(cur);
                cur = [];
            }
            cur.push(fr0);
        }
        if (cur.length)
            runs.push(cur);
        for (const R of runs) {
            const o0 = R[0].o,
                whole = R.length === N,
                style = {
                    fill: o0.fill ? { color: hexOf(o0.fill), opacity: r3(o0.a) } : null,
                    stroke: o0.stroke ? hexOf(o0.stroke) : null,
                    width: o0.stroke ? r3(o0.w) : 0,
                    strokeOpacity: o0.stroke ? r3(o0.a) : 1,
                    widthUnit: 'page' // a Lottie stroke's width is in the composition's units, so it scales with the drawing
                };
            const keyOf = q => ({ x: q.o.x.map(r2), y: q.o.y.map(r2), r: q.o.r.map(r2), c: q.o.c.map(e => e ? e.map(r2) : null) });
            if (whole && staticRun(R, tol, ctol)) { // drawn the whole time and never changing: a still
                const k = keyOf(R[0]);
                items.push(Object.assign({ exact: { x: k.x, y: k.y, r: k.r.some(v => v > 0) ? k.r : null, smooth: null, ctrl: k.c.some(Boolean) ? k.c : null, holes: [] }, open: T.open }, style, o0.fill ? {} : { fill: null }));
                stills++;
                continue;
            }
            const span = whole ? N : R.length,
                f0 = whole ? ip : R[0].f,
                tOf = i => Math.round((R[i].f - f0) / span * 1e6) / 1e6,
                colVar = R.some(q => q.col.some((v, d) => Math.abs(v - R[0].col[d]) > ctol)),
                own = { straight: true };
            if (!whole) { // a layer that is not there the whole time: a clip, cut in and out
                const start = (R[0].f - ip) / N,
                    len = Math.min(1 - start, R.length / N);
                own.clip = { start: Math.round(start * 1e6) / 1e6, len: Math.round(len * 1e6) / 1e6, show: '', in: { kind: 'cut', len: 0 }, out: { kind: 'cut', len: 0 } };
            }
            // ONE SHAPE, MOVED (29 Oct 2026, Tom: "Yes", to making these scenes smaller): an outline that never changes in
            // its own coordinates, only its map, is one key (at the frame where the map is largest) and the map's parts
            // by frame, read from Lottie's own matrices, not fitted
            let ref = -1, refDet = 0;
            if (opts.xform !== false && R.length > 1 && R.every(q => q.o.sig === o0.sig))
                R.forEach((q, i) => {
                    const d = Math.abs(q.o.M[0] * q.o.M[3] - q.o.M[1] * q.o.M[2]);
                    if (d > refDet + 1e-12) {
                        refDet = d;
                        ref = i;
                    }
                });
            if (ref >= 0 && refDet > 1e-9) {
                const key = keyOf(R[ref]),
                    P = []; // the points the map moves: corners and handles, to measure a blend in pixels
                for (let i = 0; i < key.x.length; i++) {
                    P.push(R[ref].o.x[i], R[ref].o.y[i]);
                    const e = R[ref].o.c[i];
                    if (e)
                        P.push(e[0], e[1], e[2], e[3]);
                }
                let cx = 0, cy = 0;
                for (let i = 0; i < P.length; i += 2) { cx += P[i]; cy += P[i + 1]; }
                cx /= P.length / 2;
                cy /= P.length / 2;
                let rho = 1e-6;
                for (let i = 0; i < P.length; i += 2)
                    rho = Math.max(rho, Math.hypot(P[i] - cx, P[i + 1] - cy));
                const Q = [];
                let near = null;
                for (const q of R) {
                    const part = partsOf(relOf(q.o.M, R[ref].o.M), near);
                    near = part[2];
                    Q.push(part);
                }
                const truth = R.map((q, k) => { const m = matOf(Q[k]); return m; });
                const err = (k, v) => {
                    const m = matOf(v), t = truth[k];
                    let e = 0;
                    for (let i = 0; i < P.length; i += 2) {
                        const x = P[i], y = P[i + 1];
                        e = Math.max(e, Math.hypot(m[0] * x + m[2] * y + m[4] - (t[0] * x + t[2] * y + t[4]), m[1] * x + m[3] * y + m[5] - (t[1] * x + t[3] * y + t[5])));
                    }
                    e /= tol;
                    for (let d = 0; d < 4; d++)
                        e = Math.max(e, Math.abs(v[6 + d] - R[k].col[d]) / ctol);
                    if (o0.stroke) // a line keeps its width only as the map's size: a stroke keyed apart from the map is not this
                        e = Math.max(e, Math.abs(Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) * R[ref].o.w - R[k].o.w) / tol);
                    return e;
                };
                const stroked = !o0.stroke || R.every((q, k) => { const m = truth[k]; return Math.abs(Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) * R[ref].o.w - q.o.w) <= tol && Math.abs(q.o.a - o0.a) <= ctol && q.o.stroke.every((v, i) => Math.abs(v - o0.stroke[i]) <= ctol); });
                if (stroked) {
                    const wt = [1 / tol, 1 / tol, rho / tol, rho / tol, rho / tol, rho / tol, 1 / ctol, 1 / ctol, 1 / ctol, 1 / ctol];
                    const K = keyframes(R.length, k => Float64Array.from([...Q[k], ...R[k].col]), err, wt);
                    const xform = {
                        t: K.keep.map(tOf),
                        v: K.keep.map(i => [r2(Q[i][0]), r2(Q[i][1]), r6(Q[i][2]), r6(Q[i][3]), r6(Q[i][4]), r6(Q[i][5])])
                    };
                    if (K.eases.some(Boolean))
                        xform.e = K.eases.map(e => e || null);
                    if (colVar)
                        xform.c = K.keep.map(i => R[i].col.map(r3));
                    if (o0.fill) // its colour where its key is; `c` carries it where it changes
                        style.fill = { color: hexOf(R[ref].o.fill), opacity: r3(R[ref].o.a) };
                    style.width = o0.stroke ? r3(R[ref].o.w) : 0;
                    items.push({ morph: morphs.length });
                    morphs.push(Object.assign({ exact: true, open: T.open, holes: null, keys: [key], inPlace: true, lag: 0, fx: null, own, xform }, style));
                    keysAll += 1;
                    xforms++;
                    continue;
                }
            }
            if (o0.stroke && R.some(q => Math.abs(q.o.w - o0.w) > 1e-3 || Math.abs(q.o.a - o0.a) > 1e-3 || q.o.stroke.some((v, i) => Math.abs(v - o0.stroke[i]) > 1e-3)))
                note('stroke keyed over time');
            // any other path: its frames as keys, each stretch straight or eased
            const K = keyframes(R.length, k => Float64Array.from([...R[k].g, ...R[k].col]), (k, v) => {
                const g = R[k].g, c = R[k].col;
                let e = 0;
                for (let d = 0; d < g.length; d++)
                    e = Math.max(e, Math.abs(v[d] - g[d]));
                e /= tol;
                for (let d = 0; d < c.length; d++)
                    e = Math.max(e, Math.abs(v[g.length + d] - c[d]) / ctol);
                return e;
            }, [...R[0].g.map(() => 1 / tol), ...R[0].col.map(() => 1 / ctol)]);
            const ks = K.keep,
                keys = ks.map(i => keyOf(R[i]));
            const times = ks.map(tOf),
                kIdx = ks.slice(),
                eases = K.eases.map(e => e || null);
            if (keys.length > 2) { // the last pose held to the end of its window, not blended back to the first
                if (times[times.length - 1] < 0.9998) {
                    keys.push(keys[keys.length - 1]);
                    kIdx.push(kIdx[kIdx.length - 1]);
                    times.push(0.9999);
                    eases.push(null);
                }
                eases.push(null); // the stretch from the last key round to the first, never played
            } else if (keys.length === 2)
                times[1] = Math.min(1, times[1]);
            if (keys.length > 1)
                own.times = times;
            if (keys.length > 1 && eases.some(Boolean))
                own.eases = eases;
            const cols = kIdx.map(i => R[i].col);
            if (cols.some(c => c.some((v, d) => Math.abs(v - cols[0][d]) > ctol)))
                own.cols = cols.map(c => ({ r: r3(c[0]), g: r3(c[1]), b: r3(c[2]), a: r3(c[3]) }));
            items.push({ morph: morphs.length });
            morphs.push(Object.assign({ exact: true, open: T.open, holes: null, keys, inPlace: true, lag: 0, fx: null, own }, style));
            keysAll += keys.length;
        }
    }
    const scene = {
        format: 'tvf-scene',
        v: xforms ? 2 : 1, // version 2 when a morph carries xform (papers/tvf.md §2.10)
        name: opts.name || L.nm || 'lottie',
        loop: N / fr,
        ease: '',
        hold: 0,
        gravity: 1,
        wind: 0,
        trail: null,
        camera: [{ t: 0, box: [0, -(+L.h), +L.w, 0] }], // the composition's frame, its y turned up
        stops: [],
        beats: null,
        path: null,
        items,
        morphs,
        from: { lottie: L.v || '', w: +L.w, h: +L.h, fr, frames: N }
    };
    return { scene, report: { frames: N, fr, tracks: tracks.size, morphs: morphs.length, stills, keys: keysAll, moved: xforms, unsupported: notes } };
}
function same(A, B, tol, ctol) {
    for (let d = 0; d < A.g.length; d++)
        if (Math.abs(A.g[d] - B.g[d]) > tol)
            return false;
    for (let d = 0; d < A.col.length; d++)
        if (Math.abs(A.col[d] - B.col[d]) > ctol)
            return false;
    return true;
}
function staticRun(R, tol, ctol) {
    return R.every(q => same(R[0], q, tol, ctol));
}
const TVFLottie = { isLottie, toScene, value, drawingAt };
root.TVFLottie = TVFLottie;
if (typeof module !== 'undefined' && module.exports)
    module.exports = TVFLottie;
})(typeof window !== 'undefined' ? window : globalThis);
