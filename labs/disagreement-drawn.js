// THE DISAGREEMENT, DRAWN (?lab=dis), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, flashStatus, labLadder, makeRng. It declares nothing the editor reads. Loaded the
// first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['disagreement-drawn'] = function () {
        // ── the disagreement, drawn ─────────────────────────────────────────
        // The seed is V_A·H_B − V_B·H_A — and that is TWICE THE SIGNED AREA of the triangle the
        // reader's own standpoint makes with two arrangements. So the quantity the whole corpus is
        // built on has a picture: it is the room between two arrivals, seen from where the reader
        // stands. When the two lie on one ray the triangle is flat, the seed is zero, and there is
        // nothing for the relation to own.
        const DDSIG = Math.log(100) / 128;

        function ddSnap(v) {
            return Math.sign(v) * Math.exp(Math.round(Math.log(Math.abs(v)) / DDSIG) * DDSIG);
        }

        function ddSeed(A, B) {
            return A.y * B.x - B.y * A.x;
        }

        function ddTriangle(A, B) {
            // the closed loop the tool can draw: standpoint, one arrangement, the other
            return [{
                x: 0,
                y: 0
            }, {
                x: A.x,
                y: A.y
            }, {
                x: B.x,
                y: B.y
            }];
        }

        function runDisagreement() {
            const rows = [];
            // one arrangement held fixed; the other brought round towards it, turn by turn
            const A = {
                x: 1.0,
                y: 0.35
            };
            const rA = Math.hypot(A.x, A.y),
                aA = Math.atan2(A.y, A.x);
            for (const gap of [1.20, 0.60, 0.30, 0.12, 0.04, 0.012]) {
                const B = {
                    x: Math.cos(aA + gap) * rA * 1.15,
                    y: Math.sin(aA + gap) * rA * 1.15
                };
                const D = ddSeed(A, B);
                // ⚠ ONE PAIR IS ONE DRAW of a heavy-tailed quantity, and a single snapping is luck:
                // measured pair by pair the trend came out 1.7, 2.6, 0.5, 6.1, 17.7, 3.8 per cent —
                // right in general and wrong in its order. The cell draws ONE triangle; the number
                // under it is the MEDIAN over two hundred pairs at that same separation.
                const rnd = makeRng(1013904223 + Math.round(gap * 1e6));
                const es = [];
                for (let t = 0; t < 200; t++) {
                    const a0 = rnd() * 2 * Math.PI,
                        r0 = 0.6 + 1.2 * rnd();
                    const P = {
                        x: Math.cos(a0) * r0,
                        y: Math.sin(a0) * r0
                    };
                    const Q = {
                        x: Math.cos(a0 + gap) * r0 * 1.15,
                        y: Math.sin(a0 + gap) * r0 * 1.15
                    };
                    const d0 = ddSeed(P, Q);
                    const dg = ddSeed({
                        x: ddSnap(P.x),
                        y: ddSnap(P.y)
                    }, {
                        x: ddSnap(Q.x),
                        y: ddSnap(Q.y)
                    });
                    if (Math.abs(d0) > 1e-15)
                        es.push(Math.abs(dg - d0) / Math.abs(d0));
                }
                es.sort((a, b) => a - b);
                const err = es.length ? es[Math.floor(es.length / 2)] : NaN;
                const scale = rA * rA;
                rows.push({
                    kind: (gap * 180 / Math.PI).toFixed(0) + '\u00b0 apart',
                    pts: ddTriangle(A, B),
                    D,
                    err,
                    note: 'the seed is twice this area: ' + Math.abs(D / scale).toFixed(4)
                    + '\n a quantity resting on it departs by\n '
                    + (100 * err).toFixed(1) + '% once both are held to\n the rung'
                    + ' \u2014 median of two hundred pairs'
                });
            }
            return rows;
        }

        function showDisagreement(rows) {
            const out = labLadder({
                rows,
                name: 'the disagreement, drawn',
                suffix: 'the seed is twice the area the standpoint makes with two arrivals',
                verdict: r => r.err < 0.02 ? 2 : (r.err < 0.10 ? 1 : 0),
                caption: r => r.kind + '\n' + r.note,
            });
            if (!out)
                return;
            const {drawn, ms} = out;
            const wide = drawn[0],
                thin = drawn[drawn.length - 1];
            flashStatus('the disagreement, drawn \u00b7 the corpus\u2019s seed is V_A\u00b7H_B \u2212'
            + ' V_B\u00b7H_A, and that is TWICE THE SIGNED AREA OF THE TRIANGLE the reader\u2019s own'
            + ' standpoint makes with two arrivals \u00b7 so the quantity everything here is built on'
            + ' has a picture: THE ROOM BETWEEN TWO ARRIVALS, SEEN FROM WHERE THE READER STANDS'
            + ' \u00b7 the cells bring the second arrival round towards the first, and as the triangle'
            + ' flattens the seed goes to nothing \u2014 a quantity resting on it departs by '
            + (100 * wide.err).toFixed(1) + '% at the widest and ' + (100 * thin.err).toFixed(0)
            + '% at the thinnest, once both arrivals are held to the rung \u00b7 THAT IS THE WHOLE OF'
            + ' THE SEPARATION RULE, and it is why four readings must be far apart, why five shared'
            + ' landmarks must be spread rather than bunched, and why the reader\u2019s arithmetic'
            + ' fails on a difference of two nearly equal things: ALL FOUR ARE ONE LAW \u2014 A'
            + ' QUANTITY RESTING ON A DISAGREEMENT TOO SMALL TO SURVIVE THE GRAIN \u00b7 crowded'
            + ' arrivals are arrivals that barely disagree, and a relation with no disagreement has'
            + ' nothing to own'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bDD = $('bDisagreement');
            if (bDD)
                bDD.addEventListener('click', () => {
                    bDD.disabled = true;
                    bDD.textContent = 'flattening\u2026';
                    setTimeout(() => {
                        try {
                            const r = runDisagreement();
                            if (!r.length)
                                flashStatus('nothing to run');
                            else
                                showDisagreement(r);
                        }
                        catch (e) {
                            flashStatus('run failed: ' + e.message);
                        }
                        finally {
                            bDD.disabled = false;
                            bDD.textContent = 'draw it';
                        }
                    }, 0);
                });
        }
};
