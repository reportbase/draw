// PYTHAGORAS BY REARRANGEMENT, as a flow (18 Nov 2026): the first scene written with tvf-flow.js, to try the library on
// something whose every position is worked out. Four equal right triangles (legs a = 3, b = 4) stand in a square of
// side a + b, leaving a tilted square of side c between them. Each slides, none turns, and they leave two squares, a²
// and b², in the same frame: the room left over did not change, so c² = a² + b².
//
//   npm run flow -- flows/pythagoras.mjs            writes flows/pythagoras.tvfs
export default function (TVF_FLOW) {
  const { flow, draw } = TVF_FLOW;
  const U = 70, a = 3 * U, b = 4 * U, S = a + b, X = 155, Y = 90, P = (x, y) => [X + x, Y + y];
  const INK = '#3b4256', GOLD = '#d4a052', TEAL = '#2f9e8f', VIOLET = '#7c5cff', RED = '#c4593d', PALE = '#e9e3d6';
  const F = flow({ name: 'Pythagoras by rearrangement', w: 800, h: 720, paper: '#f4f1ea' });

  const frame = F.shape('frame', draw.line([P(0, 0), P(S, 0), P(S, S), P(0, S), P(0, 0)], INK, 2.5));
  // the room the triangles leave: first one tilted square, then two upright ones
  const cc = F.shape('cc', draw.poly([P(a, 0), P(S, a), P(b, S), P(0, b)], PALE));
  const aa = F.shape('aa', draw.poly([P(0, 0), P(a, 0), P(a, a), P(0, a)], PALE));
  const bb = F.shape('bb', draw.poly([P(a, a), P(S, a), P(S, S), P(a, S)], PALE));
  // each triangle as its right-angle corner, the end of its a leg and the end of its b leg; its second pose is the
  // first slid, so every one keeps its shape on the way
  const slid = (T, dx, dy) => T.map(([x, y]) => [x + dx, y + dy]);
  const TRI = [
    [[0, 0], [a, 0], [0, b], 0, a, TEAL],
    [[S, 0], [S, a], [a, 0], 0, 0, VIOLET],
    [[S, S], [b, S], [S, a], -b, 0, GOLD],
    [[0, S], [0, b], [b, S], a, -b, RED]
  ].map(([p, q, r, dx, dy, col], i) => { const T = [p, q, r];
    return F.shape('tri' + (i + 1), [T, slid(T, dx, dy)].map(Q => draw.poly(Q.map(v => P(...v)), col))); });
  const lc = F.shape('lc', draw.text(X + S / 2 - 14, Y + S / 2 + 12, 'c²', INK, 40));
  const la = F.shape('la', draw.text(X + a / 2 - 14, Y + a / 2 + 12, 'a²', INK, 40));
  const lb = F.shape('lb', draw.text(X + a + b / 2 - 14, Y + a + b / 2 + 12, 'b²', INK, 40));
  const eq = F.shape('eq', draw.text(X + S / 2 - 92, Y + S + 62, 'c² = a² + b²', INK, 36));

  F.beat('Four triangles in a square',
    'Four equal right triangles stand in [a square](frame), one in each corner. The room they leave is [a tilted square](cc, lc) on the long side: c².', b => {
      b.show(frame, { in: 'draw', dur: 1 });
      b.show(cc, { dur: 0.4 });
      b.reveal(TRI, { gap: 0.25, dur: 0.5 });
      b.show(lc);
    });
  F.beat('Slide them',
    'Slide [three of them](tri1, tri3, tri4), turning none. [One](tri2) stays where it is. The square they stand in is the same square.', b => {
      b.together(() => { b.hide(lc, { dur: 0.4 }); b.hide(cc, { dur: 0.4 }); });
      b.together(() => { b.show(aa, { dur: 0.3 }); b.show(bb, { dur: 0.3 }); });
      b.relay([TRI[0], TRI[2], TRI[3]], 1, { gap: 0.35, dur: 1.3 });
    });
  F.beat('Two squares',
    'Now the room they leave is two squares, [one on each short side](aa, la, bb, lb). The triangles took up the same room both times, so what was left is the same: [c² = a² + b²](eq).', b => {
      b.reveal([la, lb], { gap: 0.3 });
      b.wait(0.4);
      b.show(eq, { dur: 0.8 });
    }, { tail: 1.5 });
  return F.build();
}
