import SHA256 from 'crypto-js/sha256'

import { getOptArray, getOptBoolean, getOptNumber, getOptString } from '../../types/get'
import {
  Account,
  AccountOrCard,
  AccountType,
  DepositOrLoan,
  ExtendedTransaction,
  Merchant,
  Movement,
  NonParsedMerchant
} from '../../types/zenmoney'
import { ConvertedAccount } from './types'

interface RawAccountEntity {
  raw: unknown
  source: string
  id: string
  instrument: string
  balance: number
  naturalSyncIds: string[]
  linkedCards: string[]
}

interface RawCreditCardEntity {
  raw: unknown
  id: string
  instrument: string
  naturalSyncIds: string[]
  accountKind: 'card' | 'additional-card' | 'virtual-card'
  isAdditionalCard: boolean
}

const ACCOUNT_COLLECTIONS = [
  'accountList',
  'depositAccounts',
  'timeDepositAccounts',
  'goldAccounts',
  'silverAccounts',
  'platinumAccounts',
  'cumulativeDeposits',
  'directAccountList',
  'superDirectAccountList',
  'directPlusAccountList',
  'groupAccountList',
  'creditAccountList',
  'currencyProtectedTreasuryAccountList',
  'currencyProtectedTcmbAccountList',
  'currencyProtectedYuvamAccountList',
  'winWinAccountList',
  'akbankAGAccountList'
] as const

const TERM_ACCOUNT_COLLECTIONS = new Set([
  'timeDepositAccounts',
  'cumulativeDeposits',
  'currencyProtectedTreasuryAccountList',
  'currencyProtectedTcmbAccountList',
  'currencyProtectedYuvamAccountList'
])

const METAL_INSTRUMENTS: Record<string, string> = {
  goldAccounts: 'XAU',
  silverAccounts: 'XAG',
  platinumAccounts: 'XPT'
}

const GENERIC_COMMENTS = new Set([
  'hesap hareketi',
  'hesap işlemi',
  'işlem',
  'kart işlemi',
  'kredi kartı işlemi'
])

export function convertAccounts (apiAccounts: unknown): ConvertedAccount[] {
  const debitCards = getOptArray(apiAccounts, 'debitCardList') ?? []
  const rawAccounts = collectAccountEntities(apiAccounts, debitCards)
  const rawCreditCards = collectCreditCardEntities(apiAccounts)
  const allNaturalIds = [
    ...rawAccounts.flatMap(item => [...item.naturalSyncIds, ...item.linkedCards]),
    ...rawCreditCards.flatMap(item => item.naturalSyncIds)
  ]
  const counts = countValues(allNaturalIds)

  const convertedDeposits = rawAccounts.map(entity => {
    const naturalSyncIds = unique([...entity.naturalSyncIds, ...entity.linkedCards])
      .filter(value => counts.get(value) === 1)
    const syncIds = naturalSyncIds.length > 0 ? naturalSyncIds : [`akbank:account:${entity.id}`]
    return {
      account: convertDepositAccount(entity, syncIds),
      fetchParams: { type: 'deposit' as const, accountId: entity.id }
    }
  })
  const convertedCreditCards = rawCreditCards.map(entity => {
    const naturalSyncIds = entity.naturalSyncIds.filter(value => counts.get(value) === 1)
    const accountId = creditCardAccountId(entity)
    const syncIds = naturalSyncIds.length > 0 ? naturalSyncIds : [accountId]
    return {
      account: convertCreditCard(entity, syncIds, accountId),
      fetchParams: { type: 'creditCard' as const, cardId: entity.id, isAdditionalCard: entity.isAdditionalCard }
    }
  })
  return [...convertedDeposits, ...convertedCreditCards]
}

export function convertTransaction (operation: unknown, account: Account): ExtendedTransaction {
  const isCard = getOptString(operation, 'Amount') !== undefined || getOptString(operation, 'Description') !== undefined
  const amountText = firstString(operation, isCard ? ['Amount', 'amount'] : ['amount', 'amountOnly'])
  const direction = firstString(operation, ['brAlFlg', 'borcAlacak'])
  const sum = applyDirection(parseAmount(amountText, 'transaction amount'), direction, amountText)
  const operationCurrency = normalizeCurrency(firstString(operation, ['Currency', 'dovizAdi', 'currency'], account.instrument))
  console.assert(operationCurrency === account.instrument, 'Akbank transaction currency differs from account currency without a converted amount', {
    accountId: account.id,
    accountCurrency: account.instrument,
    operationCurrency
  })
  const rawDate = firstString(operation, ['transactionTimeStamp', 'accountActivityTimestamp', 'Date', 'islmTrh'])
  const date = parseBankDate(rawDate)
  const description = normalizeText(firstString(operation, ['Description', 'aciklama'], ''))
  const identifier = normalizeIdentifier(firstString(operation, ['Id', 'id', 'transactionKey', 'recNbr'], '')) ??
    createMovementId(account.id, date, sum, description)
  const movement: Movement = {
    id: identifier,
    account: { id: account.id },
    invoice: null,
    sum,
    fee: 0
  }
  const hold = getOptBoolean(operation, '__akbankHold') ?? false
  const internalTransfer = isInternalTransfer(description)
  if (internalTransfer) {
    return {
      hold,
      date,
      movements: [movement, {
        id: null,
        account: {
          type: null,
          instrument: account.instrument,
          company: null,
          syncIds: extractIdentifiers(description)
        },
        invoice: null,
        sum: -sum,
        fee: 0
      }],
      merchant: null,
      comment: null,
      groupKeys: makeTransferGroupKeys(identifier, date, account.instrument, sum, description)
    }
  }

  const merchant = isCard && sum < 0 ? parseMerchant(description, operation) : null
  return {
    hold,
    date,
    movements: [movement],
    merchant,
    comment: merchant === null ? usefulComment(description) : null
  }
}

function collectAccountEntities (apiAccounts: unknown, debitCards: unknown[]): RawAccountEntity[] {
  const byId = new Map<string, RawAccountEntity>()
  for (const source of ACCOUNT_COLLECTIONS) {
    for (const raw of getOptArray(apiAccounts, source) ?? []) {
      if (getOptBoolean(raw, 'isOpenBankingAccount') === true) continue
      const id = requiredString(raw, ['Id', 'refId'], 'Akbank account identifier is missing', { source })
      const instrument = METAL_INSTRUMENTS[source] ?? normalizeCurrency(requiredString(
        raw,
        ['dovizAdi', 'currencyShortName', 'bakiyeDovizAdi'],
        'Akbank account currency is missing',
        { source, id }
      ))
      const balanceText = requiredString(
        raw,
        ['toplamBakiye', 'currentBalanceAmount', 'bakiye'],
        'Akbank account balance is missing',
        { source, id }
      )
      const entity: RawAccountEntity = {
        raw,
        source,
        id,
        instrument,
        balance: parseAmount(balanceText, 'account balance'),
        naturalSyncIds: naturalAccountIds(raw),
        linkedCards: linkedDebitCards(raw, debitCards)
      }
      const previous = byId.get(id)
      if (previous !== undefined) {
        console.assert(previous.instrument === entity.instrument, 'Akbank returned conflicting duplicate account entities', {
          id,
          previousSource: previous.source,
          source,
          previousInstrument: previous.instrument,
          instrument: entity.instrument
        })
        if (TERM_ACCOUNT_COLLECTIONS.has(source) && !TERM_ACCOUNT_COLLECTIONS.has(previous.source)) byId.set(id, entity)
        else {
          previous.naturalSyncIds = unique([...previous.naturalSyncIds, ...entity.naturalSyncIds])
          previous.linkedCards = unique([...previous.linkedCards, ...entity.linkedCards])
        }
      } else {
        byId.set(id, entity)
      }
    }
  }
  return Array.from(byId.values()).sort((left, right) => left.id.localeCompare(right.id))
}

function collectCreditCardEntities (apiAccounts: unknown): RawCreditCardEntity[] {
  const byId = new Map<string, RawCreditCardEntity>()
  for (const source of [
    { name: 'creditCardList', accountKind: 'card', isAdditionalCard: false },
    { name: 'additionalCardList', accountKind: 'additional-card', isAdditionalCard: true },
    { name: 'virtualCardList', accountKind: 'virtual-card', isAdditionalCard: false }
  ] as const) {
    for (const raw of getOptArray(apiAccounts, source.name) ?? []) {
      if (getOptBoolean(raw, 'isOpenBankingCard') === true) continue
      const id = requiredString(raw, ['Id', 'id', 'refId'], 'Akbank credit-card identifier is missing', { source: source.name })
      const instrument = normalizeCurrency(firstString(raw, ['currencyName', 'currencyNameDesc'], 'TRY'))
      const cardNumber = normalizeCardNumber(firstString(raw, ['cardNo', 'cardNumber', 'digitalCardNo'], ''))
      const key = `${source.accountKind}:${id}`
      const previous = byId.get(key)
      if (previous !== undefined) {
        console.assert(previous.instrument === instrument, 'Akbank returned conflicting duplicate credit-card entities', {
          id,
          source: source.name,
          previousInstrument: previous.instrument,
          instrument
        })
        previous.naturalSyncIds = unique([
          ...previous.naturalSyncIds,
          ...(cardNumber === null ? [] : [cardNumber])
        ])
      } else {
        byId.set(key, {
          raw,
          id,
          instrument,
          naturalSyncIds: cardNumber === null ? [] : [cardNumber],
          accountKind: source.accountKind,
          isAdditionalCard: source.isAdditionalCard
        })
      }
    }
  }
  return Array.from(byId.values()).sort((left, right) => creditCardAccountId(left).localeCompare(creditCardAccountId(right)))
}

function convertDepositAccount (entity: RawAccountEntity, syncIds: string[]): Account {
  const title = normalizeText(firstString(entity.raw, ['hesapAdi', 'hesapTuruAdi', 'Description'], 'Akbank Hesabı')) ?? 'Akbank Hesabı'
  const isTerm = TERM_ACCOUNT_COLLECTIONS.has(entity.source) || getOptBoolean(entity.raw, 'isVadeli') === true
  if (!isTerm) {
    const overdraftText = firstString(entity.raw, ['artiPara', 'overdraftLimitAmount'], '')
    const creditLimit = overdraftText === '' ? 0 : Math.abs(parseAmount(overdraftText, 'overdraft limit'))
    const account: AccountOrCard = {
      id: `akbank:account:${entity.id}`,
      type: entity.linkedCards.length > 0 ? AccountType.ccard : AccountType.checking,
      title,
      instrument: entity.instrument,
      syncIds,
      balance: entity.balance,
      creditLimit,
      ...(creditLimit > 0 ? { available: entity.balance + creditLimit } : {})
    }
    return account
  }

  const startDate = parseBankDate(requiredString(entity.raw, ['vadeBasi'], 'Akbank term-account start date is missing', {
    id: entity.id,
    source: entity.source
  }))
  const endDate = parseBankDate(requiredString(entity.raw, ['vadeSonu'], 'Akbank term-account end date is missing', {
    id: entity.id,
    source: entity.source
  }))
  const endDateOffset = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)))
  const percentText = firstString(entity.raw, ['faizOrani'], '')
  const account: DepositOrLoan = {
    id: `akbank:account:${entity.id}`,
    type: AccountType.deposit,
    title,
    instrument: entity.instrument,
    syncIds,
    balance: entity.balance,
    startDate,
    startBalance: entity.balance,
    capitalization: getOptBoolean(entity.raw, 'isCumulative') ?? false,
    percent: percentText === '' ? null : parseAmount(percentText, 'interest rate'),
    endDateOffsetInterval: 'day',
    endDateOffset,
    payoffInterval: null,
    payoffStep: 0
  }
  return account
}

function convertCreditCard (entity: RawCreditCardEntity, syncIds: string[], accountId: string): AccountOrCard {
  const availableText = firstString(entity.raw, ['availableLimit', 'cardAvailableLimit'], '')
  const limitText = firstString(entity.raw, ['TotalLimit', 'totalLimit'], '')
  const available = availableText === '' ? null : parseAmount(availableText, 'credit-card available limit')
  const creditLimit = limitText === '' ? null : Math.abs(parseAmount(limitText, 'credit-card limit'))
  const remainingDebtText = firstString(entity.raw, ['RemainingExtractDebt', 'remainingDebt', 'ExtractDebt'], '')
  const balance = available !== null && creditLimit !== null
    ? available - creditLimit
    : remainingDebtText === '' ? null : -Math.abs(parseAmount(remainingDebtText, 'credit-card debt'))
  const statementDebtText = firstString(entity.raw, ['ExtractDebt', 'remainingDebt'], '')
  const graceDateText = firstString(entity.raw, ['paymentDueDate'], '')
  return {
    id: accountId,
    type: AccountType.ccard,
    title: normalizeText(firstString(entity.raw, ['newCardTurAciklama', 'cardTurAciklama', 'cardGorselName'], 'Akbank Kredi Kartı')) ?? 'Akbank Kredi Kartı',
    instrument: entity.instrument,
    syncIds,
    balance,
    available,
    creditLimit,
    totalAmountDue: statementDebtText === '' ? null : Math.abs(parseAmount(statementDebtText, 'statement debt')),
    gracePeriodEndDate: graceDateText === '' ? null : parseBankDate(graceDateText)
  }
}

function creditCardAccountId (entity: RawCreditCardEntity): string {
  return `akbank:${entity.accountKind}:${entity.id}`
}

function naturalAccountIds (raw: unknown): string[] {
  const iban = normalizeIdentifier(firstString(raw, ['ibanNumber', 'iban', 'ibanNumberFormatted'], ''))
  const accountNumber = normalizeIdentifier(firstString(raw, ['subeKoduHesapNo'], ''))
  const number = normalizeIdentifier(firstString(raw, ['hesapNo', 'accountNumber'], ''))
  const branch = normalizeIdentifier(firstString(raw, ['subeKodu', 'branchCode'], ''))
  const domestic = accountNumber ?? (number === null ? null : branch === null ? number : `${branch}-${number}`)
  return unique([iban, domestic].filter((value): value is string => value !== null))
}

function linkedDebitCards (account: unknown, debitCards: unknown[]): string[] {
  const accountNumber = normalizeIdentifier(firstString(account, ['hesapNo', 'accountNumber'], ''))
  const branch = normalizeIdentifier(firstString(account, ['subeKodu', 'branchCode'], ''))
  return unique(debitCards.flatMap(card => {
    const cardAccount = normalizeIdentifier(firstString(card, ['kartHesapNo'], ''))
    const cardBranch = normalizeIdentifier(firstString(card, ['kartHesapSube'], ''))
    if (accountNumber === null || cardAccount !== accountNumber || (branch !== null && cardBranch !== null && branch !== cardBranch)) return []
    const number = normalizeCardNumber(firstString(card, ['maskeliKartNo'], ''))
    return number === null ? [] : [number]
  }))
}

function parseMerchant (description: string | null, operation: unknown): Merchant | NonParsedMerchant | null {
  if (description === null || description === '') return null
  const mcc = parseMcc(operation)
  const separateTitle = normalizeText(firstString(operation, ['merchantName', 'merchantTitle'], ''))
  if (separateTitle !== null) {
    const separateCity = normalizeText(firstString(operation, ['merchantCity', 'city'], ''))
    const separateCountry = normalizeText(firstString(operation, ['merchantCountry', 'country'], ''))
    return {
      title: separateTitle,
      city: separateCity,
      country: separateCountry,
      mcc,
      location: null
    }
  }
  const doubleSlash = description.split('//').map(normalizeText).filter((value): value is string => value !== null && value !== '')
  if (doubleSlash.length === 2) {
    const place = parsePlace(doubleSlash[1])
    if (place !== null) return merchant(doubleSlash[0], place.city, place.country, mcc)
  }
  const slashParts = description.split('/').map(normalizeText).filter((value): value is string => value !== null && value !== '')
  if (slashParts.length >= 3 && /^[A-Z]{2,3}$/i.test(slashParts[slashParts.length - 1])) {
    return merchant(slashParts.slice(0, -2).join(' / '), slashParts[slashParts.length - 2], slashParts[slashParts.length - 1], mcc)
  }
  const spaced = description.match(/^(.+?)\s{2,}(.+?)\s{2,}([A-Z]{2,3})$/i)
  if (spaced !== null) return merchant(spaced[1], spaced[2], spaced[3], mcc)
  return { fullTitle: description, mcc, location: null }
}

function parsePlace (value: string): { city: string, country: string } | null {
  const match = value.match(/^(.+?)[/\s]+([A-Z]{2,3})$/i)
  if (match === null) return null
  return { city: normalizeText(match[1]) ?? match[1], country: match[2].toUpperCase() }
}

function merchant (title: string, city: string, country: string, mcc: number | null): Merchant {
  return {
    title: normalizeText(title) ?? title,
    city: normalizeText(city),
    country: country.toUpperCase(),
    mcc,
    location: null
  }
}

function applyDirection (amount: number, direction: string, rawAmount: string): number {
  const normalized = direction.trim().toLocaleUpperCase('tr-TR')
  const explicitNegative = /^\s*-/.test(rawAmount) || amount < 0
  if (['B', 'BORÇ', 'BORC', 'D', 'DEBIT'].includes(normalized)) {
    console.assert(!(!explicitNegative && /^\s*\+/.test(rawAmount)), 'Akbank transaction sign conflicts with its debit direction', { direction })
    return -Math.abs(amount)
  }
  if (['A', 'ALACAK', 'C', 'CREDIT'].includes(normalized)) {
    console.assert(!explicitNegative, 'Akbank transaction sign conflicts with its credit direction', { direction })
    return Math.abs(amount)
  }
  console.assert(explicitNegative || /^\s*\+/.test(rawAmount), 'Akbank transaction direction is unknown and amount has no explicit sign', {
    direction: normalized
  })
  return amount
}

function parseAmount (value: string, context: string): number {
  const cleaned = value.replace(/[^0-9,.-]/g, '')
  console.assert(cleaned !== '' && /\d/.test(cleaned), `Akbank ${context} is invalid`, { value })
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  let normalized = cleaned
  if (lastComma > lastDot) normalized = cleaned.replace(/\./g, '').replace(',', '.')
  else if (lastDot > lastComma && lastComma >= 0) normalized = cleaned.replace(/,/g, '')
  else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(cleaned)) normalized = cleaned.replace(/\./g, '')
  else if (lastComma >= 0) normalized = cleaned.replace(',', '.')
  const amount = Number(normalized)
  console.assert(Number.isFinite(amount), `Akbank ${context} is invalid`, { value })
  return amount
}

function parseMcc (operation: unknown): number | null {
  const numeric = getOptNumber(operation, 'mcc') ?? getOptNumber(operation, 'MCC')
  const text = firstString(operation, ['mcc', 'MCC', 'merchantCategoryCode'], '')
  const mcc = numeric ?? (text === '' ? null : Number(text))
  console.assert(mcc === null || (Number.isInteger(mcc) && mcc >= 0 && mcc <= 9999), 'Akbank merchant category code is invalid', {
    mcc: text
  })
  return mcc
}

function parseBankDate (value: string): Date {
  const epoch = /^\d{13}$/.test(value) ? Number(value) : NaN
  if (Number.isFinite(epoch)) return new Date(epoch)
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}+03:00`
    const date = new Date(withZone)
    console.assert(!Number.isNaN(date.getTime()), 'Akbank transaction date is invalid', { value })
    return date
  }
  const match = value.match(/^(\d{2})[./-](\d{2})[./-](\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  console.assert(match !== null, 'Akbank transaction date has an unsupported format', { value })
  const groups = match as RegExpMatchArray
  return new Date(Date.UTC(
    Number(groups[3]),
    Number(groups[2]) - 1,
    Number(groups[1]),
    Number(groups[4] ?? 0) - 3,
    Number(groups[5] ?? 0),
    Number(groups[6] ?? 0)
  ))
}

function normalizeCurrency (value: string): string {
  const normalized = value.replace(/[^A-Za-z]/g, '').toUpperCase()
  const mapped: Record<string, string> = {
    TL: 'TRY',
    YTL: 'TRY',
    TRY: 'TRY',
    TRKLIRASI: 'TRY',
    ALTIN: 'XAU',
    GRAMALTIN: 'XAU'
  }
  const currency = mapped[normalized] ?? normalized
  console.assert(/^[A-Z]{3,8}$/.test(currency), 'Akbank currency is invalid', { value })
  return currency
}

function normalizeCardNumber (value: string): string | null {
  const cleaned = value.replace(/[\s-]/g, '')
  if (cleaned === '') return null
  if (/^\d{12,19}$/.test(cleaned)) return `${cleaned.slice(0, 6)}${'*'.repeat(cleaned.length - 10)}${cleaned.slice(-4)}`
  console.assert(/^[0-9*Xx]{8,24}$/.test(cleaned), 'Akbank masked card number has an invalid format')
  return cleaned.replace(/[Xx]/g, '*')
}

function normalizeIdentifier (value: string): string | null {
  const normalized = value.replace(/\s+/g, '').trim()
  return normalized === '' ? null : normalized
}

function normalizeText (value?: string | null): string | null {
  if (value === undefined || value === null) return null
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized === '' ? null : normalized
}

function usefulComment (description: string | null): string | null {
  if (description === null || GENERIC_COMMENTS.has(description.toLocaleLowerCase('tr-TR'))) return null
  return description
}

function isInternalTransfer (description: string | null): boolean {
  if (description === null) return false
  return /\b(virman|hesaplar(?:ı|i)m arası|kendi hesab(?:ı|i)m)\b/iu.test(description)
}

function extractIdentifiers (description: string | null): string[] | null {
  if (description === null) return null
  const values = description.match(/TR(?:\s*\d){24}/gi)?.map(value => value.replace(/\s+/g, '').toUpperCase()) ?? []
  return values.length === 0 ? null : unique(values)
}

function makeTransferGroupKeys (
  identifier: string,
  date: Date,
  instrument: string,
  sum: number,
  description: string | null
): Array<string | null> {
  const ibans = extractIdentifiers(description)
  const day = date.toISOString().slice(0, 10)
  return [
    `akbank:reference:${identifier}`,
    ibans === null ? null : `akbank:iban:${ibans.sort().join(':')}:${Math.abs(sum).toFixed(8)}`,
    `akbank:inner:${day}:${instrument}:${Math.abs(sum).toFixed(8)}`
  ]
}

function createMovementId (accountId: string, date: Date, sum: number, description: string | null): string {
  return `generated:${SHA256(JSON.stringify([
    accountId,
    date.toISOString(),
    sum,
    description
  ])).toString().slice(0, 24)}`
}

function requiredString (
  value: unknown,
  paths: string[],
  message: string,
  context: Record<string, unknown>
): string {
  const result = firstString(value, paths, '')
  console.assert(result.trim() !== '', message, { ...context, expectedFields: paths })
  return result
}

function firstString (value: unknown, paths: string[], fallback?: string): string {
  for (const path of paths) {
    const found = getOptString(value, path)
    if (found !== undefined && found.trim() !== '') return found
    const number = getOptNumber(value, path)
    if (number !== undefined) return String(number)
  }
  if (fallback !== undefined) return fallback
  console.assert(false, 'Akbank response is missing a required string field', { expectedFields: paths })
  return ''
}

function countValues (values: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

function unique<T> (values: T[]): T[] {
  return Array.from(new Set(values))
}
