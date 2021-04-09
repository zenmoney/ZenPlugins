import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      [
        {
          id: '3',
          payment_id: '123456',
          utrnno: '086436',
          amount: '11 000',
          cntrg_info_param2: '111222333',
          cntrg_info_param3: '123456****7890',
          cntrg_info_param4: null,
          cntrg_info_param5: null,
          status_note: 'Успешно проведен',
          state: 2,
          paydoc_state: 2,
          service_name: 'Пополнение кошелька',
          created: '2021-01-28 22:06:04',
          created_timestamp: 1611871564,
          abs_type: 'SMARTV ',
          account_id: 22222222,
          error: null,
          service_id: -6,
          is_invoice: 0,
          parameter_name: 'Номер карты',
          parameter_id: 512,
          comission_amount: 0,
          image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_-6.png',
          is_indoor: 0,
          qr_image: null,
          qr_header: null,
          qr_footer: null,
          nds: 0,
          card_num: null,
          credit: 0,
          transType: 683,
          transType_desc: 'Онлайн оплата/перевод',
          card_sender: 'IVAN IVANOV',
          bank_sender: '049',
          card_recipient: '',
          bank_recipient: '880'
        },
        {
          id: '4',
          payment_id: '123456',
          utrnno: '086436',
          amount: '11 000',
          cntrg_info_param2: '111222333',
          cntrg_info_param3: '123456****7890',
          cntrg_info_param4: null,
          cntrg_info_param5: null,
          status_note: 'Успешно проведен',
          state: 2,
          paydoc_state: 2,
          service_name: 'Пополнение кошелька',
          created: '2021-01-28 22:06:04',
          created_timestamp: 1611871564,
          abs_type: 'SMARTV ',
          account_id: 22222222,
          error: null,
          service_id: -6,
          is_invoice: 0,
          parameter_name: 'Номер карты',
          parameter_id: 512,
          comission_amount: 0,
          image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_-6.png',
          is_indoor: 0,
          qr_image: null,
          qr_header: null,
          qr_footer: null,
          nds: 0,
          card_num: null,
          credit: 1,
          transType: 760,
          transType_desc: 'Зачисление на карту',
          card_sender: 'IVAN IVANOV',
          bank_sender: '049',
          card_recipient: '',
          bank_recipient: '880'
        }
      ],
      {
        date: new Date('2021-01-28 22:06:04'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: '123456',
            account: {
              id: '22222222'
            },
            invoice: null,
            sum: -11000,
            fee: 0
          },
          {
            id: '123456',
            account: {
              id: '11111111'
            },
            invoice: null,
            sum: 11000,
            fee: 0
          }
        ],
        comment: 'Пополнение кошелька'
      }
    ],
    [
      [
        {
          id: '19',
          payment_id: '555666777',
          utrnno: '777333777',
          amount: '200 000',
          cntrg_info_param2: '111222333',
          cntrg_info_param3: '123456****7890',
          cntrg_info_param4: null,
          cntrg_info_param5: null,
          status_note: 'Успешно проведен',
          state: 2,
          paydoc_state: 2,
          service_name: 'Пополнение кошелька',
          created: '2021-01-23 19:21:48',
          created_timestamp: 1611429708,
          abs_type: 'SMARTV ',
          account_id: 22222222,
          error: null,
          service_id: -6,
          is_invoice: 0,
          parameter_name: 'Номер карты',
          parameter_id: 512,
          comission_amount: 0,
          image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_-6.png',
          is_indoor: 0,
          qr_image: null,
          qr_header: null,
          qr_footer: null,
          nds: 0,
          card_num: null,
          credit: 1,
          transType: 760,
          transType_desc: 'Зачисление на карту',
          card_sender: 'IVAN IVANOV',
          bank_sender: '049',
          card_recipient: '',
          bank_recipient: '880'
        },
        {
          id: '20',
          payment_id: '555666777',
          utrnno: '777333777',
          amount: '200 000',
          cntrg_info_param2: '111222333',
          cntrg_info_param3: '123456****7890',
          cntrg_info_param4: null,
          cntrg_info_param5: null,
          status_note: 'Успешно проведен',
          state: 2,
          paydoc_state: 2,
          service_name: 'Пополнение кошелька',
          created: '2021-01-23 19:21:48',
          created_timestamp: 1611429708,
          abs_type: 'SMARTV ',
          account_id: 22222222,
          error: null,
          service_id: -6,
          is_invoice: 0,
          parameter_name: 'Номер карты',
          parameter_id: 512,
          comission_amount: 0,
          image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_-6.png',
          is_indoor: 0,
          qr_image: null,
          qr_header: null,
          qr_footer: null,
          nds: 0,
          card_num: null,
          credit: 0,
          transType: 683,
          transType_desc: 'Онлайн оплата/перевод',
          card_sender: 'IVAN IVANOV',
          bank_sender: '049',
          card_recipient: '',
          bank_recipient: '880'
        }
      ],
      {
        date: new Date('2021-01-23 19:21:48'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: '555666777',
            account: {
              id: '22222222'
            },
            invoice: null,
            sum: -200000,
            fee: 0
          },
          {
            id: '555666777',
            account: {
              id: '11111111'
            },
            invoice: null,
            sum: 200000,
            fee: 0
          }
        ],
        comment: 'Пополнение кошелька'
      }
    ]
  ])('should convert inner transfer', (apiTransaction, transaction) => {
    const accounts = [
      {
        id: '11111111',
        title: 'Кошелек',
        syncIds: ['123456******7890'],
        instrument: 'UZS',
        type: 'checking',
        balance: 2476.352
      },
      {
        id: '22222222',
        title: 'UzCard Индивидуальная',
        syncIds: ['987654******3210'],
        instrument: 'UZS',
        type: 'ccard',
        balance: 196303.52
      }
    ]
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })

  it.each([
    [
      [
        {
          id: '8',
          payment_id: '1368681366',
          utrnno: '10858551361',
          amount: '1 500',
          cntrg_info_param2: '998909574797',
          cntrg_info_param3: '986016****0404',
          cntrg_info_param4: null,
          cntrg_info_param5: null,
          status_note: 'Успешно проведен',
          state: 2,
          paydoc_state: 2,
          service_name: 'Perevod s karti na kartu',
          created: '2021-03-25 13:28:07',
          created_timestamp: 1616678887,
          abs_type: 'SMARTV ',
          account_id: 13784038,
          error: null,
          service_id: -16,
          is_invoice: 0,
          parameter_name: 'Номер карты',
          parameter_id: 512,
          comission_amount: 15,
          image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_-16.png',
          is_indoor: 0,
          qr_image: null,
          qr_header: null,
          qr_footer: null,
          nds: 0,
          card_num: null,
          credit: 1,
          transType: 760,
          transType_desc: 'Зачисление на карту',
          card_sender: 'STAVROPULOS SERGEY',
          bank_sender: '012',
          card_recipient: 'SERGEY STAVROPULOS',
          bank_recipient: '012'
        },
        {
          id: '9',
          payment_id: '1368681366',
          utrnno: '10858551361',
          amount: '1 515',
          cntrg_info_param2: '998909574797',
          cntrg_info_param3: '986016****0404',
          cntrg_info_param4: null,
          cntrg_info_param5: null,
          status_note: 'Успешно проведен',
          state: 2,
          paydoc_state: 2,
          service_name: 'Perevod s karti na kartu',
          created: '2021-03-25 13:28:07',
          created_timestamp: 1616678887,
          abs_type: 'SMARTV ',
          account_id: 13784038,
          error: null,
          service_id: -16,
          is_invoice: 0,
          parameter_name: 'Номер карты',
          parameter_id: 512,
          comission_amount: 15,
          image: 'https://cdn.click.uz/app/rev2/service/300x230/logo_-16.png',
          is_indoor: 0,
          qr_image: null,
          qr_header: null,
          qr_footer: null,
          nds: 0,
          card_num: null,
          credit: 0,
          transType: 683,
          transType_desc: 'Онлайн оплата/перевод',
          card_sender: 'STAVROPULOS SERGEY',
          bank_sender: '012',
          card_recipient: 'SERGEY STAVROPULOS',
          bank_recipient: '012'
        }
      ],
      {
        date: new Date('2021-03-25 13:28:07'),
        hold: false,
        merchant: null,
        comment: 'Perevod s karti na kartu',
        movements:
          [
            {
              id: '1368681366',
              account: { id: '13784038' },
              invoice: null,
              sum: -1515,
              fee: 0
            },
            {
              id: '1368681366',
              account: { id: '17741528' },
              invoice: null,
              sum: 1500,
              fee: 0
            }
          ]
      }
    ]
  ])('should convert inner transfer', (apiTransaction, transaction) => {
    const accounts = [
      {
        id: '17741528',
        title: 'Карта HUMO',
        syncIds: ['986016******0404'],
        instrument: 'UZS',
        type: 'ccard',
        balance: 885.31
      },
      {
        id: '13784038',
        title: 'Карта UZCARD-Online',
        syncIds: ['860012******5016'],
        instrument: 'UZS',
        type: 'ccard',
        balance: 665.67
      },
      {
        id: '11111111',
        title: 'Кошелек',
        syncIds: ['123456******7890'],
        instrument: 'UZS',
        type: 'checking',
        balance: 2476.352
      },
      {
        id: '22222222',
        title: 'UzCard Индивидуальная',
        syncIds: ['987654******3210'],
        instrument: 'UZS',
        type: 'ccard',
        balance: 196303.52
      }
    ]
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
