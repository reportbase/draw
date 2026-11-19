// A LINE OF ALGEBRA, SOLVED, as a flow (19 Nov 2026, Tom, of what the playground wrote for him: "It seems more suitable
// for geometry or algebra explainers"). A step of algebra is a rearrangement: a term crosses the equals sign, two
// numbers become one, a factor goes under. So each term is a thing and each step is a move. It is the first flow whose
// moving things are words: a move is said in the drawing's units and the editor turns it to each letter's own size,
// so nothing here knows how wide a 5 is.
//
//   npm run flow -- flows/algebra.mjs            writes flows/algebra.tvfs
export default function (TVF_FLOW) {
  const { flow, draw } = TVF_FLOW;
  const INK = '#3b4256', GOLD = '#b9822e', TEAL = '#2f9e8f', RED = '#c4593d', Y = 170, Z = 64;
  const F = flow({ name: 'Solving 3x + 5 = 20', w: 800, h: 340, paper: '#f4f1ea' });
  const word = (name, x, s, fill, y) => F.shape(name, draw.text(x, y || Y, s, fill || INK, Z));
  // 3x + 5 = 20, a thing a term; the three and the x apart, since they part in the end
  const three = word('three', 190, '3', TEAL), x = word('x', 228, 'x'), plus = word('plus', 290, '+'), five = word('five', 352, '5', RED),
    eq = word('eq', 420, '='), twenty = word('twenty', 490, '20');
  // what the steps bring: the sign the five wears on the other side, the fifteen, the bar the three goes under, the answer
  const minus = word('minus', 578, '−', RED), fifteen = word('fifteen', 490, '15', GOLD),
    bar = F.shape('bar', draw.line([[482, Y - 18], [566, Y - 18]], INK, 4)), answer = word('answer', 490, '5', GOLD);

  F.beat('An equation', 'Three of something and [five more](plus, five) make [twenty](twenty). What is the [something](x)?', b => {
    b.reveal([three, x, plus, five, eq, twenty], { gap: 0.18, dur: 0.4 });
  });
  F.beat('The five crosses', 'Take five from both sides. On the left it is gone; on the right it stands [taken away](minus, five).', b => {
    b.hide(plus, { dur: 0.4 });
    b.move(five, [282, 0], { dur: 1.1 });
    b.show(minus, { dur: 0.3 });
  });
  F.beat('Twenty less five', 'Twenty less five is [fifteen](fifteen): three of the something make fifteen.', b => {
    b.leave([twenty, minus, five], { gap: 0, dur: 0.4 });
    b.show(fifteen, { dur: 0.5 });
    b.together(() => { b.move(three, [62, 0], { dur: 0.8 }); b.move(x, [62, 0], { dur: 0.8 }); });      // the left side closes up to the sign
  });
  F.beat('The three goes under', 'Divide both sides by [three](three). It leaves the x and stands [under the fifteen](bar, three).', b => {
    b.together(() => { b.move(fifteen, [0, -34], { dur: 0.6 }); b.show(bar, { in: 'draw', dur: 0.6 }); });
    b.move(three, [318, 52], { dur: 1.1 });
    b.move(x, [100, 0], { dur: 0.6 });
  });
  F.beat('Five', 'Fifteen in threes is [five](answer). The [something](x) is five.', b => {
    b.leave([fifteen, bar, three], { gap: 0, dur: 0.4 });
    b.show(answer, { in: 'pop', dur: 0.5 });
  });
  return F.build();
}
