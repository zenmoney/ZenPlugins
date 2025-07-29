import { AccountType } from '../../../../types/zenmoney'
import { scrape } from '../../ether'
import { mockEndPoints, preferencesMock } from '../../mocks'

describe('scrape', () => {
  it('should hit the mocks and return results', async () => {
    mockEndPoints()

    const result = await scrape(
      {
        preferences: preferencesMock,
        startBlock: 1,
        endBlock: 99999999,
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
      },
      {
        id: '3',
        type: AccountType.checking,
        title: '3',
        instrument: 'μETH',
        balance: 0,
        syncIds: ['3']
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
        movements: [
          {
            id: '3',
            account: { id: '1' },
            invoice: null,
            sum: -1000000,
            fee: -323
          }, {
            id: '3',
            account: { id: '2' },
            invoice: null,
            sum: 1000000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ])
  })
})
