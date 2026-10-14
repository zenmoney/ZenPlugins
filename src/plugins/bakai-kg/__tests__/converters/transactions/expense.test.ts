import { readFileSync } from 'fs'
import { join } from 'path'
import { convertTransaction } from '../../../converters'
import { AccountType, ExtendedTransaction } from '../../../../../types/zenmoney'

interface Case { name: string, class: string, accountId: number, operation: unknown, expected: Omit<ExtendedTransaction, 'date'> & { date: string } }
const cases = JSON.parse(readFileSync(join(__dirname, '../../fixtures/transaction-cases.json'), 'utf8')) as Case[]

it.each(cases.filter(row => row.class === 'expense'))('$name preserves the full observed financial result', (row) => {
  const instrument = row.accountId === 1006 ? 'USD' : 'KGS'
  const account = { id: String(row.accountId), type: AccountType.ccard as const, title: 'Test card', instrument, syncIds: [] }
  expect(convertTransaction(row.operation, account)).toEqual({ ...row.expected, date: new Date(row.expected.date) })
})
