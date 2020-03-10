import * as forge from 'node-forge'

export function byteStringToByteArray (str) {
  const bytesArray = []
  for (let i = 0; i < str.length; i++) {
    bytesArray.push(str.charCodeAt(i))
  }
  return bytesArray
}

export function getByteStringFromString (str, encoding = 'utf8') {
  return forge.util.createBuffer(str, encoding).getBytes()
}
