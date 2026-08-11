import { convertTransaction } from '../../../converters'

describe('converts outer outcome transfer', () => {
  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '811917B65CF043A7B2EC5742CB62D5AD',
        alias: 'Переказ на карту 537512****3456',
        statusText: 'Completed',
        userTool: 'MC DEBIT EUROSAFE НПК **** 2345',
        manual: false,
        splitted: false,
        canPrint: true,
        canRepeat: true,
        canSplit: true,
        canSaveTemplate: true,
        canSaveStandingOrder: true,
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
          id: '25285903',
          name: 'С карты на карту',
          color: 'f04903',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            id: 'f7c48e58-4519-476a-afaf-72dd3c0aba00',
            contentTimestamp: '2017-11-16T15:51:21.000Z'
          }
        },
        operationDate: '2019-01-31T07:39:56.000Z',
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 0.9,
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
          tool: 'Карта **** 0189',
          bankName: null
        },
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-01-31T07:39:56.000Z'),
        movements: [
          {
            id: '811917B65CF043A7B2EC5742CB62D5AD',
            account: { id: 'account' },
            invoice: null,
            sum: -0.9,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'UAH',
              company: null,
              syncIds: ['0189']
            },
            invoice: null,
            sum: 0.9,
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
        id: '811917B65CF043A7B2EC5742CB62D5AD',
        alias: 'Переказ на карту 537512****3456',
        statusText: 'Completed',
        userTool: 'MC DEBIT EUROSAFE НПК **** 2345',
        manual: false,
        splitted: false,
        canPrint: true,
        canRepeat: true,
        canSplit: true,
        canSaveTemplate: true,
        canSaveStandingOrder: true,
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
          id: '25285903',
          name: 'С карты на карту',
          color: 'f04903',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            id: 'f7c48e58-4519-476a-afaf-72dd3c0aba00',
            contentTimestamp: '2017-11-16T15:51:21.000Z'
          }
        },
        operationDate: '2019-01-31T07:39:56.000Z',
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 0.9,
          currency: {
            __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
            name: 'UAH'
          }
        },
        blockAmount: null,
        postAmount: null,
        sender: null,
        receiver: null,
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-01-31T07:39:56.000Z'),
        movements: [
          {
            id: '811917B65CF043A7B2EC5742CB62D5AD',
            account: { id: 'account' },
            invoice: null,
            sum: -0.9,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'UAH',
              company: null,
              syncIds: ['3456']
            },
            invoice: null,
            sum: 0.9,
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
        id: 'E942644A4C1E4221AFB16326432C43EA',
        alias: 'Переказ на картку 535129****2191 NIKOLAY NIKOLAEV',
        statusText: 'Completed',
        userTool: 'MC PLATINUM **** 7199',
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
            id: '25285903',
            name: 'С карты на карту',
            color: 'f04903',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'f7c48e58-4519-476a-afaf-72dd3c0aba00',
                contentTimestamp: new Date('Thu Nov 16 2017 17:51:21 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Tue Jul 02 2019 19:05:41 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 52,
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
            tool: 'Карта **** 2191',
            bankName: 'АТ "УКРСИББАНК"'
          },
        parameters: []
      },
      {
        hold: false,
        date: new Date('2019-07-02T19:05:41+03:00'),
        movements: [
          {
            id: 'E942644A4C1E4221AFB16326432C43EA',
            account: { id: 'account' },
            invoice: null,
            sum: -52,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'UAH',
              company: { id: '15395' },
              syncIds: ['2191']
            },
            invoice: null,
            sum: 52,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'NIKOLAY NIKOLAEV',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '3522490229',
        alias: 'Переказ грошових коштів на картковий рахунок через MasterCard\\Visa\\SendmoneydbMCuah1323BL DNSK UKR',
        statusText: 'Completed',
        userTool: 'ЗП All Inclusive карточный **** 5925',
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
            id: '25285903',
            name: 'С карты на карту',
            color: 'f04903',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'f7c48e58-4519-476a-afaf-72dd3c0aba00',
                contentTimestamp: new Date('Thu Nov 16 2017 17:51:21 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Wed Sep 11 2019 11:30:16 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 9195,
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
      },
      {
        hold: false,
        date: new Date('2019-09-11T11:30:16+03:00'),
        movements: [
          {
            id: '3522490229',
            account: { id: 'account' },
            invoice: null,
            sum: -9195,
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
            sum: 9195,
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
        id: '9358419677',
        alias: 'Переказ грошових коштів на картковий рахунок через MasterCard\\Visa \\ MONO011\\UA\\KYIV\\Head Off\\MONODirect',
        statusText: 'Completed',
        userTool: 'ЗП AI De Luxe карточный **** 2128',
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
            id: '201326042',
            name: 'Переводы между картами',
            color: '86aec1',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '575eb076-0b06-4e1e-bef8-0e4c24a88cbb',
                contentTimestamp: new Date('Thu Nov 16 2017 17:51:05 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Thu Oct 22 2020 18:12:56 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 100,
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
        parameters:
          [
            {
              __type: 'com.ukrsibbank.client.protocol.transaction.PaymentParameterMto',
              label: 'AUTH_CODE',
              value: '047962'
            }
          ]
      },
      {
        date: new Date('Thu Oct 22 2020 18:12:56 GMT+0300 (EEST)'),
        hold: false,
        movements:
          [
            {
              id: '9358419677',
              account: { id: 'account' },
              invoice: null,
              sum: -100,
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
              sum: 100,
              fee: 0
            }
          ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account' })).toEqual(transaction)
  })
})
