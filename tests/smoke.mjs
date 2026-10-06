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
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
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

  /* The editor's own tvf.resample must land each new leaf exactly on the curve. It used to
     interpolate on an internal grid, exact only when the target count happened to divide it:
     96 → 128 was exact and 96 → 127 was not. Checked against evaluating the curve directly. */
  await step('tvf.resample is exact', async () => {
    const e = await page.evaluate(() => {
      const s = tvf.blob(96, { seed: 3 });
      let worst = 0;
      for (const N of [127, 63, 200]) {
        const r = s.clone().resample(N);
        for (let k = 0; k < N; k++) {
          const phi = (k + 0.5) * 2 * Math.PI / N;
          worst = Math.max(worst, Math.abs(r.x[k] - tvf.evalAt(s.x, phi)), Math.abs(r.y[k] - tvf.evalAt(s.y, phi)));
        }
      }
      return worst;
    });
    if (!(e < 1e-9)) throw new Error('resample misses the curve by ' + e);
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
const galleries = (await readdir(join(ROOT, 'gallery'))).filter(f => f.endsWith('.html') && !['index.html', 'inspect.html', 'playground.html'].includes(f)).sort();
// Pages with their own tile code: the chart pages draw a measurement per tile rather than a
// list of loops, the bench is numbered steps, heard plays its tiles, and the loop and
// composed animate. No spectrum strip on any of them. Everything else is a shape page.
const CHART_PAGES = new Set(['spiral.html', 'curves.html', 'space.html', 'fail.html',
                             'bench.html', 'sound.html', 'motion.html', 'compose.html']);
const shapePages = galleries.filter(g => !CHART_PAGES.has(g));
for (const g of galleries){
  current = 'gallery/' + g;
  const gp = await browser.newPage();
  gp.on('pageerror', e => failures.push(`[gallery/${g}] ${e.message}`));
  await gp.addInitScript(() => { window.__links = []; window.open = u => { window.__links.push(u); return null; }; });
  const before = failures.length;
  try {
    await gp.goto(new URL('gallery/' + g, base).href, { waitUntil: 'load' });
    // styled by gallery/style.css: the slate ground, not the browser's white
    const bg = await gp.evaluate(() => getComputedStyle(document.body).backgroundColor);
    if (bg !== 'rgb(12, 15, 22)') throw new Error('style.css did not apply (body is ' + bg + ')');
    // A chart page draws (and decides which tiles hold a curve) as tiles scroll in, and
    // every measurement on it runs in the tab; scroll it all past, so they all run here,
    // and catch any report that threw.
    if (CHART_PAGES.has(g)) {
      const threw = await gp.evaluate(async () => {
        for (const t of document.querySelectorAll('.tile, .step')) { t.scrollIntoView(); await new Promise(r => setTimeout(r, 120)); }
        await new Promise(r => setTimeout(r, 1500));
        return [...document.querySelectorAll('.tile, .step')].filter(t => /this measurement threw|^error:/.test(
          (t.querySelector('.report')?.textContent || '') + (t.querySelector('code.src')?.textContent || ''))).map(t => t.querySelector('h3, h2')?.textContent);
      });
      if (threw.length) throw new Error('measurements failed: ' + threw.join('; '));
    }
    const edit = await gp.$('.tile .edit:not([hidden])');
    if (!edit) {   // where it breaks, the bench and heard hand no curve on: no edit buttons
      if (!CHART_PAGES.has(g)) throw new Error('no edit button');
      await gp.close();
      console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} gallery/${g} (no curves to edit)`);
      continue;
    }
    await edit.evaluate(b => b.click());
    await gp.waitForFunction(() => window.__links.length > 0, null, { timeout: 10000 });
    const link = await gp.evaluate(() => window.__links[0]);
    // The spectrum strip under that tile drew, and said something.
    if (!CHART_PAGES.has(g)) {
      const cap = await gp.$eval('.tile .spec-cap', c => c.textContent);
      if (!/N = \d+ allows up to m = \d+/.test(cap)) throw new Error('spectrum caption: ' + cap);
    }
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

/* A tile link sets the dials it names (clamping what is out of range) and the strip
   follows; predict mode hides the strip behind a question and scores the answer. */
await step('tile link and predict mode', async () => {
  const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  gp.on('pageerror', e => failures.push(`[tile link] ${e.message}`));
  await gp.goto(new URL('gallery/snowflakes.html#tile=stellar-dendrite&K=4&N=999', base).href, { waitUntil: 'load' });
  await gp.waitForTimeout(600);
  const r = await gp.$eval('[data-slug="stellar-dendrite"]', t => [t.querySelector('[data-v=K]').textContent,
    t.querySelector('[data-v=N]').textContent, t.querySelector('.spec-cap').textContent]);
  if (r[0] !== '4' || r[1] !== '420' || !/nothing above m = 24\b/.test(r[2])) throw new Error('link gave ' + r.join(' | '));
  await gp.click('#t-predict');
  const t = gp.locator('[data-slug="plate"]');
  await t.scrollIntoViewIfNeeded();
  if (await t.locator('.predict').isHidden()) throw new Error('predict mode did not ask');
  await t.locator('.pf').fill('6'); await t.locator('.pt').fill('48'); await t.locator('.reveal').click();
  const score = await gp.textContent('#predict-score');
  await gp.close();
  if (score !== '2 of 2 right') throw new Error('a right answer scored ' + score);
});

/* Letters: facts about type that hold in any font. A B is an outline and two counters, and
   each counter winds the other way from the outline, which is what a fill rule reads; a
   slant applied to the leaves is the slant of the curve, to rounding. */
await step('letters', async () => {
  const gp = await browser.newPage();
  gp.on('pageerror', e => failures.push(`[letters] ${e.message}`));
  await gp.goto(new URL('gallery/letters.html', base).href, { waitUntil: 'load' });
  const r = await gp.evaluate(() => {
    const B = LT.letter('B', { font: 'sans', N: 128 });
    const area = s => { let a = 0; for (let i = 0; i < s.N; i++) { const j = (i + 1) % s.N; a += s.x[i] * s.y[j] - s.x[j] * s.y[i]; } return a; };
    const out = B.filter(s => !s.meta.hole), holes = B.filter(s => s.meta.hole);
    const s = LT.letter('a', { font: 'serif', N: 128 })[0], k = 0.2, a = LT.shear(s, k).sample(1024), d = s.sample(1024);
    let e = 0; for (let i = 0; i < 1024; i++) e = Math.max(e, Math.abs(a.x[i] - d.x[i] - k * d.y[i]));
    return { loops: B.length, holes: holes.length, opposite: holes.every(h => Math.sign(area(h)) === -Math.sign(area(out[0]))), shear: e };
  });
  await gp.close();
  if (r.loops !== 3 || r.holes !== 2) throw new Error(`B traced as ${r.loops} loops, ${r.holes} holes`);
  if (!r.opposite) throw new Error('a counter of B winds the same way as its outline');
  if (!(r.shear < 1e-12)) throw new Error('a slant is off by ' + r.shear);
});

/* The inspector reads facts off the leaves. Two of its examples have answers that can be
   worked by hand: a heart is one mirror (D1, vertical axis) and fits in 9 leaves; an
   ellipse wobbles twice but is Z₁ and Z₋₁ only, so 3 leaves hold it. */
await step('inspector', async () => {
  const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  gp.on('pageerror', e => failures.push(`[inspector] ${e.message}`));
  await gp.goto(new URL('gallery/inspect.html', base).href, { waitUntil: 'load' });
  const read = async ex => {
    await gp.click(`#examples button:text-is("${ex}")`);
    return gp.$$eval('.fact', fs => Object.fromEntries(fs.map(f => [f.querySelector('.k').textContent, f.querySelector('.v').textContent])));
  };
  const heart = await read('heart'), ell = await read('ellipse');
  await gp.close();
  if (heart['symmetry group'] !== 'D1' || !/axis at 90\.0°/.test(heart.mirror) || !/could be 9$/.test(heart.leaves))
    throw new Error('heart read as ' + JSON.stringify(heart));
  if (ell['symmetry group'] !== 'D2' || !/could be 3$/.test(ell.leaves)) throw new Error('ellipse read as ' + JSON.stringify(ell));
});

/* THE COPIES. Each gallery page carries tvf.js, and each shape page also the same bundle
   after it (through tvf.format.js, ~130 KB) and the same tile code (spectrum strip, predict
   mode, editor link), so that each opens from disk as one file. Nothing makes them stay the same but
   this: a fix made in one page and not the others fails here, naming the odd ones out. */
await step('gallery copies agree', async () => {
  const spans = [
    ['bundled library', 'const TVF = (function', s => { const j = s.indexOf('})();', s.indexOf('return { toTVF')); return j < 0 ? -1 : j + 5; }],
    ['tile code', "// The loop a tile's strip", s => s.indexOf('async function copyText')],
  ];
  // tvf.js itself is shared by every page, chart pages included; the rest of the bundle and
  // the tile code only by the shape pages.
  spans.unshift(['core tvf.js', 'const TVF = (function', s => { const j = s.indexOf('})();', s.indexOf('const TVF = (function')); return j < 0 ? -1 : j + 5; }, [...galleries, 'playground.html']]);
  for (const [what, start, end, pages = shapePages] of spans) {
    const seen = new Map();
    for (const g of pages) {
      const s = await readFile(join(ROOT, 'gallery', g), 'utf8');
      const i = s.indexOf(start), j = end(s);
      const key = i < 0 || j < i ? '(missing)' : s.slice(i, j);
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push(g);
    }
    if (seen.size > 1) {
      const groups = [...seen.values()].sort((a, b) => b.length - a.length);
      const odd = groups.slice(1).flat();
      throw new Error(`${what} differs: ${odd.join(', ')} ${odd.length === 1 ? 'does' : 'do'} not match ${groups[0].join(', ')}`);
    }
  }
});

/* gallery/tvf.js is the same library as an ES module, generated from the shared copy: its
   body must be that copy's, its exports that copy's return list, and it must import and work. */
await step('tvf.js module', async () => {
  const mod = await readFile(join(ROOT, 'gallery', 'tvf.js'), 'utf8');
  const page = await readFile(join(ROOT, 'gallery', 'spiral.html'), 'utf8');
  const i = page.indexOf('const TVF = (function () {'), j = page.indexOf('})();', i);
  const iife = page.slice(i + 'const TVF = (function () {'.length, j);
  const r = iife.match(/\nreturn \{([^}]*)\};\s*$/);
  const names = r[1].split(',').map(x => x.trim()).filter(Boolean);
  const want = iife.slice(0, r.index).replace(/^\n/, '') + '\n\nexport { ' + names.join(', ') + ' };\n';
  if (mod !== want) throw new Error('gallery/tvf.js is not the shared copy: regenerate it from a gallery page');
  const t = await import(new URL('../gallery/tvf.js', import.meta.url).href);
  const s = t.circle(64, { r: 100 }), back = s.clone().resample(127).resample(64);
  const err = Math.max(...Array.from(back.x, (v, k) => Math.abs(v - s.x[k])));
  if (!(err < 1e-9)) throw new Error('resample 64 → 127 → 64 is off by ' + err);
});

/* The playground fills the window with a rail, the clay and the transcript; it must load,
   take a gesture, and write it down. */
await step('playground', async () => {
  const gp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  gp.on('pageerror', e => failures.push(`[playground] ${e.message}`));
  await gp.goto(new URL('gallery/playground.html', base).href, { waitUntil: 'load' });
  await gp.waitForTimeout(500);
  await gp.click('button[data-verb="smooth"]');
  const tape = await gp.textContent('#tape');
  const bg = await gp.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await gp.close();
  if (bg !== 'rgb(12, 15, 22)') throw new Error('style.css did not apply (body is ' + bg + ')');
  if (!/s\.smooth\(/.test(tape)) throw new Error('the transcript did not record smooth: ' + tape.slice(-120));
});

/* labs.html is generated from the lab drawer (tools/build-labs.mjs). Regenerate it here and
   compare: a lab added, renamed or re-described in draw.html without \`npm run labs\` fails. */
await step('labs.html matches the drawer', async () => {
  const { readLabs, render } = await import('../tools/build-labs.mjs');
  const want = render(await readLabs(base));
  const have = await readFile(join(ROOT, 'labs.html'), 'utf8');
  if (have !== want) throw new Error('labs.html is out of date with draw.html: run `npm run labs`');
  const lp = await browser.newPage();
  lp.on('pageerror', e => failures.push(`[labs.html] ${e.message}`));
  await lp.goto(new URL('labs.html', base).href, { waitUntil: 'load' });
  await lp.fill('#q', 'walker');
  const shown = await lp.textContent('#count');
  await lp.close();
  const m = shown.match(/^(\d+) of (\d+)$/);
  if (!m || !(+m[1] > 0 && +m[1] < +m[2])) throw new Error('filtering for "walker" shows ' + shown);
});

/* The front page: it loads, and each of its cards points at a gallery that exists. */
await step('gallery index', async () => {
  const gp = await browser.newPage();
  gp.on('pageerror', e => failures.push(`[gallery/index] ${e.message}`));
  await gp.goto(new URL('gallery/index.html', base).href, { waitUntil: 'load' });
  const hrefs = await gp.$$eval('a.card:not(.after)', as => as.map(a => a.getAttribute('href')));
  const after = await gp.$$eval('a.card.after', as => as.map(a => a.getAttribute('href')));
  await gp.close();
  if (hrefs.length !== galleries.length) throw new Error(`${hrefs.length} cards for ${galleries.length} pages`);
  if (new Set(hrefs).size !== hrefs.length) throw new Error('a page has two cards');
  for (const h of hrefs) if (!galleries.includes(h)) throw new Error('card points at missing ' + h);
  if (after.join() !== 'playground.html,inspect.html') throw new Error('the cards after the course point at ' + after.join());
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
