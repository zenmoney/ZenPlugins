const path = require("path");
const resolve = relativePath => path.resolve(process.cwd(), relativePath);
const chalk = require("chalk");
const fs = require("fs");

const pluginName = process.argv.slice(2).join(" ");
if (pluginName) {
    if (process.env.PLUGIN) {
        console.error(chalk.red(`providing PLUGIN env variable "${process.env.PLUGIN}" together with argv "${pluginName}" is ambiguous, thus prohibited`));
        process.exit(1);
    }
    const candidates = [
        `src/plugins/${pluginName}`,
        `plugins/${pluginName}`,
        pluginName,
    ];
    const existingCandidate = candidates.find((x) => fs.existsSync(x));
    if (!existingCandidate) {
        console.error(chalk.red("Neither of the following folders exists:"));
        console.error(candidates.map(resolve));
        console.error(chalk.red(`Make sure "${pluginName}" is a valid existing plugin name or path`));
        process.exit(1);
    }
    process.env.PLUGIN = existingCandidate;
}

if (!process.env.PLUGIN) {
    const scriptName = path.basename(process.argv.find((x) => x.endsWith(".js")), ".js");
    console.error(`${chalk.red("You must specify plugin path in PLUGIN env var to proceed, e.g.:")}\n${chalk.cyan(`yarn ${scriptName} example`)}`);
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
