import { convertLoan } from '../../../converters.js'

describe('converLoan', () => {
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
        syncID: ['39325971']
      }
    ]
  ])('converts loan', (apiLoan, loan) => {
    expect(convertLoan(apiLoan)).toEqual(loan)
  })
})
