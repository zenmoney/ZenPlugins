import { handleGroupBy, handleGroups } from './handleGroups'
import { adjustTransactions, mergeTransfersHandler } from './transactionGroupHandler'

describe('mergeTransfers', () => {
  it('merges transfers', () => {
    expect(handleGroups({
      makeGroupKeys: item => item.groupKeys,
      items: [
        {
          hold: false,
          date: new Date('2019-01-05'),
          movements: [
            {
              id: '1',
              account: { id: 'account_1' },
              invoice: null,
              sum: -100,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        },
        {
          hold: true,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '2',
              account: { id: 'account_2' },
              invoice: null,
              sum: 100,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        }
      ],
      handleGroup: handleGroupBy([
        mergeTransfersHandler
      ])
    })).toEqual([
      {
        hold: null,
        date: new Date('2019-01-01'),
        movements: [
          {
            id: '1',
            account: { id: 'account_1' },
            invoice: null,
            sum: -100,
            fee: 0
          },
          {
            id: '2',
            account: { id: 'account_2' },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ])
  })
})

describe('adjustTransactions', () => {
  it('fills outcome movement sum with income sum', () => {
    expect(adjustTransactions({
      shouldFillOutcomeSum: true,
      accounts: [
        { id: 'account_1', instrument: 'RUB' },
        { id: 'account_2', instrument: 'RUB' }
      ],
      transactions: [
        {
          hold: false,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '1',
              account: { id: 'account_1' },
              invoice: null,
              sum: null,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        },
        {
          hold: true,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '2',
              account: { id: 'account_2' },
              invoice: null,
              sum: 100,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        }
      ]
    })).toEqual([
      {
        hold: null,
        date: new Date('2019-01-01'),
        movements: [
          {
            id: '1',
            account: { id: 'account_1' },
            invoice: null,
            sum: -100,
            fee: 0
          },
          {
            id: '2',
            account: { id: 'account_2' },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ])
  })

  it('fills outcome movement sum with income sum only if shouldFillOutcomeSum returns true for this transaction', () => {
    expect(adjustTransactions({
      shouldFillOutcomeSum: ({ account }) => account.id === 'account_3',
      accounts: [
        { id: 'account_1', instrument: 'RUB' },
        { id: 'account_2', instrument: 'RUB' },
        { id: 'account_3', instrument: 'RUB' }
      ],
      transactions: [
        {
          hold: false,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '1',
              account: { id: 'account_1' },
              invoice: null,
              sum: null,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        },
        {
          hold: true,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '2',
              account: { id: 'account_2' },
              invoice: null,
              sum: 100,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        },
        {
          hold: false,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '3',
              account: { id: 'account_3' },
              invoice: null,
              sum: null,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id1'
          ]
        },
        {
          hold: false,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '4',
              account: { id: 'account_2' },
              invoice: null,
              sum: 200,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id1'
          ]
        }
      ]
    })).toEqual([
      {
        hold: null,
        date: new Date('2019-01-01'),
        movements: [
          {
            id: '1',
            account: { id: 'account_1' },
            invoice: null,
            sum: null,
            fee: 0
          },
          {
            id: '2',
            account: { id: 'account_2' },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2019-01-01'),
        movements: [
          {
            id: '3',
            account: { id: 'account_3' },
            invoice: null,
            sum: -200,
            fee: 0
          },
          {
            id: '4',
            account: { id: 'account_2' },
            invoice: null,
            sum: 200,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ])
  })

  it('fills outcome movement sum with income invoice sum', () => {
    expect(adjustTransactions({
      shouldFillOutcomeSum: true,
      accounts: [
        { id: 'account_1', instrument: 'RUB' },
        { id: 'account_2', instrument: 'USD' }
      ],
      transactions: [
        {
          hold: false,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '1',
              account: { id: 'account_1' },
              invoice: null,
              sum: null,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        },
        {
          hold: true,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '2',
              account: { id: 'account_2' },
              invoice: { sum: 100, instrument: 'RUB' },
              sum: 2,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        }
      ]
    })).toEqual([
      {
        hold: null,
        date: new Date('2019-01-01'),
        movements: [
          {
            id: '1',
            account: { id: 'account_1' },
            invoice: null,
            sum: -100,
            fee: 0
          },
          {
            id: '2',
            account: { id: 'account_2' },
            invoice: { sum: 100, instrument: 'RUB' },
            sum: 2,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ])
  })

  it('does not fill outcome movement sum with income sum if it is not allowed', () => {
    expect(adjustTransactions({
      shouldFillOutcomeSum: false,
      accounts: [
        { id: 'account_1', instrument: 'RUB' },
        { id: 'account_2', instrument: 'RUB' }
      ],
      transactions: [
        {
          hold: false,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '1',
              account: { id: 'account_1' },
              invoice: null,
              sum: null,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        },
        {
          hold: true,
          date: new Date('2019-01-01'),
          movements: [
            {
              id: '2',
              account: { id: 'account_2' },
              invoice: null,
              sum: 100,
              fee: 0
            }
          ],
          merchant: null,
          comment: null,
          groupKeys: [
            'transfer_id'
          ]
        }
      ]
    })).toEqual([
      {
        hold: null,
        date: new Date('2019-01-01'),
        movements: [
          {
            id: '1',
            account: { id: 'account_1' },
            invoice: null,
            sum: null,
            fee: 0
          },
          {
            id: '2',
            account: { id: 'account_2' },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ])
  })
})
