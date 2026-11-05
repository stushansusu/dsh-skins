/**
 * Host-side CSS safety scheduler (issue #98).
 *
 * The CSS safety pipeline needs lightningcss, whose Windows build ships a
 * native addon. A top-level import in the host half maps that addon into the
 * DSH host process, and Windows refuses to replace a mapped file: while the
 * host holds the addon, `pnpm add` fails with ERR_PNPM_EPERM when it
 * renames lightningcss-win32-x64-msvc.
 *
 * This module is the host half of the fix and never imports lightningcss.
 * Every request is served by a short-lived worker process that is forked for
 * that request alone, answers over IPC, and is terminated and awaited before
 * the stylesheet response settles. The native addon therefore exists only
 * inside the worker, and the host process holds no mapping at all.
 *
 * Rules:
 *  - one worker at a time: the pipeline serializes requests, so the addon
 *    exists in exactly one process at any moment;
 *  - at most SKIN_CSS_MAX_OUTSTANDING requests are held at once, the active
 *    one and every waiting one included; a request beyond that cap is
 *    refused immediately with a typed overload error;
 *  - every request carries a total budget (queue wait + transform +
 *    settlement) of SKIN_CSS_REQUEST_TIMEOUT_MS, which also covers a worker
 *    that answered but refuses to exit;
 *  - a request settles only after its worker process has exited, and a
 *    worker that cannot be killed still cannot make a request hang.
 *
 * Lifecycle: a scheduler belongs to ONE plugin mount. The mount creates it,
 * injects its transform into the route factory and disposes it with the
 * mount. A global singleton would be wrong here: the loader may mount a new
 * instance while the old one is still tearing down, and the old mount's
 * disposal must not disable the new mount.
 *
 * Residual window: while one transform runs, the worker holds the addon, so
 * a package install in that exact window still sees a mapped addon. The
 * window is one stylesheet transform long; the host process itself holds
 * nothing.
 * @module @linxin666/dsh-client-ui-skin-center/css-safety/host-transform
 */

import { fork } from 'node:child_process'
import type { ChildProcess, ForkOptions } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  SkinCssSafetyError,
  SkinCssTransformFailureError,
  SkinCssTransformTimeoutError,
  SkinCssOverloadedError,
  SkinCssWorkerDisposedError,
} from './errors.ts'
import type {
  SkinCssTransformOptions,
  SkinCssTransformResult,
  SkinCssWorkerMessage,
  SkinCssWorkerRequest,
  SkinCssWorkerResponse,
} from './types.ts'

/** Requests the pipeline holds at once, the active one included. */
export const SKIN_CSS_MAX_OUTSTANDING = 8

/** Total per-request budget in milliseconds (queue wait + transform + settlement). */
export const SKIN_CSS_REQUEST_TIMEOUT_MS = 10_000

/** Grace between the polite kill and the forceful one. */
export const SKIN_CSS_KILL_ESCALATION_MS = 500

/** How long a request may wait for a worker that refuses to die. */
export const SKIN_CSS_FORCE_SETTLE_MS = 1_500

/** Worker bundle file name inside the package lib/ directory. */
const WORKER_FILE = 'css-safety-worker.js'

/** How a worker process is started (overridable for tests). */
export type SkinCssFork = (modulePath: string, options: ForkOptions) => ChildProcess

/** One request waiting for (or holding) a worker. */
interface QueuedRequest {
  css: string
  options: SkinCssTransformOptions
  resolve: (result: SkinCssTransformResult) => void
  reject: (error: unknown) => void
  timer: ReturnType<typeof setTimeout> | null
  settled: boolean
}

/** The worker process currently serving one request. */
interface ActiveRun {
  child: ChildProcess
  request: QueuedRequest
  response: SkinCssWorkerResponse | null
  spawnError: Error | null
  timedOut: boolean
  disposed: boolean
  exited: boolean
  finished: boolean
  killTimer: ReturnType<typeof setTimeout> | null
  forceTimer: ReturnType<typeof setTimeout> | null
  exitWaiters: Array<() => void>
}

/** Scheduler knobs; the defaults are the shipped behavior. */
export interface SkinCssSchedulerOptions {
  /** Worker script path override (tests). */
  workerPath?: string
  /** Per-request total budget override (tests shorten it). */
  timeoutMs?: number
  /** Pipeline capacity override (tests shrink it). */
  maxOutstanding?: number
  /** Worker spawn override (tests drive the failure paths). */
  forkImpl?: SkinCssFork
}

/** Current pipeline counters (diagnostics and tests). */
export interface SkinCssSchedulerStats {
  /** Requests being transformed right now (0 or 1). */
  active: number
  /** Accepted requests waiting for the active one to finish. */
  pending: number
  /** Every request the pipeline holds, the active one included. */
  held: number
  /** The capacity the pipeline holds at most. */
  maxOutstanding: number
  /** Requests refused because the pipeline was full. */
  rejected: number
  /** Highest number of requests the pipeline ever held at once. */
  peakOutstanding: number
  /** Pid of the most recent worker process. */
  lastWorkerPid: number | null
  /** Whether the most recent worker process has exited. */
  lastWorkerExited: boolean
}

/**
 * The schedulers that currently hold a worker.
 *
 * The process exit hook is shared by all of them and installed only while
 * at least one scheduler is live, so a remount never accumulates listeners.
 */
const liveSchedulers = new Set<SkinCssScheduler>()
let exitHookInstalled = false

/** End every live worker's process when the host exits. */
function killLiveSchedulers(): void {
  for (const scheduler of liveSchedulers) scheduler.killActiveSync()
}

/** Register a scheduler and install the shared exit hook when it is the first. */
function registerScheduler(scheduler: SkinCssScheduler): void {
  liveSchedulers.add(scheduler)
  if (exitHookInstalled) return
  exitHookInstalled = true
  process.on('exit', killLiveSchedulers)
}

/** Unregister a scheduler and drop the shared exit hook when the last one goes. */
function unregisterScheduler(scheduler: SkinCssScheduler): void {
  liveSchedulers.delete(scheduler)
  if (liveSchedulers.size > 0 || !exitHookInstalled) return
  exitHookInstalled = false
  process.removeListener('exit', killLiveSchedulers)
}

/** Keep a pending timer from holding the host process open. */
function unrefTimer(timer: ReturnType<typeof setTimeout>): void {
  const handle = timer as unknown as { unref?: () => void }
  handle.unref?.()
}

/**
 * Locate the worker bundle.
 *
 * The worker is resolved from THIS module's URL, never from the process
 * working directory: the host may run from anywhere (a profile directory, a
 * service manager's cwd), and the worker must always be the sibling bundle
 * of the skin-center package that asked for it.
 * @returns the absolute path of the worker entry script.
 */
export function resolveSkinCssWorkerPath(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    // Built package: lib/index.js -> lib/css-safety-worker.js
    join(here, WORKER_FILE),
    // Source tree: src/core/css-safety/host-transform.ts -> <package>/lib/...
    join(here, '..', '..', '..', 'lib', WORKER_FILE),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  throw new SkinCssTransformFailureError(
    `skin CSS safety worker not found (${WORKER_FILE} beside the skin-center module)`,
  )
}

/**
 * The request pipeline: fork a worker per request, serialize the work, and
 * settle only after the worker process has exited.
 */
export class SkinCssScheduler {
  private readonly workerPath: string | null
  private readonly timeoutMs: number
  private readonly maxOutstanding: number
  private readonly forkImpl: SkinCssFork
  private readonly pending: QueuedRequest[] = []
  private active: ActiveRun | null = null
  private disposed = false
  private peakOutstanding = 0
  private rejected = 0
  private lastWorkerPid: number | null = null
  private lastWorkerExited = true

  constructor(options: SkinCssSchedulerOptions = {}) {
    this.workerPath = options.workerPath ?? null
    this.timeoutMs = options.timeoutMs ?? SKIN_CSS_REQUEST_TIMEOUT_MS
    this.maxOutstanding = options.maxOutstanding ?? SKIN_CSS_MAX_OUTSTANDING
    this.forkImpl = options.forkImpl ?? ((modulePath, forkOptions) => fork(modulePath, forkOptions))
  }

  /**
   * Transform one stylesheet through a short-lived worker process.
   * @param css - the raw stylesheet bytes.
   * @param options - the skin id, logical filename and fallback flag.
   * @returns the transformed stylesheet and the pipeline warnings.
   */
  transform(css: string, options: SkinCssTransformOptions): Promise<SkinCssTransformResult> {
    if (this.disposed) {
      return Promise.reject(new SkinCssWorkerDisposedError('skin CSS safety worker was disposed'))
    }
    // The cap covers EVERY held request, the active one and the waiting ones
    // alike. A request beyond the cap is refused now, not parked.
    if (this.heldCount() >= this.maxOutstanding) {
      this.rejected += 1
      return Promise.reject(new SkinCssOverloadedError(
        `skin CSS safety pipeline is full (${this.maxOutstanding} requests held)`,
      ))
    }
    return new Promise<SkinCssTransformResult>((resolve, reject) => {
      const request: QueuedRequest = { css, options, resolve, reject, timer: null, settled: false }
      request.timer = setTimeout(() => { this.onTimeout(request) }, this.timeoutMs)
      unrefTimer(request.timer)
      this.pending.push(request)
      this.peakOutstanding = Math.max(this.peakOutstanding, this.heldCount())
      this.pump()
    })
  }

  /** Current pipeline counters. */
  stats(): SkinCssSchedulerStats {
    return {
      active: this.active ? 1 : 0,
      pending: this.pending.length,
      held: this.heldCount(),
      maxOutstanding: this.maxOutstanding,
      rejected: this.rejected,
      peakOutstanding: this.peakOutstanding,
      lastWorkerPid: this.lastWorkerPid,
      lastWorkerExited: this.lastWorkerExited,
    }
  }

  /**
   * Stop the pipeline: queued work is rejected, the running worker is
   * terminated and awaited, and no worker is left behind.
   * @returns a promise that resolves once the active worker has exited.
   */
  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    const error = new SkinCssWorkerDisposedError('skin CSS safety worker was disposed')
    for (const request of this.pending.splice(0)) this.settle(request, error)
    const run = this.active
    if (run) {
      run.disposed = true
      this.terminate(run)
      await this.waitForExit(run)
      this.finish(run, error)
    }
    unregisterScheduler(this)
  }

  /** Terminate the running worker without waiting (process exit path). */
  killActiveSync(): void {
    if (this.active) this.terminate(this.active)
  }

  /** Requests the pipeline holds, the active one included. */
  private heldCount(): number {
    return this.pending.length + (this.active ? 1 : 0)
  }

  /** Admit waiting requests and start the next worker when the pipeline is free. */
  private pump(): void {
    if (this.disposed) return
    while (this.active === null && this.pending.length > 0) {
      const request = this.pending.shift() as QueuedRequest
      // A start that fails synchronously settles its own request; the loop
      // continues with the next one instead of stalling the pipeline.
      this.start(request)
    }
  }

  /** Fork one worker for one request. */
  private start(request: QueuedRequest): void {
    let workerPath: string
    try {
      workerPath = this.workerPath ?? resolveSkinCssWorkerPath()
    } catch (error) {
      this.settle(request, error)
      return
    }
    let child: ChildProcess
    try {
      child = this.forkImpl(workerPath, {
        // The DSH desktop host runs inside Electron: the worker must run as
        // plain node, and it must not inherit the host's V8 flags.
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        execArgv: [],
        stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
      })
    } catch (error) {
      // A synchronous fork failure (an unresolvable worker path) must not
      // leave the request waiting for its timeout.
      const detail = error instanceof Error ? error.message : String(error)
      this.settle(request, new SkinCssTransformFailureError(
        `skin CSS safety worker could not start: ${detail}`,
      ))
      return
    }
    const run: ActiveRun = {
      child,
      request,
      response: null,
      spawnError: null,
      timedOut: false,
      disposed: false,
      exited: false,
      finished: false,
      killTimer: null,
      forceTimer: null,
      exitWaiters: [],
    }
    this.active = run
    this.lastWorkerPid = child.pid ?? null
    this.lastWorkerExited = false
    registerScheduler(this)
    child.on('message', (message: SkinCssWorkerMessage) => { this.onMessage(run, message) })
    child.on('error', (error: Error) => { this.onError(run, error) })
    child.on('disconnect', () => { this.onDisconnect(run) })
    child.on('exit', () => { this.onExit(run) })
  }

  /** Handle one message from the worker. */
  private onMessage(run: ActiveRun, message: SkinCssWorkerMessage): void {
    if (message && message.type === 'ready') {
      // The worker is listening: send the request now.
      try {
        run.child.send({ type: 'transform', css: run.request.css, options: run.request.options } satisfies SkinCssWorkerRequest)
      } catch (error) {
        run.spawnError = error instanceof Error ? error : new Error(String(error))
        this.terminate(run)
      }
      return
    }
    run.response = message as SkinCssWorkerResponse
    // The worker has answered: end it now. The request settles only after the
    // exit event, so no transform outlives its response.
    this.terminate(run)
  }

  /**
   * The worker process failed.
   *
   * A spawn failure never produces an exit event, so the request must be
   * settled here; the pipeline advances at once.
   */
  private onError(run: ActiveRun, error: Error): void {
    run.spawnError = error
    if (run.child.pid === undefined) {
      // The process was never spawned: no exit will follow.
      this.finish(run, new SkinCssTransformFailureError(
        `skin CSS safety worker could not start: ${error.message}`,
      ))
      return
    }
    // A live worker errored: end it and let the exit settle the request.
    this.terminate(run)
  }

  /** The worker lost its IPC channel; it cannot answer any more. */
  private onDisconnect(run: ActiveRun): void {
    if (run.exited) return
    this.terminate(run)
  }

  /** End the worker process if it is still running. */
  private terminate(run: ActiveRun): void {
    if (run.exited) return
    if (run.child.exitCode !== null || run.child.signalCode !== null) return
    try {
      run.child.kill()
    } catch {
      // The process is already gone; the exit event settles the request.
    }
    if (run.killTimer !== null) return
    run.killTimer = setTimeout(() => {
      run.killTimer = null
      if (run.exited) return
      try {
        run.child.kill('SIGKILL')
      } catch {
        // The process is already gone.
      }
    }, SKIN_CSS_KILL_ESCALATION_MS)
    unrefTimer(run.killTimer)
  }

  /** The worker process exited: settle the request it served. */
  private onExit(run: ActiveRun): void {
    run.exited = true
    this.lastWorkerExited = true
    for (const waiter of run.exitWaiters.splice(0)) waiter()
    if (run.disposed) {
      this.finish(run, new SkinCssWorkerDisposedError('skin CSS safety worker was disposed'))
      return
    }
    if (run.timedOut) {
      this.finish(run, new SkinCssTransformTimeoutError(
        `skin CSS safety transform timed out after ${this.timeoutMs}ms`,
      ))
      return
    }
    if (run.response === null) {
      const detail = run.spawnError?.message ?? 'worker exited without a result'
      this.finish(run, new SkinCssTransformFailureError(`skin CSS safety worker failed: ${detail}`))
      return
    }
    try {
      this.finish(run, undefined, this.toResult(run.response))
    } catch (error) {
      this.finish(run, error)
    }
  }

  /**
   * Close one run: clear its timers, settle its request and free the slot.
   * @param run - the finished run.
   * @param error - the failure to report, if any.
   * @param result - the transform result, if the run succeeded.
   */
  private finish(run: ActiveRun, error?: unknown, result?: SkinCssTransformResult): void {
    if (run.finished) return
    run.finished = true
    if (run.killTimer !== null) {
      clearTimeout(run.killTimer)
      run.killTimer = null
    }
    if (run.forceTimer !== null) {
      clearTimeout(run.forceTimer)
      run.forceTimer = null
    }
    if (this.active === run) this.active = null
    if (!run.request.settled) {
      if (error !== undefined) this.settle(run.request, error)
      else this.settle(run.request, undefined, result)
    }
    this.pump()
  }

  /** Map one worker answer onto the host contract. */
  private toResult(response: SkinCssWorkerResponse | null | undefined): SkinCssTransformResult {
    if (!response || typeof response !== 'object') {
      throw new SkinCssTransformFailureError('skin CSS safety worker sent a malformed answer')
    }
    if (response.type === 'result') {
      return { code: response.code, warnings: response.warnings ?? [] }
    }
    if (response.type === 'violation') {
      throw new SkinCssSafetyError(response.message, response.violations ?? [])
    }
    throw new SkinCssTransformFailureError(response.message)
  }

  /**
   * The request ran out of budget.
   *
   * The budget covers the whole request, including a worker that answered
   * but refuses to exit: the late answer is never turned into a result.
   */
  private onTimeout(request: QueuedRequest): void {
    if (request.settled) return
    const run = this.active
    if (run && run.request === request) {
      if (run.timedOut) return
      run.timedOut = true
      this.terminate(run)
      // A worker that refuses to die must not hang the request. The run stays
      // active until it exits, so no second worker starts meanwhile.
      run.forceTimer = setTimeout(() => {
        run.forceTimer = null
        if (request.settled) return
        this.settle(request, new SkinCssTransformTimeoutError(
          `skin CSS safety transform timed out after ${this.timeoutMs}ms`,
        ))
      }, SKIN_CSS_FORCE_SETTLE_MS)
      unrefTimer(run.forceTimer)
      return
    }
    // Still waiting for a slot: drop the request from the queue.
    this.removeQueued(request)
    this.settle(request, new SkinCssTransformTimeoutError(
      `skin CSS safety transform timed out after ${this.timeoutMs}ms`,
    ))
    this.pump()
  }

  /** Remove a queued request from the pipeline. */
  private removeQueued(request: QueuedRequest): void {
    const index = this.pending.indexOf(request)
    if (index !== -1) this.pending.splice(index, 1)
  }

  /** Resolve or reject one request exactly once. */
  private settle(request: QueuedRequest, error?: unknown, result?: SkinCssTransformResult): void {
    if (request.settled) return
    request.settled = true
    if (request.timer) {
      clearTimeout(request.timer)
      request.timer = null
    }
    if (error !== undefined) request.reject(error)
    else request.resolve(result as SkinCssTransformResult)
  }

  /**
   * Resolve once the worker process has exited, or after a bounded grace.
   * @param run - the run to wait for.
   * @returns a promise that resolves on the exit or after the grace.
   */
  private waitForExit(run: ActiveRun): Promise<void> {
    if (run.exited) return Promise.resolve()
    return new Promise<void>((resolve) => {
      let done = false
      const settle = (): void => {
        if (done) return
        done = true
        clearTimeout(timer)
        resolve()
      }
      const timer = setTimeout(settle, SKIN_CSS_FORCE_SETTLE_MS)
      unrefTimer(timer)
      run.exitWaiters.push(settle)
    })
  }
}

/**
 * The pipeline used when no scheduler was injected.
 *
 * It exists for direct callers of the route factory (tests, tools). A plugin
 * mount creates its own scheduler instead, so a mount disposal can never
 * disable another mount.
 */
let defaultScheduler: SkinCssScheduler | null = null

/** The fallback transform used when the route factory gets no scheduler. */
export function defaultSkinCssTransform(
  css: string,
  options: SkinCssTransformOptions,
): Promise<SkinCssTransformResult> {
  defaultScheduler ??= new SkinCssScheduler()
  return defaultScheduler.transform(css, options)
}

/**
 * Stop the fallback pipeline (tests and tooling only).
 * @returns a promise that resolves once the active worker has exited.
 */
export async function disposeDefaultSkinCssWorkers(): Promise<void> {
  const scheduler = defaultScheduler
  defaultScheduler = null
  if (scheduler) await scheduler.dispose()
}
