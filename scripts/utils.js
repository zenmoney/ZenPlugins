const _ = require('lodash')
const stripBOM = require('strip-bom')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const { parse: parseCookieString, splitCookiesString } = require('set-cookie-parser')

const convertManifestXmlToJs = (xml) => {
  const $ = cheerio.load(xml, {
    xmlMode: true
  })
  return $('provider').children().toArray()
    .reduce((memo, node) => {
      memo[node.tagName] = $(node).text()
      return memo
    }, {})
}

const resolveEntryFile = (directory, base) => {
  const files = ['js', 'ts'].map(extension => path.join(directory, `${base}.${extension}`)).filter(file => fs.existsSync(file))
  if (files.length > 1) throw new Error(`Ambiguous ${base} extensions in ${directory}`)
  if (files.length === 0) throw new Error(`Missing ${base} in ${directory}`)
  return files[0]
}

const dedentDescription = (text) => {
  const lines = text.split(/\r\n?|\n/)
  const isBlank = line => /^[ \t]*$/.test(line)
  while (lines.length && isBlank(lines[0])) lines.shift()
  while (lines.length && isBlank(lines[lines.length - 1])) lines.pop()
  if (!lines.length) return ''
  const indents = lines.slice(1).filter(line => !isBlank(line)).map(line => line.match(/^[ \t]*/)[0].length)
  const indent = indents.length ? Math.min(...indents) : 0
  return lines.map((line, index) => {
    if (index === 0) return line.replace(/^[ \t]+/, '')
    return isBlank(line) ? '' : line.slice(indent)
  }).join('\n')
}

const prepareScrapeManifest = (source, directory) => {
  const manifest = convertManifestXmlToJs(source)
  for (const field of ['version', 'build', 'modular', 'files']) {
    if (Object.hasOwn(manifest, field)) throw new Error(`Source manifest must not declare ${field}`)
  }
  const index = resolveEntryFile(directory, 'index')
  const preferences = fs.statSync(path.join(directory, 'preferences.xml'), { throwIfNoEntry: false }) ? 'preferences.xml' : null
  const $ = cheerio.load(source, { xmlMode: true })
  $('provider > description').each((_, element) => {
    const description = $(element)
    // Normalize plain text without flattening embedded XML markup.
    if (description.children().length === 0) {
      const text = description.text()
      const normalized = dedentDescription(text)
      if (normalized !== text) {
        manifest.description = normalized
        description.text(normalized)
      }
    }
  })
  $('provider').append(`<files><js>index.js</js>${preferences ? '<preferences>preferences.xml</preferences>' : ''}</files>`)
  return { index, manifest: { ...manifest, files: ['index.js'], preferences }, xml: $.xml() }
}

const readPluginManifest = (manifestPath) => {
  const xml = fs.readFileSync(manifestPath)
  return prepareScrapeManifest(xml, path.dirname(manifestPath)).manifest
}

const readPluginPreferencesSchema = (xmlPreferencesPath) => {
  let xml
  try {
    xml = fs.readFileSync(xmlPreferencesPath)
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
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

const convertErrorToSerializable = (e) => _.pick(e, ['message', 'stack'])

const makeCookieAccessibleToClientSide = (value) => {
  return value
    .replace(/\s?HttpOnly(;|\s*$)/ig, '')
    .replace(/\s?Secure(;|\s*$)/ig, '')
    .replace(/\s?Domain=[^;]*(;|\s*$)/ig, '')
    .replace(/\s?SameSite=[^;]*(;|\s*$)/ig, '')
}

const serializeErrors = (handler) => {
  return function (req, res) {
    try {
      handler.apply(this, arguments)
    } catch (e) {
      res.status(500).json(convertErrorToSerializable(e))
    }
  }
}

const readJsonSync = (file) => {
  const content = readPluginFileSync(file)
  try {
    return JSON.parse(content)
  } catch (e) {
    e.message += ` in ${file}`
    throw e
  }
}

const readPluginFileSync = (filepath) => stripBOM(fs.readFileSync(filepath, 'utf8'))

const ensureFileExists = (filepath, defaultContent) => {
  try {
    fs.writeFileSync(filepath, defaultContent, { encoding: 'utf8', flag: 'wx' })
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e
    }
  }
}

const isWebSocketHeader = (header) => {
  const key = header.toLowerCase()
  return key.startsWith('sec-websocket-') || ['connection', 'upgrade'].indexOf(key) >= 0
}

module.exports = {
  convertManifestXmlToJs,
  resolveEntryFile,
  prepareScrapeManifest,
  readPluginManifest,
  readPluginPreferencesSchema,
  parseCookies,
  addCookies,
  convertErrorToSerializable,
  makeCookieAccessibleToClientSide,
  serializeErrors,
  readJsonSync,
  readPluginFileSync,
  ensureFileExists,
  isWebSocketHeader
}
