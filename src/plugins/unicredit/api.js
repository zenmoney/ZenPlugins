import { Buffer } from 'buffer'
import { decode } from 'iconv-lite'
import { defaultsDeep } from 'lodash'
import { stringify } from 'querystring'
import { fetch } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { generateUUID, randomInt } from '../../common/utils'
import { parseXml } from '../../common/xmlUtils'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError } from '../../errors'

const baseUrl = 'https://enter.unicredit.ru/v2/cgi/bsi.dll?'
const deviceName = 'Zenmoney'

async function callGate (command, options) {
  const binaryResponse = Boolean(options && options.forceUtf8Decoding)
  return fetch(baseUrl, {
    method: 'POST',
    stringify,
    binaryResponse,
    parse: str => {
      if (binaryResponse) {
        str = decode(Buffer.from(str), 'utf8')
      }
      return parseXml(str)
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Host: 'enter.unicredit.ru',
      Connection: 'Keep-Alive'
    },
    body: {
      Console: 'android',
      L: 'RUSSIAN',
      TIC: '0',
      VC: '91',
      appversion: '1.30.22.2',
      T: command,
      ...options && options.body
    },
    sanitizeRequestLog: defaultsDeep({ body: { SID: true, deviceId: true, pinHash: true } }, options && options.sanitizeRequestLog),
    sanitizeResponseLog: defaultsDeep({
      body: {
        response: { information: { value: true }, user: true },
        form: { sid: true }
      }
    }, options && options.sanitizeResponseLog)
  })
}

function getArray (object) {
  return object === null || object === undefined
    ? []
    : Array.isArray(object) ? object : [object]
}

function getParamsForCommand (commands, key) {
  const command = commands.find(command => command.param === key)
  const match = command && command.action && command.action.match(/^[^(]+\(([^(]+)\)$/)
  if (match) {
    return parseParams(match[1])
  } else {
    return null
  }
}

function parseParams (str) {
  if (!str) {
    return null
  }
  const params = {}
  str.split(';').forEach(it => {
    const [key, value] = it.split('=')
    params[key] = value
  })
  return params
}

export async function login (auth, { login, password }) {
  if (auth && auth.pin && auth.deviceId) {
    const { pin, deviceId } = auth
    const response = await callGate('RT_2Auth.CL', {
      body: {
        PinHash: pin, // -1175576585,
        MobDevice: deviceName,
        MobModel: deviceName,
        MobOS: 'Android OS 8.0.0',
        deviceId: deviceId,
        rootJB: '1'
      }
    })
    const sid = response.body.response && response.body.response.information && response.body.response.information.value
    if (sid) {
      return { sid, pin, deviceId }
    }
  }

  let response = await callGate('android_utils.getLoginMap')
  const mapId = response.body.loginmap.MapID
  const characterMap = response.body.loginmap.Map.split(',')

  const deviceId = generateUUID()

  response = await callGate('RT_2Auth.CL', {
    body: {
      A: login,
      B: password.split('').map(c => characterMap[c.charCodeAt(0)]).join(';'),
      MapID: mapId,
      MobDevice: deviceName,
      MobModel: deviceName,
      MobOS: 'Android OS 8.0.0',
      deviceId,
      rootJB: '1'
    },
    sanitizeRequestLog: { body: { A: true, B: true } }
  })
  if (response.body.response.errorlabel && response.body.response.errorlabel.caption && [
    'при вводе логина или пароля'
  ].some(str => response.body.response.errorlabel.caption.indexOf(str) >= 0)) {
    throw new InvalidLoginOrPasswordError()
  }

  const sid = response.body.response.information.value

  response = await callGate('rt_android_1Common.advancedAuth', {
    body: {
      TIC: '1',
      SID: sid,
      XACTION: 'POSTDATA'
    }
  })
  const smsParams = getParamsForCommand(getArray(response.body.form.command), 'GETSMS')
  const hash = smsParams && smsParams.HASH
  if (!hash && response.body.form.input && response.body.form.input.param === 'PSW') {
    throw new TemporaryError('Чтобы подключить ЮниКредит Банк, включите в банке вход по SMS и повторите подключение. Вход по сеансовому ключу не поддерживается.')
  }

  console.assert(hash, 'could not parse SMS hash')

  response = await callGate('RT_1SMSCODE.Create2FaSMSbyClientRequest', {
    body: {
      TIC: '1',
      SID: sid,
      XACTION: 'SMSREQUEST',
      FORMACTION: 'NEW',
      HASH: hash,
      SCHEMEID: '-1',
      SCHEMENAME: 'ADVANCEDAUTH'
    }
  })
  console.assert(response.body.form.command.action === 'SMSSENT', 'unexpected response')

  const code = await ZenMoney.readLine('Введите код из SMS', {
    time: 120000,
    inputType: 'number'
  })
  if (!code || !code.trim()) {
    throw new InvalidOtpCodeError()
  }

  response = await callGate('RT_Android_1Common.advancedAuth', {
    body: {
      TIC: '1',
      SID: sid,
      HASH: hash,
      SCHEMEID: '-1',
      SMS_RESULT: code,
      XACTION: 'POSTAUTH',
      FORMACTION: 'ADVANCEDAUTH',
      FORCESAVE: '1',
      CASHTOKEN: ''
    }
  })
  if (response.body.form && response.body.form.id === 'error') {
    throw new InvalidOtpCodeError()
  }
  console.assert(response.body.rule.id === 'completed2fa', 'unexpected response')

  const pin = (-randomInt(1000000000, 2000000000)).toString()
  await callGate('RT_android_1common.start', {
    forceUtf8Decoding: true,
    body: {
      TIC: '1',
      SID: sid,
      pinHash: pin,
      MobDevice: deviceName,
      MobModel: deviceName,
      MobOS: 'Android OS 8.0.0',
      deviceId,
      rootJB: '1'
    }
  })

  return {
    sid,
    pin,
    deviceId
  }
}

function formatDate (date) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join('.')
}

export async function fetchAccounts ({ sid }) {
  const response = await callGate('rt_android_1common.start', {
    forceUtf8Decoding: true,
    body: {
      TIC: '1',
      SID: sid
    },
    sanitizeResponseLog: { body: { form: { card: { holder: true, fio: true } } } }
  })
  if (response.body.form.id === 'changepass') {
    const message = 'Мы усилили меры безопасности в отношении паролей доступа в систему. В связи с этим просим вас задать новый пароль.'
    throw new BankMessageError(message)
  }
  const accounts = {}
  Object.keys(response.body.form).filter(key => [
    'id',
    'newlang',
    'warn',
    'sid',
    'header',
    'actionback',
    'updatetype',
    'param',
    'bg',
    'userupd',
    'filter',
    'offer'
  ].indexOf(key) < 0).forEach(key => {
    accounts[key] = getArray(response.body.form[key])
  })
  return accounts
}

export async function fetchHistory ({ sid }, fromDate, toDate) {
  const response = await callGate('rt_android_1Common.FORM', {
    forceUtf8Decoding: true,
    body: {
      TIC: '1',
      SID: sid,
      SCHEMENAME: 'history',
      STM: '1',
      DATEWITH: formatDate(fromDate),
      DATEON: formatDate(toDate)
    }
  })
  return getArray(response.body.form.stmitem).reverse()
}

export async function fetchTransactions ({ sid }, { id }, fromDate, toDate) {
  const response = await callGate('rt_android_1Common.FORM', {
    forceUtf8Decoding: true,
    body: {
      TIC: '1',
      SID: sid,
      SCHEMENAME: 'stm',
      FORMACTION: 'NEW',
      LEN: '10',
      ACC: id,
      ACCID: id,
      ASHIST: '1',
      BDATESTM: formatDate(fromDate),
      EDATESTM: formatDate(toDate)
    }
  })
  return getArray(response.body.form.stmitem)
}
