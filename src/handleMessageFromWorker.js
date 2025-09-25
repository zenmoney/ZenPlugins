/* global prompt */

import { toDate } from './common/dateUtils'
import { fetchJson } from './common/network'

const messageHandlers = {
  ':events/scrape-started': async function ({ onSyncStarted }) {
    onSyncStarted()
  },

  ':events/scrape-success': async function ({ payload: { addedAccounts, addedTransactions, pluginDataChange }, onSyncSuccess }) {
    onSyncSuccess({ accounts: addedAccounts, transactions: addedTransactions, pluginDataChange })
  },

  ':events/scrape-error': async function ({ payload, onSyncError }) {
    onSyncError(payload)
  },

  ':commands/prompt-user-input': async function ({ payload: { message, options, correlationId }, reply }) {
    const result = prompt(message)
    reply({ type: ':events/received-user-input', payload: { result, correlationId } })
  },

  ':commands/cookie-set': async function ({ payload: { cookie, correlationId }, reply }) {
    setCookie(cookie)
    const response = await fetchJson('/zen/cookies', {
      log: false,
      method: 'POST',
      body: [cookie]
    })
    console.assert(response.status === 200)
    reply({ type: ':events/cookie-set', payload: { correlationId } })
  },

  ':commands/cookies-get': async function ({ payload: { correlationId }, reply }) {
    const response = await fetchJson('/zen/cookies', {
      log: false,
      method: 'GET'
    })
    console.assert(response.status === 200)
    reply({ type: ':events/cookies-get', payload: { correlationId, cookies: response.body } })
  },

  ':commands/cookies-save': async function ({ payload: { correlationId }, reply }) {
    const response = await fetchJson('/zen/zp_cookies.json', {
      log: false,
      method: 'POST'
    })
    console.assert(response.status === 200)
    reply({ type: ':events/cookies-saved', payload: { correlationId } })
  },

  ':commands/cookies-restore': async function ({ payload: { correlationId }, reply }) {
    const response = await fetchJson('/zen/zp_cookies.json', {
      log: false,
      method: 'GET'
    })
    console.assert(response.status === 200)
    const cookies = Array.isArray(response.body) ? response.body : []
    for (const cookie of cookies) {
      setCookie(cookie)
    }
    reply({ type: ':events/cookies-restored', payload: { correlationId } })
  },

  ':commands/file-select': async function ({ payload: { correlationId, contentTypes, allowMultipleSelection }, reply }) {
    const root = document.getElementById('root')
    const input = document.createElement('input')
    input.type = 'file'
    input.name = 'file'
    input.multiple = allowMultipleSelection || false
    if (contentTypes && contentTypes.length > 0) {
      input.accept = contentTypes.join(',')
    }
    input.onchange = () => {
      root.removeChild(input)
      const files = Array.from(input.files)
      reply({ type: ':events/file-selected', payload: { correlationId, files } })
    }
    input.style.position = 'absolute'
    input.style.top = '20px'
    root.appendChild(input)
  },

  ':commands/alert': async function ({ payload: { correlationId, message }, reply }) {
    // eslint-disable-next-line no-undef
    alert(message)
    reply({ type: ':events/alert-closed', payload: { correlationId } })
  },

  ':commands/parse-pdf': async function ({ payload: { correlationId, arrayBuffer }, reply }) {
    let result = null
    let error = null
    try {
      const { parsePdf } = require('./common/pdfUtils')
      result = await parsePdf({ arrayBuffer: () => Promise.resolve(arrayBuffer) })
    } catch (err) {
      error = err
    }
    reply({ type: ':events/pdf-parsed', payload: { correlationId, result, error } })
  }
}

function setCookie (cookie) {
  let cookieStr = cookie.name + '=' + (cookie.value === undefined || cookie.value === null ? '' : cookie.value)
  if (cookie.path) {
    cookieStr += '; Path=' + cookie.path
  }
  if (cookie.value === undefined || cookie.value === null) {
    cookieStr += '; Expires=Thu, 01-Jan-1970 00:00:01 GMT'
  } else if (cookie.expires) {
    cookieStr += '; Expires=' + toDate(cookie.expires).toUTCString()
  }
  document.cookie = cookieStr
}

export async function handleMessageFromWorker ({ event, ...rest }) {
  const messageHandler = messageHandlers[event.data.type] || (() => console.warn('message', event.data.type, ' from worker was not handled', { event }))
  await messageHandler({
    payload: event.data.payload,
    reply: (message) => event.currentTarget.postMessage(message),
    ...rest
  })
}
