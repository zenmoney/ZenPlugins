import { sanitizeSyncId } from '../../common/accounts'
import { dateInTimezone } from '../../common/dateUtils'

/**
 * Конвертер счета из формата платежной системы в формат Дзенмани
 *
 * @param rawAccount счет в формате платежной системы
 * @returns счет в формате Дзенмани
 */
export function convertAccount (rawAccount) {
  const account = {
    id: String(rawAccount.id),
    title: rawAccount.description,
    syncIds: [sanitizeSyncId(rawAccount.accno.replace(/\s/g, ''))],

    instrument: rawAccount.currency_code,
    type: rawAccount.removable === 0 ? 'checking' : 'ccard',

    balance: rawAccount.balance
  }

  return account
}

/**
 * Конвертер транзакции из формата платежной системы в формат Дзенмани
 *
 * @param rawTransaction транзакция в формате платежной системы
 * @returns транзакция в формате Дзенмани
 */
export function convertTransaction (rawTransaction) {
  const sign = rawTransaction.credit === 0 ? -1 : 1

  const transaction = {
    date: dateInTimezone(new Date(rawTransaction.created_timestamp * 1000), 0),
    hold: false,
    merchant: {
      country: null,
      city: null,
      title: rawTransaction.service_name,
      mcc: null,
      location: null
    },
    movements: [
      {
        id: String(rawTransaction.payment_id),
        account: { id: String(rawTransaction.account_id) },
        invoice: null,
        sum: sign * Number(rawTransaction.amount.replace(/\s/g, '')),
        fee: 0
      }
    ],
    comment: rawTransaction.transType_desc
  }

  return transaction
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
