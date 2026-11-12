// Smoke test, part "morph": the live morph: the timeline and recording, paths and trails, corners and timing, the animated gallery's examples,
// a morph's own settings, a scene's warnings, keys at chosen times, following, keys on the canvas, undo, animate it with AI.
//
//   node tests/morph.mjs            this part alone (QUICK=1, ONLY='a|b', BASE_URL and SETTLE_MS as for npm test)
//   npm test                         every part, by tests/smoke.mjs
//
// Cut from tests/smoke.mjs (12 Nov 2026) as it stood: the checks and their comments are unchanged. What every
// part needs (the server, the browser, step, the failures and how a run ends) is tests/harness.mjs.

import { begin, readFile, webmBlocks } from './harness.mjs';

const T = await begin('morph');
const { base, browser, failures } = T;

/* THE TIMELINE AND RECORDING A LOOP (draw.html). Three shapes morphed live: their keys' places as
   ticks on the track, a step to the next key landing on it exactly (the live shape is that key), a key
   made from the pose between two keys (the pose unchanged, four ticks), a key taken away, onion skins
   and the loop's length; then one loop recorded as a .gif (parsed: a frame for every step of a 2 s loop
   at 20 a second, looping) and, where the browser records, a .webm. Then the timeline is saved: a
   reload brings it back, and exit after it the three shapes. Then detail effects on one shape gone
   live: shimmer moving the edge and not the centroid, its loop meeting at its ends, grow starting from
   the base ellipse, and the effect saved. */
T.current = 'timeline and recording';
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
    if (await mp.evaluate(() => typeof VideoEncoder !== 'undefined' || typeof MediaRecorder !== 'undefined')) {
      const exact = await mp.evaluate(() => typeof VideoEncoder !== 'undefined');
      const [dv] = await Promise.all([mp.waitForEvent('download', { timeout: 60000 }), mp.evaluate(() => window.__box.recordVideo())]);
      const vid = await readFile(await dv.path());
      if (vid.length < 1000 || vid.readUInt32BE(0) !== 0x1A45DFA3) throw new Error('the video is not a webm: ' + vid.length + ' bytes');
      // FRAME-EXACT VIDEO: walk the webm's elements and count its frames, every one of a 2 s loop at 30
      if (exact) {
        const blocks = webmBlocks(vid);
        if (blocks.frames !== 60 || blocks.docType !== 'webm' || !blocks.firstKey) throw new Error('the frame-exact video holds ' + blocks.frames + ' frames (' + blocks.docType + '), not every frame of a 2 s loop at 30 a second');
      }
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

/* MOTION ALONG A PATH AND TRAILS (draw.html). A triangle goes live and a circle in the drawing
   becomes its path: the circle leaves the drawing, the triangle's centre is on the path at every t and
   the path's points round a circle, at an even speed; it turns with the path (half round at t = ½) and
   its loop meets at its ends. There and back reaches the far side at a quarter. Echoes and a ribbon draw
   a trail (the canvas changes); a reload keeps the path and the trail; exit puts the circle back. */
T.current = 'path and trails';
{
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[path] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    await mp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await mp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    await mp.evaluate(() => { const t = document.getElementById('tSvgExact'); t.checked = false; t.dispatchEvent(new Event('change')); });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><polygon points="40,20 70,80 10,80" fill="#4c8"/>'
      + '<circle cx="150" cy="100" r="90" fill="none" stroke="#888"/></svg>';
    await mp.setInputFiles('#fLoad', { name: 'two.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
    await mp.waitForTimeout(1200);
    await mp.keyboard.press('ControlOrMeta+a'); await mp.waitForTimeout(200);
    await mp.evaluate(() => window.__box.select([0]));
    await mp.evaluate(() => { document.getElementById('bMorphOpen').click(); document.getElementById('bMorphLive').click(); });
    await mp.waitForTimeout(300);
    await mp.evaluate(() => window.__box.select([1]));
    await mp.click('#bMorphPath');
    const m = () => mp.evaluate(() => window.__box.morph());
    const at = async t => { await mp.evaluate(t => { const r = document.getElementById('morphT'); r.value = Math.round(t * 1000); r.dispatchEvent(new Event('input')); }, t); return m(); };
    const mean = v => v.reduce((x, y) => x + y, 0) / v.length;
    let s = await m();
    if (!s || !s.path || !s.path.closed || (await mp.evaluate(() => window.__box.count())) !== 1) throw new Error('the circle did not become a closed path out of the drawing: ' + JSON.stringify(s && s.path));
    const pts = [];
    for (const t of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875]) {
      s = await at(t);
      const p = await mp.evaluate(t => window.__box.pathAt(t), t);
      if (Math.hypot(mean(s.leaves) - p.x, mean(s.leavesY) - p.y) > 1e-9) throw new Error('the shape\'s centre is not on the path at t ' + t);
      pts.push(p);
    }
    const cx = mean(pts.map(p => p.x)), cy = mean(pts.map(p => p.y)), rs = pts.map(p => Math.hypot(p.x - cx, p.y - cy));
    const gaps = pts.map((p, i) => Math.hypot(p.x - pts[(i + 1) % 8].x, p.y - pts[(i + 1) % 8].y));
    if (Math.max(...rs) / Math.min(...rs) > 1.02 || Math.max(...gaps) / Math.min(...gaps) > 1.02) throw new Error('the ride is not round the circle at an even speed: ' + rs.map(r => r.toFixed(3)) + ' / ' + gaps.map(g => g.toFixed(3)));
    const ang = l => Math.atan2(l.leavesY[0] - mean(l.leavesY), l.leaves[0] - mean(l.leaves));
    const s0 = await at(0), s5 = await at(0.5), s1 = await at(1);
    const turned = Math.abs(((ang(s5) - ang(s0) - Math.PI) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); // how far from a half turn
    if (turned > 0.1) throw new Error('the shape did not turn half round with the path: off by ' + turned);
    if (Math.max(...s0.leaves.map((v, i) => Math.abs(v - s1.leaves[i]))) > 1e-9) throw new Error('the ride\'s loop does not meet at its ends');
    await mp.selectOption('#morphPathMode', 'back');
    const b25 = await at(0.25), p50 = pts[4];
    if (Math.hypot(mean(b25.leaves) - p50.x, mean(b25.leavesY) - p50.y) > 1e-6) throw new Error('there and back is not at the far side at a quarter');
    await mp.selectOption('#morphPathMode', 'along');
    await at(0.3);
    const none = await mp.evaluate(() => window.__box.canvasUrl());
    await mp.selectOption('#morphTrail', 'ribbon');
    const ribbon = await mp.evaluate(() => window.__box.canvasUrl());
    await mp.selectOption('#morphTrail', 'echoes');
    const echoes = await mp.evaluate(() => window.__box.canvasUrl());
    if (ribbon === none || echoes === none || echoes === ribbon) throw new Error('a trail drew nothing');
    await mp.waitForTimeout(1200);
    await mp.reload(); await mp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 }); await mp.waitForTimeout(500);
    s = await m();
    if (!s || !s.path || s.trail !== 'echoes' || Math.abs(s.t - 0.3) > 1e-9) throw new Error('the path and trail did not come back from a reload: ' + JSON.stringify(s && { path: s.path, trail: s.trail, t: s.t }));
    const p3 = await mp.evaluate(() => window.__box.pathAt(0.3));
    if (Math.hypot(mean(s.leaves) - p3.x, mean(s.leavesY) - p3.y) > 1e-5) throw new Error('after a reload the shape is off its path');
    await mp.click('#bMorphExit'); await mp.waitForTimeout(300);
    if ((await mp.evaluate(() => window.__box.count())) !== 2) throw new Error('exit did not put the path\'s circle back');
  } catch (e){
    failures.push(`[path] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} motion along a path and trails`);
  await mp.close();
}

/* MORPHS THAT KEEP THEIR CORNERS, AND EASING AND HOLDS (draw.html). A square and a five-pointed star,
   exact shapes, morph live as an exact shape: the square given ten corners (all on its outline, its
   own four among them), the star's ten at its two radii, the pose exact (never leaves) between them.
   A hold rests on the key exactly and leaves the middle where it was; a key added and a pose kept stay
   exact; the animated svg's frames are the same twenty cubics each; a reload keeps the exact morph,
   the ease and the hold; exit puts both shapes back exact. With "keep corners" off they morph as leaves. */
T.current = 'corners and timing';
{
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[corners] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    await mp.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await mp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    const star = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 18 : 40; return (200 + r * Math.cos(a)).toFixed(3) + ',' + (60 + r * Math.sin(a)).toFixed(3); }).join(' ');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120"><rect x="20" y="20" width="80" height="80" fill="#48c"/><polygon points="${star}" fill="#c84"/></svg>`;
    await mp.setInputFiles('#fLoad', { name: 'sq.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
    await mp.waitForTimeout(1200);
    await mp.keyboard.press('ControlOrMeta+a'); await mp.waitForTimeout(300);
    const live = () => mp.evaluate(() => { document.getElementById('bMorphOpen').click(); document.getElementById('bMorphLive').click(); });
    await live(); await mp.waitForTimeout(300);
    const m = () => mp.evaluate(() => window.__box.morph());
    const at = async t => { await mp.evaluate(t => { const r = document.getElementById('morphT'); r.value = Math.round(t * 1000); r.dispatchEvent(new Event('input')); }, t); return m(); };
    let s = await at(0);
    if (!s || !s.exact || !s.lazy || s.leaves.length !== 10) throw new Error('the square and the star did not morph as an exact shape of ten corners: ' + JSON.stringify(s && { exact: s.exact, lazy: s.lazy, n: s.leaves.length }));
    const X = s.leaves, Y = s.leavesY, x0 = Math.min(...X), x1 = Math.max(...X), y0 = Math.min(...Y), y1 = Math.max(...Y), e = 1e-6;
    if (!X.every((x, i) => Math.abs(x - x0) < e || Math.abs(x - x1) < e || Math.abs(Y[i] - y0) < e || Math.abs(Y[i] - y1) < e)) throw new Error('a corner given to the square is off its outline');
    for (const [cx, cy] of [[x0, y0], [x0, y1], [x1, y0], [x1, y1]])
      if (!X.some((x, i) => Math.abs(x - cx) < e && Math.abs(Y[i] - cy) < e)) throw new Error('the square lost a corner of its own');
    const mid = await at(0.5);
    if (!mid.lazy || !mid.exact || mid.leaves.length !== 10) throw new Error('half way the pose is not an exact shape');
    s = await at(1);
    const mx = s.leaves.reduce((a, b) => a + b) / 10, my = s.leavesY.reduce((a, b) => a + b) / 10;
    const rs = s.leaves.map((x, i) => Math.hypot(x - mx, s.leavesY[i] - my)).sort((a, b) => a - b);
    if (Math.abs(rs[9] / rs[0] - 40 / 18) > 0.01 || Math.abs(rs[4] / rs[0] - 1) > 0.01) throw new Error('the star did not arrive with its points and dips: ' + rs.map(r => r.toFixed(3)));
    // EASING AND HOLDS: rest on a key exactly, the middle unmoved
    await mp.selectOption('#morphEase', 'inout');
    await mp.evaluate(() => { const a = document.getElementById('morphHold'); a.value = 40; a.dispatchEvent(new Event('input')); });
    const h0 = await at(0), h1 = await at(0.15), h5 = await at(0.5), h3 = await at(0.3);
    const diff = (a, b) => Math.max(...a.leaves.map((v, i) => Math.abs(v - b.leaves[i])), ...a.leavesY.map((v, i) => Math.abs(v - b.leavesY[i])));
    if (diff(h0, h1) > 1e-12) throw new Error('the hold did not rest on the key');
    if (diff(h5, mid) > 1e-9) throw new Error('easing moved the middle of the stretch');
    if (!(diff(h3, h0) > 1e-3) || !(diff(h3, mid) > 1e-3)) throw new Error('past the hold the blend did not move');
    await at(0.6);
    await mp.click('#bMorphAddKey');
    s = await m();
    if (s.K !== 3 || !s.exact) throw new Error('+ key did not make a third exact key');
    const n0 = await mp.evaluate(() => window.__box.count());
    await mp.click('#bMorphKeep');
    if ((await mp.evaluate(() => window.__box.count())) !== n0 + 1) throw new Error('keep did not drop a pose');
    const [dl] = await Promise.all([mp.waitForEvent('download', { timeout: 30000 }), mp.evaluate(() => document.getElementById('bMorphSvg').click())]);
    const anim = (await readFile(await dl.path())).toString();
    const vals = (anim.match(/attributeName="d"[^>]*values="([^"]*)"/) || [, ''])[1].split(';'); // the outline's own frames
    const counts = new Set(vals.map(v => (v.match(/C/g) || []).length));
    if (vals.length < 4 || counts.size !== 1 || !counts.has(20)) throw new Error('the animated svg\'s frames are not twenty cubics each: ' + [...counts]);
    await mp.waitForTimeout(1200);
    await mp.reload(); await mp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 }); await mp.waitForTimeout(500);
    s = await m();
    if (!s || !s.exact || !s.lazy || s.K !== 3 || s.ease !== 'inout' || Math.abs(s.hold - 0.4) > 1e-9) throw new Error('the exact morph, ease and hold did not come back from a reload: ' + JSON.stringify(s && { exact: s.exact, K: s.K, ease: s.ease, hold: s.hold }));
    await mp.click('#bMorphExit'); await mp.waitForTimeout(300);
    await mp.keyboard.press('ControlOrMeta+a'); await mp.waitForTimeout(300);
    const back = await mp.evaluate(() => window.__box.shapes());
    if (back.length !== 3 || back.some(g => !g)) throw new Error('exit did not leave the square, the star and the kept pose as exact shapes: ' + JSON.stringify(back.map(g => g && g.n)));
    await mp.evaluate(() => window.__box.select([0, 2]));
    await mp.evaluate(() => { const c = document.getElementById('tMorphCorners'); c.checked = false; c.dispatchEvent(new Event('change')); });
    await live(); await mp.waitForTimeout(300);
    s = await m();
    if (!s || s.exact) throw new Error('with keep corners off the shapes did not morph as leaves');
  } catch (e){
    failures.push(`[corners] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} morphs that keep their corners, easing and holds`);
  await mp.close();
}

/* THE ANIMATED GALLERY AND THE SCENE LINK (gallery/animated.html, draw.html#scene=). The page lists its examples, each
   with a link; three open live in the editor as they say (an exact morph of two keys, three shapes on one path,
   a leaf still with an effect); the showpieces do what they say (gears spinning in the ratio of their teeth about
   fixed axles, planets on orbits of their own lapping 5 to 1 times and kept through a reload, a ripple of staggered
   clocks and blending colours, a moon following the earth, a bee whose wings follow its body); and a link opened over a
   drawing of the user's asks first, and keeps the drawing when told to. */
T.current = 'examples';
{
  const xp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  xp.on('pageerror', e => failures.push(`[examples] ${e.message}`));
  await xp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    await xp.goto(new URL('gallery/animated.html', base).href, { waitUntil: 'load' });
    await xp.waitForFunction(() => window.__animated && document.querySelectorAll('.tile[data-href]').length === window.__animated.length, null, { timeout: 30000 });
    const links = await xp.$$eval('.tile[data-href]', ts => Object.fromEntries(ts.map(t => [t.id, t.dataset.href])));
    if (Object.keys(links).length < 8) throw new Error('the animated gallery lists ' + Object.keys(links).length + ' examples');
    let ep = null;
    // each in a page of its own: the editor restores the last example first, then opens the link
    const open = async id => {
      if (ep) await ep.close();
      ep = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      ep.on('pageerror', e => failures.push(`[examples] ${e.message}`));
      await ep.route(/fonts\.g/, r => r.abort());
      await ep.goto(links[id], { waitUntil: 'load' });
      await ep.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
      await ep.waitForFunction(() => !/scene=/.test(location.hash), null, { timeout: 15000 });
      await ep.waitForTimeout(1200);
      return ep.evaluate(() => { const m = window.__box.morph(); return m && { K: m.K, exact: m.exact, path: m.path, play: m.play, trail: m.trail, runs: window.__box.count() }; });
    };
    let s = await open('square-star');
    if (!s || s.K !== 2 || !s.exact || !s.play) throw new Error('square to star did not open as a live exact morph of two keys: ' + JSON.stringify(s));
    s = await open('procession');
    if (!s || !s.path || !s.path.closed || s.runs !== 3 || s.trail !== 'echoes') throw new Error('the procession did not open as three shapes on a closed path: ' + JSON.stringify(s));
    // VECTOR TEXT (29 Oct 2026, Tom: "Tvf would be good for vector text effects and morphs"): a word's letters, each its own
    // shape. SUNSET into ZENITH is six morphs of three keys (word, word, back), no letter with a hole to lose; the popping
    // word six one-key letters; the written word comes in as the editor's traced letters.
    s = await open('word-morph');
    if (!s || s.runs !== 7 || s.K !== 3 || !s.exact) throw new Error('SUNSET into ZENITH did not open as six exact letters (and the paper) of three keys: ' + JSON.stringify(s));
    s = await open('word-pop');
    if (!s || s.runs !== 7) throw new Error('the popping letters opened as ' + (s && s.runs) + ' shapes');
    s = await open('word-draw');
    if (!s || s.runs !== 6) throw new Error('the written word opened as ' + (s && s.runs) + ' shapes, not the paper and five letters');
    s = await open('shimmer');
    const fx = await ep.evaluate(() => document.getElementById('morphFx').value);
    if (!s || s.K !== 1 || s.exact || fx !== 'shimmer') throw new Error('the shimmering leaf did not open as a leaf still with shimmer: ' + JSON.stringify(s) + ' ' + fx);
    // THE SHOWPIECES, and what each morph has of its own
    const runsAt = async t => { await ep.evaluate(t => { const r = document.getElementById('morphT'); r.value = Math.round(t * 1000); r.dispatchEvent(new Event('input')); }, t); return ep.evaluate(() => window.__box.morph().runs); };
    const turnOf = r => Math.atan2(r.y0 - r.cy, r.x0 - r.cx);
    const dturn = (a, b) => { let d = turnOf(b) - turnOf(a); d -= 2 * Math.PI * Math.round(d / (2 * Math.PI)); return d; };
    // clockwork: eight stills spinning in the ratio of their teeth, each about a fixed centre
    s = await open('clockwork');
    let r0 = await runsAt(0), r1 = await runsAt(0.1);
    if (r0.length !== 8) throw new Error('clockwork opened with ' + r0.length + ' morphs');
    const spins = r0.slice(0, 4).map(r => r.spin), want = [0.25, -0.5, 0.375, -0.6];
    if (spins.some((v, i) => Math.abs(v - want[i]) > 1e-9)) throw new Error('the gears spin at ' + spins);
    for (let i = 0; i < 4; i++) {
      if (Math.hypot(r1[i].cx - r0[i].cx, r1[i].cy - r0[i].cy) > 1e-6) throw new Error('gear ' + i + ' moved off its axle');
      if (Math.abs(dturn(r0[i], r1[i]) - 2 * Math.PI * want[i] * 0.1) > 1e-3) throw new Error('gear ' + i + ' turned ' + dturn(r0[i], r1[i]));
    }
    // THE ANIMATED SVG, AS THE EDITOR PLAYS IT: the gears written once each and turned (a small file), the
    // orrery with as many frames as its fastest motion needs (the moon laps twelve times a loop) and its trails
    const svgOf = () => ep.evaluate(() => { const svg = window.__box.morphSvg({}); const d = new DOMParser().parseFromString(svg, 'image/svg+xml');
      return { bytes: svg.length, bad: !!d.querySelector('parsererror'), rotates: d.querySelectorAll('animateTransform[type="rotate"]').length,
        most: Math.max(0, ...[...d.querySelectorAll('animateTransform[type="translate"]')].map(a => a.getAttribute('values').split(';').length)),
        trails: d.querySelectorAll('#trails > *').length }; });
    let sv = await svgOf();
    if (sv.bad || sv.rotates < 4 || sv.bytes > 200000) throw new Error('the clockwork\'s svg: ' + JSON.stringify(sv));
    // orrery: each planet on its own orbit, lapping 5, 4, 3, 2, 1 times: back where it was a lap later; the sun has no trail
    s = await open('orrery');
    sv = await svgOf();
    if (sv.bad || sv.most < 97 || sv.trails < 7) throw new Error('the orrery\'s svg: ' + JSON.stringify(sv));
    r0 = await runsAt(0);
    const planets = r0.slice(1);
    const moon = r0[6];
    planets.length = 5;
    if (planets.some(r => !r.path) || planets.map(r => r.laps).join() !== '5,4,3,2,1' || r0[0].trail !== '') throw new Error('the orrery\'s planets: ' + JSON.stringify(r0.map(r => [r.path, r.laps, r.trail])));
    // the moon follows the earth (morph 3): always its orbit's radius from it, as the earth goes round the sun
    if (!moon || moon.parent !== 3) throw new Error('the moon does not follow the earth: ' + JSON.stringify(moon));
    const dist = r => Math.hypot(r[6].cx - r[3].cx, r[6].cy - r[3].cy);
    const rB = await runsAt(0.37), rC = await runsAt(0.81);
    const dA = dist(r0), dB = dist(rB), dC = dist(rC);
    if (Math.abs(dA - dB) > 1e-3 || Math.abs(dA - dC) > 1e-3) throw new Error('the moon wandered from the earth: ' + [dA, dB, dC]);
    // and its orbit's guide goes round with the earth: as far from it at every time, and not left where it was drawn
    const gd = r => Math.hypot(r[6].guide[0] - r[3].cx, r[6].guide[1] - r[3].cy);
    if (!r0[6].guide || Math.abs(gd(r0) - gd(rB)) > 1e-3 || Math.abs(gd(r0) - gd(rC)) > 1e-3 || !(Math.hypot(rB[6].guide[0] - r0[6].guide[0], rB[6].guide[1] - r0[6].guide[1]) > 0.05))
      throw new Error('the moon\'s orbit was not drawn round the earth: ' + JSON.stringify([r0[6].guide, rB[6].guide, gd(r0), gd(rB), gd(rC)]));
    await runsAt(0);
    r1 = await runsAt(0.2); // a whole lap for the first planet, not for the last
    if (Math.hypot(r1[1].cx - r0[1].cx, r1[1].cy - r0[1].cy) > 1e-3 || !(Math.hypot(r1[5].cx - r0[5].cx, r1[5].cy - r0[5].cy) > 0.05)) throw new Error('the planets do not keep their laps');
    const nOrrery = await ep.evaluate(() => window.__box.count());
    await ep.waitForTimeout(1200);
    await ep.reload(); await ep.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 }); await ep.waitForTimeout(600);
    const back = await ep.evaluate(() => window.__box.morph().runs);
    if (back.slice(1, 6).map(r => (r.path ? 'p' : '-') + r.laps).join() !== 'p5,p4,p3,p2,p1' || back[6].parent !== 3) throw new Error('a reload lost the planets\' own paths or the moon\'s earth: ' + JSON.stringify(back));
    await ep.click('#bMorphExit'); await ep.waitForTimeout(300);
    if ((await ep.evaluate(() => window.__box.count())) !== nOrrery + 6) throw new Error('exit did not put the six orbits back');
    // ripple: forty morphs on staggered clocks, their colour blending with their keys
    s = await open('ripple');
    r0 = await runsAt(0); r1 = await runsAt(0.25);
    if (r0.length !== 40 || new Set(r0.map(r => r.phase.toFixed(3))).size < 5) throw new Error('the ripple\'s clocks are not staggered');
    if (!r0.some((r, i) => r.fill !== r1[i].fill)) throw new Error('the ripple\'s colours did not change');
    // garden: the bee's wings and body on one path of their own, together
    s = await open('garden');
    r0 = await runsAt(0.37);
    const [wings, body] = r0.slice(-2);
    if (wings.parent !== 11 || !body.path || wings.rate !== 6 || Math.hypot(wings.cx - body.cx, wings.cy - body.cy) > 1e-3) throw new Error('the bee came apart: ' + JSON.stringify([wings, body]));
    // kite: a tail of six bows, each on a spring after the one above, and a cat facing the kite
    s = await open('kite');
    r0 = await runsAt(0.3);
    if (r0.length !== 8 || r0.slice(1, 7).some((q, i) => q.parent !== i || q.follow !== 'spring') || r0[7].look !== 0) throw new Error('the kite: ' + JSON.stringify(r0.map(q => [q.parent, q.follow, q.look])));
    // the sequences: the house's ten pieces each play once, the walls first and unseen before they rise; the seed's six
    s = await open('house');
    r0 = await runsAt(0);
    if (r0.length !== 10 || r0.some(q => !q.clip) || r0[1].fade !== 0 || r0[0].fade !== 0) throw new Error('the house: ' + JSON.stringify(r0.map(q => [q.clip, q.fade])));
    r1 = await runsAt(0.5);
    if (r1[1].fade !== 1 || r1[3].fade !== 1 || r1[7].fade !== 0) throw new Error('the house half way: ' + JSON.stringify(r1.map(q => q.fade)));
    s = await open('seed');
    r0 = await runsAt(0.1);
    if (r0.length !== 6 || r0[0].fade !== 1 || r0[4].fade !== 0) throw new Error('the seed: ' + JSON.stringify(r0.map(q => [q.clip, q.fade])));
    // over a drawing of the user's: asked first, and "keep my drawing" keeps it
    s = await open('shimmer');
    await ep.click('#bMorphKeep', { modifiers: ['Shift'] }); await ep.waitForTimeout(200);
    await ep.evaluate(() => { const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="40" height="40"/><rect x="60" y="60" width="30" height="30"/></svg>';
      return new Promise(res => { const dt = new DataTransfer(); dt.items.add(new File([svg], 'mine.svg', { type: 'image/svg+xml' })); const f = document.getElementById('fLoad'); f.files = dt.files; f.dispatchEvent(new Event('change')); setTimeout(res, 1200); }); });
    const mine = await ep.evaluate(() => window.__box.count());
    await ep.evaluate(h => { location.hash = h; }, new URL(links['orbit']).hash);
    await ep.waitForSelector('#confirmScrim.open', { timeout: 10000 });
    await ep.click('#confirmNo'); await ep.waitForTimeout(400);
    if ((await ep.evaluate(() => window.__box.count())) !== mine || (await ep.evaluate(() => window.__box.morph()))) throw new Error('"keep my drawing" did not keep it');
    await ep.close();
  } catch (e){
    failures.push(`[examples] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} the animated gallery and the scene link`);
  await xp.close();
}

/* THE MORPH'S OWN SETTINGS IN THE EDITOR, AND ONE MORPH RIDING ANOTHER (draw.html). Four live shapes and a line,
   opened from a scene link: selecting a live shape puts up the strip, with numbers on the shapes; rate and spin
   set there take; stagger spreads two morphs' phases; "ride the line" makes the selected line a path of their own
   and spread spaces them along it; a morph picked to follow another does not jump, and keeps its distance from
   it after; all of it comes back from a reload. */
T.current = 'morph settings';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[morph settings] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><circle cx="60" cy="60" r="20" fill="#e05a6a"/>'
      + '<rect x="140" y="40" width="40" height="40" fill="#4f8fd6"/><polygon points="260,40 290,90 230,90" fill="#4fbf8a"/>'
      + '<circle cx="340" cy="60" r="14" fill="#f2c14e"/><path d="M40 220 C 140 140 260 300 360 220" fill="none" stroke="#888"/></svg>';
    await mp.goto(scene({ name: 'settings', svg, play: false, morphs: [[0], [1], [2], [3]] }), { waitUntil: 'load' });
    await mp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    await mp.waitForFunction(() => !/scene=/.test(location.hash), null, { timeout: 15000 });
    await mp.waitForTimeout(1200);
    const runs = () => mp.evaluate(() => window.__box.morph().runs);
    // the live shapes are the first four in the drawing, the line the fifth
    await mp.evaluate(() => window.__box.select([0]));
    await mp.waitForTimeout(250);
    if (!(await mp.evaluate(() => document.getElementById('morphRunTool').classList.contains('open')))) throw new Error('selecting a live shape did not put up its strip');
    await mp.fill('#mrRate', '3'); await mp.dispatchEvent('#mrRate', 'change');
    await mp.fill('#mrSpin', '0.5'); await mp.dispatchEvent('#mrSpin', 'change');
    let r = await runs();
    if (r[0].rate !== 3 || r[0].spin !== 0.5 || r[1].rate !== 1) throw new Error('rate and spin did not take on the selected morph alone: ' + JSON.stringify(r.map(q => [q.rate, q.spin])));
    await mp.evaluate(() => window.__box.select([1, 2]));
    await mp.waitForTimeout(250);
    await mp.click('#mrStagger');
    r = await runs();
    if (Math.abs(r[1].phase - 0) > 1e-9 || Math.abs(r[2].phase - 0.5) > 1e-9) throw new Error('stagger gave phases ' + [r[1].phase, r[2].phase]);
    await mp.evaluate(() => window.__box.select([1, 2, 4]));
    await mp.waitForTimeout(250);
    await mp.click('#mrPath');
    await mp.click('#mrSpread');
    r = await runs();
    if (!r[1].path || !r[2].path || Math.abs((r[2].at || 0) - 0.5) > 1e-9 || (await mp.evaluate(() => window.__box.count())) !== 4) throw new Error('ride the line and spread: ' + JSON.stringify(r.map(q => [q.path, q.at])));
    // morph 4 follows morph 2 (on its path): no jump when picked, its distance kept after
    await mp.evaluate(() => window.__box.select([3]));
    await mp.waitForTimeout(250);
    const pre = (await runs())[3];
    await mp.selectOption('#mrParent', '1');
    const post = (await runs())[3];
    if (post.parent !== 1 || Math.hypot(post.cx - pre.cx, post.cy - pre.cy) > 1e-9) throw new Error('following made the shape jump: ' + JSON.stringify([pre, post]));
    const d = q => Math.hypot(q[3].cx - q[1].cx, q[3].cy - q[1].cy);
    const setT = t => mp.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t);
    await setT(0.3); const d1 = d(await runs()); await setT(0.7); const d2 = d(await runs());
    if (Math.abs(d1 - d2) > 1e-6) throw new Error('the follower did not keep its distance: ' + [d1, d2]);
    await mp.waitForTimeout(1200);
    await mp.reload(); await mp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 }); await mp.waitForTimeout(600);
    r = await runs();
    if (r[0].rate !== 3 || r[0].spin !== 0.5 || !r[1].path || r[3].parent !== 1 || Math.abs(r[2].phase - 0.5) > 1e-9) throw new Error('the settings did not come back from a reload: ' + JSON.stringify(r.map(q => [q.rate, q.spin, q.path, q.parent, q.phase])));
    await setT(0.3); const d3 = d(await runs());
    if (Math.abs(d3 - d1) > 1e-6) throw new Error('after a reload the follower is elsewhere: ' + [d1, d3]);
  } catch (e){
    failures.push(`[morph settings] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} the morph's own settings, and one morph riding another`);
  await mp.close();
}

/* SMOOTH CORNERS AND KEYS AT CHOSEN TIMES (draw.html, 25 Oct 2026). A square going to a circle drawn
   from 0° morphs with no kink at any corner once it leaves the square, matched corner to corner at
   45° (twice the corners); a rounded square going to a circle keeps its rounding. A morph's keys put
   at times of their own (from a scene link) are exact at those times, the bar's ticks are there, a
   key dragged on the strip's track moves, a stretch clicked takes the next ease, and all of it comes
   back from a reload and survives an added key. Then the animated gallery plays a tile in place, in
   the editor's embed, which leaves the drawing saved in the editor alone; one tile at a time. */
/* A SCENE'S QUIET FALLBACKS, SAID ALOUD (29 Oct 2026): a clip whose last key ends before its window, eases of the
   wrong count and a drawing past LAZY_MIN_SHAPES each leave a line in window.__sceneWarnings; a well-made scene none. */
T.current = "a scene's warnings";
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const wp = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  wp.on('pageerror', e => failures.push(`[scene warnings] ${e.message}`));
  await wp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  const sq = (x, y, c) => `<polygon points="${x},${y} ${x + 20},${y} ${x + 20},${y + 20} ${x},${y + 20}" fill="${c}"/>`;
  const three = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${sq(10, 10, 'red')}${sq(50, 10, 'blue')}${sq(50, 50, 'green')}</svg>`;
  const warnsOf = async o => {
    await wp.goto('about:blank');
    await wp.goto(scene(o), { waitUntil: 'load' });
    await wp.waitForFunction(() => !/scene=/.test(location.hash) && window.__box && window.__box.morph(), null, { timeout: 60000 });
    return wp.evaluate(() => window.__sceneWarnings || []);
  };
  try {
    const bad = await warnsOf({ name: 'bad', svg: three, morphs: [{ keys: [0, 1, 2], times: [0, 0.3, 0.5], eases: ['linear', 'linear'], clip: { start: 0.1, len: 0.8 } }] });
    if (!(bad.some(w => /eases dropped/.test(w)) && bad.some(w => /stretched to the window's end/.test(w))))
      failures.push(`[scene warnings] a clip ending early and eases of the wrong count: ${JSON.stringify(bad)}`);
    const good = await warnsOf({ name: 'good', svg: three, morphs: [{ keys: [0, 1, 2, 2], times: [0, 0.3, 0.5, 0.99], eases: ['linear', null, null, null], straight: true, clip: { start: 0.1, len: 0.8 } }] });
    if (good.length) failures.push(`[scene warnings] a well-made scene warned: ${JSON.stringify(good)}`);
    const many = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${Array.from({ length: 160 }, (_, i) => sq((i % 16) * 25, Math.floor(i / 16) * 25, 'red')).join('')}</svg>`;
    const big = await warnsOf({ name: 'big', svg: many, morphs: [[0]] });
    if (!big.some(w => /160 shapes/.test(w))) failures.push(`[scene warnings] 160 shapes: ${JSON.stringify(big)}`);
    console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} a scene's warnings (an early clip, eases of the wrong count, 160 shapes; none for a well-made one)`);
  } catch (e) {
    failures.push(`[scene warnings] ${e.message.split('\n')[0]}`);
  }
  await wp.close();
}

T.current = 'smooth corners and key times';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const kp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  kp.on('pageerror', e => failures.push(`[key times] ${e.message}`));
  await kp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  const setT = t => kp.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t);
  const ready = async () => {
    await kp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    await kp.waitForFunction(() => !/scene=/.test(location.hash) && window.__box.morph(), null, { timeout: 15000 });
    await kp.waitForTimeout(600);
  };
  try {
    const c4 = (cx, cy, r) => { const k = 0.5523 * r; return `M${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}Z`; };
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect x="20" y="20" width="80" height="80" fill="#4f8fd6"/><path d="${c4(160, 60, 40)}" fill="#e05a6a"/>`
      + `<rect x="220" y="20" width="80" height="80" rx="16" fill="#4fbf8a"/><path d="${c4(340, 60, 40)}" fill="#f2c14e"/></svg>`;
    await kp.goto(scene({ name: 'corners', svg, play: false, morphs: [[0, 1], [2, 3]] }), { waitUntil: 'load' });
    await ready();
    for (const t of [0.1, 0.5, 0.9]) {
      await setT(t);
      const k = await kp.evaluate(() => window.__box.kinks());
      if (k.length !== 2 || k.some(q => q.max > 0.01)) throw new Error('a kink at t = ' + t + ': ' + JSON.stringify(k));
    }
    await setT(0);
    const sq = (await kp.evaluate(() => window.__box.kinks()))[0];
    if (sq.n !== 8 || sq.bent !== 4) throw new Error('the square was not matched to the circle at 45° (8 corners, its own 4 sharp): ' + JSON.stringify(sq));
    // keys at chosen times
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect x="20" y="20" width="80" height="80" fill="#4f8fd6"/>'
      + '<polygon points="160,20 200,100 120,100" fill="#e05a6a"/><rect x="220" y="40" width="120" height="40" fill="#4fbf8a"/></svg>';
    await kp.goto(scene({ name: 'times', svg, play: false, morphs: [{ keys: [0, 1, 2], times: [0.1, 0.2, 0.7], eases: [null, 'inout', 'linear'] }] }), { waitUntil: 'load' });
    await ready();
    let m = await kp.evaluate(() => window.__box.morph());
    if (m.ticks.join() !== '100,200,700' || m.runs[0].times.join() !== '0.1,0.2,0.7') throw new Error('the keys\' times did not take: ' + JSON.stringify([m.ticks, m.runs[0].times]));
    for (const [t, k] of [[0.1, 0], [0.2, 1], [0.7, 2]]) {
      await setT(t);
      const L = (await kp.evaluate(() => window.__box.morph())).leaves, K = await kp.evaluate(k => window.__box.morphKey(k).x, k);
      if (L.length !== K.length || L.some((v, j) => Math.abs(v - K[j]) > 1e-9)) throw new Error('key ' + (k + 1) + ' is not itself at its time ' + t);
    }
    await kp.evaluate(() => window.__box.select([0]));
    await kp.waitForTimeout(300);
    const kb = await kp.locator('#mrKeys .mr-key[data-k="1"]').boundingBox(), tb = await kp.locator('#mrKeys').boundingBox();
    await kp.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2); await kp.mouse.down();
    await kp.mouse.move(tb.x + tb.width * 0.45, kb.y + kb.height / 2, { steps: 5 }); await kp.mouse.up();
    await kp.click('#mrKeys .mr-step[data-s="0"]');
    m = await kp.evaluate(() => window.__box.morph());
    if (Math.abs(m.runs[0].times[1] - 0.45) > 0.01 || m.runs[0].eases.join() !== 'linear,inout,linear') throw new Error('the strip\'s track: ' + JSON.stringify([m.runs[0].times, m.runs[0].eases]));
    await kp.waitForTimeout(1200);
    await kp.reload(); await kp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 }); await kp.waitForTimeout(700);
    m = await kp.evaluate(() => window.__box.morph());
    if (Math.abs(m.runs[0].times[1] - 0.45) > 0.01 || m.runs[0].eases.join() !== 'linear,inout,linear') throw new Error('the times did not come back from a reload: ' + JSON.stringify(m.runs[0]));
    await setT(0.5); await kp.click('#bMorphAddKey');
    m = await kp.evaluate(() => window.__box.morph());
    if (m.K !== 4 || Math.abs(m.runs[0].times[2] - 0.5) > 1e-9 || m.runs[0].eases.length !== 4) throw new Error('a key added between timed keys: ' + JSON.stringify([m.K, m.runs[0].times, m.runs[0].eases]));
    await kp.close();
    // the gallery plays a tile in place, and the drawing saved in the editor is left as it was
    const gp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    gp.on('pageerror', e => failures.push(`[key times] ${e.message}`));
    await gp.route(/fonts\.g/, r => r.abort());
    await gp.goto(new URL('gallery/animated.html', base).href, { waitUntil: 'load' });
    const saved = await gp.evaluate(() => localStorage.getItem('tangent.scene.v1'));
    await gp.evaluate(() => localStorage.setItem('tangent.scene.v1', 'the drawing in the editor'));
    await gp.waitForSelector('#orrery .play', { timeout: 15000 });
    // play: the animated SVG the editor makes, kept in the browser so a second visit makes none
    await gp.click('#orrery .play');
    await gp.waitForSelector('#orrery svg.anim', { timeout: 30000 });
    if ((await gp.$eval('#orrery .play', e => e.textContent)) !== 'stop' || !(await gp.$eval('#orrery svg.anim', e => e.querySelector('animate, animateTransform, animateMotion') != null))) throw new Error('play gave no moving SVG');
    await gp.reload({ waitUntil: 'load' });
    await gp.waitForSelector('#orrery .play', { timeout: 15000 });
    await gp.click('#orrery .play');
    await gp.waitForSelector('#orrery svg.anim', { timeout: 4000 });
    if ((await gp.$$eval('iframe', l => l.length)) !== 0) throw new Error('a kept SVG was made again by the editor');
    // live: the editor itself, one tile at a time
    await gp.click('#orrery .live');
    await gp.waitForSelector('#orrery iframe.player.on', { timeout: 30000 });
    if (await gp.$('#orrery svg.anim')) throw new Error('live left the SVG playing beside it');
    const fr = gp.frames().find(f => /embed=1/.test(f.url()));
    const pm = fr && await fr.evaluate(() => { const m = window.__box.morph(); return m && { play: m.play, runs: m.runs.length }; });
    if (!pm || !pm.play || pm.runs !== 7) throw new Error('the orrery did not play in its tile: ' + JSON.stringify(pm));
    if (await fr.evaluate(() => getComputedStyle(document.querySelector('.topbar') || document.body).display) !== 'none') throw new Error('the embed shows the editor\'s bar');
    await gp.click('#garden .live');
    await gp.waitForSelector('#garden iframe.player.on', { timeout: 30000 });
    if ((await gp.$$eval('iframe.player', l => l.length)) !== 1 || (await gp.$eval('#orrery .live', e => e.textContent)) !== 'live') throw new Error('two tiles played at once');
    await gp.waitForTimeout(1500);
    const after = await gp.evaluate(() => localStorage.getItem('tangent.scene.v1'));
    await gp.evaluate(v => v == null ? localStorage.removeItem('tangent.scene.v1') : localStorage.setItem('tangent.scene.v1', v), saved);
    if (after !== 'the drawing in the editor') throw new Error('a playing tile wrote over the drawing saved in the editor');
    await gp.close();
  } catch (e){
    failures.push(`[key times] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} smooth corner-keeping morphs, keys at chosen times, and tiles that play`);
}

/* THE SCENE'S TIMELINE, FOLLOWING LOOSELY AND FACING (draw.html, 25 Oct 2026). The timeline panel shows a
   row per live morph with its keys where they land on the shared clock (a morph at rate 2, phase ¼ shows its
   keys twice, a quarter-lap early); dragging a key there retimes it, dragging along the ruler scrubs, a row's
   number selects that morph. A follower on lag is where tight following would have put it a while ago; one on
   a spring departs from tight following and its loop still closes; a morph facing another keeps the same angle
   to it. The strip sets all three and a reload keeps them; the kite showpiece opens with its springs and its cat. */
T.current = 'timeline and following';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const fp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  fp.on('pageerror', e => failures.push(`[timeline] ${e.message}`));
  await fp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  const setT = t => fp.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t);
  const runs = () => fp.evaluate(() => window.__box.morph().runs);
  const ready = async () => {
    await fp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    await fp.waitForFunction(() => !/scene=/.test(location.hash) && window.__box.morph(), null, { timeout: 15000 });
    await fp.waitForTimeout(700);
  };
  try {
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect x="20" y="20" width="80" height="80" fill="#4f8fd6"/><polygon points="160,20 200,100 120,100" fill="#e05a6a"/>'
      + '<rect x="220" y="40" width="120" height="40" fill="#4fbf8a"/><circle cx="60" cy="200" r="30" fill="#f2c14e"/><rect x="140" y="170" width="60" height="60" fill="#b07de0"/></svg>';
    await fp.goto(scene({ name: 'tl', svg, play: false, morphs: [{ keys: [0, 1, 2] }, { keys: [3, 4], rate: 2, phase: 0.25 }] }), { waitUntil: 'load' });
    await ready();
    await fp.click('#bMorphTimeline');
    await fp.waitForTimeout(300);
    const lefts = await fp.$$eval('.tl-key', l => l.map(e => e.dataset.r + ':' + e.dataset.k + ':' + e.dataset.m + '@' + parseFloat(e.style.left).toFixed(1)));
    if (lefts.join() !== '0:0:0@16.7,0:1:0@50.0,0:2:0@83.3,1:0:0@37.5,1:0:1@87.5,1:1:0@37.5,1:1:1@87.5') throw new Error('the timeline\'s keys: ' + lefts.join());
    const tr = await fp.locator('.tl-track[data-r="0"]').boundingBox(), kb = await fp.locator('.tl-key[data-r="0"][data-k="1"]').boundingBox();
    await fp.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2); await fp.mouse.down();
    await fp.mouse.move(tr.x + tr.width * 0.6, kb.y + kb.height / 2, { steps: 6 }); await fp.mouse.up();
    let r = await runs();
    if (Math.abs(r[0].times[1] - 0.6) > 0.01) throw new Error('a key dragged on the timeline went to ' + r[0].times[1]);
    const rl = await fp.locator('#tlRuler').boundingBox();
    await fp.mouse.click(rl.x + rl.width * 0.3, rl.y + rl.height / 2);
    if (Math.abs((await fp.evaluate(() => window.__box.morph().t)) - 0.3) > 0.01) throw new Error('the ruler did not scrub');
    await fp.click('.tl-lab[data-r="1"]'); await fp.waitForTimeout(250);
    if ((await fp.evaluate(() => document.getElementById('mrWho').textContent)) !== 'morph 2') throw new Error('a row\'s number did not select its morph');
    // following: tight, lag and spring, and facing
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><circle cx="300" cy="150" r="20" fill="#4f8fd6"/><rect x="330" y="140" width="20" height="20" fill="#e05a6a"/>'
      + '<path d="M300 150 L 200 50 L 100 150 L 200 250 Z" fill="none" stroke="#888"/><polygon points="190,140 215,150 190,160" fill="#4fbf8a"/></svg>';
    const follow = async f => {
      await fp.goto(scene({ name: 'follow', svg, play: false, morphs: [{ keys: [0], path: 2, turn: false }, { keys: [1], parent: 0, follow: f }, { keys: [3], look: 0 }] }), { waitUntil: 'load' });
      await ready();
      const out = [];
      for (const t of [0, 0.1, 0.3, 0.55, 0.8, 0.999]) { await setT(t); out.push(await runs()); }
      return out;
    };
    const tight = await follow(undefined), lag = await follow({ kind: 'lag', amount: 0.4 }), spring = await follow({ kind: 'spring', amount: 0.5 });
    // lag 0.4 is a tenth of a loop: at t the follower is where tight following put it at t − 0.1
    if (Math.hypot(lag[1][1].cx - tight[0][1].cx, lag[1][1].cy - tight[0][1].cy) > 1e-6) throw new Error('lag is not tight following a tenth of a loop ago');
    const off = spring.map((q, i) => Math.hypot(q[1].cx - tight[i][1].cx, q[1].cy - tight[i][1].cy));
    if (!(Math.max(...off) > 1e-3)) throw new Error('the spring follows as tightly as tight');
    if (Math.hypot(spring[5][1].cx - spring[0][1].cx, spring[5][1].cy - spring[0][1].cy) > 0.02) throw new Error('the spring\'s loop does not close');
    const facing = tight.map(q => { const d = Math.atan2(q[0].cy - q[2].cy, q[0].cx - q[2].cx), a = q[2].turn - d; return Math.atan2(Math.sin(a), Math.cos(a)); });
    if (facing.some(a => Math.abs(a - facing[0]) > 1e-6) || Math.abs(tight[0][2].turn - tight[2][2].turn) < 0.05) throw new Error('the triangle does not keep facing the circle: ' + facing);
    // set from the strip, and kept through a reload
    await fp.goto(scene({ name: 'strip', svg, play: false, morphs: [{ keys: [0], path: 2, turn: false }, { keys: [1], parent: 0 }, { keys: [3] }] }), { waitUntil: 'load' });
    await ready();
    await fp.evaluate(() => window.__box.select([1])); await fp.waitForTimeout(250);
    await fp.selectOption('#mrFollow', 'spring');
    await fp.evaluate(() => window.__box.select([2])); await fp.waitForTimeout(250);
    await fp.selectOption('#mrLook', '0');
    r = await runs();
    if (r[1].follow !== 'spring' || r[2].look !== 0) throw new Error('the strip did not set following and facing: ' + JSON.stringify(r.map(q => [q.follow, q.look])));
    await fp.waitForTimeout(1200);
    await fp.reload(); await fp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 }); await fp.waitForTimeout(700);
    r = await runs();
    if (r[1].follow !== 'spring' || r[2].look !== 0) throw new Error('a reload lost following and facing: ' + JSON.stringify(r.map(q => [q.follow, q.look])));
    await fp.close();
  } catch (e){
    failures.push(`[timeline] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} the scene's timeline, following loosely and facing`);
}

/* EDITING ON THE CANVAS, DRAWING A PATH, PAIRING CORNERS, PLAYING ONCE (draw.html, 26 Oct 2026). A live shape
   dragged at a key's time moves that key and adds none; dragged between keys it adds a key there and the others
   keep their times. "draw path" plays the morph while a stroke on the canvas becomes its own (closed) path, and
   no shape is drawn. "corners ▶" turns the key's corners a place. "in turn" plays three morphs once each, one after
   another: each holds its first key before its window and its last after; a clip's bar drags; a reload keeps it. */
T.current = 'canvas keys';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const cp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  cp.on('pageerror', e => failures.push(`[canvas keys] ${e.message}`));
  await cp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  const setT = t => cp.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t);
  const ready = async () => {
    await cp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    await cp.waitForFunction(() => !/scene=/.test(location.hash) && window.__box.morph(), null, { timeout: 15000 });
    await cp.waitForTimeout(700);
  };
  const drag = async (from, dx, dy) => { await cp.mouse.move(from.x, from.y); await cp.mouse.down(); await cp.mouse.move(from.x + dx, from.y + dy, { steps: 6 }); await cp.mouse.up(); await cp.waitForTimeout(250); };
  const centrePx = () => cp.evaluate(() => { const r = window.__box.morph().runs[0]; return window.__box.toPx(r.cx, r.cy); });
  try {
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect x="20" y="20" width="80" height="80" fill="#4f8fd6"/><polygon points="160,20 200,100 120,100" fill="#e05a6a"/><rect x="220" y="40" width="120" height="40" fill="#4fbf8a"/></svg>';
    await cp.goto(scene({ name: 'edit', svg, play: false, morphs: [[0, 1, 2]] }), { waitUntil: 'load' });
    await ready();
    await setT(1 / 6);
    const k0 = await cp.evaluate(() => window.__box.morphKey(0).x);
    await cp.evaluate(() => window.__box.select([0])); await cp.waitForTimeout(200);
    await drag(await centrePx(), 60, 0);
    let m = await cp.evaluate(() => window.__box.morph());
    const k0b = await cp.evaluate(() => window.__box.morphKey(0).x);
    const dxs = k0b.map((v, i) => v - k0[i]);
    if (m.K !== 3 || !(dxs[0] > 0.05) || dxs.some(d => Math.abs(d - dxs[0]) > 1e-6)) throw new Error('an edit at key 1 did not move key 1: ' + JSON.stringify([m.K, dxs]));
    await setT(0.3);
    await drag(await centrePx(), 0, 50);
    m = await cp.evaluate(() => window.__box.morph());
    if (m.K !== 4 || Math.abs(m.runs[0].times[1] - 0.3) > 1e-3 || Math.abs(m.runs[0].times[0] - 1 / 6) > 1e-9 || Math.abs(m.runs[0].times[2] - 0.5) > 1e-9) throw new Error('an edit between keys: ' + JSON.stringify([m.K, m.runs[0].times]));
    // corners paired by hand
    await setT(0.5);
    const kk = await cp.evaluate(() => window.__box.morphKey(2).x);
    await cp.click('#mrPairNext');
    const kk2 = await cp.evaluate(() => window.__box.morphKey(2).x);
    if (Math.abs(kk2[0] - kk[1]) > 1e-9 || Math.abs(kk2[kk.length - 1] - kk[0]) > 1e-9) throw new Error('corners ▶ did not turn the key\'s corners a place');
    // a path drawn while it plays
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect x="20" y="20" width="40" height="40" fill="#4f8fd6"/><rect x="320" y="220" width="40" height="40" fill="#e05a6a"/></svg>';
    await cp.goto(scene({ name: 'draw', svg, play: false, morphs: [[0], [1]] }), { waitUntil: 'load' });
    await ready();
    const n0 = await cp.evaluate(() => window.__box.count());
    await cp.evaluate(() => window.__box.select([0])); await cp.waitForTimeout(250);
    await cp.click('#mrDraw');
    await cp.mouse.move(790, 400); await cp.mouse.down();
    for (let i = 1; i <= 40; i++) { const a = i / 40 * 2 * Math.PI; await cp.mouse.move(640 + 150 * Math.cos(a), 400 + 150 * Math.sin(a)); }
    await cp.mouse.up(); await cp.waitForTimeout(300);
    m = await cp.evaluate(() => window.__box.morph());
    if (!m.play || !m.runs[0].path || m.runs[1].path || (await cp.evaluate(() => window.__box.count())) !== n0) throw new Error('draw path: ' + JSON.stringify([m.play, m.runs.map(r => r.path), n0]));
    // a sequence: three morphs in turn
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect x="20" y="20" width="60" height="60" fill="#4f8fd6"/><circle cx="50" cy="200" r="30" fill="#4f8fd6"/>'
      + '<rect x="160" y="20" width="60" height="60" fill="#e05a6a"/><circle cx="190" cy="200" r="30" fill="#e05a6a"/><rect x="300" y="20" width="60" height="60" fill="#4fbf8a"/><circle cx="330" cy="200" r="30" fill="#4fbf8a"/></svg>';
    await cp.goto(scene({ name: 'seq', svg, play: false, morphs: [[0, 1], [2, 3], [4, 5]] }), { waitUntil: 'load' });
    await ready();
    await cp.click('#bMorphTimeline'); await cp.waitForTimeout(200);
    await cp.click('#tlTurn');
    const cys = async t => { await setT(t); return (await cp.evaluate(() => window.__box.morph().runs)).map(r => r.cy); };
    const a0 = await cys(0), a1 = await cys(0.2), a2 = await cys(0.5), a3 = await cys(0.95);
    const same = (p, q) => Math.abs(p - q) < 1e-6;
    if (!(same(a1[1], a0[1]) && same(a1[2], a0[2]) && !same(a1[0], a0[0]))) throw new Error('at 0.2 only the first should have moved: ' + JSON.stringify([a0, a1]));
    if (!(same(a2[0], a3[0]) && !same(a2[1], a0[1]) && same(a2[2], a0[2]))) throw new Error('at 0.5 the first done, the second moving, the third waiting: ' + JSON.stringify([a0, a2, a3]));
    if (same(a3[2], a0[2])) throw new Error('the third never moved');
    const bar = await cp.locator('.tl-clip[data-r="1"]').boundingBox(), tr = await cp.locator('.tl-track[data-r="1"]').boundingBox();
    await drag({ x: bar.x + bar.width / 2, y: bar.y + bar.height / 2 }, tr.width * 0.1, 0);
    m = await cp.evaluate(() => window.__box.morph());
    if (Math.abs(m.runs[1].clip.start - (1 / 3 + 0.1)) > 0.01 || Math.abs(m.runs[1].clip.len - 1 / 3) > 1e-6) throw new Error('the clip bar did not drag: ' + JSON.stringify(m.runs[1].clip));
    await cp.waitForTimeout(1200);
    await cp.reload(); await cp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 }); await cp.waitForTimeout(700);
    m = await cp.evaluate(() => window.__box.morph());
    if (!m.runs.every(r => r.clip) || Math.abs(m.runs[1].clip.start - (1 / 3 + 0.1)) > 0.01) throw new Error('a reload lost the clips: ' + JSON.stringify(m.runs.map(r => r.clip)));
    await cp.close();
  } catch (e){
    failures.push(`[canvas keys] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} keys edited on the canvas, a path drawn, corners paired, a sequence`);
}

/* UNDO THROUGH THE MORPHS, AND CLIPS THAT COME AND GO (draw.html, 26 Oct 2026). With two live morphs: a key's time
   dragged on the strip, a rate set, a key added by an edit on the canvas and the morphs put in turn each undo one
   step at a time, the morphs staying live with their shapes exact, back to before the morph began, and redo brings
   each back. A clip that fades is unseen before its window, part seen at its start, whole in its middle; one that
   comes "in" stays after; the svg animates their opacity. The two sequences open in their places. */
T.current = 'undo morphs';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const up = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  up.on('pageerror', e => failures.push(`[undo morphs] ${e.message}`));
  await up.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  const setT = t => up.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t);
  const ready = async () => {
    await up.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    await up.waitForFunction(() => !/scene=/.test(location.hash) && window.__box.morph(), null, { timeout: 15000 });
    await up.waitForTimeout(700);
  };
  const st = () => up.evaluate(() => { const m = window.__box.morph(), d = window.__box.morphDiag();
    return m ? { n: m.runs.length, K: m.runs.map(r => r.K).join(), t1: +m.runs[0].times[1].toFixed(3), clip: m.runs.map(r => r.clip ? r.clip.start.toFixed(2) : '-').join(), rate: m.runs[0].rate, exact: d.every(q => !q.exact || q.lazy) } : null; });
  try {
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect x="20" y="20" width="80" height="80" fill="#4f8fd6"/><polygon points="160,20 200,100 120,100" fill="#e05a6a"/>'
      + '<rect x="220" y="40" width="120" height="40" fill="#4fbf8a"/><circle cx="60" cy="200" r="30" fill="#f2c14e"/><rect x="140" y="170" width="60" height="60" fill="#b07de0"/></svg>';
    await up.goto(scene({ name: 'undo', svg, play: false, morphs: [[0, 1, 2], [3, 4]] }), { waitUntil: 'load' });
    await ready();
    const s0 = await st();
    await up.evaluate(() => window.__box.select([0])); await up.waitForTimeout(250);
    const kb = await up.locator('#mrKeys .mr-key[data-k="1"]').boundingBox(), tb = await up.locator('#mrKeys').boundingBox();
    await up.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2); await up.mouse.down(); await up.mouse.move(tb.x + tb.width * 0.6, kb.y + kb.height / 2, { steps: 5 }); await up.mouse.up();
    const s1 = await st();
    await up.fill('#mrRate', '2'); await up.dispatchEvent('#mrRate', 'change'); await up.waitForTimeout(800);
    const s2 = await st();
    await setT(0.2); // 0.4 on the morph's own clock (rate 2): between its keys, so the edit adds one
    const c = await up.evaluate(() => { const r = window.__box.morph().runs[0]; return window.__box.toPx(r.cx, r.cy); });
    await up.mouse.move(c.x, c.y); await up.mouse.down(); await up.mouse.move(c.x + 50, c.y, { steps: 5 }); await up.mouse.up(); await up.waitForTimeout(300);
    const s3 = await st();
    await up.click('#bMorphTimeline'); await up.waitForTimeout(200);
    await up.evaluate(() => window.__box.select([])); await up.waitForTimeout(200);
    await up.click('#tlTurn');
    const s4 = await st();
    const states = [s0, s1, s2, s3, s4], key = q => JSON.stringify(q);
    if (new Set(states.map(key)).size !== 5) throw new Error('the five states are not all different: ' + JSON.stringify(states));
    for (let i = 3; i >= 0; i--) {
      await up.evaluate(() => document.getElementById('bUndo').click()); await up.waitForTimeout(200);
      const q = await st();
      if (key(q) !== key(states[i])) throw new Error('undo ' + (4 - i) + ' gave ' + key(q) + ', not ' + key(states[i]));
    }
    for (let i = 1; i <= 4; i++) {
      await up.evaluate(() => document.getElementById('bRedo').click()); await up.waitForTimeout(200);
      const q = await st();
      if (key(q) !== key(states[i])) throw new Error('redo ' + i + ' gave ' + key(q) + ', not ' + key(states[i]));
    }
    // clips that come and go
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect x="20" y="20" width="60" height="60" fill="#4f8fd6"/><circle cx="50" cy="200" r="30" fill="#4f8fd6"/><rect x="160" y="20" width="60" height="60" fill="#e05a6a"/><circle cx="190" cy="200" r="30" fill="#e05a6a"/></svg>';
    await up.goto(scene({ name: 'shows', svg, play: false, morphs: [{ keys: [0, 1], clip: { start: 0, len: 0.5, show: 'fade' } }, { keys: [2, 3], clip: { start: 0.5, len: 0.5, show: 'in' } }] }), { waitUntil: 'load' });
    await ready();
    const fades = [];
    for (const t of [0, 0.04, 0.25, 0.6, 0.95]) { await setT(t); fades.push((await up.evaluate(() => window.__box.morph().runs)).map(r => r.fade)); }
    const ok = fades[0][0] === 0 && fades[1][0] > 0.2 && fades[1][0] < 0.8 && fades[2][0] === 1 && fades[3][0] === 0
      && fades[2][1] === 0 && fades[3][1] === 1 && fades[4][1] === 1;
    if (!ok) throw new Error('the clips\' fades: ' + JSON.stringify(fades));
    const op = await up.evaluate(() => (window.__box.morphSvg({}).match(/attributeName="opacity"/g) || []).length);
    if (op < 2) throw new Error('the svg has ' + op + ' opacity animations');
    await up.close();
  } catch (e){
    failures.push(`[undo morphs] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} undo through the morphs, and clips that come and go`);
}

/* ANIMATE IT WITH AI (draw.html). The gateway is not reached from here, so a reply is landed by hand (the
   same path the answer takes): the drawing goes out numbered in the 1000 box; a copy moved up becomes a key
   with its original, exact, and a circle in the reply's svg becomes the path a still rides; the whole reply
   is one undo step; "change it" changes a live morph's rate and phase and keeps its keys, and ends another;
   undo walks back through both. The panel's "change it" waits until something moves. */
T.current = 'animate with ai';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const ap = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  ap.on('pageerror', e => failures.push(`[animate with ai] ${e.message}`));
  await ap.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="60" cy="140" r="20" fill="#f5c542"/><rect x="120" y="120" width="30" height="30" fill="#4287f5"/><polygon points="20,190 180,190 100,170" fill="#3a3"/></svg>';
    await ap.goto(scene({ name: 'animate', svg, morphs: [] }), { waitUntil: 'load' });
    await ap.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__animSketch(), null, { timeout: 60000 });
    await ap.waitForTimeout(500);
    const S = () => ap.evaluate(() => window.__animSketch());
    const s0 = await S();
    if (s0.n !== 3 || !/id="s0"[^>]*fill="#f5c542"/.test(s0.svg) || !/viewBox="0 0 1000 1000"/.test(s0.svg)) throw new Error('the drawing as sent: ' + s0.svg.slice(0, 160));
    await ap.click('#bAi'); await ap.waitForTimeout(150);
    if (!(await ap.$eval('#aiAnimChange', b => b.disabled))) throw new Error('change it is offered with nothing moving');
    await ap.keyboard.press('Escape');
    const r = await ap.evaluate(() => window.__animApply({
      copies: [{ of: 0, dy: -300 }],
      svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'><circle cx='640' cy='640' r='120' fill='none' stroke='#888'/></svg>",
      morphs: [{ keys: [0, 3] }, { keys: [1], path: 4 }], loop: 3 }));
    const s1 = await S();
    if (r.made !== 2 || r.added !== 2 || s1.n !== 3 || s1.held !== 3 || !s1.play || Math.abs(s1.loop - 3) > 1e-9 || s1.morphs.length !== 2 || s1.morphs[0].keys !== 2 || !s1.morphs[1].path)
      throw new Error('the reply landed as ' + JSON.stringify({ r, n: s1.n, held: s1.held, play: s1.play, loop: s1.loop, morphs: s1.morphs }));
    // the circle path is 240 across in the 1000 box the drawing was sent in, which spans 200 of the drawing's own
    // 200 × 200 (its widest, 160, × 1.25): 48 of them, three tenths of the triangle's 160 (read off the scene link,
    // which writes the keys, the triangle and then the path)
    const wid = await ap.evaluate(async () => { const svg = (await window.__sceneShare()).d.svg;
      return [...svg.matchAll(/ d="([^"]*)"/g)].map(m => { const v = (m[1].match(/-?[0-9.]+/g) || []).map(Number), xs = v.filter((_, i) => i % 2 === 0); return Math.max(...xs) - Math.min(...xs); }); });
    if (wid.length !== 5 || Math.abs(wid[4] / wid[3] - 0.3) > 0.02) throw new Error('the reply\'s circle path landed ' + (wid[4] / wid[3]).toFixed(3) + ' of the triangle\'s width, not 0.3: ' + JSON.stringify(wid));
    const exact = await ap.evaluate(() => window.__box.morphDiag().map(q => q.exact));
    if (!exact.every(Boolean)) throw new Error('the morphs are not exact: ' + exact);
    const r2 = await ap.evaluate(() => window.__animApply({ change: [{ morph: 0, rate: 2, phase: 0.25 }, { morph: 1, end: true }] }));
    const s2 = await S();
    if (r2.changed !== 1 || r2.ended !== 1 || s2.morphs.length !== 1 || s2.morphs[0].rate !== 2 || s2.morphs[0].phase !== 0.25 || s2.morphs[0].keys !== 2)
      throw new Error('the change gave ' + JSON.stringify({ r2, morphs: s2.morphs }));
    const undo = async () => { await ap.evaluate(() => document.getElementById('bUndo').click()); await ap.waitForTimeout(250); return S(); };
    const u1 = await undo(), u2 = await undo();
    if (JSON.stringify(u1.morphs) !== JSON.stringify(s1.morphs) || u2.morphs.length !== 0 || u2.n !== 3 || u2.held !== 3)
      throw new Error('undo gave ' + JSON.stringify([u1.morphs, u2.morphs, u2.n, u2.held]));
    await ap.close();
  } catch (e){
    failures.push(`[animate with ai] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} animate it with ai: a reply lands as morphs, one undo step, and change it keeps the rest`);
}

await T.finish();
