import {
  type BlockTransaction,
  type FetchPageOptions,
  fetchPaginatedTransactions
} from './pagination'

interface TestTransaction extends BlockTransaction {
  id: string
}

function buildTransactions (
  count: number,
  blockNumber: number,
  idPrefix: string
): TestTransaction[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${idPrefix}-${index}`,
    blockNumber: String(blockNumber)
  }))
}

describe('fetchPaginatedTransactions', () => {
  it('uses page only inside the result window and then advances endBlock', async () => {
    const requests: FetchPageOptions[] = []

    await fetchPaginatedTransactions<TestTransaction>({
      startBlock: 1,
      endBlock: 100,
      getKey: (transaction) => transaction.id,
      fetchPage: async (options) => {
        requests.push(options)

        if (options.endBlock === 100) {
          return buildTransactions(
            1000,
            options.page === 10 ? 90 : 100,
            `cursor-100-page-${options.page}`
          )
        }

        return buildTransactions(1, 80, 'cursor-90-page-1')
      }
    })

    expect(requests).toHaveLength(11)
    expect(requests[9]).toEqual({
      startBlock: 1,
      endBlock: 100,
      page: 10,
      offset: 1000
    })
    expect(requests[10]).toEqual({
      startBlock: 1,
      endBlock: 90,
      page: 1,
      offset: 1000
    })
  })

  it('deduplicates transactions from the overlapped cursor block', async () => {
    const transactions = await fetchPaginatedTransactions<TestTransaction>({
      startBlock: 1,
      endBlock: 100,
      getKey: (transaction) => transaction.id,
      fetchPage: async (options) => {
        if (options.endBlock === 100) {
          const pageTransactions = buildTransactions(
            1000,
            options.page === 10 ? 90 : 100,
            `cursor-100-page-${options.page}`
          )

          if (options.page === 10) {
            pageTransactions[999] = {
              id: 'overlap',
              blockNumber: '90'
            }
          }

          return pageTransactions
        }

        return [
          {
            id: 'overlap',
            blockNumber: '90'
          },
          {
            id: 'new',
            blockNumber: '80'
          }
        ]
      }
    })

    expect(transactions.filter((transaction) => transaction.id === 'overlap')).toHaveLength(1)
    expect(transactions.some((transaction) => transaction.id === 'new')).toBe(true)
  })

  it('fails when a single cursor block fills the whole result window', async () => {
    await expect(fetchPaginatedTransactions<TestTransaction>({
      startBlock: 1,
      endBlock: 100,
      getKey: (transaction) => transaction.id,
      fetchPage: async (options) => buildTransactions(
        1000,
        100,
        `page-${options.page}`
      )
    })).rejects.toThrow('Cannot safely progress')
  })

  it('advances the cursor after a result-window error when a safe last block exists', async () => {
    const requests: FetchPageOptions[] = []

    await fetchPaginatedTransactions<TestTransaction>({
      startBlock: 1,
      endBlock: 100,
      getKey: (transaction) => transaction.id,
      fetchPage: async (options) => {
        requests.push(options)

        if (options.endBlock === 100) {
          if (options.page === 10) {
            throw new Error(
              'Result window is too large, PageNo x Offset size must be less than or equal to 10000'
            )
          }

          return buildTransactions(
            1000,
            options.page === 9 ? 90 : 100,
            `cursor-100-page-${options.page}`
          )
        }

        return buildTransactions(1, 80, 'cursor-90-page-1')
      }
    })

    expect(requests[9]).toEqual({
      startBlock: 1,
      endBlock: 100,
      page: 10,
      offset: 1000
    })
    expect(requests[10]).toEqual({
      startBlock: 1,
      endBlock: 90,
      page: 1,
      offset: 1000
    })
  })

  it('fails with a clear error when a pagination error happens before any cursor exists', async () => {
    await expect(fetchPaginatedTransactions<TestTransaction>({
      startBlock: 1,
      endBlock: 100,
      getKey: (transaction) => transaction.id,
      fetchPage: async () => {
        throw new Error('Query Timeout occured')
      }
    })).rejects.toThrow(
      'Cannot safely progress after Etherscan pagination error for block range 1..100'
    )
  })

  it('fails on invalid block numbers', async () => {
    await expect(fetchPaginatedTransactions<TestTransaction>({
      startBlock: 1,
      endBlock: 100,
      getKey: (transaction) => transaction.id,
      fetchPage: async () => [{
        id: 'invalid',
        blockNumber: 'invalid'
      }]
    })).rejects.toThrow('Invalid blockNumber')
  })
})
