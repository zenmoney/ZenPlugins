import { convertLoan } from '../../../converters'

describe('convertLoan', () => {
  it('converts loan', () => {
    expect(convertLoan({
      alias: 'Кредит на товары',
      category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'LOAN' },
      daysBeforeCloseDate: null,
      endDate: new Date('Sun Dec 09 2012 02:00:00 GMT+0400'),
      id: '1898645862',
      interestRate: 0.01,
      loanAmount: {
        __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
        sum: 10348,
        currency: { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
      },
      managementCommission: 0,
      name: 'Кредит на товары',
      nextRepaymentAmounts: [],
      nextRepaymentText: null,
      number: '0091092512231',
      overdueInterestRate: 7.01,
      paidAmount: {
        __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
        sum: 10348,
        currency: { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
      },
      paidThisMonth: {
        __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
        sum: 0,
        currency: { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
      },
      principalDebtAmount: {
        __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
        sum: 0,
        currency: { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
      },
      rateChanges: [],
      reminder: null,
      repaymentType: { __type: 'com.ukrsibbank.client.protocol.product.loan.LoanRepaymentTypeMto', name: 'ANNUITY' },
      startDate: new Date('Sun Oct 09 2011 01:00:00 GMT+0400'),
      status: { __type: 'com.ukrsibbank.client.protocol.product.loan.LoanStatusMto', name: 'ACTIVE' },
      uahPaidThisMonth: null,
      warning: null,
      __type: 'com.ukrsibbank.client.protocol.product.loan.LoanMto'
    })).toEqual({
      product: {
        id: '1898645862',
        category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'LOAN' }
      },
      account: {
        id: '1898645862',
        type: 'loan',
        title: 'Кредит на товары',
        instrument: 'UAH',
        balance: 0,
        syncID: [
          '0091092512231'
        ],
        startBalance: 10348,
        startDate: new Date('2011-10-09T00:00:00+03:00'),
        capitalization: true,
        percent: 0.01,
        endDateOffsetInterval: 'month',
        endDateOffset: 14,
        payoffInterval: 'month',
        payoffStep: 1
      }
    })
  })
})
