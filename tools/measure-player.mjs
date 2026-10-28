// Measure the TVF player: how long a frame of each example scene takes to draw, on this machine and on a phone
// as Chromium emulates one (a 390 × 844 screen at three device pixels a pixel, the CPU slowed four and six times
// through the DevTools protocol). It is an emulation: a real phone's GPU, memory and browser differ, and the
// numbers are a guide to which scenes are heavy and by how much, not a promise about any one phone.
//
//   npm run measure                 every example
//   npm run measure -- snow orrery  the ones named
//
// Each scene is drawn into a canvas of the tile's size (390 × 260 CSS pixels at 3×) at 120 evenly spread times of
// its loop, one TVFPlayer.draw each, timed alone (no requestAnimationFrame, no compositing), after a warm-up loop.

import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serveRoot } from './write-examples.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export async function measure(base, ids, rates = [1, 4, 6]) {
  const browser = await chromium.launch();
  const out = {};
  for (const rate of rates) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await page.goto(new URL('player/player.html', base).href, { waitUntil: 'load' });
    for (const id of ids) {
      const d = JSON.parse(await readFile(join(ROOT, 'player', 'examples', id + '.tvfs'), 'utf8'));
      const r = await page.evaluate(d => {
        const S = TVFPlayer.load(d),
          c = document.createElement('canvas');
        c.width = 390 * 3;
        c.height = 260 * 3;
        const x = c.getContext('2d'),
          n = 120,
          ms = [];
        for (let i = 0; i < 20; i++) // warm up
          TVFPlayer.draw(x, S, i / 20, c.width, c.height);
        for (let i = 0; i < n; i++) {
          x.clearRect(0, 0, c.width, c.height);
          const t0 = performance.now();
          TVFPlayer.draw(x, S, i / n, c.width, c.height);
          x.getImageData(0, 0, 1, 1); // wait for the drawing to finish
          ms.push(performance.now() - t0);
        }
        ms.sort((a, b) => a - b);
        return { median: ms[n >> 1], p95: ms[Math.floor(n * 0.95)], morphs: S.runs.length };
      }, d);
      (out[id] = out[id] || { morphs: r.morphs })['x' + rate] = { median: r.median, p95: r.p95 };
    }
    await page.close();
  }
  await browser.close();
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const index = JSON.parse(await readFile(join(ROOT, 'player', 'examples', 'index.json'), 'utf8'));
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : index.sections.flatMap(s => s.ids);
  const server = await serveRoot();
  const res = await measure(`http://127.0.0.1:${server.address().port}/`, ids);
  server.close();
  const f = v => v.toFixed(1).padStart(6);
  console.log('scene'.padEnd(18) + 'morphs   1×: median  p95   4×: median  p95   6×: median  p95   (ms a frame)');
  for (const [id, r] of Object.entries(res))
    console.log(id.padEnd(18) + String(r.morphs).padStart(6) + '  ' + [r.x1, r.x4, r.x6].map(q => f(q.median) + ' ' + f(q.p95)).join('   '));
}
