import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        amount: '5,27',
        amountReal: '5,27',
        authCode: '368386',
        cardNum: '1111',
        currency: 'BYN',
        currencyReal: 'BYN',
        date: '17.09.2021 23:20',
        description: 'Перевод с карты на карту (списание, Интернет-банк)',
        mcc: '6538',
        place: 'BY PEREVOD NA 518597******2222, INTERNET',
        type: 'СПИСАНИЕ'
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['1111']
      },
      {
        date: new Date('2021-09-17T23:20:00+0300'),
        movements:
          [
            {
              id: null,
              account: { id: 'account' },
              invoice: null,
              sum: -5.27,
              fee: 0
            }
          ],
        merchant: null,
        comment: null,
        hold: false,
        groupKeys: [
          '2021-09-17T23:20_BYN_5.27'
        ]
      }
    ],
    [
      {
        amount: '5,27',
        amountReal: '5,27',
        authCode: '368390',
        cardNum: '2222',
        currency: 'BYN',
        currencyReal: 'BYN',
        date: '17.09.2021 23:20',
        description: 'Перевод с карты на карту (зачисление, Интернет-банк)',
        mcc: null,
        place: 'BY PEREVOD S 518597******1111, INTERNET',
        type: 'ЗАЧИСЛЕНИЕ'
      },
      {
        id: 'account1',
        instrument: 'BYN',
        syncID: ['2222']
      },
      {
        date: new Date('2021-09-17T23:20:00+0300'),
        movements:
          [
            {
              id: null,
              account: { id: 'account1' },
              invoice: null,
              sum: 5.27,
              fee: 0
            }
          ],
        merchant: null,
        comment: null,
        hold: false,
        groupKeys: [
          '2021-09-17T23:20_BYN_5.27'
        ]
      }
    ]
  ])('converts inner transfer', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
