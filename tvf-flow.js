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
    const INS = ['fade', 'draw', 'cut', 'pop'], OUTS = ['fade', 'undraw', 'cut'];
    const fail = s => { throw new Error('flow: ' + s); };
    const WORDS = ['now', 'at', 'wait', 'show', 'go', 'act', 'hide', 'together', 'stagger', 'look'];      // the beat's own words: a move may not take one's name
    // what a thing may be given when it is made, beside its poses: the fields of a morph the library has no word of its
    // own for (parts/ai-panel.js, ANIM_MORPH_FIELDS, says what each does)
    const FIELDS = ['path', 'laps', 'at', 'turn', 'mode', 'rate', 'phase', 'spin', 'emit', 'trail', 'fx', 'lag', 'follow', 'parent', 'look'];

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
            const t = { name, poses: list.map(s => shapes.push(s) - 1), events: [], acts: [], pose: 0, shown: null, hidden: null, opts: o || {} };
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
                    // pop: it springs up from nothing to its size and a little past (the editor's own motion), and stays.
                    // Its morph is that one motion, so a thing popped in is a still: it cannot then be asked to move.
                    if (kind === 'pop') t.shown.amount = o.amount != null ? +o.amount : 0.5;
                    t.first = t.pose;
                    return done(at + d), b;
                },
                // go: from the pose it is in to another, over dur. A list of poses is gone through in turn, each over
                // dur. The thing is shown first if it has not been (a cut, at once), so `go` alone is enough.
                go(t, to, o) {
                    t = thing(t); o = o || {};
                    const list = Array.isArray(to) ? to : [to], d = dur(o, 1), ease = o.ease || 'inout';
                    if (t.shown && t.shown.kind === 'pop') fail(t.name + ' was popped in, and a popped thing is a still');
                    if (t.acts.length) fail(t.name + ' acts, so it cannot also go from pose to pose');
                    if (!EASES.includes(ease) && !Array.isArray(ease)) fail(t.name + ': ease is one of ' + EASES.join(', ') + ' or a cubic Bézier [x1, y1, x2, y2]');
                    let at = start();
                    if (t.shown == null) { t.shown = { at, kind: 'cut', len: 0 }; t.first = t.pose; }
                    if (at < t.shown.at) fail(t.name + ' moves before it is shown');
                    for (const p of list) {
                        // its moves need not be said in the order they happen (a ring that turns through two beats is
                        // said once, with `at`): build() puts them in order and refuses two that overlap
                        const k = pose(t, p);
                        t.events.push({ at, end: at + d, to: k, ease });
                        t.pose = k; at += d;
                    }
                    return done(at), b;
                },
                // act: a motion the editor computes (bounce, fall, throw, roll, sway, swing, pop ...), played once over dur.
                // The thing comes as its motion begins (`in`, a fade unless said; `in: 'always'` and it is there from the
                // scene's start). Acts said one after another, with no gap, are one chain: thrown, then bouncing, then
                // rolling, each from where the last ended. `onto` in a motion may be a thing. A thing that acts is carried
                // by the motion: it is not also asked to go from pose to pose.
                act(t, motion, o) {
                    t = thing(t); o = o || {};
                    if (!motion || typeof motion.kind !== 'string') fail(t.name + ': a motion has a kind');
                    if (t.events.length) fail(t.name + ' goes from pose to pose, so it cannot also act');
                    const d = dur(o, 1), at = start(), last = t.acts[t.acts.length - 1];
                    if (!last) {
                        if (t.shown != null) fail(t.name + ' is shown before it acts: an act shows it (in: \'always\' if it is there from the start)');
                        const kind = o.in || 'fade'; if (kind !== 'always' && !INS.includes(kind) || kind === 'pop') fail(t.name + ': an act comes in by ' + INS.filter(k => k !== 'pop').join(', ') + ' or always');
                        t.shown = { at, kind, len: kind === 'cut' || kind === 'always' ? 0 : Math.min(d, o.inDur != null ? +o.inDur : 0.4) }; t.first = t.pose;
                    } else if (Math.abs(at - last.end) > 1e-6) fail(t.name + ' acts again after a gap: say its acts one after another');
                    t.acts.push({ at, end: at + d, motion: Object.assign({}, motion) });
                    return done(at + d), b;
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
            // the moves that have names (define): each is said like the library's own words, b.reveal(things)
            for (const name in moves) b[name] = (...args) => (moves[name](b, ...args), b);
            return b;
        }
        // A MOVE WITH A NAME (18 Nov 2026, Tom: "Proceed": reusable moves, then a playground). A move is a function of
        // the beat that says several things; given a name it is said like one of the library's own words, in every flow
        // that defines it: F.define('swap', (b, x, i, y, j, o) => …), then b.swap(a, 3, c, 2). Four come with the
        // library, the ones the first flows each wrote out by hand:
        //   reveal(things, { gap, in, dur })   each shown, `gap` after the one before
        //   relay(things, pose, { gap, dur })  each going to a pose (a number, or a function of the thing and its place)
        //   leave(things, { gap, out, dur })   each hidden in turn
        //   swap(x, i, y, j, { dur })          two things changing places at once: x to pose i, y to pose j
        const moves = Object.create(null);
        function define(name, fn) {
            if (!/^[a-z]\w*$/i.test(name || '') || WORDS.includes(name)) fail((name || 'a move') + ' cannot be a move\'s name');
            if (typeof fn !== 'function') fail(name + ': a move is a function of the beat');
            moves[name] = fn; return F;
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
            const morphs = [], at = Object.create(null), refs = [];
            for (const t of things) {
                if (t.shown == null) continue;                        // made and never shown: it is not in the scene's motion
                const s = t.shown.at, e = t.hidden ? t.hidden.at : total;
                if (!(e > s)) fail(t.name + ' is hidden before it has been seen');
                const clip = { start: sh(s), len: r4(Math.max(0.0002, Math.min(1, e / total) - sh(s))), in: { kind: t.shown.kind, len: r4(t.shown.len / total) } };
                if (t.hidden) clip.out = { kind: t.hidden.kind, len: r4(t.hidden.len / total) };
                const m = { keys: [t.poses[t.first]], clip };
                if (t.shown.kind === 'pop') {
                    if (t.hidden) fail(t.name + ' was popped in, and a popped thing is not hidden');
                    m.motion = { kind: 'pop', amount: t.shown.amount };
                    m.clip = { start: sh(s), len: r4(Math.max(0.0002, t.shown.len / total)), show: 'in' };
                }
                if (t.events.length) {
                    // its keys laid across its window: the pose it is in given again where each move starts (so it holds
                    // until then), and the last given again at the window's end (so it holds there)
                    const K = [t.first], T = [s], E = [];
                    t.events.sort((x, y) => x.at - y.at);
                    t.events.forEach((ev, i) => { const was = t.events[i - 1];
                        if (was && ev.at < was.end - 1e-9) fail(t.name + ' is asked to move while it is moving (at ' + r4(ev.at) + ' s)');
                        ev.from = was ? was.to : t.first; });
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
                if (t.acts.length) {
                    // its window is its acts', first to last; one act is the motion itself, several are a chain, each
                    // step's share its seconds
                    const a0 = t.acts[0].at, a1 = t.acts[t.acts.length - 1].end;
                    if (t.hidden && t.hidden.at < a1 - 1e-9) fail(t.name + ' is hidden while it acts');
                    const onto = mo => { if (mo.onto != null && typeof mo.onto !== 'number') mo.onto = thing(mo.onto).poses[0]; return mo; };
                    m.motion = t.acts.length === 1 ? onto(t.acts[0].motion)
                        : { kind: 'chain', steps: t.acts.map(a => Object.assign(onto(a.motion), { share: r4(a.end - a.at) })) };
                    m.clip = { start: sh(a0), len: r4(Math.max(0.0002, Math.min(1, a1 / total) - sh(a0))) };
                    if (t.shown.kind !== 'always') m.clip.in = { kind: t.shown.kind, len: r4(t.shown.len / total) };
                    if (t.hidden) m.clip.out = { kind: t.hidden.kind, len: r4(t.hidden.len / total) };
                }
                // what else a thing was given when it was made (FIELDS): copied onto its morph, a thing named where the
                // scene wants a number. A path is a shape's number, a parent or a thing to look at a morph's.
                for (const k in t.opts) {
                    if (!FIELDS.includes(k)) fail(t.name + ': ' + k + ' is not a field of a morph (' + FIELDS.join(', ') + ')');
                    m[k] = t.opts[k];
                }
                if (m.path != null && typeof m.path !== 'number') m.path = thing(m.path).poses[0];
                refs.push(m);
                (at[t.name] = at[t.name] || []).push(morphs.length); morphs.push(m);
            }
            for (const m of refs) for (const k of ['parent', 'look']) if (m[k] != null && typeof m[k] !== 'number') {
                const to = thing(m[k]); if (!at[to.name]) fail('a ' + k + ' must be shown: ' + to.name);
                m[k] = at[to.name][0];
            }
            // words that light what they name: [words](a, b) → [words](#lit:i,j), the morphs of the things named
            const litOf = n => at[n] || (groups[n] && groups[n].flatMap(t => at[t.name] || [])) || [];
            const lit = text => text.replace(/\]\(([^)#:/]+)\)/g, (all, names) => {
                const ids = names.split(',').map(n => n.trim()).filter(Boolean).flatMap(n => { const a = litOf(n); return a.length ? a : fail('a beat\'s words name ' + n + ', which is not shown'); });
                return '](#lit:' + ids.join(',') + ')';
            });
            const scene = {
                loop: r4(total), ease: opts.ease || 'inout',
                stops: beats.slice(0, -1).map(b => sh(b.end)),
                beats: beats.map(b => ({ title: b.title, text: lit(b.text) })),
                morphs
            };
            if (cameras.length) scene.camera = cameras.map(c => ({ t: sh(c.t), fit: c.fit.flatMap(t => t.poses), pad: c.pad }));
            // ONLY THE POSES A THING TAKES ARE IN THE DRAWING. A shape that is no morph's key is a still, drawn where it
            // stands the whole scene: a bar with a pose for each of ten places, standing in four of them, left six bars
            // on the picture that nothing moved (the sorting flow, the first to have poses it did not use). So the svg
            // is the shapes that are keys, the one pose of a thing never shown (a still, meant), a path ridden and the
            // paper; the numbers in the scene are counted again to match.
            const keep = new Set(opts.paper ? [0] : []);
            for (const t of things) if (t.shown == null) keep.add(t.poses[0]);
            for (const m of morphs) { m.keys.forEach(k => keep.add(k)); if (typeof m.path === 'number') keep.add(m.path);
                for (const mo of m.motion ? (m.motion.steps || [m.motion]) : []) if (typeof mo.onto === 'number') keep.add(mo.onto); }
            const num = new Map([...keep].sort((a, b) => a - b).map((k, i) => [k, i]));
            for (const m of morphs) { m.keys = m.keys.map(k => num.get(k)); if (typeof m.path === 'number') m.path = num.get(m.path);
                for (const mo of m.motion ? (m.motion.steps || [m.motion]) : []) if (typeof mo.onto === 'number') mo.onto = num.get(mo.onto); }
            if (scene.camera) for (const c of scene.camera) c.fit = c.fit.filter(k => num.has(k)).map(k => num.get(k));
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${shapes.filter((x, i) => num.has(i)).join('')}</svg>`;
            return { name: opts.name || 'a flow', svg, scene, seconds: total, things: things.map(t => t.name), at };
        }

        // A GROUP: several things under one name, for a beat's words to light together (six dots that are one idea)
        const groups = Object.create(null);
        function group(name, list) {
            if (!name || byName[name] || groups[name]) fail(name ? 'two things called ' + name : 'a group needs a name');
            groups[name] = list.map(thing); return groups[name];
        }
        const F = { shape, group, beat, build, thing, define, get seconds() { return cursor; } };
        define('reveal', (b, list, o) => b.stagger(list, o && o.gap != null ? o.gap : 0.12, t => b.show(t, o)));
        define('relay', (b, list, to, o) => b.stagger(list, o && o.gap != null ? o.gap : 0.12, (t, i) => b.go(t, typeof to === 'function' ? to(t, i) : to, o)));
        define('leave', (b, list, o) => b.stagger(list, o && o.gap != null ? o.gap : 0.12, t => b.hide(t, o)));
        define('swap', (b, x, i, y, j, o) => b.together(() => { b.go(x, i, o); b.go(y, j, o); }));
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
