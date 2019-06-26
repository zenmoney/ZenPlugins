import * as network from '../../common/network'
import * as tools from './tools'

const urls = new function () {
  this.baseURL = 'https://api.epayments.com/'
  this.cabinetURL = 'https://my.epayments.com/'

  this.token = this.baseURL + 'token'
  this.userInfo = this.baseURL + 'v1/user'
  this.transactions = this.baseURL + 'v2/Transactions'
}()

const defaultHeaders = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
  'Connection': 'keep-alive',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
}

function getAPIHeaders (tokenType, token) {
  return Object.assign({}, defaultHeaders, {
    'Referer': urls.cabinetURL,
    'Authorization': `${tokenType} ${token}`
  })
}

export async function authenthicate (login, password) {
  async function readCode (message) {
    const otp = await ZenMoney.readLine(message)
    if (!otp) {
      throw new Error('Без OTP-кода не смогу =[')
    } else {
      return otp
    }
  }

  async function fetch (login, password, otp) {
    const authData = {
      grant_type: 'password_otp',
      username: login,
      password: password,
      otpcode: otp
    }

    const authHeaders = Object.assign({}, defaultHeaders, {
      'Referer': urls.cabinetURL,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': 'Basic ZXBheW1lbnRzOm1ZbjZocmtnMElMcXJ0SXA4S1NE'
    })

    const params = {
      method: 'POST',
      headers: authHeaders,
      body: new URLSearchParams(authData).toString(),
      parse: (body) => body === '' ? undefined : JSON.parse(body)
    }

    return network.fetch(urls.token, params)
  }

  async function fetchRetry (login, password, otp) {
    const response = await fetch(login, password, otp)

    if (response.ok) {
      return { tokenType: response.body.token_type, token: response.body.access_token }
    } else {
      const errorCode = response.body ? response.body.error : undefined

      if (errorCode === 'otp_code_required') {
        const otp = await readCode('Введите одноразовый пароль')
        return fetchRetry(login, password, otp)
      } else if (errorCode === 'otp_code_invalid') {
        const otp = await readCode('Одноразовый пароль введен неверно. Попробуйте еще раз')
        return fetchRetry(login, password, otp)
      } else if (errorCode === 'bot_detected') {
        console.error(response)
        throw new Error('Банк заподозрил в вас бота, попробуйте зайти через браузер, потом снова проведите синхронизацию в Zenmoney')
      } else if (errorCode === 'invalid_grant') {
        console.error(response)
        throw new Error('Ваш счет временно заблокирован. Попробуйте войти через час')
      } else {
        console.error('Что-то пошло не так ' + JSON.stringify(response))
        throw new Error('Что-то пошло не так!')
      }
    }
  }

  return fetchRetry(login, password, '')
}

export async function fetchCardsAndWallets (auth) {
  const params = {
    method: 'GET',
    headers: getAPIHeaders(auth.tokenType, auth.token)
  }

  const response = await network.fetchJson(urls.userInfo, params)
  if (!response.ok) {
    const message = 'Ошибка при загрузке информации об аккаунтах! '
    console.error(message + JSON.stringify(response))
    throw new Error(message)
  }

  return {
    cards: response.body.cards,
    wallets: response.body.ewallets
  } // Возвращаем только нужные данные
}

export async function fetchTransactions (auth, fromDate, toDate) {
  async function recursive (params, transactions, toFetch, isFirstPage) {
    const response = await network.fetchJson(urls.transactions, params)

    if (!response.ok) {
      const message = 'Ошибка при загрузке транзакций! '
      console.error(message + JSON.stringify(response))
      throw new Error(message)
    }

    if (isFirstPage || params.body.skip < toFetch) {
      const body = response.body
      body.transactions.forEach(transaction => transactions.push(transaction))

      const newSkip = params.body.skip + params.body.take
      const newToFetch = body.count

      if (newSkip > newToFetch) {
        return transactions
      } else {
        params.body.skip = newSkip
        return recursive(params, transactions, newToFetch, false)
      }
    } else {
      return transactions
    }
  }

  const requestData = {
    from: tools.getTimestamp(fromDate || new Date(0)),
    till: tools.getTimestamp(toDate || new Date()),
    skip: 0,
    take: 10 // Изменение этого числа не меняет ответ сервера
  }

  const params = {
    method: 'POST',
    headers: getAPIHeaders(auth.tokenType, auth.token),
    body: requestData
  }

  return recursive(params, [], 0, true)
}
