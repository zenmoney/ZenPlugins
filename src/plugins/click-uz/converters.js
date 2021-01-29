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
 * @param apiTransaction транзакция в формате платежной системы
 * @param accounts аккаунты в формате Дзенмани
 * @returns транзакция в формате Дзенмани
 */
export function convertTransaction (apiTransaction, accounts) {
  let transactionAccount = getApiTransactionAccount(apiTransaction, accounts)
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
      makeMovement(apiTransaction, transactionAccount, false)
    ],
    comment: apiTransaction.service_name || apiTransaction.transType_desc
  };
  [
    parseInnerTransfer,
    parseOuterTransfer
  ].some(parser => parser(transaction, apiTransaction, transactionAccount, accounts))

  return transaction
}

function parseInnerTransfer (transaction, apiTransaction, transactionAccount, accounts) {
  const secondTransactionAcc = getApiTransactionAccount({
    ...apiTransaction,
    account_id: null
  }, accounts)

  if (secondTransactionAcc && secondTransactionAcc.id !== transactionAccount.id) {
    transaction.groupKeys = [
      `${apiTransaction.created}_${secondTransactionAcc.instrument}_${Math.round(Math.abs(transaction.movements[0]?.sum) * 100) / 100}`
    ]
    return true
  }
  return false
}

function parseOuterTransfer (transaction, apiTransaction, transactionAccount) {
  if (apiTransaction.bank_sender !== apiTransaction.bank_recipient) {
    const movement = makeMovement(apiTransaction, transactionAccount, true)
    transaction.movements.push(movement)
    return true
  }
  return false
}

function makeMovement (apiTransaction, transactionAccount, isOuter) {
  let sign = apiTransaction.credit === 0 ? -1 : 1
  if (isOuter) {
    sign = -1 * sign
  }
  const amount = sign * Number(apiTransaction.amount.replace(/\s/g, ''))
  let fee = 0
  if (sign === -1 && apiTransaction.comission_amount) {
    fee = sign * apiTransaction.comission_amount
  }

  const account = isOuter ? {
    type: apiTransaction.service_name === 'Перевод с карты на карту' ? 'ccard' : 'checking',
    instrument: transactionAccount.instrument,
    company: null,
    syncIds: null
  } : {
    id: String(transactionAccount.id)
  }

  return {
    id: isOuter ? null : String(apiTransaction.payment_id),
    account,
    invoice: null,
    sum: amount,
    fee
  }
}

export function convertTransactions (apiTransactions, accounts) {
  return apiTransactions.reduce((accumulator, apiTransaction) => {
    if (apiTransaction.state !== -1) {
      accumulator.push(convertTransaction(apiTransaction, accounts))
    }

    return accumulator
  }, [])
}
