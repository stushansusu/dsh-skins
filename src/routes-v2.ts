/**
 * Skin-center v2 HTTP routes (issue #506, M2) — the loading/serving half of
 * the new architecture. Pure read-only asset serving plus the active-skin
 * selection write; the actual switch happens browser-side (atomic swap, no
 * reload, no cordis.patch.yml rewrite).
 *
 * Endpoints (all under /api/skin-center/v2):
 *  - GET  /catalog                     catalog snapshot (installed skins + diagnostics)
 *  - GET  /skins/<id>/stylesheet       transformed + scoped skin.css
 *  - GET  /skins/<id>/patches          transformed + scoped patches.css (404 when absent)
 *  - GET  /skins/<id>/hooks.mjs        the escape-hatch entry (404 when absent)
 *  - GET  /skins/<id>/assets/<path>    static in-directory assets (incl. preview/)
 *  - GET  /active                      the persisted active skin id + background preferences
 *  - POST /active                      persist active id and/or background (same-origin fenced)
 *  - GET  /external-wallpaper          whether the delegated WE plugin is installed (issue #39)
 *
 * The stylesheet/patches responses pass through the CSS safety pipeline
 * (force-scoped under html[data-dsh-skin="<id>"], whitelist fail-closed), so
 * the browser can inject them blindly. hooks.mjs is served verbatim — it is
 * trusted, same-review same-release code (high sensitivity, see contracts/),
 * served for built-in skins and for byte-verified official-market user
 * installs, including exact reviewed legacy installs (issue #1073).
 * @module @linxin666/dsh-client-ui-skin-center/routes-v2
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, extname, join } from 'node:path'

import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'

import { writeJson, requireSameOrigin } from './http-utils.ts'
import { fetchMarketVersions, planVersionRows } from './bulk.ts'
import { readJsonBody } from './http.ts'
import { defaultActiveStatePath, readActiveState, writeActiveState } from './active-state.ts'
import { sanitizeSkinBackground, type SkinBackgroundConfig } from './core/background.ts'
import { SkinCssOverloadedError, SkinCssSafetyError } from './core/css-safety/errors.ts'
import { defaultSkinCssTransform } from './core/css-safety/host-transform.ts'
import type { SkinCssTransformOptions, SkinCssTransformResult } from './core/css-safety/types.ts'
import { canServeSkinHooks, findSkin, loadSkinCatalog, repairSkin, resolveInsideSkin, shippedSkinIds, uninstallUserSkin, verifyAllSkinsIntegrity, verifyAndRepairAllSkins } from './skin-repo.ts'
import { MARKET_PROVENANCE_FILENAME } from './provenance.ts'
import { detectExternalWallpaperEngine, type ExternalWallpaperReport } from './external-wallpaper.ts'
import { delegatedSkinRows, findDelegatedSkin, type DelegatedSkinRow } from './core/delegated-skins.ts'
import type { SkinCatalog, SkinCatalogEntry } from './skin-repo.ts'

export const SKIN_CENTER_V2_PREFIX = '/api/skin-center/v2'

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
}

export interface RoutesV2Deps {
  /** Catalog loader (defaults to the real dual-source scan). */
  loadCatalog?: () => SkinCatalog
  /** Shipped builtin id set (defaults to the package.json files whitelist). */
  shippedSkinIds?: () => Set<string>
  /** Where the active-skin selection persists (defaults under $DSH_HOME). */
  activeStatePath?: string
  /** User skins directory override (tests). */
  userDir?: string
  /** Now function for catalog capture. */
  now?: () => number
  /** fetch implementation override (tests). */
  fetchImpl?: typeof fetch
  /** Local source dir mirror override (tests). */
  localSourceDir?: string
  /**
   * Delegated Wallpaper Engine plugin probe (issue #39). The real probe reads
   * the profile this package is installed into; tests hand in a fixed report.
   */
  detectExternalWallpaper?: () => ExternalWallpaperReport
  /**
   * Delegated-skin rows (a skin whose visual is another plugin's). The real
   * builder probes this profile per registry entry; tests hand in fixed rows.
   */
  listDelegatedSkins?: () => DelegatedSkinRow[]
  /**
   * The CSS safety transform (issue #98).
   *
   * A plugin mount injects the transform of ITS OWN scheduler, so the mount
   * that owns these routes also owns the worker that serves them; disposing
   * one mount can never disable another. Without an injected transform the
   * shared fallback pipeline is used.
   */
  transformCss?: (css: string, options: SkinCssTransformOptions) => Promise<SkinCssTransformResult>
}

/**
 * Whether a persisted selection still names something this package can show.
 *
 * Two kinds of selection exist: an asset skin in the catalog, and a delegated
 * skin whose visual belongs to another plugin (core/delegated-skins.ts). The
 * delegated ids come from this package's own registry rather than the catalog,
 * so they resolve with or without that plugin installed: the row is the
 * install prompt, and a selection that names it is the user having chosen it.
 * Anything else is a selection whose files are gone, which resolves to the
 * stock look instead of stranding the page on a missing id.
 * @param catalog - the current catalog snapshot.
 * @param id - a persisted selection value.
 * @returns true when the selection can still be applied.
 */
function selectionResolves(catalog: SkinCatalog, id: string): boolean {
  return findDelegatedSkin(id) !== null || findSkin(catalog, id) !== null
}

function sendCss(res: ServerResponse, status: number, code: string): void {
  res.writeHead(status, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-store' })
  res.end(code)
}

/**
 * Serve one manifest-referenced stylesheet through the safety pipeline.
 *
 * The transform runs in a short-lived worker process (issue #98), so this
 * handler awaits it: the response is written only after the worker has
 * answered and exited.
 * @param res - the HTTP response.
 * @param entry - the catalog row of the skin being served.
 * @param relPath - the manifest-relative stylesheet path.
 * @param filename - the logical filename used in pipeline diagnostics.
 */
async function serveStylesheet(
  res: ServerResponse,
  entry: SkinCatalogEntry,
  relPath: string,
  filename: string,
  transformCss: (css: string, options: SkinCssTransformOptions) => Promise<SkinCssTransformResult>,
): Promise<void> {
  const abs = resolveInsideSkin(entry, relPath)
  if (!abs || !existsSync(abs)) {
    writeJson(res, 404, { ok: false, error: 'stylesheet-not-found' })
    return
  }
  try {
    // Warnings are diagnostic surface (catalog/CLI), not transport: HTTP
    // headers reject non-Latin1 bytes and skin warnings can embed selector
    // fragments with CJK text.
    const { code } = await transformCss(readFileSync(abs, 'utf8'), {
      skinId: entry.manifest.id,
      filename,
      // Only the main stylesheet derives fallback tints; patches re-deriving
      // from their partial token view would override the skin's real values.
      deriveFallbacks: filename === 'skin.css',
    })
    sendCss(res, 200, code)
  } catch (error) {
    if (error instanceof SkinCssSafetyError) {
      writeJson(res, 422, { ok: false, error: 'css-whitelist-violation', violations: error.violations })
      return
    }
    if (error instanceof SkinCssOverloadedError) {
      // The pipeline holds as many requests as it may; the caller may retry.
      writeJson(res, 503, { ok: false, error: 'css-transform-overloaded', detail: (error as Error)?.message ?? String(error) })
      return
    }
    writeJson(res, 500, { ok: false, error: 'css-transform-failed', detail: (error as Error)?.message ?? String(error) })
  }
}

/** Serve one static file from inside the skin directory (fail-closed). */
function serveAsset(req: IncomingMessage, res: ServerResponse, entry: SkinCatalogEntry, relPath: string): void {
  const abs = resolveInsideSkin(entry, relPath)
  if (!abs || !existsSync(abs) || !statSync(abs).isFile()) {
    writeJson(res, 404, { ok: false, error: 'asset-not-found' })
    return
  }
  const mime = MIME[extname(abs).toLowerCase()] ?? 'application/octet-stream'
  const body = readFileSync(abs)
  const size = body.length
  const headers = { 'content-type': mime, 'cache-control': 'no-store', 'accept-ranges': 'bytes' }
  const range = req.headers.range
  if (range !== undefined) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim())
    let start = match?.[1] ? Number(match[1]) : 0
    let end = match?.[2] ? Number(match[2]) : size - 1
    if (match && !match[1] && match[2]) {
      start = Math.max(0, size - Number(match[2]))
      end = size - 1
    }
    if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end || size === 0) {
      res.writeHead(416, { ...headers, 'content-range': `bytes */${size}` })
      res.end()
      return
    }
    end = Math.min(end, size - 1)
    res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 })
    res.end(body.subarray(start, end + 1))
    return
  }
  res.writeHead(200, { ...headers, 'content-length': size })
  res.end(body)
}

/**
 * Build the v2 route set. Registration is the caller's job (the host entry
 * keeps the mount-once discipline).
 */
export function makeSkinCenterV2Routes(deps: RoutesV2Deps = {}): WebRoute[] {
  const loadCatalog = deps.loadCatalog ?? (() => loadSkinCatalog())
  const transformCss = deps.transformCss ?? defaultSkinCssTransform
  const activeStatePath = deps.activeStatePath ?? defaultActiveStatePath()
  // Installed-only catalog (market/store separation): user dirs are always
  // installed, builtins only when the package ships them (files whitelist).
  const shippedSet = (deps.shippedSkinIds ?? shippedSkinIds)()

  const listDelegatedSkins = deps.listDelegatedSkins ?? (() => delegatedSkinRows())

  /** One catalog row per delegated skin, shaped like an asset skin's. */
  const delegatedCatalogRows = (): Array<Record<string, unknown>> => listDelegatedSkins().map((row) => ({
    origin: 'delegated',
    warnings: row.descriptorMatches === false
      ? ['delegated-descriptor-mismatch']
      : [],
    manifest: {
      id: row.descriptor.id,
      name: row.descriptor.name,
      nameEn: row.descriptor.nameEn,
      tagline: row.descriptor.tagline,
      // The body copy travels as a locale key, never as words: it has to follow
      // the interface language, and the card's dictionary already holds it.
      descriptionKey: row.descriptor.descriptionKey,
      accent: row.descriptor.accent,
      // The delegated plugin's own identity and state, all the card needs and
      // nothing it can act on beyond the one-click install.
      delegated: {
        package: row.descriptor.package,
        repository: row.descriptor.repository,
        installCommand: row.descriptor.installCommand,
        bodyAttr: row.descriptor.bodyAttr,
        handoffAttr: row.descriptor.handoffAttr,
        wiringId: row.descriptor.wiringId,
        installed: row.installed,
        signals: row.signals,
        descriptorMatches: row.descriptorMatches,
      },
    },
  }))

  const catalogHandler: WebRoute['handler'] = (_req, res) => {
    const catalog = loadCatalog()
    writeJson(res, 200, {
      ok: true,
      capturedAt: catalog.capturedAt,
      skins: [
        ...catalog.skins
          .filter((s) => s.origin === 'user' || shippedSet.has(s.manifest.id))
          .map((s) => ({
            origin: s.origin,
            warnings: s.warnings,
            manifest: s.manifest,
            // Anonymous install-channel hint for telemetry (docs/telemetry.md):
            // Workshop installs carry a provenance file, registry installs do
            // not. This is a statistical hint only, never a security signal.
            channel: s.origin === 'user'
              ? (existsSync(join(s.dir, MARKET_PROVENANCE_FILENAME)) ? 'market' : 'unknown')
              : 'npm',
          })),
        // Delegated skins carry no files of their own, so they have no channel.
        ...delegatedCatalogRows(),
      ],
      diagnostics: catalog.diagnostics,
    })
  }

  // Version report for the bulk buttons. Read-only and origin-agnostic: it
  // only pairs the installed catalog against the public market manifest, so it
  // needs no same-origin fence. A market that cannot be read answers 200 with
  // a null rows array and an error string, which is what lets the card say
  // "market unreachable" instead of "everything is current".
  const versionsHandler: WebRoute['handler'] = async (_req, res) => {
    const catalog = loadCatalog()
    const { versions, error } = await fetchMarketVersions({ fetchImpl: deps.fetchImpl })
    if (error !== null) {
      writeJson(res, 200, { ok: false, error, rows: [] })
      return
    }
    const rows = planVersionRows(catalog, versions)
    writeJson(res, 200, {
      ok: true,
      rows,
      outdated: rows.filter((row) => row.outdated).length,
      total: rows.length,
    })
  }

  // Read-only profile probe (issue #39): the card uses it to point at the
  // delegated Wallpaper Engine plugin (install command + docs) when this
  // profile does not carry it yet. The probe reads the profile and nothing
  // else, so the endpoint carries no same-origin fence beyond the family's
  // read routes.
  const detectExternalWallpaper = deps.detectExternalWallpaper ?? (() => detectExternalWallpaperEngine())
  const externalWallpaperHandler: WebRoute['handler'] = (_req, res) => {
    const report = detectExternalWallpaper()
    writeJson(res, 200, { ok: true, ...report })
  }

  const verifyHandler: WebRoute['handler'] = async (req, res) => {
    if (!requireSameOrigin(req, res)) return
    if (req.method !== 'POST') {
      writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
      return
    }
    let body: { autoRepair?: boolean } | null = null
    try {
      body = (await readJsonBody(req, { maxBytes: 16 * 1024 })) as { autoRepair?: boolean } | null
    } catch {
      body = null
    }
    const autoRepair = body?.autoRepair !== false
    const result = await verifyAndRepairAllSkins(loadCatalog, {
      userDir: deps.userDir,
      fetchImpl: deps.fetchImpl,
      localSourceDir: deps.localSourceDir,
      autoRepair,
    })
    writeJson(res, 200, { ok: true, ...result })
  }

  const skinPrefix = `${SKIN_CENTER_V2_PREFIX}/skins/`

  const skinsHandler: WebRoute['handler'] = async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const rest = url.pathname.slice(skinPrefix.length)
    const [id, ...tail] = rest.split('/')
    const sub = tail.join('/')
    const catalog = loadCatalog()
    const entry = id ? findSkin(catalog, id) : null

    if (sub === 'uninstall') {
      if (!requireSameOrigin(req, res)) return
      if (req.method !== 'POST') {
        writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
        return
      }
      if (!entry) {
        writeJson(res, 404, { ok: false, error: 'skin-not-found' })
        return
      }
      if (entry.origin === 'builtin') {
        writeJson(res, 400, { ok: false, error: 'cannot-uninstall-builtin' })
        return
      }
      const userDir = deps.userDir ?? (entry.dir ? dirname(entry.dir) : undefined)
      const uninstallRes = uninstallUserSkin(id, { userDir })
      if (!uninstallRes.ok) {
        const status = uninstallRes.error === 'skin-not-found' ? 404 : 500
        writeJson(res, status, { ok: false, error: uninstallRes.error, detail: uninstallRes.detail })
        return
      }
      // If the uninstalled skin was active, reset active to null
      const currentActive = readActiveState(activeStatePath).active
      if (currentActive === id) {
        writeActiveState(activeStatePath, { active: null })
      }
      writeJson(res, 200, { ok: true, id })
      return
    }

    if (sub === 'repair') {
      if (!requireSameOrigin(req, res)) return
      if (req.method !== 'POST') {
        writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
        return
      }
      if (!entry) {
        writeJson(res, 404, { ok: false, error: 'skin-not-found' })
        return
      }
      if (entry.origin === 'builtin') {
        writeJson(res, 400, { ok: false, error: 'cannot-repair-builtin' })
        return
      }
      const userDir = deps.userDir ?? (entry.dir ? dirname(entry.dir) : undefined)
      const repairRes = await repairSkin(id, {
        userDir,
        fetchImpl: deps.fetchImpl,
        localSourceDir: deps.localSourceDir,
      })
      writeJson(res, repairRes.ok ? 200 : 500, repairRes)
      return
    }

    if (!entry) {
      writeJson(res, 404, { ok: false, error: 'skin-not-found' })
      return
    }
    if (sub === 'stylesheet') {
      await serveStylesheet(res, entry, entry.manifest.contributes.stylesheet, 'skin.css', transformCss)
      return
    }
    if (sub === 'patches') {
      const patches = entry.manifest.contributes.patches
      if (!patches) {
        writeJson(res, 404, { ok: false, error: 'no-patches' })
        return
      }
      await serveStylesheet(res, entry, patches, 'patches.css', transformCss)
      return
    }
    if (sub === 'hooks.mjs') {
      const facet = entry.manifest.facets?.client
      if (!facet) {
        writeJson(res, 404, { ok: false, error: 'no-hooks' })
        return
      }
      // Trust model (contracts/README.md): hooks are executable same-review
      // content. Re-verify the CURRENT bytes at serve time so a cached catalog
      // snapshot cannot keep serving hooks after post-scan tampering. Current
      // Workshop installs use provenance; exact reviewed pre-provenance
      // installs use the generated legacy identity (issue #1073).
      if (!canServeSkinHooks(entry)) {
        writeJson(res, 403, { ok: false, error: 'hooks-require-review', origin: entry.origin })
        return
      }
      const abs = resolveInsideSkin(entry, facet.entry)
      if (!abs || !existsSync(abs)) {
        writeJson(res, 404, { ok: false, error: 'hooks-not-found' })
        return
      }
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
      res.end(readFileSync(abs))
      return
    }
    if (sub.startsWith('assets/') || sub.startsWith('preview/')) {
      serveAsset(req, res, entry, sub)
      return
    }
    writeJson(res, 404, { ok: false, error: 'unknown-skin-resource' })
  }

  const activeGetHandler: WebRoute['handler'] = (_req, res) => {
    const state = readActiveState(activeStatePath)
    const catalog = loadCatalog()
    const effectiveActive = state.active !== null && !selectionResolves(catalog, state.active)
      ? null
      : state.active
    writeJson(res, 200, { ok: true, active: effectiveActive, background: state.background })
  }

  // POST accepts { active?, background? } with merge semantics (issue #996):
  // a key left out keeps its stored value, so a remote background write never
  // disturbs the active selection and vice versa.
  const activePostHandler: WebRoute['handler'] = async (req, res) => {
    if (!requireSameOrigin(req, res)) return
    // Shared lenient reader (16 KiB cap): invalid JSON, an over-limit body
    // (destroyed) and an empty body all yield null and answer the same 400
    // invalid-body envelope the old reader's rejection branch used.
    let body: unknown
    try {
      body = await readJsonBody(req, { maxBytes: 16 * 1024 })
    } catch {
      writeJson(res, 400, { ok: false, error: 'invalid-body' })
      return
    }
    if (body === null) {
      writeJson(res, 400, { ok: false, error: 'invalid-body' })
      return
    }
    const hasActive = typeof body === 'object' && body !== null && 'active' in body
    const hasBackground = typeof body === 'object' && body !== null && 'background' in body
    if (!hasActive && !hasBackground) {
      writeJson(res, 400, { ok: false, error: 'nothing-to-update' })
      return
    }
    const active = (body as { active?: unknown }).active
    if (hasActive && active !== null && typeof active !== 'string') {
      writeJson(res, 400, { ok: false, error: 'active-must-be-string-or-null' })
      return
    }
    if (typeof active === 'string' && !selectionResolves(loadCatalog(), active)) {
      writeJson(res, 404, { ok: false, error: 'skin-not-found' })
      return
    }
    const update: { active?: string | null; background?: SkinBackgroundConfig | null } = {}
    if (hasActive) update.active = active as string | null
    if (hasBackground) {
      const background = sanitizeSkinBackground((body as { background?: unknown }).background)
      if (background === null) {
        writeJson(res, 400, { ok: false, error: 'invalid-background' })
        return
      }
      update.background = background
    }
    writeActiveState(activeStatePath, update)
    const state = readActiveState(activeStatePath)
    writeJson(res, 200, { ok: true, active: state.active, background: state.background })
  }

  return [
    { kind: 'exact', path: `${SKIN_CENTER_V2_PREFIX}/catalog`, handler: catalogHandler },
    { kind: 'exact', path: `${SKIN_CENTER_V2_PREFIX}/external-wallpaper`, handler: externalWallpaperHandler },
    { kind: 'exact', path: `${SKIN_CENTER_V2_PREFIX}/verify`, handler: verifyHandler },
    { kind: 'exact', path: `${SKIN_CENTER_V2_PREFIX}/skins/versions`, handler: versionsHandler },
    { kind: 'prefix', path: skinPrefix.replace(/\/$/, ''), handler: skinsHandler },
    { kind: 'exact', path: `${SKIN_CENTER_V2_PREFIX}/active`, handler: (req, res) => {
      if (req.method === 'GET') return activeGetHandler(req, res)
      if (req.method === 'POST') return activePostHandler(req, res)
      writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
    } },
  ]
}
