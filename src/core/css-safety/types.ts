/**
 * CSS safety contracts shared by the host half and the worker half.
 *
 * These types carry no lightningcss import on purpose. The host half (the DSH
 * host process) must never pull the native addon into its own module graph
 * (issue #98); the worker half owns the transform itself. One shared
 * contract module keeps both halves speaking the same protocol without
 * linking them.
 * @module @linxin666/dsh-client-ui-skin-center/css-safety/types
 */

/** Options for one stylesheet transform. */
export interface SkinCssTransformOptions {
  /** Manifest id; becomes the html[data-dsh-skin="<id>"] scope value. */
  skinId: string
  /** Logical filename for error messages (e.g. "skin.css" / "patches.css"). */
  filename?: string
  /**
   * Append automatic fallback tints for official tokens the skin does not
   * remap (see ./fallback.ts). Only the main stylesheet derives; patches
   * must not re-derive or their partial token view would override the
   * skin's real values.
   */
  deriveFallbacks?: boolean
}

/** One transformed stylesheet plus the diagnostics the pipeline produced. */
export interface SkinCssTransformResult {
  code: string
  warnings: string[]
}

/** Host -> worker request: transform one stylesheet. */
export interface SkinCssWorkerRequest {
  type: 'transform'
  css: string
  options: SkinCssTransformOptions
}

/**
 * Worker -> host answer.
 *
 * A violation is the whitelist failing closed (a 422 at the HTTP layer); a
 * failure is anything else (a 500): a parse error, a crashed worker, a
 * timeout.
 */
export type SkinCssWorkerResponse =
  | { type: 'result'; code: string; warnings: string[] }
  | { type: 'violation'; message: string; violations: string[] }
  | { type: 'failure'; message: string }

/**
 * Worker -> host handshake.
 *
 * The worker announces itself only after its message listener is attached, so
 * the host never sends a request into a child that cannot hear it.
 */
export interface SkinCssWorkerReady {
  type: 'ready'
}

/** Every message a worker sends to the host. */
export type SkinCssWorkerMessage = SkinCssWorkerReady | SkinCssWorkerResponse
