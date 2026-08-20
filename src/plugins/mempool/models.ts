export const BASE_URL = 'https://mempool.space/api'
// Суммы отдаются в микро-биткойнах, как в btcscan и etherscan (μETH): Zenmoney хранит
// эти валюты в микро-единицах, срезает у инструмента «μ» и подставляет настоящий BTC.
// Отдавать целые монеты с instrument 'BTC' тоже можно — харнесс домножит на 1e6, — но
// тогда деление на 1e8 и обратное умножение набирают хвосты в последнем разряде.
export const SATOSHI_IN_UBTC = 100
export const INSTRUMENT = 'μBTC'
export const PAGE_SIZE = 25
export const WALLET_SLOT_COUNT = 3

export interface Preferences {
  wallet1Title?: string
  wallet1Addresses: string
  wallet2Title?: string
  wallet2Addresses?: string
  wallet3Title?: string
  wallet3Addresses?: string
}

// Кошелёк пользователя: набор адресов, которые он считает одним счётом.
export interface Wallet {
  id: string
  title: string
  addresses: string[]
}

// Плоский срез chain_stats. Адрес в структуре не хранится: идентичность задаёт ключ
// Map в api.ts, а сам адрес мы и так подставляли в URL запроса.
export interface MempoolAddressInfo {
  funded_txo_sum: number
  spent_txo_sum: number
}

// scriptpubkey_address отсутствует у непривязанных выходов (например OP_RETURN),
// поэтому поле nullable, а не обязательное.
export interface MempoolVout {
  scriptpubkey_address: string | null
  value: number
}

export interface MempoolVin {
  prevout: MempoolVout | null
}

export interface MempoolTransaction {
  txid: string
  vin: MempoolVin[]
  vout: MempoolVout[]
  confirmed: boolean
  block_time: number | null
}
