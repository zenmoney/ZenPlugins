const { params } = require('./constants')
const fs = require('fs')
const cheerio = require('cheerio')

const convertManifestXmlToJs = (xml) => {
  const $ = cheerio.load(xml)
  return $('provider').children().toArray()
    .reduce((memo, node) => {
      const key = node.tagName
      if (key === 'files') {
        const result = $(node).children().toArray()
          .reduce((memo, fileNode) => {
            if (fileNode.tagName === 'preferences') {
              memo.preferences = $(fileNode).text()
            } else {
              memo.files.push($(fileNode).text())
            }
            return memo
          }, { files: [], preferences: null })
        Object.assign(memo, result)
      } else {
        memo[key] = $(node).text()
      }
      return memo
    }, {})
}

const readPluginManifest = () => {
  const xml = fs.readFileSync(`${params.pluginPath}/ZenmoneyManifest.xml`)
  return convertManifestXmlToJs(xml)
}

const readPluginPreferencesSchema = () => {
  const xml = fs.readFileSync(`${params.pluginPath}/${readPluginManifest().preferences}`)
  const $ = cheerio.load(xml)
  return $('EditTextPreference').toArray().map((preference) => {
    const $preference = $(preference)
    return {
      key: $preference.attr('key'),
      obligatory: $preference.attr('obligatory'),
      defaultValue: $preference.attr('defaultvalue')
    }
  })
}

module.exports = {
  convertManifestXmlToJs,
  readPluginManifest,
  readPluginPreferencesSchema
}
