import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
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
        },
        {
          id: 4936485,
          acc_id: 'I/201008/1/3446',
          type: 'Visa_Gold_Reward.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******6994',
          note: '#картакарта',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '10.2025',
          psys: 'VISA',
          branch: 'Центральное отделение №0112',
          product_code: '0.300.1500.8.2',
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
          card_type: 'credit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'Beren7.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          alias: true,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '.3',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 4936485,
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
            productId: '4936485',
            productType: 'ccard'
          },
          accounts: [
            {
              available: 0.3,
              creditLimit: 0,
              gracePeriodEndDate: null,
              id: '4936485',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ348562204109395444',
                '489993******6994',
                '489993******6955'
              ],
              title: '#картакарта',
              totalAmountDue: 0,
              type: 'ccard'
            }
          ]
        }
      ]
    ]
  ])('converts duplicate VirtualCards 1', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })

  it.each([
    [
      [
        {
          id: 4936485,
          acc_id: 'I/201008/1/3446',
          type: 'Visa_Gold_Reward.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******6994',
          note: '#картакарта',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '10.2025',
          psys: 'VISA',
          branch: 'Центральное отделение №0112',
          product_code: '0.300.1500.8.2',
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
          card_type: 'credit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'Beren7.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          alias: true,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '.3',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 4936485,
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
        },
        {
          id: 9879843,
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
            id: 9879843,
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
            productId: '4936485',
            productType: 'ccard'
          },
          accounts: [
            {
              available: 0.3,
              creditLimit: 0,
              gracePeriodEndDate: null,
              id: '4936485',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ348562204109395444',
                '489993******6994',
                '489993******6955'
              ],
              title: '#картакарта',
              totalAmountDue: 0,
              type: 'ccard'
            }
          ]
        }
      ]
    ]
  ])('converts duplicate VirtualCards 2', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })

  it.each([
    [
      [
        {
          id: 4936485,
          acc_id: 'I/201008/1/3446',
          type: 'Visa_Gold_Reward_Virtual.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******6994',
          note: 'Virtual карта',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '10.2025',
          psys: 'VISA',
          branch: 'Центральное отделение №0112',
          product_code: '0.300.1500.8.2',
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
          card_type: 'credit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'Beren7.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          alias: true,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '.3',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 4936485,
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
        },
        {
          id: 9879843,
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
            id: 9879843,
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
            productId: '4936485',
            productType: 'ccard'
          },
          accounts: [
            {
              available: 0.3,
              creditLimit: 0,
              gracePeriodEndDate: null,
              id: '4936485',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ348562204109395444',
                '489993******6994',
                '489993******6955'
              ],
              title: 'Virtual карта',
              totalAmountDue: 0,
              type: 'ccard',
              virtual: true
            }
          ]
        }
      ]
    ]
  ])('converts duplicate VirtualCards 1+2', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })

  it.each([
    [
      [
        {
          id: 4936485,
          acc_id: 'I/201008/1/3446',
          type: 'Visa_Gold_Reward_Virtual.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******6994',
          note: 'Virtual карта',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '10.2025',
          psys: 'VISA',
          branch: 'Центральное отделение №0112',
          product_code: '0.300.1500.8.2',
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
          card_type: 'credit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'Beren7.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          alias: true,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '.3',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 4936485,
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
        },
        {
          id: 9879843,
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
            id: 9879843,
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
        },
        {
          id: 9936485,
          acc_id: 'I/201008/1/3446',
          type: 'Visa_Gold_Reward.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******1234',
          note: 'Visa_Gold карта',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '10.2025',
          psys: 'VISA',
          branch: 'Центральное отделение №0112',
          product_code: '0.300.1500.8.2',
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
          card_type: 'credit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'Beren7.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          alias: true,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '.3',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 9936485,
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
            productId: '9936485',
            productType: 'ccard'
          },
          accounts: [
            {
              available: 0.3,
              creditLimit: 0,
              gracePeriodEndDate: null,
              id: '9936485',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ348562204109395444',
                '489993******1234',
                '489993******6994',
                '489993******6955'
              ],
              title: 'Visa_Gold карта',
              totalAmountDue: 0,
              type: 'ccard'
            }
          ]
        }
      ]
    ]
  ])('converts duplicate VirtualCards 1+2+ Ccard', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })

  it.each([
    [
      [
        {
          id: 4936485,
          acc_id: 'I/201008/1/3446',
          type: 'Visa_Gold_Reward.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******6994',
          note: 'Visa_Gold карта',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '10.2025',
          psys: 'VISA',
          branch: 'Центральное отделение №0112',
          product_code: '0.300.1500.8.2',
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
          card_type: 'credit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'Beren7.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          alias: true,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '.3',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 4936485,
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
        },
        {
          id: 9879843,
          acc_id: 'ALM/20/P/378307-C/20/262206',
          type: 'Visa_Reward.png',
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
            id: 9879843,
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
            productId: '4936485',
            productType: 'ccard'
          },
          accounts: [
            {
              available: 0.3,
              creditLimit: 0,
              gracePeriodEndDate: null,
              id: '4936485',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ348562204109395444',
                '489993******6994',
                '489993******6955'
              ],
              title: 'Visa_Gold карта',
              totalAmountDue: 0,
              type: 'ccard'
            }
          ]
        }
      ]
    ]
  ])('converts duplicate Cards', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })

  it.each([
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
        },
        {
          id: 4936485,
          acc_id: 'I/201008/1/3446',
          type: 'Visa_Gold_Reward.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******6994',
          note: '#картакарта',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '10.2025',
          psys: 'VISA',
          branch: 'Центральное отделение №0112',
          product_code: '0.300.1500.8.2',
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
          card_type: 'credit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'Beren7.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          alias: true,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '.3',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 4936485,
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
        },
        {
          id: 9979843,
          acc_id: 'ALM/20/P/378307-C/20/262206',
          type: 'Visa_Reward_Virtual.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******1234',
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
            id: 9979843,
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
        },
        {
          id: 9996485,
          acc_id: 'I/201008/1/3446',
          type: 'Visa_Gold_Reward.png',
          account20: 'KZ348562204109395444',
          card_num: '489993******4321',
          note: '#картакарта',
          module: '10',
          currency: 'KZT',
          holder: '',
          exp_date: '10.2025',
          psys: 'VISA',
          branch: 'Центральное отделение №0112',
          product_code: '0.300.1500.8.2',
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
          card_type: 'credit',
          allow_db: 1,
          allow_cr: 1,
          main_card: 1,
          card_design: 'Beren7.png',
          card_color_text: 'ffffff',
          ext_conversion: true,
          bccpay: 0,
          multicard: false,
          alias: true,
          access_level: 2,
          repay_amount: 0,
          hide_balance: 0,
          debt: 0,
          limit: '0',
          blocked: '0',
          balance: '.3',
          card_status: '00',
          percent: '',
          close_date: '',
          structType: 'card',
          details: {
            id: 9996485,
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
            productId: '4936485',
            productType: 'ccard'
          },
          accounts: [
            {
              available: 0.3,
              creditLimit: 0,
              gracePeriodEndDate: null,
              id: '4936485',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ348562204109395444',
                '489993******6994',
                '489993******6955',
                '489993******1234',
                '489993******4321'
              ],
              title: '#картакарта',
              totalAmountDue: 0,
              type: 'ccard'
            }
          ]
        }
      ]
    ]
  ])('converts duplicate VirtualCards 1+3', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
