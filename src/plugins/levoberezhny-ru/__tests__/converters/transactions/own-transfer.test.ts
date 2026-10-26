import { convertAccounts, convertTransactions } from '../../../converters'
import { groupTransactions } from '../../../transfers'

// Both complete source records from the same observed transfer and the full account graph.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const source = require('../../fixtures/own-transfer.json') as { operations: Array<{ accountId: number }> }
// eslint-disable-next-line @typescript-eslint/no-var-requires
const graph = require('../../fixtures/accounts.json') as { accounts: unknown[] }
const plans = convertAccounts(graph.accounts)
const accounts = plans.map(plan => plan.account)
const from = new Date('2026-01-01T00:00:00+03:00')
const sides = accounts.flatMap(account => convertTransactions(source.operations.filter(item => String(item.accountId) === account.id), account, from, undefined, accounts))
const expected = [{
  movements: [
    { id: '900200', account: { id: '900002' }, sum: -342.41, fee: 0, invoice: null },
    { id: '900201', account: { id: '900006' }, sum: 342.41, fee: 0, invoice: null }
  ],
  date: new Date('2026-10-26T15:02:00.000Z'),
  hold: false,
  merchant: null,
  comment: null
}]

it('combines both observed own-account sides once, preserving each movement ID and removing boilerplate', () => {
  expect(groupTransactions(sides)).toEqual(expected)
  expect(groupTransactions([...sides].reverse())).toEqual(expected)
  expect(groupTransactions(sides)).toEqual(expected)
})

it('keeps the actual debit when the incoming side is skipped or not returned', () => {
  expect(groupTransactions(sides.filter(item => item.movements[0].sum === -342.41))).toEqual([{
    date: expected[0].date,
    hold: false,
    movements: [expected[0].movements[0]],
    merchant: { title: 'Иван Иванович Тестов', country: null, city: null, mcc: null, location: null },
    comment: 'Перевод себе'
  }])
})

it('keeps the actual credit when no debit was fetched, without inventing the opposite movement', () => {
  expect(groupTransactions(sides.filter(item => item.movements[0].sum === 342.41))).toEqual([{
    date: expected[0].date,
    hold: false,
    movements: [expected[0].movements[1]],
    merchant: { title: 'Иван Иванович Тестов', country: null, city: null, mcc: null, location: null },
    comment: 'Перевод собственных средств. Без налога (НДС).'
  }])
})

it('does not infer a side from account metadata when only one represented account remains', () => {
  const account = accounts.find(account => account.id === '900002')
  if (account == null) throw new Error('Source account missing')
  const converted = convertTransactions(source.operations.filter(item => String(item.accountId) === account.id), account, from)
  expect(groupTransactions(converted)).toEqual(groupTransactions(sides.filter(item => item.movements[0].sum === -342.41)))
})

it('keeps equal same-minute transfers separate and refuses an incomplete ambiguous group', () => {
  const copyWithId = (transaction: typeof sides[number], id: string): typeof sides[number] => ({
    ...transaction,
    movements: [{ ...transaction.movements[0], id }]
  })
  const repeated = [sides[0], copyWithId(sides[0], '900202'), sides[1], copyWithId(sides[1], '900203')]
  const grouped = groupTransactions(repeated)
  expect(grouped).toHaveLength(2)
  expect(grouped.every(transaction => transaction.movements.length === 2)).toBe(true)
  expect(grouped.flatMap(transaction => transaction.movements.map(movement => String(movement.id))).sort((a, b) => a.localeCompare(b))).toEqual(['900200', '900201', '900202', '900203'])

  const incomplete = groupTransactions([...repeated, copyWithId(sides[1], '900204')])
  expect(incomplete).toHaveLength(5)
  expect(incomplete.every(transaction => transaction.movements.length === 1)).toBe(true)
})
