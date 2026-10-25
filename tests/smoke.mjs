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

  /* The auto-rung reads x and y through ONE transform of z = x + iy (autoRungReconstructXY),
     where it used to take two single-channel ones. The reconstruction is linear, the top mode's
     mirror is written so it stays so, and the two must agree to rounding at every rung the
     ladder tries; a shape's own answer must not move either (a circle settles on the floor). */
  await step('auto-rung: one transform for x and y', async () => {
    const r = await page.evaluate(() => {
      let seed = 11;
      const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
      let worst = 0;
      for (const N of [256, 512, 1024, 2048]) {
        const x = new Float64Array(N), y = new Float64Array(N);
        for (let k = 0; k < N; k++) { x[k] = R(); y[k] = R(); }
        worst = Math.max(worst, window.__autoRung.packedGap(x, y, 2048));
      }
      const n = 400, cx = new Float64Array(n + 1), cy = new Float64Array(n + 1);
      for (let i = 0; i <= n; i++) { cx[i] = 0.5 * Math.cos(2 * Math.PI * i / n); cy[i] = 0.5 * Math.sin(2 * Math.PI * i / n); }
      const sol = window.__autoRung.solve({ refX: cx, refY: cy, dirty: false }, undefined, 400);
      return { worst, rung: sol && sol.rung, reason: sol && sol.reason };
    });
    if (!(r.worst < 1e-12)) throw new Error('one transform and two differ by ' + r.worst);
    if (r.rung !== 8 || r.reason !== 'resolved') throw new Error(`a circle settled at rung ${r.rung} (${r.reason}), not 8`);
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

/* CONVERT ON TOUCH (draw.html). A crowded import, 150 shapes or more, is held as it arrived
   and each shape is turned into leaves the first time something needs them. Checked on a page
   of its own, with every CDN blocked, because the importer must not need one (the path-data
   polyfill is inlined; without it a 200-path file took 40 s): 300 shapes load held; clicking
   the one in the middle converts that one and no other; the autosave keeps the rest held, and
   a reload brings them back held; the rung worker answers for all 300 exactly as the page would,
   and a converted shape takes its answer; select-all and the SVG export keep them held, and the export
   writes all 300; turning and resizing the selection keeps them held, and a turned shape converts
   where it was drawn. Clicking reaches every shape through the hit test, so a pass
   that reads every shape's leaves shows up here as the count dropping to 0. */
current = 'crowded import';
{
  const cp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  cp.on('pageerror', e => failures.push(`[crowded import] ${e.message}`));
  await cp.route(/jsdelivr|cdnjs|unpkg|fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    await cp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await cp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    if (!(await cp.evaluate(() => typeof SVGPathElement.prototype.getPathData === 'function')))
      throw new Error('no getPathData with the CDNs blocked');
    // 299 small curved blobs on a grid round the middle, and one disc in the middle, drawn last
    // so it is the topmost shape under a click there.
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">';
    for (let i = 0, n = 0; n < 299; i++) {
      const cx = 25 + 50 * (i % 20), cy = 25 + 50 * Math.floor(i / 20);
      if (Math.hypot(cx - 500, cy - 500) < 160) continue;
      let d = `M${cx + 15},${cy}`;
      for (let k = 1; k <= 6; k++) {
        const a = k * Math.PI / 3, b = (k - 0.5) * Math.PI / 3;
        d += ` Q${(cx + 21 * Math.cos(b)).toFixed(2)},${(cy + 21 * Math.sin(b)).toFixed(2)} ${(cx + 15 * Math.cos(a)).toFixed(2)},${(cy + 15 * Math.sin(a)).toFixed(2)}`;
      }
      svg += `<path d="${d}Z" fill="hsl(${n % 360},60%,50%)"/>`;
      n++;
    }
    svg += '<circle cx="500" cy="500" r="120" fill="#c84"/></svg>';
    await cp.setInputFiles('#fLoad', { name: 'crowd.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
    await cp.waitForFunction(() => window.__lazy && window.__lazy.held() === 300, null, { timeout: 30000 });
    const status = await cp.evaluate(() => document.getElementById('status').textContent);
    if (!/300 as imported/.test(status)) throw new Error('status: ' + status);
    // The rung worker answers for every held shape in the background, and each answer is the
    // one the page computes itself from the same outline. Then clicking a shape uses its answer.
    await cp.waitForFunction(() => window.__lazy.solvedAhead >= 300, null, { timeout: 60000 });
    const ahead = await cp.evaluate(() => window.__lazy.checkAhead());
    if (ahead.n !== 300 || ahead.differ !== 0) throw new Error(`rung worker: ${ahead.differ} of ${ahead.n} answers differ from the page's own`);
    const box = await cp.locator('#cv').boundingBox();
    await cp.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await cp.waitForTimeout(600);
    const held = await cp.evaluate(() => window.__lazy.held());
    if (held !== 299) throw new Error(`clicking one shape left ${held} of 300 held, not 299`);
    if (!(await cp.evaluate(() => window.__lazy.presolved))) throw new Error('the clicked shape did not take the worker\'s answer');
    await cp.waitForFunction(() => ((localStorage.getItem('tangent.scene.v1') || '').match(/"lz":1/g) || []).length === 299,
                             null, { timeout: 15000 });
    await cp.reload({ waitUntil: 'load' });
    await cp.waitForFunction(() => window.__lazy && window.__lazy.held() === 299, null, { timeout: 30000 });
    // Whole-page actions leave held shapes held: select-all draws their halos from the
    // outlines, and the SVG export writes them from the outlines too.
    await cp.mouse.click(box.x + 5, box.y + box.height - 5);
    await cp.keyboard.press('ControlOrMeta+a');
    await cp.waitForTimeout(600);
    const heldAll = await cp.evaluate(() => window.__lazy.held());
    if (heldAll !== 299) throw new Error(`select-all left ${heldAll} of 299 held`);
    const [dl] = await Promise.all([cp.waitForEvent('download', { timeout: 30000 }),
      cp.evaluate(() => document.getElementById('bExportSvg').click())]);
    const out = await readFile(await dl.path(), 'utf8');
    const npaths = (out.match(/<path /g) || []).length;
    if (npaths !== 300) throw new Error(`the export wrote ${npaths} paths, not 300`);
    const heldExp = await cp.evaluate(() => window.__lazy.held());
    if (heldExp !== 299) throw new Error(`exporting left ${heldExp} of 299 held`);
    // Turning and resizing a held selection (the , and ] keys, the same calls the box's grips
    // make) keeps it held, and a shape converted afterwards lands where it was drawn.
    for (const k of [',', ',', ']']) await cp.keyboard.press(k);
    await cp.waitForTimeout(300);
    const heldXf = await cp.evaluate(() => window.__lazy.held());
    if (heldXf !== 299) throw new Error(`turning and resizing left ${heldXf} of 299 held`);
    const cm = await cp.evaluate(() => window.__lazy.convertMoved());
    if (!cm) throw new Error('no held shape was turned');
    const span = Math.max(cm.held[2] - cm.held[0], cm.held[3] - cm.held[1]);
    const off = Math.max(...cm.held.map((v, i) => Math.abs(v - cm.leaves[i])));
    if (!(off < 0.05 * span)) throw new Error(`a turned shape converted ${off} off its held box (span ${span})`);
  } catch (e){
    failures.push(`[crowded import] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} crowded import converts on touch`);
  await cp.close();
}

/* The group button lives in the panel under the selection (BOX_BUTTONS 'bt-group'), no longer
   beside the rotate grip, and the menu's "selection panel" switch (#tSelPanel) puts the panel away
   and brings it back; a double-click on a shape no longer does. Three shapes, all selected: the
   button is in the panel's row and pressing it groups them; a double-click leaves the panel up;
   the switch hides it and shows it again. And the selected tile in the shape browser is opaque
   (its gold wash lies on the chip's fill), so it reads over any drawing behind the strip. */
current = 'panel: group button and menu switch';
{
  const gp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  gp.on('pageerror', e => failures.push(`[panel] ${e.message}`));
  await gp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    await gp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await gp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><circle cx="50" cy="50" r="40" fill="#c84"/>'
      + '<rect x="110" y="10" width="80" height="80" fill="#48c"/><circle cx="250" cy="50" r="40" fill="#4c8"/></svg>';
    await gp.setInputFiles('#fLoad', { name: 'three.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
    await gp.waitForTimeout(1500);
    const box = await gp.locator('#cv').boundingBox();
    await gp.mouse.click(box.x + 20, box.y + box.height - 20);
    await gp.keyboard.press('ControlOrMeta+a');
    await gp.waitForTimeout(600);
    const g = await gp.evaluate(() => window.__box.group());
    if (!g) throw new Error('no group button in the panel with three shapes selected');
    await gp.mouse.click(box.x + g.cx, box.y + g.cy);
    await gp.waitForTimeout(400);
    if (!(await gp.evaluate(() => window.__box.grouped()))) throw new Error('the panel button did not group the selection');
    const mid = [box.x + box.width / 2, box.y + box.height / 2];
    await gp.mouse.dblclick(...mid);
    await gp.waitForTimeout(400);
    if (!(await gp.evaluate(() => window.__box.panelUp()))) throw new Error('a double-click on the shape put the panel away');
    const flip = () => gp.evaluate(() => { const t = document.getElementById('tSelPanel'); t.checked = !t.checked; t.dispatchEvent(new Event('change')); });
    await flip();
    await gp.waitForTimeout(300);
    if (await gp.evaluate(() => window.__box.panelUp())) throw new Error('the menu switch left the panel up');
    await flip();
    await gp.waitForTimeout(300);
    if (!(await gp.evaluate(() => window.__box.panelUp()))) throw new Error('the menu switch did not bring the panel back');
    const tileBg = await gp.evaluate(() => { const t = document.querySelector('.shape-tile.active'); return t ? getComputedStyle(t).backgroundColor : 'no active tile'; });
    if (!/^rgb\(/.test(tileBg)) throw new Error('the selected tile is see-through: ' + tileBg);
  } catch (e){
    failures.push(`[panel] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} panel: group button and menu switch`);
  await gp.close();
}

/* SVG AS EXACT SHAPES (draw.html). An SVG opened arrives as exact shapes: a compound path's
   inner ring a hole (its curve kept: the drawn hole is larger than its corners' polygon), a
   circle as four curve edges, an open stroked path open with its one curve. With the menu's
   switch off it arrives as leaves, as before. The menu's "exact shapes: how to" opens the help
   sheet, and Escape puts it away. */
current = 'svg as exact shapes';
{
  const sp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  sp.on('pageerror', e => failures.push(`[svg exact] ${e.message}`));
  await sp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    await sp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await sp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100">'
      + '<path fill="#c84" fill-rule="evenodd" d="M10 10 H90 V90 H10 Z M30 30 C30 20 70 20 70 30 L70 70 L30 70 Z"/>'
      + '<circle cx="150" cy="50" r="40" fill="#48c"/>'
      + '<path fill="none" stroke="#000" d="M200 80 C220 10 260 10 280 80"/></svg>';
    const open = async name => {
      await sp.setInputFiles('#fLoad', { name, mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
      await sp.waitForTimeout(1500);
      await sp.keyboard.press('ControlOrMeta+a');
      await sp.waitForTimeout(300);
      return sp.evaluate(() => window.__box.shapes());
    };
    const got = await open('ring.svg');
    if (got.length !== 3 || got.some(g => !g || !g.exact)) throw new Error('not three exact shapes: ' + JSON.stringify(got.map(g => g && g.exact)));
    const [frame, disc, arch] = got;
    if (frame.holes.length !== 1 || frame.holes[0].n !== 4) throw new Error('the compound path has no four-corner hole');
    const holeDrawn = frame.area - frame.drawn;
    if (!(holeDrawn > frame.holes[0].area * 1.05)) throw new Error('the hole lost its curve: drawn ' + holeDrawn + ' against corners ' + frame.holes[0].area);
    if (disc.curves !== 4 || !disc.smooth) throw new Error('the circle is not four smooth curve edges: ' + JSON.stringify(disc));
    if (!arch.open || arch.curves !== 1) throw new Error('the stroked path is not open with one curve: ' + JSON.stringify(arch));
    await sp.evaluate(() => { const t = document.getElementById('tSvgExact'); t.checked = false; t.dispatchEvent(new Event('change')); });
    const off = await open('ring2.svg');
    if (off.some(g => g && g.exact)) throw new Error('with the switch off the SVG still arrived exact');
    await sp.evaluate(() => document.getElementById('bExactHelp').click());
    await sp.waitForTimeout(300);
    if (!(await sp.evaluate(() => document.getElementById('exactHelpPop').classList.contains('open')))) throw new Error('the help sheet did not open');
    await sp.keyboard.press('Escape');
    await sp.waitForTimeout(200);
    if (await sp.evaluate(() => document.getElementById('exactHelpPop').classList.contains('open'))) throw new Error('Escape left the help sheet open');
    // a hole of two curves (as an SVG's half-turns arrive) goes out to a .tvf and comes back
    await sp.evaluate(() => { const t = document.getElementById('tSvgExact'); t.checked = true; t.dispatchEvent(new Event('change')); });
    const donut = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill-rule="evenodd" fill="#48c" d="M10 50 C10 0 90 0 90 50 C90 100 10 100 10 50 Z M35 50 C35 30 65 30 65 50 C65 70 35 70 35 50 Z"/></svg>';
    await sp.setInputFiles('#fLoad', { name: 'donut.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(donut) });
    await sp.waitForTimeout(1200);
    await sp.keyboard.press('ControlOrMeta+a'); await sp.waitForTimeout(300);
    const d0 = await sp.evaluate(() => window.__box.shapes());
    if (d0.length !== 1 || d0[0].holes.length !== 1 || d0[0].holes[0].n !== 2) throw new Error('the donut did not arrive with its two-curve hole: ' + JSON.stringify(d0));
    const [dl] = await Promise.all([sp.waitForEvent('download', { timeout: 30000 }), sp.evaluate(() => document.getElementById('bSaveTvf').click())]);
    await sp.setInputFiles('#fLoadTvf', { name: 'donut.tvf', mimeType: 'text/plain', buffer: await readFile(await dl.path()) });
    await sp.waitForTimeout(1000);
    await sp.keyboard.press('ControlOrMeta+a'); await sp.waitForTimeout(300);
    const d1 = await sp.evaluate(() => window.__box.shapes());
    if (d1.length !== 1 || !d1[0].exact || d1[0].holes.length !== 1) throw new Error('the two-curve hole was lost on the way through a .tvf: ' + JSON.stringify(d1));
  } catch (e){
    failures.push(`[svg exact] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} svg as exact shapes, and the help sheet`);
  await sp.close();
}

/* THE TIMELINE AND RECORDING A LOOP (draw.html). Three shapes morphed live: their keys' places as
   ticks on the track, a step to the next key landing on it exactly (the live shape is that key), a key
   made from the pose between two keys (the pose unchanged, four ticks), a key taken away, onion skins
   and the loop's length; then one loop recorded as a .gif (parsed: a frame for every step of a 2 s loop
   at 20 a second, looping) and, where the browser records, a .webm. Then the timeline is saved: a
   reload brings it back, and exit after it the three shapes. Then detail effects on one shape gone
   live: shimmer moving the edge and not the centroid, its loop meeting at its ends, grow starting from
   the base ellipse, and the effect saved. */
current = 'timeline and recording';
{
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[timeline] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    await mp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await mp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    await mp.evaluate(() => { const t = document.getElementById('tSvgExact'); t.checked = false; t.dispatchEvent(new Event('change')); });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><circle cx="50" cy="50" r="40" fill="#c84"/>'
      + '<rect x="110" y="10" width="80" height="80" fill="#48c"/><polygon points="250,10 290,90 210,90" fill="#4c8"/></svg>';
    await mp.setInputFiles('#fLoad', { name: 'three.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
    await mp.waitForTimeout(1200);
    await mp.keyboard.press('ControlOrMeta+a'); await mp.waitForTimeout(300);
    await mp.evaluate(() => { document.getElementById('bMorphOpen').click(); document.getElementById('bMorphLive').click(); });
    await mp.waitForTimeout(400);
    const m = () => mp.evaluate(() => window.__box.morph());
    let s = await m();
    if (!s || s.K !== 3 || s.ticks.join() !== '167,500,833') throw new Error('no live morph with three keys ticked on the track: ' + JSON.stringify(s && { K: s.K, ticks: s.ticks }));
    await mp.click('#bMorphNextKey'); await mp.click('#bMorphNextKey');
    s = await m();
    const key1 = await mp.evaluate(() => window.__box.morphKey(1).x);
    if (Math.abs(s.t - 0.5) > 1e-9 || Math.max(...s.leaves.map((v, i) => Math.abs(v - key1[i]))) > 1e-9) throw new Error('stepping to a key did not land on it exactly: t ' + s.t);
    await mp.evaluate(() => { const r = document.getElementById('morphT'); r.value = 600; r.dispatchEvent(new Event('input')); });
    const pose = (await m()).leaves;
    await mp.click('#bMorphAddKey');
    s = await m();
    if (s.K !== 4 || s.ticks.length !== 4 || Math.max(...s.leaves.map((v, i) => Math.abs(v - pose[i]))) > 1e-9) throw new Error('+ key did not keep the pose as a fourth key: K ' + s.K);
    await mp.click('#bMorphDelKey');
    if ((await m()).K !== 3) throw new Error('− key did not take a key away');
    await mp.evaluate(() => { const c = document.getElementById('tMorphOnion'); c.checked = true; c.dispatchEvent(new Event('change'));
      const l = document.getElementById('morphLoop'); l.value = 2; l.dispatchEvent(new Event('change')); });
    if (Math.abs((await m()).loop - 2) > 1e-9) throw new Error('the loop length did not take');
    const [dg] = await Promise.all([mp.waitForEvent('download', { timeout: 60000 }), mp.evaluate(() => window.__box.recordGif())]);
    const gif = await readFile(await dg.path());
    // walk the GIF's blocks: the header and global table, then extensions and images to the trailer
    let p = 13 + 768, frames = 0, loops = false;
    if (gif.toString('latin1', 0, 6) !== 'GIF89a') throw new Error('the recording is not a GIF');
    while (p < gif.length && gif[p] !== 0x3B) {
      if (gif[p] === 0x21) { if (gif.toString('latin1', p + 3, p + 14) === 'NETSCAPE2.0') loops = true; p += 2; while (gif[p]) p += gif[p] + 1; p++; }
      else if (gif[p] === 0x2C) { frames++; p += 10 + 1; while (gif[p]) p += gif[p] + 1; p++; }
      else throw new Error('the GIF has a stray byte at ' + p);
    }
    if (frames !== 40 || !loops || gif[p] !== 0x3B) throw new Error('the GIF holds ' + frames + ' frames (looping ' + loops + '), not one 2 s loop at 20 a second');
    if (await mp.evaluate(() => typeof MediaRecorder !== 'undefined')) {
      const [dv] = await Promise.all([mp.waitForEvent('download', { timeout: 60000 }), mp.evaluate(() => window.__box.recordVideo())]);
      const vid = await readFile(await dv.path());
      if (vid.length < 1000 || vid.readUInt32BE(0) !== 0x1A45DFA3) throw new Error('the video is not a webm: ' + vid.length + ' bytes');
    }
    if (!(await m())) throw new Error('recording ended the morph');
    // THE TIMELINE IS SAVED: a reload brings the morph back, its keys, place, loop and onion, and exit
    // still puts the original three shapes back
    await mp.evaluate(() => { const r = document.getElementById('morphT'); r.value = 600; r.dispatchEvent(new Event('input')); });
    await mp.click('#bMorphAddKey');
    const kept = await m();
    await mp.waitForTimeout(1200);
    await mp.reload(); await mp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 }); await mp.waitForTimeout(500);
    const back = await m();
    if (!back || back.K !== kept.K || Math.abs(back.t - kept.t) > 1e-9 || Math.abs(back.loop - 2) > 1e-9 || !(await mp.evaluate(() => document.getElementById('tMorphOnion').checked)))
      throw new Error('the morph did not come back from a reload: ' + JSON.stringify(back && { K: back.K, t: back.t, loop: back.loop }));
    if (Math.max(...back.leaves.map((v, i) => Math.abs(v - kept.leaves[i]))) > 1e-5) throw new Error('the morph came back in another pose');
    await mp.click('#bMorphExit'); await mp.waitForTimeout(300);
    if ((await mp.evaluate(() => window.__box.count())) !== 3) throw new Error('exit after a reload did not put the three shapes back');
    // DETAIL EFFECTS: one shape goes live as a still; shimmer moves its edge and not its centroid, the
    // loop's ends meet, grow at full amount starts from the base ellipse, and the effect is saved
    await mp.keyboard.press('ControlOrMeta+a'); await mp.waitForTimeout(200);
    await mp.evaluate(() => { const s = window.__box; s.select && s.select([2]); });   // the triangle: a circle has no detail to move
    await mp.evaluate(() => { document.getElementById('bMorphOpen').click(); document.getElementById('bMorphLive').click(); });
    await mp.waitForTimeout(300);
    const still = await m();
    if (!still || still.K !== 1) throw new Error('one shape did not go live as a still: ' + JSON.stringify(still && still.K));
    const at = async t => { await mp.evaluate(t => { const r = document.getElementById('morphT'); r.value = Math.round(t * 1000); r.dispatchEvent(new Event('input')); }, t); return (await m()).leaves; };
    await mp.selectOption('#morphFx', 'shimmer');
    const a0 = await at(0), a1 = await at(1), a3 = await at(0.3);
    const mean = v => v.reduce((x, y) => x + y, 0) / v.length;
    if (Math.max(...a0.map((v, i) => Math.abs(v - a1[i]))) > 1e-9) throw new Error('the shimmer loop does not meet at its ends');
    if (!(Math.max(...a3.map((v, i) => Math.abs(v - a0[i]))) > 1e-4) || Math.abs(mean(a3) - mean(still.leaves)) > 1e-9) throw new Error('shimmer did not move the edge, or moved the centroid');
    await mp.selectOption('#morphFx', 'grow');
    await mp.evaluate(() => { const a = document.getElementById('morphFxAmt'); a.value = 100; a.dispatchEvent(new Event('input')); });
    const g0 = await at(0), g5 = await at(0.5);
    const rough = v => { let s = 0; for (let i = 0; i < v.length; i++) { const d = v[(i + 1) % v.length] - 2 * v[i] + v[(i + v.length - 1) % v.length]; s += d * d; } return s; };
    if (!(rough(g0) < rough(g5) / 20)) throw new Error('grow did not start from the base ellipse: ' + rough(g0) + ' against ' + rough(g5));
    await mp.waitForTimeout(1200);
    await mp.reload(); await mp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 }); await mp.waitForTimeout(500);
    if ((await mp.evaluate(() => document.getElementById('morphFx').value)) !== 'grow') throw new Error('the effect was not saved with the morph');
  } catch (e){
    failures.push(`[timeline] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} timeline and recording a loop`);
  await mp.close();
}

/* EXACT SHAPES (draw.html). The line pen's polygons and lines stay exact: corners sharp,
   edges straight, never leaves until asked. A triangle closed on its start point and a line of
   two points finished by a double-click; both held exact through a click and a drag of a
   corner; the SVG export writes them as straight segments (the triangle closed, the line open);
   "to leaves" turns the triangle into leaves and undo brings the exact one back. */
current = 'exact shapes';
{
  const xp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  xp.on('pageerror', e => failures.push(`[exact shapes] ${e.message}`));
  await xp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    await xp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await xp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    const box = await xp.locator('#cv').boundingBox();
    const P = (x, y) => [box.x + x, box.y + y];
    const held = () => xp.evaluate(() => window.__lazy.held());
    const svgPaths = async () => {
      const [dl] = await Promise.all([xp.waitForEvent('download', { timeout: 30000 }),
        xp.evaluate(() => document.getElementById('bExportSvg').click())]);
      return (await readFile(await dl.path(), 'utf8')).match(/<path d="M[\d. ]+L[^"]*"/g) || [];
    };
    await xp.click('#bDrawLine');
    for (const [x, y] of [[100, 600], [300, 600], [200, 450]]) await xp.mouse.click(...P(x, y));
    await xp.mouse.click(...P(101, 601)); // the start point again closes it
    await xp.click('#bDrawLine');
    await xp.mouse.click(...P(500, 650));
    await xp.mouse.dblclick(...P(800, 500));
    await xp.waitForTimeout(300);
    if ((await held()) !== 2) throw new Error(`drew 2 exact shapes, ${await held()} held`);
    let paths = await svgPaths();
    const tri = paths.find(d => /Z"$/.test(d)), line = paths.find(d => !/Z"$/.test(d));
    if (!tri || tri.split('L').length !== 3) throw new Error('the triangle did not export as three straight sides: ' + tri);
    if (!line || line.split('L').length !== 2) throw new Error('the line did not export as one open segment: ' + line);
    await xp.mouse.click(...P(200, 560)); // select the triangle
    await xp.waitForTimeout(300);
    const status = await xp.evaluate(() => document.getElementById('status').textContent);
    if (!/exact polygon, 3 points/.test(status)) throw new Error('status: ' + status.slice(0, 120));
    await xp.mouse.move(...P(200, 450)); // its apex
    await xp.mouse.down();
    await xp.mouse.move(...P(260, 380), { steps: 6 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    if ((await held()) !== 2) throw new Error('dragging a corner converted the shape');
    paths = await svgPaths();
    const tri2 = paths.find(d => /Z"$/.test(d));
    if (!tri2 || tri2 === tri) throw new Error('dragging the apex did not move it');
    // The mode switch: "exact | leaves", the lit word the selection's mode, a press either way.
    const sw = await xp.evaluate(() => { const b = window.__box.button('bt-mode'); return b && [b.cx, b.cy, b.hw]; });
    if (!sw) throw new Error('no mode switch with an exact shape selected');
    // and nothing over it: the shape browser floats over the bottom of the canvas
    const over = await xp.evaluate(([x, y]) => document.elementFromPoint(x, y).id, P(sw[0], sw[1]));
    if (over !== 'cv') throw new Error('the mode switch is under #' + over);
    if ((await xp.evaluate(() => window.__box.mode())) !== 'exact') throw new Error('the switch does not read exact');
    await xp.mouse.click(...P(sw[0], sw[1]));
    await xp.waitForTimeout(300);
    if ((await held()) !== 1) throw new Error('the switch did not turn the triangle into leaves');
    if ((await xp.evaluate(() => window.__box.mode())) !== 'leaves') throw new Error('the switch does not read leaves');
    await xp.waitForTimeout(1500); // past the flash
    const st2 = await xp.evaluate(() => document.getElementById('status').textContent);
    if (!/leaves, N=/.test(st2)) throw new Error('status after leaves: ' + st2.slice(0, 120));
    const sw2 = await xp.evaluate(() => { const b = window.__box.button('bt-mode'); return b && [b.cx, b.cy]; });
    await xp.mouse.click(...P(sw2[0], sw2[1]));
    await xp.waitForTimeout(300);
    if ((await held()) !== 2) throw new Error('the switch did not turn the leaves back to exact');
    await xp.waitForTimeout(1500);
    const st3 = await xp.evaluate(() => document.getElementById('status').textContent);
    const m3 = /exact polygon, (\d+) points/.exec(st3);
    if (!m3 || +m3[1] < 3 || +m3[1] > 64) throw new Error('leaves back to exact: ' + st3.slice(0, 120));
    await xp.keyboard.press('ControlOrMeta+z');
    await xp.waitForTimeout(300);
    if ((await held()) !== 1) throw new Error('undo did not bring the leaves back');
    await xp.keyboard.press('ControlOrMeta+z');
    await xp.waitForTimeout(300);
    if ((await held()) !== 2) throw new Error('undo did not bring the exact triangle back');
    // With a mirror on, the axes are drawn from the selected shape's box; read off its leaves,
    // that turned an exact shape back into leaves at the first frame.
    await xp.evaluate(() => window._setMirrorMode('both'));
    await xp.waitForTimeout(400);
    if ((await held()) !== 2) throw new Error('a mirror turned the exact shapes into leaves');
    await xp.evaluate(() => window._setMirrorMode('off'));
    // Corners: a ring at an edge's middle adds one, Delete removes the picked one, a double-click
    // another, and a polygon keeps three.
    await xp.mouse.click(...P(200, 560)); // the triangle
    await xp.waitForTimeout(300);
    let cs = await xp.evaluate(() => window.__box.corners());
    if (!cs || cs.pts.length !== 3 || !cs.mids.length) throw new Error('the triangle shows no corners or rings: ' + JSON.stringify(cs));
    await xp.mouse.click(...P(cs.mids[0].x, cs.mids[0].y));
    await xp.waitForTimeout(300);
    cs = await xp.evaluate(() => window.__box.corners());
    if (cs.pts.length !== 4 || cs.picked < 0) throw new Error('tapping a ring did not add a picked corner: ' + cs.pts.length);
    await xp.keyboard.press('Delete');
    await xp.waitForTimeout(300);
    cs = await xp.evaluate(() => window.__box.corners());
    if (!cs || cs.pts.length !== 3) throw new Error('Delete did not remove the picked corner');
    await xp.mouse.dblclick(...P(cs.pts[0].x, cs.pts[0].y));
    await xp.waitForTimeout(300);
    cs = await xp.evaluate(() => window.__box.corners());
    if (!cs || cs.pts.length !== 3) throw new Error('a polygon was let go below three corners');
    // Simplify: on an exact selection the panel's track counts corners. A circle of 48 corners,
    // drawn with the line pen, comes down to a handful and back.
    await xp.keyboard.press('Escape');
    await xp.click('#bDrawLine');
    for (let i = 0; i < 48; i++) await xp.mouse.click(...P(900 + 150 * Math.cos(i * Math.PI / 24), 330 + 150 * Math.sin(i * Math.PI / 24)));
    await xp.mouse.click(...P(1050, 330));
    await xp.waitForTimeout(300);
    await xp.mouse.click(...P(900, 330 + 149));
    await xp.waitForTimeout(300);
    cs = await xp.evaluate(() => window.__box.corners());
    if (!cs || cs.pts.length !== 48) throw new Error('the 48-corner circle: ' + (cs && cs.pts.length));
    const tr = await xp.evaluate(() => window.__box.track());
    if (!tr) throw new Error('no track on the exact circle');
    await xp.mouse.move(...P(tr.ax + 1, tr.y));
    await xp.mouse.down();
    await xp.mouse.move(...P(tr.bx, tr.y), { steps: 6 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    const few = (await xp.evaluate(() => window.__box.corners())).pts.length;
    if (!(few >= 3 && few < 20)) throw new Error('simplifying left ' + few + ' corners of 48');
    const tr2 = await xp.evaluate(() => window.__box.track());
    await xp.mouse.move(...P(tr2.knobX, tr2.y));
    await xp.mouse.down();
    await xp.mouse.move(...P(tr2.ax - 5, tr2.y), { steps: 6 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    if ((await xp.evaluate(() => window.__box.corners())).pts.length !== 48) throw new Error('the track back to the left did not give the 48 corners back');
    if ((await held()) !== 3) throw new Error('simplifying converted a shape: ' + await held() + ' held');
    // Shift snaps the line pen's edges to 45°: a wobbly rectangle comes out square.
    await xp.keyboard.press('Escape');
    await xp.click('#bDrawLine');
    await xp.mouse.click(...P(120, 120));
    await xp.keyboard.down('Shift');
    await xp.mouse.click(...P(380, 131));
    await xp.mouse.click(...P(388, 300));
    await xp.mouse.click(...P(126, 309));
    await xp.keyboard.up('Shift');
    await xp.mouse.click(...P(121, 121));
    await xp.waitForTimeout(300);
    await xp.mouse.click(...P(250, 210));
    await xp.waitForTimeout(300);
    let rc = await xp.evaluate(() => window.__box.corners());
    const q = rc && rc.pts;
    if (!q || q.length !== 4 || Math.abs(q[0].y - q[1].y) > 0.5 || Math.abs(q[1].x - q[2].x) > 0.5 || Math.abs(q[2].y - q[3].y) > 0.5)
      throw new Error('Shift did not snap the edges: ' + JSON.stringify(q && q.map(p => [Math.round(p.x), Math.round(p.y)])));
    // A mirror moves a corner's partner with it.
    await xp.evaluate(() => window._setMirrorMode('v'));
    await xp.waitForTimeout(200);
    rc = await xp.evaluate(() => window.__box.corners());
    const c0 = rc.pts[0], c1 = rc.pts[1];
    await xp.mouse.move(...P(c1.x, c1.y));
    await xp.mouse.down();
    await xp.mouse.move(...P(c1.x + 20, c1.y - 20), { steps: 4 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    rc = await xp.evaluate(() => window.__box.corners());
    if (Math.abs(rc.pts[0].x - (c0.x - 20)) > 1 || Math.abs(rc.pts[0].y - (c0.y - 20)) > 1)
      throw new Error('the mirrored partner did not follow: ' + JSON.stringify([c0, rc.pts[0]]));
    await xp.evaluate(() => window._setMirrorMode('off'));
    // A picked corner's handle rounds it: one corner, a radius, an arc in the SVG, and the
    // shape still exact.
    rc = await xp.evaluate(() => window.__box.corners());
    await xp.mouse.click(...P(rc.pts[2].x, rc.pts[2].y));
    await xp.waitForTimeout(300);
    rc = await xp.evaluate(() => window.__box.corners());
    if (!rc.handle) throw new Error('no round handle on a picked corner');
    await xp.mouse.move(...P(rc.handle.x, rc.handle.y));
    await xp.mouse.down();
    await xp.mouse.move(...P(rc.handle.x - 25, rc.handle.y - 25), { steps: 5 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    rc = await xp.evaluate(() => window.__box.corners());
    if (!rc.round || !(rc.round[2] > 0) || rc.pts.length !== 4) throw new Error('the corner did not round: ' + JSON.stringify(rc.round));
    if (!(await svgPaths()).some(d => / A[\d.]+ [\d.]+ 0 0 [01] /.test(d))) throw new Error('the rounded corner was not exported as an arc');
    if ((await held()) !== 4) throw new Error('rounding converted a shape: ' + await held() + ' held');
    // The shape tool: a rounded rectangle in one drag, exact, its corners arcs.
    await xp.keyboard.press('Escape');
    await xp.click('#bDrawShape');
    if (!(await xp.evaluate(() => document.getElementById('shapeTool').classList.contains('open')))) throw new Error('the shape tool strip did not open');
    await xp.locator('#stRound').fill('0.3');
    await xp.mouse.move(...P(1000, 560));
    await xp.mouse.down();
    await xp.mouse.move(...P(1200, 700), { steps: 6 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    if ((await held()) !== 5) throw new Error('the shape tool did not make an exact shape: ' + await held() + ' held');
    if ((await svgPaths()).filter(d => / A[\d.]+ [\d.]+ 0 0 [01] /.test(d)).length < 2) throw new Error('the rounded rectangle has no arcs in the svg');
    // A .tvf keeps them exact: saved with their corners beside the leaves, and loaded back exact.
    const [tdl] = await Promise.all([xp.waitForEvent('download', { timeout: 30000 }), xp.evaluate(() => document.getElementById('bSaveTvf').click())]);
    const tvfText = await readFile(await tdl.path(), 'utf8');
    if ((tvfText.match(/#meta exact:/g) || []).length !== 5 || !/#meta radii:/.test(tvfText)) throw new Error('the .tvf does not carry the exact shapes');
    if ((await held()) !== 5) throw new Error('saving a .tvf converted a shape');
    const arcsBefore = (await svgPaths()).join('|');
    await xp.setInputFiles('#fLoadTvf', { name: 'exact.tvf', mimeType: 'text/plain', buffer: Buffer.from(tvfText) });
    await xp.waitForTimeout(800);
    if ((await held()) !== 5) throw new Error('the .tvf did not load back exact: ' + await held() + ' held');
    const arcsAfter = (await svgPaths()).join('|');
    if (arcsAfter !== arcsBefore) { console.log('BEFORE', arcsBefore); console.log('AFTER ', arcsAfter); throw new Error('the exact shapes moved or changed on the way through a .tvf'); }
    // The leaves' check (TVF §2.9): each exact shape carries its leaves' sums. Leaves written
    // again at 6 digits by another tool still match, and the shapes come back exact; one leaf
    // moved by 0.05 (an edit made elsewhere) does not, and that shape comes back as its leaves.
    if ((tvfText.match(/#meta leafsum:/g) || []).length !== 5) throw new Error('the .tvf does not carry the leaves\' sums');
    const tvfLines = tvfText.split('\n');
    const isRow = t => /^-?\d+ -?[\d.]/.test(t);
    const sixDigits = tvfLines.map(t => isRow(t) ? t.split(' ').map((w, k) => k ? String(+(+w).toPrecision(6)) : w).join(' ') : t).join('\n');
    await xp.setInputFiles('#fLoadTvf', { name: 'six.tvf', mimeType: 'text/plain', buffer: Buffer.from(sixDigits) });
    await xp.waitForTimeout(800);
    if ((await held()) !== 5) throw new Error('leaves written at 6 digits failed the leaves\' check: ' + await held() + ' held');
    const firstRow = tvfLines.findIndex((t, k) => isRow(t) && tvfLines.slice(0, k).some(u => u.startsWith('#meta leafsum:')));
    const edited = tvfLines.slice();
    edited[firstRow] = edited[firstRow].split(' ').map((w, k) => k === 3 ? String(+w + 0.05) : w).join(' ');
    await xp.setInputFiles('#fLoadTvf', { name: 'edited.tvf', mimeType: 'text/plain', buffer: Buffer.from(edited.join('\n')) });
    await xp.waitForTimeout(800);
    if ((await held()) !== 4) throw new Error('a shape whose leaves were edited elsewhere still came back exact: ' + await held() + ' held');
    if (!/edited elsewhere/.test(await xp.evaluate(() => document.getElementById('status').textContent))) throw new Error('the status line did not say a shape was edited elsewhere');
    await xp.setInputFiles('#fLoadTvf', { name: 'exact.tvf', mimeType: 'text/plain', buffer: Buffer.from(tvfText) });
    await xp.waitForTimeout(800);
    // The pencil keeps a stroke's straight runs: a hand-drawn square comes out exact with four
    // sharp corners; a circle still comes out as leaves.
    const pencil = async pts => {
      await xp.click('#bDraw');
      await xp.mouse.move(...P(...pts[0]));
      await xp.mouse.down();
      for (const p of pts.slice(1)) await xp.mouse.move(...P(...p));
      await xp.mouse.up();
      await xp.waitForTimeout(300);
    };
    let wob = 1;
    const jit = () => ((wob = (wob * 16807) % 2147483647) / 2147483647 - 0.5) * 1.2;
    const side = (a, b, n) => Array.from({ length: n }, (_, i) => [a[0] + (b[0] - a[0]) * i / n + jit(), a[1] + (b[1] - a[1]) * i / n + jit()]);
    const h0 = await held();
    await pencil(Array.from({ length: 90 }, (_, i) => [1150 + 55 * Math.cos(i * Math.PI / 45), 150 + 55 * Math.sin(i * Math.PI / 45)]));
    if ((await held()) !== h0) throw new Error('a pencil circle came out exact');
    await pencil([...side([480, 130], [680, 130], 30), ...side([680, 130], [680, 300], 30), ...side([680, 300], [480, 300], 30), ...side([480, 300], [480, 132], 30)]);
    if ((await held()) !== h0 + 1) throw new Error('a pencil square did not come out exact');
    await xp.mouse.click(...P(580, 215));
    await xp.waitForTimeout(300);
    let pc = await xp.evaluate(() => window.__box.corners());
    if (!pc || pc.pts.length !== 4 || pc.smooth) throw new Error('the pencil square: ' + JSON.stringify(pc && pc.pts.map(p => [Math.round(p.x), Math.round(p.y)])));
    // A corner snaps exactly onto an edge's middle (SNAPPING POINTS).
    const mid = { x: (pc.pts[0].x + pc.pts[1].x) / 2, y: (pc.pts[0].y + pc.pts[1].y) / 2 };
    await xp.mouse.move(...P(pc.pts[2].x, pc.pts[2].y));
    await xp.mouse.down();
    await xp.mouse.move(...P(mid.x + 3, mid.y + 2), { steps: 5 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    pc = await xp.evaluate(() => window.__box.corners());
    if (Math.hypot(pc.pts[2].x - mid.x, pc.pts[2].y - mid.y) > 0.01) throw new Error('the corner did not snap onto the edge middle: ' + JSON.stringify([pc.pts[2], mid]));
    await xp.keyboard.press('ControlOrMeta+z');
    await xp.waitForTimeout(300);
    // The picked corner's box: a typed x moves it; "smooth" curves the outline through it.
    pc = await xp.evaluate(() => window.__box.corners());
    await xp.mouse.click(...P(pc.pts[0].x, pc.pts[0].y));
    await xp.waitForTimeout(300);
    if (!(await xp.evaluate(() => document.getElementById('cornerEdit').classList.contains('open')))) throw new Error('no box beside a picked corner');
    const x0 = +(await xp.inputValue('#ceX'));
    await xp.fill('#ceX', String(x0 + 0.05));
    await xp.press('#ceX', 'Enter');
    await xp.waitForTimeout(300);
    if (Math.abs(+(await xp.inputValue('#ceX')) - (x0 + 0.05)) > 1e-6) throw new Error('typing x did not move the corner');
    await xp.click('#ceSmooth');
    await xp.waitForTimeout(300);
    pc = await xp.evaluate(() => window.__box.corners());
    if (!pc.smooth || !pc.smooth[0]) throw new Error('"smooth" did not make the corner smooth');
    {
      const [sdl] = await Promise.all([xp.waitForEvent('download', { timeout: 30000 }), xp.evaluate(() => document.getElementById('bExportSvg').click())]);
      const all = (await readFile(await sdl.path(), 'utf8')).match(/<path d="[^"]*"/g) || [];
      // the square's path: four corners, one of them smooth, so cubics (C) beside straight lines (L)
      if (!all.some(d => / C[\d.-]+ /.test(d) && / L[\d.-]+ /.test(d))) throw new Error('a smooth corner was not exported as a curve');
    }
    // Leaves to exact with few corners: a square of leaves comes back as its four corners.
    await xp.keyboard.press('Escape');
    await xp.click('#bShapes');
    await xp.click('#shapeGrid .shape-pick[data-shape="square"]');
    await xp.waitForTimeout(400);
    const sqSw = await xp.evaluate(() => { const b = window.__box.button('bt-mode'); return b && [b.cx, b.cy]; });
    if (!sqSw) throw new Error('no mode switch on the added square');
    await xp.mouse.click(...P(sqSw[0], sqSw[1]));
    await xp.waitForTimeout(400);
    const sqc = await xp.evaluate(() => window.__box.corners());
    if (!sqc || sqc.pts.length !== 4 || sqc.smooth) throw new Error('a square of leaves made exact: ' + (sqc ? sqc.pts.length + ' corners' : 'not exact'));
    // ...and a circle of leaves as a handful of smooth corners: smooth corners on a circle draw
    // the circle (edgeCtrl), so few are needed.
    await xp.click('#bShapes');
    await xp.click('#shapeGrid .shape-pick[data-shape="circle"]');
    await xp.waitForTimeout(400);
    const ciSw = await xp.evaluate(() => { const b = window.__box.button('bt-mode'); return b && [b.cx, b.cy]; });
    await xp.mouse.click(...P(ciSw[0], ciSw[1]));
    await xp.waitForTimeout(400);
    const cic = await xp.evaluate(() => window.__box.corners());
    if (!cic || cic.pts.length > 8 || !cic.smooth || cic.smooth.some(v => !v)) throw new Error('a circle of leaves made exact: ' + (cic ? cic.pts.length + ' corners' : 'not exact'));
  } catch (e){
    failures.push(`[exact shapes] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} exact shapes: polygons and lines`);
  await xp.close();
}

/* Combining exact shapes, their line style, and push and pull. Two overlapping squares drawn
   with the shape tool: union, subtract and intersect each give one exact shape of the right area
   (exact: its corners are the squares' own and their crossings), undo brings the two back; a
   square subtracted from inside another leaves one shape with a hole, which the SVG, a .tvf and
   copy and paste all keep; two apart have nothing in common. A dashed outline exports with a dash array and an open line's arrowheads as filled
   paths. Pressing a square's edge and pulling puts a smooth bump in it. Offset: the square grown
   by a distance with round joins keeps four corners rounded by that distance, shrunk keeps four
   sharp ones, outlined is a frame. A click in a frame's hole selects nothing; aligning goes by the
   outline as drawn (round corners included); a word made exact is a shape a letter with its
   counters as holes (read from the font where it can be fetched). A hole's corners drag, add and
   remove like the outline's. The knife cuts a frame in two; the corner strip rounds, smooths and
   sharpens every corner at once. Curve edges survive a cut, a split and a .tvf; the pen draws
   curves and a smooth corner's handles stay in line. */
current = 'combining exact shapes';
{
  const xp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  xp.on('pageerror', e => failures.push(`[combining exact shapes] ${e.message}`));
  await xp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    await xp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await xp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    const box = await xp.locator('#cv').boundingBox();
    const P = (x, y) => [box.x + x, box.y + y];
    const status = () => xp.evaluate(() => document.getElementById('status').textContent);
    const fresh = async () => {
      await xp.mouse.click(...P(20, 780));
      await xp.keyboard.press('ControlOrMeta+a');
      await xp.keyboard.press('Delete');
      await xp.keyboard.press('Delete'); // a group's first Delete ungroups it; the second removes the shapes
      await xp.keyboard.press('Escape');
      await xp.waitForTimeout(150);
    };
    const rect = async (x0, y0, x1, y1) => {
      await xp.click('#bDrawShape');
      await xp.mouse.move(...P(x0, y0));
      await xp.mouse.down();
      await xp.mouse.move(...P(x1, y1), { steps: 5 });
      await xp.mouse.up();
      await xp.waitForTimeout(200);
    };
    const press = async name => {
      const bt = await xp.evaluate(n => window.__box.button(n), name);
      if (!bt) throw new Error('no ' + name + ' button');
      await xp.mouse.click(...P(bt.cx, bt.cy));
      await xp.waitForTimeout(300);
    };
    const shapes = () => xp.evaluate(() => window.__box.shapes());
    await fresh();
    await rect(150, 300, 350, 500);
    await rect(250, 400, 450, 600);
    await xp.evaluate(() => window.__box.select([0, 1]));
    const two = await shapes();
    if (two.length !== 2 || !two.every(q => q && q.exact && q.n === 4)) throw new Error('two exact squares: ' + JSON.stringify(two));
    const A = two[0].area, Q = A / 4; // they overlap by a quarter
    for (const [name, n, area] of [['bt-union', 8, 2 * A - Q], ['bt-subtract', 6, A - Q], ['bt-intersect', 4, Q]]) {
      await press(name);
      const r = await shapes();
      if (r.length !== 1 || !r[0].exact || r[0].n !== n || Math.abs(r[0].area - area) > 1e-6 * A)
        throw new Error(name + ': ' + JSON.stringify(r) + ', expected ' + n + ' corners and area ' + area);
      await xp.keyboard.press('ControlOrMeta+z');
      await xp.waitForTimeout(250);
      if ((await xp.evaluate(() => window.__lazy.held())) !== 2) throw new Error('undo did not bring the two squares back after ' + name);
      await xp.evaluate(() => window.__box.select([0, 1]));
    }
    await fresh();
    await rect(150, 300, 450, 600);
    await rect(250, 400, 350, 500);
    await xp.evaluate(() => window.__box.select([0, 1]));
    await press('bt-subtract');
    // HOLES: one shape, its hole the inner square, carried through the SVG, a .tvf and a paste
    const fr = await shapes();
    if (fr.length !== 1 || fr[0].n !== 4 || fr[0].holes.length !== 1 || fr[0].holes[0].n !== 4 || Math.abs(fr[0].holes[0].area * 9 - fr[0].area) > 1e-6 * fr[0].area)
      throw new Error('a square from a square: ' + JSON.stringify(fr));
    const [hdl] = await Promise.all([xp.waitForEvent('download', { timeout: 30000 }), xp.evaluate(() => document.getElementById('bExportSvg').click())]);
    const hsvg = await readFile(await hdl.path(), 'utf8');
    if (!(hsvg.match(/<path d="[^"]*"/g) || []).some(d => (d.match(/M/g) || []).length === 2)) throw new Error('the frame did not export as one path of two rings');
    const [htl] = await Promise.all([xp.waitForEvent('download', { timeout: 30000 }), xp.evaluate(() => document.getElementById('bSaveTvf').click())]);
    const htvf = await readFile(await htl.path(), 'utf8');
    if (!/#meta holes:/.test(htvf)) throw new Error('the .tvf does not carry the hole');
    await xp.setInputFiles('#fLoadTvf', { name: 'frame.tvf', mimeType: 'text/plain', buffer: Buffer.from(htvf) });
    await xp.waitForTimeout(800);
    await xp.evaluate(() => window.__box.select([0]));
    const fr2 = await shapes();
    if (fr2.length !== 1 || fr2[0].holes.length !== 1 || Math.abs(fr2[0].holes[0].area * 9 - fr2[0].area) > 1e-6 * fr2[0].area) throw new Error('the frame came back from its .tvf as ' + JSON.stringify(fr2));
    await xp.keyboard.press('ControlOrMeta+c');
    // the copy's .tvf reaches the system clipboard a moment later; pasted before then, an
    // earlier step's .tvf would come back instead
    await xp.waitForFunction(() => /to the clipboard|clipboard/.test(document.getElementById('status').textContent), null, { timeout: 5000 }).catch(() => {});
    await xp.waitForTimeout(500);
    await xp.keyboard.press('ControlOrMeta+v');
    await xp.waitForTimeout(300);
    const fr3 = await shapes();
    if (fr3.length !== 1 || fr3[0].holes.length !== 1 || (await xp.evaluate(() => window.__lazy.held())) !== 2) throw new Error('copy and paste lost the hole: ' + JSON.stringify(fr3));
    await fresh();
    await rect(100, 300, 200, 400);
    await rect(300, 300, 400, 400);
    await xp.evaluate(() => window.__box.select([0, 1]));
    await press('bt-intersect');
    if ((await xp.evaluate(() => window.__box.count())) !== 2) throw new Error('intersecting shapes apart removed them');
    // line style: a dashed square, an open line with arrowheads at both ends
    await xp.evaluate(() => window.__box.select([0]));
    await press('bt-dash');
    await xp.click('#bDrawLine');
    await xp.mouse.click(...P(500, 650));
    await xp.keyboard.down('Shift');
    await xp.mouse.dblclick(...P(800, 500));
    await xp.keyboard.up('Shift');
    await xp.waitForTimeout(300);
    await xp.evaluate(() => window.__box.select([2]));
    await press('bt-arrow');
    await press('bt-arrow');
    const [dl] = await Promise.all([xp.waitForEvent('download', { timeout: 30000 }), xp.evaluate(() => document.getElementById('bExportSvg').click())]);
    const svg = await readFile(await dl.path(), 'utf8');
    if (!/stroke-dasharray="/.test(svg)) throw new Error('the dashed square exported without a dash array');
    if ((svg.match(/<path d="M[^"]*Z" fill="[^"]*" stroke="none"/g) || []).length !== 2) throw new Error('the line did not export two arrowheads');
    // push and pull: press the middle of a square's top edge and pull it up
    await fresh();
    await rect(150, 300, 350, 500);
    await xp.evaluate(() => window.__box.select([0]));
    await xp.waitForTimeout(150);
    const c0 = await xp.evaluate(() => window.__box.corners());
    const top = Math.min(...c0.pts.map(q => q.y)), xs = c0.pts.map(q => q.x);
    const mx = (Math.min(...xs) + Math.max(...xs)) / 2 - 30; // off the edge's ring
    await xp.mouse.move(...P(mx, top));
    await xp.mouse.down();
    await xp.mouse.move(...P(mx, top - 50), { steps: 6 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    const c1 = await xp.evaluate(() => window.__box.corners());
    if (!c1 || c1.pts.length !== 5 || !c1.smooth || !c1.smooth.some(v => v) || !(Math.min(...c1.pts.map(q => q.y)) < top - 20))
      throw new Error('push and pull: ' + JSON.stringify(c1 && { n: c1.pts.length, smooth: c1.smooth }));
    // offset and outline: the square grown with round joins keeps its four corners, each rounded
    // by the distance; shrunk, four sharp ones and less area; outlined, a frame (a hole inside)
    await xp.keyboard.press('ControlOrMeta+z');
    await xp.waitForTimeout(250);
    await xp.evaluate(() => window.__box.select([0]));
    await press('bt-offset');
    if (!(await xp.evaluate(() => document.getElementById('offsetTool').classList.contains('open')))) throw new Error('the offset strip did not open');
    await xp.fill('#otD', '0.05');
    const sq0 = (await shapes())[0];
    const offs = [];
    for (const id of ['#otGrow', '#otShrink', '#otOutline']) {
      await xp.click(id);
      await xp.waitForTimeout(300);
      offs.push((await shapes())[0]);
      await xp.keyboard.press('ControlOrMeta+z');
      await xp.waitForTimeout(250);
      await xp.evaluate(() => window.__box.select([0]));
    }
    const [og, osh, oo] = offs;
    if (!og || og.n !== 4 || !og.round || og.round.some(r => Math.abs(r - 0.05) > 1e-9) || !(og.area > sq0.area)) throw new Error('grown: ' + JSON.stringify(og));
    if (!osh || osh.n !== 4 || osh.round || !(osh.area < sq0.area)) throw new Error('shrunk: ' + JSON.stringify(osh));
    if (!oo || oo.n !== 4 || oo.holes.length !== 1 || oo.holes[0].n !== 4) throw new Error('outlined: ' + JSON.stringify(oo));
    // a circle (a square rounded by half its side) outlined: a ring of a few smooth corners
    await xp.click('#bDrawShape');
    await xp.locator('#stRound').fill('0.5');
    await xp.mouse.move(...P(600, 300));
    await xp.mouse.down();
    await xp.mouse.move(...P(800, 500), { steps: 5 });
    await xp.mouse.up();
    await xp.evaluate(() => { const r = document.getElementById('stRound'); r.value = 0; r.dispatchEvent(new Event('input')); });
    await xp.waitForTimeout(200);
    const nAll = await xp.evaluate(() => window.__box.count());
    await xp.evaluate(n => window.__box.select([n - 1]), nAll);
    await press('bt-offset');
    if (!(await xp.evaluate(() => document.getElementById('offsetTool').classList.contains('open')))) await press('bt-offset');
    await xp.fill('#otD', '0.05');
    await xp.click('#otOutline');
    await xp.waitForTimeout(300);
    const oc = (await shapes())[0];
    if (!oc || !oc.smooth || oc.n > 8 || oc.holes.length !== 1 || oc.holes[0].n > 8) throw new Error('a circle outlined: ' + JSON.stringify(oc));
    await xp.click('#otClose');
    // A CLICK IN A HOLE: the ring's hole is empty, its band is the shape
    await fresh();
    await rect(150, 300, 450, 600);
    await rect(250, 400, 350, 500);
    await xp.evaluate(() => window.__box.select([0, 1]));
    await press('bt-subtract');
    await xp.mouse.click(...P(20, 780));
    await xp.waitForTimeout(200);
    await xp.mouse.click(...P(300, 450)); // the middle of the hole
    await xp.waitForTimeout(250);
    if ((await shapes()).length) throw new Error('a click in a hole selected the shape round it');
    await xp.mouse.click(...P(200, 450)); // the band
    await xp.waitForTimeout(250);
    if ((await shapes()).length !== 1) throw new Error('a click on the band did not select the shape');
    // ALIGN on the drawn outline: a circle (a square rounded by half its side) and a rounded
    // hexagon aligned to a square's top all touch the same line, and stay exact
    await fresh();
    await rect(150, 250, 300, 400);
    await xp.click('#bDrawShape');
    await xp.click('#shapeTool button[data-kind="polygon"]');
    await xp.evaluate(() => { const r = document.getElementById('stRound'); r.value = 0.2; r.dispatchEvent(new Event('input')); });
    await xp.mouse.move(...P(700, 300));
    await xp.mouse.down();
    await xp.mouse.move(...P(780, 220), { steps: 5 });
    await xp.mouse.up();
    await xp.click('#bDrawShape');
    await xp.click('#shapeTool button[data-kind="rect"]');
    await xp.evaluate(() => { const r = document.getElementById('stRound'); r.value = 0; r.dispatchEvent(new Event('input')); });
    await xp.mouse.move(...P(1, 1));
    await xp.keyboard.press('Escape');
    await xp.evaluate(() => window.__box.select([0, 1]));
    await xp.click('#bAlign');
    await xp.click('#alignPop [data-align="top"]');
    await xp.waitForTimeout(250);
    await xp.evaluate(() => window.__box.select([0, 1]));
    const tops = (await shapes()).map(q => q.box[3]);
    if (tops.length !== 2 || Math.abs(tops[0] - tops[1]) > 1e-9) throw new Error('aligned tops: ' + JSON.stringify(tops));
    const hexR = (await shapes())[1];
    if (!hexR.round) throw new Error('the rounded hexagon lost its rounding');
    if ((await xp.evaluate(() => window.__lazy.held())) !== 2) throw new Error('aligning converted a shape');
    // TEXT TO EXACT SHAPES: a word made exact is a shape a letter, its counters holes
    await fresh();
    await xp.click('#bText');
    await xp.fill('#textPopInput', 'Bo');
    await xp.click('#textPopAdd');
    await xp.waitForTimeout(1000);
    await xp.keyboard.press('Escape');
    const nText = await xp.evaluate(() => window.__box.count());
    if (nText < 4) throw new Error('the text tool traced ' + nText + ' contours for "Bo"');
    await xp.evaluate(n => window.__box.select(Array.from({ length: n }, (_, i) => i)), nText);
    await press('bt-mode');
    await xp.waitForFunction(() => /now exact/.test(document.getElementById('status').textContent), null, { timeout: 20000 });
    await xp.evaluate(() => window.__box.select(Array.from({ length: window.__box.count() }, (_, i) => i)));
    const letters = await shapes();
    const holes = letters.map(q => q && q.holes.length).sort();
    if (letters.length !== 2 || !letters.every(q => q && q.exact) || holes.join() !== '1,2') throw new Error('"Bo" made exact: ' + JSON.stringify(letters.map(q => q && { n: q.n, holes: q.holes.length })));
    // EXACT TEXT FROM THE FONT: in a family whose file the page can fetch (a web font), the
    // letters come from the font's outlines, and the status line says so
    await fresh();
    await xp.click('#bText');
    const fams = await xp.evaluate(() => Array.from(document.getElementById('textPopFont').options, o => o.value));
    const fam = ['Inter', 'DM Mono', 'Roboto', 'DM Serif Display'].find(f => fams.includes(f));
    if (fam) {
      await xp.selectOption('#textPopFont', fam);
      await xp.fill('#textPopInput', 'Bo');
      await xp.click('#textPopAdd');
      await xp.waitForTimeout(1000);
      await xp.keyboard.press('Escape');
      const nf = await xp.evaluate(() => window.__box.count());
      await xp.evaluate(n => window.__box.select(Array.from({ length: n }, (_, i) => i)), nf);
      await press('bt-mode');
      await xp.waitForFunction(() => /now exact/.test(document.getElementById('status').textContent), null, { timeout: 20000 });
      const st = await xp.evaluate(() => document.getElementById('status').textContent);
      if (!/from the font/.test(st)) throw new Error('"Bo" in ' + fam + ' was not read from the font: ' + st.slice(0, 120));
      await xp.evaluate(() => window.__box.select(Array.from({ length: window.__box.count() }, (_, i) => i)));
      const fl = (await shapes()).map(q => q && q.holes.length).sort();
      if (fl.join() !== '1,2') throw new Error('"Bo" from the font: ' + JSON.stringify(fl));
      if (!(await shapes()).every(q => q && q.curves > 0)) throw new Error('"Bo" from the font holds no curve edges');
    } else
      console.log('     (no web font among ' + fams.join(', ') + '; the font path was not tried)');
    await xp.keyboard.press('Escape');
    // HOLE CORNERS: drag one, add one from a hole edge's ring, remove one; a three-corner hole
    // losing a corner is filled
    await fresh();
    await rect(150, 300, 450, 600);
    await rect(250, 400, 350, 500);
    await xp.evaluate(() => window.__box.select([0, 1]));
    await press('bt-subtract');
    await xp.evaluate(() => window.__box.select([0]));
    await xp.waitForTimeout(150);
    let hc = await xp.evaluate(() => window.__box.corners());
    if (!hc || hc.holes.length !== 1 || hc.holes[0].pts.length !== 4) throw new Error('no hole corners on the frame');
    const h0 = hc.holes[0].pts[0];
    await xp.mouse.move(...P(h0.x, h0.y));
    await xp.mouse.down();
    await xp.mouse.move(...P(h0.x + 20, h0.y + 15), { steps: 4 });
    await xp.mouse.up();
    await xp.waitForTimeout(200);
    hc = await xp.evaluate(() => window.__box.corners());
    const h0b = hc.holes[0].pts[0];
    if (Math.abs(h0b.x - h0.x - 20) > 1 || Math.abs(h0b.y - h0.y - 15) > 1 || hc.pts.length !== 4) throw new Error('a hole corner dragged: ' + JSON.stringify(h0b));
    const hm = hc.holes[0].mids[1];
    await xp.mouse.move(...P(hm.x, hm.y));
    await xp.mouse.down();
    await xp.mouse.move(...P(hm.x - 10, hm.y + 20), { steps: 4 });
    await xp.mouse.up();
    await xp.waitForTimeout(200);
    if ((await xp.evaluate(() => window.__box.corners())).holes[0].pts.length !== 5) throw new Error('a hole corner was not added');
    await xp.keyboard.press('Delete');
    await xp.waitForTimeout(200);
    for (let q = 0; q < 2; q++) {
      const hp = (await xp.evaluate(() => window.__box.corners())).holes[0].pts[0];
      await xp.mouse.dblclick(...P(hp.x, hp.y));
      await xp.waitForTimeout(250);
    }
    if ((await xp.evaluate(() => window.__box.corners())).holes.length !== 0) throw new Error('the three-corner hole was not filled');
    // THE KNIFE: a frame cut down its middle is two pieces of half its area each, exact
    await fresh();
    await rect(150, 300, 450, 600);
    await rect(250, 400, 350, 500);
    await xp.evaluate(() => window.__box.select([0, 1]));
    await press('bt-subtract');
    await xp.evaluate(() => window.__box.select([0]));
    const fr0 = (await shapes())[0];
    const whole = fr0.area - fr0.holes.reduce((t, h) => t + h.area, 0); // the frame's own area: its outline less its hole
    await press('bt-knife');
    await xp.mouse.move(...P(300, 250));
    await xp.mouse.down();
    await xp.mouse.move(...P(300, 650), { steps: 5 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    const halves = await shapes();
    if (halves.length !== 2 || halves.some(q => q.n !== 8 || q.holes.length || Math.abs(q.area - whole / 2) > 1e-6 * whole)) throw new Error('the frame cut: ' + JSON.stringify(halves.map(q => [q.n, q.area])));
    // CURVE EDGES: a circle (a square rounded by half its side) cut through its middle is two
    // halves holding pieces of its arcs as curve edges, of equal area as drawn; a corner put in
    // on a curve edge cuts the curve there and changes nothing drawn; a .tvf keeps the curves
    await fresh();
    await xp.click('#bDrawShape');
    await xp.locator('#stRound').fill('0.5');
    await xp.mouse.move(...P(400, 300));
    await xp.mouse.down();
    await xp.mouse.move(...P(600, 500), { steps: 5 });
    await xp.mouse.up();
    await xp.evaluate(() => { const r = document.getElementById('stRound'); r.value = 0; r.dispatchEvent(new Event('input')); });
    await xp.waitForTimeout(200);
    await xp.evaluate(() => window.__box.select([0]));
    const disc = (await shapes())[0].drawn;
    await press('bt-knife');
    await xp.mouse.move(...P(380, 300));
    await xp.mouse.down();
    await xp.mouse.move(...P(620, 500), { steps: 5 });
    await xp.mouse.up();
    await xp.waitForTimeout(300);
    const ch = await shapes();
    if (ch.length !== 2 || ch.some(q => !(q.curves > 0)) || Math.abs(ch[0].drawn - ch[1].drawn) > 1e-4 * disc || Math.abs(ch[0].drawn + ch[1].drawn - disc) > 0.01 * disc)
      throw new Error('a circle cut: ' + JSON.stringify(ch.map(q => [q.n, q.curves, q.drawn])) + ' of ' + disc);
    await xp.evaluate(() => window.__box.select([0]));
    await xp.waitForTimeout(150);
    const half0 = (await shapes())[0];
    const cmid = (await xp.evaluate(() => window.__box.corners())).mids;
    // the ring with the most curve under it: the one farthest from the cut's straight edge is
    // on an arc piece; take each ring in turn until one adds a curve edge
    let split = null;
    for (const m of cmid) {
      await xp.mouse.move(...P(m.x, m.y));
      await xp.mouse.down();
      await xp.mouse.up();
      await xp.waitForTimeout(150);
      const q = (await shapes())[0];
      if (q.curves === half0.curves + 1) { split = q; break; }
      await xp.keyboard.press('ControlOrMeta+z');
      await xp.waitForTimeout(150);
      await xp.evaluate(() => window.__box.select([0]));
    }
    if (!split || split.n !== half0.n + 1 || Math.abs(split.drawn - half0.drawn) > 2e-4 * half0.drawn /* the area measured in samples: sixteen an edge, so a split edge samples more finely */) throw new Error('a corner put in on a curve edge: ' + JSON.stringify(split) + ' from ' + JSON.stringify(half0));
    const [ctl] = await Promise.all([xp.waitForEvent('download', { timeout: 30000 }), xp.evaluate(() => document.getElementById('bSaveTvf').click())]);
    const ctvf = await readFile(await ctl.path(), 'utf8');
    if (!/#meta curves:/.test(ctvf)) throw new Error('the .tvf does not carry the curve edges');
    await xp.setInputFiles('#fLoadTvf', { name: 'halves.tvf', mimeType: 'text/plain', buffer: Buffer.from(ctvf) });
    await xp.waitForTimeout(800);
    await xp.evaluate(() => window.__box.select([0, 1]));
    const back = await shapes();
    if (back.length !== 2 || back.some(q => !(q.curves > 0))) throw new Error('the curve edges came back from the .tvf as ' + JSON.stringify(back.map(q => q && q.curves)));
    // CURVE HANDLES: the line pen's point pressed and pulled makes a smooth point with curves
    // either side; picked, it shows both handles; one dragged swings the other opposite at its
    // own length; with Alt the corner goes sharp
    await fresh();
    await xp.click('#bDrawLine');
    await xp.mouse.click(...P(400, 500));
    await xp.mouse.move(...P(600, 500));
    await xp.mouse.down();
    await xp.mouse.move(...P(650, 400), { steps: 6 });
    await xp.mouse.up();
    await xp.mouse.click(...P(500, 300));
    await xp.mouse.click(...P(401, 501));
    await xp.waitForTimeout(300);
    await xp.evaluate(() => window.__box.select([0]));
    await xp.waitForTimeout(150);
    let pc = await xp.evaluate(() => window.__box.corners());
    const penShape = (await shapes())[0];
    if (!penShape || penShape.curves !== 2 || !pc.smooth || pc.smooth[1] !== 1) throw new Error('the pen\'s pulled point: ' + JSON.stringify({ curves: penShape && penShape.curves, smooth: pc.smooth }));
    await xp.mouse.click(...P(pc.pts[1].x, pc.pts[1].y));
    await xp.waitForTimeout(200);
    pc = await xp.evaluate(() => window.__box.corners());
    if (pc.handles.length !== 2) throw new Error('a smooth point picked shows ' + pc.handles.length + ' handles');
    const hOut = pc.handles.find(q => q.which === 'out'),
      cpt = pc.pts[1];
    await xp.mouse.move(...P(hOut.x, hOut.y));
    await xp.mouse.down();
    await xp.mouse.move(...P(hOut.x + 40, hOut.y + 30), { steps: 5 });
    await xp.mouse.up();
    await xp.waitForTimeout(200);
    pc = await xp.evaluate(() => window.__box.corners());
    const ho2 = pc.handles.find(q => q.which === 'out'),
      hi2 = pc.handles.find(q => q.which === 'in');
    const vo = [ho2.x - cpt.x, ho2.y - cpt.y],
      vi = [hi2.x - cpt.x, hi2.y - cpt.y];
    const cross = vo[0] * vi[1] - vo[1] * vi[0],
      dot = vo[0] * vi[0] + vo[1] * vi[1];
    if (Math.abs(ho2.x - hOut.x - 40) > 1.5 || Math.abs(cross) > 2 * Math.hypot(...vo) || dot >= 0) throw new Error('a smooth point\'s handles did not stay in line: ' + JSON.stringify({ vo, vi }));
    await xp.keyboard.down('Alt');
    await xp.mouse.move(...P(hi2.x, hi2.y));
    await xp.mouse.down();
    await xp.mouse.move(...P(hi2.x - 30, hi2.y + 40), { steps: 5 });
    await xp.mouse.up();
    await xp.keyboard.up('Alt');
    await xp.waitForTimeout(200);
    pc = await xp.evaluate(() => window.__box.corners());
    if (pc.smooth && pc.smooth[1]) throw new Error('Alt on a handle did not make the corner sharp');
    const ho3 = pc.handles.find(q => q.which === 'out');
    if (Math.hypot(ho3.x - ho2.x, ho3.y - ho2.y) > 1) throw new Error('Alt moved the other handle too');
    // CORNERS, ALL AT ONCE: a square's corners all rounded by the radius, then all smooth,
    // then all sharp
    await fresh();
    await rect(150, 300, 350, 500);
    await xp.evaluate(() => window.__box.select([0]));
    await press('bt-corners');
    await xp.fill('#ctR', '0.05');
    await xp.click('#ctRound');
    let cq = (await shapes())[0];
    if (!cq.round || cq.round.length !== 4 || cq.round.some(v => Math.abs(v - 0.05) > 1e-9)) throw new Error('round all: ' + JSON.stringify(cq.round));
    await xp.click('#ctSmooth');
    cq = (await shapes())[0];
    if (!cq.smooth || cq.round) throw new Error('all smooth: ' + JSON.stringify(cq));
    await xp.click('#ctSharp');
    cq = (await shapes())[0];
    if (cq.smooth || cq.round || cq.n !== 4) throw new Error('all sharp: ' + JSON.stringify(cq));
    await xp.click('#ctClose');
  } catch (e){
    failures.push(`[combining exact shapes] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} exact shapes: combining, line style, push and pull`);
  await xp.close();
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
                             'bench.html', 'sound.html', 'motion.html', 'compose.html', 'epicycles.html', 'situated.html', 'depth.html', 'recovered.html', 'corner.html', 'levels.html', 'standpoint.html', 'readers.html', 'compile.html']);
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
  // the levels: the lay (s = 8 at 1.875, the first level half wide), one level fewer per doubling
  // of the grain, the depth averaging zero on the corner, the star read from its centre (its tip
  // over its dip as drawn), the crescent not star-shaped from its centroid, a place on the egg's
  // outline meeting walls on its inward half only and each once, and a .tvf curve parsed
  const lv = await run('levels.html', 'levelsCheck');
  if (!(lv.r8 === 1.875 && lv.w0 === 0.5 && lv.v1 - lv.v2 === 1)) throw new Error('the lay ' + JSON.stringify(lv));
  if (!(lv.meanDepth < 1e-9 && Math.abs(lv.tipDip - 145 / 55) < 0.02)) throw new Error('the depth ' + JSON.stringify(lv));
  if (!(lv.crescentMulti > 0 && lv.outlineMulti === 0 && Math.abs(lv.outlineMet - 0.5) < 0.02 && lv.parsed === 1)) throw new Error('the standpoints ' + JSON.stringify(lv));
  // the editor's "read the selection in the levels" link: the payload encodeShapeLink writes opens there
  { const ep = await browser.newPage(); await ep.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    const code = await ep.evaluate(() => { const N = 64, x = [], y = []; for (let k = 0; k < N; k++) { const q = (k + 0.5) * 2 * Math.PI / N; x.push(100 * Math.cos(q)); y.push(60 * Math.sin(q)); }
      return window.encodeShapeLink([{ x, y }], 'an oval'); }); await ep.close();
    const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } }); gp.on('pageerror', e => failures.push(`[levels.html#tvf] ${e.message}`));
    await gp.goto(new URL('gallery/levels.html#tvf=' + code, base).href, { waitUntil: 'load' });
    const got = await gp.waitForFunction(() => /an oval: 64 leaves/.test(document.getElementById('loaded').textContent) && document.getElementById('loaded').textContent, null, { timeout: 10000 })
      .then(h => h.jsonValue()).catch(async () => 'timed out: ' + await gp.evaluate(() => document.getElementById('loaded').textContent));
    await gp.close(); if (!/an oval/.test(got)) throw new Error('the editor\'s link on the levels page: ' + got); }
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
