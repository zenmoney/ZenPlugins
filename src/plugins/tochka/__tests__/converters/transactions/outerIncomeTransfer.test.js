import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        counterparty_account_number: '30233810000270008324',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'Точка ПАО Банка "ФК Открытие", Москва',
        counterparty_inn: '7706092528',
        counterparty_kpp: '',
        counterparty_name: 'ПАО БАНК "ФК ОТКРЫТИЕ"',
        operation_type: '17',
        payment_amount: '75000',
        payment_bank_system_id: '1;441815447',
        payment_charge_date: '13.09.2019',
        payment_date: '13.09.2019',
        payment_number: 'V648313563',
        payment_purpose: 'Поступление денежных средств(Терминал:TOCHKA Card2Card >,MOSCOW,RU,дата операции:13/09/2019 08:14,на сумму:75000 RUB,карта 553691******8123)\n',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;441815447;335046542;1'
      },
      {
        hold: false,
        date: new Date('2019-09-13T08:14:00+03:00'),
        movements: [
          {
            id: '1;441815447',
            account: { id: 'account' },
            invoice: null,
            sum: 75000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -75000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
