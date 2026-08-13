import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts current account', () => {
    expect(convertAccount({
      __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
      number: '26005878825187',
      balanceInterestRate: null,
      tariffPlanId: '542732143',
      id: '542732143',
      name: 'Счёт «IT Предприниматель»',
      alias: 'Счёт «IT Предприниматель»',
      reminder: null,
      warning: null,
      type:
        {
          __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto',
          name: 'CURRENT_ACCOUNT'
        },
      balance:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 28.18,
          currency:
            {
              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
              name: 'UAH'
            }
        },
      interestRates: [],
      minimalBalance: null,
      totalAvailableAmount:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 28.18,
          currency:
            {
              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
              name: 'UAH'
            }
        },
      overdraft: null,
      paymentAmountToEnableGracePeriod: null,
      paymentDateToEnableGracePeriod: null,
      tariffPlanResource: null,
      category:
        {
          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
          name: 'ACCOUNT'
        }
    })).toEqual({
      product: {
        id: '542732143',
        category: {
          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
          name: 'ACCOUNT'
        }
      },
      account: {
        id: '542732143',
        type: 'checking',
        title: 'Счёт «IT Предприниматель»',
        instrument: 'UAH',
        syncID: ['26005878825187'],
        balance: 28.18
      }
    })
  })
})
