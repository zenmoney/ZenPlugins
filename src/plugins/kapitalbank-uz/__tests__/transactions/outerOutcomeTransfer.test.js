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
              syncIds: ['8390'],
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
        details: 'Перевод средств согл пл поручен от 13.03.2020 по клиенту IVAN IVANOVICH IVANOV ',
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
        comment: 'Перевод средств согл пл поручен от 13.03.2020 по клиенту IVAN IVANOVICH IVANOV ',
        merchant: {
          country: null,
          city: null,
          title: 'IVAN IVANOVICH IVANOV',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '41829073',
            account: { id: 'account' },
            invoice: null,
            sum: -33500.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: ['9073'],
              company: null
            },
            invoice: null,
            sum: 33500.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outerIncomeTransfer to Account RUB', (rawTransaction, transaction) => {
    const accountId = { id: 'account', instrument: 'RUB' }
    expect(convertAccountTransaction(accountId, rawTransaction)).toEqual(transaction)
  })
})
