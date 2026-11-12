// DRIVING THE INSTRUMENTS, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2", the first "keep splitting draw.html").
//
// What it holds: the edit view's instruments taking the pointer: the top strip and the right-hand strip, drag per leaf, the rule.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. The page names it in a <script src> before its own script. Edit
// it as you would the editor: the same voice, the same indent. The comment that introduced the block is still in
// draw.html, above the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['instruments'] = function () {
            // Pixels of drag per leaf. Fixed rather than "one lap across the width": at N=2048
            // that would be a third of a pixel per leaf, where the slowest possible flick throws
            // you a hundred leaves. A constant feel is worth more than a constant range.
            const PX_PER_LEAF = 5;

            // Raised while two fingers are sizing the serial strip. A pinch is not a walk, and
            // without this the first finger's drag keeps walking the reading along the contour
            // underneath the resize — one gesture doing two things, neither of them asked for.
            let pinchActive = false;

            // `axis` is 'x', 'y', 'dial', or a function returning one — the header canvas holds
            // two instruments and decides per press which of them was grabbed.
            const attach = (el, axisIn) => {
                if (!el)
                    return;
                const axisOf = () => (typeof axisIn === 'function' ? axisIn() : axisIn);
                let drag = null;
                el.style.touchAction = 'none';
                el.addEventListener('pointerdown', e => {
                    if (pinchActive)
                        return;
                    if (!state.editMode || e.button !== 0)
                        return;
                    if (!axisOf())
                        return; // the element's instrument is not up — not our press
                    const r = el.getBoundingClientRect();
                    drag = {
                        x: e.clientX,
                        y: e.clientY,
                        id: e.pointerId,
                        acc: 0,
                        // For the dial: the angle of the press about the strip's own centre.
                        cx: r.left + r.width / 2,
                        cy: r.top + r.height / 2,
                        ang: 0
                    };
                    drag.ang = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
                    walkBegin(); // a new drag opens a new ledger
                    try {
                        el.setPointerCapture(e.pointerId);
                    } catch (_) {}
                    el.style.cursor = 'grabbing';
                    e.preventDefault();
                });
                el.addEventListener('pointermove', e => {
                    if (!drag || e.pointerId !== drag.id || pinchActive)
                        return;
                    const axis = axisOf();
                    let dk = 0;
                    if (axis === 'x')
                        dk = (e.clientX - drag.x) / PX_PER_LEAF;
                    else if (axis === 'y')
                        dk = (e.clientY - drag.y) / PX_PER_LEAF;
                    else {
                        // A DIAL TURNS. One full revolution walks one full lap of the contour, which is
                        // the only mapping that does not need a number choosing — the dial is a circle
                        // and so is the walk.
                        const a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
                        let da = a - drag.ang;
                        while (da > Math.PI)
                            da -= 2 * Math.PI; // shortest way round the seam
                        while (da < -Math.PI)
                            da += 2 * Math.PI;
                        drag.ang = a;
                        const cur = headReadLeaf();
                        const s0 = cur ? editLeaves(cur.sp) : null;
                        const N = s0 && s0.leafX ? s0.leafX.length : 256;
                        dk = da / (2 * Math.PI) * N;
                    }
                    // Sub-leaf movement is carried rather than dropped, so a slow drag still walks.
                    drag.acc += dk;
                    const whole = Math.trunc(drag.acc);
                    if (!whole) {
                        e.preventDefault();
                        return;
                    }
                    drag.acc -= whole;
                    if (axisOf() !== 'dial') {
                        drag.x = e.clientX;
                        drag.y = e.clientY;
                    }
                    if (nudgeHeadLeaf(whole))
                        drawAll();
                    e.preventDefault();
                });
                const end = e => {
                    if (!drag || (e && e.pointerId !== drag.id))
                        return;
                    try {
                        el.releasePointerCapture(drag.id);
                    } catch (_) {}
                    drag = null;
                    el.style.cursor = '';
                };
                el.addEventListener('pointerup', end);
                el.addEventListener('pointercancel', end);
            };

            // The header carries two instruments in one canvas: the line across the top and the
            // dial under it. Which one you grabbed is decided by where the press landed, so the
            // dial turns and the line slides without either needing its own element.
            const head = $('editHead');
            if (head) {
                let mode = 'x';
                // Capture phase, so the choice is made before attach's own pointerdown runs.
                const which = e => {
                    const r = head.getBoundingClientRect();
                    return (e.clientY - r.top) > r.height * 0.34 ? 'dial' : 'x';
                };
                head.addEventListener('pointerdown', e => {
                    mode = which(e);
                }, true);
                // ── HOLD THE HEADER TO CHANGE THE INSTRUMENT ────────────────────────────
                // The glyph under the number line is one of six readings of the same leaf, and the
                // only way to change it was a select buried in the settings menu — so in practice
                // you looked at whichever one you had last chosen and never compared them, which is
                // the entire point of having six. A hold on the strip steps to the next.
                //
                // It cannot steal either of the two drags this canvas already has: both of those
                // MOVE, and any travel past the tolerance cancels the timer. Holding still on the
                // header is not a gesture the strip had a meaning for, which is why it was free.
                {
                    let hp = null;
                    const cancelHead = () => {
                        if (hp) {
                            clearTimeout(hp.timer);
                            hp = null;
                        }
                    };
                    head.addEventListener('pointerdown', e => {
                        cancelHead();
                        hp = {
                            x: e.clientX,
                            y: e.clientY,
                            timer: setTimeout(() => {
                                hp = null;
                                const keys = ['dial:rungs', 'dial:cell', 'dial:quadrant', 'twodial', 'dome', 'atom'];
                                const i = keys.indexOf(headGlyphKey());
                                setHeadGlyph(keys[(i + 1) % keys.length]);
                                if (navigator.vibrate) {
                                    try {
                                        navigator.vibrate(12);
                                    } catch (_) {}
                                }
                                // setHeadGlyph flashes what the new instrument reads; this says how you got
                                // there, because a glyph that changed under a motionless finger needs to.
                                const said = document.getElementById('status');
                                if (said)
                                    said.textContent = said.textContent + ' · held the header — hold again for the next of six';
                            }, LONG_PRESS_MS)
                        };
                    });
                    head.addEventListener('pointermove', e => {
                        if (hp && Math.hypot(e.clientX - hp.x, e.clientY - hp.y) > LONG_PRESS_MOVE_TOL)
                            cancelHead();
                    });
                    for (const ev of ['pointerup', 'pointercancel', 'pointerleave'])
                        head.addEventListener(ev, cancelHead);
                }
                // The cursor says which instrument is under the pointer before you press: the line
                // slides sideways, the dial turns. One canvas, two gestures, and no way to tell
                // them apart without this.
                head.addEventListener('pointermove', e => {
                    if (head.style.cursor === 'grabbing')
                        return;
                    head.style.cursor = which(e) === 'dial' ? 'grab' : 'ew-resize';
                });
                attach(head, () => mode);
            }
            attach($('serialPanel'), 'y');
            // The SUB-HEADER's horizontal serial is the same instrument lying down — Tom's
            // ruling (Aug 29): "the number line header does [it] properly. do it the same way in
            // the serial panel to move the currently selected leaf." So it goes through the same
            // attach and the same nudgeHeadLeaf as the number line — one write path, the walk
            // ledger included — rather than a private scrub that only parked the read. Axis
            // function, not constant: with the register up, the strip is not this instrument and
            // the press falls through to the long-press and the grain wheel.
            attach($('subHead'), () =>
            (state.subHead && state.subHead !== 'register') ? 'x' : null);
            // The header's wheel walks the same leaf the header's drag walks (Tom's ruling).
            $('editHead').addEventListener('wheel', e => {
                if (!state.editMode)
                    return;
                e.preventDefault();
                wheelWalkStep(e);
            }, {
                passive: false
            });

            // ── SIZING THE SERIAL STRIP ────────────────────────────────────────────────
            // The strip is an instrument you read, and how big you want it depends entirely on
            // what you are doing with it — glance at the rung the leaf is in, or watch the reading
            // cross a band. So it has a size, and the two gestures that mean "bigger" everywhere
            // else in this file mean it here: the wheel, and a two-finger pinch.
            //
            // The panel is CENTRED in its band (see sizeSerialPanel), so both gestures open it out
            // about its own middle — the corner at half height, the one fixed landmark on the axis,
            // does not move while you resize around it.
            (function() {
                const el = $('serialPanel');
                if (!el)
                    return;
                const apply = s => {
                    const was = state.serialSize || 1;
                    const now = clampSerialSize(s);
                    if (now === was)
                        return;
                    state.serialSize = now;
                    drawAll();
                };

                // Wheel. Exponential in the scrolled distance, like the canvas zoom — the same
                // gesture reading the same way, and a trackpad's stream of small deltas comes out
                // proportional to the swipe rather than to how many events it happened to send.
                el.addEventListener('wheel', e => {
                    if (!state.editMode)
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    // (WHEEL_MODE_PX is declared further down this same scope. `typeof` on a const in
                    // its temporal dead zone THROWS rather than answering "undefined", so there is no
                    // guard here — and none is needed: an event cannot fire before the script has run.)
                    const unit = WHEEL_MODE_PX[e.deltaMode] || 1;
                    const dy = Math.max(-240, Math.min(240, e.deltaY * unit));
                    if (!dy)
                        return;
                    apply((state.serialSize || 1) * Math.pow(1.18, -dy / 100));
                }, {
                    passive: false
                });

                // Pinch. ONE TO ONE with the gap between the fingers, and deliberately not the
                // canvas zoom's amplified mapping: there the fingers have nowhere near the range of
                // the thing they drive, and here they are literally holding the two edges of the
                // object they are sizing. Anything but 1:1 would slide out from under them.
                let pinch = null;
                const gap = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
                el.addEventListener('touchstart', e => {
                    if (e.touches.length !== 2 || !state.editMode)
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    pinchActive = true;
                    pinch = {
                        d0: gap(e.touches),
                        s0: state.serialSize || 1
                    };
                }, {
                    passive: false
                });
                el.addEventListener('touchmove', e => {
                    if (!pinch || e.touches.length !== 2)
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    const d = gap(e.touches);
                    if (d > 0 && pinch.d0 > 0)
                        apply(pinch.s0 * (d / pinch.d0));
                }, {
                    passive: false
                });
                const endPinch = e => {
                    if (!pinch || (e && e.touches && e.touches.length >= 2))
                        return;
                    pinch = null;
                    pinchActive = false;
                };
                el.addEventListener('touchend', endPinch);
                el.addEventListener('touchcancel', endPinch);
            })();
};
