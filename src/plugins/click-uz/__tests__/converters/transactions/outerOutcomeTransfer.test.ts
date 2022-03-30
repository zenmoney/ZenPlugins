import { convertTransaction } from '../../../converters'
import { Account, AccountType } from '../../../../../types/zenmoney'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: 1,
        payment_id: 0,
        service_id: null,
        amount: 25072.3,
        comission_amount: 0,
        state: 1,
        payment_status: 2,
        payment_status_description: null,
        service_name: 'SIFROVOY BANK KAPITALBANK',
        datetime: 1646493052,
        account_id: 19615128,
        image: 'https://cdn.click.uz/app/evo/service/payment/transType_683.png',
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
        barcode: {
          image: null,
          header: null,
          footer: null
        },
        data: []
      },
      {
        comment: null,
        date: new Date('2022-03-05T15:10:52.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'SIFROVOY BANK KAPITALBANK',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: {
              id: '19615128'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -25072.3
          },
          {
            account: {
              company: null,
              instrument: 'UZS',
              syncIds: null,
              type: 'ccard'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 25072.3
          }
        ]
      }
    ]
  ])('converts outer outcome transaction', (apiTransaction, transaction) => {
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
