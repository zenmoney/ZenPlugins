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
      'EUR',
      [
        { ID: 'abc-123', Action: 'Market buy', Time: '2026-01-15 10:30:00', 'Gross Total': '-1000', 'Currency (Gross Total)': 'EUR' },
        { ID: 'abc-456', Action: 'Market sell', Time: '2026-01-16 14:20:00', 'Gross Total': '500', 'Currency (Gross Total)': 'EUR' }
      ] as ExportOperation[],
      [
        {
          hold: false,
          date: new Date('2026-01-15 10:30:00+00:00'),
          movements: [{ id: 'abc-123', account: { id: '12345' }, invoice: null, sum: -1000, fee: 0 }],
          comment: 'Market buy',
          merchant: null
        },
        {
          hold: false,
          date: new Date('2026-01-16 14:20:00+00:00'),
          movements: [{ id: 'abc-456', account: { id: '12345' }, invoice: null, sum: 500, fee: 0 }],
          comment: 'Market sell',
          merchant: null
        }
      ]
    ],
    [
      '67890',
      '67890-card',
      'USD',
      [
        { ID: 'div-001', Action: 'Dividend (Tax)', 'Time (UTC)': '2026-02-01 09:00:00+00:00', Total: '-2.50', 'Currency (Total)': 'USD' },
        { ID: 'div-002', Action: 'Dividend (Dividend)', 'Time (UTC)': '2026-02-01 09:00:00+00:00', Total: '25.00', 'Currency (Total)': 'USD' },
        { ID: 'fee-001', Action: 'Stop limit order', 'Time (UTC)': '2026-02-01 09:00:01+00:00', Total: '-1.00', 'Currency (Total)': 'USD' }
      ] as ExportOperation[],
      [
        {
          hold: false,
          date: new Date('2026-02-01 09:00:00+00:00'),
          movements: [{ id: 'div-001', account: { id: '67890' }, invoice: null, sum: -2.50, fee: 0 }],
          comment: 'Dividend (Tax)',
          merchant: null
        },
        {
          hold: false,
          date: new Date('2026-02-01 09:00:00+00:00'),
          movements: [{ id: 'div-002', account: { id: '67890' }, invoice: null, sum: 25.00, fee: 0 }],
          comment: 'Dividend (Dividend)',
          merchant: null
        },
        {
          hold: false,
          date: new Date('2026-02-01 09:00:01+00:00'),
          movements: [{ id: 'fee-001', account: { id: '67890' }, invoice: null, sum: -1.00, fee: 0 }],
          comment: 'Stop limit order',
          merchant: null
        }
      ]
    ],
    [
      'empty-account',
      'empty-account-card',
      'EUR',
      [] as ExportOperation[],
      []
    ]
  ])('converts export operations to zenmoney format', (accountId, cardId, accountCurrency, operations, expected) => {
    expect(convertTransactions(operations, accountId, cardId, accountCurrency, defaultPreferences)).toEqual(expected)
  })

  it('routes Card debit to card account', () => {
    const operations: ExportOperation[] = [
      { ID: 'card-001', Action: 'Card debit', Time: '2026-03-01 12:00:00', 'Gross Total': '-15.50', 'Currency (Gross Total)': 'EUR', 'Merchant name': 'Coffee Shop', 'Merchant category': 'Food & Drinks' }
    ]
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', 'EUR', defaultPreferences)
    expect(result).toHaveLength(1)
    expect(result[0].movements[0].account).toEqual({ id: 'acc-1-card' })
    expect(result[0].merchant).toMatchObject({ fullTitle: 'Coffee Shop', category: 'Food & Drinks' })
  })

  it('routes Spending cashback to card account when investCashback is false', () => {
    const operations: ExportOperation[] = [
      { ID: 'cashback-001', Action: 'Spending cashback', Time: '2026-03-01 12:00:00', 'Gross Total': '0.50', 'Currency (Gross Total)': 'EUR' }
    ]
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', 'EUR', defaultPreferences)
    expect(result).toHaveLength(1)
    expect(result[0].movements[0].account).toEqual({ id: 'acc-1-card' })
  })

  it('routes Spending cashback to investment account when investCashback is true', () => {
    const operations: ExportOperation[] = [
      { ID: 'cashback-002', Action: 'Spending cashback', Time: '2026-03-01 12:00:00', 'Gross Total': '0.75', 'Currency (Gross Total)': 'EUR' }
    ]
    const prefs: Preferences = { ...defaultPreferences, investCashback: true }
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', 'EUR', prefs)
    expect(result).toHaveLength(1)
    expect(result[0].movements[0].account).toEqual({ id: 'acc-1' })
  })

  it('converts current export fields for interest on cash in primary and foreign currencies', () => {
    // Observed CSV export rows (IDs sanitized) for a EUR primary account holding EUR and USD cash
    const operations: ExportOperation[] = [
      { ID: 'interest-eur-001', Action: 'Interest on cash', 'Time (UTC)': '2026-11-24 02:04:27+00:00', Notes: 'Interest on cash', Total: '1.38', 'Currency (Total)': 'EUR' },
      { ID: 'interest-usd-001', Action: 'Interest on cash', 'Time (UTC)': '2026-11-24 02:04:27+00:00', Notes: 'Interest on cash', Total: '2.77', 'Currency (Total)': 'USD' }
    ]

    expect(convertTransactions(operations, 'acc-1', 'acc-1-card', 'EUR', defaultPreferences)).toEqual([
      {
        hold: false,
        date: new Date('2026-11-24T02:04:27Z'),
        movements: [{ id: 'interest-eur-001', account: { id: 'acc-1' }, invoice: null, sum: 1.38, fee: 0 }],
        comment: 'Interest on cash',
        merchant: null
      },
      {
        hold: false,
        date: new Date('2026-11-24T02:04:27Z'),
        movements: [{ id: 'interest-usd-001', account: { id: 'acc-1' }, invoice: { sum: 2.77, instrument: 'USD' }, sum: null, fee: 0 }],
        comment: 'Interest on cash',
        merchant: null
      }
    ])
  })

  it('converts deposits, withdrawals, and currency conversion rows with operation currencies and notes', () => {
    // Observed CSV export rows (IDs sanitized) for a EUR primary account:
    // EUR bank deposit, USD bank deposit, in-app currency conversion fee, and CFD FX transfer legs
    const operations: ExportOperation[] = [
      { ID: 'dep-eur-001', Action: 'Deposit', 'Time (UTC)': '2026-11-21 11:30:08+00:00', Notes: 'Bank Transfer', Total: '5800.00', 'Currency (Total)': 'EUR' },
      {
        ID: 'conv-001',
        Action: 'Currency conversion',
        'Time (UTC)': '2026-11-21 19:36:52+00:00',
        Notes: '2197.38 USD -> 2003.00 EUR',
        Total: '-3.00',
        'Currency (Total)': 'EUR',
        'Currency conversion from amount': '2197.38',
        'Currency (Currency conversion from amount)': 'USD',
        'Currency conversion to amount': '2003.00',
        'Currency (Currency conversion to amount)': 'EUR',
        'Currency conversion fee': '-3.00',
        'Currency (Currency conversion fee)': 'EUR'
      },
      { ID: 'dep-usd-001', Action: 'Deposit', 'Time (UTC)': '2026-11-23 09:15:03+00:00', Notes: 'Bank Transfer', Total: '6462.07', 'Currency (Total)': 'USD' },
      { ID: 'wd-usd-001', Action: 'Withdrawal', 'Time (UTC)': '2026-11-24 08:52:58+00:00', Total: '-10000.00', 'Currency (Total)': 'USD' },
      { ID: 'dep-cfd-eur-001', Action: 'Deposit', 'Time (UTC)': '2026-11-24 08:53:29+00:00', Total: '9162.62', 'Currency (Total)': 'EUR' }
    ]

    expect(convertTransactions(operations, 'acc-1', 'acc-1-card', 'EUR', defaultPreferences)).toEqual([
      {
        hold: false,
        date: new Date('2026-11-21T11:30:08Z'),
        movements: [
          { id: 'dep-eur-001', account: { id: 'acc-1' }, invoice: null, sum: 5800, fee: 0 },
          { id: null, account: { type: null, instrument: 'EUR', company: null, syncIds: null }, invoice: null, sum: -5800, fee: 0 }
        ],
        comment: 'Deposit: Bank Transfer',
        merchant: null
      },
      {
        hold: false,
        date: new Date('2026-11-21T19:36:52Z'),
        movements: [
          { id: 'conv-001', account: { id: 'acc-1' }, invoice: null, sum: -3, fee: 0 }
        ],
        comment: 'Currency conversion: 2197.38 USD -> 2003.00 EUR',
        merchant: null
      },
      {
        hold: false,
        date: new Date('2026-11-23T09:15:03Z'),
        movements: [
          { id: 'dep-usd-001', account: { id: 'acc-1' }, invoice: { sum: 6462.07, instrument: 'USD' }, sum: null, fee: 0 },
          { id: null, account: { type: null, instrument: 'USD', company: null, syncIds: null }, invoice: null, sum: -6462.07, fee: 0 }
        ],
        comment: 'Deposit: Bank Transfer',
        merchant: null
      },
      {
        hold: false,
        date: new Date('2026-11-24T08:52:58Z'),
        movements: [
          { id: 'wd-usd-001', account: { id: 'acc-1' }, invoice: { sum: -10000, instrument: 'USD' }, sum: null, fee: 0 },
          { id: null, account: { type: null, instrument: 'USD', company: null, syncIds: null }, invoice: null, sum: 10000, fee: 0 }
        ],
        comment: 'Withdrawal',
        merchant: null
      },
      {
        hold: false,
        date: new Date('2026-11-24T08:53:29Z'),
        movements: [
          { id: 'dep-cfd-eur-001', account: { id: 'acc-1' }, invoice: null, sum: 9162.62, fee: 0 },
          { id: null, account: { type: null, instrument: 'EUR', company: null, syncIds: null }, invoice: null, sum: -9162.62, fee: 0 }
        ],
        comment: 'Deposit',
        merchant: null
      }
    ])
  })

  it('adds round-up transaction for Card debit when roundUpTransactions is enabled', () => {
    const operations: ExportOperation[] = [
      { ID: 'round-001', Action: 'Card debit', Time: '2026-04-01 10:00:00', 'Gross Total': '-12.30', 'Currency (Gross Total)': 'EUR' }
    ]
    const prefs: Preferences = { ...defaultPreferences, roundUpTransactions: true }
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', 'EUR', prefs)
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
    const result = convertTransactions(operations, 'acc-1', 'acc-1-card', 'EUR', prefs)
    // Only the card debit, no round-up (amount is already whole)
    expect(result).toHaveLength(1)
    expect(result[0].movements[0].sum).toBe(-15.00)
  })
})
