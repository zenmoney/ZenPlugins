import { convertDeposit } from '../../converters'

const deposits = [
  [
    {
      statement_kinds: ['first_refill', 'percent', 'refill'],
      bank: 'rocket',
      id: 2168384,
      percent: 65.12,
      title: 'Вклад-Копилка',
      max_amount: 50000,
      balance_without_percents: 12480,
      status: 'closed',
      start_date: '2019-05-22',
      end_date: '2020-05-23',
      balance: 12545.12,
      refillable: true,
      token: 2168384,
      can_refill_by_date: true,
      statements: [
        {
          amount: 10000,
          kind: 'first_refill',
          balance: 10000,
          description: 'Первое пополнение',
          date: 1558555232
        },
        {
          amount: 14.55,
          kind: 'percent',
          balance: 10014.55,
          description: 'Начисление процентов',
          date: 1559304434
        },
        {
          amount: 2480,
          kind: 'refill',
          balance: 12494.55,
          description: 'Пополнение',
          date: 1561451538
        },
        {
          amount: 50.57,
          kind: 'percent',
          balance: 12545.12,
          description: 'Начисление процентов',
          date: 1561896476
        }
      ],
      rocket_deposit: {
        permalink: 'rocket_25633_451_RUB',
        currency: 'RUB',
        currency_text: 'Рублевый',
        url: 'https://rocketbank.ru/deposits?app=1',
        rr_percent_text: 'Пополняемый',
        period: 12,
        period_text: '12 месяцев',
        min_amount_text: 'от 10 000 ?',
        capitalization_available: true,
        min_amount: 10000,
        rr_percent: null,
        rate: 5.9,
        refill_rate: 5.9,
        refill_switch_texts_true: 'Максимальная сумма вклада не может более чем в 5 раз превышать первоначальный взнос',
        refill_switch_texts_false: '',
        capitalization_switch_texts_card: 'Выплачивается ежемесячно',
        capitalization_switch_texts_deposit: 'Повышает доходность вклада',
        capitalization_switch_text: 'С учетом капитализации, доходность по вкладу составит',
        capitalization_switch_standard_rate: '6.31%',
        capitalization_switch_refill_rate: '6.06%',
        other_currencies_text: null
      }
    },
    {
      'balance': 12610.24,
      'capitalization': true,
      'endDateOffset': 12,
      'endDateOffsetInterval': 'month',
      'id': '6e32c40aabf3eb19bd570c8bb198ddf0',
      'instrument': 'RUB',
      'payoffInterval': 'month',
      'payoffStep': 1,
      'percent': 5.9,
      'startDate': new Date('2019-05-22T00:00:00+00:00'),
      'syncID': ['8384'],
      'title': 'Вклад-Копилка',
      'type': 'deposit'
    }
  ]
]

describe('convertDeposit', () => {
  for (let i = 0; i < deposits.length; i++) {
    const num = deposits.length > 1 ? '#' + (i + 1) : ''
    it(`should convert ${num}`, () => {
      expect(
        convertDeposit(deposits[i][0])
      ).toEqual(
        deposits[i][1]
      )
    })
  }
})
