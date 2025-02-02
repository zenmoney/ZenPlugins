import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '04ae0dffbe43bf56e12e420be08497ea9d7854c2',
        rrn: '921401884573',
        operationTime: '2019-08-02T09:53:12.000+0000',
        transAmount: {
          currency: 'MDL',
          value: '-250.00'
        },
        totalAmount: {
          currency: 'MDL',
          value: '-250.90'
        },
        authCode: '603654',
        effectiveFrom: '2019-08-02',
        processedOn: '2019-08-02',
        location: {
          city: 'Balti (mun.) - Balti',
          country: 'MDA',
          merchant: 'ATM153 MICBLinella-Balti'
        },
        description: 'Снятие нал. ATM ATM153 MICBLinella-Balti Balti (mun.) - Balti Moldova, Rep. Of',
        merchantCategory: 'Cash-out',
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
        fees: {
          totalFee: {
            currency: 'MDL',
            value: '-0.90'
          },
          customBF: {
            currency: 'MDL',
            value: '-0.90'
          }
        }
      },
      {
        comment: null,
        date: new Date('2019-08-02T09:53:12.000+0000'),
        hold: false,
        merchant: {
          city: 'Balti (mun.) - Balti',
          country: 'MDA',
          title: 'ATM153 MICBLinella-Balti',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '04ae0dffbe43bf56e12e420be08497ea9d7854c2',
            account: { id: 'account' },
            invoice: null,
            sum: -250,
            fee: -0.9
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
            sum: 250,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        id: 'f2d42588043a96fa5d5c67e71f24820fb12d5306',
        rrn: '021201438452',
        operationTime: '2020-07-30T13:05:03.000+0000',
        transAmount: { currency: 'MDL', value: '50.00' },
        totalAmount: { currency: 'MDL', value: '50.00' },
        authCode: '971771',
        effectiveFrom: '2020-07-30',
        processedOn: '2020-07-30',
        location:
          {
            city: 'Ocnita (or.) - Ocnita',
            country: 'MDA',
            merchant: 'ATM288 Ocnita-3'
          },
        description: 'Пополн. наличными ATM ATM288 Ocnita-3 Ocnita (or.) - Ocnita Moldova, Rep. Of',
        merchantCategory: 'Cash-in',
        isDisputeAvailable: false,
        isDataComplete: true,
        isOnline: false,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        contractId: '34d156a364aa9a0c013da62fa5d8f7038a5e9851',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees: {}
      },
      {
        comment: null,
        date: new Date('2020-07-30T13:05:03.000+0000'),
        hold: false,
        merchant: {
          city: 'Ocnita (or.) - Ocnita',
          country: 'MDA',
          title: 'ATM288 Ocnita-3',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: 'f2d42588043a96fa5d5c67e71f24820fb12d5306',
            account: { id: 'account' },
            invoice: null,
            sum: 50,
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
            sum: -50,
            fee: 0
          }
        ]
      }
    ]
  ])('converts cash transfers', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'MDL' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
