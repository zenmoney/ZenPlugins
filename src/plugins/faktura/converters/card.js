/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { TYPES as ZENMONEY_ACCOUNT_TYPE } from '../constants/zenmoney_accounts'
import { entity } from '../zenmoney_entity/account'
import { cardUniqueAccountId as accountId, resolveCurrencyCode } from './helpers'

const converter = (data, credits) => {
  const account = entity()

  account.id = accountId(data.id)
  account.title = data.name
  account.type = ZENMONEY_ACCOUNT_TYPE.CARD
  account.syncID = [
    data.ean.toString(),
    data.panTail.toString()
  ]

  for (const credit of credits) {
    if (credit.contractId === data.contractId) {
      account.creditLimit = Number(credit.grantedAmount)
    }
  }
  const funds = data.equities.find(equity => equity.type === 'FUNDS')
  const balance = funds || data.equities.find(equity => equity.type === 'OWN_AMOUNT_REMAINING')
  if (balance) {
    account.instrument = resolveCurrencyCode(balance.currencyCode)
    account.balance = Number(balance.amount) - (funds ? account.creditLimit : 0)
  }

  return account
}

const contractIdsFetcher = (data) => {
  const list = []

  for (const item of data) {
    list.push(item.contractId)
  }

  return list
}

export {
  contractIdsFetcher,
  converter
}
