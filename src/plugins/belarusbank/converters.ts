import md5 from 'crypto-js/md5'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { AccountType, type ExtendedTransaction, type Transaction } from '../../types/zenmoney'
import { asNonEmptyString, getLastCardDigits, isArchived, normalizeCurrency, parseDate, parseMinskDate, parseRequiredDate, toNumber, toOptionalNumber, uniqueStrings } from './helpers'
import type { ProductAccount } from './models'
import type { BankAccount, Card, CardTransaction, Credit, PaymentHistoryItem } from './types/fetch'

const getTitle = (name: unknown, fallback: string): string => asNonEmptyString(name) ?? fallback

const withArchived = <T extends object>(target: T, status: unknown): T & { archived?: boolean } => {
  const archived = isArchived(status)
  return archived == null ? target : { ...target, archived }
}

const getProductArchivedStatus = (product: { isArchived?: boolean, status?: string | number, statusName?: string }): boolean | undefined =>
  product.isArchived ?? isArchived(product.status ?? product.statusName)

const getCreditArchivedStatus = (credit: Credit): boolean | undefined => {
  if (credit.isArchived != null) return credit.isArchived

  const numericStatus = Number(credit.status)
  if (Number.isFinite(numericStatus)) return [-1, 8, 9, 11].includes(numericStatus)
  return isArchived(credit.status ?? credit.statusName)
}

export const convertCard = (card: Card, linkedAccount?: BankAccount): ProductAccount => {
  const productId = String(card.productId)
  const lastDigits = getLastCardDigits(card.cardPAN)
  const baseTitle = getTitle(card.name, getTitle(card.cardProductKindName, 'Карта Беларусбанка'))
  const title = lastDigits == null || baseTitle.includes(lastDigits) ? baseTitle : `${baseTitle} *${lastDigits}`
  const hasServiceRight = (rightIndex: number): boolean => card.serviceRights == null || card.serviceRights[rightIndex] === '1'
  const cardAvailable = toOptionalNumber(card.amount)
  const linkedAccountBalance = toOptionalNumber(linkedAccount?.contractCurrentRest)

  return withArchived({
    id: productId,
    type: AccountType.ccard,
    title,
    instrument: normalizeCurrency(card.currencyIso),
    syncIds: uniqueStrings([
      productId,
      card.productCardId,
      card.ibanNum,
      card.cardAccountNumber,
      card.contractNumber,
      linkedAccount?.productId,
      linkedAccount?.ibanNum,
      linkedAccount?.contractNumber,
      lastDigits
    ]),
    balance: cardAvailable ?? linkedAccountBalance,
    available: cardAvailable,
    _meta: {
      productId,
      transactionCardId: productId,
      statementProductId: productId,
      cardTransactionsAllowed: hasServiceRight(17),
      cardStatementAllowed: hasServiceRight(16),
      productKind: 'card' as const
    }
  }, card.isArchived ?? (Number(card.status) === -1 ? true : isArchived(card.status)))
}

export const convertAccount = (account: BankAccount): ProductAccount => {
  const productId = String(account.productId)

  return withArchived({
    id: productId,
    type: AccountType.checking,
    title: getTitle(account.name, getTitle(account.contractKindName, getTitle(account.contractNumber, 'Счёт Беларусбанка'))),
    instrument: normalizeCurrency(account.contractCurrencyIso ?? account.contractCurrency),
    syncIds: uniqueStrings([productId, account.ibanNum, account.contractNumber]),
    balance: toOptionalNumber(account.contractCurrentRest),
    _meta: {
      productId,
      transactionCardId: null,
      statementProductId: productId,
      productKind: 'account' as const
    }
  }, getProductArchivedStatus(account))
}

export const convertDeposit = (deposit: BankAccount): ProductAccount => {
  const productId = String(deposit.productId)
  const startDate = parseDate(deposit.contractOpenDate, new Date(0))
  const endDate = parseDate(deposit.contractEndDate ?? deposit.contractCloseDate ?? deposit.returnDate, new Date(Date.UTC(startDate.getUTCFullYear() + 1, startDate.getUTCMonth(), startDate.getUTCDate())))
  const { count: endDateOffset, interval: endDateOffsetInterval } = getIntervalBetweenDates(startDate, endDate)
  const balance = toOptionalNumber(deposit.contractCurrentRest)
  const description = `${deposit.name ?? ''} ${deposit.contractKindName ?? ''}`
  const capitalization = /капитализац|capitaliz/i.test(description) && !/без капитализац|without capitaliz/i.test(description)
  const hasMonthlyPayoff = /ежемесяч|monthly/i.test(description)

  return withArchived({
    id: productId,
    type: AccountType.deposit,
    title: getTitle(deposit.name, getTitle(deposit.contractKindName, getTitle(deposit.contractNumber, 'Вклад Беларусбанка'))),
    instrument: normalizeCurrency(deposit.contractCurrencyIso ?? deposit.contractCurrency),
    syncIds: uniqueStrings([productId, deposit.ibanNum, deposit.contractNumber]),
    balance,
    startDate,
    startBalance: balance ?? 0,
    capitalization,
    percent: toOptionalNumber(deposit.percRate),
    endDateOffsetInterval,
    endDateOffset,
    payoffInterval: hasMonthlyPayoff ? 'month' as const : null,
    payoffStep: hasMonthlyPayoff ? 1 : 0,
    _meta: {
      productId,
      transactionCardId: null,
      statementProductId: null,
      productKind: 'deposit' as const
    }
  }, getProductArchivedStatus(deposit))
}

export const convertCredit = (credit: Credit): ProductAccount => {
  const productId = String(credit.productId)
  const startDate = parseDate(credit.contractOpenDate, new Date(0))
  const endDate = parseDate(credit.returnDate, new Date(Date.UTC(startDate.getUTCFullYear() + 1, startDate.getUTCMonth(), startDate.getUTCDate())))
  const { count: endDateOffset, interval: endDateOffsetInterval } = getIntervalBetweenDates(startDate, endDate)
  const debt = toNumber(credit.restCredit, 0) + toNumber(credit.restPerc, 0) + toNumber(credit.restOverdue, 0)

  return withArchived({
    id: productId,
    type: AccountType.loan,
    title: getTitle(credit.name, getTitle(credit.contractNumber, 'Кредит Беларусбанка')),
    instrument: normalizeCurrency(credit.contractCurrencyIso ?? credit.contractCurrency ?? 'BYN'),
    syncIds: uniqueStrings([productId, credit.ibanNum, credit.contractNumber]),
    balance: -debt,
    startDate,
    startBalance: toNumber(credit.contractFirstSum, Math.abs(debt)),
    capitalization: true,
    percent: toOptionalNumber(credit.percRate),
    endDateOffsetInterval,
    endDateOffset,
    payoffInterval: 'month' as const,
    payoffStep: 1,
    _meta: {
      productId,
      transactionCardId: null,
      statementProductId: null,
      productKind: 'credit' as const
    }
  }, getCreditArchivedStatus(credit))
}

const getTransactionSign = (direction: CardTransaction['operationDirection']): number =>
  direction.toLowerCase() === 'credit' ? 1 : -1

const P2P_TRANSFER_TRANSACTION_TYPES = new Set(['781', '785'])

const getCardAccountAmount = (
  transaction: CardTransaction,
  accountCurrency: string,
  transactionCurrency: string
): number => {
  const transactionAmount = Math.abs(toNumber(transaction.amount, 0))
  if (transactionCurrency === accountCurrency || transaction.amountInAccountCurrency == null) return transactionAmount

  // Belarusbank returns this field in minor units (for example, 6789.00 means 67.89 BYN).
  return Math.abs(toNumber(transaction.amountInAccountCurrency, 0)) / 100
}

export const convertCardTransaction = (transaction: CardTransaction, account: ProductAccount): ExtendedTransaction => {
  const sign = getTransactionSign(transaction.operationDirection)
  const accountCurrency = normalizeCurrency(transaction.accountCurrency ?? account.instrument)
  const transactionCurrency = normalizeCurrency(transaction.currency ?? accountCurrency)
  const accountAmount = getCardAccountAmount(transaction, accountCurrency, transactionCurrency) * sign
  const transactionAmount = Math.abs(toNumber(transaction.amount, 0)) * sign
  const merchantTitle = asNonEmptyString(transaction.merchantName) ?? asNonEmptyString(transaction.terminalAddress)
  const mcc = Number(transaction.mcc)
  const date = parseMinskDate(transaction.authorizationDate, 'authorizationDate')
  const rrn = asNonEmptyString(transaction.rrn)
  const groupKeys = P2P_TRANSFER_TRANSACTION_TYPES.has(String(transaction.transactionType))
    ? [`belarusbank:p2p:${date.toISOString()}:${transactionCurrency}:${Math.abs(transactionAmount).toFixed(2)}`]
    : undefined
  const stableId = md5(JSON.stringify({
    accountId: account.id,
    authorizationDate: date.toISOString(),
    accountAmount,
    accountCurrency,
    transactionAmount,
    transactionCurrency,
    rrn,
    fallbackDiscriminator: rrn == null
      ? {
          merchantTitle,
          mcc: Number.isFinite(mcc) ? mcc : null,
          transactionDescription: asNonEmptyString(transaction.transactionDescription)
        }
      : null
  })).toString()

  return {
    hold: null,
    date,
    groupKeys,
    comment: asNonEmptyString(transaction.transactionDescription),
    movements: [{
      id: stableId,
      account: { id: account.id },
      fee: 0,
      invoice: transactionCurrency !== account.instrument
        ? {
            sum: transactionAmount,
            instrument: transactionCurrency
          }
        : null,
      sum: accountAmount
    }],
    merchant: merchantTitle == null
      ? null
      : {
          country: asNonEmptyString(transaction.merchantCountry),
          city: asNonEmptyString(transaction.merchantCity),
          title: merchantTitle,
          mcc: Number.isFinite(mcc) ? mcc : null,
          location: null
        }
  }
}

export const convertPaymentHistoryTransaction = (payment: PaymentHistoryItem, account: ProductAccount): Transaction | null => {
  const currency = normalizeCurrency(payment.currency ?? account.instrument)
  if (currency !== account.instrument) return null
  const amount = Math.abs(toNumber(payment.amount, 0))
  const feeAmount = Math.abs(toNumber(payment.feeAmount, 0))
  const totalAmount = amount + feeAmount
  if (totalAmount < 0.005) return null

  return {
    hold: false,
    // The processing timestamp is the one printed in the official statement.
    // The generic app timestamp may lag it by a second for otherwise identical operations.
    date: parseRequiredDate(payment.timeBpc ?? payment.time, payment.timeBpc == null ? 'time' : 'timeBpc'),
    comment: asNonEmptyString(payment.paymentName),
    movements: [{
      id: md5(`${account.id}:${String(payment.id)}`).toString(),
      account: { id: account.id },
      fee: 0,
      invoice: null,
      sum: -totalAmount
    }],
    merchant: null
  }
}
