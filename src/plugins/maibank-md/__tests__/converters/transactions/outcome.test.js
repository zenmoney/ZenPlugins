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
    8040: {
      lastFour: '8040',
      account
    },
    3171: {
      lastFour: '3171',
      account
    },
    9124: {
      lastFour: '9124',
      account
    },
    3040: {
      lastFour: '3040',
      account
    }
  }
  it.each([
    [
      [{
        amount: 50,
        amountInCardCurrency: 50,
        approvalCode: '194673',
        balanceAfter: 116.44,
        cardLast4digits: '9473',
        categoryId: '4',
        ccy: 'MDL',
        date: 1597829134000,
        description: 'MAIB APP ORANGE>CHISINAU              MD',
        details: '<details v="bill_info-1.1"><providerTitle>ORANGE</providerTitle><providerLogoUrl>https://pay.maib.md/MAIBankService/static/providers/https://pay.maib.md/MAIBankService/static/providers/orange.png</providerLogoUrl><clientId>69599588</clientId><counterNames/><counterValues/></details>',
        exchangeRate: 1,
        id: 'EF25B857-FC9B-41D2-8592-DBFFB963E5DD',
        mdlAmountCents: {
          isPresent: true,
          value: 5000
        },
        origin: {
          deviceName: 'Mi Note 3'
        },
        rrn: '023209888061',
        type: 1
      },
      {
        amount: 0,
        balanceAfter: 1656
      }],
      [{
        hold: false,
        date: new Date(1597829134000),
        movements: [
          {
            id: 'EF25B857-FC9B-41D2-8592-DBFFB963E5DD',
            account: { id: 'account' },
            invoice: null,
            sum: -50.0,
            fee: 0
          }
        ],
        merchant: {
          title: 'APP ORANGE',
          city: 'CHISINAU',
          country: 'MD',
          location: null,
          mcc: null
        },
        comment: null
      }]
    ],
    [
      [{
        amount: 33000,
        amountInCardCurrency: 33000,
        approvalCode: '368769',
        balanceAfter: 166.44,
        cardLast4digits: '9473',
        categoryId: '9',
        ccy: 'MDL',
        date: 1597747984000,
        description: 'POS MAIB CENTRU>BALTI                 MD',
        exchangeRate: 1,
        id: '551C0CD6-712E-47CC-97D7-5C3453DBC8E0',
        mdlAmountCents: {
          isPresent: true,
          value: 3300000
        },
        origin: { },
        rrn: '023110588297',
        type: 3
      },
      {
        amount: 0,
        balanceAfter: 33166
      }],
      [{
        hold: false,
        date: new Date(1597747984000),
        movements: [
          {
            id: '551C0CD6-712E-47CC-97D7-5C3453DBC8E0',
            account: { id: 'account' },
            invoice: null,
            sum: -33000.0,
            fee: 0
          }
        ],
        merchant: {
          title: 'POS MAIB CENTRU',
          city: 'BALTI',
          country: 'MD',
          location: null,
          mcc: null
        },
        comment: null
      }]
    ],
    [
      [{
        amount: 10,
        balanceAfter: 38166.44,
        cardLast4digits: '9473',
        categoryId: '6',
        ccy: 'MDL',
        date: 1597117425000,
        description: 'DIFERENT PAYMENT FROM ACCOUNT         ',
        exchangeRate: 1,
        id: '1DE8075E-20D8-4DAE-8284-0ACF3102FAF4',
        mdlAmountCents: {
          isPresent: true,
          value: 1000
        },
        origin: { },
        type: 3
      },
      {
        amount: 0,
        balanceAfter: 38176
      }],
      [{
        hold: false,
        date: new Date(1597117425000),
        movements: [
          {
            id: '1DE8075E-20D8-4DAE-8284-0ACF3102FAF4',
            account: { id: 'account' },
            invoice: null,
            sum: -10.0,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'DIFERENT PAYMENT FROM ACCOUNT'
      }]
    ],
    [
      [{
        amount: 9130.5,
        balanceAfter: 38109.23,
        cardLast4digits: '9473',
        categoryId: '6',
        ccy: 'MDL',
        date: 1596700685000,
        description: 'CARDHOLDER PAYMENTS                   ',
        details: '<details type="t2c" v="1.0"><uin/><providerName/></details>',
        exchangeRate: 1,
        id: '2789B526-25FE-4551-9340-4868EFB28E51',
        mdlAmountCents: {
          isPresent: true,
          value: 913050
        },
        origin: {}
      },
      {
        amount: 0,
        balanceAfter: 49000
      }],
      [{
        hold: false,
        date: new Date(1596700685000),
        movements: [
          {
            id: '2789B526-25FE-4551-9340-4868EFB28E51',
            account: { id: 'account' },
            invoice: null,
            sum: -9130.5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'CARDHOLDER PAYMENTS'
      }]
    ],
    [
      [{
        id: 'E841409C-7202-4C8A-B500-C1BD67EC3E11',
        amount: 50,
        date: 1593667581000,
        cardLast4digits: '9473',
        ccy: 'MDL',
        description: 'MAIB APP ORANGE>CHISINAU              MD',
        type: 5,
        balanceAfter: 21449.01,
        amountInCardCurrency: 50,
        exchangeRate: 1,
        origin: {},
        categoryId: '4',
        rrn: '018405335484',
        approvalCode: '381987',
        mdlAmountCents: { isPresent: true, value: 5000 }
      },
      {
        amount: 0,
        balanceAfter: 21500
      }],
      [{
        hold: false,
        date: new Date(1593667581000),
        movements: [
          {
            id: 'E841409C-7202-4C8A-B500-C1BD67EC3E11',
            account: { id: 'account' },
            invoice: null,
            sum: -50,
            fee: 0
          }
        ],
        merchant: {
          title: 'APP ORANGE',
          city: 'CHISINAU',
          country: 'MD',
          location: null,
          mcc: null
        },
        comment: null
      }]
    ],
    [
      [{
        id: '94DA6B04-F648-4EF6-A576-16703B0E4489',
        amount: 365,
        date: 1599762586000,
        cardLast4digits: '8040',
        ccy: 'MDL',
        description: 'MAIB PIZZA MANIA IZMAIL>CHISINAU MD',
        type: 9,
        details: '<details v="installment-1.0"><installmentId/><merchantLogoUrl/><merchantName>PIZZA MANIA</merchantName><monthlyPayment>365.0000</monthlyPayment><totalMonths>1</totalMonths><firstPaymentDate>2020-10-18</firstPaymentDate></details>',
        balanceAfter: 11728.78,
        amountInCardCurrency: 365,
        exchangeRate: 1,
        origin: {},
        categoryId: '3',
        rrn: '025418120673',
        approvalCode: '344619',
        mdlAmountCents: { isPresent: true, value: 36500 }
      },
      {
        id: 'E81AB577-B2C7-4A26-9877-15BFF2E44F1D',
        amount: 15.85,
        date: 1595419568000,
        cardLast4digits: '8040', // '3171',
        ccy: 'MDL',
        description: '"LINELLA 62" market B>Floresti (or MD',
        type: 1,
        balanceAfter: 11800,
        amountInCardCurrency: 15.85,
        exchangeRate: 1,
        origin: {},
        categoryId: '11',
        rrn: '020401672445',
        approvalCode: '989917',
        mdlAmountCents: { isPresent: true, value: 1585 }
      },
      {
        cardLast4digits: '8040',
        amount: 0,
        balanceAfter: 12000
      }],
      [
        {
          hold: false,
          date: new Date(1599762586000),
          movements: [
            {
              id: '94DA6B04-F648-4EF6-A576-16703B0E4489',
              account: { id: 'account' },
              invoice: null,
              sum: -365,
              fee: 0
            }
          ],
          merchant: {
            title: 'PIZZA MANIA IZMAIL',
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null
          },
          comment: null
        },
        {
          hold: false,
          date: new Date(1595419568000),
          movements: [
            {
              id: 'E81AB577-B2C7-4A26-9877-15BFF2E44F1D',
              account: { id: 'account' },
              invoice: null,
              sum: -15.85,
              fee: 0
            }
          ],
          merchant: {
            title: '"LINELLA 62" market B',
            city: 'Floresti',
            country: 'MD',
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
          id: '9FAA61CA-4BF5-43D0-9AE6-22C4388E78D7',
          amount: 6.5,
          date: 1570534221000,
          cardLast4digits: '3040',
          ccy: 'EUR',
          description: 'GATE RETAIL WIZZ>CAPABILITY GR GB',
          type: 1,
          balanceAfter: 1086.59,
          exchangeRate: 1,
          origin: {},
          categoryId: '6',
          mdlAmountCents: { isPresent: true, value: 12630 }
        },
        {
          amount: 0,
          balanceAfter: 2000
        }
      ],
      [
        {
          hold: false,
          date: new Date(1570534221000),
          movements: [
            {
              id: '9FAA61CA-4BF5-43D0-9AE6-22C4388E78D7',
              account: { id: 'account' },
              invoice: {
                instrument: 'EUR',
                sum: -6.5
              },
              sum: -126.3,
              fee: 0
            }
          ],
          merchant: {
            title: 'GATE RETAIL WIZZ',
            city: 'CAPABILITY GR',
            country: 'GB',
            location: null,
            mcc: null
          },
          comment: null
        }
      ]
    ]
  ])('converts outcome', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, cardsByLastFourDigits)).toEqual(transactions)
  })
})
