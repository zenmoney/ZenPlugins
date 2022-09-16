import { convertTransactionNew } from '../../../converters'

describe('convertTransaction', () => {
  const transactions = [
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
        date: new Date('2022-07-29T00:00:00.000Z'),
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
          }
        ]
      }
    ],
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
        Amount: { amount: 30000, amountNat: 30000, currency: 'RUB' },
        CreditorAccount: { schemeName: 'RU.CBR.PAN', identification: '30232810700500021999' },
        CreditorAgent: {
          accountIdentification: '30101810845250000999',
          identification: '044525999',
          name: 'ТОЧКА ПАО БАНКА "ФК ОТКРЫТИЕ"',
          schemeName: 'RU.CBR.BIK'
        },
        CreditorParty: { inn: '7706092528', name: 'Точка ПАО Банка "ФК Открытие"', kpp: '770543002' },
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
          }
        ]
      }
    ]
  ]

  it.each(transactions)('converts income transaction', (apiTransaction, transaction) => {
    expect(convertTransactionNew(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
