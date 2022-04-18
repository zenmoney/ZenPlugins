import { convertApiTransactionsToReadableTransactions } from '../converters'

describe('convertApiTransactionsToReadableTransactions', () => {
  it('converts outcome with payee and city', () => {
    expect(convertApiTransactionsToReadableTransactions([
      {
        account: {
          id: 'account',
          instrument: 'BYN'
        },
        apiTransactions: [
          {
            cardTransactionId: 55330580,
            docId: 1015956,
            openwayId: 20619597,
            transactionDate: 1554109440000,
            transactionType: 'Товары и услуги',
            transactionCategory: 'Request',
            transactionResult: 'Успешно',
            transactionAmount: 36.81,
            transactionCurrency: 'BYN',
            transactionDetails: 'SUPERMARKET "GREEN" BAPB',
            city: 'MINSK',
            countryCode: 'BLR',
            accountRest: 1582.67,
            accountCurrency: 'BYN',
            accountRestDate: 1554109440000,
            colour: 2,
            last4: '<string[22]>'
          },
          {
            cardTransactionId: 83870553,
            docId: 915501,
            openwayId: 49159930,
            transactionDate: 1618272420000,
            transactionType: 'Комиссия за годовое обслуживание осн. Карточки',
            transactionCategory: 'Request',
            transactionResult: 'Успешно',
            transactionAmount: 14,
            transactionCurrency: 'BYN',
            transactionDetails: 'BSB Bank',
            city: 'MINSK',
            countryCode: 'BLR',
            accountRest: 375.91,
            accountCurrency: 'BYN',
            accountRestDate: 1618272420000,
            colour: 2,
            last4: '<string[25]>'
          },
          {
            cardTransactionId: 92110853,
            docId: 792006,
            openwayId: 57400498,
            transactionDate: 1633000020000,
            transactionType: 'Зачисление с конверсией',
            transactionCategory: 'Request',
            transactionResult: 'Успешно',
            transactionAmount: 4826.26,
            transactionCurrency: 'BYN',
            transactionDetails: '5563.59 BYN',
            city: '',
            countryCode: '',
            accountRest: null,
            accountCurrency: '',
            accountRestDate: 1633000020000,
            colour: 1,
            last4: '6737, NIKOLAY NIKOLAEV'
          },
          {
            cardTransactionId: 94158492,
            docId: 2807936,
            openwayId: 59448136,
            transactionDate: 1636535220000,
            transactionType: 'Покупка валюты за б/н рубли',
            transactionCategory: 'Request',
            transactionResult: 'Успешно',
            transactionAmount: 3076.6,
            transactionCurrency: 'BYN',
            transactionDetails: 'BSB Bank',
            city: 'MINSK',
            countryCode: 'BLR',
            accountRest: 2051.08,
            accountCurrency: 'BYN',
            accountRestDate: 1636535220000,
            colour: 1,
            last4: '8280, NIKOLAY NIKOLAEV'
          },
          {
            cardTransactionId: 92463665,
            docId: 1129139,
            openwayId: 57753310,
            transactionDate: 1633604820000,
            transactionType: 'Зачисление Money-back',
            transactionCategory: 'Request',
            transactionResult: 'Успешно',
            transactionAmount: 0.88,
            transactionCurrency: 'BYN',
            transactionDetails: '49.50 BYN',
            city: '',
            countryCode: '',
            accountRest: null,
            accountCurrency: '',
            accountRestDate: 1633604820000,
            colour: 1,
            last4: '7992, KATSIARYNA BARANAVA'
          }
        ]
      }
    ])).toEqual([
      {
        date: new Date('2019-04-01T09:04:00.000Z'),
        hold: null,
        movements: [
          {
            id: '55330580',
            account: { id: 'account' },
            invoice: null,
            sum: -36.81,
            fee: 0
          }
        ],
        merchant: {
          country: 'BLR',
          city: 'MINSK',
          title: 'SUPERMARKET "GREEN" BAPB',
          mcc: null,
          location: null
        },
        comment: null
      },
      {
        comment: 'Комиссия за годовое обслуживание осн. Карточки',
        date: new Date('2021-04-13T00:07:00.000Z'),
        hold: null,
        merchant: {
          city: 'MINSK',
          country: 'BLR',
          location: null,
          mcc: null,
          title: 'BSB Bank'
        },
        movements: [
          {
            account: {
              id: 'account'
            },
            fee: 0,
            id: '83870553',
            invoice: null,
            sum: -14
          }
        ]
      },
      {
        comment: 'Зачисление с конверсией',
        date: new Date('2021-09-30T11:07:00.000Z'),
        hold: null,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: '5563.59 BYN'
        },
        movements: [
          {
            account: {
              id: 'account'
            },
            fee: 0,
            id: '92110853',
            invoice: null,
            sum: 4826.26
          }
        ]
      },
      {
        comment: 'Зачисление Money-back',
        date: new Date('2021-10-07T11:07:00.000Z'),
        hold: null,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: '49.50 BYN'
        },
        movements: [
          {
            account: {
              id: 'account'
            },
            fee: 0,
            id: '92463665',
            invoice: null,
            sum: 0.88
          }
        ]
      },
      {
        comment: 'Покупка валюты за б/н рубли',
        date: new Date('2021-11-10T09:07:00.000Z'),
        hold: null,
        merchant: {
          city: 'MINSK',
          country: 'BLR',
          location: null,
          mcc: null,
          title: 'BSB Bank'
        },
        movements: [
          {
            account: {
              id: 'account'
            },
            fee: 0,
            id: '94158492',
            invoice: null,
            sum: 3076.6
          }
        ]
      }
    ])
  })
})
