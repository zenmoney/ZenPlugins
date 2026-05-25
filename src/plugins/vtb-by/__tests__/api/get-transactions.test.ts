import { AccountType } from '../../../../types/zenmoney'

const mockFetchDepositAccountStatement = jest.fn()

jest.mock('../../fetchApi', () => ({
  ...jest.requireActual('../../fetchApi'),
  fetchDepositAccountStatement: mockFetchDepositAccountStatement
}))

describe('getTransactions', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getTransactions } = require('../../api') as typeof import('../../api')

  afterEach(() => {
    mockFetchDepositAccountStatement.mockReset()
  })

  it('treats missing deposit operations as an empty statement', async () => {
    mockFetchDepositAccountStatement.mockResolvedValue({
      errorInfo: {
        error: '0',
        errorText: null,
        errorDescription: null
      }
    })

    await expect(getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, {
      id: 'deposit-account',
      type: AccountType.deposit,
      title: 'Тестовый вклад',
      balance: 1000,
      instrument: 'RUB',
      syncIds: ['TEST-DEPOSIT-IBAN'],
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      startBalance: 1000,
      capitalization: true,
      percent: 12,
      endDateOffsetInterval: 'month',
      endDateOffset: 12,
      payoffInterval: 'month',
      payoffStep: 1,
      _meta: {
        productKind: 'deposit',
        statementInternalAccountId: '6431251001260',
        statementCardHash: null
      }
    })).resolves.toEqual([])
  })
})
