import { Device } from './models'
import forge from 'node-forge'
import rs from 'jsrsasign'
import { padStart, sortBy } from 'lodash'

export function generateDevice (): Device {
  return {
    manufacturer: ZenMoney.device.manufacturer,
    model: ZenMoney.device.model
  }
}

export function generateECDSAKey (): { publicKey: string, privateKey: string } {
  const key = rs.KEYUTIL.generateKeypair('EC', 'secp256r1')
  const publicKey = (key.pubKeyObj as rs.KJUR.crypto.ECDSA)
  const privateKey = (key.prvKeyObj as rs.KJUR.crypto.ECDSA)
  return {
    publicKey: rs.KEYUTIL.getPEM(publicKey).replace(/\r\n/g, '\n'),
    privateKey: rs.KEYUTIL.getPEM(privateKey, 'PKCS8PRV')
  }
}

export function signRequest (privateKey: string, variables: unknown, now: Date): string {
  const rawData = (JSON.stringify(variables) + formatRFC1123DateTime(now)).replace(/\s/g, '')
  const data = sortBy(rawData, x => x.charCodeAt(0)).join('')
  const signer = new rs.KJUR.crypto.Signature({ alg: 'SHA256withECDSA' })
  signer.init(rs.KEYUTIL.getKey(privateKey))
  return forge.util.encode64(forge.util.hexToBytes(signer.signString(data)))
}

export function formatRFC1123DateTime (date: Date): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  // Tue, 5 Apr 2022 10:11:11 GMT
  return `${dayNames[date.getUTCDay()]}, ${date.getUTCDate()} ${monthAbbr[date.getUTCMonth()]} ${date.getUTCFullYear()} ` +
    `${padStart(date.getUTCHours().toString(), 2, '0')}:` +
    `${padStart(date.getUTCMinutes().toString(), 2, '0')}:` +
    `${padStart(date.getUTCSeconds().toString(), 2, '0')} GMT`
}
