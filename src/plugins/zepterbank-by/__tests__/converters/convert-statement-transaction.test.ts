import { convertCardAccount, convertCurrentAccount, convertStatementTransaction } from '../../converters'
import { FetchStatementOperation } from '../../types/fetch.types'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'
import { TEST_STATEMENT_TRANSACTIONS } from '../../__mocks__/transactions.sample'
import { Movement, Transaction } from '../../../../types/zenmoney'

describe('convertStatementTransaction', () => {
  const rawCardAccount1 = TEST_ACCOUNTS.CARD.find(acc => acc.productId === 'vc5275E7DJRNBWJaN9Ugpc86LZQ4F75Dda7xhb74')
  const rawCardAccount2 = TEST_ACCOUNTS.CARD.find(acc => acc.productId === '7eoTC9pk6A3o7EfqF7633NmBWjDW9DHp23V5k8KJ')
  const rawCardAccount3 = TEST_ACCOUNTS.CURRENT.find(acc => acc.productId === '3p6Kf9JU2RQW4HFE42QGVB556Sv4hgVxg4vZ7ZP2')

  if (rawCardAccount1 == null || rawCardAccount2 == null || rawCardAccount3 == null) {
    throw new Error('Card account not found')
  }

  const cardAccount1 = convertCardAccount(rawCardAccount1)
  const cardAccount2 = convertCardAccount(rawCardAccount2)
  const cardAccount3 = convertCurrentAccount(rawCardAccount3)

  it.each([
    [
      TEST_STATEMENT_TRANSACTIONS.vc5275E7DJRNBWJaN9Ugpc86LZQ4F75Dda7xhb74[0],
      {
        hold: null,
        date: new Date('2026-02-13T07:21:30.000Z'),
        comment: '',
        movements: [{
          id: null,
          account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
          fee: 0,
          invoice: null,
          sum: -3
        }] as [Movement],
        merchant: { title: 'PERSON TO PERSON ZEPTER', mcc: 6012, country: 'BLR', city: 'MINSK', location: null }
      }
    ],
    [
      TEST_STATEMENT_TRANSACTIONS.vc5275E7DJRNBWJaN9Ugpc86LZQ4F75Dda7xhb74[1],
      {
        hold: null,
        date: new Date('2026-02-12T18:46:07.000Z'),
        comment: '',
        movements: [{
          id: null,
          account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
          fee: 0,
          invoice: null,
          sum: -1.42
        }] as [Movement],
        merchant: { title: 'PEREVOD ZEPTER', mcc: 6012, country: 'BLR', city: 'MINSK', location: null }
      }
    ],
    [
      TEST_STATEMENT_TRANSACTIONS.vc5275E7DJRNBWJaN9Ugpc86LZQ4F75Dda7xhb74[2],
      {
        hold: null,
        date: new Date('2026-02-12T17:58:51.000Z'),
        comment: '',
        movements: [{
          id: null,
          account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
          fee: 0,
          invoice: null,
          sum: -1
        }] as [Movement],
        merchant: { title: 'PERSON TO PERSON ZEPTER', mcc: 6012, country: 'BLR', city: 'MINSK', location: null }
      }
    ],
    [
      TEST_STATEMENT_TRANSACTIONS.vc5275E7DJRNBWJaN9Ugpc86LZQ4F75Dda7xhb74[3],
      {
        hold: null,
        date: new Date('2026-02-12T14:53:18.000Z'),
        comment: '',
        movements: [{
          id: null,
          account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
          fee: 0,
          invoice: null,
          sum: -3.19
        }] as [Movement],
        merchant: { title: 'SHOP KOPEECHKA', mcc: 5411, country: 'BLR', city: 'MINSK', location: null }
      }
    ],
    [
      TEST_STATEMENT_TRANSACTIONS.vc5275E7DJRNBWJaN9Ugpc86LZQ4F75Dda7xhb74[4],
      {
        hold: null,
        date: new Date('2026-02-12T14:31:39.000Z'),
        comment: '',
        movements: [{
          id: null,
          account: { id: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8' },
          fee: 0,
          invoice: null,
          sum: 10
        }] as [Movement],
        merchant: { title: 'INTERNET-BANKING ZEPTERBANK', mcc: 4900, country: 'BLR', city: 'MINSK', location: null }
      }
    ]
  ])('converts transactions for card account 1', (apiTransaction: FetchStatementOperation, transaction: Transaction) => {
    expect(convertStatementTransaction(apiTransaction, cardAccount1)).toEqual(transaction)
  })

  it.each([
    [
      TEST_STATEMENT_TRANSACTIONS['7eoTC9pk6A3o7EfqF7633NmBWjDW9DHp23V5k8KJ'][0],
      {
        hold: null,
        date: new Date('2026-02-13T07:21:30.000Z'),
        comment: '',
        movements: [{
          id: null,
          account: { id: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5' },
          fee: 0,
          invoice: { sum: 3, instrument: 'BYN' },
          sum: 0.85
        }] as [Movement],
        merchant: { title: 'PERSON TO PERSON ZEPTER', mcc: 6012, country: 'BLR', city: 'MINSK', location: null }
      }
    ],
    [
      TEST_STATEMENT_TRANSACTIONS['7eoTC9pk6A3o7EfqF7633NmBWjDW9DHp23V5k8KJ'][1],
      {
        hold: null,
        date: new Date('2026-02-12T17:58:52.000Z'),
        comment: '',
        movements: [{
          id: null,
          account: { id: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5' },
          fee: 0,
          invoice: { sum: 1, instrument: 'BYN' },
          sum: 0.28
        }] as [Movement],
        merchant: { title: 'PERSON TO PERSON ZEPTER', mcc: 6012, country: 'BLR', city: 'MINSK', location: null }
      }
    ],
    [
      TEST_STATEMENT_TRANSACTIONS['7eoTC9pk6A3o7EfqF7633NmBWjDW9DHp23V5k8KJ'][2],
      {
        hold: null,
        date: new Date('2026-02-12T21:00:00.000Z'),
        comment: '',
        movements: [{
          id: null,
          account: { id: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5' },
          fee: 0,
          invoice: { sum: -3.19, instrument: 'BYN' },
          sum: -0.96
        }] as [Movement],
        merchant: { title: 'SHOP KOPEECHKA', mcc: 5411, country: 'BLR', city: 'MINSK', location: null }
      }
    ]
  ])('converts transactions for card account 2', (apiTransaction: FetchStatementOperation, transaction: Transaction) => {
    expect(convertStatementTransaction(apiTransaction, cardAccount2)).toEqual(transaction)
  })

  it.each([
    [
      TEST_STATEMENT_TRANSACTIONS['3p6Kf9JU2RQW4HFE42QGVB556Sv4hgVxg4vZ7ZP2'][0],
      {
        hold: null,
        date: new Date('2026-02-12T18:46:07.000Z'),
        comment: '',
        movements: [{
          id: null,
          account: { id: '3p6Kf9JU2RQW4HFE42QGVB556Sv4hgVxg4vZ7ZP2' },
          fee: 0,
          invoice: null,
          sum: 1.42
        }] as [Movement],
        merchant: null
      }
    ]
  ])('converts transactions for card account 3', (apiTransaction: FetchStatementOperation, transaction: Transaction) => {
    expect(convertStatementTransaction(apiTransaction, cardAccount3)).toEqual(transaction)
  })
})
