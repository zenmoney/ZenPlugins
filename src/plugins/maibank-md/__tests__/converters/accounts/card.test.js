import { convertAccounts } from '../../../converters.js'

describe('convertAccount', () => {
  it.each([
    [
      {
        cards: [
          {
            balance: 116.44,
            bankAccount: '22593539720',
            bankTitle: 'BC MOLDOVA-AGROINDBANK SA',
            bic: 'AGRNMD2X',
            cardHolder: 'NIKOLAY NIKOLAEV',
            cardType: 1,
            ccy: 'MDL',
            expMonth: 11,
            expYear: 22,
            iban: 'MD76AG000000022593539720',
            id: '688951',
            last4Digits: '9473',
            pan: '0000000000009473',
            qrCode: '211EB34C-6F76-4D02-8440-3A7BA7476430',
            visibility: {
              visibleForOperations: true,
              visibleStatement: true
            }
          },
          {
            id: '177412',
            last4Digits: '8760',
            expMonth: 4,
            expYear: 20,
            ccy: 'MDL',
            cardHolder: 'NIKOLAY NIKOLAEV',
            isBlocked: true,
            visibility: { visibleForOperations: true, visibleStatement: true },
            bankAccount: '15122275790',
            qrCode: 'E3324EC2-2DE5-4C18-8492-657CB742BCC2',
            bankTitle: 'BC MOLDOVA-AGROINDBANK SA',
            bic: 'AGRNMD2X',
            iban: 'MD84AG000000015122275790',
            pan: '0000000000008760'
          }],
        accounts: [],
        creditAccounts: [],
        depositAccounts: [],
        cardCreditAccounts: []
      },
      {
        accounts:
        [
          {
            id: '688951',
            type: 'ccard',
            title: '*9473',
            instrument: 'MDL',
            syncID: [
              'MD76AG000000022593539720',
              '9473'
            ],
            balance: 116.44
          }
        ],
        cardsByLastFourDigits: {
          9473: {
            lastFour: '9473',
            account: {
              id: '688951',
              type: 'ccard',
              title: '*9473',
              instrument: 'MDL',
              syncID: [
                'MD76AG000000022593539720',
                '9473'
              ],
              balance: 116.44
            }
          }
        }
      }
    ],
    [
      {
        cards: [
          {
            id: '890733',
            last4Digits: '9999',
            balance: 7505.89,
            expMonth: 4,
            expYear: 22,
            ccy: 'MDL',
            cardHolder: 'NIKOLAY NIKOLAEV',
            visibility: { visibleForOperations: true, visibleStatement: true },
            bankAccount: '15122275790',
            qrCode: '4E4FB2AD-8AFE-452C-AAE9-E76C4C7A35B4',
            bankTitle: 'BC MOLDOVA-AGROINDBANK SA',
            bic: 'AGRNMD2X',
            iban: 'MD84AG000000015122275790',
            pan: '0000000000009999'
          }],
        accounts: [],
        creditAccounts: [],
        depositAccounts: [],
        cardCreditAccounts: [{
          account: '15122275790',
          amount: 10000,
          currency: 'MDL',
          agreeDate: 1396569600000,
          endDate: 1679875200000,
          visibility: { visibleForOperations: true, visibleStatement: true },
          iban: 'MD84AG000000015122275790',
          bic: 'AGRNMD2X885'
        }]
      },
      {
        accounts:
        [
          {
            id: '890733',
            type: 'ccard',
            title: '*9999',
            instrument: 'MDL',
            syncID: [
              'MD84AG000000015122275790',
              '9999'
            ],
            available: 7505.89,
            creditLimit: 10000
          }
        ],
        cardsByLastFourDigits: {
          9999: {
            lastFour: '9999',
            account: {
              id: '890733',
              type: 'ccard',
              title: '*9999',
              instrument: 'MDL',
              syncID: [
                'MD84AG000000015122275790',
                '9999'
              ],
              available: 7505.89,
              creditLimit: 10000
            }
          }
        }
      }
    ],
    [
      {
        cards: [
          {
            id: '1608197',
            last4Digits: '5822',
            balance: 46.01,
            expMonth: 8,
            expYear: 24,
            ccy: 'MDL',
            cardHolder: 'NIKOLAY NIKOLAEV',
            cardType: 1,
            visibility: { visibleForOperations: true, visibleStatement: true },
            bankAccount: '22583794880',
            qrCode: '5D61A55B-4505-470B-BC2C-396EA5B3C553',
            bankTitle: 'BC MOLDOVA-AGROINDBANK SA',
            bic: 'AGRNMD2X',
            pan: '0000000000005822'
          }],
        accounts: [],
        creditAccounts: [],
        depositAccounts: [],
        cardCreditAccounts: []
      },
      {
        accounts:
          [{
            id: '1608197',
            type: 'ccard',
            title: '*5822',
            instrument: 'MDL',
            syncID: [
              '5822'
            ],
            balance: 46.01
          }],
        cardsByLastFourDigits: {
          5822: {
            lastFour: '5822',
            account: {
              id: '1608197',
              type: 'ccard',
              title: '*5822',
              instrument: 'MDL',
              syncID: [
                '5822'
              ],
              balance: 46.01
            }
          }
        }
      }
    ],
    [
      {
        cards: [
          {
            id: '495342',
            last4Digits: '9621',
            balance: 1.16,
            expMonth: 9,
            expYear: 21,
            ccy: 'EUR',
            cardHolder: 'NIKOLAY NIKOLAEV',
            cardType: 1,
            visibility: { visibleForOperations: true, visibleStatement: true },
            bankAccount: '22592966997',
            qrCode: '04C2B1AC-E057-41BD-AEFF-9A1BD1711C76',
            bankTitle: 'BC MOLDOVA-AGROINDBANK SA',
            bic: 'AGRNMD2X',
            iban: 'MD51AG000000022592966997',
            pan: '0000000000009621'
          },
          {
            id: '552220',
            last4Digits: '0711',
            balance: 1.16,
            expMonth: 9,
            expYear: 21,
            ccy: 'EUR',
            cardHolder: 'NIKOLAY NIKOLAEV',
            cardType: 7,
            visibility: { visibleForOperations: true, visibleStatement: true },
            bankAccount: '22592966997',
            qrCode: '091081A3-3849-4D50-A6A7-E59C49D94779',
            bankTitle: 'BC MOLDOVA-AGROINDBANK SA',
            bic: 'AGRNMD2X',
            iban: 'MD51AG000000022592966997',
            pan: '0000000000000711'
          }
        ],
        accounts: [],
        creditAccounts: [],
        depositAccounts: [],
        cardCreditAccounts: []
      },
      {
        accounts:
          [{
            id: '495342',
            type: 'ccard',
            title: 'cards *9621 *0711',
            instrument: 'EUR',
            syncID: [
              'MD51AG000000022592966997',
              '9621',
              '0711'
            ],
            balance: 1.16
          }],
        cardsByLastFourDigits: {
          9621: {
            lastFour: '9621',
            account: {
              id: '495342',
              type: 'ccard',
              title: 'cards *9621 *0711',
              instrument: 'EUR',
              syncID: [
                'MD51AG000000022592966997',
                '9621',
                '0711'
              ],
              balance: 1.16
            }
          },
          '0711': {
            lastFour: '0711',
            account: {
              id: '495342',
              type: 'ccard',
              title: 'cards *9621 *0711',
              instrument: 'EUR',
              syncID: [
                'MD51AG000000022592966997',
                '9621',
                '0711'
              ],
              balance: 1.16
            }
          }
        }
      }
    ]
  ])('converts card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
