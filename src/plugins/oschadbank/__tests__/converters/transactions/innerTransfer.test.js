import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'UAH'
  }

  it.each([
    [
      {
        id: 'c396b246477eee1b984fe35825f6bc55853a6282',
        rrn: '020482322683',
        operationTime: '2020-07-22T17:01:34.297+0000',
        channel: 'MWB',
        operationType: 'transfer',
        transAmount: {
          currency: 'UAH',
          value: '-2493.00'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-2493.00'
        },
        isDisputeAvailable: false,
        contractId: '266e8c3e75b579a43edd553d15496004fd83dc86',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        isDataComplete: false,
        isRecurrent: false,
        allowRepeat: true,
        withInvoice: false,
        status: 'success',
        allowReversal: false,
        fees: {},
        payment:
          {
            type: 'intra_bank_transfer',
            id: 2450991,
            remitter: { id: '266e8c3e75b579a43edd553d15496004fd83dc86' },
            amount: {
              currency: 'UAH',
              value: '2493.00'
            },
            total: {
              currency: 'UAH',
              value: '2493.00'
            },
            status: 'success',
            created: '2020-07-22T17:01:26.429+0000',
            updated: '2020-07-22T17:01:34.297+0000',
            txRef: '020482322683',
            channel: 'MWB',
            beneficiary: { id: 'f852ab83ee5dcf7c8f2d727e4b255dfc44893b46' }
          },
        allowRest: true
      },
      {
        hold: false,
        date: new Date('2020-07-22T17:01:34.297+0000'),
        movements: [
          {
            id: 'c396b246477eee1b984fe35825f6bc55853a6282',
            account: { id: 'account' },
            invoice: null,
            sum: -2493,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: ['f852ab83ee5dcf7c8f2d727e4b255dfc44893b46_2493_2020-07-22']
      }
    ],
    [
      {
        id: 'de28e999111dbea23a878bb3d661b0a2935719bf',
        rrn: '020482322684',
        operationTime: '2020-07-22T17:01:33.000+0000',
        transAmount: {
          currency: 'UAH',
          value: '2493.00'
        },
        totalAmount: {
          currency: 'UAH',
          value: '2493.00'
        },
        authCode: '919654',
        effectiveFrom: '2020-07-22',
        processedOn: '2020-07-22',
        location: {
          city: 'KYIV',
          country: 'UKR',
          merchant: 'Perekaz vid NIKOLAY NIKOLAEV'
        },
        description: 'Зарахування переказу на рахунок CH Payment Perekaz vid NIKOLAY NIKOLAEV KYIV UKRAINE',
        isDisputeAvailable: false,
        contractId: 'f852ab83ee5dcf7c8f2d727e4b255dfc44893b46',
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
        date: new Date('2020-07-22T17:01:33.000+0000'),
        movements: [
          {
            id: 'de28e999111dbea23a878bb3d661b0a2935719bf',
            account: { id: 'account' },
            invoice: null,
            sum: 2493,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: ['f852ab83ee5dcf7c8f2d727e4b255dfc44893b46_2493_2020-07-22']
      }
    ],
    [
      {
        id: '23dc0aa69772b93f90731a930e529ca13cae981c',
        rrn: '021487660945',
        operationTime: '2020-08-01T17:12:36.000+0000',
        channel: 'MB',
        responseCode: 'successful_operation',
        operationType: 'payment',
        transAmount: {
          currency: 'UAH',
          value: '-1952.62'
        },
        isDisputeAvailable: false,
        contractId: '60ca9de0a76386097c3cb3d46e61c7c2e704f2ff',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        isDataComplete: false,
        isRecurrent: false,
        allowRepeat: true,
        withInvoice: false,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'TRANSFER_TO_SAV',
            name: 'Transfers to Saving account',
            allowTemplate: true,
            allowPeriodic: true,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true
          },
        fees: {},
        allowRest: true
      },
      {
        hold: false,
        date: new Date('2020-08-01T17:12:36.000+0000'),
        movements: [
          {
            id: '23dc0aa69772b93f90731a930e529ca13cae981c',
            account: { id: 'account' },
            invoice: null,
            sum: -1952.62,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: ['60ca9de0a76386097c3cb3d46e61c7c2e704f2ff_1952.62_2020-08-01']
      }
    ],
    [
      {
        id: '3491831d8121ccc03b3f574b190140a2f3826e85',
        rrn: '021481265713',
        operationTime: '2020-08-01T17:11:07.277+0000',
        channel: 'MWB',
        operationType: 'transfer',
        transAmount: {
          currency: 'UAH',
          value: '-1900.32'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-1900.32'
        },
        isDisputeAvailable: false,
        contractId: '4df91a40ca21a7bcad59fe75f493a57241b204ad',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        isDataComplete: false,
        isRecurrent: false,
        allowRepeat: true,
        withInvoice: false,
        status: 'success',
        allowReversal: false,
        fees: {},
        payment:
          {
            type: 'intra_bank_transfer',
            id: 2610197,
            remitter: { id: '4df91a40ca21a7bcad59fe75f493a57241b204ad' },
            amount: {
              currency: 'UAH',
              value: '1900.32'
            },
            total: {
              currency: 'UAH',
              value: '1900.32'
            },
            status: 'success',
            created: '2020-08-01T17:10:54.251+0000',
            updated: '2020-08-01T17:11:07.277+0000',
            txRef: '021481265713',
            channel: 'MWB',
            beneficiary: { id: '60ca9de0a76386097c3cb3d46e61c7c2e704f2ff' }
          },
        allowRest: true
      },
      {
        hold: false,
        date: new Date('2020-08-01T17:11:07.277+0000'),
        movements: [
          {
            id: '3491831d8121ccc03b3f574b190140a2f3826e85',
            account: { id: 'account' },
            invoice: null,
            sum: -1900.32,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: ['60ca9de0a76386097c3cb3d46e61c7c2e704f2ff_1900.32_2020-08-01']
      }
    ],
    [
      {
        id: 'a61ac17a77651299a5272e82f02b65d276edaeb3',
        rrn: '021481265714',
        operationTime: '2020-08-01T17:11:06.000+0000',
        transAmount: {
          currency: 'UAH',
          value: '1900.32'
        },
        totalAmount: {
          currency: 'UAH',
          value: '1900.32'
        },
        authCode: '722132',
        processedOn: '2020-08-03',
        location: {
          city: 'KYIV',
          country: 'UKR',
          merchant: 'MOBILE BANKING'
        },
        description: 'Зарахування переказу на рахунок CH Payment MOBILE BANKING KYIV UKRAINE',
        isDisputeAvailable: false,
        contractId: '60ca9de0a76386097c3cb3d46e61c7c2e704f2ff',
        isAuth: true,
        isReversal: false,
        isReversed: false,
        isOnline: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'waiting',
        allowReversal: false,
        fees: {},
        allowRest: false,
        transAmountDetails: []
      },
      {
        hold: true,
        date: new Date('2020-08-01T17:11:06.000+0000'),
        movements: [
          {
            id: 'a61ac17a77651299a5272e82f02b65d276edaeb3',
            account: { id: 'account' },
            invoice: null,
            sum: 1900.32,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: ['60ca9de0a76386097c3cb3d46e61c7c2e704f2ff_1900.32_2020-08-01']
      }
    ],
    [
      {
        id: '7a3c38955c079d014d7a5a9c5207a64dcefae6a2',
        rrn: '022481812847',
        operationTime: '2020-08-11T16:57:28.000+0000',
        channel: 'MWB',
        operationType: 'transfer',
        transAmount: {
          currency: 'UAH',
          value: '-4350.00'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-4350.00'
        },
        authCode: '919663',
        effectiveFrom: '2020-08-11',
        processedOn: '2020-08-11',
        description: 'Переказ коштів з рахунку через MOBILE BANKING KYIV UKRAINE',
        isDisputeAvailable: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: true,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        contractId: 'f852ab83ee5dcf7c8f2d727e4b255dfc44893b46',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        payment:
          {
            type: 'intra_bank_transfer',
            id: 2774299,
            remitter: { id: 'f852ab83ee5dcf7c8f2d727e4b255dfc44893b46' },
            amount: {
              currency: 'UAH',
              value: '4350.00'
            },
            total: {
              currency: 'UAH',
              value: '4350.00'
            },
            status: 'success',
            created: '2020-08-11T16:57:23.013+0000',
            updated: '2020-08-11T16:57:29.300+0000',
            txRef: '022481812847',
            channel: 'MWB',
            beneficiary: { id: '67c9d32b2eb5301ffda9444d213882399615b61c' }
          },
        allowRest: true,
        fees: {}
      },
      {
        hold: false,
        date: new Date('2020-08-11T16:57:28+0000'),
        movements: [
          {
            id: '7a3c38955c079d014d7a5a9c5207a64dcefae6a2',
            account: { id: 'account' },
            invoice: null,
            sum: -4350,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Переказ коштів з рахунку через MOBILE BANKING KYIV UKRAINE',
        groupKeys: ['67c9d32b2eb5301ffda9444d213882399615b61c_4350_2020-08-11']
      }
    ],
    [
      {
        id: 'e7c1c290bc5d03645e9d0d7b73956426157a8645',
        rrn: '022081005781',
        operationTime: '2020-08-07T10:50:32.000+0000',
        channel: 'MWB',
        operationType: 'transfer',
        transAmount: {
          currency: 'UAH',
          value: '-6571.41'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-6571.41'
        },
        authCode: '111017',
        effectiveFrom: '2020-08-07',
        processedOn: '2020-08-07',
        description: 'Переказ коштів з рахунку через MOBILE BANKING KYIV UKRAINE',
        isDisputeAvailable: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: true,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        contractId: '266e8c3e75b579a43edd553d15496004fd83dc86',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        payment:
          {
            type: 'intra_bank_transfer',
            id: 2699239,
            remitter: { id: '266e8c3e75b579a43edd553d15496004fd83dc86' },
            amount: {
              currency: 'UAH',
              value: '6571.41'
            },
            total: {
              currency: 'UAH',
              value: '6571.41'
            },
            status: 'success',
            created: '2020-08-07T10:50:17.025+0000',
            updated: '2020-08-07T10:50:33.401+0000',
            txRef: '022081005781',
            channel: 'MWB',
            beneficiary: { id: 'f852ab83ee5dcf7c8f2d727e4b255dfc44893b46' }
          },
        allowRest: true,
        fees: {}
      },
      {
        hold: false,
        date: new Date('2020-08-07T10:50:32+0000'),
        movements: [
          {
            id: 'e7c1c290bc5d03645e9d0d7b73956426157a8645',
            account: { id: 'account' },
            invoice: null,
            sum: -6571.41,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Переказ коштів з рахунку через MOBILE BANKING KYIV UKRAINE',
        groupKeys: ['f852ab83ee5dcf7c8f2d727e4b255dfc44893b46_6571.41_2020-08-07']
      }
    ],
    [
      {
        id: 'ac8320aac871c7024680852e26b6ca98c1eae9b8',
        rrn: '022481798585',
        operationTime: '2020-08-11T16:46:42.000+0000',
        transAmount: {
          currency: 'UAH',
          value: '8000.00'
        },
        totalAmount: {
          currency: 'UAH',
          value: '8000.00'
        },
        authCode: '919661',
        effectiveFrom: '2020-08-11',
        processedOn: '2020-08-11',
        location: {
          city: 'KYIV',
          country: 'UKR',
          merchant: 'Perekaz vid NIKOLAY NIKOLAEV'
        },
        description: 'Зарахування переказу на рахунок CH Payment Perekaz vid NIKOLAY NIKOLAEV KYIV UKRAINE',
        isDisputeAvailable: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        contractId: 'f852ab83ee5dcf7c8f2d727e4b255dfc44893b46',
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
        date: new Date('2020-08-11T16:46:42.000+0000'),
        movements: [
          {
            id: 'ac8320aac871c7024680852e26b6ca98c1eae9b8',
            account: { id: 'account' },
            invoice: null,
            sum: 8000.00,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: ['f852ab83ee5dcf7c8f2d727e4b255dfc44893b46_8000_2020-08-11']
      }
    ],
    [
      {
        id: 'b4708372afd427560e1ed7f9813b6a765265209b',
        rrn: '604273798375',
        operationTime: '2026-02-11T14:01:10.000+0000',
        operationType: 'intrabank_transfer_by_card',
        transAmount: {
          currency: 'UAH',
          value: '1500.00'
        },
        totalAmount: {
          currency: 'UAH',
          value: '1500.00'
        },
        authCode: '155082',
        effectiveFrom: '2026-02-11',
        processedOn: '2026-02-11',
        location:
          {
            city: 'KYIV',
            country: 'UKR',
            merchant: 'Perekaz vid NIKOLAY NIKOLAEV'
          },
        description: 'Зарахування переказу на рахунок CH Payment Perekaz vid NIKOLAY NIKOLAEV KYIV UKRAINE',
        isDisputeAvailable: false,
        contractId: '857c0f45527a818b0b9298736746ef0b92ec1c89',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: false,
        isRecurrent: false,
        isInstalmentLinked: false,
        isDataComplete: true,
        allowRepeat: false,
        withInvoice: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        remitterName: 'NIKOLAY NIKOLAEV',
        allowRest: false,
        transAmountDetails: [],
        fees: {}
      },
      {
        date: new Date('2026-02-11T14:01:10.000+0000'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: 'b4708372afd427560e1ed7f9813b6a765265209b',
            invoice: null,
            sum: 1500
          }
        ],
        comment: null,
        groupKeys: ['857c0f45527a818b0b9298736746ef0b92ec1c89_1500_2026-02-11']
      }
    ]
  ])('converts inner transfer', (apiTransactions, transactions) => {
    expect(convertTransaction(apiTransactions, account)).toEqual(transactions)
  })
})
