// THE SHAPE DEEP LINK, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2", the first "keep splitting draw.html").
//
// What it holds: draw.html#tvf=…: opening shapes from a link (pasteTvfShapes), and writing one.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. The page names it in a <script src> before its own script. Edit
// it as you would the editor: the same voice, the same indent. The comment that introduced the block is still in
// draw.html, above the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['shape-link'] = function () {
            function b64urlBytes(s) {
                s = s.replace(/-/g, '+').replace(/_/g, '/');
                while (s.length % 4)
                    s += '=';
                const bin = atob(s),
                    out = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++)
                    out[i] = bin.charCodeAt(i);
                return out;
            }
            async function inflate(bytes) {
                const ds = new DecompressionStream('deflate-raw');
                const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
                return new Uint8Array(buf);
            }
            // Decode a payload into { name, fill, curves: [{x, y}] }. Throws on anything malformed
            // rather than guessing: a half-read curve is worse than a clear message.
            async function decodeShapeLink(code) {
                const kind = code.charAt(0);
                let b = b64urlBytes(code.slice(1));
                if (kind === 'z')
                    b = await inflate(b);
                else if (kind !== 'r')
                    throw new Error('unknown encoding “' + kind + '”');
                let p = 0;
                const u8 = () => {
                    if (p >= b.length)
                        throw new Error('payload ends early');
                    return b[p++];
                };
                const uv = () => {
                    let v = 0,
                        mul = 1,
                        c;
                    do {
                        c = u8();
                        v += (c & 127) * mul;
                        mul *= 128;
                    } while (c & 128);
                    return v;
                };
                const zz = () => {
                    const v = uv();
                    return v % 2 ? -(v + 1) / 2 : v / 2;
                };
                if (u8() !== 1)
                    throw new Error('unsupported version');
                const q = uv(),
                    S = uv(),
                    flags = u8();
                if (!(q > 0) || !(S > 0) || S > 4096)
                    throw new Error('bad header');
                let fill = null,
                    name = null;
                if (flags & 1) {
                    const r = u8(),
                        g = u8(),
                        bl = u8(),
                        a = u8();
                    fill = {
                        color: '#' + [r, g, bl].map(v => v.toString(16).padStart(2, '0')).join(''),
                        opacity: a / 255
                    };
                }
                if (flags & 2) {
                    const len = uv();
                    if (p + len > b.length)
                        throw new Error('payload ends early');
                    name = new TextDecoder().decode(b.subarray(p, p + len));
                    p += len;
                }
                const curves = [];
                for (let s = 0; s < S; s++) {
                    const N = uv();
                    if (N < 3 || N > 65536)
                        throw new Error('bad curve length ' + N);
                    const ch = () => {
                        const a = new Float64Array(N);
                        let acc = 0;
                        for (let i = 0; i < N; i++) {
                            acc += zz();
                            a[i] = acc / q;
                        }
                        return a;
                    };
                    const x = ch(),
                        y = ch();
                    curves.push({ x, y });
                }
                let source = null;
                if (flags & 4) {
                    const len = uv();
                    if (p + len > b.length)
                        throw new Error('payload ends early');
                    source = new TextDecoder().decode(b.subarray(p, p + len));
                    p += len;
                }
                return { name, fill, curves, source };
            }
            window.decodeShapeLink = decodeShapeLink; // for the smoke test, and for poking at a link by hand

            // The writer half, for the other direction: the inspector (gallery/inspect.html)
            // reads the same payload. World coordinates already point up, so nothing flips;
            // q is chosen from the extent so a scene in any units keeps ~1/9000 of its size.
            async function encodeShapeLink(curves, name) {
                const out = [],
                    u8 = v => out.push(v & 255);
                const uv = v => {
                    while (v >= 128) {
                        out.push((v % 128) | 128);
                        v = Math.floor(v / 128);
                    }
                    out.push(v);
                };
                const zz = v => uv(v < 0 ? -2 * v - 1 : 2 * v);
                let span = 0;
                for (const c of curves)
                    for (let j = 0; j < c.x.length; j++)
                        span = Math.max(span, Math.abs(c.x[j]), Math.abs(c.y[j]));
                const q = Math.max(1, Math.round(8192 * 0.9 / (span || 1)));
                const nm = name ? new TextEncoder().encode(String(name).slice(0, 80)) : null;
                u8(1);
                uv(q);
                uv(curves.length);
                u8(nm ? 2 : 0);
                if (nm) {
                    uv(nm.length);
                    for (const c of nm)
                        u8(c);
                }
                for (const c of curves) {
                    uv(c.x.length);
                    for (const ch of [c.x, c.y]) {
                        let prev = 0;
                        for (let j = 0; j < ch.length; j++) {
                            const v = Math.round(ch[j] * q);
                            zz(v - prev);
                            prev = v;
                        }
                    }
                }
                let bytes = new Uint8Array(out),
                    kind = 'r';
                if (typeof CompressionStream === 'function') {
                    const cs = new CompressionStream('deflate-raw');
                    bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer());
                    kind = 'z';
                }
                let bin = '';
                for (let i = 0; i < bytes.length; i += 8192)
                    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
                return kind + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }
            window.encodeShapeLink = encodeShapeLink;
            const bInspect = document.getElementById('bInspect');
            if (bInspect)
                bInspect.addEventListener('click', async () => {
                    let idx = selectedIndices();
                    if (!idx.length)
                        idx = state.subpaths.map((_, i) => i);
                    const curves = idx.map(i => state.subpaths[i]).filter(sp => sp && sp.leafX && sp.leafX.length >= 3)
                        .map(sp => ({ x: sp.leafX, y: sp.leafY }));
                    if (!curves.length) {
                        flashStatus('nothing to inspect — draw or select a shape first');
                        return;
                    }
                    const lead = state.subpaths[idx[0]];
                    const code = await encodeShapeLink(curves, lead && lead.gname);
                    window.open('gallery/inspect.html#tvf=' + code, '_blank');
                });
            // The same payload to the levels page (gallery/levels.html), which reads the largest of
            // the curves from its centre or from a place on its outline, on the corner's circle and
            // the doublings past it. It reads #tvf= as the inspector does.
            const bLevels = document.getElementById('bLevels');
            if (bLevels)
                bLevels.addEventListener('click', async () => {
                    let idx = selectedIndices();
                    if (!idx.length)
                        idx = state.subpaths.map((_, i) => i);
                    const curves = idx.map(i => state.subpaths[i]).filter(sp => sp && sp.leafX && sp.leafX.length >= 3)
                        .map(sp => ({ x: sp.leafX, y: sp.leafY }));
                    if (!curves.length) {
                        flashStatus('nothing to read — draw or select a shape first');
                        return;
                    }
                    const lead = state.subpaths[idx[0]];
                    const code = await encodeShapeLink(curves, lead && lead.gname);
                    window.open('gallery/levels.html#tvf=' + code, '_blank');
                });

            // Re-spell the curves as .tvf text so they take the paste path. Six decimals keeps
            // every bit the quantization left.
            function asTvfText(d) {
                return d.curves.map((c, i) => {
                    const lines = ['TVF ' + c.x.length + ' 1 2', '#meta type:curve', '#meta closed:true', '#meta channels:xy'];
                    if (d.curves.length > 1)
                        lines.push('#meta subpath:' + (i + 1) + '/' + d.curves.length);
                    // The source rides on the leader only: it describes the group, and the shape
                    // browser reads a group's note off its leader (see the tooltip there).
                    if (d.source && i === 0)
                        lines.push('#meta note:' + d.source.replace(/\s+/g, ' ').trim());
                    if (d.fill) {
                        lines.push('#meta fill:' + d.fill.color);
                        lines.push('#meta fillOpacity:' + d.fill.opacity.toFixed(3));
                    }
                    lines.push('0 ' + Array.from(c.x, v => +v.toFixed(6)).join(' '));
                    lines.push('0 ' + Array.from(c.y, v => +v.toFixed(6)).join(' '));
                    return lines.join('\n') + '\n';
                }).join('\n');
            }

            function takeFromHash() {
                let h = '';
                try {
                    h = location.hash || '';
                } catch (_) {
                    return null;
                }
                const m = h.match(/(?:^#|&)tvf=([^&]*)/);
                if (!m)
                    return null;
                const p = new URLSearchParams(h.replace(/^#/, ''));
                p.delete('tvf');
                const rest = p.toString();
                // window.history, not history: this scope's `history` is the undo stack.
                try {
                    window.history.replaceState(null, '', location.pathname + location.search + (rest ? '#' + rest : ''));
                } catch (_) {}
                return m[1];
            }

            async function boot() {
                const code = takeFromHash();
                if (!code)
                    return;
                if (state.editMode || drawMode) {
                    flashStatus('shape link ignored — leave the edit or draw mode and open it again');
                    return;
                }
                let d;
                try {
                    d = await decodeShapeLink(code);
                } catch (e) {
                    flashStatus('shape link did not decode — ' + (e.message || e));
                    console.warn('[tvf link] decode failed', e);
                    return;
                }
                const n = pasteTvfShapes(asTvfText(d));
                if (!n)
                    return;
                // Same tail as the .tvf paste in doPaste, in the same order and for the same reason.
                rebuildSignalSelect();
                const g = groupTail(n, d.name);
                rebuildScroller();
                pushHistory();
                scheduleSave();
                drawAll();
                updateStatus();
                flashStatus('opened ' + (d.name ? '“' + d.name + '” — ' : '') + n + ' shape' + (n > 1 ? 's' : '') + ' from the link'
                + (g ? ' — grouped as one object' : ''));
                if (typeof syncArrangeBtns === 'function')
                    syncArrangeBtns();
            }
            // After the saved scene has restored, as the bucket link waits, so the restore does not
            // land on top of the shape and replace it.
            if (document.readyState === 'complete')
                setTimeout(boot, 300);
            else
                window.addEventListener('load', () => setTimeout(boot, 300));
            window.addEventListener('hashchange', () => boot());
};
