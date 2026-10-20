import { readFileSync } from 'fs'
import { join } from 'path'
import { AccountType, ExtendedTransaction } from '../../../../../types/zenmoney'
import { convertTransaction, convertTransactions } from '../../../converters'

interface Lifecycle {
  before: unknown
  after: unknown
  expectedBefore: Omit<ExtendedTransaction, 'date'> & { date: string }
  expectedAfter: Omit<ExtendedTransaction, 'date'> & { date: string }
}
const sample = JSON.parse(readFileSync(join(__dirname, '../../fixtures/lifecycle.json'), 'utf8')) as Lifecycle
const account = { id: '1006', type: AccountType.ccard as const, title: 'Test card', instrument: 'USD', syncIds: [] }

it('preserves movement identity across actual numeric/OPTP lifecycle representations (ID-001)', () => {
  const before = convertTransaction(sample.before, account)
  const after = convertTransaction(sample.after, account)
  expect(before).toEqual({ ...sample.expectedBefore, date: new Date(sample.expectedBefore.date) })
  expect(after).toEqual({ ...sample.expectedAfter, date: new Date(sample.expectedAfter.date) })
  expect(before.movements[0].id).toBe(after.movements[0].id)
})

it('includes both exact output boundaries and leaves a nullish upper bound unbounded (DATE-001)', () => {
  const date = new Date(sample.expectedBefore.date)
  const expected = [{ ...sample.expectedBefore, date }]
  expect(convertTransactions([sample.before], account, date, date)).toEqual(expected)
  expect(convertTransactions([sample.before], account, date)).toEqual(expected)
  expect(convertTransactions([sample.before], account, new Date(date.getTime() + 1))).toEqual([])
  expect(convertTransactions([sample.before], account, new Date(0), new Date(date.getTime() - 1))).toEqual([])
})

it('[model] rejects conflicting identities instead of returning two host-overwriting movements', () => {
  // Model accidental combination of two actual lifecycle observations, not a current bank response.
  expect(() => convertTransactions([sample.before, sample.after], account, new Date(0))).toThrow('Duplicate bank movement identity')
})
