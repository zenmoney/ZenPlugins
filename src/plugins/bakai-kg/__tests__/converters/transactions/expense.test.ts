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

it('retains the observed account debit as an unpaired movement with a matching key', () => {
  // Complete authorized capture from transaction-cases.json, OPTP0402-KGS-KGS-10.
  // The existing source has no matching account history; grouping must not invent its credit.
  const record = {
    amount: -5620.14,
    currency: 'KGS',
    date: '2021-06-01T15:56:03+06:00',
    date2: '2021-06-01T15:56:03+06:00',
    location: 'TEST BANK POSTING',
    operation_amount: -5620.14,
    operation_currency: 'KGS',
    type: 'Списание со счета',
    type_code: 'OPTP0402',
    utrnno: '000000031',
    merchant_id: 'SJ625769',
    balance: 2504.15,
    rrn: '926339953521',
    mcc: '6010',
    terminal_id: 'SJ625769'
  }
  const account = { id: '1000', type: AccountType.ccard as const, title: 'Test card', instrument: 'KGS', syncIds: [] }
  expect(convertTransaction(record, account)).toEqual({
    hold: null,
    date: new Date('2021-06-01T09:56:03.000Z'),
    movements: [
      {
        id: '000000031:debit',
        account: {
          id: '1000'
        },
        invoice: null,
        sum: -5620.14,
        fee: 0
      }
    ],
    merchant: null,
    comment: null,
    groupKeys: [
      'bakai:KGS:5620.14:27042356'
    ]
  })
})
