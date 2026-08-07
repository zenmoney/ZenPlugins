import { generateRandomString } from '../../common/utils'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import {
  AuthenticationError,
  fetchAccounts as fetchApiAccounts,
  fetchCardBalance,
  fetchCardOrAccountTransactions,
  fetchCards,
  fetchDeposits,
  fetchDepositTransactions,
  fetchPasswordSession,
  fetchPasswordVerification,
  fetchPhoneExists,
  fetchRefreshedSession
} from './fetchApi'

const authFields = ['guid', 'accessToken', 'refreshToken']

function getStringField (value, key) {
  return value && typeof value === 'object' && typeof value[key] === 'string' && value[key].length > 0
    ? value[key]
    : undefined
}

export function createAuth (storedAuth) {
  const auth = {
    deviceId: getStringField(storedAuth, 'deviceId') || generateRandomString(16),
    sessionId: getStringField(storedAuth, 'sessionId') || generateRandomString(16)
  }
  for (const key of authFields) {
    const value = getStringField(storedAuth, key)
    if (value !== undefined) {
      auth[key] = value
    }
  }
  return auth
}

function applySession (auth, session) {
  const updatedAuth = { ...auth }
  for (const key of authFields) {
    const value = getStringField(session, key)
    if (value === undefined) {
      throw new TemporaryError(`Bank did not return ${key} during authentication`)
    }
    updatedAuth[key] = value
  }
  return updatedAuth
}

function getVerificationCode (verification) {
  const verificationCode = getStringField(verification, 'verificationCode')
  if (verificationCode === undefined) {
    throw new TemporaryError('Банк не вернул код авторизации. Повторите синхронизацию позже.')
  }
  return verificationCode
}

async function readOtpCode (verification) {
  const maskedPhone = getStringField(verification, 'maskedPhone') || getStringField(verification, 'maskedPhoneNumber')
  const destination = maskedPhone || 'ваш номер телефона'
  return ZenMoney.readLine(`Введите код из СМС, отправленный на ${destination}`, { inputType: 'number', time: 120000 })
}

async function authenticate (preferences, auth, checkPhone) {
  if (checkPhone && !await fetchPhoneExists(auth, preferences.phone)) {
    throw new InvalidLoginOrPasswordError('Для указанного номера телефона не найден аккаунт')
  }

  const verification = await fetchPasswordVerification(auth, preferences.phone, preferences.password)
  const otpCode = verification?.otpRequired === false ? null : await readOtpCode(verification)
  const session = await fetchPasswordSession(auth, getVerificationCode(verification), otpCode)
  return applySession(auth, session)
}

export async function coldAuth (preferences, auth) {
  return authenticate(preferences, createAuth(auth), true)
}

export async function hotAuth (preferences, auth) {
  auth = createAuth(auth)
  if (getStringField(auth, 'refreshToken') !== undefined) {
    try {
      return applySession(auth, await fetchRefreshedSession(auth))
    } catch (e) {
      if (!(e instanceof AuthenticationError)) {
        throw e
      }
    }
  }
  return authenticate(preferences, auth, false)
}

export async function fetchAccounts (auth) {
  const cards = await fetchCards(auth)
  const cardsWithBalances = await Promise.all(cards.map(async card => ({
    type: 'card',
    data: card,
    balance: await fetchCardBalance(auth, card.guid)
  })))
  const accounts = await fetchApiAccounts(auth)
  const deposits = await fetchDeposits(auth)

  return [
    ...cardsWithBalances,
    ...accounts.map(data => ({ type: 'account', data })),
    ...deposits.map(data => ({ type: 'deposit', data }))
  ]
}

function getTransactionPage (auth, product, fromDate, toDate, page) {
  if (product.type === 'deposit') {
    return fetchDepositTransactions(auth, product.id, page)
  }
  return fetchCardOrAccountTransactions(auth, product.id, fromDate, toDate, page)
}

export async function fetchTransactions (auth, product, fromDate, toDate) {
  const transactions = []
  let page = 0

  while (true) {
    const result = await getTransactionPage(auth, product, fromDate, toDate, page)
    if (!Array.isArray(result?.content)) {
      throw new TemporaryError('Bank returned malformed transaction history response')
    }
    if (result.content.length > 0 && typeof result.totalPages !== 'number') {
      throw new TemporaryError('Bank did not return transaction history page count')
    }
    transactions.push(...result.content.map(data => ({ type: product.type, data })))

    if (result.content.length === 0 || page >= result.totalPages - 1) {
      return transactions
    }
    page++
  }
}
