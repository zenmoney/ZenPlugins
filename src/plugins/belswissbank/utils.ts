import padLeft from 'pad-left'
import { generateRandomString, randomInt } from '../../common/utils'
import { Device } from './models'
import forge from 'node-forge'
import { CREDENTIALS_RSA_PUBLIC_KEY } from './consts'

export function formatToApiDate (date: Date): string {
  return [
    date.getUTCDate(),
    date.getUTCMonth() + 1,
    date.getUTCFullYear()
  ].map((num) => padLeft(num.toString(), 2, '0')).join('/')
}

export function getDevice (): Device {
  const device = ZenMoney.getData('device', null) as Device | null
  if (device !== null) {
    return device
  }

  const newDevice = generateDevice()
  ZenMoney.setData('device', newDevice)
  ZenMoney.saveData()
  return newDevice
}

export function generateDevice (): Device {
  return {
    model: ZenMoney.device.model,
    manufacturer: ZenMoney.device.manufacturer,
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    osVersion: randomInt(30, 35).toString(),
    androidId: generateRandomString(16, '0123456789abcdef')
  }
}

export function encryptCredentials (value: string, salt: string): string {
  const toEncode = `${value}${salt}`
  const publicKeyDer = forge.util.decode64(CREDENTIALS_RSA_PUBLIC_KEY)
  const asn1 = forge.asn1.fromDer(publicKeyDer)
  const publicKey = forge.pki.publicKeyFromAsn1(asn1) as forge.pki.rsa.PublicKey
  const encrypted = publicKey.encrypt(toEncode, 'RSAES-PKCS1-V1_5')
  return forge.util.encode64(encrypted)
}
