// SCATTER (?lab=sca), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be pulled
// from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, NEW_SHAPE_MIN_N, TAU, applyShapeSelection, closeMenu, drawAll, flashStatus,
// pushHistory, quantAlpha, rebuildSignalSelect, rotPts, scheduleSave, state, subpathFromLoop, viewRectUnits,
// zoomOutFloor. It puts SCATTER_COUNT, SCATTER_N, SCATTER_VIEW_GROW, buildScatter, finishScatter, scatterShapes back
// on the console hook window.__lab once loaded. Loaded the first time one of its buttons is pressed, or ?lab= asks
// for one.
(window.TVF_LABS = window.TVF_LABS || {})['scatter'] = function () {
        // ────────────────────────────────────────────────────────────────────
        // SCATTER
        // A crowd, in one press: N primitives at random positions, sizes, turns and colours.
        // It exists to give the instruments something to measure — a field of shapes is where
        // per-shape rungs, the aperture and the alias flag start to say something a single
        // circle cannot.
        //
        // It does NOT go through addPrimitive/loadDrawnStroke in a loop. Those two do the
        // whole after-a-shape-arrives ritual — rebuild the signal list, recentre the camera,
        // redraw, push history — which is right for one shape and is 250 full redraws and 250
        // history frames for this. The subpaths are built directly and the ritual is run ONCE
        // at the end, which is the entire difference between a press that takes a moment and
        // one that locks the tab.
        // ────────────────────────────────────────────────────────────────────
        const SCATTER_COUNT = 250;

        // The crowd lands at the same floor as everything else. It used to land at 64 — the
        // reasoning was that 250 shapes at the working rung is a quarter of a million samples
        // a frame and the scene stops being something you can move around in, which is true
        // as far as it goes. What it missed is that "except here" is not a rule anyone can
        // hold: a page where most shapes are at 256 and a couple of hundred are at 64 is a
        // page where the leaf count means nothing, and every later question about it starts
        // with finding out which kind a shape was.
        //
        // So there is one floor now and no exceptions to it. The cost is real and measured:
        // 250 shapes at 256 leaves is ~55 ms a frame against ~25 at 64. The count selector
        // beside the button is how you buy it back — 100 shapes at 256 leaves runs at ~16 ms,
        // 50 at ~8 — and unlike the rung, the count is a property of the fixture rather than
        // of the shapes in it.
        const SCATTER_N = NEW_SHAPE_MIN_N;

        // How much more world the view shows afterwards: fit the crowd, then pull back so it
        // sits inside a margin instead of jammed against the window edge.
        const SCATTER_VIEW_GROW = 1.15;

        // Build and push `count` shapes and NOTHING else — no redraw, no history, no camera.
        // Split out from scatterShapes so a big batch can be built a chunk at a time with the
        // button reporting progress, and still end in exactly one finishScatter.
        // Single-loop primitives only: a compound declares `loops` and turns into several
        // subpaths sharing a run, which is not what a one-shape-per-slot stress field wants.
        const SCATTER_POOL = PRIMITIVES.filter(q => typeof q.pts === 'function');

        function buildScatter(count) {
            count = Math.max(1, count || SCATTER_COUNT);
            const hR = state.hRun || 1;
            const v = viewRectUnits();
            const span = Math.min(v.halfW, v.halfH);
            // WHICH PRESS THIS IS. Scatter stacks — press it twice and you have two fields in one
            // scene — and without a batch number the second 250 are indistinguishable from the
            // first, which matters the moment you want to delete one of them or read a caption.
            const batch = (state._scatterBatch = (state._scatterBatch || 0) + 1);
            let made = 0;
            for (let i = 0; i < count; i++) {
                const spec = SCATTER_POOL[(Math.random() * SCATTER_POOL.length) | 0];
                let pts;
                try {
                    pts = spec.pts();
                } catch (_) {
                    continue;
                }
                // Size, turn and place: a spread of sizes rather than one, so the field has a
                // foreground and a background instead of reading as wallpaper.
                const rad = (0.035 + Math.random() * 0.105) * span;
                const turn = Math.random() * TAU;
                // Over the WHOLE canvas, corner to corner. The centres run right out to the edge
                // less the shape's own radius, so a big one near the border leans on the edge
                // instead of hanging off it — the point of a stress field is that all of it is on
                // screen and therefore all of it is being drawn.
                const px = v.cx + (Math.random() * 2 - 1) * Math.max(0, v.halfW - rad * 0.85);
                const py = v.cy + (Math.random() * 2 - 1) * Math.max(0, v.halfH - rad * 0.85);
                const loop = rotPts(pts, turn).map(q => ({
                    x: (px + q.x * rad) * hR,
                    y: (py + q.y * rad) * hR
                }));
                const sp = subpathFromLoop(loop, SCATTER_N);
                if (!sp)
                    continue;
                // One colour per shape, worn as both fill and stroke: a translucent body with its
                // own edge, so 250 of them overlapping still read as separate things.
                const col = COLOR_RAMP[(Math.random() * COLOR_RAMP.length) | 0];
                sp.fill = {
                    color: col,
                    opacity: quantAlpha(0.28 + Math.random() * 0.34)
                };
                sp.stroke = col;
                // ── THE FIELD SAYS WHAT IT IS MADE OF ────────────────────────────────────
                // Every shape here is drawn from a known primitive at a known size and turn, and
                // all three were thrown away the moment the loop closed: a scattered field was 250
                // anonymous contours, and there is no way to recover which is which afterwards
                // because the geometry has been rotated and scaled out of recognition.
                //
                // The NAME is the primitive's own label, which is what the shape browser writes
                // under its tile and what the `name` caption key reads — so a scatter followed by
                // arrange-to-grid comes out as a labelled sheet of the library, which is a genuinely
                // useful thing and used to require doing it by hand.
                //
                // The NOTE carries the three numbers that were rolled. They are not decoration:
                // "why is that one ringing" has an answer, and the answer is usually that it is a
                // star at a twentieth of the span. Free to record and impossible to reconstruct.
                sp.gname = spec.label;
                sp.note = 'scatter batch ' + batch + ' · #' + (i + 1) + ' of ' + count
                + ' · radius ' + rad.toFixed(3)
                + ' · turned ' + Math.round(turn * 180 / Math.PI) + '°'
                + ' · ' + col;
                state.subpaths.push(sp);
                made++;
            }
            return made;
        }

        // The once-per-press ritual: everything that has to happen after shapes land, run one
        // time however many were built.
        function finishScatter(made, t0) {
            if (!made)
                return 0;

            // A scatter with the fills hidden is a hedge of outlines; the colour is half of what
            // was just made, so show it.
            if (!state.showFills) {
                state.showFills = true;
                const t = $('tFills');
                if (t)
                    t.checked = true;
            }
            state.svgName = (state.svgName ? state.svgName + ' + ' : '') + 'scatter ' + made;
            state.lastLoadInfo = {
                totalElements: state.subpaths.length,
                multiSubpath: true,
                subpathCount: state.subpaths.length
            };
            state.selected.clear();
            rebuildSignalSelect();
            // NOT fitToView. Fitting frames the artwork across 80% of the SHORT side, which
            // takes a field that was just spread corner to corner and squeezes it into a block
            // in the middle with dead margins either side — the opposite of what a scatter is
            // for. The camera stays where it is and simply opens up 15%, so the crowd keeps the
            // canvas it was scattered over and gains a margin around it.
            state.view.zoom = Math.max(zoomOutFloor(), state.view.zoom / SCATTER_VIEW_GROW);
            // The menu is a modal sheet over the whole window — the scrim swallows the toolbar,
            // so leaving it up after the press hides the thing you pressed for AND makes the
            // shape popover unreachable. The action is done; the sheet goes. Before the draw, so
            // the one draw below is of the finished state.
            closeMenu();
            // Clearing the selection is the LAST step because applyShapeSelection already ends in
            // rebuildScroller + updateStatus + drawAll. Calling it in the middle and then doing
            // those again by hand cost a second strip rebuild and four extra full redraws — 12 s
            // of the 12.4 s a 5000-shape press used to take was this duplication.
            applyShapeSelection(new Set());
            pushHistory();
            scheduleSave();
            // A stress readout, since that is what the button is for: what it built, and what one
            // frame of the result costs. Timed on a SECOND draw — the first lands on top of the
            // garbage the build just made and read 3.2 s where the steady state was 0.6 s.
            const buildMs = (typeof performance !== 'undefined') ? Math.round(performance.now() - t0) : 0;
            let leaves = 0;
            for (const sp of state.subpaths)
                leaves += sp.leafX ? sp.leafX.length : 0;
            // Two timed draws, fastest wins. Even the second draw is still paying off the build's
            // garbage at five thousand shapes (2.8 s, against a steady 0.6 s); by the third the
            // number is the scene's real cost, which is the one worth printing.
            let frameMs = 0;
            if (typeof performance !== 'undefined') {
                frameMs = Infinity;
                for (let i = 0; i < 2; i++) {
                    const f0 = performance.now();
                    drawAll();
                    frameMs = Math.min(frameMs, performance.now() - f0);
                }
                frameMs = Math.round(frameMs * 10) / 10;
            }
            flashStatus('+' + made + ' → ' + state.subpaths.length + ' shapes, '
            + leaves.toLocaleString() + ' leaves · built in ' + buildMs + ' ms · ' + frameMs + ' ms/frame · view +15%');
            return made;
        }

        // The whole thing in one call, for the lab hook and anything else that just wants it
        // done. The button takes the chunked path instead.
        function scatterShapes(count) {
            const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
            return finishScatter(buildScatter(count), t0);
        }

        // The scatter button. It is a drawing action sitting in a pane of instruments, which is
        // deliberate: what it makes is not artwork, it is a load to measure under.
        {
            const bScatter = $('bScatter'),
                selScatter = $('selScatterCount');
            // Built in chunks with a yield between them: 5000 shapes is several seconds of solid
            // work, and a tab that stops answering for that long is indistinguishable from one
            // that has crashed. Chunking costs nothing (the ritual still runs once, at the end)
            // and buys a button that counts up while it works.
            const CHUNK = 250;
            if (bScatter)
                bScatter.addEventListener('click', () => {
                    const total = Math.max(1, parseInt(selScatter ? selScatter.value : SCATTER_COUNT, 10) || SCATTER_COUNT);
                    bScatter.disabled = true;
                    if (selScatter)
                        selScatter.disabled = true;
                    const t0 = performance.now();
                    let made = 0;
                    const step = () => {
                        try {
                            made += buildScatter(Math.min(CHUNK, total - made));
                            if (made < total) {
                                bScatter.textContent = made + '/' + total + '…';
                                setTimeout(step, 0);
                                return;
                            }
                            finishScatter(made, t0);
                        } finally {
                            if (made >= total) {
                                bScatter.disabled = false;
                                bScatter.textContent = 'scatter';
                                if (selScatter)
                                    selScatter.disabled = false;
                            }
                        }
                    };
                    bScatter.textContent = 'scattering…';
                    setTimeout(step, 0); // let the label paint before the first chunk
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { SCATTER_COUNT, SCATTER_N, SCATTER_VIEW_GROW, buildScatter, finishScatter, scatterShapes });
};
