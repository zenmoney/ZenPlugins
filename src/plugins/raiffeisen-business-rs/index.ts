import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import {
  fetchAllAccounts,
  fetchAccountTransactions,
  getTicket,
  getLegalEntities,
  setLegalEntity
} from './fetchApi'
import { convertAccounts, convertTransactions } from './converters'
import {
  Auth,
  AccountBalanceResponse,
  GetAccountTransactionsResponse,
  LegalEntity,
  LegalEntitiesResponse,
  LegalEntitySession,
  Preferences,
  RaiffAccount
} from './models'

const STORED_SESSIONS_KEY = 'sessions'

async function tryRestoreSessions (
  sessions: LegalEntitySession[]
): Promise<Array<{ legalEntity: LegalEntity, auth: Auth, fetchedAccounts: AccountBalanceResponse[] }> | null> {
  if (sessions.length === 0) {
    return null
  }
  const restored: Array<{ legalEntity: LegalEntity, auth: Auth, fetchedAccounts: AccountBalanceResponse[] }> = []
  for (const session of sessions) {
    try {
      const fetchedAccounts = await fetchAllAccounts(session.auth)
      restored.push({ legalEntity: session.legalEntity, auth: session.auth, fetchedAccounts })
    } catch (_) {
      return null
    }
  }
  return restored
}

async function performFullLogin (
  preferences: Preferences
): Promise<Array<{ legalEntity: LegalEntity, auth: Auth, fetchedAccounts: AccountBalanceResponse[] }>> {
  const authTicket = await getTicket(preferences)
  const legalEntitiesResponse: LegalEntitiesResponse = await getLegalEntities(authTicket, preferences.login)
  const activeEntities = legalEntitiesResponse.PrincipalData.filter(legalEntity => legalEntity.IsActive)

  const sessions: Array<{ legalEntity: LegalEntity, auth: Auth, fetchedAccounts: AccountBalanceResponse[] }> = []
  for (const legalEntity of activeEntities) {
    const auth: Auth = await setLegalEntity(
      legalEntity.LegalEntityID.toString(),
      legalEntitiesResponse.LastSuccessfulLogon,
      legalEntitiesResponse.Ticket
    )
    const fetchedAccounts = await fetchAllAccounts(auth)
    sessions.push({ legalEntity, auth, fetchedAccounts })
  }
  return sessions
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()

  const storedSessions = (ZenMoney.getData(STORED_SESSIONS_KEY, []) as LegalEntitySession[]) ?? []
  let entitySessions = await tryRestoreSessions(storedSessions)
  if (entitySessions === null) {
    entitySessions = await performFullLogin(preferences)
  }

  ZenMoney.setData(
    STORED_SESSIONS_KEY,
    entitySessions.map(({ legalEntity, auth }) => ({ legalEntity, auth }))
  )
  ZenMoney.saveData()

  const accounts: RaiffAccount[] = []
  const transactions: Transaction[] = []

  for (const { auth, fetchedAccounts } of entitySessions) {
    accounts.push(...convertAccounts(fetchedAccounts))

    const apiTransactions: GetAccountTransactionsResponse[] = []
    for (const fetchedAccount of fetchedAccounts) {
      if (accounts.some(account => account.id.startsWith(fetchedAccount.AccountNumber) && ZenMoney.isAccountSkipped(account.id))) {
        continue
      }
      apiTransactions.push(...await fetchAccountTransactions(
        fetchedAccount.AccountNumber,
        fetchedAccount.ProductCodeCore,
        fetchedAccount.CurrencyCode,
        fetchedAccount.CurrencyCodeNumeric,
        auth, fromDate, toDate
      ))
    }

    transactions.push(...convertTransactions(apiTransactions))
  }

  return {
    accounts,
    transactions
  }
}
