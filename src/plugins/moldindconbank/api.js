import { merge } from 'lodash'
import forge from 'node-forge'
import { byteStringToByteArray } from '../../common/byteStringUtils'
// PinCodeInsteadOfPasswordError, TemporaryUnavailableError, BankMessageError
import { getX919MAC } from '../../common/cryptoUtils'
import { fetch, fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError } from '../../errors'

const APP_VERSION = '1.5.2793'
const DEVICE_MODEL = ZenMoney.device?.model || 'Sync'
const baseUrl = 'https://wb.micb.md/mobile2/api/v2'

function getHeaders () {
  return {
    Host: 'wb.micb.md',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'ru',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'OW-Client-Version': APP_VERSION,
    'User-Agent': `Mozilla/5.0 (Linux; Android 7.0; ${DEVICE_MODEL} Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Crosswalk/22.52.561.4 Mobile Safari/537.36`
  }
}

function getLoginHeaders (deviceId) {
  return {
    'X-Device-version': '7.0.0',
    'OW-Client-Browser': 'Chrome',
    'Content-Type': 'application/json',
    'X-Device-uuid': deviceId,
    'X-Device-connection': 'wifi',
    'X-Device-model': DEVICE_MODEL,
    'X-Device-platform': 'Android'
  }
}

async function getCookieJsessionIdFromResponse (needCheck = true) {
  const cookieJsessionId = (await ZenMoney.getCookies()).find(cookie => cookie.name === 'JSESSIONID')
  console.assert(cookieJsessionId || !needCheck, 'there is no cookie JsessionId in getCookieJsessionId response')
  if (cookieJsessionId) {
    return { name: cookieJsessionId.name, value: cookieJsessionId.value }
  }
  return null
}

async function getCookieJsessionId1stRun (isFirstRun, deviceId) {
  const headers = isFirstRun
    ? {
        ...getHeaders(),
        'Accept-Language': 'ru-ru',
        Accept: 'text/plain, */*; q=0.01'
      }
    : {
        ...getHeaders(),
        ...getLoginHeaders(deviceId),
        Origin: 'file://'
      }
  if (isFirstRun) { delete headers['OW-Client-Version'] }
  const response = await fetch(baseUrl + '/conf/main.js', {
    method: 'GET',
    headers,
    sanitizeResponseLog: { body: true }
  })
  console.assert(response.status === 200, 'unexpected getCookieJsessionId1stRun response')
  const cookieJsessionId = await getCookieJsessionIdFromResponse()
  return cookieJsessionId
}

async function deleteCookieJsessionId (oldCookieJsessionId) {
  // oldCookieJsessionId && await ZenMoney.setCookie('wb.micb.md', oldCookieJsessionId.name, oldCookieJsessionId.value, { expires: new Date(Date.now() + 1500) })
  const response = await fetch(baseUrl + '/session', {
    method: 'DELETE',
    headers: {
      ...getHeaders(),
      Origin: 'file://'
    }
  })
  return response
}

function convertHexStringToByteArray (hexString) {
  const strLen = hexString.length
  const result = []
  for (let i = 0; i < strLen; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16))
  }
  return result
}

function convertHexStringToString (hex) {
  hex = hex.toString()
  let str = ''
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  }
  return str
}

function convertArrayBufToHexString (ArrayBuf) {
  return Array.prototype.map.call(new Uint8Array(ArrayBuf), x => ('0' + x.toString(16)).slice(-2)).join('')
}

function createKeyAES (pin, pbeParams) {
  return byteStringToByteArray(forge.pkcs5.pbkdf2(pin, forge.util.hexToBytes(pbeParams.salt), pbeParams.iterationCount, pbeParams.keyLength / 8, 'sha1'))
}

function AESdecryption (dataEncrypted, AESkey, AESiv) {
  // AES/CBC/PKCS5Padding(use in bank app) = AES/CBC/PKCS7Padding(use in node-forge)
  const cipherResp = forge.cipher.createDecipher('AES-CBC', AESkey)
  cipherResp.start({ iv: convertHexStringToByteArray(AESiv) })
  cipherResp.update(forge.util.createBuffer(forge.util.hexToBytes(dataEncrypted)))
  cipherResp.finish()
  const dataDecrypted = cipherResp.output
  const dataDecryptedHex = dataDecrypted.toHex()
  return dataDecryptedHex
}

function mixBytes (str, length) {
  let var5 = str
  const var2 = new Array(length)
  const var4 = str.length - length * 2
  let var6 = -var4
  if (str.length > length * 2) {
    var5 = str.slice(var4)
    var6 = 0
  }
  let var8 = 0
  let var9 = 0
  let var10 = true
  let j = 0
  const var3 = length * 2
  for (let i = 0; i < var3; i++) {
    if (var6 === 0) {
      var9 = parseInt(var5[var8])
      var8++
    } else {
      var6--
    }
    if (var10) {
      var2[j] = var9 << 4
      var10 = false
    } else {
      var2[j] = var2[j] | var9
      j++
      var10 = true
    }
  }
  return var2
}

function DESedeEncryption (data, key) {
  const forgeBytes = forge.util.hexToBytes(convertArrayBufToHexString(data))
  const cipher = forge.cipher.createCipher('3DES-ECB', convertHexStringToString(key))

  cipher.start()
  cipher.update(forge.util.createBuffer(forgeBytes))
  cipher.finish()
  const dataEncrypted = cipher.output
  const dataEncryptedHex = dataEncrypted.toHex()
  return dataEncryptedHex
}

function getDESedeEncryption (data, key) {
  const var25 = []
  var25.push(...data)
  var25[2] = var25[2] ^ 240
  var25.push(...data)
  var25[10] = var25[10] ^ 15
  const encryptedData = DESedeEncryption(var25, key)
  return encryptedData
}

function getCryptogram (var7, var5, transactionCounter) {
  const var2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 3, -92, 48, 6, -128, 0, 0]
  for (let i = 0; i < 4; i++) {
    var2[i + 25] = var5[i]
  }
  const counterToBytes = forge.util.int32ToBytes(transactionCounter)
  for (let i = 0; i < 2; i++) {
    var2[i + 31] = counterToBytes[i + 2].charCodeAt(0)
  }
  const var1 = getX919MAC(var2, var7)
  return convertHexStringToByteArray(var1)
}

function getOtpMMA (initNumber, transactionCounter, key) {
  const var5 = mixBytes(initNumber.toString(), 4)
  let var13 = new Array(8)
  for (let i = 0; i < 4; i++) {
    var13[i + 4] = var5[i]
  }
  transactionCounter++
  const counterToBytes = forge.util.int32ToBytes(transactionCounter)
  for (let i = 0; i < 2; i++) {
    var13[i] = counterToBytes[i + 2].charCodeAt(0)
  }
  var13[2] = 0
  var13[3] = 0
  const var7 = getDESedeEncryption(var13, key)
  var13 = getCryptogram(var7, var5, transactionCounter)
  const var2 = 0 << 24 | counterToBytes[3].charCodeAt(0) << 16 | var13[0] << 8 | var13[1]
  return var2.toString()
}

async function newLoginSession (preferences, deviceId) {
  let oldCookieJsessionId
  deviceId = deviceId || generateRandomString(16, '0123456789abcdef')
  await getCookieJsessionId1stRun(true)
  let response
  const loginMethod = await checkLoginMethod()
  response = await getLogin(preferences, deviceId, loginMethod)
  if (loginMethod === 'LOGIN_PW') {
    const pin = generateRandomString(5, '0123456789')
    response = await getConfirmationParams(pin, deviceId)
    response = await getLoginWithSMS({ loginMethod, pin, deviceId, confirmationParams: response.body.confirmation })
    console.assert(response.body.encryptionParams.pbeParams.algorithm === 'PBKDF2WithHmacSHA1' &&
      response.body.encryptionParams.cipherParams.algorithm === 'AES/CBC/PKCS5Padding', 'Encryption algorithm not supported')
    await deleteCookieJsessionId(null)
    const applicationId = response.body.id
    // MasterCard Mobile Authentication (MMA)
    const pbeParams = response.body.encryptionParams.pbeParams
    const transactionCounter = response.body.transactionCounter || 0
    // PBKDF2WithHMACSHA1
    const keyAES = createKeyAES(pin, pbeParams)
    const key = AESdecryption(response.body.encryptedKey,
      keyAES,
      response.body.encryptionParams.cipherParams.iv)
    await loginMMA(preferences, { key, transactionCounter, applicationId, deviceId }, true, true)
    oldCookieJsessionId = await getCookieJsessionIdFromResponse()
    return { oldCookieJsessionId, deviceId, key, transactionCounter: transactionCounter + 1, applicationId }
  } else {
    console.log('>>> loginMethod is NOT LOGIN_PW: ', loginMethod)
    oldCookieJsessionId = await getCookieJsessionIdFromResponse()
    await getLoginWithSMS({ loginMethod, login: preferences.login, deviceId, confirmation: response.body.confirmation })
    return { oldCookieJsessionId, deviceId }
  }
}

export async function login (preferences, auth) {
  let oldCookieJsessionId

  // 1st login
  if (!auth.deviceId || auth.transactionCounter >= 65535) { // relogin when session counter overflow
    const newAuth = await newLoginSession(preferences)
    return newAuth
  } else { // 2nd login
    // test3 - добавил deviceId и доп. хедеры в getCookieJsessionId1stRun()
    // await getCookieJsessionId1stRun(false, auth.deviceId)

    // без ZenMoney.setCookie всегда требует смс при входе
    // await ZenMoney.setCookie('wb.micb.md', auth.oldCookieJsessionId.name, auth.oldCookieJsessionId.value, { expires: new Date(Date.now() + 20000) })

    // test4 - пробуем использовать все время 1 куку, не обнуляя ее дату
    await ZenMoney.setCookie('wb.micb.md', auth.oldCookieJsessionId.name, auth.oldCookieJsessionId.value)

    // test
    // await deleteCookieJsessionId(auth.oldCookieJsessionId)

    const loginMethod = await checkLoginMethod()

    // test2
    // await ZenMoney.setCookie('wb.micb.md', auth.oldCookieJsessionId.name, auth.oldCookieJsessionId.value, { expires: 'Thu, 01 Jan 1970 00:00:00 GMT' })
    if ([
      'LOGIN_PW',
      'otp_mma',
      'not_authenticated'
    ].some(str => str === loginMethod)) {
      let loginSuccess = false
      if (loginMethod === 'otp_mma' || loginMethod === 'LOGIN_PW') { loginSuccess = await loginMMA(preferences, auth, true) } // await loginMMA(auth, loginMethod === 'otp_mma')
      if (!loginSuccess) {
        // test4 - удаляем куки и обнуляем дату куки только при неудачном входе
        await deleteCookieJsessionId(auth.oldCookieJsessionId)
        await ZenMoney.setCookie('wb.micb.md', auth.oldCookieJsessionId.name, auth.oldCookieJsessionId.value, { expires: 'Thu, 01 Jan 1970 00:00:00 GMT' })
        const newAuth = await newLoginSession(preferences, auth.deviceId)
        return newAuth
      }
      oldCookieJsessionId = await getCookieJsessionIdFromResponse()
      return { ...auth, oldCookieJsessionId, transactionCounter: auth.transactionCounter + 1 }
    } else { // no logs how to 2nd login for loginMethod = 'LOGIN'
      console.log('>>> 2nd login for loginMethod = LOGIN')
      oldCookieJsessionId = await getCookieJsessionIdFromResponse(false)
      if (oldCookieJsessionId) {
        return { ...auth, oldCookieJsessionId }
      }
      return auth
    }
  }
}

async function loginMMA (preferences, { key, transactionCounter, applicationId, deviceId, oldCookieJsessionId }, isOtpMMA, isFirstRun = false) {
  const otpMMA = getOtpMMA(0, transactionCounter, key)
  const response = await callGate('/session', {
    method: 'POST',
    headers: { ...getHeaders(), ...getLoginHeaders(deviceId), Origin: 'file://' },
    body: {
      ...isOtpMMA ? { authMethod: 'otp_mma' } : { loginMethod: 'LOGIN_MMA', captcha: '' },
      pin: null,
      password: otpMMA,
      applicationId
    },
    sanitizeRequestLog: { body: { password: true, applicationId: true } },
    sanitizeResponseLog: {
      body: {
        user: { login: true, displayName: true, phoneNumbers: true, mobileDevices: true, settings: true },
        confirmation: { confirmationKey: true }
      }
    }
  })
  if (response.body?._error?.code === 'INVALID_LOGIN_OR_PASSWORD') {
    if (isFirstRun) {
      throw new InvalidLoginOrPasswordError()
    }
    // test4 - удаляем куки и обнуляем дату куки только при неудачном входе
    await deleteCookieJsessionId(oldCookieJsessionId)
    await ZenMoney.setCookie('wb.micb.md', oldCookieJsessionId.name, oldCookieJsessionId.value, { expires: 'Thu, 01 Jan 1970 00:00:00 GMT' })
    const newAuth = await newLoginSession(preferences, deviceId)
    return newAuth
  }
  // oldCookieJsessionId && await ZenMoney.setCookie('wb.micb.md', oldCookieJsessionId.name, oldCookieJsessionId.value, { expires: 'Thu, 01 Jan 1970 00:00:00 GMT' })
  // const cookieJsessionId = await getCookieJsessionIdFromResponse()
  // return cookieJsessionId
}

async function checkLoginMethod () {
  const response = await callGate('/session', {
    method: 'GET',
    headers: getHeaders()
  })

  // test login without loginMethods
  if (response.body.status === 'authenticated') {
    if (response.body.authType === 'otp_mma') {
      console.log('>>> status = authenticated, authType = otp_mma, try loginMMA')
    } else { // no logs for it
      console.log('>>> status = authenticated, authType != otp_mma, but also try loginMMA')
    }
    return 'otp_mma'
  }

  if (response.body.loginMethods) {
    let loginMethod
    if (response.body.loginMethods.LOGIN?.default === false) {
      loginMethod = 'LOGIN'
    } else if (response.body.loginMethods.LOGIN_PW?.default === false) {
      loginMethod = 'LOGIN_PW'
    } else {
      console.debug('>>> New login method! <<<', response.body.loginMethods)
      loginMethod = 'LOGIN' // try loginMethod = 'LOGIN', судя по коду есть еще вход по карте
    }
    return loginMethod
  }

  console.log('>>> status != authenticated and no loginMethods, also try to enter')
  return 'not_authenticated'
  // end test
}

async function getLogin (preferences, deviceId, loginMethod) {
  const response = await callGate('/session', {
    method: 'POST',
    headers: { ...getHeaders(), ...getLoginHeaders(deviceId) },
    body: {
      loginMethod,
      login: preferences.login,
      ...loginMethod === 'LOGIN_PW' && { password: preferences.password },
      captcha: ''
    },
    sanitizeRequestLog: { body: { login: true, password: true } },
    sanitizeResponseLog: {
      body: {
        user: { login: true, displayName: true, phoneNumbers: true, mobileDevices: true, settings: true },
        confirmation: { confirmationKey: true }
      }
    }
  })
  if (response.body?._error?.code === 'INVALID_LOGIN_OR_PASSWORD') {
    throw new InvalidLoginOrPasswordError()
  }
  return response
}

async function getConfirmationParams (pin, deviceId) {
  const response = await callGate('/user/personalized-devices/enroll', {
    method: 'POST',
    headers: {
      ...getHeaders(),
      ...getLoginHeaders(deviceId),
      Origin: 'file://'
    },
    body: {
      deviceId,
      label: DEVICE_MODEL,
      pin
    },
    sanitizeRequestLog: { body: { pin: true, deviceId: true } },
    sanitizeResponseLog: { body: { confirmation: { confirmationKey: true } } }
  })
  return response
}

async function getLoginWithSMS ({ loginMethod, pin, login, deviceId, confirmationParams }) {
  const smsCode = await ZenMoney.readLine('Введите код подтверждения из SMS для входа в Moldindconbank', {
    inputType: 'number',
    time: 60000
  })
  if (!smsCode) {
    throw new InvalidOtpCodeError()
  }
  const url = login ? '/session' : '/user/personalized-devices/enroll'
  const params = login
    ? { // вход только по логину
        loginMethod,
        login,
        captcha: ''
      }
    : { // вход по пину
        deviceId,
        label: DEVICE_MODEL,
        pin
      }
  const response = await callGate(url, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      ...getLoginHeaders(deviceId),
      ...!params.login && { Origin: 'file://' }
    },
    body: {
      ...params,
      _status: null,
      confirmation: {
        ...confirmationParams,
        response: smsCode
      }
    },
    sanitizeRequestLog: { body: { login: true, pin: true, deviceId: true, confirmation: { confirmationKey: true, response: true } } },
    sanitizeResponseLog: { body: { encryptedKey: true, encryptionParams: true } }
  })
  return response
}

async function callGate (url, options) {
  const response = await fetchJson(baseUrl + url, {
    ...options,
    sanitizeRequestLog: merge(options.sanitizeRequestLog, { headers: { cookie: true } }),
    sanitizeResponseLog: merge(options.sanitizeResponseLog, { headers: { 'set-cookie': true } })
  })
  return response
}

export async function fetchAccounts (auth) {
  const response = await callGate('/dashboard/contracts?system=W4C&filter=product.id__neq:LIAB', {
    method: 'GET',
    headers: getHeaders()
  })
  if (response.body._error?.code === 'LOGGED_OUT_USER') {
    return null
  }
  return response.body
}

export async function fetchTransactions (auth, product, fromDate, toDate) {
  // приложение банка не дает выгружать историю более чем за год, но мы попробуем запросить за произвольный срок
  const startDate = fromDate.toISOString().slice(0, 10)
  const response = await callGate(`/history?from=${startDate}&contractId=${product.id}`, {
    method: 'GET',
    headers: getHeaders()
  })
  return response.body
}
