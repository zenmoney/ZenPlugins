import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
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
        }
      ],
      {
        date: new Date('2021-01-22 06:52:14'),
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'Билайн',
          mcc: null,
          location: null
        },
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
        ]
      }
    ],
    [
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
        }
      ],
      {
        date: new Date('2021-01-28 10:16:50'),
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'Билайн',
          mcc: null,
          location: null
        },
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
        ]
      }
    ],
    [
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
        }
      ],
      {
        date: new Date('2021-01-28 10:17:15'),
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'UzdigitalTV',
          mcc: null,
          location: null
        },
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
        ]
      }
    ],
    [
      [
        {
          id: '27',
          payment_id: '222333444',
          utrnno: '0',
          amount: '21',
          cntrg_info_param2: '111111111',
          cntrg_info_param3: '123123******1234',
          cntrg_info_param4: null,
          cntrg_info_param5: null,
          status_note: 'Успешно проведен',
          state: 2,
          paydoc_state: 2,
          service_name: 'CASHBACK',
          created: '2021-01-28 22:11:12',
          created_timestamp: 1611871872,
          abs_type: 'MDEPOSIT',
          account_id: 11111111,
          error: null,
          service_id: -9,
          is_invoice: 0,
          parameter_name: null,
          parameter_id: 0,
          comission_amount: 0,
          image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_-9.png',
          is_indoor: 0,
          qr_image: null,
          qr_header: null,
          qr_footer: null,
          nds: 0,
          card_num: null,
          credit: 1,
          transType: 760,
          transType_desc: 'Зачисление на карту',
          card_sender: null,
          bank_sender: '880',
          card_recipient: null,
          bank_recipient: '880'
        }
      ],
      {
        date: new Date('2021-01-28 22:11:12'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '11111111'
            },
            fee: 0,
            id: '222333444',
            invoice: null,
            sum: 21
          }
        ],
        comment: 'CASHBACK'
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

  it.each([
    [
      [
        {
          id: '2',
          payment_id: '1525527100',
          utrnno: '0',
          amount: '12 805.54',
          cntrg_info_param2: '22871943796644',
          cntrg_info_param3: null,
          cntrg_info_param4: null,
          cntrg_info_param5: null,
          status_note: 'Успешно проведен',
          state: 2,
          paydoc_state: 2,
          service_name: 'Агентство государственных услуг',
          created: '2021-08-20 19:31:18',
          created_timestamp: 1629487878,
          abs_type: 'HUMO ',
          account_id: 22222222,
          error: null,
          service_id: 13188,
          is_invoice: 0,
          parameter_name: null,
          parameter_id: 0,
          comission_amount: 126.79,
          image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_13188.png',
          is_indoor: 0,
          qr_image: null,
          qr_header: null,
          qr_footer: null,
          nds: 0,
          card_num: null,
          credit: 0,
          transType: 683,
          transType_desc: 'Онлайн оплата/перевод',
          card_sender: null,
          bank_sender: null,
          card_recipient: null,
          bank_recipient: null
        }
      ],
      {
        date: new Date('2021-08-20 19:31:18'),
        hold: false,
        merchant:
          {
            country: null,
            city: null,
            title: 'Агентство государственных услуг',
            mcc: null,
            location: null
          },
        movements:
          [
            {
              id: '1525527100',
              account: { id: '22222222' },
              invoice: null,
              sum: -12678.75,
              fee: -126.79
            }
          ]
      }
    ]
  ])('converts outer outcome transactions', (apiTransaction, transaction) => {
    const accounts1 = [
      {
        id: '22222222',
        title: 'Карта HUMO',
        syncIds: ['222222******2222'],
        instrument: 'UZS',
        type: 'ccard',
        balance: 87000
      }
    ]
    expect(convertTransaction(apiTransaction, accounts1)).toEqual(transaction)
  })
})
