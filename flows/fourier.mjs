// A SQUARE WAVE FROM SINES, as a flow (18 Nov 2026, Tom: "Proceed with your recomendations", the second larger piece). A
// curve that is one thing with a pose for each partial sum: the sum of the first n odd harmonics of a square wave,
// (4/π) Σ sin(kx)/k over k = 1, 3, 5 …, at n = 1, 2, 3, 5, 9 and 20. The curve goes from each to the next, and under it
// the harmonic being added goes from each to the next too, smaller and faster every time. Every point is worked out
// here, and so is what the last beat says: how far the sum still overshoots the wave beside each jump (Gibbs), which
// the run measures and which does not go away.
//
//   npm run flow -- flows/fourier.mjs
export default function (TVF_FLOW) {
  const { flow, draw } = TVF_FLOW;
  const W = 900, H = 560, X0 = 70, X1 = 830, MID = 210, AMP = 120, LOW = 455, PTS = 240;
  const INK = '#3b4256', GOLD = '#d4a052', TEAL = '#2f9e8f', VIOLET = '#7c5cff', PALE = '#cfc8b8';
  const F = flow({ name: 'A square wave from sines', w: W, h: H, paper: '#f4f1ea' });

  const xs = Array.from({ length: PTS + 1 }, (_, i) => 4 * Math.PI * i / PTS);                 // two periods
  const px = x => X0 + (X1 - X0) * x / (4 * Math.PI);
  const sum = n => x => { let s = 0; for (let j = 0; j < n; j++) { const k = 2 * j + 1; s += Math.sin(k * x) / k; } return 4 / Math.PI * s; };
  const curve = (f, y0, col, w) => draw.line(xs.map(x => [px(x), y0 - AMP * f(x)]), col, w);
  const NS = [1, 2, 3, 5, 9, 20];

  const axis = F.shape('axis', draw.line([[X0, MID], [X1, MID]], PALE, 1.5));
  // the wave being built: flat tops joined by upright jumps
  const jumps = [0, 1, 2, 3, 4].map(j => px(j * Math.PI));
  const square = F.shape('square', draw.line(jumps.slice(0, -1).flatMap((x, j) => { const y = MID - AMP * (j % 2 ? -1 : 1); return [[x, y], [jumps[j + 1], y]]; }), PALE, 5));
  const wave = F.shape('wave', NS.map(n => curve(sum(n), MID, VIOLET, 3)));
  // the harmonic added at each step: the last term of the sum, drawn on its own line below
  const low = F.shape('low', draw.line([[X0, LOW], [X1, LOW]], PALE, 1.5));
  const term = F.shape('term', NS.map(n => { const k = 2 * n - 1; return curve(x => 0.55 * 4 / Math.PI * Math.sin(k * x) / k, LOW, TEAL, 2.5); }));      // (at 0.55 of the sum's scale: the first harmonic is taller than the wave, and ran off the paper)
  const count = NS.map((n, i) => F.shape('n' + n, draw.text(X1 - 150, 52, n === 1 ? '1 sine' : n + ' sines', INK, 26)));
  // (a line under the harmonic naming it, 'adding sin(5x) / 5', was six more labels: every letter of a label is a shape, and
  // with them the scene was 164 shapes, past the 150 at which the editor opens it as leaves, and 911 KB. The words say it.)

  // THE OVERSHOOT, measured: how far the sum's highest point stands above the wave's top, as a share of the jump (from −1
  // to 1, so 2), for each n. Gibbs's number, about 8.95%, is what it settles to.
  const over = NS.map(n => { let m = 0; for (let i = 0; i <= 20000; i++) m = Math.max(m, sum(n)(Math.PI * i / 20000)); return (m - 1) / 2; });
  const pct = v => (100 * v).toFixed(1) + '%';

  // one step: the count and the harmonic's name change, the harmonic goes to the next, then the sum takes it in
  const step = (b, i, d) => {
    b.together(() => { b.hide(count[i - 1], { out: 'cut' }); b.show(count[i], { in: 'cut' }); });
    b.go(term, i, { dur: d * 0.6 });
    b.go(wave, i, { dur: d });
    b.wait(d * 0.4);
  };

  F.beat('A square wave', 'A [square wave](square): up, down, up, down, with a jump between. No smooth curve has a jump in it.', b => {
    b.show(axis, { in: 'draw', dur: 0.6 });
    b.show(square, { in: 'draw', dur: 1.4 });
  });
  F.beat('One sine', 'Start with [one sine](wave) of the same length. It is the right way up in the right places, and nothing like square.', b => {
    b.together(() => { b.show(low, { in: 'draw', dur: 0.5 }); b.show(count[0]); });
    b.show(term, { in: 'draw', dur: 0.9 });
    b.show(wave, { in: 'draw', dur: 1.2 });
  });
  F.beat('Add the odd harmonics', 'Add [a sine](term) three times as fast and a third as tall, then one five times as fast and a fifth as tall. Each one flattens the tops a little more and steepens the sides.', b => {
    step(b, 1, 1.3); step(b, 2, 1.3);
  });
  F.beat('And more', `With ${NS[3]}, ${NS[4]} and ${NS[5]} the tops are nearly flat. But beside each jump [the sum](wave) still stands above the wave: by ${pct(over[3])}, ${pct(over[4])} and ${pct(over[5])} of the jump. More sines make that ear narrower, not shorter; it settles near ${pct(over[5])} and stays.`, b => {
    step(b, 3, 1.1); step(b, 4, 1.1); step(b, 5, 1.4);
  }, { tail: 1.6 });
  const piece = F.build();
  piece.run = { ns: NS, over };
  return piece;
}
