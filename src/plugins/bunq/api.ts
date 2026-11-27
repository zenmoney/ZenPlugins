import {
  AccountData,
  BunqAccountType,
  BunqAccountResponse,
  BunqPaymentListResponse,
  BunqPayment,
  DateTimeString,
  InstallationContext,
  Preferences,
  SessionContext
} from './models'
import { fetchApiInstallation, fetchDeviceSet, fetchMonetaryAccountList, fetchPayments, fetchSessionStart } from './fetchApi'
import { generatePemCerts, limitRequests } from './utils'
import { isString, last } from 'lodash'

export async function registerDevice (preferences: Preferences): Promise<InstallationContext> {
  const installationContext = await installationApi()

  await deviceSetApi(installationContext, preferences)

  return installationContext
}

export async function sessionStartApi (installationContext: InstallationContext, preferences: Preferences): Promise<SessionContext> {
  return await fetchSessionStart(installationContext.installationToken, installationContext.clientPrivateKey, preferences.apiKey).then((data) => (
    {
      sessionToken: data.Response[1].Token.token,
      userId: data.Response[2].UserPerson.id
    }))
}

export async function getAccountsList (sessionContext: SessionContext): Promise<AccountData[]> {
  const accounts: AccountData[] = []
  const result = await fetchMonetaryAccountList(sessionContext.userId, sessionContext.sessionToken)
  const olderIdPointer = 'older_id='
  const timer = limitRequests(3, 3000)

  await timer()

  const mapAccounts = (accounts: BunqAccountResponse): AccountData[] => accounts.map((account) => {
    const monetaryAccount = Object.values(account)[0]
    const monetaryType = Object.keys(account)[0]
    const type = ((): BunqAccountType => {
      switch (monetaryType) {
        case 'MonetaryAccountInvestment':
          return BunqAccountType.Investment
        default:
          return BunqAccountType.Bank
      }
    })()

    const accountData: AccountData = { ...monetaryAccount, type }

    return accountData
  }).filter((account) => (account.status === 'ACTIVE') &&
    (account.type !== BunqAccountType.Investment)) // we don't sync investment accounts, because they have no proper balance and transactions

  accounts.push(...mapAccounts(result.Response))

  let olderUrl = result.Pagination.older_url
  while (isString(olderUrl)) {
    const olderIdPos = olderUrl.lastIndexOf(olderIdPointer)
    const olderId = Number(olderUrl.substring(olderIdPos + olderIdPointer.length))

    await timer()
    const newResult = await fetchMonetaryAccountList(sessionContext.userId, sessionContext.sessionToken, olderId)
    olderUrl = newResult.Pagination.older_url
    accounts.push(...mapAccounts(newResult.Response))
  }

  return accounts
}

export async function getTransactionsForAccounts (accounts: AccountData[], sessionContext: SessionContext, dateFrom: DateTimeString): Promise<BunqPayment[]> {
  const transactions: BunqPayment[] = []

  for (const account of accounts) {
    transactions.push(...await getTransactionsApi(account.id, sessionContext, dateFrom))
  }

  return transactions
}

async function getTransactionsApi (accountId: number, sessionContext: SessionContext, dateFrom: DateTimeString): Promise<BunqPayment[]> {
  const transactions: BunqPayment[] = []

  const result = await fetchPayments(sessionContext.userId, accountId, sessionContext.sessionToken)
  const olderIdPointer = 'older_id='
  const timer = limitRequests(3, 3000)

  await timer()

  const mapTransactions = (payments: BunqPaymentListResponse): BunqPayment[] => payments.filter((payment) => {
    const transaction: BunqPayment = payment.Payment

    return transaction.created >= dateFrom
  }).map((payment) => payment.Payment)

  transactions.push(...mapTransactions(result.Response))

  let olderUrl = result.Pagination.older_url
  let lastReceivedDate = last(transactions)?.created ?? ''
  while (isString(olderUrl) && lastReceivedDate >= dateFrom) {
    const olderIdPos = olderUrl.lastIndexOf(olderIdPointer)
    const olderId = Number(olderUrl.substring(olderIdPos + olderIdPointer.length))

    await timer()
    const newResult = await fetchPayments(sessionContext.userId, accountId, sessionContext.sessionToken, olderId)
    olderUrl = newResult.Pagination.older_url
    const newTransactions = mapTransactions(newResult.Response)
    transactions.push(...newTransactions)
    lastReceivedDate = last(newTransactions)?.created ?? ''
  }

  return transactions
}

async function installationApi (): Promise<InstallationContext> {
  const certs = await generatePemCerts()
  return await fetchApiInstallation(certs.publicKey).then((data) => ({
    clientPrivateKey: certs.privateKey,
    installationToken: data.Response[1].Token.token
  }))
}

async function deviceSetApi (installationContext: InstallationContext, preferences: Preferences): Promise<void> {
  return await fetchDeviceSet(installationContext.installationToken, preferences.apiKey)
}
