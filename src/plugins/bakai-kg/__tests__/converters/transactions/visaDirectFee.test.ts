import { AccountType, ExtendedTransaction } from '../../../../../types/zenmoney'
import { convertTransactions } from '../../../converters'

const fixture: { operations: unknown[] } = jest.requireActual('../../../__fixtures__/visa-direct-fee-178204.json')
const account = { id: 'card', type: AccountType.ccard as const, title: 'USD card', instrument: 'USD', syncIds: [] }
const expected: ExtendedTransaction[] = [{
  date: new Date('2026-10-24T07:33:06Z'),
  hold: null,
  movements: [
    { id: '100000001:debit', account: { id: 'card' }, invoice: null, sum: -80, fee: 0 },
    { id: null, account: { type: null, instrument: 'USD', company: null, syncIds: null }, invoice: null, sum: 80, fee: 0 }
  ],
  merchant: { title: 'MB Visa Direct', city: null, country: null, mcc: 6012, location: null },
  comment: null
}, {
  date: new Date('2026-10-24T07:33:06Z'),
  hold: null,
  movements: [{ id: '100000001:debit:fee', account: { id: 'card' }, invoice: null, sum: -2, fee: 0 }],
  merchant: { title: 'MB Visa Direct', city: null, country: null, mcc: null, location: null },
  comment: null
}]

it('imports the Visa Direct principal and its separate fee exactly once (AMOUNT-002, ID-001)', () => {
  const transactions = convertTransactions(fixture.operations, account, new Date(0))
  expect(transactions).toEqual(expected)
  expect(convertTransactions(fixture.operations, account, new Date(0))).toEqual(expected)
  expect(convertTransactions([...fixture.operations].reverse(), account, new Date(0))).toEqual([...expected].reverse())
  expect(transactions.reduce((sum, transaction) => sum + (transaction.movements[0].sum ?? 0) + transaction.movements[0].fee, 0)).toBe(-82)
})

it('keeps the same identities when either complete record is loaded on its own (ID-001)', () => {
  for (let i = 0; i < fixture.operations.length; i++) {
    expect(convertTransactions([fixture.operations[i]], account, new Date(0))).toEqual([expected[i]])
  }
})
