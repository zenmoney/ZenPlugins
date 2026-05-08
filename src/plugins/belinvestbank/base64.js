const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function utf8ToBytes (str) {
  const octets = []
  let i = 0
  while (i < str.length) {
    const codePoint = str.codePointAt(i)
    let shift = 0
    let prefix = 0
    if (codePoint <= 0x7F) {
      shift = 0
      prefix = 0x00
    } else if (codePoint <= 0x7FF) {
      shift = 6
      prefix = 0xC0
    } else if (codePoint <= 0xFFFF) {
      shift = 12
      prefix = 0xE0
    } else {
      shift = 18
      prefix = 0xF0
    }
    octets.push(prefix | (codePoint >> shift))
    shift -= 6
    while (shift >= 0) {
      octets.push(0x80 | ((codePoint >> shift) & 0x3F))
      shift -= 6
    }
    i += codePoint >= 0x10000 ? 2 : 1
  }
  return octets
}

export function encodeUtf8ToBase64 (str) {
  let result = ''
  const bytes = utf8ToBytes(str)
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0
    const chunk = (a << 16) | (b << 8) | c
    result += BASE64_CHARS[(chunk >> 18) & 0x3F]
    result += BASE64_CHARS[(chunk >> 12) & 0x3F]
    result += i + 1 < bytes.length ? BASE64_CHARS[(chunk >> 6) & 0x3F] : '='
    result += i + 2 < bytes.length ? BASE64_CHARS[chunk & 0x3F] : '='
  }
  return result
}
