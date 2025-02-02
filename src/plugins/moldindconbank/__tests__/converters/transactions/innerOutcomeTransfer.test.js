import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: 'e3d7e371a4c1e13d2eb0162786aaf1fd4584ef56',
        rrn: '212888719492',
        operationTime: '2022-05-08T09:08:59.000+0000',
        channel: 'MWB',
        responseCode: 'successful_operation',
        operationType: 'transfer',
        transAmount: {
          currency: 'EUR',
          value: '-257.21'
        },
        totalAmount: {
          currency: 'EUR',
          value: '-257.21'
        },
        authCode: '231109',
        effectiveFrom: '2022-05-08',
        processedOn: '2022-05-08',
        description: 'Debitare card P2P MICB Mobile Banking MICB Mobile Banking Moldova, Rep. Of',
        isDisputeAvailable: false,
        isInstalmentLinked: false,
        isRecurrent: false,
        contractId: 'b53b99296ae7e1000faebadf48ee8e9f1bcccc31',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isDataComplete: true,
        allowRepeat: true,
        isOnline: true,
        withInvoice: false,
        destContractId: '2173bf817c0d02cc2bec2ebd300c1f0923815e3e',
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'P2P_ONUS',
            name: 'Перевод на собственную карту',
            allowTemplate: true,
            allowPeriodic: true,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { DESTINATION: 'Wage' }
          },
        transAmountDetails: [],
        allowRest: true,
        fees: {}
      },
      {
        id: 'account',
        instrument: 'EUR'
      },
      {
        hold: false,
        date: new Date('2022-05-08T09:08:59.000Z'),
        movements: [
          {
            id: 'e3d7e371a4c1e13d2eb0162786aaf1fd4584ef56',
            account: { id: 'account' },
            invoice: null,
            sum: -257.21,
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
        id: '4df07aba4b7dbe7bace69061e5d2e2ea50399a8b',
        rrn: '212588415717',
        operationTime: '2022-05-05T13:07:30.000+0000',
        channel: 'MWB',
        responseCode: 'successful_operation',
        operationType: 'transfer',
        transAmount: {
          currency: 'EUR',
          value: '-1000.00'
        },
        totalAmount: {
          currency: 'MDL',
          value: '-20100.00'
        },
        authCode: '564924',
        effectiveFrom: '2022-05-05',
        processedOn: '2022-05-05',
        description: 'Debitare card P2P MICB Mobile Banking MICB Mobile Banking Moldova, Rep. Of',
        isDisputeAvailable: false,
        isInstalmentLinked: false,
        isRecurrent: false,
        contractId: '2173bf817c0d02cc2bec2ebd300c1f0923815e3e',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isDataComplete: true,
        allowRepeat: true,
        isOnline: true,
        withInvoice: false,
        destContractId: 'b53b99296ae7e1000faebadf48ee8e9f1bcccc31',
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'P2P_ONUS',
            name: 'Перевод на собственную карту',
            allowTemplate: true,
            allowPeriodic: true,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { DESTINATION: '557484******0058' }
          },
        transAmountDetails: [],
        allowRest: true,
        fees: {}
      },
      {
        id: 'account',
        instrument: 'MDL'
      },
      {
        hold: false,
        date: new Date('2022-05-05T13:07:30.000Z'),
        movements: [
          {
            id: '4df07aba4b7dbe7bace69061e5d2e2ea50399a8b',
            account: { id: 'account' },
            invoice: {
              instrument: 'EUR',
              sum: -1000
            },
            sum: -20100.00,
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
  ])('converts inner outcome transfer', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
