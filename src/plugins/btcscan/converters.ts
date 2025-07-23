import { Account, AccountType, Movement, Transaction } from '../../types/zenmoney'
import { BitcoinAddressInfo, BitcoinTransaction } from './types'

function convertSatoshiToUBTC (value: number): number {
  return value / 100
}

export function convertAccount (addressInfo: BitcoinAddressInfo): Account {
  return {
    id: addressInfo.address,
    type: AccountType.checking,
    title: addressInfo.address,
    instrument: 'μBTC',
    balance: convertSatoshiToUBTC(addressInfo.chain_stats.funded_txo_sum - addressInfo.chain_stats.spent_txo_sum),
    syncIds: [addressInfo.address]
  }
}

export function convertAccounts (addressInfoList: BitcoinAddressInfo[]): Account[] {
  return addressInfoList.map(convertAccount)
}

function findTransactionMovement (account: string, transaction: BitcoinTransaction): Movement | null {
  const vout = transaction.vout.find(vout => vout.scriptpubkey_address === account)
  const vin = transaction.vin.find(vin => vin.prevout.scriptpubkey_address === account)

  if (vout != null) { // PAYMENT
    return {
      id: transaction.txid,
      account: {
        id: account
      },
      invoice: null,
      sum: convertSatoshiToUBTC(vout.value),
      fee: 0
    }
  }

  if (vin != null) { // DEPOSIT
    return {
      id: transaction.txid,
      account: {
        id: account
      },
      invoice: null,
      sum: -1 * convertSatoshiToUBTC(vin.prevout.value),
      fee: 0
    }
  }

  return null
}

export function convertTransaction (account: string, transaction: BitcoinTransaction): Transaction | null {
  const movement = findTransactionMovement(account, transaction)

  if (movement == null) {
    return null
  }

  if (!transaction.status.confirmed) {
    return null
  }

  return {
    hold: null,
    date: new Date(Number(transaction.status.block_time) * 1000),
    movements: [
      movement
    ],
    merchant: {
      fullTitle: transaction.txid,
      mcc: null,
      location: null
    },
    comment: null
  }
}

export function convertTransactions (account: string, transactions: BitcoinTransaction[]): Transaction[] {
  const list = transactions
    .map((transaction) => convertTransaction(account, transaction))
    .filter((transaction): transaction is Transaction => !(transaction == null))

  return list
}

export function mergeTransferTransactions (transactions: Transaction[]): Transaction[] {
  const list = transactions.reduce<{ [key in string]?: Transaction }>((acc, item) => {
    const movementId = item.movements[0].id ?? ''
    const existingItem = acc[movementId]

    if (existingItem == null) {
      acc[movementId] = item
    } else {
      acc[movementId] = {
        ...existingItem,
        movements: [
          existingItem.movements[0],
          item.movements[0]
        ],
        merchant: null
      }
    }

    return acc
  }, {})

  return Object.values(list) as Transaction[]
}
