import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'UAH'
  }
  it.each([
    [
      {
        id: '19638939ac8f5a822ff18a8cbcc9f4609731c1aa',
        rrn: '011087078758',
        operationTime: '2020-04-19T15:10:53.000+0000',
        channel: 'MB',
        responseCode: 'successful_operation',
        operationType: 'transfer',
        transAmount: {
          currency: 'UAH',
          value: '-442.00'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-442.00'
        },
        authCode: '531892',
        effectiveFrom: '2020-04-21',
        processedOn: '2020-04-21',
        description: 'Direct P2P Для поповнення картки 4441114456666666, NIKOLAY NIKOLAEV, 1234567890',
        isDisputeAvailable: false,
        isDataComplete: true,
        isInstalmentLinked: false,
        isReversal: false,
        isReversed: false,
        contractId: 'e507913b551d5af64cc79fbddb9c82302e1632e2',
        isAuth: false,
        withInvoice: false,
        allowRepeat: true,
        isRecurrent: false,
        isOnline: true,
        status: 'success',
        allowReversal: false,
        service: {
          id: 'TRANSFER_CARD_UKR_FIZ_UR_IBAN_OW',
          name: 'To IBAN from card account',
          allowTemplate: true,
          allowPeriodic: true,
          allowThreshold: false,
          allowInternational: false,
          allowBonusPayment: false,
          active: true,
          shortFields: { DESTINATION: 'UA333220010000026206306048446' }
        },
        allowRest: true,
        transAmountDetails: [],
        fees: { }
      },
      {
        hold: false,
        date: new Date('2020-04-19T15:10:53.000+0000'),
        movements: [
          {
            id: '19638939ac8f5a822ff18a8cbcc9f4609731c1aa',
            account: { id: 'account' },
            invoice: null,
            sum: -442.00,
            fee: 0.00
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'UAH',
              company: null,
              syncIds: ['UA333220010000026206306048446']
            },
            invoice: null,
            sum: 442,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Direct P2P Для поповнення картки 4441114456666666, NIKOLAY NIKOLAEV, 1234567890'
      }
    ]
  ])('converts outer transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
