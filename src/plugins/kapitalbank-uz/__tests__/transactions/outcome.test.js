import {
  convertUzcardCardTransaction,
  convertHumoCardTransaction,
  convertVisaCardTransaction
  // convertWalletTransaction,
  // convertAccountTransaction
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
          location: null
        },
        movements: [
          {
            id: '9053825023',
            account: { id: 'card' },
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
          location: null
        },
        movements: [
          {
            id: '8991874667',
            account: { id: 'card' },
            invoice: null,
            sum: 2000000.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome UZS', (rawTransaction, transaction) => {
    const cardId = { id: 'card', instrument: 'UZS' }
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
            id: null,
            account: { id: 'card' },
            invoice: null,
            sum: -19.99,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome VISA', (rawTransaction, transaction) => {
    const cardId = { id: 'card', instrument: 'USD' }
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
            account: { id: 'card' },
            invoice: null,
            sum: -2167604.76,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome HUMO', (rawTransaction, transaction) => {
    const cardId = { id: 'card', instrument: 'UZS' }
    expect(convertHumoCardTransaction(cardId, rawTransaction)).toEqual(transaction)
  })
})
