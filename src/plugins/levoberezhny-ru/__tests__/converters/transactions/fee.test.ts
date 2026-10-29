import { convertTransactions } from '../../../converters'
import { Account, AccountType } from '../../../../../types/zenmoney'

// Complete selected source object: fixture provenance documents the browser capture.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const source = require('../../fixtures/operations.json') as { operations: unknown[] }
const account: Account = { id: '900002', type: AccountType.ccard, title: 'Test', instrument: 'RUB', syncIds: ['test-account'] }

it('converts the complete fee source record with a stable bank ID', () => {
  const expected = { ...{ hold: false, movements: [{ id: '900004', account: { id: '900002' }, sum: -99, fee: 0, invoice: null }], merchant: { title: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)', country: null, city: null, mcc: null, location: null }, comment: 'Ежемесячная плата за пакет услуг "Основа" по счету *0001 за сентябрь' }, date: new Date('2026-10-10T02:05:00.000Z') }
  const result = convertTransactions([source.operations[2]], account, new Date('2025-01-01T00:00:00Z'))
  expect(result).toEqual([expected])
  expect(convertTransactions([source.operations[2]], account, new Date('2025-01-01T00:00:00Z'))).toEqual(result)
})
