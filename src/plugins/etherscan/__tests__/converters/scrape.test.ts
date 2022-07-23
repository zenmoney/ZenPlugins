import { scrape } from '../..'
import { AccountType } from '../../../../types/zenmoney'
import { mockEndPoints, preferencesMock } from '../../mocks'

describe('scrape', () => {
  it('should hit the mocks and return results', async () => {
    mockEndPoints()

    const result = await scrape(
      {
        preferences: preferencesMock,
        fromDate: new Date('2021-12-27T00:00:00.000+03:00'),
        toDate: new Date('2022-01-02T00:00:00.000+03:00'),
        isFirstRun: false,
        isInBackground: false
      }
    )

    expect(result.accounts).toEqual([
      {
        id: '1',
        type: AccountType.checking,
        title: '1',
        instrument: 'μETH',
        balance: 2000000,
        syncIds: ['1']
      },
      {
        id: '2',
        type: AccountType.checking,
        title: '2',
        instrument: 'μETH',
        balance: 10000000,
        syncIds: ['2']
      }
    ])

    expect(result.transactions).toEqual([
      {
        hold: null,
        date: new Date('2015-07-30T15:26:28.000Z'),
        movements: [{
          id: '1',
          account: { id: '1' },
          invoice: null,
          sum: -1000000,
          fee: -323
        }],
        merchant: {
          fullTitle: 'OTHER_ACCOUNT',
          mcc: null,
          location: null
        },
        comment: null
      },
      {
        hold: null,
        date: new Date('2015-07-30T15:26:28.000Z'),
        movements: [{
          id: '2',
          account: { id: '1' },
          invoice: null,
          sum: 2000000,
          fee: 0
        }],
        merchant: {
          fullTitle: 'OTHER_ACCOUNT',
          mcc: null,
          location: null
        },
        comment: null
      },
      {
        hold: null,
        date: new Date('2015-07-30T15:26:28.000Z'),
        movements: [{
          id: '3',
          account: { id: '1' },
          invoice: null,
          sum: -1000000,
          fee: -323
        }],
        merchant: {
          fullTitle: '2',
          mcc: null,
          location: null
        },
        comment: null
      },
      {
        hold: null,
        date: new Date('2015-07-30T15:26:28.000Z'),
        movements: [{
          id: '3',
          account: { id: '2' },
          invoice: null,
          sum: 1000000,
          fee: 0
        }],
        merchant: {
          fullTitle: '1',
          mcc: null,
          location: null
        },
        comment: null
      }
    ])
  })
})
