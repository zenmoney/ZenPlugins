import { convertAccount } from '../../../converters'

const apiAccount = {
  __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
  number: '00214365870900',
  balanceInterestRate: 5,
  tariffPlanId: '0123456789',
  id: '0123456789',
  name: 'ЗП De Luxe накопичувальний',
  alias: 'ЗП De Luxe накопичувальний',
  reminder: null,
  warning: null,
  type: { __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto', name: 'SAVINGS_ACCOUNT' },
  balance: {
    __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
    sum: 10,
    currency: { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
  },
  interestRates: [],
  minimalBalance: null,
  totalAvailableAmount: null,
  overdraft: null,
  paymentAmountToEnableGracePeriod: null,
  paymentDateToEnableGracePeriod: null,
  tariffPlanResource: null,
  category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
}

describe('convertAccount', () => {
  it('converts savings account', () => {
    expect(convertAccount(apiAccount)).toEqual({
      product: {
        id: '0123456789',
        category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
      },
      account: {
        id: '0123456789',
        type: 'checking',
        savings: true,
        title: 'ЗП De Luxe накопичувальний',
        instrument: 'UAH',
        balance: 10,
        syncID: [
          '00214365870900'
        ]
      }
    })
  })
})
