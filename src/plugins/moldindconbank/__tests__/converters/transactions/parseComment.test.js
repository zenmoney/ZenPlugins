import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: '176ad6a028bae3eb3a3d5ee53463d9b2a1a2f059',
        operationTime: '2020-07-31T19:03:02.000+0000',
        operationType: 'fee',
        totalAmount: { currency: 'MDL', value: '-40.00' },
        effectiveFrom: '2020-08-01',
        processedOn: '2020-08-01',
        location: { merchant: 'Regular Charge' },
        description: 'RF: Taxa lunara deservire cont',
        isDisputeAvailable: false,
        isDataComplete: true,
        isOnline: false,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        contractId: 'e2e7598b70b4ac73b26a6209b380a1f39967d953',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees:
          {
            totalFee: { currency: 'MDL', value: '-40.00' },
            fee: { currency: 'MDL', value: '-40.00' },
            custom: { currency: 'MDL', value: '-40.00' }
          }
      },
      {
        hold: false,
        date: new Date('2020-07-31T19:03:02.000+0000'),
        movements: [
          {
            id: '176ad6a028bae3eb3a3d5ee53463d9b2a1a2f059',
            account: { id: 'account' },
            invoice: null,
            sum: -40,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'RF: Taxa lunara deservire cont'
      }
    ]
  ])('adds comment', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'MDL' })).toEqual(transaction)
  })
})
