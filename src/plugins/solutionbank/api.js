import cheerio from 'cheerio'
import { defaultsDeep, flatMap } from 'lodash'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { parseXml } from '../../common/xmlUtils'
import { BankMessageError, InvalidOtpCodeError } from '../../errors'
import { getDate } from './converters'

// transaction - операция прошедшая по карте, operation - операция по счёту

const baseUrl = 'https://mbank2.rbank.by/services/v2/'

function generateDeviceID () {
  return generateRandomString(16)
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      sanitizeRequestLog: { headers: { session_token: true } }
    }
  )
  const response = await fetchJson(baseUrl + url, options)

  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  return response
}

function validateResponse (response, predicate, error = (message) => console.assert(false, message)) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
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
      break
    case '10004':
      throw new InvalidPreferencesError('Неверный логин или пароль')
    case '0':
      break
    default:
      throw new BankMessageError(res.body.errorInfo.errorText)
  }

  return res.body.sessionToken
}

async function loginReq (login, password, smsCode) {
  const deviceID = ZenMoney.getData('device_id') ? ZenMoney.getData('device_id') : generateDeviceID()
  ZenMoney.setData('device_id', deviceID)

  const body = {
    applicID: '1.57.0',
    browser: 'iPhone',
    browserVersion: 'Unknown Device',
    clientKind: '1',
    deviceUDID: deviceID,
    login,
    password,
    platform: 'iOS',
    platformVersion: '15.0.2'
  }
  if (smsCode !== '') {
    body.confirmationData = smsCode
  }
  return fetchApiJson('session/login', {
    method: 'POST',
    body,
    sanitizeRequestLog: { body: { login: true, password: true, deviceUDID: true, confirmationData: true } },
    sanitizeResponseLog: { body: { sessionToken: true } }
  }, response => response.success, message => new InvalidPreferencesError('bad request'))
}

export async function fetchAccounts (sessionToken) {
  console.log('>>> Загрузка списка счетов...')
  const cardAccounts = (await fetchApiJson('products/getUserAccountsOverview', {
    method: 'POST',
    headers: { session_token: sessionToken },
    body: {
      cardAccount: {
        withBalance: 'null'
      },
      creditAccount: {},
      currentAccount: {},
      depositAccount: {}
    }
  }, response => response.body && response.body.overviewResponse && response.body.overviewResponse.cardAccount,
  message => new TemporaryError(message))).body.overviewResponse.cardAccount.filter(cardAccount => cardAccount.cards)

  for (let i = 0; i < cardAccounts.length; i++) {
    const balanceRes = await fetchApiJson('payment/simpleExcute', {
      method: 'POST',
      headers: { session_token: sessionToken },
      body: {
        komplatRequests: [
          {
            request: '<BS_Request>' +
              '<Version>@{version}</Version>' +
              '<RequestType>Balance</RequestType>' +
              '<ClientId IdType="MS">#{' + cardAccounts[i].cards[0].cardHash + '@[card_number]}</ClientId>' +
              '<AuthClientId IdType="MS">#{' + cardAccounts[i].cards[0].cardHash + '@[card_number]}</AuthClientId>' +
              '<TerminalTime>@{pay_date}</TerminalTime>' +
              '<TerminalId>@{terminal_id_mb}</TerminalId>' +
              '<TerminalCapabilities>' +
              '<BooleanParameter>Y</BooleanParameter>' +
              '<LongParameter>Y</LongParameter>' +
              '<AnyAmount>Y</AnyAmount>' +
              '<ScreenWidth>99</ScreenWidth>' +
              '<CheckWidth DoubleHeightSymbol="Y" DoubleWidthSymbol="N" InverseSymbol="Y">40</CheckWidth>' +
              '</TerminalCapabilities>' +
              '<Balance Currency="' + cardAccounts[i].cards[0].currency + '">' +
              '<AuthorizationDetails Count="1">' +
              '<Parameter Idx="1" Name="Срок действия карточки">#{' + cardAccounts[i].cards[0].cardHash + '@[card_expire]}</Parameter>' +
              '</AuthorizationDetails>' +
              '</Balance></BS_Request>'
          }
        ]
      }
    })
    const balanceXml = parseXml(balanceRes.body.komplatResponse[0].response)
    cardAccounts[i].balance = balanceXml.BS_Response.Balance.Amount
  }

  return cardAccounts
}

export async function fetchTransactions (sessionToken, accounts, fromDate) {
  console.log('>>> Загрузка списка транзакций через минивыписку...')
  const responses = await Promise.all(flatMap(accounts, (account) => {
    // Минивыписки бесплатны на виртуальных карточках, либо на карточках в EUR/USD
    if (account.productType.indexOf('Virtual') > 0 || account.instrument !== 'BYN') {
      return fetchApiJson('payment/simpleExcute', {
        method: 'POST',
        headers: { session_token: sessionToken },
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
      }, response => true)
    }
  }))

  let $, account
  let i = 0
  const transactions = flatMap(responses, response => {
    if (response.body !== undefined) {
      $ = cheerio.load(response.body.komplatResponse[0].response, {
        xmlMode: true
      })
      account = accounts[i++]
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
  const responses = await Promise.all(flatMap(accounts, (account) => {
    return fetchApiJson('products/getCardAccountFullStatement', {
      method: 'POST',
      headers: { session_token: sessionToken },
      body: {
        accountType: account.accountType,
        bankCode: account.bankCode,
        cardHash: account.cardHash,
        currencyCode: account.instrumentCode,
        internalAccountId: account.id,
        reportData: {
          from: fromDate.getTime(),
          till: toDate.getTime()
        },
        rkcCode: account.rkcCode
      }
    }, response => response.body)
  }))

  const operations = flatMap(responses, response => {
    return flatMap(response.body.operations, op => {
      const operationSign = Number.parseInt(op.operationSign)
      return {
        id: op.transactionAuthCode,
        account_id: op.accountNumber,
        operationName: op.operationName,
        operationDate: new Date(op.transactionDate),
        operationCurrencyCode: op.operationCurrency,
        operationAmount: op.operationAmount * operationSign,
        transactionDate: new Date(op.operationDate),
        transactionAmount: op.transactionAmount * operationSign,
        transactionCurrencyCode: op.transactionCurrency,
        merchant: op.operationPlace,
        hold: false
      }
    })
  })

  const filteredOperations = operations.filter(function (op) {
    return op !== undefined && op.operationAmount !== 0 && op.transactionDate >= fromDate
  })

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
