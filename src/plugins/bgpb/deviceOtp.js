import crypto from 'crypto-js'
import { generateRandomString } from '../../common/utils'

const TOKEN_STATE_VERSION = 1
const ENVELOPE_VERSION = 1
const KDF_ITERATIONS = 120000
const OTP_PERIOD_SECONDS = 30
const OTP_DIGITS = 6
const PIN_SPACE_SIZE = Math.pow(10, OTP_DIGITS)
const RANDOM_UINT32_RANGE = 0x100000000
const RANDOM_UINT32_LIMIT = Math.floor(RANDOM_UINT32_RANGE / PIN_SPACE_SIZE) * PIN_SPACE_SIZE
const PIN_GENERATION_ATTEMPTS = 100
const DEVICE_MANUFACTURER = 'unknown'
const DEVICE_MODEL = 'Android SDK built for x86'

function bytesToWordArray (bytes) {
  const words = []
  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] = (words[i >>> 2] || 0) | (bytes[i] << (24 - (i % 4) * 8))
  }
  return crypto.lib.WordArray.create(words, bytes.length)
}

function wordArrayToBytes (wordArray) {
  const bytes = []
  for (let i = 0; i < wordArray.sigBytes; i++) {
    bytes.push((wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)
  }
  return bytes
}

function hexToBytes (value) {
  if (typeof value !== 'string' || value.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(value)) {
    throw new Error('Invalid hexadecimal data')
  }
  const bytes = []
  for (let i = 0; i < value.length; i += 2) {
    bytes.push(Number.parseInt(value.slice(i, i + 2), 16))
  }
  return bytes
}

function bytesToHex (bytes) {
  return bytes.map(value => value.toString(16).padStart(2, '0')).join('')
}

function asciiBytes (value) {
  return Array.from(value, char => char.charCodeAt(0) & 0xff)
}

function androidBase64Default (wordArray) {
  const encoded = crypto.enc.Base64.stringify(wordArray)
  return (encoded.match(/.{1,76}/g) || []).join('\n') + '\n'
}

function buildDeviceFingerprint (identity, pin) {
  const source = identity.dpassDeviceId + identity.manufacturer + identity.model + pin
  return androidBase64Default(crypto.SHA512(source))
}

function fingerprintSuffix (identity, pin) {
  return crypto.SHA256(buildDeviceFingerprint(identity, pin)).toString(crypto.enc.Hex).toUpperCase().slice(0, 20)
}

function counterBytes (counter) {
  const high = Math.floor(counter / 0x100000000)
  const low = counter >>> 0
  return [
    (high >>> 24) & 0xff,
    (high >>> 16) & 0xff,
    (high >>> 8) & 0xff,
    high & 0xff,
    (low >>> 24) & 0xff,
    (low >>> 16) & 0xff,
    (low >>> 8) & 0xff,
    low & 0xff
  ]
}

function hotp (secret, counter) {
  const digest = wordArrayToBytes(crypto.HmacSHA1(bytesToWordArray(counterBytes(counter)), bytesToWordArray(secret)))
  const offset = digest[digest.length - 1] & 0x0f
  const binary = ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  return String((binary >>> 0) % Math.pow(10, OTP_DIGITS)).padStart(OTP_DIGITS, '0')
}

function timeCounter (now, offsetPeriods = 0) {
  return Math.floor(now / 1000 / OTP_PERIOD_SECONDS) + offsetPeriods
}

function deriveEnvelopeKeys (pin, saltHex) {
  const derived = crypto.PBKDF2(pin, crypto.enc.Hex.parse(saltHex), {
    keySize: 16,
    iterations: KDF_ITERATIONS,
    hasher: crypto.algo.SHA256
  }).toString(crypto.enc.Hex)
  return {
    encryptionKey: crypto.enc.Hex.parse(derived.slice(0, 64)),
    macKey: crypto.enc.Hex.parse(derived.slice(64))
  }
}

function constantTimeEqual (left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) {
    return false
  }
  let difference = 0
  for (let i = 0; i < left.length; i++) {
    difference |= left.charCodeAt(i) ^ right.charCodeAt(i)
  }
  return difference === 0
}

function validateDeviceState (state) {
  if (!state || state.version !== TOKEN_STATE_VERSION ||
    typeof state.accountHash !== 'string' ||
    typeof state.deviceNo !== 'string' || !/^\d+$/.test(state.deviceNo) ||
    typeof state.otpKey !== 'string' || !/^[0-9a-f]{40}$/i.test(state.otpKey) ||
    !state.identity || typeof state.identity !== 'object' ||
    typeof state.identity.dpassDeviceId !== 'string' ||
    typeof state.identity.manufacturer !== 'string' ||
    typeof state.identity.model !== 'string') {
    throw new Error('Stored BGPB device token has an invalid format')
  }
  return state
}

function isWeakDevicePin (pin) {
  return new Set(pin).size < 3 || /(?:0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(pin)
}

/**
 * Validates the local six-digit PIN used by the BGPB device token.
 */
export function validateDevicePin (pin) {
  if (!/^\d{6}$/.test(pin || '')) {
    throw new InvalidPreferencesError('PIN токена BGPB должен состоять ровно из 6 цифр')
  }
  if (isWeakDevicePin(pin)) {
    throw new InvalidPreferencesError('Выберите менее простой PIN токена BGPB')
  }
}

/**
 * Generates a uniformly distributed local six-digit PIN for the BGPB device
 * token while rejecting simple combinations that the token validator forbids.
 */
export function generateDevicePin (randomUint32 = () => crypto.lib.WordArray.random(4).words[0] >>> 0) {
  for (let attempt = 0; attempt < PIN_GENERATION_ATTEMPTS; attempt++) {
    const randomValue = randomUint32()
    if (!Number.isInteger(randomValue) || randomValue < 0 || randomValue >= RANDOM_UINT32_RANGE) {
      throw new Error('BGPB PIN random source returned an invalid value')
    }
    if (randomValue >= RANDOM_UINT32_LIMIT) {
      continue
    }
    const pin = String(randomValue % PIN_SPACE_SIZE).padStart(OTP_DIGITS, '0')
    if (!isWeakDevicePin(pin)) {
      return pin
    }
  }
  throw new Error('Could not generate a valid BGPB device PIN')
}

/**
 * Creates the two stable identifiers used by DailyFin registration and DPass.
 */
export function createDeviceIdentity () {
  const androidId = generateRandomString(16, '0123456789abcdef')
  const registrationDeviceId = `${androidId}_android_prod__revamp`
  return {
    registrationDeviceId,
    registrationModel: `Unknown ${DEVICE_MODEL} (${registrationDeviceId})`,
    dpassDeviceId: generateRandomString(32, '0123456789abcdef'),
    manufacturer: DEVICE_MANUFACTURER,
    model: DEVICE_MODEL
  }
}

/**
 * Reproduces DailyFin's local XFAD activation derivation.
 */
export function buildActivationDescriptor ({ xfad, activationPassword, nonce, pin, identity, now = Date.now() }) {
  validateDevicePin(pin)
  if (typeof xfad !== 'string' || xfad.length < 300) {
    throw new Error('BGPB returned an invalid device activation payload')
  }
  const staticVectorLength = Number.parseInt(xfad.slice(0, 4), 10)
  if (!Number.isInteger(staticVectorLength) || staticVectorLength < 100 || staticVectorLength > 256) {
    throw new Error('BGPB returned an invalid static-vector length')
  }
  if (typeof activationPassword !== 'string' || activationPassword.length === 0 ||
    typeof nonce !== 'string' || nonce.length === 0) {
    throw new Error('BGPB device activation data is incomplete')
  }

  const serial = xfad.slice(128, 138)
  const ivHex = xfad.slice(50, 66)
  const encryptedHex = xfad.slice(138)
  if (!/^[0-9a-f]{16}$/i.test(ivHex) || encryptedHex.length % 16 !== 0 || !/^[0-9a-f]+$/i.test(encryptedHex)) {
    throw new Error('BGPB returned malformed encrypted token vectors')
  }

  const nonceHash = wordArrayToBytes(crypto.SHA1(nonce + serial.slice(3))).slice(8, 16)
  const activationHash = wordArrayToBytes(crypto.SHA1(activationPassword)).slice(0, 8)
  const key = activationHash.concat(nonceHash, activationHash)
  const decrypted = crypto.TripleDES.decrypt({ ciphertext: crypto.enc.Hex.parse(encryptedHex) }, bytesToWordArray(key), {
    iv: crypto.enc.Hex.parse(ivHex),
    mode: crypto.mode.CBC,
    padding: crypto.pad.NoPadding
  })
  const vectors = wordArrayToBytes(decrypted)
  const applicationCount = vectors[0] - 48
  if (applicationCount < 2 || vectors.length < 67) {
    throw new Error('BGPB device token does not contain the required OTP applications')
  }

  const otpKey = vectors.slice(14, 34)
  const otpKey2 = vectors.slice(47, 67)
  const suffix = fingerprintSuffix(identity, pin)
  return {
    otpKey: bytesToHex(otpKey),
    derivationOtp: hotp(otpKey, timeCounter(now)) + suffix,
    derivationOtp2: hotp(otpKey2, timeCounter(now)) + suffix
  }
}

/**
 * Generates DailyFin's OTP_1 value for an already activated token.
 */
export function generateDeviceOtp (state, pin, now = Date.now(), offsetPeriods = 0) {
  validateDevicePin(pin)
  validateDeviceState(state)
  const suffix = fingerprintSuffix(state.identity, pin)
  const secret = hexToBytes(state.otpKey).concat(asciiBytes(suffix))
  return hotp(secret, timeCounter(now, offsetPeriods))
}

/**
 * Hashes the selected bank login so persisted token state cannot cross accounts.
 */
export function hashAccountLogin (login) {
  return crypto.SHA256(String(login || '').trim().toLowerCase()).toString(crypto.enc.Hex)
}

/**
 * Encrypts and authenticates BGPB token material before plugin-data persistence.
 */
export function sealDeviceState (state, pin, random = {}) {
  validateDevicePin(pin)
  validateDeviceState(state)
  const saltHex = random.saltHex || crypto.lib.WordArray.random(16).toString(crypto.enc.Hex)
  const ivHex = random.ivHex || crypto.lib.WordArray.random(16).toString(crypto.enc.Hex)
  if (!/^[0-9a-f]{32}$/i.test(saltHex) || !/^[0-9a-f]{32}$/i.test(ivHex)) {
    throw new Error('Invalid BGPB token encryption parameters')
  }
  const keys = deriveEnvelopeKeys(pin, saltHex)
  const ciphertext = crypto.AES.encrypt(crypto.enc.Utf8.parse(JSON.stringify(state)), keys.encryptionKey, {
    iv: crypto.enc.Hex.parse(ivHex),
    mode: crypto.mode.CBC,
    padding: crypto.pad.Pkcs7
  }).ciphertext.toString(crypto.enc.Hex)
  const macPayload = `${ENVELOPE_VERSION}|${saltHex}|${ivHex}|${ciphertext}`
  const mac = crypto.HmacSHA256(macPayload, keys.macKey).toString(crypto.enc.Hex)
  return {
    version: ENVELOPE_VERSION,
    salt: saltHex,
    iv: ivHex,
    ciphertext,
    mac
  }
}

/**
 * Authenticates and decrypts persisted BGPB token material.
 */
export function openDeviceState (envelope, pin) {
  validateDevicePin(pin)
  if (!envelope || envelope.version !== ENVELOPE_VERSION ||
    !/^[0-9a-f]{32}$/i.test(envelope.salt || '') ||
    !/^[0-9a-f]{32}$/i.test(envelope.iv || '') ||
    !/^[0-9a-f]+$/i.test(envelope.ciphertext || '') ||
    !/^[0-9a-f]{64}$/i.test(envelope.mac || '')) {
    throw new Error('Stored BGPB device token envelope has an invalid format')
  }
  const keys = deriveEnvelopeKeys(pin, envelope.salt)
  const macPayload = `${envelope.version}|${envelope.salt}|${envelope.iv}|${envelope.ciphertext}`
  const expectedMac = crypto.HmacSHA256(macPayload, keys.macKey).toString(crypto.enc.Hex)
  if (!constantTimeEqual(expectedMac, envelope.mac)) {
    throw new InvalidPreferencesError('PIN токена BGPB не подходит к сохраненной активации')
  }
  try {
    const plaintext = crypto.AES.decrypt({ ciphertext: crypto.enc.Hex.parse(envelope.ciphertext) }, keys.encryptionKey, {
      iv: crypto.enc.Hex.parse(envelope.iv),
      mode: crypto.mode.CBC,
      padding: crypto.pad.Pkcs7
    }).toString(crypto.enc.Utf8)
    return validateDeviceState(JSON.parse(plaintext))
  } catch (_error) {
    throw new Error('Could not decrypt stored BGPB device token')
  }
}

/**
 * Creates the minimal persisted state needed for OTP_1 statement authorization.
 */
export function createDeviceState ({ login, deviceNo, otpKey, identity }) {
  return validateDeviceState({
    version: TOKEN_STATE_VERSION,
    accountHash: hashAccountLogin(login),
    deviceNo: String(deviceNo),
    otpKey,
    identity: {
      dpassDeviceId: identity.dpassDeviceId,
      manufacturer: identity.manufacturer,
      model: identity.model
    }
  })
}
