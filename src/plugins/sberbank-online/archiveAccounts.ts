import get, { getOptString } from '../../types/get'
import { AccountOrCard, AccountType } from '../../types/zenmoney'
import { AccountGraph, currency } from './modernConverters'
import { array, object, string, JsonObject } from './modernValidation'

export interface SavedAccountGraph { accounts: AccountOrCard[], aliases: Array<[string, string]>, maskedAccounts?: Array<[string, string]> }

export function saveAccountGraph (graph: AccountGraph): SavedAccountGraph {
  return {
    accounts: graph.accounts.map(({ id, type, title, instrument, syncIds, archived, savings }) => ({ id, type, title, instrument, syncIds: [...syncIds], balance: null, ...(archived != null ? { archived } : {}), ...(savings != null ? { savings } : {}) })),
    aliases: [...graph.byBankId].map(([id, account]) => [id, account.id]),
    ...(graph.maskedAccounts != null ? { maskedAccounts: graph.maskedAccounts } : {})
  }
}

function ownHistoryResources (records: unknown[]): Map<string, { raw: JsonObject, resource: JsonObject }> {
  const result = new Map<string, { raw: JsonObject, resource: JsonObject }>()
  for (const record of records) {
    const raw = object(record, 'history operation')
    if (raw.isFinancial !== true || get(raw, 'state.category') !== 'executed') continue
    const billingId = getOptString(raw, 'billingAmount.id')
    for (const key of ['fromResource', 'toResource']) {
      if (raw[key] == null) continue
      const resource = object(raw[key], 'operation resource')
      const reference = getOptString(resource, 'id')
      if (reference == null) continue
      const id = reference.replace(/^[^:]+:/, '')
      // A billing reference proves this is the observed local account. A
      // completed self-transfer also identifies its two own-bank accounts.
      if (id === billingId || ['UfsTransferSelf', 'UfsDepositOpen', 'UfsDepositClose'].includes(String(raw.form)) || (billingId == null && key === 'fromResource')) {
        if (!result.has(id) || id === billingId) result.set(id, { raw, resource })
      }
    }
  }
  return result
}

export function getRequiredRequisites (records: unknown[], graph: AccountGraph): string[] {
  return [...ownHistoryResources(records)].filter(([id, { resource }]) => !graph.byBankId.has(id) && string(resource.id, 'resource ID').startsWith('card:')).map(([id]) => id)
}

function requisitesNumber (response: JsonObject, instrument: string): string {
  const blocks = array(response.productRequisites, 'product requisites').filter(block => currency(get(block, 'currencyDetails')) === instrument)
  if (blocks.length !== 1) throw new Error('Missing or ambiguous requisites currency')
  const fields = array(get(blocks[0], 'parameters'), 'requisite parameters').filter(field => get(field, 'paramName') === 'Номер счёта')
  if (fields.length !== 1) throw new Error('Missing or ambiguous account number')
  const number = string(get(fields[0], 'paramValue'), 'account number')
  if (!/^\d{20}$/.test(number)) throw new Error('Unexpected domestic account number')
  return number
}

export function convertArchiveAccounts (
  current: AccountGraph, archive: JsonObject, records: unknown[],
  requisites: Map<string, JsonObject> = new Map(), saved?: SavedAccountGraph | null
): AccountGraph {
  const copies = new Map(current.accounts.map(account => [account, { ...account, syncIds: [...account.syncIds] }]))
  const accounts = [...copies.values()]
  const byBankId = new Map([...current.byBankId].map(([id, original]) => {
    const account = copies.get(original)
    if (account == null) throw new Error('Invalid current account graph')
    return [id, account]
  }))
  const byNumber = new Map(accounts.map(account => [account.syncIds[0], account]))
  const savedByNumber = new Map((saved?.accounts ?? []).map(account => [account.syncIds[0], account]))
  const maskedAccounts = new Map(saved?.maskedAccounts ?? [])
  const remember = (reference: string, suffix: string | undefined, account: AccountOrCard): void => {
    const kind = reference.split(':')[0]
    if (suffix == null || !['account', 'ct-account'].includes(kind)) return
    const key = `${kind}:${account.instrument}:${suffix}`
    const prior = maskedAccounts.get(key)
    if (prior != null && prior !== account.id) throw new Error('Conflicting historical masked account identities')
    maskedAccounts.set(key, account.id)
  }
  // Preserve account identity when an active bank ID changes or a product closes.
  for (const account of accounts) {
    const prior = savedByNumber.get(account.syncIds[0])
    if (prior != null) account.id = prior.id
  }
  const products = new Map<string, { date: string, raw: JsonObject }>()
  for (const day of array(archive.capitalOnDate, 'historical product snapshots')) {
    const date = string(get(day, 'historyDate'), 'product snapshot date')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Unexpected product snapshot date')
    for (const item of array(get(day, 'productsOnDate'), 'historical products')) {
      const raw = object(item, 'historical product')
      if (!['cards', 'accumulations'].includes(String(raw.productTypeCode))) continue
      const number = string(raw.number, 'historical account number')
      if (!/^\d{20}$/.test(number)) throw new Error('Unexpected historical account number')
      const prior = products.get(number)
      if (prior == null || prior.date < date) products.set(number, { date, raw })
    }
  }
  for (const [number, { raw }] of [...products].sort(([a], [b]) => a.localeCompare(b))) {
    const instrument = currency(get(raw, 'amountCur.currency'))
    const known = byNumber.get(number)
    if (known != null) {
      if (known.instrument !== instrument) throw new Error('Historical account currency changed')
      continue
    }
    if (!['opened', 'closed'].includes(String(raw.status))) throw new Error('Unknown historical product state')
    const account: AccountOrCard = {
      id: savedByNumber.get(number)?.id ?? `sber:archive:${number}`,
      type: raw.productTypeCode === 'cards' ? AccountType.ccard : AccountType.checking,
      title: string(raw.name, 'historical product title'),
      instrument,
      syncIds: [number],
      // Snapshot amounts are past balances, even when the product is now closed.
      balance: null,
      archived: raw.status === 'closed',
      ...(raw.productTypeCode === 'accumulations' ? { savings: true } : {})
    }
    accounts.push(account)
    byNumber.set(number, account)
  }
  const byId = new Map(accounts.map(account => [account.id, account]))
  for (const prior of saved?.accounts ?? []) {
    if (!byId.has(prior.id)) {
      const account = { ...prior, balance: null }
      accounts.push(account)
      byId.set(account.id, account)
      byNumber.set(account.syncIds[0], account)
    }
  }
  // Closed-account transport IDs differ between real sessions and even between
  // history/detail views. Rebuild their aliases from current bank evidence;
  // cached transport IDs must never override a new resource's physical identity.
  const resources = ownHistoryResources(records)
  for (const [id, { raw, resource }] of resources) {
    const reference = string(resource.id, 'history resource ID')
    const suffix = getOptString(resource, 'displayedValue')?.match(/[•*]{2,}\s*(\d{4})\s*$/)?.[1]
    const currentAccount = byBankId.get(id)
    if (currentAccount != null) {
      remember(reference, suffix, currentAccount)
      continue
    }
    const billingMatches = get(raw, 'billingAmount.id') === id
    const instrument = currency(get(raw, billingMatches ? 'billingAmount.currencyCode' : 'operationAmount.currencyCode'))
    let known: AccountOrCard | undefined
    if (reference.startsWith('card:')) {
      const detail = requisites.get(id)
      if (detail == null) throw new Error('Historical card needs confirmed account requisites')
      known = byNumber.get(requisitesNumber(detail, instrument))
      if (known == null) throw new Error('Card requisites reference an undiscovered account')
    } else {
      const type = reference.startsWith('ct-account:') ? AccountType.ccard : AccountType.checking
      const candidates = suffix == null ? [] : accounts.filter(account => account.type === type && account.instrument === instrument && account.syncIds.some(number => /^\d{20}$/.test(number) && number.endsWith(suffix)))
      if (candidates.length > 1) throw new Error('Ambiguous masked historical account reference')
      known = candidates[0]
      if (known == null) {
        // Short-lived products can open and close between the PFM month-end
        // snapshots. Their real billing/resource data still identifies a balance;
        // retain an unknown balance. Their changing transport IDs cannot be used
        // as account identity; the bank-provided unique mask/currency/type can.
        if (suffix == null) throw new Error('Historical account lacks a stable matching reference')
        const fingerprint = `${reference.split(':')[0]}:${instrument}:${suffix}`
        const priorId = maskedAccounts.get(fingerprint)
        const prior = priorId != null ? byId.get(priorId) : undefined
        const closed = records.some(value => get(value, 'isFinancial') === true && get(value, 'form') === 'UfsDepositClose' && get(value, 'state.category') === 'executed' && getOptString(value, 'fromResource.id')?.replace(/^[^:]+:/, '') === id)
        if (prior != null) {
          if (prior.type !== type || prior.instrument !== instrument) throw new Error('Historical account identity changed type or currency')
          known = prior
          if (closed) known.archived = true
          byBankId.set(id, known)
          continue
        }
        const title = billingMatches ? getOptString(raw, 'billingAmount.name') : null
        known = {
          id: `sber:history:${fingerprint}`,
          type,
          title: title ?? string(resource.displayedValue, 'historical resource title'),
          instrument,
          syncIds: [suffix],
          balance: null,
          ...(closed ? { archived: true } : {}),
          ...(type === AccountType.checking ? { savings: true } : {})
        }
        accounts.push(known)
        byId.set(known.id, known)
      }
    }
    byBankId.set(id, known)
    remember(reference, suffix, known)
  }
  if (new Set(accounts.map(a => a.id)).size !== accounts.length || new Set(accounts.flatMap(a => a.syncIds)).size !== accounts.reduce((n, a) => n + a.syncIds.length, 0)) throw new Error('Duplicate historical account identity')
  return { accounts, byBankId, maskedAccounts: [...maskedAccounts] }
}
