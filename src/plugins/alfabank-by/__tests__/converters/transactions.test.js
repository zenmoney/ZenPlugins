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
      name: 'parse P2P',
      json: {
        availableSplit: true,
        cardMask: '5.1111',
        date: '20190125122755',
        description: 'MINSK P2P_MTBANK',
        iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
        id: '11113111050111',
        info: {
          amount: {
            amount: -6,
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
          title: 'P2P_MTBANK'
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
            sum: -6,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              type: 'ccard',
              instrument: 'BYN',
              syncIds: null
            },
            invoice: null,
            sum: 6,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        hold: false
      }
    },
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
            id: null,
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
        hold: false
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
            id: null,
            account: { id: '6505111' },
            invoice: null,
            sum: -0.99,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Комиссия банка',
        hold: false
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
            id: null,
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
        comment: 'Покупка товара / получение услуг',
        hold: false
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
            id: null,
            account: { id: '6505111' },
            invoice: null,
            sum: 400,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'ЗАРАБОТНАЯ ПЛАТА ЗА ФЕВРАЛЬ-МАРТ 2019',
        hold: false
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
            id: null,
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
        hold: false
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
