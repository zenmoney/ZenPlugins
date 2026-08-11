import { convertTransaction } from '../../../converters'

it('converts outer income transfer', () => {
  const account = { id: 'account', instrument: 'UAH' }
  const apiTransactions = [
    {
      __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
      id: '1904042521',
      alias: 'Зарахування грошових коштів  на картковий рахунок через Master Card/Visa \\  MONO011\\UA\\KYIV\\SOME\\MONODirect',
      statusText: 'Completed',
      userTool: 'Welcome card **** 4321',
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
        id: '740223117',
        name: 'Переводы на карту',
        color: '86aec1',
        image: {
          __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
          id: 'b3a7ffd5-b02c-49f8-84a8-e247424c85db',
          contentTimestamp: '2017-11-16T15:27:29.000Z'
        }
      },
      operationDate: '2019-01-31T07:38:18.000Z',
      operationAmount: {
        __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
        sum: 2,
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
        tool: null,
        bankName: null
      },
      receiver: null,
      parameters: [
        {
          __type: 'com.ukrsibbank.client.protocol.transaction.PaymentParameterMto',
          label: 'AUTH_CODE',
          value: '123456'
        }
      ]
    },
    {
      __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
      id: 'B0FD0A9015AC44DB85F3387CF7363F65',
      alias: 'Переказ на картку від NIKOLAY NIKOLAEV',
      statusText: 'Completed',
      userTool: 'MC PLATINUM **** 8723',
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
          id: '324668306',
          name: 'Безналичное пополнение',
          color: '86aec1',
          image:
            {
              __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
              id: '35f0843a-a91f-4353-8521-aa6ab2688f62',
              contentTimestamp: new Date('Thu Nov 16 2017 17:51:36 GMT+0200 (EET)')
            }
        },
      operationDate: new Date('Wed Jul 03 2019 15:08:52 GMT+0300 (EEST)'),
      operationAmount:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 238,
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
          tool: 'MC GOLD **** 1232',
          bankName: 'АТ "УКРСИББАНК"'
        },
      receiver: null,
      parameters: []
    },
    {
      __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
      id: '2946408648',
      alias: 'Зарахування грошових коштів на картковий рахунок через MasterCard\\Visa\\MONODirect KYIV UKR',
      statusText: 'Completed',
      userTool: 'ЗП All Inclusive картковий **** 3369',
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
          id: '740223117',
          name: 'Перекази на картку',
          color: '86aec1',
          image:
            {
              __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
              id: 'b3a7ffd5-b02c-49f8-84a8-e247424c85db',
              contentTimestamp: new Date('Thu Nov 16 2017 17:27:29 GMT+0200 (EET)')
            }
        },
      operationDate: new Date('Sat Jul 06 2019 12:41:07 GMT+0300 (EEST)'),
      operationAmount:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 1500,
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
    }
  ]

  const expectedTransactions = [
    {
      hold: false,
      date: new Date('2019-01-31T07:38:18.000Z'),
      movements: [
        {
          id: '1904042521',
          account: { id: 'account' },
          invoice: null,
          sum: 2,
          fee: 0
        },
        {
          id: null,
          account: {
            company: { id: '15620' },
            instrument: 'UAH',
            syncIds: null,
            type: 'ccard'
          },
          invoice: null,
          sum: -2,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Переводы на карту'
    },
    {
      hold: false,
      date: new Date('2019-07-03T15:08:52+03:00'),
      movements: [
        {
          id: 'B0FD0A9015AC44DB85F3387CF7363F65',
          account: { id: 'account' },
          invoice: null,
          sum: 238,
          fee: 0
        },
        {
          id: null,
          account: {
            company: { id: '15395' },
            instrument: 'UAH',
            syncIds: ['1232'],
            type: 'ccard'
          },
          invoice: null,
          sum: -238,
          fee: 0
        }
      ],
      merchant: { city: null, country: null, location: null, mcc: null, title: 'NIKOLAY NIKOLAEV' },
      comment: null
    },
    {
      hold: false,
      date: new Date('2019-07-06T12:41:07+03:00'),
      movements: [
        {
          id: '2946408648',
          account: { id: 'account' },
          invoice: null,
          sum: 1500,
          fee: 0
        },
        {
          id: null,
          account: {
            company: { id: '15620' },
            instrument: 'UAH',
            syncIds: null,
            type: 'ccard'
          },
          invoice: null,
          sum: -1500,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Перекази на картку'
    }
  ]

  expect(apiTransactions.map(it => convertTransaction(it, account))).toEqual(expectedTransactions)
})
