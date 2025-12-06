import { BunqPayment } from '../../../models'
import { Transaction } from '../../../../../types/zenmoney'
import { convertTransactions } from '../../../converters'

const bunqTransaction: BunqPayment = {
  id: 1212,
  created: '2024-05-02 16:14:44.108574',
  monetary_account_id: 444,
  amount: {
    currency: 'EUR',
    value: '-24.78'
  },
  description: 'FORU ROTTERDAM, NL',
  type: 'MASTERCARD',
  merchant_reference: null,
  counterparty_alias: {
    iban: null,
    display_name: 'ROTTERDAM FORU',
    merchant_category_code: '5651'
  },
  sub_type: 'PAYMENT'
}

const formattedTransaction: Transaction = {
  date: new Date(Date.UTC(2024, 4, 2, 16, 14, 44, 108)),
  movements: [
    {
      id: '1212',
      sum: -24.78,
      account: {
        id: '444'
      },
      fee: 0,
      invoice: null
    }
  ],
  merchant: {
    title: 'ROTTERDAM FORU',
    mcc: 5651,
    category: undefined,
    location: null,
    city: null,
    country: null
  },
  comment: 'FORU ROTTERDAM, NL',
  hold: false
}

describe('convertTransaction', () => {
  it('should convert transaction', () => {
    expect(convertTransactions([bunqTransaction], [])).toEqual([formattedTransaction])
  })
})
