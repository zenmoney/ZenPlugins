import _ from 'lodash'

function getLast4Digits (id, ignoreCurrentSanitizing) {
  id = id.toString().trim()
  if (/\d\d\d\d$/.test(id) && (ignoreCurrentSanitizing || !/[^\d*]/.test(id))) {
    return id.slice(-4)
  } else {
    return id
  }
}

export function sanitizeSyncId (id) {
  if (id.includes('*') || id.length < 16) {
    return id
  }
  if (id.length === 16) {
    return id.slice(0, 6) + '******' + id.slice(12, 16)
  }
  return '*****' + id.substring(5)
}

/**
 * @deprecated try using stricter ensureSyncIDsAreUniqueButSanitized instead
 */
export function convertAccountSyncID (accounts, ignoreCurrentSanitizing) {
  const accountsByLast4Digits = {}
  for (const account of accounts) {
    console.assert(Array.isArray(account.syncID), 'account.syncID should be array of strings')
    for (const id of account.syncID) {
      console.assert(typeof id === 'number' || typeof id === 'string',
        'account.syncID should be array of strings')
      const key = account.instrument + '_' + getLast4Digits(id, ignoreCurrentSanitizing)
      let group = accountsByLast4Digits[key]
      if (!group) {
        accountsByLast4Digits[key] = group = []
      }
      group.push(account)
    }
  }
  for (const account of accounts) {
    const syncID = []
    for (let id of account.syncID) {
      const key = account.instrument + '_' + getLast4Digits(id, ignoreCurrentSanitizing)
      const group = accountsByLast4Digits[key]
      id = group.length > 1 ? sanitizeSyncId(id) : getLast4Digits(id, ignoreCurrentSanitizing)
      if (syncID.indexOf(id) < 0) {
        syncID.push(id)
      }
    }
    account.syncID = syncID
  }
  return accounts
}

/**
 * @deprecated no kittens will die if you inline _.toPairs(accounts).filter(([key, account]) => key === account.id) in plugin
 * (this logic is neither generic, nor it is named correctly - it actually filters stuff)
 */
export function convertAccountMapToArray (accounts) {
  const filtered = []
  for (const id in accounts) {
    const account = accounts[id]
    if (account.id.toString() === id) {
      filtered.push(account)
    }
  }
  return filtered
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
      console.assert(/\d{4}$/.test(account.singleSyncID), 'syncID must end with last4, but was: ' + account.singleSyncID)
      return account.singleSyncID.slice(-4)
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
    { pattern: /(?:АЛЬФАБАНК|ALFA_MOBILE)/i, account: { type: null, company: { id: '3' } } },
    { pattern: /(?:ВТБ|VTB)/i, account: { type: null, company: { id: '4637' } } },
    { pattern: /(?:QIWI)/i, account: { type: null, company: { id: '15592' } } },
    { pattern: /(?:CREDIT\s*EUROPE)/i, account: { type: null, company: { id: '5165' } } },
    { pattern: /(?:Ozon[-\s]?Pay)/i, account: { type: null, company: { id: '15685' } } },
    { pattern: /(?:Открытие|OPEN.RU)/i, account: { type: null, company: { id: '4761' } } },
    { pattern: /(?:Рокетбанк|Rocketbank)/i, account: { type: null, company: { id: '15444' } } },
    { pattern: /(?:Райфайзен|R-ONLINE)/i, account: { type: null, company: { id: '5156' } } },
    { pattern: /(?:СБЕРБАНК|SBERBANK)/i, account: { type: null, company: { id: '4624' } } },
    { pattern: /(?:СовКомБанк|Sovcombank)/i, account: { type: null, company: { id: '4534' } } },
    { pattern: /(?:Ситибанк|Citibank)/i, account: { type: null, company: { id: '4859' } } },
    { pattern: /(?:Тинькофф|Tинькoфф|TINKOFF)/i, account: { type: null, company: { id: '4902' } } },
    { pattern: /(?:Home\s*Credit|Хоум\s*Кредит|HCFB)/i, account: { type: null, company: { id: '4412' } } },
    { pattern: /(?:Яндекс.Деньги?|YANDEX.MONEY)/i, account: { type: null, company: { id: '15420' } } },
    { pattern: /(?:УРАЛСИБ)/i, account: { type: null, company: { id: '4783' } } },
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
