import type { Transaction } from '../../../../../types/zenmoney'

interface Converter {
  convertTransaction: (record: unknown, account: { id: string, instrument: string }, sourceType?: string) => Transaction | null
}
const { convertTransaction } = jest.requireActual<Converter>('../../../converters')
const { toZenMoneyTransaction } = jest.requireActual<{
  toZenMoneyTransaction: (transaction: Transaction, accounts: Record<string, { instrument: string }>) => unknown
}>('../../../../../common/converters')
const { record } = jest.requireActual<{ record: Record<string, unknown> }>('../../../__fixtures__/checking-today.projected.json')
const account = { id: '12-702-1001', instrument: 'ILS' }
const expected: Transaction = {
  hold: null,
  date: new Date('2026-10-15T00:00:00+02:00'),
  movements: [{ id: null, account: { id: account.id }, invoice: null, sum: -100, fee: 0 }],
  merchant: { country: null, city: null, title: 'Captured counterparty', mcc: null, location: null },
  comment: null
}

describe('captured Hapoalim checking TODAY projection', () => {
  it('preserves the observed operation without guessing settlement or inventing an ID [STATUS-001, ID-001]', () => {
    expect(convertTransaction(record, account)).toEqual(expected)
  })

  it('preserves the complete SDK transaction without a false settled/pending flag', () => {
    const transaction = convertTransaction(record, account)
    if (transaction === null) throw new Error('Captured TODAY operation was lost')
    expect(toZenMoneyTransaction(transaction, { [account.id]: account })).toEqual({
      date: expected.date,
      comment: null,
      payee: 'Captured counterparty',
      mcc: null,
      id: null,
      income: 0,
      incomeAccount: account.id,
      outcome: 100,
      outcomeAccount: account.id
    })
  })
})

// [model] Invariants over the captured shape, not evidence of additional bank
// statuses, a booked counterpart, or the closed-source app's reconciliation.
describe('[model] TODAY validation and repeatability', () => {
  it('returns the same complete operation on repeats without mutating the source or caching it', () => {
    const original = JSON.stringify(record)
    expect(convertTransaction(record, account)).toEqual(expected)
    expect(convertTransaction(record, account)).toEqual(expected)
    expect(JSON.stringify(record)).toBe(original)
  })

  it('does not collapse two equal-looking operations with serial zero', () => {
    expect([record, { ...record }].map(row => convertTransaction(row, account))).toEqual([expected, expected])
  })

  it('does not reinterpret yesterday\'s captured bucket using the import clock', () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    try {
      for (const now of ['2026-10-15T23:59:59Z', '2026-10-16T00:00:01Z', '2027-01-01T00:00:00Z']) {
        jest.setSystemTime(new Date(now))
        expect(convertTransaction(record, account)).toEqual(expected)
      }
    } finally { jest.useRealTimers() }
  })

  it('keeps otherwise equal operations on different parent accounts separate', () => {
    const second = { id: '12-702-1002', instrument: 'ILS' }
    expect([convertTransaction(record, account), convertTransaction(record, second)]).toEqual([
      expected, { ...expected, movements: [{ ...expected.movements[0], account: { id: second.id } }] }
    ])
  })

  it.each([
    { transactionType: 'PENDING' }, { transactionType: undefined },
    { rejectedDataEventPertainingIndication: 'Y' }, { rejectedDataEventPertainingIndication: 'N' },
    { rejectedDataEventPertainingIndication: undefined },
    { serialNumber: undefined }, { serialNumber: 1 }, { serialNumber: '0' }
  ])('rejects unsupported variants instead of turning them into unknown/pending operations: %j', change => {
    expect(() => convertTransaction({ ...record, ...change }, account)).toThrow('unexpected transaction status')
  })

  it('does not extend the observed checking variant to FX', () => {
    expect(() => convertTransaction({ ...record, currencySwiftCode: 'ILS' }, account, 'foreignCurrencyAccount')).toThrow('unexpected transaction status')
  })

  it.each([
    { eventAmount: -1 }, { eventAmount: NaN }, { eventAmount: Infinity }, { eventAmount: '100' },
    { eventActivityTypeCode: 0 }, { formattedEventDate: '2026-02-30T00:00:00.000Z' }
  ])('does not let TODAY bypass required financial validation: %j', change => {
    expect(() => convertTransaction({ ...record, ...change }, account)).toThrow()
  })

  it('does not fabricate a zero transaction for the supported zero-amount convention', () => {
    expect(convertTransaction({ ...record, eventAmount: 0 }, account)).toBeNull()
  })
})
