import { parseTransactions } from '../../fetchApi'
import { loadHtmlFile } from '../../helpers'

const transactionsBody = loadHtmlFile('__tests__/parsers/transactions.html')

describe('parseTransactions', () => {
  it.each([
    [
      transactionsBody,
      [
        {
          isPending: false,
          date: new Date(2024, 10, 18),
          title: 'ApplePay MP302 CUBURSKA, BEOGRAD',
          amount: -259.98,
          currency: 'RSD'
        },
        {
          isPending: false,
          date: new Date(2024, 8, 10),
          title: 'ApplePay SHIO-RAMEN, TBILISI',
          amount: -8.08,
          currency: 'EUR'
        },
        {
          isPending: false,
          date: new Date(2024, 10, 30),
          title: 'FRIENDLY DONATE',
          amount: 15000,
          currency: 'RSD'
        }
      ]
    ]
  ])('parses transactions', (transactionsBody, transactionsArray) => {
    expect(parseTransactions(transactionsBody, false)).toEqual(transactionsArray)
  })
})
