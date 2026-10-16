import { readFileSync } from 'fs'
import { join } from 'path'
import get, { getArray } from '../../../../../types/get'
import { convertAccounts, convertTransactions } from '../../../converters'

const products: unknown = JSON.parse(readFileSync(join(__dirname, '../../fixtures/products.json'), 'utf8'))
const history: unknown = JSON.parse(readFileSync(join(__dirname, '../../fixtures/account-history.json'), 'utf8'))
const expected: unknown[] = JSON.parse(readFileSync(join(__dirname, '../../fixtures/account-history-expected.json'), 'utf8'))
const account = convertAccounts(getArray(products, 'list')).find(plan => plan.account.id === '1009')?.account
assert(account != null, 'Expected KGS checking account')
const records = getArray(get(history, 'response'), 'operations')
const fromDate = new Date('2018-08-06T00:00:00+06:00')
const toDate = new Date('2021-08-06T23:59:59+06:00')

function serialize (value: unknown): unknown {
  return JSON.parse(JSON.stringify(value))
}

it('preserves all 60 observed account movements and purposes, including separate fee postings (AMOUNT, COMMENT, ID)', () => {
  expect(serialize(convertTransactions(records, account, fromDate, toDate))).toEqual(expected)
  expect(serialize(convertTransactions([...records].reverse(), account, fromDate, toDate))).toEqual([...expected].reverse())
})

it('filters account history by inclusive dates and preserves both postings at the same timestamp', () => {
  const date = new Date('2020-06-04T09:34:46+06:00')
  expect(serialize(convertTransactions(records, account, date, date))).toEqual(expected.slice(0, 2))
  expect(convertTransactions(records, account, new Date('2021-02-06T00:00:00+06:00'))).toEqual([])
})
