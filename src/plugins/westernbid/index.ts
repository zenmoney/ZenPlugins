/**
 * @author Belyaev Vitaliy <vbelyaev2005@gmail.com>
 */
import { AccountType, ScrapeFunc } from '../../types/zenmoney'
import { fetchJson } from '../../common/network'
import { getArray, getNumber, getString } from '../../types/get'
import { range } from 'lodash'

export const scrape: ScrapeFunc<{ login: string, auth: string }> =
  async ({ preferences, fromDate, toDate }) => {
    async function fetchPage (page: number): Promise<unknown> {
      function dateToString (date: Date): string {
        return `${date.getUTCFullYear()}.${date.getUTCMonth() + 1}.${date.getUTCDate()}`
      }

      const response = await fetchJson(
        'https://www.westernbid.info/api/v1/balance/GetTransactions' +
        `?request.pageNr=${page}` +
        `&request.pageSize=${500}` +
        `&request.fromUtc=${dateToString(fromDate)}` +
        (toDate ? `&request.toUtc=${dateToString(toDate)}` : ''),
        {
          headers: {
            Login: preferences.login,
            Authorization: preferences.auth
          }
        }
      )
      assert(response.status === 200, 'Не удалось получить транзакции', { response })
      return response.body
    }

    const first = await fetchPage(1)
    const pages = [
      first, ...await Promise.all(range(2, getNumber(first, 'TotalPages') + 1)
        .map(async page => { return await fetchPage(page) }))
    ]
    return {
      accounts: [
        {
          id: '0',
          type: AccountType.checking,
          title: 'default',
          instrument: 'USD',
          syncIds: ['0000']
        }
      ],
      transactions: pages
        .flatMap(page => getArray(page, 'Data'))
        .map(transaction => {
          let fee = getNumber(transaction, 'amtFee') + getNumber(transaction, 'MBISFee')
          fee = Math.round(fee * 100) / 100
          return {
            date: new Date(getString(transaction, 'TransactionDate')),
            movements: [
              {
                account: { id: '0' },
                id: transaction.TransactionId || null,
                sum: getNumber(transaction, 'amtNet'),
                fee: 0,
                invoice: null
              }
            ],
            comment: fee !== 0 ? `Комиссия: $${fee}` : null,
            hold: null,
            merchant: null
          }
        })
    }
  }
