import {
  type Account,
  AccountType,
  type Transaction
} from '../../../types/zenmoney'
import { ETHER_MAINNET, Instruments, chainAccountId } from '../common/config'
import { normalizeMerchant } from '../common/merchants'
import type { Chain } from '../common/types'
import type { EthereumAccount, EthereumTransaction } from './types'

const MIN_MOVEMENT_SUM = 0.01

function convertWeiToUETH (value: number): number {
  return Math.round(value / 10 ** 12)
}

export function getTransactionFee (transaction: EthereumTransaction): number {
  const { gasPrice, gasUsed } = transaction

  return convertWeiToUETH(Number(gasPrice) * Number(gasUsed))
}

function convertAccount (
  { account, balance }: EthereumAccount,
  instrument: string,
  chain: Chain
): Account {
  const id = chainAccountId(chain, account)
  return {
    id,
    type: AccountType.checking,
    title: account,
    instrument,
    balance: convertWeiToUETH(Number(balance)),
    syncIds: [id]
  }
}

export function convertAccounts (
  accounts: EthereumAccount[],
  instrument: string = Instruments[ETHER_MAINNET],
  chain: Chain = ETHER_MAINNET
): Account[] {
  return accounts.map((account) => convertAccount(account, instrument, chain))
}

export function convertTransaction (
  account: string,
  transaction: EthereumTransaction,
  chain: Chain = ETHER_MAINNET
): Transaction | null {
  const accountId = chainAccountId(chain, account)
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
          id: accountId
        },
        invoice: null,
        sum: sign * operationValue,
        fee:
          direction === 'PAYMENT' ? sign * getTransactionFee(transaction) : 0
      }
    ],
    merchant: {
      fullTitle: normalizeMerchant(targetAccount, account, chain),
      mcc: null,
      location: null
    },
    comment: null
  }
}

export function convertTransactions (
  account: string,
  transactions: EthereumTransaction[],
  chain: Chain = ETHER_MAINNET
): Transaction[] {
  const list = transactions
    .map((transaction) => convertTransaction(account, transaction, chain))
    .filter((transaction): transaction is Transaction =>
      Boolean(
        transaction?.movements.some((movement) =>
          movement.sum !== null && Math.abs(movement.sum) >= MIN_MOVEMENT_SUM
        )
      )
    )

  return list
}
