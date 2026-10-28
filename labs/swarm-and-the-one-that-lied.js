// THE SWARM, AND THE ONE THAT LIED (?lab=swm), moved out of draw.html line for line (28 Oct 2026, Tom: "all the labs
// can ultimately be pulled from draw.html. its already to big", then "batch them").
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure (THE LABS THAT LIVE IN labs/, in draw.html), so every name the code uses is
// the editor's, as it was when the code sat there. Edit it as you would the editor: the same voice, the same indent.
// From the editor it uses: $, asmApply, asmFit, asmInv3, asmMul, asmNull, asmResample, asmSeam, clover, flashStatus,
// labLadder, makeRngCentered. It declares nothing the editor reads. Loaded the first time one of its buttons is
// pressed, or ?lab= asks for one.
(window.TVF_LABS = window.TVF_LABS || {})['swarm-and-the-one-that-lied'] = function () {
        // ── the swarm, and the one that lied ────────────────────────────────
        // Five parties, six readers, one figure none of them ever holds. Each party reads its own
        // stretch AND a set of public landmarks every party reads. Seams are pinned by two shared
        // readers, which is free and noise-free and certifies nothing. The audit runs on the
        // landmarks, which is the only place two parties say something about the same thing.
        const SWG = Math.log(100) / 128 / 3; // the audit needs about three times the corpus's grain

        function swSnap(x) {
            return Math.sign(x) * Math.exp(Math.round(Math.log(Math.abs(x)) / SWG) * SWG);
        }

        function swAccount(seg, Ms, H, front) {
            const Hi = asmInv3(H),
                out = [];
            for (const p of seg) {
                const w = [0, 1, 2].map(r => Hi[r][0] * p.x + Hi[r][1] * p.y + Hi[r][2]);
                const v = [w[0] / w[2], w[1] / w[2], 1];
                const rd = Ms.map(m => {
                    let x = (m[0][0] * v[0] + m[0][1] * v[1] + m[0][2]) / (m[1][0] * v[0] + m[1][1] * v[1] + m[1][2]);
                    if (front)
                        x = front(x);
                    return swSnap(x);
                });
                const S = [0, 1, 2].map(k => [0, 1, 2].map(c => Ms[k][0][c] - rd[k] * Ms[k][1][c]));
                const z = asmNull(S, 3);
                out.push(Math.abs(z[2]) > 1e-12 ? {
                    x: z[0] / z[2],
                    y: z[1] / z[2]
                } : {
                    x: NaN,
                    y: NaN
                });
            }
            return out;
        }

        function swBr(P, a, b, c) {
            return (P[b].x - P[a].x) * (P[c].y - P[a].y) - (P[b].y - P[a].y) * (P[c].x - P[a].x);
        }

        function swInv5(P) {
            return swBr(P, 0, 1, 2) * swBr(P, 0, 3, 4) / (swBr(P, 0, 1, 3) * swBr(P, 0, 2, 4));
        }

        function swDisagree(a, b, K) {
            const ds = [];
            for (let off = 0; off < Math.max(1, Math.floor(K / 5)); off++) {
                const i = [0, 1, 2, 3, 4].map(t => (off + t * Math.floor(K / 5)) % K);
                const va = swInv5(i.map(t => a[t])),
                    vb = swInv5(i.map(t => b[t]));
                if (isFinite(va) && isFinite(vb) && Math.max(Math.abs(va), Math.abs(vb)) > 1e-12)
                    ds.push(Math.abs(va - vb) / Math.max(Math.abs(va), Math.abs(vb)));
            }
            ds.sort((p, q) => p - q);
            return ds.length ? ds[Math.floor(ds.length / 2)] : NaN;
        }

        function runSwarm() {
            const M = 600,
                NP = 5,
                K = 20,
                BAD = 2;
            const clover = PRIMITIVES.find(q => q.key === 'clover');
            const other = PRIMITIVES.find(q => q.key === 'star5') || PRIMITIVES.find(q => q.key === 'heart');
            if (!clover || !other)
                return [];
            const FIG = asmResample(clover.pts(), M),
                ALT = asmResample(other.pts(), M);
            const rnd = makeRngCentered(20260827);
            const mat = (r, c) => Array.from({
                length: r
            }, () => Array.from({
                length: c
            }, () => rnd() * 2));
            const R = Array.from({
                length: NP + 2
            }, () => mat(2, 3));
            const Hs = Array.from({
                length: NP
            }, () => mat(3, 3));
            const step = Math.floor(M / NP);
            const land = Array.from({
                length: K
            }, (_, i) => Math.floor(i * (M - 1) / (K - 1)));
            const own = [],
                marks = [],
                maps = [];
            for (let p = 0; p < NP; p++) {
                const ids = Array.from({
                    length: step
                }, (_, i) => p * step + i);
                const src = (p === BAD) ? ALT : FIG; // the one that read something else
                const seg = ids.concat(land).map(i => src[i]);
                const Ms = [0, 1, 2].map(q => asmMul(R[p + q], Hs[p]));
                const Q = swAccount(seg, Ms, Hs[p], null);
                own.push(Q.slice(0, step));
                marks.push(Q.slice(step));
                maps.push(Ms);
            }
            let cur = maps[0],
                joined = [own[0]];
            for (let p = 1; p < NP; p++) {
                const H = asmSeam([maps[p][0], maps[p][1]], [cur[1], cur[2]]);
                joined.push(asmApply(H, own[p]));
                const Hi = asmInv3(H);
                cur = maps[p].map(m => asmMul(m, Hi));
            }
            const all = [].concat(...joined);
            // each party compares with every other, on the landmarks, inside its own account
            const score = [];
            for (let p = 0; p < NP; p++) {
                const v = [];
                for (let q = 0; q < NP; q++)
                    if (q !== p) {
                        const d = swDisagree(marks[p], marks[q], K);
                        if (isFinite(d))
                            v.push(d);
                    }
                v.sort((a, b) => a - b);
                score.push(v.length ? v[Math.floor(v.length / 2)] : NaN);
            }
            const loud = score.indexOf(Math.max(...score));
            const lo = Math.min(...score.filter(isFinite));
            const guilty = (Math.max(...score) > 0.05) && (Math.max(...score) / Math.max(lo, 1e-12) > 5);
            const rows = [{
                kind: 'the figure',
                pts: asmFit(FIG),
                note: 'no party ever holds this'
            }];
            for (let p = 0; p < NP; p++)
                rows.push({
                    kind: 'party ' + p + (p === BAD ? ' \u2014 read a different figure' : ''),
                    pts: asmFit(own[p]),
                    score: score[p],
                    accused: guilty && p === loud,
                    note: 'its own stretch, in its own account'
                });
            rows.push({
                kind: 'what the five came to',
                pts: asmFit(all),
                note: guilty ? 'assembled anyway \u2014 the seams never noticed'
                : 'assembled from five accounts'
            });
            rows.guilty = guilty;
            rows.loud = loud;
            rows.bad = BAD;
            rows.score = score;
            return rows;
        }

        function showSwarm(rows) {
            const out = labLadder({
                rows,
                name: 'the swarm, and the one that lied',
                suffix: 'five parties, six readers, and a figure none of them holds',
                verdict: r => r.accused ? 0 : (r.score !== undefined ? 2 : 1),
                caption: r => r.kind + '\n' + (r.score === undefined ? r.note
                : 'disagrees with the others by ' + r.score.toFixed(3) + '\n'
                + (r.accused ? 'ACCUSED' : 'in step with the rest')),
            });
            if (!out)
                return;
            const {ms} = out;
            const named = rows.guilty && rows.loud === rows.bad;
            flashStatus((rows.guilty ? (named ? 'TEST PASSED \u2014 party ' + rows.loud
            + ' named, and party ' + rows.bad + ' is the one that read a different figure'
            : 'TEST FAILED \u2014 party ' + rows.loud + ' accused but party ' + rows.bad + ' is the liar')
            : 'TEST FAILED \u2014 nothing reported, and party ' + rows.bad + ' read a different figure')
            + ' \u00b7 five parties hold a stretch each of a figure none of them ever sees whole, plus'
            + ' twenty PUBLIC LANDMARKS every party reads \u00b7 the seams are pinned by two shared'
            + ' readers, which is free and noise-free AND CERTIFIES NOTHING: the parts fused without'
            + ' complaint even with a false one among them \u00b7 what catches it is the landmarks, the'
            + ' only place two parties say something about the same thing, each computing a quantity'
            + ' no account can move, inside its own account, and comparing \u00b7 scores '
            + rows.score.map(v => v.toFixed(3)).join(', ')
            + ' \u00b7 THE LIAR DISAGREES WITH EVERYONE AND THE HONEST DISAGREE WITH NO ONE'
            + (ms ? ' \u00b7 ' + ms + ' ms' : ''));
        }

        {
            const bSW = $('bSwarm');
            if (bSW)
                bSW.addEventListener('click', () => {
                    bSW.disabled = true;
                    bSW.textContent = 'reading\u2026';
                    setTimeout(() => {
                        try {
                            const r = runSwarm();
                            if (!r.length)
                                flashStatus('the swarm: no usable primitives');
                            else
                                showSwarm(r);
                        }
                        catch (e) {
                            flashStatus('swarm run failed: ' + e.message);
                        }
                        finally {
                            bSW.disabled = false;
                            bSW.textContent = 'find the liar';
                        }
                    }, 0);
                });
        }
};
