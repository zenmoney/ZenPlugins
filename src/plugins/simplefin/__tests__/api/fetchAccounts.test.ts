/* eslint-disable @typescript-eslint/no-var-requires */

describe('fetchAccounts', () => {
  let fetchAccounts: typeof import('../../fetchApi').fetchAccounts
  let fetchJsonMock: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    fetchJsonMock = jest.fn().mockResolvedValue({
      status: 200,
      url: 'https://example.com/simplefin/accounts',
      headers: {},
      body: {
        errlist: [],
        connections: [],
        accounts: [
          {
            id: 'account-1',
            name: 'Checking',
            conn_id: 'connection-1',
            currency: 'USD',
            balance: '100.00',
            'balance-date': 1717200000,
            transactions: [
              {
                id: 'pending-1',
                posted: 0,
                transacted_at: 1717286400,
                amount: '-12.34',
                description: 'Pending coffee',
                pending: true
              }
            ]
          }
        ]
      }
    })

    jest.doMock('../../../../common/network', () => ({
      __esModule: true,
      fetchJson: fetchJsonMock
    }))

    fetchAccounts = require('../../fetchApi').fetchAccounts
  })

  it('requests and parses pending transactions', async () => {
    const accountSet = await fetchAccounts({
      token: 'token',
      accessUrl: 'https://user:password@example.com/simplefin'
    }, new Date('2024-06-01T00:00:00.000Z'), new Date('2024-06-03T00:00:00.000Z'))

    expect(fetchJsonMock).toHaveBeenCalledWith(
      'https://example.com/simplefin/accounts?start-date=1717200000&end-date=1717372800&pending=1&version=2',
      {
        headers: {
          Authorization: `Basic ${Buffer.from('user:password').toString('base64')}`
        },
        sanitizeRequestLog: { url: true },
        sanitizeResponseLog: { body: true }
      }
    )
    expect(accountSet.accounts[0].transactions[0]).toMatchObject({
      id: 'pending-1',
      posted: 0,
      transactedAt: 1717286400,
      amount: -12.34,
      description: 'Pending coffee',
      pending: true
    })
  })
})
