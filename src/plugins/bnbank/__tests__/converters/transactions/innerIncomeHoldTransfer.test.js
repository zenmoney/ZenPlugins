import { convertTransaction } from '../../../converters'

const accounts = [
  {
    balance: 952.93,
    currencyCode: '933',
    id: '3001779330081234',
    instrument: 'BYN',
    rkcCode: '5761',
    syncID: ['1234'],
    title: 'Цифровая карта 1-2-3, BYN',
    type: 'card'
  }
]

describe('convertTransaction', () => {
  it.each([
    [
      {
        operationPlace: 'BNB PEREVOD',
        merchantId: '6012',
        transactionAuthCode: '487643',
        operationDate: 1663922197000,
        transactionAmount: 214.81,
        transactionCurrency: '933',
        operationAmount: 214.81,
        operationCurrency: '933',
        operationSign: '1',
        operationType: 6,
        cardPAN: '5*** **** **** 1234'
      },
      {
        date: new Date('2022-09-23T08:36:37.000Z'),
        movements:
          [
            {
              id: '487643',
              account: { id: '3001779330081234' },
              invoice: null,
              sum: 214.81,
              fee: 0
            }
          ],
        merchant: null,
        comment: null,
        hold: true,
        groupKeys: [
          '2022-09-23_BYN_214.81'
        ]
      }
    ]
  ])('converts inner income hold transfer', (apiTransaction, transaction) => {
    expect(convertTransaction({
      accountNumber: '1234',
      ...apiTransaction
    }, accounts, true)).toEqual(transaction)
  })
})
