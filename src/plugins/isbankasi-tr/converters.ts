import crypto from 'crypto'

import get, { getOptBoolean, getOptNumber, getOptString, getString } from '../../types/get'
import {
  Account,
  AccountOrCard,
  AccountType,
  DepositOrLoan,
  ExtendedTransaction,
  Movement
} from '../../types/zenmoney'
import { ConvertedAccount } from './types'

interface ParsedAccount {
  raw: unknown
  index: string
  accountType: number
  instrument: string
  balance: number
  available?: number
  naturalSyncIds: string[]
}

const GENERIC_COMMENTS = new Set([
  'hesap hareketi',
  'hesap işlemi',
  'işlem',
  'operation',
  'account transaction'
])

export function convertAccounts (apiAccounts: unknown[]): ConvertedAccount[] {
  const parsedByIndex = new Map<string, ParsedAccount>()
  for (const raw of apiAccounts) {
    const parsed = parseAccount(raw)
    const previous = parsedByIndex.get(parsed.index)
    if (previous !== undefined) {
      console.assert(previous.instrument === parsed.instrument && previous.accountType === parsed.accountType,
        'İşCep returned conflicting account entities with the same index', {
          index: parsed.index,
          previousInstrument: previous.instrument,
          instrument: parsed.instrument,
          previousAccountType: previous.accountType,
          accountType: parsed.accountType
        })
      continue
    }
    parsedByIndex.set(parsed.index, parsed)
  }

  const parsedAccounts = Array.from(parsedByIndex.values())
  const syncIdCounts = countValues(parsedAccounts.flatMap(account => account.naturalSyncIds))
  return parsedAccounts.map(parsed => {
    const uniqueNaturalIds = parsed.naturalSyncIds.filter(value => syncIdCounts.get(value) === 1)
    const syncIds = uniqueNaturalIds.length > 0 ? uniqueNaturalIds : [`isbank:index:${parsed.index}`]
    const account = convertAccount(parsed, syncIds)
    return {
      account,
      fetchParams: {
        accountIndex: parsed.index,
        accountType: parsed.accountType
      }
    }
  })
}

export function convertTransaction (operation: unknown, account: Account): ExtendedTransaction {
  const sum = parseAmount(getString(operation, 'Amount'))
  const operationCurrency = normalizeCurrency(getOptString(operation, 'CurrencyCode') ?? account.instrument)
  console.assert(operationCurrency === account.instrument, 'İşCep account activity currency differs from account currency without a converted amount', {
    accountId: account.id,
    accountCurrency: account.instrument,
    operationCurrency
  })
  const date = parseBankDate(getString(operation, 'Timestamp'))
  const description = normalizeText(getOptString(operation, 'Description'))
  const operationGroup = normalizeText(getOptString(operation, 'OperationGroup'))
  const receipt = normalizeIdentifier(getOptString(operation, 'ReceiptValue'))
  const movementId = receipt ?? createMovementId(operation, account.id, date, sum, description)
  const mainMovement: Movement = {
    id: movementId,
    account: { id: account.id },
    invoice: null,
    sum,
    fee: 0
  }

  if (!isTransfer(description, operationGroup)) {
    return {
      hold: false,
      date,
      movements: [mainMovement],
      merchant: null,
      comment: usefulComment(description)
    }
  }

  const otherAccount = normalizeIdentifier(getOptString(operation, 'OtherAccount'))
  const externalMovement: Movement = {
    id: null,
    account: {
      type: null,
      instrument: account.instrument,
      company: null,
      syncIds: otherAccount === null ? null : [otherAccount]
    },
    invoice: null,
    sum: -sum,
    fee: 0
  }
  const innerTransfer = isInnerTransfer(description, operationGroup)
  return {
    hold: false,
    date,
    movements: [mainMovement, externalMovement],
    merchant: null,
    comment: innerTransfer ? null : usefulComment(description),
    ...(innerTransfer ? { groupKeys: makeInnerTransferGroupKeys(account, otherAccount, receipt, date, sum) } : {})
  }
}

function parseAccount (raw: unknown): ParsedAccount {
  const index = getStringFromAlternatives(raw, ['Index', 'index'])
  const accountType = getNumberFromAlternatives(raw, ['AccountTypeEnum', 'accountTypeEnum'])
  const balanceModel = get(raw, 'Balance') ?? get(raw, 'balance') ?? get(raw, 'netBalance')
  console.assert(balanceModel !== undefined && balanceModel !== null, 'İşCep account balance is missing', {
    index,
    accountType
  })
  const balance = parseAmount(getStringFromAlternatives(balanceModel, ['Amount', 'amount']))
  const instrument = normalizeCurrency(getStringFromAlternatives(balanceModel, ['IsoCode', 'isoCode']))
  const availableModel = get(raw, 'availableAmount')
  const availableText = getOptStringFromAlternatives(availableModel, ['Amount', 'amount'])
  const iban = normalizeIdentifier(getOptStringFromAlternatives(raw, ['Iban', 'iban']))
  const accountNumber = normalizeIdentifier(getOptStringFromAlternatives(raw, ['AccountNumber', 'accountNumber', 'number']))
  const branchCode = getOptNumber(raw, 'AccountBranch.Code') ?? getOptNumber(raw, 'AccountBranch.code') ??
    getOptNumber(raw, 'accountBranch.Code') ?? getOptNumber(raw, 'accountBranch.code')
  const domesticNumber = accountNumber === null
    ? null
    : branchCode === undefined ? accountNumber : `${branchCode}-${accountNumber}`

  return {
    raw,
    index,
    accountType,
    instrument,
    balance,
    ...(availableText !== undefined ? { available: parseAmount(availableText) } : {}),
    naturalSyncIds: unique([iban, domesticNumber].filter((value): value is string => value !== null))
  }
}

function convertAccount (parsed: ParsedAccount, syncIds: string[]): Account {
  const title = getOptStringFromAlternatives(parsed.raw, ['Alias', 'alias', 'AccountName', 'accountName', 'name']) ??
    getOptStringFromAlternatives(parsed.raw, ['ProductCodeText', 'productCodeText', 'AccountType', 'accountType']) ??
    `İş Bankası ${parsed.instrument}`
  const normalizedTitle = normalizeText(title) ?? `İş Bankası ${parsed.instrument}`
  const common = {
    id: `isbank:${parsed.index}`,
    title: normalizedTitle,
    instrument: parsed.instrument,
    syncIds
  }

  if (parsed.accountType === 3 || parsed.accountType === 4) {
    return convertDeposit(parsed, common)
  }
  console.assert([1, 2, 5, 6, 7].includes(parsed.accountType), 'Unsupported İşCep account type', {
    index: parsed.index,
    accountType: parsed.accountType,
    accountTypeName: getOptStringFromAlternatives(parsed.raw, ['AccountType', 'accountType'])
  })
  const account: AccountOrCard = {
    ...common,
    type: parsed.accountType === 7 ? AccountType.investment : AccountType.checking,
    balance: parsed.balance,
    creditLimit: 0,
    ...(parsed.available !== undefined ? { available: parsed.available } : {})
  }
  return account
}

function convertDeposit (
  parsed: ParsedAccount,
  common: Pick<DepositOrLoan, 'id' | 'title' | 'instrument' | 'syncIds'>
): DepositOrLoan {
  const startText = getOptStringFromAlternatives(parsed.raw, [
    'TermStartDate', 'termStartDate', 'MainTermStartDate', 'mainTermStartDate', 'OpeningDate', 'openingDate'
  ])
  console.assert(startText !== undefined, 'İşCep deposit start date is missing', { index: parsed.index })
  const startDate = parseBankDate(startText as string)
  const endText = getOptStringFromAlternatives(parsed.raw, [
    'TermEndDate', 'termEndDate', 'MainTermEndDate', 'mainTermEndDate'
  ])
  const durationText = getOptStringFromAlternatives(parsed.raw, ['MaturityDuration', 'maturityDuration', 'PeriodDuration', 'periodDuration'])
  const durationDays = durationText === undefined ? undefined : parsePositiveInteger(durationText)
  console.assert(endText !== undefined || durationDays !== undefined, 'İşCep deposit maturity is missing', {
    index: parsed.index
  })
  const endDate = endText !== undefined
    ? parseBankDate(endText)
    : new Date(startDate.getTime() + (durationDays as number) * 24 * 60 * 60 * 1000)
  const offsetDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)))
  const interestText = getOptStringFromAlternatives(parsed.raw, ['InterestRate', 'interestRate'])
  const inPeriodBalance = get(parsed.raw, 'InPeriodBalance') ?? get(parsed.raw, 'inPeriodBalance')
  console.assert(inPeriodBalance !== undefined && inPeriodBalance !== null, 'İşCep deposit principal is missing', {
    index: parsed.index
  })
  const startBalance = Math.abs(parseAmount(getStringFromAlternatives(inPeriodBalance, ['Amount', 'amount'])))
  console.assert(startBalance > 0, 'İşCep deposit principal must be positive', { index: parsed.index })
  const capitalization = getOptBooleanFromAlternatives(parsed.raw, [
    'Capitalization', 'capitalization', 'HasCapitalization', 'hasCapitalization'
  ]) ?? false

  return {
    ...common,
    type: AccountType.deposit,
    balance: parsed.balance,
    startDate,
    startBalance,
    capitalization,
    percent: interestText === undefined ? null : parseAmount(interestText),
    endDateOffsetInterval: 'day',
    endDateOffset: offsetDays,
    payoffInterval: null,
    payoffStep: 0
  }
}

function parseAmount (value: string): number {
  let normalized = value.replace(/\s|\u00a0/g, '')
  console.assert(/^[+-]?\d[\d,.]*$/.test(normalized), 'İşCep returned an invalid amount', { value })
  const comma = normalized.lastIndexOf(',')
  const dot = normalized.lastIndexOf('.')
  if (comma >= 0 && dot >= 0) {
    const decimalSeparator = comma > dot ? ',' : '.'
    const groupingSeparator = decimalSeparator === ',' ? /\./g : /,/g
    normalized = normalized.replace(groupingSeparator, '').replace(decimalSeparator, '.')
  } else if (comma >= 0) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if ((normalized.match(/\./g) ?? []).length > 1) {
    const lastDot = normalized.lastIndexOf('.')
    normalized = normalized.slice(0, lastDot).replace(/\./g, '') + normalized.slice(lastDot)
  }
  console.assert(/^[+-]?\d+(?:\.\d+)?$/.test(normalized), 'İşCep returned an invalid normalized amount', { value })
  const result = Number(normalized)
  console.assert(Number.isFinite(result), 'İşCep returned an invalid amount', { value })
  return result
}

function parseBankDate (value: string): Date {
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T|\s)?(?:(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(value)
  if (iso !== null) {
    if (iso[8] !== undefined) {
      const parsed = new Date(value)
      console.assert(!Number.isNaN(parsed.getTime()), 'İşCep returned an invalid ISO date', { value })
      return parsed
    }
    return createIstanbulDate(iso)
  }
  const local = /^(\d{2})[./-](\d{2})[./-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value)
  console.assert(local !== null, 'İşCep returned an unsupported date format', { value })
  return new Date(Date.UTC(
    Number((local as RegExpExecArray)[3]),
    Number((local as RegExpExecArray)[2]) - 1,
    Number((local as RegExpExecArray)[1]),
    Number((local as RegExpExecArray)[4] ?? 0) - 3,
    Number((local as RegExpExecArray)[5] ?? 0),
    Number((local as RegExpExecArray)[6] ?? 0)
  ))
}

function createIstanbulDate (parts: RegExpExecArray): Date {
  return new Date(Date.UTC(
    Number(parts[1]),
    Number(parts[2]) - 1,
    Number(parts[3]),
    Number(parts[4] ?? 0) - 3,
    Number(parts[5] ?? 0),
    Number(parts[6] ?? 0),
    Number((parts[7] ?? '0').padEnd(3, '0'))
  ))
}

function normalizeCurrency (value: string): string {
  const normalized = value.trim().toUpperCase()
  const aliases: Record<string, string> = {
    TL: 'TRY',
    YTL: 'TRY',
    TRL: 'TRY',
    GR: 'XAU',
    GOLD: 'XAU',
    ALTIN: 'XAU'
  }
  return aliases[normalized] ?? normalized
}

function normalizeText (value?: string): string | null {
  if (value === undefined) return null
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized === '' ? null : normalized
}

function normalizeIdentifier (value?: string): string | null {
  const normalized = normalizeText(value)
  return normalized === null ? null : normalized.replace(/\s+/g, '')
}

function usefulComment (description: string | null): string | null {
  if (description === null) return null
  return GENERIC_COMMENTS.has(description.toLocaleLowerCase('tr-TR')) ? null : description
}

function isTransfer (description: string | null, operationGroup: string | null): boolean {
  const source = `${description ?? ''} ${operationGroup ?? ''}`.toLocaleLowerCase('tr-TR')
  return ['virman', 'havale', 'transfer', 'para gönder', 'eft', 'fast'].some(marker =>
    source === marker || source.startsWith(`${marker} `) || source.endsWith(` ${marker}`) || source.includes(` ${marker} `))
}

function isInnerTransfer (description: string | null, operationGroup: string | null): boolean {
  const source = `${description ?? ''} ${operationGroup ?? ''}`.toLocaleLowerCase('tr-TR')
  return source.includes('virman') || source.includes('hesaplarım arasında') || source.includes('kendi hesab')
}

function makeInnerTransferGroupKeys (
  account: Account,
  otherAccount: string | null,
  receipt: string | null,
  date: Date,
  sum: number
): string[] {
  const base = `isbank:inner:${formatDateKey(date)}:${account.instrument}:${Math.abs(sum).toFixed(8)}`
  const keys = receipt === null ? [] : [`isbank:receipt:${receipt}`]
  if (otherAccount === null) return unique([...keys, base])
  for (const ownId of account.syncIds) {
    const normalizedOwnId = normalizeIdentifier(ownId)
    if (normalizedOwnId === null || normalizedOwnId === otherAccount) continue
    keys.push(`${base}:${[normalizedOwnId, otherAccount].sort().join(':')}`)
  }
  return unique(keys.length > 0 ? keys : [base])
}

function createMovementId (
  operation: unknown,
  accountId: string,
  date: Date,
  sum: number,
  description: string | null
): string {
  const fingerprint = [
    accountId,
    date.toISOString(),
    getOptNumber(operation, 'TimestampMicro') ?? '',
    sum.toString(),
    description ?? '',
    getOptString(operation, 'Balance') ?? '',
    getOptString(operation, 'ChannelCode') ?? '',
    getOptString(operation, 'OtherAccount') ?? ''
  ].join('|')
  return `isbank:${crypto.createHash('sha256').update(fingerprint).digest('hex')}`
}

function getStringFromAlternatives (value: unknown, paths: string[]): string {
  const result = getOptStringFromAlternatives(value, paths)
  console.assert(result !== undefined, 'İşCep required string field is missing', { paths })
  return result as string
}

function getOptStringFromAlternatives (value: unknown, paths: string[]): string | undefined {
  for (const path of paths) {
    const result = getOptString(value, path)
    if (result !== undefined) return result
  }
  return undefined
}

function getNumberFromAlternatives (value: unknown, paths: string[]): number {
  for (const path of paths) {
    const result = getOptNumber(value, path)
    if (result !== undefined) return result
  }
  console.assert(false, 'İşCep required number field is missing', { paths })
  return 0
}

function getOptBooleanFromAlternatives (value: unknown, paths: string[]): boolean | undefined {
  for (const path of paths) {
    const result = getOptBoolean(value, path)
    if (result !== undefined) return result
  }
  return undefined
}

function parsePositiveInteger (value: string): number | undefined {
  const match = /\d+/.exec(value)
  if (match === null) return undefined
  const result = Number(match[0])
  return Number.isSafeInteger(result) && result > 0 ? result : undefined
}

function countValues (values: string[]): Map<string, number> {
  const result = new Map<string, number>()
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1)
  return result
}

function unique (values: string[]): string[] {
  return Array.from(new Set(values))
}

function formatDateKey (date: Date): string {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
