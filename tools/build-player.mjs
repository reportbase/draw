// Build player/tvf-player.js: the TVF-native player, its engine taken from the editor.
//
//   npm run player        rewrites player/tvf-player.js from draw.html
//
// THE ENGINE IS THE EDITOR'S, NOT A SECOND ONE. A scene plays in the player exactly as it plays in the
// editor because the player runs the editor's own functions: the kernel weights, the eases and holds,
// the path ride, the physical motions, the parents, the detail effects, the exact poses and their
// cubics. This reads draw.html, finds the functions and constants the player's entry points need, and
// everything those need in turn (any top-level name of the editor's main script a needed body mentions),
// and writes them out in the editor's own order, unchanged, between a small shim (the few pieces of
// editor state the engine reads: the bar's ease and hold, the scene's gravity and wind, the live clock
// and the list of live morphs) and the player's own runtime (player/runtime.js: loading a scene, the
// clock, drawing). A name the engine mentions but the player must not have (anything that draws the
// editor or touches its page) is in STUBS below and given a stand-in that does nothing; a name it
// mentions that is neither found nor stubbed fails the build. The smoke test fails when the file on
// disk is not what this would write, and running this again is the fix.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// what the player calls into: a pose of each kind, its colour and fade, the path built from points,
// the exact pose as cubics, a still exact shape as an outline, the saved arrays
const ROOTS = ['morphPoseInto', 'morphPoseExact', 'morphExactCubics', 'morphColourAt', 'morphColsOf', 'morphShowFactor', 'morphPathBuild',
    'morphMotionOk', 'morphExactCurved', 'morphSetParent', 'exactDense', 'exactCentre', '_b64f32', 'morphKeyPhases', 'morphTimesOk',
    'morphEasesOk', 'morphClipOk', 'MORPH_SHOWS', 'MORPH_TRAILS', 'MORPH_FOLLOW', 'MORPH_FX', 'MORPH_LAG_MAX', 'hasRound', 'hasCtrl',
    'morphRestoreOwn', 'MORPH_EASES', 'morphTrailOf', 'morphTrailSpan', 'morphTrailTime', 'morphCentreAt', 'MORPH_ECHOES',
    'exactDenseOf', 'morphDrawFactor', 'morphDrawFill', 'morphCameraOk', 'morphCameraAt', 'morphStopsOk',
    'morphStopCrossed', 'morphStopBefore', 'morphHolesLoad', 'morphHolesAt'];

// names the player provides itself (the shim), so they are never taken from the editor
const SHIM = new Set(['state', 'morphLive', 'morphRuns', 'TAU']);
export const WHY = new Map();

// names the engine mentions that belong to the editor's page; each becomes `function name() {}` (or the
// value given), and the engine paths that reach them are the editor's own bookkeeping, not the pose
const STUBS = {
    drawAll: 'function drawAll() {}',
    flashStatus: 'function flashStatus() {}',
    scheduleSave: 'function scheduleSave() {}',
    morphHistorySoon: 'function morphHistorySoon() {}',
    morphWrite: 'function morphWrite() {}',
    morphBarSync: 'function morphBarSync() {}',
    pushHistory: 'function pushHistory() {}',
    _reconProbe: 'const _reconProbe = null;',
    spLoad: 'function spLoad() { return null; } // a path\'s member shape: the editor\'s to give back, not the player\'s',
};

// ── a small lexer: enough of JavaScript to find where a function or a statement ends ──────────────────
// strings, template literals (with ${…} inside), comments and regular-expression literals are stepped
// over, so a brace or a semicolon inside one is not counted
function skipTo(src, i, stopAt) {
    // returns the index just past the closing brace of a block opened at src[i] === '{' (stopAt '}'),
    // or just past the ';' ending a statement at depth 0 (stopAt ';')
    let depth = 0;
    let prev = '';
    for (; i < src.length; i++) {
        const c = src[i];
        if (c === '/' && src[i + 1] === '/') {
            i = src.indexOf('\n', i);
            if (i < 0) return src.length;
            continue;
        }
        if (c === '/' && src[i + 1] === '*') {
            i = src.indexOf('*/', i + 2) + 1;
            continue;
        }
        if (c === '"' || c === "'") {
            for (i++; i < src.length && src[i] !== c; i++)
                if (src[i] === '\\') i++;
            prev = 'x';
            continue;
        }
        if (c === '`') {
            i = skipTemplate(src, i + 1);
            prev = 'x';
            continue;
        }
        if (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]|^$/.test(prev)) { // a regular expression literal
            let cls = false;
            for (i++; i < src.length; i++) {
                const d = src[i];
                if (d === '\\') { i++; continue; }
                if (d === '[') cls = true;
                else if (d === ']') cls = false;
                else if (d === '/' && !cls) break;
            }
            while (/[a-z]/i.test(src[i + 1])) i++;
            prev = 'x';
            continue;
        }
        if (c === '{' || c === '(' || c === '[') depth++;
        else if (c === '}' || c === ')' || c === ']') {
            depth--;
            if ((stopAt === '}' || stopAt === ')') && depth === 0) return i + 1; // the bracket opened at the start, closed
        } else if (c === ';' && stopAt === ';' && depth === 0) return i + 1;
        if (!/\s/.test(c)) prev = c;
    }
    throw new Error('ran off the end');
}
function skipTemplate(src, i) {
    for (; i < src.length; i++) {
        const c = src[i];
        if (c === '\\') { i++; continue; }
        if (c === '`') return i;
        if (c === '$' && src[i + 1] === '{') {
            i = skipTo(src, i + 1, '}') - 1;
        }
    }
    throw new Error('unclosed template');
}
// the code with strings, templates and comments blanked, for looking up the names it mentions
function codeOnly(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '/' && s[i + 1] === '/') { const j = s.indexOf('\n', i); out += ' '; i = j < 0 ? s.length : j - 1; continue; }
        if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i + 2) + 1; out += ' '; continue; }
        if (c === '"' || c === "'") { let j = i + 1; for (; j < s.length && s[j] !== c; j++) if (s[j] === '\\') j++; out += ' "" '; i = j; continue; }
        if (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]$|^$/.test(out.trimEnd().slice(-1))) { // a regular expression literal
            let j = i + 1, cls = false;
            for (; j < s.length; j++) {
                const d = s[j];
                if (d === '\\') { j++; continue; }
                if (d === '[') cls = true;
                else if (d === ']') cls = false;
                else if (d === '/' && !cls) break;
            }
            while (/[a-z]/i.test(s[j + 1] || '')) j++;
            out += ' /re/ ';
            i = j;
            continue;
        }
        if (c === '`') {
            // keep what is inside ${…}: it is code
            let j = i + 1;
            out += ' ';
            for (; j < s.length && s[j] !== '`'; j++) {
                if (s[j] === '\\') { j++; continue; }
                if (s[j] === '$' && s[j + 1] === '{') { const k = skipTo(s, j + 1, '}'); out += ' ' + codeOnly(s.slice(j + 2, k - 1)) + ' '; j = k - 1; }
            }
            i = j;
            continue;
        }
        out += c;
    }
    return out;
}

export async function buildPlayer() {
    const html = await readFile(ROOT + 'draw.html', 'utf8');
    // the editor's main script: its top-level names sit eight spaces in
    const decl = new Map(); // name → { start, end, text }
    const re = /^ {8}(?:async\s+)?(function\s+([A-Za-z_$][\w$]*)\s*\(|(const|let|var)\s+)/gm;
    let m;
    while ((m = re.exec(html))) {
        const start = m.index;
        let end, names;
        if (m[2]) { // a function: past its parameters to its body
            const p = skipTo(html, html.indexOf('(', start), ')'); // past the parameters (which may hold defaults)
            end = skipTo(html, html.indexOf('{', p), '}');
            names = [m[2]];
        } else { // a declaration statement: its names are the ones before an `=` at the top of it
            end = skipTo(html, start + m[0].length, ';');
            const body = codeOnly(html.slice(start + m[0].length, end - 1));
            names = [];
            if (body.trimStart()[0] === '{') { // const { a, b } = X
                const inner = body.slice(body.indexOf('{') + 1, body.indexOf('}'));
                for (const n of inner.split(',')) { const k = n.split(':').pop().trim(); if (k) names.push(k); }
            } else {
                let depth = 0, cur = '';
                const parts = [];
                for (const c of body) {
                    if ('([{'.includes(c)) depth++;
                    else if (')]}'.includes(c)) depth--;
                    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += c;
                }
                parts.push(cur);
                for (const pt of parts) { const k = /^\s*([A-Za-z_$][\w$]*)\s*=/.exec(pt); if (k) names.push(k[1]); }
            }
        }
        const text = html.slice(start, end);
        for (const n of names)
            if (!decl.has(n)) decl.set(n, { start, end, text });
        re.lastIndex = end;
    }
    // the closure of what the roots need
    const want = new Set(), stubs = new Set(), todo = [...ROOTS];
    while (todo.length) {
        const n = todo.pop();
        if (want.has(n) || SHIM.has(n)) continue;
        if (Object.hasOwn(STUBS, n)) { stubs.add(n); continue; }
        const d = decl.get(n);
        if (!d) throw new Error('the player needs ' + n + ', which is not a top-level name of draw.html (stub it, or add it)');
        want.add(n);
        // the names it mentions, less property names (after a dot) and the names it declares itself
        const code = codeOnly(d.text),
            own = new Set([...code.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)].map(q => q[1]));
        for (const q of code.matchAll(/(?:const|let|var)\s*[{[]([^}\]=]*)[}\]]/g))
            for (const k of q[1].split(',')) { const z = k.split(':').pop().trim(); if (z) own.add(z); }
        for (const q of code.matchAll(/\(([^()]*)\)\s*(?:=>|\{)/g)) // parameters of arrows and functions
            for (const k of q[1].split(',')) { const z = k.split('=')[0].replace(/[{}[\]\s.]/g, ''); if (z) own.add(z); }
        for (const q of code.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g))
            own.add(q[1]);
        for (const q of code.matchAll(/\b(?:const|let|var)\s+([^;]*)/g)) // every declarator, not only the first
            for (const k of q[1].split(',')) { const z = /^\s*([A-Za-z_$][\w$]*)\s*=(?!=)/.exec(k); if (z) own.add(z[1]); }
        // an object's keys ({ x: …, y: … }) are not names it refers to
        const keyAt = i => { let a = i - 1; while (a >= 0 && /\s/.test(code[a])) a--; return code[a] === '{' || code[a] === ','; };
        for (const id of new Set([...code.matchAll(/(?<![.\w$])[A-Za-z_$][\w$]*(?![\w$])(?!\s*:(?!:))|(?<![.\w$])[A-Za-z_$][\w$]*(?=\s*:(?!:))/g)]
            .filter(q => !(keyAt(q.index) && /^\s*:/.test(code.slice(q.index + q[0].length)))).map(q => q[0]).filter(q => !own.has(q))))
            if (id !== n && (decl.has(id) || Object.hasOwn(STUBS, id)) && !SHIM.has(id) && !want.has(id)) {
                if (!WHY.has(id)) WHY.set(id, n);
                todo.push(id);
            }
    }
    // in the editor's own order, each declaration once
    const chunks = [...new Map([...want].map(n => [decl.get(n).start, decl.get(n)])).values()].sort((a, b) => a.start - b.start);
    const runtime = await readFile(ROOT + 'player/runtime.js', 'utf8');
    const head = `// TVF PLAYER: plays a .tvfs scene (the leaf editor's live morphs and the shapes around them) on a canvas.
// GENERATED by tools/build-player.mjs (npm run player) from draw.html and player/runtime.js: do not edit it,
// edit those and run the build. Needs tvf-core.js (the curve library) loaded first.
// The engine below is the editor's own code, unchanged: ${chunks.length} declarations, ${want.size} names.
(function (root) {
'use strict';
const TVF_CORE = root.TVF_CORE || (typeof require === 'function' ? require('../tvf-core.js') : null);
const tvf = TVF_CORE.tvf;
const TAU = 2 * Math.PI;
// what the engine reads of the editor: the bar's ease and hold, the scene's gravity and wind
const state = { morphEase: '', morphHold: 0, morphGravity: 1, morphWind: 0, morphTrail: '', morphTrailLen: 0.5, morphCorners: true, aperture: null, subpaths: [] };
// the live clock and a path shared by every morph that has none of its own
const morphLive = { t: 0, speed: 0.25, play: true, path: null };
// the live morphs, in the editor's sense: what parents, riders and facings are looked up in
const morphRuns = [];
// stand-ins for the editor's page
${[...stubs].map(n => STUBS[n]).join('\n')}
// ── the editor's engine ─────────────────────────────────────────────────────────────────────────────
`;
    const body = chunks.map(c => c.text.replace(/^ {8}/gm, '')).join('\n');
    const out = head + body + '\n// ── the player ───────────────────────────────────────────────────────────────────────────────────────\n' + runtime + '\n})(typeof window !== \'undefined\' ? window : globalThis);\n';
    return { out, names: [...want].sort(), stubs: [...stubs] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const { out, names, stubs } = await buildPlayer();
    await writeFile(ROOT + 'player/tvf-player.js', out);
    console.log('player/tvf-player.js: ' + names.length + ' names from draw.html' + (stubs.length ? ', stubs: ' + stubs.join(', ') : '') + ', ' + (out.length / 1024).toFixed(0) + ' KB');
}
