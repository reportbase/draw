// THE AI PANEL, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2,3,4,5,6", the fifth being "keep
// splitting draw.html").
//
// What it holds: the AI popover: draw from a description, a background, look and fix, animate it, change it, make a scene; the gateway
// call (apiCall, streamed), the prompts (SYS, SYS_ANIM, SYS_SCENE, ANIM_MORPH_FIELDS) and what lands a reply (animApply).
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. Unlike a lab's file it is not loaded when asked for: the page
// names it in a <script src> before its own script, since what is here is wired at the start. Edit it as you would
// the editor: the same voice, the same indent. The comment that introduced the block is still in draw.html, above
// the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['ai-panel'] = function () {
            const pop = $('aiPop'),
                btn = $('bAi');
            if (!pop || !btn)
                return;
            const promptEl = $('aiPrompt'),
                goBtn = $('aiGo'),
                modeEl = $('aiMode'),
                signInEl = $('aiSignIn'),
                modelEl = $('aiModel'),
                statusEl = $('aiStatus'),
                keyBox = $('aiKeyBox'),
                critBtn = $('aiCritique'),
                fixBtn = $('aiFix'),
                critEl = $('aiCrit');
            const MODEL_LS = 'tangent.aiModel';
            /* ── Signing in ──────────────────────────────────────────────────────────
                 Drawing goes through the `login` Worker, which holds the Anthropic key as
                 a secret. This page carries no credential — only a session token saying
                 who you are, sent as `Authorization: Bearer`. Not a cookie: the gateway is
                 a different origin from this page, so a cookie would be third-party.

                 Any key remembered from the old bring-your-own-key arrangement is deleted
                 on load. It cannot be used any more, and a live credential should not sit
                 in localStorage once nothing reads it. */
            const GATEWAY = 'https://login.tangent.workers.dev';
            const SESSION_LS = 'tangent.login.v1',
                OLD_KEY_LS = 'tangent.aiKey';
            let session = '',
                me = null;
            try {
                session = localStorage.getItem(SESSION_LS) || '';
                if (localStorage.getItem(OLD_KEY_LS)) {
                    localStorage.removeItem(OLD_KEY_LS);
                    console.warn('[ai] removed a stored Anthropic API key — sign in instead.');
                }
            } catch (_) {}
            function setSession(tok) {
                session = tok || '';
                try {
                    tok ? localStorage.setItem(SESSION_LS, tok) : localStorage.removeItem(SESSION_LS);
                } catch (_) {}
                me = null;
                syncAccount();
            }
            function syncAccount() {
                if (!signInEl)
                    return;
                if (!session) {
                    signInEl.textContent = 'sign in';
                    signInEl.title = 'Sign in to draw. Each account has a daily allowance.';
                    return;
                }
                const who = (me && me.user && (me.user.email || me.user.id)) || 'signed in';
                const q = me && me.quota;
                signInEl.textContent = who.split('@')[0] + (q ? ' · ' + q.remaining + ' left' : '') + '  (sign out)';
                signInEl.title = who + (q ? ' — ' + q.remaining + ' of ' + q.limit + ' drawings left today' : '') + '. Click to sign out.';
            }
            async function refreshMe() {
                if (!session) {
                    syncAccount();
                    return;
                }
                try {
                    const r = await fetch(GATEWAY + '/auth/me', {
                        headers: {
                            authorization: 'Bearer ' + session
                        }
                    });
                    if (r.status === 401) {
                        setSession(null);
                        return;
                    }
                    me = await r.json();
                } catch (_) {
                    me = null;
                }
                syncAccount();
            }
            /* The popup must open synchronously inside the click. Anything awaited first
                 ends the user gesture and the browser blocks it with no error at all. The
                 gateway picks the provider itself, so there is nothing to look up. */
            function signIn() {
                if (location.protocol === 'file:') {
                    setStatus('sign-in needs the page served over http(s) — a file:// page has no origin the gateway can trust', 'err');
                    return;
                }
                const back = location.href.split('#')[0];
                const url = GATEWAY + '/auth/login?redirect_uri=' + encodeURIComponent(back) + '&mode=popup';
                let w = null;
                try {
                    w = window.open(url, 'tangent-login', 'width=520,height=680,menubar=no,toolbar=no');
                } catch (_) {}
                if (!w || w.closed) {
                    setStatus('popup blocked — continuing sign-in in this tab');
                    location.href = GATEWAY + '/auth/login?redirect_uri=' + encodeURIComponent(back) + '&mode=redirect';
                    return;
                }
                const origin = (function() {
                    try {
                        return new URL(GATEWAY).origin;
                    } catch (_) {
                        return '';
                    }
                })();
                let done = false;
                const finish = () => {
                    if (done)
                        return;
                    done = true;
                    removeEventListener('message', onMsg);
                    clearInterval(poll);
                    refreshMe();
                };
                const onMsg = ev => {
                    if (ev.origin !== origin)
                        return; // only the gateway may hand us a session
                    const d = ev.data;
                    if (!d || d.type !== 'claude-gateway-auth')
                        return;
                    if (d.ok && d.token) {
                        setSession(d.token);
                        setStatus('signed in');
                    }
                    else
                        setStatus('sign-in failed: ' + (d.error || 'unknown error'), 'err');
                    finish();
                };
                addEventListener('message', onMsg);
                const poll = setInterval(() => {
                    if (w.closed)
                        finish();
                }, 500);
            }
            // A redirect-mode sign-in lands back here with the token in the fragment,
            // which browsers never send to a server. Take it and scrub the URL.
            (function captureRedirect() {
                let h = '';
                try {
                    h = location.hash || '';
                } catch (_) {
                    return;
                }
                if (!h || h.indexOf('claude_gateway_') < 0)
                    return;
                const p = new URLSearchParams(h.replace(/^#/, ''));
                const t = p.get('claude_gateway_token'),
                    e = p.get('claude_gateway_error');
                if (t)
                    setSession(t);
                p.delete('claude_gateway_token');
                p.delete('claude_gateway_error');
                const rest = p.toString();
                try {
                    window.history.replaceState(null, '', location.pathname + location.search + (rest ? '#' + rest : ''));
                } catch (_) {}
                if (e)
                    setStatus('sign-in failed: ' + e, 'err');
            })();
            let busy = false;
            // The last generation, remembered so vision refine can swap it out: the SVG
            // source the model wrote, the prompt it answered, how it was placed, and the
            // fileTag its shapes carry (the handle for finding and removing them later).
            let lastGen = null;

            // One door to the API for all three features (generate, critique, refine),
            // so the headers, error mapping and key handling can't drift apart.
            async function apiCall(payload) {
                // STREAMED (26 Oct 2026, Tom: '"animate it" request failed — HTTP 524'). A request that sends
                // nothing back for about 100 seconds is closed on the way by Cloudflare (HTTP 524), and an
                // answer to a picture plus a long brief can take longer than that to write. Streamed, the
                // reply arrives as it is written, so the line is never silent; the pieces are put back
                // together here into the same shape a plain reply has, and the callers read it as before.
                // (The 3d studio's describe-it streams through the same gateway for the same reason.)
                const res = await fetch(GATEWAY + '/v1/messages', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'anthropic-version': '2023-06-01',
                        authorization: 'Bearer ' + session,
                    },
                    // who you are; the key stays in the Worker
                    body: JSON.stringify(Object.assign({}, payload, { stream: true })),
                });
                // The gateway reports the allowance on every reply, so the button can show
                // what is left without a second round trip.
                const rem = res.headers.get('x-gateway-quota-remaining');
                if (rem != null) {
                    me = me || {
                        user: {},
                        quota: {}
                    };
                    me.quota = {
                        remaining: +rem,
                        limit: +(res.headers.get('x-gateway-quota-limit') || 0)
                    };
                    syncAccount();
                }
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    const apiMsg = data && data.error && data.error.message;
                    const type = data && data.error && data.error.type;
                    if (res.status === 401) {
                        setSession(null);
                        keyBox.open = true;
                        throw new Error('signed out — sign in again to keep drawing');
                    }
                    if (type === 'quota_exceeded')
                        throw new Error(apiMsg || 'daily allowance used up — it resets at midnight UTC');
                    if (res.status === 403)
                        throw new Error(apiMsg || 'this gateway will not serve this page');
                    if (res.status === 429)
                        throw new Error('too many requests — wait a moment and try again');
                    if (res.status === 524 || res.status === 504)
                        throw new Error('the request timed out on the way (HTTP ' + res.status + ') — try again, or ask for something a little smaller');
                    if (res.status === 529 || res.status === 503)
                        throw new Error('Claude is busy right now (HTTP ' + res.status + ') — try again in a minute');
                    throw new Error(apiMsg || ('request failed — HTTP ' + res.status));
                }
                if (!/event-stream/.test(res.headers.get('content-type') || ''))
                    return await res.json(); // a gateway that answered plainly after all
                const rd = res.body.getReader(),
                    dec = new TextDecoder();
                let buf = '',
                    text = '',
                    stop = null,
                    errMsg = null,
                    last = 0;
                for (;;) {
                    const { done, value } = await rd.read();
                    if (done)
                        break;
                    buf += dec.decode(value, { stream: true });
                    let i;
                    while ((i = buf.indexOf('\n\n')) >= 0) {
                        const ev = buf.slice(0, i);
                        buf = buf.slice(i + 2);
                        const line = ev.split('\n').find(l => l.startsWith('data:'));
                        if (!line)
                            continue;
                        let d;
                        try {
                            d = JSON.parse(line.slice(5));
                        } catch (_) {
                            continue;
                        }
                        if (d.type === 'content_block_delta' && d.delta && d.delta.type === 'text_delta')
                            text += d.delta.text;
                        else if (d.type === 'message_delta' && d.delta && d.delta.stop_reason)
                            stop = d.delta.stop_reason;
                        else if (d.type === 'error')
                            errMsg = (d.error && d.error.message) || 'the reply broke off';
                    }
                    const now = performance.now();
                    if (text && now - last > 400) {
                        last = now;
                        setStatus('writing… ' + (text.length / 1024).toFixed(1) + ' kB so far', 'busy');
                    }
                }
                if (errMsg)
                    throw new Error(/overload/i.test(errMsg) ? 'Claude is busy right now — try again in a minute' : errMsg);
                return { content: [{ type: 'text', text }], stop_reason: stop };
            }
            const textOf = data => (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
            function svgOf(text) {
                const a = text.indexOf('<svg'),
                    z = text.lastIndexOf('</svg>');
                if (a < 0 || z < 0)
                    throw new Error('the model returned no <svg> — try rephrasing the prompt');
                return text.slice(a, z + 6);
            }
            const imgBlock = b64 => ({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: b64
                }
            });
            // Require a key before any call; opens the key row and says so if absent.
            function ensureKey() {
                if (session)
                    return true;
                keyBox.open = true;
                setStatus('sign in first — the account row is just below', 'err');
                return false;
            }
            // The canvas as the model will see it: the artwork render (no editor chrome),
            // fitted, downscaled to ~768px so the image costs ~1k tokens instead of ~5k.
            function scenePngB64(maxPx) {
                const src = renderArtwork({
                    scale: 1,
                    fit: true
                });
                const big = Math.max(src.width, src.height) || 1;
                const s = Math.min(1, (maxPx || 768) / big);
                const c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(src.width * s));
                c.height = Math.max(1, Math.round(src.height * s));
                c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
                return c.toDataURL('image/png').split(',')[1];
            }

            // Restore the remembered model. Storage being unreadable is not an event.
            try {
                const m = localStorage.getItem(MODEL_LS);
                if (m) {
                    // A model remembered from a past visit may postdate the built-in list —
                    // the picker grows an option rather than silently snapping back.
                    if (![...modelEl.options].some(o => o.value === m)) {
                        const o = document.createElement('option');
                        o.value = o.textContent = m;
                        modelEl.appendChild(o);
                    }
                    modelEl.value = m;
                }
            } catch (_) {}

            function setStatus(msg, cls) {
                statusEl.textContent = msg || '';
                statusEl.className = 'ai-status' + (cls ? ' ' + cls : '');
            }
            if (signInEl)
                signInEl.addEventListener('click', () => {
                    session ? setSession(null) : signIn();
                });
            syncAccount();
            refreshMe();
            modelEl.addEventListener('change', () => {
                try {
                    localStorage.setItem(MODEL_LS, modelEl.value);
                } catch (_) {}
            });

            btn.addEventListener('click', () => {
                if (pop.classList.contains('open')) {
                    closeAllPops();
                    return;
                }
                closeAllPops();
                placePop(pop, btn);
                // No key yet → the panel opens ON the key row, because that is the only
                // move that does anything. With a key, the key row stays folded away.
                if (!session) {
                    keyBox.open = true;
                    setStatus('sign in below to enable generation');
                } else {
                    promptEl.focus();
                }
            });

            // What the drawing model is told. Every rule in here is a hard constraint of
            // parseSvgToPolyline, not taste: <text> would trace as nothing, url()/gradient
            // paint would resolve to no colour, and holes only survive when their
            // counter-contours live in the SAME <path> — that is what the even-odd
            // compound grouping keys on.
            const SYS = [
            'You are a vector illustrator for a polyline-based SVG editor. Reply with ONE complete <svg> document and NOTHING else — no markdown fences, no commentary before or after.',
            'Hard rules (the importer silently drops anything else):',
            '- Root: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">.',
            '- Only these elements: path, circle, ellipse, rect, polygon, polyline, line. No text, image, use, defs, style, script, filter, mask, clipPath, pattern or gradient.',
            '- Paint with plain hex colours in fill/stroke attributes only. No url(), no CSS classes, no opacity tricks — pick solid colours that already look mixed.',
            '- A shape with a hole (donut, letter O, eye) must be ONE <path> whose counter-contour is a second subpath in the same d attribute (even-odd).',
            '- Build the picture back-to-front from closed filled paths; use stroked open paths only for genuine line work (whiskers, stems, rigging).',
            'Craft: aim for 8–60 elements, generous margins inside the viewBox, and confident simplified forms — poster art, not photorealism. Curves beat polygons: prefer C/Q path segments over many tiny line segments.',
            ].join('\n');

            // The extra contract for "behind the scene": the model is handed a sketch of
            // the user's drawing on the SAME 1000-box it draws on, and its output slides
            // underneath at exactly those coordinates — so composition instructions can
            // be literal ("the shapes will be pasted on top of your work").
            const SYS_BG = [
            'This request is a BACKGROUND job. The user already has a drawing; you are painting the scenery that will sit BEHIND it.',
            'The user message includes a simplified <svg> sketch of that drawing, on the same 1000×1000 canvas you draw on. Your output is layered UNDERNEATH it at exactly these coordinates.',
            'Background rules:',
            '- Cover the whole canvas edge to edge — begin with a full-bleed backdrop shape (sky, water, wall) spanning 0,0 to 1000,1000.',
            '- Do NOT redraw, copy, outline or echo the sketched shapes. They will be pasted on top of your work; drawing them again doubles them.',
            '- Compose around them: place horizons, large masses and focal details so the existing shapes sit naturally in the scene, and keep the area directly behind them calmer so they stay readable.',
            '- Complement their palette, and push the background back in value — softer contrast than the foreground, so it reads as behind.',
            ].join('\n');

            // The square of world space the background will fill: the current drawing's
            // bounding box with a 35% margin (a backdrop that ends at the subject's
            // elbow is not a backdrop), or the visible view when the page is empty.
            function bgTargetRect() {
                let mnx = Infinity,
                    mny = Infinity,
                    mxx = -Infinity,
                    mxy = -Infinity,
                    any = false;
                for (const sp of state.subpaths) {
                    const X = sp.leafX || sp.refX,
                        Y = sp.leafY || sp.refY;
                    if (!X || !Y)
                        continue;
                    for (let i = 0; i < X.length; i++) {
                        any = true;
                        if (X[i] < mnx)
                            mnx = X[i];
                        if (X[i] > mxx)
                            mxx = X[i];
                        if (Y[i] < mny)
                            mny = Y[i];
                        if (Y[i] > mxy)
                            mxy = Y[i];
                    }
                }
                if (!any) {
                    const hR = state.hRun || 1,
                        v = viewRectUnits();
                    return {
                        cx: v.cx * hR,
                        cy: v.cy * hR,
                        half: Math.max(0.9, Math.min(v.halfW, v.halfH) * hR)
                    };
                }
                return {
                    cx: (mnx + mxx) / 2,
                    cy: (mny + mxy) / 2,
                    half: Math.max(0.9, (Math.max(mxx - mnx, mxy - mny) / 2) * 1.35)
                };
            }

            // The scene as the model will see it: every shape flattened to a coarse
            // polygon (about 18 points — enough for "a bird, upper left, gold", which is
            // all composition needs), in the same 1000-box the reply will use. Array
            // order is z-order, so layering arrives implicitly. LEAF positions, not the
            // reference — the user's sculpting is part of the drawing.
            function buildSceneSketch(R) {
                const parts = [];
                let shapes = 0;
                for (const sp of state.subpaths) {
                    if (shapes >= 120)
                        break; // sanity cap; sketches stay ~1 line per shape
                    const X = sp.leafX || sp.refX,
                        Y = sp.leafY || sp.refY;
                    if (!X || X.length < 3)
                        continue;
                    const step = Math.max(1, Math.floor(X.length / 18));
                    const pts = [];
                    for (let i = 0; i < X.length; i += step) {
                        const sx = ((X[i] - R.cx) / (2 * R.half) + 0.5) * 1000;
                        const sy = ((R.cy - Y[i]) / (2 * R.half) + 0.5) * 1000; // world y-up → svg y-down
                        pts.push(sx.toFixed(0) + ',' + sy.toFixed(0));
                    }
                    const f = sp.fill && sp.fill.color ? sp.fill.color : 'none';
                    const fo = (sp.fill && sp.fill.opacity != null && sp.fill.opacity < 1)
                    ? ' fill-opacity="' + sp.fill.opacity.toFixed(2) + '"' : '';
                    const st = sp.stroke ? ' stroke="' + sp.stroke + '"' : '';
                    parts.push('<polygon points="' + pts.join(' ') + '" fill="' + f + '"' + fo + st + '/>');
                    shapes++;
                }
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">' + parts.join('') + '</svg>';
            }

            // Land a generated background UNDER the scene. This deliberately does not go
            // through loadSvg: loadSvg re-tiles every file group onto a fresh grid, which
            // would scramble the very layout the background was composed around. Instead
            // the reply's viewBox is mapped straight onto the target rect (no refitting —
            // the model's full-bleed composition must arrive exactly where the sketch
            // said the scene sits), and the shapes are PREPENDED: index 0 draws first,
            // so front of the array is the bottom of the stack.
            function placeBackground(svgText, label, R) {
                const poly = parseSvgToPolyline(svgText); // throws → generate()'s catch shows it
                let vb = null;
                const m = svgText.match(/viewBox\s*=\s*["']\s*([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)/);
                if (m)
                    vb = {
                        x: +m[1],
                        y: +m[2],
                        w: +m[3],
                        h: +m[4]
                    };
                if (!vb || !(vb.w > 0) || !(vb.h > 0)) {
                    // No usable viewBox → fall back to the geometry's own bounds.
                    let mnx = Infinity,
                        mny = Infinity,
                        mxx = -Infinity,
                        mxy = -Infinity;
                    for (const sp of poly.subpaths)
                        for (let i = 0; i < sp.x.length; i++) {
                            if (sp.x[i] < mnx)
                                mnx = sp.x[i];
                            if (sp.x[i] > mxx)
                                mxx = sp.x[i];
                            if (sp.y[i] < mny)
                                mny = sp.y[i];
                            if (sp.y[i] > mxy)
                                mxy = sp.y[i];
                        }
                    vb = {
                        x: mnx,
                        y: mny,
                        w: Math.max(1e-6, mxx - mnx),
                        h: Math.max(1e-6, mxy - mny)
                    };
                }
                const s = (2 * R.half) / Math.max(vb.w, vb.h);
                const scx = vb.x + vb.w / 2,
                    scy = vb.y + vb.h / 2;
                clearSelectionsForLoad(); // indices shift on prepend; nothing may hold one
                const fileTag = 'ai-bg#' + (state._fileSeq = (state._fileSeq || 0) + 1);
                const newSubs = [];
                for (const sp of poly.subpaths) {
                    const n = sp.x.length;
                    if (n < 3)
                        continue;
                    const xs = new Float64Array(n),
                        ys = new Float64Array(n);
                    for (let i = 0; i < n; i++) {
                        xs[i] = R.cx + (sp.x[i] - scx) * s;
                        ys[i] = R.cy - (sp.y[i] - scy) * s; // svg y-down → world y-up
                    }
                    const rs = arcLengthResample(Array.from(xs), Array.from(ys), 256);
                    newSubs.push({
                        refX: xs,
                        refY: ys,
                        leafX: Float64Array.from(rs.x),
                        leafY: Float64Array.from(rs.y),
                        srcCoV: rs.srcCoV,
                        refLength: sp.length || 0,
                        source: sp.source,
                        dirty: false,
                        fill: sp.fill || null,
                        stroke: sp.stroke || null,
                        fileTag,
                        _elemId: sp.elemId != null ? sp.elemId : null,
                        _elemParts: sp.elemParts || 1,
                    });
                }
                if (!newSubs.length)
                    throw new Error('the model returned no drawable geometry — try again');
                // Same even-odd compound grouping as a loaded file, so a background sun
                // with a punched-out crescent keeps its hole.
                const byElem = new Map();
                for (const sp of newSubs) {
                    if (sp._elemParts < 2 || sp._elemId == null || !sp.fill)
                        continue;
                    if (!byElem.has(sp._elemId))
                        byElem.set(sp._elemId, []);
                    byElem.get(sp._elemId).push(sp);
                }
                for (const group of byElem.values()) {
                    if (group.length < 2)
                        continue;
                    const runId = (state.nextTextRun = (state.nextTextRun || 0) + 1);
                    const gid = state.nextGid++;
                    for (const sp of group) {
                        sp.textRun = runId;
                        sp.gid = gid;
                        sp.groupLead = false;
                    }
                    group[0].groupLead = true;
                }
                for (const sp of newSubs) {
                    delete sp._elemId;
                    delete sp._elemParts;
                }
                state.subpaths = newSubs.concat(state.subpaths);
                // A background is fills by definition; generating one with fills hidden
                // would look like nothing happened.
                if (!state.showFills) {
                    state.showFills = true;
                    const t = $('tFills');
                    if (t)
                        t.checked = true;
                }
                state.svgName = (state.svgName ? state.svgName + ' + ' : '') + label;
                state.lastLoadInfo = {
                    totalElements: poly.totalElements,
                    multiSubpath: true,
                    subpathCount: newSubs.length
                };
                rebuildSignalSelect();
                applyShapeSelection(new Set());
                fitToView(); // frame the whole new composition
                pushHistory(); // one undo removes the background
                scheduleSave();
                drawAll();
                flashStatus('background landed — ' + newSubs.length + ' shapes behind the scene (undo removes it)');
            }

            async function generate() {
                if (busy)
                    return;
                const promptText = promptEl.value.trim();
                if (!ensureKey())
                    return;
                if (!promptText) {
                    setStatus('describe what to draw first', 'err');
                    promptEl.focus();
                    return;
                }
                const mode = modeEl.value;
                // Background mode: capture the scene BEFORE the round trip — the rect and
                // sketch must describe the drawing the model composes around, not whatever
                // the page looks like a minute later.
                const bgRect = mode === 'bg' ? bgTargetRect() : null;
                const bgSketch = (mode === 'bg' && state.subpaths.length) ? buildSceneSketch(bgRect) : null;
                busy = true;
                goBtn.classList.add('busy');
                goBtn.textContent = 'generating…';
                setStatus('asking ' + modelEl.value + (mode === 'bg' ? ' for a background' : '') + '… a picture usually takes 15–60 seconds', 'busy');
                try {
                    const data = await apiCall({
                        model: modelEl.value,
                        max_tokens: 16000,
                        system: mode === 'bg' ? SYS + '\n\n' + SYS_BG : SYS,
                        messages: [{
                            role: 'user',
                            content: mode === 'bg'
                            ? 'Background request: ' + promptText
                            + (bgSketch
                            ? '\n\nThe existing drawing, as a simplified sketch (do NOT redraw any of it):\n' + bgSketch
                            : '\n\n(The page is currently empty — just paint the full-bleed scene.)')
                            : 'Draw: ' + promptText,
                        }],
                    });
                    const svg = svgOf(textOf(data));
                    const short = promptText.length > 28 ? promptText.slice(0, 28) + '…' : promptText;
                    const label = (mode === 'bg' ? 'ai bg: ' : 'ai: ') + short;
                    if (mode === 'bg') {
                        placeBackground(svg, label, bgRect);
                    } else {
                        clearSelectionsForLoad();
                        // append=true tiles the new picture beside the scene exactly like a second
                        // loaded file; loadSvg ignores it on an empty page, so "add" always works.
                        loadSvg(svg, label, mode === 'add');
                    }
                    // Remember this generation so "check & fix last" can find its shapes
                    // (loadSvg tags them label#seq; placeBackground tags them ai-bg#seq).
                    lastGen = {
                        svg,
                        prompt: promptText,
                        mode,
                        label,
                        bgRect,
                        fileTag: (mode === 'bg' ? 'ai-bg' : label) + '#' + state._fileSeq,
                    };
                    fixBtn.disabled = false;
                    setStatus('');
                    closeAllPops();
                    if (data.stop_reason === 'max_tokens')
                        flashStatus('generated (ran long — bottom of the picture may be missing)');
                } catch (e) {
                    // A fetch that never reached the API (offline, blocked) surfaces as a bare
                    // TypeError with a message users can do nothing with; name the likely cause.
                    const msg = e && e.message ? e.message : 'generation failed';
                    setStatus(/failed to fetch/i.test(msg) ? 'could not reach the gateway — check the connection' : msg, 'err');
                } finally {
                    busy = false;
                    goBtn.classList.remove('busy');
                    goBtn.textContent = 'generate';
                }
            }
            goBtn.addEventListener('click', generate);
            promptEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    generate();
                }
                e.stopPropagation(); // the canvas shortcuts must not fire while typing here
            });

            // ── ANIMATE IT WITH AI (26 Oct 2026, Tom: "seems to me it would be easier for AI to build
            // animations with a framework like this, but advantage is the human could gently tweak the
            // generated AI result", then "1,2") ──────────────────────────────────────────────────────
            // The model is not asked for frames. It is asked for the scene link's own vocabulary (THE
            // SCENE LINK): which shapes are keys, the path a morph rides, its rate, phase, spin, times,
            // clip, trail, what it follows and faces. That is a short list it is good at choosing, and
            // every value in it has a control by hand afterwards (the morph's strip, the timeline, a pose
            // edited on the canvas), so what comes back is a start to nudge, not a video to take or leave.
            //   animate it: the drawing goes out with its shapes numbered and the words in the box; the
            //     reply's new shapes (copies of numbered ones, moved, turned, sized; or new outlines and
            //     paths as SVG) land on the page where the reply put them, and its morphs go live.
            //   change it: the morphs already live go out too, each with its settings, and the reply
            //     changes what the note asks for (`change`, by morph) and keeps the rest: the keys, the
            //     poses edited by hand, the times a key was dragged to. It may add morphs as well.
            // Either way the whole reply is one undo step.
            const animBtn = $('aiAnimate'),
                animChangeBtn = $('aiAnimChange');
            // what a morph can be told, shared by "animate it" and "make a scene" (one vocabulary: the scene link's)
            const ANIM_MORPH_FIELDS = [
                'A MORPH blends its keys in order and loops back from the last key to the first, smoothly (a key may repeat: [bud, bloom, bud]). One key is a still that can ride a path, spin or take an effect. Fields:',
                '- keys: shape numbers. A shape can be a key of one morph only. The first key is where the morph is drawn.',
                '- path: a shape number to ride (an open line goes along it and back, or "mode":"along" round a closed loop); laps: whole times round per loop; at: where on the path it starts (0–1); turn: true to face along the path.',
                '- rate: a whole number of times the morph plays per loop (a fast flicker 3, a slow drift 1). phase: 0–1, its offset on the clock (stagger a row: 0, 0.1, 0.2 …).',
                '- spin: whole turns per loop (negative anticlockwise on screen).',
                '- motion: physics the editor computes exactly, for a thing that moves as a body (use it instead of keying such motion by hand): {"kind": "bounce", "amount": hop height in the shape\'s own heights (1.5), "squash": 0–0.6 (0.25)} one hop a cycle off the ground where it is drawn, squashed as it lands and stretched in flight; {"kind": "fall", "amount": drop height in its heights (3), "bounce": 0–0.9, the share of speed kept each bounce (0.5)} dropped, bouncing lower until it rests (pair with a clip to fall once); {"kind": "swing", "amount": degrees either side (30), "pivot": "top"|"bottom"|"left"|"right"|"centre"} a pendulum, a sign, a bell; {"kind": "spring", "amount": size (0.3), "along": "y"|"x"|"scale"|"turn", "bounces": 4} a damped boing at the start of each cycle, a jelly, a spring, a plant flicked; {"kind": "roll", "amount": widths across and back (4)} rolling without skidding, turned by the distance over its radius (with a path, it rolls along the path instead: a wheel, a ball, a barrel); {"kind": "throw", "to": [right, up] where it lands, in its own heights from where it is drawn ([6, 0]), "amount": the arc\'s top in its heights above the higher end (2)} a toss along gravity\'s parabola landing exactly there (pair with a clip to throw once); {"kind": "sway", "amount": degrees (8)} bending from its base in the wind, the base still and the top moving most (a tree, grass, a flame); {"kind": "pop", "amount": 0–1 liveliness (0.5)} growing from nothing to its size with an overshoot and a settle (pair with a clip and show "in" to pop in). {"kind": "drift", "to": [right, up] in its heights per cycle ([0, -8]), "amount": wobble in widths (0.5)} carried steadily, wobbling, growing in and shrinking out at the ends (rain, snow, bubbles, confetti, leaves: pair with emit). rate sets how many a loop. A morph riding a parent moves with the parent\'s motion too (a rider on a bouncing ball bounces and squashes with it).',
                '  - contact: fall, bounce, throw and roll take "onto": a shape number, to drop onto it, hop on it, land on its top or roll up to it and back (a ball onto a table, a box onto a shelf, a ball rolling to a wall); the numbers are worked out for you.',
                '  - in a row: {"kind": "chain", "steps": [motion, motion, …]} plays its steps one after another, each from where the last ended, each with "share" (its part of the cycle, 1 by default): thrown then bouncing to rest, popped in then swaying, dropped onto a table then rolling off it. In a chain a roll goes one way.',
                '- the scene (beside "loop", "ease" and "hold") may set "gravity": 1–4 (1, the floatiest; more and hops, falls and throws are over sooner and rest, swings swing faster) and "wind": −1 (left) to 1 (right) (every sway leans that way, swings hang pushed, drifts are carried): one weather for every motion, so falling snow and a swaying tree agree.',
                '- the scene may also set "stops": [t, …], places on the clock (0–1) where playing waits for the viewer to click on: the beats of an explainer (put one at the end of each step\'s clips); "beats": [{"title", "text"}, …], one more than the stops, the words read beside each stretch between them (an explainer page shows them, **bold** allowed); and "camera": [{"t": 0–1, "fit": [shape numbers] or "all", "pad": 0.12}, …], the view framing those shapes at that time, moving smoothly from one key to the next (zoom in on a detail, then back out), holding before the first and after the last.',
                '- emit: {"count": 2–200 (12), "spread": [across, up] in the shape\'s own heights (where copies are scattered, round where it is drawn), "vary": 0–1 (how much each copy\'s size, turn and motion differ, 0.5), "seed": a number} makes the morph many times over, each copy with its own phase: confetti, rain, snow, a flock of bubbles. Draw the one shape; emit does the rest.',
                '- times: one time per key, 0–1, increasing (when each key is reached); eases: one per stretch between keys: "linear", "inout", "in", "out", "anticipate" (draws back first, then goes), "overshoot" (goes past the next key and settles back), "elastic" (goes past and rings to rest) or null; the scene\'s "ease" takes the same names. Two keys with "anticipate" or "overshoot" give a simple morph the cartoon feel: use them for a thing that jumps, pops, snaps or lands. "straight": true blends each stretch from its two keys only, so a key repeated holds still (hold, move, hold: an explainer\'s steps); without it three keys or more flow smoothly through one another.',
                '- clip: {"start": 0–1, "len": 0–1, "show": "" | "during" | "fade" | "in" | "out" | "draw"}: the morph plays ONCE in that window of the loop (first key to last), holding either side; with \"times\" its keys are laid across the window from the first time to the last, so a pose meant to hold until the window ends needs its last key given again with the last time near 1; "show" makes it seen only while it plays ("during"), fading in and out ("fade"), appearing and staying ("in"), there until it plays then gone ("out"), or DRAWN ON over the window, its outline traced from its start like a pen and its fill coming in at the end, then staying ("draw"). A line (an open path: an arrow, an underline, a bracket) drawn on is a morph with one key and a "draw" clip. Clips one after another make a sequence. A clip may instead say how it comes and goes apart, each over its own length (a share of the loop, like start and len): "in": {"kind": "fade" | "draw" | "cut", "len"} (unseen before the window, then fading in, drawn on, or there at once) and "out": {"kind": "fade" | "undraw" | "cut", "len"} (gone after the window, fading out, the pen going back, or gone at once); with no "in" it is there from the loop\'s start, with no "out" it stays. So a line can be drawn on and later fade: {"start": 0.2, "len": 0.5, "in": {"kind": "draw", "len": 0.1}, "out": {"kind": "fade", "len": 0.05}}.',
                '- trail: {"kind": "echoes" | "ribbon", "len": 0–1}. fx: {"kind": "shimmer" | "grow" | "boil", "amount": 0–1}: a living outline, for flames, water, a heartbeat.',
                '- lag: 0–0.9, the outline\'s parts arriving one after another (a flag, a jelly). follow: {"kind": "lag" | "spring", "amount": 0–1}, with parent: how loosely it is carried.',
                '- parent: a MORPH number whose every move and turn carries this one (a moon on its planet, a rider on a horse). look: a morph number it keeps turning to face.',
            ];
            const SYS_ANIM = [
                'You animate an existing flat vector drawing in a shape editor whose animation is made of MORPHS. You never draw frames: you say which shapes are the keys of each morph and how it moves, and the editor plays it.',
                '',
                'Reply with ONLY one JSON object, no code fences, no commentary:',
                '{ "note": "one short sentence: what you did",',
                '  "copies": [ { "of": i, "dx": 0, "dy": 0, "turn": 0, "scale": 1, "sx": 1, "sy": 1, "about": [x, y], "fill": "#rrggbb" } ],',
                '  "svg": "<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1000 1000\'>…</svg>",',
                '  "morphs": [ { "keys": [i, j], … } ],',
                '  "change": [ { "morph": k, … } ],',
                '  "loop": 4, "ease": "inout", "hold": 0 }',
                'Every field is optional; leave out what you do not need.',
                '',
                'COORDINATES: one 1000 × 1000 box, x right, y DOWN, exactly the box the drawing is given in.',
                '',
                'SHAPES are numbered: the drawing\'s shapes 0 … N−1 as given (id="s<i>"); then your copies, in order; then the shapes of your "svg", in document order.',
                '- "copies": a copy of shape `of`, moved by (dx, dy), turned `turn` degrees clockwise and scaled (`scale`, or `sx`/`sy`) about `about` (default: its own centre), optionally refilled. A copy keeps the original\'s exact corners and curves, so it is the RIGHT way to make another pose of a shape: the sun higher, the door swung, the bird with its wing down.',
                '- "svg": new outlines (<path>, <polygon>, <circle>, <ellipse>, <rect>, <line>, <polyline>; solid fill or stroke colours only; no <text>, no transforms, no gradients) for new things and for MOTION PATHS: an open line, or a closed loop for an orbit. A path shape a morph rides is hidden.',
                '',
                ...ANIM_MORPH_FIELDS,
                '',
                'MORPHS are numbered: the morphs already live 0 … M−1 as given, then your "morphs" entries in order. "change" (only when morphs are live) changes a live morph: { "morph": k, and any of the fields above except keys }; { "morph": k, "end": true } ends it and gives its keys back as shapes. Change only what the request asks; everything you leave out stays as it is, including what the person has adjusted by hand.',
                '',
                'Whole-scene fields: loop (seconds for one loop, 0.5–60), ease ("" | "inout" | "in" | "out", for every morph without its own eases), hold (0–0.9, a pause at each key).',
                '',
                'ANIMATE WHAT IS DRAWN. Do not add scenery, a background, a sky, ground or anything new that the request does not name: the drawing is the person\'s own. Your new shapes are other poses of drawn shapes (copies), motion paths, and only the few new things the request asks for (smoke for "the smoke puffs"). Every new shape must be a key or a path of one of your morphs: one that is not is thrown away.',
                'GOOD PRACTICE: move only what the request is about; leave the rest still. Prefer a copy of a shape over redrawing it. Keys blended together should be the same kind of outline (a copy of each other, or with the same number of corners). An orbit is a still on a closed path. A bounce, a fall, a swing, a spring, a roll, a throw, a sway, a pop or a drift is one key and a motion (the physics is computed; do not key it by hand); several in a row are a chain; many alike are one shape with emit. Bobbing, swaying and breathing are two keys (a copy moved or turned a little). Keep it simple: a few morphs that read well beat many.',
            ].join('\n');
            // MAKE A SCENE (27 Oct 2026, Tom: "should we have seperate ways to create full scenes from animations", then
            // "yes"): words alone, answered with a whole scene, drawn and animated at once, in the scene link's own form
            // (THE SCENE LINK), so it opens as a gallery example does. "animate it" keeps to the drawing that is there.
            const SYS_SCENE = [
                'You draw AND animate a small scene for a shape editor whose animation is made of MORPHS. You never draw frames: you draw the shapes, including every pose a moving thing passes through, and say which shapes are the keys of each morph and how it moves; the editor plays it.',
                '',
                'Reply with ONLY one JSON object, no code fences, no commentary:',
                '{ "name": "a few words", "note": "one short sentence: what you made",',
                '  "svg": "<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1000 1000\'>…</svg>",',
                '  "copies": [ { "of": i, "dx": 0, "dy": 0, "turn": 0, "scale": 1, "sx": 1, "sy": 1, "about": [x, y], "fill": "#rrggbb" } ],',
                '  "morphs": [ { "keys": [i, j], … } ],',
                '  "loop": 4, "ease": "inout", "hold": 0 }',
                'The svg is a string inside the JSON: write its attributes in single quotes.',
                '',
                'THE DRAWING (the importer silently drops anything else):',
                '- Root: <svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1000 1000\'>; x right, y DOWN.',
                '- Only path, circle, ellipse, rect, polygon, polyline, line and text. No image, use, defs, style, group transforms, filters, masks or gradients.',
                '- TEXT: <text x y font-size font-family font-weight fill text-anchor>words</text> is a label, ONE shape in the numbering, made into outlined letters when it opens. As a morph key with a clip it can be written on letter by letter ("show": "draw"), fade in ("in"), and be framed by the camera. Use it for titles, labels and short captions; one line each. x_1, x^2, x_{max} and e^{iπ} are written lower and higher, smaller. A morph whose keys are DIFFERENT labels ("N = 8", then "N = 16") crossfades from one to the next at each key\'s time (its times, or evenly over its clip), the first coming in and the last going out as its clip says.',
                '- PLOTS: any element with data-plot="…" is drawn by a formula, exactly: "r = 1 + 0.3cos(5t)" (polar, closed over a whole turn, y up), "x = …; y = …" (a curve in t) or "y = sin x" (a graph). Lines separated by ";" may define functions first ("F(t) = 95 + 16cos(3t); r = F(t)"); sum(j, 0, 7, …) adds terms; π, e, sin cos tan exp ln sqrt abs min max atan2. data-t0 and data-t1 its range ("2π"), data-n its samples (128), data-cx and data-cy where its origin is in the svg, data-scale svg units per unit (1). Give it stroke and fill like any shape. Use plots for anything mathematical: curves, graphs, waves, spirals, roses.',
                '- Plain hex colours in fill and stroke attributes. Opacity only as fill-opacity, and only where something is really see-through.',
                '- ONE CLOSED OUTLINE PER ELEMENT: each element is one shape, numbered by its order in the svg (0, 1, 2 …). A hole (a ring, a window in a wall) is a second subpath in the same path; never put two separate outlines in one path.',
                '- Back to front: a full-bleed backdrop first (sky, wall, water), then the middle, then the things in front. Poster art, confident simplified forms, 10 to 60 elements, curves (C, Q) over many tiny segments.',
                '',
                'SHAPES are numbered: the svg\'s elements 0 … N−1 in order, then your copies, in order.',
                '- "copies": a copy of shape `of`, moved by (dx, dy), turned `turn` degrees clockwise and scaled (`scale`, or `sx`/`sy`) about `about` (default: its own centre), optionally refilled. A copy keeps the original\'s exact outline, so it is the RIGHT way to make another pose of a shape: the sun higher, the door swung, the wing down. A pose made by a copy is not drawn in the svg.',
                '',
                ...ANIM_MORPH_FIELDS,
                '',
                'MORPHS are numbered by their order in "morphs" (for parent and look).',
                '',
                'Whole-scene fields: loop (seconds for one loop, 0.5–60), ease ("" | "inout" | "in" | "out", for every morph without its own eases), hold (0–0.9, a pause at each key).',
                '',
                'GOOD PRACTICE: the backdrop and everything that stays still are drawn and in no morph. A thing that moves rigidly is one shape with a path or a spin, or two keys made by a copy (bobbing, swaying, a door). A thing that bounces, falls, swings, springs, rolls, is thrown, sways or pops in is one shape with a motion: draw it where it rests or starts (a ball on the ground, a lamp hanging, a tree standing), and the editor computes the physics; to land on something use onto, and for one thing after another a chain. Rain, snow, confetti and bubbles are one drop or flake with a drift and emit. A thing that changes shape is two or more keys drawn with the same number of corners, or copies sized and turned. Several things moving alike (birds, waves, lanterns) share one way of moving with their phases staggered. Make the motion read at a glance and loop cleanly; a few morphs that read well beat many.',
            ].join('\n');
            // A shape's outline as it is drawn, without asking a held (exact or imported) shape for its
            // leaves: that question turns it into leaves for good.
            function animOutline(sp) {
                const lz = sp && sp._lazy;
                if (lz) {
                    if (lz.exact && (hasRound(lz.round) || lz.smooth || lz.ctrl)) {
                        const D = exactDense(lz.x, lz.y, lzRoundBaked(lz), lz.open, lz.smooth, lzCtrlBaked(lz));
                        return { x: D.x, y: D.y, open: lz.open };
                    }
                    return { x: lz.x, y: lz.y, open: lz.open };
                }
                return sp && sp.leafX && sp.leafX.length >= 2 ? { x: sp.leafX, y: sp.leafY, open: false } : null;
            }
            // the box the drawing is given in: its bounds with room round them for things to move into
            function animRect() {
                let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
                for (const sp of state.subpaths) {
                    const O = animOutline(sp);
                    if (!O)
                        continue;
                    for (let i = 0; i < O.x.length; i++) {
                        x0 = Math.min(x0, O.x[i]);
                        x1 = Math.max(x1, O.x[i]);
                        y0 = Math.min(y0, O.y[i]);
                        y1 = Math.max(y1, O.y[i]);
                    }
                }
                if (!(x1 > x0) && !(y1 > y0))
                    return null;
                return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, half: Math.max(1e-6, Math.max(x1 - x0, y1 - y0) / 2 * 1.25) };
            }
            const animToBox = (R, x, y) => [((x - R.cx) / (2 * R.half) + 0.5) * 1000, (0.5 - (y - R.cy) / (2 * R.half)) * 1000];
            // the drawing in the box, every shape numbered as the reply will number it: an exact shape by
            // its corners (and curves sampled), anything else by about 40 points of its outline
            function animSketch(R, S, runs) {
                const parts = [];
                S.forEach((sp, i) => {
                    const O = animOutline(sp);
                    if (!O || O.x.length < 2)
                        return;
                    const n = O.x.length,
                        step = Math.max(1, Math.floor(n / 40)),
                        pts = [];
                    for (let k = 0; k < n; k += step) {
                        const [bx, by] = animToBox(R, O.x[k], O.y[k]);
                        pts.push(bx.toFixed(1) + ' ' + by.toFixed(1));
                    }
                    const f = sp.fill && sp.fill.color ? sp.fill.color : 'none',
                        st = sp.stroke ? ' stroke="' + sp.stroke + '"' : '',
                        r = runs.findIndex(run => run.sp === sp);
                    parts.push('<path id="s' + i + '"' + (r >= 0 ? ' data-morph="' + r + '"' : '') + ' fill="' + (O.open ? 'none' : f) + '"' + st + ' d="M' + pts.join(' L') + (O.open ? '' : ' Z') + '"/>');
                });
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">\n' + parts.join('\n') + '\n</svg>';
            }
            // the morphs already live, as "change" reads them
            function animMorphsNow(S, runs) {
                const r4 = v => +(+v).toFixed(4);
                return runs.map((run, k) => {
                    const o = { morph: k, shape: S.indexOf(run.sp), keys: run.keys.length };
                    if ((run.rate || 1) !== 1)
                        o.rate = run.rate;
                    if (run.phase)
                        o.phase = r4(run.phase);
                    if (run.spin)
                        o.spin = run.spin;
                    if (run.motion)
                        o.motion = Object.assign({}, run.motion); // PHYSICAL MOTIONS
                    if (run.path) {
                        o.path = true;
                        if ((run.laps || 1) !== 1)
                            o.laps = run.laps;
                        if (run.at != null)
                            o.at = r4(run.at);
                    }
                    if (run.times)
                        o.times = run.times.map(r4);
                    if (run.eases)
                        o.eases = run.eases.slice();
                    if (run.straight)
                        o.straight = true;
                    if (run.clip)
                        o.clip = morphClipOut(run.clip, r4);
                    if (run.trail && run.trail.kind)
                        o.trail = { kind: run.trail.kind, len: r4(run.trail.len) };
                    if (run.fx && run.fx.kind)
                        o.fx = { kind: run.fx.kind, amount: r4(run.fx.amount) };
                    if (run.lag)
                        o.lag = r4(run.lag);
                    if (run.parent)
                        o.parent = runs.indexOf(run.parent);
                    if (run.follow)
                        o.follow = { kind: run.follow.kind, amount: r4(run.follow.amount) };
                    if (run.look)
                        o.look = runs.indexOf(run.look);
                    return o;
                });
            }
            // a copy of a shape, in the page's units, under the map t: a held exact shape stays exact (its
            // corners, radii, curves and holes carried by the same map), anything else is copied leaf by leaf
            function animCopy(sp, t) {
                const lz = sp._lazy;
                if (!lz) {
                    const at = cloneSubpathsWith([state.subpaths.indexOf(sp)], (x, y) => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]]);
                    if (!at.length)
                        return null;
                    return state.subpaths.splice(at[0], 1)[0];
                }
                const c = {
                    refLength: 0,
                    source: sp.source,
                    dirty: false,
                    fill: sp.fill ? { color: sp.fill.color, opacity: sp.fill.opacity } : null,
                    stroke: sp.stroke || null,
                    strokeOpacity: sp.strokeOpacity != null ? sp.strokeOpacity : null,
                    lineStyle: sp.lineStyle || null,
                    lineWidth: sp.lineWidth != null ? sp.lineWidth : null,
                    gname: sp.gname || null,
                };
                makeLazy(c, Float64Array.from(lz.rx), Float64Array.from(lz.ry), lz.scale, lz.m ? lz.m.slice() : null, {
                    exact: lz.exact,
                    open: lz.open,
                    round: lz.round,
                    smooth: lz.smooth,
                    ctrl: lz.ctrl,
                    holes: lz.holes
                });
                lazyXform(c, t);
                return c;
            }
            // a reply's copy's map, in the page's units (y up), from the box's (y down)
            function animCopyMap(R, c, sp) {
                const k = 2 * R.half / 1000;
                let ax, ay;
                if (Array.isArray(c.about) && c.about.length === 2 && c.about.every(Number.isFinite)) {
                    ax = R.cx + (c.about[0] - 500) * k;
                    ay = R.cy - (c.about[1] - 500) * k;
                } else {
                    const O = animOutline(sp);
                    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
                    for (let i = 0; i < O.x.length; i++) {
                        x0 = Math.min(x0, O.x[i]);
                        x1 = Math.max(x1, O.x[i]);
                        y0 = Math.min(y0, O.y[i]);
                        y1 = Math.max(y1, O.y[i]);
                    }
                    ax = (x0 + x1) / 2;
                    ay = (y0 + y1) / 2;
                }
                const num = (v, d) => Number.isFinite(+v) ? +v : d;
                const s = num(c.scale, 1),
                    sx = num(c.sx, 1) * s,
                    sy = num(c.sy, 1) * s,
                    phi = -num(c.turn, 0) * Math.PI / 180, // clockwise on the screen is clockwise with y down
                    co = Math.cos(phi),
                    si = Math.sin(phi);
                const a = sx * co, b = sx * si, cc = -sy * si, d = sy * co;
                const dx = num(c.dx, 0) * k,
                    dy = -num(c.dy, 0) * k;
                return [a, b, cc, d, ax + dx - (a * ax + cc * ay), ay + dy - (b * ax + d * ay)];
            }
            // The reply's svg read in the units of its own box. parseSvgExact lays the file out in a 10-pixel host
            // and reads each element through its CTM, which includes the viewBox's scale to that host, so a 1000 box
            // came back a hundredth of its size (a fit to the shapes never noticed; a placement in the box does):
            // the root is given its viewBox's own width and height first, so that scale is 1.
            function animBoxSvg(text) {
                try {
                    const doc = new DOMParser().parseFromString(text, 'image/svg+xml'),
                        root = doc.documentElement;
                    const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
                    const w = vb.length === 4 && vb[2] > 0 ? vb[2] : 1000,
                        h = vb.length === 4 && vb[3] > 0 ? vb[3] : 1000;
                    if (vb.length !== 4)
                        root.setAttribute('viewBox', '0 0 1000 1000');
                    root.setAttribute('width', String(w));
                    root.setAttribute('height', String(h));
                    return new XMLSerializer().serializeToString(root);
                } catch (_) {
                    return text;
                }
            }
            // a reply's new outlines, landed where the box puts them, exact as an opened SVG is
            function animLandSvg(R, text) {
                const ex = parseSvgExact(animBoxSvg(text));
                if (!ex)
                    throw new Error('the reply\'s svg could not be read');
                const k = 2 * R.half / 1000;
                const Mw = [k, 0, 0, -k, R.cx - 500 * k, R.cy + 500 * k];
                const mx = (X, Y) => ({
                    x: Float64Array.from(X, x => Mw[0] * x + Mw[4]),
                    y: Float64Array.from(Y, y => Mw[3] * y + Mw[5])
                });
                const fileTag = 'ai-anim#' + (state._fileSeq = (state._fileSeq || 0) + 1);
                return ex.shapes.map(sh => {
                    const sp = {
                        refLength: 0,
                        source: 'svg',
                        dirty: false,
                        fill: sh.fill,
                        stroke: sh.stroke,
                        fileTag,
                        gname: sh.name || null
                    };
                    if (!sh.stroke && sh.fill)
                        sp.lineWidth = 0; // drawn by its fill alone, as an example's shapes are
                    const P = mx(sh.ring.x, sh.ring.y);
                    makeLazy(sp, P.x, P.y, 0, null, {
                        exact: true,
                        open: sh.open,
                        smooth: sh.ring.smooth,
                        ctrl: ctrlMapped(sh.ring.ctrl, Mw),
                        holes: sh.holes.length ? sh.holes.map(h => {
                            const H = mx(h.x, h.y);
                            return { x: H.x, y: H.y, smooth: h.smooth, ctrl: ctrlMapped(h.ctrl, Mw) };
                        }) : null
                    });
                    return sp;
                });
            }
            function animParse(text) {
                const a = text.indexOf('{'),
                    z = text.lastIndexOf('}');
                if (a < 0 || z < a)
                    throw new Error('the model returned no animation — try rephrasing');
                const r = JSON.parse(text.slice(a, z + 1));
                if (!r || typeof r !== 'object')
                    throw new Error('the model returned no animation — try rephrasing');
                return r;
            }
            // The reply on the page: copies, then new outlines, then the morphs, then the changes, as one
            // undo step. S and R are the shapes and the box the request described.
            // opts.strict ("animate it"): a shape the reply added that became no key and no path is thrown away, so
            // the reply animates the drawing that is there instead of drawing a scene round it (MAKE A SCENE does that)
            function animApply(reply, S, R, runs, opts) {
                if (S.some(sp => state.subpaths.indexOf(sp) < 0) || runs.some(r => morphRuns.indexOf(r) < 0))
                    throw new Error('the drawing changed while the answer was on its way — ask again');
                const base = history.stack[history.index]; // the page before the reply (an index would move if the history is full)
                const all = S.slice();
                let added = 0;
                clearSelectionsForLoad();
                for (const c of Array.isArray(reply.copies) ? reply.copies : []) {
                    const src = c && Number.isInteger(c.of) ? all[c.of] : null;
                    const cp = src ? animCopy(src, animCopyMap(R, c, src)) : null;
                    if (cp && typeof c.fill === 'string' && /^#[0-9a-f]{3,8}$/i.test(c.fill))
                        cp.fill = { color: c.fill, opacity: cp.fill ? cp.fill.opacity : 1 };
                    if (cp) {
                        state.subpaths.push(cp);
                        added++;
                    }
                    all.push(cp);
                }
                if (typeof reply.svg === 'string' && reply.svg.indexOf('<svg') >= 0)
                    for (const sp of animLandSvg(R, reply.svg)) {
                        state.subpaths.push(sp);
                        all.push(sp);
                        added++;
                    }
                let d = { morphs: Array.isArray(reply.morphs) ? reply.morphs : [] };
                for (const key of ['loop', 'ease', 'hold', 'stops', 'camera', 'gravity', 'wind'])
                    if (reply[key] !== undefined)
                        d[key] = reply[key];
                const LB = opts && opts.labels;
                if (LB) { // TEXT IN A SCENE: each label's other parts after the copies, and its morphs made once a part
                    const extra = LB.parts.map(P => P.slice(1).map(sp => all.push(sp) - 1));
                    d = window.__sceneLabelMorphs(d, { num: LB.num, extra, parts: LB.parts });
                }
                const made = window.applySceneMorphs(d, all, { partial: true, existing: runs });
                const ended = window.sceneChangeRuns(reply.change, all, runs.concat(made));
                let unused = 0;
                if (opts && opts.strict)
                    for (const sp of all.slice(S.length)) {
                        const at = sp ? state.subpaths.indexOf(sp) : -1;
                        if (at >= 0 && !morphRuns.some(r => r.sp === sp)) {
                            state.subpaths.splice(at, 1);
                            unused++;
                        }
                    }
                if (morphRunning() && !morphLive.play) {
                    morphLive.play = true;
                    morphLive.last = 0;
                    if (!morphLive.raf)
                        morphLive.raf = requestAnimationFrame(morphTick);
                }
                // one undo step for the whole reply: the steps the morphs took on the way are folded into it
                const h0 = history.stack.indexOf(base);
                if (h0 >= 0 && history.index > h0) {
                    history.stack.length = h0 + 1;
                    history.index = h0;
                }
                rebuildSignalSelect();
                applyShapeSelection(new Set());
                pushHistory();
                morphBarSync();
                scheduleSave();
                drawAll();
                return { added: added - unused, unused, made: made.filter(Boolean).length, changed: Array.isArray(reply.change) ? reply.change.length - ended : 0, ended };
            }
            window.__animApply = (reply, S, R, opts) => animApply(reply, S || state.subpaths.slice(), R || animRect(), morphRuns.slice(), opts); // for the smoke test
            window.__animSketch = () => {
                const R = animRect(),
                    S = state.subpaths.slice();
                return R ? { R, svg: animSketch(R, S, morphRuns.slice()), morphs: animMorphsNow(S, morphRuns.slice()), n: S.length, held: S.filter(sp => sp._lazy && sp._lazy.exact).length, play: morphLive.play, loop: 1 / morphLive.speed } : null;
            };
            async function animate(change) {
                if (busy)
                    return;
                if (!ensureKey())
                    return;
                const promptText = promptEl.value.trim();
                if (!promptText) {
                    setStatus(change ? 'say what to change first ("slower", "let the bird lag more")' : 'say how it should move first ("the sun rises and the smoke puffs")', 'err');
                    promptEl.focus();
                    return;
                }
                if (state.editMode || drawMode) {
                    setStatus('leave the edit or draw mode first', 'err');
                    return;
                }
                const R = animRect();
                if (!R) {
                    setStatus('draw something to animate first', 'err');
                    return;
                }
                if (change && !morphRunning()) {
                    setStatus('nothing is moving yet — animate it first', 'err');
                    return;
                }
                const S = state.subpaths.slice(),
                    runs = morphRuns.slice();
                const sketch = animSketch(R, S, runs),
                    live = runs.length ? JSON.stringify(animMorphsNow(S, runs)) : '';
                const b = change ? animChangeBtn : animBtn,
                    label = b.textContent;
                busy = true;
                b.classList.add('busy');
                b.textContent = 'thinking…';
                setStatus('asking ' + modelEl.value + (change ? ' to change the animation' : ' to animate it') + '… usually 10–40 seconds', 'busy');
                try {
                    const data = await apiCall({
                        model: modelEl.value,
                        max_tokens: 16000,
                        system: SYS_ANIM,
                        messages: [{
                            role: 'user',
                            content: [
                                imgBlock(scenePngB64(768)),
                                {
                                    type: 'text',
                                    text: (change ? 'Change the animation: ' : 'Animate it: ') + promptText
                                        + '\n\nThe picture above is the drawing as it looks now. Its shapes, numbered, in the 1000 × 1000 box (N = ' + S.length + '):\n' + sketch
                                        + (live ? '\n\nThe morphs already live (M = ' + runs.length + '; "shape" is the drawing shape each one is drawn as, "keys" how many keys it has):\n' + live
                                            + (change ? '\n\nThis is a CHANGE: prefer "change" on these morphs to new ones, and change only what is asked.' : '\n\nKeep these as they are unless the request is about them.')
                                            : '\n\nNothing is moving yet (M = 0).'),
                                }
                            ],
                        }],
                    });
                    const reply = animParse(textOf(data));
                    const r = animApply(reply, S, R, runs, { strict: true });
                    setStatus((reply.note ? String(reply.note).slice(0, 200) + ' — ' : '') + r.made + ' new morph' + (r.made === 1 ? '' : 's') + (r.changed ? ', ' + r.changed + ' changed' : '') + (r.ended ? ', ' + r.ended + ' ended' : '') + (r.added ? ', ' + r.added + ' new shape' + (r.added === 1 ? '' : 's') : '') + (r.unused ? ' (' + r.unused + ' that moved nothing left out)' : '') + '. Undo takes it all back; the morph bar, its strip and the timeline tweak it.');
                    animChangeBtn.disabled = !morphRunning();
                } catch (e) {
                    const msg = e && e.message ? e.message : 'animation failed';
                    setStatus(/failed to fetch/i.test(msg) ? 'could not reach the gateway — check the connection' : msg, 'err');
                } finally {
                    busy = false;
                    b.classList.remove('busy');
                    b.textContent = label;
                }
            }
            if (animBtn)
                animBtn.addEventListener('click', () => animate(false));
            if (animChangeBtn) {
                animChangeBtn.addEventListener('click', () => animate(true));
                btn.addEventListener('click', () => { animChangeBtn.disabled = !morphRunning(); });
            }
            // MAKE A SCENE: the reply's svg opens as a scene link's drawing does (openScene: exact shapes, asking first
            // when the page holds your drawing), and its copies and morphs then land through animApply, in the box the
            // svg was drawn in: worked out from where its shapes landed, so a copy moved 300 up in the reply's box moves
            // 300 up in it here.
            window.__sceneBoxOf = (t, S) => sceneBoxOf(t, S); // A CAMERA: a scene's boxes in its svg's units
            window.__animOutline = sp => animOutline(sp);
            function sceneBoxOf(svgText, S) {
                const ex = parseSvgExact(animBoxSvg(svgText));
                if (!ex || !ex.shapes.length)
                    return null;
                let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
                for (const sh of ex.shapes) {
                    const D = exactDense(sh.ring.x, sh.ring.y, null, sh.open, sh.ring.smooth, sh.ring.ctrl);
                    for (let i = 0; i < D.x.length; i++) {
                        a0 = Math.min(a0, D.x[i]);
                        a1 = Math.max(a1, D.x[i]);
                        b0 = Math.min(b0, D.y[i]);
                        b1 = Math.max(b1, D.y[i]);
                    }
                }
                let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
                for (const sp of S) {
                    const O = animOutline(sp);
                    if (O)
                        for (let i = 0; i < O.x.length; i++) {
                            x0 = Math.min(x0, O.x[i]);
                            x1 = Math.max(x1, O.x[i]);
                            y0 = Math.min(y0, O.y[i]);
                            y1 = Math.max(y1, O.y[i]);
                        }
                }
                const wide = a1 - a0 >= b1 - b0,
                    k = wide ? (x1 - x0) / Math.max(1e-9, a1 - a0) : (y1 - y0) / Math.max(1e-9, b1 - b0);
                if (!(k > 0) || !isFinite(k))
                    return null;
                return { cx: (x0 + x1) / 2 - ((a0 + a1) / 2 - 500) * k, cy: (y0 + y1) / 2 + ((b0 + b1) / 2 - 500) * k, half: 500 * k };
            }
            async function sceneLand(reply) {
                if (typeof reply.svg !== 'string' || reply.svg.indexOf('<svg') < 0)
                    throw new Error('the model returned no drawing — try rephrasing');
                const name = String(reply.name || promptEl.value.trim() || 'scene').slice(0, 60);
                const ok = await window.openScene({ v: 1, name, svg: reply.svg, exact: true, morphs: [], play: false });
                if (!ok)
                    return null;
                // TEXT IN A SCENE: a label is one number, its other parts numbered after the reply's copies
                const L = window.__sceneLabelsLast,
                    nExtra = L ? L.extra.reduce((a, e) => a + e.length, 0) : 0,
                    S = L ? L.S.slice(0, L.S.length - nExtra) : state.subpaths.slice(),
                    R = sceneBoxOf(window.__sceneSvgLast || reply.svg, state.subpaths.slice()) || animRect();
                const d = { copies: reply.copies, morphs: reply.morphs };
                for (const key of ['loop', 'ease', 'hold', 'stops', 'camera', 'gravity', 'wind'])
                    if (reply[key] !== undefined)
                        d[key] = reply[key];
                const r = animApply(d, S, R, [], { labels: L });
                state.svgName = 'scene · ' + name;
                return Object.assign(r, { shapes: S.length, name });
            }
            window.__sceneLand = sceneLand; // for the smoke test
            async function makeScene() {
                if (busy)
                    return;
                if (!ensureKey())
                    return;
                const promptText = promptEl.value.trim();
                if (!promptText) {
                    setStatus('describe the scene first ("a harbour at dusk with boats bobbing")', 'err');
                    promptEl.focus();
                    return;
                }
                if (state.editMode || drawMode) {
                    setStatus('leave the edit or draw mode first', 'err');
                    return;
                }
                const b = sceneBtn,
                    label = b.textContent;
                busy = true;
                b.classList.add('busy');
                b.textContent = 'drawing…';
                setStatus('asking ' + modelEl.value + ' for a scene… usually 30–90 seconds', 'busy');
                try {
                    const data = await apiCall({
                        model: modelEl.value,
                        max_tokens: 16000,
                        system: SYS_SCENE,
                        messages: [{ role: 'user', content: 'Make the scene: ' + promptText }],
                    });
                    const r = await sceneLand(animParse(textOf(data)));
                    if (!r) {
                        setStatus('kept your drawing — the scene was not opened');
                        return;
                    }
                    setStatus('“' + r.name + '”: ' + r.shapes + ' shapes, ' + r.made + ' morph' + (r.made === 1 ? '' : 's') + (r.added ? ', ' + r.added + ' poses copied' : '') + '. One undo stills it; change it, the strip and the timeline tweak it; link shares it.');
                    animChangeBtn.disabled = !morphRunning();
                    if (data.stop_reason === 'max_tokens')
                        flashStatus('the scene ran long — some of it may be missing');
                } catch (e) {
                    const msg = e && e.message ? e.message : 'the scene failed';
                    setStatus(/failed to fetch/i.test(msg) ? 'could not reach the gateway — check the connection' : msg, 'err');
                } finally {
                    busy = false;
                    b.classList.remove('busy');
                    b.textContent = label;
                }
            }
            const sceneBtn = $('aiScene');
            if (sceneBtn)
                sceneBtn.addEventListener('click', makeScene);

            // ── Vision: critique ──
            // Claude looks at the RENDERED canvas — not the sketch, not the source — and
            // answers as an art director. Seeing the pixels is the point: a mangled wing
            // or a muddy palette is invisible in coordinates and obvious in a picture.
            async function critique() {
                if (busy)
                    return;
                if (!ensureKey())
                    return;
                if (!state.subpaths.length) {
                    setStatus('nothing on the canvas to critique yet', 'err');
                    return;
                }
                busy = true;
                critBtn.disabled = true;
                critBtn.textContent = 'looking…';
                setStatus('rendering the canvas and asking ' + modelEl.value + '…', 'busy');
                try {
                    const data = await apiCall({
                        model: modelEl.value,
                        max_tokens: 700,
                        system: 'You are a concise, constructive art director reviewing a flat vector illustration. Plain text only — no markdown, no headings, no bullets.',
                        messages: [{
                            role: 'user',
                            content: [
                            imgBlock(scenePngB64(768)),
                            {
                                type: 'text',
                                text: 'Critique this drawing briefly: composition, palette, readability — what works, what does not. Then give exactly three concrete, specific improvements, one sentence each, numbered 1–3. Under 140 words total.'
                            },
                            ],
                        }],
                    });
                    critEl.textContent = textOf(data).trim();
                    critEl.style.display = 'block';
                    critEl.scrollTop = 0;
                    setStatus('');
                } catch (e) {
                    const msg = e && e.message ? e.message : 'critique failed';
                    setStatus(/failed to fetch/i.test(msg) ? 'could not reach the gateway — check the connection' : msg, 'err');
                } finally {
                    busy = false;
                    critBtn.disabled = false;
                    critBtn.textContent = 'critique';
                }
            }
            critBtn.addEventListener('click', critique);

            // ── Vision: check & fix the last generation ──
            // The self-correcting loop: the model is shown the rendered canvas beside its
            // own SVG source and returns a corrected document, which replaces the last
            // generation's shapes IN PLACE (found by fileTag) and lands the same way the
            // original did — loadSvg for add/replace, placeBackground with the SAME rect
            // for backgrounds. Anything typed in the prompt box steers the fix; an empty
            // or unchanged box means "fix whatever doesn't match the prompt".
            async function refine() {
                if (busy || !lastGen)
                    return;
                if (!ensureKey())
                    return;
                const note = promptEl.value.trim();
                const steer = (note && note !== lastGen.prompt) ? note : '';
                busy = true;
                fixBtn.disabled = true;
                fixBtn.textContent = 'fixing…';
                setStatus('showing ' + modelEl.value + ' its own work…', 'busy');
                try {
                    const data = await apiCall({
                        model: modelEl.value,
                        max_tokens: 16000,
                        system: lastGen.mode === 'bg' ? SYS + '\n\n' + SYS_BG : SYS,
                        messages: [{
                            role: 'user',
                            content: [
                            imgBlock(scenePngB64(768)),
                            {
                                type: 'text',
                                text:
                                'You previously generated an SVG for the prompt: "' + lastGen.prompt + '". '
                                + 'The attached image is the current rendered canvas'
                                + (lastGen.mode === 'bg' ? ' (your work is the background layer; the foreground shapes on top are not yours to redraw).' : ' (other shapes may appear alongside yours).')
                                + '\n\nYour previous SVG source:\n' + lastGen.svg
                                + '\n\nReturn a corrected, improved COMPLETE <svg> document under the same rules, to REPLACE your previous one entirely. '
                                + (steer
                                ? 'The user asks specifically: ' + steer
                                : 'Compare the render against the prompt and fix what falls short: malformed or unrecognizable shapes, bad overlaps, muddy colours, poor composition. Keep what already works.'),
                            },
                            ],
                        }],
                    });
                    const svg = svgOf(textOf(data));
                    // Swap: pull the old generation's shapes, then land the new one exactly
                    // the way the original arrived.
                    clearSelectionsForLoad();
                    state.subpaths = state.subpaths.filter(sp => sp.fileTag !== lastGen.fileTag);
                    if (lastGen.mode === 'bg') {
                        placeBackground(svg, lastGen.label, lastGen.bgRect);
                    } else {
                        loadSvg(svg, lastGen.label, state.subpaths.length > 0);
                    }
                    lastGen = Object.assign({}, lastGen, {
                        svg,
                        fileTag: (lastGen.mode === 'bg' ? 'ai-bg' : lastGen.label) + '#' + state._fileSeq,
                    });
                    setStatus('');
                    closeAllPops();
                    // Only the background path keeps history across the swap (placeBackground
                    // pushes; loadSvg resets the stack, same as any file load) — so only it
                    // may promise an undo.
                    if (lastGen.mode === 'bg')
                        flashStatus('revised — the previous background was replaced (undo brings it back)');
                    else
                        flashStatus('revised — the previous version was replaced');
                } catch (e) {
                    const msg = e && e.message ? e.message : 'fix failed';
                    setStatus(/failed to fetch/i.test(msg) ? 'could not reach the gateway — check the connection' : msg, 'err');
                } finally {
                    busy = false;
                    fixBtn.disabled = !lastGen;
                    fixBtn.textContent = 'check & fix last';
                }
            }
            fixBtn.addEventListener('click', refine);

            // ── From a picture: draw from it, or trace it and let Claude keep the subject ──
            // Both read the one attached picture. The image goes up as JPEG, longest side 1024,
            // so a photograph costs a few hundred kB rather than a few MB through the gateway.
            const imgPickBtn = $('aiImgPick'),
                imgFileEl = $('aiImgFile'),
                imgNameEl = $('aiImgName'),
                fromImgBtn = $('aiFromImg'),
                cleanBtn = $('aiCleanTrace');
            let pictureFile = null;
            async function pictureB64(file, maxPx) {
                const bmp = await createImageBitmap(file);
                const s = Math.min(1, (maxPx || 1024) / Math.max(bmp.width, bmp.height));
                const c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(bmp.width * s));
                c.height = Math.max(1, Math.round(bmp.height * s));
                const g = c.getContext('2d');
                g.fillStyle = '#ffffff';
                g.fillRect(0, 0, c.width, c.height);
                g.drawImage(bmp, 0, 0, c.width, c.height);
                if (bmp.close)
                    bmp.close();
                return {
                    b64: c.toDataURL('image/jpeg', 0.86).split(',')[1],
                    w: c.width,
                    h: c.height
                };
            }
            const jpegBlock = b64 => ({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: b64
                }
            });
            function setPicture(f) {
                pictureFile = f || null;
                if (imgNameEl)
                    imgNameEl.textContent = f ? f.name : 'no picture';
                if (fromImgBtn)
                    fromImgBtn.disabled = !f;
                if (cleanBtn)
                    cleanBtn.disabled = !f;
            }
            if (imgPickBtn && imgFileEl) {
                imgPickBtn.addEventListener('click', () => imgFileEl.click());
                imgFileEl.addEventListener('change', () => {
                    const f = imgFileEl.files && imgFileEl.files[0];
                    if (f)
                        setPicture(f);
                    imgFileEl.value = '';
                });
            }
            const SYS_IMG = [
            'This request comes with a PICTURE. Draw it as vector art under the rules above.',
            '- Follow the picture: same subject, same proportions, same placement. Map the picture onto the 1000-box with its longer side spanning the box and its aspect kept.',
            '- Simplify into confident closed shapes; leave out what the picture does not show, and do not add scenery it does not have.',
            '- If the user names a subject, draw only that; otherwise draw the main subject and leave the background out.',
            ].join('\n');

            async function drawFromPicture() {
                if (busy || !pictureFile)
                    return;
                if (!ensureKey())
                    return;
                const note = promptEl.value.trim();
                busy = true;
                fromImgBtn.disabled = true;
                fromImgBtn.textContent = 'drawing…';
                setStatus('showing ' + modelEl.value + ' the picture… usually 15–60 seconds', 'busy');
                try {
                    const pic = await pictureB64(pictureFile, 1024);
                    const data = await apiCall({
                        model: modelEl.value,
                        max_tokens: 16000,
                        system: SYS + '\n\n' + SYS_IMG,
                        messages: [{
                            role: 'user',
                            content: [jpegBlock(pic.b64),
                            {
                                type: 'text',
                                text: 'From this picture, draw: ' + (note || 'its main subject, as clean closed shapes')
                            }]
                        }],
                    });
                    const svg = svgOf(textOf(data));
                    const nm = pictureFile.name.replace(/\.[^.]+$/, '');
                    const label = 'ai from ' + (nm.length > 24 ? nm.slice(0, 24) + '…' : nm);
                    const mode = modeEl.value === 'replace' ? 'replace' : 'add';
                    clearSelectionsForLoad();
                    loadSvg(svg, label, mode === 'add');
                    lastGen = {
                        svg,
                        prompt: 'from the attached picture' + (note ? ': ' + note : ''),
                        mode,
                        label,
                        bgRect: null,
                        fileTag: label + '#' + state._fileSeq
                    };
                    fixBtn.disabled = false;
                    setStatus('');
                    closeAllPops();
                    if (data.stop_reason === 'max_tokens')
                        flashStatus('drawn (ran long — part of the picture may be missing)');
                } catch (e) {
                    const msg = e && e.message ? e.message : 'drawing from the picture failed';
                    setStatus(/failed to fetch/i.test(msg) ? 'could not reach the gateway — check the connection' : msg, 'err');
                } finally {
                    busy = false;
                    fromImgBtn.disabled = !pictureFile;
                    fromImgBtn.textContent = 'draw from picture';
                }
            }
            if (fromImgBtn)
                fromImgBtn.addEventListener('click', drawFromPicture);

            // The traced loops as Claude sees them: every loop stroked in its own colour on white,
            // its number at a point inside it, fitted to 900 px. Loops are numbered by their
            // index on the page, which is the order the tracer left them (largest first).
            const TRACE_ASK_MAX = 80;
            function numberedTraceB64(idx) {
                let mnx = Infinity,
                    mny = Infinity,
                    mxx = -Infinity,
                    mxy = -Infinity;
                for (const i of idx) {
                    const sp = state.subpaths[i];
                    for (let k = 0; k < sp.leafX.length; k++) {
                        mnx = Math.min(mnx, sp.leafX[k]);
                        mxx = Math.max(mxx, sp.leafX[k]);
                        mny = Math.min(mny, sp.leafY[k]);
                        mxy = Math.max(mxy, sp.leafY[k]);
                    }
                }
                const S = 900,
                    pad = 30,
                    sc = (S - 2 * pad) / Math.max(mxx - mnx, mxy - mny, 1e-9);
                const c = document.createElement('canvas');
                c.width = S;
                c.height = S;
                const g = c.getContext('2d');
                g.fillStyle = '#ffffff';
                g.fillRect(0, 0, S, S);
                const X = x => pad + (x - mnx) * sc,
                    Y = y => pad + (mxy - y) * sc;
                idx.forEach((i, n) => {
                    const sp = state.subpaths[i],
                        hue = (n * 137.5) % 360;
                    g.strokeStyle = 'hsl(' + hue + ',70%,40%)';
                    g.lineWidth = 2;
                    g.beginPath();
                    for (let k = 0; k < sp.leafX.length; k++) {
                        const x = X(sp.leafX[k]),
                            y = Y(sp.leafY[k]);
                        k ? g.lineTo(x, y) : g.moveTo(x, y);
                    }
                    g.closePath();
                    g.stroke();
                    // the label goes at the leaf nearest the loop's vertex mean, nudged inward: inside thin loops too
                    let ax = 0,
                        ay = 0;
                    for (let k = 0; k < sp.leafX.length; k++) {
                        ax += sp.leafX[k];
                        ay += sp.leafY[k];
                    }
                    ax /= sp.leafX.length;
                    ay /= sp.leafY.length;
                    let best = 0,
                        bd = Infinity;
                    for (let k = 0; k < sp.leafX.length; k++) {
                        const d = Math.hypot(sp.leafX[k] - ax, sp.leafY[k] - ay);
                        if (d < bd) {
                            bd = d;
                            best = k;
                        }
                    }
                    const lx = X(sp.leafX[best] + 0.25 * (ax - sp.leafX[best])),
                        ly = Y(sp.leafY[best] + 0.25 * (ay - sp.leafY[best]));
                    g.font = 'bold 15px sans-serif';
                    g.textAlign = 'center';
                    g.textBaseline = 'middle';
                    g.lineWidth = 4;
                    g.strokeStyle = '#ffffff';
                    g.strokeText(String(i), lx, ly);
                    g.fillStyle = 'hsl(' + hue + ',70%,30%)';
                    g.fillText(String(i), lx, ly);
                });
                return c.toDataURL('image/png').split(',')[1];
            }
            async function traceAndClean() {
                if (busy || !pictureFile)
                    return;
                if (!ensureKey())
                    return;
                const note = promptEl.value.trim();
                busy = true;
                cleanBtn.disabled = true;
                cleanBtn.textContent = 'tracing…';
                try {
                    await loadImageFile(pictureFile); // the editor's own tracer; replaces the page, pushes history
                    const idx = state.subpaths.map((sp, i) => i).filter(i => state.subpaths[i] && state.subpaths[i].source === 'trace').slice(0, TRACE_ASK_MAX);
                    if (!idx.length) {
                        setStatus('the tracer found nothing to keep in this picture', 'err');
                        return;
                    }
                    if (idx.length === 1) {
                        setStatus('one loop traced — nothing to clean up');
                        return;
                    }
                    cleanBtn.textContent = 'asking…';
                    setStatus('traced ' + idx.length + ' loops · asking ' + modelEl.value + ' which are the subject…', 'busy');
                    const pic = await pictureB64(pictureFile, 1024);
                    const data = await apiCall({
                        model: modelEl.value,
                        max_tokens: 2000,
                        system: 'You help clean up an automatic trace of a picture. You are shown the picture and the traced loops, each outlined in its own colour with its number. '
                        + 'Decide which loops belong to the subject (keep them, including loops that are holes inside the subject, such as an eye or the gap between an arm and a body) and which are background, noise or texture (drop them). '
                        + 'Reply with ONLY a JSON object: {"keep":[{"id":<number>,"name":"<short name>"}, ...]} — no prose, no markdown.',
                        messages: [{
                            role: 'user',
                            content: [
                            jpegBlock(pic.b64), imgBlock(numberedTraceB64(idx)),
                            {
                                type: 'text',
                                text: 'The first image is the picture; the second is its trace, loops numbered ' + idx.join(', ') + '. '
                                + (note ? 'The subject is: ' + note + '.' : 'Keep the main subject.')
                            }]
                        }],
                    });
                    const txt = textOf(data),
                        a = txt.indexOf('{'),
                        z = txt.lastIndexOf('}');
                    if (a < 0 || z < a)
                        throw new Error('the model did not return a keep list — try again');
                    let keep;
                    try {
                        keep = JSON.parse(txt.slice(a, z + 1)).keep;
                    } catch (e) {
                        throw new Error('the keep list did not parse — try again');
                    }
                    if (!Array.isArray(keep) || !keep.length)
                        throw new Error('the model kept nothing — say what the subject is in the box and try again');
                    const names = new Map();
                    for (const k of keep)
                        if (k && Number.isInteger(+k.id) && idx.includes(+k.id))
                            names.set(+k.id, String(k.name || '').slice(0, 60));
                    if (!names.size)
                        throw new Error('the keep list named no traced loop — try again');
                    clearSelectionsForLoad();
                    state.subpaths = state.subpaths.filter((sp, i) => !idx.includes(i) || names.has(i));
                    // name what was kept; the first kept loop leads the figure's group
                    let lead = null;
                    state.subpaths.forEach(sp => {
                        if (sp.source !== 'trace')
                            return;
                        sp.groupLead = false;
                        if (!lead)
                            lead = sp;
                    });
                    const orig = idx.filter(i => names.has(i));
                    let j = 0;
                    state.subpaths.forEach(sp => {
                        if (sp.source === 'trace' && j < orig.length) {
                            const nmk = names.get(orig[j++]);
                            if (nmk)
                                sp.gname = nmk;
                        }
                    });
                    if (lead)
                        lead.groupLead = true;
                    state.lastLoadInfo = {
                        totalElements: state.subpaths.length,
                        multiSubpath: state.subpaths.length > 1,
                        subpathCount: state.subpaths.length
                    };
                    rebuildSignalSelect();
                    applyShapeSelection(new Set());
                    fitToView();
                    drawAll();
                    pushHistory();
                    if (typeof scheduleSave === 'function')
                        scheduleSave();
                    setStatus('');
                    closeAllPops();
                    flashStatus('trace cleaned up — kept ' + names.size + ' of ' + idx.length + ' loops (' + [...names.values()].filter(Boolean).slice(0, 4).join(', ')
                    + (names.size > 4 ? ', …' : '') + ') · undo brings the full trace back');
                } catch (e) {
                    const msg = e && e.message ? e.message : 'clean-up failed';
                    setStatus(/failed to fetch/i.test(msg) ? 'could not reach the gateway — check the connection' : msg, 'err');
                } finally {
                    busy = false;
                    cleanBtn.disabled = !pictureFile;
                    cleanBtn.textContent = 'trace & clean up';
                }
            }
            if (cleanBtn)
                cleanBtn.addEventListener('click', traceAndClean);

            // ── Prompt polish ──
            // A thin prompt ("dragon") gets the median dragon. This rewrites it into
            // the four-slot form that reliably works — subject, composition, style,
            // palette — on the cheap fast model, and puts the result back in the box
            // for the user to edit. It never draws; it only sharpens the ask.
            const polishBtn = $('aiPolish');
            async function polish() {
                if (busy)
                    return;
                if (!ensureKey())
                    return;
                const promptText = promptEl.value.trim();
                if (!promptText) {
                    setStatus('type a rough prompt first — even one word', 'err');
                    promptEl.focus();
                    return;
                }
                busy = true;
                polishBtn.disabled = true;
                polishBtn.textContent = 'improving…';
                setStatus('sharpening the prompt on the fast model…', 'busy');
                try {
                    const data = await apiCall({
                        model: 'claude-haiku-4-5',
                        max_tokens: 300,
                        system: 'You improve image-generation prompts for a flat vector poster-art generator. Reply with ONLY the improved prompt — one line, no quotes, no commentary. Expand it into: subject + composition (placement, viewpoint) + style (a named poster/print idiom) + palette (3–4 named tones). Keep the user’s subject; invent the rest boldly.',
                        messages: [{
                            role: 'user',
                            content: promptText
                        }],
                    });
                    const out = textOf(data).trim().replace(/^["']|["']$/g, '');
                    if (out) {
                        promptEl.value = out;
                        setStatus('prompt improved — edit freely, then generate');
                    }
                    else
                        setStatus('the model returned nothing — try again', 'err');
                } catch (e) {
                    setStatus(e && e.message ? e.message : 'polish failed', 'err');
                } finally {
                    busy = false;
                    polishBtn.disabled = false;
                    polishBtn.textContent = 'improve prompt';
                }
            }
            if (polishBtn)
                polishBtn.addEventListener('click', polish);

            // ── AI recolor ──
            // Claude as an editor of PROPERTIES rather than an author of shapes: it is
            // handed the shape list (index, fill, stroke) and returns only new colors,
            // as JSON. No geometry can move, the whole change is one undo step, and a
            // bad palette costs a re-roll rather than a redraw.
            const recolorBtn = $('aiRecolor');
            async function recolor() {
                if (busy)
                    return;
                if (!ensureKey())
                    return;
                if (!state.subpaths.length) {
                    setStatus('nothing on the canvas to recolor', 'err');
                    return;
                }
                const mood = promptEl.value.trim();
                if (!mood) {
                    setStatus('type a mood in the prompt box — "autumn dusk", "neon night"…', 'err');
                    promptEl.focus();
                    return;
                }
                busy = true;
                recolorBtn.disabled = true;
                recolorBtn.textContent = 'recoloring…';
                setStatus('asking for a palette: ' + (mood.length > 40 ? mood.slice(0, 40) + '…' : mood), 'busy');
                try {
                    const lines = state.subpaths.map((sp, i) =>
                    i + ' · fill ' + (sp.fill ? sp.fill.color : 'none') + ' · stroke ' + (sp.stroke || 'none')).join('\n');
                    const data = await apiCall({
                        model: modelEl.value,
                        max_tokens: 4000,
                        system: 'You recolor flat vector artworks. Reply with ONLY a JSON array, no code fences, no commentary: [{"i":<index>,"fill":"#rrggbb"|null,"stroke":"#rrggbb"|null}, ...] — one entry per shape given, solid hex only, null to leave that slot unchanged. Choose a coherent palette for the requested mood; respect figure/ground (backgrounds recede).',
                        messages: [{
                            role: 'user',
                            content: 'Mood: ' + mood + '\n\nShapes:\n' + lines
                        }],
                    });
                    const text = textOf(data);
                    const a = text.indexOf('['),
                        z = text.lastIndexOf(']');
                    if (a < 0 || z < 0)
                        throw new Error('no JSON in the reply — try again');
                    const arr = JSON.parse(text.slice(a, z + 1));
                    let touched = 0;
                    for (const e of arr) {
                        const sp = state.subpaths[e.i];
                        if (!sp)
                            continue;
                        if (e.fill) {
                            sp.fill = {
                                color: e.fill,
                                opacity: sp.fill && sp.fill.opacity != null ? sp.fill.opacity : 1
                            };
                            touched++;
                        }
                        if (e.stroke) {
                            sp.stroke = e.stroke;
                            touched++;
                        }
                    }
                    if (!touched)
                        throw new Error('the reply changed nothing — try a more specific mood');
                    if (!state.showFills) {
                        state.showFills = true;
                        const t = $('tFills');
                        if (t)
                            t.checked = true;
                    }
                    refreshScrollerThumbs();
                    pushHistory(); // one undo restores the old palette
                    scheduleSave();
                    drawAll();
                    setStatus('');
                    closeAllPops();
                    flashStatus('recolored — ' + touched + ' paint slots changed (one undo restores)');
                } catch (e) {
                    setStatus(e && e.message ? e.message : 'recolor failed', 'err');
                } finally {
                    busy = false;
                    recolorBtn.disabled = false;
                    recolorBtn.textContent = 'recolor';
                }
            }
            if (recolorBtn)
                recolorBtn.addEventListener('click', recolor);

            // ── ×3 variations ──
            // One prompt, three parallel generations, tiled as a contact sheet. Taste
            // is discovered by looking: three committed answers beat one negotiated
            // one, and the grid layout already knows how to seat multiple files.
            const varyBtn = $('aiVary');
            async function variations() {
                if (busy)
                    return;
                if (!ensureKey())
                    return;
                const promptText = promptEl.value.trim();
                if (!promptText) {
                    setStatus('describe what to draw first', 'err');
                    promptEl.focus();
                    return;
                }
                busy = true;
                varyBtn.disabled = true;
                varyBtn.textContent = 'generating…';
                setStatus('three parallel takes on: ' + (promptText.length > 36 ? promptText.slice(0, 36) + '…' : promptText), 'busy');
                const ANGLES = [
                'Take a bold, graphic, high-contrast interpretation.',
                'Take a soft, detailed, layered interpretation.',
                'Take an unexpected compositional angle — crop, viewpoint, or framing the other takes would not choose.',
                ];
                try {
                    const results = await Promise.allSettled(ANGLES.map(a2 => apiCall({
                        model: modelEl.value,
                        max_tokens: 16000,
                        system: SYS,
                        messages: [{
                            role: 'user',
                            content: 'Draw: ' + promptText + '\n\n' + a2
                        }],
                    })));
                    const short = promptText.length > 22 ? promptText.slice(0, 22) + '…' : promptText;
                    let landed = 0;
                    clearSelectionsForLoad();
                    for (let i2 = 0; i2 < results.length; i2++) {
                        if (results[i2].status !== 'fulfilled')
                            continue;
                        try {
                            const svg = svgOf(textOf(results[i2].value));
                            loadSvg(svg, 'ai v' + (i2 + 1) + ': ' + short, true);
                            landed++;
                        } catch (_) {}
                    }
                    if (!landed)
                        throw new Error('all three takes failed — try again');
                    setStatus('');
                    closeAllPops();
                    flashStatus(landed + ' of 3 variations landed — pick the winner, delete the rest');
                } catch (e) {
                    setStatus(e && e.message ? e.message : 'variations failed', 'err');
                } finally {
                    busy = false;
                    varyBtn.disabled = false;
                    varyBtn.textContent = '×3 variations';
                }
            }
            if (varyBtn)
                varyBtn.addEventListener('click', variations);
};
