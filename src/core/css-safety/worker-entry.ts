/**
 * CSS safety worker process (issue #98).
 *
 * This file is the entry point of the short-lived worker that serves ONE
 * stylesheet transform. It is the only place where lightningcss is loaded:
 * the host half forks this bundle, sends one request over IPC, and waits for
 * the process to exit. The native addon therefore lives in this process and
 * never in the DSH host process.
 *
 * The worker loads the transform bundle from its own module URL (never from
 * the process working directory) and answers with the transformed CSS, a
 * whitelist violation, or a failure.
 * @module @linxin666/dsh-client-ui-skin-center/css-safety/worker-entry
 */

import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { isSkinCssSafetyViolation } from './errors.ts'
import type { SkinCssTransformOptions, SkinCssTransformResult, SkinCssWorkerRequest, SkinCssWorkerResponse } from './types.ts'

/** The transform function exported by the css-safety bundle. */
type TransformFn = (css: string, options: SkinCssTransformOptions) => SkinCssTransformResult

/** Bundle file name that carries the transform (beside this worker bundle). */
const CSS_SAFETY_FILE = 'css-safety.js'

/**
 * The css-safety bundle surface the worker needs.
 *
 * The transform and the whitelist error class come from ONE module instance:
 * a duplicated bundle would give the error class a second identity, and the
 * worker could no longer tell a whitelist violation from a crash.
 */
interface CssSafetyModule {
  transformSkinCss: TransformFn
}

/**
 * Load the css-safety bundle.
 *
 * The bundle is resolved from this module's URL: the built package keeps it
 * beside the worker bundle, the source tree keeps it under lib/.
 * @returns the transform function.
 */
async function loadCssSafety(): Promise<CssSafetyModule> {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    // Built package: lib/css-safety-worker.js -> lib/css-safety.js
    join(here, CSS_SAFETY_FILE),
    // Source tree: src/core/css-safety/worker-entry.ts -> <package>/lib/...
    join(here, '..', '..', '..', 'lib', CSS_SAFETY_FILE),
  ]
  let lastError: unknown = null
  for (const candidate of candidates) {
    try {
      const mod = await import(pathToFileURL(candidate).href) as Partial<CssSafetyModule>
      if (typeof mod.transformSkinCss === 'function') return mod as CssSafetyModule
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`${CSS_SAFETY_FILE} not found beside the CSS safety worker`)
}

let cssSafetyPromise: Promise<CssSafetyModule> | null = null

/** Load the css-safety bundle once per worker process. */
function loadCssSafetyOnce(): Promise<CssSafetyModule> {
  cssSafetyPromise ??= loadCssSafety()
  return cssSafetyPromise
}

/**
 * Serve one request.
 * @param message - the host request (one stylesheet plus its options).
 */
async function serve(message: SkinCssWorkerRequest): Promise<void> {
  let response: SkinCssWorkerResponse
  try {
    const { transformSkinCss } = await loadCssSafetyOnce()
    const result = transformSkinCss(message.css, message.options)
    response = { type: 'result', code: result.code, warnings: result.warnings }
  } catch (error) {
    // Only a real whitelist violation is a violation: an error that merely
    // carries a violations array (a lookalike from another library) stays a
    // failure, so the host answers 500 instead of a misleading 422.
    if (isSkinCssSafetyViolation(error)) {
      response = {
        type: 'violation',
        message: error.message,
        violations: error.violations,
      }
    } else {
      response = { type: 'failure', message: error instanceof Error ? error.message : String(error) }
    }
  }
  // Answer first, leave second: the host waits for this process to exit, and
  // a flushed answer is what it settles on.
  process.send?.(response, () => { process.exit(0) })
}

// The listener is attached before the handshake, so the host never sends a
// request into a worker that cannot hear it.
process.on('message', (message: SkinCssWorkerRequest) => {
  if (!message || message.type !== 'transform') return
  void serve(message)
})

// A parent that dies closes the IPC channel: the worker must not outlive it,
// or an orphaned worker would keep the native addon mapped.
process.on('disconnect', () => { process.exit(0) })

process.send?.({ type: 'ready' })
