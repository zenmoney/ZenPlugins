import {
  convertWalletTransaction,
  convertAccountTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        amount: -9640664,
        date: 1590842028913,
        operation: 'wallet2humo',
        details: 'Перевод с кошелька на карту'
      },
      {
        date: new Date('2020-05-30T12:33:48.913Z'),
        hold: false,
        comment: 'Перевод с кошелька на карту',
        merchant: null,
        movements: [
          {
            id: null,
            account: { id: 'wallet' },
            invoice: null,
            sum: -96406.64,
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
            sum: 96406.64,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outerOutcomeTransfer to Wallet UZS', (rawTransaction, transaction) => {
    const wallet = { id: 'wallet', instrument: 'UZS' }
    expect(convertWalletTransaction(wallet, rawTransaction)).toEqual(transaction)
  })

  it.each([
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
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: 33500.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outerOutcomeTransfer to Account RUB', (rawTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertAccountTransaction(account, rawTransaction)).toEqual(transaction)
  })
})
