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
    }
  }
  it.each([
    [
      [{
        amount: 20000,
        amountInCardCurrency: 20000,
        approvalCode: '188118',
        balanceAfter: 166.44,
        cardLast4digits: '9473',
        categoryId: '9',
        ccy: 'MDL',
        date: 1597148105000,
        description: 'P2P>CHISINAU                          MD',
        details: '<details type="p2p" v="p2p-1.3"><sourceCardLast4Digits>9473</sourceCardLast4Digits><sourceCardHolder>NIKOLAY NIKOLAEV</sourceCardHolder><destinationCardLast4Digits>6951</destinationCardLast4Digits><destinationCardHolder>IVAN IVANOV</destinationCardHolder><senderNote/><isSpendP2P>1</isSpendP2P><baseAmount>20000.00</baseAmount><commission>0.00</commission></details>',
        exchangeRate: 1,
        id: 'AF40A59D-D9B5-4EFA-B12E-55AC11886970',
        mdlAmountCents: {
          isPresent: true,
          value: 2000000
        },
        origin: {
          deviceName: 'Mi Note 3'
        },
        rrn: '022412245521',
        type: 2
      },
      {
        amount: 0,
        balanceAfter: 20166
      }],
      [{
        hold: false,
        date: new Date(1597148105000),
        movements: [
          {
            id: 'AF40A59D-D9B5-4EFA-B12E-55AC11886970',
            account: { id: 'account' },
            invoice: null,
            sum: -20000.0,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'MDL',
              company: null,
              syncIds: ['6951']
            },
            invoice: null,
            sum: 20000.0,
            fee: 0
          }
        ],
        merchant: {
          title: 'IVAN IVANOV',
          city: null,
          country: null,
          location: null,
          mcc: null
        },
        comment: null
      }]
    ],
    [
      [{
        amount: 2000,
        amountInCardCurrency: 2000,
        approvalCode: '232381',
        balanceAfter: 14675.95,
        cardLast4digits: '9473',
        categoryId: '9',
        ccy: 'MDL',
        date: 1565094312000,
        description: 'P2P>CHISINAU                          MD',
        exchangeRate: 1,
        id: '036A944F-C885-47FD-895B-CD07CA5027BB',
        mdlAmountCents: {
          isPresent: true,
          value: 200000
        },
        origin: { },
        rrn: '921815272368',
        type: 2
      },
      {
        amount: 0,
        balanceAfter: 16756
      }],
      [{
        hold: false,
        date: new Date(1565094312000),
        movements: [
          {
            id: '036A944F-C885-47FD-895B-CD07CA5027BB',
            account: { id: 'account' },
            invoice: null,
            sum: -2000.0,
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
            sum: 2000.0,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }]
    ]
  ])('converts outer outcome transfers', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, cardsByLastFourDigits)).toEqual(transactions)
  })
})
