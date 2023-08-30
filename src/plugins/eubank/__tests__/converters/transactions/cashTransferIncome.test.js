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
          id: 'MOVEMENT_7725906915',
          type: 'MOVEMENT',
          executionDate: 1589997600000,
          status: 'DONE',
          transactionDate: 1589986606000,
          dateCreated: 1589986606000,
          amount: 75000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ759480015A02266839',
          totalAmount: 75000,
          totalAmountCurrency: 'KZT',
          purpose: 'Note Acceptance KAZ PETROPAVLOVSK 14009 ABYLAY KHANA 26'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1589986606000),
          movements: [
            {
              id: 'MOVEMENT_7725906915',
              account: { id: 'account' },
              invoice: null,
              sum: 75000,
              fee: 0
            },
            {
              id: null,
              account: {
                type: 'cash',
                instrument: 'KZT',
                company: null,
                syncIds: null
              },
              invoice: null,
              sum: -75000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'KAZ PETROPAVLOVSK 14009 ABYLAY KHANA 26'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_8650061168',
          type: 'MOVEMENT',
          executionDate: 1584554400000,
          status: 'DONE',
          transactionDate: 1584617712000,
          dateCreated: 1584617712000,
          amount: 50000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: 50000,
          totalAmountCurrency: 'KZT',
          purpose: 'Note Acceptance KAZ KOSTANAY 07014 KAIRBEKOVA 379'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1584617712000),
          movements: [
            {
              id: 'MOVEMENT_8650061168',
              account: { id: 'account' },
              invoice: null,
              sum: 50000,
              fee: 0
            },
            {
              id: null,
              account: {
                type: 'cash',
                instrument: 'KZT',
                company: null,
                syncIds: null
              },
              invoice: null,
              sum: -50000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'KAZ KOSTANAY 07014 KAIRBEKOVA 379'
        }
      ]
    ]
  ])('converts cash transfer outcome', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account)).toEqual(transaction)
  })
})
