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
  const toEncode = `${salt}${value}`
  const publicKeyDer = forge.util.decode64(CREDENTIALS_RSA_PUBLIC_KEY)
  const asn1 = forge.asn1.fromDer(publicKeyDer)
  const publicKey = forge.pki.publicKeyFromAsn1(asn1) as forge.pki.rsa.PublicKey
  const encrypted = publicKey.encrypt(toEncode, 'RSAES-PKCS1-V1_5')
  return forge.util.encode64(encrypted)
}

function sha256Hex (value: string): string {
  return forge.md.sha256.create().update(value, 'utf8').digest().toHex()
}

// Mirrors by.bank.bsb.mobile anti_fraud.AntiFraudDevicePayload (app 202611.1.0),
// sent base64-encoded in the x-device-fingerprint header of auth/login.
export function buildDeviceFingerprint (device: Device): string {
  const androidVersion = Math.max(11, parseInt(device.osVersion, 10) - 20).toString()
  const buildId = `AP${androidVersion}A.${sha256Hex(device.androidId + 'id').slice(0, 6)}.001`
  const payload = {
    device_model: device.model,
    device_name: `${device.manufacturer} ${device.model}`,
    deviceid: device.androidId,
    geolocationdata: '',
    locale: 'ru-BY',
    time_zone: 180,
    os_name: 'Android',
    os_version: androidVersion,
    width: '1080',
    height: '2340',
    scale: '3.0',
    uuid: device.androidId,
    android_specific: {
      build_bootloader: 'unknown',
      build_display: buildId,
      build_id: buildId,
      build_fingerprint: `${device.manufacturer.toLowerCase()}/${device.model}/${device.model}:${androidVersion}/${buildId}:user/release-keys`,
      build_manufacturer: device.manufacturer,
      build_radio: 'unknown',
      package_manager_getsystemavailablefeatures: sha256Hex(device.androidId + 'features')
    }
  }
  return forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(payload)))
}
