// EVERYTHING GENERATED OR COPIED, WRITTEN AGAIN (npm run build).
//
// The repo has five things that are written by a tool and checked by the tests, each with its own command. This
// runs them in the order they depend on one another, so "what do I run after changing X" has one answer:
//
//   npm run build            the ones that need no browser, a few seconds:
//                              sync         every copy the gallery pages carry, from its source   (tools/sync.mjs)
//                              player       player/tvf-player.js, from the editor's morph engine  (tools/build-player.mjs)
//                              interactive  player/interactive/, the interactive scenes           (tools/write-interactive.mjs)
//   npm run build -- --all   those, then the two that open the editor in headless Chromium, a minute or two:
//                              labs         labs.html, from the editor's lab buttons              (tools/build-labs.mjs)
//                              examples     player/examples/, from the animated gallery           (tools/write-examples.mjs)
//
// It stops at the first one that fails and says which. What changed is for git to say (git status): a run on a
// tree that is up to date changes nothing. Added 12 Nov 2026 with the housekeeping of that day.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STEPS = [
    ['sync', 'tools/sync.mjs'],
    ['player', 'tools/build-player.mjs'],
    ['interactive', 'tools/write-interactive.mjs'],
    ['labs', 'tools/build-labs.mjs', true],
    ['examples', 'tools/write-examples.mjs', true],
];
const all = process.argv.includes('--all');
for (const [name, file, browser] of STEPS) {
    if (browser && !all) continue;
    const t0 = Date.now();
    console.log(`── ${name} ──`);
    const r = spawnSync(process.execPath, [ROOT + file], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) { console.error(`\nbuild: ${name} failed (${file})`); process.exit(r.status || 1); }
    console.log(`   ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
if (!all) console.log('\n(labs.html and player/examples/ need the editor in a browser: npm run build -- --all)');
