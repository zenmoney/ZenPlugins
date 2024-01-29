import { convertTransactionInProgress } from '../../../converters'

describe('RSD in progress', () => {
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
          }]
      })
  })
})
