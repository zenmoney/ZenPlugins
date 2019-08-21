import { handleGroupBy, handleGroups } from './handleGroups'
import { mergeTransfersHandler } from './transactionGroupHandler'

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
