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

const assertReplacementsAreUnique = (replacementPairs) => {
  const duplicates = _.toPairs(_.countBy(replacementPairs, ([syncID, replacement]) => replacement))
    .filter(([replacement, count]) => count !== 1)
  console.assert(duplicates.length === 0, 'invariant: syncID replacementPairs have duplicates', { duplicates })
}

export function ensureSyncIDsAreUniqueButSanitized ({ accounts, sanitizeSyncId }) {
  console.assert(Array.isArray(accounts), 'accounts must be array')
  console.assert(typeof sanitizeSyncId === 'function', 'sanitizeSyncId must be function')
  const replacementsByInstrument = _.mapValues(_.groupBy(accounts, (x) => x.instrument), (accounts) => {
    const flattenedAccounts = _.flatMap(accounts, ({ syncID, ...rest }) => {
      console.assert(Array.isArray(syncID), 'account.syncID must be array')
      return syncID.map((singleSyncID) => {
        console.assert(typeof singleSyncID === 'string', 'account.syncID must be array of strings, met not a string: ' + JSON.stringify(singleSyncID))
        return ({ singleSyncID, ...rest })
      })
    })
    const flattenedAccountsByLast4Digits = _.groupBy(flattenedAccounts, (account) => {
      return trimSyncId(account.singleSyncID)
    })
    const syncIDReplacementPairs = _.flatMap(
      _.toPairs(flattenedAccountsByLast4Digits),
      ([last4, flattenedAccountsSharingKey]) => flattenedAccountsSharingKey.length === 1
        ? [[flattenedAccountsSharingKey[0].singleSyncID, last4]]
        : flattenedAccountsSharingKey.map((x) => [x.singleSyncID, sanitizeSyncId(x.singleSyncID)])
    )
    assertReplacementsAreUnique(syncIDReplacementPairs)
    return _.fromPairs(syncIDReplacementPairs)
  })
  return accounts.map((account) => ({ ...account, syncID: account.syncID.map((syncID) => replacementsByInstrument[account.instrument][syncID] || syncID) }))
}

export function parseOuterAccountData (str) {
  if (!str) {
    return null
  }
  for (const data of [
    // Россия
    { pattern: /(?:Авангард|Avangard)/i, account: { type: null, company: { id: '4986' } } },
    { pattern: /(?:АЛЬФА[-\s]?БАНК|ALFA_MOBILE)/i, account: { type: null, company: { id: '3' } } },
    { pattern: /(?:ВТБ|VTB|VB24)/i, account: { type: null, company: { id: '4637' } } },
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
