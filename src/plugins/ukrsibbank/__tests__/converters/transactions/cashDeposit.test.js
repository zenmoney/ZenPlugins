import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '1874613005',
        alias: 'Поповнення готівкою у відділенні без картки',
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
          id: '25285887',
          name: 'Прочие доходы',
          color: '92d690',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            id: 'b3a7ffd5-b02c-49f8-84a8-e247424c85db',
            contentTimestamp: '2017-11-16T15:27:29.000Z'
          }
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
          name: null,
          tool: '10025000002128',
          bankName: 'АТ "УКРСИББАНК"'
        },
        receiver: null,
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-01-30T07:53:55.000Z'),
        movements: [
          {
            id: '1874613005',
            account: { id: 'account' },
            invoice: null,
            sum: 200,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'UAH',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -200,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2128122467',
        alias: 'Поповнення готівковими коштами через банкомат \\ BUL. TARASA SHEVCHE    KYIV          UKR',
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
                contentTimestamp: 'Thu Nov 16 2017 18:27:29 GMT+0300 (MSK)'
              }
          },
        operationDate: 'Sun Mar 10 2019 17:36:43 GMT+0300 (MSK)',
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 1400,
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
            tool: null,
            bankName: null
          },
        receiver: null,
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-03-10T14:36:43.000Z'),
        movements: [
          {
            id: '2128122467',
            account: { id: 'account' },
            invoice: null,
            sum: 1400,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'UAH',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -1400,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts cash deposit', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'UAH' })).toEqual(transaction)
  })
})
