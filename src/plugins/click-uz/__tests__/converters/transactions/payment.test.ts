import { convertTransaction } from '../../../converters'
import { Account, AccountType } from '../../../../../types/zenmoney'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: 5,
        payment_id: 1763675599,
        service_id: 148,
        amount: 15000,
        comission_amount: 0,
        state: 1,
        payment_status: 2,
        payment_status_description: null,
        service_name: 'Uzmobile (GSM)',
        datetime: 1646013502,
        account_id: 19615128,
        image: 'https://cdn.click.uz/app/evo/service/payment/148_v3.png',
        barcode_url: '',
        card_num: 'xxxx',
        credit: false,
        repeatable: true,
        favorite_permission: true,
        myhome_permission: true,
        receipt: false,
        cancel_permission: false,
        service_type: 'default',
        currency: 'UZS',
        barcode: {
          image: null,
          header: null,
          footer: null
        },
        data: [
          {
            key: 'Номер телефона',
            value: '994021337',
            main: true
          }
        ]
      },
      {
        comment: null,
        date: new Date('2022-02-28T01:58:22.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'Uzmobile (GSM)',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: {
              id: '19615128'
            },
            fee: 0,
            id: '1763675599',
            invoice: null,
            sum: -15000
          }
        ],
        groupKeys: [
          '2022-02-28_UZS_15000'
        ]
      }
    ]
  ])('converts payment', (apiTransaction, transaction) => {
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
