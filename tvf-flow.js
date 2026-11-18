// tvf-flow.js: A SCENE COMPOSED IN CODE (18 Nov 2026, Tom: "Tvf is better at composing a flow of animations with
// code", then "Let's keep pushing TVF into larger situations. Seems like it is unusually good for code based
// animations.").
//
// A scene is data: shapes, the morphs between them, each morph's window of the loop, the camera, the stops and their
// words. The gallery's explainers are written in code already (gallery/animated.html, SHOWPIECES), but each one against
// the scene's own fields: every time a share of the loop worked out by hand (0.24, 0.25, 0.26 ...), every explainer
// declaring `put`, `add`, `shows`, `track`, `span`, `rel`, `lit` again, and the rules found making them (docs/
// explainers.md) kept in the writer's head. A change early in a scene moved every number after it.
//
// Here the writer says the flow and the library keeps the fields. Time is in seconds from a cursor that moves as
// things are said: one thing after another by default, several at once inside `together`, each a little later than
// the last in `stagger`. A shape has poses and goes from the one it is in to another; it appears when it is first
// shown and stays until it is hidden. A beat is a stretch of the flow with a title and words, and the scene stops at
// its end. What comes out is what a SHOWPIECE is, { name, svg, scene }, so the editor opens it (draw.html#scene=),
// the player plays it and explained.html tells it, with nothing downstream changed.
//
//   const F = TVF_FLOW.flow({ name: 'A fall', w: 800, h: 600, paper: '#f4f1ea' });
//   const ball = F.shape('ball', [circle(100, 100), circle(100, 500)]);       // two poses of one thing
//   const floor = F.shape('floor', line(0, 520, 800, 520));
//   F.beat('It falls', 'A [ball](ball) above a [floor](floor).', b => {
//     b.show(floor, { in: 'draw' });           // drawn on, 0.6 s; the cursor moves past it
//     b.show(ball);                            // fades in after that
//     b.wait(0.5);
//     b.go(ball, 1, { dur: 1.2, ease: 'in' }); // to its second pose
//   });
//   const piece = F.build();                   // { name, svg, scene: { loop, stops, beats, camera, morphs } }
//
// The rules it keeps, so a flow cannot break them (each was a fault once, docs/explainers.md):
//   - a thing not yet shown is not seen: every morph has a clip with an `in`, from the moment it is shown;
//   - a pose holds between moves: the key is given again where the next move starts, and the morph is `straight`;
//   - the last pose holds to the scene's end: the last key is given again there;
//   - words light what they name: `[words](name, name)` in a beat's text becomes the `#lit:` list of those things'
//     morphs, by name, so adding a morph cannot shift what another beat points at;
//   - a scene draws in the order its shapes were made (the svg's order), so what is made later is drawn on top.
//
// It reads nothing but what it is given, so it runs under Node (it exports itself) and in a page (TVF_FLOW).
(function (root, make) {
    const F = make();
    if (typeof module !== 'undefined' && module.exports)
        module.exports = F;
    else
        root.TVF_FLOW = F;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const r4 = v => +(+v).toFixed(4);
    const EASES = ['linear', 'inout', 'in', 'out', 'anticipate', 'overshoot'];
    const INS = ['fade', 'draw', 'cut'], OUTS = ['fade', 'undraw', 'cut'];
    const fail = s => { throw new Error('flow: ' + s); };

    function flow(opts) {
        opts = opts || {};
        const W = +opts.w || 1000, H = +opts.h || 1000;
        const shapes = [];                 // each svg element of the scene, in drawing order
        const things = [];                 // the handles: a name and its poses (indices into shapes)
        const byName = Object.create(null);
        const beats = [];                  // { title, text, end }
        const cameras = [];                // { t, fit: [thing, ...], pad } in seconds
        let cursor = 0, building = null;   // the time being written at, and the beat being written

        // A THING: one name, one or more poses. Each pose is a shape of its own in the svg (a key of the thing's
        // morph); a thing with one pose is a still that can still be shown, hidden and lit.
        function shape(name, poses, o) {
            if (!name || byName[name]) fail(name ? 'two things called ' + name : 'a thing needs a name');
            const list = Array.isArray(poses) ? poses : [poses];
            if (!list.length || list.some(s => typeof s !== 'string' || !/^\s*</.test(s))) fail(name + ': a pose is an svg element');
            const t = { name, poses: list.map(s => shapes.push(s) - 1), events: [], pose: 0, shown: null, hidden: null, opts: o || {} };
            things.push(t); byName[name] = t;
            return t;
        }
        // paper: a still under everything, there from the start (it is not a morph, so it has no clip). It is the
        // view's own size: with no camera a scene is fitted to all its shapes, and a paper larger than the picture
        // made the picture small in it.
        if (opts.paper) shapes.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${opts.paper}"/>`);

        const thing = t => (typeof t === 'string' ? byName[t] : t) || fail('no thing called ' + t);
        const dur = (o, d) => Math.max(0.001, o && o.dur != null ? +o.dur : d);

        // WHAT IS SAID INSIDE A BEAT. Each call writes at the cursor and, unless it is inside `together`, moves the
        // cursor to where it ends: said one after another, things happen one after another.
        function api() {
            let hold = null;               // inside together(): the start every call writes at, and the latest end
            const start = () => hold ? hold.at : cursor;
            const done = end => { if (hold) hold.end = Math.max(hold.end, end); else cursor = end; return end; };
            const b = {
                // the time now, in seconds, and a way to set it (to line one thing up with another's end)
                now: () => start(),
                at(t) { if (!(t >= 0)) fail('at(' + t + ')'); if (hold) hold.at = t; else cursor = t; return b; },
                wait(s) { return done(start() + Math.max(0, +s || 0)), b; },
                // show: the thing comes (fade, draw or cut) and stays. A thing must be shown before it goes anywhere.
                show(t, o) {
                    t = thing(t); o = o || {};
                    if (t.shown != null) fail(t.name + ' is shown twice');
                    const kind = o.in || 'fade'; if (!INS.includes(kind)) fail(t.name + ': in is one of ' + INS.join(', '));
                    const d = kind === 'cut' ? 0 : dur(o, 0.6), at = start();
                    t.shown = { at, kind, len: d }; if (o.pose != null) t.pose = pose(t, o.pose);
                    t.first = t.pose;
                    return done(at + d), b;
                },
                // go: from the pose it is in to another, over dur. A list of poses is gone through in turn, each over
                // dur. The thing is shown first if it has not been (a cut, at once), so `go` alone is enough.
                go(t, to, o) {
                    t = thing(t); o = o || {};
                    const list = Array.isArray(to) ? to : [to], d = dur(o, 1), ease = o.ease || 'inout';
                    if (!EASES.includes(ease) && !Array.isArray(ease)) fail(t.name + ': ease is one of ' + EASES.join(', ') + ' or a cubic Bézier [x1, y1, x2, y2]');
                    let at = start();
                    if (t.shown == null) { t.shown = { at, kind: 'cut', len: 0 }; t.first = t.pose; }
                    if (at < t.shown.at) fail(t.name + ' moves before it is shown');
                    for (const p of list) {
                        const k = pose(t, p), last = t.events[t.events.length - 1];
                        if (last && at < last.end - 1e-9) fail(t.name + ' is asked to move while it is moving (at ' + r4(at) + ' s)');
                        t.events.push({ at, end: at + d, from: t.pose, to: k, ease });
                        t.pose = k; at += d;
                    }
                    return done(at), b;
                },
                // hide: the thing goes (fade, undraw or cut) and is not seen again
                hide(t, o) {
                    t = thing(t); o = o || {};
                    if (t.shown == null) fail(t.name + ' is hidden before it is shown');
                    if (t.hidden != null) fail(t.name + ' is hidden twice');
                    const kind = o.out || 'fade'; if (!OUTS.includes(kind)) fail(t.name + ': out is one of ' + OUTS.join(', '));
                    const d = kind === 'cut' ? 0 : dur(o, 0.5), at = start();
                    t.hidden = { at: at + d, kind, len: d };
                    return done(at + d), b;
                },
                // together: everything said inside starts at the same moment; the cursor then stands at the latest end
                together(fn) {
                    const outer = hold, mine = { at: start(), end: start() };
                    hold = mine; try { fn(b); } finally { hold = outer; }
                    return done(mine.end), b;
                },
                // stagger: the same thing said of each item, each starting `gap` after the one before
                stagger(items, gap, fn) {
                    const outer = hold, at0 = start(); let end = at0;
                    items.forEach((it, i) => { const mine = { at: at0 + i * (+gap || 0), end: at0 + i * (+gap || 0) };
                        hold = mine; try { fn(it, i, b); } finally { hold = outer; } end = Math.max(end, mine.end); });
                    return done(end), b;
                },
                // look: the camera goes to fit these things, over dur, and holds there until it is asked again
                look(fit, o) {
                    o = o || {}; const list = (Array.isArray(fit) ? fit : [fit]).map(thing), d = dur(o, 1.2), at = start();
                    if (!list.length) fail('look() needs something to look at');
                    const pad = o.pad != null ? +o.pad : 0.1, last = cameras[cameras.length - 1];
                    if (last && at > last.t) cameras.push({ t: at, fit: last.fit, pad: last.pad });      // held where it was until now
                    cameras.push({ t: cameras.length ? at + d : at, fit: list, pad });
                    return done(cameras.length > 1 ? at + d : at), b;
                }
            };
            return b;
        }
        function pose(t, p) {
            const k = typeof p === 'number' ? p : fail(t.name + ': a pose is its number');
            if (!(k >= 0 && k < t.poses.length && k === Math.floor(k))) fail(t.name + ' has no pose ' + p + ' (it has ' + t.poses.length + ')');
            return k;
        }

        // A BEAT: a stretch of the flow, its title and its words. The scene waits at its end. `tail` is the quiet after
        // the last thing said, so a reader has the picture still for a moment before the words move on.
        function beat(title, text, fn, o) {
            if (building) fail('a beat inside a beat');
            if (typeof text === 'function') { o = fn; fn = text; text = ''; }
            building = { title: String(title || ''), text: String(text || ''), start: cursor };
            try { fn(api()); } finally {
                cursor += o && o.tail != null ? Math.max(0, +o.tail) : 0.8;
                building.end = cursor; beats.push(building); building = null;
            }
            return F;
        }

        // THE SCENE. Seconds become shares of the loop; each thing that was shown becomes one morph.
        function build() {
            if (!beats.length) fail('a flow needs a beat');
            const total = cursor, sh = t => r4(Math.min(0.9999, t / total));
            const morphs = [], at = Object.create(null);
            for (const t of things) {
                if (t.shown == null) continue;                        // made and never shown: it is not in the scene's motion
                const s = t.shown.at, e = t.hidden ? t.hidden.at : total;
                if (!(e > s)) fail(t.name + ' is hidden before it has been seen');
                const clip = { start: sh(s), len: r4(Math.max(0.0002, Math.min(1, e / total) - sh(s))), in: { kind: t.shown.kind, len: r4(t.shown.len / total) } };
                if (t.hidden) clip.out = { kind: t.hidden.kind, len: r4(t.hidden.len / total) };
                const m = { keys: [t.poses[t.first]], clip };
                if (t.events.length) {
                    // its keys laid across its window: the pose it is in given again where each move starts (so it holds
                    // until then), and the last given again at the window's end (so it holds there)
                    const K = [t.first], T = [s], E = [];
                    for (const ev of t.events) {
                        if (ev.at > T[T.length - 1] + 1e-9) { K.push(ev.from); T.push(ev.at); E.push(null); }
                        K.push(ev.to); T.push(ev.end); E.push(ev.ease);
                    }
                    if (e > T[T.length - 1] + 1e-9) { K.push(K[K.length - 1]); T.push(e); E.push(null); }
                    if (T[T.length - 1] > e + 1e-9) fail(t.name + ' is still moving when it is hidden');
                    m.keys = K.map(k => t.poses[k]);
                    m.straight = true;
                    m.times = T.map(x => r4(0.9999 * (x - s) / (e - s)));
                    m.eases = E.concat([null]);
                }
                Object.assign(m, t.opts);
                (at[t.name] = at[t.name] || []).push(morphs.length); morphs.push(m);
            }
            // words that light what they name: [words](a, b) → [words](#lit:i,j), the morphs of the things named
            const lit = text => text.replace(/\]\(([^)#:/]+)\)/g, (all, names) => {
                const ids = names.split(',').map(n => n.trim()).filter(Boolean).flatMap(n => at[n] || fail('a beat\'s words name ' + n + ', which is not shown'));
                return '](#lit:' + ids.join(',') + ')';
            });
            const scene = {
                loop: r4(total), ease: opts.ease || 'inout',
                stops: beats.slice(0, -1).map(b => sh(b.end)),
                beats: beats.map(b => ({ title: b.title, text: lit(b.text) })),
                morphs
            };
            if (cameras.length) scene.camera = cameras.map(c => ({ t: sh(c.t), fit: c.fit.flatMap(t => t.poses), pad: c.pad }));
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${shapes.join('')}</svg>`;
            return { name: opts.name || 'a flow', svg, scene, seconds: total, things: things.map(t => t.name), at };
        }

        const F = { shape, beat, build, thing, get seconds() { return cursor; } };
        return F;
    }

    // A FEW SHAPES, as the explainers draw them: enough to write a flow without an svg at hand. Each returns one svg
    // element. A closed outline is given by points so that two poses of one thing have the same number of them.
    const n2 = v => +(+v).toFixed(2);
    const draw = {
        line: (P, stroke, w) => `<path d="M${P.map(p => n2(p[0]) + ' ' + n2(p[1])).join(' L')}" fill="none" stroke="${stroke || '#3b4256'}" stroke-width="${w || 2}"/>`,
        poly: (P, fill, extra) => `<polygon points="${P.map(p => n2(p[0]) + ',' + n2(p[1])).join(' ')}" fill="${fill || '#3b4256'}"${extra || ''}/>`,
        rect: (x, y, w, h, fill) => draw.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill),
        // a round thing as a ring of n points, so it can become any other ring of n points
        ring: (cx, cy, r, fill, n, ry) => draw.poly(Array.from({ length: n || 24 }, (_, i) => { const a = 2 * Math.PI * i / (n || 24) - Math.PI / 2;
            return [cx + r * Math.cos(a), cy + (ry != null ? ry : r) * Math.sin(a)]; }), fill),
        text: (x, y, s, fill, size) => `<text x="${n2(x)}" y="${n2(y)}" font-size="${size || 22}" font-family="sans-serif" font-weight="600" fill="${fill || '#3b4256'}">${String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`
    };

    // the scene link's code, as gallery/animated.html writes it uncompressed ('r' + base64url of the JSON): what
    // draw.html#scene= opens. Kept here so a tool can open a flow without the gallery page.
    function code(piece) {
        const json = JSON.stringify(Object.assign({ v: 1, name: piece.name, svg: piece.svg }, piece.scene));
        const bytes = typeof TextEncoder === 'function' ? new TextEncoder().encode(json) : Buffer.from(json, 'utf8');
        let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        const b64 = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
        return 'r' + b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    return { flow, draw, code };
});
