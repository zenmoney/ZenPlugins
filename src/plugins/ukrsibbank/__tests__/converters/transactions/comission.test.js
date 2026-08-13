import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts comission', () => {
    const apiTransactions = [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2443521798',
        alias: 'Щомісячна плата за надання довідок про проведені операції з використанням картки (StarSMS)\\26206807211789\\USD',
        statusText: 'Completed',
        userTool: 'All Inclusive card account 26203807161290',
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
            id: '25285893',
            name: 'Bank\'s commissions',
            color: 'f1c40f',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '45d2b5f1-ba8b-40e0-8cbf-e579edbc75fc',
                contentTimestamp: new Date('Thu Nov 16 2017 17:35:46 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Sat Apr 27 2019 01:21:26 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 10,
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
            name: null,
            tool: null,
            bankName: 'АТ "УКРСИББАНК"'
          },
        parameters: []
      },
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '1883325881',
        alias: 'Щорічний платіж за тарифний план (комісія за обслуговування рахунків)',
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
          name: 'EXPENSE'
        },
        status: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
          name: 'COMPLETED'
        },
        category: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
          id: '25285893',
          name: 'Комиссии банка',
          color: 'f1c40f',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            id: '45d2b5f1-ba8b-40e0-8cbf-e579edbc75fc',
            contentTimestamp: '2017-11-16T15:35:46.000Z'
          }
        },
        operationDate: '2019-01-31T21:28:27.000Z',
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 10,
          currency: {
            __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
            name: 'UAH'
          }
        },
        blockAmount: null,
        postAmount: null,
        sender: null,
        receiver: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
          name: null,
          tool: null,
          bankName: 'АТ "УКРСИББАНК"'
        },
        parameters: []
      },
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2679052575',
        alias: 'Утримання комісії по рахунку № 26203807170304 за провед.опер. задоп. StarSMS зг. Дог. 11000191271100від 30.05.2012 без ПДВ:Утримання комісії по рахунку № 26203807170304 за провед.опер. задоп. StarSMS зг. Дог. 11000191271',
        statusText: 'Completed',
        userTool: 'All Inclusive saving 26203191271102',
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
            name: 'Other costs',
            color: '8dc0b2',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'f52005df-7f93-4584-8f38-b9a6f871358f',
                contentTimestamp: new Date('Thu Nov 16 2017 17:27:14 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Sat Jun 01 2019 00:45:31 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 10,
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
            name: null,
            tool: null,
            bankName: 'АТ "УКРСИББАНК"'
          },
        parameters: []
      },
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2921594058',
        alias: 'Комісія за б/г поповнення карткового рахунку з інших рахунків Клієнта',
        statusText: 'Completed',
        userTool: 'AI De Luxe 26203805504682',
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
            name: 'Прочие расходы',
            color: '8dc0b2',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'f52005df-7f93-4584-8f38-b9a6f871358f',
                contentTimestamp: new Date('Thu Nov 16 2017 17:27:14 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Wed Jul 03 2019 15:01:31 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 264.05,
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
            name: null,
            tool: null,
            bankName: null
          },
        parameters: []
      }
    ]

    const account = { id: 'account', instrument: 'UAH' }
    const expectedTransactions = [
      {
        hold: false,
        date: new Date('2019-04-27T01:21:26+03:00'),
        movements: [
          {
            id: '2443521798',
            account: { id: 'account' },
            invoice: null,
            sum: -10,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Щомісячна плата за надання довідок про проведені операції з використанням картки (StarSMS)\\26206807211789\\USD'
      },
      {
        hold: false,
        date: new Date('2019-01-31T21:28:27.000Z'),
        movements: [
          {
            id: '1883325881',
            account: { id: 'account' },
            invoice: null,
            sum: -10,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Щорічний платіж за тарифний план (комісія за обслуговування рахунків)'
      },
      {
        hold: false,
        date: new Date('2019-06-01T00:45:31+03:00'),
        movements: [
          {
            id: '2679052575',
            account: { id: 'account' },
            invoice: null,
            sum: -10,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Утримання комісії по рахунку № 26203807170304 за провед.опер. задоп. StarSMS зг. Дог. 11000191271100від 30.05.2012 без ПДВ:Утримання комісії по рахунку № 26203807170304 за провед.опер. задоп. StarSMS зг. Дог. 11000191271'
      },
      {
        hold: false,
        date: new Date('2019-07-03T15:01:31+03:00'),
        movements: [
          {
            id: '2921594058',
            account: { id: 'account' },
            invoice: null,
            sum: -264.05,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Комісія за б/г поповнення карткового рахунку з інших рахунків Клієнта'
      }
    ]

    expect(apiTransactions.map(it => convertTransaction(it, account))).toEqual(expectedTransactions)
  })
})
