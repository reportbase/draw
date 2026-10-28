// THE OWNERSHIP RULE, SHOWN (?lab=own), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labLadder. It declares nothing the editor reads. Loaded the first time
// one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['ownership-rule-shown'] = function () {
        // ── THE OWNERSHIP RULE, SHOWN ────────────────────────────────────────────────
        // The rule as a page a reader can check by eye: one configuration, three
        // accounts, three quantities. The value under each cell is the whole argument —
        // what survives is decided by two counts made before any of it was evaluated.
        function ownShownRun() {
            const rnd = (() => {
                let s = 90210;
                return () => {
                    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; // exactly, in 32-bit integers (see makeRng)
                    return s / 0x7fffffff;
                };
            })();
            const K = 6,
                P = [];
            // an agreeable hexagon-ish configuration, so the cells read as a figure
            for (let i = 0; i < K; i++) {
                const a = i * 2 * Math.PI / K + 0.25,
                    r = 0.62 + 0.3 * rnd();
                P.push({
                    x: r * Math.cos(a),
                    y: r * Math.sin(a)
                });
            }
            const affineOf = p => ({
                x: 1.35 * p.x + 0.42 * p.y,
                y: -0.22 * p.x + 0.86 * p.y
            });
            let Q = null;
            for (let tries = 0; tries < 60 && !Q; tries++) {
                const q1 = 0.30 * (rnd() - 0.5),
                    q2 = 0.30 * (rnd() - 0.5),
                    out = [];
                let ok = Math.abs(q1) + Math.abs(q2) > 0.12;
                if (ok)
                    for (const p of P) {
                        const w = q1 * p.x + q2 * p.y + 1;
                        if (w < 0.45) {
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
            const A = P.map(affineOf);
            const accounts = [['as held', P], ['an affine account', A], ['a projective account', Q]];

            // three quantities, one per class. The counts are stated, not discovered.
            const QUANTS = [
            {
                key: 'balanced, degree 0',
                verdict: 2,
                note: 'two disagreements over two;\nevery arrangement once above\nand once below',
                num: [[0, 1, 2], [0, 3, 4]],
                den: [[0, 1, 3], [0, 2, 4]]
            },
            {
                key: 'degree 0, unbalanced',
                verdict: 1,
                note: 'two over two, but the\narrangements do not match\nabove and below',
                num: [[0, 1, 2], [0, 3, 4]],
                den: [[1, 2, 3], [2, 4, 5]]
            },
            {
                key: 'degree 1',
                verdict: 0,
                note: 'two disagreements over one;\nnothing cancels a determinant\nstanding alone',
                num: [[0, 1, 2], [3, 4, 5]],
                den: [[0, 2, 4]]
            },
            ];
            const value = (X, q) => {
                const c = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (b.x - o.x) * (a.y - o.y);
                let n = 1,
                    d = 1;
                for (const t of q.num)
                    n *= c(X[t[0]], X[t[1]], X[t[2]]);
                for (const t of q.den)
                    d *= c(X[t[0]], X[t[1]], X[t[2]]);
                return d ? n / d : NaN;
            };
            const rows = [];
            for (const q of QUANTS) {
                const held = value(P, q);
                for (const [label, X] of accounts) {
                    if (!X)
                        continue;
                    const v = value(X, q);
                    const moved = Math.abs(v - held) / Math.max(Math.abs(held), 1e-12);
                    rows.push({
                        key: q.key,
                        kind: label,
                        note: q.note,
                        pts: X.concat([X[0]]),
                        v,
                        held,
                        moved,
                        first: label === 'as held',
                        verdict: q.verdict
                    });
                }
            }
            return rows;
        }

        function showOwnershipShown(rows) {
            const out = labLadder({
                rows,
                name: 'the ownership rule',
                suffix: 'held · affine · projective',
                // teal where the value came through the account it is under; red where it did
                // not. The first cell of each row is the value being compared against.
                verdict: r => r.first ? r.verdict : (r.moved < 1e-9 ? 2 : 0),
                caption: r => r.key + '\n' + r.kind + '\n'
                + 'reads ' + (Number.isFinite(r.v) ? r.v.toFixed(6) : '—')
                + (r.first ? '' : (r.moved < 1e-9 ? '   unmoved ✓' : '   MOVED ✗')) + '\n'
                + (r.first ? r.note : 'the figure moved; the number '
                + (r.moved < 1e-9 ? 'did not'
                : 'moved by ' + (100 * r.moved >= 1 ? (100 * r.moved).toFixed(0) + '%'
                : (100 * r.moved).toPrecision(2) + '%'))),
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const say = cls => {
                const r = drawn.filter(x => x.key === cls && !x.first);
                return r.map(x => x.moved < 1e-9 ? 'held' : 'broke').join(' · ');
            };
            flashStatus('the ownership rule · one configuration, three accounts, three quantities'
            + ' — BALANCED AND DEGREE 0: ' + say('balanced, degree 0')
            + ' · DEGREE 0 BUT UNBALANCED: ' + say('degree 0, unbalanced')
            + ' · DEGREE 1: ' + say('degree 1')
            + ' — degree zero cancels the account\u2019s determinant and balance cancels its weight at'
            + ' each arrangement, so the affine account (whose weights are all one) is passed by both'
            + ' degree-zero quantities and only the balanced one survives a projective account'
            + (ms ? ' · ' + ms + ' ms' : ''));
        }

        {
            const bOS = $('bOwnershipShown');
            if (bOS)
                bOS.addEventListener('click', () => {
                    bOS.disabled = true;
                    bOS.textContent = 'laying out…';
                    setTimeout(() => {
                        try {
                            const r = ownShownRun();
                            if (!r.length)
                                flashStatus('the ownership rule: could not build a configuration');
                            else
                                showOwnershipShown(r);
                        }
                        catch (e) {
                            flashStatus('the ownership rule failed: ' + e.message);
                        }
                        finally {
                            bOS.disabled = false;
                            bOS.textContent = 'lay it out';
                        }
                    }, 0);
                });
        }
};
