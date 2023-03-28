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

const groupReplacementPairsByReplacement = (replacementPairs) => {
  return _.toPairs(_.groupBy(replacementPairs, ([, replacement]) => replacement))
}

const ensureReplacementsAreUnique = (replacementPairsByInstrument) => {
  return _.mapValues(replacementPairsByInstrument, (replacementPairs) => {
    return _.flatMap(groupReplacementPairsByReplacement(replacementPairs), ([, pairs]) => {
      return pairs.length === 1
        ? pairs
        : []
    })
  })
}

export function ensureSyncIDsAreUniqueButSanitized ({ accounts, sanitizeSyncId }) {
  console.assert(Array.isArray(accounts), 'accounts must be array')
  console.assert(typeof sanitizeSyncId === 'function', 'sanitizeSyncId must be function')
  const replacementPairsByInstrument = _.mapValues(_.groupBy(accounts, (x) => x.instrument), (accounts) => {
    const flattenedAccounts = _.flatMap(accounts, ({ syncID, ...rest }) => {
      console.assert(Array.isArray(syncID) && syncID.length > 0, 'account.syncIds must be array of non-empty strings')
      return syncID.map((singleSyncID) => {
        console.assert(typeof singleSyncID === 'string' && singleSyncID.length > 0, 'account.syncIds must be array of non-empty strings, met not a valid string: ' + JSON.stringify(singleSyncID))
        return ({ singleSyncID, ...rest })
      })
    })
    const flattenedAccountsByLast4Digits = _.groupBy(flattenedAccounts, (account) => {
      return trimSyncId(account.singleSyncID)
    })
    return _.flatMap(
      _.toPairs(flattenedAccountsByLast4Digits),
      ([last4, flattenedAccountsSharingKey]) => flattenedAccountsSharingKey.length === 1
        ? [[flattenedAccountsSharingKey[0].singleSyncID, last4]]
        : flattenedAccountsSharingKey.map((x) => [x.singleSyncID, sanitizeSyncId(x.singleSyncID)])
    )
  })
  const replacementsByInstrument = _.mapValues(
    ensureReplacementsAreUnique(replacementPairsByInstrument),
    (replacementPairs) => _.fromPairs(replacementPairs)
  )
  return accounts.map((account) => {
    const syncIds = account.syncID
      .map((syncId) => replacementsByInstrument[account.instrument][syncId])
      .filter((syncId) => syncId)
    console.assert(syncIds.length > 0, 'invariant: syncId replacementPairs have duplicates', {
      duplicates: groupReplacementPairsByReplacement(replacementPairsByInstrument[account.instrument])
        .filter(([, pairs]) => pairs.length > 1)
        .map(([replacement, pair]) => [replacement, pair.length])
    })
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
