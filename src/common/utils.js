import padLeft from 'pad-left'

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
