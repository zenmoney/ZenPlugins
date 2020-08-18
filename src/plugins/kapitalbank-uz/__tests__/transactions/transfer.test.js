import {
  convertUzcardCardTransaction,
  convertHumoCardTransaction,
  convertVisaCardTransaction,
  // convertWalletTransaction,
  convertAccountTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        hpan: '626247***5085',
        utime: 1594710157000,
        udate: 1594710157000,
        terminal: '97006284',
        resp: '-1',
        city: 'Toshkent',
        reqamt: '15 000,00',
        merchant: '903122724',
        merchantName: 'P2P ALOQAMOBILE 2 HUMO 0',
        reversal: false,
        street: 'tinchlik kfi iyk ota 19',
        credit: false,
        transType: '683',
        utrnno: 8986298065,
        actamt: 1500000
      },
      {
        date: new Date('2020-07-14T07:02:37.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: 'Toshkent',
          title: 'P2P ALOQAMOBILE 2 HUMO 0',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '8986298065',
            account: { id: 'cardId' },
            invoice: null,
            sum: -15000.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'card',
              instrument: 'UZS',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: 15000.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        hpan: '860013***0149',
        utime: 1580539103000,
        udate: 1580539103000,
        terminal: '92000056',
        resp: '-1',
        city: '',
        reqamt: '248 506,00',
        merchant: '901324875',
        merchantName: 'CLICK P2P  888',
        reversal: false,
        street: 'Toshkent shakhar Nukus kuchasi',
        credit: true,
        transType: '760',
        utrnno: 8080582889,
        actamt: 24850600
      },
      {
        date: new Date('2020-02-01T06:38:23.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: '',
          title: 'CLICK P2P  888',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '8080582889',
            account: { id: 'cardId' },
            invoice: null,
            sum: 248506.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'card',
              instrument: 'UZS',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -248506.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to card UZS', (rawTransaction, transaction) => {
    const cardId = { id: 'cardId', instrument: 'UZS' }
    expect(convertUzcardCardTransaction(cardId, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        transDate: 1593696095000,
        amount: '5.00',
        merchantName: 'АКБ "Капиталбанк"',
        transType: 'Пополнение карты',
        fee: '0.00',
        currency: { name: 'USD', scale: 2 },
        approvalCode: '000000',
        back: true,
        transCode: '110',
        reversed: false,
        transAmount: '5.00',
        transCurrency: 'USD',
        conversionRate: '1'
      },
      {
        date: new Date('2020-07-02T13:21:35.000Z'),
        hold: false,
        comment: 'Пополнение карты',
        merchant: {
          country: null,
          city: null,
          title: null,
          mcc: null,
          location: null
        },
        movements: [
          {
            id: null,
            account: { id: 'cardId' },
            invoice: null,
            sum: 5.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'USD',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -5.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        transDate: 1593696106000,
        amount: '19.99',
        merchantName: 'АКБ "Капиталбанк"',
        transType: 'Получение средств (P2P)',
        fee: '0.00',
        currency: { name: 'USD', scale: 2 },
        approvalCode: '000000',
        back: true,
        transCode: '11M',
        reversed: false,
        transAmount: '19.99',
        transCurrency: 'USD',
        conversionRate: '1'
      },
      {
        date: new Date('2020-07-02T13:21:46.000Z'),
        hold: false,
        comment: 'Получение средств (P2P)',
        merchant: {
          country: null,
          city: null,
          title: null,
          mcc: null,
          location: null
        },
        movements: [
          {
            id: null,
            account: { id: 'cardId' },
            invoice: null,
            sum: 19.99,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'card',
              instrument: 'USD',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -19.99,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to card VISA', (rawTransaction, transaction) => {
    const cardId = { id: 'cardId', instrument: 'USD' }
    expect(convertVisaCardTransaction(cardId, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        transDate: 1594710160000,
        amount: '15 000,00',
        merchantName: 'POPOL P2P ALQ UZCARD 2 HUMO',
        transType: 'Входящий перевод',
        fee: '0,00',
        currency: { name: 'UZS', scale: 2 },
        reversed: false
      },
      {
        date: new Date('2020-07-14T07:02:40.000Z'),
        hold: false,
        comment: 'Входящий перевод',
        merchant: {
          country: null,
          city: null,
          title: 'POPOL P2P ALQ UZCARD 2 HUMO',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: null,
            account: { id: 'cardId' },
            invoice: null,
            sum: 15000.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'card',
              instrument: 'UZS',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -15000.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to card HUMO', (rawTransaction, transaction) => {
    const cardId = { id: 'cardId', instrument: 'UZS' }
    expect(convertHumoCardTransaction(cardId, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        amount: 3350000,
        currency: { name: 'RUB', scale: 2 },
        date: 1584039600000,
        docId: '41828390',
        docType: '06',
        docNum: '1442860',
        details: 'Отправка денежного перевода SWIFT от YERMOLAYEVA LYUDMILA ALEKSANDROVNA',
        corrId: '26153',
        corrName: 'Отправка банковских переводов в национальной валюте Рубль',
        corrMfo: '01158',
        corrInn: '207275139',
        corrAcct: '17101643900001158496',
        corrBank: 'ТОШКЕНТ Ш., "КАПИТАЛБАНК" АТ БАНКИНИНГ "КАПИТАЛ 24" ЧАКАНА БИЗНЕС ФИЛИАЛИ'
      },
      {
        date: new Date('2020-03-12T19:00:00.000Z'),
        hold: false,
        comment: 'Отправка денежного перевода SWIFT от YERMOLAYEVA LYUDMILA ALEKSANDROVNA',
        merchant: null,
        movements: [
          {
            id: '41828390',
            account: { id: 'accountId' },
            invoice: null,
            sum: 33500.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: ['8390'], // ???
              company: null
            },
            invoice: null,
            sum: -33500.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        amount: -3350000,
        currency: { name: 'RUB', scale: 2 },
        date: 1584039600000,
        docId: '41829073',
        docType: '01',
        docNum: '1443165',
        details: 'Перевод средств согл пл поручен от 13.03.2020 по клиенту YERMOLAYEVA LYUDMILA ALEKSANDROVNA ',
        corrId: '26026',
        corrName: 'Обязательства по денежным переводам физических лиц. в Рубли',
        corrMfo: '01158',
        corrInn: '207275139',
        corrAcct: '29834643200001158005',
        corrBank: 'ТОШКЕНТ Ш., "КАПИТАЛБАНК" АТ БАНКИНИНГ "КАПИТАЛ 24" ЧАКАНА БИЗНЕС ФИЛИАЛИ'
      },
      {
        date: new Date('2020-03-12T19:00:00.000Z'),
        hold: false,
        comment: 'Перевод средств согл пл поручен от 13.03.2020 по клиенту YERMOLAYEVA LYUDMILA ALEKSANDROVNA ',
        merchant: null,
        movements: [
          {
            id: '41829073',
            account: { id: 'accountId' },
            invoice: null,
            sum: -33500.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: ['9073'], // ???
              company: null
            },
            invoice: null,
            sum: 33500.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to Account RUB', (rawTransaction, transaction) => {
    const accountId = { id: 'accountId', instrument: 'RUB' }
    expect(convertAccountTransaction(accountId, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        amount: 430000000,
        currency: { name: 'UZS', scale: 2 },
        date: 1584039600000,
        docId: '41827588',
        docType: '06',
        docNum: '58379567',
        details: 'Пополнение счета YERMOLAYEVA LYUDMILA ALEKSANDROVNA согл заяв YERMOLAYEVA LYUDMILA ALEKSANDROVNA от 13,03,2020',
        corrId: '',
        corrName: 'СПК Транзитный счет по сред-м списанным с ПК физ.л',
        corrMfo: '01018',
        corrInn: '',
        corrAcct: '17403000900001018001',
        corrBank: 'ТОШКЕНТ Ш., "КАПИТАЛБАНК" АТ БАНКИНИНГ МИРЗО УЛУГБЕК ФИЛИАЛИ'
      },
      {
        date: new Date('2020-03-12T19:00:00.000Z'),
        hold: false,
        comment: 'Пополнение счета YERMOLAYEVA LYUDMILA ALEKSANDROVNA согл заяв YERMOLAYEVA LYUDMILA ALEKSANDROVNA от 13,03,2020',
        merchant: null,
        movements: [
          {
            id: '41827588',
            account: { id: 'accountId' },
            invoice: null,
            sum: 4300000.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'UZS',
              syncIds: ['7588'], // ???
              company: null
            },
            invoice: null,
            sum: -4300000.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        amount: -2454043,
        currency: { name: 'UZS', scale: 2 },
        date: 1568746800000,
        docId: '17431653',
        docType: '06',
        docNum: '1464112',
        details: 'Ком. банка  0,5% от суммы 33500.00 RUB за перевод по SWIFT со счета YERMOLAYEVA LYUDMILA ALEKSANDROVNA за 18.09.2019 г.',
        corrId: '104240',
        corrName: '17*220*Ком. дох. по иностранным платежам - физ лица',
        corrMfo: '01158',
        corrInn: '207275139',
        corrAcct: '45253000800001158010',
        corrBank: 'ТОШКЕНТ Ш., "КАПИТАЛБАНК" АТ БАНКИНИНГ "КАПИТАЛ 24" ЧАКАНА БИЗНЕС ФИЛИАЛИ'
      },
      {
        date: new Date('2019-09-17T19:00:00.000Z'),
        hold: false,
        comment: 'Ком. банка  0,5% от суммы 33500.00 RUB за перевод по SWIFT со счета YERMOLAYEVA LYUDMILA ALEKSANDROVNA за 18.09.2019 г.',
        merchant: null,
        movements: [
          {
            id: '17431653',
            account: { id: 'accountId' },
            invoice: null,
            sum: -24540.43,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'UZS',
              syncIds: ['1653'], // ???
              company: null
            },
            invoice: null,
            sum: 24540.43,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to Account UZS', (rawTransaction, transaction) => {
    const accountId = { id: 'accountId', instrument: 'UZS' }
    expect(convertAccountTransaction(accountId, rawTransaction)).toEqual(transaction)
  })
})
