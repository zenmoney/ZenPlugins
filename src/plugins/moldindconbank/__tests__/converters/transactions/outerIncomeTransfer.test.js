import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: 'dcf836de6b43a90ba735de0dcafc2838291fd1e0',
        rrn: '014983350429',
        operationTime: '2020-05-28T13:00:19.000+0000',
        transAmount: {
          currency: 'MDL',
          value: '100.00'
        },
        totalAmount: {
          currency: 'MDL',
          value: '100.00'
        },
        authCode: '603722',
        effectiveFrom: '2020-05-28',
        processedOn: '2020-05-28',
        location: {
          city: 'Chisinau',
          country: 'MDA',
          merchant: 'MOB_BANKING'
        },
        description: 'Пополнение карты MOB_BANKING Chisinau Moldova, Rep. Of',
        isDisputeAvailable: false,
        contractId: '28b4d10e44361e6514478589b269084966233be3',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isRecurrent: false,
        allowRepeat: false,
        isDataComplete: true,
        isOnline: false,
        withInvoice: false,
        conversionInstalmentEnabled: false,
        isInstalmentLinked: false,
        status: 'success',
        allowReversal: false,
        allowRest: false,
        transAmountDetails: [],
        fees: { }
      },
      {
        hold: false,
        date: new Date('2020-05-28T13:00:19.000+0000'),
        movements: [
          {
            id: 'dcf836de6b43a90ba735de0dcafc2838291fd1e0',
            account: { id: 'account' },
            invoice: null,
            sum: 100,
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
            sum: -100,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'MDL' })).toEqual(transaction)
  })
})
