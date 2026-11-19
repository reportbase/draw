// THE SWEEP AND ITS TWO FACES, as a flow (19 Nov 2026, Tom: "I think this is among the most fundamental concepts in
// math and science. Everyone gets it wrong. I believe we now have it correct. This should be our first explainer.").
// The words are his, in the order he gave them: "A sweep is H to V." "Drop the thumb, use a bar. Orientate the bar
// horizontally. The bar has a length of 1." "Rotate the bar to vertical." "There is outside and inside face, they are
// inverses. Multiplying them removes the facing." "1 has no facing, it's the discrete truth." And of the names this has
// gone by: "Inscribed and central are not wrong, just that they are dhv." "The shv concept is the sweep, no angles, no
// trig." So the words here name no angle and use no trig.
//
// The picture is drawn by a writer, as every picture is, and what it draws is measured here and not assumed: the bar's
// far end goes Ω for a bar of 1 (the outside face: sweep for bar); the place on the bar whose own sweep is 1 stands
// 1/Ω along it (the inside face: bar for sweep). Laid straight beside the bar, the first is Ω bars long and the
// second is the bar. The two are one sweep read each way, and their product is the bar.
//
//   npm run flow -- flows/sweep.mjs            writes flows/sweep.tvfs
export default function (TVF_FLOW) {
  const { flow, draw } = TVF_FLOW;
  const INK = '#3b4256', GOLD = '#b9822e', TEAL = '#2f9e8f', VIOLET = '#7c5cff', PALE = '#cfc8b8';
  const F = flow({ name: 'The sweep and its two faces', w: 900, h: 560, paper: '#f4f1ea' });
  const OX = 90, OY = 480, U = 260, OMEGA = Math.PI / 2, STEPS = 8, PER = 4, N = STEPS * PER;      // the bar is U long; the sweep in 8 steps, 4 points a step
  // where a place r along the bar is when the sweep has gone the share f of the way from H to V
  const at = (r, f) => [OX + r * U * Math.cos(f * OMEGA), OY - r * U * Math.sin(f * OMEGA)];
  // the path a place has left behind it when the sweep has gone k steps: all N + 1 points, those not yet reached
  // standing on the place itself, so the path grows with the bar and every pose has the same number of points
  const trail = (r, k) => Array.from({ length: N + 1 }, (_, i) => at(r, Math.min(i, k * PER) / N));
  const long = P => P.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - P[i][0], p[1] - P[i][1]), 0);
  const steps = Array.from({ length: STEPS + 1 }, (_, k) => k), up = steps.slice(1), down = steps.slice(0, -1).reverse();

  const hline = F.shape('hline', draw.line([[OX, OY], [OX + U + 70, OY]], PALE, 2)), vline = F.shape('vline', draw.line([[OX, OY], [OX, OY - U - 70]], PALE, 2));
  const lh = F.shape('lh', draw.text(OX + U + 82, OY + 10, 'H', INK, 30)), lv = F.shape('lv', draw.text(OX - 11, OY - U - 84, 'V', INK, 30));
  const INSIDE = 1 / OMEGA;                                                                       // the place on the bar whose sweep is 1
  const outer = F.shape('outer', steps.map(k => draw.line(trail(1, k), TEAL, 4))), inner = F.shape('inner', steps.map(k => draw.line(trail(INSIDE, k), VIOLET, 4)));
  const bar = F.shape('bar', steps.map(k => draw.line([[OX, OY], at(1, k / STEPS)], GOLD, 9)));
  const mark = F.shape('mark', steps.map(k => { const c = at(INSIDE, k / STEPS); return draw.ring(c[0], c[1], 9, VIOLET, 16); }));
  // laid straight, beside the bar, from one left edge: the bar, the far end's path, the inside place's path, and how
  // far along the bar that place stands. A path is straightened point for point, so its length is kept.
  const RX = 440, row = k => 190 + 78 * k, flat = (len, y) => Array.from({ length: N + 1 }, (_, i) => [RX + len * i / N, y]);
  const outerLen = long(trail(1, STEPS)), innerLen = long(trail(INSIDE, STEPS));
  const unit = F.shape('unit', draw.line([[RX, row(0)], [RX + U, row(0)]], GOLD, 9)), l1 = F.shape('l1', draw.text(RX + U + 16, row(0) + 10, '1', GOLD, 30));
  const outerFlat = F.shape('outerFlat', [draw.line(trail(1, STEPS), TEAL, 4), draw.line(flat(outerLen, row(1)), TEAL, 4)]), lo = F.shape('lo', draw.text(RX + outerLen + 16, row(1) + 10, 'Ω', TEAL, 30));
  const innerFlat = F.shape('innerFlat', [draw.line(trail(INSIDE, STEPS), VIOLET, 4), draw.line(flat(innerLen, row(2)), VIOLET, 4)]), li1 = F.shape('li1', draw.text(RX + innerLen + 16, row(2) + 10, '1', VIOLET, 30));
  const stands = F.shape('stands', draw.line([[RX, row(3)], [RX + INSIDE * U, row(3)]], VIOLET, 9)), li = F.shape('li', draw.text(RX + INSIDE * U + 16, row(3) + 10, '1/Ω', VIOLET, 30));
  const E = F.terms([['eo', 'Ω', TEAL], ' ', ['ex', '×'], ' ', ['ei', '1/Ω', VIOLET], ' ', ['ee', '='], ' ', ['e1', '1', GOLD]], { y: 96, size: 54, center: RX + 190, fill: INK });
  const sweep = (b, others) => b.together(() => { b.go(bar, up, { dur: 0.3, ease: 'linear' }); for (const t of others || []) b.go(t, up, { dur: 0.3, ease: 'linear' }); });
  const back = b => b.go(bar, down, { dur: 0.07, ease: 'linear' });

  F.beat('A bar of 1', 'A bar lies along [H](hline, lh). Its length is [1](bar). It has two ends.', b => {
    b.together(() => { b.show(hline, { in: 'draw', dur: 0.6 }); b.show(vline, { in: 'draw', dur: 0.6 }); });
    b.together(() => { b.show(lh, { dur: 0.3 }); b.show(lv, { dur: 0.3 }); });
    b.show(bar, { in: 'draw', dur: 0.6 });
  });
  F.beat('The sweep', 'Turn the [bar](bar) to [V](vline, lv). That is a sweep: H to V.', b => { sweep(b); });
  F.beat('The outside face', 'Sweep again, and follow the far end. For a bar of [1](unit, l1) it goes [Ω](outer, outerFlat, lo). That is the outside face.', b => {
    back(b);
    b.show(outer, { in: 'cut' });
    sweep(b, [outer]);
    b.together(() => { b.show(unit, { dur: 0.4 }); b.show(l1, { dur: 0.4 }); });
    b.show(outerFlat, { in: 'cut' });
    b.go(outerFlat, 1, { dur: 1.1 });
    b.show(lo, { dur: 0.3 });
  });
  F.beat('The inside face', 'Now follow [the place](mark) whose own path is [1](innerFlat, li1), the bar\'s length. It stands [1/Ω](stands, li) along the bar. That is the inside face.', b => {
    back(b);
    b.together(() => { b.show(mark, { in: 'cut' }); b.show(inner, { in: 'cut' }); });
    b.together(() => { b.go(bar, up, { dur: 0.3, ease: 'linear' }); b.go(inner, up, { dur: 0.3, ease: 'linear' }); b.go(mark, up, { dur: 0.3, ease: 'linear' }); });
    b.show(innerFlat, { in: 'cut' });
    b.go(innerFlat, 1, { dur: 1.1 });
    b.show(li1, { dur: 0.3 });
    b.together(() => { b.show(stands, { dur: 0.4 }); b.show(li, { dur: 0.4 }); });
  });
  F.beat('Inverses', 'The two faces are inverses. [Ω](eo) times [1/Ω](ei) is [1](e1, unit): in a writer\'s letters, π/2 times 2/π. Multiplying them removes the facing. 1 has none.', b => {
    b.reveal([E.t.eo, E.t.ex, E.t.ei, E.t.ee, E.t.e1], { gap: 0.25, dur: 0.35 });
  });
  F.beat('Two names', 'Writers call the two faces central and inscribed. That is not wrong; it is DHV. The SHV concept is the sweep: no angles, no trig.', b => { b.wait(1.2); });
  const piece = F.build();
  // what the picture draws, measured from its own points, in bars
  piece.run = { outer: outerLen / U, inner: innerLen / U, stands: INSIDE, product: (outerLen / U) * INSIDE };
  return piece;
}
