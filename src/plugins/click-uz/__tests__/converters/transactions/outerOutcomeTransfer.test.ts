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
        data: [
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
        movements: [
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
        merchant: {
          fullTitle: 'ANNA ANNOVNA',
          mcc: null,
          location: null
        },
        comment: null,
        groupKeys: [
          '2022-12-29_UZS_118000'
        ]
      }
    ],
    [
      {
        id: 41,
        payment_id: 2390519748,
        service_id: -16,
        amount: 34996.5,
        comission_amount: 346.5,
        state: 1,
        payment_status: 2,
        payment_status_description: null,
        service_name: 'Perevod s karti na kartu',
        datetime: 1678527090,
        account_id: 22897874,
        image: 'https://cdn.click.uz/app/evo/service/payment/-16_v1.png',
        barcode_url: 'https://my.click.uz/clickp2p/5D88C9E4CD0D9EA7C78CF63D99BFD409CDF9FDD234200D728EF923E9AE2A6C9F?amount=34650.00',
        card_num: '860031******4813',
        credit: false,
        repeatable: false,
        favorite_permission: false,
        myhome_permission: null,
        receipt: false,
        cancel_permission: false,
        service_type: 'default',
        currency: 'UZS',
        ofd_barcode_data: 'https://ofd.soliq.uz/epi?t=EP000000000026&r=2287504415&c=20230311143131&s=179950080360',
        ofd_available: true,
        barcode: {},
        data: [
          { key: 'ФИО отправителя', value: 'TEMUR TEMUROV', main: false },
          { key: 'Карта получателя', value: '986016****8301', main: true },
          { key: 'ФИО получателя', value: 'SHUXRAT SHUXRATOV', main: false }
        ]
      },
      {
        date: new Date('2023-03-11T09:31:30.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'SHUXRAT SHUXRATOV',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '19615128' },
            fee: -346.5,
            id: '2390519748',
            invoice: null,
            sum: -34650
          },
          {
            account: {
              company: null,
              instrument: 'UZS',
              syncIds: [
                '986016****8301'
              ],
              type: 'ccard'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 34650
          }
        ],
        comment: null,
        groupKeys: [
          '2023-03-11_UZS_34650'
        ]
      }
    ],
    [
      {
        id: 10,
        payment_id: 2451446647,
        service_id: -4,
        amount: 25250,
        comission_amount: 250,
        state: 1,
        payment_status: 2,
        payment_status_description: null,
        service_name: 'Перевод с карты на карту',
        datetime: 1681373646,
        account_id: 31465112,
        image: 'https://cdn.click.uz/app/evo/service/payment/-4_v2.png',
        barcode_url: 'https://my.click.uz/clickp2p/37512DD7BD118B86D6F373AB2026320417299D776AE44B95B7BEACD1CB88278A?amount=25000.00',
        card_num: '860051******5696',
        credit: false,
        repeatable: false,
        favorite_permission: false,
        myhome_permission: null,
        receipt: false,
        cancel_permission: false,
        service_type: 'default',
        currency: 'UZS',
        ofd_barcode_data: 'https://ofd.soliq.uz/epi?t=EP000000000026&r=2324924277&c=20230413131406&s=340119855300',
        ofd_available: true,
        barcode: {},
        data: [
          {
            key: 'ФИО отправителя',
            value: 'TEMUR TEMUROV',
            main: false
          },
          { key: 'Карта получателя', value: '860053****3096', main: true },
          {
            key: 'ФИО получателя',
            value: 'SHUXRAT SHUXRATOV',
            main: false
          }
        ]
      },
      {
        date: new Date('2023-04-13T08:14:06.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'SHUXRAT SHUXRATOV',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '19615128' },
            fee: -250,
            id: '2451446647',
            invoice: null,
            sum: -25000
          },
          {
            account: {
              company: null,
              instrument: 'UZS',
              syncIds: [
                '860053****3096'
              ],
              type: 'ccard'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 25000
          }
        ],
        comment: null,
        groupKeys: [
          '2023-04-13_UZS_25000'
        ]
      }
    ],
    [
      {
        id: 3,
        payment_id: 2685298881,
        service_id: -31,
        amount: 216200,
        comission_amount: 0,
        state: 1,
        payment_status: 2,
        payment_status_description: null,
        service_name: 'Perevod s karti na kartu',
        datetime: 1692289720,
        account_id: 21002931,
        image: 'https://cdn.click.uz/app/evo/service/payment/-31_v1.png',
        barcode_url: 'https://my.click.uz/clickp2p/4E52655376CD95181F4348140AEA4668597C53230EADDC80223686BE19617F6D?amount=216200.00',
        card_num: '986003******2400',
        credit: false,
        repeatable: false,
        favorite_permission: false,
        myhome_permission: null,
        receipt: false,
        cancel_permission: false,
        service_type: 'default',
        currency: 'UZS',
        ofd_barcode_data: null,
        ofd_available: true,
        barcode: {},
        data:
          [
            {
              key: 'ФИО отправителя',
              value: 'NIKOLAY NIKOLAEV',
              main: false
            },
            { key: 'ФИО получателя', value: 'ANTONOV ANTON', main: false }
          ]
      },
      {
        date: new Date('2023-08-17T16:28:40.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'ANTONOV ANTON',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '19615128' },
            fee: 0,
            id: '2685298881',
            invoice: null,
            sum: -216200
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
            sum: 216200
          }
        ],
        comment: null,
        groupKeys: [
          '2023-08-17_UZS_216200'
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
