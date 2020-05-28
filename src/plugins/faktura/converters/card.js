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

  for (const equity of data.equities) {
    if (equity.type === 'FUNDS') {
      account.instrument = resolveCurrencyCode(equity.currencyCode)
      account.balance = Number(equity.amount)
    }
  }

  for (const credit of credits) {
    if (credit.contractId === data.contractId) {
      account.creditLimit = Number(credit.grantedAmount)
      account.balance = account.balance - account.creditLimit
    }
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
