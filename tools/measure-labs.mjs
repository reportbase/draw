// Measure how much of draw.html is the labs', and what the labs use of the editor.
//
//   node tools/measure-labs.mjs [--json out.json]
//
// THE LABS, MEASURED BEFORE THEY MOVE (28 Oct 2026, Tom: "all the labs can ultimately be pulled from draw.html.
// its already to big", then "agreed, proceed"). The editor's main script is cut into its top-level pieces (each
// statement or declaration that starts eight spaces in, with the comment above it), and each piece is read for
// the top-level names it declares, the names it mentions, and the element ids it reaches for. A lab is a button
// in the drawer with a data-code; the pieces that wire one are the labs' roots. From the roots, and from every
// piece that wires no lab, the closure of names mentioned is taken (the player's build does the same, for the
// player). A piece only the labs reach is the labs' own; a name both reach is shared, and the shared names the
// labs' own pieces mention are the interface the labs would need from the editor once they live elsewhere.
// Reading names is lexical, not a parse: a name in a comment or a string is not counted, a property name is
// not, and a local that shadows a top-level name is counted as a mention (so the shared set is generous).

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function codeOnly(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '/' && s[i + 1] === '/') { const j = s.indexOf('\n', i); out += ' '; i = j < 0 ? s.length : j - 1; continue; }
        if (c === '/' && s[i + 1] === '*') { const j = s.indexOf('*/', i + 2); i = j < 0 ? s.length : j + 1; out += ' '; continue; }
        if (c === '"' || c === "'") { let j = i + 1; for (; j < s.length && s[j] !== c && s[j] !== '\n'; j++) if (s[j] === '\\') j++; out += ' "" '; i = j; continue; }
        if (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]$|^$/.test(out.trimEnd().slice(-1))) {
            let j = i + 1, cls = false;
            for (; j < s.length && s[j] !== '\n'; j++) {
                const d = s[j];
                if (d === '\\') { j++; continue; }
                if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break;
            }
            while (/[a-z]/i.test(s[j + 1] || '')) j++;
            out += ' /re/ ';
            i = j;
            continue;
        }
        if (c === '`') { // keep what is inside ${…}
            let j = i + 1, depth = 0, buf = '';
            out += ' ';
            for (; j < s.length; j++) {
                if (s[j] === '\\') { j++; continue; }
                if (depth === 0 && s[j] === '`') break;
                if (depth === 0 && s[j] === '$' && s[j + 1] === '{') { depth = 1; j++; continue; }
                if (depth > 0) {
                    if (s[j] === '{') depth++;
                    else if (s[j] === '}') { depth--; if (depth === 0) { out += ' ' + codeOnly(buf) + ' '; buf = ''; continue; } }
                    buf += s[j];
                }
            }
            i = j;
            continue;
        }
        out += c;
    }
    return out;
}

export async function measureLabs() {
    const html = await readFile(ROOT + 'draw.html', 'utf8');
    const lines = html.split('\n');
    // the main script: the <script> after tvf-core.js
    const open = lines.findIndex(l => /^\s*<script src="tvf-core\.js"><\/script>/.test(l)) + 1;
    const close = lines.findIndex((l, i) => i > open && /^\s*<\/script>/.test(l));
    // the labs: buttons with a data-code, in the markup
    const labs = [];
    for (let i = 0; i < open; i++) {
        // a lab is what labs.html lists: a .res-btn with an id and a data-code (the morph bar's buttons have codes
        // too, for deep links, but are not labs)
        const tag = /<button\b[^>]*>/.exec(lines[i]);
        if (!tag || !/class="[^"]*\bres-btn\b/.test(tag[0])) continue;
        const id = /\bid="([^"]+)"/.exec(tag[0]), code = /\bdata-code="([^"]+)"/.exec(tag[0]);
        if (id && code) labs.push({ id: id[1], code: code[1], line: i + 1 });
    }
    // the drawer's groups (from labs.html, which is written from the live editor): the morph bar and the repair
    // tools sit in the drawer with codes, but they are the editor's own tools, not labs
    const TOOLS = new Set(['the live morph', 'repair']);
    const index = await readFile(ROOT + 'labs.html', 'utf8').catch(() => '');
    const groupOf = new Map();
    for (const sec of index.split('<section class="group"').slice(1)) {
        const h = /<h2[^>]*>([^<]*)/.exec(sec);
        for (const q of sec.matchAll(/href="draw\.html\?lab=([\w-]+)"/g)) groupOf.set(q[1], h ? h[1].trim() : '');
    }
    for (const l of labs) l.group = groupOf.get(l.code) || '';
    const tools = labs.filter(l => TOOLS.has(l.group));
    labs.splice(0, labs.length, ...labs.filter(l => !TOOLS.has(l.group)));
    const labIds = new Set(labs.map(l => l.id));
    // top-level pieces: a line eight spaces in that starts code (not a closer), with the comments just above it
    const starts = [];
    for (let i = open + 1; i < close; i++) {
        const l = lines[i];
        if (/^ {8}\S/.test(l) && !/^ {8}(\/\/|\/\*|\*|[}\])])/.test(l))
            starts.push(i);
    }
    const pieces = [];
    for (let k = 0; k < starts.length; k++) {
        let a = starts[k];
        const b = k + 1 < starts.length ? starts[k + 1] : close;
        // the comment block above belongs to it
        while (a - 1 > (k ? starts[k - 1] : open) && /^ {8}(\/\/|\/\*|\*)/.test(lines[a - 1])) a--;
        const text = lines.slice(starts[k], b).join('\n');
        pieces.push({ from: a + 1, to: b, start: starts[k] + 1, text, lines: b - a });
    }
    // re-attach comments: a piece's span is from its first comment line to the line before the next piece's comments
    for (let k = 0; k + 1 < pieces.length; k++) pieces[k].to = pieces[k + 1].from - 1;
    const decl = new Map();
    for (const [k, p] of pieces.entries()) {
        const head = p.text.split('\n')[0];
        const code = codeOnly(p.text);
        p.declares = [];
        let m = /^ {8}(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/.exec(head);
        if (m) p.declares.push(m[1]);
        else if ((m = /^ {8}(?:const|let|var)\s+/.exec(head))) {
            // every declarator at the top of the statement
            const body = codeOnly(p.text.slice(m[0].length));
            let depth = 0, cur = '';
            const parts = [];
            for (const c of body) {
                if ('([{'.includes(c)) depth++;
                else if (')]}'.includes(c)) depth--;
                if (depth < 0) break;
                if (c === ';' && depth === 0) { parts.push(cur); break; }
                if (c === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += c;
            }
            for (const pt of parts) { const z = /^\s*([A-Za-z_$][\w$]*)\s*=?/.exec(pt); if (z) p.declares.push(z[1]); }
        } else if ((m = /^ {8}class\s+([A-Za-z_$][\w$]*)/.exec(head))) p.declares.push(m[1]);
        p.mentions = new Set([...code.matchAll(/(?<![.\w$])[A-Za-z_$][\w$]*(?![\w$])/g)].map(q => q[0]));
        p.ids = new Set([...p.text.matchAll(/(?:\$|getElementById)\(\s*['"]([\w-]+)['"]\s*\)/g)].map(q => q[1]));
        for (const q of p.text.matchAll(/['"]#([\w-]+)['"]/g)) p.ids.add(q[1]);
        p.labIds = [...p.ids].filter(i => labIds.has(i));
        p.k = k;
        for (const n of p.declares) if (!decl.has(n)) decl.set(n, k);
    }
    const closure = (seeds, why) => {
        const seen = new Set(seeds), todo = [...seeds];
        while (todo.length) {
            const from = todo.pop(), p = pieces[from];
            for (const n of p.mentions) {
                const k = decl.get(n);
                if (k != null && !seen.has(k) && !p.declares.includes(n)) {
                    seen.add(k);
                    todo.push(k);
                    if (why) why.set(k, from);
                }
            }
        }
        return seen;
    };
    // the labs' own hubs, roots of the labs and not of the editor: the test hooks that reach into the labs
    // (window.__lab, and a lab's runner put on window for the smoke test) and the lab deep link (?lab=CODE)
    const hub = p => /^ {8}window\.__lab\s*=/.test(p.text) || /^ {8}window\.(\w+)\s*=\s*\1;\s*$/.test(p.text.split('\n')[0])
        || /THE LAB DEEP LINK/.test(lines.slice(p.from - 1, p.start).join('\n'));
    for (const p of pieces) p.hub = hub(p);
    const MIXED_AS_LAB = process.env.MIXED === 'lab';
    const labRoots = pieces.filter(p => p.labIds.length || p.hub).map(p => p.k);
    // the editor's roots: every piece that is not a declaration (it runs when the page loads) and wires no lab
    // (a piece that wires both is a root of both: its lines count as shared, and its lab handlers are listed apart)
    const mixed = p => p.labIds.length && p.ids.size > p.labIds.length;
    const edRoots = pieces.filter(p => !p.declares.length && !p.hub && (!p.labIds.length || (mixed(p) && !MIXED_AS_LAB))).map(p => p.k);
    const whyEd = new Map(), fromLabs = closure(labRoots), fromEditor = closure(edRoots, whyEd);
    const labOnly = [...fromLabs].filter(k => !fromEditor.has(k));
    const shared = [...fromLabs].filter(k => fromEditor.has(k));
    const unreached = pieces.filter(p => !fromLabs.has(p.k) && !fromEditor.has(p.k));
    // the interface: shared names that the labs' own pieces mention
    const iface = new Map();
    for (const k of labOnly)
        for (const n of pieces[k].mentions) {
            const d = decl.get(n);
            if (d != null && fromEditor.has(d)) iface.set(n, (iface.get(n) || 0) + 1);
        }
    const sum = ks => ks.reduce((a, k) => a + pieces[k].to - pieces[k].from + 1, 0);
    // the drawer's markup: the lines holding a lab button
    const markupLines = labs.length;
    const out = {
        file: { lines: lines.length, script: close - open },
        labs: labs.length,
        pieces: pieces.length,
        rootsWiringLabs: labRoots.length,
        rootsAlsoWireEditor: pieces.filter(mixed).length,
        linesLabOnly: sum(labOnly),
        linesShared: sum(shared),
        linesUnreached: unreached.reduce((a, p) => a + p.to - p.from + 1, 0),
        markupLines,
        interface: [...iface.entries()].sort((a, b) => b[1] - a[1]),
        labOnlyPieces: labOnly.map(k => ({ at: pieces[k].from, lines: pieces[k].to - pieces[k].from + 1, declares: pieces[k].declares, labIds: pieces[k].labIds })),
        tools: tools.map(t => t.code),
        // for a piece the labs reach that the editor reaches too, the chain from the editor's root to it (to find
        // the hubs, a test hook or a menu, that tie lab code to the editor)
        sharedWhy: shared.map(k => {
            const chain = [];
            for (let q = k, n = 0; q != null && n < 12; q = whyEd.get(q), n++) chain.push(pieces[q].declares[0] || ('@' + pieces[q].from));
            return { at: pieces[k].from, lines: pieces[k].to - pieces[k].from + 1, chain };
        }),
        mixedRoots: pieces.filter(mixed).map(p => ({ at: p.from, lines: p.to - p.from + 1, labIds: p.labIds.length, otherIds: p.ids.size - p.labIds.length }))
    };
    return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const r = await measureLabs();
    const i = process.argv.indexOf('--json');
    if (i > 0) await writeFile(process.argv[i + 1], JSON.stringify(r, null, 1));
    console.log(`draw.html: ${r.file.lines} lines, the main script ${r.file.script}`);
    console.log(`${r.labs} labs; ${r.pieces} top-level pieces; ${r.rootsWiringLabs} wire a lab (${r.rootsAlsoWireEditor} of them wire editor controls too)`);
    console.log(`lines only the labs reach: ${r.linesLabOnly}; reached by both: ${r.linesShared}; reached by neither: ${r.linesUnreached}`);
    console.log(`the editor names the labs' own code uses: ${r.interface.length}`);
    console.log(r.interface.slice(0, 60).map(([n, c]) => n + ' ' + c).join(', '));
}
