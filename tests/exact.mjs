// Smoke test, part "exact": exact shapes: an SVG kept as corners and cubics, the autosave of smooth corners, exact shapes edited and combined.
//
//   node tests/exact.mjs            this part alone (QUICK=1, ONLY='a|b', BASE_URL and SETTLE_MS as for npm test)
//   npm test                         every part, by tests/smoke.mjs
//
// Cut from tests/smoke.mjs (12 Nov 2026) as it stood: the checks and their comments are unchanged. What every
// part needs (the server, the browser, step, the failures and how a run ends) is tests/harness.mjs.

import { begin, readFile } from './harness.mjs';

const T = await begin('exact');
const { base, browser, failures } = T;

/* SVG AS EXACT SHAPES (draw.html). An SVG opened arrives as exact shapes: a compound path's
   inner ring a hole (its curve kept: the drawn hole is larger than its corners' polygon), a
   circle as four curve edges, an open stroked path open with its one curve. With the menu's
   switch off it arrives as leaves, as before. The menu's "exact shapes: how to" opens the help
   sheet, and Escape puts it away. */
T.current = 'svg as exact shapes';
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

/* THE AUTOSAVE KEEPS SMOOTH CORNERS (draw.html). An exact shape's smooth corners and a shape's smoothing were
   both saved as `sm`, and the second replaced the first, so a reload lost every smooth corner. A circle has four. */
T.current = 'autosave smooth';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const sp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  sp.on('pageerror', e => failures.push(`[autosave smooth] ${e.message}`));
  await sp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="10" y="10" width="40" height="40" fill="#e05a6a"/><circle cx="150" cy="50" r="30" fill="#48f"/></svg>';
    await sp.goto(scene({ name: 'smooth', svg, morphs: [] }), { waitUntil: 'load' });
    await sp.waitForFunction(() => !/scene=/.test(location.hash) && window.__box, null, { timeout: 60000 });
    await sp.waitForTimeout(2500);
    const a = await sp.evaluate(() => window.__box.smoothCorners());
    await sp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await sp.waitForFunction(() => window.__box, null, { timeout: 60000 });
    await sp.waitForTimeout(2500);
    const b = await sp.evaluate(() => window.__box.smoothCorners());
    if (JSON.stringify(a) !== '[0,4]' || JSON.stringify(b) !== JSON.stringify(a)) throw new Error('smooth corners before and after a reload: ' + JSON.stringify([a, b]));
    await sp.close();
  } catch (e){
    failures.push(`[autosave smooth] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} the autosave keeps an exact shape's smooth corners`);
}

/* EXACT SHAPES (draw.html). The line pen's polygons and lines stay exact: corners sharp,
   edges straight, never leaves until asked. A triangle closed on its start point and a line of
   two points finished by a double-click; both held exact through a click and a drag of a
   corner; the SVG export writes them as straight segments (the triangle closed, the line open);
   "to leaves" turns the triangle into leaves and undo brings the exact one back. */
T.current = 'exact shapes';
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
T.current = 'combining exact shapes';
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

await T.finish();
