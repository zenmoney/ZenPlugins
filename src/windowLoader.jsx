/* global prompt, Worker */

import _ from 'lodash'
// eslint-disable-next-line no-unused-vars
import React from 'react'
import ReactDOM from 'react-dom'
import { fetchJson } from './common/network'
import { handleMessageFromWorker } from './handleMessageFromWorker'
import { UI } from './UI'
import { isFlagPresent, waitForOpenDevtools } from './utils'

const pickSuccessfulBody = async (fetchPromise) => {
  const response = await fetchPromise
  if (!response.ok) {
    throw response.body
  }
  return response.body
}

const rootElement = document.getElementById('root')

let state = {
  workflowState: ':workflow-state/none',
  waitingForDevtools: null,
  onManualStartPress: null,
  scrapeState: ':scrape-state/none',
  scrapeResult: null,
  scrapeError: null,
  persistPluginDataState: ':persist-plugin-data-state/none',
  persistPluginDataError: null,
  onPersistPluginDataConfirm: null
}

const updateUI = (Ui) => {
  ReactDOM.render(<Ui {...state} />, rootElement)
}
const setState = (transform) => {
  state = transform(state)
  return updateUI(UI)
}

if (module.hot) {
  module.hot.accept('./UI', () => {
    console.log('./UI hot reloaded')
    updateUI(require('./UI').UI)
  })
}

window.dev = {
  get state () {
    return state
  }
}

function fulfillPreferences (rawPreferences, preferencesSchema) {
  const missingObligatoryPreferenceItems = preferencesSchema
    .filter((x) => x.obligatory && !Object.prototype.hasOwnProperty.call(rawPreferences, x.key))
  const fulfilledPreferences = missingObligatoryPreferenceItems.reduce((extension, { key, defaultValue }) => {
    const value = prompt(`Let's fill preferences\n(located inside PLUGIN_PATH/zp_preferences.json)\n${key}:`, defaultValue)
    if (value === null) {
      throw new Error(`preferences.${key} must be provided`)
    }
    extension[key] = value
    return extension
  }, {})
  return { ...rawPreferences, ...fulfilledPreferences }
}

function clearCookies () {
  for (const cookie of document.cookie.split('; ')) {
    const d = window.location.hostname.split('.')
    while (d.length > 0) {
      const cookieBase = encodeURIComponent(cookie
        .split(';')[0]
        .split('=')[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + '; path='
      const p = window.location.pathname.split('/')
      document.cookie = cookieBase + '/'
      while (p.length > 0) {
        document.cookie = cookieBase + p.join('/')
        p.pop()
      }
      d.shift()
    }
  }
}

async function init () {
  const canStartScrape = Promise.race([
    waitForOpenDevtools(),
    new Promise((resolve) => setState((state) => ({
      ...state,
      waitingForDevtools: true,
      onManualStartPress: resolve
    })))
  ])
  canStartScrape.then(() => setState((state) => ({
    ...state,
    waitingForDevtools: false,
    onManualStartPress: null
  })))

  try {
    clearCookies()
    const worker = new Worker('./workerLoader.js')

    window.__worker__ = worker // prevents worker GC - allows setting breakpoints after worker ends execution

    setState((state) => ({ ...state, workflowState: ':workflow-state/loading-assets' }))
    const [rawPreferences, preferencesSchema, manifest, data] = await Promise.all([
      pickSuccessfulBody(fetchJson('/zen/zp_preferences.json', { log: false })),
      pickSuccessfulBody(fetchJson('/zen/zp_preferences.json/schema', { log: false })),
      pickSuccessfulBody(fetchJson('/zen/manifest', { log: false })),
      pickSuccessfulBody(fetchJson('/zen/zp_data.json', { log: false }))
    ])
    document.title = `[${manifest.id}] ${document.title}`

    setState((state) => ({ ...state, workflowState: ':workflow-state/filling-preferences' }))
    await new Promise((resolve) => setTimeout(resolve, 1))

    const preferences = fulfillPreferences(rawPreferences, preferencesSchema)
    if (!_.isEqual(preferences, rawPreferences)) {
      await fetchJson('/zen/zp_preferences.json', { method: 'POST', body: preferences })
    }
    setState((state) => ({ ...state, workflowState: ':workflow-state/waiting' }))
    await canStartScrape
    setState((state) => ({ ...state, workflowState: ':workflow-state/scraping', scrapeState: ':scrape-state/starting' }))

    const scrapeResult = await new Promise((resolve, reject) => {
      worker.addEventListener('message', (event) => handleMessageFromWorker({
        event,
        onSyncStarted: () => setState((state) => ({ ...state, scrapeState: ':scrape-state/started' })),
        onSyncSuccess: resolve,
        onSyncError: reject
      }))
      worker.postMessage({
        type: ':commands/execute-sync',
        payload: { manifest, preferences, data }
      })
    })
    setState((state) => ({ ...state, scrapeState: ':scrape-state/success', scrapeResult }))

    const { save } = isFlagPresent('no-prompt')
      ? { save: true }
      : await new Promise((resolve) => setState((state) => ({
        ...state,
        persistPluginDataState: ':persist-plugin-data-state/confirm',
        onPersistPluginDataConfirm: resolve
      })))
    if (save) {
      setState((state) => ({ ...state, persistPluginDataState: ':persist-plugin-data-state/saving' }))
      try {
        await fetchJson('/zen/zp_data.json', { method: 'POST', body: scrapeResult.pluginDataChange, log: false })
        setState((state) => ({ ...state, persistPluginDataState: ':persist-plugin-data-state/saved' }))
      } catch (error) {
        setState((state) => ({ ...state, persistPluginDataState: ':persist-plugin-data-state/save-error', persistPluginDataError: error }))
      }
    } else {
      setState((state) => ({ ...state, persistPluginDataState: ':persist-plugin-data-state/dismiss' }))
    }
  } catch (error) {
    setState((state) => ({
      ...state,
      workflowState: ':workflow-state/none',
      scrapeState: ':scrape-state/error',
      scrapeError: error
    }))
    throw error
  }

  setState((state) => ({ ...state, workflowState: ':workflow-state/complete' }))
}

init()
