import { parseDateInTimezone } from '../../../../../common/momentTimezoneDateUtils'
import { convertAccount } from '../../../converters.js'

describe('convertAccount', () => {
  it.each([
    [
      {
        balance: 0,
        cards: [
          {
            account_id: 131997382,
            embossing_name: 'NIKOLAY NIKOLAEV',
            expiration_date: '28.02.2023T00:00:00',
            id: '013497720261',
            number: '535528******7595',
            status: 'ACTIVE',
            type: 'M'
          }
        ],
        currency_code: 'UAH',
        iban: 'UA203348510000026209112908380',
        id: 131997382,
        name: 'NIKOLAY NIKOLAEV',
        number: '26209112908380',
        overdraft_flag: false,
        type: 'DEBIT_CARD_ACCOUNT'
      },
      {
        mainProduct: {
          id: 131997382,
          type: 'account'
        },
        products: [
          {
            id: '013497720261',
            type: 'card'
          }
        ],
        account: {
          id: '131997382',
          type: 'ccard',
          title: '*7595',
          instrument: 'UAH',
          syncID: [
            'UA203348510000026209112908380',
            '535528******7595'
          ],
          balance: 0
        }
      }
    ],
    [
      {
        balance: 305000,
        cards: [
          {
            account_id: 133745746,
            embossing_name: 'NIKOLAY NIKOLAEV',
            expiration_date: '28.02.2023T00:00:00',
            id: '013476623881',
            number: '431414******0455',
            status: 'ACTIVE',
            type: 'V'
          }
        ],
        credit_info: {
          agreement_id: 41369852,
          min_payment: 0,
          min_payment_paid: true,
          own_money: 5000,
          own_money_copy: 50,
          payment_due_date: '17.03.2020',
          total_credit_limit: 300000,
          use_amount: 0,
          use_amount_copy: -50,
          use_amount_copy2: 0
        },
        currency_code: 'UAH',
        iban: 'UA583348510000026201112937456',
        id: 133745746,
        name: 'NIKOLAY NIKOLAEV',
        number: '26201112937456',
        overdraft_flag: false,
        type: 'CREDIT_CARD_ACCOUNT'
      },
      {
        mainProduct: {
          id: 133745746,
          type: 'account'
        },
        products: [
          {
            id: '013476623881',
            type: 'card'
          }
        ],
        account: {
          id: '133745746',
          type: 'ccard',
          title: '*0455',
          instrument: 'UAH',
          syncID: [
            'UA583348510000026201112937456',
            '431414******0455'
          ],
          balance: 50.00,
          creditLimit: 3000.00,
          totalAmountDue: 0,
          gracePeriodEndDate: parseDateInTimezone('2020-03-17', 'Europe/Kiev')
        }
      }
    ],
    [
      {
        balance: 0,
        cards: [],
        currency_code: 'UAH',
        iban: 'UA503348510000026207112592561',
        id: 126562728,
        name: 'NIKOLAY NIKOLAEV',
        number: '26207112592561',
        overdraft_flag: false,
        type: 'DEBIT_CARD_ACCOUNT'
      },
      {
        mainProduct: {
          id: 126562728,
          type: 'account'
        },
        products: [],
        account: {
          id: '126562728',
          type: 'ccard',
          title: '*2561',
          instrument: 'UAH',
          syncID: [
            'UA503348510000026207112592561'
          ],
          balance: 0
        }
      }
    ],
    [
      {
        balance: 263895,
        cards: [{
          account_id: 101484735,
          embossing_name: 'NIKOLAY NIKOLAEV',
          expiration_date: '30.09.2020T00:00:00',
          id: '010794071224',
          number: '516754******0111',
          status: 'ACTIVE',
          type: 'M'
        },
        {
          account_id: 101484735,
          embossing_name: 'NIKOLAY NIKOLAEV',
          expiration_date: '31.07.2022T00:00:00',
          id: '012514978196',
          number: '431403******4722',
          status: 'ACTIVE',
          type: 'V'
        },
        {
          account_id: 101484735,
          embossing_name: 'NIKOLAY NIKOLAEV',
          expiration_date: '31.07.2022T00:00:00',
          id: '012514985687',
          number: '516754******4916',
          status: 'ACTIVE',
          type: 'M'
        }],
        currency_code: 'UAH',
        iban: 'UA263348510000026204405534938',
        id: 101484735,
        name: 'NIKOLAY NIKOLAEV',
        number: '26204405534938',
        overdraft_flag: true,
        overdraft_info:
        {
          agreement_id: 30600451,
          amount: 395000,
          own_money: 0,
          use_amount: 131105
        },
        type: 'DEBIT_CARD_ACCOUNT'
      },
      {
        mainProduct: {
          id: 101484735,
          type: 'account'
        },
        products: [
          {
            id: '010794071224',
            type: 'card'
          },
          {
            id: '012514978196',
            type: 'card'
          },
          {
            id: '012514985687',
            type: 'card'
          }
        ],
        account: {
          id: '101484735',
          type: 'ccard',
          title: '*0111',
          instrument: 'UAH',
          syncID: [
            'UA263348510000026204405534938',
            '516754******0111',
            '431403******4722',
            '516754******4916'
          ],
          balance: -1311.05,
          creditLimit: 3950.00
        }
      }
    ],
    [
      {
        balance: 976800,
        cards: [{
          account_id: 128137219,
          embossing_name: 'NIKOLAY NIKOLAEV',
          expiration_date: '31.12.2022T00:00:00',
          id: '013186302014',
          number: '431414**8866',
          status: 'ACTIVE',
          type: 'V'
        }],
        credit_info: {
          agreement_id: 39856486,
          min_payment: 0,
          min_payment_paid: true,
          own_money: 0,
          own_money_copy: 0,
          payment_due_date: '30.04.2020T00:00:00',
          total_credit_limit: 1000000,
          use_amount: 23200,
          use_amount_copy: 232,
          use_amount_copy2: 232
        },
        currency_code: 'UAH',
        iban: 'UA433348510000026206112683222',
        id: 128137219,
        name: 'NIKOLAY NIKOLAEV',
        number: '26206112683222',
        overdraft_flag: false,
        type: 'CREDIT_CARD_ACCOUNT'
      },
      {
        mainProduct: {
          id: 128137219,
          type: 'account'
        },
        products: [
          {
            id: '013186302014',
            type: 'card'
          }
        ],
        account: {
          id: '128137219',
          type: 'ccard',
          title: '*8866',
          instrument: 'UAH',
          syncID: [
            'UA433348510000026206112683222',
            '431414**8866'
          ],
          balance: -232.00,
          creditLimit: 10000.00,
          totalAmountDue: 232,
          gracePeriodEndDate: parseDateInTimezone('2020-04-30', 'Europe/Kiev')
        }
      }
    ],
    [
      {
        balance: 303416,
        cards:
          [{
            account_id: 99373494,
            embossing_name: 'NIKOLAY NIKOLAEV',
            expiration_date: '30.09.2020T00:00:00',
            id: '010813554007',
            number: '516754******9374',
            status: 'ACTIVE',
            type: 'M'
          },
          {
            account_id: 99373494,
            embossing_name: 'NIKOLAY NIKOLAEV',
            expiration_date: '30.09.2020T00:00:00',
            id: '010813554007',
            number: '516754******9374',
            status: 'ACTIVE',
            type: 'M'
          },
          {
            account_id: 99373494,
            embossing_name: 'NIKOLAY NIKOLAEV',
            expiration_date: '31.12.2021T00:00:00',
            id: '011977968053',
            number: '404170******6322',
            status: 'ACTIVE',
            type: 'V'
          },
          {
            account_id: 99373494,
            embossing_name: 'NIKOLAY NIKOLAEV',
            expiration_date: '31.01.2023T00:00:00',
            id: '013365571727',
            number: '535528******9256',
            status: 'ACTIVE',
            type: 'M'
          }],
        currency_code: 'UAH',
        iban: 'UA983348510000026201405405219',
        id: 99373494,
        name: 'NIKOLAY NIKOLAEV',
        number: '26201405405219',
        overdraft_flag: false,
        type: 'DEBIT_CARD_ACCOUNT'
      },
      {
        mainProduct: {
          id: 99373494,
          type: 'account'
        },
        products: [
          {
            id: '010813554007',
            type: 'card'
          },
          {
            id: '011977968053',
            type: 'card'
          },
          {
            id: '013365571727',
            type: 'card'
          }
        ],
        account: {
          id: '99373494',
          type: 'ccard',
          title: '*9374',
          instrument: 'UAH',
          syncID: [
            'UA983348510000026201405405219',
            '516754******9374',
            '404170******6322',
            '535528******9256'
          ],
          balance: 3034.16
        }
      }
    ]
  ])('converts account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
