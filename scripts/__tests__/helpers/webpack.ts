import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { createRequire } from 'module'
import { dirname, join, resolve } from 'path'

interface Stats {
  hasErrors: () => boolean
  toString: (options: { all: boolean, errors: boolean, warnings: boolean }) => string
}

interface Compiler {
  run: (callback: (error: Error | null, stats?: Stats) => void) => void
  close: (callback: (error?: Error | null) => void) => void
}

// Keep the tooling boundary compatible with the repository's TypeScript version.
const requireTool = createRequire(__filename)
const webpack = requireTool('webpack') as (config: Record<string, unknown>) => Compiler
const configure = requireTool('../../webpack.config') as (env: { PLUGIN: string, WEBPACK_SERVE?: boolean }, argv: { mode: string }) => Record<string, unknown>

export async function buildProductionScript (entry: string, withHtmlTemplate = false, cacheDirectory?: string): Promise<string> {
  const directory = mkdtempSync(join(tmpdir(), 'script-bundle-'))
  const config = configure({ PLUGIN: 'btcscan', WEBPACK_SERVE: withHtmlTemplate }, { mode: 'production' })
  config.entry = { index: resolve(entry) }
  config.output = { ...(config.output as Record<string, unknown>), path: directory, filename: 'index.js', library: { type: 'commonjs2' } }
  config.cache = cacheDirectory === undefined ? false : { type: 'filesystem', cacheDirectory }
  // Apply the production source rules to checked-in and temporary fixtures outside src.
  const rules = (config.module as { rules: Array<{ include?: string | string[] }> }).rules
  for (const rule of rules) {
    const includes = typeof rule.include === 'string' ? [rule.include] : rule.include
    if (includes?.includes(resolve(__dirname, '../../../src')) === true) {
      rule.include = [...includes, resolve(__dirname, '../fixtures'), dirname(resolve(entry))]
    }
  }
  const compiler = webpack(config)
  try {
    await new Promise<void>((resolve, reject) => {
      compiler.run((error, stats) => {
        if (error !== null) reject(error)
        else if (stats === undefined || stats.hasErrors()) reject(new Error(stats?.toString({ all: false, errors: true, warnings: true }) ?? 'Missing Webpack stats'))
        else resolve()
      })
    })
    return readFileSync(join(directory, 'index.js'), 'utf8')
  } finally {
    try {
      await new Promise<void>((resolve, reject) => compiler.close(error => error != null ? reject(error) : resolve()))
    } finally { rmSync(directory, { recursive: true, force: true }) }
  }
}
