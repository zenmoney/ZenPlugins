import { APP_VERSION, Device, OS_VERSION } from './models'
import forge from 'node-forge'
import { SHA3 } from 'sha3'
import { generateRandomString } from '../../../common/utils'

export function getDeviceInfo (device: Device): string {
  return forge.util.encode64(JSON.stringify({
    appVersion: APP_VERSION,
    deviceId: device.androidId,
    manufacturer: device.manufacturer,
    modelNumber: device.model,
    os: `Android ${OS_VERSION}`,
    remembered: true,
    rooted: false
  }))
}

export function hashPasswordRequest ({ loginSalt, loginHashMethod, requestSalt }: { loginSalt: string, loginHashMethod: string, requestSalt: string }, password: string): string {
  const hashedPassword = hashPassword({ salt: loginSalt, hashMethod: loginHashMethod }, password)
  return forge.util.encode64(hmacRequest(hashedPassword, requestSalt))
}

export function hashPasscodeRequest (requestSalt: string, passcode: string): string {
  const hmacPasscode = hmacRequest(passcode, requestSalt)

  return forge.util.encode64(encryptPasscode(hmacPasscode, generateRandomBytes(0xd5), getPasscodeRSAPublicKey()))
}

export function encryptFirstPasscode (passcode: string): string {
  return forge.util.encode64(encryptPasscode(passcode, generateRandomBytes(0xf0), getPasscodeRSAPublicKey()))
}

export function hashPassword ({ salt, hashMethod }: { salt: string, hashMethod: string }, password: string): string {
  if (hashMethod === 'SHA3-512') {
    const md = new SHA3(512)
    return md.update(`:${salt}:${password}`).digest('hex').toUpperCase()
  } else {
    // possible SHA1/SHA1_ENH/SHA1_/MD5_MIGRATED/SHA3-512
    assert(false, 'unknown hashMethod', hashMethod)
  }
}

export function hmacRequest (data: string, salt: string): string {
  const hmac = forge.hmac.create()
  hmac.start('sha256', data)
  hmac.update(forge.util.decode64(salt))
  hmac.update('\x00\x00\x00\x01')
  const result = hmac.digest()
  let data2 = result.copy()
  for (let i = 1; i < 0x1000; ++i) {
    const hmac2 = forge.hmac.create()
    hmac2.start('sha256', data)
    hmac2.update(data2.data)
    data2 = hmac2.digest()
    for (let i = 0; i < 32; ++i) {
      result.setAt(i, result.at(i) ^ data2.at(i))
    }
  }
  return result.data
}

export function getPasscodeRSAPublicKey (): forge.pki.rsa.PublicKey {
  const key = forge.asn1.fromDer('\x30\x82\x01\x22\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00\x03\x82\x01\x0f\x00\x30\x82\x01\x0a\x02\x82\x01\x01\x00\xd7\x9c\x6c\x46\xe1\xb8\x33\xa7\x01\x16\xa3\xc6\xde\x1d\x15\x8c\x01\xe2\xf6\x03\x36\x68\xcd\xe1\x18\x5c\x1a\x73\x12\x12\x2b\x64\xd9\x34\x16\xf1\xed\xce\x4a\x21\xc0\x61\xc7\x3f\xab\x42\xc0\x63\x70\x06\xe9\xb7\x2c\xc7\x94\x27\x1a\xca\xd7\x42\x2a\x48\xd5\xb8\x93\x36\xd1\x6f\x1e\x9f\x0b\x59\x2b\x73\xb5\x46\xa9\x3f\x88\xe4\x73\x78\xef\x14\xcb\x55\x2d\x4f\xc1\xfa\xb0\x8c\xd8\x04\x8d\xd9\x8f\x2e\xcd\x56\x01\x31\xf0\xa8\x94\x6d\xb8\xeb\x35\x1c\x26\xb5\xba\x7e\x0c\xab\x2a\x72\x07\x33\x7f\xe3\x9b\x9e\x40\x3f\xbf\x21\x72\xa8\xa5\xb3\x15\x40\x24\xb3\xd4\x6e\x43\xa4\xf1\x96\x00\xbf\x1e\xd9\x23\x1b\x31\xce\xe4\x4e\x86\x2b\x04\x21\x7b\x71\x9e\x47\x97\x71\x13\xc1\xc6\x8e\x7c\xd9\xdd\x45\x4d\xa9\xf0\x87\x40\x5c\x10\x71\xfd\x10\x90\xe5\xa2\x85\x7c\xe4\xcf\x93\x44\x5a\xc6\x3a\xb9\xcd\x8a\xfa\x3d\x04\xb2\xdf\x4b\x51\xd1\x56\xb2\x08\x37\x56\xbe\x94\x60\x81\xe1\x24\xc2\x0d\x93\x6c\x8d\x9a\x99\x41\x0d\x00\xd5\x1d\x99\x7b\xf0\x3e\xfc\x87\x11\x68\x87\x8b\xb3\xb8\x67\xfd\x30\x60\x00\x0e\x21\x71\x6d\x77\xa3\xf1\x85\x42\xc1\xe4\x59\xb9\x02\x03\x01\x00\x01')
  return forge.pki.publicKeyFromAsn1(key) as forge.pki.rsa.PublicKey
}

export function encryptPasscode (hmacPasscode: string, randomString: string, rsaKey: forge.pki.rsa.PublicKey): string {
  const data = hmacPasscode + randomString
  return rsaKey.encrypt(data, 'RSAES-PKCS1-V1_5')
}

function generateRandomBytes (length: number): string {
  const randomHexString = generateRandomString(length * 2, '0123456789abcdef')
  let randomString = ''
  for (let i = 0; i < randomHexString.length; i += 2) {
    randomString += String.fromCharCode(parseInt(randomHexString.substr(i, 2), 16))
  }
  return randomString
}
