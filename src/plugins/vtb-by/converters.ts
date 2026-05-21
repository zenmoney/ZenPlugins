import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { Account, AccountType, Transaction } from '../../types/zenmoney'
import { ensureCurrency, getMaskedCardLastDigits, isNonEmptyString } from './helpers'
import type { FetchAccountMeta } from './types/base'
import type { FetchCardAccount, FetchCardStatementOperation, FetchCurrentAccount, FetchDepositAccount, FetchMiniCardStatementOperation } from './types/fetch'

const getActiveCards = (cards: FetchCardAccount['cards']): FetchCardAccount['cards'] =>
  cards.filter((card) => card.cardStatus !== 'CLOSED')

export const shouldSyncCardAccount = (fetchAccount: FetchCardAccount): boolean =>
  fetchAccount.accountStatus === 'OPEN' && getActiveCards(fetchAccount.cards).length > 0

const getCardAccountTitle = (fetchAccount: FetchCardAccount): string => {
  const [card] = getActiveCards(fetchAccount.cards).length > 0
    ? getActiveCards(fetchAccount.cards)
    : fetchAccount.cards

  if (card == null) return fetchAccount.productName

  const suffix = getMaskedCardLastDigits(card.cardNumberMasked)
  return suffix.length > 0
    ? `${fetchAccount.productName} *${suffix}`
    : fetchAccount.productName
}

export const convertCardAccount = (fetchAccount: FetchCardAccount): Account & FetchAccountMeta => {
  if (fetchAccount.cards.length === 0) throw new Error('No cards linked to card account')

  const currency = ensureCurrency(fetchAccount.currency)

  if (!isNonEmptyString(currency)) throw new Error(`Unknown currency - ${fetchAccount.currency}`)

  const [balanceCard] = getActiveCards(fetchAccount.cards).length > 0
    ? getActiveCards(fetchAccount.cards)
    : fetchAccount.cards

  return {
    id: fetchAccount.contractId,
    title: getCardAccountTitle(fetchAccount),
    balance: balanceCard.balance,
    instrument: currency,
    syncIds: [
      fetchAccount.ibanNum,
      fetchAccount.accountNumber,
      fetchAccount.contractId,
      ...fetchAccount.cards
        .map((card) => getMaskedCardLastDigits(card.cardNumberMasked))
        .filter(isNonEmptyString)
    ],
    type: AccountType.ccard,
    archived: fetchAccount.accountStatus !== 'OPEN' || getActiveCards(fetchAccount.cards).length === 0,
    _meta: {
      productKind: 'card',
      statementInternalAccountId: fetchAccount.internalAccountId,
      statementCardHash: balanceCard.cardHash
    }
  }
}

export const convertCurrentAccount = (fetchAccount: FetchCurrentAccount): Account & FetchAccountMeta => {
  const currency = ensureCurrency(fetchAccount.currency)

  if (!isNonEmptyString(currency)) throw new Error(`Unknown currency - ${fetchAccount.currency}`)

  return {
    id: fetchAccount.contractId,
    title: fetchAccount.productName,
    balance: fetchAccount.balanceAmount,
    instrument: currency,
    syncIds: [fetchAccount.ibanNum, fetchAccount.accountNumber, fetchAccount.contractId],
    type: AccountType.checking,
    archived: fetchAccount.accountStatus !== 'OPEN',
    _meta: {
      productKind: 'current',
      statementInternalAccountId: null,
      statementCardHash: null
    }
  }
}

export const convertDepositAccount = (fetchAccount: FetchDepositAccount): Account & FetchAccountMeta => {
  const currency = ensureCurrency(fetchAccount.currency)

  if (!isNonEmptyString(currency)) throw new Error(`Unknown currency - ${fetchAccount.currency}`)

  const startDate = new Date(fetchAccount.openDate)
  const endDate = new Date(fetchAccount.endDate)
  const { count: endDateOffset, interval: endDateOffsetInterval } = getIntervalBetweenDates(startDate, endDate)

  return {
    id: fetchAccount.contractId,
    title: fetchAccount.personalizedName ?? fetchAccount.productName,
    balance: fetchAccount.balanceAmount,
    instrument: currency,
    syncIds: [fetchAccount.ibanNum, fetchAccount.accountNumber, fetchAccount.contractId],
    type: AccountType.deposit,
    startDate,
    startBalance: fetchAccount.balanceAmount,
    capitalization: /капитал/i.test(fetchAccount.productName),
    percent: fetchAccount.interestRate,
    endDateOffsetInterval,
    endDateOffset,
    payoffInterval: 'month',
    payoffStep: 1,
    archived: fetchAccount.accountStatus !== 'OPEN',
    _meta: {
      productKind: 'deposit',
      statementInternalAccountId: fetchAccount.internalAccountId,
      statementCardHash: null
    }
  }
}

const getSignedAmount = (amount: number, fallbackAmount: number): number => {
  if (amount !== 0) return amount
  return fallbackAmount
}

const getMiniStatementSign = (fetchTransaction: FetchMiniCardStatementOperation): number => {
  if (fetchTransaction.transactionAmount !== 0) {
    return Math.sign(fetchTransaction.transactionAmount)
  }

  if (fetchTransaction.operationAmount !== 0) {
    return Math.sign(fetchTransaction.operationAmount)
  }

  return 1
}

export const convertMiniCardStatementOperation = (fetchTransaction: FetchMiniCardStatementOperation, account: Account): Transaction => {
  const operationCurrency = ensureCurrency(fetchTransaction.operationCurrency) ?? account.instrument
  const transactionCurrency = ensureCurrency(fetchTransaction.transactionCurrency) ?? operationCurrency
  const sign = getMiniStatementSign(fetchTransaction)
  const operationAmount = Math.abs(getSignedAmount(fetchTransaction.operationAmount, fetchTransaction.transactionAmount)) * sign
  const transactionAmount = Math.abs(getSignedAmount(fetchTransaction.transactionAmount, fetchTransaction.operationAmount)) * sign
  const hasInvoice = transactionCurrency !== account.instrument

  return {
    hold: null,
    date: new Date(fetchTransaction.operationDate),
    comment: [fetchTransaction.operationDescription, fetchTransaction.operationPlace]
      .filter(isNonEmptyString)
      .join('\n'),
    movements: [
      {
        id: [
          account.id,
          fetchTransaction.operationDate,
          fetchTransaction.transactionAuthCode ?? '',
          fetchTransaction.transactionAmount,
          fetchTransaction.operationAmount,
          fetchTransaction.operationDescription
        ].join(':'),
        account: { id: account.id },
        fee: 0,
        invoice: hasInvoice
          ? {
              sum: transactionAmount,
              instrument: transactionCurrency
            }
          : null,
        sum: operationCurrency === account.instrument
          ? operationAmount
          : (transactionCurrency === account.instrument ? transactionAmount : null)
      }
    ],
    merchant: null
  }
}

export const convertFullStatementOperation = (fetchTransaction: FetchCardStatementOperation, account: Account): Transaction => {
  const sign = Number(fetchTransaction.operationSign)
  const operationSign = Number.isFinite(sign) && sign !== 0 ? sign : 1
  const operationCurrency = ensureCurrency(fetchTransaction.operationCurrency) ?? account.instrument
  const transactionCurrency = ensureCurrency(fetchTransaction.transactionCurrency) ?? operationCurrency
  const operationAmount = fetchTransaction.operationAmount * operationSign
  const transactionAmount = fetchTransaction.transactionAmount * operationSign
  const hasInvoice = transactionCurrency !== account.instrument

  return {
    hold: null,
    date: new Date(fetchTransaction.transactionDate > 0 ? fetchTransaction.transactionDate : fetchTransaction.operationDate),
    comment: fetchTransaction.operationName,
    movements: [
      {
        id: [
          account.id,
          fetchTransaction.operationDate,
          fetchTransaction.operationCode,
          fetchTransaction.transactionAmount,
          fetchTransaction.operationAmount
        ].join(':'),
        account: { id: account.id },
        fee: 0,
        invoice: hasInvoice
          ? {
              sum: transactionAmount,
              instrument: transactionCurrency
            }
          : null,
        sum: operationCurrency === account.instrument
          ? operationAmount
          : (transactionCurrency === account.instrument ? transactionAmount : null)
      }
    ],
    merchant: null
  }
}
