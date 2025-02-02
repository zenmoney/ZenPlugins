import { convertTransactions } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'KZT'
  }
  it.each([
    [
      [
        {
          id: 'MOVEMENT_9032932014',
          type: 'MOVEMENT',
          executionDate: 1588528800000,
          status: 'DONE',
          transactionDate: 1588399266000,
          dateCreated: 1588399266000,
          amount: 930.43,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: 930.43,
          totalAmountCurrency: 'KZT',
          purpose: 'Трата Бонусов   '
        }
      ],
      [
        {
          hold: false,
          date: new Date(1588399266000),
          movements: [
            {
              id: 'MOVEMENT_9032932014',
              account: { id: 'account' },
              invoice: null,
              sum: 930.43,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Трата Бонусов'
        }
      ]
    ],
    [
      [
        {
          id: 'RESERVED_AMOUNT_9032932014',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
          status: 'RESERVED',
          dateCreated: 1588399266000,
          personId: 0,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: '',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '',
          dateSigned: null,
          secoId: '',
          transferMethodId: '',
          amount: -80.09,
          amountCurrency: 'USD',
          totalAmount: 1096.05,
          totalAmountCurrency: 'KZT',
          purpose: 'Retail ESP Celra Tradeinn Retal Service'
        }
      ],
      [
        {
          hold: true,
          date: new Date(1588399266000),
          movements: [
            {
              id: 'RESERVED_AMOUNT_9032932014',
              account: { id: 'account' },
              invoice: null,
              sum: 1096.05,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'ESP Celra Tradeinn Retal Service',
            location: null,
            mcc: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_3797748924',
          type: 'MOVEMENT',
          executionDate: 1588199940000,
          status: 'DONE',
          transactionDate: 1588199940000,
          dateCreated: 1588199940000,
          amount: 36.01,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ16948KZT126070014G',
          totalAmount: 36.01,
          totalAmountCurrency: 'KZT',
          purpose: 'Проценты, начисленные на 30.04.2020'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1588199940000),
          movements: [
            {
              id: 'MOVEMENT_3797748924',
              account: { id: 'account' },
              invoice: null,
              sum: 36.01,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Проценты, начисленные на 30.04.2020'
        }
      ]
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account)).toEqual(transaction)
  })
})
