import * as _ from 'lodash'
import * as network from '../../common/network'
import { retry } from '../../common/retry'
import * as errors from '../../errors'
import { stringify } from 'querystring'
import * as moment from 'moment'

const storageValueName = 'tokens'
const urls = new function () {
  this.baseURL = 'https://api.epayments.com/'

  this.token = this.baseURL + 'token'
  this.sessionConfirmation = this.baseURL + 'v1/confirmation-sessions'
}()

const defaultHeaders = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
  'Connection': 'keep-alive',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
  'Referer': 'https://my.epayments.com/'
}

const authHeaders = Object.assign({}, defaultHeaders, {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Authorization': 'Basic ZXBheW1lbnRzOm1ZbjZocmtnMElMcXJ0SXA4S1NE'
})

function panic (input) {
  console.error('Что-то пошло не так ' + JSON.stringify(input))
  throw new Error('Что-то пошло не так!')
}

function getTokensFromStorage () {
  const defaultValue = {
    accessToken: undefined,
    tokenType: undefined,
    expiresAt: undefined,
    refreshToken: undefined
  }
  return ZenMoney.getData(storageValueName, defaultValue)
}

function saveTokens (input) {
  const toSave = {
    accessToken: input.body.access_token,
    tokenType: input.body.token_type,
    expiresAt: moment.utc().add(input.body.expires_in, 'seconds').unix(),
    refreshToken: input.body.refresh_token
  }
  ZenMoney.setData(storageValueName, toSave)
  ZenMoney.saveData()
}

async function requestTokenByCredentials (login, password) {
  async function readCode (message) {
    const otp = await ZenMoney.readLine(message, { inputType: 'number' })

    if (!otp) throw new errors.InvalidOtpCodeError()
    else return otp
  }

  async function requestToken (login, password, otp, sessionId) {
    const base = {
      grant_type: 'password_otp',
      username: login,
      password: password
    }

    const data = Object.assign({}, base,
      otp ? { otpcode: otp } : null,
      sessionId ? { confirmation_session_id: sessionId } : null
    )

    const params = {
      method: 'POST',
      headers: authHeaders,
      body: data,
      stringify,
      parse: (body) => body === '' ? undefined : JSON.parse(body),
      sanitizeRequestLog: { body: { username: true, password: true } }
    }

    return network.fetch(urls.token, params)
  }

  async function getSCAConfirmation (sessionId) {
    const headers = Object.assign({}, defaultHeaders, {
      'Authorization': 'Basic ZXBheW1lbnRzOm1ZbjZocmtnMElMcXJ0SXA4S1NE'
    })

    const params = {
      method: 'GET',
      headers: headers
    }
    const url = `${urls.sessionConfirmation}/${sessionId}`

    const response = await retry({
      getter: () => network.fetchJson(url, params),
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

  async function requestTokenWithRetry (login, password, otp, sessionId) {
    const response = await requestToken(login, password, otp, sessionId)

    if (response.status === 200) {
      return response
    } else {
      const errorCode = _.get(response, 'body.error', '')
      const type2Fa = _.get(response, 'body.type_2fa', '')
      const sessionId = _.get(response, 'body.confirmation_session_id', '')

      if (errorCode === 'otp_code_required' && type2Fa === 'StrongCustomerAuthenticator') {
        const device = _.get(response, 'body.send_to', '<undefined>')
        console.debug(`Ожидаю подтверждения с девайса ${device}...`)

        await getSCAConfirmation(sessionId)
        return requestTokenWithRetry(login, password, undefined, sessionId)
      } else if (errorCode === 'otp_code_invalid' && type2Fa === 'StrongCustomerAuthenticator') {
        if (sessionId !== '' && _.get(response, 'body.error_description', '') !== '') {
          console.debug(response.body.error_description)
        } else {
          console.debug(`Сессия ${sessionId} истекла, пробуем еще раз...`)
        }
        return requestTokenWithRetry(login, password, undefined, undefined)
      } else if (errorCode === 'otp_code_required') {
        const otp = await readCode('Введите одноразовый пароль')
        return requestTokenWithRetry(login, password, otp)
      } else if (errorCode === 'otp_code_invalid') {
        const otp = await readCode('Одноразовый пароль введен неверно. Попробуйте еще раз')
        return requestTokenWithRetry(login, password, otp)
      } else if (errorCode === 'bot_detected') {
        throw new errors.TemporaryError('Банк заподозрил в вас бота, попробуйте зайти через браузер, потом снова проведите синхронизацию в Zenmoney')
      } else if (errorCode === 'invalid_grant') {
        console.error(response)
        throw new errors.InvalidPreferencesError(_.get(response, 'body.error_description', 'Неправильный логин или пароль или ваш счет временно заблокирован'))
      } else {
        panic(response)
      }
    }
  }

  return requestTokenWithRetry(login, password, undefined, undefined)
}

async function requestTokenByRefreshToken (refreshToken) {
  const data = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  }

  const params = {
    method: 'POST',
    headers: authHeaders,
    body: data,
    stringify,
    parse: (body) => body === '' ? undefined : JSON.parse(body)
  }

  return network.fetch(urls.token, params)
}

export async function getToken (login, password) {
  function transformResult (input) {
    if (input.tokenType && input.accessToken) { // Ранее сохраненный токен
      return { tokenType: input.tokenType, token: input.accessToken }
    } else { // Токен из ответа сервера
      return { tokenType: input.body.token_type, token: input.body.access_token }
    }
  }

  async function fallback (login, password) {
    const response = await requestTokenByCredentials(login, password)
    if (response.status === 200) { // Получили новую пару токенов
      saveTokens(response)
      return transformResult(response)
    } else {
      panic(response)
    }
  }

  const storedTokens = getTokensFromStorage()
  if (storedTokens.accessToken && storedTokens.refreshToken && storedTokens.expiresAt) {
    console.debug('Токены найдены в хранилище')
    // Используем текущее время + 5 минут для уверенности
    if (Number.isInteger(storedTokens.expiresAt) && (storedTokens.expiresAt < moment.utc().add(5, 'minutes').unix())) {
      console.debug('Токены из хранилища просрочены')
      const response = await requestTokenByRefreshToken(storedTokens.refreshToken)
      if (response.status === 200) {
        console.debug('Получена новая пара токенов по refresh токену из хранилища')
        saveTokens(response)
        return transformResult(response)
      } else {
        console.debug('Не удалось получить новую пару токенов по refresh токену из хранилища. Очищаем хранилище')
        ZenMoney.clearData()
        ZenMoney.saveData()
        return fallback(login, password)
      }
    } else {
      return transformResult(storedTokens)
    }
  } else {
    console.debug('Токенов в хранилищe не найдено, пробуем логин и пароль...')
    return fallback(login, password)
  }
}
