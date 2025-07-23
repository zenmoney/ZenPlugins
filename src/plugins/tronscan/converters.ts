import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { Transfer, TronTransaction } from './api'
import { isSupportedToken, TOKENS_CONFIG, SupportedTokenInfo } from './config'

function getAccountId (wallet: string, tokenId: string): string {
  if (tokenId === '_') {
    return wallet
  }

  return `${wallet}_${tokenId}`
}

export function convertAccount (tokenInfo: SupportedTokenInfo, wallet: string): AccountOrCard {
  const accountId = getAccountId(wallet, tokenInfo.tokenId)
  const { title, currency, balanceProperty } = TOKENS_CONFIG[tokenInfo.tokenAbbr]

  return {
    id: accountId,
    type: AccountType.ccard,
    title: title ?? tokenInfo.tokenName,
    instrument: currency,
    balance: Number(tokenInfo[balanceProperty] ?? 0),
    available: Number(tokenInfo.quantity ?? 0),
    creditLimit: 0,
    syncIds: [accountId]
  }
}

export function convertTransaction (transfer: Transfer, wallet: string, transaction?: TronTransaction): Transaction | null {
  const operationSign = transfer.from_address === wallet ? -1 : 1
  const sum = operationSign * Number(transfer.quant) / (10 ** transfer.tokenInfo.tokenDecimal)
  const accountId = getAccountId(wallet, transfer.tokenInfo.tokenId)
  const merchantName = transfer.from_address === wallet ? transfer.to_address : transfer.from_address

  if (!isSupportedToken(transfer.tokenInfo)) {
    return null
  }

  // Skip trash transactions
  if (Math.abs(sum) < 0.01) {
    return null
  }

  return {
    hold: false,
    date: new Date(transfer.block_ts),
    movements: [
      {
        id: transfer.transaction_id,
        account: { id: accountId },
        sum,
        fee: 0,
        invoice: null
      }
    ],
    merchant: {
      fullTitle: merchantName,
      mcc: null,
      location: null
    },
    comment: null
  }
}

export function convertTokenTransaction (transfer: Transfer, wallet: string, transaction?: TronTransaction): Transaction[] | Transaction | null {
  const operationSign = transfer.from_address === wallet ? -1 : 1
  const tokenTransaction = convertTransaction(transfer, wallet, transaction)

  if (tokenTransaction == null) {
    return null
  }

  if (operationSign === -1 && (transaction != null) && transaction.cost.fee !== 0) {
    return [tokenTransaction, getCostTransaction(transaction)]
  }

  return tokenTransaction
}

export function getCostTransaction (transaction: TronTransaction): Transaction {
  const accountId = getAccountId(transaction.ownerAddress, '_')
  const sum = Number(transaction.cost.fee) / (10 ** 6) * -1

  return {
    hold: false,
    date: new Date(transaction.timestamp),
    movements: [
      {
        id: transaction.hash,
        account: { id: accountId },
        sum,
        fee: 0,
        invoice: null
      }
    ],
    merchant: transaction.toAddress !== null && transaction.toAddress !== ''
      ? {
          fullTitle: transaction.toAddress,
          mcc: null,
          location: null
        }
      : null,
    comment: null
  }
}
