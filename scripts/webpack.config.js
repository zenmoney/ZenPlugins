const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackExcludeAssetsPlugin = require("html-webpack-exclude-assets-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const eslintFormatter = require("react-dev-utils/eslintFormatter");
const {paths, resolve} = require("./constants");
const _ = require("underscore");
const path = require("path");

module.exports = ({production}) => ({
    devtool: production ? false : "eval",
    entry: production
        ? {
            index: paths.pluginJs,
        }
        : {
            windowLoader: paths.windowLoaderJs,
            workerLoader: paths.workerLoaderJs,
        },
    output: {
        path: paths.appBuild,
        filename: "[name].js",
        chunkFilename: "[name].chunk.js",
    },
    resolve: {
        alias: {
            "asap/raw": resolve("src/asapRawMock"),
            polyfills: resolve("src/polyfills"),
            adapters: resolve("src/common/adapters"),
            currentPluginManifest: paths.pluginJs,
            xhrViaZenApi: resolve("src/XMLHttpRequestViaZenAPI"),
        },
    },
    module: {
        strictExportPresence: true,
        rules: _.compact([
            {
                test: /ZenmoneyManifest.xml$/,
                include: paths.pluginJs,
                loader: path.resolve(__dirname, "./plugin-manifest-loader.js"),
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: [
                    {
                        options: {
                            formatter: eslintFormatter,
                            eslintPath: require.resolve("eslint"),
                        },
                        loader: require.resolve("eslint-loader"),
                    },
                ],
                include: paths.appSrc,
            },
            {
                test: /\.js$/,
                include: paths.appSrc,
                loader: require.resolve("babel-loader"),
                options: production ? {} : {
                    cacheDirectory: true,
                },
            },
        ]),
    },
    plugins: _.compact([
        !production && new HtmlWebpackPlugin({
            inject: true,
            template: paths.appHtml,
            excludeAssets: [/workerLoader/],
        }),
        !production && new HtmlWebpackExcludeAssetsPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.DefinePlugin({
            NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development"),
        }),
        new CaseSensitivePathsPlugin(),
    ]),
    performance: {
        hints: false,
    },
});
