import {
  type Account,
  AccountType,
  type Transaction
} from '../../../types/zenmoney'
import { ETHER_MAINNET, Instruments } from '../common/config'
import type { EthereumAccount, EthereumTransaction } from './types'

function convertWeiToUETH (value: number): number {
  return Math.round(value / 10 ** 12)
}

export function getTransactionFee (transaction: EthereumTransaction): number {
  const { gasPrice, gasUsed } = transaction

  return convertWeiToUETH(Number(gasPrice) * Number(gasUsed))
}

function convertAccount (
  { account, balance }: EthereumAccount,
  instrument: string
): Account {
  return {
    id: account,
    type: AccountType.checking,
    title: account,
    instrument,
    balance: convertWeiToUETH(Number(balance)),
    syncIds: [account]
  }
}

export function convertAccounts (
  accounts: EthereumAccount[],
  instrument: string = Instruments[ETHER_MAINNET]
): Account[] {
  return accounts.map((account) => convertAccount(account, instrument))
}

export function convertTransaction (
  account: string,
  transaction: EthereumTransaction
): Transaction | null {
  const direction = transaction.from === account ? 'PAYMENT' : 'DEPOSIT'
  const targetAccount =
    direction === 'PAYMENT' ? transaction.to : transaction.from
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
        fee:
          direction === 'PAYMENT' ? sign * getTransactionFee(transaction) : 0
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

export function convertTransactions (
  account: string,
  transactions: EthereumTransaction[]
): Transaction[] {
  const list = transactions
    .map((transaction) => convertTransaction(account, transaction))
    .filter((transaction): transaction is Transaction =>
      Boolean(transaction?.movements.some((movement) => movement.sum !== 0))
    )

  return list
}
