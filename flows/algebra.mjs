// A LINE OF ALGEBRA, SOLVED, as a flow (19 Nov 2026, Tom, of what the playground wrote for him: "It seems more suitable
// for geometry or algebra explainers"). A step of algebra is a rearrangement: a term crosses the equals sign, two
// numbers become one, a factor goes under. So each term is a thing and each step is a move. It is the first flow whose
// moving things are words: a move is said in the drawing's units and the editor turns it to each letter's own size,
// and the line is laid out by the library (F.terms), which knows where each term stands: no position here is set by eye.
//
//   npm run flow -- flows/algebra.mjs            writes flows/algebra.tvfs
export default function (TVF_FLOW) {
  const { flow, draw } = TVF_FLOW;
  const INK = '#3b4256', GOLD = '#b9822e', TEAL = '#2f9e8f', RED = '#c4593d', Y = 170, Z = 64;
  const F = flow({ name: 'Solving 3x + 5 = 20', w: 800, h: 340, paper: '#f4f1ea' });
  // 3x + 5 = 20 as a line of terms, a thing a term (the three and the x apart, since they part in the end): the library
  // lays them out and knows where each stands, so a step is said by name
  const L = F.terms([['three', '3', TEAL], ['x', 'x'], ' ', ['plus', '+'], ' ', ['five', '5', RED], ' ', ['eq', '='], ' ', ['twenty', '20']], { y: Y, size: Z, center: 400, fill: INK });
  const { three, x, plus, five, eq, twenty } = L.t;
  // what the steps bring: the sign the five wears on the other side, the fifteen, the bar the three goes under, the answer
  const minus = L.add('minus', '−', L.after('twenty'), RED), fiveAt = L.after('minus'),
    fifteen = L.add('fifteen', '15', L.left('twenty'), GOLD), mid = (L.left('fifteen') + L.right('fifteen')) / 2,
    bar = F.shape('bar', draw.line([[L.left('fifteen') - 8, Y - 18], [L.right('fifteen') + 8, Y - 18]], INK, 4)), answer = L.add('answer', '5', L.left('twenty'), GOLD);
  const close = [L.left('eq') - L.gap - L.right('x'), 0];       // the left side closed up to the sign, once the + 5 is gone

  F.beat('An equation', 'Three of something and [five more](plus, five) make [twenty](twenty). What is the [something](x)?', b => {
    b.reveal([three, x, plus, five, eq, twenty], { gap: 0.18, dur: 0.4 });
  });
  F.beat('The five crosses', 'Take five from both sides. On the left it is gone; on the right it stands [taken away](minus, five).', b => {
    b.hide(plus, { dur: 0.4 });
    b.move(five, L.to('five', fiveAt), { dur: 1.1 });
    b.show(minus, { dur: 0.3 });
  });
  F.beat('Twenty less five', 'Twenty less five is [fifteen](fifteen): three of the something make fifteen.', b => {
    b.leave([twenty, minus, five], { gap: 0, dur: 0.4 });
    b.show(fifteen, { dur: 0.5 });
    b.together(() => { b.move(three, close, { dur: 0.8 }); b.move(x, close, { dur: 0.8 }); });
  });
  F.beat('The three goes under', 'Divide both sides by [three](three). It leaves the x and stands [under the fifteen](bar, three).', b => {
    b.together(() => { b.move(fifteen, [0, -34], { dur: 0.6 }); b.show(bar, { in: 'draw', dur: 0.6 }); });
    b.move(three, L.to('three', mid - L.width('three') / 2, 52), { dur: 1.1 });
  });
  F.beat('Five', 'Fifteen in threes is [five](answer). The [something](x) is five.', b => {
    b.leave([fifteen, bar, three], { gap: 0, dur: 0.4 });
    b.show(answer, { in: 'pop', dur: 0.5 });
  });
  return F.build();
}
