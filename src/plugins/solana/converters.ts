import { Account, AccountType, Movement, Transaction as ZenTransaction } from '../../types/zenmoney'
import { Transaction } from './types'

const ZM_SOL_PRESICION = 1e6

function convertLamportToSolana (value: number): number {
  return Math.round(ZM_SOL_PRESICION * value / 1e9)
}

export function convertAccount (address: string, balance: number): Account {
  return {
    id: address,
    type: AccountType.checking,
    title: address,
    instrument: 'μSOL',
    balance: convertLamportToSolana(balance),
    syncIds: [address]
  }
}

function findTransactionMovement (account: string, transaction: Transaction): Movement | null {
  const accountKeys = transaction.transaction.message.accountKeys
  const accountIndex = accountKeys.findIndex(accountKey => accountKey.pubkey === account)
  const diffBalances = transaction.meta.postBalances.map((item, index) => item - transaction.meta.preBalances[index])

  // if fee was paid by "account" -- it's already in the accountDiff, and accountDiff has to be adjusted
  // otherwise fee should be considered zero since it's paid by other signer
  const accountFee = (accountKeys[accountIndex].signer) ? -transaction.meta.fee : 0
  const accountDiff = diffBalances[accountIndex] - accountFee

  const convertedAccountDiff = convertLamportToSolana(accountDiff)
  const convertedAccountFee = convertLamportToSolana(accountFee)

  if (convertedAccountDiff === 0 && convertedAccountFee === 0) {
    return null
  }

  return {
    id: transaction.transaction.signatures[0],
    account: {
      id: account
    },
    invoice: null,
    sum: convertedAccountDiff,
    fee: convertedAccountFee
  }
}

export function convertTransaction (account: string, transaction: Transaction): ZenTransaction | null {
  const movement = findTransactionMovement(account, transaction)

  if (!movement) {
    return null
  }

  return {
    hold: null,
    date: new Date(Number(transaction.blockTime) * 1000),
    movements: [
      movement
    ],
    merchant: {
      fullTitle: transaction.transaction.signatures[0],
      mcc: null,
      location: null
    },
    comment: null
  }
}

export function mergeTransferTransactions (transactions: ZenTransaction[]): ZenTransaction[] {
  const list = transactions.reduce<{[key in string]?: ZenTransaction}>((acc, item) => {
    const movementId = item.movements[0].id!
    const existingItem = acc[movementId]

    if (!existingItem) {
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

  return Object.values(list) as ZenTransaction[]
}
