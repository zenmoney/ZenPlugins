import { createCipheriv, createHash, createHmac } from 'crypto'
import {
  buildActivationDescriptor,
  createDeviceState,
  generateDeviceOtp,
  openDeviceState,
  sealDeviceState
} from '../deviceOtp'

const NOW = new Date('2026-07-28T12:34:56.000Z').getTime()
const PIN = '582041'
const ACTIVATION_PASSWORD = 'A1B2C3D4'
const NONCE = '1785234896000'
const SERIAL = '0123456789'
const IDENTITY = {
  registrationDeviceId: '0123456789abcdef_android_prod__revamp',
  registrationModel: 'Unknown Android SDK built for x86 (0123456789abcdef_android_prod__revamp)',
  dpassDeviceId: '00112233445566778899aabbccddeeff',
  manufacturer: 'unknown',
  model: 'Android SDK built for x86'
}
const OTP_KEY_1 = Buffer.from(Array.from({ length: 20 }, (_value, index) => index + 1))
const OTP_KEY_2 = Buffer.from(Array.from({ length: 20 }, (_value, index) => index + 21))

function sha (algorithm, value) {
  return createHash(algorithm).update(value).digest()
}

function androidBase64Default (value) {
  return (value.toString('base64').match(/.{1,76}/g) || []).join('\n') + '\n'
}

function fingerprintSuffix () {
  const fingerprintSource = IDENTITY.dpassDeviceId + IDENTITY.manufacturer + IDENTITY.model + PIN
  const fingerprint = androidBase64Default(sha('sha512', fingerprintSource))
  return sha('sha256', fingerprint).toString('hex').toUpperCase().slice(0, 20)
}

function hotp (secret, counter) {
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  counterBuffer.writeUInt32BE(counter >>> 0, 4)
  const digest = createHmac('sha1', secret).update(counterBuffer).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const binary = digest.readUInt32BE(offset) & 0x7fffffff
  return String(binary % 1000000).padStart(6, '0')
}

function makeXfad () {
  const plaintext = Buffer.alloc(88)
  plaintext[0] = '2'.charCodeAt(0)
  plaintext.write('OTP_APP_1', 1, 'ascii')
  OTP_KEY_1.copy(plaintext, 14)
  plaintext.write('OTP_APP_2', 34, 'ascii')
  OTP_KEY_2.copy(plaintext, 47)

  const iv = Buffer.from('1020304050607080', 'hex')
  const activationHash = sha('sha1', ACTIVATION_PASSWORD).subarray(0, 8)
  const nonceHash = sha('sha1', NONCE + SERIAL.slice(3)).subarray(8, 16)
  const key = Buffer.concat([activationHash, nonceHash, activationHash])
  const cipher = createCipheriv('des-ede3-cbc', key, iv)
  cipher.setAutoPadding(false)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]).toString('hex').toUpperCase()

  const header = Array(138).fill('0')
  '0100'.split('').forEach((value, index) => { header[index] = value })
  iv.toString('hex').toUpperCase().split('').forEach((value, index) => { header[50 + index] = value })
  SERIAL.split('').forEach((value, index) => { header[128 + index] = value })
  return header.join('') + encrypted
}

describe('BGPB device OTP', () => {
  it('derives activation and runtime OTP values compatible with DailyFin', () => {
    const descriptor = buildActivationDescriptor({
      xfad: makeXfad(),
      activationPassword: ACTIVATION_PASSWORD,
      nonce: NONCE,
      pin: PIN,
      identity: IDENTITY,
      now: NOW
    })
    const counter = Math.floor(NOW / 1000 / 30)
    const suffix = fingerprintSuffix()

    expect(descriptor).toEqual({
      otpKey: OTP_KEY_1.toString('hex'),
      derivationOtp: hotp(OTP_KEY_1, counter) + suffix,
      derivationOtp2: hotp(OTP_KEY_2, counter) + suffix
    })

    const state = createDeviceState({
      login: 'User.Login',
      deviceNo: '123456',
      otpKey: descriptor.otpKey,
      identity: IDENTITY
    })
    expect(generateDeviceOtp(state, PIN, NOW)).toBe(
      hotp(Buffer.concat([OTP_KEY_1, Buffer.from(suffix, 'ascii')]), counter)
    )
  })

  it('encrypts, authenticates and restores persisted token state', () => {
    const state = createDeviceState({
      login: 'user',
      deviceNo: '123456',
      otpKey: OTP_KEY_1.toString('hex'),
      identity: IDENTITY
    })
    const envelope = sealDeviceState(state, PIN, {
      saltHex: '00112233445566778899aabbccddeeff',
      ivHex: 'ffeeddccbbaa99887766554433221100'
    })

    expect(envelope.ciphertext).not.toContain(state.otpKey)
    expect(openDeviceState(envelope, PIN)).toEqual(state)
    expect(() => openDeviceState(envelope, '401582')).toThrow('PIN токена BGPB не подходит')
  })

  it('rejects malformed or weak PIN values before using token material', () => {
    expect(() => buildActivationDescriptor({
      xfad: makeXfad(),
      activationPassword: ACTIVATION_PASSWORD,
      nonce: NONCE,
      pin: '123456',
      identity: IDENTITY,
      now: NOW
    })).toThrow('менее простой PIN')
  })
})
