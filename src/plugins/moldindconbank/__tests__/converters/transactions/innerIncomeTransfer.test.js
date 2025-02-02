import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: '010456186472cc75b8140806d0ed4c7e06ea5d73',
        rrn: '212883186911',
        operationTime: '2022-05-08T09:08:59.000+0000',
        transAmount: {
          currency: 'EUR',
          value: '257.21'
        },
        totalAmount: {
          currency: 'MDL',
          value: '5054.18'
        },
        authCode: '564949',
        effectiveFrom: '2022-05-08',
        processedOn: '2022-05-08',
        location:
          {
            city: 'MICB Mobile Banking',
            country: 'MDA',
            merchant: 'MICB Mobile Banking'
          },
        description: 'Alimentare card MICB Mobile Banking MICB Mobile Banking Moldova, Rep. Of',
        isDisputeAvailable: false,
        isInstalmentLinked: false,
        isRecurrent: false,
        contractId: '2173bf817c0d02cc2bec2ebd300c1f0923815e3e',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isDataComplete: true,
        allowRepeat: false,
        isOnline: false,
        withInvoice: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees: {}
      },
      {
        id: 'account',
        instrument: 'MDL'
      },
      {
        hold: false,
        date: new Date('2022-05-08T09:08:59.000+0000'),
        movements: [
          {
            id: '010456186472cc75b8140806d0ed4c7e06ea5d73',
            account: { id: 'account' },
            invoice: {
              instrument: 'EUR',
              sum: 257.21
            },
            sum: 5054.18,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2022-05-08_EUR_257.21'
        ]
      }
    ],
    [
      {
        id: '0e08c9fc6c90b4ce1a65eca7fa67f45319b78066',
        rrn: '212583068480',
        operationTime: '2022-05-05T13:07:30.000+0000',
        transAmount: {
          currency: 'EUR',
          value: '1000.00'
        },
        totalAmount: {
          currency: 'EUR',
          value: '1000.00'
        },
        authCode: '231108',
        effectiveFrom: '2022-05-05',
        processedOn: '2022-05-05',
        location:
          {
            city: 'MICB Mobile Banking',
            country: 'MDA',
            merchant: 'MICB Mobile Banking'
          },
        description: 'Alimentare card MICB Mobile Banking MICB Mobile Banking Moldova, Rep. Of',
        isDisputeAvailable: false,
        isInstalmentLinked: false,
        isRecurrent: false,
        contractId: 'b53b99296ae7e1000faebadf48ee8e9f1bcccc31',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isDataComplete: true,
        allowRepeat: false,
        isOnline: false,
        withInvoice: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees: {}
      },
      {
        id: 'account',
        instrument: 'EUR'
      },
      {
        hold: false,
        date: new Date('2022-05-05T13:07:30.000Z'),
        movements: [
          {
            id: '0e08c9fc6c90b4ce1a65eca7fa67f45319b78066',
            account: { id: 'account' },
            invoice: null,
            sum: 1000.00,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2022-05-05_EUR_1000'
        ]
      }
    ]
  ])('converts inner income transfer', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
