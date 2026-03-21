import { convertTransactions } from '../../../converters'

describe('convertTransactions', () => {
  const account = {
    id: 'account',
    instrument: 'MDL'
  }
  const cardsByLastFourDigits = {
    9473: {
      lastFour: '9473',
      account
    },
    1578: {
      lastFour: '9473',
      account
    },
    8512: {
      lastFour: '8512',
      account
    },
    6488: {
      lastFour: '8085',
      account
    }
  }
  const accountsById = {
    22523572766: {
      id: '22523572766'
    }
  }
  it.each([
    [
      [
        {
          id: '6E285632-3D8D-4B86-B1B1-1B2E070D0F80',
          amount: 4446.67,
          date: 1598274559000,
          cardLast4digits: '1578',
          ccy: 'MDL',
          description: 'MAIB BANK A2A>CHISINAU                MD',
          type: 7,
          details: '<details type="c2a_a2c" v="1.0"><account/><note/></details>',
          balanceAfter: 965.52,
          amountInCardCurrency: 4446.67,
          exchangeRate: 1,
          origin: {},
          categoryId: '9',
          rrn: '023713427418',
          approvalCode: '461445',
          mdlAmountCents: {
            isPresent: true,
            value: 444667
          }
        }
      ],
      [
        {
          hold: false,
          date: new Date(1598274559000),
          movements: [
            {
              id: '6E285632-3D8D-4B86-B1B1-1B2E070D0F80',
              account: { id: 'account' },
              invoice: null,
              sum: -4446.67,
              fee: 0
            },
            {
              id: null,
              account: {
                type: 'ccard',
                instrument: 'MDL',
                company: null,
                syncIds: null
              },
              invoice: null,
              sum: 4446.67,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: ['4446.67-159827455']
        }
      ]
    ],
    [
      [
        {
          id: '51871AE2-FB06-4F79-93FE-A51D0EE3E11E',
          amount: 10,
          date: 1598952172000,
          cardLast4digits: '8512',
          ccy: 'MDL',
          description: 'MAIB BANK A2A>CHISINAU MD',
          type: 8,
          details: '<details type="c2a_a2c" v="1.0"><account>22523572766</account><note/></details>',
          balanceAfter: 208.23,
          amountInCardCurrency: 10,
          exchangeRate: 1,
          origin: {},
          categoryId: '9',
          rrn: '024509661744',
          approvalCode: '635113',
          mdlAmountCents: {
            isPresent: true,
            value: 1000
          }
        }
      ],
      [
        {
          hold: false,
          date: new Date(1598952172000),
          movements: [
            {
              id: '51871AE2-FB06-4F79-93FE-A51D0EE3E11E',
              account: { id: 'account' },
              invoice: null,
              sum: -10,
              fee: 0
            },
            {
              id: null,
              account: { id: '22523572766' },
              invoice: null,
              sum: 10,
              fee: 0
            }
          ],
          merchant: null,
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'B076DFA6-06DF-417F-98D3-A0D4FF390E00',
          amount: 3000,
          date: 1681908083000,
          cardLast4digits: '9473',
          ccy: 'MDL',
          description: 'MAIB BANK A2A>CHISINAU MD',
          type: 11,
          details: '<details type="iban_payment" v="1.0"><urgency>normal</urgency><destinationIban>MD24AG000000022522247208</destinationIban><destinationName>Agafonova Natalia</destinationName><destinationCode>0981506886704</destinationCode><destinationBic>AGRNMD2X</destinationBic><note/></details>',
          balanceAfter: 3031.47,
          amountInCardCurrency: 3000,
          exchangeRate: 1,
          origin: { deviceName: 'iPhone 14 Pro Max' },
          categoryId: '9',
          rrn: '310912114767',
          approvalCode: '455974',
          mdlAmountCents: {},
          chargebackState: 2,
          status: 1
        }
      ],
      [
        {
          date: new Date('2023-04-19T12:41:23.000Z'),
          hold: false,
          merchant: null,
          movements: [
            {
              account: { id: 'account' },
              fee: 0,
              id: 'B076DFA6-06DF-417F-98D3-A0D4FF390E00',
              invoice: null,
              sum: -3000
            },
            {
              account: {
                type: 'ccard',
                instrument: 'MDL',
                company: null,
                syncIds: [
                  'MD24AG000000022522247208'
                ]
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 3000
            }
          ],
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: '03A909DB-EA44-44FC-AF91-805AD32E75C6',
          amount: 470.42,
          date: 1760775126000,
          cardLast4digits: '6488',
          ccy: 'MDL',
          description: 'A2A de iesire pe cardul 524639***6488',
          type: 1,
          amountInCardCurrency: 470.42,
          exchangeRate: 1,
          origin: {},
          categoryId: '6',
          mdlAmountCents: {
            isPresent: true,
            value: 47042
          },
          chargebackState: 1,
          status: 2
        }
      ],
      [
        {
          comment: null,
          date: new Date('2025-10-18T08:12:06.000Z'),
          hold: false,
          merchant: null,
          movements: [
            {
              account: { id: 'account' },
              fee: 0,
              id: '03A909DB-EA44-44FC-AF91-805AD32E75C6',
              invoice: null,
              sum: -470.42
            },
            {
              account: {
                company: null,
                instrument: 'MDL',
                syncIds: null,
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 470.42
            }
          ],
          groupKeys: ['470.42-176077512']
        }
      ]
    ]
  ])('converts inner outcome transfers', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, cardsByLastFourDigits, accountsById)).toEqual(transactions)
  })
})
