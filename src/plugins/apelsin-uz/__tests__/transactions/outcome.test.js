import {
  convertUzcardCardTransaction,
  convertHumoCardTransaction,
  convertVisaCardTransaction,
  convertUzumVisaCardTransaction,
  convertWalletTransaction,
  convertAccountTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        hpan: '860049***3346',
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
    ]
  ])('converts outcome UZS', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertUzcardCardTransaction(card, rawTransaction)).toEqual(transaction)
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
        comment: null,
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
    const card = { id: 'card', instrument: 'USD' }
    expect(convertVisaCardTransaction(card, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        transactionId: '6f358aef-c368-4044-80a0-2e5d97b123f4',
        holdId: 'b53c79df-37e2-425c-a416-bd119b2476aa',
        description: 'ELECTRONIC_PURCHASE',
        transactionStatus: 'SUCCESS',
        transAmount: '1700.00',
        transCurrency: 'UZS',
        conversionRate: '1.0000000',
        transDate: 1758091645083,
        amount: '1700.00',
        merchantName: 'ATTO>uzumbank.uz/                     UZ',
        transType: 'DEBIT',
        fee: '0.00',
        currency: {
          uzscurrency: true,
          name: 'UZS',
          scale: 2
        },
        transCode: '680',
        reversed: false
      },
      {
        date: new Date('2025-09-17T06:47:25.083Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'ATTO>uzumbank.uz/                     UZ',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '6f358aef-c368-4044-80a0-2e5d97b123f4',
            account: { id: 'card' },
            invoice: null,
            sum: -1700,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome VISA', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertUzumVisaCardTransaction(card, rawTransaction)).toEqual(transaction)
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
        comment: null,
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
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertHumoCardTransaction(card, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        amount: -31085595,
        date: 1590828879142,
        operation: 'wallet2requisite',
        details: 'Оплата по реквизитам'
      },
      {
        date: new Date('2020-05-30T08:54:39.142Z'),
        hold: false,
        comment: 'Оплата по реквизитам',
        merchant: null,
        movements: [
          {
            id: null,
            account: { id: 'wallet' },
            invoice: null,
            sum: -310855.95,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outerOutcome to Wallet UZS', (rawTransaction, transaction) => {
    const wallet = { id: 'wallet', instrument: 'UZS' }
    expect(convertWalletTransaction(wallet, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        amount: -2454043,
        currency: { name: 'UZS', scale: 2 },
        date: 1568746800000,
        docId: '17431653',
        docType: '06',
        docNum: '1464112',
        details: 'Ком. банка  0,5% от суммы 33500.00 RUB за перевод по SWIFT со счета NIKOLAEV NIKOLAY NIKOLAEVICH за 18.09.2019 г.',
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
        comment: 'Ком. банка  0,5% от суммы 33500.00 RUB за перевод по SWIFT со счета NIKOLAEV NIKOLAY NIKOLAEVICH за 18.09.2019 г.',
        merchant: null,
        movements: [
          {
            id: '17431653',
            account: { id: 'account' },
            invoice: null,
            sum: -24540.43,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome to Account UZS', (rawTransaction, transaction) => {
    const account = { id: 'account', instrument: 'UZS' }
    expect(convertAccountTransaction(account, rawTransaction)).toEqual(transaction)
  })
})
