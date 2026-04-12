import { AccountType } from '../../../../types/zenmoney'
import { convertPdfStatementTransaction } from '../../converters/transactions'
import { ConvertedAccount, StatementTransaction } from '../../models'

const account: ConvertedAccount = {
  account: {
    id: 'KZ001',
    balance: 100,
    instrument: 'KZT',
    syncIds: ['KZ001'],
    title: 'Home Credit *1234',
    type: AccountType.ccard
  },
  date: new Date('2026-04-05')
}

describe('convertPdfStatementTransaction', () => {
  it('converts negative purchase to outcome movement', () => {
    const raw: StatementTransaction = {
      hold: false,
      date: '2026-04-04T00:00:00.000',
      originalAmount: null,
      amount: '- 134,00 ₸',
      description: 'YANDEX.GO — Purchases and spending',
      statementUid: 's1',
      originString: ''
    }
    const out = convertPdfStatementTransaction(raw, account)
    expect(out).not.toBeNull()
    if (out == null) {
      return
    }
    expect(out.transaction.movements[0].sum).toBe(-134)
    expect(out.transaction.merchant).toEqual({
      fullTitle: 'YANDEX.GO',
      mcc: null,
      location: null
    })
  })

  it('converts positive refill', () => {
    const raw: StatementTransaction = {
      hold: false,
      date: '2026-03-31T00:00:00.000',
      originalAmount: null,
      amount: '+ 50 000,00 ₸',
      description: 'Transfer from "X" — Refills',
      statementUid: 's2',
      originString: ''
    }
    const out = convertPdfStatementTransaction(raw, account)
    expect(out).not.toBeNull()
    if (out == null) {
      return
    }
    expect(out.transaction.movements[0].sum).toBe(50000)
  })

  it('returns null for zero sum', () => {
    const raw: StatementTransaction = {
      hold: false,
      date: '2026-01-01T00:00:00.000',
      originalAmount: null,
      amount: '+ 0,00 ₸',
      description: 'X',
      statementUid: 's3',
      originString: ''
    }
    expect(convertPdfStatementTransaction(raw, account)).toBeNull()
  })

  it('returns null for empty amount', () => {
    const raw: StatementTransaction = {
      hold: false,
      date: '2026-01-01T00:00:00.000',
      originalAmount: null,
      amount: '   ',
      description: null,
      statementUid: 's4',
      originString: ''
    }
    expect(convertPdfStatementTransaction(raw, account)).toBeNull()
  })
})
