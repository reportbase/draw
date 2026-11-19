// WHAT A FLOW SCRIPT HAS (19 Nov 2026): the library (TVF_FLOW) and, since the "K, not N" flow, the curve library too
// (TVF_CORE, tvf-core.js), so a flow can read a drawing at its leaves and rebuild it as the editor would. Both are
// plain scripts that set a global in a page; under Node they are run in a context and their globals handed over here.
// The tool that compiles a flow and the checks that open one call this first.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export async function flowEnv() {
  if (!globalThis.TVF_FLOW) await import('../tvf-flow.js');
  if (!globalThis.TVF_CORE) {
    const ctx = { module: { exports: {} } }; vm.createContext(ctx);
    vm.runInContext(await readFile(ROOT + 'tvf-core.js', 'utf8'), ctx, { filename: 'tvf-core.js' });
    globalThis.TVF_CORE = ctx.module.exports;
  }
  return globalThis.TVF_FLOW;
}
