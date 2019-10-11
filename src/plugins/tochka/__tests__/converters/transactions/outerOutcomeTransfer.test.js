import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        counterparty_account_number: '40817810401003017891',
        counterparty_bank_bic: '044525700',
        counterparty_bank_name: 'АО "РАЙФФАЙЗЕНБАНК", Москва',
        counterparty_inn: '',
        counterparty_kpp: '',
        counterparty_name: 'Николаев Николай Николаевич',
        operation_type: '1',
        payment_amount: '-100000',
        payment_bank_system_id: '1;418587809',
        payment_charge_date: '24.07.2019',
        payment_date: '24.07.2019',
        payment_number: '3',
        payment_purpose: 'Перевод собственных средств. НДС не облагается',
        supplier_bill_id: '0',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;418587809;320615663;2'
      },
      {
        hold: false,
        date: new Date('2019-07-24T00:00:00+03:00'),
        movements: [
          {
            id: '1;418587809',
            account: { id: 'account' },
            invoice: null,
            sum: -100000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 100000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Николаев Николай Николаевич',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
