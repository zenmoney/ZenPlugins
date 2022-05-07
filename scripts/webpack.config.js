const { DefinePlugin } = require('webpack')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const {
  resolvePlugin,
  resolveFromRoot,
  resolveCommonFiles
} = require('./pathResolvers')
const fs = require('fs')
const TerserPlugin = require('terser-webpack-plugin')
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
    entry: production
      ? { index: pluginPaths.js }
      : { windowLoader: [paths.windowLoaderJs] },
    output: {
      path: outputPath,
      filename: '[name].js',
      chunkFilename: '[name].chunk.js',
      globalObject: 'this'
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
      extensions: ['.js', '.ts', '.json']
    },
    module: {
      rules: [
        {
          test: /ZenmoneyManifest.xml$/,
          include: pluginPaths.manifest,
          loader: resolveFromRoot('scripts/plugin-manifest-loader.js')
        },
        {
          test: /\.(js|ts)$/,
          include: paths.appSrc,
          loader: require.resolve('babel-loader'),
          options: production
            ? {}
            : { cacheDirectory: true }
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
      new ESLintPlugin({
        context: paths.appSrc,
        eslintPath: require.resolve('eslint')
      }),
      new DefinePlugin({
        ...!production && process.env.LOG_PRIVATE_KEY && { LOG_PRIVATE_KEY: readLogPrivateKey() }
      }),
      new NodePolyfillPlugin({
        excludeAliases: ['console', 'process', 'buffer', 'querystring']
      }), // need for some dependencies, eg cheerio
      new CaseSensitivePathsPlugin(),
      ...production
        ? [
            new TerserPlugin({}),
            new WebpackObfuscator({
              optionsPreset: 'low-obfuscation',
              seed: 1985603785,
              disableConsoleOutput: false,

              identifierNamesGenerator: 'mangled',
              transformObjectKeys: true,
              stringArrayCallsTransformThreshold: 1,
              stringArrayWrappersCount: 2
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
        host: 'localhost', // available on your dev machine only
        // host: 'local-ip', // available on local network — use with caution: opens security hole allowing credentials leak
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
      minimize: false
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
