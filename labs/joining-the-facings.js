// JOINING THE FOUR FACINGS (?lab=jnf), written 29 Oct 2026 from the essays (Tom: "is there any labs we should do
// from our essays?", then "1,2,3"): essay 10 §2's "it cannot tell whether two ends meet" put to the library.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's. From the editor it uses: $, PRIMITIVES, flashStatus, hrtSampleRadial, labLadder, makeRng. It declares
// nothing the editor reads. Loaded the first time its button is pressed, or ?lab= asks for it.
(window.TVF_LABS = window.TVF_LABS || {})['joining-the-facings'] = function () {
        // ── joining the four facings ─────────────────────────────────────────
        // The radius from the centroid at 4·64 leaves, cut into four quarter-turn arrays and each
        // multiplied by its own unknown factor. The reader is given the order of the four (which
        // facing each is), and assumes one thing about the payload: that it is continuous, so the
        // two arrays meeting at a seam agree there. Each side's log-radius is carried to the seam
        // by the quadratic through its three nearest leaves (Lagrange weights 15/8, −5/4, 3/8 at
        // half a leaf, one and a half and two and a half out), the two set equal, and that gives
        // the ratio of the two factors. Three seams fix the three ratios, the overall size never;
        // the fourth seam, back to the first array, is the check (a loop closed, the corpus's
        // closure error). Predictions in the drawer, written before the run.
        const JNF_Q = 64,
            JNF_OK = 0.01,
            JNF_FLAG = 0.005;
        const JNF_W = [1.875, -1.25, 0.375];

        function jnfOne(rs, seed) {
            const rnd = makeRng(seed),
                L = 4 * JNF_Q;
            const lnc = [0, 1, 2, 3].map(() => Math.log(4) * (2 * rnd() - 1)); // factors in [¼, 4]
            const A = [0, 1, 2, 3].map(q => {
                const a = new Float64Array(JNF_Q);
                for (let i = 0; i < JNF_Q; i++)
                    a[i] = Math.log(rs[q * JNF_Q + i]) + lnc[q];
                return a;
            });
            // the left array's end carried forward, the right array's start carried back
            const endOf = a => JNF_W[0] * a[JNF_Q - 1] + JNF_W[1] * a[JNF_Q - 2] + JNF_W[2] * a[JNF_Q - 3];
            const startOf = a => JNF_W[0] * a[0] + JNF_W[1] * a[1] + JNF_W[2] * a[2];
            const e = [0, 1, 2, 3].map(q => startOf(A[(q + 1) % 4]) - endOf(A[q])); // ln c_{q+1} − ln c_q, read
            const est = [0, e[0], e[0] + e[1], e[0] + e[1] + e[2]];
            let worst = 0;
            for (let q = 1; q < 4; q++)
                worst = Math.max(worst, Math.abs(Math.expm1(est[q] - (lnc[q] - lnc[0]))));
            const left = Math.abs(Math.expm1(e[0] + e[1] + e[2] + e[3]));
            return {
                worst,
                left
            };
        }

        function runJoinFacings() {
            const rows = [];
            let i = 0;
            for (const spec of PRIMITIVES) {
                if (typeof spec.pts !== 'function')
                    continue;
                let pts;
                try {
                    pts = spec.pts();
                } catch (e) {
                    continue;
                }
                if (!pts || pts.length < 3)
                    continue;
                const rs = hrtSampleRadial(pts, 4 * JNF_Q);
                if (!rs)
                    continue;
                const r = jnfOne(rs, 20261029 + 104729 * i++);
                rows.push({
                    key: spec.key,
                    pts,
                    round: !!spec.round,
                    ...r,
                    flagged: r.left > JNF_FLAG
                });
            }
            return rows;
        }

        function showJoinFacings(rows) {
            const pc = x => x < 1e-4 ? x.toExponential(0) : (100 * x).toFixed(x < 0.01 ? 2 : 1) + '%';
            const out = labLadder({
                rows,
                name: 'joining the four facings',
                suffix: 'four arrays, unknown factors, joined by continuity',
                // teal: joined within 1%; gold: a wrong join the fourth seam caught; red: a wrong join it let through,
                // or a round figure not joined to 1e-4
                verdict: r => (r.round && r.worst > 1e-4) ? 0 : r.worst <= JNF_OK ? 2 : r.flagged ? 1 : 0,
                caption: r => r.key + '\n' + 'factors off by ' + pc(r.worst) + '\n' + 'fourth seam left ' + pc(r.left)
                + (r.worst > JNF_OK ? (r.flagged ? '\nflagged' : '\nNOT FLAGGED') : '')
            });
            if (!out)
                return;
            const n = rows.length,
                c = f => rows.filter(f).length;
            const sorted = rows.map(r => r.worst).sort((a, b) => a - b);
            const med = sorted[n >> 1];
            const round = rows.filter(r => r.round),
                roundOK = round.every(r => r.worst <= 1e-4);
            const wrong = rows.filter(r => r.worst > JNF_OK),
                unseen = wrong.filter(r => !r.flagged);
            const alarms = rows.filter(r => r.worst <= JNF_OK && r.flagged).length;
            const killed = [!roundOK && 'the round figures', med > JNF_OK && 'the median', unseen.length && 'an unseen wrong join']
            .filter(Boolean);
            flashStatus('joining the four facings · ' + n + ' star-shaped figures, each four arrays of ' + JNF_Q
            + ' leaves under unknown factors from ¼ to 4, joined by continuity at three seams'
            + ' · the round figures joined to ' + pc(round.reduce((w, r) => Math.max(w, r.worst), 0))
            + ' · median worst factor ' + pc(med) + ' · joined within 1% on ' + c(r => r.worst <= JNF_OK) + '/' + n
            + ' · of the ' + wrong.length + ' joined wrong, the fourth seam flagged ' + (wrong.length - unseen.length)
            + (unseen.length ? ' and let ' + unseen.length + ' through (' + unseen.map(r => r.key).join(', ') + ')' : '')
            + ' · ' + alarms + ' joined right but flagged'
            + ' · ' + (killed.length ? 'KILLED: ' + killed.join(', ') : 'NO PREDICTION KILLED: continuity, a model of the'
            + ' payload, joins the facings up to one size, which no seam gives back')
            + (out.ms ? ' · ' + out.ms + ' ms' : ''));
        }

        {
            const b = $('bJoinFacings');
            if (b)
                b.addEventListener('click', () => {
                    b.disabled = true;
                    b.textContent = 'joining…';
                    setTimeout(() => {
                        try {
                            const rows = runJoinFacings();
                            if (!rows.length)
                                flashStatus('joining the four facings: no star-shaped figure');
                            else
                                showJoinFacings(rows);
                        } catch (e) {
                            flashStatus('joining the four facings failed: ' + e.message);
                        } finally {
                            b.disabled = false;
                            b.textContent = 'join the facings';
                        }
                    }, 0);
                });
        }
};
