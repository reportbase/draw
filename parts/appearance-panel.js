// THE APPEARANCE POPOVER, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2", the first "keep splitting draw.html").
//
// What it holds: the appearance popover: fill, line and description, the selection setters the canvas rows called.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. The page names it in a <script src> before its own script. Edit
// it as you would the editor: the same voice, the same indent. The comment that introduced the block is still in
// draw.html, above the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['appearance-panel'] = function () {
            // ONE CONTROLLER, THREE DRAWERS. The panel split into fill / line / description (see
            // the markup note), and the split is presentational: the same fields, the same getters,
            // the same commit rule. Keeping one controller is what guarantees they cannot drift —
            // a second copy of "read the selection and ring the swatch" is how two panels come to
            // disagree about what is selected.
            const PANES = ['stylePop', 'linePop', 'descPop'];
            const pop = $('stylePop');
            if (!pop)
                return;
            // (or the strip at the foot showing the swatches as its tiles, which reads its rings from these: 13 Nov 2026,
            // THE STRIP SAYS ONE OF SEVERAL THINGS in draw.html)
            const anyOpen = () => PANES.some(id => {
                const e = $(id);
                return e && e.classList.contains('open');
            }) || /^(fill|line)$/.test(document.body.dataset.strip || '');
            const fillGrid = $('spFillGrid'),
                lineGrid = $('spLineGrid');
            const wIn = $('spWidth'),
                faIn = $('spFillAlpha'),
                laIn = $('spLineAlpha');
            const wVal = $('spWidthVal'),
                faVal = $('spFillAlphaVal'),
                laVal = $('spLineAlphaVal');

            // Built from the ramps, not written into the markup: one list, one source of truth.
            const buildGrid = (grid, stops, apply) => {
                if (!grid)
                    return;
                grid.textContent = '';
                stops.forEach((c, i) => {
                    const el = document.createElement('button');
                    el.className = 'sw' + (c == null ? ' none' : '');
                    el.dataset.i = String(i);
                    if (c != null)
                        el.style.background = c;
                    el.title = c == null ? 'no fill' : c;
                    el.addEventListener('click', () => {
                        apply(c);
                        commit();
                    });
                    grid.appendChild(el);
                });
            };
            // A colour or a released slider is one committed change: one history entry, one
            // redraw, and the popover re-reads itself so a mixed selection stops saying "mixed"
            // the moment it stops being mixed.
            const commit = () => {
                pushHistory();
                drawAll();
                syncStylePop();
                scheduleSave();
            };
            // Dragging a slider paints live but does NOT push history on every step — the same
            // deal the canvas tracks made, where the whole drag was one undo.
            const live = () => {
                drawAll();
                syncStylePop(true);
            };

            buildGrid(fillGrid, FILL_STOPS, c => setSelectionFillColor(c));
            buildGrid(lineGrid, LINE_STOPS, c => setSelectionStrokeColor(c));

            if (wIn) {
                wIn.addEventListener('input', () => {
                    setSelectionLineWidth(parseFloat(wIn.value));
                    live();
                });
                wIn.addEventListener('change', commit);
            }
            if (faIn) {
                faIn.addEventListener('input', () => {
                    setSelectionFillAlpha(parseFloat(faIn.value));
                    live();
                });
                faIn.addEventListener('change', commit);
            }
            if (laIn) {
                laIn.addEventListener('input', () => {
                    setSelectionStrokeAlpha(parseFloat(laIn.value));
                    live();
                });
                laIn.addEventListener('change', commit);
            }

            // `dragging` keeps the slider you are holding from being written to underneath you —
            // rounding its own value back into it mid-drag makes the knob stutter.
            window.syncStylePop = function(dragging) {
                // Any of the three being up is reason to re-read. Testing only the fill drawer would
                // have left the line sliders and the name fields stale whenever one of the other two
                // was the one on screen — which is most of the time now.
                if (!anyOpen())
                    return;
                const pct = v => Math.round(v * 100) + '%';
                const lw = selectionLineWidth(),
                    fc = selectionFillColor(),
                    sc = selectionStrokeColor();
                const fa = selectionFillAlpha(),
                    la = selectionStrokeAlpha();
                if (wIn && !dragging)
                    wIn.value = String(lw.value);
                if (wVal) {
                    wVal.textContent = lw.mixed ? 'mixed' : lw.value.toFixed(2);
                    wVal.classList.toggle('mixed', !!lw.mixed);
                }
                if (faIn && !dragging)
                    faIn.value = String(fa.value);
                if (faVal) {
                    faVal.textContent = fa.mixed ? 'mixed' : pct(fa.value);
                    faVal.classList.toggle('mixed', !!fa.mixed);
                }
                if (laIn && !dragging)
                    laIn.value = String(la.value);
                if (laVal) {
                    laVal.textContent = la.mixed ? 'mixed' : pct(la.value);
                    laVal.classList.toggle('mixed', !!la.mixed);
                }
                // The ring marks the cell the selection is standing in. A MIXED selection gets no
                // ring at all: pointing at one of the several colours in play would be a wrong
                // answer, where no ring is merely an incomplete one.
                const ring = (grid, stops, cur) => {
                    if (!grid)
                        return;
                    const idx = cur.mixed ? -1 : colorStopIndex(cur.value, stops);
                    for (const el of grid.children)
                        el.classList.toggle('on', Number(el.dataset.i) === idx);
                };
                ring(fillGrid, FILL_STOPS, fc);
                ring(lineGrid, LINE_STOPS, sc);
                syncMetaFields();
            };

            // ── name and description ────────────────────────────────────────────────
            // Written as you type. There is no OK button because there is nothing to confirm:
            // every other control in this popover applies on the spot, and a text field that
            // waited for Enter would be the one control in the app you could fill in, close, and
            // find empty. The HISTORY frame is what waits — see below.
            const nameIn = $('spName'),
                noteIn = $('spNote'),
                metaNote = $('spMetaNote');
            let typing = false;
            function syncMetaFields() {
                if (!nameIn || !noteIn)
                    return;
                const nm = selectionMeta('gname'),
                    nt = selectionMeta('note');
                if (!typing) {
                    nameIn.value = nm.value;
                    noteIn.value = nt.value;
                }
                nameIn.placeholder = nm.mixed ? 'several names' : (nm.count ? 'unnamed' : 'select a shape');
                noteIn.placeholder = nt.mixed ? 'several descriptions' : (nt.count ? 'what it is for…' : 'select a shape');
                nameIn.classList.toggle('mixed', !!nm.mixed);
                noteIn.classList.toggle('mixed', !!nt.mixed);
                nameIn.disabled = noteIn.disabled = !nm.count;
                if (metaNote) {
                    // What the fields are about to act on, said plainly — because "name" means
                    // something different when a group is selected (it names the group, on its
                    // leader) and when four loose shapes are, and the difference is not guessable.
                    const sel = selectedIndices();
                    let grouped = 0;
                    const seen = new Set();
                    for (const i of sel) {
                        const sp = state.subpaths[i];
                        if (sp && sp.gid != null && !seen.has(sp.gid)) {
                            seen.add(sp.gid);
                            grouped++;
                        }
                    }
                    metaNote.textContent = !sel.length ? 'nothing selected.'
                    : grouped ? ('naming ' + (grouped > 1 ? grouped + ' groups' : 'the group') + ' — the name lands on its leader.')
                    : (sel.length > 1 ? 'applies to all ' + sel.length + ' selected shapes.' : '');
                }
            }
            // ONE HISTORY FRAME PER EDIT, NOT PER KEYSTROKE. Typing "mushroom" is one act and
            // should be one undo; committing on every input event would put eight frames in the
            // stack and make ⌘Z into a backspace. The frame is pushed when the field settles —
            // on blur, on Enter, or after a pause — and pushHistory is a no-op when nothing has
            // actually changed, so a field that is opened and closed untouched costs nothing.
            let commitT = 0;
            const commitMeta = () => {
                clearTimeout(commitT);
                commitT = 0;
                typing = false;
                pushHistory();
                scheduleSave();
            };
            const armCommit = () => {
                clearTimeout(commitT);
                commitT = setTimeout(commitMeta, 900);
            };
            const bindMeta = (el, field) => {
                if (!el)
                    return;
                el.addEventListener('input', () => {
                    typing = true;
                    const res = setSelectionMeta(field, el.value);
                    if (!res.ok)
                        return;
                    rebuildScroller(); // the tile's caption is the name, so it repaints with it
                    drawAll();
                    armCommit();
                });
                el.addEventListener('blur', () => {
                    // The stored value is the CLEANED one, so the box is corrected on the way out:
                    // trailing spaces, a name past 24 characters. Doing it per keystroke would fight
                    // the cursor; doing it never would leave the box disagreeing with the tile.
                    if (typing)
                        commitMeta();
                    syncMetaFields();
                });
                el.addEventListener('keydown', e => {
                    if (e.key === 'Enter' && (el.tagName !== 'TEXTAREA' || e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        el.blur();
                    }
                    // Escape closes every popover in this app, and a text field is exactly where that
                    // is most surprising — so it gives the field up first and the panel keeps its
                    // second press.
                    if (e.key === 'Escape') {
                        e.stopPropagation();
                        el.blur();
                    }
                    // Every single-key shortcut in the app (L to lock, E to edit, arrows to nudge)
                    // lives on window, and a name with an 'e' in it must not enter edit mode.
                    e.stopPropagation();
                });
            };
            bindMeta(nameIn, 'gname');
            bindMeta(noteIn, 'note');

            // Three buttons, one shape of wiring. Each opens its own drawer and closes the others
            // through closeAllPops, so the row behaves like a set of tabs without being one.
            for (const [btnId, popId] of [['bStyle', 'stylePop'], ['bLine', 'linePop'], ['bDesc', 'descPop']]) {
                const b = $(btnId),
                    pn = $(popId);
                if (!b || !pn)
                    continue;
                b.addEventListener('click', () => {
                    if (b.disabled)
                        return;
                    if (pn.classList.contains('open')) {
                        closeAllPops();
                        return;
                    }
                    closeAllPops();
                    typing = false;
                    placePop(pn, b);
                    syncStylePop();
                });
            }
};
