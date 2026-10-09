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
// QUICK=1 (npm run test:quick) is the everyday run: the editor walk and every fast
// single-page check, but only two gallery pages walked (one shape page, one chart page)
// instead of all of them, and no regeneration of labs.html. CI runs the full set.
const QUICK = !!process.env.QUICK;
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

  /* TVF §8's three decoder test vectors, against the editor's own kernel at N = 8 … 1024:
     the invisible mode reads zero at every leaf, the band Gram is diag(N, N/2, …, N/2, N)
     with every band mode presented exactly, and the Lebesgue function peaks at home at the
     closed-form sum (which must also match the published Λ_N). Then the same vectors are run
     against two planted bugs, leaves half a leaf off and the odd-N kernel at even N, and must
     fail: a check that cannot fail checks nothing. */
  await step('decoder test vectors', async () => {
    const r = await page.evaluate(() => {
      const res = runDecoderVectors();
      const keep = { lp: tvf.leafPositions, k: tvf.kernel };
      tvf.leafPositions = N => Float64Array.from({ length: N }, (_, k) => k * 2 * Math.PI / N);
      const shifted = runDecoderVectors({ ds: [2, 5] }).pass;
      tvf.leafPositions = keep.lp;
      tvf.kernel = (phi, N) => { phi = Math.atan2(Math.sin(phi), Math.cos(phi)); if (Math.abs(phi) < 1e-12) return 1;
                                 return Math.sin(N * phi / 2) / (N * Math.sin(phi / 2)); };
      const parity = runDecoderVectors({ ds: [2, 5] }).pass;
      tvf.kernel = keep.k;
      return { pass: res.pass, failed: res.rows.filter(x => !x.ok).map(x => x.N), lam: Object.fromEntries(res.rows.map(x => [x.N, x.home])), shifted, parity };
    });
    if (!r.pass) throw new Error('decoder vectors fail at N = ' + r.failed.join(', '));
    for (const [N, want] of [[8, 1.848], [32, 2.728], [128, 3.610], [512, 4.493]])
      if (Math.abs(r.lam[N] - want) > 6e-4) throw new Error(`Λ${N} = ${r.lam[N]}, the paper says ${want}`);
    if (r.shifted) throw new Error('the vectors passed a decoder with its leaves half a leaf off');
    if (r.parity) throw new Error('the vectors passed the odd-N kernel at even N');
  });

  /* The exact reference decoder: the same identities in ℤ[ζ], ζ = e^{iπ/2N}, where they are
     equalities of integers. It must pass at every depth with every integer inside 2^53, the
     float decoder must agree with it to rounding, and two planted bugs must fail it: the top
     mode at full weight (only R2 can see that one; the partition of unity sums the top cosine
     to zero over an even number of leaves whatever its weight), and the odd-N kernel in the
     float decoder. */
  await step('exact reference decoder', async () => {
    const r = await page.evaluate(() => {
      const res = runExactDecoder();
      const nyq = runExactDecoder({ ds: [2, 4], nyq: 2, gramMax: 0 });
      const keep = tvf.evalAt;
      tvf.evalAt = (ch, phi) => { const N = ch.length; let s = 0;
        for (let k = 0; k < N; k++) { let d = phi - (k + 0.5) * 2 * Math.PI / N; d = Math.atan2(Math.sin(d), Math.cos(d));
          s += ch[k] * (Math.abs(d) < 1e-12 ? 1 : Math.sin(N * d / 2) / (N * Math.sin(d / 2))); }
        return s; };
      const odd = runExactDecoder({ ds: [2, 4], gramMax: 0 });
      tvf.evalAt = keep;
      return { pass: res.pass, safe: res.safe, failed: res.rows.filter(x => !x.ok).map(x => x.N), dev: Math.max(...res.rows.map(x => x.floatDev)),
               nyqR2: nyq.rows.some(x => !x.r2), oddDev: Math.min(...odd.rows.map(x => x.floatDev)) };
    });
    if (!r.safe) throw new Error('an integer outgrew 2^53');
    if (!r.pass) throw new Error('the exact decoder fails at N = ' + r.failed.join(', '));
    if (!(r.dev < 1e-12)) throw new Error('the float decoder is off the exact one by ' + r.dev);
    if (!r.nyqR2) throw new Error('R2 passed a kernel with the top mode at full weight');
    if (!(r.oddDev > 1e-2)) throw new Error('the odd-N kernel in the float decoder was not caught (' + r.oddDev + ')');
  });

  /* Depth where needed (TVF §2.8): entering an octave only where its residual exceeds τ of the
     departure must hold every library shape to about τ (or to the full file's own miss, where that
     is worse) over everything the full file holds, grow as τ shrinks, and at τ = 1e-6 come in
     well under the full file's 518 sweeps. */
  await step('depth where needed', async () => {
    const r = await page.evaluate(() => runDepthWhereNeeded());
    if (r.rows.length < 20) throw new Error('only ' + r.rows.length + ' shapes read');
    for (const row of r.rows) {
      let prev = 0;
      for (const a of row.at) {
        if (!(a.miss <= 1.5 * Math.max(a.tau, row.full.miss))) throw new Error(`${row.key} at τ ${a.tau}: miss ${a.miss} (full ${row.full.miss})`);
        if (a.docs < prev) throw new Error(`${row.key}: fewer sweeps at a tighter τ`);
        prev = a.docs;
      }
      const tight = row.at[row.at.length - 1];
      if (!(tight.docs < row.full.docs / 2)) throw new Error(`${row.key}: ${tight.docs} sweeps at τ 1e-6 against ${row.full.docs}`);
    }
  });

  /* The walls (WLS): scored over the whole range, not only where level 3 is reached, the
     flat-walls writer holds every point off the walls to 1e-5 of the departure, where the full
     file and the where-needed file miss by percents in bands at the walls; and its walls are
     closer than theirs. The saved file uses it. */
  /* Undoing the division (UDV): one reader's quotients give back the unit circle, which misses
     every figure but the circle; three readers' quotients, crossed, give back each figure
     exactly up to its size, and with one length, exactly. */
  await step('undoing the division', async () => {
    const r = await page.evaluate(() => undoDivisionRun().map(x => ({ key: x.key, kind: x.kind, miss: x.miss })));
    const of = k => r.filter(x => x.kind === k);
    if (of('as held').length < 5) throw new Error('only ' + of('as held').length + ' figures read');
    for (const x of of('three readers, no length').concat(of('three readers, one length')))
      if (!(x.miss < 1e-12)) throw new Error(`${x.key}, ${x.kind}: off by ${x.miss}`);
    if (!(Math.max(...of('one reader, census').map(x => x.miss)) > 0.5)) throw new Error('the census came back close to the figures');
  });

  /* SIT, re-measured (the format paper's "what the recursion found", 3): learning a shape from
     its encounters, the nested reader stays under 1% at every distance from 4 to 128 h, while
     the one sweep's error grows more than fifteenfold (23× when measured). */
  await step('learning the shapes', async () => {
    const r = await page.evaluate(() => runShapeEncounters().rows.map(x => ({ D: x.D, eA: x.eA, eB: x.eB })));
    const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1], at = D => r.filter(x => x.D === D);
    if (r.some(x => !(x.eB < 0.01))) throw new Error('the nested reader misses by ' + Math.max(...r.map(x => x.eB)));
    const grow = med(at(128).map(x => x.eA)) / med(at(4).map(x => x.eA));
    if (!(grow > 15)) throw new Error('the one sweep grows only ×' + grow.toFixed(1) + ' from 4 to 128 h');
  });

  await step('walls', async () => {
    const r = await page.evaluate(() => runDepthWalls());
    if (r.rows.length < 20) throw new Error('only ' + r.rows.length + ' shapes read');
    for (const x of r.rows) {
      if (!(x.flat.all < 2e-5)) throw new Error(`${x.key}: flat walls miss by ${x.flat.all} off the walls`);
      if (!(x.full.all > 10 * x.flat.all)) throw new Error(`${x.key}: the full file misses by only ${x.full.all}`);
      if (!(Math.max(...x.flat.byWall.slice(3)) <= Math.max(...x.full.byWall.slice(3)))) throw new Error(`${x.key}: the inner walls got worse`);
    }
  });
  await step('save depth: flat walls', async () => {
    for (const key of ['circle', 'egg']) {
      const r = await page.evaluate(k => depthSaveCheck(k), key);
      if (r.why) throw new Error(`${key}: ${r.why}`);
      if (!(r.tau === 1e-6)) throw new Error(`${key}: saved with τ ${r.tau}, not the flat-walls writer`);
      if (r.readBack !== r.docs) throw new Error(`${key}: ${r.docs} sweeps written, ${r.readBack} read back`);
      if (!(r.trip < 1e-5)) throw new Error(`${key}: the round trip moved the reading by ${r.trip}`);
      if (!(r.miss < 2e-5)) throw new Error(`${key}: the saved reading misses by ${r.miss} over the range (full ${r.fullMiss})`);
    }
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
                             'bench.html', 'sound.html', 'motion.html', 'compose.html', 'epicycles.html', 'situated.html', 'depth.html', 'recovered.html', 'corner.html', 'standpoint.html', 'readers.html', 'compile.html']);
const shapePages = galleries.filter(g => !CHART_PAGES.has(g));
for (const g of QUICK ? galleries.filter(g => g === 'snowflakes.html' || g === 'spiral.html') : galleries){
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

/* Tiles: the seam between neighbouring tiles never closes, and the parameterization sets
   how fast it shrinks. Uniform along each edge it halves per doubling of N (a corner's
   1/N); stalled at the corners with m = 2 derivatives it falls about 2^3 = 8 times. */
await step('tiles', async () => {
  const gp = await browser.newPage();
  gp.on('pageerror', e => failures.push(`[tiles] ${e.message}`));
  await gp.goto(new URL('gallery/tiles.html', base).href, { waitUntil: 'load' });
  const r = await gp.evaluate(() => [0, 2].map(m => {
    const T = TL.tile('square', { m }), a = TL.seam(T, TL.leaves(T, 256)), b = TL.seam(T, TL.leaves(T, 512));
    return { m, a, b, ratio: a / b };
  }));
  await gp.close();
  for (const { m, a, ratio } of r) {
    const want = Math.pow(2, m + 1);
    if (!(a > 0)) throw new Error(`stall ${m}: the seam measured zero, which a band-limited tile cannot reach`);
    if (Math.abs(ratio / want - 1) > 0.15) throw new Error(`stall ${m}: the seam falls ${ratio.toFixed(2)}× per doubling, expected ${want}×`);
  }
});

/* Epicycles: the chain is the format, not a picture of it. All the circles of a shape's
   leaves land on the kernel's curve to rounding, at odd and even N (the Nyquist pair); a
   six-fold flake uses only m ≡ 1 (mod 6); the heart is degree four, so eight circles; and
   a chain sampled at 2k + 1 leaves comes back exactly. */
await step('epicycles', async () => {
  const gp = await browser.newPage();
  gp.on('pageerror', e => failures.push(`[epicycles] ${e.message}`));
  await gp.goto(new URL('gallery/epicycles.html', base).href, { waitUntil: 'load' });
  const r = await gp.evaluate(() => {
    const exact = s => { const ch = EP.order(EP.coeffs(s), 'size'); let e = 0;
      for (let q = 0; q < 97; q++) { const ph = TAU * (q + 0.31) / 97, p = EP.pen(ch, ch.length, ph);
        e = Math.max(e, Math.hypot(p[0] - evalAt(s.x, ph), p[1] - evalAt(s.y, ph))); }
      return e / EP.size(ch); };
    const f = EP.fromChain(EP.randomChain(5, 7, 20, 0.7)), back = EP.coeffs(f.shape);
    return {
      odd: exact(star(63)), even: exact(star(64)),
      flake: EP.present(EP.order(EP.coeffs(flake(96)), 'speed')),
      heart: EP.present(EP.order(EP.coeffs(heart(256)), 'size'), 1e-12).length,
      chain: Math.max(...f.chain.slice(1).map(c => { const b = back.find(x => x.m === c.m); return Math.hypot(b.re - c.re, b.im - c.im); })),
      N: f.N, k: f.k,
    };
  });
  await gp.close();
  if (!(r.odd < 1e-12 && r.even < 1e-12)) throw new Error(`the chain misses the kernel's curve: odd ${r.odd}, even ${r.even}`);
  if (r.flake.join() !== '1,-5,7,-11,13') throw new Error('a six-fold flake uses m = ' + r.flake.join());
  if (r.heart !== 8) throw new Error('the heart uses ' + r.heart + ' circles, not 8');
  if (!(r.N === 2 * r.k + 1 && r.chain < 1e-12)) throw new Error(`a chain did not come back from ${r.N} leaves: ${r.chain}`);
});

/* The two horns (where it breaks, spectral §22): on the same leaves, the interpolant overshoots
   a jump by the format's 0.1411 of it, and the Fejér reading never rises above the step, is
   off its own leaves on cos 3θ by 3/(N/2), and has norm 1. */
await step('the two horns', async () => {
  const gp = await browser.newPage();
  gp.on('pageerror', e => failures.push(`[two horns] ${e.message}`));
  await gp.goto(new URL('gallery/fail.html', base).href, { waitUntil: 'load' });
  const r = await gp.evaluate(() => {
    const N = 256, th = Array.from({ length: N }, (_, k) => (k + 0.5) * TAU / N);
    const sq = Float64Array.from(th, t => (t < Math.PI ? 1 : -1)), c3 = Float64Array.from(th, t => Math.cos(3 * t));
    let over = -Infinity, fmax = -Infinity, node = 0, norm = 0;
    for (let i = 0; i <= 4000; i++) { const t = TAU * i / 4000; over = Math.max(over, evalAt(sq, t)); fmax = Math.max(fmax, fejerAt(sq, t)); }
    for (let k = 0; k < N; k++) node = Math.max(node, Math.abs(fejerAt(c3, th[k]) - c3[k]));
    for (let i = 0; i <= 50; i++) { const p = (i / 50) * TAU / N; let a = 0; for (const t of th) a += Math.abs(fejerKernel(p - t, N)); norm = Math.max(norm, a); }
    return { over: (over - 1) / 2, fmax, node, norm, tile: !!document.getElementById('horns') };
  });
  await gp.close();
  if (!r.tile) throw new Error('no #horns section on where it breaks');
  if (Math.abs(r.over - 0.1411) > 0.002) throw new Error('interpolation overshoot ' + r.over + ', the paper says 0.1411');
  if (!(r.fmax <= 1 + 1e-12)) throw new Error('the Fejér reading rose above the step: ' + r.fmax);
  if (Math.abs(r.node - 3 / 128) > 1e-4) throw new Error('Fejér off its leaves on cos 3θ by ' + r.node + ', not 3/128');
  if (Math.abs(r.norm - 1) > 1e-9) throw new Error('Fejér norm ' + r.norm);
});

/* The inspector reads depth (TVF §2.8): the example is written to text the way the editor
   saves one (flat walls, 262 sweeps) and read back, level 3 within 1e-5 of the shape over the
   whole range, where the full writer misses by percents at the walls; the round trip through 8
   digits small; pasted depth text takes the same road. Its depth engine is the editor's, copied:
   the copy must still match. */
await step('inspector reads depth', async () => {
  const strip = s => s.replace(/\s+/g, '');
  const ed = await readFile(join(ROOT, 'draw.html'), 'utf8'), ins = await readFile(join(ROOT, 'gallery/inspect.html'), 'utf8'),
        dep = await readFile(join(ROOT, 'gallery/depth.html'), 'utf8'), std = await readFile(join(ROOT, 'gallery/standpoint.html'), 'utf8');
  const grab = (src, start) => { const i = src.indexOf(start); if (i < 0) return null; let d = 0, k = src.indexOf('{', i);
    for (; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) break; } return strip(src.slice(i, k + 1)); };
  for (const [what, start] of [['DEPTH', 'const DEPTH = (function() {'], ...['fmtSig', 'rungOfRow', 'depthToTVF', 'depthFromTVF', 'depthLearnedFacing', 'depthEnterWhereNeeded', 'wlsSlopeRow', 'wlsSolve', 'depthEnterFlat', 'depthEnterFlatWalls'].map(f => [f, 'function ' + f + '(']) ])
    for (const [page, src] of [['inspector', ins], ['depth gallery', dep], ['where-to-stand gallery', std]])
      if (!grab(src, start) || grab(src, start) !== grab(ed, start)) throw new Error(`the ${page}'s ${what} no longer matches the editor's`);
  const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  gp.on('pageerror', e => failures.push(`[inspector depth] ${e.message}`));
  await gp.goto(new URL('gallery/inspect.html', base).href, { waitUntil: 'load' });
  await gp.click('#examples button:text-is("depth: a circle with two bumps")');
  const read = () => gp.$$eval('.fact', fs => Object.fromEntries(fs.map(f => [f.querySelector('.k').textContent, f.querySelector('.v').textContent])));
  const a = await read();
  const text = await gp.$eval('#paste', t => t.value);
  await gp.evaluate(() => window.inspectShapes({ name: 'x', curves: [{ x: Float64Array.of(1, 0, -1), y: Float64Array.of(0, 1, 0) }] }));
  // 140 kB of text: set it and fire the event, as a paste does, rather than typing it in
  await gp.$eval('#paste', (t, v) => { t.value = v; t.dispatchEvent(new Event('input')); }, text);
  const b = await read();
  await gp.close();
  if (a['the file'] !== '262 sweeps of 16 values') throw new Error('depth example read as ' + a['the file']);
  const fullMiss = parseFloat((a['the walls'] || '').replace(/^.*misses by /, ''));
  if (!(fullMiss > 0.1)) throw new Error('the full writer at the walls: ' + a['the walls']);
  const lvl3 = parseFloat((a['against the shape'] || '').replace(/^.*misses by /, ''));
  if (!(lvl3 > 0 && lvl3 < 1e-5)) throw new Error('level 3 misses the shape by ' + a['against the shape']);
  const trip = parseFloat(a['round trip'] || '');
  if (!(trip < 1e-5)) throw new Error('round trip ' + a['round trip']);
  if (b['the file'] !== '262 sweeps of 16 values' || !/^1 at level 0/.test(b.addresses || '')) throw new Error('pasted depth text read as ' + JSON.stringify(b));
});

/* Depth: the page's claims, measured on the page with its own copy of the editor's engine. Flat
   walls hold the run-1 shape to 1e-5 over the whole range, where every octave and where needed
   miss by percents beside the walls; and at about the same count of values depth beats one sweep
   on the grain beside the reader, and loses to it on a smooth bump out in the turn. */
await step('depth gallery', async () => {
  const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  gp.on('pageerror', e => failures.push(`[depth gallery] ${e.message}`));
  await gp.goto(new URL('gallery/depth.html', base).href, { waitUntil: 'load' });
  const r = await gp.evaluate(() => ({ flat: depthPageCheck('two bumps', 'flat walls', 1e-6), full: depthPageCheck('two bumps', 'every octave', 1e-6),
                                       dwn: depthPageCheck('two bumps', 'where needed', 1e-6) }));
  if (!(r.flat.worst < 1e-5)) throw new Error('flat walls miss two bumps by ' + r.flat.worst);
  if (!(r.full.worst > 1e-3 && r.dwn.worst > 1e-3)) throw new Error(`every octave ${r.full.worst}, where needed ${r.dwn.worst}: the walls no longer show`);
  if (r.full.docs !== 518) throw new Error('every octave is ' + r.full.docs + ' sweeps');
  const verdict = async shape => gp.evaluate(async sh => { const t = [...document.querySelectorAll('.tile')].find(x => x.querySelector('h3')?.textContent === 'the same values, two ways');
    const sel = t.querySelector('select[data-k="shape"]'); sel.value = sh; sel.dispatchEvent(new Event('input'));
    for (let i = 0; i < 200 && !/values in depth/.test(t.querySelector('.verdict').textContent); i++) await new Promise(r => setTimeout(r, 100));
    return t.querySelector('.verdict').textContent; }, shape);
  const grain = await verdict('a grain by the reader'), bump = await verdict('a narrow bump');
  await gp.close();
  if (!/depth [\d,]+× closer/.test(grain)) throw new Error('the grain by the reader: ' + grain);
  if (!/breadth [\d,]+× closer/.test(bump)) throw new Error('a narrow bump: ' + bump);
});

/* Recovered: one reader and the census miss every figure but the circle read from its centre;
   three readers' crossed quotients recover every place two of them see, exactly; the crescent
   hides some of its places from readers in its body. */
await step('recovered gallery', async () => {
  const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  gp.on('pageerror', e => failures.push(`[recovered gallery] ${e.message}`));
  await gp.goto(new URL('gallery/recovered.html', base).href, { waitUntil: 'load' });
  const r = await gp.evaluate(() => recoverCheck());
  await gp.close();
  if (r.length < 5) throw new Error('only ' + r.length + ' figures');
  for (const x of r) {
    if (!(x.worst < 1e-12)) throw new Error(`${x.n}: three readers miss by ${x.worst}`);
    if (!(x.census > 0.2)) throw new Error(`${x.n}: the census came back within ${x.census}`);
  }
  const cres = r.find(x => x.n === 'crescent'), circ = r.find(x => x.n === 'circle');
  if (!(circ.got === 180)) throw new Error('the circle: ' + circ.got + ' places recovered');
  if (!(cres.got < 180 && cres.got > 90)) throw new Error('the crescent: ' + cres.got + ' places recovered');
});

/* The three pages that follow Serial, Parallel and Nowhere, each measured with its own module:
   the corner (the flip holds to the last bit, the in-place sweep's ½ ¾ ⅞ 15/16, one band of
   detail lost per doubling once past the finest, the sure reading cheapest at the corner);
   where to stand (the model of the editor's circle reads 0.53 where the editor read 0.54, three
   levels out it is small, and a perfect circle costs one sweep); between readers (the cross ratio
   agrees between readers, three readers place each other and the places, a third reader matches
   readings to places with none wrong). */
await step('reader-geometry galleries', async () => {
  const run = async (pg, hook) => { const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    gp.on('pageerror', e => failures.push(`[${pg}] ${e.message}`));
    await gp.goto(new URL('gallery/' + pg, base).href, { waitUntil: 'load' });
    const r = await gp.evaluate(h => window[h](), hook); await gp.close(); return r; };
  const c = await run('corner.html', 'cornerCheck');
  if (!(c.flip < 1e-15)) throw new Error('the flip misses by ' + c.flip);
  if (c.inPlace.join() !== '0.5,0.75,0.875,0.9375') throw new Error('in-place sweep ' + c.inPlace);
  for (let k = 4; k < c.bands.length; k++) if (c.bands[k] !== c.bands[k - 1] - 1) throw new Error('bands by distance ' + c.bands);
  if (c.cost.join() !== '3,2,3') throw new Error('sure cost ' + c.cost);
  const st = await run('standpoint.html', 'standCheck');
  if (!(Math.abs(st.dpt - 0.53) < 0.02)) throw new Error('the model of the editor\'s circle reads ' + st.dpt);
  if (!(st.dptFar < 0.1 && st.perfect < 1e-6 && st.perfectCost === 1)) throw new Error('standpoint ' + JSON.stringify(st));
  const b = await run('readers.html', 'betweenCheck');
  if (!(b.cr < 1e-12 && b.pd < 1e-12)) throw new Error('between readers ' + JSON.stringify(b));
  if (!(b.right === 30 && b.wrong === 0)) throw new Error('matching ' + JSON.stringify(b));
});

/* Compile time: the partial evaluator folds the reader's program so that, with the leaf count
   fixed, one branch is left (the side of the corner, on the payload) and the residual reads the
   same as the program; with everything fixed nothing is left; recursion keeps a loop, level of
   detail none; the exponent bits give ⌊log₂⌋; the two creations are bit for bit the same. */
await step('compile time', async () => {
  const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  gp.on('pageerror', e => failures.push(`[compile time] ${e.message}`));
  await gp.goto(new URL('gallery/compile.html', base).href, { waitUntil: 'load' });
  const r = await gp.evaluate(() => compileCheck());
  await gp.close();
  if (!(r.same && r.left.ifs === 1 && r.left.loops === 0 && r.unrolled === 5)) throw new Error('the folded reader ' + JSON.stringify(r));
  if (r.allIfs !== 0) throw new Error('with everything fixed, ' + r.allIfs + ' branches are left');
  if (!(r.recurseLoops === 1 && r.levelLoops === 0 && r.levelIfs === 0)) throw new Error('recursion against level ' + JSON.stringify(r));
  if (!(r.tablesSame && r.bits === 0)) throw new Error('creation or bits ' + JSON.stringify(r));
});

/* Where you stand: the situated reader's claims, measured on the page with its own module. The
   circle from its centre opens at ½, 1, 2/π, 2/π, and so does any shape read by direction; the
   corner reads the circle's stretch back; the circle's two sizes are one; a deep curl is seen
   whole only with a reader inside; the deepest spiral needs six levels of readers within
   readers. And dragging the reader changes what it reads. */
await step('where you stand', async () => {
  const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  gp.on('pageerror', e => failures.push(`[where you stand] ${e.message}`));
  await gp.goto(new URL('gallery/situated.html', base).href, { waitUntil: 'load' });
  const r = await gp.evaluate(() => {
    const circle = SI.polarShape(2048, t => 1), egg = shapeOf('egg');
    const c = SI.stats(SI.readings(circle, 40000).s), d = SI.stats(SI.readings(egg, 40000, null, 'direction').s);
    const cr = SI.cornerReads(circle, 3), nf = SI.nearFar(circle), oc = SI.occlusion(pathoOf('curled 310°'));
    const ns = SI.nest(pathoOf('spiral 1.7 turns'), SI.outsideStarts()), done = ns.hist.find(h => h[2] >= 0.99);
    return { c, d, even: cr.even, Q: nf.Q, flip: nf.flip, out: oc.out, both: oc.both, levels: done ? done[0] : -1 };
  });
  const near = (a, b, e) => Math.abs(a - b) <= e;
  if (!(near(r.c.corner, 0.5, 1e-3) && near(r.c.middle, 1, 2e-3) && near(r.c.tail, 2 / Math.PI, 3e-3) && near(r.c.head, 2 / Math.PI, 3e-3)))
    throw new Error('the circle from its centre opens at ' + JSON.stringify(r.c));
  if (!(near(r.d.corner, 0.5, 1e-3) && near(r.d.middle, 1, 2e-3))) throw new Error('read by direction, the egg opens at ' + JSON.stringify(r.d));
  if (!near(r.even, 3, 0.03)) throw new Error('the corner reads the circle stretched by 3 as ' + r.even);
  if (!(near(r.Q, 1, 1e-9) && r.flip < 1e-10)) throw new Error(`the circle's two sizes: Q ${r.Q}, flip ${r.flip}`);
  if (!(near(r.out, 0.63, 0.02) && r.both > 0.999)) throw new Error(`curled 310°: ${r.out} from outside, ${r.both} with the inside`);
  if (r.levels !== 6) throw new Error('the deepest spiral needed ' + r.levels + ' levels, the editor records 6');
  // drag the first tile's reader and the reading must change
  const tile = gp.locator('.tile').first();
  await tile.scrollIntoViewIfNeeded(); await gp.waitForTimeout(300);
  const before = await tile.locator('.verdict').textContent();
  const box = await tile.locator('canvas').boundingBox();
  await gp.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4); await gp.mouse.down();
  await gp.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.3, { steps: 4 }); await gp.mouse.up();
  const after = await tile.locator('.verdict').textContent();
  await gp.close();
  if (before === after) throw new Error('dragging the reader changed nothing: ' + after);
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
if (!QUICK) await step('labs.html matches the drawer', async () => {
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

/* The curve library is its own file (tvf-core.js), and must stay a library: it runs on its own,
   outside any page, and draw.html loads it rather than carrying a second copy that could drift. */
await step('tvf-core.js stands alone', async () => {
  const vm = await import('node:vm');
  const src = await readFile(join(ROOT, 'tvf-core.js'), 'utf8');
  const ctx = { module: { exports: {} } };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'tvf-core.js' });
  const C = ctx.module.exports, t = C.tvf;
  for (const k of ['tvf', 'reconstructFFT', 'reconstructFejer', 'isPow2'])
    if (!C[k]) throw new Error('tvf-core.js exports no ' + k);
  let pou = 0, r2 = 0;
  for (const N of [16, 33]) for (let i = 0; i < 50; i++) {
    const p = i * 0.1237; let sum = 0;
    for (let k = 0; k < N; k++) sum += t.kernel(p - (k + 0.5) * 2 * Math.PI / N, N);
    pou = Math.max(pou, Math.abs(sum - 1));
  }
  for (let j = 1; j < 16; j++) r2 = Math.max(r2, Math.abs(t.kernel(j * 2 * Math.PI / 16, 16)));
  if (!(pou < 1e-12 && r2 < 1e-12)) throw new Error(`the library outside a page: partition of unity ${pou}, R2 ${r2}`);
  const html = await readFile(join(ROOT, 'draw.html'), 'utf8');
  if (!html.includes('<script src="tvf-core.js"></script>')) throw new Error('draw.html does not load tvf-core.js');
  if (html.includes('const tvf = (function')) throw new Error('draw.html carries its own copy of the library again');
});

/* The papers: every Markdown file in papers/ has a card, every card's file is there, and
   each paper renders: no math placeholder left behind, its sections headed, its TeX found
   (typeset when the CDN answers, shown as source when it does not). A section link opens
   the paper at that heading. */
await step('papers', async () => {
  const files = (await readdir(join(ROOT, 'papers'))).filter(f => f.endsWith('.md')).sort();
  const pp = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  pp.on('pageerror', e => failures.push(`[papers] ${e.message}`));
  await pp.goto(new URL('papers.html', base).href, { waitUntil: 'load' });
  const listed = (await pp.evaluate(() => PAPERS.map(p => p.file.replace('papers/', '')))).sort();
  if (listed.join() !== files.join()) throw new Error(`papers.html lists ${listed.join(', ')}; papers/ holds ${files.join(', ')}`);
  for (const f of files) {
    const id = f.replace(/\.md$/, '');
    await pp.evaluate(i => { location.hash = i; }, id);
    await pp.waitForFunction(i => document.getElementById('reader').dataset.id === i && document.querySelector('#reader .md'), id, { timeout: 10000 });
    const r = await pp.evaluate(() => { const el = document.querySelector('#reader .md');
      return { stray: /[\u0000-\u0002]/.test(el.innerHTML), h2: el.querySelectorAll('h2').length, math: el.querySelectorAll('.math').length,
               index: !document.getElementById('index').hidden }; });
    if (r.stray) throw new Error(f + ': a placeholder was left in the text');
    if (r.h2 < 5) throw new Error(f + `: only ${r.h2} sections rendered`);
    if (r.index) throw new Error(f + ': the index is still showing over the paper');
    if (f !== 'tvf.md' && r.math < 100) throw new Error(f + `: only ${r.math} formulas found`);
  }
  await pp.goto(new URL('papers.html#tb_spectral:17.3-numerical-verification', base).href, { waitUntil: 'load' });
  const top = await pp.waitForFunction(() => { const h = document.getElementById('17.3-numerical-verification');
    return !!h && Math.abs(h.getBoundingClientRect().top) < 200; }, null, { timeout: 10000 }).catch(() => null);
  await pp.close();
  if (!top) throw new Error('a section link did not open the paper at its heading');
});

/* Every link from a gallery page into a paper names a heading that exists: the reader makes
   its ids from the heading text, so retitling a section (or a new revision of a paper)
   would otherwise leave the galleries pointing at nothing. */
await step('gallery links into the papers', async () => {
  const links = new Set();
  for (const f of (await readdir(join(ROOT, 'gallery'))).filter(f => f.endsWith('.html'))) {
    const src = await readFile(join(ROOT, 'gallery', f), 'utf8');
    for (const m of src.matchAll(/papers\.html#([\w.-]+:[^"'\s)]+)/g)) links.add(m[1]);
  }
  if (links.size < 8) throw new Error('only ' + links.size + ' paper links found in the galleries');
  const pp = await browser.newPage();
  const bad = [];
  for (const l of links) {
    const [paper, id] = l.split(':');
    await pp.goto(new URL('papers.html#' + l, base).href, { waitUntil: 'load' });
    const ok = await pp.waitForFunction(([p, i]) => document.getElementById('reader').dataset.id === p && document.querySelector('#reader .md')
      && !!document.getElementById(decodeURIComponent(i)), [paper, id], { timeout: 10000 }).then(() => true).catch(() => false);
    if (!ok) bad.push(l);
  }
  await pp.close();
  if (bad.length) throw new Error('paper links that go nowhere: ' + bad.join(', '));
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
