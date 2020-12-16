import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        counterparty_account_number: '40802840701500007923',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'Точка ПАО Банка "ФК Открытие", Москва',
        counterparty_inn: '166024526820',
        counterparty_kpp: '',
        counterparty_name: 'Индивидуальный предприниматель Николаев Николай Николаевич',
        operation_type: '17',
        payment_amount: '1500',
        payment_bank_system_id: '1;424819854',
        payment_charge_date: '07.08.2019',
        payment_date: '07.08.2019',
        payment_number: '5',
        payment_purpose: 'Перевод средств с транзитного валютного счета на текущий валютный счет, согласно распоряжению №5 от 07.08.2019. НДС не предусмотрен.',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;424819854;324473934;1'
      },
      {
        hold: false,
        date: new Date('2019-08-07T00:00:00+03:00'),
        movements: [
          {
            id: '1;424819854',
            account: { id: 'account' },
            invoice: null,
            sum: 1500,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '1;424819854'
        ]
      }
    ],
    [
      {
        counterparty_account_number: '40802840401500000337',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'Точка ПАО Банка "ФК Открытие", Москва',
        counterparty_inn: '166024526820',
        counterparty_kpp: '',
        counterparty_name: 'Индивидуальный предприниматель Николаев Николай Николаевич',
        operation_type: '9',
        payment_amount: '84838',
        payment_bank_system_id: '1;424959237',
        payment_charge_date: '07.08.2019',
        payment_date: '07.08.2019',
        payment_number: '424959237',
        payment_purpose: 'Продажа USD за RUB по курсу 65.26 RUB за 1 USD. НДС не предусмотрен.',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;424959237;324558158;1'
      },
      {
        hold: false,
        date: new Date('2019-08-07T00:00:00+03:00'),
        movements: [
          {
            id: '1;424959237',
            account: { id: 'account' },
            invoice: null,
            sum: 84838,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '1;424959237'
        ]
      }
    ],
    [
      {
        counterparty_account_number: '40802810909500009598',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'ТОЧКА ПАО БАНКА "ФК ОТКРЫТИЕ"',
        counterparty_inn: '271700857932',
        counterparty_kpp: '',
        counterparty_name: 'Индивидуальный предприниматель Николаев Николай Николаевич',
        operation_type: '1',
        payment_amount: '4080.00',
        payment_bank_system_id: '642256285;1',
        payment_charge_date: '19.10.2020',
        payment_date: '19.10.2020',
        payment_number: '1',
        payment_purpose: 'Перевод средств в счёт накоплений на оплату налогов без НДС',
        supplier_bill_id: '0',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '642256285;1'
      },
      {
        hold: false,
        date: new Date('2020-10-19T00:00:00+03:00'),
        movements: [
          {
            id: '642256285;1',
            account: { id: 'account' },
            invoice: null,
            sum: 4080,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '642256285;1'
        ]
      }
    ],
    [
      {
        counterparty_account_number: '40802810909500009598',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'ТОЧКА ПАО БАНКА "ФК ОТКРЫТИЕ"',
        counterparty_inn: '271700857932',
        counterparty_kpp: '',
        counterparty_name: 'Индивидуальный предприниматель Николаев Николай Николаевич',
        operation_type: '1',
        payment_amount: '26.00',
        payment_bank_system_id: '645472428;1',
        payment_charge_date: '24.10.2020',
        payment_date: '24.10.2020',
        payment_number: '96777',
        payment_purpose: 'Перевод средств на сейф-счёт без НДС',
        supplier_bill_id: '0',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '645472428;1'
      },
      {
        hold: false,
        date: new Date('2020-10-24T00:00:00+03:00'),
        movements: [
          {
            id: '645472428;1',
            account: { id: 'account' },
            invoice: null,
            sum: 26,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '645472428;1'
        ]
      }
    ]
  ])('converts inner income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
