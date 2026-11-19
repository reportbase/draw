// K, NOT N, as a flow (19 Nov 2026, Tom: "TVF does something important.  It shows that N is not needed.    K is all you
// need.", then "Cauchy is the great kull, leaves K, compresses N at the horizon"; docs/tvf-notes.md, "K, not N"). The
// letters are wander's (*Reads and Writes* §5): N how many there are, K how many are held. Two pictures of one idea.
//
// A drawing of N = 720 points is read at K = 16 places, even round the turn (its leaves, the curve library's own
// leafPositions), the points are let go, and the curve is rebuilt from the leaves alone by the curve library's own
// reconstruction (TVF_CORE, tvf-core.js: what the editor draws). Then at 32 and 64 leaves. How near the rebuilt curve
// comes to its leaves, and how far from the drawing it stays, are measured here and said in the words.
//
// Then a field: things standing evenly along the ground are laid on the turn, where even steps of distance bunch
// toward the horizon, and K places even on the turn take them: half inside one thumb, the rest beyond. The lay
// (2/π)·atan(d/H) is worked out by this script, which is a writer; the words give the reader no angle.
//
//   npm run flow -- flows/kn.mjs
export default function (TVF_FLOW) {
  const { flow, draw } = TVF_FLOW, t = globalThis.TVF_CORE.tvf, TAU = 2 * Math.PI;
  const INK = '#3b4256', GOLD = '#d4a052', TEAL = '#2f9e8f', VIOLET = '#7c5cff', PALE = '#cfc8b8', GREY = '#9a927f';
  const F = flow({ name: 'K, not N', w: 2000, h: 620 });
  const paper = F.shape('paper', draw.rect(-200, -200, 2400, 1020, '#f4f1ea'));      // never shown: a still under everything

  // ── THE DRAWING: a closed outline with fine wiggle on it, N points round it ──
  const C = [330, 310], N = 720, R0 = 170;
  const rad = a => R0 * (1 + 0.22 * Math.cos(2 * a + 0.6) + 0.13 * Math.sin(3 * a) + 0.06 * Math.cos(7 * a + 1) + 0.04 * Math.sin(11 * a) + 0.025 * Math.cos(23 * a));
  const at = a => [C[0] + rad(a) * Math.cos(a), C[1] - rad(a) * Math.sin(a)];
  const dense = Array.from({ length: N + 1 }, (_, i) => at(TAU * i / N));
  const ghost = F.shape('ghost', draw.line(dense, PALE, 2.5));
  const drawing = F.shape('drawing', draw.line(dense, INK, 2.5));

  // ── READ AT K PLACES, AND REBUILT: the library's leaves, and its reconstruction of each of x and y ──
  const KS = [16, 32, 64], M = 256;
  const read = K => { const th = t.leafPositions(K); return { th, x: Float64Array.from(th, a => at(a)[0]), y: Float64Array.from(th, a => at(a)[1]) }; };
  const built = KS.map(K => { const L = read(K), X = t.reconstruct(L.x, M), Y = t.reconstruct(L.y, M);
    // how near it comes to its own leaves, and how far it stays from the drawing (the largest gap, in the drawing's units)
    let atLeaf = 0, off = 0;
    L.th.forEach((a, k) => { atLeaf = Math.max(atLeaf, Math.hypot(t.evalAt(L.x, a) - L.x[k], t.evalAt(L.y, a) - L.y[k])); });
    for (let i = 0; i < 720; i++) { const a = TAU * i / 720, p = at(a); off = Math.max(off, Math.hypot(t.evalAt(L.x, a) - p[0], t.evalAt(L.y, a) - p[1])); }
    return { K, L, atLeaf, off, pts: Array.from({ length: M + 1 }, (_, i) => [X[i % M], Y[i % M]]) }; });
  const L16 = built[0].L;
  // the sixteen looks, one line out to each leaf and back, and a dot on each leaf
  const rays = F.shape('rays', draw.line(Array.from(L16.th, (_, k) => [C, [L16.x[k], L16.y[k]]]).flat().concat([C]), GREY, 1.2));
  const leaves = Array.from(L16.th, (_, k) => F.shape('leaf' + k, draw.ring(L16.x[k], L16.y[k], 7, GOLD, 8)));
  F.group('leaves', leaves);
  const rebuilt = F.shape('rebuilt', built.map(b => draw.line(b.pts, VIOLET, 3)));
  const lN = F.shape('lN', draw.text(C[0] - 62, 560, 'N = ' + N, INK, 34));
  const lK = KS.map(K => F.shape('lK' + K, draw.text(C[0] - 52, 560, 'K = ' + K, VIOLET, 34)));

  // ── A FIELD: things even along the ground, and the same things on the turn ──
  const X0 = 1130, X1 = 1880, GY = 230, LY = 430, FAR = 8, NF = 81;
  const lay = d => (2 / Math.PI) * Math.atan(d);                                    // the writer's formula for where a distance falls on the turn
  const comb = (xs, y, h) => xs.flatMap(x => [[x, y], [x, y - h], [x, y]]);          // a base line with a tooth at each place
  const ds = Array.from({ length: NF }, (_, i) => FAR * i / (NF - 1));
  const field = F.shape('field', [
    draw.line(comb(ds.map(d => X0 + (X1 - X0) * d / FAR), GY, 26), TEAL, 1.6),
    draw.line(comb(ds.map(d => X0 + (X1 - X0) * lay(d)), LY, 26), TEAL, 1.6)]);
  const ground = F.shape('ground', draw.line([[X0, GY], [X1 + 40, GY]], GREY, 1.4));
  const turn = F.shape('turn', draw.line([[X0, LY], [X1, LY]], INK, 2));
  const KF = 16, addr = F.shape('addr', draw.line(comb(Array.from({ length: KF }, (_, k) => X0 + (X1 - X0) * (k + 0.5) / KF), LY, -34), GOLD, 3));
  const thumb = F.shape('thumb', [draw.line([[X0 + (X1 - X0) / FAR, GY - 44], [X0 + (X1 - X0) / FAR, GY + 14]], GOLD, 4),
    draw.line([[X0 + (X1 - X0) / 2, LY - 44], [X0 + (X1 - X0) / 2, LY + 14]], GOLD, 4)]);
  const lHome = F.shape('lHome', draw.text(X0 - 8, LY + 78, 'home', INK, 26));
  const lHor = F.shape('lHor', draw.text(X1 - 88, LY + 78, 'horizon', INK, 26));
  const inside = Array.from({ length: KF }, (_, k) => (k + 0.5) / KF).filter(g => g < 0.5).length;
  const pastFar = 1 - lay(FAR);

  const places = Math.floor(-Math.log10(Math.max(...built.map(b => b.atLeaf))));      // the decimal places to which each rebuilt curve meets its leaves
  F.beat('A drawing, N points',
    `[A drawing](drawing) arrives as a line of points, ${N} of them here. Call that count N: how many there are.`, b => {
      b.look([ghost], { pad: 0.28 });
      b.show(ghost, { in: 'cut' });
      b.show(drawing, { in: 'draw', dur: 1.6 });
      b.show(lN);
    });
  F.beat('Read at K places',
    `It is read at [${KS[0]} places](leaves), even round the turn. These are its leaves: each one a place on the turn, and what was met there. Call that count K: how many are held.`, b => {
      b.show(rays, { in: 'draw', dur: 1.6 });
      b.reveal(leaves, { gap: 0.06, dur: 0.3 });
      b.together(() => { b.hide(lN, { dur: 0.3 }); b.show(lK[0], { dur: 0.4 }); });
    });
  F.beat('N is let go',
    `The ${N} points are not kept. [The curve](rebuilt) is made again from the ${KS[0]} leaves alone, and it passes through every one of them, to ${places} decimal places. What it has lost is what ${KS[0]} places cannot tell apart: it stays within ${built[0].off.toFixed(0)} units of [the drawing](ghost), which is about 400 across.`, b => {
      b.together(() => { b.hide(drawing, { dur: 0.8 }); b.hide(rays, { out: 'undraw', dur: 0.8 }); });
      b.show(rebuilt, { in: 'draw', dur: 1.8 });
    });
  F.beat('More leaves, more of it',
    `Ask at ${KS[1]} leaves and it is within ${built[1].off.toFixed(1)} units. At ${KS[2]} it is the drawing again${built[2].off < 1e-6 ? ', to ' + places + ' decimal places' : ' to within ' + built[2].off.toFixed(1) + ' units'}: this drawing has nothing in it finer than ${KS[2]} places can hold. Nothing in any of the three depends on how many points the drawing had.`, b => {
      b.leave(leaves, { gap: 0.02, dur: 0.2 });
      b.together(() => { b.hide(lK[0], { out: 'cut' }); b.show(lK[1], { in: 'cut' }); b.go(rebuilt, 1, { dur: 1.4 }); });
      b.wait(0.6);
      b.together(() => { b.hide(lK[1], { out: 'cut' }); b.show(lK[2], { in: 'cut' }); b.go(rebuilt, 2, { dur: 1.4 }); });
    });
  F.beat('The same K, over a field',
    `[Things](field) stand evenly along the ground, out to ${FAR} thumbs here and on past the edge. Laid on [the turn](turn), from home to the horizon, even steps of distance crowd toward the horizon: [one thumb](thumb) out is already half way along. [${KF} places](addr) even on the turn take them all: ${inside} inside one thumb, ${KF - inside} for everything beyond, and what lies past ${FAR} thumbs, however much, falls in the last ${(100 * pastFar).toFixed(0)}% before the horizon. That is the cull: K places, whatever N.`, b => {
      b.look([ground, turn, lHome, lHor], { pad: 0.16, dur: 1.6 });
      b.together(() => { b.show(ground, { in: 'draw', dur: 0.8 }); b.show(turn, { in: 'draw', dur: 0.8 }); });
      b.show(field, { dur: 0.6 });
      b.show(thumb, { dur: 0.4 });
      b.together(() => { b.show(lHome); b.show(lHor); });
      b.wait(0.6);
      b.together(() => { b.go(field, 1, { dur: 2.2 }); b.go(thumb, 1, { dur: 2.2 }); });
      b.show(addr, { in: 'draw', dur: 1.4 });
    }, { tail: 1.6 });
  const piece = F.build();
  piece.run = { built: built.map(b => ({ K: b.K, atLeaf: b.atLeaf, off: b.off })), inside, pastFar };
  return piece;
}
