const { buildSync } = require('esbuild')
const Module = require('module')

// Shared Jest/Webpack entrypoint. Keep the implementation in TypeScript.
// Load it on Node 20 without installing a global require hook.
const filename = require.resolve('./bundle.ts')
const compiled = new Module(filename, module)
compiled.filename = filename
compiled.paths = module.paths
compiled._compile(buildSync({
  entryPoints: [filename],
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  write: false
}).outputFiles[0].text, filename)
module.exports = compiled.exports
