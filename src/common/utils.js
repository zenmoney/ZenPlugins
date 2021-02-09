import padLeft from 'pad-left'
import { IncompatibleVersionError } from '../errors'

export function isDebug () {
  return global.ZenMoney && ZenMoney.application && ZenMoney.application.platform === 'browser'
}

export function generateUUID () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
    const seed = Math.random() * 16 | 0
    // eslint-disable-next-line no-mixed-operators
    const hexValue = char === 'x' ? seed : (seed & 0x3 | 0x8)
    return hexValue.toString(16)
  })
}

export function generateRandomString (length, chars) {
  if (typeof chars !== 'string') {
    chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  }
  const buf = []
  for (let i = 0; i < length; i++) {
    buf.push(chars[randomInt(0, chars.length - 1)])
  }
  return buf.join('')
}

export function generateMacAddress () {
  return 'xx:xx:xx:xx:xx:xx'.replace(/[xy]/g, char => (Math.random() * 16 | 0).toString(16))
}

export function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

let byteToHex = null

export function bufferToHex (arrayBuffer) {
  if (!byteToHex) {
    const _byteToHex = []
    for (let i = 0; i <= 0xff; i++) {
      const hexOctet = padLeft(i.toString(16).toLowerCase(), 2, '0')
      _byteToHex.push(hexOctet)
    }
    byteToHex = _byteToHex
  }
  const bytes = new Uint8Array(arrayBuffer)
  const hexOctets = new Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    hexOctets[i] = byteToHex[bytes[i]]
  }
  return hexOctets.join('')
}

export async function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function takePicture (format) {
  if (!global.ZenMoney?.takePicture) {
    throw new IncompatibleVersionError()
  }
  return new Promise((resolve, reject) => {
    ZenMoney.takePicture(format, (err, picture) => {
      if (err) {
        reject(err)
      } else {
        resolve(picture)
      }
    })
  })
}

export function parseCSV (str) {
  const arr = []
  let quote = false // 'true' means we're inside a quoted field

  // Iterate over each character, keep track of current row and column (of the returned array)
  for (let row = 0, col = 0, c = 0; c < str.length; c++) {
    const cc = str[c]; const nc = str[c + 1] // Current character, next character
    arr[row] = arr[row] || [] // Create a new row if necessary
    arr[row][col] = arr[row][col] || '' // Create a new column (start with empty string) if necessary

    // If the current character is a quotation mark, and we're inside a
    // quoted field, and the next character is also a quotation mark,
    // add a quotation mark to the current column and skip the next character
    if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue }

    // If it's just one quotation mark, begin/end quoted field
    if (cc === '"') { quote = !quote; continue }

    // If it's a comma and we're not in a quoted field, move on to the next column
    if (cc === ',' && !quote) { ++col; continue }

    // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
    // and move on to the next row and move to column 0 of that new row
    if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue }

    // If it's a newline (LF or CR) and we're not in a quoted field,
    // move on to the next row and move to column 0 of that new row
    if (cc === '\n' && !quote) { ++row; col = 0; continue }
    if (cc === '\r' && !quote) { ++row; col = 0; continue }

    // Otherwise, append the current character to the current column
    arr[row][col] += cc
  }
  return arr
}
