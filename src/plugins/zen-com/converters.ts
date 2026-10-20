import { isEqual } from 'lodash'
import get from '../../types/get'
import { AccountType } from '../../types/zenmoney'
import type { AccountOrCard, Merchant, Movement, Transaction } from '../../types/zenmoney'
import type { AccountPlan } from './models'
import { amountAt, arrayAt, dateAt, stringAt, textAt } from './validation'

export function convertAccounts (rawAccounts: unknown[]): AccountPlan[] {
  const unique = new Map<string, unknown>()
  for (const raw of rawAccounts) {
    const id = stringAt(raw, 'id')
    assert(!unique.has(id) || isEqual(unique.get(id), raw), 'Conflicting ZEN.COM accounts', { id })
    unique.set(id, raw)
  }
  assert(unique.size > 0, 'ZEN.COM returned no accounts')
  const numbers = new Map<string, number>()
  for (const raw of unique.values()) {
    const number = stringAt(raw, 'accountNumber')
    numbers.set(number, (numbers.get(number) ?? 0) + 1)
  }
  const accounts: AccountOrCard[] = [...unique].sort(([a], [b]) => a.localeCompare(b)).map(([id, raw]) => {
    const instrument = stringAt(raw, 'currency')
    const number = stringAt(raw, 'accountNumber')
    return {
      id,
      type: AccountType.checking,
      title: `ZEN.COM ${instrument}`,
      instrument,
      syncIds: numbers.get(number) === 1 ? [number] : [number, id],
      balance: amountAt(raw, 'balance')
    }
  })
  const knownAccountNumbers = new Set<string>()
  for (const raw of unique.values()) {
    knownAccountNumbers.add(stringAt(raw, 'accountNumber'))
    const virtual = get(raw, 'virtualAccounts')
    assert(virtual !== null && typeof virtual === 'object' && !Array.isArray(virtual), 'Invalid ZEN.COM virtual accounts')
    for (const side of ['local', 'international']) {
      if (get(virtual, side) != null) knownAccountNumbers.add(stringAt(virtual, `${side}.accountNumber`))
    }
  }
  return [{ accounts, knownAccountNumbers: [...knownAccountNumbers].sort(), fetchParams: { accountIds: accounts.map(account => account.id) } }]
}

function direction (ownerAccount: unknown): 1 | -1 {
  const value = stringAt(ownerAccount, 'direction')
  assert(value === 'HTD_CREDIT' || value === 'HTD_DEBIT', 'Unknown ZEN.COM direction', { direction: value })
  return value === 'HTD_CREDIT' ? 1 : -1
}

function positiveAmount (raw: unknown, field: string): number {
  const value = amountAt(raw, field)
  assert(value >= 0, 'Negative unsigned ZEN.COM amount', { field })
  return value
}

function feeKey (raw: unknown, amount: number, currency: string): string {
  const owners = arrayAt(raw, 'transaction.owner.accounts')
  assert(owners.length > 0, 'Missing ZEN.COM fee account')
  return JSON.stringify([stringAt(raw, 'transaction.createdAt'), stringAt(owners[0], 'id'), amount, currency, stringAt(raw, 'transaction.status')])
}

function comment (raw: unknown, type: string): string | null {
  const title = textAt(raw, 'transaction.title')
  let subtitle = textAt(raw, 'transaction.subTitle')
  const card = textAt(raw, 'transaction.owner.card.maskedCardNumber')
  const original = stringAt(raw, 'transaction.original.currency')
  const settlement = stringAt(raw, 'transaction.settlement.currency')
  const generic = title === 'Money transfer' || title === `Exchange ${original} to ${settlement}` ||
    (['HTP_PURCHASE', 'HTP_MONEYSEND', 'HTP_WITHDRAWAL'].includes(type) && card !== null && title === card.slice(-4))
  const rate = type === 'HTP_EXCHANGE' ? textAt(raw, 'transaction.exchangeRate') : null
  if (rate !== null && subtitle === `1 ${original} = ${rate} ${settlement}`) subtitle = null
  const value = [generic ? null : title, subtitle].filter(value => value !== null).join('\n')
  return value === '' ? null : value
}

function merchant (raw: unknown, type: string): Merchant | null {
  const title = textAt(raw, 'transaction.party.name')
  if (title === null) return null
  const mcc = textAt(raw, 'transaction.terminal.mcc')
  assert(mcc === null || /^\d{4}$/.test(mcc), 'Invalid ZEN.COM merchant category code')
  return {
    title,
    city: ['HTP_PURCHASE', 'HTP_MONEYSEND', 'HTP_WITHDRAWAL'].includes(type) ? textAt(raw, 'transaction.party.addressLine1') : null,
    country: ['HTP_PURCHASE', 'HTP_MONEYSEND', 'HTP_WITHDRAWAL'].includes(type) ? textAt(raw, 'transaction.party.addressLine2') : null,
    mcc: mcc === null ? null : Number(mcc),
    location: null
  }
}

export function convertTransactions (rawEntries: unknown[], accounts: AccountOrCard[], includedIds: Set<string>, knownAccountNumbers: string[] = []): Transaction[] {
  const byId = new Map(accounts.map(account => [account.id, account]))
  const unique = new Map<string, unknown>()
  const knownNumbers = new Set([...accounts.flatMap(account => account.syncIds), ...knownAccountNumbers])
  for (const raw of rawEntries) {
    const id = stringAt(raw, 'id')
    assert(!unique.has(id) || isEqual(unique.get(id), raw), 'Conflicting ZEN.COM history entries', { id })
    unique.set(id, raw)
    for (const owner of arrayAt(raw, 'transaction.owner.accounts')) {
      if (byId.has(stringAt(owner, 'id'))) knownNumbers.add(stringAt(owner, 'number'))
    }
  }
  const separateFees = new Set<string>()
  for (const raw of unique.values()) {
    if (get(raw, 'transaction.transactionType') === 'HTP_FEE') {
      separateFees.add(feeKey(raw, positiveAmount(raw, 'transaction.settlement.amount'), stringAt(raw, 'transaction.settlement.currency')))
    }
  }
  const result: Transaction[] = []
  for (const [id, raw] of unique) {
    const owners = arrayAt(raw, 'transaction.owner.accounts')
    assert(owners.length > 0, 'Missing ZEN.COM transaction account', { id })
    const ownerIds = owners.map(owner => stringAt(owner, 'id'))
    assert(ownerIds.every(id => byId.has(id)), 'Unknown ZEN.COM transaction account', { id, accountIds: ownerIds })
    if (!ownerIds.some(id => includedIds.has(id))) continue
    const status = stringAt(raw, 'transaction.status')
    if (status === 'HTS_REJECTED') continue
    assert(status === 'HTS_ACCEPTED' || status === 'HTS_IN_PROGRESS', 'Unknown ZEN.COM transaction status', { id, status })
    const type = stringAt(raw, 'transaction.transactionType')
    assert(['HTP_PURCHASE', 'HTP_FEE', 'HTP_TOP_UP', 'HTP_TRANSFER_OUT', 'HTP_TRANSFER_IN', 'HTP_EXCHANGE', 'HTP_MONEYSEND', 'HTP_WITHDRAWAL', 'HTP_CORRECTION'].includes(type), 'Unsupported ZEN.COM transaction type', { id, type })
    const originalCurrency = stringAt(raw, 'transaction.original.currency')
    const settlementCurrency = stringAt(raw, 'transaction.settlement.currency')
    const originalAmount = positiveAmount(raw, 'transaction.original.amount')
    const settlementAmount = positiveAmount(raw, 'transaction.settlement.amount')
    const reportedFee = positiveAmount(raw, 'transaction.fee.amount.amount')
    if (reportedFee !== 0) {
      assert(separateFees.has(feeKey(raw, reportedFee, stringAt(raw, 'transaction.fee.amount.currency'))), 'Unverified ZEN.COM fee representation', { id })
    }
    const movements = owners.map((owner): Movement => {
      const accountId = stringAt(owner, 'id')
      const account = byId.get(accountId) as AccountOrCard
      const sign = direction(owner)
      const exchangeDebit = type === 'HTP_EXCHANGE' && sign === -1
      const currency = exchangeDebit ? originalCurrency : settlementCurrency
      assert(account.instrument === currency, 'ZEN.COM movement currency does not match account', { id, accountId, currency })
      return {
        id: `${id}:${accountId}`,
        account: { id: accountId },
        sum: sign * (exchangeDebit ? originalAmount : settlementAmount),
        invoice: account.instrument === originalCurrency ? null : { sum: sign * originalAmount, instrument: originalCurrency },
        fee: 0
      }
    })
    if (type === 'HTP_EXCHANGE') {
      assert(movements.length === 2 && direction(owners[0]) !== direction(owners[1]) && ownerIds[0] !== ownerIds[1], 'Invalid ZEN.COM exchange movements', { id })
      result.push({ date: dateAt(raw, 'transaction.createdAt'), hold: status === 'HTS_IN_PROGRESS', movements: movements as [Movement, Movement], merchant: null, comment: comment(raw, type) })
      continue
    }
    assert(movements.length === 1, 'Unexpected ZEN.COM movement count', { id, type })
    const partyNumber = textAt(raw, 'transaction.party.account.number')
    if (type === 'HTP_TOP_UP' || type === 'HTP_MONEYSEND' || type === 'HTP_WITHDRAWAL' || ((type === 'HTP_TRANSFER_OUT' || type === 'HTP_TRANSFER_IN') && (partyNumber === null || !knownNumbers.has(partyNumber)))) {
      const card = type === 'HTP_TOP_UP' ? textAt(raw, 'transaction.owner.card.maskedCardNumber') : null
      movements.push({
        id: null,
        account: { type: type === 'HTP_WITHDRAWAL' ? AccountType.cash : card === null ? null : AccountType.ccard, instrument: originalCurrency, company: null, syncIds: card !== null ? [card] : partyNumber === null ? null : [partyNumber] },
        sum: -direction(owners[0]) * originalAmount,
        invoice: null,
        fee: 0
      })
    }
    result.push({
      date: dateAt(raw, 'transaction.createdAt'),
      hold: status === 'HTS_IN_PROGRESS',
      movements: movements as [Movement] | [Movement, Movement],
      merchant: merchant(raw, type),
      comment: comment(raw, type)
    })
  }
  return result.sort((a, b) => {
    const dateOrder = b.date.getTime() - a.date.getTime()
    return dateOrder !== 0 ? dateOrder : (a.movements[0].id ?? '').localeCompare(b.movements[0].id ?? '')
  })
}
