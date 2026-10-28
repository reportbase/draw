// THE SIGNATURE (?lab=sig), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately be
// pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labLadder, makeRng, state, subpathFromLoop. It declares nothing the
// editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['signature'] = function () {
        // ── THE SIGNATURE, ON THE PAGE ───────────────────────────────────────────────
        // The overlay version of this was a second interface for something the app
        // already does better: a lab run lays its result out as real shapes, in one
        // history frame, and the whole viewer — zoom, export, the shape browser — comes
        // with it. Three cells per primitive: the figure as held, the figure restated
        // by a projective account, and the signature drawn before and after, one over
        // the other.
        function sigCross(o, a, b) {
            return (a.x - o.x) * (b.y - o.y) - (b.x - o.x) * (a.y - o.y);
        }

        function sigXR(o, a, b, c, d) {
            const n = sigCross(o, a, c) * sigCross(o, b, d),
                m = sigCross(o, a, d) * sigCross(o, b, c);
            return m ? n / m : NaN;
        }

        // the signature as a closed loop the page can hold: the curve out and back, so
        // it is an ordinary shape like every other cell on the sheet
        function sigLoop(vals, lo, hi) {
            // a ribbon rather than a filled area: the curve out, and the same curve back a
            // hair below it, so the cell reads as a LINE and two of them can be laid one
            // over the other and seen to coincide
            const n = vals.length,
                w = 0.035,
                top = [],
                bot = [];
            const at = k => {
                const v = isFinite(vals[k]) ? Math.max(lo, Math.min(hi, vals[k])) : lo;
                return {
                    x: -1 + 2 * k / (n - 1),
                    y: -0.5 + (v - lo) / (hi - lo || 1)
                };
            };
            for (let k = 0; k < n; k++) {
                const q = at(k);
                top.push({
                    x: q.x,
                    y: q.y + w
                });
            }
            for (let k = n - 1; k >= 0; k--) {
                const q = at(k);
                bot.push({
                    x: q.x,
                    y: q.y - w
                });
            }
            return top.concat(bot);
        }

        function runSignatureSheet() {
            const M = 96,
                rows = [],
                WANT = 12; // three cells each: a page, not a wall
            const rnd = makeRng(4242);
            const project = (arr, q1, q2) => {
                const out = [];
                for (const p of arr) {
                    const w = q1 * p.x + q2 * p.y + 1;
                    if (w < 0.3)
                        return null;
                    out.push({
                        x: p.x / w,
                        y: p.y / w
                    });
                }
                return out;
            };
            // an even spread through the corpus rather than the first dozen, so the page
            // carries round things and spiky ones alike
            const usable = PRIMITIVES.filter(s => typeof s.pts === 'function');
            const picked = [];
            for (let i = 0; i < WANT; i++)
                picked.push(usable[Math.floor(i * usable.length / WANT)]);
            for (const spec of picked) {
                if (!spec || typeof spec.pts !== 'function')
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
                let R = 1e-9;
                for (const q of raw)
                    R = Math.max(R, Math.hypot(q.x - cx, q.y - cy));
                const P = [];
                for (let i = 0; i < M; i++) {
                    const q = raw[Math.floor(i * raw.length / M)];
                    P.push({
                        x: (q.x - cx) / R,
                        y: (q.y - cy) / R
                    });
                }
                const o = {
                    x: 0.05,
                    y: 0.04
                };
                const ia = 0,
                    ib = Math.floor(M / 3),
                    ic = Math.floor(2 * M / 3);
                const sig = (Q, qo) => {
                    const s = [];
                    for (let k = 0; k < Q.length; k++)
                        s.push(sigXR(qo, Q[ia], Q[ib], Q[ic], Q[k]));
                    return s;
                };
                const s0 = sig(P, o);
                let Q = null,
                    qo = null,
                    s1 = null;
                for (let tries = 0; tries < 30 && !Q; tries++) {
                    const all = project(P.concat([o]), 0.22 * (rnd() - 0.5), 0.22 * (rnd() - 0.5));
                    if (all) {
                        Q = all.slice(0, M);
                        qo = all[M];
                        s1 = sig(Q, qo);
                    }
                }
                if (!Q)
                    continue;
                // what moved, and what did not
                const nrm = a => {
                    const m = a.reduce((x, y) => x + y, 0) / a.length;
                    return a.map(v => v / m);
                };
                const r0 = nrm(P.map(p => Math.hypot(p.x - o.x, p.y - o.y)));
                const r1 = nrm(Q.map(p => Math.hypot(p.x - qo.x, p.y - qo.y)));
                let rd = 0;
                for (let k = 0; k < M; k++)
                    rd += Math.abs(r1[k] - r0[k]);
                rd /= M;
                let sd = 0,
                    cnt = 0;
                for (let k = 0; k < M; k++)
                    if (isFinite(s0[k]) && isFinite(s1[k])) {
                        sd += Math.abs(s1[k] - s0[k]);
                        cnt++;
                    }
                sd = cnt ? sd / cnt : NaN;
                const fin = s0.filter(isFinite);
                let lo = Math.min.apply(null, fin),
                    hi = Math.max.apply(null, fin);
                if (!isFinite(lo) || !isFinite(hi) || hi - lo < 1e-9) {
                    lo = -1;
                    hi = 1;
                }
                const key = spec.key || spec.name || 'shape';
                rows.push({
                    key,
                    kind: 'held',
                    pts: P,
                    radDrift: rd,
                    sigDrift: sd
                });
                rows.push({
                    key,
                    kind: 'restated',
                    pts: Q,
                    radDrift: rd,
                    sigDrift: sd
                });
                rows.push({
                    key,
                    kind: 'signature',
                    pts: sigLoop(s0, lo, hi),
                    alt: sigLoop(s1, lo, hi),
                    radDrift: rd,
                    sigDrift: sd
                });
            }
            return rows;
        }

        function showSignatureSheet(rows) {
            const out = labLadder({
                rows,
                name: 'the signature',
                suffix: 'held · restated · described',
                // the description is the subject, so the verdict is about IT: teal where the
                // account moved the figure and left the signature where it was.
                verdict: r => !(r.sigDrift < 1e-9) ? 0 : (r.radDrift > 0.01 ? 2 : 1),
                caption: r => r.key + ' · ' + r.kind + '\n'
                + (r.kind === 'held' ? 'as the page holds it'
                : r.kind === 'restated' ? 'a projective account of it'
                : 'the signature, before and over after') + '\n'
                + 'the figure moved ' + (100 * r.radDrift).toFixed(1) + '%\n'
                + 'the description moved ' + (isFinite(r.sigDrift) ? r.sigDrift.toExponential(1) : '—'),
                // the signature cell carries a second contour: the restated description,
                // drawn under the first so the reader can see there is nothing to see
                after: drawn => {
                    for (const r of drawn) {
                        if (r.kind !== 'signature' || !r.alt)
                            continue;
                        const host = state.subpaths[r._idx];
                        if (!host)
                            continue;
                        let mnx = Infinity,
                            mny = Infinity,
                            mxx = -Infinity,
                            mxy = -Infinity;
                        for (const p of r.pts) {
                            mnx = Math.min(mnx, p.x);
                            mxx = Math.max(mxx, p.x);
                            mny = Math.min(mny, p.y);
                            mxy = Math.max(mxy, p.y);
                        }
                        let hx = Infinity,
                            hy = Infinity,
                            hX = -Infinity,
                            hY = -Infinity;
                        for (let i = 0; i < host.leafX.length; i++) {
                            hx = Math.min(hx, host.leafX[i]);
                            hX = Math.max(hX, host.leafX[i]);
                            hy = Math.min(hy, host.leafY[i]);
                            hY = Math.max(hY, host.leafY[i]);
                        }
                        const sx = (hX - hx) / Math.max(mxx - mnx, 1e-9),
                            sy = (hY - hy) / Math.max(mxy - mny, 1e-9);
                        const mapped = r.alt.map(p => ({
                            x: hx + (p.x - mnx) * sx,
                            y: hy + (p.y - mny) * sy
                        }));
                        const sp = subpathFromLoop(mapped, host.leafX.length);
                        if (!sp)
                            continue;
                        sp.stroke = '#a585c4';
                        sp.lineWidth = 3.4;
                        state.subpaths.splice(r._idx, 0, sp); // underneath the original
                        for (const q of drawn)
                            if (q._idx >= r._idx)
                                q._idx++;
                    }
                },
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const sigs = drawn.filter(r => r.kind === 'signature');
            const held = sigs.length;
            const still = sigs.filter(r => r.sigDrift < 1e-9).length;
            const moved = sigs.filter(r => r.radDrift > 0.01).length;
            const medR = sigs.map(r => r.radDrift).sort((a, b) => a - b)[held >> 1] || 0;
            const medS = sigs.map(r => r.sigDrift).sort((a, b) => a - b)[held >> 1] || 0;
            flashStatus('the signature · ' + held + ' primitives, each held, restated by a projective account, and described'
            + ' — the account moved the figure on ' + moved + '/' + held + ' of them, by ' + (100 * medR).toFixed(1) + '% at the median'
            + ' · the description, built from four points and four cross products and nothing else,'
            + ' stayed where it was on ' + still + '/' + held + ', median movement ' + medS.toExponential(1)
            + ' — a figure can therefore be told apart from another WITHOUT BEING MEASURED,'
            + ' and told apart from every account of itself at the same time'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bSS = $('bSignatureSheet');
            if (bSS)
                bSS.addEventListener('click', () => {
                    bSS.disabled = true;
                    bSS.textContent = 'describing…';
                    setTimeout(() => {
                        try {
                            const rows = runSignatureSheet();
                            if (!rows.length)
                                flashStatus('the signature: no representable primitives');
                            else
                                showSignatureSheet(rows);
                        }
                        catch (e) {
                            flashStatus('the signature failed: ' + e.message);
                        }
                        finally {
                            bSS.disabled = false;
                            bSS.textContent = 'lay out the signatures';
                        }
                    }, 0);
                });
        }
};
