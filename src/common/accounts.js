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
  if (str) {
    for (const data of [
      { pattern: 'TINKOFF BANK CARD2CARD', account: { type: 'ccard', company: { id: '4902' } } },
      { pattern: 'Тинькофф', account: { type: null, company: { id: '4902' } } },
      { pattern: 'TINKOFF', account: { type: null, company: { id: '4902' } } },
      { pattern: 'CARD2CARD ALFA_MOBILE', account: { type: 'ccard', company: { id: '3' } } },
      { pattern: 'С2С ALFA_MOBILE', account: { type: 'ccard', company: { id: '3' } } },
      { pattern: 'СовКомБанк', account: { type: null, company: { id: '4534' } } },
      { pattern: 'Сбербанк Онлайн', account: { type: 'ccard', company: { id: '4624' } } },
      { pattern: 'Яндекс.Деньги', account: { type: null, company: { id: '15420' } } },
      { pattern: 'YANDEX.MONEY', account: { type: null, company: { id: '15420' } } },
      { pattern: 'Рокетбанк', account: { type: null, company: { id: '15444' } } },
      { pattern: 'Home Credit Bank', account: { type: null, company: { id: '4412' } } },
      { pattern: 'HCFB', account: { type: null, company: { id: '4412' } } },
      { pattern: 'C2C R-ONLINE', account: { type: 'ccard', company: { id: '5156' } } },
      { pattern: 'OPEN.RU CARD2CARD', account: { type: 'ccard', company: { id: '4761' } } },
      { pattern: 'QIWI', account: { type: null, company: { id: '15592' } } }
    ]) {
      if (str.toLowerCase().indexOf(data.pattern.toLowerCase()) >= 0) {
        return data.account
      }
    }
  }
  return null
}
