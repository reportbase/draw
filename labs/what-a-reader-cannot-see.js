// WHAT A READER CANNOT SEE (?lab=occ), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs can
// ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, _inside, _occSeen, _shapePrep, flashStatus, labLadder, pathoShape, tbLeaves. It
// declares nothing the editor reads. Loaded the first time one of its buttons is pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['what-a-reader-cannot-see'] = function () {
        function runShapeOcclusion() {
            const half = tbLeaves(32),
                S = half.slice().reverse().map(s => -s).concat(half),
                ROT = [];
            for (let i = 0; i < S.length; i += 2) {
                const s = S[i],
                    c = (1 - s * s) / (1 + s * s),
                    sn = 2 * s / (1 + s * s);
                ROT.push([c, sn]);
            }
            const rows = [];
            for (const [fam, lvl] of OCC_SHAPES) {
                const Q0 = _shapePrep(pathoShape(fam, lvl, 1024)),
                    step = 4;
                let pooled = null,
                    single = 0;
                for (const [c, sn] of ROT) {
                    const P = Q0.map(p => ({
                        x: c * p.x - sn * p.y,
                        y: sn * p.x + c * p.y
                    }));
                    const seenR = _occSeen(P, 0, -32, step);
                    single += seenR.filter(Boolean).length / seenR.length;
                    pooled = pooled ? pooled.map((v, j) => v || seenR[j]) : seenR;
                }
                const out = pooled.filter(Boolean).length / pooled.length;
                let ins = null,
                    both = out;
                if (!_inside(Q0, 0, 0)) {
                    const s2 = _occSeen(Q0, 0, 0, step);
                    ins = s2.filter(Boolean).length / s2.length;
                    both = pooled.map((v, j) => v || s2[j]).filter(Boolean).length / pooled.length;
                }
                rows.push({
                    key: fam + lvl,
                    pts: Q0,
                    one: single / ROT.length,
                    out,
                    ins,
                    both
                });
            }
            return {
                rows
            };
        }

        function showShapeOcclusion(res) {
            const pc = x => x == null ? '—' : (100 * x).toFixed(0) + '%';
            const out = labLadder({
                rows: res.rows,
                name: 'what a reader cannot see',
                suffix: 'outside 32 h ahead, 16 turns · inside at the centre',
                verdict: r => r.out >= 0.99 ? 2 : (r.both >= 0.99 ? 1 : 0),
                caption: r => r.key + '\n' + 'one view ' + pc(r.one) + ' · turned ' + pc(r.out) + '\n' + 'inside ' + pc(r.ins) + ' · both ' + pc(r.both),
            });
            if (!out)
                return;
            const R = res.rows;
            flashStatus('what a reader cannot see · ' + R.length + ' shapes'
            + ' · seen from outside, turned: ' + R.filter(r => r.out >= 0.99).length
            + ' · needs the inside too: ' + R.filter(r => r.out < 0.99 && r.both >= 0.99).length
            + ' · hidden from both: ' + R.filter(r => r.both < 0.99).map(r => r.key + ' ' + pc(r.both)).join(', ')
            + (out.ms ? ' · ' + out.ms + ' ms' : ''));
        }

        {
            const bOcc = $('bShapeOcclusion');
            if (bOcc)
                bOcc.addEventListener('click', () => {
                    bOcc.disabled = true;
                    bOcc.textContent = 'looking…';
                    setTimeout(() => {
                        try {
                            showShapeOcclusion(runShapeOcclusion());
                        }
                        catch (e) {
                            flashStatus('what a reader cannot see failed: ' + e.message);
                        }
                        finally {
                            bOcc.disabled = false;
                            bOcc.textContent = 'find what is hidden';
                        }
                    }, 0);
                });
        }
};
