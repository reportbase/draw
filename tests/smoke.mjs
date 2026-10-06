// Smoke test: load draw.html in headless Chromium, drag on the canvas, draw a
// freehand stroke and a line, select everything, then press every toolbar
// button that is enabled (opening each panel in turn). Fails if the page
// throws an uncaught error.
//
//   npm test                       serves the repo itself on a free port
//   BASE_URL=http://host/ npm test test an already-running server instead
//
// Console errors (a CDN hiccup, the sign-in check) are printed but do not fail
// the run; uncaught exceptions do.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SETTLE_MS = Number(process.env.SETTLE_MS || 400);    // time each action gets to run
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
                '.json': 'application/json', '.svg': 'image/svg+xml' };

/* Buttons the walk does not press: they touch the clipboard (cut, paste), call
   the Claude gateway (ai), or change how a drag behaves for the rest of the run
   (lock, and the two drawing tools, which are exercised separately below). The
   settings menu's own items (new scene, load, save, export) are left alone too,
   since they open file dialogs or start downloads. */
const SKIP = new Set(['bLock', 'bCut', 'bPaste', 'bAi', 'bDraw', 'bDrawLine']);

function serve(){
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    try {
      const body = await readFile(join(ROOT, path || 'index.html'));
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

const server = process.env.BASE_URL ? null : await serve();
const base = process.env.BASE_URL || `http://127.0.0.1:${server.address().port}/`;

const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

let current = 'page load';
const failures = [];
page.on('pageerror', e => failures.push(`[${current}] ${e.message}`));
page.on('console', m => { if (m.type() === 'error') console.log(`  console (${current}): ${m.text().slice(0, 200)}`); });
page.on('dialog', d => d.dismiss().catch(() => {}));

async function step(name, fn){
  current = name;
  const before = failures.length;
  try { await fn(); } catch (e){ failures.push(`[${name}] ${e.message.split('\n')[0]}`); }
  await page.waitForTimeout(SETTLE_MS);
  await page.keyboard.press('Escape');
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${name}`);
}

async function drag(points){
  await page.mouse.move(...points[0]);
  await page.mouse.down();
  for (const p of points.slice(1)) await page.mouse.move(...p, { steps: 4 });
  await page.mouse.up();
}

let code = 0;
try {
  await page.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
  await page.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
  await page.waitForTimeout(1500);
  console.log('page loaded');

  /* The #tvf= shape link (see "THE SHAPE DEEP LINK" in draw.html). Built here
     in the plain 'r' encoding, a 24-leaf circle named "smoke ring", and set on
     the open page so it arrives by hashchange, the path a second "edit" click
     in the gallery takes. It must paste, report it, and scrub the fragment. */
  await step('shape link (#tvf=)', async () => {
    const out = [], uv = v => { while (v >= 128) { out.push((v % 128) | 128); v = Math.floor(v / 128); } out.push(v); };
    const zz = v => uv(v < 0 ? -2 * v - 1 : 2 * v), Q = 8192, N = 24, name = 'smoke ring';
    out.push(1); uv(Q); uv(1); out.push(2); uv(name.length); for (const c of Buffer.from(name)) out.push(c);
    uv(N);
    for (const f of [Math.cos, Math.sin]) {
      let prev = 0;
      for (let j = 0; j < N; j++) { const v = Math.round(0.5 * f(2 * Math.PI * j / N) * Q); zz(v - prev); prev = v; }
    }
    const code = 'r' + Buffer.from(out).toString('base64url');
    const decoded = await page.evaluate(c => window.decodeShapeLink(c).then(d => [d.name, d.curves.length, d.curves[0].x.length, d.curves[0].x[0]]), code);
    if (decoded.join() !== 'smoke ring,1,24,0.5') throw new Error('decoded as ' + decoded.join());
    await page.evaluate(c => { location.hash = 'tvf=' + c; }, code);
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => [location.hash, document.getElementById('status').textContent]);
    if (r[0]) throw new Error('fragment not scrubbed: ' + r[0]);
    if (!/opened .smoke ring. . 1 shape from the link/.test(r[1])) throw new Error('status: ' + r[1]);
  });

  await step('drag on the canvas', () => drag([[640, 400], [700, 430], [760, 460]]));
  await step('freehand stroke', async () => {
    await page.click('#bDraw');
    await drag(Array.from({ length: 24 }, (_, i) => [300 + i * 25, 600 + Math.round(Math.sin(i / 3) * 60)]));
  });
  await step('straight line', async () => {
    await page.click('#bDrawLine');
    for (const [x, y] of [[200, 200], [400, 260], [520, 180]]) await page.mouse.click(x, y);
    await page.mouse.dblclick(520, 180);
  });

  /* With everything selected, the buttons that act on a selection (align,
     group, order, style…) are enabled too, so the walk reaches them. Escape
     after each press can drop the selection, so it is taken again each time. */
  const selectAll = () => page.keyboard.press('ControlOrMeta+a');
  await selectAll();
  await page.waitForTimeout(SETTLE_MS);
  const ids = await page.evaluate(skip => [...document.querySelectorAll('button[id]')]
    .filter(b => b.offsetParent && !b.disabled && !skip.includes(b.id)
              && !b.closest('#settingsMenu, #confirmScrim, .pop'))
    .map(b => b.id), [...SKIP]);
  console.log(`${ids.length} toolbar buttons to press`);
  for (const id of ids){
    await selectAll();
    await step(id, () => page.evaluate(id => {
      const b = document.getElementById(id);
      if (b && !b.disabled) b.click();
    }, id));
  }
} catch (e){
  failures.push(`[${current}] ${e.message.split('\n')[0]}`);
}

/* The gallery pages: each must load without an uncaught error, and its first
   tile's edit button must produce a link that this editor opens. window.open is
   stubbed so the link can be followed here, in a page of our own. */
const { readdir } = await import('node:fs/promises');
const galleries = (await readdir(join(ROOT, 'gallery'))).filter(f => f.endsWith('.html') && f !== 'index.html').sort();
for (const g of galleries){
  current = 'gallery/' + g;
  const gp = await browser.newPage();
  gp.on('pageerror', e => failures.push(`[gallery/${g}] ${e.message}`));
  await gp.addInitScript(() => { window.__links = []; window.open = u => { window.__links.push(u); return null; }; });
  const before = failures.length;
  try {
    await gp.goto(new URL('gallery/' + g, base).href, { waitUntil: 'load' });
    await gp.$eval('.tile .edit', b => b.click());
    await gp.waitForFunction(() => window.__links.length > 0, null, { timeout: 10000 });
    const link = await gp.evaluate(() => window.__links[0]);
    // The spectrum strip under that tile drew, and said something.
    const cap = await gp.$eval('.tile .spec-cap', c => c.textContent);
    if (!/N = \d+ allows up to m = \d+/.test(cap)) throw new Error('spectrum caption: ' + cap);
    if (!link.startsWith(new URL('draw.html#tvf=', base).href)) throw new Error('edit link points at ' + link.slice(0, 80));
    // A fresh editor page each time, so the scene the button walk left behind (and its
    // saved copy) is not in the way: the link should open on a page of its own.
    const ep = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    ep.on('pageerror', e => failures.push(`[gallery/${g} → editor] ${e.message}`));
    await ep.goto(link, { waitUntil: 'load' });
    const status = await ep.waitForFunction(() => {
      const t = document.getElementById('status')?.textContent || '';
      return /opened|shape link/.test(t) && t;
    }, null, { timeout: 15000 }).then(h => h.jsonValue()).catch(async () => 'timed out; status: ' + await ep.evaluate(() => document.getElementById('status')?.textContent));
    await ep.close();
    if (!/opened/.test(status)) throw new Error(status);
  } catch (e){ failures.push(`[gallery/${g}] ${e.message.split('\n')[0]}`); }
  await gp.close();
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} gallery/${g} edit → editor`);
}

/* The spectrum strip has to tell the truth, not just draw: a six-fold plate has
   energy only at multiples of six, which is the snowflake page's first claim. */
await step('spectrum: a plate is six-fold', async () => {
  const gp = await browser.newPage();
  await gp.goto(new URL('gallery/snowflakes.html', base).href, { waitUntil: 'load' });
  const cap = await gp.evaluate(() => {
    const t = [...document.querySelectorAll('.tile')].find(t => t.querySelector('h3')?.textContent === 'plate');
    t.querySelector('.edit').dispatchEvent(new MouseEvent('click'));   // edit renders a lazy tile first
    return t.querySelector('.spec-cap').textContent;
  });
  await gp.close();
  if (!/only multiples of 6\b/.test(cap)) throw new Error('plate spectrum says: ' + cap);
});

/* The front page: it loads, and each of its cards points at a gallery that exists. */
await step('gallery index', async () => {
  const gp = await browser.newPage();
  gp.on('pageerror', e => failures.push(`[gallery/index] ${e.message}`));
  await gp.goto(new URL('gallery/index.html', base).href, { waitUntil: 'load' });
  const hrefs = await gp.$$eval('a.card', as => as.map(a => a.getAttribute('href')));
  await gp.close();
  if (hrefs.length !== galleries.length) throw new Error(`${hrefs.length} cards for ${galleries.length} pages`);
  for (const h of hrefs) if (!galleries.includes(h)) throw new Error('card points at missing ' + h);
});

if (failures.length){
  console.error(`\n${failures.length} failure(s):\n` + failures.map(f => '  ' + f).join('\n'));
  code = 1;
} else {
  console.log('\nno uncaught errors');
}
await browser.close();
server?.close();
process.exit(code);
