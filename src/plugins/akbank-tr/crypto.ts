import crypto from 'crypto-js'

import { generateUUID } from '../../common/utils'

const AUTH_KEY_PREFIX = 'A204CDB96BAD31B989BF4CDAE649CD575EA84CE5F74AAD49'
const CRYSTAL_KEY_PREFIX = '61C1B727610E94C04DDE9807A18AD5199EA59978212B04C0'
const ZERO_IV = crypto.enc.Hex.parse('0000000000000000')

export function encryptAuth (value: string, clientUid: string): string {
  const keyHex = sha256(`${AUTH_KEY_PREFIX}${clientUid}`).slice(0, 48)
  return encryptTripleDes(value, keyHex)
}

export function encryptLogin (value: string, tripleDesKey: string): string {
  console.assert(/^[0-9A-Fa-f]{48}$/.test(tripleDesKey), 'Akbank stored 3DES key has an invalid format')
  return encryptTripleDes(value, tripleDesKey)
}

export function createCrystalHeader (innerRequest: string): string {
  return sha256(`${CRYSTAL_KEY_PREFIX}${innerRequest}`)
}

export function createDeviceNonce (clientUid: string): string {
  const randomId = generateUUID().replace(/-/g, '').toUpperCase().slice(0, 10)
  const encodeHashPrefix = (value: string): string => crypto.enc.Utf8.parse(sha256(value))
    .toString(crypto.enc.Hex).toUpperCase().slice(0, 12)
  return encodeHashPrefix(randomId) + encodeHashPrefix(`${clientUid}${Date.now()}`)
}

function encryptTripleDes (value: string, keyHex: string): string {
  return crypto.TripleDES.encrypt(value, crypto.enc.Hex.parse(keyHex), {
    iv: ZERO_IV,
    mode: crypto.mode.CBC,
    padding: crypto.pad.ZeroPadding
  }).ciphertext.toString(crypto.enc.Hex).toUpperCase()
}

function sha256 (value: string): string {
  return crypto.SHA256(value).toString(crypto.enc.Hex).toUpperCase()
}
