import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        counterparty_account_number: '30232810100500000000',
        counterparty_bank_bic: '046577768',
        counterparty_bank_name: 'ООО КБ "КОЛЬЦО УРАЛА"',
        counterparty_inn: '7706000008',
        counterparty_kpp: '',
        counterparty_name: 'ООО "Мир тюленей"',
        operation_type: '17',
        payment_amount: '-518',
        payment_bank_system_id: '1;185705218',
        payment_charge_date: '01.09.2018',
        payment_date: '01.09.2018',
        payment_number: '165993488',
        payment_purpose: 'Покупка товара "Толстый тюлень"',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;185705218;151673353;2'
      },
      {
        hold: false,
        date: new Date('2018-09-01T00:00:00+03:00'),
        movements: [
          {
            id: '1;185705218',
            account: { id: 'account' },
            invoice: null,
            sum: -518,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'ООО "Мир тюленей"',
          mcc: null,
          location: null
        },
        comment: 'Покупка товара "Толстый тюлень"'
      }
    ],
    [
      {
        counterparty_account_number: '40817810800003406823',
        counterparty_bank_bic: '044525974',
        counterparty_bank_name: 'АО "ТИНЬКОФФ БАНК", Москва',
        counterparty_inn: '781019770703',
        counterparty_kpp: '',
        counterparty_name: 'Николаев Николай Николаевич',
        operation_type: '1',
        payment_amount: '-50000',
        payment_bank_system_id: '1;445305684',
        payment_charge_date: '20.09.2019',
        payment_date: '20.09.2019',
        payment_number: '9',
        payment_purpose: 'личные нужды Без НДС',
        supplier_bill_id: '0',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;445305684;337202449;2'
      },
      {
        hold: false,
        date: new Date('2019-09-20T00:00:00+03:00'),
        movements: [
          {
            id: '1;445305684',
            account: { id: 'account' },
            invoice: null,
            sum: -50000,
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
        comment: 'личные нужды Без НДС'
      }
    ],
    [
      {
        counterparty_account_number: '30232810100500005065',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'Точка ПАО Банка "ФК Открытие", Москва',
        counterparty_inn: '7706092528',
        counterparty_kpp: '',
        counterparty_name: 'Точка ПАО Банка "ФК Открытие"',
        operation_type: '17',
        payment_amount: '-500',
        payment_bank_system_id: '1;377530569',
        payment_charge_date: '11.04.2019',
        payment_date: '11.04.2019',
        payment_number: '303521919',
        payment_purpose: 'Покупка товара(Терминал:PAY.MTS.RU TOPUP 3812, VORONTSOVSKAYA D.1/3, MOSCOW, RU,дата операции:09/04/2019 00:07,на сумму:500(810),карта 5140********8920)\n',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;377530569;295219193;2'
      },
      {
        hold: false,
        date: new Date('2019-04-09T00:07:00+03:00'),
        movements: [
          {
            id: '1;377530569',
            account: { id: 'account' },
            invoice: null,
            sum: -500,
            fee: 0
          }
        ],
        merchant: {
          country: 'RU',
          city: 'MOSCOW',
          title: 'PAY.MTS.RU TOPUP 3812',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        counterparty_account_number: '30232810100500005623',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'Точка ПАО Банка "ФК Открытие", Москва',
        counterparty_inn: '7706092528',
        counterparty_kpp: '',
        counterparty_name: 'Точка ПАО Банка "ФК Открытие"',
        operation_type: '17',
        payment_amount: '-2547.45',
        payment_bank_system_id: '1;445444693',
        payment_charge_date: '21.09.2019',
        payment_date: '21.09.2019',
        payment_number: '339748194',
        payment_purpose: 'Покупка товара(Терминал:H&M 674, POLUSTROVSKIY PR-T, 84A, SANKT-PETERBU, RU,дата операции:19/09/2019 13:33,на сумму:2547.45 RUB,карта 5140********1234)\n',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;445444693;337274581;2'
      },
      {
        hold: false,
        date: new Date('2019-09-19T13:33:00+03:00'),
        movements: [
          {
            id: '1;445444693',
            account: { id: 'account' },
            invoice: null,
            sum: -2547.45,
            fee: 0
          }
        ],
        merchant: {
          country: 'RU',
          city: 'SANKT-PETERBU',
          title: 'H&M 674',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        counterparty_account_number: '30232840100500005064',
        counterparty_bank_bic: '044525999',
        counterparty_bank_name: 'Точка ПАО Банка "ФК Открытие", Москва',
        counterparty_inn: '7706092528',
        counterparty_kpp: '',
        counterparty_name: 'ПАО БАНК "ФК ОТКРЫТИЕ"',
        operation_type: '17',
        payment_amount: '-565.15',
        payment_bank_system_id: '1;416135327',
        payment_charge_date: '18.07.2019',
        payment_date: '18.07.2019',
        payment_number: '324094008',
        payment_purpose: 'Покупка товара(Терминал:JetBrains Distribution, Na hrebenech II 1718/10, Prague, CZ,дата операции:17/07/2019 20:50,на сумму:8.9 USD,карта 5140********0933)\n',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '1;416135327;319073570;2'
      },
      {
        hold: false,
        date: new Date('2019-07-17T20:50:00+03:00'),
        movements: [
          {
            id: '1;416135327',
            account: { id: 'account' },
            invoice: { instrument: 'USD', sum: -8.9 },
            sum: -565.15,
            fee: 0
          }
        ],
        merchant: {
          country: 'CZ',
          city: 'Prague',
          title: 'JetBrains Distribution',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        counterparty_account_number: '30232840100500005782',
        counterparty_bank_bic: '044525797',
        counterparty_bank_name: 'ТОЧКА КИВИ БАНК (АО), Москва',
        counterparty_inn: '3123011520',
        counterparty_kpp: '',
        counterparty_name: 'Ф Точка Банк КИВИ Банк (АО)',
        operation_type: '17',
        payment_amount: '-835.92',
        payment_bank_system_id: '71;456754439',
        payment_charge_date: '14.10.2019',
        payment_date: '14.10.2019',
        payment_number: '345715531',
        payment_purpose: 'Покупка товара(Терминал:LIQPAY*inst, LIQPAY*inst,DNEPR,UA, DNEPR, UA,дата операции:12/10/2019 19:13,на сумму:317.47 980,карта 5140********1122)\n',
        supplier_bill_id: '',
        tax_info_document_date: '',
        tax_info_document_number: '',
        tax_info_kbk: '',
        tax_info_okato: '',
        tax_info_period: '',
        tax_info_reason_code: '',
        tax_info_status: '',
        x_payment_id: '71;456754439;344311992;2'
      },
      {
        hold: false,
        date: new Date('2019-10-12T19:13:00+03:00'),
        movements: [
          {
            id: '71;456754439',
            account: { id: 'account' },
            invoice: { instrument: 'UAH', sum: -317.47 },
            sum: -835.92,
            fee: 0
          }
        ],
        merchant: {
          country: 'UA',
          city: 'DNEPR',
          title: 'LIQPAY*inst',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
