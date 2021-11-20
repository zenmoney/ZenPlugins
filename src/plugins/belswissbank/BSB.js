import padLeft from 'pad-left'
import { stringify } from 'querystring'
import { parse, splitCookiesString } from 'set-cookie-parser'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
import { isValidDate } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'

const rejectedTransactionTypes = [
  'Отказ',
  'Otkaz'
]

const cashTransferTransactionTypes = [
  'Пополнение',
  'Popolnenie',
  'Банкомат',
  'Bankomat',
  'Наличные',
  'Nalichnye',
  'Пополнение счета наличными (по паспорту)'
]

export const getTransactionFactor = (transaction) => {
  const transactionTypeFactors = {
    Возврат: 1,
    Vozvrat: 1,
    'Возврат средств': 1,
    'Vozvrat sredstv': 1,
    Пополнение: 1,
    Popolnenie: 1,
    'Service payment to card': 1,
    Зачисление: 1,
    Zachislenie: 1,
    Списание: -1,
    Spisanie: -1,
    'Комиссия банка': -1,
    'Товары и услуги': -1,
    'Tovary i uslugi': -1,
    Банкомат: -1,
    Bankomat: -1,
    Наличные: -1,
    Nalichnye: -1,
    'Зачисление с конверсией': 1,
    'Покупка валюты за б/н рубли': -1,
    'Пополнение счета наличными (по паспорту)': 1
  }
  let factor = transactionTypeFactors[transaction.transactionType]
  if (!factor) {
    if (/Комиссия за .*обслуживание/i.test(transaction.transactionType)) {
      factor = -1
    }
  }
  console.assert(factor !== undefined, 'unknown transactionType in transaction:', transaction)
  return factor
}

export const isElectronicTransferTransaction = (transaction) => transaction.transactionDetails === 'PERSON TO PERSON I-B BSB'

export const isCashTransferTransaction = (transaction) => cashTransferTransactionTypes.indexOf(transaction.transactionType) !== -1

export const isRejectedTransaction = (transaction) => rejectedTransactionTypes.indexOf(transaction.transactionType.trim()) !== -1

function patchTimezone (userDate) {
  const bankTimezone = 3 * 3600 * 1000
  return new Date(userDate.valueOf() + bankTimezone)
}

export function formatBsbCardsApiDate (userDate) {
  if (!isValidDate(userDate)) {
    throw new Error('valid date should be provided')
  }
  const date = patchTimezone(userDate)
  return [
    date.getUTCDate(),
    date.getUTCMonth() + 1,
    date.getUTCFullYear()
  ].map((number) => padLeft(number, 2, '0')).join('.')
}

export const assertResponseSuccess = function (response) {
  console.assert(response.status === 200, 'non-successful response', response)
}

const lang = 'ru'

const makeApiUrl = (path, queryParams) => `https://24.bsb.by/mobile/api${path}?${stringify(queryParams)}`

const BSB_AUTH_URL = makeApiUrl('/authorization', { lang })

const requestLogin = ({ username, password, deviceId }) => fetchJson(BSB_AUTH_URL, {
  method: 'POST',
  body: {
    username: username,
    password: password,
    deviceId: deviceId,
    applicationVersion: 'Web 6.0.12',
    osType: 3,
    currencyIso: 'BYN'
  },
  sanitizeRequestLog: { body: { username: true, password: true, deviceId: true } },
  sanitizeResponseLog: {
    headers: { 'set-cookie': true },
    body: { birthDate: true, eripId: true, fio: true, mobilePhone: true, sessionId: true, username: true }
  }
})

export async function authorize (username, password, deviceId) {
  const loginResponse = await requestLogin({ username, password, deviceId })
  if (loginResponse.status === 403 && loginResponse.body.error === 'Неверные учетные данные') {
    throw new InvalidPreferencesError(loginResponse.body.error)
  }
  assertResponseSuccess(loginResponse)
  const cookie = parse(splitCookiesString(loginResponse.headers['set-cookie'])).find((x) => x.name === 'JSESSIONID')
  ZenMoney.setData('sessionId', cookie.value)
  ZenMoney.saveData()
  return loginResponse.body
}

export async function confirm (deviceId, confirmationCode) {
  const response = await fetchJson(makeApiUrl(`/devices/${deviceId}`, { lang }), {
    method: 'POST',
    body: confirmationCode,
    sanitizeRequestLog: {
      headers: { 'set-cookie': true },
      body: true
    }
  })
  console.assert(response.body.deviceStatus === 'CONFIRMED', 'confirmation failed:', response)
}

export function fetchCards () {
  return fetchJson(makeApiUrl('/cards', { nocache: true, lang }), {
    method: 'GET',
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: { contract: true, maskedCardNumber: true, ownerName: true, ownerNameLat: true, rbsContract: true }
    }
  })
}

export function formatBsbPaymentsApiDate (userDate) {
  if (!isValidDate(userDate)) {
    throw new Error('valid date should be provided')
  }
  const date = patchTimezone(userDate)
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  ].map((number) => padLeft(number, 2, '0')).join('')
}

export function fetchPaymentsArchive ({ fromDate, toDate }) {
  return fetchJson(makeApiUrl('/archive', { lang }), {
    method: 'POST',
    body: {
      page: { pageNumber: 0, pageSize: 1000 },
      fromDate: formatBsbPaymentsApiDate(fromDate),
      toDate: formatBsbPaymentsApiDate(toDate || new Date())
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: { archives: { response: true } }
    }
  })
}

export function extractPaymentsArchive (response) {
  assertResponseSuccess(response)
  const { archives, hasNext } = response.body
  console.assert(!hasNext, 'fetchPaymentsArchive paging is not implemented')
  return archives
}

export async function fetchTransactions (cardId, fromDate, toDate) {
  const response = await fetchJson(makeApiUrl(`/cards/${cardId}/sms`, { lang }), {
    method: 'POST',
    body: {
      fromDate: formatBsbCardsApiDate(fromDate),
      toDate: formatBsbCardsApiDate(toDate || new Date())
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: { last4: true }
    }
  })
  assertResponseSuccess(response)
  return response.body
}

export function currencyCodeToIsoCurrency (currencyCode) {
  console.assert(currencyCode in codeToCurrencyLookup, 'unknown currency', currencyCode)
  return codeToCurrencyLookup[currencyCode]
}

function getAccountRest ({ transactions, index, accountCurrency }) {
  console.assert(index >= 0 && index < transactions.length, 'index out of range')
  const transaction = transactions[index]
  if (transaction.accountRest === null) {
    if (transaction.transactionCurrency === accountCurrency && index > 0) {
      const previousAccountRest = getAccountRest({
        transactions,
        index: index - 1,
        accountCurrency
      })
      if (previousAccountRest !== null) {
        return previousAccountRest + getTransactionFactor(transactions[index]) * transactions[index].transactionAmount
      }
    }
  }
  return transaction.accountRest
}

export function figureOutAccountRestsDelta ({ transactions, index, accountCurrency }) {
  console.assert(index >= 0 && index < transactions.length, 'index out of range')
  if (index === 0) {
    return null
  }
  const previousAccountRest = getAccountRest({ transactions, index: index - 1, accountCurrency })
  const currentAccountRest = getAccountRest({ transactions, index, accountCurrency })
  if (previousAccountRest === null || currentAccountRest === null) {
    return null
  }
  const accountDelta = currentAccountRest - previousAccountRest
  const transactionDelta = getTransactionFactor(transactions[index]) * transactions[index].transactionAmount
  if (Math.sign(transactionDelta) !== Math.sign(accountDelta)) {
    return null
  }
  return accountDelta
}
