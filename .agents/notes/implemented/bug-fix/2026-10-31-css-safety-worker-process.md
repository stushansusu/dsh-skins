# Agent Note: CSS safety transform runs in a short-lived worker process

Status: implemented

## Problem

The skin center's CSS safety pipeline imported lightningcss at the top level of the host half (`src/core/css-safety/transform.ts`). lightningcss ships a native addon, so loading that module mapped `lightningcss.win32-x64-msvc.node` into the DSH host process.

Windows refuses to replace a mapped file. While the host held the addon, every plugin install through the plugin manager failed with `[ERR_PNPM_EPERM] ... rename 'lightningcss-win32-x64-msvc_tmp_...' -> 'lightningcss-win32-x64-msvc'` — the host blocked its own plugin installs, reproducibly, for as long as it ran (issue #98).

A lazy load inside the transform would only postpone the failure: the addon is still mapped in the host process as soon as any skin stylesheet is served, which is exactly what a skin activation does.

## Decision

The transform runs in a short-lived worker process, and the host half never imports lightningcss.

- Module split: `src/core/css-safety/errors.ts` and `src/core/css-safety/types.ts` carry the contract without any lightningcss import; `src/core/css-safety/transform.ts` keeps the algorithm and is reachable only through the new `./css-safety` export; `src/core/css-safety/host-transform.ts` is the host scheduler; `src/core/css-safety/worker-entry.ts` is the child entry point.
- One worker per request: the host forks the worker (`child_process.fork`, `ELECTRON_RUN_AS_NODE=1`, `execArgv: []`), resolves its path from the module URL rather than the working directory, and asks it for one stylesheet over IPC. The worker loads lightningcss, answers, and exits.
- Settlement waits for the exit: after the answer (result, whitelist violation or failure) the host terminates the worker if it is still running and settles the request only after the worker process has exited, so no transform outlives its response.
- The pipeline belongs to ONE plugin mount: the mount creates the scheduler, injects its transform into the route factory and disposes it with the mount. A remount therefore gets its own pipeline, and the old mount's disposal cannot disable the new one. The process exit hook is shared by the live pipelines and is removed when the last one is disposed, so a remount never accumulates listeners.
- Bounded pipeline: the pipeline serializes requests and holds at most eight of them — the running one and every waiting one alike. A request beyond that cap is refused immediately with a typed overload error (503 at the HTTP layer), never parked in an unbounded queue.
- Bounded failures: every request carries a ten-second budget that covers the queue wait, the transform and the settlement. It also covers a worker that answered but refuses to exit: the late answer is never turned into a result, and a worker that cannot be killed cannot make the request hang. A worker that cannot be spawned fails the request at once instead of waiting for the budget.
- Disposal: disposing the pipeline rejects the queued requests, terminates the active worker, awaits its exit and leaves no worker behind.
- Consumers: the package root no longer exports the transform; CLI and market consumers use the dedicated `./css-safety` subpath, and the market build falls back to the package root for older published packages.

The whitelist failure mode is unchanged: a whitelist violation is a 422 with the violation list, every other transform failure is a 500. A violation is recognized by the stable kind marker plus a violations list, so an unrelated error that merely carries a `violations` array stays a 500 instead of a misleading 422.

## Alternatives considered

**Load lightningcss lazily inside the host process.** The first transform would still map the addon into the host, and the mapping would stay until the host exits. It converts a boot-time failure into a skin-activation-time failure, which is harder to diagnose and still blocks installs.

**Cache the transform result in the host process.** A private cache would avoid repeated work but not the mapping: the first transform still loads the addon in the host process. It also changes the pipeline's contract (stale results) without touching the reported failure.

**Keep one persistent worker alive.** A long-lived worker keeps the addon mapped for the whole session, which is the same failure with an extra process to supervise. It would only be acceptable if the addon could be unloaded, which the native module cannot do.

**Run the transform in the host process on non-Windows platforms.** Two code paths mean two behaviors to keep in sync, and the reported failure is not the only platform where a mapped file is a problem. One path is easier to reason about than two.

## Consequences

- The host process no longer loads lightningcss, so a package manager can replace the parser package while the host runs. The `tests/css-safety-worker.spec.ts` probe pins this: it serves a stylesheet through the built host bundle in a separate process and asserts that no lightningcss module appears in the process.
- Accepted residual window: while one transform is running, the worker process holds the addon, and a package install in that exact window still sees a mapped addon on Windows. The window is one stylesheet transform long; the host process itself never holds it.
- The stylesheet route is asynchronous. The HTTP answers are unchanged (200 with the same bytes, 422 for a whitelist violation, 500 for a transform failure), but a request now waits for a worker round trip instead of blocking the host's event loop.
- A burst beyond eight stylesheet requests is refused with 503 for the requests beyond the cap; the client has to retry them.
- The CLI and the market build read the transform from `./css-safety`; the package root keeps the contract surface (validation, catalog, provenance) and the scheduler class.
