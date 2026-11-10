import moment from 'moment'
import { AccountOrCard, AccountType, ExtendedTransaction, Merchant, Movement } from '../../types/zenmoney'
import { getOptNumber, getOptString } from '../../types/get'
import { AccountPlan } from './models'

export function convertAccounts (products: unknown[]): AccountPlan[] {
  const plans: AccountPlan[] = []
  const identities = new Set<string>()
  const numberCounts = new Map<string, number>()
  for (const product of products) {
    const number = getOptString(product, 'number')
    if (number != null) numberCounts.set(number, (numberCounts.get(number) ?? 0) + 1)
  }
  for (const product of products) {
    const type = getOptString(product, 'type')
    const currency = getOptString(product, 'currency')
    const isAccount = type === 'ACCOUNT'
    if (!((type === 'VISA' && (currency === 'KGS' || currency === 'USD')) || (type === 'ELCART' && currency === 'KGS') || isAccount)) continue
    assert(currency != null && /^[A-Z]{3}$/.test(currency), 'Bank account currency is missing')
    const id = getOptNumber(product, 'id')
    const cardId = getOptNumber(product, 'product_id')
    const number = getOptString(product, 'number')
    const pan = getOptString(product, 'card_num')
    const name = getOptString(product, 'name')
    const balance = getOptNumber(product, 'balance')
    assert(id != null && Number.isSafeInteger(id), 'Bank account identifier is missing')
    assert(number != null && number !== '' && name != null && name !== '', 'Bank account metadata is missing')
    assert(isAccount || (pan != null && pan !== '' && cardId != null && Number.isSafeInteger(cardId)), 'Bank card metadata is missing')
    assert(balance != null && Number.isFinite(balance), 'Bank card balance is invalid')
    assert(!identities.has(`${number}:${currency}`), 'Repeated bank balance requires account graph research')
    identities.add(`${number}:${currency}`)
    plans.push({
      account: {
        id: String(id),
        type: isAccount ? AccountType.checking : AccountType.ccard,
        title: `${name.trim()} ${currency}`,
        instrument: currency,
        balance,
        syncIds: isAccount
          ? [number, ...((numberCounts.get(number) ?? 0) > 1 ? [`bakai-account:${id}`] : [])]
          : [...new Set([number, pan as string])]
      },
      fetchParams: isAccount ? { accountId: id, source: 'account' } : { accountId: id, cardId: cardId as number }
    })
  }
  assert(plans.length > 0, 'No supported Bakai accounts were returned')
  assert(new Set(plans.map(plan => plan.account.id)).size === plans.length, 'Bank card identities collide')
  return plans.sort((left, right) => left.account.id.localeCompare(right.account.id))
}

function operationDate (raw: unknown): Date {
  assert(typeof raw === 'string', 'Bank operation date is missing')
  const normalized = raw.replace(' ', 'T')
  // Visa UI correlation and three Elcard/Visa transfer pairs establish UTC+6.
  const withOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : `${normalized}+06:00`
  const parsed = moment.parseZone(withOffset, moment.ISO_8601, true)
  assert(parsed.isValid(), 'Bank operation date is invalid')
  return parsed.toDate()
}

function merchantFor (record: unknown, code: string): Merchant | null {
  const raw = getOptString(record, 'location')
  const mccValue = getOptNumber(record, 'mcc') ?? getOptString(record, 'mcc')
  // Observed account postings use a shared technical merchant/terminal reference.
  const accountPosting = (code === 'OPTP0422' || code === 'OPTP0402') && Number(mccValue) === 6010 &&
    getOptString(record, 'merchant_id') != null && getOptString(record, 'merchant_id') === getOptString(record, 'terminal_id')
  if (raw == null || raw.trim() === '' || accountPosting || code === 'OPTP0001') return null
  const structured = /^(.+)>(.+?)\s{2,}([A-Z]{2})\s*$/.exec(raw)
  const normalize = (text: string): string => text.replace(/\s+/g, ' ').trim()
  const mcc = mccValue == null || String(mccValue).trim() === '' ? null : Number(mccValue)
  assert(mcc == null || (Number.isInteger(mcc) && mcc >= 0 && mcc <= 9999), 'Bank merchant category is invalid')
  return {
    title: normalize(structured?.[1] ?? raw),
    city: structured == null ? null : normalize(structured[2]),
    country: structured?.[3] ?? null,
    mcc: mcc === 0 ? null : mcc,
    location: null
  }
}

export function convertTransaction (record: unknown, account: AccountOrCard, fee = 0, accounts: AccountOrCard[] = [account]): ExtendedTransaction {
  if (account.type === AccountType.checking) return convertAccountTransaction(record, account, accounts)
  const amount = getOptNumber(record, 'amount')
  const original = getOptNumber(record, 'operation_amount')
  const currency = getOptString(record, 'currency')
  const originalCurrency = getOptString(record, 'operation_currency')
  const code = getOptString(record, 'type_code')
  assert(amount != null && Number.isFinite(amount) && original != null && Number.isFinite(original), 'Bank operation amount is invalid')
  assert(amount !== 0, 'Zero-value bank operation requires statement context')
  assert(currency === account.instrument && originalCurrency != null && /^[A-Z]{3}$/.test(originalCurrency), 'Bank operation currency is invalid')
  assert(code != null && code !== '', 'Bank operation type is missing')
  assert(amount * original >= 0, 'Bank operation amounts have contradictory signs')
  const date = operationDate(getOptString(record, 'date'))
  const sourceId = getOptString(record, 'utrnno')
  const movement: Movement = {
    // Purchase/refund share utrnno; a separately booked Visa Direct fee shares it with the debit.
    // Keep principal IDs stable across settlement type-code changes.
    id: sourceId == null || sourceId === '' ? null : `${sourceId}:${amount < 0 ? 'debit' : 'credit'}${code === 'BPC0001' ? ':fee' : ''}`,
    account: { id: account.id },
    invoice: originalCurrency === account.instrument ? null : { sum: original, instrument: originalCurrency },
    sum: amount - fee,
    // A matched deferred issuer fee is already included in the net account amount.
    fee
  }
  const comment = getOptString(record, 'comment')?.replace(/\s+/g, ' ').trim()
  const transaction: ExtendedTransaction = {
    hold: null,
    date,
    movements: [movement],
    merchant: merchantFor(record, code),
    comment: comment == null || comment === '' ? null : comment
  }
  // The observed bank codes identify outgoing card-to-card and P2P transfers.
  const external = code === '781' || code === 'OPTP0010'
  if (code === 'OPTP0001' || external) {
    transaction.movements = [movement, {
      id: null,
      account: { type: code === 'OPTP0001' ? AccountType.cash : null, instrument: originalCurrency, company: null, syncIds: null },
      invoice: null,
      sum: -original,
      fee: 0
    }]
  }
  if ((code === 'OPTP0422' && amount > 0) || ((code === '120' || code === 'OPTP0402') && amount < 0)) {
    // Observed opposite sides match within one second. This is a minute-based
    // heuristic, not a shared bank reference. An absent side stays unpaired.
    transaction.groupKeys = [`bakai:${currency}:${Math.abs(amount - fee)}:${Math.floor(date.getTime() / 60000)}`]
  }
  return transaction
}

function convertAccountTransaction (record: unknown, account: AccountOrCard, accounts: AccountOrCard[]): ExtendedTransaction {
  // account.history balances are running balances; operation_amount is the signed posting.
  const amount = getOptNumber(record, 'operation_amount')
  assert(amount != null && Number.isFinite(amount), 'Bank account operation amount is invalid')
  assert(getOptString(record, 'currency') === account.instrument && getOptString(record, 'operation_currency') === account.instrument, 'Unimplemented bank account currency semantics')
  // The endpoint uses zero placeholders or interval-relative row numbers, not stable movement IDs.
  const rowNumber = getOptNumber(record, 'id')
  assert(rowNumber != null && Number.isSafeInteger(rowNumber) && rowNumber >= 0, 'Bank account row number is invalid')
  assert(getOptString(record, 'location') == null, 'Unimplemented bank account location semantics')
  const purpose = getOptString(record, 'purpose')
  assert(purpose != null && purpose.trim() !== '', 'Bank account operation purpose is missing')
  const counterpartyAccount = getOptString(record, 'corraccount')
  const isOwnAccount = counterpartyAccount != null && accounts.some(item => item.syncIds?.includes(counterpartyAccount))
  const correspondent = getOptString(record, 'correspondent')?.trim()
  const transaction: ExtendedTransaction = {
    date: operationDate(getOptString(record, 'date')),
    hold: null,
    movements: [{ id: null, account: { id: account.id }, invoice: null, sum: amount, fee: 0 }],
    merchant: isOwnAccount || correspondent == null || correspondent === ''
      ? null
      : { title: correspondent, city: null, country: null, mcc: null, location: null },
    comment: purpose.trim()
  }
  if (purpose === 'Перевод Сам себе' && isOwnAccount) {
    // Observed card/account pairs share their currency, amount and minute (up to one second apart).
    // The existing minute-based strategy only pairs actual movements; an absent side stays unpaired.
    transaction.groupKeys = [`bakai:${account.instrument}:${Math.abs(amount)}:${Math.floor(transaction.date.getTime() / 60000)}`]
  } else if (!isOwnAccount && counterpartyAccount != null &&
    (purpose === 'Перевод Сам себе' || purpose.startsWith('Перевод клиринг,'))) {
    transaction.movements.push({
      id: null,
      account: { type: null, instrument: account.instrument, company: null, syncIds: [counterpartyAccount] },
      invoice: null,
      sum: -amount,
      fee: 0
    })
  }
  return transaction
}

export function convertTransactions (records: unknown[], account: AccountOrCard, fromDate: Date, toDate?: Date, accounts: AccountOrCard[] = [account]): ExtendedTransaction[] {
  const deferred = new Set<unknown>()
  const fees = new Map<unknown, number>()
  if (account.type === AccountType.ccard) {
    for (const record of records) {
      if (getOptString(record, 'type_code') !== 'OPTP0119' || getOptNumber(record, 'amount') !== 0) continue
      const fee = getOptNumber(record, 'operation_amount')
      const date = operationDate(getOptString(record, 'date'))
      const matches = records.filter(credit => {
        const net = getOptNumber(credit, 'amount')
        const gross = getOptNumber(credit, 'operation_amount')
        return ['OPTP0422', 'OPTP0026'].includes(getOptString(credit, 'type_code') ?? '') &&
          net != null && net > 0 && gross != null && Number.isFinite(gross) && fee != null && fee < 0 &&
          [record, credit].every(item => getOptString(item, 'currency') === account.instrument && getOptString(item, 'operation_currency') === account.instrument) &&
          Math.round((net - gross) * 100) === Math.round(fee * 100) && operationDate(getOptString(credit, 'date')) >= date
      })
      assert(matches.length === 1 && !fees.has(matches[0]), 'Deferred issuer fee cannot be matched unambiguously')
      fees.set(matches[0], fee as number)
      deferred.add(record)
    }
  }
  const result = records.filter(record => !deferred.has(record)).map(record => convertTransaction(record, account, fees.get(record) ?? 0, accounts)).filter(transaction =>
    transaction.date.getTime() >= fromDate.getTime() && (toDate == null || transaction.date.getTime() <= toDate.getTime())
  )
  const ids = new Set<string>()
  for (const transaction of result) {
    const id = transaction.movements[0].id
    if (id === null) continue
    assert(!ids.has(id), 'Duplicate bank movement identity requires protocol research', { id })
    ids.add(id)
  }
  return result
}
