
import flatten from 'lodash/flatten'
import {
  ScrapeFunc
} from '../../types/zenmoney'
import { fetchAddressesInfo, fetchAddressTransactions, Preferences } from './api'
import { convertAccounts, convertTransactions, mergeTransferTransactions } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({
  preferences,
  fromDate
}) => {
  const addresses = preferences.addresses.split(',')
  const addressInfoList = await fetchAddressesInfo(addresses)
  const accounts = convertAccounts(addressInfoList)
  const transactions = await Promise.all(addresses.map(async address => {
    const btcTransactions = await fetchAddressTransactions({
      address,
      fromDate
    })
    return convertTransactions(address, btcTransactions)
  }))

  return {
    accounts,
    transactions: mergeTransferTransactions(flatten(transactions))
  }
}
