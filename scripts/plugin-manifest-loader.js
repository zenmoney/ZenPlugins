const { convertManifestXmlToJs, prepareScrapeManifest, resolveEntryFile } = require('./utils')
const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const repositoryUri = 'https://github.com/zenmoney/ZenPlugins/blob/master'

function generateScrapeLoader (index, { id, company, subscriptionRequired, codeRequired, api }) {
  return `require("polyfills");
require("injectErrorsGlobally");
var result = require(${JSON.stringify(index)});

var exportsThatMakeNoDifference = Object.keys(result).filter(function (key) {
    return key !== "scrape" && key !== "makeTransfer";
});
if (exportsThatMakeNoDifference.length > 0) {
    console.error(exportsThatMakeNoDifference + " members exported by index.js are not handled by ZenMoney, thus looking like a developer mistake (exports are useless and make no effect). It is recommended to stop exporting them.  See: ${repositoryUri}");
}

if (result.scrape && result.main || !result.scrape && !result.main) {
    throw new Error("Either scrape() or main() should be exported from index.js (not both). See: ${repositoryUri}");
}

if (result.scrape) {
    var adaptScrapeToMain = require("adapters").adaptScrapeToMain;
    result.main = adaptScrapeToMain(result.scrape);
    result = {
        main: result.main,
        makeTransfer: result.makeTransfer,
        scrape: undefined
    };
}
ZenMoney.manifest = ${JSON.stringify({
  id,
  api: api || 'private',
  company,
  isSubscriptionRequired: subscriptionRequired === 'true',
  isUserInputRequiredOnEveryRun: codeRequired === 'true'
})};

for (var key in result) {
    if (result.hasOwnProperty(key)) {
        global[key] = result[key];
    }
}

module.exports = result;
`
}

function check (condition, message) {
  if (!condition) throw new Error(message)
}

function operationExports (file) {
  // Resolve the module's public values without executing provider code at build time.
  const program = ts.createProgram([file], {
    allowJs: true,
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    types: []
  })
  check(program.getSyntacticDiagnostics().length === 0, `Invalid syntax in ${file}`)
  const ast = program.getSourceFile(file)
  const checker = program.getTypeChecker()
  const module = checker.getSymbolAtLocation(ast)
  check(module, 'Missing operation exports')
  const result = []
  for (const exported of checker.getExportsOfModule(module)) {
    if (exported.declarations?.every(ts.isTypeOnlyImportOrExportDeclaration)) continue
    const value = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    if (!(value.flags & ts.SymbolFlags.Value)) continue
    check(checker.getTypeOfSymbolAtLocation(value, ast).getCallSignatures().length > 0, 'Exported operations must be functions')
    result.push(exported.name)
  }
  check(result.length > 0, 'Missing operation exports')
  return result.sort()
}

function readPluginModule (directory, exported, serializeManifest, scrapeRoot) {
  resolveEntryFile(directory, 'ZenmoneyManifest')
  check(Object.keys(exported).length === 1 && Object.hasOwn(exported, 'manifest'), 'Metadata module must export only manifest')
  const descriptor = serializeManifest(exported.manifest)
  check(descriptor.id === path.basename(directory), 'Plugin id does not match source directory')
  const index = resolveEntryFile(directory, 'index')
  check(JSON.stringify(operationExports(index)) === JSON.stringify(Object.keys(descriptor.capabilities).sort()), 'Capabilities and exported operations differ')
  if (scrapeRoot && fs.existsSync(scrapeRoot)) {
    for (const bank of fs.readdirSync(scrapeRoot)) {
      const xml = path.join(scrapeRoot, bank, 'ZenmoneyManifest.xml')
      if (!fs.existsSync(xml)) continue
      const manifest = convertManifestXmlToJs(fs.readFileSync(xml, 'utf8'))
      check(bank !== descriptor.id && manifest.id?.trim() !== descriptor.id, 'Canonical plugin id collides with a bank')
    }
  }
  return { index, descriptor }
}

function checkTypes (directory, root) {
  const files = ts.sys.readDirectory(directory, ['.ts'], ['**/__tests__/**'])
  if (files.length === 0) return
  const configFile = path.join(root, 'tsconfig.json')
  const config = ts.readConfigFile(configFile, ts.sys.readFile)
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const program = ts.createProgram([...files, ...['index.d.ts', 'imports.d.ts'].map(file => path.join(root, 'src/types', file))], {
    ...parsed.options,
    noEmit: true,
    typeRoots: [path.join(root, 'node_modules/@types')]
  })
  const errors = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)].filter(error => error.category === ts.DiagnosticCategory.Error)
  if (errors.length) throw new Error(ts.formatDiagnostics(errors, { getCurrentDirectory: () => root, getCanonicalFileName: file => file, getNewLine: () => '\n' }))
}

function generatePluginLoader (index, descriptor) {
  return `require("polyfills");
require("injectErrorsGlobally");
ZenMoney.manifest = ${JSON.stringify(descriptor)};
const operations = require(${JSON.stringify(index)});
const result = {};
for (const name of ${JSON.stringify(Object.keys(descriptor.capabilities))}) {
  if (typeof operations[name] !== 'function') throw new Error('Missing declared plugin operation');
  result[name] = async function (args) {
    await ZenMoney.restoreCookies();
    const value = await operations[name](args);
    await ZenMoney.saveCookies();
    await ZenMoney.saveData();
    return value;
  };
  global[name] = result[name];
}
module.exports = result;
`
}

module.exports = async function (source) {
  const { emitManifest = false, manifestParser } = this.getOptions()
  if (path.extname(this.resourcePath) !== '.xml') {
    check(typeof manifestParser === 'string', 'Missing module manifest parser')
    const { serializeManifest } = require(manifestParser)
    // Recheck operation exports and types when plugin sources change.
    this.cacheable(false)
    const directory = path.dirname(this.resourcePath)
    const root = path.resolve(__dirname, '..')
    this.addContextDependency(directory)
    checkTypes(directory, root)
    // Compile and import author metadata at build time, bypassing this runtime loader.
    const exported = await this.importModule(`!!${require.resolve('esbuild-loader')}?target=es2020!${this.resourcePath}`)
    const { index, descriptor } = readPluginModule(directory, exported, serializeManifest, path.join(root, 'src/plugins'))
    if (emitManifest) this.emitFile('ZenmoneyManifest.json', JSON.stringify(descriptor, null, 2) + '\n')
    return generatePluginLoader(index, descriptor)
  }
  this.cacheable && this.cacheable()
  const directory = path.dirname(this.resourcePath)
  this.addContextDependency(directory)
  const { index, manifest, xml } = prepareScrapeManifest(source, directory)
  const preferences = path.join(directory, 'preferences.xml')
  if (manifest.preferences) this.addDependency(preferences)
  else this.addMissingDependency(preferences)
  if (emitManifest) {
    this.emitFile('ZenmoneyManifest.xml', xml)
    if (manifest.preferences) this.emitFile(manifest.preferences, fs.readFileSync(preferences))
  }
  return generateScrapeLoader(index, manifest)
}

module.exports.readPluginModule = readPluginModule
