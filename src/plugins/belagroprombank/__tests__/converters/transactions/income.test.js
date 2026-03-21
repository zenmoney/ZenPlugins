import { convertTransactions } from '../../../converters'

describe('convertTransactions', () => {
  const account = {
    id: 'account',
    instrument: 'USD',
    type: 'ccard'
  }
  it.each([
    [
      [
        {
          accountType: '3989',
          concreteType: '3989',
          accountNumber: '3989778',
          operationName: 'Капитализация (%% тек.периода ко вкладу)',
          transactionDate: 1594587600000,
          operationDate: 1594587600000,
          operationSum: 0.01,
          operationCurrency: '840',
          operationPercentsSum: 0.00,
          operationPercentsCurrency: '840',
          SumAfterOperaion: 200.30,
          percentSumAfterOperation: 0.00,
          operationDirection: 0
        },
        {
          accountType: '9715', // Можно и обрабатывать эту транзакцию, но не ясно, что будет, если карт у человека больше одной
          concreteType: '9715',
          accountNumber: '9715769',
          operationName: 'On-line открытие договора с использованием сервисов ДБО',
          transactionDate: 1597179600000,
          operationDate: 1597179600000,
          operationSum: 0.00,
          operationCurrency: '840',
          operationPercentsSum: 0.00,
          operationPercentsCurrency: '840',
          SumAfterOperaion: 400.00,
          percentSumAfterOperation: 0.00,
          operationDirection: 0
        }
      ],
      [
        {
          hold: false,
          date: new Date(1594587600000),
          movements: [
            {
              id: '1594587600000_0.01',
              account: { id: 'account' },
              invoice: null,
              sum: 0.01,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Капитализация (%% тек.периода ко вкладу)'
        }
      ]
    ],
    [
      [
        {
          accountType: '0',
          concreteType: '0',
          accountNumber: '3985550',
          operationName: 'Капитализация. Удержано подоходного налога 0.90',
          transactionDate: 1613363520000,
          operationDate: 1613363520000,
          transactionSum: 6.96,
          transactionCurrency: '840',
          operationSum: 6.96,
          operationCurrency: '840',
          operationSign: '1',
          actionGroup: 19,
          clientName: 'Николаев Николай Николаевич',
          operationClosingBalance: 7707.93,
          operationCode: 999
        }
      ],
      [
        {
          hold: false,
          date: new Date(1613363520000),
          movements: [
            {
              id: '1613363520000_6.96',
              account: { id: 'account' },
              invoice: null,
              sum: 6.96,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Капитализация. Удержано подоходного налога 0.90'
        }
      ]
    ],
    [
      [
        {
          operationName: 'Капитализация (%% тек.периода ко вкладу)',
          transactionDate: 1769727031000,
          transactionSum: 0.0,
          transactionCurrency: '840',
          operationSign: '1',
          operationDate: 1769727031000,
          operationSum: 0.42
        }
      ],
      [
        {
          hold: false,
          date: new Date(1769727031000),
          movements: [
            {
              id: '1769727031000_0.42',
              account: { id: 'account' },
              invoice: null,
              sum: 0.42,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Капитализация (%% тек.периода ко вкладу)'
        }
      ]
    ]
  ])('converts income transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account)).toEqual(transaction)
  })
})
