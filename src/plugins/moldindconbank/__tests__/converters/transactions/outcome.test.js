import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: 'b02d8cf60454808875f0267a691dbd0a2ae12309',
        rrn: '018201099838',
        operationTime: '2020-06-30T08:18:44.000+0000',
        transAmount: {
          currency: 'MDL',
          value: '-144.00'
        },
        totalAmount: {
          currency: 'MDL',
          value: '-144.00'
        },
        authCode: '971867',
        effectiveFrom: '2020-06-30',
        processedOn: '2020-06-30',
        location: {
          city: 'Balti (or.) - Balti',
          country: 'MDA',
          merchant: '\\"MAICOM\\" B5 magazin'
        },
        description: 'Оплата тов./услуг \\"MAICOM\\" B5 magazin Balti (or.) - Balti Moldova, Rep. Of',
        merchantCategory: 'Clothes',
        isDisputeAvailable: false,
        contractId: 'dc7c37d986018eb3480ff3a66c04abb3b1de0bbb',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isContactless: true,
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
        fees: {}
      },
      {
        hold: false,
        date: new Date('2020-06-30T08:18:44.000+0000'),
        movements: [
          {
            id: 'b02d8cf60454808875f0267a691dbd0a2ae12309',
            account: { id: 'account' },
            invoice: null,
            sum: -144,
            fee: 0
          }
        ],
        merchant: {
          country: 'MDA',
          city: 'Balti (or.) - Balti',
          title: '"MAICOM" B5 magazin',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '9db785b016d97622bec5777967adbfd55e4949e2',
        rrn: '023888093932',
        operationTime: '2020-08-25T17:56:52.000+0000',
        channel: 'MWB',
        responseCode: 'successful_operation',
        operationType: 'payment',
        transAmount: {
          currency: 'MDL',
          value: '-30.00'
        },
        totalAmount: {
          currency: 'MDL',
          value: '-31.00'
        },
        authCode: '202773',
        effectiveFrom: '2020-08-26',
        processedOn: '2020-08-26',
        description: 'Оплата тов./услуг Plati billing wb.micb.md/mobile/ Moldova, Rep. Of',
        merchantCategory: 'Payments',
        isDisputeAvailable: false,
        contractId: 'c2639136610a01cafe92b96632067c4cb86cfcfd',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isRecurrent: false,
        allowRepeat: true,
        isDataComplete: true,
        isOnline: true,
        withInvoice: false,
        conversionInstalmentEnabled: false,
        isInstalmentLinked: false,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'BP_MTC',
            name: 'Moldtelecom - Telefonie fixă',
            allowTemplate: true,
            allowPeriodic: true,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { CUSTOM_IDT: '022281063' },
            customIdtEditMask: 'PHONE_MD_09_09'
          },
        template:
          {
            id: '1475061',
            name: 'Moldtelecom - Telefonie fixă',
            serviceActive: true,
            allowRest: false,
            serviceId: 'BP_MTC'
          },
        allowRest: true,
        transAmountDetails: [],
        fees:
          {
            totalFee: {
              currency: 'MDL',
              value: '-1.00'
            },
            customBF: {
              currency: 'MDL',
              value: '-1.00'
            }
          }
      },
      {
        hold: false,
        date: new Date('2020-08-25T17:56:52.000+0000'),
        movements: [
          {
            id: '9db785b016d97622bec5777967adbfd55e4949e2',
            account: { id: 'account' },
            invoice: null,
            sum: -30,
            fee: -1
          }
        ],
        merchant: {
          fullTitle: 'Moldtelecom - Telefonie fixă',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: 'e7388a3dd261b2cdabc889626aadd4d9bac88a27',
        operationTime: '2020-08-30T21:00:00.000+0000',
        transAmount: {
          currency: 'MDL',
          value: '-56.16'
        },
        totalAmount: {
          currency: 'MDL',
          value: '-56.16'
        },
        authCode: '979424',
        effectiveFrom: '2020-09-01',
        processedOn: '2020-09-01',
        location:
          {
            city: '4029357733',
            country: 'LUX',
            merchant: 'PAYPAL *SHEGAJYULIY'
          },
        description: 'Оплата тов./услуг PAYPAL *SHEGAJYULIY 4029357733 Luxembourg',
        merchantCategory: 'Payments',
        isDisputeAvailable: false,
        contractId: 'a1ec83f34a0bc5bc4a54b2fddae28a9e9549659a',
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
        fees: {},
        allowRest: false,
        transAmountDetails: []
      },
      {
        hold: false,
        date: new Date('2020-08-30T21:00:00.000+0000'),
        movements: [
          {
            id: 'e7388a3dd261b2cdabc889626aadd4d9bac88a27',
            account: { id: 'account' },
            invoice: null,
            sum: -56.16,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'PAYPAL *SHEGAJYULIY 4029357733 Luxembourg',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '38b959dbeb97510b710eca4b65bef04b59ee4d6a',
        operationTime: '2022-03-18T22:00:00.000+0000',
        transAmount: {
          currency: 'MDL',
          value: '-22.49'
        },
        totalAmount: {
          currency: 'MDL',
          value: '-22.49'
        },
        authCode: '425258',
        effectiveFrom: '2022-03-21',
        processedOn: '2022-03-21',
        location:
          {
            city: 'Chisinau ',
            country: 'MDA',
            merchant: 'MAIB ROGOB MARKET'
          },
        description: 'Plata retail MAIB ROGOB MARKET Chisinau Moldova, Rep. Of',
        merchantCategory: 'Retail',
        isDisputeAvailable: false,
        contractId: '03e511320e4444d96d658693348eac52d79aa17c',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isContactless: true,
        isOnline: false,
        isRecurrent: false,
        isInstalmentLinked: false,
        allowRepeat: false,
        isDataComplete: true,
        withInvoice: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        fees: {},
        allowRest: false,
        transAmountDetails: []
      },
      {
        date: new Date('2022-03-19T00:00:00+02:00'),
        hold: false,
        movements:
          [
            {
              id: '38b959dbeb97510b710eca4b65bef04b59ee4d6a',
              account: { id: 'account' },
              invoice: null,
              sum: -22.49,
              fee: 0
            }
          ],
        merchant: {
          country: 'MDA',
          city: 'Chisinau',
          title: 'MAIB ROGOB MARKET',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '0109bc99b6b2588defdbc0cc9f6300cdb831d355',
        rrn: '215988109749',
        operationTime: '2022-06-08T08:26:04.000+0000',
        channel: 'MWB',
        responseCode: 'successful_operation',
        operationType: 'payment',
        transAmount: {
          currency: 'MDL',
          value: '-202.00'
        },
        totalAmount: {
          currency: 'MDL',
          value: '-202.00'
        },
        authCode: '525423',
        effectiveFrom: '2022-06-08',
        processedOn: '2022-06-08',
        description: 'Оплата тов./услуг Achitare Servicii MICB Mobile Banking Moldova, Rep. Of',
        merchantCategory: 'payments_and_bills',
        isDisputeAvailable: false,
        contractId: '413470ebfda7011c82038146ddbde8cfa28ba877',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        isInstalmentLinked: false,
        isRecurrent: false,
        allowRepeat: true,
        isDataComplete: true,
        withInvoice: true,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'BN_MOLDCELL',
            name: 'Moldcell',
            allowTemplate: true,
            allowPeriodic: false,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { CUSTOM_IDT: '79902177' },
            customIdtEditMask: 'PHONE_GSM_MD_08_08'
          },
        allowRest: true,
        fees: {},
        transAmountDetails: []
      },
      {
        date: new Date('2022-06-08T11:26:04+03:00'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              id: '0109bc99b6b2588defdbc0cc9f6300cdb831d355',
              account: { id: 'account' },
              invoice: null,
              sum: -202,
              fee: 0
            }
          ],
        comment: 'Оплата тов./услуг Achitare Servicii MICB Mobile Banking Moldova, Rep. Of'
      }
    ],
    [
      {
        id: '01a12b767705cf43fef3ed74e0b19fc4f7a6257a',
        rrn: '216788131336',
        operationTime: '2022-06-16T18:49:31.000+0000',
        channel: 'MWB',
        responseCode: 'successful_operation',
        operationType: 'payment',
        transAmount: {
          currency: 'MDL',
          value: '-1174.75'
        },
        totalAmount: {
          currency: 'MDL',
          value: '-1179.75'
        },
        authCode: '688816',
        effectiveFrom: '2022-06-17',
        processedOn: '2022-06-17',
        description: 'Plata retail Achitare Servicii MICB Mobile Banking Moldova, Rep. Of',
        merchantCategory: 'payments_and_bills',
        isDisputeAvailable: false,
        contractId: '3e25158618a3de27632de3d47cad50d5b479daa9',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        isDataComplete: true,
        withInvoice: true,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        isRecurrent: false,
        allowRepeat: true,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'BN_IUTE_CREDIT',
            name: 'Iute Credit',
            allowTemplate: true,
            allowPeriodic: false,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { CUSTOM_IDT: '1918042' },
            customIdtEditMask: 'V11_DIGITS_01_15'
          },
        allowRest: true,
        transAmountDetails: [],
        fees:
          {
            totalFee: {
              currency: 'MDL',
              value: '-5.00'
            },
            customBF: {
              currency: 'MDL',
              value: '-5.00'
            }
          }
      },
      {
        comment: 'Plata retail Achitare Servicii MICB Mobile Banking Moldova, Rep. Of',
        date: new Date('2022-06-16T18:49:31.000Z'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              id: '01a12b767705cf43fef3ed74e0b19fc4f7a6257a',
              account: { id: 'account' },
              invoice: null,
              sum: -1174.75,
              fee: -5
            }
          ]
      }
    ]
  ])('converts outcome spending', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, {
      id: 'account',
      instrument: 'MDL'
    })).toEqual(transaction)
  })
})
