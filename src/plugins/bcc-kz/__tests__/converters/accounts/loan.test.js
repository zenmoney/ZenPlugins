import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: 1780121,
          account20: 'AG2/2019/F/L/33479',
          repay: 'KZ878562204106194266',
          repay_id: 1767835,
          note: 'Ипотека "Баспана-Хит"',
          module: '14',
          currency: 'KZT',
          open_date: '12.04.2019',
          percent: '11',
          close_date: '12.10.2029',
          period: '126 Месяц',
          nearest_pay_amount: 93282.66,
          nearest_pay_date: '15.09.2021',
          visible: true,
          allow_db: 1,
          allow_cr: 1,
          debt_status: 'required_debt',
          access_level: 2,
          amount: '9520000',
          balance: '-6015023.57',
          structType: 'loan'
        }
      ],
      [
        {
          product: {
            productId: '1780121',
            productType: 'loan'
          },
          accounts: [
            {
              balance: -6015023.57,
              capitalization: true,
              endDateOffset: 126,
              endDateOffsetInterval: 'month',
              id: '1780121',
              instrument: 'KZT',
              payoffInterval: 'month',
              payoffStep: 1,
              percent: 11,
              startBalance: 9520000,
              startDate: new Date('2019-04-12T00:00:00.000+06:00'),
              syncIds: [
                'AG2/2019/F/L/33479'
              ],
              title: 'Ипотека "Баспана-Хит"',
              type: 'loan'
            }
          ]
        }
      ]
    ],
    [
      [
        {
          id: 5553204,
          type: 'CURRENT',
          account20: 'KZ068562799116995262',
          product: '',
          open_date: '01.05.2022',
          accPTPSum: 0,
          visible: true,
          direct_credit: false,
          allow_db: 1,
          allow_cr: 1,
          can_close: true,
          is_epv: null,
          is_zhv: null,
          note: 'KZ068562799116995262',
          acc_status: 'Рабочий',
          module: '01',
          currency: 'KZT',
          access_level: 2,
          for_credit: 'TRUE',
          balance: '7.16',
          blocked: '0',
          structType: 'current'
        },
        {
          id: 5553202,
          account20: 'PIL-150921-596648',
          repay: 'KZ068562799116995262',
          repay_id: 5553204,
          note: 'PIL GRACE (аннуитет, с льготным периодом) миграция Альфа',
          module: '14',
          currency: 'KZT',
          open_date: '23.09.2021',
          percent: '38',
          close_date: '23.09.2023',
          period: '24 месяца',
          nearest_pay_amount: 43312.84,
          nearest_pay_date: '12.07.2022',
          visible: true,
          allow_db: 1,
          allow_cr: 1,
          debt_status: 'required_debt',
          access_level: 2,
          amount: '725000',
          balance: '-509100.08',
          structType: 'loan'
        }
      ],
      [
        {
          product: {
            productId: '5553204',
            productType: 'loan'
          },
          accounts: [
            {
              id: '5553204',
              type: 'checking',
              title: 'KZ068562799116995262',
              instrument: 'KZT',
              syncIds: [
                'KZ068562799116995262'
              ],
              savings: false,
              balance: 7.16
            },
            {
              id: '5553202',
              type: 'loan',
              title: 'PIL GRACE (аннуитет, с льготным периодом) миграция Альфа',
              instrument: 'KZT',
              syncIds: [
                'PIL-150921-596648'
              ],
              balance: -509100.08,
              startDate: new Date('2021-09-23T00:00:00.000+06:00'),
              startBalance: 725000,
              capitalization: true,
              percent: 38,
              endDateOffset: 24,
              endDateOffsetInterval: 'month',
              payoffInterval: 'month',
              payoffStep: 1
            }
          ]
        }
      ]
    ],
    [
      [
        {
          id: 5140662,
          type: 'CURRENT',
          account20: 'KZ478562204115856768',
          product: 'Специальный счет для выплат ЕПВ',
          open_date: '04.03.2022',
          accPTPSum: 0,
          visible: true,
          direct_credit: false,
          allow_db: 0,
          allow_cr: 0,
          can_close: false,
          is_epv: true,
          is_zhv: false,
          loan_pay: 0,
          note: 'Спец счет для ЕПВ',
          acc_status: 'Нерабочий',
          module: '01',
          currency: 'KZT',
          access_level: 2,
          for_credit: 'FALSE',
          balance: '0',
          blocked: '0',
          structType: 'current'
        },
        {
          id: 3487194,
          type: 'CURRENT',
          account20: 'KZ338562204111102953',
          product: 'Текущий счет физического лица',
          open_date: '01.03.2021',
          accPTPSum: 0,
          visible: true,
          direct_credit: true,
          allow_db: 1,
          allow_cr: 1,
          can_close: true,
          is_epv: false,
          is_zhv: false,
          loan_pay: 0,
          note: 'Текущий счет',
          acc_status: 'Рабочий',
          module: '01',
          currency: 'KZT',
          access_level: 2,
          for_credit: 'TRUE',
          balance: '0',
          blocked: '0',
          structType: 'current'
        },
        {
          id: 3548385,
          account20: 'A02/2021/F/L/012785',
          repay: 'KZ338562204111102953',
          repay_id: 3487194,
          note: 'Ипотека "7-20-25" Скоринг',
          module: '14',
          currency: 'KZT',
          open_date: '16.03.2021',
          percent: '7',
          close_date: '16.03.2041',
          period: '240 месяцев',
          nearest_pay_amount: 98324.56,
          nearest_pay_date: '15.11.2022',
          visible: true,
          allow_db: 1,
          allow_cr: 1,
          debt_status: 'required_debt',
          nearest_pay_status: {
            status: 4,
            text: '',
            amount: 98324.56,
            info: ''
          },
          gift_prod: 0,
          access_level: 2,
          amount: '14262480',
          balance: '-12194480.65',
          structType: 'loan'
        }
      ],
      [
        {
          accounts: [
            {
              balance: 0,
              id: '5140662',
              instrument: 'KZT',
              savings: false,
              syncIds: ['KZ478562204115856768'],
              title: 'Спец счет для ЕПВ',
              type: 'checking'
            }
          ],
          product: {
            productId: '5140662',
            productType: 'checking'
          }
        },
        {
          accounts: [
            {
              balance: 0,
              id: '3487194',
              instrument: 'KZT',
              savings: false,
              syncIds: ['KZ338562204111102953'],
              title: 'Текущий счет',
              type: 'checking'
            },
            {
              balance: -12194480.65,
              capitalization: true,
              endDateOffset: 240,
              endDateOffsetInterval: 'month',
              id: '3548385',
              instrument: 'KZT',
              payoffInterval: 'month',
              payoffStep: 1,
              percent: 7,
              startBalance: 14262480,
              startDate: new Date('2021-03-15T18:00:00.000Z'),
              syncIds: ['A02/2021/F/L/012785'],
              title: 'Ипотека "7-20-25" Скоринг',
              type: 'loan'
            }
          ],
          product: {
            productId: '3487194',
            productType: 'loan'
          }
        }
      ]
    ],
    [
      [
        {
          id: 1806387,
          type: 'CURRENT',
          account20: 'KZ858562204106364343',
          product: 'Текущий счет физического лица',
          open_date: '08.05.2019',
          accPTPSum: 0,
          visible: true,
          direct_credit: false,
          allow_db: 1,
          allow_cr: 1,
          can_close: true,
          is_epv: false,
          is_zhv: false,
          loan_pay: 0,
          note: 'Текущий счет',
          acc_status: 'Рабочий',
          module: '01',
          currency: 'KZT',
          access_level: 2,
          for_credit: 'TRUE',
          balance: '230579',
          blocked: '0',
          structType: 'current'
        },
        {
          id: 3100168,
          account20: 'AF7/2020/F/L/048778',
          repay: 'KZ858562204106364343',
          repay_id: 1806387,
          note: 'Ипотека "7-20-25" (РД)',
          module: '14',
          currency: 'KZT',
          open_date: '26.11.2020',
          percent: '7',
          close_date: '26.11.2045',
          period: '300 Месяц (25 лет)',
          nearest_pay_amount: 142620.12,
          nearest_pay_date: '15.11.2022',
          visible: true,
          allow_db: 1,
          allow_cr: 1,
          debt_status: 'required_debt',
          nearest_pay_status:
            {
              status: 1,
              text: 'Платёж погашен',
              amount: 0,
              info: 'Погашение ежемесячного платежа производится банком после 18:00, в дату планового платежа по графику'
            },
          gift_prod: 0,
          access_level: 2,
          amount: '16356560',
          balance: '-15102556.99',
          structType: 'loan'
        },
        {
          id: 5756402,
          account20: 'OPA/2022/F/L/034740',
          repay: 'KZ858562204106364343',
          repay_id: 1806387,
          note: 'На приобретение нового автотранспорта',
          module: '14',
          currency: 'KZT',
          open_date: '22.05.2022',
          percent: '24.9',
          close_date: '22.05.2029',
          period: '84 Месяц (7 лет)',
          nearest_pay_amount: 230579,
          nearest_pay_date: '24.10.2022',
          visible: true,
          allow_db: 1,
          allow_cr: 1,
          debt_status: 'required_debt',
          nearest_pay_status:
            {
              status: 2,
              text: 'Ожидает погашения',
              amount: 142620.12,
              info: 'Погашение ежемесячного платежа производится банком после 18:00, в дату планового платежа по графику'
            },
          gift_prod: 0,
          access_level: 2,
          amount: '9120000',
          balance: '-8957847.63',
          structType: 'loan'
        }
      ],
      [
        {
          product: {
            productId: '1806387',
            productType: 'loan'
          },
          accounts: [
            {
              balance: 230579,
              id: '1806387',
              instrument: 'KZT',
              savings: false,
              syncIds: ['KZ858562204106364343'],
              title: 'Текущий счет',
              type: 'checking'
            },
            {
              balance: -15102556.99,
              capitalization: true,
              endDateOffset: 300,
              endDateOffsetInterval: 'month',
              id: '3100168',
              instrument: 'KZT',
              payoffInterval: 'month',
              payoffStep: 1,
              percent: 7,
              startBalance: 16356560,
              startDate: new Date('2020-11-25T18:00:00.000Z'),
              syncIds: ['AF7/2020/F/L/048778'],
              title: 'Ипотека "7-20-25" (РД)',
              type: 'loan'
            },
            {
              balance: -8957847.63,
              capitalization: true,
              endDateOffset: 84,
              endDateOffsetInterval: 'month',
              id: '5756402',
              instrument: 'KZT',
              payoffInterval: 'month',
              payoffStep: 1,
              percent: 24.9,
              startBalance: 9120000,
              startDate: new Date('2022-05-21T18:00:00.000Z'),
              syncIds: ['OPA/2022/F/L/034740'],
              title: 'На приобретение нового автотранспорта',
              type: 'loan'
            }
          ]
        }
      ]
    ]
  ])('converts loan', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
