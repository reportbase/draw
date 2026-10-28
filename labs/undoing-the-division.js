// UNDOING THE DIVISION (?lab=udv), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, cross, flashStatus, labLadder. It declares nothing the editor reads. Loaded the first
// time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['undoing-the-division'] = function () {
        // ── UNDOING THE DIVISION (UDV, 8 Oct 2026) ─────────────────────────────────────
        // The recovered circle (RCC) shows what dividing loses: a reader's quotient v/h is
        // tan of its turn towards a place, the size of both extents cancelled, so the census
        // can only put back the unit circle. This shows how the figure comes back, and what
        // it costs.
        //
        // Not by keeping the divisor beside every reading (that undoes the division by not
        // doing it: one more number per reading). By standing somewhere else. A quotient fixes
        // the LINE from its reader through the place read (the turn, both ways round: v/h does
        // not know which way along the line the place is, and does not need to). Two readers'
        // lines towards the same place cross at the place. So readers who know where they stand
        // relative to one another recover every place exactly, in their own units: the figure
        // up to its size, since the readers' layout is all the size there is. One length, how
        // far apart two of them stand, puts the size back. That is the whole bill: no number
        // per reading, one per figure, and that one is agreed rather than read (R89, "the unit
        // … only comes from aggreement. it is not geometric"; Serial, Parallel and Nowhere §8,
        // the ladder, whose top rungs this is, in the plane).
        //
        // Three readers, not two: two readers' lines through a place on the line joining them
        // coincide, so two places of every outline cannot be crossed. With three, every place
        // has a pair whose lines meet at a good angle; the pair used is the one meeting
        // squarest, and the worst such angle is reported. The readers stand inside the figure,
        // around its centre at 0.3 of its mean radius. Which reading belongs to which place is
        // given, as in RCC (one arrival per place), not discovered.
        function undoDivisionRun() {
            // round, lobed, pointed, notched and hollow-cornered: figures whose radius swings
            // from not at all to several times over, so the census misses them by more and more
            const KEYS = ['circle', 'egg', 'hinge5', 'star5', 'astroid', 'heart', 'tulip'];
            const rows = [],
                picked = KEYS.map(k => PRIMITIVES.find(s => s.key === k && typeof s.pts === 'function'));
            const cross = (ax, ay, bx, by) => ax * by - ay * bx;
            // the line a quotient fixes: through the reader, along the turn atan(v/h)
            const lineOf = q => {
                const a = Math.atan(q);
                return [Math.cos(a), Math.sin(a)];
            };
            for (const spec of picked) {
                if (!spec)
                    continue;
                const raw = spec.pts();
                if (!raw || raw.length < 24)
                    continue;
                let cx = 0,
                    cy = 0;
                for (const q of raw) {
                    cx += q.x;
                    cy += q.y;
                }
                cx /= raw.length;
                cy /= raw.length;
                let Rm = 0,
                    rmin = Infinity,
                    rmax = 0;
                for (const q of raw) {
                    const r = Math.hypot(q.x - cx, q.y - cy);
                    Rm += r / raw.length;
                    rmin = Math.min(rmin, r);
                    rmax = Math.max(rmax, r);
                }
                const O = [0, 1, 2].map(k => {
                    const t = Math.PI / 2 + 2 * Math.PI * k / 3;
                    return { x: cx + 0.3 * Rm * Math.cos(t), y: cy + 0.3 * Rm * Math.sin(t) };
                });
                // what each reader holds of each place: the quotient v/h, and nothing else
                const Q = raw.map(P => O.map(o => (P.y - o.y) / (P.x - o.x)));
                // crossing the lines, given where the readers stand (in whatever units)
                let worstAngle = Math.PI / 2;
                const recover = R => raw.map((_, i) => {
                    const L = Q[i].map(lineOf);
                    let best = null,
                        bs = -1;
                    for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
                        const c = Math.abs(cross(L[a][0], L[a][1], L[b][0], L[b][1]));
                        if (c > bs) {
                            bs = c;
                            best = [a, b];
                        }
                    }
                    worstAngle = Math.min(worstAngle, Math.asin(Math.min(1, bs)));
                    const [a, b] = best,
                        d = cross(L[a][0], L[a][1], L[b][0], L[b][1]),
                        t = cross(R[b].x - R[a].x, R[b].y - R[a].y, L[b][0], L[b][1]) / d;
                    return { x: R[a].x + t * L[a][0], y: R[a].y + t * L[a][1] };
                });
                const miss = pts => {
                    let w = 0;
                    pts.forEach((p, i) => w = Math.max(w, Math.hypot(p.x - raw[i].x, p.y - raw[i].y)));
                    return w / Rm;
                };
                // (1) one reader and the census: the turn, at radius one. Reader 0's quotients,
                // both ways round each line, in turn order, so it draws as the circle it is.
                const turns = Q.map(q => Math.atan(q[0])).sort((a, b) => a - b),
                    census = turns.map(a => ({ x: Math.cos(a), y: Math.sin(a) }));
                for (let i = 0, n = census.length; i < n; i++)
                    census.push({ x: -census[i].x, y: -census[i].y });
                // (2) three readers who know only the shape of their triangle: their layout in
                // units of the distance between readers 0 and 1, reader 0 at the origin
                const base = Math.hypot(O[1].x - O[0].x, O[1].y - O[0].y),
                    own = O.map(o => ({ x: (o.x - O[0].x) / base, y: (o.y - O[0].y) / base })),
                    shapeOnly = recover(own),
                    // the same places, given the one length back
                    rescaled = shapeOnly.map(p => ({ x: O[0].x + base * p.x, y: O[0].y + base * p.y }));
                // (3) three readers with that length: where they stand
                const full = recover(O);
                const key = spec.key || spec.name || 'shape';
                const common = { key, swing: rmax / rmin, base: base / Rm, angle: worstAngle * 180 / Math.PI };
                rows.push(Object.assign({ kind: 'as held', pts: raw }, common));
                // how far the census's circle is from the figure, place by place: each place put at
                // radius one from reader 0 along its own line, on the side the place is (the kindest reading)
                const atOne = raw.map(P => { const dx = P.x - O[0].x, dy = P.y - O[0].y, r = Math.hypot(dx, dy) || 1;
                    return { x: O[0].x + dx / r, y: O[0].y + dy / r }; });
                rows.push(Object.assign({ kind: 'one reader, census', pts: census, miss: miss(atOne) }, common));
                rows.push(Object.assign({ kind: 'three readers, no length', pts: shapeOnly, miss: miss(rescaled) }, common));
                rows.push(Object.assign({ kind: 'three readers, one length', pts: full, miss: miss(full) }, common));
            }
            return rows;
        }

        window.undoDivisionRun = undoDivisionRun;

        function showUndoDivision(rows) {
            const e = v => v < 1e-15 ? '1e−16' : v.toExponential(0);
            const out = labLadder({
                rows,
                name: 'undoing the division',
                suffix: 'held · one reader · three readers · and one length',
                cols: 4,
                // gold: the figure sent; red: the census's circle, which is not the figure; teal:
                // the figure back, to its shape (no length) or to its shape and size (one length)
                verdict: r => r.kind === 'as held' ? 1 : (r.kind === 'one reader, census' ? 0 : (r.miss < 1e-9 ? 2 : 0)),
                caption: r => r.kind === 'as held' ? r.key + ' · as held\nradius swings ' + r.swing.toFixed(2) + '×'
                : r.kind === 'one reader, census' ? 'one reader + census\nthe unit circle · ' + (100 * r.miss).toFixed(0) + '% off'
                : r.kind === 'three readers, no length' ? 'three readers, no length\nin their own units · shape to ' + e(r.miss)
                : 'three + one length\nthe figure · to ' + e(r.miss),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const by = k => drawn.filter(r => r.kind === k);
            const exact = k => by(k).filter(r => r.miss < 1e-9).length;
            const worst = k => Math.max(...by(k).map(r => r.miss));
            const n = by('as held').length;
            flashStatus('undoing the division · ' + n + ' primitives, each read from three standpoints as quotients v/h alone'
            + ' · one reader with the census: the unit circle every time, missing the figures by up to ' + (100 * worst('one reader, census')).toFixed(0) + '% of their radius'
            + ' · three readers who know only the shape of their triangle: the figure, exactly, on ' + exact('three readers, no length') + '/' + n
            + ' (off by ' + e(worst('three readers, no length')) + ' once its size is put back), in units of their own spacing'
            + ' · and with ONE length, how far apart two of them stand: the figure itself on ' + exact('three readers, one length') + '/' + n
            + ', off by ' + e(worst('three readers, one length'))
            + ' · the size was divided out at every standpoint; another standpoint brings back the shape, one length the size'
            + ' · the lines cross at ' + Math.min(...drawn.map(r => r.angle)).toFixed(0) + '° or squarer'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bUD = $('bUndoDivision');
            if (bUD)
                bUD.addEventListener('click', () => {
                    bUD.disabled = true;
                    bUD.textContent = 'reading…';
                    setTimeout(() => {
                        try {
                            const r = undoDivisionRun();
                            if (!r.length)
                                flashStatus('undoing the division: no usable primitives');
                            else
                                showUndoDivision(r);
                        }
                        catch (e) {
                            flashStatus('undoing the division failed: ' + e.message);
                        }
                        finally {
                            bUD.disabled = false;
                            bUD.textContent = 'lay it out';
                        }
                    }, 0);
                });
        }
};
