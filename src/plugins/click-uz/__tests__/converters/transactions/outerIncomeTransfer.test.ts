import { convertTransactions } from '../../../converters'
import { Account, AccountType } from '../../../../../types/zenmoney'

describe('convertTransactions', () => {
  it.each([
    [
      [
        {
          id: 31,
          service_id: null,
          payment_id: 0,
          amount: 2800,
          comission_amount: 0,
          state: 1,
          payment_status: 2,
          payment_status_description: null,
          service_name: 'SBOL',
          datetime: 1660286967,
          account_id: null,
          image: 'https://cdn.click.uz/app/evo/service/payment/transType_785.png',
          card_num: '860049***9352',
          credit: true,
          repeatable: false,
          favorite_permission: false,
          myhome_permission: false,
          receipt: false,
          service_type: 'default',
          cancel_permission: false,
          barcode_url: null,
          barcode: {},
          ofd_barcode_data: null,
          data: []
        }
      ],
      [
        {
          date: new Date('2022-08-12T06:49:27.000Z'),
          hold: false,
          movements: [
            {
              account: { id: '19615128' },
              fee: 0,
              id: null,
              invoice: null,
              sum: 2800
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
              sum: -2800
            }
          ],
          merchant: {
            fullTitle: 'SBOL',
            location: null,
            mcc: null
          },
          comment: null,
          groupKeys: [
            '2022-08-12_UZS_2800'
          ]
        }
      ]
    ],
    [
      [
        {
          utrnno: '187784',
          id: 32,
          service_id: null,
          payment_id: 0,
          amount: 945000,
          comission_amount: 0,
          state: 1,
          payment_status: 2,
          payment_status_description: null,
          service_name: 'UNIVERSALBANK TRANSGRANICHN',
          datetime: 1655445561,
          account_id: null,
          image: 'https://cdn.click.uz/app/evo/service/payment/transType_712.png',
          card_num: '986016***9330',
          credit: true,
          repeatable: false,
          favorite_permission: false,
          myhome_permission: false,
          receipt: false,
          service_type: 'default',
          cancel_permission: false,
          currency: 'UZS',
          barcode_url: null,
          barcode: {},
          ofd_barcode_data: null,
          data: []
        },
        {
          utrnno: '226078',
          id: 33,
          service_id: null,
          payment_id: 0,
          amount: 945000,
          comission_amount: 0,
          state: 1,
          payment_status: 2,
          payment_status_description: null,
          service_name: 'UNIVERSALBANK TRANSGRANICHN',
          datetime: 1655445561,
          account_id: null,
          image: 'https://cdn.click.uz/app/evo/service/payment/transType_228.png',
          card_num: '986016***9330',
          repeatable: false,
          favorite_permission: false,
          myhome_permission: false,
          receipt: false,
          service_type: 'default',
          cancel_permission: false,
          currency: 'UZS',
          barcode_url: null,
          barcode: {},
          ofd_barcode_data: null,
          data: []
        }
      ],
      [
        {
          date: new Date('2022-06-17T05:59:21.000Z'),
          hold: false,
          merchant: {
            fullTitle: 'UNIVERSALBANK TRANSGRANICHN',
            location: null,
            mcc: null
          },
          movements: [
            {
              account: { id: '19615128' },
              fee: 0,
              id: null,
              invoice: null,
              sum: 945000
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
              sum: -945000
            }
          ],
          comment: null,
          groupKeys: [
            '2022-06-17_UZS_945000'
          ]
        }
      ]
    ]
  ])('converts outer income transaction', (apiTransactions, transactions) => {
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
    expect(convertTransactions(apiTransactions, account)).toEqual(transactions)
  })
})
