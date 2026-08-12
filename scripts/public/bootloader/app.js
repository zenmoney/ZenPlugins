(function () {
  'use strict'

  const root = document.getElementById('bootloader-app')
  const developerConsole = window.console
  const mirroredEvents = new Set()
  const state = {
    sessions: [],
    selectedId: null,
    session: null,
    stream: null
  }

  function escapeHtml (value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function json (value, indentation = 2) {
    return JSON.stringify(value, null, indentation)
  }

  function shortId (id) {
    return id ? id.slice(0, 8) : ''
  }

  function formatTime (value) {
    try {
      return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch (error) {
      return value
    }
  }

  function formatDate (value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value || 'Без даты'
    const title = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })
    return title.replace(/^./, character => character.toUpperCase())
  }

  function formatAmount (value, instrument) {
    const amount = Number(value)
    if (!Number.isFinite(amount)) return value === undefined || value === null ? '—' : String(value)
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(amount)}${instrument ? ` ${instrument}` : ''}`
  }

  async function fetchJson (url) {
    const response = await window.fetch(url, { cache: 'no-store' })
    const body = await response.json()
    if (!response.ok) throw new Error(body && body.error && body.error.message ? body.error.message : `HTTP ${response.status}`)
    return body
  }

  function sessionButton (session) {
    return `<button class="session ${session.id === state.selectedId ? 'active' : ''}" data-session="${escapeHtml(session.id)}">
      <span class="session-main"><i class="status ${escapeHtml(session.status)}"></i><b>${escapeHtml(shortId(session.id))}</b><small>${escapeHtml(formatTime(session.createdAt))}</small></span>
      <span class="session-counts">${session.accountsCount} / ${session.transactionsCount}</span>
    </button>`
  }

  function renderDevToolsHint () {
    return '<span class="devtools-state"><i></i> Логи в DevTools · ⌥⌘I / Ctrl+Shift+I</span>'
  }

  function renderShell (content) {
    const session = state.session
    const header = session
      ? `<header class="topbar">
          <div class="page-title"><span class="eyebrow">BOOTLOADER V2</span><h1>${escapeHtml(session.plugin.id)}</h1><span class="session-id">scrape ${escapeHtml(shortId(session.id))}</span></div>
          <div class="topbar-actions">${renderDevToolsHint()}<a class="export-button" href="/api/v2/sessions/${encodeURIComponent(session.id)}/export">Экспорт .log</a></div>
        </header>`
      : `<header class="topbar"><div class="page-title"><span class="eyebrow">BOOTLOADER V2</span><h1>Ожидание scrape</h1></div><div class="topbar-actions">${renderDevToolsHint()}</div></header>`

    root.innerHTML = `<div class="shell">
      <aside class="sidebar">
        <div class="sidebar-header"><span>Scrapes</span><b>${state.sessions.length}</b></div>
        <div class="session-legend"><span>Сессия</span><span>Счета / операции</span></div>
        <div class="sessions">${state.sessions.map(sessionButton).join('') || '<div class="sidebar-empty">Первый scrape появится здесь</div>'}</div>
      </aside>
      <main class="main">${header}<div class="content">${content}</div></main>
    </div>`
    for (const button of document.querySelectorAll('[data-session]')) {
      button.addEventListener('click', () => selectSession(button.dataset.session))
    }
  }

  function sectionHeader (title, count, subtitle) {
    return `<div class="section-header"><div><h2>${escapeHtml(title)}${count === undefined ? '' : ` <span>${count}</span>`}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div></div>`
  }

  function accountInstrument (account) {
    const instrument = account.instrument
    if (typeof instrument === 'string') return instrument
    if (instrument && typeof instrument === 'object') return instrument.symbol || instrument.shortTitle || instrument.title || ''
    return account.currency || ''
  }

  function accountBalance (account) {
    if (account.balance !== undefined) return account.balance
    if (account.currentBalance !== undefined) return account.currentBalance
    return account.amount
  }

  function renderAccounts (session) {
    const rows = session.accounts.map(account => {
      const amount = Number(accountBalance(account))
      const amountClass = Number.isFinite(amount) && amount < 0 ? 'negative' : Number.isFinite(amount) && amount === 0 ? 'zero' : ''
      const title = account.title || account.name || account.id || 'Счёт'
      const subtitle = account.type || accountInstrument(account) || 'Счёт'
      return `<details class="app-row account-row">
        <summary>
          <span class="row-icon account-icon">▤</span>
          <span class="row-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></span>
          <span class="row-value ${amountClass}">${escapeHtml(formatAmount(accountBalance(account), accountInstrument(account)))}</span>
        </summary>
        <pre class="raw">${escapeHtml(json(account))}</pre>
      </details>`
    }).join('')
    return `<section class="panel accounts-panel">${sectionHeader('Карты и счета', session.accounts.length, 'Результат scrape')}${rows || '<div class="section-empty">Плагин пока не добавил счета</div>'}</section>`
  }

  function accountLookup (session) {
    const result = new Map()
    for (const account of session.accounts) result.set(String(account.id), account)
    return result
  }

  function transactionView (transaction, accounts) {
    const movement = Array.isArray(transaction.movements) ? transaction.movements[0] : null
    const movementAccount = movement && movement.account ? movement.account : null
    const accountId = movementAccount && typeof movementAccount === 'object'
      ? movementAccount.id
      : movementAccount || transaction.outcomeAccount || transaction.incomeAccount
    const account = accounts.get(String(accountId)) || {}
    let amount
    if (movement && movement.sum !== undefined) amount = movement.sum
    else if (Number(transaction.income)) amount = Number(transaction.income)
    else if (transaction.outcome !== undefined) amount = -Math.abs(Number(transaction.outcome))
    const instrument = movement && movement.invoice && movement.invoice.instrument
      ? movement.invoice.instrument.symbol || movement.invoice.instrument
      : transaction.incomeInstrument || transaction.outcomeInstrument || accountInstrument(account)
    const merchant = transaction.merchant && (transaction.merchant.fullTitle || transaction.merchant.title)
    return {
      title: transaction.payee || merchant || transaction.category || transaction.comment || 'Без категории',
      subtitle: account.title || account.name || accountId || transaction.comment || 'Операция',
      details: transaction.comment && transaction.comment !== transaction.payee ? transaction.comment : transaction.id,
      date: transaction.date || transaction.created || transaction.timestamp,
      amount,
      instrument: typeof instrument === 'object' ? instrument.symbol || instrument.title : instrument
    }
  }

  function renderTransactions (session) {
    const accounts = accountLookup(session)
    const groups = new Map()
    for (const transaction of session.transactions) {
      const view = transactionView(transaction, accounts)
      const group = formatDate(view.date)
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group).push({ transaction, view })
    }
    const rows = Array.from(groups.entries()).map(([date, items]) => `<div class="transaction-group">
      <h3>${escapeHtml(date)}</h3>
      ${items.map(({ transaction, view }) => {
        const number = Number(view.amount)
        const amountClass = Number.isFinite(number) && number > 0 ? 'positive' : ''
        const sign = Number.isFinite(number) && number > 0 ? '+' : ''
        return `<details class="app-row transaction-row"><summary>
          <span class="row-icon transaction-icon">◇</span>
          <span class="row-copy"><strong>${escapeHtml(view.title)}</strong><small>${escapeHtml(view.subtitle)}</small>${view.details ? `<small>${escapeHtml(view.details)}</small>` : ''}</span>
          <span class="row-value ${amountClass}">${escapeHtml(sign + formatAmount(view.amount, view.instrument))}</span>
        </summary><pre class="raw">${escapeHtml(json(transaction))}</pre></details>`
      }).join('')}
    </div>`).join('')
    return `<section class="panel transactions-panel">${sectionHeader('Операции', session.transactions.length, 'Сгруппированы по дате')}${rows || '<div class="section-empty">Плагин пока не добавил операции</div>'}</section>`
  }

  function comparable (value) {
    return json(value, 0)
  }

  function diffRows (before, after) {
    const left = before || {}
    const right = after || {}
    const keys = Array.from(new Set(Object.keys(left).concat(Object.keys(right)))).sort()
    if (keys.length === 0) return '<div class="diff-empty">Нет данных</div>'
    return keys.map(key => {
      const hasLeft = Object.prototype.hasOwnProperty.call(left, key)
      const hasRight = Object.prototype.hasOwnProperty.call(right, key)
      const oldValue = comparable(left[key])
      const newValue = comparable(right[key])
      if (hasLeft && hasRight && oldValue === newValue) return `<div class="diff-line context"><i> </i><code>${escapeHtml(key)}: ${escapeHtml(oldValue)}</code></div>`
      const removed = hasLeft ? `<div class="diff-line removed"><i>−</i><code>${escapeHtml(key)}: ${escapeHtml(oldValue)}</code></div>` : ''
      const added = hasRight ? `<div class="diff-line added"><i>+</i><code>${escapeHtml(key)}: ${escapeHtml(newValue)}</code></div>` : ''
      return removed + added
    }).join('')
  }

  function renderState (session) {
    const saved = session.state.saved
    return `<section class="panel state-panel">${sectionHeader('State', session.state.changes.length, 'Изменения getData / setData')}
      <div class="diff"><div class="diff-header"><span>initial</span><span>→</span><span>current</span></div>${diffRows(session.state.initial, session.state.current)}</div>
      ${saved === null ? '' : `<div class="saved-title">Сохранённый state</div><div class="diff"><div class="diff-header"><span>current</span><span>→</span><span>saved</span></div>${diffRows(session.state.current, saved)}</div>`}
    </section>`
  }

  function renderCheckpoints (session) {
    const comparisons = session.checkpointComparisons || {}
    const names = Object.keys(session.checkpoints)
    const cards = names.map(name => {
      const comparison = comparisons[name] || { current: session.checkpoints[name].value, previous: null }
      return `<article class="checkpoint"><div class="checkpoint-title"><strong>${escapeHtml(name)}</strong><small>${comparison.previousSessionId ? `vs ${escapeHtml(shortId(comparison.previousSessionId))}` : 'первая версия'}</small></div>
        <div class="checkpoint-grid"><div><span>Предыдущая</span><pre>${escapeHtml(json(comparison.previous))}</pre></div><div><span>Текущая</span><pre>${escapeHtml(json(comparison.current))}</pre></div></div>
      </article>`
    }).join('')
    return `<section class="panel checkpoints-panel">${sectionHeader('Checkpoints', names.length, 'Сравнение объектов между scrape')}${cards || '<div class="section-empty">Вызовите Debug.checkpoint(name, value)</div>'}</section>`
  }

  function render () {
    if (!state.session) {
      renderShell('<div class="welcome"><span>●</span><h2>Bootloader готов</h2><p>Запустите scrape в приложении Zenmoney. Новая сессия появится автоматически.</p></div>')
      return
    }
    renderShell(`<div class="dashboard">${renderAccounts(state.session)}${renderTransactions(state.session)}${renderState(state.session)}${renderCheckpoints(state.session)}</div>`)
  }

  function mirrorEvent (sessionId, event) {
    const key = `${sessionId}:${event.sequence}`
    if (mirroredEvents.has(key)) return
    mirroredEvents.add(key)
    if (event.type === 'console') {
      const payload = event.payload || {}
      const method = typeof developerConsole[payload.level] === 'function' ? payload.level : 'log'
      developerConsole[method](`[bootloader:${shortId(sessionId)}]`, ...(payload.args || []))
    } else if (event.type === 'error') {
      developerConsole.error(`[bootloader:${shortId(sessionId)}]`, event.payload)
    }
  }

  function mirrorSessionEvents (session) {
    for (const event of session.events) mirrorEvent(session.id, event)
  }

  function openStream (id) {
    if (state.stream) state.stream.close()
    const stream = new window.EventSource(`/api/v2/sessions/${encodeURIComponent(id)}/stream`)
    stream.onmessage = event => {
      if (state.selectedId !== id || !state.session) return
      const item = JSON.parse(event.data)
      if (!state.session.events.some(existing => existing.sequence === item.sequence)) state.session.events.push(item)
      mirrorEvent(id, item)
      scheduleSessionRefresh()
    }
    state.stream = stream
  }

  let refreshTimer = null
  function scheduleSessionRefresh () {
    if (refreshTimer) return
    refreshTimer = setTimeout(async () => {
      refreshTimer = null
      await refreshSelected(true)
    }, 250)
  }

  async function refreshSelected (shouldRender = true) {
    const id = state.selectedId
    if (!id) return
    const session = await fetchJson(`/api/v2/sessions/${encodeURIComponent(id)}`)
    if (state.selectedId !== id) return
    const changed = json(session) !== json(state.session)
    state.session = session
    mirrorSessionEvents(session)
    if (shouldRender && changed) render()
  }

  async function selectSession (id) {
    state.selectedId = id
    await refreshSelected()
    openStream(id)
  }

  async function refreshSessions () {
    try {
      const sessions = await fetchJson('/api/v2/sessions')
      const changed = json(sessions) !== json(state.sessions)
      state.sessions = sessions
      if (!state.selectedId && sessions.length > 0) await selectSession(sessions[0].id)
      else if (changed) render()
    } catch (error) {
      developerConsole.error(error)
      root.innerHTML = `<div class="fatal">${escapeHtml(error.message)}</div>`
    }
  }

  render()
  refreshSessions()
  setInterval(refreshSessions, 1000)
  setInterval(() => refreshSelected(true).catch(() => {}), 2000)
})()
