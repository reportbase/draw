// THE MORPH'S OWN SETTINGS, IN THE EDITOR, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2", the first "keep splitting draw.html").
//
// What it holds: the strip of a selected morph's own settings (#morphRunTool): rate, phase, spin, its own path, laps, trail, effect, follows, motion, the track of its keys.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. The page names it in a <script src> before its own script. Edit
// it as you would the editor: the same voice, the same indent. The comment that introduced the block is still in
// draw.html, above the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['morph-strip'] = function () {
            const strip = $('morphRunTool');
            if (!strip)
                return;
            const num = (id, fn) => $(id).addEventListener('change', e => {
                const v = parseFloat(e.target.value);
                if (Number.isFinite(v))
                    morphRunToolApply(r => fn(r, v));
            });
            num('mrRate', (r, v) => r.rate = Math.max(1, Math.min(64, Math.round(v))));
            num('mrSpin', (r, v) => r.spin = v);
            // PHYSICAL MOTIONS: the kind from the select (its usual size when it is new), the size from the box
            $('mrMotion').addEventListener('change', e => {
                const k = e.target.value;
                morphRunToolApply(r => {
                    r.ontoLink = null; // CONTACT THAT FOLLOWS: another kind is set by hand
                    r.motion = k ? morphMotionOk(Object.assign({}, r.motion && r.motion.kind === k ? r.motion : {}, { kind: k })) : null;
                });
            });
            num('mrMotionAmt', (r, v) => {
                if (!r.motion)
                    return;
                if (r.motion.kind === 'chain') { // CHAINS IN THE EDITOR: the selected step's amount
                    const V = morphMotionView(r),
                        L = r.ontoLink,
                        rq = L && L.raw.kind === 'chain' ? L.raw.steps[V.step] : null;
                    if (rq && rq.onto != null && rq.kind !== 'throw')
                        r.ontoLink = null;
                    else if (rq)
                        rq.amount = v;
                    r.motion = V.set(morphMotionOk(Object.assign({}, V.M, { amount: v }), true));
                    return;
                }
                const L = r.ontoLink;
                if (L && L.raw.kind === 'throw') { // a throw's arc is its own; where it lands is still the target's
                    L.raw.amount = v;
                    morphOntoRefresh(r, true);
                    return;
                }
                r.ontoLink = null; // a fall's height or a roll's reach set by hand: no longer worked out from the shape
                r.motion = morphMotionOk(Object.assign({}, r.motion, { amount: v }));
            });
            num('mrLaps', (r, v) => r.laps = Math.max(1, Math.min(64, Math.round(v))));
            $('mrPhase').addEventListener('input', e => morphRunToolApply(r => r.phase = (+e.target.value) / 1000));
            $('mrAt').addEventListener('input', e => morphRunToolApply(r => r.at = (+e.target.value) / 1000));
            $('mrStagger').addEventListener('click', () => {
                const runs = morphRunToolRuns();
                morphRunToolApply(r => r.phase = runs.indexOf(r) / runs.length);
            });
            // FOLLOWING LOOSELY, AND FACING
            $('mrFollow').addEventListener('change', e => {
                const k = e.target.value,
                    amt = (+$('mrFollowAmt').value) / 100;
                morphRunToolApply(r => {
                    r.follow = r.parent && MORPH_FOLLOW.includes(k) ? { kind: k, amount: r.follow ? r.follow.amount : (Number.isFinite(amt) ? amt : 0.5) } : null;
                });
                pushHistory();
            });
            $('mrFollowAmt').addEventListener('input', e => morphRunToolApply(r => {
                if (r.follow)
                    r.follow = { kind: r.follow.kind, amount: (+e.target.value) / 100 };
            }));
            $('mrLook').addEventListener('change', e => {
                const L = morphRuns[+e.target.value] || null;
                morphRunToolApply(r => morphSetLook(r, L));
                pushHistory();
            });
            // KEYS AT CHOSEN TIMES: a key dragged along the track; a stretch clicked for its next ease
            const track = $('mrKeys');
            let drag = null;
            track.addEventListener('pointerdown', e => {
                const key = e.target.closest('.mr-key');
                if (!key)
                    return;
                e.preventDefault();
                drag = { k: +key.dataset.k, id: e.pointerId, moved: false };
                key.setPointerCapture(e.pointerId);
            });
            track.addEventListener('pointermove', e => {
                if (!drag || e.pointerId !== drag.id)
                    return;
                const rc = track.getBoundingClientRect(),
                    runs = morphRunToolRuns(),
                    v = morphSetKeyTime(runs, drag.k, (e.clientX - rc.left) / rc.width);
                if (v == null)
                    return;
                drag.moved = true;
                const r = runs[0];
                morphSetT(!(r.rate > 1) && !r.phase ? v : morphLive.t); // stand on the key being moved, where the clock and the morph's agree
            });
            const dragEnd = e => {
                if (!drag || e.pointerId !== drag.id)
                    return;
                const moved = drag.moved;
                drag = null;
                if (moved) {
                    _mrSig = '';
                    morphBarSync();
                    pushHistory();
                    scheduleSave();
                }
            };
            track.addEventListener('pointerup', dragEnd);
            track.addEventListener('pointercancel', dragEnd);
            track.addEventListener('click', e => {
                const st = e.target.closest('.mr-step');
                if (!st)
                    return;
                const runs = morphRunToolRuns(),
                    k = +st.dataset.s,
                    E = runs[0] && runs[0].eases,
                    cur = E && E[k] != null ? E[k] : null,
                    n = MR_EASES.length, // shift goes back a step: eight eases are a long way round
                    next = MR_EASES[(MR_EASES.indexOf(cur) + (e.shiftKey ? n - 1 : 1)) % n];
                morphSetStepEase(runs, k, next);
                morphRunToolApply(() => {});
                pushHistory();
            });
            $('mrEven').addEventListener('click', () => {
                morphEvenTimes(morphRunToolRuns());
                morphRunToolApply(() => {});
                pushHistory();
            });
            $('mrSpread').addEventListener('click', () => {
                const runs = morphRunToolRuns();
                morphRunToolApply(r => r.at = runs.indexOf(r) / runs.length);
            });
            // CHAINS IN THE EDITOR: a step added after the motion (the motion itself when there is none), a step
            // picked, a border dragged, a step taken out; a contact's own record follows the same change
            const chainOf = M => M && M.kind === 'chain' ? M.steps.slice() : M ? [Object.assign({}, M, { share: 1 })] : [];
            $('mrThen').addEventListener('change', e => {
                const k = e.target.value;
                e.target.value = '';
                if (!k)
                    return;
                morphRunToolApply(r => {
                    if (!r.motion) {
                        r.ontoLink = null;
                        r.motion = morphMotionOk({ kind: k });
                        return;
                    }
                    const steps = chainOf(r.motion);
                    steps.push({ kind: k, share: 1 });
                    r.motion = morphMotionOk({ kind: 'chain', steps });
                    r._step = steps.length - 1;
                    if (r.ontoLink) {
                        const rs = chainOf(r.ontoLink.raw);
                        rs.push({ kind: k, share: 1 });
                        r.ontoLink.raw = { kind: 'chain', steps: rs };
                        morphOntoRefresh(r, true);
                    }
                });
            });
            const steps = $('mrSteps');
            let cut = null;
            steps.addEventListener('click', e => {
                const b = e.target.closest('.mr-seg');
                if (!b)
                    return;
                const i = +b.dataset.i;
                for (const r of morphRunToolRuns())
                    r._step = i;
                _mrSig = '';
                drawAll();
            });
            steps.addEventListener('pointerdown', e => {
                const c = e.target.closest('.mr-cut');
                if (!c)
                    return;
                e.preventDefault();
                cut = { i: +c.dataset.i, id: e.pointerId };
                try {
                    steps.setPointerCapture(e.pointerId);
                } catch (_) {}
            });
            steps.addEventListener('pointermove', e => {
                if (!cut || cut.id !== e.pointerId)
                    return;
                const R = steps.getBoundingClientRect(),
                    f = Math.max(0, Math.min(1, (e.clientX - R.left) / R.width));
                for (const r of morphRuns.length ? morphRunToolRuns() : [])
                    morphSetStepBorder(r, cut.i, f); // the strip is one cycle end to end
                _mrSig = '';
                morphWrite();
                drawAll();
            });
            const cutEnd = e => {
                if (!cut || cut.id !== e.pointerId)
                    return;
                cut = null;
                morphRunToolApply(() => {});
            };
            steps.addEventListener('pointerup', cutEnd);
            steps.addEventListener('pointercancel', cutEnd);
            $('mrStepDel').addEventListener('click', () => {
                morphRunToolApply(r => {
                    const M = r.motion;
                    if (!M || M.kind !== 'chain')
                        return;
                    const i = Math.max(0, Math.min(M.steps.length - 1, r._step || 0)),
                        rest = M.steps.filter((q, j) => j !== i);
                    r.motion = rest.length > 1 ? morphMotionOk({ kind: 'chain', steps: rest }) : morphMotionOk(rest[0]);
                    r._step = Math.max(0, i - 1);
                    const L = r.ontoLink;
                    if (L && L.raw.kind === 'chain' && L.raw.steps.length === M.steps.length) {
                        const rr = L.raw.steps.filter((q, j) => j !== i);
                        L.raw = rr.length > 1 ? { kind: 'chain', steps: rr } : Object.assign({}, rr[0]);
                        delete L.raw.share;
                        if (!rr.some(q => q.onto != null) && L.raw.onto == null)
                            r.ontoLink = null;
                        else
                            morphOntoRefresh(r, true);
                    } else if (L)
                        r.ontoLink = null;
                });
            });
            $('mrEmit').addEventListener('click', () => { // COPIES FROM THE STRIP
                const runs = morphRunToolRuns(),
                    n = Math.round(Math.max(2, Math.min(200, +$('mrCopies').value || 12)));
                if (!runs.length)
                    return;
                const R = cv.getBoundingClientRect(),
                    a = pxToWorld(0, 0, R.width, R.height),
                    b = pxToWorld(R.width, R.height, R.width, R.height);
                const made = morphEmitRuns(runs, n, (Date.now() & 0xffff) + 1, { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) });
                rebuildSignalSelect();
                rebuildScroller();
                _mrSig = '';
                morphWrite();
                morphBarSync();
                pushHistory();
                scheduleSave();
                drawAll();
                flashStatus(made.length ? made.length + ' cop' + (made.length > 1 ? 'ies' : 'y') + ' scattered · undo takes them all back' : 'nothing to copy');
            });
            $('mrOnto').addEventListener('click', () => { // CONTACT
                const other = morphRunToolOther();
                if (!other)
                    return;
                let n = 0;
                morphRunToolApply(r => {
                    if (!r.motion || r.motion.kind === 'chain')
                        return;
                    const raw = Object.assign({}, r.ontoLink && r.ontoLink.raw.kind === r.motion.kind ? r.ontoLink.raw : r.motion, { onto: 0 });
                    if (morphMotionOntoBox(morphMotionOk(raw), morphMotionSize(r), morphShapeBox(other) || { x0: 0, x1: 0, y0: 0, y1: 0, cx: 0 }, 0, 0)) {
                        morphOntoLink(r, raw, [other]); // CONTACT THAT FOLLOWS
                        n++;
                    }
                });
                applyShapeSelection(new Set(morphRunToolRuns().map(r => state.subpaths.indexOf(r.sp)).filter(i => i >= 0)));
                flashStatus(n ? n + ' motion' + (n > 1 ? 's' : '') + ' set onto the shape' : 'nothing to set onto it: fall, bounce, throw and roll can land on a shape');
            });
            $('mrPath').addEventListener('click', () => {
                const runs = morphRunToolRuns(),
                    line = morphRunToolLine();
                if (!runs.length)
                    return;
                morphRunPathsRelease(runs.filter(r => r.path)); // off the old path, if any
                if (line)
                    for (const r of runs)
                        morphRunPathSet(r, line, state.morphPathTurn !== false, state.morphPathMode);
                rebuildSignalSelect();
                rebuildScroller();
                // keep the morphs selected, without the line (which has left the drawing)
                applyShapeSelection(new Set(runs.map(r => state.subpaths.indexOf(r.sp)).filter(i => i >= 0)));
                morphRunToolApply(() => {});
                flashStatus(line ? runs.length + ' morph' + (runs.length > 1 ? 's' : '') + ' riding the line as a path of their own · laps and start set how' : 'off its path · the line is back in the drawing');
            });
            $('mrTrail').addEventListener('change', e => {
                const v = e.target.value;
                morphRunToolApply(r => r.trail = v === '*' ? null : { kind: v, len: r.trail && r.trail.len != null ? r.trail.len : (state.morphTrailLen != null ? state.morphTrailLen : 0.5) });
            });
            $('mrFx').addEventListener('change', e => {
                const v = e.target.value;
                morphRunToolApply(r => {
                    if (!r.exact)
                        r.fx = v ? { kind: v, amount: r.fx && r.fx.amount != null ? r.fx.amount : (state.morphFxAmount != null ? state.morphFxAmount : 0.5) } : null;
                });
            });
            $('mrParent').addEventListener('change', e => {
                const P = morphRuns[+e.target.value] || null;
                morphRunToolApply(r => morphSetParent(r, P, morphLive.t)); // carried from where they stand now
            });
            $('mrClose').addEventListener('click', () => {
                _mrClosedSig = morphRunToolRuns().map(r => morphRuns.indexOf(r)).join(',');
                strip.classList.remove('open');
                drawAll();
            });
};
