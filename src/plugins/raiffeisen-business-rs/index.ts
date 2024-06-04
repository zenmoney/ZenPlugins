import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import {
  fetchAllAccounts,
  fetchAccountTransactions,
  getTicket,
  getLegalEntities,
  setLegalEntity
} from './fetchApi'
import { convertAccounts, convertTransactions } from './converters'
import { Auth, GetAccountTransactionsResponse, LegalEntitiesResponse, Preferences, RaiffAccount } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  const authTicket = await getTicket(preferences)
  const legalEntitiesResponse: LegalEntitiesResponse = await getLegalEntities(authTicket)
  const legalEntities = legalEntitiesResponse.PrincipalData
  const activeEntities = legalEntities.filter(legalEntity => legalEntity.IsActive)

  const accounts: RaiffAccount[] = []
  const transactions: Transaction[] = []

  for (const legalEntity of activeEntities) {
    const auth: Auth = await setLegalEntity(
      legalEntity.LegalEntityID.toString(),
      legalEntitiesResponse.LastSuccessfulLogon,
      legalEntitiesResponse.Ticket
    )
    const fetchedAccounts = await fetchAllAccounts(auth)
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
