import * as forge from 'node-forge'

// data = bytes array, key = hex string
export function getX919MAC (data, key) {
  const keyEnc = key.slice(0, 16)
  const keyDec = key.slice(16, 32)
  let dataBlock = [0, 0, 0, 0, 0, 0, 0, 0]

  const cipher0 = forge.cipher.createCipher('DES-ECB', convertHexStringToString(keyEnc))
  let forgeBytes
  const length = data.length
  let blockSize
  let remainBytes
  let i = 0

  const padBytes = 8 - length % 8
  if (padBytes !== 8) {
    for (let j = 0; j < padBytes; j++) {
      data.push(0)
    }
  }

  while (true) {
    remainBytes = length - i
    if (remainBytes <= 0) {
      break
    }

    blockSize = Math.min(8, remainBytes)
    for (let j = 0; j < blockSize; j++) {
      dataBlock[j] = data[i] ^ dataBlock[j]
      i++
    }

    forgeBytes = forge.util.hexToBytes(convertArrayBufToHexString(dataBlock))
    cipher0.start()
    cipher0.update(forge.util.createBuffer(forgeBytes))
    cipher0.finish()
    dataBlock = []
    dataBlock.push(...convertHexStringToByteArray(cipher0.output.toHex()))
    dataBlock = dataBlock.slice(0, 8)
  }

  const dataEncryptedHex0 = convertArrayBufToHexString(dataBlock)

  const decipher = forge.cipher.createDecipher('DES-ECB', convertHexStringToString(keyDec))
  decipher.start()
  forgeBytes = forge.util.hexToBytes(dataEncryptedHex0)
  decipher.update(forge.util.createBuffer(forgeBytes))
  decipher.finish()
  const dataDecryptedHex = decipher.output.toHex().slice(0, 16)

  const cipher = forge.cipher.createCipher('DES-ECB', convertHexStringToString(keyEnc))
  cipher.start()
  forgeBytes = forge.util.hexToBytes(dataDecryptedHex)
  cipher.update(forge.util.createBuffer(forgeBytes))
  cipher.finish()
  const dataEncryptedHex = cipher.output.toHex().slice(0, 16)

  return dataEncryptedHex
}

function convertHexStringToByteArray (hexString) {
  const strLen = hexString.length
  const result = []
  for (let i = 0; i < strLen; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16))
  }
  return result
}

function convertArrayBufToHexString (ArrayBuf) {
  return Array.prototype.map.call(new Uint8Array(ArrayBuf), x => ('0' + x.toString(16)).slice(-2)).join('')
}

function convertHexStringToString (hex) {
  let str = ''
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  }
  return str
}
