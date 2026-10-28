// THE RECOVERED CIRCLE (?lab=rcc), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, TAU, flashStatus, labLadder. It declares nothing the editor reads. Loaded the first
// time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['recovered-circle'] = function () {
        // ── THE RECOVERED CIRCLE ─────────────────────────────────────────────────────
        // A quotient does not remember its sections. Reading a figure serially divides
        // one extent by the other, which cancels the size of both; what the readings
        // carry is the turn. Applying a census afterwards returns a radius the readings
        // never held — the same one, from every figure.
        function recoveredRun() {
            const M = 512,
                TAU = Math.PI * 2;
            const rows = [],
                WANT = 8;
            const usable = PRIMITIVES.filter(s => typeof s.pts === 'function');
            const picked = [];
            for (let i = 0; i < WANT; i++)
                picked.push(usable[Math.floor(i * usable.length / WANT)]);
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
                // the arrivals: sample the figure evenly in the TURN, and read
                const readings = [],
                    held = [];
                let ok = true;
                for (let k = 0; k < M; k++) {
                    const a = -Math.PI / 2 + Math.PI * (k + 0.5) / M;
                    // where the figure stands in this direction — a ray cast from the centre
                    let R = null;
                    const dx = Math.cos(a),
                        dy = Math.sin(a);
                    for (let i = 0; i < raw.length; i++) {
                        const p = raw[i],
                            q = raw[(i + 1) % raw.length];
                        const px = p.x - cx,
                            py = p.y - cy,
                            qx = q.x - cx,
                            qy = q.y - cy;
                        const d = (qx - px) * dy - (qy - py) * dx;
                        if (Math.abs(d) < 1e-12)
                            continue;
                        const s = (px * dy - py * dx) / -d;
                        if (s < 0 || s > 1)
                            continue;
                        const hx = px + s * (qx - px),
                            hy = py + s * (qy - py);
                        const tt = hx * dx + hy * dy;
                        if (tt > 0 && (R === null || tt < R + 1e-12))
                            R = tt;
                    }
                    if (R === null || !(R > 0)) {
                        ok = false;
                        break;
                    }
                    const V = R * Math.sin(a),
                        H = R * Math.cos(a);
                    if (Math.abs(H) < 1e-9) {
                        ok = false;
                        break;
                    }
                    readings.push(V / H);
                    held.push(R);
                }
                if (!ok || readings.length < 32)
                    continue;
                // what the arrivals look like, gathered
                const sorted = readings.slice().sort((x, y) => x - y);
                const q = p => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
                // the recovery: take the readings back up, apply the census v^2 + h^2 = 1
                const back = [];
                for (const r of readings) {
                    const a = Math.atan(r); // the turn, all the readings carry
                    back.push({
                        x: Math.cos(a),
                        y: Math.sin(a)
                    }); // the census supplies the radius
                }
                // the far half, continuing the turn rather than doubling back: appended in
                // forward order, so the loop closes as a circle instead of across a chord
                const half = back.length;
                for (let i = 0; i < half; i++)
                    back.push({
                        x: -back[i].x,
                        y: -back[i].y
                    });
                // how far the recovered figure is from a circle of radius one
                let worst = 0;
                for (const p of back)
                    worst = Math.max(worst, Math.abs(Math.hypot(p.x, p.y) - 1));
                // and how far the ORIGINAL was from one, for contrast
                let rmin = Infinity,
                    rmax = -Infinity;
                for (const R of held) {
                    rmin = Math.min(rmin, R);
                    rmax = Math.max(rmax, R);
                }
                const key = spec.key || spec.name || 'shape';
                rows.push({
                    key,
                    kind: 'as held',
                    pts: raw,
                    swing: rmax / rmin,
                    q25: q(0.25),
                    q50: q(0.5),
                    q75: q(0.75),
                    worst
                });
                rows.push({
                    key,
                    kind: 'recovered',
                    pts: back,
                    swing: rmax / rmin,
                    q25: q(0.25),
                    q50: q(0.5),
                    q75: q(0.75),
                    worst
                });
            }
            return rows;
        }

        function showRecovered(rows) {
            const out = labLadder({
                rows,
                name: 'the recovered circle',
                suffix: 'read · divided · censused',
                // teal on a recovery that came back a unit circle; the held figure is gold,
                // being the thing that was sent rather than a claim about it
                verdict: r => r.kind === 'as held' ? 1 : (r.worst < 1e-9 ? 2 : 0),
                caption: r => r.key + ' · ' + r.kind + '\n'
                + (r.kind === 'as held'
                ? 'its radius swings by ' + r.swing.toFixed(2) + '×'
                : 'radius 1 everywhere, to ' + (r.worst < 1e-15 ? '1e−16' : r.worst.toExponential(0))) + '\n'
                + 'readings: quartiles ' + r.q25.toFixed(3) + ' · ' + r.q75.toFixed(3) + '\n'
                + (r.kind === 'as held' ? 'the figure that was sent' : 'the census put the radius back'),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const recs = drawn.filter(r => r.kind === 'recovered');
            const circles = recs.filter(r => r.worst < 1e-9).length;
            const swings = drawn.filter(r => r.kind === 'as held').map(r => r.swing);
            const widest = swings.length ? Math.max.apply(null, swings) : 1;
            const q25 = recs.map(r => r.q25),
                q75 = recs.map(r => r.q75);
            const spread = a => a.length ? (Math.max.apply(null, a) - Math.min.apply(null, a)) : 0;
            flashStatus('the recovered circle · ' + recs.length + ' primitives read one arrival at a time'
            + ' — their radii swing by as much as ' + widest.toFixed(1) + '× between them, and their readings'
            + ' agree: the quartiles land within ' + spread(q25).toFixed(3) + ' and ' + spread(q75).toFixed(3)
            + ' of each other across every figure, at \u22121 and +1, which is the Cauchy'
            + ' · applying the census to those readings returned a circle of radius one on '
            + circles + '/' + recs.length + ' of them'
            + ' — the same circle from every figure, because THE RADIUS THAT TOLD THEM APART WAS NEVER'
            + ' IN THE READINGS. The reconstruction is perfect and it returns the census, not the figure'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bRC = $('bRecoveredCircle');
            if (bRC)
                bRC.addEventListener('click', () => {
                    bRC.disabled = true;
                    bRC.textContent = 'reading…';
                    setTimeout(() => {
                        try {
                            const r = recoveredRun();
                            if (!r.length)
                                flashStatus('the recovered circle: no usable primitives');
                            else
                                showRecovered(r);
                        }
                        catch (e) {
                            flashStatus('the recovered circle failed: ' + e.message);
                        }
                        finally {
                            bRC.disabled = false;
                            bRC.textContent = 'lay it out';
                        }
                    }, 0);
                });
        }
};
