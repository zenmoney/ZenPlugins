const { params } = require('./constants')
const fs = require('fs')
const cheerio = require('cheerio')
const { parse: parseCookieString, splitCookiesString } = require('set-cookie-parser')

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

const addCookies = (newCookies, cookies) => {
  cookies = cookies.slice()
  for (const cookie of newCookies) {
    for (let i = 0; i < cookies.length; i++) {
      const existing = cookies[i]
      if (existing.name === cookie.name) {
        cookies.splice(i, 1)
        break
      }
    }
    if (cookie.value !== null && cookie.value !== undefined) {
      cookies.push(cookie)
    }
  }
  return cookies
}

const parseCookies = (cookieStr, now) => parseCookieString(splitCookiesString(cookieStr)).map(c => {
  const cookie = {}
  cookie.name = c.name
  cookie.value = c.value
  cookie.domain = c.domain || null
  cookie.path = c.path || null
  cookie.persistent = true
  cookie.secure = c.secure || false
  const expires = c.expires ? c.expires : 'maxAge' in c ? new Date(now.getTime() + c.maxAge * 1000) : null
  if (expires) {
    cookie.expires = expires.toUTCString()
  } else {
    cookie.expires = null
  }
  return cookie
})

module.exports = {
  convertManifestXmlToJs,
  readPluginManifest,
  readPluginPreferencesSchema,
  parseCookies,
  addCookies
}
