// THE SCENE'S TIMELINE, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2", the first "keep splitting draw.html").
//
// What it holds: the morph bar's timeline panel (#morphTimeline): every live morph a row of its keys on the shared clock, the ruler, stops, the camera's row, a chain's steps along a row's foot, dragging keys and borders.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. The page names it in a <script src> before its own script. Edit
// it as you would the editor: the same voice, the same indent. The comment that introduced the block is still in
// draw.html, above the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['timeline'] = function () {
            const P = $('morphTimeline');
            if (!P)
                return;
            const btn = $('bMorphTimeline');
            if (btn)
                btn.addEventListener('click', () => {
                    state.morphTimelineOpen = !state.morphTimelineOpen;
                    _tlSig = '';
                    drawAll();
                });
            // A SEQUENCE: each in turn, sharing the loop in equal windows; or all looping again
            const pick = () => {
                const sel = morphRunToolRuns();
                return sel.length ? sel : morphRuns.slice();
            };
            $('tlTurn').addEventListener('click', () => {
                const runs = pick();
                runs.forEach((r, i) => {
                    r.clip = { start: i / runs.length, len: 1 / runs.length };
                });
                morphTimelineChanged();
                flashStatus(runs.length + ' morphs in turn, each once, a ' + (runs.length > 1 ? (1 / runs.length * 100).toFixed(0) + '%' : 'whole') + ' share of the loop');
            });
            $('tlShow').addEventListener('change', e => { // A CLIP SEEN ONLY WHEN IT PLAYS, and IN AND OUT
                const v = e.target.value;
                const runs = pick().filter(r => r.clip);
                for (const r of runs) {
                    const c = Object.assign({}, r.clip, { show: MORPH_SHOWS.includes(v) ? v : '' });
                    delete c.in;
                    delete c.out;
                    const P = MORPH_CLIP_PRESETS[v];
                    if (P) {
                        c.in = { kind: P.in[0], len: P.in[1] * c.len };
                        c.out = { kind: P.out[0], len: P.out[1] * c.len };
                    }
                    r.clip = morphClipNorm(c);
                }
                morphTimelineChanged();
                if (!runs.length)
                    flashStatus('shows: none of those morphs plays once; press its ↻ (or in turn) first');
            });
            $('tlLoops').addEventListener('click', () => {
                for (const r of pick())
                    r.clip = null;
                morphTimelineChanged();
            });
            $('tlClose').addEventListener('click', () => {
                state.morphTimelineOpen = false;
                drawAll();
            });
            let drag = null;
            const tAt = (e, el) => {
                const rc = el.getBoundingClientRect();
                return Math.max(0, Math.min(0.999, (e.clientX - rc.left) / rc.width));
            };
            // A CAMERA, AND STOPS: the buttons, the switches
            $('tlStop').addEventListener('click', () => {
                const t = morphLive.t;
                if (!morphAddStop(t)) {
                    flashStatus('stops: move the clock into the loop first; a stop at its very start or end is the start or the end');
                    return;
                }
                morphTimelineChanged();
                flashStatus('a stop at ' + t.toFixed(3) + ' · ' + state.morphStops.length + ' in all' + (state.morphStopsOn ? '' : ' — tick "stops" to stop at them while playing here'));
            });
            // AN EXPLAINER'S BEATS: the panel
            $('tlBeats').addEventListener('click', () => {
                state.morphBeatsOpen = !state.morphBeatsOpen;
                _btSig = '';
                drawAll();
            });
            $('btClose').addEventListener('click', () => {
                state.morphBeatsOpen = false;
                drawAll();
            });
            $('btAdd').addEventListener('click', () => {
                if (!morphAddStop(morphLive.t)) {
                    flashStatus('beats: move the clock to where the new beat starts, inside the loop');
                    return;
                }
                morphTimelineChanged();
            });
            $('btPreview').addEventListener('click', () => {
                const d = morphTvfScene();
                try {
                    localStorage.setItem('tvf-explainer-preview', JSON.stringify(d));
                } catch (_) {
                    flashStatus('preview: the browser would not keep the scene for the page (storage full or off)');
                    return;
                }
                window.open(new URL('gallery/explained.html?preview=1', location.href).href, '_blank', 'noopener');
            });
            const bl = $('btList');
            bl.addEventListener('input', e => {
                const row = e.target.closest('.bt-beat');
                if (!row)
                    return;
                const i = +row.dataset.i,
                    B = morphBeatsOk(state.morphBeats, morphBeatSpans(state.morphStops).length);
                B[i][e.target.dataset.f === 'title' ? 'title' : 'text'] = e.target.value;
                state.morphBeats = B;
                scheduleSave();
                morphHistorySoon();
            });
            bl.addEventListener('click', e => {
                const b = e.target.closest('button'),
                    row = e.target.closest('.bt-beat');
                if (!b || !row)
                    return;
                const i = +row.dataset.i,
                    sp = morphBeatSpans(state.morphStops)[i];
                if (!sp)
                    return;
                if (b.dataset.a === 'go')
                    morphSetT(sp.from);
                else if (b.dataset.a === 'frame') { // the view as it is now, the camera's at the beat's end
                    const t = Math.min(sp.to, 1 - 1e-3),
                        C = (state.morphCamera || []).filter(k => Math.abs(k.t - t) > 0.004);
                    C.push({ t, box: morphViewBox() });
                    state.morphCamera = morphCameraOk(C);
                    state.morphCamFollow = true;
                    morphTimelineChanged();
                    flashStatus('beat ' + (i + 1) + ' ends on this view');
                } else if (b.dataset.a === 'drop') {
                    const n = morphBeatSpans(state.morphStops).length;
                    if (n < 2)
                        return;
                    morphRemoveStop(i < n - 1 ? i : i - 1, i);
                    morphTimelineChanged();
                }
            });
            $('tlCamKey').addEventListener('click', () => {
                const t = morphLive.t,
                    C = (state.morphCamera || []).filter(k => Math.abs(k.t - t) > 0.004);
                C.push({ t, box: morphViewBox() });
                state.morphCamera = morphCameraOk(C);
                state.morphCamFollow = true;
                morphTimelineChanged();
                flashStatus('the camera sees this at ' + t.toFixed(3) + ' · ' + state.morphCamera.length + ' camera key' + (state.morphCamera.length === 1 ? '' : 's') + ' — pan or zoom, move the clock, and add the next');
            });
            $('tlCamOn').addEventListener('change', e => {
                state.morphCamFollow = !!e.target.checked;
                morphCameraFollow();
                drawAll();
                scheduleSave();
            });
            $('tlStopsOn').addEventListener('change', e => {
                state.morphStopsOn = !!e.target.checked;
                scheduleSave();
            });
            P.addEventListener('dblclick', e => {
                const st = e.target.closest('.tl-stop'),
                    ck = e.target.closest('.tl-cam');
                if (st)
                    morphRemoveStop(+st.dataset.s, +st.dataset.s + 1); // the beat after it goes with it
                else if (ck)
                    state.morphCamera = (state.morphCamera || []).filter((_, i) => i !== +ck.dataset.c);
                else
                    return;
                e.preventDefault();
                morphTimelineChanged();
            });
            P.addEventListener('pointerdown', e => {
                const sm = e.target.closest('.tl-stop'), // A CAMERA, AND STOPS: a stop or a camera key picked up
                    cm = !sm && e.target.closest('.tl-cam');
                if (sm || cm) {
                    e.preventDefault();
                    drag = { kind: sm ? 'stop' : 'cam', i: +(sm ? sm.dataset.s : cm.dataset.c), id: e.pointerId, moved: false };
                    (sm || cm).setPointerCapture(e.pointerId);
                    return;
                }
                const mcut = e.target.closest('.tl-mcut'); // CHAINS ON THE TIMELINE: a border between two steps
                if (mcut) {
                    e.preventDefault();
                    drag = { kind: 'mcut', r: +mcut.dataset.r, j: +mcut.dataset.j, m: +mcut.dataset.m, id: e.pointerId, moved: false };
                    mcut.setPointerCapture(e.pointerId);
                    return;
                }
                const key = e.target.closest('.tl-key'),
                    clip = !key && e.target.closest('.tl-clip'),
                    track = e.target.closest('.tl-track') || e.target.closest('.tl-ruler');
                if (!key && !track)
                    return;
                e.preventDefault();
                if (clip) { // A MORPH THAT PLAYS ONCE: its bar moved, or an end of it stretched
                    const run = morphRuns[+clip.dataset.r],
                        rc = clip.getBoundingClientRect(),
                        x = e.clientX;
                    if (!run || !run.clip)
                        return;
                    const kind = x - rc.left < 6 ? 'start' : rc.right - x < 6 ? 'end' : 'move';
                    drag = { kind: 'clip', part: kind, r: +clip.dataset.r, id: e.pointerId, t0: tAt(e, clip.parentElement), c0: { start: run.clip.start, len: run.clip.len }, moved: false };
                    clip.setPointerCapture(e.pointerId);
                    return;
                }
                if (key) {
                    drag = { kind: 'key', r: +key.dataset.r, k: +key.dataset.k, m: +key.dataset.m, id: e.pointerId, moved: false };
                    key.setPointerCapture(e.pointerId);
                } else {
                    drag = { kind: 'scrub', ruler: track.classList.contains('tl-ruler') || track.id === 'tlCamTrack', r: +track.dataset.r, id: e.pointerId };
                    track.setPointerCapture(e.pointerId);
                    morphSetT(tAt(e, track));
                }
            });
            P.addEventListener('pointermove', e => {
                if (!drag || e.pointerId !== drag.id)
                    return;
                // the row looked up afresh: should the rows be rebuilt mid-drag, a held element is gone
                const el = (drag.kind === 'scrub' && drag.ruler) || drag.kind === 'stop' || drag.kind === 'cam' ? $('tlRuler') : P.querySelector(`.tl-track[data-r="${drag.r}"]`);
                if (!el)
                    return;
                const t = tAt(e, el);
                if (drag.kind === 'stop' || drag.kind === 'cam') { // A CAMERA, AND STOPS: moved along the clock
                    const L = drag.kind === 'stop' ? state.morphStops : state.morphCamera;
                    if (!L || L[drag.i] == null)
                        return;
                    if (drag.kind === 'stop')
                        L[drag.i] = Math.max(0.001, Math.min(0.999, t));
                    else
                        L[drag.i].t = t;
                    drag.moved = true;
                    morphBarSync();
                    drawAll();
                    return;
                }
                if (drag.kind === 'scrub') {
                    morphSetT(t);
                    return;
                }
                const run = morphRuns[drag.r];
                if (!run)
                    return;
                if (drag.kind === 'mcut') {
                    morphSetStepBorder(run, drag.j, morphSharedCycle(run, t, drag.m));
                    drag.moved = true;
                    _mrSig = '';
                    morphWrite();
                    drawAll();
                    return;
                }
                if (drag.kind === 'clip' || (run.clip && (drag.k === 0 || drag.k === run.keys.length - 1))) {
                    // a clip's bar, or its first or last key, which are its ends
                    const c0 = drag.c0 || { start: run.clip.start, len: run.clip.len },
                        part = drag.kind === 'clip' ? drag.part : drag.k === 0 ? 'start' : 'end',
                        end0 = c0.start + c0.len,
                        MIN = 0.02;
                    let st = c0.start,
                        en = end0;
                    if (part === 'move') {
                        const d = Math.max(-c0.start, Math.min(1 - end0, t - drag.t0));
                        st += d;
                        en += d;
                    } else if (part === 'start')
                        st = Math.max(0, Math.min(end0 - MIN, t));
                    else
                        en = Math.min(1, Math.max(c0.start + MIN, t));
                    run.clip = Object.assign({}, run.clip, { start: st, len: en - st });
                    drag.c0 = c0;
                    drag.moved = true;
                    run._centres = null;
                    morphWrite();
                    morphBarSync();
                    drawAll();
                    return;
                }
                // the shared time back onto the morph's own clock, on the lap the key was picked up on
                // (a ramp of two keys is not a loop: its times are held in [0, 1] as they come)
                let u;
                if (run.clip) { // a middle key of a clip: its share of the way from the first key to the last
                    const T = morphKeyTimes(run),
                        K = run.keys.length,
                        pp = Math.max(0, Math.min(1, (t - run.clip.start) / run.clip.len));
                    u = T[0] + pp * (T[K - 1] - T[0]);
                } else {
                    u = t * (run.rate || 1) + (run.phase || 0) - drag.m;
                    u = run.keys.length === 2 ? Math.max(0, Math.min(1, u)) : u - Math.floor(u);
                }
                const v = morphSetKeyTime([run], drag.k, u);
                if (v == null)
                    return;
                drag.moved = true;
                morphSetT(morphKeyShared(run, drag.k)[drag.m]); // stand on the key being moved
            });
            const end = e => {
                if (!drag || e.pointerId !== drag.id)
                    return;
                const moved = (drag.kind === 'key' || drag.kind === 'clip' || drag.kind === 'mcut' || drag.kind === 'stop' || drag.kind === 'cam') && drag.moved;
                if (drag.kind === 'stop' || drag.kind === 'cam') { // put back in order once let go
                    const k = drag.kind === 'cam' && !drag.moved ? (state.morphCamera || [])[drag.i] : null;
                    state.morphStops = morphStopsOk(state.morphStops);
                    state.morphCamera = morphCameraOk(state.morphCamera);
                    if (k)
                        morphSetT(k.t); // a camera key clicked: stand on it
                }
                drag = null;
                if (moved) {
                    _mrSig = '';
                    morphBarSync();
                    pushHistory();
                    scheduleSave();
                }
            };
            P.addEventListener('pointerup', end);
            P.addEventListener('pointercancel', end);
            P.addEventListener('click', e => {
                const once = e.target.closest('.tl-once');
                if (once) { // looping or once
                    const run = morphRuns[+once.dataset.r];
                    if (run) {
                        run.clip = run.clip ? null : { start: 0, len: 1 };
                        morphTimelineChanged();
                    }
                    return;
                }
                const lab = e.target.closest('.tl-lab');
                if (!lab)
                    return;
                const run = morphRuns[+lab.dataset.r],
                    i = run ? state.subpaths.indexOf(run.sp) : -1;
                if (i >= 0) {
                    applyShapeSelection(new Set([i]));
                    drawAll();
                }
            });
};
