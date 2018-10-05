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

function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
