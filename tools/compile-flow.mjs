// A FLOW INTO A SCENE FILE (18 Nov 2026, with tvf-flow.js): a script that says a scene in code, opened in the editor
// (draw.html#scene=, as `npm run examples` opens the gallery's) and written out as the .tvfs the player plays.
//
//   npm run flow -- flows/pythagoras.mjs [--out file.tvfs]
//
// The script's default export is a function of the library that returns what `flow().build()` gives. Whatever the
// editor says of the scene's quiet fallbacks (window.__sceneWarnings) is printed.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { serveRoot } from './write-examples.mjs';
import '../tvf-flow.js';

export async function compileFlow(base, piece) {
  const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  try {
    const ep = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await ep.route(/fonts\.g/, r => r.abort());
    await ep.goto(new URL('draw.html', base).href + '#scene=' + globalThis.TVF_FLOW.code(piece), { waitUntil: 'load' });
    await ep.waitForFunction(() => !/scene=/.test(location.hash) && window.__box && window.__box.morph(), null, { timeout: 60000 });
    await ep.waitForTimeout(300);
    return { scene: await ep.evaluate(() => window.__box.tvfScene()), warnings: await ep.evaluate(() => (window.__sceneWarnings || []).slice()) };
  } finally { await browser.close(); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const out = opt('--out'), file = args[0] && resolve(args[0]);
  if (!file) { console.error('usage: npm run flow -- <a flow script .mjs> [--out file.tvfs]'); process.exit(2); }
  const server = await serveRoot();
  try {
    const piece = (await import(pathToFileURL(file).href)).default(globalThis.TVF_FLOW);
    const { scene, warnings } = await compileFlow(`http://127.0.0.1:${server.address().port}/`, piece);
    const to = out ? resolve(out) : file.replace(/\.mjs$/, '') + '.tvfs', text = JSON.stringify(scene);
    await writeFile(to, text);
    console.log(`${to}: ${(text.length / 1024).toFixed(1)} KB, ${piece.seconds.toFixed(1)} s, ${piece.scene.beats.length} beats, ${piece.scene.morphs.length} morphs of ${piece.things.length} things`);
    for (const w of warnings) console.log('  note: ' + w);
  } catch (e) { console.error('flow: ' + e.message.split('\n')[0]); process.exitCode = 1; }
  finally { server.close(); }
}
