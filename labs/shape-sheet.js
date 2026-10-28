// SHAPE SHEET (?lab=sht), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, NEW_SHAPE_MIN_N, SHEET_FILL, applyShapeSelection, closeMenu, drawAll, exitEditMode,
// flashStatus, ladderCamera, ladderLayout, pushHistory, rebuildSignalSelect, scheduleSave, state, subpathFromLoop.
// It puts shapeSheet back on the console hook window.__lab once loaded. Loaded the first time one of its buttons is
// pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['shape-sheet'] = function () {
        function shapeSheet(cat) {
            const specs = PRIMITIVES.filter(q => (!cat || q.cat === cat)
            && (typeof q.pts === 'function' || typeof q.loops === 'function'));
            if (!specs.length)
                return 0;
            const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
            // The grid takes the window's aspect rather than being square: a square grid of 79
            // in a landscape window is a column with dead air either side, and the same rule
            // turns the sheet on its side by itself on a phone. It is ladderLayout's arithmetic —
            // this function used to carry its own copy, letter for letter.
            const G = ladderLayout(specs.length);
            const hR = state.hRun || 1;
            const half = G.cell * SHEET_FILL / 2;
            const baseN = state.N;

            if (state.editMode)
                exitEditMode();
            state.selected.clear();
            state.activeSet = new Set();
            state.activeSp = -1;
            state.subpaths = [];

            let made = 0;
            const tone = new Map(); // per category, so tones cycle within a family
            specs.forEach((spec, i) => {
                let loops;
                try {
                    loops = spec.loops ? spec.loops() : [spec.pts()];
                } catch (_) {
                    return;
                }
                if (!loops || !loops.length)
                    return;
                let mnx = Infinity,
                    mny = Infinity,
                    mxx = -Infinity,
                    mxy = -Infinity;
                for (const lp of loops)
                    for (const p of lp) {
                        if (p.x < mnx)
                            mnx = p.x;
                        if (p.x > mxx)
                            mxx = p.x;
                        if (p.y < mny)
                            mny = p.y;
                        if (p.y > mxy)
                            mxy = p.y;
                    }
                const s = (2 * half) / Math.max(mxx - mnx, mxy - mny, 1e-6);
                const bx = (mnx + mxx) / 2,
                    by = (mny + mxy) / 2;
                // Each row is centred on its OWN contents, so a last row of two in a grid of
                // twelve sits under the middle rather than hanging off the left. (G.at does it.)
                const at = G.at(i);
                const ux = at.x,
                    uy = at.y;
                const N = Math.max(spec.loopN || baseN, NEW_SHAPE_MIN_N);
                const ci = Math.max(0, SHAPE_CATS.indexOf(spec.cat));
                const fam = SHEET_HUES[ci % SHEET_HUES.length];
                // +1 so a row opens on a mid tone: every family's first entry is its darkest, and
                // a catalogue whose first cell in each row is the one you can barely see is a
                // catalogue that looks broken at a glance.
                const t = (tone.get(spec.cat) || 0);
                tone.set(spec.cat, t + 1);
                const col = COLOR_RAMP[fam[(t + 1) % fam.length]];
                const idx = [];
                for (const lp of loops) {
                    const sp = subpathFromLoop(lp.map(q => ({
                        x: (ux + (q.x - bx) * s) * hR,
                        y: (uy + (q.y - by) * s) * hR
                    })), N);
                    if (!sp)
                        continue;
                    sp.fill = {
                        color: col,
                        opacity: 0.30
                    };
                    sp.stroke = col;
                    state.subpaths.push(sp);
                    idx.push(state.subpaths.length - 1);
                }
                if (!idx.length)
                    return;
                if (idx.length > 1) {
                    // a holed shape: one run, one group
                    const runId = (state.nextTextRun = (state.nextTextRun || 0) + 1);
                    const gid = state.nextGid++;
                    for (const j of idx) {
                        const q = state.subpaths[j];
                        q.textRun = runId;
                        q.gid = gid;
                        q.groupLead = false;
                    }
                    state.subpaths[idx[0]].groupLead = true;
                }
                made++;
            });
            if (!made)
                return 0;

            if (!state.showFills) {
                state.showFills = true;
                const t = $('tFills');
                if (t)
                    t.checked = true;
            }
            state.svgName = 'shape sheet' + (cat ? ' · ' + cat : '');
            state.lastLoadInfo = {
                totalElements: state.subpaths.length,
                multiSubpath: true,
                subpathCount: state.subpaths.length
            };
            rebuildSignalSelect();
            closeMenu();
            applyShapeSelection(new Set());
            // The camera is set LAST — applyShapeSelection re-frames on its way out, since
            // clearing an isolation is a framing event, so a fit done before it is overwritten.
            // See ladderCamera for why it is by hand rather than fitToView.
            {
                ladderCamera(G, 0.88);
                drawAll();
            }
            pushHistory();
            scheduleSave();

            let leaves = 0;
            for (const sp of state.subpaths)
                leaves += sp.leafX ? sp.leafX.length : 0;
            const holed = specs.filter(q => typeof q.loops === 'function').length;
            const buildMs = t0 ? Math.round(performance.now() - t0) : 0;
            flashStatus('shape sheet' + (cat ? ' · ' + cat : '') + ' — ' + made + ' shapes ('
            + holed + ' with holes) on a ' + G.cols + '×' + G.rows + ' grid, '
            + state.subpaths.length + ' contours, ' + leaves.toLocaleString() + ' leaves · ' + buildMs + ' ms');
            return made;
        }

        // The shape sheet. The category list is built from SHAPE_CATS rather than written
        // into the markup, for the same reason the popover's headings are: a new row is one
        // line in that array and nothing else.
        {
            const bSheet = $('bSheet'),
                selSheet = $('selSheetCat');
            if (selSheet)
                for (const c of SHAPE_CATS) {
                    const o = document.createElement('option');
                    o.value = c;
                    o.textContent = c;
                    selSheet.appendChild(o);
                }
            if (bSheet)
                bSheet.addEventListener('click', () => {
                    const cat = selSheet && selSheet.value ? selSheet.value : null;
                    bSheet.disabled = true;
                    bSheet.textContent = 'laying out…';
                    // Yield once so the label paints: the whole library at 256 leaves is a beat of
                    // solid work, and a button that changes nothing while it thinks reads as broken.
                    setTimeout(() => {
                        try {
                            if (!shapeSheet(cat))
                                flashStatus('nothing in that category');
                        }
                        finally {
                            bSheet.disabled = false;
                            bSheet.textContent = 'shape sheet';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { shapeSheet });
};
