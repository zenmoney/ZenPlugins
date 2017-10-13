const {convertManifestXmlToJs} = require("./utils");

module.exports = function(xml) {
    this.cacheable && this.cacheable();
    const manifest = convertManifestXmlToJs(xml);
    if (manifest.modular === "true") {
        return `
require("polyfills");
var result = require("./index");
if (result.scrape && result.main || !result.scrape && !result.main) {
    throw new Error("Either scrape or main function should be exported from plugin index file");
}
if (result.scrape) {
    var adaptScrapeToMain = require("adapters").adaptScrapeToMain;
    var main = adaptScrapeToMain(result.scrape);
    result = Object.assign({}, result, {main: main});
}
for (var key in result) {
    if (result.hasOwnProperty(key)) {
        global[key] = result[key];
    }
}
module.exports = result;`;
    } else {
        return manifest.files.map(f => `require(${JSON.stringify("!!script-loader!./" + f)});`)
            .concat(`module.exports = {main: global.main};`).join("\n");
    }
};
