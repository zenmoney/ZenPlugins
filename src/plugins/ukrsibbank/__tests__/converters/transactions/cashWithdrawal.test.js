import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '2906734502',
        alias: 'Отримання готівки в банкоматі банку \\ A0308259\\UA\\KYIV\\UKRSIBBANK',
        statusText: 'Completed',
        userTool: 'AI Ultra картковий **** 2463',
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
            id: '48855522',
            name: 'Банкомат',
            color: 'f1c40f',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '443a6f7a-1411-46c9-b991-5892bc37fa7b',
                contentTimestamp: new Date('Thu Nov 16 2017 17:50:33 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Sun Jun 30 2019 11:49:08 GMT+0300 (EEST)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 1000,
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
              value: '118496'
            }
          ]
      },
      {
        hold: false,
        date: new Date('2019-06-30T11:49:08+03:00'),
        movements: [
          {
            id: '2906734502',
            account: { id: 'account' },
            invoice: null,
            sum: -1000,
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
            sum: 1000,
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
        id: '9611863319',
        alias: 'Отримання готівки в банкоматі іншого банку\\KEROBOKAN 0 KEJARDPS DENPASAR IDN',
        statusText: 'Completed',
        userTool: 'ЗП Black edition картковий **** 9350',
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
            id: '48855522',
            name: 'Банкомат',
            color: 'f1c40f',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '443a6f7a-1411-46c9-b991-5892bc37fa7b',
                contentTimestamp: new Date('Thu Nov 16 2017 23:50:33 GMT+0800 (WITA)')
              }
          },
        operationDate: new Date('Mon Nov 09 2020 11:41:11 GMT+0800 (WITA)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 1500000,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'IDR'
              }
          },
        blockAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 3103.89,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'UAH'
              }
          },
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
        date: new Date('2020-11-09T03:41:11.000Z'),
        movements: [
          {
            id: '9611863319',
            account: { id: 'account' },
            invoice: {
              sum: -1500000,
              instrument: 'IDR'
            },
            sum: -3103.89,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'IDR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 1500000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'UAH' })).toEqual(transaction)
  })
})
