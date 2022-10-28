import { convertLastTransaction, convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  const account = {
    id: '11161311-117d11',
    transactionsAccId: null,
    type: 'card',
    title: 'Расчетная карточка*1111',
    currencyCode: '840',
    cardNumber: '529911******1111',
    instrument: 'USD',
    balance: 0,
    syncID: ['1111'],
    productType: 'MS'
  }

  const tt = [
    {
      name: 'cash add',
      transaction: {
        amount: '1 600,00',
        amountReal: '1 600,00',
        authCode: '264505',
        cardNum: '1111',
        currency: 'USD',
        currencyReal: 'USD',
        date: '18.01.2019 21:36',
        description: 'Внесение наличных на карту',
        mcc: '↵',
        place: 'BY BGPB PST-93, MINSK',
        type: 'ЗАЧИСЛЕНИЕ',
        overdraft: '0,00'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-01-18T18:36:00.000Z'),
        hold: false,
        merchant: {
          city: 'MINSK',
          country: 'BY',
          location: null,
          mcc: null,
          title: 'BGPB PST-93'
        },
        movements: [
          {
            account: {
              id: '11161311-117d11'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 1600
          },
          {
            account: {
              company: null,
              instrument: 'USD',
              syncIds: null,
              type: 'cash'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -1600
          }
        ]
      }
    },
    {
      name: 'internet pay-1',
      transaction: {
        amount: '300,00',
        amountReal: '250,00',
        authCode: '357178',
        cardNum: '1111',
        currency: 'USD',
        currencyReal: 'EUR',
        date: '02.01.2019 22:02',
        description: 'Безналичная оплата',
        mcc: '1200',
        place: 'GB SHOP, DOUGLAS',
        type: 'СПИСАНИЕ',
        overdraft: '0,00'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-01-02T19:02:00.000Z'),
        hold: false,
        merchant: {
          city: 'DOUGLAS',
          country: 'GB',
          location: null,
          mcc: 1200,
          title: 'SHOP'
        },
        movements: [
          {
            account: {
              id: '11161311-117d11'
            },
            fee: 0,
            id: null,
            invoice: {
              instrument: 'EUR',
              sum: -250
            },
            sum: -300
          }
        ]
      }
    },
    {
      name: 'internet pay-2',
      transaction: {
        amount: '30,16',
        amountReal: '30,16',
        authCode: '400818',
        cardNum: '5452',
        currency: 'USD',
        currencyReal: 'EUR',
        date: '12.10.2022 13:41',
        description: 'Безналичная оплата (страна ЕЭЗ)',
        mcc: '4131',
        place: 'Flixbus, Berlin',
        type: 'СПИСАНИЕ',
        overdraft: '0,00'
      },
      expectedTransaction: {
        comment: 'Безналичная оплата (страна ЕЭЗ)',
        date: new Date('2022-10-12T10:41:00.000Z'),
        hold: false,
        merchant: {
          city: 'Berlin',
          country: null,
          location: null,
          mcc: 4131,
          title: 'Flixbus'
        },
        movements: [
          {
            account: { id: '11161311-117d11' },
            fee: 0,
            id: null,
            invoice: {
              instrument: 'EUR',
              sum: -30.16
            },
            sum: -30.16
          }
        ]
      }
    },
    {
      name: 'transfer add',
      transaction: {
        amount: '1 131,76',
        amountReal: '1 131,76',
        authCode: '375860',
        cardNum: '1111',
        currency: 'USD',
        currencyReal: 'USD',
        date: '24.09.2021 19:22',
        description: 'Перевод средств (пополнение)',
        mcc: null,
        place: 'BY POPOLNENIE ERIP, MINSK',
        type: 'ЗАЧИСЛЕНИЕ',
        overdraft: '0,00'
      },
      expectedTransaction: {
        comment: 'Перевод средств (пополнение)',
        date: new Date('2021-09-24T16:22:00.000Z'),
        hold: false,
        merchant: {
          city: 'MINSK',
          country: 'BY',
          location: null,
          mcc: null,
          title: 'POPOLNENIE ERIP'
        },
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 1131.76
            }
          ]
      }
    }
  ]

  // run all tests
  for (const tc of tt) {
    it(tc.name, () => {
      const transaction = convertTransaction(tc.transaction, account)

      expect(transaction).toEqual(tc.expectedTransaction)
    })
  }
})

describe('convertLastTransaction', () => {
  const accounts = [
    {
      id: '11161311-117d11',
      transactionsAccId: null,
      type: 'card',
      title: 'Расчетная карточка*1111',
      currencyCode: '840',
      cardNumber: '529911******1111',
      instrument: 'USD',
      balance: 0,
      syncID: ['1111'],
      productType: 'MS'
    }
  ]

  const tt = [
    {
      name: 'notification',
      transaction: {
        acceptedTime: 1554541890000,
        eventType: 4,
        id: '2019-7871636',
        pushMessageText: 'Card1111; Смена статуса карты; 04.04.19 17:31:40;' //  Смена
      },
      expectedTransaction: null
    },
    {
      name: 'notification 2',
      transaction: {
        acceptedTime: 1554541890000,
        eventType: 4,
        id: '2019-7871636',
        pushMessageText: 'Приложение BGPB_Mobile активировано на устройстве Unknown Android SDK built for x86_64__.'
      },
      expectedTransaction: null
    },
    {
      name: 'cash add',
      transaction: {
        acceptedTime: 1554492493000,
        eventType: 4,
        id: '2019-7848714',
        pushMessageText: 'Card1111; Пополнение: 1 100,00 USD; 05.04.19 22:27:59; BGPB CASH-IN 76,MINSK,BY; Dostupno: 34,71 USD'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-04-05T19:27:00.000Z'),
        hold: false,
        merchant: {
          city: 'MINSK',
          country: 'BY',
          location: null,
          mcc: null,
          title: 'BGPB CASH-IN 76'
        },
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 1100
            },
            {
              account: {
                company: null,
                instrument: 'USD',
                syncIds: null,
                type: 'cash'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -1100
            }
          ]
      }
    },
    {
      name: 'cash withdrawal',
      transaction: {
        acceptedTime: 1554492493000,
        eventType: 4,
        id: '2019-7848714',
        pushMessageText: 'Card1111; Снятие наличных: 200,00 USD; 03.05.19 20:06:18; DZERZHINSKOGO 91,MINSK,BY; Dostupno: 2 000,74 USD'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-05-03T17:06:00.000Z'),
        hold: false,
        merchant: {
          city: 'MINSK',
          country: 'BY',
          location: null,
          mcc: null,
          title: 'DZERZHINSKOGO 91'
        },
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -200
            },
            {
              account: {
                company: null,
                instrument: 'USD',
                syncIds: null,
                type: 'cash'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 200
            }
          ]
      }
    },
    {
      name: 'cash withdrawal with bad address',
      transaction: {
        acceptedTime: 1554492493000,
        eventType: 4,
        id: '2019-7848714',
        pushMessageText: 'Card1111; Снятие наличных: 100,00 USD; 03.05.19 20:06:18; ,MINSK,BLR; Dostupno: 2 000,84 USD'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-05-03T17:06:00.000Z'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -100
            },
            {
              account: {
                company: null,
                instrument: 'USD',
                syncIds: null,
                type: 'cash'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 100
            }
          ]
      }
    },
    {
      name: 'cash withdrawal in PoS',
      transaction: {
        acceptedTime: 1554492493000,
        eventType: 4,
        id: '2019-7848714',
        pushMessageText: 'Card1111; Наличные в ПОС: 100,00 USD; 03.05.19 20:06:18; BGPB PRK-28,MINSK,BY; MCC: 6010; Dostupno: 2 000,84 USD'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-05-03T17:06:00.000Z'),
        hold: false,
        merchant: {
          city: 'MINSK',
          country: 'BY',
          location: null,
          mcc: 6010,
          title: 'BGPB PRK-28'
        },
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -100
            },
            {
              account: {
                company: null,
                instrument: 'USD',
                syncIds: null,
                type: 'cash'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 100
            }
          ]
      }
    },
    {
      name: 'money movement',
      transaction: {
        acceptedTime: 1554492493000,
        eventType: 4,
        id: '2019-7848714',
        pushMessageText: 'Card1111; Перевод (зачисление): 5,00 USD; 03.05.19 20:06:18; MOBAPP P2P REZ-BGPB-1,MINSK,BY; MCC: 6012; Dostupno: 5,87 USD'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-05-03T17:06:00.000Z'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 5
            },
            {
              account: {
                company: null,
                instrument: 'USD',
                syncIds: null,
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -5
            }
          ],
        groupKeys: [
          '2019-05-03_USD_5'
        ]
      }
    },
    {
      name: 'cash back',
      transaction: {
        id: '2019-30090403',
        acceptedTime: 1571983438000,
        pushMessageText: 'Card1111; Зачисление на счет: 0,70 USD; 25.10.19 09:03:44; BELGAZPROMBANK,MINSK,BLR;  Dostupno: 12345,32 USD',
        eventType: 4
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-10-25T06:03:00.000Z'),
        hold: false,
        merchant: {
          city: 'MINSK',
          country: 'BLR',
          location: null,
          mcc: null,
          title: 'BELGAZPROMBANK'
        },
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 0.70
            }
          ]
      }
    },
    {
      name: 'card P2P In',
      transaction: {
        id: '2020-57982197',
        acceptedTime: 1606485231000,
        pushMessageText: 'Card1111; Пополнение карты: 268,00 USD; 27.11.20 16:53:30; EPAYMENT P2P CR,MINSK,BY; MCC: 6010; Dostupno: 3 000,95 USD',
        eventType: 4
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2020-11-27T13:53:00.000Z'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              id: null,
              account: { id: '11161311-117d11' },
              invoice: null,
              sum: 268,
              fee: 0
            },
            {
              account: {
                company: null,
                instrument: 'USD',
                syncIds: null,
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -268
            }
          ],
        groupKeys: [
          '2020-11-27_USD_268'
        ]
      }
    },
    {
      name: 'card P2P Out',
      transaction: {
        id: '2020-57982166',
        acceptedTime: 1606485213000,
        pushMessageText: 'Card1111; Оплата: 268,00 USD; 27.11.20 16:53:30; EPAYMENT P2P DB,MINSK,BY; MCC: 6012; Dostupno: 237,98 USD',
        eventType: 4
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2020-11-27T13:53:00.000Z'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              id: null,
              account: { id: '11161311-117d11' },
              invoice: null,
              sum: -268,
              fee: 0
            },
            {
              account: {
                company: null,
                instrument: 'USD',
                syncIds: null,
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 268
            }
          ],
        groupKeys: [
          '2020-11-27_USD_268'
        ]
      }
    },
    {
      name: 'merchant.country: "" ',
      transaction: {
        id: '2021-23876315',
        acceptedTime: 1619513263000,
        pushMessageText: 'Card1111; Оплата: 326,85 USD; 27.04.21 11:47:24; Lamoda,Minskiy r-n,,BLR; MCC: 5651; Dostupno: 1 496,43 BYN',
        eventType: 4
      },
      expectedTransaction: {
        date: new Date('2021-04-27T11:47:00+0300'),
        movements:
          [
            {
              id: null,
              account: { id: '11161311-117d11' },
              invoice: null,
              sum: -326.85,
              fee: 0
            }
          ],
        merchant:
          {
            mcc: 5651,
            location: null,
            title: 'Lamoda',
            city: 'Minskiy r-n',
            country: null
          },
        comment: null,
        hold: false
      }
    }
  ]

  // run all tests
  for (const tc of tt) {
    it(tc.name, () => {
      const transaction = convertLastTransaction(tc.transaction, accounts)

      expect(transaction).toEqual(tc.expectedTransaction)
    })
  }
})
