# The labs

Moved here from `CLAUDE.md` (12 Nov 2026), unchanged: the dated notes of what was built, with the names to search for in the code. `CLAUDE.md` keeps the rules; read this before working on this part.

## labs.html and labs/

- `labs.html`: every lab in the drawer, by heading, with what it does and a
`draw.html?lab=CODE` link that runs it. **Generated** by `npm run labs`
(`tools/build-labs.mjs` reads the lab buttons off the live editor); after adding, renaming
or re-describing a lab in `draw.html`, run it, or `npm test` fails.
**The labs are leaving `draw.html`** (28 Oct 2026, Tom: "all the labs can ultimately be pulled from draw.html. its
already too big", then "agreed, proceed"): first measured, then written down (`papers/labs.md`), then moved to
`labs/*.js` loaded only when asked (Tom: "batch them"). **`labs/`** (28 Oct 2026): every lab group in the drawer (56
of its 57 headings; the paint modes are the editor's own), in 54 files named for their headings (`number-tests.js`, `stream-bank.js`, `contact-walker.js`, …;
`sheets.js` holds the sheets, two fisheyes on one array and readers within readers, one block): a moved lab's code, line for line and in the editor's indent, inside one
function handed over as `(window.TVF_LABS = window.TVF_LABS || {})[name] = function () { … }`. The editor
(THE LABS THAT LIVE IN labs/, beside `makeRng`) evaluates that function's text by a direct `eval` inside its own
closure, so the code reads every editor name as it did in the page and wires its own buttons; a script tag, not a
fetch, so the page still works from disk. `LAB_FILES` maps a lab's data-code to its file; the first press on its
button (the drawer's, or `?lab=`'s, which presses it too) is held by a capturing listener while the file loads
and runs, then given back. Moving a lab: a line in `LAB_FILES`, its lines cut to `labs/<name>.js` with the
header the first one has, and a pointer comment where they were. Code several labs share (`makeRng`, `labComb`)
stays in the editor. Hook `window.__labFiles` (`files`, `load(name)`, `state`). The ones moved are the groups
whose code is their own, reached from their own button and named nowhere else (a group's closure from its
button, less what the editor or another group reaches); each was run before and after (`tools/run-labs.mjs`) and
reports the same cells, verdicts and status lines (the sheets, which report none, open with the same text). A
moved lab's `window.runX = runX` console hook moves with it, and its names leave the editor's `window.__lab`
object and go back on it when its file loads (`Object.assign(window.__lab, …)` at the file's end). Code that
waited in the page for DOMContentLoaded waits in a file for the end of that file (`labAfterLoad(f)`, queued and
run after the eval; the sheets'). The second batch split the morph bar's wiring block from the labs' (the labs'
handlers each their own top-level block). The contact walker's state (`_walk`) and its overlay stay in the editor,
which draws it every frame; the keyboard sheet's tracing (`keyboardSheet`, `glyphContoursEm`) stays because the
emoji sheet traces with it, and its font list (`kbdFontList`) because the drawer shows it before any file loads.
The walker runs on its own timers, so it is not deterministic run to run: it was checked by behaviour (thousands
of looks, a lap certified, no errors) rather than by exact state. A cut takes a piece's comment block with it; one stops at the piece's last code line, so a
free-standing comment after it (a section header, a pointer) stays. What stays in the editor even when only labs use
it: code copied word for word elsewhere (the depth code's `depthLearnedFacing` and `depthEnterWhereNeeded`, which
the gallery's inspector, depth and where-to-stand pages copy from here) and code two moved files share
(`tbLeaves`, `pathoShape`, `_shapePrep`, `_firstMeet`, `_occSeen`, `_inside`: the sheets, occlusion and
encounters). Before cutting a file, check that no name it declares is used by another file in labs/, and that
no name only labs/ declares is used by the editor; the smoke test's steps that call a moved lab's runner
(`runDecoderVectors()`, …) load its file first with `__labFiles.load(name)`.
`tools/measure-labs.mjs` splits the main script into its top-level pieces and finds what only the labs reach
(by name, as `build-player.mjs` does; `window.__lab`, the `window.runX` exports and the lab deep link count as
the labs'): about 10,000 of 83,000 lines, 18,000 with the blocks that wire a lab and something else
(`MIXED=lab`), and the names a moved lab would need from the editor; since the labs moved it also counts `labs/`. `tools/run-labs.mjs out.json [codes…]` runs
every lab headless (`draw.html?lab=CODE`) and keeps what it reports: `window.__flashLog` (the last 40 status
lines, kept by `flashStatus`) and `window.__lastLadder` (the last sheet's name and each cell's caption and
verdict, kept by `labLadder`). The labs' seeded stream `makeRng`/`makeRngCentered` is defined in `draw.html`
(beside `$`): the library's copy is inside `tvf-core.js`'s closure, which 3d and games copy unchanged, and twenty
labs had stopped on it since 9 Oct. It multiplies in 32-bit integers (`Math.imul`, 28 Oct 2026): written as a
float product it passed 2⁵³, lost its low bits and cycled after about 10,500 values from seed 8191, which made
`lib` and `whr` fail their own tolerances; every lab was run again (`papers/labs.md`, "The run again, after the
generator"). The library's copy in `tvf-core.js` was mended the same way (Tom: "both"), and with it the copies in 3d and
games (their PRs follow draw's merge, since their Draw sync checks compare with draw's `main`); so were
`gallery/growth.html`'s `rng` (its organisms are the same kinds, other instances: brain coral 572 nodes, was 558;
the front page's thumbnail is the old one, drawn by hand) and the perturbed circle's harmonics in `levels.html`.
The faults `papers/labs.md` found were dealt with the same day: `rec`'s claim 5 now drops a tick and decodes the
string; `frn` judges each response in floors of the figure's own (1.5 held, 3 broke, set after seeing the data);
`bhm` says its seams are exact by construction; `dpt`'s departing circle is the library's 160-point polygon.

## Labs from the essays

**Labs from the essays** (29 Oct 2026, Tom: "take a look at the wander project, the paper/essays. is there any labs
we should do from our essays?", then "1,2,3"): three claims wander's essays argue in prose, put to the library, each
group's note in the drawer holding its predictions as written before the first run (`papers/labs.md` §§55–57):
`avd` (`labs/averaging-directions.js`, essay 3's "to average, average the angle": the mean angle of readings from a
height returns atan(m/(1+γ)), not m; nothing killed), `jnf` (`labs/joining-the-facings.js`, essay 10's four facings
joined without their sizes, by continuity; one of three killed, by my bound) and `ssl` (`labs/size-sets-the-level.js`,
essay 4's "n places, about log₂ n levels"; two of three killed, with readings after the run marked as such). The
smoke test runs all three from `?lab=`. What the results ask of the essays is Tom's to rule in wander.
