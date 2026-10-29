import { convertTransactions } from '../../../converters'
import { Account, AccountType } from '../../../../../types/zenmoney'

// Complete selected source object: fixture provenance documents the browser capture.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const source = require('../../fixtures/operations.json') as { operations: unknown[] }
const account: Account = { id: '900002', type: AccountType.ccard, title: 'Test', instrument: 'RUB', syncIds: ['test-account'] }

it('converts the complete purchase source record with a stable bank ID', () => {
  const expected = { ...{ hold: false, movements: [{ id: '900005', account: { id: '900002' }, sum: -300, fee: 0, invoice: null }], merchant: { title: 'PMP TRC AURA', city: 'NOVOSIBIRSK', country: 'RU', mcc: 7523, location: null }, comment: null }, date: new Date('2026-02-23T13:23:00.000Z') }
  const result = convertTransactions([source.operations[3]], account, new Date('2025-01-01T00:00:00Z'))
  expect(result).toEqual([expected])
  expect(convertTransactions([source.operations[3]], account, new Date('2025-01-01T00:00:00Z'))).toEqual(result)
})

it('keeps the bank ID when a held purchase becomes completed', () => {
  const held = { ...(source.operations[3] as Record<string, unknown>), hold: true }
  const completed = { ...held, hold: false }
  const [heldTransaction] = convertTransactions([held], account, new Date('2025-01-01T00:00:00Z'))
  const [completedTransaction] = convertTransactions([completed], account, new Date('2025-01-01T00:00:00Z'))

  expect(heldTransaction.hold).toBe(true)
  expect(completedTransaction.hold).toBe(false)
  expect(completedTransaction.movements).toEqual(heldTransaction.movements)
})
