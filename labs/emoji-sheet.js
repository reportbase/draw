// EMOJI SHEET (?lab=emj), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, keyboardSheet. It puts EMOJI_SETS, emojiSetFor, emojiSheet,
// emojiSupported back on the console hook window.__lab once loaded. Loaded the first time one of its buttons is
// pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['emoji-sheet'] = function () {
        // ── THE EMOJI SHEET ─────────────────────────────────────────────────────────
        // A font nobody designed for this is the best corpus in the building. The shape sheet
        // is 89 primitives someone wrote generators for; the keyboard sheet is 94 glyphs drawn
        // by a type designer. The emoji font is a thousand closed contours drawn by people
        // solving a completely unrelated problem — no two by the same rule, full of things a
        // generator would never produce, and every one of them a recognisable object. As a
        // library of shapes to read, it is free and it is enormous.
        //
        // The font is the SYSTEM'S, reached by the ordinary fallback chain rather than picked
        // from a list: emoji do not live in the families the font probe enumerates, they arrive
        // because the browser substitutes for them, and naming the four platform faces is how
        // you ask for that substitution deliberately.
        const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", "Twemoji Mozilla", sans-serif';

        // Held as space-separated strings and split on the SPACE, never per code point — see
        // keyboardSheet's note. Chosen for silhouette: things with an outline worth reading,
        // skipping the ones that trace to a rounded rectangle (flags, keycaps, most badges).
        const EMOJI_SETS = {
            faces: '😀 😃 😄 😁 😆 😅 😂 🙂 🙃 😉 😊 😍 😘 😜 🤔 😐 😴 😷 🤒 🤕 🤢 😎 🤓 😱 😭 😡 🤠 🥶 🥵 🤯 🤡 👹 👺 💀 👻 👽 🤖 😺 🙈 🙉 🙊',
            animals: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦆 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🦂 🐢 🐍 🦎 🐙 🦑 🦐 🦀 🐡 🐠 🐟 🐬 🐳 🦈 🐊 🐘 🦏 🐪 🦒 🐄 🐎 🐖 🐑 🐐 🦌 🐕 🐈 🐓 🦃 🕊 🐇 🐿',
            plants: '🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘ 🍀 🎍 🍃 🍂 🍁 🍄 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌰 🥜 🌽 🥦 🥬 🥕 🍅 🍆 🥑 🥔 🍠',
            food: '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥥 🥝 🌶 🥐 🍞 🥖 🥨 🧀 🥚 🍳 🥞 🍔 🍟 🍕 🌭 🌮 🌯 🍿 🍩 🍪 🎂 🍰 🍫 🍭 🍮 ☕ 🍵 🍺 🍷 🍸 🍹 🍴 🥄 🔪',
            sky: '🌞 🌝 🌛 🌜 🌚 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔 🌙 🌎 🌍 🌏 ⭐ 🌟 💫 ✨ ☄ ☀ ⛅ ☁ ⛈ ❄ ☃ ⛄ 💨 💧 💦 ☔ 🌊 🔥 🌈',
            objects: '⌚ 📱 💻 🖥 🖨 🕹 💾 💿 📷 📹 🎥 📞 ☎ 📺 📻 🎙 ⏰ ⌛ ⏳ 🔋 🔌 💡 🔦 🕯 🗑 💸 💰 💳 💎 ⚖ 🔧 🔨 ⛏ 🔩 ⚙ ⛓ 🔫 💣 🔪 🗡 ⚔ 🛡 ⚰ 🏺 🔮 ⚗ 🔭 🔬 💊 💉 🌡 🔑 🗝 🚪 🛏 🖼 🛍 🎁 🎈 🎀 🎊 ⚓ 🚀 ✈ 🚁 ⛵ 🚗 🚲 🏠 ⛺ 🗼 🎸 🎺 🎷 🥁 🎻 🎹 🎨 ✏ 📎 📌 📐 📏 ✂ 🔒 🔔 🎯 🎲 ♟ 🧩 ⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🥊 ⛳ 🎣 🛹 ⌛',
            symbols: '❤ 🧡 💛 💚 💙 💜 🖤 💔 ❣ 💕 💞 💓 💗 💖 💘 💝 ☮ ✝ ☪ 🕉 ☸ ✡ 🔯 🕎 ☯ ☦ ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⚛ ☢ ☣ ❌ ⭕ 🛑 ⛔ 🚫 💯 💢 ♨ ❗ ❓ ⚠ 🔱 ⚜ 🔰 ♻ ✅ ❇ ✳ ✴ 🌀 💠 ♿ ⚡ ☂ ☠ ⚕ ♠ ♥ ♦ ♣ 🎵 🎶',
        };

        function emojiSetFor(which) {
            if (which && which !== 'all' && EMOJI_SETS[which])
                return EMOJI_SETS[which].split(' ');
            const out = [];
            for (const k in EMOJI_SETS)
                out.push(...EMOJI_SETS[k].split(' '));
            return out;
        }

        // WHICH OF THEM THIS MACHINE ACTUALLY HAS. There is no way to ask a font what it
        // covers, so the glyph is rendered and the picture is the answer: a code point the
        // font does not carry comes back as the same tofu box every time, so anything whose
        // 8×8 coverage signature matches the reference tofu is dropped, and so is anything that
        // inked nothing at all. Cheap — one 24px raster per candidate — and it means the sheet
        // never contains a grid of identical rectangles on a machine without an emoji font.
        function emojiSupported(list) {
            const S = 24;
            const cv2 = document.createElement('canvas');
            cv2.width = cv2.height = S;
            const c = cv2.getContext('2d');
            const sig = ch => {
                c.clearRect(0, 0, S, S);
                c.font = '20px ' + EMOJI_FONT;
                c.textBaseline = 'middle';
                c.textAlign = 'center';
                c.fillText(ch, S / 2, S / 2);
                const d = c.getImageData(0, 0, S, S).data;
                let ink = 0,
                    out = '';
                for (let by = 0; by < 8; by++)
                    for (let bx = 0; bx < 8; bx++) {
                        let on = 0;
                        for (let y = by * 3; y < by * 3 + 3; y++)
                            for (let x = bx * 3; x < bx * 3 + 3; x++) {
                                if (d[(y * S + x) * 4 + 3] > 96) {
                                    on++;
                                    ink++;
                                }
                            }
                        out += on > 4 ? '1' : '0';
                    }
                return {
                    ink,
                    out
                };
            };
            // Two references: an unassigned plane-16 code point, and a private-use one. A font
            // stack can answer differently for the two, and anything matching either is tofu.
            const ref = [sig('\u{10FFFD}').out, sig('\uE000').out];
            const seen = new Set();
            return list.filter(ch => {
                if (seen.has(ch))
                    return false;
                seen.add(ch);
                const g = sig(ch);
                return g.ink > 24 && !ref.includes(g.out);
            });
        }

        function emojiSheet(opts) {
            const o = opts || {};
            const want = emojiSetFor(o.set || 'all');
            const chars = emojiSupported(want);
            if (!chars.length) {
                flashStatus('no emoji glyphs available in this browser\u2019s fonts');
                return 0;
            }
            const detail = o.detail || 'outer';
            const made = keyboardSheet({
                chars,
                fontFamily: EMOJI_FONT,
                outline: !!o.outline,
                lineWidth: o.lineWidth || 2,
                // A LITTLE MORE ROOM THAN THE KEYBOARD NEEDS. The sheet camera reserves its margin
                // from the EM BOX, which is the right ruler for type — a letter lives inside it by
                // construction. An emoji does not: the faces overshoot the ascent, and at 0.88 the
                // top row ran up under the toolbar and lost its heads.
                vFrac: 0.78,
                // ALPHA, always. The whole reason this is not just the keyboard sheet with a
                // different string — see glyphContoursEm.
                alpha: true,
                detail,
                skipped: want.length - chars.length,
                label: 'emoji · ' + (o.set || 'all') + ' · '
                + (detail === 'outer' ? 'silhouette' : detail === 'solid' ? 'solid'
                : detail === 'ink' ? 'ink' : 'full contours')
                + (o.outline ? ' · outline ' + (o.lineWidth || 2) + 'px' : ''),
            });
            return made;
        }

        // The emoji sheet. No font picker: emoji arrive by SUBSTITUTION rather than from a
        // family the probe can enumerate, so the stack is named in EMOJI_FONT and the browser
        // resolves it. Tracing several hundred colour bitmaps is seconds of solid work, so the
        // button yields once to paint its own label first — the same courtesy the keyboard
        // sheet needed for 94 glyphs, and this corpus is four times that.
        {
            const bE = $('bEmojiSheet'),
                selE = $('selEmojiSet'),
                selD = $('selEmojiDetail'),
                tO = $('tEmojiOutline'),
                selW = $('selEmojiLW');
            if (bE)
                bE.addEventListener('click', () => {
                    bE.disabled = true;
                    bE.textContent = 'tracing…';
                    setTimeout(() => {
                        try {
                            const n = emojiSheet({
                                set: selE ? selE.value : 'all',
                                detail: selD ? selD.value : 'outer',
                                outline: !!(tO && tO.checked),
                                lineWidth: selW ? +selW.value : 2
                            });
                            if (!n)
                                flashStatus('no emoji outlines traced');
                        } catch (e) {
                            flashStatus('emoji sheet failed: ' + e.message);
                        }
                        finally {
                            bE.disabled = false;
                            bE.textContent = 'emoji sheet';
                        }
                    }, 0);
                });
        }

        // the console hook the editor keeps, window.__lab, gets this lab's functions back once it loads
        Object.assign(window.__lab || (window.__lab = {}), { EMOJI_SETS, emojiSetFor, emojiSheet, emojiSupported });
};
