// Smoke test, part "labs": the labs (one that lives in labs/, the labs from the essays, labs.html against the drawer) and the files that must
// stand alone or be up to date: tvf-core.js, svg-import.js, the copies npm run sync writes.
//
//   node tests/labs.mjs            this part alone (QUICK=1, ONLY='a|b', BASE_URL and SETTLE_MS as for npm test)
//   npm test                         every part, by tests/smoke.mjs
//
// Cut from tests/smoke.mjs (12 Nov 2026) as it stood: the checks and their comments are unchanged. What every
// part needs (the server, the browser, step, the failures and how a run ends) is tests/harness.mjs.

import { begin, ROOT, QUICK, readFile, join } from './harness.mjs';

const T = await begin('labs');
const { base, browser, failures, step } = T;

/* THE LABS THAT LIVE IN labs/. A moved lab is not in draw.html and loads only when asked: ?lab=num presses its
   button, the press is held while labs/number-tests.js loads and is evaluated in the editor's closure, and the lab
   then runs as it did in the page (its sheet of five, its status line). Every file LAB_FILES names is there. */
await step('a lab that lives in labs/', async () => {
  const src = await readFile(join(ROOT, 'draw.html'), 'utf8');
  if (/function runNumberTests\b/.test(src)) throw new Error('the number tests are back in draw.html');
  const pp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pp.on('pageerror', e => failures.push(`[labs/] ${e.message}`));
  await pp.route(/fonts\.g/, r => r.abort());
  try {
    await pp.goto(new URL('draw.html?lab=num', base).href, { waitUntil: 'load' });
    const files = await pp.evaluate(() => Object.values(window.__labFiles.files));
    for (const f of new Set(files)) await readFile(join(ROOT, 'labs', f + '.js'), 'utf8');
    await pp.waitForFunction(() => window.__labFiles.state['number-tests'] === 'run' && window.__lastLadder
      && window.__lastLadder.name === 'number tests', null, { timeout: 30000 });
    const r = await pp.evaluate(() => ({ rows: window.__lastLadder.rows.length,
      flash: (window.__flashLog || []).filter(f => /^number tests/.test(f)).pop() || '' }));
    if (r.rows !== 5) throw new Error(`the number tests laid ${r.rows} cells, not 5`);
    if (!/integers on 11\/11/.test(r.flash)) throw new Error('the number tests said: ' + r.flash.slice(0, 160));
    // every other file hands its code over and evaluates without a throw (its buttons wired, nothing run)
    const loaded = await pp.evaluate(async () => {
      const out = [];
      for (const f of new Set(Object.values(window.__labFiles.files)))
        try { await window.__labFiles.load(f); out.push(f + ' ' + window.__labFiles.state[f]); } catch (e) { out.push(f + ' ' + e.message); }
      return out;
    });
    const bad = loaded.filter(l => !/ run$/.test(l));
    if (bad.length) throw new Error('labs/ files that did not run: ' + bad.join('; '));
    // a sheet whose code waited in the page for DOMContentLoaded opens from its file too (labAfterLoad)
    await pp.evaluate(() => document.getElementById('bClosure').click());
    await pp.waitForFunction(() => { const s = document.getElementById('sheetPanel'); return s && s.offsetParent && /closure sheet/i.test(s.innerText); },
      null, { timeout: 10000 }).catch(() => { throw new Error('the closure sheet did not open from labs/sheets.js'); });
  } finally { await pp.close(); }
});

/* THE LABS FROM THE ESSAYS (29 Oct 2026). Each runs from ?lab= and says what its record in papers/labs.md says:
   the median returns the direction and the mean angle its own formula on every figure; the facings joined within 1%
   on most figures with every wrong join flagged; the median figure gaining one held level per doubling. */
await step('the labs from the essays', async () => {
  const runLab = async (code, name) => {
    const pp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    pp.on('pageerror', e => failures.push(`[?lab=${code}] ${e.message}`));
    await pp.route(/fonts\.g/, r => r.abort());
    try {
      await pp.goto(new URL('draw.html?lab=' + code, base).href, { waitUntil: 'load' });
      await pp.waitForFunction(n => window.__lastLadder && window.__lastLadder.name === n, name, { timeout: 60000 });
      return await pp.evaluate(n => (window.__flashLog || []).filter(f => f.startsWith(n)).pop() || '', name);
    } finally { await pp.close(); }
  };
  const avd = await runLab('avd', 'averaging directions');
  const m = avd.match(/returned the direction on (\d+)\/(\d+).*returned atan\(m\/\(1\+γ\)\) on (\d+)\/(\d+)/);
  if (!m || m[1] !== m[2] || m[3] !== m[4]) throw new Error('averaging directions said: ' + avd.slice(0, 240));
  const jnf = await runLab('jnf', 'joining the four facings');
  if (!/joined right but flagged/.test(jnf) || /let \d+ through/.test(jnf)) throw new Error('joining the facings said: ' + jnf.slice(0, 240));
  const ssl = await runLab('ssl', 'size sets the level');
  if (!/the median figure gained 1, 1, 1, 1, 1 held levels/.test(ssl)) throw new Error('size sets the level said: ' + ssl.slice(0, 240));
});

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

/* The SVG importer is its own file too (svg-import.js, 12 Nov 2026): the block 3d copies, cut out of the page
   unchanged. It must load outside the page (it only declares), its functions must be there and work, and
   draw.html must load it and not carry a second copy. */
await step('svg-import.js stands alone', async () => {
  const vm = await import('node:vm');
  const src = await readFile(join(ROOT, 'svg-import.js'), 'utf8');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src + '\n;globalThis.__names = { NON_RENDERING_CONTAINERS, REF_SAMPLES, ARC_TOL, PATH_TOL };', ctx, { filename: 'svg-import.js' });
  for (const f of ['parseSvgToPolyline', 'expandUseReferences', 'flattenPathFast', 'tracePathElement', 'fitSubpathsToWorld', 'arcLengthResample', 'smoothDrawPts'])
    if (typeof ctx[f] !== 'function') throw new Error('svg-import.js declares no ' + f);
  if (ctx.__names.REF_SAMPLES !== 768 || !ctx.__names.NON_RENDERING_CONTAINERS.has('defs')) throw new Error('svg-import.js: its constants');
  // a square's corners smoothed once round the loop: each the mean of itself and its two neighbours
  const sq = [[0, 0], [3, 0], [6, 0], [6, 3], [6, 6], [3, 6], [0, 6], [0, 3]].map(([x, y]) => ({ x, y }));
  const sm = ctx.smoothDrawPts(sq, 1, 1);
  if (sm.length !== 8 || Math.abs(sm[0].x - 1) > 1e-12 || Math.abs(sm[0].y - 1) > 1e-12 || sm[1].x !== 3 || sm[1].y !== 0)
    throw new Error('smoothDrawPts outside the page: ' + JSON.stringify(sm.slice(0, 2)));
  const i0 = src.indexOf('const NON_RENDERING_CONTAINERS'), i1 = src.indexOf('function smoothDrawPts(');
  if (i0 < 0 || i1 < i0 || src.indexOf('function parseSvgToPolyline(') < i0) throw new Error('svg-import.js: the block 3d copies is not whole');
  const html = await readFile(join(ROOT, 'draw.html'), 'utf8');
  if (!html.includes('<script src="svg-import.js"></script>')) throw new Error('draw.html does not load svg-import.js');
  for (const own of ['const NON_RENDERING_CONTAINERS', 'function parseSvgToPolyline(', 'function smoothDrawPts(', 'const REF_SAMPLES'])
    if (html.includes(own)) throw new Error('draw.html carries its own ' + own + ' again');
});

/* The .tvf reader is its own file as well (tvf-reader.js, 12 Nov 2026): parseTvfText, the last block 3d and games
   copied out of draw.html, cut out unchanged. It reads only its text, so it runs here in Node: a curve read back,
   a file that is not one refused, and draw.html loading it without a second copy. */
await step('tvf-reader.js stands alone', async () => {
  const vm = await import('node:vm');
  const src = await readFile(join(ROOT, 'tvf-reader.js'), 'utf8');
  const ctx = { module: { exports: {} } };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'tvf-reader.js' });
  const parse = ctx.module.exports.parseTvfText;
  if (typeof parse !== 'function' || typeof ctx.parseTvfText !== 'function') throw new Error('tvf-reader.js declares no parseTvfText');
  const r = parse('TVF 4 1 2\n#meta name:sq\n0 1 0 -1 0\n0 0 1 0 -1\n');
  const sp = r && r.subpaths && r.subpaths[0];
  if (!sp || r.blockCount !== 1 || sp.gname !== 'sq' || Array.from(sp.leafX).join() !== '1,0,-1,0' || Array.from(sp.leafY).join() !== '0,1,0,-1')
    throw new Error('a square read back as ' + JSON.stringify(r).slice(0, 200));
  let refused = '';
  try { parse('not a curve'); } catch (e) { refused = e.message; }
  if (!/not a TVF file/.test(refused)) throw new Error('a file that is no .tvf was not refused: ' + refused);
  const i0 = src.indexOf('// TVF LOAD'), i1 = src.indexOf('function parseTvfText(');
  if (i0 < 0 || i1 < i0) throw new Error('tvf-reader.js: the block 3d and games copy is not whole');
  const html = await readFile(join(ROOT, 'draw.html'), 'utf8');
  if (!html.includes('<script src="tvf-reader.js"></script>')) throw new Error('draw.html does not load tvf-reader.js');
  if (html.includes('function parseTvfText(')) throw new Error('draw.html carries its own parseTvfText again');
});

/* Four blocks of the editor's script are files in parts/ (12 Nov 2026), which the page names above its own
   script and runs where each stood (partRun). Each must parse, hand over one function under its name, be named
   by a script tag before the page's own script and run exactly once; and the page must not carry a block again. */
await step('parts/ are handed over and run in place', async () => {
  const vm = await import('node:vm');
  const html = await readFile(join(ROOT, 'draw.html'), 'utf8');
  const own = html.indexOf('<script>\n    \'use strict\';');
  if (own < 0) throw new Error('the page\'s own script was not found');
  for (const name of ['ai-panel', 'shapes-panel', 'bucket-picker', 'scene-link']) {
    const src = await readFile(join(ROOT, 'parts', name + '.js'), 'utf8');
    const ctx = { window: {} };
    vm.createContext(ctx);
    vm.runInContext(src, ctx, { filename: 'parts/' + name + '.js' });
    if (typeof ctx.window.TVF_PARTS[name] !== 'function' || Object.keys(ctx.window.TVF_PARTS).length !== 1) throw new Error(`parts/${name}.js hands over no function of its name`);
    const tag = html.indexOf(`<script src="parts/${name}.js"></script>`);
    if (tag < 0 || tag > own) throw new Error(`draw.html does not name parts/${name}.js before its own script`);
    if (html.split(`partRun('${name}');`).length !== 2) throw new Error(`draw.html does not run parts/${name}.js exactly once`);
  }
  for (const first of ["const pop = $('aiPop'),", "const pop = $('shapePop'),", "const BUCKET_API = ", 'function applySceneMorphs('])
    if (html.includes(first)) throw new Error('draw.html carries a block of parts/ again: ' + first);
});

/* Every copy is what npm run sync would write: the gallery's library, bundle and tile code from the catalogue,
   the embedded page's examples from the animated one, the three pages' depth code from the editor. The steps
   above compare the copies with each other; this one compares each with its source, by the tool that writes it. */
await step('npm run sync has nothing to write', async () => {
  const { sync } = await import('../tools/sync.mjs');
  const { changed, problems } = await sync({ write: false });
  if (problems.length) throw new Error('sync: ' + problems.join('; '));
  if (changed.length) throw new Error('copies differ from their sources (npm run sync): ' + [...new Set(changed.map(c => c.file + ' (' + c.what + ')'))].join(', '));
});

await T.finish();
