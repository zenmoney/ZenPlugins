import * as _ from 'lodash'
import * as network from '../../common/network'
import * as tools from './tools'
import { retry } from '../../common/retry'
import * as errors from '../../errors'
import { stringify } from 'querystring'

const urls = new function () {
  this.baseURL = 'https://api.epayments.com/'

  this.token = this.baseURL + 'token'
  this.sessionConfirmation = this.baseURL + 'v1/confirmation-sessions'
  this.userInfo = this.baseURL + 'v1/user'
  this.transactions = this.baseURL + 'v3/Transactions'
}()

const defaultHeaders = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
  'Connection': 'keep-alive',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
  'Referer': 'https://my.epayments.com/'
}

function getAPIHeaders (tokenType, token) {
  return Object.assign({}, defaultHeaders, {
    'Authorization': `${tokenType} ${token}`
  })
}

export async function authenthicate (login, password) {
  async function readCode (message) {
    const otp = await ZenMoney.readLine(message, { inputType: 'number' })
    if (!otp) {
      throw new errors.InvalidOtpCodeError()
    } else {
      return otp
    }
  }

  async function fetch (login, password, otp, sessionId) {
    const base = {
      grant_type: 'password_otp',
      username: login,
      password: password
    }

    const authData = Object.assign({}, base,
      otp ? { otpcode: otp } : null,
      sessionId ? { confirmation_session_id: sessionId } : null
    )

    const authHeaders = Object.assign({}, defaultHeaders, {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': 'Basic ZXBheW1lbnRzOm1ZbjZocmtnMElMcXJ0SXA4S1NE'
    })

    const params = {
      method: 'POST',
      headers: authHeaders,
      body: authData,
      stringify,
      parse: (body) => body === '' ? undefined : JSON.parse(body),
      sanitizeRequestLog: { body: { username: true, password: true } }
    }

    return network.fetch(urls.token, params)
  }

  async function awaitSCA (sessionId) {
    const headers = Object.assign({}, defaultHeaders, {
      'Authorization': 'Basic ZXBheW1lbnRzOm1ZbjZocmtnMElMcXJ0SXA4S1NE'
    })

    const params = {
      method: 'GET',
      headers: headers,
      stringify,
      parse: (body) => body === '' ? undefined : JSON.parse(body)
    }
    const url = `${urls.sessionConfirmation}/${sessionId}`

    const response = await retry({
      getter: () => network.fetch(url, params),
      predicate: response => (response.body && (response.body.canContinueConfirmation === true || response.body.errorCode !== 0)),
      maxAttempts: 60,
      delayMs: 3000,
      log: false
    })

    if (response.status === 200 && _.get(response, 'body.errorCode', -1) === 0) {
      return true
    } else {
      const checkArray = (input) => { return Array.isArray(input) && input.length > 0 }

      const additionalInfo = Object.assign({ status: response.status },
        _.get(response, 'body.errorCode', -1) > 0 ? { errorCode: response.body.errorCode } : null,
        checkArray(_.get(response, 'body.errorMsgs', [])) ? { errorMsgs: response.body.errorMsgs } : null,
        (response.status !== 200 && response.body) ? { body: response.body } : null
      )

      console.error('confirmation-session non-200 code', additionalInfo)
      throw new errors.ZPAPIError('Неизвестная ошибка! Отправьте лог разработчикам!', false, false)
    }
  }

  async function fetchRetry (login, password, otp, sessionId) {
    const response = await fetch(login, password, otp, sessionId)

    if (response.status === 200) {
      return { tokenType: response.body.token_type, token: response.body.access_token }
    } else {
      const errorCode = _.get(response, 'body.error', '')
      const type2Fa = _.get(response, 'body.type_2fa', '')
      const sessionId = _.get(response, 'body.confirmation_session_id', '')

      if (errorCode === 'otp_code_required' && type2Fa === 'StrongCustomerAuthenticator') {
        const device = _.get(response, 'body.send_to', '<undefined>')
        console.debug(`Ожидаю подтверждения с девайса ${device}...`)

        await awaitSCA(sessionId)
        return fetchRetry(login, password, undefined, sessionId)
      } else if (errorCode === 'otp_code_invalid' && type2Fa === 'StrongCustomerAuthenticator') {
        console.debug(`Сессия ${sessionId} истекла, пробуем еще раз...`)
        return fetchRetry(login, password, undefined, undefined)
      } else if (errorCode === 'otp_code_required') {
        const otp = await readCode('Введите одноразовый пароль')
        return fetchRetry(login, password, otp)
      } else if (errorCode === 'otp_code_invalid') {
        const otp = await readCode('Одноразовый пароль введен неверно. Попробуйте еще раз')
        return fetchRetry(login, password, otp)
      } else if (errorCode === 'bot_detected') {
        throw new errors.TemporaryError('Банк заподозрил в вас бота, попробуйте зайти через браузер, потом снова проведите синхронизацию в Zenmoney')
      } else if (errorCode === 'invalid_grant') {
        console.error(response)
        throw new errors.InvalidPreferencesError(_.get(response, 'body.error_description', 'Неправильный логин или пароль или ваш счет временно заблокирован'))
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
    headers: getAPIHeaders(auth.tokenType, auth.token),
    sanitizeRequestLog: { headers: { Authorization: true } }
  }

  const response = await network.fetchJson(urls.userInfo, params)
  if (response.status !== 200) {
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

    if (response.status !== 200) {
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
    body: requestData,
    sanitizeRequestLog: { headers: { Authorization: true } }
  }

  return recursive(params, [], 0, true)
}
