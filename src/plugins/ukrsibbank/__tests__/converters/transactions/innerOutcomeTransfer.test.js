import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2921353149',
        alias: 'Переказ на картку 535128****6332 NIKOLAY NIKOLAEV',
        statusText: 'Completed',
        userTool: 'MC PLATINUM **** 6004',
        manual: false,
        splitted: false,
        canPrint: true,
        canRepeat: true,
        canSplit: true,
        canSaveTemplate: true,
        canSaveStandingOrder: true,
        canSaveSubscription: false,
        canDelete: false,
        type:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionTypeMto',
            name: 'EXPENSE'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '40311952',
            name: 'Перевод между своими счетами',
            color: '7DD6E3',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'c0e339c0-01ff-4045-8b4a-d667efaecadd',
                contentTimestamp: new Date('Thu Nov 16 2017 17:52:10 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Wed Jul 03 2019 13:57:11 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 2400,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'UAH'
              }
          },
        blockAmount: null,
        postAmount: null,
        sender: null,
        receiver:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: 'NIKOLAY NIKOLAEV',
            tool: 'MC GOLD **** 6332',
            bankName: 'АТ "УКРСИББАНК"'
          },
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-07-03T13:57:11+03:00'),
        movements: [
          {
            id: '2921353149',
            account: { id: 'account' },
            invoice: null,
            sum: -2400,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2019-07-03_UAH_2400_6004_6332',
          '2019-07-03_UAH_2400'
        ]
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2651254353',
        alias: 'Переказ на власний рахунок ЗП Start картковий',
        statusText: 'Completed',
        userTool: 'Start Salary card account 26203807901221',
        manual: false,
        splitted: false,
        canPrint: true,
        canRepeat: true,
        canSplit: true,
        canSaveTemplate: true,
        canSaveStandingOrder: true,
        canSaveSubscription: false,
        canDelete: false,
        type:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionTypeMto',
            name: 'EXPENSE'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '40311952',
            name: 'Transfer between own accounts',
            color: '7DD6E3',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'c0e339c0-01ff-4045-8b4a-d667efaecadd',
                contentTimestamp: new Date('Thu Nov 16 2017 17:52:10 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Sun May 26 2019 20:54:41 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 130,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'UAH'
              }
          },
        blockAmount: null,
        postAmount: null,
        sender: null,
        receiver:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: 'NIKOLAY NIKOLAEV',
            tool: 'Start Salary card account 26206806560707',
            bankName: 'АТ "УКРСИББАНК"'
          },
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-05-26T17:54:41.000Z'),
        movements: [
          {
            id: '2651254353',
            account: { id: 'account' },
            invoice: null,
            sum: -130,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2019-05-26_UAH_130_26203807901221_26206806560707',
          '2019-05-26_UAH_130'
        ]
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2133713559',
        alias: 'Переказ на власний рахунок All Inclusive картковий',
        statusText: 'Completed',
        userTool: 'All Inclusive saving 26203191271102',
        manual: false,
        splitted: false,
        canPrint: true,
        canRepeat: true,
        canSplit: true,
        canSaveTemplate: true,
        canSaveStandingOrder: true,
        canSaveSubscription: false,
        canDelete: false,
        type:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionTypeMto',
            name: 'EXPENSE'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '40311952',
            name: 'Transfer between own accounts',
            color: '7DD6E3',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'c0e339c0-01ff-4045-8b4a-d667efaecadd',
                contentTimestamp: new Date('Thu Nov 16 2017 17:52:10 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Tue Mar 12 2019 11:07:12 GMT+0200 (EET)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 10500,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'UAH'
              }
          },
        blockAmount: null,
        postAmount: null,
        sender: null,
        receiver:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: 'NIKOLAY NIKOLAEV',
            tool: null,
            bankName: null
          },
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-03-12T11:07:12+02:00'),
        movements: [
          {
            id: '2133713559',
            account: { id: 'account' },
            invoice: null,
            sum: -10500,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          null,
          '2019-03-12_UAH_10500'
        ]
      }
    ]
  ])('converts inner outcome transfer', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'UAH' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })

  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2916346647',
        alias: 'Перерахування для купівлі/продажу іноземної валюти',
        statusText: 'Completed',
        userTool: 'AI Ultra картковий валюта 26202805846750',
        manual: false,
        splitted: false,
        canPrint: true,
        canRepeat: false,
        canSplit: true,
        canSaveTemplate: false,
        canSaveStandingOrder: false,
        canSaveSubscription: false,
        canDelete: false,
        type:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionTypeMto',
            name: 'EXPENSE'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '25285886',
            name: 'Інші витрати',
            color: '8dc0b2',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'f52005df-7f93-4584-8f38-b9a6f871358f',
                contentTimestamp: new Date('Thu Nov 16 2017 17:27:14 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Tue Jul 02 2019 05:44:35 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 0.21,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'USD'
              }
          },
        blockAmount: null,
        postAmount: null,
        sender: null,
        receiver:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: null,
            tool: '2900010005',
            bankName: 'АТ "УКРСИББАНК"'
          },
        parameters: []
      },
      { id: 'account', instrument: 'USD' },
      {
        hold: false,
        date: new Date('2019-07-02T05:44:35+03:00'),
        movements: [
          {
            id: '2916346647',
            account: { id: 'account' },
            invoice: null,
            sum: -0.21,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перерахування для купівлі/продажу іноземної валюти',
        groupKeys: [
          '2019-07-02',
          null
        ]
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '0A476D4B04F241A7B5E10F970E8F2A9B',
        alias: 'Купівля іноземної валюти в сумі 500.00USD по курсу 24.39 за допомогою UKRSIB online',
        statusText: 'Completed',
        userTool: 'ЗП AI De Luxe картковий UA933510050000026200806568620',
        manual: false,
        splitted: false,
        canPrint: true,
        canRepeat: false,
        canSplit: true,
        canSaveTemplate: false,
        canSaveStandingOrder: false,
        canSaveSubscription: false,
        canDelete: false,
        type:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionTypeMto',
            name: 'EXPENSE'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '40311952',
            name: 'Переказ між власними рахунками',
            color: '7DD6E3',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'c0e339c0-01ff-4045-8b4a-d667efaecadd',
                contentTimestamp: new Date('Thu Nov 16 2017 17:52:10 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Wed Jan 22 2020 11:56:48 GMT+0200 (EET)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 12195,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'UAH'
              }
          },
        blockAmount: null,
        postAmount: null,
        sender: null,
        receiver:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: 'NIKOLAY NIKOLAEV',
            tool: null,
            bankName: null
          },
        parameters: []
      },
      { id: 'account', instrument: 'UAH' },
      {
        hold: false,
        date: new Date('Wed Jan 22 2020 11:56:48 GMT+0200 (EET)'),
        movements: [
          {
            id: '0A476D4B04F241A7B5E10F970E8F2A9B',
            account: { id: 'account' },
            invoice: null,
            sum: -12195,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Купівля іноземної валюти в сумі 500.00USD по курсу 24.39 за допомогою UKRSIB online',
        groupKeys: [
          '2020-01-22',
          null
        ]
      }
    ]
  ])('converts currency exchange', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
