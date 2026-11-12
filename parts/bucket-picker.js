// THE BUCKET PICKER, moved out of draw.html line for line (12 Nov 2026, Tom: "1,2,3,4,5,6", the fifth being "keep
// splitting draw.html").
//
// What it holds: the bucket picker: listing a flare bucket and loading files from it (?bucket=, ?bucket=NAME&file=…).
//
// This file does not run on its own. It hands its code to the editor as one function, and the editor evaluates that
// function's text inside its own closure, at the place in its script where these lines stood (PARTS OF THE EDITOR IN
// parts/, in draw.html), so every name the code uses is the editor's, as it was when the code sat there, and it runs
// at the same moment of the page's start as it did. Unlike a lab's file it is not loaded when asked for: the page
// names it in a <script src> before its own script, since what is here is wired at the start. Edit it as you would
// the editor: the same voice, the same indent. The comment that introduced the block is still in draw.html, above
// the line that runs it.
(window.TVF_PARTS = window.TVF_PARTS || {})['bucket-picker'] = function () {
            const BUCKET_API = 'https://flare.tangent.workers.dev';
            const BUCKETS = ['BUCKET1'];
            // What THIS build can hang. Everything else is listed but greyed and skipped —
            // field's own note applies: being wrong in that direction costs a ticked row the
            // loader ignores, and being wrong the other way hides an object you came for.
            const BPK_LOADABLE = /\.(svg|tvf)$/i;

            const BP = {
                open: false,
                bucket: BUCKETS[0],
                filter: '',
                objects: [],
                // as listed, name-sorted
                sel: new Set(),
                // object names
                known: BUCKETS.slice(),
                // chips: the constant, plus anything drilled into
                append: false,
                // add to the scene, or replace it
                status: '',
                ms: 0,
                busy: false,
            };

            const _url = (bucket, o) => o.downloadUrl ||
            (BUCKET_API + '/bucket?bucket=' + encodeURIComponent(bucket) + '&key=' + encodeURIComponent(o.name));
            async function bucketList(bucket) {
                const listURL = BUCKET_API + '/bucket?bucket=' + encodeURIComponent(bucket);
                const r = await fetch(listURL);
                if (!r.ok)
                    throw new Error('list HTTP ' + r.status + ' — wrong bucket API?');
                let data;
                try {
                    data = await r.json();
                }
                catch (_) {
                    throw new Error('list is not JSON — endpoint is not the bucket API');
                }
                if (!data.success)
                    throw new Error(data.error || 'bucket list failed');
                return data.objects || [];
            }
            // A CONTAINER, conservatively — field.html's rule, kept verbatim in spirit: an
            // explicit prefix, or a name with no extension AND no bytes. Anything with a size or
            // an extension is an object, whatever the extension is.
            const _isDir = o => /\/$/.test(o.name || '')
            || (!/\.[a-z0-9]{1,6}$/i.test(o.name || '') && !(o.size > 0));
            const _size = b => {
                if (!b)
                    return '0 B';
                const u = ['B', 'KB', 'MB', 'GB'],
                    i = Math.min(3, Math.floor(Math.log(b) / Math.log(1024)));
                return (b / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + u[i];
            };

            // ── INGEST ────────────────────────────────────────────────────────────────
            // Fetch every ticked object as TEXT, then hand each to the loader that already
            // exists for its kind — `loadSvg` for .svg, `loadTvfFiles` for .tvf. Nothing about
            // parsing is reimplemented here; a bucket object arrives at exactly the same door a
            // dropped file does, which is why a file that loads from disk loads from a bucket.
            //
            // THE FIRST ONE REPLACES, THE REST APPEND — the same rule loadSvgFiles follows for a
            // multi-file drop, unless you have asked for append, in which case nothing on the
            // page is disturbed at all.
            // ⚠ NOT setStatus. There is a function by that name in this file and it is NOT the
            // app's — it belongs to the AI popover's own IIFE and writes to that popover's little
            // status element. Grepping for the name found it and the scope hid the mistake until
            // it ran: `setStatus is not defined`. The app's line is `$('status')`, written
            // directly for progress and through flashStatus for a message that should fade.
            const say = msg => {
                const el = $('status');
                if (el)
                    el.textContent = msg || '';
            };
            async function bucketIngest(bucket, objects) {
                const files = objects.filter(o => BPK_LOADABLE.test(o.name));
                if (!files.length) {
                    flashStatus('nothing loadable ticked — this build takes .svg and .tvf');
                    return;
                }
                const skipped = objects.length - files.length;
                let append = !!BP.append,
                    done = 0,
                    failed = 0;
                if (!append)
                    clearSelectionsForLoad();
                for (const o of files) {
                    try {
                        say('fetching ' + o.name + '…');
                        const r = await fetch(_url(bucket, o));
                        if (!r.ok)
                            throw new Error('HTTP ' + r.status);
                        const text = await r.text();
                        // One frame between fetch and parse, so the status line paints — a large .svg
                        // parses synchronously for hundreds of ms and the window would otherwise look
                        // hung at exactly the moment it is doing the work you asked for.
                        say('parsing ' + o.name + '…');
                        await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
                        if (/\.tvf$/i.test(o.name))
                            loadTvfFiles([{
                                name: o.name,
                                __text: text
                            }], append);
                        else
                            loadSvg(text, o.name, append, true);
                        append = true; // whatever the first one did, the rest join it
                        done++;
                    } catch (e) {
                        failed++;
                        console.warn('[bucket] failed', o.name, e);
                    }
                }
                flashStatus(done + ' of ' + files.length + ' loaded from ' + bucket
                + (failed ? ' · ' + failed + ' failed (see console)' : '')
                + (skipped ? ' · ' + skipped + ' skipped (not .svg or .tvf)' : ''));
                scheduleSave();
            }

            // ── THE PANEL ─────────────────────────────────────────────────────────────
            // One state object, one render. Every action mutates BP and calls render; render
            // rebuilds from BP and nothing else. There is no partial update and no sync function
            // to forget to call.
            const _el = () => {
                let el = document.getElementById('bucketPicker');
                if (el)
                    return el;
                el = document.createElement('div');
                el.id = 'bucketPicker';
                el.hidden = true;
                document.body.appendChild(el);
                return el;
            };
            const _shown = () => {
                const q = BP.filter.trim().toLowerCase();
                return q ? BP.objects.filter(o => o.name.toLowerCase().includes(q)) : BP.objects;
            };
            function bpRender() {
                const el = _el();
                el.hidden = !BP.open;
                if (!BP.open)
                    return;
                const shown = _shown();
                const selBytes = BP.objects.reduce((n, o) => n + (BP.sel.has(o.name) ? (o.size || 0) : 0), 0);
                el.textContent = '';

                const head = document.createElement('div');
                head.className = 'bpk-head';
                const bucket = document.createElement('input');
                bucket.type = 'text';
                bucket.value = BP.bucket;
                bucket.spellcheck = false;
                bucket.title = 'bucket name — Enter to list it';
                bucket.addEventListener('keydown', e => {
                    e.stopPropagation(); // the field owns its keys, not the canvas
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        BP.bucket = e.target.value.trim() || BUCKETS[0];
                        bpList();
                    }
                });
                const find = document.createElement('input');
                find.type = 'search';
                find.value = BP.filter;
                find.placeholder = 'filter';
                find.addEventListener('keydown', e => e.stopPropagation());
                find.addEventListener('input', e => {
                    BP.filter = e.target.value;
                    bpRender();
                });
                const close = document.createElement('button');
                close.type = 'button';
                close.textContent = '✕';
                close.title = 'close';
                close.addEventListener('click', () => {
                    BP.open = false;
                    bpRender();
                });
                head.append(bucket, find, close);

                const chips = document.createElement('div');
                chips.className = 'bpk-chips';
                for (const b of BP.known) {
                    const c = document.createElement('button');
                    c.type = 'button';
                    c.className = 'bpk-chip' + (b === BP.bucket ? ' on' : '');
                    c.textContent = b;
                    c.addEventListener('click', () => {
                        BP.bucket = b;
                        bpList();
                    });
                    chips.appendChild(c);
                }

                const list = document.createElement('div');
                list.className = 'bpk-list';
                for (const o of shown) {
                    const dir = _isDir(o),
                        ok = BPK_LOADABLE.test(o.name),
                        on = BP.sel.has(o.name);
                    const row = document.createElement('button');
                    row.type = 'button';
                    row.className = 'bpk-row' + (on ? ' on' : '') + (dir ? ' dir' : '') + (!dir && !ok ? ' odd' : '');
                    row.title = dir ? 'open ' + o.name
                    : o.name + (ok ? '' : ' — not .svg or .tvf; the loader will skip it');
                    const tick = document.createElement('span');
                    tick.className = 'tk';
                    tick.textContent = dir ? '›' : (on ? '☑' : '☐');
                    const nm = document.createElement('span');
                    nm.className = 'nm';
                    nm.textContent = o.name;
                    const mt = document.createElement('span');
                    mt.className = 'mt';
                    mt.textContent = dir ? 'open' : _size(o.size);
                    row.append(tick, nm, mt);
                    row.addEventListener('click', () => {
                        if (dir) {
                            if (!BP.known.includes(BP.bucket))
                                BP.known.push(BP.bucket);
                            BP.bucket = o.name;
                            if (!BP.known.includes(o.name))
                                BP.known.push(o.name);
                            bpList();
                        } else {
                            if (on)
                                BP.sel.delete(o.name);
                            else
                                BP.sel.add(o.name);
                            bpRender();
                        }
                    });
                    list.appendChild(row);
                }

                const foot = document.createElement('div');
                foot.className = 'bpk-foot';
                const btn = (label, title, fn, dis, cls) => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.textContent = label;
                    b.title = title;
                    b.disabled = !!dis;
                    if (cls)
                        b.className = cls;
                    b.addEventListener('click', fn);
                    return b;
                };
                foot.append(
                btn(BP.sel.size ? 'load ' + BP.sel.size : 'load', 'fetch and open the ticked objects',
                () => bpLoad(BP.objects.filter(o => BP.sel.has(o.name))), !BP.sel.size || BP.busy),
                btn('all', 'every .svg and .tvf in this bucket',
                () => bpLoad(BP.objects.filter(o => BPK_LOADABLE.test(o.name))), !BP.objects.length || BP.busy),
                btn(shown.length && shown.every(o => BP.sel.has(o.name) || _isDir(o)) ? 'none' : 'tick all',
                'select or clear every object the filter is showing (containers are skipped)', () => {
                    const all = shown.filter(o => !_isDir(o));
                    const has = all.every(o => BP.sel.has(o.name));
                    for (const o of all) {
                        if (has)
                            BP.sel.delete(o.name);
                        else
                            BP.sel.add(o.name);
                    }
                    bpRender();
                }, !shown.length), // APPEND OR REPLACE, said before the load rather than discovered after it. The
                // default is replace, which is what every other load in this app does.
                btn(BP.append ? 'append' : 'replace',
                BP.append ? 'add to the scene already on the page' : 'clear the scene first, as load .svg does',
                () => {
                    BP.append = !BP.append;
                    bpRender();
                }, false, BP.append ? 'on' : ''),
                btn('⎘', 'dump the listing to the console', () => console.log('[bucket] ' + BP.bucket, BP.objects)),
                );
                const note = document.createElement('span');
                note.className = 'bpk-note';
                note.textContent = BP.status || (shown.length + '/' + BP.objects.length + ' objects'
                + (BP.ms ? ' · listed in ' + BP.ms + 'ms' : '')
                + (selBytes ? ' · ' + _size(selBytes) + ' ticked' : ''));
                foot.appendChild(note);

                el.append(head, chips, list, foot);
            }
            async function bpList() {
                BP.busy = true;
                BP.objects = [];
                BP.sel.clear();
                BP.status = 'listing ' + BP.bucket + ' …';
                bpRender();
                const t0 = performance.now();
                try {
                    BP.objects = (await bucketList(BP.bucket)).sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, {
                        numeric: true,
                        sensitivity: 'base'
                    }));
                    BP.ms = Math.round(performance.now() - t0);
                    const files = BP.objects.filter(o => !_isDir(o)).length;
                    // A listing that is all containers is a normal answer here, not an empty one: it
                    // means this level holds buckets rather than files.
                    BP.status = BP.objects.length && !files
                    ? BP.objects.length + ' buckets/prefixes — click one to open it' : '';
                } catch (e) {
                    BP.ms = Math.round(performance.now() - t0);
                    BP.status = 'failed: ' + (e.message || e); // verbatim: this is a debug tool
                    console.warn('[bucket] list failed:', e);
                }
                BP.busy = false;
                bpRender();
            }
            function bpLoad(objects) {
                if (!objects || !objects.length)
                    return;
                BP.open = false;
                bpRender();
                bucketIngest(BP.bucket, objects);
            }
            function bpOpen(bucket) {
                if (bucket) {
                    BP.bucket = bucket;
                    if (!BP.known.includes(bucket))
                        BP.known.push(bucket);
                }
                BP.open = true;
                bpRender();
                if (!BP.objects.length || (bucket && bucket !== BP.bucket))
                    bpList();
            }
            const btnEl = $('bLoadBucket');
            if (btnEl)
                btnEl.addEventListener('click', () => {
                    closeMenu();
                    if (BP.open) {
                        BP.open = false;
                        bpRender();
                    } else
                        bpOpen();
                });
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && BP.open) {
                    BP.open = false;
                    bpRender();
                }
            });
            try {
                window.tvfBucket = {
                    state: BP,
                    open: bpOpen,
                    list: bpList,
                    load: bpLoad,
                    render: bpRender,
                    api: BUCKET_API
                };
            } catch (_) {}

            // ── THE DEEP LINK — ?bucket=NAME&file=a.svg,b.tvf ────────────────────────
            // The picker is a hand tool: open it, look, tick, load. This is the same pipeline
            // named ahead of time, so a scene can be written down, bookmarked or shared — the
            // same argument as ?lab=, and it composes with it.
            //
            // `file` may name several, comma-separated. Omit it and the bucket is listed with the
            // panel open, which is the useful half when you do not yet know what is in there.
            async function boot() {
                let q;
                try {
                    q = new URLSearchParams(location.search);
                } catch (_) {
                    return;
                }
                const bucket = q.get('bucket');
                if (!bucket)
                    return;
                BP.bucket = bucket;
                if (!BP.known.includes(bucket))
                    BP.known.push(bucket);
                const want = (q.get('file') || '').split(',').map(s => s.trim()).filter(Boolean);
                if (!want.length) {
                    bpOpen(bucket);
                    return;
                }
                try {
                    const objects = await bucketList(bucket);
                    const byName = new Map(objects.map(o => [o.name, o]));
                    // Named but absent is worth saying out loud rather than loading the rest in
                    // silence: a link that half-works looks like a link that works.
                    const found = [],
                        missing = [];
                    for (const n of want) {
                        const o = byName.get(n) || objects.find(x => x.name.endsWith('/' + n));
                        if (o)
                            found.push(o);
                        else
                            missing.push(n);
                    }
                    if (missing.length)
                        flashStatus('not in ' + bucket + ': ' + missing.join(', '));
                    if (found.length)
                        bucketIngest(bucket, found);
                    else
                        bpOpen(bucket);
                } catch (e) {
                    flashStatus('bucket ' + bucket + ' failed: ' + (e.message || e));
                    console.warn('[bucket] deep link failed', e);
                }
            }
            // After the saved scene has restored, for the same reason ?lab= waits: a load that
            // replaces the page must not race the restore of the page it is replacing.
            if (document.readyState === 'complete')
                setTimeout(boot, 300);
            else
                window.addEventListener('load', () => setTimeout(boot, 300));
};
