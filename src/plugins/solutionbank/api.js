import cheerio from 'cheerio'
import { defaultsDeep, flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { generateUUID } from '../../common/utils'
import { parseXml } from '../../common/xmlUtils'
import { BankMessageError, InvalidOtpCodeError, InvalidPreferencesError, TemporaryError } from '../../errors'
import { getDate } from './converters'

// transaction - операция прошедшая по карте, operation - операция по счёту

const baseUrl = 'https://mbank.rbank.by:443/services/v2/'
const appVersion = '1.60.0'
const androidDeviceProfile = {
  browser: 'OP516FL1',
  browserVersion: 'NE2211 (NE2211)',
  platform: 'Android',
  platformVersion: '11'
}
const defaultGeolocationData = '53.902284, 27.561831'
const androidSystemFeatures = [
  'android.hardware.camera',
  'android.hardware.location.gps',
  'android.hardware.location.network',
  'android.hardware.nfc',
  'android.hardware.telephony',
  'android.hardware.touchscreen',
  'android.hardware.wifi',
  'android.software.webview'
]
const statementIntervalMs = 31 * 24 * 60 * 60 * 1000

function generateDeviceID () {
  return 'xxxxxxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16))
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      sanitizeRequestLog: {
        headers: {
          session_token: true,
          _ac0: true,
          _ac1: true
        },
        body: {
          login: true,
          password: true,
          deviceUDID: true,
          deviceInfo: true,
          confirmationData: true,
          pushId: true
        }
      },
      sanitizeResponseLog: {
        body: {
          sessionToken: true,
          fingerprint: true
        }
      }
    }
  )
  const response = await fetchJson(baseUrl + url, options)

  if (predicate) {
    validateResponse(response, predicate, error)
  }

  return response
}

function validateResponse (response, predicate, error = (message) => console.assert(false, message)) {
  if (!predicate || !predicate(response)) {
    const validationError = error('non-successful response')
    if (validationError) {
      throw validationError
    }
    throw new TemporaryError('non-successful response')
  }
}

function getDataOrCreate (key, createValue) {
  let value = ZenMoney.getData(key)
  if (!value) {
    value = createValue()
    ZenMoney.setData(key, value)
  }
  return value
}

function getDeviceID () {
  return getDataOrCreate('device_id', generateDeviceID)
}

function getAntiFraudID () {
  return getDataOrCreate('anti_fraud_id', generateUUID)
}

function setAntiFraudID (value) {
  if (value) {
    ZenMoney.setData('anti_fraud_id', value)
  }
}

function getPushID () {
  return ZenMoney.getData('push_id') || ''
}

function getHeaders (sessionToken = null) {
  return {
    language: 'ru',
    _ac1: getAntiFraudID(),
    ...(sessionToken && {
      session_token: sessionToken,
      _ac0: sessionToken
    })
  }
}

function normalizeDeviceInfoValue (value) {
  return value === null || value === undefined ? '' : String(value).trim().toLowerCase()
}

function getDeviceInfo () {
  const deviceId = getDeviceID()
  return {
    parameters: [
      {
        device_model: normalizeDeviceInfoValue('NE2211'),
        device_name: normalizeDeviceInfoValue(androidDeviceProfile.browser),
        deviceid: normalizeDeviceInfoValue(deviceId),
        geolocationdata: defaultGeolocationData,
        locale: normalizeDeviceInfoValue('ru_BY'),
        time_zone: normalizeDeviceInfoValue('Europe/Minsk'),
        os_name: normalizeDeviceInfoValue(androidDeviceProfile.platform),
        os_version: normalizeDeviceInfoValue(androidDeviceProfile.platformVersion),
        width: normalizeDeviceInfoValue(1080),
        height: normalizeDeviceInfoValue(2400),
        scale: normalizeDeviceInfoValue(3),
        uuid: normalizeDeviceInfoValue(deviceId),
        android_specific: {
          build_bootloader: '',
          build_display: normalizeDeviceInfoValue('NE2211_11_C.48'),
          build_fingerprint: normalizeDeviceInfoValue('NE2211_11_C.48'),
          build_id: normalizeDeviceInfoValue('RKQ1.211119.001'),
          build_manufacturer: normalizeDeviceInfoValue('OnePlus'),
          build_radio: '',
          iccid: '',
          package_manager_getsystemavailablefeatures: androidSystemFeatures
        }
      }
    ]
  }
}

export function createDateIntervals (fromDate, toDate) {
  return commonCreateDateIntervals({
    fromDate,
    toDate,
    addIntervalToDate: date => new Date(date.getTime() + statementIntervalMs - 1),
    gapMs: 1
  })
}

function expandCardAccounts (cardAccounts) {
  return flatMap(cardAccounts, cardAccount => {
    return (cardAccount.cards || []).map(card => ({
      ...cardAccount,
      balance: getOverviewBalance(cardAccount, card),
      cardHash: card.cardHash,
      cards: [card]
    }))
  })
}

function getOverviewBalance (cardAccount, card) {
  return card.balance ?? card.availableAmount ?? card.balanceAmount ??
    cardAccount.balance ?? cardAccount.availableAmount ?? cardAccount.balanceAmount ?? 0
}

async function fetchCardBalance (sessionToken, cardAccount) {
  const card = cardAccount.cards[0]
  const balanceRes = await fetchApiJson('payment/simpleExcute', {
    method: 'POST',
    headers: getHeaders(sessionToken),
    body: {
      komplatRequests: [
        {
          request: '<BS_Request>' +
            '<Version>@{version}</Version>' +
            '<RequestType>Balance</RequestType>' +
            '<ClientId IdType="MS">#{' + card.cardHash + '@[card_number]}</ClientId>' +
            '<AuthClientId IdType="MS">#{' + card.cardHash + '@[card_number]}</AuthClientId>' +
            '<TerminalTime>@{pay_date}</TerminalTime>' +
            '<TerminalId>@{terminal_id_mb}</TerminalId>' +
            '<TerminalCapabilities>' +
            '<BooleanParameter>Y</BooleanParameter>' +
            '<LongParameter>Y</LongParameter>' +
            '<AnyAmount>Y</AnyAmount>' +
            '<ScreenWidth>99</ScreenWidth>' +
            '<CheckWidth DoubleHeightSymbol="Y" DoubleWidthSymbol="N" InverseSymbol="Y">40</CheckWidth>' +
            '</TerminalCapabilities>' +
            '<Balance Currency="' + card.currency + '">' +
            '<AuthorizationDetails Count="1">' +
            '<Parameter Idx="1" Name="Срок действия карточки">#{' + card.cardHash + '@[card_expire]}</Parameter>' +
            '</AuthorizationDetails>' +
            '</Balance></BS_Request>'
        }
      ]
    }
  })
  const balanceXml = parseXml(balanceRes.body.komplatResponse[0].response)
  return balanceXml.BS_Response.Balance.Amount
}

function getStatementAccountId (account) {
  return account.internalAccountId || account.cardAccountNumber || account.id
}

function getUniqueStatementAccounts (accounts) {
  const ids = new Set()
  return accounts.filter(account => {
    const id = getStatementAccountId(account)
    if (ids.has(id)) {
      return false
    }
    ids.add(id)
    return true
  })
}

function findOperationAccount (operation, statementAccount, accounts) {
  const cardLast4 = operation.cardPAN ? String(operation.cardPAN).slice(-4) : null
  if (!cardLast4) {
    return statementAccount
  }
  return accounts.find(account => {
    return getStatementAccountId(account) === getStatementAccountId(statementAccount) &&
      (account.cardLast4 === cardLast4 || (account.syncID || []).includes(cardLast4))
  }) || statementAccount
}

export async function login (login, password) {
  let res = await loginReq(login, password)
  let code = ''
  switch (res.body.errorInfo.error) {
    case '10415':
      code = await ZenMoney.readLine('Введите код из СМС', {
        time: 120000,
        inputType: 'text'
      })
      if (!code || !code.trim()) {
        throw new InvalidOtpCodeError()
      }
      res = await loginReq(login, password, code)
      assertSuccessfulLogin(res)
      break
    case '10004':
      throw new InvalidPreferencesError('Неверный логин или пароль')
    case '0':
      assertSuccessfulLogin(res)
      break
    default:
      throw new BankMessageError(res.body.errorInfo.errorText)
  }

  return res.body.sessionToken
}

function assertSuccessfulLogin (res) {
  const errorInfo = res.body && res.body.errorInfo
  if (!errorInfo || errorInfo.error !== '0') {
    throw new BankMessageError(errorInfo && errorInfo.errorText ? errorInfo.errorText : 'Ошибка входа')
  }
  if (!res.body.sessionToken) {
    throw new TemporaryError('Сессионный ключ не получен')
  }
}

async function loginReq (login, password, smsCode) {
  const body = {
    applicID: appVersion,
    ...androidDeviceProfile,
    clientKind: '0',
    deviceUDID: getDeviceID(),
    deviceInfo: getDeviceInfo(),
    login,
    password,
    pushId: getPushID()
  }
  if (smsCode) {
    body.confirmationData = smsCode
  }
  const response = await fetchApiJson('session/login', {
    method: 'POST',
    headers: getHeaders(),
    body,
    sanitizeRequestLog: { body: { login: true, password: true, deviceUDID: true, deviceInfo: true, confirmationData: true, pushId: true } },
    sanitizeResponseLog: { body: { sessionToken: true, fingerprint: true } }
  }, response => response.body && response.body.errorInfo, message => new InvalidPreferencesError('bad request'))
  setAntiFraudID(response.body && response.body.fingerprint)
  return response
}

export async function fetchAccounts (sessionToken) {
  console.log('>>> Загрузка списка счетов...')
  const cardAccounts = expandCardAccounts((await fetchApiJson('products/getUserAccountsOverview', {
    method: 'POST',
    headers: getHeaders(sessionToken),
    body: {
      cardAccount: {
        withBalance: 'null'
      },
      creditAccount: {},
      currentAccount: {},
      depositAccount: {}
    }
  }, response => response.body && response.body.overviewResponse && response.body.overviewResponse.cardAccount,
  message => new TemporaryError(message))).body.overviewResponse.cardAccount)

  for (const cardAccount of cardAccounts) {
    cardAccount.balance = await fetchCardBalance(sessionToken, cardAccount)
  }

  return cardAccounts
}

export async function fetchTransactions (sessionToken, accounts, fromDate) {
  console.log('>>> Загрузка списка транзакций через минивыписку...')
  const responses = await Promise.all(flatMap(accounts, (account) => {
    if (!account.cardHash) {
      return []
    }
    return fetchApiJson('payment/simpleExcute', {
      method: 'POST',
      headers: getHeaders(sessionToken),
      body: {
        komplatRequests: [
          {
            request: '<BS_Request>' +
              '<Version>@{version}</Version>' +
              '<RequestType>GetAuthHistory</RequestType>' +
              '<ClientId IdType="MS">#{' + account.cardHash + '@[card_number]}</ClientId>' +
              '<AuthClientId IdType="MS">#{' + account.cardHash + '@[card_number]}</AuthClientId>' +
              '<TerminalTime>@{pay_date}</TerminalTime>' +
              '<TerminalId>@{terminal_id_mb}</TerminalId>' +
              '<TerminalCapabilities>' +
              '<BooleanParameter>Y</BooleanParameter>' +
              '<AnyAmount>Y</AnyAmount>' +
              '<LongParameter>Y</LongParameter>' +
              '<ScreenWidth>99</ScreenWidth>' +
              '<CheckWidth DoubleHeightSymbol="Y" DoubleWidthSymbol="N" InverseSymbol="Y">40</CheckWidth>' +
              '</TerminalCapabilities>' +
              '<GetAuthHistory Currency="' + account.instrumentCode + '">' +
              '<AuthId IdType="MS">#{' + account.cardHash + '@[card_number]}</AuthId>' +
              '<AuthorizationDetails Count="1">' +
              '<Parameter Idx="1" Name="Срок действия карточки">#{' + account.cardHash + '@[card_expire]}</Parameter>' +
              '</AuthorizationDetails>' +
            '</GetAuthHistory></BS_Request>'
          }
        ]
      }
    }, response => true).then(response => ({ response, account }))
  }))

  let $
  const transactions = flatMap(responses, ({ response, account }) => {
    if (response && response.body && response.body.komplatResponse && response.body.komplatResponse[0].response) {
      $ = cheerio.load(response.body.komplatResponse[0].response, {
        xmlMode: true
      })
      return flatMap($('Operation'), op => {
        return {
          account_id: account.id,
          accountCurrencyCode: account.instrumentCode,
          transactionDate: getDate(op.attribs.Date),
          transactionName: op.attribs.Type,
          transactionCurrencyCode: op.attribs.Currency,
          transactionAmount: Number.parseFloat(op.children[0].data.replace(',', '.').replace(/\s/g, '')),
          merchant: op.attribs.Merchant,
          hold: true
        }
      })
    }
    return undefined
  })

  const filteredTransactions = transactions.filter(tr => tr !== undefined && tr.transactionDate >= fromDate && tr.transactionAmount !== 0)

  console.log(`>>> Загружено ${filteredTransactions.length} транзакций из мини-выписки.`)
  return filteredTransactions
}

export async function fetchOperations (sessionToken, accounts, fromDate, toDate) {
  // Этот запрос показывает информацию только по проведенным операциям, т.е. через 2-3 дня
  console.log('>>> Загрузка списка транзакций через полную выписку...')
  toDate = toDate || new Date()
  const dateIntervals = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(flatMap(getUniqueStatementAccounts(accounts), (account) => {
    return dateIntervals.map(([fromDate, toDate]) => {
      return fetchApiJson('products/getCardAccountFullStatement', {
        method: 'POST',
        headers: getHeaders(sessionToken),
        body: {
          accountType: account.accountType,
          bankCode: account.bankCode,
          cardHash: account.cardHash,
          currencyCode: Number.parseInt(account.instrumentCode),
          internalAccountId: getStatementAccountId(account),
          reportData: {
            from: fromDate.getTime(),
            till: toDate.getTime()
          },
          rkcCode: account.rkcCode
        }
      }, response => response.body).then(response => ({ response, account }))
    })
  }))

  const operations = flatMap(responses, ({ response, account }) => {
    return flatMap(response.body.operations, op => {
      const operationSign = Number.parseInt(op.operationSign)
      const operationAccount = findOperationAccount(op, account, accounts)
      return {
        id: op.transactionAuthCode,
        account_id: operationAccount.id,
        operationName: op.operationName,
        operationDate: new Date(op.transactionDate),
        operationCurrencyCode: op.operationCurrency,
        operationAmount: op.operationAmount * operationSign,
        transactionDate: new Date(op.operationDate),
        transactionAmount: op.transactionAmount * operationSign,
        transactionCurrencyCode: op.transactionCurrency,
        merchant: op.operationPlace,
        hold: false,
        ...(op.rrn && { rrn: op.rrn }),
        ...(op.merchantId && { merchantId: op.merchantId }),
        ...(op.mcc && { mcc: op.mcc }),
        ...(op.operationCode && { operationCode: op.operationCode })
      }
    })
  })

  const filteredOperations = operations.filter(function (op) {
    return op !== undefined &&
      op.transactionDate >= fromDate &&
      op.transactionDate <= toDate &&
      op.operationAmount !== 0
  })

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
