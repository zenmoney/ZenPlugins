import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts investment account', () => {
    const apiAccount = {
      __type: 'ru.vtb24.mobilebanking.protocol.product.InvestmentAccountMto',
      number: '30601810900000114660',
      statusDescription: null,
      name: 'Брокерский счет в рублях',
      displayName: 'Брокерский счет в рублях',
      showOnMainPage: true,
      archived: false,
      detailLevel: 'List',
      id: '906B2678764449C99B0A49FD46D961AF',
      stub: null,
      ver: null,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
        id: 'OPEN'
      },
      openDate: new Date('Fri Mar 04 2016 00:00:00 GMT+0300 (MSK)'),
      lastOperationDate: null,
      closeDate: null,
      amount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: 0,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        }
      },
      paymentSystemBinding: null,
      details: null
    }
    expect(convertAccount(apiAccount)).toEqual({
      mainProduct: {
        id: '906B2678764449C99B0A49FD46D961AF',
        type: 'ru.vtb24.mobilebanking.protocol.product.InvestmentAccountMto'
      },
      products: [],
      zenAccount: {
        balance: 0,
        id: '906B2678764449C99B0A49FD46D961AF',
        instrument: 'RUB',
        savings: true,
        syncID: ['30601810900000114660'],
        title: 'Брокерский счет в рублях',
        type: 'investment'
      }
    })
  })
})
