// import { byteArrayToByteString } from '../../common/byteStringUtils'
import { CipherUtils } from './CipherUtils'
import { PbeAESDecryptor } from './PbeAESDecryptor'

export class OTPGenerator {
  constructor (cryptedKey, pin, sessionNumber, keyGeneratorConfig, cypherAlgorithmConfig) {
    this._cryptedKey = cryptedKey
    this._pin = pin
    this._sessionNumber = sessionNumber + 1
    this._keyGeneratorConfig = keyGeneratorConfig
    this._cypherAlgorithmConfig = cypherAlgorithmConfig
  }

  getSessionNumber () {
    return this._sessionNumber
  }

  generateOTP () {
    // const i = 0, j = 0, i2 = 0, i3 = 0
    const zeroArr = [0, 0, 0, 0]
    const bArr2 = [(this._sessionNumber & 0xFF00) >> 8, this._sessionNumber & 0xFF, 0, 0, 0, 0, 0, 0]
    const wK = this.createWK(bArr2)
    const bArr = this.generateApplicationRequestCryptogram(wK, zeroArr, null, null)
    const sessionNumberBytes = CipherUtils.int2Bytes(this._sessionNumber)
    return '' + ((sessionNumberBytes[3] & 0xFF) << 16) | ((bArr[0] & 0xFF) << 8) | (bArr[1] & 0xFF)
  }

  generateApplicationRequestCryptogram (bArr, bArr2, bArr3, bArr4) {
    const transactionData = this.prepareTransactionData(bArr2, bArr3, bArr4)
    const ansiX919Mac = CipherUtils.generateAnsiX919Mac(transactionData, bArr)
    if (ansiX919Mac.length === 8) {
      return ansiX919Mac
    }
    return null
  }

  prepareTransactionData (bArr, bArr2, bArr3) {
    const transactionData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 3, 164, 48, 6, 128, 0, 0]
    this.arrayCopy(bArr, 0, transactionData, 25, 4)
    this.arrayCopy(CipherUtils.int2Bytes(this._sessionNumber), 2, transactionData, 31, 2)
    if (bArr2 !== null) {
      this.arrayCopy(bArr2, 0, transactionData, 0, 6)
    }
    if (bArr3 !== null) {
      this.arrayCopy(bArr3, 0, transactionData, 19, 2)
    }
    return transactionData
  }

  createWK (dataArray) {
    const masterKey = this.getMasterKey()
    if (masterKey !== null) {
      const bArr2 = new Array(16)
      this.arrayCopy(dataArray, 0, bArr2, 0, 8)
      this.arrayCopy(dataArray, 0, bArr2, 8, 8)
      bArr2[2] = (bArr2[2] ^ 240) & 0xFF
      bArr2[10] = (bArr2[10] ^ 15) & 0xFF
      return CipherUtils.ecnrypt3DesData(bArr2, masterKey).slice(0, 16)
    }
  }

  getMasterKey () {
    const decryptor = new PbeAESDecryptor(this._pin, this._keyGeneratorConfig.salt, this._keyGeneratorConfig.iterationCount, this._keyGeneratorConfig.keyLength, this._cypherAlgorithmConfig.iv, this._keyGeneratorConfig.algorithm)
    return this.prepare3DesKey(decryptor.decrypt(this._cryptedKey))
  }

  prepare3DesKey (byteArray) {
    if (byteArray.length === 24) {
      return byteArray
    }
    if (byteArray.length === 16) {
      const key = []
      for (let i = 0; i < 16; i++) {
        key.push(byteArray[i])
      }
      for (let i = 0; i < 8; i++) {
        key.push(byteArray[i])
      }
      return key
    }
    console.assert(false, 'Provided key [' + byteArray + '] is not 2-DES nor 3-DES')
  }

  arrayCopy (source, sourceIndex, destination, destinationStart, count) {
    for (let i = 0; i < count; i++) {
      destination[destinationStart + i] = source[sourceIndex + i]
    }
  }
}
