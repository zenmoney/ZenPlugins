import { PbeAESDecryptor } from '../../PbeAESDecryptor'

describe('PbeAESDecryptor', () => {
  const decryptor = new PbeAESDecryptor('789456', '3ca2ae16ea3e88584dcd07917bb261b2', 1024, 16, '00000000000000000000000000000000', 'PBKDF2WithHmacSHA1')
  it.each([
    [
      '789456',
      '3ca2ae16ea3e88584dcd07917bb261b2',
      [202, 14, 140, 144, 230, 117, 210, 147, 75, 106, 202, 247, 35, 36, 18, 100]
    ]
  ])('generates key', (key, salt, derivedKey) => {
    expect(decryptor.generateKey(key, salt)).toEqual(derivedKey)
  })

  it.each([
    [
      '1a4b3f000fd01c5a3149467d7919ffd8f7df37cbde97e7de1f87a8fcf9d92a9c',
      [38, 205, 186, 110, 67, 244, 115, 161, 115, 62, 91, 162, 194, 50, 185, 241, 38, 205, 186, 110, 67, 244, 115, 161]
    ]
  ])('decrypts data', (encrypted, decrypted) => {
    expect(decryptor.decrypt(encrypted)).toEqual(decrypted)
  })
})
