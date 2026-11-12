// The smoke test: every part, one after another (npm test), or the ones named.
//
//   npm test                         every part
//   npm test -- editor gallery       those parts
//   JOBS=3 npm test                  three parts at a time (each part's output printed whole when it ends)
//   npm run test:quick               QUICK=1: the everyday run (two gallery pages walked, no labs.html regeneration)
//   BASE_URL=http://host/ npm test   test an already-running server instead of serving the repo
//
// The test was one file until 12 Nov 2026. Its checks are in the seven part files beside this one, unchanged,
// each run by `node tests/<part>.mjs` as a process of its own, with its own server and browser (tests/harness.mjs),
// so a failure is rerun alone and CI runs the parts side by side (.github/workflows/smoke.yml lists them too:
// a part added here is added there). A part fails if a page throws an uncaught error or a check does.

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PARTS = ['editor', 'exact', 'morph', 'motion', 'gallery', 'player', 'labs'];

const asked = process.argv.slice(2);
const unknown = asked.filter(a => !PARTS.includes(a));
if (unknown.length){ console.error(`no such part: ${unknown.join(', ')} (the parts: ${PARTS.join(', ')})`); process.exit(2); }
const parts = asked.length ? PARTS.filter(p => asked.includes(p)) : PARTS;
const jobs = Math.max(1, Math.min(parts.length, Number(process.env.JOBS) || 1));

function run(part){
  const t0 = Date.now();
  return new Promise(done => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(part + '.mjs', import.meta.url))],
                        { stdio: jobs > 1 ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
    let out = '';
    if (jobs > 1) for (const s of [child.stdout, child.stderr]) s.on('data', d => { out += d; });
    child.on('close', code => {
      if (jobs > 1) process.stdout.write(`\n── ${part} ──\n${out}`);
      done({ part, code: code ?? 1, s: Math.round((Date.now() - t0) / 1000) });
    });
  });
}

const results = [], queue = [...parts];
await Promise.all(Array.from({ length: jobs }, async () => {
  for (let p; (p = queue.shift());){
    if (jobs === 1) console.log(`\n── ${p} ──`);
    results.push(await run(p));
  }
}));

results.sort((a, b) => parts.indexOf(a.part) - parts.indexOf(b.part));
console.log('\n' + results.map(r => `${r.code ? 'FAIL' : 'ok  '} ${r.part.padEnd(8)} ${r.s} s`).join('\n'));
const bad = results.filter(r => r.code);
if (bad.length){ console.error(`\n${bad.length} part(s) failed: ${bad.map(r => r.part).join(', ')}`); process.exit(1); }
console.log('\nno uncaught errors');
