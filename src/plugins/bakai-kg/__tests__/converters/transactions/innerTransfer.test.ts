import { readFileSync } from 'fs'
import { join } from 'path'
import { convertAccounts, convertTransaction } from '../../../converters'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'
import { getArray } from '../../../../../types/get'
import { Transaction } from '../../../../../types/zenmoney'

interface Pair {
  left: { accountId: number, operation: unknown }
  right: { accountId: number, operation: unknown }
  expected: Omit<Transaction, 'date'> & { date: string }
}
const pair = JSON.parse(readFileSync(join(__dirname, '../../fixtures/inner-transfer.json'), 'utf8')) as Pair
const products: unknown = JSON.parse(readFileSync(join(__dirname, '../../fixtures/products.json'), 'utf8'))
const accounts = convertAccounts(getArray(products, 'list')).map(plan => plan.account)

it('groups actual Elcard/Visa sides by the documented heuristic and preserves final financial effect (TRANSFER-002..004)', () => {
  const converted = [pair.left, pair.right].map(row => {
    const account = accounts.find(account => account.id === String(row.accountId))
    assert(account != null, 'Fixture account is missing')
    return convertTransaction(row.operation, account)
  })
  const expected = [{ ...pair.expected, date: new Date(pair.expected.date) }]
  expect(adjustTransactions({ transactions: converted })).toEqual(expected)
  expect(adjustTransactions({ transactions: [...converted].reverse() })).toEqual(expected)
})

it('keeps the observed income when the other card history is skipped (TRANSFER-001)', () => {
  const account = accounts.find(account => account.id === String(pair.right.accountId))
  assert(account != null, 'Fixture account is missing')
  expect(adjustTransactions({ transactions: [convertTransaction(pair.right.operation, account)] })).toEqual([{
    hold: null,
    date: new Date('2021-08-03T21:48:32.000Z'),
    movements: [{ id: '000000012:credit', account: { id: '1000' }, invoice: null, sum: 64722.82, fee: 0 }],
    merchant: null,
    comment: null
  }])
})
