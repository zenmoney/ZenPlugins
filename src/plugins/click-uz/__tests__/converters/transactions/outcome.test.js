import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: '10',
        payment_id: '4444444444',
        utrnno: '564645645',
        amount: '50 000',
        cntrg_info_param2: '5555555555',
        cntrg_info_param3: null,
        cntrg_info_param4: null,
        cntrg_info_param5: null,
        status_note: 'Успешно проведен',
        state: 2,
        paydoc_state: 2,
        service_name: 'Билайн',
        created: '2021-01-22 06:52:14',
        created_timestamp: 1611298334,
        abs_type: 'SMARTV ',
        account_id: 12345678,
        error: null,
        service_id: 3,
        is_invoice: 0,
        parameter_name: 'Номер телефона',
        parameter_id: 1,
        comission_amount: 0,
        image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_3.png',
        is_indoor: 0,
        qr_image: null,
        qr_header: null,
        qr_footer: null,
        nds: null,
        card_num: null,
        credit: 0,
        transType: 683,
        transType_desc: 'Онлайн оплата/перевод',
        card_sender: null,
        bank_sender: null,
        card_recipient: null,
        bank_recipient: null
      },
      {
        date: new Date('2021-01-22 06:52:14'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: '4444444444',
            account: {
              id: '12345678'
            },
            invoice: null,
            sum: -50000,
            fee: 0
          }
        ],
        comment: 'Билайн'
      }
    ],
    [
      {
        id: '4',
        payment_id: '3333333333',
        utrnno: '10411205293',
        amount: '20 000',
        cntrg_info_param2: '5555555555',
        cntrg_info_param3: null,
        cntrg_info_param4: null,
        cntrg_info_param5: null,
        status_note: 'Успешно проведен',
        state: 2,
        paydoc_state: 2,
        service_name: 'Билайн',
        created: '2021-01-28 10:16:50',
        created_timestamp: 1611829010,
        abs_type: 'SMARTV ',
        account_id: 12345678,
        error: null,
        service_id: 3,
        is_invoice: 0,
        parameter_name: 'Номер телефона',
        parameter_id: 1,
        comission_amount: 0,
        image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_3.png',
        is_indoor: 0,
        qr_image: null,
        qr_header: null,
        qr_footer: null,
        nds: null,
        card_num: null,
        credit: 0,
        transType: 683,
        transType_desc: 'Онлайн оплата/перевод',
        card_sender: null,
        bank_sender: null,
        card_recipient: null,
        bank_recipient: null
      },
      {
        date: new Date('2021-01-28 10:16:50'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: '3333333333',
            account: {
              id: '12345678'
            },
            invoice: null,
            sum: -20000,
            fee: 0
          }
        ],
        comment: 'Билайн'
      }
    ],
    [
      {
        id: '2',
        payment_id: '2222222222',
        utrnno: '10000009',
        amount: '20 000',
        cntrg_info_param2: '132875',
        cntrg_info_param3: null,
        cntrg_info_param4: null,
        cntrg_info_param5: null,
        status_note: 'Успешно проведен',
        state: 2,
        paydoc_state: 2,
        service_name: 'UzdigitalTV',
        created: '2021-01-28 10:17:15',
        created_timestamp: 1611829035,
        abs_type: 'SMARTV ',
        account_id: 12345678,
        error: null,
        service_id: 28,
        is_invoice: 0,
        parameter_name: 'ID абонента',
        parameter_id: 4,
        comission_amount: 0,
        image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_28.png',
        is_indoor: 0,
        qr_image: null,
        qr_header: null,
        qr_footer: null,
        nds: null,
        card_num: null,
        credit: 0,
        transType: 683,
        transType_desc: 'Онлайн оплата/перевод',
        card_sender: null,
        bank_sender: null,
        card_recipient: null,
        bank_recipient: null
      },
      {
        date: new Date('2021-01-28 10:17:15'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: '2222222222',
            account: {
              id: '12345678'
            },
            invoice: null,
            sum: -20000,
            fee: 0
          }
        ],
        comment: 'UzdigitalTV'
      }
    ]
  ])('converts outer outcome transactions', (apiTransaction, transaction) => {
    const accounts = [
      {
        id: '12345678',
        title: 'Карта UZCARD-Online',
        syncIds: [
          '000000******0000'
        ],
        instrument: 'UZS',
        type: 'ccard',
        balance: 39953.92
      },
      {
        id: '11111111',
        title: 'Карта UZCARD-Online',
        syncIds: [
          '111111******1111'
        ],
        instrument: 'UZS',
        type: 'ccard',
        balance: 1140
      }
    ]
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
