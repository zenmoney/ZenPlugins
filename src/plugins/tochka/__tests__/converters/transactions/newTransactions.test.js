import { convertTransactionNew } from '../../../converters'

describe('convertTransaction', () => {
  const transactions = [
    [
      {
        transactionId: '1159412292;1',
        creditDebitIndicator: 'Debit',
        status: 'Booked',
        documentNumber: '803881727',
        transactionTypeCode: 'Банковский ордер',
        documentProcessDate: '2022-07-26',
        description: 'Покупка товара(Терминал:OOO DTK-VOSTOK,44 50 LET OKTYABRYA STR,BLAGOVESHHENS,RU,дата операции:25/07/2022 09:43(МСК),на сумму:152 RUB,карта 2200********1234)',
        Amount: {
          amount: 152,
          amountNat: 152,
          currency: 'RUB'
        },
        CreditorParty: {
          inn: '7706092528',
          name: 'Точка ПАО Банка "ФК Открытие"',
          kpp: '770543002'
        },
        CreditorAccount: {
          schemeName: 'RU.CBR.PAN',
          identification: '30232810600500053944'
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
        date: new Date('2022-07-26T00:00:00.000Z'),
        hold: null,
        merchant: {
          city: 'BLAGOVESHHENS',
          country: 'RU',
          location: null,
          mcc: null,
          title: 'OOO DTK-VOSTOK'
        },
        movements: [
          {
            account: {
              id: 'account'
            },
            fee: 0,
            id: '1159412292;1',
            invoice: null,
            sum: -152
          }
        ]
      }
    ],
    [
      {
        transactionId: '1215586804;1',
        creditDebitIndicator: 'Debit',
        status: 'Booked',
        documentNumber: '158',
        transactionTypeCode: 'Платежное поручение',
        documentProcessDate: '2022-09-19',
        description: 'За товар по Счёту № 269 от 19 сентября 2022 г., Без налога (НДС)',
        Amount: {
          amount: 114600,
          amountNat: 114600,
          currency: 'RUB'
        },
        CreditorParty: {
          inn: '507802686574',
          name: 'ИП Николаев Николай Николаевич',
          kpp: '0'
        },
        CreditorAccount: {
          schemeName: 'RU.CBR.PAN',
          identification: '40802810240000064774'
        },
        CreditorAgent: {
          schemeName: 'RU.CBR.BIK',
          identification: '044525225',
          accountIdentification: '30101810400000000225',
          name: 'ПАО СБЕРБАНК'
        }
      },
      {
        hold: null,
        date: new Date('2022-09-19T00:00:00.000Z'),
        movements: [
          {
            id: '1215586804;1',
            account: { id: 'account' },
            invoice: null,
            sum: -114600,
            fee: 0
          }
        ],
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'ИП Николаев Николай Николаевич'
        },
        comment: null
      }
    ],
    [
      {
        transactionId: '1215706834;1',
        creditDebitIndicator: 'Credit',
        status: 'Booked',
        documentNumber: '120943',
        transactionTypeCode: 'Платежное поручение',
        documentProcessDate: '2022-09-19',
        description: 'Оплата по договору №б/н от 31.03.2022 на 11.09.2022. Сумма 2007-35 руб., Без налога (НДС).',
        Amount: {
          amount: 2007.35,
          amountNat: 2007.35,
          currency: 'RUB'
        },
        DebtorParty: {
          inn: '6685157931',
          name: 'ООО Боксберри СОФТ'
        },
        DebtorAccount: {
          schemeName: 'RU.CBR.PAN',
          identification: '40702810104000022703'
        },
        DebtorAgent: {
          schemeName: 'RU.CBR.BIK',
          identification: '046577906',
          accountIdentification: '30101810100000000906',
          name: 'УРАЛЬСКИЙ ФИЛИАЛ АО "РАЙФФАЙЗЕНБАНК"'
        }
      },
      {
        hold: null,
        date: new Date('2022-09-19T00:00:00.000Z'),
        movements: [
          {
            id: '1215706834;1',
            account: { id: 'account' },
            invoice: null,
            sum: 2007.35,
            fee: 0
          }
        ],
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'ООО Боксберри СОФТ'
        },
        comment: null
      }
    ],
    [
      {
        transactionId: '1259627339;1',
        creditDebitIndicator: 'Debit',
        status: 'Booked',
        documentNumber: '873301836',
        transactionTypeCode: 'Банковский ордер',
        documentProcessDate: '2022-11-01',
        description: 'Выдача наличных денег в банкомате(Терминал:GAZPROMBANK,KARLAMARKSA62,NIZHNIJNOVGOR,RU,дата операции:30/10/2022 15:10(МСК),на сумму:500 RUB,карта 5292********4010)',
        Amount: {
          amount: 500,
          amountNat: 500,
          currency: 'RUB'
        },
        CreditorParty: {
          inn: '7706092528',
          name: 'Точка ПАО Банка "ФК Открытие"',
          kpp: '770543002'
        },
        CreditorAccount: {
          schemeName: 'RU.CBR.PAN',
          identification: '30232810100500005065'
        },
        CreditorAgent: {
          schemeName: 'RU.CBR.BIK',
          identification: '044525999',
          accountIdentification: '30101810845250000999',
          name: 'ТОЧКА ПАО БАНКА "ФК ОТКРЫТИЕ"'
        }
      },
      {
        hold: null,
        date: new Date('2022-11-01T00:00:00.000Z'),
        movements: [
          {
            id: '1259627339;1',
            account: { id: 'account' },
            invoice: null,
            sum: -500,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'RUB',
              syncIds: null,
              type: 'cash'
            },
            invoice: null,
            sum: 500,
            fee: 0
          }
        ],
        merchant: {
          city: 'NIZHNIJNOVGOR',
          country: 'RU',
          location: null,
          mcc: null,
          title: 'GAZPROMBANK'
        },
        comment: null
      }
    ],
    [
      {
        transactionId: 'cbs-tb;1299729092;1',
        paymentId: 'cbs-tb-92-2463574954',
        creditDebitIndicator: 'Debit',
        status: 'Booked',
        documentNumber: '699327',
        transactionTypeCode: 'Банковский ордер',
        documentProcessDate: '2025-05-02',
        description: 'Покупка товара(Терминал:,SMORODINA,,STR LENINSKOGO KOMSOMOLA 75,Abakan,RU,дата операции:30/04/2025 07:09(МСК),на сумму:250 RUB,карта 2204********7125)',
        Amount: {
          amount: 250,
          amountNat: 250,
          currency: 'RUB'
        },
        CreditorParty: {
          inn: '9721194461',
          name: 'ООО "Банк Точка"',
          kpp: '997950001'
        },
        CreditorAccount: {
          schemeName: 'RU.CBR.PAN',
          identification: '30232810820000003944'
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
        date: new Date('2025-05-02T00:00:00.000Z'),
        movements: [
          {
            id: 'cbs-tb;1299729092;1',
            account: { id: 'account' },
            invoice: null,
            sum: -250,
            fee: 0
          }
        ],
        merchant: {
          country: 'RU',
          city: 'Abakan',
          title: 'SMORODINA',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ]

  it.each(transactions)('converts new transaction', (apiTransaction, transaction) => {
    expect(convertTransactionNew(apiTransaction, {
      id: 'account',
      instrument: 'RUB'
    })).toEqual(transaction)
  })
})
