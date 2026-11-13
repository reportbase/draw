// THE SHAPES PANEL, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2,3,4,5,6", the fifth being "keep
// splitting draw.html").
//
// What it holds: the builder: each primitive's dials, the build panel (the shapes popover that was here went on 13 Nov 2026).
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. Unlike a lab's file it is not loaded when asked for: the page
// names it in a <script src> before its own script, since what is here is wired at the start. Edit it as you would
// the editor: the same voice, the same indent. The comment that introduced the block is still in draw.html, above
// the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['shapes-panel'] = function () {
            // THE SHAPES POPOVER IS GONE (13 Nov 2026, Tom: "move the shape toggle button to the top toolbar. remove the
            // shape button on top"). Its grid of a hundred tiles was the header's way to add a shape; the strip at the foot
            // does that now (THE STRIP ADDS SHAPES TOO, in draw.html), with the button that turns it there taking the
            // Shapes button's place on the bar. What is left here is the builder, which has its own button (#bBuild).
            const buildPop = $('buildPop'),
                buildBtn = $('bBuild');

            // ── the parametric row ──────────────────────────────────────────────
            // Some families are a handful of numbers wide: a polygon is its side count, a star
            // is its points and how deep they cut, a superformula is four exponents. Those do not
            // want a tile each — they want the numbers. Each entry declares its PARAMETER LIST
            // and how to build the spec from the values, and the spec is the same
            // {label, round, pts} shape PRIMITIVES holds, so addPrimitive takes it directly.
            //
            // THE LIST IS ARBITRARY-LENGTH, and that is the change that let the last two in. The
            // table used to declare exactly `a` and `b` and the markup held exactly two slider
            // rows, so a family was admissible only if two numbers described it — which is why
            // the two most expressive families in the whole library were absent rather than
            // simplified. The rows are generated from this list now.
            //
            // Values are the REAL numbers, not integers scaled by 100 on the way in and divided
            // on the way out: a range input takes a fractional step perfectly well, and the old
            // encoding meant every `make` began by undoing it, which is three chances per family
            // to divide by the wrong hundred.
            // ── WHAT COUNT A FAMILY WANTS ────────────────────────────────────────
            // Two rules, and which one applies is a property of the family rather than a taste.
            //
            // A CORNERED family aligns. Leaves land at even arc length and a regular figure's
            // corners are at even arc length too, so they coincide exactly when the count divides
            // the corner count — and a corner sampled off its vertex is rounded off, which is the
            // one feature the figure exists to have. `alignTo` takes the nearest multiple to the
            // count we would otherwise have picked, so a hexagon gets 258 and a pentagon 255
            // rather than both getting 256 and one of them quietly losing its corners.
            //
            // A FIELD budgets. Its cost is set by how many closed curves it contains, not by how
            // finely any one of them is drawn, so the count scales with the population: about two
            // dozen leaves a loop, which is a hole you can still call round. The floor of 16 is
            // the hard bottom; this sits just above it so the budget is doing the work rather
            // than the floor.
            const alignTo = (target, m) => Math.max(m, Math.round(target / m) * m);
            const perLoop = (loops, each) => Math.max(256, Math.round(loops * (each || 24)));
            const FAMILIES = {
                polygon: {
                    params: [{
                        key: 'n',
                        label: 'sides',
                        min: 3,
                        max: 24,
                        step: 1,
                        val: 6
                    },
                    {
                        key: 'aspect',
                        label: 'aspect',
                        min: 0.3,
                        max: 1,
                        step: 0.01,
                        val: 1
                    }],
                    make: v => ({
                        label: v.n + '-gon',
                        round: false,
                        pts: () => poly(v.n, v.n % 2 ? Math.PI / 2 : Math.PI / v.n, 1, v.aspect)
                    }),
                    defaultN: v => alignTo(256, Math.round(v.n))
                },
                star: {
                    params: [{
                        key: 'n',
                        label: 'points',
                        min: 3,
                        max: 24,
                        step: 1,
                        val: 5
                    },
                    {
                        key: 'inner',
                        label: 'inner',
                        min: 0.1,
                        max: 0.9,
                        step: 0.01,
                        val: 0.42
                    }],
                    make: v => ({
                        label: v.n + '-point star',
                        round: false,
                        pts: () => star(v.n, v.inner)
                    }),
                    // Points AND notches: a star has twice its point count in corners.
                    defaultN: v => alignTo(256, 2 * Math.round(v.n))
                },
                superellipse: {
                    params: [{
                        key: 'power',
                        label: 'power',
                        min: 1.2,
                        max: 12,
                        step: 0.1,
                        val: 4
                    },
                    {
                        key: 'aspect',
                        label: 'aspect',
                        min: 0.3,
                        max: 1,
                        step: 0.01,
                        val: 1
                    }],
                    make: v => ({
                        label: 'superellipse',
                        round: true,
                        pts: () => superellipse(180, v.power).map(p => ({
                            x: p.x,
                            y: p.y * v.aspect
                        }))
                    }),
                    // Smooth at every power, so nothing to align to — but a high power is a rounded
                    // square whose corners carry harmonics far up, and 256 stops being generous.
                    defaultN: v => (v.power >= 6 ? 512 : 256)
                },
                gear: {
                    params: [{
                        key: 'teeth',
                        label: 'teeth',
                        min: 5,
                        max: 30,
                        step: 1,
                        val: 12
                    },
                    {
                        key: 'depth',
                        label: 'depth',
                        min: 0.05,
                        max: 0.45,
                        step: 0.01,
                        val: 0.26
                    }],
                    make: v => ({
                        label: v.teeth + '-tooth gear',
                        round: false,
                        pts: () => gear(v.teeth, v.depth)
                    }),
                    // gear() lays five vertices per tooth, so that is the number to divide.
                    defaultN: v => alignTo(256, 5 * Math.round(v.teeth))
                },
                rose: {
                    // depth 1 is the true rose, through the origin; below that the petals lift off
                    // it and the curve relaxes into a lobed ring.
                    params: [{
                        key: 'petals',
                        label: 'petals',
                        min: 2,
                        max: 12,
                        step: 1,
                        val: 5
                    },
                    {
                        key: 'depth',
                        label: 'depth',
                        min: 0.1,
                        max: 1,
                        step: 0.01,
                        val: 1
                    }],
                    make: v => ({
                        label: v.petals + '-petal rose',
                        round: true,
                        pts: () => ringOf(280, t => {
                            const r = 1 - v.depth + v.depth * Math.cos(v.petals * t);
                            return {
                                x: r * Math.cos(t),
                                y: r * Math.sin(t)
                            };
                        })
                    }),
                    // A rose is one harmonic, so 2p+1 is all it strictly needs — but the petals want
                    // to be sampled alike, so the count is put on a multiple of the petal number.
                    defaultN: v => alignTo(256, Math.round(v.petals))
                },
                // ── the two the two-slider cap kept out ────────────────────────────
                // The superformula's four exponents are not four settings of one idea, they are
                // four different ideas — m is how many lobes, n1 how full, n2 and n3 the two
                // flanks — and picking two of them to expose would have been picking which half of
                // the family to make unreachable. The PRESET is a fifth control and the most
                // useful one: seven points in that space worth starting from, because the space is
                // large enough that dialling in from 5/0.6/1.7/1.7 finds mush more often than not.
                superformula: {
                    presets: SUPERFORMULA_PRESETS,
                    params: [{
                        key: 'm',
                        label: 'lobes',
                        min: 1,
                        max: 16,
                        step: 0.1,
                        val: 5
                    },
                    {
                        key: 'n1',
                        label: 'fullness',
                        min: 0.2,
                        max: 12,
                        step: 0.05,
                        val: 0.35
                    },
                    {
                        key: 'n2',
                        label: 'flank a',
                        min: 0.2,
                        max: 20,
                        step: 0.1,
                        val: 1.7
                    },
                    {
                        key: 'n3',
                        label: 'flank b',
                        min: 0.2,
                        max: 20,
                        step: 0.1,
                        val: 1.7
                    }],
                    make: v => ({
                        label: 'superformula m=' + (+v.m).toFixed(1),
                        round: true,
                        pts: () => superformulaPts(480, v)
                    }),
                    // m is not always an integer and its lobes are not always corners, so there is
                    // nothing honest to align to; the lobe count is what sets the demand.
                    defaultN: v => Math.max(256, alignTo(256, Math.max(1, Math.round(v.m))))
                },
                // And this one is the format's own shape: a radius that IS a Fourier series, so
                // the leaf array of the result is its spectrum and the leaf count it needs has a
                // closed form. The leaf slider below is doing something different here from
                // everywhere else — it is either meeting 2·max(h₁,h₂)+1 or deliberately not.
                harmonic: {
                    params: [{
                        key: 'h1',
                        label: 'term 1',
                        min: 1,
                        max: 12,
                        step: 1,
                        val: 3
                    },
                    {
                        key: 'a1',
                        label: 'amp 1',
                        min: 0,
                        max: 0.5,
                        step: 0.01,
                        val: 0.26
                    },
                    {
                        key: 'h2',
                        label: 'term 2',
                        min: 1,
                        max: 20,
                        step: 1,
                        val: 7
                    },
                    {
                        key: 'a2',
                        label: 'amp 2',
                        min: 0,
                        max: 0.35,
                        step: 0.01,
                        val: 0.09
                    },
                    {
                        key: 'phase',
                        label: 'phase',
                        min: 0,
                        max: 6.28,
                        step: 0.02,
                        val: 1.1
                    }],
                    make: v => ({
                        label: 'harmonic ' + v.h1 + '+' + v.h2,
                        round: true,
                        pts: () => harmonicPts(480, v)
                    }),
                    // The one family that can say exactly what it needs: 2h+1, rounded up to a
                    // multiple of the top term so its own period is sampled evenly.
                    defaultN: v => {
                        const h = Math.max(v.a1 > 0 ? Math.round(v.h1) : 0, v.a2 > 0 ? Math.round(v.h2) : 0);
                        return h ? alignTo(Math.max(256, 2 * h + 1), h) : 256;
                    }
                },
                // The only family here that returns LOOPS rather than points, and the only wire
                // one. Four numbers: how many lines each way, and where the camera is. Tilt is
                // the interesting dial — at 0 the parallels collapse to segments (a globe seen
                // exactly edge-on has no parallels, only chords) and at 90 they open into
                // concentric circles and the meridians collapse instead. The slider stops short
                // of both, because a segment is not a curve and the leaves cannot hold its ends.
                // See globeLoops for why the default spin is 12 and not 0.
                globe: {
                    params: GLOBE_PARAMS,
                    presets: GLOBE_PRESETS,
                    make: v => globeSpec(v),
                    // ⚠ NOT a budget — a globe is `wire`, so this is leaves PER LOOP as it always
                    // was. The bill is set by the flattest loop, and tilt is what flattens them.
                    defaultN: v => (v.tilt > 70 || v.tilt < 12 ? 512 : 256)
                },
                // ── THE COMPOUNDS ────────────────────────────────────────────────
                // Two loops and a ratio, which is the smallest compound there is and the right one
                // to start with: everything harder (a perforated plate, a sunflower head) is this
                // shape's argument repeated, and if the hole does not behave here it will not
                // behave there either.
                //
                // `loopAlloc` puts them on the budget rule — the leaf slider is the TOTAL across
                // both loops, split by arc length — so a hole is described as finely as the rim it
                // sits in and no finer. At the default 256 a donut with a 0.55 hole takes about
                // 165 leaves on the rim and 91 in the hole, which is the same leaf-per-millimetre
                // either side of the gap.
                //
                // ⚠ THE SOURCE DENSITY IS NOT THE LEAF COUNT. Each generator is sampled well above
                // any rung the slider offers (240 for a circle, 4 for a square — a square needs
                // four points and sampling it finer would only round its corners on the way in),
                // because that polyline is kept as the shape's REFERENCE and every later rung
                // change re-derives from it. See subpathFromLoop.
                donut: {
                    params: [{
                        key: 'hole',
                        label: 'hole',
                        min: 0.08,
                        max: 0.92,
                        step: 0.01,
                        val: 0.55,
                        hint: 'the inner radius as a fraction of the outer. At 0.9 it is a rim; near zero it is a disc with a pinprick, and the budget rule gives that pinprick its floor of leaves rather than its share.'
                    },
                    {
                        key: 'aspect',
                        label: 'aspect',
                        min: 0.3,
                        max: 1,
                        step: 0.01,
                        val: 1,
                        hint: 'squash both rings together, so the hole stays concentric.'
                    }],
                    make: v => ({
                        label: 'donut',
                        round: true,
                        loopAlloc: true,
                        loops: () => [ring(240, 1, v.aspect), ring(240, v.hole, v.hole * v.aspect)]
                    }),
                    defaultN: () => 256
                },
                frame: {
                    params: [{
                        key: 'hole',
                        label: 'opening',
                        min: 0.1,
                        max: 0.95,
                        step: 0.01,
                        val: 0.66,
                        hint: 'the inner square as a fraction of the outer — the border is what is left.'
                    },
                    {
                        key: 'aspect',
                        label: 'aspect',
                        min: 0.3,
                        max: 1,
                        step: 0.01,
                        val: 1
                    }],
                    // round:false — the corners are the shape, and they ring, which is the honest
                    // behaviour of a hinged figure and not something to smooth away here.
                    make: v => ({
                        label: 'frame',
                        round: false,
                        loopAlloc: true,
                        loops: () => [poly(4, Math.PI / 4, 1, v.aspect),
                        poly(4, Math.PI / 4, v.hole, v.hole * v.aspect)]
                    }),
                    // Eight corners over two loops, and the budget splits by length — a multiple of
                    // eight keeps both squares' corners on leaves once the split has been taken.
                    defaultN: () => alignTo(256, 8)
                },
                // ── THE FIELDS ───────────────────────────────────────────────────
                // Where a compound stops being two loops and becomes a POPULATION: a plate with
                // n² holes, a hexagon with 3k²+3k+1 cells. Everything the two-loop families needed
                // is still what these need — the budget, the even-odd run, an idempotent rebuild —
                // and the only thing that is new is the count.
                //
                // ⚠ WHAT THE COUNT COSTS, and it is worth seeing on the slider rather than being
                // protected from: sixty-four holes cannot be described in 256 leaves. The floor is
                // 16 a loop, so a 8×8 plate bills 1,040 whatever the budget says, and the panel
                // reports the real number on add rather than pretending the slider was obeyed. The
                // old tile spent 4,160 on the same picture (65 loops × 64), so the rule is already
                // four times cheaper — it is the FIELD that is expensive, not the accounting.
                perforated: {
                    params: [{
                        key: 'n',
                        label: 'holes',
                        min: 2,
                        max: 14,
                        step: 1,
                        val: 8,
                        hint: 'holes per side — the field is n². Past about ten this is where a compound stops being cheap: every hole is its own closed curve with its own floor of leaves.'
                    },
                    {
                        key: 'frac',
                        label: 'hole size',
                        min: 0.15,
                        max: 0.95,
                        step: 0.01,
                        val: 0.62,
                        hint: 'the hole diameter as a fraction of the lattice step. At 1 the holes touch and the plate becomes a mesh of ligaments; the cap sits just under that.'
                    }],
                    make: v => ({
                        label: Math.round(v.n) + '×' + Math.round(v.n) + ' perforated plate',
                        round: false,
                        loopAlloc: true,
                        draftLoops: true,
                        loops: () => perforated(Math.round(v.n), v.frac, 96)
                    }),
                    // n² holes plus the plate. At 14×14 that is 197 loops and an honest budget runs
                    // past four thousand leaves, which is why this family raises its own ceiling.
                    defaultN: v => perLoop(Math.round(v.n) * Math.round(v.n) + 1),
                    maxN: 6144
                },
                honeycomb: {
                    params: [{
                        key: 'rings',
                        label: 'rings',
                        min: 1,
                        max: 4,
                        step: 1,
                        val: 2,
                        hint: 'rings of cells around the middle one: 1, 2, 3, 4 gives 7, 19, 37, 61 cells. The cell size is derived from this so the field always fits its plate.'
                    },
                    {
                        key: 'fill',
                        label: 'cell size',
                        min: 0.45,
                        max: 0.97,
                        step: 0.01,
                        val: 0.82,
                        hint: 'each cell as a fraction of its lattice spacing. Near 1 the walls between cells vanish and what is left is a lattice of lines.'
                    }],
                    make: v => ({
                        label: 'honeycomb ×' + Math.round(v.rings),
                        round: false,
                        loopAlloc: true,
                        draftLoops: true,
                        loops: () => honeycomb(Math.round(v.rings), v.fill)
                    }),
                    // 3k²+3k+1 cells and the plate around them.
                    defaultN: v => {
                        const k = Math.round(v.rings);
                        return perLoop(3 * k * k + 3 * k + 2);
                    },
                    maxN: 4096
                },
                hexnut: {
                    // The sides slider is why this is not just "frame with six": a nut is a polygon
                    // with a ROUND hole, so the two loops disagree about what kind of figure they
                    // are — corners outside, a smooth curve inside — and that is the one case in the
                    // set where the budget has to reason about two different bills at once.
                    params: [{
                        key: 'sides',
                        label: 'sides',
                        min: 3,
                        max: 12,
                        step: 1,
                        val: 6
                    },
                    {
                        key: 'hole',
                        label: 'hole',
                        min: 0.08,
                        max: 0.9,
                        step: 0.01,
                        val: 0.5,
                        hint: 'the bore, as a fraction of the outer radius. The flats sit closer to the centre than the corners do, so a hole past about 0.86 on a hexagon breaks through them.'
                    }],
                    make: v => ({
                        label: Math.round(v.sides) + '-sided nut',
                        round: false,
                        loopAlloc: true,
                        loops: () => [poly(Math.round(v.sides), 0, 1, 1), ring(240, v.hole, v.hole)]
                    }),
                    defaultN: v => alignTo(256, Math.round(v.sides))
                }
            };
            const typeEl = $('shapeCustomType'),
                rowsEl = $('shapeCustomParams');
            const nEl = $('shapeCustomN'),
                vN = $('vShapeCustomN');
            const prev = $('shapeCustomPreview'),
                addEl = $('shapeCustomAdd');
            // Each family remembers where its sliders were left, so flicking between them to
            // compare does not reset the one you had just dialled in. Keyed by family AND by
            // parameter name rather than by position, so re-ordering a family's list — or
            // adding a parameter to it — cannot hand a slider somebody else's number.
            const held = {};
            const inputs = {}; // param key → the live <input>, rebuilt per family
            let fam = 'polygon';
            let presetEl = null;

            // The value a range input is showing, as a real number, formatted for the readout.
            // Derived from the step rather than declared per parameter: a step of 1 is an
            // integer and there is nothing to decide, and anything finer needs exactly as many
            // places as the step has.
            const fmtVal = (val, step) => {
                if (step >= 1)
                    return String(Math.round(val));
                const places = Math.max(0, Math.min(3, String(step).split('.')[1] ? String(step).split('.')[1].length : 2));
                return (+val).toFixed(places);
            };
            function values() {
                const out = {};
                for (const p of FAMILIES[fam].params)
                    out[p.key] = +inputs[p.key].value;
                return out;
            }
            function currentSpec() {
                const v = values();
                const spec = FAMILIES[fam].make(v);
                // The leaf count rides on the spec — addPrimitive passes it to loadDrawnStroke,
                // which uses it instead of the working rung. See the note there.
                spec.N = +nEl.value;
                // A multi-loop family reads its rung from `loopN` instead, since the loops branch
                // never reaches loadDrawnStroke. Same slider, same number, other door.
                if (spec.loops)
                    spec.loopN = +nEl.value;
                // …and the numbers travel WITH it, so the shape that arrives knows what made it.
                spec.build = {
                    fam,
                    v,
                    N: +nEl.value
                };
                return spec;
            }

            // ── THE LINK ────────────────────────────────────────────────────────
            // Lifted whole from the globe panel, which had it first and for a reason that was
            // never about globes: a family with parameters is not used by adding one and being
            // done, it is used by moving a slider and LOOKING, twenty times over. Behind an
            // adder that is twenty press-undo-reopen cycles. Linked, the sliders rebuild the
            // shape on the page and you simply watch it.
            //
            // WHAT MADE IT GENERAL was writing the numbers onto the shape (sp.build). The globe
            // panel had to keep a side map keyed by group id, could not carry it across a
            // reload, and fell back to a name regex plus an "adopted" warning that admitted the
            // first slider move would throw the other three numbers away. A record on the shape
            // has none of those problems: it survives save, undo and reload, it names its own
            // family, and there is nothing to guess.
            const heldN = {}; // family → a leaf count the user set by hand, if any
            let nTouched = false; // has the leaf slider been taken over for this family?
            let link = null; // { id } — the build record the sliders are driving
            let live = true; // is the link armed at all
            let dragging = false; // one history frame per drag, not one per pixel
            let pending = null; // rAF coalescing: a drag fires input faster than we rebuild
            const liveEl = $('shapeCustomLive');
            // The subpath carrying a given build id, or -1. The record lives on the group leader
            // for a multi-loop family, which is also the subpath the group is found by.
            function linkedIdx() {
                if (!link)
                    return -1;
                for (let i = 0; i < state.subpaths.length; i++) {
                    const sp = state.subpaths[i];
                    if (sp && sp.build && sp.build.id === link.id)
                        return i;
                }
                return -1;
            }
            function syncLive() {
                if (!liveEl)
                    return;
                const on = live && linkedIdx() >= 0;
                liveEl.classList.toggle('live-on', on);
                liveEl.textContent = on ? 'linked' : (live ? 'no shape' : 'unlinked');
                liveEl.title = on
                ? 'LINKED: the sliders are driving the shape on the canvas. Press to unlink.'
                : (live ? 'Armed, but there is no shape to drive. Press add, or select one you built.'
                : 'UNLINKED: the sliders only describe what `add` will make. Press to link.');
            }
            // Where the shape sits now, so a rebuild lands on top of it rather than back at the
            // placement a fresh add would choose. Bounding box rather than centroid-and-mean-
            // radius: it is what fitLoopsTo measures on the way in, so a shape rebuilt with the
            // same numbers comes back exactly where it was.
            //
            // ⚠ A ROTATION IS NOT RECOVERED, for the same reason it is not in the globe panel: a
            // box has no angle. Turn a built shape with the rotate grip and then move a slider,
            // and the rebuild arrives square. That is the price of rebuilding from numbers, and
            // it is why the families that can express their own turn (globe's spin) do.
            function placeOfGroup(idx) {
                const lead = state.subpaths[idx];
                if (!lead)
                    return null;
                const gid = lead.gid;
                let x0 = Infinity,
                    x1 = -Infinity,
                    y0 = Infinity,
                    y1 = -Infinity;
                for (const sp of state.subpaths) {
                    if (!sp)
                        continue;
                    if (gid != null ? sp.gid !== gid : sp !== lead)
                        continue;
                    // ⚠ THE REFERENCE, NOT THE LEAVES — and the difference compounds.
                    //
                    // fitLoopsTo scales a shape so the bounding box of the POLYLINE IT IS GIVEN has
                    // half-extent r. That polyline is what subpathFromLoop keeps as refX/refY. The
                    // LEAVES are an arc-length resampling of it, and a resampling lands ON the curve,
                    // never outside it: the extreme point — a polygon's vertex, the top of a circle —
                    // almost always falls between two leaves, so the leaf box is a hair smaller than
                    // the polyline box that produced it.
                    //
                    // Measuring the leaves therefore fed back a slightly-too-small r on every
                    // rebuild, and a slider drag rebuilds every animation frame. A fraction of a
                    // percent per frame, sixty frames a second, compounding: the shape visibly walked
                    // down to nothing while you dragged. Measuring the reference makes a rebuild
                    // IDEMPOTENT — same numbers in, same box out, however many times it runs — which
                    // is the property this loop needed all along and did not have.
                    //
                    // The reference is transformed by every gesture that moves the shape (see
                    // scaleActiveXY and its siblings), so a shape you drag or resize by hand is still
                    // measured where it now is rather than where it was built.
                    const xs = sp.refX && sp.refX.length ? sp.refX : sp.leafX;
                    const ys = sp.refX && sp.refX.length ? sp.refY : sp.leafY;
                    if (!xs || !xs.length)
                        continue;
                    for (let k = 0; k < xs.length; k++) {
                        if (xs[k] < x0)
                            x0 = xs[k];
                        if (xs[k] > x1)
                            x1 = xs[k];
                        if (ys[k] < y0)
                            y0 = ys[k];
                        if (ys[k] > y1)
                            y1 = ys[k];
                    }
                }
                if (!isFinite(x0))
                    return null;
                const r = Math.max((x1 - x0) / 2, (y1 - y0) / 2);
                return r > 1e-9 ? {
                    cx: (x0 + x1) / 2,
                    cy: (y0 + y1) / 2,
                    r
                } : null;
            }
            // ── rebuild in place ────────────────────────────────────────────────
            // ONE PATH, and the globe panel's argument for that holds for every family: the
            // POINT COUNT changes with the sliders (a 6-gon is not a 7-gon with a moved vertex,
            // parallels 5 → 6 is a new loop), so there is no in-place leaf edit that covers the
            // parameters. Two paths — cheap for the continuous ones, expensive for the counts —
            // would put a bug in the seam. Throw it away, build it again, same place, same paint.
            function rebuildLinked(v, push, draft) {
                const at = linkedIdx();
                if (at < 0) {
                    link = null;
                    syncLive();
                    return false;
                }
                const lead = state.subpaths[at];
                const place = placeOfGroup(at);
                if (!place)
                    return false;
                const gid = lead.gid;
                const rec = {
                    fam,
                    v,
                    N: +nEl.value,
                    id: link.id
                };
                const style = {
                    stroke: lead.stroke || null,
                    strokeOpacity: lead.strokeOpacity != null ? lead.strokeOpacity : null,
                    lineStyle: lead.lineStyle || null, // dashes and arrowheads (LINE STYLE)
                    lineWidth: lead.lineWidth != null ? lead.lineWidth : null,
                    smoothing: lead.smoothing != null ? lead.smoothing : null
                };
                const fill = lead.fill ? {
                    color: lead.fill.color,
                    opacity: lead.fill.opacity
                } : null;
                const spec = FAMILIES[fam].make(v);
                const N = Math.max(3, +nEl.value);
                // `draft` coarsens the SOURCE polyline the leaves are resampled from — not the leaf
                // count — so a shape mid-drag is a hair rougher and is replaced by the full one the
                // moment the finger comes off. It is the difference between a drag that keeps up
                // and one that queues behind the pointer.
                // ⚠ DECIMATE BEFORE FITTING, NEVER AFTER. Dropping every other point of an
                // already-fitted loop can drop the very point that SET its bounding box, so the
                // stored reference comes out smaller than the r it was fitted to — and since the
                // next frame measures that reference, the shape walks downhill for as long as the
                // finger is moving. Thinning first and fitting the thinned loop makes the box exact
                // whichever path the frame took, so a draft frame and a final frame land on the
                // same size and the drag is stable.
                const loops0 = (spec.loops ? spec.loops() : [spec.pts()])
                .map(w => (draft && w.length > 256) ? w.filter((_, i) => i % 2 === 0) : w);
                let loops = fitLoopsTo(loops0, place.r, place.cx, place.cy);
                // ── THINNING THE POPULATION, mid-drag ────────────────────────────────────
                // The point-thinning above is no help to a field: a perforated plate at 14×14 is
                // 197 loops of 96 points, and the cost is the COUNT. So a family that declares
                // `draftLoops` may have its interior loops sampled down while the finger is moving,
                // and gets all of them back the moment it stops.
                //
                // TWO CONDITIONS, and they are what makes this safe rather than merely fast:
                //   · AFTER the fit, never before. Dropping loops changes the union's bounding box,
                //     and the box is what the next frame measures — thin first and the shape walks
                //     downhill exactly as it did before the shrink was fixed.
                //   · LOOP 0 IS ALWAYS KEPT. In every family that opts in, loop 0 is the plate and
                //     the rest are punched out of it, so the outline that sets the extent survives
                //     and a draft frame is the same size as the final one. A wireframe must never
                //     declare this: a globe's extent is its loops, and there is no outer one.
                if (draft && spec.draftLoops && loops.length > 24) {
                    const keep = [loops[0]];
                    const stride = Math.ceil((loops.length - 1) / 23);
                    for (let i = 1; i < loops.length; i += stride)
                        keep.push(loops[i]);
                    loops = keep;
                }
                // The budget, split by arc length, exactly as addPrimitive does it — the two must
                // agree or a shape would change size class the first time a slider moved.
                const alloc = spec.loopAlloc ? allocateLeaves(loops, N) : null;
                // ⚠ THE RUN IS WHAT MAKES A HOLE A HOLE. Non-wire compounds are unioned even-odd by
                // their shared textRun, and a rebuild that dropped it would hand back a donut whose
                // hole had become a second filled disc — correct as two curves, wrong as a donut.
                // The lead's existing run id is reused rather than a fresh one taken, so the shape
                // keeps its identity across a rebuild the way the gid does.
                const runId = (!spec.wire && lead.textRun != null) ? lead.textRun : null;
                const made = [];
                for (let li = 0; li < loops.length; li++) {
                    const sp = subpathFromLoop(loops[li], alloc ? alloc[li] : N);
                    if (!sp)
                        continue;
                    for (const k in style)
                        if (style[k] != null)
                            sp[k] = style[k];
                    if (fill && !spec.wire)
                        sp.fill = {
                            color: fill.color,
                            opacity: fill.opacity
                        };
                    if (runId != null)
                        sp.textRun = runId;
                    if (gid != null) {
                        sp.gid = gid;
                        sp.groupLead = false;
                    }
                    made.push(sp);
                }
                if (!made.length)
                    return false;
                made[0].build = rec;
                made[0].gname = (typeof cleanGroupName === 'function') ? cleanGroupName(spec.label) : null;
                if (gid != null)
                    made[0].groupLead = true;
                // Every member of the old group goes; a single shape is one splice. Collected first
                // so the indices do not move under the removal.
                const idx = [];
                for (let i = 0; i < state.subpaths.length; i++) {
                    const sp = state.subpaths[i];
                    if (gid != null ? sp.gid === gid : i === at)
                        idx.push(i);
                }
                const insertAt = idx[0];
                for (let k = idx.length - 1; k >= 0; k--)
                    state.subpaths.splice(idx[k], 1);
                state.subpaths.splice(insertAt, 0, ...made);
                rebuildSignalSelect();
                const set = new Set();
                for (let k = 0; k < made.length; k++)
                    set.add(insertAt + k);
                applyShapeSelection(set, insertAt);
                updateStatus();
                drawAll();
                if (push) {
                    pushHistory();
                    scheduleSave();
                }
                return true;
            }
            // Adopt whatever is selected, if this panel (or a past session of it) made it. Called
            // when the popover opens: select a shape you built, open the panel, and the sliders
            // are already showing its numbers.
            function relinkToSelection() {
                const sel = (typeof selectedIndices === 'function') ? selectedIndices() : [];
                for (const i of sel) {
                    const sp = state.subpaths[i];
                    const rec = sp && sp.build;
                    if (!rec || !FAMILIES[rec.fam])
                        continue;
                    link = {
                        id: rec.id
                    };
                    loadFamily(rec.fam, rec.v);
                    if (rec.N && nEl)
                        nEl.value = String(rec.N);
                    if (typeEl)
                        typeEl.value = rec.fam;
                    syncCustom();
                    return true;
                }
                return false;
            }
            function syncCustom(writeThrough) {
                const f = FAMILIES[fam];
                const v = values();
                for (const p of f.params) {
                    const out = rowsEl.querySelector('[data-num="' + p.key + '"]');
                    if (out)
                        out.textContent = fmtVal(v[p.key], p.step);
                }
                held[fam] = v;
                // ── THE LEAF COUNT FOLLOWS THE FAMILY UNTIL YOU TAKE IT ──────────────────
                // It used to hold whatever number it was left at, which is wrong in both
                // directions at once: 256 is wasteful on a hexagon and nowhere near enough for a
                // 14×14 plate, and the panel knew which family was on screen the whole time.
                //
                // So each family answers for its own count, and it answers CONTINUOUSLY — change
                // the sides of a polygon and the suggestion follows, because the number a cornered
                // family wants depends on the corner count and a stale alignment is exactly the
                // silent failure this is here to prevent.
                //
                // Until you touch the slider. Then it is yours, remembered per family, and nothing
                // moves it again until you switch families or press `auto`. A suggestion that
                // overrides a deliberate choice is not a suggestion.
                if (!nTouched && typeof f.defaultN === 'function') {
                    const want = Math.max(+nEl.min, Math.min(+nEl.max, Math.round(f.defaultN(v))));
                    if (+nEl.value !== want)
                        nEl.value = String(want);
                }
                if (vN)
                    vN.textContent = String(+nEl.value);
                const spec = currentSpec();
                // 104 of the preview's 108px, so the drawing fills the box it was given and the
                // remaining 4 are the stroke's own width.
                prev.innerHTML = tileSvg(spec, 104);
                prev.title = 'add ' + spec.label;
                prev.setAttribute('aria-label', 'add ' + spec.label);
                // A PRESET STOPS CLAIMING TO BE THE SHAPE the moment a slider moves off it. It is
                // a starting point, not a mode, and leaving "starfish" selected under numbers that
                // are no longer the starfish is the list telling a lie about the picture.
                if (presetEl && f.presets) {
                    const p = f.presets[presetEl.value];
                    const same = p && Object.keys(p).every(k => Math.abs((v[k] == null ? NaN : v[k]) - p[k]) < 1e-9);
                    if (!same)
                        presetEl.value = '';
                }
                if (writeThrough && live && link) {
                    // Coalesce: a slider drag fires input far faster than a rebuild, and servicing
                    // every event would queue frames behind the pointer.
                    if (pending)
                        cancelAnimationFrame(pending);
                    pending = requestAnimationFrame(() => {
                        pending = null;
                        rebuildLinked(v, false, dragging);
                    });
                }
                syncLive();
            }
            // A slider drag is ONE undo step, not one per pixel. pointerdown is the only event
            // that says a drag has started, and the frame worth undoing back to is the one before
            // it; `change` covers the keyboard, which never sends a pointer.
            function wireDragCommit(inp) {
                inp.addEventListener('pointerdown', () => {
                    dragging = true;
                });
                const settle = () => {
                    if (!dragging)
                        return;
                    dragging = false;
                    if (pending) {
                        cancelAnimationFrame(pending);
                        pending = null;
                    }
                    if (live && link)
                        rebuildLinked(values(), true);
                };
                inp.addEventListener('pointerup', settle);
                inp.addEventListener('pointercancel', settle);
                inp.addEventListener('change', settle);
            }
            // Build one row per parameter, plus a preset row for the families that have one.
            // Rebuilt on every family change rather than shown and hidden: the families have
            // different lengths, and a pool of rows to hide is more state than making four divs.
            function loadFamily(name, preset) {
                fam = FAMILIES[name] ? name : 'polygon';
                const f = FAMILIES[fam],
                    keep = preset || held[fam] || {};
                // A budget for a field is not a count for a contour: 65 loops at their 16-leaf
                // floor is already past a single shape's ceiling, so the range is the family's to
                // declare. Everything without an opinion keeps the old 1024.
                if (nEl)
                    nEl.max = String(f.maxN || 1024);
                // A number you set by hand for THIS family comes back; anything else defers to the
                // family's own suggestion again.
                nTouched = heldN[fam] != null;
                if (nTouched && nEl)
                    nEl.value = String(heldN[fam]);
                rowsEl.textContent = '';
                for (const k in inputs)
                    delete inputs[k];
                presetEl = null;
                if (f.presets) {
                    const row = document.createElement('div');
                    row.className = 'pop-row';
                    const lab = document.createElement('label');
                    lab.textContent = 'preset';
                    presetEl = document.createElement('select');
                    presetEl.className = 'bar-select';
                    presetEl.title = 'points in the family worth starting from — the space is large enough that dialling in from nothing usually finds mush';
                    presetEl.innerHTML = '<option value="">custom</option>'
                    + Object.keys(f.presets).map(k => '<option value="' + k + '">' + k + '</option>').join('');
                    presetEl.addEventListener('change', () => {
                        const p = f.presets[presetEl.value];
                        if (!p)
                            return;
                        // A preset writes only the parameters it names, so a family could carry one
                        // that sets three of four and leaves the fourth where you had it.
                        for (const k in p)
                            if (inputs[k])
                                inputs[k].value = String(p[k]);
                        // syncCustom's "is this still the preset" test passes by construction here,
                        // so the list keeps its name — which is the point of applying one.
                        syncCustom();
                        if (live && link)
                            rebuildLinked(values(), true);
                    });
                    row.appendChild(lab);
                    row.appendChild(presetEl);
                    rowsEl.appendChild(row);
                }
                for (const p of f.params) {
                    const row = document.createElement('div');
                    row.className = 'pop-row';
                    const lab = document.createElement('label');
                    lab.textContent = p.label;
                    // `hint` OR `title`. The two names are historical — GLOBE_PARAMS says hint, the
                    // families here say title — and reading only one of them meant the globe's four
                    // paragraphs (what a parallel is, why spin moves no parallel at all) were carried
                    // in the table and shown nowhere once its own panel was removed.
                    if (p.hint || p.title)
                        lab.title = p.hint || p.title;
                    const inp = document.createElement('input');
                    inp.type = 'range';
                    inp.min = p.min;
                    inp.max = p.max;
                    inp.step = p.step;
                    inp.value = String(keep[p.key] != null ? keep[p.key] : p.val);
                    inp.addEventListener('input', () => syncCustom(true));
                    wireDragCommit(inp);
                    const num = document.createElement('span');
                    num.className = 'num';
                    num.dataset.num = p.key;
                    row.appendChild(lab);
                    row.appendChild(inp);
                    row.appendChild(num);
                    rowsEl.appendChild(row);
                    inputs[p.key] = inp;
                }
                syncCustom();
            }
            if (typeEl && rowsEl && nEl && prev && addEl) {
                // Changing family DROPS THE LINK. The shape on the canvas is a polygon; the panel
                // is now describing a rose; rebuilding one into the other on the next slider move
                // would be the panel deciding to replace a shape you did not ask it to replace.
                // Press add to make the rose, and the link follows the new shape.
                typeEl.addEventListener('change', () => {
                    link = null;
                    loadFamily(typeEl.value);
                });
                // Touching the slider is what takes it — recorded before the sync so the sync does
                // not immediately put the suggestion back over the top of the number you just set.
                nEl.addEventListener('input', () => {
                    nTouched = true;
                    heldN[fam] = +nEl.value;
                    syncCustom(true);
                });
                wireDragCommit(nEl);
                // …and double-clicking the slider hands it back. The only way out otherwise is to
                // leave the family and return, which is a strange thing to have to know.
                nEl.addEventListener('dblclick', () => {
                    nTouched = false;
                    delete heldN[fam];
                    syncCustom(true);
                    if (live && link)
                        rebuildLinked(values(), true);
                    flashStatus('leaf count back to the family default');
                });
                const addCustom = () => {
                    const spec = currentSpec();
                    if (!addPrimitive(spec))
                        return;
                    // The shape that just arrived is the one the sliders now drive. Found by build id
                    // rather than by position, since a loops family lands as several subpaths.
                    let newest = null;
                    for (const sp of state.subpaths)
                        if (sp && sp.build && (!newest || sp.build.id > newest.id))
                            newest = sp.build;
                    link = newest ? {
                        id: newest.id
                    } : null;
                    syncLive();
                    // WHAT IT ACTUALLY COST. For one contour the slider is the answer and saying so
                    // would be noise. For a FIELD it is not: the per-loop floor can overrule the
                    // budget entirely — sixty-four holes bill their sixteen each whatever you asked
                    // for — and a number that is quietly not obeyed is worse than an expensive one
                    // you can see. Said once, on add, in the status line rather than in a panel.
                    if (spec.loopAlloc) {
                        const lead = state.subpaths.find(sp => sp && sp.build && link && sp.build.id === link.id);
                        const gid = lead ? lead.gid : null;
                        let loops = 0,
                            leaves = 0;
                        for (const sp of state.subpaths) {
                            if (!sp || !sp.leafX)
                                continue;
                            if (gid != null ? sp.gid !== gid : sp !== lead)
                                continue;
                            loops++;
                            leaves += sp.leafX.length;
                        }
                        if (loops > 1)
                            flashStatus(spec.label + ' — ' + loops + ' loops, ' + leaves.toLocaleString() + ' leaves'
                            + (leaves > +nEl.value * 1.15 ? ' (the ' + LOOP_ALLOC_FLOOR + '-leaf floor per loop overrules the budget here)' : ''));
                    }

                    // THE PANEL STAYS OPEN. It used to close on add, which is right for a one-way
                    // door and wrong now: the whole point of the link is the next twenty slider
                    // moves, and closing the panel to watch the shape you just made is the
                    // press-undo-reopen cycle this was built to end.
                    scheduleSave();
                };
                addEl.addEventListener('click', addCustom);
                prev.addEventListener('click', addCustom);
                prev.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        addCustom();
                    }
                });
                if (liveEl)
                    liveEl.addEventListener('click', () => {
                        live = !live;
                        if (live && !link)
                            relinkToSelection();
                        syncLive();
                    });
                loadFamily('polygon');
            }

            // ── OPENING THE BUILDER ─────────────────────────────────────────────
            // Own button, own popover. `openBuilder` is the single door — the toolbar press and
            // the double-click both come through it — so there is one place that decides what
            // "open" means and the two entrances cannot drift apart.
            //
            // Opening ADOPTS whatever you have selected, if this panel made it: the sliders come
            // up showing that shape's numbers rather than whatever they were last left at. This
            // is the moment to ask, because it is the only one where the panel is certainly about
            // to be used and the selection is certainly what the hand meant.
            function openBuilder(force) {
                if (!buildPop || !buildBtn)
                    return false;
                const open = buildPop.classList.contains('open');
                closeAllPops();
                if (open && !force)
                    return false; // a second press closes it
                buildPop.classList.add('open');
                placePop(buildPop, buildBtn);
                if (linkedIdx() < 0)
                    link = null;
                relinkToSelection();
                syncCustom();
                return true;
            }
            if (buildBtn)
                buildBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    openBuilder(false);
                });


            // ── THE DOUBLE-CLICK DOOR ───────────────────────────────────────────
            // A double-click on a shape means "let me at this thing". For a drawn or imported
            // shape that is the leaves, and edit mode is the answer. For a shape that was BUILT,
            // the leaves are downstream of six numbers — moving one by hand is editing the output
            // of a formula, and the next slider drag throws the edit away without asking. So the
            // parameters are what a double-click opens, and edit mode is not entered at all.
            //
            // Published rather than wired here: the canvas owns its own gestures, and this file
            // has no business adding a second dblclick listener that races the first.
            // The harness drives this the way a finger does — the same contract the globe panel
            // published, now that the builder is the only panel of this kind. Exposing the
            // internals rather than the DOM would let a test pass while the wiring was broken, so
            // these are the same functions the buttons call.
            __buildPanel = {
                get link() {
                    return link;
                },
                get live() {
                    return live;
                },
                get family() {
                    return fam;
                },
                values,
                open: openBuilder,
                rebuild: rebuildLinked,
                relink: relinkToSelection,
                sync: syncCustom
            };
            window.__buildDblClick = function(spIndex) {
                const sp = state.subpaths[spIndex];
                const rec = sp && sp.build;
                if (!rec || !FAMILIES[rec.fam])
                    return false; // not ours — let edit mode have it
                link = {
                    id: rec.id
                };
                live = true;
                loadFamily(rec.fam, rec.v);
                if (rec.N && nEl)
                    nEl.value = String(rec.N);
                if (typeEl)
                    typeEl.value = rec.fam;
                syncCustom();
                openBuilder(true);
                return true;
            };
};
