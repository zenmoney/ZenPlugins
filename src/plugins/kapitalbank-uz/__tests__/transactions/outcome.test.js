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
        hpan: '860049***2185',
        utime: 1595668623000,
        udate: 1595668623000,
        terminal: '92900678',
        resp: '-1',
        city: 'Uzbekiston',
        reqamt: '160 000,00',
        merchant: '90510000205',
        merchantName: 'CHZAKB DAVR BANK',
        reversal: false,
        street: 'Navoiy   Zarkaynar Blok A',
        credit: false,
        transType: '683',
        utrnno: 9053825023,
        actamt: 16000000
      },
      {
        date: new Date('2020-07-25T09:17:03.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: 'Uzbekiston',
          title: 'CHZAKB DAVR BANK',
          mcc: null,
          location: 'Navoiy   Zarkaynar Blok A'
        },
        movements: [
          {
            id: '9053825023',
            account: { id: 'cardId' },
            invoice: null,
            sum: -160000.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        hpan: '860049***2185',
        utime: 1594792387000,
        udate: 1594792387000,
        terminal: '91100024',
        resp: '-1',
        city: '-',
        reqamt: '2 000 000,00',
        merchant: '90490007772',
        merchantName: 'YASHNABADSKIY FILIAL OAKB',
        reversal: false,
        street: 'Toshkent shahri, Yashnobod tuma',
        credit: true,
        transType: '760',
        utrnno: 8991874667,
        actamt: 200000000
      },
      {
        date: new Date('2020-07-15T05:53:07.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: '-',
          title: 'YASHNABADSKIY FILIAL OAKB',
          mcc: null,
          location: 'Toshkent shahri, Yashnobod tuma'
        },
        movements: [
          {
            id: '8991874667',
            account: { id: 'cardId' },
            invoice: null,
            sum: 2000000.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome UZS', (rawTransaction, transaction) => {
    const cardId = { id: 'cardId', instrument: 'UZS' }
    expect(convertUzcardCardTransaction(cardId, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        transDate: 1593930969000,
        amount: '-19.99',
        merchantName: 'DRI*Adobe Systems,orderfind.co IE',
        transType: 'Товары и услуги',
        fee: '0.00',
        currency: { name: 'USD', scale: 2 },
        approvalCode: '833389',
        back: false,
        transCode: '000000',
        reversed: false,
        transAmount: '-19.99',
        transCurrency: 'USD',
        conversionRate: '1'
      },
      {
        date: new Date('2020-07-05T06:36:09.000Z'),
        hold: false,
        comment: 'Товары и услуги',
        merchant: {
          country: null,
          city: null,
          title: 'DRI*Adobe Systems,orderfind.co IE',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '833389',
            account: { id: 'cardId' },
            invoice: null,
            sum: -19.99,
            fee: 0
          }
        ]
      }
    ],
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
          title: 'АКБ "Капиталбанк"',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '110',
            account: { id: 'cardId' },
            invoice: null,
            sum: 5.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome VISA', (rawTransaction, transaction) => {
    const cardId = { id: 'cardId', instrument: 'USD' }
    expect(convertVisaCardTransaction(cardId, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        transDate: 1594528142000,
        amount: '-2 167 604,76',
        merchantName: 'TOSHKENT SH., AT  ALOKABANK',
        transType: 'Оплата товаров и услуг',
        fee: '0,00',
        currency: { name: 'UZS', scale: 2 },
        reversed: false
      },
      {
        date: new Date('2020-07-12T04:29:02.000Z'),
        hold: false,
        comment: 'Оплата товаров и услуг',
        merchant: {
          country: null,
          city: null,
          title: 'TOSHKENT SH., AT  ALOKABANK',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: null,
            account: { id: 'cardId' },
            invoice: null,
            sum: -2167604.76,
            fee: 0
          }
        ]
      }
    ],
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
              type: 'cash',
              instrument: 'UZS',
              syncIds: ['rdId'], // ???
              company: null
            },
            invoice: null,
            sum: -15000.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome HUMO', (rawTransaction, transaction) => {
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
  ])('converts outcome Account RUB', (rawTransaction, transaction) => {
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
  ])('converts outcome Account UZS', (rawTransaction, transaction) => {
    const accountId = { id: 'accountId', instrument: 'UZS' }
    expect(convertAccountTransaction(accountId, rawTransaction)).toEqual(transaction)
  })
})
