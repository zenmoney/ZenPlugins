import forge from 'node-forge'
import { generateUUID } from '../../common/utils'
import { BankMessageError, InvalidPreferencesError, TemporaryUnavailableError } from '../../errors'
import Connection from '../../common/protocols/webSocket'
import { parseDateToApiFormat, parseTransactionDate } from './converters.js'
import { retry } from '../../common/retry'
import { ParseError } from '../../common/network'

const APP_VERSION = '2.282.06'

function getPhoneNumber (str) {
  const number = /^(?:\+?380)(\d{9})$/.exec(str.trim())
  if (number) {
    return '+380' + number[1]
  }
  return null
}

export function generateDevice (login) {
  return {
    deviceId: '',
    hardwareID: forge.md.sha256.create().update(login).digest().toHex().slice(0, 16)
  }
}

function getDeviceData (device) {
  return {
    full_environment: false,
    biometric_authentication_face_id: false,
    biometric_authentication_touch_id: true,
    device_hardware_id: device.hardwareID, // '4825a61c912a3666',
    imei: '',
    device_imprint: '',
    location: {},
    device_model: ZenMoney.device.model,
    os: 'Android',
    os_version: '8.0.0',
    push_token: '',
    sims: [
      {
        carrier_cc: '310',
        carrier_nc: '260',
        sim_id: '',
        carrier_name: 'Android',
        sim_cc: '310',
        sim_nc: '260'
      }
    ]
  }
}

function generateMessageId (sessionId) {
  return sessionId ? `${sessionId}_${generateMessageId()}` : generateUUID().split('-').join('')
}

async function sendRequest (request, requestData, device, connection, sanitizeRequestLog) {
  try {
    return await retry(
      {
        getter: async () => {
          const messageId = generateMessageId(requestData.session_id)
          const body = {
            data: {
              device_id: device.deviceId,
              ...request
            },
            ...requestData,
            id: messageId,
            lang: 'EN'
          }
          const responseBody = (await connection.send(messageId, { body, sanitizeRequestLog })).body
          if (responseBody.data?.problem?.title?.match(/Try (it|) later/i)) {
            return null
          }
          return responseBody
        },
        predicate: data => data,
        delayMs: 500,
        maxAttempts: 3
      }
    )
  } catch (e) {
    if (e instanceof ParseError) {
      throw new TemporaryUnavailableError()
    }
    throw e
  }
}

async function setupIdentify (connection, device) {
  return sendRequest({
    app_version: APP_VERSION,
    device_data: {
      ...getDeviceData(device)
    },
    hardware_id: device.hardwareID,
    cz: {
      form_id: '10.authentication',
      functional: 'INIT',
      request: 'IDENTIFY'
    }
  }, {
    type: 'INIT'
  }, device, connection)
}

async function loginUser (login, password, connection, device) {
  return sendRequest({
    app_type: 'A_PROD',
    app_version: APP_VERSION,
    config_version: 1,
    first: true,
    launch_pending: 'regular',
    login,
    password: forge.util.encode64(password),
    cz: {
      button_id: 'button_authentication',
      form_id: '10.authentication',
      functional: 'AUTH',
      request: 'AUTHENTICATION'
    },
    device_data: {
      ...getDeviceData(device)
    }
  }, {
    type: 'AUTH'
  }, device, connection, { body: { data: { login: true, password: true } } })
}

async function fetchAccountsAndCards (sessionId, device, connection) {
  return sendRequest({
    account_type: 'ALL',
    cz: {
      form_id: '50.main',
      functional: 'MAIN',
      request: 'GET_ACCOUNTS_AND_CARDS'
    }
  }, {
    session_id: sessionId,
    type: 'BUSINESS'
  }, device, connection)
}

async function fetchDepositsList (sessionId, device, connection) {
  return sendRequest({
    cz: {
      form_id: '50.main',
      functional: 'DEPOSITS',
      request: 'DEPOSITS_LIST'
    }
  }, {
    session_id: sessionId,
    type: 'BUSINESS'
  }, device, connection)
}

async function fetchLoansList (sessionId, device, connection) {
  return sendRequest({
    cz: {
      form_id: '50.main',
      functional: 'LOANS',
      request: 'LOANS_LIST'
    }
  }, {
    session_id: sessionId,
    type: 'BUSINESS'
  }, device, connection)
}

async function fetchOperationsHistory (
  accoundId,
  fromDate,
  sessionId,
  device,
  connection
) {
  return sendRequest({
    current_account_ids: [accoundId],
    is_credit_limit_available: true,
    is_offer_credit_limit_available: true,
    date_end: parseDateToApiFormat(fromDate),
    cz: {
      functional: 'OPERATIONS_HISTORY',
      request: 'GET_OPERATIONS_HISTORY',
      version: 11
    }
  }, {
    session_id: sessionId,
    type: 'BUSINESS'
  }, device, connection)
}

// LEGACY, NOT SUPPORTED
async function fetchApiTransactions (accountId, limit, sessionId, device, connection) {
  return sendRequest({
    account_id: accountId,
    limit,
    transaction_type: 'All',
    cz: {
      form_id: '51.account_card_info',
      functional: 'MAIN',
      request: 'GET_TRANSACTIONS'
    }
  }, {
    session_id: sessionId,
    type: 'BUSINESS'
  }, device, connection)
}

export async function login ({ login, password }, device) {
  if (ZenMoney.trustCertificates) {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGyTCCBbGgAwIBAgIQDnXL/QOkjEq92+Fa/65tMTANBgkqhkiG9w0BAQsFADBf
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMR4wHAYDVQQDExVUaGF3dGUgRVYgUlNBIENBIDIwMTgw
HhcNMjIwODAxMDAwMDAwWhcNMjMwOTAxMjM1OTU5WjCBxjETMBEGCysGAQQBgjc8
AgEDEwJVQTEdMBsGA1UEDwwUUHJpdmF0ZSBPcmdhbml6YXRpb24xETAPBgNVBAUT
CDE0MjgyODI5MQswCQYDVQQGEwJVQTENMAsGA1UEBxMES3lpdjFIMEYGA1UECgw/
UFVCTElDIEpPSU5UIFNUT0NLIENPTVBBTlkgIkZJUlNUIFVLUkFJTklBTiBJTlRF
Uk5BVElPTkFMIEJBTksiMRcwFQYDVQQDEw5tb2JpbGUucHVtYi51YTCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAOZN6U15ksjGvDhgKvhnDbPsmxhBgnAL
Pm2aQBd5GXtOhlEd7oEdMganlHVYlhhPQnh8NnfLG6WKg/tRbjylBK20Xy63jcK4
9Oiv0dzGK+n6pNo+EsltoBoOuj1sQz2wFd+KITAkbORZSTIeFg7bP2F10EkEWpfn
vPLaH7VClNzEmYZjTLaYorXojc7qOqaJRgSDtLMJhfsjNe7+F7aYCDZk4yHBsXRn
TwHaQEMRXbUsQfQ2zzMykTAaa44ETLzJ6IN+6a1w7BGsHtawt7SVtVcojrytL4SV
xT6mL62u81agFOjW+tWv6IZxSwOpU4t4Ks0UTRTue/QGWoNCyFOZQ5sCAwEAAaOC
AxcwggMTMB8GA1UdIwQYMBaAFOcB/AwWGMp9sozshyejb2GBO4Q5MB0GA1UdDgQW
BBSZdPAaAaHkt0n9LDp27Z+gvo2DDzAZBgNVHREEEjAQgg5tb2JpbGUucHVtYi51
YTAOBgNVHQ8BAf8EBAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMC
MDwGA1UdHwQ1MDMwMaAvoC2GK2h0dHA6Ly9jZHAudGhhd3RlLmNvbS9UaGF3dGVF
VlJTQUNBMjAxOC5jcmwwSgYDVR0gBEMwQTALBglghkgBhv1sAgEwMgYFZ4EMAQEw
KTAnBggrBgEFBQcCARYbaHR0cDovL3d3dy5kaWdpY2VydC5jb20vQ1BTMHEGCCsG
AQUFBwEBBGUwYzAkBggrBgEFBQcwAYYYaHR0cDovL3N0YXR1cy50aGF3dGUuY29t
MDsGCCsGAQUFBzAChi9odHRwOi8vY2FjZXJ0cy50aGF3dGUuY29tL1RoYXd0ZUVW
UlNBQ0EyMDE4LmNydDAJBgNVHRMEAjAAMIIBfQYKKwYBBAHWeQIEAgSCAW0EggFp
AWcAdQDoPtDaPvUGNTLnVyi8iWvJA9PL0RFr7Otp4Xd9bQa9bgAAAYJZMemrAAAE
AwBGMEQCIHTei06+J8MXffiH7yTCztpVsF+oTuoH6B1xzHX+j7DYAiAZ33Bcvkg2
iOIi4EN74tDXhAUvxUu/WuIV4bLfKAeOIwB2ADXPGRu/sWxXvw+tTG1Cy7u2JyAm
Ueo/4SrvqAPDO9ZMAAABglkx6OQAAAQDAEcwRQIhAJFTjrY5atDaS6ElYT7/e5dC
KosZJAevPvIeDB1mrjgkAiBKa8aXb4L11dXyN2muJYUyhvTYZDy/73asAKwLoCQQ
8AB2ALNzdwfhhFD4Y4bWBancEQlKeS2xZwwLh9zwAw55NqWaAAABglkx6RoAAAQD
AEcwRQIgTuXQOKsRL5NwQeq2YIOCcXjeoWpXiWIWYFOg8MdRN6ACIQDi9tpbHPvS
CsmJqGYBS+FDxOO0z9Z3Ah/2HQhyBAcn8zANBgkqhkiG9w0BAQsFAAOCAQEAVPZM
oqhyJvzddG/OjQls1UipUUGbv8FpasfD1cmum3PO+IxabgS8A8K56Cxu6VAFRSvM
MT6Qo6K3R63vGsUG7lAMYP3Zi2VpaOH1yuGi/DJLfnv2AQFzpUnesNXtwaSLGmrD
dZXXtkNYMtIoPexZza6nSR/BzXFo/wVXuvpup6T+eOQJz21oiFMK9SR0LJavv/sl
GRjMp5XNLR1sYFhJ9Po4RGi70/xp8tG9iS2o2Pt3Jkb7EaogQBE4d2GLc/BsSk68
IFdmF9z4NvS4iQsDUcrX5Q7GLa+r2NyX86ScDA6Kqt/psV/QKu7jspOe7lSRtA/e
5C/WVsu6x7wNhAJxWw==
-----END CERTIFICATE-----`
    ])
  }

  login = getPhoneNumber(login)
  if (!login) {
    throw new InvalidPreferencesError('Неверный номер телефона')
  }
  const myConnection = new Connection()
  await myConnection.open('wss://mobile.pumb.ua/ws')
  const identity = await setupIdentify(myConnection, device)
  device.deviceId = identity.data.device_id
  const loginAnswer = await loginUser(login, password, myConnection, device)
  if (loginAnswer.data.problem) {
    if (loginAnswer.data.problem.title.match(/Technical/i)) {
      throw new BankMessageError(loginAnswer.data.problem.title)
    }
    if ([
      /^.*Incorrect phone number or password.*$/i,
      /^.*Некорректные данные.*$/i,
      /^.*Incorrect data entered.*$/i
    ].some(regExp => regExp.test(loginAnswer.data.problem.title))) {
      throw new InvalidPreferencesError('Неверный номер телефона или пароль')
    }
    if ([
      /^.*Login or password is entered incorrectly.*$/i
    ].some(regExp => regExp.test(loginAnswer.data.problem.title))) {
      throw new InvalidPreferencesError('Логин или пароль введены некорректно')
    }
    if ([
      /^.*Account blocked.*$/i,
      /^.*account is blocked.*$/i,
      /^.*unlocking on the site.*$/i
    ].some(regExp => regExp.test(loginAnswer.data.problem.title))) {
      throw new BankMessageError(loginAnswer.data.problem.title)
    }
    console.assert(false, 'Server returned unknown error')
  }
  if (loginAnswer.data.settings?.strings) {
    if (loginAnswer.data.settings.strings[0].en.match(/something went wrong/i)) {
      throw new BankMessageError(loginAnswer.data.settings.strings[0].uk)
    }
  }
  return {
    connection: myConnection,
    device,
    sessionId: loginAnswer.data.session_id
  }
}

export async function logout (auth) {
  if (auth && auth.connection) {
    await auth.connection.close()
  }
}

export async function fetchAccounts (auth) {
  const accounts = (await fetchAccountsAndCards(auth.sessionId, auth.device, auth.connection)).data.accounts || []
  const deposits = (await fetchDepositsList(auth.sessionId, auth.device, auth.connection)).data.deposits || []
  const loans = (await fetchLoansList(auth.sessionId, auth.device, auth.connection)).data.loans || []
  return {
    accounts,
    deposits,
    loans
  }
}

export async function fetchTransactions (auth, mainProduct, fromDate, toDate) {
  let transactions = []
  let top = 0
  do {
    top += 50
    const response = await fetchApiTransactions(mainProduct.id, top, auth.sessionId, auth.device, auth.connection)
    transactions = response.data.transactions.filter(transaction => parseTransactionDate(transaction).getTime() >= fromDate.getTime()) || transactions
  } while (transactions.length === top)
  return transactions
}

export async function fetchTransactionsNew (auth, mainProduct, fromDate) {
  const response = await fetchOperationsHistory(mainProduct.id, fromDate, auth.sessionId, auth.device, auth.connection)
  return response.data.transactions_history_list
}
