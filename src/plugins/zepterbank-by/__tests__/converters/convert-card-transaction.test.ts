import { convertCardAccount, convertCardTransaction } from '../../converters'
import { FetchCardTransaction } from '../../types/fetch.types'
import { Movement, Transaction } from '../../../../types/zenmoney'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'
import { TEST_CARD_TRANSACTIONS } from '../../__mocks__/transactions.sample'

describe('convertCardTransaction', () => {
  const rawCardAccount1 = TEST_ACCOUNTS.CARD.find(acc => acc.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')
  const rawCardAccount2 = TEST_ACCOUNTS.CARD.find(acc => acc.productCardId === 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5')

  if (rawCardAccount1 == null || rawCardAccount2 == null) {
    throw new Error('Card account not found')
  }

  const cardAccount1 = convertCardAccount(rawCardAccount1)
  const cardAccount2 = convertCardAccount(rawCardAccount2)

  it.each([
    [
      TEST_CARD_TRANSACTIONS.Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8[0],
      {
        hold: null,
        date: new Date('2026-02-13T07:21:30.000Z'),
        comment: '',
        movements: [
          {
            id: null,
            account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
            fee: 0,
            invoice: null,
            sum: -3
          }
        ] as [Movement],
        merchant: {
          fullTitle: 'PERSON TO PERSON ZEPTER',
          mcc: 6012,
          location: null
        }
      }
    ],
    [
      TEST_CARD_TRANSACTIONS.Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8[1],
      {
        hold: null,
        date: new Date('2026-02-12T18:46:07.000Z'),
        comment: '',
        movements: [
          {
            id: null,
            account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
            fee: 0,
            invoice: null,
            sum: -1.42
          }
        ] as [Movement],
        merchant: {
          fullTitle: 'PEREVOD ZEPTER',
          mcc: 6012,
          location: null
        }
      }
    ],
    [
      TEST_CARD_TRANSACTIONS.Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8[2],
      {
        hold: null,
        date: new Date('2026-02-12T17:58:51.000Z'),
        comment: '',
        movements: [
          {
            id: null,
            account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
            fee: 0,
            invoice: null,
            sum: -1
          }
        ] as [Movement],
        merchant: {
          fullTitle: 'PERSON TO PERSON ZEPTER',
          mcc: 6012,
          location: null
        }
      }
    ],
    [
      TEST_CARD_TRANSACTIONS.Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8[3],
      {
        hold: null,
        date: new Date('2026-02-12T14:53:47.000Z'),
        comment: '',
        movements: [
          {
            id: null,
            account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
            fee: 0,
            invoice: null,
            sum: -3.19
          }
        ] as [Movement],
        merchant: {
          fullTitle: 'SHOP KOPEECHKA',
          mcc: 5411,
          location: null
        }
      }
    ],
    [
      TEST_CARD_TRANSACTIONS.Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8[4],
      {
        hold: null,
        date: new Date('2026-02-12T14:31:39.000Z'),
        comment: '',
        movements: [
          {
            id: null,
            account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
            fee: 0,
            invoice: null,
            sum: 10
          }
        ] as [Movement],
        merchant: {
          fullTitle: 'INTERNET-BANKING ZEPTERBANK',
          mcc: 4900,
          location: null
        }
      }
    ]
  ])('converts transactions for card account 1', (apiTransaction: FetchCardTransaction, transaction: Transaction) => {
    expect(convertCardTransaction(apiTransaction, cardAccount1)).toEqual(transaction)
  })

  it.each([
    [
      TEST_CARD_TRANSACTIONS.Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5[0],
      {
        hold: null,
        date: new Date('2026-02-13T07:23:28.000Z'),
        comment: '',
        movements: [
          {
            id: null,
            account: { id: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5' },
            fee: 0,
            invoice: { sum: -3.19, instrument: 'BYN' },
            sum: null
          }
        ] as [Movement],
        merchant: {
          fullTitle: 'SHOP KOPEECHKA',
          mcc: 5411,
          location: null
        }
      }
    ],
    [
      TEST_CARD_TRANSACTIONS.Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5[1],
      {
        hold: null,
        date: new Date('2026-02-13T07:21:30.000Z'),
        comment: '',
        movements: [
          {
            id: null,
            account: { id: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5' },
            fee: 0,
            invoice: { sum: 3, instrument: 'BYN' },
            sum: null
          }
        ] as [Movement],
        merchant: {
          fullTitle: 'PERSON TO PERSON ZEPTER',
          mcc: 6012,
          location: null
        }
      }
    ],
    [
      TEST_CARD_TRANSACTIONS.Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5[2],
      {
        hold: null,
        date: new Date('2026-02-12T17:58:52.000Z'),
        comment: '',
        movements: [
          {
            id: null,
            account: { id: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5' },
            fee: 0,
            invoice: { sum: 1, instrument: 'BYN' },
            sum: null
          }
        ] as [Movement],
        merchant: {
          fullTitle: 'PERSON TO PERSON ZEPTER',
          mcc: 6012,
          location: null
        }
      }
    ]
  ])('converts transactions for card account 2', (apiTransaction: FetchCardTransaction, transaction: Transaction) => {
    expect(convertCardTransaction(apiTransaction, cardAccount2)).toEqual(transaction)
  })
})
