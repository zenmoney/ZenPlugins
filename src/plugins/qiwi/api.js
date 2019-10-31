import { omit } from 'lodash'
import { fetchJson as commonFetchJson } from '../../common/network'
import { retry } from '../../common/retry'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'

async function fetchJson (url, options) {
  const response = await commonFetchJson(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json',
      'Authorization': `Bearer ${options.token}`,
      'Host': 'edge.qiwi.com'
    },
    sanitizeRequestLog: { headers: { Authorization: true } },
    ...omit(options, 'token')
  })
  if (response.status === 401) {
    throw new InvalidPreferencesError('Токен просрочен либо введен неверно. Настройте подключение заново.')
  }
  if (response.body && response.body.errorCode === 'internal.error') {
    throw new TemporaryError('Информация временно недоступна.')
  }
  return response
}

function formatDate (date) {
  return date.getUTCFullYear() +
    '-' + toAtLeastTwoDigitsString(date.getUTCMonth() + 1) +
    '-' + toAtLeastTwoDigitsString(date.getUTCDate()) +
    'T' + toAtLeastTwoDigitsString(date.getUTCHours()) +
    ':' + toAtLeastTwoDigitsString(date.getUTCMinutes()) +
    ':' + toAtLeastTwoDigitsString(date.getUTCSeconds()) +
    '+00:00'
}

export async function login (token) {
  const response = await fetchJson('https://edge.qiwi.com/person-profile/v1/profile/current', {
    token,
    sanitizeResponseLog: { body: true }
  })
  if (response.body && response.body.errorCode === 'auth.forbidden') {
    throw new InvalidPreferencesError('Токен не дает прав на запрос информации о профиле кошелька. ' +
      'Сгенерируйте новый токен, следуя описанию подключения синхронизации.')
  }
  return { walletId: response.body.authInfo.personId, token }
}

export async function fetchAccounts ({ token, walletId }) {
  const response = await fetchJson(`https://edge.qiwi.com/funding-sources/v2/persons/${walletId}/accounts`, { token })
  if (response.body && response.body.errorCode === 'auth.forbidden') {
    throw new InvalidPreferencesError('Токен не дает прав на запрос баланса кошелька. ' +
      'Сгенерируйте новый токен, следуя описанию подключения синхронизации.')
  }
  return response.body.accounts
}

export async function fetchTransactions ({ token, walletId }, fromDate, toDate) {
  toDate = toDate || new Date()
  const apiTransactions = []
  let nextTxnDate = null
  let nextTxnId = null
  do {
    const response = await fetchTransactionPaged({ token, walletId }, fromDate, toDate, nextTxnId, nextTxnDate)
    nextTxnDate = response.body.nextTxnDate
    nextTxnId = response.body.nextTxnId
    if (response.body.data.length > 0) {
      apiTransactions.push(...response.body.data)
    }
  } while (nextTxnId && nextTxnDate)
  return apiTransactions
}

async function fetchTransactionPaged ({ token, walletId }, fromDate, toDate, nextTxnId, nextTxnDate) {
  const options = { token }
  const url = `https://edge.qiwi.com/payment-history/v2/persons/${walletId}/payments?rows=50` +
    `&startDate=${encodeURIComponent(formatDate(fromDate))}` +
    (toDate ? `&endDate=${encodeURIComponent(formatDate(toDate))}` : '') +
    (nextTxnDate && nextTxnId ? `&nextTxnDate=${encodeURIComponent(nextTxnDate)}&nextTxnId=${nextTxnId}` : '')
  const response = await retry({
    getter: () => fetchJson(url, options),
    predicate: response => response.body.errorCode !== 'request.blocked',
    maxAttempts: 5
  })
  if (response.body && response.body.errorCode === 'auth.forbidden') {
    throw new InvalidPreferencesError('Токен не дает прав на просмотр истории операций. ' +
      'Сгенерируйте новый токен, следуя описанию подключения синхронизации.')
  }
  return response
}
