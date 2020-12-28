import { converter } from '../../../converters/transaction'

describe('convertTransactions', () => {
  it.each([
    [
      {
        date: 1589033875000,
        itemType: 'OPERATION',
        authCode: '459870',
        bonus: {
          income: true,
          amount: 7.94,
          incomeExpectations: true,
          incomeDate: 1589336501000,
          availabilityDate: 1590243475000,
          currency: 'BAL',
          details: [
            {
              amount: 7.94,
              action: '1% за оплату картой Mastercard',
              actionId: 135679,
              currency: 'BAL',
              isPromo: false
            }
          ]
        },
        channel: 'POS',
        description: 'SKYPE.COM/GO/BILL, LUXEMBOURG',
        movements: [
          {
            date: 1589033875000,
            income: false,
            amount: 840.04,
            rates: [
              {
                amountTo: 80.0,
                amountFrom: 1.0,
                currencyTo: 'RUR',
                currencyFrom: 'EUR'
              }
            ],
            currency: 'RUR',
            id: '429835675#818150533',
            type: 'AUTHORIZATION_HOLD'
          }, {
            date: 1589335383000,
            income: false,
            returnedReserve: 45.65,
            amount: 794.39,
            rates: [
              {
                amountTo: 79.44,
                amountFrom: 1.0,
                currencyTo: 'RUR',
                currencyFrom: 'EUR'
              }
            ],
            rateUpdated: 1589360583000,
            currency: 'RUR',
            id: '429835675#873930446',
            type: 'WITHDRAW'
          }, {
            date: 1589336501000,
            income: true,
            amount: 7.94,
            currency: 'BAL',
            id: '429835675#836916437',
            type: 'BONUS_INCOME'
          }
        ],
        title: 'SKYPE.COM/GO/BILL',
        mcc: {
          code: '5968',
          groupDescription: 'Услуги',
          description: 'Услуги по подписке',
          groupCode: 'services'
        },
        type: 'PURCHASE',
        actor: 'CONSUMER',
        money: {
          income: false,
          amount: 10.0,
          amountDetail: {
            amount: 794.39,
            acquirerCommission: 0.0,
            own: 794.39,
            commission: 0.0,
            credit: 0.0
          },
          currency: 'EUR',
          accountAmount: {
            amount: 794.39,
            currency: 'RUR'
          }
        },
        contractId: 3353117,
        id: '429835675',
        statisticGroup: {
          code: 'mcc-group#services',
          name: 'Услуги'
        },
        status: 'DONE'
      },
      {
        hold: false,
        date: new Date(1589033875000),
        movements: [
          {
            id: '429835675',
            account: { id: 'c-3702600' },
            invoice: {
              sum: -10,
              instrument: 'EUR'
            },
            sum: -794.39,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'LUXEMBOURG',
          title: 'SKYPE.COM/GO/BILL',
          mcc: 5968,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        date: 1584774334000,
        itemType: 'OPERATION',
        serviceCode: 'GIN2S515',
        bonus: {
          bonuslessReason: 'OTHER',
          incomeExpectations: false,
          details: []
        },
        typeName: '',
        channel: 'MOBILE',
        movements: [
          {
            date: 1584774334000,
            income: false,
            amount: 79.17,
            contractId: 3353117,
            currency: 'RUR',
            id: '420088380#796597890',
            type: 'AUTHORIZATION_HOLD'
          }, {
            date: 1584774340000,
            income: false,
            amount: 79.17,
            currency: 'RUR',
            id: '420088380#859806100',
            type: 'WITHDRAW'
          }
        ],
        title: 'Мой сотовый',
        type: 'PAYMENT',
        serviceName: 'Сотовый - МТС (б/н) (9811227242)',
        payTemplate: {
          code: 'PAY_TEMPLATE220630735',
          repeatable: true,
          name: 'Мой сотовый',
          accepted: true,
          iconCode: 'mMTS',
          id: '220630735'
        },
        actor: 'CONSUMER',
        counterpartyCode: 'mobile-telesystemy',
        money: {
          income: false,
          amount: 79.17,
          amountDetail: {
            amount: 79.17,
            own: 79.17,
            commission: 0.0,
            credit: 0.0
          },
          currency: 'RUR',
          accountAmount: {
            amount: 79.17,
            currency: 'RUR'
          }
        },
        cardId: 3702600,
        contractId: 3353117,
        id: 420088380,
        statisticGroup: {
          code: 'payments',
          name: 'Платежи из кабинета'
        },
        status: '0#DONE'
      },
      {
        hold: false,
        date: new Date(1584774334000),
        movements: [
          {
            id: '420088380',
            account: { id: 'c-3702600' },
            invoice: null,
            sum: -79.17,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Мой сотовый',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        date: 1599330948000,
        itemType: 'OPERATION',
        authCode: '672381',
        bonus: {
          income: true,
          amount: 14.35,
          incomeExpectations: true,
          incomeDate: 1599540013000,
          availabilityDate: 1600540548000,
          currency: 'BAL',
          details: [
            {
              amount: 11.48,
              action: '4% за оплату на OZON',
              actionId: 136099,
              currency: 'BAL',
              isPromo: false
            }, {
              amount: 2.87,
              action: '1% за оплату картой Mastercard',
              actionId: 135679,
              currency: 'BAL',
              isPromo: false
            }
          ]
        },
        channel: 'POS',
        description: 'YM*OZON, MOSCOW, 82 BLD 2 SADOVNICHESKAYA STR',
        movements: [
          {
            date: 1599330948000,
            income: false,
            amount: 287.0,
            currency: 'RUR',
            id: '456904708#876381942',
            type: 'AUTHORIZATION_HOLD'
          }, {
            date: 1599538870000,
            income: false,
            amount: 287.0,
            currency: 'RUR',
            id: '456904708#888507799',
            type: 'WITHDRAW'
          }, {
            date: 1599540013000,
            income: true,
            amount: 14.35,
            currency: 'BAL',
            id: '456904708#878001058',
            type: 'BONUS_INCOME'
          }
        ],
        title: 'Ozon',
        mcc: {
          code: '5399',
          groupDescription: 'Магазины',
          description: 'Товары общего назначения',
          groupCode: 'shops'
        },
        type: 'PURCHASE',
        actor: 'CONSUMER',
        counterpartyCode: 'ozon-ru',
        money: {
          income: false,
          amount: 287.0,
          amountDetail: {
            amount: 287.0,
            acquirerCommission: 0.0,
            own: 287.0,
            commission: 0.0,
            credit: 0.0
          },
          currency: 'RUR',
          accountAmount: {
            amount: 287.0,
            currency: 'RUR'
          }
        },
        contractId: 3353117,
        id: 456904708,
        statisticGroup: {
          code: 'mcc-group#shops',
          name: 'Магазины'
        },
        status: 'DONE'
      },
      {
        hold: false,
        date: new Date(1599330948000),
        movements: [
          {
            id: '456904708',
            account: { id: 'c-3702600' },
            invoice: null,
            sum: -287,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'MOSCOW',
          title: 'Ozon',
          mcc: 5399,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        date: 1584269243000,
        itemType: 'OPERATION',
        authCode: '912373',
        bonus: {
          income: true,
          amount: 22.47,
          incomeExpectations: true,
          incomeDate: 1584418759000,
          availabilityDate: 1585478843000,
          currency: 'BAL',
          details: [
            {
              amount: 22.47,
              action: '1,5% за оплату картой Mastercard',
              actionId: 66539,
              currency: 'BAL',
              isPromo: false
            }
          ]
        },
        channel: 'POS',
        description: 'CY AIRPORTS DUTY F, LARNACA',
        movements: [
          {
            date: 1584269243000,
            income: false,
            amount: 1555.76,
            rate: 81.86,
            currency: 'RUR',
            id: '418224645#793392056',
            type: 'AUTHORIZATION_HOLD'
          }, {
            date: 1584417347000,
            income: false,
            returnedReserve: 58.04,
            amount: 1497.72,
            rate: 82.75,
            rateUpdated: 1584442547000,
            currency: 'RUR',
            id: '418224645#858966059',
            type: 'WITHDRAW'
          }, {
            date: 1584418759000,
            income: true,
            amount: 22.47,
            currency: 'BAL',
            id: '418224645#794291377',
            type: 'BONUS_INCOME'
          }
        ],
        title: 'CY AIRPORTS DUTY F',
        mcc: {
          code: '5309',
          groupDescription: 'Магазины',
          description: 'Беспошлинные магазины Duty Free',
          groupCode: 'shops'
        },
        type: 'PURCHASE',
        actor: 'CONSUMER',
        money: {
          income: false,
          amount: 18.1,
          amountDetail: {
            amount: 1497.72,
            acquirerCommission: 0.0,
            own: 1497.72,
            commission: 0.0,
            credit: 0.0
          },
          currency: 'EUR',
          accountAmount: {
            amount: 1497.72,
            currency: 'RUR'
          }
        },
        contractId: 3353117,
        id: 418224645,
        statisticGroup: {
          code: 'mcc-group#shops',
          name: 'Магазины'
        },
        status: 'DONE'
      },
      {
        hold: false,
        date: new Date(1584269243000),
        movements: [
          {
            id: '418224645',
            account: { id: 'c-3702600' },
            invoice: { sum: -18.1, instrument: 'EUR' },
            sum: -1497.72,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'LARNACA',
          title: 'CY AIRPORTS DUTY F',
          mcc: 5309,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        date: 1577983098000,
        itemType: 'OPERATION',
        authCode: '577810',
        bonus: {
          income: true,
          amount: 25.76,
          incomeExpectations: true,
          incomeDate: 1578535299000,
          availabilityDate: 1579192698000,
          currency: 'BAL',
          details: [
            {
              amount: 25.76,
              action: '1,5% за оплату картой Mastercard',
              actionId: 66539,
              currency: 'BAL',
              isPromo: false
            }
          ]
        },
        channel: 'POS',
        description: 'AliExpress.com, LONDON, CANARY WHARF',
        movements: [
          {
            date: 1577983098000,
            income: false,
            amount: 1803.12,
            rate: 61.91,
            currency: 'RUR',
            id: '401106003#753915573',
            type: 'AUTHORIZATION_HOLD'
          }, {
            date: 1578533735000,
            income: false,
            returnedReserve: 85.86,
            amount: 1717.26,
            rate: 61.91,
            rateUpdated: 1578558935000,
            currency: 'RUR',
            id: '401106003#845717287',
            type: 'WITHDRAW'
          }, {
            date: 1578535299000,
            income: true,
            amount: 25.76,
            currency: 'BAL',
            id: '401106003#757103679',
            type: 'BONUS_INCOME'
          }
        ],
        title: 'Aliexpress',
        mcc: {
          code: '5311',
          groupDescription: 'Товары для дома',
          description: 'Универмаги',
          groupCode: 'household-products'
        },
        type: 'PURCHASE',
        actor: 'CONSUMER',
        counterpartyCode: 'aliexpress',
        money: {
          income: false,
          amount: 27.74,
          amountDetail: {
            amount: 1717.26,
            acquirerCommission: 0.0,
            own: 1717.26,
            commission: 0.0,
            credit: 0.0
          },
          currency: 'USD',
          accountAmount: {
            amount: 1717.26,
            currency: 'RUR'
          }
        },
        contractId: 3353117,
        id: 401106003,
        statisticGroup: {
          code: 'mcc-group#household-products',
          name: 'Товары для дома'
        },
        status: 'DONE'
      },
      {
        hold: false,
        date: new Date(1577983098000),
        movements: [
          {
            id: '401106003',
            account: { id: 'c-3702600' },
            invoice: { sum: -27.74, instrument: 'USD' },
            sum: -1717.26,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'LONDON',
          title: 'Aliexpress',
          mcc: 5311,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        date: 1577959326000,
        itemType: 'OPERATION',
        authCode: '462844',
        bonus: {
          income: true,
          amount: 134.41,
          incomeExpectations: true,
          incomeDate: 1578129634000,
          availabilityDate: 1579168926000,
          currency: 'BAL',
          details: [
            {
              amount: 134.41,
              action: '1,5% за оплату картой Mastercard',
              actionId: 66539,
              currency: 'BAL',
              isPromo: false
            }
          ]
        },
        channel: 'POS',
        description: 'IHERB, IHERB.COM',
        movements: [
          {
            date: 1577959326000,
            income: false,
            amount: 9408.89,
            rate: 61.91,
            currency: 'RUR',
            id: '401021370#753698428',
            type: 'AUTHORIZATION_HOLD'
          }, {
            date: 1578128747000,
            income: false,
            returnedReserve: 448.04,
            amount: 8960.85,
            rate: 61.91,
            rateUpdated: 1578153947000,
            currency: 'RUR',
            id: '401021370#844973658',
            type: 'WITHDRAW'
          }, {
            date: 1578129634000,
            income: true,
            amount: 134.41,
            currency: 'BAL',
            id: '401021370#754782974',
            type: 'BONUS_INCOME'
          }
        ],
        title: 'iHerb',
        mcc: {
          code: '5499',
          groupDescription: 'Продукты',
          description: 'Продовольственные магазины',
          groupCode: 'products'
        },
        type: 'PURCHASE',
        actor: 'CONSUMER',
        counterpartyCode: 'iherb-com',
        money: {
          income: false,
          amount: 144.75,
          amountDetail: {
            amount: 8960.85,
            acquirerCommission: 0.0,
            own: 8960.85,
            commission: 0.0,
            credit: 0.0
          },
          currency: 'USD',
          accountAmount: {
            amount: 8960.85,
            currency: 'RUR'
          }
        },
        contractId: 3353117,
        id: 401021370,
        statisticGroup: {
          code: 'mcc-group#products',
          name: 'Продукты'
        },
        status: 'DONE'
      },
      {
        hold: false,
        date: new Date(1577959326000),
        movements: [
          {
            id: '401021370',
            account: { id: 'c-3702600' },
            invoice: { sum: -144.75, instrument: 'USD' },
            sum: -8960.85,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'iHerb',
          mcc: 5499,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        date: 1608742600000,
        itemType: 'OPERATION',
        authCode: '193954',
        bonus:
          {
            income: true,
            amount: 143.27,
            incomeDate: 1608742600000,
            availabilityDate: 1609952200000,
            currency: 'BAL',
            details: []
          },
        description: 'ozon.ru, Москва, Пресненская наб., д. 10, блок C',
        movements:
          [
            {
              date: 1608742600000,
              income: false,
              amount: 3114.42,
              currency: 'RUR',
              id: '488055376#7bd8a02e-fc2b-437b-8e76-50b2150a6a85',
              type: 'WITHDRAW'
            },
            {
              date: 1608742600000,
              income: true,
              amount: 143.27,
              currency: 'BAL',
              id: '488055376#7bd8a02e-fc2b-437b-8e76-50b2150a6a85',
              type: 'BONUS_INCOME'
            }
          ],
        title: 'Ozon',
        mcc: { groupDescription: 'Магазины', groupCode: 'shops' },
        type: 'EXTERNAL_PARTNER',
        counterpartyCode: 'ozon-ru',
        money:
          {
            income: false,
            amount: 3114.42,
            amountDetail: { amount: 3114.42, commission: 0 },
            currency: 'RUR'
          },
        contractId: 3353117,
        id: 488055376,
        statisticGroup: { code: 'mcc-group#shops', name: 'Магазины' },
        status: 'DONE'
      },
      {
        comment: null,
        date: new Date(1608742600000),
        hold: false,
        merchant: {
          country: null,
          city: 'Москва',
          title: 'Ozon',
          mcc: null,
          location: null
        },
        movements:
          [
            {
              id: '488055376',
              account: { id: 'c-3702600' },
              invoice: null,
              sum: -3114.42,
              fee: 0
            }
          ]
      }
    ]
  ])('converts outcome spending', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 3353117: 'c-3702600' })).toEqual(transaction)
  })
})
