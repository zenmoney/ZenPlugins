import { Account, AccountType, Movement, Transaction as ZenTransaction } from '../../types/zenmoney'
import { KNOWN_TOKENS, TOKEN_DECIMALS, ZM_SOL_PRESICION as ZM_SOL_PRECISION } from './constants'
import { TokenAccount, Transaction } from './types'

export function isKnownToken (mint: string): boolean {
  return Object.keys(KNOWN_TOKENS).includes(mint)
}

function convertLamportToSolana (value: number): number {
  return Math.round(ZM_SOL_PRECISION * value / 1e9)
}

function convertTokenAmount (amount: number): number {
  // truncate to 2 decimal digits after point
  return Math.floor(amount / TOKEN_DECIMALS * 100) / 100
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

export function convertTokenAccount (account: TokenAccount): Account {
  // assumes token is known, should be checked beforehand
  const tokenInfo = KNOWN_TOKENS[account.mint]
  return {
    id: account.pubkey,
    type: AccountType.checking,
    title: `${tokenInfo.title} ${account.pubkey}`,
    instrument: tokenInfo.instrument,
    balance: convertTokenAmount(account.amount),
    syncIds: [account.pubkey]
  }
}

function findTransactionTokenMovement (tokenAccount: TokenAccount, transaction: Transaction): Movement | null {
  const accountKeys = transaction.transaction.message.accountKeys
  const accountIndex = accountKeys.findIndex(accountKey => accountKey.pubkey === tokenAccount.pubkey)

  // if a balance is not found -- it must've been zero
  const postBalances = transaction.meta.postTokenBalances
  const postBalance = postBalances.find(b => b.accountIndex === accountIndex)
  const postAmount = (postBalance != null) ? parseInt(postBalance.uiTokenAmount.amount) : 0

  const preBalances = transaction.meta.preTokenBalances
  const preBalance = preBalances.find(b => b.accountIndex === accountIndex)
  const preAmount = (preBalance != null) ? parseInt(preBalance.uiTokenAmount.amount) : 0

  const convertedAmountDiff = convertTokenAmount(postAmount - preAmount)
  if (convertedAmountDiff === 0) {
    return null
  }

  // use TxN:TokenAddress as movement ID
  return {
    id: `${transaction.transaction.signatures[0]}:${tokenAccount.mint}`,
    account: {
      id: tokenAccount.pubkey
    },
    invoice: null,
    sum: convertedAmountDiff,
    fee: 0
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

  let convertedAccountDiff = convertLamportToSolana(accountDiff)
  let convertedAccountFee = convertLamportToSolana(accountFee)

  if (convertedAccountDiff === 0) {
    // if both diff and fee are zero -- skip this txn
    if (convertedAccountFee === 0) {
      return null
    }

    // if diff is zero -- use fee as diff to avoid TSN check failure in the app
    convertedAccountDiff = convertedAccountFee
    convertedAccountFee = 0
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

const createTransaction = function (transaction: Transaction, movement: Movement | null): ZenTransaction | null {
  if (movement == null) {
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

export type TransactionConverter<T> = (account: T, transaction: Transaction) => ZenTransaction | null

export const convertTransaction: TransactionConverter<string> = (account, transaction) => {
  return createTransaction(transaction, findTransactionMovement(account, transaction))
}

export const convertTokenTransaction: TransactionConverter<TokenAccount> = (account, transaction) => {
  return createTransaction(transaction, findTransactionTokenMovement(account, transaction))
}

export function mergeTransferTransactions (transactions: ZenTransaction[]): ZenTransaction[] {
  const list = transactions.reduce<{ [key in string]?: ZenTransaction }>((acc, item) => {
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

  return Object.values(list) as ZenTransaction[]
}
