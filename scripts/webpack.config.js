const { DefinePlugin, optimize: { LimitChunkCountPlugin } } = require('webpack')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const {
  resolvePlugin,
  resolveFromRoot,
  resolveCommonFiles
} = require('./pathResolvers')
const fs = require('fs')
const { EsbuildPlugin } = require('esbuild-loader')
const WebpackObfuscator = require('webpack-obfuscator')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebsocketServer = require('./debugServers/wsServer')
const { setupProxyServer } = require('./debugServers/proxyServer')
const { setupWebServer } = require('./debugServers/webServer')
const { BOOTLOADER_PORT, setupBootloaderServer } = require('./bootloaderServer')
const path = require('path')
const { assetLoaders, isBundleQuery } = require('./jest-raw-loader')

const readLogPrivateKey = () => {
  try {
    return JSON.stringify(fs.readFileSync(process.env.LOG_PRIVATE_KEY, { encoding: 'utf8' }))
  } catch (e) {
    throw new Error('Could not read file at LOG_PRIVATE_KEY path')
  }
}

const resolveWebpackCacheDirectory = () => {
  return process.env.WEBPACK_CACHE_DIR
    ? path.resolve(process.env.WEBPACK_CACHE_DIR)
    : resolveFromRoot('node_modules/.cache/webpack')
}

// Emit a complete artifact in staging before replacing the last successful build.
function emitPluginArtifacts (compiler) {
  let staging
  let outputPath
  const cleanup = () => {
    if (outputPath) compiler.outputPath = outputPath
    if (staging && !fs.existsSync(path.join(staging, 'previous'))) fs.rmSync(staging, { recursive: true, force: true })
    staging = undefined
  }
  compiler.hooks.emit.tap('PluginArtifacts', compilation => {
    const scripts = compilation.getAssets().filter(asset => asset.name.endsWith('.js'))
    if (scripts.length !== 1 || scripts[0].name !== 'index.js') throw new Error('Plugin bundle must be one self-contained index.js')
    outputPath = compiler.outputPath
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    staging = fs.mkdtempSync(path.join(path.dirname(outputPath), '.plugin-build-'))
    compiler.outputPath = path.join(staging, 'artifact')
  })
  compiler.hooks.afterEmit.tap('PluginArtifacts', () => {
    const backup = path.join(staging, 'previous')
    if (fs.existsSync(outputPath)) fs.renameSync(outputPath, backup)
    try {
      fs.renameSync(path.join(staging, 'artifact'), outputPath)
    } catch (error) {
      if (fs.existsSync(backup)) fs.renameSync(backup, outputPath)
      throw error
    }
    fs.rmSync(backup, { recursive: true, force: true })
    cleanup()
  })
  compiler.hooks.failed.tap('PluginArtifacts', cleanup)
}

function generatePluginConfig (production, server, pluginPaths, outputPath) {
  const paths = resolveCommonFiles()
  const pluginName = pluginPaths.name
  const manifest = fs.realpathSync(pluginPaths.manifest)
  if (server && pluginPaths.family !== 'plugins') throw new Error('The browser harness supports bank plugins only')
  return {
    mode: production ? 'production' : 'development',
    target: ['webworker', 'es2020'],
    devtool: production ? false : 'eval',
    cache: {
      type: production ? 'filesystem' : 'memory',
      ...production && {
        name: pluginName,
        cacheDirectory: resolveWebpackCacheDirectory()
      }
    },
    entry: production
      ? { index: manifest }
      : {
          windowLoader: [paths.windowLoaderJs],
          workerLoader: [paths.workerLoaderJs]
        },
    output: {
      path: outputPath,
      filename: '[name].js',
      chunkFilename: '[name].chunk.js',
      globalObject: 'this',
      chunkFormat: false,
      chunkLoading: false,
      workerChunkLoading: false,
      ...production && {
        asyncChunks: false
      }
    },
    resolve: {
      alias: {
        polyfills$: resolveFromRoot('src/polyfills'),
        injectErrorsGlobally$: resolveFromRoot('src/injectErrorsGlobally'),
        adapters$: resolveFromRoot('src/common/adapters'),
        currentPluginManifest$: manifest,
        xhrViaZenApi$: resolveFromRoot('src/XMLHttpRequestViaZenAPI'),
        querystring: 'querystring-browser'
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      fallback: {
        path: false,
        fs: false,
        Buffer: false,
        process: false
      }
    },
    module: {
      noParse: /\.wasm$/,
      rules: [
        {
          test: /\.[jt]sx?$/,
          resourceQuery: query => isBundleQuery(query),
          include: [paths.appSrc, fs.realpathSync(pluginPaths.path)],
          type: 'asset/source',
          loader: require.resolve('./jest-raw-loader')
        },
        ...Object.entries(assetLoaders).map(([extension, kind]) => ({
          test: filename => path.extname(filename) === extension,
          // Template entrypoints remain owned by their HTML plugins.
          ...kind === 'text' && { issuer: /\.[jt]sx?$/ },
          type: kind === 'base64' ? 'javascript/auto' : 'asset/source',
          loader: kind === 'base64' ? require.resolve('base64-loader') : require.resolve('./jest-raw-loader')
        })),
        {
          test: /ZenmoneyManifest\.(xml|[jt]s)$/,
          include: manifest,
          loader: resolveFromRoot('scripts/plugin-manifest-loader.js'),
          options: {
            emitManifest: production && !server,
            ...pluginPaths.family === 'receiptFetchers' && { manifestParser: require.resolve('../src/common/receiptFetcher/manifest.ts') }
          }
        },
        {
          test: /\.[jt]sx?$/,
          resourceQuery: query => !isBundleQuery(query),
          include: [paths.appSrc, fs.realpathSync(pluginPaths.path)],
          exclude: manifest,
          loader: require.resolve('esbuild-loader'),
          options: {
            target: 'es2020'
          }
        }
      ],
      parser: {
        javascript: {
          exportsPresence: 'error',
          importExportsPresence: 'error'
        }
      }
    },
    plugins: [
      ...production && !server ? [emitPluginArtifacts] : [],
      ...server
        ? [new HtmlWebpackPlugin(production
            ? {
                inject: false,
                template: paths.hostedPluginHtml
              }
            : {
                inject: true,
                template: paths.windowLoaderHtml
              })]
        : [],
      new DefinePlugin({
        ...!production && process.env.LOG_PRIVATE_KEY && { LOG_PRIVATE_KEY: readLogPrivateKey() }
      }),
      new NodePolyfillPlugin({
        excludeAliases: ['console', 'process', 'buffer', 'querystring']
      }), // need for some dependencies, eg cheerio
      new CaseSensitivePathsPlugin(),
      ...production
        ? [
            new WebpackObfuscator({
              optionsPreset: 'low-obfuscation',
              seed: 1985603785,
              disableConsoleOutput: false,

              identifierNamesGenerator: 'mangled',
              transformObjectKeys: true,
              stringArrayCallsTransformThreshold: 1,
              stringArrayWrappersCount: 2
            }),
            new LimitChunkCountPlugin({
              maxChunks: 1
            })
          ]
        : []
    ],
    ...server && {
      devServer: {
        static: {
          directory: paths.appPublic
        },
        devMiddleware: {
          publicPath: '/'
        },
        host: 'localhost',
        ...production && {
          host: '0.0.0.0',
          port: BOOTLOADER_PORT,
          allowedHosts: 'all',
          client: false,
          hot: false,
          liveReload: false
        },
        ...!production && { port: 'auto' },
        webSocketServer: WebsocketServer,

        onListening (devServer) {
          if (production) {
            const address = devServer.server.address()
            console.log(`Bootloader UI: http://localhost:${address.port}`)
          }
        },

        setupMiddlewares (middlewares, devServer) {
          const state = {
            cookies: [],
            wsResponseResults: {},
            wsOptions: {}
          }

          const app = devServer.app
          app.disable('x-powered-by')

          const proxy = setupProxyServer(state)
          if (production) {
            setupBootloaderServer({
              app,
              pluginPaths,
              storageDirectory: resolveFromRoot('.local/bootloader')
            })
          }
          setupWebServer({
            state,
            app,
            proxy,
            pluginPaths
          })

          return middlewares
        }
      }
    },
    performance: {
      hints: false
    },
    optimization: {
      minimize: Boolean(production),
      minimizer: production
        ? [
            new EsbuildPlugin({
              target: 'es2020'
            })
          ]
        : []
    },
    experiments: {
      asyncWebAssembly: true
    }
  }
}

module.exports = (env, argv) => {
  const server = env.WEBPACK_SERVE
  const production = argv.mode === 'production'
  const pluginsNames = env.PLUGIN.split(',')
  if (server && pluginsNames.length > 1) {
    throw new Error('Cant debug multiple plugins!')
  }
  const genPath = name => resolveFromRoot(production && !server ? `build/${name}` : 'build')

  const plugins = pluginsNames.map(name => {
    const pluginPaths = resolvePlugin(name)
    if (!pluginPaths) throw new Error(`cant resolve plugin "${name}"`)
    return generatePluginConfig(production, server, pluginPaths, genPath(name))
  })
  if (plugins.length === 1) {
    return plugins[0]
  }
  return plugins
}

module.exports.generatePluginConfig = generatePluginConfig
