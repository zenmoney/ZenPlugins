import { sanitizeSyncId } from '../../common/accounts'
import { dateInTimezone } from '../../common/dateUtils'
import { groupBy } from 'lodash'

/**
 * Конвертер счета из формата платежной системы в формат Дзенмани
 *
 * @param rawAccount счет в формате платежной системы
 * @returns счет в формате Дзенмани
 */
export function convertAccount (rawAccount) {
  const typeCard = rawAccount.removable === 1 || rawAccount.description.match(/VISA/i) // || rawAccount.accno.match(/\s\*{4}\s/)
  return {
    id: String(rawAccount.id),
    title: rawAccount.description,
    syncIds: [sanitizeSyncId(rawAccount.accno.replace(/\s/g, ''))],
    instrument: rawAccount.currency_code,
    type: typeCard ? 'ccard' : 'checking',
    balance: rawAccount.balance
  }
}

export function convertAccounts (accounts, balances) {
  const map = new Map()
  for (const account of accounts) {
    map.set(account.id, account)
  }
  for (const balance of balances) {
    map.set(balance.account_id, { ...map.get(balance.account_id), ...balance })
  }
  const response = Array.from(map.values())

  return response.map(convertAccount)
}

function getApiTransactionAccount (transaction, accounts) {
  let transactionAccount = accounts.find(account => Number(account.id) === transaction.account_id)

  if (!transactionAccount) {
    const accountsSyncIdsHash = {}

    for (const account of accounts) {
      for (const syncId of account.syncIds) {
        accountsSyncIdsHash[syncId.replace(/\*{6}/, '****')] = account.id
      }
    }

    const txParamsKeys = ['cntrg_info_param2', 'cntrg_info_param3', 'cntrg_info_param4', 'cntrg_info_param5']
    let accountId
    txParamsKeys.find(paramName => {
      if (accountsSyncIdsHash[transaction[paramName]]) {
        accountId = accountsSyncIdsHash[transaction[paramName]]
      }
      return accountId
    })

    if (accountId) {
      transactionAccount = accounts.find(account => account.id === accountId)
    }
  }

  return transactionAccount
}

/**
 * Конвертер транзакции из формата платежной системы в формат Дзенмани
 *
 * @param groupedApiTransaction массив операций в формате платежной системы
 * @param accounts аккаунты в формате Дзенмани
 * @returns транзакция в формате Дзенмани
 */
export function convertTransaction (groupedApiTransaction, accounts) {
  let transactionAccount = getApiTransactionAccount(groupedApiTransaction[0], accounts)
  if (!transactionAccount) {
    /**
     * Если аккаунт не найден, то ставим идентификатор счета равным идентификатору кошелька,
     * потому что по факту производится оплата с кошелька или зачисление на кошелек.
     * @todo выявить и пройтись по всем минусовым `service_id`, сделать check'и и связки.
     * Например, пополнение кошелька (-6) невозможно без прикрепленной карты, а значит это перевод, и нужно это соответственно оформить
     */
    transactionAccount = accounts.find(account => account.type === 'checking')
  }
  console.assert(transactionAccount && transactionAccount.id, 'Could not find transaction account')

  const transaction = {
    date: dateInTimezone(new Date(groupedApiTransaction[0].created_timestamp * 1000), 0),
    hold: groupedApiTransaction[0].state === 2 ? false : null,
    merchant: getMerchant(groupedApiTransaction)
  }
  if (!transaction.merchant) {
    transaction.comment = groupedApiTransaction[0].service_name || groupedApiTransaction[0].transType_desc
  }
  [
    parseInnerTransfer,
    parseOuterTransfer,
    parsePayment
  ].some(parser => parser(transaction, groupedApiTransaction, transactionAccount, accounts))

  return transaction
}

function getMerchant (groupedApiTransaction) {
  let merchant = null
  if (groupedApiTransaction.length === 1) {
    const hasServiceName = groupedApiTransaction[0].service_name &&
      [-4, -6, -9].indexOf(groupedApiTransaction[0].service_id) === -1
    if (hasServiceName || groupedApiTransaction[0].card_sender) {
      merchant = {
        country: null,
        city: null,
        title: hasServiceName ? groupedApiTransaction[0].service_name : groupedApiTransaction[0].card_sender,
        mcc: null,
        location: null
      }
    }
  }

  return merchant
}

function parseInnerTransfer (transaction, groupedApiTransaction, transactionAccount, accounts) {
  if (groupedApiTransaction.length === 2) {
    const secondTransactionAcc = getApiTransactionAccount(
      groupedApiTransaction[0],
      accounts.filter(account => account.id !== transactionAccount.id)
    )
    const transaction1 = groupedApiTransaction[0].credit === 0 ? groupedApiTransaction[0] : groupedApiTransaction[1]
    const transaction2 = groupedApiTransaction[0].credit === 1 ? groupedApiTransaction[0] : groupedApiTransaction[1]
    if (secondTransactionAcc) {
      transaction.movements = [
        makeMovement(transaction1, transactionAccount),
        makeMovement(transaction2, secondTransactionAcc)
      ]
      transaction.movements[0].fee = transaction.movements[1].fee = 0

      return true
    }
  }

  return false
}

function parseOuterTransfer (transaction, groupedApiTransaction, transactionAccount) {
  if (
    groupedApiTransaction.length === 1 &&
    groupedApiTransaction[0].bank_sender !== groupedApiTransaction[0].bank_recipient
  ) {
    transaction.movements = [
      makeMovement(groupedApiTransaction[0], transactionAccount),
      makeMovement(groupedApiTransaction[0], null, transactionAccount.instrument)
    ]
    return true
  }
  return false
}

function parsePayment (transaction, groupedApiTransaction, transactionAccount) {
  transaction.movements = [makeMovement(groupedApiTransaction[0], transactionAccount)]
  return true
}

function makeMovement (apiTransaction, transactionAccount, instrument) {
  let sign = apiTransaction.credit === 0 ? -1 : 1
  if (!transactionAccount) {
    sign = -1 * sign
  }
  const sum = sign * Number(apiTransaction.amount.replace(/\s/g, ''))
  let fee = 0
  if (sign === -1 && apiTransaction.comission_amount) {
    fee = sign * apiTransaction.comission_amount
  }

  const account = transactionAccount ? { id: String(transactionAccount.id) } : {
    type: apiTransaction.service_name === 'Перевод с карты на карту' ? 'ccard' : 'checking',
    instrument,
    company: null,
    syncIds: null
  }

  return {
    id: transactionAccount ? String(apiTransaction.payment_id) : null,
    account,
    invoice: null,
    sum,
    fee
  }
}

export function preprocessApiTransactions (apiTransactions) {
  const notRejectedTransactions = apiTransactions.filter(apiTransaction => apiTransaction.state !== -1)
  return Object.values(groupBy(notRejectedTransactions, apiTransaction => apiTransaction.payment_id))
}

export function convertTransactions (apiTransactions, accounts) {
  return preprocessApiTransactions(apiTransactions).map(
    groupedApiTransaction => convertTransaction(groupedApiTransaction, accounts)
  )
}
