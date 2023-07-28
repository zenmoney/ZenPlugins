import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { TokenInfo, TokenTransfer } from './api'

function getAccountId (wallet: string, tokenId: string): string {
  return `${wallet}_${tokenId}`
}

export function convertAccount (tokenInfo: TokenInfo, wallet: string): AccountOrCard {
  const accountId = getAccountId(wallet, tokenInfo.tokenId)

  return {
    id: accountId,
    type: AccountType.ccard,
    title: tokenInfo.tokenName,
    instrument: 'USDT',
    balance: tokenInfo.quantity,
    available: tokenInfo.quantity,
    creditLimit: 0,
    syncIds: [accountId]
  }
}

export function convertTransaction (transfer: TokenTransfer, wallet: string, tokens: TokenInfo[]): Transaction | null {
  const operationSign = transfer.from_address === wallet ? -1 : 1
  const sum = operationSign * Number(transfer.quant) / (10 ** transfer.tokenInfo.tokenDecimal)
  const accountId = getAccountId(wallet, transfer.tokenInfo.tokenId)
  const merchantName = transfer.from_address === wallet ? transfer.to_address : transfer.from_address

  const token = tokens.find(token => token.tokenId === transfer.tokenInfo.tokenId)

  if (!token) {
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
