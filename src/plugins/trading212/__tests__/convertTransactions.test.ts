import { convertTransactions } from '../converters'
import { ApiTransaction } from '../models'

describe('convertTransactions', () => {
  it.each([
    [
      '12345',
      [
        { type: 'DEPOSIT', dateTime: '2026-01-15T10:30:00Z', reference: '019be923-b231-74b2-af67-f57829f479fc', amount: 1000 },
        { type: 'WITHDRAW', dateTime: '2026-01-16T14:20:00Z', reference: 'd9cd1d17-f010-45f9-90ef-99a825387795', amount: -500 }
      ],
      [
        {
          hold: false,
          date: new Date('2026-01-15T10:30:00Z'),
          movements: [{ id: '019be923-b231-74b2-af67-f57829f479fc', account: { id: '12345' }, invoice: null, sum: 1000, fee: 0 }],
          comment: 'Deposit',
          merchant: null
        },
        {
          hold: false,
          date: new Date('2026-01-16T14:20:00Z'),
          movements: [{ id: 'd9cd1d17-f010-45f9-90ef-99a825387795', account: { id: '12345' }, invoice: null, sum: -500, fee: 0 }],
          comment: 'Withdrawal',
          merchant: null
        }
      ]
    ],
    [
      '67890',
      [
        { type: 'TRANSFER', dateTime: '2026-02-01T09:00:00Z', reference: '5844048e-743f-42df-b109-b3ec9db2b721', amount: 2500 },
        { type: 'FEE', dateTime: '2026-02-01T09:00:01Z', reference: '049517c3-a11b-4d6f-a6ee-0191fb8be9ac', amount: -2.50 }
      ],
      [
        {
          hold: false,
          date: new Date('2026-02-01T09:00:00Z'),
          movements: [{ id: '5844048e-743f-42df-b109-b3ec9db2b721', account: { id: '67890' }, invoice: null, sum: 2500, fee: 0 }],
          comment: 'Internal transfer',
          merchant: null
        },
        {
          hold: false,
          date: new Date('2026-02-01T09:00:01Z'),
          movements: [{ id: '049517c3-a11b-4d6f-a6ee-0191fb8be9ac', account: { id: '67890' }, invoice: null, sum: -2.50, fee: 0 }],
          comment: 'Transaction fee',
          merchant: null
        }
      ]
    ],
    [
      'empty-account',
      [],
      []
    ]
  ])('converts api transactions to zenmoney format', (accountId, apiTransactions, expected) => {
    expect(convertTransactions(apiTransactions as ApiTransaction[], accountId)).toEqual(expected)
  })
})
