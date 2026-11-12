// THE TEXT POPOVER, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2", the first "keep splitting draw.html").
//
// What it holds: the text popover: words set as shapes.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. The page names it in a <script src> before its own script. Edit
// it as you would the editor: the same voice, the same indent. The comment that introduced the block is still in
// draw.html, above the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['text-panel'] = function () {
            const pop = $('textPop'),
                input = $('textPopInput'),
                add = $('textPopAdd'),
                btn = $('bText');
            const fontSel = $('textPopFont'),
                sizeEl = $('textPopSize'),
                sizeVal = $('vTextSize');
            const title = pop ? pop.querySelector('.pop-title') : null;
            const boldEl = $('textPopBold'),
                italEl = $('textPopItalic'),
                outlEl = $('textPopOutline'),
                preview = $('textPopPreview');
            if (!pop || !btn)
                return;

            // Build the family list from what the machine actually has (see availableFonts).
            let builtFor = null;
            function buildFontList() {
                if (!fontSel)
                    return;
                const list0 = availableFonts();
                const sig = JSON.stringify(list0);
                if (builtFor === sig)
                    return; // webfonts can land late and change the list
                builtFor = sig;
                fontSel.innerHTML = '';
                for (const [group, list] of list0) {
                    const og = document.createElement('optgroup');
                    og.label = group;
                    for (const f of list) {
                        const o = document.createElement('option');
                        o.value = f;
                        o.textContent = f;
                        o.style.fontFamily = '"' + f + '", sans-serif';
                        og.appendChild(o);
                    }
                    fontSel.appendChild(og);
                }
                const st = textStyle();
                if ([...fontSel.options].some(o => o.value === st.family))
                    fontSel.value = st.family;
                else {
                    st.family = fontSel.value;
                }
            }

            function syncUI() {
                const st = textStyle();
                if (fontSel)
                    fontSel.value = st.family;
                if (sizeEl)
                    sizeEl.value = String(Math.round(st.size * 100));
                if (sizeVal)
                    sizeVal.textContent = Math.round(st.size * 100) + '%';
                if (boldEl)
                    boldEl.classList.toggle('on', !!st.bold);
                if (italEl)
                    italEl.classList.toggle('on', !!st.italic);
                if (outlEl)
                    outlEl.classList.toggle('on', !!st.outline);
                if (preview) {
                    preview.style.fontFamily = '"' + st.family + '", sans-serif';
                    preview.style.fontWeight = st.bold ? '700' : '400';
                    preview.style.fontStyle = st.italic ? 'italic' : 'normal';
                    // The preview says which one you are about to get, in the only way a DOM element
                    // can: hollow letters with a hairline, rather than solid ones.
                    preview.style.webkitTextStroke = st.outline ? '1px var(--fg)' : '';
                    preview.style.color = st.outline ? 'transparent' : 'var(--fg)';
                    preview.textContent = (input && input.value.trim()) ? input.value.trim().slice(0, 14) : 'Ag';
                }
            }

            // Editing mode: the popover was opened on an existing run, so committing REPLACES
            // it rather than adding another. Recorded when the popover opens, not read live —
            // the selection can change under a popover and the button must not silently swap
            // meaning between opening it and pressing it.
            let editing = null;

            const commit = () => {
                const t = input.value;
                const target = editing;
                closeAllPops();
                if (!t || !t.trim())
                    return;
                if (target) {
                    applyShapeSelection(new Set(target.members));
                    const r = replaceTextRun(t, textStyle());
                    if (!r.ok)
                        flashStatus(r.reason);
                    else
                        flashStatus('text updated');
                } else {
                    addTextShapes(t);
                }
                input.value = '';
            };

            function openPop() {
                closeAllPops();
                buildFontList();
                // If exactly one text run is selected, open ON it: same string, same style, and
                // the button says update. That is what makes a word an object you can retype
                // rather than geometry you have to delete.
                const cur = selectedTextRun();
                editing = cur ? {
                    members: cur.members.slice()
                } : null;
                if (cur) {
                    const m = cur.meta;
                    const st = textStyle();
                    st.family = m.family || st.family;
                    st.bold = !!m.bold;
                    st.italic = !!m.italic;
                    // Read the word's OWN outline state, so opening on a hollow word shows the button
                    // lit and pressing it once fills it, rather than needing two presses to catch up.
                    st.outline = !!m.outline;
                    if (m.size != null)
                        st.size = m.size;
                    input.value = m.text || '';
                }
                if (title)
                    title.textContent = editing ? 'edit text' : 'add text';
                if (add)
                    add.textContent = editing ? 'update' : 'add';
                syncUI();
                placePop(pop, btn);
                input.focus();
                input.select();
            }

            btn.addEventListener('click', () => {
                if (pop.classList.contains('open')) {
                    closeAllPops();
                    return;
                }
                openPop();
            });
            // Double-clicking a text object opens it for editing. That gesture used to try to
            // enter leaf edit mode and be refused, because text is grouped and a group is
            // frozen — so on text it did nothing at all.
            window.addEventListener('tangent:edit-text', openPop);
            add.addEventListener('click', commit);
            input.addEventListener('input', syncUI);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                }
                e.stopPropagation(); // the canvas shortcuts must not fire while typing here
            });
            if (fontSel)
                fontSel.addEventListener('change', () => {
                    textStyle().family = fontSel.value;
                    syncUI();
                    scheduleSave();
                });
            if (sizeEl)
                sizeEl.addEventListener('input', () => {
                    textStyle().size = (parseFloat(sizeEl.value) || 30) / 100;
                    syncUI();
                    scheduleSave();
                });
            if (boldEl)
                boldEl.addEventListener('click', () => {
                    const st = textStyle();
                    st.bold = !st.bold;
                    syncUI();
                    scheduleSave();
                });
            if (italEl)
                italEl.addEventListener('click', () => {
                    const st = textStyle();
                    st.italic = !st.italic;
                    syncUI();
                    scheduleSave();
                });
            // Outline applies AT ONCE to whatever text is selected, unlike bold and italic. Those
            // change the contours and so have to wait for `update` to re-trace; this changes only
            // the paint, and making you press update for a paint change — and re-trace the whole
            // word to get it — would be a worse answer than the button being slightly inconsistent
            // with its two neighbours. It also sets how the next text will arrive either way.
            if (outlEl)
                outlEl.addEventListener('click', () => {
                    const st = textStyle();
                    st.outline = !st.outline;
                    state.textOutline = st.outline;
                    const cur = selectedTextRun();
                    const target = (editing && editing.members) || (cur && cur.members) || null;
                    if (target && target.length) {
                        const n = setTextRunOutline(target, st.outline);
                        refreshScrollerThumbs && refreshScrollerThumbs();
                        drawAll();
                        pushHistory();
                        flashStatus(st.outline
                        ? ('text drawn as outline only — ' + n + ' contour' + (n === 1 ? '' : 's') + ' · press again to fill it back in')
                        : ('text filled again — ' + n + ' contour' + (n === 1 ? '' : 's')));
                    } else {
                        flashStatus(st.outline ? 'the next text you add will be outline only'
                        : 'the next text you add will be solid');
                    }
                    syncUI();
                    scheduleSave();
                });
};
