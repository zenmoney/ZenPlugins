import { convertTransactions } from '../../../converters'
import { Account, AccountType } from '../../../../../types/zenmoney'

// Complete selected source object: fixture provenance documents the browser capture.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const source = require('../../fixtures/operations.json') as { operations: unknown[] }
const account: Account = { id: '900002', type: AccountType.ccard, title: 'Test', instrument: 'RUB', syncIds: ['test-account'] }

it('converts the complete transfer source record with a stable bank ID', () => {
  const expected = { ...{ hold: false, movements: [{ id: '900000', account: { id: '900002' }, sum: -3500, fee: 0, invoice: null }], merchant: { title: 'Иван Иванович Тестов', country: null, city: null, mcc: null, location: null }, comment: 'Перевод средств по номеру телефона +7 (900) 000-00-00. Без налога (НДС)' }, date: new Date('2026-09-20T08:41:00.000Z') }
  const result = convertTransactions([source.operations[0]], account, new Date('2025-01-01T00:00:00Z'))
  expect(result).toEqual([expected])
  expect(convertTransactions([source.operations[0]], account, new Date('2025-01-01T00:00:00Z'))).toEqual(result)
})
