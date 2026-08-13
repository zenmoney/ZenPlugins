import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '043B57B1ABE748E7BCE0BC0E85049D7B',
        alias: 'Переказ на картку від NIKOLAY NIKOLAEV',
        statusText: 'Completed',
        userTool: 'MC GOLD **** 6332',
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
            name: 'INCOME'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '42403883',
            name: 'Переводы между своими счетами',
            color: '33CCCC',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '7d9d95b8-0184-42c8-8a7b-a0b0afa40f52',
                contentTimestamp: new Date('Thu Nov 16 2017 17:59:37 GMT+0200 (EET)')
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
        sender:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: 'NIKOLAY NIKOLAEV',
            tool: 'MC PLATINUM **** 6004',
            bankName: 'АТ "УКРСИББАНК"'
          },
        receiver: null,
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-07-03T13:57:11+03:00'),
        movements: [
          {
            id: '043B57B1ABE748E7BCE0BC0E85049D7B',
            account: { id: 'account' },
            invoice: null,
            sum: 2400,
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
        alias: 'Б/г зарахування з іншого рахунку Клієнта',
        id: '1480707179',
        statusText: 'Completed',
        userTool: 'Welcome card 00123498765432',
        manual: false,
        splitted: false,
        canPrint: false,
        canRepeat: false,
        canSplit: true,
        canSaveTemplate: false,
        canSaveStandingOrder: false,
        canSaveSubscription: false,
        canDelete: false,
        type: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionTypeMto',
          name: 'INCOME'
        },
        status: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
          name: 'COMPLETED'
        },
        category: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
          color: '92d690',
          id: '25285887',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            contentTimestamp: 'Thu Nov 16 2017 17:27:29 GMT+0200 (EET)',
            id: 'b3a7ffd5-b02c-49f8-84a8-e247424c85db'
          },
          name: 'Інші доходи'
        },
        operationDate: '2019-01-30T07:53:55.000Z',
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 200,
          currency: {
            __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
            name: 'UAH'
          }
        },
        blockAmount: null,
        postAmount: null,
        sender: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
          bankName: 'АТ "УКРСИББАНК"',
          name: 'NIKOLAY NIKOLAEV',
          tool: '00123498762345'
        },
        receiver: null,
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-01-30T07:53:55.000Z'),
        movements: [
          {
            id: '1480707179',
            account: { id: 'account' },
            invoice: null,
            sum: 200,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2019-01-30_UAH_200_00123498762345_00123498765432',
          '2019-01-30_UAH_200'
        ]
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: 'FF9CA88E4AF34DCCA2C52B82187F6A21',
        alias: 'Переказ на власний рахунок ЗП Start картковий',
        statusText: 'Completed',
        userTool: 'Start Salary card account 26206806560707',
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
            name: 'INCOME'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '25285887',
            name: 'Other income',
            color: '92d690',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'b3a7ffd5-b02c-49f8-84a8-e247424c85db',
                contentTimestamp: new Date('Thu Nov 16 2017 17:27:29 GMT+0200 (EET)')
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
        sender:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: 'NIKOLAY NIKOLAEV',
            tool: 'Start Salary card account 26203807901221',
            bankName: 'АТ "УКРСИББАНК"'
          },
        receiver: null,
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-05-26T17:54:41.000Z'),
        movements: [
          {
            id: 'FF9CA88E4AF34DCCA2C52B82187F6A21',
            account: { id: 'account' },
            invoice: null,
            sum: 130,
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
        id: '4755EF0359D540E4AD799017D68EC382',
        alias: 'Переказ на власний рахунок All Inclusive картковий',
        statusText: 'Completed',
        userTool: 'All Inclusive card account 26203807170304',
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
            name: 'INCOME'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '42403883',
            name: 'Transfers between your accounts',
            color: '33CCCC',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '7d9d95b8-0184-42c8-8a7b-a0b0afa40f52',
                contentTimestamp: new Date('Thu Nov 16 2017 17:59:37 GMT+0200 (EET)')
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
        sender:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: 'NIKOLAY NIKOLAEV',
            tool: 'All Inclusive saving 26203191271102',
            bankName: 'АТ "УКРСИББАНК"'
          },
        receiver: null,
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-03-12T11:07:12+02:00'),
        movements: [
          {
            id: '4755EF0359D540E4AD799017D68EC382',
            account: { id: 'account' },
            invoice: null,
            sum: 10500,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2019-03-12_UAH_10500_26203191271102_26203807170304',
          '2019-03-12_UAH_10500'
        ]
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2916346627',
        alias: 'Зарахування коштів, отриманих після конвертації, купівлі/продажу інозем./нац. валюти згідно з заявою Клієнта',
        statusText: 'Completed',
        userTool: 'AI Ultra картковий 26205805846746',
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
            name: 'INCOME'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '25285887',
            name: 'Інші доходи',
            color: '92d690',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'b3a7ffd5-b02c-49f8-84a8-e247424c85db',
                contentTimestamp: new Date('Thu Nov 16 2017 17:27:29 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Tue Jul 02 2019 08:20:33 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 5.44,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'UAH'
              }
          },
        blockAmount: null,
        postAmount: null,
        sender:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: null,
            tool: '2900430005',
            bankName: 'АТ "УКРСИББАНК"'
          },
        receiver: null,
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-07-02T08:20:33+03:00'),
        movements: [
          {
            id: '2916346627',
            account: { id: 'account' },
            invoice: null,
            sum: 5.44,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Зарахування коштів, отриманих після конвертації, купівлі/продажу інозем./нац. валюти згідно з заявою Клієнта',
        groupKeys: [
          '2019-07-02',
          null
        ]
      }
    ]
  ])('converts inner income transfer', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'UAH' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })

  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '4924063334',
        alias: 'Зарахування коштів за рахунок купівлі іноземної валюти по курсу 24.39 за допомогою UKRSIB online',
        statusText: 'Completed',
        userTool: 'ЗП De Luxe картковий валюта UA813510050000026203807828667',
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
            name: 'INCOME'
          },
        status:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
            name: 'COMPLETED'
          },
        category:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
            id: '42403883',
            name: 'Перерахування між своїми рахунками',
            color: '33CCCC',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '7d9d95b8-0184-42c8-8a7b-a0b0afa40f52',
                contentTimestamp: new Date('Thu Nov 16 2017 17:59:37 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Wed Jan 22 2020 11:56:48 GMT+0200 (EET)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 500,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'USD'
              }
          },
        blockAmount: null,
        postAmount: null,
        sender:
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
            name: 'NIKOLAY NIKOLAEV',
            tool: '26200806568620',
            bankName: 'АТ "УКРСИББАНК"'
          },
        receiver: null,
        parameters: []
      },
      { id: 'account', instrument: 'USD' },
      {
        hold: false,
        date: new Date('Wed Jan 22 2020 11:56:48 GMT+0200 (EET)'),
        movements: [
          {
            id: '4924063334',
            account: { id: 'account' },
            invoice: null,
            sum: 500,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Зарахування коштів за рахунок купівлі іноземної валюти по курсу 24.39 за допомогою UKRSIB online',
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
