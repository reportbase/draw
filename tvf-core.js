// tvf-core.js — the shared Tangent Bridge numerics.
// ============================================================================
// THE SOURCE, not a build product. This code was once written here and inlined into the
// editor between BEGIN/END markers by build-inline.mjs; that script and its input left the
// repository, the inlined copy in draw.html became the source, and now it is a file of its
// own again. draw.html loads it with a plain <script src> before its own script, which
// works served and opened from disk alike, so the editor is still a page and one file
// beside it, with no build step. It declares its globals (tvf, TVF_SPECTRAL, TVF_CORE)
// exactly as the inline block did, and under Node it exports TVF_CORE.
//
// Two consumers. draw.html loads it. The 3d repo's 3d.html carries a VERBATIM copy of its
// top, from the line above to the end of the `const tvf = (function () { … })();` IIFE,
// between its "copied from draw.html" markers for tvf-core, and 3d's draw-sync check
// fails as soon as the two differ: after changing that part, copy it into 3d.html.
//
// It gathered three copies into one: the editor's spectral routines (§21 transform, §22
// Fejér), the kernel core from tvf.js, and the audio page's kernel, which had the domain
// halved against it. It adds the analysis-side fold the audio page needs (§18/§21 read in
// the analysis direction: M samples → N leaves), which the editor never had because it
// re-samples a reference curve when N changes.
//
// Convention, once: N leaves at the MIDPOINTS of N equal arcs of the FULL turn,
//     theta_k = (k + 0.5) · 2π/N,
// against the parity-correct kernel. §10 of the theorem allows the period-π inside
// form too, but only if the leaves and the kernel are moved together; wav_tvf.html
// had moved the leaves and not the kernel (59 dB where 110 dB was owed at 0.45 of the
// leaf Nyquist). Everything here is on the full turn. Time, for audio, is t = φ/2π.
//
// Exports one global, TVF_CORE = { tvf, trigLadder, fftTable, fftInPlace, isPow2,
// reconstructFFT, reconstructFejer, leavesFromSamplesFFT, leavesFromSpectrumFFT, ceilPow2 }.
// ============================================================================

const tvf = (function() {
    // tvf.js — closed-curve sculpting on band-limited leaves
    // ============================================================================
    //
    // A shape is N samples of a closed curve, taken at the midpoints of N equal
    // arcs of the parameter circle:
    //
    //     theta_k = (k + 0.5) * 2*PI / N,   k = 0 .. N-1
    //
    // and stored as two flat Float64Arrays, x[] and y[]. That is the whole data
    // model. The curve between the samples is not stored — it is *recovered*, by
    // summing the samples against the periodic cardinal kernel
    //
    //     K_N(phi) = sin(N*phi/2) / (N * tan(phi/2))    N even
    //     K_N(phi) = sin(N*phi/2) / (N * sin(phi/2))    N odd
    //     K_N(0)   = 1                                  either way
    //
    // which is 1 at its own node and exactly 0 at every other node. So:
    //
    //   - Every leaf lies ON the curve. There are no off-curve control handles and
    //     no tangents to keep matched; moving a leaf moves the curve through it.
    //   - You cannot make a kink. The reconstruction is band-limited by
    //     construction, so the worst a single leaf can do is a smooth bump.
    //   - The curve is closed because the domain is a circle. There is no seam.
    //   - Resolution is a scalar: N up is finer, N down is smoother, same shape.
    //   - Every interesting operation is arithmetic on two arrays. Morph is a lerp.
    //     Smooth is a low-pass. Symmetry is an index map. Affine transforms are
    //     exact, because the kernel is a partition of unity.
    //
    // What it is bad at: true corners. A sharp vertex has infinite bandwidth, so
    // you approximate it by spending leaves, and leaves are uniform in parameter —
    // there is no local refinement. Great for organic, blobby, and typographic
    // curve work; awkward for a rounded rectangle. `reparameterize()` mitigates by
    // spending leaves proportional to arc length, but that is parameterization,
    // not adaptivity. Know which one you need.
    //
    // Two charts, one kernel. The angle chart (sin/tan) is what the code above runs
    // and what the Tangent Bridge paper proves in; the slope chart further down is
    // the same object as an algebraic function of the held slope, with no
    // trigonometry at all — the paper is emphatic that this is the observer's
    // actual operation and the trig form is only the display.
    //
    // The math core (kernel, node layout, reconstruction, arc-length resampling)
    // is ported from the tangent leaf editor; this module is the same numerics
    // with a sculpting API on top and no DOM.
    //
    // ----------------------------------------------------------------------------
    // Quick start
    //
    //     import { circle, Shape } from './tvf.js';
    //
    //     const s = circle(64, { r: 100 });
    //     s.push(12, { dx: 30, dy: 0 });   // thumb press at leaf 12
    //     s.smooth(0.3);                   // relax it
    //     s.blend(circle(64, { r: 60 }), 0.25);
    //     ctx.stroke(new Path2D(s.toPath()));
    //
    // ============================================================================

    const TAU = Math.PI * 2;
    const PI = Math.PI;

    // ── ONE PRNG, NOT TWENTY-TWO ────────────────────────────────────────────────
    // The seeded LCG every lab draws from, kept in one place. makeRng(seed)
    // replays the exact stream the inline copies produced (same multiplier,
    // increment and mask, seed used raw on the first step), so every pinned lab
    // number is unchanged. makeRngCentered is the same stream shifted to
    // [-0.5, 0.5) — the noise labs draw from it.
    function makeRng(seed) {
        let s = seed;
        return () => {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }
    function makeRngCentered(seed) {
        const r = makeRng(seed);
        return () => r() - 0.5;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // KERNEL AND NODE LAYOUT
    // ────────────────────────────────────────────────────────────────────────────

    /** Parameter angles of the N leaves: midpoints of N equal arcs. */
    function leafPositions(N) {
        const out = new Float64Array(N);
        for (let k = 0; k < N; k++)
            out[k] = (k + 0.5) * TAU / N;
        return out;
    }

    /**
     * The periodic cardinal kernel. K(0) = 1, K(2*PI*m/N) = 0 for integer m != 0,
     * and sum_k K(phi - theta_k) = 1 for every phi (partition of unity).
     *
     * PARITY MATTERS, and getting it wrong is a quiet bug rather than a loud one.
     * With an even number of nodes the Nyquist harmonic cos(N*phi/2) is real and
     * shared between +N/2 and -N/2, and folding it in symmetrically turns the
     * sin(phi/2) denominator into tan(phi/2):
     *
     *     N even:  sin(N*phi/2) / (N * tan(phi/2))
     *     N odd:   sin(N*phi/2) / (N * sin(phi/2))
     *
     * Both are 1 at their own node and 0 at every other node, so the *interpolation*
     * property holds either way — which is exactly why using the even form for odd N
     * looks fine at the leaves and is wrong everywhere between them. The tell is that
     * the weights stop summing to 1: a 33-leaf circle built with the even kernel
     * misses its own radius by ~0.15 px between leaves, and a constant is no longer
     * reproduced. The leaf editor this was ported from uses the tan form for every N;
     * if it ever offers an odd N, that is a live bug there.
     */
    function kernel(phi, N) {
        while (phi > PI)
            phi -= TAU;
        while (phi < -PI)
            phi += TAU;
        if (Math.abs(phi) < 1e-12)
            return 1;
        const half = phi / 2;
        const denom = N * ((N & 1) ? Math.sin(half) : Math.tan(half));
        if (Math.abs(denom) < 1e-12)
            return 1;
        return Math.sin(N * half) / denom;
    }

    // Weight-matrix cache. out[i] = sum_k c[k] * K(phi_i - theta_k, N) has weights
    // that depend only on (i, k, N, M) and never on the data, yet the naive form
    // pays two transcendentals per inner step for every channel of every shape.
    // Build the M x N matrix once per (N, M) and the inner loop becomes a trig-free
    // multiply-accumulate. Output is bit-identical to the direct sum.
    const _matCache = new Map();
    let _matBytes = 0;
    const MAT_BUDGET = 64 * 1024 * 1024; // 64 MB of cached weights, total

    function kernelMatrix(N, M) {
        const key = N + 'x' + M;
        const hit = _matCache.get(key);
        if (hit)
            return hit;
        const bytes = N * M * 8;
        if (bytes > MAT_BUDGET)
            return null; // too big to be worth caching
        while (_matBytes + bytes > MAT_BUDGET && _matCache.size) {
            const oldest = _matCache.keys().next().value;
            const [on, om] = oldest.split('x').map(Number);
            _matCache.delete(oldest);
            _matBytes -= on * om * 8;
        }
        const leaves = leafPositions(N);
        const W = new Float64Array(N * M);
        for (let i = 0; i < M; i++) {
            const phi = (i / M) * TAU;
            const base = i * N;
            for (let k = 0; k < N; k++)
                W[base + k] = kernel(phi - leaves[k], N);
        }
        _matCache.set(key, W);
        _matBytes += bytes;
        return W;
    }

    /** Drop all cached kernel weights. Only useful if you are cycling many N. */
    function clearCache() {
        _matCache.clear();
        _matBytes = 0;
    }

    /**
     * Reconstruct one channel: N leaf values -> M points uniformly spaced in the
     * parameter, starting at phi = 0.
     *
     * `opts.matrix` lets a host supply its own weight-matrix cache — a function
     * (N, M) => Float64Array | null, laid out row-major as W[i*N + k]. This exists
     * so an application that already caches these weights (with its own memory
     * budget, and its own decisions keyed off when the cache declines) can delegate
     * the sum here without ending up with two caches holding the same numbers.
     * Both branches produce identical output, so which one runs is a performance
     * question only.
     */
    function reconstruct(channel, M, opts) {
        const N = channel.length;
        const out = new Float64Array(M);
        const W = (opts && opts.matrix ? opts.matrix : kernelMatrix)(N, M);
        if (W) {
            for (let i = 0; i < M; i++) {
                const base = i * N;
                let sum = 0;
                for (let k = 0; k < N; k++)
                    sum += channel[k] * W[base + k];
                out[i] = sum;
            }
            return out;
        }
        const leaves = leafPositions(N);
        for (let i = 0; i < M; i++) {
            const phi = (i / M) * TAU;
            let sum = 0;
            for (let k = 0; k < N; k++)
                sum += channel[k] * kernel(phi - leaves[k], N);
            out[i] = sum;
        }
        return out;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // THE SLOPE CHART — the same kernel, without trigonometry
    // ────────────────────────────────────────────────────────────────────────────
    // The Tangent Bridge paper (§11) makes an operational claim the angle-chart code
    // above does not honour: the kernel is only *displayed* in sin/tan, and the
    // observer that runs it holds slopes, where the same object is algebraic —
    //
    //     K_N = Im[(1+is)^N] / (N · s · (1+s²)^(N/2)),      s = tan(φ/2)
    //
    // — "rational in s with the single square root sqrt(1+s²) as its only
    // non-rational step... the count of sin/tan/arctan calls held at zero."
    //
    // It reduces, and the reduction is the point. |1+is|^N = (1+s²)^(N/2) and
    // arg(1+is) = arctan(s) = t, so Im[(1+is)^N] = (1+s²)^(N/2)·sin(Nt) and the
    // whole expression collapses to sin(Nt)/(N·s) — which is sin(Nφ/2)/(N·tan(φ/2)),
    // the EVEN-N kernel exactly.
    //
    // So the published slope form carries the same parity assumption the angle form
    // does, and for the same reason: in the paper N = 2^(d+1) is always even, so the
    // question never arises. Where it does arise, the correction is one character.
    // The odd kernel is sin(Nt)/(N·sin t) rather than sin(Nt)/(N·tan t), and
    // sin t = s/sqrt(1+s²), so the odd form is the same numerator over one lower
    // power of the Cauchy denominator. Both parities at once:
    //
    //     K_N = Im[(1+is)^N] / (N · s · (1+s²)^floor(N/2))
    //
    // The parity that cost a `tan` in §4.1 costs a floor here. Measured against the
    // angle form: as published, 2.6e-2 error at N=33; with the floor, 8.9e-16.
    //
    // Computed by binary powering of the unit-modulus z = (1+is)/sqrt(1+s²), which
    // is O(log N) multiplies rather than the O(N) of expanding the binomial — and
    // which keeps the paper's accounting honest, since sqrt is the one non-rational
    // step it allows and there is no other.

    /**
     * The bridge kernel evaluated from a held slope. Zero trigonometric calls.
     *
     * @param {number} s   the slope tan(phi/2) — the quantity the observer holds
     * @param {number} N   leaf count, either parity
     */
    function kernelSlope(s, N) {
        if (s === 0)
            return 1;
        if (!isFinite(s)) {
            // The antipode, phi = ±pi. Even N: the cos(phi/2) of the product form kills
            // it. Odd N: sin(N·pi/2)/N, which alternates ±1/N.
            if ((N & 1) === 0)
                return 0;
            return ((N - 1) / 2 & 1 ? -1 : 1) / N;
        }
        const q = 1 / Math.sqrt(1 + s * s); // = cos t. THE one non-rational step.
        // z = e^{it} as a pair, never as an angle.
        let zr = q,
            zi = s * q;
        let wr = 1,
            wi = 0; // w = z^N by squaring
        let n = N;
        while (n > 0) {
            if (n & 1) {
                const t = wr * zr - wi * zi;
                wi = wr * zi + wi * zr;
                wr = t;
            }
            const t2 = zr * zr - zi * zi;
            zi = 2 * zr * zi;
            zr = t2;
            n >>= 1;
        }
        const sinNt = wi;
        return (N & 1) ? sinNt / (N * s * q) : sinNt / (N * s);
    }

    /**
     * Tangent subtraction — the Möbius composition law, tan(t - t_k) from the two
     * held slopes. This is how a slope-posed query reaches the kernel without ever
     * becoming an angle.
     */
    function slopeDiff(s, sk) {
        const den = 1 + s * sk;
        if (den === 0)
            return Infinity;
        return (s - sk) / den;
    }

    /**
     * Slopes of the N leaf positions, s_k = tan(theta_k / 2).
     *
     * This is the boundary conversion the paper explicitly allows — "a lone tangent
     * enters only to convert a query supplied as an angle" — and it happens once per
     * leaf at setup, not inside the reconstruction. Everything downstream of it is
     * rational plus one square root.
     */
    function leafSlopes(N) {
        const out = new Float64Array(N);
        for (let k = 0; k < N; k++)
            out[k] = Math.tan((k + 0.5) * PI / N);
        return out;
    }

    /**
     * Reconstruct from held slopes, with no trigonometry in the per-leaf loop.
     *
     * Produces the same numbers as `reconstruct` (verified to ~1e-13 through
     * N = 1024 in test.mjs, both parities) by a different route: Möbius-composed
     * slopes into a rational kernel over a Cauchy denominator. It is slower — the
     * angle form gets to cache a weight matrix and this does O(log N) work per
     * (sample, leaf) pair — so it is here as the demonstration it is, not as the
     * production path.
     *
     * @param {ArrayLike<number>} channel  N leaf values
     * @param {ArrayLike<number>} sQuery   slopes to evaluate at, tan(phi/2) each
     */
    function reconstructSlope(channel, sQuery) {
        const N = channel.length;
        const sk = leafSlopes(N); // boundary conversion, done once
        const out = new Float64Array(sQuery.length);
        for (let i = 0; i < sQuery.length; i++) {
            const s = sQuery[i];
            let sum = 0;
            for (let k = 0; k < N; k++)
                sum += channel[k] * kernelSlope(slopeDiff(s, sk[k]), N);
            out[i] = sum;
        }
        return out;
    }

    /** Evaluate one channel at a single parameter angle. */
    function evalAt(channel, phi) {
        const N = channel.length;
        let sum = 0;
        for (let k = 0; k < N; k++)
            sum += channel[k] * kernel(phi - (k + 0.5) * TAU / N, N);
        return sum;
    }

    /**
     * Resample a closed polyline to N points spaced equally in ARC LENGTH.
     * Returns { x, y, srcCoV } where srcCoV is the coefficient of variation of the
     * input's own gap lengths — a measure of how uneven the source sampling was.
     */
    function arcLengthResample(polyX, polyY, N) {
        const M = polyX.length;
        const cum = new Float64Array(M + 1);
        for (let i = 1; i <= M; i++) {
            const j = i % M;
            cum[i] = cum[i - 1] + Math.hypot(polyX[j] - polyX[i - 1], polyY[j] - polyY[i - 1]);
        }
        const total = cum[M];
        let srcCoV = 0;
        {
            let n = 0,
                mean = 0;
            for (let i = 1; i <= M; i++) {
                const g = cum[i] - cum[i - 1];
                if (g > 1e-12) {
                    n++;
                    mean += g;
                }
            }
            if (n > 1) {
                mean /= n;
                let v = 0;
                for (let i = 1; i <= M; i++) {
                    const g = cum[i] - cum[i - 1];
                    if (g > 1e-12)
                        v += (g - mean) * (g - mean);
                }
                srcCoV = Math.sqrt(v / n) / mean;
            }
        }
        const outX = new Float64Array(N),
            outY = new Float64Array(N);
        let seg = 0;
        for (let k = 0; k < N; k++) {
            const t = ((k + 0.5) / N) * total;
            while (seg < M && cum[seg + 1] < t)
                seg++;
            const sLen = cum[seg + 1] - cum[seg];
            const u = sLen > 1e-12 ? (t - cum[seg]) / sLen : 0;
            const j = (seg + 1) % M;
            outX[k] = polyX[seg] * (1 - u) + polyX[j] * u;
            outY[k] = polyY[seg] * (1 - u) + polyY[j] * u;
        }
        return {
            x: outX,
            y: outY,
            srcCoV
        };
    }

    // ────────────────────────────────────────────────────────────────────────────
    // SPECTRUM
    // ────────────────────────────────────────────────────────────────────────────
    // Leaves sit on a uniform grid, so their DFT *is* the curve's harmonic content.
    // Naive O(N^2) transforms: N here is a leaf count (tens to low thousands), not
    // an audio buffer, and keeping it dependency-free is worth more than the
    // asymptotics. Swap in an FFT if you ever push N past a few thousand.

    function dft(re, im) {
        const N = re.length;
        const outRe = new Float64Array(N),
            outIm = new Float64Array(N);
        for (let m = 0; m < N; m++) {
            let sr = 0,
                si = 0;
            for (let k = 0; k < N; k++) {
                const a = -TAU * m * k / N;
                const c = Math.cos(a),
                    s = Math.sin(a);
                sr += re[k] * c - im[k] * s;
                si += re[k] * s + im[k] * c;
            }
            outRe[m] = sr / N;
            outIm[m] = si / N;
        }
        return {
            re: outRe,
            im: outIm
        };
    }

    function idft(re, im) {
        const N = re.length;
        const outRe = new Float64Array(N),
            outIm = new Float64Array(N);
        for (let k = 0; k < N; k++) {
            let sr = 0,
                si = 0;
            for (let m = 0; m < N; m++) {
                const a = TAU * m * k / N;
                const c = Math.cos(a),
                    s = Math.sin(a);
                sr += re[m] * c - im[m] * s;
                si += re[m] * s + im[m] * c;
            }
            outRe[k] = sr;
            outIm[k] = si;
        }
        return {
            re: outRe,
            im: outIm
        };
    }

    // Deterministic PRNG, so a seeded noise() is reproducible across runs.
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function() {
            a |= 0;
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /** Circular index distance, in leaves. */
    function wrapDist(a, b, N) {
        let d = a - b;
        d -= N * Math.round(d / N);
        return d;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // SHAPE
    // ────────────────────────────────────────────────────────────────────────────

    /**
     * A closed curve as N leaves. Mutating methods change the shape in place and
     * return `this`, so they chain. Use `clone()` first if you need the original.
     */
    class Shape {
        /**
           * @param {ArrayLike<number>} x leaf x values
           * @param {ArrayLike<number>} y leaf y values
           */
        constructor(x, y)
        {
            if (!x || !y || x.length !== y.length)
                throw new Error('tvf: x and y must be the same length');
            if (x.length < 3)
                throw new Error('tvf: a shape needs at least 3 leaves');
            this.x = Float64Array.from(x);
            this.y = Float64Array.from(y);
            /** Free-form user data, carried through clone/resample. */
            this.meta = {};
        }

        get N()
        {
            return this.x.length;
        }

        clone()
        {
            const s = new Shape(this.x, this.y);
            s.meta = Object.assign({}, this.meta);
            return s;
        }

        /** Build from a closed polyline, spending leaves equally along arc length. */
        static fromPoints(points, N, opts={})
        {
            const px = new Float64Array(points.length),
                py = new Float64Array(points.length);
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                px[i] = Array.isArray(p) ? p[0] : p.x;
                py[i] = Array.isArray(p) ? p[1] : p.y;
            }
            const n = N || Math.min(256, Math.max(8, points.length));
            if (opts.arcLength === false) {
                const ox = new Float64Array(n),
                    oy = new Float64Array(n);
                for (let k = 0; k < n; k++) {
                    const t = (k + 0.5) / n * px.length;
                    const i0 = Math.floor(t) % px.length,
                        i1 = (i0 + 1) % px.length,
                        u = t - Math.floor(t);
                    ox[k] = px[i0] * (1 - u) + px[i1] * u;
                    oy[k] = py[i0] * (1 - u) + py[i1] * u;
                }
                return new Shape(ox, oy);
            }
            const r = arcLengthResample(px, py, n);
            const s = new Shape(r.x, r.y);
            s.meta.srcCoV = r.srcCoV;
            return s;
        }

        /** Build from a parametric function f(t) with t in [0, 1). */
        static fromFunction(f, N)
        {
            const x = new Float64Array(N),
                y = new Float64Array(N);
            for (let k = 0; k < N; k++) {
                const p = f((k + 0.5) / N);
                x[k] = Array.isArray(p) ? p[0] : p.x;
                y[k] = Array.isArray(p) ? p[1] : p.y;
            }
            return new Shape(x, y);
        }

        // ── SAMPLING ──────────────────────────────────────────────────────────────

        /** Dense polyline of the reconstructed curve: M points, uniform in parameter. */
        sample(M)
        {
            const m = M || Math.max(256, this.N * 8);
            return {
                x: reconstruct(this.x, m),
                y: reconstruct(this.y, m)
            };
        }

        /** Point on the curve at parameter t in [0, 1). Exact, not interpolated. */
        at(t)
        {
            const phi = t * TAU;
            return {
                x: evalAt(this.x, phi),
                y: evalAt(this.y, phi)
            };
        }

        /** Unit tangent at parameter t, by central difference on the reconstruction. */
        tangentAt(t)
        {
            const h = 1 / (this.N * 64);
            const a = this.at(t - h),
                b = this.at(t + h);
            const dx = b.x - a.x,
                dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1e-12;
            return {
                x: dx / len,
                y: dy / len
            };
        }

        /**
           * LEFT unit normal at t: the tangent rotated +90 degrees. Whether that points
           * out of the shape or into it depends on the winding direction, which is why
           * anything that means "outward" should ask `normals()` instead of guessing.
           */
        normalAt(t)
        {
            const tg = this.tangentAt(t);
            return {
                x: -tg.y,
                y: tg.x
            };
        }

        /** Parameter t in [0, 1) of leaf k. */
        tOf(k)
        {
            return (k + 0.5) / this.N;
        }

        /** Index of the leaf nearest to (x, y), with its distance. */
        nearestLeaf(x, y)
        {
            let best = -1,
                bestD = Infinity;
            for (let k = 0; k < this.N; k++) {
                const d = Math.hypot(this.x[k] - x, this.y[k] - y);
                if (d < bestD) {
                    bestD = d;
                    best = k;
                }
            }
            return {
                index: best,
                distance: bestD
            };
        }

        // ── RESOLUTION ────────────────────────────────────────────────────────────

        /**
           * Change the leaf count. The curve is reconstructed and re-sampled uniformly
           * in the parameter, which preserves the existing parameterization — so N down
           * then N up is a smoothing pass, not a scramble.
           *
           * Evaluated with `evalAt` at each new leaf position, which is exact. It used
           * to reconstruct onto an internal grid of M = max(2048, 16·max(N, N0)) points
           * and interpolate linearly between them, and that had a failure mode worth
           * recording because nothing about the call site hinted at it: the query
           * positions are (k + 1/2)·M/N, so they land ON grid indices exactly when
           * M/(2N) is an integer, and fall between them otherwise. Upsampling 96 → 128
           * was exact to 2e-12; 96 → 127 was off by 1.5e-2, seven orders of magnitude
           * worse from one leaf's difference — and because M is clamped at 2048, COARSER
           * targets were the unreliable ones, which is backwards from every intuition
           * anyone brings to a resampling call. Exactness should not depend on an
           * arithmetic coincidence between the argument and a constant buried in the
           * method, so it no longer does. (The galleries' tvf.js carries the same fix;
           * gallery/fail.html measures the old and the new side by side.)
           */
        resample(N)
        {
            if (N === this.N)
                return this;
            if (N < 3)
                throw new Error('tvf: N must be at least 3');
            const nx = new Float64Array(N),
                ny = new Float64Array(N);
            for (let k = 0; k < N; k++) {
                const phi = (k + 0.5) * TAU / N;
                nx[k] = evalAt(this.x, phi);
                ny[k] = evalAt(this.y, phi);
            }
            this.x = nx;
            this.y = ny;
            return this;
        }

        /**
           * Redistribute the same number of leaves so they are equally spaced in ARC
           * LENGTH rather than in parameter. Same curve, better-spent leaves — worth
           * running after a transform that stretched one region.
           */
        reparameterize()
        {
            const d = this.sample(Math.max(2048, this.N * 16));
            const r = arcLengthResample(d.x, d.y, this.N);
            this.x = r.x;
            this.y = r.y;
            return this;
        }

        // ── SCULPT ────────────────────────────────────────────────────────────────

        /**
           * Press the curve near leaf `k`. This is the thumb.
           *
           * A raised-cosine bump of half-width `radius` leaves is added to the leaf
           * positions, so the deformation is smooth and local and the peak lands
           * exactly on the leaf you grabbed.
           *
           * If `radius` is omitted it is derived from how far you pushed, relative to
           * the typical leaf spacing: a raised-cosine bump of half-width R has peak
           * inter-leaf slope PI/(2R) of its height, so holding that slope under a fixed
           * threshold gives R proportional to |delta| / spacing. Small nudges stay
           * tight, big shoves spread out, and the result does not depend on N.
           *
           * @param {number} k leaf index (fractional is fine)
           * @param {{dx?: number, dy?: number, radius?: number, falloff?: string}} opts
           */
        push(k, opts={})
        {
            const N = this.N;
            const dx = opts.dx || 0,
                dy = opts.dy || 0;
            const dist = Math.hypot(dx, dy);
            if (dist === 0)
                return this;

            let R = opts.radius;
            if (R == null) {
                let total = 0;
                for (let i = 0; i < N; i++) {
                    const j = (i + 1) % N;
                    total += Math.hypot(this.x[j] - this.x[i], this.y[j] - this.y[i]);
                }
                const spacing = total / N || 1e-9;
                R = (PI * PI / 2) * dist / spacing;
            }
            R = Math.max(1, Math.min(R, N / 2));

            const falloff = opts.falloff || 'cosine';
            for (let i = 0; i < N; i++) {
                const d = Math.abs(wrapDist(i, k, N));
                if (d > R)
                    continue;
                let w;
                if (falloff === 'cosine')
                    w = 0.5 * (1 + Math.cos(PI * d / R));
                else if (falloff === 'linear')
                    w = 1 - d / R;
                else if (falloff === 'gauss')
                    w = Math.exp(-4.5 * (d / R) * (d / R));
                else
                    w = 0.5 * (1 + Math.cos(PI * d / R));
                this.x[i] += dx * w;
                this.y[i] += dy * w;
            }
            return this;
        }

        /** Press at parameter t in [0, 1) instead of at a leaf index. */
        pushAt(t, opts={})
        {
            return this.push(t * this.N - 0.5, opts);
        }

        /** Push along the local normal — inflate or dent without choosing a direction. */
        pushNormal(k, amount, opts={})
        {
            const n = this.normalAt(this.tOf(k));
            return this.push(k, Object.assign({}, opts, {
                dx: n.x * amount,
                dy: n.y * amount
            }));
        }

        /**
           * Relax the curve. `amount` in [0, 1] mixes toward a circular [1,2,1]/4 blur
           * of the leaves; `passes` repeats it for a wider, gentler result.
           */
        smooth(amount=0.5, passes=1)
        {
            const N = this.N;
            for (let p = 0; p < passes; p++) {
                const bx = new Float64Array(N),
                    by = new Float64Array(N);
                for (let i = 0; i < N; i++) {
                    const a = (i - 1 + N) % N,
                        b = (i + 1) % N;
                    bx[i] = 0.25 * this.x[a] + 0.5 * this.x[i] + 0.25 * this.x[b];
                    by[i] = 0.25 * this.y[a] + 0.5 * this.y[i] + 0.25 * this.y[b];
                }
                for (let i = 0; i < N; i++) {
                    this.x[i] += (bx[i] - this.x[i]) * amount;
                    this.y[i] += (by[i] - this.y[i]) * amount;
                }
            }
            return this;
        }

        /**
           * Keep only the lowest `keep` fraction of harmonics. This is the honest
           * band-limit: keep = 1 is a no-op, keep = 0.1 leaves a soft blob, and unlike
           * `smooth()` it removes detail exactly rather than attenuating it.
           */
        lowpass(keep=0.5)
        {
            const N = this.N;
            const cut = Math.max(1, Math.floor(Math.max(0, Math.min(1, keep)) * N / 2));
            const zero = new Float64Array(N);
            const fx = dft(this.x, zero),
                fy = dft(this.y, new Float64Array(N));
            for (let m = 0; m < N; m++) {
                const h = Math.min(m, N - m); // signed harmonic order
                if (h > cut) {
                    fx.re[m] = fx.im[m] = 0;
                    fy.re[m] = fy.im[m] = 0;
                }
            }
            const rx = idft(fx.re, fx.im),
                ry = idft(fy.re, fy.im);
            this.x = rx.re;
            this.y = ry.re;
            return this;
        }

        /** Drop the lowest harmonics instead — leaves the wobble, kills the body. */
        highpass(cutFraction=0.1)
        {
            const N = this.N;
            const cut = Math.floor(Math.max(0, Math.min(1, cutFraction)) * N / 2);
            const fx = dft(this.x, new Float64Array(N)),
                fy = dft(this.y, new Float64Array(N));
            for (let m = 0; m < N; m++) {
                const h = Math.min(m, N - m);
                if (h <= cut) {
                    fx.re[m] = fx.im[m] = 0;
                    fy.re[m] = fy.im[m] = 0;
                }
            }
            const rx = idft(fx.re, fx.im),
                ry = idft(fy.re, fy.im);
            this.x = rx.re;
            this.y = ry.re;
            return this;
        }

        /**
           * Morph toward another shape. This is why the format is pleasant: a morph is
           * a lerp of two arrays, with no correspondence problem to solve, because both
           * shapes are sampled on the same parameter grid.
           *
           * If the leaf counts differ, the other shape is resampled to match. Set
           * `align: true` to first rotate the other shape's leaf order to the offset
           * that minimizes total travel — usually what you want when the two shapes
           * were authored independently.
           */
        blend(other, t=0.5, opts={})
        {
            let o = other;
            if (o.N !== this.N)
                o = o.clone().resample(this.N);
            if (opts.align)
                o = alignTo(this, o);
            const N = this.N;
            for (let i = 0; i < N; i++) {
                this.x[i] += (o.x[i] - this.x[i]) * t;
                this.y[i] += (o.y[i] - this.y[i]) * t;
            }
            return this;
        }

        /**
           * Fold the shape onto its own mirror image about a line through the centroid
           * at `angle` radians, then average. The index correspondence is found by
           * searching all N leaf offsets for the one that minimizes total travel, so
           * this works on an arbitrary shape rather than only on a near-symmetric one.
           *
           * `strength` in [0, 1] controls how far to go: 1 is fully symmetric.
           */
        symmetrize(angle=0, strength=1)
        {
            const N = this.N;
            const c = this.centroid();
            const ca = Math.cos(2 * angle),
                sa = Math.sin(2 * angle);
            // Reflected leaves, in reversed order (reflection flips orientation).
            const rx = new Float64Array(N),
                ry = new Float64Array(N);
            for (let i = 0; i < N; i++) {
                const j = (N - 1 - i) % N;
                const px = this.x[j] - c.x,
                    py = this.y[j] - c.y;
                rx[i] = c.x + px * ca + py * sa;
                ry[i] = c.y + px * sa - py * ca;
            }
            // Best circular offset between the original order and the reflected order.
            let bestOff = 0,
                bestCost = Infinity;
            for (let off = 0; off < N; off++) {
                let cost = 0;
                for (let i = 0; i < N; i++) {
                    const j = (i + off) % N;
                    const ddx = this.x[i] - rx[j],
                        ddy = this.y[i] - ry[j];
                    cost += ddx * ddx + ddy * ddy;
                    if (cost >= bestCost)
                        break;
                }
                if (cost < bestCost) {
                    bestCost = cost;
                    bestOff = off;
                }
            }
            for (let i = 0; i < N; i++) {
                const j = (i + bestOff) % N;
                this.x[i] += (0.5 * (this.x[i] + rx[j]) - this.x[i]) * strength;
                this.y[i] += (0.5 * (this.y[i] + ry[j]) - this.y[i]) * strength;
            }
            return this;
        }

        /** Force n-fold rotational symmetry about the centroid, the same way. */
        radialize(fold=5, strength=1)
        {
            const N = this.N;
            const c = this.centroid();
            const acc = this.clone();
            for (let f = 1; f < fold; f++) {
                const rot = this.clone().rotate(TAU * f / fold, c);
                const aligned = alignTo(this, rot);
                for (let i = 0; i < N; i++) {
                    acc.x[i] += aligned.x[i];
                    acc.y[i] += aligned.y[i];
                }
            }
            for (let i = 0; i < N; i++) {
                this.x[i] += (acc.x[i] / fold - this.x[i]) * strength;
                this.y[i] += (acc.y[i] / fold - this.y[i]) * strength;
            }
            return this;
        }

        /**
           * Band-limited displacement along the normal. Built from harmonics directly
           * rather than from per-leaf white noise, so `detail` means something: it is
           * the highest harmonic used, as a fraction of the Nyquist limit. Low detail
           * gives lobes, high detail gives crinkle. Seeded, so it is reproducible.
           */
        noise(amp=5, opts={})
        {
            const N = this.N;
            const detail = opts.detail == null ? 0.25 : opts.detail;
            const rand = mulberry32(opts.seed == null ? 1 : opts.seed);
            const maxH = Math.max(1, Math.floor(detail * N / 2));
            const minH = Math.max(1, opts.minHarmonic || 2);
            const disp = new Float64Array(N);
            for (let h = minH; h <= maxH; h++) {
                const phase = rand() * TAU;
                const a = (rand() * 2 - 1) / h; // 1/f falloff reads as organic
                for (let i = 0; i < N; i++)
                    disp[i] += a * Math.cos(h * (i + 0.5) * TAU / N + phase);
            }
            let peak = 0;
            for (let i = 0; i < N; i++)
                peak = Math.max(peak, Math.abs(disp[i]));
            const scale = peak > 0 ? amp / peak : 0;
            // ALL the normals first, THEN move. Reading a normal off a curve you are
            // halfway through displacing feeds each leaf's motion into the next one's
            // direction, and the error compounds around the loop until the curve
            // crosses itself — a 26 px wobble on a 132 px circle was producing ten
            // self-intersections before this was two passes instead of one.
            const {nx, ny} = this.normals();
            for (let i = 0; i < N; i++) {
                this.x[i] += nx[i] * disp[i] * scale;
                this.y[i] += ny[i] * disp[i] * scale;
            }
            return this;
        }

        /**
           * Unit normals at every leaf, sampled off the CURRENT curve and flipped so
           * they all point OUT of the shape regardless of winding direction. Orientation
           * is read once from the signed area, so a clockwise shape and its reversed
           * twin inflate the same way — which is the only behaviour a caller can use.
           */
        normals()
        {
            const N = this.N;
            const nx = new Float64Array(N),
                ny = new Float64Array(N);
            // Left normal points INTO a positively-wound curve, so flip there.
            const sign = this.area() > 0 ? -1 : 1;
            for (let i = 0; i < N; i++) {
                const n = this.normalAt(this.tOf(i));
                nx[i] = n.x * sign;
                ny[i] = n.y * sign;
            }
            return {
                nx,
                ny
            };
        }

        /** Move every leaf along its normal. Positive inflates (for CCW curves). */
        inflate(amount)
        {
            const N = this.N;
            const {nx, ny} = this.normals();
            for (let i = 0; i < N; i++) {
                this.x[i] += nx[i] * amount;
                this.y[i] += ny[i] * amount;
            }
            return this;
        }

        /**
           * Rotate the leaf ORDER without moving the curve. Same shape, different
           * starting leaf — occasionally what you need before a blend.
           */
        roll(offset)
        {
            const N = this.N;
            const nx = new Float64Array(N),
                ny = new Float64Array(N);
            for (let i = 0; i < N; i++) {
                const j = ((i + offset) % N + N) % N;
                nx[i] = this.x[j];
                ny[i] = this.y[j];
            }
            this.x = nx;
            this.y = ny;
            return this;
        }

        /** Reverse orientation (CW <-> CCW). */
        reverse()
        {
            this.x.reverse();
            this.y.reverse();
            return this;
        }

        // ── AFFINE ────────────────────────────────────────────────────────────────
        // These are exact on the reconstructed curve, not just on the leaves: the
        // kernel is linear and sums to 1, so an affine map of the leaves is the
        // affine map of the whole curve.

        translate(dx, dy)
        {
            for (let i = 0; i < this.N; i++) {
                this.x[i] += dx;
                this.y[i] += dy;
            }
            return this;
        }

        scale(sx, sy=sx, about)
        {
            const c = about || this.centroid();
            for (let i = 0; i < this.N; i++) {
                this.x[i] = c.x + (this.x[i] - c.x) * sx;
                this.y[i] = c.y + (this.y[i] - c.y) * sy;
            }
            return this;
        }

        rotate(angle, about)
        {
            const c = about || this.centroid();
            const ca = Math.cos(angle),
                sa = Math.sin(angle);
            for (let i = 0; i < this.N; i++) {
                const px = this.x[i] - c.x,
                    py = this.y[i] - c.y;
                this.x[i] = c.x + px * ca - py * sa;
                this.y[i] = c.y + px * sa + py * ca;
            }
            return this;
        }

        /** Fit the shape into a box, preserving aspect ratio. */
        fit(x, y, w, h)
        {
            const b = this.bbox();
            const s = Math.min(w / (b.w || 1e-9), h / (b.h || 1e-9));
            this.translate(-b.x - b.w / 2, -b.y - b.h / 2);
            this.scale(s, s, {
                x: 0,
                y: 0
            });
            this.translate(x + w / 2, y + h / 2);
            return this;
        }

        // ── MEASURE ───────────────────────────────────────────────────────────────
        // Measured on the reconstructed curve, not on the leaf polygon, since the
        // curve is the shape.

        centroid()
        {
            let sx = 0,
                sy = 0;
            for (let i = 0; i < this.N; i++) {
                sx += this.x[i];
                sy += this.y[i];
            }
            return {
                x: sx / this.N,
                y: sy / this.N
            };
        }

        bbox(M)
        {
            const d = this.sample(M);
            let x0 = Infinity,
                y0 = Infinity,
                x1 = -Infinity,
                y1 = -Infinity;
            for (let i = 0; i < d.x.length; i++) {
                if (d.x[i] < x0)
                    x0 = d.x[i];
                if (d.x[i] > x1)
                    x1 = d.x[i];
                if (d.y[i] < y0)
                    y0 = d.y[i];
                if (d.y[i] > y1)
                    y1 = d.y[i];
            }
            return {
                x: x0,
                y: y0,
                w: x1 - x0,
                h: y1 - y0
            };
        }

        /** Perimeter of the reconstructed curve. */
        length(M)
        {
            const d = this.sample(M);
            let L = 0;
            for (let i = 0; i < d.x.length; i++) {
                const j = (i + 1) % d.x.length;
                L += Math.hypot(d.x[j] - d.x[i], d.y[j] - d.y[i]);
            }
            return L;
        }

        /** Signed area (shoelace). Negative means clockwise in screen coordinates. */
        area(M)
        {
            const d = this.sample(M);
            let a = 0;
            for (let i = 0; i < d.x.length; i++) {
                const j = (i + 1) % d.x.length;
                a += d.x[i] * d.y[j] - d.x[j] * d.y[i];
            }
            return a / 2;
        }

        contains(px, py, M)
        {
            const d = this.sample(M);
            let inside = false;
            for (let i = 0, j = d.x.length - 1; i < d.x.length; j = i++) {
                const yi = d.y[i],
                    yj = d.y[j];
                if ((yi > py) !== (yj > py)) {
                    const xAt = (d.x[j] - d.x[i]) * (py - yi) / (yj - yi) + d.x[i];
                    if (px < xAt)
                        inside = !inside;
                }
            }
            return inside;
        }

        // ── OUTPUT ────────────────────────────────────────────────────────────────

        /** Dense polyline as [[x, y], ...]. */
        toPolygon(M)
        {
            const d = this.sample(M);
            const out = new Array(d.x.length);
            for (let i = 0; i < d.x.length; i++)
                out[i] = [d.x[i], d.y[i]];
            return out;
        }

        /**
           * SVG path data. A polyline at M samples — honest rather than clever: the
           * curve is band-limited, so enough samples IS the curve, and there is no
           * cubic that reproduces it exactly anyway.
           */
        toPath(M, precision=2)
        {
            const d = this.sample(M);
            const n = d.x.length;
            const f = v => {
                const s = v.toFixed(precision);
                return s.replace(/\.?0+$/, '') || '0';
            };
            let out = `M${f(d.x[0])} ${f(d.y[0])}`;
            for (let i = 1; i < n; i++)
                out += `L${f(d.x[i])} ${f(d.y[i])}`;
            return out + 'Z';
        }

        /** Trace onto a canvas 2D context or Path2D. Does not stroke or fill. */
        trace(ctx, M)
        {
            const d = this.sample(M);
            ctx.moveTo(d.x[0], d.y[0]);
            for (let i = 1; i < d.x.length; i++)
                ctx.lineTo(d.x[i], d.y[i]);
            ctx.closePath();
            return ctx;
        }

        /** Plain object, for JSON. */
        toJSON()
        {
            return {
                N: this.N,
                x: Array.from(this.x),
                y: Array.from(this.y),
                meta: this.meta
            };
        }

        static fromJSON(o)
        {
            const s = new Shape(o.x, o.y);
            if (o.meta)
                s.meta = Object.assign({}, o.meta);
            return s;
        }
    }

    /**
     * Return a copy of `b` whose leaf order is rolled to the offset that minimizes
     * total travel from `a`. Both must share N.
     */
    function alignTo(a, b) {
        const N = a.N;
        if (b.N !== N)
            b = b.clone().resample(N);
        let bestOff = 0,
            bestCost = Infinity;
        for (let off = 0; off < N; off++) {
            let cost = 0;
            for (let i = 0; i < N; i++) {
                const j = (i + off) % N;
                const dx = a.x[i] - b.x[j],
                    dy = a.y[i] - b.y[j];
                cost += dx * dx + dy * dy;
                if (cost >= bestCost)
                    break;
            }
            if (cost < bestCost) {
                bestCost = cost;
                bestOff = off;
            }
        }
        return b.clone().roll(bestOff);
    }

    /** Non-mutating morph: a new shape t of the way from a to b. */
    function mix(a, b, t, opts) {
        return a.clone().blend(b, t, opts);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // PRIMITIVES
    // ────────────────────────────────────────────────────────────────────────────
    // Starting clay. Every one of these is exact at its own leaves; the ones with
    // corners (rect, polygon, star) are exact AT the leaves and rounded between
    // them, which is the band limit being honest rather than a bug. Raise N if you
    // want the corners crisper — or accept the rounding, which usually looks good.

    /** @param {{r?: number, cx?: number, cy?: number}} o */
    function circle(N=64, o={}) {
        const r = o.r == null ? 100 : o.r,
            cx = o.cx || 0,
            cy = o.cy || 0;
        return Shape.fromFunction(t => [cx + r * Math.cos(t * TAU), cy + r * Math.sin(t * TAU)], N);
    }

    function ellipse(N=64, o={}) {
        const rx = o.rx == null ? 120 : o.rx,
            ry = o.ry == null ? 70 : o.ry;
        const cx = o.cx || 0,
            cy = o.cy || 0,
            rot = o.rotation || 0;
        const s = Shape.fromFunction(t => [cx + rx * Math.cos(t * TAU), cy + ry * Math.sin(t * TAU)], N);
        return rot ? s.rotate(rot, {
            x: cx,
            y: cy
        }) : s;
    }

    /**
     * Superellipse: |x/a|^n + |y/b|^n = 1. n = 2 is an ellipse, n = 4 is a squircle,
     * large n approaches a rectangle. The most useful primitive in the set, because
     * it gives you rectangle-ish without asking the band limit for corners.
     */
    function superellipse(N=96, o={}) {
        const a = o.rx == null ? 110 : o.rx,
            b = o.ry == null ? 110 : o.ry;
        const n = o.n == null ? 4 : o.n,
            cx = o.cx || 0,
            cy = o.cy || 0;
        return Shape.fromFunction(t => {
            const th = t * TAU;
            const c = Math.cos(th),
                s = Math.sin(th);
            const p = 2 / n;
            return [
            cx + a * Math.sign(c) * Math.pow(Math.abs(c), p),
            cy + b * Math.sign(s) * Math.pow(Math.abs(s), p),
            ];
        }, N);
    }

    /** Rectangle, sampled along its perimeter by arc length. Corners round off. */
    function rect(N=96, o={}) {
        const w = o.w == null ? 200 : o.w,
            h = o.h == null ? 140 : o.h;
        const cx = o.cx || 0,
            cy = o.cy || 0;
        const pts = [];
        const per = 2 * (w + h),
            steps = Math.max(256, N * 8);
        for (let i = 0; i < steps; i++) {
            let d = (i / steps) * per;
            let x,
                y;
            if (d < w) {
                x = -w / 2 + d;
                y = -h / 2;
            }
            else if ((d -= w) < h) {
                x = w / 2;
                y = -h / 2 + d;
            }
            else if ((d -= h) < w) {
                x = w / 2 - d;
                y = h / 2;
            }
            else {
                d -= w;
                x = -w / 2;
                y = h / 2 - d;
            }
            pts.push([cx + x, cy + y]);
        }
        return Shape.fromPoints(pts, N);
    }

    function polygon(N=96, o={}) {
        const sides = o.sides == null ? 6 : o.sides;
        const r = o.r == null ? 100 : o.r,
            cx = o.cx || 0,
            cy = o.cy || 0;
        const rot = o.rotation == null ? -PI / 2 : o.rotation;
        const verts = [];
        for (let i = 0; i < sides; i++) {
            const a = rot + i * TAU / sides;
            verts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        }
        const pts = [];
        const per = Math.max(256, N * 8),
            each = Math.ceil(per / sides);
        for (let i = 0; i < sides; i++) {
            const [ax, ay] = verts[i],
                [bx, by] = verts[(i + 1) % sides];
            for (let s = 0; s < each; s++) {
                const u = s / each;
                pts.push([ax + (bx - ax) * u, ay + (by - ay) * u]);
            }
        }
        return Shape.fromPoints(pts, N);
    }

    function star(N=128, o={}) {
        const points = o.points == null ? 5 : o.points;
        const r1 = o.r == null ? 110 : o.r;
        const r2 = o.innerR == null ? r1 * 0.45 : o.innerR;
        const cx = o.cx || 0,
            cy = o.cy || 0;
        const rot = o.rotation == null ? -PI / 2 : o.rotation;
        const verts = [];
        for (let i = 0; i < points * 2; i++) {
            const a = rot + i * PI / points;
            const r = i % 2 === 0 ? r1 : r2;
            verts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        }
        const pts = [];
        const each = Math.ceil(Math.max(512, N * 8) / verts.length);
        for (let i = 0; i < verts.length; i++) {
            const [ax, ay] = verts[i],
                [bx, by] = verts[(i + 1) % verts.length];
            for (let s = 0; s < each; s++) {
                const u = s / each;
                pts.push([ax + (bx - ax) * u, ay + (by - ay) * u]);
            }
        }
        return Shape.fromPoints(pts, N);
    }

    /** A circle with seeded band-limited wobble. The default lump of clay. */
    function blob(N=64, o={}) {
        const s = circle(N, {
            r: o.r == null ? 100 : o.r,
            cx: o.cx || 0,
            cy: o.cy || 0
        });
        return s.noise(o.amp == null ? 22 : o.amp, {
            seed: o.seed == null ? 7 : o.seed,
            detail: o.detail == null ? 0.12 : o.detail,
            minHarmonic: o.minHarmonic || 2,
        });
    }

    /** Rose curve r = r0 * (1 + k*cos(petals * theta)). Cheap organic variety. */
    function rose(N=128, o={}) {
        const r0 = o.r == null ? 100 : o.r,
            petals = o.petals == null ? 5 : o.petals;
        const k = o.depth == null ? 0.35 : o.depth;
        const cx = o.cx || 0,
            cy = o.cy || 0;
        return Shape.fromFunction(t => {
            const th = t * TAU;
            const r = r0 * (1 + k * Math.cos(petals * th));
            return [cx + r * Math.cos(th), cy + r * Math.sin(th)];
        }, N);
    }

    const primitives = {
        circle,
        ellipse,
        superellipse,
        rect,
        polygon,
        star,
        blob,
        rose
    };

    return {
        Shape,
        mix,
        alignTo,
        primitives,
        kernelMatrix,
        kernelSlope,
        slopeDiff,
        leafSlopes,
        reconstructSlope,
        circle,
        ellipse,
        superellipse,
        rect,
        polygon,
        star,
        blob,
        rose,
        kernel,
        leafPositions,
        reconstruct,
        evalAt,
        arcLengthResample,
        clearCache,
        TAU
    };
})();

// ════════════════════════════════════════════════════════════════════════════
// SPECTRAL COURT — moved here from the editor body (identical code).
// ════════════════════════════════════════════════════════════════════════════
const TVF_SPECTRAL = (function() {
    'use strict';
    // ────────────────────────────────────────────────────────────────────
    // SPECTRAL RECONSTRUCTION — the cascade read in the dual (TB companion §21)
    //
    // The open-aperture reconstruction below is the Dirichlet sum: out[i] = Σ_k c_k
    // K(φ_i − θ_k), an M×N multiply-accumulate. §21 identifies that sum as a DFT: the
    // leaves sit at odd multiples of π/N, so analysis is an ordinary radix-2 transform
    // post-multiplied by the half-shift twiddle e^{−imπ/N} (21.1), and evaluating the
    // band-limited interpolant at M equispaced points is the inverse transform of the
    // zero-padded spectrum. O(M log M) where the sum is O(N·M).
    //
    // The identity is exact, so this is the same curve, not an approximation of it —
    // agreement measured at ~1e-13, which is nine orders below a device pixel at any
    // zoom this editor reaches. The direct sum is kept for small N·M, where the cached
    // weight matrix beats a transform, and for anything the transform cannot take
    // (non-power-of-two M, M < N).
    //
    // The Nyquist mode carries weight ½, split across ±N/2 (18.1) — the same half-weight
    // top mode that is the ½ frame eigenvalue of §19 and the −i twiddle of §21.2. Getting
    // it wrong shows up immediately as a doubled top-band ripple.
    // ────────────────────────────────────────────────────────────────────
    const _fftTables = new Map(); // n → twiddle table for an n-point transform

    // The twiddle table, built with NO trigonometric call (§21.4): W_n^p = (1−i·s_p)/(1+i·s_p)
    // is the Cayley image of the leaf slope s_p = tan(pπ/n), and those slopes are
    // constructible — one bisection (√) for the base slope tan(π/n), then tangent addition,
    // which is Möbius composition. Only the first quadrant is built, where 0 ≤ s ≤ 1 and
    // the composition is numerically quiet; the other three come from the exact symmetries
    // e^{−iθ−iπ/2} = −i·e^{−iθ} and e^{−iθ−iπ} = −e^{−iθ}. The table is built once per
    // length and cached, so this buys no speed — it is here because the twiddle table
    // being the leaf lattice is the point of §21.4, and the demo may as well show it.
    // The constructible ladder: cos and sin of 2πi/L for i = 0 … L/4, with no trigonometric
    // call. Two stages, and the second one is the reason this is not the obvious code.
    //
    // STAGE 1, the seeds. The cosine half-angle map c ↦ √((1+c)/2), run from cos(π/2)=0,
    // gives cos(π/2^k) down the dyadic ladder, with sin(a/2) = sin(a)/(2cos(a/2)) alongside.
    // It has no cancellation (1+c ≈ 2) and its derivative at c ≈ 1 is ¼, so absolute error
    // CONTRACTS fourfold per rung. Measured: under 0.5 ulp at every rung to k = 18.
    //
    // STAGE 2, the fill. Not a walk — a binary subdivision, on the identity
    //     f(α) = [1/(2cos δ)] · ( f(α−δ) + f(α+δ) )
    // which fills the midpoint of two known entries. This is Buneman's half-secant
    // interpolation (Proc. IEEE 75(10) 1987, and the now-expired US 4,878,187), and it is
    // what FFTS uses to build twiddles to under half an ulp with no libm call.
    //
    // The first draft of this file walked the ladder instead: base slope by bisection, then
    // tangent addition (Möbius) p times. That is a first-order recurrence — the propagation
    // gain is exactly 1, so nothing is damped, but nothing is CORRECTED either, and the p
    // independent roundings simply add. Error grew as O(L): 2.9e-14 at L=4096, 3.3e-13 at
    // L=65536, which is the same class as naive repeated complex multiplication and exactly
    // what FFTW warns about. Subdivision replaces L sequential dependencies with log L tree
    // levels, so the error grows as O(u·log L) instead. Measured against Math.cos/sin:
    //     L      walk        subdivision
    //     4096   2.9e-14     3.3e-16     88×
    //     65536  3.3e-13     5.6e-16    590×
    // Correcting the base slope does nothing for the walk — the accumulation is structural.
    const _ladders = new Map();
    function trigLadder(L) {
        let t = _ladders.get(L);
        if (t)
            return t;
        const lg = Math.round(Math.log2(L)),
            N = L >> 2;
        const c = new Float64Array(lg + 1),
            s = new Float64Array(lg + 1),
            h = new Float64Array(lg + 1);
        c[1] = 0;
        s[1] = 1; // cos, sin of π/2
        for (let k = 1; k < lg; k++) {
            c[k + 1] = Math.sqrt((1 + c[k]) * 0.5); // cos(π/2^(k+1))
            s[k + 1] = s[k] / (2 * c[k + 1]); // sin(π/2^(k+1))
        }
        for (let k = 1; k <= lg; k++)
            h[k] = 0.5 / c[k]; // the half-secants
        const C = new Float64Array(N + 1),
            S = new Float64Array(N + 1);
        C[0] = 1;
        S[0] = 0;
        C[N] = 0;
        S[N] = 1; // both endpoints exact
        for (let step = N; step > 1; step >>= 1) {
            const half = step >> 1;
            const hk = h[lg - Math.round(Math.log2(half)) - 1]; // 1/(2·cos(2π·half/L))
            for (let i = 0; i + step <= N; i += step) {
                C[i + half] = hk * (C[i] + C[i + step]);
                S[i + half] = hk * (S[i] + S[i + step]);
            }
        }
        t = {
            C,
            S
        };
        if (_ladders.size > 16)
            _ladders.delete(_ladders.keys().next().value);
        _ladders.set(L, t);
        return t;
    }

    function fftTable(n) {
        let t = _fftTables.get(n);
        if (t)
            return t;
        const cos = new Float64Array(n),
            sin = new Float64Array(n);
        const q = n >> 2,
            half = n >> 1;
        const lad = trigLadder(n); // cos, sin of 2πp/n directly
        for (let p = 0; p <= q; p++) {
            cos[p] = lad.C[p]; // Re W_n^p
            sin[p] = -lad.S[p]; // Im W_n^p (W = e^{-2πip/n})
        }
        for (let p = q + 1; p <= half; p++) {
            const j = p - q;
            cos[p] = sin[j];
            sin[p] = -cos[j];
        }
        for (let p = half + 1; p < n; p++) {
            const j = p - half;
            cos[p] = -cos[j];
            sin[p] = -sin[j];
        }
        t = {
            cos,
            sin
        };
        if (_fftTables.size > 24)
            _fftTables.delete(_fftTables.keys().next().value);
        _fftTables.set(n, t);
        return t;
    }

    // Iterative radix-2 Cooley–Tukey, in place. One stage = one application of the
    // doubling map = one octave of the cascade (§21.3): the pairing (i, i+len/2) is the
    // two-to-one fiber of θ ↦ 2θ, which is the same recursion that nests the leaves.
    function fftInPlace(re, im, inverse) {
        const n = re.length;
        const tab = fftTable(n);
        for (let i = 1, j = 0; i < n; i++) {
            let bit = n >> 1;
            for (; j & bit; bit >>= 1)
                j ^= bit;
            j ^= bit;
            if (i < j) {
                let t = re[i];
                re[i] = re[j];
                re[j] = t;
                t = im[i];
                im[i] = im[j];
                im[j] = t;
            }
        }
        for (let len = 2; len <= n; len <<= 1) {
            const half = len >> 1,
                step = n / len;
            for (let i = 0; i < n; i += len) {
                for (let k = 0; k < half; k++) {
                    const tw = k * step;
                    const wr = tab.cos[tw],
                        wi = inverse ? -tab.sin[tw] : tab.sin[tw];
                    const a = i + k,
                        b2 = a + half;
                    const vr = re[b2] * wr - im[b2] * wi;
                    const vi = re[b2] * wi + im[b2] * wr;
                    re[b2] = re[a] - vr;
                    im[b2] = im[a] - vi;
                    re[a] += vr;
                    im[a] += vi;
                }
            }
        }
        if (inverse)
            for (let i = 0; i < n; i++) {
                re[i] /= n;
                im[i] /= n;
            }
    }

    const isPow2 = v => v >= 1 && (v & (v - 1)) === 0;

    // The interpolant of `channel`, sampled at M equispaced angles, via §21.1.
    function reconstructFFT(channel, M) {
        const N = channel.length;
        const re = Float64Array.from(channel),
            im = new Float64Array(N);
        fftInPlace(re, im, false);
        const shift = fftTable(2 * N); // half-shift twiddle e^{-imπ/N} = W_{2N}^m
        const sr = new Float64Array(M),
            si = new Float64Array(M);
        const TWO_N = 2 * N;
        for (let k = 0; k < N; k++) {
            const m = (k <= N / 2) ? k : k - N; // signed frequency
            const t = ((m % TWO_N) + TWO_N) % TWO_N;
            const tr = shift.cos[t],
                ti = shift.sin[t];
            let cr = (re[k] * tr - im[k] * ti) / N;
            let ci = (re[k] * ti + im[k] * tr) / N;
            if (k === N / 2) {
                cr *= 0.5;
                ci *= 0.5;
            } // the half-weight top mode
            let idx = ((m % M) + M) % M;
            sr[idx] += cr;
            si[idx] += ci;
            if (k === N / 2) {
                // …and its mirror at −N/2, conjugated
                idx = ((-m % M) + M) % M;
                sr[idx] += cr;
                si[idx] -= ci;
            }
        }
        fftInPlace(sr, si, true);
        for (let i = 0; i < M; i++)
            sr[i] *= M; // undo the inverse transform's 1/M
        return sr;
    }

    // ────────────────────────────────────────────────────────────────────
    // THE FEJÉR PRESENTATION (TB companion §22)
    //
    // The bridge is a Dirichlet-type operator: exact at the atoms, signed, and amplified
    // by Λ_N ≈ ψ₁ln N — which is what lets a corner ring, and what the ringing overlay
    // finds and `excise` cuts out. Fejér is its positive sibling: the same N leaf readings
    // weighted by the triangular Cesàro window τ_m = max(0, 1 − |m|/(N/2)). The kernel
    // becomes nonnegative and sums to one, so the operator norm is exactly 1 at every N —
    // it CANNOT ring, for any continuous shape, with no Dini–Lipschitz restriction.
    //
    // The price is stated as plainly in §22.4: it is no longer interpolatory. The curve
    // stops passing through its own leaves and approaches them at O(1/N), so the leaf dots
    // sit just off the line — that is not a bug in the drawing, it is the trade being
    // shown. R1/R2 surrendered, R4 secured; the two horns of §6.4, on the same leaf data.
    //
    // The window also zeroes the top mode (τ at Nyquist is 0), so the half-weight ½ that
    // every other part of this file negotiates simply does not arise here.
    // ────────────────────────────────────────────────────────────────────
    function reconstructFejer(channel, M) {
        const N = channel.length;
        const re = Float64Array.from(channel),
            im = new Float64Array(N);
        fftInPlace(re, im, false);
        const shift = fftTable(2 * N);
        const sr = new Float64Array(M),
            si = new Float64Array(M);
        const TWO_N = 2 * N,
            half = N / 2;
        for (let k = 0; k < N; k++) {
            const m = (k <= half) ? k : k - N;
            const tau = 1 - Math.abs(m) / half; // triangular Cesàro weight
            if (tau <= 0)
                continue; // …and the top mode is dropped outright
            const t = ((m % TWO_N) + TWO_N) % TWO_N;
            const tr = shift.cos[t],
                ti = shift.sin[t];
            const cr = (re[k] * tr - im[k] * ti) / N * tau;
            const ci = (re[k] * ti + im[k] * tr) / N * tau;
            const idx = ((m % M) + M) % M;
            sr[idx] += cr;
            si[idx] += ci;
        }
        fftInPlace(sr, si, true);
        for (let i = 0; i < M; i++)
            sr[i] *= M;
        return sr;
    }

    const ceilPow2 = v => {
        let n = 1;
        while (n < v)
            n <<= 1;
        return n;
    };

    // ────────────────────────────────────────────────────────────────────
    // THE ANALYSIS FOLD — M samples → N leaves (TB companion §18, §21 read backwards)
    //
    // reconstructFFT above is synthesis: leaves → the interpolant at M equispaced points.
    // This is its mirror. Samples sit on the even grid t_i = i/M (phase 0), the same grid
    // reconstructFFT lands on, so decode(encode(x)) returns to the samples themselves.
    //
    // Analysis: the M-point transform gives the source modes a_m for |m| < M/2. The N-leaf
    // grid can hold |m| < N/2 (18.1); everything above would FOLD in with the odd-node sign
    // twist, so it is dropped here rather than folded — dropping is the band-limit, and it
    // is the whole of the band-limit: no separate brick-wall pass, no ringing added by one.
    // The kept modes are re-phased onto the leaf grid by the half-shift twiddle e^{+imπ/N}
    // (the conjugate of the one reconstructFFT undoes) and inverse-transformed at N. The
    // result is EXACTLY the band-limited signal's value at each θ_k — not an interpolation
    // of neighbouring samples, which is what the audio page did before and what set its
    // 55 dB floor. Verified against direct evaluation at 1e-12.
    //
    // The top mode |m| = N/2 is dropped, not halved: on the analysis side there is no
    // self-consistency to negotiate (the grid simply cannot see it), and dropping it keeps
    // the round-trip encode→decode idempotent. At N = M the source's own top mode is the
    // one thing lost, which is the same half-weight fact (18.1) seen from the other side.
    //
    // Requires isPow2(M) and isPow2(N), N ≤ M. Callers pad M up (zero at the end — the
    // seam of the closed circle falls in the padding, where nothing rings).
    // ────────────────────────────────────────────────────────────────────
    function leavesFromSamplesFFT(samples, N) {
        const M = samples.length;
        if (!isPow2(M) || !isPow2(N) || N > M)
            throw new Error('leavesFromSamplesFFT: need pow2 M, pow2 N, N <= M');
        const re = Float64Array.from(samples),
            im = new Float64Array(M);
        fftInPlace(re, im, false); // a_m · M at bin m mod M
        return leavesFromSpectrumFFT(re, im, N);
    }
    // The same fold from an already-transformed source (re, im = the unnormalised M-point
    // forward transform). The audio page transforms a file once and re-folds per N, so the
    // expensive transform is not repeated on every slider tick. Does not modify re, im.
    function leavesFromSpectrumFFT(re, im, N) {
        const M = re.length;
        if (!isPow2(M) || !isPow2(N) || N > M)
            throw new Error('leavesFromSpectrumFFT: need pow2 M, pow2 N, N <= M');
        const shift = fftTable(2 * N); // W_{2N}^m = e^{-imπ/N}; we need its conjugate
        const lr = new Float64Array(N),
            li = new Float64Array(N);
        const TWO_N = 2 * N,
            half = N >> 1;
        for (let m = -half + 1; m < half; m++) {
            // |m| < N/2 — the band the leaves hold
            const src = ((m % M) + M) % M;
            const ar = re[src] / M,
                ai = im[src] / M;
            const t = ((m % TWO_N) + TWO_N) % TWO_N;
            const tr = shift.cos[t],
                ti = -shift.sin[t]; // conjugate: e^{+imπ/N}
            const dst = ((m % N) + N) % N;
            lr[dst] = ar * tr - ai * ti;
            li[dst] = ar * ti + ai * tr;
        }
        fftInPlace(lr, li, true); // divides by N …
        for (let k = 0; k < N; k++)
            lr[k] *= N; // … undone: the sum is the value
        return lr;
    }

    return {
        trigLadder,
        fftTable,
        fftInPlace,
        isPow2,
        ceilPow2,
        reconstructFFT,
        reconstructFejer,
        leavesFromSamplesFFT,
        leavesFromSpectrumFFT
    };
})();

const TVF_CORE = Object.assign({
    tvf
}, TVF_SPECTRAL);
if (typeof window !== 'undefined')
    window.TVF_CORE = TVF_CORE;
if (typeof module !== 'undefined' && module.exports)
    module.exports = TVF_CORE;
