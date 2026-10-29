// INTERACTIVE SCENES AND PHYSICS YOU CAN TOUCH, AS EXAMPLES (29 Oct 2026, Tom: "1,2,4")
// Writes player/interactive/*.tvfs and its index.json: small scenes built here from plain geometry (exact corners,
// rounded or with cubic edges) that use the scene's states and interact rules (papers/tvf.md §2.10), and copies of
// three gallery examples (the bouncing ball, the lantern, the jelly) whose morph can be taken in the hand. The
// editor does not write states, rules or touch yet, so these are written by hand, here.
//   node tools/write-interactive.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'),
    OUT = join(ROOT, 'player', 'interactive'),
    EX = join(ROOT, 'player', 'examples');
mkdirSync(OUT, { recursive: true });

const r6 = v => Math.round(v * 1e6) / 1e6;
// a colour in linear light, as a morph's own.cols holds it
const lin = (hex, a = 1) => {
    const v = parseInt(hex.slice(1), 16),
        f = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return { r: r6(f(v >> 16)), g: r6(f((v >> 8) & 255)), b: r6(f(v & 255)), a };
};
// a rectangle's key: corners from the top left round, each rounded by r, turned th about (px, py)
const rectKey = (x0, y0, x1, y1, r = 0, th = 0, px = (x0 + x1) / 2, py = (y0 + y1) / 2) => {
    const P = [[x0, y1], [x1, y1], [x1, y0], [x0, y0]].map(([x, y]) => {
        const c = Math.cos(th), s = Math.sin(th), dx = x - px, dy = y - py;
        return [px + c * dx - s * dy, py + s * dx + c * dy];
    });
    return { x: P.map(p => r6(p[0])), y: P.map(p => r6(p[1])), r: [r, r, r, r], c: [null, null, null, null] };
};
// a circle's key: four corners and four cubic edges
const circleKey = (cx, cy, R) => {
    const k = 0.5522847498 * R,
        P = [[cx, cy + R], [cx + R, cy], [cx, cy - R], [cx - R, cy]],
        T = [[1, 0], [0, -1], [-1, 0], [0, 1]]; // the way round at each corner
    const c = P.map((p, i) => {
        const q = P[(i + 1) % 4], tp = T[i], tq = T[(i + 1) % 4];
        return [p[0] + k * tp[0], p[1] + k * tp[1], q[0] - k * tq[0], q[1] - k * tq[1]].map(r6);
    });
    return { x: P.map(p => r6(p[0])), y: P.map(p => r6(p[1])), r: [0, 0, 0, 0], c };
};
// a corner shape's key from points (sharp, straight edges)
const polyKey = pts => ({ x: pts.map(p => r6(p[0])), y: pts.map(p => r6(p[1])), r: pts.map(() => 0), c: pts.map(() => null) });
// a morph: its keys, its colour and its own record (the clock, the colours per key)
const morph = (keys, fill, own = {}, extra = {}) => Object.assign({
    exact: true, open: false, holes: null, keys, fill: fill ? { color: fill, opacity: 1 } : null, stroke: null, width: 0,
    inPlace: true, lag: 0, fx: null, own
}, extra);
const still = (key, fill, extra = {}) => Object.assign({
    fill: fill ? { color: fill, opacity: 1 } : null, stroke: null, width: 0, open: false,
    exact: { x: key.x, y: key.y, r: key.r, smooth: null, ctrl: key.c.some(Boolean) ? key.c : null, holes: [] }
}, extra);
const scene = (name, o) => Object.assign({ format: 'tvf-scene', v: 1, name, loop: 1, ease: 'inout', hold: 0, gravity: 1, wind: 0, trail: null, camera: [], stops: [], beats: null, path: null }, o);

const S = {};

// THE MENU: three bars, a click and they are an ✕; again and they are bars
{
    const bar = (y, th, w = 1) => rectKey(-w, y - 0.14, w, y + 0.14, 0.14, th, 0, 0);
    S.menu = scene('a menu that closes', {
        loop: 0.9,
        states: { menu: 0, close: 1 },
        start: 'menu',
        interact: [{ on: 'click', toggle: ['menu', 'close'] }],
        camera: [{ t: 0, box: [-1.6, -1.6, 1.6, 1.6] }],
        items: [{ morph: 0 }, { morph: 1 }, { morph: 2 }],
        morphs: [
            morph([rectKey(-1, 0.56, 1, 0.84, 0.14), bar(0, Math.PI / 4)], '#2b3442'),
            morph([rectKey(-1, -0.14, 1, 0.14, 0.14), rectKey(-0.02, -0.14, 0.02, 0.14, 0.02)], '#2b3442', { cols: [lin('#2b3442'), lin('#2b3442', 0)] }),
            morph([rectKey(-1, -0.84, 1, -0.56, 0.14), bar(0, -Math.PI / 4)], '#2b3442')
        ]
    });
}

// PLAY AND PAUSE: the triangle's two halves become the two bars
{
    S['play-pause'] = scene('play and pause', {
        loop: 0.7,
        states: { play: 0, pause: 1 },
        start: 'play',
        interact: [{ on: 'click', toggle: ['play', 'pause'] }],
        camera: [{ t: 0, box: [-1.6, -1.6, 1.6, 1.6] }],
        items: [{ morph: 0 }, { morph: 1 }],
        morphs: [
            morph([polyKey([[-0.8, 1], [0.1, 0.5], [0.1, -0.5], [-0.8, -1]]), polyKey([[-0.8, 1], [-0.25, 1], [-0.25, -1], [-0.8, -1]])], '#e0507a'),
            morph([polyKey([[0.1, 0.5], [1, 0.0005], [1, -0.0005], [0.1, -0.5]]), polyKey([[0.25, 1], [0.8, 1], [0.8, -1], [0.25, -1]])], '#e0507a')
        ]
    });
}

// A SWITCH: the knob slides across and the track turns green
{
    const track = rectKey(-1.2, -0.55, 1.2, 0.55, 0.55);
    S.switch = scene('a switch', {
        loop: 0.6,
        states: { off: 0, on: 1 },
        start: 'off',
        interact: [{ on: 'click', toggle: ['off', 'on'] }],
        camera: [{ t: 0, box: [-1.6, -1.6, 1.6, 1.6] }],
        items: [{ morph: 0 }, { morph: 1 }],
        morphs: [
            morph([track, track], '#c9ced6', { cols: [lin('#c9ced6'), lin('#3fb57a')] }),
            morph([circleKey(-0.65, 0, 0.44), circleKey(0.65, 0, 0.44)], '#ffffff')
        ]
    });
}

// A BUTTON: pressed it sinks and its shadow tightens; let go it comes back
{
    S.button = scene('a button you press', {
        loop: 0.5,
        states: { up: 0, down: 1 },
        start: 'up',
        interact: [{ on: 'press', target: 1, to: 'down', back: 'up', speed: 1.6 }],
        camera: [{ t: 0, box: [-1.8, -1.4, 1.8, 1.4] }],
        items: [{ morph: 0 }, { morph: 1 }],
        morphs: [
            morph([rectKey(-1.12, -0.72, 1.12, 0.38, 0.3), rectKey(-1.05, -0.5, 1.05, 0.3, 0.28)], '#1d2330', { cols: [lin('#1d2330', 0.28), lin('#1d2330', 0.12)] }),
            morph([rectKey(-1.05, -0.38, 1.05, 0.52, 0.28), rectKey(-1.05, -0.48, 1.05, 0.42, 0.28)], '#d4a052', { cols: [lin('#e3b263'), lin('#c08a3c')] })
        ]
    });
}

// A CARD: the pointer over it and it lifts, its shadow spreading; off it and it settles
{
    S.card = scene('a card that lifts', {
        loop: 0.7,
        states: { rest: 0, lift: 1 },
        start: 'rest',
        interact: [{ on: 'hover', target: 1, to: 'lift', back: 'rest' }],
        camera: [{ t: 0, box: [-1.7, -1.7, 1.7, 1.7] }],
        items: [{ morph: 0 }, { morph: 1 }, { morph: 2 }],
        morphs: [
            morph([rectKey(-0.92, -1.12, 0.92, 1.02, 0.16), rectKey(-1.0, -1.28, 1.0, 1.0, 0.24)], '#1d2330', { cols: [lin('#1d2330', 0.22), lin('#1d2330', 0.12)] }),
            morph([rectKey(-0.9, -1.0, 0.9, 1.0, 0.14), rectKey(-0.9, -0.84, 0.9, 1.16, 0.14)], '#ffffff'),
            morph([rectKey(-0.7, 0.35, 0.7, 0.8, 0.08), rectKey(-0.7, 0.51, 0.7, 0.96, 0.08)], '#e0507a', { cols: [lin('#e0a0b4'), lin('#e0507a')] })
        ]
    });
}

// A LINE THE PAGE DRAWS: as the page scrolls past it, a wave is drawn on from its start
{
    const N = 16, X = [], Y = [], C = [];
    for (let i = 0; i <= N; i++) {
        X.push(r6(-1.5 + 3 * i / N));
        Y.push(r6(0.55 * Math.sin(i / N * 2 * Math.PI * 1.5)));
    }
    for (let i = 0; i < N; i++) { // a cubic per edge along the sine's own slope
        const h = 3 / N / 3,
            s0 = 0.55 * 2 * Math.PI * 1.5 / 3 * Math.cos(i / N * 2 * Math.PI * 1.5),
            s1 = 0.55 * 2 * Math.PI * 1.5 / 3 * Math.cos((i + 1) / N * 2 * Math.PI * 1.5);
        C.push([X[i] + h, Y[i] + s0 * h, X[i + 1] - h, Y[i + 1] - s1 * h].map(r6));
    }
    C.push(null);
    S['scroll-line'] = scene('a line the page draws', {
        loop: 2,
        ease: '',
        states: { start: 0 },
        start: 0,
        interact: [{ on: 'scroll', from: 0, to: 0.9999 }],
        camera: [{ t: 0, box: [-1.7, -1.1, 1.7, 1.1] }],
        items: [{ morph: 0 }],
        morphs: [morph([{ x: X, y: Y, r: X.map(() => 0), c: C }], null, { clip: { start: 0, len: 0.9999, show: '', in: { kind: 'draw', len: 0.9999 } } },
            { open: true, stroke: '#2f7fd6', width: 4 })]
    });
}

// THE TOUCH EXAMPLES: the gallery's ball, lantern and jelly, their morph made one you can take
for (const [file, name, note] of [
    ['bouncing-ball', 'throw the ball', 'take it and throw it: it flies under gravity, bounces off the floor and the sides, and goes home to its bounce'],
    ['lantern', 'swing the lantern', 'take it and pull it aside: let go and it swings back as a pendulum of its own length'],
    ['jelly', 'poke the jelly', 'take it and pull: let go and it springs back, overshooting, while it wobbles on']
]) {
    const d = JSON.parse(readFileSync(join(EX, file + '.tvfs'), 'utf8'));
    d.name = name;
    for (const m of d.morphs)
        m.touch = true;
    S['touch-' + file] = Object.assign(d, { _note: note });
}

// THE LOTTIE EXAMPLE: a small Lottie file written here (shape layers with eased keyframes: a ball's bounce and
// squash, a rounded square turning and changing colour, a path morphing from a triangle to a diamond, on a solid),
// kept as player/interactive/lottie-sample.json, and its scene as player/lottie.js makes it. Our own, so the
// gallery and the smoke test have a Lottie of known content with no one else's art in the repo.
const kf = (pairs, ease = 'inout') => {
    const E = { inout: [[0.42], [0.58]], in: [[0.42], [1]], out: [[0], [0.58]], linear: [[0], [1]] };
    return { a: 1, k: pairs.map(([t, v, e], i) => (v = Array.isArray(v) ? v : [v], i === pairs.length - 1) ? { t, s: v }
        : { t, s: v, o: { x: E[e || ease][0], y: [0] }, i: { x: E[e || ease][1], y: [1] } }) };
};
const st = v => ({ a: 0, k: v });
const xf = (o = {}) => ({ ty: 'tr', p: o.p || st([0, 0]), a: st([0, 0]), s: o.s || st([100, 100]), r: o.r || st(0), o: st(100) });
const layer = (ind, nm, ks, shapes) => ({ ddd: 0, ind, ty: 4, nm, sr: 1, ip: 0, op: 60, st: 0, ao: 0, bm: 0,
    ks: Object.assign({ o: st(100), r: st(0), p: st([0, 0, 0]), a: st([0, 0, 0]), s: st([100, 100, 100]) }, ks), shapes });
const tri = { i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[0, -48], [42, 30], [0, 30], [-42, 30]], c: true },
    dia = { i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], v: [[0, -46], [40, 0], [0, 46], [-40, 0]], c: true };
const LOTTIE = {
    v: '5.7.4', fr: 30, ip: 0, op: 60, w: 400, h: 300, nm: 'a small Lottie', ddd: 0, assets: [],
    layers: [
        layer(1, 'morph', { p: st([320, 150, 0]) }, [{ ty: 'gr', nm: 'shape', it: [
            { ty: 'sh', ks: kf([[0, [tri]], [30, [dia]], [60, [tri]]]) },
            { ty: 'fl', c: st([0.55, 0.42, 0.95, 1]), o: st(100), r: 1 },
            xf()] }]),
        layer(2, 'square', { p: st([205, 150, 0]), r: kf([[0, 0], [60, 90]]) }, [{ ty: 'gr', nm: 'square', it: [
            { ty: 'rc', d: 1, s: st([72, 72]), p: st([0, 0]), r: st(14) },
            { ty: 'fl', c: kf([[0, [0.2, 0.5, 0.9, 1]], [30, [0.25, 0.8, 0.45, 1]], [60, [0.2, 0.5, 0.9, 1]]]), o: st(100), r: 1 },
            xf()] }]),
        layer(3, 'ball', { p: kf([[0, [85, 70, 0], 'in'], [30, [85, 222, 0], 'out'], [60, [85, 70, 0]]]),
            s: kf([[0, [100, 100, 100]], [27, [94, 108, 100]], [30, [124, 78, 100]], [34, [100, 100, 100]], [60, [100, 100, 100]]]) },
            [{ ty: 'gr', nm: 'ball', it: [
                { ty: 'el', d: 1, s: st([56, 56]), p: st([0, 0]) },
                { ty: 'fl', c: st([0.98, 0.6, 0.25, 1]), o: st(100), r: 1 },
                { ty: 'st', c: st([1, 0.85, 0.6, 1]), o: st(100), w: st(3), lc: 2, lj: 2 },
                xf()] }]),
        { ddd: 0, ind: 4, ty: 1, nm: 'ground', sr: 1, ip: 0, op: 60, st: 0, ao: 0, bm: 0, sc: '#1b2333', sw: 400, sh: 300,
            ks: { o: st(100), r: st(0), p: st([200, 150, 0]), a: st([200, 150, 0]), s: st([100, 100, 100]) } }
    ]
};
writeFileSync(join(OUT, 'lottie-sample.json'), JSON.stringify(LOTTIE) + '\n');
(0, eval)(readFileSync(join(ROOT, 'player', 'lottie.js'), 'utf8')); // a classic script: TVFLottie on the global object
{
    const { scene } = globalThis.TVFLottie.toScene(LOTTIE, { name: 'from Lottie' });
    S['lottie-sample'] = Object.assign(scene, { _note: 'a Lottie file of four layers (lottie-sample.json), read by player/lottie.js: every frame drawn as exact paths and kept as keys where a straight blend cannot stand in' });
}

const NOTES = {
    menu: 'a click: three bars become an ✕, and again',
    'play-pause': 'a click: the triangle splits into the two bars',
    switch: 'a click: the knob slides and the track turns green',
    button: 'press and hold: it sinks; let go: it comes back',
    card: 'the pointer over it: it lifts; off it: it settles',
    'scroll-line': 'scroll the page: the line is drawn as the page passes it'
};
const index = [];
for (const [id, d] of Object.entries(S)) {
    const note = d._note || NOTES[id];
    delete d._note;
    const text = JSON.stringify(d);
    writeFileSync(join(OUT, id + '.tvfs'), text);
    index.push({ id, name: d.name, note, file: id + '.tvfs', bytes: Buffer.byteLength(text), kind: id.startsWith('touch-') ? 'touch' : id.startsWith('lottie') ? 'lottie' : 'interactive' });
}
writeFileSync(join(OUT, 'index.json'), JSON.stringify({ scenes: index }, null, 1) + '\n');
console.log(index.map(e => e.file + ' ' + e.bytes).join('\n'));
