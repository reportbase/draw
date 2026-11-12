// Smoke test, part "motion": physical motions, eases and handles, chains, contact and emitters, the physics by hand, gravity and wind, the streamed
// AI reply, the scene link written by the editor, explainers in the editor, plots, ins and outs, labels into labels.
//
//   node tests/motion.mjs            this part alone (QUICK=1, ONLY='a|b', BASE_URL and SETTLE_MS as for npm test)
//   npm test                         every part, by tests/smoke.mjs
//
// Cut from tests/smoke.mjs (12 Nov 2026) as it stood: the checks and their comments are unchanged. What every
// part needs (the server, the browser, step, the failures and how a run ends) is tests/harness.mjs.

import { begin } from './harness.mjs';

const T = await begin('motion');
const { base, browser, failures, step } = T;

/* PHYSICAL MOTIONS (draw.html). A ball drawn resting on the ground, bouncing 2 of its heights: at the start of
   the loop it sits on the ground squashed (wider than tall by the squash, 1.3 / 0.7), half way it is up, round again,
   its bottom two of its heights above the ground; a sign hung from its top swings 30° either side, its top staying
   put; both kept through the scene link, and the ball exact. */
T.current = 'motions';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const before = failures.length;
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[motions] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><circle cx="100" cy="260" r="20" fill="#e05a6a"/><rect x="290" y="40" width="20" height="100" fill="#4f8fd6"/><rect x="0" y="280" width="400" height="10" fill="#3a3"/></svg>';
    const open = async url => {
      await mp.goto(url, { waitUntil: 'load' });
      await mp.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__box.morph(), null, { timeout: 60000 });
      await mp.waitForTimeout(400);
    };
    await open(scene({ name: 'motions', svg, play: false, morphs: [{ keys: [0], motion: { kind: 'bounce', amount: 2, squash: 0.3 } }, { keys: [1], motion: { kind: 'swing', amount: 30, pivot: 'top' } }] }));
    const at = async t => {
      await mp.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t);
      await mp.waitForTimeout(150);
      const k = await mp.evaluate(() => window.__animSketch());
      const box = id => { const m = k.svg.match(new RegExp('id="' + id + '"[^>]* d="M([^"]*)"')); const pts = m[1].replace(/ Z$/, '').split(' L').map(p => p.split(' ').map(Number)); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
      return { ball: box('s0'), sign: box('s1'), ground: box('s2'), k };
    };
    const a = await at(0), b = await at(0.5), c = await at(0.25);
    const asp = q => (q.x1 - q.x0) / (q.y1 - q.y0);
    const lift = (b.ground.y0 - b.ball.y1) / (b.ball.y1 - b.ball.y0);
    if (Math.abs(asp(a.ball) - 1.3 / 0.7) > 0.08 || Math.abs(a.ground.y0 - a.ball.y1) > 1.5 || Math.abs(asp(b.ball) - 1) > 0.04 || Math.abs(lift - 2) > 0.06)
      throw new Error('the bounce: ' + JSON.stringify({ squash: asp(a.ball), onGround: a.ground.y0 - a.ball.y1, round: asp(b.ball), lift }));
    const sw = (c.sign.x1 - c.sign.x0) / (a.sign.x1 - a.sign.x0), want = (20 * Math.cos(Math.PI / 6) + 100 * Math.sin(Math.PI / 6)) / 20;
    if (Math.abs(sw - want) > 0.15 || Math.abs(a.sign.x1 - a.sign.x0 - (b.sign.x1 - b.sign.x0)) > 1)
      throw new Error('the swing: width ' + sw.toFixed(3) + ' of its rest at a quarter loop, not ' + want.toFixed(3));
    const d = await mp.evaluate(() => window.__box.morphDiag().map(q => q.exact));
    if (!d.every(Boolean)) throw new Error('the motions turned the shapes into leaves');
    // a fall from 3 heights, keeping half its speed: up there at the start, at rest on the ground by the end, and on
    // the ground (squashed) at the first landing, 1 / (1 + 2·0.5/0.5) = a third of the way through
    await open(scene({ name: 'fall', svg, play: false, morphs: [{ keys: [0], motion: { kind: 'fall', amount: 3, bounce: 0.5 } }, { keys: [1], motion: { kind: 'spring', amount: 0.3, along: 'y' } }] }));
    const f0 = await at(0), f1 = await at(1 / (3 * 0.98)), f2 = await at(0.999);
    const up = q => (q.ground.y0 - q.ball.y1) / (q.ball.x1 - q.ball.x0);
    if (Math.abs(up(f0) - 3) > 0.06 || up(f1) > 0.05 || asp(f1.ball) < 1.05 || up(f2) > 0.02)
      throw new Error('the fall: ' + JSON.stringify({ start: up(f0), landing: up(f1), squash: asp(f1.ball), end: up(f2) }));
    // a spring along y starts and ends where it was drawn
    if (Math.abs(f0.sign.y0 - (await at(0.999)).sign.y0) > 1.5) throw new Error('the spring does not come back to rest');
    const link = await mp.evaluate(async () => (await window.__sceneShare()).link);
    const m0 = f0.k.morphs.map(o => o.motion);
    await open(link);
    const m1 = (await mp.evaluate(() => window.__animSketch())).morphs.map(o => o.motion);
    if (JSON.stringify(m0) !== JSON.stringify(m1) || !m0[0] || m0[0].kind !== 'fall' || m0[1].kind !== 'spring') throw new Error('the motions through the link: ' + JSON.stringify([m0, m1]));
    await mp.close();
  } catch (e){
    failures.push(`[motions] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} physical motions: a bounce squashes on the ground and lifts two heights, a swing turns about its top`);
}

/* MORE PHYSICAL MOTIONS (draw.html): a bar 40 by 20 rolling π/2 of its widths across has turned a quarter turn (stood
   up, 20 by 40) and gone π/2 half-widths at a quarter loop; a post swaying 20° keeps its foot while its top leans
   10° at a quarter loop; a square popping in is next to nothing at the start and its size at the end; a hat riding
   a bouncing ball (its parent) goes up with it, two ball heights, and squashes with it on the ground; a ball thrown
   4 heights right and 1 up with its arc 1 height over that lands there and tops out 2 heights up; all kept through
   the scene link. */
T.current = 'motions 2';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const before = failures.length;
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[motions 2] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><circle cx="100" cy="260" r="20" fill="#e05a6a"/><rect x="290" y="40" width="20" height="100" fill="#4f8fd6"/><rect x="0" y="280" width="400" height="10" fill="#3a3"/><rect x="20" y="180" width="40" height="20" fill="#c84"/><rect x="200" y="100" width="30" height="30" fill="#93c"/><rect x="90" y="230" width="20" height="10" fill="#222"/></svg>';
    const open = async url => {
      await mp.goto(url, { waitUntil: 'load' });
      await mp.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__box.morph(), null, { timeout: 60000 });
      await mp.waitForTimeout(400);
    };
    const at = async t => {
      await mp.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t);
      await mp.waitForTimeout(120);
      const k = await mp.evaluate(() => window.__animSketch());
      const box = id => { const m = k.svg.match(new RegExp('id="' + id + '"[^>]* d="M([^"]*)"')); const pts = m[1].replace(/ Z$/, '').split(' L').map(p => p.split(' ').map(Number)); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; };
      return { ball: box('s0'), post: box('s1'), ground: box('s2'), bar: box('s3'), sq: box('s4'), hat: box('s5'), k };
    };
    await open(scene({ name: 'motions 2', svg, play: false, morphs: [
      { keys: [0], motion: { kind: 'bounce', amount: 2, squash: 0.3 } }, { keys: [5], parent: 0 },
      { keys: [3], motion: { kind: 'roll', amount: Math.PI / 2 } }, { keys: [1], motion: { kind: 'sway', amount: 20 } },
      { keys: [4], motion: { kind: 'pop', amount: 0.5 } }] }));
    const a = await at(0), b = await at(0.25), c = await at(0.5), e = await at(0.999);
    const s = a.ground.w / 400;
    // the roll: a quarter turn and π/2 half-widths (20·π/2 viewBox units) across
    const cx = q => (q.x0 + q.x1) / 2;
    if (Math.abs(b.bar.w / b.bar.h - 0.5) > 0.03 || Math.abs((cx(b.bar) - cx(a.bar)) / s - 10 * Math.PI) > 1.5 || Math.abs(c.bar.w / c.bar.h - 2) > 0.1)
      throw new Error('the roll: ' + JSON.stringify({ stood: b.bar.w / b.bar.h, gone: (cx(b.bar) - cx(a.bar)) / s, half: c.bar.w / c.bar.h }));
    // the sway: the foot still, the top leaning tan 10° of its height
    const lean = (b.post.w - a.post.w) / s, want = 100 * Math.tan(10 * Math.PI / 180);
    if (Math.abs(b.post.y1 - a.post.y1) > 1 || Math.abs(b.post.x0 - a.post.x0) > 1 || Math.abs(lean - want) > 1.5)
      throw new Error('the sway: ' + JSON.stringify({ foot: b.post.y1 - a.post.y1, lean, want }));
    // the pop: nothing, then its size
    if (a.sq.w / s > 1 || Math.abs(e.sq.w / s - 30) > 0.8 || Math.abs(cx(e.sq) - cx(a.sq)) > 1)
      throw new Error('the pop: ' + JSON.stringify({ start: a.sq.w / s, end: e.sq.w / s }));
    // the hat on the bouncing ball: up two ball heights with it, squashed with it
    const hatUp = (a.hat.y1 - c.hat.y1) / c.ball.h - (a.ball.y1 - c.ball.y1) / c.ball.h;
    if (Math.abs((a.ground.y0 - c.ball.y1) / c.ball.h - 2) > 0.06 || Math.abs((c.ball.y0 - c.hat.y1) / s) > 1.5 || Math.abs(a.hat.h / c.hat.h - 0.7) > 0.06)
      throw new Error('the hat does not ride the bounce: ' + JSON.stringify({ lift: (a.ground.y0 - c.ball.y1) / c.ball.h, gap: (c.ball.y0 - c.hat.y1) / s, squash: a.hat.h / c.hat.h, hatUp }));
    const d = await mp.evaluate(() => window.__box.morphDiag().map(q => q.exact));
    if (!d.every(Boolean)) throw new Error('the motions turned the shapes into leaves');
    // the throw: lands 4 heights right and 1 up, its top 2 heights up
    await open(scene({ name: 'throw', svg, play: false, morphs: [{ keys: [0], motion: { kind: 'throw', to: [4, 1], amount: 1 } }] }));
    const t0 = await at(0), t1 = await at(0.999);
    let top = 0;
    for (let u = 0; u <= 1; u += 0.02) top = Math.max(top, (t0.ball.y1 - (await at(u)).ball.y1) / t0.ball.h);
    const land = [(cx(t1.ball) - cx(t0.ball)) / t0.ball.h, (t0.ball.y1 - t1.ball.y1) / t0.ball.h];
    if (Math.abs(land[0] - 4) > 0.03 || Math.abs(land[1] - 1) > 0.03 || Math.abs(top - 2) > 0.03)
      throw new Error('the throw: ' + JSON.stringify({ land, top }));
    const link = await mp.evaluate(async () => (await window.__sceneShare()).link);
    const m0 = t0.k.morphs.map(o => o.motion);
    await open(link);
    const m1 = (await mp.evaluate(() => window.__animSketch())).morphs.map(o => o.motion);
    if (JSON.stringify(m0) !== JSON.stringify(m1) || !m0[0] || m0[0].kind !== 'throw' || m0[0].to[0] !== 4) throw new Error('the throw through the link: ' + JSON.stringify([m0, m1]));
    await mp.close();
  } catch (e){
    failures.push(`[motions 2] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} more physical motions: a roll turns by its distance, a sway keeps its foot, a pop grows in, a hat rides a bounce, a throw lands`);
}

/* ANTICIPATION AND OVERSHOOT, and HANDLES FOR A MOTION (draw.html). A bar morphing right between two keys with
   'overshoot' goes past the second key and comes back to it exactly; with 'anticipate' it first goes left of the
   first; three keys with 'overshoot' on the first stretch go past the second along the line from the first (no
   drift up or down) and are exactly the second at its time. Then a thrown ball selected shows its handles: the
   landing point dragged lands where it was let go, a bounce's top likewise, a swing's pivot dragged to the bottom
   swings from there, and undo puts the throw back. */
T.current = 'eases and handles';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const before = failures.length;
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[eases and handles] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  try {
    const open = async url => {
      await mp.goto(url, { waitUntil: 'load' });
      await mp.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__box.morph(), null, { timeout: 60000 });
      await mp.waitForTimeout(400);
    };
    const at = async t => {
      await mp.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t);
      await mp.waitForTimeout(60);
      // the first morph's corners on the page (y up), their middle
      const m = await mp.evaluate(() => window.__box.morph()), n = m.leaves.length;
      return { x: m.leaves.reduce((a, v) => a + v, 0) / n, y: m.leavesY.reduce((a, v) => a + v, 0) / n };
    };
    const bars = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect x="30" y="40" width="40" height="20" fill="#e05a6a"/><rect x="230" y="40" width="40" height="20" fill="#e05a6a"/><rect x="230" y="220" width="40" height="20" fill="#e05a6a"/></svg>';
    const sweep = async (t0, t1) => { const out = []; for (let i = 0; i <= 30; i++) out.push(await at(t0 + (t1 - t0) * i / 30)); return out; };
    for (const ease of ['overshoot', 'anticipate']) {
      await open(scene({ name: ease, svg: bars, play: false, morphs: [{ keys: [0, 1], eases: [ease] }] }));
      const a = await at(0), b = await at(0.999), S = await sweep(0, 0.999), span = b.x - a.x;
      const past = Math.max(...S.map(p => p.x)) - b.x, back = a.x - Math.min(...S.map(p => p.x));
      if (!(span > 0) || Math.abs(b.y - a.y) > 0.5 || (ease === 'overshoot' ? !(past > 0.05 * span) || back > 0.5 : !(back > 0.05 * span) || past > 0.5))
        throw new Error(ease + ': ' + JSON.stringify({ span, past, back }));
    }
    await open(scene({ name: 'three', svg: bars, play: false, morphs: [{ keys: [0, 1, 2], times: [0, 0.4, 0.7], eases: ['overshoot', null, null] }] }));
    const k0 = await at(0), k1 = await at(0.4), S3 = await sweep(0, 0.4);
    const past3 = Math.max(...S3.map(p => p.x)) - k1.x, drift = Math.max(...S3.map(p => Math.abs(p.y - k0.y)));
    if (!(past3 > 0.05 * (k1.x - k0.x)) || drift > 1 || Math.abs(k1.y - k0.y) > 0.5)
      throw new Error('three keys overshooting: ' + JSON.stringify({ past3, drift, k0, k1 }));
    // the handles
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><circle cx="80" cy="200" r="20" fill="#e05a6a"/><circle cx="200" cy="200" r="20" fill="#4f8fd6"/><rect x="300" y="60" width="20" height="100" fill="#3a3"/></svg>';
    await open(scene({ name: 'handles', svg, play: false, morphs: [{ keys: [0], motion: { kind: 'throw', to: [3, 0], amount: 1.5 } }, { keys: [1], motion: { kind: 'bounce', amount: 1 } }, { keys: [2], motion: { kind: 'swing', amount: 20, pivot: 'top' } }] }));
    await mp.evaluate(() => window.__box.select([0, 1, 2]));
    await mp.waitForTimeout(300);
    const H = async () => (await mp.evaluate(() => window.__box.motionHandles()));
    const find = (h, run, part) => h.find(q => q.run === run).handles.find(q => q.part === part);
    let h = await H();
    if (h.length !== 3) throw new Error('handles for ' + h.length + ' morphs, not 3');
    const drag = async (p, dx, dy) => { await mp.mouse.move(p.x, p.y); await mp.mouse.down(); await mp.mouse.move(p.x + dx / 2, p.y + dy / 2, { steps: 3 }); await mp.mouse.move(p.x + dx, p.y + dy, { steps: 3 }); await mp.mouse.up(); await mp.waitForTimeout(150); };
    const to0 = find(h, 0, 'to'), toBefore = h[0].motion.to.slice();
    await drag(to0, 60, -40);
    h = await H();
    const to1 = find(h, 0, 'to');
    if (Math.hypot(to1.x - to0.x - 60, to1.y - to0.y + 40) > 1.5 || !(h[0].motion.to[0] > toBefore[0]) || !(h[0].motion.to[1] > toBefore[1]))
      throw new Error('the throw\'s landing handle: ' + JSON.stringify({ to0, to1, motion: h[0].motion }));
    const ht0 = find(h, 1, 'height');
    await drag(ht0, 0, -50);
    h = await H();
    if (Math.abs(find(h, 1, 'height').y - (ht0.y - 50)) > 1.5 || !(h[1].motion.amount > 1)) throw new Error('the bounce\'s height handle: ' + JSON.stringify(h[1]));
    const pv = find(h, 2, 'pivot'), end = find(h, 2, 'angle'); // the far end of the swing is by the bottom
    await drag(pv, end.x - pv.x, end.y - pv.y);
    h = await H();
    if (h[2].motion.pivot !== 'bottom' || h[2].motion.amount !== 20) throw new Error('the swing\'s pivot handle: ' + JSON.stringify(h[2].motion));
    // each drag one step: undo once and the pivot is back at the top, twice and the bounce's height too
    const motions = async () => (await mp.evaluate(() => window.__animSketch())).morphs.map(o => o.motion);
    await mp.click('#bUndo'); await mp.waitForTimeout(250);
    let m = await motions();
    if (m[2].pivot !== 'top' || !(m[1].amount > 1)) throw new Error('one undo after the handles: ' + JSON.stringify(m));
    await mp.click('#bUndo'); await mp.waitForTimeout(250);
    m = await motions();
    if (m[1].amount !== 1 || JSON.stringify(m[0].to) === JSON.stringify(toBefore)) throw new Error('two undos after the handles: ' + JSON.stringify(m));
    await mp.close();
  } catch (e){
    failures.push(`[eases and handles] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} anticipation and overshoot go past their keys and land on them; a motion's handles put it where they are let go, and undo takes them back`);
}

/* MOTIONS IN A ROW, CONTACT and EMITTERS (draw.html). A chain of a throw (4 heights right) then a roll (2 widths, one
   way): half way it has landed, at the end it is half as far again and turned by the roll's distance over its
   radius. A ball drawn above a table and set to fall onto it (by the table's number) ends resting on the table's top;
   one thrown onto it lands on the table's top at its middle; one rolled onto a block stops touching it. A drop with a
   drift and emit {count: 10} is ten morphs, each its own phase, the copies in the drawing, and the same scatter when
   opened again; the link written by the editor gives the chain and the contact back as numbers. */
T.current = 'chains, contact, emitters';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const before = failures.length;
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[chains, contact, emitters] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  try {
    const open = async url => {
      await mp.goto(url, { waitUntil: 'load' });
      await mp.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__box.morph(), null, { timeout: 60000 });
      await mp.waitForTimeout(400);
    };
    const setT = async t => { await mp.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t); await mp.waitForTimeout(80); };
    const first = async () => { const m = await mp.evaluate(() => window.__box.morph()), n = m.leaves.length; return { x: m.leaves.reduce((a, v) => a + v, 0) / n, y: m.leavesY.reduce((a, v) => a + v, 0) / n, turn: m.runs[0].turn }; };
    const boxes = async () => {
      const k = await mp.evaluate(() => window.__animSketch());
      const box = id => { const m = k.svg.match(new RegExp('id="' + id + '"[^>]* d="M([^"]*)"')); if (!m) return null; const pts = m[1].replace(/ Z$/, '').split(' L').map(p => p.split(' ').map(Number)); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
      return { box, k };
    };
    // a chain: thrown, then rolled one way
    const bar = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect x="40" y="200" width="40" height="40" fill="#e05a6a"/></svg>';
    await open(scene({ name: 'chain', svg: bar, play: false, morphs: [{ keys: [0], motion: { kind: 'chain', steps: [{ kind: 'throw', to: [4, 0], amount: 1.5 }, { kind: 'roll', amount: 2 }] } }] }));
    await setT(0); const c0 = await first(); await setT(0.5); const c1 = await first(); await setT(0.999); const c2 = await first();
    const ratio = (c2.x - c0.x) / (c1.x - c0.x);
    let dturn = (c2.turn - c0.turn) % (2 * Math.PI); const want = (-4) % (2 * Math.PI);
    const dd = Math.abs(((dturn - want) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
    if (Math.abs(ratio - 1.5) > 0.02 || Math.abs(c1.y - c0.y) > 1e-6 * Math.abs(c1.x - c0.x) + 1e-9 || dd > 0.02)
      throw new Error('the chain: ' + JSON.stringify({ ratio, dy: c1.y - c0.y, dturn, dd }));
    // contact: onto a table, a block
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect x="200" y="200" width="160" height="20" fill="#a8743c"/><circle cx="280" cy="80" r="20" fill="#e05a6a"/><circle cx="60" cy="180" r="20" fill="#4f8fd6"/><rect x="40" y="260" width="40" height="40" fill="#5a7d9a"/><rect x="520" y="230" width="30" height="70" fill="#444"/></svg>';
    await open(scene({ name: 'contact', svg, play: false, morphs: [{ keys: [1], motion: { kind: 'fall', bounce: 0.4, onto: 0 } }, { keys: [2], motion: { kind: 'throw', amount: 1, onto: 0 } }, { keys: [3], motion: { kind: 'roll', onto: 4 } }] }));
    await setT(0.999);
    let { box } = await boxes();
    const table = box('s0'), ball = box('s1'), thrown = box('s2'), u = (table.x1 - table.x0) / 160;
    if (Math.abs(ball.y1 - table.y0) > 1.5 * u) throw new Error('the fall onto the table rests ' + ((ball.y1 - table.y0) / u).toFixed(2) + ' off its top');
    if (Math.abs(thrown.y1 - table.y0) > 1.5 * u || Math.abs((thrown.x0 + thrown.x1) / 2 - (table.x0 + table.x1) / 2) > 1.5 * u)
      throw new Error('the throw onto the table: ' + JSON.stringify({ thrown, table }));
    await setT(0.5);
    ({ box } = await boxes());
    const rolled = box('s3'), block = box('s4');
    if (Math.abs(rolled.x1 - block.x0) > 1.5 * u) throw new Error('the roll onto the block stops ' + ((block.x0 - rolled.x1) / u).toFixed(2) + ' short of it');
    const link = await mp.evaluate(async () => (await window.__sceneShare()).link);
    const ms = (await mp.evaluate(() => window.__animSketch())).morphs.map(o => o.motion);
    if (!(ms[0].ground < -1) || ms[0].onto !== undefined || !Array.isArray(ms[1].to)) throw new Error('contact worked into numbers: ' + JSON.stringify(ms));
    await open(link);
    const ms2 = (await mp.evaluate(() => window.__animSketch())).morphs.map(o => o.motion);
    // worked out again on opening from the shapes as the link wrote them (to its rounding): the same to a ten-thousandth
    const near = (a, b) => typeof a === 'number' ? Math.abs(a - b) <= 1e-3 * Math.max(1, Math.abs(a)) : Array.isArray(a) ? Array.isArray(b) && a.length === b.length && a.every((v, i) => near(v, b[i]))
      : a && typeof a === 'object' ? b && typeof b === 'object' && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => near(a[k], b[k])) : a === b;
    if (!near(ms, ms2)) throw new Error('contact through the link: ' + JSON.stringify([ms, ms2]));
    // an emitter
    const rain = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect x="290" y="20" width="6" height="16" fill="#4f8fd6"/></svg>';
    const em = scene({ name: 'rain', svg: rain, play: false, morphs: [{ keys: [0], motion: { kind: 'drift', to: [0, -12], amount: 0.2 }, emit: { count: 10, spread: [30, 2], vary: 0.4, seed: 7 } }] });
    await open(em);
    const k1 = await mp.evaluate(() => window.__animSketch()), d1 = await mp.evaluate(() => window.__box.morphDiag());
    const phases = (await mp.evaluate(() => window.__box.morph())).runs.map(r => r.phase);
    if (k1.morphs.length !== 10 || d1.filter(q => q.inDrawing >= 0).length !== 10 || new Set(phases.map(p => p.toFixed(4))).size < 9)
      throw new Error('the emitter: ' + JSON.stringify({ morphs: k1.morphs.length, inDrawing: d1.filter(q => q.inDrawing >= 0).length, phases }));
    await open(em);
    const k2 = await mp.evaluate(() => window.__animSketch());
    if (k1.svg !== k2.svg) throw new Error('the emitter does not scatter the same way twice');
    await mp.close();
  } catch (e){
    failures.push(`[chains, contact, emitters] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} a chain plays its steps from where each ended; onto lands on a table and rolls up to a block; an emitter makes ten, the same way twice`);
}

/* THE PHYSICS BY HAND (draw.html, Tom: "1,2,3,4"). A scene opened is one undo history: nothing to undo straight
   after. A ball set onto a table follows it: the table dragged lower, the ball lands on its new top, and the link
   still names the table. The strip's scatter makes copies of the selected morph, all undone in one step. "then…"
   makes a chain of the fall and a roll, its steps a strip whose border drags their shares and whose second step
   shows the roll's handle; "× step" takes it out again, leaving the fall still on the table. */
T.current = 'physics by hand';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const before = failures.length;
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[physics by hand] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect x="200" y="200" width="160" height="20" fill="#a8743c"/><circle cx="280" cy="60" r="20" fill="#e05a6a"/></svg>';
    await mp.goto(scene({ name: 'by hand', svg, play: false, morphs: [{ keys: [1], motion: { kind: 'fall', bounce: 0.4, onto: 0 } }] }), { waitUntil: 'load' });
    await mp.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__box.morph(), null, { timeout: 60000 });
    await mp.waitForTimeout(400);
    if (!(await mp.$eval('#bUndo', b => b.disabled))) throw new Error('something to undo straight after opening a scene');
    const setT = async t => { await mp.evaluate(t => { const e = document.getElementById('morphT'); e.value = Math.round(t * 1000); e.dispatchEvent(new Event('input')); }, t); await mp.waitForTimeout(250); };
    const boxes = async () => {
      const k = await mp.evaluate(() => window.__animSketch());
      const box = id => { const m = k.svg.match(new RegExp('id="' + id + '"[^>]* d="M([^"]*)"')); const pts = m[1].replace(/ Z$/, '').split(' L').map(p => p.split(' ').map(Number)); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
      return { table: box('s0'), ball: box('s1') };
    };
    await setT(0.999);
    let b = await boxes();
    const u = (b.table.x1 - b.table.x0) / 160;
    if (Math.abs(b.ball.y1 - b.table.y0) > 1.5 * u) throw new Error('the ball does not rest on the table to start with');
    // drag the table down
    await mp.evaluate(() => window.__box.select([0]));
    const R = await mp.evaluate(() => window.__box.rings()[0]);
    const c = await mp.evaluate(([x, y]) => window.__box.toPx(x, y), [(Math.min(...R.x) + Math.max(...R.x)) / 2, (Math.min(...R.y) + Math.max(...R.y)) / 2]);
    await mp.mouse.move(c.x, c.y); await mp.mouse.down(); await mp.mouse.move(c.x, c.y + 30, { steps: 4 }); await mp.mouse.move(c.x, c.y + 60, { steps: 4 }); await mp.mouse.up();
    await mp.waitForTimeout(400);
    const R2 = (await mp.evaluate(() => window.__box.rings()))[0], moved = Math.max(...R.y) - Math.max(...R2.y); // page units, y up
    await setT(0.998); await setT(0.999);
    const b2 = await boxes(); // the sketch frames the drawing as it is now: the ball against the table's top there
    if (!(moved > 0.1) || Math.abs(b2.ball.y1 - b2.table.y0) > 1.5 * u)
      throw new Error('the ball did not follow the table: ' + JSON.stringify({ moved, off: (b2.ball.y1 - b2.table.y0) / u }));
    const d = await mp.evaluate(async () => (await window.__sceneShare()).d);
    if (!d.morphs[0].motion || d.morphs[0].motion.onto == null) throw new Error('the link forgot the table: ' + JSON.stringify(d.morphs[0].motion));
    // scatter copies of the ball, undone in one step
    const n0 = (await mp.evaluate(() => window.__box.morphDiag())).length;
    await mp.evaluate(() => window.__box.select([1]));
    await mp.waitForTimeout(300);
    await mp.fill('#mrCopies', '5');
    await mp.click('#mrEmit');
    await mp.waitForTimeout(300);
    const n1 = (await mp.evaluate(() => window.__box.morphDiag())).length;
    await mp.click('#bUndo'); await mp.waitForTimeout(300);
    const n2 = (await mp.evaluate(() => window.__box.morphDiag())).length;
    if (n1 !== n0 + 4 || n2 !== n0) throw new Error('scatter: ' + JSON.stringify({ n0, n1, n2 }));
    // a chain made in the strip
    await mp.evaluate(() => window.__box.select([1]));
    await mp.waitForTimeout(300);
    await mp.selectOption('#mrThen', 'roll');
    await mp.waitForTimeout(300);
    let m = (await mp.evaluate(() => window.__animSketch())).morphs[0].motion;
    if (m.kind !== 'chain' || m.steps.length !== 2 || m.steps[0].kind !== 'fall' || m.steps[1].kind !== 'roll') throw new Error('then… gave ' + JSON.stringify(m));
    const segs = await mp.$$('#mrSteps .mr-seg');
    if (segs.length !== 2 || await mp.$eval('#mrSteps', e => e.hidden)) throw new Error('the steps strip shows ' + segs.length);
    const cb = await mp.locator('#mrSteps .mr-cut').boundingBox(), tb = await mp.locator('#mrSteps').boundingBox();
    await mp.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await mp.mouse.down();
    await mp.mouse.move(tb.x + tb.width * 0.25, cb.y + cb.height / 2, { steps: 5 }); await mp.mouse.up();
    await mp.waitForTimeout(300);
    m = (await mp.evaluate(() => window.__animSketch())).morphs[0].motion;
    const ratio = m.steps[0].share / (m.steps[0].share + m.steps[1].share);
    if (Math.abs(ratio - 0.25) > 0.04) throw new Error('the border dragged to a quarter gives ' + ratio.toFixed(3));
    await mp.click('#mrSteps .mr-seg[data-i="1"]');
    await mp.waitForTimeout(300);
    const hs = await mp.evaluate(() => window.__box.motionHandles());
    if (!hs[0] || hs[0].handles.map(q => q.part).join() !== 'across') throw new Error('the second step\'s handles: ' + JSON.stringify(hs));
    await mp.click('#mrStepDel');
    await mp.waitForTimeout(300);
    m = (await mp.evaluate(() => window.__animSketch())).morphs[0].motion;
    if (m.kind !== 'fall' || !(m.ground < 0) || !(await mp.$eval('#mrSteps', e => e.hidden))) throw new Error('× step left ' + JSON.stringify(m));
    await mp.close();
  } catch (e){
    failures.push(`[physics by hand] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} a scene opens as one undo history; contact follows a table moved; scatter copies undo in one step; a chain made, reshared and unmade in the strip`);
}

/* THE MOTION'S PATH, CHAINS ON THE TIMELINE, GRAVITY AND WIND (draw.html, Tom: "1,2,3"). A ball thrown 4 heights
   right with its arc a height up: its path (the centre over a loop) tops out one height up and ends four across.
   Gravity 4 has it land half way through the loop and wait there. Wind to the right leans a swaying post right,
   to the left left. The timeline shows a chain's two steps along its row, and its border dragged to a quarter
   shares the cycle so. Gravity and wind come back through the link. */
T.current = 'path, timeline, weather';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const before = failures.length;
  const mp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  mp.on('pageerror', e => failures.push(`[path, timeline, weather] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect x="40" y="200" width="40" height="40" fill="#e05a6a"/><rect x="300" y="100" width="20" height="140" fill="#3a3"/><rect x="450" y="60" width="30" height="30" fill="#4f8fd6"/></svg>';
    const open = async url => {
      await mp.goto(url, { waitUntil: 'load' });
      await mp.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__box.morph(), null, { timeout: 60000 });
      await mp.waitForTimeout(400);
    };
    await open(scene({ name: 'weather', svg, play: false, morphs: [{ keys: [0], motion: { kind: 'throw', to: [4, 0], amount: 1 } }, { keys: [1], motion: { kind: 'sway', amount: 10 } },
      { keys: [2], motion: { kind: 'chain', steps: [{ kind: 'fall', amount: 2 }, { kind: 'roll', amount: 1 }] } }] }));
    const track = async i => { await mp.evaluate(i => window.__box.select([i]), i); await mp.waitForTimeout(200); return mp.evaluate(() => window.__box.motionTrack(8)); };
    let T = await track(0);
    const across = T[8][0] - T[0][0], up = Math.max(...T.map(p => p[1])) - T[0][1];
    if (Math.abs(across / up - 4) > 0.05 || Math.abs(T[4][1] - T[0][1] - up) > 0.01 * up) throw new Error('the throw\'s path: ' + JSON.stringify({ across, up, ratio: across / up }));
    const slide = async (id, v) => { await mp.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = String(v); e.dispatchEvent(new Event('input')); }, [id, v]); await mp.waitForTimeout(200); };
    await slide('morphGravity', 400);
    T = await track(0);
    if (Math.abs(T[4][0] - T[0][0] - across) > 0.01 * across || Math.abs(T[4][1] - T[0][1]) > 0.01 * up || Math.abs(T[6][0] - T[4][0]) > 1e-9)
      throw new Error('with gravity 4 the throw does not land half way and wait: ' + JSON.stringify(T.map(p => [+(p[0] - T[0][0]).toFixed(4), +(p[1] - T[0][1]).toFixed(4)])));
    await slide('morphGravity', 100);
    const lean = async w => { await slide('morphWind', w); const q = await track(1); return q[0][0]; };
    const x0 = await lean(0), xr = await lean(100), xl = await lean(-100);
    if (!(xr > x0 + 1e-6) || !(xl < x0 - 1e-6) || Math.abs((xr - x0) + (xl - x0)) > 1e-6 * Math.abs(xr - x0) + 1e-9) throw new Error('the wind: ' + JSON.stringify({ x0, xr, xl }));
    await slide('morphGravity', 250);
    const d = await mp.evaluate(async () => (await window.__sceneShare()).d);
    if (d.gravity !== 2.5 || d.wind !== -1) throw new Error('the weather in the link: ' + JSON.stringify({ gravity: d.gravity, wind: d.wind }));
    // the timeline's steps
    await mp.evaluate(() => window.__box.select([]));
    await mp.click('#bMorphTimeline'); await mp.waitForTimeout(300);
    const cuts = await mp.$$('#tlRows .tl-mcut'), segs = await mp.$$('#tlRows .tl-mseg');
    if (cuts.length !== 1 || segs.length !== 8) throw new Error('the timeline shows ' + segs.length + ' step pieces and ' + cuts.length + ' borders');
    const tr = await mp.locator('#tlRows .tl-track[data-r="2"]').boundingBox(), cb = await mp.locator('#tlRows .tl-mcut').boundingBox();
    await mp.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await mp.mouse.down();
    await mp.mouse.move(tr.x + tr.width * 0.25, cb.y + cb.height / 2, { steps: 5 }); await mp.mouse.up();
    await mp.waitForTimeout(300);
    const m = (await mp.evaluate(() => window.__animSketch())).morphs[2].motion, ratio = m.steps[0].share / (m.steps[0].share + m.steps[1].share);
    if (Math.abs(ratio - 0.25) > 0.03) throw new Error('the timeline border at a quarter gives ' + ratio.toFixed(3));
    await mp.close();
  } catch (e){
    failures.push(`[path, timeline, weather] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} a motion's path shows its arc; gravity lands a throw sooner; wind leans a sway its way; the timeline shares a chain's cycle`);
}

/* ANIMATE IT, END TO END, STREAMED (draw.html). The gateway is answered here with a reply streamed as the
   API streams it (server-sent events, the text in pieces), the way a real one arrives since a silent minute
   and a half closed the request with HTTP 524: the prompt typed, "animate it" pressed, and the morph lands.
   What was sent is checked too: streamed, the drawing as a picture and as its numbered shapes. */
T.current = 'animate streamed';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const sp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  sp.on('pageerror', e => failures.push(`[animate streamed] ${e.message}`));
  await sp.route(/fonts\.g/, r => r.abort());
  const before = failures.length;
  let sent = null,
    reply = JSON.stringify({ note: 'the sun rises', copies: [{ of: 0, dy: -300 }], morphs: [{ keys: [0, 3] }], loop: 3 });
  await sp.route('https://login.tangent.workers.dev/auth/me', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { email: 'test@example.com' }, quota: { remaining: 9, limit: 10 } }) }));
  await sp.route('https://login.tangent.workers.dev/v1/messages', r => {
    sent = JSON.parse(r.request().postData() || '{}');
    const pieces = reply.match(/.{1,40}/g);
    const ev = (t, d) => 'event: ' + t + '\ndata: ' + JSON.stringify(d) + '\n\n';
    const body = ev('message_start', { type: 'message_start', message: {} })
      + pieces.map(p => ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: p } })).join('')
      + ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' } }) + ev('message_stop', { type: 'message_stop' });
    r.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream', 'access-control-allow-origin': '*', 'x-gateway-quota-remaining': '8', 'x-gateway-quota-limit': '10' }, body });
  });
  try {
    await sp.addInitScript(() => { try { localStorage.setItem('tangent.login.v1', 'test-session'); } catch (_) {} });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="60" cy="140" r="20" fill="#f5c542"/><rect x="120" y="120" width="30" height="30" fill="#4287f5"/><polygon points="20,190 180,190 100,170" fill="#3a3"/></svg>';
    await sp.goto(scene({ name: 'streamed', svg, morphs: [] }), { waitUntil: 'load' });
    await sp.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__animSketch(), null, { timeout: 60000 });
    await sp.click('#bAi'); await sp.waitForTimeout(200);
    await sp.fill('#aiPrompt', 'the sun rises');
    await sp.click('#aiAnimate');
    await sp.waitForFunction(() => { const s = window.__animSketch(); return s && s.morphs.length === 1; }, null, { timeout: 15000 });
    const s = await sp.evaluate(() => window.__animSketch());
    const status = await sp.$eval('#aiStatus', e => e.textContent);
    if (!sent || sent.stream !== true || sent.system.indexOf('MORPHS') < 0 || !sent.messages[0].content.some(b => b.type === 'image') || !sent.messages[0].content.some(b => b.type === 'text' && b.text.indexOf('id="s0"') >= 0))
      throw new Error('the request: ' + JSON.stringify(sent).slice(0, 200));
    if (s.morphs[0].keys !== 2 || s.held !== s.n || !/the sun rises/.test(status) || !(await sp.$eval('#aiAnimChange', b => !b.disabled)))
      throw new Error('the reply landed as ' + JSON.stringify({ morphs: s.morphs, held: s.held, n: s.n, status }));
    // "animate it" keeps to the drawing: a shape the reply adds that moves nothing is left out
    const strict = await sp.evaluate(n => window.__animApply({ svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'><rect x='0' y='0' width='1000' height='1000' fill='#88ccee'/><circle cx='500' cy='500' r='40' fill='#ffffff'/></svg>",
      morphs: [{ keys: [n + 1], spin: 1 }] }, null, null, { strict: true }), s.n);
    const s2 = await sp.evaluate(() => window.__animSketch());
    if (strict.unused !== 1 || s2.n !== s.n + 1) throw new Error('animate it kept a shape that moved nothing: ' + JSON.stringify([strict, s.n, s2.n]));
    // MAKE A SCENE: words alone, the reply a whole drawing and its motion; it opens as a scene does, and a copy
    // lands where the reply's own box put it (300 up in a 1000 box is three tenths of the backdrop's height up)
    reply = JSON.stringify({ name: 'sunrise', note: 'the sun comes up',
      svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'><rect x='0' y='0' width='1000' height='1000' fill='#1b2440'/><circle cx='300' cy='800' r='60' fill='#ffcc33'/><rect x='0' y='800' width='1000' height='200' fill='#2f5d3a'/><circle cx='800' cy='700' r='30' fill='#ffffff'/></svg>",
      copies: [{ of: 1, dy: -300 }, { of: 3, dy: -300 }], morphs: [{ keys: [1, 4] }], loop: 5 });
    await sp.fill('#aiPrompt', 'a sunrise');
    await sp.click('#aiScene');
    await sp.waitForFunction(() => /sunrise/.test(document.getElementById('aiStatus').textContent), null, { timeout: 15000 });
    const sc = await sp.evaluate(() => window.__animSketch());
    if (sent.system.indexOf('ONE CLOSED OUTLINE PER ELEMENT') < 0 || sc.morphs.length !== 1 || sc.morphs[0].keys !== 2 || sc.held !== sc.n || Math.abs(sc.loop - 5) > 1e-9)
      throw new Error('the scene landed as ' + JSON.stringify({ morphs: sc.morphs, n: sc.n, held: sc.held, loop: sc.loop }));
    const box = id => { const m = sc.svg.match(new RegExp('id="' + id + '"[^>]* d="M([^"]*)"')); const pts = m[1].replace(/ Z$/, '').split(' L').map(p => p.split(' ').map(Number)); const ys = pts.map(p => p[1]); return [Math.min(...ys), Math.max(...ys)]; };
    const back = box('s0'), moon = box('s3'), moonUp = box('s4'), H = back[1] - back[0], rise = (moon[0] - moonUp[0]) / H;
    if (Math.abs(rise - 0.3) > 0.01) throw new Error('a copy 300 up in the reply\'s box landed ' + rise.toFixed(3) + ' of the backdrop up, not 0.3 ');
    await sp.close();
  } catch (e){
    failures.push(`[animate streamed] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} animate it, end to end, with the reply streamed`);
}

/* THE SCENE LINK, WRITTEN BY THE EDITOR (draw.html). A scene with a still riding a path round a parent that
   morphs, keys at their own times and eases, a clip that fades and a trail is written back out as a link; opened,
   every morph comes back with the same settings and the same shapes; the embed code is the editor as a player. And
   a morph made in the editor (the AI's copies) round-trips the same way. */
T.current = 'scene link out';
{
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const before = failures.length;
  const open = async url => {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    p.on('pageerror', e => failures.push(`[scene link out] ${e.message}`));
    await p.route(/fonts\.g/, r => r.abort());
    await p.goto(url, { waitUntil: 'load' });
    // when it does not come up, say which scene and what the page shows, not only that it timed out
    await p.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__box.morph(), null, { timeout: 60000 })
      .catch(async () => { throw new Error('the scene ' + url.slice(url.indexOf('#'), url.indexOf('#') + 24) + '… did not open: ' + await p.evaluate(() => JSON.stringify({ hash: location.hash.slice(0, 16), status: document.getElementById('status')?.textContent, morphs: window.__box && window.__box.morphDiag ? window.__box.morphDiag().length : null })).catch(x => 'page gone: ' + x.message)); });
    await p.waitForTimeout(400);
    return p;
  };
  const look = p => p.evaluate(() => { const s = window.__animSketch(); return { n: s.n, held: s.held, morphs: s.morphs.map(o => { const q = Object.assign({}, o); delete q.shape; return q; }) }; });
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><circle cx="200" cy="150" r="40" fill="#f2c14e"/><circle cx="200" cy="150" r="55" fill="#f29e4e"/>'
      + '<circle cx="300" cy="150" r="12" fill="#4f8fd6"/><circle cx="200" cy="150" r="100" fill="none" stroke="#888"/><rect x="20" y="20" width="40" height="40" fill="#b07de0"/><rect x="20" y="20" width="60" height="20" fill="#e05a6a"/></svg>';
    const a = await open(scene({ name: 'out', svg, loop: 5, ease: 'inout', morphs: [
      { keys: [0, 1], times: [0, 0.3], eases: ['out', 'in'], trail: { kind: 'echoes', len: 0.4 } },
      { keys: [2], path: 3, turn: false, rate: 2, phase: 0.25, parent: 0, laps: 2 },
      { keys: [4, 5], clip: { start: 0.2, len: 0.5, show: 'fade' }, fx: { kind: 'grow', amount: 0.3 } }] }));
    const A = await look(a);
    const s = await a.evaluate(async () => { const s = await window.__sceneShare(); return { link: s.link, embed: s.embed }; });
    if (!/\?embed=1#scene=z/.test(s.embed) || !/^<iframe /.test(s.embed) || !/#scene=z/.test(s.link) || /embed=1/.test(s.link)) throw new Error('the link and embed: ' + s.link.slice(0, 80) + ' / ' + s.embed.slice(0, 120));
    if (!(await a.$('#bMorphLink')) || !(await a.$('#bMorphEmbed'))) throw new Error('no link or embed button in the morph bar');
    const b = await open(s.link);
    const B = await look(b);
    if (JSON.stringify(A) !== JSON.stringify(B) || A.morphs.length !== 3 || A.morphs[1].parent !== 0 || !A.morphs[1].path || !A.morphs[2].clip)
      throw new Error('the scene came back as ' + JSON.stringify(B) + ', not ' + JSON.stringify(A));
    // morphs the editor made, not a link (the AI's copy and path, a rate set after), then out and back
    const e = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    e.on('pageerror', x => failures.push(`[scene link out] ${x.message}`));
    await e.route(/fonts\.g/, r => r.abort());
    await e.goto(scene({ name: 'made', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="60" cy="140" r="20" fill="#f5c542"/><rect x="120" y="120" width="30" height="30" fill="#4287f5"/><polygon points="20,190 180,190 100,170" fill="#3a3"/></svg>', morphs: [] }), { waitUntil: 'load' });
    // its three shapes in and the opening settled before anything is applied: a scene still opening replaces the
    // drawing when it lands, and what was applied before that goes with it (seen on a loaded CI runner)
    await e.waitForFunction(() => !/scene=/.test(location.hash) && window.__animSketch && window.__animSketch() && window.__animSketch().n === 3
      && /made/.test(document.getElementById('status')?.textContent || ''), null, { timeout: 60000 })
      .catch(async () => { throw new Error('the editor-made scene did not open: ' + await e.evaluate(() => document.getElementById('status')?.textContent).catch(x => 'page gone: ' + x.message)); });
    await e.waitForTimeout(400);
    await e.evaluate(() => window.__animApply({ copies: [{ of: 0, dy: -300, turn: 30 }], svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'><circle cx='640' cy='640' r='120' fill='none' stroke='#888'/></svg>",
      morphs: [{ keys: [0, 3] }, { keys: [1], path: 4, spin: 1 }], loop: 3 }));
    await e.evaluate(() => window.__animApply({ change: [{ morph: 0, rate: 3 }] }));
    const C = await look(e);
    const s2 = await e.evaluate(async () => (await window.__sceneShare()).link);
    const c = await open(s2);
    const D = await look(c);
    if (JSON.stringify(C) !== JSON.stringify(D) || C.morphs.length !== 2 || C.morphs[0].rate !== 3) throw new Error('an editor-made scene came back as ' + JSON.stringify(D) + ', not ' + JSON.stringify(C));
    // the startup maple, drawn here with no outline colour of its own, has the editor's gold outline, and the link says so
    const m = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    m.on('pageerror', x => failures.push(`[scene link out] ${x.message}`));
    await m.route(/fonts\.g/, r => r.abort());
    await m.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await m.waitForFunction(() => window.__animSketch && window.__animSketch(), null, { timeout: 60000 })
      .catch(async () => { throw new Error('the startup maple did not come up: ' + await m.evaluate(() => document.getElementById('status')?.textContent).catch(x => 'page gone: ' + x.message)); });
    const gold = await m.evaluate(async () => { window.__animApply({ copies: [{ of: 0, dx: 300 }], morphs: [{ keys: [0, 1] }] }); return /stroke="#d4a052"/.test((await window.__sceneShare()).d.svg); });
    if (!gold) throw new Error('the link dropped the outline the editor draws');
    await m.close();
    await a.close(); await b.close(); await c.close(); await e.close();
  } catch (e){
    failures.push(`[scene link out] ${e.message.split('\n')[0]}`);
  }
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} the editor writes its scene as a link and embed code, and it opens as it played`);
}

/* labs.html is generated from the lab drawer (tools/build-labs.mjs). Regenerate it here and
   compare: a lab added, renamed or re-described in draw.html without \`npm run labs\` fails. */
/* THE TVF PLAYER (player/tvf-player.js, built by tools/build-player.mjs from draw.html). The file on disk is what
   the build writes (else `npm run player`); gallery scenes opened in the editor, written as .tvfs and loaded by the
   player pose every morph as the editor does at six times through the loop, to the stored keys' rounding: leaves
   with a detail effect and with a lag, exact corners with physics and a chain, a path with parents, an emitter;
   and player.html plays a scene from a file, drawing it at two sizes. */
/* EXPLAINERS (draw.html: DRAWING A LINE ON; A CAMERA, AND STOPS). A scene of a line drawn on (an open exact line
   gone live as a line), a circle drawn on and filled, a box that fades, a camera that frames the line and then
   everything, and two stops. Drawn on: the share drawn follows the clip's window. The camera: scrubbing frames
   the line, then the whole. The embed waits at each stop and a click goes on. The scene link and the .tvfs
   carry it all, the player waits at the stops too, the SVG export moves its viewBox and draws its lines on, and
   a stop added on the timeline is one undo step. */
await step('explainers: drawn on, a camera, stops', async () => {
  const zlib = await import('node:zlib');
  const sc = { v: 1, name: 'explain', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><path d="M40 250 L120 120 L200 200" fill="none" stroke="#f2c14e" stroke-width="4"/><circle cx="300" cy="150" r="50" fill="#7c5cff"/><rect x="250" y="40" width="100" height="40" fill="#e05a6a"/></svg>',
    loop: 6, stops: [0.33, 0.66], play: false, t: 0,
    camera: [{ t: 0, fit: [0] }, { t: 0.3, fit: [0] }, { t: 0.45, fit: 'all' }],
    morphs: [{ keys: [0], clip: { start: 0, len: 0.3, show: 'draw' } }, { keys: [1], clip: { start: 0.35, len: 0.3, show: 'draw' } }, { keys: [2], clip: { start: 0.7, len: 0.25, show: 'fade' } }] };
  const link = new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(sc))).toString('base64url');
  const ep = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  ep.on('pageerror', e => failures.push(`[explainers] ${e.message}`));
  await ep.route(/fonts\.g/, r => r.abort());
  await ep.goto(link, { waitUntil: 'load' });
  await ep.waitForFunction(() => !/scene=/.test(location.hash) && window.__box && window.__box.morph(), null, { timeout: 60000 });
  await ep.waitForTimeout(300);
  const diag = await ep.evaluate(() => window.__box.morphDiag());
  if (diag.length !== 3 || !diag.every(r => r.exact && r.lazy)) throw new Error('the three did not go live as exact shapes: ' + JSON.stringify(diag));
  const at = t => ep.evaluate(t => { window.__box.seek(t); return { drawn: window.__box.drawn(), box: window.__box.viewBox() }; }, t);
  const a = await at(0.15), b = await at(0.5), c = await at(0.8);
  if (Math.abs(a.drawn[0] - 0.5) > 1e-9 || a.drawn[1] !== 0 || Math.abs(b.drawn[1] - 0.5) > 1e-9 || c.drawn[0] !== 1 || c.drawn[1] !== 1 || c.drawn[2] != null)
    throw new Error('drawn on: ' + JSON.stringify([a.drawn, b.drawn, c.drawn]));
  const wid = B => B[2] - B[0];
  if (!(wid(c.box) > 1.5 * wid(a.box))) throw new Error('the camera did not pull out from the line to everything: ' + JSON.stringify([a.box, c.box]));
  const d = await ep.evaluate(() => window.__box.tvfScene());
  if (d.camera.length !== 3 || d.stops.join() !== '0.33,0.66' || !d.morphs[0].open || d.morphs[1].open) throw new Error('the .tvfs: ' + JSON.stringify({ camera: d.camera.length, stops: d.stops, open: d.morphs.map(m => m.open) }));
  const svg = await ep.evaluate(() => window.__box.morphSvg({}));
  if (!/attributeName="viewBox"/.test(svg) || (svg.match(/attributeName="stroke-dashoffset"/g) || []).length !== 2) throw new Error('the svg export does not move its camera or draw its lines on');
  // the link round trip keeps the camera and the stops
  const back = await ep.evaluate(async () => (await window.__sceneShare()).link);
  const E1 = await ep.evaluate(() => window.__box.explain());
  const rp = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  rp.on('pageerror', e => failures.push(`[explainers: link back] ${e.message}`));
  await rp.route(/fonts\.g/, r => r.abort());
  await rp.goto(back, { waitUntil: 'load' });
  await rp.waitForFunction(() => !/scene=/.test(location.hash) && window.__box && window.__box.morph(), null, { timeout: 60000 });
  const E2 = await rp.evaluate(() => window.__box.explain());
  await rp.close();
  const same = E1.stops.join() === E2.stops.join() && E1.camera.length === E2.camera.length && E1.camera.every((k, i) => Math.abs(k.t - E2.camera[i].t) < 1e-3
    && k.box.every((v, j) => Math.abs(v - E2.camera[i].box[j]) < 2e-3 * wid(k.box)));
  if (!same) throw new Error('the link back gave ' + JSON.stringify(E2) + ', not ' + JSON.stringify(E1));
  // a stop added on the timeline is one undo step
  await ep.evaluate(() => { window.__box.seek(0.5); });
  await ep.click('#bMorphTimeline');
  await ep.click('#tlStop');
  const n1 = (await ep.evaluate(() => window.__box.explain())).stops.length;
  await ep.evaluate(() => document.getElementById('bUndo').click());
  await ep.waitForTimeout(250);
  const n2 = (await ep.evaluate(() => window.__box.explain())).stops.length;
  if (n1 !== 3 || n2 !== 2) throw new Error('a stop added and undone: ' + n1 + ' then ' + n2);
  await ep.close();
  // the embed waits at each stop, and a click goes on
  const em = await browser.newPage({ viewport: { width: 600, height: 400 } });
  em.on('pageerror', e => failures.push(`[explainers: embed] ${e.message}`));
  await em.route(/fonts\.g/, r => r.abort());
  await em.goto(link.replace('draw.html#', 'draw.html?embed=1#'), { waitUntil: 'load' });
  await em.waitForFunction(() => !/scene=/.test(location.hash) && window.__box && window.__box.morph(), null, { timeout: 60000 });
  await em.evaluate(() => window.__box.seek(0.3));
  await em.keyboard.press('ArrowRight');
  await em.waitForFunction(() => { const m = window.__box.morph(); return !m.play && Math.abs(m.t - 0.33) < 1e-9; }, null, { timeout: 10000 });
  await em.mouse.click(300, 200);
  await em.waitForFunction(() => { const m = window.__box.morph(); return !m.play && Math.abs(m.t - 0.66) < 1e-9; }, null, { timeout: 15000 });
  await em.close();
  // the player waits at the stops as well
  const pl = await browser.newPage();
  pl.on('pageerror', e => failures.push(`[explainers: player] ${e.message}`));
  await pl.goto(new URL('player/player.html', base).href, { waitUntil: 'load' });
  const r = await pl.evaluate(async d => {
    const ctl = TVFPlayer.play(document.getElementById('cv'), d, {});
    await ctl.ready;
    ctl.seek(0.3);
    await new Promise(r => setTimeout(r, 900));
    const one = { t: ctl.t, playing: ctl.playing, stop: ctl.stop };
    ctl.next();
    await new Promise(r => setTimeout(r, 200));
    return { one, two: { t: ctl.t, playing: ctl.playing } };
  }, d);
  await pl.close();
  if (r.one.t !== 0.33 || r.one.playing || r.one.stop !== 0 || !r.two.playing || !(r.two.t > 0.33)) throw new Error('the player at its stops: ' + JSON.stringify(r));
});

/* A SHAPE FROM A FORMULA, A CLIP'S OWN IN AND OUT, LABELS INTO LABELS. The plot language reads sums and functions of
   its own (eight kernels weighted by eight readings give the readings back at the leaves) and says what is wrong
   with a bad line; a scene's data-plot becomes a shape that keeps its program, through undo; a plot added from the
   panel's hook is updated in place. A line drawn on and then faded is unseen before, drawn while it comes in, and
   gone after it goes; "N = 8" turns into "N = 16" at its key's time; x_2 is set apart from x2. */
await step('plots, in and out, labels into labels', async () => {
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const pp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pp.on('pageerror', e => failures.push(`[plots] ${e.message}`));
  await pp.route(/fonts\.g/, r => r.abort());
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><path d="M50 250 L350 50" fill="none" stroke="#333" stroke-width="4"/>'
      + '<text x="40" y="60" font-size="28" font-family="sans-serif" fill="#222">N = 8</text><text x="40" y="60" font-size="28" font-family="sans-serif" fill="#222">N = 16</text>'
      + '<path data-plot="r = 60 + 10cos(5t)" data-cx="200" data-cy="150" fill="none" stroke="#7c5cff" stroke-width="3"/></svg>';
    await pp.goto(scene({ name: 'plots', svg, play: false, morphs: [
      { keys: [0], clip: { start: 0.1, len: 0.6, in: { kind: 'draw', len: 0.2 }, out: { kind: 'fade', len: 0.1 } } },
      { keys: [1, 2], times: [0, 0.5] }] }), { waitUntil: 'load' });
    await pp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    await pp.waitForFunction(() => !/scene=/.test(location.hash) && window.__box.morph(), null, { timeout: 15000 });
    await pp.waitForTimeout(800);
    const lang = await pp.evaluate(() => {
      const src = 'F(t) = 95 + 16cos(3t - 0.4) + 12cos(5t + 0.9) + 7cos(9t + 0.3)\nK(p, N) = sin(N p/2) cos(p/2) / (N sin(p/2))\n'
        + 'a(j) = (2j + 1)π/8\nr = sum(j, 0, 7, F(a(j)) K(t - a(j), 8))';
      const S = window.__plot.sample({ src, t0: 'π/8', t1: '2π + π/8', n: 8 }).pts,
        F = t => 95 + 16 * Math.cos(3 * t - 0.4) + 12 * Math.cos(5 * t + 0.9) + 7 * Math.cos(9 * t + 0.3);
      let err = 0;
      S.forEach((q, j) => { err = Math.max(err, Math.abs(Math.hypot(q[0], q[1]) - F((2 * j + 1) * Math.PI / 8))); });
      let msg = '';
      try { window.__plot.sample({ src: 'r = 2 +' }); } catch (e) { msg = e.message; }
      return { err, msg, n: S.length };
    });
    if (!(lang.err < 1e-9) || lang.n !== 8 || !lang.msg) throw new Error('the plot language: ' + JSON.stringify(lang));
    const ofs = await pp.evaluate(() => [...Array(40).keys()].map(i => window.__plot.of(i)).filter(Boolean).map(p => p.src));
    if (!ofs.includes('r = 60 + 10cos(5t)')) throw new Error('the scene\'s plot kept no program: ' + JSON.stringify(ofs));
    const i = await pp.evaluate(() => window.__plot.add({ src: 'r = cos(4t)', t1: '2π' }));
    await pp.evaluate(i => window.__plot.relay(i, { src: 'r = cos(3t)', t1: '2π' }), i);
    if (await pp.evaluate(i => window.__plot.of(i).src, i) !== 'r = cos(3t)') throw new Error('a plot was not updated in place');
    await pp.click('#bUndo');
    await pp.waitForTimeout(300);
    if (await pp.evaluate(i => window.__plot.of(i) && window.__plot.of(i).src, i) !== 'r = cos(4t)') throw new Error('undo did not bring the plot\'s first formula back');
    const fades = [];
    for (const t of [0.05, 0.2, 0.4, 0.65, 0.75]) {
      await pp.evaluate(t => window.__box.seek(t), t);
      await pp.waitForTimeout(60);
      fades.push(await pp.evaluate(() => window.__box.morph().runs.map(r => +(+r.fade).toFixed(2))));
    }
    // run 0 the line: unseen, drawn, drawn, fading, gone; the label N = 8 seen at 0.05 and gone by 0.65, N = 16 the other way
    const line = fades.map(f => f[0]);
    if (line.join() !== '0,1,1,0.5,0') throw new Error('a line drawn on and faded: ' + line.join());
    const n8 = fades.map(f => f[1]), last = fades.map(f => f[f.length - 1]);
    if (!(n8[0] === 1 && n8[4] === 0 && last[0] === 0 && last[4] === 1)) throw new Error('N = 8 into N = 16: ' + JSON.stringify([n8, last]));
    const sub = await pp.evaluate(() => {
      return { plain: window.__sceneTextBox('x2'), sub: window.__sceneTextBox('x_2') };
    });
    if (!(sub.sub[1] > sub.plain[1] + 2)) throw new Error('x_2 is not set lower than x2: ' + JSON.stringify(sub));
  } finally {
    await pp.close();
  }
});

await T.finish();
