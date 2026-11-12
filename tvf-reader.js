// tvf-reader.js — the .tvf reader: a curve file's text in, its curves' leaves out.
// ============================================================================
// THE SOURCE, and the editor's own lines. parseTvfText was a stretch of draw.html's script; it is cut out
// here unchanged (12 Nov 2026), line for line and at the editor's indent, as the SVG importer was the same
// day (svg-import.js) and the curve library before them (tvf-core.js). draw.html loads it with a plain
// <script src> before its own script, which works served and opened from disk alike. It reads nothing but
// the text it is given, so it also runs under Node, where it exports parseTvfText.
//
// Three consumers. draw.html loads it. The 3d repo's 3d.html and the games repo's games.html each carry a
// VERBATIM copy of the block below, from the TVF LOAD heading through the end of parseTvfText, between their
// "copied from draw.html, unchanged: tvf-reader" markers, and each has a draw-sync check that fails once
// its copy differs: after changing the block, copy it into both. The lines kept their indent so those
// copies are still this text. It was the last block either copied out of draw.html itself.
//
// What the editor does with the curves it returns (fitting them to the page: tvfFitToWorld; the corners a
// saved exact shape carries: EXACT SHAPES IN A .tvf) reads the editor's state and stays in draw.html.
'use strict';

        // ────────────────────────────────────────────────────────────────────
        // TVF LOAD
        // ────────────────────────────────────────────────────────────────────
        //
        // Parse a TVF curve file: header `TVF W H C`, then #meta lines, then
        // (H × C) data rows each of the form `<rung> <coeff_0> ... <coeff_{W-1}>`.
        //
        // We accept two shapes:
        //   - `TVF N 1 2`  → single closed curve, N leaves, 2 channels (x, y).
        //                    Each file = one subpath. This is the form the demo
        //                    currently writes.
        //   - `TVF N S 2`  → legacy multi-row form (deprecated but still readable).
        //                    Each row = one independent subpath, S subpaths total.
        //                    Treated as `S × (TVF N 1 2)` for everything downstream.
        //
        // Anything else (surface files, different channel counts) is rejected
        // with a useful error rather than guessed at.
        function parseTvfText(text) {
            // Walk the file reading TVF blocks until exhausted. A "block" is one
            // `TVF W H C` header plus its #meta tags plus its H × C data rows.
            // Three cases are handled by this single loop:
            //
            //   - One block, H=1: a single curve (the demo's current save format).
            //   - One block, H>1: a legacy multi-row bundle (TVF N S 2).
            //   - Multiple blocks: concatenated single-curve files (e.g. produced
            //     by `cat *.tvf > combined.tvf` from a multi-subpath save).
            //
            // Each row × channel pair becomes one subpath in the output array.
            // Per §2.4 row order: all channels of row 0 first, then row 1, etc.
            const lines = text.split(/\r?\n/);
            let i = 0;
            // Skip leading blanks
            while (i < lines.length && !lines[i].trim())
                i++;
            if (i >= lines.length)
                throw new Error('empty file');

            const subpaths = [];
            const allMeta = {};
            let blockCount = 0;

            while (i < lines.length) {
                // Skip blank lines AND comments between blocks. Comments matter: every multi-shape
                // document this app produces — the clipboard copy, and now the save — separates its
                // blocks with a `# --- next subpath ---` marker, and the header check below treats
                // anything that is not a header as junk and STOPS. So a 120-shape file loaded as one
                // shape and the other 119 were silently dropped. #meta lines are not skipped here;
                // they belong to a block and are read after its header.
                while (i < lines.length && (!lines[i].trim() || lines[i].trim().startsWith('#')))
                    i++;
                if (i >= lines.length)
                    break;

                // Expect a header
                const headerMatch = lines[i].trim().match(/^TVF\s+(\d+)\s+(\d+)\s+(\d+)\s*$/);
                if (!headerMatch) {
                    if (blockCount === 0) {
                        throw new Error('not a TVF file (expected "TVF W H C" header)');
                    }
                    // After the first block, anything else is allowed to be junk; stop.
                    break;
                }
                i++;
                const W = +headerMatch[1],
                    H = +headerMatch[2],
                    C = +headerMatch[3];
                if (C !== 2) {
                    throw new Error(`block ${blockCount + 1}: unsupported channel count ${C} (curves only)`);
                }
                if (W < 2 || H < 1) {
                    throw new Error(`block ${blockCount + 1}: bad dimensions ${W}×${H}`);
                }

                // Collect this block's #meta tags
                const blockMeta = {};
                while (i < lines.length && lines[i].trim().startsWith('#meta')) {
                    const tag = lines[i].trim().slice(5).trim();
                    const colon = tag.indexOf(':');
                    if (colon > 0) {
                        const k = tag.slice(0, colon).trim(),
                            v = tag.slice(colon + 1).trim();
                        allMeta[k] = v;
                        blockMeta[k] = v;
                    }
                    i++;
                }
                // Optional cosmetic fill for this block's subpaths (readers may ignore).
                let blockFill = null;
                if (blockMeta.fill) {
                    blockFill = {
                        color: blockMeta.fill,
                        opacity: blockMeta.fillOpacity != null ? +blockMeta.fillOpacity : 1
                    };
                }
                const blockStroke = blockMeta.stroke || null;
                const blockName = blockMeta.name || null;
                const blockNote = blockMeta.note || null;

                // Read H rows × C channels = H*C data lines.
                for (let row = 0; row < H; row++) {
                    const channels = [];
                    for (let ch = 0; ch < C; ch++) {
                        while (i < lines.length && !lines[i].trim())
                            i++;
                        if (i >= lines.length) {
                            throw new Error(`block ${blockCount + 1}: unexpected end of file at row ${row} channel ${ch}`);
                        }
                        const parts = lines[i++].trim().split(/\s+/);
                        if (parts.length < W + 1) {
                            throw new Error(`block ${blockCount + 1} row ${row} channel ${ch}: `
                            + `expected ${W} coefficients plus rung, got ${parts.length - 1}`);
                        }
                        // parts[0] is the rung (provenance); reconstruction uses raw values.
                        const vals = new Float64Array(W);
                        for (let k = 0; k < W; k++)
                            vals[k] = +parts[k + 1];
                        channels.push(vals);
                    }
                    subpaths.push({
                        leafX: channels[0],
                        leafY: channels[1],
                        fill: blockFill,
                        stroke: blockStroke,
                        gname: blockName,
                        note: blockNote
                    });
                }
                blockCount++;
            }

            if (subpaths.length === 0)
                throw new Error('no signals found in file');
            return {
                subpaths,
                meta: allMeta,
                blockCount
            };
        }

if (typeof module !== 'undefined' && module.exports)
    module.exports = { parseTvfText };
