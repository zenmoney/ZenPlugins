import { convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  let account = {
    id: '6505111',
    instrument: 'BYN',
    type: 'card',
    title: 'Карта №1',
    balance: 486.18,
    syncID: ['BY31ALFA3014111MRT0011110000'],
    productType: 'ACCOUNT'
  }
  let tt = [
    {
      name: 'parse cash',
      json: {
        availableSplit: true,
        cardMask: '5.1111',
        date: '20190125122755',
        description: 'MINSK Получение денег в банкомате ATMALF HO35 DZERJINSKOGO',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        id: '11113111050111',
        info: {
          amount: {
            amount: -500,
            currency: 'BYN',
            format: '###,###,###,###,##0.##'
          },
          description: 'Карта №1',
          icon: {
            backgroundColorFrom: '#8976f3',
            backgroundColorTo: '#8976f3',
            captionColor: '#FFFFFF',
            displayType: 'REGULAR',
            frameColor: '#c2b7b7',
            iconUrl: 'v0/Image/52_392.SVG'
          },
          title: 'ATMALF HO35 DZERJINSKO'
        },
        sendReceipt: false,
        showAddRecipient: false,
        showAddToFuture: false,
        showCompensate: false,
        showReceipt: false,
        showRepeat: false,
        status: 'NORMAL'
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: '11113111050111',
            account: { id: '6505111' },
            invoice: null,
            sum: -500,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              type: 'cash',
              instrument: 'BYN',
              syncIds: null
            },
            invoice: null,
            sum: 500,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        hold: false,
        bankOperation: null,
        bankTitle: 'ATMALF HO35 DZERJINSKO',
        byChildCard: false
      }
    },
    {
      name: 'bank fees',
      json: {
        availableSplit: true,
        cardMask: '5.1111',
        date: '20190125122755',
        description: 'Карта 5.1111. Вознаграждение за обслуживание согласно Перечню вознаграждений',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        id: '11113111050111',
        info: {
          amount: {
            amount: -0.99,
            currency: 'BYN',
            format: '###,###,###,###,##0.##'
          },
          description: 'Карта №1',
          icon: {
            backgroundColorFrom: '#8976f3',
            backgroundColorTo: '#8976f3',
            captionColor: '#FFFFFF',
            displayType: 'REGULAR',
            frameColor: '#c2b7b7',
            iconUrl: 'v0/Image/52_392.SVG'
          },
          title: 'Комиссия банка'
        },
        sendReceipt: false,
        showAddRecipient: false,
        showAddToFuture: false,
        showCompensate: false,
        showReceipt: false,
        showRepeat: false,
        status: 'NORMAL'
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: '11113111050111',
            account: { id: '6505111' },
            invoice: null,
            sum: -0.99,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Альфа-Банк',
          location: null,
          mcc: null
        },
        comment: 'Комиссия банка',
        hold: false,
        bankOperation: null,
        bankTitle: 'Комиссия банка',
        byChildCard: false
      }
    },
    {
      name: 'uber taxi',
      json: {
        availableSplit: true,
        cardMask: '5.1111',
        date: '20190125122755',
        description: 'Amsterdam Покупка товара / получение услуг UBER',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        id: '11113111050111',
        info: {
          amount: {
            amount: -7.99,
            currency: 'BYN',
            format: '###,###,###,###,##0.##'
          },
          description: 'Карта №1',
          icon: {
            backgroundColorFrom: '#8976f3',
            backgroundColorTo: '#8976f3',
            captionColor: '#FFFFFF',
            displayType: 'REGULAR',
            frameColor: '#c2b7b7',
            iconUrl: 'v0/Image/52_392.SVG'
          },
          title: 'UBER'
        },
        sendReceipt: false,
        showAddRecipient: false,
        showAddToFuture: false,
        showCompensate: false,
        showReceipt: false,
        showRepeat: false,
        status: 'NORMAL'
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: '11113111050111',
            account: { id: '6505111' },
            invoice: null,
            sum: -7.99,
            fee: 0
          }
        ],
        merchant: {
          city: 'Amsterdam',
          country: 'NL',
          location: null,
          mcc: null,
          title: 'UBER'
        },
        comment: null,
        hold: false,
        bankOperation: null,
        bankTitle: 'UBER',
        byChildCard: false
      }
    },
    {
      name: 'salary',
      json: {
        availableSplit: true,
        date: '20190125122755',
        description: 'ЗАРАБОТНАЯ ПЛАТА ЗА ФЕВРАЛЬ-МАРТ 2019',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        id: '11113111050111',
        info: {
          amount: {
            amount: 400,
            currency: 'BYN',
            format: '###,###,###,###,##0.##'
          },
          description: 'Карта №1',
          icon: {
            backgroundColorFrom: '#8976f3',
            backgroundColorTo: '#8976f3',
            captionColor: '#FFFFFF',
            displayType: 'REGULAR',
            frameColor: '#c2b7b7',
            iconUrl: 'v0/Image/52_392.SVG'
          },
          title: 'Поступление средств'
        },
        sendReceipt: false,
        showAddRecipient: false,
        showAddToFuture: false,
        showCompensate: false,
        showReceipt: false,
        showRepeat: false,
        status: 'NORMAL'
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: '11113111050111',
            account: { id: '6505111' },
            invoice: null,
            sum: 400,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'ЗАРАБОТНАЯ ПЛАТА ЗА ФЕВРАЛЬ-МАРТ 2019',
        hold: false,
        bankOperation: null,
        bankTitle: 'Поступление средств',
        byChildCard: false
      }
    },
    {
      name: 'exchange operation',
      json: {
        id: '11113111050111',
        info: {
          description: 'А-курс',
          title: 'Конвертация',
          amount: {
            format: '###,###,###,###,##0.##',
            currency: 'BYN',
            amount: -84.32
          },
          icon: {
            backgroundColorFrom: '#ff814f',
            backgroundColorTo: '#ff814f',
            iconUrl: 'v0/Image/50_392.SVG',
            captionColor: '#FFFFFF',
            frameColor: '#c2b7b7',
            displayType: 'REGULAR'
          }
        },
        date: '20190125122755',
        operationAmount: { format: '###,###,###,###,##0.##', currency: 'USD', amount: 40 },
        description: 'ПУПКИН ВАСИЛИЙ ИВАНОВИЧ В/о операция по курсу Банка через  АК, эл. сообщ. от  20.03.2019',
        status: 'NORMAL',
        operation: 'CURRENCYEXCHANGE',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        showReceipt: true,
        sendReceipt: true,
        showAddToFuture: false,
        showRepeat: true,
        showAddRecipient: false,
        availableSplit: false,
        showCompensate: false
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: '11113111050111',
            account: { id: '6505111' },
            invoice: {
              instrument: 'USD',
              sum: -40
            },
            sum: -84.32,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              type: 'cash',
              instrument: 'USD',
              syncIds: null
            },
            invoice: null,
            sum: 40,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        hold: false,
        bankOperation: 'CURRENCYEXCHANGE',
        bankTitle: 'Конвертация',
        byChildCard: false
      }
    },
    {
      name: 'exchange operation from cash to card',
      json: {
        id: '11113111050111',
        info:
          {
            description: 'Карта 1',
            title: 'Конвертация',
            amount:
              { format: '###,###,###,###,##0.##',
                currency: 'BYN',
                amount: 2.09 },
            icon:
              {
                backgroundColorFrom: '#ff814f',
                backgroundColorTo: '#ff814f',
                iconUrl: 'v0/Image/50_392.SVG',
                captionColor: '#FFFFFF',
                frameColor: '#c2b7b7',
                displayType: 'REGULAR' } },
        date: '20190125122755',
        operationAmount: { format: '###,###,###,###,##0.##', currency: 'USD', amount: -1 },
        description: 'ПУПКИН ВАСИЛИЙ ИВАНОВИЧ В/о операция по курсу Банка через  АК, эл. сообщ. от  20.03.2019',
        status: 'NORMAL',
        operation: 'CURRENCYEXCHANGE',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        showReceipt: true,
        sendReceipt: true,
        showAddToFuture: false,
        showRepeat: true,
        showAddRecipient: false,
        availableSplit: false,
        showCompensate: false
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: '11113111050111',
            account: { id: '6505111' },
            invoice: {
              instrument: 'USD',
              sum: 1
            },
            sum: 2.09,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              type: 'cash',
              instrument: 'BYN',
              syncIds: null
            },
            invoice: null,
            sum: -2.09,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        hold: false,
        bankOperation: 'CURRENCYEXCHANGE',
        bankTitle: 'Конвертация',
        byChildCard: false
      }
    },
    {
      name: 'payment in another currency',
      json: {
        id: '11113111050111',
        info: {
          description: 'А-курс',
          title: 'BRUSNIKA',
          amount: {
            format: '###,###,###,###,##0.##',
            currency: 'BYN',
            amount: -15.58
          },
          icon: {
            backgroundColorFrom: '#ff814f',
            backgroundColorTo: '#ff814f',
            iconUrl: 'v0/Image/50_392.SVG',
            captionColor: '#FFFFFF',
            frameColor: '#c2b7b7',
            displayType: 'REGULAR'
          }
        },
        date: '20190125122755',
        operationAmount: { format: '###,###,###,###,##0.##', currency: 'RUB', amount: -466.9 },
        description: 'MOSCOW Покупка товара / получение услуг BRUSNIKA',
        status: 'NORMAL',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        showReceipt: true,
        sendReceipt: true,
        showAddToFuture: false,
        showRepeat: true,
        showAddRecipient: false,
        availableSplit: false,
        showCompensate: false
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: '11113111050111',
            account: { id: '6505111' },
            invoice: {
              instrument: 'RUB',
              sum: -466.9
            },
            sum: -15.58,
            fee: 0
          }
        ],
        merchant: {
          city: 'MOSCOW',
          country: 'RU',
          location: null,
          mcc: null,
          title: 'BRUSNIKA'
        },
        comment: null,
        hold: false,
        bankOperation: null,
        bankTitle: 'BRUSNIKA',
        byChildCard: false
      }
    },
    {
      name: 'ERIP payment',
      json: {
        id: '11113111050111',
        info:
          {
            description: 'А-курс',
            title: 'MTS - Domashnij internet: 000000000',
            amount: {
              format: '###,###,###,###,##0.##',
              currency: 'BYN',
              amount: -5
            },
            icon:
              {
                backgroundColorFrom: '#6cbfc7',
                backgroundColorTo: '#97f6e6',
                iconUrl: 'v0/Image/49902_392.SVG',
                captionColor: '#FFFFFF',
                frameColor: '#c2b7b7',
                displayType: 'REGULAR'
              }
          },
        date: '20190125122755',
        cardMask: '4.0000',
        description: 'INTERNET-BANK AL InSync (ERIP)',
        status: 'NORMAL',
        operation: 'PAYMENT',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        showReceipt: true,
        sendReceipt: true,
        showAddToFuture: true,
        showRepeat: true,
        showAddRecipient: true,
        availableSplit: true,
        showCompensate: false
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: '11113111050111',
            account: { id: '6505111' },
            invoice: null,
            sum: -5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'MTS - Domashnij internet: 000000000',
        hold: false,
        bankOperation: 'PAYMENT',
        bankTitle: 'MTS - Domashnij internet: 000000000',
        byChildCard: false
      }
    },
    {
      name: 'skip currency rate orders',
      json: {
        id: '11113111050111',
        info:
          { description: '1 EUR = 2.3500 BYN',
            title: 'Заявка №1 на курс конвертации',
            icon:
              { backgroundColorFrom: '#6cbfc7',
                backgroundColorTo: '#32cb77',
                iconUrl: 'v0/Image/66887_392.SVG',
                captionColor: '#FFFFFF',
                frameColor: '#c2b7b7',
                displayType: 'REGULAR' } },
        date: '20190125122755',
        description: '',
        status: 'NORMAL',
        rateOrderStatus: 'EXECUTED',
        operation: 'RATE_ORDER',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        showReceipt: false,
        sendReceipt: false,
        showAddToFuture: false,
        showRepeat: false,
        showAddRecipient: false,
        availableSplit: false,
        showCompensate: false,
        orderRateDescription: [
          {
            accountName: 'Зарплатная',
            amount: {
              format: '###,###,###,###,##0.##',
              currency: 'BYN',
              amount: -12.8
            }
          },
          {
            accountName: 'Евро',
            amount: {
              format: '###,###,###,###,##0.##',
              currency: 'EUR',
              amount: 54
            }
          }]
      },
      expectedTransaction: null
    },
    {
      name: 'yandex taxi payment',
      json: {
        id: '11113111050111',
        info:
          { description: 'Карта №1',
            title: 'YANDEX.TAXI',
            amount:
              { format: '###,###,###,###,##0.##',
                currency: 'BYN',
                amount: -6.4 },
            icon:
              { backgroundColorFrom: '#8976f3',
                backgroundColorTo: '#8976f3',
                iconUrl: 'v0/Image/52_392.SVG',
                captionColor: '#FFFFFF',
                frameColor: '#c2b7b7',
                displayType: 'REGULAR' } },
        date: '20190125122755',
        cardMask: '5.1111',
        description: 'SCHIPOL NLD',
        status: 'NORMAL',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        showReceipt: false,
        sendReceipt: false,
        showAddToFuture: false,
        showRepeat: false,
        showAddRecipient: false,
        availableSplit: true,
        showCompensate: false
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: '11113111050111',
            account: { id: '6505111' },
            invoice: null,
            sum: -6.4,
            fee: 0
          }
        ],
        merchant: {
          city: 'SCHIPOL',
          country: 'NLD',
          location: null,
          mcc: null,
          title: 'YANDEX.TAXI'
        },
        comment: null,
        hold: false,
        bankOperation: null,
        bankTitle: 'YANDEX.TAXI',
        byChildCard: false
      }
    },
    {
      name: 'skip zero operations',
      json: {
        id: '11113111050111',
        info:
          { description: 'Карта №1',
            title: 'GOOGLE *SELLER',
            amount: { format: '###,###,###,###,##0.##', currency: 'BYN', amount: 0 },
            icon:
              { backgroundColorFrom: '#8976f3',
                backgroundColorTo: '#8976f3',
                iconUrl: 'v0/Image/52_392.SVG',
                captionColor: '#FFFFFF',
                frameColor: '#c2b7b7',
                displayType: 'REGULAR' } },
        date: '20190125122755',
        operationAmount: { format: '###,###,###,###,##0.##', currency: 'EUR', amount: 1 },
        cardMask: '5.1111',
        description: 'G.CO/PAYHELP# GBR',
        status: 'NORMAL',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        showReceipt: false,
        sendReceipt: false,
        showAddToFuture: false,
        showRepeat: false,
        showAddRecipient: false,
        availableSplit: false,
        showCompensate: false
      },
      expectedTransaction: null
    },
    {
      name: 'card cashback',
      json: {
        availableSplit: false,
        date: '20190125122755',
        description: 'ВЫПЛАТА СРЕДСТВ В РАМКАХ УСЛУГИ "CASHBACK" ЗА МАРТ 2019 Г., СОГЛАСНО РАСЧЕТОВ ОТ 03.04.2019',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        info: {
          amount: {
            amount: 0.83, currency: 'BYN', format: '###,###,###,###,##0.##'
          },
          description: 'Карта 1',
          icon:
            {
              backgroundColorFrom: '#8976F3',
              backgroundColorTo: '#8976F3',
              iconUrl: 'v0/Image/52_392.SVG',
              captionColor: '#FFFFFF',
              frameColor: '#C2B7B7',
              displayType: 'REGULAR'
            },
          title: 'Поступление средств'
        },
        sendReceipt: false,
        showAddRecipient: false,
        showAddToFuture: false,
        showCompensate: false,
        showReceipt: false,
        showRepeat: false,
        status: 'NORMAL'
      },
      expectedTransaction: {
        date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
        movements: [
          {
            id: null,
            account: { id: '6505111' },
            invoice: null,
            sum: 0.83,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'ВЫПЛАТА СРЕДСТВ В РАМКАХ УСЛУГИ "CASHBACK" ЗА МАРТ 2019 Г., СОГЛАСНО РАСЧЕТОВ ОТ 03.04.2019',
        hold: false,
        bankOperation: null,
        bankTitle: 'Поступление средств',
        byChildCard: false
      }
    }
  ]
  tt.forEach(function (tc) {
    it(tc.name, () => {
      let transaction = convertTransaction(tc.json, [account])
      expect(transaction).toEqual(tc.expectedTransaction)
    })
  })
})
