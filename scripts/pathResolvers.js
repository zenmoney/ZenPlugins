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
  const pluginPath = resolveFromRoot(`src/plugins/${pluginName}`)
  if (!fs.existsSync(pluginPath)) {
    return null
  }
  return {
    name: pluginName,
    path: pluginPath,
    js: path.join(pluginPath, 'ZenmoneyManifest.xml'),
    manifest: path.join(pluginPath, 'ZenmoneyManifest.xml'),
    preferencesSchema: path.join(pluginPath, 'preferences.xml'),

    preferences: path.join(pluginPath, 'zp_preferences.json'),
    data: path.join(pluginPath, 'zp_data.json'),
    code: path.join(pluginPath, 'zp_pipe.txt'),
    cookies: path.join(pluginPath, 'zp_cookies.json')
  }
}
module.exports = { resolveFromRoot, resolvePlugin, resolveCommonFiles }
