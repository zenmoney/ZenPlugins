/* global self */

import { nativeConsole } from './consoleAdapter'
import { promptAsync } from './promptAsync'
import WebSocket from './webSocket'
import { makePluginDataApi } from './ZPAPI.pluginData'
import {
  addCookies,
  fetchRemoteSync,
  getCookies,
  getLastError,
  getLastResponseHeader,
  getLastResponseHeaders,
  getLastResponseParameters,
  getLastStatusCode,
  getLastStatusString,
  getLastUrl,
  getResourceSync,
  handleException,
  setDefaultEncoding,
  setThrowOnError
} from './ZPAPI.utils'

function sleepSync (durationMs) {
  const startMs = Date.now()
  for (let i = 0; i < 30000000; i++) {
  }
  const nowMs = Date.now()
  if (nowMs - startMs < durationMs) {
    sleepSync(durationMs - nowMs + startMs)
  }
}

function collapseWhitespaces (str) {
  return str.replace(/\s+/g, ' ').trim()
}

function castInterval (object) {
  return ['day', 'month', 'year'].indexOf(object) < 0 ? null : object
}

function castDate (object) {
  if (!object) {
    return null
  }
  let ts = 0
  if (object instanceof Date) {
    ts = object.getTime()
  } else if (typeof object === 'number') {
    ts = object
  } else if (typeof object === 'string') {
    object = object.trim()
    if (object.length === 0) {
      return null
    }
    try {
      const result = object.match(/(\d{2})\.(\d{2})\.(\d{4})/)
      if (result) {
        ts = Date.parse(result[3] + '-' + result[2] + '-' + result[1])
        if (isNaN(ts)) {
          ts = 0
        }
      } else {
        ts = 0
      }
    } catch (e) {
      ts = 0
    }
    if (ts === 0) {
      try {
        ts = Date.parse(object)
        if (isNaN(ts)) {
          ts = 0
        }
      } catch (e) {
        ts = 0
      }
    }
    if (ts === 0) {
      try {
        ts = parseFloat(object)
        if (isNaN(ts)) {
          ts = 0
        }
      } catch (e) {
        ts = 0
      }
    }
  }
  if (ts >= 10000000000) {
    ts /= 1000
  }
  if (ts > 0) {
    return ts
  }
  return null
}

const notImplemented = () => {
  throw new Error('API method is not implemented')
}

function ZPAPI ({ manifest, preferences, data }) {
  this.application = { platform: 'browser', version: '1', build: '1' }
  this.features = {
    j2v8Date: true,
    dateProcessing: true,
    binaryRequestBody: true,
    binaryResponseBody: true
  }
  const knownAccounts = {}
  const addedAccounts = []
  const addedTransactions = []

  this.getLevel = () => 12

  this.trace = (msg, caller) => nativeConsole.log('[' + (caller || 'trace') + ']', msg)
  this.setExceptions = setThrowOnError
  this.setDefaultCharset = setDefaultEncoding
  this.getLastError = getLastError
  this.isAvailable = () => true
  this.getPreferences = () => preferences
  this.setOptions = notImplemented
  this.setAuthentication = notImplemented
  this.clearAuthentication = notImplemented
  this.getCookies = notImplemented
  this.getCookie = notImplemented

  const pluginDataApi = makePluginDataApi(data)
  Object.assign(this, pluginDataApi.methods)

  this.getLastStatusString = getLastStatusString
  this.getLastStatusCode = getLastStatusCode
  this.getLastResponseHeader = getLastResponseHeader
  this.getLastResponseHeaders = getLastResponseHeaders
  this.getLastUrl = getLastUrl
  this.getLastResponseParameters = getLastResponseParameters
  this.setResultCalled = new Promise((resolve, reject) => {
    let isComplete = false
    this.isSetResultCalled = () => isComplete

    this.setResult = (result) => {
      if (isComplete) {
        throw new Error('setResult must be called exactly once')
      }
      if (typeof result !== 'object') {
        handleException('[ROB] Wrong result object')
        return
      }
      isComplete = true
      if (result.success) {
        if (result.account) {
          addAccount(result.account)
        }
        if (result.transaction) {
          addTransaction(result.transaction)
        }
        resolve({
          addedAccounts,
          addedTransactions,
          pluginDataChange: pluginDataApi.saveDataRequested
            ? { oldValue: pluginDataApi.initialData, newValue: pluginDataApi.currentData }
            : null
        })
      } else {
        reject(result)
      }
    }
  })

  function addAccount (accounts) {
    if (!Array.isArray(accounts)) {
      accounts = [accounts]
    }

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]
      if (typeof account !== 'object' || Array.isArray(account)) {
        return handleException('[AOB] Wrong account object. It should be {} object or array of objects')
      }
      const id = account.id
      if (!account.id || typeof account.id !== 'string' || account.id.length === 0) {
        return handleException('[AID] Wrong account ' + id + '. Account should have id')
      }
      if (!account.title || typeof account.title !== 'string' || account.title.length === 0) {
        return handleException('[ATI] Wrong account ' + id + '. Account should have title')
      }
      if (account.type && typeof account.type === 'string' &&
                account.type.length > 0) {
        if (['card', 'ccard', 'checking', 'loan', 'deposit'].indexOf(account.type.toLowerCase()) < 0) {
          return handleException('[ATY] Wrong account ' + id + ". Account should have type 'card' or 'checking' or 'deposit' or 'loan'")
        }
      } else {
        account.type = 'ccard'
      }
      if ((account.balance !== undefined && account.balance !== null && typeof account.balance !== 'number') ||
                (account.startBalance !== undefined && typeof account.startBalance !== 'number') ||
                (account.creditLimit !== undefined && typeof account.creditLimit !== 'number')) {
        return handleException('[ABA] Wrong account ' + id + '. Account balance, startBalance, creditLimit fields should not be set or be numbers')
      }
      let syncIDs = account.syncID
      let syncIDCount = 0
      if (!Array.isArray(syncIDs)) {
        syncIDs = [syncIDs]
      }
      for (let j = 0; j < syncIDs.length; j++) {
        let syncID = syncIDs[j]
        if (typeof syncID !== 'string') {
          if (typeof syncID === 'number' ||
                        typeof syncID === 'boolean') {
            syncID = syncID.toString()
          } else {
            syncID = ''
          }
        }
        syncID = collapseWhitespaces(syncID)
        if (syncID.length === 0) {
          return handleException('[ASY] Wrong account ' + id + '. Wrong syncID in account. It should be string or string array')
        }
        syncIDCount++
      }
      if (syncIDCount === 0) {
        return handleException('[ASY] Wrong account ' + id + '. Account should have syncID')
      }
      if (account.type === 'loan' ||
                account.type === 'deposit') {
        account.startDate = castDate(account.startDate)
        account.payoffInterval = castInterval(account.payoffInterval)
        account.endDateOffsetInterval = castInterval(account.endDateOffsetInterval)

        if (typeof account.percent !== 'number' ||
                    typeof account.capitalization !== 'boolean' ||
                    typeof account.endDateOffset !== 'number' ||
                    typeof account.payoffStep !== 'number' ||
                    account.startDate === null ||
                    account.endDateOffsetInterval === null ||
                    Math.floor(account.payoffStep) !== account.payoffStep ||
                    Math.floor(account.endDateOffset) !== account.endDateOffset ||
                    account.endDateOffset <= 0 ||
                    account.payoffStep < 0 ||
                    (account.payoffStep > 0 && account.payoffInterval === null) ||
                    (account.payoffStep === 0 && account.payoffInterval)) {
          return handleException('[ADE] Wrong account ' + id + ' deposit or loan parameters')
        }
      }
      addedAccounts.push(account)
      knownAccounts[account.id] = {
        id: account.id
      }
    }
  }

  function addTransaction (transactions) {
    if (!Array.isArray(transactions)) {
      transactions = [transactions]
    }
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]
      if (typeof transaction !== 'object' || Array.isArray(transaction)) {
        return handleException('[TOB] Wrong transaction object. It should be {} object or array of objects')
      }
      if (addTransactionObject(transaction)) {
        return
      }
    }
  }

  function getAccount (id) {
    let account = knownAccounts[id]
    if (account) {
      return account
    }
    account = {}
    let type = id
    const typeIdx = id.indexOf('#')
    if (typeIdx >= 0) {
      type = id.substring(0, typeIdx)
      const idx = id.indexOf('#', typeIdx + 1)
      if (idx >= 0) {
        account.instrument = id.substring(typeIdx + 1, idx)
        account.syncID = id.substring(idx + 1)
          .split(',')
          .map(collapseWhitespaces)
          .filter(function (id) {
            return id.length > 0
          })
      } else {
        account.instrument = id.substring(typeIdx + 1)
      }
    }
    type = collapseWhitespaces(type)
    if (['cash', 'card', 'ccard', 'checking', 'loan', 'deposit', 'emoney'].indexOf(type) >= 0) {
      account.type = type
      knownAccounts[id] = account
    } else {
      account = null
    }
    return account
  }

  function addTransactionObject (transaction) {
    const id = transaction.id || '(null)'

    if (typeof transaction.income !== 'number' || transaction.income < 0 ||
            typeof transaction.outcome !== 'number' || transaction.outcome < 0) {
      return handleException('[TSN] Wrong transaction ' + id + '. Income and outcome should be non-negative')
    }
    if (transaction.income === 0 && transaction.outcome === 0) {
      return handleException('[TSZ] Wrong transaction ' + id + '. Transaction should have either income > 0 or outcome > 0')
    }
    if ((transaction.opIncome !== undefined &&
            transaction.opIncome !== null && (typeof transaction.opIncome !== 'number' || transaction.opIncome < 0)) ||
            (transaction.opOutcome !== undefined &&
                transaction.opOutcome !== null && (typeof transaction.opOutcome !== 'number' || transaction.opOutcome < 0))) {
      return handleException('[TON] Wrong transaction ' + id + '. opIncome and opOutcome should be null or non-negative')
    }
    if ((transaction.latitude !== undefined && (typeof transaction.latitude !== 'number' ||
            Math.abs(transaction.latitude) > 90)) ||
            (transaction.longitude !== undefined && (typeof transaction.longitude !== 'number' ||
                Math.abs(transaction.longitude) > 180))) {
      return handleException('[TCO] Wrong transaction ' + id + ' coordinates')
    }
    if (transaction.date !== undefined && castDate(transaction.date) === null) {
      return handleException('[TDA] Wrong transaction ' + id + '. Wrong date format')
    }
    if (transaction.mcc !== undefined &&
            transaction.mcc !== null && (typeof transaction.mcc !== 'number' ||
                Math.floor(transaction.mcc) !== transaction.mcc)) {
      return handleException('[TMC] Wrong transaction ' + id + '. MCC should be null or integer')
    }
    if (typeof transaction.incomeAccount !== 'string' || transaction.incomeAccount.length === 0 ||
            typeof transaction.outcomeAccount !== 'string' || transaction.outcomeAccount.length === 0) {
      return handleException('[TAC] Wrong transaction ' + id + '. Transaction should have incomeAccount and outcomeAccount of string type')
    }
    if (transaction.incomeAccount === transaction.outcomeAccount &&
            transaction.income > 0 && transaction.outcome > 0) {
      return handleException('[TRS] Wrong transaction ' + id + '. Transaction with incomeAccount == outcomeAccount should have income == 0 or outcome == 0')
    }
    if (transaction.incomeAccount !== transaction.outcomeAccount &&
            (transaction.income === 0 || transaction.outcome === 0)) {
      return handleException('[TTS] Wrong transaction ' + id + '. Transfer transaction with incomeAccount != outcomeAccount should have income > 0 and outcome > 0')
    }
    const incAccount = getAccount(transaction.incomeAccount)
    const outAccount = getAccount(transaction.outcomeAccount)
    if (!incAccount) {
      return handleException('[TAC] Wrong transaction ' + id + ". Cann't find incomeAccount " + transaction.incomeAccount)
    }
    if (!outAccount) {
      return handleException('[TAC] Wrong transaction ' + id + ". Cann't find outcomeAccount " + transaction.outcomeAccount)
    }
    if (incAccount.id === undefined &&
            outAccount.id === undefined) {
      return handleException('[TAC] Wrong transaction ' + id + '. Transaction should have at least incomeAccount or outcomeAccount added')
    }
    addedTransactions.push(transaction)
  }

  this.request = (method, url, body, headers, options) => fetchRemoteSync({ method: method.toUpperCase(), url, headers, body, ...options })
  this.requestGet = (url, headers, options) => this.request('GET', url, null, headers, options)
  this.requestPost = (url, body, headers, options) => this.request('POST', url, body, headers, options)

  this.addAccount = addAccount
  this.addTransaction = addTransaction
}

const retrieveCodeRetryIntervalMs = 1000

Object.assign(ZPAPI.prototype, {
  retrieveCode (comment, image, options) {
    console.error('ZenMoney.retrieveCode(...) is deprecated. Use async ZenMoney.readLine(...) instead')
    console.log(`retrieveCode("${comment}") is expecting result inside zp_data.txt`)

    let remainingTime = (options && options.time) || 60000
    while (remainingTime > 0) {
      const { body, status } = getResourceSync('/zen/zp_pipe.txt')
      if (status === 200 && body) {
        return body
      } else {
        console.warn(`retrieveCode error, trying again in ${retrieveCodeRetryIntervalMs}ms`, { status, body })
        sleepSync(retrieveCodeRetryIntervalMs)
        remainingTime -= retrieveCodeRetryIntervalMs
      }
    }
    return null
  },

  readLine (message, options = {}) {
    if (typeof message !== 'string') {
      throw new Error('message must be string')
    }
    return promptAsync(message, options)
  },

  setCookie (domain, name, value, params) {
    return new Promise((resolve, reject) => {
      if (typeof domain !== 'string' || typeof name !== 'string') {
        return reject(new Error('cookie must have domain and name'))
      }
      const correlationId = Date.now()
      const messageHandler = (e) => {
        const message = e.data
        if (message.type !== ':events/cookie-set') {
          return
        }
        if (message.payload.correlationId !== correlationId) {
          return
        }
        self.removeEventListener('message', messageHandler)
        resolve()
      }
      self.addEventListener('message', messageHandler)
      self.postMessage({
        type: ':commands/cookie-set',
        payload: { name, value, options: { domain, ...params }, correlationId }
      })
    })
  },

  WebSocket: WebSocket,

  saveCookies () {
    return new Promise((resolve, reject) => {
      const correlationId = Date.now()
      const messageHandler = (e) => {
        const message = e.data
        if (message.type !== ':events/cookies-saved') {
          return
        }
        if (message.payload.correlationId !== correlationId) {
          return
        }
        self.removeEventListener('message', messageHandler)
        resolve()
      }
      self.addEventListener('message', messageHandler)
      self.postMessage({
        type: ':commands/cookies-save',
        payload: { correlationId, cookies: getCookies() }
      })
    })
  },

  restoreCookies () {
    return new Promise((resolve, reject) => {
      const correlationId = Date.now()
      const messageHandler = (e) => {
        const message = e.data
        if (message.type !== ':events/cookies-restored') {
          return
        }
        if (message.payload.correlationId !== correlationId) {
          return
        }
        self.removeEventListener('message', messageHandler)
        addCookies(message.payload.cookies)
        resolve()
      }
      self.addEventListener('message', messageHandler)
      self.postMessage({
        type: ':commands/cookies-restore',
        payload: { correlationId }
      })
    })
  }
})

export { ZPAPI }
