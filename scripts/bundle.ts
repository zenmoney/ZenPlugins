import { createHash } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { createRequire } from 'module'
import { dirname, extname, isAbsolute, resolve } from 'path'
import { build, buildSync, transformSync, version } from 'esbuild'
import type { BuildOptions, BuildResult, Loader, TransformOptions } from 'esbuild'
import ts from 'typescript'

interface BundleLoaderContext {
  resourcePath: string
  resourceQuery: string
  async: () => (error: Error | null, source?: string) => void
  addDependency: (filename: string) => void
  addMissingDependency: (filename: string) => void
}

interface BundleResult {
  source: string
  dependencies: string[]
}

interface JestOptions {
  configString?: string
  instrument?: boolean
  transformerConfig?: TransformOptions
}

const assetLoaders: Record<string, 'base64' | 'text'> = {
  '.wasm': 'base64',
  '.html': 'text',
  '.htm': 'text'
}

function readAsset (filename: string): string {
  const bytes = readFileSync(filename)
  return assetLoaders[extname(filename)] === 'base64' ? bytes.toString('base64') : bytes.toString('utf8').replace(/^\uFEFF/, '')
}

function isBundleQuery (query: string): boolean {
  return new URLSearchParams(query).has('bundle')
}

function bundleOptions (query: string): BuildOptions {
  const params = new URLSearchParams(query)
  const supported = new Set(['bundle', 'format', 'globalName'])
  for (const key of params.keys()) {
    if (!supported.has(key)) throw new Error(`Unknown bundle option: ${key}`)
    if (params.getAll(key).length !== 1) throw new Error(`Duplicate bundle option: ${key}`)
  }
  if (params.get('bundle') !== '') throw new Error('Expected the bundle flag without a value')
  if (!/(?:^\?|&)bundle$/.test(query)) throw new Error('Expected the bundle flag as the final query parameter')
  const format = params.get('format') ?? 'iife'
  if (format !== 'iife' && format !== 'esm' && format !== 'cjs') throw new Error(`Invalid bundle format: ${format}`)
  const globalName = params.get('globalName') ?? undefined
  if (globalName !== undefined && (globalName === '' || format !== 'iife')) throw new Error('globalName requires IIFE format and a nonempty name')
  return { format, globalName, target: 'es2020', minify: true }
}

function buildOptions (filename: string, query: string): BuildOptions & { metafile: true, write: false } {
  return {
    ...bundleOptions(query),
    absWorkingDir: dirname(filename),
    entryPoints: [filename],
    bundle: true,
    platform: 'browser',
    loader: assetLoaders,
    write: false,
    metafile: true,
    logLevel: 'silent'
  }
}

function bundleResult (filename: string, result: BuildResult<{ metafile: true, write: false }>): BundleResult {
  if (result.outputFiles.length !== 1 || Object.values(result.metafile.outputs).some(output => output.imports.some(dependency => dependency.external))) {
    throw new Error('A script bundle must produce one JavaScript file without external imports')
  }
  const inputs = Object.keys(result.metafile.inputs)
  for (const input of inputs) {
    const separator = input.indexOf('?')
    if (separator >= 0 && isBundleQuery(input.slice(separator))) throw new Error('Nested bundle imports are not supported; import helpers as ordinary modules')
  }
  return {
    source: result.outputFiles[0].text,
    dependencies: inputs.map(input => resolve(dirname(filename), input))
  }
}

function buildBundle (filename: string, query: string): BundleResult {
  return bundleResult(filename, buildSync(buildOptions(filename, query)))
}

async function webpackLoader (this: BundleLoaderContext): Promise<void> {
  const callback = this.async()
  try {
    if (assetLoaders[extname(this.resourcePath)] !== undefined) {
      callback(null, readAsset(this.resourcePath))
      return
    }
    const result = bundleResult(this.resourcePath, await build(buildOptions(this.resourcePath, this.resourceQuery)))
    const configurations = new Set<string>()
    for (const dependency of result.dependencies) {
      this.addDependency(dependency)
      // Resolution also depends on package metadata and the nearest TS configuration.
      for (let directory = dirname(dependency); ; directory = dirname(directory)) {
        for (const name of ['package.json', 'tsconfig.json']) {
          const candidate = resolve(directory, name)
          if (existsSync(candidate)) {
            this.addDependency(candidate)
            if (name === 'tsconfig.json' && !configurations.has(candidate)) {
              configurations.add(candidate)
              // Let TypeScript resolve JSONC, relative/package extends and their full chains.
              // Only configuration reads matter here; esbuild owns compilation and validation.
              ts.getParsedCommandLineOfConfigFile(candidate, {}, {
                ...ts.sys,
                readDirectory: () => [],
                readFile: filename => {
                  this.addDependency(filename)
                  return ts.sys.readFile(filename)
                },
                fileExists: filename => {
                  const exists = ts.sys.fileExists(filename)
                  if (!exists) this.addMissingDependency(filename)
                  return exists
                },
                onUnRecoverableConfigFileDiagnostic: diagnostic => {
                  throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
                }
              })
            }
          } else this.addMissingDependency(candidate)
        }
        if (dirname(directory) === directory) break
      }
    }
    callback(null, result.source)
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)))
  }
}

function resolveRequest (request: string, filename: string): { filename: string, query: string } | undefined {
  const separator = request.indexOf('?')
  if (separator < 0 || !isBundleQuery(request.slice(separator))) return undefined
  const resource = request.slice(0, separator)
  const require = createRequire(filename)
  const extensions = ['.js', '.jsx', '.ts', '.tsx']
  const local = resource.startsWith('.') || isAbsolute(resource)
  // Webpack tries source files before directory entrypoints.
  const file = local ? ['', ...extensions].map(extension => resolve(dirname(filename), resource + extension)).find(ts.sys.fileExists) : undefined
  let resolved: string
  try { resolved = require.resolve(file ?? resource) } catch (error) {
    if (!local) throw error
    const candidate = extensions.map(extension => resolve(dirname(filename), resource, `index${extension}`)).find(ts.sys.fileExists)
    if (candidate === undefined) throw error
    resolved = require.resolve(candidate)
  }
  return { filename: resolved, query: request.slice(separator) }
}

// Jest transforms the importing module, keeping query options distinct from normal imports.
// Building before calculating the cache key also invalidates cached code when a helper changes.
function prepareJest (content: string, filename: string): { code: string, dependencies: Set<string> } {
  const dependencies = new Set<string>()
  if (!content.includes('bundle')) return { code: content, dependencies }
  const source = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true)
  const edits: Array<{ start: number, end: number, text: string }> = []
  const bundles = new Map<string, string>()
  const bundle = (request: string): string | undefined => {
    const input = resolveRequest(request, filename)
    if (input === undefined) return undefined
    let literal = bundles.get(request)
    if (literal === undefined) {
      const result = buildBundle(input.filename, input.query)
      result.dependencies.forEach(dependency => dependencies.add(dependency))
      literal = JSON.stringify(result.source)
      bundles.set(request, literal)
    }
    return literal
  }
  const replace = (node: ts.Node, text: string): void => { edits.push({ start: node.getStart(source), end: node.end, text }) }
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (node.importClause?.isTypeOnly === true) return
      const literal = bundle(node.moduleSpecifier.text)
      if (literal !== undefined) {
        const clause = node.importClause
        const statements: string[] = []
        if (clause?.name !== undefined) statements.push(`const ${clause.name.text} = ${literal};`)
        const bindings = clause?.namedBindings
        if (bindings !== undefined) {
          if (ts.isNamespaceImport(bindings)) statements.push(`const ${bindings.name.text} = { default: ${literal} };`)
          else {
            for (const element of bindings.elements) {
              if (element.isTypeOnly) continue
              if ((element.propertyName ?? element.name).text !== 'default') throw new Error('Bundle imports only expose a default source string')
              statements.push(`const ${element.name.text} = ${literal};`)
            }
          }
        }
        replace(node, statements.join(' '))
        return
      }
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined && ts.isStringLiteral(node.moduleSpecifier) && !node.isTypeOnly) {
      const literal = bundle(node.moduleSpecifier.text)
      if (literal !== undefined) {
        if (node.exportClause === undefined || !ts.isNamedExports(node.exportClause)) throw new Error('Re-export bundle source with an explicit default export')
        replace(node, node.exportClause.elements.filter(element => !element.isTypeOnly).map(element => {
          if ((element.propertyName ?? element.name).text !== 'default') throw new Error('Bundle imports only expose a default source string')
          return element.name.text === 'default' ? `export default ${literal};` : `export const ${element.name.text} = ${literal};`
        }).join(' '))
        return
      }
    }
    if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const literal = bundle(node.arguments[0].text)
      if (literal !== undefined) {
        replace(node, node.expression.kind === ts.SyntaxKind.ImportKeyword ? `Promise.resolve({ default: ${literal} })` : literal)
        return
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  let code = content
  for (const edit of edits.sort((a, b) => b.start - a.start)) code = code.slice(0, edit.start) + edit.text + code.slice(edit.end)
  return { code, dependencies }
}

function prepareContent (content: string, filename: string): string {
  if (assetLoaders[extname(filename)] !== undefined) return readAsset(filename)
  return /\.[jt]sx?$/.test(filename) ? prepareJest(content, filename).code : content
}

const revision = createHash('sha256').update(readFileSync(__filename)).update(version).update(ts.version).digest('hex')
let prepared: { filename: string, content: string, code: string } | undefined

function getCacheKey (content?: string, filename?: string, options: JestOptions = {}): string {
  // Jest also calls this without arguments for its dependency extractor.
  if (content === undefined || filename === undefined) return revision
  const code = prepareContent(content, filename)
  prepared = { filename, content, code }
  return createHash('sha256').update(revision).update(filename).update(code).update(options.configString ?? '')
    .update(JSON.stringify([options.instrument, options.transformerConfig])).digest('hex')
}

function processJest (content: string, filename: string, options: JestOptions = {}): { code: string, map?: string } {
  const code = prepared?.filename === filename && prepared.content === content ? prepared.code : prepareContent(content, filename)
  prepared = undefined
  if (!/\.[jt]sx?$/.test(filename)) return { code: `module.exports = ${JSON.stringify(code)}` }
  return transformSync(code, {
    loader: extname(filename).slice(1) as Loader,
    format: 'cjs',
    target: 'esnext',
    sourcemap: 'inline',
    sourcefile: filename,
    sourcesContent: true,
    ...options.transformerConfig
  })
}

function extract (content: string, filename: string, defaultExtract: (content: string, filename: string) => Set<string>): Set<string> {
  const dependencies = defaultExtract(content, filename)
  for (const request of dependencies) {
    const separator = request.indexOf('?')
    if (separator >= 0 && isBundleQuery(request.slice(separator))) {
      dependencies.delete(request)
      // Jest follows each module's ordinary imports transitively. Discovery must not
      // compile unrelated bundles; their errors are reported when transformed.
      dependencies.add(request.slice(0, separator))
    }
  }
  return dependencies
}

export = Object.assign(webpackLoader, { assetLoaders, isBundleQuery, bundleOptions, buildBundle, prepareJest, getCacheKey, process: processJest, extract })
