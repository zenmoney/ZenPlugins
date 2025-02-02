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
    }
  }
  it.each([
    [
      [
        {
          id: '4CD97298-2A13-46C5-AB37-B82047B49466',
          amount: 2000,
          date: 1603556124000,
          cardLast4digits: '8085',
          ccy: 'MDL',
          description: 'ATM MAIB CASH IN SUN CITY>CHISINAU MD',
          details: '<details type="t2c" v="1.0"><uin/><providerName/></details>',
          balanceAfter: 7326,
          amountInCardCurrency: 2000,
          exchangeRate: 1,
          origin: {},
          categoryId: '9',
          rrn: '029816726505',
          approvalCode: '934635',
          mdlAmountCents: { isPresent: true, value: 200000 }
        },
        {
          amount: 0,
          balanceAfter: 5660.63
        }
      ],
      [{
        hold: false,
        date: new Date(1603556124000),
        movements: [
          {
            id: '4CD97298-2A13-46C5-AB37-B82047B49466',
            account: { id: 'account' },
            invoice: null,
            sum: 2000.0,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'MDL',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -2000.0,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }]
    ],
    [
      [
        {
          id: '60FDF827-FD62-4A2A-9D5F-D9B8A74CA040',
          amount: 5000,
          date: 1603556009000,
          cardLast4digits: '8085',
          ccy: 'MDL',
          description: 'ATM MAIB CASH IN SUN CITY>CHISINAU MD',
          details: '<details type="t2c" v="1.0"><uin/><providerName/></details>',
          balanceAfter: 5326,
          amountInCardCurrency: 5000,
          exchangeRate: 1,
          origin: {},
          categoryId: '9',
          rrn: '029816725990',
          approvalCode: '976699',
          mdlAmountCents: { isPresent: true, value: 500000 }
        },
        {
          amount: 0,
          balanceAfter: 300
        }
      ],
      [{
        hold: false,
        date: new Date(1603556009000),
        movements: [
          {
            id: '60FDF827-FD62-4A2A-9D5F-D9B8A74CA040',
            account: { id: 'account' },
            invoice: null,
            sum: 5000.0,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'MDL',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -5000.0,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }]
    ],
    [
      [
        {
          id: '7162D62C-C4DB-4110-AE75-23B63EA75625',
          amount: 1000,
          date: 1602344093000,
          cardLast4digits: '8085',
          ccy: 'MDL',
          description: 'CASH IN PRIMARIA>CHISINAU MD',
          details: '<details type="t2c" v="1.0"><uin/><providerName/></details>',
          balanceAfter: 1056.86,
          amountInCardCurrency: 1000,
          exchangeRate: 1,
          origin: {},
          categoryId: '9',
          rrn: '028415314113',
          approvalCode: '843698',
          mdlAmountCents: { isPresent: true, value: 100000 }
        },
        {
          amount: 0,
          balanceAfter: 56
        }
      ],
      [{
        hold: false,
        date: new Date(1602344093000),
        movements: [
          {
            id: '7162D62C-C4DB-4110-AE75-23B63EA75625',
            account: { id: 'account' },
            invoice: null,
            sum: 1000.0,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'MDL',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -1000.0,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }]
    ],
    [
      [
        {
          id: 'F3D88975-2648-4B1B-9DEF-9C486C8905A0',
          amount: 400,
          date: 1605382675000,
          cardLast4digits: '8085',
          ccy: 'MDL',
          description: 'MAIB CASHIN REC SUCURSALA 4>CHISINAU MD',
          details: '<details type="t2c" v="1.0"><uin/><providerName/></details>',
          balanceAfter: 470.85,
          amountInCardCurrency: 400,
          exchangeRate: 1,
          origin: {},
          categoryId: '9',
          rrn: '031919605964',
          approvalCode: '175869',
          mdlAmountCents: { isPresent: true, value: 40000 }
        },
        {
          amount: 0,
          balanceAfter: 70
        }
      ],
      [{
        hold: false,
        date: new Date(1605382675000),
        movements: [
          {
            id: 'F3D88975-2648-4B1B-9DEF-9C486C8905A0',
            account: { id: 'account' },
            invoice: null,
            sum: 400.0,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'MDL',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -400.0,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }]
    ]
  ])('converts cash income transfers', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, cardsByLastFourDigits)).toEqual(transactions)
  })
})
