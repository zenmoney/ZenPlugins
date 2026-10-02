import { InvalidPreferencesError, TemporaryUnavailableError } from '../../../errors'

const mockFetchJson = jest.fn()

jest.mock('../../../common/network', () => ({ fetchJson: mockFetchJson }))

const ok = (body: unknown): unknown => ({ status: 200, url: '', headers: {}, body })

// Ретраи ждут 2+4+6 секунд, а дефолтный таймаут jest — 5. Выполняем колбэк таймера
// сразу: проверяем число попыток, а не то, что паузы действительно случились.
const immediateTimeout = (handler: () => void): number => { handler(); return 0 }

describe('fetchApi', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetchAddressInfo, fetchAddressTransactionsPage } = require('../fetchApi') as typeof import('../fetchApi')

  beforeAll(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation(immediateTimeout as unknown as typeof global.setTimeout)
  })

  afterAll(() => { jest.restoreAllMocks() })

  afterEach(() => { jest.clearAllMocks() })

  it('fetchAddressInfo достаёт суммы из chain_stats', async () => {
    mockFetchJson.mockResolvedValueOnce(ok({
      address: 'bc1qtest',
      chain_stats: { funded_txo_sum: 6182503, spent_txo_sum: 6182503, tx_count: 12 },
      mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
    }))
    await expect(fetchAddressInfo('bc1qtest')).resolves.toEqual({
      funded_txo_sum: 6182503, spent_txo_sum: 6182503
    })
    expect(mockFetchJson).toHaveBeenCalledWith('https://mempool.space/api/address/bc1qtest')
  })

  it('fetchAddressTransactionsPage нормализует выход без адреса в null', async () => {
    mockFetchJson.mockResolvedValueOnce(ok([{
      txid: 'abc',
      vin: [{ prevout: { scriptpubkey_address: 'bc1qsender', value: 1000 } }],
      vout: [{ value: 0 }, { scriptpubkey_address: 'bc1qtest', value: 900 }],
      status: { confirmed: true, block_time: 1700000000 }
    }]))
    const [transaction] = await fetchAddressTransactionsPage('bc1qtest')
    expect(transaction.vout[0]).toEqual({ scriptpubkey_address: null, value: 0 })
    expect(transaction.vin[0].prevout).toEqual({ scriptpubkey_address: 'bc1qsender', value: 1000 })
    expect(transaction.confirmed).toBe(true)
    expect(transaction.block_time).toBe(1700000000)
  })

  it('неподтверждённая транзакция приезжает без block_time', async () => {
    mockFetchJson.mockResolvedValueOnce(ok([{
      txid: 'abc', vin: [], vout: [], status: { confirmed: false }
    }]))
    const [transaction] = await fetchAddressTransactionsPage('bc1qtest')
    expect(transaction.confirmed).toBe(false)
    expect(transaction.block_time).toBeNull()
  })

  it('lastSeenTxId переключает на постраничный маршрут', async () => {
    mockFetchJson.mockResolvedValueOnce(ok([]))
    await fetchAddressTransactionsPage('bc1qtest', 'seen')
    expect(mockFetchJson).toHaveBeenCalledWith('https://mempool.space/api/address/bc1qtest/txs/chain/seen')
  })

  it('429 повторяется и на успешной попытке отдаёт данные', async () => {
    mockFetchJson
      .mockResolvedValueOnce({ status: 429, url: '', headers: {}, body: '' })
      .mockResolvedValueOnce(ok([]))
    await expect(fetchAddressTransactionsPage('bc1qtest')).resolves.toEqual([])
    expect(mockFetchJson).toHaveBeenCalledTimes(2)
  })

  it('после исчерпания попыток на 500 бросает TemporaryUnavailableError', async () => {
    mockFetchJson.mockResolvedValue({ status: 500, url: '', headers: {}, body: '' })
    await expect(fetchAddressInfo('bc1qtest')).rejects.toBeInstanceOf(TemporaryUnavailableError)
    expect(mockFetchJson).toHaveBeenCalledTimes(4)
  })

  it('404 не ретраится', async () => {
    mockFetchJson.mockResolvedValue({ status: 404, url: '', headers: {}, body: '' })
    await expect(fetchAddressInfo('bc1qtest')).rejects.toBeInstanceOf(TemporaryUnavailableError)
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
  })

  it('200 с телом не-массивом не выдаётся за пустую страницу', async () => {
    // Пустая страница останавливает пагинацию. Приняв за неё сломанный ответ,
    // мы навсегда заморозили бы историю кошелька на последней виденной транзакции,
    // и это было бы неотличимо от «операций больше нет».
    mockFetchJson.mockResolvedValueOnce(ok({ error: 'maintenance' }))
    await expect(fetchAddressTransactionsPage('bc1qtest')).rejects.toBeInstanceOf(TemporaryUnavailableError)
  })

  it('400 сообщает о невалидном адресе и не ретраится', async () => {
    mockFetchJson.mockResolvedValue({ status: 400, url: '', headers: {}, body: '' })
    await expect(fetchAddressInfo('bc1qtest')).rejects.toBeInstanceOf(InvalidPreferencesError)
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
  })
})
