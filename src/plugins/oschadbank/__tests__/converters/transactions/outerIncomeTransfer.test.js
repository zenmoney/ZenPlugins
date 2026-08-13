import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'UAH'
  }
  it.each([
    [
      {
        id: 'b97b4229e3737da56cd56ea1205a6a52432faaaa',
        operationTime: '2020-06-29T21:00:00.000+0000',
        transAmount: { currency: 'UAH', value: '625.08' },
        totalAmount: { currency: 'UAH', value: '618.83' },
        effectiveFrom: '2020-06-30',
        processedOn: '2020-06-30',
        location: { merchant: '#522561106626#Платіж від: NIKOLAY NIKOLAEV' },
        description: 'Zarakhuvannia bezghotivkovykh koshtiv #522561106626#Платіж від: NIKOLAY NIKOLAEV',
        isDisputeAvailable: false,
        contractId: '005a1912fe93466992ab5f5134221c530e1d8322',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        fees:
        {
          totalFee: { currency: 'UAH', value: '-6.25' },
          fee: { currency: 'UAH', value: '-6.25' },
          custom: { currency: 'UAH', value: '-6.25' }
        },
        allowRest: false,
        transAmountDetails: []
      },
      {
        hold: false,
        date: new Date('2020-06-29T21:00:00.000+0000'),
        movements: [
          {
            id: 'b97b4229e3737da56cd56ea1205a6a52432faaaa',
            account: { id: 'account' },
            invoice: null,
            sum: 625.08,
            fee: -6.25
          },
          {
            id: null,
            account: {
              type: 'checking',
              instrument: 'UAH',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -625.08,
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
      }
    ],
    [
      {
        id: 'a9bcadf88a1f61bbd51a9e51ba14f505346e8ac8',
        operationTime: '2020-07-23T21:00:00.000+0000',
        transAmount: { currency: 'UAH', value: '51.61' },
        totalAmount: { currency: 'UAH', value: '51.61' },
        effectiveFrom: '2020-07-24',
        processedOn: '2020-07-24',
        location: { merchant: '#535800656826#NIKOLAY NIKOLAEV, поповнення картки, 1234567890' },
        description: 'Zarakhuvannia bezghotivkovykh koshtiv #535800656826#NIKOLAY NIKOLAEV, поповнення картки, 1234567890',
        isDisputeAvailable: false,
        contractId: '005a1912fe93466992ab5f5134221c530e1d8322',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        fees: {},
        allowRest: false,
        transAmountDetails: []
      },
      {
        hold: false,
        date: new Date('2020-07-23T21:00:00.000+0000'),
        movements: [
          {
            id: 'a9bcadf88a1f61bbd51a9e51ba14f505346e8ac8',
            account: { id: 'account' },
            invoice: null,
            sum: 51.61,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'UAH',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -51.61,
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
      }
    ],
    [
      {
        id: '2d40aee7f7e58dd9636322ee0cdaf30c35431cb8',
        operationTime: '2020-07-21T21:00:00.000+0000',
        transAmount: { currency: 'UAH', value: '8232.00' },
        totalAmount: { currency: 'UAH', value: '8232.00' },
        effectiveFrom: '2020-07-22',
        processedOn: '2020-07-22',
        location: { merchant: '#534522664711#(_160_) перерах. аванс липня 2020 р., податки перераховані повністю' },
        description: 'Zarakhuvannia bezghotivkovykh koshtiv #534522664711#(_160_) перерах. аванс липня 2020 р., податки перераховані повністю',
        isDisputeAvailable: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        contractId: 'c37755e66902b77aecedfcc5386c1e5432f60257',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees: {}
      },
      {
        hold: false,
        date: new Date('2020-07-21T21:00:00.000+0000'),
        movements: [
          {
            id: '2d40aee7f7e58dd9636322ee0cdaf30c35431cb8',
            account: { id: 'account' },
            invoice: null,
            sum: 8232,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'checking',
              instrument: 'UAH',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -8232,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Zarakhuvannia bezghotivkovykh koshtiv #534522664711#(_160_) перерах. аванс липня 2020 р., податки перераховані повністю'
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
