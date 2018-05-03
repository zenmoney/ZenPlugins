const path = require("path");
const resolve = relativePath => path.resolve(process.cwd(), relativePath);
const chalk = require("chalk");

if (!process.env.PLUGIN) {
    const scriptName = path.basename(process.argv.find((x) => x.endsWith(".js")), ".js");
    const command = process.platform === "win32"
        ? `set "PLUGIN=src/plugins/example" && yarn ${scriptName}`
        : `PLUGIN=src/plugins/example yarn ${scriptName}`;
    console.error(`${chalk.red("You must specify plugin path in PLUGIN env var to proceed, e.g.:")}\n${chalk.cyan(command)}`);
    process.exit(1);
}

const params = {
    pluginPath: resolve(process.env.PLUGIN),
    pluginName: process.env.PLUGIN,
};

const paths = {
    appBuild: resolve("build"),
    appSrc: resolve("src"),
    appPublic: resolve("scripts/public"),
    hostedPluginHtml: resolve("scripts/public/hostedPlugin.html"),
    windowLoaderHtml: resolve("scripts/public/windowLoader.html"),
    windowLoaderJs: resolve("src/windowLoader.js"),
    workerLoaderJs: resolve("src/workerLoader.js"),
    pluginJs: path.join(params.pluginPath, "./ZenmoneyManifest.xml"),
    appPackageJson: resolve("package.json"),
    yarnLockFile: resolve("yarn.lock"),
    testsSetup: resolve("src/setupTests.js"),
};

module.exports = {resolve, paths, params};
