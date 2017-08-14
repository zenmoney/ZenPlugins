const {convertManifestXmlToJs} = require('./utils');

module.exports = function(xml) {
  this.cacheable && this.cacheable();
  var manifest = convertManifestXmlToJs(xml);
  if (manifest.modular === 'true') {
    return `var result = require(${JSON.stringify('./index')});
global.main = result.main;
module.exports = result;`;
  } else {
    return manifest.files.map(f => `require(${JSON.stringify('!!script-loader!./' + f)});\n`).join('') +
      `module.exports = {main: global.main};`;
  }
};
