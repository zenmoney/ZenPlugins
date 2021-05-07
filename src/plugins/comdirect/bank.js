import { BankMessageError } from '../../errors'
import { stringify } from 'querystring'
import { fetchJson } from '../../common/network'

const tokenEndpoint = 'https://api.comdirect.de/oauth/token'
const API_PREFIX = 'https://api.comdirect.de/api'
let requestCounter = 0
const refreshTimeInSeconds = 120

const TRANSACTIONS_PER_CALL = 500

const getErrorString = (error = {}) => {
  if (error.error) {
    return `${error.error} (${error.error_description})`
  }

  if (error.code) {
    const granular = error.messages instanceof Array && error.messages.length > 0

    return granular ? `${error.code} ${(error.messages).map(({ message }) => message).join('; ')}` : error.code
  }

  return error.message || 'Ошибка ответа от банка'
}

const fetchApi = async (url, { giveFullResponse, sanitizeWholeResponse, ...options }) => {
  const response = await fetchJson(url, {
    ...options,
    sanitizeRequestLog: {
      body: {
        username: true,
        password: true,
        client_id: true,
        client_secret: true,
        identifier: true
      },
      headers: {
        Authorization: true,
        'x-http-request-info': true
      },
      parameters: {
        client_id: true
      }
    },
    sanitizeResponseLog: {
      body: sanitizeWholeResponse || {
        values: true,
        aggregated: true,
        access_token: true,
        refresh_token: true
      },
      headers: {
        'x-once-authentication': true,
        'x-once-authentication-info': true
      }
    }
  })

  if (response.status >= 400) {
    throw new BankMessageError(getErrorString(response.body))
  }

  return giveFullResponse ? response : response.body
}

const getRequestHeaders = ({ accessToken, sessionId = 'to-be-created' }) => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Bearer ${accessToken}`,
  'x-http-request-info': JSON.stringify({
    clientRequestId: {
      sessionId,
      requestId: `request-${++requestCounter}`
    }
  })
})

const getTokenHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded'
})

const getInitialLogin = async (preferences) => {
  const data = {
    username: preferences.username,
    password: preferences.password,
    client_id: preferences.clientId,
    client_secret: preferences.clientSecret,
    grant_type: 'password'
  }

  const response = await fetchApi(tokenEndpoint, {
    method: 'POST',
    stringify,
    body: data,
    headers: getTokenHeaders()
  })

  const expires = +new Date() + response.expires_in * 1000

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expires: expires
  }
}

const getSecondaryLogin = async ({ accessToken }, preferences) => {
  const data = {
    client_id: preferences.clientId,
    client_secret: preferences.clientSecret,
    grant_type: 'cd_secondary',
    token: accessToken
  }

  const response = await fetchApi(tokenEndpoint, {
    method: 'POST',
    stringify,
    body: data,
    headers: getTokenHeaders()
  })

  const expires = +new Date() + response.expires_in * 1000

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expires: expires
  }
}

const refreshToken = async ({ refreshToken }, preferences) => {
  const data = {
    client_id: preferences.clientId,
    client_secret: preferences.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  }

  const response = await fetchApi(tokenEndpoint, {
    method: 'POST',
    body: data,
    stringify,
    headers: getTokenHeaders()
  })

  const expires = +new Date() + response.expires_in * 1000

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expires: expires
  }
}

const createSession = async (auth) => {
  const response = await fetchApi(`${API_PREFIX}/session/clients/${auth.clientId}/v1/sessions`, {
    headers: getRequestHeaders(auth),
    sanitizeWholeResponse: true
  })

  return response[0].identifier
}

const getActivationPayload = ({ sessionId }) => ({
  identifier: sessionId,
  sessionTanActive: true,
  activated2FA: true
})

const validateSessionAndCollectTan = async (auth, tanType) => {
  const headers = getRequestHeaders(auth)
  if (tanType) {
    headers['x-once-authentication-info'] = JSON.stringify({ typ: tanType })
  }

  const response = await fetchApi(
    `${API_PREFIX}/session/clients/${auth.clientId}/v1/sessions/${auth.sessionId}/validate`, {
      method: 'POST',
      body: getActivationPayload(auth),
      headers,
      giveFullResponse: true
    }
  )

  const validationInfo = JSON.parse(response.headers['x-once-authentication-info'])

  console.log(`Activation id of type ${validationInfo.typ} obtained: length ${validationInfo.id.length}`)
  const { tanInput, switchTanType } = await confirmTan(validationInfo)

  if (switchTanType) {
    return await validateSessionAndCollectTan(auth, switchTanType)
  }

  return {
    activationId: validationInfo.id,
    tanInput
  }
}

const confirmActivation = async (auth, { activationId, userInput }) => {
  const headers = {
    ...getRequestHeaders(auth),
    'x-once-authentication-info': JSON.stringify({ id: activationId })
  }

  if (userInput) {
    headers['x-once-authentication'] = userInput
  }

  const response = fetchApi(
    `${API_PREFIX}/session/clients/${auth.clientId}/v1/sessions/${auth.sessionId}`, {
      method: 'PATCH',
      body: getActivationPayload(auth),
      headers
    })

  if (response.messages instanceof Array && response.messages[0].key === 'PUSHTAN_ANGEFORDERT') {
    throw new BankMessageError('Push-TAN не был подтверждён в приложении')
  }

  return response
}

export const fetchAccounts = async (auth) => {
  console.log('Fetching account balances')

  const response = await fetchApi(
    `${API_PREFIX}/banking/clients/user/v2/accounts/balances`,
    {
      headers: {
        ...getRequestHeaders(auth)
      }
    }
  )

  return response.values
}

const normalizeDate = (srcDate) => {
  const date = new Date(srcDate.getTime())

  date.setUTCHours(0)
  date.setUTCMinutes(0)
  date.setUTCSeconds(0)
  date.setUTCMilliseconds(0)

  return date
}

export const splitDateInterval = (fromDate, toDate) => {
  const offset = 12 * 3600 * 1000 // 12 hours
  const midDate = new Date((fromDate.getTime() + toDate.getTime()) / 2)

  return [
    new Date(midDate.getTime() - offset),
    new Date(midDate.getTime() + offset)
  ].map(normalizeDate)
}

const dateToApiString = date => date.toISOString().substr(0, 10)
const apiStringToDate = apiString => new Date(`${apiString}T00:00:00.000Z`)

export const fetchTransactions = async (accountId, fromDate, toDate, auth, accountIndex) => {
  if (!toDate) {
    // pretend for now that we're in Europe/Berlin timezone. if we send the future date to the API (from Berlin perspective),
    // which happen if we're syncing at 1am in Moscow, and that date hasn't occurred in Germany yet, the API call will fail
    toDate = new Date()
  }

  if (!fromDate) {
    fromDate = new Date(0)
  }

  [fromDate, toDate] = [fromDate, toDate].map(normalizeDate)
  const from = dateToApiString(fromDate)
  const to = dateToApiString(toDate)
  const zeroDate = dateToApiString(normalizeDate(new Date(0)))
  const today = dateToApiString(normalizeDate(new Date()))

  console.log(`Fetching transactions from ${from} to ${to} for account ${accountIndex}`)

  // work around the aforementioned issue for most of the cases – if to date is the same as current date, don't pass it to the API
  const toDateApiString = to === today ? '' : `&max-bookingDate=${to}`
  const fromDateApiString = fromDate === zeroDate ? '' : `min-bookingDate=${from}`

  const response = await fetchApi(
    `${API_PREFIX}/banking/v1/accounts/${accountId}/transactions?${fromDateApiString}${toDateApiString}&paging-count=${TRANSACTIONS_PER_CALL}`,
    {
      headers: {
        ...getRequestHeaders(auth)
      }
    }
  )

  if (response.paging.matches > response.values.length) {
    // if there are more total results that fits the API call page, try divide into tho pieces
    if (from === to) {
      const remainingCount = response.paging.matches - response.values.length
      await ZenMoney.alert(`Невозможно загрузить все транзакции (${response.paging.matches}) для даты ${from}. Лимит транзакций, которые можно получить в день – ${TRANSACTIONS_PER_CALL}. Последние транзакции (${remainingCount}) за дату ${from} не будут синхронизированы.`)

      return response.values
    }

    if (fromDate === zeroDate) {
      // if we didn't know the date of first transaction, now we do. latest means earliest in this API :)
      fromDate = apiStringToDate(response.aggregated.bookingDateLatestTransaction)
    }
    const [midDate1, midDate2] = splitDateInterval(fromDate, toDate)

    return [
      ...await fetchTransactions(accountId, fromDate, midDate1, auth, accountIndex),
      ...await fetchTransactions(accountId, midDate2, toDate, auth, accountIndex)
    ]
  }

  return response.values
}

const loginFlow = async (preferences) => {
  let auth = await getInitialLogin(preferences)
  console.log(`Access token obtained of length ${auth.accessToken.length}`)
  auth.clientId = preferences.clientId
  const sessionId = await createSession(auth)
  auth.sessionId = sessionId
  console.log(`Session id obtained: length ${sessionId.length}`)
  const { activationId, tanInput } = await validateSessionAndCollectTan(auth)
  const { identifier, ...activationStatus } = await confirmActivation(auth, {
    activationId: activationId,
    userInput: tanInput
  })
  console.log('Your session activation status is', activationStatus)
  auth = {
    ...auth,
    ...await getSecondaryLogin(auth, preferences)
  }
  console.log(`Your updated token is of length ${auth.accessToken.length}`)

  for (const entry in Object.entries(auth)) {
    ZenMoney.setData(...entry)
  }
  ZenMoney.saveData()

  return auth
}

const quickLogin = () => {
  const auth = ['accessToken', 'refreshToken', 'expires', 'clientId', 'sessionId'].reduce((acc, key) => {
    acc[key] = ZenMoney.getData(key)

    return acc
  }, {})

  return auth.sessionId ? auth : null
}

const confirmTan = async (validationInfo) => {
  console.log('Validation info: ', validationInfo)
  console.log('Available auth types: ', validationInfo.availableTypes)
  const moreTypes = validationInfo.availableTypes.filter((type) => type !== validationInfo.typ)
  let message
  let imageUrl
  let requireUserInput = true

  switch (validationInfo.typ) {
    case 'M_TAN':
      message = `Введите код, отправленный вам на номер ${validationInfo.challenge}.`
      break
    case 'P_TAN':
      message = 'Введите код, который вам показывает приложение photoTAN при наведении на этот график.'
      imageUrl = `data:image/png;base64,${validationInfo.challenge}`
      break
    case 'P_TAN_PUSH':
      message = 'Подтвердите вход в приложении photoTAN, после чего нажмите кнопку "OK".'
      requireUserInput = false
      break
    default:
      message = `Данный тип активации сессии (${validationInfo.typ}) не поддерживается. Мы попробуем активировать сессию, но ничего не гарантируем. Если у вас есть TAN активации, введите его в поле ниже.`
  }

  if (moreTypes.length) {
    message = `${message}\n\nТекущий тип активации сессии: ${validationInfo.typ}. Если вы хотите его сменить, введите в поле одно из следующих значений: ${moreTypes.join(', ')}`
    requireUserInput = true
  }

  if (!requireUserInput) {
    await ZenMoney.alert(message)
    return {}
  }

  // user input might be TAN, might be auth method to switch to, might be empty
  const options = {}
  if (imageUrl) {
    options.imageUrl = imageUrl
  }

  const userInput = await ZenMoney.readLine(message, options)

  const inputUppercase = (userInput || '').toUpperCase()
  if (moreTypes.includes(inputUppercase)) {
    return {
      switchTanType: inputUppercase
    }
  }

  return {
    tanInput: userInput
  }
}

export const login = async (preferences) => {
  let auth = quickLogin()
  if (!auth) {
    console.log('Auth was not persisted. Getting a new one…')
    auth = await loginFlow(preferences)
  }

  const expiresIn = auth.expires - +new Date()
  const secondsToExpiry = Math.floor(expiresIn / 1000)

  if (secondsToExpiry < 0) {
    console.log(`Access expired ${Math.abs(secondsToExpiry)} seconds ago. Getting a new one…`)
    auth = await loginFlow(preferences)
  } else if (secondsToExpiry < refreshTimeInSeconds) {
    console.log(`Access expires in ${secondsToExpiry} seconds. Refreshing token…`)
    auth = {
      ...auth,
      ...await refreshToken(auth, preferences)
    }
  } else {
    console.log(`Access expires in ${secondsToExpiry} seconds`)
  }

  /* for development
   * console.log('If needed, copy-paste this to zp_data.json')
   * console.log(JSON.stringify(auth))
   */

  return auth
}
