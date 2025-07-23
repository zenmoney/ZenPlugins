import { Account, AccountType, Transaction } from '../../../types/zenmoney'
import { generateTokenAddress, SUPPORTED_TOKENS } from './config'
import { TokenAccount, TokenTransaction } from './types'

function convertAccount (account: TokenAccount): Account | null {
  const token = SUPPORTED_TOKENS.find(token => token.contractAddress === account.contractAddress)

  if (token == null) {
    return null
  }

  const id = generateTokenAddress(account.id, token)

  return {
    id,
    type: AccountType.checking,
    title: `${token.title} ${account.id}`,
    instrument: token.instrument,
    balance: token.convertBalance(account.balance),
    syncIds: [id]
  }
}

export function convertAccounts (accounts: TokenAccount[]): Account[] {
  return accounts.map(convertAccount).filter((account): account is Account => account !== null)
}

export function convertTransaction (account: TokenAccount, transaction: TokenTransaction): Transaction | null {
  const token = SUPPORTED_TOKENS.find(token => token.contractAddress === account.contractAddress)

  if (token == null) {
    return null
  }

  const direction = transaction.from === account.id ? 'PAYMENT' : 'DEPOSIT'
  const targetAccount = direction === 'PAYMENT' ? transaction.to : transaction.from
  const sign = direction === 'PAYMENT' ? -1 : 1
  const operationValue = token.convertBalance(Number(transaction.value))

  return {
    hold: null,
    date: new Date(Number(transaction.timeStamp) * 1000),
    movements: [
      {
        id: transaction.hash,
        account: {
          id: generateTokenAddress(account.id, token)
        },
        invoice: null,
        sum: sign * operationValue,
        fee: 0
      }
    ],
    merchant: {
      fullTitle: targetAccount,
      mcc: null,
      location: null
    },
    comment: null
  }
}

export function convertTransactions (account: TokenAccount, transactions: TokenTransaction[]): Transaction[] {
  const list = transactions
    .map((transaction) => convertTransaction(account, transaction))
    .filter((transaction): transaction is Transaction => transaction !== null)

  console.log('LST', list)

  return list
}
