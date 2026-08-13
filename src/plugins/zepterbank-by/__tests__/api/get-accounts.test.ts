import { convertCardAccount, convertCurrentAccount } from '../../converters'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'
import type { FetchAccountsOutput } from '../../types/fetch.types'

const mockFetchAccounts = jest.fn()

jest.mock('../../fetchApi', () => ({
  ...jest.requireActual('../../fetchApi'),
  fetchAccounts: mockFetchAccounts
}))

describe('getAccounts', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getAccounts } = require('../../api') as typeof import('../../api')

  afterEach(() => {
    mockFetchAccounts.mockReset()
  })

  it.each([
    [
      'card-only responses',
      { products: { cards: [TEST_ACCOUNTS.CARD[0]] } },
      [convertCardAccount(TEST_ACCOUNTS.CARD[0])]
    ],
    [
      'current-account-only responses',
      { products: { accounts: [TEST_ACCOUNTS.CURRENT[0]] } },
      [convertCurrentAccount(TEST_ACCOUNTS.CURRENT[0])]
    ]
  ])('converts accounts for %s', async (_caseName: string, data: FetchAccountsOutput, expectedAccounts) => {
    mockFetchAccounts.mockResolvedValue({
      status: 200,
      data,
      error: null
    })

    await expect(getAccounts({ sessionToken: 'session-token' })).resolves.toEqual(expectedAccounts)
  })
})
