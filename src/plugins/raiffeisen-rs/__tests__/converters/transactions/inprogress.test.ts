import { convertTransactionInProgress } from '../../../converters'

describe('transactions in progress', () => {
  it('RSD in progress', () => {
    expect(convertTransactionInProgress(
      [
        '',
        '18.01.2024 17:33:32',
        'AROMA 7                  Beograd      RS',
        '293.96',
        'RSD',
        '941',
        '',
        '',
        ''
      ],
      '265057000005597777')).toEqual(
      {
        comment: null,
        date: new Date('2024-01-18T17:33:32'),
        hold: true,
        merchant: {
          fullTitle: 'AROMA 7                  Beograd      RS',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: {
              id: '265057000005597777RSD'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -293.96
          }
        ]
      })
  })

  it('EUR in progress', () => {
    expect(convertTransactionInProgress(
      [
        '',
        '13.07.2025 17:08:55',
        '',
        '1.02',
        'EUR',
        '978',
        '',
        '',
        ''
      ],
      '265057000005597777')).toEqual(
      {
        hold: true,
        date: new Date('2025-07-13T17:08:55'),
        movements: [
          {
            id: null,
            account: { id: '265057000005597777EUR' },
            invoice: null,
            sum: -1.02,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      })
  })
})
