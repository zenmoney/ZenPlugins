import { AccountType, Amount, Movement, Transaction } from '../../types/zenmoney'
import { getNumber, getOptArray, getOptNumber, getOptString, getString } from '../../types/get'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
import { ConvertedAccount } from './models'

const CARD_SUBTYPES = new Set(['CARD'])
const CHECKING_SUBTYPES = new Set(['CURRENT', 'SAVINGS'])

export function convertAccounts (apiAccounts: unknown[], cardNumbersByCardId: Map<string, string>): ConvertedAccount[] {
  const result: ConvertedAccount[] = []
  for (const apiAccount of apiAccounts) {
    const converted = convertAccount(apiAccount, cardNumbersByCardId)
    if (converted != null) {
      result.push(converted)
    }
  }
  return result
}

function convertAccount (apiAccount: unknown, cardNumbersByCardId: Map<string, string>): ConvertedAccount | null {
  if (getOptString(apiAccount, 'state') !== 'ACTIVE') {
    return null
  }
  const id = getNumber(apiAccount, 'id')
  const number = getString(apiAccount, 'number')
  const subtype = (getOptString(apiAccount, 'subtype') ?? '').toUpperCase()
  const accountType = subtype === 'CARD' ? AccountType.ccard : AccountType.checking
  const instrument = (getOptString(apiAccount, 'currency') ?? 'RUB').toUpperCase()
  const balance = getOptNumber(apiAccount, 'amount') ?? 0
  const title = buildAccountTitle(apiAccount, subtype, instrument)

  const syncIds = [number]
  if (subtype === 'CARD') {
    const cardNumbers = extractCardNumbers(apiAccount, cardNumbersByCardId)
    for (const masked of cardNumbers) {
      if (!syncIds.includes(masked)) {
        syncIds.push(masked)
      }
    }
  }

  return {
    account: {
      id: String(id),
      type: accountType,
      title,
      instrument,
      syncIds,
      balance
    },
    products: [{ id, subtype: CARD_SUBTYPES.has(subtype) ? 'CARD' : (CHECKING_SUBTYPES.has(subtype) ? 'CURRENT' : 'CURRENT') }]
  }
}

function buildAccountTitle (apiAccount: unknown, subtype: string, instrument: string): string {
  const baseName = getOptString(apiAccount, 'name') ?? 'Цифра банк'
  if (subtype === 'CARD') {
    return `${baseName} (${instrument})`
  }
  return baseName
}

function extractCardNumbers (apiAccount: unknown, cardNumbersByCardId: Map<string, string>): string[] {
  const cardIDsRaw = getOptString(apiAccount, 'cardIDs')
  if (cardIDsRaw == null || cardIDsRaw.length === 0) {
    return []
  }
  return cardIDsRaw.split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0)
    .map(id => cardNumbersByCardId.get(id))
    .filter((s): s is string => typeof s === 'string')
}

export function buildCardNumberMap (apiCards: unknown[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const apiCard of apiCards) {
    const id = getOptNumber(apiCard, 'id') ?? getOptString(apiCard, 'id')
    const number = getOptString(apiCard, 'number')
    if (id != null && number != null) {
      map.set(String(id), number)
    }
  }
  return map
}

export function convertOperation (apiOperation: unknown, accountId: string): Transaction | null {
  const status = getOptString(apiOperation, 'status')
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return null
  }
  const timestamp = getOptNumber(apiOperation, 'timestamp')
  const dateStr = getOptString(apiOperation, 'date')
  const date = timestamp != null
    ? new Date(timestamp)
    : (dateStr != null ? new Date(dateStr.replace(' ', 'T')) : null)
  if (date == null || Number.isNaN(date.getTime())) {
    return null
  }

  const accountAmount = parseAccountAmount(apiOperation)
  if (accountAmount == null) {
    return null
  }
  const opId = getOptNumber(apiOperation, 'id') ?? getOptString(apiOperation, 'id')

  const movement: Movement = {
    id: opId != null ? String(opId) : null,
    account: { id: accountId },
    invoice: null,
    sum: accountAmount.sum,
    fee: 0
  }

  return {
    hold: status != null && status !== 'SUCCESS' && status !== 'COMPLETED',
    date,
    movements: [movement],
    merchant: buildMerchant(apiOperation),
    comment: getOptString(apiOperation, 'note') ?? null
  }
}

function parseAccountAmount (apiOperation: unknown): Amount | null {
  const amount = getOptNumber(apiOperation, 'amount')
  if (amount == null) {
    return null
  }
  const instrument = resolveInstrument(apiOperation)
  if (instrument == null) {
    return null
  }
  // For CARD operations the bank ships expenses as a negative number (e.g. -16000);
  // for /accounts/statement EXPENSE rows also come with a negative sign.
  // We keep the sign as-is so it lines up with Zenmoney's convention.
  return { sum: amount, instrument }
}

function resolveInstrument (apiOperation: unknown): string | null {
  const raw = getOptString(apiOperation, 'currency')
  if (raw == null) {
    return null
  }
  // If currency is a numeric ISO 4217 code (e.g. "810") map to letter code.
  if (/^\d+$/.test(raw)) {
    return codeToCurrencyLookup[raw] ?? null
  }
  return raw.toUpperCase()
}

function buildMerchant (apiOperation: unknown): Transaction['merchant'] {
  const isExpense = getOptString(apiOperation, 'operationType') === 'EXPENSE'
  const counterparty = isExpense ? getOptString(apiOperation, 'recepient') : getOptString(apiOperation, 'payer')
  const trimmedCounterparty = counterparty != null ? counterparty.split(',')[0].trim() : null
  const locationName = getOptString(apiOperation, 'locationName')
  const mccRaw = getOptString(apiOperation, 'mccCode')
  const mcc = mccRaw != null && /^\d+$/.test(mccRaw) ? Number(mccRaw) : null

  const title = (locationName != null && locationName.length > 0 ? locationName : trimmedCounterparty) ?? null
  if (title == null || title.length === 0) {
    return null
  }
  return {
    fullTitle: title,
    mcc,
    location: null
  }
}

// Re-export for tests
export const _internal = { getOptArray }
