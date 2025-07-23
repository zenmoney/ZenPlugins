import { Account, AccountType, Transaction } from '../../../types/zenmoney'

import { BNBAccount, BNBTransaction } from './types'

function convertWeiToUETH (value: number): number {
  return Math.round(value / 10 ** 12)
}

function getTransactionFee (transaction: BNBTransaction): number {
  const { gasPrice, gasUsed } = transaction

  return convertWeiToUETH(Number(gasPrice) * Number(gasUsed))
}

function convertAccount ({ account, balance }: BNBAccount): Account {
  return {
    id: account,
    type: AccountType.checking,
    title: account,
    instrument: 'bnb',
    balance: convertWeiToUETH(Number(balance)),
    syncIds: [account]
  }
}

export function convertAccounts (accounts: BNBAccount[]): Account[] {
  return accounts.map(convertAccount)
}

export function convertTransaction (account: string, transaction: BNBTransaction): Transaction | null {
  const direction = transaction.from === account ? 'PAYMENT' : 'DEPOSIT'
  const targetAccount = direction === 'PAYMENT' ? transaction.to : transaction.from
  const sign = direction === 'PAYMENT' ? -1 : 1
  const operationValue = convertWeiToUETH(Number(transaction.value))

  if (transaction.isError === '1') {
    return null
  }
  if (operationValue === 0) {
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

export function convertTransactions (account: string, transactions: BNBTransaction[]): Transaction[] {
  const list = transactions
    .map((transaction) => convertTransaction(account, transaction))
    .filter((transaction): transaction is Transaction => !(transaction == null))

  return list
}
