import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: 2087116,
          acc_id: 'ALM/19/P/217952-DC/19/302045',
          type: 'MasterCard_World_PayPass.png',
          account20: 'KZ248562204107417115',
          card_num: '510445******7127',
          note: 'MasterCard World PayPass ЗП',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '12.2022',
          psys: 'MC',
          branch: 'Отделение №2202',
          product_code: '0.300.105.1',
          reissue: true,
          credit_limit: 0,
          is_with_deposit: false,
          gained: 0,
          visible: true,
          virtual: false,
          social: false,
          junior: false,
          direct_credit: true,
          card_group: 'GROUP_3',
          has_applepay: true,
          has_installment: false,
          own_balance: 13759.36,
          card_type: 'debit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'group_3_mc_1.png',
          card_color_text: '000000',
          ext_conversion: true,
          bccpay: -1,
          multicard: false,
          access_level: 2,
          repay_amount: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '13759.36',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card'
        }
      ],
      [
        {
          product: {
            productId: '2087116',
            productType: 'ccard'
          },
          accounts: [
            {
              balance: 13759.36,
              id: '2087116',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ248562204107417115',
                '510445******7127'
              ],
              title: 'MasterCard World PayPass ЗП',
              type: 'ccard'
            }
          ]
        }
      ]
    ],
    [
      [
        {
          id: 2879843,
          acc_id: 'ALM/20/P/378307-C/20/262206',
          type: 'Visa_Reward_Virtual.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******6955',
          note: 'Virtual',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '02.2027',
          psys: 'VISA',
          branch: 'Отделение №0202',
          product_code: '0.300.017.7',
          reissue: false,
          credit_limit: 0,
          is_with_deposit: false,
          gained: 0,
          visible: true,
          virtual: false,
          social: false,
          junior: false,
          direct_credit: true,
          card_group: 'GROUP_5',
          has_applepay: true,
          has_installment: true,
          own_balance: 0.3,
          card_type: 'debit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'Beren6.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          alias: false,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '.3',
          card_status: 'SB05',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 2879843,
            iban: 'KZ348562204109395444',
            installment_enabled: false,
            categories_selected: 3,
            categories_chose: true,
            debt_info:
              {
                credit_line:
                  {
                    acc_name: '',
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
            productId: '2879843',
            productType: 'ccard'
          },
          accounts: [
            {
              balance: 0.3,
              id: '2879843',
              instrument: 'KZT',
              savings: false,
              syncIds: ['KZ348562204109395444', '489993******6955'],
              title: 'Virtual',
              type: 'ccard',
              virtual: true
            }
          ]
        }
      ]
    ],
    [
      [
        {
          id: 5453672,
          acc_id: 'ALM/22/P/251597-C/22/115708',
          type: 'Visa_TravelCard.png',
          account20: 'KZ908562204116516952',
          card_num: '446375******7973',
          note: '#TravelCard',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '04.2025',
          psys: 'VISA',
          branch: 'Отделение №1702',
          product_code: '0.300.012.2',
          reissue: false,
          credit_limit: 0,
          is_with_deposit: false,
          gained: 0,
          visible: true,
          virtual: false,
          social: false,
          junior: false,
          direct_credit: false,
          card_group: 'GROUP_5',
          has_applepay: true,
          has_installment: false,
          own_balance: 0,
          card_type: 'debit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'travel.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: true,
          alias: false,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          multiaccs:
            [
              {
                id: 5448109,
                type: 'CURRENT',
                account20: 'KZ658562204216705695',
                product: 'Текущий счет физического лица',
                open_date: '24.04.2022',
                accPTPSum: 0,
                visible: true,
                direct_credit: false,
                allow_db: 1,
                allow_cr: 1,
                can_close: true,
                is_epv: false,
                is_zhv: false,
                note: 'Счёт EUR #TravelCard',
                acc_status: 'Рабочий',
                module: '01',
                currency: 'EUR',
                access_level: 2,
                for_credit: 'FALSE',
                is_cardacc: true,
                balance: '8475.53',
                blocked: '353.55'
              }
            ],
          limit: '0',
          blocked: '0',
          balance: '0',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {}
        }
      ],
      [
        {
          product: {
            productId: '5453672',
            productType: 'ccard'
          },
          accounts: [
            {
              balance: 0,
              id: '5453672',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ908562204116516952',
                '446375******7973'
              ],
              title: '#TravelCard',
              type: 'ccard'
            },
            {
              balance: 8475.53, // - blocked: '353.55' ???
              id: '5448109',
              instrument: 'EUR',
              savings: false,
              syncIds: [
                'KZ658562204216705695'
              ],
              title: 'Счёт EUR #TravelCard',
              type: 'checking'
            }
          ]
        }
      ]
    ]
  ])('converts debitCard', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
