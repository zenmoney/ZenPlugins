const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackExcludeAssetsPlugin = require("html-webpack-exclude-assets-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const eslintFormatter = require("react-dev-utils/eslintFormatter");
const {paths} = require("./constants");
const _ = require("underscore");
const path = require("path");
const currentPluginManifest = path.join(paths.pluginJs, "./ZenmoneyManifest.xml");

module.exports = ({production}) => ({
    devtool: production ? false : "eval",
    entry: production
        ? {
            index: currentPluginManifest,
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
            currentPluginManifest: currentPluginManifest,
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
                options: {
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
