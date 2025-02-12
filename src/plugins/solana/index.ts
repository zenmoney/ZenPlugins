
import { flatten } from 'lodash'
import {
  ScrapeFunc,
  Transaction as ZenTransaction
} from '../../types/zenmoney'
import { fetchBalance, fetchTokenAccounts, fetchTransaction, fetchTransactions, newCachedTransactionFetcher, Preferences, TransactionFetcher } from './api'
import { convertAccount, convertTokenAccount, convertTokenTransaction, convertTransaction, isKnownToken, mergeTransferTransactions, TransactionConverter } from './converters'

const lastIdKey = (address: string): string => `lastId-${address}`

const fetchAndParseTransactions = async<T>(address: string, account: T, fromDate: Date, convertFn: TransactionConverter<T>, fetchFn: TransactionFetcher): Promise<ZenTransaction[]> => {
  const lastId = ZenMoney.getData(lastIdKey(address)) as string | undefined

  const transactions = await fetchTransactions(address, { fromDate, lastId }, fetchFn)
  const parsed = transactions.map(transaction => convertFn(account, transaction))

  // if it's a tokenAccount -- movement id would be TxN:TokenAddress
  const newLastId = parsed[0]?.movements[0]?.id?.split(':', 2)[0]
  if (newLastId !== undefined) {
    ZenMoney.setData(lastIdKey(address), newLastId)
  }

  return parsed.filter((item): item is ZenTransaction => item !== null)
}

export const scrape: ScrapeFunc<Preferences> = async ({
  preferences,
  fromDate
}) => {
  const addresses = preferences.addresses.split(',')
  const accounts = await Promise.all(addresses.map(async address => {
    const balance = await fetchBalance(address)
    return convertAccount(address, balance)
  }))

  const knownTokenAccounts = flatten(await Promise.all(addresses.map(async address => {
    const tokenAccounts = await fetchTokenAccounts(address)
    return tokenAccounts.filter(t => isKnownToken(t.mint))
  })))

  const allAccounts = [...accounts, ...knownTokenAccounts.map(convertTokenAccount)]

  const fetchFn = newCachedTransactionFetcher(fetchTransaction)

  const transactions = await Promise.all(addresses.map(
    async address => await fetchAndParseTransactions(address, address, fromDate, convertTransaction, fetchFn)
  ))
  const tokenTransactions = await Promise.all(knownTokenAccounts.map(
    async tokenAccount => await fetchAndParseTransactions(tokenAccount.pubkey, tokenAccount, fromDate, convertTokenTransaction, fetchFn)
  ))

  const allTransactions = flatten([...transactions, ...tokenTransactions])
  const mergedTransactions = mergeTransferTransactions(allTransactions)

  ZenMoney.saveData()

  return {
    accounts: allAccounts,
    transactions: mergedTransactions
  }
}
