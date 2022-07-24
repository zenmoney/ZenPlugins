import { Account, AccountType, Transaction } from '../../types/zenmoney'
import { EthereumAccount, EthereumTransaction } from './types'

function convertWeiToUETH (value: number): number {
  return Math.round(value / 10 ** 12)
}

function getTransactionFee (transaction: EthereumTransaction): number {
  const { gasPrice, gasUsed } = transaction

  return convertWeiToUETH(Number(gasPrice) * Number(gasUsed))
}

function convertAccount ({ account, balance }: EthereumAccount): Account {
  return {
    id: account,
    type: AccountType.checking,
    title: account,
    instrument: 'μETH',
    balance: convertWeiToUETH(Number(balance)),
    syncIds: [account]
  }
}

export function convertAccounts (accounts: EthereumAccount[]): Account[] {
  return accounts.map(convertAccount)
}

export function convertTransaction (account: string, transaction: EthereumTransaction): Transaction | null {
  const direction = transaction.from === account ? 'PAYMENT' : 'DEPOSIT'
  const targetAccount = direction === 'PAYMENT' ? transaction.to : transaction.from
  const sign = direction === 'PAYMENT' ? -1 : 1
  const operationValue = convertWeiToUETH(Number(transaction.value))

  if (transaction.isError === '1') {
    return null
  }

  return {
    hold: null,
    date: new Date(Number(transaction.timeStamp) * 1000),
    movements: [
      {
        id: transaction.hash,
        account: {
          id: account
        },
        invoice: null,
        sum: sign * operationValue,
        fee: direction === 'PAYMENT' ? sign * getTransactionFee(transaction) : 0
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

export function mergetTransferTransactions (transactions: Transaction[]): Transaction[] {
  const list = transactions.reduce<{[key in string]?: Transaction}>((acc, item) => {
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

  return Object.values(list) as Transaction[]
}

export function convertTransactions (account: string, transactions: EthereumTransaction[]): Transaction[] {
  const list = transactions
    .map((transaction) => convertTransaction(account, transaction))
    .filter((transaction): transaction is Transaction => !!transaction)

  return list
}
