process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";
process.on("unhandledRejection", err => {
    throw err;
});

const chalk = require("chalk");
const fs = require("fs-extra");
const webpack = require("webpack");
const createWebpackConfig = require("./webpack.config");
const {paths} = require("./constants");
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const printBuildError = require("react-dev-utils/printBuildError");

if (!checkRequiredFiles([paths.pluginJs])) {
    process.exit(1);
}

build().then(({warnings}) => {
    if (warnings.length) {
        console.log(chalk.yellow("Compiled with warnings.\n"));
        console.log(warnings.join("\n\n"));
        console.log(
            "\nSearch for the " +
            chalk.underline(chalk.yellow("keywords")) +
            " to learn more about each warning."
        );
    } else {
        console.log(chalk.green("Compiled successfully.\n"));
    }
}, err => {
    console.log(chalk.red("Failed to compile.\n"));
    printBuildError(err);
    process.exit(1);
});

function build() {
    console.log("Compiling...");
    fs.emptyDirSync(paths.appBuild);

    const webpackConfig = createWebpackConfig({production: true, devServer: false});
    const compiler = webpack(webpackConfig);
    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                return reject(err);
            }
            const messages = formatWebpackMessages(stats.toJson({}, true));
            if (messages.errors.length) {
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }
                return reject(new Error(messages.errors.join("\n\n")));
            }
            if (
                process.env.CI &&
                (typeof process.env.CI !== "string" ||
                process.env.CI.toLowerCase() !== "false") &&
                messages.warnings.length
            ) {
                console.log(
                    chalk.yellow(
                        "\nTreating warnings as errors because process.env.CI = true.\n" +
                        "Most CI servers set it automatically.\n"
                    )
                );
                return reject(new Error(messages.warnings.join("\n\n")));
            }
            return resolve({
                warnings: messages.warnings,
            });
        });
    });
}
