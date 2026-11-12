// Smoke test, part "player": the player and what plays scenes: the embedded gallery, the TVF player, the played gallery, interactive scenes, touch
// and Lottie, the lottie page, the scrolling explainer, text in a scene and beats.
//
//   node tests/player.mjs            this part alone (QUICK=1, ONLY='a|b', BASE_URL and SETTLE_MS as for npm test)
//   npm test                         every part, by tests/smoke.mjs
//
// Cut from tests/smoke.mjs (12 Nov 2026) as it stood: the checks and their comments are unchanged. What every
// part needs (the server, the browser, step, the failures and how a run ends) is tests/harness.mjs.

import { begin, ROOT, readFile, readdir, join } from './harness.mjs';

const T = await begin('player');
const { base, browser, failures, step } = T;

/* THE EMBEDDED GALLERY (gallery/embedded.html). Its examples are animated.html's, copied unchanged between
   markers, and the two copies agree. One hidden editor turns every scene into its animated SVG; then every tile
   plays as SVG alone (SMIL, no script), those in view unpaused, no editor left on the page; a tile's svg is an
   <svg> with animations and its embed code an <iframe> of draw.html?embed=1 carrying the scene; "live" plays one
   tile in the editor itself, and scrolled away a tile's SVG pauses. */
T.current = 'embedded gallery';
{
  const before = failures.length;
  const eg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  eg.on('pageerror', e => failures.push(`[embedded] ${e.message}`));
  await eg.route(/fonts\.g/, r => r.abort());
  try {
    const A = await readFile(join(ROOT, 'gallery/animated.html'), 'utf8'), E = await readFile(join(ROOT, 'gallery/embedded.html'), 'utf8');
    const a0 = A.indexOf('// ── THE EXAMPLES (25 Oct 2026'), a1 = A.indexOf('// the settings as one line, the way the other pages show');
    const m = E.match(/\/\/ >>> copied from animated\.html, unchanged: EXAMPLES\n([\s\S]*?)\/\/ <<< end of EXAMPLES/);
    if (a0 < 0 || a1 < 0 || !m || m[1] !== A.slice(a0, a1)) throw new Error('the examples on embedded.html differ from animated.html\'s: npm run sync');
    await eg.goto(new URL('gallery/embedded.html', base).href, { waitUntil: 'load' });
    await eg.waitForFunction(() => window.__embedded && window.__embedded.svgs().length === window.__embedded.ids.length, null, { timeout: 120000 });
    const info = await eg.evaluate(() => ({ ids: window.__embedded.ids, playing: window.__embedded.playing(), frames: document.querySelectorAll('iframe').length,
      tag: window.__embedded.tag('orrery'), svg: window.__embedded.svg('orrery') }));
    if (info.frames !== 0) throw new Error('an editor is still on the page after the svgs were made');
    if (!info.playing.length || info.playing.length === info.ids.length || !info.playing.includes(info.ids[0])) throw new Error('the svgs playing: ' + info.playing.join());
    const svgOk = await eg.evaluate(t => { const d = new DOMParser().parseFromString(t, 'image/svg+xml'); return !d.querySelector('parsererror') && d.querySelectorAll('animate, animateTransform').length > 5; }, info.svg);
    if (!svgOk) throw new Error('the orrery\'s svg is not an animated svg');
    if (!/^<iframe src="[^"]*\/draw\.html\?embed=1#scene=[rz][\w-]+"/.test(info.tag)) throw new Error('the embed code: ' + info.tag.slice(0, 120));
    await eg.click('#orrery .live');
    await eg.waitForSelector('#orrery iframe.player.on', { timeout: 30000 });
    const fr = eg.frames().find(f => /embed=1/.test(f.url())); // the converter is gone; this is the live one
    if (!fr || !(await fr.evaluate(() => window.__box.morph().play))) throw new Error('"live" did not play the orrery in the editor');
    await eg.evaluate(() => document.querySelector('footer').scrollIntoView());
    // the page scrolls smoothly, so wait for the first tile to leave the view rather than a fixed while
    const paused = await eg.waitForFunction(id => !window.__embedded.playing().includes(id), info.ids[0], { timeout: 10000 }).then(() => true, () => false);
    if (!paused) throw new Error('scrolled away, the first tile\'s svg still plays');
  } catch (e){
    failures.push(`[embedded] ${e.message.split('\n')[0]}`);
  }
  await eg.close();
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} the embedded gallery`);
}

await step('the tvf player', async () => {
  const { buildPlayer } = await import('../tools/build-player.mjs');
  const { out } = await buildPlayer();
  if (out !== await readFile(join(ROOT, 'player/tvf-player.js'), 'utf8')) throw new Error('player/tvf-player.js is out of date with draw.html: run `npm run player`');
  const gp = await browser.newPage();
  await gp.route(/fonts\.g/, r => r.abort());
  await gp.goto(new URL('gallery/animated.html', base).href, { waitUntil: 'load' });
  await gp.waitForFunction(() => typeof EXAMPLES !== 'undefined' && typeof sceneCode === 'function');
  const ids = ['grow', 'lag', 'one-after', 'kite', 'orrery', 'snow', 'house', 'explainer', 'leaves'];
  const codes = await gp.evaluate(async ids => { const o = {}; for (const e of EXAMPLES.filter(e => ids.includes(e.id))) o[e.id] = await sceneCode(e); return o; }, ids);
  await gp.close();
  const pl = await browser.newPage({ viewport: { width: 800, height: 500 } });
  pl.on('pageerror', e => failures.push(`[player] ${e.message}`));
  await pl.goto(new URL('player/player.html', base).href, { waitUntil: 'load' });
  const ts = [0, 0.13, 0.37, 0.5, 0.81, 0.97];
  for (const id of ids) {
    const ep = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    ep.on('pageerror', e => failures.push(`[player: ${id} in the editor] ${e.message}`));
    await ep.route(/fonts\.g/, r => r.abort());
    await ep.goto(new URL('draw.html', base).href + '#scene=' + codes[id], { waitUntil: 'load' });
    await ep.waitForFunction(() => !/scene=/.test(location.hash) && window.__box && window.__box.morph(), null, { timeout: 60000 });
    await ep.waitForTimeout(300);
    const d = await ep.evaluate(() => window.__box.tvfScene());
    const A = await ep.evaluate(ts => ts.map(t => window.__box.morphPoses(t)), ts);
    await ep.close();
    // player/examples/ holds what the editor writes now (npm run examples writes them again)
    const file = await readFile(join(ROOT, 'player', 'examples', id + '.tvfs'), 'utf8').catch(() => null);
    if (file !== JSON.stringify(d)) throw new Error('player/examples/' + id + '.tvfs is not what the editor writes now: run `npm run examples`');
    const B = await pl.evaluate(([d, ts]) => { const S = TVFPlayer.load(d); return ts.map(t => TVFPlayer.poses(S, t).map(P => ({ x: Array.from(P.x), y: Array.from(P.y) }))); }, [d, ts]);
    let worst = 0, scale = 1e-12;
    A.forEach((ps, i) => ps.forEach((P, j) => { for (let k = 0; k < P.x.length; k++) { scale = Math.max(scale, Math.abs(P.x[k]), Math.abs(P.y[k])); worst = Math.max(worst, Math.abs(P.x[k] - B[i][j].x[k]), Math.abs(P.y[k] - B[i][j].y[k])); } }));
    if (!(worst / scale < 1e-6)) throw new Error(id + ': the player poses it ' + (worst / scale).toExponential(2) + ' of its size away from the editor');
  }
  await pl.close();
  // the page: a scene from a file, drawn, and drawn again at another size
  const pp = await browser.newPage({ viewport: { width: 900, height: 600 } });
  pp.on('pageerror', e => failures.push(`[player.html] ${e.message}`));
  await pp.goto(new URL('player/player.html?src=examples/grow.tvfs', base).href, { waitUntil: 'load' });
  await pp.waitForFunction(() => window.__player.ctl() && window.__player.ctl().scene, null, { timeout: 30000 });
  const lit = () => pp.evaluate(() => { const c = document.getElementById('cv'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < x.length; i += 16) if (x[i] > 120 && x[i + 2] > 200) n++; return { n, w: c.width }; });
  await pp.evaluate(() => { const c = window.__player.ctl(); c.pause(); c.seek(0.5); });
  await pp.waitForTimeout(300);
  const a = await lit();
  await pp.setViewportSize({ width: 450, height: 300 });
  await pp.evaluate(() => window.__player.ctl().seek(0.5));
  await pp.waitForTimeout(300);
  const b = await lit();
  await pp.close();
  if (!(a.n > 200) || !(b.n > 50) || !(b.w < a.w)) throw new Error('player.html drew ' + JSON.stringify({ a, b }));
});

/* THE PLAYED GALLERY (gallery/played.html): the TVF player at work. Every example on the animated page is a
   file in player/examples/ listed in its index.json; the page plays each one through the player alone, only
   the tiles in view; a trail draws (a ribbon and echoes add to what the shape alone draws); the embed code it
   hands out works pasted into a page of someone else's, the scripts and the scene fetched from GitHub Pages;
   and "scrub" puts a scene on the wide panel. */
await step('the played gallery', async () => {
  const dir = join(ROOT, 'player', 'examples');
  const index = JSON.parse(await readFile(join(dir, 'index.json'), 'utf8'));
  const files = (await readdir(dir)).filter(f => f.endsWith('.tvfs')).map(f => f.slice(0, -5)).sort();
  const listed = index.sections.flatMap(s => s.ids);
  if (listed.slice().sort().join() !== files.join()) throw new Error('index.json lists ' + listed.length + ' scenes for ' + files.length + ' files');
  for (const id of files) {
    const n = (await readFile(join(dir, id + '.tvfs'), 'utf8')).length;
    if (index.bytes[id] !== n) throw new Error('index.json gives ' + id + '.tvfs as ' + index.bytes[id] + ' bytes, not ' + n);
  }
  const A = await readFile(join(ROOT, 'gallery/animated.html'), 'utf8');
  const ids = [...A.matchAll(/^\s+id: '([a-z0-9-]+)', name:/gm)].map(m => m[1]).sort();
  if (ids.join() !== files.join()) throw new Error('player/examples/ is not the animated page\'s examples: run `npm run examples`');
  // trails: the orbit's ribbon and the fish's echoes draw more than the shape alone
  const tp = await browser.newPage();
  tp.on('pageerror', e => failures.push(`[played: trails] ${e.message}`));
  await tp.goto(new URL('player/player.html', base).href, { waitUntil: 'load' });
  for (const id of ['orbit', 'fish']) {
    const d = JSON.parse(await readFile(join(dir, id + '.tvfs'), 'utf8'));
    const [withT, without] = await tp.evaluate(d => [true, false].map(on => {
      const s = JSON.parse(JSON.stringify(d));
      if (!on) { s.trail = null; for (const m of s.morphs) m.own.trail = { kind: '', len: 0.5 }; }
      const c = document.createElement('canvas'); c.width = 400; c.height = 300;
      const x = c.getContext('2d');
      TVFPlayer.draw(x, TVFPlayer.load(s), 0.4, 400, 300);
      const p = x.getImageData(0, 0, 400, 300).data; let n = 0;
      for (let i = 3; i < p.length; i += 4) if (p[i] > 8) n++;
      return n;
    }), d);
    if (!(withT > without * 1.3)) throw new Error(id + ': its trail drew ' + withT + ' pixels against ' + without + ' without it');
  }
  await tp.close();
  // the page
  const gp = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  gp.on('pageerror', e => failures.push(`[played] ${e.message}`));
  await gp.route(/fonts\.g/, r => r.abort());
  await gp.goto(new URL('gallery/played.html', base).href, { waitUntil: 'load' });
  await gp.waitForFunction(() => window.__played && window.__played.ids.length > 0, null, { timeout: 20000 });
  const n = await gp.evaluate(() => window.__played.ids.length),
    nIa = JSON.parse(await readFile(join(ROOT, 'player', 'interactive', 'index.json'), 'utf8')).scenes.length;
  if (n !== files.length + nIa) throw new Error(n + ' tiles for ' + files.length + ' + ' + nIa + ' scenes');
  // each tile brought into view and held there until it has started (one scrolled past within a frame is never seen)
  await gp.evaluate(async () => {
    for (const id of window.__played.ids) {
      const t = document.getElementById(id);
      t.scrollIntoView();
      for (let k = 0; k < 100 && !window.__played.ctl(id); k++) await new Promise(r => setTimeout(r, 30));
    }
  });
  await gp.waitForFunction(() => window.__played.ready().length + window.__played.failed().length === window.__played.ids.length, null, { timeout: 60000 });
  // a tile that has just started draws on its next frame: wait for every canvas to have something on it
  await gp.waitForFunction(() => window.__played.ids.every(id => { const c = document.getElementById(id).querySelector('canvas');
    if (!c.width) return false; const p = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < p.length; i += 16) if (p[i] > 8) return true; return false; }), null, { timeout: 20000 }).catch(() => {});
  const st = await gp.evaluate(() => ({ failed: window.__played.failed(), playing: window.__played.playing(), first: window.__played.ids[0],
    blank: window.__played.ids.filter(id => { const c = document.getElementById(id).querySelector('canvas'), x = c.getContext('2d');
      const p = x.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < p.length; i += 4) if (p[i] > 8) return false; return true; }) }));
  if (st.failed.length) throw new Error('could not play ' + st.failed.join(', '));
  if (st.blank.length) throw new Error('drew nothing for ' + st.blank.join(', '));
  if (st.playing.includes(st.first) || st.playing.length > 12) throw new Error('tiles out of view keep playing: ' + st.playing.join(', '));
  // scrub: the wide panel takes a scene
  await gp.click('#orbit .mine');
  await gp.waitForFunction(() => window.__played.yours() && window.__played.yours().scene, null, { timeout: 10000 });
  const embed = await gp.evaluate(() => window.__played.embed('bouncing-ball'));
  await gp.close();
  // the embed code, pasted into someone's page: its scripts and scene fetched from GitHub Pages
  const xp = await browser.newPage({ viewport: { width: 600, height: 400 } });
  xp.on('pageerror', e => failures.push(`[played: embed code] ${e.message}`));
  await xp.route('https://reportbase.github.io/draw/**', async r => {
    const path = new URL(r.request().url()).pathname.replace(/^\/draw\//, '');
    r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': path.endsWith('.js') ? 'text/javascript' : 'application/json' },
      body: await readFile(join(ROOT, path)) });
  });
  await xp.route('https://someone.example/', r => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><body>' + embed + '</body>' }));
  await xp.goto('https://someone.example/', { waitUntil: 'load' });
  await xp.waitForFunction(() => { const c = document.querySelector('canvas'); return c && c._tvfs && c._tvfs.scene; }, null, { timeout: 15000 });
  await xp.waitForTimeout(300);
  const lit = await xp.evaluate(() => { const c = document.querySelector('canvas'), p = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < p.length; i += 4) if (p[i] > 8) n++; return { n, w: c.width }; });
  await xp.close();
  if (!(lit.w >= 480 && lit.n > 1000)) throw new Error('the embed code drew ' + JSON.stringify(lit));
});

/* SCENES THAT ANSWER THE HAND, AND LOTTIE (29 Oct 2026, Tom: "1,2,4"): player/interactive/ is what
   tools/write-interactive.mjs writes, its Lottie scene is what player/lottie.js makes of lottie-sample.json now,
   and on the played gallery, with real input: a click on the menu runs it to its other state and a second back;
   a press on the button holds it down and the release lets it up; the pointer over the card lifts it; the ball
   taken and thrown flies the way it was thrown; the lantern pulled aside swings; and player.html opens a Lottie
   file as a scene. */
await step('interactive scenes, touch and Lottie', async () => {
  const dir = join(ROOT, 'player', 'interactive'),
    ia = JSON.parse(await readFile(join(dir, 'index.json'), 'utf8'));
  const tvfs = (await readdir(dir)).filter(f => f.endsWith('.tvfs')).sort();
  if (ia.scenes.map(e => e.file).sort().join() !== tvfs.join()) throw new Error('interactive/index.json lists ' + ia.scenes.length + ' scenes for ' + tvfs.length + ' files');
  for (const e of ia.scenes)
    if ((await readFile(join(dir, e.file), 'utf8')).length !== e.bytes) throw new Error(e.file + ' is not the size index.json gives: run node tools/write-interactive.mjs');
  const gp = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  gp.on('pageerror', e => failures.push(`[interactive] ${e.message}`));
  await gp.route(/fonts\.g/, r => r.abort());
  await gp.goto(new URL('gallery/played.html', base).href, { waitUntil: 'load' });
  await gp.waitForFunction(() => window.__played && window.__played.ids.includes('lottie-sample'), null, { timeout: 20000 });
  // the Lottie scene, made again in the page from its source
  const same = await gp.evaluate(async () => {
    const L = await (await fetch('../player/interactive/lottie-sample.json')).json(),
      S = await (await fetch('../player/interactive/lottie-sample.tvfs')).json(),
      { scene, report } = TVFLottie.toScene(L, { name: 'from Lottie' });
    return { same: JSON.stringify(scene.morphs) === JSON.stringify(S.morphs) && JSON.stringify(scene.items) === JSON.stringify(S.items), report };
  });
  if (!same.same) throw new Error('lottie-sample.tvfs is not what player/lottie.js makes of lottie-sample.json now: run node tools/write-interactive.mjs');
  if (!(same.report.morphs === 4 && same.report.frames === 60)) throw new Error('the Lottie sample read as ' + JSON.stringify(same.report));
  // ONE SHAPE, MOVED and A CURVE OF ITS OWN: the ball, which only moves and squashes, is one key and a transform with
  // Lottie's eases (17 of its 60 frames: its position and its squash are keyed at different frames with different
  // eases, and a stretch has one ease for all its parts); the scene is version 2; and the player poses the ball where
  // lottie.js drew it at frames between keys
  const moved = await gp.evaluate(async () => {
    const L = await (await fetch('../player/interactive/lottie-sample.json')).json(),
      { scene, report } = TVFLottie.toScene(L, { name: 'from Lottie' }),
      S = TVFPlayer.load(scene),
      ball = scene.morphs.findIndex(m => m.xform),
      run = S.runs[ball];
    let worst = 0;
    for (const f of [7, 13, 29, 41, 53]) {
      const ops = TVFLottie.drawingAt(L, f, () => {}),
        o = ops.find(q => q.key.startsWith('ball') || q.fill && Math.abs(q.fill[0] - 0.98) < 1e-6),
        P = TVFPlayer.poses(S, f / 60)[ball];
      for (let i = 0; i < o.x.length; i++)
        worst = Math.max(worst, Math.hypot(P.x[i] - o.x[i], P.y[i] - o.y[i]));
    }
    return { v: scene.v, moved: report.moved, keys: run ? run.keys.length : 0, xkeys: scene.morphs[ball] ? scene.morphs[ball].xform.t.length : 0,
      eased: !!(scene.morphs[ball] && scene.morphs[ball].xform.e && scene.morphs[ball].xform.e.some(Array.isArray)), worst };
  });
  if (!(moved.v === 2 && moved.moved >= 1 && moved.keys === 1 && moved.xkeys < 20 && moved.eased && moved.worst < 0.25))
    throw new Error('the Lottie sample\'s ball as one shape moved: ' + JSON.stringify(moved));
  const ready = async id => {
    await gp.locator('#' + id).scrollIntoViewIfNeeded();
    await gp.waitForFunction(id => window.__played.ready().includes(id), id, { timeout: 15000 });
    await gp.waitForTimeout(100);
    return gp.evaluate(id => window.__played.ctl(id).whereIs(0), id);
  };
  const tOf = id => gp.evaluate(id => window.__played.ctl(id).t, id);
  // the menu: a click toggles it to its other state, a second back
  let w = await ready('menu');
  const m0 = await tOf('menu');
  await gp.mouse.click(w.x, w.y);
  await gp.waitForTimeout(1500);
  const m1 = await tOf('menu');
  await gp.mouse.click(w.x, w.y);
  await gp.waitForTimeout(1500);
  const m2 = await tOf('menu');
  if (!(m0 === 0 && m1 === 1 && m2 === 0)) throw new Error('the menu went ' + [m0, m1, m2].join(' → ') + ', not 0 → 1 → 0');
  // the button: held down while pressed
  w = await ready('button');
  await gp.mouse.move(w.x, w.y);
  await gp.mouse.down();
  await gp.waitForTimeout(900);
  const b1 = await tOf('button');
  await gp.mouse.up();
  await gp.waitForTimeout(900);
  const b2 = await tOf('button');
  if (!(b1 > 0.9 && b2 < 0.1)) throw new Error('the button went to ' + b1 + ' pressed and ' + b2 + ' let go');
  // the card: lifted while the pointer is over it
  w = await ready('card');
  await gp.mouse.move(w.x, w.y, { steps: 4 });
  await gp.waitForTimeout(900);
  const c1 = await tOf('card');
  await gp.mouse.move(5, 5, { steps: 4 });
  await gp.waitForTimeout(900);
  const c2 = await tOf('card');
  if (!(c1 > 0.9 && c2 < 0.1)) throw new Error('the card went to ' + c1 + ' under the pointer and ' + c2 + ' off it');
  // the ball: thrown up and to the right, it flies that way
  await ready('touch-bouncing-ball');
  // (held still first: a ball bouncing under a slow page has moved on from where it was measured by the time the press lands)
  w = await gp.evaluate(() => { const c = window.__played.ctl('touch-bouncing-ball'); c.pause(); return c.whereIs(0); });
  await gp.waitForTimeout(100);
  // (the throw is read as it is let go: a listener on the window hears the pointerup just after the canvas has set the
  // ball flying, before any frame of the page gives its speed to gravity. Read afterwards, a loaded machine's late frames
  // had taken its upward speed, and CI failed it on 7 Nov 2026 whatever the commit.)
  await gp.evaluate(() => addEventListener('pointerup', () => { const T = window.__played.ctl('touch-bouncing-ball').scene.runs[0].touch;
    window.__thrown = { phase: T.phase, vx: T.vx, vy: T.vy }; }, { once: true }));
  await gp.mouse.move(w.x, w.y);
  await gp.mouse.down();
  for (let i = 1; i <= 6; i++) { await gp.mouse.move(w.x + i * 20, w.y - i * 15); await gp.waitForTimeout(16); }
  await gp.mouse.up();
  const ball = await gp.evaluate(() => window.__thrown);
  // up and right, about as the hand went (15 up for every 20 across)
  if (!(ball && ball.phase === 'fly' && ball.vx > 0.2 && ball.vy > 0.3 * ball.vx)) throw new Error('the ball thrown up and right: ' + JSON.stringify(ball));
  // the lantern: pulled aside and let go, it swings
  w = await ready('touch-lantern');
  await gp.mouse.move(w.x, w.y + w.h * 0.3);
  await gp.mouse.down();
  await gp.mouse.move(w.x + 80, w.y + w.h * 0.3, { steps: 6 });
  await gp.mouse.up();
  await gp.waitForTimeout(200);
  const lan = await gp.evaluate(() => window.__played.ctl('touch-lantern').scene.runs[0].touch.phase);
  if (lan !== 'swing') throw new Error('the lantern let go is ' + lan + ', not swinging');
  await gp.close();
  // player.html opens a Lottie file as a scene
  const pl = await browser.newPage();
  pl.on('pageerror', e => failures.push(`[player: Lottie] ${e.message}`));
  await pl.goto(new URL('player/player.html', base).href, { waitUntil: 'load' });
  await pl.setInputFiles('#file', join(dir, 'lottie-sample.json'));
  await pl.waitForFunction(() => window.__player.ctl() && window.__player.ctl().scene, null, { timeout: 10000 });
  const info = await pl.evaluate(() => document.getElementById('info').textContent);
  await pl.close();
  if (!/from Lottie, 60 frames/.test(info)) throw new Error('player.html read the Lottie file as: ' + info);
});

/* THE LOTTIE PAGE (gallery/lottie.html, 29 Oct 2026, Tom: "Create a help gallery page the show the vtf viewer processing a
   lottie file and animating it. One of the demos should let the user import a lottie file."): with real input, the first
   bench converts a Lottie of ours and plays it, "process it" reads every frame and ends playing the scene, the picker
   changes the Lottie, the knobs convert again (a looser tolerance and no transforms change the keys), the Lottie's frame
   drawn as exact paths and the scene at the same moment agree to the pixel (mean difference under 2 of 255), a ring that
   only turns takes two transform keys (about its own middle, not the page's origin), and the second bench opens a Lottie
   file through its real picker, refuses a file that is not one and says so for a scene. */
await step('the lottie page', async () => {
  const dir = join(ROOT, 'player', 'interactive');
  const gp = await browser.newPage({ viewport: { width: 1300, height: 1000 } });
  gp.on('pageerror', e => failures.push(`[lottie page] ${e.message}`));
  await gp.route(/fonts\.g/, r => r.abort());
  await gp.goto(new URL('gallery/lottie.html', base).href, { waitUntil: 'load' });
  await gp.waitForFunction(() => window.__lottie && window.__lottie.ready(), null, { timeout: 20000 });
  await gp.waitForTimeout(500);
  const info = id => gp.evaluate(id => { const i = window.__lottie.info(id); return { name: i.name, frames: i.frames, busy: i.busy, playing: i.playing, t: i.t, f: i.f, status: i.status, tol: i.tol,
    morphs: i.report && i.report.morphs, moved: i.report && i.report.moved, keys: i.report && i.report.keys, xkeys: i.report && i.report.xkeys, tracks: i.report && i.report.tracks, scene: i.scene }; }, id);
  const lit = sel => gp.evaluate(sel => { const c = document.querySelector(sel), p = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < p.length; i += 4) if (p[i] + p[i + 1] + p[i + 2] > 120) n++; return n; }, sel);
  let a = await info('watch');
  if (!(a.name === 'balls and squares' && a.frames === 60 && a.moved >= 1 && a.scene && a.playing)) throw new Error('the first bench opened as ' + JSON.stringify(a));
  if (!(await lit('#benchWatch .cvL') > 2000 && await lit('#benchWatch .cvR') > 2000)) throw new Error('the two pictures drew nothing');
  // process it: every frame read, then the conversion, the scene playing at the end
  await gp.locator('#benchWatch .go').scrollIntoViewIfNeeded();
  await gp.click('#benchWatch .go');
  await gp.waitForFunction(() => /reading frame/.test(window.__lottie.info('watch').status), null, { timeout: 5000 });
  await gp.waitForFunction(() => { const i = window.__lottie.info('watch'); return !i.busy && /^done:/.test(i.status); }, null, { timeout: 30000 });
  a = await info('watch');
  if (!a.playing) throw new Error('the scene was not playing after process it: ' + a.status);
  // the picker: the spinner is eight shapes that only move and fade
  await gp.click('#benchWatch .picker button[data-s="lottie-spinner"]');
  await gp.waitForFunction(() => window.__lottie.info('watch').name === 'a spinner' && window.__lottie.info('watch').scene, null, { timeout: 10000 });
  a = await info('watch');
  if (!(a.frames === 48 && a.moved === 8 && a.morphs === 8 && a.xkeys < a.tracks * a.frames / 4)) throw new Error('the spinner read as ' + JSON.stringify(a));
  // the blob: its ring only turns about its own middle, so two transform keys, whatever the page's origin is
  await gp.click('#benchWatch .picker button[data-s="lottie-blob"]');
  await gp.waitForFunction(() => window.__lottie.info('watch').name === 'a blob', null, { timeout: 10000 });
  const ring = await gp.evaluate(() => { const S = window.__lottie.benches.watch.scene; const m = S.morphs.find(q => q.xform && q.stroke); return m ? m.xform.t.length : -1; });
  if (ring !== 2) throw new Error('the blob\'s turning ring took ' + ring + ' transform keys, not 2');
  // the frame slider (real input): the Lottie's frame and the scene at the same moment are the same picture
  await gp.evaluate(() => { const r = document.querySelector('#benchWatch .fr'); r.value = 21; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await gp.waitForTimeout(300);
  const same = await gp.evaluate(() => { const L = document.querySelector('#benchWatch .cvL'), R = document.querySelector('#benchWatch .cvR');
    if (L.width !== R.width || L.height !== R.height) return { size: [L.width, L.height, R.width, R.height] };
    const a = L.getContext('2d').getImageData(0, 0, L.width, L.height).data, b = R.getContext('2d').getImageData(0, 0, R.width, R.height).data; let d = 0;
    for (let i = 0; i < a.length; i += 4) d += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    return { mean: d / (a.length / 4 * 3), f: window.__lottie.info('watch').f, playing: window.__lottie.info('watch').playing }; });
  if (!(same.mean < 2 && same.f === 21 && !same.playing)) throw new Error('frame 21 of the Lottie and of the scene differ: ' + JSON.stringify(same));
  // the knobs: a looser tolerance and no transforms convert it again, with more keys of the outline
  const before = await info('watch');
  await gp.evaluate(() => window.__lottie.benches.watch.set({ tol: 1.5, xform: false }));
  const after = await info('watch');
  if (!(after.tol !== before.tol && after.moved === 0 && after.keys > before.keys)) throw new Error('the knobs did nothing: ' + JSON.stringify([before.keys, after.keys, after.moved]));
  // the second bench: a Lottie file opened through the real picker, then what is not one
  const yb = '#benchYours input[type=file]';
  await gp.locator('#yours').scrollIntoViewIfNeeded();
  await gp.setInputFiles(yb, join(dir, 'lottie-sample.json'));
  await gp.waitForFunction(() => { const i = window.__lottie.info('yours'); return i.scene && !i.busy && /^done:/.test(i.status); }, null, { timeout: 30000 });
  const y = await info('yours');
  if (!(y.name === 'lottie-sample' && y.frames === 60 && y.playing && await lit('#benchYours .cvR') > 2000)) throw new Error('the opened Lottie: ' + JSON.stringify(y));
  await gp.setInputFiles(yb, { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a": 1}') });
  await gp.waitForTimeout(250);
  const bad = await info('yours');
  if (!(/not a Lottie file/.test(bad.status) && bad.name === 'lottie-sample')) throw new Error('a file that is not a Lottie: ' + bad.status);
  await gp.setInputFiles(yb, join(dir, 'menu.tvfs'));
  await gp.waitForTimeout(250);
  const scn = await info('yours');
  if (!/scene already/.test(scn.status)) throw new Error('a scene dropped on the Lottie bench: ' + scn.status);
  // the download hands back the scene it made
  const dl = gp.waitForEvent('download', { timeout: 5000 });
  await gp.click('#benchYours .dl');
  const file = await dl;
  if (file.suggestedFilename() !== 'lottie-sample.tvfs') throw new Error('the .tvfs download was named ' + file.suggestedFilename());
  await gp.close();
});

/* THE SCROLLING EXPLAINER (gallery/explained.html): the scene's clock follows the reading. Scrolled down, the
   clock only goes forward, through every beat's stretch; a beat's play button plays its stretch and waits at the
   stop that ends it; and on a phone the page does not scroll sideways. */
await step('the scrolling explainer', async () => {
  // a scroll, then its own event heard and a frame drawn: the clock is read after the page has followed it (a fixed
  // wait of 80 or 120 ms was not always enough on a loaded machine: CI, 7 Nov 2026)
  const scrollAt = (p, f) => p.evaluate(f => new Promise(done => {
    const top = Math.round(f * (document.documentElement.scrollHeight - innerHeight)), go = () => requestAnimationFrame(() => requestAnimationFrame(done));
    if (Math.abs(scrollY - top) < 1) return go();
    const t = setTimeout(go, 3000);
    addEventListener('scroll', () => { clearTimeout(t); go(); }, { once: true });
    scrollTo({ top, behavior: 'instant' });
  }), f);
  const xp = await browser.newPage({ viewport: { width: 1300, height: 860 } });
  xp.on('pageerror', e => failures.push(`[explained] ${e.message}`));
  await xp.route(/fonts\.g/, r => r.abort());
  await xp.goto(new URL('gallery/explained.html', base).href, { waitUntil: 'load' });
  await xp.waitForFunction(() => window.__explained && window.__explained.ctl.scene, null, { timeout: 20000 });
  const ts = [];
  for (let f = 0; f <= 1.0001; f += 0.05) {
    await scrollAt(xp, f); // style.css scrolls smoothly; scrollAt asks for an instant one
    ts.push(await xp.evaluate(() => window.__explained.ctl.t));
  }
  if (ts.some((t, i) => i && t < ts[i - 1] - 1e-9) || !(ts[0] < 0.1) || !(ts[ts.length - 1] > 0.99)) throw new Error('the clock against the scroll: ' + ts.map(t => t.toFixed(2)).join(' '));
  // the second beat's play button: from 0.2 to its stop at 0.42
  await xp.evaluate(() => document.querySelectorAll('.beat')[1].scrollIntoView({ behavior: 'instant' }));
  await xp.waitForTimeout(300); // the scroll's own event first: a scroll after the press takes the clock back
  await xp.evaluate(() => document.querySelectorAll('.beat .go')[1].click());
  await xp.waitForFunction(() => !window.__explained.ctl.playing && Math.abs(window.__explained.ctl.t - 0.42) < 1e-6, null, { timeout: 15000 });
  await xp.close();
  const mp = await browser.newPage({ viewport: { width: 390, height: 800 } });
  mp.on('pageerror', e => failures.push(`[explained, a phone] ${e.message}`));
  await mp.route(/fonts\.g/, r => r.abort());
  await mp.goto(new URL('gallery/explained.html', base).href, { waitUntil: 'load' });
  await mp.waitForFunction(() => window.__explained && window.__explained.ctl.scene, null, { timeout: 20000 });
  const sw = await mp.evaluate(() => document.documentElement.scrollWidth);
  await mp.close();
  if (sw > 390) throw new Error('on a phone the page is ' + sw + ' px wide');
  // the second explainer, the Tangent Bridge (?x=bridge): its six beats and a closing one, from the scene's own
  // beats with the paper's pills, the switcher on it, and the clock following the reading to the end
  const bp = await browser.newPage({ viewport: { width: 1300, height: 860 } });
  bp.on('pageerror', e => failures.push(`[explained ?x=bridge] ${e.message}`));
  await bp.route(/fonts\.g/, r => r.abort());
  await bp.goto(new URL('gallery/explained.html?x=bridge', base).href, { waitUntil: 'load' });
  await bp.waitForFunction(() => window.__explained && window.__explained.ctl.scene, null, { timeout: 20000 });
  const xb = await bp.evaluate(() => [window.__explained.beats, window.__explained.titles[0], document.querySelectorAll('.beat a.paper').length, document.querySelector('#xs a.on') && document.querySelector('#xs a.on').dataset.x]);
  if (xb[0] !== 7 || xb[1] !== 'A curve is a function on the circle' || xb[2] < 6 || xb[3] !== 'bridge') throw new Error('the Tangent Bridge explainer: ' + JSON.stringify(xb));
  const bt = [];
  for (const f of [0.1, 0.4, 0.7, 1]) {
    await scrollAt(bp, f);
    bt.push(await bp.evaluate(() => window.__explained.ctl.t));
  }
  await bp.close();
  if (bt.some((t, i) => i && !(t > bt[i - 1])) || !(bt[3] > 0.99)) throw new Error('the Tangent Bridge clock against the scroll: ' + bt.join(' '));
  // WHERE IT SHOWS UP (?x=pictures, 1 Nov 2026): essay 7's three pictures in six beats and a closing one, the switcher on
  // it, the clock following the reading, and the scene's own features there: a beam spun in a clip, two paths ridden,
  // two plotted laws as one morph's keys, eases given as cubic Béziers, and labels into labels
  const pp = await browser.newPage({ viewport: { width: 1300, height: 860 } });
  pp.on('pageerror', e => failures.push(`[explained ?x=pictures] ${e.message}`));
  await pp.route(/fonts\.g/, r => r.abort());
  await pp.goto(new URL('gallery/explained.html?x=pictures', base).href, { waitUntil: 'load' });
  await pp.waitForFunction(() => window.__explained && window.__explained.ctl.scene, null, { timeout: 20000 });
  const xq = await pp.evaluate(async () => { const sc = await (await fetch('../player/examples/pictures.tvfs')).json(), M = sc.morphs || [];
    return [window.__explained.beats, window.__explained.titles[0], document.querySelector('#xs a.on') && document.querySelector('#xs a.on').dataset.x,
      M.filter(m => m.own && m.own.spin).length, M.filter(m => m.own && m.own.path != null).length, (sc.stops || []).length, (sc.camera || []).length]; });
  const pt = [];
  for (const f of [0.15, 0.5, 0.85]) {
    await scrollAt(pp, f);
    pt.push(await pp.evaluate(() => window.__explained.ctl.t));
  }
  // the dial on the third beat (2 Nov 2026): a real click at each end of c sets the clock within its stretch and reads
  // the count within β; then the watch, started by a real click, plays on through the stops by itself and scrolls the
  // beat played into view, and a key stops it
  const dial = pp.locator('.beat .dial input');
  await dial.scrollIntoViewIfNeeded();
  await pp.waitForTimeout(900);
  const db = await dial.boundingBox(), dq = [];
  for (const f of [0, 1]) {
    await pp.mouse.click(db.x + 4 + f * (db.width - 8), db.y + db.height / 2);
    await pp.waitForTimeout(250);
    dq.push([await pp.locator('.beat .dial output').textContent(), await pp.evaluate(() => window.__explained.ctl.t)]);
  }
  await pp.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await pp.waitForTimeout(300);
  await pp.click('#watch');
  // the watch has played its first beat, held at its stop and gone on, scrolling the next beat into view (9 s on a quiet
  // machine; given up to 40 s, since its clock slows with a slow machine's frames)
  await pp.waitForFunction(() => window.__explained.ctl.t > 0.12 && scrollY > 100, null, { timeout: 40000 }).catch(() => {});
  const wq = await pp.evaluate(() => [window.__explained.watching(), window.__explained.ctl.t, scrollY]);
  await pp.keyboard.press('ArrowDown');
  await pp.waitForTimeout(200);
  const wStop = await pp.evaluate(() => window.__explained.watching());
  // a lit phrase (2 Nov 2026): pointed at by the real mouse it takes the clock into its beat and lights its morphs,
  // the canvas ringed in gold; moved away, the light goes
  const ph = pp.locator('.beat .lit', { hasText: 'Greenland' });
  await ph.scrollIntoViewIfNeeded();
  await pp.waitForTimeout(900);
  await ph.hover();
  await pp.waitForTimeout(500);
  const gold = () => pp.evaluate(() => { const c = document.querySelector('#stage canvas') || document.querySelector('canvas'),
    x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < x.length; i += 4) if (x[i] > 190 && x[i + 1] > 130 && x[i + 1] < 175 && x[i + 2] < 60) n++; return n; });
  const lq = [await pp.evaluate(() => window.__explained.ctl.lit), await pp.evaluate(() => window.__explained.ctl.t), await gold()];
  await pp.mouse.move(3, 3);
  await pp.waitForTimeout(300);
  lq.push(await pp.evaluate(() => window.__explained.ctl.lit), await gold());
  await pp.close();
  if (JSON.stringify(lq[0]) !== '[33]' || !(lq[1] > 0.52 && lq[1] <= 0.75) || !(lq[2] > 100) || lq[3] !== null || !(lq[4] < lq[2] / 4))
    throw new Error('the lit phrase: ' + JSON.stringify(lq));
  if (!/6 of 12/.test(dq[0][0]) || !/4 of 12/.test(dq[1][0]) || !(dq[0][1] < dq[1][1]) || Math.abs(dq[1][1] - 0.45) > 0.01)
    throw new Error('the where-it-shows-up dial: ' + JSON.stringify(dq));
  if (!wq[0] || !(wq[1] > 0.12) || !(wq[2] > 100) || wStop) throw new Error('the watch: ' + JSON.stringify([wq, wStop]));
  if (xq[0] !== 7 || xq[1] !== 'A lamp turns over a straight shore' || xq[2] !== 'pictures' || xq[3] < 1 || xq[4] < 2 || xq[5] !== 5 || xq[6] < 10)
    throw new Error('the where-it-shows-up explainer: ' + JSON.stringify(xq));
  if (pt.some((t, i) => i && !(t > pt[i - 1]))) throw new Error('the where-it-shows-up clock against the scroll: ' + pt.join(' '));
  // RATES, NOT ANGLES (?x=rates, 2 Nov 2026): essay 14 in six beats, the switcher on it; the pitch dial on the first beat
  // reads six in twelve as v/h 0.5 and the writer's 26.57°, and sets the clock on its linear stretch; a lit phrase
  // ("the radius") lights the radius's morph
  const rp = await browser.newPage({ viewport: { width: 1300, height: 860 } });
  rp.on('pageerror', e => failures.push(`[explained ?x=rates] ${e.message}`));
  await rp.route(/fonts\.g/, r => r.abort());
  await rp.goto(new URL('gallery/explained.html?x=rates', base).href, { waitUntil: 'load' });
  await rp.waitForFunction(() => window.__explained && window.__explained.ctl.scene, null, { timeout: 20000 });
  const rq = await rp.evaluate(() => [window.__explained.beats, window.__explained.titles[0], document.querySelector('#xs a.on') && document.querySelector('#xs a.on').dataset.x,
    document.querySelectorAll('.beat .lit').length]);
  const rdial = rp.locator('.beat .dial input');
  await rdial.scrollIntoViewIfNeeded();
  await rp.waitForTimeout(700);
  await rdial.fill('6');
  await rdial.dispatchEvent('input');
  await rp.waitForTimeout(200);
  const rd = [await rp.locator('.beat .dial output').textContent(), await rp.evaluate(() => window.__explained.ctl.t)];
  const rl = rp.locator('.beat .lit', { hasText: 'radius' });
  await rl.scrollIntoViewIfNeeded();
  await rp.waitForTimeout(700);
  await rl.hover();
  await rp.waitForTimeout(300);
  const rlit = await rp.evaluate(() => window.__explained.ctl.lit);
  await rp.close();
  if (rq[0] !== 7 || rq[1] !== 'Six in twelve' || rq[2] !== 'rates' || rq[3] < 10) throw new Error('the rates explainer: ' + JSON.stringify(rq));
  if (!/6 in 12 · v\/h = 0\.5 · the writer's angle 26\.57°/.test(rd[0]) || Math.abs(rd[1] - 0.055) > 0.003)
    throw new Error('the rates dial: ' + JSON.stringify(rd));
  if (!rlit || rlit.length !== 1) throw new Error('the rates lit phrase: ' + JSON.stringify(rlit));
});

/* TEXT IN A SCENE, AND AN EXPLAINER'S BEATS. A scene link's <text> comes in as exact shapes, one a part of each
   glyph, holes kept (the 8's counters); a draw-on clip on the label is staggered across its parts; the SVG export
   writes the holes with evenodd. The beats panel (the timeline's beats…) shows one beat a stretch between stops,
   a title typed there is kept, a beat added at the clock adds a stop, undo takes it back; the .tvfs carries the
   beats; preview opens the explainer page built from them; ?src= does the same from a file; and a scene of a
   version the player does not read is refused. */
await step('text in a scene, and beats', async () => {
  const zlib = await import('node:zlib');
  const scene = o => new URL('draw.html', base).href + '#scene=z' + zlib.deflateRawSync(Buffer.from(JSON.stringify(Object.assign({ v: 1 }, o)))).toString('base64url');
  const bp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  bp.on('pageerror', e => failures.push(`[beats] ${e.message}`));
  await bp.route(/fonts\.g/, r => r.abort());
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect x="20" y="20" width="80" height="80" fill="#4f8fd6"/>'
      + '<text x="150" y="80" font-size="48" font-family="sans-serif" fill="#222">Hi 8</text></svg>';
    await bp.goto(scene({ name: 'labelled', svg, play: false, stops: [0.5], beats: [{ title: 'one', text: 'a **b**' }, { title: 'two', text: '' }],
      morphs: [{ keys: [0], clip: { start: 0, len: 0.5 }, show: 'draw' }, { keys: [1], clip: { start: 0.5, len: 0.5 }, show: 'draw' }] }), { waitUntil: 'load' });
    await bp.waitForSelector('#bUndo', { state: 'visible', timeout: 60000 });
    await bp.waitForFunction(() => !/scene=/.test(location.hash) && window.__box.morph(), null, { timeout: 15000 });
    await bp.waitForTimeout(800);
    const m = await bp.evaluate(() => window.__box.morph());
    if (!(m.runs.length >= 5)) throw new Error('the label came in as ' + (m.runs.length - 1) + ' parts, not one a glyph part');
    const holes = await bp.evaluate(() => (window.__box.morphSvg({}) || '').split('evenodd').length - 1);
    if (holes < 1) throw new Error('the 8 lost its counters in the SVG export');
    let b = await bp.evaluate(() => window.__box.beats());
    if (b.beats.map(x => x.title).join() !== 'one,two' || b.tvfs.length !== 2) throw new Error('the scene link\'s beats: ' + JSON.stringify(b));
    await bp.click('#bMorphTimeline');
    await bp.waitForTimeout(300);
    await bp.click('#tlBeats');
    await bp.waitForTimeout(300);
    if (await bp.evaluate(() => document.querySelectorAll('#btList .bt-beat').length) !== 2) throw new Error('the beats panel does not show two beats');
    await bp.fill('#btList .bt-beat[data-i="1"] input[data-f="title"]', 'second');
    await bp.waitForTimeout(1500);
    await bp.evaluate(() => { document.activeElement.blur(); const e = document.getElementById('morphT'); e.value = 250; e.dispatchEvent(new Event('input')); });
    await bp.click('#btAdd');
    await bp.waitForTimeout(400);
    b = await bp.evaluate(() => window.__box.beats());
    if (b.stops.join() !== '0.25,0.5' || b.beats.map(x => x.title).join() !== 'one,,second') throw new Error('a beat added at 0.25: ' + JSON.stringify(b));
    const [pp] = await Promise.all([bp.context().waitForEvent('page'), bp.click('#btPreview')]);
    pp.on('pageerror', e => failures.push(`[beats preview] ${e.message}`));
    await pp.waitForFunction(() => window.__explained && window.__explained.ctl.scene, null, { timeout: 20000 });
    const pv = await pp.evaluate(() => [window.__explained.beats, window.__explained.titles.slice(0, 3).join()]);
    if (pv[0] !== 4 || pv[1] !== 'one,Step 2,second') throw new Error('the preview\'s beats: ' + JSON.stringify(pv));
    // (version 2, 29 Oct 2026, adds a morph's xform: the player reads 1 and 2, and refuses 3)
    const refused = await pp.evaluate(() => { try { TVFPlayer.load({ format: 'tvf-scene', v: 3, items: [], morphs: [] }); return false; } catch (e) { return /version 3/.test(e.message); } });
    if (!refused) throw new Error('the player read a version 3 scene');
    await pp.close();
    await bp.bringToFront();
    await bp.click('#bUndo');
    await bp.waitForTimeout(500);
    b = await bp.evaluate(() => window.__box.beats());
    if (b.stops.join() !== '0.5' || b.beats.map(x => x.title).join() !== 'one,second') throw new Error('undo after adding a beat: ' + JSON.stringify(b));
  } finally {
    await bp.close();
  }
  const sp = await browser.newPage({ viewport: { width: 1300, height: 860 } });
  sp.on('pageerror', e => failures.push(`[explained ?src] ${e.message}`));
  await sp.route(/fonts\.g/, r => r.abort());
  await sp.goto(new URL('gallery/explained.html?src=../player/examples/explainer.tvfs', base).href, { waitUntil: 'load' });
  await sp.waitForFunction(() => window.__explained && window.__explained.ctl.scene, null, { timeout: 20000 });
  const n = await sp.evaluate(() => [window.__explained.beats, window.__explained.ctl.scene.stops.length]);
  await sp.close();
  if (n[0] !== n[1] + 2) throw new Error('?src= built ' + n[0] + ' beats for ' + n[1] + ' stops');
});

await T.finish();
