import { convertTransaction } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      {
        id: '1',
        payment_id: '1111111111',
        utrnno: '444444444',
        amount: '450 000',
        cntrg_info_param2: '123456****1463',
        cntrg_info_param3: '123456****1463',
        cntrg_info_param4: null,
        cntrg_info_param5: null,
        status_note: 'Успешно проведен',
        state: 2,
        paydoc_state: 2,
        service_name: 'Перевод с карты на карту',
        created: '2020-12-31 14:17:57',
        created_timestamp: 1609424277,
        abs_type: 'SMARTV ',
        account_id: 123456,
        error: null,
        service_id: -4,
        is_invoice: 0,
        parameter_name: 'Номер карты',
        parameter_id: 512,
        comission_amount: 4500,
        image: 'https://cdn.click.uz/app/rev2/service/300x230/p2p_credit.png',
        is_indoor: 0,
        qr_image: null,
        qr_header: null,
        qr_footer: null,
        nds: null,
        card_num: null,
        credit: 1,
        transType: 760,
        transType_desc: 'Зачисление на карту',
        card_sender: 'ALEXEY IVANOV',
        bank_sender: '055',
        card_recipient: 'IVAN PETROV',
        bank_recipient: '013'
      },
      [
        {
          id: '98765432',
          type: 'ccard',
          title: 'Карта UZCARD-Online',
          instrument: 'UZS',
          syncIds: [
            '123456******1463'
          ],
          balance: 65987.15
        }
      ],
      {
        date: new Date('2020-12-31T14:17:57.000Z'),
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'ALEXEY IVANOV',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '1111111111',
            account: {
              id: '98765432'
            },
            invoice: null,
            sum: 450000,
            fee: 0
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
            sum: -450000,
            fee: -4500
          }
        ],
        comment: 'Зачисление на карту'
      }
    ]
  ])('converts outer income transaction with unknown account_id', (apiTransaction, accounts, transaction) => {
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
