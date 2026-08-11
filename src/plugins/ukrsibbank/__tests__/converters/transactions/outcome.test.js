import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '1902071127',
        alias: 'Оплата товарів\\послуг \\ S1120BA3\\UA\\KHARKOV\\SOME\\PLACE',
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
          name: 'EXPENSE'
        },
        status: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
          name: 'COMPLETED'
        },
        category: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
          id: '25285915',
          name: 'Кафе и рестораны',
          color: 'fc6042',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            id: 'd66c30c7-8991-4b19-a818-93397f921cc5',
            contentTimestamp: '2017-11-16T16:00:59.000Z'
          }
        },
        operationDate: '2019-01-31T16:00:49.000Z',
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 3,
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
          bankName: null
        },
        parameters: [
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.PaymentParameterMto',
            label: 'AUTH_CODE',
            value: '123456'
          }
        ]
      },
      {
        hold: false,
        date: new Date('2019-01-31T16:00:49.000Z'),
        movements: [
          {
            id: '1902071127',
            account: { id: 'account' },
            invoice: null,
            sum: -3,
            fee: 0
          }
        ],
        merchant: {
          city: 'KHARKOV',
          country: 'UA',
          location: null,
          mcc: null,
          title: 'SOME PLACE',
          category: '25285915'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '1902071126',
        alias: 'Оплата товарів\\послуг \\ 20908686\\UA\\KYIV\\SOME\\PLACE',
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
          name: 'EXPENSE'
        },
        status: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
          name: 'COMPLETED'
        },
        category: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
          id: '271910830',
          name: 'Оплата услуг в интернете',
          color: '86aec1',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            id: 'a4542ec9-00cd-4760-b6ed-d9c886e803ae',
            contentTimestamp: '2017-11-16T15:56:34.000Z'
          }
        },
        operationDate: '2019-01-31T07:32:41.000Z',
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 1,
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
          bankName: null
        },
        parameters: [
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.PaymentParameterMto',
            label: 'AUTH_CODE',
            value: '123445'
          }
        ]
      },
      {
        hold: false,
        date: new Date('2019-01-31T07:32:41.000Z'),
        movements: [
          {
            id: '1902071126',
            account: { id: 'account' },
            invoice: null,
            sum: -1,
            fee: 0
          }
        ],
        merchant: {
          city: 'KYIV',
          country: 'UA',
          location: null,
          mcc: null,
          title: 'SOME PLACE',
          category: '271910830'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '1902071125',
        alias: 'Оплата товарів\\послуг \\ S11200RF\\UA\\KHARKOV\\SOME\\PLACE',
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
          name: 'EXPENSE'
        },
        status: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
          name: 'COMPLETED'
        },
        category: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
          id: '25285901',
          name: 'Продуктовые магазины',
          color: '3498db',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            id: '82dfd15a-87b4-419d-a18f-6b8928401568',
            contentTimestamp: '2017-11-16T16:01:17.000Z'
          }
        },
        operationDate: '2019-01-31T07:20:56.000Z',
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 6.99,
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
          bankName: null
        },
        parameters: [
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.PaymentParameterMto',
            label: 'AUTH_CODE',
            value: '2134Z6'
          }
        ]
      },
      {
        hold: false,
        date: new Date('2019-01-31T07:20:56.000Z'),
        movements: [
          {
            id: '1902071125',
            account: { id: 'account' },
            invoice: null,
            sum: -6.99,
            fee: 0
          }
        ],
        merchant: {
          city: 'KHARKOV',
          country: 'UA',
          location: null,
          mcc: null,
          title: 'SOME PLACE',
          category: '25285901'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '1902071124',
        alias: 'Оплата товарів\\послуг \\ S1120CZ9\\UA\\KHARKOV\\SOME\\PLACE',
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
          name: 'EXPENSE'
        },
        status: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
          name: 'COMPLETED'
        },
        category: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
          id: '25285899',
          name: 'Аптеки',
          color: 'fc6042',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            id: 'a3a2a6cd-f870-4404-82d9-1a8fb22dfe40',
            contentTimestamp: '2017-11-16T15:37:39.000Z'
          }
        },
        operationDate: '2019-01-31T07:15:10.000Z',
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 2.5,
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
          bankName: null
        },
        parameters: [
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.PaymentParameterMto',
            label: 'AUTH_CODE',
            value: '76523A'
          }
        ]
      },
      {
        hold: false,
        date: new Date('2019-01-31T07:15:10.000Z'),
        movements: [
          {
            id: '1902071124',
            account: { id: 'account' },
            invoice: null,
            sum: -2.5,
            fee: 0
          }
        ],
        merchant: {
          city: 'KHARKOV',
          country: 'UA',
          location: null,
          mcc: null,
          title: 'SOME PLACE',
          category: '25285899'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '1902071123',
        alias: 'Оплата товарів\\послуг \\ S11205KM\\UA\\KHARKOV\\SOME\\PLACE',
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
          name: 'EXPENSE'
        },
        status: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
          name: 'COMPLETED'
        },
        category: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
          id: '25285901',
          name: 'Продуктовые магазины',
          color: '3498db',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            id: '82dfd15a-87b4-419d-a18f-6b8928401568',
            contentTimestamp: '2017-11-16T16:01:17.000Z'
          }
        },
        operationDate: '2019-01-31T07:13:04.000Z',
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 7.13,
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
          bankName: null
        },
        parameters: [
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.PaymentParameterMto',
            label: 'AUTH_CODE',
            value: '765234'
          }
        ]
      },
      {
        hold: false,
        date: new Date('2019-01-31T07:13:04.000Z'),
        movements: [
          {
            id: '1902071123',
            account: { id: 'account' },
            invoice: null,
            sum: -7.13,
            fee: 0
          }
        ],
        merchant: {
          city: 'KHARKOV',
          country: 'UA',
          location: null,
          mcc: null,
          title: 'SOME PLACE',
          category: '25285901'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '5562059794',
        alias: 'Оплата товарів\\послуг\\EKO-LAVKA m.Kyiv UKR : Apple Pay ****6765.',
        statusText: 'Completed',
        userTool: 'ЗП AI De Luxe картковий **** 9218',
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
            id: '25285901',
            name: 'Продуктові магазини',
            color: '3498db',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '82dfd15a-87b4-419d-a18f-6b8928401568',
                contentTimestamp: new Date('Thu Nov 16 2017 19:01:17 GMT+0300 (+03)')
              }
          },
        operationDate: new Date('Fri Mar 06 2020 21:04:01 GMT+0300 (+03)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 105.98,
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
        date: new Date('Fri Mar 06 2020 21:04:01 GMT+0300 (+03)'),
        movements: [
          {
            id: '5562059794',
            account: { id: 'account' },
            invoice: null,
            sum: -105.98,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'EKO-LAVKA m.Kyiv UKR',
          location: null,
          mcc: null,
          category: '25285901'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        alias: 'Оплата товарів\\послуг \\ \\GB\\London\\3rd fl\\AliExpress',
        blockAmount: null,
        canDelete: false,
        canPrint: false,
        canRepeat: false,
        canSaveStandingOrder: false,
        canSaveSubscription: false,
        canSaveTemplate: false,
        canSplit: true,
        category: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionCategoryMto',
          color: 'f1c40f',
          id: '25285867',
          image: {
            __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
            contentTimestamp: 'Thu Nov 16 2017 17:57:19 GMT+0200 (EET)',
            id: 'e79dec4d-31c4-4dbc-9671-9b8d84ab3e77'
          },
          name: 'Інші товари'
        },
        id: '1901442386',
        manual: false,
        operationAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          currency: {
            __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
            name: 'USD'
          },
          sum: 1.22
        },
        operationDate: 'Thu Jan 31 2019 14:43:56 GMT+0200 (EET)',
        parameters: [
          {
            __type: 'com.ukrsibbank.client.protocol.transaction.PaymentParameterMto',
            label: 'AUTH_CODE',
            value: '784586'
          }
        ],
        postAmount: {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          currency: {
            __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
            name: 'UAH'
          },
          sum: 34.18
        },
        receiver: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
          bankName: 'АТ "УКРСИББАНК"',
          name: null,
          tool: '29245000000117'
        },
        sender: null,
        splitted: false,
        status: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
          name: 'COMPLETED'
        },
        statusText: 'Completed',
        type: {
          __type: 'com.ukrsibbank.client.protocol.transaction.TransactionTypeMto',
          name: 'EXPENSE'
        },
        userTool: 'Welcome card 00123498765432'
      },
      {
        hold: false,
        date: new Date('2019-01-31T12:43:56.000Z'),
        movements: [
          {
            id: '1901442386',
            account: { id: 'account' },
            invoice: {
              sum: -1.22,
              instrument: 'USD'
            },
            sum: -34.18,
            fee: 0
          }
        ],
        merchant: {
          city: 'London',
          country: 'GB',
          location: null,
          mcc: null,
          title: '3rd fl AliExpress',
          category: '25285867'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '9467888378',
        alias: 'Оплата товарів\\послуг - інтернет\\Patreon Membership INTERNET IRL',
        statusText: 'Completed',
        userTool: 'AI De Luxe Salary card account **** 0292',
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
        operationDate: new Date('Sun Nov 01 2020 21:28:38 GMT+0200 (EET)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 19,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'USD'
              }
          },
        blockAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 552.71,
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
        date: new Date('Sun Nov 01 2020 21:28:38 GMT+0200 (EET)'),
        movements: [
          {
            id: '9467888378',
            account: { id: 'account' },
            invoice: {
              sum: -19,
              instrument: 'USD'
            },
            sum: -552.71,
            fee: 0
          }
        ],
        merchant: {
          location: null,
          mcc: null,
          fullTitle: 'Patreon Membership INTERNET IRL',
          category: '25285886'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '9604202867',
        alias: 'Оплата товарів\\послуг\\FRESTIVE KEROBOKAN BADUNG IDN',
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
            id: '25285901',
            name: 'Продуктові магазини',
            color: '3498db',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '82dfd15a-87b4-419d-a18f-6b8928401568',
                contentTimestamp: new Date('Fri Nov 17 2017 00:01:17 GMT+0800 (WITA)')
              }
          },
        operationDate: new Date('Sun Nov 08 2020 20:06:37 GMT+0800 (WITA)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 550800,
            currency:
              {
                __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
                name: 'IDR'
              }
          },
        blockAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 1128.11,
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
        date: new Date('Sun Nov 08 2020 20:06:37 GMT+0800 (WITA)'),
        hold: false,
        movements:
          [
            {
              id: '9604202867',
              account: { id: 'account' },
              invoice: {
                sum: -550800,
                instrument: 'IDR'
              },
              sum: -1128.11,
              fee: 0
            }
          ],
        merchant:
          {
            fullTitle: 'FRESTIVE KEROBOKAN BADUNG IDN',
            mcc: null,
            location: null,
            category: '25285901'
          },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '4982282205',
        alias: 'Оплата товарів\\послуг\\Lioncoffee KIYEV UKR : Google Pay ****8207.',
        statusText: 'Completed',
        userTool: 'ЗП AI De Luxe картковий **** 3721',
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
            id: '25285915',
            name: 'Кафе та ресторани',
            color: 'fc6042',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'd66c30c7-8991-4b19-a818-93397f921cc5',
                contentTimestamp: new Date('Thu Nov 16 2017 18:00:59 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Mon Jan 27 2020 15:23:49 GMT+0200 (EET)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 35,
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
        date: new Date('Mon Jan 27 2020 15:23:49 GMT+0200 (EET)'),
        movements: [
          {
            id: '4982282205',
            account: { id: 'account' },
            invoice: null,
            sum: -35,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Lioncoffee KIYEV UKR',
          location: null,
          mcc: null,
          category: '25285915'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '4923910476',
        alias: 'Оплата товарів\\послуг \\ R0138599\\UA\\KYIV\\KAFE BANQUET: : Google Pay ****8207.',
        statusText: 'Completed',
        userTool: 'ЗП AI De Luxe картковий **** 3721',
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
            id: '25285915',
            name: 'Кафе та ресторани',
            color: 'fc6042',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: 'd66c30c7-8991-4b19-a818-93397f921cc5',
                contentTimestamp: new Date('Thu Nov 16 2017 18:00:59 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Mon Jan 20 2020 13:26:29 GMT+0200 (EET)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 75,
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
              value: '614258'
            }
          ]
      },
      {
        hold: false,
        date: new Date('Mon Jan 20 2020 13:26:29 GMT+0200 (EET)'),
        movements: [
          {
            id: '4923910476',
            account: { id: 'account' },
            invoice: null,
            sum: -75,
            fee: 0
          }
        ],
        merchant: {
          country: 'UA',
          city: 'KYIV',
          title: 'KAFE BANQUET',
          location: null,
          mcc: null,
          category: '25285915'
        },
        comment: null
      }
    ],
    [
      {
        __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
        id: '18387219208',
        alias: 'Оплата товарів\\послуг \\ S1180FVM\\UA\\STRYY\\Lvivska\\PR1364',
        statusText: 'Completed',
        userTool: 'ЗП AI De Luxe картковий **** 7967',
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
            id: '25285901',
            name: 'Продуктові магазини',
            color: '3498db',
            image:
              {
                __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
                id: '82dfd15a-87b4-419d-a18f-6b8928401568',
                contentTimestamp: new Date('Thu Nov 16 2017 18:01:17 GMT+0200 (EET)')
              }
          },
        operationDate: new Date('Tue Nov 30 2021 18:00:51 GMT+0200 (EET)'),
        operationAmount:
          {
            __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
            sum: 380.1,
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
              value: '775818'
            }
          ]
      },
      {
        date: new Date('2021-11-30T16:00:51.000Z'), // Tue Nov 30 2021 18:00:51 GMT+0200 (EET),
        hold: false,
        movements:
          [
            {
              id: '18387219208',
              account: { id: 'account' },
              invoice: null,
              sum: -380.1,
              fee: 0
            }
          ],
        merchant:
          {
            country: 'UA',
            city: 'STRYY',
            title: 'Lvivska PR1364',
            mcc: null,
            location: null,
            category: '25285901'
          },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'UAH' })).toEqual(transaction)
  })
})
