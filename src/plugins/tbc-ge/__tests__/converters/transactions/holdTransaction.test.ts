import { convertBlockedMovementTransaction } from '../../../legacy/converters'
import { debitCardGEL } from '../../../common-tests/accounts'

it.each([
  [
    {
      dateTime: 1648392834000,
      location: 'Glovo>Tbilisi GE',
      operationAmount: 91.5,
      operationCurrency: 'GEL',
      blockedAmount: 91.5,
      blockedCurrency: 'GEL',
      reversal: false,
      credit: false
    },
    {
      comment: null,
      date: new Date('2022-03-27T14:53:54.000Z'),
      hold: true,
      merchant: {
        city: 'Tbilisi',
        country: 'GE',
        location: null,
        mcc: null,
        title: 'Glovo'
      },
      movements: [
        {
          account: {
            id: '10971234'
          },
          fee: 0,
          id: null,
          invoice: null,
          sum: -91.5
        }
      ]
    }
  ],
  [
    {
      dateTime: 1648832347000,
      location: 'i.m Maguli Dimitradze>batumi GE',
      operationAmount: 6.2,
      operationCurrency: 'GEL',
      blockedAmount: 6.2,
      blockedCurrency: 'GEL',
      reversal: false,
      credit: false
    },
    {
      comment: null,
      date: new Date('2022-04-01T16:59:07.000Z'),
      hold: true,
      merchant: {
        city: 'batumi',
        country: 'GE',
        location: null,
        mcc: null,
        title: 'i.m Maguli Dimitradze'
      },
      movements: [
        {
          account: {
            id: '10971234'
          },
          fee: 0,
          id: null,
          invoice: null,
          sum: -6.2
        }
      ]
    }
  ],
  [
    {
      dateTime: 1652965726000,
      location: 'GASTRO PARK>PRAHA 2 CZ',
      operationAmount: 75,
      operationCurrency: 'CZK',
      blockedAmount: 3.31,
      blockedCurrency: 'USD',
      reversal: false,
      credit: false
    },
    {
      hold: true,
      date: new Date('2022-05-19T13:08:46.000Z'),
      movements:
        [
          {
            id: null,
            account: { id: '10971234' },
            invoice: { sum: -75, instrument: 'CZK' },
            sum: -3.31,
            fee: 0
          }
        ],
      merchant:
        {
          country: 'CZ',
          city: 'PRAHA',
          title: 'GASTRO PARK',
          mcc: null,
          location: null
        },
      comment: null
    }
  ],
  [
    {
      dateTime: 1654074782000,
      location: 'Glovo 01JUN GE2FPPYQT>BARCELONA ES',
      operationAmount: 9.85,
      operationCurrency: 'GEL',
      blockedAmount: 9.85,
      blockedCurrency: 'GEL',
      reversal: true,
      credit: false
    },
    {
      date: new Date('2022-06-01T09:13:02.000Z'),
      hold: true,
      merchant: {
        city: 'BARCELONA',
        country: 'ES',
        location: null,
        mcc: null,
        title: 'Glovo 01JUN GE2FPPYQT'
      },
      movements: [
        {
          account: { id: '10971234' },
          fee: 0,
          id: null,
          invoice: null,
          sum: 9.85
        }
      ],
      comment: null
    }
  ],
  [
    {
      dateTime: 1654756615000,
      location: 'P2P_SDBO_INTERNATIONAL>MINSK BY',
      operationAmount: 300,
      operationCurrency: 'BYB',
      blockedAmount: 115.69,
      blockedCurrency: 'USD',
      reversal: false,
      credit: true
    },
    {
      hold: true,
      date: new Date('2022-06-09T06:36:55.000Z'),
      movements:
        [
          {
            id: null,
            account: { id: '10971234' },
            invoice: { sum: 300, instrument: 'BYN' },
            sum: 115.69,
            fee: 0
          },
          {
            account: {
              company: null,
              instrument: 'BYN',
              syncIds: null,
              type: 'ccard'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -300
          }
        ],
      merchant: null,
      comment: 'P2P_SDBO_INTERNATIONAL>MINSK BY'
    }
  ],
  [
    {
      dateTime: 1654940952000,
      location: 'Yakubovych Zoriana>Visa Direct UA',
      operationAmount: 3000,
      operationCurrency: 'UKG',
      blockedAmount: 102.55,
      blockedCurrency: 'USD',
      reversal: false,
      credit: true
    },
    {
      hold: true,
      date: new Date('2022-06-11T09:49:12.000Z'),
      movements:
        [
          {
            id: null,
            account: { id: '10971234' },
            invoice: { sum: 3000, instrument: 'UAH' },
            sum: 102.55,
            fee: 0
          },
          {
            account: {
              company: null,
              instrument: 'UAH',
              syncIds: null,
              type: 'ccard'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -3000
          }
        ],
      merchant:
        {
          country: 'UA',
          city: null,
          title: 'Yakubovych Zoriana',
          mcc: null,
          location: null
        },
      comment: null
    }
  ]
])('convert hold transactions', (apiTransaction: unknown, transaction: unknown) => {
  const result = convertBlockedMovementTransaction(apiTransaction, debitCardGEL.account)
  expect(result).toEqual(transaction)
})
