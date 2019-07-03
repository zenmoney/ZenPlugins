/* global prompt */

import { toDate } from './common/dateUtils'

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

  ':commands/cookie-set': async function ({ payload: { name, value, options, correlationId }, reply }) {
    if (value === undefined || value === null) {
      value = ''
    }
    let cookieStr = name + '=' + value
    for (const propName in options) {
      if (options.hasOwnProperty(propName)) {
        cookieStr += '; ' + propName
        let propValue = options[propName]
        if (propName === 'expires') {
          propValue = toDate(propValue)
        }
      }
    }
    document.cookie = cookieStr
    reply({ type: ':events/cookie-set', payload: { correlationId } })
  }
}

export async function handleMessageFromWorker ({ event, ...rest }) {
  const messageHandler = messageHandlers[event.data.type] || (() => console.warn('message', event.data.type, ' from worker was not handled', { event }))
  await messageHandler({
    payload: event.data.payload,
    reply: (message) => event.currentTarget.postMessage(message),
    ...rest
  })
}
