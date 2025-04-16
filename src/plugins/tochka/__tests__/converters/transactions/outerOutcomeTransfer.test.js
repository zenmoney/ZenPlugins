import { convertTransaction, convertTransactionNew } from '../../../converters'

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
    expect(convertTransaction(apiTransaction, {
      id: 'account',
      instrument: 'RUB'
    })).toEqual(transaction)
  })
})

describe('convertTransactionNew', () => {
  it.each([
    [
      {
        Amount: {
          amount: 30000,
          amountNat: 30000,
          currency: 'RUB'
        },
        CreditorAccount: {
          schemeName: 'RU.CBR.PAN',
          identification: '30232810700500021999'
        },
        CreditorAgent: {
          accountIdentification: '30101810845250000999',
          identification: '044525999',
          name: 'ТОЧКА ПАО БАНКА "ФК ОТКРЫТИЕ"',
          schemeName: 'RU.CBR.BIK'
        },
        CreditorParty: {
          inn: '7706092528',
          name: 'Точка ПАО Банка "ФК Открытие"',
          kpp: '770543002'
        },
        creditDebitIndicator: 'Debit',
        description: 'Перевод по номеру телефона +79638012345 Получатель ИВАН ИВАНОВИЧ И. через СБП.',
        documentNumber: '10458',
        documentProcessDate: '2022-07-21',
        status: 'Booked',
        transactionId: '1154401982;1',
        transactionTypeCode: 'Банковский ордер'
      },
      {
        comment: null,
        date: new Date('2022-07-21T00:00:00.000Z'),
        hold: null,
        merchant: {
          fullTitle: 'ИВАН ИВАНОВИЧ И.',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: {
              id: 'account'
            },
            fee: 0,
            id: '1154401982;1',
            invoice: null,
            sum: -30000
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
            sum: 30000,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        transactionId: 'cbs-tb;1089568380;1',
        paymentId: 'cbs-tb-92-2003246310',
        creditDebitIndicator: 'Debit',
        status: 'Booked',
        documentNumber: '725035',
        transactionTypeCode: 'Банковский ордер',
        documentProcessDate: '2025-01-26',
        description: 'Перевод по номеру телефона +7 967 376-60-99 Получатель Вадим Вадимович В. через СБП. Сообщение получателю: Вб э тов',
        Amount: {
          amount: 602,
          amountNat: 602,
          currency: 'RUB'
        },
        CreditorParty: {
          inn: '9721194461',
          name: 'ООО "Банк Точка"',
          kpp: '997950001'
        },
        CreditorAccount: {
          schemeName: 'RU.CBR.PAN',
          identification: '30232810920000000009'
        },
        CreditorAgent: {
          schemeName: 'RU.CBR.BIK',
          identification: '044525104',
          accountIdentification: '30101810745374525104',
          name: 'ООО "Банк Точка"'
        }
      },
      {
        hold: null,
        date: new Date('2025-01-26T00:00:00Z'),
        movements: [
          {
            id: 'cbs-tb;1089568380;1',
            account: { id: 'account' },
            invoice: null,
            sum: -602,
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
            sum: 602,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Вадим Вадимович В.',
          mcc: null,
          location: null
        },
        comment: 'Вб э тов'
      }
    ],
    [
      {
        transactionId: '1162525351;1',
        creditDebitIndicator: 'Debit',
        status: 'Booked',
        documentNumber: '806079349',
        transactionTypeCode: 'Банковский ордер',
        documentProcessDate: '2022-07-29',
        description: 'P2P Перевод с карты(Терминал:Tochka Card2Card,2/1 bld. 3, Radischevskaya Verhnyaya str.,Moscow,RU,дата операции:29/07/2022 16:22(МСК),на сумму:100 RUB,карта 220029******1234)',
        Amount: {
          amount: 100,
          amountNat: 100,
          currency: 'RUB'
        },
        CreditorParty: {
          inn: '7706092528',
          name: 'Точка ПАО Банка "ФК Открытие"',
          kpp: '770543002'
        },
        CreditorAccount: {
          schemeName: 'RU.CBR.PAN',
          identification: '30232810200500006676'
        },
        CreditorAgent: {
          schemeName: 'RU.CBR.BIK',
          identification: '044525999',
          accountIdentification: '30101810845250000999',
          name: 'ТОЧКА ПАО БАНКА "ФК ОТКРЫТИЕ"'
        }
      },
      {
        comment: null,
        date: new Date('2022-07-29T16:22:00+03:00'),
        hold: null,
        merchant: null,
        movements: [
          {
            account: {
              id: 'account'
            },
            fee: 0,
            id: '1162525351;1',
            invoice: null,
            sum: -100
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: ['220029******1234']
            },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outer outcome transfer new', (apiTransaction, transaction) => {
    expect(convertTransactionNew(apiTransaction, {
      id: 'account',
      instrument: 'RUB'
    })).toEqual(transaction)
  })
})
