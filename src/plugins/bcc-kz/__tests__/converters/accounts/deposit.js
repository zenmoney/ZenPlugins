import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: 3540569,
          type: 'NONCURRENT',
          account20: 'KZ048562207111271862',
          product: 'Чемпион (новый)',
          period: '13 месяцев',
          gained: 41.21,
          open_date: '14.03.2021',
          visible: true,
          allow_db: 1,
          allow_cr: 1,
          is_moneybox: false,
          prolong_fl: 'false',
          set_prolong_fl: 0,
          note: 'Коплю',
          acc_status: 'Рабочий',
          module: '01',
          currency: 'KZT',
          percent: '8.65',
          close_date: '14.04.2022',
          access_level: 2,
          for_credit: 'FALSE',
          balance: '49309.84',
          blocked: '1000',
          dep_status: 'Актуален',
          dep_wp_amount: 0,
          dep_wp_amount_todate: '17.03.2021',
          structType: 'deposit'
        }
      ],
      [
        {
          product: {
            productId: '3540569',
            productType: 'deposit'
          },
          accounts: [
            {
              balance: 49309.84,
              capitalization: true,
              endDateOffset: 13,
              endDateOffsetInterval: 'month',
              id: '3540569',
              instrument: 'KZT',
              payoffInterval: 'month',
              payoffStep: 1,
              percent: 8.65,
              startBalance: 49309.84,
              startDate: new Date('2021-03-14T00:00:00.000+06:00'),
              syncIds: [
                'KZ048562207111271862'
              ],
              title: 'Чемпион (новый) Коплю',
              type: 'deposit'
            }
          ]
        }
      ]
    ],
    [
      [
        {
          id: 3663621,
          type: 'NONCURRENT',
          account20: 'KZ448562207107956458',
          product: 'Чемпион (новый)',
          period: '13 месяцев',
          gained: 167336.68,
          open_date: '14.04.2021',
          visible: true,
          allow_db: 1,
          allow_cr: 1,
          is_moneybox: false,
          prolong_fl: 'false',
          set_prolong_fl: 0,
          note: '5% Фонд ремонта',
          acc_status: 'Рабочий',
          module: '01',
          currency: 'KZT',
          percent: '8.65',
          close_date: '14.05.2022',
          access_level: 2,
          for_credit: 'FALSE',
          balance: '37500',
          blocked: '1000',
          dep_status: 'Актуален',
          dep_wp_amount: 0,
          dep_wp_amount_todate: '17.04.2021',
          structType: 'deposit'
        }
      ],
      [
        {
          product: {
            productId: '3663621',
            productType: 'deposit'
          },
          accounts: [
            {
              balance: 37500,
              capitalization: true,
              endDateOffset: 13,
              endDateOffsetInterval: 'month',
              id: '3663621',
              instrument: 'KZT',
              payoffInterval: 'month',
              payoffStep: 1,
              percent: 8.65,
              startBalance: 37500,
              startDate: new Date('2021-04-14T00:00:00.000+06:00'),
              syncIds: [
                'KZ448562207107956458'
              ],
              title: 'Чемпион (новый) 5% Фонд ремонта',
              type: 'deposit'
            }
          ]
        }
      ]
    ]
  ])('converts deposit', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
