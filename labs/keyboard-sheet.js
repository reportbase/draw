// KEYBOARD SHEET (?lab=kbd), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// Only the press is here: the tracing (keyboardSheet, glyphContoursEm) stays in the editor, since the emoji sheet
// traces with it too, and so does the font list the drawer shows (kbdFontList). From the editor it uses: $,
// flashStatus, kbdFontList, keyboardSheet, textStyle. It declares nothing the editor reads. Loaded the first time
// its button is pressed, or ?lab=kbd asks for it.
(window.TVF_LABS = window.TVF_LABS || {})['keyboard-sheet'] = function () {
        {
            const bK = $('bKbdSheet'),
                selF = $('selKbdFont'),
                selS = $('selKbdSet');
            const tB = $('tKbdBold'),
                tI = $('tKbdItalic'),
                tO = $('tKbdOutline'),
                selW = $('selKbdLW');
            if (bK)
                bK.addEventListener('click', () => {
                    kbdFontList();
                    const family = (selF && selF.value) || textStyle().family;
                    bK.disabled = true;
                    bK.textContent = 'tracing…';
                    // Yield once so the label paints: 92 glyphs is a beat of solid rasterising, and a
                    // button that changes nothing while it thinks reads as broken.
                    setTimeout(() => {
                        try {
                            const n = keyboardSheet({
                                family,
                                set: selS ? selS.value : 'all',
                                bold: !!(tB && tB.checked),
                                italic: !!(tI && tI.checked),
                                outline: !!(tO && tO.checked),
                                lineWidth: selW ? +selW.value : 2
                            });
                            if (!n)
                                flashStatus('no outlines traced for that font');
                        } finally {
                            bK.disabled = false;
                            bK.textContent = 'keyboard sheet';
                        }
                    }, 0);
                });
        }

};
