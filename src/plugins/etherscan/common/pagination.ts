const PAGE_SIZE = 1000
const RESULT_WINDOW_LIMIT = 10000
const MAX_PAGES = RESULT_WINDOW_LIMIT / PAGE_SIZE
const RESULT_WINDOW_ERROR_PATTERN = /result window is too large|pageno\s*x\s*offset/i
const QUERY_TIMEOUT_ERROR_PATTERN = /query timeout/i

export interface BlockTransaction {
  blockNumber: string
}

export interface FetchPageOptions {
  startBlock: number
  endBlock: number
  page: number
  offset: number
}

interface FetchPaginatedTransactionsOptions<TTransaction extends BlockTransaction> {
  startBlock: number
  endBlock: number
  fetchPage: (options: FetchPageOptions) => Promise<TTransaction[]>
  getKey: (transaction: TTransaction) => string
}

function parseBlockNumber (transaction: BlockTransaction): number {
  const blockNumber = Number(transaction.blockNumber)

  if (!Number.isSafeInteger(blockNumber)) {
    throw new Error(`Invalid blockNumber from API: ${transaction.blockNumber}`)
  }

  return blockNumber
}

function getErrorMessage (error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function isRecoverableCursorError (error: unknown): boolean {
  const message = getErrorMessage(error)

  return RESULT_WINDOW_ERROR_PATTERN.test(message) ||
    QUERY_TIMEOUT_ERROR_PATTERN.test(message)
}

export async function fetchPaginatedTransactions<TTransaction extends BlockTransaction> ({
  startBlock,
  endBlock,
  fetchPage,
  getKey
}: FetchPaginatedTransactionsOptions<TTransaction>): Promise<TTransaction[]> {
  let cursor = endBlock
  const transactions: TTransaction[] = []
  const seen = new Set<string>()

  while (cursor >= startBlock) {
    let lastBlock: number | null = null
    let exhausted = false

    for (let page = 1; page <= MAX_PAGES; page++) {
      let pageTransactions: TTransaction[]

      try {
        pageTransactions = await fetchPage({
          startBlock,
          endBlock: cursor,
          page,
          offset: PAGE_SIZE
        })
      } catch (error) {
        if (!isRecoverableCursorError(error)) {
          throw error
        }

        if (lastBlock === null) {
          throw new Error(
            'Cannot safely progress after Etherscan pagination error for ' +
            `block range ${startBlock}..${cursor}: ${getErrorMessage(error)}`
          )
        }

        break
      }

      if (pageTransactions.length === 0) {
        exhausted = true
        break
      }

      for (const transaction of pageTransactions) {
        const key = getKey(transaction)

        if (!seen.has(key)) {
          seen.add(key)
          transactions.push(transaction)
        }
      }

      lastBlock = parseBlockNumber(pageTransactions[pageTransactions.length - 1])

      if (pageTransactions.length < PAGE_SIZE) {
        exhausted = true
        break
      }
    }

    if (exhausted || lastBlock === null) {
      break
    }

    if (lastBlock > cursor) {
      throw new Error('API returned rows in non-monotonic block order')
    }

    if (lastBlock === cursor) {
      throw new Error(
        `Cannot safely progress: block ${cursor} alone fills the ` +
        `${RESULT_WINDOW_LIMIT} result window`
      )
    }

    cursor = lastBlock
  }

  return transactions
}
