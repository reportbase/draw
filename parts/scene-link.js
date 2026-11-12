// THE SCENE LINK, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2,3,4,5,6", the fifth being "keep
// splitting draw.html").
//
// What it holds: the scene link, draw.html#scene=…: reading one (openScene, applySceneMorphs, the camera, stops, beats, text, plots,
// labels into labels, emitters, contact) and writing one from what is on the page (sceneOfEditor).
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. Unlike a lab's file it is not loaded when asked for: the page
// names it in a <script src> before its own script, since what is here is wired at the start. Edit it as you would
// the editor: the same voice, the same indent. The comment that introduced the block is still in draw.html, above
// the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['scene-link'] = function () {
            function b64urlBytes(s) {
                s = s.replace(/-/g, '+').replace(/_/g, '/');
                while (s.length % 4)
                    s += '=';
                const bin = atob(s),
                    out = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++)
                    out[i] = bin.charCodeAt(i);
                return out;
            }
            async function decodeScene(code) {
                const kind = code.charAt(0);
                let b = b64urlBytes(code.slice(1));
                if (kind === 'z') {
                    const ds = new DecompressionStream('deflate-raw');
                    b = new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(ds)).arrayBuffer());
                } else if (kind !== 'r')
                    throw new Error('unknown encoding “' + kind + '”');
                const d = JSON.parse(new TextDecoder().decode(b));
                if (!d || d.v !== 1 || typeof d.svg !== 'string')
                    throw new Error('not a scene');
                return d;
            }
            const clamp = (v, a, b, dflt) => Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : dflt;
            // The morphs a scene describes, made from the shapes S (by their order in the scene's SVG):
            // the scene link's own (openScene), and the AI's "animate it" (ANIMATE IT WITH AI), which
            // passes { partial, existing }. Returns the runs its entries made, in order (null where an
            // entry made none).
            // TEXT IN A SCENE (28 Oct 2026, Tom: "1,2,3,4": labels for explainers). A scene's svg may hold <text>: x, y,
            // font-size, font-family, font-weight, font-style, text-anchor, and the paint and transforms any shape takes.
            // Each is traced as the text tool traces (the browser's own rendering of it, at 512 px, smoothed and
            // simplified) into rings, and written in its place as one path of them, left to right, each letter's outline
            // followed by its counters: the svg reader makes each outer ring a shape of its own with the rings inside it
            // as holes. A text is ONE shape in the scene's numbering, its first part; its other parts get the numbers
            // after the last shape. A morph naming it is made once a part (sceneLabelMorphs), so a label can be drawn
            // on letter by letter, fade, move or ride like any shape; the camera can frame it. A scene that leaves holds
            // the letters as shapes: no fonts are needed to play it.
            function sceneTextOut(svgText) {
                let doc;
                try {
                    doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
                } catch (_) {
                    return { svg: svgText, labels: [] };
                }
                const root = doc.documentElement,
                    texts = root && root.querySelectorAll ? [...root.querySelectorAll('text')] : [];
                if (!texts.length)
                    return { svg: svgText, labels: [] };
                const labels = [];
                const own = (el, k) => {
                    for (let e = el; e && e.getAttribute; e = e.parentNode) {
                        const v = e.getAttribute(k);
                        if (v != null && v !== '')
                            return v;
                        const st = e.getAttribute('style') || '',
                            m = st.match(new RegExp('(?:^|;)\\s*' + k + '\\s*:\\s*([^;]+)'));
                        if (m)
                            return m[1].trim();
                        if (e === root)
                            break;
                    }
                    return null;
                };
                texts.forEach((el, j) => {
                    const str = (el.textContent || '').replace(/\s+/g, ' ').trim(),
                        size = parseFloat(own(el, 'font-size')) || 16,
                        x = parseFloat(el.getAttribute('x')) || 0,
                        y = parseFloat(el.getAttribute('y')) || 0,
                        family = (own(el, 'font-family') || 'system-ui, sans-serif').replace(/"/g, "'"),
                        weight = own(el, 'font-weight') || '',
                        italic = /italic|oblique/.test(own(el, 'font-style') || ''),
                        anchor = own(el, 'text-anchor') || 'start';
                    const rings = str ? sceneTextRings(str, size, family, (italic ? 'italic ' : '') + (weight && weight !== 'normal' ? weight + ' ' : ''), anchor, x, y) : [];
                    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                    for (const a of el.attributes)
                        if (!/^(x|y|dx|dy|font-.*|text-anchor|letter-spacing|word-spacing|textLength|lengthAdjust)$/.test(a.name))
                            path.setAttribute(a.name, a.value);
                    path.setAttribute('id', 'tvf-label-' + j);
                    path.setAttribute('d', rings.length ? rings.join(' ') : 'M0 0Z');
                    path.setAttribute('fill-rule', 'evenodd');
                    el.parentNode.replaceChild(path, el);
                    labels.push({ id: 'tvf-label-' + j, text: str });
                });
                return { svg: new XMLSerializer().serializeToString(root), labels };
            }
            // A SHAPE FROM A FORMULA in a scene (28 Oct 2026, Tom: "1,2,3"): any element of the svg with a data-plot
            // attribute (the program, A SHAPE FROM A FORMULA) is drawn by it: data-t0 and data-t1 its range (formulas of
            // constants, "2π"), data-n its samples (128), data-cx and data-cy where its origin sits in the svg (0, 0)
            // and data-scale how many svg units one of its own is (1). It is written in its place as a path of cubics
            // through the samples, keeping the element's paint, and the shape it becomes keeps its program (sp.plot),
            // so the plot panel can open on it in the editor.
            function scenePlotOut(svgText) {
                if (!/data-plot\s*=/.test(svgText))
                    return { svg: svgText, plots: [] };
                let doc;
                try {
                    doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
                } catch (_) {
                    return { svg: svgText, plots: [] };
                }
                const root = doc.documentElement,
                    els = root && root.querySelectorAll ? [...root.querySelectorAll('[data-plot]')] : [],
                    plots = [];
                els.forEach((el, j) => {
                    const g = k => el.getAttribute('data-' + k),
                        spec = plotSpecOk({ src: g('plot'), t0: g('t0'), t1: g('t1'), n: g('n') }),
                        cx = plotConst(g('cx'), 0), cy = plotConst(g('cy'), 0), sc = plotConst(g('scale'), 1);
                    let d = 'M0 0Z';
                    try {
                        if (spec)
                            d = plotPathD(spec, cx, cy, sc);
                    } catch (e) {
                        console.warn('a plot in the scene does not draw: ' + e.message);
                    }
                    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                    for (const a of el.attributes)
                        if (!/^(data-.*|d|points|x|y|width|height|cx|cy|r|rx|ry|x1|y1|x2|y2)$/.test(a.name))
                            path.setAttribute(a.name, a.value);
                    path.setAttribute('id', 'tvf-plot-' + j);
                    path.setAttribute('d', d);
                    el.parentNode.replaceChild(path, el);
                    if (spec)
                        plots.push({ id: 'tvf-plot-' + j, spec, cx, cy, sc });
                });
                return { svg: new XMLSerializer().serializeToString(root), plots };
            }
            // …and the shapes they became given their programs back, with the map from the plot's own units (y up) to
            // the page's: found from the samples against the corners the svg reader laid
            function scenePlotsIn(S, P) {
                if (!P || !P.plots.length)
                    return;
                const byId = new Map(P.plots.map(q => [q.id, q]));
                for (const sp of S) {
                    const q = sp && byId.get(sp.gname);
                    if (!q)
                        continue;
                    sp.gname = 'plot';
                    const lz = sp._lazy;
                    try {
                        const pts = plotSample(q.spec).pts;
                        if (lz && lz.x.length === pts.length) {
                            sp.plot = Object.assign({}, q.spec, { m: morphAffineOf({ x: pts.map(v => v[0]), y: pts.map(v => v[1]) }, { x: lz.x, y: lz.y }) });
                            plotRelay(sp, sp.plot); // its corners exactly the formula's, not the svg's rounded ones
                        }
                    } catch (_) {}
                }
            }
            // SIMPLE MATHS IN A LABEL (28 Oct 2026, Tom: "1,2,3"): x_1 and x^2 (one character) or x_{max} and e^{iπ}
            // (braced) are written lower and higher, at seven tenths of the size; the rest as it is. The runs of a
            // label: [{str, k: size factor, dy: baseline shift in sizes, down}]
            function sceneTextRuns(str) {
                const out = [];
                let i = 0, plain = '';
                const flush = () => {
                    if (plain) out.push({ str: plain, k: 1, dy: 0 });
                    plain = '';
                };
                while (i < str.length) {
                    const c = str[i];
                    if ((c === '_' || c === '^') && i + 1 < str.length) {
                        let body;
                        if (str[i + 1] === '{') {
                            const j = str.indexOf('}', i + 2);
                            if (j < 0) {
                                plain += c;
                                i++;
                                continue;
                            }
                            body = str.slice(i + 2, j);
                            i = j + 1;
                        } else {
                            body = [...str.slice(i + 1)][0];
                            i += 1 + body.length;
                        }
                        flush();
                        if (body)
                            out.push({ str: body, k: 0.7, dy: c === '_' ? 0.22 : -0.38 });
                        continue;
                    }
                    plain += c;
                    i++;
                }
                flush();
                return out;
            }
            // a text's rings in the svg's units, its baseline at (x, y): each outer ring followed by its holes, outer
            // rings left to right (so a label drawn on is written left to right), its runs set one after another
            function sceneTextRings(str, size, family, sw, anchor, x, y) {
                const runs = sceneTextRuns(str);
                if (runs.length === 1 && runs[0].k === 1)
                    return sceneTextRun(str, size, family, sw, anchor, x, y);
                const probe = document.createElement('canvas').getContext('2d'),
                    W = runs.map(r => {
                        probe.font = sw + 512 + 'px ' + family;
                        return probe.measureText(r.str).width * size * r.k / 512;
                    }),
                    total = W.reduce((a, b) => a + b, 0);
                let ox = x - (anchor === 'middle' ? total / 2 : anchor === 'end' ? total : 0);
                const out = [];
                runs.forEach((r, i) => {
                    out.push(...sceneTextRun(r.str, size * r.k, family, sw, 'start', ox, y + r.dy * size));
                    ox += W[i];
                });
                return out;
            }
            // one run of a text, traced
            function sceneTextRun(str, size, family, sw, anchor, x, y) {
                const fontPx = 512,
                    probe = document.createElement('canvas').getContext('2d');
                probe.font = sw + fontPx + 'px ' + family;
                const m = probe.measureText(str),
                    ascent = m.actualBoundingBoxAscent || fontPx * 0.8,
                    pad = Math.ceil(fontPx * 0.18) + 2; // as textToContours lays it out
                let loops;
                try {
                    loops = textToContours(str, fontPx, family, sw);
                } catch (_) {
                    loops = [];
                }
                loops = loops.map(l => rdpSimplify(smoothDrawPts(l.map(q => ({ x: q[0], y: q[1] })), 2, 2).map(q => [q.x, q.y]), 0.6))
                    .filter(l => l.length >= 3);
                const area = l => {
                    let a2 = 0;
                    for (let i = 0; i < l.length; i++) {
                        const k = (i + 1) % l.length;
                        a2 += l[i][0] * l[k][1] - l[k][0] * l[i][1];
                    }
                    return Math.abs(a2) / 2;
                };
                const inside = (px, py, l) => {
                    let c = false;
                    for (let i = 0, k = l.length - 1; i < l.length; k = i++)
                        if ((l[i][1] > py) !== (l[k][1] > py) && px < (l[k][0] - l[i][0]) * (py - l[i][1]) / (l[k][1] - l[i][1]) + l[i][0])
                            c = !c;
                    return c;
                };
                loops = loops.filter(l => area(l) > 6);
                const A = loops.map(area),
                    depth = loops.map(() => 0),
                    parent = loops.map(() => -1);
                for (let i = 0; i < loops.length; i++)
                    for (let k = 0; k < loops.length; k++)
                        if (i !== k && A[k] > A[i] && inside(loops[i][0][0] + 0.01, loops[i][0][1] + 0.013, loops[k])) {
                            depth[i]++;
                            if (parent[i] < 0 || A[k] < A[parent[i]])
                                parent[i] = k;
                        }
                const q = size / fontPx,
                    ox = x - (anchor === 'middle' ? m.width * q / 2 : anchor === 'end' ? m.width * q : 0),
                    f = v => +v.toFixed(2),
                    ring = l => 'M' + l.map(p => f(ox + (p[0] - pad) * q) + ' ' + f(y + (p[1] - pad - ascent) * q)).join('L') + 'Z';
                const outers = loops.map((l, i) => i).filter(i => depth[i] % 2 === 0)
                    .sort((a, b) => Math.min(...loops[a].map(p => p[0])) - Math.min(...loops[b].map(p => p[0])));
                const out = [];
                for (const i of outers) {
                    out.push(ring(loops[i]));
                    loops.forEach((l, k) => {
                        if (depth[k] % 2 === 1 && parent[k] === i)
                            out.push(ring(l));
                    });
                }
                return out;
            }
            // the labels' parts found again in the drawing (by the id each text's path was given), the scene's numbering
            // made again with each label one number (its first part) and its other parts after the last shape
            function sceneLabelsIn(S, T) {
                const ids = new Map(T.labels.map((L, j) => [L.id, j])),
                    parts = T.labels.map(() => []),
                    S2 = [],
                    num = T.labels.map(() => -1);
                for (const sp of S) {
                    const j = sp && ids.has(sp.gname) ? ids.get(sp.gname) : -1;
                    if (j < 0) {
                        S2.push(sp);
                        continue;
                    }
                    sp.gname = T.labels[j].text || null; // named by what it says
                    if (!parts[j].length) {
                        num[j] = S2.length;
                        S2.push(sp);
                    }
                    parts[j].push(sp);
                }
                const extra = parts.map(P => P.slice(1).map(sp => S2.push(sp) - 1));
                return { S: S2, num, extra, parts };
            }
            // a morph naming a label made once a part: every key a label with as many parts (or one key), each copy
            // taking the next part of each; drawn on, the parts take the window in turn, left to right
            window.__sceneLabelMorphs = (d, L) => sceneLabelMorphs(d, L);
            window.__sceneTextRings = sceneTextRings; // the glyph rings of a text, for tools/write-glyphs.mjs (29 Oct 2026, text effects)
            window.__sceneTextBox = str => { // the vertical extent of a label's rings at 40 px, baseline 100 (the smoke test)
                let y0 = Infinity, y1 = -Infinity;
                for (const r of sceneTextRings(str, 40, 'sans-serif', '', 'start', 0, 100))
                    for (const m of r.matchAll(/[ML]([-\d.]+) ([-\d.]+)/g)) {
                        y0 = Math.min(y0, +m[2]);
                        y1 = Math.max(y1, +m[2]);
                    }
                return [y0, y1];
            };
            function sceneLabelMorphs(d, L) {
                const labelAt = new Map(L.num.map((n, j) => [n, j]).filter(([n]) => n >= 0));
                if (!labelAt.size || !Array.isArray(d.morphs))
                    return d;
                const out = JSON.parse(JSON.stringify(d)),
                    add = [],
                    drop = new Set();
                out.morphs.forEach((e, ei) => {
                    const keys = Array.isArray(e) ? e : e && e.keys;
                    if (!Array.isArray(keys) || !keys.length || !keys.every(k => labelAt.has(k)))
                        return;
                    // LABELS INTO LABELS (28 Oct 2026, Tom: "1,2,3"): a morph between different labels ("N = 8", then
                    // "N = 16") is a crossfade, each label seen from its key's time to the next's, the two overlapping
                    // as one fades into the other; the first comes in and the last goes out as the entry's clip says.
                    // Letters have no outline to morph between ("8" and "16" are not one shape twice), and a reader
                    // follows a number that turns into another.
                    if (keys.length > 1 && new Set(keys).size > 1) {
                        const c = !Array.isArray(e) && morphClipOk(e.clip) ? e.clip : null,
                            cs = c ? +c.start : 0,
                            cl = c ? +c.len : 1,
                            n = keys.length,
                            T = !Array.isArray(e) && Array.isArray(e.times) && e.times.length === n
                                ? e.times.map(t => cs + cl * Math.max(0, Math.min(1, +t)))
                                : keys.map((_, k) => cs + cl * k / n),
                            end = cs + cl;
                        drop.add(ei);
                        // the crossfade at each key after the first: a thirtieth of the loop, or a quarter of the
                        // shorter stretch beside it
                        const span = k => (k + 1 < n ? T[k + 1] : end) - T[k],
                            X = keys.map((_, k) => k ? Math.min(0.03, span(k - 1) / 4, span(k) / 4) : 0);
                        keys.forEach((k, i) => {
                            const s0 = i ? Math.max(0, T[i] - X[i] / 2) : cs,
                                s1 = i + 1 < n ? Math.min(1, T[i + 1] + X[i + 1] / 2) : end;
                            if (!(s1 > s0))
                                return;
                            const clip = { start: +s0.toFixed(6), len: +(s1 - s0).toFixed(6) };
                            if (i)
                                clip.in = { kind: 'fade', len: X[i] };
                            else if (c && (c.in || ['in', 'fade', 'draw', 'during'].includes(c.show)))
                                clip.in = c.in || { kind: c.show === 'draw' ? 'draw' : c.show === 'during' ? 'cut' : 'fade', len: c.show === 'draw' ? (T[1] - cs) / 2 : c.show === 'during' ? 0 : cl * MORPH_FADE };
                            if (i + 1 < n)
                                clip.out = { kind: 'fade', len: X[i + 1] };
                            else if (c && (c.out || ['out', 'fade', 'during'].includes(c.show)))
                                clip.out = c.out || { kind: c.show === 'during' ? 'cut' : 'fade', len: c.show === 'during' ? 0 : cl * MORPH_FADE };
                            const j = labelAt.get(k);
                            for (const part of [k].concat(L.extra[j]))
                                add.push({ keys: [part], clip: JSON.parse(JSON.stringify(clip)) });
                        });
                        return;
                    }
                    const P = L.parts[labelAt.get(keys[0])].length;
                    if (P < 2 || !keys.every(k => L.parts[labelAt.get(k)].length === P))
                        return;
                    const c = !Array.isArray(e) && e.clip && e.clip.show === 'draw' && !e.clip.in ? e.clip : null,
                        ci = !Array.isArray(e) && morphClipOk(e.clip) && e.clip.in && e.clip.in.kind === 'draw' ? e.clip : null,
                        inL = ci ? Math.max(1e-4, Math.min(+ci.len, +ci.in.len || +ci.len)) : 0;
                    for (let g = 1; g < P; g++) {
                        const k2 = keys.map(k => L.extra[labelAt.get(k)][g - 1]);
                        if (Array.isArray(e))
                            add.push(k2);
                        else {
                            const copy = JSON.parse(JSON.stringify(e));
                            copy.keys = k2;
                            if (c)
                                copy.clip = { start: +c.start + g * c.len / P, len: c.len / P, show: 'draw' };
                            else if (ci) // IN AND OUT: each part drawn on in turn over the in, all going together at the end
                                copy.clip = Object.assign({}, ci, { start: +ci.start + g * inL / P, len: +ci.len - g * inL / P, in: { kind: 'draw', len: inL / P } });
                            add.push(copy);
                        }
                    }
                    if (c)
                        e.clip = { start: +c.start, len: c.len / P, show: 'draw' };
                    else if (ci)
                        e.clip = Object.assign({}, ci, { in: { kind: 'draw', len: inL / P } });
                });
                out.morphs = out.morphs.filter((_, i) => !drop.has(i)).concat(add);
                if (Array.isArray(out.camera)) // a camera framing a label frames all of it
                    for (const k of out.camera)
                        if (k && Array.isArray(k.fit))
                            k.fit = k.fit.concat(...k.fit.filter(n => labelAt.has(n)).map(n => L.extra[labelAt.get(n)]));
                        else if (k && labelAt.has(k.fit))
                            k.fit = [k.fit].concat(L.extra[labelAt.get(k.fit)]);
                return out;
            }
            // A CAMERA, AND STOPS, from a scene: a key frames shapes of the scene by their number ("fit": a list,
            // or "all"; "pad" the margin round them, a share of their size, 0.12 if not given), or gives a box
            // in the scene's svg's own units ("box": [x0, y0, x1, y1], y down), which is how the editor writes
            // one back (THE SCENE LINK, WRITTEN BY THE EDITOR)
            function sceneCameraIn(d, S) {
                const C = Array.isArray(d.camera) ? d.camera : [],
                    out = [];
                let R;
                for (const k of C) {
                    if (!k || !Number.isFinite(+k.t))
                        continue;
                    let box = null;
                    if (k.fit != null && typeof window.__animOutline === 'function') {
                        const ids = k.fit === 'all' ? S.map((_, i) => i) : [].concat(k.fit);
                        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
                        for (const i of ids) {
                            const O = S[i] ? window.__animOutline(S[i]) : null;
                            if (O)
                                for (let j = 0; j < O.x.length; j++) {
                                    x0 = Math.min(x0, O.x[j]);
                                    x1 = Math.max(x1, O.x[j]);
                                    y0 = Math.min(y0, O.y[j]);
                                    y1 = Math.max(y1, O.y[j]);
                                }
                        }
                        if (isFinite(x0)) {
                            const pad = clamp(k.pad, 0, 3, 0.12) * Math.max(x1 - x0, y1 - y0);
                            box = [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
                        }
                    } else if (Array.isArray(k.box) && k.box.length === 4 && k.box.every(v => Number.isFinite(+v))) {
                        if (R === undefined)
                            R = typeof window.__sceneBoxOf === 'function' ? window.__sceneBoxOf(d.svg, S) : null;
                        if (R) {
                            const q = 2 * R.half / 1000,
                                mx = a => q * a + R.cx - 500 * q,
                                my = b => -q * b + R.cy + 500 * q;
                            box = [mx(+k.box[0]), my(+k.box[3]), mx(+k.box[2]), my(+k.box[1])];
                        }
                    }
                    if (box)
                        out.push({ t: +k.t, box });
                }
                return morphCameraOk(out);
            }
            function applySceneMorphs(d, S, opts) {
                // the look and the timing first: a morph takes its effect from these as it starts
                // partial (the AI's "animate it" and "change it"): a setting the reply leaves out keeps
                // what the page has, where a scene link starts from the defaults
                const partial = !!(opts && opts.partial),
                    has = k => !partial || d[k] !== undefined;
                const fx = d.fx || {},
                    tr = d.trail || {};
                if (has('fx')) {
                    state.morphFx = MORPH_FX.includes(fx.kind) ? fx.kind : '';
                    state.morphFxAmount = clamp(fx.amount, 0, 1, 0.5);
                }
                if (has('trail')) {
                    state.morphTrail = MORPH_TRAILS.includes(tr.kind) ? tr.kind : '';
                    state.morphTrailLen = clamp(tr.len, 0, 1, 0.5);
                }
                if (has('ease'))
                    state.morphEase = MORPH_EASES.includes(d.ease) ? d.ease : '';
                if (has('hold'))
                    state.morphHold = clamp(d.hold, 0, 0.9, 0);
                if (has('gravity')) // SCENE-WIDE GRAVITY AND WIND
                    state.morphGravity = clamp(d.gravity, 1, 4, 1);
                if (has('wind'))
                    state.morphWind = clamp(d.wind, -1, 1, 0);
                if (has('onion'))
                    state.morphOnion = !!d.onion;
                if (has('turn'))
                    state.morphPathTurn = d.turn !== false;
                if (has('mode'))
                    state.morphPathMode = d.mode === 'back' ? 'back' : 'along';
                const keepCorners = state.morphCorners;
                state.morphCorners = d.corners !== false;
                // the run each entry made, or null, for `parent` and `look`; the AI's replies count the
                // morphs already live first (opts.existing), then its own entries
                const made = (opts && opts.existing ? opts.existing.slice() : []);
                try {
                    // each entry a list of shapes, or an object with the keys and what the morph has of
                    // its own: { keys, path, laps, at, turn, mode, rate, phase, spin, fx, trail, lag,
                    // inPlace } (EACH MORPH ITS OWN TIME, PATH, COLOUR, TRAIL). A shape may be a key
                    // more than once (bud, bloom, bud).
                    for (const entry of morphEmitExpand(Array.isArray(d.morphs) ? d.morphs : [], S)) { // EMITTERS
                        made.push(null);
                        const o = Array.isArray(entry) ? { keys: entry } : typeof entry === 'number' ? { keys: [entry] } : (entry || {});
                        const list = (Array.isArray(o.keys) ? o.keys : [o.keys]).filter(i => S[i]),
                            uniq = [...new Set(list)],
                            idx = uniq.map(i => state.subpaths.indexOf(S[i]));
                        if (!idx.length || idx.some(i => i < 0))
                            continue;
                        state.activeSet = new Set(idx);
                        state.activeSp = idx.length === 1 ? idx[0] : -1;
                        state.selected.clear();
                        const last = morphRuns[morphRuns.length - 1],
                            fxKeep = state.morphFx,
                            fxAmtKeep = state.morphFxAmount;
                        if (o.fx) {
                            state.morphFx = MORPH_FX.includes(o.fx.kind) ? o.fx.kind : '';
                            state.morphFxAmount = clamp(o.fx.amount, 0, 1, 0.5);
                        }
                        try {
                            morphLiveStart({ inPlace: o.inPlace !== false, align: true, lag: clamp(o.lag != null ? o.lag : d.lag, 0, MORPH_LAG_MAX, 0) });
                        } finally {
                            state.morphFx = fxKeep;
                            state.morphFxAmount = fxAmtKeep;
                        }
                        const run = morphRuns[morphRuns.length - 1];
                        if (!run || run === last)
                            continue;
                        made[made.length - 1] = run;
                        run._parentEntry = Number.isInteger(o.parent) ? o.parent : null;
                        run._lookEntry = Number.isInteger(o.look) ? o.look : null; // FACING
                        run.follow = o.follow && MORPH_FOLLOW.includes(o.follow.kind) ? { kind: o.follow.kind, amount: clamp(o.follow.amount, 0, 1, 0.5) } : null;
                        if (list.length !== uniq.length) { // the keys in the order the list gives them
                            const byShape = run.keys.slice(),
                                copy = k => run.exact ? exactKeyCopy(k) : { x: Float64Array.from(k.x), y: Float64Array.from(k.y) };
                            run.keys = list.map(i => copy(byShape[uniq.indexOf(i)]));
                            if (run.cols) {
                                const cs = run.cols;
                                run.cols = list.map(i => cs[uniq.indexOf(i)]);
                            }
                            if (run.exact)
                                run.curved = morphExactCurved(run.keys);
                            run.spec = null;
                            run.freq = null;
                            run._centres = null;
                        }
                        sceneRunOwn(run, o, d, S, false);
                    }
                    for (const run of made.slice(opts && opts.existing ? opts.existing.length : 0)) // ONE MORPH RIDING ANOTHER: `parent` names an entry of the list
                        if (run && run._parentEntry != null) {
                            morphSetParent(run, made[run._parentEntry]);
                            delete run._parentEntry;
                        }
                    if (has('t'))
                        morphLive.t = clamp(d.t, 0, 1, 0);
                    for (const run of made.slice(opts && opts.existing ? opts.existing.length : 0)) // FACING: `look` names an entry; drawn facing it as things stand at t
                        if (run && run._lookEntry != null) {
                            morphSetLook(run, made[run._lookEntry]);
                            delete run._lookEntry;
                        }
                } finally {
                    state.morphCorners = keepCorners;
                }
                if (morphRunning()) {
                    if (+d.loop > 0)
                        morphLive.speed = 1 / clamp(d.loop, 0.5, 60, 4);
                    const P = d.path != null ? S[d.path] : null;
                    if (P && state.subpaths.indexOf(P) >= 0)
                        morphSetPath({ index: state.subpaths.indexOf(P) });
                    if (has('stops')) // A CAMERA, AND STOPS
                        state.morphStops = morphStopsOk(d.stops);
                    if (has('beats') || has('stops')) // AN EXPLAINER'S BEATS, one a stretch between stops
                        state.morphBeats = morphBeatsOk(has('beats') ? d.beats : state.morphBeats, state.morphStops.length + 1);
                    if (has('camera')) {
                        state.morphCamera = sceneCameraIn(d, S);
                        state.morphCamFollow = true;
                    }
                    if (has('t'))
                        morphLive.t = clamp(d.t, 0, 1, 0);
                    morphWrite();
                    if (d.play !== false) {
                        morphLive.play = true;
                        morphLive.last = 0;
                        if (!morphLive.raf)
                            morphLive.raf = requestAnimationFrame(morphTick);
                    }
                }
                return made.slice(opts && opts.existing ? opts.existing.length : 0);
            }
            // What an entry of `morphs` gives the run it made: its clock, path, timing, clip and trail.
            // partial: only what the entry names changes (the AI's "change it"), else the defaults.
            function sceneRunOwn(run, o, d, S, partial) {
                const has = k => !partial || o[k] !== undefined;
                if (has('phase'))
                    run.phase = Number.isFinite(+o.phase) ? ((+o.phase % 1) + 1) % 1 : 0;
                if (has('rate'))
                    run.rate = Math.max(1, Math.round(+o.rate || 1));
                if (has('spin'))
                    run.spin = Number.isFinite(+o.spin) ? +o.spin : 0;
                if (has('motion')) // PHYSICAL MOTIONS; CONTACT: `onto` a shape of the link, by its number, followed
                    morphMotionSet(run, o.motion, S);
                if (has('laps'))
                    run.laps = Math.max(1, Math.round(+o.laps || 1));
                if (has('at'))
                    run.at = o.at != null ? clamp(o.at, 0, 1, 0) : null;
                // CORNERS PAIRED BY HAND: `pair` per key, a whole number of places to turn its corners
                // round (negative back), after the pairing the morph found
                if (run.exact && Array.isArray(o.pair)) {
                    o.pair.forEach((st, k) => {
                        const Q = run.keys[k];
                        if (Q && Number.isInteger(st) && st)
                            exactRoll(Q, ((st % Q.x.length) + Q.x.length) % Q.x.length);
                    });
                    run.curved = morphExactCurved(run.keys);
                }
                // KEYS AT CHOSEN TIMES: `times` a time per key, `eases` an ease per stretch
                if (has('times'))
                    run.times = morphTimesOk(o.times, run.keys.length) ? o.times.map(Number) : null;
                if (has('eases'))
                    run.eases = morphEasesOk(o.eases, run.keys.length) ? o.eases.slice() : null;
                if (has('straight')) // STRAIGHT FROM KEY TO KEY
                    run.straight = !!o.straight;
                if (has('clip'))
                    run.clip = morphClipNorm(o.clip); // A MORPH THAT PLAYS ONCE, and IN AND OUT
                // A SCENE'S QUIET FALLBACKS, SAID ALOUD: what was given and not taken, and a clip whose last key ends early
                const which = 'a morph of ' + run.keys.length + ' keys';
                if (has('times') && o.times != null && !run.times)
                    sceneWarn(which + ': times dropped (one per key, increasing, each 0 to 0.9999)');
                if (has('eases') && o.eases != null && !run.eases)
                    sceneWarn(which + ': eases dropped (one per stretch: ' + (run.keys.length === 2 ? 1 : run.keys.length) + ', the last the stretch back round)');
                if (run.clip && run.times && run.keys.length > 2 && run.times[run.times.length - 1] < 0.98)
                    sceneWarn(which + ': a clip lays its keys from the first to the last across its window, and the last key\'s time is '
                        + run.times[run.times.length - 1] + ', so its last pose is stretched to the window\'s end; give the last key again at the end to hold');
                if (o.trail)
                    run.trail = { kind: MORPH_TRAILS.includes(o.trail.kind) ? o.trail.kind : '', len: clamp(o.trail.len, 0, 1, 0.5) };
                if (o.path != null && S[o.path])
                    morphRunPathSet(run, S[o.path], o.turn != null ? o.turn : d.turn, o.mode || d.mode);
            }
            async function openScene(d) {
                if (state.editMode || drawMode) {
                    flashStatus('example ignored — leave the edit or draw mode and open it again');
                    return false;
                }
                const label = d.name || 'example',
                    name = 'example · ' + label;
                const mine = !EMBED && state.subpaths.length && state.svgName !== 'maple (hand-drawn)' && !String(state.svgName || '').startsWith('example · ');
                if (mine) {
                    const go = await askConfirm({
                        title: 'Open the example?',
                        body: '“' + label + '” replaces the drawing on this page, and the undo history with it. Save your drawing first if you want to keep it.',
                        ok: 'open the example',
                        cancel: 'keep my drawing'
                    });
                    if (!go)
                        return false;
                }
                if (morphRunning())
                    morphAbandon();
                const keepExact = state.svgExact;
                state.svgExact = d.exact !== false;
                const PL = scenePlotOut(d.svg), // A SHAPE FROM A FORMULA: plots drawn by their programs
                    T = sceneTextOut(PL.svg); // TEXT IN A SCENE: labels as shapes
                try {
                    loadSvg(T.svg, name, false, true);
                } finally {
                    state.svgExact = keepExact;
                }
                let S = state.subpaths.slice();
                scenePlotsIn(S, PL);
                window.__sceneLabelsLast = null;
                window.__sceneSvgLast = T.svg; // the svg as opened, its text made paths
                if (T.labels.length) {
                    const L = sceneLabelsIn(S, T);
                    S = L.S;
                    d = Object.assign(sceneLabelMorphs(d, L), { svg: T.svg });
                    window.__sceneLabelsLast = L; // MAKE A SCENE lands its morphs after this, by the same numbers
                }
                // An example is a picture: a shape the SVG gave no stroke is drawn by its fill alone, not
                // with the editor's own outline round it (which exact shapes carry by default).
                for (const sp of S)
                    if (sp && !sp.stroke && sp.fill && sp.fill.color)
                        sp.lineWidth = 0;
                applySceneMorphs(d, S);
                morphCameraFollow(); // A CAMERA: the view where the scene starts
                state.svgName = name;
                applyShapeSelection(new Set());
                // one undo history, starting here: making each morph pushed a step of its own, so undoing past the
                // open took the morphs away one at a time; a scene is opened whole, as a file is
                resetHistory();
                morphBarSync();
                drawAll();
                scheduleSave();
                flashStatus('example · ' + label + (morphRunning() ? ' — live: the morph bar at the bottom holds its controls, and exit leaves the shapes as shapes' : ''));
                return true;
            }
            // CHANGE IT (ANIMATE IT WITH AI): what a reply says about morphs already live, each item
            // { morph: k, …what changes } with k counting `all` (the live morphs, then the reply's new
            // ones), so a note like "slower, and let the bird lag more" changes those settings and keeps
            // the rest: the keys, the poses edited by hand, the times a key was dragged to. `end: true`
            // ends that morph and gives its keys back as shapes.
            function sceneChangeRuns(changes, S, all) {
                const ends = [];
                for (const c of Array.isArray(changes) ? changes : []) {
                    const run = c && Number.isInteger(c.morph) ? all[c.morph] : null;
                    if (!run || morphRuns.indexOf(run) < 0)
                        continue;
                    if (c.end) {
                        ends.push(run);
                        continue;
                    }
                    sceneRunOwn(run, c, {}, S, true);
                    if (c.fx !== undefined)
                        run.fx = c.fx && MORPH_FX.includes(c.fx.kind) ? { kind: c.fx.kind, amount: clamp(c.fx.amount, 0, 1, 0.5) } : null;
                    if (c.trail === null)
                        run.trail = null;
                    if (c.lag !== undefined) {
                        run.lag = clamp(c.lag, 0, MORPH_LAG_MAX, 0);
                        run.spec = null;
                        run.freq = null;
                    }
                    if (c.follow !== undefined)
                        run.follow = c.follow && MORPH_FOLLOW.includes(c.follow.kind) ? { kind: c.follow.kind, amount: clamp(c.follow.amount, 0, 1, 0.5) } : null;
                    if (c.parent !== undefined)
                        morphSetParent(run, Number.isInteger(c.parent) ? all[c.parent] : null);
                    if (c.look !== undefined)
                        morphSetLook(run, Number.isInteger(c.look) ? all[c.look] : null);
                }
                if (ends.length)
                    morphExit(ends);
                return ends.length;
            }
            // ── THE SCENE LINK, WRITTEN BY THE EDITOR (26 Oct 2026, Tom: "1,2", after "share a scene from
            // the editor": "the AI makes it, you tweak it, you share or embed it") ──────────────────────
            // The other way round from openScene: what is on the page, live morphs and all, as a scene
            // link. The drawing goes out as SVG, every shape in its order, a live morph's place taken by
            // its keys as they are now (edited poses, added keys, each key's own colour), then the paths
            // the morphs ride; the morphs as entries naming those shapes, with everything they have of
            // their own (rate, phase, spin, laps, times, eases, clip, trail, effect, lag, what they ride,
            // follow and face); the bar's settings and the clock's place beside them. Opened, it plays as
            // it played here. Not carried: corners turned by hand (the opened morph pairs its keys
            // itself), and where a parent was picked up from (it is measured from where it is drawn).
            function sceneOutlineOf(sp) {
                const lz = sp && sp._lazy;
                if (lz) {
                    if (lz.exact)
                        return exactDense(lz.x, lz.y, lzRoundBaked(lz), lz.open, lz.smooth, lzCtrlBaked(lz));
                    return { x: lz.x, y: lz.y };
                }
                return sp && sp.leafX && sp.leafX.length >= 2 ? { x: reconstruct1D(sp.leafX, 256), y: reconstruct1D(sp.leafY, 256) } : null;
            }
            function sceneOfEditor() {
                const runs = morphRuns.slice(),
                    items = [], // { sp } | { K, exact, run, k } | { P }
                    keysOf = new Map();
                const putKeys = run => {
                    const ids = run.keys.map((K, k) => {
                        items.push({ K, exact: !!run.exact, run, k });
                        return items.length - 1;
                    });
                    keysOf.set(run, ids);
                };
                for (const sp of state.subpaths) {
                    const run = runs.find(r => r.sp === sp);
                    if (run)
                        putKeys(run);
                    else if (sp && (sp._lazy || (sp.leafX && sp.leafX.length >= 2)))
                        items.push({ sp });
                }
                for (const run of runs)
                    if (!keysOf.has(run))
                        putKeys(run);
                const pathOf = new Map();
                for (const run of runs)
                    if (run.path) {
                        pathOf.set(run, items.length);
                        items.push({ P: run.path });
                    }
                const shared = morphLive.path ? items.push({ P: morphLive.path }) - 1 : null;
                if (!items.length)
                    return null;
                // each item's outline, in the page's units, for the box and for anything not exact
                const outline = it => {
                    if (it.sp)
                        return sceneOutlineOf(it.sp);
                    if (it.K)
                        return it.exact ? exactDenseOf(it.K) : { x: reconstruct1D(it.K.x, 256), y: reconstruct1D(it.K.y, 256) };
                    const S = it.P.member ? sceneOutlineOf(it.P.member) : null;
                    return S || it.P.src || { x: it.P.x, y: it.P.y };
                };
                let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
                const outs = items.map(outline);
                for (const O of outs)
                    if (O)
                        for (let i = 0; i < O.x.length; i++) {
                            x0 = Math.min(x0, O.x[i]);
                            x1 = Math.max(x1, O.x[i]);
                            y0 = Math.min(y0, O.y[i]);
                            y1 = Math.max(y1, O.y[i]);
                        }
                const cx = (x0 + x1) / 2,
                    cy = (y0 + y1) / 2,
                    sc = 900 / Math.max(1e-9, x1 - x0, y1 - y0);
                const M = [sc, 0, 0, -sc, 500 - cx * sc, 500 + cy * sc],
                    BX = X => Float64Array.from(X, x => M[0] * x + M[4]),
                    BY = Y => Float64Array.from(Y, y => M[3] * y + M[5]),
                    f2 = v => (+v).toFixed(2);
                // a leaf outline as cubics fitted within a third of a unit of the 1000 box, as the svg export
                // writes one (a tenth of the polygon's size); the polygon when the fit fails
                const fitD = O => {
                    const pts = [];
                    for (let i = 0; i < O.x.length; i++)
                        pts.push({ x: M[0] * O.x[i] + M[4], y: M[3] * O.y[i] + M[5] });
                    pts.push({ x: pts[0].x, y: pts[0].y });
                    try {
                        const segs = _fitCubics(pts, 0.3);
                        if (segs && segs.length)
                            return _cubicsToPathD(segs, 2);
                    } catch (_) {}
                    return polyD(O, false);
                };
                const polyD = (O, open) => {
                    let d = '';
                    for (let i = 0; i < O.x.length; i++)
                        d += (i ? 'L' : 'M') + f2(M[0] * O.x[i] + M[4]) + ' ' + f2(M[3] * O.y[i] + M[5]);
                    return d + (open ? '' : 'Z');
                };
                const exactD = lz => {
                    const R = lzRoundBaked(lz);
                    let d = exactSvgD(BX(lz.x), BY(lz.y), R ? R.map(r => r * sc) : null, lz.open, lz.smooth, ctrlMapped(lzCtrlBaked(lz), M));
                    for (const h of lzHolesBaked(lz) || [])
                        d += ' ' + exactSvgD(BX(h.x), BY(h.y), null, false, h.smooth, ctrlMapped(h.ctrl, M));
                    return d;
                };
                const hex = c => '#' + [c.r, c.g, c.b].map(v => _srgb(Math.max(0, Math.min(1, v))).toString(16).padStart(2, '0')).join('');
                // the shape as the editor draws it: its fill while fills are shown, and its outline whenever its
                // width is above 0, in its own colour or the editor's gold (a shape drawn here with no colour of its
                // own has the gold outline; written without it, a black maple opened as a black blob on the dark page)
                const styleOf = (sp, fill, open) => {
                    const F = !open && state.showFills !== false && fill && fill.color ? 'fill="' + fill.color + '"' + (fill.opacity != null && fill.opacity < 1 ? ' fill-opacity="' + (+fill.opacity).toFixed(3) + '"' : '') : 'fill="none"';
                    const sw = sp ? lineWidthOf(sp) : 0,
                        so = sp ? strokeOpacityOf(sp) : 1;
                    const S = sp && sw > 0 ? ' stroke="' + (sp.stroke || STROKE_DEFAULT) + '" stroke-width="' + sw + '"' + (so < 1 ? ' stroke-opacity="' + so + '"' : '') : '';
                    return F + S;
                };
                const els = items.map((it, i) => {
                    if (it.sp) {
                        const lz = it.sp._lazy,
                            open = !!(lz && lz.open);
                        const d = lz && lz.exact ? exactD(lz) : open ? polyD(outs[i], true) : fitD(outs[i]);
                        return '<path d="' + d + '" ' + styleOf(it.sp, it.sp.fill, open) + ' fill-rule="evenodd"/>';
                    }
                    if (it.K) {
                        const run = it.run,
                            K = it.K,
                            d = it.exact ? exactSvgD(BX(K.x), BY(K.y), hasRound(K.r) ? Array.from(K.r, r => r * sc) : null, false, null, ctrlMapped(hasCtrl(K.c) ? K.c : null, M)) : fitD(outs[i]);
                        const C = run.cols && run.cols[it.k],
                            fill = C ? { color: hex(C), opacity: C.a } : run.sp && run.sp.fill;
                        return '<path d="' + d + '" ' + styleOf(run.sp, fill, false) + ' fill-rule="evenodd"/>';
                    }
                    // a path the morphs ride: a line, so it is written open whatever it came from
                    const O = outs[i];
                    return '<path d="' + polyD(O, !it.P.closed) + '" fill="none" stroke="#888888" stroke-width="1"/>';
                });
                const r4 = v => +(+v).toFixed(4);
                const entryOf = new Map(runs.map((r, i) => [r, i]));
                const morphs = runs.map(run => {
                    const o = { keys: keysOf.get(run) };
                    if (run.inPlace === false)
                        o.inPlace = false;
                    if ((run.rate || 1) !== 1)
                        o.rate = run.rate;
                    if (run.phase)
                        o.phase = r4(run.phase);
                    if (run.spin)
                        o.spin = run.spin;
                    if (run.motion)
                        o.motion = Object.assign({}, run.motion); // PHYSICAL MOTIONS
                    const L = run.ontoLink; // CONTACT THAT FOLLOWS: the targets by their numbers in this link
                    if (L) {
                        const at = L.targets.map(sp => items.findIndex(it => it.sp === sp || (it.run && it.run.sp === sp && it.k === 0)));
                        if (at.every(i => i >= 0)) {
                            const raw = JSON.parse(JSON.stringify(L.raw)),
                                put = q => {
                                    if (q && q.onto != null)
                                        q.onto = at[q.onto];
                                };
                            put(raw);
                            (raw.steps || []).forEach(put);
                            o.motion = raw;
                        }
                    }
                    if (run.path) {
                        o.path = pathOf.get(run);
                        o.turn = run.path.turn !== false;
                        o.mode = run.path.mode === 'back' ? 'back' : 'along';
                        if ((run.laps || 1) !== 1)
                            o.laps = run.laps;
                        if (run.at != null)
                            o.at = r4(run.at);
                    }
                    if (run.times)
                        o.times = run.times.map(r4);
                    if (run.eases)
                        o.eases = run.eases.slice();
                    if (run.straight)
                        o.straight = true;
                    if (run.clip)
                        o.clip = morphClipOut(run.clip, r4);
                    if (run.trail)
                        o.trail = { kind: run.trail.kind || '', len: r4(run.trail.len) };
                    o.fx = run.fx && run.fx.kind ? { kind: run.fx.kind, amount: r4(run.fx.amount) } : { kind: '', amount: 0.5 };
                    if (run.lag)
                        o.lag = r4(run.lag);
                    if (run.parent && entryOf.has(run.parent))
                        o.parent = entryOf.get(run.parent);
                    if (run.follow)
                        o.follow = { kind: run.follow.kind, amount: r4(run.follow.amount) };
                    if (run.look && entryOf.has(run.look))
                        o.look = entryOf.get(run.look);
                    return o;
                });
                const name = String(state.svgName || 'drawing').replace(/^example · /, '');
                const d = {
                    v: 1,
                    name,
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">' + els.join('') + '</svg>',
                    exact: runs.every(r => r.exact),
                    corners: state.morphCorners !== false,
                    morphs,
                    loop: r4(1 / morphLive.speed),
                    t: r4(morphLive.t),
                    play: runs.length > 0,
                    lag: 0,
                };
                if (shared != null) {
                    d.path = shared;
                    d.turn = state.morphPathTurn !== false;
                    d.mode = state.morphPathMode === 'back' ? 'back' : 'along';
                }
                if (state.morphEase)
                    d.ease = state.morphEase;
                if (state.morphHold)
                    d.hold = r4(state.morphHold);
                if (morphGravity() !== 1) // SCENE-WIDE GRAVITY AND WIND
                    d.gravity = r4(morphGravity());
                if (morphWind())
                    d.wind = r4(morphWind());
                if (state.morphOnion)
                    d.onion = true;
                if (state.morphTrail)
                    d.trail = { kind: state.morphTrail, len: r4(state.morphTrailLen) };
                if (state.morphFx)
                    d.fx = { kind: state.morphFx, amount: r4(state.morphFxAmount) };
                // A CAMERA, AND STOPS: the camera's boxes in the file's own units (y down), as the drawing is
                const C = morphCameraOk(state.morphCamera);
                if (C.length)
                    d.camera = C.map(k => ({ t: r4(k.t), box: [M[0] * k.box[0] + M[4], M[3] * k.box[3] + M[5], M[0] * k.box[2] + M[4], M[3] * k.box[1] + M[5]].map(v => +v.toFixed(2)) }));
                const SP = morphStopsOk(state.morphStops);
                if (SP.length)
                    d.stops = SP.map(r4);
                const BT = morphBeatsOk(state.morphBeats, SP.length + 1); // AN EXPLAINER'S BEATS
                if (BT.some(b => b.title || b.text))
                    d.beats = BT;
                return d;
            }
            async function encodeScene(d) {
                const bytes = new TextEncoder().encode(JSON.stringify(d));
                let kind = 'r',
                    out = bytes;
                try {
                    const cs = new CompressionStream('deflate-raw');
                    out = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer());
                    kind = 'z';
                } catch (_) {}
                let bin = '';
                for (let i = 0; i < out.length; i += 0x8000)
                    bin += String.fromCharCode.apply(null, out.subarray(i, i + 0x8000));
                return kind + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }
            // the link and the embed code for what is on the page
            async function sceneShare() {
                const d = sceneOfEditor();
                if (!d)
                    return null;
                const code = await encodeScene(d),
                    page = new URL('draw.html', location.href);
                const link = page.href + '#scene=' + code;
                page.search = '?embed=1';
                const xmlEsc = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
                const embed = '<iframe src="' + page.href + '#scene=' + code + '" width="480" height="320" style="border:0;border-radius:8px" title="' + xmlEsc(d.name) + ', an animation made in the tvf leaf editor" loading="lazy"></iframe>';
                return { d, code, link, embed };
            }
            window.__sceneShare = sceneShare; // for the smoke test
            async function shareCopy(which) {
                let s = null;
                try {
                    s = await sceneShare();
                } catch (e) {
                    flashStatus('could not write the scene: ' + e.message);
                    return;
                }
                if (!s) {
                    flashStatus('nothing on the page to share');
                    return;
                }
                const text = which === 'embed' ? s.embed : s.link;
                let ok = false;
                try {
                    await navigator.clipboard.writeText(text);
                    ok = true;
                } catch (_) {}
                const kb = (text.length / 1024).toFixed(1) + ' kB';
                flashStatus(ok
                    ? (which === 'embed' ? 'embed code copied (' + kb + ') — paste it into a page: the editor plays the scene in an <iframe>, the canvas alone' : 'scene link copied (' + kb + ') — it opens this drawing in the editor, playing as it plays here')
                    : 'the browser would not let the page copy — try again after clicking the page');
            }
            const bLink = $('bMorphLink'),
                bEmbed = $('bMorphEmbed');
            if (bLink)
                bLink.addEventListener('click', () => shareCopy('link'));
            if (bEmbed)
                bEmbed.addEventListener('click', () => shareCopy('embed'));
            window.decodeScene = decodeScene; // for the smoke test
            window.openScene = openScene;
            window.applySceneMorphs = applySceneMorphs; // ANIMATE IT WITH AI
            window.sceneChangeRuns = sceneChangeRuns;
            function takeFromHash() {
                let h = '';
                try {
                    h = location.hash || '';
                } catch (_) {
                    return null;
                }
                const m = h.match(/(?:^#|&)scene=([^&]*)/);
                if (!m)
                    return null;
                const p = new URLSearchParams(h.replace(/^#/, ''));
                p.delete('scene');
                const rest = p.toString();
                try {
                    window.history.replaceState(null, '', location.pathname + location.search + (rest ? '#' + rest : ''));
                } catch (_) {}
                return m[1];
            }
            async function boot() {
                const code = takeFromHash();
                if (!code)
                    return;
                let d;
                try {
                    d = await decodeScene(code);
                } catch (e) {
                    flashStatus('example link did not decode — ' + (e.message || e));
                    console.warn('[scene link] decode failed', e);
                    return;
                }
                try {
                    await openScene(d);
                    if (EMBED) {
                        embedFit();
                        morphCameraFollow(); // A CAMERA: where it starts
                        drawAll();
                    }
                } catch (e) {
                    flashStatus('example did not open — ' + (e.message || e));
                    console.warn('[scene link] open failed', e);
                }
            }
            // THE EMBED fills its frame: the editor's own fit leaves room for its bars, which an embed has
            // none of, so the scene came out small in a gallery tile. Framed here on everything drawn,
            // and the paths the shapes ride, with a little margin, again whenever the frame is resized.
            function embedFit() {
                const w = cv.clientWidth,
                    h = cv.clientHeight;
                if (!(w > 0 && h > 0))
                    return;
                let x0 = Infinity,
                    y0 = Infinity,
                    x1 = -Infinity,
                    y1 = -Infinity;
                const take = (X, Y) => {
                    for (let i = 0; i < X.length; i++) {
                        x0 = Math.min(x0, X[i]);
                        x1 = Math.max(x1, X[i]);
                        y0 = Math.min(y0, Y[i]);
                        y1 = Math.max(y1, Y[i]);
                    }
                };
                for (const sp of state.subpaths)
                    if (!sp || sp._fade === 0) // out of sight (A CLIP SEEN ONLY WHEN IT PLAYS): not in the frame
                        continue;
                    else if (sp._lazy) // an exact shape's corners (never its leaves, which would turn it into leaves)
                        take(sp._lazy.x, sp._lazy.y);
                    else if (sp.leafX)
                        take(sp.leafX, sp.leafY);
                for (const P of [morphLive.path, ...morphRuns.map(r => r.path)])
                    if (P)
                        take(P.x, P.y);
                // every key of every morph, not only the pose it opens on: a morph between keys in different
                // places (a maple that turns into a star across the page) stays in the frame the whole loop
                const LEAVE = ['anticipate', 'overshoot', 'elastic'];
                for (const r of morphRuns)
                    if (!morphClipIO(r.clip))
                        for (const [k, K] of r.keys.entries()) {
                            take(K.x, K.y);
                            // ANTICIPATION AND OVERSHOOT: a pose goes up to about a sixth past a key, either way
                            if (r.keys.length > 1 && (LEAVE.includes(state.morphEase) || (r.eases || []).some(e => LEAVE.includes(e) || (Array.isArray(e) && (e[1] < 0 || e[1] > 1 || e[3] < 0 || e[3] > 1))))) {
                                const N = r.keys[(k + 1) % r.keys.length];
                                if (N !== K && N.x.length === K.x.length) {
                                    take(Float64Array.from(K.x, (v, i) => v + 0.16 * (v - N.x[i])), Float64Array.from(K.y, (v, i) => v + 0.16 * (v - N.y[i])));
                                    take(Float64Array.from(N.x, (v, i) => v + 0.16 * (v - K.x[i])), Float64Array.from(N.y, (v, i) => v + 0.16 * (v - K.y[i])));
                                }
                            }
                            // PHYSICAL MOTIONS: wherever the motion takes it over a cycle, sampled (a chain,
                            // a throw onto a shelf, a drift across the frame alike)
                            if (r.motion && !k)
                                for (let q = 0; q < 48; q++) {
                                    const MX = morphMotionXform(r, q / 48);
                                    if (!MX)
                                        break;
                                    const X = new Float64Array(K.x.length),
                                        Y = new Float64Array(K.x.length);
                                    for (let i = 0; i < X.length; i++)
                                        [X[i], Y[i]] = MX.at(K.x[i], K.y[i]);
                                    take(X, Y);
                                }
                        }
                if (!isFinite(x0))
                    return;
                const hR = state.hRun || 1,
                    bw = Math.max(1e-9, (x1 - x0) / hR),
                    bh = Math.max(1e-9, (y1 - y0) / hR);
                state.view.panX = (x0 + x1) / 2 / hR;
                state.view.panY = (y0 + y1) / 2 / hR;
                state.view.zoom = 0.94 * Math.min(w / bw, h / bh) / (Math.min(w, h) * 0.40);
                drawAll();
            }
            if (EMBED)
                window.addEventListener('resize', () => setTimeout(() => {
                    embedFit();
                    morphCameraFollow(); // A CAMERA: the frame's new shape, the camera's box
                    drawAll();
                }, 50));
            // STOPS IN THE EMBED: an explainer waits at each, and a click (or space, → or Enter) goes on, ← goes
            // back a stop. Only a scene with stops is clicked through; any other plays as it did.
            if (EMBED) {
                // on the click, after the editor's own pointer handling has had the press (which may pause
                // the clock to take an edit), so the click is the last word
                window.addEventListener('click', e => { // the whole frame is the scene (the canvas sits under the page's layout)
                    if (!morphRuns.length || !(state.morphStops && state.morphStops.length))
                        return;
                    e.preventDefault();
                    if (!morphLive.play)
                        morphStopGo(1);
                });
                window.addEventListener('keydown', e => {
                    if (!morphRuns.length || !(state.morphStops && state.morphStops.length))
                        return;
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        morphStopGo(-1);
                    } else if ((e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') && !morphLive.play) {
                        e.preventDefault();
                        morphStopGo(1);
                    }
                }, true);
            }
            // THE EMBED AS A CONVERTER (26 Oct 2026, Tom: "proceed with your recommendations": a light
            // player). A page of the same origin can hand an embed a scene and have its animated SVG
            // back: { type: 'tvf-scene-svg', id, code } in, { type: 'tvf-scene-svg', id, svg } out (svg null
            // when it could not). The SVG is the export (EXPORTING A MORPH): every motion as SMIL, no
            // script, so one hidden editor can turn a whole gallery of scenes into pictures that play on
            // their own, and a scene can leave the editor as a single file. Asked one at a time.
            if (EMBED)
                window.addEventListener('message', async e => {
                    const m = e.data;
                    if (e.origin !== location.origin || !m || m.type !== 'tvf-scene-svg' || typeof m.code !== 'string')
                        return;
                    let svg = null;
                    try {
                        const d = await decodeScene(m.code);
                        d.play = false;
                        if (await openScene(d)) {
                            morphLive.play = false;
                            morphLive.t = clamp(d.t, 0, 1, 0);
                            morphWrite();
                            svg = window.__box.morphSvg({});
                        }
                    } catch (err) {
                        console.warn('[embed] scene to svg failed', err);
                    }
                    (e.source || window.parent).postMessage({ type: 'tvf-scene-svg', id: m.id, svg }, location.origin);
                });
            // after the saved scene has restored, as the shape link waits
            if (document.readyState === 'complete')
                setTimeout(boot, 300);
            else
                window.addEventListener('load', () => setTimeout(boot, 300));
            window.addEventListener('hashchange', () => boot());
};
