import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it('keeps an active account when the balance response omits it', () => {
    expect(convertAccounts({
      cards: [{
        id: 12345678,
        card_name: 'Test card',
        card_number: '8600 00** **** 1234',
        card_expire_date: '1230',
        card_status: 1,
        card_type: 'SMARTV',
        currency_code: 'UZS'
      }],
      balances: []
    })).toEqual([{
      account: {
        id: '12345678',
        type: 'ccard',
        title: 'Test card',
        instrument: 'UZS',
        syncIds: ['860000******1234'],
        savings: false,
        balance: null
      },
      products: [{
        id: '12345678',
        cardType: 'SMARTV'
      }]
    }])
  })
})
