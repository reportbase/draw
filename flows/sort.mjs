// SORTING, BAR BY BAR, as a flow (18 Nov 2026, Tom: "Let's keep pushing TVF into larger situations"): a scene nobody keys
// by hand, because nobody decides what happens in it. The script shuffles ten bars, runs a bubble sort on them, and says
// each thing the sort does as it does it: the bracket goes to the next pair; if the left bar is taller the two change
// places. The timeline is the run of the algorithm. Change the seed, the count or the sort and the scene follows; the
// last beat's words count the comparisons and swaps the run made.
//
// A bar has a pose for every place in the row (a pose is a place here, since a morph is how a thing moves), so ten bars
// are a hundred shapes, under the 150 past which the editor opens a scene as leaves.
//
//   npm run flow -- flows/sort.mjs
export default function (TVF_FLOW, opts = {}) {
  const { flow, draw } = TVF_FLOW;
  const N = opts.n || 10, SEED = opts.seed || 7, W = 900, H = 560, X0 = 110, STEP = 68, BW = 52, BASE = 450, UNIT = 34;
  const INK = '#3b4256', GOLD = '#d4a052';
  const hue = v => { const t = (v - 1) / (N - 1), c = (a, b) => Math.round(a + (b - a) * t).toString(16).padStart(2, '0');
    return '#' + c(0x2f, 0x7c) + c(0x9e, 0x5c) + c(0x8f, 0xff); };                         // teal for the shortest to violet for the tallest
  const F = flow({ name: 'Sorting, bar by bar', w: W, h: H, paper: '#f4f1ea' });

  // the row as it starts: 1..N shuffled by a seeded generator, so the scene is the same each time it is made
  let s = SEED; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const row = Array.from({ length: N }, (_, i) => i + 1);
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [row[i], row[j]] = [row[j], row[i]]; }

  const base = F.shape('base', draw.line([[X0 - 20, BASE + 1], [X0 + (N - 1) * STEP + BW + 20, BASE + 1]], INK, 2.5));
  // each bar, named by its height, with a pose for every place it could stand
  const bar = {};
  for (let v = 1; v <= N; v++)
    bar[v] = F.shape('bar' + v, Array.from({ length: N }, (_, k) => draw.rect(X0 + k * STEP, BASE - v * UNIT, BW, v * UNIT, hue(v))));
  // the bracket under the pair being looked at: a pose for each pair
  const mark = F.shape('mark', Array.from({ length: N - 1 }, (_, k) =>
    draw.line([[X0 + k * STEP, BASE + 14], [X0 + k * STEP, BASE + 26], [X0 + (k + 1) * STEP + BW, BASE + 26], [X0 + (k + 1) * STEP + BW, BASE + 14]], GOLD, 4)));
  // the tops in order, drawn on at the end
  const stair = F.shape('stair', draw.line(Array.from({ length: N }, (_, k) => [[X0 + k * STEP, BASE - (k + 1) * UNIT - 8], [X0 + k * STEP + BW, BASE - (k + 1) * UNIT - 8]]).flat(), GOLD, 3));

  // THE SORT, run here. Each comparison is a step: the pair looked at, and whether they changed places.
  const a = row.slice(), passes = [];
  for (let end = N - 1; end > 0; end--) {
    const pass = []; let moved = false;
    for (let i = 0; i < end; i++) {
      const swap = a[i] > a[i + 1];
      pass.push({ i, left: a[i], right: a[i + 1], swap });
      if (swap) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; moved = true; }
    }
    passes.push(pass);
    if (!moved) break;
  }
  const steps = passes.flat(), swaps = steps.filter(x => x.swap).length;

  // one comparison, said: the bracket goes to the pair, and the two bars change places if the left is the taller
  const say = (b, st, look, swap) => {
    b.go(mark, st.i, { dur: look });
    if (st.swap) b.swap(bar[st.left], st.i + 1, bar[st.right], st.i, { dur: swap });
    else b.wait(look);
  };

  F.beat('Ten bars, out of order', `[${N} bars](${Object.values(bar).map(t => t.name).join(', ')}) stand in a row, shuffled.`, b => {
    b.show(base, { in: 'draw', dur: 0.7 });
    b.stagger(row, 0.07, (v, k) => b.show(bar[v], { pose: k, dur: 0.4 }));      // (not reveal: each bar comes in at its own place)
  });
  F.beat('Two neighbours at a time',
    `[A bracket](mark) looks at two neighbours. If the left one is the taller, they change places. One pass along the row carries [the tallest](bar${N}) to the end.`, b => {
      b.show(mark, { pose: 0, dur: 0.3 });
      passes[0].forEach(st => say(b, st, 0.28, 0.5));
    });
  F.beat('Again, and again',
    `Then the same along what is left, and again. Each pass is one pair shorter, since [the end](${[N, N - 1, N - 2].map(v => 'bar' + v).join(', ')}) is already in place.`, b => {
      passes.slice(1).forEach(pass => { pass.forEach(st => say(b, st, 0.13, 0.26)); b.wait(0.15); });
    });
  F.beat('In order',
    `A pass that changes nothing ends it: [the row is in order](stair). This run looked at ${steps.length} pairs in ${passes.length} passes and made ${swaps} swaps.`, b => {
      b.hide(mark, { dur: 0.3 });
      b.show(stair, { in: 'draw', dur: 1.4 });
    }, { tail: 1.5 });
  const piece = F.build();
  piece.run = { row, passes: passes.length, steps: steps.length, swaps, sorted: a };
  return piece;
}
