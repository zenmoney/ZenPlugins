const {params} = require("./constants");
const fs = require("fs");
const cheerio = require("cheerio");

const convertManifestXmlToJs = (xml) => {
    const $ = cheerio.load(xml);
    return $("provider").children().toArray()
        .reduce((memo, node) => {
            const key = node.tagName;
            if (key === "files") {
                const result = $(node).children().toArray()
                    .reduce((memo, fileNode) => {
                        if (fileNode.tagName === "preferences") {
                            memo.preferences = $(fileNode).text();
                        } else {
                            memo.files.push($(fileNode).text());
                        }
                        return memo;
                    }, {files: [], preferences: null});
                Object.assign(memo, result);
            } else {
                memo[key] = $(node).text();
            }
            return memo;
        }, {});
};

const getManifest = () => {
    const xml = fs.readFileSync(`${params.pluginPath}/ZenmoneyManifest.xml`);
    return convertManifestXmlToJs(xml);
};

module.exports = {
    convertManifestXmlToJs,
    getManifest,
};
