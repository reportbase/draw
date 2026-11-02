// Write an explainer as a video: the scene played by the TVF player, frame by frame, into an MP4.
//
//   node tools/explainer-video.mjs pictures                 the explainer ?x=pictures (player/examples/pictures.tvfs)
//   node tools/explainer-video.mjs path/to/scene.tvfs       any scene with stops and beats
//     --out file.mp4   (default: <name>.mp4 in the working directory)
//     --size 1280x720  --fps 30  --hold 1.5 (seconds held at each stop)  --speed 1 (the scene's loop played at this rate)
//
// THE VIDEO IS AN OUTPUT OF THE SCENE, NOT A SECOND SOURCE (2 Nov 2026, Tom: "proceed with your recomendations", after
// "can be a web page or a video"). The page stays the explainer's home (scrubbed by reading, a dial where a number is
// the point, links into the papers); a video is for reach. So nothing here is drawn by hand: the player
// (player/tvf-player.js) draws the scene at each frame's time in headless Chromium, exactly as the explainer page and
// the gallery play it, and the frames go to ffmpeg. Its clock runs through the loop at the scene's own pace and holds
// at each stop for --hold seconds, as the page's watch mode does. Each beat (the stretch between two stops) is a
// chapter, titled by the scene's beat titles, and its words are a subtitle track (soft, so a viewer turns them on),
// plain text with the beat words' **bold**, *italic* and [links](…) taken down to their words. No narration: a voice
// would be a further track, laid over the same chapter times.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { serveRoot } from './write-examples.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const what = args.find((a, i) => !a.startsWith('--') && !(i && args[i - 1].startsWith('--')));
if (!what) {
  console.error('usage: node tools/explainer-video.mjs <explainer id | scene.tvfs> [--out f.mp4] [--size WxH] [--fps n] [--hold s] [--speed k]');
  process.exit(1);
}
const file = what.endsWith('.tvfs') ? what : join('player', 'examples', what + '.tvfs');
const [W, H] = opt('size', '1280x720').split('x').map(Number),
  FPS = +opt('fps', 30), HOLD = +opt('hold', 1.5), SPEED = +opt('speed', 1),
  OUT = opt('out', basename(file, '.tvfs') + '.mp4');

const scene = JSON.parse(await readFile(file, 'utf8'));
const stops = (scene.stops || []).filter(t => t > 0 && t < 1).sort((a, b) => a - b),
  edges = [0, ...stops, 1], loop = Math.max(0.1, +scene.loop || 4) / SPEED;

// the frames' clock times: through each beat at the scene's pace, then the stop held
const times = [], chapterAt = [];
for (let b = 0; b + 1 < edges.length; b++) {
  chapterAt.push(times.length / FPS);
  const n = Math.max(1, Math.round((edges[b + 1] - edges[b]) * loop * FPS));
  for (let i = 0; i < n; i++)
    times.push(edges[b] + (edges[b + 1] - edges[b]) * i / n);
  const tEnd = Math.min(edges[b + 1], 1 - 1e-6);
  for (let i = 0; i < Math.round(HOLD * FPS); i++)
    times.push(tEnd);
}
const total = times.length / FPS;
chapterAt.push(total);

const plain = s => String(s || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
const clock = (s, sep) => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60,
  x = Math.floor(ms / 1000) % 60, r = ms % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}${sep}${String(r).padStart(3, '0')}`; };
const beats = scene.beats || [];
const dir = await mkdtemp(join(tmpdir(), 'tvf-video-'));
let srt = '', meta = ';FFMETADATA1\ntitle=' + (scene.name || 'scene').replace(/^example · /, '') + '\n';
for (let b = 0; b + 1 < chapterAt.length; b++) {
  const B = beats[b] || {}, title = B.title || 'Step ' + (b + 1);
  meta += `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(chapterAt[b] * 1000)}\nEND=${Math.round(chapterAt[b + 1] * 1000)}\ntitle=${title}\n`;
  srt += `${b + 1}\n${clock(chapterAt[b], ',')} --> ${clock(chapterAt[b + 1], ',')}\n${title}\n${plain(B.text).split(/\n\s*\n/)[0]}\n\n`;
}
await writeFile(join(dir, 'meta.txt'), meta);
await writeFile(join(dir, 'subs.srt'), srt);

const server = await serveRoot();
const base = `http://127.0.0.1:${server.address().port}/`;
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.route(/fonts\.g/, r => r.abort());
await page.goto(base + 'player.html', { waitUntil: 'load' }).catch(() => {});
await page.setContent(`<!doctype html><body style="margin:0;background:#f4f1ea"><canvas id="c" width="${W}" height="${H}"></canvas></body>`);
await page.addScriptTag({ url: base + 'tvf-core.js' });
await page.addScriptTag({ url: base + 'player/tvf-player.js' });
await page.evaluate(sc => { window.__S = TVFPlayer.load(sc); window.__ctx = document.getElementById('c').getContext('2d'); }, scene);

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-i', join(dir, 'subs.srt'), '-i', join(dir, 'meta.txt'), '-map', '0:v', '-map', '1:s', '-map_metadata', '2', '-map_chapters', '2',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng',
  '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((ok, bad) => ff.on('close', c => c ? bad(new Error('ffmpeg exited ' + c)) : ok()));
let last = null, lastT = NaN;
for (let i = 0; i < times.length; i++) {
  const t = times[i];
  if (t !== lastT) { // a held frame is the same picture: drawn once
    const b64 = await page.evaluate(([t, W, H]) => {
      const c = __ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, W, H);
      TVFPlayer.draw(c, __S, t, W, H);
      return document.getElementById('c').toDataURL('image/png').slice(22);
    }, [t, W, H]);
    last = Buffer.from(b64, 'base64');
    lastT = t;
  }
  if (!ff.stdin.write(last))
    await new Promise(r => ff.stdin.once('drain', r));
  if (i % (FPS * 10) === 0)
    process.stdout.write(`\r${(i / FPS).toFixed(0)} of ${total.toFixed(0)} s`);
}
ff.stdin.end();
await done;
await browser.close();
server.close();
await rm(dir, { recursive: true, force: true });
console.log(`\r${OUT}: ${total.toFixed(1)} s, ${times.length} frames at ${W}×${H}, ${chapterAt.length - 1} chapters`);
