const {convertManifestXmlToJs} = require("./utils");
const _ = require("lodash");

const expectedModularManifestFilesSection = `<files>
    <js>index.js</js>
    <preferences>preferences.xml</preferences>
</files>`;

const repositoryUri = "https://github.com/zenmoney/ZenPlugins/blob/master";
function generateModularLoader({files, preferences}) {
    if (!_.isEqual(files, ["index.js"]) || preferences !== "preferences.xml") {
        throw new Error("modular ZenMoneyManifest.xml files section must be exactly equal to:\n" + expectedModularManifestFilesSection);
    }
    return `require("polyfills");
var result = require("./index");

var exportsThatMakeNoDifference = Object.keys(result).filter((key) => key !== "main" && key !== "scrape");
if (exportsThatMakeNoDifference.length > 0) {
    console.error(exportsThatMakeNoDifference + " members exported by index.js are not handled by ZenMoney, thus looking like a developer mistake (exports are useless and make no effect). It is recommended to stop exporting them.  See: ${repositoryUri}");
}

if (result.scrape && result.main || !result.scrape && !result.main) {
    throw new Error("Either scrape() or main() should be exported from index.js (not both). See: ${repositoryUri}");
}

if (result.scrape) {
    var adaptScrapeToMain = require("adapters").adaptScrapeToMain;
    var main = adaptScrapeToMain(result.scrape);
    result = Object.assign({}, result, {main: main});
}

Object.assign(global, result);

module.exports = result;
`;
}
module.exports = function(xml) {
    this.cacheable && this.cacheable();
    const pluginManifest = convertManifestXmlToJs(xml);
    if (pluginManifest.modular !== "true") {
        return pluginManifest.files
            .map((file) => `require(${JSON.stringify("!!script-loader!./" + file)});`)
            .concat(`module.exports = {main: global.main};`).join("\n");
    }
    return generateModularLoader(pluginManifest);
};
