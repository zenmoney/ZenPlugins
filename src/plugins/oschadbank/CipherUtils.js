import forge from 'node-forge'
import { byteArrayToByteString, byteStringToByteArray } from '../../common/byteStringUtils'

export class CipherUtils {
  static int2Bytes (data) {
    return [(data & 0xFF000000) >> 24, (data & 0x00FF0000) >> 16, (data & 0xFF00) >> 8, data & 0xFF]
  }

  static generateAnsiX919Mac (payload, key) {
    const cipher = forge.cipher.createCipher('DES-ECB', byteArrayToByteString(key.slice(0, 8)))
    cipher.start()
    const decipher = forge.cipher.createDecipher('DES-ECB', byteArrayToByteString(key.slice(8, 16)))
    decipher.start()
    decipher.update(forge.util.createBuffer(byteArrayToByteString(this.processMAC(payload, cipher))))
    const data = byteStringToByteArray(decipher.output.data)
    cipher.update(forge.util.createBuffer(byteArrayToByteString(data)))
    return byteStringToByteArray(cipher.output.data)
  }

  static ecnrypt3DesData (data, key) {
    const cipher = forge.cipher.createCipher('DES-ECB', byteArrayToByteString(key))
    cipher.start()
    cipher.update(forge.util.createBuffer(byteArrayToByteString(data)))
    return byteStringToByteArray(cipher.output.data)
  }

  static processMAC (bArr, cipher) {
    let bArr2 = new Array(8)
    for (let i = 0, i2 = bArr.length; i2 > 0; i2 = bArr.length - i) {
      let min = Math.min(8, i2)
      if (min > 8) {
        min = 8
      }
      let i3 = i
      let i4 = 0
      for (; i4 < min; i4++, i3++) {
        bArr2[i4] = (bArr[i3] ^ bArr2[i4]) & 0xFF
      }
      cipher.update(forge.util.createBuffer(byteArrayToByteString(bArr2)))
      bArr2 = byteStringToByteArray(cipher.output.data)
      cipher.finish()
      cipher.start()
      i = i3
    }
    return bArr2
  }
}
