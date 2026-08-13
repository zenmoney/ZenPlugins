import { convertDeposit } from '../../../converters.js'

describe('convertDeposit', () => {
  it('converts the current GraphQL camelCase deposit shape', () => {
    const startDate = new Date('2026-08-11T00:00:00+03:00')
    expect(convertDeposit({
      id: 201,
      programName: 'Дохідний',
      maturityDate: '2027-08-11',
      currencyCode: 'USD',
      balance: 10000,
      interestRate: 250
    }, startDate)).toEqual({
      product: { id: 201, type: 'deposit' },
      account: {
        id: '201',
        type: 'deposit',
        title: 'Дохідний',
        instrument: 'USD',
        syncIds: ['201'],
        balance: 100,
        startBalance: 100,
        capitalization: true,
        percent: 2.5,
        startDate,
        endDateOffsetInterval: 'year',
        endDateOffset: 1,
        payoffInterval: 'month',
        payoffStep: 1
      }
    })
  })

  it.each([
    [
      {
        balance: 100000,
        currency_code: 'USD',
        gradient: { end_color: '#039CE3', start_color: '#2B2C46' },
        id: 39985504,
        interest_accrued: 110,
        interest_payment_period: 'M',
        interest_rate: 220,
        maturity_date: '10.07.2020',
        profitability_amount: 920,
        program_id: 557,
        program_name: 'Дохідний',
        replenishment_allowed_flag: false,
        withdrawal_allowed_flag: false
      },
      {
        product: { id: 39985504, type: 'deposit' },
        account: {
          id: '39985504',
          type: 'deposit',
          title: 'Дохідний',
          instrument: 'USD',
          syncIds: ['39985504'],
          balance: 1000.00,
          startBalance: 1000.00,
          capitalization: true,
          percent: 2.20,
          startDate: new Date('2020-01-01T00:00:00+02:00'),
          endDateOffsetInterval: 'day',
          endDateOffset: 190,
          payoffInterval: 'month',
          payoffStep: 1
        }
      }
    ],
    [
      {
        balance: 100167,
        currency_code: 'USD',
        gradient: { end_color: '#035FE3', start_color: '#393E4F' },
        id: 39985500,
        interest_accrued: 63,
        interest_payment_period: 'M',
        interest_rate: 140,
        maturity_date: '08.04.2020',
        profitability_amount: 252,
        program_id: 1044,
        program_name: 'Накопичувальний',
        replenishment_allowed_flag: true,
        withdrawal_allowed_flag: false
      },
      {
        product: { id: 39985500, type: 'deposit' },
        account: {
          id: '39985500',
          type: 'deposit',
          title: 'Накопичувальний',
          instrument: 'USD',
          syncIds: ['39985500'],
          balance: 1001.67,
          startBalance: 1001.67,
          capitalization: true,
          percent: 1.40,
          startDate: new Date('2020-01-01T00:00:00+02:00'),
          endDateOffsetInterval: 'day',
          endDateOffset: 97,
          payoffInterval: 'month',
          payoffStep: 1
        }
      }
    ],
    [
      {
        balance: 100000,
        currency_code: 'USD',
        gradient: { end_color: '#039CE3', start_color: '#2B2C46' },
        id: 39985504,
        interest_accrued: 110,
        interest_payment_period: 'M',
        interest_rate: 220,
        maturity_date: '10.07.2019',
        profitability_amount: 920,
        program_id: 557,
        program_name: 'Дохідний',
        replenishment_allowed_flag: false,
        withdrawal_allowed_flag: false
      },
      {
        product: { id: 39985504, type: 'deposit' },
        account: {
          id: '39985504',
          type: 'deposit',
          title: 'Дохідний',
          instrument: 'USD',
          syncIds: ['39985504'],
          balance: 1000.00,
          startBalance: 1000.00,
          capitalization: true,
          percent: 2.20,
          startDate: new Date('2020-01-01T00:00:00+02:00'),
          endDateOffsetInterval: 'day',
          endDateOffset: 1,
          payoffInterval: 'month',
          payoffStep: 1
        }
      }
    ]
  ])('converts deposit', (apiDeposit, deposit) => {
    expect(convertDeposit(apiDeposit, new Date('2020-01-01T00:00:00+02:00'))).toEqual(deposit)
  })
})
