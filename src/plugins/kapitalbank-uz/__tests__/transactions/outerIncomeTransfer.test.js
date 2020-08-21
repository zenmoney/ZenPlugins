import {
  // convertUzcardCardTransaction
  // convertUzcardCardTransaction,
  // convertHumoCardTransaction,
  // convertVisaCardTransaction
  // convertWalletTransaction,
  convertAccountTransaction
} from '../../converters'

describe('convertTransaction', () => {
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
        merchant: {
          country: null,
          city: null,
          title: 'YERMOLAYEVA LYUDMILA ALEKSANDROVNA',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '41828390',
            account: { id: 'account' },
            invoice: null,
            sum: 33500.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -33500.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outerIncomeTransfer to Account RUB', (rawTransaction, transaction) => {
    const accountId = { id: 'account', instrument: 'RUB' }
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
        details: 'Пополнение счета YERMOLAYEVA LYUDMILA ALEKSANDROVNA согл заяв SIDOROV SIDOR SIDOROVICH от 13,03,2020',
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
        comment: 'Пополнение счета YERMOLAYEVA LYUDMILA ALEKSANDROVNA согл заяв SIDOROV SIDOR SIDOROVICH от 13,03,2020',
        merchant: {
          country: null,
          city: null,
          title: 'SIDOROV SIDOR SIDOROVICH',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '41827588',
            account: { id: 'account' },
            invoice: null,
            sum: 4300000.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'UZS',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -4300000.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outerIncomeTransfer to Account UZS', (rawTransaction, transaction) => {
    const accountId = { id: 'account', instrument: 'UZS' }
    expect(convertAccountTransaction(accountId, rawTransaction)).toEqual(transaction)
  })
})
