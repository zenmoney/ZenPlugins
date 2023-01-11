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
        ],
        groupKeys: [
          '2022-03-05_UZS_25072.3'
        ]
      }
    ],
    [
      {
        id: 35,
        payment_id: 2247788891,
        service_id: -4,
        amount: 119180,
        comission_amount: 1180,
        state: 1,
        payment_status: 2,
        payment_status_description: null,
        service_name: 'Перевод с карты на карту',
        datetime: 1672306648,
        account_id: 22897874,
        image: 'https://cdn.click.uz/app/evo/service/payment/p2p_debit.png',
        barcode_url: 'https://my.click.uz/clickp2p/DB1C12BB6C5849D33EC7741807AF5755D59CAC1FCA7ABEAE202C0994F89C5F12?amount=118000.00',
        card_num: '418780******1337',
        credit: false,
        repeatable: false,
        favorite_permission: false,
        myhome_permission: null,
        receipt: false,
        cancel_permission: false,
        service_type: 'default',
        currency: 'UZS',
        ofd_barcode_data: 'https://ofd.soliq.uz/epi?t=EP000000000026&r=2199763298&c=20221229143728&s=555732125803',
        ofd_available: true,
        barcode: {},
        data:
          [
            { key: 'ФИО отправителя', value: 'TEMUR TEMUROV', main: false },
            {
              key: 'Номер карты получателя',
              value: '626275****1234',
              main: true
            },
            {
              key: 'ФИО получателя',
              value: 'ANNA ANNOVNA',
              main: false
            }
          ]
      },
      {
        hold: false,
        date: new Date('2022-12-29T14:37:28+0500'),
        movements:
          [
            {
              id: '2247788891',
              account: { id: '19615128' },
              invoice: null,
              sum: -118000,
              fee: -1180
            },
            {
              id: null,
              account: {
                type: 'ccard',
                instrument: 'UZS',
                company: null,
                syncIds: ['626275****1234']
              },
              invoice: null,
              sum: 118000,
              fee: 0
            }
          ],
        merchant:
          {
            fullTitle: 'ANNA ANNOVNA',
            mcc: null,
            location: null
          },
        comment: null,
        groupKeys: [
          '2022-12-29_UZS_118000'
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
