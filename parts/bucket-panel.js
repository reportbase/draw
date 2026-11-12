// THE BUCKET PANEL, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2", the first "keep splitting draw.html").
//
// What it holds: the bucket panel (#bucketPanel) and its controls.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. The page names it in a <script src> before its own script. Edit
// it as you would the editor: the same voice, the same indent. The comment that introduced the block is still in
// draw.html, above the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['bucket-panel'] = function () {
            const el = $('bucketPanel');
            // ⚠ THE BUTTON IS GONE — Tom's ruling (Aug 29): "remove the bucket button in the edit
            // view." #bBucketEdit was the only way in (the ?bucket= deep link is the R2 storage
            // bucket, a different bucket), so the panel below is DORMANT: state.bucketPanel can
            // never become true and drawBucketPanel early-returns every frame. The machinery is
            // kept whole — every reference here null-guards on the missing button — so restoring
            // the feature is restoring one <button> in the edit bar, nothing else.
            const btn = $('bBucketEdit');
            const sync = () => {
                if (btn)
                    btn.classList.toggle('active', !!state.bucketPanel);
            };
            if (btn)
                btn.addEventListener('click', e => {
                    if (e.altKey && state.bucketPanel) {
                        // alt-click: hands off, count from here
                        resetBucketHand();
                        drawBucketPanel();
                        flashStatus('bucket reset — size, place and turn');
                        return;
                    }
                    const opening = !state.bucketPanel;
                    setEditPanel(opening ? 'bucket' : null);
                    // Opening it should show the level the scene is ACTUALLY at, not pour up to it from
                    // empty — the animation is for changes you made, and you did not make this one. The
                    // turn starts from zero here for the same reason: laps are counted from when you
                    // started watching.
                    if (opening) {
                        state.bucketTurn = 0;
                        state.bucketRaw = null;
                        state.bucketSp = -1;
                        resetBucketAtoms();
                        state.bucketFill = state.bucketTarget = (typeof bucketLevel === 'function') ? bucketLevel() : 0;
                    }
                    sync();
                    drawAll();
                    flashStatus(state.bucketPanel
                    ? 'bucket — drag it to move it · pinch or wheel to size it · double-click to reset'
                    : 'bucket off');
                });
            sync();
            window.__syncBucketBtn = sync;
            if (!el)
                return;

            const redraw = () => {
                if (typeof drawBucketPanel === 'function')
                    drawBucketPanel();
            };

            // ── the wheel: size ───────────────────────────────────────────────────────
            // On every device now. It used to fork — a trackpad's two-finger pan carried the vessel
            // while a mouse notch sized it — because carrying was a two-finger job and a trackpad
            // has no wheel to tell the two apart with. Carrying is one finger's job now, so the
            // fork has nothing left to do and the wheel means one thing everywhere.
            //
            // Exponential in the scrolled distance, like the canvas zoom, so a trackpad's stream of
            // small deltas comes out proportional to the swipe rather than to how many events it
            // happened to send. stopPropagation as well as preventDefault: the canvas's own wheel
            // handler is on a different element, but the page's is not.
            el.addEventListener('wheel', e => {
                e.preventDefault();
                e.stopPropagation();
                const unit = WHEEL_MODE_PX[e.deltaMode] || 1;
                const dy = Math.max(-240, Math.min(240, e.deltaY * unit));
                if (!dy)
                    return;
                state.bucketSize = clampBucketSize((state.bucketSize || 1) * Math.pow(1.5, -dy / 100));
                redraw();
            }, {
                passive: false
            });

            // ── two fingers: size ─────────────────────────────────────────────────────
            // The gap and nothing else. The midpoint used to carry the vessel as well, which made
            // the two-finger gesture do two things and left the one-finger gesture doing a third —
            // carrying is one finger's job now, and a pinch that only sizes is a pinch you can make
            // without watching where it lands.
            //
            // The gap drives the size through a POWER, not one to one. A 1:1 mapping is the
            // obviously correct one and it is unusably slow: a comfortable pinch takes the gap from
            // about a third of the short side of the screen to about a whole one — a factor of
            // three — against a size that runs from a half to triple, and the fingers run out of
            // travel long before the vessel gets anywhere. The exponent is on the RATIO rather than
            // on the pixels, which is what keeps it reversible: pinch back to the gap you started
            // at and the ratio is 1 again, 1^k is 1, and the size lands exactly where it began.
            const PINCH_GAIN = 2.4;
            let pinch = null;
            const gap = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
            const mid = t => ({
                x: (t[0].clientX + t[1].clientX) / 2,
                y: (t[0].clientY + t[1].clientY) / 2
            });
            el.addEventListener('touchstart', e => {
                if (e.touches.length !== 2)
                    return;
                e.preventDefault();
                e.stopPropagation();
                abandonWalk(); // see below: the first finger takes nothing
                const m = mid(e.touches);
                pinch = {
                    d0: gap(e.touches),
                    s0: state.bucketSize || 1,
                    mx: m.x,
                    my: m.y
                };
                state._bucketGrab = true;
            }, {
                passive: false
            });
            el.addEventListener('touchmove', e => {
                if (!pinch || e.touches.length !== 2)
                    return;
                e.preventDefault();
                e.stopPropagation();
                const d = gap(e.touches);
                if (d > 0 && pinch.d0 > 0) {
                    state.bucketSize = clampBucketSize(pinch.s0 * Math.pow(d / pinch.d0, PINCH_GAIN));
                }
                redraw();
            }, {
                passive: false
            });
            const endPinch = e => {
                if (!pinch || (e && e.touches && e.touches.length >= 2))
                    return;
                pinch = null;
                if (!e || !e.touches || e.touches.length === 0)
                    state._bucketGrab = false;
            };
            el.addEventListener('touchend', endPinch);
            el.addEventListener('touchcancel', endPinch);
            // A SECOND FINGER ANYWHERE abandons the one-finger stroke, not only a second finger on
            // the panel. Land one finger here and the other on the artwork and the panel never
            // hears about the second touch — its touchstart only fires for touches whose target is
            // the panel — so without this the walk would keep running under a gesture that had
            // stopped being a walk.
            window.addEventListener('touchstart', e => {
                if (e.touches.length > 1)
                    abandonWalk();
            }, true);
            // …and the flag that stands the canvas down is cleared the moment the LAST finger
            // leaves, wherever it leaves from. This is a belt-and-braces release, not the ordinary
            // one — the pinch and the walk each clear it on their own way out. It is here because
            // the failure it guards against is not a small one: a grab stuck at true makes the
            // canvas ignore every touch for the rest of the session, with nothing on screen to say
            // why. A gesture ending in an unexpected order must not be able to cause that.
            for (const ev of ['touchend', 'touchcancel']) {
                window.addEventListener(ev, e => {
                    if (!e.touches || e.touches.length === 0)
                        state._bucketGrab = false;
                }, true);
            }

            // ── one finger: carry the vessel ──────────────────────────────────────────
            // Straight 1:1 with the pointer. Anything else on a drag that MOVES a thing is wrong —
            // the object has to stay under the finger that picked it up, or it is not being carried.
            //
            // The press takes the pointer capture, so a fast drag that outruns the panel keeps
            // going instead of being dropped the moment the cursor leaves the element.
            let drag = null;
            // Named for the two-finger handler above, which calls it when a second finger lands.
            // There is nothing to give back any more — carrying is not destructive the way walking
            // the reading was — so it only has to let go.
            function abandonWalk() {
                if (!drag)
                    return;
                el.classList.remove('turning');
                try {
                    el.releasePointerCapture(drag.id);
                } catch (_) {}
                drag = null;
                state._bucketGrab = false;
            }
            el.addEventListener('pointerdown', e => {
                if (pinch || e.button !== 0 || (e.pointerType === 'touch' && e.isPrimary === false))
                    return;
                drag = {
                    id: e.pointerId,
                    x: e.clientX,
                    y: e.clientY
                };
                el.classList.add('turning');
                state._bucketGrab = true; // the canvas stands down (see cv touchstart)
                try {
                    el.setPointerCapture(e.pointerId);
                } catch (_) {}
                e.preventDefault();
                e.stopPropagation();
            });
            el.addEventListener('pointermove', e => {
                if (!drag || pinch || e.pointerId !== drag.id)
                    return;
                state.bucketPanX = (state.bucketPanX || 0) + (e.clientX - drag.x);
                state.bucketPanY = (state.bucketPanY || 0) + (e.clientY - drag.y);
                drag.x = e.clientX;
                drag.y = e.clientY;
                redraw();
                e.preventDefault();
            });
            const endDrag = e => {
                if (!drag || (e && e.pointerId !== drag.id))
                    return;
                el.classList.remove('turning');
                try {
                    el.releasePointerCapture(drag.id);
                } catch (_) {}
                drag = null;
                state._bucketGrab = false;
            };
            el.addEventListener('pointerup', endDrag);
            el.addEventListener('pointercancel', endDrag);

            // A double-click walks through the fill rules. It has to be a gesture rather than a
            // control, because the vessel carries no text — and it has to say what it landed on,
            // because the vessel carries no text. The status line is the only label there is.
            el.addEventListener('dblclick', e => {
                e.preventDefault();
                e.stopPropagation();
                const i = BUCKET_RULES.indexOf(state.bucketRule || 'radius');
                state.bucketRule = BUCKET_RULES[(i + 1) % BUCKET_RULES.length];
                // The level jumps to whatever the new rule says, rather than pouring across from the
                // old one: the two are answers to different questions and easing between them would
                // draw a level that neither rule ever held.
                bucketTrack();
                state.bucketFill = state.bucketTarget;
                redraw();
                flashStatus(state.bucketRule === 'quadrant'
                ? 'bucket: quadrant — drains and fills twice a lap, whatever the shape'
                : state.bucketRule === 'atoms'
                ? 'bucket: readers — one vessel a reader, each blind where another sees'
                : 'bucket: radius — the leaf’s distance from the centre');
            });
};
