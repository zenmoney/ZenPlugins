import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts savings account', () => {
    expect(convertAccount({
      __type: 'ru.vtb24.mobilebanking.protocol.product.SavingsAccountMto',
      amount: {
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        },
        sum: 0.26,
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto'
      },
      archived: false,
      closeDate: null,
      details: null,
      displayName: 'Накопительный счет',
      hideTariffsInfo: false,
      id: 'F1ABB1311A944485B984BD2EE933E4A1',
      lastOperationDate: null,
      name: 'Накопительный счет',
      number: '42817110331354007284',
      openDate: new Date('Fri Feb 12 2016 00:00:00 GMT+0300'),
      showOnMainPage: true,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
        id: 'OPEN'
      }
    })).toEqual({
      id: 'F1ABB1311A944485B984BD2EE933E4A1',
      type: 'ru.vtb24.mobilebanking.protocol.product.SavingsAccountMto',
      zenAccount: {
        id: 'F1ABB1311A944485B984BD2EE933E4A1',
        type: 'checking',
        title: 'Накопительный счет',
        instrument: 'RUB',
        balance: 0.26,
        savings: true,
        syncID: [
          '42817110331354007284'
        ]
      }
    })
  })
})
