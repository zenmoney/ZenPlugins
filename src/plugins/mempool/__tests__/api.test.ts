import { MempoolTransaction, PAGE_SIZE, Wallet } from '../models'

const mockFetchAddressInfo = jest.fn()
const mockFetchPage = jest.fn()

jest.mock('../fetchApi', () => ({
  fetchAddressInfo: mockFetchAddressInfo,
  fetchAddressTransactionsPage: mockFetchPage
}))

function tx (txid: string, blockTime: number): MempoolTransaction {
  return { txid, vin: [], vout: [], confirmed: true, block_time: blockTime }
}

function page (size: number, startTime: number, prefix: string): MempoolTransaction[] {
  return Array.from({ length: size }, (_unused, index) => tx(`${prefix}${index}`, startTime - index * 3600))
}

describe('api', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetchAddressInfos, fetchTransactions } = require('../api') as typeof import('../api')
  const wallet: Wallet = { id: 'a1', title: 'Ledger_1', addresses: ['a1', 'a2'] }

  afterEach(() => { jest.clearAllMocks() })

  it('собирает информацию по каждому адресу кошелька', async () => {
    mockFetchAddressInfo.mockImplementation(async () => ({
      funded_txo_sum: 1, spent_txo_sum: 0
    }))
    const infoByAddress = await fetchAddressInfos([wallet])
    expect([...infoByAddress.keys()]).toEqual(['a1', 'a2'])
  })

  // Пагинация у mempool.space курсорная и описана в документации:
  //   GET /address/:address/txs — до 50 мемпульных транзакций плюс первые 25 подтверждённых,
  //     причём мемпульные идут первыми;
  //   GET /address/:address/txs/chain/:last_seen_txid — по 25 подтверждённых на страницу,
  //     новые сверху; следующая страница запрашивается по txid последней транзакции предыдущей.
  // Проверено на живом API: у адреса с 12 транзакциями /txs отдаёт 12,
  // а /txs/chain/<txid последней> отдаёт [].
  it('листает страницы, пока страница полная и транзакции новее fromDate', async () => {
    const fromDate = new Date('2020-01-01T00:00:00Z')
    const recent = Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000)
    mockFetchAddressInfo.mockResolvedValue({ funded_txo_sum: 0, spent_txo_sum: 0 })
    mockFetchPage
      .mockResolvedValueOnce(page(PAGE_SIZE, recent, 'p1_'))
      .mockResolvedValueOnce(page(2, recent - 200000, 'p2_'))
      .mockResolvedValue([])

    const transactions = await fetchTransactions([{ id: 'a1', title: 'W', addresses: ['a1'] }], fromDate)

    expect(mockFetchPage).toHaveBeenNthCalledWith(1, 'a1', undefined)
    expect(mockFetchPage).toHaveBeenNthCalledWith(2, 'a1', `p1_${PAGE_SIZE - 1}`)
    expect(transactions).toHaveLength(PAGE_SIZE + 2)
  })

  // Страницы приходят от новых к старым. Если самая старая транзакция на странице уже
  // старше fromDate, то всё, что лежит за ней, — тем более старое, и листать дальше незачем.
  // Здесь вся страница за январь 2024, а fromDate — июнь 2024: хватает одного запроса.
  it('останавливается, когда самая старая транзакция страницы старше fromDate', async () => {
    const fromDate = new Date('2024-06-01T00:00:00Z')
    const old = Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000)
    mockFetchPage.mockResolvedValueOnce(page(PAGE_SIZE, old, 'old_'))

    const transactions = await fetchTransactions([{ id: 'a1', title: 'W', addresses: ['a1'] }], fromDate)

    expect(mockFetchPage).toHaveBeenCalledTimes(1)
    expect(transactions).toEqual([])
  })

  it('страница целиком из неподтверждённых не даёт курсора для следующей', async () => {
    // /txs отдаёт мемпульные транзакции первыми, а /txs/chain/:txid ищет курсор только
    // в подтверждённой истории. Неподтверждённый txid в роли курсора — заведомый промах.
    const fromDate = new Date('2020-01-01T00:00:00Z')
    const pending: MempoolTransaction[] = Array.from({ length: PAGE_SIZE }, (_unused, index) => ({
      txid: `pending${index}`, vin: [], vout: [], confirmed: false, block_time: null
    }))
    mockFetchPage.mockResolvedValueOnce(pending).mockResolvedValue([])

    const transactions = await fetchTransactions([{ id: 'a1', title: 'W', addresses: ['a1'] }], fromDate)

    expect(mockFetchPage).toHaveBeenCalledTimes(1)
    expect(transactions).toEqual([])
  })

  it('одна транзакция на двух адресах кошелька возвращается один раз', async () => {
    const fromDate = new Date('2020-01-01T00:00:00Z')
    const time = Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000)
    mockFetchPage
      .mockResolvedValueOnce([tx('shared', time)])
      .mockResolvedValueOnce([tx('shared', time)])

    const transactions = await fetchTransactions([wallet], fromDate)

    expect(transactions).toHaveLength(1)
    expect(transactions[0].txid).toBe('shared')
  })

  // Страница приходит целиком и может содержать транзакции по обе стороны от fromDate,
  // поэтому мало остановить пагинацию — лишнее надо ещё и выбросить. Пример здесь:
  //   fromDate — 1 июня 2024
  //   fresh    — 1 июля 2024   → новее, забираем
  //   stale    — 1 января 2024 → старее, выбрасываем
  it('отсекает транзакции старше fromDate', async () => {
    const fromDate = new Date('2024-06-01T00:00:00Z')
    const fresh = Math.floor(new Date('2024-07-01T00:00:00Z').getTime() / 1000)
    const stale = Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000)
    mockFetchPage.mockResolvedValueOnce([tx('fresh', fresh), tx('stale', stale)])

    const transactions = await fetchTransactions([{ id: 'a1', title: 'W', addresses: ['a1'] }], fromDate)

    expect(transactions.map(t => t.txid)).toEqual(['fresh'])
  })
})
