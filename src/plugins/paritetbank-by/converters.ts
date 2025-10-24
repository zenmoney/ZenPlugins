import { Account, AccountReferenceByData, AccountReferenceById, AccountType, Merchant, Transaction } from '../../types/zenmoney'
import type { FetchCardAccount, FetchCurrentAccount, FetchTransaction } from './types/fetch'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

/**
 * Ensures that a valid currency name is returned from a given string
 * that may represent either a currency name or a numeric code.
 *
 * @param {string} codeOrName - A currency name (alphabetic code) or a numeric code as a string.
 * @returns {string|undefined} A valid currency code, or `undefined` if no match was found.
 *
 * @example
 * ensureCurrency("BYN") // → "BYN"
 * ensureCurrency("933") // → "EUR"
 */
export const ensureCurrency = (codeOrName: string): string | undefined =>
  isNaN(Number(codeOrName))
    ? codeOrName
    : codeToCurrencyLookup[codeOrName]

export const convertCardAccount = (fetchAccount: FetchCardAccount): Account => {
  if (fetchAccount.cards.at(0) == null) throw new Error('No card linked to CardAccount')

  const [firstCard] = fetchAccount.cards

  const currency = ensureCurrency(fetchAccount.currency)

  if (!currency) throw new Error(`Unknown currency - ${fetchAccount.currency}`)

  return {
    id: fetchAccount.contractNumber,
    title: firstCard.name,
    balance: firstCard.balance,
    instrument: currency,
    syncIds: [
      fetchAccount.ibanNum,
      fetchAccount.contractNumber,
      ...fetchAccount.cards.map((card) => card.cardNumberMasked.slice(-4))
    ],
    type: AccountType.ccard
  }
}

export const convertCurrentAccount = (fetchAccount: FetchCurrentAccount): Account => {
  const currency = ensureCurrency(fetchAccount.currency)

  if (!currency) throw new Error(`Unknown currency - ${fetchAccount.currency}`)

  return {
    id: fetchAccount.contractNumber,
    title: fetchAccount.ibanNum,
    balance: fetchAccount.balanceAmount,
    instrument: currency,
    syncIds: [fetchAccount.ibanNum, fetchAccount.contractNumber],
    type: AccountType.checking
  }
}

export const convertTransaction = (fetchTransaction: FetchTransaction, account: Account): Transaction => {
  const [country, ...restParts] = (fetchTransaction.operationLocation ?? '').split(' ')
  const transactionCurrency = ensureCurrency(fetchTransaction.currency)

  if (!transactionCurrency) throw new Error(`Unknown currency - ${fetchTransaction.currency}`)

  return {
    hold: null,
    date: new Date(fetchTransaction.paymentDate),
    comment: fetchTransaction.payName === fetchTransaction.servicePoint ? '' : (fetchTransaction.payName ?? ''),
    movements: [
      {
        id: fetchTransaction.rrn ?? fetchTransaction.paymentId ?? fetchTransaction.operationId ?? null,
        account: { id: account.id } as AccountReferenceById,
        fee: 0, // @TODO: use commission?
        invoice: transactionCurrency === account.instrument ? null : { sum: fetchTransaction.amount, instrument: transactionCurrency },
        sum: transactionCurrency === account.instrument ? fetchTransaction.amount : null
      }
    ],
    merchant: (fetchTransaction.mcc
      ? {
          country,
          city: restParts.join(' '),
          mcc: Number(fetchTransaction.mcc),
          title: fetchTransaction.servicePoint ?? '',
          location: null,
          category: ''
        } as Merchant
      : null)
  }
}
