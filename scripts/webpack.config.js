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
const os = require('os')

const readLogPrivateKey = () => {
  try {
    return JSON.stringify(fs.readFileSync(process.env.LOG_PRIVATE_KEY, { encoding: 'utf8' }))
  } catch (e) {
    throw new Error('Could not read file at LOG_PRIVATE_KEY path')
  }
}

function generatePluginConfig (production, server, pluginName, outputPath) {
  const paths = resolveCommonFiles()
  const pluginPaths = resolvePlugin(pluginName)
  if (!pluginPaths) {
    throw new Error(`cant resolve plugin "${pluginName}"`)
  }

  return {
    mode: production ? 'production' : 'development',
    devtool: production ? false : 'eval',
    cache: {
      type: production ? 'filesystem' : 'memory',
      ...production && { name: pluginName }
    },
    entry: production
      ? { index: pluginPaths.js }
      : {
          windowLoader: [paths.windowLoaderJs],
          workerLoader: [paths.workerLoaderJs]
        },
    output: {
      path: outputPath,
      filename: '[name].js',
      chunkFilename: '[name].chunk.js',
      globalObject: 'this',
      ...production && {
        asyncChunks: false
      }
    },
    resolve: {
      alias: {
        'asap/raw$': resolveFromRoot('src/asapRawMock'),
        polyfills$: resolveFromRoot('src/polyfills'),
        injectErrorsGlobally$: resolveFromRoot('src/injectErrorsGlobally'),
        adapters$: resolveFromRoot('src/common/adapters'),
        currentPluginManifest$: pluginPaths.manifest,
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
          test: /\.wasm$/,
          // Tells WebPack that this module should be included as
          // base64-encoded binary file and not as code
          loader: 'base64-loader',
          // Disables WebPack's opinion where WebAssembly should be,
          // makes it think that it's not WebAssembly
          //
          // Error: WebAssembly module is included in initial chunk.
          type: 'javascript/auto'
        },
        {
          test: /ZenmoneyManifest.xml$/,
          include: pluginPaths.manifest,
          loader: resolveFromRoot('scripts/plugin-manifest-loader.js')
        },
        {
          test: /\.[jt]sx?$/,
          include: paths.appSrc,
          loader: require.resolve('esbuild-loader'),
          options: {
            target: 'es2015'
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
          host: 'local-ip',
          client: false,
          hot: false,
          liveReload: false
        },
        port: 'auto',
        webSocketServer: WebsocketServer,

        setupMiddlewares (middlewares, devServer) {
          const state = {
            cookies: [],
            wsResponseResults: {},
            wsOptions: {}
          }

          const app = devServer.app
          app.disable('x-powered-by')

          const proxy = setupProxyServer(state)
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
              target: 'es2015'
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
  const genPath = (pluginName) => pluginsNames.length === 1 ? resolveFromRoot('build') : resolveFromRoot(`build/${pluginName}`)

  const plugins = pluginsNames.map(x => generatePluginConfig(production, server, x, genPath(x)))
  if (plugins.length === 1) {
    return plugins[0]
  }
  plugins.parallelism = os.cpus().length
  return plugins
}
