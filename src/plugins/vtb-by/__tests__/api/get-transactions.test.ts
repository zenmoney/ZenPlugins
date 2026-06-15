import { AccountType } from '../../../../types/zenmoney'

const mockFetchDepositAccountStatement = jest.fn()
const mockFetchMiniCardStatement = jest.fn()

jest.mock('../../fetchApi', () => ({
  ...jest.requireActual('../../fetchApi'),
  fetchDepositAccountStatement: mockFetchDepositAccountStatement,
  fetchMiniCardStatement: mockFetchMiniCardStatement
}))

describe('getTransactions', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getTransactions } = require('../../api') as typeof import('../../api')

  afterEach(() => {
    mockFetchDepositAccountStatement.mockReset()
    mockFetchMiniCardStatement.mockReset()
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

  it('prefers posted mini card operation over matching hold duplicate', async () => {
    mockFetchMiniCardStatement.mockResolvedValue({
      errorInfo: {
        error: '0',
        errorText: null,
        errorDescription: null
      },
      statement: [
        {
          operationDate: new Date('2026-05-10T12:00:00.000Z').getTime(),
          operationDescription: 'Авторизация',
          operationAmount: 10,
          operationCurrency: '933',
          operationPlace: 'STORE',
          operationState: 0,
          transactionAmount: 10,
          transactionCurrency: '933',
          transactionAuthCode: '999'
        },
        {
          operationDate: new Date('2026-05-10T12:00:00.000Z').getTime(),
          operationDescription: 'Покупка',
          operationAmount: 10,
          operationCurrency: '933',
          operationPlace: 'STORE',
          operationState: 1,
          transactionAmount: 10,
          transactionCurrency: '933',
          transactionAuthCode: '999'
        }
      ]
    })

    await expect(getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, {
      id: 'card-account',
      type: AccountType.ccard,
      title: 'Тестовая карта',
      balance: 1000,
      instrument: 'BYN',
      syncIds: ['TEST-CARD-IBAN'],
      _meta: {
        productKind: 'card',
        statementInternalAccountId: 'account-id',
        statementCardHash: 'card-hash'
      }
    })).resolves.toMatchObject([
      {
        hold: false,
        comment: 'Покупка\nSTORE',
        movements: [
          {
            id: 'card-account:auth:1778414400000:999',
            sum: 10
          }
        ]
      }
    ])
  })

  it('keeps repeated mini card auth codes distinct across operation dates', async () => {
    mockFetchMiniCardStatement.mockResolvedValue({
      errorInfo: {
        error: '0',
        errorText: null,
        errorDescription: null
      },
      statement: [
        {
          operationDate: new Date('2026-05-10T12:00:00.000Z').getTime(),
          operationDescription: 'Покупка',
          operationAmount: 10,
          operationCurrency: '933',
          operationPlace: 'STORE',
          operationState: 1,
          transactionAmount: 10,
          transactionCurrency: '933',
          transactionAuthCode: '999'
        },
        {
          operationDate: new Date('2026-05-11T12:00:00.000Z').getTime(),
          operationDescription: 'Покупка',
          operationAmount: 10,
          operationCurrency: '933',
          operationPlace: 'STORE',
          operationState: 1,
          transactionAmount: 10,
          transactionCurrency: '933',
          transactionAuthCode: '999'
        }
      ]
    })

    await expect(getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, {
      id: 'card-account',
      type: AccountType.ccard,
      title: 'Тестовая карта',
      balance: 1000,
      instrument: 'BYN',
      syncIds: ['TEST-CARD-IBAN'],
      _meta: {
        productKind: 'card',
        statementInternalAccountId: 'account-id',
        statementCardHash: 'card-hash'
      }
    })).resolves.toHaveLength(2)
  })
})
