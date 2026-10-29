// Turns Lottie files (Bodymovin's JSON) into .tvfs scenes the TVF player plays (29 Oct 2026, Tom: "1,2,4", the fourth
// being import from Lottie). The work is player/lottie.js's, the same code player.html runs when a Lottie file is
// dropped on it: each frame is drawn as paths, a path followed from frame to frame becomes a morph of exact keys, and
// Douglas–Peucker in time keeps only the frames a straight blend cannot stand in for.
//   node tools/lottie-to-tvfs.mjs in.json [more.json …] [--out dir] [--tol 0.25]
// Writes each beside its source as NAME.tvfs (or into --out) and says what it left out (masks, mattes, effects, …).
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
// lottie.js is a classic script that puts TVFLottie on the global object (the package is an ES module, so no require).
(0, eval)(readFileSync(join(here, '..', 'player', 'lottie.js'), 'utf8'));
const { isLottie, toScene } = globalThis.TVFLottie;

const args = process.argv.slice(2), files = [];
let out = null, tol;
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') out = args[++i];
    else if (args[i] === '--tol') tol = +args[++i];
    else files.push(args[i]);
}
if (!files.length) { console.error('usage: node tools/lottie-to-tvfs.mjs in.json [more.json …] [--out dir] [--tol px]'); process.exit(1); }
let bad = 0;
for (const f of files) {
    const L = JSON.parse(readFileSync(f, 'utf8'));
    if (!isLottie(L)) { console.error(f + ': not a Lottie file'); bad++; continue; }
    const t0 = Date.now(), b = basename(f).replace(/\.json$/i, ''), name = b === 'data' ? basename(dirname(f)) : b; // lottie-web's demos are all data.json
    const { scene, report } = toScene(L, tol == null ? { name } : { name, tol });
    const text = JSON.stringify(scene), dest = join(out || dirname(f), name + '.tvfs');
    writeFileSync(dest, text);
    const left = Object.entries(report.unsupported).map(([k, n]) => k + (n > 1 ? ' ×' + n : '')).join(', ');
    console.log(dest + ': ' + report.frames + ' frames, ' + report.morphs + ' morphs, ' + report.stills + ' shapes, ' + report.keys + ' keys; '
        + (text.length / 1024).toFixed(1) + ' KB (' + (gzipSync(text).length / 1024).toFixed(1) + ' KB gzipped), ' + (Date.now() - t0) + ' ms'
        + (left ? '; left out: ' + left : ''));
}
process.exit(bad ? 1 : 0);
