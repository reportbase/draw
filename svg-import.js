// svg-import.js — the SVG importer: an SVG's text in, its subpaths as dense polylines with their paint out.
// ============================================================================
// THE SOURCE, and the editor's own lines. This was a stretch of draw.html's script (12 Nov 2026, Tom:
// "lets do more housekeeping"): it is cut out here unchanged, line for line and at the editor's indent, as
// the curve library was before it (tvf-core.js). draw.html loads it with a plain <script src> before its
// own script, which works served and opened from disk alike, so there is still no build step.
//
// It was the right piece to take first because it already stood alone. Everything below reads the
// browser (the DOM's geometry, getComputedStyle, DOMParser) and two names from outside: `tvf`, the curve
// library, read when arcLengthResample is called, and REF_SAMPLES, which the editor reads as well and so is
// declared here, once, above the block. Nothing in it reads the editor's state. A classic script, so its
// top-level names are globals the editor's script sees exactly as it saw them in its own closure.
//
// Two consumers. draw.html loads it. The 3d repo's 3d.html carries a VERBATIM copy of the block below,
// from `const NON_RENDERING_CONTAINERS` through the end of `smoothDrawPts` (with parseSvgToPolyline between),
// inside its "copied from draw.html" markers, and 3d's draw-sync check fails once the two differ: after
// changing the block, copy it into 3d.html. The lines kept their indent so that copy is still this text.
//
// The exact importer (parseSvgExact, loadSvgExact: an SVG's paths kept as corners and cubics, not traced)
// is the editor's own, reads its state, and stays in draw.html.
'use strict';

// How many samples a traced outline keeps as its reference (the dense polyline a shape's leaves are
// resampled from; tracePathElement below traces at twice this). The editor reads it too.
const REF_SAMPLES = 768;

        // ────────────────────────────────────────────────────────────────────
        // SVG PARSING
        // ────────────────────────────────────────────────────────────────────
        //
        // Architecture:
        //
        //   1. Mount the loaded SVG offscreen so the browser's geometry APIs
        //      (getTotalLength, getPointAtLength, getCTM) become available.
        //
        //   2. Expand <use> references in place by deep-cloning the target
        //      element and applying the use's own x/y/transform. SVGs from
        //      icon sets, font glyphs, and many illustration tools put shapes
        //      in <defs> and instantiate them via <use> — without expansion
        //      these are invisible to querySelectorAll('path,...').
        //
        //   3. For each <path>: use SVG 2's getPathData() (native in no browser;
        //      supplied by path-data-polyfill, inlined in <head>)
        //      to walk the path's commands and split into per-subpath fragments
        //      at every M command. Each fragment becomes its own temporary
        //      <path> element. This replaces the previous 4×-mean-step heuristic.
        //
        //   4. For non-path geometry (rect, circle, ellipse, polygon, polyline,
        //      line): trace as a single closed shape — these primitives are
        //      always single-subpath by definition.
        //
        //   5. Skip elements inside non-rendering containers (defs, symbol,
        //      clipPath, mask, pattern, marker — these hold templates, not
        //      directly-rendered geometry) and elements hidden by attribute or
        //      ancestor.
        //
        //   6. Collect every traced subpath with its CTM-mapped points and
        //      return them all. Each becomes an independent closed curve.
        //
        // Fallback: if getPathData isn't available (polyfill blocked AND not
        // Chrome), each <path> is treated as one element and the legacy
        // jump-detection heuristic runs as a backstop.

        // Elements whose contents are templates / utility references, not
        // directly rendered. Geometry inside these is skipped during tracing
        // because their content is instantiated elsewhere via <use>, fill, etc.
        const NON_RENDERING_CONTAINERS = new Set([
        'defs', 'symbol', 'clippath', 'mask', 'pattern', 'marker'
        ]);

        function isInsideNonRenderingContainer(el) {
            let node = el.parentNode;
            while (node && node.nodeType === 1) {
                const tag = node.nodeName.toLowerCase();
                if (NON_RENDERING_CONTAINERS.has(tag))
                    return true;
                node = node.parentNode;
            }
            return false;
        }

        function isHiddenByAncestor(el) {
            // Walk ancestors and the element itself, looking for display="none"
            // or visibility="hidden" on attribute or inline style. Attribute and
            // inline-style checks only — we deliberately don't consult
            // getComputedStyle because cloned subtrees lose external-stylesheet
            // context, which can both miss hidden elements (their CSS rules
            // aren't applied) and falsely hide elements (defs/symbol contents
            // default to display:none). Conservative under-hiding is better
            // than mistakenly dropping visible geometry.
            let node = el;
            while (node && node.nodeType === 1) {
                const display = node.getAttribute && node.getAttribute('display');
                const visibility = node.getAttribute && node.getAttribute('visibility');
                const styleAttr = node.getAttribute && node.getAttribute('style');
                if (display === 'none')
                    return true;
                if (visibility === 'hidden')
                    return true;
                if (styleAttr) {
                    if (/display\s*:\s*none/i.test(styleAttr))
                        return true;
                    if (/visibility\s*:\s*hidden/i.test(styleAttr))
                        return true;
                }
                node = node.parentNode;
            }
            return false;
        }

        // Expand <use href="#id"> elements in the tree by replacing each with
        // a deep-cloned copy of its referenced target, wrapped in a <g> that
        // carries the use's transform (so its position/scaling apply).
        //
        // Iterates until no new <use> appears, in case the referenced content
        // itself contains nested <use> elements. Bounded by a depth counter
        // to defend against cyclic references (which are invalid but possible).
        function expandUseReferences(svgRoot) {
            const SVG_NS = 'http://www.w3.org/2000/svg';
            const MAX_PASSES = 8; // generous; real depth is rarely > 2
            for (let pass = 0; pass < MAX_PASSES; pass++) {
                const uses = svgRoot.querySelectorAll('use');
                if (uses.length === 0)
                    return;
                let didExpand = false;
                for (const use of uses) {
                    // Resolve href (SVG 2 'href' or legacy xlink:href)
                    let href = use.getAttribute('href');
                    if (!href)
                        href = use.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                    if (!href)
                        href = use.getAttribute('xlink:href');
                    if (!href || href[0] !== '#')
                        continue; // external refs not supported
                    const id = href.slice(1);
                    // Look up the target. querySelector with [id="..."] is more reliable
                    // than getElementById on cloned subtrees that aren't in document scope.
                    const target = svgRoot.querySelector('[id="' + cssEscapeId(id) + '"]');
                    if (!target || target === use)
                        continue;
                    // Build the replacement: a <g> with the use's transform + position,
                    // containing a clone of the target element.
                    const g = document.createElementNS(SVG_NS, 'g');
                    // Apply x/y as a translate (combined with any existing transform).
                    const x = parseFloat(use.getAttribute('x') || '0') || 0;
                    const y = parseFloat(use.getAttribute('y') || '0') || 0;
                    const useTransform = use.getAttribute('transform') || '';
                    const transforms = [];
                    if (useTransform)
                        transforms.push(useTransform);
                    if (x !== 0 || y !== 0)
                        transforms.push(`translate(${x} ${y})`);
                    if (transforms.length)
                        g.setAttribute('transform', transforms.join(' '));
                    // Clone the target. If target is a <symbol> or <svg>, copy its
                    // children into the wrapper rather than the element itself (the
                    // wrapper plays the symbol's role). Strip ids from clones so the
                    // tree doesn't end up with multiple elements sharing an id.
                    const targetTag = target.nodeName.toLowerCase();
                    function stripIds(node) {
                        if (node.nodeType !== 1)
                            return;
                        if (node.removeAttribute)
                            node.removeAttribute('id');
                        if (node.children)
                            for (const c of node.children)
                                stripIds(c);
                    }
                    if (targetTag === 'symbol' || targetTag === 'svg') {
                        for (const c of target.children) {
                            const clone = c.cloneNode(true);
                            stripIds(clone);
                            g.appendChild(clone);
                        }
                    } else {
                        const clone = target.cloneNode(true);
                        stripIds(clone);
                        g.appendChild(clone);
                    }
                    use.parentNode.replaceChild(g, use);
                    didExpand = true;
                }
                if (!didExpand)
                    return;
            }
        }

        // Minimal CSS.escape replacement for IDs containing odd characters.
        // We only use it for selector construction, never for setting IDs.
        function cssEscapeId(id) {
            return id.replace(/['"\\\]\[\(\)]/g, '\\$&');
        }

        // ────────────────────────────────────────────────────────────────────
        // FAST PATH FLATTENING
        // ────────────────────────────────────────────────────────────────────
        // getPointAtLength() is the single slowest API in the legacy loader: each
        // call forces the browser to re-walk the element's geometry, and the old
        // tracer called it REF_SAMPLES*2 (=1536) times PER subpath, on top of
        // inserting a temporary <path> into the live DOM for every subpath. On a
        // large SVG (hundreds–thousands of subpaths) that is hundreds of thousands
        // to millions of expensive DOM round-trips — the cause of the slow load.
        //
        // We already extract normalized path data (M/L/C/Z only) to do subpath
        // splitting. So flatten those cubics to a polyline directly in JS, apply
        // the path's CTM ourselves, and let the existing arc-length resampler
        // uniformize. This is the same output the old tracer produced (an arbitrary
        // dense CTM-applied polyline per subpath, re-resampled downstream) but with
        // zero getPointAtLength calls and zero DOM fragment churn — typically
        // 100–1000× faster. The getPointAtLength tracer remains as a fallback for
        // browsers without getPathData and for non-path primitives.

        // Adaptive cubic flatten (AGG flatness test). Pushes interior + end points
        // of one cubic into out{X,Y} (assumes P0 already pushed). tol2 is the
        // squared flatness tolerance in the path's local coordinate units.
        function flattenCubicInto(outX, outY, x0, y0, x1, y1, x2, y2, x3, y3, tol2, depth) {
            // Flatness: max squared distance of the control points from the P0–P3
            // chord. When small enough (or recursion capped), emit the endpoint.
            let ux = 3 * x1 - 2 * x0 - x3,
                uy = 3 * y1 - 2 * y0 - y3;
            let vx = 3 * x2 - x0 - 2 * x3,
                vy = 3 * y2 - y0 - 2 * y3;
            ux *= ux;
            uy *= uy;
            vx *= vx;
            vy *= vy;
            if (ux < vx)
                ux = vx;
            if (uy < vy)
                uy = vy;
            if (depth >= 18 || (ux + uy) <= 16 * tol2) {
                outX.push(x3);
                outY.push(y3);
                return;
            }
            // de Casteljau split at t = 0.5
            const x01 = (x0 + x1) * 0.5,
                y01 = (y0 + y1) * 0.5;
            const x12 = (x1 + x2) * 0.5,
                y12 = (y1 + y2) * 0.5;
            const x23 = (x2 + x3) * 0.5,
                y23 = (y2 + y3) * 0.5;
            const xa = (x01 + x12) * 0.5,
                ya = (y01 + y12) * 0.5;
            const xb = (x12 + x23) * 0.5,
                yb = (y12 + y23) * 0.5;
            const xm = (xa + xb) * 0.5,
                ym = (ya + yb) * 0.5;
            flattenCubicInto(outX, outY, x0, y0, x01, y01, xa, ya, xm, ym, tol2, depth + 1);
            flattenCubicInto(outX, outY, xm, ym, xb, yb, x23, y23, x3, y3, tol2, depth + 1);
        }

        // Flatten one subpath's normalized segments (M, then L/C/Z) into a dense
        // CTM-applied polyline. Returns { x, y, length } or null if degenerate.
        function flattenSubpathSegments(segs, ctm, tol2) {
            const lx = [],
                ly = []; // local-space flattened points
            let cx = 0,
                cy = 0,
                startX = 0,
                startY = 0;
            let started = false;
            for (const s of segs) {
                const t = s.type,
                    v = s.values;
                if (t === 'M') {
                    cx = v[0];
                    cy = v[1];
                    startX = cx;
                    startY = cy;
                    lx.push(cx);
                    ly.push(cy);
                    started = true;
                } else if (t === 'L') {
                    cx = v[0];
                    cy = v[1];
                    lx.push(cx);
                    ly.push(cy);
                } else if (t === 'C') {
                    if (!started) {
                        cx = 0;
                        cy = 0;
                        startX = 0;
                        startY = 0;
                        lx.push(0);
                        ly.push(0);
                        started = true;
                    }
                    flattenCubicInto(lx, ly, cx, cy, v[0], v[1], v[2], v[3], v[4], v[5], tol2, 0);
                    cx = v[4];
                    cy = v[5];
                } else if (t === 'Z' || t === 'z') {
                    // Close: the resampler wraps, so we don't duplicate the start point.
                    cx = startX;
                    cy = startY;
                }

            }
            // normalized data contains no other segment types
            const M = lx.length;
            if (M < 2)
                return null;
            const X = new Float64Array(M),
                Y = new Float64Array(M);
            let length = 0;
            for (let i = 0; i < M; i++) {
                let px = lx[i],
                    py = ly[i];
                if (ctm) {
                    const wx = ctm.a * px + ctm.c * py + ctm.e;
                    const wy = ctm.b * px + ctm.d * py + ctm.f;
                    px = wx;
                    py = wy;
                }
                X[i] = px;
                Y[i] = py;
                if (i > 0)
                    length += Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]);
            }
            return {
                x: X,
                y: Y,
                length
            };
        }

        // Fast trace of a <path>: one getPathData call, one getCTM call, all
        // flattening in JS. Returns an array of { x, y, length, closed } subpaths,
        // or null if getPathData is unavailable/failed (caller falls back to the
        // getPointAtLength tracer).
        function flattenPathFast(pathEl) {
            if (typeof pathEl.getPathData !== 'function')
                return null;
            let segments;
            try {
                segments = pathEl.getPathData({
                    normalize: true
                });
            }
            catch (_) {
                return null;
            }
            if (!segments || segments.length === 0)
                return null;

            // CTM includes the element's own transform plus all ancestor transforms —
            // identical to what the old per-fragment trace inherited.
            let ctm = null;
            try {
                ctm = pathEl.getCTM();
            } catch (_) {
                ctm = null;
            }

            // Tolerance from the path's local bounding box so flattening density is
            // scale-correct regardless of viewBox units.
            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;
            for (const s of segments) {
                const v = s.values;
                for (let i = 0; i + 1 < v.length; i += 2) {
                    const x = v[i],
                        y = v[i + 1];
                    if (x < minX)
                        minX = x;
                    if (x > maxX)
                        maxX = x;
                    if (y < minY)
                        minY = y;
                    if (y > maxY)
                        maxY = y;
                }
            }
            const diag = (isFinite(minX) && isFinite(minY))
            ? Math.hypot(maxX - minX, maxY - minY) : 1;
            const tol = Math.max(diag * PATH_TOL, 1e-9);
            const tol2 = tol * tol;

            // Split segments into subpaths at each M (mirrors splitPathIntoSubpaths,
            // but in pure JS — no DOM fragments).
            const out = [];
            let cur = null;
            let curClosed = false;
            const flush = () => {
                if (cur && cur.length) {
                    const traced = flattenSubpathSegments(cur, ctm, tol2);
                    if (traced) {
                        traced.closed = curClosed;
                        out.push(traced);
                    }
                }
            };
            for (const seg of segments) {
                if (seg.type === 'M') {
                    flush();
                    cur = [seg];
                    curClosed = false;
                }
                else {
                    if (!cur)
                        cur = [{
                            type: 'M',
                            values: [0, 0]
                        }];
                    cur.push(seg);
                    if (seg.type === 'Z' || seg.type === 'z')
                        curClosed = true;
                }
            }
            flush();
            return out.length ? out : null;
        }

        // ────────────────────────────────────────────────────────────────────
        // FAST PRIMITIVE FLATTEN (rect/circle/ellipse/line/polyline/polygon)
        // ────────────────────────────────────────────────────────────────────
        // The single biggest loader bottleneck on large SVGs: only <path> had a
        // JS fast-path (flattenPathFast). EVERY other primitive fell through to
        // tracePathElement, which fires REF_SAMPLES*2 (=1536) getPointAtLength()
        // calls PER element. A polygon/rect-heavy SVG (maps, CAD/data-viz exports,
        // icon sets) is N×1536 of the slowest path API on the main thread — i.e.
        // the freeze. These helpers compute the primitive's polyline directly in
        // JS with a single getCTM and zero getPointAtLength, exactly mirroring
        // flattenPathFast's coordinate handling (CTM applied here; fitSubpathsToWorld
        // flips y downstream).

        // Segments to approximate a circular/elliptic arc of radius r to chord
        // tolerance tol. n ≈ π·√(r / 2·tol). Clamped; everything is arc-length
        // resampled to REF_SAMPLES afterward, so this only needs to be dense
        // enough to not lose shape, not exact.
        // How many straight steps an arc of radius r gets, for a sagitta under `tol`. The
        // callers pass a tolerance as a FRACTION of the radius, so this is really "how round
        // should a round thing be" — see ARC_TOL for what that fraction is and why.
        function arcSegCount(r, tol) {
            if (!(r > 0) || !(tol > 0))
                return 64;
            const n = Math.ceil(Math.PI * Math.sqrt(r / (2 * tol)));
            return Math.max(24, Math.min(4096, n));
        }
        // ── HOW ROUND IS ROUND ───────────────────────────────────────────────────────
        // SVG's own primitives — circle, ellipse, the corners of a rounded rect — are flattened
        // by uniform steps, and the step count came from a tolerance of r/1000. Measured against
        // an analytically generated circle (RMS radial error, ‰ of radius, after the resample):
        //
        //     library circle, analytic          0.055
        //     SVG cubic path circle             0.096      ← adaptive bezier flattening
        //     SVG <circle> element, r/1000      0.276      ← uniform steps, and it showed
        //     SVG <circle> element, r/10000     0.018      ← after
        //
        // A circle drawn as four beziers came out three times rounder than the same circle
        // written as <circle>, which is the wrong way round: the primitive is the case where we
        // know the exact answer. r/10000 is 223 steps instead of 71 — a few hundred points on an
        // import that is about to be resampled anyway — and it does not merely catch the path
        // route up, it passes the analytic generator, which spends a fixed vertex count.
        //
        // So the accuracy ladder now reads: <circle> 0.018, our own primitives 0.055, an SVG
        // cubic path 0.096, a traced glyph 1.0, a traced colour emoji 1.0 with a hard floor
        // under it. Vector in, vector out, and the raster is the only step that loses anything.
        const ARC_TOL = 1e-4;
        // The same question for CUBICS, as a fraction of the path's own bounding diagonal. The
        // bezier flattener is adaptive (AGG's flatness test), so it already spends its points
        // where the curvature is; this only decides how fine "flat enough" is.
        //
        // LEFT AT 5e-4, and the reason is a measurement rather than caution. Tightening it to
        // 1e-4 moved the circle-drawn-as-four-cubics from 0.0959 ‰ to 0.0959 ‰ — not a rounding
        // difference, no difference at all — because the error there is not ours. Four cubics
        // are not a circle: the standard K = 0.5523 approximation is off by about 0.27 ‰ of the
        // radius by construction, and that is the floor a path can reach however finely we
        // sample it. The flattener is already well inside the source's own accuracy, and points
        // bought past that are points spent on nothing.
        const PATH_TOL = 5e-4;

        // Apply CTM to a local-space point list and measure perimeter. Returns
        // { x, y, length, closed } or null if degenerate. Same math as the tail
        // of flattenSubpathSegments.
        function finishLocalPoly(lx, ly, ctm, closed) {
            const M = lx.length;
            if (M < 2)
                return null;
            const X = new Float64Array(M),
                Y = new Float64Array(M);
            let length = 0;
            for (let i = 0; i < M; i++) {
                let px = lx[i],
                    py = ly[i];
                if (ctm) {
                    const wx = ctm.a * px + ctm.c * py + ctm.e;
                    const wy = ctm.b * px + ctm.d * py + ctm.f;
                    px = wx;
                    py = wy;
                }
                X[i] = px;
                Y[i] = py;
                if (i > 0)
                    length += Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]);
            }
            return {
                x: X,
                y: Y,
                length,
                closed: !!closed
            };
        }

        // Fast trace of a non-path primitive. Returns [{ x, y, length, closed }]
        // (single subpath) or null if the tag isn't a known primitive / is
        // degenerate (caller falls back to tracePathElement).
        function flattenPrimitiveFast(el, tag) {
            let ctm = null;
            try {
                ctm = el.getCTM();
            } catch (_) {
                ctm = null;
            }
            const num = (name, def) => {
                const v = parseFloat(el.getAttribute(name));
                return isFinite(v) ? v : def;
            };
            const lx = [],
                ly = [];
            let closed = true;

            if (tag === 'line') {
                lx.push(num('x1', 0), num('x2', 0));
                ly.push(num('y1', 0), num('y2', 0));
                closed = false;
            } else if (tag === 'polyline' || tag === 'polygon') {
                const raw = el.getAttribute('points') || '';
                const nums = raw.trim().split(/[\s,]+/).map(parseFloat).filter(v => isFinite(v));
                for (let i = 0; i + 1 < nums.length; i += 2) {
                    lx.push(nums[i]);
                    ly.push(nums[i + 1]);
                }
                closed = (tag === 'polygon');
            } else if (tag === 'rect') {
                const x = num('x', 0),
                    y = num('y', 0),
                    w = num('width', 0),
                    h = num('height', 0);
                if (w <= 0 || h <= 0)
                    return null;
                // rx/ry per SVG spec: missing one mirrors the other; clamp to half-extent.
                let rx = el.hasAttribute('rx') ? num('rx', 0) : NaN;
                let ry = el.hasAttribute('ry') ? num('ry', 0) : NaN;
                if (!isFinite(rx) && isFinite(ry))
                    rx = ry;
                if (!isFinite(ry) && isFinite(rx))
                    ry = rx;
                if (!isFinite(rx))
                    rx = 0;
                if (!isFinite(ry))
                    ry = 0;
                rx = Math.min(Math.max(rx, 0), w / 2);
                ry = Math.min(Math.max(ry, 0), h / 2);
                if (rx <= 0 || ry <= 0) {
                    lx.push(x, x + w, x + w, x);
                    ly.push(y, y, y + h, y + h);
                } else {
                    // Rounded rect: four quarter-ellipse corners, clockwise (SVG y-down).
                    const seg = arcSegCount(Math.max(rx, ry), Math.max(rx, ry) * ARC_TOL);
                    const arc = (cx, cy, a0, a1) => {
                        for (let s = 0; s <= seg; s++) {
                            const a = a0 + (a1 - a0) * s / seg;
                            lx.push(cx + rx * Math.cos(a));
                            ly.push(cy + ry * Math.sin(a));
                        }
                    };
                    arc(x + w - rx, y + ry, -Math.PI / 2, 0); // top-right
                    arc(x + w - rx, y + h - ry, 0, Math.PI / 2); // bottom-right
                    arc(x + rx, y + h - ry, Math.PI / 2, Math.PI); // bottom-left
                    arc(x + rx, y + ry, Math.PI, 1.5 * Math.PI); // top-left
                }
            } else if (tag === 'circle') {
                const cx = num('cx', 0),
                    cy = num('cy', 0),
                    r = num('r', 0);
                if (r <= 0)
                    return null;
                const seg = arcSegCount(r, r * ARC_TOL);
                for (let s = 0; s < seg; s++) {
                    const a = 2 * Math.PI * s / seg;
                    lx.push(cx + r * Math.cos(a));
                    ly.push(cy + r * Math.sin(a));
                }
            } else if (tag === 'ellipse') {
                const cx = num('cx', 0),
                    cy = num('cy', 0),
                    rx = num('rx', 0),
                    ry = num('ry', 0);
                if (rx <= 0 || ry <= 0)
                    return null;
                const seg = arcSegCount(Math.max(rx, ry), Math.max(rx, ry) * ARC_TOL);
                for (let s = 0; s < seg; s++) {
                    const a = 2 * Math.PI * s / seg;
                    lx.push(cx + rx * Math.cos(a));
                    ly.push(cy + ry * Math.sin(a));
                }
            } else {
                return null;
            }

            const traced = finishLocalPoly(lx, ly, ctm, closed);
            return traced ? [traced] : null;
        }

        // ────────────────────────────────────────────────────────────────────
        // PAINT RESOLUTION (import fill/stroke colors)
        // ────────────────────────────────────────────────────────────────────
        // Resolve an element's *rendered* fill/stroke via getComputedStyle (valid
        // only while the element is in the live DOM — tmpSvg is appended during
        // parse). This honors presentation attributes, <style> rules, inherited
        // paint on ancestor <g>, and currentColor, exactly as the browser draws it.
        // Output matches the shapes the rest of the app uses: fill = {color, opacity}
        // (or null), stroke = "<color>" (or null).
        function rgbToHex(r, g, b) {
            const h = n => ('0' + Math.max(0, Math.min(255, Math.round(n))).toString(16)).slice(-2);
            return '#' + h(r) + h(g) + h(b);
        }
        // Returns { hex, alpha } or null for none/transparent/gradient/pattern.
        function parsePaintColor(str) {
            if (!str)
                return null;
            str = str.trim().toLowerCase();
            if (str === 'none' || str === 'transparent' || str === '')
                return null;
            if (str.startsWith('url('))
                return null; // gradient/pattern — no single flat color
            let m = str.match(/rgba?\(([^)]+)\)/);
            if (m) {
                const parts = m[1].split(/[,\/\s]+/).filter(s => s.length);
                const r = parseFloat(parts[0]),
                    g = parseFloat(parts[1]),
                    b = parseFloat(parts[2]);
                if (!isFinite(r) || !isFinite(g) || !isFinite(b))
                    return null;
                let a = 1;
                if (parts[3] != null)
                    a = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
                return {
                    hex: rgbToHex(r, g, b),
                    alpha: isFinite(a) ? a : 1
                };
            }
            if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(str)) {
                if (str.length === 4)
                    str = '#' + str[1] + str[1] + str[2] + str[2] + str[3] + str[3];
                return {
                    hex: str,
                    alpha: 1
                };
            }
            return {
                hex: str,
                alpha: 1
            }; // named color etc. — canvas/SVG accept it as-is
        }
        function resolveElementPaint(el) {
            let cs;
            try {
                cs = getComputedStyle(el);
            } catch (_) {
                return {
                    fill: null,
                    stroke: null
                };
            }
            const clamp01 = v => Math.max(0, Math.min(1, v));
            const eo = parseFloat(cs.opacity);
            const elemOpacity = isFinite(eo) ? clamp01(eo) : 1;
            let fill = null;
            const fc = parsePaintColor(cs.fill);
            if (fc) {
                const fo = parseFloat(cs.fillOpacity);
                const fillOp = isFinite(fo) ? clamp01(fo) : 1;
                const opacity = clamp01(fc.alpha * fillOp * elemOpacity);
                if (opacity > 0)
                    fill = {
                        color: fc.hex,
                        opacity: +opacity.toFixed(3)
                    };
            }
            let stroke = null;
            const sc = parsePaintColor(cs.stroke);
            // Only keep a stroke if the element actually paints one (width > 0).
            const sw = parseFloat(cs.strokeWidth);
            if (sc && (!isFinite(sw) || sw > 0))
                stroke = sc.hex;
            return {
                fill,
                stroke
            };
        }

        function parseSvgToPolyline(svgText) {
            const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
            if (doc.querySelector('parsererror')) {
                throw new Error('SVG parse error — not valid XML/SVG');
            }
            const svgRoot = doc.documentElement;
            if (!svgRoot || svgRoot.nodeName.toLowerCase() !== 'svg') {
                throw new Error('not an SVG document (root: ' + (svgRoot ? svgRoot.nodeName : 'none') + ')');
            }
            const SVG_NS = 'http://www.w3.org/2000/svg';
            const tmpSvg = document.createElementNS(SVG_NS, 'svg');
            for (const attr of ['width', 'height', 'viewBox', 'preserveAspectRatio']) {
                if (svgRoot.hasAttribute(attr))
                    tmpSvg.setAttribute(attr, svgRoot.getAttribute(attr));
            }
            if (!tmpSvg.hasAttribute('width'))
                tmpSvg.setAttribute('width', '1000');
            if (!tmpSvg.hasAttribute('height'))
                tmpSvg.setAttribute('height', '1000');
            tmpSvg.style.cssText = 'position:absolute;left:-99999px;top:-99999px;pointer-events:none;visibility:visible;color:#000';
            for (const child of svgRoot.children)
                tmpSvg.appendChild(child.cloneNode(true));
            document.body.appendChild(tmpSvg);

            // ── Pre-pass: expand <use href="#id"> references in place. ──
            //
            // SVGs from icon sets, font glyphs, and many illustration tools store
            // shapes once in <defs> and instantiate them with <use>. The browser
            // renders these correctly, but querySelectorAll('path,...') doesn't
            // find <use> elements and the referenced shapes inside <defs> are
            // (correctly) filtered out by the "not rendered" check below. Without
            // expansion, the parser sees no geometry at all on use-heavy SVGs.
            //
            // We resolve each <use> by finding the target element, deep-cloning
            // it, applying the use's own x/y/transform, and replacing the <use>
            // with the clone. Doing this on the cloned tree (not the original)
            // means we can mutate freely.
            expandUseReferences(tmpSvg);

            try {
                // Collect all traceable subpaths from all visible elements.
                // Each entry: { x: Float64Array, y: Float64Array, length: number,
                //               source: string (tag for status), closed: boolean }
                const subpaths = [];
                let multiSubpathDetected = false;
                let totalElements = 0;

                const allGeom = tmpSvg.querySelectorAll('path,polygon,polyline,rect,circle,ellipse,line');
                for (const el of allGeom) {
                    totalElements++;
                    // Skip elements inside non-rendering containers (defs, symbol,
                    // clipPath, mask, pattern, marker — these hold templates referenced
                    // elsewhere, not directly-rendered content).
                    if (isInsideNonRenderingContainer(el))
                        continue;
                    // Skip elements that won't render due to display/visibility on the
                    // element or any ancestor. getComputedStyle doesn't always catch
                    // visibility set via attributes on parents in cloned subtrees, so
                    // we walk ancestors manually.
                    if (isHiddenByAncestor(el))
                        continue;

                    const tag = el.nodeName.toLowerCase();
                    // Resolve the element's rendered fill/stroke once; stamp it onto every
                    // subpath this element produces so imported SVGs keep their colors.
                    const paint = resolveElementPaint(el);
                    // Remember which element each contour came from, and how the author asked
                    // for it to be filled. A <path> that yields several closed contours IS a
                    // compound shape — a letter with a counter, a washer, a gear with a hub —
                    // and the caller needs the grouping to fill it as one even-odd region
                    // rather than as separate overlapping bodies.
                    // (The author's fill-rule is carried for the record. The renderer fills a run
                    //  even-odd; on a nested pair the two rules agree whenever the windings are
                    //  opposite, which is how every tool that emits nonzero holes writes them.)
                    const elemId = totalElements;
                    const fillRule = (el.getAttribute('fill-rule') || el.style.fillRule || '').toLowerCase() || null;
                    // WHAT THE FILE CALLS THIS ELEMENT. <title> and <desc> are SVG's own metadata and
                    // are what this editor writes on export, so a shape named here and saved comes
                    // back named. Read off the element itself first and then off an enclosing <g>,
                    // because a title belongs to a group at least as often as to a path — which is
                    // exactly the shape of the export above.
                    const firstChildText = (node, tagName) => {
                        for (const ch of (node.children || [])) {
                            if (ch.nodeName.toLowerCase() === tagName)
                                return ch.textContent || '';
                        }
                        return '';
                    };
                    const elMeta = (node, tagName) => {
                        // The element's own child first — a <path><title>…</title></path> is the
                        // tightest statement about this shape and outranks anything wrapping it.
                        const own = firstChildText(node, tagName);
                        if (own)
                            return own;
                        // Then out through enclosing <g>s only, and no further: a <title> on the ROOT
                        // <svg> is the name of the FILE, and letting it fall through to here would name
                        // every shape in a pasted cat "cat" fourteen times over. That title has its own
                        // reader — svgTitleOf, which the paste path uses to name the group.
                        for (let a = node.parentNode; a && a !== tmpSvg && a.nodeName
                        && a.nodeName.toLowerCase() === 'g'; a = a.parentNode) {
                            const up = firstChildText(a, tagName);
                            if (up)
                                return up;
                        }
                        return '';
                    };
                    const elemName = elMeta(el, 'title');
                    const elemNote = elMeta(el, 'desc');
                    const markStart = subpaths.length;
                    if (tag === 'path' && typeof el.getPathData === 'function') {
                        // FAST PATH: flatten cubics in JS, no getPointAtLength, no DOM
                        // fragments. Falls back to the legacy tracer if flattening fails.
                        const fast = flattenPathFast(el);
                        if (fast && fast.length) {
                            if (fast.length > 1)
                                multiSubpathDetected = true;
                            for (const traced of fast) {
                                traced.source = `path[${fast.length > 1 ? 'subpath' : 'single'}]`;
                                traced.fill = paint.fill;
                                traced.stroke = paint.stroke;
                                subpaths.push(traced);
                            }
                        } else {
                            // Legacy fallback: per-subpath splitting + getPointAtLength trace.
                            const subpathFragments = splitPathIntoSubpaths(el);
                            if (subpathFragments.length > 1)
                                multiSubpathDetected = true;
                            for (const frag of subpathFragments) {
                                const traced = tracePathElement(frag.el, frag.closed);
                                if (!traced)
                                    continue;
                                // Without getPathData the fragment may still be several contours the
                                // jump detector found; take all of them, so holes survive the fallback.
                                const parts = traced.runs || [traced];
                                if (parts.length > 1)
                                    multiSubpathDetected = true;
                                for (const part of parts) {
                                    part.source = `path[${(subpathFragments.length > 1 || parts.length > 1) ? 'subpath' : 'single'}]`;
                                    part.fill = paint.fill;
                                    part.stroke = paint.stroke;
                                    subpaths.push(part);
                                }
                            }
                        }
                    } else {
                        // Non-path primitive, or path with no getPathData (extreme legacy
                        // browser). Try the JS primitive fast-path first (rect/circle/
                        // ellipse/line/polyline/polygon) — direct geometry, zero
                        // getPointAtLength. Only genuinely unsupported cases (e.g. a <path>
                        // with no getPathData polyfill) fall to the slow tracer.
                        const fastPrim = (tag !== 'path') ? flattenPrimitiveFast(el, tag) : null;
                        if (fastPrim && fastPrim.length) {
                            for (const traced of fastPrim) {
                                traced.source = tag;
                                traced.fill = paint.fill;
                                traced.stroke = paint.stroke;
                                subpaths.push(traced);
                            }
                        } else {
                            const traced = tracePathElement(el, true);
                            if (traced) {
                                if (traced.multiSubpathDetected)
                                    multiSubpathDetected = true;
                                for (const part of (traced.runs || [traced])) {
                                    part.source = tag;
                                    part.fill = paint.fill;
                                    part.stroke = paint.stroke;
                                    subpaths.push(part);
                                }
                            }
                        }
                    }
                    for (let i = markStart; i < subpaths.length; i++) {
                        subpaths[i].elemId = elemId;
                        subpaths[i].elemParts = subpaths.length - markStart;
                        subpaths[i].fillRule = fillRule;
                        subpaths[i].name = elemName;
                        subpaths[i].note = elemNote;
                    }
                }

                if (subpaths.length === 0) {
                    const tagCounts = {};
                    for (const ch of tmpSvg.querySelectorAll('*')) {
                        const t = ch.nodeName.toLowerCase();
                        tagCounts[t] = (tagCounts[t] || 0) + 1;
                    }
                    const tagSummary = Object.entries(tagCounts).map(([k, v]) => k + '×' + v).slice(0, 8).join(', ');
                    throw new Error('no traceable geometry found. SVG contained: ' + (tagSummary || 'nothing'));
                }

                // Return ALL subpaths. The caller (loadSvg) is responsible for
                // fitting them together to a shared coordinate space and resampling
                // each to its own polyline.
                return {
                    subpaths: subpaths.map(s => ({
                        x: s.x,
                        y: s.y,
                        length: s.length,
                        source: s.source,
                        fill: s.fill || null,
                        stroke: s.stroke || null,
                        elemId: s.elemId,
                        elemParts: s.elemParts || 1,
                        fillRule: s.fillRule || null,
                        name: s.name || '',
                        note: s.note || ''
                    })),
                    totalElements,
                    multiSubpath: multiSubpathDetected || subpaths.length > 1,
                    subpathCount: subpaths.length,
                };
            } finally {
                document.body.removeChild(tmpSvg);
            }
        }

        // Split a <path> element into per-subpath fragments. Each fragment is a
        // temporary <path> element containing just the segments between two M
        // commands (inclusive of leading M, up to but not including the next M).
        // Z commands within a subpath are preserved.
        //
        // Mutating side effect: the temporary path elements are added to the
        // SAME parent as the source path so they inherit the same CTM. The
        // caller is responsible for tracing them and not for removing them
        // (they're cleaned up with the rest of tmpSvg).
        function splitPathIntoSubpaths(pathEl) {
            const SVG_NS = 'http://www.w3.org/2000/svg';
            let segments;
            try {
                // Normalized: only M, L, C, Z (everything else converted).
                // This means getTotalLength/getPointAtLength see only the simple
                // segment forms with no implementation differences.
                segments = pathEl.getPathData({
                    normalize: true
                });
            } catch (e) {
                // getPathData unavailable or failed — return the path as-is (single
                // fragment). The legacy jump-detector will handle multi-subpath
                // cases on this branch.
                return [{
                    el: pathEl,
                    closed: true
                }];
            }
            if (!segments || segments.length === 0)
                return [];

            // Walk segments and split at each M (except a leading M which starts
            // the first subpath).
            const fragments = [];
            let current = null;
            let currentClosed = false;

            function commit() {
                if (current && current.length > 0) {
                    // Build the d attribute for this fragment
                    const d = serializeSegments(current);
                    const frag = document.createElementNS(SVG_NS, 'path');
                    frag.setAttribute('d', d);
                    // CRITICAL: copy the source path's own transform attribute. The
                    // path's local transform applies to the path's `d` coordinates
                    // BEFORE any ancestor group transforms. getCTM() on the fragment
                    // accumulates ancestor transforms, but it won't synthesize a
                    // path-local transform we didn't include. Forgetting this leaves
                    // path-locally-transformed subpaths at wrong coordinates (often
                    // far off-canvas).
                    const ownTransform = pathEl.getAttribute('transform');
                    if (ownTransform)
                        frag.setAttribute('transform', ownTransform);
                    // Insert next to the source path so it inherits the same ancestor
                    // chain.
                    pathEl.parentNode.insertBefore(frag, pathEl.nextSibling);
                    fragments.push({
                        el: frag,
                        closed: currentClosed
                    });
                }
            }

            for (const seg of segments) {
                if (seg.type === 'M') {
                    // Commit the previous subpath (if any) and start a new one
                    commit();
                    current = [seg];
                    currentClosed = false;
                } else {
                    if (!current) {
                        // Path data without a leading M — start an implicit subpath at origin
                        current = [{
                            type: 'M',
                            values: [0, 0]
                        }, seg];
                    } else {
                        current.push(seg);
                        if (seg.type === 'Z' || seg.type === 'z') {
                            currentClosed = true;


                        }
                    }
                }
            }
            // Z does not terminate a subpath — the next M does — so we
            // don't commit here. But subsequent M will see currentClosed.
            // Commit the final subpath
            commit();
            return fragments;
        }

        // Serialize an array of {type, values} segments back into an SVG `d`
        // attribute string.
        function serializeSegments(segments) {
            const parts = [];
            for (const s of segments) {
                parts.push(s.type);
                if (s.values && s.values.length)
                    parts.push(s.values.join(' '));
            }
            return parts.join(' ');
        }

        // Trace a single SVG element via getTotalLength/getPointAtLength, apply
        // the CTM, and return arc-length-uniform samples. Also runs the legacy
        // jump-detector as a backstop in case the element still contains
        // multiple subpaths (only happens when getPathData is unavailable).
        //
        // Returns { x, y, length, multiSubpathDetected } or null if the element
        // has no length or no valid samples.
        function tracePathElement(el, isClosed) {
            if (typeof el.getTotalLength !== 'function')
                return null;
            let length;
            try {
                length = el.getTotalLength();
            } catch (_) {
                return null;
            }
            if (!isFinite(length) || length <= 0)
                return null;

            let ctm = null;
            try {
                ctm = el.getCTM();
            } catch (_) {
                ctm = null;
            }

            const RAW = REF_SAMPLES * 2;
            const rawX = new Float64Array(RAW);
            const rawY = new Float64Array(RAW);
            for (let i = 0; i < RAW; i++) {
                let pt;
                try {
                    pt = el.getPointAtLength((i / RAW) * length);
                } catch (_) {
                    return null;
                }
                if (ctm) {
                    rawX[i] = ctm.a * pt.x + ctm.c * pt.y + ctm.e;
                    rawY[i] = ctm.b * pt.x + ctm.d * pt.y + ctm.f;
                } else {
                    rawX[i] = pt.x;
                    rawY[i] = pt.y;
                }
            }

            // Legacy jump-detector backstop. With getPathData splitting, each
            // fragment is genuinely a single subpath and this runs over a clean
            // input — the path through here yields jumps.length === 0 and the
            // full sample array is kept. The backstop only does work when the
            // polyfill was unavailable.
            const stepDist = new Float64Array(RAW);
            let totalStepSum = 0;
            for (let i = 0; i < RAW; i++) {
                const j = (i + 1) % RAW;
                const d = Math.hypot(rawX[j] - rawX[i], rawY[j] - rawY[i]);
                stepDist[i] = d;
                totalStepSum += d;
            }
            const meanStep = totalStepSum / RAW;
            const jumpThreshold = meanStep * 4;
            const jumps = [];
            for (let i = 0; i < RAW; i++) {
                if (stepDist[i] > jumpThreshold)
                    jumps.push(i);
            }

            let usedX,
                usedY,
                multiSubpathDetected = false,
                runs = null;
            if (jumps.length === 0) {
                usedX = rawX;
                usedY = rawY;
            } else {
                multiSubpathDetected = true;
                const N_jumps = jumps.length;
                // Keep EVERY run, not just the longest. The old code returned the biggest
                // and threw the rest away, which is exactly wrong for a holed shape: a
                // donut's outer ring is the longest run and the hole is the discarded one,
                // so the fallback silently filled the hole in. Runs shorter than a handful
                // of samples are still dropped — those are trace noise, not contours.
                const MIN_RUN = 8;
                const all = [];
                let bestStart = 0,
                    bestLength = 0;
                for (let k = 0; k < N_jumps; k++) {
                    const startIdx = (jumps[k] + 1) % RAW;
                    const endIdx = jumps[(k + 1) % N_jumps];
                    const runLen = (endIdx - startIdx + RAW) % RAW + 1;
                    if (runLen > bestLength) {
                        bestLength = runLen;
                        bestStart = startIdx;
                    }
                    if (runLen < MIN_RUN)
                        continue;
                    const rx = new Float64Array(runLen),
                        ry = new Float64Array(runLen);
                    for (let i = 0; i < runLen; i++) {
                        const idx = (startIdx + i) % RAW;
                        rx[i] = rawX[idx];
                        ry[i] = rawY[idx];
                    }
                    all.push({
                        x: rx,
                        y: ry,
                        length: length * (runLen / RAW),
                        closed: isClosed
                    });
                }
                usedX = new Float64Array(bestLength);
                usedY = new Float64Array(bestLength);
                for (let i = 0; i < bestLength; i++) {
                    const idx = (bestStart + i) % RAW;
                    usedX[i] = rawX[idx];
                    usedY[i] = rawY[idx];
                }
                if (all.length > 1)
                    runs = all;
            }

            return {
                x: usedX,
                y: usedY,
                length,
                closed: isClosed,
                multiSubpathDetected,
                runs
            };
        }

        // Center and scale subpaths to fit a shared bounding box in [-1, 1]
        // (target radius 0.9 to leave margin). Each subpath is transformed by
        // the SAME affine, so their relative geometry is preserved.
        //
        // Input: array of { x: Float64Array, y: Float64Array, ... }
        // Output: array of { x: Float64Array, y: Float64Array, ... } with the
        // same length, but with coordinates in world space.
        function fitSubpathsToWorld(subpaths) {
            let minX = Infinity,
                maxX = -Infinity,
                minY = Infinity,
                maxY = -Infinity;
            for (const sp of subpaths) {
                for (let i = 0; i < sp.x.length; i++) {
                    if (sp.x[i] < minX)
                        minX = sp.x[i];
                    if (sp.x[i] > maxX)
                        maxX = sp.x[i];
                    if (sp.y[i] < minY)
                        minY = sp.y[i];
                    if (sp.y[i] > maxY)
                        maxY = sp.y[i];
                }
            }
            const cx = (minX + maxX) / 2,
                cy = (minY + maxY) / 2;
            const halfW = Math.max(1e-6, (maxX - minX) / 2),
                halfH = Math.max(1e-6, (maxY - minY) / 2);
            const scale = 0.9 / Math.max(halfW, halfH);
            return subpaths.map(sp => {
                const X = new Float64Array(sp.x.length);
                const Y = new Float64Array(sp.y.length);
                for (let i = 0; i < sp.x.length; i++) {
                    X[i] = (sp.x[i] - cx) * scale;
                    // Flip y: SVG y-down → world y-up
                    Y[i] = -(sp.y[i] - cy) * scale;
                }
                return Object.assign({}, sp, {
                    x: X,
                    y: Y
                });
            });
        }

        // Arc-length resample to N leaves on a closed polyline.
        // Delegated to tvf.js, which carries this function byte-for-byte including the
        // srcCoV gap statistic. Same §12 reading: the resample is the conjugation, and
        // using the raw parameterization as the leaf grid would be the substitution
        // that detonates (TB §15.3 δmaxN). Kept as a named function here so the call
        // sites in this file read exactly as they always did.
        function arcLengthResample(polyX, polyY, N) {
            return tvf.arcLengthResample(polyX, polyY, N);
        }

        // ────────────────────────────────────────────────────────────────────
        // LOAD
        // ────────────────────────────────────────────────────────────────────
        // Periodic moving-average smoothing of a hand-drawn stroke (loop wraps).
        function smoothDrawPts(pts, passes, radius) {
            let cur = pts.map(p => ({
                x: p.x,
                y: p.y
            }));
            const n = cur.length;
            if (n < 5 || passes <= 0)
                return cur;
            for (let pass = 0; pass < passes; pass++) {
                const next = new Array(n);
                for (let i = 0; i < n; i++) {
                    let sx = 0,
                        sy = 0,
                        c = 0;
                    for (let d = -radius; d <= radius; d++) {
                        const j = ((i + d) % n + n) % n;
                        sx += cur[j].x;
                        sy += cur[j].y;
                        c++;
                    }
                    next[i] = {
                        x: sx / c,
                        y: sy / c
                    };
                }
                cur = next;
            }
            return cur;
        }
