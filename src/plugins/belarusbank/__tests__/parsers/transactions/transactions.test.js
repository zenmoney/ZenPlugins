import { parseTransactions } from '../../../api'

describe('parseTransactions', () => {
  it.each([
    [
      require('./transactions.html'),
      [
        {
          'accountID': 'accountId',
          'comment': 'Ежемесячная капитализация',
          'date': '31.01.2020',
          'debitFlag': '+',
          'fee': '0.00',
          'inAccountCurrency': 'BYN',
          'inAccountSum': '0.03',
          'operationCurrency': 'BYN',
          'operationSum': '0.03',
          'place': undefined,
          'status': 'operResultOk',
          'time': '00:00:00'
        },
        {
          'accountID': 'accountId',
          'comment': 'Покупка/оплата/перевод',
          'date': '01.02.2020',
          'debitFlag': '-',
          'fee': '0.00',
          'inAccountCurrency': 'BYN',
          'inAccountSum': '27.00',
          'operationCurrency': 'BYN',
          'operationSum': '27.00',
          'place': 'KIOSK N400143 BAPB/5993',
          'status': 'operResultOk',
          'time': '12:14:27'
        }
      ]
    ]
  ])('parses transactions', (html, transactions) => {
    expect(parseTransactions(html, 'accountId', 'operResultOk')).toEqual(transactions)
  })
})
