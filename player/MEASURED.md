# The TVF player, measured

28 Oct 2026, `npm run measure` (`tools/measure-player.mjs`). How long one frame of each example takes the player
to draw (`TVFPlayer.draw`, timed alone, 120 times spread over the loop after a warm-up), into a canvas of a
gallery tile's size, 390 × 260 CSS pixels at 3 device pixels a pixel, in headless Chromium:

- **1×** this machine's CPU as it is (a cloud container, about a desktop);
- **4×, 6×** the same with the CPU slowed four and six times through the DevTools protocol, which is how
  Chromium emulates a mid-range and a slow phone.

It is an emulation. A real phone's GPU, memory, thermal limits and browser differ, and drawing is not the whole
of a frame (the page and the compositor take their share). Read the numbers as which scenes are heavy and by
how much. A frame at 60 a second has 16.7 ms in all.

## What changed

The first run (before) found the scenes with many leaves far too slow: the player rebuilt each leaf curve by the
kernel sum, N × M multiplications a channel a frame, 2,048 × 4,096 for *grow*. It now samples the curve by the
FFT (the format's §21.1, `reconstructFFT`, the same samples to 10⁻¹³) whenever the leaf count is a power of two,
which every drawing tool shape's is. And a still shape, which never changes, is made once into a path in page
units and drawn under the view's transform, rather than rebuilt every frame (the orrery has 24).

| scene | before, 1× | before, 6× | after, 1× | after, 6× |
|---|---|---|---|---|
| grow (2,048 leaves, an effect) | 170 | 1,086 | 2.5 | 19.8 |
| boil (512 leaves, an effect) | 24.5 | 170 | 1.4 | 9.6 |
| lag | 8.1 | 60.6 | 1.0 | 5.8 |
| shimmer | 3.2 | 35.9 | 1.2 | 10.5 |
| orrery (7 morphs, 24 stills, 5 ribbons) | 9.1 | 56.9 | 3.0 | 23.6 |
| lava | 3.5 | 30.2 | 1.6 | 13.6 |

Medians, ms a frame. Every example is now under 16.7 ms at 4×; at 6× all but two, the orrery (its ribbon trails,
240 short strokes a frame) and grow.

## Every example, after

```
scene             morphs   1×: median  p95   4×: median  p95   6×: median  p95   (ms a frame)
clockwork              8     1.3    1.8      5.9    8.7      9.4   19.9
orrery                 7     3.0    3.7     14.8   24.7     23.6   36.1
murmuration           12     0.7    1.0      3.8    5.8      5.5    9.0
garden                12     1.4    2.1      6.7   10.0     10.9   14.6
kite                   8     0.7    0.9      4.0    5.5      4.9    9.6
lava                   5     1.6    2.5      7.8   12.1     13.6   22.4
ripple                40     1.8    2.5      7.9   10.8     14.5   18.5
metamorphosis          1     1.3    1.7      7.7   11.4     11.3   18.6
pendulum-wave         15     0.6    0.9      2.4    4.3      4.4    6.5
house                 10     0.5    0.9      2.1    3.0      3.2    5.4
seed                   6     0.5    0.6      2.1    2.8      3.1    4.8
explainer              4     0.6    0.9      3.3    4.7      3.9    5.8
leaves                10     1.0    1.5      4.5    8.9      6.9   10.4
bouncing-ball          1     0.5    0.7      2.5    3.4      3.8    7.0
dropped                2     0.6    0.8      2.2    3.4      4.8    8.9
lantern                1     0.5    0.8      2.4    3.3      4.6    6.5
jelly                  1     0.5    0.7      2.5    3.4      4.1    7.6
wheel                  1     0.5    0.7      2.8    3.8      4.5    6.9
toss                   1     0.5    0.7      2.9    4.1      3.5    7.4
wind                   6     0.7    0.9      3.0    5.1      4.1    5.6
pop                    3     0.5    0.7      2.1    2.8      3.8    5.6
rider                  2     0.5    0.6      2.5    3.6      4.1    6.4
one-after              1     0.6    1.1      2.4    3.4      2.9    6.6
onto                   3     0.5    0.7      2.1    3.1      4.5    7.0
snow                  60     1.0    1.7      3.9    6.3      7.5   14.4
confetti              60     1.1    1.6      5.2    8.3      8.0   14.4
square-star            1     0.3    0.4      1.3    3.5      2.6    4.0
shape-loop             1     0.3    0.4      1.5    2.6      2.3    3.6
heartbeat              1     0.3    0.4      1.5    2.5      2.5    3.6
snap                   3     0.3    0.4      1.2    2.0      2.4    3.5
boing                  1     0.3    0.5      1.4    2.8      2.5    4.1
orbit                  1     0.9    1.1      4.1    6.9      6.4    8.1
pendulum               1     0.7    0.9      3.0    4.8      4.7    6.8
fish                   1     0.5    0.7      2.2    4.0      3.3    4.2
procession             3     0.8    0.9      4.0    6.3      7.6   13.3
shimmer                1     1.2    1.4      5.2    7.3     10.5   13.1
grow                   1     2.5    3.4     11.6   15.7     19.8   26.4
boil                   1     1.4    1.8      6.4    8.6      9.6   11.7
lag                    1     1.0    1.4      3.5    4.8      5.8    8.3
```

## Not measured

A real phone; the time a scene takes to load (`TVFPlayer.load`, once); many tiles drawing at once (the played
gallery draws only the tiles in view); trails' cost beyond the orrery (the ribbons could be drawn in fewer strokes).
