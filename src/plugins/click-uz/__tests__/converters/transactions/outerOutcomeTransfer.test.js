import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: '8',
        payment_id: '9999999999',
        utrnno: '5468258',
        amount: '2 131 100',
        cntrg_info_param2: '860012****9840',
        cntrg_info_param3: '860012****9840',
        cntrg_info_param4: null,
        cntrg_info_param5: null,
        status_note: 'Успешно проведен',
        state: 2,
        paydoc_state: 2,
        service_name: 'Перевод с карты на карту',
        created: '2021-01-22 17:08:27',
        created_timestamp: 1611335307,
        abs_type: 'SMARTV ',
        account_id: 19876543,
        error: null,
        service_id: -4,
        is_invoice: 0,
        parameter_name: 'Номер карты',
        parameter_id: 512,
        comission_amount: 21100,
        image: 'https://cdn.click.uz/app/rev2/service/300x230/p2p_debit.png',
        is_indoor: 0,
        qr_image: null,
        qr_header: null,
        qr_footer: null,
        nds: null,
        card_num: null,
        credit: 0,
        transType: 683,
        transType_desc: 'Онлайн оплата/перевод',
        card_sender: 'ELENA MOROZOVA',
        bank_sender: '003',
        card_recipient: 'SOTVOLDIEV ELDOR',
        bank_recipient: '012'
      },
      {
        date: new Date('2021-01-22 17:08:27'),
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'ELENA MOROZOVA',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '9999999999',
            account: {
              id: '19876543'
            },
            invoice: null,
            sum: -2131100,
            fee: -21100
          },
          {
            id: null,
            account: {
              instrument: 'UZS',
              company: null,
              syncIds: null,
              type: 'ccard'
            },
            invoice: null,
            sum: 2131100,
            fee: 0
          }
        ],
        comment: 'Перевод с карты на карту'
      }
    ],
    [
      {
        id: '6',
        payment_id: '8888888888',
        utrnno: '345345345',
        amount: '4 040 000',
        cntrg_info_param2: '777777****3333',
        cntrg_info_param3: '777777****3333',
        cntrg_info_param4: null,
        cntrg_info_param5: null,
        status_note: 'Успешно проведен',
        state: 2,
        paydoc_state: 2,
        service_name: 'Перевод с карты на карту',
        created: '2021-01-25 19:06:36',
        created_timestamp: 1611601596,
        abs_type: 'SMARTV ',
        account_id: 19876543,
        error: null,
        service_id: -4,
        is_invoice: 0,
        parameter_name: 'Номер карты',
        parameter_id: 512,
        comission_amount: 40000,
        image: 'https://cdn.click.uz/app/rev2/service/300x230/p2p_debit.png',
        is_indoor: 0,
        qr_image: null,
        qr_header: null,
        qr_footer: null,
        nds: null,
        card_num: null,
        credit: 0,
        transType: 683,
        transType_desc: 'Онлайн оплата/перевод',
        card_sender: 'ELENA MOROZOVA',
        bank_sender: '003',
        card_recipient: 'PETR SIDOROV',
        bank_recipient: '033'
      },
      {
        date: new Date('2021-01-25 19:06:36'),
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'ELENA MOROZOVA',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '8888888888',
            account: {
              id: '19876543'
            },
            invoice: null,
            sum: -4040000,
            fee: -40000
          },
          {
            id: null,
            account: {
              instrument: 'UZS',
              company: null,
              syncIds: null,
              type: 'ccard'
            },
            invoice: null,
            sum: 4040000,
            fee: 0
          }
        ],
        comment: 'Перевод с карты на карту'
      }
    ]
  ])('converts outer outcome transaction with unknown account_id', (apiTransaction, transaction) => {
    const accounts = [
      {
        id: '19876543',
        title: 'Карта UZCARD-Online',
        syncIds: [
          '555555******4444'
        ],
        instrument: 'UZS',
        type: 'ccard',
        balance: 39953.92
      },
      {
        id: '00000000',
        title: 'Виртуальный счет',
        syncIds: [
          '000000******0000'
        ],
        instrument: 'UZS',
        type: 'checking',
        balance: 50291.6
      }
    ]
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
