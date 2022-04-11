import { convertTransaction } from '../../../converters'
import { Account, AccountType } from '../../../../../types/zenmoney'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: 7,
        payment_id: 0,
        service_id: null,
        amount: 0,
        comission_amount: 0,
        state: 1,
        payment_status: 2,
        payment_status_description: null,
        service_name: 'ANDIJON SH., "KHAMKORBANK" OAT BANKINING',
        datetime: 1649457355,
        account_id: 19615128,
        image: 'https://cdn.click.uz/app/evo/service/payment/transType_526.png',
        barcode_url: '',
        card_num: 'xxxx',
        credit: false,
        repeatable: false,
        favorite_permission: false,
        myhome_permission: null,
        receipt: false,
        cancel_permission: false,
        service_type: 'default',
        currency: 'UZS',
        barcode: { image: null, header: null, footer: null },
        data: []
      },
      undefined
    ]
  ])('converts corner case transaction', (apiTransaction, transaction) => {
    const account: Account = {
      balance: 0,
      id: '19615128',
      instrument: 'UZS',
      savings: false,
      syncIds: [
        '418780******1337'
      ],
      title: 'VISA-карта',
      type: AccountType.ccard
    }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
