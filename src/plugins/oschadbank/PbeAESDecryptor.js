import forge from 'node-forge'
import { byteStringToByteArray } from '../../common/byteStringUtils'

export class PbeAESDecryptor {
  constructor (secret, salt, iterationCount, keyLength, iv, keyDerivation) { // keyLength must be in bytes
    this._iterationCount = iterationCount
    this._keyLength = keyLength
    this._key = this.generateKey(secret, salt)
    this._initializeVector = forge.util.hexToBytes(iv)
  }

  generateKey (key, salt) {
    return byteStringToByteArray(forge.pkcs5.pbkdf2(key, forge.util.hexToBytes(salt), 1024, 16, 'sha1'))
  }

  decrypt (data) {
    const decipher = forge.cipher.createDecipher('AES-CBC', this._key)
    decipher.start({ iv: this._initializeVector })
    decipher.update(forge.util.createBuffer(forge.util.hexToBytes(data)))
    console.assert(decipher.finish(), 'Could not decipher data')
    return byteStringToByteArray(decipher.output.data)
  }
}
