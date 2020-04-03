const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const eslintFormatter = require('react-dev-utils/eslintFormatter')
const { paths, resolve } = require('./constants')
const _ = require('lodash')
const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

const getHtmlPlugins = ({ production, devServer }) => {
  if (!devServer) {
    return []
  }
  if (production) {
    return [
      new HtmlWebpackPlugin({
        inject: false,
        template: paths.hostedPluginHtml
      })
    ]
  } else {
    return [
      new HtmlWebpackPlugin({
        inject: true,
        template: paths.windowLoaderHtml,
        excludeAssets: [/workerLoader/]
      }),
      new HtmlWebpackExcludeAssetsPlugin()
    ]
  }
}

const getPluginsSection = ({ production, devServer }) => getHtmlPlugins({ production, devServer }).concat(_.compact([
  new webpack.NamedModulesPlugin(),
  !production && new webpack.HotModuleReplacementPlugin(),
  new webpack.DefinePlugin({
    NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
  }),
  new CaseSensitivePathsPlugin()
]))

module.exports = ({ production, devServer }) => ({
  mode: production ? 'production' : 'development',
  devtool: production ? false : 'eval',
  entry: production
    ? {
      index: paths.pluginJs
    }
    : {
      windowLoader: [
        !production && require.resolve('react-dev-utils/webpackHotDevClient'),
        paths.windowLoaderJs
      ],
      workerLoader: paths.workerLoaderJs
    },
  output: {
    path: paths.appBuild,
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    globalObject: 'this'
  },
  resolve: {
    alias: {
      'asap/raw': resolve('src/asapRawMock'),
      polyfills: resolve('src/polyfills'),
      injectErrorsGlobally: resolve('src/injectErrorsGlobally'),
      adapters: resolve('src/common/adapters'),
      currentPluginManifest: paths.pluginJs,
      xhrViaZenApi: resolve('src/XMLHttpRequestViaZenAPI')
    }
  },
  module: {
    strictExportPresence: true,
    rules: _.compact([
      {
        test: /ZenmoneyManifest.xml$/,
        include: paths.pluginJs,
        loader: path.resolve(__dirname, './plugin-manifest-loader.js')
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: [
          {
            options: {
              formatter: eslintFormatter,
              eslintPath: require.resolve('eslint')
            },
            loader: require.resolve('eslint-loader')
          }
        ],
        include: paths.appSrc
      },
      {
        test: /\.js$/,
        include: paths.appSrc,
        loader: require.resolve('babel-loader'),
        options: production ? {} : {
          cacheDirectory: true
        }
      },
      {
        test: /\.proto$/,
        use: {
          loader: require.resolve('protobufjs-loader-webpack4'),
          options: {}
        }
      }
    ])
  },
  plugins: getPluginsSection({ production, devServer }),
  performance: {
    hints: false
  },
  optimization: {
    minimize: Boolean(production),
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false
          }
        }
      })
    ]
  }
})
