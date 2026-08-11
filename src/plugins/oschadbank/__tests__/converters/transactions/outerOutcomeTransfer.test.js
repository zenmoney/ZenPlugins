import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'UAH'
  }
  it.each([
    [
      {
        id: 'b04dc49435d1a6697a4704dbfdf3f656a86e10b6',
        rrn: '007487004797',
        operationTime: '2020-03-14T17:57:56.000+0000',
        channel: 'MB',
        responseCode: 'successful_operation',
        operationType: 'transfer',
        transAmount: {
          currency: 'UAH',
          value: '-600.00'
        },
        authCode: '541739',
        effectiveFrom: '2020-03-16',
        processedOn: '2020-03-16',
        description: 'Переказ коштів з рахунку через MOBILE BANKING KYIV UKRAINE',
        isDisputeAvailable: false,
        isDataComplete: true,
        isOnline: true,
        isRecurrent: false,
        allowRepeat: true,
        withInvoice: false,
        isInstalmentLinked: false,
        contractId: '655ea2e2f1391c362794acbe75fe96f3c2fd88c9',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        status: 'success',
        allowReversal: false,
        service: {
          id: 'P2P_VISA_MC',
          name: 'На картку іншого банку',
          allowTemplate: true,
          allowPeriodic: true,
          allowThreshold: false,
          allowInternational: false,
          allowBonusPayment: false,
          active: true,
          shortFields: {
            DESTINATION: '5375********1174'
          }
        },
        transAmountDetails: [],
        allowRest: true,
        fees: {
          totalFee: {
            currency: 'UAH',
            value: '-11.00'
          },
          fee: {
            currency: 'UAH',
            value: '-11.00'
          },
          custom: {
            currency: 'UAH',
            value: '-11.00'
          }
        }
      },
      {
        hold: false,
        date: new Date('2020-03-14T17:57:56.000+0000'),
        movements: [
          {
            id: 'b04dc49435d1a6697a4704dbfdf3f656a86e10b6',
            account: { id: 'account' },
            invoice: null,
            sum: -600.00,
            fee: -11.00
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'UAH',
              company: null,
              syncIds: ['5375********1174']
            },
            invoice: null,
            sum: 600.00,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Переказ коштів з рахунку через MOBILE BANKING KYIV UKRAINE'
      }
    ],
    [
      {
        id: '3c56893ea394950426fdcdacd4892f9d092c5c4a',
        rrn: '135161480082',
        operationTime: '2021-12-17T15:23:23.000+0000',
        channel: 'MB',
        responseCode: 'successful_operation',
        operationType: 'transfer',
        transAmount: {
          currency: 'UAH',
          value: '-14872.00'
        },
        isDisputeAvailable: false,
        contractId: 'baa4febb18c1bc7d0d629cb50aa8cd0809e7d521',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isDataComplete: false,
        withInvoice: false,
        isRecurrent: false,
        allowRepeat: true,
        isOnline: true,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'TRANSFER_CARD_UKR_FIZ_UR_IBAN_OW',
            name: 'To IBAN from card account',
            allowTemplate: true,
            allowPeriodic: true,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { DESTINATION: 'UA123052990000026006026222182' }
          },
        allowRest: true,
        fees: {}
      },
      {
        comment: null,
        date: new Date('2021-12-17T15:23:23.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '3c56893ea394950426fdcdacd4892f9d092c5c4a',
            invoice: null,
            sum: -14872
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'UAH',
              company: null,
              syncIds: ['UA123052990000026006026222182']
            },
            invoice: null,
            sum: 14872,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        id: 'ac7d30ba35eb853bf75a4f1355962f2ff811addb',
        rrn: '604861999508',
        operationTime: '2026-02-17T15:01:05.000+0000',
        channel: 'MB',
        responseCode: 'successful_operation',
        operationType: 'transfer',
        transAmount: {
          currency: 'UAH',
          value: '-12292.92'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-12292.92'
        },
        authCode: '214943',
        effectiveFrom: '2026-02-17',
        processedOn: '2026-02-17',
        description: 'Переказ коштів з рахунку через TRNSFR_CARD_CURRENT KYIV UKRAINE',
        isDisputeAvailable: false,
        contractId: '93696c37c0241fbc23f891715d1f33b1113e3221',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        isRecurrent: false,
        isInstalmentLinked: false,
        isDataComplete: true,
        allowRepeat: true,
        withInvoice: false,
        destContractId: 'a559eed6eb369a18e4a94fd4eeb23b2f74df526a',
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'TRANSFER_CARD_ACC',
            name: 'From card to account',
            allowTemplate: false,
            allowPeriodic: false,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { DESTINATION: 'єОселя, гніздечко' }
          },
        fees: {},
        allowRest: true,
        transAmountDetails: []
      },
      {
        date: new Date('2026-02-17T15:01:05.000+0000'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: 'ac7d30ba35eb853bf75a4f1355962f2ff811addb',
            invoice: null,
            sum: -12292.92
          },
          {
            account: {
              company: null,
              instrument: 'UAH',
              syncIds: null,
              type: 'ccard'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 12292.92
          }
        ],
        comment: 'Переказ коштів з рахунку через TRNSFR_CARD_CURRENT KYIV UKRAINE'
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
