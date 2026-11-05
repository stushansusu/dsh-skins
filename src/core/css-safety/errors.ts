/**
 * CSS safety error types (lightningcss-free).
 *
 * The host half and the worker half must agree on what a failure means, but
 * the host half may not import anything that reaches lightningcss (issue
 * #98). These error classes therefore live in their own module: the worker
 * raises them, the host re-raises them from the IPC answer, and the HTTP
 * layer maps them (whitelist violation -> 422, overloaded -> 503, everything
 * else -> 500).
 * @module @linxin666/dsh-client-ui-skin-center/css-safety/errors
 */

/**
 * The stable kind marker of a whitelist violation.
 *
 * The worker and the transform live in DIFFERENT bundles, so an
 * `instanceof` check cannot see the same class identity. The kind marker is
 * a plain string that both bundles agree on, which is what lets the worker
 * tell a whitelist violation from any other error.
 */
export const SKIN_CSS_SAFETY_ERROR_KIND = 'SkinCssSafetyError'

/** Violation of the CSS whitelist. Always fatal (fail-closed). */
export class SkinCssSafetyError extends Error {
  override readonly name = SKIN_CSS_SAFETY_ERROR_KIND
  /** The stable marker the worker classifies on (bundle-independent). */
  readonly kind = SKIN_CSS_SAFETY_ERROR_KIND
  readonly violations: string[]
  constructor(message: string, violations: string[]) {
    super(message)
    this.violations = violations
  }
}

/**
 * The transform could not be produced at all: the worker crashed, the
 * request timed out, or the pipeline was disposed. Distinct from a whitelist
 * violation, which is a rejected stylesheet rather than a broken pipeline.
 */
export class SkinCssTransformFailureError extends Error {
  // Typed as string so the narrower subclasses below can name themselves.
  override readonly name: string = 'SkinCssTransformFailureError'
  /** The stable marker of this error family. */
  readonly kind: string = 'SkinCssTransformFailureError'
}

/**
 * The pipeline already holds as many requests as it may. The request is
 * refused immediately instead of waiting for a free slot.
 */
export class SkinCssOverloadedError extends SkinCssTransformFailureError {
  override readonly name: string = 'SkinCssOverloadedError'
  override readonly kind = 'SkinCssOverloadedError'
}

/** The transform did not finish inside the per-request budget. */
export class SkinCssTransformTimeoutError extends SkinCssTransformFailureError {
  override readonly name: string = 'SkinCssTransformTimeoutError'
  override readonly kind = 'SkinCssTransformTimeoutError'
}

/** The pipeline was disposed before the request could run. */
export class SkinCssWorkerDisposedError extends SkinCssTransformFailureError {
  override readonly name: string = 'SkinCssWorkerDisposedError'
  override readonly kind = 'SkinCssWorkerDisposedError'
}

/**
 * Whether an error is a whitelist violation.
 *
 * The check is deliberately strict: the stable kind marker AND a violations
 * list. An error that merely carries a `violations` array (a lookalike from
 * another library, or a differently named failure) is NOT a whitelist
 * violation and must not be answered with 422.
 * @param error - the thrown value.
 * @returns true when the error is a whitelist violation.
 */
export function isSkinCssSafetyViolation(error: unknown): error is SkinCssSafetyError {
  if (typeof error !== 'object' || error === null) return false
  const candidate = error as { kind?: unknown; violations?: unknown }
  if (candidate.kind !== SKIN_CSS_SAFETY_ERROR_KIND) return false
  return Array.isArray(candidate.violations)
}
