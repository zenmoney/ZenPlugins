const path = require('path')
const fs = require('fs')

const resolveFromRoot = relativePath => path.resolve(path.join(__dirname, '..'), relativePath) // __dirname = scripts

function resolveCommonFiles () {
  return {
    appSrc: resolveFromRoot('src'),
    appPublic: resolveFromRoot('scripts/public'),
    hostedPluginHtml: resolveFromRoot('scripts/public/hostedPlugin.html'),
    windowLoaderHtml: resolveFromRoot('scripts/public/windowLoader.html'),
    windowLoaderJs: resolveFromRoot('src/windowLoader.jsx'),
    workerLoaderJs: resolveFromRoot('src/workerLoader.js'),
    appPackageJson: resolveFromRoot('package.json'),
    yarnLockFile: resolveFromRoot('yarn.lock'),
    testsSetup: resolveFromRoot('src/setupTests.js')
  }
}

function resolvePlugin (pluginName) {
  const plugin = resolvePluginSelection(pluginName)
  if (!plugin) return null
  const pluginPath = plugin.directory
  const manifestFiles = (plugin.family === 'plugins' ? ['xml'] : ['ts', 'js'])
    .map(extension => path.join(pluginPath, `ZenmoneyManifest.${extension}`))
    .filter(file => fs.existsSync(file))
  if (manifestFiles.length !== 1) throw new Error(`Ambiguous ZenmoneyManifest extensions in ${pluginPath}`)
  return {
    name: pluginName,
    family: plugin.family,
    path: pluginPath,
    js: manifestFiles[0],
    manifest: manifestFiles[0],
    preferencesSchema: path.join(pluginPath, 'preferences.xml'),

    preferences: path.join(pluginPath, 'zp_preferences.json'),
    debugConfig: path.join(pluginPath, 'bootloader_config.json'),
    data: path.join(pluginPath, 'zp_data.json'),
    code: path.join(pluginPath, 'zp_pipe.txt'),
    cookies: path.join(pluginPath, 'zp_cookies.json')
  }
}
function discoverPlugins (root = resolveFromRoot('.')) {
  const plugins = new Map()
  for (const family of ['plugins', 'receiptFetchers']) {
    const sourceRoot = path.join(root, 'src', family)
    if (!fs.existsSync(sourceRoot)) continue
    const manifests = family === 'plugins' ? ['ZenmoneyManifest.xml'] : ['ZenmoneyManifest.ts', 'ZenmoneyManifest.js']
    for (const name of fs.readdirSync(sourceRoot).sort()) {
      const directory = path.join(sourceRoot, name)
      if (!fs.statSync(directory).isDirectory() || !manifests.some(manifest => fs.existsSync(path.join(directory, manifest)))) continue
      if (plugins.has(name)) throw new Error(`Duplicate plugin name: ${name} (${plugins.get(name).family} and ${family})`)
      plugins.set(name, { family, name, directory })
    }
  }
  return [...plugins.values()]
}

function resolvePluginSelection (selector, root = resolveFromRoot('.')) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(selector)) return null
  return discoverPlugins(root).find(plugin => plugin.name === selector) || null
}

function expandPluginArguments (args, root = resolveFromRoot('.')) {
  const plugins = discoverPlugins(root)
  return args.map(arg => {
    const plugin = plugins.find(plugin => plugin.name === arg)
    return plugin ? plugin.directory + '/' : arg
  })
}

module.exports = { resolveFromRoot, resolvePlugin, resolveCommonFiles, discoverPlugins, resolvePluginSelection, expandPluginArguments }
