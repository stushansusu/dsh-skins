#!/usr/bin/env node
/**
 * skin-center:check — validate every built-in skin asset directory against
 * the v2 contract (issue #506). The catalog itself is the registry now: this
 * gate fails when any skin under packages/skins/skin-center/skins/ is
 * missing, invalid, or carries catalog diagnostics.
 *
 * Modes: default validates and prints a report; --check stays silent on
 * success (CI gate shape, mirroring the retired skin-center-bundles gate).
 */
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const LIB_PATH = path.join(__dirname, '..', 'lib', 'index.js')
/**
 * The CSS safety transform lives in its own bundle (issue #98): the package
 * root must stay free of lightningcss so the DSH host never maps the native
 * addon. Older packages carry the transform at the root instead.
 */
const CSS_SAFETY_LIB_PATH = path.join(__dirname, '..', 'lib', 'css-safety.js')
const SKINS_DIR = path.join(__dirname, '..', 'skins')

async function main() {
  const checkMode = process.argv.includes('--check')
  const { execFileSync } = require('node:child_process')
  execFileSync(process.execPath, [path.join(__dirname, 'skin-hooks-registry.mjs'), '--check'], { stdio: 'inherit' })
  const lib = await import(pathToFileURL(LIB_PATH).href)
  const cssSafety = await import(pathToFileURL(fs.existsSync(CSS_SAFETY_LIB_PATH) ? CSS_SAFETY_LIB_PATH : LIB_PATH).href)
  const catalog = lib.loadSkinCatalog({ builtinDir: SKINS_DIR, userDir: path.join(SKINS_DIR, '.nonexistent-user-root') })
  let failed = false
  if (catalog.skins.length === 0) {
    console.error('skin-center:check: no built-in skins found')
    failed = true
  }
  for (const diag of catalog.diagnostics) {
    console.error(`skin-center:check: ${diag.subject} excluded: ${diag.errors.join('; ')}`)
    failed = true
  }
  for (const skin of catalog.skins) {
    // Stylesheets pass through the safety pipeline at serve time; run it at
    // gate time too so a violating skin can never merge.
    const entries = [
      ['skin.css', skin.manifest.contributes.stylesheet],
      ['patches.css', skin.manifest.contributes.patches],
    ]
    for (const [label, rel] of entries) {
      if (!rel) continue
      const abs = lib.resolveInsideSkin(skin, rel)
      if (abs === null || !fs.existsSync(abs)) {
        console.error(`skin-center:check: ${skin.manifest.id}: missing ${label} (${rel})`)
        failed = true
        continue
      }
      try {
        cssSafety.transformSkinCss(fs.readFileSync(abs, 'utf8'), { skinId: skin.manifest.id, filename: label })
      } catch (error) {
        console.error(`skin-center:check: ${skin.manifest.id}: ${label}: ${error.message}`)
        failed = true
      }
    }
  }
  if (failed) process.exit(1)
  // The package ships only the default skin (market on-demand plan); this
  // check validates the whole repo catalog that market-build serves. Keep
  // both facts visible in the report.
  const shipped = 'blue-fantasy'
  if (!checkMode) {
    console.log(`skin-center:check: ${catalog.skins.length} repo catalog skins valid (package ships ${shipped} only)`)
  } else {
    console.log(`skin-center:check: check OK (${catalog.skins.length} repo catalog skins; package ships ${shipped} only)`)
  }
}

main().catch((error) => {
  console.error(`skin-center:check: ${error.message}`)
  process.exit(2)
})
