import { sanitizeSyncId } from '../../common/accounts'

/**
 * Конвертер счета из формата платежной системы в формат Дзенмани
 *
 * @param rawAccount счет в формате платежной системы
 * @returns счет в формате Дзенмани
 */
export function convertAccount (rawAccount) {
  if (rawAccount.card_status === 0) {
    return null
  }

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
    date: new Date(rawTransaction.created_timestamp * 1000),
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
