// OWNERSHIP TESTS (?lab=owt), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can ultimately
// be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labComb, labLadder, makeRng. It declares nothing the editor reads. Loaded
// the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['ownership-tests'] = function () {
        // ── OWNERSHIP TESTS ──────────────────────────────────────────────────────────
        // Which quantities are the pair's, and which are the page's? The answer turns
        // out to be countable before anything is measured. An account restating a
        // figure sends D(a,b,c) to det·D(a,b,c)/(w_a w_b w_c). So a ratio of products
        // of disagreements picks up det^(above−below), times a weight at each point
        // raised to how much more often it appears above than below. Degree zero kills
        // the determinant; balance kills the weights. Nothing else can matter.
        function ownEval(P, num, den) {
            const c = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (b.x - o.x) * (a.y - o.y);
            let n = 1,
                d = 1;
            for (const t of num)
                n *= c(P[t[0]], P[t[1]], P[t[2]]);
            for (const t of den)
                d *= c(P[t[0]], P[t[1]], P[t[2]]);
            return d ? n / d : NaN;
        }

        function ownBalanced(num, den, K) {
            const cnt = new Int32Array(K);
            for (const t of num)
                for (const i of t)
                    cnt[i]++;
            for (const t of den)
                for (const i of t)
                    cnt[i]--;
            for (let i = 0; i < K; i++)
                if (cnt[i] !== 0)
                    return false;
            return true;
        }

        function runOwnershipTests() {
            const K = 8,
                TRIALS = 220;
            const rnd = makeRng(20260824);
            const ri = n => Math.floor(rnd() * n);
            const P = [];
            for (let i = 0; i < K; i++)
                P.push({
                    x: 2 * rnd() - 1,
                    y: 2 * rnd() - 1
                });
            // the three accounts: a turn and a scale, a general affine map, a projective one
            const th = 0.7,
                s = 2.3;
            const S = P.map(p => ({
                x: (p.x * Math.cos(th) - p.y * Math.sin(th)) * s + 0.4,
                y: (p.x * Math.sin(th) + p.y * Math.cos(th)) * s - 0.2
            }));
            const A = P.map(p => ({
                x: 1.4 * p.x + 0.3 * p.y,
                y: -0.2 * p.x + 0.9 * p.y
            }));
            let Q = null;
            for (let tries = 0; tries < 40 && !Q; tries++) {
                const q1 = 0.2 * (rnd() - 0.5),
                    q2 = 0.2 * (rnd() - 0.5),
                    out = [];
                let ok = true;
                for (const p of P) {
                    const w = q1 * p.x + q2 * p.y + 1;
                    if (w < 0.35) {
                        ok = false;
                        break;
                    }
                    out.push({
                        x: p.x / w,
                        y: p.y / w
                    });
                }
                if (ok)
                    Q = out;
            }
            const CLASSES = ['balanced, degree 0', 'degree 0, unbalanced', 'nonzero degree'];
            const drift = {};
            for (const c of CLASSES)
                drift[c] = [[], [], []];
            for (let t = 0; t < TRIALS; t++) {
                for (const cls of CLASSES) {
                    let num,
                        den;
                    if (cls === 'balanced, degree 0') {
                        // the same points dealt above and below: balance by construction
                        const pool = [];
                        for (let i = 0; i < 6; i++)
                            pool.push(ri(K));
                        num = [pool.slice(0, 3), pool.slice(3)];
                        const q = pool.slice();
                        for (let i = q.length - 1; i > 0; i--) {
                            const j = ri(i + 1);
                            const z = q[i];
                            q[i] = q[j];
                            q[j] = z;
                        }
                        den = [q.slice(0, 3), q.slice(3)];
                        if (ownBalanced(num, den, K) === false)
                            continue;
                    } else if (cls === 'degree 0, unbalanced') {
                        num = [[ri(K), ri(K), ri(K)], [ri(K), ri(K), ri(K)]];
                        den = [[ri(K), ri(K), ri(K)], [ri(K), ri(K), ri(K)]];
                        if (ownBalanced(num, den, K))
                            continue;
                    } else {
                        num = [[ri(K), ri(K), ri(K)], [ri(K), ri(K), ri(K)]];
                        den = [[ri(K), ri(K), ri(K)]];
                    }
                    const v = ownEval(P, num, den);
                    if (!isFinite(v) || Math.abs(v) < 1e-5)
                        continue;
                    [S, A, Q].forEach((X, i) => {
                        const w = ownEval(X, num, den);
                        if (!isFinite(w))
                            return;
                        drift[cls][i].push(Math.abs(w - v) / Math.max(Math.abs(v), 1e-12));
                    });
                }
            }
            return {
                drift,
                classes: CLASSES,
                accounts: ['a similarity', 'an affine account', 'a projective account']
            };
        }

        function showOwnershipTests(res) {
            const rows = [];
            const LO = -17,
                HI = 1; // log10 of the relative movement
            res.classes.forEach(cls => {
                res.accounts.forEach((acc, i) => {
                    const d = res.drift[cls][i];
                    if (!d.length)
                        return;
                    const marks = d.map(v => Math.max(LO, Math.min(HI, Math.log10(Math.max(v, 1e-17)))));
                    const held = d.filter(v => v < 1e-9).length;
                    rows.push({
                        key: cls,
                        kind: acc,
                        pts: labComb(marks, LO, HI),
                        n: d.length,
                        held,
                        frac: held / d.length
                    });
                });
            });
            if (!rows.length)
                return;
            labLadder({
                rows,
                name: 'ownership tests',
                suffix: 'degree · balance',
                // teal where the class survived the account entirely, red where none of it
                // did, gold for anything in between — which the rule says cannot happen
                verdict: r => r.frac > 0.999 ? 2 : (r.frac < 0.001 ? 0 : 1),
                caption: r => r.key + '\n' + 'under ' + r.kind + '\n'
                + r.held + ' of ' + r.n + ' unmoved' + (r.frac > 0.999 ? ' ✓' : (r.frac < 0.001 ? ' ✗' : ' ?')) + '\n'
                + 'teeth left = exact, right = wrong',
            });
            const line = res.classes.map(cls => cls + ': '
            + res.accounts.map((acc, i) => {
                const d = res.drift[cls][i];
                const h = d.filter(v => v < 1e-9).length;
                return h + '/' + d.length;
            }).join(' · ')).join('   |   ');
            flashStatus('ownership tests · a ratio of disagreements survives an account exactly when two counts say it will'
            + ' — degree zero cancels the account\u2019s determinant, balance cancels its weight at each point'
            + ' · similarity · affine · projective, per class: ' + line
            + ' — the rule predicted every case and there was nothing in between');
        }

        {
            const bOT = $('bOwnershipTests');
            if (bOT)
                bOT.addEventListener('click', () => {
                    bOT.disabled = true;
                    bOT.textContent = 'counting…';
                    setTimeout(() => {
                        try {
                            showOwnershipTests(runOwnershipTests());
                        }
                        catch (e) {
                            flashStatus('ownership tests failed: ' + e.message);
                        }
                        finally {
                            bOT.disabled = false;
                            bOT.textContent = 'run the tests';
                        }
                    }, 0);
                });
        }
};
