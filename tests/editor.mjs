// Smoke test, part "editor": the editor's walk (the page loads, drags, a stroke and a line, every toolbar button), a crowded import
// converted on touch, and the panel's group button and menu switch.
//
//   node tests/editor.mjs            this part alone (QUICK=1, ONLY='a|b', BASE_URL and SETTLE_MS as for npm test)
//   npm test                         every part, by tests/smoke.mjs
//
// Cut from tests/smoke.mjs (12 Nov 2026) as it stood: the checks and their comments are unchanged. What every
// part needs (the server, the browser, step, the failures and how a run ends) is tests/harness.mjs.

import { begin, SETTLE_MS, SKIP, readFile } from './harness.mjs';

const T = await begin('editor');
const { base, browser, page, failures, step, drag } = T;

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

  /* The shapes panel draws its hundred tiles when it is first opened, not as the page starts (12 Nov 2026, the
     tiles were nearly all that panel's start-up cost): none before the press, all of them after it, and a pick
     from the grid still adds its shape. */
  /* The top bar's buttons say their names (13 Nov 2026, Tom: "The header buttons should show button title"): under
     the button while the mouse is over it, gone when it leaves. */
  await step('the header buttons say their names', async () => {
    const names = {};
    for (const id of ['bUndo', 'bShapes', 'bDraw', 'bFit', 'gearBtn']) {
      await page.hover('#' + id);
      names[id] = await page.evaluate(() => window.__buttonName());
    }
    const want = { bUndo: 'Undo', bShapes: 'Add a shape', bDraw: 'Pencil', bFit: 'Fit to view', gearBtn: 'Settings' };
    for (const [id, name] of Object.entries(want))
      if (!names[id] || names[id].id !== id || names[id].name !== name) throw new Error(`over #${id} the name shown was ${JSON.stringify(names[id])}`);
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('.topbar .icon-btn')].filter(b => b.offsetParent && !b.id).length);
    if (unnamed) throw new Error(unnamed + ' top-bar buttons have no id to name them by');
    await page.mouse.move(640, 500);
    if (await page.evaluate(() => window.__buttonName())) throw new Error('the name stayed after the mouse left the button');
    // and every button of the top bar and the edit view's bar has one (13 Nov 2026, Tom: "2 3 4": the edit bar too)
    const all = await page.evaluate(() => window.__buttonNames());
    const none = all.filter(([, n]) => !n).map(([id]) => id || '(no id)');
    if (all.length < 40 || none.length) throw new Error(all.length + ' buttons; without a name: ' + none.join(' '));
  });

  /* On a phone the top bar's chips are 52px (13 Nov 2026, Tom: "the tool bar buttons should be larger on mobile"),
     the corner pair with them, while the other bars' chips keep the touch size of 42. */
  await step('the top bar is finger-sized on a phone, and says its names to a finger', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    const mp = await ctx.newPage();
    mp.on('pageerror', e => failures.push(`[phone] ${e.message}`));
    await mp.route(/fonts\.g/, r => r.abort());
    try {
      await mp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
      await mp.waitForSelector('#bUndo', { timeout: 60000 });
      const w = await mp.evaluate(() => Object.fromEntries(['bLock', 'bUndo', 'gearBtn'].map(id => [id, parseFloat(getComputedStyle(document.getElementById(id)).width)])));
      if (w.bLock !== 52 || w.bUndo !== 52 || w.gearBtn !== 52) throw new Error('top bar chips on a phone: ' + JSON.stringify(w));
      const edit = await mp.evaluate(() => { const b = document.querySelector('.edit-bar .icon-btn'); return b ? parseFloat(getComputedStyle(b).width) : null; });
      if (edit !== null && edit !== 42) throw new Error('an edit bar chip on a phone is ' + edit + 'px, not 42');
      // a finger sees a button's name while it is held (13 Nov 2026), and the shapes panel's pictures are drawn
      // for a finger's tile, 42 not a mouse's 28 (Tom: "2 3 4")
      const cdp = await ctx.newCDPSession(mp);
      const at = await mp.evaluate(() => { const r = document.getElementById('bUndo').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at[0], y: at[1] }] });
      await mp.waitForTimeout(150);
      const held = await mp.evaluate(() => window.__buttonName());
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      if (!held || held.name !== 'Undo') throw new Error('a finger held on Undo was shown ' + JSON.stringify(held));
      await mp.evaluate(() => document.getElementById('bShapes').click());
      const px = await mp.evaluate(() => { const s = document.querySelector('#shapeGrid .shape-pick svg'); return s && +s.getAttribute('width'); });
      if (px !== 40) throw new Error("a shapes panel picture on a phone is " + px + 'px wide, not 40 (drawn at 42)');
      // and a tile, pressed, says its title: what it is, or how to give it a name
      await mp.evaluate(() => document.querySelector('#shapeGrid .shape-pick[data-shape="circle"]').click());
      await mp.waitForFunction(() => document.querySelector('#shapeScroller .shape-tile[title]'), null, { timeout: 10000 });
      const tile = await mp.evaluate(() => { const t = document.querySelector('#shapeScroller .shape-tile[title]'); const r = t.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, t.title]; });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tile[0], y: tile[1] }] });
      await mp.waitForTimeout(150);
      const said = await mp.evaluate(() => window.__buttonName());
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      if (!said || said.name !== tile[2]) throw new Error('a tile pressed said ' + JSON.stringify(said) + ', its title is ' + tile[2]);
    } finally { await ctx.close(); }
  });

  await step('the shapes grid is drawn when first opened', async () => {
    const before = await page.evaluate(() => document.querySelectorAll('#shapeGrid .shape-pick').length);
    if (before) throw new Error(before + ' tiles drawn before the panel was opened');
    await page.click('#bShapes');
    const after = await page.evaluate(() => [document.querySelectorAll('#shapeGrid .shape-pick').length, document.getElementById('shapePop').classList.contains('open')]);
    if (after[0] < 50 || !after[1]) throw new Error('after the press: ' + after[0] + ' tiles, open ' + after[1]);
    await page.click('#shapeGrid .shape-pick[data-shape="circle"]');
    await page.waitForTimeout(300);
    if (!await page.evaluate(() => !!window.__box.button('bt-mode'))) throw new Error('a pick from the grid added no shape (nothing selected)');
    await page.click('#bShapes');
    await page.keyboard.press('Escape');
    const again = await page.evaluate(() => document.querySelectorAll('#shapeGrid .shape-pick').length);
    if (again !== after[0]) throw new Error('opened again, the grid has ' + again + ' tiles, not ' + after[0]);
  });

  await step('drag on the canvas', () => drag([[640, 400], [700, 430], [760, 460]]));
  await step('freehand stroke', async () => {
    await page.click('#bDraw');
    await drag(Array.from({ length: 24 }, (_, i) => [300 + i * 25, 600 + Math.round(Math.sin(i / 3) * 60)]));
  });
  /* A shape with no name says, on its tile in the strip, how to give it one: by the long press that renames it (13 Nov
     2026, Tom: "'double click to name' tooltip of footer should be changed to 'Long press to Change Name'"). The stroke
     just drawn has none. */
  await step('an unnamed tile says how to name it', async () => {
    await page.waitForFunction(() => document.querySelectorAll('#shapeScroller [data-thumb]').length >= 2, null, { timeout: 10000 }).catch(() => {});
    const tips = await page.evaluate(() => [...document.querySelectorAll('#shapeScroller [data-thumb]')].map(t => t.title));
    if (!tips.includes('Long press to Change Name') || tips.some(t => /double-click/.test(t)))
      throw new Error("the tiles' tips: " + JSON.stringify(tips));
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
    await page.evaluate(() => window.__labFiles.load('decoder-test-vectors')); // the lab lives in labs/ (THE LABS THAT LIVE IN labs/)
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
    await page.evaluate(() => window.__labFiles.load('decoder-test-vectors')); // the lab lives in labs/ (THE LABS THAT LIVE IN labs/)
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
    await page.evaluate(() => window.__labFiles.load('depth-in-tvf')); // the lab lives in labs/ (THE LABS THAT LIVE IN labs/)
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
    await page.evaluate(() => window.__labFiles.load('undoing-the-division')); // the lab lives in labs/ (THE LABS THAT LIVE IN labs/)
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
    await page.evaluate(() => window.__labFiles.load('learning-a-shape-from-its-encounters')); // the lab lives in labs/ (THE LABS THAT LIVE IN labs/)
    const r = await page.evaluate(() => runShapeEncounters().rows.map(x => ({ D: x.D, eA: x.eA, eB: x.eB })));
    const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1], at = D => r.filter(x => x.D === D);
    if (r.some(x => !(x.eB < 0.01))) throw new Error('the nested reader misses by ' + Math.max(...r.map(x => x.eB)));
    const grow = med(at(128).map(x => x.eA)) / med(at(4).map(x => x.eA));
    if (!(grow > 15)) throw new Error('the one sweep grows only ×' + grow.toFixed(1) + ' from 4 to 128 h');
  });

  await step('walls', async () => {
    await page.evaluate(() => window.__labFiles.load('depth-in-tvf')); // the lab lives in labs/ (THE LABS THAT LIVE IN labs/)
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
  failures.push(`[${T.current}] ${e.message.split('\n')[0]}`);
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
T.current = 'crowded import';
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
T.current = 'panel: group button and menu switch';
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

await T.finish();
