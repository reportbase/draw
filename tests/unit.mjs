// Smoke test, part "unit": the two library files that read nothing of a page, run in Node with no browser:
// tvf-core.js (the kernel, the leaf layout, reconstruction, the spectral routines, the shapes) and
// tvf-reader.js (parseTvfText). About a second.
//
//   node tests/unit.mjs              this part alone
//   npm test                         every part, by tests/smoke.mjs
//
// The browser parts check that the editor and the gallery work; they say little about which number went wrong
// when the library does. These are the library's own properties, each one a statement of the papers'
// (papers/tb_classical.md: the kernel is a partition of unity and interpolates at the leaves; papers/tb_spectral.md
// §21: the transform route is the same reconstruction; §22: the Fejér reconstruction stays inside the leaves'
// range) or of the format (papers/tvf.md: what a .tvf file is), checked on the files as 3d and games copy them.
// Added 12 Nov 2026 ("fast unit tests for the library files").

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const load = async name => {
  const ctx = { module: { exports: {} } };
  vm.createContext(ctx);
  vm.runInContext(await readFile(ROOT + name, 'utf8'), ctx, { filename: name });
  return ctx.module.exports;
};
const CORE = await load('tvf-core.js'), t = CORE.tvf;
const { parseTvfText } = await load('tvf-reader.js');

const failures = [];
function step(name, fn){
  if (process.env.ONLY && !process.env.ONLY.split('|').some(o => name.includes(o))) return;
  try { fn(); console.log('ok   ' + name); }
  catch (e){ failures.push(`[${name}] ${e.message.split('\n')[0]}`); console.log('FAIL ' + name); }
}
const worst = (a, f) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(f(a[i], i))); return m; };
const want = (ok, what) => { if (!ok) throw new Error(what); };
const TAU = 2 * Math.PI;
// leaves for the checks: a curve with content at every frequency a count of leaves can hold
const leaves = N => Float64Array.from({ length: N }, (_, k) => Math.sin(1.3 * k) + 0.4 * Math.cos(0.7 * k * k) + 0.1 * k);

step('the leaves sit at the midpoints of N equal arcs of the full turn', () => {
  for (const N of [3, 8, 16, 33]) {
    const p = t.leafPositions(N);
    want(p.length === N, `N=${N}: ${p.length} positions`);
    want(worst(p, (v, k) => v - (k + 0.5) * TAU / N) < 1e-14, `N=${N}: a leaf is off its midpoint`);
  }
});

step('the kernel is a partition of unity, and is 1 at its own leaf and 0 at every other', () => {
  for (const N of [3, 4, 16, 33, 64]) {
    let pou = 0, off = 0;
    for (let i = 0; i < 60; i++) {
      const phi = 0.1237 * i; let sum = 0;
      for (let k = 0; k < N; k++) sum += t.kernel(phi - (k + 0.5) * TAU / N, N);
      pou = Math.max(pou, Math.abs(sum - 1));
    }
    for (let j = 1; j < N; j++) off = Math.max(off, Math.abs(t.kernel(j * TAU / N, N)));
    want(pou < 1e-12, `N=${N}: the kernels sum to 1 ± ${pou}`);
    want(Math.abs(t.kernel(0, N) - 1) < 1e-12 && off < 1e-12, `N=${N}: kernel(0) = ${t.kernel(0, N)}, at another leaf ${off}`);
  }
});

step('the reconstruction passes through every leaf, and reads the same by sum, by matrix and by transform', () => {
  for (const N of [5, 16, 32, 33]) {
    const ch = leaves(N), p = t.leafPositions(N);
    want(worst(p, (phi, k) => t.evalAt(ch, phi) - ch[k]) < 1e-12, `N=${N}: evalAt misses a leaf`);
    const M = 4 * N, rec = t.reconstruct(ch, M);
    want(rec.length === M, `N=${N}: ${rec.length} samples for M=${M}`);
    want(worst(rec, (v, i) => v - t.evalAt(ch, i * TAU / M)) < 1e-11, `N=${N}: reconstruct and evalAt part`);
    if (CORE.isPow2(N)) want(worst(CORE.reconstructFFT(ch, M), (v, i) => v - rec[i]) < 1e-11, `N=${N}: the transform route parts from the sum`);
  }
  const flat = new Float64Array(16).fill(7);
  want(worst(t.reconstruct(flat, 64), v => v - 7) < 1e-12, 'a constant is not reconstructed as itself');
});

step('the Fejér reconstruction keeps a constant and never leaves the range of its leaves', () => {
  for (const N of [16, 32]) {
    const ch = leaves(N), f = CORE.reconstructFejer(ch, 8 * N);
    const lo = Math.min(...ch), hi = Math.max(...ch);
    want(Math.min(...f) >= lo - 1e-9 && Math.max(...f) <= hi + 1e-9, `N=${N}: Fejér overshoots [${lo}, ${hi}]: [${Math.min(...f)}, ${Math.max(...f)}]`);
    want(worst(CORE.reconstructFejer(new Float64Array(N).fill(1), 4 * N), v => v - 1) < 1e-12, `N=${N}: Fejér of a constant`);
  }
});

step('powers of two', () => {
  want(CORE.isPow2(1) && CORE.isPow2(64) && !CORE.isPow2(0) && !CORE.isPow2(12), 'isPow2');
  want(CORE.ceilPow2(5) === 8 && CORE.ceilPow2(16) === 16 && CORE.ceilPow2(17) === 32, 'ceilPow2');
});

step('arc-length resampling lays leaves evenly along a polyline', () => {
  const r = t.arcLengthResample([0, 10, 10, 0], [0, 0, 10, 10], 8);
  want(Array.from(r.x).join() === '2.5,7.5,10,10,7.5,2.5,0,0' && Array.from(r.y).join() === '0,0,2.5,7.5,10,10,7.5,2.5',
    'a square in 8 leaves: ' + Array.from(r.x).join() + ' / ' + Array.from(r.y).join());
  // a circle drawn as 720 points comes back as leaves on the circle, evenly spaced
  const px = [], py = [];
  for (let i = 0; i < 720; i++) { px.push(50 * Math.cos(i * TAU / 720)); py.push(50 * Math.sin(i * TAU / 720)); }
  const c = t.arcLengthResample(px, py, 24);
  want(worst(c.x, (x, k) => Math.hypot(x, c.y[k]) - 50) < 0.01, 'leaves off the circle');
  const gaps = Array.from(c.x, (x, k) => Math.hypot(x - c.x[(k + 1) % 24], c.y[k] - c.y[(k + 1) % 24]));
  want(Math.max(...gaps) - Math.min(...gaps) < 0.01, 'leaves unevenly spaced: ' + Math.min(...gaps) + ' to ' + Math.max(...gaps));
});

step('the shapes: a circle is round, resampling there and back keeps a shape, a half mix lies between', () => {
  const c = t.circle(64, { r: 100 });
  want(c.x.length === 64 && worst(c.x, (x, k) => Math.hypot(x, c.y[k]) - 100) < 1e-9, 'circle(64, r 100) is not a circle of 100');
  const back = c.clone().resample(127).resample(64);
  want(worst(back.x, (v, k) => v - c.x[k]) < 1e-9, 'resample 64 → 127 → 64 moved a leaf');
  for (const make of ['ellipse', 'superellipse', 'rect', 'polygon', 'star', 'blob', 'rose']) {
    const s = t[make]();
    want(s.x.length === s.y.length && s.x.length >= 8 && Array.from(s.x).every(Number.isFinite) && Array.from(s.y).every(Number.isFinite), make + '() has a leaf that is not a number');
  }
  const a = t.circle(64, { r: 100 }), b = t.circle(64, { r: 200 }), m = t.mix(a, b, 0.5);
  want(worst(m.x, (x, k) => Math.hypot(x, m.y[k]) - 150) < 1e-6, 'half way between circles of 100 and 200 is not one of 150');
});

step('a .tvf file: one curve, its meta, and several curves in one file', () => {
  const one = parseTvfText('TVF 4 1 2\n#meta name:sq\n0 1 0 -1 0\n0 0 1 0 -1\n');
  want(one.blockCount === 1 && one.subpaths.length === 1 && one.meta.name === 'sq', 'one block read as ' + JSON.stringify(one).slice(0, 160));
  const sp = one.subpaths[0];
  want(Array.from(sp.leafX).join() === '1,0,-1,0' && Array.from(sp.leafY).join() === '0,1,0,-1' && sp.gname === 'sq', 'its leaves: ' + JSON.stringify(sp).slice(0, 160));
  // two files joined end to end (cat a.tvf b.tvf), blank lines and CRLF tolerated
  const two = parseTvfText('\r\nTVF 3 1 2\r\n0 1 2 3\r\n0 4 5 6\r\n\r\nTVF 3 1 2\r\n0 7 8 9\r\n0 1 1 1\r\n');
  want(two.blockCount === 2 && two.subpaths.length === 2 && Array.from(two.subpaths[1].leafX).join() === '7,8,9', 'two blocks read as ' + JSON.stringify(two).slice(0, 200));
  // the legacy bundle: TVF N S 2 is S curves, each row's x then its y
  const old = parseTvfText('TVF 3 2 2\n0 1 2 3\n0 4 5 6\n1 7 8 9\n1 1 1 1\n');
  want(old.subpaths.length === 2 && Array.from(old.subpaths[0].leafY).join() === '4,5,6' && Array.from(old.subpaths[1].leafX).join() === '7,8,9', 'a legacy bundle read as ' + JSON.stringify(old).slice(0, 200));
});

step('what is not a curve file is refused, and says why', () => {
  const why = text => { try { parseTvfText(text); return ''; } catch (e) { return e.message; } };
  want(/empty/.test(why('\n\n')), 'an empty file: ' + why('\n\n'));
  want(/not a TVF file/.test(why('<svg></svg>')), 'an svg: ' + why('<svg></svg>'));
  want(why('TVF 4 1 3\n0 1 2 3 4\n0 1 2 3 4\n0 1 2 3 4\n') !== '', 'three channels were taken as a curve');
  want(why('TVF 4 1 2\n0 1 2 3\n0 1 2 3 4\n') !== '', 'a row one leaf short was accepted');
  want(why('TVF 4 1 2\n0 1 2 3 4\n') !== '', 'a curve with no y row was accepted');
});

// tvf-flow.js (18 Nov 2026): a scene said in code. What it promises is arithmetic, so it is checked here: seconds
// become shares of the loop, things said in turn happen in turn, a pose holds between moves and to the end, words
// light the morphs of the things they name, and what cannot be played is refused when it is written.
const FLOW = await load('tvf-flow.js');
const sq = (x, y) => FLOW.draw.rect(x, y, 10, 10, '#000');
step('a flow: said in turn, played in turn; together starts together; stagger steps', () => {
  const F = FLOW.flow({ w: 100, h: 100 }), a = F.shape('a', [sq(0, 0), sq(50, 0)]), b = F.shape('b', sq(0, 50)), c = F.shape('c', sq(50, 50));
  F.beat('one', 'An [a](a) and [two more](b, c).', x => { x.show(a, { dur: 1 }); x.wait(1); x.go(a, 1, { dur: 2 }); }, { tail: 0 });        // 0–1, wait to 2, move 2–4
  F.beat('two', x => { x.together(() => { x.show(b, { dur: 1 }); x.show(c, { dur: 3 }); }); x.wait(1); }, { tail: 0 });                    // both at 4; the cursor at 7, then 8
  const p = F.build(), M = p.scene.morphs, near = (u, v) => Math.abs(u - v) < 2e-4;
  want(p.seconds === 8 && p.scene.loop === 8, 'the loop: ' + p.seconds);
  want(p.scene.stops.length === 1 && near(p.scene.stops[0], 0.5), 'the stop: ' + p.scene.stops);
  want(M.length === 3 && near(M[0].clip.start, 0) && near(M[0].clip.in.len, 1 / 8), 'a\'s clip: ' + JSON.stringify(M[0].clip));
  want(M[0].keys.join() === '0,0,1,1' && M[0].straight === true, 'a\'s keys hold before and after its move: ' + M[0].keys);
  want(M[0].times.every((t, i) => near(t, [0, 0.25, 0.5, 0.9999][i])), 'a\'s times: ' + M[0].times);
  want(near(M[1].clip.start, 0.5) && near(M[2].clip.start, 0.5) && M[1].keys.length === 1, 'together: ' + M[1].clip.start + ', ' + M[2].clip.start);
  want(p.scene.beats[0].text === 'An [a](#lit:0) and [two more](#lit:1,2).', 'the words: ' + p.scene.beats[0].text);
  const G = FLOW.flow({}), T = [0, 1, 2].map(i => G.shape('t' + i, sq(i * 20, 0)));
  G.beat('s', x => x.stagger(T, 0.5, t => x.show(t, { dur: 1 })), { tail: 0 });
  const q = G.build();
  want(q.seconds === 2 && q.scene.morphs.map(m => m.clip.start).every((v, i) => near(v, i * 0.25)), 'stagger: ' + q.scene.morphs.map(m => m.clip.start));
});
step('a flow: acts are a motion or a chain; a path, a parent and onto are named by thing', () => {
  const F = FLOW.flow({}), floor = F.shape('floor', sq(0, 90)), track = F.shape('track', FLOW.draw.line([[0, 0], [90, 0]])),
    ball = F.shape('ball', sq(10, 10)), hat = F.shape('hat', sq(10, 0), { parent: 'ball' }), car = F.shape('car', sq(0, 0), { path: track, turn: true });
  F.beat('b', x => { x.show(floor, { in: 'cut' }); x.show(car, { in: 'cut' }); x.show(hat, { in: 'cut' });
    x.act(ball, { kind: 'throw', amount: 2, onto: floor }, { dur: 1 }); x.act(ball, { kind: 'bounce', amount: 1, onto: 'floor' }, { dur: 3 }); }, { tail: 0 });
  const p = F.build(), M = p.scene.morphs, ballM = M[p.at.ball[0]];
  want(p.seconds === 4 && ballM.motion.kind === 'chain' && ballM.motion.steps.map(s => s.kind + s.share + s.onto).join() === 'throw10,bounce30', 'the chain: ' + JSON.stringify(ballM.motion));
  want(Math.abs(ballM.clip.len - 1) < 2e-4 && ballM.clip.in.kind === 'fade' && ballM.keys.length === 1, 'the ball\'s clip: ' + JSON.stringify(ballM.clip));
  want(M[p.at.hat[0]].parent === p.at.ball[0] && M[p.at.car[0]].path === 1 && M[p.at.car[0]].turn === true, 'the hat\'s parent and the car\'s path: ' + M[p.at.hat[0]].parent + ', ' + M[p.at.car[0]].path);
  const why = fn => { try { const G = FLOW.flow({}); fn(G); G.build(); return ''; } catch (e) { return e.message; } };
  want(/wobble is not a field/.test(why(G => { const a = G.shape('a', sq(0, 0), { wobble: 1 }); G.beat('b', x => x.show(a)); })), 'a field that is not one');
  want(/cannot also act/.test(why(G => { const a = G.shape('a', [sq(0, 0), sq(1, 1)]); G.beat('b', x => { x.go(a, 1); x.act(a, { kind: 'bounce' }); }); })), 'going and acting');
  want(/after a gap/.test(why(G => { const a = G.shape('a', sq(0, 0)); G.beat('b', x => { x.act(a, { kind: 'bounce' }); x.wait(1); x.act(a, { kind: 'roll' }); }); })), 'acts with a gap');
});
step('a flow: a pose a thing never takes is not in the drawing', () => {
  const F = FLOW.flow({ paper: '#fff' }), a = F.shape('a', [sq(0, 0), sq(20, 0), sq(40, 0), sq(60, 0)]), still = F.shape('still', [sq(0, 80), sq(9, 80)]), c = F.shape('c', sq(0, 40));
  F.beat('b', x => { x.show(a, { pose: 1 }); x.go(a, 3); x.show(c); x.look([a, c]); });
  const p = F.build(), n = (p.svg.match(/<polygon/g) || []).length, M = p.scene.morphs;
  want(n === 4 && /points="20,0/.test(p.svg) && /points="60,0/.test(p.svg) && !/points="40,0/.test(p.svg) && !/points="9,80/.test(p.svg), 'the drawing holds ' + n + ' outlines: ' + p.svg);
  want(M[0].keys.join() === '1,1,2,2' && M[1].keys.join() === '4' && p.scene.camera[0].fit.join() === '1,2,4', 'the numbers counted again: ' + M[0].keys + ' | ' + M[1].keys + ' | ' + p.scene.camera[0].fit);
});
step('a flow: moves with names, and a thing\'s moves said in any order', () => {
  const F = FLOW.flow({}), T = [0, 1, 2].map(i => F.shape('t' + i, [sq(i * 20, 0), sq(i * 20, 50)]));
  F.define('nod', (b, t, o) => { b.go(t, 1, o); b.go(t, 0, o); });
  F.beat('b', x => { x.reveal(T, { gap: 0.5, dur: 1 });                       // shown at 0, 0.5, 1; the cursor at 2
    x.swap(T[0], 1, T[1], 1, { dur: 1 });                                     // both 2–3
    x.together(() => { x.at(6); x.go(T[2], 1, { dur: 1 }); });                // said first, happens last
    x.at(3); x.nod(T[2], { dur: 1 }); x.at(7); }, { tail: 0 });               // 3–4 down, 4–5 back
  const p = F.build(), M = p.scene.morphs, abs = m => m.times.map(t => +(m.clip.start * 7 + t / 0.9999 * m.clip.len * 7).toFixed(2));
  want(p.seconds === 7 && M.map(m => +(m.clip.start * 7).toFixed(2)).join() === '0,0.5,1', 'reveal: ' + M.map(m => m.clip.start));
  want(abs(M[0]).join() === '0,2,3,7' && abs(M[1]).join() === '0.5,2,3,7', 'swap: ' + abs(M[0]) + ' | ' + abs(M[1]));
  want(abs(M[2]).join() === '1,3,4,5,6,7' && M[2].keys[5] === M[2].keys[2] && M[2].keys[4] === M[2].keys[0] && M[2].keys[5] !== M[2].keys[4], 'a nod, then the move said first: ' + abs(M[2]) + ' ' + M[2].keys);
  const why = fn => { try { const G = FLOW.flow({}); fn(G); G.build(); return ''; } catch (e) { return e.message; } };
  want(/go cannot be a move/.test(why(G => G.define('go', () => {}))), 'a move named for one of the beat\'s own words');
});
step('a flow refuses what could not be played, and says which thing', () => {
  const why = fn => { try { const F = FLOW.flow({}); fn(F); F.build(); return ''; } catch (e) { return e.message; } };
  want(/two things called a/.test(why(F => { F.shape('a', sq(0, 0)); F.shape('a', sq(1, 1)); })), 'a name used twice');
  want(/a has no pose 2/.test(why(F => { const a = F.shape('a', [sq(0, 0), sq(1, 1)]); F.beat('b', x => x.go(a, 2)); })), 'a pose that is not there');
  want(/a is shown twice/.test(why(F => { const a = F.shape('a', sq(0, 0)); F.beat('b', x => { x.show(a); x.show(a); }); })), 'shown twice');
  want(/while it is moving/.test(why(F => { const a = F.shape('a', [sq(0, 0), sq(1, 1)]); F.beat('b', x => x.together(() => { x.go(a, 1); x.go(a, 0); })); })), 'two moves at once');
  want(/name c, which is not shown/.test(why(F => { const a = F.shape('a', sq(0, 0)); F.shape('c', sq(1, 1)); F.beat('b', 'A [thing](c).', x => x.show(a)); })), 'words naming what is not shown');
  want(/needs a beat/.test(why(() => {})), 'no beat');
});

if (failures.length) { console.error(`\nunit: ${failures.length} failure(s):\n` + failures.map(f => '  ' + f).join('\n')); process.exit(1); }
console.log('\nunit: no failures');
