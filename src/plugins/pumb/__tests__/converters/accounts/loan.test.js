import { convertLoan } from '../../../converters.js'

describe('converLoan', () => {
  it('converts the current GraphQL camelCase loan shape', () => {
    expect(convertLoan({
      __typename: 'ActiveLoanInfo',
      loanId: 301,
      productName: 'Кредит готівкою',
      agreementAmount: 500000,
      currencyCode: 'UAH',
      openDate: '2026-01-10',
      closeDate: '2027-01-10',
      totalPaymentAmount: 420000,
      nextPaymentDate: '2026-09-10',
      isRefunded: false
    })).toEqual({
      product: { id: 301, type: 'loan' },
      account: {
        id: '301',
        instrument: 'UAH',
        balance: -4200,
        startBalance: 5000,
        type: 'loan',
        title: 'Кредит готівкою',
        startDate: new Date('2026-01-10T00:00:00+02:00'),
        capitalization: true,
        percent: null,
        endDateOffsetInterval: 'year',
        endDateOffset: 1,
        payoffInterval: 'month',
        payoffStep: 1,
        syncIds: ['301']
      }
    })
  })

  it.each([
    [
      {
        agreement_amount: 753800,
        close_date: '03.12.2021',
        currency_code: 'UAH',
        id: 39325971,
        interest_rate: 1,
        next_payment_amount: 0,
        next_payment_date: '03.04.2020',
        open_date: '03.12.2019',
        program_id: 801,
        program_name: 'Торговый кредит SF Standard + грейс-период по ежемесячной комиссии',
        total_payment_amount: 340007
      },
      {
        product: { id: 39325971, type: 'loan' },
        account: {
          id: '39325971',
          instrument: 'UAH',
          balance: -3400.07,
          startBalance: 7538.00,
          type: 'loan',
          title: 'Торговый кредит SF Standard + грейс-период по ежемесячной комиссии',
          startDate: new Date('2019-12-03T00:00:00+02:00'),
          capitalization: true,
          percent: 0.01,
          endDateOffsetInterval: 'year',
          endDateOffset: 2,
          payoffInterval: 'month',
          payoffStep: 1,
          syncIds: ['39325971']
        }
      }
    ],
    [
      {
        agreement_amount: 500000,
        close_date: '10.01.2027',
        currency_code: 'UAH',
        id: 301,
        interest_rate: null,
        next_payment_date: '10.09.2026',
        open_date: '10.01.2026',
        program_name: 'Кредит готівкою',
        total_payment_amount: 420000
      },
      {
        product: { id: 301, type: 'loan' },
        account: {
          id: '301',
          instrument: 'UAH',
          balance: -4200,
          startBalance: 5000,
          type: 'loan',
          title: 'Кредит готівкою',
          startDate: new Date('2026-01-10T00:00:00+02:00'),
          capitalization: true,
          percent: null,
          endDateOffsetInterval: 'year',
          endDateOffset: 1,
          payoffInterval: 'month',
          payoffStep: 1,
          syncIds: ['301']
        }
      }
    ]
  ])('converts loan', (apiLoan, loan) => {
    expect(convertLoan(apiLoan)).toEqual(loan)
  })
})
