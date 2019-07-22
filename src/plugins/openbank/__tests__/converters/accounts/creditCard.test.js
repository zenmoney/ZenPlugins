import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts credit card', () => {
    expect(convertAccount({
      is_card_replacement_available: 0,
      is_card_replacement_active: 0,
      design_showcase_url_full: '/content/images/showcase/Visa_Rewards_EMV_PayWave_(Смарт)_non-persoFull.png',
      card_replacement_price_text: 'Один перевыпуск в год — бесплатный. Второй или третий перевыпуск за год будет по условиям вашего тарифа.',
      card_replacement_time_text: 'Занимает до 11 рабочих дней.',
      pan: '4058***6632',
      design_url: '/content/images/Visa_Rewards_EMV_PayWave_(Смарт)_non-perso.png',
      design_url_full: '/content/images/Visa_Rewards_EMV_PayWave_(Смарт)_non-persoFull.png',
      transactions_total_amount: 0,
      IsSalary: false,
      tariff_month_pos_tran: 0,
      is_active: 1,
      is_set_pin_available: 1,
      account_id: 12603702,
      type: 2,
      title_small: 'Кредитная Opencard',
      title: 'Кредитная VISA 6632',
      closing_date: '2023-02-19T00:00:00',
      balance: 102960.79,
      currency: 'RUR',
      full_payment: 13050.79,
      next_payment: 0,
      next_payment_date: '2019-08-19T00:00:00',
      loan_amount: 117000,
      is_blocked: 0,
      partial_withdraw_available: 1,
      refill_available: 1,
      is_apple_pay_available: 1,
      blocked_amount: 738.42,
      brand_info:
        {
          brand_type: 7,
          next_income: 0,
          travel_bonus_available: 0,
          travel_bonus_current: 0,
          current_cashback: 0,
          next_cashback_income: '0001-01-01T00:00:00',
          next_promo_cashback_income: '0001-01-01T00:00:00',
          below_limit_cashback_percent: 0,
          above_limit_cashback_percent: 0,
          current_pos_transaction_sum: 0,
          cashback_requirement: 0,
          cash_withdrawal_requirement: 0,
          below_limit_cash_withdrawal: 0,
          above_limit_cash_withdrawal: 0,
          current_limit_cash_withdrawal: 0,
          current_cash_withdrawal: 0,
          current_refill: 0,
          current_limit_refill: 0
        },
      open_date: '2019-05-01T00:00:00',
      has_overdue_payment: 0,
      cardholder_name: '',
      digital_card_id: 0,
      scheme_id: 'xint'
    })).toEqual({
      id: '12603702',
      type: 'ccard',
      title: 'Кредитная VISA 6632',
      instrument: 'RUR',
      syncID: ['4058***6632'],
      balance: -14039.21,
      creditLimit: 117000
    })
  })
})
