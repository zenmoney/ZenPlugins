import _ from 'lodash'
import padLeft from 'pad-left'

export function sanitizeSyncId (id) {
  if (id.includes('*') || id.length < 16) {
    return id
  }
  if (id.length === 16) {
    return id.slice(0, 6) + '******' + id.slice(12, 16)
  }
  return '*****' + id.substring(5)
}

export function trimSyncId (id) {
  console.assert(typeof id === 'string' && id.length >= 4, 'syncID must be at least 4 characters long, but was:', id)
  const match = id.match(/^([^*]*)\*+([^*]+)$/)
  if (!match) {
    return id.slice(-4)
  }
  const secondPart = match[2]
  if (secondPart.length >= 4) {
    return secondPart.slice(-4)
  }
  const firstPart = match[1].slice(0, 3 - secondPart.length)
  return firstPart + padLeft(secondPart, 4 - firstPart.length, '*')
}

function expandMask (mask, group, replacements) {
  // Keep at least one character masked, even when every hidden digit differs.
  if (mask.indexOf('*') === mask.lastIndexOf('*')) {
    return false
  }
  const sources = group.map(({ source }) => replacements.get(source) || source)
  if (sources.some(source => source.length !== mask.length)) {
    return false
  }
  for (let i = mask.indexOf('*'); i < mask.length; i++) {
    if (mask[i] === '*' && sources.some(source => source[i] !== sources[0][i])) {
      group.forEach((entry, j) => {
        entry.mask = mask.slice(0, i) + sources[j][i] + mask.slice(i + 1)
      })
      return true
    }
  }
  return false
}

function resolveReplacements (entries, accounts) {
  const groupByMask = () => _.toPairs(_.groupBy(entries, 'mask'))
  let groups = groupByMask()
  const replacements = new Map()
  for (const [mask, group] of groups) {
    if (group.length === 1) replacements.set(group[0].source, mask)
  }
  const missingAccounts = accounts.filter(account => !account.syncID.some(id => replacements.has(id)))
  if (missingAccounts.length === 0) return { replacements, duplicates: [] }
  const missingSources = new Set(_.flatMap(missingAccounts, 'syncID'))
  let changed
  do {
    changed = false
    for (const [mask, group] of groups) {
      if (group.length > 1 && group.some(({ source }) => missingSources.has(source)) && expandMask(mask, group, replacements)) {
        changed = true
      }
    }
    // An expanded mask can meet a bank-supplied mask from a different group.
    if (changed) groups = groupByMask()
  } while (changed)
  const duplicates = []
  for (const [mask, group] of groups) {
    if (group.length === 1) {
      replacements.set(group[0].source, mask)
    } else {
      duplicates.push([mask, group.length])
    }
  }
  return { replacements, duplicates }
}

export function ensureSyncIDsAreUniqueButSanitized ({ accounts, sanitizeSyncId }) {
  console.assert(Array.isArray(accounts), 'accounts must be array')
  console.assert(typeof sanitizeSyncId === 'function', 'sanitizeSyncId must be function')
  const byInstrument = _.mapValues(_.groupBy(accounts, (x) => x.instrument), (accounts) => {
    const sources = _.flatMap(accounts, ({ syncID }) => {
      console.assert(Array.isArray(syncID) && syncID.length > 0, 'account.syncIds must be array of non-empty strings')
      for (const source of syncID) {
        console.assert(typeof source === 'string' && source.length > 0, 'account.syncIds must be array of non-empty strings, met not a valid string: ' + JSON.stringify(source))
      }
      return _.uniq(syncID)
    })
    const entries = _.flatMap(_.toPairs(_.groupBy(sources, trimSyncId)), ([last4, group]) =>
      group.map(source => ({ source, mask: group.length === 1 ? last4 : sanitizeSyncId(source) })))
    return resolveReplacements(entries, accounts)
  })
  return accounts.map((account) => {
    const { replacements, duplicates } = byInstrument[account.instrument]
    const syncIds = _.uniq(account.syncID).map(id => replacements.get(id)).filter(Boolean)
    console.assert(syncIds.length > 0, 'invariant: syncId replacementPairs have duplicates', { duplicates })
    return {
      ...account,
      syncID: syncIds
    }
  })
}

export function parseOuterAccountData (str) {
  if (!str) {
    return null
  }
  for (const data of [
    // Россия
    { pattern: /(?:Авангард|Avangard)/i, account: { type: null, company: { id: '4986' } } },
    { pattern: /(?:АЛЬФА[-\s]?БАНК|ALFA_MOBILE|ALFABANK RUS)/i, account: { type: null, company: { id: '3' } } },
    { pattern: /(?:ВТБ|(?:^|[^.])VTB|VB24)/i, account: { type: null, company: { id: '4637' } } },
    { pattern: /(?:QIWI)/i, account: { type: null, company: { id: '15592' } } },
    { pattern: /(?:CREDIT\s*EUROPE)/i, account: { type: null, company: { id: '5165' } } },
    { pattern: /(?:Ozon[-\s]?Pay)/i, account: { type: null, company: { id: '15685' } } },
    { pattern: /(?:Открытие|OPEN.RU)/i, account: { type: null, company: { id: '4761' } } },
    { pattern: /(?:Рокетбанк|Rocketbank)/i, account: { type: null, company: { id: '15444' } } },
    { pattern: /(?:Райфф?айзен|R(?:-|\s)ONLINE)/i, account: { type: null, company: { id: '5156' } } },
    { pattern: /(^|\s)(?:Банк Санкт-Петербург)/i, account: { type: null, company: { id: '4' } } },
    { pattern: /(?:СБЕРБАНК|SBERBANK)/i, account: { type: null, company: { id: '4624' } } },
    { pattern: /(?:СовКомБанк|Sovcombank)/i, account: { type: null, company: { id: '4534' } } },
    { pattern: /(?:Ситибанк|Citibank)/i, account: { type: null, company: { id: '4859' } } },
    { pattern: /(?:Тинькофф|Tинькoфф|TINKOFF)/i, account: { type: null, company: { id: '4902' } } },
    { pattern: /(?:Home\s*Credit|Хоум\s*Кредит|HCFB|HCF\s+Bank)/i, account: { type: null, company: { id: '4412' } } },
    { pattern: /(?:Яндекс.Деньги?|YANDEX.MONEY)/i, account: { type: null, company: { id: '15420' } } },
    { pattern: /(?:УРАЛСИБ)/i, account: { type: null, company: { id: '4783' } } },
    { pattern: /(?:ВОСТОЧНЫЙ|ORIENT\s+EXPRESS\s+BANK)/i, account: { type: null, company: { id: '4621' } } },
    // Украина
    { pattern: /(?:MONODirect)/i, account: { type: 'ccard', company: { id: '15620' } } },
    { pattern: /(?:Приват|P24)/i, account: { type: null, company: { id: '12574' } } },
    { pattern: /(?:УКРСИББАНК)/i, account: { type: null, company: { id: '15395' } } }
  ]) {
    if (data.pattern.test(str)) {
      const account = data.account
      if (account && !account.type && /(?:card2card?|[cс]2[cс])/i.test(str)) {
        account.type = 'ccard'
      }
      return account
    }
  }
  return null
}
