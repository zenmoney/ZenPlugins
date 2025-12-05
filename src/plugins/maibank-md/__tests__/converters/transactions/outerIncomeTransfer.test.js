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
    8085: {
      lastFour: '8085',
      account
    },
    4754: {
      lastFour: '4754',
      account
    }
  }
  it.each([
    [
      [{
        amount: 33000,
        amountInCardCurrency: 33000,
        approvalCode: '159567',
        balanceAfter: 33166.44,
        cardLast4digits: '9473',
        categoryId: '9',
        ccy: 'MDL',
        date: 1597747467000,
        description: 'P2P>CHISINAU                          MD',
        details: '<details type="p2p" v="p2p-1.3"><sourceCardLast4Digits>6951</sourceCardLast4Digits><sourceCardHolder>NIKOLAY NIKOLAEV</sourceCardHolder><destinationCardLast4Digits>9473</destinationCardLast4Digits><destinationCardHolder>IVAN IVANOV</destinationCardHolder><senderNote/><isSpendP2P>0</isSpendP2P><baseAmount>33000.00</baseAmount><commission>0.00</commission></details>',
        exchangeRate: 1,
        id: 'E4144016-D46E-441F-BA43-8313DAE6295E',
        mdlAmountCents: {
          isPresent: true,
          value: 3300000
        },
        origin: { },
        rrn: '023110584684',
        type: 2
      },
      {
        amount: 0,
        balanceAfter: 166
      }],
      [{
        hold: false,
        date: new Date(1597747467000),
        movements: [
          {
            id: 'E4144016-D46E-441F-BA43-8313DAE6295E',
            account: { id: 'account' },
            invoice: null,
            sum: 33000.0,
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
            sum: -33000.0,
            fee: 0
          }
        ],
        merchant: {
          title: 'NIKOLAY NIKOLAEV',
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
        amount: 10566.72,
        amountInCardCurrency: 10566.72,
        approvalCode: '667961',
        balanceAfter: 31293.04,
        cardLast4digits: '9473',
        categoryId: '9',
        ccy: 'MDL',
        date: 1551870633000,
        description: 'P2P>CHISINAU                          MD',
        details: '<details v="p2p-1.1"><sourceCardLast4Digits/><sourceCardHolder/><destinationCardLast4Digits>9473</destinationCardLast4Digits><destinationCardHolder>IVAN IVANOV</destinationCardHolder><senderNote/><isSpendP2P>0</isSpendP2P></details>',
        exchangeRate: 1,
        id: '48780A73-F651-4607-ADA9-32F0599F68DA',
        mdlAmountCents: {
          isPresent: true,
          value: 1056672
        },
        origin: { },
        rrn: '906513150140',
        type: 2
      },
      {
        amount: 0,
        balanceAfter: 21000
      }],
      [{
        hold: false,
        date: new Date(1551870633000),
        movements: [
          {
            id: '48780A73-F651-4607-ADA9-32F0599F68DA',
            account: { id: 'account' },
            invoice: null,
            sum: 10566.72,
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
            sum: -10566.72,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }]
    ],
    [
      [{
        id: '9E627560-451A-4352-A6EC-3228A148F34C',
        amount: 425,
        date: 1606833827000,
        cardLast4digits: '8085',
        ccy: 'MDL',
        description: 'P2P>CHISINAU MD',
        type: 2,
        balanceAfter: 495.63,
        amountInCardCurrency: 425,
        exchangeRate: 1,
        origin: {},
        categoryId: '9',
        rrn: '033614582085',
        approvalCode: '533692',
        mdlAmountCents: { isPresent: true, value: 42500 }
      },
      {
        cardLast4digits: '8085',
        amount: 0,
        balanceAfter: 25
      }],
      [{
        hold: false,
        date: new Date(1606833827000),
        movements: [
          {
            id: '9E627560-451A-4352-A6EC-3228A148F34C',
            account: { id: 'account' },
            invoice: null,
            sum: 425,
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
            sum: -425,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }]
    ],
    [
      [{
        id: 'B294A24C-EC0E-48F7-9428-4EEA476D4068',
        amount: 177,
        date: 1612540061000,
        cardLast4digits: '9473',
        ccy: 'MDL',
        description: 'P2P>CHISINAU MD',
        type: 2,
        details: '<details type="p2p" v="p2p-1.3"><sourceCardLast4Digits>7785</sourceCardLast4Digits><sourceCardHolder>NIKOLAY NIKOLAEV</sourceCardHolder><destinationCardLast4Digits>9473</destinationCardLast4Digits><destinationCardHolder>IVAN IVANOV</destinationCardHolder><senderNote>за телефон</senderNote><isSpendP2P>0</isSpendP2P><baseAmount>177.00</baseAmount><commission>0.00</commission></details>',
        balanceAfter: 23168.61,
        amountInCardCurrency: 177,
        exchangeRate: 1,
        origin: {},
        categoryId: '9',
        rrn: '103615971167',
        approvalCode: '128874',
        mdlAmountCents: { isPresent: true, value: 17700 }
      }],
      [{
        hold: false,
        date: new Date(1612540061000),
        movements: [
          {
            id: 'B294A24C-EC0E-48F7-9428-4EEA476D4068',
            account: { id: 'account' },
            invoice: null,
            sum: 177,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'MDL',
              company: null,
              syncIds: ['7785']
            },
            invoice: null,
            sum: -177,
            fee: 0
          }
        ],
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'NIKOLAY NIKOLAEV'
        },
        comment: null
      }]
    ],
    [
      [
        {
          id: 'FEFC174A-D6F7-4C80-8187-B932CB34B059',
          amount: 470.42,
          date: 1760775126000,
          cardLast4digits: '4754',
          ccy: 'MDL',
          description: 'A2A de intrare pe cardul 435696***4754',
          balanceAfter: 1209.8,
          amountInCardCurrency: 470.42,
          exchangeRate: 1,
          origin: {},
          categoryId: '6',
          mdlAmountCents: {
            isPresent: true,
            value: 47042
          },
          chargebackState: 2,
          status: 2
        },
        {
          cardLast4digits: '4754',
          amount: 0,
          balanceAfter: 739.38
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
              id: 'FEFC174A-D6F7-4C80-8187-B932CB34B059',
              invoice: null,
              sum: 470.42
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
              sum: -470.42
            }
          ],
          groupKeys: ['470.42-176077512']
        }
      ]
    ]
  ])('converts outer income transfers', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, cardsByLastFourDigits)).toEqual(transactions)
  })
})
