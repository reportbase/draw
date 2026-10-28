// Run every lab in the drawer headless and keep what each one says.
//
//   node tools/run-labs.mjs [out.json] [code …]
//
// WHAT THE LABS FOUND, READ FROM THE LABS (28 Oct 2026, Tom: "the labs have some interesting ideas … much of that is
// classical, but there are some novel ideas in there", then "agreed, proceed"). Each lab is opened by its deep link,
// draw.html?lab=CODE, in a fresh page, and given time to finish; then what it reported is read back: the sheet it laid
// out (window.__lastLadder: its name, and each cell's caption and verdict), the lines it flashed on the status bar
// (window.__flashLog), and the text of anything it opened over the page. The output is the record papers/labs.md is
// written from.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.tvf': 'text/plain', '.tvfs': 'application/json' };
const server = createServer(async (req, res) => {
    const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[/\\]+/, '');
    try {
        const body = await readFile(join(ROOT, p || 'index.html'));
        res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' });
        res.end(body);
    } catch {
        res.writeHead(404);
        res.end();
    }
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}/`;
const out = process.argv[2] && !/^[a-z0-9]{2,4}$/.test(process.argv[2]) ? process.argv[2] : 'labs-run.json';
const only = process.argv.slice(2).filter(a => /^[a-z0-9]{2,4}$/.test(a));

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const index = await readFile(join(ROOT, 'labs.html'), 'utf8');
const labs = [];
for (const sec of index.split('<section class="group"').slice(1)) {
    const group = (/<h2[^>]*>([^<]*)/.exec(sec) || [])[1] || '';
    const note = ((/<p class="note">([\s\S]*?)<\/p>/.exec(sec) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
    for (const q of sec.matchAll(/<li class="lab"[\s\S]*?href="draw\.html\?lab=([\w-]+)"[\s\S]*?<\/span>([^<]*)<\/a>\s*<p>([\s\S]*?)<\/p>/g))
        labs.push({ code: q[1], name: q[2].trim(), what: q[3].replace(/<[^>]+>/g, '').trim(), group, note });
}
const TOOLS = new Set(['the live morph', 'repair']);
const todo = labs.filter(l => !TOOLS.has(l.group) && (!only.length || only.includes(l.code)));
const results = [];
for (const lab of todo) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.dismiss().catch(() => {}));
    await page.route(/fonts\.g|flare\.tangent|login\.tangent/, r => r.abort());
    const t0 = Date.now();
    try {
        await page.goto(base + 'draw.html?lab=' + lab.code, { waitUntil: 'load', timeout: 60000 });
        // a lab runs 700 ms after the page is up; wait until its sheet or its status settles
        let last = '', still = 0;
        for (let i = 0; i < 240 && still < 6; i++) {
            await page.waitForTimeout(500);
            const sig = await page.evaluate(() => JSON.stringify([window.__lastLadder && window.__lastLadder.rows.length, (window.__flashLog || []).length]));
            still = sig === last && i > 3 ? still + 1 : 0;
            last = sig;
        }
    } catch (e) {
        errors.push('load: ' + e.message);
    }
    const got = await page.evaluate(() => {
        const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 40 && r.height > 40 && s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.1; };
        const sheets = [...document.querySelectorAll('[class*="sheet"], [id*="Sheet"], [class*="overlay"], [id*="Overlay"], dialog[open]')]
            .filter(vis).map(el => el.innerText.trim()).filter(t => t.length > 20);
        return { ladder: window.__lastLadder || null, flash: window.__flashLog || [], sheets: [...new Set(sheets)].map(t => t.slice(0, 6000)) };
    }).catch(e => ({ error: e.message }));
    results.push(Object.assign({}, lab, got, { ms: Date.now() - t0, errors }));
    console.log(lab.code.padEnd(5), String(Date.now() - t0).padStart(6) + ' ms', got.ladder ? got.ladder.rows.length + ' cells' : '', (got.flash || []).slice(-1)[0] ? '· ' + got.flash.slice(-1)[0].slice(0, 90) : '', errors.length ? 'ERR ' + errors[0].slice(0, 60) : '');
    await page.close();
}
await writeFile(out, JSON.stringify(results, null, 1));
await browser.close();
server.close();
