import { convertTransaction } from '../../../converters'
import { Account, AccountType } from '../../../../../types/zenmoney'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: 1,
        payment_id: 2272254008,
        service_id: -17,
        amount: 15162.12,
        comission_amount: 150.12,
        state: 1,
        payment_status: 2,
        payment_status_description: null,
        service_name: 'Perevod s karti na kartu',
        datetime: 1673423921,
        account_id: 19615128,
        image: 'https://cdn.click.uz/app/evo/service/payment/-17_v1.png',
        barcode_url: 'https://my.click.uz/clickp2p/9429128639C56025E0B832905934CCC17095C79870E68E7EB11B0A611C8F703F?amount=15012.00',
        card_num: '418780******1337',
        credit: false,
        repeatable: false,
        favorite_permission: false,
        myhome_permission: null,
        receipt: false,
        cancel_permission: false,
        service_type: 'default',
        currency: 'UZS',
        ofd_barcode_data: 'https://ofd.soliq.uz/epi?t=EP000000000026&r=2215055284&c=20230111125842&s=153982345456',
        ofd_available: true,
        barcode: {},
        data:
          [
            { key: 'ФИО отправителя', value: 'TEMUR TEMUROV', main: false },
            {
              key: 'Номер карты получателя',
              value: '860013****1234',
              main: true
            },
            { key: 'ФИО получателя', value: 'SHUXRAT SHUXRATOV', main: false }
          ]
      },
      {
        hold: false,
        date: new Date('2023-01-11T12:58:41+0500'),
        movements:
          [
            {
              id: '2272254008',
              account: { id: '19615128' },
              invoice: null,
              sum: -15012,
              fee: -150.12
            },
            {
              id: null,
              account: {
                type: 'ccard',
                instrument: 'UZS',
                company: null,
                syncIds: ['860013****1234']
              },
              invoice: null,
              sum: 15012,
              fee: 0
            }
          ],
        merchant:
          {
            fullTitle: 'SHUXRAT SHUXRATOV',
            mcc: null,
            location: null
          },
        comment: null,
        groupKeys: [
          '2023-01-11_UZS_15012'
        ]
      }
    ]
  ])('converts inner outcome transfer', (apiTransaction, transaction) => {
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

  it.each([
    [
      {
        id: 6,
        payment_id: 0,
        service_id: null,
        amount: 15012,
        comission_amount: 0,
        state: 1,
        payment_status: 2,
        payment_status_description: null,
        service_name: 'CLICK HUMO 2 UZCARD',
        datetime: 1673423931,
        account_id: null,
        image: 'https://cdn.click.uz/app/evo/service/payment/transType_785.png',
        barcode_url: '',
        card_num: '860013****1234',
        credit: true,
        repeatable: false,
        favorite_permission: false,
        myhome_permission: false,
        receipt: false,
        cancel_permission: false,
        service_type: 'default',
        currency: 'UZS',
        ofd_barcode_data: null,
        ofd_available: false,
        barcode: {},
        data: []
      },
      {
        hold: false,
        date: new Date('2023-01-11T12:58:51+0500'),
        movements:
          [
            {
              id: null,
              account: { id: '22897874' },
              invoice: null,
              sum: 15012,
              fee: 0
            },
            {
              fee: 0,
              invoice: null,
              sum: -15012,
              id: null,
              account: { syncIds: null, type: 'ccard', company: null, instrument: 'UZS' }
            }
          ],
        merchant: {
          fullTitle: 'CLICK HUMO 2 UZCARD',
          mcc: null,
          location: null
        },
        comment: null,
        groupKeys: [
          '2023-01-11_UZS_15012'
        ]
      }
    ]
  ])('converts inner income transfer', (apiTransaction, transaction) => {
    const account: Account = {
      balance: 0,
      id: '22897874',
      instrument: 'UZS',
      savings: false,
      syncIds: [
        '860013****1234'
      ],
      title: 'VISA-карта',
      type: AccountType.ccard
    }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
