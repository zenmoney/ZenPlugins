import { convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  const account = {
    id: '11161311-117d11',
    transactionsAccId: null,
    type: 'card',
    title: 'Расчетная карточка*1111',
    currencyCode: '840',
    cardNumber: '529911******1111',
    instrument: 'USD',
    balance: 0,
    syncID: ['1111'],
    productType: 'MS'
  }

  const tt = [
    {
      name: 'add money internet',
      transaction: {
        amountReal: 1600.00,
        authCode: '264505',
        cardNum: '1111',
        currencyReal: 'USD',
        date: '18.01.2019',
        description: 'ZACHISLENIYE NA SCHET',
        mcc: '↵',
        place: 'STATE, PLACE, STATUSBANK',
        type: 'ZACHISLENIYE NA SCHET'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-01-18T00:00:00.000Z'),
        hold: false,
        merchant: {
          location: null,
          mcc: null,
          fullTitle: 'STATUSBANK'
        },
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 1600.00
            }
          ]
      }
    },
    {
      name: 'internet expense',
      transaction: {
        amount: -300.00,
        amountReal: -250.00,
        authCode: '357178',
        cardNum: '1111',
        currency: 'USD',
        currencyReal: 'EUR',
        date: '02.01.2019',
        description: 'OPLATA',
        mcc: '1200',
        place: 'GB SHOP, DOUGLAS',
        type: 'OPLATA'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-01-02T00:00:00.000Z'),
        hold: false,
        merchant: {
          city: 'DOUGLAS',
          country: 'GB',
          location: null,
          mcc: 1200,
          title: 'SHOP'
        },
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: null,
              invoice: {
                instrument: 'EUR',
                sum: -250.00
              },
              sum: -300.00
            }
          ]
      }
    }
  ]

  // run all tests
  for (const tc of tt) {
    it(tc.name, () => {
      const transaction = convertTransaction(tc.transaction, account)

      expect(transaction).toEqual(tc.expectedTransaction)
    })
  }
})
