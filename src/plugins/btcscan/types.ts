export interface BitcoinAddressInfo {
  'address': string
  'chain_stats': {
    'funded_txo_count': number
    'funded_txo_sum': number
    'spent_txo_count': number
    'spent_txo_sum': number
    'tx_count': number
  }
  // Exists in API, but not used now. Keep for possible future updates
  // 'mempool_stats': {
  //   'funded_txo_count': number
  //   'funded_txo_sum': number
  //   'spent_txo_count': number
  //   'spent_txo_sum': number
  //   'tx_count': number
  // }
}

interface VOut {
  // scriptpubkey: string
  // scriptpubkey_asm: string
  // scriptpubkey_type: string
  scriptpubkey_address: string
  value: number
}

interface VIn {
  txid: string
  vout: number
  prevout: VOut
  // scriptsig: string
  // scriptsig_asm: string
  // witness: string[]
  // is_coinbase: boolean
  // sequence: number
}

export interface BitcoinTransaction {
  txid: string
  vout: VOut[]
  vin: VIn[]
  // fee: number

  // Exists in API, but not used now. Keep for possible future updates
  // weight: number
  status: {
    confirmed: boolean
    // block_height: number
    // block_hash: string
    block_time: number
  }
  // version: number
  // locktime: number
  // size: number
}
