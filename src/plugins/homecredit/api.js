import { parseStartDateString } from '../../common/adapters'
import { fetchJson } from '../../common/network'
import _ from 'lodash'

const myCreditUrl = 'https://mob.homecredit.ru/mycredit'
const baseUri = 'https://ib.homecredit.ru/mobile/remoting'
const defaultMyCreditHeaders = {
  '_ver_': '4.3.2',
  '_os_': 1,
  'business_process': 'register',
  'Host': 'mob.homecredit.ru'
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

export async function authMyCredit (preferences) {
  let auth = ZenMoney.getData('auth', null) || {}
  if (!auth || !auth.device || !auth.key || !auth.token || !auth.phone) {
    auth.phone = (preferences.phone || '').trim()
    const result = await registerMyCreditDevice(auth, preferences)
    return result
  }

  console.log('>>> Авторизация [Мой кредит] ========================================================')
  return (await checkUserPin(auth, preferences, registerMyCreditDevice)).auth
}

export async function authBase (deviceId, login, password, code) {
  console.log('>>> Авторизация [Базовый] ======================================================')
  if (!deviceId) {
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
  const response = await fetchApiJson(`${baseUri}/LoginService`, {
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
  let response = await fetchApiJson('Account/Register', {
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
    sanitizeResponseLog: { body: { 'Result': { 'PrivateKey': true } } }
  })

  auth.key = response.body.Result.PrivateKey
  response = await fetchApiJson('Sms/SendSmsCode', {
    API: 4,
    method: 'POST',
    headers: {
      ...defaultMyCreditHeaders,
      'X-Device-Ident': auth.device,
      'X-Private-Key': auth.key,
      'X-Phone-Number': auth.phone
    }
  })

  // подтверждение кодом из СМС
  response = await readSmsCode(auth, "Введите код из СМС для регистрации в приложении 'Мой кредит'")
  if (!response.body.Result.IsUserPinCodeCreated) {
    throw new TemporaryError("Необходимо пройти регистрацию в приложении 'Мой кредит', чтобы установить пин-код для входа")
  }

  const result = await checkUserPin(auth, preferences)

  //  запрос доступа к дебетовым продуктам (LevelUp)
  if (result.response.body.Result.ClientDataResult) {
    const data = result.response.body.Result.ClientDataResult
    if (data.LevelUpAvailable === 0 && (data.HasDC || data.HasDeposits)) {
      await levelUp(auth, data.CodewordOnlyLevelUp)
    } else {
      console.log('>>> LevelUp не требуется')
    }
  }

  return result.auth
}

async function readSmsCode (auth, readlineTitle = 'Введите код из СМС') {
  let response
  let isValidSms = false
  for (let i = 0; i < 3; i++) {
    const code = await ZenMoney.readLine(readlineTitle, {
      time: 120000,
      inputType: 'number'
    })
    if (!code || !code.trim()) { throw new TemporaryError('Получен пустой код') }

    response = await fetchApiJson('Sms/ValidateSmsCode', {
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

    isValidSms = response.body.Result.IsValidSmsCode
    if (isValidSms) { break }

    readlineTitle = 'Код не верен. Попытка #' + (i + 2)
  }

  if (!isValidSms) { throw new TemporaryError("Код не верен. Не удалось зарегистрировать устройство в приложении 'Мой кредит'") }

  return response
}

async function checkUserPin (auth, preferences, onErrorCallback = null) {
  const headers = {
    'X-Device-Ident': auth.device,
    'X-Private-Key': auth.key,
    'X-Phone-Number': auth.phone
  }
  if (auth.token) { headers['X-Auth-Token'] = auth.token }

  let response = await fetchApiJson('Pin/CheckUserPin', {
    API: 4,
    ignoreErrors: !!onErrorCallback,
    headers: {
      ...defaultMyCreditHeaders,
      ...headers
    },
    body: {
      'ClientData': {
        'Location': {
          'Latitude': 0.0,
          'Longitude': 0.0
        }
      },
      'Pin': (preferences.pin || '').trim()
    },
    sanitizeRequestLog: { body: { 'Pin': true } },
    sanitizeResponseLog: { body: { 'Result': { 'ClientDataResult': { 'FirstName': true } } } }
  })

  if (onErrorCallback && response.body.StatusCode !== 200) {
    auth = await onErrorCallback(auth, preferences)
    return {
      auth,
      response
    }
  }

  let isValidPin = response.body.Result.IsPinValid
  if (response.body.Errors) {
    response.body.Errors.forEach(function (error) {
      if (error.indexOf('еверный код') > 0) { isValidPin = false }
    })
  }
  if (!isValidPin) {
    throw new InvalidPreferencesError("Пин-код не верен. Укажите код, заданный вами в приложении банка 'Мой кредит'.")
  }

  console.assert(response.headers['x-auth-token'], 'Не найден токен доступа к банку')
  auth.token = response.headers['x-auth-token']
  ZenMoney.setData('auth', auth)

  return {
    auth,
    response
  }
}

async function levelUp (auth, codewordOnly) {
  console.log('>>> LevelUp для доступа к дебетовым продуктам...')
  const title = codewordOnly
    ? 'Если у вас есть дебетовые счета или депозиты, необходимо ввести кодовое слово. Или оставьте поле пустым, если достаточно загрузки кредитных продуктов.'
    : 'Если у вас есть дебетовые счета или депозиты, необходимо ввести кодовое слово или номер дебетовой карты. Или оставьте поле пустым, если достаточно загрузки кредитных продуктов.'
  const input = await ZenMoney.readLine(title, {
    time: 120000,
    inputType: 'text'
  })
  if (!input) {
    console.log('>>> LevelUp пропущен (введена пустая строка)')
    return
  }

  let response
  if (!codewordOnly && /[\s\d]{16,}/.test(input)) {
    console.log('>>> LevelUp по номеру карты')
    const cardNumber = input.trim().replace(/\s/g, '')
    const expirationDate = await ZenMoney.readLine('Введите срок действия этой карты в формате ММГГ.', {
      time: 120000,
      inputType: 'number'
    })

    response = await fetchApiJson('Client/LevelUp', {
      ignoreErrors: true,
      API: 4,
      headers: {
        ...defaultMyCreditHeaders,
        'X-Auth-Token': auth.token,
        'X-Device-Ident': auth.device,
        'X-Private-Key': auth.key,
        'X-Phone-Number': auth.phone
      },
      body: {
        'CardDataDetail': {
          'CardNumber': cardNumber,
          'ExpirationDate': expirationDate
        }
      },
      sanitizeRequestLog: { body: { 'CardDataDetail': true } }
    })
  } else {
    console.log('>>> LevelUp по кодовому слову')
    response = await fetchApiJson('Client/LevelUp', {
      ignoreErrors: true,
      API: 4,
      headers: {
        ...defaultMyCreditHeaders,
        'X-Auth-Token': auth.token,
        'X-Device-Ident': auth.device,
        'X-Private-Key': auth.key,
        'X-Phone-Number': auth.phone
      },
      body: {
        'CodeWord': input.trim().toUpperCase()
      },
      sanitizeRequestLog: { body: { 'CodeWord': true } }
    })
  }

  console.assert(_.get(response, 'body.Errors'), 'Ошибка авторизации (LevelUp)')
  const error = getErrorMessage(response.body.Errors)
  if (error) {
    throw new InvalidPreferencesError(error)
  } else {
    if (_.get(response.body, 'Result.IsSmsNeeding') === true) {
      await readSmsCode(auth, 'Введите код из СМС для загрузки данных')
    }
  }

  if (_.get(response, 'body.StatusCode') === 200) {
    auth.levelup = true
    console.log('>>> LevelUp: CurrentLevel = ' + _.get(response.body, 'Result.CurrentLevel'))
  }

  return auth
}

export async function fetchBaseAccounts () {
  console.log('>>> Загрузка списка счетов [Базовый] =======================================')
  const response = await fetchApiJson(`${baseUri}/ProductService`, {
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
        const response = await fetchApiJson(`${baseUri}/ProductService`, {
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
  const response = await fetchApiJson('Product/GetClientProducts', {
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

  if (auth.levelup) {
    console.log('>>> Загрузка списка дебетовых продуктов [ MyCredit ] ===================================')

    let response = await fetchApiJson('Transaction/GetApprovalContracts', {
      API: 0,
      headers: {
        ...defaultMyCreditHeaders,
        'X-Device-Ident': auth.device,
        'X-Private-Key': auth.key,
        'X-Phone-Number': auth.phone,
        'X-Auth-Token': auth.token
      },
      body: {
        'ApprovalContractsType': 3
      }
    })

    response = await fetchApiJson('https://api-myc.homecredit.ru/decard/v2/debitcards?useCache=false', {
      method: 'GET',
      headers: {
        ...defaultMyCreditHeaders,
        'Authorization': 'Bearer ' + auth.token,
        'X-Device-Ident': auth.device,
        'X-Private-Key': auth.key,
        'X-Phone-Number': auth.phone,
        'X-Auth-Token': auth.token,
        'Host': 'api-myc.homecredit.ru',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'okhttp/3.6.0'
      }
    })

    if (response.status === 200) {
      if (response.body.debitCards) { fetchedAccounts.debitCards = response.body.debitCards }

      response = await fetchApiJson('https://api-myc.homecredit.ru/deposito/v1/deposits?typeFilter=FIXED&stateFilter=ALL&useCache=false', {
        method: 'GET',
        headers: {
          ...defaultMyCreditHeaders,
          'Authorization': 'Bearer ' + auth.token,
          'X-Device-Ident': auth.device,
          'X-Private-Key': auth.key,
          'X-Phone-Number': auth.phone,
          'X-Auth-Token': auth.token,
          'Host': 'api-myc.homecredit.ru'
        }
      })
      if (response.body.accounts) { fetchedAccounts.accounts = response.body.accounts }
    } else {
      console.log('>>> !!! Не удалось пройти авторизацию. Загрузка дебетовых продуктов пропущена.')
      auth.levelup = false
    }
  }

  // удаляем не нужные счета
  _.forEach(Object.keys(fetchedAccounts), function (key) {
    _.remove(fetchedAccounts[key], function (elem) {
      if ((!elem.ContractStatus || elem.ContractStatus > 1) && // MyCredit
        (!elem.contractStatus || ['ДЕЙСТВУЮЩИЙ', 'ACTIVE'].indexOf(elem.contractStatus.toUpperCase()) < 0) && // MyCredit Debit v2
        (!elem.status || elem.status.toUpperCase() !== 'ACTIVE')) {
        const productName = elem.ProductName || elem.productName
        console.log(`>>> Счёт "${productName}" не активен. Пропускаем...`)
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
      await fetchApiJson('Payment/GetProductDetails', {
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

      const response = await fetchApiJson('https://api-myc.homecredit.ru/api/v1/prepayment', {
        ignoreErrors: true,
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

      // добавим информацию о реальном остатке по кредиту
      if (!response.body || response.status !== 200) {
        console.log('>>> !!! ОСТАТОК НА СЧЕТУ КРЕДИТА НЕ ДОСТУПЕН! В течение нескольких дней после наступления расчётной даты остаток ещё не доступен.')
      } else {
        if (response.body) { account.RepaymentAmount = response.body.repaymentAmount }
      }
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
    const response = await fetchApiJson(`${baseUri}/ProductService`, {
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
    case 'debitCards':
      type = 'debitCards'
      body.accountNumber = accountData.details.accountNumber
      body.cardNumber = accountData.details.cardNumber
      break
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

  const response = await fetchApiJson(`https://ib.homecredit.ru/rest/${type}/transactions`, {
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

async function fetchApiJson (url, options, predicate) {
  if (url.substr(0, 4) !== 'http') {
    const api = options.API ? parseInt(options.API, 10) : 0
    const apiStr = api > 0 ? `/v${api}` : ''
    url = `${myCreditUrl}${apiStr}/api/${url}`
  }
  let response
  const sanitizeHeaders = {
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
    'set-cookie': true
  }
  try {
    response = await fetchJson(url, {
      method: options.method || 'POST',
      ..._.omit(options, ['API']),
      sanitizeRequestLog: {
        ...options.sanitizeRequestLog,
        headers: sanitizeHeaders
      },
      sanitizeResponseLog: {
        ...options.sanitizeResponseLog,
        headers: sanitizeHeaders
      }
    })
  } catch (e) {
    if (!options.ignoreErrors) {
      if (e.response && e.response.status >= 500 && e.response.status < 525) {
        // ToDO: TemporaryError
        throw new Error('Информация из Банка Хоум Кредит временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться несколько дней, откройте Настройки синхронизации и нажмите "Отправить лог последней синхронизации разработчикам".')
      } else {
        throw e
      }
    }
  }
  if (predicate) { validateResponse(response, response => response.body && predicate(response)) }
  if (!options.ignoreErrors && response.body) {
    // ((response.body.StatusCode || response.body.statusCode) && response.body.StatusCode !== 200 && response.body.statusCode !== 200)
    if (response.body.Errors && _.isArray(response.body.Errors) && response.body.Errors.length > 0) {
      const message = getErrorMessage(response.body.Errors)
      if (message) {
        if (/.*(?:повтори\w+ попытк|еще раз|еверн\w+ код|ревышено колич).*/i.test(message)) {
          // ToDO: TemporaryError
          throw new Error(message)
        } else {
          if (message.indexOf('роверьте дату рождения') + 1) {
            throw new InvalidPreferencesError(message)
          } else {
            throw new Error('Ответ банка: ' + message)
          }
        }
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

export function collapseDoubleAccounts (accountsData) {
  // объединим одинаковые карты
  let count = accountsData.length
  let result = _.values(_.map(_.groupBy(accountsData, 'account.id'), function (vals) {
    const result = vals[0]
    for (let i = 1; i < vals.length; i++) {
      if (vals[i].account.syncID) { result.account.syncID = _.union(result.account.syncID, vals[i].account.syncID) }
    }
    return result
  }))
  if (count !== result.length) { console.log(`>>> Объединение карт одного счёта: ${count - result.length} шт`) }

  // объединим карты со счетами
  count = result.length
  result = _.union(
    _.filter(result, item => item.details.type === 'CreditLoan'), // кредиты оставляем как есть, чтобы считать их отдельно
    _.values(_.map(_.groupBy(_.filter(result, item => item.details.type !== 'CreditLoan'), 'details.accountNumber'), vals => vals[0]))
  )
  if (count !== result.length) { console.log(`>>> Объединение карт со счетами: ${count - result.length} шт`) }

  return result
}
