/**
 * CSS safety worker tests (issue #98).
 *
 * The CSS safety pipeline runs in a short-lived worker process so the DSH
 * host never maps the lightningcss native addon. These tests pin the
 * properties that make that safe:
 *
 *  - the host half (source and built lib/index.js) cannot reach lightningcss;
 *  - the worker produces byte-identical output and maps violations and
 *    failures onto the same HTTP answers as the in-process pipeline;
 *  - the worker has exited before a request settles, and a timeout or a
 *    dispose leaves no orphan behind;
 *  - the pipeline serializes requests and holds a bounded number of them;
 *  - the lifecycle is per mount: disposing one mount never disables another;
 *  - no request can hang: a spawn failure, a post-answer hang and a full
 *    pipeline all settle with a typed error.
 *
 * The Windows rename probe reproduces the reported failure (ERR_PNPM_EPERM
 * while the addon is mapped) on a COPY of the package in a temp directory; it
 * never touches the real node_modules tree.
 *
 * Cleanup: temp trees are LEFT to the operating system. Nothing here deletes
 * a tree recursively: the rule is absolute, a recursive delete follows links,
 * and the cost of a leaked temp directory is far lower than the cost of
 * erasing the wrong tree.
 */

import { execFileSync, fork, spawn } from 'node:child_process'
import type { ForkOptions } from 'node:child_process'
import { EventEmitter } from 'node:events'
import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'

import {
  SkinCssSafetyError,
  SkinCssTransformFailureError,
  SkinCssTransformTimeoutError,
  SkinCssOverloadedError,
  isSkinCssSafetyViolation,
} from '../src/core/css-safety/errors.ts'
import {
  SkinCssScheduler,
  disposeDefaultSkinCssWorkers,
  resolveSkinCssWorkerPath,
} from '../src/core/css-safety/host-transform.ts'
import { transformSkinCss } from '../src/core/css-safety/transform.ts'
import { makeSkinCenterV2Routes, SKIN_CENTER_V2_PREFIX } from '../src/routes-v2.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(HERE, '..')
const REQUIRE = createRequire(import.meta.url)

/** A stylesheet that exercises scoping, tokens and nested rules. */
const SAMPLE_CSS = ':root { --dsw-alias-bg-base: #112233; }\n' +
  '.panel { color: red; }\n' +
  '@media (min-width: 10px) { .q { color: blue; } }\n'

/** A stylesheet that breaks the whitelist (@import is never allowed). */
const VIOLATING_CSS = '@import url("https://example.invalid/x.css");\n'

/** A stylesheet lightningcss cannot parse (a stray closing brace). */
const BROKEN_CSS = '}\n'

/**
 * A stub worker: the same IPC protocol as the real one, but without
 * lightningcss, so queue, timeout and dispose behavior can be driven
 * deterministically.
 */
const STUB_WORKER = [
  "import { appendFileSync } from 'node:fs'",
  "const mode = process.env.DSH_STUB_MODE ?? 'ok'",
  "const logFile = process.env.DSH_STUB_LOG ?? ''",
  "const pidFile = process.env.DSH_STUB_PID_FILE ?? ''",
  "const delay = Number(process.env.DSH_STUB_DELAY_MS ?? '10')",
  "const log = (line) => { if (logFile) appendFileSync(logFile, line + '\\n') }",
  "if (pidFile) appendFileSync(pidFile, String(process.pid) + '\\n')",
  "process.on('message', (message) => {",
  "  if (!message || message.type !== 'transform') return",
  "  log('start')",
  "  if (mode === 'hang') return",
  '  setTimeout(() => {',
  "    log('end')",
  "    process.send?.({ type: 'result', code: '/* stub */', warnings: [] }, () => process.exit(0))",
  '  }, delay)',
  '})',
  "process.on('disconnect', () => process.exit(0))",
  "process.send?.({ type: 'ready' })",
  '',
].join('\n')

/**
 * Create a temp directory.
 *
 * The directory is left to the operating system: no recursive delete ever
 * runs here (the rule is absolute), and a temp directory holds only files
 * this test wrote.
 * @param prefix - the temp directory prefix.
 * @returns the directory path.
 */
function makeTempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

/**
 * Assert that a tree holds no link and no real package path.
 *
 * The Windows probe copies a package tree; a link inside it would make the
 * copy reach outside the temp directory, and a path under node_modules would
 * mean the real installation was touched.
 * @param root - the tree to inspect.
 * @param forbidden - a path fragment that must not appear.
 */
function assertNoLinksAndNoForbiddenPath(root: string, forbidden: string): void {
  const stack = [root]
  while (stack.length > 0) {
    const current = stack.pop() as string
    const stats = lstatSync(current)
    expect(stats.isSymbolicLink(), `${current} must not be a link`).toBe(false)
    expect(current.includes(forbidden), `${current} must not live under ${forbidden}`).toBe(false)
    if (!stats.isDirectory()) continue
    for (const entry of readdirSync(current)) {
      stack.push(join(current, entry))
    }
  }
}

/**
 * Rename a directory, retrying while the operating system still holds the
 * mapping of a file inside it.
 * @param from - the current path.
 * @param to - the new path.
 */
async function renameWithRetry(from: string, to: string): Promise<void> {
  // The operating system releases the mapping a moment after the process is
  // gone; the rename is retried until it goes through.
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      renameSync(from, to)
      return
    } catch (error) {
      if (attempt === 99) throw error
      await new Promise((resolveWait) => setTimeout(resolveWait, 200))
    }
  }
}

/** Whether a process id is still alive. */
function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Write the stub worker into a temp directory and return its path. */
function writeStubWorker(dir: string): string {
  const path = join(dir, 'stub-worker.mjs')
  writeFileSync(path, STUB_WORKER)
  return path
}

/**
 * A fake child process for the failure paths the real one cannot be driven
 * into (a spawn error with no exit, a worker that answers and never dies).
 */
class FakeChild extends EventEmitter {
  pid: number | undefined
  exitCode: number | null = null
  signalCode: NodeJS.Signals | null = null
  killed = false
  sent: unknown[] = []

  constructor(pid: number | undefined) {
    super()
    this.pid = pid
  }

  send(message: unknown): boolean {
    this.sent.push(message)
    return true
  }

  kill(): boolean {
    this.killed = true
    return true
  }
}

afterEach(() => {
  // The temp trees stay with the operating system; only the environment
  // markers the stub worker reads are cleared here.
  delete process.env.DSH_STUB_LOG
  delete process.env.DSH_STUB_MODE
  delete process.env.DSH_STUB_PID_FILE
  delete process.env.DSH_STUB_DELAY_MS
  // The fallback pipeline (used when a route factory gets no injected
  // transform) is process-wide: it must not leak into the next test.
  void disposeDefaultSkinCssWorkers()
})

/**
 * Collect the static import graph of one source file.
 * @param file - the absolute path of the entry module.
 * @returns every module the entry reaches, plus the bare specifiers it uses.
 */
function collectImports(file: string): { modules: string[]; bare: string[] } {
  const modules: string[] = []
  const bare: string[] = []
  const seen = new Set<string>()
  const queue = [file]
  while (queue.length > 0) {
    const current = queue.shift() as string
    if (seen.has(current)) continue
    seen.add(current)
    if (!existsSync(current)) continue
    modules.push(current)
    const source = readFileSync(current, 'utf8')
    const pattern = /(?:from|import)\s*['"]([^'"]+)['"]/g
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1]
      if (!specifier) continue
      if (!specifier.startsWith('.')) {
        bare.push(specifier)
        continue
      }
      queue.push(resolve(dirname(current), specifier))
    }
  }
  return { modules, bare }
}

describe('css safety worker: host isolation', () => {
  it('never reaches lightningcss from the host entry', () => {
    const graph = collectImports(join(PACKAGE_ROOT, 'src', 'index.ts'))
    expect(graph.bare).not.toContain('lightningcss')
    const cssSafety = collectImports(join(PACKAGE_ROOT, 'src', 'core', 'css-safety', 'transform.ts'))
    expect(cssSafety.bare).toContain('lightningcss')
  })

  it('ships a built host bundle without a lightningcss import', () => {
    const built = readFileSync(join(PACKAGE_ROOT, 'lib', 'index.js'), 'utf8')
    expect(built).not.toMatch(/from\s*["']lightningcss["']/)
    expect(built).not.toMatch(/require\(\s*["']lightningcss["']\s*\)/)
    expect(readFileSync(join(PACKAGE_ROOT, 'lib', 'css-safety.js'), 'utf8')).toMatch(/from\s*["']lightningcss["']/)
    expect(existsSync(join(PACKAGE_ROOT, 'lib', 'css-safety-worker.js'))).toBe(true)
  })

  it('keeps lightningcss out of the host process while a skin is served', () => {
    const dir = makeTempDir('skin-css-probe-')
    const skinDir = join(dir, 'probe-skin')
    mkdirSync(skinDir, { recursive: true })
    writeFileSync(join(skinDir, 'skin.json'), JSON.stringify({
      skinManifestVersion: 2,
      id: 'probe-skin',
      name: 'probe',
      nameEn: 'probe',
      version: '1.0.0',
      author: 'test',
      contributes: { stylesheet: 'skin.css' },
    }))
    writeFileSync(join(skinDir, 'skin.css'), SAMPLE_CSS)
    const probe = join(dir, 'probe.mjs')
    writeFileSync(probe, [
      "import { createRequire } from 'node:module'",
      "import { pathToFileURL } from 'node:url'",
      'const [libPath, skinDir] = process.argv.slice(2)',
      'const require = createRequire(import.meta.url)',
      'const lib = await import(pathToFileURL(libPath).href)',
      'const lightning = () => [',
      "  ...Object.keys(require.cache).filter((key) => /lightningcss/i.test(key)),",
      '  ...process.moduleLoadList.filter((key) => /lightningcss/i.test(key)),',
      ']',
      'const before = lightning()',
      "const entry = { manifest: { id: 'probe-skin', contributes: { stylesheet: 'skin.css' } }, origin: 'builtin', dir: skinDir, warnings: [] }",
      'const routes = lib.makeSkinCenterV2Routes({ loadCatalog: () => ({ skins: [entry], diagnostics: [], capturedAt: 0 }) })',
      "const route = routes.find((item) => item.kind === 'prefix')",
      'let status = 0',
      "let body = ''",
      'const res = {',
      '  writeHead(code) { status = code },',
      "  end(payload) { body = typeof payload === 'string' ? payload : '' },",
      '}',
      "await route.handler({ url: '/api/skin-center/v2/skins/probe-skin/stylesheet', method: 'GET', headers: {} }, res)",
      'const after = lightning()',
      "console.log(JSON.stringify({ before, after, status, body }))",
      '',
    ].join('\n'))
    const output = execFileSync(process.execPath, [probe, join(PACKAGE_ROOT, 'lib', 'index.js'), skinDir], {
      encoding: 'utf8',
      cwd: dir,
      // A clean NODE_PATH keeps the probe on the package tree it must not
      // reach through.
      env: { ...process.env, NODE_PATH: '' },
    })
    const report = JSON.parse(output) as {
      before: string[]
      after: string[]
      status: number
      body: string
    }
    expect(report.before).toEqual([])
    expect(report.after).toEqual([])
    expect(report.status).toBe(200)
    expect(report.body).toContain('html[data-dsh-skin="probe-skin"]')
  })
})

describe('css safety worker: transform parity', () => {
  it('produces byte-identical output', async () => {
    const options = { skinId: 'demo', filename: 'skin.css', deriveFallbacks: true }
    const expected = transformSkinCss(SAMPLE_CSS, options)
    const scheduler = new SkinCssScheduler()
    try {
      const actual = await scheduler.transform(SAMPLE_CSS, options)
      expect(actual.code).toBe(expected.code)
      expect(actual.warnings).toEqual(expected.warnings)
    } finally {
      await scheduler.dispose()
    }
  })

  it('maps a whitelist violation onto the safety error', async () => {
    const options = { skinId: 'demo', filename: 'skin.css' }
    let expected: unknown = null
    try {
      transformSkinCss(VIOLATING_CSS, options)
    } catch (error) {
      expected = error
    }
    expect(expected).toBeInstanceOf(SkinCssSafetyError)
    const scheduler = new SkinCssScheduler()
    try {
      await expect(scheduler.transform(VIOLATING_CSS, options)).rejects.toBeInstanceOf(SkinCssSafetyError)
      const actual = await scheduler.transform(VIOLATING_CSS, options).catch((error: unknown) => error)
      expect((actual as SkinCssSafetyError).violations).toEqual((expected as SkinCssSafetyError).violations)
      expect((actual as SkinCssSafetyError).message).toBe((expected as SkinCssSafetyError).message)
    } finally {
      await scheduler.dispose()
    }
  })

  it('maps a broken stylesheet onto a transform failure', async () => {
    const options = { skinId: 'demo', filename: 'skin.css' }
    const scheduler = new SkinCssScheduler()
    try {
      await expect(scheduler.transform(BROKEN_CSS, options)).rejects.toBeInstanceOf(SkinCssTransformFailureError)
      await expect(scheduler.transform(BROKEN_CSS, options)).rejects.not.toBeInstanceOf(SkinCssSafetyError)
    } finally {
      await scheduler.dispose()
    }
  })

  it('answers the stylesheet route with 200 and 422', async () => {
    const dir = makeTempDir('skin-css-route-')
    const skinDir = join(dir, 'route-skin')
    mkdirSync(skinDir, { recursive: true })
    writeFileSync(join(skinDir, 'skin.css'), SAMPLE_CSS)
    writeFileSync(join(skinDir, 'bad.css'), VIOLATING_CSS)
    const entry = {
      manifest: {
        id: 'route-skin',
        contributes: { stylesheet: 'skin.css', patches: 'bad.css' },
      },
      origin: 'builtin' as const,
      dir: skinDir,
      warnings: [],
    }
    const scheduler = new SkinCssScheduler()
    const routes = makeSkinCenterV2Routes({
      loadCatalog: () => ({ skins: [entry], diagnostics: [], capturedAt: 0 }),
      transformCss: (css, options) => scheduler.transform(css, options),
    })
    const route = routes.find((item) => item.kind === 'prefix')

    const call = async (suffix: string): Promise<{ status: number; body: string }> => {
      let status = 0
      let body = ''
      const res = {
        writeHead(code: number) { status = code },
        end(payload?: string) { body = typeof payload === 'string' ? payload : '' },
      } as unknown as ServerResponse
      await route?.handler(
        { url: `${SKIN_CENTER_V2_PREFIX}/skins/route-skin/${suffix}`, method: 'GET', headers: {} } as unknown as IncomingMessage,
        res,
      )
      return { status, body }
    }

    const ok = await call('stylesheet')
    expect(ok.status).toBe(200)
    expect(ok.body).toContain('html[data-dsh-skin="route-skin"]')

    const violation = await call('patches')
    expect(violation.status).toBe(422)
    expect(JSON.parse(violation.body).error).toBe('css-whitelist-violation')
    await scheduler.dispose()
  })

  it('answers an overloaded pipeline with 503', async () => {
    const dir = makeTempDir('skin-css-route-overload-')
    const skinDir = join(dir, 'route-skin')
    mkdirSync(skinDir, { recursive: true })
    writeFileSync(join(skinDir, 'skin.css'), SAMPLE_CSS)
    const entry = {
      manifest: { id: 'route-skin', contributes: { stylesheet: 'skin.css' } },
      origin: 'builtin' as const,
      dir: skinDir,
      warnings: [],
    }
    const scheduler = new SkinCssScheduler({ maxOutstanding: 1 })
    const routes = makeSkinCenterV2Routes({
      loadCatalog: () => ({ skins: [entry], diagnostics: [], capturedAt: 0 }),
      transformCss: (css, options) => scheduler.transform(css, options),
    })
    const route = routes.find((item) => item.kind === 'prefix')
    // Fill the single slot, then ask for one more.
    const held = scheduler.transform('.a { color: red; }', { skinId: 'demo' })
    let status = 0
    let body = ''
    const res = {
      writeHead(code: number) { status = code },
      end(payload?: string) { body = typeof payload === 'string' ? payload : '' },
    } as unknown as ServerResponse
    await route?.handler(
      { url: `${SKIN_CENTER_V2_PREFIX}/skins/route-skin/stylesheet`, method: 'GET', headers: {} } as unknown as IncomingMessage,
      res,
    )
    expect(status).toBe(503)
    expect(JSON.parse(body).error).toBe('css-transform-overloaded')
    await held.catch(() => undefined)
    await scheduler.dispose()
  })
})

describe('css safety worker: error classification', () => {
  it('treats only the stable kind marker plus violations as a violation', () => {
    const real = new SkinCssSafetyError('nope', ['a'])
    expect(isSkinCssSafetyViolation(real)).toBe(true)
    // A lookalike that merely carries a violations array is a failure.
    const lookalike = Object.assign(new Error('nope'), { violations: ['a'] })
    expect(isSkinCssSafetyViolation(lookalike)).toBe(false)
    // The right name without the marker is not enough either.
    const namedOnly = Object.assign(new Error('nope'), { name: 'SkinCssSafetyError', violations: ['a'] })
    expect(isSkinCssSafetyViolation(namedOnly)).toBe(false)
    // The marker without a violations list is not a violation.
    const markerOnly = Object.assign(new Error('nope'), { kind: 'SkinCssSafetyError' })
    expect(isSkinCssSafetyViolation(markerOnly)).toBe(false)
    expect(isSkinCssSafetyViolation(new Error('plain'))).toBe(false)
    expect(isSkinCssSafetyViolation(null)).toBe(false)
  })
})

describe('css safety worker: pipeline', () => {
  it('resolves the worker from the module URL, not the working directory', () => {
    const worker = resolveSkinCssWorkerPath()
    expect(existsSync(worker)).toBe(true)
    expect(worker).toBe(join(PACKAGE_ROOT, 'lib', 'css-safety-worker.js'))
  })

  it('serializes requests and holds at most eight in the pipeline', async () => {
    const dir = makeTempDir('skin-css-queue-')
    const worker = writeStubWorker(dir)
    const log = join(dir, 'log.txt')
    process.env.DSH_STUB_LOG = log
    process.env.DSH_STUB_DELAY_MS = '20'
    const scheduler = new SkinCssScheduler({ workerPath: worker, timeoutMs: 10_000 })
    const results = await Promise.all(
      Array.from({ length: 8 }, () => scheduler.transform('.a { color: red; }', { skinId: 'demo' })),
    )
    expect(results.every((result) => result.code === '/* stub */')).toBe(true)
    const stats = scheduler.stats()
    expect(stats.peakOutstanding).toBe(8)
    expect(stats.held).toBe(0)
    // One worker at a time: the stub log alternates start/end.
    const lines = readFileSync(log, 'utf8').trim().split('\n')
    expect(lines.length).toBe(16)
    for (let index = 0; index < lines.length; index += 2) {
      expect(lines[index]).toBe('start')
      expect(lines[index + 1]).toBe('end')
    }
    await scheduler.dispose()
  }, 30_000)

  it('refuses the requests beyond the cap instead of parking them', async () => {
    const dir = makeTempDir('skin-css-overload-')
    const worker = writeStubWorker(dir)
    process.env.DSH_STUB_MODE = 'hang'
    const scheduler = new SkinCssScheduler({ workerPath: worker, timeoutMs: 30_000 })
    const accepted = Array.from({ length: 8 }, () => scheduler.transform('.a { color: red; }', { skinId: 'demo' }))
    const refused = Array.from({ length: 4 }, () => scheduler.transform('.a { color: red; }', { skinId: 'demo' }))
    for (const request of refused) {
      await expect(request).rejects.toBeInstanceOf(SkinCssOverloadedError)
    }
    const stats = scheduler.stats()
    expect(stats.held).toBe(8)
    expect(stats.rejected).toBe(4)
    // The accepted work is not left hanging: dispose ends it.
    const settled = accepted.map((request) => expect(request).rejects.toBeInstanceOf(SkinCssTransformFailureError))
    await scheduler.dispose()
    await Promise.all(settled)
  }, 30_000)

  it('times out a stuck worker and leaves no orphan', async () => {
    const dir = makeTempDir('skin-css-timeout-')
    const worker = writeStubWorker(dir)
    const pids = join(dir, 'pids.txt')
    process.env.DSH_STUB_MODE = 'hang'
    process.env.DSH_STUB_PID_FILE = pids
    const scheduler = new SkinCssScheduler({ workerPath: worker, timeoutMs: 300 })
    await expect(scheduler.transform('.a { color: red; }', { skinId: 'demo' }))
      .rejects.toBeInstanceOf(SkinCssTransformTimeoutError)
    const pid = Number(readFileSync(pids, 'utf8').trim().split('\n')[0])
    expect(processAlive(pid)).toBe(false)
    await scheduler.dispose()
  }, 30_000)

  it('settles a request only after its worker exited', async () => {
    const dir = makeTempDir('skin-css-exit-')
    const worker = writeStubWorker(dir)
    const pids = join(dir, 'pids.txt')
    process.env.DSH_STUB_PID_FILE = pids
    const scheduler = new SkinCssScheduler({ workerPath: worker, timeoutMs: 10_000 })
    await scheduler.transform('.a { color: red; }', { skinId: 'demo' })
    const pid = Number(readFileSync(pids, 'utf8').trim().split('\n')[0])
    expect(processAlive(pid)).toBe(false)
    expect(scheduler.stats().lastWorkerExited).toBe(true)
    await scheduler.dispose()
  }, 30_000)

  it('rejects queued work and terminates the active worker on dispose', async () => {
    const dir = makeTempDir('skin-css-dispose-')
    const worker = writeStubWorker(dir)
    const pids = join(dir, 'pids.txt')
    process.env.DSH_STUB_PID_FILE = pids
    process.env.DSH_STUB_MODE = 'hang'
    const scheduler = new SkinCssScheduler({ workerPath: worker, timeoutMs: 30_000 })
    const requests = [
      scheduler.transform('.a { color: red; }', { skinId: 'demo' }),
      scheduler.transform('.b { color: red; }', { skinId: 'demo' }),
      scheduler.transform('.c { color: red; }', { skinId: 'demo' }),
    ]
    await new Promise((resolveWait) => setTimeout(resolveWait, 300))
    // Attach the expectations before disposing: dispose rejects the requests.
    const settled = requests.map((request) => expect(request).rejects.toBeInstanceOf(SkinCssTransformFailureError))
    await scheduler.dispose()
    await Promise.all(settled)
    const pid = Number(readFileSync(pids, 'utf8').trim().split('\n')[0])
    expect(processAlive(pid)).toBe(false)
  }, 30_000)
})

describe('css safety worker: lifecycle', () => {
  it('serves a new mount after the old one was disposed', async () => {
    const dir = makeTempDir('skin-css-remount-')
    const worker = writeStubWorker(dir)
    const first = new SkinCssScheduler({ workerPath: worker, timeoutMs: 10_000 })
    const firstResult = await first.transform('.a { color: red; }', { skinId: 'demo' })
    expect(firstResult.code).toBe('/* stub */')
    await first.dispose()

    // The remount gets its own scheduler: the disposed one must not disable it.
    const second = new SkinCssScheduler({ workerPath: worker, timeoutMs: 10_000 })
    try {
      const secondResult = await second.transform('.b { color: red; }', { skinId: 'demo' })
      expect(secondResult.code).toBe('/* stub */')
      expect(second.stats().lastWorkerExited).toBe(true)
    } finally {
      await second.dispose()
    }
  }, 30_000)

  it('keeps overlapping mounts independent', async () => {
    const dir = makeTempDir('skin-css-overlap-')
    const worker = writeStubWorker(dir)
    const first = new SkinCssScheduler({ workerPath: worker, timeoutMs: 10_000 })
    const second = new SkinCssScheduler({ workerPath: worker, timeoutMs: 10_000 })
    try {
      // Both mounts are live at the same time.
      const [a, b] = await Promise.all([
        first.transform('.a { color: red; }', { skinId: 'demo' }),
        second.transform('.b { color: red; }', { skinId: 'demo' }),
      ])
      expect(a.code).toBe('/* stub */')
      expect(b.code).toBe('/* stub */')
      // Disposing one mount leaves the other one working.
      await first.dispose()
      const after = await second.transform('.c { color: red; }', { skinId: 'demo' })
      expect(after.code).toBe('/* stub */')
    } finally {
      await first.dispose()
      await second.dispose()
    }
  }, 30_000)

  it('leaves no process exit listener behind after every mount is disposed', async () => {
    const dir = makeTempDir('skin-css-exit-hook-')
    const worker = writeStubWorker(dir)
    const before = process.listenerCount('exit')
    const first = new SkinCssScheduler({ workerPath: worker, timeoutMs: 10_000 })
    await first.transform('.a { color: red; }', { skinId: 'demo' })
    expect(process.listenerCount('exit')).toBe(before + 1)
    await first.dispose()
    expect(process.listenerCount('exit')).toBe(before)
    // A remount does not accumulate listeners.
    const second = new SkinCssScheduler({ workerPath: worker, timeoutMs: 10_000 })
    await second.transform('.a { color: red; }', { skinId: 'demo' })
    expect(process.listenerCount('exit')).toBe(before + 1)
    await second.dispose()
    expect(process.listenerCount('exit')).toBe(before)
  }, 30_000)
})

describe('css safety worker: failure paths', () => {
  it('rejects promptly when the worker cannot be spawned', async () => {
    const scheduler = new SkinCssScheduler({
      // A path that does not exist: fork throws synchronously.
      workerPath: join(makeTempDir('skin-css-nofork-'), 'missing-worker.mjs'),
      timeoutMs: 30_000,
    })
    const started = Date.now()
    await expect(scheduler.transform('.a { color: red; }', { skinId: 'demo' }))
      .rejects.toBeInstanceOf(SkinCssTransformFailureError)
    // The failure is immediate, not a timeout wait.
    expect(Date.now() - started).toBeLessThan(5_000)
    await scheduler.dispose()
  }, 30_000)

  it('advances the pipeline after a spawn failure', async () => {
    const dir = makeTempDir('skin-css-spawnfail-')
    const worker = writeStubWorker(dir)
    let calls = 0
    const scheduler = new SkinCssScheduler({
      workerPath: worker,
      timeoutMs: 30_000,
      forkImpl: (modulePath, options) => {
        calls += 1
        if (calls === 1) throw new Error('spawn refused')
        return fork(modulePath, options)
      },
    })
    const failed = scheduler.transform('.a { color: red; }', { skinId: 'demo' })
    const next = scheduler.transform('.b { color: red; }', { skinId: 'demo' })
    await expect(failed).rejects.toBeInstanceOf(SkinCssTransformFailureError)
    // The second request is served: the failure did not stall the pipeline.
    const result = await next
    expect(result.code).toBe('/* stub */')
    await scheduler.dispose()
  }, 30_000)

  it('rejects promptly when the spawn fails without an exit', async () => {
    const child = new FakeChild(undefined)
    const scheduler = new SkinCssScheduler({
      workerPath: join(makeTempDir('skin-css-spawnerror-'), 'worker.mjs'),
      timeoutMs: 30_000,
      forkImpl: () => child as never,
    })
    const request = scheduler.transform('.a { color: red; }', { skinId: 'demo' })
    // A spawn error without a pid: no exit will ever follow.
    setTimeout(() => { child.emit('error', Object.assign(new Error('spawn failed'), { code: 'ENOENT' })) }, 20)
    const started = Date.now()
    await expect(request).rejects.toBeInstanceOf(SkinCssTransformFailureError)
    expect(Date.now() - started).toBeLessThan(5_000)
    // The pipeline advanced: the slot is free again.
    expect(scheduler.stats().active).toBe(0)
    await scheduler.dispose()
  }, 30_000)

  it('bounds a request whose worker answered but never exits', async () => {
    const child = new FakeChild(999_999)
    const scheduler = new SkinCssScheduler({
      workerPath: join(makeTempDir('skin-css-hang-'), 'worker.mjs'),
      timeoutMs: 400,
      forkImpl: () => child as never,
    })
    const request = scheduler.transform('.a { color: red; }', { skinId: 'demo' })
    // The worker answers but never exits.
    setTimeout(() => { child.emit('message', { type: 'result', code: '/* late */', warnings: [] }) }, 20)
    const started = Date.now()
    // The late answer must not become the result.
    await expect(request).rejects.toBeInstanceOf(SkinCssTransformTimeoutError)
    expect(Date.now() - started).toBeLessThan(10_000)
    // No second worker started while the unkillable run was still there.
    expect(scheduler.stats().active).toBe(1)
    await scheduler.dispose()
  }, 30_000)

  it('ends the worker when the host closes the IPC channel', async () => {
    const worker = join(PACKAGE_ROOT, 'lib', 'css-safety-worker.js')
    const child = fork(worker, {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      execArgv: [],
      stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
    })
    const exited = new Promise<number | null>((resolve) => { child.on('exit', (code) => { resolve(code) }) })
    // The parent goes away: the worker must not outlive it.
    child.disconnect()
    const code = await Promise.race([
      exited,
      new Promise<null>((resolve) => setTimeout(() => { resolve(null) }, 5_000)),
    ])
    expect(code).not.toBeNull()
  }, 30_000)
})

describe('css safety worker: windows addon mapping', () => {
  it('blocks a package rename while the addon is mapped, and frees it after exit', async () => {
    if (process.platform !== 'win32') return
    const packageDir = realpathSync(REQUIRE.resolve('lightningcss').replace(/[\\/]node[\\/]index\.js$/, ''))
    const nativeName = `lightningcss-${process.platform}-${process.arch}-msvc`
    const nativeDir = join(dirname(packageDir), nativeName)
    expect(existsSync(nativeDir)).toBe(true)
    const dir = makeTempDir('skin-css-rename-')
    const copy = join(dir, 'lightningcss')
    cpSync(packageDir, copy, { recursive: true })
    copyFileSync(
      join(nativeDir, 'lightningcss.win32-x64-msvc.node'),
      join(copy, 'lightningcss.win32-x64-msvc.node'),
    )
    // The copy never lives inside the real node_modules tree, and it holds no
    // link that could reach out of it.
    assertNoLinksAndNoForbiddenPath(copy, 'node_modules')

    const child = spawn(process.execPath, [
      '-e',
      `try { require(${JSON.stringify(join(copy, 'node', 'index.js'))}); console.log('loaded:' + Object.keys(require.cache).filter((key) => key.endsWith('.node')).join(',')) } catch (error) { console.log('failed:' + error.message) } setInterval(() => {}, 1000)`,
    ], {
      stdio: ['ignore', 'pipe', 'inherit'],
      // The addon under test is the one inside the copy: a NODE_PATH that
      // reaches the real package tree would map the real addon instead.
      env: { ...process.env, NODE_PATH: '' },
    })
    let loadedOutput = ''
    const loaded = new Promise<void>((resolveLoaded, rejectLoaded) => {
      child.stdout.on('data', (chunk: Buffer) => {
        loadedOutput += String(chunk)
        if (loadedOutput.includes('loaded')) resolveLoaded()
      })
      child.on('error', rejectLoaded)
    })
    await loaded
    expect(loadedOutput, 'the probe child must map the addon inside the copy').toContain('loaded:' + join(copy, 'lightningcss.win32-x64-msvc.node'))
    // The mapped addon blocks the rename a package manager performs.
    expect(() => renameSync(copy, `${copy}-renamed`)).toThrow(/EPERM|EACCES/)
    child.kill()
    await new Promise((resolveExited) => child.on('exit', () => resolveExited(undefined)))
    // Once the process is gone, the addon is unmapped and the rename works.
    await renameWithRetry(copy, `${copy}-renamed`)
  }, 60_000)
})
