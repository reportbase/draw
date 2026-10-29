// The outlines of a word's letters, as the editor traces them (29 Oct 2026, Tom: "Tvf would be good for vector text
// effects and morphs"; the text section of gallery/animated.html). The gallery keeps them as plain paths, so its
// examples need no font: node tools/glyph-rings.mjs SUNSET ZENITH   (with the repo served on :8792).
import { chromium } from 'playwright';
const words = process.argv.slice(2);
const b = await chromium.launch(), pg = await b.newPage();
await pg.goto('http://localhost:8792/draw.html?embed=1');
await pg.waitForFunction(() => window.__sceneTextRings, null, { timeout: 20000 });
const out = {};
for (const w of words)
  out[w] = await pg.evaluate(w => window.__sceneTextRings(w, 100, 'sans-serif', 'bold ', 'start', 0, 0), w);
await b.close();
console.log(JSON.stringify(out));
