import { parseTransactions } from '../../../api'

describe('parseTransactions', () => {
  it.each([
    [
      require('./holds.html'),
      [
        {
          accountID: 'accountId',
          comment: 'Покупка/оплата/перевод',
          date: '23.03.2020',
          debitFlag: '-',
          fee: '0.00',
          inAccountCurrency: 'BYN',
          inAccountSum: '2.73',
          operationCurrency: 'BYN',
          operationSum: '2.73',
          place: 'STOLOVAYA N1&gt;GRODNOBY/5812',
          status: 'hold',
          time: '11:24:31'
        }
      ]
    ]
  ])('parses transactions', (html, transactions) => {
    expect(parseTransactions(html, 'accountId', 'hold')).toEqual(transactions)
  })
})
