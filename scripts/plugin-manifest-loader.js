const {convertManifestXmlToJs} = require('./utils');

module.exports = function(xml) {
  this.cacheable && this.cacheable();
  var manifest = convertManifestXmlToJs(xml);
  if (manifest.modular === 'true') {
    return `var result = require(${JSON.stringify('./index')});
    for (var key in result) {
      if(result.hasOwnProperty(key)) {
        global[key] = result[key];
      }
    }
    module.exports = result;`;
  } else {
    return manifest.files.map(f => `require(${JSON.stringify('!!script-loader!./' + f)});`)
      .concat(`module.exports = {main: global.main};`).join('\n');
  }
};
