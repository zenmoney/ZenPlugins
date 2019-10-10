/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { TYPES as ZENMONEY_ACCOUNT_TYPE } from '../constants/zenmoney_accounts'
import { entity } from '../zenmoney_entity/account'
import { resolveCurrencyCode, walletUniqueAccountId as accountId } from './helpers'

const converter = (data) => {
  const account = entity()

  account.id = accountId(data.id)
  account.title = data.name
  account.type = ZENMONEY_ACCOUNT_TYPE.CHECK
  account.instrument = resolveCurrencyCode(data.currencyCode)
  account.balance = Number(data.amount)
  account.syncID = [
    data.ean.toString()
  ]

  return account
}

const contractIdsFetcher = (data) => {
  let list = []

  data.forEach((item) => {
    list.push(item.contractId)
  })

  return list
}

export {
  contractIdsFetcher,
  converter
}
