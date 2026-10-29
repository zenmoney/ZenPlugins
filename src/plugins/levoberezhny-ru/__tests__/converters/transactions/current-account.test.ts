import { convertTransactions } from '../../../converters'
import { Account, AccountType } from '../../../../../types/zenmoney'

// Complete selected pfmTape record; source and public substitutions are in fixture provenance.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const source = require('../../fixtures/current-account-operation.json') as { operations: unknown[] }
const account: Account = { id: '900006', type: AccountType.checking, title: 'Test current account', instrument: 'RUB', syncIds: ['40817810000000000002'] }

it('converts an observed current-account transfer with its bank timestamp and stable ID', () => {
  const expected = [{
    date: new Date('2025-12-07T06:38:00.000Z'),
    hold: false,
    movements: [{ id: '900100', account: { id: '900006' }, sum: -31000, fee: 0, invoice: null }],
    merchant: { title: 'Пётр Петрович Примеров', country: null, city: null, mcc: null, location: null },
    comment: 'Перевод средств по номеру телефона +7 (900) 000-00-00. Без налога (НДС)'
  }]
  expect(convertTransactions([source.operations[0]], account, new Date('2025-12-01T00:00:00+03:00'))).toEqual(expected)
  expect(convertTransactions(source.operations, account, new Date('2026-01-01T00:00:00+03:00'))).toEqual([])
})

it('converts the complete incoming current-account record, retaining purpose and bank time without a zone tag', () => {
  const expected = [{
    date: new Date('2025-12-03T11:25:00.000Z'),
    hold: false,
    movements: [{ id: '900101', account: { id: '900006' }, sum: 31000, fee: 0, invoice: null }],
    merchant: { title: 'Иван Иванович Тестов', country: null, city: null, mcc: null, location: null },
    comment: 'Перевод собственных средств. Без налога (НДС).'
  }]
  expect(convertTransactions([source.operations[1]], account, new Date('2025-12-01T00:00:00+03:00'))).toEqual(expected)
})

it('preserves both observed current-account movements once across repeated conversion', () => {
  const from = new Date('2025-12-01T00:00:00+03:00')
  const result = convertTransactions(source.operations, account, from)
  expect(result).toHaveLength(2)
  expect(result.map(item => item.movements[0].id)).toEqual(['900100', '900101'])
  expect(convertTransactions(source.operations, account, from)).toEqual(result)
  expect(convertTransactions(source.operations, account, new Date('2026-01-01T00:00:00+03:00'))).toEqual([])
})
