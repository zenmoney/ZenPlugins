/**
 * @author Belyaev Vitaliy <vbelyaev2005@gmail.com>
 */
import { AccountOrCard, AccountType, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchJson } from '../../common/network'
import { getArray, getNumber, getOptNumber, getOptString, getString } from '../../types/get'

export const scrape: ScrapeFunc<{ token: string }> =
  async ({ preferences, fromDate }) => {
    const time = Math.max(Math.round(fromDate.getTime() / 1000), Math.round(Date.now() / 1000) - 3600 * 24 * 30)

    async function fetchAccountTransactions (id: string): Promise<unknown[]> {
      const response = await fetchJson(
        `https://api.monobank.ua/personal/statement/${id}/${time}`,
        { headers: { 'X-Token': preferences.token } }
      )
      assert(response.status === 200, 'Не удалось получить транзакции', { response })
      return response.body as unknown[]
    }

    const response = await fetchJson(
      'https://api.monobank.ua/personal/client-info',
      { headers: { 'X-Token': preferences.token } }
    )
    assert(response.status === 200, 'Не удалось получить информацию', { response })
    const info = response.body
    const currencies: Record<number, string> = {
      980: 'UAH',
      840: 'USD',
      978: 'EUR'
    }
    const accounts = getArray(info, 'accounts')
      .filter(account => { return getString(account, 'type') === 'fop' })
      .map(account => {
        const currency = currencies[getNumber(account, 'currencyCode')]
        const accountOrCard: AccountOrCard = {
          id: getString(account, 'id'),
          type: AccountType.checking,
          title: `${getString(account, 'iban')} (${currency})`,
          instrument: currency,
          syncIds: [getString(account, 'id')]
        }
        return accountOrCard
      })
    return {
      accounts,
      transactions: ([] as Transaction[]).concat(
        ...await Promise.all(
          accounts.map(async (account, index) => {
            await new Promise(resolve => setTimeout(resolve, index * 60000))
            return (await fetchAccountTransactions(getString(account, 'id')))
              .map((apiTransaction: unknown) => {
                const transaction: Transaction = {
                  hold: null,
                  date: new Date(getNumber(apiTransaction, 'time') * 1000),
                  movements: [
                    {
                      account: { id: getString(account, 'id') },
                      id: getOptString(apiTransaction, 'id') ?? null,
                      sum: getNumber(apiTransaction, 'amount') / 100,
                      fee: 0,
                      invoice: null
                    }
                  ],
                  merchant: {
                    fullTitle: getString(apiTransaction, 'description'),
                    mcc: getOptNumber(apiTransaction, 'mcc') ?? null,
                    location: null
                  },
                  comment: getOptString(apiTransaction, 'comment') ?? null
                }
                return transaction
              })
          })
        )
      )
    }
  }
