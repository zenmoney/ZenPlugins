import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        counterparty_account_number: '30232810210050005052',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'ТОЧКА ПАО БАНКА "ФК ОТКРЫТИЕ"',
        counterparty_inn: '7706092528',
        counterparty_kpp: '770543002',
        counterparty_name: 'Точка ПАО Банка "ФК Открытие"',
        operation_type: '17',
        payment_amount: '760.33',
        payment_bank_system_id: '883608264;1',
        payment_charge_date: '29.09.2021',
        payment_date: '29.09.2021',
        payment_number: '622646689',
        payment_purpose: 'Возврат по опротестованию операции(Терминал:RNAZS Yandex.Fuel.,дата операции:12/07/2021 10:24,на сумму:760.33 ,карта 5140********5560)',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '883608264;1'
      },
      {
        hold: false,
        date: new Date('2021-07-12T07:24:00.000Z'),
        movements: [
          {
            id: '883608264;1',
            account: { id: 'account' },
            fee: 0,
            invoice: null,
            sum: 760.33
          }
        ],
        merchant: {
          fullTitle: 'RNAZS Yandex.Fuel.',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts income transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
