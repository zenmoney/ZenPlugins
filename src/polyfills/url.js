const punicode = require('punycode')
if (!punicode.ucs2) {
  punicode.ucs2 = punicode.default.ucs2
}
const { URL, URLSearchParams } = require('whatwg-url-without-unicode')

if (!global.URL) {
  global.URL = URL
  global.URLSearchParams = URLSearchParams
}
