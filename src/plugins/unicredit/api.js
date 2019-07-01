import { Buffer } from 'buffer'
import { decode } from 'iconv-lite'
import { defaultsDeep } from 'lodash'
import { stringify } from 'querystring'
import { fetch, parseXml as parse } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { generateUUID, randomInt } from '../../common/utils'

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
      return parse(str)
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Host': 'enter.unicredit.ru',
      'Connection': 'Keep-Alive'
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
    let { pin, deviceId } = auth
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
    if (response.body.response && response.body.response.information && response.body.response.information.name === 'PinCodeReset') {
      // let's auth by login and password
    } else {
      const sid = response.body.response.information.value
      console.assert(sid, 'unexpected response')
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
    throw new TemporaryError('Введен пустой код из SMS. Повторите подключение синхронизации ещё раз.')
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
    throw new TemporaryError('Введен неверный код из SMS. Повторите подключение синхронизации ещё раз.')
  }
  console.assert(response.body.rule.id === 'completed2fa', 'unexpected response')

  const pin = (-randomInt(1000000000, 2000000000)).toString()
  await callGate('RT_android_1common.start', {
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
    }
  })
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
    'filter'
  ].indexOf(key) < 0).forEach(key => {
    accounts[key] = getArray(response.body.form[key])
  })
  return accounts
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
