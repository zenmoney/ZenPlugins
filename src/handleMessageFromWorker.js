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
    reply({ type: ':events/cookie-set', payload: { correlationId } })
  },

  ':commands/cookies-save': async function ({ payload: { correlationId, cookies }, reply }) {
    const response = await fetchJson('/zen/zp_cookies.json', {
      log: false,
      method: 'POST',
      body: cookies
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
    reply({ type: ':events/cookies-restored', payload: { correlationId, cookies } })
  }
}

function setCookie (cookie) {
  let cookieStr = cookie.name + '=' + (cookie.value === undefined || cookie.value === null ? '' : cookie.value)
  if (cookie.path) {
    cookieStr += '; Path=' + cookie.path
  }
  if (cookie.expires) {
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
