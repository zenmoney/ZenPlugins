import { parseTransactions } from '../../../api'

describe('parseTransactions', () => {
  it.each([
    [
      require('./transactions.html'),
      [
        {
          accountID: 'accountId',
          comment: 'Ежемесячная капитализация',
          date: '31.01.2020',
          debitFlag: '+',
          fee: '0.00',
          inAccountCurrency: 'BYN',
          inAccountSum: '0.03',
          operationCurrency: 'BYN',
          operationSum: '0.03',
          place: undefined,
          status: 'operResultOk',
          time: '00:00:00'
        },
        {
          accountID: 'accountId',
          comment: 'Покупка/оплата/перевод',
          date: '01.02.2020',
          debitFlag: '-',
          fee: '0.00',
          inAccountCurrency: 'BYN',
          inAccountSum: '27.00',
          operationCurrency: 'BYN',
          operationSum: '27.00',
          place: 'KIOSK N400143 BAPB/5993',
          status: 'operResultOk',
          time: '12:14:27'
        }
      ]
    ]
  ])('parses transactions with page count', (html, transactions) => {
    expect(parseTransactions(html, 'accountId', 'operResultOk')).toEqual(transactions)
  })

  it.each([
    [
      require('./transactions_only1page.html'),
      [
        {
          accountID: 'accountId',
          comment: 'Безналичное зачисление на счет',
          date: '21.08.2020',
          debitFlag: '+',
          fee: '0.00',
          inAccountCurrency: 'BYN',
          inAccountSum: '427.84',
          operationCurrency: 'BYN',
          operationSum: '427.84',
          place: 'УЗ ПИНСКАЯ ДЕТСКАЯ БОЛЬНИЦА (клиент-банк/',
          status: 'operResultOk',
          time: '00:00:00'
        },
        {
          accountID: 'accountId',
          comment: 'Покупка/оплата/перевод',
          date: '22.08.2020',
          debitFlag: '-',
          fee: '0.00',
          inAccountCurrency: 'BYN',
          inAccountSum: '425.85',
          operationCurrency: 'BYN',
          operationSum: '425.85',
          place: 'PEREVOD/6012',
          status: 'operResultOk',
          time: '19:47:21'
        },
        {
          accountID: 'accountId',
          comment: 'Покупка/оплата/перевод',
          date: '23.08.2020',
          debitFlag: '-',
          fee: '0.00',
          inAccountCurrency: 'BYN',
          inAccountSum: '1.99',
          operationCurrency: 'BYN',
          operationSum: '1.99',
          place: 'ERIP/4900',
          status: 'operResultOk',
          time: '08:19:44'
        }
      ]
    ]
  ])('parses transactions without page count', (html, transactions) => {
    expect(parseTransactions(html, 'accountId', 'operResultOk')).toEqual(transactions)
  })

  it.each([
    [
      require('./0_transactions.html'),
      []
    ]
  ])('parses 0 transactions', (html, transactions) => {
    expect(parseTransactions(html, 'accountId', 'operResultOk')).toEqual(transactions)
  })
})
