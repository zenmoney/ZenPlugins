import { Buffer } from 'buffer'
import { decode } from 'iconv-lite'

export function decodeString (str, encoding = 'utf8') {
  if (encoding === 'utf8') {
    return str
  } else {
    return decode(Buffer.from(str, 'binary'), encoding)
  }
}
