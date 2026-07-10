import { InvalidOtpCodeError } from '../../errors'
import {
  fetchAccountTurnover,
  fetchAccounts as fetchAccountsApi,
  fetchCardTurnover,
  fetchCards as fetchCardsApi,
  fetchEnvironment,
  fetchLogin,
  fetchLoginPage,
  fetchReservedFunds
} from './fetchApi'
import { AccountInfo, AccountTransaction, Card, Preferences, Session } from './models'

export async function login ({ login }: Preferences): Promise<Session> {
  await fetchLoginPage()

  const preLoginEnv = await fetchEnvironment('')

  const otp = await ZenMoney.readLine('Введите одноразовый код из приложения Alta', {
    inputType: 'number',
    time: 120000
  })
  if (otp === null || otp === '') {
    throw new InvalidOtpCodeError()
  }

  await fetchLogin(preLoginEnv.requestToken, login, otp)

  const postLoginEnv = await fetchEnvironment(preLoginEnv.requestToken)
  if (postLoginEnv.authenticationType === '' && postLoginEnv.principalId === 0) {
    console.error('login failed')
    throw new InvalidOtpCodeError()
  }

  console.info('login successful')
  return { requestToken: postLoginEnv.requestToken }
}

export async function fetchAccounts (session: Session): Promise<AccountInfo[]> {
  return await fetchAccountsApi(session.requestToken)
}

export async function fetchTransactions (
  session: Session,
  account: AccountInfo,
  fromDate: Date,
  toDate: Date
): Promise<AccountTransaction[]> {
  return await fetchAccountTurnover(session.requestToken, account, fromDate, toDate)
}

export async function fetchReservedTransactions (
  session: Session,
  account: AccountInfo,
  fromDate: Date
): Promise<AccountTransaction[]> {
  return await fetchReservedFunds(session.requestToken, account.accountNumber, fromDate)
}

export async function fetchCards (session: Session): Promise<Card[]> {
  return await fetchCardsApi(session.requestToken)
}

export async function fetchCardTransactions (
  session: Session,
  card: Card,
  currencies: string[],
  fromDate: Date,
  toDate: Date
): Promise<AccountTransaction[]> {
  // Each currency (AccountType) returns only its own operations, so query them all.
  const perCurrency = await Promise.all(currencies.map(
    async currency => await fetchCardTurnover(session.requestToken, card.primaryCardID, currency, fromDate, toDate)
  ))
  return perCurrency.flat()
}
