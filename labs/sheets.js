// THE SHEETS, TWO FISHEYES ON ONE ARRAY, READERS WITHIN READERS (?lab=nsr, ?lab=stg, ?lab=ocb, ?lab=sgl, ?lab=cls,
// ?lab=cyc, ?lab=tfe), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, DEPTH, PI, TAU, flashStatus, hilbert, labLadder, pick, selectedIndices, state. It
// declares nothing the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['sheets'] = function () {
        // ═══ THE TWO SHEETS ════════════════════════════════════════════════════════
        // Both are readings, not constructions: they open over the page, touch no
        // state, and push no history. The closure sheet takes the SELECTED shape's
        // leaves as a closed sweep; the cycle sheet needs no shape at all.
        //
        // What they show is one idea in two settings. Between successive arrangements
        // sits one disagreement D; its radial half multiplies and its angular half
        // adds. Around a single closed sweep the radial half is FORCED home to 1 and
        // the angular half is not — which is the facing's independence, demonstrated.
        // Around a cycle of three or more parties neither is forced, and whether the
        // radial half comes home is exactly whether one ground could serve them all.
        // In the page this waited for DOMContentLoaded, which had passed long before this file arrives: it waits
        // instead for the end of its own file (labAfterLoad), as it used to wait for the end of the page's script.
        // The one change made to this code in moving it.
        labAfterLoad(function() {
            const SVGNS = 'http://www.w3.org/2000/svg',
                TAU = Math.PI * 2;
            const wrap = document.getElementById('sheetWrap');
            const stage = document.getElementById('sheetStage');
            const panel = document.getElementById('sheetPanel');
            const hint = document.getElementById('sheetHint');
            if (wrap && stage && panel) {

                const el = (tag, a) => {
                    const e = document.createElementNS(SVGNS, tag);
                    for (const k in a)
                        e.setAttribute(k, a[k]);
                    return e;
                };
                const fx = (v, d) => Number.isFinite(v) ? v.toFixed(d) : '—';
                const AZ = i => String.fromCharCode(65 + i);
                let mode = null,
                    teardown = [];
                function on(target, ev, fn) {
                    target.addEventListener(ev, fn);
                    teardown.push(() => target.removeEventListener(ev, fn));
                }

                function openSheet(which) {
                    closeSheet();
                    mode = which;
                    wrap.hidden = false;
                    ({
                        closure: startClosure,
                        cycle: startCycle,
                        fisheyes: startFisheyes,
                        nesting: startNesting,
                        strange: startStrange,
                        signals: startSignals,
                        octave: startOctave
                    })[which]();
                }
                function closeSheet() {
                    for (const f of teardown)
                        f();
                    teardown = [];
                    wrap.hidden = true;
                    stage.textContent = '';
                    panel.innerHTML = '';
                    hint.textContent = '';
                    mode = null;
                }
                document.getElementById('sheetClose').addEventListener('click', closeSheet);
                document.getElementById('sheetBack').addEventListener('click', closeSheet);
                window.addEventListener('keydown', e => {
                    if (mode && e.key === 'Escape') {
                        e.stopPropagation();
                        closeSheet();
                    }
                }, true);

                // ── THE CLOSURE SHEET ────────────────────────────────────────────────────
                function startClosure() {
                    // the selected shape's leaves, centred and normalised to the stage
                    const idx = (typeof selectedIndices === 'function' ? selectedIndices() : []);
                    let pts = null,
                        name = '';
                    for (const i of idx) {
                        const sp = state.subpaths[i];
                        if (sp && sp.leafX && sp.leafX.length >= 3) {
                            pts = {
                                x: sp.leafX,
                                y: sp.leafY
                            };
                            name = sp.name || ('shape ' + i);
                            break;
                        }
                    }
                    if (!pts)
                        for (let i = 0; i < state.subpaths.length; i++) {
                            const sp = state.subpaths[i];
                            if (sp && sp.leafX && sp.leafX.length >= 3) {
                                pts = {
                                    x: sp.leafX,
                                    y: sp.leafY
                                };
                                name = (sp.name || ('shape ' + i)) + ' (first on the page)';
                                break;
                            }
                        }
                    if (!pts) {
                        panel.innerHTML = '<h2>The closure sheet</h2><p class="sub">Nothing on the page has leaves to read. Draw or add a shape, select it, and open the sheet again.</p>';
                        return;
                    }

                    const n = pts.x.length;
                    const leaves = [];
                    let cx = 0,
                        cy = 0;
                    for (let k = 0; k < n; k++) {
                        cx += pts.x[k];
                        cy += pts.y[k];
                    }
                    cx /= n;
                    cy /= n;
                    let rmax = 1e-9;
                    for (let k = 0; k < n; k++)
                        rmax = Math.max(rmax, Math.hypot(pts.x[k] - cx, pts.y[k] - cy));
                    for (let k = 0; k < n; k++)
                        leaves.push([(pts.x[k] - cx) / rmax, (pts.y[k] - cy) / rmax]);

                    const CX = 350,
                        CY = 350,
                        S = 240;
                    const px = p => [CX + p[0] * S, CY - p[1] * S];
                    const world = (sx, sy) => ({
                        x: (sx - CX) / S,
                        y: (CY - sy) / S
                    });
                    let sp0 = {
                            x: 0,
                            y: 0
                        },
                        baseSum = null,
                        bySign = true,
                        spokes = false;

                    panel.innerHTML =
                    '<h2>The closure sheet</h2><p class="sub">' + name + ' — ' + n + ' leaves, read as a closed sweep from one standpoint. Between successive arrangements sits one disagreement.</p>' +
                    '<div class="eyebrow">display</div>' +
                    '<div class="btns"><button id="shSign" aria-pressed="true">turning one way, or the other</button><button id="shSpokes" aria-pressed="false">draw the spokes</button></div>' +
                    '<div class="eyebrow">the disagreement</div>' +
                    '<div class="row"><span class="k">Σ D = 2 × signed area</span><span class="v gold" id="shSum">—</span></div>' +
                    '<div class="row"><span class="k">moving the standpoint</span><span class="v gold" id="shInv">—</span></div>' +
                    '<div class="row"><span class="k">sign changes in D</span><span class="v" id="shZero">—</span></div>' +
                    '<p class="note">D is zero exactly when two successive arrangements are proportional — the pair changed size and nothing else. Its sign is the side. <b>The area is accumulated disagreement</b>, and it does not move when the standpoint does.</p>' +
                    '<div class="eyebrow">the two accumulations</div>' +
                    '<div class="row"><span class="k">Π ρ — the reading</span><span class="v teal" id="shProd">—</span></div>' +
                    '<div class="row"><span class="k">Σ Δθ — the facing</span><span class="v violet" id="shTurn">—</span></div>' +
                    '<div class="row"><span class="k">winding</span><span class="v violet" id="shWind">—</span></div>' +
                    '<p class="note">Both are read off the same D. The radial half multiplies around the loop; the angular half adds. <b>One is forced to return. The other is not.</b></p>' +
                    '<div class="verdict" id="shVerdict">—</div>';
                    hint.textContent = 'drag the standpoint · the reading closes, the facing counts';

                    const measure = () => {
                        const o = sp0,
                            m = leaves.length;
                        const D = new Float64Array(m);
                        let sum = 0,
                            logp = 0,
                            turn = 0,
                            zeros = 0,
                            degen = false;
                        for (let k = 0; k < m; k++) {
                            const a = leaves[k],
                                b = leaves[(k + 1) % m];
                            const ax = a[0] - o.x,
                                ay = a[1] - o.y,
                                bx = b[0] - o.x,
                                by = b[1] - o.y;
                            const d = ax * by - bx * ay,
                                dot = ax * bx + ay * by;
                            const ra = Math.hypot(ax, ay),
                                rb = Math.hypot(bx, by);
                            if (ra < 1e-9 || rb < 1e-9)
                                degen = true;
                            D[k] = d;
                            sum += d;
                            logp += Math.log(rb / (ra || 1e-12));
                            turn += Math.atan2(d, dot);
                            if (k > 0 && Math.sign(D[k]) !== Math.sign(D[k - 1]))
                                zeros++;
                        }
                        return {
                            D,
                            sum,
                            prod: Math.exp(logp),
                            turn,
                            zeros,
                            degen
                        };
                    };

                    const draw = () => {
                        const m = measure();
                        stage.textContent = '';
                        if (spokes) {
                            const g = el('g', {
                                opacity: '0.20'
                            });
                            const [ox, oy] = px([sp0.x, sp0.y]);
                            const step = Math.max(1, Math.round(leaves.length / 64));
                            for (let k = 0; k < leaves.length; k += step) {
                                const [x, y] = px(leaves[k]);
                                g.appendChild(el('line', {
                                    x1: ox,
                                    y1: oy,
                                    x2: x,
                                    y2: y,
                                    stroke: '#8ce6cd',
                                    'stroke-width': '0.6'
                                }));
                            }
                            stage.appendChild(g);
                        }
                        const g = el('g', {
                            fill: 'none',
                            'stroke-width': '2',
                            'stroke-linecap': 'round'
                        });
                        for (let k = 0; k < leaves.length; k++) {
                            const [x1, y1] = px(leaves[k]),
                                [x2, y2] = px(leaves[(k + 1) % leaves.length]);
                            g.appendChild(el('line', {
                                x1,
                                y1,
                                x2,
                                y2,
                                stroke: bySign ? (m.D[k] >= 0 ? '#d4a052' : '#a585c4') : '#c8c8d0'
                            }));
                        }
                        stage.appendChild(g);
                        const [sx, sy] = px([sp0.x, sp0.y]);
                        stage.appendChild(el('circle', {
                            cx: sx,
                            cy: sy,
                            r: '13',
                            fill: 'rgba(140,230,205,0.10)',
                            stroke: '#8ce6cd',
                            'stroke-width': '1'
                        }));
                        stage.appendChild(el('circle', {
                            cx: sx,
                            cy: sy,
                            r: '3',
                            fill: '#8ce6cd'
                        }));

                        if (baseSum === null)
                            baseSum = m.sum;
                        document.getElementById('shSum').textContent = fx(m.sum, 4);
                        document.getElementById('shInv').textContent = Math.abs(m.sum - baseSum) < 1e-6 ? 'no change' : fx(m.sum - baseSum, 4);
                        document.getElementById('shZero').textContent = m.zeros;
                        document.getElementById('shProd').textContent = fx(m.prod, 6);
                        document.getElementById('shTurn').textContent = fx(m.turn, 4) + ' rad';
                        const w = m.turn / TAU;
                        document.getElementById('shWind').textContent = Math.abs(w - Math.round(w)) < 0.02 ? Math.round(w) : fx(w, 2);
                        const wound = Math.abs(w) > 0.02;
                        document.getElementById('shVerdict').innerHTML = m.degen
                        ? 'The standpoint is <b>on the contour</b>. A leaf at zero offset has no terms to state the next one in — the reading fails, exactly as at the far end.'
                        : 'The reading returned to ' + fx(m.prod, 6) + ' — <b>closed</b>, as it must be, whatever the standpoint. The facing accumulated ' + fx(m.turn, 3) +
                        ' radians: <b>' + (wound ? 'the sweep enclosed the standpoint ' + Math.abs(Math.round(w)) + ' time' + (Math.abs(Math.round(w)) === 1 ? '' : 's') : 'the sweep did not enclose the standpoint') +
                        '</b>. Same D, two accumulations, and only one of them was obliged to come home.';
                    };

                    const bS = document.getElementById('shSign'),
                        bK = document.getElementById('shSpokes');
                    on(bS, 'click', () => {
                        bySign = !bySign;
                        bS.setAttribute('aria-pressed', bySign);
                        draw();
                    });
                    on(bK, 'click', () => {
                        spokes = !spokes;
                        bK.setAttribute('aria-pressed', spokes);
                        draw();
                    });

                    let dragging = false;
                    const at = e => {
                        const r = stage.getBoundingClientRect();
                        return world((e.clientX - r.left) * 700 / r.width, (e.clientY - r.top) * 700 / r.height);
                    };
                    on(stage, 'pointerdown', e => {
                        dragging = true;
                        sp0 = at(e);
                        draw();
                        e.preventDefault();
                    });
                    on(window, 'pointermove', e => {
                        if (!dragging)
                            return;
                        sp0 = at(e);
                        draw();
                        e.preventDefault();
                    });
                    on(window, 'pointerup', () => {
                        dragging = false;
                    });
                    draw();
                }

                // ── READERS WITHIN READERS, THE STRANGE TIER, SIGNALS AS LANDSCAPES (5 Oct 2026) ──
                // Three sheets on one rule (the engine is nestRun / sigRun, outside this scope): a
                // child reader stands where its parent saw furthest, from the parent's own record.
                // wander/patho/NST.md, STR.md, SIG.md.
                const NEST_SHAPES = [['spiral3', 'pathological'], ['spiral4', 'pathological'], ['spiral5', 'pathological'],
                ['curled4', 'pathological'], ['curled5', 'pathological']].concat(STRANGE_KEYS.map(k => [k, 'strange']));
                let nestPick = 'spiral5';
                const _nestCache = {};
                function nestShape(key) {
                    if (_nestCache[key])
                        return _nestCache[key];
                    const m = key.match(/^(spiral|curled)(\d)$/);
                    const raw = m ? pathoShape(m[1], +m[2], 1024) : strangeShape(key);
                    return ( _nestCache[key] = _shapePrep(raw)) ;
                }
                const runsOf = (n, colourAt) => {
                    // consecutive points sharing a colour → one polyline each
                    const runs = [];
                    let cur = null;
                    for (let i = 0; i <= n; i++) {
                        const c = colourAt(i % n);
                        if (!cur || cur.c !== c) {
                            if (cur)
                                cur.idx.push(i % n);
                            cur = {
                                c,
                                idx: [i % n]
                            };
                            runs.push(cur);
                        } else
                            cur.idx.push(i % n);
                    }
                    return runs;
                };

                function startNesting() {
                    let P = nestShape(nestPick),
                        mode = 'outside',
                        pt = null,
                        res = null,
                        show = 99,
                        busy = false;
                    const CX = 350,
                        CY = 350,
                        S = 150;
                    const px = p => [CX + p.x * S, CY - p.y * S],
                        world = (sx, sy) => ({
                            x: (sx - CX) / S,
                            y: (CY - sy) / S
                        });
                    panel.innerHTML =
                    '<h2>Readers within readers</h2><p class="sub">Each child reader stands where its parent saw furthest, 3% short of the meeting, taken from the parent\'s own record. Up to three children a parent. The outline is coloured by the <b>level</b> of the reader that first sees each part of it; grey is never seen. Meeting distances are exact: this shows where standpoints must be.</p>' +
                    '<div class="eyebrow">shape</div><div class="btns" id="nsPick"></div>' +
                    '<div class="eyebrow">the first reader</div><div class="btns"><button id="nsOut">16 outside, 32 h away</button><button id="nsPt">one: tap the stage</button></div>' +
                    '<div class="eyebrow">show up to level</div><input type="range" id="nsShow" min="0" max="10" value="10"><div class="row"><span class="k">level shown</span><span class="v" id="nsShowV">all</span></div>' +
                    '<div class="eyebrow">the reading</div>' +
                    '<div class="row"><span class="k">levels to see it all</span><span class="v gold" id="nsLev">—</span></div>' +
                    '<div class="row"><span class="k">readers</span><span class="v" id="nsN">—</span></div>' +
                    '<div class="row"><span class="k">never seen</span><span class="v" id="nsUn">—</span></div>' +
                    '<div class="row"><span class="k">seen, by level</span><span class="v teal" id="nsCov" style="text-align:right">—</span></div>' +
                    '<p class="note">From outside, the levels step down each channel one stretch at a time: <b>the harder a part is to see, the deeper in the recursion it sits.</b> From inside a winding shape, the chain works out to the mouth and no further: rays into open space meet nothing, so there is nowhere to stand next.</p>' +
                    '<div class="verdict" id="nsVerdict">—</div>';
                    const pick = document.getElementById('nsPick');
                    for (const [k] of NEST_SHAPES) {
                        const b = document.createElement('button');
                        b.textContent = k.replace(/_/g, ' ');
                        b.setAttribute('aria-pressed', k === nestPick);
                        pick.appendChild(b);
                        on(b, 'click', () => {
                            nestPick = k;
                            P = nestShape(k);
                            for (const c of pick.children)
                                c.setAttribute('aria-pressed', c === b);
                            if (mode === 'point')
                                pt = null;
                            compute();
                        });
                    }
                    const bO = document.getElementById('nsOut'),
                        bP = document.getElementById('nsPt'),
                        sh = document.getElementById('nsShow');
                    const setMode = m => {
                        mode = m;
                        bO.setAttribute('aria-pressed', m === 'outside');
                        bP.setAttribute('aria-pressed', m === 'point');
                    };
                    on(bO, 'click', () => {
                        setMode('outside');
                        compute();
                    });
                    on(bP, 'click', () => {
                        setMode('point');
                        res = null;
                        draw();
                        hint.textContent = 'tap or drag on the stage to place the first reader';
                    });
                    on(sh, 'input', () => {
                        show = +sh.value;
                        draw();
                    });

                    const draw = () => {
                        stage.textContent = '';
                        const n = P.length,
                            lv = i => res ? res.lvl[Math.floor(i / res.step)] : -1;
                        const colour = i => {
                            const L = lv(i);
                            return (L < 0 || L > show) ? NEST_UNSEEN : NEST_PAL[Math.min(L, NEST_PAL.length - 1)];
                        };
                        for (const r of runsOf(n, colour)) {
                            const d = r.idx.map(i => px(P[i])).map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' ');
                            stage.appendChild(el('polyline', {
                                points: d,
                                fill: 'none',
                                stroke: r.c,
                                'stroke-width': r.c === NEST_UNSEEN ? '1.4' : '2.6',
                                'stroke-linecap': 'round'
                            }));
                        }
                        if (res)
                            for (const r of res.readers) {
                                if (r.L > show)
                                    continue;
                                let [x, y] = px(r);
                                const edge = x < 8 || x > 692 || y < 8 || y > 692;
                                x = Math.max(8, Math.min(692, x));
                                y = Math.max(8, Math.min(692, y));
                                stage.appendChild(el('circle', {
                                    cx: x,
                                    cy: y,
                                    r: edge ? '4' : '2.4',
                                    fill: edge ? 'none' : NEST_PAL[Math.min(r.L, 10)],
                                    stroke: NEST_PAL[Math.min(r.L, 10)],
                                    'stroke-width': '1'
                                }));
                            }
                        if (mode === 'point' && pt) {
                            const [x, y] = px(pt);
                            stage.appendChild(el('circle', {
                                cx: x,
                                cy: y,
                                r: '9',
                                fill: 'none',
                                stroke: '#d4a052',
                                'stroke-width': '1.2'
                            }));
                        }
                        const lab = el('text', {
                            x: 16,
                            y: 26,
                            fill: '#6e6e7a',
                            'font-size': '12',
                            'font-family': 'DM Mono, monospace'
                        });
                        lab.textContent = nestPick.replace(/_/g, ' ') + (mode === 'outside' ? ' · first readers outside (rings at the edge)' : ' · first reader at the gold ring');
                        stage.appendChild(lab);
                    };
                    const report = () => {
                        const V = id => document.getElementById(id),
                            pc = x => (100 * x).toFixed(0);
                        if (!res) {
                            for (const id of ['nsLev', 'nsN', 'nsUn', 'nsCov'])
                                V(id).textContent = '—';
                            return;
                        }
                        const last = res.hist[res.hist.length - 1],
                            done = res.hist.find(h => h[2] >= 0.99);
                        let un = 0;
                        for (const v of res.lvl)
                            if (v < 0)
                                un++;
                        V('nsLev').textContent = done ? done[0] : 'not all (' + pc(last[2]) + '% by level ' + last[0] + ')';
                        V('nsN').textContent = last[1];
                        V('nsUn').textContent = un ? pc(un / res.lvl.length) + '%' : 'none';
                        V('nsCov').textContent = res.hist.map(h => pc(h[2])).join(' · ');
                        sh.max = String(last[0]);
                        if (show > last[0]) {
                            show = last[0];
                        }
                        sh.value = String(show);
                        V('nsShowV').textContent = show >= last[0] ? 'all' : show;
                        V('nsVerdict').innerHTML = done
                        ? 'Seen whole after <b>' + done[0] + ' level' + (done[0] === 1 ? '' : 's') + '</b> of readers within readers, ' + done[1] + ' readers in all.'
                        : (un ? 'The chain stopped with <b>' + pc(un / res.lvl.length) + '% never seen</b>. ' + (mode === 'point' ? 'From inside, rays into open space meet nothing, so the record has nowhere out there to send a child.' : '') : 'Not complete by level ' + last[0] + '.');
                    };
                    const compute = () => {
                        if (busy)
                            return;
                        if (mode === 'point' && !pt) {
                            res = null;
                            draw();
                            report();
                            return;
                        }
                        if (mode === 'point' && _inside(P, pt.x, pt.y)) {
                            res = null;
                            draw();
                            report();
                            document.getElementById('nsVerdict').innerHTML = 'That point is <b>inside the material</b>. Pick a point in the open.';
                            return;
                        }
                        busy = true;
                        document.getElementById('nsVerdict').textContent = 'reading…';
                        setTimeout(() => {
                            try {
                                res = nestRun(P, mode === 'outside' ? nestOutsideStarts() : [pt], 10, 2);
                                show = 99;
                            }
                            finally {
                                busy = false;
                            }
                            draw();
                            report();
                        }, 20);
                    };
                    let dragging = false;
                    const at = e => {
                        const r = stage.getBoundingClientRect();
                        return world((e.clientX - r.left) * 700 / r.width, (e.clientY - r.top) * 700 / r.height);
                    };
                    on(stage, 'pointerdown', e => {
                        setMode('point');
                        dragging = true;
                        pt = at(e);
                        res = null;
                        draw();
                        report();
                        e.preventDefault();
                    });
                    on(window, 'pointermove', e => {
                        if (!dragging)
                            return;
                        pt = at(e);
                        draw();
                        e.preventDefault();
                    });
                    on(window, 'pointerup', () => {
                        if (!dragging)
                            return;
                        dragging = false;
                        compute();
                    });
                    hint.textContent = 'tap or drag on the stage to stand the first reader there · the outside button puts 16 readers 32 h away';
                    setMode('outside');
                    draw();
                    compute();
                }

                function startStrange() {
                    const PY = {
                        hilbert: [7, 46],
                        cave: [6, 41],
                        double_spiral: [4, 57],
                        coral: [4, 63],
                        hooked_comb: [4, 64],
                        fjords: [3, 50],
                        pinwheel: [3, 62],
                        spiral_of_spirals: [3, 73]
                    };
                    panel.innerHTML =
                    '<h2>The strange tier</h2><p class="sub">Eight outlines with many hidden sides: every pocket open to the outside, no enclosed holes, no corners (softened on a grid, then traced as one closed outline). Tap one to read it in <b>readers within readers</b>.</p>' +
                    '<div class="btns"><button id="stPage">put them on the page</button><button id="stNest">readers within readers</button></div>' +
                    '<div class="eyebrow">levels and flat control: the Python run (STR)</div><div id="stTab"></div>' +
                    '<p class="note">*Entries into the four facings, counted here at 1,024 points (the Python counts, at 4,096, differ by a few).</p><p class="note"><b>Levels count how many times the way in turns out of sight</b>, not how complicated the outline is. The deepest have pockets inside pockets (hilbert) or a long bending corridor (cave). spiral of spirals looks strangest and is shallow: its small spirals sit in the open. Entries into the four facings do not predict the levels (rank correlation 0.01).</p>';
                    const tab = document.getElementById('stTab');
                    tab.innerHTML = '<div class="row"><span class="k">shape</span><span class="k">levels · flat control · entries*</span></div>' +
                    STRANGE_KEYS.map(k => '<div class="row"><span class="k">' + k.replace(/_/g, ' ') + '</span><span class="v">' + PY[k][0] + ' · ' + PY[k][1] + '% · ' + facingEntries(nestShape(k)) + '</span></div>').join('');
                    stage.textContent = '';
                    STRANGE_KEYS.forEach((k, i) => {
                        const P = nestShape(k),
                            cx = 87.5 + 175 * (i % 4),
                            cy = 210 + 260 * Math.floor(i / 4),
                            s = 36;
                        const g = el('g', {
                            style: 'cursor:pointer'
                        });
                        g.appendChild(el('rect', {
                            x: cx - 84,
                            y: cy - 90,
                            width: 168,
                            height: 200,
                            fill: 'transparent'
                        }));
                        g.appendChild(el('polygon', {
                            points: P.map(p => (cx + p.x * s).toFixed(1) + ',' + (cy - p.y * s).toFixed(1)).join(' '),
                            fill: 'rgba(200,200,208,0.10)',
                            stroke: '#c8c8d0',
                            'stroke-width': '1.2'
                        }));
                        const t = el('text', {
                            x: cx,
                            y: cy + 98,
                            fill: '#6e6e7a',
                            'font-size': '12',
                            'text-anchor': 'middle',
                            'font-family': 'DM Mono, monospace'
                        });
                        t.textContent = k.replace(/_/g, ' ') + ' · L' + PY[k][0];
                        g.appendChild(t);
                        on(g, 'click', () => {
                            nestPick = k;
                            openSheet('nesting');
                        });
                        stage.appendChild(g);
                    });
                    on(document.getElementById('stNest'), 'click', () => {
                        nestPick = 'hilbert';
                        openSheet('nesting');
                    });
                    on(document.getElementById('stPage'), 'click', () => {
                        closeSheet();
                        labLadder({
                            rows: STRANGE_KEYS.map(k => ({
                                key: k,
                                pts: nestShape(k),
                                loopN: 512
                            })),
                            name: 'the strange tier',
                            stroke: '#c8c8d0',
                            caption: r => r.key.replace(/_/g, ' ') + '\nentries ' + facingEntries(r.pts) + ' · levels ' + PY[r.key][0]
                        });
                        flashStatus('the strange tier · eight shapes on the page, ordinary shapes now: open any in the edit view');
                    });
                    hint.textContent = 'tap a shape to read it with readers within readers';
                }

                function startSignals() {
                    const SIGS = sigSignals(),
                        names = Object.keys(SIGS);
                    let name = 'sine, period 4 h',
                        start = 0,
                        res = null,
                        busy = false;
                    const X0 = 30,
                        W = 640,
                        Y0 = 430,
                        V = 80,
                        sx = x => X0 + x / SIG_X * W,
                        sy = y => Y0 - y * V;
                    panel.innerHTML =
                    '<h2>Signals as landscapes</h2><p class="sub">The signal read the way Recovering the Bump reads it: each reader stands at <b>h above the line</b> and reads both facings. Peaks hide what lies behind them. A child stands where its parent\'s ray clears a crest and lands far beyond it. Every reader holds the same h. Heights are drawn ×8.</p>' +
                    '<div class="eyebrow">signal</div><div class="btns" id="sgPick"></div>' +
                    '<div class="eyebrow">the reading</div>' +
                    '<div class="row"><span class="k">levels to see it all</span><span class="v gold" id="sgLev">—</span></div>' +
                    '<div class="row"><span class="k">readers</span><span class="v" id="sgN">—</span></div>' +
                    '<div class="row"><span class="k">hand-off, median</span><span class="v" id="sgHand">—</span></div>' +
                    '<div class="row"><span class="k">seen, by level</span><span class="v teal" id="sgCov" style="text-align:right">—</span></div>' +
                    '<p class="note">On a signal the recursion runs <b>along</b> it, as a relay: each crest between the reader and a stretch hides it once more and costs about one more standpoint. The hand-offs follow the signal\'s crest spacing, not the reader, so no octave of the reader shows here; that needs readers that take their own h.</p>';
                    const pick = document.getElementById('sgPick');
                    for (const k of names) {
                        const b = document.createElement('button');
                        b.textContent = k;
                        b.setAttribute('aria-pressed', k === name);
                        pick.appendChild(b);
                        on(b, 'click', () => {
                            name = k;
                            for (const c of pick.children)
                                c.setAttribute('aria-pressed', c === b);
                            compute();
                        });
                    }
                    const draw = () => {
                        stage.textContent = '';
                        const s = SIGS[name];
                        stage.appendChild(el('line', {
                            x1: X0,
                            y1: sy(SIG_H),
                            x2: X0 + W,
                            y2: sy(SIG_H),
                            stroke: 'rgba(255,255,255,0.08)',
                            'stroke-dasharray': '3 4'
                        }));
                        stage.appendChild(el('line', {
                            x1: X0,
                            y1: sy(0),
                            x2: X0 + W,
                            y2: sy(0),
                            stroke: 'rgba(255,255,255,0.05)'
                        }));
                        const colour = i => {
                            const L = res ? res.lvl[i] : -1;
                            return L < 0 ? NEST_UNSEEN : NEST_PAL[Math.min(L, 10)];
                        };
                        const runs = [];
                        let cur = null;
                        for (let i = 0; i < SIG_M; i++) {
                            const c = colour(i);
                            if (!cur || cur.c !== c) {
                                if (cur)
                                    cur.idx.push(i);
                                cur = {
                                    c,
                                    idx: [i]
                                };
                                runs.push(cur);
                            } else
                                cur.idx.push(i);
                        }
                        for (const r of runs)
                            stage.appendChild(el('polyline', {
                                points: r.idx.map(i => sx(sigX(i)).toFixed(1) + ',' + sy(s[i]).toFixed(1)).join(' '),
                                fill: 'none',
                                stroke: r.c,
                                'stroke-width': r.c === NEST_UNSEEN ? '1.2' : '2',
                                'stroke-linejoin': 'round'
                            }));
                        if (res)
                            for (const r of res.readers) {
                                const x = sx(r.x),
                                    y = sy(SIG_H);
                                stage.appendChild(el('polygon', {
                                    points: `${x - 3},${y - 5} ${x + 3},${y - 5} ${x},${y + 1}`,
                                    fill: NEST_PAL[Math.min(r.L, 10)]
                                }));
                            }
                        const x = sx(start),
                            y = sy(SIG_H);
                        stage.appendChild(el('circle', {
                            cx: x,
                            cy: y - 2,
                            r: '9',
                            fill: 'none',
                            stroke: '#d4a052',
                            'stroke-width': '1.2'
                        }));
                        const t = el('text', {
                            x: X0,
                            y: Y0 - 150,
                            fill: '#6e6e7a',
                            'font-size': '12',
                            'font-family': 'DM Mono, monospace'
                        });
                        t.textContent = name + ' · 64 h long · the dashed line is h above the line';
                        stage.appendChild(t);
                        for (let k = 0; k <= 64; k += 16) {
                            const tk = el('text', {
                                x: sx(k),
                                y: Y0 + 70,
                                fill: '#4e4e58',
                                'font-size': '10',
                                'text-anchor': 'middle',
                                'font-family': 'DM Mono, monospace'
                            });
                            tk.textContent = k + ' h';
                            stage.appendChild(tk);
                        }
                    };
                    const report = () => {
                        const E = id => document.getElementById(id),
                            pc = x => (100 * x).toFixed(0);
                        if (!res)
                            return;
                        const last = res.hist[res.hist.length - 1],
                            done = res.hist.find(h => h[2] >= 0.999);
                        E('sgLev').textContent = done ? done[0] : 'stalls at ' + (100 * last[2]).toFixed(1) + '%';
                        E('sgN').textContent = last[1];
                        const hs = res.hand.slice().sort((a, b) => a - b);
                        E('sgHand').textContent = hs.length ? hs[hs.length >> 1].toFixed(1) + ' h' : '—';
                        E('sgCov').textContent = res.hist.map(h => pc(h[2])).join(' · ');
                    };
                    const compute = () => {
                        if (busy)
                            return;
                        busy = true;
                        E0('sgLev', 'reading…');
                        setTimeout(() => {
                            try {
                                res = sigRun(SIGS[name], start, 12);
                            } finally {
                                busy = false;
                            }
                            draw();
                            report();
                        }, 20);
                    };
                    const E0 = (id, t) => {
                        const e = document.getElementById(id);
                        if (e)
                            e.textContent = t;
                    };
                    let dragging = false;
                    const at = e => {
                        const r = stage.getBoundingClientRect();
                        const X = (e.clientX - r.left) * 700 / r.width;
                        return Math.max(0, Math.min(SIG_X, (X - X0) / W * SIG_X));
                    };
                    on(stage, 'pointerdown', e => {
                        dragging = true;
                        start = at(e);
                        res = null;
                        draw();
                        e.preventDefault();
                    });
                    on(window, 'pointermove', e => {
                        if (!dragging)
                            return;
                        start = at(e);
                        draw();
                        e.preventDefault();
                    });
                    on(window, 'pointerup', () => {
                        if (!dragging)
                            return;
                        dragging = false;
                        compute();
                    });
                    hint.textContent = 'tap or drag along the signal to stand the first reader there';
                    draw();
                    compute();
                }

                // ── THE OCTAVE BROWSER, FOR A SHAPE (5 Oct 2026) ─────────────────────────────────
                // Launch from Somewhere's lay (wander/launch-from-somewhere.html), turned on a shape.
                // The reader stands on the ground at the lower left and reads one facing: home straight
                // ahead along the ground, the corner at v = h, the mathematical horizon straight up.
                // UP the screen is the reading v/h, laid as the game lays it: the bottom half in
                // proportion from home to the corner, the top half h/v from the corner, its octaves each
                // half the one below. ACROSS is depth, laid the same way: in proportion out to one h,
                // inverted past it. A drag pans the world through the octaves of both (up and down: the
                // reading's; sideways: depth's); a tap makes the octaves under it active, and draws their
                // own octaves inside them and their corners. On each of the reader's own bars (16 a
                // octave) the browser marks where the bar first meets the outline: what the reader holds.
                // The whole outline is drawn faint, its hidden parts dashed.
                let octaveFromPage = false; // set by the toolbar button: open on the page's selected shape
                function startOctave() {
                    const N = 16,
                        NOCT = 9,
                        ROWS = [];
                    for (let k = 0; k <= N; k++)
                        ROWS.push(k / N);
                    for (let m = 0; m < NOCT; m++) {
                        const hi = 2 ** -m,
                            lo = hi / 2;
                        for (let j = N - 1; j >= 0; j--)
                            ROWS.push(1 / (lo + (hi - lo) * j / N));
                    }
                    const X0 = 40,
                        Y0 = 668,
                        HW = 312,
                        HH = 312,
                        MIDX = X0 + HW,
                        MIDY = Y0 - HH;
                    const yRead = r => r <= 1 ? Y0 - r * HH : MIDY - (1 - 1 / r) * HH;
                    const xRead = r => r <= 1 ? X0 + r * HW : MIDX + (1 - 1 / r) * HW;
                    const rOfY = py => py >= MIDY ? (Y0 - py) / HH : 1 / Math.max(1e-9, 1 - (MIDY - py) / HH);
                    const rOfX = px => px <= MIDX ? (px - X0) / HW : 1 / Math.max(1e-9, 1 - (px - MIDX) / HW);
                    let key = octaveFromPage && state.subpaths.some(sp => sp && sp.leafX && sp.leafX.length >= 3) ? 'page' : (nestPick || 'spiral5');
                    octaveFromPage = false;
                    let D = 12,
                        r0 = 1,
                        turn = 0,
                        panR = 0,
                        panD = Math.log2(12),
                        path = [],
                        actD = null,
                        whole = true,
                        bars = true;
                    const half = tbLeaves(32),
                        SS = half.slice().reverse().map(s => -s).concat(half),
                        ROT = [];
                    for (let i = 0; i < SS.length; i += 2) {
                        const s = SS[i];
                        ROT.push([(1 - s * s) / (1 + s * s), 2 * s / (1 + s * s)]);
                    }
                    const pageShape = () => {
                        const idx = (typeof selectedIndices === 'function' ? selectedIndices() : []);
                        for (const j of idx.concat(state.subpaths.map((_, i) => i))) {
                            const sp = state.subpaths[j];
                            if (sp && sp.leafX && sp.leafX.length >= 3)
                                return _shapePrep(Array.from(sp.leafX, (x, i) => ({
                                    x,
                                    y: sp.leafY[i]
                                })));
                        }
                        return null;
                    };
                    let P = null; // the outline in the reader's world: z ahead, y up (reader at the origin)
                    const place = () => {
                        const Q = key === 'page' ? pageShape() : nestShape(key);
                        if (!Q) {
                            P = null;
                            return;
                        }
                        const [c, sn] = ROT[turn],
                            n = Math.hypot(1, r0),
                            cz = D / n,
                            cy = D * r0 / n;
                        P = Q.map(p => ({
                            x: cz + c * p.x - sn * p.y,
                            y: cy + sn * p.x + c * p.y
                        }));
                    };
                    panel.innerHTML =
                    '<h2>The octave browser</h2><p class="sub">Launch from Somewhere\'s lay, on a shape. The reader stands at the lower left. <b>Up</b>: the reading v/h, in proportion to the corner, then octaves halving above it. <b>Across</b>: distance in h\'s, in proportion to one h, then inverted. <b>Gold</b>: where each of the reader\'s bars first meets the outline. A tap <b>enters</b> the octave under it: a whole sweep of 16 bars again inside it (R180), its meetings in that level\'s colour; tap inside it to enter the next. Faint: the whole outline, hidden parts dashed.</p>' +
                    '<div class="eyebrow">shape</div><div class="btns" id="obPick"></div>' +
                    '<div class="eyebrow">where it stands</div>' +
                    '<div class="row"><span class="k">distance</span><span class="v" id="obDv">—</span></div><input type="range" id="obD" min="0" max="100" value="40">' +
                    '<div class="row"><span class="k">reading of its centre</span><span class="v" id="obRv">—</span></div><input type="range" id="obR" min="0" max="100" value="50">' +
                    '<div class="row"><span class="k">turn</span><span class="v" id="obTv">—</span></div><input type="range" id="obT" min="0" max="15" value="0">' +
                    '<div class="eyebrow">draw</div><div class="btns"><button id="obWhole" aria-pressed="true">the whole outline</button><button id="obBars" aria-pressed="true">the reader\'s bars</button></div>' +
                    '<div class="eyebrow">the reading</div>' +
                    '<div class="row"><span class="k">panned, reading</span><span class="v" id="obPR">—</span></div>' +
                    '<div class="row"><span class="k">panned, distance</span><span class="v" id="obPD">—</span></div>' +
                    '<div class="row"><span class="k">bars meeting it</span><span class="v gold" id="obBN">—</span></div>' +
                    '<div class="row"><span class="k">outline seen from here</span><span class="v teal" id="obSeen">—</span></div>' +
                    '<p class="note">Drag up or down to bring a higher or lower octave of the reading to the first; drag sideways to bring a farther or nearer octave of depth to the first. A tap enters the octave of the reading under it, and marks the octave of distance under it. Tap inside an entered octave to go a level deeper; tap outside to start again.</p>';
                    const pick = document.getElementById('obPick');
                    for (const k of NEST_SHAPES.map(q => q[0]).concat(['page'])) {
                        const b = document.createElement('button');
                        b.textContent = k === 'page' ? 'the selected shape' : k.replace(/_/g, ' ');
                        b.setAttribute('aria-pressed', k === key);
                        pick.appendChild(b);
                        on(b, 'click', () => {
                            key = k;
                            for (const c of pick.children)
                                c.setAttribute('aria-pressed', c === b);
                            place();
                            seenCache = null;
                            draw();
                        });
                    }
                    const sD = document.getElementById('obD'),
                        sR = document.getElementById('obR'),
                        sT = document.getElementById('obT');
                    const readSliders = () => {
                        D = 3 * Math.pow(128 / 3, +sD.value / 100);
                        r0 = Math.pow(2, (+sR.value - 50) / 50 * 4);
                        turn = +sT.value;
                        document.getElementById('obDv').textContent = D.toFixed(1) + ' h';
                        document.getElementById('obRv').textContent = 'v/h ' + (r0 < 1 ? r0.toFixed(3) : r0.toFixed(2));
                        document.getElementById('obTv').textContent = turn + ' of 16';
                    };
                    for (const s of [sD, sR, sT])
                        on(s, 'input', () => {
                            readSliders();
                            place();
                            seenCache = null;
                            draw();
                        });
                    const tg = (id, f) => {
                        const b = document.getElementById(id);
                        on(b, 'click', () => {
                            f();
                            b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
                            draw();
                        });
                    };
                    tg('obWhole', () => {
                        whole = !whole;
                    });
                    tg('obBars', () => {
                        bars = !bars;
                    });
                    let seenCache = null;
                    const seenMask = () => seenCache || (seenCache = P ? _occSeen(P, 0, 0, 1) : []);
                    const line = (x1, y1, x2, y2, c, w, extra) => stage.appendChild(el('line', Object.assign({
                        x1,
                        y1,
                        x2,
                        y2,
                        stroke: c,
                        'stroke-width': w
                    }, extra || {})));
                    const draw = () => {
                        stage.textContent = '';
                        const PCr = 2 ** panR,
                            PCd = 2 ** panD,
                            oct = 'rgba(255,255,255,0.10)',
                            cor = 'rgba(255,255,255,0.32)';
                        // octave walls, panning with the world, in both lays
                        for (let j = -14; j <= 16; j++) {
                            const yr = yRead(2 ** j / PCr);
                            if (yr > Y0 - 2 * HH + 1 && yr < Y0 - 1)
                                line(X0, yr, X0 + 2 * HW, yr, oct, 1);
                            const xr = xRead(2 ** j / PCd);
                            if (xr > X0 + 1 && xr < X0 + 2 * HW - 1)
                                line(xr, Y0, xr, Y0 - 2 * HH, oct, 1);
                        }
                        line(X0, MIDY, X0 + 2 * HW, MIDY, cor, 1, {
                            'stroke-dasharray': '2 4'
                        });
                        line(MIDX, Y0, MIDX, Y0 - 2 * HH, cor, 1, {
                            'stroke-dasharray': '2 4'
                        });
                        line(X0, Y0, X0 + 2 * HW, Y0, 'rgba(255,255,255,0.22)', 1);
                        line(X0, Y0, X0, Y0 - 2 * HH, 'rgba(255,255,255,0.22)', 1);
                        // the active octaves: their own octaves inside, halving toward both walls, and the corner across the middle
                        // the entered octaves of the reading: each level's octave shaded, its corner across its middle
                        path.forEach((_, i) => {
                            const Pp = path.slice(0, i + 1),
                                yb = yRead(DEPTH.S(Pp, 0) / PCr),
                                yt = yRead(DEPTH.S(Pp, Infinity) / PCr),
                                c = NEST_PAL[Math.min(i + 1, 10)];
                            stage.appendChild(el('rect', {
                                x: X0,
                                y: Math.min(yt, yb),
                                width: 2 * HW,
                                height: Math.max(0.5, Math.abs(yb - yt)),
                                fill: c,
                                'fill-opacity': 0.07
                            }));
                            const yc = yRead(DEPTH.S(Pp, 1) / PCr);
                            line(X0, yc, X0 + 2 * HW, yc, c, 1.1);
                        });
                        if (actD != null) {
                            const xb = xRead(2 ** (actD - 1) / PCd),
                                xt = xRead(2 ** actD / PCd),
                                at = f => xb + (xt - xb) * f;
                            stage.appendChild(el('rect', {
                                x: Math.min(xb, xt),
                                y: Y0 - 2 * HH,
                                width: Math.abs(xt - xb),
                                height: 2 * HH,
                                fill: 'rgba(79,208,208,0.06)'
                            }));
                            for (let m = 2; m <= 9; m++) {
                                const s = 2 ** -m;
                                if (Math.abs(xt - xb) * s < 1.5)
                                    break;
                                line(at(1 - s), Y0, at(1 - s), Y0 - 2 * HH, oct, 1);
                                line(at(s), Y0, at(s), Y0 - 2 * HH, oct, 1);
                            }
                            line(at(0.5), Y0, at(0.5), Y0 - 2 * HH, '#4fd0d0', 1.2);
                        }
                        const E = id => document.getElementById(id);
                        E('obPR').textContent = (panR >= 0 ? '+' : '') + panR.toFixed(2) + ' octaves';
                        E('obPD').textContent = (panD >= 0 ? '+' : '') + panD.toFixed(2) + ' octaves';
                        if (!P) {
                            E('obBN').textContent = '—';
                            E('obSeen').textContent = 'nothing selected on the page';
                            return;
                        }
                        const scr = p => {
                            if (p.x <= 0 || p.y < 0)
                                return null;
                            return [xRead(Math.hypot(p.x, p.y) / PCd), yRead(p.y / p.x / PCr)];
                        };
                        // the whole outline, faint: seen solid, hidden dashed
                        if (whole) {
                            const sm = seenMask();
                            let cur = null,
                                runs = [];
                            for (let i = 0; i <= P.length; i++) {
                                const k = i % P.length,
                                    q = scr(P[k]),
                                    vis = sm[k];
                                if (!q) {
                                    cur = null;
                                    continue;
                                }
                                if (!cur || cur.vis !== vis) {
                                    if (cur)
                                        cur.pts.push(q);
                                    cur = {
                                        vis,
                                        pts: [q]
                                    };
                                    runs.push(cur);
                                } else
                                    cur.pts.push(q);
                            }
                            for (const r of runs)
                                if (r.pts.length > 1)
                                    stage.appendChild(el('polyline', {
                                        points: r.pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' '),
                                        fill: 'none',
                                        stroke: r.vis ? 'rgba(200,200,208,0.55)' : 'rgba(200,200,208,0.30)',
                                        'stroke-width': 1,
                                        'stroke-dasharray': r.vis ? 'none' : '3 3'
                                    }));
                        }
                        // the reader's bars, and where each first meets the outline: its own sweep (gold), and in every entered octave
                        // that octave's own whole sweep again (R180), coloured by level
                        const levels = [[]].concat(path.map((_, i) => path.slice(0, i + 1))),
                            metBy = [];
                        levels.forEach((Pp, L) => {
                            let met = 0,
                                prev = null;
                            const col = L === 0 ? '#d4a052' : NEST_PAL[Math.min(L, 10)],
                                g = el('g', {});
                            for (const r of ROWS) {
                                if (r <= 0)
                                    continue;
                                const a = (L === 0 ? r * PCr : DEPTH.S(Pp, r)),
                                    y = yRead(a / PCr);
                                if (!(a > 0) || !isFinite(a)) {
                                    prev = null;
                                    continue;
                                }
                                if (bars)
                                    line(X0, y, X0 + 2 * HW, y, col, 1, {
                                        'stroke-opacity': L === 0 ? 0.06 : 0.12
                                    });
                                const Lh = Math.hypot(1, a),
                                    d = _firstMeet(0, 0, 1 / Lh, a / Lh, P);
                                if (!isFinite(d)) {
                                    prev = null;
                                    continue;
                                }
                                met++;
                                const x = xRead(d / PCd);
                                if (prev && Math.abs(prev[0] - x) < 40)
                                    g.appendChild(el('line', {
                                        x1: prev[0],
                                        y1: prev[1],
                                        x2: x,
                                        y2: y,
                                        stroke: col,
                                        'stroke-width': L === 0 ? 1.6 : 1.2
                                    }));
                                g.appendChild(el('circle', {
                                    cx: x,
                                    cy: y,
                                    r: L === 0 ? 2.2 : 1.8,
                                    fill: col
                                }));
                                prev = [x, y];
                            }
                            stage.appendChild(g);
                            metBy.push(met);
                        });
                        stage.appendChild(el('circle', {
                            cx: X0,
                            cy: Y0,
                            r: 4,
                            fill: '#e3e7e5'
                        }));
                        const t = el('text', {
                            x: X0 + 6,
                            y: 22,
                            fill: '#6e6e7a',
                            'font-size': '11',
                            'font-family': 'DM Mono, monospace'
                        });
                        t.textContent = (key === 'page' ? 'the selected shape' : key.replace(/_/g, ' ')) + ' · ' + D.toFixed(1) + ' h away · up: the reading · across: distance' + (path.length ? ' · entered @' + path.join('.') : '');
                        stage.appendChild(t);
                        E('obBN').textContent = metBy.map((m, L) => (L ? 'level ' + L + ': ' : 'own sweep: ') + m).join(' · ');
                        const sm = seenMask();
                        E('obSeen').textContent = Math.round(100 * sm.filter(Boolean).length / sm.length) + '%';
                    };
                    let drag = null;
                    const at = e => {
                        const r = stage.getBoundingClientRect(),
                            s = Math.min(r.width, r.height) / 700,
                            ox = r.left + (r.width - 700 * s) / 2,
                            oy = r.top + (r.height - 700 * s) / 2;
                        return [(e.clientX - ox) / s, (e.clientY - oy) / s];
                    };
                    on(stage, 'pointerdown', e => {
                        const [x, y] = at(e);
                        drag = {
                            x0: x,
                            y0: y,
                            pr: panR,
                            pd: panD,
                            moved: false
                        };
                        e.preventDefault();
                    });
                    on(window, 'pointermove', e => {
                        if (!drag)
                            return;
                        const [x, y] = at(e);
                        if (Math.abs(x - drag.x0) > 6 || Math.abs(y - drag.y0) > 6)
                            drag.moved = true;
                        if (drag.moved) {
                            panR = Math.max(-6, Math.min(10, drag.pr + (y - drag.y0) / (HH / 2)));
                            panD = Math.max(-4, Math.min(12, drag.pd - (x - drag.x0) / (HW / 2)));
                            draw();
                        }
                        e.preventDefault();
                    });
                    on(window, 'pointerup', () => {
                        if (!drag)
                            return;
                        if (!drag.moved) {
                            const a = rOfY(drag.y0) * 2 ** panR,
                                dd = rOfX(drag.x0) * 2 ** panD;
                            // a tap inside the deepest entered octave enters its child under the tap; anywhere else starts again from the
                            // reader's own octave under the tap
                            if (a > 0 && isFinite(a)) {
                                const inside = path.length && a > DEPTH.S(path, 0) && a < DEPTH.S(path, Infinity);
                                const ks = DEPTH.addr(a, inside ? path.length + 1 : 1)[0];
                                path = (inside && ks.length === path.length + 1 && ks.slice(0, path.length).join('.') === path.join('.')) ? ks : ks.slice(0, 1);
                                if (path.length > 6)
                                    path = path.slice(0, 6);
                            }
                            actD = dd > 0 ? Math.ceil(Math.log2(dd) - 1e-9) : null;
                            draw();
                        }
                        drag = null;
                    });
                    on(stage, 'wheel', e => {
                        e.preventDefault();
                        if (e.shiftKey)
                            panD = Math.max(-4, Math.min(12, panD + e.deltaY / 400));
                        else
                            panR = Math.max(-6, Math.min(10, panR - e.deltaY / 400));
                        draw();
                    });
                    hint.textContent = 'drag up/down: octaves of the reading · drag sideways: octaves of distance · tap: enter the octave under it, tap inside to go deeper';
                    readSliders();
                    panD = Math.log2(D);
                    place();
                    draw();
                }

                // ── THE CYCLE SHEET ──────────────────────────────────────────────────────
                function startCycle() {
                    let n = 3,
                        edges = [],
                        u = [],
                        sel = 0,
                        preset = 'each beats the next';
                    const buildEdges = () => {
                        edges = [];
                        for (let i = 0; i < n; i++)
                            for (let j = i + 1; j < n; j++)
                                edges.push([i, j]);
                    };
                    const PRESETS = {
                        'grounded': () => {
                            const g = [];
                            for (let i = 0; i < n; i++)
                                g.push(0.6 + 1.4 * Math.random());
                            return edges.map(([i, j]) => Math.log(g[j] / g[i]));
                        },
                        'each beats the next': () => edges.map(([i, j]) => {
                            if (j === i + 1)
                                return Math.log(1.25);
                            if (i === 0 && j === n - 1)
                                return -Math.log(1.25);
                            return 0;
                        }),
                        'a ground plus a twist': () => {
                            const g = [];
                            for (let i = 0; i < n; i++)
                                g.push(0.6 + 1.4 * Math.random());
                            return edges.map(([i, j]) => Math.log(g[j] / g[i]) + 0.12);
                        },
                        'all level': () => edges.map(() => 0)
                    };
                    // A ground exists iff u = phi_j - phi_i for some phi. Least squares on the
                    // graph Laplacian gives the closest such phi; the remainder is the part no
                    // ground can carry. phi[0] is pinned — that is the free overall scale.
                    const fit = () => {
                        const L = Array.from({
                                length: n
                            }, () => new Float64Array(n)),
                            b = new Float64Array(n);
                        edges.forEach(([i, j], k) => {
                            L[i][i]++;
                            L[j][j]++;
                            L[i][j]--;
                            L[j][i]--;
                            b[i] -= u[k];
                            b[j] += u[k];
                        });
                        const m = n - 1,
                            A = Array.from({
                                length: m
                            }, (_, r) => {
                                const row = new Float64Array(m + 1);
                                for (let c = 0; c < m; c++)
                                    row[c] = L[r + 1][c + 1];
                                row[m] = b[r + 1];
                                return row;
                            });
                        for (let c = 0; c < m; c++) {
                            let p = c;
                            for (let r = c + 1; r < m; r++)
                                if (Math.abs(A[r][c]) > Math.abs(A[p][c]))
                                    p = r;
                            const tmp = A[c];
                            A[c] = A[p];
                            A[p] = tmp;
                            if (Math.abs(A[c][c]) < 1e-12)
                                continue;
                            for (let r = 0; r < m; r++) {
                                if (r === c)
                                    continue;
                                const f = A[r][c] / A[c][c];
                                for (let x = c; x <= m; x++)
                                    A[r][x] -= f * A[c][x];
                            }
                        }
                        const phi = new Float64Array(n);
                        for (let r = 0; r < m; r++)
                            phi[r + 1] = Math.abs(A[r][r]) < 1e-12 ? 0 : A[r][m] / A[r][r];
                        const resid = u.map((v, k) => v - (phi[edges[k][1]] - phi[edges[k][0]]));
                        const nu = Math.hypot.apply(null, u),
                            nr = Math.hypot.apply(null, resid);
                        return {
                            phi,
                            resid,
                            explained: nu < 1e-12 ? 1 : 1 - (nr * nr) / (nu * nu),
                            obstruction: nr
                        };
                    };
                    const cycles = () => {
                        const out = [];
                        const val = (a, b) => {
                            const i = edges.findIndex(([p, q]) => p === Math.min(a, b) && q === Math.max(a, b));
                            return (a < b ? 1 : -1) * u[i];
                        };
                        for (let i = 0; i < n; i++)
                            for (let j = i + 1; j < n; j++)
                                for (let k = j + 1; k < n; k++)
                                    out.push({
                                        tri: [i, j, k],
                                        sum: val(i, j) + val(j, k) + val(k, i)
                                    });
                        return out;
                    };

                    panel.innerHTML =
                    '<h2>The cycle sheet</h2><p class="sub">Several parties, each pair related in its own terms, no common unit anywhere. Whether one ground could serve them all is not assumed here — it is measured.</p>' +
                    '<div class="eyebrow">the network</div><div class="btns" id="cyPresets"></div>' +
                    '<div class="row"><span class="k">parties</span><span class="v" id="cyN">3</span></div>' +
                    '<input type="range" id="cyRN" min="3" max="6" step="1" value="3">' +
                    '<div class="row"><span class="k">selected edge reads</span><span class="v gold" id="cySel">—</span></div>' +
                    '<input type="range" id="cyRE" min="-1.6" max="1.6" step="0.01" value="0">' +
                    '<div class="eyebrow">closure</div>' +
                    '<div class="row"><span class="k">cycles</span><span class="v" id="cyC">—</span></div>' +
                    '<div class="row"><span class="k">worst cycle product</span><span class="v" id="cyP">—</span></div>' +
                    '<p class="note">Take a party&#39;s own terms, state the next in them, and so on around the loop. <b>If one ground serves them all, the product is 1.</b> It is not forced to be.</p>' +
                    '<div class="eyebrow">the split</div><div class="bar"><i id="cyBar" style="width:0%"></i></div>' +
                    '<div class="row"><span class="k">a ground explains</span><span class="v gold" id="cyF">—</span></div>' +
                    '<div class="row"><span class="k">obstruction</span><span class="v red" id="cyO">—</span></div>' +
                    '<p class="note">Every set of readings splits, uniquely, into the part one ground accounts for and the part no ground can. Gold edges are the first; red is the second. <b>The split is computed from the readings alone.</b></p>' +
                    '<div class="eyebrow">the best ground</div><div id="cyG"></div>' +
                    '<div class="verdict" id="cyV">—</div>';
                    hint.textContent = 'click an edge, then drag up or down to change what it reads';

                    const CX = 350,
                        CY = 330,
                        R = 210;
                    const pos = i => {
                        const a = -Math.PI / 2 + i * TAU / n;
                        return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
                    };

                    const draw = () => {
                        const f = fit(),
                            cyc = cycles();
                        stage.textContent = '';
                        const rms = Math.max(0.05, Math.hypot.apply(null, u) / Math.sqrt(u.length));
                        edges.forEach(([i, j], k) => {
                            const [x1, y1] = pos(i),
                                [x2, y2] = pos(j),
                                share = Math.min(1, Math.abs(f.resid[k]) / rms),
                                isSel = k === sel;
                            stage.appendChild(el('line', {
                                x1,
                                y1,
                                x2,
                                y2,
                                stroke: Math.abs(f.resid[k]) < 1e-6 ? '#d4a052'
                                : 'rgb(' + Math.round(212 + 5 * share) + ',' + Math.round(160 - 50 * share) + ',' + Math.round(82 + 9 * share) + ')',
                                'stroke-width': isSel ? 4 : 2.2,
                                'stroke-linecap': 'round',
                                opacity: isSel ? 1 : 0.85,
                                'data-e': k,
                                style: 'cursor:pointer'
                            }));
                            const tx = el('text', {
                                x: (x1 + x2) / 2,
                                y: (y1 + y2) / 2 - 8,
                                'text-anchor': 'middle',
                                fill: isSel ? '#fff' : '#c8c8d0',
                                'font-size': '12',
                                'font-family': "'DM Mono',monospace",
                                'pointer-events': 'none'
                            });
                            tx.textContent = AZ(i) + '\u2192' + AZ(j) + '  ' + Math.exp(u[k]).toFixed(3);
                            stage.appendChild(tx);
                        });
                        for (let i = 0; i < n; i++) {
                            const [x, y] = pos(i);
                            stage.appendChild(el('circle', {
                                cx: x,
                                cy: y,
                                r: 22,
                                fill: '#0c0c11',
                                stroke: '#8ce6cd',
                                'stroke-width': 1.4
                            }));
                            const tx = el('text', {
                                x,
                                y: y + 4.5,
                                'text-anchor': 'middle',
                                fill: '#8ce6cd',
                                'font-size': '13',
                                'font-family': "'DM Mono',monospace"
                            });
                            tx.textContent = AZ(i);
                            stage.appendChild(tx);
                        }

                        const worst = cyc.reduce((a, c) => Math.abs(c.sum) > Math.abs(a.sum) ? c : a, {
                            sum: 0
                        });
                        document.getElementById('cyC').textContent = cyc.length;
                        document.getElementById('cyP').textContent = Math.exp(worst.sum).toFixed(5);
                        document.getElementById('cyF').textContent = (100 * f.explained).toFixed(1) + '%';
                        document.getElementById('cyBar').style.width = (100 * Math.max(0, f.explained)).toFixed(1) + '%';
                        document.getElementById('cyO').textContent = f.obstruction.toFixed(4);
                        document.getElementById('cySel').textContent = Math.exp(u[sel]).toFixed(3) + '  (' + AZ(edges[sel][0]) + '→' + AZ(edges[sel][1]) + ')';
                        document.getElementById('cyRE').value = u[sel];
                        let g = '';
                        for (let i = 0; i < n; i++)
                            g += '<div class="row"><span class="k">' + AZ(i) + '</span><span class="v teal">' + Math.exp(f.phi[i] - f.phi[0]).toFixed(3) + '</span></div>';
                        document.getElementById('cyG').innerHTML = g;
                        document.getElementById('cyV').innerHTML = Math.abs(worst.sum) < 1e-6
                        ? 'Every cycle closes. <b>One ground serves every pair here</b> — the readings are ratios of the values above, and a single page could carry the whole network without loss.'
                        : 'The worst cycle returns ' + Math.exp(worst.sum).toFixed(4) + ' instead of 1. <b>No single ground can serve these parties.</b> ' +
                        (f.explained > 0.5
                        ? 'A ground still explains ' + (100 * f.explained).toFixed(0) + '% of what is read; the red is the remainder, and it is not noise — it is a comparison no third thing could have carried.'
                        : 'Almost nothing here is a ratio of anything: the readings are consistent pairwise and inconsistent as a whole, which is the arrangement a resolved account cannot represent.');
                    };

                    const pbox = document.getElementById('cyPresets');
                    for (const name of Object.keys(PRESETS)) {
                        const b = document.createElement('button');
                        b.textContent = name;
                        b.setAttribute('aria-pressed', name === preset);
                        on(b, 'click', () => {
                            preset = name;
                            u = PRESETS[name]();
                            sel = 0;
                            draw();
                            Array.prototype.forEach.call(pbox.children, c => c.setAttribute('aria-pressed', c.textContent === name));
                        });
                        pbox.appendChild(b);
                    }
                    on(document.getElementById('cyRN'), 'input', e => {
                        n = +e.target.value;
                        document.getElementById('cyN').textContent = n;
                        buildEdges();
                        u = PRESETS[preset]();
                        sel = 0;
                        draw();
                    });
                    on(document.getElementById('cyRE'), 'input', e => {
                        u[sel] = +e.target.value;
                        draw();
                    });

                    let drag = null;
                    on(stage, 'pointerdown', e => {
                        const k = e.target.getAttribute && e.target.getAttribute('data-e');
                        if (k !== null && k !== undefined) {
                            sel = +k;
                            drag = {
                                y: e.clientY,
                                u0: u[sel]
                            };
                            draw();
                        }
                    });
                    on(window, 'pointermove', e => {
                        if (!drag)
                            return;
                        u[sel] = Math.max(-1.6, Math.min(1.6, drag.u0 + (drag.y - e.clientY) * 0.006));
                        draw();
                        e.preventDefault();
                    });
                    on(window, 'pointerup', () => {
                        drag = null;
                    });

                    buildEdges();
                    u = PRESETS[preset]();
                    draw();
                }

                // ── THE SIGNATURE SHEET ──────────────────────────────────────────────────
                // A description of a figure made of disagreements and nothing else. Four
                // points and four cross products give one number; taken along the contour
                // they give a curve. The account is then changed underneath the figure — the
                // picture distorts, every distance in it moves — and the curve does not.
                function startSignature() {
                    const idx = (typeof selectedIndices === 'function' ? selectedIndices() : []);
                    let pts = null,
                        name = '';
                    const grab = i => {
                        const sp = state.subpaths[i];
                        if (sp && sp.leafX && sp.leafX.length >= 24) {
                            pts = {
                                x: sp.leafX,
                                y: sp.leafY
                            };
                            name = sp.name || ('shape ' + i);
                            return true;
                        }
                        return false;
                    };
                    for (const i of idx)
                        if (grab(i))
                            break;
                    if (!pts)
                        for (let i = 0; i < state.subpaths.length; i++)
                            if (grab(i)) {
                                name += ' (first on the page)';
                                break;
                            }
                    if (!pts) {
                        panel.innerHTML = '<h2>The signature sheet</h2><p class="sub">Nothing on the page has enough leaves to describe. Draw or add a shape with at least 24 leaves and open the sheet again.</p>';
                        return;
                    }

                    const M = 96,
                        P = [];
                    const n = pts.x.length;
                    let cx = 0,
                        cy = 0;
                    for (let k = 0; k < n; k++) {
                        cx += pts.x[k];
                        cy += pts.y[k];
                    }
                    cx /= n;
                    cy /= n;
                    let R = 1e-9;
                    for (let k = 0; k < n; k++)
                        R = Math.max(R, Math.hypot(pts.x[k] - cx, pts.y[k] - cy));
                    for (let i = 0; i < M; i++) {
                        const k = Math.floor(i * n / M);
                        P.push({
                            x: (pts.x[k] - cx) / R,
                            y: (pts.y[k] - cy) / R
                        });
                    }
                    const o = {
                        x: 0.05,
                        y: 0.04
                    };
                    const ia = 0,
                        ib = Math.floor(M / 3),
                        ic = Math.floor(2 * M / 3);

                    const crs = (q, a, b) => (a.x - q.x) * (b.y - q.y) - (b.x - q.x) * (a.y - q.y);
                    const xr = (q, a, b, c, d) => {
                        const num = crs(q, a, c) * crs(q, b, d),
                            den = crs(q, a, d) * crs(q, b, c);
                        return den ? num / den : NaN;
                    };
                    const signature = (Q, qo) => {
                        const s = [];
                        for (let k = 0; k < Q.length; k++)
                            s.push(xr(qo, Q[ia], Q[ib], Q[ic], Q[k]));
                        return s;
                    };
                    const project = (arr, q1, q2) => {
                        const out = [];
                        for (const p of arr) {
                            const w = q1 * p.x + q2 * p.y + 1;
                            if (w < 0.28)
                                return null;
                            out.push({
                                x: p.x / w,
                                y: p.y / w
                            });
                        }
                        return out;
                    };

                    const s0 = signature(P, o);
                    let q1 = 0.13,
                        q2 = -0.09,
                        Q = null,
                        qo = null,
                        s1 = null;
                    const reAccount = () => {
                        for (let t = 0; t < 40; t++) {
                            const a = 0.24 * (Math.random() - 0.5),
                                b = 0.24 * (Math.random() - 0.5);
                            const all = project(P.concat([o]), a, b);
                            if (all) {
                                q1 = a;
                                q2 = b;
                                Q = all.slice(0, M);
                                qo = all[M];
                                s1 = signature(Q, qo);
                                return;
                            }
                        }
                    };
                    reAccount();

                    panel.innerHTML =
                    '<h2>The signature sheet</h2><p class="sub">' + name + ' — described by disagreements alone. Four points, four cross products, one number; taken along the contour, a curve.</p>' +
                    '<div class="eyebrow">the account</div>' +
                    '<div class="btns"><button id="sgNew">restate it again</button><button id="sgFit">fit each to view</button></div>' +
                    '<p class="note">The gold outline is the figure as the page holds it. The violet one is the same figure under a projective account — a change of view, nothing more. <b>Every distance in it has moved.</b></p>' +
                    '<div class="eyebrow">what moved</div>' +
                    '<div class="row"><span class="k">distance ratios</span><span class="v red" id="sgRad">—</span></div>' +
                    '<div class="row"><span class="k">the signature</span><span class="v teal" id="sgSig">—</span></div>' +
                    '<p class="note">The two curves below are the signature before and after. They are drawn one over the other, and the second is not visible because it is <b>underneath the first</b>.</p>' +
                    '<div class="verdict" id="sgV">—</div>';
                    hint.textContent = 'gold: as the page holds it · violet: the same figure, another account';

                    let fit = true;
                    const draw = () => {
                        stage.textContent = '';
                        const box = (arr) => {
                            let a = Infinity,
                                b = -Infinity,
                                c = Infinity,
                                d = -Infinity;
                            for (const p of arr) {
                                a = Math.min(a, p.x);
                                b = Math.max(b, p.x);
                                c = Math.min(c, p.y);
                                d = Math.max(d, p.y);
                            }
                            return {
                                a,
                                b,
                                c,
                                d
                            };
                        };
                        const put = (arr, colour, W, H, X, Y) => {
                            const bb = fit ? box(arr) : {
                                a: -1.4,
                                b: 1.4,
                                c: -1.4,
                                d: 1.4
                            };
                            const sc = Math.min(W / (bb.b - bb.a || 1), H / (bb.d - bb.c || 1)) * 0.86;
                            const mx = (bb.a + bb.b) / 2,
                                my = (bb.c + bb.d) / 2;
                            let dsc = '';
                            arr.forEach((p, i) => {
                                const x = X + (p.x - mx) * sc,
                                    y = Y - (p.y - my) * sc;
                                dsc += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
                            });
                            stage.appendChild(el('path', {
                                d: dsc + 'Z',
                                fill: 'none',
                                stroke: colour,
                                'stroke-width': 2
                            }));
                        };
                        put(P, '#d4a052', 300, 300, 180, 180);
                        put(Q, '#a585c4', 300, 300, 520, 180);
                        // the two signatures, one over the other
                        const finite = s0.map((v, i) => isFinite(v) && isFinite(s1[i]) ? v : null);
                        const vals = finite.filter(v => v !== null);
                        let lo = Math.min.apply(null, vals),
                            hi = Math.max.apply(null, vals);
                        if (!isFinite(lo) || !isFinite(hi) || hi - lo < 1e-9) {
                            lo = -1;
                            hi = 1;
                        }
                        const pad = 0.08 * (hi - lo);
                        lo -= pad;
                        hi += pad;
                        const X0 = 90,
                            X1 = 640,
                            Y0 = 620,
                            Y1 = 400;
                        stage.appendChild(el('line', {
                            x1: X0,
                            y1: Y0,
                            x2: X1,
                            y2: Y0,
                            stroke: 'rgba(255,255,255,0.12)'
                        }));
                        const curve = (s, colour, w) => {
                            let d = '',
                                started = false;
                            for (let k = 0; k < s.length; k++) {
                                if (!isFinite(s[k])) {
                                    started = false;
                                    continue;
                                }
                                const x = X0 + (X1 - X0) * k / (s.length - 1);
                                const y = Y0 + (Y1 - Y0) * (s[k] - lo) / (hi - lo);
                                d += (started ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
                                started = true;
                            }
                            stage.appendChild(el('path', {
                                d,
                                fill: 'none',
                                stroke: colour,
                                'stroke-width': w
                            }));
                        };
                        curve(s1, '#a585c4', 5); // the restated one, drawn first and thicker
                        curve(s0, '#d4a052', 2); // the original, drawn over it
                        for (const [i, lab] of [[ia, 'A'], [ib, 'B'], [ic, 'C']]) {
                            const x = X0 + (X1 - X0) * i / (M - 1);
                            stage.appendChild(el('line', {
                                x1: x,
                                y1: Y0,
                                x2: x,
                                y2: Y1,
                                stroke: 'rgba(140,230,205,0.18)'
                            }));
                            const tx = el('text', {
                                x,
                                y: Y0 + 16,
                                'text-anchor': 'middle',
                                fill: '#8ce6cd',
                                'font-size': '11',
                                'font-family': "'DM Mono',monospace"
                            });
                            tx.textContent = lab;
                            stage.appendChild(tx);
                        }
                        const t0 = el('text', {
                            x: 180,
                            y: 350,
                            'text-anchor': 'middle',
                            fill: '#d4a052',
                            'font-size': '11',
                            'font-family': "'DM Mono',monospace"
                        });
                        t0.textContent = 'as the page holds it';
                        const t1 = el('text', {
                            x: 520,
                            y: 350,
                            'text-anchor': 'middle',
                            fill: '#a585c4',
                            'font-size': '11',
                            'font-family': "'DM Mono',monospace"
                        });
                        t1.textContent = 'another account of it';
                        stage.appendChild(t0);
                        stage.appendChild(t1);

                        // what moved, and what did not
                        const nrm = a => {
                            const m = a.reduce((x, y) => x + y, 0) / a.length;
                            return a.map(v => v / m);
                        };
                        const rad = (arr, q) => nrm(arr.map(p => Math.hypot(p.x - q.x, p.y - q.y)));
                        const r0 = rad(P, o),
                            r1 = rad(Q, qo);
                        let rd = 0;
                        for (let k = 0; k < M; k++)
                            rd += Math.abs(r1[k] - r0[k]);
                        rd /= M;
                        let sd = 0,
                            cnt = 0;
                        for (let k = 0; k < M; k++)
                            if (isFinite(s0[k]) && isFinite(s1[k])) {
                                sd += Math.abs(s1[k] - s0[k]);
                                cnt++;
                            }
                        sd = cnt ? sd / cnt : NaN;
                        document.getElementById('sgRad').textContent = 'moved ' + (100 * rd).toFixed(1) + '%';
                        document.getElementById('sgSig').textContent = 'moved ' + sd.toExponential(1);
                        document.getElementById('sgV').innerHTML =
                        'The figure was restated by an account that moved its distances by '
                        + (100 * rd).toFixed(1) + '%. The description made of disagreements moved by '
                        + sd.toExponential(1) + ' — <b>nothing, to the last place the arithmetic carries.</b> '
                        + 'No coordinate was used to build it, no unit, and no frame: four points and four cross products, '
                        + 'which is all the relation has. A figure can therefore be told apart from another '
                        + 'without being measured at all, and told apart from every account of itself at the same time.';
                    };
                    const bN = document.getElementById('sgNew'),
                        bF = document.getElementById('sgFit');
                    on(bN, 'click', () => {
                        reAccount();
                        draw();
                    });
                    on(bF, 'click', () => {
                        fit = !fit;
                        bF.setAttribute('aria-pressed', fit);
                        draw();
                    });
                    bF.setAttribute('aria-pressed', 'true');
                    draw();
                }

                // ── TWO FISHEYES: CORE (verified headless before shipping) ──────────────────
                // One array of N elements laid evenly round a semicircle: element i at angle i·π/N.
                // A fisheye is a focus φ and a scale s; it shows element i at tan(θᵢ − φ)·s.
                // Two fisheyes on one array are two Möbius charts of one line, so screen
                // positions do not transfer between them and cross ratios do — exactly.
                const TWO_FISHEYES_CORE = (() => {
                    const PI = Math.PI;
                    // reduce an angular difference to (−π/2, π/2]: the semicircle wraps once
                    const reduce = d => {
                        d = ((d % PI) + PI) % PI;
                        return d > PI / 2 ? d - PI : d;
                    };
                    // s is fixed by one requirement: adjacent elements at the focus sit one item-width apart
                    const scaleFor = (N, w) => N * w / PI;
                    const position = (i, N, focus, s) => Math.tan(reduce(i * PI / N - focus)) * s;
                    // a reader that can only see pixels sees positions on a grid
                    const quant = (p, g) => g > 0 ? Math.round(p / g) * g : p;
                    // the visible arc is a fact about the aperture alone — no N needed for the angle
                    const halfAngle = (V, s) => Math.atan(V / s);
                    // which K indices are on screen; N enters only here
                    const visible = (N, focus, s, V) => {
                        const a = halfAngle(V, s),
                            st = PI / N;
                        const lo = Math.ceil((focus - a) / st),
                            hi = Math.floor((focus + a) / st),
                            out = [];
                        for (let k = lo; k <= hi; k++)
                            out.push(((k % N) + N) % N);
                        return out;
                    };
                    // the element at the focus is read back from the angle, never tracked
                    const centered = (N, focus) => ((Math.round(focus / (PI / N)) % N) + N) % N;
                    // the projective invariant of four positions; Möbius-invariant
                    const cr = (a, b, c, d) => ((a - c) * (b - d)) / ((a - d) * (b - c));
                    // an element's address against a three-mark frame, from screen positions
                    const address = (p0, p1, p2, px) => cr(p0, p1, p2, px);
                    // the inverse: given the frame's positions in THIS view and an address, where is x here?
                    //   cr(p0,p1,p2,px) = A  ⇒  px = (A·v·p0 − u·p1)/(A·v − u),  u = p0−p2, v = p1−p2
                    const solve = (p0, p1, p2, A) => {
                        const u = p0 - p2,
                            v = p1 - p2;
                        return (A * v * p0 - u * p1) / (A * v - u);
                    };
                    // a screen position back to an element: the fisheye inverted, then the ring's pitch
                    const indexOf = (p, N, focus, s) => ((Math.round((focus + Math.atan(p / s)) / (PI / N)) % N) + N) % N;
                    // a drag of one item-width turns the focus by exactly one element
                    const panAngle = (dx, N, w) => dx * PI / (N * w);
                    // a deterministic magnitude list, computed on demand so N may be a million
                    const magnitude = (i, N) => {
                        const t = i / N;
                        let h = (i * 2654435761) >>> 0;
                        h ^= h >>> 15;
                        h = (h * 2246822519) >>> 0;
                        h ^= h >>> 13;
                        const bump = ((h >>> 0) % 1000) / 1000;
                        return 0.5 + 0.28 * Math.sin(2 * PI * 7 * t) + 0.14 * Math.sin(2 * PI * 23 * t + 1.1)
                        + 0.06 * Math.sin(2 * PI * 61 * t + 2.3) + 0.05 * (bump - 0.5);
                    };
                    // deterministic RNG for the registered sweep
                    const rng = seed => () => {
                        seed = (seed + 0x6D2B79F5) | 0;
                        let t = seed;
                        t = Math.imul(t ^ (t >>> 15), t | 1);
                        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
                    };
                    // THE SEPARATION SWEEP (P3): address error at a pixel grain vs the frame's spread,
                    // sent from one fisheye and solved in ANOTHER. REGISTERED going in: recovered-element
                    // error ∝ 1/sep (the survey's addressing law). MEASURED: refuted — the address NUMBER's
                    // relative error does go as 1/sep, but solving it back to a position has sensitivity ∝ sep
                    // and the two cancel, so the recovered element's error is set by the GRAIN and is flat in
                    // separation, breaking only when the frame's spread falls below the grain (the near-equal
                    // wall). Both columns are reported so the reconciliation is visible.
                    const sweep = (g, opts) => {
                        const N = (opts && opts.N) || 5000,
                            V = (opts && opts.V) || 330;
                        const trials = (opts && opts.trials) || 300,
                            seps = (opts && opts.seps) || [1, 2, 4, 8, 16, 32];
                        const r = rng(20260901),
                            rows = [];
                        for (const sep of seps) {
                            const errs = [],
                                aerrs = [];
                            let tries = 0;
                            while (errs.length < trials && tries < trials * 20) {
                                tries++;
                                // both item widths and both grid offsets drawn per trial, so the beat between
                                // the element lattice and the pixel grid averages out instead of aliasing
                                const wA = 2 + 1.5 * r(),
                                    wB = wA * (1 + 1.5 * r()),
                                    sA = scaleFor(N, wA),
                                    sB = scaleFor(N, wB);
                                const oA = g * r(),
                                    oB = g * r();
                                const fA = r() * PI,
                                    c = centered(N, fA);
                                const x = c + Math.floor(r() * 21) - 10;
                                const L = [x - sep, x + sep, x + 2 * sep];
                                const fB = fA + panAngle((r() * 20 - 10) * wA, N, wA);
                                const inB = new Set(visible(N, fB, sB, V));
                                if (!L.every(i => inB.has(((i % N) + N) % N)) || !inB.has(((x % N) + N) % N))
                                    continue;
                                const qA = i => g > 0 ? Math.round((position(i, N, fA, sA) + oA) / g) * g : position(i, N, fA, sA);
                                const qB = i => g > 0 ? Math.round((position(i, N, fB, sB) + oB) / g) * g : position(i, N, fB, sB);
                                const A = address(qA(L[0]), qA(L[1]), qA(L[2]), qA(x));
                                const eA = i => position(i, N, fA, sA),
                                    Aex = address(eA(L[0]), eA(L[1]), eA(L[2]), eA(x));
                                if (Number.isFinite(Aex) && Math.abs(Aex) > 1e-12)
                                    aerrs.push(Math.abs(A - Aex) / Math.abs(Aex));
                                const px = solve(qB(L[0]), qB(L[1]), qB(L[2]), A) - oB;
                                if (!Number.isFinite(px))
                                    continue;
                                const rec = (fB + Math.atan(px / sB)) / (PI / N);
                                errs.push(Math.abs(rec - x));
                            }
                            errs.sort((a, b) => a - b);
                            aerrs.sort((a, b) => a - b);
                            const med = errs.length ? errs[Math.floor(errs.length / 2)] : NaN;
                            const amed = aerrs.length ? aerrs[Math.floor(aerrs.length / 2)] : NaN;
                            rows.push({
                                sep,
                                median: med,
                                product: med * sep,
                                addrRel: amed,
                                addrProduct: amed * sep,
                                n: errs.length
                            });
                        }
                        return rows;
                    };
                    return {
                        PI,
                        reduce,
                        scaleFor,
                        position,
                        quant,
                        halfAngle,
                        visible,
                        centered,
                        cr,
                        address,
                        solve,
                        indexOf,
                        panAngle,
                        magnitude,
                        rng,
                        sweep
                    };
                })();
                // ── TWO FISHEYES: CORE END ───────────────────────────────────────────────────

                // ── THE TWO-FISHEYES SHEET ────────────────────────────────────────────────
                // One array, two fisheyes. Two Möbius charts of one line, drawn as two lenses.
                // The lab run the ladder paper owes: the projective rungs transfer between
                // accounts unconditionally; here the accounts are two draggable views.
                //
                // REGISTERED before the first run (recorded in the panel with the results):
                //  P1  four elements visible in both views have the SAME cross ratio in both,
                //      exact, for any focus / item width / grain pair. Kill: any disagreement
                //      beyond floating error with the grain off.
                //  P2  one number sent from a view lands on the same element in the other.
                //      Kill: a miss with the grain off.
                //  P3  at a pixel grain, addressing error ∝ 1/separation of the frame (the
                //      survey's law, imported). RESULT, from the headless run that preceded
                //      the page: REFUTED for the RECOVERED ELEMENT and CONFIRMED for the
                //      ADDRESS NUMBER — the address's relative error follows 1/sep to the
                //      percent (22.2/11.1/6.1/3.0/1.6/0.85% vs the survey's 21.4/12.9/6.7/
                //      3.2/1.7/0.87%), but solving it back to a position has sensitivity ∝
                //      sep, which cancels, so the recovered element's error is set by the
                //      grain and flat in separation (≈0.12 elements per pixel of grain at
                //      ~2.75 px spacing; linear in grain). The near-equal wall stands: when
                //      the frame's spread is smaller than the grain the landmarks quantise
                //      together and the address is undefined.
                //  P4  positions, pixel distances, focus and aperture do NOT transfer.
                //  ⚠  Two artifacts caught before the page and designed out of the sweep:
                //      sending and solving in the same view cancels the frame algebraically
                //      (only the target's rounding survives); and evenly spaced elements on
                //      an integer pixel grid quantise COMMON-MODE, which a cross ratio cannot
                //      see — the survey's own "exact rung offsets snap" artifact. The sweep
                //      therefore uses two views and randomises widths and grid offsets.
                function startFisheyes() {
                    const C = TWO_FISHEYES_CORE,
                        PI = C.PI;
                    const V = 320; // half-width of a strip, in stage units
                    const CX = 350,
                        YA = 215,
                        YB = 545,
                        BAR = 100; // strip baselines and bar height
                    let N = 5000;
                    const view = {
                        A: {
                            focus: 1.0,
                            w: 24,
                            g: 1,
                            y: YA,
                            name: 'A'
                        },
                        B: {
                            focus: 1.0,
                            w: 12,
                            g: 1,
                            y: YB,
                            name: 'B'
                        }
                    };
                    let frameMode = 'global',
                        frame = [0, 0, 0],
                        mode = 'address',
                        picks = [],
                        last = null,
                        holdAngle = false,
                        sync = true,
                        broken = false,
                        context = true;
                    const edits = new Map(); // writes to the array: index → magnitude
                    const other = k => k === 'A' ? 'B' : 'A';
                    const mag = i => edits.has(i) ? edits.get(i) : C.magnitude(i, N);
                    // prefix sums of magnitude and its square, built once per N (and per write): any element range's mean and spread in O(1)
                    let PS = null,
                        PS2 = null,
                        psN = -1;
                    const buildPS = () => {
                        PS = new Float64Array(N + 1);
                        PS2 = new Float64Array(N + 1);
                        for (let i = 0; i < N; i++) {
                            const m = mag(i);
                            PS[i + 1] = PS[i] + m;
                            PS2[i + 1] = PS2[i] + m * m;
                        }
                        psN = N;
                    };
                    const rangeStats = (lo, hi) => {
                        // elements lo..hi-1, mod N
                        if (psN !== N)
                            buildPS();
                        let n = hi - lo;
                        if (n <= 0)
                            return null;
                        if (n > N)
                            n = N;
                        const sum = (a, b) => {
                            a = ((a % N) + N) % N;
                            b = a + (b - a);
                            if (b <= N)
                                return [PS[b] - PS[a], PS2[b] - PS2[a]];
                            const r = [PS[N] - PS[a], PS2[N] - PS2[a]];
                            return [r[0] + PS[b - N], r[1] + PS2[b - N]];
                        };
                        const [s1, s2] = sum(lo, lo + n);
                        const mean = s1 / n;
                        return {
                            n,
                            mean,
                            sd: Math.sqrt(Math.max(0, s2 / n - mean * mean))
                        };
                    };
                    // aperture: hold the item width (the screen rescales with N) or hold the ANGLE (the screen holds, N densifies)
                    const S = v => (holdAngle && v.alpha) ? V / Math.tan(v.alpha) : C.scaleFor(N, v.w);
                    const P = (v, i) => C.position(i, N, v.focus, S(v));
                    // a BROKEN chart: a quadratic warp on B — not a Möbius map — applied wherever B's positions are used
                    const warp = (v, p) => (broken && v.name === 'B') ? p + 0.08 * p * Math.abs(p) / V : p;
                    const Q = (v, i) => C.quant(warp(v, P(v, i)), v.g);
                    const VIS = v => C.visible(N, v.focus, S(v), V);
                    const wrapI = i => ((i % N) + N) % N;
                    const setGlobalFrame = () => {
                        frame = [0, Math.floor(N / 2), N - 1];
                    };
                    const setLocalFrame = () => {
                        const a = VIS(view.A),
                            b = new Set(VIS(view.B)),
                            both = a.filter(i => b.has(i));
                        if (both.length < 3)
                            return false;
                        frame = [both[0], both[Math.floor(both.length / 2)], both[both.length - 1]];
                        return true;
                    };
                    const frameIn = v => {
                        const s = new Set(VIS(v));
                        return frame.every(i => s.has(wrapI(i)));
                    };

                    panel.innerHTML =
                    '<h2>Two fisheyes on one array</h2>' +
                    '<p class="sub">One array of magnitudes, laid evenly round a semicircle. Two fisheyes look at it, each with its own focus, ' +
                    'its own item width, its own pixel grain. They are two Möbius charts of one line. <b>Screen positions do not transfer ' +
                    'between them. Cross ratios do</b> — and a cross ratio against three shared landmarks is an address either view can send ' +
                    'and the other can land on, with no shared scale.</p>' +
                    '<div class="eyebrow">the array</div><div class="btns" id="tfN"></div>' +
                    '<div class="row"><span class="k">drawn in A · in B</span><span class="v" id="tfK">—</span></div>' +
                    '<div class="eyebrow">fisheye A</div>' +
                    '<div class="row"><span class="k">item width at the focus</span><span class="v" id="tfWA">—</span></div>' +
                    '<input type="range" id="tfRWA" min="3" max="80" step="1" value="24">' +
                    '<div class="row"><span class="k">pixel grain</span><span class="v" id="tfGAv">—</span></div><div class="btns" id="tfGA"></div>' +
                    '<div class="row"><span class="k">frame in view</span><span class="v" id="tfFA">—</span></div>' +
                    '<div class="eyebrow">fisheye B</div>' +
                    '<div class="row"><span class="k">item width at the focus</span><span class="v" id="tfWB">—</span></div>' +
                    '<input type="range" id="tfRWB" min="3" max="80" step="1" value="12">' +
                    '<div class="row"><span class="k">pixel grain</span><span class="v" id="tfGBv">—</span></div><div class="btns" id="tfGB"></div>' +
                    '<div class="row"><span class="k">frame in view</span><span class="v" id="tfFB">—</span></div>' +
                    '<div class="eyebrow">the aperture</div><div class="btns" id="tfAp"></div>' +
                    '<p class="note">Hold the item width and the screen rescales with N. Hold the <b>angle</b> and the screen holds while N densifies — switch N and watch the rung marks stay put.</p>' +
                    '<div class="eyebrow">the pyramid, in rungs</div><div id="tfPyr"></div>' +
                    '<p class="note">A rung is one doubling of the reading, tan of the angle from the focus; rung 0 is the fulcrum at 45°, a quarter of the way round. The marks are fixed angles — they never move with N. Each rung outward holds twice the elements of the one before, once a rung is wider than one element; below that the deepest rungs hold the single nearest element on each side, and the outermost rung on each side is cut by the window and undercounts.</p>' +
                    '<div class="eyebrow">sync — what three shared elements buy</div><div class="btns" id="tfSync"></div>' +
                    '<div class="row"><span class="k">elements seen by both</span><span class="v" id="tfS1">—</span></div>' +
                    '<div class="row"><span class="k">A predicts B: median · max error</span><span class="v gold" id="tfS2">—</span></div>' +
                    '<div class="row"><span class="k">audit: a fourth element&#39;s cross ratio, |A − B|</span><span class="v" id="tfS3">—</span></div>' +
                    '<div class="row"><span class="k">verdict</span><span class="v" id="tfS4">—</span></div>' +
                    '<div class="btns" id="tfBreak"></div>' +
                    '<p class="note">Three shared landmarks fix the Möbius map between two charts of one line, so A can predict where every element lands in B. A fourth shared element is an audit: its cross ratio must agree, or one chart is not Möbius. Two fisheyes detect that; they cannot say which broke — a third would.</p>' +
                    '<div class="eyebrow">the context, in octaves</div><div class="btns" id="tfCtx"></div>' +
                    '<p class="note">Below each strip: everything beyond its window, one bar per rung. Rung r holds the elements between atan(2<sup>r</sup>) and atan(2<sup>r+1</sup>) from the focus — doubling from rung to rung while far from the fulcrum, levelling off at it (the two rungs flanking 45° hold the most, and equally), and halving after. Height is the octave&#39;s mean magnitude, the whisker its spread; a summary is a rendering choice, and this is one of them. It is what a wider fisheye would show, computed in O(1) per octave.</p>' +
                    '<div class="eyebrow">a write</div><div class="btns"><button id="tfWrite">bump the element at A&#39;s focus by half</button><button id="tfUnwrite">undo the writes</button></div>' +
                    '<p class="note">The data moved, or I moved? A write changes the array: both views show it and the audit stays coherent. Breaking a chart changes one view: the audit fires. One fisheye cannot tell these apart; two can.</p>' +
                    '<div class="eyebrow">the frame</div><div class="btns" id="tfFrame"></div>' +
                    '<div class="row"><span class="k">landmarks</span><span class="v gold" id="tfL">—</span></div>' +
                    '<div class="eyebrow">a click</div><div class="btns" id="tfMode"></div>' +
                    '<div class="eyebrow">the address</div>' +
                    '<div class="row"><span class="k">sent from</span><span class="v" id="tfA1">—</span></div>' +
                    '<div class="row"><span class="k">the one number</span><span class="v gold" id="tfA2">—</span></div>' +
                    '<div class="row"><span class="k">landed on</span><span class="v" id="tfA3">—</span></div>' +
                    '<div class="eyebrow">the cross ratio of four</div>' +
                    '<div class="row"><span class="k">read in A</span><span class="v" id="tfC1">—</span></div>' +
                    '<div class="row"><span class="k">read in B</span><span class="v" id="tfC2">—</span></div>' +
                    '<div class="row"><span class="k">|A − B|</span><span class="v gold" id="tfC3">—</span></div>' +
                    '<div class="eyebrow">what does not transfer</div>' +
                    '<div class="row"><span class="k">a to b, in A</span><span class="v" id="tfD1">—</span></div>' +
                    '<div class="row"><span class="k">a to b, in B</span><span class="v" id="tfD2">—</span></div>' +
                    '<div class="eyebrow">the separation sweep</div>' +
                    '<div class="btns"><button id="tfSweep">run it at A&#39;s grain</button></div>' +
                    '<div id="tfSW"></div>' +
                    '<p class="note"><b>Registered:</b> address error ∝ 1/separation. <b>Result:</b> true of the address <i>number</i> to the ' +
                    'percent (the survey&#39;s law, reproduced in pixels), false of the <i>recovered element</i>, whose error is set by the grain ' +
                    'and flat in separation — the inverse&#39;s sensitivity grows with separation and cancels it. The wall stands: a frame narrower ' +
                    'than the grain gives no address at all.</p>' +
                    '<div class="verdict" id="tfV">—</div>';
                    hint.textContent = 'drag a strip to turn its focus · click an element to send it to the other view · or pick four and watch their cross ratio hold';

                    const $ = id => document.getElementById(id);
                    const fmt = (x, d) => Number.isFinite(x) ? x.toFixed(d) : '—';
                    const btns = (host, names, get, set) => {
                        host.innerHTML = '';
                        for (const nm of names) {
                            const b = document.createElement('button');
                            b.textContent = nm.label;
                            b.setAttribute('aria-pressed', get() === nm.value);
                            on(b, 'click', () => {
                                set(nm.value);
                                Array.prototype.forEach.call(host.children, c => c.setAttribute('aria-pressed', c.textContent === nm.label));
                                draw();
                            });
                            host.appendChild(b);
                        }
                    };

                    btns($('tfN'), [[1000, '1,000'], [5000, '5,000'], [100000, '100,000'], [1000000, '1,000,000']].map(([v, l]) => ({
                        value: v,
                        label: l
                    })),
                    () => N, v => {
                        N = v;
                        view.A.focus = view.B.focus = 1.0;
                        picks = [];
                        last = null;
                        if (frameMode === 'global')
                            setGlobalFrame();
                        else if (!setLocalFrame()) {
                            frameMode = 'global';
                            setGlobalFrame();
                        }
                    });
                    const grains = [[0, 'exact'], [1, '1 px'], [4, '4 px'], [12, '12 px']].map(([v, l]) => ({
                        value: v,
                        label: l
                    }));
                    btns($('tfGA'), grains, () => view.A.g, v => {
                        view.A.g = v;
                    });
                    btns($('tfGB'), grains, () => view.B.g, v => {
                        view.B.g = v;
                    });
                    btns($('tfAp'), [{
                        value: 'width',
                        label: 'hold item width'
                    }, {
                        value: 'angle',
                        label: 'hold angle'
                    }], () => holdAngle ? 'angle' : 'width',
                    v => {
                        if (v === 'angle') {
                            for (const k of ['A', 'B'])
                                view[k].alpha = Math.atan(V / C.scaleFor(N, view[k].w));
                            holdAngle = true;
                        } else
                            holdAngle = false;
                    });
                    btns($('tfSync'), [{
                        value: true,
                        label: 'show A\u2019s predictions in B'
                    }, {
                        value: false,
                        label: 'hide'
                    }], () => sync, v => {
                        sync = v;
                    });
                    btns($('tfBreak'), [{
                        value: false,
                        label: 'B\u2019s chart is Möbius'
                    }, {
                        value: true,
                        label: 'break B\u2019s chart'
                    }], () => broken, v => {
                        broken = v;
                    });
                    btns($('tfCtx'), [{
                        value: true,
                        label: 'show'
                    }, {
                        value: false,
                        label: 'hide'
                    }], () => context, v => {
                        context = v;
                    });
                    on($('tfWrite'), 'click', () => {
                        const i = C.centered(N, view.A.focus);
                        edits.set(i, Math.min(1.6, mag(i) * 1.5));
                        psN = -1;
                        draw();
                    });
                    on($('tfUnwrite'), 'click', () => {
                        edits.clear();
                        psN = -1;
                        draw();
                    });
                    btns($('tfFrame'), [{
                        value: 'global',
                        label: 'global · first, middle, last'
                    }, {
                        value: 'local',
                        label: 'local · shared, in both views'
                    }],
                    () => frameMode, v => {
                        frameMode = v;
                        if (v === 'global')
                            setGlobalFrame();
                        else if (!setLocalFrame()) {
                            frameMode = 'global';
                            setGlobalFrame();
                        }
                    });
                    btns($('tfMode'), [{
                        value: 'address',
                        label: 'sends an address'
                    }, {
                        value: 'pick',
                        label: 'picks one of four'
                    }], () => mode, v => {
                        mode = v;
                    });
                    on($('tfRWA'), 'input', e => {
                        view.A.w = +e.target.value;
                        draw();
                    });
                    on($('tfRWB'), 'input', e => {
                        view.B.w = +e.target.value;
                        draw();
                    });
                    setGlobalFrame();

                    // the address: one number from one view, solved in the other
                    const send = (from, i) => {
                        const v = view[from],
                            u = view[other(from)];
                        if (!frameIn(v)) {
                            last = {
                                from,
                                i,
                                fail: 'frame out of view in ' + from + ' — nothing to measure against'
                            };
                            return;
                        }
                        if (!frameIn(u)) {
                            last = {
                                from,
                                i,
                                fail: 'frame out of view in ' + other(from) + ' — nowhere to land it'
                            };
                            return;
                        }
                        const A = C.address(Q(v, frame[0]), Q(v, frame[1]), Q(v, frame[2]), Q(v, i));
                        const px = C.solve(Q(u, frame[0]), Q(u, frame[1]), Q(u, frame[2]), A);
                        if (!Number.isFinite(A) || !Number.isFinite(px)) {
                            last = {
                                from,
                                i,
                                A,
                                fail: 'the address is undefined — the frame is narrower than the grain'
                            };
                            return;
                        }
                        const j = C.indexOf(px, N, u.focus, S(u));
                        u.focus = j * PI / N; // land on it: the focus is read back from the element, never tracked
                        last = {
                            from,
                            i,
                            A,
                            j
                        };
                    };

                    // the stage: two strips, each a drag surface with bars for the K visible elements
                    const draw = () => {
                        stage.textContent = '';
                        const K = {},
                            pyr = {},
                            ctxDrawn = {};
                        for (const k of ['A', 'B']) {
                            const v = view[k],
                                s = S(v),
                                vis = VIS(v);
                            K[k] = vis.length;
                            const y0 = v.y;
                            // furniture
                            stage.appendChild(el('text', {
                                x: 30,
                                y: y0 - BAR - 22,
                                fill: '#8a8f99',
                                'font-size': 13,
                                'font-family': 'inherit'
                            })).textContent =
                            'fisheye ' + k + '  ·  focus on element ' + C.centered(N, v.focus) + '  ·  ' + vis.length + ' of ' + N.toLocaleString() + ' drawn';
                            stage.appendChild(el('line', {
                                x1: CX - V,
                                y1: y0,
                                x2: CX + V,
                                y2: y0,
                                stroke: '#3a3d46',
                                'stroke-width': 1
                            }));
                            stage.appendChild(el('line', {
                                x1: CX,
                                y1: y0 - BAR - 8,
                                x2: CX,
                                y2: y0 + 6,
                                stroke: '#6c7280',
                                'stroke-width': 1,
                                'stroke-dasharray': '3 3'
                            }));
                            // the pyramid: rung marks at the fixed angles atan(2^k) from the focus, screen position 2^k·s
                            for (let r = -30; r <= 6; r++) {
                                const pos = Math.pow(2, r) * s;
                                if (pos > V)
                                    break;
                                if (pos < 2)
                                    continue;
                                const inner = Math.pow(2, r - 1) * s;
                                if (((r % 2) + 2) % 2 === 0)
                                    for (const sg of [-1, 1])
                                        stage.appendChild(el('rect', {
                                            x: CX + Math.min(sg * pos, sg * inner),
                                            y: y0 - BAR - 4,
                                            width: pos - inner,
                                            height: BAR + 8,
                                            fill: '#ffffff',
                                            opacity: 0.035
                                        }));
                                for (const sg of [-1, 1])
                                    stage.appendChild(el('line', {
                                        x1: CX + sg * pos,
                                        y1: y0 - BAR - 6,
                                        x2: CX + sg * pos,
                                        y2: y0 + 6,
                                        stroke: '#7a8090',
                                        'stroke-width': 1,
                                        'stroke-dasharray': '2 3'
                                    }));
                                stage.appendChild(el('text', {
                                    x: CX + pos,
                                    y: y0 + 28,
                                    fill: '#7a8090',
                                    'font-size': 9,
                                    'text-anchor': 'middle',
                                    'font-family': 'inherit'
                                })).textContent = 'r' + r;
                            }
                            const rungCount = {};
                            let focusEl = 0;
                            for (const i of vis) {
                                const p = P(v, i);
                                if (!Number.isFinite(p) || Math.abs(p) > V)
                                    continue;
                                if (Math.abs(p) < 1e-9) {
                                    focusEl++;
                                    continue;
                                }
                                const r = Math.floor(Math.log2(Math.abs(p) / s));
                                rungCount[r] = (rungCount[r] || 0) + 1;
                            }
                            pyr[k] = rungCount;
                            const fset = new Set(frame.map(wrapI)),
                                pidx = picks.map(wrapI);
                            const spacing = Math.PI / N * s,
                                step = Math.max(1, Math.ceil(vis.length / 2500));
                            for (let vi = 0; vi < vis.length; vi += step) {
                                const i = vis[vi];
                                const p = Q(v, i);
                                if (!Number.isFinite(p) || Math.abs(p) > V + 2)
                                    continue;
                                const h = Math.max(2, mag(i) * BAR);
                                const isF = fset.has(i),
                                    pk = pidx.indexOf(i),
                                    isLast = last && !last.fail && ((last.from === k && last.i === i) || (last.from !== k && last.j === i));
                                const wpx = Math.max(1, Math.min(6, spacing * 0.55));
                                stage.appendChild(el('rect', {
                                    x: CX + p - wpx / 2,
                                    y: y0 - h,
                                    width: wpx,
                                    height: h,
                                    rx: 0.5,
                                    fill: isF ? '#d4a052' : pk >= 0 ? '#4fb8a8' : '#9aa3b2',
                                    opacity: isF || pk >= 0 ? 1 : 0.82
                                }));
                                if (isLast)
                                    stage.appendChild(el('rect', {
                                        x: CX + p - wpx / 2 - 3,
                                        y: y0 - h - 3,
                                        width: wpx + 6,
                                        height: h + 6,
                                        fill: 'none',
                                        stroke: '#e05a4f',
                                        'stroke-width': 1.5
                                    }));
                                if (isF)
                                    stage.appendChild(el('text', {
                                        x: CX + p,
                                        y: y0 + 16,
                                        fill: '#d4a052',
                                        'font-size': 10,
                                        'text-anchor': 'middle',
                                        'font-family': 'inherit'
                                    })).textContent = i;
                                if (pk >= 0)
                                    stage.appendChild(el('text', {
                                        x: CX + p,
                                        y: y0 - h - 6,
                                        fill: '#4fb8a8',
                                        'font-size': 11,
                                        'text-anchor': 'middle',
                                        'font-family': 'inherit'
                                    })).textContent = 'abcd'[pk];
                            }
                            // THE CONTEXT, IN OCTAVES: one bar per rung beyond the window, each side, nearest octave next to the centre
                            if (context) {
                                const c = C.centered(N, v.focus),
                                    yb = y0 + 74,
                                    hC = 26,
                                    slot = 22,
                                    edgeR = Math.floor(Math.log2(V / s));
                                stage.appendChild(el('text', {
                                    x: 30,
                                    y: yb - hC - 6,
                                    fill: '#6c7280',
                                    'font-size': 10,
                                    'font-family': 'inherit'
                                })).textContent = 'context, in octaves — one bar per rung beyond the window';
                                stage.appendChild(el('line', {
                                    x1: CX - V,
                                    y1: yb,
                                    x2: CX + V,
                                    y2: yb,
                                    stroke: '#2e3138',
                                    'stroke-width': 1
                                }));
                                let drawn = 0;
                                for (let r = edgeR + 1, slotI = 0; r <= 8 && slotI < 13; r++, slotI++) {
                                    const kLo = Math.ceil(Math.atan(Math.pow(2, r)) * N / Math.PI),
                                        kHi = Math.min(Math.ceil(Math.atan(Math.pow(2, r + 1)) * N / Math.PI), Math.floor(N / 2));
                                    if (kHi <= kLo)
                                        break;
                                    for (const sg of [-1, 1]) {
                                        const st = sg > 0 ? rangeStats(c + kLo, c + kHi) : rangeStats(c - kHi + 1, c - kLo + 1);
                                        if (!st)
                                            continue;
                                        const x = CX + sg * (14 + slotI * slot),
                                            hb = Math.max(1, st.mean * hC),
                                            wsk = st.sd * hC;
                                        stage.appendChild(el('rect', {
                                            x: x - 6,
                                            y: yb - hb,
                                            width: 12,
                                            height: hb,
                                            fill: '#6f7686',
                                            opacity: 0.9
                                        }));
                                        stage.appendChild(el('line', {
                                            x1: x,
                                            y1: yb - hb - wsk,
                                            x2: x,
                                            y2: yb - Math.max(0, hb - wsk),
                                            stroke: '#c9ced8',
                                            'stroke-width': 1
                                        }));
                                        if (sg > 0)
                                            stage.appendChild(el('text', {
                                                x,
                                                y: yb + 11,
                                                fill: '#6c7280',
                                                'font-size': 8,
                                                'text-anchor': 'middle',
                                                'font-family': 'inherit'
                                            })).textContent = 'r' + r + '·' + st.n;
                                        drawn++;
                                    }
                                }
                                ctxDrawn[k] = drawn;
                            }
                            // drag surface
                            const hit = el('rect', {
                                x: CX - V,
                                y: y0 - BAR - 30,
                                width: 2 * V,
                                height: BAR + 60,
                                fill: 'transparent',
                                style: 'cursor:grab'
                            });
                            let down = null;
                            on(hit, 'pointerdown', e => {
                                down = {
                                    x: e.clientX,
                                    f: v.focus,
                                    moved: false
                                };
                                hit.setPointerCapture(e.pointerId);
                            });
                            on(hit, 'pointermove', e => {
                                if (!down)
                                    return;
                                const dx = e.clientX - down.x;
                                const scale = stage.getBoundingClientRect().width / 700; // client px → stage units
                                if (Math.abs(dx) > 2)
                                    down.moved = true;
                                v.focus = down.f - C.panAngle(dx / scale, N, v.w);
                                draw();
                            });
                            on(hit, 'pointerup', e => {
                                if (!down)
                                    return;
                                if (!down.moved) {
                                    // a click: the nearest bar
                                    const r = stage.getBoundingClientRect(),
                                        sx = (e.clientX - r.left) * 700 / r.width - CX;
                                    let best = null,
                                        bd = 1e9;
                                    for (const i of VIS(v)) {
                                        const d = Math.abs(Q(v, i) - sx);
                                        if (d < bd) {
                                            bd = d;
                                            best = i;
                                        }
                                    }
                                    if (best !== null && bd < Math.max(10, v.w * 0.5)) {
                                        if (mode === 'address')
                                            send(k, best);
                                        else {
                                            picks = picks.filter(i => i !== best);
                                            picks.push(best);
                                            if (picks.length > 4)
                                                picks.shift();
                                        }
                                    }
                                }
                                down = null;
                                draw();
                            });
                            stage.appendChild(hit);
                        }
                        // SYNC: from the three landmarks, predict every shared element's position in B from its position in A
                        {
                            const inA = new Set(VIS(view.A)),
                                both = VIS(view.B).filter(i => inA.has(i));
                            const fA = frame.map(i => Q(view.A, i)),
                                fB = frame.map(i => Q(view.B, i));
                            const fs = new Set(frame.map(wrapI));
                            let errs = [],
                                audit = null;
                            if (frameIn(view.A) && frameIn(view.B)) {
                                for (const i of both) {
                                    if (fs.has(i))
                                        continue;
                                    const pred = C.solve(fB[0], fB[1], fB[2], C.address(fA[0], fA[1], fA[2], Q(view.A, i))),
                                        act = Q(view.B, i);
                                    if (!Number.isFinite(pred))
                                        continue;
                                    errs.push(Math.abs(pred - act));
                                    if (sync && Math.abs(pred) <= V)
                                        stage.appendChild(el('circle', {
                                            cx: CX + pred,
                                            cy: view.B.y - Math.max(2, mag(i) * BAR) - 5,
                                            r: 2.6,
                                            fill: 'none',
                                            stroke: '#a78bfa',
                                            'stroke-width': 1.2
                                        }));
                                    if (audit === null)
                                        audit = Math.abs(C.cr(fA[0], fA[1], fA[2], Q(view.A, i)) - C.cr(fB[0], fB[1], fB[2], act));
                                }
                            }
                            errs.sort((a, b) => a - b);
                            $('tfS1').textContent = both.length + (frameIn(view.A) && frameIn(view.B) ? '' : '  (frame out of view — nothing to predict from)');
                            $('tfS2').textContent = errs.length ? (fmt(errs[Math.floor(errs.length / 2)], 3) + ' · ' + fmt(errs[errs.length - 1], 3) + ' px') : '—';
                            $('tfS3').textContent = audit === null ? '—' : audit.toExponential(2);
                            const gr = Math.max(view.A.g, view.B.g, 1e-12),
                                bad = audit !== null && audit > 50 * gr * 1e-3 + 1e-9;
                            $('tfS4').textContent = audit === null ? '—' : (bad ? 'one chart is not Möbius — detected by two, attributable only by a third' : (view.A.g || view.B.g ? 'coherent to the grain' : 'coherent: both charts are Möbius, and A knows B entirely'));
                            $('tfS4').className = 'v ' + (audit === null ? '' : bad ? 'red' : 'teal');
                        }
                        // the pyramid table: rungs with visible elements, their fixed angle, and how many elements each holds in A and in B
                        {
                            const rs = Array.from(new Set([...Object.keys(pyr.A || {}), ...Object.keys(pyr.B || {})].map(Number))).sort((a, b) => a - b);
                            let h = '<table style="width:100%;font-size:12px;border-collapse:collapse"><tr style="color:#8a8f99"><td>rung</td><td>angle from focus</td><td>elements · A</td><td>elements · B</td></tr>';
                            for (const r of rs) {
                                const ang = Math.atan(Math.pow(2, r)) * 180 / Math.PI;
                                h += '<tr><td>' + r + '</td><td>' + (ang < 1 ? ang.toFixed(3) : ang.toFixed(1)) + '°</td><td>' + (pyr.A[r] || '—') + '</td><td>' + (pyr.B[r] || '—') + '</td></tr>';
                            }
                            $('tfPyr').innerHTML = h + '</table>';
                        }
                        // readouts
                        $('tfK').textContent = K.A + ' · ' + K.B;
                        $('tfWA').textContent = view.A.w + ' px';
                        $('tfWB').textContent = view.B.w + ' px';
                        $('tfGAv').textContent = view.A.g ? view.A.g + ' px' : 'exact';
                        $('tfGBv').textContent = view.B.g ? view.B.g + ' px' : 'exact';
                        $('tfFA').textContent = frameIn(view.A) ? 'yes' : 'no — zoomed past it';
                        $('tfFA').className = 'v ' + (frameIn(view.A) ? 'teal' : 'red');
                        $('tfFB').textContent = frameIn(view.B) ? 'yes' : 'no — zoomed past it';
                        $('tfFB').className = 'v ' + (frameIn(view.B) ? 'teal' : 'red');
                        $('tfL').textContent = frame.join(' · ');
                        if (last) {
                            $('tfA1').textContent = 'element ' + last.i + ' from ' + last.from;
                            $('tfA2').textContent = Number.isFinite(last.A) ? last.A.toPrecision(9) : '—';
                            if (last.fail) {
                                $('tfA3').textContent = last.fail;
                                $('tfA3').className = 'v red';
                            }
                            else {
                                const hit = last.j === wrapI(last.i);
                                $('tfA3').textContent = 'element ' + last.j + ' in ' + other(last.from) + (hit ? '  ✓ the same one' : '  ✗ off by ' + Math.abs(last.j - wrapI(last.i)));
                                $('tfA3').className = 'v ' + (hit ? 'teal' : 'red');
                            }
                        }
                        if (picks.length === 4) {
                            const pa = picks.map(i => Q(view.A, i)),
                                pb = picks.map(i => Q(view.B, i));
                            const ca = C.cr(pa[0], pa[1], pa[2], pa[3]),
                                cb = C.cr(pb[0], pb[1], pb[2], pb[3]);
                            const inA = picks.every(i => new Set(VIS(view.A)).has(wrapI(i))),
                                inB = picks.every(i => new Set(VIS(view.B)).has(wrapI(i)));
                            $('tfC1').textContent = inA ? fmt(ca, 9) : 'not all four in view';
                            $('tfC2').textContent = inB ? fmt(cb, 9) : 'not all four in view';
                            const d = Math.abs(ca - cb);
                            $('tfC3').textContent = (inA && inB && Number.isFinite(d)) ? d.toExponential(2) : '—';
                            $('tfC3').className = 'v ' + ((inA && inB && d < 1e-9) ? 'teal' : 'gold');
                            $('tfD1').textContent = fmt(Math.abs(pa[0] - pa[1]), 1) + ' px';
                            $('tfD2').textContent = fmt(Math.abs(pb[0] - pb[1]), 1) + ' px';
                        } else {
                            $('tfC1').textContent = $('tfC2').textContent = $('tfC3').textContent = $('tfD1').textContent = $('tfD2').textContent = picks.length + ' of 4 picked';
                        }
                        // verdict
                        const exact = !view.A.g && !view.B.g;
                        let vtext = 'two charts of one line: the focus, width and grain of each are its own, and ' + N.toLocaleString() + ' elements cost ' + K.A + ' and ' + K.B + ' draws';
                        if (picks.length === 4 && exact)
                            vtext = 'four elements, two accounts, one cross ratio — the invariant transfers exactly; the positions do not';
                        else if (picks.length === 4)
                            vtext = 'at a pixel grain the two readings of the cross ratio drift apart by the coarser grain — each view must screen its own spread';
                        if (last && !last.fail)
                            vtext = (last.j === wrapI(last.i) ? 'one number crossed between views with no shared scale and landed on the same element' : 'the address landed ' + Math.abs(last.j - wrapI(last.i)) + ' off — the grain, not the geometry');
                        if (last && last.fail)
                            vtext = last.fail;
                        $('tfV').textContent = vtext;
                    };

                    on($('tfSweep'), 'click', () => {
                        const b = $('tfSweep');
                        b.disabled = true;
                        b.textContent = 'sweeping…';
                        setTimeout(() => {
                            const g = view.A.g || 1,
                                rows = C.sweep(g);
                            let html = '<table style="width:100%;font-size:12px;border-collapse:collapse"><tr style="color:#8a8f99"><td>sep</td><td>address error</td><td>× sep</td><td>recovered error</td></tr>';
                            for (const r of rows)
                                html += '<tr><td>' + r.sep + '</td><td>' + (Number.isFinite(r.addrRel) ? (r.addrRel * 100).toFixed(1) + '%' : '∞ (wall)') + '</td><td>' +
                                (Number.isFinite(r.addrProduct) ? (r.addrProduct * 100).toFixed(0) + '%' : '—') + '</td><td>' + fmt(r.median, 3) + ' el</td></tr>';
                            const ap = rows.filter(r => Number.isFinite(r.addrProduct)).map(r => r.addrProduct),
                                ep = rows.slice(1).map(r => r.median);
                            const flatA = Math.max.apply(null, ap) / Math.min.apply(null, ap),
                                flatE = Math.max.apply(null, ep) / Math.min.apply(null, ep);
                            html += '</table><p class="note">grain ' + g + ' px, 300 two-view trials per row · address × sep flat to ' + flatA.toFixed(2) + '× (1/sep holds) · recovered error flat to ' + flatE.toFixed(2) + '× (grain-limited)' +
                            (rows[0] && !Number.isFinite(rows[0].addrRel) ? ' · sep 1 hit the wall: the frame is narrower than the grain' : '') + '</p>';
                            $('tfSW').innerHTML = html;
                            b.disabled = false;
                            b.textContent = 'run it at A\u2019s grain';
                        }, 20);
                    });

                    draw();
                }

                const bC = document.getElementById('bClosure'),
                    bY = document.getElementById('bCycle');
                const bS = null; // the signature is a page run now, not an overlay
                if (bC)
                    bC.addEventListener('click', () => openSheet('closure'));
                if (bY)
                    bY.addEventListener('click', () => openSheet('cycle'));
                const bTF = document.getElementById('bTwoFisheyes');
                if (bTF)
                    bTF.addEventListener('click', () => openSheet('fisheyes'));
                const bNR = document.getElementById('bNestReaders'),
                    bST = document.getElementById('bStrangeTier'),
                    bSG = document.getElementById('bSignalLand');
                if (bNR)
                    bNR.addEventListener('click', () => openSheet('nesting'));
                if (bST)
                    bST.addEventListener('click', () => openSheet('strange'));
                if (bSG)
                    bSG.addEventListener('click', () => openSheet('signals'));
                const bOB = document.getElementById('bOctaveBrowser');
                if (bOB)
                    bOB.addEventListener('click', () => openSheet('octave'));
                const bOT = document.getElementById('bOctaveTool');
                if (bOT)
                    bOT.addEventListener('click', () => {
                        octaveFromPage = true;
                        openSheet('octave');
                    });

            }
        });

        // The strange tier (wander/patho/make_strange.py → strange.json), 1,024 points each, stored as
        // int16 pairs (×1/30000) in base64: the outlines were traced off a softened grid, not from a formula.
        const STRANGE_DATA = {
            'hilbert': 'h1HFqMpOsqgMTLKoTkmyqJBGsqjSQ7KoFEGyqFY+sqiYO7So5jgiqbY2vKqWNTWtVDXur1I1rbJSNWu1UjUpuFI157pQNaW9NDTwv3sxIsC9LiLA/ysiwEwp0r9vKF69biigum4o4rduKCS1bihmsm0oqK8VKPKsnCaqqlckJ6mnIbSo6R6yqCscsqhtGbKorxayqPETsqgzEbKodA6yqLcLxagmCampXQezq48GUK5yBgyxcgbKs3IGiLZyBke5cgYFvHIGw75yBoHBcgY/xHIG/cZyBrvJcgZ5zHIGN89yBvXRcgaz1HIGcddyBi/aoQbq3JEHe9+CCV/hIgwU4uAOHuKeER7iXBQe4hoXHuLYGR7ilBxB4t4daeTiHSfn4h3l6d8do+ynHNru7BkC7y4XAu9wFALvshEC7/QOAu82DALveAkC77oGAu/8AwLvPgEC74D+Au/C+wLvBPkC70b2Au+I8wLvyvAC7wzuAu9O6wLvkOgC79LlAu8b48PuH+Jh7B7io+ke4uXmJeIn5K3jM+Jq5h7iKOke4ubrHuKk7h7iYvEe4iD0D+K39j3hkPhB32v5qdyO+e3Zjvkv1475cdSO+bPRjvn1zo75N8yO+XnJjvm7xo75/cOO+T/BjvmBvo75w7uO+QW5jvlGto75iLOO+cqwZ/kOroT4eaui9oapB/S/qErxsqiL7rKozeuyqA/psqhR5rKok+OyqNXgsqgX3raobNtBqTbZ2arX1zGtktfqr5LXqLKS12a1ktckuJLX4rqQ16C9eNbvv7/TIsAB0SLAQ84iwJDL1b+vymO9rsqluq7K57euyim1rsprsqvKrK9byvSsH8mJqtzGDKkmxLOoaMGyqKq+sqjsu7KoLrmyqHC2sqiys7Ko9LCyqDeuzqinq7ypqKmTq8WoJa6yqOKwsqigs7KoXrayqBy5sqjau7KomL6yqFbBsqgUxLKo0sayqJDJsqhPzLKoDc+yqMvRsqiJ1LKoR9eyqAXaw6jC3J2pV9+fqynhOa7+4fawHuK0sx7icrYe4jC5HuLuux7iqr434hzAP+QiwP3mIsC76SDAeewPv8zuV7wC75m5Au/btgLvHbQC71+xAu+hrg7vBqzW7/Opm/HVqBT0sqjQ9rKojvmyqEz8sqgK/7KoyQGyqIcEsqhFB7KoAwqyqMEMsqh/D7KoPRKyqPsUsqi5F7KodxqyqDUdsqjzH7mosSJaqVclK6taJ7utQih3sG0oNbNuKPO1biixuG4ob7tuKC2+bijrwG4oqcNrKGLGHSjPyOYmUcqlJK3K8CGuyjIfrsp0HK7KthmuyvgWrso6FC7LlxHHzf4QhdD+EEPT/hAB1v4Qv9j+EH3b/hA73v4Q+eD+ELfj/hB15v4QM+n+EPHr/hCH7p0RAu9CFALvABcC774Z5u56HNHs3R0T6uIdVefiHZfk4h3Z4eIdG9/jHWLcJh7g2TgfJNhNIZfX+COS17Ymktd0KZLXMiyS1/AukteuMZLXbDSS1yo3ndfoOWLYgzwl2pg+ndy6P1nf3j8X4t4/1eTeP5Pn3j9R6t4/D+3nP/HugkEC70BEAu/+RgLvvElb7k5Ms+vCTPXowkw35sJMeePCTLvgwkz93cJMP9vCTIHYwkzD1cJMBdPCTEfQwkyJzcFMCcv4S67KSEmuyopGrsrMQ67KDkGuylA+qcqSOw/K6zhUyNI268WONTHDUjVzwFI1tb1SNfe6UjU5uFI1e7VSNb2yUjX/r1I1RK2CNdequDZTqfk4vKikO7KoYj6yqCBBsqjeQ7KonEayqFpJsqgYTLKo1k63qJRRSKk+VAqrTlaZrTRXQrCuVkuy5FQss1JSPrOVTz6z10w+sxlKPrNbRz6znURGs99B1bTxP5K33j9Qut4/Dr3eP6W/e0AiwB9DIsDdRSLAm0giwFlLIsAXTiXA1VCdwIRTP8KvVafE+FZdx01XG8pOV9nMTleXz05XVdJOVxPVTlfR105Xj9pOV03dTlcL4E5XyeJOV4jlTldG6E5XBOtOV8LtTleA8E5XPvNEV+/1ylYv+EdVYfnXUo75HFCO+V5NjvmgSo754keO+SRFjvlmQo75qD+O+eo8UfkwOij4uTcZ9vM1cvNYNbTwUjX27VI1OOtSNXroUjW85VI1B+MJNR/imzIe4t0vHuIfLSfiYSrD438ogOZuKD7pbij8624ouu5uKHjxbig29GQo1farJ8L4wyWD+ScjjvlpII75qx2O+e0ajvkvGI75cRWO+bMSjvn1D4r5Nw0U+YUKu/coCGv1vwa08nMG9u9yBjjtcgZ66nIGvOdyBv7kcgZA4nIGgd9yBsPccgYF2nIGR9dyBonUcgbL0XIGDc9yBk/McgaRyXIG08Z0BiDE2QblwWQIisDCCiTAdQ0iwDMQIsDxEiLArxUiwG0YIcArGzm/mR2EvOIdxrniHQi34h1QtKsdQLNXGz6zmRg+s9sVPrMdEz6zXxA+s6ENPrPjCj6zJQg+s2cFPrOpAj6z6/8+sy39hrN4+vS1j/myuI75cLuO+S6+jvnswI75qsON+WPGTPm+yPb3Jsqi9ajK8/KuyjXwrsp37a7Kuequyvvnrso95a7Kf+KuysHfpsoD3ffJYdoZyGrYgMWf18LCktcEwJLXRr2S14i6ktfKt5LXDLWG10uzydU+swvTPrNN0D6zj80+s9HKPrMTyD6zVcU+s5fCPrPZvz6zG70+s126PrOft1Cz4bQytUez8Lc+s666PrNsvT+z2r8otCLA3bYiwJu5IsBZvCLAF78iwNXBMMCTxLnAQcdSwnHJzcSLyonHrspHyq7KBc2uysTPrsqC0q7KQNWuyv7Xrsq82q3Kc91jyuLfKMmT4QnHGuJcxB7insEe4uC+HuIivB7iZLke4qa2g+L5swvlP7PJ5z6zh+o+s0TtTLP37hi1Au/WtwLvlLoC71K9Au8QwALvzsIC74zFAu9KyALvCMsC78bNAu+E0ALvQtPu7v/V/eyL1z/qkteB55LXw+SS1wXiktdH35LXjNzB1xna79hL2Pnamtea3ZLXWOCS1xbjktfU5ZLXkuiS11DrktcO7pLXzPCZ14rzPtgv9gzaNviI3Ff5Qt+O+QDijvm+5I75fOeO+Trqjvn47I75tu+O+XTyjvky9Y758PeO+a76jvlt/Y75KwCO+ekCjvmnBY75ZQiO+SMLjvnhDY75nxCO+V0TjvkbFo752RiO+ZcbjvlVHo75EyGN+cojQfk4JgP45ifi9WooNfNuKHfwbii57W4o++puKD3obih/5W4oweJuKAPgYChF3YonsNqjJb3YICOx12QgktemHZLX6BqS1yoYktdsFZLXrhKC1wgRq9X+EO3S/hAv0P4Qcc3+ELPK/hD1x/4QN8X+EHnC/hC7v/4Q/Lz+ED66/hCAtxURw7QQE0SzzhU+s4wYPrNKG0Czph1EtOId+7biHbm54h13vOIdNb/iHfPB6h2xxJEeVcdjIFrJ3yJ4ypklrspXKK7KFiuuytQtrsqSMK7KUDOuyg42rsrMOK7Khjt6yu49OsllP/HG1j8+xN4/gMHeP8K+3j8EvN4/RrneP4i2VUDis+lCPrOnRT6zZUg+syJLULO6TDa1wkz0t8JMsrrCTHC9wkwuwMJM7MLCTKrFwkxoyMJMJsvCTOTNwkyi0MJMYNOoTB3Wn0qM1+FHktcjRZLXZUKS16c/ktfpPJLXLDqo16A3mdjjNa3aVjVY3VI1FuBSNdTiUjWS5VI1UOhSNQ7rUjXM7VI1ivBdNUjz9zXy9YA3MPjwOWD5qzyO+Wk/jvknQo755USO+aNHjvlhSpH5mUzH+sJMgv3CTEAAwkz+AsJMvAXCTHoIwkw4C8JM9g3CTLQQwkxyE8JMMBbCTO4YvUysG19LxB2jSOId5UXiHSdD4h2BQGod3j/WGt4/GBjeP1oV3j+cEt4/3g/aPyANWD9yCuE9JgiPO78G2DhzBho2cgZcM3IGnjByBuAtcgYiK3IGZChyBqUlcgbnInIGKSByBmsdcgatGnIG7xdyBjEVcgZzEnIGtQ9yBvcMdAZECtoGDAhoCNMG1gp0BowNcgZKEHIGCBNyBsYVcgaEGHIGQhtyBgAecga+IIUGeyNrBwwmdwnSJx8MaSjdDm4omxFuKFkUbigXF24o1RluKJEckCjeHbYq4h10LeIdMjDfHfAyqhwpNe8ZUjUxF1I1cxRSNbURUjX3DlI1OQxdNZwJGzaoB/83nAaDOnIGPz1yBv0/cga7QnIGeUVyBjdIcgb1SnIGs01yBnFQswYqUwsIhVViCuVWFw1IV9UPTleTEk5XUhVOVxAYTlfOGk5XjB1OV0ogTlcII05XxiVOV4QoTldCK05XAC5OV74wTld8M05XOjZOV/g4TFepO9xWAT54VYA/NVPdP4BQ3j/CTd4/BEveP0ZI3j+IRd8/ykKaQEJAR0PePwVG3j/DSN4/fksEQL9MNELCTPJEwkywR8JMbkrCTCxNxEzqTzdNmlLWTsZUVVHXVQRUfFUpVtNTMVdRUU5XlE5OV9ZLTlcYSU5XWkZOV5xDTlfeQE5XID4/V2I7lFa8OPdUjjZ7UnY1v09SNQFNUjVDSlI1hUdSNcdEUjUJQlI1Sz9SNY08UzXWOaE1ejf8NtU1JzlVNdQ7UjWSPlI1UEFSNQ5EUjXMRlI1iknPNCxMNTLCTHcvwky5LMJM+ynCTD0nwkx/JMJMwSHCTAMfwkxFHMJMhxnCTMkWwkwLFMJMdhEgTP4Qekn+ELxG/hD+QxwRQkEzE+M/8RXeP68Y3j9tG94/Kx7eP+kg3j+kI6w/DiZuPr0nSTxnKKY5bijoNm4oKjRuKGwxbiiuLm4o8CtuKDIpbih0JmYotiO/JxIh6SUUH10jGB6jIOId5R3iHScb4h1pGOIdqxXiHe0S2R0PETkc/hB8Gf4Qvhb+EAAUqRFvEVEU/hAPF/4QzRn+EIsc/hBJH/4QByL+EMUk/hCDJ/4QQSr+EP8s/hC9L/4QezL/EPk0zBFSNXwUUjU6F1I1+BlSNbYcUjV0H1Q1MiLGNeMkZDcQJ985LCiZPGwoVz9uKBVCbijTRG4okUduKE9KbigNTW4oy09tKIZSNygMVTUnw1YbJUpXbyJOV7EfTlfzHE5XNRpOV3cXTle5FE5X+xFOVz0PTld/DE5XwQlOVwMHTldFBE5XhwFOV8j+TlcK/E5XTPlOV472HlfT8+NVaPHAU7bvHVEK719OAu+hSwLv40gC7yVGAu9nQwLvtkCv7t8/N+zeP3np3j+75uk//eOXQS3iVEQe4hJHHuLQSR7ijkwe4kxPHuIIUvPhm1QJ4YVWHt9DV4HcTlfD2U5XBddOV0fUTleJ0U5Xy85OVw3MTldOyU5XkMZOV9LDTlcUwU5XVr5OV5i7TlfauE5XHLZOV16zTlegsDJX460zVl2rH1SbqQ==',
            'double_spiral': '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',
            'fjords': '3AValA8ER5RBAkWUdABDlKb+RJTY/EaUC/tMlD75aZRx94mUpfWwlNrz4ZQQ8hiVR/BZlX7unpW47O2V8+pGli7po5Zs5wmXq+Vzl+3j6Zcw4mWYdeDomL3ecpkH3QWaVNufmqPZQJv11+ibStaXnKLUTZ390gqeXNHRnr3Pmp8jzm+gicxEofXKI6JmyQuj2cf3o1LG7KTQxOmlUMPqptPB76ddwP2o674Rqny9KasTvEmsr7pvrVC5mq72t8yvoLYCsVK1QbILtIezxbLOtIGxF7ZKsGu3Fq/DuOetILq/rIK7navpvIKqVr5sqce/W6g7wVKntcJRpjTEUqW2xYmkU8fQpBDJ26WHyjGnvMvBqKDMd6owzT6sgs0JrqrN16+lzaOxgc1us1PNOLUUzf+2yczGuHjMi7ojzFG8y8sVvnHL278Zy6HBxspow3rKMMUzyvrG9MnFyMPJkcqpyV/MmckszqnJ+M/OycDRGMp/04nKPtX5yujWccoe2BzJTNm+x3zaY8az2w3F7ty8wzTedcJ83zDBzuD1vyHivb6A45C9FuW+vNTmAr3n52a+wucpwKrmlMFU5crCAuQFxLXiRMVs4YfGLODVx+7eI8m73XzKjdzZy3PbRs062/7ONtx/0D7d+dEj3orT6d4r1ZDf2dYf4JDYmeBN2gPhDtxa4dTdreGa3/HhYuEv4izja+L25GviwubJ4W7ofOCo6cfeMeoC3e/pidvs6KPaYOdD2p3lBtrT48jZCuJ+2ULgKtl83sXYutxP2Pvau9dG2QLXn9ce1g/W/tSn1JnTg9MA0rDSRtAr0n7O5NGyzMPR5crU0RjJ9NFOxyrShMVq0rzDstL3wQnTMsBi02y+t9OnvBDU47pq1Cm569TUtxzW1rad1+a1J9n9tLbaGbRH3Dqz3N1lsnbfmrEU4diwt+IZsFvkSa/25fCtHuctrBjn6qre5cOqGeRZq2XiFqzA4NusH9+lrX/dea7l21KvTtoxsLrY4rAS18mv8NX8rd7VMKy91WWqiNWhqCzV5aat1DilBdSeozHTH6Iw0qygHtEJn0zRHJ7X0l6de9SnnCPW+JvO10+bfNmumizbEprf3H+Zld70mE3gcJgH4vSXxON+l4LlEpdD56yWBelOlsnq9ZWO7KWVVe5flR3wHpXm8eWUsPO0lHv1jJRH92yUFPlOlOH6RpSu/EWUfP5DlEkARZQXAkaU5QNXlLIFdZR/B5iUSwnDlBcL9pThDDKVqw50lXQQvZU8EhGWAhRrlscVzJaKFzOXTBmilwwbG5jKHJqYhh4fmT8grpn3IUOaqyPgml4lhJsNJy+cuijgnGQqmZ0LLFueri0jn04v8Z/sMMWghTKeoR00gaKvNWqjPTdapMg4U6VNOlKmzTtTp009XajGPm6pO0CDqqxBnqsYQ8OsfkQkrqBF6q+sRZuxDkUhsxlEZ7TUQm+1WkFAtr4/5LYPPmq3VTzbt5Y6OLjROIi4CzfLuEI1Brl4M0W5rzF7ueQvsbkaLuq5UCwluoYqaLq9KLO69iYNuzElcbtuI+W7ryFsvPYfCr1EHsS9nhycvgYblr+CGX7A9Rc5wDkWSr+uFFu+IxNxvZYRj7wDELS7bA7futMMEro1C1C5kgmTuO4H6bdABsy3eQTJuAQDgrqoAgi8jQPvvBsFq73BBm6+Ywg7vwAKC8CdC+PANQ3EwcgOrMJXEJzD4RGvxFMTWcbHExLIPhPOycASk8trEl7NOxIszysS+dArEsfSORKS1GcSXNahEiXY5BLs2TITstuCE3fd3BMl34AUcuC6FRLhZxfp4C8Z/t+3Gn3erxu43PEb79qvGyrZVxtj1wobmtXGGtDTihoE0mMaN9BZGmnOXxqezIka3sr3GjXJqRu4x60cfcb9HYLFgB+7xCAhHMTRIpnDjCQuw00m1cISKIjC2SlBwqErA8JrLczBNS+Uwf8wXsHKMiXBlDQywV82DMLyNzDDWDlexLU6kMUOPMnGYj0OyKo+VMnwP5zKNkHty3FCQc2pQ33O+ET6zqtGMM4+SIrM3UjcykhIdckmRyDI70XNxrZEf8V3QznEMEL+wt9AxMGNP1TAgz4Pv5M/cr5FQce98kIBvZJEGrwiRhS7nkfpuf1ImLg4Sii3T0u8tWlMxbUQTga3W09duJBQuLnAURm76lJ+vA5U6b0rVVq/QlbMwFRXRcJgWMPDY1lDxWNaxsZeW0/IUVzdyTtdbssgXgPN/V6dztFfONCjYNjRa2F60zBiINXqYsrWnmN12EtkJNrxZNbbkGWK3ShmQN+4ZvngQGe14sFncuQ7aDHmrmjz5xZptel6aXrr1Wk/7SxqB+94atDwu2qZ8vlqY/Qvay/2XWv794JryPmga5X7uGti/btrMP+9a/4AvGvLArtrmQS3a2YGnWsyCH9r/glZa8oLKmuUDfRqXg+1aiYRcWrtEiRqsxTMaXcWcWk6GAxp+xmjaLobL2h3HbVnMh8zZ+sgqmahIhlmVSSAZQYm4WSzJzZkHCkhY40paGFmKZ1f4yjjXQcoTVzlJudamSWnWS8kiVixIoVXKCGUVpYfsFX9HdpUYBwMVL8aRVMdGYNSehfAUdgV+1A3FDdQlRJyT/gQpE5hD8tNyw3uTD8MAUy8CgZLRQn5Sd0H2EiMBp1HTwVNRi8E5ETlAqlDIAGYQ1//A0Sd/WpE2vvNRBX6JUVO+HVFh/bARb30/kXz8jdGKfFsRlzvfUax7eBF0uxYRDvtokKw7qFBd/BTQULyIUEM9OlA1fWqQJz3W0Bi+QlAKPuyP+v8UD+r/uE+VQA2PgcBnjwCAdE6IQEEOWEBOzfDAXg1QAK8M9MCBjJ7A1gwNASxLvkEEC3JBXMrnwbbKXsHRChlCLcmmgljJTwLqCQFDbkklg6VJaQPByf1D8oohA+GKrMOIizXDbgt/gxPLzAM7DBwC5Ayvgo6NCMK7TWkCak3TwluOTQJOztzCQM9Cgq3PvgKQUAmDJ5BeA3YQuYO8UNmEPFE8hHfRYYTvUYiFY9HwBZbSF8YJkkBGuhJpRuoSkcda0vrHixMqyCKTGgiFkwVJGxLviW4SmQn/UkGKTpJpypzSD8sm0fXLcNGai/jRfsw/kSmMlNEYjSiRG01DUY9Nc5HBDQbSXsyDkrqMPJKVC/NS7ktn0wcLG5NfSo5Ttwo/k6qJzxQriilURwqvVJ5K+xTwiwvVfQtiVYEL/5X6y+NWacwM1s3Melc9jGHXqczll4/Nb5dzzbXXFs46lvhOfNaYzv1WeI89VhePu5X1D/fVkVBylW0QrJUHESRU39FalLeRj5RN0gLUI1J1U7ZSpRNIExOTGZNB0uoTr1J309oSBNRD0dAUrJFZ1NPRIlU50KjVXpBuFYIQMhXkz7QWBk90VmZO9BaGDrHW5I4tlwHN55deDWAXuYzWF9OMixgtDD4YBYvwGF2LYBi0is4Yyoq6WOAKJNk0yY2ZSMl0mVwI2ZmuyHzZgMgeGdJHvZnjRxuaM8a22gPGUJpTRehaYkV+2nEE05q/hGVajYQ12ptDhFrowxEa9gKbWsMCY9rQAeta3MFumumA7tr2AG9awsAu2s9/rprb/yua6L6hWvW+LpqQ/ceaXv2WWch9o1lJ/bMY4/2ImJB95BgI/gSXyf5ql1I+k9cePv6Wq/8sVnz/XBYPv83V5IA+1XiAcFUNQOHU4cESlLXBQVRHwe/T2UId06rCSZN5QrKSxUMX0oyDedIPQ5iRzcPz0UYECpE0xB3QnARB0F2EpVAMRR0QP4VTUDKFxtAlRnhP18boj8oHVo/8B4IP7YgsT58Ik8+PyTAPfUlfjwzJ7w6SSdnOSMmGTliJGc5myLEOdcgGzoSH2k6Sx2uOoIb6jq4GRs77RdHOyIWaDtVFB47lRKgOaQR6TcWET02ahChNJkPFjOqDpsxpA0rMIwMyC5lC3ItLwopLOsI4iqlB5wpXgZaKBQFMSeyA28mEwJtJkkALSeq/pIojP1SKir9DyyT/YQtoP7BLu//BDA5AUoxgAKTMsQD6TP6BEo1Iwa6NjoHOzg4CNU5DQmJO6MJUD3pCRw/yQnZQFEJfkKWCAtEqgeDRZ4G6UZ7BURISwSPSQgD1UrCARtMewBWTSr/kU7Y/cpPhPwGUTT7NVLY+fdSO/j4Um/22VKi9LJS1vKCUgvxR1JB7wVSeO25UbHrZ1Hr6Q1RJuiwUGLmtlCY5MVRL+OAU93i+lTU47JVeOUbVjnnd1b+6MdWxOoTV4zsVldV7pJXHvDUV+fx7lgd84haVvIHXFPxkV1k8C1fk+/aYOjuk2Jh7ldkBu4jZt3t8Gfo7aFpeu3eab/riGn56SZpNui+aHXmTWi15NRn9+JUZzzhzWaC3z5my92nZRfcCWVl2mRktti4YwrXBmNg1UxiudOJYRfSwWB30PFf284dX0HNQl6qy15dGcp1XIrIg1sBx4lafcWKWfzDiFh+wn1XBcFrVpG/VVUgvjlUtLwWU0+77VHtub5QkbiJTzm3UE7mtQtNnrTFS1izfkoSsi9J1bDYR5+vfUZurh1FRK25Qx6sT0IAq99A6altP9Wo9T3Ip3g8xKb4OsSldTnIpO431KNgNumi0DQCojszJKGiMVCgBzB8n2cutJ7GLO6dISsynXgpfZzMJ8+bHiYom20kiJq5Iu+ZAyFdmUof1JiPHVKY0hvYlw8afJdhGAOYORdjmWsW/5r4Fb2c4RWKnhEWVKB2FheiARfPo6gXfaVeGCWnJhnFqPUZYqrLGvurqBuRrYocI69rHbawSh5Ksicf37P/H3i1ziAUt5ohsrhYIle6CiMBvKcjs70wJGy/niQswe4k88IRJb/EIiWMxuclH8h/J/TIKimjydIqWcp3LBfLGi7ay7cvp8xQMX3N5zJYzno0OM8INiLQajdH0fw389JIN5DUqDU71e0zy9RXMu7TxTAL0zAvLtKVLVzR+CuN0FkqxM+yKArPCidVzlwlrM2bI6rNXyLzzkshZdAYIL7R0B4D03EdLtT/G0LVghpH1vcYN9dmFxvY0BX22DUUyNmUEo/a9BBW20UP+tt7DQ7c1wtX26gKANo1CkXYiAqD1pgLEtUcDRzUvQ5V01sQiNL3EbjRjhPf0B8V+s+lFgPPGxj0zXoZycy5GnzLwhsCyn0cXcjVHJnG2hzMxKEcAsMyHELBohuMv/ga3705Gjq8cRmaup8Y/7jFF2i35RbUtQUWQbQmFayyRBQasU8Tk6/dEYquIhAGrmMOlK2gDDOt2wrYrBYJgKxPBzWshgXzq7wDt6vxAYKrKABFq43+gqrI/eyoVP4/p9v/W6anAVGmcgN/pj0FtaYGB/Wmzgg/p5UKjadaDOOnIw4jqEQPC6fcDkqlYA6No/4Ny6G/DQGgqA00nsANaJwDDp+adg7gmAwPLJe/DoSVCw39lEALx5R1CZuUqQd4lA==',
            'cave': '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',
            'coral': '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',
            'hooked_comb': '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',
            'pinwheel': '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',
            'spiral_of_spirals': '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'
        };

        // ── READERS WITHIN READERS: THE ENGINE FOR THREE SHEETS (5 Oct 2026) ─────────────
        // Ported from wander/patho (nest_standpoints.py, dmap.py, make_strange.py, signals.py).
        // One rule throughout: a child reader stands where its parent saw furthest, taken from
        // the parent's own record only, 3% short of the meeting. Up to three children a parent.
        // The known outline (or signal) is the answer key; a point counts as SEEN when some
        // reader's ray towards it meets it first. A point's LEVEL is the generation of reader
        // that first sees it. Meeting distances are exact here: these sheets show where
        // standpoints must be, not how depth is held (that is the SIT lab).
        function strangeShape(key) {
            const b = atob(STRANGE_DATA[key]),
                n = b.length / 4,
                P = [];
            const v = i => {
                const u = b.charCodeAt(i) | (b.charCodeAt(i + 1) << 8);
                return (u & 0x8000 ? u - 0x10000 : u) / 30000;
            };
            for (let i = 0; i < n; i++)
                P.push({
                    x: v(4 * i),
                    y: v(4 * i + 2)
                });
            return P;
        }

        const STRANGE_KEYS = ['hilbert', 'double_spiral', 'fjords', 'cave', 'coral', 'hooked_comb', 'pinwheel', 'spiral_of_spirals'];

        // Levels 0…10 on a dark ground: blue at the first reader, through teal and green, to red.
        const NEST_PAL = ['#6f8cff', '#5fb4f0', '#4fd0d0', '#5fd99a', '#9ad65f', '#d6d24f', '#e8b04f', '#e88a4f', '#e0644f', '#d94f7a', '#c94fd0'];

        const NEST_UNSEEN = '#55555f';

        // Entries into the four facings: the quarter the tangent's h and v signs put it in,
        // counted each time the walk round the outline moves into a different one. Convex = 4.
        function facingEntries(P) {
            const q = P.map((p, i) => {
                const b = P[(i + 1) % P.length],
                    dx = b.x - p.x,
                    dy = b.y - p.y;
                return (dx < 0 ? 1 : 0) + (dy < 0 ? 2 : 0);
            });
            let n = 0;
            for (let i = 0; i < q.length; i++)
                if (q[i] !== q[(i + q.length - 1) % q.length])
                    n++;
            return n;
        }

        // 256 directions over the full turn, in sweep order: the theorem's 64 leaves of a quarter
        // (no trigonometry), turned by quarter turns.
        let _NEST_DIRS = null;

        function nestDirs() {
            if (_NEST_DIRS)
                return _NEST_DIRS;
            const base = tbLeaves(128).map(q => {
                    const L = Math.hypot(1, q);
                    return [1 / L, q / L];
                }),
                D = [];
            for (const [x, y] of base)
                D.push([x, y]);
            for (const [x, y] of base)
                D.push([-y, x]);
            for (const [x, y] of base)
                D.push([-x, -y]);
            for (const [x, y] of base)
                D.push([y, -x]);
            return ( _NEST_DIRS = D) ;
        }

        function _nestChildren(P, o, K) {
            const D = nestDirs(),
                d = D.map(([dx, dy]) => _firstMeet(o.x, o.y, dx, dy, P));
            const fin = d.filter(isFinite);
            if (fin.length < 3)
                return [];
            const med = fin.slice().sort((a, b) => a - b)[fin.length >> 1],
                n = d.length,
                pk = [];
            for (let i = 0; i < n; i++) {
                if (!isFinite(d[i]))
                    continue;
                const a = d[(i + n - 1) % n],
                    b = d[(i + 1) % n];
                if ((!isFinite(a) || d[i] >= a) && (!isFinite(b) || d[i] >= b) && d[i] > med)
                    pk.push([d[i] - med, i]);
            }
            pk.sort((u, v) => v[0] - u[0]);
            return pk.slice(0, K).map(([, i]) => ({
                x: o.x + 0.97 * d[i] * D[i][0],
                y: o.y + 0.97 * d[i] * D[i][1]
            }));
        }

        // The 16 outside readers of NST: 32 h's out, at the turns OCC used.
        function nestOutsideStarts() {
            const half = tbLeaves(32),
                S = half.slice().reverse().map(s => -s).concat(half),
                out = [];
            for (let i = 0; i < S.length; i += 2) {
                const s = S[i],
                    c = (1 - s * s) / (1 + s * s),
                    sn = 2 * s / (1 + s * s);
                out.push({
                    x: -32 * sn,
                    y: -32 * c
                });
            } // (0,−32) turned the other way: the shape's frame
            return out;
        }

        // P: the prepared outline. starts: the level-0 readers. Returns per-target level (−1 never
        // seen), every reader with its level, and the coverage after each level.
        function nestRun(P, starts, LEV, step) {
            LEV = LEV || 10;
            step = step || 2;
            let mnx = Infinity,
                mxx = -Infinity,
                mny = Infinity,
                mxy = -Infinity;
            for (const p of P) {
                mnx = Math.min(mnx, p.x);
                mxx = Math.max(mxx, p.x);
                mny = Math.min(mny, p.y);
                mxy = Math.max(mxy, p.y);
            }
            const size = Math.max(mxx - mnx, mxy - mny),
                tol = 0.01 * size;
            const nT = Math.ceil(P.length / step),
                lvl = new Int16Array(nT).fill(-1);
            const readers = starts.map(o => ({
                x: o.x,
                y: o.y,
                L: 0
            }));
            const look = (o, L) => {
                const s = _occSeen(P, o.x, o.y, step);
                for (let j = 0; j < nT; j++)
                    if (s[j] && lvl[j] < 0)
                        lvl[j] = L;
            };
            for (const o of starts)
                look(o, 0);
            const cov = () => {
                let c = 0;
                for (let j = 0; j < nT; j++)
                    if (lvl[j] >= 0)
                        c++;
                return c / nT;
            };
            const hist = [[0, readers.length, cov()]];
            let fresh = readers.slice();
            for (let L = 1; L <= LEV && hist[hist.length - 1][2] < 0.999; L++) {
                const nxt = [];
                for (const o of fresh)
                    for (const c of _nestChildren(P, o, 3)) {
                        let near = false;
                        for (const r of readers)
                            if (Math.hypot(r.x - c.x, r.y - c.y) < tol) {
                                near = true;
                                break;
                            }
                        if (!near)
                            for (const r of nxt)
                                if (Math.hypot(r.x - c.x, r.y - c.y) < tol) {
                                    near = true;
                                    break;
                                }
                        if (!near)
                            nxt.push({
                                x: c.x,
                                y: c.y,
                                L
                            });
                    }
                if (!nxt.length)
                    break;
                for (const o of nxt)
                    look(o, L);
                readers.push(...nxt);
                fresh = nxt;
                hist.push([L, readers.length, cov()]);
            }
            return {
                lvl,
                readers,
                hist,
                step
            };
        }

        // ── SIGNALS AS LANDSCAPES (wander/patho/signals.py) ──────────────────────────────
        // A reader stands at h = 1 above the line and reads both facings: reading a = distance
        // along / h, home straight down, the corner one h along, the mathematical horizon at the
        // side. A stretch is hidden when an earlier one rises above the line of sight to it.
        // Children stand at the JUMPS in meeting distance — a ray that clears a crest lands far
        // beyond it — measured against flat ground, so the leaves' own spacing far out is not
        // taken for a crest. Every reader holds the same h.
        const SIG_X = 64,
            SIG_M = 4096,
            SIG_H = 1;

        function sigSignals() {
            const M = SIG_M,
                X = SIG_X,
                x = Array.from({
                    length: M
                }, (_, i) => X * i / (M - 1));
            let seed = 11;
            const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
            const norm = s => {
                let m = 0;
                for (const v of s)
                    m += v;
                m /= s.length;
                let a = 0;
                for (const v of s)
                    a = Math.max(a, Math.abs(v - m));
                return s.map(v => a ? 0.45 * (v - m) / a : 0);
            };
            const multi = b => {
                const ph = Array.from({
                    length: 6
                }, () => 2 * Math.PI * rnd());
                return norm(x.map(t => {
                    let s = 0;
                    for (let j = 0; j < 6; j++)
                        s += Math.pow(1 / b, j) * Math.sin(2 * Math.PI * t * Math.pow(b, j) / 24 + ph[j]);
                    return s;
                }));
            };
            const noise = beta => {
                const K = 512,
                    ph = Array.from({
                        length: K
                    }, () => 2 * Math.PI * rnd());
                return norm(x.map(t => {
                    let s = 0;
                    for (let k = 1; k <= K; k++)
                        s += Math.pow(k / X, -beta / 2) * Math.cos(2 * Math.PI * k * t / X + ph[k - 1]);
                    return s;
                }));
            };
            return {
                'flat': x.map(() => 0),
                'one bump': norm(x.map(t => Math.exp(-Math.pow((t - 12) / 1.5, 2)))),
                'sine, period 16 h': norm(x.map(t => Math.sin(2 * Math.PI * t / 16))),
                'sine, period 4 h': norm(x.map(t => Math.sin(2 * Math.PI * t / 4))),
                'chirp': norm(x.map(t => Math.sin(2 * Math.PI * (t / 16 + t * t / 400)))),
                'base 2': multi(2),
                'base 3': multi(3),
                'base golden': multi((1 + Math.sqrt(5)) / 2),
                'noise 1/f': noise(1),
                'noise 1/f²': noise(2),
            };
        }

        function sigX(i) {
            return SIG_X * i / (SIG_M - 1);
        }

        function sigVisible(s, ex, lvl, L) {
            // mark what the eye at (ex, h) sees, both facings
            const M = SIG_M,
                i0 = Math.min(M - 1, Math.max(0, Math.round(ex / SIG_X * (M - 1))));
            for (const dir of [1, -1]) {
                let run = -Infinity;
                for (let i = i0; i >= 0 && i < M; i += dir) {
                    const d = Math.abs(sigX(i) - ex),
                        sl = d > 0 ? (s[i] - SIG_H) / d : -Infinity;
                    if (sl >= run - 1e-12) {
                        if (lvl[i] < 0)
                            lvl[i] = L;
                    }
                    if (sl > run)
                        run = sl;
                }
            }
        }

        // First meeting along each leaf ray, both facings, by the prefix maximum of g = |dx|/(h − s):
        // the ray of reading a meets the signal at the first sample with g ≥ a.
        function _sigChildren(s, ex, A, K) {
            const M = SIG_M,
                i0 = Math.min(M - 1, Math.max(0, Math.round(ex / SIG_X * (M - 1)))),
                pk = [];
            for (const dir of [1, -1]) {
                const idx = [],
                    G = [];
                let g = -Infinity;
                for (let i = i0 + dir; i >= 0 && i < M; i += dir) {
                    g = Math.max(g, Math.abs(sigX(i) - ex) / (SIG_H - s[i]));
                    idx.push(i);
                    G.push(g);
                }
                const meet = a => {
                    let lo = 0,
                        hi = G.length;
                    while (lo < hi) {
                        const m = (lo + hi) >> 1;
                        if (G[m] >= a)
                            hi = m;
                        else
                            lo = m + 1;
                    }
                    if (lo >= G.length)
                        return null;
                    const i = idx[lo];
                    return {
                        xm: sigX(i),
                        d: Math.hypot(sigX(i) - ex, SIG_H - s[i])
                    };
                };
                let prev = null;
                for (const a of A) {
                    const m = meet(a),
                        e = m ? m.d / (SIG_H * Math.hypot(1, a)) : null;
                    if (prev && m && prev.e != null && e - prev.e > 0.1)
                        pk.push([e - prev.e, m.xm]);
                    prev = {
                        e
                    };
                }
            }
            pk.sort((u, v) => v[0] - u[0]);
            return pk.slice(0, K).map(([, xm]) => ex + 0.97 * (xm - ex));
        }

        function sigRun(s, start, LEV) {
            LEV = LEV || 12;
            const A = tbLeaves(256),
                lvl = new Int16Array(SIG_M).fill(-1);
            const readers = [{
                    x: start,
                    L: 0
                }],
                hand = [];
            sigVisible(s, start, lvl, 0);
            const cov = () => {
                let c = 0;
                for (const v of lvl)
                    if (v >= 0)
                        c++;
                return c / SIG_M;
            };
            const hist = [[0, 1, cov()]];
            let fresh = readers.slice();
            for (let L = 1; L <= LEV && hist[hist.length - 1][2] < 0.999; L++) {
                const nxt = [];
                for (const o of fresh)
                    for (const cx of _sigChildren(s, o.x, A, 3)) {
                        if (readers.some(r => Math.abs(r.x - cx) < 0.05) || nxt.some(r => Math.abs(r.x - cx) < 0.05))
                            continue;
                        nxt.push({
                            x: cx,
                            L
                        });
                        hand.push(Math.abs(cx - o.x) / SIG_H);
                    }
                if (!nxt.length)
                    break;
                for (const o of nxt)
                    sigVisible(s, o.x, lvl, L);
                readers.push(...nxt);
                fresh = nxt;
                hist.push([L, readers.length, cov()]);
            }
            return {
                lvl,
                readers,
                hist,
                hand
            };
        }
};
