// THE CHECKSUM PANEL, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2", the first "keep splitting draw.html").
//
// What it holds: the checksum panel (#checksumPanel) and the button that is its whole control.
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. The page names it in a <script src> before its own script. Edit
// it as you would the editor: the same voice, the same indent. The comment that introduced the block is still in
// draw.html, above the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['checksum-panel'] = function () {
            const panel = $('checksumPanel');
            if (!panel)
                return;
            const btn = $('bChecksumEdit');

            const sync = () => {
                if (btn)
                    btn.classList.toggle('active', !!state.checksumPanel);
            };
            if (btn)
                btn.addEventListener('click', () => {
                    setEditPanel(state.checksumPanel ? null : 'checksum');
                    sync();
                    drawAll();
                    flashStatus(state.checksumPanel
                    ? 'checksum panel — Σ(i−c), and the held and assigned values it sums'
                    : 'checksum panel off');
                });
            sync();
            window.__syncChecksumBtn = sync;

            // Which shape the panel is reading. The one under the cursor when that is one of
            // the isolated shapes, otherwise the first shape in the edit set — so the panel has
            // an answer the moment it opens rather than waiting for a hover.
            function cksShape() {
                const rd = (typeof headReadLeaf === 'function') ? headReadLeaf() : null;
                if (rd && state.editSet && state.editSet.has(rd.sp))
                    return rd.sp;
                if (state.editSet) {
                    for (const i of state.editSet) {
                        const sp = state.subpaths[i];
                        if (sp && sp.leafX && sp.leafX.length)
                            return i;
                    }
                }
                return -1;
            }

            // Symbols are integers and the register centre may be a half-integer, so i−c and
            // its sum can land on a half. Print the halves rather than rounding them away.
            const sgn = x => (x > 0 ? '+' : '') + (Number.isInteger(x) ? String(x) : x.toFixed(1));
            const fix = (x, d) => (isFinite(x) ? x.toFixed(d == null ? 4 : d) : '—');
            const set = (id, txt, cls) => {
                const n = $(id);
                if (!n)
                    return;
                n.textContent = txt;
                n.className = cls || '';
            };

            window.syncChecksumPanel = function syncChecksumPanel() {
                const on = !!state.checksumPanel && !!state.editMode;
                document.body.classList.toggle('checksum-on', on);
                if (!on)
                    return;

                // The two selects are driven FROM state every frame, never the other way round:
                // the tap switch is shared with the settings menu's own checkbox, and a panel that
                // held its own copy would drift the moment the other one was touched.
                const rule = state.cksRule || 'floor';
                const selR = $('cksRule');
                if (selR && selR.value !== rule)
                    selR.value = rule;
                const tap = state.hTwoTap ? '2' : '1';
                const selT = $('cksTap');
                if (selT && selT.value !== tap)
                    selT.value = tap;

                const sp = cksShape();
                const nVal = $('cksNVal');
                const R = sp < 0 ? null
                : rule === 'walked' ? baseRuleWalked(sp)
                : rule === 'bounded' ? boundedRuleRead(sp, apertureSigma())
                : baseRuleRead(sp);
                if (nVal)
                    nVal.textContent = R ? String(R.n) : '—';

                const extra = $('cksExtra');
                if (!R) {
                    for (const id of ['cksHeld', 'cksArr', 'cksAssigned', 'cksSym', 'cksSum', 'cksBits', 'cksQuiet', 'cksRailed'])
                        set(id, '—');
                    set('cksVerdict', 'no shape to read', '');
                    $('cksLeaf').textContent = 'leaf —';
                    if (extra)
                        extra.hidden = true;
                    return;
                }

                // ── The parts, at one leaf ───────────────────────────────────────────────
                const rd = (typeof headReadLeaf === 'function') ? headReadLeaf() : null;
                const k = (rd && rd.sp === sp && rd.k < R.n) ? rd.k : -1;
                if (k < 0) {
                    $('cksLeaf').textContent = 'leaf — · hover the shape';
                    for (const id of ['cksHeld', 'cksArr', 'cksAssigned', 'cksSym'])
                        set(id, '—');
                } else {
                    $('cksLeaf').textContent = 'leaf ' + k + ' of ' + R.n;
                    // The assigned value is the arrival times the rule's own ratio (v̂/v), which is
                    // the one form that is right for all three rules — the bounded rule's ignored
                    // leaves reconstruct to what the observer still believes, not to a level.
                    const assigned = R.arr[k] * R.ratio[k];
                    set('cksHeld', fix(R.held[k]));
                    set('cksArr', fix(R.arr[k]));
                    const ignored = R.sym[k] < 0;
                    set('cksAssigned', fix(assigned), ignored ? 'warn' : '');
                    set('cksSym', ignored ? 'ignored' : sgn(R.sym[k] - R.centre), ignored ? 'warn' : '');
                }

                // ── The sum, over the whole contour ──────────────────────────────────────
                const closed = Math.abs(R.defect) < 1e-9;
                set('cksSum', sgn(R.defect), closed ? 'ok' : 'warn');
                set('cksBits', fix(R.bits, 3));
                // OVER THE READS, not the leaves. The founding look is a calibration and emits no
                // symbol, so it is not in the numerator and must not be in the denominator either —
                // a silence share whose denominator counts a declaration is reporting the rule's
                // own initialisation as though the world had been quiet.
                set('cksQuiet', R.quiet + ' / ' + (R.reads != null ? R.reads : R.n));
                // Each rule names this differently because each fails differently: floor and
                // walked RAIL, bounded REFUSES. Same row, honest label.
                const rk = $('cksRailK');
                const rl = (R.railed != null) ? R.railed : (R.ignored != null ? R.ignored : null);
                if (rk)
                    rk.textContent = (R.ignored != null && R.railed == null) ? 'ignored' : 'railed';
                set('cksRailed', rl == null ? '—' : rl + ' / ' + R.n, rl ? 'cks-alarm' : '');

                let verdict;
                if (closed)
                    verdict = 'closes — the symbols telescoped and the reading came home';
                else if (rule === 'walked')
                    verdict = 'the first lap is a spiral: this is the climb from a false origin out to the real one';
                else if (state.hTwoTap)
                    verdict = 'a two-tap reference does not telescope — this drift is the rule’s cost, not an error';
                else
                    verdict = 'does not close';
                set('cksVerdict', verdict, closed ? 'ok' : 'warn');

                if (extra) {
                    if (rule === 'walked') {
                        extra.hidden = false;
                        $('cksExtraK').textContent = 'lap 2 Σ';
                        set('cksExtraV', sgn(R.defect2), Math.abs(R.defect2) < 1e-9 ? 'ok' : 'warn');
                    } else if (rule === 'bounded') {
                        extra.hidden = false;
                        $('cksExtraK').textContent = 'ignored';
                        set('cksExtraV', R.ignored + ' / ' + R.n, R.ignored ? 'warn' : 'ok');
                    } else {
                        extra.hidden = true;
                    }
                }
            };

            // ── The controls ─────────────────────────────────────────────────────────
            if ($('cksRule'))
                $('cksRule').addEventListener('change', e => {
                    state.cksRule = e.target.value;
                    drawAll();
                });
            // The tap switch is the app's own — the same flag the settings menu's checkbox sets —
            // so changing it here changes the reading everywhere, and that checkbox is brought
            // along rather than left showing the old answer.
            if ($('cksTap'))
                $('cksTap').addEventListener('change', e => {
                    state.hTwoTap = (e.target.value === '2');
                    const box = $('tHTwoTap');
                    if (box)
                        box.checked = state.hTwoTap;
                    if (typeof updateStatus === 'function')
                        updateStatus();
                    drawAll();
                });
            const stepN = f => () => {
                const cur = (typeof getActiveN === 'function') ? getActiveN() : state.N;
                const want = Math.max(4, Math.min(2048, Math.round(f(cur))));
                if (want !== cur)
                    setN(want);
            };
            if ($('cksNHalf'))
                $('cksNHalf').addEventListener('click', stepN(n => n / 2));
            if ($('cksNDouble'))
                $('cksNDouble').addEventListener('click', stepN(n => n * 2));
            if ($('cksNDown'))
                $('cksNDown').addEventListener('click', stepN(n => n - 8));
            if ($('cksNUp'))
                $('cksNUp').addEventListener('click', stepN(n => n + 8));
};
