// THE COPIES, WRITTEN FROM THEIR SOURCES (npm run sync).
//
// The gallery's pages each open from disk as one file, so each carries its own copy of what it
// shares with the others, and three of them carry the editor's depth code. The smoke test has always
// failed when a copy drifts, but mending one meant pasting the same lines by hand into as many as
// thirty-odd pages. This writes every copy from the one place it is edited:
//
//   what                                   edited in                copied to
//   ─────────────────────────────────────  ───────────────────────  ─────────────────────────────────
//   the library (const TVF = … })();)      gallery/gallery.html     every gallery page, the playground
//   the same as an ES module               gallery/gallery.html     gallery/tvf.js
//   the rest of the bundle (to FORMAT)     gallery/gallery.html     the shape pages
//   the tile code                          gallery/gallery.html     the shape pages
//   the animated examples                  gallery/animated.html    gallery/embedded.html
//   the depth code                         draw.html                inspect, depth, standpoint
//
//   npm run sync             writes what differs and says what it wrote
//   npm run sync -- --check  writes nothing; exits 1 naming what would change (the smoke test runs this)
//
// A copy that already agrees is left byte for byte as it is, so a run on a clean tree changes nothing.
// The depth code is compared with its whitespace taken out, as the smoke test compares it (the pages
// hold it at their own indent); a block that differs is written from the editor's lines, dedented.
//
// A shape page is one that carries the tile code (its first line is the mark); a new shape page is
// begun by copying one, so it has the mark from the start.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const G = join(ROOT, 'gallery');

const LIB_START = 'const TVF = (function';
const TILE_START = "// The loop a tile's strip";
const TILE_END = 'async function copyText';
const EX_START = '// ── THE EXAMPLES (25 Oct 2026';
const EX_END = '// the settings as one line, the way the other pages show';
const EX_OPEN = '// >>> copied from animated.html, unchanged: EXAMPLES\n';
const EX_CLOSE = '// <<< end of EXAMPLES';
const DEPTH_PAGES = ['inspect.html', 'depth.html', 'standpoint.html'];
const DEPTH_BLOCKS = ['const DEPTH = (function() {', ...['fmtSig', 'rungOfRow', 'depthToTVF', 'depthFromTVF', 'depthLearnedFacing',
    'depthEnterWhereNeeded', 'wlsSlopeRow', 'wlsSolve', 'depthEnterFlat', 'depthEnterFlatWalls'].map(f => 'function ' + f + '(')];

// [start, end) of a span in a page, or null when the page has not got it
const libCore = s => span(s, LIB_START, i => after(s, '})();', i));
const libBundle = s => span(s, LIB_START, i => after(s, '})();', s.indexOf('return { toTVF', i)));
const tileCode = s => span(s, TILE_START, i => s.indexOf(TILE_END, i));
function after(s, mark, from) { if (from < 0) return -1; const j = s.indexOf(mark, from); return j < 0 ? -1 : j + mark.length; }
function span(s, start, end) { const i = s.indexOf(start); if (i < 0) return null; const j = end(i); return j < i ? null : [i, j]; }

// a block that opens with `start` and runs to the brace that closes its first one (what follows it, the
// `)();` of the DEPTH module, is the page's own and stays)
function braced(s, start) {
    const i = s.indexOf(start);
    if (i < 0) return null;
    let d = 0, k = s.indexOf('{', i);
    for (; k < s.length; k++) { if (s[k] === '{') d++; else if (s[k] === '}' && --d === 0) break; }
    if (k >= s.length) return null;
    return [i, k + 1];
}
const strip = s => s.replace(/\s+/g, '');
function dedent(text, src, at) {
    const line0 = src.lastIndexOf('\n', at) + 1, pad = src.slice(line0, at);
    return /^\s*$/.test(pad) ? text.split('\n').map(l => l.startsWith(pad) ? l.slice(pad.length) : l.trimStart()).join('\n') : text;
}

export async function sync({ write = true } = {}) {
    const changed = [], problems = [];
    const cache = new Map();
    const read = async p => { if (!cache.has(p)) cache.set(p, await readFile(p, 'utf8')); return cache.get(p); };
    const put = (p, text, what) => {
        if (cache.get(p) === text) return;
        cache.set(p, text);
        changed.push({ file: p.slice(ROOT.length), what });
    };
    const pages = (await readdir(G)).filter(f => f.endsWith('.html') && !['index.html', 'inspect.html'].includes(f)).sort();
    const src = await read(join(G, 'gallery.html'));

    // the library, the bundle and the tile code, from the catalogue
    const parts = [['the library', libCore, () => true], ['the bundle', libBundle, s => s.includes(TILE_START)], ['the tile code', tileCode, s => s.includes(TILE_START)]];
    for (const [what, find, carries] of parts) {
        const a = find(src);
        if (!a) { problems.push(`gallery/gallery.html has no ${what}`); continue; }
        const want = src.slice(a[0], a[1]);
        for (const g of pages) {
            if (g === 'gallery.html') continue;
            const p = join(G, g), s = await read(p);
            if (!carries(s)) continue;
            const b = find(s);
            if (!b) { problems.push(`gallery/${g} has no ${what} to replace`); continue; }
            if (s.slice(b[0], b[1]) !== want) put(p, s.slice(0, b[0]) + want + s.slice(b[1]), what);
        }
    }

    // the library as an ES module: the IIFE's body, its return list as the exports
    {
        const a = libCore(src);
        if (a) {
            const open = 'const TVF = (function () {', i = src.indexOf(open), j = src.indexOf('})();', i);
            const iife = src.slice(i + open.length, j), r = iife.match(/\nreturn \{([^}]*)\};\s*$/);
            if (i < 0 || !r) problems.push('gallery/gallery.html: the library does not end in one return { … } list');
            else {
                const names = r[1].split(',').map(x => x.trim()).filter(Boolean);
                const p = join(G, 'tvf.js');
                await read(p);
                put(p, iife.slice(0, r.index).replace(/^\n/, '') + '\n\nexport { ' + names.join(', ') + ' };\n', 'the library as a module');
            }
        }
    }

    // the animated examples, onto the embedded page
    {
        const pa = join(G, 'animated.html'), pe = join(G, 'embedded.html');
        const A = await read(pa), E = await read(pe);
        const a0 = A.indexOf(EX_START), a1 = A.indexOf(EX_END), e0 = E.indexOf(EX_OPEN), e1 = E.indexOf(EX_CLOSE, e0);
        if (a0 < 0 || a1 < a0) problems.push('gallery/animated.html: the examples were not found');
        else if (e0 < 0 || e1 < 0) problems.push('gallery/embedded.html: the markers round the examples were not found');
        else {
            const from = e0 + EX_OPEN.length;
            if (E.slice(from, e1) !== A.slice(a0, a1)) put(pe, E.slice(0, from) + A.slice(a0, a1) + E.slice(e1), 'the examples');
        }
    }

    // the depth code, from the editor
    {
        const ed = await read(join(ROOT, 'draw.html'));
        for (const start of DEPTH_BLOCKS) {
            const a = braced(ed, start);
            if (!a) { problems.push('draw.html has no ' + start); continue; }
            const want = ed.slice(a[0], a[1]);
            for (const g of DEPTH_PAGES) {
                const p = join(G, g), s = await read(p), b = braced(s, start);
                if (!b) { problems.push(`gallery/${g} has no ${start}`); continue; }
                if (strip(s.slice(b[0], b[1])) !== strip(want))
                    put(p, s.slice(0, b[0]) + dedent(want, ed, a[0]) + s.slice(b[1]), 'the depth code');
            }
        }
    }

    if (write && !problems.length)
        for (const f of new Set(changed.map(c => c.file))) await writeFile(join(ROOT, f), cache.get(join(ROOT, f)));
    return { changed, problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const check = process.argv.includes('--check');
    const { changed, problems } = await sync({ write: !check });
    for (const p of problems) console.error('sync: ' + p);
    const by = new Map();
    for (const c of changed) by.set(c.file, [...(by.get(c.file) || []), c.what]);
    for (const [f, w] of by) console.log((check ? 'differs  ' : 'wrote    ') + f + '  (' + [...new Set(w)].join(', ') + ')');
    if (!changed.length && !problems.length) console.log('every copy agrees with its source');
    if (problems.length || (check && changed.length)) process.exit(1);
}
