import { fetchJson } from '../../common/network'
import { generateUUID } from '../../common/utils'
import { parseXml } from '../../common/xmlUtils'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryUnavailableError, UserInteractionError } from '../../errors'

const host = 'ibank.belapb.by:4443'

export function generateAuth () {
  return {
    deviceUDID: generateUUID().replace('-', '')
  }
}

function getCommonHeaders () {
  return {
    Language: 'en',
    'Accept-Encoding': 'gzip',
    'User-Agent': 'OkHttp Headers.java'
  }
}

async function fetchApiJson (url, options = {}) {
  const response = await fetchJson(url, {
    ...options,
    headers: {
      ...getCommonHeaders(),
      ...options.headers
    }
  })
  if (response.body?.errorInfo?.errorText?.match(/Сервер.*недоступен/i)) {
    throw new TemporaryUnavailableError()
  }
  return response
}

async function fetchLogin (login, password, auth, smsCode) {
  return await fetchApiJson(`https://${host}/services/v2/session/login`, {
    method: 'POST',
    body: {
      login,
      password,
      deviceUDID: auth.deviceUDID,
      applicID: '3.42',
      clientKind: '0',
      platform: ZenMoney.application?.platform || 'Android',
      platformVersion: '8.0.0',
      browser: ZenMoney.device.model, // 'generic_x86',
      browserVersion: ZenMoney.device.model, // 'Android SDK built for x86 (sdk_phone_x86)'
      ...smsCode && { confirmationData: smsCode }
    },
    sanitizeRequestLog: { body: { login: true, password: true, deviceUDID: true } }
  })
}

async function doLogin (login, password, auth) {
  let loginResponse = await fetchLogin(login, password, auth)
  if (loginResponse.body.errorInfo.error !== '0') {
    if (loginResponse.body.errorInfo.errorText.match(/Неверный логин или пароль/i)) {
      throw new InvalidLoginOrPasswordError()
    }
    if (loginResponse.body.errorInfo.errorText.match(/is currently suspended/i)) {
      throw new BankMessageError(loginResponse.body.errorInfo.errorText) // Может написать по-русски?
    }
    if (loginResponse.body.errorInfo.errorText.match(/попробуйте еще раз/i)) {
      throw new BankMessageError(loginResponse.body.errorInfo.errorText)
    }
    if (loginResponse.body.errorInfo.error === '10415') {
      const smsCode = await ZenMoney.readLine('Введите код из СМС', { inputType: 'number' })
      loginResponse = await fetchLogin(login, password, auth, smsCode)
      if (loginResponse.body.errorInfo.error === '10025') {
        throw new InvalidOtpCodeError()
      }
    } else {
      console.assert(false, 'Unexpected status of server response to the login init')
    }
  }
  return loginResponse.body.sessionToken
}

async function getClient (auth) {
  const response = await fetchApiJson(`https://${host}/services/v2/user/getclient`, {
    method: 'POST',
    headers: {
      Session_Token: auth.sessionToken
    },
    body: {},
    sanitizeRequestLog: { headers: { session_token: true } },
    sanitizeResponseLog: {
      body: {
        user: {
          LOGIN_NAME: true,
          LAST_NAME: true,
          CIF: true,
          RNC: true,
          EXTERNAL_RNC: true,
          PASSPORT_NUMBER: true,
          MOBILE_PHONE: true,
          LAT_FIRST_NAME: true,
          LAT_LAST_NAME: true,
          CODE_WORD: true
        }
      }
    }
  })
  console.assert(response.body.errorInfo.error === '0', 'Server returned error on getClient request')
  if (response.body.user.EXTRA_AUTH?.sent === '1') {
    const code = await ZenMoney.readLine('Введите код из SMS')
    if (!code || code.length === 0) {
      throw new UserInteractionError()
    }
    return {
      ...auth,
      extraAuth: code.replace(/^\s+/, '').replace(/\s+$/, '')
    }
  }
  return auth
}

export async function login ({ login, password }, auth) {
  console.log(auth)

  const newAuth = {
    ...auth,
    extraAuth: null,
    sessionToken: (await doLogin(login, password, auth))
  }
  return getClient(newAuth)
}

export async function fetchAccounts (auth) {
  const response = await fetchApiJson(`https://${host}/services/v2/products/getUserAccountsOverview`, {
    method: 'POST',
    headers: {
      Session_Token: auth.sessionToken,
      ...auth.extraAuth
        ? {
            Extraauth: auth.extraAuth
          }
        : {}
    },
    body: {
      depositAccount: {},
      currentAccount: {},
      creditAccount: {},
      cardAccount: {
        withBalance: 'null'
      }
    },
    sanitizeRequestLog: { headers: { session_token: true, extraAuth: true } }
  })
  if (response.body.errorInfo.error !== '0') {
    if ([
      /The code does not match the code specified in the SMS/i,
      /SMS code not set/i
    ].some(regex => regex.test(response.body.errorInfo.errorText))) {
      throw new InvalidOtpCodeError()
    }
    console.assert(false, 'Server returned error for getUserAccountsOverview request')
  }
  if (response.body.overviewResponse.cardAccount) {
    for (const cardAccount of response.body.overviewResponse.cardAccount) {
      for (const card of cardAccount.cards) {
        const balanceResponse = await fetchApiJson(`https://${host}/services/v2/payment/simpleExcute`, {
          method: 'POST',
          headers: {
            Session_Token: auth.sessionToken
          },
          body: {
            komplatRequests: [
              {
                request: `<BS_Request>\n                       <Version>@{version}</Version>\n                       <RequestType>Balance</RequestType>\n                       <ClientId IdType="MS">#{${card.cardHash}@[card_number]}</ClientId>\n                       <AuthClientId IdType="MS">#{${card.cardHash}@[card_number]}</AuthClientId>\n                       <TerminalTime>@{pay_date}</TerminalTime>\n                       <TerminalId>@{terminal_id_mb}</TerminalId>\n                       <TerminalCapabilities>\n                       <BooleanParameter>Y</BooleanParameter>\n                       <LongParameter>Y</LongParameter>\n                       <AnyAmount>Y</AnyAmount>\n                       <ScreenWidth>99</ScreenWidth>\n                       <CheckWidth DoubleHeightSymbol="Y" DoubleWidthSymbol="N" InverseSymbol="Y">40</CheckWidth>\n                       </TerminalCapabilities>\n                       <Balance Currency="${card.currency}">\n                       <AuthorizationDetails Count="1">\n                       <Parameter Idx="1" Name="Срок действия карточки">#{${card.cardHash}@[card_expire]}</Parameter>\n                       </AuthorizationDetails>\n                       </Balance>\n                       </BS_Request>`
              }
            ]
          },
          sanitizeRequestLog: { headers: { session_token: true } }
        })
        if (!balanceResponse.body.errorInfo?.errorText?.match(/Successfully/i)) {
          if ([
            /НЕТ РАЗРЕШЕНИЯ/i,
            /КАРТА ПРОСРОЧЕНА/i
          ].some(regex => regex.test(balanceResponse.body.errorInfo.errorText))) {
            card.balance = null
            continue
          }
          console.assert(false, 'Unknown error', balanceResponse.body.errorInfo.errorText)
        }
        card.balance = parseXml(balanceResponse.body.komplatResponse[0].response).BS_Response.Balance.Amount
      }
    }
  }
  return {
    cards: response.body.overviewResponse.cardAccount || [],
    deposits: response.body.overviewResponse.depositAccount || [],
    current: response.body.overviewResponse.currentAccount || [],
    loans: response.body.overviewResponse.creditAccount || []
  }
}

function getTillTime (toDate) {
  // like in app
  const result = new Date(toDate)
  result.setHours(23)
  result.setMinutes(59)
  result.setSeconds(59)
  result.setMilliseconds(999)
  return result.getTime()
}

function generateAccountTransactionBody (mainProduct, fromDate, toDate) {
  return {
    accountType: mainProduct.accountType,
    bankCode: mainProduct.bankCode,
    currencyCode: mainProduct.currencyCode,
    internalAccountId: mainProduct.internalAccountId,
    reportData: {
      from: fromDate.getTime(),
      till: getTillTime(toDate)
    },
    rkcCode: mainProduct.rkcCode
  }
}

async function fetchAccountTransactions (urlPart, auth, mainProduct, fromDate, toDate, body) {
  const response = await fetchApiJson(`https://${host}/services/v2/products/${urlPart}`, {
    method: 'POST',
    headers: {
      Session_Token: auth.sessionToken
    },
    body: {
      ...body,
      ...generateAccountTransactionBody(mainProduct, fromDate, toDate)
    },
    sanitizeRequestLog: {
      headers: { session_token: true }
    }
  })
  return response.body.operations || []
}

export async function fetchTransactions (auth, mainProduct, fromDate, toDate) {
  const transactions = []
  switch (mainProduct.type) {
    case 'card':
      for (const cardHash of mainProduct.carsdHashes) {
        transactions.push(...(await fetchAccountTransactions('getCardWithCardAccountStatement', auth, mainProduct, fromDate, toDate, { cardHash })))
      }
      break
    case 'deposit':
      transactions.push(...(await fetchAccountTransactions('getDepositAccountStatement', auth, mainProduct, fromDate, toDate, {})))
      break
    case 'credit':
      transactions.push(...(await fetchAccountTransactions('getCreditAccountStatement', auth, mainProduct, fromDate, toDate, {})))
      break
    // case 'current':
    //   console.assert(false, 'Don\'t know how to fetch current account')
    //   break
  }
  return transactions
}
