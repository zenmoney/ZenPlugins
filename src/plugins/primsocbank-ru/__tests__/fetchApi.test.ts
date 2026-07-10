import { FetchResponse } from '../../../common/network'
import { ProductKind, Session } from '../models'

jest.mock('../../../common/network', () => ({
  fetch: jest.fn()
}))

const mockedFetch: jest.Mock<Promise<FetchResponse>> = jest.requireMock('../../../common/network').fetch
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetchProductTransactions } = require('../fetchApi') as typeof import('../fetchApi')

function makeOperation (id: string): unknown {
  return {
    id,
    operDate: '01.04.2030',
    amount: -1,
    currency: {
      code: 'RUB'
    },
    details: `Операция ${id}`
  }
}

function makeResponse (operations: unknown[]): FetchResponse {
  return {
    status: 200,
    url: 'https://psl.pskb.com/mobileService/3.0/json/pfmTape',
    headers: {},
    body: {
      response: {
        result: 0,
        object: {
          operations
        }
      }
    }
  }
}

async function mockResponse (operations: unknown[]): Promise<FetchResponse> {
  return makeResponse(operations)
}

describe('fetchProductTransactions', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  it('deduplicates boundary operations and stops on a short final page', async () => {
    const session: Session = {
      auth: {
        cookieHeader: 'SESSION=test-session',
        updatedAt: '2030-04-01T00:00:00.000Z'
      }
    }

    mockedFetch
      .mockReturnValueOnce(mockResponse(Array.from({ length: 50 }, (_, index) => makeOperation(`operation-${String(index + 1).padStart(2, '0')}`))))
      .mockReturnValueOnce(mockResponse([makeOperation('operation-49'), makeOperation('operation-50'), makeOperation('operation-51')]))

    const operations = await fetchProductTransactions(session, {
      id: 'test-product-id',
      accountId: 'test-account-id',
      kind: ProductKind.account
    }, new Date(2030, 3, 1), new Date(2030, 3, 30))

    expect(operations.map(operation => (operation as { id: string }).id)).toEqual([
      ...Array.from({ length: 51 }, (_, index) => `operation-${String(index + 1).padStart(2, '0')}`)
    ])
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect(mockedFetch.mock.calls[0][1]?.body).not.toContain('lastOperationId')
    expect(mockedFetch.mock.calls[1][1]?.body).toContain('lastOperationId=operation-49')
  })

  it('stops pagination when a full page repeats already seen operations only', async () => {
    const session: Session = {
      auth: {
        cookieHeader: 'SESSION=test-session',
        updatedAt: '2030-04-01T00:00:00.000Z'
      }
    }

    mockedFetch
      .mockReturnValueOnce(mockResponse(Array.from({ length: 50 }, (_, index) => makeOperation(`operation-${String(index + 1).padStart(2, '0')}`))))
      .mockReturnValueOnce(mockResponse(Array.from({ length: 50 }, () => makeOperation('operation-49'))))

    const operations = await fetchProductTransactions(session, {
      id: 'test-product-id',
      accountId: 'test-account-id',
      kind: ProductKind.account
    }, new Date(2030, 3, 1), new Date(2030, 3, 30))

    expect(operations.map(operation => (operation as { id: string }).id)).toEqual([
      ...Array.from({ length: 49 }, (_, index) => `operation-${String(index + 1).padStart(2, '0')}`)
    ])
    expect(mockedFetch).toHaveBeenCalledTimes(2)
  })

  it('does not request transactions for loans', async () => {
    const operations = await fetchProductTransactions({
      auth: {
        cookieHeader: 'SESSION=test-session',
        updatedAt: '2030-04-01T00:00:00.000Z'
      }
    }, {
      id: 'test-loan-product-id',
      accountId: 'test-loan-account-id',
      kind: ProductKind.loan
    }, new Date(2030, 3, 1), new Date(2030, 3, 30))

    expect(operations).toEqual([])
    expect(mockedFetch).not.toHaveBeenCalled()
  })
})
