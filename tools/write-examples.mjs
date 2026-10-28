// Write player/examples/*.tvfs: the animated gallery's examples as TVF scenes.
//
//   npm run examples            writes every example on the animated gallery
//   npm run examples -- kite    writes the ones named
//
// THE SCENES ARE WRITTEN BY THE EDITOR, NOT BY HAND. Each example on gallery/animated.html is a
// scene link (the drawing and the live morph's settings); this opens that link in the leaf
// editor in headless Chromium and asks the editor for the scene the morph bar's tvfs button
// would download (`__box.tvfScene()`), so a file here is exactly what a person would get by
// opening the tile in draw and pressing tvfs. When the scene link, the examples or the .tvfs
// writer change, run it again; the smoke test checks that what the player makes of these files
// is what the editor makes of the same examples.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Every example on gallery/animated.html, in its sections' order, and an index of them
// (player/examples/index.json: the sections with their notes, each example's name, note, tags and
// the file's size), which the player's gallery page (gallery/played.html) builds its tiles from.

const TYPES = { '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };

export async function writeExamples(base, ids) {
  const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  const gp = await browser.newPage();
  await gp.route(/fonts\.g/, r => r.abort());
  await gp.goto(new URL('gallery/animated.html', base).href, { waitUntil: 'load' });
  await gp.waitForFunction(() => typeof EXAMPLES !== 'undefined' && typeof sceneCode === 'function');
  const list = await gp.evaluate(() => ({
    sections: SECTIONS.map(s => ({ id: s.id, title: s.title, note: s.note, ids: s.ids.slice() })),
    examples: Object.fromEntries(EXAMPLES.map(e => [e.id, { name: e.name, note: e.note, tags: e.tags || [] }]))
  }));
  if (!ids) ids = list.sections.flatMap(s => s.ids);
  const codes = await gp.evaluate(async ids => {
    const o = {}; for (const id of ids) { const e = EXAMPLES.find(e => e.id === id); o[id] = e ? await sceneCode(e) : null; } return o;
  }, ids);
  await gp.close();
  const out = {};
  for (const id of ids) {
    if (!codes[id]) throw new Error('no example called ' + id + ' on gallery/animated.html');
    const ep = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await ep.route(/fonts\.g/, r => r.abort());
    await ep.goto(new URL('draw.html', base).href + '#scene=' + codes[id], { waitUntil: 'load' });
    await ep.waitForFunction(() => !/scene=/.test(location.hash) && window.__box && window.__box.morph(), null, { timeout: 60000 });
    await ep.waitForTimeout(300);
    out[id] = await ep.evaluate(() => window.__box.tvfScene());
    await ep.close();
  }
  await browser.close();
  return { scenes: out, list, ids };
}

export function serveRoot() {
  const server = createServer(async (req, res) => {
    const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    try { const ext = p.slice(p.lastIndexOf('.'));
          res.writeHead(200, { 'Content-Type': TYPES[ext] || 'text/html' }); res.end(await readFile(join(ROOT, p))); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv.slice(2).length ? process.argv.slice(2) : null;
  const server = await serveRoot();
  const { scenes, list, ids } = await writeExamples(`http://127.0.0.1:${server.address().port}/`, only);
  server.close();
  const dir = join(ROOT, 'player', 'examples');
  let index = null;
  try { index = JSON.parse(await readFile(join(dir, 'index.json'), 'utf8')); } catch {}
  const bytes = index ? index.bytes || {} : {};
  for (const id of ids) {
    const text = JSON.stringify(scenes[id]);
    await writeFile(join(dir, id + '.tvfs'), text);
    bytes[id] = text.length;
    console.log(`player/examples/${id}.tvfs: ${(text.length / 1024).toFixed(1)} KB, ${scenes[id].morphs.length} morphs`);
  }
  await writeFile(join(dir, 'index.json'), JSON.stringify({ sections: list.sections, examples: list.examples, bytes }, null, 1) + '\n');
}
