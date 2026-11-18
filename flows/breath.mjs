// THREE LOOPS, as a flow (18 Nov 2026): the gallery's `breath` explainer (gallery/animated.html, 33. THREE LOOPS; essay 18
// and wander's BRL) said with tvf-flow.js, to find what the library could not yet say. Its shapes are the gallery's own
// lines, unchanged, so the two can be compared shape for shape; its times are the gallery's too, as shares of the 48 s
// loop, said through the library (shown at, moved from when to when). `npm test` (motion) compares the scene this makes
// with the gallery's: the same shapes, each reaching the same pose at the same time by the same ease, the same camera,
// stops and words. What the port needed that the library lacked: a thing popped in (`in: 'pop'`), and a name for several
// things at once (`group`), for a beat's words.
//
//   npm run flow -- flows/breath.mjs
export default function (TVF_FLOW) {
  const { flow } = TVF_FLOW;
  // ── the gallery's drawing helpers, as they stand there ──
const f = v => +v.toFixed(2);
const pts = P => P.map(([x, y]) => f(x) + ',' + f(y)).join(' ');
const polyOf = (P, fill, extra = '') => `<polygon points="${pts(P)}" fill="${fill}"${extra}/>`;
function smoothD(P) {
  const n = P.length, q = i => P[(i + n) % n];
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [a, b, c, e] = [q(i - 1), q(i), q(i + 1), q(i + 2)];
    d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`;
  }
  return d + 'Z';
}
const smooth = (P, fill, extra = '') => `<path d="${smoothD(P)}" fill="${fill}"${extra}/>`;
function circ4(cx, cy, r, fill, extra = '') {
  const k = 0.5523 * r, s = Math.SQRT1_2;
  const P = [45, 135, 225, 315].map(d => [cx + r * Math.cos(d * Math.PI / 180), cy + r * Math.sin(d * Math.PI / 180)]);
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < 4; i++) {
    const a = (45 + 90 * i) * Math.PI / 180, b = a + Math.PI / 2, [x0, y0] = P[i], [x1, y1] = P[(i + 1) % 4];
    d += `C${f(x0 - k * Math.sin(a))} ${f(y0 + k * Math.cos(a))} ${f(x1 + k * Math.sin(b))} ${f(y1 - k * Math.cos(b))} ${f(x1)} ${f(y1)}`;
  }
  return `<path d="${d}Z" fill="${fill}"${extra}/>`;
}
const rectP = (x0, y0, x1, y1, fill) => polyOf([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill);
  // ── the gallery's geometry, unchanged: every pose computed here ──
  const f1 = v => +v.toFixed(2), D2R = Math.PI / 180, Q = Math.PI / 2,
    line = (P, stroke, w) => `<path d="M${P.map(p => f1(p[0]) + ' ' + f1(p[1])).join(' L')}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`,
    label = (x, y, s, fill, size = 21) => `<text x="${x}" y="${y}" font-size="${size}" font-family="sans-serif" font-weight="600" fill="${fill}">${s}</text>`,
    INK = '#3b4256', GOLD = '#d4a052', TEAL = '#2f9e8f', VIOLET = '#7c5cff', GREY = '#9a927f', RED = '#c4593d', PALE = '#d9d2c3',
    ESSAY = 'https://github.com/reportbase/wander/blob/main/papers/essays/18-read-and-write-on-one-plane.md',
    samp = (a, b, n) => Array.from({ length: n + 1 }, (_, j) => a + (b - a) * j / n),
    dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    unit = a => { const n = Math.hypot(...a); return a.map(x => x / n); },
    // a turn by a about the axis n (Rodrigues), and unit quaternions [w, x, y, z] for composing turns exactly
    turn = (n, a) => v => { const u = unit(n), c = Math.cos(a), s = Math.sin(a), k = dot(u, v) * (1 - c), w = cross(u, v);
      return [v[0] * c + w[0] * s + u[0] * k, v[1] * c + w[1] * s + u[1] * k, v[2] * c + w[2] * s + u[2] * k]; },
    qa = (n, a) => { const u = unit(n), s = Math.sin(a / 2); return [Math.cos(a / 2), s * u[0], s * u[1], s * u[2]]; },
    qm = (p, q) => [p[0] * q[0] - p[1] * q[1] - p[2] * q[2] - p[3] * q[3], p[0] * q[1] + p[1] * q[0] + p[2] * q[3] - p[3] * q[2],
      p[0] * q[2] - p[1] * q[3] + p[2] * q[0] + p[3] * q[1], p[0] * q[3] + p[1] * q[2] - p[2] * q[1] + p[3] * q[0]],
    qi = q => [q[0], -q[1], -q[2], -q[3]];
  const ORDER = [], POSES = {};
  const put = (name, s) => { if (!POSES[name]) { POSES[name] = []; ORDER.push(name); } POSES[name].push(s); };
  put('paper', rectP(-400, -300, 4000, 1200, '#f4f1ea'));
  // A BREATH ON EULER'S PLANE: u = ln(d/H) from −2.5 to 2.5 across (100 px a unit), θ from 0 to a quarter turn up (360 px).
  // A point at u = −2, θ = 0.3 rad; a read by α = 40° up, a write by λ = ln 4 across, back down, back across. The teal
  // point goes up first, the violet across first; at the far corner they meet at the same moment, and both come home
  const E0 = [150, 600], EW = 500, EH = 360, onE = (u, th) => [E0[0] + 100 * (u + 2.5), E0[1] - EH * th / Q],
    AL = 40 * D2R, LAM = Math.log(4), U0 = -2.0, T0 = 0.3,
    PC = [[U0, T0], [U0, T0 + AL], [U0 + LAM, T0 + AL], [U0 + LAM, T0]].map(p => onE(...p));
  put('frame', line([[E0[0], E0[1] - EH], E0, [E0[0] + EW, E0[1]], [E0[0] + EW, E0[1] - EH], [E0[0], E0[1] - EH]], '#c9c2b4', 1.2));
  put('thumbLine', line([onE(0, 0), onE(0, Q)], GOLD, 1.6));
  put('home', circ4(...PC[0], 15, PALE));
  put('loop', line([...PC, PC[0]], GOLD, 2.4));
  PC.forEach(p => put('upFirst', circ4(...p, 9, TEAL)));
  PC.forEach(p => put('acrossFirst', circ4(...p, 7, VIOLET)));
  // IN SPACE: a book (1.6 by 1.1 by 0.25, an arrow on its cover) seen from in front, a little right and above; a read, a
  // turn by α = 40° about the upright, and a write in one length, everything scaled by k = 1.5 about the book's middle
  const VC = unit([0.5, -1, 0.55]), VE1 = unit(cross([0, 0, 1], VC)), VE2 = cross(VC, VE1),
    proj = (o, k) => v => [o[0] + k * dot(v, VE1), o[1] - k * dot(v, VE2)],
    BK = [0.8, 0.55, 0.125], corner = b => [b[0] ? BK[0] : -BK[0], b[1] ? BK[1] : -BK[1], b[2] ? BK[2] : -BK[2]],
    WIRE = ['000', '100', '110', '010', '000', '001', '101', '100', '101', '111', '110', '111', '011', '010', '011', '001'].map(s => corner([...s].map(Number))),
    ARR = [[-0.5, -0.08], [0.2, -0.08], [0.2, -0.24], [0.62, 0], [0.2, 0.24], [0.2, 0.08], [-0.5, 0.08]].map(([x, y]) => [x, y, BK[2] + 0.002]),
    book = (name, o, pose, col) => { const P = proj(o, 90); put(name + 'Wire', line(WIRE.map(pose).map(P), col, 2.4));
      put(name + 'Arrow', polyOf(ARR.map(pose).map(P), INK)); },
    K2 = 1.5, scale = k => v => v.map(x => k * x), then = (f, g) => v => g(f(v)), Z = [0, 0, 1],
    POSE2 = [v => v, turn(Z, AL / 2), turn(Z, AL), then(turn(Z, AL), scale(K2)), then(turn(Z, AL / 2), scale(K2)), scale(K2)],
    B1 = [1000, 470], B2 = [1500, 470];
  put('ghostA', line(WIRE.map(proj(B1, 90)), PALE, 2)); put('ghostB', line(WIRE.map(proj(B2, 90)), PALE, 2));
  POSE2.forEach(p => book('bookA', B1, p, TEAL));
  POSE2.forEach(p => book('bookB', B2, p, VIOLET));
  // TWO READS: the same book turned by α about x (its length), β about y, then −α about x and −β about y. The loop's
  // leftover is the quaternion commutator qy⁻¹·qx⁻¹·qy·qx: a turn by Ω about its axis, and every later loop that turn again
  const B3 = [2050, 470], X = [1, 0, 0], Y = [0, 1, 0], BE = AL,
    qx = qa(X, AL), qy = qa(Y, BE), QL = qm(qi(qy), qm(qi(qx), qm(qy, qx))),
    OM = 2 * Math.atan2(Math.hypot(QL[1], QL[2], QL[3]), QL[0]), NQ = unit([QL[1], QL[2], QL[3]]),
    loop1 = [v => v, turn(X, AL / 2), turn(X, AL), then(turn(X, AL), turn(Y, BE / 2)), then(turn(X, AL), turn(Y, BE))],
    full = then(turn(X, AL), turn(Y, BE));
  loop1.push(then(full, turn(X, -AL / 2)), then(full, turn(X, -AL)), then(then(full, turn(X, -AL)), turn(Y, -BE / 2)),
    then(then(full, turn(X, -AL)), turn(Y, -BE)));
  [2, 3, 4, 5].forEach(n => loop1.push(turn(NQ, n * OM)));
  // seen from higher up than the first two books, so the ring the arrow's tip goes round shows open
  const VC3 = unit([0.35, -0.6, 1]), V31 = unit(cross([0, 0, 1], VC3)), V32 = cross(VC3, V31),
    P3 = v => [B3[0] + 90 * dot(v, V31), B3[1] - 90 * dot(v, V32)], TIP = [0.62, 0, BK[2] + 0.002];
  put('ghostC', line(WIRE.map(P3), PALE, 2));
  put('axX', line([[-1.4, 0, 0], [1.4, 0, 0]].map(P3), GREY, 1.4)); put('axY', line([[0, -1.4, 0], [0, 1.4, 0]].map(P3), GREY, 1.4));
  put('orbit', line(samp(0, 2 * Math.PI, 96).map(s => P3(turn(NQ, s)(TIP))), '#b9b2a2', 2));
  loop1.forEach(p => { put('bookCWire', line(WIRE.map(p).map(P3), GOLD, 2.4)); put('bookCArrow', polyOf(ARR.map(p).map(P3), INK)); });
  put('leftAx', line([NQ.map(x => -1.3 * x), NQ.map(x => 1.3 * x)].map(P3), RED, 2));
  [0, 1, 2, 3, 4, 5].forEach(n => put('tips', circ4(...P3(turn(NQ, n * OM)(TIP)), 4, RED)));
  // A READ AND AN UNEQUAL WRITE: a ring of radius 50 px, a spoke on it; R a turn by α, S = diag(c, 1) a stretch along the
  // across axis, M = S⁻¹R⁻¹SR one breath. Each key is the ring carried exactly by its 2 × 2 matrix: the breath's four
  // steps, then M², M³, M⁴; then M⁴ at c = 1.7, 1.4, 1.2 and 1, where it is the ring again
  const C4 = [2750, 470], RR = 50, mm = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
      [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]],
    I2 = [[1, 0], [0, 1]], Rm = a => [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]], Sm = c => [[c, 0], [0, 1]],
    Mof = c => mm(Sm(1 / c), mm(Rm(-AL), mm(Sm(c), Rm(AL)))), pow = (A, n) => n ? mm(A, pow(A, n - 1)) : I2,
    at4 = (A, x, y) => [C4[0] + RR * (A[0][0] * x + A[0][1] * y), C4[1] - RR * (A[1][0] * x + A[1][1] * y)],
    ring = A => smooth(samp(0, 2 * Math.PI, 32).slice(0, 32).map(t => at4(A, Math.cos(t), Math.sin(t))), '#a6d8ce'),
    spoke = A => line([at4(A, 0, 0), at4(A, 1, 0)], INK, 2.2),
    M2 = Mof(2), STEPS = [I2, mm(Sm(2), Rm(AL)), mm(Rm(-AL), mm(Sm(2), Rm(AL))), M2, pow(M2, 2), pow(M2, 3), pow(M2, 4),
      pow(Mof(1.7), 4), pow(Mof(1.4), 4), pow(Mof(1.2), 4)];
  put('ringGhost', line(samp(0, 2 * Math.PI, 64).map(t => at4(I2, Math.cos(t), Math.sin(t))), PALE, 1.6));
  put('stretchAx', line([[C4[0] - 230, C4[1]], [C4[0] + 230, C4[1]]], '#c9c2b4', 1.2));
  STEPS.forEach(A => put('ring', ring(A)));
  [I2, Rm(AL), ...STEPS.slice(1)].forEach(A => put('spoke', spoke(A)));
  // STEADY AT ONE LENGTH: ζ against ln c at α = 40°, cosh ζ = 1 + 2·sin²α·sinh²(½ ln c), 150 px a unit of ln c, 300 of ζ; a
  // dot at c = 2, 1.7, 1.4, 1.2 and 1
  const Z0 = [3060, 620], zeta = x => Math.acosh(1 + 2 * Math.sin(AL) ** 2 * Math.sinh(x / 2) ** 2),
    onZ = x => [Z0[0] + 180 + 150 * x, Z0[1] - 300 * zeta(x)];
  put('axesZ', line([[Z0[0] + 180, Z0[1] - 280], [Z0[0] + 180, Z0[1]], [Z0[0], Z0[1]], [Z0[0] + 360, Z0[1]]], GREY, 1.4));
  put('zcurve', line(samp(-1.2, 1.2, 96).map(onZ), GOLD, 2.8));
  [2, 1.7, 1.4, 1.2, 1].forEach(c => put('zdot', circ4(...onZ(Math.log(c)), 8, RED)));
  // labels, last
  put('lU', label(E0[0] + EW / 2 - 34, E0[1] + 32, 'ln(d/H)', INK));
  put('lTh', label(E0[0] - 26, E0[1] - EH / 2, 'θ', INK));
  put('lAl', label(PC[0][0] - 26, (PC[0][1] + PC[1][1]) / 2 + 6, 'α', TEAL));
  put('lLam', label((PC[0][0] + PC[3][0]) / 2 - 4, PC[0][1] + 26, 'λ', TEAL));
  put('lOm', label(B3[0] + 95, B3[1] - 95, '26.9°', RED, 17));
  put('lC', label(C4[0] + 205, C4[1] - 12, 'c', INK, 22));
  put('lZ', label(Z0[0] + 156, Z0[1] - 290, 'ζ', GOLD, 26));
  put('lLnC', label(Z0[0] + 310, Z0[1] + 34, 'ln c', INK, 26));

  // ── the flow ──
  const LOOP = 48, F = flow({ name: 'three loops', w: 3600, h: 900 });
  const EACH = { tips: 1 };        // names whose every shape is a thing of its own (six dots, each popped in)
  for (const name of ORDER) {
    if (EACH[name]) F.group(name, POSES[name].map((s, i) => F.shape(name + i, s)));
    else F.shape(name, POSES[name]);
  }
  const BZ = [0.45, 0, 0.25, 1], LIN = 'linear', sec = t => t * LOOP;
  // the gallery's three ways of saying a morph, said here through the library, at the gallery's times
  const shows = (b, name, start, kind, len) => b.together(() => { b.at(sec(start)); b.show(name, { in: kind, dur: sec(len) }); });
  const track = (b, name, K, start, T, E, kind, len) => { shows(b, name, start, kind, len);
    for (let i = 1; i < K.length; i++) if (K[i] !== K[i - 1])
      b.together(() => { b.at(sec(T[i - 1])); b.go(name, K[i], { dur: sec(T[i] - T[i - 1]), ease: E[i - 1] || 'inout' }); }); };
  const pop = (b, name, t) => b.together(() => { b.at(sec(t)); b.show(name, { in: 'pop', dur: sec(0.012) }); });
  const look = (b, t, names, pad, d) => { b.at(sec(t)); b.look(names, { pad, dur: sec(d || 0) }); };
  const hold2 = K => K.flatMap(k => [k, k]);
  const TEXT = [
    { title: 'A breath on one plane',
      text: `On Euler's plane a [point](upFirst) is a thing seen: its direction θ up, its distance across as ln(d/H), counted in thumbs from [one thumb](thumbLine). A read, a turn by α, slides it up. A write, a scaling of the thumb by λ, slides it across.\n\nA breath is a read and a write taken and undone: [up, across, down, back](loop). It comes [home](home). Go round [the other way](acrossFirst), across first, and the two reach the far corner at the same moment: the two slides commute.` },
    { title: 'In space, too',
      text: `In space a read is a turn, and a write in one length scales everything by one factor, here 1.5. That factor commutes with every turn, so the breath closes there as well: [turn, grow, turn back, shrink](bookAWire, bookAArrow), and the book is [home](ghostA).\n\nLeave the write undone and [the same loop](bookBWire, bookBArrow) comes home facing just as it began, only larger. A write put anywhere into a loop changes nothing but the loop's overall size.` },
    { title: 'Two reads',
      text: `Join two reads instead: a turn by α about [one axis](axX), β about [another](axY), then each undone in turn. [The book](bookCWire, bookCArrow) does not come [home](ghostC). It is turned by Ω, with cos(Ω/2) = 1 − 2·sin²(α/2)·sin²(β/2)·sin²φ, φ the angle between the axes; about αβ·sin φ when small. At α = β = 40° and φ = 90°, [Ω = 26.87°](lOm), about [this axis](leftAx).\n\nGo round again and it turns the same 26.87° again, and again: [the arrow's tip](tips) steps round [one ring](orbit) and never leaves it. The leftover is the sphere of directions' own, bounded however often the loop is taken. No write is in it.` },
    { title: 'A read and an unequal write',
      text: `Now let the write be a stretch: one axis scaled by c, [the other left](stretchAx), the writer's two axes drawn at V = cH. Carry [a ring the writer draws](ring) through a breath, α = 40° and c = 2: [turn, stretch, turn back, shrink back](spoke). It comes home squeezed, 1.59 times as long and 0.63 as wide.\n\nBreathe again and again. Each breath squeezes it by about e^ζ more, with cosh ζ = 1 + 2·sin²α·sinh²(½ ln c), ζ = 0.4507: after four, [6.26 times as long and 0.16 as wide](ring). Two reads leave a turn that stays bounded; an unequal write leaves a squeeze that grows.` },
    { title: 'Steady at one length',
      text: `Bring c down toward 1. The squeeze a breath falls along [ζ against ln c](zcurve), the same at c and 1/c, and [reaches nothing only at c = 1](zdot). There [the ring](ring) comes home whole, breath after breath.\n\nA breath is steady exactly when its write is in one length: V = H, the one-length circle said of a loop. [The essay, §9](${ESSAY})` }
  ];
  const TITLES = TEXT.map(t => t.title);
  // beat 1, 0–0.2: the plane, one thumb, home; the loop drawn on as the teal point goes up, across, down and back at its
  // pace, the violet across, up, back and down, the two at the far corner at 0.1 and home at 0.15
  const hU = PC[0][1] - PC[1][1], hA = PC[3][0] - PC[0][0], UP = 0.05 * hU / (hU + hA), AC = 0.05 - UP;
  F.beat(TITLES[0], TEXT[0].text, b => {
    look(b, 0, ['frame'], 0.16);
    shows(b, 'frame', 0.004, 'draw', 0.012); shows(b, 'thumbLine', 0.012, 'draw', 0.01); shows(b, 'home', 0.02, 'fade', 0.01);
    shows(b, 'loop', 0.05, 'draw', 0.1);
    track(b, 'upFirst', [0, 1, 2, 3, 0], 0.025, [0.05, 0.05 + UP, 0.1, 0.1 + UP, 0.15], [LIN, LIN, LIN, LIN], 'fade', 0.01);
    track(b, 'acrossFirst', [0, 3, 2, 1, 0], 0.03, [0.05, 0.05 + AC, 0.1, 0.1 + AC, 0.15], [LIN, LIN, LIN, LIN], 'fade', 0.01);
    [['lU', 0.01], ['lTh', 0.01], ['lAl', 0.06], ['lLam', 0.085]].forEach(([n, t]) => shows(b, n, t, 'fade', 0.012));
    b.at(sec(0.2));
  }, { tail: 0 });
  // beat 2, 0.2–0.4: two books; turn 0.24–0.26, grow 0.27–0.29, turn back 0.30–0.32, shrink 0.33–0.35 (the first only)
  const T2 = [0.24, 0.25, 0.26, 0.27, 0.29, 0.30, 0.31, 0.32, 0.33, 0.35], E2 = [LIN, LIN, null, BZ, null, LIN, LIN, null, BZ];
  F.beat(TITLES[1], TEXT[1].text, b => {
    look(b, 0.2, ['bookAWire', 'bookBWire'], 0.12, 0.03);
    shows(b, 'ghostA', 0.205, 'fade', 0.01); shows(b, 'ghostB', 0.205, 'fade', 0.01);
    ['Wire', 'Arrow'].forEach(p => {
      track(b, 'bookA' + p, [0, 1, 2, 2, 3, 3, 4, 5, 5, 0], 0.21, T2, E2, 'fade', 0.01);
      track(b, 'bookB' + p, [0, 1, 2, 2, 3, 3, 4, 5], 0.215, T2.slice(0, 8), E2.slice(0, 7), 'fade', 0.01); });
    b.at(sec(0.4));
  }, { tail: 0 });
  // beat 3, 0.4–0.6: the third book, its two axes; one loop of two reads 0.43–0.51, then the leftover's axis, the ring its
  // arrow's tip goes round, and four loops more, each ending turned Ω further (0.535, 0.55, 0.565, 0.58)
  const T3 = [0.43, 0.44, 0.45, 0.46, 0.47, 0.48, 0.49, 0.50, 0.51, 0.52, 0.535, 0.55, 0.565, 0.58],
    E3 = [LIN, LIN, LIN, LIN, LIN, LIN, LIN, LIN, null, BZ, BZ, BZ, BZ];
  F.beat(TITLES[2], TEXT[2].text, b => {
    look(b, 0.4, ['bookCWire', 'orbit', 'axX', 'axY'], 0.14, 0.03);
    shows(b, 'ghostC', 0.405, 'fade', 0.01); shows(b, 'axX', 0.41, 'draw', 0.012); shows(b, 'axY', 0.415, 'draw', 0.012);
    ['Wire', 'Arrow'].forEach(p => track(b, 'bookC' + p, [0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 10, 11, 12], 0.41, T3, E3, 'fade', 0.01));
    shows(b, 'leftAx', 0.512, 'draw', 0.012); shows(b, 'orbit', 0.52, 'draw', 0.03);
    [0.42, 0.51, 0.535, 0.55, 0.565, 0.58].forEach((t, n) => pop(b, 'tips' + n, t));
    shows(b, 'lOm', 0.515, 'fade', 0.012);
    b.at(sec(0.6));
  }, { tail: 0 });
  // beat 4, 0.6–0.8: the ring, its spoke, the stretch's axis; one breath (turn 0.62–0.635, stretch 0.64–0.655, turn back
  // 0.66–0.675, shrink back 0.68–0.695), then M², M³, M⁴ (0.725, 0.75, 0.775); beat 5, 0.8–1: c to 1.7, 1.4, 1.2 and 1
  const T4 = [0.62, 0.635, 0.64, 0.655, 0.66, 0.675, 0.68, 0.695, 0.71, 0.725, 0.735, 0.75, 0.76, 0.775, 0.82, 0.84, 0.85, 0.87, 0.88, 0.90, 0.91, 0.93],
    E4 = [BZ, null, BZ, null, BZ, null, BZ, null, BZ, null, BZ, null, BZ, null, BZ, null, BZ, null, BZ, null, BZ];
  // the ring's keys: home (the turn leaves it as it is), SR, R⁻¹SR, M, M², M³, M⁴, M⁴ at 1.7, 1.4, 1.2, and home at c = 1.
  // Its moves run through both beats; a thing's moves are said in the order they happen, so beat 4 says them to 0.8 and
  // beat 5 the rest
  const RING = hold2([0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]).slice(1, -1), SPOKE = hold2([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0]).slice(1, -1);
  const part = (b, name, K, lo, hi) => { for (let i = 1; i < K.length; i++) if (K[i] !== K[i - 1] && T4[i - 1] >= lo && T4[i - 1] < hi)
    b.together(() => { b.at(sec(T4[i - 1])); b.go(name, K[i], { dur: sec(T4[i] - T4[i - 1]), ease: E4[i - 1] || 'inout' }); }); };
  F.beat(TITLES[3], TEXT[3].text, b => {
    look(b, 0.6, ['stretchAx', 'ring'], 0.08, 0.03);
    shows(b, 'ringGhost', 0.605, 'fade', 0.01); shows(b, 'stretchAx', 0.605, 'draw', 0.012);
    shows(b, 'ring', 0.61, 'fade', 0.01); shows(b, 'spoke', 0.612, 'draw', 0.01);
    part(b, 'ring', RING, 0, 0.8); part(b, 'spoke', SPOKE, 0, 0.8);
    shows(b, 'lC', 0.64, 'fade', 0.012);
    b.at(sec(0.8));
  }, { tail: 0 });
  // beat 5: the curve, and a dot that walks down it with c
  F.beat(TITLES[4], TEXT[4].text, b => {
    look(b, 0.8, ['stretchAx', 'axesZ', 'zcurve'], 0.08, 0.03);
    shows(b, 'axesZ', 0.805, 'draw', 0.012); shows(b, 'zcurve', 0.81, 'draw', 0.02);
    part(b, 'ring', RING, 0.8, 1); part(b, 'spoke', SPOKE, 0.8, 1);
    track(b, 'zdot', [0, 1, 2, 3, 4], 0.81, [0.82, 0.84, 0.87, 0.90, 0.93], [BZ, BZ, BZ, BZ], 'fade', 0.008);
    shows(b, 'lZ', 0.815, 'fade', 0.012); shows(b, 'lLnC', 0.815, 'fade', 0.012);
    look(b, 0.92, ['ringGhost', 'axesZ', 'zcurve'], 0.1, 0.03);
    b.at(sec(1));
  }, { tail: 0 });
  return F.build();
}
