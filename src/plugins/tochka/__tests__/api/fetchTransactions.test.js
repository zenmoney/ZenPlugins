jest.mock('../../../../common/network', () => ({
  fetch: jest.fn(),
  fetchJson: jest.fn(),
  openWebViewAndInterceptRequest: jest.fn(),
  RequestInterceptMode: {}
}))

jest.mock('../../config', () => ({
  clientId: 'client-id',
  clientSecret: 'client-secret',
  redirectUri: 'https://example.test/callback'
}), { virtual: true })

jest.mock('../../../../common/utils', () => ({
  ...jest.requireActual('../../../../common/utils'),
  delay: jest.fn().mockResolvedValue(undefined)
}))

const { fetchJson } = require('../../../../common/network')
const { fetchTransactions } = require('../../api')

describe('fetchTransactions', () => {
  const auth = { accessToken: 'access-token' }
  const account = { accountId: 'account-id' }
  const fromDate = new Date('2026-07-01T00:00:00.000Z')
  const toDate = new Date('2026-07-31T23:59:59.999Z')

  beforeEach(() => {
    fetchJson.mockReset()
  })

  it('continues polling after an empty response', async () => {
    const transactions = [{ transactionId: 'transaction-id' }]
    fetchJson
      .mockResolvedValueOnce({
        body: {
          Data: {
            Statement: {
              statementId: 'statement-id',
              status: 'Requested'
            }
          }
        }
      })
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        body: {
          Data: {
            Statement: [{
              status: 'Ready',
              Transaction: transactions
            }]
          }
        }
      })

    await expect(fetchTransactions(auth, account, fromDate, toDate)).resolves.toEqual(transactions)
    expect(fetchJson).toHaveBeenCalledTimes(3)
  })

  it('returns an empty list when every polling response is empty', async () => {
    fetchJson.mockResolvedValueOnce({
      body: {
        Data: {
          Statement: {
            statementId: 'statement-id',
            status: 'Requested'
          }
        }
      }
    })
    fetchJson.mockRejectedValue(new Error('Network error'))

    await expect(fetchTransactions(auth, account, fromDate, toDate)).resolves.toEqual([])
    expect(fetchJson).toHaveBeenCalledTimes(6)
  })
})
