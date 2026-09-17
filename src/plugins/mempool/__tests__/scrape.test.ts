import { MempoolTransaction } from '../models'

const mockFetchAddressInfos = jest.fn()
const mockFetchTransactions = jest.fn()

jest.mock('../api', () => ({
  fetchAddressInfos: mockFetchAddressInfos,
  fetchTransactions: mockFetchTransactions
}))

describe('scrape', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrape } = require('../index') as typeof import('../index')

  afterEach(() => { jest.clearAllMocks() })

  it('собирает счета и операции из настроек в два кошелька', async () => {
    const transfer: MempoolTransaction = {
      txid: 'tx1',
      vin: [{ prevout: { scriptpubkey_address: 'bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps', value: 50000000 } }],
      vout: [{ scriptpubkey_address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', value: 49990000 }],
      confirmed: true,
      block_time: 1700000000
    }
    mockFetchAddressInfos.mockResolvedValue(new Map([
      ['bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps', { funded_txo_sum: 50000000, spent_txo_sum: 50000000 }],
      ['1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', { funded_txo_sum: 49990000, spent_txo_sum: 0 }]
    ]))
    mockFetchTransactions.mockResolvedValue([transfer])
    const fromDate = new Date('2020-01-01T00:00:00Z')

    const result = await scrape({
      preferences: {
        wallet1Title: 'Ledger_1',
        wallet1Addresses: 'bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps',
        wallet2Title: 'Ledger_2',
        wallet2Addresses: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      },
      fromDate,
      isFirstRun: true,
      isInBackground: false
    })

    // Настройки должны доехать до загрузки разобранными, а fromDate — нетронутой:
    // без этой проверки потерянный проброс даты тихо сломал бы инкрементальный синк.
    const wallets = [
      {
        id: 'bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps',
        title: 'Ledger_1',
        addresses: ['bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps']
      },
      {
        id: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        title: 'Ledger_2',
        addresses: ['1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2']
      }
    ]
    expect(mockFetchAddressInfos).toHaveBeenCalledWith(wallets)
    expect(mockFetchTransactions).toHaveBeenCalledWith(wallets, fromDate)

    expect(result.accounts.map(account => account.title)).toEqual(['Ledger_1', 'Ledger_2'])
    expect(result.accounts.map(account => account.balance)).toEqual([0, 499900])
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].movements).toHaveLength(2)
  })
})
