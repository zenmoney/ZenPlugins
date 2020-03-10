import padLeft from 'pad-left'

export const toAtLeastTwoDigitsString = (number) => padLeft(number, 2, '0')

export function getByteLength (str) {
  // returns the byte length of an utf8 string
  let s = str.length
  for (let i = str.length - 1; i >= 0; i--) {
    let code = str.charCodeAt(i)
    if (code > 0x7f && code <= 0x7ff) {
      s++
    } else if (code > 0x7ff && code <= 0xffff) {
      s += 2
    }
    if (code >= 0xDC00 && code <= 0xDFFF) {
      i--
    } // trail surrogate
  }
  return s
}

export function chunkString (str, n) {
  const ret = []
  for (let i = 0; i < str.length; i += n) {
    ret.push(str.substring(i, Math.min(i + n, str.length)))
  }
  return ret
}
