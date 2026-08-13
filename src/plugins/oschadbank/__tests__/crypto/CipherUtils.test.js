import forge from 'node-forge'
import { byteArrayToByteString } from '../../../../common/byteStringUtils'
import { CipherUtils } from '../../CipherUtils'

describe('CipherUtils', () => {
  it.each([
    [
      [209, 84, 173, 81, 153, 223, 74, 118, 30, 144, 101, 245, 62, 229, 255, 236],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 6, 3, 164, 48, 6, 128, 0, 0],
      [79, 97, 17, 133, 133, 209, 113, 202]
    ]
  ])('Processes MAC', (bArr2, bArr, MAC) => {
    const cipher = forge.cipher.createCipher('DES-ECB', byteArrayToByteString(bArr2.slice(0, 8)))
    cipher.start()
    expect(CipherUtils.processMAC(bArr, cipher)).toEqual(MAC)
  })

  it.each([
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 6, 3, 164, 48, 6, 128, 0, 0],
      [209, 84, 173, 81, 153, 223, 74, 118, 30, 144, 101, 245, 62, 229, 255, 236],
      [114, 80, 180, 128, 46, 223, 156, 141]
    ]
  ])('generates ANSI X9.19 MAC', (payload, key, ansiX919Mac) => {
    expect(CipherUtils.generateAnsiX919Mac(payload, key)).toEqual(ansiX919Mac)
  })

  it.each([
    [
      [51, 47, 68, 223, 214, 150, 229, 210, 98, 39, 7, 1, 154, 60, 172, 210],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 1, 0, 3, 164, 48, 6, 128, 0, 0],
      [244, 132, 30, 34, 78, 239, 213, 170]
    ]
  ])('Processes MAC', (key, payload, MAC) => {
    const cipher = forge.cipher.createCipher('DES-ECB', byteArrayToByteString(key.slice(0, 8)))
    cipher.start()
    expect(CipherUtils.processMAC(payload, cipher)).toEqual(MAC)
  })

  it.each([
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 1, 0, 3, 164, 48, 6, 128, 0, 0],
      [51, 47, 68, 223, 214, 150, 229, 210, 98, 39, 7, 1, 154, 60, 172, 210],
      [251, 224, 206, 42, 184, 49, 188, 223]
    ]
  ])('generates ANSI X9.19 MAC', (payload, key, ansiX919Mac) => {
    expect(CipherUtils.generateAnsiX919Mac(payload, key)).toEqual(ansiX919Mac)
  })
})
