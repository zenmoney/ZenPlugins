import { convertAccount, convertTransaction } from './converters'

describe('convertAccount', () => {
  it('converts account', () => {
    expect(convertAccount({
      code: '40702810101280000000',
      bank_code: '044525999'
    })).toEqual({
      id: '40702810101280000000',
      syncID: ['40702810101280000000'],
      title: '40702810101280000000',
      type: 'checking',
      instrument: 'RUB'
    })
  })
})

describe('convertTransaction', () => {
  it('converts transaction', () => {
    expect(convertTransaction({
      'counterparty_account_number': '30232810100500000000',
      'counterparty_bank_bic': '046577768',
      'counterparty_bank_name': 'ООО КБ "КОЛЬЦО УРАЛА"',
      'counterparty_inn': '7706000008',
      'counterparty_kpp': '',
      'counterparty_name': 'ООО "Мир тюленей"',
      'operation_type': '17',
      'payment_amount': '-518',
      'payment_bank_system_id': '1;185705218',
      'payment_charge_date': '01.09.2018',
      'payment_date': '01.09.2018',
      'payment_number': '165993488',
      'payment_purpose': 'Покупка товара "Толстый тюлень"',
      'supplier_bill_id': '',
      'tax_info_document_date': '',
      'tax_info_document_number': '',
      'tax_info_kbk': '',
      'tax_info_okato': '',
      'tax_info_period': '',
      'tax_info_reason_code': '',
      'tax_info_status': '',
      'x_payment_id': '1;185705218;151673353;2'
    }, {
      id: '40702810101280000000',
      syncID: ['40702810101280000000'],
      title: '40702810101280000000',
      type: 'checking'
    })).toEqual({
      comment: 'Покупка товара "Толстый тюлень"',
      date: '01.09.2018',
      id: '1;185705218',
      income: 0,
      incomeAccount: '40702810101280000000',
      outcome: 518,
      outcomeAccount: '40702810101280000000',
      payee: 'ООО "Мир тюленей"'
    })
  })
})
