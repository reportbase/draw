// What every part of the smoke test needs: the repo served on a free port, headless Chromium, a page, the list
// of failures, step(), and how a run ends.
//
// tests/smoke.mjs was one file of 4,100 lines run top to bottom (12 Nov 2026: "split the smoke test next"). After
// the editor's walk each of its checks already opened pages of its own, so they are now seven files, one a part
// (editor, exact, morph, motion, gallery, player, labs), that run on their own or side by side; this file is what
// stood above and below them. A part begins `const T = await begin('name')` and ends `await T.finish()`.
//
//   BASE_URL=http://host/   test an already-running server instead of serving the repo
//   SETTLE_MS=400           the time each step gets to settle
//   QUICK=1                 the everyday run: two gallery pages walked, no regeneration of labs.html
//   ONLY='a|b'              only the steps whose names hold a or b
//   CHROMIUM_PATH=…         another Chromium
//
// Console errors (a CDN hiccup, the sign-in check) are printed but do not fail the run; uncaught exceptions do.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

export { readFile, readdir, join };
export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const SETTLE_MS = Number(process.env.SETTLE_MS || 400);    // time each action gets to run
// QUICK=1 (npm run test:quick) is the everyday run: the editor walk and every fast
// single-page check, but only two gallery pages walked (one shape page, one chart page)
// instead of all of them, and no regeneration of labs.html. CI runs the full set.
export const QUICK = !!process.env.QUICK;
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
                '.json': 'application/json', '.svg': 'image/svg+xml' };

/* Buttons the walk does not press: they touch the clipboard (cut, paste), call
   the Claude gateway (ai), or change how a drag behaves for the rest of the run
   (lock, and the two drawing tools, which are exercised separately below). The
   settings menu's own items (new scene, load, save, export) are left alone too,
   since they open file dialogs or start downloads. */
export const SKIP = new Set(['bLock', 'bCut', 'bPaste', 'bAi', 'bDraw', 'bDrawLine']);

// The gallery's pages, and which of them have their own tile code: the chart pages draw a measurement per tile
// rather than a list of loops, the bench is numbered steps, heard plays its tiles, and the loop and composed
// animate. No spectrum strip on any of them. Everything else is a shape page.
export const galleries = (await readdir(join(ROOT, 'gallery'))).filter(f => f.endsWith('.html') && !['index.html', 'inspect.html', 'playground.html'].includes(f)).sort();
export const CHART_PAGES = new Set(['spiral.html', 'curves.html', 'space.html', 'fail.html',
                             'bench.html', 'sound.html', 'motion.html', 'compose.html', 'epicycles.html', 'situated.html', 'depth.html', 'recovered.html', 'corner.html', 'levels.html', 'standpoint.html', 'readers.html', 'compile.html', 'animated.html', 'embedded.html', 'played.html', 'lottie.html', 'explained.html']);
export const shapePages = galleries.filter(g => !CHART_PAGES.has(g));

// A webm's frames: walk its EBML elements, into the Segment and its Clusters, counting SimpleBlocks
export function webmBlocks(buf) {
  const vint = (p, keep) => { let len = 1; while (len <= 8 && !(buf[p] & (0x80 >> (len - 1)))) len++;
    let v = keep ? buf[p] : buf[p] & (0xff >> len); for (let i = 1; i < len; i++) v = v * 256 + buf[p + i]; return { v, len }; };
  let frames = 0, docType = '', firstKey = false;
  const walk = (p, end) => {
    while (p < end) {
      const id = vint(p, true), sz = vint(p + id.len, false), body = p + id.len + sz.len;
      if (id.v === 0x18538067 || id.v === 0x1F43B675 || id.v === 0x1A45DFA3) walk(body, body + sz.v);
      else if (id.v === 0x4282) docType = buf.toString('latin1', body, body + sz.v);
      else if (id.v === 0xA3) { if (!frames) firstKey = !!(buf[body + 3] & 0x80); frames++; }
      p = body + sz.v;
    }
  };
  walk(0, buf.length);
  return { frames, docType, firstKey };
}

function serve(){
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    try {
      const body = await readFile(join(ROOT, path || 'index.html'));
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

export async function begin(part){
  const server = process.env.BASE_URL ? null : await serve();
  const base = process.env.BASE_URL || `http://127.0.0.1:${server.address().port}/`;

  const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  // the part's own page: the editor's walk loads the editor in it, and step() settles on it
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const failures = [];
  // T.current is the check under way, which names an uncaught error; the parts set it as the one file did
  const T = { part, base, browser, page, failures, current: 'page load' };
  page.on('pageerror', e => failures.push(`[${T.current}] ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') console.log(`  console (${T.current}): ${m.text().slice(0, 200)}`); });
  page.on('dialog', d => d.dismiss().catch(() => {}));

  T.step = async function step(name, fn){
    if (process.env.ONLY && !process.env.ONLY.split('|').some(o => name.includes(o))) return; // ONLY='a|b': just those steps
    T.current = name;
    const before = failures.length;
    try { await fn(); } catch (e){ failures.push(`[${name}] ${e.message.split('\n')[0]}`); }
    await page.waitForTimeout(SETTLE_MS);
    await page.keyboard.press('Escape');
    console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${name}`);
  };

  T.drag = async function drag(points){
    await page.mouse.move(...points[0]);
    await page.mouse.down();
    for (const p of points.slice(1)) await page.mouse.move(...p, { steps: 4 });
    await page.mouse.up();
  };

  T.finish = async function finish(){
    let code = 0;
    if (failures.length){
      console.error(`\n${part}: ${failures.length} failure(s):\n` + failures.map(f => '  ' + f).join('\n'));
      code = 1;
    } else {
      console.log(`\n${part}: no uncaught errors`);
    }
    await browser.close();
    server?.close();
    process.exit(code);
  };
  return T;
}
