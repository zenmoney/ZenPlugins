import {
  convertUzcardCardTransaction
  // convertHumoCardTransaction,
  // convertVisaCardTransaction,
  // convertWalletTransaction,
  // convertAccountTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        hpan: '626272***0966',
        utime: 1682994922000,
        udate: 1682994922000,
        terminal: '34110740',
        resp: '-1',
        city: 'TASHKENT ',
        reqamt: '0,00',
        merchant: '',
        merchantName: 'IP OOO MAGNUM RETAIL KASS',
        reversal: false,
        street: '',
        credit: false,
        transType: '737',
        utrnno: 18160772975,
        actamt: 0,
        conamt: 0
      },
      null
    ]
  ])('converts skipped transactions', (rawTransaction, transaction) => {
    const card = {
      id: 'card',
      instrument: 'UZS'
    }
    expect(convertUzcardCardTransaction(card, rawTransaction)).toEqual(transaction)
  })
})
