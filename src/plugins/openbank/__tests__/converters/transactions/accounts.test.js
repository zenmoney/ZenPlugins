import { convertAccount } from '../../../converters'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../../../../common/accounts'

const accounts = {
  // дебетовые карты
  '1': [
    [
      {
        is_card_replacement_available: 1,
        is_card_replacement_active: 0,
        design_showcase_url_full: '/content/images/showcase/MasterCard_Gold_EMV_PayPass_ЕжикСобакаFull.png',
        card_replacement_price_text: 'Один перевыпуск в год — бесплатный. Второй или третий перевыпуск за год будет по условиям вашего тарифа.',
        card_replacement_time_text: 'Занимает до 11 рабочих дней.',
        pan: '5449***5599',
        design_url: '/content/images/MasterCard_Gold_EMV_PayPass_ЕжикСобака.png',
        design_url_full: '/content/images/MasterCard_Gold_EMV_PayPass_ЕжикСобакаFull.png',
        design_id: 'good_things',
        transactions_total_amount: 0,
        IsSalary: false,
        tariff_month_pos_tran: 0,
        is_active: 1,
        is_set_pin_available: 1,
        account_id: 6732543,
        type: 1,
        title_small: 'Специальный плюс',
        title: 'MasterCard 5599',
        closing_date: '2021-05-31T00:00:00',
        balance: 227.74,
        currency: 'RUR',
        is_blocked: 0,
        partial_withdraw_available: 1,
        refill_available: 1,
        is_apple_pay_available: 1,
        open_date: '2017-05-01T00:00:00',
        has_overdue_payment: 0,
        cardholder_name: 'RAMIL BAIAZITOV',
        digital_card_id: 0,
        tariff_info_url: 'https://www.open.ru/storage/files/tarifs_spec_plus.pdf',
        scheme_id: 'xint'
      },
      {
        'balance': 227.74,
        'id': '6732543',
        'instrument': 'RUR',
        'syncID': ['5449***5599'],
        'title': 'MasterCard 5599',
        'type': 'ccard'
      }
    ]
  ],

  // кредиты
  '4': [
    [
      { account_id: 10958043,
        type: 4,
        title_small: '12,00% годовых',
        title: 'Профессионал (RUR) с 01/07/2014',
        pan: '2467406-ДО-МСК-18',
        closing_date: '2023-10-30T00:00:00',
        currency: 'RUR',
        annual_interest: 12,
        full_payment: 1622295.15,
        next_payment: 40158,
        next_payment_date: '2019-07-30T00:00:00',
        loan_amount: 1804990,
        is_blocked: 0,
        refill_available: 1,
        open_date: '2018-10-30T00:00:00',
        has_overdue_payment: 0,
        digital_card_id: 0,
        scheme_id: 'cred'
      },
      {
        'balance': -1622295.15,
        'capitalization': true,
        'endDateOffset': 41,
        'endDateOffsetInterval': 'month',
        'id': '10958043',
        'instrument': 'RUR',
        'payoffInterval': 'month',
        'payoffStep': 1,
        'percent': 12,
        'startBalance': 1804990,
        'startDate': '2018-10-30',
        'syncID': ['2467406'],
        'title': 'Профессионал (RUR) с 01/07/2014',
        'type': 'loan'
      }
    ],

    [
      {
        account_id: 8788963,
        type: 4,
        title_small: '9,70% годовых',
        title: 'Квартира_092014 (RUR)',
        pan: '129593',
        closing_date: '2028-11-30T00:00:00',
        currency: 'RUR',
        annual_interest: 9.7,
        full_payment: 5785746.37,
        next_payment: 78715,
        next_payment_date: '2019-07-31T00:00:00',
        loan_amount: 6343200,
        is_blocked: 0,
        refill_available: 0,
        open_date: '2017-12-04T00:00:00',
        has_overdue_payment: 0,
        digital_card_id: 0,
        scheme_id: 'cred'
      },
      {
        'balance': -5785746.37,
        'capitalization': true,
        'endDateOffset': 74,
        'endDateOffsetInterval': 'month',
        'id': '8788963',
        'instrument': 'RUR',
        'payoffInterval': 'month',
        'payoffStep': 1,
        'percent': 9.7,
        'startBalance': 6343200,
        'startDate': '2017-12-04',
        'syncID': ['129593'],
        'title': 'Квартира_092014 (RUR)',
        'type': 'loan'
      }
    ],

    [
      {
        account_id: 10958043,
        type: 4,
        title_small: '12,00% годовых',
        title: 'Профессионал (RUR) с 01/07/2014',
        pan: '2467406-ДО-МСК-18',
        closing_date: '2023-10-30T00:00:00',
        currency: 'RUR',
        annual_interest: 12,
        full_payment: 1622295.15,
        next_payment: 40158,
        next_payment_date: '2019-07-30T00:00:00',
        loan_amount: 1804990,
        is_blocked: 0,
        refill_available: 1,
        open_date: '2018-10-30T00:00:00',
        has_overdue_payment: 0,
        digital_card_id: 0,
        scheme_id: 'cred'
      },
      {
        'balance': -1622295.15,
        'capitalization': true,
        'endDateOffset': 41,
        'endDateOffsetInterval': 'month',
        'id': '10958043',
        'instrument': 'RUR',
        'payoffInterval': 'month',
        'payoffStep': 1,
        'percent': 12,
        'startBalance': 1804990,
        'startDate': '2018-10-30',
        'syncID': ['2467406'],
        'title': 'Профессионал (RUR) с 01/07/2014',
        'type': 'loan'
      }
    ]
  ],

  // счета
  '5': [
    [
      {
        kopilka: 0,
        exchange_rate: 0,
        account_id: 8788962,
        type: 5,
        title: '40817810399910012432',
        pan: '40817810399910012432',
        balance: 0.54,
        currency: 'RUR',
        is_blocked: 0,
        partial_withdraw_available: 1,
        refill_available: 1,
        open_date: '2017-12-04T00:00:00',
        has_overdue_payment: 0,
        digital_card_id: 0,
        scheme_id: 'xint'
      },
      {
        'balance': 0.54,
        'id': '8788962',
        'instrument': 'RUR',
        'syncID': ['40817810399910012432'],
        'title': '40817810399910012432',
        'type': 'checking'
      }
    ],
    [
      {
        kopilka: 0,
        exchange_rate: 0,
        account_id: 10958042,
        type: 5,
        title: '40817810099972467406',
        pan: '40817810099972467406',
        balance: 0,
        currency: 'RUR',
        is_blocked: 0,
        partial_withdraw_available: 1,
        refill_available: 1,
        open_date: '2018-10-30T00:00:00',
        has_overdue_payment: 0,
        digital_card_id: 0,
        scheme_id: 'xint'
      },
      {
        'balance': 0,
        'id': '10958042',
        'instrument': 'RUR',
        'syncID': ['40817810099972467406'],
        'title': '40817810099972467406',
        'type': 'checking'
      }
    ]
  ],

  // заблокированные счета
  '9': [
    [
      {
        kopilka: 0,
        exchange_rate: 1,
        deposit_name: 'my_money_box',
        account_id: 2,
        type: 9,
        currency: 'RUR',
        is_blocked: 1,
        has_overdue_payment: 0,
        digital_card_id: 0,
        tariff_info_url: 'https://www.open.ru/storage/files/tariffs_moneybox.pdf'
      },
      null
    ],
    [
      {
        kopilka: 0,
        exchange_rate: 64.24,
        deposit_name: 'my_money_box',
        account_id: 0,
        type: 9,
        currency: 'USD',
        is_blocked: 1,
        has_overdue_payment: 0,
        digital_card_id: 0,
        tariff_info_url: 'https://www.open.ru/storage/files/tariffs_moneybox.pdf'
      },
      null
    ]
  ]
}

describe('convertAccount', () => {
  Object.keys(accounts).forEach(type => {
    for (let i = 0; i < accounts[type].length; i++) {
      const num = accounts[type].length > 1 ? '#' + i : ''
      it(`should convert '${type}' ${num}`, () => {
        expect(
          convertAccount(accounts[type][i][0])
        ).toEqual(
          accounts[type][i][1]
        )
      })
    }
  })
})

xdescribe('convertOneAccount', () => {
  const type = '4'
  const num = 2
  it(`should convert '${type}' ${num}`, () => {
    expect(
      convertAccount(accounts[type][num][0])
    ).toEqual(
      accounts[type][num][1]
    )
  })
})

describe('ensureSyncIDsAreUniqueButSanitized', () => {
  it('should generate syncid', () => {
    expect(
      ensureSyncIDsAreUniqueButSanitized({ accounts: [{ syncID: [ '5449***5599' ] }, { syncID: [ '12345678901234567890' ] }], sanitizeSyncId })
    ).toEqual(
      [{ 'syncID': ['5599'] }, { 'syncID': ['7890'] }]
    )
  })
})
