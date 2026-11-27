import { AccountType } from '../../types/zenmoney'
import type { AccountOrCard, Merchant, Transaction } from '../../types/zenmoney'
import { parseLedgerDate } from './ledgerDate'

/** Papara ledger entry types observed in real data. */
export const EntryType = {
  PaparaCard: 2,
  MoneyTransfer: 7,
  Cashback: 15,
  CardFee: 29,
  FastMoneyTransfer: 36
} as const

function asRecord (value: unknown, context: string): Record<string, unknown> {
  console.assert(typeof value === 'object' && value !== null && !Array.isArray(value), `Unexpected Papara ${context}`)
  return value as Record<string, unknown>
}

function finiteNumber (value: unknown, context: string): number {
  console.assert(typeof value === 'number' && Number.isFinite(value), `Invalid Papara ${context}`, { type: typeof value })
  return value as number
}

function nonBlank (value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.replace(/\s+/g, ' ').trim()
  return text === '' ? null : text
}

interface CurrencyInfo {
  code: string
  isUnsupportedAsset: boolean
}

function readCurrencyInfo (value: unknown, context: string): CurrencyInfo {
  const info = asRecord(value, `${context} currencyInfo`)
  const code = nonBlank(info.code)
  console.assert(code !== null && /^[A-Z]{3}$/.test(code), `Invalid Papara ${context} currency code`, { code: info.code })
  return { code: code as string, isUnsupportedAsset: info.isCryptocurrency === true || info.isMetalCurrency === true }
}

/**
 * Converts the `balance` response. Every regular currency balance becomes a checking account.
 * Not supported in this version: savings balances (`savingBalancesSum`), precious metals and cryptocurrencies.
 */
export function convertAccounts (balanceData: unknown): AccountOrCard[] {
  const data = asRecord(balanceData, 'balance data')
  console.assert(Array.isArray(data.balances), 'Papara balance response has no balances array')
  const accounts: AccountOrCard[] = []
  for (const raw of data.balances as unknown[]) {
    const balance = asRecord(raw, 'balance item')
    const currency = readCurrencyInfo(balance.currencyInfo, 'balance')
    if (currency.isUnsupportedAsset) {
      console.log('Skipping unsupported Papara metal/crypto balance', { currency: currency.code })
      continue
    }
    const iban = nonBlank(balance.iban)
    console.assert(iban !== null && /^TR\d{24}$/.test(iban), 'Invalid Papara balance IBAN', { currency: currency.code, length: typeof balance.iban === 'string' ? balance.iban.length : null })
    const total = finiteNumber(balance.totalBalance, 'totalBalance')
    const locked = finiteNumber(balance.lockedBalance, 'lockedBalance')
    const available = finiteNumber(balance.availableBalance, 'availableBalance')
    // Own funds net of reservations; verify the assumed relation instead of guessing when it does not hold.
    console.assert(Math.abs(total - locked - available) < 0.005, 'Unexpected Papara balance relation', { currency: currency.code, total, locked, available })
    console.assert(!accounts.some(account => account.instrument === currency.code || account.id === iban), 'Duplicate Papara balance', { currency: currency.code })
    accounts.push({
      id: iban as string,
      type: AccountType.checking,
      title: `Papara ${currency.code}`,
      instrument: currency.code,
      syncIds: [iban as string],
      savings: false,
      balance: available
    })
  }
  const savings = typeof data.savingBalancesSum === 'object' && data.savingBalancesSum !== null
    ? (data.savingBalancesSum as Record<string, unknown>).balances
    : undefined
  if (Array.isArray(savings) && savings.length > 0) {
    console.log('Papara savings balances are not supported yet', { count: savings.length })
  }
  return accounts
}

// The Zenmoney JS engine rejects Unicode property escapes (\p{L}), so letters are detected by case mapping.
// Terminal texts are upper-case ASCII (MIGROS, NETFLIX.COM) while brands use Turkish letters, so fold both to ASCII.
const TURKISH_FOLD: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }

function lettersAndDigits (value: string): string {
  let result = ''
  for (const char of value.replace(/İ/g, 'i').toLowerCase()) {
    const folded = TURKISH_FOLD[char] ?? char
    if (/[0-9]/.test(folded) || folded.toUpperCase() !== folded) result += folded
  }
  return result
}

function textContains (haystack: string, needle: string): boolean {
  const normalizedNeedle = lettersAndDigits(needle)
  return normalizedNeedle !== '' && lettersAndDigits(haystack).includes(normalizedNeedle)
}

function convertCardPayment (item: Record<string, unknown>): { merchant: Merchant | null, comment: string | null } {
  const title = nonBlank(item.descriptionTitle)
  const description = nonBlank(item.description)
  const mcc = typeof item.mcCode === 'number' && Number.isInteger(item.mcCode) ? item.mcCode : null
  if (item.externalCardAcceptorId !== null && item.externalCardAcceptorId !== undefined) {
    // Known acceptor: descriptionTitle is the brand, description is the raw terminal text.
    if (title === null) return { merchant: null, comment: description }
    return {
      merchant: { title, city: null, country: null, mcc, location: null },
      comment: description !== null && !textContains(description, title) ? description : null
    }
  }
  // Unknown acceptor: descriptionTitle is Papara's category, description is the terminal's merchant name.
  if (description === null) return { merchant: null, comment: title }
  return {
    merchant: { title: description, city: null, country: null, mcc, location: null, ...title !== null && { category: title } },
    comment: null
  }
}

/**
 * Converts one ledger record. Returns null only for records of unsupported metal/crypto balances.
 */
export function convertTransaction (rawItem: unknown, accounts: AccountOrCard[]): Transaction | null {
  const item = asRecord(rawItem, 'ledger item')
  console.assert(typeof item.id === 'number' && Number.isSafeInteger(item.id), 'Invalid Papara ledger id', { type: typeof item.id })
  const id = String(item.id)
  const currency = readCurrencyInfo(item.currencyInfo, 'ledger')
  const account = accounts.find(candidate => candidate.instrument === currency.code)
  if (account === undefined) {
    console.assert(currency.isUnsupportedAsset, 'Papara ledger currency has no account', { id, currency: currency.code })
    console.log('Skipping ledger record of unsupported metal/crypto balance', { id, currency: currency.code })
    return null
  }
  const amount = finiteNumber(item.amount, 'ledger amount')
  console.assert(amount !== 0, 'Zero Papara ledger amount', { id })
  const fee = typeof item.fee === 'number' ? item.fee : 0
  const surcharge = typeof item.surcharge === 'number' ? item.surcharge : 0
  if (fee !== 0 || surcharge !== 0) {
    // Fee semantics are unobserved: keep the booked amount and do not guess a split.
    console.warn('Papara ledger record has an unconfirmed fee', { id, entryType: item.entryType, fee, surcharge })
  }
  const date = parseLedgerDate(item.createdAt)
  const local = { id, account: { id: account.id }, invoice: null, sum: amount, fee: 0 }
  // Ledger records change resultingBalance, but Papara gives no explicit pending/settled status.
  const hold = null

  if (item.entryType === EntryType.MoneyTransfer && amount < 0) {
    // Outgoing transfer to a person: descriptionTitle is the recipient's name, description the optional
    // message (empty in the observed record). Incoming records are unobserved and use the fallback below.
    const recipient = nonBlank(item.descriptionTitle)
    return {
      hold,
      date,
      movements: [
        local,
        { id: null, account: { type: null, instrument: account.instrument, company: null, syncIds: null }, invoice: null, sum: -amount, fee: 0 }
      ],
      merchant: recipient !== null ? { title: recipient, city: null, country: null, mcc: null, location: null } : null,
      comment: nonBlank(item.description)
    }
  }

  switch (item.entryType) {
    case EntryType.PaparaCard: {
      const { merchant, comment } = convertCardPayment(item)
      return { hold, date, movements: [local], merchant, comment }
    }
    case EntryType.Cashback:
      console.assert(amount > 0, 'Unexpected negative Papara cashback', { id })
      return { hold, date, movements: [local], merchant: null, comment: nonBlank(item.description) ?? nonBlank(item.descriptionTitle) }
    case EntryType.CardFee: {
      // Papara's own card fee: descriptionTitle names the card product ("Sticker Card"), description the fee.
      console.assert(amount < 0, 'Unexpected positive Papara card fee', { id })
      const parts = [nonBlank(item.descriptionTitle), nonBlank(item.description)].filter((part): part is string => part !== null)
      return { hold, date, movements: [local], merchant: null, comment: parts.length > 0 ? [...new Set(parts)].join(', ') : null }
    }
    case EntryType.FastMoneyTransfer: {
      // FAST transfer with another bank. Observed records: incoming ones name only the sender's bank
      // (description null); outgoing ones put the counterpart IBAN into description. In outgoing
      // "FAST Withdrawal" descriptionTitle is the bank, in outgoing "FAST Money Transfer" it is the recipient.
      const description = nonBlank(item.description)
      const compact = description?.replace(/\s+/g, '') ?? null
      const counterpartIban = compact !== null && /^TR\d{24}$/.test(compact) ? compact : null
      const message = counterpartIban === null ? description : null
      const title = nonBlank(item.descriptionTitle)
      const recipient = amount < 0 && item.entryTypeTitle === 'FAST Money Transfer' ? title : null
      const commentParts = [recipient === null ? title : null, message].filter((part): part is string => part !== null)
      return {
        hold,
        date,
        movements: [
          local,
          { id: null, account: { type: null, instrument: account.instrument, company: null, syncIds: counterpartIban !== null ? [counterpartIban] : null }, invoice: null, sum: -amount, fee: 0 }
        ],
        merchant: recipient !== null ? { title: recipient, city: null, country: null, mcc: null, location: null } : null,
        // Without a named recipient the bank name is the only counterparty detail; unobserved free text is kept too.
        comment: commentParts.length > 0 ? commentParts.join(', ') : null
      }
    }
    default:
      console.warn('Unsupported Papara ledger entry type kept as income/expense', { id, entryType: item.entryType, entryTypeTitle: item.entryTypeTitle })
      return {
        hold,
        date,
        movements: [local],
        merchant: null,
        comment: nonBlank(item.description) ?? nonBlank(item.descriptionTitle) ?? nonBlank(item.entryTypeTitle)
      }
  }
}
