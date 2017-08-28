const path = require("path");
const resolve = relativePath => path.resolve(process.cwd(), relativePath);

if (!process.env.PLUGIN) {
    throw new Error("PLUGIN env var must be set");
}

const params = {
    pluginPath: resolve(process.env.PLUGIN),
    pluginName: process.env.PLUGIN,
};

const paths = {
    appBuild: resolve("build"),
    appSrc: resolve("src"),
    appPublic: resolve("public"),
    appHtml: resolve("public/index.html"),
    windowLoaderJs: resolve("src/windowLoader.js"),
    workerLoaderJs: resolve("src/workerLoader.js"),
    pluginJs: params.pluginPath,
    appPackageJson: resolve("package.json"),
    yarnLockFile: resolve("yarn.lock"),
    testsSetup: resolve("src/setupTests.js"),
};

module.exports = {paths, params};