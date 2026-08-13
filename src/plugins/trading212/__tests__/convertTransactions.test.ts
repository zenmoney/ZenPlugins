import { Movement } from '../../../types/zenmoney'
import { convertTransactions } from '../converters'
import { ExportOperation, Preferences } from '../models'

const defaultPreferences: Preferences = {
  apiKey: 'test-key',
  apiSecret: 'test-secret',
  roundUpTransactions: false,
  investCashback: false
}

describe('convertTransactions', () => {
  it.each([
    [
      '12345',
      '12345-card',
      [
        { ID: 'abc-123', Action: 'Market buy', Time: '2026-01-15 10:30:00', 'Gross Total': '-1000', 'Currency (Gross Total)': 'EUR' },
        { ID: 'abc-456', Action: 'Market sell', Time: '2026-01-16 14:20:00', 'Gross Total': '500', 'Currency (Gross Total)': 'EUR' }
      ] as ExportOperation[],
      [
        {
          hold: false,
          date: new Date('2026-01-15 10:30:00'),
          movements: [{ id: 'abc-123', account: { id: '12345' }, invoice: null, sum: -1000, fee: 0 }],
          comment: 'Market buy',
          merchant: null
        },
        {
          hold: false,
          date: new Date('2026-01-16 14:20:00'),
          movements: [{ id: 'abc-456', account: { id: '12345' }, invoice: null, sum: 500, fee: 0 }],
          comment: 'Market sell',
          merchant: null
        }
      ]
    ],
    [
      '67890',
      '67890-card',
      [
        { ID: 'div-001', Action: 'Dividend (Tax)', Time: '2026-02-01 09:00:00', 'Gross Total': '-2.50', 'Currency (Gross Total)': 'USD' },
        { ID: 'div-002', Action: 'Dividend (Dividend)', Time: '2026-02-01 09:00:00', 'Gross Total': '25.00', 'Currency (Gross Total)': 'USD' },
        { ID: 'fee-001', Action: 'Stop limit order', Time: '2026-02-01 09:00:01', 'Gross Total': '-1.00', 'Currency (Gross Total)': 'USD' }
      ] as ExportOperation[],
      [
        {
          hold: false,
          date: new Date('2026-02-01 09:00:00'),
          movements: [{ id: 'div-001', account: { id: '67890' }, invoice: null, sum: -2.50, fee: 0 }],
          comment: 'Dividend (Tax)',
          merchant: null
        },
        {
          hold: false,
          date: new Date('2026-02-01 09:00:00'),
          movements: [{ id: 'div-002', account: { id: '67890' }, invoice: null, sum: 25.00, fee: 0 }],
          comment: 'Dividend (Dividend)',
          merchant: null
        },
        {
          hold: false,
          date: new Date('2026-02-01 09:00:01'),
          movements: [{ id: 'fee-001', account: { id: '67890' }, invoice: null, sum: -1.00, fee: 0 }],
          comment: 'Stop limit order',
          merchant: null
        }
      ]
    ],
    [
      'empty-account',
      'empty-account-card',
      [] as ExportOperation[],
      []
    ]
  ])('converts export operations to zenmoney format', (accountId, cardId, operations, expected) => {
    expect(convertTransactions(operations, accountId, cardId, defaultPreferences)).toEqual(expected)
  })

  it('routes Card debit to card account', () => {
    const operations: ExportOperation[] = [
      { ID: 'card-001', Action: 'Card debit', Time: '2026-03-01 12:00:00', 'Gross Total': '-15.50', 'Currency (Gross Total)': 'EUR', 'Merchant name': 'Coffee Shop', 'Merchant category': 'Food & Drinks' }
    ]
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', defaultPreferences)
    expect(result).toHaveLength(1)
    expect(result[0].movements[0].account).toEqual({ id: 'acc-1-card' })
    expect(result[0].merchant).toMatchObject({ fullTitle: 'Coffee Shop', category: 'Food & Drinks' })
  })

  it('routes Spending cashback to card account when investCashback is false', () => {
    const operations: ExportOperation[] = [
      { ID: 'cashback-001', Action: 'Spending cashback', Time: '2026-03-01 12:00:00', 'Gross Total': '0.50', 'Currency (Gross Total)': 'EUR' }
    ]
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', defaultPreferences)
    expect(result).toHaveLength(1)
    expect(result[0].movements[0].account).toEqual({ id: 'acc-1-card' })
  })

  it('routes Spending cashback to investment account when investCashback is true', () => {
    const operations: ExportOperation[] = [
      { ID: 'cashback-002', Action: 'Spending cashback', Time: '2026-03-01 12:00:00', 'Gross Total': '0.75', 'Currency (Gross Total)': 'EUR' }
    ]
    const prefs: Preferences = { ...defaultPreferences, investCashback: true }
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', prefs)
    expect(result).toHaveLength(1)
    expect(result[0].movements[0].account).toEqual({ id: 'acc-1' })
  })

  it('converts current export fields for interest on cash', () => {
    const operations: ExportOperation[] = [
      { ID: 'interest-001', Action: 'Interest on cash', 'Time (UTC)': '2026-07-18 01:15:00', Total: '2.48', 'Currency (Total)': 'USD' }
    ]
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', defaultPreferences)

    expect(result).toHaveLength(1)
    expect(result[0].date).toEqual(new Date('2026-07-18T01:15:00Z'))
    expect(result[0].movements[0].sum).toBe(2.48)
  })

  it('adds round-up transaction for Card debit when roundUpTransactions is enabled', () => {
    const operations: ExportOperation[] = [
      { ID: 'round-001', Action: 'Card debit', Time: '2026-04-01 10:00:00', 'Gross Total': '-12.30', 'Currency (Gross Total)': 'EUR' }
    ]
    const prefs: Preferences = { ...defaultPreferences, roundUpTransactions: true }
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', prefs)
    expect(result).toHaveLength(2)

    // First transaction: the card debit itself
    expect(result[0].movements[0].account).toEqual({ id: 'acc-1-card' })
    expect(result[0].movements[0].sum).toBe(-12.30)

    // Second transaction: round-up (card -> investment)
    expect(result[1].comment).toBe('Round up')
    expect(result[1].movements).toHaveLength(2)
    // Card leg: -0.70
    expect(result[1].movements[0].account).toEqual({ id: 'acc-1-card' })
    expect(result[1].movements[0].sum).toBe(-0.70)
    // Investment leg: +0.70
    const movements = result[1].movements as [Movement, Movement]
    expect(movements[1].account).toEqual({ id: 'acc-1' })
    expect(movements[1].sum).toBe(0.70)
  })

  it('does not add round-up when the amount is already whole', () => {
    const operations: ExportOperation[] = [
      { ID: 'round-002', Action: 'Card debit', Time: '2026-04-01 10:00:00', 'Gross Total': '-15.00', 'Currency (Gross Total)': 'EUR' }
    ]
    const prefs: Preferences = { ...defaultPreferences, roundUpTransactions: true }
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', prefs)
    // Only the card debit, no round-up (amount is already whole)
    expect(result).toHaveLength(1)
    expect(result[0].movements[0].sum).toBe(-15.00)
  })
})
