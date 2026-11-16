// Compile an explainer from a folder of files: a beat a file.
//
//   npm run explainer -- <folder> [--out file.tvfs] [--name "its name"]
//
// AN EXPLAINER FROM FILES (16 Nov 2026, Tom: "each file is a beat and user just imports them to a compiler as a set of
// files with natural sort order"). Every .svg in the folder is a beat, in the natural order of their names (2-intro
// before 10-end); a .md or .txt of the same name beside one is that beat's words. Each drawing morphs into the next.
// THE SCENE IS MADE BY THE EDITOR, as the examples' are (tools/write-examples.mjs): this opens the leaf editor in
// headless Chromium, hands it the files (`__explainer.open`, the menu's "compile an explainer…") and asks it for the
// scene the tvfs button would download, so a folder compiled here is what a person gets by choosing the same files
// in the editor. The file plays in gallery/explained.html?src=<the .tvfs>, and `npm run video -- <the .tvfs>` makes
// a video of it.

import { chromium } from 'playwright';
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';
import { serveRoot } from './write-examples.mjs';

export async function compileExplainer(base, files, name) {
  const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  try {
    const ep = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await ep.route(/fonts\.g/, r => r.abort());
    await ep.goto(new URL('draw.html', base).href, { waitUntil: 'load' });
    await ep.waitForFunction(() => window.__explainer && window.__box, null, { timeout: 60000 });
    const report = await ep.evaluate(([files, name]) => window.__explainer.open(files, { name }), [files, name]);
    if (!report || report.error || !report.ok) throw new Error(report && report.error ? report.error : 'the editor did not open the scene');
    await ep.waitForFunction(() => window.__box.morph(), null, { timeout: 60000 });
    await ep.waitForTimeout(300);
    const scene = await ep.evaluate(() => window.__box.tvfScene());
    const warnings = await ep.evaluate(() => (window.__sceneWarnings || []).slice());
    return { scene, report, warnings };
  } finally { await browser.close(); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const out = opt('--out'), name = opt('--name');
  const dir = args[0] && resolve(args[0]);
  if (!dir || !(await stat(dir).catch(() => null))?.isDirectory()) {
    console.error('usage: npm run explainer -- <folder of .svg files> [--out file.tvfs] [--name "its name"]');
    process.exit(2);
  }
  const names = (await readdir(dir)).filter(n => /\.(svg|md|txt)$/i.test(n));
  const files = await Promise.all(names.map(async n => ({ name: n, text: await readFile(join(dir, n), 'utf8') })));
  const server = await serveRoot();
  try {
    const { scene, report, warnings } = await compileExplainer(`http://127.0.0.1:${server.address().port}/`, files, name || basename(dir));
    const to = out ? resolve(out) : dir.replace(/[\\/]+$/, '') + '.tvfs', text = JSON.stringify(scene);
    await writeFile(to, text);
    console.log(`${to}: ${(text.length / 1024).toFixed(1)} KB, ${report.beats} beats (${report.order.join(', ')}), ${report.chained} shapes morphing through them`);
    for (const w of warnings) console.log('  note: ' + w);
  } catch (e) { console.error('explainer: ' + e.message.split('\n')[0]); process.exitCode = 1; }
  finally { server.close(); }
}
