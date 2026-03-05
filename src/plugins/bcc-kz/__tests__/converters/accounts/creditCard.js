import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: 3849913,
          acc_id: 'I/210330/1/988',
          type: 'Visa_Gold_Reward.png',
          account20: 'KZ688562204112187559',
          card_num: '',
          note: '#картакарта',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '03.2026',
          psys: 'VISA',
          branch: 'Отделение №2202',
          product_code: '0.300.1500.8',
          reissue: false,
          credit_limit: 40000,
          is_with_deposit: false,
          gained: 0,
          visible: true,
          virtual: false,
          social: false,
          junior: false,
          direct_credit: false,
          card_group: 'GROUP_5',
          has_applepay: true,
          has_installment: true,
          own_balance: 0.36,
          card_type: 'credit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'group_5_kartakarta.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          access_level: 2,
          repay_amount: 0,
          cr_int_pay: 0,
          cr_exp_pay: 0,
          l_contract: 'AA3/2021/F/S/045919',
          l_procent: 22.99,
          l_start_date: '27.05.2021',
          l_end_date: '27.11.2024',
          lastdea: '27.11.2024',
          paydate: '27.09.2021',
          l_limit: 40000,
          l_available_limit: 40000,
          l_debt_sum: 0,
          l_percent_sum: 0,
          l_over_debt: 0,
          l_fine: 0,
          l_grace: 0,
          l_mandatory_pay: 0,
          debt_status: 'no_debt',
          limit: '40000',
          blocked: '0',
          balance: '40000.36',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 3849913,
            iban: 'KZ688562204112187559',
            installment_enabled: false,
            categories_selected: 0,
            categories_chose: false,
            debt_info: {
              credit_line: {
                acc_name: 'AA3/2021/F/S/045919',
                pay_amount: 0,
                prc_amount: 0,
                cms_amount: 0,
                min_amount: 0
              },
              fine_amount: 0,
              over_debt_amount: 0,
              total_cms_amount: 0,
              total_prc_amount: 0,
              total_min_amount: 0,
              grace_amount: 0,
              total_debt_amount: 0,
              full_amount: 0,
              status: 'no_debt'
            }
          }
        }
      ],
      [
        {
          product: {
            productId: '3849913',
            productType: 'ccard'
          },
          accounts: [
            {
              available: 40000.36,
              creditLimit: 40000,
              gracePeriodEndDate: new Date('2021-09-27T00:00:00.000+06:00'),
              id: '3849913',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ688562204112187559',
                ''
              ],
              title: '#картакарта',
              totalAmountDue: 0,
              type: 'ccard'
            }
          ]
        }
      ]
    ]
  ])('converts creditCard', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
