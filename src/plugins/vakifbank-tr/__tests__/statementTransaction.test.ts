import { AccountType } from '../../../types/zenmoney'

import { convertVakifPdfStatementTransaction } from '../converters'
import { TransactionWithId, VakifStatementTransaction } from '../models'

const testCases: Array<[VakifStatementTransaction[], TransactionWithId[]]> = [
  [
    [
      {
        date: '2023-08-10T20:10:00.500',
        amount: '-30,00',
        balance: '6.142,60',
        description1: 'Vakıfbank Pos Spending',
        description2: 'Referans :02322220039401954 Term Id :01112399- ISLEM NO :0109-ANET ANTALYA A.Ş       Antalya      TRTR**** SAAT :20:10:17 Provizyon Kodu :  597977 - 535576 - D -  Mcc: 7399',
        statementUid: '2023007326082335',
        originString: '10.08.202320:102023007326082335-30,006.142,60Vakıfbank Pos Spending\nReferans :02322220039401954 Term Id :01112399- ISLEM NO :0109-ANET ANTALYA A.Ş       Antalya      TRTR**** SAAT :20:10:17 Provizyon Kodu : \n597977 - 535576 - D -  Mcc: 7399\n'
      }
    ],
    [
      {
        statementUid: '2023007326082335',
        transaction: {
          comment: null,
          date: new Date('2023-08-10T20:10:00.500'),
          hold: false,
          merchant: {
            fullTitle: 'ANET ANTALYA A.Ş',
            mcc: 7399,
            location: null
          },
          movements: [
            {
              account: { id: '1234567890' },
              fee: 0,
              id: '2023007326082335',
              sum: -30,
              invoice: null
            }
          ]
        }
      }
    ]
  ],
  [
    [
      {
        date: '2023-07-31T10:21:00.500',
        amount: '-5.000,00',
        balance: '52.858,64',
        description1: 'ATM Withdrawal',
        description2: "S00430 şubesine bağlı 004305 no lu ANTALYA İL EMN.MÜD.UNCALI POLİS LOJMANLARI ATM 'sinde 31/07/2023 10:21 tarihinde 445014111936 nolu  müşteri  00158007318398268 no lu hesabından TL para çekti.",
        statementUid: '2023006962347820',
        originString: "31.07.202310:212023006962347820-5.000,0052.858,64ATM Withdrawal\nS00430 şubesine bağlı 004305 no lu ANTALYA İL EMN.MÜD.UNCALI POLİS LOJMANLARI ATM 'sinde 31/07/2023 10:21 tarihinde 445014111936 nolu \nmüşteri  00158007318398268 no lu hesabından TL para çekti.\n"
      }
    ],
    [
      {
        statementUid: '2023006962347820',
        transaction: {
          comment: "S00430 şubesine bağlı 004305 no lu ANTALYA İL EMN.MÜD.UNCALI POLİS LOJMANLARI ATM 'sinde 31/07/2023 10:21 tarihinde 445014111936 nolu  müşteri  00158007318398268 no lu hesabından TL para çekti.",
          date: new Date('2023-07-31T10:21:00.500'),
          hold: false,
          merchant: null,
          movements: [
            {
              account: { id: '1234567890' },
              fee: 0,
              id: '2023006962347820',
              sum: -5000,
              invoice: null
            },
            {
              account: {
                company: null,
                instrument: 'TL',
                syncIds: null,
                type: AccountType.cash
              },
              fee: 0,
              id: '2023006962347820',
              sum: 5000,
              invoice: null
            }
          ]
        }
      }
    ]
  ],
  [
    [
      {
        date: '2023-07-12T08:25:00.500',
        amount: '-200,00',
        balance: '38.330,64',
        description1: 'Sent Remittance',
        description2: '1525695326614 / TR57 0001 5001 58** **** **82 68 nolu ',
        statementUid: '2023006306315713',
        originString: '12.07.202308:252023006306315713-200,0038.330,64Sent Remittance\n1525695326614 / TR57 0001 5001 58** **** **82 68 nolu EVGENII TIKHONOV'
      },
      {
        date: '2023-07-12T08:25:00.500',
        amount: '-1,32',
        balance: '38.329,32',
        description1: 'Fee Collection',
        description2: 'Havale Ücreti  00158007318398268   HESABINDAN TAHSİLİ',
        statementUid: '2023006306315713',
        originString: '12.07.202308:252023006306315713-1,3238.329,32Fee Collection\nHavale Ücreti  00158007318398268   HESABINDAN TAHSİLİ\n'
      }
    ],
    [
      {
        statementUid: '2023006306315713',
        transaction: {
          comment: 'Sent Remittance: 1525695326614 / TR57 0001 5001 58** **** **82 68 nolu ',
          date: new Date('2023-07-12T08:25:00.500'),
          hold: false,
          merchant: null,
          movements: [
            {
              account: { id: '1234567890' },
              fee: 1.32,
              id: '2023006306315713',
              sum: -200,
              invoice: null
            }
          ]
        }
      }
    ]
  ],
  [
    [
      {
        date: '2023-08-10T19:52:00.500',
        amount: '-25,00',
        balance: '6.172,60',
        description1: 'BKM Pos Spending',
        description2: 'Referans :20134322219585090 Term Id :00969104- ISLEM NO :    -PURSE OTOMOTIV TICARET LIAntalya      TR**** SAAT :19:52:43 Provizyon Kodu :  554334 - 0134 - D -  Mcc: 5599',
        statementUid: '2023007325814925',
        originString: '10.08.202319:522023007325814925-25,006.172,60BKM Pos Spending\nReferans :20134322219585090 Term Id :00969104- ISLEM NO :    -PURSE OTOMOTIV TICARET LIAntalya      TR**** SAAT :19:52:43 Provizyon Kodu : \n554334 - 0134 - D -  Mcc: 5599\n'
      }
    ],
    [
      {
        statementUid: '2023007325814925',
        transaction: {
          comment: null,
          date: new Date('2023-08-10T19:52:00.500'),
          hold: false,
          merchant: {
            fullTitle: 'PURSE OTOMOTIV TICARET LIAntalya',
            mcc: 5599,
            location: null
          },
          movements: [
            {
              account: { id: '1234567890' },
              fee: 0,
              id: '2023007325814925',
              sum: -25,
              invoice: null
            }
          ]
        }
      }
    ]
  ]
]

it.each(testCases)('converts transaction parsed from pdf statement', (rawTransaction: VakifStatementTransaction[], transaction: TransactionWithId[]) => {
  expect(convertVakifPdfStatementTransaction('1234567890', rawTransaction)).toEqual(transaction)
})
