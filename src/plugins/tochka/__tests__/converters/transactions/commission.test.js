import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        counterparty_account_number: '70601810400272740305',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'Точка ПАО Банка "ФК Открытие", Москва',
        counterparty_inn: '7706092528',
        counterparty_kpp: '770543002',
        counterparty_name: 'Филиал Точка Публичного акционерного общества Банка "Финансовая Корпорация Открытие"',
        operation_type: '17',
        payment_amount: '-60',
        payment_bank_system_id: '1;445305694',
        payment_charge_date: '20.09.2019',
        payment_date: '20.09.2019',
        payment_number: '32550',
        payment_purpose: 'Комиссия за перевод по документу №9 от 20.09.2019, согласно Правилам банковского обслуживания. НДС не предусмотрен ТП Золотая середина\n\n',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;445305694;337202452;2'
      },
      {
        hold: false,
        date: new Date('2019-09-20T00:00:00+03:00'),
        movements: [
          {
            id: '1;445305694',
            account: { id: 'account' },
            invoice: null,
            sum: -60,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Комиссия за перевод по документу №9 от 20.09.2019, согласно Правилам банковского обслуживания. НДС не предусмотрен ТП Золотая середина'
      }
    ]
  ])('converts commission', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
