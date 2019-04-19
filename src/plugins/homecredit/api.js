import { parseStartDateString } from '../../common/adapters'
import * as Network from '../../common/network'
import _ from 'lodash'

const myCreditUrl = 'https://mob.homecredit.ru/mycredit'
const baseUri = 'https://ib.homecredit.ru/mobile/remoting'
const defaultMyCreditHeaders = {
  '_ver_': '3.10.0',
  '_os_': 1,
  'business_process': 'register'
}
const defaultBaseHeaders = {
  'Host': 'ib.homecredit.ru',
  'User-Agent': 'okhttp/3.10.0',
  'Content-Type': 'application/json; charset=utf-8'
}
const defaultArgumentsForAuth = {
  'appVersion': '3.2.1',
  'javaClass': 'cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UsernamePasswordCredentialMo',
  'system': 'Android',
  'systemVersion': '5.1.1'
}

let myCreditAuth // авторизация в "Мой кредит"
export async function authMyCredit (preferences) {
  if (myCreditAuth) return myCreditAuth

  const auth = ZenMoney.getData('auth', null) || {}
  if (!auth || !auth.device || !auth.key || !auth.token || !auth.phone) {
    auth.phone = (preferences.phone || '').trim()
    return registerMyCreditDevice(auth, preferences)
  }

  console.log('>>> Авторизация [Мой кредит] ========================================================')
  let response = await fetchJson('Pin/CheckUserPin', {
    API: 4,
    ignoreErrors: true,
    headers: {
      ...defaultMyCreditHeaders,
      'X-Device-Ident': auth.device,
      'X-Private-Key': auth.key,
      'X-Phone-Number': auth.phone,
      'X-Auth-Token': auth.token
    },
    body: {
      'Pin': (preferences.pin || '').trim()
    },
    sanitizeRequestLog: { body: { 'Pin': true } }
  })

  if (response.body.StatusCode !== 200) {
    console.log('Нужна повторная регистрация.')
    registerMyCreditDevice(auth, preferences)
    return
  }

  const isValidPin = response.body.Result.IsPinValid
  if (!isValidPin) { throw new InvalidPreferencesError("Пин-код не верен. Укажите код, заданный вами в приложении банка 'Мой кредит'.") }

  auth.token = response.headers['x-auth-token']
  ZenMoney.setData('auth', auth)
  myCreditAuth = auth
  return myCreditAuth
}

export async function authBase (deviceId, login, password, code) {
  console.log('>>> Авторизация [Базовый] ======================================================')
  // let isNewDevice = false
  if (!deviceId) {
    // isNewDevice = true
    deviceId = getDeviceId()
  }

  const args = {
    ...defaultArgumentsForAuth,
    'deviceID': deviceId,
    'password': password,
    'username': login
  }
  if (code) {
    args.code = code
  }
  const response = await fetchJson(`${baseUri}/LoginService`, {
    log: true,
    method: 'POST',
    body: {
      'arguments': [ args ],
      'javaClass': 'org.springframework.remoting.support.RemoteInvocation',
      'methodName': 'login',
      'parameterTypes': ['cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UsernamePasswordCredentialMo']
    },
    headers: defaultBaseHeaders,
    sanitizeRequestLog: { body: { arguments: { 'deviceID': true, 'username': true, 'password': true } } }
  })

  // ERROR_LOGIN, BLOCK_USER_CODE
  if (!response.body.success) {
    throw new InvalidPreferencesError("Не удалось авторизоваться. Пожалуйста, проверьте включён ли у вас доступ в приложении 'Банк Хоум Кредит' и корректно укажите первые 2 параметра подключения (или удалите их, чтобы не использвоать этот способ входа).")
  }

  return deviceId
}

async function registerMyCreditDevice (auth, preferences) {
  const date = getFormatedDate(preferences.birth)
  if (!date) { throw new InvalidPreferencesError("Параметр подключения 'День рождения' указан не верно") }

  console.log('>>> Регистрация устройства [Мой кредит] ===============================================')
  auth.device = getDeviceId()
  let response = await fetchJson('Account/Register', {
    API: 4,
    headers: {
      ...defaultMyCreditHeaders,
      'X-Device-Ident': auth.device
    },
    body: {
      'BirthDate': date,
      'DeviceName': 'Zenmoney',
      'OsType': 1,
      'PhoneNumber': auth.phone,
      'ScreenSizeType': 4
    },
    sanitizeRequestLog: { body: { 'BirthDate': true, 'PhoneNumber': true } },
    sanitizeResponseLog: { body: { Result: true } }
  })

  auth.key = response.body.Result.PrivateKey
  response = await fetchJson('Sms/SendSmsCode', {
    API: 4,
    method: 'POST',
    headers: {
      ...defaultMyCreditHeaders,
      'X-Device-Ident': auth.device,
      'X-Private-Key': auth.key,
      'X-Phone-Number': auth.phone
    }
  })

  let isPinCreated
  let isValidSms
  let readlineTitle = "Введите пароль из СМС для регистрации в приложении 'Мой кредит'"
  for (let i = 0; i < 3; i++) {
    const code = await ZenMoney.readLine(readlineTitle, {
      time: 120000,
      inputType: 'number'
    })
    if (!code || !code.trim()) { throw new TemporaryError('Получен пустой пароль') }

    response = await fetchJson('Sms/ValidateSmsCode', {
      API: 4,
      headers: {
        ...defaultMyCreditHeaders,
        'X-Device-Ident': auth.device,
        'X-Private-Key': auth.key,
        'X-Phone-Number': auth.phone
      },
      body: {
        'SmsCode': code
      },
      sanitizeRequestLog: { body: { 'SmsCode': true } }
    })

    isPinCreated = response.body.Result.IsUserPinCodeCreated
    isValidSms = response.body.Result.IsValidSmsCode
    if (isValidSms) { break }

    readlineTitle = 'Пароль не верен. Попытка #' + (i + 2)
  }
  if (!isValidSms) { throw new TemporaryError("Пароль не верен. Не удалось зарегистрировать устройство в приложении 'Мой кредит'") }
  if (!isPinCreated) { throw new TemporaryError("Необходимо пройти регистрацию в приложении 'Мой кредит', чтобы установить пин-код для входа") }

  response = await fetchJson('Pin/CheckUserPin', {
    API: 4,
    headers: {
      ...defaultMyCreditHeaders,
      'X-Device-Ident': auth.device,
      'X-Private-Key': auth.key,
      'X-Phone-Number': auth.phone
    },
    body: {
      'Pin': (preferences.pin || '').trim()
    },
    sanitizeRequestLog: { body: { 'Pin': true } }
  })
  const isValidPin = response.body.Result.IsPinValid
  if (!isValidPin) { throw new TemporaryError("Пин-код не верен. Укажите код, заданный вами в приложении 'Мой кредит'.") }
  auth.token = response.headers['x-auth-token']

  /* const codeDebet = await ZenMoney.readLine("Введите кодовое слово для загрузки дебетовых продуктов через приложение 'Мой кредит'. Или пустое значение, если дебетовые продукты загружать не нужно.", {
    time: 120000,
    inputType: 'password'
  })
  response = await fetchJson('Client/LevelUp', {
    API: 4,
    headers: {
      ...defaultMyCreditHeaders,
      'X-Auth-Token': auth.token,
      'X-Device-Ident': auth.device,
      'X-Private-Key': auth.key,
      'X-Phone-Number': auth.phone
    },
    body: {
      'CodeWord': '' // codeDebet.trim().upperCase()
    },
    sanitizeRequestLog: { body: { 'CodeWord': true } }
  })
  auth.token = response.headers['x-auth-token'] */

  ZenMoney.setData('auth', auth)
  return auth
}

export async function fetchBaseAccounts () {
  console.log('>>> Загрузка списка счетов [Базовый] =======================================')
  const response = await fetchJson(`${baseUri}/ProductService`, {
    log: true,
    method: 'POST',
    body: {
      'arguments': [],
      'javaClass': 'org.springframework.remoting.support.RemoteInvocation',
      'methodName': 'getAllProducts',
      'parameterTypes': []
    },
    headers: defaultBaseHeaders
  })

  // отфильтруем лишние и не рабочие счета
  const fetchedAccounts = {};
  ['creditCards', 'debitCards', 'merchantCards', 'credits', 'deposits'].forEach(function (key) {
    if (!response.body.hasOwnProperty(key) || !response.body[key].list || response.body[key].list.length === 0) return
    const list = []
    response.body[key].list.forEach(function (elem) {
      if (_.includes(['Действующий', 'Active'], elem.contractStatus) === false) {
        console.log(`>>> Счёт '${elem.productName}' не активен. Пропускаем...`)
        return
      }
      if (ZenMoney.isAccountSkipped(elem.contractNumber)) {
        console.log(`>>> Счёт "${elem.productName}" в списке игнорируемых. Пропускаем...`)
        return
      }
      list.push(elem)
    })
    if (list.length === 0) return
    fetchedAccounts[key] = list
  })

  // догрузим подробную информацию по каждому счёту
  await Promise.all(['creditCards', 'debitCards', 'merchantCards', 'credits', 'deposits'].map(async type => {
    if (!fetchedAccounts.hasOwnProperty(type)) return
    await Promise.all(fetchedAccounts[type].map(async account => {
      let methodName
      let filterMo
      const additionalArguments = {}
      switch (type) {
        case 'creditCards':
          filterMo = 'CreditCardFilterMo'
          methodName = 'getCreditCardDetails'
          break
        case 'debitCards':
          filterMo = 'DebitCardFilterMo'
          methodName = 'getDebitCardDetails'
          break
        case 'credits':
          filterMo = 'CreditFilterMo'
          methodName = 'getCreditDetails'
          break
        case 'merchantCards':
          additionalArguments.cardMBR = 0
          filterMo = 'MerchantCardFilterMo'
          methodName = 'getMerchantCardDetails'
          break
        case 'deposits':
          filterMo = 'DepositFilterMo'
          methodName = 'getDepositDetails'
          break
        default:
          methodName = null
          break
      }
      if (methodName) {
        console.log(`>>> Загрузка деталей '${account.productName}' (${getCardNumber(account.cardNumber)}) [Базовый] --------------------`)
        const response = await fetchJson(`${baseUri}/ProductService`, {
          log: true,
          method: 'POST',
          body: {
            'arguments': [
              {
                ...additionalArguments,
                'cardNumber': account.cardNumber,
                'contractNumber': account.contractNumber,
                'javaClass': 'cz.bsc.g6.components.product.json.services.api.mo.' + filterMo
              }
            ],
            'javaClass': 'org.springframework.remoting.support.RemoteInvocation',
            'methodName': methodName,
            'parameterTypes': ['cz.bsc.g6.components.product.json.services.api.mo.' + filterMo]
          },
          headers: defaultBaseHeaders
        })

        if (response.body.creditLimit || response.body.overdraftLimit) account.creditLimit = response.body.creditLimit || response.body.overdraftLimit
        if (response.body.accountNumber) account.accountNumber = response.body.accountNumber
      }
    }))
  }))

  return fetchedAccounts
}

// загрузка списка счетов в "Мой кредит"
export async function fetchMyCreditAccounts (auth) {
  console.log('>>> Загрузка списка счетов [Мой кредит] =========================================')
  const response = await fetchJson('Product/GetClientProducts', {
    API: 0,
    headers: {
      ...defaultMyCreditHeaders,
      'X-Device-Ident': auth.device,
      'X-Private-Key': auth.key,
      'X-Phone-Number': auth.phone,
      'X-Auth-Token': auth.token
    },
    body: {
      'ReturnCachedData': true
    }
  })

  const fetchedAccounts = _.pick(response.body.Result, ['CreditCard', 'CreditCardTW', 'CreditLoan'])

  // удаляем не нужные счета
  _.forEach(Object.keys(fetchedAccounts), function (key) {
    _.remove(fetchedAccounts[key], function (elem) {
      if (elem.ContractStatus > 1) {
        console.log(`>>> Счёт "${elem.ProductName}" не активен. Пропускаем...`)
        return true
      }
      if (ZenMoney.isAccountSkipped(elem.ContractNumber)) {
        console.log(`>>> Счёт "${elem.ProductName}" в списке игнорируемых. Пропускаем...`)
        return true
      }
      return false
    })
  })

  // догрузим информацию по кредитам из "Мой Кредит"
  if (fetchedAccounts.CreditLoan && fetchedAccounts.CreditLoan.length > 0) {
    await Promise.all(Object.keys(fetchedAccounts.CreditLoan).map(async key => {
      const account = fetchedAccounts.CreditLoan[key]

      console.log(`>>> Загрузка информации по кредиту '${account.ProductName}' (${account.AccountNumber}) [Мой кредит] --------`)
      await fetchJson('Payment/GetProductDetails', {
        headers: {
          ...defaultMyCreditHeaders,
          'X-Device-Ident': auth.device,
          'X-Private-Key': auth.key,
          'X-Phone-Number': auth.phone,
          'X-Auth-Token': auth.token
        },
        body: {
          ContractNumber: account.ContractNumber,
          AccountNumber: account.AccountNumber,
          ProductSetCode: account.ProductSet.Code,
          ProductType: account.ProductType
        }
      })

      const response = await fetchJson('https://api-myc.homecredit.ru/api/v1/prepayment', {
        headers: {
          ...defaultMyCreditHeaders,
          'X-Device-Ident': auth.device,
          'X-Private-Key': auth.key,
          'X-Phone-Number': auth.phone,
          'X-Auth-Token': auth.token
        },
        body: {
          'contractNumber': account.ContractNumber,
          'selectedPrepayment': 'LoanBalance',
          'isEarlyRepayment': 'False',
          'isSingleContract': 'True'
        }
      })

      // добавим информацию о реалном остатке по кредиту
      if (!response.body) { console.log('>>> ОСТАТОК НА СЧЕТУ КРЕДИТА НЕ ДОСТУПЕН! В течение нескольких дней после наступления расчётной даты остаток ещё не доступен.') } else if (response.body.statusCode === 200) { account.RepaymentAmount = response.body.repaymentAmount }
    }))
  }

  return fetchedAccounts
}

export async function fetchBaseTransactions (accountData, type, fromDate, toDate = null) {
  console.log(`>>> Загружаем список операций '${accountData.details.title}' (${getCardNumber(accountData.details.cardNumber) || accountData.details.accountNumber}) [Базовый] ========================`)
  const listCount = 25
  let listStartPosition = 0

  let transactions = []

  let methodName
  let filterMo
  switch (type) {
    case 'creditCards':
      methodName = 'getCreditCardTransactions'
      filterMo = 'CreditCardTransactionsFilterMo'
      break
    case 'merchantCards':
    case 'debitCards':
      methodName = 'getDebitCardTransactions'
      filterMo = 'DebitCardTransactionsFilterMo'
      break
    case 'credits':
      methodName = 'getCreditTransactions'
      filterMo = 'CreditTransactionsFilterMo'
      break
    default:
      methodName = null
      break
  }
  if (!methodName) {
    console.log(`>>> Загрузка операций для счёта с типом '${type}' не реализована! Пропускаем.`)
    return []
  }

  let from = getDate(fromDate || (fromDate.setDate(fromDate.getDate() - 7))).getTime()
  let to = getDate(toDate || new Date()).getTime()
  while (true) {
    const response = await fetchJson(`${baseUri}/ProductService`, {
      log: true,
      method: 'POST',
      body: {
        'arguments': [{
          'accountNumber': accountData.details.accountNumber,
          'cardNumber': accountData.details.cardNumber,
          'contractNumber': accountData.details.contractNumber,
          'count': listCount,
          'fromDate': {
            'javaClass': 'java.util.Date',
            'time': from
          },
          'isSort': 'false',
          'startPosition': listStartPosition,
          'toDate': {
            'javaClass': 'java.util.Date',
            'time': to
          },
          'javaClass': 'cz.bsc.g6.components.product.json.services.api.mo.' + filterMo
        }],
        'javaClass': 'org.springframework.remoting.support.RemoteInvocation',
        'methodName': methodName,
        'parameterTypes': ['cz.bsc.g6.components.product.json.services.api.mo.' + filterMo]
      },
      headers: defaultBaseHeaders
    })

    let list
    switch (type) {
      case 'creditCards':
        list = response.body.creditCardTransactions.list
        break
      case 'merchantCards':
      case 'debitCards':
        list = response.body.debitCardTransactions.list
        break
      case 'credits':
        list = response.body.creditTransactions.list
        break
      default:
        list = null
        break
    }

    if (list) {
      list.forEach((i) => {
        if (i.valueDate.time >= from) { transactions.push(i) }
      })
      if (list.length < listCount) break
    } else { break }

    listStartPosition += listCount
  }

  return transactions
}

export async function fetchMyCreditTransactions (auth, accountData, fromDate, toDate = null) {
  console.log(`>>> Загружаем список операций '${accountData.details.title}' (${accountData.details.accountNumber}) [Мой кредит] ========================`)

  let type
  const body = {
    'accountNumber': accountData.details.accountNumber,
    'cardNumber': accountData.details.cardNumber,
    'count': 0,
    'fromDate': getFormatedDate(fromDate || (fromDate.setDate(fromDate.getDate() - 7))),
    'isSort': false,
    'startPosition': 0,
    'toDate': getFormatedDate(toDate || new Date())
  }

  switch (accountData.details.type) {
    case 'CreditCard':
      type = 'creditCards'
      body.contractNumber = accountData.details.contractNumber
      break
    case 'CreditCardTW':
      type = 'merchantCards'
      break
    default:
      break
  }
  if (!type) {
    console.log(`>>> Загрузка операций для счёта с типом '${type}' не реализована! Пропускаем.`)
    return []
  }

  const response = await fetchJson(`https://ib.homecredit.ru/rest/${type}/transactions`, {
    ignoreErrors: true,
    headers: {
      ...defaultMyCreditHeaders,
      'Authorization': 'Bearer ' + auth.token,
      'Host': 'ib.homecredit.ru',
      'X-Device-Ident': auth.device,
      'X-Private-Key': auth.key,
      'X-Phone-Number': auth.phone,
      'X-Auth-Token': auth.token
    },
    body: body
  })
  return response.body.values
}

async function fetchJson (url, options, predicate) {
  if (url.substr(0, 4) !== 'http') {
    const api = options.API ? parseInt(options.API, 10) : 0
    const apiStr = api > 0 ? `/v${api}` : ''
    url = `${myCreditUrl}${apiStr}/api/${url}`
  }
  let response
  try {
    response = await Network.fetchJson(url, {
      method: options.method || 'POST',
      ..._.omit(options, ['API']),
      sanitizeRequestLog: {
        'Authorization': true,
        'authorization': true,
        'X-Device-Ident': true,
        'x-device-ident': true,
        'X-Private-Key': true,
        'x-private-key': true,
        'X-Phone-Number': true,
        'x-phone-number': true,
        'X-Auth-Token': true,
        'x-auth-token': true,
        'set-cookie': true,
        ...options.sanitizeRequestLog
      },
      sanitizeResponseLog: {
        'X-Auth-Token': true,
        'x-auth-token': true,
        'set-cookie': true,
        ...options.sanitizeResponseLog
      }
    })
  } catch (e) {
    if (e.response && e.response.status >= 500 && e.response.status < 525) {
      throw new TemporaryError('Информация из Банка Хоум Кредит временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться несколько дней, откройте Настройки синхронизации и нажмите "Отправить лог последней синхронизации разработчикам".')
    } else {
      throw e
    }
  }
  if (predicate) { validateResponse(response, response => response.body && predicate(response)) }
  if (!options.ignoreErrors && response.body) {
    // ((response.body.StatusCode || response.body.statusCode) && response.body.StatusCode !== 200 && response.body.statusCode !== 200)
    if (response.body.Errors && _.isArray(response.body.Errors) && response.body.Errors.length > 0) {
      const message = getErrorMessage(response.body.Errors)
      if (message) {
        if (message.indexOf('повторите попытку') + 1 || message.indexOf('еще раз') + 1) { throw new TemporaryError(message) } else if (message.indexOf('роверьте дату рождения') + 1) { throw new InvalidPreferencesError(message) } else { throw new Error('Ответ банка: ' + message) }
      }
    } else if (response.body.success === false) {
      const message = response.body.errorResponseMo.errorMsg
      if (message && message.indexOf('No entity found') + 1) { throw new InvalidPreferencesError('Авторизация не прошла. Пожалуйста, проверьте корректность параметров подключения.') }
    }
  }
  return response
}

function validateResponse (response, predicate, message) {
  console.assert(!predicate || predicate(response), message || 'non-successful response')
}

function getErrorMessage (errors) {
  if (!errors || !_.isArray(errors) || errors.length === 0) { return '' }

  let message = errors[0]
  errors.forEach(function (value) {
    if (value.indexOf('повторите') < 0) message = value
  })
  return message
}

function getDate (date) {
  return typeof date === 'string' ? parseStartDateString(date) : date
}

function getFormatedDate (date) {
  const dt = getDate(date)
  return isValidDate(dt) ? dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2) : null
}

function isValidDate (d) {
  return d && d instanceof Date && !isNaN(d)
}

function getDeviceId () {
  function chr8 () {
    return Math.random().toString(16).slice(-8)
  }
  return chr8() + chr8()
}

export function getCardNumber (number) {
  if (typeof number !== 'string' || number.length % 4 !== 0) { return number }

  let result = ''
  for (let i = 0; i < number.length / 4; i++) { result += number.substr(i * 4, 4) + ' ' }

  return result.trim()
}
