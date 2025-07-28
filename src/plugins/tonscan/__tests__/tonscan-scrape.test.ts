import { AccountType } from '../../../types/zenmoney'
import { mockEndPoints, preferencesMock } from '../mocks'

describe('scrape', () => {
  jest.mock('../config', () => ({
    MAX_RPS: 100,
    SUPPORTED_JETTONS: jest.requireActual('../config').SUPPORTED_JETTONS
  }))

  it('should hit the mocks and return results', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { scrape } = require('../index')
    mockEndPoints()

    const result = await scrape(
      {
        preferences: preferencesMock,
        fromDate: new Date('2024-06-01T00:00:00+04:00'),
        toDate: new Date('2024-06-20T23:59:59+04:00'),
        isFirstRun: false,
        isInBackground: false
      }
    )

    expect(result.accounts).toEqual([
      {
        id: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr',
        type: AccountType.ccard,
        title: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr',
        instrument: 'TON',
        balance: 129.82,
        available: 129.82,
        creditLimit: 0,
        syncIds: ['UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr']
      },
      {
        id: 'EQCnDbQfXrcaamtqWgsaAzxG9WNfZ7JcgRsWFZIE1YRNRHYY',
        type: AccountType.ccard,
        title: 'TON Tether USDT',
        instrument: 'USDT',
        balance: 8,
        available: 8,
        creditLimit: 0,
        syncIds: ['EQCnDbQfXrcaamtqWgsaAzxG9WNfZ7JcgRsWFZIE1YRNRHYY']
      }
    ])

    expect(result.transactions).toEqual([
      {
        hold: false,
        date: new Date('2024-06-19T15:28:07.000Z'),
        movements: [{
          id: 'vNoHxFdN+bl3wy7g52Tl3Va7eKM71hDLm64g6haL1fQ=',
          account: { id: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr' },
          invoice: null,
          sum: 46.19,
          fee: 0
        }],
        merchant: {
          fullTitle: 'EQChB2eMoFG4ThuEsZ6ehlBPKJXOjNxlR5B7qKZNGIv256Da',
          mcc: null,
          location: null
        },
        comment: null
      },
      {
        hold: false,
        date: new Date('2024-06-19T15:28:07.000Z'),
        movements: [{
          id: 'udQ9QJFZl+28cVfny6CiZu8n+AYY7VWszp1uKXMMv04=',
          account: { id: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr' },
          invoice: null,
          sum: -41,
          fee: 0
        }],
        merchant: {
          fullTitle: 'EQChB2eMoFG4ThuEsZ6ehlBPKJXOjNxlR5B7qKZNGIv256Da',
          mcc: null,
          location: null
        },
        comment: null
      },
      {
        hold: false,
        date: new Date('2024-06-15T04:14:35.000Z'),
        movements: [{
          id: 'Iu1byKIIiIscIUICwIplNohqzlKJlqypafLX+VeyQSg=',
          account: { id: 'EQCnDbQfXrcaamtqWgsaAzxG9WNfZ7JcgRsWFZIE1YRNRHYY' },
          invoice: null,
          sum: -10,
          fee: 0
        }],
        merchant: {
          fullTitle: 'UQBSJYCMq3Jwu1ItUJJ1nAkcrgPvIzJZY8qpfuPEaB4dxZri',
          mcc: null,
          location: null
        },
        comment: null
      },
      {
        hold: false,
        date: new Date('2024-06-15T04:14:36.000Z'),
        movements: [{
          id: 'Iu1byKIIiIscIUICwIplNohqzlKJlqypafLX+VeyQSg=',
          account: { id: 'EQCnDbQfXrcaamtqWgsaAzxG9WNfZ7JcgRsWFZIE1YRNRHYY' },
          invoice: null,
          sum: -26.79,
          fee: 0
        }],
        merchant: {
          fullTitle: 'UQBSJYCMq3Jwu1ItUJJ1nAkcrgPvIzJZY8qpfuPEaB4dxZri',
          mcc: null,
          location: null
        },
        comment: null
      }
    ])
  })
})
