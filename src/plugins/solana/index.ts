
import { flatten } from 'lodash'
import {
  ScrapeFunc,
  Transaction
} from '../../types/zenmoney'
import { fetchBalance, fetchTransactions, Preferences } from './api'
import { convertAccount, convertTransaction, mergeTransferTransactions } from './converters'

const lastIdKey = (address: string): string => `lastId-${address}`

export const scrape: ScrapeFunc<Preferences> = async ({
  preferences,
  fromDate
}) => {
  const addresses = preferences.addresses.split(',')
  const accounts = await Promise.all(addresses.map(async address => {
    const balance = await fetchBalance(address)
    const account = convertAccount(address, balance)
    return account
  }))

  const transactions = await Promise.all(addresses.map(async address => {
    const lastId = ZenMoney.getData(lastIdKey(address)) as string | undefined
    const transactions = await fetchTransactions(address, {
      fromDate,
      lastId
    })
    const parsed = transactions.map(transaction => convertTransaction(address, transaction))
    const newLastId = parsed[0]?.movements[0].id

    if (newLastId !== undefined) {
      ZenMoney.setData(lastIdKey(address), newLastId)
    }

    return parsed
  }))

  ZenMoney.saveData()

  return {
    accounts,
    transactions: mergeTransferTransactions(flatten(transactions).filter((item): item is Transaction => item !== null))
  }
}
