import { sanitizeSyncId } from '../../common/accounts'
import { dateInTimezone } from '../../common/dateUtils'

/**
 * Конвертер счета из формата платежной системы в формат Дзенмани
 *
 * @param rawAccount счет в формате платежной системы
 * @returns счет в формате Дзенмани
 */
export function convertAccount (rawAccount) {
  return {
    id: String(rawAccount.id),
    title: rawAccount.description,
    syncIds: [sanitizeSyncId(rawAccount.accno.replace(/\s/g, ''))],
    instrument: rawAccount.currency_code,
    type: rawAccount.removable === 0 ? 'checking' : 'ccard',
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
  let result = {}
  const accountsIds = []
  const accountsSyncIdsHash = {}

  for (const account of accounts) {
    accountsIds.push(Number(account.id))
    for (const syncId of account.syncIds) {
      accountsSyncIdsHash[syncId.replace(/\*{6}/, '****')] = account.id
    }
  }

  const isUnknownAccount = !accountsIds.includes(transaction.account_id)

  /**
   * Если это операция пополнение кошелька (-6) или в идентификаторе счета указан неизвестный счет (скорее всего, мерчанта),
   * то ставим идентификатор счета равным идентификатору кошелька, потому что по факту производится оплата с кошелька или зачисление на кошелек.
   * @todo выявить и пройтись по всем минусовым `service_id`, сделать check'и и связки.
   * Например, пополнение кошелька (-6) невозможно без прикрепленной карты, а значит это перевод, и нужно это соответственно оформить
   */
  if ((transaction.service_id === -6 && transaction.credit === 1) || isUnknownAccount) {
    const checkingAccount = accounts.find(account => account.type === 'checking')
    const txParamsKeys = ['cntrg_info_param2', 'cntrg_info_param3', 'cntrg_info_param4', 'cntrg_info_param5']
    let accountId
    txParamsKeys.find(paramName => {
      if (accountsSyncIdsHash[transaction[paramName]]) {
        accountId = accountsSyncIdsHash[transaction[paramName]]
      }
      return accountId
    })

    if (accountId) {
      result = accounts.find(account => account.id === accountId)
    } else if (checkingAccount) {
      result = checkingAccount
    }
  }

  return result
}

/**
 * Конвертер транзакции из формата платежной системы в формат Дзенмани
 *
 * @param apiTransaction транзакция в формате платежной системы
 * @param accounts аккаунты в формате Дзенмани
 * @returns транзакция в формате Дзенмани
 */
export function convertTransaction (apiTransaction, accounts) {
  const sign = apiTransaction.credit === 0 ? -1 : 1
  const amount = sign * Number(apiTransaction.amount.replace(/\s/g, ''))
  let fee = 0
  if (sign === -1 && apiTransaction.comission_amount) {
    fee = sign * apiTransaction.comission_amount
  }

  const transactionAccount = getApiTransactionAccount(apiTransaction, accounts)

  const transaction = {
    date: dateInTimezone(new Date(apiTransaction.created_timestamp * 1000), 0),
    hold: apiTransaction.state === 2 ? false : null,
    merchant: apiTransaction.card_sender ? {
      country: null,
      city: null,
      title: apiTransaction.card_sender,
      mcc: null,
      location: null
    } : null,
    movements: [
      {
        id: String(apiTransaction.payment_id),
        account: { id: String(transactionAccount.id) },
        invoice: null,
        sum: amount,
        fee
      }
    ],
    comment: apiTransaction.transType_desc
  }

  if (
    apiTransaction.transType_desc === 'Зачисление на карту' &&
    apiTransaction.bank_sender !== apiTransaction.bank_recipient
  ) {
    transaction.movements.push({
      id: null,
      account: {
        type: apiTransaction.service_name === 'Перевод с карты на карту' ? 'ccard' : 'checking',
        instrument: transactionAccount.instrument,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: -1 * amount,
      fee: sign && apiTransaction.comission_amount ? -1 * apiTransaction.comission_amount : 0
    })
  }

  return transaction
}

export function convertTransactions (apiTransactions, accounts) {
  return apiTransactions.reduce((accumulator, apiTransaction) => {
    if (apiTransaction.state !== -1) {
      accumulator.push(convertTransaction(apiTransaction, accounts))
    }

    return accumulator
  }, [])
}
