import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: 'bac85ccecaa9dcb5f61cbad4012b0a192fd936ed',
        rrn: '212388068821',
        operationTime: '2022-05-03T04:34:34.000+0000',
        channel: 'MWB',
        responseCode: 'successful_operation',
        operationType: 'transfer',
        transAmount: {
          currency: 'EUR',
          value: '-50.00'
        },
        isDisputeAvailable: false,
        isRecurrent: false,
        contractId: '2173bf817c0d02cc2bec2ebd300c1f0923815e3e',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isDataComplete: false,
        allowRepeat: true,
        isOnline: true,
        withInvoice: false,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'P2P_INBANK',
            name: 'Перевод на карту другого клиента Moldindconbank-a',
            allowTemplate: true,
            allowPeriodic: true,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { DESTINATION: '557484******0342' }
          },
        template:
          {
            id: '140708440',
            name: 'Irka',
            serviceActive: true,
            allowRest: false,
            serviceId: 'P2P_INBANK'
          },
        allowRest: true,
        fees: {}
      },
      {
        hold: false,
        date: new Date('2022-05-03T04:34:34.000Z'),
        movements: [
          {
            id: 'bac85ccecaa9dcb5f61cbad4012b0a192fd936ed',
            account: { id: 'account' },
            invoice: {
              instrument: 'EUR',
              sum: -50
            },
            sum: null,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'EUR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 50,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, {
      id: 'account',
      instrument: 'MDL'
    })).toEqual(transaction)
  })
})
